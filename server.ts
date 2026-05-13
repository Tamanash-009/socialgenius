import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { createServer as createViteServer } from "vite";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  
  // session configuration for iframe/cross-origin
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

  // In-memory data store (for persistence during container life)
  let scheduledPosts: any[] = [];
  let connectedAccounts: any = {
    linkedin: false,
    x: false
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Post directly to social media
  app.post("/api/post", async (req, res) => {
    const { platform, content } = req.body;
    
    if (!connectedAccounts[platform.toLowerCase()]) {
      return res.status(400).json({ error: `Account for ${platform} not connected.` });
    }

    // Simulate API call to social media provider
    console.log(`[SIMULATION] Posting to ${platform}: ${content.substring(0, 50)}...`);
    
    // In a real app, you'd use the stored OAuth tokens here
    // e.g., axios.post('https://api.linkedin.com/v2/ugcPosts', {...}, { headers: { Authorization: `Bearer ${token}` }})

    res.json({ success: true, postId: Math.random().toString(36).substring(7) });
  });

  // Scheduling API
  app.get("/api/schedule", (req, res) => {
    res.json(scheduledPosts);
  });

  app.post("/api/schedule", (req, res) => {
    const post = { ...req.body, id: Date.now().toString() };
    scheduledPosts.push(post);
    res.json(post);
  });

  app.delete("/api/schedule/:id", (req, res) => {
    scheduledPosts = scheduledPosts.filter(p => p.id !== req.params.id);
    res.json({ success: true });
  });

  // Accounts API
  app.get("/api/accounts", (req, res) => {
    res.json(connectedAccounts);
  });

  // OAuth Routes (following oauth-integration skill)
  app.get("/api/auth/url/:platform", (req, res) => {
    const { platform } = req.params;
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${appUrl}/auth/callback/${platform}`;

    let authUrl = "";
    if (platform === "linkedin") {
      const clientId = process.env.LINKEDIN_CLIENT_ID || "MOCK_CLIENT_ID";
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=foo&scope=w_member_social`;
    } else if (platform === "x") {
      const clientId = process.env.TWITTER_CLIENT_ID || "MOCK_CLIENT_ID";
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=foo&scope=tweet.read%20tweet.write%20users.read&code_challenge=challenge&code_challenge_method=plain`;
    }

    res.json({ url: authUrl });
  });

  app.get("/auth/callback/:platform", (req, res) => {
    const { platform } = req.params;
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Authorization code missing.");
    }

    // In a real app, you would exchange the code for an access token here:
    // const response = await axios.post('oauth-token-url', {
    //   code,
    //   client_id: process.env.CLIENT_ID,
    //   client_secret: process.env.CLIENT_SECRET,
    //   redirect_uri: ...
    // });
    // const { access_token } = response.data;
    // req.session.tokens = { ...req.session.tokens, [platform]: access_token };

    if (platform === "linkedin") connectedAccounts.linkedin = true;
    if (platform === "x") connectedAccounts.x = true;

    res.send(`
      <html>
        <body style="background: #0A0118; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; gap: 1rem;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: '${platform}' }, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              window.location.href = '/';
            }
          </script>
          <div style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 2rem; border: 1px solid rgba(255,255,255,0.1); text-align: center; backdrop-filter: blur(20px);">
             <div style="width: 4rem; height: 4rem; background: #6366f1; border-radius: 1rem; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
             </div>
             <h1 style="margin: 0; font-size: 1.5rem;">Connected!</h1>
             <p style="color: rgba(255,255,255,0.5);">Authentication successful for ${platform}.</p>
             <p style="font-size: 0.8rem; color: #6366f1; margin-top: 1rem;">Closing this window...</p>
          </div>
        </body>
      </html>
    `);
  });

  // Analytics API
  app.get("/api/analytics", (req, res) => {
    // Return mock analytics data
    res.json({
      totalEngagement: 45200,
      growth: 12.5,
      platforms: [
        { name: "LinkedIn", likes: 1200, comments: 450, shares: 120 },
        { name: "X", likes: 8500, comments: 2100, shares: 4200 },
      ],
      recentPostPerformance: [
        { id: "1", platform: "X", title: "The Future of AI agents", reach: 12000, engagement: 8.5, likes: 850, shares: 420, comments: 110, date: "2 days ago" },
        { id: "2", platform: "LinkedIn", title: "Why your personal brand matters", reach: 8500, engagement: 12.2, likes: 420, shares: 85, comments: 64, date: "4 days ago" },
        { id: "3", platform: "X", title: "Building in Public: Week 4", reach: 15600, engagement: 6.8, likes: 1100, shares: 620, comments: 240, date: "1 week ago" },
      ]
    });
  });

  // Vite middleare for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
