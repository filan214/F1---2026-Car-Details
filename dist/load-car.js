import {createCar,COMPONENTS,setExplosion} from './car.js';
import {validateAssetConfig,prepareImportedCar,setImportedExplosion,highlightImportedPart} from './imported-car.js';

export async function loadCar(onProgress=()=>{}) {
  const response=await fetch('./models/asset.json',{cache:'no-store'});
  if(!response.ok)throw new Error('The model configuration could not be loaded.');
  const config=validateAssetConfig(await response.json());
  if(!config)return {...createCar(),components:COMPONENTS,name:'APX–01',subtitle:'CONCEPT CHASSIS',kind:'concept',setExplosion};
  onProgress('Loading '+config.name+'…');
  const progress=event=>{if(event.lengthComputable)onProgress(`Loading ${config.name}… ${Math.round(event.loaded/event.total*100)}%`);};
  let source;
  if(config.asset.toLowerCase().endsWith('.fbx')){
    const {FBXLoader}=await import('three/addons/loaders/FBXLoader.js');
    source=await new FBXLoader().loadAsync(config.asset,progress);
  }else{
    const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
    const gltf=await new GLTFLoader().loadAsync(config.asset,progress);source=gltf.scene;
  }
  onProgress('Preparing component assemblies…');
  return {...prepareImportedCar(source,config),name:config.name,subtitle:config.subtitle||'IMPORTED MODEL',description:config.description,kind:'imported',license:config.license,setExplosion:setImportedExplosion,highlight:highlightImportedPart};
}
