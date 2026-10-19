/**
 * KẾ HOẠCH WEB SINH NHẬT - MAIN.JS v6
 * 12 loại pháo hoa + bánh đẹp + 20 nến
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ============================================================================
   1. HẠT NỀN 2D LUNG LINH
   ============================================================================ */
const ambientCanvas = document.getElementById('ambient-canvas');
const ctx2d = ambientCanvas.getContext('2d');
let ambientParticles = [];

const stage1El = document.getElementById('stage-1');
const stage2El = document.getElementById('stage-2');
const stage3UiEl = document.getElementById('stage-3-ui');
const webglContainer = document.getElementById('webgl-container');

function resizeAmbientCanvas() {
  ambientCanvas.width = window.innerWidth;
  ambientCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeAmbientCanvas);
resizeAmbientCanvas();

for (let i = 0; i < 150; i++) {
  ambientParticles.push({
    x: Math.random() * ambientCanvas.width,
    y: Math.random() * ambientCanvas.height,
    r: Math.random() * 4 + 1,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -Math.random() * 0.4 - 0.1,
    alpha: Math.random() * 0.7 + 0.3,
    hue: Math.random() * 60 + 20,
    twinkle: Math.random() * Math.PI * 2
  });
}

function renderAmbientParticles() {
  ctx2d.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
  for (const p of ambientParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.twinkle += 0.03;
    if (p.y < -10) p.y = ambientCanvas.height + 10;
    if (p.x < -10) p.x = ambientCanvas.width + 10;
    if (p.x > ambientCanvas.width + 10) p.x = -10;
    const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.twinkle));
    const gradient = ctx2d.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    gradient.addColorStop(0, `hsla(${p.hue}, 100%, 90%, ${alpha})`);
    gradient.addColorStop(0.4, `hsla(${p.hue}, 100%, 70%, ${alpha * 0.5})`);
    gradient.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
    ctx2d.beginPath();
    ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx2d.fillStyle = gradient;
    ctx2d.fill();
  }
  requestAnimationFrame(renderAmbientParticles);
}
renderAmbientParticles();

/* ============================================================================
   2. TEXTURE GLOW CHẤT LƯỢNG CAO
   ============================================================================ */
function createGlowTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.15, 'rgba(255, 245, 220, 0.8)');
  gradient.addColorStop(0.4, 'rgba(255, 220, 180, 0.4)');
  gradient.addColorStop(0.7, 'rgba(255, 180, 120, 0.15)');
  gradient.addColorStop(1, 'rgba(255, 150, 80, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStarTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 250, 200, 0.7)');
  gradient.addColorStop(0.55, 'rgba(255, 220, 160, 0.25)');
  gradient.addColorStop(1, 'rgba(255, 180, 100, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const GLOW_TEX = createGlowTexture(128);
const STAR_TEX = createStarTexture(128);

/* ============================================================================
   3. SPARKLE SYSTEM
   ============================================================================ */
class SparkleSystem {
  constructor(scene, count = 320) {
    this.scene = scene;
    this.sparkles = [];
    this.colors = [0xffd166, 0xff85b3, 0xa786ff, 0xffffff, 0xffc8dd, 0xb5e0ff, 0xffe066, 0xff9eb5];
    
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: i % 4 === 0 ? STAR_TEX : GLOW_TEX,
        color: this.colors[i % this.colors.length],
        transparent: true,
        opacity: Math.random() * 0.6 + 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      const layer = Math.floor(i / 100);
      const r = 3 + layer * 5 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const y = Math.random() * 10 - 1;
      sprite.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
      const scale = Math.random() * 0.35 + 0.1;
      sprite.scale.set(scale, scale, scale);
      scene.add(sprite);
      this.sparkles.push({
        sprite,
        baseOpacity: mat.opacity,
        baseY: y,
        baseScale: scale,
        speed: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        orbitSpeed: (Math.random() - 0.5) * 0.3,
        orbitRadius: r,
        orbitPhase: theta
      });
    }
  }

  update(elapsed) {
    for (const s of this.sparkles) {
      s.phase += 0.02;
      s.orbitPhase += s.orbitSpeed * 0.016;
      s.sprite.position.x = Math.cos(s.orbitPhase) * s.orbitRadius;
      s.sprite.position.z = Math.sin(s.orbitPhase) * s.orbitRadius;
      s.sprite.position.y = s.baseY + Math.sin(elapsed * s.speed + s.phase) * 0.5;
      const twinkle = 0.5 + 0.5 * Math.sin(s.phase * 1.5);
      s.sprite.material.opacity = s.baseOpacity * twinkle;
      const scalePulse = 0.8 + 0.4 * Math.sin(elapsed * 2 + s.phase);
      s.sprite.scale.set(s.baseScale * scalePulse, s.baseScale * scalePulse, s.baseScale * scalePulse);
    }
  }
}

/* ============================================================================
   4. HỆ THỐNG PHÁO HOA 12 LOẠI
   ============================================================================ */
class FireworksUltimate {
  constructor(scene) {
    this.scene = scene;
    this.activeFireworks = [];
    this.rockets = [];
    this.burstTypes = [
      // Cầu đều
      'peony', 'chrysanthemum',
      // Rơi
      'willow', 'waterfall',
      // Vòng
      'ring', 'heart', 'spiral',
      // Directional
      'fanning', 'crossette',
      // Đặc biệt
      'crackle', 'strobe', 'brocade'
    ];
  }

