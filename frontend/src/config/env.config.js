/**
 * Centralized environment configuration for the frontend.
 * This file validates that all required environment variables are present
 * and provides a consistent interface for the rest of the application.
 */

const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  defaultTenantId: import.meta.env.VITE_DEFAULT_TENANT_ID,
  appName: import.meta.env.VITE_APP_NAME,
  appVersion: import.meta.env.VITE_APP_VERSION,
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  analyticsId: import.meta.env.VITE_ANALYTICS_ID,
  aiApiUrl: import.meta.env.VITE_API_AI_URL,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

// Simple validation function for production-grade safety
const validateEnv = (config) => {
  const requiredVars = [
    'apiBaseUrl',
    'appName',
    'environment',
    'aiApiUrl'
  ];

  const missing = requiredVars.filter(key => !config[key]);

  if (missing.length > 0) {
    const errorMsg = `❌ Missing required environment variables: ${missing.join(', ')}`;
    if (import.meta.env.PROD) {
      console.error(errorMsg);
      // In production, we might want to still try to run or show a specific error UI
    } else {
      throw new Error(errorMsg);
    }
  }
  // URL validation for API
  try {
    if (config.apiBaseUrl) {
      new URL(config.apiBaseUrl);
    }
  } catch (e) {
    console.error(`❌ Invalid VITE_API_BASE_URL: ${config.apiBaseUrl}`);
  }

  // URL validation for API
  try {
    if (config.aiApiUrl) {
      new URL(config.aiApiUrl);
    }
  } catch (e) {
    console.error(`❌ Invalid  AI API URL configuration`);
  }

  return config;
};

export const config = validateEnv(env);
export default config;
