import {readFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
const source=resolve('node_modules/three/examples/jsm');
const output=resolve('dist/vendor/addons');
const copied=new Set();
async function copyAddon(file){
  if(copied.has(file))return;
  const local=relative(source,file);if(local.startsWith('..'))throw new Error('Dependency escaped Three.js addons.');
  copied.add(file);const target=resolve(output,local);await mkdir(dirname(target),{recursive:true});await copyFile(file,target);
  const code=await readFile(file,'utf8');
  for(const match of code.matchAll(/from\s*['"]([^'"]+)['"]/g))if(match[1].startsWith('.'))await copyAddon(resolve(dirname(file),match[1]));
}
await copyAddon(resolve(source,'loaders/GLTFLoader.js'));
await copyAddon(resolve(source,'loaders/FBXLoader.js'));
console.log(`Copied ${copied.size} installed Three.js loader dependencies.`);
