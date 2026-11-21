import CompetitionGuide from './competition-guide';
import {ClipboardList,Monitor,Settings2,ArrowRight,Home as HomeIcon} from 'lucide-react';
import { ScreenSelector } from "./hall-control";
export default function Home(){return <div className="event-home">
 <header className="hub-header"><img src="./lions-logo.svg" alt="Lions International"/><div><h1>LIONS BOWLING</h1></div></header>
 <main className="hub-main">
 <div className="hub-cards"><a href="?view=admin" className="hub-card"><ClipboardList/><h3>Võistkonnad ja tulemused</h3><p>Lisa võistkonnad, liikmed ja punktid. Kõik andmed on ühes tabelis.</p><strong>Ava sisestamine <ArrowRight size={19}/></strong></a><div className="hub-card display-card"><a className="hub-original-display" href="?view=display" target="_blank" rel="noreferrer"><Monitor/><h3>Tulemuste ekraan</h3><p>Ava tabloo teises arvutis või ekraanil. Tulemused uuenevad automaatselt.</p><strong>Ava tabloo <ArrowRight size={19}/></strong></a><ScreenSelector/></div><a href="?view=lanes" className="hub-card"><ClipboardList/><h3>Raja info</h3><p>Määra võistkonnad radadele mõlemas vahetuses.</p><strong>Ava rajajaotus</strong></a><a href="?view=settings" className="hub-card"><Settings2/><h3>Seaded ja varukoopiad</h3><p>Muuda võistluse seadeid, salvesta varukoopia või ekspordi tulemused.</p><strong>Ava seaded <ArrowRight size={19}/></strong></a></div>
 <CompetitionGuide/>
 </main></div>}
