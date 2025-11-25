// Determine API URL based on how the app is accessed
const getApiUrl = () => {
  // If accessing directly on port 3001, use the server's direct port
  if (window.location.port === '3001') {
    return `http://${window.location.hostname}:5000/api`;
  }
  // If accessing through nginx (port 80), use relative path
  return '/api';
};

export const API_URL = getApiUrl();