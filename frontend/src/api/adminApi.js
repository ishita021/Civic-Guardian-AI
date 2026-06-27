import api from './axios';

export const adminApi = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),

  // Users
  getUsers:   (params) => api.get('/admin/users',      { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id)     => api.delete(`/admin/users/${id}`),

  // Complaints
  getComplaints:         (params)       => api.get('/admin/complaints',                     { params }),
  assignComplaint:       (id, data)     => api.patch(`/admin/complaints/${id}/assign`,      data),
  updateComplaintStatus: (id, data)     => api.patch(`/admin/complaints/${id}/status`,      data),
  deleteComplaint:       (id)           => api.delete(`/admin/complaints/${id}`),
};