  createFlash(position, color) {
    const mat = new THREE.SpriteMaterial({
      map: GLOW_TEX,
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(position);
    sprite.scale.set(1.2, 1.2, 1.2);
    this.scene.add(sprite);
    this.activeFireworks.push({
      type: 'flash',
      sprites: [sprite],
      life: 0.7,
      decay: 0.08
    });
    const flashLight = new THREE.PointLight(color, 3, 10);
    flashLight.position.copy(position);
    this.scene.add(flashLight);
    setTimeout(() => this.scene.remove(flashLight), 150);
  }

  createTrail(rocket) {
    const trailLength = 15;
    const positions = new Float32Array(trailLength * 3);
    for (let i = 0; i < trailLength; i++) {
      positions[i * 3] = rocket.mesh.position.x;
      positions[i * 3 + 1] = rocket.mesh.position.y;
      positions[i * 3 + 2] = rocket.mesh.position.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: rocket.color,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    rocket.trailLine = line;
  }

  launchRocket(targetPos, color) {
    const mat = new THREE.SpriteMaterial({
      map: STAR_TEX,
      color: 0xffffcc,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });
    const rocket = new THREE.Sprite(mat);
    rocket.scale.set(0.3, 0.3, 0.3);
    rocket.position.set(targetPos.x, 0, targetPos.z);
    this.scene.add(rocket);
    
    const r = {
      mesh: rocket,
      color: new THREE.Color(color),
      targetY: targetPos.y,
      velocity: 0.2 + Math.random() * 0.08,
      trailLine: null,
      burstType: 'peony'
    };
    this.rockets.push(r);
    this.createTrail(r);
  }

  // PEONY - Nổ cầu đều
  createPeony(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    for (let i = 0; i < 100; i++) {
      const mat = new THREE.SpriteMaterial({
        map: STAR_TEX, color: colorObj, transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(Math.random() * 0.2 + 0.12, Math.random() * 0.2 + 0.12, 1);
      this.scene.add(sprite);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 3.5 + Math.random() * 2.5;
      particles.push({
        sprite,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.cos(phi) * speed,
        vz: Math.sin(phi) * Math.sin(theta) * speed,
        life: 1.0, decay: 0.006 + Math.random() * 0.004, type: 'peony'
      });
    }
    this.activeFireworks.push({ type: 'peony', particles, gravity: 0.035 });
  }

  // CHRYSANTHEMUM - Trail dài
  createChrysanthemum(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    for (let i = 0; i < 70; i++) {
      const mat = new THREE.SpriteMaterial({
        map: GLOW_TEX, color: colorObj, transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(Math.random() * 0.25 + 0.15, Math.random() * 0.25 + 0.15, 1);
      this.scene.add(sprite);
      const theta = (i / 70) * Math.PI * 2 + Math.random() * 0.2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 5 + Math.random() * 2;
      const trailGeo = new THREE.BufferGeometry();
      const trailPos = new Float32Array(18 * 3);
      for (let j = 0; j < 18; j++) {
        trailPos[j * 3] = position.x; trailPos[j * 3 + 1] = position.y; trailPos[j * 3 + 2] = position.z;
      }
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
      const trailMat = new THREE.LineBasicMaterial({
        color: colorObj, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending
      });
      const trail = new THREE.Line(trailGeo, trailMat);
      this.scene.add(trail);
      particles.push({
        sprite, trail, trailPos,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.cos(phi) * speed,
        vz: Math.sin(phi) * Math.sin(theta) * speed,
        life: 1.0, decay: 0.007, type: 'chrysanthemum'
      });
    }
    this.activeFireworks.push({ type: 'chrysanthemum', particles, gravity: 0.04 });
  }

  // WILLOW - Rơi chậm
  createWillow(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    for (let i = 0; i < 80; i++) {
      const mat = new THREE.SpriteMaterial({
        map: GLOW_TEX, color: colorObj, transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(0.18, 0.18, 1);
      this.scene.add(sprite);
      const theta = (i / 80) * Math.PI * 2;
      const speed = 4 + Math.random() * 1.5;
      particles.push({
        sprite,
        vx: Math.cos(theta) * speed,
        vy: Math.random() * 1.5,
        vz: Math.sin(theta) * speed,
        life: 1.0, decay: 0.003, type: 'willow'
      });
    }
    this.activeFireworks.push({ type: 'willow', particles, gravity: 0.015 });
  }

  // RING - Bay vòng tròn
  createRing(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    for (let i = 0; i < 50; i++) {
      const mat = new THREE.SpriteMaterial({
        map: GLOW_TEX, color: colorObj, transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(0.25, 0.25, 1);
      this.scene.add(sprite);
      const theta = (i / 50) * Math.PI * 2;
      const speed = 5;
      particles.push({
        sprite,
        vx: Math.cos(theta) * speed,
        vy: 0,
        vz: Math.sin(theta) * speed,
        life: 1.0, decay: 0.008, type: 'ring'
      });
    }
    this.activeFireworks.push({ type: 'ring', particles, gravity: 0.025 });
  }

  // CRACKLE - Lấp lánh ngẫu nhiên
  createCrackle(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    for (let i = 0; i < 120; i++) {
      const mat = new THREE.SpriteMaterial({
        map: STAR_TEX,
        color: Math.random() > 0.4 ? colorObj : new THREE.Color(0xffffff),
        transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(Math.random() * 0.18 + 0.08, Math.random() * 0.18 + 0.08, 1);
      this.scene.add(sprite);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 6 + Math.random() * 3;
      particles.push({
        sprite,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.cos(phi) * speed,
        vz: Math.sin(phi) * Math.sin(theta) * speed,
        life: 0.5 + Math.random() * 0.5,
        decay: 0.015 + Math.random() * 0.015,
        type: 'crackle', flicker: Math.random() * Math.PI * 2
      });
    }
    this.activeFireworks.push({ type: 'crackle', particles, gravity: 0.05 });
  }

  // HEART - Hình trái tim
  createHeart(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    for (let i = 0; i < 90; i++) {
      const mat = new THREE.SpriteMaterial({
        map: GLOW_TEX,
        color: Math.random() > 0.2 ? colorObj : new THREE.Color(0xff6699),
        transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(Math.random() * 0.2 + 0.1, Math.random() * 0.2 + 0.1, 1);
      this.scene.add(sprite);
      const t = (i / 90) * Math.PI * 2;
      const speed = 4 + Math.random() * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      particles.push({
        sprite,
        vx: hx * 0.12 * speed * 0.05,
        vy: hy * 0.12 * speed * 0.05,
        vz: (Math.random() - 0.5) * 2,
        life: 1.0, decay: 0.005, type: 'heart'
      });
    }
    this.activeFireworks.push({ type: 'heart', particles, gravity: 0.03 });
  }

  // BROCADE - Vàng rơi
  createBrocade(position, color) {
    this.createFlash(position, color);
    const goldColors = [0xffd700, 0xffa500, 0xff8c00, 0xffc125];
    const colorObj = new THREE.Color(goldColors[Math.floor(Math.random() * goldColors.length)]);
    const particles = [];
    for (let i = 0; i < 85; i++) {
      const mat = new THREE.SpriteMaterial({
        map: STAR_TEX, color: colorObj, transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(Math.random() * 0.22 + 0.12, Math.random() * 0.22 + 0.12, 1);
      this.scene.add(sprite);
      const theta = (i / 85) * Math.PI * 2 + Math.random() * 0.15;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 5.5 + Math.random() * 2;
      particles.push({
        sprite,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.cos(phi) * speed,
        vz: Math.sin(phi) * Math.sin(theta) * speed,
        life: 1.0, decay: 0.006, type: 'brocade'
      });
    }
    this.activeFireworks.push({ type: 'brocade', particles, gravity: 0.045 });
  }

  // WATERFALL - Rơi xuống như thác nước
  createWaterfall(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    for (let i = 0; i < 100; i++) {
      const mat = new THREE.SpriteMaterial({
        map: GLOW_TEX, color: colorObj, transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(Math.random() * 0.15 + 0.08, Math.random() * 0.15 + 0.08, 1);
      this.scene.add(sprite);
      const spread = (Math.random() - 0.5) * 3;
      const speed = 3 + Math.random() * 2;
      particles.push({
        sprite,
        vx: spread * 0.5,
        vy: -speed,
        vz: (Math.random() - 0.5) * 2,
        life: 1.0, decay: 0.004, type: 'waterfall'
      });
    }
    this.activeFireworks.push({ type: 'waterfall', particles, gravity: 0.02 });
  }

  // FANNING - Quạt nửa vòng tròn (directional)
  createFanning(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    const fanAngle = Math.random() * Math.PI * 2; // Hướng quạt ngẫu nhiên
    const spread = Math.PI * 0.8; // Nửa vòng tròn
    for (let i = 0; i < 60; i++) {
      const mat = new THREE.SpriteMaterial({
        map: STAR_TEX, color: colorObj, transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(Math.random() * 0.2 + 0.1, Math.random() * 0.2 + 0.1, 1);
      this.scene.add(sprite);
      const theta = fanAngle - spread/2 + (i / 60) * spread;
      const speed = 6 + Math.random() * 2;
      particles.push({
        sprite,
        vx: Math.cos(theta) * speed,
        vy: Math.sin(theta) * speed * 0.3, // Bay cao nhẹ
        vz: Math.random() * 2,
        life: 1.0, decay: 0.007, type: 'fanning'
      });
    }
    this.activeFireworks.push({ type: 'fanning', particles, gravity: 0.025 });
  }

  // CROSSSETTE - Tách đôi thành 4 hướng
  createCrossette(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    const directions = [0, Math.PI/2, Math.PI, Math.PI * 1.5]; // 4 hướng vuông góc
    for (let dir of directions) {
      for (let i = 0; i < 30; i++) {
        const mat = new THREE.SpriteMaterial({
          map: STAR_TEX, color: colorObj, transparent: true, opacity: 1.0,
          blending: THREE.AdditiveBlending, depthWrite: false
        });
        const sprite = new THREE.Sprite(mat);
        sprite.position.copy(position);
        sprite.scale.set(Math.random() * 0.18 + 0.1, Math.random() * 0.18 + 0.1, 1);
        this.scene.add(sprite);
        const spread = (Math.random() - 0.5) * 0.8;
        const speed = 5 + Math.random() * 2;
        particles.push({
          sprite,
          vx: Math.cos(dir + spread) * speed,
          vy: Math.sin(dir + spread) * speed * 0.5,
          vz: (Math.random() - 0.5) * 2,
          life: 1.0, decay: 0.008, type: 'crossette'
        });
      }
    }
    this.activeFireworks.push({ type: 'crossette', particles, gravity: 0.04 });
  }

  // SPIRAL - Xoáy ốc lên
  createSpiral(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    for (let i = 0; i < 80; i++) {
      const mat = new THREE.SpriteMaterial({
        map: GLOW_TEX, color: colorObj, transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(Math.random() * 0.15 + 0.1, Math.random() * 0.15 + 0.1, 1);
      this.scene.add(sprite);
      const t = (i / 80) * Math.PI * 4; // 2 vòng xoắn
      const speed = 5;
      particles.push({
        sprite,
        vx: Math.cos(t) * speed,
        vy: Math.abs(Math.sin(t)) * 4 + 2, // Luôn bay lên
        vz: Math.sin(t) * speed,
        life: 1.0, decay: 0.006, type: 'spiral'
      });
    }
    this.activeFireworks.push({ type: 'spiral', particles, gravity: 0.03 });
  }

  // STROBE - Chớp tắt liên tục
  createStrobe(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    for (let i = 0; i < 100; i++) {
      const mat = new THREE.SpriteMaterial({
        map: STAR_TEX, color: Math.random() > 0.5 ? colorObj : new THREE.Color(0xffffff),
        transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(Math.random() * 0.2 + 0.12, Math.random() * 0.2 + 0.12, 1);
      this.scene.add(sprite);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 4 + Math.random() * 3;
      particles.push({
        sprite,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.cos(phi) * speed,
        vz: Math.sin(phi) * Math.sin(theta) * speed,
        life: 1.0, decay: 0.02, type: 'strobe', flickerRate: 0.3 + Math.random() * 0.2
      });
    }
    this.activeFireworks.push({ type: 'strobe', particles, gravity: 0.045 });
  }

  // CELEBRATION - 15 quả tỏa rộng
  launchCelebration() {
    const colors = [0xff4d8d, 0xffd166, 0xa786ff, 0xff9a5a, 0x4dff88, 0xff6b6b, 0x66d9ff, 0xff85a1];
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const x = (Math.random() - 0.5) * 30;
        const y = 5 + Math.random() * 12;
        const z = (Math.random() - 0.5) * 14;
        const color = colors[i % colors.length];
        const type = this.burstTypes[Math.floor(Math.random() * this.burstTypes.length)];
        this.launchRocket(new THREE.Vector3(x, y, z), color);
        this.rockets[this.rockets.length - 1].burstType = type;
      }, i * 280);
    }
  }

  launchRandom() {
    const colors = [0xff4d8d, 0xffd166, 0xa786ff, 0xff9a5a, 0x4dff88, 0xff6b6b, 0x66d9ff, 0xff85a1];
    // Tản rộng - không tập trung giữa bánh
    const x = (Math.random() - 0.5) * 60;      // ±30 (xa hơn)
    const y = 4 + Math.random() * 18;          // 4-22 cao hơn
    const z = (Math.random() - 0.5) * 50;      // ±25 (xa hơn)
    const color = colors[Math.floor(Math.random() * colors.length)];
    const type = this.burstTypes[Math.floor(Math.random() * this.burstTypes.length)];
    this.launchRocket(new THREE.Vector3(x, y, z), color);
    this.rockets[this.rockets.length - 1].burstType = type;
  }

  update() {
    // Update rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.mesh.position.y += r.velocity;
      r.velocity *= 0.988;
      
      if (r.trailLine) {
        const positions = r.trailLine.geometry.attributes.position;
        for (let j = positions.count - 1; j > 0; j--) {
          positions.array[j * 3] = positions.array[(j - 1) * 3];
          positions.array[j * 3 + 1] = positions.array[(j - 1) * 3 + 1];
          positions.array[j * 3 + 2] = positions.array[(j - 1) * 3 + 2];
        }
        positions.array[0] = r.mesh.position.x;
        positions.array[1] = r.mesh.position.y;
        positions.array[2] = r.mesh.position.z;
        positions.needsUpdate = true;
      }
      
      if (r.mesh.position.y >= r.targetY) {
        const colorHex = r.color.getHex();
        switch (r.burstType) {
          case 'chrysanthemum': this.createChrysanthemum(r.mesh.position.clone(), colorHex); break;
          case 'willow': this.createWillow(r.mesh.position.clone(), colorHex); break;
          case 'ring': this.createRing(r.mesh.position.clone(), colorHex); break;
          case 'crackle': this.createCrackle(r.mesh.position.clone(), colorHex); break;
          case 'heart': this.createHeart(r.mesh.position.clone(), colorHex); break;
          case 'brocade': this.createBrocade(r.mesh.position.clone(), colorHex); break;
          case 'waterfall': this.createWaterfall(r.mesh.position.clone(), colorHex); break;
          case 'fanning': this.createFanning(r.mesh.position.clone(), colorHex); break;
          case 'crossette': this.createCrossette(r.mesh.position.clone(), colorHex); break;
          case 'spiral': this.createSpiral(r.mesh.position.clone(), colorHex); break;
          case 'strobe': this.createStrobe(r.mesh.position.clone(), colorHex); break;
          default: this.createPeony(r.mesh.position.clone(), colorHex);
        }
        this.scene.remove(r.mesh);
        if (r.trailLine) this.scene.remove(r.trailLine);
        r.mesh.material.dispose();
        if (r.trailLine) r.trailLine.geometry.dispose();
        this.rockets.splice(i, 1);
      }
    }
    
    // Update active fireworks
    for (let i = this.activeFireworks.length - 1; i >= 0; i--) {
      const fw = this.activeFireworks[i];
      let allDead = true;
      
      for (const p of fw.particles || []) {
        p.vy -= fw.gravity;
        p.sprite.position.x += p.vx * 0.02;
        p.sprite.position.y += p.vy * 0.02;
        p.sprite.position.z += p.vz * 0.02;
        p.life -= p.decay;
        
        // Strobe effect - chớp tắt
        if (p.type === 'strobe') {
          p.strobePhase = (p.strobePhase || 0) + p.flickerRate;
          p.sprite.material.opacity = Math.sin(p.strobePhase) > 0.3 ? Math.max(0, p.life) : 0;
        } else {
          p.sprite.material.opacity = Math.max(0, p.life);
        }
        
        p.sprite.scale.multiplyScalar(0.992);
        
        if (p.type === 'crackle') {
          p.flicker += 0.3;
          if (Math.sin(p.flicker) > 0.6) p.sprite.material.opacity *= 1.3;
        }
        
        if (p.trail && p.trailPos) {
          for (let j = p.trailPos.length / 3 - 1; j > 0; j--) {
            p.trailPos[j * 3] = p.trailPos[(j - 1) * 3];
            p.trailPos[j * 3 + 1] = p.trailPos[(j - 1) * 3 + 1];
            p.trailPos[j * 3 + 2] = p.trailPos[(j - 1) * 3 + 2];
          }
          p.trailPos[0] = p.sprite.position.x;
          p.trailPos[1] = p.sprite.position.y;
          p.trailPos[2] = p.sprite.position.z;
          p.trail.geometry.attributes.position.needsUpdate = true;
          p.trail.material.opacity = p.life * 0.35;
        }
        
        if (p.life > 0) allDead = false;
      }
      
      if (fw.type === 'flash') {
        for (const sprite of fw.sprites) {
          sprite.material.opacity = fw.life;
          sprite.scale.multiplyScalar(1.08);
          fw.life -= fw.decay;
          if (fw.life > 0) allDead = false;
        }
      }
      
      if (allDead) {
        (fw.particles || []).forEach(p => {
          this.scene.remove(p.sprite);
          p.sprite.material.dispose();
          if (p.trail) {
            this.scene.remove(p.trail);
            p.trail.geometry.dispose();
            p.trail.material.dispose();
          }
        });
        (fw.sprites || []).forEach(s => {
          this.scene.remove(s);
          s.material.dispose();
        });
        this.activeFireworks.splice(i, 1);
      }
    }
  }

  start(duration = 0) { // 0 = vĩnh viễn
    this.isActive = true;
    // Lưu thời điểm bắt đầu để reset interval
    this.lastTick = Date.now();
    this.interval = setInterval(() => {
      // Kiểm tra tab có đang ẩn không - nếu có thì skip
      if (document.hidden) {
        return;
      }
      // Đảm bảo không có quá nhiều rocket đang bay (giới hạn 30)
      if (this.rockets.length > 30) {
        return;
      }
      // Đếm tổng particles đang active
      let totalParticles = 0;
      for (const fw of this.activeFireworks) {
        totalParticles += (fw.particles || []).length;
      }
      if (totalParticles > 1500) {
        return;
      }
      // Bắn 1-3 quả mỗi lần
      const count = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 1;
      for (let i = 0; i < count; i++) {
        this.launchRandom();
      }
    }, 600);
  }

  stop() {
    this.isActive = false;
    if (this.interval) clearInterval(this.interval);
  }
}

/* ============================================================================
   5. WEB AUDIO API
   ============================================================================ */
const birthdayNotes = [
  { f: 262, d: 0.5, t: 'Hap' }, { f: 262, d: 0.5, t: 'py' },
  { f: 294, d: 1.0, t: 'Birth' }, { f: 262, d: 1.0, t: 'day' },
  { f: 349, d: 1.0, t: 'To' }, { f: 330, d: 2.0, t: 'You ✨' },
  { f: 262, d: 0.5, t: 'Hap' }, { f: 262, d: 0.5, t: 'py' },
  { f: 294, d: 1.0, t: 'Birth' }, { f: 262, d: 1.0, t: 'day' },
  { f: 392, d: 1.0, t: 'To' }, { f: 349, d: 2.0, t: 'You 🌸' },
  { f: 262, d: 0.5, t: 'Hap' }, { f: 262, d: 0.5, t: 'py' },
  { f: 523, d: 1.0, t: 'Birth' }, { f: 440, d: 1.0, t: 'day' },
  { f: 349, d: 1.0, t: 'Nguyễn' }, { f: 330, d: 1.0, t: 'Lan' },
  { f: 294, d: 2.5, t: '20 Tuổi 🎂' }
];

const ribbonEl = document.getElementById('musical-ribbon');
const noteSpans = birthdayNotes.map((n) => {
  const s = document.createElement('span');
  s.className = 'lyric-span';
  s.textContent = n.t;
  ribbonEl.appendChild(s);
  return s;
});

let audioCtx = null;
let isPlayingMelody = false;

function initAudioContext() {
  if (audioCtx) return audioCtx;
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return null;
  audioCtx = new C();
  return audioCtx;
}

function playBirthdayMelody() {
  if (isPlayingMelody) return;
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  isPlayingMelody = true;
  let cursor = ctx.currentTime + 0.08;
  const tu = 0.28;
  birthdayNotes.forEach((note, idx) => {
    const dur = note.d * tu;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.f, cursor);
    gain.gain.setValueAtTime(0.001, cursor);
    gain.gain.exponentialRampToValueAtTime(0.22, cursor + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + dur - 0.02);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(cursor);
    osc.stop(cursor + dur);
    const delayMs = (cursor - ctx.currentTime) * 1000;
    setTimeout(() => {
      noteSpans[idx].classList.remove('jump');
      void noteSpans[idx].offsetWidth;
      noteSpans[idx].classList.add('jump');
    }, Math.max(0, delayMs));
    cursor += dur;
  });
  const totalMs = (cursor - ctx.currentTime) * 1000;
  setTimeout(() => { isPlayingMelody = false; }, totalMs);
}

/* ============================================================================
   6. SCENE 3D
   ============================================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05020a);
scene.fog = new THREE.FogExp2(0x090414, 0.018);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
// Góc nhìn rộng nhất - FOV 65, xa 22 đơn vị, cao 12.7 để có 30° từ trên xuống
// angle = atan2(12.7 - 2.5, 22) = atan2(10.2, 22) ≈ 24.85° (từ mặt phẳng ngang)
// Tính lại: muốn 30° từ trên xuống nghĩa là góc giữa camera-target và mặt ngang = 30°
// height_diff / distance = tan(30°) = 0.577
// distance = 22, height_diff = 22 × 0.577 = 12.7
// target.y = 2.5, camera.y = 2.5 + 12.7 = 15.2
camera.position.set(0, 15.2, 22);
camera.lookAt(0, 2.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1; // Tăng nhẹ từ 0.95
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
webglContainer.appendChild(renderer.domElement);

const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.35, 0.4, 0.55 // Bloom rất nhẹ - tránh chói bánh
);
const composer = new EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 + 0.05; // Giới hạn ~90° + 3°
controls.minDistance = 8;
controls.maxDistance = 30;
controls.target.set(0, 2.5, 0);
// Tự động xoay quanh bánh - tốc độ nhẹ nhàng
controls.autoRotate = true;
controls.autoRotateSpeed = 1.4; // Xoay nhanh hơn, vẫn nhẹ nhàng
// Khi user tương tác thì dừng xoay tạm thời
let userInteractTimeout = null;
controls.addEventListener('start', () => {
  controls.autoRotate = false;
  if (userInteractTimeout) clearTimeout(userInteractTimeout);
});
controls.addEventListener('end', () => {
  if (userInteractTimeout) clearTimeout(userInteractTimeout);
  userInteractTimeout = setTimeout(() => { controls.autoRotate = true; }, 4000);
});

const fireworks3D = new FireworksUltimate(scene);
const sparkleSystem = new SparkleSystem(scene, 350);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));

const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.3);
keyLight.position.set(8, 12, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffe0f0, 0.5);
fillLight.position.set(-8, 8, 5);
scene.add(fillLight);

const backLight = new THREE.DirectionalLight(0xd0e8ff, 0.45);
backLight.position.set(0, 4, -8);
scene.add(backLight);

const bottomFill = new THREE.PointLight(0xffd166, 1.0, 10);
bottomFill.position.set(0, 1.5, 4);
scene.add(bottomFill);

const candlePointLight = new THREE.PointLight(0xffaa44, 1.8, 10);
candlePointLight.position.set(0, 4.5, 0);
scene.add(candlePointLight);

const cakeRoot = new THREE.Group();
scene.add(cakeRoot);

/* ============================================================================
   7. 3 LOẠI BÁNH VỚI 20 NẾN
   ============================================================================ */
const matPedestal = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, roughness: 0.15, metalness: 0.05, transmission: 0.2, thickness: 0.5
});
const matGoldTrim = new THREE.MeshStandardMaterial({
  color: 0xffd166, roughness: 0.25, metalness: 0.85, 
  emissive: 0x2a1800, emissiveIntensity: 0.2
});
const matSilver = new THREE.MeshStandardMaterial({
  color: 0xe0e0e0, roughness: 0.2, metalness: 0.9,
  emissive: 0x111111, emissiveIntensity: 0.15
});

// 3 LOẠI BÁNH ĐẸP
const cakeThemes = [
  { 
    name: '🍓 Strawberry Dream', 
    sponge: 0xffb3c6, 
    frosting: 0xfff0f5, 
    accent: 0xff2a6d,
    candleColor: 0xff85b3
  },
  { 
    name: '🌈 Rainbow Delight', 
    sponge: [0xff6b6b, 0xffa06b, 0xffd166, 0x90EE90, 0x87CEEB, 0xDDA0DD],
    frosting: 0xfffaf0, 
    accent: 0xffd700,
    candleColor: 0xffd166
  },
  { 
    name: '🌟 Vanilla Elegant', 
    sponge: 0xfff8e7, 
    frosting: 0xffe4b5, 
    accent: 0xffd700,
    candleColor: 0xffe066
  }
];

let currentThemeIdx = 0;
let matTier1, matTier2, matTier3, matFrosting, matAccent;

function createMaterials(themeIdx) {
  const t = cakeThemes[themeIdx];
  if (Array.isArray(t.sponge)) {
    matTier1 = new THREE.MeshStandardMaterial({ color: t.sponge[0], roughness: 0.7, metalness: 0.02 });
    matTier2 = new THREE.MeshStandardMaterial({ color: t.sponge[2], roughness: 0.7, metalness: 0.02 });
    matTier3 = new THREE.MeshStandardMaterial({ color: t.sponge[4], roughness: 0.7, metalness: 0.02 });
  } else {
    matTier1 = new THREE.MeshStandardMaterial({ color: t.sponge, roughness: 0.7, metalness: 0.02 });
    matTier2 = new THREE.MeshStandardMaterial({ color: t.sponge, roughness: 0.7, metalness: 0.02 });
    matTier3 = new THREE.MeshStandardMaterial({ color: t.sponge, roughness: 0.7, metalness: 0.02 });
  }
  matFrosting = new THREE.MeshStandardMaterial({ color: t.frosting, roughness: 0.5, metalness: 0.01 });
  matAccent = new THREE.MeshStandardMaterial({ 
    color: t.accent, roughness: 0.5, metalness: 0.02
    // Bỏ emissive hoàn toàn
  });
}

function clearCake() {
  while(cakeRoot.children.length > 0) {
    const child = cakeRoot.children[0];
    if (child.geometry) child.geometry.dispose();
    cakeRoot.remove(child);
  }
}

// STRAWBERRY CAKE
function createStrawberryCake() {
  clearCake();
  createMaterials(0);
  
  // Đế bánh
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.5, 0.3, 64), matPedestal);
  plate.position.y = -0.15; plate.receiveShadow = true;
  cakeRoot.add(plate);
  
  // Viền vàng
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.1, 16, 100), matGoldTrim);
  goldRing.rotation.x = Math.PI / 2; goldRing.position.y = 0.0;
  cakeRoot.add(goldRing);
  
  // Tầng 1 (đáy)
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1.8, 64), matTier1);
  tier1.position.y = 0.9; tier1.castShadow = true; tier1.receiveShadow = true;
  cakeRoot.add(tier1);
  
  // Frosting tầng 1
  const frost1 = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.25, 0.25, 64), matFrosting);
  frost1.position.y = 1.92; cakeRoot.add(frost1);
  
  // Drip frosting tầng 1
  for (let i = 0; i < 50; i++) {
    const theta = (i / 50) * Math.PI * 2;
    const dripLen = 0.4 + 0.25 * Math.sin(i * 4) + 0.15 * Math.cos(i * 6);
    const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, dripLen, 12), matFrosting);
    drip.position.set(Math.cos(theta) * 3.18, 1.79 - dripLen/2, Math.sin(theta) * 3.18);
    cakeRoot.add(drip);
  }
  
  // Hoa hồng tầng 1
  for (let i = 0; i < 35; i++) {
    const a = (i / 35) * Math.PI * 2;
    const rose = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), matFrosting);
    rose.scale.set(1, 0.6, 1);
    rose.position.set(Math.cos(a) * 3.3, 0.15, Math.sin(a) * 3.3);
    cakeRoot.add(rose);
  }
  
  // Tầng 2 (giữa)
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 1.5, 64), matTier2);
  tier2.position.y = 2.8; tier2.castShadow = true; tier2.receiveShadow = true;
  cakeRoot.add(tier2);
  
  // Frosting tầng 2
  const frost2 = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.22, 64), matFrosting);
  frost2.position.y = 3.66; cakeRoot.add(frost2);
  
  // Dâu tây trang trí tầng 2
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = 1.9;
    const cream = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.08, 12, 24), matFrosting);
    cream.rotation.x = Math.PI / 2;
    cream.position.set(Math.cos(angle) * r, 3.78, Math.sin(angle) * r);
    cakeRoot.add(cream);
    
