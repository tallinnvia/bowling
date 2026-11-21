'use client';
import type { Lane } from '../lib/hall';
import type { State } from '../lib/scoring';
import AwardsBoard from './awards-board';
import { ScreenTransition } from './screen-transition';
import { useDisplayRefresh } from './hall-refresh';
import { useHall } from './hall-control';

import { ShiftTables } from './shift-tables';

function LaneBoard({ lanes, title, offline }: { lanes: Lane[] | undefined; title: string; offline: boolean }) {
  return <main className="lane-board">
    <header className="lane-banner"><img src="./lions-logo.svg" alt="Lions International"/><div><p>{title}</p><h1>RAJA INFO</h1></div></header>
    {lanes?.length ? <ShiftTables lanes={lanes} renderTeam={(lane, _row, shift) =>
      lane.shifts[shift].team ? <strong>{lane.shifts[shift].team}</strong> : <em>Vaba</em>}/> : <p className="lane-empty">{lanes ? 'Radu pole veel määratud.' : 'Laadin rajajaotust…'}</p>}
    {offline && <footer>Ühendus katkenud</footer>}
  </main>;
}

export function LiveBoard(props: {data: State; status: string; ready: boolean}) {
  const screen = useHall('screen'), lanes = useHall('lanes');
  useDisplayRefresh(props.ready && Boolean(screen.snapshot));
  if (!screen.snapshot) return <main className="lane-empty" role="status">{screen.error || 'Laadin saaliekraani…'}</main>;
  return <ScreenTransition effect={props.data.screenTransition ?? 'swirl'} target={screen.snapshot.value}>{mode => mode === 'lanes'
    ? <LaneBoard lanes={lanes.snapshot?.value} title={props.data.title} offline={Boolean(screen.error || lanes.error)}/>
    : <AwardsBoard key={mode} {...props} status={screen.error ? 'Ühendus katkenud' : props.status}
        arena={mode === 'arena' || mode === 'brand'} brand={mode === 'brand'}/>
  }</ScreenTransition>;
}
