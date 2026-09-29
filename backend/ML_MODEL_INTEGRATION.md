# Cyclone Intensity Estimation - ML Model Integration Guide

This guide explains how to integrate the actual deep learning model from the research repository into the CycloNet system.

## Overview

The intensity estimation feature is currently running with **stub predictions** (realistic but not real model inference). This document provides step-by-step instructions to integrate the actual CNN model trained on North Indian Ocean cyclone data.

**Research Source:** [Deep Learning Cyclone Intensity Estimation - NIO Satellite](https://github.com/manishmawatwal/Deep_Learning_Cylcone_Intensity_Estimation_NIO_Satellite)

---

## Current Implementation

### Backend Structure
```
backend/
├── app/
│   ├── api/
│   │   └── intensity.py          # API endpoint for image upload
│   ├── schemas/
│   │   └── intensity.py          # Pydantic response models
│   └── services/
│       └── intensity_service.py  # Preprocessing + stub predictions
```

### How It Works Now

1. **API Endpoint** (`POST /api/cyclone/intensity`):
   - Accepts image upload (JPEG, PNG, TIFF, max 10MB)
   - Validates file type and size
   - Calls intensity service

2. **Intensity Service**:
   - Preprocesses image to `[1, 3, 224, 224]` numpy array
   - Tries to import real model from `app.services.intensity_model`
   - Falls back to stub if model not found
   - Returns structured prediction with intensity, category, damage assessment

3. **Stub Predictions**:
   - Uses image statistics (mean, std) to generate consistent predictions
   - Returns realistic wind speeds and categories
   - Clearly labeled as "cyclone-intensity-cnn-stub"

---

## Integration Steps

### Step 1: Prepare the Model

#### 1.1 Download/Clone the Research Repository

```bash
cd backend
git clone https://github.com/manishmawatwal/Deep_Learning_Cylcone_Intensity_Estimation_NIO_Satellite.git ml_research
```

#### 1.2 Locate the Trained Model

The repository should contain:
- Trained model weights (`.h5`, `.pt`, or `.pth` file)
- Model architecture definition
- Preprocessing configuration

Common locations:
```
ml_research/
├── models/
│   └── cyclone_intensity_model.h5  # Keras/TensorFlow
│   └── cyclone_intensity_model.pth # PyTorch
├── src/
│   └── model.py                    # Model architecture
└── config/
    └── model_config.json           # Hyperparameters
```

#### 1.3 Install Required Dependencies

Add to `backend/requirements.txt`:

**For TensorFlow/Keras:**
```txt
tensorflow==2.15.0
pillow==10.2.0
numpy==1.24.3
```

**For PyTorch:**
```txt
torch==2.1.0
torchvision==0.16.0
pillow==10.2.0
numpy==1.24.3
```

Install:
```bash
pip install -r requirements.txt
```

---

### Step 2: Create the Model Wrapper

Create `backend/app/services/intensity_model.py`:

```python
"""
Real CNN model for cyclone intensity estimation.
This module loads the trained model and provides inference interface.
"""
from __future__ import annotations

import logging
from pathlib import Path
import numpy as np
from typing import Any

logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────
MODEL_PATH = Path(__file__).parent.parent.parent / "ml_research" / "models" / "cyclone_intensity_model.h5"
MODEL_TYPE = "tensorflow"  # or "pytorch"

# ── Model Loading ──────────────────────────────────────────────────────────

_model = None  # Lazy-loaded global

def _load_model():
    """Load the trained model (called once on first prediction)."""
    global _model
    
    if _model is not None:
        return _model
    
    logger.info(f"[INTENSITY MODEL] Loading model from {MODEL_PATH}")
    
    if MODEL_TYPE == "tensorflow":
        import tensorflow as tf
        _model = tf.keras.models.load_model(str(MODEL_PATH))
    elif MODEL_TYPE == "pytorch":
        import torch
        _model = torch.load(str(MODEL_PATH))
        _model.eval()
    else:
        raise ValueError(f"Unsupported MODEL_TYPE: {MODEL_TYPE}")
    
    logger.info("[INTENSITY MODEL] Model loaded successfully")
    return _model


# ── Inference ──────────────────────────────────────────────────────────────

def predict_intensity(image_array: np.ndarray) -> dict[str, Any]:
    """
    Run intensity estimation using the real CNN model.
    
    Parameters
    ----------
    image_array : np.ndarray
        Preprocessed image array, shape [1, C, H, W] or [1, H, W, C]
        (depends on model architecture)
    
    Returns
    -------
    dict
        Prediction results matching the intensity_service interface
    """
    model = _load_model()
    
    # ── Adjust input format based on your model's expectations ──
    
    # If model expects [batch, height, width, channels] (TensorFlow default)
    if MODEL_TYPE == "tensorflow":
        # Convert [1, C, H, W] → [1, H, W, C]
        if image_array.shape[1] == 3:  # channels first
            image_array = np.transpose(image_array, (0, 2, 3, 1))
    
    # If model expects [batch, channels, height, width] (PyTorch default)
    # The preprocessing already provides this format
    
    # ── Run inference ──
    
    if MODEL_TYPE == "tensorflow":
        predictions = model.predict(image_array, verbose=0)
    elif MODEL_TYPE == "pytorch":
        import torch
        with torch.no_grad():
            tensor = torch.from_numpy(image_array).float()
            predictions = model(tensor).cpu().numpy()
    
    # ── Parse model output ──
    
    # ADJUST THIS BASED ON YOUR MODEL'S OUTPUT FORMAT
    # Example 1: Single regression output (wind speed in knots)
    if predictions.shape[-1] == 1:
        wind_speed_knots = float(predictions[0, 0])
    
    # Example 2: Multi-output (classification + regression)
    # If model outputs [category_logits, wind_speed]
    # category_idx = np.argmax(predictions[0, :7])  # First 7 outputs are categories
    # wind_speed_knots = float(predictions[0, 7])   # 8th output is wind speed
    
    # Example 3: If model only predicts category, map to wind speed
    # categories = ['D', 'DD', 'CS', 'SCS', 'VSCS', 'ESCS', 'SuCS']
    # category_idx = np.argmax(predictions[0])
    # wind_speed_knots = get_wind_speed_from_category(categories[category_idx])
    
    # ── Format response using intensity_service functions ──
    
    from app.services.intensity_service import classify_intensity, estimate_damage_details
    
    # Get confidence from model (if available)
    # For classification: use softmax probability
    # For regression: use prediction variance or fixed high confidence
    confidence = 0.85  # Adjust based on model output
    
    # Classify intensity
    category = classify_intensity(wind_speed_knots)
    damage = estimate_damage_details(category["category_code"], wind_speed_knots)
    
    return {
        "intensity": {
            "wind_speed_knots": round(wind_speed_knots, 1),
            "wind_speed_kmh": round(wind_speed_knots * 1.852, 1),
            "wind_speed_mph": round(wind_speed_knots * 1.15078, 1),
        },
        "category": category,
        "damage_assessment": damage,
        "detection": {
            "has_cyclone": True,
            "confidence": round(confidence, 3),
        },
        "model": {
            "name": "cyclone-intensity-cnn",
            "version": "1.0.0",
            "architecture": "ResNet50-based",  # Adjust to actual architecture
            "training_region": "North Indian Ocean",
        },
        "metadata": {
            "image_shape": list(image_array.shape),
            "preprocessing": "RGB normalized [0,1], resized to 224x224",
        },
    }
```

---

### Step 3: Adjust Preprocessing (if needed)

The current preprocessing in `intensity_service.py` provides:
- Input shape: `[1, 3, 224, 224]` (batch, channels, height, width)
- Normalization: `[0, 1]` range
- Format: RGB

If your model expects different preprocessing:

```python
# In intensity_service.py, modify preprocess_image():

# Example 1: Different image size
target_size = (256, 256)  # Change from (224, 224)

# Example 2: Different normalization (ImageNet mean/std)
mean = np.array([0.485, 0.456, 0.406])
std = np.array([0.229, 0.224, 0.225])
img_array = (img_array - mean.reshape(1, 3, 1, 1)) / std.reshape(1, 3, 1, 1)

# Example 3: Grayscale input (single channel)
if image.mode != "L":
    image = image.convert("L")
img_array = np.array(image, dtype=np.float32) / 255.0
img_array = np.expand_dims(img_array, axis=(0, 1))  # [1, 1, H, W]
```

---

### Step 4: Test the Integration

#### 4.1 Start the Backend

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

#### 4.2 Test with cURL

```bash
curl -X POST "http://localhost:8000/api/cyclone/intensity" \
  -F "file=@test_cyclone_image.jpg"
```

Expected response:
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
  "model": {
    "name": "cyclone-intensity-cnn",  # No longer "stub"!
    "version": "1.0.0"
  }
}
```

#### 4.3 Check Logs

```bash
# Should see:
[INTENSITY MODEL] Loading model from /path/to/model
[INTENSITY MODEL] Model loaded successfully
[INTENSITY] Using real CNN model
```

---

### Step 5: Frontend Testing

1. Start frontend: `cd frontend && npm run dev`
2. Open http://localhost:5173
3. Click "ESTIMATE INTENSITY" button (bottom right)
4. Upload a cyclone satellite image
5. Verify:
   - Image preview appears
   - "ANALYZING..." shows during processing
   - Results display with intensity, category, damage assessment
   - Model info shows real model name (not "stub")

---

## Model Architecture Notes

Based on the research paper, the model likely has:

### Architecture
- **Base**: ResNet50 or similar CNN backbone
- **Components**:
  1. Binary classifier (cyclone vs no-cyclone)
  2. Multi-class classifier (D, DD, CS, SCS, VSCS, ESCS, SuCS)
  3. Regression head (wind speed in knots)

### Input
- Image size: 224×224 or 256×256
- Channels: IR (infrared) satellite band (grayscale) OR RGB composite
- Normalization: [0, 1] or ImageNet mean/std

### Output
- Option A: Single value (wind speed in knots)
- Option B: Multi-output (category logits + wind speed)
- Option C: Category classification only (map to wind speed range)

**→ Check the model code in the research repo to confirm exact architecture**

---

## Troubleshooting

### Error: "Cannot import intensity_model"
**Cause**: Model file doesn't exist or wrong path  
**Fix**: Verify `MODEL_PATH` points to the actual model file

### Error: "Model input shape mismatch"
**Cause**: Preprocessing output doesn't match model input  
**Fix**: Adjust `preprocess_image()` to match model's expected shape

### Error: "Module 'tensorflow' not found"
**Cause**: Dependencies not installed  
**Fix**: `pip install tensorflow` or `pip install torch torchvision`

### Predictions seem wrong
**Cause**: Wrong normalization or input format  
**Fix**: 
- Check if model expects [0,1] or [-1,1] normalization
- Verify channel order (RGB vs BGR)
- Confirm image size matches training size

### Model loads slowly
**Cause**: Model is loaded on every request  
**Fix**: The global `_model` variable caches it after first load (already implemented)

---

## Performance Optimization

### 1. Model Quantization (optional)
Reduce model size and inference time:

```python
# TensorFlow
import tensorflow as tf
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()
```

### 2. Batch Processing (future)
If processing multiple images:

```python
# Process 4 images at once
batch = np.concatenate([img1, img2, img3, img4], axis=0)  # [4, 3, 224, 224]
predictions = model.predict(batch)
```

### 3. GPU Inference
Enable GPU if available:

```python
# TensorFlow
import tensorflow as tf
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    tf.config.experimental.set_memory_growth(gpus[0], True)

