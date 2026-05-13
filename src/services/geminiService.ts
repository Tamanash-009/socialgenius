import { GoogleGenAI, Type } from "@google/genai";

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

export async function analyzeProfile(url: string): Promise<{ profile: CreatorProfile; ideas: PostIdea[] }> {
  // Simulate delay for analysis
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
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            profile: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                handle: { type: Type.STRING },
                hookStrength: { type: Type.NUMBER },
                engagementRate: { type: Type.NUMBER },
                tone: { type: Type.STRING }
              },
              required: ["name", "handle", "hookStrength", "engagementRate", "tone"]
            },
            ideas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  platform: { type: Type.STRING },
                  engagement: { type: Type.STRING },
                  hook: { type: Type.STRING },
                  content: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["id", "title", "platform", "engagement", "hook", "content", "category"]
              }
            }
          },
          required: ["profile", "ideas"]
        }
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
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
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
