"""
API endpoints for YOLO Cyclone Formation Detection on India Satellite Feeds.
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.schemas.yolo import (
    OceanBasinWaterStatus,
    YoloScanRequest,
    YoloScanResponse,
)
from app.services.nasa_service import DEFAULT_GIBS_LAYER
from app.services.yolo_service import (
    _YOLO_ENGINE,
    fetch_live_water_telemetry,
    run_yolo_scan_india,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/yolo", tags=["yolo"])


@router.post("/scan-india", response_model=YoloScanResponse)
async def scan_india_satellite(request: YoloScanRequest):
    """
    Run YOLOv8 cyclone detection model on the complete map of India.
    Scans NASA GIBS satellite raster across 8,400 grid cells (P3/P4/P5 multi-scale anchors)
    and cross-checks live oceanic water temperatures (SST) in the Bay of Bengal & Arabian Sea.
    """
    try:
        response = await run_yolo_scan_india(
            date_str=request.date,
            layer=request.layer or DEFAULT_GIBS_LAYER,
            confidence_threshold=request.confidence_threshold or 0.35,
        )
        return response
    except Exception as exc:
        logger.error(f"YOLO Scan Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"YOLO detection scan failed: {str(exc)}")


@router.get("/scan-live", response_model=YoloScanResponse)
async def scan_live_satellite(
    date: Optional[str] = Query(None, description="Date YYYY-MM-DD (defaults to live today)"),
    conf: float = Query(0.35, ge=0.1, le=0.9, description="Confidence threshold"),
):
    """
    Quick GET endpoint to scan live or historical satellite raster of India.
    """
    try:
        return await run_yolo_scan_india(date_str=date, confidence_threshold=conf)
    except Exception as exc:
        logger.error(f"Live YOLO Scan Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Live YOLO scan failed: {str(exc)}")


@router.get("/water-telemetry", response_model=list[OceanBasinWaterStatus])
async def get_water_telemetry():
    """
    Retrieve real-time oceanic water conditions, SST thresholds, barometric pressure,
    and cyclone genesis potential for Indian basins (Bay of Bengal and Arabian Sea).
    """
    try:
        return await fetch_live_water_telemetry()
    except Exception as exc:
        logger.error(f"Water telemetry fetch error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch live water telemetry.")


@router.post("/scan-upload")
async def scan_uploaded_satellite_image(
    file: UploadFile = File(...),
    conf: float = Query(0.35, ge=0.1, le=0.9),
):
    """
    Upload a satellite image (JPEG/PNG/TIFF) and run the YOLO model to detect
    any cyclonic vortices, eye formations, or depression circulations.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format.")

    try:
        content = await file.read()
        detections, inference_time_ms = _YOLO_ENGINE.run_detection(
            image_bytes=content,
            conf_threshold=conf,
        )

        return {
            "status": "SUCCESS",
            "cyclone_detected": len(detections) > 0,
            "filename": file.filename,
            "inference_time_ms": inference_time_ms,
            "detections_count": len(detections),
            "detections": [d.model_dump() for d in detections],
            "model": "CycloneYOLOv8-NIO",
            "resolution": "640x640 Normalized",
        }
    except Exception as exc:
        logger.error(f"YOLO upload scan error: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze uploaded image: {str(exc)}")
