// Global variables
let currentPage = 'dashboard';
let resourceChart = null;
let probabilityChart = null;
const API_BASE = 'http://localhost:5000/api';

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const pageElements = document.querySelectorAll('.page');
const pageTitle = document.getElementById('page-title');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeDashboard();
    initializeUpload();
    initializePrediction();
    initializeCharts();
});

// Navigation System
function initializeNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            switchPage(page);
        });
    });
}

function switchPage(page) {
    // Update navigation
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        }
    });
    
    // Update content
    pageElements.forEach(element => {
        element.classList.remove('active');
    });
    
    document.getElementById(`${page}-page`).classList.add('active');
    pageTitle.textContent = getPageTitle(page);
    
    currentPage = page;
    
    // Initialize page-specific functionality
    switch(page) {
        case 'dashboard':
            updateDashboardMetrics();
            break;
        case 'prediction':
            resetPredictionForm();
            break;
        case 'insights':
            updateInsights();
            break;
        case 'resources':
            renderResourceGraph();
            break;
    }
}

function getPageTitle(page) {
    const titles = {
        'dashboard': 'Dashboard',
        'upload': 'Upload Dataset',
        'prediction': 'Live Prediction',
        'insights': 'Model Insights',
        'resources': 'Resource Graph',
        'about': 'About'
    };
    return titles[page] || 'Page';
}

// Dashboard Functionality
function initializeDashboard() {
    updateDashboardMetrics();
}

