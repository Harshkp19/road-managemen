import requests
import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

class TomTomDataFetcher:
    """
    A class to fetch and process traffic data from TomTom API
    """
    
    def __init__(self, api_key: str):
        """
        Initialize the TomTom data fetcher with API key
        
        Args:
            api_key: TomTom API key
        """
        self.api_key = api_key
        self.base_url = "https://api.tomtom.com"
        
    def get_traffic_flow(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Get traffic flow data for a specific location
        
        Args:
            latitude: Latitude of the location
            longitude: Longitude of the location
            
        Returns:
            Dictionary containing traffic flow data
        """
        try:
            url = f"{self.base_url}/traffic/services/4/flowSegmentData/absolute/10/json"
            params = {
                "key": self.api_key,
                "point": f"{latitude},{longitude}"
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
        except Exception as e:
            logging.error(f"Error fetching traffic flow data: {str(e)}")
            return {}
            
    def get_incidents(self, latitude: float, longitude: float, radius: int = 1000) -> Dict[str, Any]:
        """
        Get traffic incidents around a specific location
        
        Args:
            latitude: Latitude of the location
            longitude: Longitude of the location
            radius: Radius in meters to search for incidents (default: 1000)
            
        Returns:
            Dictionary containing traffic incidents data
        """
        try:
            url = f"{self.base_url}/traffic/services/5/incidentDetails"
            params = {
                "key": self.api_key,
                "point": f"{latitude},{longitude}",
                "radius": radius,
                "fields": "{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}"
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
        except Exception as e:
            logging.error(f"Error fetching traffic incidents: {str(e)}")
            return {}
    
    def get_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Get weather data for a specific location
        
        Args:
            latitude: Latitude of the location
            longitude: Longitude of the location
            
        Returns:
            Dictionary containing weather data
        """
        try:
            # Note: TomTom doesn't have a weather API, so we'd typically use a different service
            # For this example, we'll return mock weather data
            weather_conditions = ["clear", "cloudy", "rain", "snow", "fog"]
            road_conditions = ["dry", "wet", "icy", "snowy"]
            
            # Generate deterministic but varied weather based on location and time
            seed = int(latitude * 1000 + longitude * 1000 + datetime.now().hour)
            np.random.seed(seed)
            
            return {
                "temperature": round(np.random.normal(15, 10), 1),  # Mean 15°C, std 10°C
                "precipitation": max(0, round(np.random.exponential(2), 1)),  # mm/h
                "wind_speed": max(0, round(np.random.normal(10, 5), 1)),  # km/h
                "visibility": min(10, max(0, round(np.random.normal(8, 3), 1))),  # km
                "weather_condition": np.random.choice(weather_conditions, p=[0.4, 0.3, 0.2, 0.05, 0.05]),
                "road_condition": np.random.choice(road_conditions, p=[0.6, 0.3, 0.05, 0.05])
            }
        except Exception as e:
            logging.error(f"Error generating weather data: {str(e)}")
            return {}
    
    def prepare_junction_data(self, junctions: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Prepare junction data for ML model by fetching traffic and weather data
        
        Args:
            junctions: List of junction dictionaries with id, name, latitude, longitude
            
        Returns:
            DataFrame with features for ML model
        """
        data = []
        
        for junction in junctions:
            try:
                junction_id = junction.get("id")
                latitude = junction.get("latitude")
                longitude = junction.get("longitude")
                complexity = junction.get("complexity", 5)  # Default complexity if not provided
                
                # Get traffic flow data
                flow_data = self.get_traffic_flow(latitude, longitude)
                
                # Get incidents data
                incidents_data = self.get_incidents(latitude, longitude)
                
                # Get weather data
                weather_data = self.get_weather(latitude, longitude)
                
                # Extract relevant features
                current_hour = datetime.now().hour
                
                # Traffic volume (vehicles per hour) - estimated from flow data or default
                traffic_volume = 500
                if flow_data and "flowSegmentData" in flow_data:
                    segment = flow_data["flowSegmentData"]
                    free_flow_speed = segment.get("freeFlowSpeed", 50)
                    current_speed = segment.get("currentSpeed", free_flow_speed)
                    
                    # Estimate volume based on speed ratio and road type
                    speed_ratio = current_speed / free_flow_speed if free_flow_speed > 0 else 1
                    base_volume = 1000 if free_flow_speed > 80 else 500
                    
                    # Adjust for time of day
                    time_factor = 1.5 if (current_hour >= 7 and current_hour <= 9) or (current_hour >= 16 and current_hour <= 18) else 1.0
                    if current_hour >= 22 or current_hour <= 5:
                        time_factor = 0.3
                        
                    traffic_volume = int(base_volume * time_factor * speed_ratio)
                
                # Speed variance (km/h) - estimated from flow data or default
                speed_variance = 5
                if flow_data and "flowSegmentData" in flow_data:
                    segment = flow_data["flowSegmentData"]
                    free_flow_speed = segment.get("freeFlowSpeed", 50)
                    current_speed = segment.get("currentSpeed", free_flow_speed)
                    
                    # Calculate variance based on difference from free flow
                    speed_diff = abs(free_flow_speed - current_speed)
                    speed_variance = max(5, min(30, speed_diff * 2))
                
                # Weather condition (encoded) - from weather data
                weather_condition_map = {
                    "clear": 0,
                    "cloudy": 1,
                    "rain": 2,
                    "snow": 3,
                    "fog": 4
                }
                weather_condition = weather_condition_map.get(weather_data.get("weather_condition", "clear"), 0)
                
                # Time of day (encoded: morning peak=0, day=1, evening peak=2, night=3)
                if 7 <= current_hour <= 9:
                    time_of_day = 0  # Morning peak
                elif 16 <= current_hour <= 18:
                    time_of_day = 2  # Evening peak
                elif 22 <= current_hour or current_hour <= 5:
                    time_of_day = 3  # Night
                else:
                    time_of_day = 1  # Day
                
                # Road condition (encoded) - from weather data
                road_condition_map = {
                    "dry": 0,
                    "wet": 1,
                    "icy": 2,
                    "snowy": 3
                }
                road_condition = road_condition_map.get(weather_data.get("road_condition", "dry"), 0)
                
                # Junction complexity (1-10) - from junction data or default
                junction_complexity = complexity
                
                # Count incidents
                incident_count = 0
                if incidents_data and "incidents" in incidents_data:
                    incident_count = len(incidents_data["incidents"])
                
                # Create row
                row = {
                    "junction_id": junction_id,
                    "traffic_volume": traffic_volume,
                    "speed_variance": speed_variance,
                    "weather_condition": weather_condition,
                    "time_of_day": time_of_day,
                    "road_condition": road_condition,
                    "junction_complexity": junction_complexity,
                    "incident_count": incident_count,
                    "latitude": latitude,
                    "longitude": longitude
                }
                
                data.append(row)
                
            except Exception as e:
                logging.error(f"Error processing junction {junction.get('id')}: {str(e)}")
        
        # Create DataFrame
        if data:
            return pd.DataFrame(data)
        else:
            return pd.DataFrame()
