import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { prepareImportedCar, setImportedExplosion, highlightImportedPart, validateAssetConfig } from '../dist/imported-car.js';

function sourceFixture() {
  const source=new THREE.Group();source.name='SF26';
  const sharedMaterial=new THREE.MeshStandardMaterial({color:0xc51f23});
  const body=new THREE.Mesh(new THREE.BoxGeometry(4,.7,1),sharedMaterial);body.name='Body';body.position.set(0,.7,0);source.add(body);
  const wing=new THREE.Group();wing.name='FrontWing';wing.position.set(-2,.2,0);wing.rotation.y=.13;source.add(wing);
  for(const [index,z] of [-.5,.5].entries()){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(.5,.05,.8),sharedMaterial);mesh.name=`Flap${index}`;mesh.position.z=z;wing.add(mesh);
  }
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.32,16),sharedMaterial);wheel.name='FrontLeftWheel';wheel.position.set(-1.4,.35,.85);wheel.rotation.x=Math.PI/2;source.add(wheel);
  source.scale.setScalar(100);source.updateMatrixWorld(true);
  return source;
}
const mappings=[
  {id:'front-wing',name:'Front wing',nodes:['FrontWing'],offset:[-1.2,.2,0]},
  {id:'chassis',name:'Chassis',nodes:['Body'],offset:[0,.25,0]},
  {id:'front-left-wheel',name:'Front left wheel',nodes:['FrontLeftWheel'],offset:[-.25,.1,.8]},
];

test('Import preserves complete meshes and groups wing primitives as a single removable part',()=>{
  const model=prepareImportedCar(sourceFixture(),{components:mappings,rotation:[0,0,0]});
  assert.equal(model.components.length,3);
  assert.equal(model.assemblies.get('front-wing').children[0].children.length,2);
  let meshes=0;model.root.traverse(node=>{if(node.isMesh)meshes++;});
  assert.equal(meshes,4);
  const size=new THREE.Box3().setFromObject(model.root).getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.x-5.2)<1e-5,'Source normalized for the existing viewport');
});

test('Imported explosion restores nested and rotated source transforms without drift',()=>{
  const model=prepareImportedCar(sourceFixture(),{components:mappings});
  model.root.updateMatrixWorld(true);
  const before=[];model.root.traverse(node=>{if(node.isMesh)before.push(node.matrixWorld.clone());});
  setImportedExplosion(model.assemblies,1);model.root.updateMatrixWorld(true);
  const exploded=[];model.root.traverse(node=>{if(node.isMesh)exploded.push(node.matrixWorld.clone());});
  assert.ok(exploded.some((matrix,index)=>!matrix.equals(before[index])));
  for(let i=0;i<20;i++){setImportedExplosion(model.assemblies,.6);setImportedExplosion(model.assemblies,0);}
  model.root.updateMatrixWorld(true);let index=0;
  model.root.traverse(node=>{if(node.isMesh)assert.ok(node.matrixWorld.equals(before[index++]));});
  setImportedExplosion(model.assemblies,NaN);
  for(const part of model.assemblies.values())assert.ok(part.position.toArray().every(Number.isFinite));
});

test('Selection preserves authored materials and does not affect another assembly sharing a source material',()=>{
  const model=prepareImportedCar(sourceFixture(),{components:mappings});
  const body=model.assemblies.get('chassis').children[0];
  const wing=model.assemblies.get('front-wing').children[0].children[0];
  highlightImportedPart(model.assemblies,'front-wing');
  assert.notEqual(body.material,wing.material);
  assert.equal(body.material.emissive.getHex(),0);
  assert.notEqual(wing.material.emissive.getHex(),0);
  highlightImportedPart(model.assemblies,null);
  assert.equal(wing.material.emissive.getHex(),0);
});

test('Rejects incomplete, ambiguous or overlapping component maps instead of mislabelling geometry',()=>{
  assert.throws(()=>prepareImportedCar(sourceFixture(),{components:[...mappings,{id:'flap',name:'Flap',nodes:['Flap0']}]}),/overlap/i);
  assert.throws(()=>prepareImportedCar(sourceFixture(),{components:mappings.slice(0,2)}),/unmapped/i);
  assert.throws(()=>prepareImportedCar(sourceFixture(),{components:[{id:'wrong',name:'Wrong',nodes:['Missing']},mappings[1]]}),/not found/i);
  const duplicate=sourceFixture();duplicate.children[2].name='Body';
  assert.throws(()=>prepareImportedCar(duplicate,{components:mappings}),/ambiguous/i);
});

test('An absent asset keeps the concept explicitly labelled; configured imports require provenance and local paths',()=>{
  assert.equal(validateAssetConfig({asset:null}),null);
  assert.throws(()=>validateAssetConfig({asset:'https://example.com/private.glb'}),/local/i);
  assert.throws(()=>validateAssetConfig({asset:'../secret.glb'}),/local/i);
  assert.throws(()=>validateAssetConfig({asset:'./models/sf26.glb',components:mappings}),/license/i);
  const config={asset:'./models/sf26.glb',format:'glb',name:'Ferrari SF-26',components:mappings,license:{acquired:true,source:'https://example.com/model',usage:'Private local evaluation'}};
  assert.equal(validateAssetConfig(config).name,'Ferrari SF-26');
});
