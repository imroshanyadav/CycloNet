"""
API endpoints for the three ML tasks: Identification, Classification, Prediction

POST /api/ml/identify       - Task 1: Detect cyclone and locate center
POST /api/ml/classify       - Task 2: Classify structural pattern
POST /api/ml/predict        - Task 3: Predict future trajectory
"""
from __future__ import annotations

import logging
from typing import Annotated, List

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.schemas.ml_tasks import (
    IdentificationResponse,
    ClassificationRequest,
    ClassificationResponse,
    PredictionRequest,
    PredictionResponse,
)
from app.services.ml_tasks_service import (
    run_identification,
    run_classification,
    run_prediction,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ml", tags=["ml-tasks"])


# Maximum file sizes
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_SEQUENCE_LENGTH = 10  # Maximum frames in prediction sequence


def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file."""
    if not file.content_type:
        raise HTTPException(400, "Could not determine file type")
    
    allowed_types = [
        "image/jpeg", "image/jpg", "image/png",
        "image/tiff", "image/tif", "image/geotiff"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            400,
            f"Unsupported file type: {file.content_type}. "
            f"Allowed: JPEG, PNG, TIFF"
        )


# ============================================================================
# Task 1: Identification
# ============================================================================

@router.post("/identify", response_model=IdentificationResponse)
async def identify_cyclone(
    file: Annotated[UploadFile, File(description="Satellite image file")]
) -> IdentificationResponse:
    """
    **Task 1: Cyclone Identification**
    
    Detects whether a cyclone is present in the satellite image and locates its center.
    
    **Input:**
    - Single satellite image (JPEG, PNG, or TIFF)
    
    **Output:**
    - `is_cyclone_present`: Boolean indicating detection
    - `confidence`: Detection confidence (0-1)
    - `center`: Cyclone center coordinates (lat, lon) if detected
    - `model`: Model metadata
    
    **Use Case:**
    - Initial screening of satellite imagery
    - Automated cyclone detection in monitoring systems
    - Determining if further analysis is needed
    
    **Example:**
    ```bash
    curl -X POST "http://localhost:8000/api/ml/identify" \\
         -F "file=@satellite_image.jpg"
    ```
    """
    validate_image_file(file)
    
    try:
        contents = await file.read()
        
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                400,
                f"File too large. Max: 10MB, uploaded: {len(contents) / 1024 / 1024:.1f}MB"
            )
        
        if len(contents) == 0:
            raise HTTPException(400, "Empty file uploaded")
        
        logger.info(f"[IDENTIFY] Processing: {file.filename}, size={len(contents)} bytes")
        
        # Run identification
        result = run_identification(contents)
        
        logger.info(
            f"[IDENTIFY] Result: cyclone={result['is_cyclone_present']}, "
            f"confidence={result['confidence']:.3f}"
        )
        
        return IdentificationResponse(**result)
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"[IDENTIFY] Validation error: {e}")
        raise HTTPException(422, str(e))
    except Exception as e:
        logger.error(f"[IDENTIFY] Error: {e}", exc_info=True)
        raise HTTPException(500, f"Identification failed: {str(e)}")
    finally:
        await file.close()


# ============================================================================
# Task 2: Classification
# ============================================================================

@router.post("/classify", response_model=ClassificationResponse)
async def classify_pattern(
    file: Annotated[UploadFile, File(description="Satellite image file")],
    center_lat: Annotated[float, Form(description="Cyclone center latitude")],
    center_lon: Annotated[float, Form(description="Cyclone center longitude")]
) -> ClassificationResponse:
    """
    **Task 2: Cyclone Classification**
    
    Classifies the structural pattern of a cyclone given its known center location.
    
    **Input:**
    - Satellite image
    - Known cyclone center coordinates (lat, lon)
    
    **Output:**
    - `center`: Input center coordinates
    - `structural_pattern`: Classification result
      - `pattern`: One of: eye, spiral_banding, curved_band, shear_affected, disorganized
      - `confidence`: Classification confidence (0-1)
    - `model`: Model metadata
    
    **Structural Patterns:**
    - **eye**: Clear eye formation (strongest cyclones)
    - **spiral_banding**: Well-defined spiral bands
    - **curved_band**: Curved band structure
    - **shear_affected**: Asymmetric due to wind shear
    - **disorganized**: Poorly organized, no clear structure
    
    **Use Case:**
    - Understanding cyclone intensity and organization
    - Tracking cyclone development stages
    - Assessing structural changes over time
    
    **Example:**
    ```bash
    curl -X POST "http://localhost:8000/api/ml/classify" \\
         -F "file=@satellite_image.jpg" \\
         -F "center_lat=15.2" \\
         -F "center_lon=68.4"
    ```
    """
    validate_image_file(file)
    
    # Validate coordinates
    if not (-90 <= center_lat <= 90):
        raise HTTPException(400, f"Invalid latitude: {center_lat} (must be -90 to 90)")
    if not (-180 <= center_lon <= 180):
        raise HTTPException(400, f"Invalid longitude: {center_lon} (must be -180 to 180)")
    
    try:
        contents = await file.read()
        
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                400,
                f"File too large. Max: 10MB, uploaded: {len(contents) / 1024 / 1024:.1f}MB"
            )
        
        logger.info(
            f"[CLASSIFY] Processing: {file.filename}, "
            f"center=({center_lat}, {center_lon})"
        )
        
        # Run classification
        result = run_classification(contents, center_lat, center_lon)
        
        logger.info(
            f"[CLASSIFY] Result: pattern={result['structural_pattern']['pattern']}, "
            f"confidence={result['structural_pattern']['confidence']:.3f}"
        )
        
        return ClassificationResponse(**result)
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"[CLASSIFY] Validation error: {e}")
        raise HTTPException(422, str(e))
    except Exception as e:
        logger.error(f"[CLASSIFY] Error: {e}", exc_info=True)
        raise HTTPException(500, f"Classification failed: {str(e)}")
    finally:
        await file.close()


# ============================================================================
# Task 3: Prediction
# ============================================================================

@router.post("/predict", response_model=PredictionResponse)
async def predict_trajectory(
    files: Annotated[List[UploadFile], File(description="Sequence of satellite images (T-12h → T0)")],
) -> PredictionResponse:
    """
    **Task 3: Cyclone Prediction**
    
    Predicts future cyclone center position and structural pattern from a sequence of past frames.
    
    **Input:**
    - Sequence of satellite images (2-10 frames)
    - Images should be ordered chronologically (oldest to newest)
    - Typical: T-12h, T-6h, T0 (3 frames, 6-hour intervals)
    
    **Output:**
    - `input_sequence_length`: Number of frames used
    - `current_time`: Base time (T0)
    - `predictions`: List of forecasts
      - **T+12h**: 12-hour forecast
        - `center`: Predicted position
        - `structural_pattern`: Predicted pattern and confidence
        - `uncertainty`: Spatial uncertainty (sigma_lat, sigma_lon in degrees)
      - **T+24h**: 24-hour forecast
        - Same structure as T+12h
    - `model`: Model metadata
    
    **Use Case:**
    - Cyclone track forecasting
    - Planning evacuation and emergency response
    - Understanding cyclone evolution
    
    **Requirements:**
    - Minimum 2 frames, maximum 10 frames
    - Frames should cover at least 6 hours
    - Consistent time intervals preferred
    
    **Example:**
    ```bash
    curl -X POST "http://localhost:8000/api/ml/predict" \\
         -F "files=@frame_t_minus_12h.jpg" \\
         -F "files=@frame_t_minus_6h.jpg" \\
         -F "files=@frame_t0.jpg"
    ```
    """
    # Validate sequence length
    if len(files) < 2:
        raise HTTPException(400, "Prediction requires at least 2 frames in sequence")
    
    if len(files) > MAX_SEQUENCE_LENGTH:
        raise HTTPException(
            400,
            f"Too many files. Max: {MAX_SEQUENCE_LENGTH}, uploaded: {len(files)}"
        )
    
    # Validate all files
    for file in files:
        validate_image_file(file)
    
    try:
        # Read all files
        image_sequence = []
        timestamps = []
        
        for idx, file in enumerate(files):
            contents = await file.read()
            
            if len(contents) > MAX_FILE_SIZE:
                raise HTTPException(
                    400,
                    f"File {idx+1} too large: {len(contents) / 1024 / 1024:.1f}MB"
                )
            
            image_sequence.append(contents)
            
            # Generate timestamps (6-hour intervals in past)
            # In real usage, these would come from file metadata or separate input
            hours_ago = (len(files) - 1 - idx) * 6
            from datetime import datetime, timedelta, timezone
            timestamp = (datetime.now(timezone.utc) - timedelta(hours=hours_ago)).isoformat()
            timestamps.append(timestamp)
        
        logger.info(
            f"[PREDICT] Processing sequence: {len(files)} frames, "
            f"time span: {timestamps[0]} → {timestamps[-1]}"
        )
        
        # Run prediction
        result = run_prediction(image_sequence, timestamps)
        
        logger.info(
            f"[PREDICT] Result: T+12h center=({result['predictions'][0]['center']['lat']}, "
            f"{result['predictions'][0]['center']['lon']})"
        )
        
        return PredictionResponse(**result)
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"[PREDICT] Validation error: {e}")
        raise HTTPException(422, str(e))
    except Exception as e:
        logger.error(f"[PREDICT] Error: {e}", exc_info=True)
        raise HTTPException(500, f"Prediction failed: {str(e)}")
    finally:
        for file in files:
            await file.close()


# ============================================================================
# Info Endpoints
# ============================================================================

@router.get("/patterns")
async def get_pattern_info() -> JSONResponse:
    """
    Get information about cyclone structural patterns.
    
    Returns descriptions of the 5 structural pattern types used in classification.
    """
    from app.services.ml_tasks_service import STRUCTURAL_PATTERNS
    
    patterns_info = {
        "eye": {
            "description": "Clear eye formation with well-organized eyewall",
            "typical_intensity": "Very severe to extremely severe",
            "characteristics": "Circular eye, symmetric structure, strongest winds"
        },
        "spiral_banding": {
            "description": "Well-defined spiral rainbands without clear eye",
            "typical_intensity": "Severe to very severe",
            "characteristics": "Organized spiral structure, developing system"
        },
        "curved_band": {
            "description": "Curved band structure, less organized",
            "typical_intensity": "Moderate to severe",
            "characteristics": "Curved cloud bands, asymmetric"
        },
        "shear_affected": {
            "description": "Asymmetric structure due to wind shear",
            "typical_intensity": "Variable, often weakening",
            "characteristics": "Tilted structure, exposed center, convection displaced"
        },
        "disorganized": {
            "description": "Poorly organized, no clear structural pattern",
            "typical_intensity": "Low to moderate",
            "characteristics": "Scattered convection, weak circulation, developing or dissipating"
        }
    }
    
    return JSONResponse(content={
        "patterns": STRUCTURAL_PATTERNS,
        "details": patterns_info
    })
