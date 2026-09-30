import { AiThumbnailStyle } from '../types/youtube';

export interface GenerateThumbnailOptions {
  style: AiThumbnailStyle;
  title: string;
  hookText?: string;
  customPrompt?: string;
  isShort?: boolean;
  backgroundImageUrl?: string;
  badgeColor?: 'red' | 'yellow' | 'cyan' | 'purple' | 'emerald';
}

export const AI_THUMBNAIL_PRESETS: {
  id: AiThumbnailStyle;
  name: string;
  badge: string;
  description: string;
  accent: string;
  defaultHook: string;
  bgAsset?: string;
}[] = [
  {
    id: 'tech-minimalist',
    name: 'AI Tech & Hologram',
    badge: 'Photorealistic AI',
    description: 'Cinematic 3D futuristic workspace with glowing cyan & violet holographic HUD elements.',
    accent: '#06b6d4',
    defaultHook: 'NEW 2026',
    bgAsset: '/src/assets/images/yt_thumb_tech_ai_1790724690916.jpg',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    badge: 'High CTR',
    description: 'Intense dual-tone magenta & electric blue lighting with digital grid & particle sparks.',
    accent: '#ec4899',
    defaultHook: 'DON’T MISS THIS',
  },
  {
    id: 'cinematic-3d',
    name: 'Cinematic Studio 3D',
    badge: 'Trending',
    description: 'Deep obsidian backdrop with warm amber rim light, floating 3D geometry & studio bokeh.',
    accent: '#f59e0b',
    defaultHook: 'GAME CHANGER',
  },
  {
    id: 'high-voltage',
    name: 'High-Voltage Action',
    badge: 'Viral Hook',
    description: 'Dynamic crimson & flame-orange radial energy burst with dramatic high-contrast vignette.',
    accent: '#ef4444',
    defaultHook: 'MUST WATCH',
  },
  {
    id: 'gold-luxury',
    name: 'Masterclass Gold',
    badge: 'Premium',
    description: 'Polished obsidian black with metallic champagne gold highlights & sleek prestige typography.',
    accent: '#eab308',
    defaultHook: 'FULL GUIDE',
  },
  {
    id: 'dramatic-creator',
    name: 'Deep Space Violet',
    badge: 'Creator Pick',
    description: 'Cosmic deep violet and ultraviolet glow waves with floating star clusters & neon accents.',
    accent: '#8b5cf6',
    defaultHook: '10X RESULTS',
  },
];

/**
 * Procedural Gen-AI Engine for High-CTR YouTube Thumbnails
 * Generates pristine 1280x720 (16:9) or 720x1280 (9:16) image data URLs
 */
