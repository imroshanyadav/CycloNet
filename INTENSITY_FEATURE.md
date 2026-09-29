# Cyclone Intensity Estimation Feature

## Overview

This feature allows users to upload satellite images and get real-time predictions of cyclone intensity using a deep learning model trained on North Indian Ocean cyclones.

## Features

### 🎯 Capabilities
- **Image Upload**: Upload satellite images (JPEG, PNG, TIFF) up to 10MB
- **Intensity Prediction**: Get wind speed in knots, km/h, and mph
- **Category Classification**: IMD standard categories (D, DD, CS, SCS, VSCS, ESCS, SuCS)
- **Damage Assessment**: Detailed infrastructure, coastal, and precautionary information
- **Confidence Score**: Model confidence visualization

### 🖼️ User Interface
- **Floating Button**: "ESTIMATE INTENSITY" button in bottom-right corner
- **Modal Interface**: Clean, full-featured modal with two panels
- **Image Preview**: See uploaded image before processing
- **Real-time Results**: Instant display of predictions with visual indicators
- **Responsive Design**: Works on desktop and mobile devices

## Usage

### Frontend (User)

1. **Open the Application**
   ```
   http://localhost:5173
   ```

2. **Click "ESTIMATE INTENSITY"** button (bottom-right)

3. **Upload Image**:
   - Click upload area or drag & drop
   - Supported formats: JPEG, PNG, TIFF
   - Maximum size: 10MB

4. **View Results**:
   - Wind speed (in multiple units)
   - IMD category with color coding
   - Detailed damage assessment
   - Confidence percentage with progress bar

### Backend API

#### Estimate Intensity
```bash
POST http://localhost:8000/api/cyclone/intensity
```

**Request**:
```bash
curl -X POST "http://localhost:8000/api/cyclone/intensity" \
  -F "file=@cyclone_image.jpg"
```

**Response**:
```json
{
  "intensity": {
    "wind_speed_knots": 75.0,
    "wind_speed_kmh": 138.9,
    "wind_speed_mph": 86.3
  },
  "category": {
    "category_code": "VSCS",
    "category_name": "Very Severe Cyclonic Storm",
    "damage_potential": "Severe"
  },
  "damage_assessment": {
    "wind_speed_knots": 75.0,
    "wind_speed_kmh": 138.9,
    "description": "Severe damage to buildings and infrastructure",
    "infrastructure": "Major structural damage, long-term power disruptions",
    "coastal": "Storm surge 2.5-4m, severe coastal inundation",
    "precautions": "Total evacuation required, seek sturdy shelter inland"
  },
  "detection": {
    "has_cyclone": true,
    "confidence": 0.89
  },
  "model": {
    "name": "cyclone-intensity-cnn",
    "version": "1.0.0",
    "architecture": "ResNet50-based",
    "training_region": "North Indian Ocean"
  }
}
```

#### Get Category Information
```bash
GET http://localhost:8000/api/cyclone/intensity/categories
```

Returns all IMD cyclone categories with wind speed ranges.

## IMD Cyclone Categories

| Code | Category | Wind Speed (knots) | Wind Speed (km/h) | Damage |
|------|----------|-------------------|-------------------|---------|
| LOW | Low Pressure Area | < 17 | < 31 | None |
| D | Depression | 17-27 | 31-50 | Minimal |
| DD | Deep Depression | 28-33 | 51-61 | Minor |
| CS | Cyclonic Storm | 34-47 | 62-87 | Moderate |
| SCS | Severe Cyclonic Storm | 48-63 | 88-117 | Extensive |
| VSCS | Very Severe Cyclonic Storm | 64-89 | 118-165 | Severe |
| ESCS | Extremely Severe Cyclonic Storm | 90-119 | 166-220 | Devastating |
| SuCS | Super Cyclonic Storm | 120+ | 221+ | Catastrophic |

*Source: India Meteorological Department (IMD)*

## Technical Architecture

### Backend Stack
- **Framework**: FastAPI
- **ML Service**: `intensity_service.py` (preprocessing + inference)
- **API Endpoint**: `intensity.py` (file upload handling)
- **Validation**: File type, size, format checking
- **Error Handling**: Comprehensive error messages

### Frontend Stack
- **Framework**: React + TypeScript
- **UI Library**: Tailwind CSS + Custom components
- **Icons**: Lucide React
- **State Management**: React hooks
- **File Upload**: Native File API with drag-and-drop

