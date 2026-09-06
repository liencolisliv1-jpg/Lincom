export interface SmtpConfig {
  host: string;
  port: number;
  security: 'TLS' | 'SSL' | 'NONE';
  user: string;
  senderEmail: string;
  senderName: string;
  password?: string;
  isCustomEnabled: boolean;
  lastValidatedAt?: string;
}

export interface DomainValidationResult {
  isValid: boolean;
  domain: string;
  hostDomain?: string;
  isMxValid?: boolean;
  isHostResolvable?: boolean;
  warnings: string[];
  errors: string[];
  suggestedHost?: string;
  recommendation: string;
}

export const COMMON_SMTP_PROVIDERS: Record<string, { host: string; port: number; security: 'TLS' | 'SSL'; name: string }> = {
  'gmail.com': { host: 'smtp.gmail.com', port: 587, security: 'TLS', name: 'Google Workspace / Gmail' },
  'googlemail.com': { host: 'smtp.gmail.com', port: 587, security: 'TLS', name: 'Gmail' },
  'yahoo.com': { host: 'smtp.mail.yahoo.com', port: 465, security: 'SSL', name: 'Yahoo Mail' },
  'yahoo.fr': { host: 'smtp.mail.yahoo.com', port: 465, security: 'SSL', name: 'Yahoo France' },
  'outlook.com': { host: 'smtp.office365.com', port: 587, security: 'TLS', name: 'Microsoft Outlook' },
  'hotmail.com': { host: 'smtp.office365.com', port: 587, security: 'TLS', name: 'Microsoft Hotmail' },
  'brevo.com': { host: 'smtp-relay.brevo.com', port: 587, security: 'TLS', name: 'Brevo (Sendinblue)' },
  'sendgrid.net': { host: 'smtp.sendgrid.net', port: 587, security: 'TLS', name: 'SendGrid' },
  'mailgun.org': { host: 'smtp.mailgun.org', port: 587, security: 'TLS', name: 'Mailgun' },
};

// Known typo domains and non-existent hosts to block NXDOMAIN errors
const TYPO_OR_INVALID_HOSTS = [
  'smip.host.com',
  'host.com',
  'smtp.host.com',
  'smip.gmail.com',
  'mail.host.com',
  'test.com',
  'example.com',
];

/**
 * Validates domain and SMTP host formatting & common DNS NXDOMAIN traps
 */
export function validateEmailAndSmtpDomain(
  senderEmail: string,
  smtpHost: string
): DomainValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const cleanEmail = senderEmail.trim().toLowerCase();
  const cleanHost = smtpHost.trim().toLowerCase();

  // 1. Basic format check for email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
  const emailMatch = cleanEmail.match(emailRegex);

  if (!cleanEmail) {
    errors.push("L'adresse email de l'expéditeur est obligatoire.");
    return {
      isValid: false,
      domain: '',
      warnings,
      errors,
      recommendation: "Saisissez l'adresse email de votre organisation (ex: liencolis.liv1@gmail.com).",
    };
  }

  if (!emailMatch) {
    errors.push(`Format d'email expéditeur invalide : "${senderEmail}".`);
    return {
      isValid: false,
      domain: '',
      warnings,
      errors,
      recommendation: 'Vérifiez la syntaxe (ex: contact@votre-domaine.com).',
    };
  }

  const domain = emailMatch[1];

  // 2. Disallow dummy or reserved domains
  if (domain === 'example.com' || domain === 'test.com' || domain === 'localhost') {
    errors.push(`Le domaine "${domain}" est fictif et n'a pas de serveurs de messagerie (DNS NXDOMAIN).`);
  }

  // 3. Check typo or dummy SMTP hosts
  if (TYPO_OR_INVALID_HOSTS.includes(cleanHost)) {
    errors.push(
      `L'hôte SMTP "${smtpHost}" est un hôte fictif ou erroné qui provoque l'erreur "DNS NXDOMAIN (smip.host.com introuvable)".`
    );
  }

  // 4. Check typo "smip" instead of "smtp"
  if (cleanHost.startsWith('smip.')) {
    errors.push(`Faute de frappe détectée dans l'hôte SMTP ("smip" au lieu de "smtp"). Utilisez "smtp.${cleanHost.slice(5)}".`);
  }

  // 5. Hostname format validation
  const hostRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  if (cleanHost && !hostRegex.test(cleanHost)) {
    errors.push(`Le nom de serveur SMTP "${smtpHost}" a un format d'hôte DNS invalide.`);
  }

  // 6. Intelligent provider match & recommendations
  let suggestedHost: string | undefined;
  if (COMMON_SMTP_PROVIDERS[domain]) {
    const known = COMMON_SMTP_PROVIDERS[domain];
    if (cleanHost && cleanHost !== known.host) {
      warnings.push(
        `Pour une adresse @${domain}, le serveur SMTP recommandé est généralement "${known.host}" (Port ${known.port}, ${known.security}).`
      );
      suggestedHost = known.host;
    }
  }

  // 7. Check if Gmail sender with non-gmail host
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    if (cleanHost && cleanHost !== 'smtp.gmail.com' && !cleanHost.includes('relay') && !cleanHost.includes('sendgrid') && !cleanHost.includes('brevo')) {
      warnings.push("Pour expédier depuis Gmail, utilisez smtp.gmail.com avec un 'Mot de passe d'application Google' à 16 lettres.");
      suggestedHost = 'smtp.gmail.com';
    }
  }

  const isValid = errors.length === 0;

  let recommendation = "Configuration SMTP et domaine de l'expéditeur valides.";
  if (!isValid) {
    recommendation = errors[0];
  } else if (warnings.length > 0) {
    recommendation = warnings[0];
  }

  return {
    isValid,
    domain,
    hostDomain: cleanHost,
    warnings,
    errors,
    suggestedHost,
    recommendation,
  };
}
