import { NextResponse } from 'next/server';
import { getConfigValue } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, messages, systemPrompt, model } = body;

    // Load keys dynamically (supports process.env and database settings fallback)
    const openrouterKey = await getConfigValue('OPENROUTER_API_KEY');
    const geminiKey = await getConfigValue('GEMINI_API_KEY');
    
    // Choose active provider based on availability
    if (openrouterKey) {
      // Default to Google Gemini 2.5 Flash Free if no model is provided
      const selectedModel = model || 'google/gemini-2.5-flash:free';
      
      const payload: any = {
        model: selectedModel,
        messages: [],
      };

      if (systemPrompt) {
        payload.messages.push({ role: 'system', content: systemPrompt });
      }

      if (messages && messages.length > 0) {
        payload.messages.push(...messages);
      } else if (prompt) {
        payload.messages.push({ role: 'user', content: prompt });
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/mujthabamk/jobHunter', // Optional Referer
          'X-Title': 'JobHunter AI',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return NextResponse.json({ success: true, content });
    } 
    
    if (geminiKey) {
      // Use direct Gemini API (Gemini 2.5 Flash has a very large free tier)
      // Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
      const selectedModel = model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`;

      const contentsList: any[] = [];
      
      if (systemPrompt) {
        // Direct Gemini 1.5/2.5 system instruction can be passed in config
      }

      if (messages && messages.length > 0) {
        // Map messages roles: system instruction or user/model turns
        messages.forEach((msg: any) => {
          contentsList.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        });
      } else if (prompt) {
        contentsList.push({
          role: 'user',
          parts: [{ text: prompt }]
        });
      }

      const payload: any = {
        contents: contentsList,
      };

      if (systemPrompt) {
        payload.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return NextResponse.json({ success: true, content });
    }

    // Default Fallback: Local Ollama (assumes user is running Ollama on their Mac)
    try {
      const selectedModel = model || 'llama3.2'; // default local light model
      
      const payload: any = {
        model: selectedModel,
        messages: [],
        stream: false,
      };

      if (systemPrompt) {
        payload.messages.push({ role: 'system', content: systemPrompt });
      }

      if (messages && messages.length > 0) {
        payload.messages.push(...messages);
      } else if (prompt) {
        payload.messages.push({ role: 'user', content: prompt });
      }

      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Ollama local API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.message?.content || '';
      return NextResponse.json({ success: true, content });
    } catch (ollamaError: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No active AI key found (OpenRouter/Gemini), and fallback local Ollama connection failed. Run Ollama locally or enter keys in settings/env.' 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
