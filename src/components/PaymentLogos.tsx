import React from 'react';

// Logos Vectoriels SVG purs haute résolution basés directement sur les visuels officiels fournis par l'utilisateur

// 1. MTN Logo Officiel (Fond Jaune #FFCC00 + Ovale Noir + Texte MTN Noir)
export const MtnMomoLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 32 }) => (
  <svg height={height} viewBox="0 0 110 55" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block ${className}`}>
    <rect width="110" height="55" rx="8" fill="#FFCC00" />
    <ellipse cx="55" cy="27.5" rx="44" ry="21" stroke="#000000" strokeWidth="6" fill="#FFCC00" />
    <text x="55" y="37" fill="#000000" fontSize="26" fontWeight="900" fontFamily="Arial Black, Impact, sans-serif" textAnchor="middle" letterSpacing="-0.5">
      MTN
    </text>
  </svg>
);

// 2. Moov Money Logo Officiel (Losange Orange #F26522 + "MOOV" Bleu + "Money" Blanc + Billets)
export const MoovMoneyLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 32 }) => (
  <svg height={height} viewBox="0 0 110 55" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block ${className}`}>
    {/* Diamond shape */}
    <path d="M55 2.5 L105 27.5 L55 52.5 L5 27.5 Z" fill="#F26522" stroke="#E05411" strokeWidth="1" />
    <text x="55" y="24" fill="#0055A5" fontSize="16" fontWeight="900" fontFamily="Arial Black, sans-serif" textAnchor="middle" letterSpacing="-0.5">
      MOOV
    </text>
    <text x="46" y="40" fill="#FFFFFF" fontSize="16" fontWeight="800" fontStyle="italic" fontFamily="Arial, sans-serif" textAnchor="middle">
      Money
    </text>
    {/* Banknote icon lines on right */}
    <g transform="translate(74, 28)">
      <rect x="0" y="2" width="12" height="8" rx="1" fill="#FFFFFF" opacity="0.9" />
      <rect x="2" y="0" width="12" height="8" rx="1" fill="#FFFFFF" />
      <line x1="4" y1="4" x2="12" y2="4" stroke="#F26522" strokeWidth="1.5" />
    </g>
  </svg>
);

// 3. My Celtiis Cash Logo Officiel (Fond Bleu Nuit #0A2B66 + "My" Vert + "celtiis" Blanc + "Cash" Blanc + Feuilles vertes)
export const CeltiisCashLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 32 }) => (
  <svg height={height} viewBox="0 0 120 55" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block ${className}`}>
    <rect width="120" height="55" rx="8" fill="#0A2B66" />
    {/* "My" in Green with top leaf */}
    <path d="M12 8 C16 4 24 4 28 8 C22 10 18 12 12 8 Z" fill="#7CBD23" />
    <text x="26" y="21" fill="#7CBD23" fontSize="13" fontWeight="900" fontFamily="Arial Black, sans-serif">
      My
    </text>
    {/* "celtiis" in White with leaf on 'c' */}
    <path d="M10 44 C15 48 25 48 30 42 C24 40 18 40 10 44 Z" fill="#7CBD23" />
    <text x="14" y="38" fill="#FFFFFF" fontSize="20" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="-0.8">
      celtiis
    </text>
    {/* "Cash" in White bold below right */}
    <text x="70" y="49" fill="#FFFFFF" fontSize="15" fontWeight="900" fontFamily="Arial, sans-serif">
      Cash
    </text>
  </svg>
);

// 4. FedaPay Fintech (Bleu #0066F6 / Vert #00E599)
export const FedaPayLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 36 }) => (
  <svg height={height} viewBox="0 0 160 55" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block ${className}`}>
    <rect width="160" height="55" rx="12" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
    <rect x="12" y="10" width="35" height="35" rx="8" fill="#0066F6" />
    <path d="M22 18H33V23H27V26H31V30H27V37H22V18Z" fill="#FFFFFF" />
    <circle cx="38" cy="38" r="5" fill="#00E599" />
    <text x="56" y="36" fill="#FFFFFF" fontSize="20" fontWeight="900" fontFamily="Arial, sans-serif">
      Feda<tspan fill="#0066F6">Pay</tspan>
    </text>
  </svg>
);

