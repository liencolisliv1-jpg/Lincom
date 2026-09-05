var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_nodemailer = __toESM(require("nodemailer"), 1);
var emailTransporter = null;
async function getTransporter() {
  if (emailTransporter) return emailTransporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    emailTransporter = import_nodemailer.default.createTransporter({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    try {
      const testAccount = await import_nodemailer.default.createTestAccount();
      emailTransporter = import_nodemailer.default.createTransporter({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[LIENCOLIS Email] Ethereal SMTP test account initialized: ${testAccount.user}`);
    } catch {
      emailTransporter = import_nodemailer.default.createTransporter({
        jsonTransport: true
      });
    }
  }
  return emailTransporter;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.post("/api/auth/send-verification-email", async (req, res) => {
    try {
      const { email, name, code, role, origin } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "Email et code requis" });
      }
      const transporter = await getTransporter();
      const fromAddress = process.env.SMTP_FROM || '"LIENCOLIS Driver B\xE9nin" <no-reply@communauty.com>';
      const siteUrl = origin || "https://liencolisdriver.communauty.com";
      const directActivationUrl = `${siteUrl}?verify_code=${code}&email=${encodeURIComponent(email)}`;
      const roleLabel = role === "driver" ? "Livreur Professionnel" : role === "merchant" ? "Commer\xE7ant / Restaurant" : "Particulier / Client";
      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Validation de Compte - LIENCOLIS Driver</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #d97706 0%, #2563eb 100%); padding: 28px 24px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #0f172a; padding: 10px 18px; border-radius: 12px; border: 2px solid #fbbf24; margin-bottom: 12px;">
                      <span style="font-size: 20px; font-weight: 900; color: #fbbf24; letter-spacing: 1px;">LIENCOLIS</span>
                      <span style="font-size: 13px; font-weight: 700; color: #34d399; margin-left: 6px;">DRIVER</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Confirmation de votre Compte</h1>
                    <p style="color: #fef3c7; font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">Plateforme S\xE9curis\xE9e des Livreurs & Commer\xE7ants du B\xE9nin \u{1F1E7}\u{1F1EF}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="font-size: 15px; color: #f8fafc; line-height: 1.6; margin: 0 0 16px 0;">
                Bonjour <strong style="color: #fbbf24;">${name || "Cher Partenaire"}</strong>,
              </p>
              <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 20px 0;">
                Bienvenue dans la communaut\xE9 <strong>LIENCOLIS Driver</strong> en tant que <strong>${roleLabel}</strong>. Pour finaliser votre inscription et activer votre espace s\xE9curis\xE9, voici votre code de validation confidentiel :
              </p>

              <!-- Highlighted Code Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #0f172a; border: 2px dashed #f59e0b; border-radius: 14px; padding: 18px 24px; display: inline-block;">
                      <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Votre Code de Validation</div>
                      <div style="font-size: 32px; font-weight: 900; color: #fbbf24; letter-spacing: 8px; font-family: Courier, monospace;">${code}</div>
                      <div style="font-size: 11px; color: #10b981; font-weight: 600; margin-top: 6px;">\u23F1\uFE0F Valable pendant 15 minutes</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${directActivationUrl}" target="_blank" style="display: inline-block; background-color: #f59e0b; color: #0f172a; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);">
                      Valider et Ouvrir Mon Compte \u{1F680}
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #0f172a; border-left: 4px solid #3b82f6; padding: 14px; border-radius: 8px; margin-top: 24px;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5;">
                  \u{1F512} <strong>S\xE9curit\xE9 :</strong> Ne communiquez jamais ce code \xE0 un tiers. L'\xE9quipe LIENCOLIS ne vous demandera jamais votre mot de passe ni vos acc\xE8s Mobile Money.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; border-top: 1px solid #334155; padding: 20px 28px; text-align: center;">
              <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0;">
                LIENCOLIS Driver Community \u2022 Cotonou, B\xE9nin
              </p>
              <p style="font-size: 11px; color: #475569; margin: 0;">
                Support & Assistance Chauffeurs : <a href="https://wa.me/22997000000" style="color: #fbbf24; text-decoration: none;">WhatsApp +229</a> \u2022 Fondateur Germain Mensah
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
      const mailOptions = {
        from: fromAddress,
        to: email,
        subject: `[LIENCOLIS Driver] \u{1F510} Votre Code de Validation : ${code}`,
        text: `Bonjour ${name || ""},

Votre code de confirmation pour votre compte LIENCOLIS Driver est : ${code}

Lien de validation : ${directActivationUrl}

Ce code expire dans 15 minutes.`,
        html: htmlContent
      };
      const info = await transporter.sendMail(mailOptions);
      console.log(`[LIENCOLIS Email] Verification email dispatched to ${email}:`, info.messageId || "Sent");
      let previewUrl = null;
      if (import_nodemailer.default.getTestMessageUrl) {
        previewUrl = import_nodemailer.default.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`[LIENCOLIS Email Preview URL]: ${previewUrl}`);
        }
      }
      res.json({
        success: true,
        message: "Email de confirmation envoy\xE9 avec succ\xE8s",
        email,
        previewUrl
      });
    } catch (error) {
      console.error("[LIENCOLIS Email Error]:", error);
      res.status(500).json({
        error: error?.message || "Erreur lors de l'envoi de l'email"
      });
    }
  });
  app.post("/api/auth/send-reset-email", async (req, res) => {
    try {
      const { email, name, resetLink, origin } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email requis" });
      }
      const transporter = await getTransporter();
      const fromAddress = process.env.SMTP_FROM || '"LIENCOLIS S\xE9curit\xE9" <no-reply@communauty.com>';
      const siteUrl = origin || "https://liencolisdriver.communauty.com";
      const targetLink = resetLink || `${siteUrl}?action=reset_password&email=${encodeURIComponent(email)}`;
      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>R\xE9initialisation de Mot de Passe - LIENCOLIS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #d97706 100%); padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0;">R\xE9initialisation de Mot de Passe</h1>
              <p style="color: #fef2f2; font-size: 12px; margin: 4px 0 0 0;">LIENCOLIS Driver S\xE9curit\xE9 B\xE9nin</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 24px;">
              <p style="font-size: 14px; color: #f8fafc; margin: 0 0 14px 0;">
                Bonjour <strong>${name || "Partenaire"}</strong>,
              </p>
              <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6; margin: 0 0 20px 0;">
                Vous avez demand\xE9 la r\xE9initialisation de votre mot de passe pour le compte associ\xE9 \xE0 <strong>${email}</strong>. Cliquez sur le bouton ci-dessous pour choisir votre nouveau mot de passe :
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${targetLink}" target="_blank" style="display: inline-block; background-color: #ef4444; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 13px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                      Changer Mon Mot de Passe \u{1F511}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 11px; color: #94a3b8; margin: 16px 0 0 0;">
                Si vous n'\xEAtes pas \xE0 l'origine de cette demande, vous pouvez ignorer cet email en toute s\xE9curit\xE9.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
      const mailOptions = {
        from: fromAddress,
        to: email,
        subject: `[LIENCOLIS Driver] \u{1F511} R\xE9initialisation de votre Mot de Passe`,
        text: `Bonjour,

Pour r\xE9initialiser votre mot de passe LIENCOLIS Driver, cliquez sur le lien suivant : ${targetLink}`,
        html: htmlContent
      };
      const info = await transporter.sendMail(mailOptions);
      console.log(`[LIENCOLIS Reset Email] Sent to ${email}:`, info.messageId || "OK");
      res.json({
        success: true,
        message: "Email de r\xE9initialisation transmis",
        email
      });
    } catch (error) {
      console.error("[LIENCOLIS Reset Email Error]:", error);
      res.status(500).json({
        error: error?.message || "Erreur envoi r\xE9initialisation"
      });
    }
  });
  app.post("/api/fedapay/create-transaction", async (req, res) => {
    try {
      const { amount, description, customer } = req.body;
      const secretKey = process.env.FEDAPAY_SECRET_KEY || "sk_live_A0DkAlve2_wY0JfZW9TZDj97";
      const fedapayUrl = "https://api.fedapay.com/v1/transactions";
      const response = await fetch(fedapayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          amount: Math.round(amount),
          currency: { iso: "XOF" },
          description: description || "Paiement Liencolis B\xE9nin",
          customer: customer || {}
        })
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("FedaPay transaction error:", error);
      res.status(500).json({ error: error?.message || "Transaction failed" });
    }
  });
  app.post("/api/fedapay/token/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const secretKey = process.env.FEDAPAY_SECRET_KEY || "sk_live_A0DkAlve2_wY0JfZW9TZDj97";
      const response = await fetch(`https://api.fedapay.com/v1/transactions/${id}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secretKey}`
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("FedaPay token error:", error);
      res.status(500).json({ error: error?.message || "Token generation failed" });
    }
  });
  app.get("/api/fedapay/verify/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const secretKey = process.env.FEDAPAY_SECRET_KEY || "sk_live_A0DkAlve2_wY0JfZW9TZDj97";
      const response = await fetch(`https://api.fedapay.com/v1/transactions/${id}`, {
        headers: {
          "Authorization": `Bearer ${secretKey}`
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("FedaPay verify error:", error);
      res.status(500).json({ error: error?.message || "Verification failed" });
    }
  });
  app.post("/api/routes/optimize", async (req, res) => {
    try {
      const { origin, destination, intermediates, travelMode } = req.body;
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.json({
          mocked: true,
          distanceMeters: 8500,
          duration: "1140s",
          fuelSavedCfa: 450,
          optimizedOrder: intermediates ? intermediates.map((_, i) => i) : []
        });
      }
      const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.optimizedIntermediateWaypointIndex"
        },
        body: JSON.stringify({
          origin,
          destination,
          intermediates: intermediates || [],
          travelMode: travelMode || "TWO_WHEELER",
          optimizeWaypointOrder: true
        })
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Route optimization error:", error);
      res.status(500).json({ error: error?.message || "Route calculation failed" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
