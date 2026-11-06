import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeFinderUrl } from './finder-config.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'};
const origins = new Set(['http://127.0.0.1:8787','http://localhost:8787']);
const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json = (res,code,body) => {
  res.writeHead(code, {...headers,'Content-Type':'application/json; charset=utf-8'});
  res.end(JSON.stringify(body));
};
const publicFiles = new Set(['index.html','styles.css','app.js','catalog.js','data.js',
  ...['profile','search','instructions','offers','logs','catalog','finder'].map(k=>'data/'+k+'.json')]);

http.createServer(async (req,res)=>{
  if (!origins.has('http://'+req.headers.host)) return json(res,403,{error:'Use the local Phone Scout address.'});
  try {
    const url=new URL(req.url,'http://127.0.0.1:8787');
    if (url.pathname==='/api/finder') {
      if (req.method!=='POST') return json(res,405,{error:'Use the finder settings form to save.'});
      if (!origins.has(req.headers.origin)||req.headers.origin!=='http://'+req.headers.host ||
          req.headers['content-type']?.split(';')[0]!=='application/json') {
        return json(res,403,{error:'Save from the local Phone Scout page.'});
      }
      let bytes=0;
      const chunks=[];
      for await (const chunk of req) {
        bytes+=chunk.length;
        if (bytes>5000) return json(res,413,{error:'The finder link is too long.'});
        chunks.push(chunk);
      }
      let sourceUrl;
      try { sourceUrl=normalizeFinderUrl(JSON.parse(Buffer.concat(chunks).toString('utf8')).sourceUrl); }
      catch { return json(res,400,{error:'Paste a valid filtered GSMArena Phone Finder link.'}); }
      const config={sourceUrl,updatedAt:new Date().toISOString()};
      const target=path.join(root,'data','finder.json');
      fs.writeFileSync(target+'.tmp',JSON.stringify(config,null,2)+'\n');
      fs.renameSync(target+'.tmp',target);
      return json(res,200,config);
    }
    const file=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);
    if (!['GET','HEAD'].includes(req.method)||!publicFiles.has(file)) {res.writeHead(404,headers);return res.end('Not found');}
    const bytes=fs.readFileSync(path.join(root,file));
    res.writeHead(200,{...headers,'Content-Type':types[path.extname(file)]+'; charset=utf-8'});
    res.end(req.method==='HEAD'?undefined:bytes);
  }catch{
    if(!res.headersSent)json(res,500,{error:'Could not read or save Phone Scout data.'});
    else res.end();
  }
}).listen(8787,'127.0.0.1',()=>console.log('Phone Scout: http://127.0.0.1:8787'));
