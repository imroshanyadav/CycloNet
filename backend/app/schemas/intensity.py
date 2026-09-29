"""
Pydantic schemas for cyclone intensity estimation endpoint.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class IntensityValues(BaseModel):
    """Wind speed in different units."""
    wind_speed_knots: float = Field(..., description="Wind speed in knots")
    wind_speed_kmh: float = Field(..., description="Wind speed in kilometers per hour")
    wind_speed_mph: float = Field(..., description="Wind speed in miles per hour")


class CategoryInfo(BaseModel):
    """Cyclone category classification."""
    category_code: str = Field(..., description="IMD category code (D, DD, CS, SCS, VSCS, ESCS, SuCS)")
    category_name: str = Field(..., description="Full category name")
    damage_potential: str = Field(..., description="General damage level description")


class DamageAssessment(BaseModel):
    """Detailed damage assessment."""
    wind_speed_knots: float = Field(..., description="Wind speed in knots")
    wind_speed_kmh: float = Field(..., description="Wind speed in km/h")
    description: str = Field(..., description="General damage description")
    infrastructure: str = Field(..., description="Expected infrastructure damage")
    coastal: str = Field(..., description="Coastal flooding and storm surge information")
    precautions: str = Field(..., description="Recommended precautions")


class DetectionInfo(BaseModel):
    """Cyclone detection information."""
    has_cyclone: bool = Field(..., description="Whether a cyclone was detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")


class ModelInfo(BaseModel):
    """Model metadata."""
    name: str = Field(..., description="Model identifier")
    version: str = Field(..., description="Model version")
    architecture: str = Field(..., description="Neural network architecture")
    training_region: str = Field(..., description="Geographic region the model was trained on")


class MetadataInfo(BaseModel):
    """Processing metadata."""
    image_shape: list[int] = Field(..., description="Shape of processed image array")
    preprocessing: str = Field(..., description="Preprocessing steps applied")


class IntensityResponse(BaseModel):
    """Response schema for intensity estimation."""
    intensity: IntensityValues = Field(..., description="Wind speed measurements")
    category: CategoryInfo = Field(..., description="Cyclone category classification")
    damage_assessment: DamageAssessment = Field(..., description="Detailed damage assessment")
    detection: DetectionInfo = Field(..., description="Detection confidence")
    model: ModelInfo = Field(..., description="Model information")
    metadata: MetadataInfo = Field(..., description="Processing metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "intensity": {
                    "wind_speed_knots": 75.0,
                    "wind_speed_kmh": 138.9,
                    "wind_speed_mph": 86.3,
                },
                "category": {
                    "category_code": "VSCS",
                    "category_name": "Very Severe Cyclonic Storm",
                    "damage_potential": "Severe",
                },
                "damage_assessment": {
                    "wind_speed_knots": 75.0,
                    "wind_speed_kmh": 138.9,
                    "description": "Severe damage to buildings and infrastructure",
                    "infrastructure": "Major structural damage, long-term power disruptions",
                    "coastal": "Storm surge 2.5-4m, severe coastal inundation",
                    "precautions": "Total evacuation required, seek sturdy shelter inland",
                },
                "detection": {
                    "has_cyclone": True,
                    "confidence": 0.89,
                },
                "model": {
                    "name": "cyclone-intensity-cnn",
                    "version": "1.0.0",
                    "architecture": "ResNet50-based",
                    "training_region": "North Indian Ocean",
                },
                "metadata": {
                    "image_shape": [1, 3, 224, 224],
                    "preprocessing": "RGB normalized [0,1], resized to 224x224",
                },
            }
        }
