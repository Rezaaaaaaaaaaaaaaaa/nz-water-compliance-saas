/**
 * API Client
 *
 * Axios-based client for communicating with the backend API
 */

import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/**
 * Custom API Error Class
 * Provides consistent error handling across the application
 */
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Extract error message from API response
 */
function getErrorMessage(error: AxiosError<any>): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

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
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle errors with detailed logging and status-specific handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status || 0;
    const errorMessage = getErrorMessage(error);

    // Log error details
    console.error('API Error:', {
      status,
      message: errorMessage,
      url: error.config?.url,
      data: error.response?.data,
    });

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        // Bad request - validation error
        return Promise.reject(
          new APIError(400, errorMessage, error.response?.data?.details)
        );

      case 401:
        // Unauthorized - clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(new APIError(401, 'Unauthorized. Please log in.'));

      case 403:
        // Forbidden - user doesn't have permission
        return Promise.reject(
          new APIError(403, 'You do not have permission to access this resource.')
        );

      case 404:
        // Not found
        return Promise.reject(new APIError(404, 'The requested resource was not found.'));

      case 429:
        // Rate limited
        return Promise.reject(
          new APIError(429, 'Too many requests. Please try again later.')
        );

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        return Promise.reject(
          new APIError(status, 'Server error. Please try again later.')
        );

      default:
        // Network or other errors
        if (!error.response) {
          return Promise.reject(
            new APIError(0, 'Network error. Please check your connection.')
          );
        }
        return Promise.reject(new APIError(status, errorMessage));
    }
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
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

// Analytics API
export const analyticsApi = {
  getDashboard: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/analytics/dashboard', { params });
    return response.data;
  },
  getComplianceOverview: async (params?: any) => {
    const response = await apiClient.get('/analytics/compliance/overview', { params });
    return response.data;
  },
  getAssetAnalytics: async (params?: any) => {
    const response = await apiClient.get('/analytics/assets', { params });
    return response.data;
  },
  getDocumentAnalytics: async (params?: any) => {
    const response = await apiClient.get('/analytics/documents', { params });
    return response.data;
  },
  getActivityTimeline: async (params?: { limit?: number; offset?: number }) => {
    const response = await apiClient.get('/analytics/activity', { params });
    return response.data;
  },
  getDwspTrends: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/analytics/dwsp-trends', { params });
    return response.data;
  },
  getUserActivity: async (params?: any) => {
    const response = await apiClient.get('/analytics/users', { params });
    return response.data;
  },
  getSystemAnalytics: async () => {
    const response = await apiClient.get('/analytics/system');
    return response.data;
  },
};

// Export API
export const exportApi = {
  exportAssets: async (format: 'csv' | 'excel' | 'pdf' = 'csv', params?: any) => {
    const response = await apiClient.get('/export/assets', {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response.data;
  },
  exportDocuments: async (format: 'csv' | 'excel' | 'pdf' = 'csv', params?: any) => {
    const response = await apiClient.get('/export/documents', {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response.data;
  },
  exportCompliancePlans: async (format: 'csv' | 'excel' | 'pdf' = 'csv', params?: any) => {
    const response = await apiClient.get('/export/compliance-plans', {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response.data;
  },
  exportAuditLogs: async (format: 'csv' | 'excel' | 'pdf' = 'csv', params?: any) => {
    const response = await apiClient.get('/export/audit-logs', {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response.data;
  },
  exportComplianceOverview: async (format: 'text' | 'pdf' = 'text') => {
    const response = await apiClient.get('/export/compliance-overview', {
      params: { format },
      responseType: format === 'text' ? 'text' : 'blob'
    });
    return response.data;
  },
};

// AI API
export const aiApi = {
  ask: async (question: string, context?: string) => {
    const response = await apiClient.post('/ai/ask', { question, context });
    return response.data;
  },
  analyzeDwsp: async (content: string, documentId?: string) => {
    const response = await apiClient.post('/ai/analyze-dwsp', { content, documentId });
    return response.data;
  },
  analyzeWaterQuality: async (data: any) => {
    const response = await apiClient.post('/ai/analyze-water-quality', data);
    return response.data;
  },
  generateSummary: async (reportId: string, type: string) => {
    const response = await apiClient.post('/ai/generate-summary', { reportId, type });
    return response.data;
  },
  getUsage: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/ai/usage', { params });
    return response.data;
  },
  getConversations: async (limit?: number) => {
    const response = await apiClient.get('/ai/conversations', { params: { limit } });
    return response.data;
  },
  deleteConversation: async (sessionId: string) => {
    const response = await apiClient.delete(`/ai/conversations/${sessionId}`);
    return response.data;
  },
  updateTier: async (tier: 'basic' | 'professional' | 'enterprise') => {
    const response = await apiClient.put('/ai/tier', { tier });
    return response.data;
  },
};

// DWQAR API (Drinking Water Quality Assurance Reporting)
export const dwqarApi = {
  getCurrentStatus: async () => {
    const response = await apiClient.get('/dwqar/current');
    return response.data;
  },
  validateReport: async (data: any) => {
    const response = await apiClient.post('/dwqar/validate', data);
    return response.data;
  },
  exportToExcel: async (period: string) => {
    const response = await apiClient.get('/dwqar/export', {
      params: { period },
      responseType: 'blob'
    });
    return response.data;
  },
  submitReport: async (data: any) => {
    const response = await apiClient.post('/dwqar/submit', data);
    return response.data;
  },
  getHistory: async (params?: { limit?: number; offset?: number }) => {
    const response = await apiClient.get('/dwqar/history', { params });
    return response.data;
  },
  getAggregation: async (period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual') => {
    const response = await apiClient.get(`/dwqar/aggregation/${period}`);
    return response.data;
  },
  getCompleteness: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/dwqar/completeness', {
      params: { startDate, endDate }
    });
    return response.data;
  },
};
