import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";

import fs from "fs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

const API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Zod schemas for structured output enforcement
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

const app = express();

async function configureServer() {
  const PORT = 3000;

  app.use(helmet({ contentSecurityPolicy: false }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/", apiLimiter);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || "social-genius-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  }));

  let scheduledPosts: any[] = [];
  let connectedAccounts: any = { linkedin: false, x: false };

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // --- AI PIPELINE ROUTES ---

  app.post("/api/analyze-profile", async (req, res) => {
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
      res.json(validated);
    } catch (error) {
      console.error("[Backend] analyze-profile error:", error);
      res.status(500).json({ error: "Failed to analyze profile" });
    }
  });

  app.post("/api/generate-post", async (req, res) => {
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
      res.json(validated);
    } catch (error) {
      console.error("[Backend] generate-post error:", error);
      res.status(500).json({ error: "Failed to generate post variants" });
    }
  });

  // --- EXISTING API ROUTES ---
  app.post("/api/post", async (req, res) => {
    const { platform, content } = req.body;
    if (!connectedAccounts[platform.toLowerCase()]) {
      return res.status(400).json({ error: `Account for ${platform} not connected.` });
    }
    console.log(`[SIMULATION] Posting to ${platform}: ${content.substring(0, 50)}...`);
    res.json({ success: true, postId: Math.random().toString(36).substring(7) });
  });

  app.get("/api/schedule", (req, res) => res.json(scheduledPosts));
  app.post("/api/schedule", (req, res) => {
    const post = { ...req.body, id: Date.now().toString() };
    scheduledPosts.push(post);
    res.json(post);
  });
  app.delete("/api/schedule/:id", (req, res) => {
    scheduledPosts = scheduledPosts.filter(p => p.id !== req.params.id);
    res.json({ success: true });
  });
  app.get("/api/accounts", (req, res) => res.json(connectedAccounts));

  // OAuth Routes
  app.get("/api/auth/url/:platform", (req, res) => {
    const { platform } = req.params;
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${appUrl}/auth/callback/${platform}`;
    let authUrl = "";
    if (platform === "linkedin") {
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=MOCK_CLIENT_ID&redirect_uri=${redirectUri}&state=foo&scope=w_member_social`;
    } else if (platform === "x") {
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=MOCK_CLIENT_ID&redirect_uri=${redirectUri}&state=foo&scope=tweet.read`;
    }
    res.json({ url: authUrl });
  });

  app.get("/auth/callback/:platform", (req, res) => {
    const { platform } = req.params;
    if (platform === "linkedin") connectedAccounts.linkedin = true;
    if (platform === "x") connectedAccounts.x = true;
    res.send(`<html><script>window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: '${platform}' }, '*'); setTimeout(() => window.close(), 1500);</script><body>Connected!</body></html>`);
  });

  app.get("/api/analytics", (req, res) => {
    res.json({
      totalEngagement: 45200, growth: 12.5,
      platforms: [{ name: "LinkedIn", likes: 1200, comments: 450, shares: 120 }, { name: "X", likes: 8500, comments: 2100, shares: 4200 }],
      recentPostPerformance: []
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    // Only serve static files if running standalone
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
    }
  }

  // Only listen if not running in a serverless environment like Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

configureServer();

export default app;
