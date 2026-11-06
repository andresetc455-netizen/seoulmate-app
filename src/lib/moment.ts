// "Momentos" de Ships: convierte la escena en pantalla en una imagen PNG (fondo, personajes, gatito, emojis y texto)
// para guardarla en la galería o compartirla.
const SCENE_BG: Record<string, [string, string]> = {
  stage: ['#f3e7ec', '#e9dbe6'],
  cafe: ['#f3e3d3', '#e6cdb7'],
  night: ['#2d1f3a', '#5a3352'],
  rain: ['#cfd3e0', '#eceaf1'],
  park: ['#f8e9ea', '#e3ead9'],
  wedding: ['#faf1e6', '#efdfe2'],
  kitchen: ['#f8efe4', '#ead9c6'],
  karaoke: ['#3a1d36', '#1f1424'],
  sofa: ['#efe6ef', '#ddd0e2'],
  booth: ['#f7e9ea', '#f1dfe2'],
  city: ['#f6d9cf', '#c9bbdc'],
};

function svgToImage(svg: SVGSVGElement, w: number, h: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo dibujar la escena'));
    };
    img.src = url;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

export async function renderMoment(stage: HTMLElement, scene: string, title: string, line: string): Promise<string> {
  const scale = 2;
  const box = stage.getBoundingClientRect();
  const W = Math.round(box.width);
  const H = Math.round(box.height);
  const footer = 110;
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = (H + footer) * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Este navegador no puede crear imágenes');
  ctx.scale(scale, scale);

  const [a, b] = SCENE_BG[scene] ?? SCENE_BG.stage;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Capas en el orden del documento: decorados, emojis, personajes y gatito.
  const nodes = stage.querySelectorAll<HTMLElement | SVGSVGElement>('[data-snap], [data-snap-wrap] > svg, .ship-cat svg');
  for (const el of Array.from(nodes)) {
    const r = el.getBoundingClientRect();
    const x = r.left - box.left;
    const y = r.top - box.top;
    if (el instanceof HTMLImageElement) {
      // Foto con object-fit: cover dentro de su marco.
      const iw = el.naturalWidth;
      const ih = el.naturalHeight;
      if (!iw || !ih) continue;
      const k = Math.max(r.width / iw, r.height / ih);
      const sw = r.width / k;
      const sh = r.height / k;
      // Marco blanco con sombra, como en pantalla.
      ctx.save();
      ctx.shadowColor = 'rgba(74, 58, 116, 0.28)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(x - 4, y - 4, r.width + 8, r.height + 8, 18);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, r.width, r.height, 14);
      ctx.clip();
      ctx.drawImage(el, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, r.width, r.height);
      ctx.restore();
      continue;
    }
    if (el instanceof SVGSVGElement) {
      try {
        ctx.drawImage(await svgToImage(el, r.width, r.height), x, y, r.width, r.height);
      } catch {
        /* se omite esa capa */
      }
    } else {
      const cs = getComputedStyle(el);
      if (cs.opacity === '0') continue;
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (el.dataset.snap === 'label') {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        const tw = ctx.measureText(el.textContent ?? '').width + 14;
        ctx.beginPath();
        ctx.roundRect(x + r.width / 2 - tw / 2, y, tw, r.height, r.height / 2);
        ctx.fill();
        ctx.fillStyle = '#6b2738';
      } else ctx.fillStyle = '#000';
      ctx.fillText(el.textContent ?? '', x + r.width / 2, y + r.height / 2);
    }
  }

  ctx.fillStyle = '#fbf6f0';
  ctx.fillRect(0, H, W, footer);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#6b2738';
  ctx.font = 'italic 600 24px "Cormorant Garamond", serif';
  ctx.fillText(title, W / 2, H + 30);
  ctx.font = '500 13px Manrope, sans-serif';
  ctx.fillStyle = '#5a4a50';
  wrap(ctx, line, W - 30).forEach((l, i) => ctx.fillText(l, W / 2, H + 52 + i * 17));
  ctx.font = '700 9px Manrope, sans-serif';
  ctx.fillStyle = '#b48d55';
  ctx.fillText('S E O U L M A T E', W / 2, H + footer - 10);
  return canvas.toDataURL('image/jpeg', 0.9);
}

export async function shareImage(dataUrl: string, name: string, text: string): Promise<'shared' | 'downloaded'> {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], name, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text });
      return 'shared';
    } catch {
      /* cancelado: se descarga */
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'downloaded';
}
