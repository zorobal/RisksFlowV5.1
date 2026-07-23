import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Tenant-isolated SMTP configurations
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  enabled: boolean;
}

const tenantSmtpConfigs: Record<string, SmtpConfig> = {
  tenant1: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || 'smtp.sogesti@gmail.com',
    pass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'Sogesti S.A. GRC RiskFlow',
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@sogesti-grc.com',
    enabled: true,
  },
  tenant2: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'smtp.aerotech@gmail.com',
    pass: '',
    fromName: 'AeroTech West Africa - Sécurité & Risques',
    fromEmail: 'grc@aerotech-wa.com',
    enabled: true,
  }
};

function getTenantSmtpConfig(tenantId: string): SmtpConfig {
  const tid = tenantId || 'tenant1';
  if (!tenantSmtpConfigs[tid]) {
    tenantSmtpConfigs[tid] = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      fromName: `Sogesti GRC - ${tid}`,
      fromEmail: `noreply@${tid}.com`,
      enabled: true,
    };
  }
  return tenantSmtpConfigs[tid];
}

// Email Dispatch Audit Log per tenant
interface EmailLogEntry {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  type: string;
  status: 'Envoyé' | 'Échec' | 'Simulé';
  details?: string;
  error?: string;
  tenantId?: string;
}

const tenantEmailLogs: Record<string, EmailLogEntry[]> = {
  tenant1: [
    {
      id: 'msg-init-1',
      timestamp: new Date().toISOString(),
      to: 'riskmanager@sogesti-grc.com',
      subject: 'Initialisation du Service d\'Expédition Gmail SMTP Sogesti S.A.',
      type: 'Système',
      status: 'Envoyé',
      details: 'Serveur d\'envoi SMTP initialisé sur le port 587 (smtp.gmail.com)',
      tenantId: 'tenant1'
    }
  ]
};

function getTenantEmailLogs(tenantId: string): EmailLogEntry[] {
  const tid = tenantId || 'tenant1';
  if (!tenantEmailLogs[tid]) {
    tenantEmailLogs[tid] = [];
  }
  return tenantEmailLogs[tid];
}

// Helper to create transport
function createTransporter(customConfig: SmtpConfig) {
  const cfg = customConfig;
  const isGmail = cfg.host.includes('gmail.com');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    });
  }

  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user && cfg.pass ? {
      user: cfg.user,
      pass: cfg.pass,
    } : undefined,
    tls: {
      rejectUnauthorized: false
    }
  });
}

// --- API ROUTES ---

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Sogesti GRC Express Multi-Tenant Email Backend' });
});

// GET /api/email/config or /api/email/config/:tenantId
app.get(['/api/email/config', '/api/email/config/:tenantId'], (req, res) => {
  const tenantId = req.params.tenantId || (req.query.tenantId as string) || 'tenant1';
  const cfg = getTenantSmtpConfig(tenantId);

  res.json({
    tenantId,
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    user: cfg.user,
    hasPass: Boolean(cfg.pass),
    passMasked: cfg.pass ? '••••••••••••••••' : '',
    fromName: cfg.fromName,
    fromEmail: cfg.fromEmail,
    enabled: cfg.enabled,
    isGmail: cfg.host.includes('gmail.com'),
  });
});

// POST /api/email/config or /api/email/config/:tenantId
app.post(['/api/email/config', '/api/email/config/:tenantId'], (req, res) => {
  const tenantId = req.params.tenantId || req.body.tenantId || (req.query.tenantId as string) || 'tenant1';
  const { host, port, secure, user, pass, fromName, fromEmail, enabled } = req.body;
  const cfg = getTenantSmtpConfig(tenantId);

  if (host !== undefined) cfg.host = host;
  if (port !== undefined) cfg.port = parseInt(port, 10);
  if (secure !== undefined) cfg.secure = Boolean(secure);
  if (user !== undefined) cfg.user = user;
  if (pass !== undefined && pass !== '') cfg.pass = pass;
  if (fromName !== undefined) cfg.fromName = fromName;
  if (fromEmail !== undefined) cfg.fromEmail = fromEmail;
  if (enabled !== undefined) cfg.enabled = Boolean(enabled);

  console.log(`[SMTP CONFIG UPDATED for ${tenantId}] Host: ${cfg.host}, User: ${cfg.user}`);

  res.json({
    success: true,
    message: `Configuration SMTP de l'entreprise (${tenantId}) mise à jour avec succès.`,
    config: {
      tenantId,
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      user: cfg.user,
      fromName: cfg.fromName,
      fromEmail: cfg.fromEmail,
      enabled: cfg.enabled
    }
  });
});

