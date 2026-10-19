/**
 * Káº¾ HOáº CH WEB SINH NHáº¬T - MAIN.JS v6
 * 12 loáº¡i phÃ¡o hoa + bÃ¡nh Ä‘áº¹p + 20 náº¿n
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ============================================================================
   1. Háº T Ná»€N 2D LUNG LINH
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
   2. TEXTURE GLOW CHáº¤T LÆ¯á»¢NG CAO
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
   4. Há»† THá»NG PHÃO HOA 12 LOáº I
   ============================================================================ */
class FireworksUltimate {
  constructor(scene) {
    this.scene = scene;
    this.activeFireworks = [];
    this.rockets = [];
    this.burstTypes = [
      // Cáº§u Ä‘á»u
      'peony', 'chrysanthemum',
      // RÆ¡i
      'willow', 'waterfall',
      // VÃ²ng
      'ring', 'heart', 'spiral',
      // Directional
      'fanning', 'crossette',
      // Äáº·c biá»‡t
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

  // PEONY - Ná»• cáº§u Ä‘á»u
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

  // CHRYSANTHEMUM - Trail dÃ i
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

  // WILLOW - RÆ¡i cháº­m
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

  // RING - Bay vÃ²ng trÃ²n
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

  // CRACKLE - Láº¥p lÃ¡nh ngáº«u nhiÃªn
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

  // HEART - HÃ¬nh trÃ¡i tim
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

  // BROCADE - VÃ ng rÆ¡i
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

  // WATERFALL - RÆ¡i xuá»‘ng nhÆ° thÃ¡c nÆ°á»›c
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

  // FANNING - Quáº¡t ná»­a vÃ²ng trÃ²n (directional)
  createFanning(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    const fanAngle = Math.random() * Math.PI * 2; // HÆ°á»›ng quáº¡t ngáº«u nhiÃªn
    const spread = Math.PI * 0.8; // Ná»­a vÃ²ng trÃ²n
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
        vy: Math.sin(theta) * speed * 0.3, // Bay cao nháº¹
        vz: Math.random() * 2,
        life: 1.0, decay: 0.007, type: 'fanning'
      });
    }
    this.activeFireworks.push({ type: 'fanning', particles, gravity: 0.025 });
  }

  // CROSSSETTE - TÃ¡ch Ä‘Ã´i thÃ nh 4 hÆ°á»›ng
  createCrossette(position, color) {
    this.createFlash(position, color);
    const colorObj = new THREE.Color(color);
    const particles = [];
    const directions = [0, Math.PI/2, Math.PI, Math.PI * 1.5]; // 4 hÆ°á»›ng vuÃ´ng gÃ³c
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

  // SPIRAL - XoÃ¡y á»‘c lÃªn
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
      const t = (i / 80) * Math.PI * 4; // 2 vÃ²ng xoáº¯n
      const speed = 5;
      particles.push({
        sprite,
        vx: Math.cos(t) * speed,
        vy: Math.abs(Math.sin(t)) * 4 + 2, // LuÃ´n bay lÃªn
        vz: Math.sin(t) * speed,
        life: 1.0, decay: 0.006, type: 'spiral'
      });
    }
    this.activeFireworks.push({ type: 'spiral', particles, gravity: 0.03 });
  }

  // STROBE - Chá»›p táº¯t liÃªn tá»¥c
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

  // CELEBRATION - 15 quáº£ tá»a rá»™ng
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
    const x = (Math.random() - 0.5) * 30;
    const y = 4 + Math.random() * 13;
    const z = (Math.random() - 0.5) * 14;
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
        
        // Strobe effect - chá»›p táº¯t
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

  start(duration = 0) { // 0 = vÄ©nh viá»…n
    this.isActive = true;
    // LÆ°u thá»i Ä‘iá»ƒm báº¯t Ä‘áº§u Ä‘á»ƒ reset interval
    this.lastTick = Date.now();
    this.interval = setInterval(() => {
      // Kiá»ƒm tra tab cÃ³ Ä‘ang áº©n khÃ´ng - náº¿u cÃ³ thÃ¬ skip
      if (document.hidden) {
        return;
      }
      // Äáº£m báº£o khÃ´ng cÃ³ quÃ¡ nhiá»u rocket Ä‘ang bay (giá»›i háº¡n 30)
      if (this.rockets.length > 30) {
        return;
      }
      // Äáº¿m tá»•ng particles Ä‘ang active
      let totalParticles = 0;
      for (const fw of this.activeFireworks) {
        totalParticles += (fw.particles || []).length;
      }
      if (totalParticles > 1500) {
        return;
      }
      // Báº¯n 1-3 quáº£ má»—i láº§n
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
  { f: 349, d: 1.0, t: 'To' }, { f: 330, d: 2.0, t: 'You âœ¨' },
  { f: 262, d: 0.5, t: 'Hap' }, { f: 262, d: 0.5, t: 'py' },
  { f: 294, d: 1.0, t: 'Birth' }, { f: 262, d: 1.0, t: 'day' },
  { f: 392, d: 1.0, t: 'To' }, { f: 349, d: 2.0, t: 'You ðŸŒ¸' },
  { f: 262, d: 0.5, t: 'Hap' }, { f: 262, d: 0.5, t: 'py' },
  { f: 523, d: 1.0, t: 'Birth' }, { f: 440, d: 1.0, t: 'day' },
  { f: 349, d: 1.0, t: 'Nguyá»…n' }, { f: 330, d: 1.0, t: 'Lan' },
  { f: 294, d: 2.5, t: '20 Tuá»•i ðŸŽ‚' }
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
// GÃ³c nhÃ¬n rá»™ng nháº¥t - bao quÃ¡t cáº£ bÃ¡nh vÃ  áº£nh xung quanh (radius 12)
// Khoáº£ng cÃ¡ch 28 Ä‘Æ¡n vá»‹, FOV 65 - tháº¥y cáº£ bÃ¡nh á»Ÿ giá»¯a vÃ  áº£nh Ä‘á»‘i diá»‡n
// height_diff = 28 Ã— tan(30Â°) = 16.2, camera.y = 2.5 + 16.2 = 18.7
camera.position.set(0, 18.7, 28);
camera.lookAt(0, 2.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1; // TÄƒng nháº¹ tá»« 0.95
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
webglContainer.appendChild(renderer.domElement);

const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.35, 0.4, 0.55 // Bloom ráº¥t nháº¹ - trÃ¡nh chÃ³i bÃ¡nh
);
const composer = new EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 + 0.05; // Giá»›i háº¡n ~90Â° + 3Â°
controls.minDistance = 10;
controls.maxDistance = 38;
controls.target.set(0, 2.5, 0);
// Tá»± Ä‘á»™ng xoay quanh bÃ¡nh - tá»‘c Ä‘á»™ nháº¹ nhÃ ng
controls.autoRotate = true;
controls.autoRotateSpeed = 1.4; // Xoay nhanh hÆ¡n, váº«n nháº¹ nhÃ ng
// Khi user tÆ°Æ¡ng tÃ¡c thÃ¬ dá»«ng xoay táº¡m thá»i
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
   7. 3 LOáº I BÃNH Vá»šI 20 Náº¾N
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

// 3 LOáº I BÃNH Äáº¸P
const cakeThemes = [
  { 
    name: 'ðŸ“ Strawberry Dream', 
    sponge: 0xffb3c6, 
    frosting: 0xfff0f5, 
    accent: 0xff2a6d,
    candleColor: 0xff85b3
  },
  { 
    name: 'ðŸŒˆ Rainbow Delight', 
    sponge: [0xff6b6b, 0xffa06b, 0xffd166, 0x90EE90, 0x87CEEB, 0xDDA0DD],
    frosting: 0xfffaf0, 
    accent: 0xffd700,
    candleColor: 0xffd166
  },
  { 
    name: 'ðŸŒŸ Vanilla Elegant', 
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
    // Bá» emissive hoÃ n toÃ n
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
  
  // Äáº¿ bÃ¡nh
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.5, 0.3, 64), matPedestal);
  plate.position.y = -0.15; plate.receiveShadow = true;
  cakeRoot.add(plate);
  
  // Viá»n vÃ ng
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.1, 16, 100), matGoldTrim);
  goldRing.rotation.x = Math.PI / 2; goldRing.position.y = 0.0;
  cakeRoot.add(goldRing);
  
  // Táº§ng 1 (Ä‘Ã¡y)
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1.8, 64), matTier1);
  tier1.position.y = 0.9; tier1.castShadow = true; tier1.receiveShadow = true;
  cakeRoot.add(tier1);
  
  // Frosting táº§ng 1
  const frost1 = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.25, 0.25, 64), matFrosting);
  frost1.position.y = 1.92; cakeRoot.add(frost1);
  
  // Drip frosting táº§ng 1
  for (let i = 0; i < 50; i++) {
    const theta = (i / 50) * Math.PI * 2;
    const dripLen = 0.4 + 0.25 * Math.sin(i * 4) + 0.15 * Math.cos(i * 6);
    const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, dripLen, 12), matFrosting);
    drip.position.set(Math.cos(theta) * 3.18, 1.79 - dripLen/2, Math.sin(theta) * 3.18);
    cakeRoot.add(drip);
  }
  
  // Hoa há»“ng táº§ng 1
  for (let i = 0; i < 35; i++) {
    const a = (i / 35) * Math.PI * 2;
    const rose = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), matFrosting);
    rose.scale.set(1, 0.6, 1);
    rose.position.set(Math.cos(a) * 3.3, 0.15, Math.sin(a) * 3.3);
    cakeRoot.add(rose);
  }
  
  // Táº§ng 2 (giá»¯a)
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 1.5, 64), matTier2);
  tier2.position.y = 2.8; tier2.castShadow = true; tier2.receiveShadow = true;
  cakeRoot.add(tier2);
  
  // Frosting táº§ng 2
  const frost2 = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.22, 64), matFrosting);
  frost2.position.y = 3.66; cakeRoot.add(frost2);
  
  // DÃ¢u tÃ¢y trang trÃ­ táº§ng 2
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
  
  // Táº§ng 3 (trÃªn)
  const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.2, 64), matTier3);
  tier3.position.y = 4.55; tier3.castShadow = true; tier3.receiveShadow = true;
  cakeRoot.add(tier3);
  
  // Frosting táº§ng 3
  const frost3 = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.2, 64), matFrosting);
  frost3.position.y = 5.26; cakeRoot.add(frost3);
  
  // Hoa trÃªn cÃ¹ng
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
  
  // Äáº¿ bÃ¡nh
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 3.7, 0.35, 64), matPedestal);
  plate.position.y = -0.175; plate.receiveShadow = true;
  cakeRoot.add(plate);
  
  // Viá»n báº¡c
  const silverRing = new THREE.Mesh(new THREE.TorusGeometry(3.85, 0.12, 16, 100), matSilver);
  silverRing.rotation.x = Math.PI / 2; silverRing.position.y = 0.0;
  cakeRoot.add(silverRing);
  
  // 6 táº§ng cáº§u vá»“ng
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
    
    // Frosting giá»¯a cÃ¡c táº§ng
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
  
  // Frosting trÃªn cÃ¹ng
  const topFrost = new THREE.Mesh(
    new THREE.CylinderGeometry(tierRadii[5] + 0.05, tierRadii[5] + 0.05, 0.18, 64),
    matFrosting
  );
  topFrost.position.y = currentY + 0.09;
  cakeRoot.add(topFrost);
  
  // Äiá»ƒm nháº¥n trÃªn cÃ¹ng - ngÃ´i sao vÃ ng
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
  
  // Äáº¿ bÃ¡nh
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 3.3, 0.3, 64),
    new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, roughness: 0.1, metalness: 0.05, 
      transmission: 0.35, thickness: 0.5 
    })
  );
  plate.position.y = -0.15; plate.receiveShadow = true;
  cakeRoot.add(plate);
  
  // Viá»n vÃ ng
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.1, 16, 100), matGoldTrim);
  goldRing.rotation.x = Math.PI / 2; goldRing.position.y = 0.0;
  cakeRoot.add(goldRing);
  
  // Táº§ng 1
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 1.6, 64), matTier1);
  tier1.position.y = 0.8; tier1.castShadow = true; tier1.receiveShadow = true;
  cakeRoot.add(tier1);
  
  const frost1 = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.05, 0.2, 64), matFrosting);
  frost1.position.y = 1.7; cakeRoot.add(frost1);
  
  // Hoa vanilla táº§ng 1
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), matGoldTrim);
    petal.scale.set(1.8, 0.5, 1);
    petal.position.set(Math.cos(angle) * 3.1, 0.12, Math.sin(angle) * 3.1);
    cakeRoot.add(petal);
  }
  
  // Táº§ng 2
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 1.4, 64), matTier2);
  tier2.position.y = 2.5; tier2.castShadow = true; tier2.receiveShadow = true;
  cakeRoot.add(tier2);
  
  const frost2 = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.18, 64), matFrosting);
  frost2.position.y = 3.29; cakeRoot.add(frost2);
  
  // Táº§ng 3
  const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.0, 64), matTier3);
  tier3.position.y = 4.24; tier3.castShadow = true; tier3.receiveShadow = true;
  cakeRoot.add(tier3);
  
  const frost3 = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.15, 64), matFrosting);
  frost3.position.y = 4.82; cakeRoot.add(frost3);
  
  // Hoa há»“ng trÃªn cÃ¹ng
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
  if (titleEl) titleEl.textContent = cakeThemes[themeIdx].name + ' â€¢ Sweet 20th Birthday ðŸŽ‚';
}

