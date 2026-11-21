import {createRoot} from 'react-dom/client';
import Home from '../app/home';
import Bowling from '../app/bowling';
import OrganizerGate from '../app/organizer-gate';

import {setWorkbookReference} from '../lib/awards';
import {apiFetch} from '../app/client-api';

const params=new URLSearchParams(location.search);
const view=params.get('view')==='admin' && params.get('settings')==='1' ? 'settings' : params.get('view');
const page=view==='admin'||view==='lanes'||view==='settings'
  ? <OrganizerGate><Bowling initialMode={view}/></OrganizerGate>
  : view==='display'||view==='display2' ? <Bowling initialMode={view}/> : <Home/>;
const root=createRoot(document.getElementById('app')!);
async function start(){
  if(view){
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
