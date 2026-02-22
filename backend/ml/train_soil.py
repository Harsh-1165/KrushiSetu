import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "dataset1.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_SAVE_PATH = os.path.join(MODEL_DIR, "soil_model.pkl")

# Ensure model directory exists
if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

def train_soil_model():
    print("🌾 Loading Soil Dataset...")
    if not os.path.exists(DATASET_PATH):
        print(f"❌ Error: Dataset not found at {DATASET_PATH}")
        return

    # Load Data
    df = pd.read_csv(DATASET_PATH)
    
    # Features and Target
    # Features: N, P, K, pH, EC, OC, S, Zn, Fe, Cu, Mn, B
    X = df[['N', 'P', 'K', 'pH', 'EC', 'OC', 'S', 'Zn', 'Fe', 'Cu', 'Mn', 'B']]
    y = df['Output']

    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Initialize and Train Classifier
    print("🧠 Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate
    accuracy = model.score(X_test, y_test)
    print(f"✅ Model Trained! Accuracy: {accuracy * 100:.2f}%")

    # Save Model
    with open(MODEL_SAVE_PATH, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"💾 Model saved to {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    train_soil_model()