buildCake(0);

/* ============================================================================
   8. NGá»ŒN Lá»¬A Náº¾N - 20 Náº¾N
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
  
  // BaseY cho tá»«ng loáº¡i bÃ¡nh - trÃªn máº·t táº§ng trÃªn cÃ¹ng
  let baseY;
  if (currentThemeIdx === 0) {
    // Strawberry: táº§ng 3 trÃªn cÃ¹ng cao 4.55-5.26
    baseY = 5.0;
  } else if (currentThemeIdx === 1) {
    // Rainbow: cáº¯m náº¿n trÃªn Táº¦NG 5 (rá»™ng 1.4) thay vÃ¬ táº§ng 6 (chá»‰ 0.9)
    // Táº§ng 5 cao: 0.175 + 1.5 + 0.15 + 1.3 + 0.15 + 1.1 + 0.15 + 0.9 + 0.15 = 5.575
    baseY = 5.45;
  } else {
    // Vanilla: táº§ng 3 cao 4.24-4.82
    baseY = 4.6;
  }
  
  // 20 náº¿n cáº¯m Ä‘á»u - chia 2 vÃ²ng
  // VÃ²ng ngoÃ i: 12 náº¿n (bÃ¡n kÃ­nh lá»›n)
  // VÃ²ng trong: 8 náº¿n (bÃ¡n kÃ­nh nhá»)
  
  // BÃ¡n kÃ­nh khÃ¡c nhau theo táº§ng - Ä‘áº£m báº£o khÃ´ng trÆ°á»£t khá»i táº§ng
  let outerRadius, innerRadius;
  if (currentThemeIdx === 0) {
    // Strawberry: táº§ng 3 rá»™ng 1.4 â†’ radius 1.2 OK
    outerRadius = 1.2; innerRadius = 0.6;
  } else if (currentThemeIdx === 1) {
    // Rainbow: táº§ng 5 rá»™ng 1.4 â†’ radius 0.7 trong Ä‘Æ°á»ng kÃ­nh nhÆ°ng á»Ÿ gÃ³c trÆ°á»£t
    // DÃ¹ng radius nhá» Ä‘á»ƒ cháº¯c cháº¯n náº±m trÃªn táº§ng
    outerRadius = 0.6; innerRadius = 0.25;
  } else {
    // Vanilla: táº§ng 3 rá»™ng 1.2 â†’ radius 1.0 OK
    outerRadius = 1.0; innerRadius = 0.5;
  }
  
  // MÃ u náº¿n Ä‘a dáº¡ng
  const colors = [0xff6b6b, 0xffa06b, 0xffd166, 0x90EE90, 0x87CEEB, 0xDDA0DD, 0xffffff, 0xff85b3];
  
  // VÃ²ng ngoÃ i - 12 náº¿n
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
  
  // VÃ²ng trong - 8 náº¿n
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
   9. TÆ¯Æ NG TÃC
   ============================================================================ */
