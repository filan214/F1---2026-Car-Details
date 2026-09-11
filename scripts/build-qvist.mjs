// Preserve the source surface; add clean display seams to the fused concept mesh.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
fs.mkdirSync(path.join(root,'artifacts/qvist'),{recursive:true});
const source=fs.readFileSync(path.join(root,'dist/models/f1_2026_concept_polygon_model.glb'));
if(source.readUInt32LE(8)!==source.length)throw new Error('Incomplete source GLB');
const jsonLength=source.readUInt32LE(12),input=JSON.parse(source.subarray(20,20+jsonLength));
const binary=source.subarray(28+jsonLength);
function readAccessor(id){
  const a=input.accessors[id],v=input.bufferViews[a.bufferView];
  const sizes={SCALAR:1,VEC3:3,VEC4:4},width=sizes[a.type],bytes={5123:2,5125:4,5126:4}[a.componentType];
  const values=new Float64Array(a.count*width);
  for(let i=0;i<a.count;i++)for(let c=0;c<width;c++){
    const offset=(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||width*bytes)+c*bytes;
    values[i*width+c]=a.componentType===5126?binary.readFloatLE(offset):a.componentType===5123?binary.readUInt16LE(offset):binary.readUInt32LE(offset);
  }
  return values;
}

const vertices=[],triangles=[],canonical=new Map(),parents=[];
const find=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;};
const union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parents[b]=a;};
for(const mesh of input.meshes)for(const primitive of mesh.primitives){
  const positions=readAccessor(primitive.attributes.POSITION),normals=readAccessor(primitive.attributes.NORMAL),indices=readAccessor(primitive.indices);
  const base=vertices.length;
  for(let i=0;i<positions.length;i+=3){
    const p=Array.from(positions.subarray(i,i+3)),n=Array.from(normals.subarray(i,i+3));
    const key=p.map(v=>Math.round(v*1000)).join(',');
    if(!canonical.has(key)){canonical.set(key,parents.length);parents.push(parents.length);}
    vertices.push({p,n,c:canonical.get(key)});
  }
  for(let i=0;i<indices.length;i+=3){
    const ids=[base+indices[i],base+indices[i+1],base+indices[i+2]];
    union(vertices[ids[0]].c,vertices[ids[1]].c);union(vertices[ids[0]].c,vertices[ids[2]].c);
    triangles.push(ids);
  }
}
const shells=new Map();
for(const triangle of triangles){
  const id=find(vertices[triangle[0]].c);
  if(!shells.has(id))shells.set(id,{id,count:0,min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});
  const shell=shells.get(id);shell.count++;
  for(const index of triangle)for(let a=0;a<3;a++){
    shell.min[a]=Math.min(shell.min[a],vertices[index].p[a]);shell.max[a]=Math.max(shell.max[a],vertices[index].p[a]);
  }
}
const sorted=[...shells.values()].sort((a,b)=>b.count-a.count),main=sorted[0].id;
const definitions=[
  ['front-wing','Front wing','Aerodynamics','wing',[-1.05,.12,0]],
  ['chassis','Nose & chassis','Structure','chassis',[0,.28,0]],
  ['front-left-wheel','Front left wheel','Wheels','wheel',[-.1,.05,1.12]],
  ['front-right-wheel','Front right wheel','Wheels','wheel',[-.1,.05,-1.12]],
  ['front-suspension','Front suspension','Running gear','suspension',[-.15,.62,0]],
  ['left-sidepod','Left sidepod','Bodywork','sidepod',[0,.42,.88]],
  ['right-sidepod','Right sidepod','Bodywork','sidepod',[0,.42,-.88]],
  ['floor','Floor & diffuser','Aerodynamics','floor',[0,0,0]],
  ['halo','Halo','Cockpit','halo',[-.12,1.55,0]],
  ['engine-cover','Airbox & engine cover','Bodywork','cover',[.3,1.3,0]],
  ['rear-suspension','Rear suspension','Running gear','suspension',[.28,.62,0]],
  ['rear-left-wheel','Rear left wheel','Wheels','wheel',[.2,.05,1.12]],
  ['rear-right-wheel','Rear right wheel','Wheels','wheel',[.2,.05,-1.12]],
  ['rear-wing','Rear wing','Aerodynamics','wing',[.95,.8,0]],
  ['mirrors','Mirrors','Cockpit','sidepod',[-.4,1.08,0]],
  ['exhaust','Exhaust outlet','Powertrain exterior','engine',[1.15,.15,0]],
];

