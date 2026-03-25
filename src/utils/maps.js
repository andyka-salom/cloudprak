import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export const DEF_CENTER = [-7.2575, 112.7521]
const TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'

const maps = {}

export function mkIcon(color, size = 28) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:3px solid rgba(255,255,255,.9);box-shadow:0 3px 12px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:${size * 0.35}px">📍</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

export function mkDot(color) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:8px;height:8px;border-radius:50%;border:2px solid rgba(255,255,255,.8)"></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  })
}

export const IC_VOLT = mkIcon('#c8ff00')
export const IC_GRN  = mkIcon('#00d68f', 26)
export const IC_RED  = mkIcon('#ff3d6b', 26)
export const IC_CYAN = mkIcon('#00e5ff')

export function initMap(id, center = DEF_CENTER, zoom = 15) {
  if (maps[id]) { maps[id].invalidateSize(); return maps[id] }
  const m = L.map(id).setView(center, zoom)
  L.tileLayer(TILE, { attribution: ATTR, maxZoom: 19 }).addTo(m)
  maps[id] = m
  return m
}

export function getMap(id) {
  return maps[id] || null
}

export function destroyMap(id) {
  if (maps[id]) { try { maps[id].remove() } catch {} delete maps[id] }
}

export function invalidateAll() {
  Object.values(maps).forEach((m) => { try { m.invalidateSize() } catch {} })
}
