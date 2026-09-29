import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useCycloneStore } from '../store/useCycloneStore';

export function IntroAnimation() {
  const setIntroComplete = useCycloneStore(state => state.setIntroComplete);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 1: Geostationary coordinate lock (0.4s)
    const t1 = setTimeout(() => setPhase(1), 400);
    // Phase 2: Observatory identification (1.0s)
    const t2 = setTimeout(() => setPhase(2), 1000);
    // Phase 3: Telemetry handshake (1.6s)
    const t3 = setTimeout(() => setPhase(3), 1600);
    // Phase 4: Complete fade (2.3s)
    const t4 = setTimeout(() => {
      setPhase(4);
      setTimeout(() => setIntroComplete(true), 600);
    }, 2300);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [setIntroComplete]);

  return (
    <AnimatePresence>
      {phase < 4 && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ocean-950 font-sans"
          exit={{ opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Subtle GIS grid backdrop */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />

          {/* Phase 1: Precision Crosshair Lock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full border border-sky-400/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-ir rounded-full shadow-[0_0_8px_#38bdf8]" />
            </div>
            <div className="absolute w-24 h-px bg-sky-400/25" />
            <div className="absolute h-24 w-px bg-sky-400/25" />
          </motion.div>

          {/* Phase 3: Calibrated Radar Range Rings */}
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.25, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute w-[360px] h-[360px] border border-ocean-700 rounded-full border-dashed pointer-events-none"
            />
          )}

          {/* Phase 2: Institutional Brand Identification */}
          <div className="relative z-10 flex flex-col items-center justify-center mt-28 font-mono">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-2 mb-2 px-2.5 py-0.5 rounded bg-ocean-900 border border-ocean-800 text-[10px] text-text-muted tracking-widest uppercase"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-confidence animate-operational-blip" />
              <span>INSAT-3DR TELEMETRY CALIBRATION</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, filter: 'blur(6px)', y: 8 }}
              animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)', y: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-3xl sm:text-4xl font-bold tracking-[0.25em] text-white uppercase"
            >
              CYCLONET
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={phase >= 2 ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-[10px] tracking-[0.35em] text-text-muted mt-1 uppercase"
            >
              NORTH INDIAN OCEAN EARLY WARNING SYSTEM
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
