import api from './axios';

export const verificationsApi = {
  castVote:   (issueId, data) => api.post(`/verifications/${issueId}`, data),
  getVotes:   (issueId)       => api.get(`/verifications/${issueId}`),
  getMyVote:  (issueId)       => api.get(`/verifications/${issueId}/my-vote`),
  retract:    (issueId)       => api.delete(`/verifications/${issueId}`),
};
