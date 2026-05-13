import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

const API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface PostIdea {
  id: string;
  title: string;
  platform: 'LinkedIn' | 'X' | 'Reddit' | 'Substack';
  engagement: string;
  hook: string;
  content: string;
  category: string;
}

export interface CreatorProfile {
  name: string;
  handle: string;
  hookStrength: number;
  engagementRate: number;
  tone: string;
}

// --- NEW ZOD SCHEMA & GENERATION PIPELINE --- //

export const PostGenerationSchema = z.object({
  post: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  platformSuggestions: z.object({
    instagram: z.string(),
    linkedin: z.string(),
    twitter: z.string()
  })
});

export type GeneratedPostResponse = z.infer<typeof PostGenerationSchema>;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

export async function generatePost(
  context: string,
  tone: string,
  platform: string
): Promise<GeneratedPostResponse> {
  const prompt = `
You are an expert social media copywriter.
Write a highly engaging social media post based on the following draft/context:
"${context}"

Tone instructions: ${tone}
Target Primary Platform: ${platform}

Format your response exactly as JSON matching this schema:
{
  "post": "The main post content, formatted with line breaks, hooks, and strong structure.",
  "caption": "A shorter, punchy caption summarizing the post.",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "platformSuggestions": {
    "instagram": "How to adapt this for Instagram (visual ideas, caption style).",
    "linkedin": "How to adapt this for LinkedIn (professional angle, carousel ideas).",
    "twitter": "How to adapt this for Twitter/X (thread breakdown, hook style)."
  }
}
  `;

  let attempt = 0;
  const maxRetries = 3;
  // Fallback AI provider strategy using different Gemini models
  const models = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

  while (attempt < maxRetries) {
    const model = models[attempt % models.length];
    try {
      console.log(`[AI Generation] Attempt ${attempt + 1}/${maxRetries} using model: ${model}`);
      
      const generationPromise = ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });

      // 15-second timeout per attempt to handle hanging API calls
      const response = await fetchWithTimeout(generationPromise, 15000);
      
      const rawText = response.text;
      if (!rawText) throw new Error("Empty response text from model.");
      
      const json = JSON.parse(rawText);
      
      // Strict Schema Validation using Zod
      const validatedData = PostGenerationSchema.parse(json);
      
      console.log(`[AI Generation] Success on attempt ${attempt + 1}!`);
      return validatedData;

    } catch (error) {
      console.error(`[AI Generation] Attempt ${attempt + 1} failed:`, error);
      attempt++;
      if (attempt >= maxRetries) {
        console.error("[AI Generation] All retries exhausted. Throwing error.");
        throw new Error("Failed to generate post after multiple attempts. Please check your API quota or check Vercel Logs for environment variables.");
      }
      // Exponential backoff
      await wait(Math.pow(2, attempt) * 1000);
    }
  }

  throw new Error("Unexpected error in generation loop");
}

// --- EXISTING METHODS (Modified to use gemini-1.5-flash) --- //

export async function analyzeProfile(url: string): Promise<{ profile: CreatorProfile; ideas: PostIdea[] }> {
  await new Promise(resolve => setTimeout(resolve, 3000));

  const prompt = `Analyze this profile URL: ${url}. 
  Ignore if it's not a real LinkedIn or X URL, and generate a creative persona based on it.
  Then generate 6 post ideas for social media (LinkedIn, X, Reddit).
  
  Return a JSON object with this structure:
  {
    "profile": { "name": "string", "handle": "string", "hookStrength": number (0-100), "engagementRate": number (0-10), "tone": "string" },
    "ideas": [
      { "id": "1", "title": "string", "platform": "LinkedIn" | "X" | "Reddit", "engagement": "string (e.g. 98%)", "hook": "string", "content": "string", "category": "string" }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Updated to stable model
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const json = JSON.parse(response.text || "{}");
    return json;
  } catch (error) {
    console.error("Gemini analysis failed, using fallback mock data", error);
    return {
      profile: {
        name: "Creator X",
        handle: "@creatorx",
        hookStrength: 85,
        engagementRate: 4.2,
        tone: "Insightful, Tech-forward, Direct"
      },
      ideas: [
        { id: '1', title: "The Future of AI Agents", platform: 'LinkedIn', engagement: '94%', hook: "Most people think AI is a tool. I think it's a teammate.", content: "Full LinkedIn post content about AI agents...", category: "Tech Trends" },
        { id: '2', title: "Why Minimalism Wins", platform: 'X', engagement: '88%', hook: "Your productivity app isn't the problem. Your processes are.", content: "X thread content about minimalism...", category: "Productivity" },
        { id: '3', title: "Bootstrapping to $10k MRR", platform: 'Reddit', engagement: '91%', hook: "I spent $0 on marketing to hit $10k MRR. Here's exactly how.", content: "Detailed Reddit post for r/entrepreneur...", category: "Startup" },
        { id: '4', title: "The Hidden Cost of Scaling", platform: 'LinkedIn', engagement: '82%', hook: "Scaling too early is a death sentence for startups. Here's why.", content: "Analysis of scaling traps...", category: "Business" },
        { id: '5', title: "Personal Branding is Dead?", platform: 'X', engagement: '96%', hook: "Authenticity > Personal Branding. Stop building a 'brand' and start being real.", content: "Thread on authenticity...", category: "Growth" },
        { id: '6', title: "Coding with Gemini", platform: 'LinkedIn', engagement: '90%', hook: "I let AI write my last feature. It saved me 4 hours.", content: "Story about AI dev workflows...", category: "Design" }
      ]
    };
  }
}

export async function generateAlternativeHooks(idea: PostIdea): Promise<string[]> {
  const prompt = `Generate 3 alternative catchy opening hooks for this social media post:
  Title: ${idea.title}
  Current Hook: ${idea.hook}
  Platform: ${idea.platform}
  
  Return a JSON array of 3 strings.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Updated to stable model
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const json = JSON.parse(response.text || "[]");
    return json;
  } catch (error) {
    return [
      "Here is a hook that grabs attention immediately.",
      "Most creators are doing this wrong. Here is the right way.",
      "The secret to tech productivity isn't what you think."
    ];
  }
}
