import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface FootballSpinnerProps {
  variant?: 'fullscreen' | 'inline';
  label?: string;
}

const mat = (color: string, roughness = 0.7) => new THREE.MeshStandardMaterial({ color, roughness });

function capsule(parent: THREE.Object3D, radius: number, length: number, material: THREE.Material, y: number) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 5, 12), material);
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function limb(parent: THREE.Object3D, length: number, radius: number, material: THREE.Material, boot: THREE.Material) {
  const upper = new THREE.Group();
  parent.add(upper);
  capsule(upper, radius, length, material, -length / 2);
  const lower = new THREE.Group();
  lower.position.y = -length;
  upper.add(lower);
  capsule(lower, radius * 0.82, length * 0.92, material, -length * 0.46);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(radius * 2.2, radius, radius * 4), boot);
  foot.position.set(0, -length * 0.92, 0.12);
  foot.castShadow = true;
  lower.add(foot);
  return { upper, lower };
}

function createPlayer() {
  const root = new THREE.Group();
  const skin = mat('#a96e4d');
  const jersey = mat('#f00091', 0.48);
  const dark = mat('#101827');
  const cyan = mat('#00c9e8', 0.45);
  const white = mat('#edf3f7');
  const boot = mat('#080b12', 0.35);
  const torso = new THREE.Group();
  torso.position.y = 1.43;
  root.add(torso);
  capsule(torso, 0.235, 0.46, jersey, 0);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.62, 0.018), cyan);
  stripe.position.set(0.09, 0, 0.218);
  torso.add(stripe);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.15, 14), skin);
  neck.position.y = 0.32;
  torso.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 20), skin);
  head.position.y = 0.51;
  head.scale.set(0.94, 1.1, 0.95);
  head.castShadow = true;
  torso.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.57), mat('#171923'));
  hair.position.set(0, 0.56, -0.01);
  torso.add(hair);
  const shorts = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.27, 0.28), dark);
  shorts.position.y = -0.34;
  torso.add(shorts);
  const leftLeg = limb(root, 0.47, 0.105, dark, boot);
  const rightLeg = limb(root, 0.47, 0.105, dark, boot);
  leftLeg.upper.position.set(-0.13, 1.2, 0);
  rightLeg.upper.position.set(0.13, 1.2, 0);
  capsule(leftLeg.lower, 0.078, 0.3, white, -0.2);
  capsule(rightLeg.lower, 0.078, 0.3, white, -0.2);
  const leftArm = limb(root, 0.34, 0.072, jersey, skin);
  const rightArm = limb(root, 0.34, 0.072, jersey, skin);
  leftArm.upper.position.set(-0.28, 1.62, 0);
  rightArm.upper.position.set(0.28, 1.62, 0);
  leftArm.upper.rotation.z = 0.2;
  rightArm.upper.rotation.z = -0.2;
  return { root, torso, leftLeg, rightLeg, leftArm, rightArm };
}

function ballTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f5f7fa';
    ctx.fillRect(0, 0, 512, 256);
    for (let row = -1; row < 5; row++) for (let col = -1; col < 9; col++) {
      const x = col * 64 + (row % 2) * 32;
      const y = row * 64;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i + Math.PI / 6;
        const px = x + Math.cos(a) * 33;
        const py = y + Math.sin(a) * 33;
        if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = (col * 3 + row * 5) % 9 === 0 ? '#101827' : '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#aab4c1';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGoal(scene: THREE.Scene) {
  const goal = new THREE.Group();
  const frame = mat('#f3f7fb', 0.25);
  const post = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), frame);
    m.position.set(x, y, z);
    m.castShadow = true;
    goal.add(m);
  };
  const w = 3.6, h = 2.05, z = -4.55, d = 0.78;
  post(-w / 2, h / 2, z, 0.07, h, 0.07);
  post(w / 2, h / 2, z, 0.07, h, 0.07);
  post(0, h, z, w + 0.08, 0.07, 0.07);
  post(-w / 2, h / 2, z - d, 0.05, h, 0.05);
  post(w / 2, h / 2, z - d, 0.05, h, 0.05);
  const net = new THREE.Group();
  const netMat = new THREE.LineBasicMaterial({ color: 0xb8d7e8, transparent: true, opacity: 0.48 });
  for (let x = -w / 2; x <= w / 2; x += 0.24) {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.04, z - d), new THREE.Vector3(x, h, z)
    ]), netMat);
    net.add(line);
  }
  for (let y = 0.15; y < h; y += 0.22) {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w / 2, y, z - d), new THREE.Vector3(w / 2, y, z - d)
    ]), netMat);
    net.add(line);
  }
  goal.add(net);
  scene.add(goal);
  return goal;
}

