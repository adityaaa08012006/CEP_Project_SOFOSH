import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ============ AUTH ============
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

// ============ SCHEDULES ============
export const scheduleApi = {
  getAll: (params) => api.get('/schedules', { params }),
  getById: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

// ============ APPOINTMENTS ============
export const appointmentApi = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  book: (data) => api.post('/appointments', data),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
  getDailySummary: (date) => api.get('/appointments/daily-summary', { params: { date } }),
};

// ============ DONATION CATEGORIES ============
export const donationCategoryApi = {
  getAll: () => api.get('/donation-categories'),
  create: (data) => api.post('/donation-categories', data),
  update: (id, data) => api.put(`/donation-categories/${id}`, data),
  delete: (id) => api.delete(`/donation-categories/${id}`),
};

// ============ DONATION ITEMS ============
export const donationItemApi = {
  getAll: (params) => api.get('/donation-items', { params }),
  getById: (id) => api.get(`/donation-items/${id}`),
  create: (data) => api.post('/donation-items', data),
  update: (id, data) => api.put(`/donation-items/${id}`, data),
  delete: (id) => api.delete(`/donation-items/${id}`),
  extractFromPdf: (formData) => {
    return api.post('/donation-items/extract-from-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  bulkCreate: (data) => api.post('/donation-items/bulk-create', data),
};

// ============ DONATIONS ============
export const donationApi = {
  getAll: (params) => api.get('/donations', { params }),
  create: (data) => api.post('/donations', data),
  verify: (id) => api.put(`/donations/${id}/verify`),
};

// ============ INVENTORY ============
export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  update: (itemId, data) => api.put(`/inventory/${itemId}`, data),
  getReport: () => api.get('/inventory/report'),
};

// ============ USERS (Admin) ============
export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  delete: (id) => api.delete(`/users/${id}`),
};
