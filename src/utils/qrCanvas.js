/**
 * Pure-canvas QR Code renderer.
 * No external library — immune to CSS dark-mode overrides.
 */
export function renderQRCanvas(container, text, size = 220) {
  if (!text) text = 'QR-ERROR'

  function qrEncode(data) {
    const maxBytes = [17, 32, 53, 78, 106]
    const ecWords  = [10, 16, 26, 36, 48]
    const totalDC  = [19, 34, 55, 80, 108]

    const bytes = []
    for (let i = 0; i < data.length; i++) {
      const cc = data.charCodeAt(i)
      if (cc < 128) bytes.push(cc)
      else if (cc < 2048) { bytes.push((cc >> 6) | 192); bytes.push((cc & 63) | 128) }
      else { bytes.push((cc >> 12) | 224); bytes.push(((cc >> 6) & 63) | 128); bytes.push((cc & 63) | 128) }
    }

    let ver = 0
    for (let i = 0; i < maxBytes.length; i++) { if (bytes.length <= maxBytes[i]) { ver = i + 1; break } }
    if (!ver) { ver = 5; bytes.splice(maxBytes[4]) }

    const nEC = ecWords[ver - 1], nTotal = totalDC[ver - 1], nData = nTotal - nEC
    const bits = []
    const ab = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >> i) & 1) }
    ab(4, 4); ab(bytes.length, 8); for (const b of bytes) ab(b, 8); ab(0, 4)
    while (bits.length % 8) bits.push(0)

    const dcBytes = []
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | (bits[i + j] || 0); dcBytes.push(b)
    }
    const pad = [236, 17]; let pi = 0
    while (dcBytes.length < nData) { dcBytes.push(pad[pi]); pi ^= 1 }

    const EX = new Uint8Array(512), LG = new Uint8Array(256)
    ;(function () {
      let x = 1
      for (let i = 0; i < 255; i++) { EX[i] = x; LG[x] = i; x = x < 128 ? x * 2 : (x * 2) ^ 285 }
      for (let i = 255; i < 512; i++) EX[i] = EX[i - 255]
    })()
    const gm = (a, b) => (a && b) ? EX[(LG[a] + LG[b]) % 255] : 0
    const genP = (n) => { let g = [1]; for (let i = 0; i < n; i++) { const t = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { t[j] ^= gm(g[j], 1); t[j + 1] ^= gm(g[j], EX[i]) }; g = t }; return g }
    const rsEC = (d, n) => { const g = genP(n), m = d.concat(new Array(n).fill(0)); for (let i = 0; i < d.length; i++) { const c = m[i]; if (c) for (let j = 0; j < g.length; j++) m[i + j] ^= gm(g[j], c) }; return m.slice(d.length) }
    const ecBytes = rsEC(dcBytes, nEC), allBytes = dcBytes.concat(ecBytes), allBits = []
    for (const b of allBytes) for (let j = 7; j >= 0; j--) allBits.push((b >> j) & 1)
    return { bits: allBits, ver }
  }

  const enc = qrEncode(text), ver = enc.ver, allBits = enc.bits, N = ver * 4 + 17
  const M = []; for (let i = 0; i < N; i++) M.push(new Int8Array(N).fill(-1))
  const force = (r, c, v) => { if (r >= 0 && r < N && c >= 0 && c < N) M[r][c] = v }

  function finder(tr, tc) {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++)
      force(tr + r, tc + c, (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) ? 1 : 0)
    for (let i = -1; i <= 7; i++) { force(tr - 1, tc + i, 0); force(tr + 7, tc + i, 0); force(tr + i, tc - 1, 0); force(tr + i, tc + 7, 0) }
  }
  finder(0, 0); finder(0, N - 7); finder(N - 7, 0)

  const alignPos = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30] }
  const ap = alignPos[ver] || []
  for (const ai of ap) for (const aj of ap) {
    const r = ai, c = aj; if (M[r][c] >= 0) continue
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++)
      force(r + dr, c + dc, (dr === -2 || dr === 2 || dc === -2 || dc === 2 || (dr === 0 && dc === 0)) ? 1 : 0)
  }

  for (let i = 8; i < N - 8; i++) { if (M[6][i] < 0) M[6][i] = i % 2 === 0 ? 1 : 0; if (M[i][6] < 0) M[i][6] = i % 2 === 0 ? 1 : 0 }
  force(N - 8, 8, 1)
  for (let i = 0; i < 9; i++) { if (M[8][i] < 0) M[8][i] = 0; if (M[i][8] < 0) M[i][8] = 0 }
  for (let i = N - 8; i < N; i++) { if (M[8][i] < 0) M[8][i] = 0; if (M[i][8] < 0) M[i][8] = 0 }

  let bi = 0
  for (let col = N - 1; col >= 1; col -= 2) {
    if (col === 6) col--
    for (let ri = 0; ri < N; ri++) {
      const row = ((N - 1 - col) & 2) ? ri : N - 1 - ri
      for (let d = 0; d < 2; d++) {
        const c = col - d
        if (M[row][c] < 0 && bi < allBits.length) { M[row][c] = allBits[bi] ^ ((row + c) % 2 === 0 ? 1 : 0); bi++ }
      }
    }
  }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (M[r][c] < 0) M[r][c] = 0

  const fmtStr = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]
  const fmtH = [0, 1, 2, 3, 4, 5, 7, 8, N - 7, N - 6, N - 5, N - 4, N - 3, N - 2, N - 1]
  const fmtV = [0, 1, 2, 3, 4, 5, 7, 8, N - 8, N - 7, N - 6, N - 5, N - 4, N - 3, N - 2]
  for (let i = 0; i < 15; i++) { force(8, fmtH[i], fmtStr[i]); force(fmtV[i], 8, fmtStr[14 - i]) }

  const pad = 14, cell = Math.floor((size - pad * 2) / N), total = N * cell + pad * 2
  const canvas = document.createElement('canvas')
  canvas.width = total; canvas.height = total
  canvas.style.cssText = 'display:block;border-radius:8px;image-rendering:pixelated;image-rendering:crisp-edges'
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, total, total)
  ctx.fillStyle = '#000000'
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
    if (M[r][c] === 1) ctx.fillRect(pad + c * cell, pad + r * cell, cell, cell)

  container.innerHTML = ''
  container.appendChild(canvas)
}
