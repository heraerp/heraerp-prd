'use client';

import { useEffect, useState } from 'react';

export function CivicFlowGlow() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Main glow that follows cursor */}
      <div
        className="absolute h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]"
        style={{
          background: 'radial-gradient(circle at center, var(--glow1) 0%, var(--glow2) 100%)',
          left: mousePos.x - 300,
          top: mousePos.y - 300,
          transition: 'all 0.3s cubic-bezier(0.17, 0.55, 0.55, 1)',
        }}
      />
      
      {/* Ambient corner glows */}
      <div
        className="absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-30 blur-[120px]"
        style={{
          background: 'radial-gradient(circle at center, var(--glow1) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-30 blur-[120px]"
        style={{
          background: 'radial-gradient(circle at center, var(--glow2) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}