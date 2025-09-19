export function normalizePhone(phone) {
  if (!phone) return null;
  let normalized = String(phone || '').replace(/[^+\d]/g, '');
  if (!normalized) return null;
  if (normalized.startsWith('+')) normalized = normalized.slice(1);
  if (normalized.startsWith('0')) normalized = '62' + normalized.slice(1);
  normalized = normalized.replace(/\D/g, '');
  return normalized || null;
}

export default normalizePhone;
