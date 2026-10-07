const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
process.env.SITE_ORIGIN='https://test.invalid';process.env.AUTHORIZED_CODES='TEST123';process.env.UPSTASH_REDIS_REST_URL='https://redis.invalid';process.env.UPSTASH_REDIS_REST_TOKEN='test';process.env.FORM_URL='https://forms.cloud.microsoft/test';
const db=new Map();let attempts=0,fail=false;
global.fetch=async(_url,opts)=>{if(fail)throw Error('offline');const [cmd,key,value]=JSON.parse(opts.body);let result=null;if(cmd==='EVAL')result=++attempts;if(cmd==='SET'){db.set(key,value);result='OK';}if(cmd==='GET')result=db.get(key)||null;if(cmd==='DEL'){result=db.delete(key)?1:0;}return {ok:true,json:async()=>({result})};};
const s=require('../lib/security');const login=require('../api/verificar');const status=require('../api/sessao');const logout=require('../api/sair');const form=require('../api/formulario');
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
  await call(logout,req({},'POST',cookie));assert.equal((await call(status,r)).code,401);
  attempts=0;const exp=await call(login,req({codigo:'TEST123'}));for(const key of db.keys())db.set(key,String(Date.now()-1));assert.equal((await call(status,req(undefined,'GET',exp.headers['set-cookie']))).code,401);
  attempts=10;assert.equal((await call(login,req({codigo:'TEST123'}))).code,429);
  fail=true;attempts=0;assert.equal((await call(login,req({codigo:'TEST123'}))).code,503);
  for(const name of ['index.html','pedido.html']){const html=fs.readFileSync(path.join(__dirname,'..',name),'utf8');assert(html.includes('acesso.js'));assert(html.includes('logo.png'));}
  console.log('PASS: access-code validation, CSRF, session cookie, expiry, logout revocation, form redirect, rate limit and storage failure.');
})().catch(e=>{console.error(e);process.exitCode=1;});
