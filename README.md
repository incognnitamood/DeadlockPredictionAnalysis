# AI-Based Predictive Deadlock Detection and Resource Allocation Graphs (RAG) Visualizer

This project introduces a proactive, machine learning-driven framework for monitoring and predicting unsafe resource allocation states in modern operating systems. By integrating real-time telemetry with graph-based visualization, the system identifies potential deadlocks before they cause system failure.

## 🚀 Overview
Traditional deadlock handling (prevention, avoidance, and detection) is often reactive and rule-based. This system shifts the paradigm toward **predictive monitoring**, using AI to anticipate system instability and performance degradation before a permanent block occurs.

## ✨ Key Features
- **Real-Time Telemetry**: Collects live metrics for CPU utilization, memory usage, disk activity, and process counts.
- **Dynamic RAG Modeling**: Constructs Resource Allocation Graphs to map dependencies between processes and system resources.
- **Predictive AI Classifier**: Uses a **Random Forest** model to categorize system states as **SAFE**, **UNSAFE**, or **DEADLOCK-prone**.
- **Graph Visualization**: Provides an intuitive visual dashboard of resource contention and dependency cycles.
- **Proactive Alerting**: Generates risk assessments to allow for early intervention by system administrators.

## 🛠️ Technology Stack
- **Language**: Python
- **Data Science**: Pandas, NumPy
- **Machine Learning**: Scikit-learn (Random Forest Classifier)
- **Monitoring**: Native OS monitoring utilities
- **Hardware**: Validated across multiple laptop/PC environments

## 📊 Methodology
The system follows a 10-step analytical pipeline:
1.  **Workflow Initiation**: Activation of the monitoring system.
2.  **Data Gathering**: Real-time telemetry collection.
3.  **RAG Creation**: Mapping process-resource dependencies.
4.  **Visualization**: Displaying the graph for administrator analysis.
5.  **Cycle Detection**: Graph traversal to identify circular waits.
6.  **Decision Point**: Branching between cycle-based and predictive analysis.
7.  **AI Analysis**: Applying the ML model to evaluate metrics and temporal trends.
8.  **Risk Assessment**: Quantifying system instability.
9.  **Alerting**: Updating dashboards with predicted risk levels.
10. **Completion**: Finalizing the monitoring cycle.

## 📈 Results
- **Dataset**: Evaluated using **71,996 samples** from real-world telemetry and benchmark data.
- **Findings**: UNSAFE states are characterized by higher variance in CPU/Memory utilization and allocation imbalances, while DEADLOCK-prone states exhibit sustained saturation.
- **Temporal Analysis**: Successfully differentiated between brief workload spikes and true unsafe states using rolling means and variability trends.

