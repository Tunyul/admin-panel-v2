import client from './client';

const base = '/api/notifications';

export const getNotifications = (opts = {}) => {
  const params = {};
  if (opts.limit) params.limit = opts.limit;
  if (opts.offset) params.offset = opts.offset;
  return client.get(base, { params });
};

export const getUnreadCount = () => client.get(`${base}/unread_count`);

export const markAsRead = (id) => client.post(`${base}/${encodeURIComponent(id)}/read`);

export const markAllAsRead = () => client.post(`${base}/read_all`);

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