    const berryGeo = new THREE.SphereGeometry(0.22, 20, 20);
    const posAttr = berryGeo.attributes.position;
    for (let j = 0; j < posAttr.count; j++) {
      let x = posAttr.getX(j), y = posAttr.getY(j), z = posAttr.getZ(j);
      if (y > 0) {
        const factor = 1.0 - (y / 0.22) * 0.4;
        x *= factor; z *= factor; y *= 1.3;
      }
      posAttr.setXYZ(j, x, y, z);
    }
    berryGeo.computeVertexNormals();
    const berry = new THREE.Mesh(berryGeo, matAccent);
    berry.position.set(Math.cos(angle) * r, 3.98, Math.sin(angle) * r);
    cakeRoot.add(berry);
  }
  
  // Tầng 3 (trên)
  const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.2, 64), matTier3);
  tier3.position.y = 4.55; tier3.castShadow = true; tier3.receiveShadow = true;
  cakeRoot.add(tier3);
  
  // Frosting tầng 3
  const frost3 = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.2, 64), matFrosting);
  frost3.position.y = 5.26; cakeRoot.add(frost3);
  
  // Hoa trên cùng
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), matGoldTrim);
    leaf.scale.set(1.5, 0.4, 1);
    leaf.position.set(Math.cos(angle) * 1.15, 5.36, Math.sin(angle) * 1.15);
    cakeRoot.add(leaf);
  }
  
  const flowerCenter = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24), matAccent);
  flowerCenter.position.y = 5.45; cakeRoot.add(flowerCenter);
}

