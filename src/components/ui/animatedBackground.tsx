"use client";
import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
}

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const shades = ["rgba(79, 139, 255, 0.8)", "rgba(59, 130, 246, 0.8)", "rgba(37, 99, 235, 0.8)"];
    const particles: Particle[] = [];
    const particleCount = 100;
    const maxRadius = 3;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const createParticle = () => {
        const particle : Particle = {
            x : Math.random() * canvas.width,
            y : Math.random() * canvas.height,
            radius : Math.random() * maxRadius + 1,
            color : shades[Math.random() * shades.length],
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
        }

        particles.push(particle);
    }

    for (let i = 0; i < particleCount; i++) {
        createParticle();
    }

    const updateParticles = () => {
        for (let i = 0; i < particleCount; i++) {
            const p = particles[i];

            p.x += p.vx;
            p.y += p.vy;
            if (p.x + p.radius > canvas.width || p.x - p.radius < 0) {
                p.vx *= -1;
            }
            if (p.y + p.radius > canvas.height || p.y - p.radius < 0) {
                p.vy *= -1;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#000000");
      gradient.addColorStop(0.5, "#0a1025");
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      updateParticles();
    };

    resize();
    draw();

    document.addEventListener("resize", resize);
    return () => {
      removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

export default AnimatedBackground;
