import { Bell, Globe, Home, Radio, Scan } from "lucide-react";
import { useEffect, useState } from "react";
import { AlertSystem } from "./components/AlertSystem";
import { CycloneAnalysis } from "./components/CycloneAnalysis";
import { EvidenceDrawer } from "./components/Dashboard/EvidenceDrawer";
import { MetricsPanel } from "./components/Dashboard/MetricsPanel";
import { SatellitePanel } from "./components/Dashboard/SatellitePanel";
import { IntroAnimation } from "./components/IntroAnimation";
import { LandingPage } from "./components/LandingPage";
import { NasaStormsModal } from "./components/NasaStormsModal";
import { YoloScannerModal } from "./components/YoloScannerModal";
import { TopNavigation } from "./components/TopNavigation";
import { useCycloneStore } from "./store/useCycloneStore";

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [nasaModalOpen, setNasaModalOpen] = useState(false);
  const [yoloModalOpen, setYoloModalOpen] = useState(false);
  const [utcTime, setUtcTime] = useState("");

  const {
    introComplete,
    isPlaying,
    timelineIndex,
    setTimelineIndex,
    mode,
    activeEventId,
    fetchLiveData,
    evidenceOpen,
    openEvidence,
    closeEvidence,
  } = useCycloneStore();

  // Live ticking UTC Zulu clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const yr = d.getUTCFullYear();
      const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
      const da = String(d.getUTCDate()).padStart(2, "0");
      const hr = String(d.getUTCHours()).padStart(2, "0");
      const mi = String(d.getUTCMinutes()).padStart(2, "0");
      const sc = String(d.getUTCSeconds()).padStart(2, "0");
      setUtcTime(`${yr}-${mo}-${da} ${hr}:${mi}:${sc}Z`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch event data when active event changes
  useEffect(() => {
    if (mode === "HISTORICAL") {
      useCycloneStore.getState().fetchEventData(activeEventId);
    }
  }, [mode, activeEventId]);

  // Initial live data fetch
  useEffect(() => {
    if (mode === "LIVE") fetchLiveData();
  }, []);

  // Timeline auto-play
  useEffect(() => {
    if (!isPlaying || mode !== "HISTORICAL") return;
    const total = useCycloneStore.getState().apiReplayData?.steps?.length || 0;
    if (total === 0) return;

    const id = window.setInterval(() => {
      setTimelineIndex(timelineIndex + 1 >= total ? 0 : timelineIndex + 1);
    }, 1600);
    return () => clearInterval(id);
  }, [isPlaying, timelineIndex, mode, setTimelineIndex]);

  return (
    <>
      {/* Landing Page */}
      {showLanding && (
        <LandingPage
          onEnterApp={() => setShowLanding(false)}
          onOpenNasa={() => setNasaModalOpen(true)}
        />
      )}

      {/* Main Dashboard */}
      {!showLanding && (
        <div className="relative w-full min-h-screen overflow-x-hidden flex flex-col p-2.5 lg:p-4 text-text-primary bg-ocean-950">
          {/* Scientific GIS coordinate raster background */}
          <div
            className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10 pointer-events-none opacity-20"
            style={{
              backgroundImage: "url('/satellite_bg.jpg')",
              filter: "brightness(0.3) saturate(0.8) contrast(1.15)",
            }}
          />
          <div className="fixed inset-0 bg-gradient-to-b from-ocean-950/85 via-ocean-950/92 to-ocean-950/98 -z-10 pointer-events-none" />

          {/* Intro splash */}
          {!introComplete && <IntroAnimation />}

          {/* Institutional Command Header */}
          <header
            className="flex justify-between items-center w-full px-1 mb-2.5 transition-opacity duration-700"
            style={{ opacity: introComplete ? 1 : 0 }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLanding(true)}
                className="h-8 px-3 rounded-md bg-ocean-900 border border-ocean-800 flex items-center gap-2 text-text-muted hover:text-white hover:border-ir/40 hover:bg-ocean-850 transition-all text-xs font-medium shadow-subtle"
                title="Return to National Overview Portal"
              >
                <Home size={13} className="text-ir" />
                <span className="hidden sm:inline font-mono tracking-wider text-[10px] uppercase">PORTAL</span>
              </button>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-ocean-850 border border-ocean-800 text-ir">
                  <Radio size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-bold tracking-[0.14em] text-white uppercase leading-none font-sans">
                      CYCLONET
                    </h1>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider bg-ocean-800 text-sky-300 border border-ocean-700">
                      WMO / RSMC SPEC
                    </span>
                  </div>
                  <p className="text-[9px] font-mono tracking-wider text-text-muted uppercase mt-0.5">
                    NORTH INDIAN OCEAN EARLY WARNING WORKSTATION
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Operational Telemetry Clock & Sensor Status */}
              <div className="hidden md:flex items-center gap-2.5 px-3 py-1 rounded-md bg-ocean-900 border border-ocean-800 text-[10px] font-mono text-text-muted shadow-subtle">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-confidence animate-operational-blip" />
                  <span className="text-text-primary font-semibold tracking-wider">{utcTime || "CALIBRATING ZULU…"}</span>
                </div>
                <span className="text-ocean-750">|</span>
                <span className="text-sky-300">INSAT-3DR 74°E (TIR1/WV)</span>
                <span className="text-ocean-750">|</span>
                <span className="text-text-faint">LINK: LOCKED</span>
              </div>

              {/* YOLO Satellite Formation Scanner Button */}
              <button
                onClick={() => setYoloModalOpen(true)}
                className="h-8 px-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-200 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-400/50 transition-all relative shadow-subtle"
                title="Scan Complete India Satellite Map with YOLOv8 Vision Model"
              >
                <Scan size={13} className="text-emerald-400" />
                <span className="text-[10px] font-bold tracking-widest text-emerald-200 font-mono">
                  YOLO SCAN
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              </button>

              {/* NASA Earth Observatory Feed Button */}
              <button
                onClick={() => setNasaModalOpen(true)}
                className="h-8 px-3 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center gap-2 text-sky-200 hover:text-white hover:bg-sky-500/20 hover:border-sky-400/50 transition-all relative shadow-subtle"
                title="View Global Severe Storms via NASA EONET v3 & GIBS Satellite Imagery"
              >
                <Globe size={13} className="text-sky-400" />
                <span className="text-[10px] font-bold tracking-widest text-sky-200 font-mono">
                  NASA EONET
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
                </span>
              </button>

              {/* Official Bulletins & Alerts */}
              <button
                onClick={() => setAlertOpen(true)}
                className="h-8 px-3 rounded-md bg-alert/10 border border-alert/30 flex items-center gap-2 text-red-200 hover:text-white hover:bg-alert/20 transition-all relative shadow-subtle"
                title="View Active IMD & NDMA Meteorological Bulletins"
              >
                <Bell size={13} className="text-alert" />
                <span className="text-[10px] font-bold tracking-widest text-red-200 font-mono">
                  BULLETINS
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-alert" />
                </span>
              </button>
            </div>
          </header>

          {/* Main workspace */}
          <main
            className="flex-1 min-h-[calc(100vh-6.5rem)] w-full max-w-[1920px] mx-auto rounded-xl glass-panel flex flex-col overflow-hidden transition-opacity duration-700 shadow-panel"
            style={{
              opacity: introComplete ? 1 : 0,
            }}
          >
            <TopNavigation onOpenNasa={() => setNasaModalOpen(true)} />

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-0">
              {/* ── Left: Map (65%) ── */}
              <div className="flex-none h-[50vh] lg:h-auto lg:flex-[0.65] min-h-0 flex flex-col border-b lg:border-b-0 lg:border-r border-ocean-800/80">
                {/* Section label */}
                <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-ocean-800/80 bg-ocean-950/40">
                  <span className="metric-label min-w-0 truncate text-text-muted">
                    {mode === "LIVE"
                      ? "LIVE SATELLITE IMAGING"
                      : "HISTORICAL SATELLITE ARCHIVE"}
                  </span>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {mode === "HISTORICAL" && (
                      <button
                        onClick={openEvidence}
                        className="text-[9px] font-semibold tracking-widest text-sky-400 hover:text-sky-300
                          transition-colors px-2 py-0.5 rounded border border-sky-500/25 hover:border-sky-400/50 bg-sky-500/5 font-mono"
                      >
                        VIEW EVIDENCE
                      </button>
                    )}
                    <CycloneAnalysis mode={mode} />
                  </div>
                </div>

                {/* Map container */}
                <div className="flex-1 min-h-0 relative">
                  <SatellitePanel onCentreClick={openEvidence} />
                </div>
              </div>

              {/* ── Right: Metrics (35%) ── */}
              <div className="flex-none lg:flex-[0.35] min-h-0 flex flex-col bg-ocean-950/30">
                <div className="flex-shrink-0 px-4 py-2.5 border-b border-ocean-800/80 bg-ocean-950/40">
                  <span className="metric-label text-text-muted">
                    {mode === "LIVE"
                      ? "LIVE INTELLIGENCE"
                      : "HISTORICAL ANALYSIS"}
                  </span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                  <MetricsPanel />
                </div>
              </div>
            </div>
          </main>

          {/* Evidence drawer — portal-style */}
          <EvidenceDrawer open={evidenceOpen} onClose={closeEvidence} />

          {/* Alert System — real-time notifications */}
          <AlertSystem open={alertOpen} onClose={() => setAlertOpen(false)} />

          {/* NASA Earth Observatory Modal */}
          <NasaStormsModal
            open={nasaModalOpen}
            onClose={() => setNasaModalOpen(false)}
          />

          {/* YOLO Complete India Satellite Formation Scanner Modal */}
          <YoloScannerModal
            open={yoloModalOpen}
            onClose={() => setYoloModalOpen(false)}
          />
        </div>
      )}
    </>
  );
}

export default App;
