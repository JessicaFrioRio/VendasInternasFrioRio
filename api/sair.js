const s=require('./_lib/security');
module.exports=async(req,res)=>{s.headers(res);if(req.method!=='POST')return res.status(405).json({ok:false});if(!s.sameOrigin(req))return res.status(403).json({ok:false});try{await s.revoke(req);res.setHeader('Set-Cookie',s.cookie('',0));return res.status(200).json({ok:true});}catch{return res.status(503).json({ok:false});}};
