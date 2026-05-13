import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

const GeneratedPostSchema = z.object({
  generatedPost: z.object({
    main: z.string(),
    hashtags: z.array(z.string()),
    platformVariants: z.object({
      linkedin: z.object({ content: z.string(), formatting: z.string() }),
      twitter: z.object({ content: z.string(), formatting: z.string() }),
      reddit: z.object({ content: z.string(), formatting: z.string() }),
      substack: z.object({ content: z.string(), formatting: z.string() })
    })
  })
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { context, profileAnalysis } = req.body;
    if (!context || !profileAnalysis) return res.status(400).json({ error: "Context and profile analysis required" });

    const prompt = `You are a world-class social media copywriter.
    Draft a highly engaging post based on this context: "${context}"
    
    Author Profile:
    - Tone: ${profileAnalysis.tone}
    - Niche: ${profileAnalysis.niche?.join(', ')}
    - Style: ${profileAnalysis.writingStyle}
    - Audience: ${profileAnalysis.audienceType}
    
    Return a JSON object containing the main draft, hashtags, and 4 specific platform variants.
    Ensure LinkedIn is professional, Twitter is punchy, Reddit is authentic, and Substack is long-form.
    
    Format exactly as JSON matching:
    {
      "generatedPost": {
        "main": "string",
        "hashtags": ["string"],
        "platformVariants": {
          "linkedin": { "content": "string", "formatting": "string" },
          "twitter": { "content": "string", "formatting": "string" },
          "reddit": { "content": "string", "formatting": "string" },
          "substack": { "content": "string", "formatting": "string" }
        }
      }
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const rawText = response.text || "{}";
    const cleanedText = rawText.replace(/```(?:json)?\n?/gi, '').replace(/\n?```/g, '').trim();
    const json = JSON.parse(cleanedText);
    const validated = GeneratedPostSchema.parse(json);
    
    res.status(200).json(validated);
  } catch (error) {
    console.error("[Vercel API] generate-post error:", error);
    res.status(500).json({ error: "Failed to generate post variants" });
  }
}
