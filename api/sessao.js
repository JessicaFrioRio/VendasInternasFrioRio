const s=require('../lib/security');
module.exports=async(req,res)=>{s.headers(res);if(req.method!=='GET')return res.status(405).json({ok:false});try{const session=await s.session(req);if(!session)return res.status(401).json({ok:false});return res.status(200).json({ok:true,expiresAt:session.expiresAt});}catch{return res.status(503).json({ok:false});}};
