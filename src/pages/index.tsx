import { home } from 'virtual:content';
import { useState, useRef, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'motion/react';

type Tab = 'spinner' | 'ball';

function FloatingBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur-blobs">
            <feGaussianBlur stdDeviation="60" />
          </filter>
        </defs>
        {home.blobs.map((b, i) => (
          <motion.circle
            key={i}
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            fill={`hsl(var(${b.varName}))`}
            opacity={0.45}
            filter="url(#blur-blobs)"
            animate={{
              cx: [b.cx, `calc(${b.cx} + ${b.dx}px)`, b.cx],
              cy: [b.cy, `calc(${b.cy} + ${b.dy}px)`, b.cy],
            }}
            transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Fidget Spinner ──────────────────────────────────────────────────────────
function FidgetSpinner() {
  const rotation = useMotionValue(0);
  const velocity = useRef(0);
  const lastAngle = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const [glowIntensity, setGlowIntensity] = useState(0);

  const getAngle = useCallback((clientX: number, clientY: number) => {
    if (!centerRef.current) return 0;
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }, []);

  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (spinnerRef.current) {
      const rect = spinnerRef.current.getBoundingClientRect();
      centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    isDragging.current = true;
    lastAngle.current = getAngle(clientX, clientY);
    lastTime.current = performance.now();
    velocity.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [getAngle]);

  const onDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current || lastAngle.current === null || lastTime.current === null) return;
    const now = performance.now();
    const dt = now - lastTime.current;
    if (dt === 0) return;
    const angle = getAngle(clientX, clientY);
    let delta = angle - lastAngle.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    velocity.current = (delta / dt) * 16;
    rotation.set(rotation.get() + delta);
    lastAngle.current = angle;
    lastTime.current = now;
  }, [getAngle, rotation]);

  const endDrag = useCallback(() => {
    isDragging.current = false;
    lastAngle.current = null;
    const friction = 0.985;
    const animate = () => {
      velocity.current *= friction;
      rotation.set(rotation.get() + velocity.current);
      setGlowIntensity(Math.min(Math.abs(velocity.current) / 3, 1));
      if (Math.abs(velocity.current) > 0.05) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        velocity.current = 0;
        setGlowIntensity(0);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [rotation]);

  const blur = useTransform(rotation, () => {
    const s = Math.abs(velocity.current);
    return s > 2 ? `blur(${Math.min(s * 0.4, 3)}px)` : 'blur(0px)';
  });

  return (
    <div className="flex flex-col items-center justify-center flex-1 select-none">
      <p className="mb-8 text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
        Click and drag to spin - GH1
      </p>
      <div
        ref={spinnerRef}
        className="relative cursor-grab active:cursor-grabbing"
        style={{ width: 260, height: 260 }}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => onDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
        onTouchMove={(e) => { const t = e.touches[0]; onDrag(t.clientX, t.clientY); }}
        onTouchEnd={endDrag}
      >
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{ opacity: glowIntensity, scale: 1 + glowIntensity * 0.08 }}
          transition={{ duration: 0.1 }}
          style={{
            background: `radial-gradient(circle, hsl(var(--zen-lavender) / 0.5) 0%, hsl(var(--zen-sky) / 0.25) 50%, transparent 70%)`,
            filter: `blur(${20 + glowIntensity * 30}px)`,
          }}
        />
        {/* Spinner SVG */}
        <motion.div style={{ rotate: rotation, filter: blur }} className="w-full h-full">
          <svg viewBox="0 0 260 260" width="260" height="260" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="arm1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--zen-white))" />
                <stop offset="100%" stopColor="hsl(var(--zen-lavender))" />
              </radialGradient>
              <radialGradient id="arm2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--zen-white))" />
                <stop offset="100%" stopColor="hsl(var(--zen-sky))" />
              </radialGradient>
              <radialGradient id="arm3" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--zen-white))" />
                <stop offset="100%" stopColor="hsl(var(--zen-peach))" />
              </radialGradient>
              <radialGradient id="center-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--zen-white))" />
                <stop offset="100%" stopColor="hsl(var(--zen-ball-mid))" />
              </radialGradient>
            </defs>
            <ellipse cx="130" cy="60" rx="38" ry="72" fill="url(#arm1)" />
            <ellipse cx="130" cy="60" rx="38" ry="72" fill="url(#arm2)" transform="rotate(120 130 130)" />
            <ellipse cx="130" cy="60" rx="38" ry="72" fill="url(#arm3)" transform="rotate(240 130 130)" />
            <circle cx="130" cy="130" r="28" fill="url(#center-grad)" />
            <circle cx="130" cy="130" r="12" fill="white" opacity="0.7" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Stress Ball ─────────────────────────────────────────────────────────────
interface Ripple {
  id: number;
}

function StressBall() {
  const [squeezeCount, setSqueezeCount] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);

  const scaleX = useSpring(1, { stiffness: 300, damping: 15 });
  const scaleY = useSpring(1, { stiffness: 300, damping: 15 });

  const press = useCallback(() => {
    setIsPressed(true);
    scaleX.set(1.18);
    scaleY.set(0.84);
  }, [scaleX, scaleY]);

  const release = useCallback(() => {
    if (!isPressed) return;
    setIsPressed(false);
    scaleX.set(1);
    scaleY.set(1);
    setSqueezeCount((c) => c + 1);
    const id = ++rippleId.current;
    setRipples((r) => [...r, { id }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 900);
  }, [isPressed, scaleX, scaleY]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 select-none gap-8">
      <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
        Hold and release to squeeze
      </p>
      <div
        className="relative cursor-pointer"
        style={{ width: 240, height: 240 }}
        onMouseDown={press}
        onMouseUp={release}
        onMouseLeave={() => { if (isPressed) release(); }}
        onTouchStart={press}
        onTouchEnd={release}
      >
        {/* Ripples */}
        {ripples.map((rp) => (
          <motion.div
            key={rp.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              x: '-50%',
              y: '-50%',
              border: `2px solid hsl(var(--zen-lavender))`,
            }}
            initial={{ width: 240, height: 240, opacity: 0.7 }}
            animate={{ width: 380, height: 380, opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        ))}
        {/* Ball */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            scaleX,
            scaleY,
            background: `radial-gradient(circle at 38% 35%, hsl(var(--zen-white)) 0%, hsl(var(--zen-ball-mid)) 35%, hsl(var(--zen-lavender)) 65%, hsl(var(--zen-peach)) 100%)`,
            boxShadow: isPressed
              ? `0 8px 40px hsl(var(--zen-lavender) / 0.5), inset 0 4px 20px hsl(var(--zen-shine) / 0.4)`
              : `0 20px 60px hsl(var(--zen-lavender) / 0.38), 0 8px 20px hsl(var(--zen-peach) / 0.25), inset 0 4px 20px hsl(var(--zen-shine) / 0.5)`,
          }}
        >
          {/* Shine */}
          <div
            className="absolute rounded-full"
            style={{
              width: '35%',
              height: '25%',
              top: '18%',
              left: '22%',
              background: `radial-gradient(circle, hsl(var(--zen-shine) / 0.8) 0%, transparent 100%)`,
            }}
          />
        </motion.div>
      </div>

      {/* Squeeze counter */}
      <motion.div
        key={squeezeCount}
        initial={{ scale: 1.3, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="text-center"
      >
        <span className="text-4xl font-bold" style={{ color: 'hsl(var(--primary) / 0.8)' }}>
          {squeezeCount}
        </span>
        <p className="text-xs font-medium mt-1" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
          squeezes
        </p>
      </motion.div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [tab, setTab] = useState<Tab>('spinner');

  return (
    <main
      className="relative flex flex-col"
      style={{ minHeight: '100dvh', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}
    >
      <Helmet>
        <title>ZenZone — Fidget Spinner &amp; Stress Ball</title>
        <meta name="description" content="Relieve stress instantly with ZenZone's interactive fidget spinner and stress ball. A calming, dreamy space to unwind anytime." />
      </Helmet>
      <FloatingBlobs />

      <div className="relative flex flex-col flex-1" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="pt-10 pb-4 flex flex-col items-center gap-6">
          <h1
            className="text-3xl font-bold"
            style={{ color: 'hsl(var(--zen-purple-text))', letterSpacing: '0.08em' }}
          >
            ZenZone
          </h1>

          {/* Tab switcher */}
          <div
            className="flex rounded-full p-1 gap-1"
            style={{
              background: 'hsl(var(--zen-lavender) / 0.18)',
              backdropFilter: 'blur(12px)',
              border: '1px solid hsl(var(--zen-lavender) / 0.35)',
            }}
          >
            {(['spinner', 'ball'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200"
                style={{
                  color: tab === t ? 'hsl(var(--zen-purple-text))' : 'hsl(var(--muted-foreground) / 0.7)',
                }}
              >
                {tab === t && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'hsl(var(--zen-white) / 0.75)',
                      boxShadow: '0 2px 12px hsl(var(--zen-lavender) / 0.4)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {t === 'spinner' ? '🌀 Spinner' : '🫧 Stress Ball'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Activity area */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              className="flex flex-col flex-1"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {tab === 'spinner' ? <FidgetSpinner /> : <StressBall />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer brand */}
        <div className="pb-6 text-center">
          <p
            className="text-xs font-medium"
            style={{ color: 'hsl(var(--zen-lavender-mid) / 0.6)', letterSpacing: '0.12em' }}
          >
            ZENZONE · breathe easy
          </p>
        </div>
      </div>
    </main>
  );
}
