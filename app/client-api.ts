const storageKey = 'lions.organizer.session';
export const readSession = () => sessionStorage.getItem(storageKey);
export function saveSession(token: string | null) {
  if (token) sessionStorage.setItem(storageKey, token);
  else sessionStorage.removeItem(storageKey);
}
export function apiFetch(path:string, options:RequestInit={}) {
  const headers=new Headers(options.headers);
  const token=readSession();
  if(token) headers.set('X-Bowling-Session','Bearer '+token);
  const base=document.querySelector<HTMLMetaElement>('meta[name="bowling-api"]')?.content || location.origin;
  return fetch(new URL(path,base),{...options,headers,credentials:'omit',cache:'no-store'});
}
