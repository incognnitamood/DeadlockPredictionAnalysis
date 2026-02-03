import joblib
import pandas as pd

# Load model
model = joblib.load('rf_model_live.joblib')
print('Model features:', model.feature_names_in_ if hasattr(model, 'feature_names_in_') else 'No feature names')

# Test different scenarios
test_cases = [
    [[2, 50, 60, 40, 110, 90]],  # 2 processes, moderate resources
    [[2, 30, 40, 20, 70, 130]],  # 2 processes, low resources  
    [[3, 80, 90, 60, 170, 30]],  # 3 processes, high resources
    [[1, 90, 95, 80, 185, 15]],  # 1 process, very high resources
    [[5, 20, 25, 15, 45, 155]],  # 5 processes, low resources
]

print("\nTesting different feature combinations:")
for i, case in enumerate(test_cases):
    features = case[0]
    print(f'\nTest {i+1}: {features}')
    print(f'Features meaning: [num_processes, cpu_percent, memory_percent, disk_percent, total_allocated, total_need]')
    
    pred = model.predict(case)
    probs = model.predict_proba(case)
    
    print(f'Prediction: {pred[0]}')
    print(f'Probabilities: SAFE={probs[0][1]*100:.1f}%, UNSAFE={probs[0][2]*100:.1f}%, DEADLOCK={probs[0][0]*100:.1f}%')