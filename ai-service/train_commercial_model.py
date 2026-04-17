"""
Commercial Model Trainer 📈

This script reads the real-world agricultural dataset (`indian_crop_disease_dataset.csv`),
trains a high-accuracy Random Forest classifier, and exports it for production use in AgriShield.
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

def main():
    print("Loading Indian Crop Dataset...")
    try:
        df = pd.read_csv("indian_crop_disease_dataset.csv")
    except FileNotFoundError:
        print("Error: indian_crop_disease_dataset.csv not found!")
        return

    # Check for missing values and drop them (Standard preprocessing)
    df = df.dropna()

    # Features and Labels mapping
    feature_cols = [
        "temperature", "humidity", "rainfall",
        "soil_moisture", "plant_age_days", "light_intensity"
    ]
    
    X_numerical = df[feature_cols].values
    
    print("Encoding Crop Types...")
    crop_encoder = LabelEncoder()
    # Add 'unknown' to classes so the encoder can handle random web inputs later
    all_crops = df["crop_type"].unique().tolist() + ["unknown"]
    crop_encoder.fit(all_crops)
    
    encoded_crops = crop_encoder.transform(df["crop_type"].values)
    
    # Final Feature Matrix: Append the encoded crop type to the rest of the features
    X = np.column_stack((X_numerical, encoded_crops))
    y = df["risk_level"].values

    print("Splitting into Training and Validation sets (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Real-World Random Forest Model (This will take a few seconds)...")
    model = RandomForestClassifier(
        n_estimators=200,      # More trees for a commercial dataset
        max_depth=16,          # Allow deeper intelligence patterns
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1              # Use all CPU cores
    )
    
    model.fit(X_train, y_train)
    
    print("Evaluating Model Accuracy on Unseen Data...")
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print(f"\nFinal Validation Accuracy: {acc * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Exporting for Production
    model_path = "pest_rf_model_v3.pkl"
    encoder_path = "pest_crop_encoder_v3.pkl"
    
    print(f"Exporting Commercial Model to {model_path} ...")
    joblib.dump(model, model_path)
    joblib.dump(crop_encoder, encoder_path)
    
    print("Optimization Complete! AgriShield is Commercial-Ready.")

if __name__ == "__main__":
    main()
