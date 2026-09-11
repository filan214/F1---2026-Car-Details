import {readFile, access} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import assert from 'node:assert/strict';
import {validateAssetConfig} from '../dist/imported-car.js';
const root=resolve('dist');
const html=await readFile(resolve(root,'index.html'),'utf8');
const app=await readFile(resolve(root,'app.js'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(ids.length,new Set(ids).size,'HTML IDs must be unique');
for(const match of app.matchAll(/\$\('#([a-z-]+)'\)/g))assert.ok(ids.includes(match[1]),`Missing interface element: ${match[1]}`);
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))await access(resolve(root,match[1]));
const checked=new Set();
async function checkModule(file){
  if(checked.has(file))return;
  checked.add(file);
  const source=await readFile(file,'utf8');
  for(const match of source.matchAll(/(?:from\s*|import\s*\(?\s*)['"]([^'"]+)['"]/g)){
    const specifier=match[1];
    if(specifier==='three')await checkModule(resolve(root,'vendor/three.module.js'));
    else if(specifier.startsWith('three/addons/'))await checkModule(resolve(root,'vendor/addons',specifier.slice(13)));
    else if(specifier.startsWith('.'))await checkModule(resolve(dirname(file),specifier));
  }
}
await checkModule(resolve(root,'app.js'));
const assetConfig=validateAssetConfig(JSON.parse(await readFile(resolve(root,'models/asset.json'),'utf8')));
if(assetConfig)await access(resolve(root,assetConfig.asset));
console.log(`Validated ${ids.length} interface elements, local entrypoint assets, and ${checked.size} ES modules.`);
