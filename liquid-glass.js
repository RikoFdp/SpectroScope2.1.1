(() => {
  const state={files:[],active:null,tab:0,dragX:0,velocity:0,lastX:0,lastT:0};
  const $=s=>document.querySelector(s), el=(t,c)=>{const n=document.createElement(t);if(c)n.className=c;return n};
  function icon(path){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${path}"/></svg>`}
  function build(){
    const landing=$('#landing-page'), workspace=$('#workspace'); if(!landing||!workspace)return;
    document.body.style.setProperty('--gx','50%'); document.body.style.setProperty('--gy','18%');
    const importPage=el('section','lg-page active'); importPage.id='import-page';
    const importHead=el('div'); importHead.style.cssText='border:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important';
    importHead.innerHTML='<h1 class="lg-page-title">Import</h1><p class="lg-page-sub">Your audio stays on this device. Add several tracks, then jump between analysis and playback.</p>';
    const dz=$('#drop-zone'); const oldTitle=landing.querySelector('.text-center'); if(oldTitle) oldTitle.remove();
    importPage.append(importHead,dz); const library=el('div');library.id='imported-library';importPage.append(library); landing.innerHTML='';landing.append(importPage);landing.classList.remove('hidden');
    const spectro=workspace.children[1]; const split=workspace.children[2]; const info=split?.children[0]; const player=split?.children[1];
    const media=el('section','lg-page');media.id='media-page';media.innerHTML='<h1 class="lg-page-title">Media Info</h1><p class="lg-page-sub">Spectrogram, container details, audio properties and embedded artwork.</p>';
    if(spectro)media.append(spectro); if(info){info.classList.add('media-info-card');media.append(info)}
    const playerPage=el('section','lg-page');playerPage.id='player-page';playerPage.innerHTML='<h1 class="lg-page-title">Now Playing</h1><p class="lg-page-sub">A focused music player inspired by Apple Music.</p>';
    if(player){player.classList.add('player-shell');playerPage.append(player)}
    workspace.innerHTML='';workspace.append(media,playerPage);workspace.classList.remove('hidden');workspace.classList.add('flex');
    makeNav(); setTab(0,false); enhanceInput(); renderLibrary();
  }
  function makeNav(){
    const wrap=el('div');wrap.id='liquid-nav-wrap';wrap.innerHTML=`<div id="liquid-nav"><div id="nav-bubble"></div><div class="nav-tabs">
      <button class="nav-tab active" data-i="0">${icon('M12 3v12m0 0 4-4m-4 4-4-4M5 19h14')}<span>Import</span></button>
      <button class="nav-tab" data-i="1">${icon('M4 18V6m4 12V9m4 9V4m4 14v-7m4 7V8')}<span>Media Info</span></button>
      <button class="nav-tab" data-i="2">${icon('M9 18V5l11-2v13M9 18c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2Zm11-2c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2Z')}<span>Player</span></button>
    </div></div>`;document.body.append(wrap);
    wrap.querySelectorAll('.nav-tab').forEach(b=>b.addEventListener('click',()=>setTab(+b.dataset.i)));
    const nav=$('#liquid-nav'),bubble=$('#nav-bubble');
    const moveBubble=(x,stretch=1)=>{bubble.style.setProperty('--bx',`${x}px`);bubble.style.setProperty('--stretch',stretch)};
    function metrics(){return {step:(wrap.clientWidth-14)/3,max:2*(wrap.clientWidth-14)/3}}
    let dragging=false,start=0,base=0;
    const down=e=>{dragging=true;wrap.classList.add('dragging');start=e.clientX;const m=metrics();base=state.tab*m.step;state.lastX=e.clientX;state.lastT=performance.now();wrap.setPointerCapture?.(e.pointerId)};
    const move=e=>{const r=wrap.getBoundingClientRect();nav.style.setProperty('--lx',`${((e.clientX-r.left)/r.width)*100}%`);nav.style.setProperty('--ly',`${((e.clientY-r.top)/r.height)*100}%`);if(!dragging)return;const m=metrics();let x=Math.max(0,Math.min(m.max,base+e.clientX-start));const now=performance.now(),dt=Math.max(1,now-state.lastT);state.velocity=(e.clientX-state.lastX)/dt;state.lastX=e.clientX;state.lastT=now;moveBubble(x,1+Math.min(.16,Math.abs(state.velocity)*.08));};
    const up=e=>{if(!dragging)return;dragging=false;wrap.classList.remove('dragging');const m=metrics();let x=Math.max(0,Math.min(m.max,base+e.clientX-start+state.velocity*75));setTab(Math.round(x/m.step));};
    wrap.addEventListener('pointerdown',down);wrap.addEventListener('pointermove',move);wrap.addEventListener('pointerup',up);wrap.addEventListener('pointercancel',up);
    window.addEventListener('resize',()=>setTab(state.tab,false));
  }
  function setTab(i,animate=true){state.tab=Math.max(0,Math.min(2,i));['#import-page','#media-page','#player-page'].forEach((s,n)=>$(s)?.classList.toggle('active',n===state.tab));document.querySelectorAll('.nav-tab').forEach((b,n)=>b.classList.toggle('active',n===state.tab));const wrap=$('#liquid-nav-wrap'),bubble=$('#nav-bubble');if(wrap&&bubble){const step=(wrap.clientWidth-14)/3;bubble.style.setProperty('--bx',`${state.tab*step}px`);bubble.style.setProperty('--stretch','1')}window.scrollTo({top:0,behavior:animate?'smooth':'auto'});}
  function enhanceInput(){const input=$('#file-input'),dz=$('#drop-zone');if(!input||!dz)return;input.multiple=true;
    input.addEventListener('change',e=>capture(e.target.files),true);dz.addEventListener('drop',e=>capture(e.dataTransfer.files),true);
  }
  function capture(list){const files=[...list].filter(f=>f.type.startsWith('audio/')||/\.(flac|wav|m4a|mp3|ogg|opus|aac|aiff?)$/i.test(f.name));for(const f of files){if(!state.files.some(x=>x.name===f.name&&x.size===f.size&&x.lastModified===f.lastModified))state.files.push(f)}if(files[0])state.active=files[0];setTimeout(renderLibrary,20)}
  function renderLibrary(){const lib=$('#imported-library');if(!lib)return;if(!state.files.length){lib.innerHTML='<div style="padding:18px;text-align:center;color:rgba(255,255,255,.42);font-size:13px">Imported files will appear here.</div>';return}lib.innerHTML='';state.files.forEach((f,i)=>{const r=el('div','import-row'+(state.active===f?' active':''));const ext=(f.name.split('.').pop()||'AUDIO').toUpperCase();r.innerHTML=`<div class="file-icon">${ext.slice(0,4)}</div><div class="file-main"><b>${escapeHtml(f.name)}</b><span>${(f.size/1048576).toFixed(2)} MiB • local file</span></div><div class="file-open">Open</div>`;r.onclick=()=>{state.active=f;renderLibrary();if(typeof window.handleFiles==='function')window.handleFiles([f]);else {const dt=new DataTransfer();dt.items.add(f);const inp=$('#file-input');inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}))}setTab(1)};lib.append(r)})}
  function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  window.addEventListener('load',()=>setTimeout(build,40));
  window.addEventListener('pointermove',e=>{document.body.style.setProperty('--gx',`${e.clientX/innerWidth*100}%`);document.body.style.setProperty('--gy',`${e.clientY/innerHeight*100}%`)},{passive:true});
})();
