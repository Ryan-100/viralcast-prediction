# ViralCast - Airborne Disease Intelligence Platform

A sophisticated, real-time airborne disease prediction dashboard powered by LSTM machine learning models. ViralCast provides intelligent forecasting and risk assessment for airborne diseases using advanced time-series analysis.

## 🌟 Features

- **Universal Disease Prediction**: Predict trends for any airborne disease (COVID-19, Influenza, RSV, etc.)
- **Custom Location Analysis**: Enter any country or region for localized predictions
- **Multi-Factor Modeling**: Incorporates stringency index, mobility, vaccination rates, and more
- **Real-time Risk Assessment**: Dynamic outbreak risk levels with color-coded indicators
- 📈 7-day trajectory forecasting with LSTM model
- 📊 Current statistics dashboard
- 🔍 Key drivers and impact analysis
- 🦠 Dominant strain tracking
- 💡 Executive summary and 14-day outlook
- ✨ Premium glassmorphism UI with smooth animations

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the API Server

```bash
python api_server.py
```

The server will start on `http://localhost:5000`

### 3. Open the Dashboard

Open `index.html` in your web browser (Chrome or Edge recommended)

## Architecture

- **Frontend**: Vanilla HTML/CSS/JavaScript with Chart.js
- **Backend**: Flask API server
- **Model**: LSTM neural network (improved_lstm_best_model.keras)
- **Data**: Weekly COVID-19 data from Japan

## API Endpoints

- `GET /api/current-stats` - Latest COVID-19 statistics
- `GET /api/historical` - Historical data for charts
- `GET /api/predict` - 7-day forecast predictions
- `GET /api/health` - Server health check

## Design

The dashboard features a modern, premium design with:
- Dark navy color scheme
- Glassmorphism effects
- Smooth micro-animations
- Responsive layout
- Real-time data updates

## Model Information

- **Type**: LSTM (Long Short-Term Memory)
- **Input**: 12 weeks of historical data
- **Output**: Next week case prediction
- **Features**: Weekly new cases, hospitalizations, positive rate
"# viralcast-prediction" 
