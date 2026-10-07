const PROTECTED_PAGES=['/programa.html','/pedido.html'];
const PROTECTED_PAGE_ALIASES={'/programa':'/programa.html','/pedido':'/pedido.html'};
const PROTECTED_ASSETS=['/banner1.png','/banner2.png','/banner3.png','/banner4.png'];
const PRIVATE_FILES=['/proxy.js','/vercel.json','/package.json','/LEIA-ME.md','/preview.cjs','/.env.example','/.gitignore'];
const PRIVATE_PREFIXES=['/lib/','/api/_lib/','/tests/'];

function normalizePath(pathname){
  let decoded=pathname;
  try{decoded=decodeURIComponent(pathname);}catch{}
  return decoded.length>1?decoded.replace(/\/+$/,''):decoded;
}
function canonicalPage(pathname){
  const normalized=normalizePath(pathname);
  return PROTECTED_PAGE_ALIASES[normalized]||normalized;
}
function isPrivatePath(pathname){
  const normalized=normalizePath(pathname);
  return PRIVATE_FILES.includes(normalized)||normalized==='/lib'||normalized==='/api/_lib'||normalized==='/tests'||PRIVATE_PREFIXES.some(prefix=>normalized.startsWith(prefix));
}
function isProtectedPath(pathname){
  const normalized=normalizePath(pathname);
  return PROTECTED_PAGES.includes(canonicalPage(normalized))||PROTECTED_ASSETS.includes(normalized);
}
function decision(pathname,authenticated){
  if(isPrivatePath(pathname))return 'not-found';
  const normalized=normalizePath(pathname);
  const page=canonicalPage(normalized);
  if(PROTECTED_PAGES.includes(page))return authenticated?'next':'login';
  if(PROTECTED_PAGES.some(protectedPage=>normalized.startsWith(protectedPage+'/'))||Object.keys(PROTECTED_PAGE_ALIASES).some(alias=>normalized.startsWith(alias+'/')))return 'not-found';
  if(!isProtectedPath(normalized)||authenticated)return 'next';
  return 'not-found';
}
function preAuthDecision(pathname){
  const action=decision(pathname,false);
  if(action==='next')return 'next';
  if(action==='not-found'&&!isProtectedPath(pathname))return 'not-found';
  return 'check-session';
}
function loginLocation(pathname){
  const page=canonicalPage(pathname);
  if(!PROTECTED_PAGES.includes(page))return '/';
  return '/?next='+encodeURIComponent(page);
}

module.exports={PROTECTED_PAGES,PROTECTED_PAGE_ALIASES,PROTECTED_ASSETS,PRIVATE_FILES,PRIVATE_PREFIXES,isPrivatePath,isProtectedPath,decision,preAuthDecision,loginLocation};
