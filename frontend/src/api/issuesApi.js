import api from './axios';

export const issuesApi = {
  getAll:       (params)       => api.get('/issues', { params }),
  getOne:       (id)           => api.get(`/issues/${id}`),
  create:       (formData)     => api.post('/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:       (id, data)     => api.patch(`/issues/${id}`, data),
  updateStatus: (id, data)     => api.put(`/issues/${id}/status`, data),
  delete:       (id)           => api.delete(`/issues/${id}`),
  upvote:       (id)           => api.post(`/issues/${id}/upvote`),
  reanalyze:    (id)           => api.post(`/issues/${id}/reanalyze`),
  getNearby:    (params)       => api.get('/issues/nearby', { params }),
};
