import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical } from 'lucide-react';
import { laneRows, type Lane } from '../lib/hall';

const shifts = [
  { title: '1. vahetus', warmup: '18.00–18.10', start: '18.10' },
  { title: '2. vahetus', warmup: '19.00–19.10', start: '19.10' },
] as const;

export function ShiftTables({ lanes, renderTeam, onMove }: {
  lanes: Lane[];
  onMove?: (shift: number, from: number, to: number) => void;
  renderTeam: (lane: Lane, row: number, shift: number) => ReactNode;
}) {
  type Lift = { source:number; target:number|null; shift:number; width:number; height:number; x:number; y:number };
  const [drag, setDrag] = useState<Lift|null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const stop = useRef<(() => void)|null>(null);

  // Release the gesture if the published data or editing permissions change.
  useEffect(() => () => stop.current?.(), [lanes, Boolean(onMove)]);

  function lift(event:PointerEvent<HTMLButtonElement>, source:number, shift:number) {
    if (!onMove || stop.current || event.button!==0 || !event.isPrimary) return;
    const button=event.currentTarget;
    const table=button.closest('table')!;
    const rows=Array.from(table.tBodies[0].rows);
    const boxes=rows.map(row=>row.getBoundingClientRect());
    const box=boxes[source];
    const initialScroll=window.scrollY;
    const offsetX=event.clientX-box.left, offsetY=event.clientY-box.top;
    const pointer=event.pointerId;
    let x=event.clientX, y=event.clientY, frame=0, target:number|null=source;
    event.preventDefault();
    button.focus({preventScroll:true});
    setDrag({source, target, shift, width:box.width, height:box.height, x:box.left, y:box.top});
    document.body.classList.add('lane-sorting');
    const listeners=new AbortController();
    const options={signal:listeners.signal};
    function destination() {
      const originalY=y+window.scrollY-initialScroll;
      if (x<box.left || x>box.right || originalY<boxes[0].top || originalY>boxes[boxes.length-1].bottom) return null;
      return boxes.findIndex(rect=>originalY<=rect.bottom);
    }
    function update() {
      const next=destination();
      if (next!==target) {
        target=next;
        setDrag(old=>old && {...old,target:next});
      }
      if (preview.current) preview.current.style.transform='translate3d('+(x-offsetX)+'px,'+(y-offsetY)+'px,0)';
    }
    function tick() {
      if (y<58 || y>window.innerHeight-58) {
        window.scrollBy(0,y<58 ? -10 : 10);
      }
      update();
      frame=requestAnimationFrame(tick);
    }
    function clean() {
      listeners.abort();
      cancelAnimationFrame(frame);
      if (button.hasPointerCapture(pointer)) button.releasePointerCapture(pointer);
      document.body.classList.remove('lane-sorting');
      stop.current=null;
      setDrag(null);
    }
    stop.current=clean;
    window.addEventListener('pointermove', e=>{
      if (e.pointerId===pointer) { x=e.clientX; y=e.clientY }
    },options);
    window.addEventListener('pointerup', e=>{
      if (e.pointerId!==pointer) return;
      x=e.clientX; y=e.clientY;
      const to=destination();
      clean();
      if (to!==null && to>=0 && to!==source) onMove(shift,source,to);
    },options);
    window.addEventListener('pointercancel',e=>{if(e.pointerId===pointer) clean()},options);
    button.addEventListener('lostpointercapture',clean,options);
    window.addEventListener('blur',clean,options);
    window.addEventListener('resize',clean,options);
    window.addEventListener('keydown',e=>{if(e.key==='Escape') clean()},options);
    button.setPointerCapture(pointer);
    frame=requestAnimationFrame(tick);
  }

  function handle(lane:Lane, row:number, shift:number) {
    if (!onMove) return lane.number;
    return <button type="button" className="lane-grip"
      title="Lohista rada või liiguta nooleklahvidega"
      aria-label={`Liiguta rada ${lane.number} üles või alla`} aria-keyshortcuts="ArrowUp ArrowDown"
      onPointerDown={event=>lift(event,row,shift)}
      onKeyDown={event=>{
        if (stop.current) return;
        if (event.key!=='ArrowUp' && event.key!=='ArrowDown') return;
        event.preventDefault();
        const target=row+(event.key==='ArrowUp'?-1:1);
        if (target<0 || target>=lanes.length) return;
        const table=event.currentTarget.closest('table');
        onMove(shift,row,target);
        table?.tBodies[0].rows[target]?.querySelector<HTMLButtonElement>('.lane-grip')?.focus();
      }}>
      <GripVertical aria-hidden="true" size={14}/>{lane.number}
    </button>;
  }

  const order=laneRows(lanes);
  const lifted=drag ? lanes[order[drag.source]] : undefined;
  return <section className="lane-tables" aria-label="Radade jaotus">
    {shifts.map((shift, index) => <table key={shift.title} className={drag?.shift===index ? 'lane-active-shift' : undefined} aria-label={shift.title}>
      <colgroup><col className="lane-number-column"/><col/></colgroup>
      <thead>
        <tr><th colSpan={2} className="shift-heading">
          <div className="shift-heading-line">
            <h2>{shift.title}</h2>
            <div className="shift-times"><span>Soojendus <b>{shift.warmup}</b></span><span>Võistluse algus <b>{shift.start}</b></span></div>
          </div>
        </th></tr>
        <tr className="lane-column-headings"><th scope="col">Rada</th><th scope="col">Võistkond</th></tr>
      </thead>
      <tbody>{order.map((source, row) => {
        const lane=lanes[source], previous=lane.shifts[index].previousLane;
        return <tr key={row} data-lane-row={onMove ? row : undefined}
        className={drag?.shift===index ? row===drag.source ? 'lane-lifted' : 'lane-sliding' : undefined}
        style={drag?.shift===index && drag.target!==null && row!==drag.source ? {transform:
          row>drag.source && row<=drag.target ? 'translateY(-100%)' :
          row<drag.source && row>=drag.target ? 'translateY(100%)' : undefined} : undefined}>
        <th scope="row">{handle(lane,row,index)}</th><td><div className="lane-assignment">{renderTeam(lane, source, index)}
          {previous!==undefined && previous!==lane.number && <span className="lane-change" aria-label={`Rajalt ${previous} rajale ${lane.number}`}>{previous} → {lane.number}</span>}
        </div></td>
      </tr>})}</tbody>
    </table>)}
    {drag && lifted && createPortal(<div ref={preview} aria-hidden="true" className="lane-drag-preview"
      style={{width:drag.width,height:drag.height,transform:`translate3d(${drag.x}px,${drag.y}px,0)`}}>
      <b><GripVertical size={15}/>{lifted.number}</b>
      <span>{lifted.shifts[drag.shift].team || 'Vaba'}</span>
      {drag.target!==null && drag.target!==drag.source && <strong className="lane-change">{lifted.number} → {lanes[order[drag.target]].number}</strong>}
    </div>,document.body)}
  </section>;
}