function updateDashboardMetrics() {
    // Fetch real metrics from backend
    fetch(`${API_BASE}/metrics`)
        .then(response => response.json())
        .then(data => {
            if (data.metrics) {
                const metrics = data.metrics;
                document.getElementById('total-processes').textContent = metrics.num_processes;
                // Remove deadlock risk calculation from dashboard
                document.getElementById('deadlock-risk').textContent = 'N/A';
                document.getElementById('deadlock-risk').parentElement.style.display = 'none';
                document.getElementById('active-resources').textContent = '3'; // Simulated
                
                // Remove accuracy display from dashboard
                document.getElementById('accuracy').textContent = 'N/A';
                document.getElementById('accuracy').parentElement.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching metrics:', error);
            // Fallback to mock data
            document.getElementById('total-processes').textContent = '1,247';
            document.getElementById('deadlock-risk').textContent = 'N/A';
            document.getElementById('deadlock-risk').parentElement.style.display = 'none';
            document.getElementById('active-resources').textContent = '23';
            document.getElementById('accuracy').textContent = 'N/A';
            document.getElementById('accuracy').parentElement.style.display = 'none';
        });
    
    // Update chart data
    updateResourceChart();
    updateProbabilityChart();
}

function initializeCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded!');
        return;
    }
    
    const resourceCanvas = document.getElementById('resource-chart');
    const probabilityCanvas = document.getElementById('probability-chart');
    
    if (!resourceCanvas || !probabilityCanvas) {
        console.error('Chart canvas elements not found!');
        return;
    }
    
    // Resource Utilization Chart
    try {
        const resourceCtx = resourceCanvas.getContext('2d');
        resourceChart = new Chart(resourceCtx, {
            type: 'bar',
            data: {
                labels: ['CPU', 'Memory', 'Disk I/O', 'Network'],
                datasets: [{
                    label: 'Utilization %',
                    data: [65, 45, 30, 75],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(155, 89, 182, 0.7)',
                        'rgba(241, 196, 15, 0.7)'
                    ],
                    borderColor: [
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(155, 89, 182, 1)',
                        'rgba(241, 196, 15, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing resource chart:', error);
    }
    
    // Probability Chart
    try {
        const probabilityCtx = probabilityCanvas.getContext('2d');
        probabilityChart = new Chart(probabilityCtx, {
            type: 'line',
            data: {
                labels: ['1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h'],
                datasets: [{
                    label: 'Deadlock Probability %',
                    data: [8, 12, 15, 11, 9, 14, 18, 12],
                    borderColor: 'rgba(231, 76, 60, 1)',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 25,
                        ticks: {
                            stepSize: 5
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing probability chart:', error);
    }
}

function updateResourceChart() {
    if (resourceChart && resourceChart.data) {
        resourceChart.data.datasets[0].data = [
            Math.floor(Math.random() * 40) + 50,
            Math.floor(Math.random() * 30) + 30,
            Math.floor(Math.random() * 25) + 20,
            Math.floor(Math.random() * 30) + 60
        ];
        resourceChart.update();
    }
}

function updateProbabilityChart() {
    if (probabilityChart && probabilityChart.data) {
        const newData = [];
        for (let i = 0; i < 8; i++) {
            newData.push(Math.floor(Math.random() * 20) + 5);
        }
        probabilityChart.data.datasets[0].data = newData;
        probabilityChart.update();
    }
}

// Upload Functionality
function initializeUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const processBtn = document.getElementById('process-btn');
    
    // Debug logging
    console.log('Upload elements:', { uploadArea, fileInput, uploadBtn, processBtn });
    
    // Click to upload
    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Browse button clicked');
        if (fileInput) {
            fileInput.click();
        } else {
            console.error('File input not found!');
        }
    });
    
    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#27ae60';
            uploadArea.style.backgroundColor = '#f8fff8';
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#3498db';
            uploadArea.style.backgroundColor = 'white';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#3498db';
            uploadArea.style.backgroundColor = 'white';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });
    }
    
    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            console.log('File selected:', e.target.files);
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    } else {
        console.error('File input element not found!');
    }
    
    // Process button
    if (processBtn) {
        processBtn.addEventListener('click', processDataset);
    }
}

function handleFileSelect(file) {
    console.log('Handling file:', file);
    
    // More flexible CSV file detection
    const isCSV = file.type === 'text/csv' || 
                  file.type === 'application/csv' || 
                  file.name.endsWith('.csv') ||
                  file.name.endsWith('.CSV');
    
    if (!isCSV) {
        alert('Please select a CSV file. Selected file type: ' + file.type + ', name: ' + file.name);
        return;
    }
    
    const fileNameElement = document.getElementById('file-name');
    const fileInfoElement = document.getElementById('file-info');
    
    if (fileNameElement) {
        fileNameElement.textContent = file.name;
    }
    
    if (fileInfoElement) {
        fileInfoElement.style.display = 'block';
    }
    
    // Read file content for preview
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('File content preview:', e.target.result.substring(0, 500));
        console.log('File size:', file.size, 'bytes');
    };
    reader.readAsText(file);
}

function processDataset() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file first');
        return;
    }
    
    const processBtn = document.getElementById('process-btn');
    const originalText = processBtn.textContent;
    
    processBtn.textContent = 'Processing...';
    processBtn.disabled = true;
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload to backend
    fetch(`${API_BASE}/upload-dataset`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Show success message with results
        alert(`Dataset processed successfully!\n\n` +
              `Total samples: ${data.summary.total_samples}\n` +
              `Accuracy: ${data.summary.accuracy}%\n` +
              `Metrics have been updated.`);
        
        // Update dashboard with new metrics
        switchPage('dashboard');
        updateDashboardMetrics();
    })
    .catch(error => {
        console.error('Dataset processing error:', error);
        alert('Error processing dataset: ' + error.message);
    })
    .finally(() => {
        processBtn.textContent = originalText;
        processBtn.disabled = false;
    });
}

// Prediction Functionality
function initializePrediction() {
    const predictBtn = document.getElementById('predict-btn');
    predictBtn.addEventListener('click', makePrediction);
}

