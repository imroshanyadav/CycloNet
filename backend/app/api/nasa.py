"""
NASA Earth Science Data API Endpoints
- GET /api/nasa/events: Fetch NASA EONET v3 Severe Storms with Atkinson-Holliday & Dvorak indicators
- GET /api/nasa/gibs-image: Proxy NASA GIBS WMS true color satellite imagery (CORS-safe)
- GET /api/nasa/gibs-url: Construct dynamic WMS GetMap query URL
"""
from __future__ import annotations

from datetime import datetime, timezone
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import JSONResponse

from app.services.nasa_service import (
    DEFAULT_GIBS_LAYER,
    construct_gibs_wms_url,
    fetch_eonet_storms,
    fetch_gibs_satellite_image,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/nasa", tags=["nasa"])


@router.get("/events")
async def get_nasa_storms(
    basin: Optional[str] = Query(None, description="Filter by oceanic basin (e.g., 'Bay of Bengal', 'Arabian Sea', 'Pacific', 'Atlantic')"),
    active_only: bool = Query(False, description="Filter active storms only"),
):
    """
    Fetch active and historical tropical cyclones tracked by NASA EONET v3.
    
    Includes:
    - Latest satellite coordinates [lon, lat] and timestamp
    - Atkinson-Holliday central pressure estimation
    - Dvorak T-number and CI intensity
    - Saffir-Simpson & IMD disaster classifications
    - Pre-constructed NASA GIBS WMS and proxy URLs
    """
    result = await fetch_eonet_storms()
    events = result.get("events", [])

    if active_only:
        events = [e for e in events if e.get("is_active")]

    if basin:
        basin_lower = basin.lower()
        events = [
            e for e in events
            if basin_lower in e.get("basin", "").lower() or basin_lower in e.get("region", "").lower()
        ]

    return {
        "status": "success",
        "source": result.get("source"),
        "total_count": len(events),
        "cached_at": result.get("cached_at"),
        "events": events,
    }


@router.get("/gibs-image")
async def get_gibs_image(
    lat: float = Query(..., description="Cyclone center latitude (-90 to 90)"),
    lon: float = Query(..., description="Cyclone center longitude (-180 to 180)"),
    date: Optional[str] = Query(None, description="Observation date (YYYY-MM-DD)"),
    delta: float = Query(5.0, description="Bounding box half-span in degrees (default 5.0)"),
    bbox: Optional[str] = Query(None, description="Explicit EPSG:4326 bounding box minLat,minLon,maxLat,maxLon (e.g. for complete India: 5.0,65.0,36.0,98.0)"),
    layer: str = Query(DEFAULT_GIBS_LAYER, description="GIBS WMS Layer"),
    width: int = Query(800, ge=100, le=2048, description="Image width in pixels"),
    height: int = Query(600, ge=100, le=2048, description="Image height in pixels"),
    format: str = Query("image/jpeg", description="MIME image format"),
):
    """
    Proxy NASA GIBS WMS satellite imagery.
    Prevents browser CORS blocking, canvas tainting, and provides server-side caching.
    """
    # Default to current UTC date if omitted
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Validate coordinate bounds
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        raise HTTPException(status_code=400, detail="Invalid coordinates: lat must be in [-90, 90], lon in [-180, 180].")

    try:
        image_bytes, mime_type = await fetch_gibs_satellite_image(
            lat=lat,
            lon=lon,
            date_str=date,
            delta=delta,
            layer=layer,
            width=width,
            height=height,
            fmt=format,
            bbox=bbox,
        )
        return Response(
            content=image_bytes,
            media_type=mime_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400",
                "X-NASA-GIBS-Date": date,
                "X-NASA-GIBS-Coordinates": f"{lat},{lon}",
            },
        )
    except Exception as exc:
        logger.error(f"Error serving GIBS proxy image: {exc}")
        raise HTTPException(status_code=502, detail=f"Failed to fetch NASA GIBS satellite raster: {exc}")


@router.get("/gibs-url")
def get_gibs_url_info(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    date: Optional[str] = Query(None, description="Date YYYY-MM-DD"),
    delta: float = Query(5.0, description="Delta degrees"),
    layer: str = Query(DEFAULT_GIBS_LAYER, description="Layer name"),
):
    """Generate direct NASA GIBS WMS URL and local proxy URL."""
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    wms_url, bbox_str = construct_gibs_wms_url(lat, lon, date, delta=delta, layer=layer)
    proxy_url = f"/api/nasa/gibs-image?lat={lat:.4f}&lon={lon:.4f}&date={date}&delta={delta}"

    return {
        "status": "ok",
        "wms_endpoint": "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi",
        "wms_url": wms_url,
        "proxy_url": proxy_url,
        "bbox": bbox_str,
        "crs": "EPSG:4326",
        "time": date,
        "layer": layer,
    }
