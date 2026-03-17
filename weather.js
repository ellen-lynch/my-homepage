// Step 2.1: Weather Service
class WeatherService {
    constructor() {
        this.baseURL = 'https://api.open-meteo.com/v1/forecast';
        this.defaultLocation = { lat: 47.6062, lon: -122.3321, name: 'Seattle, WA' };
    }

    async getCurrentWeather(lat, lon) {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current_weather: true,
            hourly: 'relative_humidity_2m',
            temperature_unit: 'fahrenheit',
            wind_speed_unit: 'mph',
            timezone: 'auto'
        });

        const response = await fetch(`${this.baseURL}?${params}`);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        return await response.json();
    }

    getWeatherDescription(weatherCode) {
        const descriptions = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            66: 'Light freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow fall',
            73: 'Moderate snow fall',
            75: 'Heavy snow fall',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail'
        };
        return descriptions[weatherCode] || 'Unknown conditions';
    }
}

// Step 2.2: Location Service
class LocationService {
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    reject(new Error(`Location error: ${error.message}`));
                },
                options
            );
        });
    }

    async getLocationName(lat, lon) {
        // For simplicity, we'll use a reverse geocoding service or return coordinates
        // You could integrate with a geocoding API here if needed
        return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
}

// Step 2.3: Weather Widget Controller
class WeatherWidget {
    constructor() {
        this.weatherService = new WeatherService();
        this.locationService = new LocationService();
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadWeather();
        this.startAutoRefresh();
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadWeather());
        }
    }

    async loadWeather() {
        this.showLoading();

        try {
            let location;
            
            try {
                // Try to get user's current location
                location = await this.locationService.getCurrentLocation();
            } catch (locationError) {
                console.warn('Using default location:', locationError.message);
                // Fall back to default location
                location = this.weatherService.defaultLocation;
            }

            const weatherData = await this.weatherService.getCurrentWeather(
                location.lat, 
                location.lon
            );

            await this.displayWeather(weatherData, location);

        } catch (error) {
            console.error('Weather loading error:', error);
            this.showError();
        }
    }

    async displayWeather(data, location) {
        const current = data.current_weather;
        const hourly = data.hourly;

        // Update DOM elements
        document.getElementById('temperature').textContent = 
            `${Math.round(current.temperature)}°F`;
        
        document.getElementById('conditions').textContent = 
            this.weatherService.getWeatherDescription(current.weathercode);
        
        document.getElementById('wind').textContent = 
            `Wind: ${Math.round(current.windspeed)} mph`;

        // Get humidity from hourly data (current hour)
        const currentHour = new Date().getHours();
        const humidity = hourly?.relative_humidity_2m?.[currentHour] || '--';
        document.getElementById('humidity').textContent = 
            `Humidity: ${humidity}%`;

        // Set location name
        let locationName = location.name || 
            await this.locationService.getLocationName(location.lat, location.lon);
        document.getElementById('location').textContent = locationName;

        this.showWeatherData();
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('weather-data').style.display = 'none';
        document.getElementById('error').style.display = 'none';
    }

    showWeatherData() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('weather-data').style.display = 'block';
        document.getElementById('error').style.display = 'none';
    }

    showError() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('weather-data').style.display = 'none';
        document.getElementById('error').style.display = 'block';
    }

    startAutoRefresh() {
        // Refresh every 10 minutes
        this.refreshInterval = setInterval(() => {
            this.loadWeather();
        }, 600000);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}
