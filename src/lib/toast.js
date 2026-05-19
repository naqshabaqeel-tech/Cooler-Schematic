const listeners = new Set();

export function showToast(message, tone = 'success') {
  const event = { id: Date.now() + Math.random(), message, tone };
  listeners.forEach((fn) => fn(event));
}

export function subscribeToast(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
