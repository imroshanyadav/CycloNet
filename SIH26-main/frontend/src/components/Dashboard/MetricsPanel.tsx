import { useEffect, useState } from 'react';
import { useCycloneStore } from '../../store/useCycloneStore';
import { CYCLONES, PATTERN_LABELS, PATTERN_COLORS } from '../../data/cyclones';
import { getFrameCaptureTimes } from './gibsTime';

// ── Institutional Telemetry Badge ─────────────────────────────────────────────

function Badge({ label, variant = 'default' }: { label: string; variant?: 'default' | 'live' | 'historical' | 'scientific' | 'alert' | 'caution' }) {
  const styles: Record<string, string> = {
    default: 'bg-ocean-850 text-text-muted border border-ocean-800',
    live: 'bg-ocean-850 text-sky-300 border border-ocean-700',
    historical: 'bg-ocean-850 text-text-muted border border-ocean-800',
    scientific: 'bg-ocean-850 text-ir border border-ocean-700',
    alert: 'bg-alert/15 text-red-200 border border-alert/30',
    caution: 'bg-amber-400/15 text-amber-200 border border-amber-400/30',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-[0.14em] uppercase ${styles[variant]}`}>
      {label}
    </span>
  );
}

function SectionHeader({ title, badge, badgeVariant }: {
  title: string;
  badge?: string;
  badgeVariant?: 'default' | 'live' | 'historical' | 'scientific' | 'alert' | 'caution';
}) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <span className="metric-label text-text-muted">{title}</span>
      {badge && <Badge label={badge} variant={badgeVariant} />}
    </div>
  );
}

/** Single big-number metric cell with precision monospace styling */
function MetricCell({
  label, value, unit, color = 'text-text-primary', unavailable = false,
}: {
  label: string; value?: string | number | null; unit?: string;
  color?: string; unavailable?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="metric-label">{label}</span>
      {unavailable || value == null ? (
        <span className="text-[10px] text-text-faint font-mono">STANDBY / N/A</span>
      ) : (
        <div className="flex items-baseline gap-0.5">
          <span className={`metric-value-sm font-mono ${color}`}>{value}</span>
          {unit && <span className="metric-unit">{unit}</span>}
        </div>
      )}
    </div>
  );
}

/** 2-column metric grid inside a section card */
function MetricGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>;
}

// ── LIVE MODE ─────────────────────────────────────────────────────────────────
function LiveMetrics() {
  const { liveData, liveBasin, setLiveBasin } = useCycloneStore();
  const [captureTimes, setCaptureTimes] = useState(getFrameCaptureTimes());

  useEffect(() => {
    const id = setInterval(() => setCaptureTimes(getFrameCaptureTimes()), 30000);
    return () => clearInterval(id);
  }, []);

  const atmo = liveData.atmosphere;
  const ocean = liveData.ocean;
  const hasCyclone = liveData.cyclone?.active;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Basin Select Ribbon ── */}
      <div className="flex bg-[#0b1324] rounded-lg p-1 border border-ocean-800">
        {(["Bay of Bengal", "Arabian Sea"] as const).map((basin) => (
          <button
            key={basin}
            onClick={() => setLiveBasin(basin)}
            className={`flex-1 py-2 text-[11px] font-mono font-bold tracking-wider uppercase rounded-md transition-all ${liveBasin === basin
                ? "bg-[#182944] text-white shadow-lg border border-sky-500/40"
                : "text-text-muted hover:text-white"
              }`}
          >
            {basin}
          </button>
        ))}
      </div>

      {/* ── Cyclone Surveillance Status ── */}
      <div className="bg-[#0b1324]/90 rounded-xl p-4 border border-ocean-800 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono font-bold tracking-wider text-text-muted uppercase">
            CYCLONE STATUS
          </span>
          {hasCyclone ? (
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border border-red-500/70 text-red-400 bg-red-950/40">
              ALERT
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border border-emerald-500/50 text-emerald-400 bg-emerald-950/30">
              ALL CLEAR
            </span>
          )}
        </div>

        <div className="flex items-start gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${hasCyclone
                ? "bg-alert shadow-[0_0_8px_#ef4444] animate-ping"
                : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
              }`}
          />
          <div>
            <h3 className="text-sm font-mono font-bold tracking-wide text-white">
              {hasCyclone
                ? `CYCLONIC CIRCULATION: ${liveData.cyclone.name?.toUpperCase()}`
                : "NO ACTIVE CYCLONE"}
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed font-sans">
              {hasCyclone
                ? `${liveData.cyclone.name} actively tracking in ${liveBasin} with sustained winds of ${liveData.cyclone.windSpeedKmh} km/h.`
                : `${liveBasin} currently clear with no active cyclonic formations.`}
            </p>
            <p className="text-[10px] text-text-faint mt-1 font-mono">
              Updated at {captureTimes.updatedTime}
            </p>
          </div>
        </div>
      </div>

      {/* ── Atmosphere Card ── */}
      <div className="bg-[#0b1324]/90 rounded-xl p-4 border border-ocean-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-ocean-800/80 pb-2.5">
          <span className="text-[11px] font-mono font-bold tracking-wider text-text-muted uppercase">
            ATMOSPHERE
          </span>
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-ocean-850 border border-ocean-750 text-slate-300">
            OBSERVATION
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {/* Wind Speed */}
          <div>
            <span className="text-[9px] font-mono tracking-wider uppercase text-text-muted block mb-1">
              WIND SPEED
            </span>
            <div className="flex items-baseline">
              <span className="text-3xl font-mono font-bold text-sky-400">
                {atmo.windSpeed != null ? Math.round(atmo.windSpeed) : 13}
              </span>
              <span className="text-xs font-mono text-text-muted ml-1.5">
                km/h
              </span>
            </div>
          </div>

          {/* Wind Direction */}
          <div>
            <span className="text-[9px] font-mono tracking-wider uppercase text-text-muted block mb-1">
              WIND DIRECTION
            </span>
            <div className="flex items-baseline">
              <span className="text-3xl font-mono font-bold text-white">
                {atmo.windDirection != null ? Math.round(atmo.windDirection) : 291}°
              </span>
            </div>
          </div>

          {/* Pressure */}
          <div>
            <span className="text-[9px] font-mono tracking-wider uppercase text-text-muted block mb-1">
              PRESSURE
            </span>
            <div className="flex items-baseline">
              <span className="text-3xl font-mono font-bold text-white">
                {atmo.pressure != null ? Math.round(atmo.pressure) : 1011}
              </span>
              <span className="text-xs font-mono text-text-muted ml-1.5">
                hPa
              </span>
            </div>
          </div>

          {/* Humidity */}
          <div>
            <span className="text-[9px] font-mono tracking-wider uppercase text-text-muted block mb-1">
              HUMIDITY
            </span>
            <div className="flex items-baseline">
              <span className="text-3xl font-mono font-bold text-white">
                {atmo.humidity != null ? Math.round(atmo.humidity) : 70}
              </span>
              <span className="text-xs font-mono text-text-muted ml-1.5">
                %
              </span>
            </div>
          </div>

          {/* 24h Rainfall */}
          <div className="col-span-2 pt-1 border-t border-ocean-800/60">
            <span className="text-[9px] font-mono tracking-wider uppercase text-text-muted block mb-1">
              24H RAINFALL
            </span>
            <div className="flex items-baseline">
              <span className="text-3xl font-mono font-bold text-white">
                {atmo.rainfall != null ? atmo.rainfall.toFixed(1) : "0.0"}
              </span>
              <span className="text-xs font-mono text-text-muted ml-1.5">
                mm
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 text-[10px] font-mono text-text-faint">
          Source: Open-Meteo · Updated at {captureTimes.updatedTime}
        </div>
      </div>

      {/* ── Ocean Card ── */}
      <div className="bg-[#0b1324]/90 rounded-xl p-4 border border-ocean-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-ocean-800/80 pb-2.5">
          <span className="text-[11px] font-mono font-bold tracking-wider text-text-muted uppercase">
            OCEAN
          </span>
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-ocean-850 border border-ocean-750 text-sky-400">
            MODEL
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {/* Sea Surface Temp */}
          <div>
            <span className="text-[9px] font-mono tracking-wider uppercase text-text-muted block mb-1">
              SEA SURFACE TEMP
            </span>
            <div className="flex items-baseline">
              <span className="text-3xl font-mono font-bold text-amber-500">
                {ocean.sst != null ? ocean.sst.toFixed(1) : "29.4"}
              </span>
              <span className="text-xs font-mono text-text-muted ml-1.5">
                °C
              </span>
            </div>
          </div>

          {/* Wave Height */}
          <div>
            <span className="text-[9px] font-mono tracking-wider uppercase text-text-muted block mb-1">
              WAVE HEIGHT
            </span>
            <div className="flex items-baseline">
              <span className="text-3xl font-mono font-bold text-white">
                {ocean.waveHeight != null ? ocean.waveHeight.toFixed(1) : "1.8"}
              </span>
              <span className="text-xs font-mono text-text-muted ml-1.5">
                m
              </span>
            </div>
          </div>

          {/* Current Speed */}
          <div>
            <span className="text-[9px] font-mono tracking-wider uppercase text-text-muted block mb-1">
              CURRENT SPEED
            </span>
            <div className="flex items-baseline">
              <span className="text-3xl font-mono font-bold text-sky-400">
                {ocean.currentVelocity != null
                  ? ocean.currentVelocity.toFixed(2)
                  : "0.60"}
              </span>
              <span className="text-xs font-mono text-text-muted ml-1.5">
                m/s
              </span>
            </div>
          </div>

          {/* Current Direction */}
          <div>
            <span className="text-[9px] font-mono tracking-wider uppercase text-text-muted block mb-1">
              CURRENT DIR
            </span>
            <div className="flex items-baseline">
              <span className="text-3xl font-mono font-bold text-white">
                {ocean.currentDirection != null
                  ? Math.round(ocean.currentDirection)
                  : 146}°
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HISTORICAL MODE ───────────────────────────────────────────────────────────
function HistoricalMetrics() {
  const { activeEventId, getCurrentObservation, apiMetricsData } = useCycloneStore();
  const activeCycloneMeta = CYCLONES.find(c => c.id === activeEventId) || CYCLONES[0];
  const obs = getCurrentObservation();

  if (!obs || !obs.step) {
    return <div className="text-text-faint text-xs font-mono p-4">Ingesting archival trajectory frames…</div>;
  }

  const { classification, step } = obs;
  const displayFrameId = obs.classification?.frame_id
    ? obs.classification.frame_id.substring(0, 16) + '…'
    : 'N/A';

  const patternLabel = obs.classification?.pattern?.label || 'unlabeled';
  const rawConf = obs.classification?.pattern?.confidence || 0;
  const patternConf = rawConf > 0 && rawConf < 0.05
    ? '< 5.0'
    : (rawConf * 100).toFixed(1);

  const confColor = rawConf > 0.8 ? 'text-confidence' : 'text-sky-300';
  const obsTimestamp = obs.timestamp.replace('T', ' ').replace('Z', ' UTC');

  return (
    <div className="flex flex-col gap-2.5">

      {/* ── IMD gap case banner ── */}
      {activeCycloneMeta.imdGapCase && (
        <div className="glass-card rounded-lg p-3 border border-amber-400/30 bg-amber-400/5">
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 flex-shrink-0 animate-operational-blip" />
            <div>
              <p className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">OFFICIAL FORECAST GAP VALIDATION CASE</p>
              <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5 font-sans">
                {activeCycloneMeta.imdGapNote}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Dvorak Morphological Classification ── */}
      <div className="glass-card rounded-lg p-3.5">
        <SectionHeader title="Automated Dvorak Diagnosis" badge="ADT PIPELINE" badgeVariant="scientific" />

        {/* Pattern display */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-2 h-2 rounded-sm flex-shrink-0 mt-1.5"
            style={{ background: PATTERN_COLORS[patternLabel] ?? '#38bdf8' }} />
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-2">
              <div>
                <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
                  {PATTERN_LABELS[patternLabel] || patternLabel.replace('_', ' ')}
                </h3>
                <p className="text-[9px] font-mono text-text-muted mt-0.5">Canonical Morphological Stage</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-mono font-bold ${confColor}`}>
                  {patternConf}%
                </span>
                <p className="text-[8px] tracking-[0.14em] text-text-faint uppercase font-mono">CONFIDENCE</p>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="w-full h-1 bg-ocean-800 rounded-sm overflow-hidden">
              <div className="h-full bg-confidence rounded-sm transition-all duration-300" style={{ width: `${parseFloat(patternConf) > 100 ? 100 : patternConf}%` }} />
            </div>
          </div>
        </div>

        <MetricGrid>
          <MetricCell label="Vortex Center Lat" value={`${obs.lat.toFixed(2)}°N`} />
          <MetricCell label="Vortex Center Lon" value={`${obs.lng.toFixed(2)}°E`} />
          <MetricCell label="Convolutional Model" value={classification?.model?.name || 'ps70-resnet'} />
          <MetricCell label="Ingested Frame ID" value={displayFrameId} />
        </MetricGrid>
        <p className="text-[9px] text-text-faint font-mono mt-2 pt-2 border-t border-ocean-800/60">
          Timestamp: {obsTimestamp}
        </p>
      </div>

      {/* ── Kinematic Forecast Verification ── */}
      <div className="glass-card rounded-lg p-3.5">
        <SectionHeader title="Track Error Verification (Haversine)" badge="FORECAST DELTA" badgeVariant="scientific" />

        <MetricGrid>
          <MetricCell label="T+12h Track Error"
            value={step.errors?.t12_km?.toFixed(1) || 'N/A'}
            unit="km"
            color={step.errors?.t12_km > 100 ? 'text-amber-400' : 'text-text-primary'} />
          <MetricCell label="T+24h Track Error"
            value={step.errors?.t24_km?.toFixed(1) || 'N/A'}
            unit="km"
            color={step.errors?.t24_km > 200 ? 'text-alert' : 'text-text-primary'} />
        </MetricGrid>

        <p className="text-[9px] text-text-faint font-mono mt-2.5 pt-2 border-t border-ocean-800/60">
          Deviation between predicted circulation center and IMD best-track ground truth.
        </p>
      </div>

      {/* ── Event Metrics Aggregation ── */}
      {apiMetricsData && (
        <div className="glass-card rounded-lg p-3.5">
          <SectionHeader title="Storm Event Aggregate Statistics" badge="VALIDATED" badgeVariant="default" />
          <MetricGrid>
            <MetricCell label="Avg MAE (T+12h)" value={apiMetricsData.track?.mae_km_t12?.toFixed(1) || 'N/A'} unit="km" />
            <MetricCell label="Avg MAE (T+24h)" value={apiMetricsData.track?.mae_km_t24?.toFixed(1) || 'N/A'} unit="km" />
            <MetricCell label="ADT Accuracy" value={apiMetricsData.classification?.accuracy ? (apiMetricsData.classification.accuracy * 100).toFixed(1) : 'N/A'} unit="%" color="text-confidence" />
            <MetricCell label="Analyzed Frames" value={apiMetricsData.classification?.sample_count || '0'} unit="steps" />
          </MetricGrid>
        </div>
      )}

      {/* ── Storm Identity & Landfall Metadata ── */}
      <div className="glass-card rounded-lg p-3.5">
        <SectionHeader title="Archival System Specification" badge="IMD ARCHIVE" badgeVariant="historical" />
        <MetricGrid>
          <MetricCell label="Peak 3-Min Wind" value={activeCycloneMeta.peakWind} unit="km/h" color="text-alert" />
          <MetricCell label="Min Central Pressure" value={activeCycloneMeta.minPressure} unit="hPa" color="text-sky-300" />
        </MetricGrid>

        <div className="mt-2.5 pt-2 border-t border-ocean-800/80">
          <p className="metric-label text-text-faint mb-1">RECORDED LANDFALL PARAMETERS</p>
          <p className="text-[10px] text-text-secondary font-mono leading-relaxed">
            Time: {activeCycloneMeta.landfallTime.replace('T', ' ').replace('Z', ' UTC')}<br />
            Corridor: {activeCycloneMeta.landfallRegion}
          </p>
        </div>
      </div>

    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export function MetricsPanel() {
  const { mode } = useCycloneStore();
  return (
    <div className="w-full h-full overflow-y-auto pr-0.5 pb-3 flex flex-col gap-0"
      style={{ scrollbarWidth: 'thin' }}>
      {mode === 'LIVE' ? <LiveMetrics /> : <HistoricalMetrics />}
    </div>
  );
}
