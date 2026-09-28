import {
  AlertTriangle,
  Calendar,
  Eye,
  FileText,
  Gauge,
  Loader2,
  MapPin,
  Target,
  Upload,
  Wind,
  X,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

interface CycloneReport {
  // Intensity data
  intensity: {
    wind_speed_knots: number;
    wind_speed_kmh: number;
    wind_speed_mph: number;
  };
  category: {
    category_code: string;
    category_name: string;
    damage_potential: string;
  };
  damage_assessment: {
    wind_speed_knots: number;
    wind_speed_kmh: number;
    description: string;
    infrastructure: string;
    coastal: string;
    precautions: string;
  };
  detection: {
    has_cyclone: boolean;
    confidence: number;
  };

  // Identification data
  is_cyclone_present: boolean;
  center: { lat: number; lon: number } | null;

  // Classification data
  structural_pattern: { pattern: string; confidence: number };

  model: {
    name: string;
    version: string;
    architecture: string;
  };

  timestamp: string;
}

const PATTERN_GUIDANCE: Record<
  string,
  { identification: string; classification: string; prediction: string }
> = {
  eye: {
    identification: "A clear central eye is visible in the cloud structure.",
    classification: "Mature, well-organized tropical cyclone pattern.",
    prediction:
      "The system may maintain or strengthen its organization while the eye remains defined.",
  },
  spiral_banding: {
    identification:
      "Curved cloud bands wrap around a developing circulation center.",
    classification:
      "Organized spiral-banding pattern with active convective structure.",
    prediction:
      "Further band consolidation may indicate continued development if environmental conditions remain favorable.",
  },
  curved_band: {
    identification:
      "A curved convective band suggests an emerging or partially organized circulation.",
    classification: "Developing curved-band tropical cyclone pattern.",
    prediction:
      "The circulation may become more organized as the curved band closes around the center.",
  },
  shear_affected: {
    identification:
      "The cloud mass is displaced from the estimated circulation center.",
    classification: "Wind-shear-affected pattern with reduced symmetry.",
    prediction:
      "Additional shear may weaken organization, while lower shear could allow the center to realign and intensify.",
  },
  disorganized: {
    identification:
      "Convection is scattered without a consistent closed circulation signature.",
    classification: "Disorganized or weak tropical disturbance pattern.",
    prediction:
      "The system may remain weak unless convection consolidates around a persistent circulation center.",
  },
};

export function CycloneAnalysis({ mode }: { mode: "LIVE" | "HISTORICAL" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<CycloneReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/tiff"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, or TIFF)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setError(null);
    setReport(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Run all three analyses in parallel
      const formData1 = new FormData();
      formData1.append("file", selectedFile);

      const formData2 = new FormData();
      formData2.append("file", selectedFile);

      const formData3 = new FormData();
      formData3.append("file", selectedFile);

      const [intensityRes, identifyRes] = await Promise.all([
        fetch("http://localhost:8000/api/cyclone/intensity", {
          method: "POST",
          body: formData1,
        }),
        fetch("http://localhost:8000/api/ml/identify", {
          method: "POST",
          body: formData2,
        }),
      ]);

      if (!intensityRes.ok) {
        const errorData = await intensityRes.json();
        throw new Error(errorData.detail || "Intensity estimation failed");
      }

      if (!identifyRes.ok) {
        const errorData = await identifyRes.json();
        throw new Error(errorData.detail || "Identification failed");
      }

      const intensityData = await intensityRes.json();
      const identifyData = await identifyRes.json();

      // If cyclone detected, run classification
      let classifyData = null;
      if (identifyData.is_cyclone_present && identifyData.center) {
        const formData4 = new FormData();
        formData4.append("file", selectedFile);
        formData4.append("center_lat", identifyData.center.lat.toString());
        formData4.append("center_lon", identifyData.center.lon.toString());

        const classifyRes = await fetch(
          "http://localhost:8000/api/ml/classify",
          {
            method: "POST",
            body: formData4,
          },
        );

        if (classifyRes.ok) {
          classifyData = await classifyRes.json();
        }
      }

      // Combine into comprehensive report
      const combinedReport: CycloneReport = {
        ...intensityData,
        is_cyclone_present: identifyData.is_cyclone_present,
        center: identifyData.center,
        structural_pattern: classifyData?.structural_pattern || {
          pattern: "unknown",
          confidence: 0,
        },
        timestamp: new Date().toISOString(),
      };

      setReport(combinedReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setReport(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getCategoryColor = (code: string) => {
    const colors: Record<string, string> = {
      LOW: "text-green-400",
      D: "text-blue-400",
      DD: "text-cyan-400",
      CS: "text-yellow-400",
      SCS: "text-orange-400",
      VSCS: "text-red-400",
      ESCS: "text-red-500",
      SuCS: "text-red-600",
    };
    return colors[code] || "text-gray-400";
  };

  const getDamageColor = (potential: string) => {
    const colors: Record<string, string> = {
      None: "bg-green-500/20 text-green-400 border-green-500/30",
      Minimal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Minor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      Moderate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Extensive: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Severe: "bg-red-500/20 text-red-400 border-red-500/30",
      Devastating: "bg-red-600/20 text-red-500 border-red-600/30",
      Catastrophic: "bg-purple-600/20 text-purple-400 border-purple-600/30",
    };
    return (
      colors[potential] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
    );
  };

  const getPatternColor = (pattern: string) => {
    const colors: Record<string, string> = {
      eye: "text-red-400",
      spiral_banding: "text-orange-400",
      curved_band: "text-yellow-400",
      shear_affected: "text-blue-400",
      disorganized: "text-gray-400",
    };
    return colors[pattern] || "text-gray-400";
  };

  const formatPattern = (pattern: string) => {
    return pattern
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Map-section action */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Analyze cyclone"
          title="Analyze cyclone"
          className="flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1 text-[9px] font-semibold tracking-widest text-sky-200 bg-sky-500/10 border border-sky-400/30 hover:bg-sky-500/20 hover:border-sky-400/50 hover:text-white transition-all font-mono shadow-sm"
        >
          <FileText size={13} className="text-sky-400" />
          <span className="hidden sm:inline">ANALYZE CYCLONE</span>
        </button>
      )}

      {/* Modal */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ocean-950/85 backdrop-blur-md">
            <div className="w-full max-w-7xl max-h-[92vh] glass-panel border border-ocean-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-ocean-800 bg-ocean-950/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-ocean-850 border border-ocean-750 flex items-center justify-center">
                    <FileText size={18} className="text-ir" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold tracking-wider text-white uppercase font-mono">
                        SPECIAL SATELLITE STRUCTURE & INTENSITY REPORT
                      </h2>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider bg-ocean-800 text-sky-300 border border-ocean-700">
                        {mode} CONSOLE
                      </span>
                    </div>
                    <p className="text-[10px] font-mono tracking-widest text-text-muted uppercase">
                      WMO DVORAK & MULTI-SPECTRAL RADIOMETRIC AUDIT
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-md bg-ocean-850 hover:bg-ocean-800 border border-ocean-750 flex items-center justify-center text-text-muted hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {!report ? (
                  /* Upload Section */
                  <div className="p-8 max-w-2xl mx-auto">
                    <div className="space-y-6">
                      <div>
                        <label className="text-xs text-text-muted mb-3 block font-mono font-semibold tracking-wider flex items-center gap-2 uppercase">
                          <Upload size={14} className="text-ir" />
                          INGEST CALIBRATED SATELLITE GEOTIFF / INFRARED IMAGE
                        </label>

                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="relative border border-dashed border-ocean-700 hover:border-ir/50 rounded-xl p-10
                          transition-all cursor-pointer bg-ocean-900/60 hover:bg-ocean-900/80 text-center shadow-subtle"
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/tiff"
                            onChange={handleFileSelect}
                            className="hidden"
                          />

                          {previewUrl ? (
                            <div className="relative">
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-80 object-contain rounded-lg"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReset();
                                }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/90
                                flex items-center justify-center text-white hover:bg-black"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4 text-center">
                              <div
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 
                              flex items-center justify-center border-2 border-cyan-500/30"
                              >
                                <Upload size={40} className="text-cyan-400" />
                              </div>
                              <div>
                                <p className="text-white font-semibold text-lg mb-2">
                                  Click to upload satellite image
                                </p>
                                <p className="text-gray-400 text-sm">
                                  JPEG, PNG, or TIFF • Max 10MB
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedFile && (
                          <p className="text-xs text-gray-500 mt-2">
                            {selectedFile.name} (
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>

                      <button
                        onClick={handleAnalyze}
                        disabled={!selectedFile || isLoading}
                        className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white
                        flex items-center justify-center gap-3
                        hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        font-bold tracking-wide text-base shadow-lg hover:shadow-cyan-500/50 hover:scale-[1.02]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={24} className="animate-spin" />
                            <span>ANALYZING CYCLONE...</span>
                          </>
                        ) : (
                          <>
                            <Wind size={24} />
                            <span>RUN FULL ANALYSIS</span>
                          </>
                        )}
                      </button>

                      {error && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                          <AlertTriangle
                            size={20}
                            className="text-red-400 flex-shrink-0 mt-0.5"
                          />
                          <p className="text-sm text-red-400">{error}</p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <p className="text-sm text-gray-400 text-center font-medium">
                          This analysis includes:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div
                            className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-center
                          hover:from-blue-500/20 hover:to-cyan-500/20 transition-all"
                          >
                            <Eye
                              size={24}
                              className="text-cyan-400 mx-auto mb-2"
                            />
                            <p className="text-xs text-cyan-300 font-semibold">
                              Detection & Location
                            </p>
                          </div>
                          <div
                            className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-center
                          hover:from-purple-500/20 hover:to-pink-500/20 transition-all"
                          >
                            <Target
                              size={24}
                              className="text-purple-400 mx-auto mb-2"
                            />
                            <p className="text-xs text-purple-300 font-semibold">
                              Pattern Classification
                            </p>
                          </div>
                          <div
                            className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 text-center
                          hover:from-red-500/20 hover:to-orange-500/20 transition-all"
                          >
                            <Wind
                              size={24}
                              className="text-red-400 mx-auto mb-2"
                            />
                            <p className="text-xs text-red-300 font-semibold">
                              Intensity & Damage
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Report Section */
                  <div className="p-8">
                    {/* Report Header */}
                    <div className="flex items-start justify-between mb-8 pb-6 border-b border-cyan-500/20">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                            <FileText size={24} className="text-white" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-bold text-white">
                              CycloNet Analysis Report
                            </h3>
                            <p className="text-sm text-cyan-400">
                              Comprehensive Cyclone Intelligence
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(report.timestamp)}
                          </span>
                          <span>•</span>
                          <span>
                            Model: {report.model.name} v{report.model.version}
                          </span>
                          <span>•</span>
                          <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">
                            Analysis Complete
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleReset}
                        className="px-3.5 py-1.5 rounded-md bg-ocean-850 hover:bg-ocean-800 border border-ocean-700 text-sky-300 hover:text-white transition-all text-xs font-mono font-semibold uppercase tracking-wider"
                      >
                        Ingest New Frame
                      </button>
                    </div>

                    {/* Report Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column: Detection & Location */}
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Eye size={20} className="text-blue-400" />
                            <h4 className="text-lg font-semibold text-white">
                              Detection
                            </h4>
                          </div>
                          <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">
                                  Status
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    report.is_cyclone_present
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                                  }`}
                                >
                                  {report.is_cyclone_present
                                    ? "DETECTED"
                                    : "NOT DETECTED"}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-white">
                                  {(report.detection.confidence * 100).toFixed(
                                    1,
                                  )}
                                  %
                                </span>
                                <span className="text-sm text-gray-400">
                                  confidence
                                </span>
                              </div>
                            </div>

                            {report.center && (
                              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 mb-3">
                                  <MapPin size={16} className="text-blue-400" />
                                  <span className="text-sm text-gray-400">
                                    Center Location
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-xs text-gray-500">
                                      Latitude
                                    </span>
                                    <p className="text-xl font-bold text-white">
                                      {report.center.lat.toFixed(2)}°
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">
                                      Longitude
                                    </span>
                                    <p className="text-xl font-bold text-white">
                                      {report.center.lon.toFixed(2)}°
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {report.structural_pattern.pattern !==
                              "unknown" && (
                              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 mb-3">
                                  <Target
                                    size={16}
                                    className="text-purple-400"
                                  />
                                  <span className="text-sm text-gray-400">
                                    Structural Pattern
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-xl font-bold ${getPatternColor(report.structural_pattern.pattern)}`}
                                  >
                                    {formatPattern(
                                      report.structural_pattern.pattern,
                                    )}
                                  </span>
                                  <span className="text-sm text-gray-400">
                                    {(
                                      report.structural_pattern.confidence * 100
                                    ).toFixed(0)}
                                    %
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Column: Intensity */}
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Gauge size={20} className="text-red-400" />
                            <h4 className="text-lg font-semibold text-white">
                              Intensity
                            </h4>
                          </div>
                          <div className="space-y-3">
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                              <span className="text-sm text-gray-400 block mb-3">
                                Wind Speed
                              </span>
                              <div className="flex items-baseline gap-3 mb-3">
                                <span className="text-5xl font-bold text-white">
                                  {report.intensity.wind_speed_knots.toFixed(0)}
                                </span>
                                <span className="text-xl text-gray-400">
                                  knots
                                </span>
                              </div>
                              <div className="flex gap-4 text-sm">
                                <span className="text-gray-400">
                                  {report.intensity.wind_speed_kmh.toFixed(1)}{" "}
                                  km/h
                                </span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-400">
                                  {report.intensity.wind_speed_mph.toFixed(1)}{" "}
                                  mph
                                </span>
                              </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">
                                  IMD Category
                                </span>
                                <span
                                  className={`text-3xl font-bold ${getCategoryColor(report.category.category_code)}`}
                                >
                                  {report.category.category_code}
                                </span>
                              </div>
                              <p className="text-white font-medium mb-2">
                                {report.category.category_name}
                              </p>
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getDamageColor(report.category.damage_potential)}`}
                              >
                                {report.category.damage_potential} Damage
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Damage Assessment */}
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle
                              size={20}
                              className="text-orange-400"
                            />
                            <h4 className="text-lg font-semibold text-white">
                              Impact Assessment
                            </h4>
                          </div>
                          <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <span className="text-xs text-gray-500 uppercase mb-2 block">
                                Description
                              </span>
                              <p className="text-sm text-white leading-relaxed">
                                {report.damage_assessment.description}
                              </p>
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <span className="text-xs text-gray-500 uppercase mb-2 block">
                                Infrastructure
                              </span>
                              <p className="text-sm text-white leading-relaxed">
                                {report.damage_assessment.infrastructure}
                              </p>
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <span className="text-xs text-gray-500 uppercase mb-2 block">
                                Coastal Impact
                              </span>
                              <p className="text-sm text-white leading-relaxed">
                                {report.damage_assessment.coastal}
                              </p>
                            </div>

                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                              <div className="flex items-start gap-2">
                                <AlertTriangle
                                  size={16}
                                  className="text-orange-400 flex-shrink-0 mt-0.5"
                                />
                                <div>
                                  <span className="text-xs text-orange-400 uppercase font-semibold mb-1 block">
                                    Recommended Precautions
                                  </span>
                                  <p className="text-sm text-orange-300 leading-relaxed">
                                    {report.damage_assessment.precautions}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional pattern intelligence */}
                    {(() => {
                      const patternKey = report.structural_pattern.pattern;
                      const guidance =
                        PATTERN_GUIDANCE[patternKey] ||
                        PATTERN_GUIDANCE.disorganized;
                      const patternName = formatPattern(patternKey);
                      const confidence = (
                        report.structural_pattern.confidence * 100
                      ).toFixed(0);

                      return (
                        <section className="mt-8 pt-6 border-t border-cyan-500/20">
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <div>
                              <h4 className="text-xl font-semibold text-white">
                                Tropical Cyclone Pattern Intelligence
                              </h4>
                              <p className="text-sm text-gray-400 mt-1">
                                Identification, classification, and
                                pattern-based outlook
                              </p>
                            </div>
                            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
                              {patternName} · {confidence}% confidence
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/25">
                              <div className="flex items-center gap-2 mb-3">
                                <Eye size={18} className="text-blue-400" />
                                <h5 className="font-semibold text-blue-300">
                                  Identification
                                </h5>
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed">
                                {guidance.identification}
                              </p>
                              <p className="text-xs text-gray-500 mt-3">
                                Cyclone present:{" "}
                                {report.is_cyclone_present ? "Yes" : "No"}
                              </p>
                            </div>

                            <div className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/25">
                              <div className="flex items-center gap-2 mb-3">
                                <Target size={18} className="text-purple-400" />
                                <h5 className="font-semibold text-purple-300">
                                  Classification
                                </h5>
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed">
                                {guidance.classification}
                              </p>
                              <p className="text-xs text-gray-500 mt-3">
                                Detected pattern: {patternName}
                              </p>
                            </div>

                            <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                              <div className="flex items-center gap-2 mb-3">
                                <Wind size={18} className="text-emerald-400" />
                                <h5 className="font-semibold text-emerald-300">
                                  Prediction
                                </h5>
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed">
                                {guidance.prediction}
                              </p>
                              <p className="text-xs text-gray-500 mt-3">
                                Pattern-based outlook; not a track forecast.
                              </p>
                            </div>
                          </div>
                        </section>
                      );
                    })()}

                    {/* Image Preview at Bottom */}
                    {previewUrl && (
                      <div className="mt-8 pt-6 border-t border-white/10">
                        <h4 className="text-sm text-gray-400 uppercase mb-3">
                          Analyzed Image
                        </h4>
                        <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-xl border border-white/10">
                          <img
                            src={previewUrl}
                            alt="Analyzed satellite"
                            className="w-full rounded-xl"
                          />
                          {report.is_cyclone_present && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              aria-label="Cyclone intensity heat map"
                              style={{
                                background: report.center
                                  ? "radial-gradient(circle at 50% 50%, rgba(255,247,120,0.78) 0%, rgba(255,150,40,0.56) 12%, rgba(239,68,68,0.38) 28%, rgba(239,68,68,0.12) 48%, transparent 70%)"
                                  : "radial-gradient(circle at 50% 50%, rgba(255,150,40,0.5) 0%, rgba(239,68,68,0.22) 35%, transparent 68%)",
                                mixBlendMode: "screen",
                              }}
                            >
                              <div
                                className="absolute inset-[-8%]"
                                style={{
                                  background:
                                    "radial-gradient(circle at 50% 50%, rgba(255,255,220,0.95) 0%, rgba(255,238,80,0.9) 5%, rgba(255,130,20,0.78) 12%, rgba(239,35,25,0.64) 23%, rgba(250,75,35,0.4) 34%, rgba(122,225,86,0.3) 48%, rgba(52,211,190,0.24) 61%, transparent 76%)",
                                  filter: "blur(5px)",
                                  mixBlendMode: "screen",
                                }}
                              />
                              <div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[72%] aspect-square rounded-full"
                                style={{
                                  background:
                                    "conic-gradient(from 15deg, transparent 0deg, rgba(255,80,30,0.24) 55deg, transparent 115deg, rgba(255,190,40,0.2) 180deg, transparent 245deg, rgba(255,80,30,0.2) 310deg, transparent 360deg)",
                                  maskImage:
                                    "radial-gradient(circle, transparent 0 24%, black 36% 68%, transparent 82%)",
                                  WebkitMaskImage:
                                    "radial-gradient(circle, transparent 0 24%, black 36% 68%, transparent 82%)",
                                  mixBlendMode: "screen",
                                }}
                              />
                              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-yellow-100 shadow-[0_0_18px_6px_rgba(255,190,60,0.9)]" />
                            </div>
                          )}
                          {report.is_cyclone_present && (
                            <div
                              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 pointer-events-none"
                              aria-label="Cyclone identification bracket"
                            >
                              <span className="absolute left-0 top-0 w-7 h-7 border-l-2 border-t-2 border-yellow-100" />
                              <span className="absolute right-0 top-0 w-7 h-7 border-r-2 border-t-2 border-yellow-100" />
                              <span className="absolute left-0 bottom-0 w-7 h-7 border-l-2 border-b-2 border-yellow-100" />
                              <span className="absolute right-0 bottom-0 w-7 h-7 border-r-2 border-b-2 border-yellow-100" />
                            </div>
                          )}
                        </div>
                        {report.is_cyclone_present && (
                          <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-gray-400">
                            <span className="inline-block w-3 h-3 rounded-full bg-yellow-200 shadow-[0_0_8px_rgba(255,190,60,0.8)]" />
                            <span>Core intensity</span>
                            <span className="inline-block w-3 h-3 rounded-full bg-red-400/70" />
                            <span>Outer circulation</span>
                            <span className="inline-block w-3 h-3 border-l-2 border-t-2 border-yellow-100" />
                            <span>Identified area</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
