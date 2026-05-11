import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Initialize Resend lazily
  let resend: Resend | null = null;
  const getResend = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    if (!resend) {
      resend = new Resend(apiKey);
    }
    return resend;
  };

  // Initialize OpenAI lazily
  let openai: OpenAI | null = null;
  const getOpenAI = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    if (!openai) {
      openai = new OpenAI({ apiKey });
    }
    return openai;
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, model = "gpt-4o-mini" } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const client = getOpenAI();
      const response = await client.chat.completions.create({
        model,
        messages,
      });

      res.json(response);
    } catch (error: any) {
      console.error("OpenAI error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      
      if (!to || !subject || !html) {
        return res.status(400).json({ error: "Missing required fields: to, subject, html" });
      }

      const client = getResend();
      const { data, error } = await client.emails.send({
        from: "Aether Intelligence <onboarding@resend.dev>", // Default Resend domain
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });

      if (error) {
        return res.status(400).json({ error });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Resend error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Catch-all for non-existent API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
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
