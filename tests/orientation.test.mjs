import test from 'node:test';
import assert from 'node:assert/strict';
import { basisFromDeviceOrientation } from '../src/orientation.js';
import { basisDirection } from '../src/renderer.js';

const near = (actual, expected, tolerance = 1e-8) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);
};

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const length = (vector) => Math.hypot(vector.x, vector.y, vector.z);

test('背面カメラ方向を全方位の視線として使う', () => {
  const north = basisDirection(basisFromDeviceOrientation(0, 90, 0));
  const east = basisDirection(basisFromDeviceOrientation(270, 90, 0));
  const south = basisDirection(basisFromDeviceOrientation(180, 90, 0));
  const west = basisDirection(basisFromDeviceOrientation(90, 90, 0));
  near(north.heading, 0);
  near(east.heading, 90);
  near(south.heading, 180);
  near(west.heading, 270);
  for (const direction of [north, east, south, west]) near(direction.pitch, 0);
});

test('端末を上へ向けると天頂、下へ向けると地面を表示する', () => {
  const ceiling = basisDirection(basisFromDeviceOrientation(0, 180, 0));
  const ground = basisDirection(basisFromDeviceOrientation(0, 0, 0));
  near(ceiling.pitch, 90);
  near(ground.pitch, -90);
});

test('画面回転後も背面カメラの視線は変わらない', () => {
  for (const screenAngle of [0, 90, 180, 270]) {
    const direction = basisDirection(basisFromDeviceOrientation(90, 90, 0, screenAngle));
    near(direction.heading, 270);
    near(direction.pitch, 0);
  }
});

test('上下移動は地面から水平線を通って天頂へ連続して追従する', () => {
  const pitches = [0, 45, 90, 135, 180]
    .map((beta) => basisDirection(basisFromDeviceOrientation(0, beta, 0)).pitch);
  assert.deepEqual(pitches.map((pitch) => Math.round(pitch) || 0), [-90, -45, 0, 45, 90]);
});

test('全方位・全画面角度でカメラ基底を正規直交に保つ', () => {
  for (const alpha of [0, 90, 180, 270]) {
    for (const screenAngle of [0, 90, 180, 270]) {
      const basis = basisFromDeviceOrientation(alpha, 90, 0, screenAngle);
      near(length(basis.right), 1);
      near(length(basis.up), 1);
      near(length(basis.forward), 1);
      near(dot(basis.right, basis.up), 0);
      near(dot(basis.right, basis.forward), 0);
      near(dot(basis.up, basis.forward), 0);
    }
  }
});
