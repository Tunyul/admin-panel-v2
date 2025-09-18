// Fungsi CRUD generik untuk resource apapun
export const getAll = (client, url) => () => client.get(url);
export const getById = (client, url) => (id) => client.get(`${url}/${id}`);
export const create = (client, url) => (data) => client.post(url, data);
export const update = (client, url) => (id, data) => client.put(`${url}/${id}`, data);
export const remove = (client, url) => (id) => client.delete(`${url}/${id}`);
