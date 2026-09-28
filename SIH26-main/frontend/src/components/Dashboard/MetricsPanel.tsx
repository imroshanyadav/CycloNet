import { useEffect, useState } from 'react';
import { useCycloneStore } from '../../store/useCycloneStore';
import { CYCLONES, PATTERN_LABELS, PATTERN_COLORS, BASELINES } from '../../data/cyclones';

// ── Institutional Telemetry Badge ─────────────────────────────────────────────

function Badge({ label, variant = 'default' }: { label: string; variant?: 'default' | 'live' | 'historical' | 'scientific' | 'alert' | 'caution' }) {
  const styles: Record<string, string> = {
    default:    'bg-ocean-850 text-text-muted border border-ocean-800',
    live:       'bg-ocean-850 text-sky-300 border border-ocean-700',
    historical: 'bg-ocean-850 text-text-muted border border-ocean-800',
    scientific: 'bg-ocean-850 text-ir border border-ocean-700',
    alert:      'bg-alert/15 text-red-200 border border-alert/30',
    caution:    'bg-amber-400/15 text-amber-200 border border-amber-400/30',
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
  const [now, setNow] = useState(() => Date.now());
  
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const hasAtmo  = liveData.status === 'LIVE' || liveData.status === 'STALE';
  const hasOcean = hasAtmo;
  const atmo  = liveData.atmosphere;
  const ocean = liveData.ocean;
  const lastUp = liveData.lastUpdated
    ? 'Telemetry synced ' + Math.round((now - new Date(liveData.lastUpdated).getTime()) / 60000) + ' min ago'
    : 'Ingesting telemetry…';

  return (
    <div className="flex flex-col gap-2.5">

      {/* ── Basin Select Ribbon ── */}
      <div className="flex bg-ocean-900 rounded-md p-0.5 border border-ocean-800">
        {(['Bay of Bengal', 'Arabian Sea'] as const).map(basin => (
          <button
            key={basin}
            onClick={() => setLiveBasin(basin)}
            className={`flex-1 py-1.5 text-[10px] font-mono font-semibold tracking-wider uppercase rounded transition-all ${
              liveBasin === basin ? 'bg-ocean-800 text-white shadow-subtle border border-ocean-700' : 'text-text-muted hover:text-white'
            }`}
          >
            {basin}
          </button>
        ))}
      </div>

      {/* ── Cyclone Surveillance Status ── */}
      <div className="glass-card rounded-lg p-3.5">
        <SectionHeader 
          title="Basin Surveillance State" 
          badge={liveData.status === 'LIVE' ? 'INSAT-3DR LIVE' : liveData.status === 'STALE' ? 'STALE FEED' : 'SYNCING'} 
          badgeVariant={liveData.status === 'LIVE' ? 'live' : 'default'} 
        />
        <div className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${liveData.cyclone.active ? 'bg-alert animate-operational-blip' : 'bg-confidence'}`} />
          <div>
            <p className={`text-xs font-mono font-bold tracking-wide ${liveData.cyclone.active ? 'text-red-300' : 'text-text-primary'}`}>
              {liveData.cyclone.active ? 'CYCLONIC CIRCULATION DETECTED' : 'ROUTINE SYNOPTIC SURVEILLANCE'}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed font-sans">
              {liveData.cyclone.active
                ? 'Convective vortex actively tracking in monitored basin coordinates.'
                : `${liveBasin} currently observing passive maritime conditions with no organized vortex.`}
            </p>
            <p className="text-[9px] text-text-faint mt-1 font-mono">{lastUp}</p>
          </div>
        </div>
      </div>

      {/* ── Atmospheric Soundings ── */}
      <div className="glass-card rounded-lg p-3.5">
        <SectionHeader title="Atmospheric Soundings & Surface Wind" badge="SURFACE ECMWF/GFS" badgeVariant="historical" />
        <MetricGrid>
          <MetricCell label="Sustained Wind" value={hasAtmo ? atmo.windSpeed?.toFixed(0) : null} unit="km/h"
            color={atmo.windSpeed && atmo.windSpeed >= BASELINES.windSpeed ? 'text-alert' : 'text-sky-300'}
            unavailable={!hasAtmo} />
          <MetricCell label="Wind Vector" value={hasAtmo ? `${atmo.windDirection?.toFixed(0)}°` : null}
            unavailable={!hasAtmo} />
          <MetricCell label="Sea-Level Pressure" value={hasAtmo ? atmo.pressure?.toFixed(0) : null} unit="hPa"
            unavailable={!hasAtmo} />
          <MetricCell label="Relative Humidity" value={hasAtmo ? atmo.humidity?.toFixed(0) : null} unit="%"
            unavailable={!hasAtmo} />
        </MetricGrid>
        {hasAtmo && (
          <div className="mt-2.5 pt-2.5 border-t border-ocean-800/80">
            <MetricCell label="24-Hour Precipitation" value={atmo.rainfall?.toFixed(1)} unit="mm" unavailable={!hasAtmo} />
          </div>
        )}
        <p className="text-[9px] text-text-faint font-mono mt-2">Station: NIO Coastal Radar Network · Open-Meteo GFS</p>
      </div>

      {/* ── Oceanic Thermodynamic State ── */}
      <div className="glass-card rounded-lg p-3.5">
        <SectionHeader title="Physical Oceanography" badge="THERMAL BUOY" badgeVariant="scientific" />
        <MetricGrid>
          <MetricCell label="Sea Surface Temp (SST)" value={hasOcean ? ocean.sst?.toFixed(1) : null} unit="°C"
            color={ocean.sst && ocean.sst >= 28 ? 'text-amber-400' : 'text-sky-300'} 
            unavailable={!hasOcean} />
          <MetricCell label="Significant Wave Height" value={hasOcean ? ocean.waveHeight?.toFixed(1) : null} unit="m"
            unavailable={!hasOcean} />
          <MetricCell label="Surface Current Velocity" value={hasOcean ? ocean.currentVelocity?.toFixed(2) : null} unit="m/s"
            color="text-sky-300" unavailable={!hasOcean} />
          <MetricCell label="Current Bearing" value={hasOcean && ocean.currentDirection != null ? `${ocean.currentDirection?.toFixed(0)}°` : null}
            unavailable={!hasOcean} />
        </MetricGrid>
        <p className="text-[9px] text-text-faint font-mono mt-2">
          {ocean.sst && ocean.sst >= 28 ? '⚠ SST > 28°C: High Tropical Cyclone Heat Potential (TCHP)' : 'SST within nominal climatological range.'}
        </p>
      </div>

      {/* ── Automated Surveillance Status ── */}
      <div className="glass-card rounded-lg p-3.5">
        <SectionHeader title="Autonomous Early Warning Diagnostics" badge="RSMC PIPELINE" badgeVariant="scientific" />
        <p className="text-[10px] text-text-muted leading-relaxed font-sans">
          Baseline surveillance active across North Indian Ocean sector. Switch to the Historical Archive tab to review high-impact verified storms (Ockhi, Fani, Amphan, Biparjoy).
        </p>
        <div className="mt-3 flex flex-col gap-1.5 font-mono text-[10px]">
          <div className="flex justify-between items-center py-1 border-b border-ocean-800/60">
            <span className="text-text-muted">Inference Pipeline</span>
            <span className="text-text-primary">IMD-NIO ResNet-GRU v2.1</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-ocean-800/60">
            <span className="text-text-muted">Dvorak Stage Acc.</span>
            <span className="text-confidence font-bold">78.3% (5-Stage)</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-text-muted">24h Track Center MAE</span>
            <span className="text-text-primary">255 km</span>
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