// RAINBOW LAYER CAKE
function createRainbowCake() {
  clearCake();
  createMaterials(1);
  const t = cakeThemes[1];
  
  // Đế bánh
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 3.7, 0.35, 64), matPedestal);
  plate.position.y = -0.175; plate.receiveShadow = true;
  cakeRoot.add(plate);
  
  // Viền bạc
  const silverRing = new THREE.Mesh(new THREE.TorusGeometry(3.85, 0.12, 16, 100), matSilver);
  silverRing.rotation.x = Math.PI / 2; silverRing.position.y = 0.0;
  cakeRoot.add(silverRing);
  
  // 6 tầng cầu vồng
  const rainbowColors = t.sponge;
  const tierHeights = [1.5, 1.3, 1.1, 0.9, 0.7, 0.5];
  const tierRadii = [3.4, 2.9, 2.4, 1.9, 1.4, 0.9];
  let currentY = 0.175;
  
  for (let i = 0; i < 6; i++) {
    const tierMat = new THREE.MeshStandardMaterial({ 
      color: rainbowColors[i], roughness: 0.5, metalness: 0.05 
    });
    const tier = new THREE.Mesh(
      new THREE.CylinderGeometry(tierRadii[i], tierRadii[i] + 0.1, tierHeights[i], 64),
      tierMat
    );
    tier.position.y = currentY + tierHeights[i] / 2;
    tier.castShadow = true; tier.receiveShadow = true;
    cakeRoot.add(tier);
    
    // Frosting giữa các tầng
    if (i < 5) {
      const frost = new THREE.Mesh(
        new THREE.CylinderGeometry(tierRadii[i] + 0.05, tierRadii[i] + 0.05, 0.15, 64),
        matFrosting
      );
      frost.position.y = currentY + tierHeights[i] + 0.075;
      cakeRoot.add(frost);
    }
    
    currentY += tierHeights[i] + 0.15;
  }
  
  // Frosting trên cùng
  const topFrost = new THREE.Mesh(
    new THREE.CylinderGeometry(tierRadii[5] + 0.05, tierRadii[5] + 0.05, 0.18, 64),
    matFrosting
  );
  topFrost.position.y = currentY + 0.09;
  cakeRoot.add(topFrost);
  
  // Điểm nhấn trên cùng - ngôi sao vàng
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.2, 0),
      matAccent
    );
    star.position.set(Math.cos(angle) * 0.6, currentY + 0.5, Math.sin(angle) * 0.6);
    star.rotation.y = angle;
    cakeRoot.add(star);
  }
  
  const centerStar = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.35, 0),
    matAccent
  );
  centerStar.position.y = currentY + 0.7;
  centerStar.rotation.z = Math.PI / 4;
  cakeRoot.add(centerStar);
}

