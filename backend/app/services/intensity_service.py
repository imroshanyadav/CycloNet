"""
Cyclone Intensity Estimation Service

This service handles cyclone intensity estimation using a CNN-based deep learning model.
The model takes satellite imagery as input and predicts:
- Cyclone intensity (wind speed in knots)
- Category classification (Depression, Cyclonic Storm, Severe Cyclonic Storm, etc.)
- Potential damage assessment

Based on research: "An End-to-End Deep Learning Framework for Cyclone Intensity 
Estimation in North Indian Ocean Region using Satellite Imagery"
"""
from __future__ import annotations

import logging
from typing import Any, BinaryIO
import numpy as np
from PIL import Image
import io

logger = logging.getLogger(__name__)


# Cyclone categories based on IMD classification
CYCLONE_CATEGORIES = {
    "D": {"name": "Depression", "wind_range": (17, 27), "damage": "Minimal"},
    "DD": {"name": "Deep Depression", "wind_range": (28, 33), "damage": "Minor"},
    "CS": {"name": "Cyclonic Storm", "wind_range": (34, 47), "damage": "Moderate"},
    "SCS": {"name": "Severe Cyclonic Storm", "wind_range": (48, 63), "damage": "Extensive"},
    "VSCS": {"name": "Very Severe Cyclonic Storm", "wind_range": (64, 89), "damage": "Severe"},
    "ESCS": {"name": "Extremely Severe Cyclonic Storm", "wind_range": (90, 119), "damage": "Devastating"},
    "SuCS": {"name": "Super Cyclonic Storm", "wind_range": (120, 221), "damage": "Catastrophic"},
}


def classify_intensity(wind_speed_knots: float) -> dict[str, Any]:
    """
    Classify cyclone intensity based on wind speed.
    
    Parameters
    ----------
    wind_speed_knots : float
        Maximum sustained wind speed in knots
        
    Returns
    -------
    dict
        Category code, name, and damage potential
    """
    for code, info in CYCLONE_CATEGORIES.items():
        min_wind, max_wind = info["wind_range"]
        if min_wind <= wind_speed_knots <= max_wind:
            return {
                "category_code": code,
                "category_name": info["name"],
                "damage_potential": info["damage"],
            }
    
    # If below minimum
    if wind_speed_knots < 17:
        return {
            "category_code": "LOW",
            "category_name": "Low Pressure Area",
            "damage_potential": "None",
        }
    
    # If above maximum
    return {
        "category_code": "SuCS",
        "category_name": "Super Cyclonic Storm",
        "damage_potential": "Catastrophic",
    }


def estimate_damage_details(category_code: str, wind_speed: float) -> dict[str, Any]:
    """
    Provide detailed damage estimation based on cyclone category.
    
    Parameters
    ----------
    category_code : str
        Cyclone category code
    wind_speed : float
        Wind speed in knots
        
    Returns
    -------
    dict
        Detailed damage assessment
    """
    damage_details = {
        "LOW": {
            "description": "Minimal to no damage expected",
            "infrastructure": "No significant damage",
            "coastal": "No storm surge expected",
            "precautions": "Monitor weather updates",
        },
        "D": {
            "description": "Minor damage to temporary structures",
            "infrastructure": "Damage to weak structures, some trees uprooted",
            "coastal": "Minor flooding in low-lying coastal areas",
            "precautions": "Stay indoors, secure loose objects",
        },
        "DD": {
            "description": "Damage to temporary structures and crops",
            "infrastructure": "Power and communication disruptions possible",
            "coastal": "Coastal areas may experience flooding",
            "precautions": "Avoid travel, stay in safe shelter",
        },
        "CS": {
            "description": "Moderate damage to structures and vegetation",
            "infrastructure": "Significant damage to weak structures, power outages",
            "coastal": "Storm surge up to 1-1.5m above normal tide",
            "precautions": "Evacuate low-lying areas, emergency supplies ready",
        },
        "SCS": {
            "description": "Extensive damage to structures and infrastructure",
            "infrastructure": "Extensive damage to buildings, widespread power outages",
            "coastal": "Storm surge up to 2-2.5m, major coastal flooding",
            "precautions": "Mandatory evacuation of coastal areas",
        },
        "VSCS": {
            "description": "Severe damage to buildings and infrastructure",
            "infrastructure": "Major structural damage, long-term power disruptions",
            "coastal": "Storm surge 2.5-4m, severe coastal inundation",
            "precautions": "Total evacuation required, seek sturdy shelter inland",
        },
        "ESCS": {
            "description": "Devastating damage across the region",
            "infrastructure": "Catastrophic structural damage, complete infrastructure failure",
            "coastal": "Storm surge 4-6m, extensive coastal devastation",
            "precautions": "Complete evacuation mandatory, life-threatening situation",
        },
        "SuCS": {
            "description": "Catastrophic damage with long-term impacts",
            "infrastructure": "Near-total destruction of structures, months for recovery",
            "coastal": "Storm surge >6m, complete coastal devastation",
            "precautions": "Extreme emergency - evacuate far inland immediately",
        },
    }
    
    details = damage_details.get(category_code, damage_details["LOW"])
    details["wind_speed_kmh"] = round(wind_speed * 1.852, 1)  # Convert knots to km/h
    details["wind_speed_knots"] = round(wind_speed, 1)
    
    return details


