import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCar, setExplosion, COMPONENTS } from '../dist/car.js';

test('Every explorable assembly contains finite, renderable geometry', () => {
  const { root, assemblies } = createCar();
  assert.equal(assemblies.size, COMPONENTS.length);
  assert.equal(assemblies.size, 10);
  root.updateMatrixWorld(true);
  for (const item of COMPONENTS) {
    const group = assemblies.get(item.id);
    let vertices = 0;
    group.traverse(object => {
      if (!object.isMesh) return;
      const data = object.geometry.getAttribute('position');
      vertices += data.count;
      assert.ok(Array.from(data.array).every(Number.isFinite), item.name);
    });
    assert.ok(vertices > 50, `${item.name} has modeled detail`);
  }
  const box = new THREE.Box3().setFromObject(root);
  assert.ok(box.max.x - box.min.x > 5, 'Full car length');
});

test('Explosion separates all parts, clamps input, and restores the assembly precisely', () => {
  const { assemblies } = createCar();
  const origins = [...assemblies.values()].map(group => group.position.clone());
  setExplosion(assemblies, 1);
  [...assemblies.values()].forEach((group, i) => assert.ok(group.position.distanceTo(origins[i]) > 0.1));
  const expanded = [...assemblies.values()].map(group => group.position.clone());
  setExplosion(assemblies, 2);
  [...assemblies.values()].forEach((group, i) => assert.ok(group.position.equals(expanded[i])));
  setExplosion(assemblies, 0);
  [...assemblies.values()].forEach((group, i) => assert.ok(group.position.equals(origins[i])));
  setExplosion(assemblies, -1);
  [...assemblies.values()].forEach((group, i) => assert.ok(group.position.equals(origins[i])));
});
