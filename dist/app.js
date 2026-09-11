import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { COMPONENTS as CONCEPT_COMPONENTS } from './car.js';
import { loadCar } from './load-car.js';

const $ = selector => document.querySelector(selector);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const icons={
  wing:'M2 9h20v4H2zM4 6v10M20 6v10M8 9l1 4m6-4 1 4',
  chassis:'m3 10 8-3 8 2 2 4-4 3-8-1-6-3Zm8-3v8m8-6-2 7',
  wheel:'M17 5c-3-2-9-1-11 3s0 9 3 10 8-1 9-5 1-6-1-8ZM9 18c-3-3-3-10 1-13m2 3c-2 0-4 5-1 7s5-5 1-7Z',
  suspension:'m3 6 18 12M3 18 21 6M3 6v12M21 6v12M8 7l8 10m-9-4 3-4m0 7 4-5',
  sidepod:'m3 9 5-3 9 1 4 8-4 2-11-2-3-6Zm0 0 12 2 6 4M15 11l2 6',
  engine:'M5 8h12v11H5zM8 8V5h6v3M17 11h4v5h-4M2 10v7m0-3h3M8 11v5m3-5v5m3-5v5',
  floor:'m2 12 8-6 12 5-8 7L2 12Zm0 3 12 6 8-7M8 9l12 5M5 11l12 5',
  halo:'M4 17V9c0-7 16-7 16 0v8M4 17l8-6 8 6M12 11V7',
  cover:'M3 17h18L16 7l-5-2-4 6-4 6Zm8-12v12m-4-6 14 6'
};
const list=$('#component-list');
let components=CONCEPT_COMPONENTS;
function renderComponentList(){
list.replaceChildren();
for(const [index,component] of components.entries()) {
  const button=document.createElement('button');
  button.className='component-button'+(index===0?' selected':'');
  button.dataset.component=component.id;
  button.setAttribute('aria-pressed',String(index===0));
  button.innerHTML=`<span class="component-index">${String(index+1).padStart(2,'0')}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[component.icon]||icons.chassis}"/></svg><span class="component-name"></span><span class="component-chevron" aria-hidden="true">›</span>`;
  button.querySelector('.component-name').textContent=component.name;
  button.addEventListener('click',()=>selectComponent(component.id));
  list.append(button);
}
}

let selected='front-wing',targetExplosion=0,currentExplosion=0,renderState=null;
function selectComponent(id) {
  const index=components.findIndex(item=>item.id===id);
  if(index===-1)return;
  const item=components[index];selected=id;
  for(const button of list.children){const active=button.dataset.component===id;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));}
  $('#detail-category').textContent=item.category.toUpperCase();
  $('#detail-number').textContent=`${String(index+1).padStart(2,'0')} / ${components.length}`;
  $('#detail-title').textContent=item.name;
  $('#detail-description').textContent=item.description;
  $('#detail-material').textContent=item.material;
  // Internal systems become accessible when selected without hiding the rest of the car.
  if((item.revealOnSelect||['power-unit','floor'].includes(id))&&targetExplosion<.65)updateExplosion(.75);
  if(renderState)highlight(renderState.assemblies,id);
}
function highlight(assemblies,id) {
  if(renderState?.model.highlight){renderState.model.highlight(assemblies,id);return;}
  for(const [key,group] of assemblies){
    group.traverse(object=>{
      if(!object.isMesh)return;
      object.material.emissive.setHex(key===id?0xc72918:0x000000);
      object.material.emissiveIntensity=key===id?.12:0;
    });
  }
}
function updateExplosion(value) {
  targetExplosion=THREE.MathUtils.clamp(value,0,1);
  const percent=Math.round(targetExplosion*100);
  $('#explosion').value=percent;
  $('#explosion').style.setProperty('--amount',`${percent}%`);
  $('#explosion-value').innerHTML=`${percent}<span>%</span>`;
  $('#explode-label').textContent=targetExplosion>.5?'Assemble car':'Explode view';
  $('#explode-button').setAttribute('aria-label',targetExplosion>.5?'Assemble the car':'Explode the car into separate pieces');
}
$('#explosion').addEventListener('input',event=>updateExplosion(Number(event.target.value)/100));
$('#explode-button').addEventListener('click',()=>updateExplosion(targetExplosion>.5?0:1));
$('#retry').addEventListener('click',()=>location.reload());
const about=$('#about-dialog');
$('#about-button').addEventListener('click',()=>about.showModal());
$('#close-about').addEventListener('click',()=>about.close());
about.addEventListener('click',event=>{if(event.target===about){const box=about.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)about.close();}});

