"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  friction: number;
  glow: boolean;
  alpha: number;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export default function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationId = useRef<number | null>(null);
  const particles = useRef<Particle[]>([]);
  const lastFirework = useRef<number>(0);

  const colors = [
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#ffffff', // white
    '#22c55e', // green-500
    '#f97316', // orange-500
    '#a855f7', // purple-500
  ];

  const fireworkInterval = 1500; // 1.5 secondes entre les feux d'artifice

  class ParticleClass implements Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
    life: number;
    maxLife: number;
    gravity: number;
    friction: number;
    glow: boolean;
    alpha: number;
    
    constructor(x: number, y: number, color: string, glow = false) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 2 + 1;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.speedX = Math.cos(angle) * speed;
      this.speedY = Math.sin(angle) * speed;
      this.color = color;
      this.life = 1;
      this.maxLife = 1;
      this.gravity = 0.05;
      this.friction = 0.98;
      this.glow = glow;
      this.alpha = 1;
    }
    
    update() {
      this.speedX *= this.friction;
      this.speedY *= this.friction;
      this.speedY += this.gravity;
      
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= 0.01;
      this.alpha = this.life;
      
      if (this.life <= 0) {
        this.life = 0;
      }
    }
    
    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      
      if (this.glow) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
      }
      
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }

  const createFirework = useCallback((x: number, y: number) => {
    const particleCount = 100 + Math.random() * 50;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const glow = Math.random() > 0.5;

    for (let i = 0; i < particleCount; i++) {
      particles.current.push(new ParticleClass(x, y, color, glow));
    }
    
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const trailParticle = new ParticleClass(x, y, color, true);
        trailParticle.size = Math.random() * 1 + 0.5;
        trailParticle.speedX *= 0.5;
        trailParticle.speedY *= 0.5;
        particles.current.push(trailParticle);
      }, i * 10);
    }
  }, [colors]);

  const createBackgroundStars = useCallback((canvas: HTMLCanvasElement) => {
    const starCount = Math.floor((canvas.width * canvas.height) / 5000);
    
    for (let i = 0; i < starCount; i++) {
      const star = new ParticleClass(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        'rgba(255, 255, 255, 0.3)',
        true
      );
      star.size = Math.random() * 1.5;
      star.speedX = 0;
      star.speedY = 0;
      star.life = 1;
      star.alpha = 0.3;
      particles.current.push(star);
    }
  }, []);

  const resizeCanvas = useCallback((canvas: HTMLCanvasElement) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resizeCanvas(canvas);
    createBackgroundStars(canvas);

    const animate = (time: number) => {
      if (!ctx) return;

      // Fond avec effet de fondu subtil
      ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mettre à jour et dessiner les particules
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.update();
        p.draw(ctx);

        if (p.life <= 0) {
          particles.current.splice(i, 1);
        }
      }

      // Créer de nouveaux feux d'artifice à intervalle régulier
      if (time - lastFirework.current > fireworkInterval) {
        lastFirework.current = time;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.5;
        createFirework(x, y);
        
        if (Math.random() > 0.7) {
          setTimeout(() => {
            createFirework(x + (Math.random() - 0.5) * 200, y + (Math.random() - 0.5) * 200);
          }, 200);
        }
      }

      animationId.current = requestAnimationFrame(animate);
    };

    // Démarrer avec quelques feux d'artifice initiaux
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          createFirework(
            canvas.width * 0.2 + Math.random() * canvas.width * 0.6,
            canvas.height * 0.2 + Math.random() * canvas.height * 0.3
          );
        }, i * 500);
      }
    }, 500);

    animationId.current = requestAnimationFrame(animate);

    const handleResize = () => {
      resizeCanvas(canvas);
      for (const particle of particles.current) {
        if (particle.x > canvas.width) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = canvas.height;
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [createBackgroundStars, createFirework, resizeCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}