from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import psutil
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Load the trained models
try:
    model_full = joblib.load("rf_model.joblib")
    model_live = joblib.load("rf_model_live.joblib")
    logger.info("Models loaded successfully")
except Exception as e:
    logger.error(f"Error loading models: {e}")
    model_full = None
    model_live = None

# Label mapping
label_map = {"DEADLOCK": 0, "SAFE": 1, "UNSAFE": 2}
labels = {0: "HIGH-RISK(DEADLOCK-PRONE)", 1: "SAFE", 2: "UNSAFE"}

# Feature columns from training
feature_columns = None
live_features = [
    "num_processes",
    "cpu_percent", 
    "memory_percent",
    "disk_percent",
    "total_allocated",
    "total_need", 
    "deadlock_risk"
]

def get_system_metrics():
    """Collect current system metrics"""
    try:
        cpu = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory().percent
        disk = psutil.disk_usage("/").percent if os.name != 'nt' else psutil.disk_usage("C:").percent
        num_proc = len(psutil.pids())
        
        total_allocated = cpu + memory
        total_need = max(0, 200 - total_allocated)
        deadlock_risk = min(1.0, (cpu + memory) / 200)
        
        return {
            "num_processes": num_proc,
            "cpu_percent": cpu,
            "memory_percent": memory,
            "disk_percent": disk,
            "total_allocated": total_allocated,
            "total_need": total_need,
            "deadlock_risk": deadlock_risk
        }
    except Exception as e:
        logger.error(f"Error collecting system metrics: {e}")
        return None

@app.route('/')
def serve_frontend():
    """Serve the frontend HTML file"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    if path.endswith(('.css', '.js', '.html')):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "models_loaded": model_full is not None and model_live is not None,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/predict', methods=['POST'])
def predict_deadlock():
    """Predict deadlock based on provided features"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Validate required fields
        required_fields = ["num_processes", "cpu_percent", "memory_percent", "disk_percent", 
                          "total_allocated", "total_need", "deadlock_risk"]
        
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create feature vector
        X = pd.DataFrame([data])
        
        if model_live is None:
            return jsonify({"error": "Model not loaded"}), 500
            
        # Make prediction
        prediction = model_live.predict(X)[0]
        probabilities = model_live.predict_proba(X)[0]
        
        # Get confidence (max probability)
        confidence = max(probabilities) * 100
        
        result = {
            "prediction": int(prediction),
            "label": labels[prediction],
            "confidence": round(confidence, 2),
            "probabilities": {
                "DEADLOCK": round(probabilities[0] * 100, 2),
                "SAFE": round(probabilities[1] * 100, 2),
                "UNSAFE": round(probabilities[2] * 100, 2)
            },
            "risk_level": "HIGH" if prediction == 0 else "MEDIUM" if prediction == 2 else "LOW",
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Prediction made: {result}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/live-predict', methods=['GET'])
def live_prediction():
    """Get live system prediction"""
    try:
        metrics = get_system_metrics()
        
        if metrics is None:
            return jsonify({"error": "Failed to collect system metrics"}), 500
            
        if model_live is None:
            return jsonify({"error": "Model not loaded"}), 500
            
        # Create feature vector
        X = pd.DataFrame([metrics])
        
        # Make prediction
        prediction = model_live.predict(X)[0]
        probabilities = model_live.predict_proba(X)[0]
        
        # Get confidence
        confidence = max(probabilities) * 100
        
        result = {
            "system_metrics": metrics,
            "prediction": int(prediction),
            "label": labels[prediction],
            "confidence": round(confidence, 2),
            "probabilities": {
                "DEADLOCK": round(probabilities[0] * 100, 2),
                "SAFE": round(probabilities[1] * 100, 2),
                "UNSAFE": round(probabilities[2] * 100, 2)
            },
            "risk_level": "HIGH" if prediction == 0 else "MEDIUM" if prediction == 2 else "LOW",
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Live prediction made: {result}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Live prediction error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get current system metrics"""
    try:
        metrics = get_system_metrics()
        
        if metrics is None:
            return jsonify({"error": "Failed to collect system metrics"}), 500
            
        return jsonify({
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Metrics error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/model-info', methods=['GET'])
def get_model_info():
    """Get model information"""
    try:
        if model_live is None:
            return jsonify({"error": "Model not loaded"}), 500
            
        # Get feature importance if available
        feature_importance = {}
        if hasattr(model_live, 'feature_importances_'):
            importances = model_live.feature_importances_
            feature_names = live_features
            feature_importance = dict(zip(feature_names, importances))
            # Sort by importance
            feature_importance = dict(sorted(feature_importance.items(), 
                                           key=lambda x: x[1], reverse=True))
        
        info = {
            "model_type": type(model_live).__name__,
            "n_estimators": getattr(model_live, 'n_estimators', 'N/A'),
            "max_depth": getattr(model_live, 'max_depth', 'N/A'),
            "features": live_features,
            "feature_importance": feature_importance,
            "labels": labels,
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(info)
        
    except Exception as e:
        logger.error(f"Model info error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload-dataset', methods=['POST'])
def upload_dataset():
    """Handle dataset upload and processing"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
            
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
            
        if not file.filename.endswith('.csv'):
            return jsonify({"error": "Only CSV files are allowed"}), 400
            
        # Save uploaded file
        filepath = f"uploaded_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        file.save(filepath)
        
        # Process the dataset
        df = pd.read_csv(filepath)
        
        # Validate required columns
        required_columns = live_features + ['label']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            os.remove(filepath)  # Clean up
            return jsonify({
                "error": f"Missing required columns: {missing_columns}"
            }), 400
        
        # Encode labels
        df['label_encoded'] = df['label'].map({v: k for k, v in label_map.items()})
        
        # Make predictions on the dataset
        X = df[live_features]
        if model_live is not None:
            predictions = model_live.predict(X)
            probabilities = model_live.predict_proba(X)
            
            # Add predictions to dataframe
            df['predicted_label'] = [labels[pred] for pred in predictions]
            df['prediction_confidence'] = [max(prob) * 100 for prob in probabilities]
            
            # Calculate accuracy if true labels available
            if 'label_encoded' in df.columns:
                accuracy = (df['label_encoded'] == predictions).mean() * 100
            else:
                accuracy = None
        else:
            return jsonify({"error": "Model not loaded"}), 500
        
        # Generate summary statistics
        summary = {
            "total_samples": len(df),
            "label_distribution": df['label'].value_counts().to_dict(),
            "predicted_distribution": df['predicted_label'].value_counts().to_dict(),
            "accuracy": round(accuracy, 2) if accuracy else None,
            "feature_stats": df[live_features].describe().to_dict()
        }
        
        # Clean up uploaded file
        os.remove(filepath)
        
        result = {
            "summary": summary,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Dataset processed: {summary}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Dataset upload error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Deadlock Prediction Backend...")
    app.run(host='0.0.0.0', port=5000, debug=True)