import {build} from 'esbuild';
import {mkdir,readFile,writeFile,cp,copyFile} from 'node:fs/promises';
import {firstArchiveYear} from '../lib/archive-years.mjs';
const dir='docs';
await mkdir(dir,{recursive:true});
await build({entryPoints:['pages/main.tsx'],outfile:dir+'/bowling.js',bundle:true,minify:true,format:'esm',jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"'}});
const sheets=['globals','apple','awards','workspace','arena','hall','lions-brand','archive'];
const styles=await Promise.all(sheets.map(name=>readFile('app/'+name+'.css','utf8')));
await writeFile(dir+'/bowling.css',styles.join('\n').replaceAll("url('/","url('./"));
await cp('public',dir,{recursive:true});
await copyFile('pages/index.html',dir+'/index.html');
await writeFile(dir+'/.nojekyll','');

// GitHub Pages serves physical year entry points. The fallback supports later years.
const archiveShell=(await readFile('pages/index.html','utf8')).replace('<head>','<head><base href="../">').replace('<title>LIONS BOWLING</title>','<title>Võistluste arhiiv · LIONS BOWLING</title>');
const yearRoutes=[];
for(let year=firstArchiveYear;year<=2100;year++)yearRoutes.push(String(year));
for(const route of ['arhiiv',...yearRoutes]){
  await mkdir(dir+'/'+route,{recursive:true});
  await writeFile(dir+'/'+route+'/index.html',archiveShell);
}
await writeFile(dir+'/404.html',archiveShell);