// VANILLA ELEGANT CAKE
function createVanillaCake() {
  clearCake();
  createMaterials(2);
  
  // Đế bánh
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 3.3, 0.3, 64),
    new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, roughness: 0.1, metalness: 0.05, 
      transmission: 0.35, thickness: 0.5 
    })
  );
  plate.position.y = -0.15; plate.receiveShadow = true;
  cakeRoot.add(plate);
  
  // Viền vàng
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.1, 16, 100), matGoldTrim);
  goldRing.rotation.x = Math.PI / 2; goldRing.position.y = 0.0;
  cakeRoot.add(goldRing);
  
  // Tầng 1
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 1.6, 64), matTier1);
  tier1.position.y = 0.8; tier1.castShadow = true; tier1.receiveShadow = true;
  cakeRoot.add(tier1);
  
  const frost1 = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.05, 0.2, 64), matFrosting);
  frost1.position.y = 1.7; cakeRoot.add(frost1);
  
  // Hoa vanilla tầng 1
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), matGoldTrim);
    petal.scale.set(1.8, 0.5, 1);
    petal.position.set(Math.cos(angle) * 3.1, 0.12, Math.sin(angle) * 3.1);
    cakeRoot.add(petal);
  }
  
  // Tầng 2
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 1.4, 64), matTier2);
  tier2.position.y = 2.5; tier2.castShadow = true; tier2.receiveShadow = true;
  cakeRoot.add(tier2);
  
  const frost2 = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.18, 64), matFrosting);
  frost2.position.y = 3.29; cakeRoot.add(frost2);
  
  // Tầng 3
  const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.0, 64), matTier3);
  tier3.position.y = 4.24; tier3.castShadow = true; tier3.receiveShadow = true;
  cakeRoot.add(tier3);
  
  const frost3 = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.15, 64), matFrosting);
  frost3.position.y = 4.82; cakeRoot.add(frost3);
  
  // Hoa hồng trên cùng
  const flowerCenter = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), matGoldTrim);
  flowerCenter.position.y = 5.0; cakeRoot.add(flowerCenter);
  
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), matFrosting);
    petal.scale.set(1.3, 0.3, 0.7);
    petal.position.set(Math.cos(angle) * 0.5, 5.0, Math.sin(angle) * 0.5);
    petal.rotation.y = angle;
    cakeRoot.add(petal);
  }
}

function buildCake(themeIdx) {
  switch(themeIdx) {
    case 0: createStrawberryCake(); break;
    case 1: createRainbowCake(); break;
    case 2: createVanillaCake(); break;
  }
  const titleEl = document.getElementById('cake-title');
  if (titleEl) titleEl.textContent = cakeThemes[themeIdx].name + ' • Sweet 20th Birthday 🎂';
}

buildCake(0);

/* ============================================================================
   8. NGỌN LỬA NẾN - 20 NẾN
   ============================================================================ */
const flameVertexShader = `
  uniform float uTime;
  varying float vElevation;
  void main() {
    vec3 pos = position;
    float heightFactor = clamp((pos.y + 1.0) * 0.5, 0.0, 1.0);
    vElevation = heightFactor;
    float taper = sin(heightFactor * 3.14159265);
    pos.x *= taper * 0.5;
    pos.z *= taper * 0.5;
    pos.y *= 1.4;
    pos.x += sin(uTime * 7.5 + heightFactor * 4.0) * 0.1 * pow(heightFactor, 1.6);
    pos.z += cos(uTime * 6.2 + heightFactor * 3.5) * 0.08 * pow(heightFactor, 1.6);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const flameFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  varying float vElevation;
  void main() {
    vec3 blueBase = vec3(0.2, 0.5, 1.0);
    vec3 coreWhiteYellow = vec3(1.0, 0.95, 0.8);
    vec3 outerOrangeRed = vec3(1.0, 0.4, 0.1);
    float flicker = 0.92 + 0.08 * sin(uTime * 18.0 + vElevation * 6.0);
    vec3 col = mix(blueBase, coreWhiteYellow, smoothstep(0.0, 0.35, vElevation));
    col = mix(col, outerOrangeRed, smoothstep(0.45, 0.95, vElevation));
    col *= flicker * 1.5;
    float alpha = sin(vElevation * 3.14159265) * uOpacity;
    gl_FragColor = vec4(col, alpha);
  }
`;

const flameUniforms = { uTime: { value: 0 }, uOpacity: { value: 1.0 } };
const flameShaderMat = new THREE.ShaderMaterial({
  vertexShader: flameVertexShader,
  fragmentShader: flameFragmentShader,
  uniforms: flameUniforms,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide
});

const candleFlames = [];

function createCandle(x, z, baseY, height, color) {
  const candleGroup = new THREE.Group();
  candleGroup.position.set(x, baseY, z);
  
  const waxMat = new THREE.MeshStandardMaterial({
    color: color, roughness: 0.3, emissive: 0x110804, emissiveIntensity: 0.15
  });
  const waxMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, height, 20), waxMat);
  waxMesh.position.y = height / 2;
  candleGroup.add(waxMesh);
  
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.012, 8, 20), matGoldTrim);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = height * 0.75;
  candleGroup.add(ring);
  
  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  wick.position.y = height + 0.04;
  candleGroup.add(wick);
  
  const flameMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 28, 28), flameShaderMat);
  flameMesh.position.y = height + 0.2;
  candleGroup.add(flameMesh);
  candleFlames.push(flameMesh);
  cakeRoot.add(candleGroup);
}