// POST /api/email/test or /api/email/test/:tenantId
app.post(['/api/email/test', '/api/email/test/:tenantId'], async (req, res) => {
  const tenantId = req.params.tenantId || req.body.tenantId || (req.query.tenantId as string) || 'tenant1';
  const { testEmail, host, port, secure, user, pass, fromName, fromEmail } = req.body;
  const currentCfg = getTenantSmtpConfig(tenantId);
  const logs = getTenantEmailLogs(tenantId);

  const testCfg: SmtpConfig = {
    host: host || currentCfg.host,
    port: port ? parseInt(port, 10) : currentCfg.port,
    secure: secure !== undefined ? Boolean(secure) : currentCfg.secure,
    user: user !== undefined ? user : currentCfg.user,
    pass: pass !== undefined && pass !== '' ? pass : currentCfg.pass,
    fromName: fromName || currentCfg.fromName,
    fromEmail: fromEmail || currentCfg.fromEmail,
    enabled: true
  };

  if (!testCfg.user || !testCfg.pass) {
    return res.status(400).json({
      success: false,
      error: 'Veuillez saisir un identifiant Gmail / SMTP et un Mot de passe d\'application Google valide.'
    });
  }

  try {
    const transporter = createTransporter(testCfg);
    await transporter.verify();

    let mailSentInfo = null;
    if (testEmail) {
      mailSentInfo = await transporter.sendMail({
        from: `"${testCfg.fromName}" <${testCfg.fromEmail || testCfg.user}>`,
        to: testEmail,
        subject: '🧪 [Sogesti GRC RiskFlow] Test d\'envoi e-mail réussi !',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4f46e5; padding: 15px; border-radius: 8px; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 20px;">Sogesti GRC RiskFlow</h2>
              <p style="margin: 5px 0 0 0; font-size: 13px;">Test d'expédition e-mail Gmail SMTP — Entreprise : ${tenantId}</p>
            </div>
            <div style="padding: 20px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">Félicitations ! 🎉</h3>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Votre serveur d'envoi d'e-mails Gmail SMTP a été correctement configuré et connecté à la plateforme <strong>Sogesti GRC RiskFlow</strong>.
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; font-size: 13px; color: #334155; font-family: monospace;">
                • Entreprise : ${tenantId}<br/>
                • Serveur Hôte : ${testCfg.host}:${testCfg.port}<br/>
                • Compte d'expédition : ${testCfg.user}<br/>
                • Expéditeur affiché : ${testCfg.fromName}<br/>
                • Horodatage : ${new Date().toLocaleString('fr-FR')}
              </div>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 11px; color: #94a3b8;">
              &copy; 2026 Sogesti International S.A. — Système de Gestion Globale des Risques & Conformité
            </div>
          </div>
        `
      });

      logs.unshift({
        id: `msg-${Date.now()}`,
        timestamp: new Date().toISOString(),
        to: testEmail,
        subject: '🧪 Test d\'envoi e-mail réussi !',
        type: 'Test SMTP',
        status: 'Envoyé',
        details: `MessageID: ${mailSentInfo.messageId || 'OK'}`,
        tenantId
      });
    }

    res.json({
      success: true,
      message: testEmail 
        ? `Connexion SMTP validée avec succès et e-mail de test envoyé à ${testEmail} !`
        : 'Connexion au serveur SMTP Gmail établie avec succès !',
      details: mailSentInfo ? { messageId: mailSentInfo.messageId } : null
    });

  } catch (err: any) {
    console.error('[SMTP TEST ERROR]', err);
    const errorMessage = err?.message || 'Erreur inconnue lors du test SMTP';

    logs.unshift({
      id: `msg-err-${Date.now()}`,
      timestamp: new Date().toISOString(),
      to: testEmail || 'N/A',
      subject: 'Test SMTP',
      type: 'Test SMTP',
      status: 'Échec',
      error: errorMessage,
      tenantId
    });

    res.status(500).json({
      success: false,
      error: `Échec de la connexion SMTP : ${errorMessage}`,
      suggestion: 'Vérifiez que vous avez bien utilisé un "Mot de passe d\'application Google" généré dans votre compte Google (Sécurité -> Mots de passe d\'application), et non votre mot de passe habituel.'
    });
  }
});

// POST /api/email/send or /api/email/send/:tenantId
app.post(['/api/email/send', '/api/email/send/:tenantId'], async (req, res) => {
  const tenantId = req.params.tenantId || req.body.tenantId || (req.query.tenantId as string) || 'tenant1';
  const { to, subject, html, text, type, fromName } = req.body;
  const smtpCfg = getTenantSmtpConfig(tenantId);
  const logs = getTenantEmailLogs(tenantId);

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({
      success: false,
      error: 'Les champs "to", "subject" et "html" ou "text" sont obligatoires.'
    });
  }

  if (!smtpCfg.user || !smtpCfg.pass) {
    const entry: EmailLogEntry = {
      id: `sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      to,
      subject,
      type: type || 'Notification Opérationnelle',
      status: 'Simulé',
      details: `Simulation d'envoi (${tenantId}: Identifiants Gmail SMTP non renseignés)`,
      tenantId
    };
    logs.unshift(entry);

    return res.json({
      success: true,
      simulated: true,
      message: 'Email simulé en local (Configurez votre serveur SMTP dans l\'administration de votre entreprise).',
      log: entry
    });
  }

  try {
    const transporter = createTransporter(smtpCfg);
    const senderName = fromName || smtpCfg.fromName;
    const senderEmail = smtpCfg.fromEmail || smtpCfg.user;

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ''),
      html: html || `<p>${text}</p>`
    });

    const entry: EmailLogEntry = {
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      to,
      subject,
      type: type || 'Notification Opérationnelle',
      status: 'Envoyé',
      details: `Expédié via Gmail SMTP (Message ID: ${info.messageId})`,
      tenantId
    };
    logs.unshift(entry);

    res.json({
      success: true,
      simulated: false,
      message: `E-mail envoyé avec succès à ${to}`,
      messageId: info.messageId
    });

  } catch (err: any) {
    console.error('[EMAIL SEND ERROR]', err);
    const errorMsg = err?.message || 'Erreur lors de l\'envoi de l\'e-mail';

    const entry: EmailLogEntry = {
      id: `err-${Date.now()}`,
      timestamp: new Date().toISOString(),
      to,
      subject,
      type: type || 'Notification Opérationnelle',
      status: 'Échec',
      error: errorMsg,
      tenantId
    };
    logs.unshift(entry);

    res.status(500).json({
      success: false,
      error: `Échec d'envoi e-mail : ${errorMsg}`,
      log: entry
    });
  }
});

// GET /api/email/logs or /api/email/logs/:tenantId
app.get(['/api/email/logs', '/api/email/logs/:tenantId'], (req, res) => {
  const tenantId = req.params.tenantId || (req.query.tenantId as string) || 'tenant1';
  const logs = getTenantEmailLogs(tenantId);
  res.json({
    tenantId,
    success: true,
    logs: logs.slice(0, 100)
  });
});

// DELETE /api/email/logs or /api/email/logs/:tenantId
app.delete(['/api/email/logs', '/api/email/logs/:tenantId'], (req, res) => {
  const tenantId = req.params.tenantId || (req.query.tenantId as string) || 'tenant1';
  const logs = getTenantEmailLogs(tenantId);
  logs.length = 0;
  res.json({ success: true, message: `Journal des e-mails de l'entreprise (${tenantId}) réinitialisé.` });
});

// --- VITE / STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur backend Express + Gmail SMTP démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
