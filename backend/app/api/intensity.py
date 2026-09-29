"""
POST /api/cyclone/intensity — Upload satellite image and estimate cyclone intensity

This endpoint accepts a satellite image upload and returns:
- Cyclone intensity (wind speed in multiple units)
- IMD category classification
- Detailed damage assessment
- Detection confidence

Based on CNN deep learning model for North Indian Ocean region.
"""
from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.schemas.intensity import IntensityResponse
from app.services.intensity_service import run_intensity_estimation

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/cyclone", tags=["intensity"])


@router.post("/intensity", response_model=IntensityResponse)
async def estimate_intensity(
    file: Annotated[UploadFile, File(description="Satellite image file (JPEG, PNG, or GeoTIFF)")],
) -> IntensityResponse:
    """
    Estimate cyclone intensity from uploaded satellite image.
    
    **Input:**
    - Satellite image file (JPEG, PNG, or GeoTIFF format)
    - Recommended: IR, Water Vapor, or RGB composite images
    
    **Output:**
    - Wind speed in knots, km/h, and mph
    - IMD cyclone category (D, DD, CS, SCS, VSCS, ESCS, SuCS)
    - Detailed damage assessment
    - Detection confidence score
    
    **Model:**
    - CNN-based architecture trained on North Indian Ocean cyclones
    - Based on INSAT-3D satellite imagery (2000-2022)
    
    **Example Usage:**
    ```bash
    curl -X POST "http://localhost:8000/api/cyclone/intensity" \\
         -F "file=@cyclone_image.jpg"
    ```
    """
    # Validate file type
    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Could not determine file type. Please upload a valid image file.",
        )
    
    allowed_types = [
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "image/tiff",
        "image/tif",
        "image/geotiff",
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Allowed types: JPEG, PNG, TIFF/GeoTIFF",
        )
    
    # Validate file size (max 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    try:
        # Read file content
        contents = await file.read()
        
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: 10MB, uploaded: {len(contents) / 1024 / 1024:.1f}MB",
            )
        
        if len(contents) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded. Please upload a valid image.",
            )
        
        logger.info(
            f"[INTENSITY] Processing image: {file.filename}, "
            f"type={file.content_type}, size={len(contents)} bytes"
        )
        
        # Run intensity estimation
        result = run_intensity_estimation(contents)
        
        logger.info(
            f"[INTENSITY] Prediction complete: "
            f"wind_speed={result['intensity']['wind_speed_knots']} knots, "
            f"category={result['category']['category_code']}, "
            f"confidence={result['detection']['confidence']:.3f}"
        )
        
        return IntensityResponse(**result)
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"[INTENSITY] Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"[INTENSITY] Unexpected error during intensity estimation: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during intensity estimation: {str(e)}",
        )
    finally:
        await file.close()


@router.get("/intensity/categories")
async def get_categories() -> JSONResponse:
    """
    Get information about IMD cyclone categories.
    
    Returns the complete classification system used by India Meteorological Department
    for tropical cyclones in the North Indian Ocean region.
    """
    from app.services.intensity_service import CYCLONE_CATEGORIES
    
    categories = [
        {
            "code": code,
            "name": info["name"],
            "wind_range_knots": {
                "min": info["wind_range"][0],
                "max": info["wind_range"][1],
            },
            "wind_range_kmh": {
                "min": round(info["wind_range"][0] * 1.852, 1),
                "max": round(info["wind_range"][1] * 1.852, 1),
            },
            "damage_level": info["damage"],
        }
        for code, info in CYCLONE_CATEGORIES.items()
    ]
    
    return JSONResponse(
        content={
            "region": "North Indian Ocean",
            "source": "India Meteorological Department (IMD)",
            "categories": categories,
        }
    )
