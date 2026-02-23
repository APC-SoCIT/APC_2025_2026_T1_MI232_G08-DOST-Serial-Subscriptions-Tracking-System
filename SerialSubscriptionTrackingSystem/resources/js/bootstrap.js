import axios from 'axios';
window.axios = axios;

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

// Helper: fetch a fresh CSRF token from the server and update the meta tag
window.refreshCsrfToken = async function () {
    try {
        const response = await fetch('/login', {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'Accept': 'text/html' },
        });
        const html = await response.text();
        const match = html.match(/meta name="csrf-token" content="([^"]+)"/);
        if (match && match[1]) {
            const metaTag = document.head.querySelector('meta[name="csrf-token"]');
            if (metaTag) {
                metaTag.setAttribute('content', match[1]);
            }
            return match[1];
        }
    } catch (e) {
        console.error('Failed to refresh CSRF token:', e);
    }
    return null;
};

// Attach CSRF token on each axios request
axios.interceptors.request.use(function (config) {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token.content;
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

// Handle 419 for axios calls: refresh token and retry automatically
axios.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;

            const newToken = await window.refreshCsrfToken();
            if (newToken) {
                originalRequest.headers['X-CSRF-TOKEN'] = newToken;
                return axios(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);