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
    "total_need"
]


def get_system_metrics():
    """Collect current system metrics"""
    try:
        cpu = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory().percent
        disk = psutil.disk_usage("/").percent if os.name != 'nt' else psutil.disk_usage("C:").percent
        pids = psutil.pids()
        
        # Get detailed process information
        processes_info = []
        for pid in pids[:50]:  # Limit to first 50 processes to avoid huge responses
            try:
                proc = psutil.Process(pid)
                proc_info = {
                    'pid': pid,
                    'name': proc.name(),
                    'status': proc.status(),
                    'cpu_percent': proc.cpu_percent(),
                    'memory_percent': proc.memory_percent(),
                }
                processes_info.append(proc_info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        total_allocated = cpu + memory
        total_need = max(0, 200 - total_allocated)
        
        
        return {
            "num_processes": len(pids),
            "cpu_percent": cpu,
            "memory_percent": memory,
            "disk_percent": disk,
            "total_allocated": total_allocated,
            "total_need": total_need
            # Removed "processes" field to avoid feature name conflicts
        }
    except Exception as e:
        logger.error(f"Error collecting system metrics: {e}")
        return None

# Add new endpoint to get detailed process information
@app.route('/api/processes', methods=['GET'])
def get_processes():
    """Get detailed process information"""
    try:
        # Get all PIDs first
        pids = psutil.pids()[:30]  # Limit to first 30 processes
        
        # Create a Process object for each PID to initialize CPU tracking
        processes = []
        for pid in pids:
            try:
                proc = psutil.Process(pid)
                processes.append(proc)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        
        # Wait a moment to get accurate CPU measurements
        import time
        time.sleep(0.1)
        
        # Collect process information
        processes_info = []
        for proc in processes:
            try:
                # Get CPU percent with a small interval for accuracy
                cpu_percent = proc.cpu_percent(interval=0.05) or 0
                
                proc_info = {
                    'pid': proc.pid,
                    'name': proc.name()[:30],  # Limit name length
                    'status': proc.status(),
                    'cpu_percent': round(cpu_percent, 2),
                    'memory_percent': round(proc.memory_percent() or 0, 2),
                    'create_time': datetime.fromtimestamp(proc.create_time()).isoformat() if proc.create_time() else None
                }
                processes_info.append(proc_info)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        
        result = {
            "total_processes": len(pids),
            "processes": processes_info,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Retrieved {len(processes_info)} processes")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error retrieving processes: {e}")
        return jsonify({"error": str(e)}), 500

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
                          "total_allocated", "total_need"]
        
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
            "processes": [],  # Empty for real-time (could be populated with psutil data)
            "timeline": generate_realtime_timeline(metrics),  # Real-time system timeline
            "events": generate_realtime_events(metrics),  # Real-time system events
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

import networkx as nx

