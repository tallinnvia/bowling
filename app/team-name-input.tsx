'use client';

import {useEffect, useRef, useState} from 'react';
import {Popover} from 'radix-ui';

type Props = {
  id:string; error?:string; label:string; value:string; names:string[]; onChange:(name:string)=>void;
};

export function TeamNameInput({id,error,label,value,names,onChange}:Props) {
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState(-1);
  const list=useRef<HTMLDivElement>(null);
  const options=names.filter(name=>name.toLocaleLowerCase('et').includes(value.trim().toLocaleLowerCase('et')));
  const visible=open && options.length>0;
  const listId=id+'-suggestions';
  const activeName=options[active];

  function close() { setOpen(false); setActive(-1) }
  function select(name:string) { onChange(name); close() }

  useEffect(()=>{
    if (visible && activeName) list.current?.children[active]?.scrollIntoView({block:'nearest'});
  },[visible,active,activeName]);

  return <Popover.Root open={visible} onOpenChange={next=>next ? setOpen(true) : close()}>
    <Popover.Anchor asChild>
      <input id={id} className="roster-team-name" role="combobox" aria-label={label} aria-required="true" aria-invalid={Boolean(error)} aria-describedby={error ? id+'-error' : undefined}
        aria-autocomplete="list" aria-expanded={visible} aria-controls={visible ? listId : undefined}
        aria-activedescendant={visible && activeName ? listId+'-'+active : undefined}
        maxLength={100} placeholder="Võistkonna nimi" autoComplete="off" value={value}
        onFocus={()=>setOpen(true)} onClick={()=>setOpen(true)} onBlur={close}
        onChange={event=>{onChange(event.target.value);setActive(-1);setOpen(true)}}
        onKeyDown={event=>{
          if (event.nativeEvent.isComposing || event.metaKey || event.ctrlKey) return;
          if ((event.key==='ArrowDown' || event.key==='ArrowUp') && options.length) {
            event.preventDefault();
            setOpen(true);
            setActive(event.key==='ArrowDown' ? Math.min(active+1,options.length-1) : active<0 ? options.length-1 : Math.max(0,active-1));
          } else if (event.key==='Enter' && visible && activeName) {
            event.preventDefault();select(activeName);
          } else if (event.key==='Escape' && visible) {
            event.preventDefault();close();
          }
        }}/>
    </Popover.Anchor>
    <Popover.Portal>
      <Popover.Content ref={list} id={listId} role="listbox" aria-label="Võistkonnad"
        className="roster-name-options" align="start" sideOffset={4} collisionPadding={6}
        onOpenAutoFocus={event=>event.preventDefault()} onCloseAutoFocus={event=>event.preventDefault()}
        onInteractOutside={event=>{if ((event.target as HTMLElement).id===id) event.preventDefault()}}>
        {options.map((name,i)=><div key={name} id={listId+'-'+i} role="option" aria-selected={active===i}
          onMouseDown={event=>event.preventDefault()} onClick={()=>select(name)}>{name}</div>)}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}