let candlesLit = true;
let blowCooldown = false; // NgÄƒn táº¯t náº¿n liÃªn tá»¥c
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
  blowCooldown = true; // Khi báº­t láº¡i, ngÄƒn mic thá»•i ngay
  setTimeout(() => blowCooldown = false, 5000); // Cho 5s á»•n Ä‘á»‹nh
  // Set opacity vá» 1 NGAY Láº¬P Tá»¨C - khÃ´ng lerp cháº­m
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
  // Reset flame opacity khi Ä‘á»•i bÃ¡nh
  flameUniforms.uOpacity.value = candlesLit ? 1.0 : 0.0;
});

// ÄÃ£ bá» hoÃ n toÃ n microphone - chá»‰ thá»•i náº¿n qua nÃºt
// micInitialized = false;

document.getElementById('btn-replay-music').addEventListener('click', () => playBirthdayMelody());
ribbonEl.addEventListener('click', () => playBirthdayMelody());

document.getElementById('btn-to-stage-3').addEventListener('click', () => {
  playBirthdayMelody();
  stage2El.classList.add('stage-hidden');
  stage3UiEl.classList.remove('stage-hidden');
  webglContainer.classList.add('active');
  // ÄÃ£ bá» mic - khÃ´ng gá»i initMicrophoneBlowDetector
  fireworks3D.start(0); // 0 = vÄ©nh viá»…n
});

