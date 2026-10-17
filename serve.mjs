import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'};
http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost');const relative=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);const full=path.resolve(root,relative);if(!full.startsWith(root+path.sep)||!types[path.extname(full)]){res.writeHead(404);return res.end('Not found');}const bytes=fs.readFileSync(full);res.writeHead(200,{'Content-Type':types[path.extname(full)]+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}}).listen(8787,'127.0.0.1',()=>console.log('Phone Scout: http://127.0.0.1:8787'));