const FootballScene = ({ compact = false }: { compact?: boolean }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setWebglFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.15 : 1.5));
    renderer.setClearColor(0x050a12, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'pdb-loader-scene-canvas';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x07111d, 7, 16);
    const camera = new THREE.PerspectiveCamera(compact ? 40 : 34, 1, 0.1, 35);
    camera.position.set(0, compact ? 3.25 : 3.55, compact ? 8.8 : 8.2);
    camera.lookAt(0, 1, -1.2);
    scene.add(new THREE.HemisphereLight(0xd9efff, 0x14231a, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(-3, 7, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const pink = new THREE.PointLight(0xf00091, 32, 12);
    pink.position.set(-4, 3, -1);
    scene.add(pink);
    const cyan = new THREE.PointLight(0x00c9e8, 36, 12);
    cyan.position.set(4, 4, -3);
    scene.add(cyan);

    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshStandardMaterial({ color: '#17452f', roughness: 0.98 }));
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = -0.035;
    pitch.receiveShadow = true;
    scene.add(pitch);
    const stripeMat = new THREE.MeshStandardMaterial({ color: '#1d5638', roughness: 1 });
    for (let i = 0; i < 9; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(2, 18), stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(-8 + i * 2, -0.028, -1);
      scene.add(stripe);
    }
    const fieldMat = new THREE.LineBasicMaterial({ color: 0xeaf7ed, transparent: true, opacity: 0.5 });
    const fieldLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-4.3, 0.005, -4.48), new THREE.Vector3(4.3, 0.005, -4.48)
    ]), fieldMat);
    scene.add(fieldLine);
    const goal = createGoal(scene);
    const player = createPlayer();
    player.root.position.set(-0.72, 0, 1.2);
    player.root.rotation.y = Math.PI;
    scene.add(player.root);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 40, 32),
      new THREE.MeshStandardMaterial({ map: ballTexture(), roughness: 0.42 })
    );
    ball.castShadow = true;
    scene.add(ball);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.23, 28), new THREE.MeshBasicMaterial({ color: '#020609', transparent: true, opacity: 0.38 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    scene.add(shadow);

    const streaks: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const streak = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.55 + i * 0.12, 6),
        new THREE.MeshBasicMaterial({ color: i % 2 ? '#00c9e8' : '#f00091', transparent: true, opacity: 0 })
      );
      streak.rotation.x = Math.PI / 2;
      scene.add(streak);
      streaks.push(streak);
    }

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const t = elapsed % 5.8;
      const run = t < 2.4;
      if (!reduced) {
        const phase = elapsed * 8.2;
        player.leftLeg.upper.rotation.x = run ? Math.sin(phase) * 0.58 : 0;
        player.rightLeg.upper.rotation.x = run ? Math.sin(phase + Math.PI) * 0.58 : 0;
        player.leftLeg.lower.rotation.x = run ? Math.max(0, -Math.sin(phase)) * 0.65 : 0;
        player.rightLeg.lower.rotation.x = run ? Math.max(0, -Math.sin(phase + Math.PI)) * 0.65 : 0;
        player.leftArm.upper.rotation.x = run ? Math.sin(phase + Math.PI) * 0.42 : 0.1;
        player.rightArm.upper.rotation.x = run ? Math.sin(phase) * 0.42 : -0.1;
        player.torso.rotation.x = run ? Math.sin(phase * 2) * 0.035 : 0;
        player.root.position.z = 1.2 - Math.min(t, 2.4) * 0.12;
        if (t >= 2.4 && t < 2.82) {
          player.rightLeg.upper.rotation.x = -0.95;
          player.rightLeg.lower.rotation.x = 0.25;
          player.torso.rotation.x = -0.12;
        } else if (t >= 2.82 && t < 4.05) {
          const kick = Math.min((t - 2.82) / 0.3, 1);
          player.rightLeg.upper.rotation.x = -0.95 + kick * 1.9;
          player.rightLeg.lower.rotation.x = 0.25 - kick * 0.25;
          player.leftLeg.upper.rotation.x = 0.2;
          player.torso.rotation.x = 0.12;
        } else if (t >= 4.05) {
          const settle = Math.min((t - 4.05) / 1.7, 1);
          player.torso.rotation.x *= 1 - settle;
        }
        camera.position.x = Math.sin(elapsed * 0.32) * 0.04;
      }

      let bx = -0.05;
      let by = 0.2 + (run ? Math.abs(Math.sin(elapsed * 8.2)) * 0.05 : 0);
      let bz = 0.45 - Math.min(t, 2.4) * 0.19;
      if (t >= 2.82 && t < 4.05) {
        const kickT = (t - 2.82) / 1.23;
        bx = -0.05 + kickT * 0.2;
        bz = 0.45 - kickT * 5;
        by = 0.2 + Math.sin(kickT * Math.PI) * 1.12;
      } else if (t >= 4.05) {
        const reset = Math.min((t - 4.05) / 1.75, 1);
        bx = 0.15 * (1 - reset) - 0.05 * reset;
        bz = -4.55 + reset * 5;
        by = 0.2 + (1 - reset) * 0.06;
      }
      ball.position.set(bx, by, bz);
      if (!reduced) {
        ball.rotation.x += 0.13;
        ball.rotation.z += 0.18;
      }
      shadow.position.x = bx;
      shadow.position.z = bz;
      shadow.scale.setScalar(Math.max(0.5, 1.2 - by * 0.25));
      shadow.material.opacity = Math.max(0.12, 0.4 - by * 0.17);
      streaks.forEach((streak, i) => {
        const active = t > 3.05 && t < 4.05;
        (streak.material as THREE.MeshBasicMaterial).opacity = active ? 0.3 * (1 - i / 5) : 0;
        streak.position.set(bx, by, bz + 0.28 + i * 0.16);
      });
      // Brief net pulse at the impact moment sells the goal shot.
      goal.scale.z = 1 + (t > 3.75 && t < 4.05 ? Math.sin((t - 3.75) * 20) * 0.045 : 0);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    if (!reduced) frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [compact]);

  return (
    <div ref={hostRef} className={`pdb-loader-scene-host ${compact ? 'pdb-loader-scene-host--compact' : ''}`} aria-hidden="true">
      {webglFailed && <span className="pdb-loader-scene-fallback">⚽</span>}
    </div>
  );
};

