// Centralized API configuration
class APIConfig {
  constructor() {
    this.environments = {
      development: {
        apiBase: 'http://localhost:5000',
        timeout: 30000
      },
      production: {
        apiBase: 'https://muslimdiarybackend.onrender.com',
        timeout: 15000
      }
    };
    
    this.currentEnv = process.env.REACT_APP_ENVIRONMENT || 
                     (window.location.hostname === 'localhost' ? 'development' : 'production');
  }

  getBaseURL() {
    return process.env.REACT_APP_API_BASE_URL || 
           this.environments[this.currentEnv].apiBase;
  }

  getTimeout() {
    return this.environments[this.currentEnv].timeout;
  }

  getEndpoints() {
    const base = this.getBaseURL();
    return {
      auth: {
        login: `${base}/api/auth/login`,
        register: `${base}/api/auth/register`,
        me: `${base}/api/auth/me`
      },
      prayer: {
        times: `${base}/api/prayertimes`,
        coordinates: `${base}/api/prayertimes/coordinates`
      },
      user: {
        progress: `${base}/api/user/progress`,
        location: `${base}/api/user/location`
      },
      health: {
        ping: `${base}/api/ping`,
        health: `${base}/api/health`
      }
    };
  }
}

// Singleton instance
export const apiConfig = new APIConfig();