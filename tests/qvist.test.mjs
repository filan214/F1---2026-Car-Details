import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { prepareImportedCar, setImportedExplosion, validateAssetConfig } from '../dist/imported-car.js';

const config=JSON.parse(await fs.readFile(new URL('../dist/models/asset.json',import.meta.url)));
async function load(relative){
  const bytes=await fs.readFile(new URL('../dist/'+relative.replace('./',''),import.meta.url));
  return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
}
function metrics(root){
  root.updateMatrixWorld(true);
  let area=0,triangles=0;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),cross=new THREE.Vector3();
  root.traverse(node=>{
    if(!node.isMesh)return;
    const g=node.geometry,p=g.attributes.position,index=g.index;
    const count=index?index.count:p.count;
    triangles+=count/3;
    for(let i=0;i<count;i+=3){
      a.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(node.matrixWorld);
      b.fromBufferAttribute(p,index?index.getX(i+1):i+1).applyMatrix4(node.matrixWorld);
      c.fromBufferAttribute(p,index?index.getX(i+2):i+2).applyMatrix4(node.matrixWorld);
      area+=cross.crossVectors(b.sub(a),c.sub(a)).length()*.5;
    }
  });
  return {area,triangles,bounds:new THREE.Box3().setFromObject(root)};
}

test('Qvist is the active attributed asset, with real component coverage',async()=>{
  assert.ok(validateAssetConfig(config),'The approved model must be active');
  assert.equal(config.license.creator,'Qvist_designs');
  assert.equal(config.license.label,'CC BY 4.0');
  assert.equal(config.components.length,16);
  const model=prepareImportedCar(await load(config.asset),config);
  assert.equal(model.assemblies.size,16);
  let meshes=0;
  model.root.traverse(o=>{if(o.isMesh){meshes++;assert.ok(model.assemblies.has(o.userData.assembly));}});
  assert.equal(meshes,16);
  assert.ok(Math.abs(new THREE.Box3().setFromObject(model.root).getSize(new THREE.Vector3()).x-5.2)<1e-5);
});

test('Prepared model preserves the downloaded surface and full silhouette',async()=>{
  const original=metrics(await load('./models/f1_2026_concept_polygon_model.glb'));
  const prepared=metrics(await load('./models/qvist-2026-assemblies.glb'));
  assert.equal(original.triangles,1164142);
  assert.ok(prepared.triangles>=original.triangles,'Clean cuts may subdivide triangles');
  assert.ok(Math.abs(prepared.area-original.area)/original.area<1e-6,'No lost or duplicated surface');
  assert.ok(prepared.bounds.min.distanceTo(original.bounds.min)<.001);
  assert.ok(prepared.bounds.max.distanceTo(original.bounds.max)<.001);
});

test('Every Qvist assembly is raycast-selectable and reassembles without drift',async()=>{
  assert.ok(config.asset,'The approved model must be active');
  const model=prepareImportedCar(await load(config.asset),config);
  model.root.updateMatrixWorld(true);
  const original=new Map();
  model.root.traverse(o=>{if(o.isMesh)original.set(o,o.matrixWorld.clone());});
  setImportedExplosion(model.assemblies,1);model.root.updateMatrixWorld(true);
  for(const [id,group] of model.assemblies){
    const mesh=group.children[0],p=mesh.geometry.attributes.position,indices=mesh.geometry.index;
    const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
    let hit=false;
    for(let i=0;i<Math.min(indices.count,300)&&!hit;i+=3){
      a.fromBufferAttribute(p,indices.getX(i)).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(p,indices.getX(i+1)).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(p,indices.getX(i+2)).applyMatrix4(mesh.matrixWorld);
      const normal=new THREE.Vector3().crossVectors(b.clone().sub(a),c.clone().sub(a));
      if(normal.lengthSq()<1e-15)continue;
      normal.normalize();
      const center=a.add(b).add(c).multiplyScalar(1/3);
      const ray=new THREE.Raycaster(center.clone().addScaledVector(normal,.01),normal.negate(),0,.03);
      hit=ray.intersectObject(group,true).some(result=>result.object.userData.assembly===id);
    }
    assert.ok(hit,'Raycast selects '+id);
  }
  for(let i=0;i<30;i++){setImportedExplosion(model.assemblies,.73);setImportedExplosion(model.assemblies,0);}
  model.root.updateMatrixWorld(true);
  for(const [mesh,matrix] of original)assert.ok(mesh.matrixWorld.equals(matrix),'Exact reassembly: '+mesh.name);
});