function createCandles() {
  candleFlames.length = 0;
  const t = cakeThemes[currentThemeIdx];
  const candleColor = t.candleColor;
  
  // BaseY cho từng loại bánh - trên mặt tầng trên cùng
  let baseY;
  if (currentThemeIdx === 0) {
    // Strawberry: tầng 3 trên cùng cao 4.55-5.26
    baseY = 5.0;
  } else if (currentThemeIdx === 1) {
    // Rainbow: cắm nến trên TẦNG 5 (rộng 1.4) thay vì tầng 6 (chỉ 0.9)
    // Tầng 5 cao: 0.175 + 1.5 + 0.15 + 1.3 + 0.15 + 1.1 + 0.15 + 0.9 + 0.15 = 5.575
    baseY = 5.45;
  } else {
    // Vanilla: tầng 3 cao 4.24-4.82
    baseY = 4.6;
  }
  
  // 20 nến cắm đều - chia 2 vòng
  // Vòng ngoài: 12 nến (bán kính lớn)
  // Vòng trong: 8 nến (bán kính nhỏ)
  
  // Bán kính khác nhau theo tầng - đảm bảo không trượt khỏi tầng
  let outerRadius, innerRadius;
  if (currentThemeIdx === 0) {
    // Strawberry: tầng 3 rộng 1.4 → radius 1.2 OK
    outerRadius = 1.2; innerRadius = 0.6;
  } else if (currentThemeIdx === 1) {
    // Rainbow: tầng 5 rộng 1.4 → radius 0.7 trong đường kính nhưng ở góc trượt
    // Dùng radius nhỏ để chắc chắn nằm trên tầng
    outerRadius = 0.6; innerRadius = 0.25;
  } else {
    // Vanilla: tầng 3 rộng 1.2 → radius 1.0 OK
    outerRadius = 1.0; innerRadius = 0.5;
  }
  
  // Màu nến đa dạng
  const colors = [0xff6b6b, 0xffa06b, 0xffd166, 0x90EE90, 0x87CEEB, 0xDDA0DD, 0xffffff, 0xff85b3];
  
  // Vòng ngoài - 12 nến
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const color = colors[i % colors.length];
    const height = 0.7 + (i % 3) * 0.1;
    createCandle(
      Math.cos(angle) * outerRadius,
      Math.sin(angle) * outerRadius,
      baseY,
      height,
      color
    );
  }
  
  // Vòng trong - 8 nến
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const color = colors[(i + 4) % colors.length];
    const height = 0.6 + (i % 3) * 0.1;
    createCandle(
      Math.cos(angle) * innerRadius,
      Math.sin(angle) * innerRadius,
      baseY,
      height,
      color
    );
  }
}
createCandles();

/* ============================================================================
   9. TƯƠNG TÁC
   ============================================================================ */
let candlesLit = true;
let blowCooldown = false; // Ngăn tắt nến liên tục
const btnBlow = document.getElementById('btn-blow-candles');
const btnRelight = document.getElementById('btn-relight-candles');

function blowOutCandles() {
  if (!candlesLit || blowCooldown) return;
  blowCooldown = true;
  setTimeout(() => blowCooldown = false, 3000); // Cooldown 3s
  candlesLit = false;
  btnBlow.style.display = 'none';
  btnRelight.style.display = 'inline-flex';
  fireworks3D.launchCelebration();
  playBirthdayMelody();
}

function relightCandles() {
  if (candlesLit) return;
  candlesLit = true;
  blowCooldown = true; // Khi bật lại, ngăn mic thổi ngay
  setTimeout(() => blowCooldown = false, 5000); // Cho 5s ổn định
  // Set opacity về 1 NGAY LẬP TỨC - không lerp chậm
  flameUniforms.uOpacity.value = 1.0;
  btnBlow.style.display = 'inline-flex';
  btnRelight.style.display = 'none';
}

btnBlow.addEventListener('click', blowOutCandles);
btnRelight.addEventListener('click', relightCandles);

document.getElementById('btn-preset-theme').addEventListener('click', () => {
  currentThemeIdx = (currentThemeIdx + 1) % 3;
  buildCake(currentThemeIdx);
  createCandles();
  // Reset flame opacity khi đổi bánh
  flameUniforms.uOpacity.value = candlesLit ? 1.0 : 0.0;
});

// Đã bỏ hoàn toàn microphone - chỉ thổi nến qua nút
// micInitialized = false;

document.getElementById('btn-replay-music').addEventListener('click', () => playBirthdayMelody());
ribbonEl.addEventListener('click', () => playBirthdayMelody());

document.getElementById('btn-to-stage-3').addEventListener('click', () => {
  playBirthdayMelody();
  stage2El.classList.add('stage-hidden');
  stage3UiEl.classList.remove('stage-hidden');
  webglContainer.classList.add('active');
  // Đã bỏ mic - không gọi initMicrophoneBlowDetector
  fireworks3D.start(0); // 0 = vĩnh viễn
});

document.getElementById('btn-back-wishes').addEventListener('click', () => {
  stage3UiEl.classList.add('stage-hidden');
  webglContainer.classList.remove('active');
  stage2El.classList.remove('stage-hidden');
  fireworks3D.stop();
});

/* ============================================================================
   9.5. HỆ THỐNG ẢNH KỶ NIỆM 3D - KHUNG VÀNG KIM, BAY XUNG QUANH
   ============================================================================ */

// === CONFIG - Bán kính xa, khung to gấp đôi, xoay đồng bộ camera ===
const PHOTO_CONFIG = {
  radius: 28,           // Bán kính xa hơn nữa (cũ 22)
  height: 3,            // Thấp bằng bánh sinh nhật (cũ 7 - quá cao)
  frameWidth: 8.4,      // Khung TO GẤP ĐÔI (cũ 4.2) - ảnh ÍT
  frameHeight: 8.4,     // Khung vuông to gấp đôi (cũ 4.2) - ảnh ÍT
  minFrameSize: 4.5,    // Kích thước tối thiểu khi nhiều ảnh
  maxFrameSize: 9.5,    // Kích thước tối đa khi rất ít ảnh
  ringTilt: 0.25,       // Nghiêng vòng tròn nhẹ
  floatAmplitude: 0.5,  // Biên độ bay lơ lửng
  floatSpeed: 0.8,      // Tốc độ bay lơ lửng
  // Tốc độ ảnh xoay: dùng autoRotateSpeed 1.4 (đơn vị OrbitControls)
  // OrbitControls.autoRotateSpeed = 1.4 ≈ 30s/vòng ≈ 0.21 rad/s
  // Ảnh sẽ xoay theo góc nhìn camera (xem updatePhotoSystem)
  rotateSpeed: 1.4,
  minPhotos: 5,
  maxPhotos: 20,
  defaultCount: 8       // Số ảnh mặc định
};

// Tính kích thước khung dựa trên số lượng ảnh
// Ít ảnh → khung to; Nhiều ảnh → khung nhỏ (tránh đè nhau)
function calculateFrameSize(count) {
  const cfg = PHOTO_CONFIG;
  // Chu vi vòng tròn = 2πR, mỗi ảnh cần "đoạn" vừa đủ
  const circumference = 2 * Math.PI * cfg.radius;
  // Khoảng cách giữa 2 khung kề nhau (mỗi khung chiếm angle = 2π/count)
  const arcLength = circumference / count;
  // Kích thước khung = arcLength × 0.85 (để có khe hở 15%)
  const fitSize = arcLength * 0.85;
  // Kẹp trong [minFrameSize, maxFrameSize]
  return Math.max(cfg.minFrameSize, Math.min(cfg.maxFrameSize, fitSize));
}

const photoSystem = {
  frames: [],
  photos: [],
  group: null,
  placeholderTextures: [],
  defaultRingAngle: 0,
  defaultAngleOffset: 0      // Cho phép xoay vòng liên tục
};

// Group chứa tất cả khung - xa hơn cakeRoot
photoSystem.group = new THREE.Group();
photoSystem.group.position.y = 0;
scene.add(photoSystem.group);