function classifyShell(triangle){
  const p=[0,0,0];for(const i of triangle)for(let a=0;a<3;a++)p[a]+=vertices[i].p[a]/3;
  const [x,y,z]=p,side=Math.abs(y),shell=shells.get(find(vertices[triangle[0]].c));
  if(shell.id!==main){
    if(shell.count>50000 && shell.max[2]<710)return `${x>2000?'rear':'front'}-${y<0?'left':'right'}-wheel`;
    if(shell.min[0]>3100&&shell.max[1]<100&&shell.min[1]>-100)return 'exhaust';
    if(shell.min[0]>900&&shell.max[0]<1150&&side>400)return 'mirrors';
    return null;
  }
  return null;
}

const groups=new Map(definitions.map(([id])=>[id,[]]));
// Each region is an intersection of half-spaces a*x+b*y+c*z+d >= 0.
// Clip intersecting triangles at the seam instead of assigning whole crossing
// triangles by centroid, which would leave jagged edges and loose fragments.
const gt=(axis,value)=>[...Array.from({length:3},(_,i)=>i===axis?1:0),-value];
const lt=(axis,value)=>[...Array.from({length:3},(_,i)=>i===axis?-1:0),value];
const regions=[];
for(const sign of [-1,1])regions.push(['front-wing',[lt(0,-380),[0,sign,0,-180]]]);
regions.push(['front-wing',[lt(0,-380),[.19,0,-1,417]]]);
regions.push(['rear-wing',[gt(0,3480),gt(2,710)]]);
regions.push(['rear-wing',[gt(0,3705),gt(2,180)]]);
regions.push(['rear-wing',[gt(0,3480),gt(1,-120),lt(1,120),gt(2,400)]]);
for(const sign of [-1,1])regions.push(['mirrors',[gt(0,900),lt(0,1120),[0,sign,0,-440],gt(2,600)]]);
regions.push(['floor',[gt(0,390),lt(2,70)]]);
for(const sign of [-1,1])regions.push(['floor',[gt(0,600),lt(0,990),[0,sign,0,-510],lt(2,600)]]);
regions.push(['floor',[gt(0,2900),lt(2,150)]]);
regions.push(['engine-cover',[gt(0,1750),gt(2,650)]]);
regions.push(['halo',[gt(0,660),lt(0,1750),gt(1,-410),lt(1,410),gt(2,665)]]);
for(const sign of [-1,1])regions.push(['front-suspension',[gt(0,-380),lt(0,620),[0,sign,0,-220]]]);
for(const sign of [-1,1])regions.push(['rear-suspension',[gt(0,2970),lt(0,3705),[0,sign,0,-160]]]);
for(const sign of [-1,1])regions.push([sign<0?'left-sidepod':'right-sidepod',[gt(0,920),lt(0,3050),[0,sign,0,-245]]]);
function split(polygon,plane){
  const distance=v=>plane[0]*v.p[0]+plane[1]*v.p[1]+plane[2]*v.p[2]+plane[3];
  const distances=polygon.map(distance);
  if(distances.every(d=>d>=-1e-8))return [polygon,[]];
  if(distances.every(d=>d<=1e-8))return [[],polygon];
  const inside=[],outside=[];
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length],da=distances[i],db=distances[(i+1)%polygon.length];
    if(da>=0)inside.push(a);
    if(da<=0)outside.push(a);
    if((da>0&&db<0)||(da<0&&db>0)){
      const t=da/(da-db),v={p:a.p.map((x,k)=>x+(b.p[k]-x)*t),n:a.n.map((x,k)=>x+(b.n[k]-x)*t)};
      inside.push(v);outside.push(v);
    }
  }
  return [inside,outside];
}
function area(tri){
  const a=tri[0].p,b=tri[1].p,c=tri[2].p,u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]);
  return Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])*.5;
}
let sourceArea=0,outputArea=0;
function emit(id,poly){for(let i=1;i<poly.length-1;i++){const tri=[poly[0],poly[i],poly[i+1]];groups.get(id).push(tri);outputArea+=area(tri);}}
for(const triangle of triangles){
  const polygon=triangle.map(i=>vertices[i]);sourceArea+=area(polygon);
  const shell=classifyShell(triangle);
  if(shell){emit(shell,polygon);continue;}
  let pending=[polygon];
  for(const [id,planes] of regions){
    const next=[];
    for(const poly of pending){
      let inside=poly;
      for(const plane of planes){
        const [yes,no]=split(inside,plane);
        if(no.length>=3)next.push(no);
        inside=yes;if(inside.length<3)break;
      }
      if(inside.length>=3)emit(id,inside);
    }
    pending=next;if(!pending.length)break;
  }
  for(const poly of pending)emit('chassis',poly);
}
if(Math.abs(sourceArea-outputArea)/sourceArea>1e-9)throw new Error(`Surface area changed during partitioning: ${sourceArea} to ${outputArea}`);

