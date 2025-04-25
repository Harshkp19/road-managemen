import pandas as pd
import numpy as np
import argparse
import os
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def generate_sample_data(n_samples=1000, output_path='data/sample_data.csv'):
    """
    Generate synthetic data for training the road safety model
    """
    np.random.seed(42)
    
    # Generate junction IDs
    junction_ids = [f"j{i}" for i in range(1, n_samples + 1)]
    
    # Generate features
    traffic_volume = np.random.normal(500, 200, n_samples)
    traffic_volume = np.clip(traffic_volume, 50, 2000).astype(int)
    
    speed_variance = np.random.normal(10, 5, n_samples)
    speed_variance = np.clip(speed_variance, 1, 30).astype(int)
    
    weather_condition = np.random.randint(0, 5, n_samples)  # 0: clear, 1: cloudy, 2: rain, 3: snow, 4: fog
    
    time_of_day = np.random.randint(0, 4, n_samples)  # 0: morning peak, 1: day, 2: evening peak, 3: night
    
    road_condition = np.random.randint(0, 4, n_samples)  # 0: dry, 1: wet, 2: icy, 3: snowy
    
    junction_complexity = np.random.randint(1, 11, n_samples)  # 1-10 scale
    
    incident_count = np.random.poisson(2, n_samples)
    incident_count = np.clip(incident_count, 0, 20).astype(int)
    
    # Generate coordinates (centered around London)
    latitude = np.random.normal(51.5074, 0.1, n_samples)
    longitude = np.random.normal(-0.1278, 0.1, n_samples)
    
    # Generate risk level based on features
    # Higher traffic, higher variance, worse weather, and higher complexity increase risk
    risk_score = (
        (traffic_volume / 1000) + 
        (speed_variance / 10) + 
        (weather_condition / 2) + 
        (road_condition) + 
        (junction_complexity / 5) +
        (incident_count / 10)
    )
    
    risk_level = np.zeros(n_samples, dtype=int)
    risk_level[risk_score > 2] = 1  # Medium risk
    risk_level[risk_score > 3.5] = 2  # High risk
    
    # Create DataFrame
    df = pd.DataFrame({
        'junction_id': junction_ids,
        'traffic_volume': traffic_volume,
        'speed_variance': speed_variance,
        'weather_condition': weather_condition,
        'time_of_day': time_of_day,
        'road_condition': road_condition,
        'junction_complexity': junction_complexity,
        'incident_count': incident_count,
        'latitude': latitude,
        'longitude': longitude,
        'risk_level': risk_level
    })
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Save to CSV
    df.to_csv(output_path, index=False)
    logging.info(f"Generated {n_samples} samples and saved to {output_path}")
    
    # Print distribution of risk levels
    risk_counts = df['risk_level'].value_counts().sort_index()
    for level, count in risk_counts.items():
        percentage = (count / n_samples) * 100
        logging.info(f"Risk level {level}: {count} samples ({percentage:.1f}%)")
    
    return df

def main():
    parser = argparse.ArgumentParser(description='Generate sample data for road safety prediction')
    parser.add_argument('--samples', type=int, default=1000, help='Number of samples to generate')
    parser.add_argument('--output', type=str, default='data/sample_data.csv', help='Output file path')
    
    args = parser.parse_args()
    
    try:
        generate_sample_data(args.samples, args.output)
    except Exception as e:
        logging.error(f"Error generating sample data: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