@app.route('/api/manual_predict', methods=['POST'])
def manual_predict():
    """Handle manual resource allocation input with Banker's algorithm"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Validate required fields
        if 'available_resources' not in data or 'processes' not in data:
            return jsonify({"error": "Missing required fields: available_resources, processes"}), 400
        
        available = data['available_resources']
        processes = data['processes']
        
        # Validate resource format
        required_resources = ['R1', 'R2', 'R3']
        for res in required_resources:
            if res not in available:
                return jsonify({"error": f"Missing resource {res} in available_resources"}), 400
        
        # Validate processes
        for i, proc in enumerate(processes):
            required_fields = ['pid', 'allocated', 'max_need', 'request', 'priority']
            for field in required_fields:
                if field not in proc:
                    return jsonify({"error": f"Process {i} missing field: {field}"}), 400
            
            # Validate resource dictionaries
            for res_dict in [proc['allocated'], proc['max_need'], proc['request']]:
                for res in required_resources:
                    if res not in res_dict:
                        return jsonify({"error": f"Process {proc['pid']} missing resource {res}"}), 400
        
        # Run Banker's algorithm
        banker_result = bankers_algorithm(available, processes)
        
        # Create ML feature vector
        ml_features = create_ml_features(processes, available)
        
        # Run ML prediction
        if model_live is not None:
            X = pd.DataFrame([ml_features])
            prediction = model_live.predict(X)[0]
            probabilities = model_live.predict_proba(X)[0]
            
            # Map predictions to states
            state_mapping = {0: "DEADLOCK", 1: "SAFE", 2: "UNSAFE"}
            ml_state = state_mapping.get(prediction, "UNSAFE")
            
            ml_probabilities = {
                "SAFE": float(probabilities[1] * 100),
                "UNSAFE": float(probabilities[2] * 100),
                "DEADLOCK": float(probabilities[0] * 100)
            }
        else:
            # Fallback if model not available
            ml_state = banker_result['state']
            ml_probabilities = {"SAFE": 0.5, "UNSAFE": 0.3, "DEADLOCK": 0.2}
        
        # Generate RAG visualization
        rag_viz = "<svg>Temporary RAG visualization</svg>"  # Simplified for now
        
        # Generate timeline simulation data
        timeline_data = []  # Simplified for now
        
        result = {
            "state": banker_result['state'],
            "probabilities": ml_probabilities,
            "safe_sequence": banker_result.get('safe_sequence', []),
            "rag_cycle": banker_result.get('cycle', []),
            "rag_visualization": rag_viz,
            "ml_prediction": ml_state,
            "processes": processes,  # Include processes data for Gantt chart
            "timeline": timeline_data,  # Timeline simulation data
            "events": [],  # System events
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Manual prediction completed: {result}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Manual prediction error: {e}")
        return jsonify({"error": str(e)}), 500

def bankers_algorithm(available, processes):
    """Implement Banker's safety algorithm"""
    try:
        # Convert to format suitable for algorithm
        num_processes = len(processes)
        num_resources = 3  # R1, R2, R3
        
        # Initialize arrays
        allocation = []
        max_need = []
        request = []
        pids = []
        
        for proc in processes:
            allocation.append([proc['allocated']['R1'], proc['allocated']['R2'], proc['allocated']['R3']])
            max_need.append([proc['max_need']['R1'], proc['max_need']['R2'], proc['max_need']['R3']])
            request.append([proc['request']['R1'], proc['request']['R2'], proc['request']['R3']])
            pids.append(proc['pid'])
        
        avail = [available['R1'], available['R2'], available['R3']]
        
        # Calculate need matrix
        need = []
        for i in range(num_processes):
            need_row = []
            for j in range(num_resources):
                need_row.append(max_need[i][j] - allocation[i][j])
            need.append(need_row)
        
        # Work vectors
        work = avail.copy()
        finish = [False] * num_processes
        
        # Safety algorithm
        safe_sequence = []
        while len(safe_sequence) < num_processes:
            found = False
            for i in range(num_processes):
                if not finish[i]:
                    # Check if need <= work
                    if all(need[i][j] <= work[j] for j in range(num_resources)):
                        # Process can finish
                        for j in range(num_resources):
                            work[j] += allocation[i][j]
                        finish[i] = True
                        safe_sequence.append(f"P{pids[i]}")
                        found = True
                        break
            
            if not found:
                # Deadlock detected
                # Find cycle in resource allocation graph
                cycle = detect_deadlock_cycle(processes, available)
                return {
                    "state": "DEADLOCK",
                    "safe_sequence": [],
                    "cycle": cycle
                }
        
        # Check if request can be granted safely
        request_safe = True
        for proc in processes:
            req = [proc['request']['R1'], proc['request']['R2'], proc['request']['R3']]
            alloc = [proc['allocated']['R1'], proc['allocated']['R2'], proc['allocated']['R3']]
            
            # Check if request <= need
            if not all(req[i] <= (proc['max_need'][f'R{i+1}'] - alloc[i]) for i in range(3)):
                request_safe = False
                break
            
            # Check if request <= available
            if not all(req[i] <= available[f'R{i+1}'] for i in range(3)):
                request_safe = False
                break
        
        state = "SAFE" if request_safe else "UNSAFE"
        
        return {
            "state": state,
            "safe_sequence": safe_sequence,
            "cycle": []
        }
        
    except Exception as e:
        logger.error(f"Banker's algorithm error: {e}")
        return {
            "state": "UNSAFE",
            "safe_sequence": [],
            "cycle": []
        }

