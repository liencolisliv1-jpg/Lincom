/**
 * Service d'intégration Gmail pour LIENCOLIS Driver
 * Permet l'envoi de confirmations de livraison, notifications clients,
 * lecture de la boîte de réception des partenaires et gestion des alertes d'expédition.
 * 
 * Requiert une authentification Google avec les scopes Gmail autorisés.
 */

import { getCachedGoogleAccessToken, signInWithGoogle } from './firebase';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export interface SendGmailEmailPayload {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

class GmailService {
  /**
   * Vérifie si un jeton d'accès Google est présent en mémoire
   */
  hasAccessToken(): boolean {
    return !!getCachedGoogleAccessToken();
  }

  /**
   * Obtient le jeton d'accès en mémoire ou déclenche la connexion Google si nécessaire
   */
  async ensureAccessToken(): Promise<string> {
    const existing = getCachedGoogleAccessToken();
    if (existing) return existing;

    await signInWithGoogle(true);
    const freshToken = getCachedGoogleAccessToken();
    if (!freshToken) {
      throw new Error("Impossible d'obtenir le jeton d'accès Gmail. Veuillez vous connecter avec Google.");
    }
    return freshToken;
  }

  /**
   * Liste les derniers messages reçus avec un filtre optionnel (ex: 'LIENCOLIS')
   */
  async listMessages(query: string = '', maxResults: number = 10): Promise<GmailMessageSummary[]> {
    const token = await this.ensureAccessToken();
    const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erreur de récupération Gmail (${res.status})`);
    }

    const data = await res.json();
    if (!data.messages || !Array.isArray(data.messages)) {
      return [];
    }

    // Récupérer le détail de chaque message (snippet, sujet, expéditeur)
    const messages = await Promise.all(
      data.messages.slice(0, 5).map(async (msg: { id: string; threadId: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!detailRes.ok) return null;
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Sans sujet)';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

          return {
            id: detail.id,
            threadId: detail.threadId,
            snippet: detail.snippet || '',
            subject,
            from,
            date,
          };
        } catch {
          return null;
        }
      })
    );

    return messages.filter((m): m is GmailMessageSummary => m !== null);
  }

  /**
   * Envoie un email officiel via l'API REST Gmail de l'utilisateur connecté
   */
  async sendEmail(payload: SendGmailEmailPayload): Promise<{ id: string; threadId: string }> {
    const token = await this.ensureAccessToken();

    // Construction du format RFC 2822 MIME conforme
    const contentType = payload.isHtml ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8';
    const emailLines = [
      `To: ${payload.to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`,
      'MIME-Version: 1.0',
      `Content-Type: ${contentType}`,
      '',
      payload.body,
    ];
    const emailRaw = emailLines.join('\r\n');

    // Base64URL encoding (RFC 4648 §5)
    const encodedEmail = btoa(unescape(encodeURIComponent(emailRaw)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erreur d'envoi Gmail (${res.status})`);
    }

    return await res.json();
  }
}

export const gmailService = new GmailService();
