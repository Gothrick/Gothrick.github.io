import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";

const hero = document.getElementById("hero");
const canvas = document.getElementById("storm");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
} catch (e) {
  hero.classList.add("no-gl"); canvas.remove();
}

if (renderer) {
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const FOV = 55, CAM_Z = 6;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);
  camera.position.set(0, 0, CAM_Z);

  const shared = {
    uTime: { value: 0 }, uFlash: { value: 0 }, uStrike: { value: new THREE.Vector3(0, 4, -6) }, uMotion: { value: reduced ? 0 : 1 }
  };

  const NOISE = `
    float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }`;

  const planeVert = `
    varying vec3 vWorld; varying vec2 vUv;
    void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms: shared, vertexShader: planeVert, depthWrite: false,
      fragmentShader: `
        uniform float uFlash; varying vec2 vUv;
        void main() {
          vec3 c = mix(vec3(0.010, 0.014, 0.028), vec3(0.035, 0.05, 0.095), pow(1.0 - vUv.y, 1.6));
          c += vec3(0.25, 0.4, 0.8) * uFlash * 0.07;
          gl_FragColor = vec4(c, 1.0);
        }`
    })
  );
  backdrop.position.z = -24; scene.add(backdrop);

  const layers = [];
  function cloudLayer(z, scale, speed, alpha, seed, tint) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...shared, uScale: { value: scale }, uSpeed: { value: speed }, uAlpha: { value: alpha }, uSeed: { value: seed }, uTint: { value: new THREE.Color(...tint) } },
      vertexShader: planeVert, transparent: true, depthWrite: false,
      fragmentShader: `
        uniform float uTime, uFlash, uMotion, uScale, uSpeed, uAlpha, uSeed; uniform vec3 uStrike, uTint; varying vec3 vWorld; varying vec2 vUv;
        ${NOISE}
        void main() {
          float t = uTime * uSpeed * uMotion;
          vec2 p = vWorld.xy * uScale + vec2(uSeed, uSeed * 0.7);
          vec2 warp = vec2(fbm(p * 0.9 + vec2(t, 0.0)), fbm(p * 0.9 + vec2(4.1, 2.3 - t)));
          float d = fbm(p + 2.2 * warp + vec2(t * 2.0, 0.0));
          float cover = smoothstep(0.05, 0.9, vUv.y);
          float dens = smoothstep(0.32, 0.80, d + cover * 0.30 - 0.20);
          vec3 base = mix(uTint * 0.55, uTint * 1.5, d);
          float near = exp(-length((vWorld.xy - uStrike.xy) * vec2(0.20, 0.28))) * exp(-abs(vWorld.z - uStrike.z) * 0.10);
          vec3 lit = base + vec3(0.50, 0.68, 1.0) * uFlash * (0.30 + 1.25 * near);
          gl_FragColor = vec4(lit, dens * uAlpha);
        }`
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.position.z = z; scene.add(m); layers.push(m); return m;
  }
  cloudLayer(-12, 0.20, 0.030, 1.00, 3.0, [0.07, 0.10, 0.17]);
  cloudLayer(-8, 0.26, 0.045, 0.95, 11.0, [0.08, 0.11, 0.19]);
  cloudLayer(-4.5, 0.34, 0.065, 0.55, 23.0, [0.09, 0.12, 0.21]);

  const RAIN = 1700, pos = new Float32Array(RAIN * 6), end = new Float32Array(RAIN * 2), seed = new Float32Array(RAIN * 2);
  for (let i = 0; i < RAIN; i++) {
    const x = (Math.random() - 0.5) * 30, y = (Math.random() - 0.5) * 18, z = -13 + Math.random() * 15, s = Math.random();
    for (let k = 0; k < 2; k++) { pos.set([x, y, z], (i * 2 + k) * 3); end[i * 2 + k] = k; seed[i * 2 + k] = s; }
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  rainGeo.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
  rainGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const rain = new THREE.LineSegments(rainGeo, new THREE.ShaderMaterial({
    uniforms: shared, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aEnd; attribute float aSeed; uniform float uTime, uMotion; varying float vA;
      void main() {
        vec3 p = position;
        float y = mod(p.y - uTime * (7.0 + aSeed * 6.0) * uMotion + 9.0, 18.0) - 9.0;
        float len = 0.20 + aSeed * 0.34;
        p.y = y + aEnd * len; p.x += aEnd * len * 0.22;
        vA = (0.25 + 0.75 * aSeed) * (1.0 - aEnd * 0.85) * smoothstep(-14.0, 1.0, p.z);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform float uFlash; varying float vA;
      void main() { gl_FragColor = vec4(vec3(0.62, 0.78, 1.0) * (1.0 + uFlash * 1.1), vA * 0.17 * (1.0 + uFlash * 0.5)); }`
  }));
  rain.frustumCulled = false; scene.add(rain);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.ShaderMaterial({
      uniforms: { uAmt: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float uAmt; varying vec2 vUv; void main(){ float r = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(vec3(0.20, 0.50, 1.0) * exp(-r * 3.2) * uAmt * 3.0, 1.0); }"
    })
  );
  glow.position.z = -3; glow.scale.setScalar(1.8); scene.add(glow);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.65, 0.8);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let W = 1, H = 1, scale = 1;
  function resize() {
    W = hero.clientWidth; H = hero.clientHeight;
    scale = Math.min(window.devicePixelRatio || 1, 1.5) * (innerWidth < 760 ? 0.6 : 0.8);
    renderer.setPixelRatio(scale); renderer.setSize(W, H, false);
    composer.setPixelRatio(scale); composer.setSize(W, H);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const cover = (z) => { const h = 2 * Math.tan((FOV * Math.PI) / 360) * (CAM_Z - z) * 1.3; return [h * (W / H), h]; };
    [backdrop, ...layers].forEach((m) => { const [w, h] = cover(m.position.z); m.scale.set(w, h, 1); m.position.y = h * 0.04; });
    boltMats.forEach((m) => m.resolution.set(W * scale, H * scale));
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  function channel(a, b, disp, depth) {
    let pts = [a.clone(), b.clone()];
    for (let k = 0; k < depth; k++) {
      const next = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i], q = pts[i + 1], d = q.clone().sub(p), len = Math.hypot(d.x, d.y) || 1;
        const off = (Math.random() - 0.5) * disp;
        next.push(new THREE.Vector3((p.x + q.x) / 2 - (d.y / len) * off, (p.y + q.y) / 2 + (d.x / len) * off, (p.z + q.z) / 2 + (Math.random() - 0.5) * disp * 0.25), q);
      }
      pts = next; disp *= 0.58;
    }
    return pts;
  }
  const flat = (pts) => pts.flatMap((p) => [p.x, p.y, p.z]);

  const boltMats = [];
  function lineMat(color, width, opacity) {
    const m = new LineMaterial({ color, linewidth: width * scale, transparent: true, opacity, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    m.resolution.set(W * scale, H * scale); boltMats.push(m); return m;
  }
  function makeBolt(O, T) {
    const group = new THREE.Group(), core = [], halo = [];
    const add = (pts, w) => {
      const g = new LineGeometry(); g.setPositions(flat(pts));
      const h = new Line2(g, lineMat(0x4f8dff, w * 2.6, 0.22)), c = new Line2(g, lineMat(0xffffff, w, 1));
      h.renderOrder = 10; c.renderOrder = 11; group.add(h, c); halo.push(h.material); core.push(c.material);
    };
    const len = O.distanceTo(T);
    const main = channel(O, T, len * 0.16, 8); add(main, 2.2);
    const count = Math.round(rnd(3, 6));
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(rnd(0.25, 0.85) * (main.length - 1)), s = main[idx];
      const base = Math.atan2(T.y - O.y, T.x - O.x), ang = base + (Math.random() < 0.5 ? -1 : 1) * rnd(0.18, 0.55);
      const l = len * rnd(0.07, 0.20) * (1 - (idx / main.length) * 0.5);
      const e = new THREE.Vector3(s.x + Math.cos(ang) * l, s.y + Math.sin(ang) * l, s.z + rnd(-0.6, 0.6));
      const fork = channel(s, e, l * 0.22, 5); add(fork, 1.0);
      if (Math.random() < 0.2) {
        const k = Math.floor(rnd(0.3, 0.8) * (fork.length - 1)), f = fork[k], a2 = ang + (Math.random() < 0.5 ? -1 : 1) * rnd(0.4, 0.9), l2 = l * rnd(0.3, 0.55);
        add(channel(f, new THREE.Vector3(f.x + Math.cos(a2) * l2, f.y + Math.sin(a2) * l2, f.z), l2 * 0.22, 4), 0.7);
      }
    }
    return { group, core, halo };
  }

  // A real strike is one very brief flash plus a few quick re-flickers, different every time.
  function makePulses() {
    const list = [[0, 1.0, rnd(0.02, 0.035)]];
    let at = 0;
    const n = Math.floor(rnd(1, 5));
    for (let i = 0; i < n; i++) { at += rnd(0.035, 0.13); list.push([at, rnd(0.35, 1.0), rnd(0.015, 0.04)]); }
    return list;
  }
  const envelope = (age, pulses) => {
    let fast = 0;
    for (const [at, amp, tau] of pulses) if (age >= at) fast += amp * Math.exp(-(age - at) / tau);
    return { fast: Math.min(1.15, fast), glow: 0.22 * Math.exp(-age / 0.16) };
  };

  let pointer = { x: 0, y: 0 }, hasPointer = false;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    pointer = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) }; hasPointer = true;
  });
  hero.addEventListener("pointerleave", () => { hasPointer = false; });

  const ray = new THREE.Vector3();
  const worldAt = (nx, ny, z) => {
    ray.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
    return camera.position.clone().add(ray.multiplyScalar((z - camera.position.z) / ray.z));
  };

  let nextIsDouble = false;
  let strike = null, nextStrike = 1.4, clock = 0, last = performance.now(), visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(hero);

  function endStrike() {
    if (!strike) return;
    if (!strike.bolt) { strike = null; return; }
    scene.remove(strike.bolt.group);
    strike.bolt.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { o.material.dispose(); const i = boltMats.indexOf(o.material); if (i >= 0) boltMats.splice(i, 1); } });
    strike = null;
  }
  let sheetAt = Infinity;
  function startStrike(opts = {}) {
    endStrike();
    const pulses = makePulses(), end = pulses[pulses.length - 1][0] + 0.7;
    if (opts.sheet) {
      shared.uStrike.value.set(rnd(-6, 6), rnd(1.5, 5), -8);
      strike = { t0: clock, bolt: null, pulses, end, scale: 0.4 };
      return;
    }
    const n = hasPointer ? { x: pointer.x + (opts.near ? rnd(-0.06, 0.06) : 0), y: pointer.y } : { x: rnd(-0.5, 0.5), y: rnd(-0.55, 0.1) };
    const T = worldAt(n.x, n.y, -2.5);
    const hh = Math.tan((FOV * Math.PI) / 360) * (CAM_Z + 6);
    const O = new THREE.Vector3(T.x * 0.85 + rnd(-1.8, 1.8), Math.max(hh * 0.98, T.y + 3), -6);
    const bolt = makeBolt(O, T);
    scene.add(bolt.group);
    shared.uStrike.value.set(O.x, O.y - 1, -6);
    glow.position.set(T.x, T.y, -3);
    strike = { t0: clock, bolt, pulses, end, scale: 1 };
  }
  // Irregular rhythm: mostly 4 to 6 seconds, sometimes a quick second strike, sometimes a long pause.
  function scheduleNext() {
    const r = Math.random();
    let gap, double = false;
    if (r < 0.18) { gap = rnd(0.25, 0.8); double = true; }
    else if (r < 0.34) gap = rnd(1.6, 3.2);
    else if (r < 0.84) gap = rnd(4, 6);
    else gap = rnd(6.5, 10);
    nextStrike = clock + gap; nextIsDouble = double;
    sheetAt = !double && Math.random() < 0.4 ? clock + rnd(1.2, Math.max(1.4, gap - 0.9)) : Infinity;
  }

  resize(); addEventListener("resize", resize);
  const target = new THREE.Vector3(0, 0.4, -8);

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (visible && !document.hidden) {
      clock += dt; shared.uTime.value = clock;
      if (!reduced && clock >= nextStrike) { startStrike({ near: nextIsDouble }); scheduleNext(); }
      else if (!reduced && clock >= sheetAt && !strike) { startStrike({ sheet: true }); sheetAt = Infinity; }
      let flash = 0, fast = 0;
      if (strike) {
        const age = clock - strike.t0, e = envelope(age, strike.pulses);
        fast = e.fast * strike.scale; flash = (e.fast + e.glow) * strike.scale;
        const a = Math.min(1, e.fast);
        if (strike.bolt) {
          strike.bolt.core.forEach((m) => { m.opacity = a; m.color.setScalar(1 + a * 1.6); });
          strike.bolt.halo.forEach((m) => { m.opacity = 0.22 * a; });
        }
        if (age > strike.end) endStrike();
      }
      shared.uFlash.value = flash;
      bloom.strength = 0.32 + 0.65 * fast;

      const px = hasPointer ? pointer.x : Math.sin(clock * 0.3) * 0.3, py = hasPointer ? pointer.y : Math.cos(clock * 0.23) * 0.12;
      camera.position.x += (px * 0.45 - camera.position.x) * Math.min(1, dt * 2.5);
      camera.position.y += (py * 0.25 - camera.position.y) * Math.min(1, dt * 2.5);
      camera.lookAt(target);
      glow.material.uniforms.uAmt.value = strike && strike.bolt ? 0.28 * fast + 0.5 * (flash - fast) : 0;
      composer.render();
    }
    if (!reduced) requestAnimationFrame(frame);
  }
  if (reduced) { clock = 40; frame(performance.now()); } else requestAnimationFrame(frame);
  window.__storm = { startStrike, get strike() { return strike; }, get nextStrike() { return nextStrike; }, get clock() { return clock; } };
}