def detect_deadlock_cycle(processes, available):
    """Detect cycles in resource allocation graph"""
    try:
        G = nx.DiGraph()
        
        # Add process nodes
        for proc in processes:
            G.add_node(f"P{proc['pid']}", type='process')
        
        # Add resource nodes
        for res in ['R1', 'R2', 'R3']:
            G.add_node(res, type='resource')
        
        # Add allocation edges (process -> resource)
        for proc in processes:
            for res in ['R1', 'R2', 'R3']:
                if proc['allocated'][res] > 0:
                    G.add_edge(f"P{proc['pid']}", res)
        
        # Add request edges (resource -> process)
        for proc in processes:
            for res in ['R1', 'R2', 'R3']:
                if proc['request'][res] > 0:
                    G.add_edge(res, f"P{proc['pid']}")
        
        # Detect cycles
        try:
            cycle = nx.find_cycle(G, orientation='original')
            # Extract node names from cycle
            cycle_nodes = [edge[0] for edge in cycle]
            if cycle_nodes:
                cycle_nodes.append(cycle[-1][1])  # Add last node
            return cycle_nodes
        except nx.NetworkXNoCycle:
            return []
            
    except Exception as e:
        logger.error(f"Cycle detection error: {e}")
        return []

def create_ml_features(processes, available):
    """Create feature vector for ML model"""
    try:
        num_processes = len(processes)
        
        # Calculate total allocated resources
        total_allocated_resources = 0
        total_need_resources = 0
        
        for proc in processes:
            # Sum allocated resources
            proc_allocated = sum(proc['allocated'].values())
            total_allocated_resources += proc_allocated
            
            # Sum need (max_need - allocated)
            proc_need = sum(proc['max_need'][res] - proc['allocated'][res] 
                          for res in ['R1', 'R2', 'R3'])
            total_need_resources += max(0, proc_need)
        
        # Estimate realistic system metrics based on resource usage
        # Higher resource allocation typically means higher system utilization
        resource_pressure = total_allocated_resources / (sum(available.values()) + 1)  # Avoid division by zero
        
        # Map resource pressure to realistic CPU/Memory percentages
        # 0.0-0.3 pressure -> 20-40% utilization
        # 0.3-0.6 pressure -> 40-70% utilization  
        # 0.6-1.0 pressure -> 70-95% utilization
        # >1.0 pressure -> 95-100% utilization (overcommitted)
        
        if resource_pressure <= 0.3:
            cpu_estimate = 20 + (resource_pressure / 0.3) * 20  # 20-40%
            memory_estimate = 30 + (resource_pressure / 0.3) * 20  # 30-50%
            disk_estimate = 10 + (resource_pressure / 0.3) * 20  # 10-30%
        elif resource_pressure <= 0.6:
            cpu_estimate = 40 + ((resource_pressure - 0.3) / 0.3) * 30  # 40-70%
            memory_estimate = 50 + ((resource_pressure - 0.3) / 0.3) * 20  # 50-70%
            disk_estimate = 30 + ((resource_pressure - 0.3) / 0.3) * 20  # 30-50%
        elif resource_pressure <= 1.0:
            cpu_estimate = 70 + ((resource_pressure - 0.6) / 0.4) * 25  # 70-95%
            memory_estimate = 70 + ((resource_pressure - 0.6) / 0.4) * 25  # 70-95%
            disk_estimate = 50 + ((resource_pressure - 0.6) / 0.4) * 20  # 50-70%
        else:
            # Overcommitted system - very high utilization
            cpu_estimate = 95 + min((resource_pressure - 1.0) * 10, 5)  # 95-100%
            memory_estimate = 95 + min((resource_pressure - 1.0) * 10, 5)  # 95-100%
            disk_estimate = 70 + min((resource_pressure - 1.0) * 10, 10)  # 70-80%
        
        # Create feature vector (matching live_features from backend)
        features = {
            "num_processes": num_processes,
            "cpu_percent": round(cpu_estimate, 1),
            "memory_percent": round(memory_estimate, 1),
            "disk_percent": round(disk_estimate, 1),
            "total_allocated": total_allocated_resources,
            "total_need": total_need_resources
        }
        
        return features
        
    except Exception as e:
        logger.error(f"ML feature creation error: {e}")
        # Return default features
        return {
            "num_processes": len(processes),
            "cpu_percent": 50,
            "memory_percent": 60,
            "disk_percent": 40,
            "total_allocated": 0,
            "total_need": 0
        }

