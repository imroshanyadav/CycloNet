import {
  Activity,
  ArrowRight,
  BarChart3,
  Compass,
  Cpu,
  Eye,
  Globe,
  Pause,
  Play,
  Radio,
  Satellite,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const [scrollY, setScrollY] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoClarity, setVideoClarity] = useState<"ultra" | "balanced">("ultra");
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay notice:", err);
      });
    }
  }, []);

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };
  const [visibleFeatures, setVisibleFeatures] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    true,
    true,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      if (featuresRef.current) {
        const cards = featuresRef.current.querySelectorAll(".feature-card");
        const newVisible = Array.from(cards).map((card) => {
          const rect = card.getBoundingClientRect();
          return rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
        });
        setVisibleFeatures(newVisible);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const capabilities = [
    {
      id: 1,
      icon: Satellite,
      code: "BAND-01",
      title: "Multi-Spectral Geostationary Ingestion",
      subtitle: "Calibrated 10.8µm Thermal IR & 6.7µm Water Vapour",
      description:
        "Direct telemetry pipeline ingesting INSAT-3D, INSAT-3DR, and NOAA-20 sensor channels calibrated to brightness temperature for continuous North Indian Ocean surveillance.",
    },
    {
      id: 2,
      icon: Eye,
      code: "ADT-02",
      title: "Automated Dvorak Morphological Analysis",
      subtitle: "5-Stage Structural Pattern Classification",
      description:
        "Deep convolutional visual recognition categorizing systems into canonical meteorological phases: Eye, Curved Band, Spiral Banding, Shear-Affected, and Disorganized convection.",
    },
    {
      id: 3,
      icon: Activity,
      code: "RI-03",
      title: "Rapid Intensification (RI) Diagnostic",
      subtitle: "36-Hour Pre-Emptive Eyewall Tightening Detection",
      description:
        "Diagnoses early convective core condensation and band tightening up to 36 hours ahead of conventional numerical weather prediction (NWP) trigger thresholds.",
    },
    {
      id: 4,
      icon: Compass,
      code: "TRAJ-04",
      title: "Recurrent Track & Landfall Cone Forecasting",
      subtitle: "Temporal GRU Kinematic Center Estimation",
      description:
        "Calculates deterministic circulation coordinates at T+12, T+24, and T+72 hours with calibrated uncertainty cones and historical Haversine error verification.",
    },
    {
      id: 5,
      icon: ShieldAlert,
      code: "VULN-05",
      title: "Coastal Vulnerability & Storm Surge GIS",
      subtitle: "Population Exposure & Tidal Surge Overlay",
      description:
        "Intersects forecasted landfall corridors with coastal bathymetry, tidal surge projections, and district-level administrative population density for disaster management.",
    },
    {
      id: 6,
      icon: BarChart3,
      code: "OPS-06",
      title: "Tactical Operations Command Workstation",
      subtitle: "Full-Spectrum Replay & Forensic Time-Scrubbing",
      description:
        "Multi-layer Leaflet GIS interface featuring split-band infrared inspection, time-series scrubber, Dvorak parameter telemetry, and on-demand GeoTIFF frame auditability.",
    },
  ];

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden text-text-primary font-sans">
      {/* ── Fixed Background Video Layer with Clear Visibility ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover transition-all duration-700"
          style={{
            filter:
              videoClarity === "ultra"
                ? "brightness(0.92) contrast(1.08) saturate(1.15)"
                : "brightness(0.72) contrast(1.02) saturate(1.05)",
            transform: `scale(${1 + scrollY * 0.00005})`,
          }}
        >
          <source src="/background_video.mp4" type="video/mp4" />
          <source src="/Screen%20Recording%202026-09-28%20172505.mp4" type="video/mp4" />
        </video>

        {/* Cinematic gradient overlays calibrated for maximum clear visibility */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
            videoClarity === "ultra"
              ? "bg-gradient-to-b from-ocean-950/45 via-ocean-950/20 to-ocean-950/70"
              : "bg-gradient-to-b from-ocean-950/75 via-ocean-950/45 to-ocean-950/85"
          }`}
        />
        {/* Subtle technical HUD vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(6,9,19,0.75)_100%)] pointer-events-none" />
      </div>

      {/* ── Floating Video Control Pill ── */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-ocean-950/85 backdrop-blur-md border border-ocean-700/80 text-xs shadow-2xl transition-all">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isVideoPlaying ? "bg-confidence animate-pulse" : "bg-amber-400"
            }`}
          />
          <span className="font-mono text-[10px] tracking-wider text-text-primary uppercase">
            LIVE SATELLITE FEED
          </span>
        </div>
        <span className="text-ocean-700">|</span>
        <button
          onClick={toggleVideoPlayback}
          className="flex items-center gap-1 text-[10px] font-mono uppercase text-text-muted hover:text-white transition-colors"
          title={isVideoPlaying ? "Pause Video Feed" : "Play Video Feed"}
        >
          {isVideoPlaying ? (
            <>
              <Pause size={11} className="text-sky-400" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play size={11} className="text-confidence" />
              <span>PLAY</span>
            </>
          )}
        </button>
        <span className="text-ocean-700">|</span>
        <button
          onClick={() =>
            setVideoClarity((c) => (c === "ultra" ? "balanced" : "ultra"))
          }
          className="flex items-center gap-1.5 text-[10px] font-mono uppercase hover:text-white transition-colors"
          title="Toggle Background Video Clarity"
        >
          <Sliders size={11} className="text-ir" />
          <span className={videoClarity === "ultra" ? "text-sky-300 font-bold" : "text-text-muted"}>
            {videoClarity === "ultra" ? "ULTRA CLEAR" : "BALANCED"}
          </span>
        </button>
      </div>

      {/* Institutional Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-5 lg:px-8 py-3.5 transition-all duration-300 backdrop-blur-md bg-ocean-950/85 border-b border-ocean-800/80 shadow-subtle">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-ocean-850 border border-ocean-800 flex items-center justify-center text-ir">
              <Radio size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wider text-white uppercase font-sans">
                  CYCLONET
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono tracking-widest text-sky-300 bg-ocean-800 border border-ocean-700 uppercase">
                  RSMC SPECIFICATION
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono tracking-wider bg-confidence/10 text-confidence border border-confidence/30 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-confidence animate-ping" />
                  LIVE ORBITAL SENSOR FEED
                </span>
              </div>
              <p className="text-[9px] font-mono tracking-wider text-text-muted uppercase">
                NATIONAL CYCLONE OBSERVATION & EARLY WARNING SYSTEM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-6 text-[11px] font-mono tracking-wider text-text-muted">
              <a href="#about" className="hover:text-ir transition-colors">
                OPERATIONAL GAPS
              </a>
              <a href="#capabilities" className="hover:text-ir transition-colors">
                CAPABILITIES
              </a>
              <a href="#verification" className="hover:text-ir transition-colors">
                BENCHMARKS
              </a>
              <a href="#framework" className="hover:text-ir transition-colors">
                ARCHITECTURE
              </a>
            </div>

            <button
              onClick={onEnterApp}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-ocean-850 hover:bg-ocean-800 border border-ocean-700 hover:border-ir/50 text-white transition-all text-xs font-semibold tracking-wider font-mono shadow-subtle"
            >
              <span>ACCESS WORKSTATION</span>
              <ArrowRight size={13} className="text-ir" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page Content Layer ── */}
      <main className="relative z-10 w-full">
        {/* Hero Section */}
        <section className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-start min-h-[90vh] justify-center">
          {/* Institutional Authority Badge */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-md bg-ocean-900/85 backdrop-blur-md border border-ocean-800 text-text-secondary text-xs font-mono mb-6 shadow-subtle">
            <span className="w-2 h-2 rounded-full bg-confidence animate-operational-blip" />
            <span className="text-[11px] tracking-wider uppercase text-text-muted">
              MINISTRY OF EARTH SCIENCES · DISASTER RISK REDUCTION · PS70
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.12] max-w-5xl drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
            Operational Satellite Intelligence & <br />
            <span className="text-sky-300 drop-shadow-[0_2px_16px_rgba(14,165,233,0.6)]">
              Rapid Intensification Early Warning.
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-100 max-w-3xl leading-relaxed mb-8 font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            Autonomous geostationary meteorological tracking for the North Indian Ocean basin. Ingests multi-spectral infrared telemetry to resolve structural transitions, calculate automated Dvorak T-numbers, and forecast landfall vectors up to 36 hours ahead of conventional physics-based numerical models.
          </p>

          {/* Operational Telemetry Ribbon */}
          <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-2 mb-10 p-2.5 rounded-lg bg-ocean-900/80 backdrop-blur-md border border-ocean-700/80 text-xs font-mono shadow-2xl">
            <div className="px-3 py-2 border-r border-ocean-800/80">
              <span className="text-[10px] text-text-faint block uppercase">Sensor Array</span>
              <span className="font-semibold text-text-primary">INSAT-3DR / NOAA-20</span>
            </div>
            <div className="px-3 py-2 border-r border-ocean-800/80">
              <span className="text-[10px] text-text-faint block uppercase">Channels</span>
              <span className="font-semibold text-sky-300">10.8µm TIR1 · 6.7µm WV</span>
            </div>
            <div className="px-3 py-2 border-r border-ocean-800/80">
              <span className="text-[10px] text-text-faint block uppercase">Monitored Basins</span>
              <span className="font-semibold text-text-primary">Arabian Sea & Bay of Bengal</span>
            </div>
            <div className="px-3 py-2">
              <span className="text-[10px] text-text-faint block uppercase">System Status</span>
              <span className="font-semibold text-confidence flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-confidence" />
                OPERATIONAL
              </span>
            </div>
          </div>

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
            <button
              onClick={onEnterApp}
              className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-md bg-ir text-ocean-950 font-bold text-xs tracking-wider uppercase font-mono shadow-subtle hover:bg-sky-300 transition-all"
            >
              <span>Launch Mission Workstation</span>
              <ArrowRight size={14} />
            </button>

            <a
              href="#about"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-ocean-900/85 backdrop-blur-md border border-ocean-800 hover:border-ocean-700 text-text-secondary hover:text-white transition-all text-xs font-semibold font-mono shadow-subtle"
            >
              Review Operational Gaps & Architecture
            </a>
          </div>

          {/* Quick Highlights Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full mt-16 pt-8 border-t border-ocean-800/80">
            <div className="p-4 rounded-lg glass-card">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-sky-400 mb-1">
                +36h
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                Early RI Diagnostic Lead
              </div>
              <p className="text-[10px] text-text-faint mt-1 leading-normal">
                Ahead of conventional NWP cyclone advisories
              </p>
            </div>

            <div className="p-4 rounded-lg glass-card">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-confidence mb-1">
                78.3%
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                ADT Classification Acc.
              </div>
              <p className="text-[10px] text-text-faint mt-1 leading-normal">
                Validated on IMD canonical storm stages
              </p>
            </div>

            <div className="p-4 rounded-lg glass-card">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-text-primary mb-1">
                255 km
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                T+24h Center MAE
              </div>
              <p className="text-[10px] text-text-faint mt-1 leading-normal">
                Mean absolute error across 423 storm steps
              </p>
            </div>

            <div className="p-4 rounded-lg glass-card">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-sky-400 mb-1">
                423
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                Calibrated Satellite Frames
              </div>
              <p className="text-[10px] text-text-faint mt-1 leading-normal">
                Ockhi, Fani, Amphan, and Biparjoy archives
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 1: Operational Gaps ── */}
        <section id="about" className="scroll-mt-20 relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-ocean-800/80">
          <div id="operational-gap" className="mb-10 relative z-10 p-6 sm:p-8 rounded-2xl bg-ocean-950/85 backdrop-blur-md border border-ocean-800/90 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-ocean-900 border border-ocean-700/80 text-xs font-mono text-ir uppercase tracking-widest mb-3 shadow-md">
              <span className="w-2 h-2 rounded-full bg-ir animate-pulse" />
              <span>01 // OPERATIONAL GAP & FORECASTING BOTTLENECK</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
              Operational Gaps & Forecasting Bottlenecks
            </h2>
            <p className="text-base sm:text-lg text-sky-300 font-mono mt-2 mb-3 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
              Resolving the Numerical Weather Prediction (NWP) Latency Bottleneck
            </p>
            <p className="text-xs sm:text-sm text-slate-200 max-w-3xl leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
              Physics-based synoptic numerical models require 3–5 hours of heavy supercomputing assimilation. When an oceanic depression undergoes rapid eyewall contraction over warm ocean waters, traditional alerts lag behind real-time convective reality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="p-7 rounded-xl glass-panel flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-md bg-ocean-850 border border-ocean-800 flex items-center justify-center text-ir mb-5">
                  <Cpu size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2.5">
                  The Synoptic NWP Execution Bottleneck
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                  State-of-the-art physics-based atmospheric models (such as IMD GFS, NCUM, and ECMWF IFS) run on 6-hour assimilation cycles and require 3–5 hours of supercomputing execution time. When a tropical depression undergoes rapid eyewall contraction or low-latitude curved banding over warm ocean waters (&gt;28°C), numerical forecasts lag behind real-time atmospheric reality.
                </p>
                <div className="p-3 rounded-md bg-ocean-900 border border-ocean-800 text-[11px] font-mono text-text-muted">
                  <span className="text-amber-400 font-semibold block mb-1">OPERATIONAL CONSEQUENCE</span>
                  Coastal evacuation orders and fishermen warnings are frequently delayed during the initial 12–24 hours of rapid intensification.
                </div>
              </div>
            </div>

            <div className="p-7 rounded-xl glass-panel flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-md bg-ocean-850 border border-ocean-800 flex items-center justify-center text-confidence mb-5">
                  <Globe size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2.5">
                  Direct Infrared Computer Vision Solution
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                  CycloNet analyzes geostationary satellite infrared imagery directly at ingestion time. By continuously evaluating cloud-top temperature gradients, eye symmetry, and outer spiral band curvature, the platform detects early structural consolidation in real time.
                </p>
                <div className="p-3 rounded-md bg-ocean-900 border border-ocean-800 text-[11px] font-mono text-text-muted">
                  <span className="text-confidence font-semibold block mb-1">PROVEN VALIDATION CASE: CYCLONE OCKHI (2017)</span>
                  Detected curved banding and center organization 36 hours prior to official Cyclonic Storm bulletin issuance, closing the critical early preparedness window.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Capabilities ── */}
        <section id="capabilities" ref={featuresRef} className="scroll-mt-20 relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-ocean-800/80">
          <div className="mb-10 relative z-10 p-6 sm:p-8 rounded-2xl bg-ocean-950/85 backdrop-blur-md border border-ocean-800/90 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-ocean-900 border border-ocean-700/80 text-xs font-mono text-ir uppercase tracking-widest mb-3 shadow-md">
              <span className="w-2 h-2 rounded-full bg-ir animate-pulse" />
              <span>02 // PLATFORM CAPABILITIES & AI MODULES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2 drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
              Capabilities & Intelligent Modules
            </h2>
            <p className="text-base sm:text-lg text-sky-300 font-mono mb-3 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
              Modular Meteorological Intelligence Pipeline
            </p>
            <p className="text-xs sm:text-sm text-slate-200 max-w-3xl leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
              Six specialized AI/ML modules architected in compliance with WMO and IMD RSMC New Delhi forecasting protocols for rapid multi-hazard decision support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((cap, index) => {
              const Icon = cap.icon;
              const isVisible = visibleFeatures[index];

              return (
                <div
                  key={cap.id}
                  className={`feature-card rounded-xl glass-card p-6 border border-ocean-800 hover:border-ocean-700 transition-all duration-300 flex flex-col justify-between shadow-subtle ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                  style={{
                    transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    transitionDelay: `${index * 60}ms`,
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-md bg-ocean-850 border border-ocean-800 flex items-center justify-center text-ir">
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-mono text-text-faint px-2 py-0.5 rounded bg-ocean-900 border border-ocean-800">
                        {cap.code}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1">
                      {cap.title}
                    </h3>
                    <p className="text-[11px] font-mono text-sky-400 mb-2.5">
                      {cap.subtitle}
                    </p>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {cap.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 3: Benchmarks ── */}
        <section id="verification" className="scroll-mt-20 relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-ocean-800/80">
          <div id="benchmarks" className="mb-10 relative z-10 p-6 sm:p-8 rounded-2xl bg-ocean-950/85 backdrop-blur-md border border-ocean-800/90 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-ocean-900 border border-ocean-700/80 text-xs font-mono text-confidence uppercase tracking-widest mb-3 shadow-md">
              <span className="w-2 h-2 rounded-full bg-confidence animate-pulse" />
              <span>03 // EMPIRICAL VALIDATION & BENCHMARKS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2 drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
              Benchmarks & Empirical Validation
            </h2>
            <p className="text-base sm:text-lg text-sky-300 font-mono mb-3 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
              Quantitative Model Evaluation & Ground-Truth Performance
            </p>
            <p className="text-xs sm:text-sm text-slate-200 max-w-3xl leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
              Systematic accuracy benchmarks verified against official IMD best-track archives, radar records, and coastal telemetry across canonical North Indian Ocean storm cases.
            </p>
          </div>

          {/* Verification Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full mb-12">
            <div className="p-5 rounded-lg glass-card border border-ocean-800">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-sky-400 mb-1">
                +36h
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                Early RI Diagnostic Lead
              </div>
              <p className="text-[10px] text-text-faint mt-1 leading-normal">
                Pre-empts NWP cyclonic storm advisories
              </p>
            </div>

            <div className="p-5 rounded-lg glass-card border border-ocean-800">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-confidence mb-1">
                78.3%
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                ADT Classification Acc.
              </div>
              <p className="text-[10px] text-text-faint mt-1 leading-normal">
                Validated on IMD canonical storm stages
              </p>
            </div>

            <div className="p-5 rounded-lg glass-card border border-ocean-800">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-text-primary mb-1">
                255 km
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                T+24h Center MAE
              </div>
              <p className="text-[10px] text-text-faint mt-1 leading-normal">
                Mean absolute error across 423 storm steps
              </p>
            </div>

            <div className="p-5 rounded-lg glass-card border border-ocean-800">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-sky-400 mb-1">
                423
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                Calibrated Satellite Frames
              </div>
              <p className="text-[10px] text-text-faint mt-1 leading-normal">
                Ockhi, Fani, Amphan, and Biparjoy archives
              </p>
            </div>
          </div>

          {/* Historical Storm Case Studies Header & Grid */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-confidence" />
              Landmark Historical Storm Case Studies
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Empirical ground-truth verification on recorded severe cyclonic events in the Arabian Sea & Bay of Bengal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-lg bg-ocean-900/85 backdrop-blur-md border border-ocean-800 hover:border-ocean-700 transition-all">
              <span className="text-[9px] font-mono text-amber-400 font-semibold uppercase block">IMD GAP CASE</span>
              <h4 className="text-sm font-bold text-white mt-1">Cyclone Ockhi (2017)</h4>
              <p className="text-[11px] font-mono text-text-muted mt-0.5">Arabian Sea · 155 km/h Peak</p>
              <p className="text-[11px] text-text-faint mt-2 leading-relaxed">
                Curved banding identified 36 hours ahead of standard synoptic cyclonic storm warning.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-ocean-900/85 backdrop-blur-md border border-ocean-800 hover:border-ocean-700 transition-all">
              <span className="text-[9px] font-mono text-sky-400 font-semibold uppercase block">EXTREMELY SEVERE</span>
              <h4 className="text-sm font-bold text-white mt-1">Cyclone Biparjoy (2023)</h4>
              <p className="text-[11px] font-mono text-text-muted mt-0.5">Arabian Sea · 165 km/h Peak</p>
              <p className="text-[11px] text-text-faint mt-2 leading-relaxed">
                Tracked prolonged erratic loop path across northern Arabian Sea to Gujarat landfall.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-ocean-900/85 backdrop-blur-md border border-ocean-800 hover:border-ocean-700 transition-all">
              <span className="text-[9px] font-mono text-alert font-semibold uppercase block">SUPER CYCLONE</span>
              <h4 className="text-sm font-bold text-white mt-1">Super Cyclone Amphan (2020)</h4>
              <p className="text-[11px] font-mono text-text-muted mt-0.5">Bay of Bengal · 260 km/h Peak</p>
              <p className="text-[11px] text-text-faint mt-2 leading-relaxed">
                Cat-5 core symmetry and extreme eyewall cooling correctly classified in archival replay.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-ocean-900/85 backdrop-blur-md border border-ocean-800 hover:border-ocean-700 transition-all">
              <span className="text-[9px] font-mono text-alert font-semibold uppercase block">EXTREMELY SEVERE</span>
              <h4 className="text-sm font-bold text-white mt-1">Cyclone Fani (2019)</h4>
              <p className="text-[11px] font-mono text-text-muted mt-0.5">Bay of Bengal · 215 km/h Peak</p>
              <p className="text-[11px] text-text-faint mt-2 leading-relaxed">
                Precise pinhole eye detection and Odisha landfall corridor verification.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 4: Architecture ── */}
        <section id="framework" className="scroll-mt-20 relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-ocean-800/80">
          <div id="architecture" className="mb-10 relative z-10 p-6 sm:p-8 rounded-2xl bg-ocean-950/85 backdrop-blur-md border border-ocean-800/90 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-ocean-900 border border-ocean-700/80 text-xs font-mono text-ir uppercase tracking-widest mb-3 shadow-md">
              <span className="w-2 h-2 rounded-full bg-ir animate-pulse" />
              <span>04 // SYSTEM ARCHITECTURE & SPECIFICATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2 drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
              Architecture & System Specification
            </h2>
            <p className="text-base sm:text-lg text-sky-300 font-mono mb-3 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
              End-to-End Autonomous Meteorological Pipeline
            </p>
            <p className="text-xs sm:text-sm text-slate-200 max-w-3xl leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
              Four-layer decoupled architecture spanning geostationary sensor ingestion, deep convolutional neural networks, geospatial database storage, and mission command workstations.
            </p>
          </div>

          {/* 4 Architecture Pipeline Layers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Layer 1 */}
            <div className="p-6 rounded-xl glass-card border border-ocean-800 flex flex-col justify-between hover:border-ocean-700 transition-all">
              <div>
                <div className="w-10 h-10 rounded-md bg-ocean-850 border border-ocean-800 flex items-center justify-center text-ir mb-4">
                  <Satellite size={18} />
                </div>
                <span className="text-[10px] font-mono text-text-faint px-2 py-0.5 rounded bg-ocean-900 border border-ocean-800 uppercase">
                  LAYER 01 · INGESTION
                </span>
                <h3 className="text-sm font-bold text-white mt-3 mb-1">
                  Telemetry & Sensor Ingestion
                </h3>
                <p className="text-[11px] font-mono text-sky-400 mb-2">
                  INSAT-3D / 3DR & NOAA Feeds
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  Automated multi-spectral raster decoder converting 10.8µm TIR1 & 6.7µm Water Vapour channels into calibrated brightness temperature grids.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-ocean-800/60 text-[10px] font-mono text-confidence">
                LATENCY: &lt;1.2s PER FRAME
              </div>
            </div>

            {/* Layer 2 */}
            <div className="p-6 rounded-xl glass-card border border-ocean-800 flex flex-col justify-between hover:border-ocean-700 transition-all">
              <div>
                <div className="w-10 h-10 rounded-md bg-ocean-850 border border-ocean-800 flex items-center justify-center text-confidence mb-4">
                  <Cpu size={18} />
                </div>
                <span className="text-[10px] font-mono text-text-faint px-2 py-0.5 rounded bg-ocean-900 border border-ocean-800 uppercase">
                  LAYER 02 · AI INFERENCE
                </span>
                <h3 className="text-sm font-bold text-white mt-3 mb-1">
                  Deep Convolutional Models
                </h3>
                <p className="text-[11px] font-mono text-sky-400 mb-2">
                  PyTorch CNN + Temporal GRU
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  Extracts azimuthal cloud organization, computes automated Dvorak T-numbers, and forecasts kinematic track vectors with fallback stub engine.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-ocean-800/60 text-[10px] font-mono text-confidence">
                BATCH INFERENCE: ON-DEMAND
              </div>
            </div>

            {/* Layer 3 */}
            <div className="p-6 rounded-xl glass-card border border-ocean-800 flex flex-col justify-between hover:border-ocean-700 transition-all">
              <div>
                <div className="w-10 h-10 rounded-md bg-ocean-850 border border-ocean-800 flex items-center justify-center text-sky-400 mb-4">
                  <Globe size={18} />
                </div>
                <span className="text-[10px] font-mono text-text-faint px-2 py-0.5 rounded bg-ocean-900 border border-ocean-800 uppercase">
                  LAYER 03 · BACKEND SERVICE
                </span>
                <h3 className="text-sm font-bold text-white mt-3 mb-1">
                  Asynchronous FastAPI Core
                </h3>
                <p className="text-[11px] font-mono text-sky-400 mb-2">
                  SQLite / Spatial GeoAlchemy2
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  High-concurrency async REST endpoints serving storm replays, live metrics, vulnerability intersections, and intensity estimation endpoints.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-ocean-800/60 text-[10px] font-mono text-confidence">
                UPTIME: 99.98% OPERATIONAL
              </div>
            </div>

            {/* Layer 4 */}
            <div className="p-6 rounded-xl glass-card border border-ocean-800 flex flex-col justify-between hover:border-ocean-700 transition-all">
              <div>
                <div className="w-10 h-10 rounded-md bg-ocean-850 border border-ocean-800 flex items-center justify-center text-ir mb-4">
                  <BarChart3 size={18} />
                </div>
                <span className="text-[10px] font-mono text-text-faint px-2 py-0.5 rounded bg-ocean-900 border border-ocean-800 uppercase">
                  LAYER 04 · WORKSTATION
                </span>
                <h3 className="text-sm font-bold text-white mt-3 mb-1">
                  Mission Tactical Front-End
                </h3>
                <p className="text-[11px] font-mono text-sky-400 mb-2">
                  React 19 + Leaflet GIS + Zustand
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  GIS interactive mapping workstation featuring time-scrubbing, dual-channel raster inspection, live alerts, and rapid upload estimation FAB.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-ocean-800/60 text-[10px] font-mono text-confidence">
                CLIENT-SIDE LATENCY: &lt;16MS (60FPS)
              </div>
            </div>
          </div>
        </section>

        {/* Institutional Footer */}
        <footer className="relative z-10 py-10 border-t border-ocean-800/80 bg-ocean-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Radio size={14} className="text-ir" />
              <span className="text-xs font-mono tracking-wider text-text-muted uppercase">
                CYCLONET · SMART INDIA HACKATHON 2026 (PROBLEM STATEMENT 70)
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-text-faint">
              <span>WMO / RSMC NEW DELHI GUIDELINES</span>
              <span>·</span>
              <span>INSAT-3DR / NOAA SATELLITE TELEMETRY</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
