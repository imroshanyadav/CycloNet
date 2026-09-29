import {
  AlertTriangle,
  Eye,
  Info,
  Loader2,
  MapPin,
  Target,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

type TaskType = "identify" | "classify" | "predict" | null;

interface IdentifyResult {
  is_cyclone_present: boolean;
  confidence: number;
  center: { lat: number; lon: number } | null;
  model: { name: string; version: string; architecture: string };
}

interface ClassifyResult {
  center: { lat: number; lon: number };
  structural_pattern: { pattern: string; confidence: number };
  model: { name: string; version: string; architecture: string };
}

interface PredictionHorizon {
  horizon_hours: number;
  center: { lat: number; lon: number };
  structural_pattern: { pattern: string; confidence: number };
  uncertainty: { sigma_lat: number; sigma_lon: number };
}

interface PredictResult {
  input_sequence_length: number;
  current_time: string;
  predictions: PredictionHorizon[];
  model: { name: string; version: string; architecture: string };
}

export function MLTasks() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [identifyResult, setIdentifyResult] = useState<IdentifyResult | null>(
    null,
  );
  const [classifyResult, setClassifyResult] = useState<ClassifyResult | null>(
    null,
  );
  const [predictResult, setPredictResult] = useState<PredictResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [centerLat, setCenterLat] = useState<string>("");
  const [centerLon, setCenterLon] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tasks = [
    {
      id: "identify" as TaskType,
      icon: Eye,
      title: "Identification",
      description: "Detect cyclone and locate center",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      id: "classify" as TaskType,
      icon: Target,
      title: "Classification",
      description: "Identify structural pattern",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    },
    {
      id: "predict" as TaskType,
      icon: TrendingUp,
      title: "Prediction",
      description: "Forecast future trajectory",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
  ];

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate based on task
    if (selectedTask === "predict" && files.length < 2) {
      setError("Prediction requires at least 2 images (sequence)");
      return;
    }

    if (selectedTask !== "predict" && files.length > 1) {
      setError("This task requires only 1 image");
      return;
    }

    // Validate file types
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/tiff"];
    const invalidFile = files.find((f) => !validTypes.includes(f.type));
    if (invalidFile) {
      setError("Please upload valid image files (JPEG, PNG, or TIFF)");
      return;
    }

    // Validate file sizes
    const oversizedFile = files.find((f) => f.size > 10 * 1024 * 1024);
    if (oversizedFile) {
      setError("Each file must be less than 10MB");
      return;
    }

    setSelectedFiles(files);
    setError(null);
    setIdentifyResult(null);
    setClassifyResult(null);
    setPredictResult(null);

    // Create previews
    const urls = files.map((file) => {
      const reader = new FileReader();
      return new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(urls).then(setPreviewUrls);
  };

  const handleRun = async () => {
    if (!selectedTask || selectedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      if (selectedTask === "identify") {
        await runIdentify();
      } else if (selectedTask === "classify") {
        await runClassify();
      } else if (selectedTask === "predict") {
        await runPredict();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const runIdentify = async () => {
    const formData = new FormData();
    formData.append("file", selectedFiles[0]);

    const response = await fetch("/api/ml/identify", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Identification failed");
    }

    const data: IdentifyResult = await response.json();
    setIdentifyResult(data);
  };

  const runClassify = async () => {
    if (!centerLat || !centerLon) {
      throw new Error("Please provide center coordinates");
    }

    const formData = new FormData();
    formData.append("file", selectedFiles[0]);
    formData.append("center_lat", centerLat);
    formData.append("center_lon", centerLon);

    const response = await fetch("/api/ml/classify", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Classification failed");
    }

    const data: ClassifyResult = await response.json();
    setClassifyResult(data);
  };

  const runPredict = async () => {
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch("/api/ml/predict", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Prediction failed");
    }

    const data: PredictResult = await response.json();
    setPredictResult(data);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setIdentifyResult(null);
    setClassifyResult(null);
    setPredictResult(null);
    setError(null);
    setCenterLat("");
    setCenterLon("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl border border-cyan-400/30 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.22),_rgba(8,15,25,0.9)_55%)] text-cyan-50 flex items-center gap-3 hover:shadow-[0_0_25px_rgba(34,211,238,0.24)] transition-all hover:scale-[1.02] shadow-lg font-semibold backdrop-blur-md"
        >
          <Upload size={20} className="text-cyan-300" />
          <span className="text-sm tracking-[0.18em]">ML ANALYSIS</span>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-6xl max-h-[90vh] bg-[#07101a] border border-slate-700/80 rounded-2xl shadow-[0_20px_80px_rgba(2,8,23,0.8)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/70 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-300">
                  <Upload size={18} />
                </div>
                <h2 className="text-lg font-bold tracking-[0.18em] text-slate-100">
                  ML ANALYSIS TASKS
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-200 hover:border-cyan-400/30 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Task Selection */}
              {!selectedTask && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-center mb-8">
                    Select an analysis task to begin
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {tasks.map((task) => {
                      const Icon = task.icon;
                      return (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTask(task.id)}
                          className={`p-6 rounded-xl border ${task.borderColor} bg-slate-900/80 hover:bg-slate-800/90 hover:scale-[1.02] transition-all group shadow-[0_12px_30px_rgba(2,6,23,0.38)]`}
                        >
                          <div className="flex flex-col items-center text-center gap-3">
                            <div
                              className={`p-4 rounded-full border ${task.borderColor} ${task.bgColor} ${task.color}`}
                            >
                              <Icon size={32} />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-100">
                              {task.title}
                            </h3>
                            <p className="text-sm text-slate-300">
                              {task.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Task Execution */}
              {selectedTask && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Upload & Input */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        {tasks.find((t) => t.id === selectedTask)?.title}
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedTask(null);
                          handleReset();
                        }}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        Change Task
                      </button>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-2 block uppercase tracking-wider">
                        {selectedTask === "predict"
                          ? "UPLOAD IMAGE SEQUENCE (2-10 frames)"
                          : "UPLOAD SATELLITE IMAGE"}
                      </label>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative border-2 border-dashed border-slate-600 rounded-xl p-8 hover:border-cyan-400/40 transition-colors cursor-pointer bg-slate-900/60"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/tiff"
                          multiple={selectedTask === "predict"}
                          onChange={handleFileSelect}
                          className="hidden"
                        />

                        {previewUrls.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {previewUrls.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-center">
                            <Upload size={48} className="text-gray-600" />
                            <div>
                              <p className="text-white font-medium">
                                Click to upload
                              </p>
                              <p className="text-gray-500 text-sm mt-1">
                                JPEG, PNG, or TIFF (max 10MB)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedFiles.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {selectedFiles.length} file(s) selected
                        </p>
                      )}
                    </div>

                    {/* Classification requires center input */}
                    {selectedTask === "classify" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">
                            <MapPin size={12} className="inline mr-1" />
                            CENTER LATITUDE
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={centerLat}
                            onChange={(e) => setCenterLat(e.target.value)}
                            placeholder="e.g., 15.2"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">
                            <MapPin size={12} className="inline mr-1" />
                            CENTER LONGITUDE
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={centerLon}
                            onChange={(e) => setCenterLon(e.target.value)}
                            placeholder="e.g., 68.4"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleRun}
                      disabled={!selectedFiles.length || isLoading}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white
                        flex items-center justify-center gap-3 shadow-[0_12px_24px_rgba(14,165,233,0.35)]
                        hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        font-semibold tracking-[0.18em]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          <span>ANALYZING...</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp size={20} />
                          <span>RUN ANALYSIS</span>
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

                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
                      <Info
                        size={20}
                        className="text-blue-400 flex-shrink-0 mt-0.5"
                      />
                      <div className="text-xs text-blue-400">
                        <p className="font-semibold mb-1">
                          {selectedTask === "identify" &&
                            "Detects cyclone presence and locates center"}
                          {selectedTask === "classify" &&
                            "Identifies structural pattern at given center"}
                          {selectedTask === "predict" &&
                            "Forecasts T+12h and T+24h from sequence"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Results */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">
                      Results
                    </h3>

                    {/* Identification Results */}
                    {identifyResult && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-400">
                              Detection
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                identifyResult.is_cyclone_present
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {identifyResult.is_cyclone_present
                                ? "CYCLONE DETECTED"
                                : "NO CYCLONE"}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">
                              {(identifyResult.confidence * 100).toFixed(1)}%
                            </span>
                            <span className="text-sm text-gray-400">
                              confidence
                            </span>
                          </div>
                        </div>

                        {identifyResult.center && (
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-sm text-gray-400 block mb-2">
                              Center Location
                            </span>
                            <div className="flex gap-4">
                              <div>
                                <span className="text-xs text-gray-500">
                                  Latitude
                                </span>
                                <p className="text-xl font-bold text-white">
                                  {identifyResult.center.lat.toFixed(2)}°
                                </p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">
                                  Longitude
                                </span>
                                <p className="text-xl font-bold text-white">
                                  {identifyResult.center.lon.toFixed(2)}°
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Classification Results */}
                    {classifyResult && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <span className="text-sm text-gray-400 block mb-2">
                            Structural Pattern
                          </span>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-2xl font-bold ${getPatternColor(classifyResult.structural_pattern.pattern)}`}
                            >
                              {formatPattern(
                                classifyResult.structural_pattern.pattern,
                              )}
                            </span>
                            <span className="text-lg text-gray-400">
                              {(
                                classifyResult.structural_pattern.confidence *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <span className="text-sm text-gray-400 block mb-2">
                            Center Used
                          </span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-white">
                              Lat: {classifyResult.center.lat.toFixed(2)}°
                            </span>
                            <span className="text-white">
                              Lon: {classifyResult.center.lon.toFixed(2)}°
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Prediction Results */}
                    {predictResult && (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm">
                          <span className="text-blue-400">
                            Sequence: {predictResult.input_sequence_length}{" "}
                            frames
                          </span>
                        </div>

                        {predictResult.predictions.map((pred) => (
                          <div
                            key={pred.horizon_hours}
                            className="p-4 rounded-xl bg-white/5 border border-white/10"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-white">
                                T+{pred.horizon_hours}h Forecast
                              </span>
                              <span className="text-xs text-gray-400">
                                {(
                                  pred.structural_pattern.confidence * 100
                                ).toFixed(0)}
                                % confidence
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-xs text-gray-500">
                                  Center
                                </span>
                                <p className="text-white">
                                  {pred.center.lat.toFixed(2)}°,{" "}
                                  {pred.center.lon.toFixed(2)}°
                                </p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">
                                  Pattern
                                </span>
                                <p
                                  className={getPatternColor(
                                    pred.structural_pattern.pattern,
                                  )}
                                >
                                  {formatPattern(
                                    pred.structural_pattern.pattern,
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 text-xs text-gray-500">
                              Uncertainty: ±
                              {pred.uncertainty.sigma_lat.toFixed(2)}° lat, ±
                              {pred.uncertainty.sigma_lon.toFixed(2)}° lon
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!identifyResult && !classifyResult && !predictResult && (
                      <div className="h-full flex items-center justify-center text-center p-8">
                        <div className="space-y-3">
                          <div className="text-6xl">🌀</div>
                          <p className="text-gray-500">
                            Results will appear here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