document.getElementById('btn-back-wishes').addEventListener('click', () => {
  stage3UiEl.classList.add('stage-hidden');
  webglContainer.classList.remove('active');
  stage2El.classList.remove('stage-hidden');
  fireworks3D.stop();
});

/* ============================================================================
   9.5. Há»† THá»NG áº¢NH Ká»¶ NIá»†M - KHUNG TRANH 3D XUNG QUANH BÃNH (Äáº¶T TRÆ¯á»šC ANIMATE)
   ============================================================================ */

// State quáº£n lÃ½ áº£nh
const photoSystem = {
  frames: [],          // Máº£ng cÃ¡c group khung áº£nh
  photos: [],          // Máº£ng URL áº£nh Ä‘Ã£ táº£i
  radius: 12,          // BÃ¡n kÃ­nh vÃ²ng trÃ²n
  height: 5,           // Äá»™ cao tÃ¢m khung
  frameWidth: 2.8,
  frameHeight: 2.8,
  visible: true,
  group: null
};

// Táº¡o group chá»©a táº¥t cáº£ khung
photoSystem.group = new THREE.Group();
scene.add(photoSystem.group);

// Táº¡o texture placeholder cho áº£nh máº·c Ä‘á»‹nh
function createPlaceholderTexture(text, bgColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  // Gradient ná»n
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, bgColor);
  grad.addColorStop(1, '#ffffff20');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px "Dancing Script", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Táº¡o 1 khung áº£nh 3D - vá»›i viá»n vÃ ng, máº·t kÃ­nh
