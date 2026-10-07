const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
process.env.SITE_ORIGIN='https://test.invalid';process.env.AUTHORIZED_CODES='TEST123';process.env.UPSTASH_REDIS_REST_URL='https://redis.invalid';process.env.UPSTASH_REDIS_REST_TOKEN='test';process.env.FORM_URL='https://forms.cloud.microsoft/test';
const db=new Map();let attempts=0,fail=false;
global.fetch=async(_url,opts)=>{if(fail)throw Error('offline');const [cmd,key,value]=JSON.parse(opts.body);let result=null;if(cmd==='EVAL')result=++attempts;if(cmd==='SET'){db.set(key,value);result='OK';}if(cmd==='GET')result=db.get(key)||null;if(cmd==='DEL'){result=db.delete(key)?1:0;}return {ok:true,json:async()=>({result})};};
const s=require('../api/_lib/security');const policy=require('../api/_lib/access-policy');const login=require('../api/verificar');const status=require('../api/sessao');const logout=require('../api/sair');const form=require('../api/formulario');
function req(body,method='POST',cookie=''){return {method,body,headers:{origin:process.env.SITE_ORIGIN,'content-type':'application/json',cookie},socket:{remoteAddress:'127.0.0.1'}};}
async function call(handler,r){const res={code:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(v){this.code=v;return this;},json(v){this.data=v;return this;},redirect(code,url){this.code=code;this.url=url;return this;}};await handler(r,res);return res;}
(async()=>{
  assert.equal(s.validAccessCode('TEST123'),true);assert.equal(s.validAccessCode('TEST12!'),false);
  for(const codigo of [1234567,['TEST123'],{},null,'TOO-LONG']){attempts=0;assert.equal((await call(login,req({codigo}))).code,400);}
  attempts=0;assert.equal((await call(login,req('{'))).code,400);
  const cross=req({codigo:'TEST123'});cross.headers.origin='https://evil.invalid';assert.equal((await call(login,cross)).code,403);
  attempts=0;const logged=await call(login,req({codigo:' test123 '}));assert.equal(logged.code,200);assert.equal(logged.data.link,undefined);
  const cookie=logged.headers['set-cookie'];assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/);assert.equal(cookie.includes('TEST123'),false);
  const r=req(undefined,'GET',cookie);assert.equal((await call(status,r)).code,200);assert.equal((await call(form,r)).code,302);assert.equal((await call(form,req(undefined,'GET'))).code,401);
  const webRequest=new Request('https://test.invalid/pedido.html',{headers:{cookie:cookie.split(';')[0]}});assert.equal(s.tokenFrom(webRequest),cookie.split(';')[0].split('=')[1]);assert.equal((await s.session(webRequest)).expiresAt,logged.data.expiresAt);
  await call(logout,req({},'POST',cookie));assert.equal((await call(status,r)).code,401);
  attempts=0;const exp=await call(login,req({codigo:'TEST123'}));for(const key of db.keys())db.set(key,String(Date.now()-1));assert.equal((await call(status,req(undefined,'GET',exp.headers['set-cookie']))).code,401);
  attempts=10;assert.equal((await call(login,req({codigo:'TEST123'}))).code,429);
  fail=true;attempts=0;assert.equal((await call(login,req({codigo:'TEST123'}))).code,503);
  for(const name of ['index.html','programa.html','pedido.html']){const html=fs.readFileSync(path.join(__dirname,'..',name),'utf8');assert(html.includes('acesso.js'));assert(html.includes('logo.png'));}
  const loginPage=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');assert(!loginPage.includes('Políticas e orientações'));assert(!loginPage.includes('banner1.png'));
  assert.equal(fs.existsSync(path.join(__dirname,'..','lib','security.js')),false);
  for(const pathname of [...policy.PROTECTED_PAGES,...policy.PROTECTED_ASSETS]){assert.equal(policy.decision(pathname,false),policy.PROTECTED_PAGES.includes(pathname)?'login':'not-found');assert.equal(policy.decision(pathname,true),'next');}
  for(const pathname of [...policy.PROTECTED_PAGES,...policy.PROTECTED_ASSETS,Object.keys(policy.PROTECTED_PAGE_ALIASES)[0]])assert.equal(policy.preAuthDecision(pathname),'check-session');
  for(const pathname of [...policy.PRIVATE_FILES,'/api/_lib/security.js','/tests/security.cjs','/pedido.html/extra'])assert.equal(policy.preAuthDecision(pathname),'not-found');
  assert.equal(policy.preAuthDecision('/style.css'),'next');
  for(const [alias,page] of Object.entries(policy.PROTECTED_PAGE_ALIASES)){assert.equal(policy.decision(alias,false),'login');assert.equal(policy.loginLocation(alias),'/?next='+encodeURIComponent(page));}
  assert.equal(policy.decision('/pedido.html/',false),'login');assert.equal(policy.decision('/pedido%2Ehtml',false),'login');assert.equal(policy.decision('/pedido.html/extra',false),'not-found');
  assert.equal(policy.decision('/api/_lib/security.js',false),'not-found');assert.equal(policy.decision('/tests/security.cjs',false),'not-found');
  assert.equal(policy.loginLocation('/pedido.html'),'/?next=%2Fpedido.html');assert.equal(policy.loginLocation('/banner1.png'),'/');
  const config=JSON.parse(fs.readFileSync(path.join(__dirname,'..','vercel.json'),'utf8'));assert.equal(config.proxy.entrypoint,'proxy.js');
  for(const pathname of [...policy.PROTECTED_PAGES,...policy.PROTECTED_ASSETS])assert(config.proxy.matcher.includes(pathname));
  assert(config.proxy.matcher.includes('/pedido/:path*'));assert(config.proxy.matcher.includes('/programa/:path*'));
  assert(config.proxy.matcher.includes('/api/_lib/:path*'));assert(config.proxy.matcher.includes('/lib/:path*'));
  console.log('PASS: access-code validation, CSRF, session cookie and Web Request parsing, expiry, logout revocation, form auth, rate limit, storage failure, protected static routes and private source paths.');
})().catch(e=>{console.error(e);process.exitCode=1;});
