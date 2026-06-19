# JobHunter AI: System Prompts & AI Agent Instructions

This document lists the structure and instructions used by the AI agent for each section of the project. These prompts are stored in `src/lib/aiInstructions.ts` and can be adjusted here or inside the code.

---

## 1. Job Scoring & Fit Evaluation (Find Jobs Tab)
*   **Purpose:** Evaluate scraped Greenhouse and Lever listings against the candidate profile to check compatibility.
*   **Structure Instruction:**
    *   Compare candidate's skills and experience against the requirements of the job description.
    *   Look for core ML/AI concepts (e.g., PyTorch, Python, LLMs, NLP) and ensure it is an entry-level/intern role.
    *   Assign a letter grade:
        *   **A:** Perfect match. The candidate meets all key requirements.
        *   **B:** Good match. Lacks 1-2 minor tools, but has the foundation.
        *   **C:** Stretch match. Candidate can apply but is missing key concepts.
        *   **F:** Mismatch. Either the role is senior (>3 years experience) or lacks any AI/ML relevance.
    *   Provide a 1-2 sentence concise explanation.
    *   **Output Format:** Strict JSON.
        ```json
        {
          "score": "A" | "B" | "C" | "F",
          "reason": "..."
        }
        ```

---

## 2. Email Sync Classification (Applications Sync Tab)
*   **Purpose:** Check if incoming inbox messages match target companies and classify responses.
*   **Structure Instruction:**
    *   Analyze the subject and body of emails received from company domains.
    *   Determine if they are responding to an application.
    *   Classify into three categories:
        *   **INTERVIEW:** Invitation to a chat, screen, or loop.
        *   **REJECTION:** Standard or personalized rejection letter.
        *   **OTHER:** Confirmation of receipt, newsletter, or unrelated thread.
    *   Compile a short summary details field (e.g., "Schedule 30 mins via Calendly link").
    *   **Output Format:** Strict JSON.
        ```json
        {
          "type": "INTERVIEW" | "REJECTION" | "OTHER",
          "details": "..."
        }
        ```

---

## 3. Resume & Cover Letter Customization (Customizer Tab)
*   **Purpose:** Generate tailored CV modifications and draft a targeted cover letter.
*   **Structure Instruction:**
    *   Review the job title, company, and job details.
    *   Align the candidate's base experience and skills with the job's main responsibilities.
    *   Draft a highly compelling, professional Cover Letter (3-4 paragraphs, formal tone, no placeholder text).
    *   Provide CV suggestions (specifically which bullet points to rewrite or which keywords to add for ATS optimization).
    *   **Output Format:** Strict JSON.
        ```json
        {
          "coverLetter": "...",
          "resumeSuggestions": "..."
        }
        ```

---

## 4. GitHub Portfolio Review (GitHub Projects Tab)
*   **Purpose:** Analyze current projects, identify tool gaps, and suggest milestones for a new portfolio project.
*   **Structure Instruction:**
    *   Scan list of public repositories.
    *   Provide an overview of the languages and tech stack currently demonstrated.
    *   Identify ML/AI skill gaps (e.g., "No vector database integration shown").
    *   List specific README or code improvements for existing repositories.
    *   Design a new, advanced portfolio project to showcase missing skills. Include:
        *   Project name & description.
        *   Difficulty rating (Intermediate / Advanced).
        *   Tech stack to use.
        *   Step-by-step milestones.
    *   **Output Format:** Strict JSON.
        ```json
        {
          "techStackOverview": "...",
          "skillGaps": "...",
          "repoImprovements": "...",
          "recommendedProject": {
            "name": "...",
            "description": "...",
            "difficulty": "...",
            "stack": "...",
            "milestones": ["Step 1...", "Step 2..."]
          }
        }
        ```

---

## 5. Interview Prep & Mock Questions (Calendar Tab)
*   **Purpose:** Generate round-specific study guides, mock questions, and post-interview response feedback.
*   **Structure Instruction:**
    *   **Pre-Interview Prep:** 
        *   Analyze the interview round (e.g. Technical Screen, System Design) and job details.
        *   Provide a 3-topic Study Plan (what to study).
        *   Draft a Cheat Sheet of key concepts, architectures, or metrics.
        *   Provide 5 custom technical questions and 3 behavioral questions.
        *   **Output Format:** Structured Markdown.
    *   **Post-Interview Feedback:**
        *   Read candidate notes/transcript.
        *   Highlight strengths, identify mistakes, and provide exact answers to questions they struggled with.
        *   **Output Format:** Markdown.

---

## 6. Recruiter Outreach Note Generator (LinkedIn Tab)
*   **Purpose:** Write a natural, non-generic LinkedIn connection invitation.
*   **Structure Instruction:**
    *   Write a short, engaging connection note (max 300 characters, no placeholders).
    *   Mention the candidate's core AI skills and express interest in internship opportunities.
    *   Ensure the tone is warm, polite, and sounds like a human rather than a bot.
    *   **Output Format:** Text.

---

## 7. Career Planning & Milestone Advisor (Roadmaps Tab)
*   **Purpose:** Outline a 3-stage roadmap from intern to senior AI developer.
*   **Structure Instruction:**
    *   Stage 1: Intern/Entry Level (current target).
    *   Stage 2: Mid-Level Developer.
    *   Stage 3: Senior Architect.
    *   Provide timeframes, learning topics, and milestones for each.
    *   **Output Format:** Markdown.
