import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

const ProfileAnalysisSchema = z.object({
  profileAnalysis: z.object({
    tone: z.string(),
    niche: z.array(z.string()),
    writingStyle: z.string(),
    audienceType: z.string()
  }),
  ideas: z.array(z.object({
    id: z.string(),
    title: z.string(),
    hook: z.string(),
    platform: z.string()
  }))
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Profile URL is required" });

    const prompt = `Analyze this profile URL: ${url}. 
    Infer the context, tone, niche, writing style, and target audience based on the handle or platform structure.
    Generate 4 viral post ideas tailored to this inferred profile.
    
    Format exactly as JSON matching:
    {
      "profileAnalysis": {
        "tone": "string",
        "niche": ["string"],
        "writingStyle": "string",
        "audienceType": "string"
      },
      "ideas": [
        { "id": "string", "title": "string", "hook": "string", "platform": "LinkedIn or Twitter" }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const rawText = response.text || "{}";
    const cleanedText = rawText.replace(/```(?:json)?\n?/gi, '').replace(/\n?```/g, '').trim();
    const json = JSON.parse(cleanedText);
    const validated = ProfileAnalysisSchema.parse(json);
    
    res.status(200).json(validated);
  } catch (error) {
    console.error("[Vercel API] analyze-profile error:", error);
    res.status(500).json({ error: "Failed to analyze profile" });
  }
}
