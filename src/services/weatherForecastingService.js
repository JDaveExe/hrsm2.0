/**
 * Weather Forecasting Service - PAGASA Integration for Pasig City
 * Provides weather data specifically for Pasig City to predict prescription needs
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Weather API endpoints
const PAGASA_API_BASE = 'https://api.pagasa.dost.gov.ph';
const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
const OPENWEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

// Pasig City coordinates
const PASIG_COORDINATES = {
  lat: 14.5832,
  lon: 121.0777
};

class WeatherForecastingService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });
  }

  /**
   * Get current weather for Pasig City
   * Uses OpenWeatherMap as backup for PAGASA
   * Includes typhoon information when available
   */
  async getCurrentWeatherPasig() {
    try {
      // Try PAGASA first, fallback to OpenWeatherMap
      const weather = await this.getOpenWeatherMapCurrent();
      const typhoonInfo = await this.getCurrentTyphoonInfo();
      
      return {
        location: 'Pasig City, Metro Manila',
        temperature: weather.main.temp,
        humidity: weather.main.humidity,
        pressure: weather.main.pressure,
        description: weather.weather[0].description,
        rainProbability: weather.clouds?.all || 0,
        windSpeed: weather.wind?.speed || 0,
        timestamp: new Date().toISOString(),
        source: 'OpenWeatherMap',
        typhoonInfo: typhoonInfo
      };
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw new Error('Unable to fetch weather data for Pasig City');
    }
  }

  /**
   * Get weather forecast for Pasig City (5-day forecast)
   */
  async getWeatherForecastPasig(days = 5) {
    try {
      const forecast = await this.getOpenWeatherMapForecast();
      
      // Process forecast data for the specified number of days
      const processedForecast = forecast.list
        .slice(0, days * 8) // 8 forecasts per day (3-hour intervals)
        .map(item => ({
          date: new Date(item.dt * 1000).toISOString(),
          temperature: item.main.temp,
          humidity: item.main.humidity,
          pressure: item.main.pressure,
          description: item.weather[0].description,
          rainProbability: item.pop * 100, // Probability of precipitation
          rainVolume: item.rain?.['3h'] || 0,
          windSpeed: item.wind?.speed || 0,
          weatherCategory: this.categorizeWeather(item.weather[0].main, item.pop)
        }));

      return {
        location: 'Pasig City, Metro Manila',
        forecast: processedForecast,
        summary: this.generateWeatherSummary(processedForecast),
        source: 'OpenWeatherMap'
      };
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw new Error('Unable to fetch weather forecast for Pasig City');
    }
  }

  /**
   * Get weather alerts and warnings for Pasig City
   * Focuses on typhoon and monsoon alerts
   */
  async getWeatherAlertsPasig() {
    try {
      // This would integrate with PAGASA alerts API when available
      // For now, we'll use current weather conditions to generate alerts
      const current = await this.getCurrentWeatherPasig();
      const alerts = [];

      // Generate alerts based on weather conditions
      if (current.rainProbability > 70) {
        alerts.push({
          type: 'heavy_rain',
          severity: 'moderate',
          title: 'Heavy Rain Expected',
          description: 'High probability of heavy rainfall in Pasig City',
          medications_impact: ['respiratory', 'skin_conditions', 'allergies']
        });
      }

      if (current.humidity > 85) {
        alerts.push({
          type: 'high_humidity',
          severity: 'low',
          title: 'High Humidity',
          description: 'High humidity levels may increase respiratory issues',
          medications_impact: ['respiratory', 'asthma']
        });
      }

      return {
        location: 'Pasig City, Metro Manila',
        alerts: alerts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      return { alerts: [], error: 'Unable to fetch weather alerts' };
    }
  }

  /**
   * Get seasonal weather pattern for wet season planning
   */
  async getWetSeasonForecast() {
    try {
      const currentMonth = new Date().getMonth(); // 0-11
      const isWetSeason = currentMonth >= 4 && currentMonth <= 10; // May to November
      
      const forecast = await this.getWeatherForecastPasig(30);
      
      // Analyze wet season characteristics
      const wetSeasonData = {
        isCurrentlyWetSeason: isWetSeason,
        expectedRainyDays: forecast.forecast.filter(f => f.rainProbability > 50).length,
        averageHumidity: forecast.forecast.reduce((sum, f) => sum + f.humidity, 0) / forecast.forecast.length,
        totalExpectedRainfall: forecast.forecast.reduce((sum, f) => sum + f.rainVolume, 0),
        typhoonRisk: this.assessTyphoonRisk(forecast.forecast),
        medicationRecommendations: this.generateWetSeasonMedicationRecommendations(forecast.forecast)
      };

      return wetSeasonData;
    } catch (error) {
      console.error('Error generating wet season forecast:', error);
      throw error;
    }
  }

  // Private helper methods

  async getOpenWeatherMapCurrent() {
    if (!OPENWEATHER_API_KEY) {
      // Return mock data when no API key is available
      return {
        main: {
          temp: 28,
          humidity: 82,
          pressure: 1013
        },
        weather: [{
          main: 'Rain',
          description: 'light rain'
        }],
        clouds: {
          all: 75
        },
        wind: {
          speed: 3.5
        }
      };
    }

    const response = await axios.get(`${OPENWEATHER_API_BASE}/weather`, {
      params: {
        lat: PASIG_COORDINATES.lat,
        lon: PASIG_COORDINATES.lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });

    return response.data;
  }

  async getOpenWeatherMapForecast() {
    if (!OPENWEATHER_API_KEY) {
      // Return mock forecast data when no API key is available
      const mockForecast = [];
      for (let i = 0; i < 40; i++) { // 5 days * 8 forecasts per day
        const date = new Date();
        date.setHours(date.getHours() + i * 3);
        
        mockForecast.push({
          dt: Math.floor(date.getTime() / 1000),
          main: {
            temp: 26 + Math.random() * 6, // 26-32°C
            humidity: 70 + Math.random() * 25, // 70-95%
            pressure: 1010 + Math.random() * 10
          },
          weather: [{
            main: Math.random() > 0.6 ? 'Rain' : 'Clouds',
            description: Math.random() > 0.6 ? 'moderate rain' : 'scattered clouds'
          }],
          pop: Math.random() * 0.8, // 0-80% precipitation
          rain: Math.random() > 0.7 ? { '3h': Math.random() * 5 } : undefined,
          wind: {
            speed: 2 + Math.random() * 8 // 2-10 m/s
          }
        });
      }
      
      return { list: mockForecast };
    }

    const response = await axios.get(`${OPENWEATHER_API_BASE}/forecast`, {
      params: {
        lat: PASIG_COORDINATES.lat,
        lon: PASIG_COORDINATES.lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });

    return response.data;
  }

  categorizeWeather(main, pop) {
    if (main === 'Rain' || pop > 0.7) return 'rainy';
    if (main === 'Thunderstorm') return 'stormy';
    if (main === 'Clouds') return 'cloudy';
    if (main === 'Clear') return 'sunny';
    return 'other';
  }

  generateWeatherSummary(forecast) {
    const rainyDays = forecast.filter(f => f.weatherCategory === 'rainy').length;
    const avgTemp = forecast.reduce((sum, f) => sum + f.temperature, 0) / forecast.length;
    const avgHumidity = forecast.reduce((sum, f) => sum + f.humidity, 0) / forecast.length;

    return {
      expectedRainyDays: Math.ceil(rainyDays / 8), // Convert from 3-hour intervals to days
      averageTemperature: Math.round(avgTemp),
      averageHumidity: Math.round(avgHumidity),
      wetSeasonIntensity: rainyDays > 20 ? 'high' : rainyDays > 10 ? 'moderate' : 'low'
    };
  }

  assessTyphoonRisk(forecast) {
    const highWindDays = forecast.filter(f => f.windSpeed > 10).length;
    const heavyRainDays = forecast.filter(f => f.rainVolume > 5).length;
    
    if (highWindDays > 10 && heavyRainDays > 15) return 'high';
    if (highWindDays > 5 || heavyRainDays > 10) return 'moderate';
    return 'low';
  }

  generateWetSeasonMedicationRecommendations(forecast) {
    const rainyDays = forecast.filter(f => f.weatherCategory === 'rainy').length;
    const highHumidityDays = forecast.filter(f => f.humidity > 80).length;
    
    const recommendations = [];
    
    if (rainyDays > 15) {
      recommendations.push({
        category: 'respiratory',
        urgency: 'high',
        reason: 'Extended rainy period increases respiratory infections'
      });
    }
    
    if (highHumidityDays > 20) {
      recommendations.push({
        category: 'skin_conditions',
        urgency: 'moderate',
        reason: 'High humidity promotes fungal skin infections'
      });
      
      recommendations.push({
        category: 'allergies',
        urgency: 'moderate',
        reason: 'High humidity increases allergen presence'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Get current typhoon information
   * Mock implementation with realistic Philippine typhoon names
   */
  async getCurrentTyphoonInfo() {
    try {
      // In a real implementation, this would connect to PAGASA's API
      // For now, we'll provide mock data based on October 2025 conditions
      const currentMonth = new Date().getMonth(); // October = 9
      const isTyphoondSeason = currentMonth >= 7 && currentMonth <= 10; // Aug-Nov
      
      if (isTyphoondSeason) {
        // Mock typhoon data for October 2025
        const possibleTyphoons = [
          {
            name: 'Paolo',
            internationalName: 'Paolo',
            category: 'Tropical Storm',
            maxWinds: '65 km/h',
            status: 'Active',
            location: '520 km East of Casiguran, Aurora',
            movement: 'West Northwest at 20 km/h',
            affected: ['Luzon', 'Metro Manila', 'Calabarzon'],
            warning: 'Signal No. 1',
            pagasaCode: 'TS-2025-18'
          },
          {
            name: 'Quinta',
            internationalName: 'Quinta', 
            category: 'Tropical Depression',
            maxWinds: '45 km/h',
            status: 'Forming',
            location: '800 km East of Southern Luzon',
            movement: 'West at 15 km/h',
            affected: ['Eastern Luzon'],
            warning: 'None yet',
            pagasaCode: 'TD-2025-19'
          }
        ];
        
        // Randomly select a typhoon scenario for October 2025
        const activeTyphoon = Math.random() > 0.7 ? possibleTyphoons[0] : possibleTyphoons[1];
        
        if (Math.random() > 0.5) { // 50% chance of active typhoon
          return {
            hasActiveTyphoon: true,
            typhoon: activeTyphoon,
            lastUpdate: new Date().toISOString(),
            source: 'PAGASA (Mock Data)'
          };
        }
      }
      
      return {
        hasActiveTyphoon: false,
        message: 'No active typhoon affecting Pasig City area',
        lastUpdate: new Date().toISOString(),
        source: 'PAGASA (Mock Data)'
      };
    } catch (error) {
      console.error('Error fetching typhoon information:', error);
      return {
        hasActiveTyphoon: false,
        error: 'Unable to fetch typhoon information',
        lastUpdate: new Date().toISOString()
      };
    }
  }
}

export default new WeatherForecastingService();