def generate_realtime_timeline(metrics):
    """Generate timeline data for real-time system monitoring"""
    try:
        # Create simulated timeline based on current system metrics
        cpu_load = metrics.get('cpu_percent', 0)
        memory_load = metrics.get('memory_percent', 0)
        num_processes = metrics.get('num_processes', 0)
        
        timeline_events = []
        current_time = 0
        
        # Simulate system behavior based on current load
        if cpu_load > 80 or memory_load > 85:
            # High load scenario
            timeline_events.append({
                "component": "CPU",
                "start_time": 0,
                "duration": 8,
                "state": "high_utilization",
                "value": cpu_load
            })
            timeline_events.append({
                "component": "Memory",
                "start_time": 2,
                "duration": 10,
                "state": "high_utilization", 
                "value": memory_load
            })
            timeline_events.append({
                "component": "Processes",
                "start_time": 5,
                "duration": 6,
                "state": "spike",
                "value": num_processes
            })
        elif cpu_load > 50 or memory_load > 60:
            # Medium load scenario
            timeline_events.append({
                "component": "CPU",
                "start_time": 0,
                "duration": 12,
                "state": "moderate_utilization",
                "value": cpu_load
            })
            timeline_events.append({
                "component": "Memory", 
                "start_time": 3,
                "duration": 8,
                "state": "moderate_utilization",
                "value": memory_load
            })
        else:
            # Normal load scenario
            timeline_events.append({
                "component": "CPU",
                "start_time": 0,
                "duration": 15,
                "state": "normal",
                "value": cpu_load
            })
            timeline_events.append({
                "component": "Memory",
                "start_time": 2,
                "duration": 13,
                "state": "normal",
                "value": memory_load
            })
        
        return timeline_events
        
    except Exception as e:
        logger.error(f"Real-time timeline generation error: {e}")
        return []

def generate_realtime_events(metrics):
    """Generate events for real-time system monitoring"""
    try:
        cpu_load = metrics.get('cpu_percent', 0)
        memory_load = metrics.get('memory_percent', 0)
        risk_level = "HIGH" if cpu_load > 80 or memory_load > 85 else "MEDIUM" if cpu_load > 50 or memory_load > 60 else "LOW"
        
        events = [
            {"time": 2, "description": f"CPU Usage: {cpu_load:.1f}%"},
            {"time": 4, "description": f"Memory Usage: {memory_load:.1f}%"},
            {"time": 7, "description": f"Risk Level: {risk_level}"},
            {"time": 12, "description": f"Active Processes: {metrics.get('num_processes', 0)}"},
            {"time": 16, "description": "System Status Check"}
        ]
        
        return events
        
    except Exception as e:
        logger.error(f"Real-time events generation error: {e}")
        return []