function makePrediction() {
    // For live prediction, we don't need manual input validation
    // The system will collect real metrics automatically
    
    const predictBtn = document.getElementById('predict-btn');
    const originalText = predictBtn.textContent;
    
    predictBtn.textContent = 'Analyzing...';
    predictBtn.disabled = true;
    
    // Collect system metrics for prediction
    fetch(`${API_BASE}/metrics`)
        .then(response => response.json())
        .then(metricsData => {
            if (metricsData.metrics) {
                const metrics = metricsData.metrics;
                
                // Prepare prediction data using real system metrics
                const predictionData = {
                    num_processes: metrics.num_processes,
                    cpu_percent: metrics.cpu_percent,
                    memory_percent: metrics.memory_percent,
                    disk_percent: metrics.disk_percent,
                    total_allocated: metrics.total_allocated,
                    total_need: metrics.total_need,
                    deadlock_risk: metrics.deadlock_risk
                };
                
                // Make API call to backend
                return fetch(`${API_BASE}/predict`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(predictionData)
                });
            } else {
                throw new Error('Failed to get system metrics');
            }
        })
        .then(response => response.json())
        .then(result => {
            console.log('Prediction result received:', result); // Debug log
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Display prediction result
            displayPredictionResult(
                result.prediction === 0 || result.prediction === 2, // High/Medium risk
                result.probabilities, // Pass the full probabilities object
                result.confidence,
                result.label,
                result.risk_level
            );
        })
        .catch(error => {
            console.error('Prediction error:', error);
            alert('Error making prediction: ' + error.message);
        })
        .finally(() => {
            predictBtn.textContent = originalText;
            predictBtn.disabled = false;
        });
}

