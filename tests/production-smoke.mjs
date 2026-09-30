import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const root=resolve('dist');
const server=createServer(async(req,res)=>{
 try{
 const path=new URL(req.url,'http://localhost').pathname;
 const filename=path.startsWith('/assets/')||path==='/favicon.svg'?resolve(root,'.'+path):resolve(root,'index.html');
 if(!filename.startsWith(root)){res.writeHead(403).end();return;}
 const content=await readFile(filename);
 const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[extname(filename)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':type});res.end(content);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 const base='http://127.0.0.1:'+server.address().port;
 await page.goto(base+'/admin?preview=1');
 assert.equal(await page.getByRole('button',{name:'Entrar no painel'}).count(),1);
 assert.equal(await page.locator('table').count(),0);
 assert.equal(await page.getByText('Prévia visual do painel',{exact:false}).count(),0);
 await page.goto(base);
 assert.equal(await page.getByText('Prévia local',{exact:false}).count(),0);
 await page.getByRole('button',{name:'Iniciar diagnóstico'}).click();
 assert.equal(await page.locator('fieldset').count(),0);
 assert.equal(await page.getByText('O diagnóstico ainda não está disponível para envio.',{exact:false}).count(),1);
 console.log('PASS: build de produção não ativa quiz simulado nem prévia administrativa, mesmo com VITE_DEMO_MODE=true.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
