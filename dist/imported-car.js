import * as THREE from 'three';

const originalEmission=new WeakMap();

export function validateAssetConfig(config) {
  if(config?.asset===null)return null;
  if(!config||typeof config.asset!=='string'||!/^\.\/models\/[a-zA-Z0-9_./ -]+\.(glb|gltf|fbx)$/i.test(config.asset)||config.asset.split('/').includes('..'))throw new Error('The model must use a local ./models/ GLB, glTF or FBX path.');
  if(config.license?.acquired!==true||!config.license.source||!config.license.usage)throw new Error('Record the acquired license, its source and permitted usage before loading the model.');
  if(!config.name||!Array.isArray(config.components)||config.components.length<2)throw new Error('Provide the model name and at least two verified component mappings.');
  if(config.rotation&&(!Array.isArray(config.rotation)||config.rotation.length!==3||!config.rotation.every(Number.isFinite)))throw new Error('Model rotation must contain three finite radians.');
  return config;
}

/** Consume a rigid imported model and preserve the authored geometry and texture maps. */
export function prepareImportedCar(source, options={}) {
  const entries=options.components;
  if(!Array.isArray(entries)||entries.length<2)throw new Error('A verified component map is required for disassembly.');
  const byName=new Map(),byPath=new Map(),meshes=[];
  function index(node,path){
    const current=path+'/'+(node.name||`unnamed-${node.id}`);
    byPath.set(current,node);
    if(node.name){if(!byName.has(node.name))byName.set(node.name,[]);byName.get(node.name).push(node);}
    if(node.isSkinnedMesh)throw new Error('The component explorer accepts rigid car parts. Export the car without a skin or character rig.');
    if(node.isMesh)meshes.push(node);
    for(const child of node.children)index(child,current);
  }
  index(source,'');
  if(!meshes.length)throw new Error('The imported file contains no mesh geometry.');
  const claimedNodes=new Map(),ids=new Set();
  const resolved=entries.map(entry=>{
    if(!/^[a-z0-9][a-z0-9-]*$/.test(entry.id)||ids.has(entry.id))throw new Error('Every component needs a unique id.');
    ids.add(entry.id);
    if(!entry.name||!Array.isArray(entry.nodes)||!entry.nodes.length)throw new Error(`Missing nodes for ${entry.id}.`);
    if(entry.offset&&(!Array.isArray(entry.offset)||entry.offset.length!==3||!entry.offset.every(Number.isFinite)))throw new Error(`Invalid separation vector for ${entry.id}.`);
    const nodes=entry.nodes.map(selector=>{
      const candidates=selector.startsWith('/')?[byPath.get(selector)].filter(Boolean):(byName.get(selector)||[]);
      if(!candidates.length)throw new Error(`Component node not found: ${selector}`);
      if(candidates.length>1)throw new Error(`Ambiguous component node: ${selector}. Use its full hierarchy path.`);
      const node=candidates[0];
      if(node===source)throw new Error('Map removable component nodes instead of the entire source root.');
      if(claimedNodes.has(node))throw new Error(`Component mappings overlap at ${selector}.`);
      claimedNodes.set(node,entry.id);return node;
    });
    return {entry,nodes};
  });
  for(const node of claimedNodes.keys())for(let parent=node.parent;parent;parent=parent.parent)if(claimedNodes.has(parent))throw new Error(`Component mappings overlap at ${node.name}.`);
  for(const mesh of meshes){
    let owner=mesh;while(owner&&!claimedNodes.has(owner))owner=owner.parent;
    if(!owner)throw new Error(`Unmapped mesh: ${mesh.name||mesh.id}. Add it to a component before enabling disassembly.`);
  }
  // Normalize display size and rest the tyres on the existing studio ground.
  const normalization=new THREE.Group();normalization.rotation.set(...(options.rotation||[0,0,0]));normalization.add(source);normalization.updateMatrixWorld(true);
  const sourceBounds=new THREE.Box3().setFromObject(normalization);
  const size=sourceBounds.getSize(new THREE.Vector3());
  if(!size.toArray().every(Number.isFinite)||size.x<=0)throw new Error('Invalid or empty model bounds.');
  normalization.scale.setScalar(5.2/size.x);normalization.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(normalization),center=bounds.getCenter(new THREE.Vector3());
  normalization.position.set(-center.x,-.33-bounds.min.y,-center.z);normalization.updateMatrixWorld(true);

  const root=new THREE.Group();root.name=options.name||'Imported car';
  const assemblies=new Map(),components=[];
  for(const {entry,nodes} of resolved){
    const group=new THREE.Group();group.name=entry.id;group.userData.assembly=entry.id;group.userData.home=new THREE.Vector3();root.add(group);
    const materialCopies=new Map();
    for(const node of nodes){
      const world=node.matrixWorld.clone();group.add(node);
      node.matrix.copy(world);node.matrixAutoUpdate=false;
      node.traverse(child=>{
        if(!child.isMesh)return;
        child.userData.assembly=entry.id;child.castShadow=true;child.receiveShadow=true;
        function copyMaterial(material){
          if(!materialCopies.has(material)){
            const copy=material.clone();
            if(copy.emissive)originalEmission.set(copy,{color:copy.emissive.clone(),intensity:copy.emissiveIntensity});
            materialCopies.set(material,copy);
          }
          return materialCopies.get(material);
        }
        child.material=Array.isArray(child.material)?child.material.map(copyMaterial):copyMaterial(child.material);
      });
    }
    root.updateMatrixWorld(true);
    const partCenter=new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
    group.userData.offset=new THREE.Vector3(...(entry.offset||[Math.sign(partCenter.x)*.7,.6,Math.sign(partCenter.z)*.7]));
    assemblies.set(entry.id,group);
    components.push({category:'Model assembly',material:'As supplied in the source model',description:'This is a separately mapped assembly from the imported model.',icon:'chassis',...entry});
  }
  return {root,assemblies,components};
}

export function setImportedExplosion(assemblies,amount) {
  const t=THREE.MathUtils.clamp(Number.isFinite(amount)?amount:0,0,1);
  for(const group of assemblies.values())group.position.copy(group.userData.home).addScaledVector(group.userData.offset,t);
}

export function highlightImportedPart(assemblies,id) {
  for(const [key,group] of assemblies)group.traverse(node=>{
    if(!node.isMesh)return;
    for(const material of (Array.isArray(node.material)?node.material:[node.material])){
      const original=originalEmission.get(material);if(!original)continue;
      material.emissive.copy(original.color);material.emissiveIntensity=original.intensity;
      if(key===id){material.emissive.lerp(new THREE.Color(0xe84625),.35);material.emissiveIntensity=Math.max(.2,original.intensity);}
    }
  });
}
