import client from './client';

const base = '/api/notifications';

export const getNotifications = (opts = {}) => {
  const params = {};
  if (opts.limit) params.limit = opts.limit;
  if (opts.offset) params.offset = opts.offset;
  // allow explicit override, but normally token inference should be used
  if (opts.recipient_type) params.recipient_type = opts.recipient_type;
  if (opts.recipient_id) params.recipient_id = opts.recipient_id;
  return client.get(base, { params });
};

export const getUnreadCount = (opts = {}) => {
  const params = {};
  if (opts.recipient_type) params.recipient_type = opts.recipient_type;
  if (opts.recipient_id) params.recipient_id = opts.recipient_id;
  return client.get(`${base}/unread_count`, { params });
};

export const markAsRead = (id) => client.post(`${base}/${encodeURIComponent(id)}/read`);

// backend exposes PUT /api/notifications/read-all
export const markAllAsRead = () => client.put(`${base}/read-all`);

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
