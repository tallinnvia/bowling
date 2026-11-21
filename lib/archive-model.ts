import {awards,specialAwards,withExcelCategories} from './awards';
import {normalizeState,type State} from './scoring';
import {restoreAssignments,type Lane} from './hall';

export type ArchiveEntry={id:string;year:string;date:string;title:string;organizer:string;closed:string;teams:number;players:number;played:number;version:number};
export function snapshot(state:State,lanes:Lane[],id:string,closed:string,version=1,reason=''){
  const roster=normalizeState(withExcelCategories(state));
  const players=roster.teams.flatMap(t=>t.players);
  const entry:ArchiveEntry={id,year:state.date.slice(0,4),date:state.date,title:state.title,organizer:state.subtitle,closed,teams:state.teams.length,players:players.length,played:players.filter(p=>(p.score??0)>0).length,version};
  function group(kind:'lions'|'other'){
    const tables=awards(roster,kind,true);
    const juniors=new Set(roster.teams.flatMap(t=>t.players.filter(p=>p.category==='Juniors').map(p=>p.id)));
    return {...tables,juniors:tables.individuals.filter(p=>juniors.has(p.id)).map((p,i)=>({...p,rank:i+1})),special:specialAwards(roster,kind)};
  }
  return {schema:1,entry,reason,archivedAt:new Date().toISOString(),rules:{version:1,eligible:'positive',ties:'published-order',average:'arithmetic-nearest-all'},state:roster,lanes:restoreAssignments(lanes),lions:group('lions'),other:group('other')};
}
export type Snapshot=ReturnType<typeof snapshot>;
export const formatDate=(s:string)=>s.split('-').reverse().join('.');
export function validDate(s:unknown):s is string{
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const date=new Date(s+'T12:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===s;
}
