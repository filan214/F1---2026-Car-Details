import * as THREE from 'three';

export const COMPONENTS = [
  {id:'front-wing',name:'Front wing',category:'Aerodynamics',material:'Carbon-fibre composite',description:'The first point of contact with the air. Sculpted elements generate front-end downforce and shape the airflow around the wheels.',offset:[-1.55,.28,0],anchor:[-2.35,.22,0],icon:'wing'},
  {id:'chassis',name:'Chassis & nose',category:'Structure',material:'Carbon-fibre monocoque',description:'The structural heart of the car. A rigid survival cell surrounds the driver and connects the front suspension, nose and power unit.',offset:[-.3,.38,0],anchor:[-.9,.6,0],icon:'chassis'},
  {id:'wheels',name:'Wheels & tyres',category:'Mechanical',material:'Rubber / magnesium alloy',description:'Four small contact patches put every input onto the track. The tyres provide grip while lightweight wheels support braking and cornering loads.',offset:[0,.12,0],anchor:[-1.65,.47,.97],icon:'wheel'},
  {id:'suspension',name:'Suspension',category:'Mechanical',material:'Carbon fibre / metal joints',description:'Wishbones locate the wheels precisely. Pushrods transfer movement into the spring and damper system, helping control ride height and tyre contact.',offset:[-.05,.75,0],anchor:[-1.4,.4,.7],icon:'suspension'},
  {id:'sidepods',name:'Sidepods',category:'Cooling & airflow',material:'Carbon-fibre composite',description:'Sculpted bodywork guides air into the cooling system, then narrows toward the rear to keep airflow moving cleanly around the car.',offset:[0,.35,0],anchor:[.35,.5,.65],icon:'sidepod'},
  {id:'power-unit',name:'Power unit',category:'Powertrain',material:'Mixed alloys / composite housings',description:'A turbocharged engine works with electrical energy recovery and deployment systems. Together they turn fuel and recovered energy into acceleration.',offset:[.5,1.8,0],anchor:[.8,.55,0],icon:'engine'},
  {id:'floor',name:'Floor & diffuser',category:'Aerodynamics',material:'Carbon-fibre composite',description:'Shaped tunnels accelerate air beneath the chassis. The rising diffuser helps manage its exit, making the floor a key source of downforce.',offset:[0,-.3,0],anchor:[.65,.08,.65],icon:'floor'},
  {id:'rear-wing',name:'Rear wing',category:'Aerodynamics',material:'Carbon-fibre composite',description:'An elevated aerofoil creates rear downforce, pressing the tyres toward the track. Its shape balances cornering grip against aerodynamic drag.',offset:[1.35,1.15,0],anchor:[2.13,1.18,0],icon:'wing'},
  {id:'halo',name:'Halo & cockpit',category:'Driver protection',material:'Titanium / composite fairing',description:'A strong protective hoop surrounds the cockpit opening. The central front support and rear mountings transfer impact loads into the survival cell.',offset:[-.4,1.75,0],anchor:[-.45,1.02,0],icon:'halo'},
  {id:'engine-cover',name:'Engine cover',category:'Bodywork',material:'Carbon-fibre composite',description:'A lightweight outer skin encloses the power unit. The tapered profile and spine help organise airflow on its way toward the rear of the car.',offset:[1.25,2.65,0],anchor:[.85,.9,0],icon:'cover'},
];

const redColor = 0xe72f23;

