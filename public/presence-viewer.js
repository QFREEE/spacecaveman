const form = document.querySelector('#access-form');
const input = document.querySelector('#read-token');
const status = document.querySelector('#presence-status');
const time = document.querySelector('#presence-time');
const health = document.querySelector('#presence-health');
let token = '';
let report = null;
let generation = 0;
let controller;

function render() {
  if (!token) return;
  if (!report || !Number.isFinite(Date.parse(report.expires_at)) || Date.parse(report.expires_at) <= Date.now()) {
    status.textContent = 'Unknown';
    time.textContent = 'No unexpired report is available.';
    return;
  }
  status.textContent = report.status === 'in_nyc' ? 'Last reported in NYC' : 'Last reported outside NYC';
  time.textContent = `Reported ${new Date(report.observed_at).toLocaleString()}. Expires ${new Date(report.expires_at).toLocaleTimeString()}.`;
}

async function refresh() {
  if (!token) return;
  controller?.abort();
  controller = new AbortController();
  const currentGeneration = generation;
  try {
    const response = await fetch('/api/presence', {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal,
    });
    if (currentGeneration !== generation) return;
    if (response.status === 401) {
      report = null;
      health.textContent = 'Access denied. Check whether your read credential has expired or been revoked.';
    } else if (!response.ok) throw new Error('Refresh failed');
    else {
      const next = await response.json();
      if (currentGeneration !== generation) return;
      report = ['in_nyc', 'not_in_nyc'].includes(next.status) ? next : null;
      health.textContent = 'Connected. Refreshes every minute.';
    }
  } catch (error) {
    if (currentGeneration !== generation || error.name === 'AbortError') return;
    health.textContent = 'Could not refresh. The last report still expires at its original time.';
  }
  render();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  generation++;
  report = null;
  token = input.value.trim();
  input.value = '';
  health.textContent = 'Connecting…';
  render();
  refresh();
});
document.querySelector('#forget').addEventListener('click', () => {
  generation++;
  controller?.abort();
  token = '';
  report = null;
  input.value = '';
  status.textContent = 'Access cleared.';
  time.textContent = '';
  health.textContent = '';
});
setInterval(render, 1000);
setInterval(refresh, 60_000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); refresh(); } });
