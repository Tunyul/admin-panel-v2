import client from './client';
import * as crud from './crudutils';

const base = '/api/piutangs';

export const getPiutangs = crud.getAll(client, base);
export const getPiutangById = crud.getById(client, base);
export const createPiutang = crud.create(client, base);
export const updatePiutang = crud.update(client, base);
export const deletePiutang = crud.remove(client, base);

export default {
  getPiutangs,
  getPiutangById,
  createPiutang,
  updatePiutang,
  deletePiutang,
};