# PyTorch
import torch
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Model file is included in Docker image or mounted volume
- [ ] Dependencies (tensorflow/torch) are in requirements.txt
- [ ] Model loads successfully on startup (check logs)
- [ ] Test with 10+ real cyclone images
- [ ] Verify predictions match expected ranges (17-120 knots)
- [ ] Latency is acceptable (<5 seconds per image)
- [ ] Error handling works (invalid images, corrupted files)
- [ ] API returns proper error messages for failures
- [ ] Frontend displays predictions correctly
- [ ] Confidence scores are calibrated (not always 0.99)

---

## API Documentation

Once integrated, the API will be available at:

**Endpoint**: `POST http://localhost:8000/api/cyclone/intensity`

**Input**: Multipart form-data with `file` field

**Output**: JSON with intensity, category, damage assessment

**Interactive Docs**: http://localhost:8000/docs#/intensity

---

## Contact & Support

**Research Paper**: "An End-to-End Deep Learning Framework for Cyclone Intensity Estimation in North Indian Ocean Region using Satellite Imagery"

**Researchers**: 
- PI: Dr. Saurabh Das (saurabh.das@iiti.ac.in)
- Manish Mawatwal

**Repository**: https://github.com/manishmawatwal/Deep_Learning_Cylcone_Intensity_Estimation_NIO_Satellite

---

## Summary

1. ✅ Backend API is ready (`POST /api/cyclone/intensity`)
2. ✅ Frontend UI is ready (floating button + modal)
3. ✅ Preprocessing is implemented (224×224, RGB, [0,1])
4. ⏳ **Next step**: Create `intensity_model.py` with real model inference
5. ⏳ Test with actual cyclone images
6. ⏳ Deploy to production

The system will automatically switch from stub to real predictions once `intensity_model.py` exists and can be imported.
