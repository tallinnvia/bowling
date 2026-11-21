'use client';
import {useEffect,useState} from 'react';
import {Archive,ArrowLeft,ChevronRight,Download,Search,Trophy,ChartNoAxesColumnIncreasing} from 'lucide-react';
import type {AwardRow} from '../lib/awards';
import {formatDate,type ArchiveEntry,type Snapshot} from '../lib/archive-model';
import {archiveRequest,archivePost} from './archive-actions';
import {apiFetch,readSession} from './client-api';
import type {State} from '../lib/scoring';
import {laneRows} from '../lib/hall';

const labels={teams:'Võistkonnad',individuals:'Võistlejad',women:'Naised',men:'Mehed',juniors:'Juuniorid',womenTeams:'Naiskonnad'};
type Table=keyof typeof labels;
type Group='lions'|'other';
const groupName={lions:'LIONSi klubid',other:'Firmad'};
const points=(v:number)=>v.toLocaleString('et-EE',{maximumFractionDigits:2});
const yearLink=(year:string,id?:string)=>'/'+year+'/'+(id?'?voistlus='+encodeURIComponent(id):'');
const avg=(arr:number[])=>arr.length?points(arr.reduce((a,b)=>a+b,0)/arr.length):'—';
function DownloadResult({value}:{value:Snapshot}){
  return <button className="ar-text" onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='lions-bowling-'+value.entry.date+'-v'+value.entry.version+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}><Download size={16}/> Laadi alla</button>;
}
function Correct({s,done}:{s:Snapshot;done:()=>void}){
  const [show,setShow]=useState(false),[allowed,setAllowed]=useState(false),[pid,setPid]=useState(''),[score,setScore]=useState(''),[reason,setReason]=useState(''),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{if(readSession())apiFetch('/api/session').then(r=>r.json()).then(v=>setAllowed((v as {authenticated:boolean}).authenticated)).catch(()=>{})},[]);
  if(!allowed)return null;
  const players=s.state.teams.flatMap(t=>t.players.map(p=>({...p,team:t.name})));
  async function submit(){
    setBusy(true);setErr('');
    try{
      const state:State={...s.state,teams:s.state.teams.map(t=>({...t,players:t.players.map(p=>p.id===pid?{...p,score:score===''?null:Number(score)}:p)}))};
      await archivePost({action:'correct',id:s.entry.id,version:s.entry.version,reason,state});done();
    }catch(e){setErr((e as Error).message)}finally{setBusy(false)}
  }
  return show?<form className="ar-correction" onSubmit={e=>{e.preventDefault();void submit()}}><h3>Paranda arhiveeritud tulemust</h3><label>Võistleja<select required value={pid} onChange={e=>{setPid(e.target.value);setScore(String(players.find(p=>p.id===e.target.value)?.score??''))}}><option value="">Vali võistleja</option>{players.map(p=><option key={p.id} value={p.id}>{p.name} · {p.team}</option>)}</select></label><label>Punktid<input type="number" min="0" max="300" step="any" value={score} onChange={e=>setScore(e.target.value)}/></label><label>Paranduse põhjus<input required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label>{err&&<p role="alert">{err}</p>}<div className="tools"><button type="button" className="button outline" disabled={busy} onClick={()=>setShow(false)}>Loobu</button><button className="button primary" disabled={busy}>Salvesta uus versioon</button></div></form>:<button className="ar-text" onClick={()=>setShow(true)}>Paranda tulemust</button>
}
function Ranking({rows,team,onProfile}:{rows:AwardRow[];team:boolean;onProfile:(id:string,team:boolean)=>void}){
  return <table className="ar-table"><thead><tr><th scope="col">Koht</th><th scope="col">{team?'Võistkond':'Võistleja'}</th><th scope="col">Punktid</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.rank}.</td><td><button onClick={()=>onProfile(r.id,team)}>{r.name}</button>{r.detail&&<small>{r.detail}</small>}</td><td>{points(r.score)}</td></tr>)}</tbody></table>;
}
function Results({s,entry,version,setVersion,onProfile,updated}:{s:Snapshot;entry:ArchiveEntry;version:number;setVersion:(v:number)=>void;onProfile:(id:string,team:boolean)=>void;updated:()=>void}){
  const [group,setGroup]=useState<Group>('lions'),[table,setTable]=useState<Table>('teams'),[query,setQuery]=useState('');
  const result=s[group],rows=result[table].filter(r=>(r.name+' '+(r.detail??'')).toLocaleLowerCase('et').includes(query.trim().toLocaleLowerCase('et')));
  return <><div className="ar-event-heading"><div><p>{formatDate(s.entry.date)} · {s.entry.organizer}</p><h1>{s.entry.title}</h1></div><DownloadResult value={s}/></div>
    <div className="ar-metrics"><span><b>{s.entry.teams}</b> võistkonda</span><span><b>{s.entry.players}</b> võistlejat</span><span><b>{s.entry.played}</b> punktitulemust</span></div>
    <section className="ar-panel"><div className="ar-panel-head"><h2>Lõpptulemused</h2><div className="ar-segment">{(['lions','other'] as const).map(g=><button key={g} aria-pressed={group===g} onClick={()=>setGroup(g)}>{groupName[g]}</button>)}</div></div>
    <div className="ar-filters"><label>Arvestus<select value={table} onChange={e=>setTable(e.target.value as Table)}>{Object.entries(labels).map(([k,l])=><option value={k} key={k}>{l}</option>)}</select></label><label>Otsing<input type="search" value={query} placeholder="Otsi nime" onChange={e=>setQuery(e.target.value)}/></label></div>
    {rows.length?<Ranking rows={rows} team={table==='teams'||table==='womenTeams'} onProfile={onProfile}/>:<p className="ar-empty">{query?'Ühtegi vastet ei leitud.':'Selles arvestuses tulemusi ei ole.'}</p>}</section>
    <section className="ar-panel"><h2>Eriauhinnad</h2><dl className="ar-prizes">{([['teamLast','Võistkondlik viimane koht'],['individualMiddle','Keskmisele lähim tulemus'],['individualLast','Individuaalne viimane koht']] as const).map(([k,l])=><div key={k}><dt>{l}</dt><dd>{result.special[k]?.name??'—'} {result.special[k]&&<small>{(result.special[k]?.scores??[result.special[k]!.score]).map(points).join(' / ')} p</small>}</dd></div>)}</dl></section>
    <details className="ar-panel"><summary>Rajajaotus</summary><table className="ar-table"><thead><tr><th>Rada</th><th>1. vahetus</th><th>2. vahetus</th></tr></thead><tbody>{laneRows(s.lanes).map(i=><tr key={i}><td>{s.lanes[i].number}</td>{s.lanes[i].shifts.map((slot,j)=><td key={j}>{slot.team||'Vaba'}</td>)}</tr>)}</tbody></table></details>
    <details className="ar-panel"><summary>Arvestus ja versioonid</summary><p>Edetabelisse lähevad positiivsed tulemused. Võrdsete punktide korral säilib võistluspäeva järjestus. Eriauhinna sama tulemuse eest saavad kõik koha jagajad.</p><p>Arhiveeritud {new Date(entry.closed).toLocaleString('et-EE',{timeZone:'Europe/Tallinn'})}</p><label>Versioon<select value={version||entry.version} onChange={e=>setVersion(Number(e.target.value))}>{Array.from({length:entry.version},(_,i)=><option key={i} value={i+1}>{i+1}{i+1===entry.version?' · kehtiv':''}</option>)}</select></label>{s.reason&&<p>Paranduse põhjus: {s.reason}</p>}{s.entry.version===entry.version&&<Correct s={s} done={updated}/>}</details></>
}
type Profile={id:string;team:boolean};
function Statistics({events,profile,choose}:{events:Snapshot[];profile:Profile|null;choose:(p:Profile|null)=>void}){
  const [group,setGroup]=useState<Group>('lions'),[kind,setKind]=useState<'individuals'|'teams'>('individuals'),[q,setQ]=useState('');
  type Row={s:Snapshot;r:AwardRow;group:Group};
  const rows:Row[]=[];
  for(const s of events)for(const g of ['lions','other'] as const)for(const r of s[g][profile?(profile.team?'teams':'individuals'):kind]){
    if(profile?r.id===profile.id:g===group)rows.push({s,r,group:g});
  }
  const history=rows.slice().sort((a,b)=>a.s.entry.date.localeCompare(b.s.entry.date));
  const people=new Map<string,Row[]>();
  for(const row of history){const matches=people.get(row.r.id)??[];matches.push(row);people.set(row.r.id,matches)}
  const scores=rows.map(x=>x.r.score);
  if(!events.length)return <><h1>Ajaloo statistika</h1><div className="ar-panel ar-empty"><Trophy size={32}/><h2>Esimese võistluse tulemused annavad statistikale alguse.</h2><p>Siia ilmuvad osalus aastate kaupa, rekordid ja võistlejate tulemuste ajalugu.</p></div></>;
  return <><div className="ar-event-heading"><div><h1>{profile?history.at(-1)?.r.name??'Osalusajalugu':'Ajaloo statistika'}</h1></div>{profile&&<button className="ar-text" onClick={()=>choose(null)}>Kõik rekordid</button>}</div>
    {profile?<><div className="ar-metrics"><span><b>{scores.length}</b> tulemust</span><span>Rekord <b>{scores.length?points(Math.max(...scores)):'—'}</b> p</span><span>Keskmine <b>{avg(scores)}</b> p</span><span><b>{rows.filter(x=>x.r.rank<=3).length}</b> poodiumikohta</span></div><section className="ar-panel"><h2>Tulemused võistluste kaupa</h2><table className="ar-table"><thead><tr><th>Kuupäev</th><th>Võistlus</th><th>Koht</th><th>Punktid</th></tr></thead><tbody>{history.map(x=><tr key={x.s.entry.id}><td>{formatDate(x.s.entry.date)}</td><td><a href={yearLink(x.s.entry.year,x.s.entry.id)}>{x.s.entry.title}</a>{!profile.team&&<small>{x.r.detail}</small>}</td><td>{x.r.rank}.</td><td>{points(x.r.score)}</td></tr>)}</tbody></table></section></>:
    <><section className="ar-panel"><h2>Osalus aastate kaupa</h2><table className="ar-table"><thead><tr><th>Aasta</th><th>Võistlusi</th><th>Võistkondi¹</th><th>Võistlejaid¹</th><th>Naisi</th><th>Mehi</th><th>Juuniore</th></tr></thead><tbody>{[...new Set(events.map(s=>s.entry.year))].sort().reverse().map(year=>{const yearEvents=events.filter(s=>s.entry.year===year),roster=yearEvents.flatMap(s=>s.state.teams.flatMap(t=>t.players));return <tr key={year}><td><a href={yearLink(year)}>{year}</a></td><td>{yearEvents.length}</td><td>{yearEvents.reduce((n,s)=>n+s.entry.teams,0)}</td><td>{roster.length}</td>{['Women','Men','Juniors'].map(c=><td key={c}>{roster.filter(p=>p.category===c).length}</td>)}</tr>})}</tbody></table><small>¹ Osaluskorrad kõigil aasta võistlustel.</small></section>
    <section className="ar-panel"><div className="ar-panel-head"><h2>Rekordid</h2><div className="ar-segment">{(['lions','other'] as const).map(g=><button key={g} aria-pressed={group===g} onClick={()=>setGroup(g)}>{groupName[g]}</button>)}</div></div><div className="ar-filters"><label>Arvestus<select value={kind} onChange={e=>setKind(e.target.value as typeof kind)}><option value="individuals">Võistlejad</option><option value="teams">Võistkonnad</option></select></label><label>Otsing<input type="search" placeholder="Otsi nime" value={q} onChange={e=>setQ(e.target.value)}/></label></div><table className="ar-table"><thead><tr><th>Nimi</th><th>Tulemusi</th><th>Keskmine</th><th>Rekord</th></tr></thead><tbody>{[...people].map(([id,list])=>({id,list,name:list.at(-1)!.r.name,best:Math.max(...list.map(x=>x.r.score))})).filter(x=>x.name.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.best-a.best||a.name.localeCompare(b.name,'et')).map(x=><tr key={x.id}><td><button onClick={()=>choose({id:x.id,team:kind==='teams'})}>{x.name}</button></td><td>{x.list.length}</td><td>{avg(x.list.map(r=>r.r.score))}</td><td>{points(x.best)}</td></tr>)}</tbody></table></section></>}</>
}
export default function ArchiveView({year='',selected=''}:{year?:string;selected?:string}){
  const [events,setEvents]=useState<ArchiveEntry[]>([]),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[nonce,retry]=useState(0),[version,setVersion]=useState(0);
  const [stats,setStats]=useState(false),[profile,setProfile]=useState<Profile|null>(null),[history,setHistory]=useState<Snapshot[]|null>(null),[detail,setDetail]=useState<Snapshot|null>(null);
  const inYear=events.filter(e=>e.year===year);
  const entry=selected?inYear.find(e=>e.id===selected):inYear.length===1?inYear[0]:undefined;
  useEffect(()=>{let live=true;setError('');archiveRequest<{events:ArchiveEntry[]}>('').then(v=>{if(live){setEvents(v.events);setLoaded(true)}}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[nonce]);
  useEffect(()=>{let live=true;setDetail(null);if(entry)archiveRequest<Snapshot>('?id='+entry.id+'&version='+(version||entry.version)).then(v=>{if(live)setDetail(v)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[entry?.id,entry?.version,version,nonce]);
  useEffect(()=>{let live=true;if(stats&&loaded){setHistory(null);Promise.all(events.map(e=>archiveRequest<Snapshot>('?id='+e.id))).then(v=>{if(live)setHistory(v)}).catch(e=>{if(live)setError(e.message)})}return()=>{live=false}},[stats,loaded,events]);
  function goStats(enabled:boolean,p:Profile|null=null){
    const url=new URL(location.href);
    for(const k of ['statistika','isik','tiim'])url.searchParams.delete(k);
    if(enabled)url.searchParams.set('statistika','1');
    if(p)url.searchParams.set(p.team?'tiim':'isik',p.id);
    window.history.pushState(null,'',url);setError('');setStats(enabled);setProfile(p);
    window.scrollTo(0,0);
  }
  useEffect(()=>{function sync(){const q=new URLSearchParams(location.search),id=q.get('tiim')||q.get('isik');setStats(q.has('statistika'));setProfile(id?{id,team:q.has('tiim')}:null)}sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[]);
  useEffect(()=>{document.title=(stats?'Ajaloo statistika':entry?.title||((year?year+' · ':'')+'Võistluste arhiiv'))+' · LIONS BOWLING'},[stats,entry?.title,year]);
  const years=[...new Set(events.map(e=>e.year))].sort().reverse();
  return <div className="archive-page"><header className="ar-mast"><div><img src="/lions-logo.svg" alt="Lions International"/><b>LIONS BOWLING</b><a href="/">Avaleht</a></div></header><main>
    <nav className="ar-nav" aria-label="Arhiivi navigeerimine"><a href="/arhiiv/" aria-current={!stats&&!year?'page':undefined}><Archive size={17}/>Võistluste arhiiv</a>{year&&!stats&&<><ChevronRight size={15}/><a href={yearLink(year)}>{year}</a></>}<button aria-pressed={stats} onClick={()=>goStats(!stats)}><ChartNoAxesColumnIncreasing size={17}/>{stats?'Tagasi arhiivi':'Statistika'}</button></nav>
    {error?<div className="ar-panel" role="alert"><p>{error}</p><button className="button outline" onClick={()=>retry(n=>n+1)}>Proovi uuesti</button></div>:!loaded?<p role="status">Laadin arhiivi…</p>:stats?history?<Statistics events={history} profile={profile} choose={p=>goStats(true,p)}/>:<p role="status">Laadin statistikat…</p>:entry?detail?<Results key={entry.id} s={detail} entry={entry} version={version} setVersion={setVersion} onProfile={(id,team)=>goStats(true,{id,team})} updated={()=>{setVersion(0);retry(n=>n+1)}}/>:<p role="status">Laadin lõpptulemusi…</p>:
    <><h1>{year?year+'. aasta võistlused':'Võistluste arhiiv'}</h1>{selected?<p className="ar-panel">Selle aadressiga võistlust ei leitud.</p>:!(year?inYear.length:events.length)?<div className="ar-panel ar-empty"><Trophy size={32}/><h2>{year?'Selle aasta tulemusi pole veel arhiveeritud.':'Arhiivis pole veel võistlusi.'}</h2><a href={year?'/arhiiv/':'/?view=display'}>{year?'Kõik aastad':'Ava saaliekraan'}</a></div>:
    (year?[year]:years).map(y=><section className="ar-year" key={y}>{!year&&<h2><a href={yearLink(y)}>{y}</a></h2>}{events.filter(e=>e.year===y).map(e=><a className="ar-event-card" key={e.id} href={yearLink(y,e.id)}><span><small>{formatDate(e.date)}</small><strong>{e.title}</strong><span>{e.teams} võistkonda · {e.players} võistlejat</span></span><ChevronRight/></a>)}</section>)}</>}</main></div>
}
