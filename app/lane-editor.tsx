'use client';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { markLaneChanges, moveShiftRow, validLanes, type Lane, type Slot } from '../lib/hall';
import type { Team } from '../lib/scoring';
import { ShiftTables } from './shift-tables';
import { EntryHeader, useHall, type WorkspaceView } from './hall-control';

export function LaneEditor({ teams,navigate,active }: { teams:Team[];navigate:(view:WorkspaceView)=>void;active:boolean }) {
  const { snapshot, saving, publish, error } = useHall('lanes');
  const [draft, setDraft] = useState<{ lanes: Lane[]; baseline: Lane[]; revision: string } | null>(null);
  const [notice, setNotice] = useState('');
  const lanes = draft?.lanes ?? snapshot?.value ?? [];
  const marked=useMemo(()=>draft ? markLaneChanges(draft.lanes,draft.baseline) : lanes,[lanes,draft]);
  const conflict = draft && snapshot?.revision !== draft.revision;
  useEffect(() => {
    if (!draft) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [Boolean(draft)]);
  function edit(next: Lane[]) {
    if (!snapshot) return;
    const changed = JSON.stringify(next) !== JSON.stringify(snapshot.value);
    setDraft(changed ? { lanes: next, baseline:draft?.baseline ?? snapshot.value, revision: draft?.revision ?? snapshot.revision } : null); setNotice('');
  }
  function moveLane(shift:number, from:number, to:number) {
    edit(moveShiftRow(lanes,shift,from,to));
  }
  function changeTeam(row: number, shift: number, team: string) {
    const next = [...lanes], shifts: [Slot, Slot] = [...lanes[row].shifts];
    const original = snapshot?.value.find(lane => lane.number === lanes[row].number)?.shifts[shift];
    shifts[shift] = original?.team === team ? original : { team, players: [] };
    next[row] = { ...lanes[row], shifts };
    edit(next);
  }
  async function save() {
    if (!draft) return;
    const cleaned = draft.lanes.map(lane => ({ ...lane, shifts: lane.shifts.map(s => ({
      team: s.team.trim(), players: s.players.map(p => p.trim()).filter(Boolean),
    })) as [Slot, Slot] }));
    if (!validLanes(cleaned)) { setNotice('Igal rajal peab olema erinev number (1–99).'); return }
    try { await publish(cleaned, draft.revision); setDraft(null); setNotice('') }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Avaldamine ebaõnnestus.') }
  }
  function addLane() {
    let n = 1; while (lanes.some(l => l.number === n)) n++;
    edit([...lanes, { number: n, shifts: [{ team: '', players: [] }, { team: '', players: [] }] }]);
  }
  return <div className="admin lane-admin">
    {active&&<EntryHeader view="lanes" navigate={navigate}>
        <button className="button primary publish-button" disabled={!snapshot?.editable || !draft || saving || !!conflict} onClick={save}>
          <Save size={17}/>{saving ? 'Avaldamine…' : 'Avalda rajajaotus'}
        </button>
    </EntryHeader>}
    <main><h1 className="workspace-caption">Radade jaotus vahetuste kaupa</h1>
      {draft && !saving && <span className="publication-state pending" role="status">Avaldamata muudatused</span>}
      {(notice || error) && <p role="status">{notice || error}</p>}
      {conflict && <p role="alert">Rajajaotus muutus teises seadmes. <button className="button outline" onClick={() => { if (confirm('Kas loobuda oma muudatustest ja laadida avaldatud rajajaotus?')) setDraft(null) }}>Laadi avaldatud seis</button></p>}
      {snapshot && !snapshot.editable && <a href="?view=lanes">Muutmiseks logi sisse korraldajana</a>}
      <fieldset className="admin-fieldset" disabled={!snapshot?.editable || saving}>
      <ShiftTables lanes={marked} onMove={snapshot?.editable && !saving ? moveLane : undefined} renderTeam={(lane, row, shift) => <input
        className="lane-team-input" list="lane-team-names" maxLength={100}
        aria-label={`Rada ${lane.number}, ${shift+1}. vahetus, võistkond`}
        placeholder="Vaba" value={lane.shifts[shift].team}
        onChange={e => changeTeam(row, shift, e.target.value)}/>}/>
      <datalist id="lane-team-names">{teams.map(t => <option key={t.id} value={t.name}/>)}</datalist>
      <details className="lane-management"><summary>Radade haldus</summary>
        <div>{lanes.map((lane,i) => <div className="lane-number-control" key={i}>
          <label>Rada <input type="number" min="1" max="99" aria-label={'Raja number, rida ' + (i+1)} value={lane.number || ''}
            onChange={e => edit(lanes.map((l,j) => j===i ? {...l,number:Number(e.target.value)} : l))}/></label>
          <button className="textbutton" aria-label={'Eemalda rada ' + lane.number} onClick={() => {
            if(confirm('Kas eemaldada rada ' + lane.number + ' koos mõlema vahetusega?')) edit(lanes.filter((_,n)=>n!==i))
          }}><Trash2 size={16}/></button>
        </div>)}</div>
        <button className="button outline" disabled={lanes.length >= 64} onClick={addLane}><Plus size={17}/>Lisa rada</button>
      </details>
      </fieldset></main></div>;
}
