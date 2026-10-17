import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const data={};
for(const key of ['profile','search','instructions','offers','logs']) data[key]=JSON.parse(fs.readFileSync(path.join(root,'data',key+'.json'),'utf8').replace(/^\uFEFF/,''));
for(const key of ['active','history']) if(!Array.isArray(data.offers[key]))throw new Error('offers.'+key+' must be an array');
if(!Array.isArray(data.search.models)||!Array.isArray(data.instructions.sections)||!Array.isArray(data.logs.entries))throw new Error('Invalid data arrays');
const seen=new Set();
for(const o of data.offers.active){
 if(!['in_stock','not_stated','check_failed','low_stock'].includes(o.stock?.status)||!o.stock?.checkedAt||!o.stock?.evidence||!o.url)throw new Error('Listed offer requires an honest availability status, check date, evidence and URL: '+o.id);
 if(!o.id||seen.has(o.id))throw new Error('Missing or duplicate offer id'); seen.add(o.id);
 if(!Number.isFinite(o.rank)||!Number.isFinite(o.cashPrice))throw new Error('Offer rank and cashPrice must be numbers');
 if(!/^https?:\/\//.test(o.url))throw new Error('Invalid offer URL');
}
data.offers.active.sort((a,b)=>a.rank-b.rank||a.cashPrice-b.cashPrice);
const content='/* Generated from data/*.json by build-data.mjs. Do not edit. */\nwindow.PHONE_DATA = '+JSON.stringify(data).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029')+';\n';
fs.writeFileSync(path.join(root,'data.js.tmp'),content);fs.renameSync(path.join(root,'data.js.tmp'),path.join(root,'data.js'));
console.log('Validated and built data.js: '+data.search.models.length+' model targets, '+data.offers.active.length+' active offers, '+data.logs.entries.length+' log entries.');
