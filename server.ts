import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
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

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      
      if (!to || !subject || !html) {
        return res.status(400).json({ error: "Missing required fields: to, subject, html" });
      }

      const brevoApiKey = process.env.BREVO_API_KEY;

      if (brevoApiKey) {
        // Use Brevo SMTP REST API v3
        const senderEmail = process.env.BREVO_SENDER_EMAIL;
        const senderName = process.env.BREVO_SENDER_NAME || "Duka Sync Suite";

        if (!senderEmail) {
          return res.status(400).json({
            error: "BREVO_SENDER_EMAIL environment variable is required when using Brevo"
          });
        }

        // Parse recipients list to match Brevo's format: [{ email: 'x', name: 'y' }]
        const recipients = Array.isArray(to)
          ? to.map((email: string) => ({ email }))
          : [{ email: to }];

        console.log(`[Email] Sending via Brevo SMTP API from <${senderEmail}> to ${to}`);
        
        const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": brevoApiKey
          },
          body: JSON.stringify({
            sender: {
              name: senderName,
              email: senderEmail
            },
            to: recipients,
            subject: subject,
            htmlContent: html
          })
        });

        if (!brevoResponse.ok) {
          const errorDetails = await brevoResponse.json().catch(() => ({ message: "Unknown error" }));
          console.error("[Email] Brevo API Error:", errorDetails);
          return res.status(brevoResponse.status).json({
            error: errorDetails.message || "Failed to send email via Brevo"
          });
        }

        const data = await brevoResponse.json();
        return res.json({ success: true, provider: "brevo", data });
      } 

      // No Provider configured
      return res.status(400).json({
        error: "No email service configured. Please define BREVO_API_KEY."
      });

    } catch (error: any) {
      console.error("Email service error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Catch-all for non-existent API routes
  app.all("/api/*all", (req, res) => {
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
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
