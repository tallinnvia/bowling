'use client';
import {useRef,useEffect,useMemo,useState} from 'react';
import {TeamNameInput} from './team-name-input';
import {useHall} from './hall-control';
import {Plus,Trash2,Search} from 'lucide-react';
import {type State,type Team,type Player,total,teamCategory} from '../lib/scoring';

const fmt=(n:number|null)=>n===null?'—':n.toLocaleString('et-EE',{maximumFractionDigits:2});
const separators=new RegExp('[^\\p{L}\\p{N}\\p{M}]+','gu');
function searchableName(name:string) {
 return name.normalize('NFC').toLocaleLowerCase('et').replace(separators,' ').trim();
}
export default function TeamsEditor({data,onChange,errors,focusRequest}:{data:State;onChange:(s:State)=>void;errors:Map<string,string>;focusRequest:{id:string}|null}){
 const {snapshot:laneSchedule}=useHall('lanes');
 const suggestedNames=useMemo(()=>{
   const names=new Map<string,string>();
   for(const lane of laneSchedule?.value ?? []){
     for(const slot of lane.shifts){
       const name=slot.team.trim();
       const key=name.normalize('NFC').toLocaleLowerCase('et');
       if(name && !names.has(key)) names.set(key,name);
     }
   }
   return [...names.values()].sort((a,b)=>a.localeCompare(b,'et'));
 },[laneSchedule]);
 const [query,setQuery]=useState('');
 const prefix=searchableName(query);
 const filtering=prefix.replaceAll(' ','').length>=2;
 const visibleTeams=data.teams.map((team,teamIndex)=>{
   const matches=(name:string)=>(' '+searchableName(name)).includes(' '+prefix);
   const teamMatches=!filtering || matches(team.name);
   const players=teamMatches ? team.players : team.players.filter(player=>matches(player.name));
   return {team,teamIndex,players,visible:teamMatches || players.length>0};
 }).filter(row=>row.visible);
 const visiblePlayers=visibleTeams.flatMap(({players})=>players);
 const counts={Women:0,Men:0,Juniors:0};
 for(const {category} of visiblePlayers){
   if(category==='Women'||category==='Men'||category==='Juniors') counts[category]++;
 }
 const summary=[
   [visibleTeams.length,'võistkond','võistkonda'],
   [visiblePlayers.length,'võistleja','võistlejat'],
   [counts.Women,'naine','naist'],
   [counts.Men,'mees','meest'],
   [counts.Juniors,'juunior','juuniori'],
 ].map(([count,one,many])=> `${count}\u00a0${count===1?one:many}`).join(' · ');
 const tableRef=useRef<HTMLTableElement>(null);
 const handledFocus=useRef<typeof focusRequest>(null);
 useEffect(()=>{
   if(!focusRequest || handledFocus.current===focusRequest)return;
   const input=document.getElementById(focusRequest.id);
   if(!input && query){setQuery('');return}
   handledFocus.current=focusRequest;
   input?.focus({preventScroll:true});
   input?.scrollIntoView({block:'center',inline:'nearest'});
 },[focusRequest,query]);
 function fieldError(id:string){
   const message=errors.get(id);
   return message && <span id={id+'-error'} className="roster-error">{message}</span>;
 }
 function fieldAttributes(id:string){
   return {id,'aria-invalid':errors.has(id),'aria-describedby':errors.has(id)?id+'-error':undefined};
 }
 const focusNew=useRef<string|null>(null);
 useEffect(()=>{if(focusNew.current){const input=document.getElementById('team-'+focusNew.current) as HTMLInputElement|null;input?.focus();focusNew.current=null}},[data.teams.length]);
 function addTeam(){setQuery('');const id=crypto.randomUUID();focusNew.current=id;onChange({...data,teams:[{id,name:'',category:'Open',lionsClub:true,players:Array.from({length:4},()=>({id:crypto.randomUUID(),name:'',category:'Unassigned',score:0}))},...data.teams]})}
 function changeTeam(id:string,update:(t:Team)=>Team){onChange({...data,teams:data.teams.map(t=>t.id===id?update(t):t)})}
 function changePlayer(teamId:string,id:string,patch:Partial<Player>){changeTeam(teamId,t=>({...t,players:t.players.map(p=>p.id===id?{...p,...patch}:p)}))}
 function nextScore(input:HTMLInputElement,back:boolean){const inputs=[...tableRef.current!.querySelectorAll<HTMLInputElement>('input[data-score]')];const next=inputs[inputs.indexOf(input)+(back?-1:1)];next?.focus();next?.select()}
 return <section className="roster-section"><div className="roster-toolbar"><div><h2>Võistkonnad ja liikmed</h2><p>{summary}</p></div>
 <label className="roster-search"><Search size={18} aria-hidden="true"/><input type="search" aria-label="Otsi võistkonda või liiget" placeholder="Otsi nime" value={query} onChange={event=>setQuery(event.target.value)}/></label>
 <button className="button primary" onClick={addTeam}><Plus size={19}/>Lisa võistkond</button></div>

 <div className="roster-scroll"><table ref={tableRef} className="roster-table"><caption className="sr-only">Kõigi võistkondade nimed, liikmed ja tulemused</caption><thead><tr><th scope="col">Võistkond</th><th scope="col">Liige</th><th scope="col">Individuaalne arvestus</th><th scope="col">Punktid</th><th scope="col">Võistkonna summa</th><th scope="col"><span className="sr-only">Tegevused</span></th></tr></thead>
 {visibleTeams.map(({team,teamIndex,players})=><tbody key={team.id} data-testid="editor-team">{(players.length?players:[null]).map((player,i)=><tr key={player?.id??'empty'}>{i===0&&<td rowSpan={Math.max(1,players.length)} className="team-cell"><div className="team-metadata">
   <label className="team-lions-choice"><input type="checkbox" aria-label={'Võistkond '+(team.name||teamIndex+1)+' · LIONS klubi'} checked={team.lionsClub??false} onChange={e=>changeTeam(team.id,t=>({...t,lionsClub:e.target.checked}))}/><span>LIONS klubi</span></label>
   <span className="team-derived-category">{teamCategory(team)==='Women'?'Naiskond':teamCategory(team)==='Men'?'Meeskond':teamCategory(team)==='Juniors'?'Juuniorid':'Üldarvestus'}</span>
 </div>
 <TeamNameInput error={errors.get('team-'+team.id)} id={'team-'+team.id} label={'Võistkonna '+(teamIndex+1)+' nimi'} value={team.name} names={suggestedNames} onChange={name=>changeTeam(team.id,t=>({...t,name}))}/>
 {fieldError('team-'+team.id)}
 <div className="team-cell-actions">
   <button type="button" className="team-action add-member" onClick={()=>changeTeam(team.id,t=>({...t,players:[...t.players,{id:crypto.randomUUID(),name:'',category:'Unassigned',score:null}]}))}><Plus size={16} aria-hidden="true"/>Lisa liige</button>
   <button type="button" className="team-action remove-team" aria-label={'Eemalda võistkond '+team.name} onClick={()=>{if(confirm('Kas eemaldada '+team.name+' koos liikmete ja tulemustega?'))onChange({...data,teams:data.teams.filter(t=>t.id!==team.id)})}}><Trash2 size={16} aria-hidden="true"/>Eemalda võistkond</button>
 </div></td>}
 {player?<><td><input {...fieldAttributes('member-'+player.id)} aria-required="true" aria-label={team.name+' liikme '+(i+1)+' nimi'} maxLength={100} placeholder="Liikme nimi" value={player.name} onChange={e=>changePlayer(team.id,player.id,{name:e.target.value})}/>{fieldError('member-'+player.id)}</td><td><fieldset className="member-category-choices" aria-label={team.name+' · '+(player.name||'Liige '+(i+1))+' individuaalne arvestus'}>{[{value:'Men',label:'Mees'},{value:'Women',label:'Naine'},{value:'Juniors',label:'Juunior'}].map(option=><label key={option.value}><input type="radio" name={'category-'+player.id} aria-label={team.name+' · '+(player.name||'Liige '+(i+1))+' · '+option.label} checked={player.category===option.value} onChange={()=>changePlayer(team.id,player.id,{category:option.value})}/><span>{option.label}</span></label>)}</fieldset></td><td><input data-score {...fieldAttributes('score-'+player.id)} aria-label={team.name+' · '+player.name+' punktid'} className="grid-score" type="number" min="0" max="300" step="any" inputMode="decimal" placeholder="—" value={player.score??''} onFocus={e=>e.currentTarget.select()} onKeyDown={e=>{if(e.key==='Enter'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();nextScore(e.currentTarget,e.shiftKey)}}} onChange={e=>changePlayer(team.id,player.id,{score:e.target.value===''?null:Number(e.target.value)})}/>{fieldError('score-'+player.id)}</td></>:<td colSpan={3} className="empty-team">Lisa võistkonnale liige.</td>}
 {i===0&&<td rowSpan={Math.max(1,players.length)} className="team-sum"><strong>{fmt(total(team))}</strong><span>{team.players.filter(p=>p.score!==null).length} / {team.players.length} tulemust</span></td>}
 <td>{player&&<button className="iconbutton danger" aria-label={'Eemalda '+player.name+' võistkonnast '+team.name} onClick={()=>{if(confirm('Kas eemaldada '+player.name+'?'))changeTeam(team.id,t=>({...t,players:t.players.filter(p=>p.id!==player.id)}))}}><Trash2 size={17}/></button>}</td></tr>)}</tbody>)}
 </table>{!visibleTeams.length&&<div className="empty" role="status">{data.teams.length ? 'Vasteid ei leitud.' : 'Lisa esimene võistkond.'}</div>}</div><div className="roster-footnote"><span><kbd>Enter</kbd> järgmine punktiväli · <kbd>Shift + Enter</kbd> eelmine</span><span>Punktid 0–300 · tühi väli tähendab sisestamata tulemust</span></div></section>;
}
