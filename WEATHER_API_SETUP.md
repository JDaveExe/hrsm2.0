# Weather API Setup Guide for HRSM Healthcare System

This guide will help you set up real weather data sources for the healthcare system's forecasting features.

## 🌤️ Recommended Weather APIs for Philippines

### 1. PAGASA (Primary - Official Philippine Weather Bureau)
**Status**: Official government source
**Coverage**: Philippines-specific, most accurate for local conditions
**Cost**: Free for basic usage

**Setup Steps**:
1. Visit PAGASA official website: https://pagasa.dost.gov.ph/
2. Look for "API Services" or "Data Services" section
3. Register for an API key (may require business verification)
4. Add to your `.env` file:
   ```
   REACT_APP_PAGASA_API_KEY=your_pagasa_api_key_here
   ```

**Note**: PAGASA API endpoints may vary. Check their current documentation.

### 2. WeatherAPI.com (Recommended Backup)
**Status**: Reliable commercial service with good Philippines coverage
**Coverage**: Global, good for Philippines
**Cost**: Free tier available (1,000 calls/month), paid plans from $4/month

**Setup Steps**:
1. Visit: https://www.weatherapi.com/
2. Sign up for free account
3. Get your API key from dashboard
4. Add to your `.env` file:
   ```
   REACT_APP_WEATHER_API_KEY=your_weatherapi_key_here
   ```

### 3. OpenWeatherMap (Final Backup)
**Status**: Popular commercial weather service
**Coverage**: Global coverage
**Cost**: Free tier (1,000 calls/day), paid plans from $40/month

**Setup Steps**:
1. Visit: https://openweathermap.org/api
2. Sign up and get API key
3. Add to your `.env` file:
   ```
   REACT_APP_OPENWEATHER_API_KEY=your_openweather_key_here
   ```

## 🔧 Environment Configuration

Create or update your `.env` file in the project root:

```bash
# Weather API Keys (add the ones you have)
REACT_APP_PAGASA_API_KEY=your_pagasa_key_here
REACT_APP_WEATHER_API_KEY=your_weatherapi_key_here  
REACT_APP_OPENWEATHER_API_KEY=your_openweather_key_here

# API Base URL
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚀 Quick Start (Free Option)

**For immediate testing, get a free WeatherAPI.com key**:

1. Go to https://www.weatherapi.com/signup.aspx
2. Sign up with email
3. Verify your email
4. Copy your API key from the dashboard
5. Add it to `.env`:
   ```
   REACT_APP_WEATHER_API_KEY=your_free_key_here
   ```
6. Restart your React development server

## 📊 API Call Limits & Caching

The system is designed to minimize API calls:
- **Cache Duration**: 3 hours for real data
- **Expected Usage**: ~8 calls per day per API
- **Fallback System**: Automatically tries multiple sources
- **Total Monthly Calls**: ~240 calls (well within free tiers)

## 🔄 How the Fallback System Works

1. **Primary**: Tries PAGASA first (most accurate for Philippines)
2. **Secondary**: Falls back to WeatherAPI.com
3. **Tertiary**: Final fallback to OpenWeatherMap
4. **Emergency**: Smart mock data if all APIs fail

## 🌍 Philippines-Specific Features

When using real APIs, you'll get:
- ✅ **Accurate tropical weather patterns**
- ✅ **Typhoon tracking and alerts**
- ✅ **Monsoon season predictions**
- ✅ **Regional weather variations**
- ✅ **Health-relevant metrics** (humidity, heat index, UV)

## 🏥 Healthcare Integration

The weather data enhances healthcare planning by:
- **Medication Demand Forecasting**: Rain → more antibiotics needed
- **Seasonal Health Alerts**: Heat waves, dengue season warnings  
- **Resource Planning**: Storm preparation, typhoon response
- **Patient Care**: Weather-sensitive condition monitoring

## 🔧 Testing Your Setup

After adding API keys, test by:
1. Opening the Admin Dashboard
2. Going to Analytics → Weather-Based Prescriptions  
3. Check the browser console for logs
4. Look for "Data Source: PAGASA" or similar in the weather widget

## 🆘 Troubleshooting

**Common Issues**:
- **"API key not configured"**: Check your `.env` file and restart server
- **"CORS errors"**: Some APIs may need backend proxy setup
- **"Rate limit exceeded"**: You've hit the free tier limit, wait or upgrade
- **"Network errors"**: Check internet connection, API status pages

**Debug Logs**:
The system provides detailed logs in browser console:
```
✅ Weather data from PAGASA successfully loaded
⚠️  PAGASA failed, trying WeatherAPI.com backup
❌ All weather sources failed, using intelligent fallback
```

## 💡 Pro Tips

1. **Use multiple APIs**: Don't rely on just one source
2. **Monitor usage**: Check your API dashboards monthly  
3. **Upgrade when needed**: Healthcare systems need reliable data
4. **Regional accuracy**: PAGASA > WeatherAPI > OpenWeatherMap for Philippines

## 📞 Support

If you need help setting up weather APIs:
1. Check API provider documentation
2. Contact their support teams
3. Consider paid plans for guaranteed uptime
4. Test thoroughly before going to production

---

**Note**: Weather forecasting is critical for healthcare planning. Invest in reliable data sources for production use!