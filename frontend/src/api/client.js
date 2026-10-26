/**
 * API Client for Suvidha Application Validation Portal
 */

const BASE_URL = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('suvidha_token');
  const headers = {
    ...options.headers,
  };

  // Add auth token if present
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMsg = (data && data.message) || (data && data.error);
    if (!errorMsg && typeof data === 'string') {
      if (data.includes('ECONNREFUSED') || response.status === 504 || response.status === 500) {
        errorMsg = 'Cannot reach backend server (port 5000). Please ensure the backend is running.';
      } else if (data.length > 0 && data.length < 150) {
        errorMsg = data;
      }
    }
    const error = new Error(errorMsg || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth & Profile
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getCurrentUser: () => apiRequest('/auth/me'),
  updateProfile: (profileData) => apiRequest('/auth/profile', { method: 'PATCH', body: JSON.stringify(profileData) }),
  getDemoAccounts: () => apiRequest('/auth/demo-accounts'),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/mark-all-read', { method: 'POST' }),

  // Applications
  getApplications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/applications${qs ? `?${qs}` : ''}`);
  },
  getApplicationById: (id) => apiRequest(`/applications/${id}`),
  createApplication: (payload) => apiRequest('/applications', { method: 'POST', body: JSON.stringify(payload) }),
  updateApplication: (id, payload) => apiRequest(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteApplication: (id) => apiRequest(`/applications/${id}`, { method: 'DELETE' }),
  submitApplication: (id) => apiRequest(`/applications/${id}/submit`, { method: 'POST' }),
  withdrawApplication: (id, reason) => apiRequest(`/applications/${id}/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  getApplicationTimeline: (id) => apiRequest(`/applications/${id}/timeline`),

  // Documents
  uploadDocument: (applicationId, formData) => apiRequest(`/applications/${applicationId}/documents`, {
    method: 'POST',
    body: formData,
  }),
  getDocuments: (applicationId) => apiRequest(`/applications/${applicationId}/documents`),
  deleteDocument: (id) => apiRequest(`/documents/${id}`, { method: 'DELETE' }),

  // Verification & Review Workspace
  getVerificationWorkspace: (applicationId) => apiRequest(`/applications/${applicationId}/verification-workspace`),
  triggerVerification: (applicationId) => apiRequest(`/applications/${applicationId}/verification-runs`, { method: 'POST' }),
  recordReviewDecision: (applicationId, decisionData) => apiRequest(`/applications/${applicationId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(decisionData),
  }),
  addReviewerComment: (applicationId, commentData) => apiRequest(`/applications/${applicationId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
  }),

  // Compliance Directorate
  getComplianceOverview: () => apiRequest('/compliance/overview'),
  getComplianceQueue: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/compliance/queue${qs ? `?${qs}` : ''}`);
  },
  getComplianceAuditDetails: (id) => apiRequest(`/compliance/audit/${id}`),
  recordComplianceDecision: (id, decisionData) => apiRequest(`/compliance/decision/${id}`, {
    method: 'POST',
    body: JSON.stringify(decisionData),
  }),
  getComplianceViolations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/compliance/violations${qs ? `?${qs}` : ''}`);
  },
  updateComplianceViolation: (id, payload) => apiRequest(`/compliance/violations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  getComplianceReports: () => apiRequest('/compliance/reports'),

  // Compliance Rules
  getComplianceRules: () => apiRequest('/compliance-rules'),
  toggleRule: (id, enabled) => apiRequest(`/compliance-rules/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  }),
  updateRule: (id, payload) => apiRequest(`/compliance-rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),

  // Admin Control Center
  getAdminOverview: () => apiRequest('/admin/overview'),
  getAdminUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  createAdminUser: (userData) => apiRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  updateAdminUser: (id, userData) => apiRequest(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(userData),
  }),
  resetAdminUserPassword: (id, newPassword) => apiRequest(`/admin/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  }),
  getReviewerAssignments: () => apiRequest('/admin/assignments'),
  assignReviewer: (applicationId, reviewerId) => apiRequest('/admin/assignments', {
    method: 'POST',
    body: JSON.stringify({ applicationId, reviewerId }),
  }),
  getAdminServices: () => apiRequest('/admin/services'),
  updateAdminService: (id, serviceData) => apiRequest(`/admin/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(serviceData),
  }),
  getSystemHealth: () => apiRequest('/admin/system-health'),

  // Audit Events
  getAuditEvents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/audit-events${qs ? `?${qs}` : ''}`);
  },

  // Health
  getHealth: () => apiRequest('/health'),
};