function createPhotoFrame(index, total, photoTexture) {
  const group = new THREE.Group();
  // GÃ³c xung quanh trá»¥c Y
  const angle = (index / total) * Math.PI * 2;
  const x = Math.cos(angle) * photoSystem.radius;
  const z = Math.sin(angle) * photoSystem.radius;
  group.position.set(x, photoSystem.height, z);
  // Xoay máº·t khung hÆ°á»›ng vá» phÃ­a tÃ¢m bÃ¡nh
  group.lookAt(0, photoSystem.height, 0);
  // Xoay thÃªm 180Â° vÃ¬ lookAt hÆ°á»›ng -Z nhÆ°ng ta muá»‘n +Z (máº·t trÆ°á»›c)
  group.rotation.y += Math.PI;
  
  // KÃ­ch thÆ°á»›c khung
  const fw = photoSystem.frameWidth;
  const fh = photoSystem.frameHeight;
  
  // 1. Viá»n ngoÃ i - vÃ ng kim
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xffd700, metalness: 0.8, roughness: 0.25, emissive: 0x553300, emissiveIntensity: 0.1
  });
  const frameDepth = 0.15;
  // 4 thanh viá»n
  const top = new THREE.Mesh(new THREE.BoxGeometry(fw + 0.2, 0.2, frameDepth), frameMat);
  top.position.y = fh/2 + 0.05;
  group.add(top);
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(fw + 0.2, 0.2, frameDepth), frameMat);
  bottom.position.y = -fh/2 - 0.05;
  group.add(bottom);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.2, fh + 0.4, frameDepth), frameMat);
  left.position.x = -fw/2 - 0.05;
  group.add(left);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.2, fh + 0.4, frameDepth), frameMat);
  right.position.x = fw/2 + 0.05;
  group.add(right);
  
  // 2. Background Ä‘en sau áº£nh
  const bgMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), bgMat);
  bg.position.z = -0.04;
  group.add(bg);
  
  // 3. Máº·t áº£nh
  const photoMat = new THREE.MeshStandardMaterial({
    map: photoTexture, roughness: 0.6, metalness: 0.0, side: THREE.FrontSide
  });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), photoMat);
  photo.position.z = 0.0;
  group.add(photo);
  
  // 4. Máº·t kÃ­nh phÃ­a trÆ°á»›c (trong suá»‘t, cÃ³ reflection)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transparent: true, opacity: 0.15, 
    roughness: 0.05, metalness: 0.0, transmission: 0.3, ior: 1.5,
    clearcoat: 1.0, clearcoatRoughness: 0.0
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), glassMat);
  glass.position.z = 0.05;
  group.add(glass);
  
  // 5. Viá»n trang trÃ­ - gÃ³c bo trÃ²n
  const cornerMat = new THREE.MeshStandardMaterial({
    color: 0xffe066, metalness: 0.9, roughness: 0.2
  });
  // 4 gÃ³c nhá»
  const cs = 0.25;
  const corners = [
    { x: fw/2 + 0.05, y: fh/2 + 0.05 },
    { x: -fw/2 - 0.05, y: fh/2 + 0.05 },
    { x: fw/2 + 0.05, y: -fh/2 - 0.05 },
    { x: -fw/2 - 0.05, y: -fh/2 - 0.05 }
  ];
  corners.forEach(c => {
    const corner = new THREE.Mesh(new THREE.SphereGeometry(cs * 0.6, 12, 12), cornerMat);
    corner.position.set(c.x, c.y, frameDepth/2);
    group.add(corner);
  });
  
  // 6. ÄÃ¨n LED nhá» chiáº¿u áº£nh
  const led = new THREE.PointLight(0xffd166, 0.6, 4);
  led.position.z = 1.5;
  group.add(led);
  
  // LÆ°u thÃ´ng tin Ä‘á»ƒ cáº­p nháº­t sau
  group.userData = { index, photo, photoMat, angle, photoTexture };
  return group;
}

