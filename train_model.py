import pandas as pd
import numpy as np
import argparse
import logging
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from safety_prediction import RoadSafetyPredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def load_data(data_path):
    """
    Load training data from CSV file
    """
    try:
        df = pd.read_csv(data_path)
        logging.info(f"Loaded {len(df)} records from {data_path}")
        return df
    except Exception as e:
        logging.error(f"Error loading data: {str(e)}")
        raise

def preprocess_data(df):
    """
    Preprocess the data for training
    """
    # Check for required columns
    required_columns = [
        'traffic_volume', 'speed_variance', 'weather_condition', 
        'time_of_day', 'road_condition', 'junction_complexity', 'risk_level'
    ]
    
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")
    
    # Handle missing values
    for col in required_columns[:-1]:  # All except target
        if df[col].isnull().sum() > 0:
            if df[col].dtype == 'object':
                df[col].fillna('unknown', inplace=True)
            else:
                df[col].fillna(df[col].median(), inplace=True)
    
    # Drop rows with missing target
    if df['risk_level'].isnull().sum() > 0:
        df = df.dropna(subset=['risk_level'])
    
    # Extract features and target
    X = df[required_columns[:-1]]
    y = df['risk_level'].astype(int)
    
    return X, y

def main():
    parser = argparse.ArgumentParser(description='Train road safety prediction model')
    parser.add_argument('--data', type=str, required=True, help='Path to training data CSV')
    parser.add_argument('--output', type=str, default='model/safety_model.pkl', help='Path to save model')
    parser.add_argument('--test-size', type=float, default=0.2, help='Test set size for validation')
    
    args = parser.parse_args()
    
    try:
        # Load and preprocess data
        df = load_data(args.data)
        X, y = preprocess_data(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=args.test_size, random_state=42, stratify=y
        )
        
        logging.info(f"Training set: {len(X_train)} samples")
        logging.info(f"Test set: {len(X_test)} samples")
        
        # Initialize and train model
        predictor = RoadSafetyPredictor(model_path=args.output)
        metrics = predictor.train(X_train, y_train)
        
        logging.info(f"Model trained successfully. Training accuracy: {metrics['accuracy']:.4f}")
        
        # Evaluate on test set
        predictor.load_model()
        predictions, _ = predictor.predict(X_test)
        test_accuracy = accuracy_score(y_test, predictions)
        
        logging.info(f"Test accuracy: {test_accuracy:.4f}")
        logging.info("\nClassification Report:")
        logging.info(classification_report(y_test, predictions))
        
        logging.info(f"Model saved to {args.output}")
        
    except Exception as e:
        logging.error(f"Error training model: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
