"""
Pydantic schemas for YOLO Cyclone Detection and Live Water Telemetry.
"""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class YoloBoundingBox(BaseModel):
    """Bounding box in normalized pixel space [0..1] and geographic space."""
    x1: float = Field(..., description="Normalized left coordinate (0..1)")
    y1: float = Field(..., description="Normalized top coordinate (0..1)")
    x2: float = Field(..., description="Normalized right coordinate (0..1)")
    y2: float = Field(..., description="Normalized bottom coordinate (0..1)")
    center_lat: float = Field(..., description="Geographic center latitude (°N)")
    center_lon: float = Field(..., description="Geographic center longitude (°E)")
    width_deg: float = Field(..., description="Span in latitude degrees")
    height_deg: float = Field(..., description="Span in longitude degrees")


class YoloDetection(BaseModel):
    """A single YOLO detection."""
    detection_id: str
    class_id: int
    class_name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    box: YoloBoundingBox
    basin: str
    estimated_intensity_kts: float
    estimated_pressure_hpa: float
    dvorak_t_number: str
    imd_classification: str
    vorticity_index: float
    core_convection_density: float


class OceanBasinWaterStatus(BaseModel):
    """Real live oceanic and marine water metrics for a specific basin."""
    basin_name: str
    coordinates: List[float]
    sea_surface_temp_c: float
    sst_threshold_met: bool = Field(..., description="True if SST >= 26.5°C required for cyclogenesis")
    surface_pressure_hpa: float
    wind_speed_kmh: float
    wave_height_m: float
    cyclone_genesis_potential: str = Field(..., description="'HIGH', 'MODERATE', 'LOW', or 'NEGLIGIBLE'")
    water_conditions_summary: str


class YoloModelMetadata(BaseModel):
    """Details about the running YOLO model."""
    model_name: str = "CycloneYOLOv8-NIO"
    architecture: str = "CSPDarknet + BiFPN + Tri-Scale Anchor-Free Head"
    input_resolution: str = "640x640 RGB"
    grid_cells_evaluated: int = 8400
    inference_time_ms: float
    confidence_threshold: float = 0.35
    iou_threshold: float = 0.45
    framework: str = "Vectorized PyTorch/NumPy Tensor Engine"


class YoloScanRequest(BaseModel):
    """Parameters for running a YOLO scan on India satellite imagery."""
    date: Optional[str] = Field(None, description="Observation date (YYYY-MM-DD), defaults to today")
    layer: Optional[str] = Field("MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m", description="NASA GIBS Layer")
    confidence_threshold: Optional[float] = Field(0.35, ge=0.1, le=0.95)
    force_live_fetch: Optional[bool] = Field(True, description="Fetch live NASA GIBS raster")


class YoloScanResponse(BaseModel):
    """Complete response from YOLO scanning the map of India."""
    status: str
    cyclone_detected: bool
    scan_timestamp: str
    satellite_source: str
    satellite_date: str
    geographic_scope: str
    bbox: str
    detections_count: int
    detections: List[YoloDetection]
    model_metadata: YoloModelMetadata
    marine_water_analysis: List[OceanBasinWaterStatus]
    meteorological_summary: str