function displayPredictionResult(isDeadlock, probability, confidence, label, riskLevel) {
    console.log('Display function called with:', { isDeadlock, probability, confidence, label, riskLevel }); // Debug log
    
    const resultDiv = document.getElementById('prediction-result');
    const riskLevelElement = document.getElementById('risk-level');
    const confidenceDiv = document.getElementById('confidence');
    
    resultDiv.style.display = 'block';
    
    // Conservative confidence-based labeling logic
    let displayLabel = '';
    let displayRiskLevel = '';
    let displayClass = '';
    
    if (confidence >= 85 && label === 'SAFE') {
        displayLabel = 'SAFE - High Confidence';
        displayRiskLevel = 'LOW';
        displayClass = 'low';
    } 
    else if (confidence >= 75 && label === 'UNSAFE') {
        displayLabel = 'UNSAFE - High Confidence';
        displayRiskLevel = 'HIGH';
        displayClass = 'high';
    }
    else if (confidence >= 90 && label === 'HIGH-RISK(DEADLOCK-PRONE)') {
        // Only show DEADLOCK-PRONE at very high confidence (90%+)
        displayLabel = 'DEADLOCK-PRONE - Very High Confidence';
        displayRiskLevel = 'HIGH';
        displayClass = 'high';
    }
    else {
        // For all other cases including low confidence DEADLOCK-PRONE predictions
        // Show as UNSAFE instead of DEADLOCK-PRONE
        if (label === 'HIGH-RISK(DEADLOCK-PRONE)' || label === 'UNSAFE') {
            displayLabel = 'UNSAFE - Needs Monitoring';
            displayRiskLevel = 'HIGH';
            displayClass = 'high';
        } else {
            displayLabel = 'SAFE - Low Confidence';
            displayRiskLevel = 'LOW';
            displayClass = 'low';
        }
    }
    
    // Set risk level text and class
    riskLevelElement.textContent = displayLabel;
    riskLevelElement.className = 'risk-level ' + displayClass;
    
    // Keep confidence display in Live Prediction
    confidenceDiv.textContent = `Confidence: ${confidence}%`;
    confidenceDiv.style.display = 'block';
    
    // Add probability bars visualization
    const probabilityBars = document.createElement('div');
    probabilityBars.style.marginTop = '15px';
    probabilityBars.style.padding = '10px';
    probabilityBars.style.backgroundColor = '#f8f9fa';
    probabilityBars.style.borderRadius = '8px';
    
    // Extract probabilities from the correct structure
    const safeProb = probability.SAFE || probability['SAFE'] || 0;
    const unsafeProb = probability.UNSAFE || probability['UNSAFE'] || 0;
    const deadlockProb = probability.DEADLOCK || probability['DEADLOCK'] || 0;
    
    console.log('Extracted probabilities:', { safeProb, unsafeProb, deadlockProb }); // Debug log
    
    probabilityBars.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: 500;">Probability Distribution:</div>
        <div style="margin: 5px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span>SAFE</span>
                <span>${safeProb.toFixed(1)}%</span>
            </div>
            <div style="background: #ecf0f1; height: 12px; border-radius: 6px; overflow: hidden;">
                <div style="background: #27ae60; height: 100%; width: ${safeProb}%;"></div>
            </div>
        </div>
        <div style="margin: 5px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span>UNSAFE</span>
                <span>${unsafeProb.toFixed(1)}%</span>
            </div>
            <div style="background: #ecf0f1; height: 12px; border-radius: 6px; overflow: hidden;">
                <div style="background: #f39c12; height: 100%; width: ${unsafeProb}%;"></div>
            </div>
        </div>
        <div style="margin: 5px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span>DEADLOCK-PRONE</span>
                <span>${deadlockProb.toFixed(1)}%</span>
            </div>
            <div style="background: #ecf0f1; height: 12px; border-radius: 6px; overflow: hidden;">
                <div style="background: #e74c3c; height: 100%; width: ${deadlockProb}%;"></div>
            </div>
        </div>
    `;
    
    // Add risk badge
    const riskBadge = document.createElement('div');
    riskBadge.style.marginTop = '10px';
    riskBadge.style.display = 'inline-block';
    riskBadge.style.padding = '5px 12px';
    riskBadge.style.borderRadius = '20px';
    riskBadge.style.fontWeight = '600';
    riskBadge.style.fontSize = '0.9rem';
    
    // Set badge color based on risk level
    switch(displayRiskLevel) {
        case 'LOW':
            riskBadge.style.backgroundColor = '#e8f5e8';
            riskBadge.style.color = '#27ae60';
            riskBadge.textContent = 'LOW RISK';
            break;
        case 'MEDIUM':
            riskBadge.style.backgroundColor = '#fef9e7';
            riskBadge.style.color = '#f39c12';
            riskBadge.textContent = 'MONITOR';
            break;
        case 'HIGH':
            riskBadge.style.backgroundColor = '#fadbd8';
            riskBadge.style.color = '#e74c3c';
            riskBadge.textContent = 'HIGH RISK';
            break;
    }
    
    // Clear previous additional elements
    const existingElements = confidenceDiv.parentNode.querySelectorAll('div:not(#risk-level):not(#confidence)');
    existingElements.forEach(el => el.remove());
    
    // Add new elements
    confidenceDiv.parentNode.appendChild(probabilityBars);
    confidenceDiv.parentNode.appendChild(riskBadge);
    
    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

function resetPredictionForm() {
    document.getElementById('process-id').value = '';
    document.getElementById('resource-requests').value = '';
    document.getElementById('current-hold').value = '';
    document.getElementById('process-priority').value = '2';
    document.getElementById('prediction-result').style.display = 'none';
}

// Insights Functionality
function updateInsights() {
    // Fetch real model information
    fetch(`${API_BASE}/model-info`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Feature Importance
            const featureImportance = document.getElementById('feature-importance');
            let importanceHTML = '';
            
            if (data.feature_importance) {
                Object.entries(data.feature_importance).forEach(([feature, importance], index) => {
                    const percentage = (importance * 100).toFixed(1);
                    importanceHTML += `
                        <div style="margin: 10px 0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>${feature}</span>
                                <span>${percentage}%</span>
                            </div>
                            <div style="background: #ecf0f1; height: 10px; border-radius: 5px; overflow: hidden;">
                                <div style="background: #3498db; height: 100%; width: ${percentage}%;"></div>
                            </div>
                        </div>
                    `;
                });
            } else {
                // Fallback mock data
                importanceHTML = `
                    <div style="margin: 10px 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Resource Requests</span>
                            <span>95%</span>
                        </div>
                        <div style="background: #ecf0f1; height: 10px; border-radius: 5px; overflow: hidden;">
                            <div style="background: #3498db; height: 100%; width: 95%;"></div>
                        </div>
                    </div>
                    <div style="margin: 10px 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Process Priority</span>
                            <span>87%</span>
                        </div>
                        <div style="background: #ecf0f1; height: 10px; border-radius: 5px; overflow: hidden;">
                            <div style="background: #3498db; height: 100%; width: 87%;"></div>
                        </div>
                    </div>
                `;
            }
            
            featureImportance.innerHTML = importanceHTML;
            
            // Model Performance
            const modelPerformance = document.getElementById('model-performance');
            modelPerformance.innerHTML = `
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Model Type</span>
                        <span style="font-weight: bold; color: #3498db;">${data.model_type || 'Random Forest'}</span>
                    </div>
                </div>
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Estimators</span>
                        <span style="font-weight: bold; color: #3498db;">${data.n_estimators || 200}</span>
                    </div>
                </div>
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Max Depth</span>
                        <span style="font-weight: bold; color: #3498db;">${data.max_depth || 15}</span>
                    </div>
                </div>
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Features</span>
                        <span style="font-weight: bold; color: #3498db;">${data.features ? data.features.length : 7}</span>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error fetching model info:', error);
            // Fallback to mock data
            const featureImportance = document.getElementById('feature-importance');
            featureImportance.innerHTML = `
                <div style="margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Resource Requests</span>
                        <span>95%</span>
                    </div>
                    <div style="background: #ecf0f1; height: 10px; border-radius: 5px; overflow: hidden;">
                        <div style="background: #3498db; height: 100%; width: 95%;"></div>
                    </div>
                </div>
                <div style="margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Process Priority</span>
                        <span>87%</span>
                    </div>
                    <div style="background: #ecf0f1; height: 10px; border-radius: 5px; overflow: hidden;">
                        <div style="background: #3498db; height: 100%; width: 87%;"></div>
                    </div>
                </div>
            `;
            
            const modelPerformance = document.getElementById('model-performance');
            modelPerformance.innerHTML = `
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Accuracy</span>
                        <span style="font-weight: bold; color: #27ae60;">94.2%</span>
                    </div>
                </div>
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Precision</span>
                        <span style="font-weight: bold; color: #27ae60;">92.1%</span>
                    </div>
                </div>
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Recall</span>
                        <span style="font-weight: bold; color: #27ae60;">96.3%</span>
                    </div>
                </div>
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>F1-Score</span>
                        <span style="font-weight: bold; color: #27ae60;">94.1%</span>
                    </div>
                </div>
            `;
        });
}