const gltf={asset:{version:'2.0',generator:'APEX component preparation',extras:{...input.asset.extras,changes:'Source surface preserved; clean display seams added to the fused mesh for illustrative disassembly; red and graphite materials assigned; uniform vertex colors removed.'}},scene:0,scenes:[{name:'Qvist 2026 concept',nodes:[]}],nodes:[],meshes:[],materials:[],accessors:[],bufferViews:[],buffers:[]};
const buffers=[];let offset=0;
function accessor(array,width,type,min,max){
  const buffer=Buffer.from(array.buffer,array.byteOffset,array.byteLength);
  const padded=Buffer.alloc(Math.ceil(buffer.length/4)*4);buffer.copy(padded);
  const view=gltf.bufferViews.length;gltf.bufferViews.push({buffer:0,byteOffset:offset,byteLength:buffer.length});buffers.push(padded);offset+=padded.length;
  const id=gltf.accessors.length;gltf.accessors.push({bufferView:view,componentType:type,count:array.length/width,type:width===1?'SCALAR':'VEC3',...(min?{min,max}:{})});return id;
}
const report=[];
for(const [id,name,category,icon,explode] of definitions){
  const tris=groups.get(id);if(!tris.length)throw new Error('Empty assembly '+id);
  const unique=new Map(),p=[],n=[],index=[];
  for(const triangle of tris)for(const v of triangle){
    const key=[...v.p,...v.n].join(',');
    if(!unique.has(key)){
      unique.set(key,p.length/3);
      // Bake Z-up to glTF Y-up without changing the source shape or normals.
      p.push(v.p[0],v.p[2],-v.p[1]);n.push(v.n[0],v.n[2],-v.n[1]);
    }
    index.push(unique.get(key));
  }
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<p.length;i++) {min[i%3]=Math.min(min[i%3],p[i]);max[i%3]=Math.max(max[i%3],p[i]);}
  const red=['chassis','left-sidepod','right-sidepod','engine-cover','mirrors','halo'].includes(id);
  const tire=id.includes('wheel'),metal=id.includes('suspension')||id==='exhaust';
  const color=red?[.56,.012,.019,1]:tire?[.018,.021,.025,1]:metal?[.12,.14,.16,1]:[.028,.035,.043,1];
  const material=gltf.materials.length;
  gltf.materials.push({name:name+' finish',doubleSided:true,pbrMetallicRoughness:{baseColorFactor:color,metallicFactor:red?.28:metal?.65:.05,roughnessFactor:tire?.7:red?.3:.43}});
  const mesh=gltf.meshes.length;
  gltf.meshes.push({name:id,primitives:[{attributes:{POSITION:accessor(new Float32Array(p),3,5126,min,max),NORMAL:accessor(new Float32Array(n),3,5126)},indices:accessor(unique.size<=65535?new Uint16Array(index):new Uint32Array(index),1,unique.size<=65535?5123:5125),material}]});
  gltf.scenes[0].nodes.push(gltf.nodes.length);gltf.nodes.push({name:id,mesh});
  report.push({id,name,category,icon,offset:explode,triangles:tris.length,vertices:unique.size,min,max});
}
gltf.buffers.push({byteLength:offset});
const bin=Buffer.concat(buffers),json=Buffer.from(JSON.stringify(gltf)),paddedJson=Buffer.alloc(Math.ceil(json.length/4)*4,32);json.copy(paddedJson);
const header=Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+paddedJson.length+bin.length,8);header.writeUInt32LE(paddedJson.length,12);header.write('JSON',16);
const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(bin.length);binHeader.write('BIN\0',4);
const result=Buffer.concat([header,paddedJson,binHeader,bin]);
fs.writeFileSync(path.join(root,'dist/models/qvist-2026-assemblies.glb'),result);
fs.writeFileSync(path.join(root,'artifacts/qvist/assembly-report.json'),JSON.stringify({sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),sourceTriangles:triangles.length,outputTriangles:report.reduce((sum,p)=>sum+p.triangles,0),sourceArea,outputArea,sourceBytes:source.length,outputBytes:result.length,shells:sorted,assemblies:report},null,2));
console.log(JSON.stringify({sourceTriangles:triangles.length,bytes:result.length,assemblies:report.map(p=>({id:p.id,triangles:p.triangles,min:p.min.map(Math.round),max:p.max.map(Math.round)}))},null,2));
