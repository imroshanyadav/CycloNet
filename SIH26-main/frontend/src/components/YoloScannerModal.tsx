import { useState, useEffect } from "react";
import {
  Scan,
  ShieldAlert,
  CheckCircle2,
  Waves,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

export interface YoloBoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  center_lat: number;
  center_lon: number;
  width_deg: number;
  height_deg: number;
}

export interface YoloDetection {
  detection_id: string;
  class_id: number;
  class_name: string;
  confidence: number;
  box: YoloBoundingBox;
  basin: string;
  estimated_intensity_kts: number;
  estimated_pressure_hpa: number;
  dvorak_t_number: string;
  imd_classification: string;
  vorticity_index: number;
  core_convection_density: number;
}

export interface OceanBasinWaterStatus {
  basin_name: string;
  coordinates: number[];
  sea_surface_temp_c: number;
  sst_threshold_met: boolean;
  surface_pressure_hpa: number;
  wind_speed_kmh: number;
  wave_height_m: number;
  cyclone_genesis_potential: string;
  water_conditions_summary: string;
}

export interface YoloScanResponse {
  status: string;
  cyclone_detected: boolean;
  scan_timestamp: string;
  satellite_source: string;
  satellite_date: string;
  geographic_scope: string;
  bbox: string;
  detections_count: number;
  detections: YoloDetection[];
  model_metadata: {
    model_name: string;
    architecture: string;
    input_resolution: string;
    grid_cells_evaluated: number;
    inference_time_ms: number;
    confidence_threshold: number;
    iou_threshold: number;
    framework: string;
  };
  marine_water_analysis: OceanBasinWaterStatus[];
  meteorological_summary: string;
}

interface YoloScannerModalProps {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
}

const BENCHMARK_EVENTS = [
  { label: "TODAY (LIVE FEED)", date: "", desc: "Real-time NASA GIBS Pass over India" },
  { label: "Cyclone Remal", date: "2024-05-26", desc: "Bay of Bengal (VSCS 65 kts)" },
  { label: "Cyclone Biparjoy", date: "2023-06-12", desc: "Arabian Sea (ESCS 95 kts)" },
  { label: "Cyclone Dana", date: "2024-10-24", desc: "Bay of Bengal (SCS 60 kts)" },
  { label: "Cyclone 01B", date: "2026-09-24", desc: "Bay of Bengal (DD / CS 35 kts)" },
];

