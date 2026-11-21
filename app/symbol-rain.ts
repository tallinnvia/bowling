// Measure the actual letters on each board so team names and scores land in place.
type Glyph = {
  text:string; x:number; y:number; height:number; font:string; color:string;
  delay:number; drift:number;
};
const flight = 530, stagger = 350, phase = flight + stagger;

function collectGlyphs(stage:HTMLElement, width:number, height:number) {
  const glyphs:Glyph[] = [];
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const segmenter = new Intl.Segmenter('et', {granularity:'grapheme'});
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement, text = node.textContent;
    if (!parent || !text?.trim() || parent.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue;
    const style = getComputedStyle(parent);
    if (style.visibility !== 'visible' || !parent.getClientRects().length) continue;
    const font = [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily].join(' ');
    for (const {segment,index} of segmenter.segment(text)) {
      if (!segment.trim()) continue;
      range.setStart(node,index);
      range.setEnd(node,index+segment.length);
      const rect = range.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.right<=0 || rect.left>=width || rect.bottom<=0 || rect.top>=height) continue;
      const letter = style.textTransform === 'uppercase' ? segment.toLocaleUpperCase('et')
        : style.textTransform === 'lowercase' ? segment.toLocaleLowerCase('et') : segment;
      glyphs.push({text:letter, x:rect.left, y:rect.top+rect.height/2, height:rect.height,
        font, color:style.color, delay:Math.random()*stagger, drift:(Math.random()-.5)*48});
    }
  }
  return glyphs;
}

export function startSymbolRain(stage:HTMLElement, swap:()=>void, reveal:()=>void, motion:MediaQueryList) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof Intl.Segmenter !== 'function') { reveal(); return }
  const width = innerWidth, height = innerHeight;
  const scale = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width*scale);
  canvas.height = Math.round(height*scale);
  canvas.className = 'hall-rain';
  canvas.setAttribute('aria-hidden','true');
  ctx.scale(scale,scale);
  ctx.textBaseline = 'middle';
  let glyphs = collectGlyphs(stage,width,height);
  let incoming = false, frame = 0, start = performance.now();
  stage.parentElement!.appendChild(canvas);
  stage.classList.add('hall-rain-active');

  function clean() {
    cancelAnimationFrame(frame);
    canvas.remove();
    stage.classList.remove('hall-rain-active');
    stage.style.removeProperty('opacity');
    motion.removeEventListener('change',finish);
    window.removeEventListener('resize',finish);
    document.removeEventListener('visibilitychange',onVisibility);
  }
  function finish() { clean(); reveal() }
  function onVisibility() { if (document.hidden) finish() }
  function draw(now:number) {
    let elapsed = Math.max(0,now-start);
    if (elapsed >= phase) {
      if (incoming) { clean(); return }
      incoming = true;
      stage.classList.remove('hall-rain-active');
      swap();
      glyphs = collectGlyphs(stage,width,height);
      stage.classList.add('hall-rain-active');
      start = performance.now();
      elapsed = 0;
    }
    ctx!.clearRect(0,0,width,height);
    const shellOpacity = incoming ? Math.min(1,elapsed/190) : Math.min(1,(phase-elapsed)/190);
    stage.style.opacity = String(shellOpacity);
    for (const g of glyphs) {
      const t = Math.max(0,Math.min(1,(elapsed-g.delay)/flight));
      // Downward acceleration on departure, then a soft landing on arrival.
      const y = incoming ? g.y - (g.y+g.height)*(1-t)*(1-t) : g.y+(height-g.y+g.height)*t*t;
      if (y < -g.height || y > height+g.height) continue;
      ctx!.font = g.font;
      ctx!.fillStyle = g.color;
      ctx!.fillText(g.text,g.x+Math.sin(Math.PI*t)*g.drift,y);
    }
    frame = requestAnimationFrame(draw);
  }
  motion.addEventListener('change',finish);
  window.addEventListener('resize',finish);
  document.addEventListener('visibilitychange',onVisibility);
  draw(start);
  return clean;
}
