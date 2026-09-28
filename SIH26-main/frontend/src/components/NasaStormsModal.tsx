import { useEffect, useState, useMemo } from "react";
import {
  Globe,
  Wind,
  Gauge,
  Layers,
  MapPin,
  Calendar,
  ExternalLink,
  RefreshCw,
  Search,
  X,
  Eye,
  AlertCircle,
  ShieldAlert,
  Share2,
  Navigation,
  Loader2,
  Compass,
  Scan,
} from "lucide-react";
import { motion } from "framer-motion";
import { YoloScannerModal } from "./YoloScannerModal";

export interface NasaGeometry {
  date: string;
  longitude: number;
  latitude: number;
  magnitude_value: number | null;
  magnitude_unit: string | null;
}

export interface NasaIndicators {
  wind_speed_knots: number;
  wind_speed_kmh: number;
  wind_speed_mph: number;
  atkinson_holliday_pressure_hpa: number;
  dvorak_t_number: string;
  dvorak_ci_number: number;
  dvorak_stage: string;
  dvorak_description: string;
  imd_category_code: string;
  imd_category_name: string;
  imd_severity: string;
  imd_damage: string;
  saffir_simpson_category: string;
  saffir_simpson_name: string;
  saffir_simpson_level: number;
  beaufort_scale: number;
}

export interface NasaStormEvent {
  id: string;
  title: string;
  description: string;
  link: string;
  closed: string | null;
  is_active: boolean;
  latest_date: string;
  date_str: string;
  latitude: number;
  longitude: number;
  latest_coordinates: [number, number];
  basin: string;
  region: string;
  wind_speed_knots: number;
  indicators: NasaIndicators;
  track: NasaGeometry[];
  bbox: string;
  gibs_wms_url: string;
  gibs_proxy_url: string;
}

interface NasaStormsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectStormForMap?: (storm: NasaStormEvent) => void;
}

const BASIN_TABS = [
  "ALL BASINS",
  "Bay of Bengal",
  "Arabian Sea",
  "Pacific",
  "Atlantic",
  "Indian Ocean",
] as const;

const GIBS_LAYERS = [
  {
    id: "MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m",
    name: "MODIS Terra (TrueColor + Coastlines)",
    desc: "EOS AM-1 Sun-synchronous 10:30 AM equator crossing",
  },
  {
    id: "VIIRS_SNPP_CorrectedReflectance_TrueColor,Coastlines_15m",
    name: "VIIRS Suomi-NPP (TrueColor + Coastlines)",
    desc: "JPSS Day/Night radiometer with high spatial clarity",
  },
  {
    id: "MODIS_Aqua_CorrectedReflectance_TrueColor,Coastlines_15m",
    name: "MODIS Aqua (TrueColor + Coastlines)",
    desc: "EOS PM-1 Sun-synchronous 1:30 PM afternoon pass",
  },
];

const INDIA_BBOX = {
  minLat: 5.0,
  minLon: 65.0,
  maxLat: 36.5,
  maxLon: 98.5,
  bboxStr: "5.0000,65.0000,36.5000,98.5000",
};