// Sáº¯p xáº¿p áº£nh theo vÃ²ng trÃ²n
function layoutPhotos() {
  // XÃ³a khung cÅ©
  photoSystem.frames.forEach(f => photoSystem.group.remove(f));
  photoSystem.frames = [];
  
  const total = photoSystem.photos.length;
  if (total < 5 || total > 20) return;
  
  for (let i = 0; i < total; i++) {
    const frame = createPhotoFrame(i, total, photoSystem.photos[i]);
    photoSystem.frames.push(frame);
    photoSystem.group.add(frame);
  }
}

// Toggle hiá»ƒn thá»‹
function setPhotosVisible(visible) {
  photoSystem.visible = visible;
  photoSystem.group.visible = visible;
}

// ==== UPLOAD & Xá»¬ LÃ áº¢NH ====
const photoUpload = document.getElementById('photo-upload');
const btnTogglePhotos = document.getElementById('btn-toggle-photos');
let photosActive = true;

photoUpload.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (files.length < 5) {
    alert('Cáº§n tá»‘i thiá»ƒu 5 áº£nh! Vui lÃ²ng chá»n tá»« 5-20 áº£nh.');
    return;
  }
  if (files.length > 20) {
    alert('Tá»‘i Ä‘a 20 áº£nh! Báº¡n Ä‘Ã£ chá»n ' + files.length + ' áº£nh, sáº½ láº¥y 20 áº£nh Ä‘áº§u tiÃªn.');
  }
  
  const limitedFiles = files.slice(0, 20);
  const textures = [];
  const bgColors = ['#ff85b3', '#87ceeb', '#90ee90', '#ffd166', '#dda0dd', '#ff6b6b', '#ffa06b'];
  
  for (let i = 0; i < limitedFiles.length; i++) {
    const file = limitedFiles[i];
    try {
      const url = await readFileAsDataURL(file);
      const tex = await loadImageTexture(url);
      textures.push(tex);
    } catch (err) {
      const placeholder = createPlaceholderTexture('ðŸ’– ' + (i+1), bgColors[i % bgColors.length]);
      textures.push(placeholder);
    }
  }
  
  // Pad vá»›i placeholder náº¿u < 5
  while (textures.length < 5) {
    const placeholder = createPlaceholderTexture('ðŸ’– ' + (textures.length+1), bgColors[textures.length % bgColors.length]);
    textures.push(placeholder);
  }
  
  photoSystem.photos = textures;
  layoutPhotos();
  setPhotosVisible(true);
  photosActive = true;
  btnTogglePhotos.textContent = 'ðŸ–¼ï¸ áº¨n áº¢nh Ká»· Niá»‡m';
});

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.ImageLoader().load(
      url,
      (img) => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}