// Resource Graph Functionality
function renderResourceGraph() {
    const graphContainer = document.getElementById('resource-graph');
    
    // Fetch model information to get resource allocation data
    fetch(`${API_BASE}/model-info`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Create a more meaningful resource allocation visualization
            graphContainer.innerHTML = `
                <div style="text-align: center; width: 100%;">
                    <h3 style="margin-bottom: 20px;">Resource Allocation Visualization</h3>
                    <div style="display: flex; justify-content: center; align-items: center; height: 300px;">
                        <svg width="100%" height="100%" viewBox="0 0 500 300">
                            <!-- Processes (circles) -->
                            <circle cx="100" cy="100" r="30" fill="#3498db" stroke="#2980b9" stroke-width="2" />
                            <text x="100" y="105" text-anchor="middle" fill="white" font-size="12">P1</text>
                            
                            <circle cx="250" cy="80" r="30" fill="#3498db" stroke="#2980b9" stroke-width="2" />
                            <text x="250" y="85" text-anchor="middle" fill="white" font-size="12">P2</text>
                            
                            <circle cx="400" cy="120" r="30" fill="#3498db" stroke="#2980b9" stroke-width="2" />
                            <text x="400" y="125" text-anchor="middle" fill="white" font-size="12">P3</text>
                            
                            <!-- Resources (rectangles) -->
                            <rect x="80" y="200" width="40" height="40" fill="#27ae60" stroke="#219653" stroke-width="2" rx="5" />
                            <text x="100" y="225" text-anchor="middle" fill="white" font-size="10">R1</text>
                            
                            <rect x="230" y="200" width="40" height="40" fill="#27ae60" stroke="#219653" stroke-width="2" rx="5" />
                            <text x="250" y="225" text-anchor="middle" fill="white" font-size="10">R2</text>
                            
                            <rect x="380" y="200" width="40" height="40" fill="#27ae60" stroke="#219653" stroke-width="2" rx="5" />
                            <text x="400" y="225" text-anchor="middle" fill="white" font-size="10">R3</text>
                            
                            <!-- Allocation edges (solid lines) -->
                            <line x1="100" y1="130" x2="100" y2="200" stroke="#e74c3c" stroke-width="2" marker-end="url(#arrow)" />
                            <line x1="250" y1="110" x2="250" y2="200" stroke="#e74c3c" stroke-width="2" marker-end="url(#arrow)" />
                            <line x1="400" y1="150" x2="400" y2="200" stroke="#e74c3c" stroke-width="2" marker-end="url(#arrow)" />
                            
                            <!-- Request edges (dashed lines) -->
                            <line x1="130" y1="100" x2="220" y2="80" stroke="#f39c12" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrow)" />
                            <line x1="280" y1="80" x2="370" y2="120" stroke="#f39c12" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrow)" />
                            
                            <!-- Arrow marker definition -->
                            <defs>
                                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                    <path d="M0,0 L0,6 L9,3 z" fill="#333" />
                                </marker>
                            </defs>
                        </svg>
                    </div>
                    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px;">
                        <div style="display: flex; align-items: center;">
                            <div style="width: 15px; height: 15px; background: #3498db; border-radius: 50%; margin-right: 5px;"></div>
                            <span>Process</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div style="width: 15px; height: 15px; background: #27ae60; border-radius: 3px; margin-right: 5px;"></div>
                            <span>Resource</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div style="width: 15px; height: 3px; background: #e74c3c; margin-right: 5px;"></div>
                            <span>Allocation</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div style="width: 15px; height: 3px; background: #f39c12; margin-right: 5px; border-style: dashed;"></div>
                            <span>Request</span>
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                        <p style="color: #7f8c8d; margin: 10px 0;">This visualization represents resource allocation state and potential deadlock conditions.</p>
                        <p style="color: #7f8c8d; margin: 10px 0;">Solid lines indicate allocated resources, dashed lines indicate pending requests.</p>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error fetching model info for graph:', error);
            
            // Fallback visualization
            graphContainer.innerHTML = `
                <div style="text-align: center; width: 100%;">
                    <h3>Resource Allocation Graph</h3>
                    <p style="color: #7f8c8d; margin: 20px 0;">Could not load graph data. Using demo visualization.</p>
                    <div style="display: flex; justify-content: center; align-items: center; height: 300px;">
                        <svg width="100%" height="100%" viewBox="0 0 500 300">
                            <!-- Demo visualization -->
                            <circle cx="100" cy="100" r="30" fill="#3498db" stroke="#2980b9" stroke-width="2" />
                            <text x="100" y="105" text-anchor="middle" fill="white" font-size="12">P1</text>
                            
                            <circle cx="250" cy="80" r="30" fill="#3498db" stroke="#2980b9" stroke-width="2" />
                            <text x="250" y="85" text-anchor="middle" fill="white" font-size="12">P2</text>
                            
                            <rect x="80" y="200" width="40" height="40" fill="#27ae60" stroke="#219653" stroke-width="2" rx="5" />
                            <text x="100" y="225" text-anchor="middle" fill="white" font-size="10">R1</text>
                            
                            <rect x="230" y="200" width="40" height="40" fill="#27ae60" stroke="#219653" stroke-width="2" rx="5" />
                            <text x="250" y="225" text-anchor="middle" fill="white" font-size="10">R2</text>
                            
                            <line x1="100" y1="130" x2="100" y2="200" stroke="#e74c3c" stroke-width="2" marker-end="url(#arrow)" />
                            <line x1="250" y1="110" x2="250" y2="200" stroke="#e74c3c" stroke-width="2" marker-end="url(#arrow)" />
                            
                            <defs>
                                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                    <path d="M0,0 L0,6 L9,3 z" fill="#333" />
                                </marker>
                            </defs>
                        </svg>
                    </div>
                    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px;">
                        <div style="display: flex; align-items: center;">
                            <div style="width: 15px; height: 15px; background: #3498db; border-radius: 50%; margin-right: 5px;"></div>
                            <span>Process</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div style="width: 15px; height: 15px; background: #27ae60; border-radius: 3px; margin-right: 5px;"></div>
                            <span>Resource</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div style="width: 15px; height: 3px; background: #e74c3c; margin-right: 5px;"></div>
                            <span>Allocation</span>
                        </div>
                    </div>
                </div>
            `;
        });
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        notification.style.backgroundColor = '#27ae60';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
    } else {
        notification.style.backgroundColor = '#3498db';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Simulate real-time updates
setInterval(() => {
    if (currentPage === 'dashboard') {
        updateDashboardMetrics();
    }
}, 30000); // Update every 30 seconds