export async function renderGenAiThumbnail(options: GenerateThumbnailOptions): Promise<string> {
  const {
    style,
    title,
    hookText = 'MUST WATCH',
    isShort = false,
    backgroundImageUrl,
    badgeColor = 'yellow',
  } = options;

  const width = isShort ? 720 : 1280;
  const height = isShort ? 1280 : 720;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // 1. If a background asset is available, draw it first
  let drewImage = false;
  const targetBg = backgroundImageUrl || (style === 'tech-minimalist' ? '/src/assets/images/yt_thumb_tech_ai_1790724690916.jpg' : undefined);

  if (targetBg) {
    try {
      const img = await loadImage(targetBg);
      // Cover fit
      const scale = Math.max(width / img.width, height / img.height);
      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      drewImage = true;
    } catch (e) {
      console.warn('Could not load base image asset, rendering procedural background:', e);
    }
  }

  // 2. Procedural Stylized Background Generation (if no image or for artistic blend)
  if (!drewImage) {
    drawProceduralBackground(ctx, width, height, style);
  } else {
    // Add cinematic gradient tint over the image to guarantee text readability
    const overlayGrad = ctx.createLinearGradient(0, height * 0.4, 0, height);
    overlayGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    overlayGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)');
    overlayGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Draw Stylized Lighting & Vignette
  drawLightingAndAtmosphere(ctx, width, height, style);

  // 4. Draw Graphic Accents (HUD brackets, particles, neon frames)
  drawGraphicAccents(ctx, width, height, style, isShort);

  // 5. Draw High-CTR Typography & Hook Badges
  drawThumbnailTypography(ctx, width, height, title, hookText, badgeColor, isShort);

  return canvas.toDataURL('image/jpeg', 0.94);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function drawProceduralBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: AiThumbnailStyle
) {
  // Base dark gradient
  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 50, w * 0.5, h * 0.5, Math.max(w, h));

  switch (style) {
    case 'cyberpunk-neon':
      bgGrad.addColorStop(0, '#1e1035');
      bgGrad.addColorStop(0.5, '#0d071a');
      bgGrad.addColorStop(1, '#05020a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Cyberpunk Grid floor
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 1.5;
      const horizonY = h * 0.55;
      for (let i = 0; i < 16; i++) {
        const x = (w / 16) * i;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, horizonY);
        ctx.lineTo(x * 1.6 - w * 0.3, h);
        ctx.stroke();
      }
      for (let y = horizonY + 20; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      break;

    case 'high-voltage':
      bgGrad.addColorStop(0, '#450a0a');
      bgGrad.addColorStop(0.5, '#1c0505');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Radial speed rays
      ctx.save();
      ctx.translate(w * 0.5, h * 0.45);
      const rays = 24;
      for (let i = 0; i < rays; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(249, 115, 22, 0.04)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, Math.max(w, h), (i * Math.PI * 2) / rays, ((i + 0.6) * Math.PI * 2) / rays);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      break;

    case 'gold-luxury':
      bgGrad.addColorStop(0, '#1c160c');
      bgGrad.addColorStop(0.6, '#0d0a06');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
      break;

    case 'dramatic-creator':
      bgGrad.addColorStop(0, '#2e1065');
      bgGrad.addColorStop(0.5, '#130426');
      bgGrad.addColorStop(1, '#030008');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
      break;

    case 'cinematic-3d':
    default:
      bgGrad.addColorStop(0, '#1c1917');
      bgGrad.addColorStop(0.6, '#0c0a09');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
      break;
  }
}

