import client from './client';

const tryEndpoints = async (paths = []) => {
	let lastErr = null;
	for (const p of paths) {
		try {
			const res = await client.get(p);
			return res;
		} catch (err) {
			lastErr = err;
			// continue trying other paths
		}
	}
	// throw last error to let caller decide
	throw lastErr || new Error('No endpoints provided');
};

// API health — only /health
export const getApiHealth = () => tryEndpoints(['/health']);

// DB-specific health — only /health/db
export const getDbHealth = () => tryEndpoints(['/health/db']);

