import { next } from '@vercel/functions';
import security from './api/_lib/security.js';
import policy from './api/_lib/access-policy.js';

const {decision,preAuthDecision,loginLocation}=policy;
const privateHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};

function notFound(){return new Response('Not found',{status:404,headers:privateHeaders});}

export default async function proxy(request){
  const pathname=new URL(request.url).pathname;
  const beforeSession=preAuthDecision(pathname);
  if(beforeSession==='not-found')return notFound();
  if(beforeSession==='next')return next();

  try{
    const authenticated=Boolean(await security.session(request));
    const action=decision(pathname,authenticated);
    if(action==='not-found')return notFound();
    if(action==='login'){
      if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Unauthorized',{status:401,headers:privateHeaders});
      const location=new URL(loginLocation(pathname),request.url);
      return new Response(null,{status:302,headers:{...privateHeaders,Location:location.href}});
    }
    return next({headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
  }catch{
    return Response.json({ok:false,message:'Acesso temporariamente indisponível.'},{status:503,headers:privateHeaders});
  }
}
