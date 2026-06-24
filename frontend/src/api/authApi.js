import api from './axios';

export const authApi = {
  register: (data)        => api.post('/auth/register', data),
  login:    (data)        => api.post('/auth/login', data),
  getMe:    ()            => api.get('/auth/me'),
  updatePassword: (data)  => api.patch('/auth/update-password', data),
};
