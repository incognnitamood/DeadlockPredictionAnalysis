import joblib

# Load the model
model = joblib.load('rf_model_live.joblib')
print(f"Model expects {model.n_features_in_} features")

# Check what features the model was trained on by looking at a sample prediction
import pandas as pd
sample_data = pd.DataFrame([{
    'num_processes': 100,
    'cpu_percent': 50.0,
    'memory_percent': 60.0,
    'disk_percent': 40.0,
    'total_allocated': 110.0,
    'total_need': 90.0,
    'deadlock_risk': 0.55
}])

print("Trying prediction with 7 features...")
try:
    result = model.predict(sample_data)
    print("Success with 7 features!")
    print("Features used:", list(sample_data.columns))
except Exception as e:
    print("Error with 7 features:", str(e))
    
    # Try with 6 features - remove one to see which works
    print("\nTrying with 6 features...")
    for i, col in enumerate(sample_data.columns):
        test_data = sample_data.drop(columns=[col])
        try:
            result = model.predict(test_data)
            print(f"Success! Model works without '{col}' column")
            print("Features used:", list(test_data.columns))
            break
        except Exception as e2:
            print(f"Failed without '{col}': {str(e2)[:50]}...")