function showModelCredit(model){
  const credit=$('#model-credit');
  const license=model.license;
  credit.replaceChildren();
  function link(label,url){
    const text=document.createTextNode(label);
    try{
      const parsed=new URL(url);
      if(!['https:','http:'].includes(parsed.protocol)){credit.append(text);return;}
      const anchor=document.createElement('a');anchor.textContent=label;anchor.href=parsed.href;
      anchor.target='_blank';anchor.rel='noopener noreferrer';credit.append(anchor);
    }catch{credit.append(text);}
  }
  credit.append('Model: ');link(license.title||model.name,license.source);
  if(license.creator)credit.append(' by '+license.creator);
  if(license.label){credit.append(' · ');link(license.label,license.url);}
  if(license.changes){const changes=document.createElement('span');changes.className='credit-changes';changes.textContent=license.changes;credit.append(changes);}
  credit.hidden=false;
}

async function initScene() {
  const model=await loadCar(message=>{$('#loading').textContent=message;});
  components=model.components;renderComponentList();
  selected=components.some(item=>item.id===selected)?selected:components[0].id;
  $('.meta-line').textContent=model.name+' / '+model.subtitle;
  $('.watermark').textContent=model.name;
  $('.panel-count').textContent=components.length+' ASSEMBLIES';
  $('.footer > div > span').textContent=components.length+' assemblies';
  if(model.kind==='imported'){
    document.title='APEX — '+model.name+', Disassembled';
    $('#model-description').textContent=model.description||model.name+' is an independently created model. The explorer shows only the assemblies present in its source geometry.';
    showModelCredit(model);
  }
  selectComponent(selected);
  const container=$('#scene');
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.6;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;
  renderer.shadowMap.needsUpdate=true;
  const canvas=renderer.domElement;canvas.setAttribute('aria-label','Interactive '+model.name+'. Use the component list and view controls to explore.');canvas.setAttribute('role','img');
  container.append(canvas);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.1,100);
  const homePosition=new THREE.Vector3(-6.4,4.2,7.3);
  camera.position.copy(homePosition);
  const controls=new OrbitControls(camera,canvas);
  controls.target.set(0,.65,0);
  controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=4.5;controls.maxDistance=20;
  controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.05;
  controls.enablePan=false;controls.rotateSpeed=.7;controls.zoomSpeed=.7;controls.autoRotateSpeed=.5;
  controls.update();
  const pmrem=new THREE.PMREMGenerator(renderer);
  const room=new RoomEnvironment();
  const envTarget=pmrem.fromScene(room,.045);scene.environment=envTarget.texture;scene.environmentIntensity=.65;
  room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xd8e3ff,0x39302c,2));
  const key=new THREE.DirectionalLight(0xfff0e4,4);key.position.set(-3,7,5);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:6,bottom:-6,near:.1,far:22});key.shadow.bias=-.0008;key.shadow.normalBias=.025;key.shadow.radius=4;scene.add(key);
  const rim=new THREE.DirectionalLight(0xd5e2ff,3.2);rim.position.set(4,4,-4);scene.add(rim);
  const frontLight=new THREE.DirectionalLight(0xffb3a0,1.2);frontLight.position.set(-5,2,-1);scene.add(frontLight);
  const {root,assemblies}=model;scene.add(root);
  const shadowPlane=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.ShadowMaterial({opacity:.27}));shadowPlane.rotation.x=-Math.PI/2;shadowPlane.position.y=-.34;shadowPlane.receiveShadow=true;scene.add(shadowPlane);
  const grid=new THREE.GridHelper(18,36,0x5b5b60,0x45464c);grid.position.y=-.35;grid.material.transparent=true;grid.material.opacity=.14;grid.material.depthWrite=false;scene.add(grid);
  // A technical centreline provides scale while keeping the studio uncluttered.
  const centreline=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-7,-.345,0),new THREE.Vector3(7,-.345,0)]),new THREE.LineDashedMaterial({color:0x66666c,dashSize:.14,gapSize:.12,transparent:true,opacity:.22}));centreline.computeLineDistances();scene.add(centreline);
  renderState={assemblies,renderer,camera,scene,controls,model};
  highlight(assemblies,selected);
  let cameraTween=null,baseZoom=1.12;
  function resize(){
    const width=container.clientWidth,height=container.clientHeight;
    if(!width||!height)return;
    renderer.setSize(width,height);camera.aspect=width/height;
    baseZoom=camera.aspect<1?Math.max(.65,camera.aspect*.94):1.13;
    camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function view(name){
    const views={perspective:homePosition,side:new THREE.Vector3(0,1.05,10.6),top:new THREE.Vector3(0,11.2,.025)};
    cameraTween={from:camera.position.clone(),to:views[name].clone(),started:performance.now(),duration:reducedMotion.matches?0:800};
    for(const button of document.querySelectorAll('[data-view]')){const active=button.dataset.view===name;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
    controls.autoRotate=false;$('#auto-rotate').setAttribute('aria-pressed','false');
  }
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>view(button.dataset.view)));
  $('#reset-view').addEventListener('click',()=>view('perspective'));
  $('#auto-rotate').addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate;$('#auto-rotate').setAttribute('aria-pressed',String(controls.autoRotate));});
  $('#grid-toggle').addEventListener('click',()=>{grid.visible=!grid.visible;centreline.visible=grid.visible;$('#grid-toggle').setAttribute('aria-pressed',String(grid.visible));});
  controls.addEventListener('start',()=>{cameraTween=null;controls.autoRotate=false;$('#auto-rotate').setAttribute('aria-pressed','false');});
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  canvas.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY,time:performance.now()};});
  canvas.addEventListener('pointerup',event=>{
    if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>6||performance.now()-down.time>550){down=null;return;}
    const bounds=canvas.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
    raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(root,true)[0];if(hit)selectComponent(hit.object.userData.assembly);down=null;
  });
  canvas.addEventListener('pointercancel',()=>{down=null;});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();renderer.setAnimationLoop(null);$('#scene-error').hidden=false;});
  let lastTime=performance.now();
  renderer.setAnimationLoop(time=>{
    const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
    if(document.hidden)return;
    const difference=targetExplosion-currentExplosion;
    if(Math.abs(difference)>0.00001)renderer.shadowMap.needsUpdate=true;
    currentExplosion=reducedMotion.matches?targetExplosion:Math.abs(difference)<.0001?targetExplosion:currentExplosion+difference*(1-Math.exp(-6*dt));
    model.setExplosion(assemblies,currentExplosion);
    // Widen the camera as the model comes apart, retaining the user's orbit.
    camera.zoom=baseZoom*(1-currentExplosion*.29);camera.updateProjectionMatrix();
    controls.target.y=.65+currentExplosion*.5;
    if(cameraTween){
      const t=cameraTween.duration?Math.min(1,(time-cameraTween.started)/cameraTween.duration):1;
      const ease=t*t*(3-2*t);camera.position.lerpVectors(cameraTween.from,cameraTween.to,ease);
      if(t===1)cameraTween=null;
    }
    controls.update(dt);renderer.render(scene,camera);
  });
  $('#loading').remove();
  addEventListener('pagehide',()=>{renderer.setAnimationLoop(null);controls.dispose();observer.disconnect();envTarget.dispose();renderer.dispose();},{once:true});
}

initScene().catch(error=>{
  console.error('Unable to initialise the 3D explorer:',error);$('#loading')?.remove();$('#scene-error').hidden=false;
  $('#scene-error h2').textContent='The model could not be loaded.';
  $('#scene-error p').textContent='The 3D model or one of its required resources could not be opened. Reload to retry. If this continues, check the configured asset and its component map, or enable browser hardware acceleration.';
});
