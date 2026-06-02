import express from "express";
import path from "path";
import next from "next";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Auto-detect production runtime to bypass missing NODE_ENV flags in custom containers
let isProdRuntime = false;
try {
  const currentFile = typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : "";
  isProdRuntime = currentFile.endsWith(".cjs") || currentFile.endsWith(".js") || currentFile.includes("dist");
} catch (e) {
  if (typeof __filename !== "undefined") {
    isProdRuntime = __filename.endsWith(".cjs") || __filename.endsWith(".js") || __filename.includes("dist");
  }
}

if (isProdRuntime || process.env.NODE_ENV === "production") {
  (process.env as any).NODE_ENV = "production";
} else {
  (process.env as any).NODE_ENV = "development";
}

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

async function startServer() {
  await nextApp.prepare();
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
          console.warn("[Email Warning] BREVO_SENDER_EMAIL environment variable is missing. Activating simulation fallback.");
          return res.json({
            success: true,
            provider: "simulation",
            fallback: true,
            warning: "Email simulation fallback activated because BREVO_SENDER_EMAIL is not defined."
          });
        }

        // Parse recipients list to match Brevo's format: [{ email: 'x', name: 'y' }]
        const recipients = Array.isArray(to)
          ? to.map((email: string) => ({ email }))
          : [{ email: to }];

        console.log(`[Email] Sending via Brevo SMTP API from <${senderEmail}> to ${to}`);
        
        try {
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
            console.warn("[Email Warning] Brevo dispatch failed configuration check/IP whitelist. Activating simulation fallback.", errorDetails);
            
            return res.json({
              success: true,
              provider: "simulation",
              fallback: true,
              warning: "Email simulation mode active. Brevo API dispatch paused (typically due to unrecognised sandbox IP addresses).",
              errorDetails
            });
          }

          const data = await brevoResponse.json();
          return res.json({ success: true, provider: "brevo", data });
        } catch (fetchError: any) {
          console.warn("[Email Warning] Brevo DNS or Routing connection failed. Activating simulation fallback.", fetchError.message);
          return res.json({
            success: true,
            provider: "simulation",
            fallback: true,
            warning: "Email simulation mode active. Connection to Brevo SMTP gateway failed.",
            errorMessage: fetchError.message
          });
        }
      } 

      // No Provider configured
      console.log(`[Email Mock Simulation] Simulated Email Details:\nTo: ${to}\nSubject: ${subject}`);
      return res.json({
        success: true,
        provider: "simulation",
        fallback: true,
        warning: "No email service configured. Simulated email saved to server logs."
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

  // Next.js custom router handler for frontend pages
  app.all(/.*/, (req, res) => {
    return handle(req, res);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
