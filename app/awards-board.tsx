import type {State} from '../lib/scoring';
import {awards,specialAwards} from '../lib/awards';
import {AwardList,SpecialAward} from './animated-awards';
export {AwardList} from './animated-awards';
export default function AwardsBoard({data,status,ready,arena=false,brand=false}:{data:State;status:string;ready:boolean;arena?:boolean;brand?:boolean}){
 const current=ready?data:{...data,teams:[]};
 const group=brand?'other':'lions';
 const result=awards(current,group),special=specialAwards(current,group);
 return <main className={brand?"awards-board arena lions-board":arena?"awards-board arena":"awards-board"} data-testid="fullhd-board">
  <header className="awards-header"><img className="lions-logo" src="./lions-logo.svg" alt="Lions International"/><h1>{data.title}</h1></header>
  <div className="awards-layout"><div className="awards-main">
   <section className="award-panel overall-teams" aria-label="Võistkondlik arvestus"><header><h2>Võistkondlik arvestus</h2></header><AwardList arena={arena} rows={result.teams} count={6}/></section>
   <section className="award-panel overall-players individual-standings" aria-label="Individuaalne arvestus"><header><h2>Individuaalne arvestus</h2></header><AwardList arena={arena} rows={result.individuals} count={6}/></section>
  </div><div className="awards-special">
   <section className="award-panel individual-standings" aria-label="Individuaalne arvestus Naised"><header><h2>Individuaalne arvestus <span>Naised</span></h2></header><AwardList arena={arena} rows={result.women} count={3} compact/></section>
   <section className="award-panel individual-standings" aria-label="Individuaalne arvestus Mehed"><header><h2>Individuaalne arvestus <span>Mehed</span></h2></header><AwardList arena={arena} rows={result.men} count={3} compact/></section>
   <section className="award-panel" aria-label="Naiskondlik arvestus"><header><h2>Naiskondlik arvestus</h2></header><AwardList arena={arena} rows={result.womenTeams} count={3} compact/></section>
  </div></div>
  <footer className="special-awards-footer" aria-label="Eriauhinnad"><SpecialAward title={arena?"Võistkondlik viimane koht":"Võistkondlik arvestus · tagantpoolt esimene"} row={special.teamLast}/><SpecialAward title={arena?"Keskmisele lähim":"Individuaalne arvestus · keskmine tulemus"} row={special.individualMiddle}/><SpecialAward title={arena?"Individuaalne viimane koht":"Individuaalne arvestus · viimane koht"} row={special.individualLast}/></footer>
  {status==='Ühendus katkenud' &&<div className="board-offline" role="status">Ühendus katkenud</div>}
 </main>;
}
