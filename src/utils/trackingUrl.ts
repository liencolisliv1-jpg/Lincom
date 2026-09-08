/**
 * Official Public Domain & Tracking URL Generator
 * Primary Production Host: https://lincom-1ecc6.web.app
 */

export const OFFICIAL_WEB_APP_DOMAIN = 'https://lincom-1ecc6.web.app';

/**
 * Generates the clean public tracking link for any parcel.
 * Replaces any internal cloud run / dev sandbox URLs (ais-dev-..., localhost, run.app)
 * with the official public production domain https://lincom-1ecc6.web.app.
 */
export function getPublicTrackingUrl(trackingCode: string): string {
  const code = (trackingCode || '').trim();
  const encoded = encodeURIComponent(code);

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const hostname = window.location.hostname;

    // Never leak dev sandbox / Cloud Run internal preview URLs to clients
    if (
      !hostname ||
      hostname.includes('run.app') ||
      hostname.includes('ais-dev') ||
      hostname.includes('ais-pre') ||
      hostname.includes('localhost') ||
      hostname.includes('127.0.0.1')
    ) {
      return `${OFFICIAL_WEB_APP_DOMAIN}/?track=${encoded}`;
    }

    // If accessed on a custom production domain (e.g. liencolis-driver-communauty.com)
    return `${origin}/?track=${encoded}`;
  }

  return `${OFFICIAL_WEB_APP_DOMAIN}/?track=${encoded}`;
}

/**
 * Pre-formatted text for WhatsApp or SMS sharing with customer
 */
export function getTrackingShareMessage(options: {
  trackingCode: string;
  packageDescription?: string;
  driverName?: string;
  deliveryFee?: number;
  securityPin?: string;
}): string {
  const trackingUrl = getPublicTrackingUrl(options.trackingCode);
  const driver = options.driverName || 'Livreur certifié LIENCOLIS';
  const pkg = options.packageDescription || 'Colis';
  const pinText = options.securityPin ? `\n🔐 Code PIN secret à remettre : *${options.securityPin}*` : '';

  return `📦 *LIENCOLIS EXPRESS - Suivi de votre Colis*\n\n` +
    `Bonjour ! Votre colis (${pkg}) est pris en charge par ${driver}.\n` +
    `🔗 *Lien de suivi en direct :*\n${trackingUrl}\n` +
    `Code de suivi : #${options.trackingCode}${pinText}\n\n` +
    `Suivez la position du livreur en temps réel sur le réseau des livreurs du Bénin 🇧🇯.`;
}
