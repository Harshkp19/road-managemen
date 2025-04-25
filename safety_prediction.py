import numpy as np
import pandas as pd
import pickle
import os
import logging
from typing import Tuple, List, Dict, Any, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

class RoadSafetyPredictor:
    """
    A class to predict road safety risks using machine learning models
    """
    
    def __init__(self, model_path: str = "model/safety_model.pkl"):
        """
        Initialize the road safety predictor
        
        Args:
            model_path: Path to the saved model file
        """
        self.model_path = model_path
        self.model = None
        self.scaler = None
        self.feature_names = [
            'traffic_volume', 'speed_variance', 'weather_condition', 
            'time_of_day', 'road_condition', 'junction_complexity'
        ]
    
    def load_model(self) -> None:
        """
        Load the trained model from disk
        
        Raises:
            FileNotFoundError: If the model file doesn't exist
        """
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    saved_data = pickle.load(f)
                    self.model = saved_data['model']
                    self.scaler = saved_data.get('scaler')
                    logging.info(f"Model loaded successfully from {self.model_path}")
            else:
                # If model doesn't exist, create a simple default model
                logging.warning("Model file not found. Creating a default model.")
                self._create_default_model()
        except Exception as e:
            logging.error(f"Error loading model: {str(e)}")
            raise
    
    def _create_default_model(self) -> None:
        """
        Create a simple default model when no trained model is available
        """
        # Create a simple random forest classifier
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
        
        # Create a simple dataset for training
        np.random.seed(42)
        n_samples = 1000
        
        # Generate synthetic data
        X = pd.DataFrame({
            'traffic_volume': np.random.normal(500, 200, n_samples),
            'speed_variance': np.random.normal(10, 5, n_samples),
            'weather_condition': np.random.randint(0, 5, n_samples),
            'time_of_day': np.random.randint(0, 4, n_samples),
            'road_condition': np.random.randint(0, 4, n_samples),
            'junction_complexity': np.random.randint(1, 11, n_samples)
        })
        
        # Generate synthetic labels (0: low risk, 1: medium risk, 2: high risk)
        # Higher traffic, higher variance, worse weather, and higher complexity increase risk
        risk_score = (
            (X['traffic_volume'] / 1000) + 
            (X['speed_variance'] / 10) + 
            (X['weather_condition'] / 2) + 
            (X['road_condition']) + 
            (X['junction_complexity'] / 5)
        )
        
        y = np.zeros(n_samples, dtype=int)
        y[risk_score > 2] = 1  # Medium risk
        y[risk_score > 3.5] = 2  # High risk
        
        # Create and fit scaler
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Train the model
        self.model.fit(X_scaled, y)
        
        # Save the model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        with open(self.model_path, 'wb') as f:
            pickle.dump({'model': self.model, 'scaler': self.scaler}, f)
        
        logging.info("Default model created and saved")
    
    def predict(self, features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make safety risk predictions for junction features
        
        Args:
            features: DataFrame with junction features
            
        Returns:
            Tuple of (predictions, probabilities)
            
        Raises:
            ValueError: If the model is not loaded or features are invalid
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        if features.empty:
            raise ValueError("Features DataFrame is empty")
        
        try:
            # Ensure all required features are present
            for feature in self.feature_names:
                if feature not in features.columns:
                    raise ValueError(f"Required feature '{feature}' is missing")
            
            # Extract only the features used by the model
            X = features[self.feature_names].copy()
            
            # Scale features if a scaler is available
            if self.scaler:
                X_scaled = self.scaler.transform(X)
            else:
                X_scaled = X
            
            # Make predictions
            predictions = self.model.predict(X_scaled)
            probabilities = self.model.predict_proba(X_scaled)
            
            return predictions, probabilities
            
        except Exception as e:
            logging.error(f"Error making predictions: {str(e)}")
            raise
    
    def train(self, X: pd.DataFrame, y: np.ndarray) -> Dict[str, float]:
        """
        Train a new safety prediction model
        
        Args:
            X: Feature DataFrame
            y: Target labels (0: low risk, 1: medium risk, 2: high risk)
            
        Returns:
            Dictionary with training metrics
            
        Raises:
            ValueError: If input data is invalid
        """
        if X.empty or len(y) == 0:
            raise ValueError("Training data is empty")
        
        if len(X) != len(y):
            raise ValueError("Features and labels must have the same length")
        
        try:
            # Create and fit scaler
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)
            
            # Create and train the model
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            
            self.model.fit(X_scaled, y)
            
            # Save the model
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            with open(self.model_path, 'wb') as f:
                pickle.dump({'model': self.model, 'scaler': self.scaler}, f)
            
            # Calculate training metrics
            train_accuracy = self.model.score(X_scaled, y)
            
            return {
                "accuracy": train_accuracy,
                "model_path": self.model_path,
                "n_samples": len(X)
            }
            
        except Exception as e:
            logging.error(f"Error training model: {str(e)}")
            raise