btnTogglePhotos.addEventListener('click', () => {
  if (photoSystem.photos.length < 5) {
    alert('Vui lÃ²ng thÃªm áº£nh trÆ°á»›c (5-20 áº£nh)!');
    return;
  }
  photosActive = !photosActive;
  setPhotosVisible(photosActive);
  btnTogglePhotos.textContent = photosActive ? 'ðŸ–¼ï¸ áº¨n áº¢nh Ká»· Niá»‡m' : 'ðŸ–¼ï¸ Hiá»‡n áº¢nh Ká»· Niá»‡m';
});

// Táº¡o 8 placeholder máº·c Ä‘á»‹nh ngay tá»« Ä‘áº§u
function initDefaultPhotos() {
  const captions = ['ðŸ’–', 'ðŸŒ¸', 'âœ¨', 'ðŸŽ€', 'ðŸ¦‹', 'ðŸŒŸ', 'ðŸ’•', 'ðŸŒ·'];
  const bgColors = ['#ff85b3', '#87ceeb', '#90ee90', '#ffd166', '#dda0dd', '#ff6b6b', '#ffa06b', '#a0d8ef'];
  for (let i = 0; i < 8; i++) {
    const tex = createPlaceholderTexture(captions[i], bgColors[i]);
    photoSystem.photos.push(tex);
  }
  layoutPhotos();
}

initDefaultPhotos();

/* ============================================================================
   10. ANIMATION LOOP
   ============================================================================ */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  flameUniforms.uTime.value = elapsed;
  
  // Lerp opacity NHANH HÆ N - khÃ´ng chá» 1s
  const targetOpacity = candlesLit ? 1.0 : 0.0;
  // Tá»‘c Ä‘á»™ lerp 0.3 thay vÃ¬ 0.08
  flameUniforms.uOpacity.value += (targetOpacity - flameUniforms.uOpacity.value) * 0.3;
  // Snap vá» 0 hoáº·c 1 khi ráº¥t gáº§n (trÃ¡nh trÃ´i ná»•i)
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

  // Billboard: áº£nh luÃ´n hÆ°á»›ng vá» phÃ­a camera (an toÃ n khi chÆ°a sáºµn sÃ ng)
  if (typeof photoSystem !== 'undefined' && photoSystem && photoSystem.group && photoSystem.group.visible && photoSystem.frames.length > 0) {
    const camPos = camera.position.clone();
    photoSystem.frames.forEach(frame => {
      // TÃ­nh hÆ°á»›ng tá»« khung tá»›i camera
      const framePos = frame.getWorldPosition(new THREE.Vector3());
      const dir = new THREE.Vector3().subVectors(camPos, framePos).normalize();
      // LookAt camera, giá»¯ trá»¥c Y tháº³ng Ä‘á»©ng
      const lookTarget = new THREE.Vector3(
        framePos.x + dir.x,
        framePos.y,
        framePos.z + dir.z
      );
      frame.lookAt(lookTarget);
    });
  }

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
   11. PAGE VISIBILITY - PAUSE PHÃO HOA KHI TAB áº¨N
   ============================================================================ */
let fireworksPaused = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Tab bá»‹ áº©n - dá»«ng phÃ¡o hoa
    if (fireworks3D.isActive && fireworks3D.interval) {
      clearInterval(fireworks3D.interval);
      fireworks3D.interval = null;
      fireworksPaused = true;
    }
  } else {
    // Tab hiá»‡n láº¡i - báº¯t Ä‘áº§u láº¡i náº¿u Ä‘ang active
    if (fireworksPaused && fireworks3D.isActive) {
      fireworks3D.start(0);
      fireworksPaused = false;
    }
  }
});
