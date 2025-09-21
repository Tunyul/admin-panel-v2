export function currency(v) { return v == null ? '-' : `Rp${Number(v).toLocaleString('id-ID')}`; }

// Simple debounce helper that returns a debounced function with a cancel method
export function debounce(fn, wait = 200) {
	let t = null;
	function debounced(...args) {
		if (t) clearTimeout(t);
		t = setTimeout(() => { t = null; fn(...args); }, wait);
	}
	debounced.cancel = () => { if (t) { clearTimeout(t); t = null; } };
	return debounced;
}
