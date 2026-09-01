import { degToRad, normalizeDegrees, radToDeg } from './astronomy.js';

function multiplyMatrixVector(matrix, vector) {
  return {
    x: matrix[0] * vector.x + matrix[1] * vector.y + matrix[2] * vector.z,
    y: matrix[3] * vector.x + matrix[4] * vector.y + matrix[5] * vector.z,
    z: matrix[6] * vector.x + matrix[7] * vector.y + matrix[8] * vector.z,
  };
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

function rotateAroundZenith(vector, degrees) {
  const angle = degToRad(degrees);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: vector.x * cosine + vector.y * sine,
    y: -vector.x * sine + vector.y * cosine,
    z: vector.z,
  };
}

function headingOf(vector) {
  return normalizeDegrees(radToDeg(Math.atan2(vector.x, vector.y)));
}

function eulerMatrix(alpha, beta, gamma) {
  const a = degToRad(alpha);
  const b = degToRad(beta);
  const g = degToRad(gamma);
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const cb = Math.cos(b);
  const sb = Math.sin(b);
  const cg = Math.cos(g);
  const sg = Math.sin(g);

  // W3C DeviceOrientation: Rz(alpha) · Rx(beta) · Ry(gamma).
  return [
    ca * cg - sa * sb * sg,
    -sa * cb,
    ca * sg + sa * sb * cg,
    sa * cg + ca * sb * sg,
    ca * cb,
    sa * sg - ca * sb * cg,
    -cb * sg,
    sb,
    cb * cg,
  ];
}

export function basisFromDeviceOrientation(alpha, beta, gamma, screenAngle = 0) {
  const matrix = eulerMatrix(alpha, beta, gamma);
  const screen = degToRad(screenAngle);
  const rightDevice = { x: Math.cos(screen), y: -Math.sin(screen), z: 0 };
  const upDevice = { x: Math.sin(screen), y: Math.cos(screen), z: 0 };
  // Device +Z points out through the display toward the user. The sky camera
  // looks through the rear camera, so its viewing direction is device -Z.
  const forwardDevice = { x: 0, y: 0, z: -1 };
  return {
    right: normalize(multiplyMatrixVector(matrix, rightDevice)),
    up: normalize(multiplyMatrixVector(matrix, upDevice)),
    forward: normalize(multiplyMatrixVector(matrix, forwardDevice)),
  };
}

function rotateBasis(basis, degrees) {
  return {
    right: rotateAroundZenith(basis.right, degrees),
    up: rotateAroundZenith(basis.up, degrees),
    forward: rotateAroundZenith(basis.forward, degrees),
  };
}

export class DeviceOrientationController {
  constructor({ onUpdate, initialHeading = () => 180 } = {}) {
    this.onUpdate = onUpdate;
    this.initialHeading = initialHeading;
    this.enabled = false;
    this.relativeOffset = null;
    this.absoluteSeenAt = 0;
    this.firstSampleResolve = null;
    this.firstSampleTimer = null;
    this.handleOrientation = this.handleOrientation.bind(this);
    this.handleScreenChange = this.handleScreenChange.bind(this);
  }

  static isSupported() {
    return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  }

  async start() {
    if (!DeviceOrientationController.isSupported()) {
      return { ok: false, reason: 'この端末／ブラウザは端末方向センサーに対応していません。' };
    }

    const OrientationEvent = window.DeviceOrientationEvent;
    if (typeof OrientationEvent.requestPermission === 'function') {
      let permission;
      try {
        permission = await OrientationEvent.requestPermission(true);
      } catch {
        try {
          permission = await OrientationEvent.requestPermission();
        } catch {
          return { ok: false, reason: 'センサーの利用が許可されませんでした。ブラウザ設定を確認してください。' };
        }
      }
      if (permission !== 'granted') {
        return { ok: false, reason: 'センサーの利用が許可されませんでした。' };
      }
    }

    this.stop();
    this.enabled = true;
    this.relativeOffset = null;
    window.addEventListener('deviceorientationabsolute', this.handleOrientation, true);
    window.addEventListener('deviceorientation', this.handleOrientation, true);
    window.screen?.orientation?.addEventListener?.('change', this.handleScreenChange);

    return new Promise((resolve) => {
      this.firstSampleResolve = resolve;
      this.firstSampleTimer = window.setTimeout(() => {
        this.firstSampleResolve = null;
        this.stop();
        resolve({ ok: false, reason: 'センサー値を受信できませんでした。HTTPS接続と端末設定を確認してください。' });
      }, 4000);
    });
  }

  stop() {
    window.removeEventListener('deviceorientationabsolute', this.handleOrientation, true);
    window.removeEventListener('deviceorientation', this.handleOrientation, true);
    window.screen?.orientation?.removeEventListener?.('change', this.handleScreenChange);
    if (this.firstSampleTimer) window.clearTimeout(this.firstSampleTimer);
    this.firstSampleTimer = null;
    this.enabled = false;
    this.relativeOffset = null;
  }

  handleScreenChange() {
    this.relativeOffset = null;
  }

  handleOrientation(event) {
    if (!this.enabled || !Number.isFinite(event.alpha) || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    const absolute = event.type === 'deviceorientationabsolute' || event.absolute === true || Number.isFinite(event.webkitCompassHeading);
    const now = performance.now();
    if (!absolute && now - this.absoluteSeenAt < 1200) return;
    if (absolute) this.absoluteSeenAt = now;

    const screenAngle = window.screen?.orientation?.angle ?? window.orientation ?? 0;
    let basis = basisFromDeviceOrientation(event.alpha, event.beta, event.gamma, screenAngle);
    const rawHeading = headingOf(basis.forward);
    let source = absolute ? '絶対方位' : '相対方位（開始時に補正）';

    if (Number.isFinite(event.webkitCompassHeading)) {
      basis = rotateBasis(basis, event.webkitCompassHeading - rawHeading);
      source = 'コンパス方位';
    } else if (!absolute) {
      if (this.relativeOffset === null) {
        this.relativeOffset = normalizeDegrees(this.initialHeading() - rawHeading);
      }
      basis = rotateBasis(basis, this.relativeOffset);
    }

    this.onUpdate?.({ basis, source, absolute });
    if (this.firstSampleResolve) {
      const resolve = this.firstSampleResolve;
      this.firstSampleResolve = null;
      if (this.firstSampleTimer) window.clearTimeout(this.firstSampleTimer);
      this.firstSampleTimer = null;
      resolve({ ok: true, source });
    }
  }
}