// --- Tạo texture placeholder sang trọng ---
function createPhotoPlaceholder(text, accentColor) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const x2d = c.getContext('2d');
  // Gradient nền dọc - tone ngà vàng ấm
  const g = x2d.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, accentColor);
  g.addColorStop(0.5, '#ffe6f0');
  g.addColorStop(1, accentColor);
  x2d.fillStyle = g;
  x2d.fillRect(0, 0, 512, 512);
  // Viền vàng kim bên trong
  x2d.strokeStyle = '#d4af37';
  x2d.lineWidth = 8;
  x2d.strokeRect(24, 24, 464, 464);
  // Viền trang trí nhỏ
  x2d.strokeStyle = '#ffffff80';
  x2d.lineWidth = 2;
  x2d.strokeRect(40, 40, 432, 432);
  // Text/emoji
  x2d.fillStyle = '#ffffff';
  x2d.font = 'bold 90px "Dancing Script", cursive, sans-serif';
  x2d.textAlign = 'center';
  x2d.textBaseline = 'middle';
  x2d.shadowColor = 'rgba(0,0,0,0.4)';
  x2d.shadowBlur = 12;
  x2d.shadowOffsetY = 4;
  x2d.fillText(text, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// --- Cache placeholder textures ---
function getPlaceholderTextures() {
  if (photoSystem.placeholderTextures.length) return photoSystem.placeholderTextures;
  const captions = ['💖 Ngày 1', '🌸 Hè về', '✨ Kỷ niệm', '🎀 Bên nhau',
                    '🦋 Bay cao', '🌟 Ước mơ', '💕 Mãi mãi', '🌷 Tươi đẹp',
                    '💗 Yêu thương', '🌺 Rạch nắng', '☀️ Ngày đẹp', '🎂 Sinh nhật',
                    '🎉 Happy', '🌈 Cầu vồng', '🍀 May mắn', '🦄 Độc đáo',
                    '🌙 Đêm', '⭐ Ngôi sao', '🎶 Âm nhạc', '📸 Khoảnh khắc'];
  const accents = ['#ff85b3', '#e84a8a', '#ff6b9d', '#ff9ec7', '#f7a8c4',
                   '#d4af37', '#ffd700', '#ffaa66', '#ff7f50', '#ff6347'];
  for (let i = 0; i < PHOTO_CONFIG.maxPhotos; i++) {
    photoSystem.placeholderTextures.push(
      createPhotoPlaceholder(captions[i] || `Kỷ niệm ${i+1}`, accents[i % accents.length])
    );
  }
  return photoSystem.placeholderTextures;
}

// --- Tạo 1 khung ảnh 3D với hiệu ứng động ---
function createPhotoFrame(index, total, photoTexture) {
  const cfg = PHOTO_CONFIG;
  const group = new THREE.Group();
  const angle = (index / total) * Math.PI * 2;
  const x = Math.cos(angle) * cfg.radius;
  const z = Math.sin(angle) * cfg.radius;
  group.position.set(x, cfg.height, z);

  // Tính kích thước khung động dựa trên tổng số ảnh
  const dynamicSize = calculateFrameSize(total);
  const fw = dynamicSize, fh = dynamicSize;

  // Mặt khung hướng về tâm
  group.lookAt(0, cfg.height, 0);
  group.rotation.y += Math.PI;

  // Nghiêng khung cho sinh điên (chỉ nghiêng X và Z nhẹ)
  group.rotation.x = -cfg.ringTilt * Math.cos(angle);
  group.rotation.z = cfg.ringTilt * Math.sin(angle);

  const fw = cfg.frameWidth, fh = cfg.frameHeight;
  const frameDepth = 0.22;

  // 1. Viền ngoài - vàng kim kim loại
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xffd700, metalness: 0.95, roughness: 0.18,
    emissive: 0xff8c00, emissiveIntensity: 0.15
  });
  // Thanh viền (4 cạnh)
  const top = new THREE.Mesh(new THREE.BoxGeometry(fw + 0.32, 0.28, frameDepth), frameMat);
  top.position.y = fh/2 + 0.10;
  group.add(top);
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(fw + 0.32, 0.28, frameDepth), frameMat);
  bottom.position.y = -fh/2 - 0.10;
  group.add(bottom);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.28, fh + 0.6, frameDepth), frameMat);
  left.position.x = -fw/2 - 0.10;
  group.add(left);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.28, fh + 0.6, frameDepth), frameMat);
  right.position.x = fw/2 + 0.10;
  group.add(right);

  // 2. Background đen sang trọng
  const bgMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a, roughness: 0.5, metalness: 0.1
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), bgMat);
  bg.position.z = -0.06;
  group.add(bg);

  // 3. Mặt ảnh - emissive nhẹ cho sáng
  const photoMat = new THREE.MeshStandardMaterial({
    map: photoTexture, roughness: 0.4, metalness: 0.0,
    emissive: 0xffffff, emissiveMap: photoTexture, emissiveIntensity: 0.08
  });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), photoMat);
  photo.position.z = 0.0;
  group.add(photo);

  // 4. Mặt kính trong suốt - có phản chiếu
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transparent: true, opacity: 0.12,
    roughness: 0.05, metalness: 0.0, transmission: 0.5, ior: 1.5,
    clearcoat: 1.0, clearcoatRoughness: 0.0, thickness: 0.1
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), glassMat);
  glass.position.z = 0.08;
  group.add(glass);

  // 5. 4 góc kim cương nhỏ - vàng kim lấp lánh
  const cornerMat = new THREE.MeshStandardMaterial({
    color: 0xffec80, metalness: 1.0, roughness: 0.1,
    emissive: 0xffd700, emissiveIntensity: 0.5
  });
  const cornerSize = 0.18;
  [
    { x: fw/2 + 0.12, y: fh/2 + 0.12 },
    { x: -fw/2 - 0.12, y: fh/2 + 0.12 },
    { x: fw/2 + 0.12, y: -fh/2 - 0.12 },
    { x: -fw/2 - 0.12, y: -fh/2 - 0.12 }
  ].forEach(c => {
    const corner = new THREE.Mesh(
      new THREE.OctahedronGeometry(cornerSize, 0), cornerMat
    );
    corner.position.set(c.x, c.y, frameDepth/2);
    corner.userData.spin = Math.random() * Math.PI * 2;
    corner.userData.spinSpeed = 0.5 + Math.random() * 0.5;
    group.add(corner);
  });

  // 6. Đèn LED chiếu ảnh (ánh sáng vàng ấm)
  const led = new THREE.PointLight(0xffd166, 1.2, 6, 2);
  led.position.z = 2.0;
  led.position.y = 0.5;
  group.add(led);

  // 7. Đèn LED nhỏ ở 4 góc (trang trí)
  [
    [fw/2, fh/2], [-fw/2, fh/2], [fw/2, -fh/2], [-fw/2, -fh/2]
  ].forEach(p => {
    const spot = new THREE.PointLight(0xfff0c0, 0.3, 2, 2);
    spot.position.set(p[0], p[1], frameDepth + 0.1);
    group.add(spot);
  });

  // === ANIMATION STATE ===
  // Lưu thông tin để update trong animate()
  group.userData = {
    index, angle, photo, glass, photoMat,
    basePosY: cfg.height,
    floatPhase: index * 0.7,           // Pha riêng cho mỗi khung
    floatSpeed: 0.5 + Math.random() * 0.4,
    floatAmplitude: 0.3 + Math.random() * 0.3,
    swayPhase: index * 1.3,
    swayAmplitude: 0.04,
    led, ledPulsePhase: index,
    cornerSpinPhase: []
  };

  // Lưu phase cho 4 góc để xoay độc lập
  group.children.forEach(child => {
    if (child.userData && child.userData.spin !== undefined) {
      group.userData.cornerSpinPhase.push({
        spin: child.userData.spin,
        spinSpeed: child.userData.spinSpeed
      });
    }
  });

  return group;
}

// --- Sắp xếp ảnh theo vòng tròn ---
function layoutPhotos() {
  // Xóa khung cũ
  photoSystem.frames.forEach(f => photoSystem.group.remove(f));
  photoSystem.frames = [];

  const total = photoSystem.photos.length;
  if (total < PHOTO_CONFIG.minPhotos || total > PHOTO_CONFIG.maxPhotos) return;

  for (let i = 0; i < total; i++) {
    const frame = createPhotoFrame(i, total, photoSystem.photos[i]);
    photoSystem.frames.push(frame);
    photoSystem.group.add(frame);
  }
}

