export type Player={id:string;name:string;category:string;score:number|null};
export type Team={id:string;name:string;category:string;lionsClub?:boolean;players:Player[]};
export type SpecialSelection={teamLast:string|null;individualMiddle:string|null;individualLast:string|null};
export type TransitionStyle = 'swirl' | 'rain';
export type State={screenTransition?:TransitionStyle;specialAwards?:SpecialSelection;title:string;subtitle:string;date:string;sample:boolean;updatedAt:string|null;teams:Team[]};
export const teamCategories=['Open','Women','Men','Juniors'];
export const playerCategories=['Unassigned','Women','Men','Juniors'];
export function teamCategory(team:Pick<Team,'players'>):string{
 if(!team.players.length)return 'Open';
 const category=team.players[0].category;
 return ['Women','Men','Juniors'].includes(category)&&team.players.every(p=>p.category===category)?category:'Open';
}
export const normalizeState=(state:State):State=>({...state,screenTransition:state.screenTransition??'swirl',teams:state.teams.map(team=>({...team,category:teamCategory(team)}))});
export const total=(t:Team)=>t.players.some(p=>p.score!==null)?Math.round(t.players.reduce((s,p)=>s+(p.score??0),0)*100)/100:null;
export function ranked<T extends {score:number|null}>(rows:T[]){let last:number|null=null,rank=0;return [...rows].sort((a,b)=>(b.score??-1)-(a.score??-1)).map((x,i)=>{if(x.score!==last)rank=i+1;last=x.score;return {...x,rank:x.score===null?null:rank}})}
export function validRosterName(value:unknown):boolean {
 return typeof value==='string' && value.trim().length>0 && value.length<=100;
}
export function validRosterScore(value:unknown):boolean {
 return value===null || (typeof value==='number' && Number.isFinite(value) && value>=0 && value<=300);
}
export function rosterErrors(teams:Team[]){
 const errors=new Map<string,string>();
 for(const team of teams){
  if(!validRosterName(team.name)) errors.set('team-'+team.id,'Sisesta võistkonna nimi.');
  for(const player of team.players){
   if(!validRosterName(player.name)) errors.set('member-'+player.id,'Sisesta liikme nimi.');
   if(!validRosterScore(player.score)) errors.set('score-'+player.id,'Sisesta punktid vahemikus 0–300.');
  }
 }
 return errors;
}
export function validate(s:any):s is State{
 if(!s||typeof s.title!=='string'||!s.title.trim()||s.title.length>100||typeof s.subtitle!=='string'||s.subtitle.length>160||typeof s.date!=='string'||s.date.length>20||typeof s.sample!=='boolean'||!Array.isArray(s.teams)||s.teams.length>150)return false;
 if(s.screenTransition!==undefined && !['swirl','rain'].includes(s.screenTransition))return false;
 if(s.specialAwards!==undefined&&(!s.specialAwards||typeof s.specialAwards!=='object'||!['teamLast','individualMiddle','individualLast'].every(k=>s.specialAwards[k]===null||(typeof s.specialAwards[k]==='string'&&s.specialAwards[k].length<100))))return false;
 const ids=new Set<string>();const validId=(v:any)=>typeof v==='string'&&v.length>0&&v.length<100&&!ids.has(v)&&(ids.add(v),true);
 return s.teams.every((t:any)=>validId(t.id)&&validRosterName(t.name)&&teamCategories.includes(t.category)&&(t.lionsClub===undefined||typeof t.lionsClub==='boolean')&&Array.isArray(t.players)&&t.players.length<=20&&t.players.every((p:any)=>validId(p.id)&&validRosterName(p.name)&&playerCategories.includes(p.category)&&validRosterScore(p.score)));
}
