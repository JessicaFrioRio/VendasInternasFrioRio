const {randomBytes,createHash} = require('node:crypto');
const TTL=1800, NAME='__Host-friorio_session';
function headers(res){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');}
function validCpf(c){if(!/^\d{11}$/.test(c)||/^(\d)\1{10}$/.test(c))return false;for(const n of [9,10]){let sum=0;for(let i=0;i<n;i++)sum+=Number(c[i])*(n+1-i);let d=(sum*10)%11;if(d===10)d=0;if(d!==Number(c[n]))return false;}return true;}
function allowed(cpf){return (process.env.AUTHORIZED_CPFS||'').split(/[\s,;]+/).map(c=>c.replace(/\D/g,'')).filter(validCpf).includes(cpf);}
function configured(){return !!(process.env.AUTHORIZED_CPFS && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);}
async function redis(command){const url=new URL(process.env.UPSTASH_REDIS_REST_URL);if(url.protocol!=='https:')throw new Error('Invalid configuration');const r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(5000)});if(!r.ok)throw new Error('Storage unavailable');const data=await r.json();if(data.error)throw new Error('Storage error');return data.result;}
function hash(v){return createHash('sha256').update(v).digest('hex');}
async function limit(req){const ip=process.env.VERCEL ? req.headers['x-vercel-forwarded-for'] : req.socket?.remoteAddress;if(typeof ip!=='string'||!ip)throw new Error('Client address unavailable');const count=await redis(['EVAL',"local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",1,'friorio:attempts:'+hash(ip),900]);return Number(count)<=10;}
function cookie(token,age){return `${NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return req.headers['sec-fetch-site']==='same-origin';return typeof process.env.SITE_ORIGIN==='string' && origin===process.env.SITE_ORIGIN;}
function tokenFrom(req){const raw=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(NAME+'='));const token=raw?.slice(NAME.length+1);return /^[a-f0-9]{64}$/.test(token||'')?token:null;}
async function createSession(){const token=randomBytes(32).toString('hex');const expiresAt=Date.now()+TTL*1000;await redis(['SET','friorio:session:'+hash(token),String(expiresAt),'EX',TTL]);return {token,expiresAt};}
async function session(req){const token=tokenFrom(req);if(!token)return null;const expiresAt=Number(await redis(['GET','friorio:session:'+hash(token)]));return expiresAt>Date.now()?{token,expiresAt}:null;}
async function revoke(req){const token=tokenFrom(req);if(token)await redis(['DEL','friorio:session:'+hash(token)]);}
module.exports={TTL,headers,validCpf,allowed,configured,limit,cookie,sameOrigin,createSession,session,revoke};
