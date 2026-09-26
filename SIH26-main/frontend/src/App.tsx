import { Bell, Home, Moon, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import { AlertSystem } from "./components/AlertSystem";
import { CycloneAnalysis } from "./components/CycloneAnalysis";
import { EvidenceDrawer } from "./components/Dashboard/EvidenceDrawer";
import { MetricsPanel } from "./components/Dashboard/MetricsPanel";
import { SatellitePanel } from "./components/Dashboard/SatellitePanel";
import { IntroAnimation } from "./components/IntroAnimation";
import { LandingPage } from "./components/LandingPage";
import { TopNavigation } from "./components/TopNavigation";
import { useCycloneStore } from "./store/useCycloneStore";

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("cyclonet-theme") !== "light",
  );
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

  useEffect(() => {
    localStorage.setItem("cyclonet-theme", isDark ? "dark" : "light");
    document.documentElement.classList.toggle("theme-light", !isDark);
  }, [isDark]);

  // Fetch event data when active event changes
  useEffect(() => {
    if (mode === "HISTORICAL") {
      useCycloneStore.getState().fetchEventData(activeEventId);
    }
  }, [mode, activeEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial live data fetch
  useEffect(() => {
    if (mode === "LIVE") fetchLiveData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          isDark={isDark}
          onToggleTheme={() => setIsDark((value) => !value)}
        />
      )}

      {/* Main Dashboard */}
      {!showLanding && (
        <div
          className={`theme-shell w-full min-h-screen bg-[#050506] text-text-primary overflow-visible flex flex-col p-3 lg:p-5 ${isDark ? "theme-dark" : "theme-light"}`}
        >
          {/* Intro splash */}
          {!introComplete && <IntroAnimation />}

          {/* Brand header */}
          <header
            className="flex justify-between items-center w-full px-1 mb-3 transition-opacity duration-700"
            style={{ opacity: introComplete ? 1 : 0 }}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowLanding(true)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                title="Back to home"
              >
                <Home size={16} />
              </button>
              <div className="flex items-center gap-2">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="url(#logo-gradient)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M16 6 C20 10, 26 16, 16 26 C6 16, 12 10, 16 6 Z"
                    fill="url(#logo-gradient)"
                    opacity="0.3"
                  />
                  <circle cx="16" cy="16" r="4" fill="url(#logo-gradient)" />
                  <defs>
                    <linearGradient
                      id="logo-gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <h1 className="text-xl tracking-[0.15em] text-white font-bold uppercase">
                  CycloNet
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDark((value) => !value)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {isDark ? <Sun size={13} /> : <Moon size={13} />}
              </button>
              <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <User size={13} />
              </button>
              <button
                onClick={() => setAlertOpen(true)}
                className="h-8 px-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-1.5 text-gray-400 hover:text-white hover:bg-red-500/20 transition-all relative"
              >
                <Bell
                  size={12}
                  fill="currentColor"
                  className="text-red-500 animate-pulse"
                />
                <span className="text-[9px] font-bold tracking-[0.14em] text-white">
                  ALERT
                </span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0a] animate-pulse"></div>
              </button>
            </div>
          </header>

          {/* Main workspace */}
          <main
            className="flex-1 min-h-[calc(100vh-7rem)] w-full max-w-[1920px] mx-auto rounded-2xl border border-white/10 flex flex-col overflow-hidden transition-opacity duration-700 shadow-2xl"
            style={{
              opacity: introComplete ? 1 : 0,
              background: "rgba(10, 10, 11, 0.72)",
              backdropFilter: "blur(18px)",
            }}
          >
            <TopNavigation />

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-0">
              {/* ── Left: Map (65%) ── */}
              <div className="flex-none h-[50vh] lg:h-auto lg:flex-[0.65] min-h-0 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10">
                {/* Section label */}
                <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2 border-b border-white/5">
                  <span className="metric-label min-w-0 truncate text-gray-500">
                    {mode === "LIVE"
                      ? "LIVE SATELLITE IMAGING"
                      : "HISTORICAL SATELLITE ARCHIVE"}
                  </span>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {mode === "HISTORICAL" && (
                      <button
                        onClick={openEvidence}
                        className="text-[9px] font-semibold tracking-widest text-blue-400 hover:text-blue-300
                          transition-colors px-2 py-0.5 rounded border border-blue-500/25 hover:border-blue-400/50"
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
              <div className="flex-none lg:flex-[0.35] min-h-0 flex flex-col">
                <div className="flex-shrink-0 px-4 py-2 border-b border-white/5">
                  <span className="metric-label text-gray-500">
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

          {/* Evidence drawer — portal-style, rendered outside main for proper z-index */}
          <EvidenceDrawer open={evidenceOpen} onClose={closeEvidence} />

          {/* Alert System — real-time notifications */}
          <AlertSystem open={alertOpen} onClose={() => setAlertOpen(false)} />

          {/* ML Tasks — separate task interface can be enabled here when needed. */}
        </div>
      )}
    </>
  );
}

export default App;
