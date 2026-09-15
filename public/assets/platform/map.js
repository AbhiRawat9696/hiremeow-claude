// Leaflet map (vendored) with OpenStreetMap tiles. Used for job locations and the company pin picker.
const BKK = [13.7563, 100.5018];
let leafletPromise = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'assets/vendor/leaflet/leaflet.css'; document.head.appendChild(css);
      const s = document.createElement('script'); s.src = 'assets/vendor/leaflet/leaflet.js';
      s.onload = () => { window.L.Icon.Default.imagePath = 'assets/vendor/leaflet/images/'; resolve(window.L); };
      s.onerror = () => reject(new Error('Map failed to load')); document.head.appendChild(s);
    });
  }
  return leafletPromise;
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function createMap(React) {
  const h = React.createElement;

  /** points: [{id, lat, lng, title, subtitle}] · onSelect(id) · me: {lat,lng} */
  function JobsMap({ points, onSelect, me, height = 380 }) {
    const el = React.useRef(null), map = React.useRef(null), layer = React.useRef(null);
    const [err, setErr] = React.useState('');
    const latest = React.useRef({ points, me, onSelect });
    latest.current = { points, me, onSelect };
    React.useEffect(() => {
      let dead = false;
      loadLeaflet().then(L => {
        if (dead || map.current) return;
        map.current = L.map(el.current, { scrollWheelZoom: false }).setView(BKK, 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map.current);
        layer.current = L.layerGroup().addTo(map.current);
        draw();
      }).catch(e => setErr(e.message));
      return () => { dead = true; map.current?.remove(); map.current = null; };
    }, []);
    const draw = () => {
      const L = window.L; if (!L || !map.current) return;
      const { points, me, onSelect } = latest.current;
      layer.current.clearLayers();
      const bounds = [];
      for (const p of points) {
        if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
        const m = L.marker([p.lat, p.lng], { title: p.title, alt: p.title }).addTo(layer.current);
        m.bindPopup(`<strong>${esc(p.title)}</strong><br>${esc(p.subtitle)}`);
        m.on('click', () => onSelect?.(p.id));
        bounds.push([p.lat, p.lng]);
      }
      if (me && Number.isFinite(me.lat)) {
        L.circleMarker([me.lat, me.lng], { radius: 8, color: '#f28a24', fillColor: '#f28a24', fillOpacity: .9 }).bindTooltip('You').addTo(layer.current);
        bounds.push([me.lat, me.lng]);
      }
      if (bounds.length > 1) map.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      else if (bounds.length === 1) map.current.setView(bounds[0], 14);
    };
    React.useEffect(draw, [points, me]);
    return h('div', { className: 'pf-map-wrap' },
      h('div', { ref: el, className: 'pf-map', style: { height }, role: 'region', 'aria-label': 'Map of job locations' }),
      err && h('p', { className: 'lab-warn' }, err),
      h('p', { className: 'lab-tiny' }, `${points.filter(p => Number.isFinite(p.lat)).length} of ${points.length} jobs have a map pin.`));
  }

  /** Click the map to set a pin. value: {lat,lng} */
  function PinPicker({ value, onChange, height = 260 }) {
    const el = React.useRef(null), map = React.useRef(null), marker = React.useRef(null);
    React.useEffect(() => {
      let dead = false;
      loadLeaflet().then(L => {
        if (dead) return;
        const start = Number.isFinite(value?.lat) ? [value.lat, value.lng] : BKK;
        map.current = L.map(el.current).setView(start, Number.isFinite(value?.lat) ? 15 : 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map.current);
        if (Number.isFinite(value?.lat)) marker.current = L.marker(start).addTo(map.current);
        map.current.on('click', e => {
          const pos = { lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) };
          if (marker.current) marker.current.setLatLng(e.latlng); else marker.current = L.marker(e.latlng).addTo(map.current);
          onChange(pos);
        });
      });
      return () => { dead = true; map.current?.remove(); map.current = null; marker.current = null; };
    }, []);
    return h('div', null,
      h('div', { ref: el, className: 'pf-map', style: { height }, role: 'application', 'aria-label': 'Click to place the office pin' }),
      h('p', { className: 'lab-tiny' }, Number.isFinite(value?.lat) ? `Pinned at ${value.lat}, ${value.lng}` : 'Click the map to drop a pin on your office.'));
  }
  return { JobsMap, PinPicker };
}
