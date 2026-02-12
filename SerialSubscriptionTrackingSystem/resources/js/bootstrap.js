import axios from 'axios';
window.axios = axios;

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

// Set up axios interceptor to get CSRF token on each request
axios.interceptors.request.use(function (config) {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token.content;
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

// Set up response interceptor to handle CSRF token expiry (419 errors)
axios.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        
        // If we get a 419 (CSRF token mismatch) and haven't retried yet
        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Try to get a fresh CSRF token
                await axios.get('/sanctum/csrf-cookie');
                
                // Update the CSRF token header from the refreshed meta tag
                const newToken = document.head.querySelector('meta[name="csrf-token"]');
                if (newToken) {
                    originalRequest.headers['X-CSRF-TOKEN'] = newToken.content;
                }
                
                // Retry the original request
                return axios(originalRequest);
            } catch (refreshError) {
                // If refresh fails, reject with original error
                return Promise.reject(error);
            }
        }
        
        return Promise.reject(error);
    }
);