export function NasaStormsModal({
  open,
  onClose,
  onSelectStormForMap,
}: NasaStormsModalProps) {
  const [events, setEvents] = useState<NasaStormEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState("NASA EONET v3");
  const [selectedStormId, setSelectedStormId] = useState<string | null>(null);

  // Filters
  const [selectedBasinTab, setSelectedBasinTab] = useState<string>("ALL BASINS");
  const [activeOnly, setActiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // GIBS Satellite Viewer Controls
  const [selectedLayer, setSelectedLayer] = useState<string>(GIBS_LAYERS[0].id);
  const [viewScope, setViewScope] = useState<"INDIA" | "REGIONAL" | "STORM" | "TIGHT">("INDIA");
  const [deltaSpan, setDeltaSpan] = useState<number>(5.0); // +-5 degrees
  const [useProxy, setUseProxy] = useState<boolean>(true);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(-1);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [yoloModalOpen, setYoloModalOpen] = useState<boolean>(false);

  // Fetch NASA Events from Backend
  const fetchEvents = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/nasa/events");
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch NASA EONET data`);
      const data = await res.json();
      const stormList: NasaStormEvent[] = data.events || [];
      setEvents(stormList);
      setDataSource(data.source || "NASA EONET v3");

      if (stormList.length > 0 && (!selectedStormId || isRefresh)) {
        setSelectedStormId(stormList[0].id);
        setSelectedTrackIndex(stormList[0].track.length - 1);
      }
    } catch (err: any) {
      console.error("NASA API Error:", err);
      setError(err.message || "Failed to connect to NASA EONET services");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchEvents();
    }
  }, [open]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Currently selected storm
  const selectedStorm = useMemo(() => {
    return events.find((e) => e.id === selectedStormId) || events[0] || null;
  }, [events, selectedStormId]);

  // Track point currently highlighted (defaults to latest)
  const currentObservation = useMemo(() => {
    if (!selectedStorm || !selectedStorm.track || selectedStorm.track.length === 0) {
      return null;
    }
    const idx =
      selectedTrackIndex >= 0 && selectedTrackIndex < selectedStorm.track.length
        ? selectedTrackIndex
        : selectedStorm.track.length - 1;
    return selectedStorm.track[idx];
  }, [selectedStorm, selectedTrackIndex]);

  // When selected storm changes, reset observation index to latest
  useEffect(() => {
    if (selectedStorm && selectedStorm.track.length > 0) {
      setSelectedTrackIndex(selectedStorm.track.length - 1);
    }
  }, [selectedStormId]);

  // Filtered storm list
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Active toggle
      if (activeOnly && !ev.is_active) return false;

      // Basin tab
      if (selectedBasinTab !== "ALL BASINS") {
        const basinLower = selectedBasinTab.toLowerCase();
        const matchesBasin =
          ev.basin.toLowerCase().includes(basinLower) ||
          ev.region.toLowerCase().includes(basinLower);
        if (!matchesBasin) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesId = ev.id.toLowerCase().includes(q);
        const matchesBasin = ev.basin.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesBasin) return false;
      }

      return true;
    });
  }, [events, selectedBasinTab, activeOnly, searchQuery]);

  // Compute dynamic GIBS WMS & Proxy URLs for current storm & track point
  const gibsUrls = useMemo(() => {
    if (!selectedStorm || !currentObservation) return { direct: "", proxy: "", bbox: "" };

    const lat = currentObservation.latitude;
    const lon = currentObservation.longitude;
    const date = currentObservation.date.slice(0, 10);

    let bbox = "";
    if (viewScope === "INDIA") {
      bbox = INDIA_BBOX.bboxStr;
    } else {
      const span = viewScope === "REGIONAL" ? 12.0 : viewScope === "TIGHT" ? 3.0 : deltaSpan;
      const minLat = Math.max(-90, lat - span).toFixed(4);
      const maxLat = Math.min(90, lat + span).toFixed(4);
      const minLon = Math.max(-180, lon - span).toFixed(4);
      const maxLon = Math.min(180, lon + span).toFixed(4);
      bbox = `${minLat},${minLon},${maxLat},${maxLon}`;
    }

    const direct = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${encodeURIComponent(
      selectedLayer
    )}&CRS=EPSG:4326&BBOX=${bbox}&TIME=${date}&WIDTH=900&HEIGHT=700&FORMAT=image/jpeg`;

    const proxy = `/api/nasa/gibs-image?lat=${lat.toFixed(4)}&lon=${lon.toFixed(
      4
    )}&date=${date}&bbox=${bbox}&delta=${deltaSpan}&layer=${encodeURIComponent(
      selectedLayer
    )}&width=900&height=700&format=image/jpeg`;

    return { direct, proxy, bbox };
  }, [selectedStorm, currentObservation, selectedLayer, viewScope, deltaSpan]);

  // Precise marker coordinates in percentage on satellite image
  const markerPosition = useMemo(() => {
    if (!currentObservation) return { x: 50, y: 50 };

    if (viewScope === "INDIA") {
      const minLat = INDIA_BBOX.minLat;
      const maxLat = INDIA_BBOX.maxLat;
      const minLon = INDIA_BBOX.minLon;
      const maxLon = INDIA_BBOX.maxLon;
      const x = ((currentObservation.longitude - minLon) / (maxLon - minLon)) * 100;
      const y = ((maxLat - currentObservation.latitude) / (maxLat - minLat)) * 100;
      return {
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y)),
      };
    }

    return { x: 50, y: 50 };
  }, [currentObservation, viewScope]);

  // Historical Track points mapped to complete India coordinates
  const trackSvgPoints = useMemo(() => {
    if (viewScope !== "INDIA" || !selectedStorm?.track) return [];
    const minLat = INDIA_BBOX.minLat;
    const maxLat = INDIA_BBOX.maxLat;
    const minLon = INDIA_BBOX.minLon;
    const maxLon = INDIA_BBOX.maxLon;

    return selectedStorm.track.map((pt) => {
      const x = ((pt.longitude - minLon) / (maxLon - minLon)) * 100;
      const y = ((maxLat - pt.latitude) / (maxLat - minLat)) * 100;
      return {
        x: Math.max(2, Math.min(98, x)),
        y: Math.max(2, Math.min(98, y)),
        date: pt.date,
        kts: pt.magnitude_value,
      };
    });
  }, [selectedStorm, viewScope]);

  const activeImageUrl = useProxy ? gibsUrls.proxy : gibsUrls.direct;

  const handleCopyUrl = () => {
    if (activeImageUrl) {
      navigator.clipboard.writeText(
        useProxy ? `${window.location.origin}${activeImageUrl}` : gibsUrls.direct
      );
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      {/* Light dismiss click listener on backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-[1720px] h-[94vh] flex flex-col bg-ocean-950 border border-ocean-700/80 rounded-xl shadow-2xl overflow-hidden text-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── TOP HEADER ── */}
        <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-ocean-800 bg-ocean-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
              <Globe size={18} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm sm:text-base font-bold font-sans tracking-wider uppercase text-white flex items-center gap-2">
                  NASA EARTH OBSERVATORY
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    ZERO-KEY API
                  </span>
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  EONET v3 &amp; GIBS WMS
                </span>
              </div>
              <p className="text-[10px] font-mono text-text-muted mt-0.5 flex items-center gap-2">
                <span>Near-Real-Time Severe Storm Tracking</span>
                <span>•</span>
                <span>Atkinson-Holliday Pressure Engine</span>
                <span>•</span>
                <span>Dvorak Technique CI / T-Classification</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchEvents(true)}
              disabled={refreshing}
              className="h-8 px-3 rounded-md bg-ocean-850 border border-ocean-750 text-text-muted hover:text-white hover:bg-ocean-800 transition-all flex items-center gap-1.5 text-xs font-mono font-medium disabled:opacity-50"
              title="Refresh NASA Feeds"
            >
              <RefreshCw
                size={12}
                className={refreshing ? "animate-spin text-sky-400" : "text-text-muted"}
              />
              <span className="hidden sm:inline">REFRESH</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-ocean-850 border border-ocean-750 text-text-muted hover:text-white hover:bg-alert/20 hover:border-alert/40 transition-all flex items-center justify-center"
              title="Close NASA Dashboard (ESC)"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* ── WORKSPACE GRID ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* ══════════════════════════════════════════════════════════════
              COL 1: STORM SELECTOR & OCEANIC BASINS (3.5 cols)
          ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 xl:col-span-3.5 border-b lg:border-b-0 lg:border-r border-ocean-800/90 flex flex-col bg-ocean-950/70 overflow-hidden">
            {/* Search and Active Toggle */}
            <div className="p-3 border-b border-ocean-800/80 space-y-2.5 bg-ocean-900/40">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  placeholder="Search NASA storm name, ID, or basin…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded bg-ocean-950 border border-ocean-750 text-xs font-mono text-text-primary placeholder:text-text-faint focus:outline-none focus:border-sky-400/60"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Basin Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {BASIN_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedBasinTab(tab)}
                    className={`px-2 py-1 rounded text-[10px] font-mono tracking-wider whitespace-nowrap transition-all ${
                      selectedBasinTab === tab
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold"
                        : "bg-ocean-900 text-text-muted border border-ocean-800 hover:text-text-primary hover:bg-ocean-850"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Active Toggle & Feed Meta */}
              <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-text-primary">
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
                    className="rounded border-ocean-700 text-sky-500 focus:ring-0 focus:ring-offset-0 bg-ocean-900"
                  />
                  <span>Active Events Only</span>
                </label>
                <span className="text-text-faint">
                  {filteredEvents.length} of {events.length} storms
                </span>
              </div>
            </div>

            {/* Storms List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
              {error && (
                <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[10px] font-mono flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-text-muted gap-2 font-mono text-xs">
                  <Loader2 size={20} className="animate-spin text-sky-400" />
                  <span>Connecting to NASA EONET v3…</span>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-text-muted gap-2 font-mono text-xs text-center px-4">
                  <AlertCircle size={20} className="text-amber-400" />
                  <span>No severe storms match the selected basin or query.</span>
                </div>
              ) : (
                filteredEvents.map((storm) => {
                  const isSelected = selectedStorm?.id === storm.id;
                  const isNorthIndianOcean =
                    storm.basin.includes("Bay of Bengal") ||
                    storm.basin.includes("Arabian Sea");

                  return (
                    <button
                      key={storm.id}
                      onClick={() => setSelectedStormId(storm.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-2 relative ${
                        isSelected
                          ? "bg-ocean-850 border-sky-500/60 shadow-lg shadow-sky-950/40"
                          : "bg-ocean-900/60 border-ocean-800/80 hover:bg-ocean-850/70 hover:border-ocean-700"
                      }`}
                    >
                      {/* Active Indicator & Title */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              storm.is_active
                                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"
                                : "bg-slate-500"
                            }`}
                          />
                          <h3 className="text-xs font-bold font-mono tracking-wide text-white truncate">
                            {storm.title}
                          </h3>
                        </div>

                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-semibold flex-shrink-0 ${
                            isNorthIndianOcean
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-ocean-800 text-text-muted border border-ocean-700"
                          }`}
                        >
                          {storm.basin}
                        </span>
                      </div>

                      {/* Coordinates, Date & Wind Speed */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                        <div className="flex items-center gap-1.5">
                          <Compass size={11} className="text-sky-400 flex-shrink-0" />
                          <span>
                            {Math.abs(storm.latitude).toFixed(1)}°
                            {storm.latitude >= 0 ? "N" : "S"},{" "}
                            {Math.abs(storm.longitude).toFixed(1)}°
                            {storm.longitude >= 0 ? "E" : "W"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-sky-300 font-semibold">
                          <Wind size={11} className="text-sky-400" />
                          <span>{storm.wind_speed_knots} kts</span>
                        </div>
                      </div>

                      {/* Calculated Badges Footer */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-ocean-800/60 text-[9px] font-mono">
                        <span className="px-1.5 py-0.2 rounded bg-ocean-950 text-slate-300 border border-ocean-800">
                          {storm.indicators.atkinson_holliday_pressure_hpa} hPa
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/50">
                          {storm.indicators.dvorak_t_number}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded border font-semibold ${
                            storm.indicators.wind_speed_knots >= 100
                              ? "bg-red-500/15 text-red-300 border-red-500/30"
                              : storm.indicators.wind_speed_knots >= 64
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {storm.indicators.imd_category_code}
                        </span>
                        <span className="ml-auto text-text-faint">
                          {storm.latest_date.slice(0, 10)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Source credit footer */}
            <div className="p-2.5 border-t border-ocean-800 bg-ocean-950 text-[10px] font-mono text-text-muted flex items-center justify-between">
              <span>{dataSource}</span>
              <a
                href="https://eonet.gsfc.nasa.gov/"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>Docs</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COL 2: REAL NASA GIBS WMS SATELLITE RASTER VIEWER (5 cols)
          ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 xl:col-span-5.5 flex flex-col border-b lg:border-b-0 lg:border-r border-ocean-800/90 bg-ocean-950 overflow-hidden">
            {/* Viewer Controls Toolbar */}
            <div className="p-3 border-b border-ocean-800/80 bg-ocean-900/50 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] font-mono text-text-primary font-bold">
                  <Layers size={13} className="text-sky-400" />
                  <span>GIBS WMS RASTER</span>
                </div>

                {/* Layer Selector */}
                <select
                  value={selectedLayer}
                  onChange={(e) => {
                    setSelectedLayer(e.target.value);
                    setImageLoading(true);
                  }}
                  className="h-7 px-2 rounded bg-ocean-850 border border-ocean-750 text-[10px] font-mono text-text-secondary focus:outline-none focus:border-sky-400"
                >
                  {GIBS_LAYERS.map((lyr) => (
                    <option key={lyr.id} value={lyr.id}>
                      {lyr.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Geographic View Extent Selector */}
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <span className="text-text-muted">EXTENT:</span>
                <button
                  onClick={() => {
                    setViewScope("INDIA");
                    setImageLoading(true);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all flex items-center gap-1 ${
                    viewScope === "INDIA"
                      ? "bg-sky-500/25 text-sky-200 border border-sky-400/60 font-bold shadow-[0_0_10px_rgba(56,189,248,0.25)]"
                      : "bg-ocean-850 text-text-muted border border-ocean-750 hover:text-white"
                  }`}
                  title="View Complete India with Cyclone Information"
                >
                  <Globe size={11} className={viewScope === "INDIA" ? "text-sky-300" : "text-text-muted"} />
                  <span>COMPLETE INDIA</span>
                </button>

                <button
                  onClick={() => {
                    setViewScope("REGIONAL");
                    setDeltaSpan(12.0);
                    setImageLoading(true);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    viewScope === "REGIONAL"
                      ? "bg-sky-500/25 text-sky-200 border border-sky-400/60 font-bold"
                      : "bg-ocean-850 text-text-muted border border-ocean-750 hover:text-white"
                  }`}
                  title="Regional basin view (±12°)"
                >
                  REGIONAL (±12°)
                </button>

                <button
                  onClick={() => {
                    setViewScope("STORM");
                    setDeltaSpan(5.0);
                    setImageLoading(true);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    viewScope === "STORM"
                      ? "bg-sky-500/25 text-sky-200 border border-sky-400/60 font-bold"
                      : "bg-ocean-850 text-text-muted border border-ocean-750 hover:text-white"
                  }`}
                  title="Storm Focus view (±5°)"
                >
                  STORM (±5°)
                </button>

                <button
                  onClick={() => {
                    setViewScope("TIGHT");
                    setDeltaSpan(3.0);
                    setImageLoading(true);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    viewScope === "TIGHT"
                      ? "bg-sky-500/25 text-sky-200 border border-sky-400/60 font-bold"
                      : "bg-ocean-850 text-text-muted border border-ocean-750 hover:text-white"
                  }`}
                  title="Core Eye view (±3°)"
                >
                  EYE (±3°)
                </button>

                {/* YOLO AI Scan Trigger */}
                <button
                  onClick={() => setYoloModalOpen(true)}
                  className="px-2.5 py-0.5 rounded text-[10px] font-mono transition-all bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center gap-1 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)] ml-2"
                  title="Run YOLOv8 AI Model to Scan Complete India for Cyclonic Formations"
                >
                  <Scan size={11} className="text-emerald-400" />
                  <span>YOLO SCAN</span>
                </button>
              </div>
            </div>

            {/* Satellite Image Frame */}
            <div className="flex-1 min-h-0 relative bg-black flex items-center justify-center overflow-hidden group">
              {/* Spinner while loading */}
              {imageLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-sky-400 gap-2 font-mono text-xs">
                  <Loader2 size={24} className="animate-spin text-sky-400" />
                  <span>Streaming NASA Satellite Tiles (EPSG:4326)…</span>
                </div>
              )}

              {activeImageUrl ? (
                <img
                  key={activeImageUrl}
                  src={activeImageUrl}
                  alt={`NASA GIBS Satellite Tile for ${selectedStorm?.title || "Storm"}`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    // If direct failed due to CORS, switch to proxy
                    if (!useProxy) setUseProxy(true);
                  }}
                  className="w-full h-full object-contain select-none transition-transform duration-300"
                />
              ) : (
                <div className="text-text-muted font-mono text-xs">
                  Select a storm to view satellite raster.
                </div>
              )}

              {/* Historical Track Line across India on Satellite Image */}
              {trackSvgPoints.length > 1 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <polyline
                    points={trackSvgPoints.map((p) => `${p.x}%,${p.y}%`).join(" ")}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                    className="drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
                  />
                  {trackSvgPoints.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={`${p.x}%`}
                      cy={`${p.y}%`}
                      r={idx === selectedTrackIndex ? "5" : "3"}
                      fill={idx === selectedTrackIndex ? "#ef4444" : "#38bdf8"}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
                    />
                  ))}
                </svg>
              )}

              {/* Crosshair / Reticle Overlay & Cyclone Info Tag */}
              {currentObservation && (
                <div
                  className="absolute pointer-events-none z-20 transition-all duration-300"
                  style={{
                    left: `${markerPosition.x}%`,
                    top: `${markerPosition.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* Targeting reticle */}
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-sky-400/40 animate-ping opacity-40" />
                    <div className="w-10 h-10 rounded-full border border-sky-400/80 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-[0_0_8px_#ef4444]" />
                    <div className="absolute w-14 h-px bg-sky-400/60" />
                    <div className="absolute h-14 w-px bg-sky-400/60" />
                  </div>

                  {/* Cyclone Info Tag Overlay pointing to the storm */}
                  <div
                    className={`absolute z-30 pointer-events-auto bg-ocean-950/92 border border-sky-500/60 backdrop-blur-md rounded-lg p-2.5 shadow-2xl min-w-[210px] max-w-[250px] transition-all ${
                      markerPosition.x > 62
                        ? "right-12 top-1/2 -translate-y-1/2"
                        : "left-12 top-1/2 -translate-y-1/2"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 border-b border-ocean-800 pb-1 mb-1.5">
                      <span className="text-[11px] font-bold text-white uppercase font-sans truncate">
                        {selectedStorm?.title || "Active Storm"}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 whitespace-nowrap">
                        {selectedStorm?.indicators.dvorak_t_number || "T2.5"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[9px] font-mono">
                      <div>
                        <span className="text-text-muted block text-[8px] uppercase">COORDINATES</span>
                        <span className="text-sky-300 font-bold">
                          {currentObservation.latitude.toFixed(2)}°N, {currentObservation.longitude.toFixed(2)}°E
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px] uppercase">WIND SPEED</span>
                        <span className="text-white font-bold">
                          {selectedStorm?.wind_speed_knots} kts ({selectedStorm?.indicators.wind_speed_kmh} km/h)
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px] uppercase">EST. PRESSURE</span>
                        <span className="text-sky-300 font-bold">
                          {selectedStorm?.indicators.atkinson_holliday_pressure_hpa} hPa
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px] uppercase">IMD SCALE</span>
                        <span className="text-white font-bold truncate">
                          {selectedStorm?.indicators.imd_category_code}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1.5 pt-1 border-t border-ocean-800/80 text-[8px] font-mono text-text-faint flex items-center justify-between">
                      <span className="text-sky-400 font-semibold">{selectedStorm?.basin}</span>
                      <span>{currentObservation.date.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* HUD Coordinates Bar (Overlaid on image) */}
              <div className="absolute bottom-2 left-2 right-2 px-3 py-2 rounded-md bg-ocean-950/85 backdrop-blur-md border border-ocean-700/60 text-[10px] font-mono flex flex-wrap items-center justify-between gap-2 shadow-lg z-20">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-red-400" />
                  <span className="text-white font-bold">
                    {currentObservation?.latitude.toFixed(2)}°N,{" "}
                    {currentObservation?.longitude.toFixed(2)}°E
                  </span>
                  <span className="text-ocean-700">|</span>
                  <span className="text-sky-300">
                    {viewScope === "INDIA"
                      ? "VIEW: COMPLETE INDIA [5°N–36.5°N, 65°E–98.5°E]"
                      : `BBOX: [${gibsUrls.bbox || "DYNAMIC"}]`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-text-muted" />
                  <span className="text-text-secondary">
                    {currentObservation?.date.slice(0, 10)}
                  </span>
                  <span className="text-ocean-700">|</span>
                  <span className="text-emerald-400">EPSG:4326</span>
                </div>
              </div>
            </div>

            {/* Satellite Viewer Bottom Bar: Track Point Selector & Controls */}
            <div className="p-3 border-t border-ocean-800/80 bg-ocean-900/60 space-y-2">
              {/* Timeline Track Points Scrubber */}
              {selectedStorm && selectedStorm.track.length > 1 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                    <span className="flex items-center gap-1">
                      <Navigation size={10} className="text-sky-400" />
                      OBSERVATION TRACK TIMELINE ({selectedStorm.track.length} FIXES)
                    </span>
                    <span className="text-sky-300">
                      Fix {selectedTrackIndex + 1} of {selectedStorm.track.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                    {selectedStorm.track.map((pt, idx) => {
                      const isFixSelected = selectedTrackIndex === idx;
                      return (
                        <button
                          key={`${pt.date}-${idx}`}
                          onClick={() => {
                            setSelectedTrackIndex(idx);
                            setImageLoading(true);
                          }}
                          className={`px-2 py-1 rounded text-[9px] font-mono whitespace-nowrap transition-all flex items-center gap-1 ${
                            isFixSelected
                              ? "bg-sky-500/25 text-white border border-sky-400/60 font-bold shadow-sm"
                              : "bg-ocean-950 text-text-muted border border-ocean-800 hover:text-white hover:bg-ocean-850"
                          }`}
                        >
                          <span>{pt.date.slice(5, 16).replace("T", " ")}Z</span>
                          {pt.magnitude_value && (
                            <span className="text-sky-300">({pt.magnitude_value}kt)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Utility Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {/* Proxy Toggle */}
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-text-muted">FEED MODE:</span>
                  <button
                    onClick={() => {
                      setUseProxy(!useProxy);
                      setImageLoading(true);
                    }}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      useProxy
                        ? "bg-sky-500/15 text-sky-300 border-sky-500/30 font-semibold"
                        : "bg-ocean-850 text-text-muted border-ocean-750"
                    }`}
                    title="Proxies via FastAPI backend /api/nasa/gibs-image to eliminate CORS & canvas tainting"
                  >
                    {useProxy ? "FASTAPI PROXY (/api/nasa/gibs-image)" : "DIRECT NASA WMS"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyUrl}
                    className="h-7 px-2.5 rounded bg-ocean-850 border border-ocean-750 text-[10px] font-mono text-text-muted hover:text-white hover:bg-ocean-800 transition-all flex items-center gap-1.5"
                    title="Copy WMS GetMap Query URL"
                  >
                    <Share2 size={11} />
                    <span>{copiedUrl ? "COPIED WMS!" : "COPY WMS URL"}</span>
                  </button>

                  <a
                    href={`https://worldview.earthdata.nasa.gov/?v=${
                      currentObservation ? currentObservation.longitude - 5 : 0
                    },${currentObservation ? currentObservation.latitude - 5 : 0},${
                      currentObservation ? currentObservation.longitude + 5 : 0
                    },${
                      currentObservation ? currentObservation.latitude + 5 : 0
                    }&t=${currentObservation ? currentObservation.date.slice(0, 10) : ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-7 px-2.5 rounded bg-ocean-850 border border-ocean-750 text-[10px] font-mono text-sky-400 hover:text-sky-300 hover:bg-ocean-800 transition-all flex items-center gap-1.5"
                    title="Open storm region in NASA Worldview full explorer"
                  >
                    <span>WORLDVIEW</span>
                    <ExternalLink size={11} />
                  </a>

                  {onSelectStormForMap && selectedStorm && (
                    <button
                      onClick={() => onSelectStormForMap(selectedStorm)}
                      className="h-7 px-2.5 rounded bg-sky-500/20 border border-sky-400/40 text-[10px] font-mono font-semibold text-sky-200 hover:bg-sky-500/30 transition-all flex items-center gap-1.5"
                      title="Load coordinates into main CycloneWatch map"
                    >
                      <Navigation size={11} className="text-sky-400" />
                      <span>PLOT TO MAP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COL 3: CALCULATED METEOROLOGICAL INDICATORS (3.5 cols)
          ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-3 xl:col-span-3 flex flex-col bg-ocean-950/90 overflow-y-auto p-4 space-y-4">
            {selectedStorm ? (
              <>
                {/* Storm Title Card */}
                <div className="p-3.5 rounded-lg bg-ocean-900 border border-ocean-800 space-y-1.5 shadow-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold text-sky-400">
                      {selectedStorm.id}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                        selectedStorm.is_active
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-700/40 text-slate-300 border border-slate-600/40"
                      }`}
                    >
                      {selectedStorm.is_active ? "LIVE TELEMETRY" : "BEST TRACK ARCHIVE"}
                    </span>
                  </div>
                  <h2 className="text-base font-bold font-sans text-white tracking-wide">
                    {selectedStorm.title}
                  </h2>
                  <p className="text-[10px] font-mono text-text-muted leading-relaxed">
                    {selectedStorm.description ||
                      "NASA Global Severe Storm Natural Event Observation"}
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-text-faint">
                    <Globe size={11} className="text-text-muted" />
                    <span>{selectedStorm.region}</span>
                  </div>
                </div>

                {/* 1. ATKINSON-HOLLIDAY EQUATION CENTRAL PRESSURE */}
                <div className="p-3.5 rounded-lg bg-gradient-to-br from-ocean-900 via-ocean-900 to-ocean-850 border border-ocean-750 space-y-2.5 shadow-subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-amber-300">
                      <Gauge size={14} className="text-amber-400" />
                      <span>ATKINSON-HOLLIDAY PRESSURE</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      WPR 1977
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
                      {selectedStorm.indicators.atkinson_holliday_pressure_hpa}
                      <span className="text-sm font-normal text-text-muted ml-1.5">
                        hPa
                      </span>
                    </div>

                    <div className="text-right text-[10px] font-mono">
                      <span className="text-amber-400 font-semibold">
                        ΔP: -
                        {(
                          1010 - selectedStorm.indicators.atkinson_holliday_pressure_hpa
                        ).toFixed(1)}{" "}
                        hPa
                      </span>
                      <p className="text-text-faint">from 1010 standard</p>
                    </div>
                  </div>

                  {/* Pressure bar gauge */}
                  <div className="w-full bg-ocean-950 rounded-full h-2 overflow-hidden border border-ocean-800">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            5,
                            ((1013 -
                              selectedStorm.indicators.atkinson_holliday_pressure_hpa) /
                              140) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="p-2 rounded bg-ocean-950/70 border border-ocean-800 text-[9px] font-mono text-text-muted leading-relaxed">
                    <span className="text-text-secondary font-semibold">Formula: </span>
                    Pc = 1010 - (Vmax / 6.7)^1.553 (Atkinson &amp; Holliday empirical
                    wind-pressure model).
                  </div>
                </div>

                {/* 2. DVORAK TECHNIQUE CLASSIFICATION */}
                <div className="p-3.5 rounded-lg bg-gradient-to-br from-ocean-900 via-ocean-900 to-ocean-850 border border-ocean-750 space-y-2.5 shadow-subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-sky-300">
                      <Eye size={14} className="text-sky-400" />
                      <span>DVORAK TECHNIQUE (CI / T)</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-500/30 font-bold">
                      {selectedStorm.indicators.dvorak_t_number}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white font-mono">
                      {selectedStorm.indicators.dvorak_stage}
                    </p>
                    <p className="text-[10px] font-mono text-text-muted leading-relaxed">
                      {selectedStorm.indicators.dvorak_description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2 rounded bg-ocean-950/60 border border-ocean-800">
                      <span className="text-text-muted block text-[9px]">T-NUMBER</span>
                      <span className="text-white font-bold text-sm">
                        {selectedStorm.indicators.dvorak_t_number}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-ocean-950/60 border border-ocean-800">
                      <span className="text-text-muted block text-[9px]">CURRENT INTENSITY</span>
                      <span className="text-white font-bold text-sm">
                        CI {selectedStorm.indicators.dvorak_ci_number.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. IMD & SAFFIR-SIMPSON CATEGORIES */}
                <div className="p-3.5 rounded-lg bg-ocean-900 border border-ocean-750 space-y-3 shadow-subtle">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-text-primary">
                    <ShieldAlert size={14} className="text-red-400" />
                    <span>OPERATIONAL DISASTER SCALES</span>
                  </div>

                  {/* IMD Category */}
                  <div className="p-2.5 rounded bg-ocean-950 border border-ocean-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-text-muted">
                        IMD SCALE (RSMC NEW DELHI)
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        {selectedStorm.indicators.imd_category_code}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white font-mono">
                      {selectedStorm.indicators.imd_category_name}
                    </p>
                    <p className="text-[9px] font-mono text-text-muted">
                      {selectedStorm.indicators.imd_damage}
                    </p>
                  </div>

                  {/* Saffir-Simpson Category */}
                  <div className="p-2.5 rounded bg-ocean-950 border border-ocean-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-text-muted">
                        SAFFIR-SIMPSON HURRICANE SCALE
                      </span>
                      <span className="text-[10px] font-mono font-bold text-sky-300">
                        {selectedStorm.indicators.saffir_simpson_category}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white font-mono">
                      {selectedStorm.indicators.saffir_simpson_name}
                    </p>
                  </div>
                </div>

                {/* 4. KINEMATIC SPEEDS & BEAUFORT */}
                <div className="p-3 rounded-lg bg-ocean-900/60 border border-ocean-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                    <span className="flex items-center gap-1.5 text-text-primary font-bold">
                      <Wind size={12} className="text-sky-400" />
                      SUSTAINED KINEMATICS
                    </span>
                    <span className="text-sky-300 font-semibold">
                      Force {selectedStorm.indicators.beaufort_scale} (Beaufort)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded bg-ocean-950 border border-ocean-800">
                      <span className="text-xs font-bold text-white block">
                        {selectedStorm.indicators.wind_speed_knots}
                      </span>
                      <span className="text-[9px] text-text-muted">KNOTS (KT)</span>
                    </div>
                    <div className="p-2 rounded bg-ocean-950 border border-ocean-800">
                      <span className="text-xs font-bold text-white block">
                        {selectedStorm.indicators.wind_speed_kmh}
                      </span>
                      <span className="text-[9px] text-text-muted">KM / H</span>
                    </div>
                    <div className="p-2 rounded bg-ocean-950 border border-ocean-800">
                      <span className="text-xs font-bold text-white block">
                        {selectedStorm.indicators.wind_speed_mph}
                      </span>
                      <span className="text-[9px] text-text-muted">MI / H</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-text-muted font-mono text-xs">
                Select a storm to compute meteorological indicators.
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* YOLO Satellite Formation Scanner Modal */}
      <YoloScannerModal
        open={yoloModalOpen}
        onClose={() => setYoloModalOpen(false)}
        initialDate={currentObservation?.date.slice(0, 10)}
      />
    </div>
  );
}
