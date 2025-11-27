import { apiConfig } from '../config/api';

class ApiClient {
  constructor() {
    this.endpoints = apiConfig.getEndpoints();
    this.timeout = apiConfig.getTimeout();
  }

  async request(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': process.env.REACT_APP_VERSION || '2.4.0'
      },
      signal: controller.signal
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  async requestWithRetry(url, options = {}, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.request(url, options);
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
          console.log(`🔄 API call failed, retry ${attempt}/${maxRetries}...`);
          await this.delay(1000 * attempt); // Exponential backoff
          continue;
        }
        throw error;
      }
    }
  }

  handleError(error) {
    if (error.name === 'AbortError') {
      return new Error('Request timeout - please check your connection');
    }
    
    if (error.message.includes('Failed to fetch')) {
      return new Error('Network error - please check your internet connection');
    }
    
    return error;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Auth endpoints
  async login(email, password) {
    return this.requestWithRetry(this.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(userData) {
    return this.requestWithRetry(this.endpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Prayer times endpoints
  async getPrayerTimes(zoneCode) {
    return this.requestWithRetry(`${this.endpoints.prayer.times}/${zoneCode}`);
  }

  async getPrayerTimesByCoords(lat, lng) {
    return this.requestWithRetry(`${this.endpoints.prayer.coordinates}/${lat}/${lng}`);
  }

  // Health check
  async ping() {
    return this.request(this.endpoints.health.ping, { timeout: 5000 });
  }
}

export const apiClient = new ApiClient();