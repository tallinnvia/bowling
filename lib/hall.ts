export const screenLabels = { classic: 'Tulemused 1', arena: 'Tulemused 2', brand: 'Firma tulemused', lanes: 'Raja info' } as const;
export type Screen = keyof typeof screenLabels;
export type Slot = { team: string; players: string[]; previousLane?:number };
export type Lane = { number: number; shiftOrder?: [number|null, number|null]; shifts: [Slot, Slot] };
export type RefreshCommand = { id:string; confirmed:boolean };
export type HallData = { screen: Screen; lanes: Lane[]; refresh: RefreshCommand|null };
export type HallResource = keyof HallData;

export const isScreen = (value: unknown): value is Screen =>
  typeof value === 'string' && Object.hasOwn(screenLabels, value);

export function laneRows(lanes:Lane[]): number[] {
  return lanes.map((_,i)=>i).sort((a,b)=>lanes[a].number-lanes[b].number);
}

// Earlier versions stored a display order instead of changing the assigned lane.
export function restoreAssignments(lanes:Lane[]): Lane[] {
  if (!lanes.some(lane=>lane.shiftOrder || lane.shifts.some(slot=>slot.previousLane!==undefined))) return lanes;
  const publishedSlot=({team,players}:Slot):Slot=>({team,players});
  const physical=laneRows(lanes);
  const next=lanes.map(({number,shifts}):Lane=>({number,shifts:[publishedSlot(shifts[0]),publishedSlot(shifts[1])]}));
  for (const shift of [0,1]) {
    if (!lanes.some(lane=>lane.shiftOrder?.[shift]!=null)) continue;
    const ordered=lanes.map((_,i)=>i).sort((a,b)=>
      (lanes[a].shiftOrder?.[shift] ?? Infinity) - (lanes[b].shiftOrder?.[shift] ?? Infinity) || a-b);
    ordered.forEach((source,row)=>{
      const target=next[physical[row]], slot=lanes[source].shifts[shift];
      target.shifts[shift]=publishedSlot(slot);
    });
  }
  return next;
}

export function moveShiftRow(lanes:Lane[], shift:number, from:number, to:number): Lane[] {
  const rows=laneRows(lanes);
  const slots=rows.map(i=>lanes[i].shifts[shift]);
  slots.splice(to,0,slots.splice(from,1)[0]);
  const next=[...lanes];
  rows.forEach((index,row)=>{
    if (slots[row]===lanes[index].shifts[shift]) return;
    const shifts:[Slot,Slot]=[...lanes[index].shifts];
    shifts[shift]=slots[row];
    next[index]={...lanes[index],shifts};
  });
  return next;
}

// Keep the original slot objects in a draft so even duplicate team names and
// repeated moves resolve to the lane in the last published schedule.
export function markLaneChanges(lanes:Lane[], baseline:Lane[]): Lane[] {
  const origins=new Map<Slot,number>();
  baseline.forEach(lane=>lane.shifts.forEach(slot=>origins.set(slot,lane.number)));
  return lanes.map(lane=>{
    const shifts:[Slot,Slot]=[...lane.shifts];
    for (const shift of [0,1]) {
      const slot=shifts[shift], origin=origins.get(slot);
      if (slot.team && origin!==undefined && origin!==lane.number)
        shifts[shift]={...slot,previousLane:origin};
    }
    return {...lane,shifts};
  });
}

export function validLanes(value: unknown): value is Lane[] {
  if (!Array.isArray(value) || value.length > 64) return false;
  const numbers = new Set<number>();
  return value.every(lane => {
    if (!lane || !Number.isInteger(lane.number) || lane.number < 1 || lane.number > 99 || numbers.has(lane.number)) return false;
    if (lane.shiftOrder!==undefined && !(Array.isArray(lane.shiftOrder) && lane.shiftOrder.length===2 &&
      lane.shiftOrder.every((p:unknown)=>p===null || (typeof p==='number' && Number.isInteger(p) && p>=0 && p<64)))) return false;
    numbers.add(lane.number);
    return Array.isArray(lane.shifts) && lane.shifts.length === 2 && lane.shifts.every((s: Slot) =>
      s && (s.previousLane===undefined || (Number.isInteger(s.previousLane) && s.previousLane>=1 && s.previousLane<=99)) && typeof s.team === 'string' && s.team.length <= 100 &&
      Array.isArray(s.players) && s.players.length <= 20 &&
      s.players.every(n => typeof n === 'string' && n.trim().length > 0 && n.length <= 100) &&
      (s.team.trim().length > 0 || s.players.length === 0));
  });
}
