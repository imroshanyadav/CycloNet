import { ChevronDown, Radio, Activity, Archive } from 'lucide-react';
import { useCycloneStore } from '../store/useCycloneStore';
import { CYCLONES } from '../data/cyclones';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function TopNavigation() {
  const { mode, setMode, activeEventId, setActiveCyclone } = useCycloneStore();
  const activeCycloneMeta = CYCLONES.find(c => c.id === activeEventId) || CYCLONES[0];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="relative z-40 w-full h-12 border-b border-ocean-800/90 flex items-center px-4 lg:px-6 gap-6 flex-shrink-0 bg-ocean-900/95 backdrop-blur-md">

      {/* ── Institutional Observatory Identifier ── */}
      <div className="flex items-center gap-2 mr-1 flex-shrink-0">
        <Radio size={14} className="text-ir" />
        <span className="text-[11px] font-bold tracking-[0.14em] text-text-primary uppercase font-mono">
          WORKSTATION CONSOLE
        </span>
      </div>

      <div className="h-4 w-px bg-ocean-800" />

      {/* ── Mode tabs ── */}
      <div className="flex items-center h-full gap-5">
        <button
          onClick={() => setMode('LIVE')}
          className={`flex items-center gap-2 h-12 text-[10px] font-mono font-semibold tracking-wider transition-colors relative
            ${mode === 'LIVE' ? 'text-white' : 'text-text-muted hover:text-text-secondary'}`}
        >
          <Activity size={12} className={mode === 'LIVE' ? 'text-confidence' : 'text-text-faint'} />
          REAL-TIME TELEMETRY (INSAT-3D)
          {mode === 'LIVE' && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-ir"
            />
          )}
        </button>

        <button
          onClick={() => setMode('HISTORICAL')}
          className={`flex items-center gap-2 h-12 text-[10px] font-mono font-semibold tracking-wider transition-colors relative
            ${mode === 'HISTORICAL' ? 'text-white' : 'text-text-muted hover:text-text-secondary'}`}
        >
          <Archive size={12} className={mode === 'HISTORICAL' ? 'text-ir' : 'text-text-faint'} />
          HISTORICAL ARCHIVE & VALIDATION
          {mode === 'HISTORICAL' && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-ir"
            />
          )}
        </button>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Storm Event selector ── */}
      <div className="relative" ref={dropRef}>
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-2.5 h-8 px-3 rounded-md bg-ocean-850 border border-ocean-750
            hover:bg-ocean-800 hover:border-ocean-700 transition-colors shadow-subtle"
        >
          {/* Basin dot */}
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            mode === 'HISTORICAL'
              ? (activeCycloneMeta.basin === 'Arabian Sea' ? 'bg-amber-400' : 'bg-ir')
              : 'bg-ocean-700'
          }`} />
          <span className="text-[11px] font-mono font-medium text-text-primary truncate max-w-[200px]">
            {mode === 'HISTORICAL'
              ? `${activeCycloneMeta.name.toUpperCase()} (${activeCycloneMeta.year})`
              : 'SELECT ARCHIVAL STORM…'}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-ocean-900 text-text-muted border border-ocean-800 hidden sm:inline">
            {activeCycloneMeta.basin}
          </span>
          <ChevronDown size={12} className={`text-text-muted transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{   opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full right-0 mt-1.5 w-80 rounded-lg py-1.5 z-50 shadow-glass overflow-hidden border border-ocean-700 bg-ocean-900/98 backdrop-blur-md"
            >
              {/* Basin groupings */}
              {(['Arabian Sea', 'Bay of Bengal'] as const).map(basin => {
                const group = CYCLONES.filter(c => c.basin === basin);
                if (!group.length) return null;
                return (
                  <div key={basin} className="border-b border-ocean-800/80 last:border-b-0">
                    <div className="px-3.5 py-1.5 text-[9px] font-mono uppercase tracking-widest text-text-faint bg-ocean-950/60 flex items-center justify-between">
                      <span>{basin}</span>
                      <span className="text-ocean-700">{group.length} CASES</span>
                    </div>
                    {group.map(cyclone => (
                      <button
                        key={cyclone.id}
                        onClick={() => { setActiveCyclone(cyclone.id); setDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-ocean-850 transition-colors text-left ${
                          activeEventId === cyclone.id && mode === 'HISTORICAL' ? 'bg-ocean-800/80' : ''
                        }`}
                      >
                        {/* Category intensity indicator */}
                        <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${
                          cyclone.peakWind >= 200 ? 'bg-alert' :
                          cyclone.peakWind >= 150 ? 'bg-amber-400' :
                          cyclone.peakWind >= 100 ? 'bg-sky-400' : 'bg-confidence'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-white tracking-wide font-mono">
                              {cyclone.name.toUpperCase()} {cyclone.year}
                            </p>
                            <span className="text-[9px] font-mono text-text-faint">
                              {cyclone.peakWind} km/h
                            </span>
                          </div>
                          <p className="text-[9px] text-text-muted truncate mt-0.5 font-mono">
                            {cyclone.minPressure} hPa min · {cyclone.landfallRegion}
                            {cyclone.imdGapCase ? ' · [IMD Gap Case]' : ''}
                          </p>
                        </div>
                        {activeEventId === cyclone.id && mode === 'HISTORICAL' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-ir flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