export const FootballSpinner = ({
  variant = 'inline',
  label = 'Preparando la jugada',
}: FootballSpinnerProps) => {
  if (variant === 'fullscreen') {
    return (
      <div className="pdb-loader-screen" role="status" aria-live="polite" aria-label={label}>
        <div className="pdb-loader-stadium" aria-hidden="true">
          <span className="pdb-loader-light pdb-loader-light--left" />
          <span className="pdb-loader-light pdb-loader-light--right" />
          <span className="pdb-loader-beam pdb-loader-beam--left" />
          <span className="pdb-loader-beam pdb-loader-beam--right" />
          <div className="pdb-loader-particles" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <span className="pdb-loader-pitch-line pdb-loader-pitch-line--horizontal" />
          <span className="pdb-loader-pitch-line pdb-loader-pitch-line--circle" />
        </div>
        <div className="pdb-loader-content pdb-loader-content--scene">
          <div className="pdb-loader-brand">
            <span className="pdb-loader-brand-mark">PDB</span>
            <span className="pdb-loader-brand-name">PICHANGAS <b>DE BARRIO</b></span>
          </div>
          <FootballScene />
          <p className="pdb-loader-label">{label}</p>
          <div className="pdb-loader-progress" aria-hidden="true"><span /></div>
          <span className="pdb-loader-caption">FÚTBOL · AMISTAD · COMUNIDAD</span>
        </div>
      </div>
    );
  }
  return (
    <div className="pdb-loader-inline pdb-loader-inline--scene" role="status" aria-live="polite" aria-label={label}>
      <FootballScene compact />
      <span className="pdb-loader-inline-label">{label}</span>
      <span className="pdb-loader-inline-track" aria-hidden="true"><i /></span>
    </div>
  );
};
