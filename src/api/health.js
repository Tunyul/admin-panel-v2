import client from './client';

const tryEndpoints = async (paths = []) => {
	let lastErr = null;
	for (const p of paths) {
		try {
			const res = await client.get(p);
			return res;
		} catch (e) {
			lastErr = e;
			// continue trying other paths
		}
	}
	// throw last error to let caller decide
	throw lastErr || new Error('No endpoints provided');
};

// Try common API health endpoints
export const getApiHealth = () => tryEndpoints([
	'/health',
	'/api/health',
	'/healthz',
	'/status',
	'/api/status',
]);

// Try common DB-specific health endpoints, then fallback to general health
export const getDbHealth = async () => {
	try {
		return await tryEndpoints(['/api/health/db', '/health/db', '/db/health']);
	} catch (e) {
		// fallback: try general health and hope it contains db info (or at least is reachable)
		return tryEndpoints(['/api/health', '/health', '/healthz']);
	}
};
