'use client';
import {apiFetch} from './client-api';
import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useHall } from './hall-control';

const pendingKey='bowling-display-refresh';

export function useDisplayRefresh(ready:boolean) {
  const {snapshot}=useHall('refresh');
  const observed=useRef<string|null|undefined>(undefined);
  const reloading=useRef(false);
  useEffect(()=>{
    if (!snapshot || reloading.current) return;
    const command=snapshot.value;
    const id=command?.id ?? null;
    // A newly opened display starts at the current revision.
    const changed=observed.current!==undefined && observed.current!==id;
    observed.current=id;
    if (!id) return;
    if (changed) {
      reloading.current=true;
      try { sessionStorage.setItem(pendingKey,id) } catch { /* Reload still works without acknowledgment storage. */ }
      window.location.reload();
      return;
    }
    if (!ready) return;
    try { if (sessionStorage.getItem(pendingKey)!==id) return } catch { return }
    let cancelled=false;
    let timer:ReturnType<typeof setTimeout>;
    async function confirmReload() {
      try {
        const res=await apiFetch('/api/hall/refresh',{method:'POST',headers:{'X-Refresh-Id':id!},cache:'no-store'});
        if (res.ok || res.status===409) {
          if (!cancelled && sessionStorage.getItem(pendingKey)===id) sessionStorage.removeItem(pendingKey);
          return;
        }
      } catch { /* Retry while this command is current. */ }
      if (!cancelled) timer=setTimeout(confirmReload,3000);
    }
    void confirmReload();
    return ()=>{cancelled=true;clearTimeout(timer)};
  },[snapshot,ready]);
}

export function RefreshControl() {
  const {snapshot,publish,saving,error}=useHall('refresh');
  const [issue,setIssue]=useState('');
  async function send(){
    if (!snapshot?.editable || saving) return;
    setIssue('');
    try { await publish({id:crypto.randomUUID(),confirmed:false},snapshot.revision) }
    catch(e){ setIssue(e instanceof Error?e.message:'Käsu saatmine ebaõnnestus.') }
  }
  return <div className="workspace-refresh">
    <button type="button" className="button outline" disabled={!snapshot?.editable || saving} onClick={send}>
      <RefreshCw size={17} aria-hidden="true"/>Värskenda saaliekraani
    </button>
    <span role="status">{issue || error || (saving?'Saatmine…':snapshot?.value?.confirmed?'Saaliekraan värskendatud':snapshot?.value?'Käsk saadetud':'')}</span>
  </div>;
}
