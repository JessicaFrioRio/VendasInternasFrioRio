(function(){
  'use strict';
  try{sessionStorage.removeItem('friorio_cpf');}catch{}
  const gate=document.createElement('section');gate.className='trava';
  gate.innerHTML='<div class="trava-caixa"><h1>Acesso exclusivo para colaboradores</h1><p>Digite seu CPF para verificar a elegibilidade.</p><label for="cpf">CPF</label><input id="cpf" type="text" inputmode="numeric" maxlength="14" autocomplete="off" placeholder="000.000.000-00"><p role="alert" hidden></p><button class="botao" type="button">Entrar</button></div>';
  document.querySelector('header').after(gate);
  const input=gate.querySelector('input'),error=gate.querySelector('[role=alert]'),button=gate.querySelector('button');
  let busy=false,timer;
  const logout=document.createElement('button');logout.textContent='Sair';logout.type='button';logout.className='botao';logout.hidden=true;document.querySelector('.menu').append(logout);
  function lock(){clearTimeout(timer);document.body.classList.add('travado');gate.hidden=false;logout.hidden=true;document.querySelectorAll('[data-form]').forEach(a=>a.href='#');}
  function release(data){if(!Number.isFinite(data.expiresAt)||data.expiresAt<=Date.now())return lock();input.value='';gate.hidden=true;document.body.classList.remove('travado');logout.hidden=false;document.querySelectorAll('[data-form]').forEach(a=>a.href='/api/formulario');clearTimeout(timer);timer=setTimeout(lock,Math.max(0,data.expiresAt-Date.now()));}
  function show(text){error.textContent=text;error.hidden=false;}
  async function call(url,options){const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});const data=await r.json();return {r,data};}
  async function check(){try{const {r,data}=await call('/api/sessao');if(r.ok&&data.ok)release(data);else lock();}catch{lock();}}
  async function enter(){if(busy)return;error.hidden=true;const cpf=input.value.replace(/\D/g,'');if(cpf.length!==11)return show('Confira os 11 dígitos do CPF.');busy=true;button.disabled=true;button.textContent='Verificando...';try{const {r,data}=await call('/api/verificar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf})});if(r.ok&&data.ok)release(data);else show(r.status===429?'Muitas tentativas. Aguarde 15 minutos.':r.status===503?'Acesso temporariamente indisponível.':'Não foi possível autorizar o acesso. Confira os dados.');}catch{show('Não foi possível conectar. Tente novamente.');}finally{busy=false;button.disabled=false;button.textContent='Entrar';}}
  button.addEventListener('click',enter);input.addEventListener('keydown',e=>{if(e.key==='Enter')enter();});
  input.addEventListener('input',()=>{const d=input.value.replace(/\D/g,'').slice(0,11);input.value=d.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1-$2');});
  logout.addEventListener('click',async()=>{logout.disabled=true;try{const {r}=await call('/api/sair',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(r.ok)lock();else{lock();show('Não foi possível encerrar a sessão no servidor. Tente novamente.');logout.hidden=false;}}catch{lock();show('Não foi possível encerrar a sessão no servidor. Tente novamente.');logout.hidden=false;}finally{logout.disabled=false;}});
  window.addEventListener('pageshow',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});check();
})();
document.querySelectorAll('.carousel').forEach(carousel=>{
  const track=carousel.querySelector('.carousel-faixa'),slides=carousel.querySelectorAll('.slide'),dots=carousel.querySelector('.bolinhas');let current=0,paused=false;
  function go(i){current=(i+slides.length)%slides.length;track.style.transform='translateX(-'+current*100+'%)';[...dots.children].forEach((b,n)=>b.classList.toggle('ativo',n===current));}
  slides.forEach((_,n)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Ir para o banner '+(n+1));b.addEventListener('click',()=>go(n));dots.append(b);});
  carousel.querySelector('.anterior').addEventListener('click',()=>go(current-1));carousel.querySelector('.proximo').addEventListener('click',()=>go(current+1));carousel.addEventListener('mouseenter',()=>paused=true);carousel.addEventListener('mouseleave',()=>paused=false);
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>{if(!paused)go(current+1);},6000);
  let x=null;carousel.addEventListener('touchstart',e=>x=e.touches[0].clientX,{passive:true});carousel.addEventListener('touchend',e=>{if(x!==null){const d=e.changedTouches[0].clientX-x;if(Math.abs(d)>40)go(current+(d<0?1:-1));x=null;}});go(0);
});
