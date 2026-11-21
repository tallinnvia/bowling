import type {State} from './scoring';
import {total,teamCategory} from './scoring';
import reference from './excel-reference.json';
let refs=reference as Record<string,{name:string;team:string;category:string;order:number}>;
export function setWorkbookReference(value:typeof refs){refs=value}
// Only fill categories explicitly evidenced by the supplied workbook; never infer from names.
export function withExcelCategories(state:State):State {
 return {...state,teams:state.teams.map(team=>({...team,
  category:team.category==='Open'&&['Lihula naised','LC Tabasalu I','LC Tallinn City'].includes(team.name)&&team.players.every(p=>refs[p.id]?.name===p.name&&refs[p.id]?.team===team.name)?'Women':team.category,
  players:team.players.map(player=>{const ref=refs[player.id];return player.category==='Unassigned'&&ref?.name===player.name&&ref.team===team.name?{...player,category:ref.category}:player})
 }))};
}
export type AwardRow={id:string;name:string;detail?:string;score:number;rank:number;scores?:number[]};
type ClubGroup = 'lions' | 'other';
const participatingTeams = (state: State, group: ClubGroup) =>
  state.teams.filter(team => group === 'lions' ? team.lionsClub === true : team.lionsClub !== true);
function hasResult<T extends {score:number|null}>(row:T): row is T & {score:number} {
 return row.score!==null && row.score>0;
}
export function awards(state:State, group:ClubGroup='lions'){
 const eligible=participatingTeams(state, group);
 const players=eligible.flatMap(team=>team.players.map(p=>({...p,detail:team.name,order:refs[p.id]?.name===p.name&&refs[p.id]?.team===team.name?refs[p.id].order:10000})));
 const teams=eligible.map(team=>({...team,category:teamCategory(team),score:total(team),detail:team.players.filter(hasResult).map(p=>p.name).join(' · ')}));
 function top(rows:{id:string;name:string;detail?:string;score:number|null;order?:number}[],count:number):AwardRow[]{
  return rows.filter(hasResult).sort((a,b)=>b.score-a.score||(a.order??10000)-(b.order??10000)).slice(0,count).map((r,i)=>({...r,rank:i+1}));
 }
 return {teams:top(teams,6),individuals:top(players,6),women:top(players.filter(p=>p.category==='Women'),3),men:top(players.filter(p=>p.category==='Men'),3),womenTeams:top(teams.filter(t=>t.category==='Women'),3)};
}

// Use the same positive results for the special awards and the standings.
export function specialAwards(state:State, group:ClubGroup='lions'){
 const eligible=participatingTeams(state, group);
 const players=eligible.flatMap(t=>t.players.filter(hasResult).map(p=>({id:p.id,name:p.name,detail:t.name,score:p.score,rank:0})));
 const teams=eligible.map(t=>({id:t.id,name:t.name,score:total(t),rank:0})).filter(hasResult);
 function combine(rows:AwardRow[]):AwardRow|undefined{
  if(!rows.length)return undefined;
  if(rows.length===1)return rows[0];
  return {id:rows.map(r=>r.id).join('|'),name:rows.map(r=>r.name+(r.detail?' ('+r.detail+')':'')).join(' · '),score:rows[0].score,scores:[...new Set(rows.map(r=>r.score))],rank:0};
 }
 const minTeam=teams.length?Math.min(...teams.map(t=>t.score)):null;
 const minPlayer=players.length?Math.min(...players.map(p=>p.score)):null;
 const average=players.length?players.reduce((n,p)=>n+p.score,0)/players.length:null;
 const distance=average===null?null:Math.min(...players.map(p=>Math.abs(p.score-average)));
 return {
  teamLast:combine(teams.filter(t=>t.score===minTeam)),
  individualMiddle:combine(players.filter(p=>average!==null&&distance!==null&&Math.abs(Math.abs(p.score-average)-distance)<1e-8)),
  individualLast:combine(players.filter(p=>p.score===minPlayer))
 };
}
