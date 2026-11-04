import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface FootballSpinnerProps {
  variant?: 'fullscreen' | 'inline';
  label?: string;
}

const ThreeDimensionalBall = () => {
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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = 'pdb-loader-three-canvas';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
    camera.position.set(0, 0, 4.1);

    // Textura equirectangular de paneles clásicos, creada localmente sin descargar imágenes.
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 1024;
    textureCanvas.height = 512;
    const ctx = textureCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f4f6f8';
      ctx.fillRect(0, 0, 1024, 512);
      const drawHex = (cx: number, cy: number, radius: number, fill: string) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 3 * i + Math.PI / 6;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = '#aeb8c4';
        ctx.lineWidth = 3;
        ctx.stroke();
      };
      for (let row = -1; row < 9; row++) {
        for (let col = -1; col < 17; col++) {
          const x = col * 64 + (row % 2) * 32;
          const y = row * 64;
          const dark = (col * 3 + row * 5) % 11 === 0 || (col + row * 2) % 13 === 0;
          drawHex(x, y, 36, dark ? '#111b2b' : '#f7f9fb');
        }
      }
      const highlight = ctx.createRadialGradient(260, 95, 5, 260, 95, 260);
      highlight.addColorStop(0, 'rgba(255,255,255,.9)');
      highlight.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = highlight;
      ctx.fillRect(0, 0, 1024, 512);
    }

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 48),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.58, metalness: 0.02 })
    );
    scene.add(ball);

    scene.add(new THREE.HemisphereLight(0xeaf5ff, 0x172033, 2.0));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-3, 4, 5);
    scene.add(keyLight);
    const cyanLight = new THREE.PointLight(0x00c9e8, 22, 8);
    cyanLight.position.set(3, 0.5, 2);
    scene.add(cyanLight);
    const pinkLight = new THREE.PointLight(0xf00091, 18, 8);
    pinkLight.position.set(-3, -1, 1);
    scene.add(pinkLight);

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

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let animationId = 0;
    const animate = (time: number) => {
      ball.rotation.y += 0.008;
      ball.rotation.x = 0.12 + Math.sin(time * 0.00055) * 0.045;
      ball.rotation.z = Math.sin(time * 0.00035) * 0.035;
      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    };
    if (!reduceMotion) animationId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationId);
      observer.disconnect();
      ball.geometry.dispose();
      (ball.material as THREE.Material).dispose();
      texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
    };
  }, []);

  return (
    <div ref={hostRef} className="pdb-loader-three-host" aria-hidden="true">
      {webglFailed && <span className="pdb-loader-three-fallback">⚽</span>}
    </div>
  );
};

const Football = ({ compact = false }: { compact?: boolean }) => (
  <div className={`pdb-loader-ball-wrap ${compact ? 'pdb-loader-ball-wrap--compact' : ''}`} aria-hidden="true">
    <span className="pdb-loader-ball-aura" />
    <span className="pdb-loader-ball-shadow" />
    <span className="pdb-loader-ball-orbit pdb-loader-ball-orbit--one" />
    <span className="pdb-loader-ball-orbit pdb-loader-ball-orbit--two" />
    <ThreeDimensionalBall />
  </div>
);

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
          <div className="pdb-loader-particles" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i />
          </div>
          <span className="pdb-loader-pitch-line pdb-loader-pitch-line--horizontal" />
          <span className="pdb-loader-pitch-line pdb-loader-pitch-line--circle" />
        </div>
        <div className="pdb-loader-content">
          <div className="pdb-loader-brand">
            <span className="pdb-loader-brand-mark">PDB</span>
            <span className="pdb-loader-brand-name">PICHANGAS <b>DE BARRIO</b></span>
          </div>
          <Football />
          <p className="pdb-loader-label">{label}</p>
          <div className="pdb-loader-progress" aria-hidden="true"><span /></div>
          <span className="pdb-loader-caption">FÚTBOL · AMISTAD · COMUNIDAD</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pdb-loader-inline" role="status" aria-live="polite" aria-label={label}>
      <Football compact />
      <span className="pdb-loader-inline-label">{label}</span>
      <span className="pdb-loader-inline-track" aria-hidden="true"><i /></span>
    </div>
  );
};