// --- Update animation cho photos mỗi frame ---
function updatePhotoSystem(elapsed) {
  if (photoSystem.frames.length === 0) return;

  const cfg = PHOTO_CONFIG;

  // Xoay vòng tròn ảnh THEO GÓC NHÌN CAMERA
  // Lấy azimuth = góc camera xoay quanh target trên mặt phẳng XZ
  // OrbitControls.autoRotateSpeed = 1.4 → ~0.21 rad/s
  // Công thức OrbitControls: rotation per frame = (autoRotateSpeed * 2π) / (60 * 30) ≈ speed * 0.0035
  // Nhưng đơn giản nhất: xoay ảnh theo góc camera hiện tại
  const camPos = camera.position;
  const target = controls.target;
  const dx = camPos.x - target.x;
  const dz = camPos.z - target.z;
  const cameraAzimuth = Math.atan2(dx, dz);  // góc camera nhìn về target
  // Ảnh xoay NGƯỢC chiều camera để khi camera xoay phải thì ảnh chạy theo
  photoSystem.group.rotation.y = -cameraAzimuth;

  // Animate từng khung
  photoSystem.frames.forEach((frame) => {
    const u = frame.userData;

    // 1. Bay lơ lửng (lên xuống nhẹ)
    const floatY = Math.sin(elapsed * u.floatSpeed + u.floatPhase) * u.floatAmplitude;
    frame.position.y = u.basePosY + floatY;

    // 2. Lắc lư (sway) nhẹ quanh góc nghiêng
    const swayX = Math.sin(elapsed * 0.6 + u.swayPhase) * u.swayAmplitude;
    const swayZ = Math.cos(elapsed * 0.5 + u.swayPhase) * u.swayAmplitude;
    frame.rotation.x = -cfg.ringTilt * Math.cos(u.angle) + swayX;
    frame.rotation.z = cfg.ringTilt * Math.sin(u.angle) + swayZ;

    // 3. LED nhấp nháy
    if (u.led) {
      u.led.intensity = 0.8 + 0.6 * Math.sin(elapsed * 2.5 + u.ledPulsePhase);
    }

    // 4. Billboard: khung luôn hướng về camera
    const framePos = frame.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3().subVectors(camPos, framePos).normalize();
    const lookTarget = new THREE.Vector3(
      framePos.x + dir.x,
      framePos.y,
      framePos.z + dir.z
    );
    frame.lookAt(lookTarget);
  });
}

// === Tạo ảnh mặc định ngay khi load ===
function initDefaultPhotos() {
  const placeholders = getPlaceholderTextures();
  photoSystem.photos = placeholders.slice(0, PHOTO_CONFIG.defaultCount);
  layoutPhotos();
}

initDefaultPhotos();

// === Xử lý upload ảnh từ input - TỐI ƯU BẰNG CANVAS + COVER ===
const MAX_TEXTURE_SIZE = 768;       // Resize ảnh về max 768x768 cho 3D - nét hơn
const JPEG_QUALITY = 0.88;          // Nén JPEG 88% - đẹp và rõ nét

// Đọc file thành HTMLImageElement
function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Resize + COVER ảnh về kích thước vuông, giữ tỷ lệ - cắt phần thừa
function processImageToCanvas(image, targetSize = MAX_TEXTURE_SIZE) {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  const imgW = image.width;
  const imgH = image.height;
  // Tính tỷ lệ để "cover" (lấp đầy khung, cắt phần thừa)
  const scale = Math.max(targetSize / imgW, targetSize / imgH);
  const newW = imgW * scale;
  const newH = imgH * scale;
  // Cắt chính giữa
  const offsetX = (targetSize - newW) / 2;
  const offsetY = (targetSize - newH) / 2;

  // Vẽ nền đen (tránh viền trắng nếu ảnh trong suốt)
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, targetSize, targetSize);
  // Vẽ ảnh đã resize, smooth
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, offsetX, offsetY, newW, newH);

  return canvas;
}

// Tạo Texture từ canvas đã xử lý - không kéo giãn, BẬT mipmaps cho nét
function canvasToTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter; // Mipmaps cho xa rõ nét
  tex.magFilter = THREE.LinearFilter;             // Mượt khi gần
  tex.anisotropy = 4;                              // Anti-aliasing góc nhìn xiên
  tex.generateMipmaps = true;                      // Bật mipmaps
  tex.needsUpdate = true;
  return tex;
}

// Giải phóng texture cũ trước khi thay mới - tránh leak GPU
function disposeTexture(tex) {
  if (tex && tex.dispose) tex.dispose();
}

// Event handler upload ảnh - tối ưu cho 3D
const photoUpload = document.getElementById('photo-upload');
if (photoUpload) {
  photoUpload.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (files.length < PHOTO_CONFIG.minPhotos) {
      alert(`Cần tối thiểu ${PHOTO_CONFIG.minPhotos} ảnh! Bạn chỉ chọn ${files.length} ảnh.`);
      e.target.value = '';
      return;
    }
    if (files.length > PHOTO_CONFIG.maxPhotos) {
      alert(`Tối đa ${PHOTO_CONFIG.maxPhotos} ảnh! Lấy 20 ảnh đầu.`);
    }
    const limitedFiles = files.slice(0, PHOTO_CONFIG.maxPhotos);

    // Disable nút input trong khi xử lý
    photoUpload.disabled = true;

    // Giải phóng texture cũ
    photoSystem.photos.forEach(disposeTexture);

    // Khởi tạo mảng mới
    const newPhotos = [];
    const placeholders = getPlaceholderTextures();

    // Hiện thị progress trên button
    const originalLabel = photoUpload.parentElement
      ? photoUpload.parentElement.querySelector('label').textContent
      : '📷 Thêm Ảnh';

    // Xử lý TỪNG ảnh 1 - tránh kẹt UI
    for (let i = 0; i < limitedFiles.length; i++) {
      try {
        // Cập nhật label hiển thị tiến trình
        const labelEl = photoUpload.parentElement
          ? photoUpload.parentElement.querySelector('label')
          : null;
        if (labelEl) labelEl.textContent = `⏳ ${i + 1}/${limitedFiles.length}`;

        // 1. Đọc file → HTMLImageElement
        const img = await readFileAsImage(limitedFiles[i]);

        // 2. Resize + COVER → Canvas 512x512
        const canvas = processImageToCanvas(img, MAX_TEXTURE_SIZE);

        // 3. Canvas → THREE.Texture
        const tex = canvasToTexture(canvas);

        newPhotos.push(tex);

        // 4. Yield cho browser - giải phóng event loop
        await new Promise(r => setTimeout(r, 0));
      } catch (err) {
        console.warn('Ảnh lỗi, dùng placeholder:', err);
        newPhotos.push(placeholders[i % placeholders.length]);
      }
    }

    // Pad với placeholder nếu < minPhotos
    while (newPhotos.length < PHOTO_CONFIG.minPhotos) {
      newPhotos.push(placeholders[newPhotos.length % placeholders.length]);
    }

    // Cập nhật hệ thống
    photoSystem.photos = newPhotos;
    layoutPhotos();

    // Reset label & value
    const labelEl = photoUpload.parentElement
      ? photoUpload.parentElement.querySelector('label')
      : null;
    if (labelEl) labelEl.textContent = originalLabel;
    e.target.value = '';
    photoUpload.disabled = false;
    console.log(`Đã tải ${newPhotos.length} ảnh (đã resize ${MAX_TEXTURE_SIZE}x${MAX_TEXTURE_SIZE})`);
  });
}

// Nút toggle ẩn/hiện ảnh
const btnTogglePhotos = document.getElementById('btn-toggle-photos');
if (btnTogglePhotos) {
  btnTogglePhotos.addEventListener('click', () => {
    photoSystem.group.visible = !photoSystem.group.visible;
    btnTogglePhotos.textContent = photoSystem.group.visible
      ? '🖼️ Ẩn Ảnh Kỷ Niệm'
      : '🖼️ Hiện Ảnh Kỷ Niệm';
  });
}

/* ============================================================================
   10. ANIMATION LOOP
   ============================================================================ */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  flameUniforms.uTime.value = elapsed;
  
  // Lerp opacity NHANH HƠN - không chờ 1s
  const targetOpacity = candlesLit ? 1.0 : 0.0;
  // Tốc độ lerp 0.3 thay vì 0.08
  flameUniforms.uOpacity.value += (targetOpacity - flameUniforms.uOpacity.value) * 0.3;
  // Snap về 0 hoặc 1 khi rất gần (tránh trôi nổi)
  if (flameUniforms.uOpacity.value > 0.99) flameUniforms.uOpacity.value = 1.0;
  if (flameUniforms.uOpacity.value < 0.01) flameUniforms.uOpacity.value = 0.0;

  if (candlesLit) {
    candlePointLight.intensity = 1.5 + Math.sin(elapsed * 14) * 0.3 + Math.cos(elapsed * 23) * 0.2;
  } else {
    candlePointLight.intensity += (0.3 - candlePointLight.intensity) * 0.05;
  }

  cakeRoot.rotation.y = Math.sin(elapsed * 0.2) * 0.15;
  
  sparkleSystem.update(elapsed);
  fireworks3D.update();
  updatePhotoSystem(elapsed);

  controls.update();
  composer.render();
}
animate();

setTimeout(() => {
  stage1El.classList.add('stage-hidden');
  stage2El.classList.remove('stage-hidden');
  playBirthdayMelody();
}, 3000);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

/* ============================================================================
   11. PAGE VISIBILITY - PAUSE PHÁO HOA KHI TAB ẨN
   ============================================================================ */
let fireworksPaused = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Tab bị ẩn - dừng pháo hoa
    if (fireworks3D.isActive && fireworks3D.interval) {
      clearInterval(fireworks3D.interval);
      fireworks3D.interval = null;
      fireworksPaused = true;
    }
  } else {
    // Tab hiện lại - bắt đầu lại nếu đang active
    if (fireworksPaused && fireworks3D.isActive) {
      fireworks3D.start(0);
      fireworksPaused = false;
    }
  }
});
