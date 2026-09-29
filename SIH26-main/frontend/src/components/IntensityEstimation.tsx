import { AlertTriangle, Info, Loader2, Upload, Wind, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

interface IntensityResult {
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
  model: {
    name: string;
    version: string;
    architecture: string;
    training_region: string;
  };
}

export function IntensityEstimation() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IntensityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/tiff"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, or TIFF)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/cyclone/intensity", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to estimate intensity");
      }

      const data: IntensityResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
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

  return (
    <>
      {/* Floating button to open */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl glass-chrome
            flex items-center gap-3 text-text-primary hover:text-ir transition-all
            shadow-lg hover:shadow-xl hover:scale-105"
        >
          <Wind size={20} className="text-ir" />
          <span className="text-sm font-semibold tracking-wide">
            ESTIMATE INTENSITY
          </span>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] bg-ocean-900 border border-ocean-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-ocean-800">
              <div className="flex items-center gap-3">
                <Wind size={24} className="text-ir" />
                <h2 className="text-lg font-bold tracking-wide text-text-primary">
                  CYCLONE INTENSITY ESTIMATION
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg glass-chrome flex items-center justify-center
                  text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Upload */}
                <div className="space-y-4">
                  <div>
                    <label className="metric-label text-text-faint mb-2 block">
                      UPLOAD SATELLITE IMAGE
                    </label>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative border-2 border-dashed border-ocean-700 rounded-xl p-8
                        hover:border-ir/50 transition-colors cursor-pointer glass-chrome"
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
                            className="w-full h-64 object-contain rounded-lg"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReset();
                            }}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-ocean-900/90
                              flex items-center justify-center text-text-muted hover:text-text-primary"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-center">
                          <Upload size={48} className="text-ocean-600" />
                          <div>
                            <p className="text-text-primary font-medium">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-text-muted text-sm mt-1">
                              JPEG, PNG, or TIFF (max 10MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedFile && (
                      <p className="text-xs text-text-muted mt-2">
                        {selectedFile.name} (
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isLoading}
                    className="w-full px-6 py-3 rounded-xl glass-chrome
                      flex items-center justify-center gap-3 text-text-primary
                      hover:text-ir transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      font-semibold tracking-wide"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>ANALYZING...</span>
                      </>
                    ) : (
                      <>
                        <Wind size={20} />
                        <span>ESTIMATE INTENSITY</span>
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
                      <p className="font-semibold mb-1">Model Information:</p>
                      <p>
                        CNN-based deep learning model trained on North Indian
                        Ocean cyclones (2000-2022)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Results */}
                <div className="space-y-4">
                  {result ? (
                    <>
                      <div>
                        <label className="metric-label text-text-faint mb-2 block">
                          INTENSITY
                        </label>
                        <div className="glass-chrome rounded-xl p-4 space-y-3">
                          <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-text-primary">
                              {result.intensity.wind_speed_knots.toFixed(1)}
                            </span>
                            <span className="text-text-muted">knots</span>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span className="text-text-muted">
                              {result.intensity.wind_speed_kmh.toFixed(1)} km/h
                            </span>
                            <span className="text-text-muted">•</span>
                            <span className="text-text-muted">
                              {result.intensity.wind_speed_mph.toFixed(1)} mph
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="metric-label text-text-faint mb-2 block">
                          CATEGORY
                        </label>
                        <div className="glass-chrome rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-2xl font-bold ${getCategoryColor(result.category.category_code)}`}
                            >
                              {result.category.category_code}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDamageColor(result.category.damage_potential)}`}
                            >
                              {result.category.damage_potential}
                            </span>
                          </div>
                          <p className="text-text-primary font-medium">
                            {result.category.category_name}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="metric-label text-text-faint mb-2 block">
                          DAMAGE ASSESSMENT
                        </label>
                        <div className="glass-chrome rounded-xl p-4 space-y-3 text-sm">
                          <div>
                            <p className="text-text-faint text-xs mb-1">
                              Description
                            </p>
                            <p className="text-text-primary">
                              {result.damage_assessment.description}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-faint text-xs mb-1">
                              Infrastructure
                            </p>
                            <p className="text-text-primary">
                              {result.damage_assessment.infrastructure}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-faint text-xs mb-1">
                              Coastal Impact
                            </p>
                            <p className="text-text-primary">
                              {result.damage_assessment.coastal}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-faint text-xs mb-1">
                              Precautions
                            </p>
                            <p className="text-text-primary font-medium">
                              {result.damage_assessment.precautions}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="metric-label text-text-faint mb-2 block">
                          CONFIDENCE
                        </label>
                        <div className="glass-chrome rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-text-primary font-medium">
                              Detection Confidence
                            </span>
                            <span className="text-xl font-bold text-ir">
                              {(result.detection.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-ocean-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-ir to-wv transition-all duration-500"
                              style={{
                                width: `${result.detection.confidence * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-8">
                      <div className="space-y-3">
                        <Wind size={64} className="text-ocean-700 mx-auto" />
                        <p className="text-text-muted">
                          Upload a satellite image to estimate cyclone intensity
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
