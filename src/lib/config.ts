import { prisma } from './db';

export async function getConfigValue(key: string): Promise<string> {
  // 1. Check process.env first
  if (process.env[key]) {
    return process.env[key] as string;
  }

  // 2. Fallback to settings in SQLite
  try {
    const setting = await prisma.settings.findUnique({
      where: { key },
    });
    if (setting && setting.value) {
      // Hydrate process.env for subsequent calls
      process.env[key] = setting.value;
      return setting.value;
    }
  } catch (err) {
    console.error(`Error loading database configuration for ${key}:`, err);
  }

  return '';
}