def preprocess_image(image_data: bytes | BinaryIO, target_size: tuple = (224, 224)) -> np.ndarray:
    """
    Preprocess uploaded image for model inference.
    
    Parameters
    ----------
    image_data : bytes or file-like
        Raw image data
    target_size : tuple
        Target image size (height, width)
        
    Returns
    -------
    np.ndarray
        Preprocessed image array normalized for model input
    """
    try:
        # Load image
        if isinstance(image_data, bytes):
            image = Image.open(io.BytesIO(image_data))
        else:
            image = Image.open(image_data)
        
        # Convert to RGB if needed
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Resize
        image = image.resize(target_size, Image.Resampling.BILINEAR)
        
        # Convert to array and normalize
        img_array = np.array(image, dtype=np.float32)
        
        # Normalize to [0, 1]
        img_array = img_array / 255.0
        
        # Transpose to [C, H, W] format expected by PyTorch models
        img_array = np.transpose(img_array, (2, 0, 1))
        
        # Add batch dimension: [1, C, H, W]
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
        
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        raise ValueError(f"Failed to preprocess image: {str(e)}")


def run_intensity_estimation(image_data: bytes | BinaryIO) -> dict[str, Any]:
    """
    Run cyclone intensity estimation on uploaded satellite image.
    
    This is the main entry point for the intensity estimation service.
    Currently uses a stub implementation. When the actual model is integrated,
    this will call the real CNN model.
    
    Parameters
    ----------
    image_data : bytes or file-like
        Satellite image data
        
    Returns
    -------
    dict
        Prediction results including:
        - intensity (wind speed in knots)
        - category information
        - damage assessment
        - confidence scores
        - model metadata
    """
    try:
        # Preprocess the image
        preprocessed = preprocess_image(image_data)
        logger.info(f"Preprocessed image shape: {preprocessed.shape}")
        
        # Try to use real model if available
        try:
            from app.services.intensity_model import predict_intensity
            result = predict_intensity(preprocessed)
            logger.info("[INTENSITY] Using real CNN model")
            return result
        except ImportError:
            logger.warning("[INTENSITY] Real model not available, using stub predictions")
            return _stub_intensity_prediction(preprocessed)
            
    except Exception as e:
        logger.error(f"Intensity estimation failed: {e}")
        raise


def _stub_intensity_prediction(image_array: np.ndarray) -> dict[str, Any]:
    """
    Stub implementation for intensity estimation.
    Returns realistic predictions based on image properties.
    
    This will be replaced with actual model inference once integrated.
    """
    # Analyze image properties for more realistic stub
    mean_intensity = float(np.mean(image_array))
    std_intensity = float(np.std(image_array))
    
    # Generate pseudo-random but consistent prediction based on image stats
    base_wind_speed = 45.0 + (mean_intensity - 0.5) * 80.0
    base_wind_speed = max(17.0, min(120.0, base_wind_speed))  # Clamp to valid range
    
    # Add some variance based on std
    wind_speed = base_wind_speed + (std_intensity - 0.15) * 10.0
    wind_speed = max(20.0, min(115.0, wind_speed))
    
    # Classify the intensity
    category = classify_intensity(wind_speed)
    damage = estimate_damage_details(category["category_code"], wind_speed)
    
    # Calculate confidence (higher for clearer patterns, indicated by higher std)
    confidence = 0.65 + min(std_intensity * 1.5, 0.30)
    
    return {
        "intensity": {
            "wind_speed_knots": round(wind_speed, 1),
            "wind_speed_kmh": round(wind_speed * 1.852, 1),
            "wind_speed_mph": round(wind_speed * 1.15078, 1),
        },
        "category": category,
        "damage_assessment": damage,
        "detection": {
            "has_cyclone": True,
            "confidence": round(confidence, 3),
        },
        "model": {
            "name": "cyclone-intensity-cnn-stub",
            "version": "0.1.0",
            "architecture": "ResNet50-based",
            "training_region": "North Indian Ocean",
        },
        "metadata": {
            "image_shape": list(image_array.shape),
            "preprocessing": "RGB normalized [0,1], resized to 224x224",
        },
    }