function drawLightingAndAtmosphere(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: AiThumbnailStyle
) {
  // Volumetric glow orb 1 (top left / rim)
  const glow1 = ctx.createRadialGradient(w * 0.25, h * 0.3, 0, w * 0.25, h * 0.3, w * 0.45);
  const color1 =
    style === 'cyberpunk-neon'
      ? 'rgba(236, 72, 153, 0.35)'
      : style === 'high-voltage'
      ? 'rgba(239, 68, 68, 0.4)'
      : style === 'gold-luxury'
      ? 'rgba(234, 179, 8, 0.3)'
      : style === 'dramatic-creator'
      ? 'rgba(139, 92, 246, 0.4)'
      : 'rgba(6, 182, 212, 0.35)';

  glow1.addColorStop(0, color1);
  glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, w, h);

  // Volumetric glow orb 2 (bottom right / key)
  const glow2 = ctx.createRadialGradient(w * 0.8, h * 0.65, 0, w * 0.8, h * 0.65, w * 0.5);
  const color2 =
    style === 'cyberpunk-neon'
      ? 'rgba(6, 182, 212, 0.35)'
      : style === 'high-voltage'
      ? 'rgba(249, 115, 22, 0.35)'
      : style === 'gold-luxury'
      ? 'rgba(245, 158, 11, 0.25)'
      : style === 'dramatic-creator'
      ? 'rgba(217, 70, 239, 0.3)'
      : 'rgba(59, 130, 246, 0.3)';

  glow2.addColorStop(0, color2);
  glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, w, h);

  // Cinematic Dark Vignette along all edges
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.3, w * 0.5, h * 0.5, w * 0.7);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function drawGraphicAccents(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: AiThumbnailStyle,
  isShort: boolean
) {
  ctx.save();

  // Floating bokeh particles
  const particleColor =
    style === 'cyberpunk-neon'
      ? 'rgba(6, 182, 212, 0.6)'
      : style === 'high-voltage'
      ? 'rgba(249, 115, 22, 0.6)'
      : style === 'gold-luxury'
      ? 'rgba(234, 179, 8, 0.6)'
      : 'rgba(255, 255, 255, 0.5)';

  for (let i = 0; i < 24; i++) {
    const px = (Math.sin(i * 99) * 0.5 + 0.5) * w;
    const py = (Math.cos(i * 33) * 0.5 + 0.5) * h;
    const r = ((i % 4) + 1.5);
    ctx.fillStyle = particleColor;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Futuristic HUD Corner Brackets
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 3;
  const pad = isShort ? 25 : 35;
  const bracketLen = isShort ? 30 : 50;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(pad, pad + bracketLen);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad + bracketLen, pad);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(w - pad - bracketLen, pad);
  ctx.lineTo(w - pad, pad);
  ctx.lineTo(w - pad, pad + bracketLen);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(pad, h - pad - bracketLen);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(pad + bracketLen, h - pad);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(w - pad - bracketLen, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.lineTo(w - pad, h - pad - bracketLen);
  ctx.stroke();

  ctx.restore();
}

function drawThumbnailTypography(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rawTitle: string,
  rawHook: string,
  badgeColor: string,
  isShort: boolean
) {
  ctx.save();

  // 1. Draw Top/Upper Hook Badge
  const hook = (rawHook || 'MUST WATCH').toUpperCase().trim();
  if (hook) {
    const badgeFontSize = Math.round(isShort ? h * 0.038 : h * 0.055);
    ctx.font = `900 ${badgeFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

    const metrics = ctx.measureText(hook);
    const padX = badgeFontSize * 0.7;
    const padY = badgeFontSize * 0.35;
    const boxW = metrics.width + padX * 2;
    const boxH = badgeFontSize + padY * 1.6;

    const boxX = isShort ? (w - boxW) / 2 : 45;
    const boxY = isShort ? h * 0.12 : 45;

    // Glowing badge shadow
    ctx.shadowColor =
      badgeColor === 'yellow'
        ? 'rgba(234, 179, 8, 0.7)'
        : badgeColor === 'cyan'
        ? 'rgba(6, 182, 212, 0.7)'
        : badgeColor === 'purple'
        ? 'rgba(168, 85, 247, 0.7)'
        : badgeColor === 'emerald'
        ? 'rgba(16, 185, 129, 0.7)'
        : 'rgba(239, 68, 68, 0.7)';
    ctx.shadowBlur = 25;

    // Badge Fill
    ctx.fillStyle =
      badgeColor === 'yellow'
        ? '#facc15'
        : badgeColor === 'cyan'
        ? '#06b6d4'
        : badgeColor === 'purple'
        ? '#a855f7'
        : badgeColor === 'emerald'
        ? '#10b981'
        : '#ef4444';

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 12);
    ctx.fill();

    // Badge Text
    ctx.shadowBlur = 0;
    ctx.fillStyle = badgeColor === 'yellow' ? '#000000' : '#ffffff';
    ctx.fillText(hook, boxX + padX, boxY + boxH - padY * 1.3);
  }

  // 2. Draw Main Title Punchline
  const cleanTitle = rawTitle.replace(/\.[^/.]+$/, '').trim();
  const words = cleanTitle.split(/\s+/);
  
  // Condense to maximum 2-3 high-impact lines
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > (isShort ? 14 : 20)) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
      if (lines.length >= 2) break;
    } else {
      currentLine += ' ' + word;
    }
  }
  if (currentLine && lines.length < 3) {
    lines.push(currentLine.trim());
  }
  if (lines.length === 0) {
    lines.push('ULTIMATE BREAKDOWN');
  }

  const titleFontSize = Math.round(isShort ? h * 0.052 : h * 0.088);
  ctx.font = `900 ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Impact", "Segoe UI", Roboto, sans-serif`;

  const startY = isShort ? h * 0.65 : h * 0.62;
  const lineHeight = titleFontSize * 1.15;

  lines.forEach((line, idx) => {
    const textUpper = line.toUpperCase();
    const metrics = ctx.measureText(textUpper);

    const textX = isShort ? (w - metrics.width) / 2 : 45;
    const textY = startY + idx * lineHeight;

    // Draw heavy 3D drop-shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;

    // Black stroke border for extreme contrast
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.round(titleFontSize * 0.16);
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2;
    ctx.strokeText(textUpper, textX, textY);

    // Text Fill (White on top, golden-yellow on last line for punch)
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (idx === lines.length - 1 && lines.length > 1) {
      const textGrad = ctx.createLinearGradient(textX, textY - titleFontSize, textX, textY);
      textGrad.addColorStop(0, '#fef08a');
      textGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = textGrad;
    } else {
      ctx.fillStyle = '#ffffff';
    }

    ctx.fillText(textUpper, textX, textY);
  });

  ctx.restore();
}