def generate_rag_visualization(processes, available, cycle):
    """Generate SVG visualization of Resource Allocation Graph"""
    try:
        # Create SVG content
        svg_content = f'''
        <svg width="100%" height="300" viewBox="0 0 600 300">
            <!-- Legend -->
            <text x="10" y="20" font-family="Arial" font-size="12" fill="#07393C">Legend: ▢ Process ○ Resource</text>
            <text x="10" y="35" font-family="Arial" font-size="12" fill="#2C666E">Solid: Allocation | Dashed: Request</text>
            
            <!-- Processes -->
        '''
        
        # Add process nodes
        process_positions = {}
        for i, proc in enumerate(processes):
            x = 100 + (i * 150)
            y = 80
            pid = proc['pid']
            process_positions[pid] = (x, y)
            
            # Highlight if in cycle
            fill_color = "#e74c3c" if f"P{pid}" in cycle else "#3b82f6"
            stroke_color = "#c0392b" if f"P{pid}" in cycle else "#1d4ed8"
            
            svg_content += f'''
            <rect x="{x-25}" y="{y-25}" width="50" height="50" fill="{fill_color}" 
                  stroke="{stroke_color}" stroke-width="2" rx="8"/>
            <text x="{x}" y="{y+5}" text-anchor="middle" fill="white" font-family="Arial" font-size="12">P{pid}</text>
            '''
        
        # Add resource nodes
        resource_positions = {'R1': (150, 200), 'R2': (300, 200), 'R3': (450, 200)}
        for res, (x, y) in resource_positions.items():
            svg_content += f'''
            <circle cx="{x}" cy="{y}" r="25" fill="#10b981" stroke="#047857" stroke-width="2"/>
            <text x="{x}" y="{y+5}" text-anchor="middle" fill="white" font-family="Arial" font-size="12">{res}</text>
            '''
        
        # Add allocation edges (solid arrows)
        for proc in processes:
            pid = proc['pid']
            px, py = process_positions[pid]
            for res in ['R1', 'R2', 'R3']:
                if proc['allocated'][res] > 0:
                    rx, ry = resource_positions[res]
                    # Process to Resource
                    svg_content += f'''
                    <line x1="{px}" y1="{py+25}" x2="{rx}" y2="{ry-25}" 
                          stroke="#2C666E" stroke-width="2" marker-end="url(#arrow)"/>
                    '''
        
        # Add request edges (dashed arrows)
        for proc in processes:
            pid = proc['pid']
            px, py = process_positions[pid]
            for res in ['R1', 'R2', 'R3']:
                if proc['request'][res] > 0:
                    rx, ry = resource_positions[res]
                    # Resource to Process
                    svg_content += f'''
                    <line x1="{rx}" y1="{ry-25}" x2="{px}" y2="{py-25}" 
                          stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrow)"/>
                    '''
        
        # Add arrow marker definition
        svg_content += '''
            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" 
                        orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#333"/>
                </marker>
            </defs>
        </svg>
        '''
        
        return svg_content.strip()
        
    except Exception as e:
        logger.error(f"RAG visualization error: {e}")
        return "<p>Error generating visualization</p>"
    """Generate timeline simulation data for Gantt chart"""
    try:
        timeline_events = []
        current_time = 0
        
        if system_state == "DEADLOCK":
            # Deadlock scenario simulation
            for i, proc in enumerate(processes):
                # Each process runs for a while then gets stuck
                start_time = current_time
                run_duration = 5 + i * 2  # Different durations
                timeline_events.append({
                    "pid": proc['pid'],
                    "start_time": start_time,
                    "duration": run_duration,
                    "state": "running",
                    "end_time": start_time + run_duration
                })
                current_time += run_duration
                
                # Deadlock occurs
                timeline_events.append({
                    "pid": proc['pid'],
                    "start_time": current_time,
                    "duration": 0,  # Instant event
                    "state": "deadlock",
                    "end_time": current_time,
                    "description": f"Deadlock detected for P{proc['pid']}"
                })
                
        elif system_state == "UNSAFE":
            # Unsafe scenario simulation
            for proc in processes:
                # Mix of states
                states = ["waiting", "running", "unsafe", "running"]
                durations = [2, 6, 3, 4]
                
                for state, duration in zip(states, durations):
                    timeline_events.append({
                        "pid": proc['pid'],
                        "start_time": current_time,
                        "duration": duration,
                        "state": state,
                        "end_time": current_time + duration
                    })
                    current_time += duration
                    
        else:
            # Safe scenario simulation
            for proc in processes:
                # Mostly running with some waiting
                states = ["waiting", "running", "waiting"]
                durations = [1, 12, 2]
                
                for state, duration in zip(states, durations):
                    timeline_events.append({
                        "pid": proc['pid'],
                        "start_time": current_time,
                        "duration": duration,
                        "state": state,
                        "end_time": current_time + duration
                    })
                    current_time += duration
        
        return timeline_events
        
    except Exception as e:
        logger.error(f"Timeline simulation error: {e}")
        return []

