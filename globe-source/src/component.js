/* Componente senza framework. DATA, WORLD, STYLE, d3 e topojson sono inseriti da build.cjs. */
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nodeMap = new Map(DATA.nodes.map(node => [node.id, node]));
const lensMap = new Map(DATA.lenses.map(lens => [lens.id, lens]));
class MetaHistoriaGlobe extends HTMLElement {
  static get observedAttributes() { return ['site-base', 'lens', 'city']; }
  constructor() {
    super(); this.attachShadow({mode:'open'});
    this.state = {lens:'classica',city:'all',route:null,running:!matchMedia('(prefers-reduced-motion: reduce)').matches};
  }
  connectedCallback() {
    if(this.cleanup) return;
    if(lensMap.has(this.getAttribute('lens'))) this.state.lens=this.getAttribute('lens');
    if(nodeMap.has(this.getAttribute('city'))) this.state.city=this.getAttribute('city');
    if(this.getAttribute('auto-rotate')==='false')this.state.running=false;
    const abort=new AbortController(); this.abort=abort;
    this.shadowRoot.innerHTML='<style>'+STYLE+'</style>'+this.markup();
    const root=this.shadowRoot;
    root.querySelectorAll('[data-lens]').forEach(button=>button.addEventListener('click',()=>this.setView({lens:button.dataset.lens}),{signal:abort.signal}));
    root.querySelector('select').addEventListener('change',e=>this.setView({city:e.target.value,route:null}),{signal:abort.signal});
    root.querySelector('.motion').addEventListener('click',()=>{this.state.running=!this.state.running;this.map.setMotion(this.state.running);this.refresh(false);this.changed();},{signal:abort.signal});
    root.querySelector('.detail').addEventListener('click',e=>{
      const node=e.target.closest('[data-city]'),route=e.target.closest('[data-route]'),back=e.target.closest('[data-back]');
      if(node)this.setView({city:node.dataset.city,route:null});
      if(route)this.setView({route:Number(route.dataset.route)});
      if(back)this.setView({route:null});
    },{signal:abort.signal});
    try{
      this.map=createGlobe(root.querySelector('canvas'),()=>this.state,change=>this.setView(change));
      this.cleanup=()=>{abort.abort();this.map.destroy();this.cleanup=null;};
      this.refresh(false);
      if(this.state.city!=='all')this.map.focus(this.state.city);
    }catch(error){root.querySelector('.map-frame').innerHTML='<p class="error" role="alert">Il globo non è disponibile in questo browser. I dossier restano accessibili dalla scheda.</p>';this.refresh(false);this.cleanup=()=>{abort.abort();this.cleanup=null;};console.error('MetaHistoria globe:',error);}
  }
  disconnectedCallback(){this.cleanup?.();}
  attributeChangedCallback(name,oldValue,value){
    if(oldValue===value||!this.cleanup)return;
    if(name==='lens'&&lensMap.has(value))this.setView({lens:value});
    else if(name==='city'&&(value==='all'||nodeMap.has(value)))this.setView({city:value,route:null});
    else if(name==='site-base')this.refresh(false);
  }
  link(path){
    if(!/^\/(?!\/)/.test(path))return '#';
    const base=this.getAttribute('site-base');
    if(!base)return path;
    try{const url=new URL(base);if(!['http:','https:'].includes(url.protocol))return path;return new URL(path,url.origin).href;}catch{return path;}
  }
  markup(){
    return '<section class="atlas" aria-label="Atlante del sacro e del potere">'+
      '<nav class="lenses" aria-label="Le cinque lenti del Metodo Pentaedrico">'+DATA.lenses.map(l=>'<button type="button" class="lens" data-lens="'+l.id+'" aria-label="'+escapeHTML(l.name)+'" aria-pressed="false"><span class="lens-number">'+l.number+'</span><span>'+escapeHTML(l.short)+'</span></button>').join('')+'</nav>'+
      '<div class="lens-intro"><h2></h2><p></p></div><div class="workspace"><div class="map-section">'+
      '<div class="map-frame"><canvas role="img" aria-label="Globo interattivo con otto punti di accesso ai dossier di MetaHistoria. Seleziona un luogo dal menu per esplorarli con la tastiera."></canvas><div class="map-index"><b>08</b> LUOGHI &nbsp; / &nbsp; <b>05</b> LENTI</div><span class="map-hint">Trascina il globo · Seleziona un luogo</span><span class="map-status" aria-hidden="true"></span></div>'+
      '<div class="map-tools"><div class="field"><label for="mh-city">Punto di osservazione</label><select id="mh-city"><option value="all">Tutti i luoghi</option>'+DATA.nodes.map(n=>'<option value="'+n.id+'">'+escapeHTML(n.name)+' — '+escapeHTML(n.group)+'</option>').join('')+'</select></div>'+
      '<button type="button" class="motion" aria-label="Metti in pausa l’animazione"><span class="motion-symbol" aria-hidden="true">Ⅱ</span><span class="motion-text">Pausa</span></button></div></div>'+
      '<aside class="detail" aria-label="Scheda di lettura"></aside></div>'+
      '<div class="method"><p>'+escapeHTML(DATA.notice)+'</p><a data-method href="'+this.link('/metodo-pentaedrico')+'" target="_top">Il metodo &nbsp;↗</a></div><p class="announcer" role="status" aria-live="polite" aria-atomic="true"></p></section>';
  }
  setView(change={}){
    if(change.lens!==undefined&&!lensMap.has(change.lens))return;
    if(change.city!==undefined&&change.city!=='all'&&!nodeMap.has(change.city))return;
    if(change.route!==undefined&&change.route!==null&&!DATA.routes[change.route])return;
    const cityChanged=change.city!==undefined&&change.city!==this.state.city;
    Object.assign(this.state,change);
    if(change.city!==undefined&&change.route===undefined)this.state.route=null;
    this.refresh(true);
    if(cityChanged)this.map?.focus(this.state.city);
    this.map?.draw();this.changed();
  }
  changed(){this.dispatchEvent(new CustomEvent('metahistoria:change',{bubbles:true,composed:true,detail:{...this.state}}));}
  refresh(announce){
    const root=this.shadowRoot,lens=lensMap.get(this.state.lens),node=nodeMap.get(this.state.city),route=DATA.routes[this.state.route];
    this.style.setProperty('--mh-accent',lens.color);
    root.querySelectorAll('[data-lens]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.lens===lens.id)));
    root.querySelector('.lens-intro h2').textContent=lens.name;
    root.querySelector('.lens-intro p').textContent=lens.question;
    root.querySelector('select').value=this.state.city;
    const motion=root.querySelector('.motion');motion.setAttribute('aria-pressed',String(!this.state.running));motion.setAttribute('aria-label',this.state.running?'Metti in pausa l’animazione':'Avvia l’animazione');
    root.querySelector('.motion-symbol').textContent=this.state.running?'Ⅱ':'▷';root.querySelector('.motion-text').textContent=this.state.running?'Pausa':'Riprendi';
    root.querySelector('.map-status').textContent=this.state.running?'IN MOVIMENTO':'IN PAUSA';
    root.querySelector('[data-method]').href=this.link('/metodo-pentaedrico');
    root.querySelector('.detail').innerHTML=this.detailMarkup(lens,node,route);
    if(announce)root.querySelector('.announcer').textContent=lens.name+'. '+(route?route.title:node?node.name:'Tutti i luoghi')+'. Scheda di lettura aggiornata.';
  }
  readingLink(path,title){return '<a class="detail-link" href="'+escapeHTML(this.link(path))+'" target="_top"><span>'+escapeHTML(title)+'</span><span class="arrow" aria-hidden="true">↗</span></a>';}
  detailMarkup(lens,node,route){
    const e=escapeHTML;
    if(route){
      const a=nodeMap.get(route.a),b=nodeMap.get(route.b);
      return '<button class="back" data-back type="button">← Torna alla scheda</button><p class="overline">CONFRONTO EDITORIALE</p><h3>'+e(route.title)+'</h3><p class="subtitle">'+e(a.name)+' ↔ '+e(b.name)+'</p><p class="body">'+e(route.description)+'</p><div class="question"><label>'+e(lens.name)+'</label><p>'+e(lens.question)+'</p></div><div class="detail-links"><p class="reading-label">Leggi i due dossier</p>'+this.readingLink(a.path,a.article)+this.readingLink(b.path,b.article)+this.readingLink(lens.path,'Approfondisci la lente')+'</div>';
    }
    if(!node){
      return '<p class="overline">CARTOGRAFIA DELLE IDEE</p><h3>Il sacro e<br>il potere.</h3><p class="subtitle">Otto luoghi, cinque prospettive</p><p class="body">Un punto sulla mappa apre un dossier. Una linea accosta due letture. Le cinque lenti interrogano lo stesso mondo da profondità diverse.</p><div class="node-grid">'+DATA.nodes.map(n=>'<button type="button" class="node-link" data-city="'+n.id+'"><span>'+e(n.label)+'</span><span aria-hidden="true">↗</span></button>').join('')+'</div><div class="question"><label>La lente attiva · '+e(lens.key)+'</label><p>'+e(lens.question)+'</p></div><div class="detail-links">'+this.readingLink(lens.path,'Entra nella lente')+this.readingLink('/biblioteca-pentaedrica','Biblioteca Pentaedrica')+'</div>';
    }
    const index=DATA.lenses.findIndex(l=>l.id===lens.id),links=[];
    if(lens.id==='anima'&&node.animaPath)links.push(this.readingLink(node.animaPath,node.group+' · Geopolitica dell’Anima'));
    links.push(this.readingLink(node.path,node.article));
    if(node.secondaryPath)links.push(this.readingLink(node.secondaryPath,node.secondaryTitle));
    links.push(this.readingLink(lens.path,'Approfondisci la lente'));
    const related=DATA.routes.map((r,i)=>({...r,i})).filter(r=>r.a===node.id||r.b===node.id);
    return '<p class="overline">'+e(node.group)+'</p><h3>'+e(node.name)+'</h3><p class="subtitle">'+e(node.tag)+'</p><p class="body">'+e(node.description)+'</p><div class="question"><label>'+lens.number+' · '+e(lens.key)+'</label><p>'+e(node.prompts[index])+'</p></div><div class="detail-links"><p class="reading-label">Continua nel sito</p>'+links.join('')+'</div><div class="comparisons"><h4>Confronti nell’atlante</h4>'+related.map(r=>'<button type="button" class="comparison" data-route="'+r.i+'">↔ '+e(nodeMap.get(r.a===node.id?r.b:r.a).label)+' · '+e(r.title)+'</button>').join('')+'</div>';
  }
}

function createGlobe(canvas,getState,onSelect){
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas non disponibile');
  const land=topojson.merge(WORLD,WORLD.objects.features.geometries);
  const borders=topojson.mesh(WORLD,WORLD.objects.features,(a,b)=>a!==b);
  const projection=d3.geoOrthographic().precision(.4),geoPath=d3.geoPath(projection,ctx),grid=d3.geoGraticule().step([20,20])();
  const routes=DATA.routes.map((r,i)=>{const a=nodeMap.get(r.a),b=nodeMap.get(r.b),interpolate=d3.geoInterpolate(a.coords,b.coords),lift=.09+Math.min(.24,d3.geoDistance(a.coords,b.coords)*.12);return {...r,index:i,interpolate,lift,samples:Array.from({length:65},(_,k)=>({coords:interpolate(k/64),alt:1+lift*Math.sin(Math.PI*k/64)}))};});
  const abort=new AbortController(),signal=abort.signal,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let width=700,height=600,radius=220,cx=350,cy=300,lon=-12,lat=23,phase=0,last=0,raf=0,visible=true,autoRotate=true,tween=null,drag=null,hover=null;
  let rotation=d3.geoRotation([lon,-lat]),nodeHits=[],routeHits=[];
  const stars=Array.from({length:90},(_,i)=>({x:((i*71.703)%997)/997,y:((i*133.913)%997)/997,r:i%9===0?1:.5,a:.1+(i%5)*.035}));
  const position=(coords,alt=1)=>{const p=rotation(coords),a=p[0]*Math.PI/180,b=p[1]*Math.PI/180,x=Math.cos(b)*Math.sin(a)*alt,y=Math.sin(b)*alt,z=Math.cos(b)*Math.cos(a)*alt;return{x:cx+x*radius,y:cy-y*radius,z,visible:z>=0||x*x+y*y>1.003};};
  function resize(){width=canvas.parentElement.getBoundingClientRect().width;height=Math.max(350,Math.min(610,width*.87));const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);cx=width*.5;cy=height*.49;radius=Math.min(width*.35,height*.382);projection.translate([cx,cy]).scale(radius);draw();}
  function drawLine(points,alpha,color,lineWidth=1,glow=0){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.beginPath();let started=false;for(const p of points){if(!p.visible){started=false;continue;}if(started)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);started=true;}ctx.stroke();ctx.globalAlpha=1;ctx.shadowBlur=0;}
  function draw(){
    if(!width)return;const state=getState(),lens=lensMap.get(state.lens),accent=lens.color,route=routes[state.route];
    const active=r=>route?r.index===route.index:state.city==='all'||r.a===state.city||r.b===state.city;
    const highlighted=new Set(route?[route.a,route.b]:state.city==='all'?DATA.nodes.map(n=>n.id):routes.filter(active).flatMap(r=>[r.a,r.b]));
    projection.rotate([lon,-lat]);rotation=d3.geoRotation([lon,-lat]);ctx.clearRect(0,0,width,height);
    const background=ctx.createRadialGradient(cx,cy,radius*.3,cx,cy,radius*1.65);background.addColorStop(0,'#30271c');background.addColorStop(.8,'#1b1510');background.addColorStop(1,'#17110e');ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
    stars.forEach(s=>{ctx.globalAlpha=s.a;ctx.fillStyle='#cdbb93';ctx.beginPath();ctx.arc(s.x*width,s.y*height,s.r,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
    ctx.strokeStyle='#b1956125';ctx.lineWidth=.6;ctx.beginPath();ctx.ellipse(cx,cy,radius*1.27,radius*1.27,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<72;i++){const angle=i*Math.PI/36,outer=radius*1.27,inner=outer-(i%6===0?6:2);ctx.beginPath();ctx.moveTo(cx+Math.cos(angle)*inner,cy+Math.sin(angle)*inner);ctx.lineTo(cx+Math.cos(angle)*outer,cy+Math.sin(angle)*outer);ctx.stroke();}
    const halo=ctx.createRadialGradient(cx,cy,radius*.95,cx,cy,radius*1.14);halo.addColorStop(0,accent+'00');halo.addColorStop(.25,accent+'1c');halo.addColorStop(1,accent+'00');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,radius*1.14,0,Math.PI*2);ctx.fill();
    const ocean=ctx.createRadialGradient(cx-radius*.4,cy-radius*.45,0,cx,cy,radius*1.1);ocean.addColorStop(0,'#2c2b23');ocean.addColorStop(.65,'#191d1b');ocean.addColorStop(1,'#0b1111');ctx.beginPath();geoPath({type:'Sphere'});ctx.fillStyle=ocean;ctx.fill();
    ctx.beginPath();geoPath(grid);ctx.strokeStyle='#a69a7132';ctx.lineWidth=.5;ctx.stroke();
    const continents=ctx.createLinearGradient(cx-radius,cy-radius,cx+radius,cy+radius);continents.addColorStop(0,'#72674c');continents.addColorStop(.45,'#4d4a37');continents.addColorStop(1,'#242d27');ctx.beginPath();geoPath(land);ctx.fillStyle=continents;ctx.fill();ctx.strokeStyle='#b8ab7e72';ctx.lineWidth=.65;ctx.stroke();
    ctx.beginPath();geoPath(borders);ctx.strokeStyle='#b7ac7f35';ctx.lineWidth=.5;ctx.stroke();
    const shade=ctx.createRadialGradient(cx-radius*.4,cy-radius*.3,radius*.2,cx+radius*.2,cy+radius*.2,radius*1.2);shade.addColorStop(0,'#050a0700');shade.addColorStop(.6,'#050a0718');shade.addColorStop(1,'#050a07c9');ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fillStyle=shade;ctx.fill();ctx.strokeStyle=accent+'60';ctx.lineWidth=.8;ctx.stroke();
    routeHits=[];
    for(const r of routes){const points=r.samples.map(p=>position(p.coords,p.alt)),isActive=active(r);drawLine(points,isActive?.58:.08,accent,isActive?1.05:.6,isActive?8:0);if(isActive)routeHits.push({route:r,points});
      if(!isActive)continue;
      for(let direction=0;direction<2;direction++){let t=(phase*.10+r.index*.137+direction*.47)%1;if(direction)t=1-t;const tail=[];for(let j=0;j<10;j++){const u=t+(direction?1:-1)*j*.0035;if(u<0||u>1)continue;tail.push(position(r.interpolate(u),1+r.lift*Math.sin(Math.PI*u)));}drawLine(tail,.9,accent,1.6,7);const p=position(r.interpolate(t),1+r.lift*Math.sin(Math.PI*t));if(p.visible){ctx.fillStyle='#fff4db';ctx.shadowColor=accent;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(p.x,p.y,1.65,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}}
    }
    nodeHits=[];const boxes=[];ctx.font='400 12px Inter, system-ui, sans-serif';
    const positions=DATA.nodes.map(n=>({n,p:position(n.coords)})).filter(o=>o.p.z>.015).sort((a,b)=>{const rank=o=>o.n.id===state.city?100:o.n.id===hover?90:highlighted.has(o.n.id)?20+o.p.z:o.p.z;return rank(b)-rank(a);});
    for(const {n,p}of positions){const lit=highlighted.has(n.id),chosen=n.id===state.city||n.id===hover;ctx.globalAlpha=lit?1:.3;ctx.shadowColor=accent;ctx.shadowBlur=chosen?16:9;ctx.fillStyle=lit?'#f9e5b9':'#afac94';ctx.beginPath();ctx.arc(p.x,p.y,chosen?3.7:2.6,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;if(chosen){ctx.strokeStyle=accent;ctx.lineWidth=.9;ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.stroke();}nodeHits.push({node:n,x:p.x,y:p.y});
      const tw=ctx.measureText(n.label).width,offsets=[[12,-13],[-tw-12,-13],[12,22],[-tw-12,22],[18,-33],[-tw-18,38],[20,42],[-tw-20,-40]];let label=null;
      if(width<420&&!chosen&&!lit){ctx.globalAlpha=1;continue;}
      for(const [dx,dy]of offsets){const box={x:p.x+dx,y:p.y+dy-12,w:tw,h:16};if(box.x<12||box.x+tw>width-12||box.y<36||box.y+16>height-45)continue;if(boxes.some(b=>box.x<b.x+b.w+8&&box.x+tw+8>b.x&&box.y<b.y+b.h+5&&box.y+21>b.y))continue;label={...box,dx,dy};break;}
      if(label){boxes.push(label);ctx.strokeStyle='#e7d2a14a';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(label.dx>0?label.x-4:label.x+tw+4,p.y+label.dy-4);ctx.stroke();ctx.strokeStyle='#14170ee0';ctx.lineWidth=3;ctx.strokeText(n.label,label.x,p.y+label.dy);ctx.fillStyle='#eee5d6';ctx.fillText(n.label,label.x,p.y+label.dy);nodeHits[nodeHits.length-1].box=label;}ctx.globalAlpha=1;
    }
  }
  function focus(id){
    autoRotate=id==='all';if(id==='all'){tween=null;draw();return;}
    const node=nodeMap.get(id);if(!node)return;const delta=((-node.coords[0]-lon+540)%360)-180;
    if(reduced.matches){lon+=delta;lat=node.coords[1]*.7;}else tween={start:performance.now(),fromLon:lon,toLon:lon+delta,fromLat:lat,toLat:node.coords[1]*.7};draw();
  }
  const pointer=e=>{const box=canvas.getBoundingClientRect();return{x:e.clientX-box.left,y:e.clientY-box.top};};
  function hitNode(p){let best=21,result=null;for(const hit of nodeHits){const b=hit.box;if(b&&p.x>=b.x-4&&p.x<=b.x+b.w+4&&p.y>=b.y-4&&p.y<=b.y+b.h+4)return hit.node;const distance=Math.hypot(p.x-hit.x,p.y-hit.y);if(distance<best){best=distance;result=hit.node;}}return result;}
  function hitRoute(p){let best=8,result=null;for(const hit of routeHits)for(let i=1;i<hit.points.length;i++){const a=hit.points[i-1],b=hit.points[i];if(!a.visible||!b.visible)continue;const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1))),distance=Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);if(distance<best){best=distance;result=hit.route.index;}}return result;}
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=pointer(e);drag={id:e.pointerId,x:p.x,y:p.y,lon,lat,moved:false};canvas.setPointerCapture(e.pointerId);tween=null;},{signal});
  canvas.addEventListener('pointermove',e=>{const p=pointer(e);if(drag){const dx=p.x-drag.x,dy=p.y-drag.y;if(Math.hypot(dx,dy)>4){drag.moved=true;autoRotate=false;canvas.classList.add('dragging');}if(drag.moved){lon=drag.lon+dx*.29;lat=Math.max(-65,Math.min(65,drag.lat+dy*.25));draw();}}else{const next=hitNode(p)?.id||null;if(next!==hover){hover=next;draw();}}},{signal});
  function release(e){if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;drag=null;canvas.classList.remove('dragging');if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(e.type==='pointerup'&&!moved){const p=pointer(e),node=hitNode(p);if(node)onSelect({city:node.id,route:null});else{const route=hitRoute(p);if(route!==null){autoRotate=false;onSelect({route});}}}draw();}
  canvas.addEventListener('pointerup',release,{signal});canvas.addEventListener('pointercancel',release,{signal});canvas.addEventListener('pointerleave',()=>{hover=null;if(!drag)draw();},{signal});
  reduced.addEventListener('change',e=>{if(e.matches){getState().running=false;tween=null;onSelect({});draw();}},{signal});
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas.parentElement);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=performance.now();});intersection.observe(canvas);
  function animate(time){raf=requestAnimationFrame(animate);if(!visible||document.hidden||time-last<32)return;const dt=Math.min((time-last)/1000,.1);last=time;let changed=false;if(getState().running&&!drag){phase+=dt;if(autoRotate)lon=(lon+dt*2.3)%360;changed=true;}if(tween){const t=Math.min(1,(time-tween.start)/900),k=1-Math.pow(1-t,3);lon=tween.fromLon+(tween.toLon-tween.fromLon)*k;lat=tween.fromLat+(tween.toLat-tween.fromLat)*k;changed=true;if(t===1)tween=null;}if(changed)draw();}
  resize();raf=requestAnimationFrame(animate);
  return {draw,focus,setMotion(value){autoRotate=value;tween=null;draw();},destroy(){cancelAnimationFrame(raf);resizeObserver.disconnect();intersection.disconnect();abort.abort();}};
}
if(!customElements.get('metahistoria-globe'))customElements.define('metahistoria-globe',MetaHistoriaGlobe);
