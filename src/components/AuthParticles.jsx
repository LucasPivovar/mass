import React, { useEffect, useRef } from 'react';

const AuthParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // Particle config – very subtle
    const PARTICLE_COUNT = 55;
    const COLOR_PRIMARY = 'rgba(94, 255, 0,';   // lime
    const COLOR_SECONDARY = 'rgba(63, 168, 0,'; // dark lime

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * W;
        this.y = init ? Math.random() * H : H + 10;
        this.radius = Math.random() * 1.5 + 0.3;
        this.speedY = -(Math.random() * 0.3 + 0.08);
        this.speedX = (Math.random() - 0.5) * 0.12;
        this.opacity = Math.random() * 0.25 + 0.04;
        this.opacityDir = (Math.random() > 0.5 ? 1 : -1) * 0.003;
        this.color = Math.random() > 0.5 ? COLOR_PRIMARY : COLOR_SECONDARY;
        // Subtle twinkling glow radius
        this.glowRadius = this.radius * (Math.random() * 3 + 2);
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity += this.opacityDir;
        if (this.opacity > 0.3 || this.opacity < 0.02) this.opacityDir *= -1;
        if (this.y < -10) this.reset();
      }

      draw() {
        // Soft outer glow
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.glowRadius);
        grd.addColorStop(0, `${this.color} ${this.opacity})`);
        grd.addColorStop(1, `${this.color} 0)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Solid core dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color} ${this.opacity * 2})`;
        ctx.fill();
      }
    }

    const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

    // Subtle grid scanlines overlay effect
    function drawScanlines() {
      ctx.save();
      ctx.globalAlpha = 0.012;
      ctx.strokeStyle = 'rgba(94, 255, 0, 1)';
      ctx.lineWidth = 0.5;
      for (let y = 0; y < H; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function loop() {
      ctx.clearRect(0, 0, W, H);
      drawScanlines();
      particles.forEach(p => { p.update(); p.draw(); });
      animId = requestAnimationFrame(loop);
    }

    loop();

    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 1,
      }}
    />
  );
};

export default AuthParticles;
