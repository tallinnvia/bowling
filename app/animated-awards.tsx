'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AwardRow} from '../lib/awards';
const fmt=(n:number)=>n.toLocaleString('et-EE',{maximumFractionDigits:2});
function RollingScore({score}:{score:number}){
 const [shown,setShown]=useState(score);
 const previous=useRef(score);
 useLayoutEffect(()=>{
  const start=previous.current;
  previous.current=score;
  if(start===score||window.matchMedia('(prefers-reduced-motion: reduce)').matches){setShown(score);return}
  let frame=0;
  const begin=performance.now(),whole=Number.isInteger(start)&&Number.isInteger(score);
  const tick=(now:number)=>{
   const progress=Math.min(1,(now-begin)/300);
   const value=start+(score-start)*progress;
   setShown(progress===1?score:whole?Math.round(value):Math.round(value*10)/10);
   if(progress<1)frame=requestAnimationFrame(tick);
  };
  setShown(start);frame=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(frame);
 },[score]);
 return <>{fmt(shown)}</>;
}
type Position={top:number;left:number;score:number;rank:number};
export function AwardList({rows,count,compact=false,arena=false}:{rows:AwardRow[];count:number;compact?:boolean;arena?:boolean}){
 const list=useRef<HTMLOListElement>(null),previous=useRef(new Map<string,Position>()),running=useRef(new Set<Animation>());
 const signature=JSON.stringify(rows.map(r=>[r.id,r.name,r.detail,r.score]));
 useEffect(()=>{const reset=()=>{running.current.forEach(a=>a.cancel());running.current.clear();previous.current.clear()};window.addEventListener('resize',reset);return()=>{window.removeEventListener('resize',reset);reset()}},[]);
 useLayoutEffect(()=>{
  const nodes=list.current?.querySelectorAll<HTMLElement>('[data-award-id]');if(!nodes)return;
  running.current.forEach(a=>a.cancel());running.current.clear();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate=previous.current.size>0&&!reduced;
  const next=new Map<string,Position>();
  function play(element:HTMLElement,frames:Keyframe[],options:KeyframeAnimationOptions){
   const animation=element.animate(frames,options);running.current.add(animation);const clear=()=>{running.current.delete(animation);element.style.zIndex='';element.style.willChange=''};animation.onfinish=clear;animation.oncancel=clear;
  }
  nodes.forEach((node,index)=>{
   const id=node.dataset.awardId!,row=rows.find(r=>r.id===id);if(!row)return;
   const rect=node.getBoundingClientRect(),old=previous.current.get(id);
   next.set(id,{top:rect.top,left:rect.left,score:row.score,rank:row.rank});
   if(!animate)return;
   if(old){
    const dy=old.top-rect.top,dx=old.left-rect.left,moved=Math.abs(dy)>2||Math.abs(dx)>2;
    if(moved){
     const climbing=row.rank<old.rank;
     node.style.zIndex=climbing?'5':'1';node.style.willChange='transform';
     // FLIP: start at the previous slot, arc above the other rows, then settle in the new slot.
     play(node,[{transform:`translate(${dx}px,${dy}px) scale(1)`,offset:0},{transform:`translate(${dx+(climbing?18:-8)}px,${dy*.52}px) scale(${climbing?1.025:0.985})`,offset:.48},{transform:'translate(0,0) scale(1)',offset:1}],{duration:arena?700:climbing?1050:900,delay:arena?300:0,fill:'backwards',easing:'cubic-bezier(.22,.75,.18,1)'});
    }
    if(!arena&&old.score!==row.score){const score=node.querySelector<HTMLElement>('.award-score');if(score)play(score,[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.16)',filter:'brightness(1.2)',offset:.35},{transform:'scale(1)',filter:'brightness(1)'}],{duration:850,easing:'ease-out'})}
    if(row.rank<old.rank){const badge=node.querySelector<HTMLElement>('.award-rank');if(badge)play(badge,[{boxShadow:'0 0 0 0 rgba(235,183,0,.6)'},{boxShadow:'0 0 0 13px rgba(235,183,0,0)'}],{duration:1100,easing:'ease-out'})}
   }else{
    node.style.zIndex='4';
    play(node,[{opacity:0,transform:'translate(28px,42px) scale(.96)'},{opacity:1,transform:'translate(-4px,-3px) scale(1.015)',offset:.7},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:850,delay:index*30,easing:'cubic-bezier(.22,.75,.18,1)'});
   }
  });
  previous.current=next;
 },[signature,arena]);
 return <ol ref={list} className={'award-list animated-award-list '+(compact?'compact':'')}>{Array.from({length:count},(_,i)=>{const row=rows[i];return <li key={row?.id??'empty-'+i} data-award-id={row?.id} className={'award-row position-'+(i+1)+(row?'':' unfilled')} data-testid="award-row"><span className="award-rank">{i+1}</span><div className="award-person"><strong>{row?.name??'—'}</strong>{row?.detail&&<span>{row.detail}</span>}</div><b className="award-score">{row?(arena?<RollingScore score={row.score}/>:fmt(row.score)):'—'}</b></li>})}</ol>;
}
export function SpecialAward({title,row}:{title:string;row?:AwardRow}){
 const element=useRef<HTMLDivElement>(null),previous=useRef<string|null>(null);
 const signature=row?JSON.stringify([row.id,row.name,row.score]):null;
 useEffect(()=>{const changed=previous.current!==null&&signature!==previous.current;previous.current=signature;if(!changed||!row||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const animation=element.current?.animate([{opacity:.45,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'ease-out'});return()=>animation?.cancel()},[signature]);
 return <div ref={element} className="special-result" data-testid="special-result"><h3>{title}</h3><div className="special-result-value"><div className="award-person"><strong>{row?.name??'—'}</strong>{row?.detail&&<span>{row.detail}</span>}</div><b className="award-score">{row?(row.scores??[row.score]).map(fmt).join(' / '):'—'}</b></div></div>;
}
