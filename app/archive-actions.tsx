'use client';
import {useEffect,useRef,useState} from 'react';
import {Archive,Check,ArrowUpRight} from 'lucide-react';
import {apiFetch} from './client-api';
import {formatDate,type ArchiveEntry} from '../lib/archive-model';
import type {State} from '../lib/scoring';

export async function archiveRequest<T>(path:string,options?:RequestInit):Promise<T>{
  const response=await apiFetch('/api/archive'+path,options);
  const data=await response.json() as T & {error?:string};
  if(!response.ok)throw Error(data.error || 'Arhiivi laadimine ebaõnnestus.');
  return data;
}
export const archivePost=<T,>(value:unknown)=>archiveRequest<T>('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
export type EventResponse={state:State;revision:string;active?:boolean;lastArchive?:ArchiveEntry|null;entry?:ArchiveEntry};
export function ArchiveActions({data,revision,active,dirty,last,onSaved}:{data:State;revision:string;active:boolean;dirty:boolean;last?:ArchiveEntry|null;onSaved:(result:EventResponse)=>void}){
  const [panel,setPanel]=useState<'close'|'start'|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[base,setBase]=useState({revision:'',lanes:''});
  const [name,setName]=useState(''),[date,setDate]=useState(''),[carry,setCarry]=useState(true);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(panel&&!dialog.current?.open)dialog.current?.showModal();if(!panel&&dialog.current?.open)dialog.current.close()},[panel]);
  const players=data.teams.flatMap(t=>t.players),pending=players.filter(p=>!(p.score&&p.score>0)).length;
  async function open(){
    setError('');setBusy(true);
    try{
      if(active){
        const res=await apiFetch('/api/hall/lanes');
        if(!res.ok)throw Error('Rajajaotuse laadimine ebaõnnestus.');
        const {revision:lanes}=await res.json() as {revision:string};
        setBase({revision,lanes});setPanel('close');
      }else{setBase({revision,lanes:''});setName('');setDate('');setPanel('start')}
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function submit(){
    setBusy(true);setError('');
    try{
      const result=await archivePost<EventResponse>(panel==='start'?{action:'start',revision:base.revision,title:name,date,carry}:{action:'close',revision:base.revision,laneRevision:base.lanes});
      setPanel(null);onSaved(result);
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  return <section className="archive-action panel"><div className="archive-action-icon"><Archive size={23}/></div><div className="archive-action-copy"><h2>{active?'Võistluse lõpetamine':'Võistlus on arhiveeritud'}</h2>
    {active?<p>{dirty?'Avalda pooleliolevad muudatused enne arhiveerimist.':'Kinnitatud tulemused jäävad võistluse aasta järgi arhiivi.'}</p>:last&&<a href={'./'+last.year+'/?voistlus='+last.id}>Ava {last.year}. aasta tulemused <ArrowUpRight size={15}/></a>}</div>
    <button className="button outline" disabled={busy||dirty||(active&&!data.teams.length)} onClick={open}>{active?'Arhiveeri võistlus':'Alusta uut võistlust'}</button>
    {!panel&&error&&<p role="alert">{error}</p>}
    <dialog ref={dialog} className="archive-dialog" aria-labelledby="archive-dialog-heading" onCancel={e=>{if(busy)e.preventDefault();else setPanel(null)}}>
    <form onSubmit={e=>{e.preventDefault();void submit()}}>
    <h2 id="archive-dialog-heading">{panel==='start'?'Uus võistlus':'Kinnita lõpptulemused'}</h2>
    {panel==='start'?<><label>Võistluse nimi<input autoFocus required maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label><label>Kuupäev<input required type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label className="archive-check"><input type="checkbox" checked={carry} onChange={e=>setCarry(e.target.checked)}/>Too eelmise võistluse koosseisud üle</label></>:
    <><strong>{data.title}</strong><p>{formatDate(data.date)} · {data.teams.length} võistkonda · {players.length} võistlejat</p>
    {data.title.match(/\b(?:19|20)\d{2}/g)?.some(y=>y!==data.date.slice(0,4))&&<p className="archive-warning">Pealkirjas ja kuupäevas on erinev aasta. Kontrolli enne kinnitamist seadetes võistluse kuupäeva.</p>}
    {pending>0&&<p className="archive-warning">{pending} võistlejal on tulemus sisestamata või 0. Nad jäävad koosseisu, kuid ei osale edetabelis.</p>}
    <p>Arhiiviaadress on <b>bowling.tallinnvia.ee/{data.date.slice(0,4)}</b>. Saaliekraanil lõpeb tulemuste kuvamine.</p></>}
    {error&&<p role="alert">{error}</p>}<div className="tools"><button type="button" className="button outline" disabled={busy} onClick={()=>setPanel(null)}>Loobu</button><button className="button primary" disabled={busy||base.revision!==revision}>{busy?'Salvestan…':panel==='start'?'Alusta võistlust':'Kinnita ja arhiveeri'}</button></div>
    {base.revision!==revision&&<p role="alert">Avaldatud seis muutus. Sulge aken ja kontrolli kokkuvõtet uuesti.</p>}</form></dialog></section>
}
