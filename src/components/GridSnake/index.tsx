import React, { useEffect, useRef } from 'react';
import styles from './styles.module.css';

const GridSnake: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<{x: number, y: number}[]>([]);
  const mouseRef = useRef<{x: number, y: number} | null>(null);
  
  // Configuration
  const GRID_SIZE = 40; // Matches the CSS background-size
  const TRAIL_LENGTH = 8;
  const COLOR = '#00f3ff'; // Neon cyan

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
      }
    };
    
    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = null;
    };

    // Attach mouse listener to window or parent for smoother tracking
    canvas.parentElement?.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', handleMouseLeave);

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (mouseRef.current) {
        // Snap mouse to grid
        const gridX = Math.floor(mouseRef.current.x / GRID_SIZE) * GRID_SIZE;
        const gridY = Math.floor(mouseRef.current.y / GRID_SIZE) * GRID_SIZE;

        // Add current position to trail
        // Only add if it's different from the last one (snake moves only when grid changes)
        const lastPos = trailRef.current[0];
        if (!lastPos || lastPos.x !== gridX || lastPos.y !== gridY) {
          trailRef.current.unshift({ x: gridX, y: gridY });
        }
      } else {
        // Retract if mouse is gone
        if (trailRef.current.length > 0) {
          trailRef.current.pop();
        }
      }

      // Trim trail
      if (trailRef.current.length > TRAIL_LENGTH) {
        trailRef.current.pop();
      }

      // Fade out if mouse stops moving (optional, or just keep rendering last known)
      // Actually, let's just render the trail
      trailRef.current.forEach((pos, index) => {
        const opacity = 1 - index / TRAIL_LENGTH;
        const size = GRID_SIZE; // Make exact size
        
        ctx.fillStyle = COLOR;
        ctx.globalAlpha = opacity * 0.6; // Base opacity
        
        // Draw glowing square
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLOR;
        ctx.fillRect(pos.x + 1, pos.y + 1, size, size);
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      requestAnimationFrame(loop);
    };

    const animationId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
};

export default GridSnake;
