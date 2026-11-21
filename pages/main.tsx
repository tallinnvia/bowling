import {createRoot} from 'react-dom/client';
import Home from '../app/home';
import Bowling from '../app/bowling';
import OrganizerGate from '../app/organizer-gate';

import {setWorkbookReference} from '../lib/awards';
import {apiFetch} from '../app/client-api';

import ArchiveView from '../app/archive-view';
import {firstArchiveYear} from '../lib/archive-years.mjs';
const route=location.pathname.replace(/^\/bowling(?=\/|$)/,'').split('/').filter(Boolean);
const year=route.length===1&&/^\d{4}$/.test(route[0])?Number(route[0]):null;
const beforeArchive=year!==null&&year<firstArchiveYear;
const archive=(route.length===1&&route[0]==='arhiiv')||(year!==null&&year>=firstArchiveYear);
const params=new URLSearchParams(location.search);
const view=params.get('view')==='admin' && params.get('settings')==='1' ? 'settings' : params.get('view');
const page=beforeArchive?<main className="organizer-login"><section><h1>Arhiiv algab {firstArchiveYear}. aastast</h1><a className="button outline" href="/arhiiv/">Ava võistluste arhiiv</a></section></main>:archive?<ArchiveView year={route[0]==='arhiiv'?'':route[0]} selected={params.get('voistlus')||''}/>:view==='admin'||view==='lanes'||view==='settings'
  ? <OrganizerGate><Bowling initialMode={view}/></OrganizerGate>
  : view==='display'||view==='display2' ? <Bowling initialMode={view}/> : <Home/>;
const root=createRoot(document.getElementById('app')!);
async function start(){
  if(view&&!archive&&!beforeArchive){
    try {
      const response=await apiFetch('/api/workbook');
      if(!response.ok)throw Error();
      setWorkbookReference(await response.json() as Parameters<typeof setWorkbookReference>[0]);
    }catch{
      root.render(<main className="organizer-login"><section role="alert"><h1>Ühendus katkes</h1><button className="button primary" onClick={()=>void start()}>Proovi uuesti</button></section></main>);
      return;
    }
  }
  root.render(page);
}
void start();
