"""
Pydantic schemas for the three ML tasks: Identification, Classification, Prediction
"""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


# ============================================================================
# Task 1: Identification
# ============================================================================

class CycloneCenter(BaseModel):
    """Cyclone center coordinates."""
    lat: float = Field(..., description="Latitude in decimal degrees")
    lon: float = Field(..., description="Longitude in decimal degrees")


class IdentificationResponse(BaseModel):
    """Response for cyclone identification task."""
    is_cyclone_present: bool = Field(..., description="Whether a cyclone was detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence")
    center: Optional[CycloneCenter] = Field(None, description="Cyclone center if detected")
    model: dict = Field(..., description="Model metadata")
    
    class Config:
        json_schema_extra = {
            "example": {
                "is_cyclone_present": True,
                "confidence": 0.94,
                "center": {"lat": 15.2, "lon": 68.4},
                "model": {
                    "name": "cyclone-detector-cnn",
                    "version": "1.0.0",
                    "architecture": "ResNet50"
                }
            }
        }


# ============================================================================
# Task 2: Classification
# ============================================================================

class StructuralPattern(BaseModel):
    """Cyclone structural pattern classification."""
    pattern: str = Field(
        ..., 
        description="Pattern type: eye, spiral_banding, curved_band, shear_affected, disorganized"
    )
    confidence: float = Field(..., ge=0.0, le=1.0, description="Classification confidence")


class ClassificationRequest(BaseModel):
    """Request for cyclone classification."""
    center_lat: float = Field(..., description="Known cyclone center latitude")
    center_lon: float = Field(..., description="Known cyclone center longitude")


class ClassificationResponse(BaseModel):
    """Response for cyclone classification task."""
    center: CycloneCenter = Field(..., description="Input cyclone center")
    structural_pattern: StructuralPattern = Field(..., description="Identified pattern")
    model: dict = Field(..., description="Model metadata")
    
    class Config:
        json_schema_extra = {
            "example": {
                "center": {"lat": 15.2, "lon": 68.4},
                "structural_pattern": {
                    "pattern": "eye",
                    "confidence": 0.87
                },
                "model": {
                    "name": "cyclone-classifier-cnn",
                    "version": "1.0.0",
                    "architecture": "ResNet34"
                }
            }
        }


# ============================================================================
# Task 3: Prediction
# ============================================================================

class FrameTimestamp(BaseModel):
    """Timestamp for a frame in sequence."""
    timestamp: str = Field(..., description="ISO 8601 timestamp (e.g., '2023-06-14T12:00:00Z')")


class PredictionHorizon(BaseModel):
    """Prediction at a specific time horizon."""
    horizon_hours: int = Field(..., description="Hours into future (12 or 24)")
    center: CycloneCenter = Field(..., description="Predicted center position")
    structural_pattern: StructuralPattern = Field(..., description="Predicted pattern")
    uncertainty: dict = Field(..., description="Spatial uncertainty (sigma_lat, sigma_lon in degrees)")


class PredictionRequest(BaseModel):
    """Request for cyclone prediction."""
    sequence_timestamps: List[str] = Field(
        ..., 
        description="List of timestamps for past frames (T-12h → T0), ISO 8601 format"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "sequence_timestamps": [
                    "2023-06-14T00:00:00Z",
                    "2023-06-14T06:00:00Z",
                    "2023-06-14T12:00:00Z"
                ]
            }
        }


class PredictionResponse(BaseModel):
    """Response for cyclone prediction task."""
    input_sequence_length: int = Field(..., description="Number of frames used")
    current_time: str = Field(..., description="Base time (T0) ISO 8601")
    predictions: List[PredictionHorizon] = Field(..., description="Predictions at T+12h and T+24h")
    model: dict = Field(..., description="Model metadata")
    
    class Config:
        json_schema_extra = {
            "example": {
                "input_sequence_length": 3,
                "current_time": "2023-06-14T12:00:00Z",
                "predictions": [
                    {
                        "horizon_hours": 12,
                        "center": {"lat": 16.1, "lon": 67.8},
                        "structural_pattern": {"pattern": "eye", "confidence": 0.82},
                        "uncertainty": {"sigma_lat": 0.5, "sigma_lon": 0.5}
                    },
                    {
                        "horizon_hours": 24,
                        "center": {"lat": 17.2, "lon": 67.1},
                        "structural_pattern": {"pattern": "spiral_banding", "confidence": 0.76},
                        "uncertainty": {"sigma_lat": 0.8, "sigma_lon": 0.8}
                    }
                ],
                "model": {
                    "name": "cyclone-predictor-lstm",
                    "version": "1.0.0",
                    "architecture": "ConvLSTM"
                }
            }
        }