### Model (Stub → Real)
- **Current**: Stub predictions (realistic but generated)
- **Target**: CNN model trained on NIO cyclones (2000-2022)
- **Repository**: [Deep Learning Cyclone Intensity Estimation](https://github.com/manishmawatwal/Deep_Learning_Cylcone_Intensity_Estimation_NIO_Satellite)

## File Structure

```
backend/
├── app/
│   ├── api/
│   │   └── intensity.py                    # API endpoint
│   ├── schemas/
│   │   └── intensity.py                    # Pydantic models
│   └── services/
│       ├── intensity_service.py            # Core logic
│       └── intensity_model.py              # (To add) Real model wrapper
└── ML_MODEL_INTEGRATION.md                 # Integration guide

frontend/
└── src/
    ├── components/
    │   └── IntensityEstimation.tsx         # Main UI component
    └── App.tsx                              # Integration point
```

## Integration Status

### ✅ Completed
- [x] Backend API endpoint with file upload
- [x] Image preprocessing pipeline
- [x] IMD category classification system
- [x] Damage assessment engine
- [x] Frontend UI component
- [x] File validation and error handling
- [x] Results display with visualization
- [x] Confidence score display
- [x] Responsive design

### ⏳ To Do (Model Integration)
- [ ] Download trained model from research repository
- [ ] Create `intensity_model.py` wrapper
- [ ] Test with real cyclone images
- [ ] Calibrate confidence scores
- [ ] Performance optimization (GPU, caching)

See `ML_MODEL_INTEGRATION.md` for detailed integration steps.

## Demo Screenshots

### Upload Interface
- Clean modal with drag-and-drop upload area
- Image preview with remove option
- File size and type validation

### Results Display
- Large, readable wind speed display (multiple units)
- Color-coded category badge
- Detailed damage assessment cards
- Animated confidence bar

## API Interactive Documentation

Once the backend is running, visit:
```
http://localhost:8000/docs
```

Navigate to **"intensity"** section to:
- Test the API directly in browser
- View request/response schemas
- Download OpenAPI specification

## Error Handling

### Frontend
- Invalid file type → Clear error message
- File too large → Size limit shown
- Network error → Retry suggestion
- Server error → Technical details logged

### Backend
- Unsupported format → HTTP 400 with specific message
- File too large → HTTP 400 with size information
- Processing error → HTTP 500 with error details
- Invalid image → HTTP 422 with validation error

## Performance

### Current (Stub)
- Response time: < 1 second
- Memory usage: Minimal
- No GPU required

### With Real Model
- Expected response time: 2-5 seconds
- Memory usage: 500MB - 2GB (depends on model)
- GPU recommended for production

## Security Considerations

- ✅ File size limit: 10MB (prevents DoS)
- ✅ File type validation: Only images allowed
- ✅ No file persistence: Images processed in-memory
- ✅ CORS configured: Only allowed origins
- ✅ Input sanitization: PIL validates image format

## Future Enhancements

### Planned Features
- [ ] Batch processing (multiple images)
- [ ] Historical comparison (track storm evolution)
- [ ] Confidence calibration display
- [ ] Export results as PDF report
- [ ] Integration with live satellite feeds
- [ ] Model version selection (A/B testing)

### Optimization Ideas
- [ ] Model quantization (reduce size)
- [ ] Result caching (similar images)
- [ ] WebSocket streaming (real-time updates)
- [ ] Edge deployment (offline mode)

## Testing

### Manual Testing
1. Upload various cyclone images (different intensities)
2. Test with non-cyclone images (clouds, oceans)
3. Test with invalid files (PDFs, text files)
4. Test with oversized images (>10MB)
5. Test network failures (disconnect during upload)

### Automated Testing (Backend)
```bash
cd backend
python -m pytest tests/test_intensity.py -v
```

### Test Images
Use images from:
- INSAT-3D archive
- NOAA Satellite database
- Research paper's dataset
- Recent cyclone events (Biparjoy, Mocha, etc.)

## Support & Documentation

- **ML Model Integration**: See `ML_MODEL_INTEGRATION.md`
- **API Documentation**: http://localhost:8000/docs
- **Research Paper**: "An End-to-End Deep Learning Framework for Cyclone Intensity Estimation in North Indian Ocean Region using Satellite Imagery"
- **Model Repository**: https://github.com/manishmawatwal/Deep_Learning_Cylcone_Intensity_Estimation_NIO_Satellite

## License

This feature integrates with research from IIT Indore. Ensure proper attribution when using the model in production.

**Research Credit**:
- PI: Dr. Saurabh Das, RemoteWave Propagation Lab, IIT Indore
- Researcher: Manish Mawatwal

---

**Status**: ✅ Feature Complete (Stub Mode) | ⏳ Awaiting Model Integration

**Last Updated**: 2026-09-09
