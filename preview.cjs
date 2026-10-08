// Local-only preview. Never deploy this server or its simulated storage.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname,port=4173;
process.env.SITE_ORIGIN=`http://localhost:${port}`;
process.env.AUTHORIZED_CODES='TEST123';
process.env.UPSTASH_REDIS_REST_URL='https://preview.invalid';
process.env.UPSTASH_REDIS_REST_TOKEN='preview-only';
delete process.env.VERCEL;
const db=new Map();
global.fetch=async(_url,options)=>{
  const a=JSON.parse(options.body);let result=null;
  function get(k){const v=db.get(k);if(v&&v.until<=Date.now()){db.delete(k);return null;}return v;}
  if(a[0]==='SET'){db.set(a[1],{value:a[2],until:Date.now()+Number(a[4])*1000});result='OK';}
  if(a[0]==='GET')result=get(a[1])?.value||null;
  if(a[0]==='DEL')result=db.delete(a[1])?1:0;
  if(a[0]==='EVAL'){const key=a[3],old=get(key);const next={value:Number(old?.value||0)+1,until:old?.until||Date.now()+Number(a[4])*1000};db.set(key,next);result=next.value;}
  return {ok:true,json:async()=>({result})};
};
const handlers={
  '/api/verificar':require('./api/verificar'),
  '/api/sessao':require('./api/sessao'),
  '/api/sair':require('./api/sair'),
};
const security=require('./api/_lib/security');
const policy=require('./api/_lib/access-policy');
http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,process.env.SITE_ORIGIN).pathname;
  res.status=n=>{res.statusCode=n;return res;};
  res.json=v=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(v));};
  if(handlers[pathname]){
    let body='';for await(const c of req){body+=c;if(body.length>4096){res.status(413).json({ok:false});return;}}
    req.body=body||undefined;
    // Secure host cookies are for production HTTPS. localhost preview uses a plain local cookie.
    req.headers.cookie=(req.headers.cookie||'').replaceAll('friorio_preview=','__Host-friorio_session=');
    const set=res.setHeader.bind(res);res.setHeader=(k,v)=>{if(k.toLowerCase()==='set-cookie')v=v.replace('__Host-friorio_session=','friorio_preview=').replace('; Secure','');return set(k,v);};
    await handlers[pathname](req,res);return;
  }
  if(pathname==='/api/formulario'){
    req.headers.cookie=(req.headers.cookie||'').replaceAll('friorio_preview=','__Host-friorio_session=');
    security.headers(res);if(!await security.session(req)){res.status(401).json({ok:false});return;}
    res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Pedido de demonstração</title><body style="font-family:Segoe UI;padding:40px"><h1>Seu acesso ao pedido foi validado</h1><p>Esta é uma demonstração local. Nenhum pedido foi enviado.</p><p>Na publicação, este botão abrirá o Microsoft Forms configurado.</p><a href="/pedido.html">Voltar ao site</a></body></html>');return;
  }
  if(policy.isPrivatePath(pathname)){res.statusCode=404;res.end('Not found');return;}
  const aliases={'/':'index.html','/programa':'programa.html','/pedido':'pedido.html'};
  const name=aliases[pathname]||pathname.slice(1);
  if(!['index.html','programa.html','pedido.html','privacidade.html','regras-programa-vendas.pdf','acesso.js','style.css','logo.png','banner1.png','banner2.png','banner3.png','banner4.png'].includes(name)){res.statusCode=404;res.end('Not found');return;}
  if(policy.isProtectedPath(pathname)){
    req.headers.cookie=(req.headers.cookie||'').replaceAll('friorio_preview=','__Host-friorio_session=');
    try{
      const authenticated=Boolean(await security.session(req));
      const action=policy.decision(pathname,authenticated);
      if(action==='login'){
        res.writeHead(302,{'Location':policy.loginLocation(pathname),'Cache-Control':'no-store'});res.end();return;
      }
      if(action!=='next'){res.statusCode=404;res.end('Not found');return;}
    }catch{res.statusCode=503;res.end('Temporarily unavailable');return;}
  }
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.pdf')?'application/pdf':'image/png');
  let content=fs.readFileSync(path.join(root,name));
  if(name.endsWith('.html'))content=content.toString().replace('<body class="travado">','<body class="travado"><div style="background:#fff3cd;color:#4a3500;padding:10px;text-align:center">Prévia local • Nenhum pedido real</div>');
  res.end(content);
}).listen(port,'127.0.0.1',()=>console.log(`Preview ready: http://localhost:${port}`));
