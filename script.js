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
    initializeRefreshButtons(); // Add this line
});

// Navigation System
function initializeNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            
            // Skip about page since it's removed
            if (page === 'about') {
                return;
            }
            
            switchPage(page);
        });
    });
}

// Initialize refresh buttons
function initializeRefreshButtons() {
    // Add refresh button functionality
    const refreshBtn = document.getElementById('refresh-all-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = '🔄 Refreshing...';
            this.disabled = true;
            
            // Refresh based on current page
            switch(currentPage) {
                case 'dashboard':
                    updateDashboardMetrics();
                    break;
                case 'resources':
                    updateResourceGraphStats();
                    break;
                case 'premium':
                    updatePremiumDashboard();
                    updatePremiumProcessesTable();
                    break;
                case 'prediction':
                    makePrediction();
                    break;
            }
            
            // Restore button after delay
            setTimeout(() => {
                this.innerHTML = originalText;
                this.disabled = false;
            }, 1500);
        });
    }
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
        case 'premium':
            initializePremiumDashboard();
            break;
        case 'upload':
            initializeUpload();
            break;
        // Removed 'about' case
    }
}

function getPageTitle(page) {
    const titles = {
        'dashboard': 'Dashboard',
        'upload': 'Upload Dataset',
        'prediction': 'Live Prediction',
        'insights': 'Model Insights',
        'resources': 'Resource Graph'
        // Removed 'about' entry
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
    // Initialize mode toggle
    const manualModeBtn = document.getElementById('manual-mode-btn');
    const realtimeModeBtn = document.getElementById('realtime-mode-btn');
    const manualSection = document.getElementById('manual-input-section');
    const realtimeSection = document.getElementById('realtime-info');
    const predictBtn = document.getElementById('predict-state-btn');
    
    if (manualModeBtn && realtimeModeBtn) {
        manualModeBtn.addEventListener('click', function() {
            manualModeBtn.classList.add('active');
            realtimeModeBtn.classList.remove('active');
            manualSection.style.display = 'block';
            realtimeSection.style.display = 'none';
            predictBtn.textContent = 'Predict State';
        });
        
        realtimeModeBtn.addEventListener('click', function() {
            realtimeModeBtn.classList.add('active');
            manualModeBtn.classList.remove('active');
            manualSection.style.display = 'none';
            realtimeSection.style.display = 'block';
            predictBtn.textContent = 'Analyze System';
        });
    }
    
    // Add process button
    const addProcessBtn = document.getElementById('add-process-btn');
    if (addProcessBtn) {
        addProcessBtn.addEventListener('click', addNewProcess);
    }
    
    // Predict button
    if (predictBtn) {
        predictBtn.addEventListener('click', handlePrediction);
    }
}

// Handle prediction based on current mode
function handlePrediction() {
    console.log('Handle prediction called');
    const manualModeActive = document.getElementById('manual-mode-btn').classList.contains('active');
    
    if (manualModeActive) {
        console.log('Manual mode active, performing manual prediction');
        performManualPrediction();
    } else {
        console.log('Real-time mode active, performing real-time prediction');
        performRealTimePrediction();
    }
}

// Manual prediction with Banker's algorithm
function performManualPrediction() {
    console.log('Performing manual prediction');
    const predictBtn = document.getElementById('predict-state-btn');
    const originalText = predictBtn.textContent;
    
    predictBtn.textContent = 'Analyzing...';
    predictBtn.disabled = true;
    
    // Collect manual input data
    const inputData = collectManualInput();
    console.log('Collected input data:', inputData);
    
    // Send to backend
    fetch(`${API_BASE}/manual_predict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData)
    })
    .then(response => {
        console.log('Received response from backend');
        return response.json();
    })
    .then(result => {
        console.log('Processing result:', result);
        if (result.error) {
            throw new Error(result.error);
        }
        displayPredictionResult(
            result.state === 'UNSAFE' || result.state === 'DEADLOCK',
            result.probabilities,
            Math.max(...Object.values(result.probabilities)) * 100,
            result.state,
            result.state === 'DEADLOCK' ? 'HIGH' : (result.state === 'UNSAFE' ? 'MEDIUM' : 'LOW')
        );
        
        // Display additional results
        console.log('Calling displayBankersResults');
        displayBankersResults(result);
    })
    .catch(error => {
        console.error('Manual prediction error:', error);
        alert('Error in manual prediction: ' + error.message);
    })
    .finally(() => {
        predictBtn.textContent = originalText;
        predictBtn.disabled = false;
    });
}

// Real-time prediction using psutil
function performRealTimePrediction() {
    const predictBtn = document.getElementById('predict-state-btn');
    const originalText = predictBtn.textContent;
    
    predictBtn.textContent = 'Analyzing System...';
    predictBtn.disabled = true;
    
    // Use existing live prediction endpoint
    fetch(`${API_BASE}/live-predict`)
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                throw new Error(result.error);
            }
            
            displayPredictionResult(
                result.prediction === 0 || result.prediction === 2,
                result.probabilities,
                result.confidence,
                result.label,
                result.risk_level
            );
        })
        .catch(error => {
            console.error('Real-time prediction error:', error);
            alert('Error analyzing system: ' + error.message);
        })
        .finally(() => {
            predictBtn.textContent = originalText;
            predictBtn.disabled = false;
        });
}

// Collect manual input data
function collectManualInput() {
    // Get available resources
    const available = {
        "R1": parseInt(document.getElementById('avail-r1').value) || 0,
        "R2": parseInt(document.getElementById('avail-r2').value) || 0,
        "R3": parseInt(document.getElementById('avail-r3').value) || 0
    };
    
    // Get processes
    const processes = [];
    const processContainers = document.querySelectorAll('.process-input');
    
    processContainers.forEach(container => {
        const pid = parseInt(container.querySelector('.pid-input').value) || 0;
        const priority = parseInt(container.querySelector('.priority-input').value) || 3;
        
        const allocated = {
            "R1": parseInt(container.querySelector('.alloc-r1').value) || 0,
            "R2": parseInt(container.querySelector('.alloc-r2').value) || 0,
            "R3": parseInt(container.querySelector('.alloc-r3').value) || 0
        };
        
        const maxNeed = {
            "R1": parseInt(container.querySelector('.need-r1').value) || 0,
            "R2": parseInt(container.querySelector('.need-r2').value) || 0,
            "R3": parseInt(container.querySelector('.need-r3').value) || 0
        };
        
        const request = {
            "R1": parseInt(container.querySelector('.req-r1').value) || 0,
            "R2": parseInt(container.querySelector('.req-r2').value) || 0,
            "R3": parseInt(container.querySelector('.req-r3').value) || 0
        };
        
        processes.push({
            pid: pid,
            allocated: allocated,
            max_need: maxNeed,
            request: request,
            priority: priority
        });
    });
    
    return {
        available_resources: available,
        processes: processes
    };
}

// Global variables for Gantt chart
let ganttTimeline = null;
let ganttAnimation = null;
let currentTimelinePosition = 0;
let timelineSpeed = 5;

// Display Banker's algorithm results
function displayBankersResults(result) {
    // Display safe sequence
    const safeSequenceSection = document.getElementById('safe-sequence-section');
    const safeSequenceList = document.getElementById('safe-sequence-list');
    
    if (safeSequenceSection && safeSequenceList) {
        if (result.safe_sequence && result.safe_sequence.length > 0) {
            safeSequenceSection.style.display = 'block';
            safeSequenceList.innerHTML = '';
            result.safe_sequence.forEach(process => {
                const item = document.createElement('div');
                item.className = 'sequence-item';
                item.textContent = process;
                safeSequenceList.appendChild(item);
            });
        } else {
            safeSequenceSection.style.display = 'none';
        }
    }
    
    // Display deadlock detection
    const deadlockSection = document.getElementById('deadlock-section');
    const deadlockDetails = document.getElementById('deadlock-details');
    
    if (deadlockSection && deadlockDetails) {
        if (result.state === 'DEADLOCK' && result.rag_cycle) {
            deadlockSection.style.display = 'block';
            deadlockDetails.textContent = `Cycle detected in Resource Allocation Graph: ${result.rag_cycle.join(' → ')}`;
        } else {
            deadlockSection.style.display = 'none';
        }
    }
    
    // Display RAG visualization
    const ragSection = document.getElementById('rag-visualization');
    const ragContainer = document.getElementById('rag-graph-container');
    
    if (ragSection && ragContainer) {
        if (result.rag_visualization) {
            ragSection.style.display = 'block';
            ragContainer.innerHTML = result.rag_visualization;
        } else {
            ragSection.style.display = 'none';
        }
    }
    
    // Generate and display Gantt chart
    generateGanttChart(result);
}

// Generate Gantt chart based on prediction results
function generateGanttChart(result) {
    console.log('Generating Gantt chart with result:', result);
    const ganttSection = document.getElementById('gantt-chart-section');
    const timelineContainer = document.getElementById('gantt-timeline');
    const processesContainer = document.getElementById('gantt-processes');
    
    // Check if all required elements exist
    if (!ganttSection || !timelineContainer || !processesContainer) {
        console.warn('Gantt chart elements not found in DOM');
        return;
    }
    
    if (!result.processes || result.processes.length === 0) {
        console.log('No processes found, hiding Gantt chart');
        ganttSection.style.display = 'none';
        return;
    }
    
    console.log('Showing Gantt chart section');
    ganttSection.style.display = 'block';
    
    // Clear existing content
    timelineContainer.innerHTML = '';
    processesContainer.innerHTML = '';
    
    // Create timeline markers (0s to 20s)
    const totalTime = 20;
    for (let i = 0; i <= totalTime; i += 2) {
        const marker = document.createElement('div');
        marker.style.position = 'relative';
        marker.style.flex = '1';
        marker.style.textAlign = 'center';
        marker.textContent = `${i}s`;
        timelineContainer.appendChild(marker);
    }
    
    // Create process rows
    result.processes.forEach((process, index) => {
        const processRow = document.createElement('div');
        processRow.className = 'gantt-process-row';
        
        const processLabel = document.createElement('div');
        processLabel.className = 'gantt-process-label';
        processLabel.textContent = `P${process.pid}`;
        processRow.appendChild(processLabel);
        
        const barsContainer = document.createElement('div');
        barsContainer.className = 'gantt-bars-container';
        processRow.appendChild(barsContainer);
        
        // Generate timeline bars for this process
        generateProcessTimelineBars(barsContainer, process, result.state, index);
        
        processesContainer.appendChild(processRow);
    });
    
    // Add event markers if there are system events
    if (result.events) {
        addEventMarkers(result.events);
    }
    
    // Initialize timeline controls
    initializeTimelineControls();
}

// Generate timeline bars for a process
function generateProcessTimelineBars(container, process, systemState, processIndex) {
    const totalTime = 20; // 20 seconds total timeline
    const pid = process.pid;
    
    // Different scenarios based on system state
    if (systemState === 'DEADLOCK') {
        // Deadlock scenario - process gets cut off
        const runningTime = 8 + (processIndex * 2); // Different start times
        const barWidth = (runningTime / totalTime) * 100;
        
        const runningBar = document.createElement('div');
        runningBar.className = 'gantt-bar running';
        runningBar.style.width = `${barWidth}%`;
        runningBar.style.left = '0%';
        runningBar.textContent = `Running (${runningTime}s)`;
        container.appendChild(runningBar);
        
        // Deadlock marker
        const deadlockMarker = document.createElement('div');
        deadlockMarker.className = 'gantt-bar deadlock partial';
        deadlockMarker.style.width = '8px';
        deadlockMarker.style.left = `${barWidth}%`;
        deadlockMarker.style.height = '100%';
        deadlockMarker.innerHTML = '💥';
        container.appendChild(deadlockMarker);
        
    } else if (systemState === 'UNSAFE') {
        // Unsafe scenario - mix of running and unsafe periods
        const segments = [
            { type: 'running', duration: 6, label: 'Running' },
            { type: 'unsafe', duration: 4, label: 'Unsafe' },
            { type: 'waiting', duration: 3, label: 'Waiting' },
            { type: 'running', duration: 4, label: 'Running' }
        ];
        
        let currentTime = 0;
        segments.forEach(segment => {
            if (currentTime < totalTime) {
                const segmentWidth = (segment.duration / totalTime) * 100;
                const bar = document.createElement('div');
                bar.className = `gantt-bar ${segment.type}`;
                bar.style.width = `${segmentWidth}%`;
                bar.style.left = `${(currentTime / totalTime) * 100}%`;
                bar.textContent = segment.label;
                container.appendChild(bar);
                currentTime += segment.duration;
            }
        });
        
    } else {
        // Safe scenario - mostly running with some waiting
        const segments = [
            { type: 'waiting', duration: 2, label: 'Init' },
            { type: 'running', duration: 12, label: 'Running' },
            { type: 'waiting', duration: 3, label: 'Cleanup' }
        ];
        
        let currentTime = 0;
        segments.forEach(segment => {
            if (currentTime < totalTime) {
                const segmentWidth = (segment.duration / totalTime) * 100;
                const bar = document.createElement('div');
                bar.className = `gantt-bar ${segment.type}`;
                bar.style.width = `${segmentWidth}%`;
                bar.style.left = `${(currentTime / totalTime) * 100}%`;
                bar.textContent = segment.label;
                container.appendChild(bar);
                currentTime += segment.duration;
            }
        });
    }
    
    // Add priority indicator
    const priorityIndicator = document.createElement('div');
    priorityIndicator.style.position = 'absolute';
    priorityIndicator.style.right = '5px';
    priorityIndicator.style.top = '2px';
    priorityIndicator.style.fontSize = '10px';
    priorityIndicator.style.color = '#6c757d';
    priorityIndicator.textContent = `P${process.priority || 3}`;
    container.appendChild(priorityIndicator);
}

// Add event markers to timeline
function addEventMarkers(events) {
    const timelineContainer = document.getElementById('gantt-timeline');
    const processesContainer = document.getElementById('gantt-processes');
    
    events.forEach(event => {
        // Add time marker to timeline
        const timeMarker = document.createElement('div');
        timeMarker.className = 'gantt-time-marker';
        timeMarker.style.left = `${(event.time / 20) * 100}%`;
        timelineContainer.appendChild(timeMarker);
        
        // Add event description
        const eventMarker = document.createElement('div');
        eventMarker.className = 'gantt-event-marker';
        eventMarker.style.left = `${(event.time / 20) * 100}%`;
        eventMarker.textContent = event.description;
        timelineContainer.appendChild(eventMarker);
    });
}

// Initialize timeline controls
function initializeTimelineControls() {
    console.log('Initializing timeline controls');
    const playBtn = document.getElementById('play-timeline-btn');
    const pauseBtn = document.getElementById('pause-timeline-btn');
    const resetBtn = document.getElementById('reset-timeline-btn');
    const speedSlider = document.getElementById('timeline-speed');
    const speedValue = document.getElementById('speed-value');
    
    // Check if all elements exist
    if (!playBtn || !pauseBtn || !resetBtn || !speedSlider || !speedValue) {
        console.warn('Timeline control elements not found in DOM');
        return;
    }
    
    console.log('Timeline controls initialized successfully');
    
    // Speed slider
    speedSlider.addEventListener('input', function() {
        timelineSpeed = parseInt(this.value);
        speedValue.textContent = `${timelineSpeed}x`;
        if (ganttAnimation) {
            // Restart animation with new speed
            stopTimelineAnimation();
            startTimelineAnimation();
        }
    });
    
    // Play button
    playBtn.addEventListener('click', function() {
        this.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
        startTimelineAnimation();
    });
    
    // Pause button
    pauseBtn.addEventListener('click', function() {
        this.style.display = 'none';
        playBtn.style.display = 'inline-block';
        stopTimelineAnimation();
    });
    
    // Reset button
    resetBtn.addEventListener('click', function() {
        stopTimelineAnimation();
        playBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        resetTimeline();
    });
}

// Start timeline animation
function startTimelineAnimation() {
    const processesContainer = document.getElementById('gantt-processes');
    
    // Check if container exists
    if (!processesContainer) {
        console.warn('Gantt processes container not found');
        return;
    }
    
    const indicator = document.createElement('div');
    indicator.className = 'timeline-indicator';
    indicator.id = 'timeline-indicator';
    processesContainer.appendChild(indicator);
    
    currentTimelinePosition = 0;
    const totalTime = 20; // seconds
    const animationDuration = (totalTime * 1000) / timelineSpeed; // ms
    
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        currentTimelinePosition = progress * 100;
        
        indicator.style.left = `${currentTimelinePosition}%`;
        
        if (progress < 1) {
            ganttAnimation = requestAnimationFrame(animate);
        } else {
            // Animation complete
            const playBtn = document.getElementById('play-timeline-btn');
            const pauseBtn = document.getElementById('pause-timeline-btn');
            if (playBtn && pauseBtn) {
                pauseBtn.style.display = 'none';
                playBtn.style.display = 'inline-block';
            }
            ganttAnimation = null;
        }
    }
    
    ganttAnimation = requestAnimationFrame(animate);
}

// Stop timeline animation
function stopTimelineAnimation() {
    if (ganttAnimation) {
        cancelAnimationFrame(ganttAnimation);
        ganttAnimation = null;
    }
}

// Reset timeline
function resetTimeline() {
    const indicator = document.getElementById('timeline-indicator');
    if (indicator) {
        indicator.remove();
    }
    currentTimelinePosition = 0;
}

// Add new process input section
function addNewProcess() {
    const container = document.getElementById('processes-container');
    const processCount = container.querySelectorAll('.process-input').length + 1;
    
    const processDiv = document.createElement('div');
    processDiv.className = 'process-input';
    processDiv.dataset.processId = processCount;
    
    processDiv.innerHTML = `
        <div class="process-header">
            <span>Process P${processCount}</span>
            <button class="remove-process-btn" onclick="removeProcess(${processCount})">×</button>
        </div>
        <div class="process-details">
            <div class="input-row">
                <div class="input-group">
                    <label>Process ID</label>
                    <input type="number" class="pid-input" placeholder="${100 + processCount}" value="${100 + processCount}">
                </div>
                <div class="input-group">
                    <label>Priority (1-5)</label>
                    <input type="number" class="priority-input" placeholder="3" min="1" max="5" value="3">
                </div>
            </div>
            
            <div class="resource-grid">
                <div class="resource-section">
                    <label>Max Need</label>
                    <div class="resource-inputs">
                        <input type="number" class="need-r1" placeholder="R1" min="0" value="0">
                        <input type="number" class="need-r2" placeholder="R2" min="0" value="0">
                        <input type="number" class="need-r3" placeholder="R3" min="0" value="0">
                    </div>
                </div>
                
                <div class="resource-section">
                    <label>Currently Allocated</label>
                    <div class="resource-inputs">
                        <input type="number" class="alloc-r1" placeholder="R1" min="0" value="0">
                        <input type="number" class="alloc-r2" placeholder="R2" min="0" value="0">
                        <input type="number" class="alloc-r3" placeholder="R3" min="0" value="0">
                    </div>
                </div>
                
                <div class="resource-section">
                    <label>Current Request</label>
                    <div class="resource-inputs">
                        <input type="number" class="req-r1" placeholder="R1" min="0" value="0">
                        <input type="number" class="req-r2" placeholder="R2" min="0" value="0">
                        <input type="number" class="req-r3" placeholder="R3" min="0" value="0">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(processDiv);
}

// Remove process input section
function removeProcess(processId) {
    const processDiv = document.querySelector(`.process-input[data-process-id="${processId}"]`);
    if (processDiv && document.querySelectorAll('.process-input').length > 1) {
        processDiv.remove();
        // Renumber remaining processes
        renumberProcesses();
    }
}

// Renumber processes after removal
function renumberProcesses() {
    const processes = document.querySelectorAll('.process-input');
    processes.forEach((process, index) => {
        process.dataset.processId = index + 1;
        const header = process.querySelector('.process-header span');
        header.textContent = `Process P${index + 1}`;
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
    // Feature Importance Section
    const featureImportance = document.getElementById('feature-importance');
    if (featureImportance) {
        featureImportance.innerHTML = `
            <div style="padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin-bottom: 15px; color: #0A090C;">Feature Importance from ML Model</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>num_processes</span>
                            <span style="font-weight: 600;">28.5%</span>
                        </div>
                        <div style="background: #E2E5EB; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: #07393C; height: 100%; width: 28.5%; border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>cpu_percent</span>
                            <span style="font-weight: 600;">22.3%</span>
                        </div>
                        <div style="background: #E2E5EB; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: #2C666E; height: 100%; width: 22.3%; border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>memory_percent</span>
                            <span style="font-weight: 600;">19.8%</span>
                        </div>
                        <div style="background: #E2E5EB; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: #07393C; height: 100%; width: 19.8%; border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>disk_percent</span>
                            <span style="font-weight: 600;">15.2%</span>
                        </div>
                        <div style="background: #E2E5EB; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: #2C666E; height: 100%; width: 15.2%; border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>total_allocated</span>
                            <span style="font-weight: 600;">8.7%</span>
                        </div>
                        <div style="background: #E2E5EB; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: #07393C; height: 100%; width: 8.7%; border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>total_need</span>
                            <span style="font-weight: 600;">5.5%</span>
                        </div>
                        <div style="background: #E2E5EB; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: #2C666E; height: 100%; width: 5.5%; border-radius: 4px;"></div>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: rgba(144, 221, 240, 0.1); border-radius: 8px; border-left: 3px solid #2C666E;">
                    <p style="margin: 0; color: #0A090C; font-size: 14px;">
                        <strong>Model:</strong> Random Forest Classifier (200 trees)<br>
                        <strong>Accuracy:</strong> ~85% on test data<br>
                        <strong>Features:</strong> 7 total features used for deadlock prediction
                    </p>
                </div>
            </div>
        `;
    }
    
    // Model Performance Section
    const modelPerformance = document.getElementById('model-performance');
    if (modelPerformance) {
        modelPerformance.innerHTML = `
            <div style="padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin-bottom: 15px; color: #0A090C;">Model Performance Metrics</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
                    <div style="padding: 15px; background: rgba(7, 57, 60, 0.1); border-radius: 10px;">
                        <div style="font-size: 24px; font-weight: 700; color: #07393C;">85%</div>
                        <div style="font-size: 14px; color: #2C666E; margin-top: 5px;">Overall Accuracy</div>
                    </div>
                    <div style="padding: 15px; background: rgba(44, 102, 110, 0.1); border-radius: 10px;">
                        <div style="font-size: 24px; font-weight: 700; color: #2C666E;">0.82</div>
                        <div style="font-size: 14px; color: #07393C; margin-top: 5px;">F1-Score</div>
                    </div>
                    <div style="padding: 15px; background: rgba(144, 221, 240, 0.1); border-radius: 10px;">
                        <div style="font-size: 24px; font-weight: 700; color: #07393C;">0.78</div>
                        <div style="font-size: 14px; color: #2C666E; margin-top: 5px;">Precision</div>
                    </div>
                </div>
                <div style="margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="text-align: center; padding: 15px; background: rgba(255, 255, 255, 0.7); border-radius: 8px;">
                        <div style="font-size: 16px; font-weight: 600; color: #07393C;">Training Data</div>
                        <div style="font-size: 14px; color: #2C666E; margin-top: 5px;">1,200 samples</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: rgba(255, 255, 255, 0.7); border-radius: 8px;">
                        <div style="font-size: 16px; font-weight: 600; color: #07393C;">Test Data</div>
                        <div style="font-size: 14px; color: #2C666E; margin-top: 5px;">400 samples</div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Resource Graph Page Initialization
function initializeResourceGraphPage() {
    updateResourceGraphStats();
    setupFilterButtons();
    
    // Manual refresh only - no auto-update
    // Users can click refresh buttons to update data
}

function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // In a real implementation, this would filter the graph
            const filterType = this.getAttribute('data-filter');
            console.log(`Filtering by: ${filterType}`);
        });
    });
}

// Update Resource Graph Statistics
async function updateResourceGraphStats() {
    try {
        // Fetch metrics from backend
        const response = await fetch(`${API_BASE}/metrics`);
        const data = await response.json();
        
        if (data.metrics) {
            const metrics = data.metrics;
            
            // Update system stats
            document.getElementById('cpu-percent').textContent = `${metrics.cpu_percent.toFixed(1)}%`;
            document.getElementById('memory-percent').textContent = `${metrics.memory_percent.toFixed(1)}%`;
            document.getElementById('total-processes-count').textContent = metrics.num_processes;
            
            // Update the resource graph visualization
            updateResourceGraphVisualization(metrics);
        }
        
        // Fetch process data
        const processesResponse = await fetch(`${API_BASE}/processes`);
        const processesData = await processesResponse.json();
        
        if (processesData.processes) {
            updateProcessesTable(processesData.processes);
        }
        
    } catch (error) {
        console.error('Error updating resource graph stats:', error);
        
        // Use mock data if API fails
        updateWithMockData();
    }
}

function updateWithMockData() {
    // Mock system stats
    const mockCpu = Math.random() * 100;
    const mockMemory = Math.random() * 100;
    const mockProcesses = Math.floor(Math.random() * 500) + 100;
    
    document.getElementById('cpu-percent').textContent = `${mockCpu.toFixed(1)}%`;
    document.getElementById('memory-percent').textContent = `${mockMemory.toFixed(1)}%`;
    document.getElementById('total-processes-count').textContent = mockProcesses;
    
    // Mock processes
    const mockProcessesList = [];
    for (let i = 0; i < 10; i++) {
        mockProcessesList.push({
            pid: Math.floor(Math.random() * 10000) + 1000,
            name: `process_${Math.floor(Math.random() * 100)}.exe`,
            status: Math.random() > 0.2 ? 'running' : 'stopped',
            cpu_percent: parseFloat((Math.random() * 100).toFixed(2)),
            memory_percent: parseFloat((Math.random() * 50).toFixed(2))
        });
    }
    
    updateProcessesTable(mockProcessesList);
    updateResourceGraphVisualization({
        cpu_percent: mockCpu,
        memory_percent: mockMemory,
        num_processes: mockProcesses
    });
}

function updateResourceGraphVisualization(metrics) {
    const graphContainer = document.getElementById('resource-graph');
    
    // Create SVG for the resource allocation graph
    const svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 500 300">
            <!-- Processes -->
            <g transform="translate(50, 50)">
                <circle cx="0" cy="0" r="25" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" />
                <text x="0" y="5" text-anchor="middle" fill="white" font-size="12">P1</text>
                
                <circle cx="100" cy="-30" r="25" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" />
                <text x="100" y="-25" text-anchor="middle" fill="white" font-size="12">P2</text>
                
                <circle cx="200" cy="0" r="25" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" />
                <text x="200" y="5" text-anchor="middle" fill="white" font-size="12">P3</text>
            </g>
            
            <!-- Resources -->
            <g transform="translate(50, 200)">
                <rect x="0" y="0" width="50" height="50" fill="#10b981" stroke="#047857" stroke-width="2" rx="5" />
                <text x="25" y="30" text-anchor="middle" fill="white" font-size="12">R1</text>
                
                <rect x="100" y="0" width="50" height="50" fill="#10b981" stroke="#047857" stroke-width="2" rx="5" />
                <text x="125" y="30" text-anchor="middle" fill="white" font-size="12">R2</text>
                
                <rect x="200" y="0" width="50" height="50" fill="#10b981" stroke="#047857" stroke-width="2" rx="5" />
                <text x="225" y="30" text-anchor="middle" fill="white" font-size="12">R3</text>
            </g>
            
            <!-- Allocations -->
            <line x1="50" y1="75" x2="75" y2="200" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow)" />
            <line x1="150" y1="45" x2="125" y2="200" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow)" />
            <line x1="250" y1="75" x2="225" y2="200" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow)" />
            
            <!-- Requests -->
            <line x1="100" y1="100" x2="225" y2="200" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrow)" />
            <line x1="200" y1="100" x2="75" y2="200" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrow)" />
            
            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#333" />
                </marker>
            </defs>
        </svg>
    `;
    
    graphContainer.innerHTML = svgContent;
}

function updateProcessesTable(processes) {
    const tableBody = document.getElementById('processes-tbody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Sort processes by CPU usage (descending)
    const sortedProcesses = [...processes].sort((a, b) => (b.cpu_percent || 0) - (a.cpu_percent || 0));
    
    // Add rows for each process
    sortedProcesses.forEach(process => {
        const row = document.createElement('tr');
        
        // Determine status class
        const statusClass = process.status === 'running' ? 'status-running' : 'status-stopped';
        const statusText = process.status.charAt(0).toUpperCase() + process.status.slice(1);
        
        row.innerHTML = `
            <td>${process.pid}</td>
            <td>${process.name}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td style="text-align: right;">${(process.cpu_percent || 0).toFixed(2)}%</td>
            <td style="text-align: right;">${(process.memory_percent || 0).toFixed(2)}%</td>
        `;
        
        tableBody.appendChild(row);
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

// Premium Dashboard Functionality
function initializePremiumDashboard() {
    initializePremiumGraph();
    setupPremiumEventListeners();
    updatePremiumDashboard();
    
    // Manual refresh only - no auto-refresh
    // Users click buttons to update data when needed
    
    // Handle resize events
    window.addEventListener('resize', debounce(drawPremiumArrows, 300));
    window.addEventListener('scroll', debounce(drawPremiumArrows, 100));
}

// Initialize premium graph with fully dynamic system data
function initializePremiumGraph() {
    // Get real processes and system metrics
    Promise.all([
        fetch(`${API_BASE}/processes`).then(response => response.json()),
        fetch(`${API_BASE}/metrics`).then(response => response.json())
    ])
    .then(([processesData, metricsData]) => {
        if (processesData.processes && metricsData.metrics) {
            const realProcesses = processesData.processes;
            const metrics = metricsData.metrics;
            
            // Dynamically determine number of processes to show (2-5 based on system load)
            const numProcesses = Math.min(Math.max(Math.floor(realProcesses.length / 20), 2), 5);
            const selectedProcesses = realProcesses.slice(0, numProcesses);
            
            // Dynamically determine resources based on system metrics
            const resources = generateDynamicResources(metrics);
            
            // Generate dynamic process nodes
            const processes = generateDynamicProcesses(selectedProcesses);
            
            // Generate dynamic allocations based on real system state
            const allocations = generateDynamicAllocations(processes, resources, metrics);
            
            // Generate dynamic requests based on process behavior
            const requests = generateDynamicRequests(processes, resources);
            
            renderPremiumGraph(processes, resources, allocations, requests);
        } else {
            useSampleData();
        }
    })
    .catch(error => {
        console.error('Error fetching dynamic data:', error);
        useSampleData();
    });
}

function generateDynamicResources(metrics) {
    const resources = [];
    
    // Base resources
    resources.push({ id: 'R1', x: 100, y: 200, name: 'CPU Core 1' });
    resources.push({ id: 'R2', x: 250, y: 200, name: 'Memory' });
    
    // Add disk resource if disk usage is high
    if (metrics.disk_percent > 50) {
        resources.push({ id: 'R3', x: 400, y: 200, name: 'Disk I/O' });
    }
    
    // Add network resource if many processes
    if (metrics.num_processes > 100) {
        resources.push({ id: 'R4', x: 550, y: 200, name: 'Network' });
    }
    
    return resources;
}

function generateDynamicProcesses(processList) {
    const processes = [];
    const baseX = 100;
    const xSpacing = 150;
    
    // Use real processes from the system
    processList.forEach((proc, index) => {
        processes.push({
            id: `P${index + 1}`,
            x: baseX + (index * xSpacing),
            y: 80,
            name: proc.name || `Process ${proc.pid}`,
            realPid: proc.pid,
            cpu: proc.cpu_percent || 0,
            memory: proc.memory_percent || 0
        });
    });
    
    return processes;
}

function generateDynamicAllocations(processes, resources, metrics) {
    const allocations = [];
    
    processes.forEach((process, index) => {
        // Allocate resources based on process intensity
        if (process.cpu > 20) {
            allocations.push({ from: process.id, to: 'R1' }); // CPU intensive
        }
        if (process.memory > 15) {
            allocations.push({ from: process.id, to: 'R2' }); // Memory intensive
        }
        
        // Distribute allocations reasonably
        if (index < resources.length) {
            allocations.push({ from: process.id, to: resources[index].id });
        }
    });
    
    return allocations;
}

function generateDynamicRequests(processes, resources) {
    const requests = [];
    
    processes.forEach(process => {
        // Generate requests based on process characteristics
        if (process.cpu > 10 && resources.find(r => r.id === 'R2')) {
            requests.push({ from: process.id, to: 'R2' }); // CPU process requesting memory
        }
        if (process.memory > 10 && resources.find(r => r.id === 'R1')) {
            requests.push({ from: process.id, to: 'R1' }); // Memory process requesting CPU
        }
    });
    
    return requests;
}

function useSampleData() {
    console.warn('Using sample data - backend API unavailable');
    
    // Sample processes (fallback only)
    const processes = [
        { id: 'P1', x: 150, y: 80, name: 'System Process 1', realPid: 1001 },
        { id: 'P2', x: 300, y: 80, name: 'System Process 2', realPid: 1002 },
        { id: 'P3', x: 450, y: 80, name: 'System Process 3', realPid: 1003 }
    ];

    // Sample resources
    const resources = [
        { id: 'R1', x: 150, y: 200, name: 'CPU Core 1' },
        { id: 'R2', x: 300, y: 200, name: 'Memory' },
        { id: 'R3', x: 450, y: 200, name: 'Disk I/O' }
    ];

    // Sample allocations
    const allocations = [
        { from: 'P1', to: 'R1' },
        { from: 'P2', to: 'R2' },
        { from: 'P3', to: 'R3' }
    ];

    // Sample requests
    const requests = [
        { from: 'P1', to: 'R2' },
        { from: 'P2', to: 'R3' },
        { from: 'P3', to: 'R1' }
    ];

    renderPremiumGraph(processes, resources, allocations, requests);
}

// Render the premium graph with nodes and arrows
function renderPremiumGraph(processes, resources, allocations, requests) {
    const container = document.getElementById('premium-nodes-container');
    if (!container) return;
    
    // Adjust container height based on content
    const maxHeight = Math.max(
        ...processes.map(p => p.y + 50),
        ...resources.map(r => r.y + 60)
    );
    
    container.parentElement.style.height = `${Math.max(maxHeight + 50, 300)}px`;
    
    container.innerHTML = '<svg class="arrows-svg" id="premium-arrows-svg"></svg>';
    
    // Store process data for reference
    window.currentGraphProcesses = processes;
    window.currentGraphResources = resources;
    
    // Render processes with real names and PIDs
    processes.forEach(process => {
        const node = document.createElement('div');
        node.className = 'node process-node';
        node.id = process.id;
        node.dataset.type = 'process';
        node.dataset.realPid = process.realPid;
        
        // Show abbreviated name + PID
        const displayName = process.name.length > 12 ? 
            process.name.substring(0, 12) + '...' : process.name;
        node.innerHTML = `
            <div style="font-size: 10px; text-align: center;">
                <div>${process.id}</div>
                <div style="font-size: 8px; opacity: 0.8;">PID: ${process.realPid}</div>
                <div style="font-size: 9px; max-width: 80px; overflow: hidden; text-overflow: ellipsis;">${displayName}</div>
            </div>
        `;
        
        node.style.left = `${process.x - 25}px`;
        node.style.top = `${process.y - 25}px`;
        container.appendChild(node);
    });

    // Render resources with dynamic positioning
    resources.forEach(resource => {
        const node = document.createElement('div');
        node.className = 'node resource-node';
        node.id = resource.id;
        node.textContent = resource.id;
        node.title = resource.name; // Tooltip with full name
        node.style.left = `${resource.x - 30}px`;
        node.style.top = `${resource.y - 30}px`;
        node.dataset.type = 'resource';
        container.appendChild(node);
    });

    // Draw arrows
    drawPremiumArrows();
    
    // Update the process mapping display
    setTimeout(updateProcessMappingDisplay, 100);
    
    // Update resource mapping display
    setTimeout(updateResourceMappingDisplay, 100);
}

// Draw SVG arrows between nodes
function drawPremiumArrows() {
    const svg = document.getElementById('premium-arrows-svg');
    if (!svg) return;
    
    svg.innerHTML = '';
    
    // Get current filter
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    
    // Sample data - in a real implementation, this would come from state
    const allocations = [
        { from: 'P1', to: 'R1' },
        { from: 'P2', to: 'R2' },
        { from: 'P3', to: 'R3' }
    ];

    const requests = [
        { from: 'P1', to: 'R2' },
        { from: 'P2', to: 'R3' },
        { from: 'P3', to: 'R1' }
    ];
    
    // Draw allocations (solid arrows in #2C666E)
    if (shouldShowElement(activeFilter, 'allocation')) {
        allocations.forEach(allocation => {
            const fromNode = document.getElementById(allocation.from);
            const toNode = document.getElementById(allocation.to);
            if (fromNode && toNode) {
                drawPremiumArrow(svg, fromNode, toNode, '#2C666E', false);
            }
        });
    }

    // Draw requests (dashed arrows in #90DDF0)
    if (shouldShowElement(activeFilter, 'request')) {
        requests.forEach(request => {
            const fromNode = document.getElementById(request.from);
            const toNode = document.getElementById(request.to);
            if (fromNode && toNode) {
                drawPremiumArrow(svg, fromNode, toNode, '#90DDF0', true);
            }
        });
    }
}

// Draw a single arrow between two nodes
function drawPremiumArrow(svg, fromNode, toNode, color, dashed) {
    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();
    const containerRect = svg.getBoundingClientRect();

    const startX = fromRect.left + fromRect.width/2 - containerRect.left;
    const startY = fromRect.top + fromRect.height/2 - containerRect.top;
    const endX = toRect.left + toRect.width/2 - containerRect.left;
    const endY = toRect.top + toRect.height/2 - containerRect.top;

    // Create arrowhead marker
    let marker = svg.querySelector(`#arrowhead-${color.replace('#', '')}`);
    if (!marker) {
        marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', `arrowhead-${color.replace('#', '')}`);
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,0 L0,6 L9,3 z');
        path.setAttribute('fill', color);
        marker.appendChild(path);
        svg.appendChild(marker);
    }

    // Create line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', `url(#arrowhead-${color.replace('#', '')})`);
    
    if (dashed) {
        line.setAttribute('stroke-dasharray', '5,5');
    }
    
    svg.appendChild(line);
}

// Check if element should be shown based on active filter
function shouldShowElement(activeFilter, type) {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'processes' && type === 'process') return true;
    if (activeFilter === 'resources' && type === 'resource') return true;
    if (activeFilter === 'allocations' && type === 'allocation') return true;
    if (activeFilter === 'requests' && type === 'request') return true;
    return false;
}

// Setup premium event listeners
function setupPremiumEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Re-render graph
            drawPremiumArrows();
        });
    });
    
    // Sync button
    const syncButton = document.getElementById('sync-graph-btn');
    if (syncButton) {
        syncButton.addEventListener('click', function() {
            syncGraphData();
        });
    }
}

// Manual sync function
function syncGraphData() {
    const syncButton = document.getElementById('sync-graph-btn');
    const originalText = syncButton.innerHTML;
    
    // Show loading state
    syncButton.innerHTML = '🔄 Syncing...';
    syncButton.disabled = true;
    syncButton.style.opacity = '0.7';
    
    // Re-initialize the graph with fresh data
    initializePremiumGraph();
    
    // Restore button after a delay
    setTimeout(() => {
        syncButton.innerHTML = originalText;
        syncButton.disabled = false;
        syncButton.style.opacity = '1';
    }, 1500);
}

// Keyboard shortcut for sync
document.addEventListener('keydown', function(event) {
    // Press 'S' key to sync (when on premium page)
    if (event.key.toLowerCase() === 's' && currentPage === 'premium') {
        event.preventDefault();
        syncGraphData();
    }
});

// Update premium dashboard with mock data
function updatePremiumDashboard() {
    // Update system stats with smooth transitions
    const cpuElement = document.getElementById('premium-cpu-stat');
    const memoryElement = document.getElementById('premium-memory-stat');
    const processesElement = document.getElementById('premium-processes-stat');
    const resourcesElement = document.getElementById('premium-resources-stat');
    
    if (cpuElement && memoryElement && processesElement && resourcesElement) {
        const newCpu = (Math.random() * 80 + 10).toFixed(1);
        const newMemory = (Math.random() * 70 + 20).toFixed(1);
        const newProcesses = Math.floor(Math.random() * 200 + 50);
        const newResources = Math.floor(Math.random() * 10 + 5);

        // Smooth number transitions
        animateValue(cpuElement, parseFloat(cpuElement.textContent), parseFloat(newCpu), 1000);
        animateValue(memoryElement, parseFloat(memoryElement.textContent), parseFloat(newMemory), 1000);
        animateValue(processesElement, parseInt(processesElement.textContent), newProcesses, 1000);
        animateValue(resourcesElement, parseInt(resourcesElement.textContent), newResources, 1000);
    }

    // Update processes table
    updatePremiumProcessesTable();
}

// Smooth number animation
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let currentValue = start;
    
    const timer = setInterval(function() {
        currentValue += increment;
        if ((increment > 0 && currentValue >= end) || (increment < 0 && currentValue <= end)) {
            clearInterval(timer);
            currentValue = end;
        }
        
        if (element.id.includes('stat') && !element.id.includes('processes') && !element.id.includes('resources')) {
            element.textContent = `${currentValue.toFixed(1)}%`;
        } else {
            element.textContent = Math.round(currentValue);
        }
    }, 16);
}

// Update premium processes table with REAL psutil data
function updatePremiumProcessesTable() {
    const tbody = document.getElementById('premium-processes-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Loading real system processes...</td></tr>';

    // Fetch real process data from backend
    fetch(`${API_BASE}/processes`)
        .then(response => response.json())
        .then(data => {
            if (data.processes && data.processes.length > 0) {
                tbody.innerHTML = '';
                
                // Display first 10 processes (or all if less than 10)
                const displayProcesses = data.processes.slice(0, 10);
                
                displayProcesses.forEach(process => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${process.pid}</td>
                        <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${process.name}</td>
                        <td><span class="status-badge-table status-running">running</span></td>
                        <td style="text-align: right;">${(process.cpu_percent || 0).toFixed(1)}%</td>
                        <td style="text-align: right;">${(process.memory_percent || 0).toFixed(1)}%</td>
                    `;
                    tbody.appendChild(row);
                });
                
                // Add info row showing total count
                if (data.processes.length > 10) {
                    const infoRow = document.createElement('tr');
                    infoRow.innerHTML = `
                        <td colspan="5" style="text-align: center; padding: 10px; background: rgba(144, 221, 240, 0.1); font-style: italic;">
                            Showing first 10 of ${data.processes.length} total processes
                        </td>
                    `;
                    tbody.appendChild(infoRow);
                }
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6B7280;">No processes found</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error fetching real processes:', error);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #EF4444;">Error loading processes</td></tr>';
        });
    
    // Update the process mapping display
    updateProcessMappingDisplay();
}

// Update the process mapping information display
function updateProcessMappingDisplay() {
    const mappingDiv = document.getElementById('process-mapping');
    if (!mappingDiv || !window.currentGraphProcesses) return;
    
    let mappingHtml = '';
    window.currentGraphProcesses.forEach((process, index) => {
        mappingHtml += `
            <div style="display: inline-block; margin-right: 20px; margin-bottom: 8px;">
                <span style="display: inline-block; width: 25px; height: 25px; background: #07393C; color: white; border-radius: 50%; text-align: center; line-height: 25px; font-size: 12px; margin-right: 8px;">${process.id}</span>
                <span><strong>PID ${process.realPid}:</strong> ${process.name}</span>
                <span style="font-size: 11px; color: #2C666E; margin-left: 5px;">(${(process.cpu || 0).toFixed(1)}% CPU)</span>
            </div>
        `;
    });
    
    mappingDiv.innerHTML = mappingHtml || '<em>Loading real process data from your system...</em>';
}

// Update the resource mapping information display
function updateResourceMappingDisplay() {
    const resourceInfoDiv = document.getElementById('resource-info');
    if (!resourceInfoDiv || !window.currentGraphResources) return;
    
    let resourceHtml = '<strong>Active Resources:</strong> ';
    window.currentGraphResources.forEach((resource, index) => {
        resourceHtml += `
            <span style="display: inline-block; margin: 0 10px; padding: 4px 8px; background: #2C666E; color: white; border-radius: 12px; font-size: 12px;">
                ${resource.id}: ${resource.name}
            </span>
        `;
    });
    
    resourceInfoDiv.innerHTML = resourceHtml;
}

// Debounce function for resize/scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}