export function currency(v) { return v == null ? '-' : `Rp${Number(v).toLocaleString('id-ID')}`; }
