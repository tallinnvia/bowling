import {build} from 'esbuild';
import {mkdir,readFile,writeFile,cp,copyFile} from 'node:fs/promises';
const dir='docs';
await mkdir(dir,{recursive:true});
await build({entryPoints:['pages/main.tsx'],outfile:dir+'/bowling.js',bundle:true,minify:true,format:'esm',jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"'}});
const sheets=['globals','apple','awards','workspace','arena','hall','lions-brand'];
const styles=await Promise.all(sheets.map(name=>readFile('app/'+name+'.css','utf8')));
await writeFile(dir+'/bowling.css',styles.join('\n').replaceAll("url('/","url('./"));
await cp('public',dir,{recursive:true});
await copyFile('pages/index.html',dir+'/index.html');
await writeFile(dir+'/.nojekyll','');
