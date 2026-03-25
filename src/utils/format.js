export function fmtDt(ts) {
  if (!ts) return '-'
  try { return new Date(ts).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return ts }
}

export function fmtTime(ts) {
  if (!ts) return '-'
  try { return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
  catch { return ts }
}

export function roleBadgeClass(role) {
  return role === 'admin' ? 'badge--rose' : role === 'dosen' ? 'badge--amber' : 'badge--volt'
}
