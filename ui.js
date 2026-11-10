/* ============================================================
   UI — utilitários, ícones, modal, toast, gráficos SVG
   ============================================================ */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = n => (+n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const num = (n, d = 2) => (+n || 0).toLocaleString('pt-BR', { maximumFractionDigits: d });
const pct = n => (isFinite(n) ? n : 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
const fdate = d => d ? new Date(d.length === 10 ? d + 'T12:00' : d).toLocaleDateString('pt-BR') : '—';
const fdt = d => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const ymNow = () => today().slice(0, 7);
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_L = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const ymLabel = ym => { const [y, m] = ym.split('-'); return `${MESES_L[+m - 1]} ${y}`; };
const ymShift = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const idade = nasc => { if (!nasc) return null; const n = new Date(nasc + 'T12:00'), h = new Date(); let a = h.getFullYear() - n.getFullYear(); if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate())) a--; return a; };
const initials = n => (n || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
const sum = (arr, f) => arr.reduce((s, x) => s + (+f(x) || 0), 0);

const ICON = {
  dash: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/>',
  needle: '<path d="M18 2l4 4M14.5 5.5l4 4M3 21l9-9M8.5 9.5l6 6M12 6l6 6-5 5-6-6z"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>',
  gem: '<path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3L8 9l4 13 4-13-3-6M2 9h20"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  money: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  team: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>',
  left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>', check: '<path d="M20 6L9 17l-5-5"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  wa: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>',
  print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  in: '<path d="M12 5v14M19 12l-7 7-7-7"/>', out: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  repeat: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  coffee: '<path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/>',
  menu: '<path d="M3 12h18M3 6h18M3 18h18"/>', logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>', copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  clip: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', trend: '<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>'
};
const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n] || ''}</svg>`;

const UI = {
  toast(msg, type = 'ok') {
    let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; box.appendChild(t);
    setTimeout(() => { t.style.opacity = 0; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3200);
  },

  modal({ title, body, size = '', foot, onOpen }) {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${size}"><div class="modal-h"><h2>${title}</h2><button class="btn ghost icon" data-close>${ic('x')}</button></div><div class="modal-b">${body}</div>${foot !== false ? `<div class="modal-f">${foot || '<button class="btn" data-close>Fechar</button>'}</div>` : ''}</div>`;
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape' && [...document.querySelectorAll('.modal-bg')].pop() === bg) { e.stopImmediatePropagation(); close(); } };
    document.addEventListener('keydown', onKey);
    bg.addEventListener('mousedown', e => { if (e.target === bg) bg._down = true; });
    bg.addEventListener('mouseup', e => { if (e.target === bg && bg._down) close(); bg._down = false; });
    $$('[data-close]', bg).forEach(b => b.onclick = close);
    document.body.appendChild(bg);
    const api = { el: bg, close, $: s => $(s, bg), $$: s => $$(s, bg) };
    if (onOpen) onOpen(api);
    const first = $('input:not([type=hidden]):not([readonly]),select,textarea', bg); if (first && !first.closest('.no-autofocus')) setTimeout(() => first.focus(), 50);
    return api;
  },

  confirm(msg, onYes, { yes = 'Confirmar', danger = true } = {}) {
    UI.modal({ title: 'Confirmação', size: 'sm', body: `<p>${msg}</p>`, foot: `<button class="btn" data-close>Cancelar</button><button class="btn ${danger ? 'pri' : 'ok'}" id="cf-yes">${yes}</button>`,
      onOpen: m => m.$('#cf-yes').onclick = () => { m.close(); onYes(); } });
  },

  /* Campo de formulário */
  f(label, name, value = '', { type = 'text', col = 6, opts, help, attrs = '', ph = '', step } = {}) {
    let input;
    if (type === 'select') input = `<select name="${name}" ${attrs}>${(opts || []).map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value ?? '') ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
    else if (type === 'textarea') input = `<textarea name="${name}" placeholder="${esc(ph)}" ${attrs}>${esc(value)}</textarea>`;
    else input = `<input type="${type}" name="${name}" value="${esc(value)}" placeholder="${esc(ph)}" ${step ? `step="${step}"` : (type === 'number' ? 'step="any"' : '')} ${attrs}>`;
    return `<div class="f c${col}"><label>${label}</label>${input}${help ? `<span class="help">${help}</span>` : ''}</div>`;
  },

  formData(el) {
    const o = {};
    $$('[name]', el).forEach(i => {
      if (i.type === 'checkbox') o[i.name] = i.checked;
      else if (i.type === 'radio') { if (i.checked) o[i.name] = i.value; }
      else if (i.type === 'number') o[i.name] = i.value === '' ? '' : +i.value;
      else o[i.name] = i.value.trim();
    });
    return o;
  },

  opts(col, { empty = '— selecione —', filter, label = r => r.nome } = {}) {
    let rows = DB.all(col); if (filter) rows = rows.filter(filter);
    rows.sort((a, b) => label(a).localeCompare(label(b)));
    return [['', empty], ...rows.map(r => [r.id, label(r)])];
  },

  empty(msg, icon = 'box') { return `<div class="empty">${ic(icon)}<div>${msg}</div></div>`; },

  statusPill(s) {
    const m = { agendado: ['info', 'Agendado'], confirmado: ['ok', 'Confirmado'], concluido: ['', 'Concluído'], cancelado: ['bad', 'Cancelado'], faltou: ['warn', 'Faltou'],
      pago: ['ok', 'Pago'], pendente: ['warn', 'Pendente'], atrasado: ['bad', 'Atrasado'], nova: ['acc', 'Nova'], revisada: ['ok', 'Revisada'], arquivada: ['', 'Arquivada'],
      andamento: ['info', 'Em andamento'], rascunho: ['', 'Rascunho'], enviado: ['info', 'Enviado'], aprovado: ['ok', 'Aprovado'], recusado: ['bad', 'Recusado'], expirado: ['', 'Expirado'],
      liberado: ['ok', 'Liberado'], reprovado: ['bad', 'Reprovado'], vencido: ['warn', 'Vencido'] };
    const [c, t] = m[s] || ['', s || '—']; return `<span class="pill ${c}">${t}</span>`;
  },

  wa(tel, msg) { const n = (tel || '').replace(/\D/g, ''); return `https://wa.me/${n.length <= 11 ? '55' + n : n}?text=${encodeURIComponent(msg || '')}`; },

  copy(txt) { navigator.clipboard?.writeText(txt).then(() => UI.toast('Copiado!')).catch(() => prompt('Copie:', txt)); },

  download(name, content, type = 'application/json') {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },

  csv(rows) { return '﻿' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n'); },

  /* Tabela com ordenação */
  table(cols, rows, { id = 'tbl', foot = '', emptyMsg = 'Nenhum registro encontrado' } = {}) {
    if (!rows.length) return `<div class="tbl-wrap">${UI.empty(emptyMsg)}</div>`;
    return `<div class="tbl-wrap"><table class="tbl" id="${id}"><thead><tr>${cols.map(c => `<th class="${c.cls || ''}">${c.t}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr ${r._attr || ''}>${cols.map(c => `<td class="${c.cls || ''}">${c.v(r)}</td>`).join('')}</tr>`).join('')}</tbody>${foot ? `<tfoot>${foot}</tfoot>` : ''}</table></div>`;
  },

  /* ---------- Gráficos SVG ---------- */
  barChart(labels, series, { h = 220, colors = ['#7fae55', '#3b5243', '#e0bf6e'], fmt = brl } = {}) {
    const W = 640, H = h, pl = 54, pb = 26, pt = 12, pr = 8;
    const dmax = Math.max(0, ...series.flatMap(s => s.data)); const max = dmax > 0 ? dmax * 1.1 : 100;
    const n = labels.length, gw = (W - pl - pr) / n, bw = Math.min(26, (gw - 10) / series.length);
    const y = v => pt + (H - pt - pb) * (1 - v / max);
    let g = '';
    for (let i = 0; i <= 4; i++) { const v = max * i / 4, yy = y(v); g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" stroke="#22342a"/><text x="${pl - 8}" y="${yy + 4}" text-anchor="end">${v >= 1000 ? num(v / 1000, 1) + 'k' : num(v, 0)}</text>`; }
    labels.forEach((l, i) => {
      const x0 = pl + gw * i + (gw - bw * series.length) / 2;
      series.forEach((s, j) => { const v = s.data[i] || 0, yy = y(Math.max(0, v)); g += `<rect x="${x0 + j * bw}" y="${yy}" width="${bw - 3}" height="${Math.max(0, H - pb - yy)}" rx="3" fill="${s.color || colors[j]}"><title>${s.name}: ${fmt(v)}</title></rect>`; });
      g += `<text x="${pl + gw * i + gw / 2}" y="${H - 8}" text-anchor="middle">${l}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg><div class="legend mt">${series.map((s, j) => `<span><i class="dot" style="background:${s.color || colors[j]}"></i>${s.name}</span>`).join('')}</div>`;
  },

  lineChart(labels, data, { h = 200, color = '#9cc96e', fmt = brl } = {}) {
    const W = 640, H = h, pl = 54, pb = 26, pt = 12, pr = 12;
    const mn = Math.min(0, ...data), dmx = Math.max(0, ...data), mx = dmx > 0 ? dmx * 1.1 : (mn < 0 ? 0 : 100);
    const x = i => pl + (W - pl - pr) * (labels.length > 1 ? i / (labels.length - 1) : .5), y = v => pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn));
    let g = ''; for (let i = 0; i <= 4; i++) { const v = mn + (mx - mn) * i / 4; g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="#22342a"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${Math.abs(v) >= 1000 ? num(v / 1000, 1) + 'k' : num(v, 0)}</text>`; }
    if (mn < 0) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" stroke="#555" stroke-dasharray="4"/>`;
    const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    g += `<polygon points="${x(0)},${y(Math.max(mn, 0))} ${pts} ${x(data.length - 1)},${y(Math.max(mn, 0))}" fill="${color}" opacity=".12"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
    data.forEach((v, i) => g += `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${v < 0 ? '#e0624f' : color}"><title>${labels[i]}: ${fmt(v)}</title></circle><text x="${x(i)}" y="${H - 8}" text-anchor="middle">${labels[i]}</text>`);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>`;
  },

  donut(items, { size = 170, fmt = brl } = {}) {
    const pal = ['#7fae55', '#e0bf6e', '#5fb3a1', '#c98a5a', '#a7c4a0', '#d9cfb5', '#3f8f6b', '#b5a26a', '#6fb0c9', '#8a9a5b', '#e6d38a', '#9e7b5a'];
    const tot = items.reduce((s, i) => s + i.v, 0) || 1; let a = -Math.PI / 2; const r = 70, R = 85, c = size / 2;
    let p = '';
    items.forEach((it, i) => {
      const ang = it.v / tot * Math.PI * 2; if (ang <= 0) return;
      const a2 = a + Math.min(ang, Math.PI * 2 - 0.0001), large = ang > Math.PI ? 1 : 0;
      const P = (rad, an) => `${c + rad * Math.cos(an)},${c + rad * Math.sin(an)}`;
      p += `<path d="M${P(R, a)} A${R},${R} 0 ${large} 1 ${P(R, a2)} L${P(r, a2)} A${r},${r} 0 ${large} 0 ${P(r, a)} Z" fill="${pal[i % pal.length]}"><title>${it.k}: ${fmt(it.v)}</title></path>`;
      a = a2;
    });
    return `<div class="donut-wrap"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${p}<text x="${c}" y="${c - 2}" text-anchor="middle" fill="#ece6d6" font-size="15" font-weight="700">${fmt(tot)}</text><text x="${c}" y="${c + 15}" text-anchor="middle" fill="#9aab95" font-size="10">TOTAL</text></svg>
      <div class="donut-leg">${items.map((it, i) => `<div><i class="dot" style="background:${pal[i % pal.length]}"></i>${esc(it.k)}<b>${fmt(it.v)}</b></div>`).join('')}</div></div>`;
  }
};
