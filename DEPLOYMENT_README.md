# ViralCast Deployment Files

This directory contains all files needed for deployment.

## Files for Render Deployment

1. **render.yaml** - Render service configuration
2. **requirements.txt** - Python dependencies (includes gunicorn)
3. **api_server.py** - Flask API (configured for production)
4. **.gitignore** - Files to exclude from Git

## Model Files

Make sure these files exist:
- `../models/improved_lstm_best_model.keras` - Trained LSTM model
- `../models/scaler.pkl` - Data scaler

## Deployment Steps

See `DEPLOYMENT_STEPS.md` for detailed instructions.
