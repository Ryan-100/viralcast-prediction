"""
ViralCast API Server
Flask backend for serving LSTM model predictions and airborne disease data
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
from tensorflow.keras.models import load_model
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Global variables for model and data
model = None
scaler = None
weekly_data = None
SEQUENCE_LENGTH = 12

def initialize():
    """Load model, scaler, and data on startup"""
    global model, scaler, weekly_data
    
    print("=" * 80)
    print("VIRALCAST API SERVER - INITIALIZING")
    print("=" * 80)
    
    # Paths - Check local 'models' folder first (Production/Self-contained)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"\nCurrent directory: {current_dir}")
    
    # List files in current directory
    print(f"\nFiles in current directory:")
    try:
        for item in os.listdir(current_dir):
            print(f"  - {item}")
    except Exception as e:
        print(f"  Error listing directory: {e}")
    
    local_model_path = os.path.join(current_dir, 'models', 'improved_lstm_best_model.keras')
    
    if os.path.exists(local_model_path):
        print("\n✓ Using local self-contained assets (Production mode)")
        base_path = current_dir
    else:
        print("\n⚠ Local models not found, trying parent directory (Development mode)")
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        print(f"Parent directory: {base_path}")

    model_path = os.path.join(base_path, 'models', 'improved_lstm_best_model.keras')
    scaler_path = os.path.join(base_path, 'models', 'weekly_scaler.pkl')
    data_path = os.path.join(base_path, 'output', 'weekly_data.csv')
    
    # Load model
    print(f"\n[1/3] Loading LSTM model from: {model_path}")
    print(f"      File exists: {os.path.exists(model_path)}")
    if not os.path.exists(model_path):
        print(f"❌ ERROR: Model not found at {model_path}")
        print(f"\nChecking if models directory exists:")
        models_dir = os.path.join(base_path, 'models')
        print(f"  Models directory: {models_dir}")
        print(f"  Exists: {os.path.exists(models_dir)}")
        if os.path.exists(models_dir):
            print(f"  Contents:")
            for item in os.listdir(models_dir):
                print(f"    - {item}")
        return False
    
    try:
        model = load_model(model_path)
        print("✓ Model loaded successfully")
    except Exception as e:
        print(f"❌ ERROR loading model: {e}")
        return False
    
    # Load scaler
    print(f"\n[2/3] Loading scaler from: {scaler_path}")
    print(f"      File exists: {os.path.exists(scaler_path)}")
    if not os.path.exists(scaler_path):
        print(f"❌ ERROR: Scaler not found at {scaler_path}")
        return False
    
    try:
        scaler = joblib.load(scaler_path)
        print("✓ Scaler loaded successfully")
    except Exception as e:
        print(f"❌ ERROR loading scaler: {e}")
        return False
    
    # Load data
    print(f"\n[3/3] Loading weekly data from: {data_path}")
    print(f"      File exists: {os.path.exists(data_path)}")
    if not os.path.exists(data_path):
        print(f"❌ ERROR: Data not found at {data_path}")
        print(f"\nChecking if output directory exists:")
        output_dir = os.path.join(base_path, 'output')
        print(f"  Output directory: {output_dir}")
        print(f"  Exists: {os.path.exists(output_dir)}")
        if os.path.exists(output_dir):
            print(f"  Contents:")
            for item in os.listdir(output_dir):
                print(f"    - {item}")
        return False
    
    try:
        weekly_data = pd.read_csv(data_path)
        weekly_data['date'] = pd.to_datetime(weekly_data['date'])
        print(f"✓ Data loaded successfully ({len(weekly_data)} weeks)")
    except Exception as e:
        print(f"❌ ERROR loading data: {e}")
        return False
    
    print("\n" + "=" * 80)
    print("API SERVER READY")
    print("=" * 80)
    print(f"Model: improved_lstm_best_model.keras")
    print(f"Data range: {weekly_data['date'].min()} to {weekly_data['date'].max()}")
    print(f"Latest cases: {weekly_data['new_cases'].iloc[-1]:,.0f}")
    print("=" * 80 + "\n")
    
    return True

# ============================================================================
# CRITICAL: Initialize when module is loaded (for Gunicorn/production)
# ============================================================================
print("\n🔄 Initializing ViralCast API...")
_init_success = False
try:
    _init_success = initialize()
    if not _init_success:
        print("❌ WARNING: API initialization failed - endpoints will return errors")
        print("Server will start but predictions will not work")
except Exception as e:
    print(f"❌ CRITICAL ERROR during initialization: {e}")
    print("Server will start in degraded mode")
    import traceback
    traceback.print_exc()
print()

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/api/current-stats', methods=['GET'])
def get_current_stats():
    """Get current statistics from latest data"""
    try:
        latest = weekly_data.iloc[-1]
        
        stats = {
            'weekly_cases': float(latest['new_cases']),
            'hospitalizations': float(latest['hosp_patients']) if pd.notna(latest['hosp_patients']) else 0,
            'positive_rate': float(latest['positive_rate']) if pd.notna(latest['positive_rate']) else 0,
            'date': latest['date'].strftime('%b %d, %Y'),
            'variant': 'PQ.2'  # Current dominant variant
        }
        
        return jsonify(stats)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/historical', methods=['GET'])
def get_historical():
    """Get historical data for visualization"""
    try:
        # Get last 12 weeks
        recent = weekly_data.tail(12)
        
        historical = []
        for _, row in recent.iterrows():
            historical.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'value': float(row['new_cases'])
            })
        
        return jsonify({'historical': historical})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['GET'])
def predict():
    """Generate 7-day forecast using LSTM model"""
    try:
        # Get last SEQUENCE_LENGTH weeks for prediction
        recent_data = weekly_data['new_cases'].values[-SEQUENCE_LENGTH:]
        
        # Scale the data
        recent_scaled = scaler.transform(recent_data.reshape(-1, 1))
        
        # Prepare input sequence
        X_input = recent_scaled.reshape(1, SEQUENCE_LENGTH, 1)
        
        # Generate 7-day (1 week) prediction
        predictions = []
        current_sequence = X_input.copy()
        
        # Predict next week
        pred_scaled = model.predict(current_sequence, verbose=0)
        pred_value = scaler.inverse_transform(pred_scaled)[0][0]
        
        # Get last date and add 7 days
        last_date = weekly_data['date'].iloc[-1]
        next_date = last_date + timedelta(days=7)
        
        predictions.append({
            'date': next_date.strftime('%Y-%m-%d'),
            'value': float(max(0, pred_value))  # Ensure non-negative
        })
        
        # Calculate risk assessment
        current_cases = float(weekly_data['new_cases'].iloc[-1])
        predicted_cases = pred_value
        
        risk_assessment = assess_risk(current_cases, predicted_cases)
        trend = assess_trend(current_cases, predicted_cases)
        
        # Get historical for chart
        historical = []
        recent = weekly_data.tail(12)
        for _, row in recent.iterrows():
            historical.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'value': float(row['new_cases'])
            })
        
        return jsonify({
            'predictions': predictions,
            'historical': historical,
            'risk_assessment': risk_assessment,
            'trend': trend,
            'current_cases': current_cases,
            'predicted_cases': float(predicted_cases)
        })
    
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict-custom', methods=['POST'])
def predict_custom():
    """Generate prediction based on custom user inputs"""
    try:
        data = request.get_json()
        
        # Extract user inputs
        location = data.get('location', 'Unknown')
        previous_cases = float(data.get('previousWeekCases', 0))
        stringency = float(data.get('stringencyIndex', 50))
        mobility = float(data.get('mobility', 0))
        vaccination_rate = float(data.get('vaccinationRate', 50))
        population_density = data.get('populationDensity')
        
        print(f"\n📍 Custom Prediction Request for: {location}")
        print(f"   Cases: {previous_cases:,.0f}")
        print(f"   Stringency: {stringency}")
        print(f"   Mobility: {mobility}%")
        print(f"   Vaccination: {vaccination_rate}%")
        
        # Use the model's baseline prediction
        recent_data = weekly_data['new_cases'].values[-SEQUENCE_LENGTH:]
        recent_scaled = scaler.transform(recent_data.reshape(-1, 1))
        X_input = recent_scaled.reshape(1, SEQUENCE_LENGTH, 1)
        base_prediction_scaled = model.predict(X_input, verbose=0)
        base_prediction = scaler.inverse_transform(base_prediction_scaled)[0][0]
        
        # Apply custom factors to adjust the prediction
        # This is a simplified model - in production, you'd train on these features
        
        # Stringency factor: Higher stringency = lower cases
        stringency_factor = 1.0 - (stringency / 200)  # Range: 0.5 to 1.0
        
        # Mobility factor: Higher mobility = more cases
        mobility_factor = 1.0 + (mobility / 200)  # Range: 0.5 to 1.5
        
        # Vaccination factor: Higher vaccination = lower cases
        vaccination_factor = 1.0 - (vaccination_rate / 200)  # Range: 0.5 to 1.0
        
        # Combine factors (weighted average)
        combined_factor = (stringency_factor * 0.3 + 
                          mobility_factor * 0.4 + 
                          vaccination_factor * 0.3)
        
        # Apply to user's current cases (not the model's baseline)
        predicted_cases = previous_cases * combined_factor
        
        # Ensure non-negative
        predicted_cases = max(0, predicted_cases)
        
        print(f"   Factors: Stringency={stringency_factor:.2f}, Mobility={mobility_factor:.2f}, Vaccination={vaccination_factor:.2f}")
        print(f"   Combined Factor: {combined_factor:.2f}")
        print(f"   Predicted Cases: {predicted_cases:,.0f}")
        
        # Create historical data (simulated from user input)
        last_date = datetime.now()
        historical = []
        for i in range(4):
            week_date = last_date - timedelta(days=7 * (4-i))
            # Simulate historical trend
            historical_value = previous_cases * (0.8 + (i * 0.1))
            historical.append({
                'date': week_date.strftime('%Y-%m-%d'),
                'value': float(historical_value)
            })
        
        # Add prediction
        next_date = last_date + timedelta(days=7)
        predictions = [{
            'date': next_date.strftime('%Y-%m-%d'),
            'value': float(predicted_cases)
        }]
        
        # Assess risk and trend
        risk_assessment = assess_risk(previous_cases, predicted_cases)
        trend = assess_trend(previous_cases, predicted_cases)
        
        return jsonify({
            'predictions': predictions,
            'historical': historical,
            'risk_assessment': risk_assessment,
            'trend': trend,
            'current_cases': previous_cases,
            'predicted_cases': float(predicted_cases),
            'factors': {
                'stringency': stringency_factor,
                'mobility': mobility_factor,
                'vaccination': vaccination_factor,
                'combined': combined_factor
            },
            'location': location
        })
    
    except Exception as e:
        print(f"Custom prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


def assess_risk(current, predicted):
    """Assess outbreak risk level based on case numbers"""
    avg_cases = (current + predicted) / 2
    
    # Thresholds based on historical data
    if avg_cases < 50000:
        level = 'Low'
        color = 'green'
    elif avg_cases < 200000:
        level = 'Moderate'
        color = 'yellow'
    else:
        level = 'High'
        color = 'red'
    
    return {
        'level': level,
        'color': color,
        'score': float(avg_cases)
    }

def assess_trend(current, predicted):
    """Assess trend direction"""
    change_percent = ((predicted - current) / current) * 100
    
    if change_percent > 10:
        return 'Increasing'
    elif change_percent < -10:
        return 'Decreasing'
    else:
        return 'Stable'

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'data_loaded': weekly_data is not None
    })

if __name__ == '__main__':
    import os
    # Use PORT environment variable for production (Render, Railway, Heroku, etc.)
    try:
        port = int(os.environ.get('PORT', 5000))
    except (ValueError, TypeError):
        print("⚠️ Warning: Invalid PORT environment variable, using default 5000")
        port = 5000
    
    # Disable debug in production
    debug = os.environ.get('FLASK_ENV') == 'development'

    if _init_success:
        print(f"\n🚀 Starting Flask development server on http://localhost:{port}")
        print("📊 API Endpoints:")
        print("   - GET /api/current-stats")
        print("   - GET /api/historical")
        print("   - GET /api/predict")
        print("   - POST /api/predict-custom")
        print("   - GET /api/health")
        print("\n💡 Open index.html in your browser to view the dashboard\n")
        
        app.run(host='0.0.0.0', port=port, debug=debug)
    else:
        print("\n❌ Cannot start server - initialization failed")
        print("Please check the error messages above.")

