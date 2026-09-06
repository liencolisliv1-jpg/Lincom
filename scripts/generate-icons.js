import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgContent = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Circle (Dark Navy) -->
  <circle cx="512" cy="512" r="500" fill="#0A162B" />
  
  <defs>
    <!-- Green Swirl Gradients -->
    <linearGradient id="greenGradMain" x1="180" y1="300" x2="490" y2="600" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#00A859" />
      <stop offset="40%" stopColor="#10B981" />
      <stop offset="100%" stopColor="#057A44" />
    </linearGradient>
    <linearGradient id="greenGradShade" x1="200" y1="260" x2="450" y2="580" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#22C55E" />
      <stop offset="60%" stopColor="#10B981" />
      <stop offset="100%" stopColor="#046A38" />
    </linearGradient>

    <!-- Gold/Yellow Swirl Gradients -->
    <linearGradient id="goldGradMain" x1="530" y1="300" x2="840" y2="600" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#F59E0B" />
      <stop offset="40%" stopColor="#FBBF24" />
      <stop offset="100%" stopColor="#D97706" />
    </linearGradient>
    <linearGradient id="goldGradShade" x1="570" y1="260" x2="820" y2="580" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#FCD34D" />
      <stop offset="60%" stopColor="#F59E0B" />
      <stop offset="100%" stopColor="#B45309" />
    </linearGradient>
  </defs>

  <!-- Left Green Infinity Loop Swirls -->
  <g>
    <!-- Outer primary swirl -->
    <path d="M 370 265 C 220 265 188 380 188 475 C 188 570 250 630 370 630 C 465 630 500 560 512 505 C 475 565 425 595 365 595 C 275 595 240 540 240 475 C 240 405 285 320 370 320 C 445 320 482 390 512 445 C 475 340 435 265 370 265 Z" fill="url(#greenGradMain)" />
    <!-- Secondary internal ribbon accent -->
    <path d="M 360 290 C 255 290 215 375 215 470 C 215 545 260 595 345 595 C 410 595 450 550 480 495 C 455 525 410 555 355 555 C 285 555 258 505 258 460 C 258 395 300 335 375 335 C 415 335 448 360 475 405 C 445 330 405 290 360 290 Z" fill="url(#greenGradShade)" opacity="0.9" />
  </g>

  <!-- Right Gold/Yellow Infinity Loop Swirls -->
  <g>
    <!-- Outer primary swirl -->
    <path d="M 654 265 C 804 265 836 380 836 475 C 836 570 774 630 654 630 C 559 630 524 560 512 505 C 549 565 599 595 659 595 C 749 595 784 540 784 475 C 784 405 739 320 654 320 C 579 320 542 390 512 445 C 549 340 589 265 654 265 Z" fill="url(#goldGradMain)" />
    <!-- Secondary internal ribbon accent -->
    <path d="M 664 290 C 769 290 809 375 809 470 C 809 545 764 595 679 595 C 614 595 574 550 544 495 C 569 525 614 555 669 555 C 739 555 766 505 766 460 C 766 395 724 335 649 335 C 609 335 576 360 549 405 C 579 330 619 290 664 290 Z" fill="url(#goldGradShade)" opacity="0.9" />
  </g>

  <!-- Central Isometric 3D Delivery Box -->
  <g transform="translate(422, 342)">
    <!-- Top Face -->
    <polygon points="90,0 180,48 90,96 0,48" fill="#FFFFFF" stroke="#0A162B" stroke-width="6" stroke-linejoin="round" />
    <!-- Left Face -->
    <polygon points="0,48 90,96 90,192 0,144" fill="#E2E8F0" stroke="#0A162B" stroke-width="6" stroke-linejoin="round" />
    <!-- Right Face -->
    <polygon points="90,96 180,48 180,144 90,192" fill="#CBD5E1" stroke="#0A162B" stroke-width="6" stroke-linejoin="round" />
    <!-- Top Box Tape / Seam -->
    <line x1="45" y1="24" x2="135" y2="72" stroke="#0A162B" stroke-width="9" stroke-linecap="round" />
    <!-- Front Box Tape / Fold Tab -->
    <polygon points="86,75 94,80 94,115 86,110" fill="#0A162B" />
  </g>

  <!-- LIENCOLIS Brand Wordmark (White Sans-Serif Bold Tracking) -->
  <text 
    x="512" 
    y="775" 
    text-anchor="middle" 
    fill="#FFFFFF" 
    font-family="'Plus Jakarta Sans', 'Outfit', 'Montserrat', -apple-system, sans-serif" 
    font-size="96" 
    font-weight="900" 
    letter-spacing="9"
  >
    LIENCOLIS
  </text>
</svg>
`;

const maskableSvgContent = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Full Maskable Background -->
  <rect width="1024" height="1024" fill="#0A162B" />
  
  <g transform="translate(102, 102) scale(0.8)">
    ${svgContent.replace(/<\/?svg[^>]*>/g, '')}
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.resolve(process.cwd(), 'public');

  // 1. Write SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent.trim());
  console.log('Written icon.svg');

  // 2. Render 192x192 PNG
  await sharp(Buffer.from(svgContent))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  // 3. Render 512x512 PNG
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  // 4. Render Apple Touch Icon (180x180)
  await sharp(Buffer.from(svgContent))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 5. Render Maskable 512x512 PNG (Safe zone padded)
  await sharp(Buffer.from(maskableSvgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('Generated icon-maskable-512.png');

  // 6. Render Favicon 64x64 PNG
  await sharp(Buffer.from(svgContent))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');

  // 7. Android Mipmaps
  const androidResDir = path.resolve(process.cwd(), 'android/app/src/main/res');
  if (fs.existsSync(androidResDir)) {
    const densities = [
      { name: 'mipmap-mdpi', size: 48 },
      { name: 'mipmap-hdpi', size: 72 },
      { name: 'mipmap-xhdpi', size: 96 },
      { name: 'mipmap-xxhdpi', size: 144 },
      { name: 'mipmap-xxxhdpi', size: 192 },
    ];

    for (const d of densities) {
      const folder = path.join(androidResDir, d.name);
      if (fs.existsSync(folder)) {
        await sharp(Buffer.from(svgContent))
          .resize(d.size, d.size)
          .png()
          .toFile(path.join(folder, 'ic_launcher.png'));
        await sharp(Buffer.from(svgContent))
          .resize(d.size, d.size)
          .png()
          .toFile(path.join(folder, 'ic_launcher_round.png'));
        await sharp(Buffer.from(maskableSvgContent))
          .resize(d.size, d.size)
          .png()
          .toFile(path.join(folder, 'ic_launcher_foreground.png'));
      }
    }
    console.log('Generated Android res mipmap icons for all resolutions');
  }
}

generate().catch(console.error);
