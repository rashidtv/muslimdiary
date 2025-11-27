class ApiClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL;
    this.timeout = 10000;
  }

  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Specific method for prayer times with enhanced error handling
  async getPrayerTimes(zoneCode) {
    try {
      return await this.request(`/api/prayertimes/${zoneCode}`);
    } catch (error) {
      console.error('Prayer times API request failed:', error);
      
      // Don't break the app - return a graceful error
      throw new Error('Unable to load prayer times at the moment. Please check your connection and try again.');
    }
  }
}

export const apiClient = new ApiClient();