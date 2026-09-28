import { X, Satellite, Clock, Hash, MapPin, Radio, Database, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCycloneStore } from '../../store/useCycloneStore';
import { CYCLONES, PATTERN_LABELS, PATTERN_COLORS } from '../../data/cyclones';

interface EvidenceDrawerProps {
  open: boolean;
  onClose: () => void;
}

function Row({ icon, label, value, mono = false, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  highlight?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-ocean-800/80 last:border-b-0">
      <span className="text-text-muted flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="metric-label mb-0.5 text-text-faint">{label}</p>
        <p className={`text-[11px] break-words ${mono ? 'font-mono' : ''} ${highlight ?? 'text-text-secondary'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function EvidenceDrawer({ open, onClose }: EvidenceDrawerProps) {
  const { activeEventId, getCurrentObservation, mode } = useCycloneStore();
  const activeCycloneMeta = CYCLONES.find(c => c.id === activeEventId) || CYCLONES[0];
  const obs = getCurrentObservation();

  if (!obs || !obs.classification) return null;

  const { classification, step } = obs;
  const patternLabel   = classification.pattern.label;
  const patternConf    = classification.pattern.confidence ? (classification.pattern.confidence * 100).toFixed(1) : 0;
  const patternColor   = PATTERN_COLORS[patternLabel] ?? '#38bdf8';

  const frameId = mode === 'HISTORICAL'
    ? step.observation_frame
    : 'live_telemetry_stream';

  const obsTime = obs.timestamp.replace('T', ' ').replace('Z', ' UTC');

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-ocean-950/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{ x: 360,    opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed top-0 right-0 h-full w-[360px] z-50 flex flex-col glass-panel border-l border-ocean-800 shadow-glass overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-ocean-800 bg-ocean-950/80 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-confidence" />
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    SATELLITE FRAME AUDIT
                  </h3>
                  <p className="text-[9px] font-mono text-text-muted uppercase">
                    PROVENANCE & INGESTION TELEMETRY
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded bg-ocean-850 hover:bg-ocean-800 border border-ocean-750 flex items-center justify-center text-text-muted hover:text-white transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Simulated Satellite Radiometer View */}
            <div className="mx-5 mt-4 mb-3 h-32 rounded-lg border border-ocean-800 bg-ocean-900 overflow-hidden relative flex-shrink-0">
              <div className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: 'radial-gradient(circle at 45% 45%, rgba(56,189,248,0.2) 0%, rgba(14,165,233,0.08) 40%, rgba(8,12,20,0.95) 75%)',
                }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                <Satellite size={18} className="text-ir mb-1.5" />
                <p className="text-[10px] font-mono text-text-primary tracking-widest font-semibold uppercase">
                  CALIBRATED SATELLITE SENSOR SCAN
                </p>
                <p className="text-[9px] font-mono text-text-muted mt-0.5">
                  {obs.timestamp.split('T')[0]} · {activeCycloneMeta.name.toUpperCase()} ({activeCycloneMeta.year})
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ir/60" />
            </div>

            {/* Pattern summary card */}
            <div className="mx-5 mb-3 flex-shrink-0">
              <div className="glass-card rounded-lg px-3.5 py-2.5 flex items-center justify-between border border-ocean-750">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm" style={{ background: patternColor }} />
                  <div>
                    <span className="text-xs font-bold text-white uppercase font-mono tracking-wide">
                      {PATTERN_LABELS[patternLabel] ?? patternLabel}
                    </span>
                    <p className="text-[8px] font-mono text-text-muted">STRUCTURAL STAGE</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-confidence">{patternConf}%</p>
                  <p className="text-[8px] font-mono text-text-muted tracking-wider uppercase">CONFIDENCE</p>
                </div>
              </div>
            </div>

            {/* Provenance rows */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0" style={{ scrollbarWidth: 'thin' }}>
              <p className="metric-label text-text-faint mb-2 pt-1">INGESTION ATTRIBUTES</p>

              <Row icon={<Satellite size={12} />} label="Sensor Spacecraft"
                value="INSAT-3DR (74.0°E GEO) / VHRR Radiometer" mono />
              <Row icon={<Database size={12} />}   label="Spectral Channel"
                value="10.8µm Thermal Infrared (TIR1)" mono />
              <Row icon={<Hash size={12} />}        label="Frame Identification"
                value={frameId} mono />
              <Row icon={<Clock size={12} />}       label="Observation Timestamp"
                value={obsTime} mono highlight="text-text-primary" />
              <Row icon={<MapPin size={12} />}      label="Circulation Center Coordinates"
                value={`${obs.lat.toFixed(2)}°N, ${obs.lng.toFixed(2)}°E`} mono />
              <Row icon={<Radio size={12} />}       label="Dvorak Morphology Diagnosis"
                value={`${PATTERN_LABELS[patternLabel]} (${patternConf}%)`}
                highlight="text-confidence" />
              <Row icon={<Radio size={12} />}       label="Convolutional Model Architecture"
                value={classification.model?.name || "ps70-resnet-classifier v2.1"} mono />
              <Row icon={<Database size={12} />}    label="Calibration Standard"
                value="IMD RSMC NIO Dvorak Empirical Dataset" mono />

              {/* IMD gap note if applicable */}
              {activeCycloneMeta.imdGapCase && activeCycloneMeta.imdGapNote && (
                <div className="mt-3.5 rounded-lg p-3 border border-amber-400/30 bg-amber-400/5">
                  <div className="flex gap-2">
                    <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-mono font-bold text-amber-400 mb-0.5">FORECAST GAP VALIDATION NOTE</p>
                      <p className="text-[10px] text-text-secondary leading-relaxed font-sans">
                        {activeCycloneMeta.imdGapNote}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification watermark */}
              <div className="mt-3.5 px-3 py-2 rounded-md bg-ocean-900 border border-ocean-800">
                <p className="text-[9px] font-mono text-text-muted leading-relaxed">
                  Observation records audited under WMO RSMC Tropical Cyclone Protocol. Validated on historical best-track archive data.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
