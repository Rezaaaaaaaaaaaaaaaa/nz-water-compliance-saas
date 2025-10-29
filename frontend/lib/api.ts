/**
 * API Client
 *
 * Axios-based client for communicating with the backend API
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName?: string;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
    return response.data;
  },
};

// Assets API
export const assetsApi = {
  list: async (params?: any) => {
    const response = await apiClient.get('/assets', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await apiClient.get(`/assets/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/assets', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/assets/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/assets/${id}`);
    return response.data;
  },
  statistics: async () => {
    const response = await apiClient.get('/assets/statistics');
    return response.data;
  },
};

// Documents API
export const documentsApi = {
  list: async (params?: any) => {
    const response = await apiClient.get('/documents', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },
  requestUploadUrl: async (data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    documentType: string;
  }) => {
    const response = await apiClient.post('/documents/upload-url', data);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/documents', data);
    return response.data;
  },
  getDownloadUrl: async (id: string) => {
    const response = await apiClient.get(`/documents/${id}/download`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  },
};

// DWSP API
export const dwspApi = {
  list: async (params?: any) => {
    const response = await apiClient.get('/compliance/dwsp', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await apiClient.get(`/compliance/dwsp/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/compliance/dwsp', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/compliance/dwsp/${id}`, data);
    return response.data;
  },
  validate: async (id: string) => {
    const response = await apiClient.post(`/compliance/dwsp/${id}/validate`);
    return response.data;
  },
  submit: async (id: string) => {
    const response = await apiClient.post(`/compliance/dwsp/${id}/submit`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/compliance/dwsp/${id}`);
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  list: async (params?: any) => {
    const response = await apiClient.get('/reports', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await apiClient.get(`/reports/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/reports', data);
    return response.data;
  },
  submit: async (id: string) => {
    const response = await apiClient.post(`/reports/${id}/submit`);
    return response.data;
  },
  generateMonthly: async (year: number, month: number) => {
    const response = await apiClient.get('/reports/generate/monthly', {
      params: { year, month },
    });
    return response.data;
  },
  generateQuarterly: async (year: number, quarter: number) => {
    const response = await apiClient.get('/reports/generate/quarterly', {
      params: { year, quarter },
    });
    return response.data;
  },
  generateAnnual: async (year: number) => {
    const response = await apiClient.get('/reports/generate/annual', {
      params: { year },
    });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/reports/${id}`);
    return response.data;
  },
};

// Monitoring API
export const monitoringApi = {
  getQueueStats: async () => {
    const response = await apiClient.get('/monitoring/queues');
    return response.data;
  },
  getWorkerStatus: async () => {
    const response = await apiClient.get('/monitoring/workers');
    return response.data;
  },
  getSystemHealth: async () => {
    const response = await apiClient.get('/monitoring/system');
    return response.data;
  },
};