def generate_system_events(system_state):
    """Generate system-level events for timeline"""
    try:
        events = []
        
        if system_state == "DEADLOCK":
            events = [
                {"time": 8, "description": "Resource contention begins"},
                {"time": 12, "description": "Deadlock detected"},
                {"time": 15, "description": "System recovery initiated"}
            ]
        elif system_state == "UNSAFE":
            events = [
                {"time": 5, "description": "High resource utilization"},
                {"time": 10, "description": "Unsafe state detected"},
                {"time": 18, "description": "Preventive measures applied"}
            ]
        else:
            events = [
                {"time": 3, "description": "System operating normally"},
                {"time": 12, "description": "Optimal resource allocation"},
                {"time": 18, "description": "Graceful process completion"}
            ]
        
        return events
        
    except Exception as e:
        logger.error(f"System events generation error: {e}")
        return []
    """Generate SVG visualization of Resource Allocation Graph"""
    try:
        # Create SVG content
        svg_content = f'''
        <svg width="100%" height="300" viewBox="0 0 600 300">
            <!-- Legend -->
            <text x="10" y="20" font-family="Arial" font-size="12" fill="#07393C">Legend: ▢ Process ○ Resource</text>
            <text x="10" y="35" font-family="Arial" font-size="12" fill="#2C666E">Solid: Allocation | Dashed: Request</text>
            
            <!-- Processes -->
        '''
        
        # Add process nodes
        process_positions = {}
        for i, proc in enumerate(processes):
            x = 100 + (i * 150)
            y = 80
            pid = proc['pid']
            process_positions[pid] = (x, y)
            
            # Highlight if in cycle
            fill_color = "#e74c3c" if f"P{pid}" in cycle else "#3b82f6"
            stroke_color = "#c0392b" if f"P{pid}" in cycle else "#1d4ed8"
            
            svg_content += f'''
            <rect x="{x-25}" y="{y-25}" width="50" height="50" fill="{fill_color}" 
                  stroke="{stroke_color}" stroke-width="2" rx="8"/>
            <text x="{x}" y="{y+5}" text-anchor="middle" fill="white" font-family="Arial" font-size="12">P{pid}</text>
            '''
        
        # Add resource nodes
        resource_positions = {'R1': (150, 200), 'R2': (300, 200), 'R3': (450, 200)}
        for res, (x, y) in resource_positions.items():
            svg_content += f'''
            <circle cx="{x}" cy="{y}" r="25" fill="#10b981" stroke="#047857" stroke-width="2"/>
            <text x="{x}" y="{y+5}" text-anchor="middle" fill="white" font-family="Arial" font-size="12">{res}</text>
            '''
        
        # Add allocation edges (solid arrows)
        for proc in processes:
            pid = proc['pid']
            px, py = process_positions[pid]
            for res in ['R1', 'R2', 'R3']:
                if proc['allocated'][res] > 0:
                    rx, ry = resource_positions[res]
                    # Process to Resource
                    svg_content += f'''
                    <line x1="{px}" y1="{py+25}" x2="{rx}" y2="{ry-25}" 
                          stroke="#2C666E" stroke-width="2" marker-end="url(#arrow)"/>
                    '''
        
        # Add request edges (dashed arrows)
        for proc in processes:
            pid = proc['pid']
            px, py = process_positions[pid]
            for res in ['R1', 'R2', 'R3']:
                if proc['request'][res] > 0:
                    rx, ry = resource_positions[res]
                    # Resource to Process
                    svg_content += f'''
                    <line x1="{rx}" y1="{ry-25}" x2="{px}" y2="{py-25}" 
                          stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrow)"/>
                    '''
        
        # Add arrow marker definition
        svg_content += '''
            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" 
                        orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#333"/>
                </marker>
            </defs>
        </svg>
        '''
        
        return svg_content.strip()
        
    except Exception as e:
        logger.error(f"RAG visualization error: {e}")
        return "<p>Error generating visualization</p>"
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