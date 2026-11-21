'use client';
import {useEffect,useState,type FormEvent,type ReactNode} from 'react';
import {apiFetch,readSession,saveSession} from './client-api';

export default function OrganizerGate({children}:{children:ReactNode}) {
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(true),[password,setPassword]=useState(''),[error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    async function check(){
      try {
        if(!readSession())return;
        const res=await apiFetch('/api/session');
        if(active && res.ok) setOpen(((await res.json()) as {authenticated?:boolean}).authenticated===true);
      }catch{if(active)setError('Ühendus katkes. Proovi uuesti.')}
      finally{if(active)setBusy(false)}
    }
    void check();return()=>{active=false};
  },[]);
  async function login(event:FormEvent){
    event.preventDefault();setBusy(true);setError('');
    try {
      const res=await apiFetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
      const data=await res.json() as {token?:string;error?:string};
      if(!res.ok || !data.token) throw Error(data.error || 'Sisselogimine ebaõnnestus.');
      saveSession(data.token);setPassword('');setOpen(true);
    }catch(e){setError(e instanceof Error?e.message:'Ühendus katkes.')}
    finally{setBusy(false)}
  }
  if(open)return <>{children}</>;
  return <main className="organizer-login"><form onSubmit={login}><a href="./">Avaleht</a><h1>Korraldaja sisselogimine</h1>
    <label htmlFor="organizer-password">Parool</label>
    <input id="organizer-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} />
    {error && <p role="alert">{error}</p>}<button className="button primary" disabled={busy}>Logi sisse</button></form></main>;
}