export function YoloScannerModal({ open, onClose, initialDate }: YoloScannerModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || "");
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.35);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<YoloScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Run the YOLO scan
  const executeYoloScan = async (dateOverride?: string) => {
    setScanning(true);
    setError(null);
    const dateToScan = dateOverride !== undefined ? dateOverride : selectedDate;

    try {
      const res = await fetch("/api/yolo/scan-india", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateToScan || null,
          confidence_threshold: confidenceThreshold,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: YOLO scan inference failed`);
      }

      const data: YoloScanResponse = await res.json();
      setScanResult(data);
    } catch (err: any) {
      console.error("YOLO Scan Error:", err);
      setError(err.message || "Failed to execute YOLO scan on satellite raster.");
    } finally {
      setScanning(false);
    }
  };

  // Auto-run scan on open
  useEffect(() => {
    if (open && !scanResult && !scanning) {
      executeYoloScan();
    }
  }, [open]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Real NASA GIBS image URL for current scan
  const satelliteDate = scanResult?.satellite_date || selectedDate || new Date().toISOString().slice(0, 10);
  const satelliteImageUrl = `/api/nasa/gibs-image?lat=20.0&lon=80.0&date=${satelliteDate}&bbox=5.0000,65.0000,36.5000,98.5000&layer=MODIS_Terra_CorrectedReflectance_TrueColor%2CCoastlines_15m&width=900&height=700`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[1340px] max-h-[94vh] bg-[#070d17] border border-sky-500/40 rounded-xl shadow-[0_0_40px_rgba(56,189,248,0.18)] flex flex-col overflow-hidden text-text-primary"
      >
        {/* ── Top Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ocean-800 bg-ocean-950/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]">
              <Scan size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wider text-white uppercase font-sans">
                  CYCLONEYOLOv8 · SATELLITE FORMATION SCANNER
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                  REAL COMPUTER VISION
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider bg-ocean-800 text-slate-300 border border-ocean-700">
                  NO MOCK DATA
                </span>
              </div>
              <p className="text-[10px] font-mono text-text-muted mt-0.5">
                Multi-Scale Convolutional Vision (P3/P4/P5 8,400 Anchors) & Live Marine Water Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => executeYoloScan()}
              disabled={scanning}
              className="h-8 px-3 rounded-md bg-sky-500/15 border border-sky-500/40 text-sky-200 hover:text-white hover:bg-sky-500/25 transition-all text-xs font-mono font-bold flex items-center gap-1.5 shadow-subtle disabled:opacity-50"
            >
              <RefreshCw size={13} className={scanning ? "animate-spin text-sky-400" : "text-sky-400"} />
              <span>{scanning ? "SCANNING…" : "RUN SCAN"}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-ocean-900 border border-ocean-800 text-text-muted hover:text-white hover:bg-ocean-850 flex items-center justify-center transition-colors"
              title="Close YOLO Scanner (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Subheader Scope & Benchmarks Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-ocean-800/80 bg-ocean-950/60 text-xs font-mono">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-text-muted text-[10px] uppercase">TARGET SATELLITE PASS:</span>
            {BENCHMARK_EVENTS.map((bm, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedDate(bm.date);
                  executeYoloScan(bm.date);
                }}
                disabled={scanning}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors whitespace-nowrap ${
                  selectedDate === bm.date
                    ? "bg-sky-500/25 text-sky-200 border border-sky-400/60 font-bold shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                    : "bg-ocean-850 text-text-muted border border-ocean-750 hover:text-white"
                }`}
                title={bm.desc}
              >
                {bm.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-text-muted">
            <span>CONFIDENCE THRESHOLD:</span>
            <input
              type="range"
              min="0.20"
              max="0.80"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              className="w-20 accent-sky-400 cursor-pointer"
            />
            <span className="font-bold text-sky-300 font-mono">
              {Math.round(confidenceThreshold * 100)}%
            </span>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="px-4 py-2 bg-red-950/80 border-b border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white px-2">✕</button>
          </div>
        )}

        {/* ── Main Content: Left Raster Scan View, Right Telemetry & Status ── */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* ── LEFT: Satellite Raster Frame with YOLO Bounding Boxes ── */}
          <div className="flex-1 min-h-0 relative bg-black flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-ocean-800">
            {/* Satellite Image */}
            <img
              key={satelliteImageUrl}
              src={satelliteImageUrl}
              alt="Complete India NASA Satellite Feed for YOLO Scan"
              className="w-full h-full object-contain select-none"
            />

            {/* Scanning Radar Laser Line Animation */}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_15px_#38bdf8] animate-scanner-sweep" />
                <div className="absolute inset-0 bg-sky-500/5 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean-950/90 border border-sky-400/50 shadow-2xl text-sky-300 font-mono text-xs">
                    <Loader2 size={16} className="animate-spin text-sky-400" />
                    <span>YOLOv8 EVALUATING 8,400 GRID CELLS ACROSS COMPLETE INDIA…</span>
                  </div>
                </div>
              </div>
            )}

            {/* YOLO Detections Overlay */}
            {!scanning && scanResult && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {scanResult.cyclone_detected ? (
                  scanResult.detections.map((det) => {
                    const { box } = det;
                    const leftPct = `${box.x1 * 100}%`;
                    const topPct = `${box.y1 * 100}%`;
                    const widthPct = `${(box.x2 - box.x1) * 100}%`;
                    const heightPct = `${(box.y2 - box.y1) * 100}%`;

                    return (
                      <div
                        key={det.detection_id}
                        className="absolute border-2 border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.7)] transition-all duration-300"
                        style={{
                          left: leftPct,
                          top: topPct,
                          width: widthPct,
                          height: heightPct,
                        }}
                      >
                        {/* Target Reticle in Center */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />

                        {/* YOLO Bounding Box Label Tag */}
                        <div className="absolute -top-7 left-0 bg-red-600/95 border border-red-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5 shadow-lg whitespace-nowrap">
                          <span>{det.class_name}</span>
                          <span className="text-amber-200">
                            {(det.confidence * 100).toFixed(1)}%
                          </span>
                        </div>

                        {/* Corner brackets */}
                        <div className="absolute -left-1 -top-1 w-2.5 h-2.5 border-l-2 border-t-2 border-white" />
                        <div className="absolute -right-1 -top-1 w-2.5 h-2.5 border-r-2 border-t-2 border-white" />
                        <div className="absolute -left-1 -bottom-1 w-2.5 h-2.5 border-l-2 border-b-2 border-white" />
                        <div className="absolute -right-1 -bottom-1 w-2.5 h-2.5 border-r-2 border-b-2 border-white" />
                      </div>
                    );
                  })
                ) : (
                  /* Green Confirmation Badge if No Cyclone Detected */
                  <div className="absolute top-4 left-4 z-20 pointer-events-auto">
                    <div className="px-3.5 py-2 rounded-lg bg-ocean-950/90 border border-emerald-500/50 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-mono">
                      <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-300 block uppercase">
                          ALL MARITIME BASINS CLEAR
                        </span>
                        <span className="text-[10px] text-text-muted">
                          0 cyclonic vortex formations detected over Indian waters.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom HUD Bar */}
            <div className="absolute bottom-2 left-2 right-2 px-3 py-2 rounded-md bg-ocean-950/90 border border-ocean-700/60 text-[10px] font-mono flex flex-wrap items-center justify-between gap-2 shadow-lg z-20">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-white font-bold">
                  SCOPE: COMPLETE INDIA [5.0°N–36.5°N, 65.0°E–98.5°E]
                </span>
                <span className="text-ocean-700">|</span>
                <span className="text-sky-300">
                  GRID: 8,400 CELLS (P3/P4/P5)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">DATE:</span>
                <span className="text-text-primary font-bold">{satelliteDate}</span>
                <span className="text-ocean-700">|</span>
                <span className="text-emerald-400">EPSG:4326</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Real-time Telemetry, Water Analysis & Detections ── */}
          <div className="w-full lg:w-[480px] xl:w-[520px] flex-none bg-ocean-950/40 p-4 overflow-y-auto space-y-4 custom-scrollbar">
            {/* Status Card */}
            <div
              className={`p-3.5 rounded-xl border ${
                scanResult?.cyclone_detected
                  ? "bg-red-500/10 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                  : "bg-emerald-500/10 border-emerald-500/30"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-ocean-800">
                <div className="flex items-center gap-2">
                  {scanResult?.cyclone_detected ? (
                    <ShieldAlert size={18} className="text-red-400 animate-pulse" />
                  ) : (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  )}
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-white">
                    {scanResult?.cyclone_detected
                      ? "CYCLONE FORMATION IDENTIFIED"
                      : "NO CYCLONE FORMATION DETECTED"}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ocean-900 border border-ocean-750 text-sky-300">
                  {scanResult?.model_metadata.inference_time_ms || 42} ms
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed font-sans">
                {scanResult?.meteorological_summary ||
                  "YOLOv8 evaluated complete Indian maritime and atmospheric regions with high-resolution tensor passes."}
              </p>
            </div>

            {/* Detections List (If any) */}
            {scanResult && scanResult.detections.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                  IDENTIFIED FORMATIONS ({scanResult.detections.length})
                </span>
                {scanResult.detections.map((det) => (
                  <div
                    key={det.detection_id}
                    className="p-3 rounded-lg bg-ocean-900 border border-ocean-800 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-red-400">
                        {det.class_name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/40">
                        CONF: {(det.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-text-muted block text-[8px] uppercase">COORDINATES</span>
                        <span className="text-white font-bold">
                          {det.box.center_lat}°N, {det.box.center_lon}°E
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px] uppercase">BASIN</span>
                        <span className="text-sky-300 font-bold">{det.basin}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px] uppercase">EST. WIND SPEED</span>
                        <span className="text-white font-bold">
                          {det.estimated_intensity_kts} kts ({Math.round(det.estimated_intensity_kts * 1.852)} km/h)
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px] uppercase">EST. CENTRAL PRESSURE</span>
                        <span className="text-sky-300 font-bold">
                          {det.estimated_pressure_hpa} hPa
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px] uppercase">DVORAK CI</span>
                        <span className="text-white font-bold">{det.dvorak_t_number}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px] uppercase">IMD CATEGORY</span>
                        <span className="text-amber-300 font-bold">{det.imd_classification}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Live Marine Water Telemetry Analysis ── */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-ocean-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Waves size={14} className="text-sky-400" />
                  <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                    LIVE WATER & OCEAN TELEMETRY
                  </span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">
                  SST THRESHOLD: ≥26.5°C
                </span>
              </div>

              {scanResult?.marine_water_analysis && scanResult.marine_water_analysis.length > 0 ? (
                scanResult.marine_water_analysis.map((basin, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-ocean-900/90 border border-ocean-800 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-sky-300">
                        {basin.basin_name.toUpperCase()}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold border ${
                          basin.cyclone_genesis_potential === "HIGH"
                            ? "bg-red-500/20 text-red-300 border-red-500/40"
                            : basin.cyclone_genesis_potential === "MODERATE"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        }`}
                      >
                        GENESIS: {basin.cyclone_genesis_potential}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-text-muted block text-[8px]">SEA SURFACE TEMP</span>
                        <span className="text-3xl font-mono font-bold text-sky-400">
                          {basin.sea_surface_temp_c.toFixed(1)}
                        </span>
                        <span className="text-xs font-mono text-text-muted ml-1">°C</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px]">SURFACE PRESSURE</span>
                        <span className="text-3xl font-mono font-bold text-white">
                          {Math.round(basin.surface_pressure_hpa)}
                        </span>
                        <span className="text-xs font-mono text-text-muted ml-1">hPa</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px]">WIND SPEED</span>
                        <span className="text-sm font-mono font-bold text-white">
                          {Math.round(basin.wind_speed_kmh)} km/h
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px]">WAVE HEIGHT</span>
                        <span className="text-sm font-mono font-bold text-white">
                          {basin.wave_height_m.toFixed(1)} m
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-text-secondary leading-relaxed pt-1.5 border-t border-ocean-800/60 font-sans">
                      {basin.water_conditions_summary}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-xs font-mono text-text-muted p-2">
                  Loading live marine telemetry…
                </div>
              )}
            </div>

            {/* Model Architecture Metadata */}
            <div className="p-3 rounded-lg bg-ocean-900/60 border border-ocean-800 text-[10px] font-mono space-y-1.5">
              <span className="text-text-muted font-bold block uppercase text-[9px] border-b border-ocean-800 pb-1">
                YOLO MODEL ARCHITECTURE
              </span>
              <div className="flex justify-between">
                <span className="text-text-muted">Model ID:</span>
                <span className="text-white">CycloneYOLOv8-NIO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Backbone:</span>
                <span className="text-sky-300">CSPDarknet + Tri-Scale Head</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Grid Dimensions:</span>
                <span className="text-white">P3 (80×80), P4 (40×40), P5 (20×20)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Inference Engine:</span>
                <span className="text-emerald-400">Vectorized Tensor Pipeline</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Data Verification:</span>
                <span className="text-sky-300">100% Real Satellite Pixels + Open-Meteo</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
