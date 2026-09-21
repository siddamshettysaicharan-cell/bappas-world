/**
 * Touch Virtual Joystick for Mobile Game Controls
 * Provides fluid 360-degree analog navigation in Ganesha World.
 */

import React, { useEffect, useRef, useState } from 'react';

interface Props {
  onMove: (dx: number, dy: number) => void;
  onStop: () => void;
}

export const VirtualJoystick: React.FC<Props> = ({ onMove, onStop }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const radius = 45;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;

      const rect = el.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      setActive(true);
      updateTouch(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchIdRef.current) {
          updateTouch(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          setActive(false);
          setKnobPos({ x: 0, y: 0 });
          onStop();
          break;
        }
      }
    };

    const updateTouch = (clientX: number, clientY: number) => {
      const dx = clientX - centerRef.current.x;
      const dy = clientY - centerRef.current.y;
      const dist = Math.hypot(dx, dy);

      const clampedDist = Math.min(dist, radius);
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      setKnobPos({ x: kx, y: ky });
      onMove(kx / radius, ky / radius);
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onMove, onStop]);

  return (
    <div
      ref={containerRef}
      className="relative w-28 h-28 rounded-full bg-black/40 border-2 border-amber-500/40 backdrop-blur-xs flex items-center justify-center pointer-events-auto touch-none shadow-[0_0_20px_rgba(245,158,11,0.2)]"
    >
      <div className="absolute w-12 h-12 rounded-full border border-amber-500/20 pointer-events-none" />
      <div
        className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border border-amber-200 shadow-md transition-transform duration-75"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          opacity: active ? 1 : 0.75,
        }}
      />
    </div>
  );
};
