'use client';
import {ArchiveActions,type EventResponse} from './archive-actions';
import {apiFetch} from './client-api';
import {useEffect,useRef,useState} from 'react';
import {Plus,Trash2,Download,Upload,Check,RefreshCw,Maximize2,Monitor,Save,Search,ChevronRight,Pencil,ArrowLeft} from 'lucide-react';
import seed from '../lib/seed.json';
import { LiveBoard } from './lane-board';
import { LaneEditor } from './lane-editor';
import { RefreshControl } from './hall-refresh';
import { EntryHeader, type WorkspaceView } from './hall-control';
import TeamsEditor from './teams-editor';
import {awards,withExcelCategories} from '../lib/awards';
import {State,Team,Player,total,ranked,validate,rosterErrors,normalizeState,teamCategories,playerCategories} from '../lib/scoring';

const fmt=(n:number|null)=>n===null?'–':n.toLocaleString('et-EE',{maximumFractionDigits:2});
const uid=()=>crypto.randomUUID();
const categories:Record<string,string>={All:'Kõik',Open:'Üldarvestus',Women:'Naised',Men:'Mehed',Juniors:'Juuniorid',Unassigned:'Määramata'};
type Envelope=EventResponse & {error?:string};
function localize(state:State):State {
 return normalizeState(withExcelCategories({...state,title:['Lions Bowling','Lionsi bowlinguturniir'].includes(state.title)?'XXXI LIONS BOWLING - 19.11.2026':state.title,subtitle:state.subtitle==='Hosted by LC Tallinn VIA'?'LC Tallinn VIA':state.subtitle}));
}
function download(name:string,text:string,type:string){
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
export default function Bowling({initialMode='display'}:{initialMode?:'admin'|'display'|'display2'|'lanes'|'settings'}){
 const [data,setData]=useState<State>(localize(seed as State));
 const [activeEvent,setActiveEvent]=useState(true),[lastArchive,setLastArchive]=useState<EventResponse['lastArchive']>(null),[laneDirty,setLaneDirty]=useState(false);
 const [revision,setRevision]=useState('initial');
 const published=useRef(data);
 const [mode,setMode]=useState(initialMode);
 const [visitedLanes,setVisitedLanes]=useState(initialMode==='lanes');
 const [focusRequest,setFocusRequest]=useState<{id:string}|null>(null);
 const [errors,setErrors]=useState(new Map<string,string>());
 function selectWorkspace(view:WorkspaceView){
  if(view==='lanes')setVisitedLanes(true);
  setMode(view);
 }
 function navigate(view:WorkspaceView){
  if(view===mode)return;
  window.history.pushState(null,'','?view='+view);
  selectWorkspace(view);
  window.scrollTo(0,0);
 }
 useEffect(()=>{
  if(initialMode!=='admin' && initialMode!=='lanes' && initialMode!=='settings')return;
  function onPop(){
   const query=new URLSearchParams(window.location.search);
   const view=query.get('view')==='admin' && query.get('settings')==='1' ? 'settings' : query.get('view');
   if(view==='admin'||view==='lanes'||view==='settings')selectWorkspace(view);
  }
  window.addEventListener('popstate',onPop);
  return ()=>window.removeEventListener('popstate',onPop);
 },[initialMode]);
 const [dirty,setDirty]=useState(false),[saving,setSaving]=useState(false),[status,setStatus]=useState('Ühendamine');
 const [error,setError]=useState('');
 const settings=mode==='settings';
 const [notice,setNotice]=useState(''),[ready,setReady]=useState(false),[remote,setRemote]=useState(false);
 const dirtyRef=useRef(false),revRef=useRef('initial'),fileRef=useRef<HTMLInputElement>(null);
 function acceptPublished(value:Envelope){
  setActiveEvent(value.active!==false);setLastArchive(value.lastArchive);
  const next=localize(value.state);
  setErrors(previous=>previous.size ? new Map() : previous);
  published.current=next;setData(next);setRevision(value.revision);revRef.current=value.revision;setRemote(false);
 }
 useEffect(()=>{
  let active=true;
  async function poll(){
   try{
    const response=await apiFetch('/api/state',{cache:'no-store'}),value=await response.json() as Envelope;
    if(!response.ok)throw Error(value.error);
    if(!active)return;
    if(dirtyRef.current){if(revRef.current!==value.revision)setRemote(true)}
    else{acceptPublished(value)}
    setReady(true);setStatus('Ühendatud');
   }catch{if(active)setStatus('Ühendus katkenud')}
  }
  poll();const timer=setInterval(poll,3000);
  return()=>{active=false;clearInterval(timer)};
 },[]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(timer)},[notice]);
 useEffect(()=>{
  const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue=''}};
  window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
 },[dirty]);

 const players=data.teams.flatMap(team=>team.players.map(player=>({...player,team:team.name})));
 
 
 function edit(next:State){
  const normalized=normalizeState(next),changed=JSON.stringify(normalized)!==JSON.stringify(published.current);
  setErrors(previous=>{
   if(!previous.size)return previous;
   const current=rosterErrors(normalized.teams);
   return new Map([...previous].filter(([id])=>current.has(id)));
  });
  setData(normalized);setDirty(changed);dirtyRef.current=changed;setError('');setNotice('');
 }
 async function save(){
  if(saving||!dirty||!ready||remote)return;
  if(mode==='admin'){
   const issues=rosterErrors(data.teams);
   setErrors(issues);
   const firstError=issues.keys().next().value;
   if(firstError){setError('');setFocusRequest({id:firstError});return}
  }
  if(!validate(data)){setError('Andmeid ei saa avaldada. Kontrolli võistluse andmeid ja võistkondade suurust.');return}
  setSaving(true);setError('');
  try{
   const response=await apiFetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:data,revision})});
   const value=await response.json() as Envelope;if(!response.ok)throw Error(value.error);
   acceptPublished(value);
   setDirty(false);dirtyRef.current=false;setNotice(settings?'Seaded salvestatud.':'Tulemused avaldatud.');
  }catch(e){setError(e instanceof Error?e.message:'Avaldamine ebaõnnestus. Proovi uuesti.')}
  finally{setSaving(false)}
 }
 async function reload(){
  if(dirty&&!confirm('Kas loobuda avaldamata muudatustest?'))return;
  try{
   const response=await apiFetch('/api/state',{cache:'no-store'}),value=await response.json() as Envelope;
   if(!response.ok)throw Error(value.error);
   acceptPublished(value);
   setDirty(false);dirtyRef.current=false;setError('');setNotice('');
  }catch{setError('Tulemuste laadimine ebaõnnestus. Proovi uuesti.')}
 }
 function csv(){
  const quote=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';
  download('bowlingu-tulemused.csv','\uFEFF'+[['Võistkond','Võistleja','Arvestus','Tulemus'],...players.map(p=>[p.team,p.name,categories[p.category],p.score])].map(row=>row.map(quote).join(';')).join('\r\n'),'text/csv;charset=utf-8');
 }
 async function restore(file?:File){
  if(!file)return;
  try{
   if(file.size>300000)throw Error('Varukoopia on liiga suur.');
   const value=JSON.parse(await file.text()),state=value.state||value;
   if(!validate(state))throw Error('Varukoopia vorming ei sobi.');
   if(!confirm('Kas asendada võistkonnad ja tulemused varukoopiaga?'))return;
   edit(localize(state));setNotice('Varukoopia laaditud. Muudatuste kinnitamiseks avalda tulemused.');
  }catch(e){setError(e instanceof Error?e.message:'Varukoopia laadimine ebaõnnestus.')}
  if(fileRef.current)fileRef.current.value='';
 }
 function afterLifecycle(result:EventResponse){
  acceptPublished(result);setDirty(false);dirtyRef.current=false;setLaneDirty(false);setVisitedLanes(false);setError('');setNotice('');
 }
 const publication=<span className={'publication-state '+(dirty?'pending':'saved')} role="status">{saving||!ready?<RefreshCw size={16} className="spinning"/>:dirty?<span className="pending-dot"/>:<Check size={16}/>} {!ready?'Laadin tulemusi…':saving?'Avaldamine…':dirty?'Avaldamata muudatused':'Kõik avaldatud'}</span>;
 const connection=<span className={'connection '+(status==='Ühendatud'?'online':'')}><i/>{status}</span>;
 if(mode==='display'||mode==='display2')return !activeEvent?<main className="archive-idle"><h1>Aktiivset võistlust ei ole</h1></main>:<LiveBoard data={data} status={status} ready={ready}/>;

 const publishButton=<button className="button primary publish-button" onClick={save} disabled={!ready||!dirty||saving||remote}><Save size={18}/>{saving?'Salvestamine…':settings?'Salvesta seaded':'Avalda tulemused'}</button>;
 if(ready&&!activeEvent)return <div className="admin"><EntryHeader view={mode} navigate={navigate}>{null}</EntryHeader><main>
  {mode!=='settings'?<section className="panel archive-action"><h1>Aktiivset võistlust ei ole</h1><a className="button outline" href="?view=settings">Ava seaded</a></section>:<ArchiveActions data={data} active={false} revision={revision} dirty={false} last={lastArchive} onSaved={afterLifecycle}/>}</main></div>;
 return <>{visitedLanes&&<div hidden={mode!=='lanes'}><LaneEditor onDirty={setLaneDirty} teams={ready?data.teams:[]} navigate={navigate} active={mode==='lanes'}/></div>}
 <div hidden={mode==='lanes'} className={settings ? "admin" : "admin results-entry"} onKeyDown={event=>{if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();if(dirty&&ready&&!saving)void save()}}}>
  {(mode==='admin'||mode==='settings')&&<EntryHeader view={mode} navigate={navigate}>{publishButton}</EntryHeader>}
  <main><fieldset disabled={!ready||saving} className="admin-fieldset">
   {settings ? <div className="admin-title"><div><h1>Seaded ja varukoopiad</h1><div className="admin-meta">{connection}{publication}</div></div></div> :
    <div className="result-entry-status"><div className="admin-meta">{connection}{publication}</div></div>}
   {error&&<div className="message error" role="alert">{error}</div>}{notice&&<div className="message success" role="status"><Check size={18}/>{notice}</div>}
   {remote&&<div className="message error">Tulemused on teises seadmes muutunud. Salvesta oma muudatustest varukoopia ja laadi uusimad tulemused.<button onClick={reload}>Laadi tulemused</button></div>}
   {settings&&<section className="settings panel"><div className="settings-fields"><label>Võistluse nimi<input maxLength={100} value={data.title} onChange={e=>edit({...data,title:e.target.value})}/></label><label>Korraldaja<input maxLength={160} value={data.subtitle} onChange={e=>edit({...data,subtitle:e.target.value})}/></label><label>Kuupäev<input type="date" value={data.date} onChange={e=>edit({...data,date:e.target.value})}/></label></div>
    <fieldset className="transition-choice"><legend>Ekraanivahetus</legend>
     {([['swirl','Värvipööris'],['rain','Sümbolite sadu']] as const).map(([value,label])=><label key={value}><input type="radio" name="screen-transition" value={value} checked={data.screenTransition===value} onChange={()=>edit({...data,screenTransition:value})}/>{label}</label>)}
    </fieldset>
    <div className="tools"><button className="button outline" onClick={()=>download('bowlingu-varukoopia.json',JSON.stringify(data,null,2),'application/json')}><Download size={18}/>Salvesta varukoopia</button><button className="button outline" onClick={()=>fileRef.current?.click()}><Upload size={18}/>Taasta varukoopia</button><input ref={fileRef} hidden type="file" accept=".json,application/json" onChange={e=>restore(e.target.files?.[0])}/><button className="button outline" onClick={csv}><Download size={18}/>Ekspordi tulemused</button><RefreshControl/></div>
    <div className="special-award-settings"><h3>Eriauhinnad</h3><p>Vaadetes „Tulemused 1“ ja „Tulemused 2“ osalevad „LIONS klubi“ märkega võistkonnad. Vaates „Firma tulemused“ osalevad märkimata võistkonnad. Eriauhinnad arvutatakse vastava rühma tulemuste põhjal, sealhulgas juunioride tulemused. Edetabelites ja eriauhindade arvestuses osalevad ainult positiivse tulemusega võistlejad ja võistkonnad.</p><ul><li>Võistkondlik tagantpoolt esimene: väikseim punktisumma.</li><li>Individuaalne keskmine: aritmeetilisele keskmisele kõige lähem tulemus.</li><li>Individuaalne viimane: väikseim punktisumma.</li></ul><p>Võrdse tulemuse või sama kauguse korral kuvatakse kõik koha jagajad.</p></div>
   </section>}

   {settings&&<ArchiveActions data={data} active={activeEvent} revision={revision} dirty={dirty||laneDirty||remote} last={lastArchive} onSaved={afterLifecycle}/>}
   {!settings&&<TeamsEditor data={data} onChange={edit} errors={errors} focusRequest={focusRequest}/>}
   {settings&&<button className="textbutton reload-button" onClick={reload}><RefreshCw size={15}/>Loobu muudatustest ja laadi avaldatud tulemused</button>}
  </fieldset></main>
 </div></>;
}