// 5. KKiaPay Fintech (Orange #F4511E / Sombre #1C3144)
export const KKiaPayLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 36 }) => (
  <svg height={height} viewBox="0 0 160 55" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block ${className}`}>
    <rect width="160" height="55" rx="12" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
    <circle cx="28" cy="27.5" r="18" fill="#F4511E" />
    <path d="M22 18V37H26V30L32 37H37L30 28L36 18H31L26 25V18H22Z" fill="#FFFFFF" />
    <text x="54" y="35" fill="#FFFFFF" fontSize="19" fontWeight="900" fontFamily="Arial, sans-serif">
      kkia<tspan fill="#F4511E">pay</tspan>
    </text>
  </svg>
);

// 6. Visa Officiel (Bleu Visa #1A1F71)
export const VisaLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 32 }) => (
  <svg height={height} viewBox="0 0 90 55" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block ${className}`}>
    <rect width="90" height="55" rx="10" fill="#1A1F71" />
    <path d="M35.6 37L39.8 18H45L40.8 37H35.6ZM59.6 18.5C58.4 18 56.4 17.5 54 17.5C48.6 17.5 44.8 20.3 44.8 24.3C44.8 27.3 47.5 28.9 49.6 29.9C51.7 30.9 52.4 31.6 52.4 32.5C52.4 33.9 50.7 34.5 49 34.5C46.8 34.5 45.4 34 43.8 33.2L42.8 37.8C44.3 38.5 46.8 39 49.4 39C55.2 39 59 36.2 59 31.9C59 27.2 52.5 26.8 52.5 24.6C52.5 23.8 53.3 23 55.1 23C56.6 23 58 23.3 59.2 23.8L59.6 18.5ZM72.6 18H68.6C67.3 18 66.3 18.4 65.8 19.6L57.2 37H62.7L63.8 34H70.5L71.1 37H76L72.6 18ZM65.3 29.8L68 22.4L69.6 29.8H65.3ZM28.8 18L23.7 31L23.2 28.3C22.2 24.9 19.2 21 15.6 19.1L20.3 37H25.9L34.3 18H28.8Z" fill="#FFFFFF" />
    <path d="M18.8 18H10.2L10 18.4C16.6 20 21.6 23.6 24.3 27.5L22.6 19.5C22.3 18.4 21.3 18.1 18.8 18Z" fill="#FAA61A" />
  </svg>
);

// 7. Mastercard Officiel (Cercles Rouge #EB001B & Jaune #F79E1B)
export const MastercardLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 32 }) => (
  <svg height={height} viewBox="0 0 90 55" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block ${className}`}>
    <rect width="90" height="55" rx="10" fill="#111827" />
    <circle cx="35" cy="27.5" r="16" fill="#EB001B" />
    <circle cx="55" cy="27.5" r="16" fill="#F79E1B" fillOpacity="0.9" />
    <path d="M45 15.2C48.2 18.2 50.2 22.6 50.2 27.5C50.2 32.4 48.2 36.8 45 39.8C41.8 36.8 39.8 32.4 39.8 27.5C39.8 22.6 41.8 18.2 45 15.2Z" fill="#FF5F00" />
  </svg>
);

// 8. PayPal Officiel (Double P Bleu #003087 & #0079C1)
export const PaypalLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 32 }) => (
  <svg height={height} viewBox="0 0 110 55" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block ${className}`}>
    <rect width="110" height="55" rx="10" fill="#001C64" />
    <g transform="translate(18, 11)">
      <path d="M12 2H22C27 2 30 4.5 29.5 9.5C29 14.5 25.5 17.5 21 17.5H15.5L13.5 28.5H7.5L12 2Z" fill="#0079C1" />
      <path d="M16 8H25C29.5 8 32 10.2 31.5 14.8C31 19.2 27.8 22 23.5 22H18.8L17 31H11.5L16 8Z" fill="#00457C" opacity="0.6" />
      <path d="M17 8H26C30.5 8 33 10.2 32.5 14.8C32 19.2 28.8 22 24.5 22H19.8L18 31H12.5L17 8Z" fill="#0079C1" />
    </g>
    <text x="64" y="34" fill="#FFFFFF" fontSize="16" fontWeight="900" fontStyle="italic" fontFamily="Arial, sans-serif">
      Pay<tspan fill="#0079C1">Pal</tspan>
    </text>
  </svg>
);
