# CycloNet - Quick Start Guide

## Current Status
✅ Frontend: Running on http://localhost:5173  
✅ Backend: Running on http://localhost:8000

## Testing the Cyclone Intensity Feature

### Step 1: Access the Application
1. Open your browser to: **http://localhost:5173**
2. You should see the CycloNet dashboard

### Step 2: Upload a Cyclone Image
1. Look for the **"ESTIMATE INTENSITY"** button in the **bottom-right corner** of the screen
2. Click it to open the modal
3. Upload a satellite image:
   - Click the upload area OR drag and drop
   - Supported formats: JPEG, PNG, TIFF
   - Maximum size: 10MB

### Step 3: Run Estimation
1. After selecting your image, you'll see a preview
2. Click the **"ESTIMATE INTENSITY"** button
3. Wait a few seconds for processing (you'll see an "ANALYZING..." message)

### Step 4: View Results
The right panel will display:
- **Wind Speed**: In knots, km/h, and mph
- **Category**: IMD classification (D, DD, CS, SCS, VSCS, ESCS, SuCS)
- **Damage Assessment**: Infrastructure, coastal, and precaution details
- **Confidence Score**: Model confidence percentage with progress bar

## Important Notes

### Currently Using Stub Predictions
The feature is currently running with **stub predictions** (realistic but generated data). This means:
- ✅ The entire system works end-to-end
- ✅ You can test the UI and workflow
- ✅ Results are based on image properties (not random)
- ⚠️ Not using the actual deep learning model yet

### Why Stub Mode?
The actual CNN model from the research repository needs to be integrated. See `backend/ML_MODEL_INTEGRATION.md` for detailed instructions.

## Troubleshooting

### Error: "Failed to fetch"
**Problem**: Backend is not running  
**Solution**: Check if backend process is still running in terminal

To restart backend:
```powershell
cd "d:\College Projects\SIH26-main\SIH26-main\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Error: "Module not found"
**Problem**: Missing Python dependencies  
**Solution**: Install required packages:
```powershell
python -m pip install fastapi uvicorn pillow numpy python-multipart sqlalchemy aiosqlite pydantic-settings shapely --user
```

### Port Already in Use
**Problem**: Port 8000 or 5173 is occupied  
**Solution**: 
- Kill the existing process
- Or change the port:
  - Backend: `uvicorn app.main:app --port 8001`
  - Frontend: Edit `vite.config.ts` to use different port

### Image Upload Not Working
**Problem**: CORS or file size issues  
**Check**:
- Image is less than 10MB
- Image format is JPEG, PNG, or TIFF
- Backend logs show the request

### Slow Response
**Problem**: Large image or slow network  
**Normal**: 1-3 seconds for stub predictions  
**With real model**: 3-8 seconds expected

## API Endpoints

### Test Directly with cURL

#### Estimate Intensity
```powershell
curl -X POST "http://localhost:8000/api/cyclone/intensity" -F "file=@your_image.jpg"
```

#### Get Categories
```powershell
curl "http://localhost:8000/api/cyclone/intensity/categories"
```

#### Health Check
```powershell
curl "http://localhost:8000/health"
```

### Interactive API Documentation
Open in browser: **http://localhost:8000/docs**

## Sample Test Images

For testing, you can use:
1. Any cyclone satellite image from INSAT-3D archive
2. Google Images: Search for "cyclone satellite image"
3. NOAA website: https://www.nhc.noaa.gov/satellite.php
4. Download from: https://www.mosdac.gov.in/ (India's satellite data portal)

## Recommended Test Images
- **Low intensity**: Tropical Depression images
- **Medium intensity**: Cyclonic Storm images  
- **High intensity**: Very Severe Cyclonic Storm images with clear eye

## Expected Results (Stub Mode)

The stub predictions are based on image statistics:
- **Darker/clearer images** → Higher wind speeds
- **Higher contrast** → Better confidence scores
- **Standard deviation** → Affects category classification

Results should be:
- Wind speed: 20-115 knots
- Category: D to SuCS
- Confidence: 65-95%
- Damage assessment: Appropriate for category

## Next Steps

1. ✅ **Test the feature** with multiple images
2. ✅ **Verify UI** displays all information correctly
3. ⏳ **Integrate real model** (see ML_MODEL_INTEGRATION.md)
4. ⏳ **Test with real predictions**
5. ⏳ **Deploy to production**

## Quick Commands Reference

### Start Backend (if stopped)
```powershell
cd "d:\College Projects\SIH26-main\SIH26-main\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Start Frontend (if stopped)
```powershell
cd "d:\College Projects\SIH26-main\SIH26-main\frontend"
npm run dev
```

### Check If Running
```powershell
# Test backend
curl http://localhost:8000/health

# Test frontend (open in browser)
http://localhost:5173
```

### View Backend Logs
The terminal running uvicorn shows all API requests and errors

### Kill Process (if stuck)
```powershell
# Find process
Get-Process | Where-Object {$_.ProcessName -like "*python*"}

# Kill by PID
Stop-Process -Id <PID>
```

## Support

- **Feature Documentation**: See `INTENSITY_FEATURE.md`
- **Model Integration**: See `ML_MODEL_INTEGRATION.md`
- **Backend API**: See `backend/README.md`
- **Interactive API Docs**: http://localhost:8000/docs

## Status Indicators

When the feature is working correctly, you should see:
- ✅ Frontend: No console errors
- ✅ Backend: "INFO: POST /api/cyclone/intensity 200 OK" in logs
- ✅ Results: Display in less than 5 seconds
- ✅ Confidence: Between 0.65 and 0.95

## Common Questions

**Q: Is this using the real model?**  
A: Not yet. Currently using stub predictions. Check model metadata in results - it will say "cyclone-intensity-cnn-stub".

**Q: How accurate are stub predictions?**  
A: They're realistic but generated based on image properties. Not suitable for actual decision-making.

**Q: When will real model be integrated?**  
A: Follow the guide in `ML_MODEL_INTEGRATION.md`. Estimated time: 1-2 hours once you have the trained model.

**Q: Can I use this offline?**  
A: Yes! Both backend and frontend run locally. No internet needed for the feature (only for initial setup/dependencies).

**Q: Does it work with any image?**  
A: Best results with satellite images of cyclones. Will process any image but may give odd results for non-cyclone images.

---

**Last Updated**: 2025-09-09  
**Version**: 1.0 (Stub Mode)
