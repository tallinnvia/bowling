'use client';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { startSymbolRain } from './symbol-rain';
import type { TransitionStyle } from '../lib/scoring';
import type { Screen } from '../lib/hall';

// A single marbled pigment layer is drawn once; the compositor moves it during each wipe.
function paintSwirl(canvas: HTMLCanvasElement) {
  if (canvas.dataset.painted) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const size = canvas.width, pixels = context.createImageData(size, size);
  const colors = [[13,34,64],[0,51,141],[64,124,202],[0,51,141],[13,34,64],[122,37,130],[235,183,0],[255,229,137],[235,183,0],[13,34,64]];
  for (let y=0; y<size; y++) {
    for (let x=0; x<size; x++) {
      const dx=(x+.5)*2/size-1, dy=(y+.5)*2/size-1;
      const radius=Math.hypot(dx,dy), angle=Math.atan2(dy,dx);
      const bend=angle + 3.8*Math.exp(-1.9*radius) + .16*Math.sin(4*angle+9*radius);
      const ripple=.22*Math.sin(2*bend-8*radius)+.09*Math.sin(7*bend+12*radius);
      const phase=3*bend/(2*Math.PI)+radius*1.4+ripple;
      const band=(phase-Math.floor(phase))*colors.length, index=Math.floor(band);
      const a=colors[index], b=colors[(index+1)%colors.length];
      const mix=Math.min(1,Math.max(0,(band-index-.25)*2));
      const offset=(y*size+x)*4;
      for(let ch=0; ch<3; ch++) pixels.data[offset+ch]=a[ch]+(b[ch]-a[ch])*mix;
      const edge=.92+.045*Math.sin(3*bend)+.018*Math.sin(7*bend);
      pixels.data[offset+3]=255*Math.min(1,Math.max(0,(edge-radius)*18));
    }
  }
  context.putImageData(pixels,0,0);
  canvas.dataset.painted='true';
}

export function ScreenTransition({ target, effect, children }: { target: Screen; effect: TransitionStyle; children: (mode: Screen) => ReactNode }) {
  const [shown,setShown]=useState(target);
  const current=useRef(target), paint=useRef<HTMLCanvasElement>(null), stage=useRef<HTMLDivElement>(null);
  const preference=useRef(effect);
  useLayoutEffect(()=>{preference.current=effect},[effect]);
  useLayoutEffect(() => {
    if (current.current===target) return;
    const reveal=()=>{current.current=target;setShown(target)};
    const layer=paint.current, motion=matchMedia('(prefers-reduced-motion: reduce)');
    if (!layer || motion.matches || document.hidden || !layer.animate) {reveal();return}
    if (preference.current==='rain' && stage.current) {
      return startSymbolRain(stage.current, ()=>flushSync(reveal), reveal, motion);
    }
    paintSwirl(layer);
    if (!layer.dataset.painted) {reveal();return}
    const duration=1150;
    const swirl=layer.animate([
      {transform:'translate(-50%,-50%) rotate(-70deg) scale(.015)',opacity:0},
      {transform:'translate(-50%,-50%) rotate(-40deg) scale(.38)',opacity:1,offset:.23},
      {transform:'translate(-50%,-50%) rotate(12deg) scale(1.05)',opacity:1,offset:.45},
      {transform:'translate(-50%,-50%) rotate(36deg) scale(1.05)',opacity:1,offset:.57},
      {transform:'translate(-50%,-50%) rotate(100deg) scale(.015)',opacity:0},
    ],{duration,easing:'ease-in-out'});
    const shift=stage.current?.animate([
      {transform:'scale(1)'},{transform:'scale(1.035) rotate(-1.4deg)',offset:.5},{transform:'scale(1)'}
    ],{duration,easing:'ease-in-out'});
    const timer=setTimeout(reveal,duration/2);
    const finish=()=>{clearTimeout(timer);swirl.cancel();shift?.cancel();reveal()};
    const onVisibility=()=>{if(document.hidden) finish()};
    motion.addEventListener('change',finish);
    document.addEventListener('visibilitychange',onVisibility);
    return ()=>{clearTimeout(timer);swirl.cancel();shift?.cancel();motion.removeEventListener('change',finish);document.removeEventListener('visibilitychange',onVisibility)};
  },[target]);
  return <div className="hall-stage"><div ref={stage}>{children(shown)}</div><canvas ref={paint} width={480} height={480} className="hall-paint" aria-hidden="true"/></div>;
}