export function createCar() {
  const root = new THREE.Group();
  root.name = 'APX-01';
  const assemblies = new Map();
  const red = new THREE.MeshPhysicalMaterial({color:redColor,metalness:.4,roughness:.29,clearcoat:1,clearcoatRoughness:.18});
  const dark = new THREE.MeshStandardMaterial({color:0x202124,metalness:.45,roughness:.48});
  const carbon = new THREE.MeshStandardMaterial({color:0x111214,metalness:.35,roughness:.44});
  const rubber = new THREE.MeshStandardMaterial({color:0x171719,roughness:.94,metalness:0});
  const silver = new THREE.MeshStandardMaterial({color:0x999ba1,metalness:.85,roughness:.28});
  const gold = new THREE.MeshStandardMaterial({color:0xae924e,metalness:.75,roughness:.32});
  const white = new THREE.MeshStandardMaterial({color:0xf2ece4,metalness:.1,roughness:.5});
  const tyreLine = new THREE.MeshStandardMaterial({color:0xddb42d,roughness:.75});
  const matClones = new Map();

  function add(group, geometry, material, pos=[0,0,0], rotation=[0,0,0]) {
    // Each assembly owns its materials so selecting it cannot tint other parts.
    const key = group.userData.assembly + material.uuid;
    if (!matClones.has(key)) matClones.set(key, material.clone());
    const mesh = new THREE.Mesh(geometry,matClones.get(key));
    mesh.position.set(...pos);mesh.rotation.set(...rotation);mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.userData.assembly=group.userData.assembly;group.add(mesh);return mesh;
  }
  const box = (g,s,m,p,r) => add(g,new THREE.BoxGeometry(...s),m,p,r);
  const rod = (g,a,b,r,m) => {
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const mesh=add(g,new THREE.CylinderGeometry(r,r,delta.length(),10),m,start.clone().add(end).multiplyScalar(.5).toArray());
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
  };
  function tube(g,points,r,m) {
    return add(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),48,r,10,false),m);
  }
  function loft(g,sections,m,centerZ=0) {
    // Ring-based continuous body surface: x, centre-height, half-width, half-height.
    const positions=[],indices=[],n=24;
    sections.forEach(([x,y,w,h])=>{
      for(let j=0;j<n;j++){
        const a=j/n*Math.PI*2;
        positions.push(x,y+Math.sin(a)*h,centerZ+Math.cos(a)*w);
      }
    });
    for(let i=0;i<sections.length-1;i++)for(let j=0;j<n;j++){
      const a=i*n+j,b=i*n+(j+1)%n,c=(i+1)*n+j,d=(i+1)*n+(j+1)%n;
      indices.push(a,c,b,b,c,d);
    }
    for(let j=1;j<n-1;j++)indices.push(0,j,j+1);
    const last=(sections.length-1)*n;
    for(let j=1;j<n-1;j++)indices.push(last,last+j+1,last+j);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
    return add(g,geo,m);
  }
  function plate(g,points,thickness,m,y) {
    const shape=new THREE.Shape();shape.moveTo(points[0][0],points[0][1]);points.slice(1).forEach(p=>shape.lineTo(...p));shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,steps:1});
    return add(g,geo,m,[0,y,0],[Math.PI/2,0,0]);
  }
  function group(id) {
    const g=new THREE.Group();g.name=id;g.userData.assembly=id;g.userData.home=new THREE.Vector3();
    const data=COMPONENTS.find(c=>c.id===id);g.userData.offset=new THREE.Vector3(...data.offset);
    root.add(g);assemblies.set(id,g);return g;
  }

  const front=group('front-wing');
  for(let i=0;i<4;i++) {
    const x=-2.67+i*.12;
    plate(front,[[x-.07,-1.08],[x+.12,-1.07],[x+.2,-.73],[x+.24,-.31],[x+.22,0],[x+.24,.31],[x+.2,.73],[x+.12,1.07],[x-.07,1.08],[x-.035,.4],[x-.05,0],[x-.035,-.4]],.032,i===0?red:carbon,.15+i*.055);
  }
  for(const s of [-1,1]){
    box(front,[.63,.24,.04],red,[-2.4,.25,s*1.065],[0,0,-.08]);
    box(front,[.57,.015,.09],carbon,[-2.4,.12,s*1.035]);
    rod(front,[-2.22,.21,s*.17],[-2.12,.48,s*.17],.018,dark);
    box(front,[.36,.014,.19],red,[-2.31,.295,s*.72],[0,0,-.2]);
    box(front,[.24,.014,.023],white,[-2.34,.313,s*.76],[0,0,-.2]);
  }

  const chassis=group('chassis');
  loft(chassis,[[-2.42,.35,.075,.07],[-2.25,.39,.095,.095],[-1.92,.47,.15,.13],[-1.5,.56,.2,.19],[-1.02,.57,.3,.24],[-.67,.52,.34,.26]],red);
  loft(chassis,[[-.9,.3,.29,.12],[-.4,.3,.36,.14],[.15,.3,.32,.13],[.62,.28,.3,.1]],carbon);
  for(const s of [-1,1])loft(chassis,[[-.92,.61,.085,.12],[-.6,.59,.095,.15],[-.1,.59,.095,.16],[.28,.61,.105,.17]],red,s*.29);
  loft(chassis,[[.05,.6,.25,.23],[.35,.59,.3,.27],[.6,.48,.27,.17]],red);
  box(chassis,[.35,.04,.013],white,[-1.59,.713,0],[0,0,-.17]);
  // Nose stripe, mirrors and their fine mounting arms.
  box(chassis,[.81,.009,.035],white,[-1.86,.604,0],[0,0,-.2]);
  for(const s of [-1,1]){
    rod(chassis,[-.65,.67,s*.32],[-.57,.78,s*.51],.013,carbon);
    const mirror=add(chassis,new THREE.SphereGeometry(.085,16,10),red,[-.56,.8,s*.54]);mirror.scale.set(1,.48,.58);
    box(chassis,[.008,.045,.07],silver,[-.485,.797,s*.54]);
  }

  const wheels=group('wheels');
  wheels.userData.subassemblies=[];
  for(const x of [-1.63,1.63])for(const s of [-1,1]){
    const wheel=new THREE.Group();wheel.userData.assembly='wheels';wheel.position.set(x,.475,s*.985);wheel.userData.home=wheel.position.clone();wheel.userData.offset=new THREE.Vector3(x<0?-.45:.45,.1,s*1.13);wheels.add(wheel);wheels.userData.subassemblies.push(wheel);
    const rear=x>0,width=rear?.42:.35;
    add(wheel,new THREE.CylinderGeometry(.445,.445,width,64,1,false),rubber,[0,0,0],[Math.PI/2,0,0]);
    for(const face of [-1,1]){
      add(wheel,new THREE.TorusGeometry(.367,.078,12,64),rubber,[0,0,face*width*.43]);
      add(wheel,new THREE.CylinderGeometry(.263,.263,.026,48),dark,[0,0,face*(width*.5+.006)],[Math.PI/2,0,0]);
      add(wheel,new THREE.TorusGeometry(.254,.013,8,48),silver,[0,0,face*(width*.5+.021)]);
      add(wheel,new THREE.TorusGeometry(.357,.007,6,72),tyreLine,[0,0,face*(width*.5+.02)]);
      add(wheel,new THREE.CylinderGeometry(.073,.073,.035,12),gold,[0,0,face*(width*.5+.027)],[Math.PI/2,0,0]);
      for(let j=0;j<10;j++){
        const a=j*Math.PI/5;
        rod(wheel,[Math.cos(a)*.08,Math.sin(a)*.08,face*(width*.5+.025)],[Math.cos(a+.12)*.242,Math.sin(a+.12)*.242,face*(width*.5+.018)],.013,carbon);
      }
      // Short sidewall marks evoke a racing tyre without a licensed tyre logo.
      for(let j=0;j<7;j++){
        const a=j*.056+1.35;
        box(wheel,[.013,.032,.004],tyreLine,[Math.cos(a)*.395,Math.sin(a)*.395,face*(width*.5+.007)],[0,0,a-Math.PI/2]);
      }
    }
    for(const dz of [-.09,0,.09])add(wheel,new THREE.TorusGeometry(.446,.0018,4,64),dark,[0,0,dz]);
  }

  const suspension=group('suspension');
  for(const x of [-1.63,1.63])for(const s of [-1,1]){
    for(const y of [.28,.54]){
      rod(suspension,[x-.32,y,s*.22],[x,y-.045,s*.95],.017,carbon);
      rod(suspension,[x+.36,y,s*.24],[x,y-.045,s*.95],.017,carbon);
    }
    rod(suspension,[x+.19,.68,s*.21],[x-.08,.31,s*.93],.019,carbon);
    rod(suspension,[x-.15,.42,s*.2],[x-.13,.4,s*.96],.012,silver);
    add(suspension,new THREE.CylinderGeometry(.18,.18,.035,32),silver,[x,.475,s*.835],[Math.PI/2,0,0]);
    box(suspension,[.1,.19,.085],gold,[x+.12,.48,s*.82]);
  }

  const pods=group('sidepods');pods.userData.subassemblies=[];
  for(const s of [-1,1]){
    const pod=new THREE.Group();pod.userData.assembly='sidepods';pod.userData.home=new THREE.Vector3();pod.userData.offset=new THREE.Vector3(.25,.15,s*1.1);pods.add(pod);pods.userData.subassemblies.push(pod);
    loft(pod,[[-.44,.46,.09,.08],[-.25,.5,.23,.22],[.15,.46,.255,.225],[.64,.39,.23,.18],[1.18,.27,.1,.10],[1.54,.23,.035,.04]],red,s*.535);
    box(pod,[.03,.145,.275],carbon,[-.256,.554,s*.55],[0,0,-.12]);
    box(pod,[.065,.025,.32],red,[-.268,.641,s*.55]);
    box(pod,[.6,.009,.022],white,[.22,.667,s*.57],[0,0,-.13]);
    for(let j=0;j<5;j++)box(pod,[.019,.01,.16],carbon,[.55+j*.072,.57-j*.021,s*.51],[0,.2*s,-.25]);
    box(pod,[.38,.017,.028],white,[.26,.466,s*.777],[Math.PI/2,0,0]);
  }

  const engine=group('power-unit');
  box(engine,[.79,.24,.42],silver,[.8,.4,0]);
  for(const s of [-1,1]){
    box(engine,[.63,.21,.19],dark,[.8,.61,s*.17],[s*.46,0,0]);
    box(engine,[.59,.045,.2],silver,[.8,.716,s*.205],[s*.46,0,0]);
    for(let j=0;j<3;j++){
      box(engine,[.035,.006,.16],red,[.59+j*.17,.743,s*.2],[s*.46,0,0]);
      tube(engine,[[.54+j*.18,.49,s*.27],[.55+j*.18,.35,s*.39],[1.14,.35,s*.3],[1.23,.44,s*.14]],.018,gold);
    }
  }
  add(engine,new THREE.TorusGeometry(.125,.048,12,32),silver,[1.23,.52,0],[Math.PI/2,0,0]);
  loft(engine,[[1.17,.35,.21,.17],[1.5,.34,.15,.145],[1.85,.31,.105,.1]],dark);
  rod(engine,[1.3,.55,0],[2.08,.62,0],.038,silver);
  add(engine,new THREE.CylinderGeometry(.15,.15,.09,24),gold,[1.33,.35,.21],[Math.PI/2,0,0]);
  box(engine,[.38,.1,.29],dark,[.27,.255,0]);

  const floor=group('floor');
  plate(floor,[[-1.2,-.37],[-.65,-.74],[.35,-.84],[1.28,-.77],[2.02,-.48],[2.13,-.35],[2.13,.35],[2.02,.48],[1.28,.77],[.35,.84],[-.65,.74],[-1.2,.37]],.047,carbon,.18);
  for(const s of [-1,1]){
    for(let j=0;j<3;j++)box(floor,[1.17,.035,.019],dark,[.35,.17,s*(.65+j*.075)],[0,-s*.04,0]);
    box(floor,[.68,.025,.38],carbon,[1.8,.19,s*.2],[0,0,.19]);
    for(let j=0;j<2;j++)box(floor,[.58,.12,.022],carbon,[1.83,.16,s*(.13+j*.19)],[0,0,.16]);
  }
  box(floor,[1.8,.027,.18],gold,[.26,.109,0]);

  const rear=group('rear-wing');
  for(const s of [-1,1]){
    box(rear,[.59,.55,.034],red,[2.13,.93,s*.72],[0,0,-.1]);
    box(rear,[.44,.018,.08],carbon,[2.12,1.22,s*.71]);
    rod(rear,[1.66,.34,s*.18],[2.03,1.0,s*.18],.025,carbon);
  }
  box(rear,[.42,.044,1.44],carbon,[2.08,1.09,0],[0,0,.18]);
  box(rear,[.26,.035,1.43],red,[2.19,1.23,0],[0,0,.28]);
  box(rear,[.025,.008,1.32],white,[2.11,1.229,0]);
  box(rear,[.28,.033,.98],carbon,[2.11,.59,0],[0,0,.16]);
  box(rear,[.08,.08,.065],dark,[2.18,1.16,0]);
  box(rear,[.025,.072,.085],red,[2.29,.34,0]);

  const halo=group('halo');
  tube(halo,[[-.95,.76,0],[-.88,.99,0],[-.62,1.035,-.29],[-.18,1.035,-.3],[.02,.88,-.28]],.031,dark);
  tube(halo,[[-.88,.99,0],[-.62,1.035,.29],[-.18,1.035,.3],[.02,.88,.28]],.031,dark);
  box(halo,[.045,.21,.06],dark,[-.885,.867,0],[0,0,-.22]);
  const seat=box(halo,[.16,.34,.29],carbon,[-.03,.53,0],[0,0,-.22]);
  box(halo,[.39,.04,.26],carbon,[-.22,.38,0]);
  rod(halo,[-.74,.46,0],[-.67,.69,0],.018,silver);
  const steering=add(halo,new THREE.TorusGeometry(.104,.018,8,32),carbon,[-.665,.69,0],[0,Math.PI/2,0]);steering.scale.set(1,.65,1);
  box(halo,[.027,.07,.13],dark,[-.667,.69,0]);

  const cover=group('engine-cover');
  loft(cover,[[.1,.74,.135,.24],[.34,.75,.2,.3],[.68,.68,.19,.3],[1.05,.54,.145,.26],[1.43,.41,.09,.16],[1.83,.32,.045,.07]],red);
  // Top airbox intake and spine.
  loft(cover,[[.1,1.015,.11,.115],[.24,1.045,.12,.11],[.58,.94,.105,.115]],red);
  add(cover,new THREE.CircleGeometry(.082,24),carbon,[.091,1.035,0],[0,-Math.PI/2,0]);
  const finShape=new THREE.Shape();finShape.moveTo(.49,.96);finShape.lineTo(1.55,.59);finShape.lineTo(1.78,.34);finShape.lineTo(.64,.56);finShape.closePath();
  add(cover,new THREE.ExtrudeGeometry(finShape,{depth:.018,bevelEnabled:false}),red,[0,0,-.009]);
  box(cover,[.15,.007,.06],white,[.38,1.034,0],[0,0,-.27]);

  return {root,assemblies};
}

export function setExplosion(assemblies, amount) {
  const t=THREE.MathUtils.clamp(Number.isFinite(amount)?amount:0,0,1);
  for(const group of assemblies.values()){
    group.position.copy(group.userData.home).addScaledVector(group.userData.offset,t);
    for(const child of group.userData.subassemblies??[])child.position.copy(child.userData.home).addScaledVector(child.userData.offset,t);
  }
}
