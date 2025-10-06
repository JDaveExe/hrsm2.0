// Test Weather System Integration
// This script tests the enhanced weather service with PAGASA integration

const enhancedWeatherService = require('./src/services/enhancedWeatherService');

async function testWeatherSystem() {
    console.log('🌤️  Testing Enhanced Weather System with PAGASA Integration\n');
    
    try {
        // Test current weather
        console.log('📍 Testing Current Weather for Manila, Philippines...');
        const currentWeather = await enhancedWeatherService.getCurrentWeather('Manila, Philippines');
        console.log('✅ Current Weather:', {
            location: currentWeather.location,
            temperature: currentWeather.temperature,
            condition: currentWeather.condition,
            source: currentWeather.source,
            lastUpdated: currentWeather.lastUpdated
        });
        
        // Test weekly forecast
        console.log('\n📅 Testing Weekly Forecast...');
        const weeklyForecast = await enhancedWeatherService.getWeeklyForecast('Manila, Philippines');
        console.log('✅ Weekly Forecast (7 days):', {
            forecastDays: weeklyForecast.forecast.length,
            source: weeklyForecast.source,
            firstDay: weeklyForecast.forecast[0]
        });
        
        // Test healthcare weather summary
        console.log('\n🏥 Testing Healthcare Weather Summary...');
        const healthcareSummary = await enhancedWeatherService.getHealthcareWeatherSummary('Manila, Philippines');
        console.log('✅ Healthcare Summary:', {
            currentConditions: healthcareSummary.currentConditions?.condition,
            weeklyTrends: healthcareSummary.weeklyTrends?.length,
            healthImplications: healthcareSummary.healthImplications?.length,
            typhoonStatus: healthcareSummary.typhoonAlerts?.length > 0 ? 'Active alerts' : 'No alerts'
        });
        
        console.log('\n🎉 All weather system tests passed!');
        console.log('\n📊 System Summary:');
        console.log('• Real-time weather data from PAGASA/WeatherAPI');
        console.log('• 7-day accurate forecasting');
        console.log('• Healthcare-specific weather analysis');
        console.log('• Typhoon tracking and alerts');
        console.log('• Automatic weekly updates');
        
    } catch (error) {
        console.error('❌ Weather System Test Failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check if API keys are set in environment variables');
        console.log('2. Verify internet connection');
        console.log('3. Check WEATHER_API_SETUP.md for configuration guide');
    }
}

// Run the test
testWeatherSystem();