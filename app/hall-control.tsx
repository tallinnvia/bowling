'use client';
import {apiFetch} from './client-api';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { House } from 'lucide-react';
import { screenLabels, type HallData, type HallResource, type Screen } from '../lib/hall';

type Published<T> = { value: T; revision: string; editable: boolean };
export function useHall<K extends HallResource>(resource: K) {
  type Data = Published<HallData[K]>;
  const [snapshot, setSnapshot] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const sequence = useRef(0);
  const writing = useRef(false);
  const url = '/api/hall/' + resource;
  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;
    const abort = new AbortController();
    async function poll() {
      const version = sequence.current;
      try {
        if (writing.current) return;
        const response = await apiFetch(url, { cache: 'no-store', signal: abort.signal });
        if (!response.ok) throw Error();
        const data: Data = await response.json();
        if (active && version === sequence.current) {
          setSnapshot(old => old?.revision === data.revision && old.editable === data.editable ? old : data);
          setError('');
        }
      } catch { if (active && version === sequence.current) setError('Ühendus katkes. Proovin uuesti.') }
      finally { if (active) timeout = setTimeout(poll, 2500) }
    }
    void poll();
    return () => { active = false; abort.abort(); clearTimeout(timeout) };
  }, [url]);
  const publish = useCallback(async (value: HallData[K], revision: string) => {
    if (writing.current) throw Error('Salvestamine on pooleli.');
    writing.current = true; ++sequence.current; setSaving(true);
    try {
      const res = await apiFetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value, revision }) });
      const data = await res.json() as Data & {error?:string};
      if (!res.ok) throw Error(data.error || 'Salvestamine ebaõnnestus.');
      setSnapshot(data); setError('');
    } finally { writing.current = false; setSaving(false); ++sequence.current }
  }, [url]);
  return { snapshot, publish, saving, error };
}

export function ScreenSelector() {
  const { snapshot, publish, saving, error } = useHall('screen');
  const [issue, setIssue] = useState('');
  async function select(mode: Screen) {
    if (!snapshot || saving || mode === snapshot.value) return;
    setIssue('');
    try { await publish(mode, snapshot.revision) }
    catch (e) { setIssue(e instanceof Error ? e.message : 'Valikut ei saanud salvestada.') }
  }
  return <div className="hall-selector">
    <div role="group" aria-label="Saaliekraani vaade" className="hall-segments">
      {(Object.keys(screenLabels) as Screen[]).map(mode => <button type="button" key={mode} value={mode}
        aria-pressed={snapshot?.value === mode} disabled={!snapshot?.editable || saving}
        onClick={() => void select(mode)}>{screenLabels[mode]}</button>)}
    </div>
    {snapshot && !snapshot.editable && <a href="?view=admin">Logi sisse korraldajana</a>}
    {(issue || error) && <span role="alert">{issue || error}</span>}
  </div>;
}

export type WorkspaceView='admin'|'lanes'|'settings';
export function EntryHeader({view,navigate,children}:{view:WorkspaceView;navigate:(view:WorkspaceView)=>void;children:ReactNode}){
  return <header className="admin-header workspace-header">
    <nav className="workspace-links" aria-label="Töövaated">
      <a className="workspace-home" href="./"><House size={17} aria-hidden="true"/>Avaleht</a>
      {(['admin','lanes','settings'] as const).map(target=><a key={target} href={'?view='+target}
        aria-current={view===target?'page':undefined}
        onClick={event=>{
          if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
          event.preventDefault();navigate(target);
        }}>{target==='admin'?'Tulemuste sisestamine':target==='lanes'?'Raja info':'Seaded'}</a>)}
    </nav>
    <div className="workspace-hall" role="group" aria-label="Saaliekraani juhtimine">
      <a className="button outline" href="?view=display" target="_blank" rel="noreferrer" title="Ava tulemuste ekraan uuel vahelehel">Tulemuste ekraan</a>
      <ScreenSelector/>
    </div>
    {children}
    <button type="button" className="button outline" onClick={()=>{if(window.confirm('Kas logida korraldaja vaatest välja?')){sessionStorage.removeItem('lions.organizer.session');window.location.assign('./')}}}>Logi välja</button>
  </header>;
}
