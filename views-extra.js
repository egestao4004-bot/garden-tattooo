/* ============================================================
   FOTOS · ESTERILIZAÇÃO · ORÇAMENTOS & PROJETOS · PORTFÓLIO · USUÁRIOS
   Desenvolvido por Evander
   ============================================================ */

/* ---------------- FOTOS (sem Storage pago) ----------------
   As fotos são comprimidas no navegador (JPEG ~1280px) e salvas:
   - Firebase: coleção "fotos" do Firestore (cabe no plano gratuito, 1 GB)
   - Demo: IndexedDB do navegador
   Ficam fora do cache principal e são carregadas sob demanda. */
const Fotos = {
  _idb: null,
  idb() {
    if (this._idb) return this._idb;
    return this._idb = new Promise((res, rej) => { const r = indexedDB.open('gardentattoo_fotos', 1); r.onupgradeneeded = () => r.result.createObjectStore('fotos', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  },
  async compress(file, max = 1280, q = 0.72) {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src);
    let out = c.toDataURL('image/jpeg', q);
    if (out.length > 700000) out = c.toDataURL('image/jpeg', 0.55); // limite de 1 MB por documento no Firestore
    return out;
  },
  async add(meta, file) {
    const doc = { tipo: 'Outros', ...meta, id: uid(), img: await this.compress(file), thumb: await this.compress(file, 360, 0.62), data: meta.data || today(), criadoEm: new Date().toISOString(), usuario: DB.user?.nome || '' };
    Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);
    if (DB.mode === 'firebase') await DB.fs.collection('fotos').doc(doc.id).set(doc);
    else { const d = await this.idb(); await new Promise((res, rej) => { const t = d.transaction('fotos', 'readwrite'); t.objectStore('fotos').put(doc); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
    return doc;
  },
  async list(filter = {}) {
    let arr = [];
    const keys = Object.keys(filter).filter(k => filter[k]);
    if (DB.mode === 'firebase') {
      let q = DB.fs.collection('fotos');
      if (keys.length) q = q.where(keys[0], '==', filter[keys[0]]); else q = q.orderBy('criadoEm', 'desc').limit(200);
      arr = (await q.get()).docs.map(d => d.data());
    } else {
      const d = await this.idb();
      arr = await new Promise(res => { const r = d.transaction('fotos').objectStore('fotos').getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); });
    }
    return arr.filter(f => keys.every(k => f[k] === filter[k])).sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
  },
  async remove(id) {
    if (DB.mode === 'firebase') return DB.fs.collection('fotos').doc(id).delete();
    const d = await this.idb(); return new Promise(res => { const t = d.transaction('fotos', 'readwrite'); t.objectStore('fotos').delete(id); t.oncomplete = res; });
  },
  ver(f) {
    const c = DB.get('clientes', f.clienteId), p = DB.get('profissionais', f.profissionalId);
    UI.modal({ title: esc(f.tipo || 'Foto'), size: 'lg', body: `<div class="lightbox"><img src="${f.img}"></div><div class="row mt small muted">${fdate(f.data)}${p ? ' · ' + esc(p.nome) : ''}${c && Perm.gestao() ? ' · ' + esc(c.nome) : ''}${f.legenda ? ' · ' + esc(f.legenda) : ''}</div>`,
      foot: `<a class="btn" href="${f.img}" download="foto-${f.id}.jpg">${ic('download')} Baixar</a><span class="grow"></span><button class="btn" data-close>Fechar</button>` });
  },
  grid(fotos, { meta = false, del = false } = {}) {
    return fotos.map(f => `<div class="foto" data-f="${f.id}"><img src="${f.thumb || f.img}" loading="lazy" alt="">${meta ? `<div class="meta"><b>${esc(DB.get('profissionais', f.profissionalId)?.nome || '')}</b><br>${esc(f.tipo || '')} · ${fdate(f.data)}</div>` : `<span class="tag">${esc(f.tipo || '')}</span>`}${del ? `<button class="del" data-del="${f.id}" title="Excluir">✕</button>` : ''}</div>`).join('');
  },
  /* Componente: grade + botão de envio, ligado a um registro */
  async widget(el, meta, { tipos = ['Outros'], readonly = false, emptyMsg = 'Nenhuma foto ainda' } = {}) {
    if (!el) return;
    el.innerHTML = `${readonly ? '' : `<div class="row mb"><select class="fw-tipo" style="width:auto">${tipos.map(t => `<option>${t}</option>`).join('')}</select><label class="btn sm">${ic('camera')} Adicionar fotos<input type="file" accept="image/*" multiple hidden class="fw-in"></label><span class="fw-st small muted"></span></div>`}<div class="foto-grid"><div class="muted small">Carregando fotos...</div></div>`;
    const draw = async () => {
      const filt = {}; ['refId', 'clienteId', 'projetoId'].forEach(k => { if (meta[k]) filt[k] = meta[k]; });
      const k = filt.refId ? { refId: filt.refId } : filt.projetoId ? { projetoId: filt.projetoId } : { clienteId: filt.clienteId };
      let fotos = []; try { fotos = await this.list(k); } catch (e) { console.error(e); }
      const g = $('.foto-grid', el); if (!g) return;
      g.innerHTML = fotos.length ? this.grid(fotos, { del: !readonly && Perm.gestao() }) : `<div class="muted small">${emptyMsg}</div>`;
      $$('[data-f]', g).forEach(x => x.onclick = e => { if (e.target.dataset.del) return; this.ver(fotos.find(f => f.id === x.dataset.f)); });
      $$('[data-del]', g).forEach(b => b.onclick = e => { e.stopPropagation(); UI.confirm('Excluir esta foto?', async () => { await this.remove(b.dataset.del); draw(); }); });
    };
    if (!readonly) $('.fw-in', el).onchange = async e => {
      const files = [...e.target.files]; if (!files.length) return; const st = $('.fw-st', el);
      for (let i = 0; i < files.length; i++) { st.textContent = `Comprimindo e enviando ${i + 1}/${files.length}...`; try { await this.add({ ...meta, tipo: $('.fw-tipo', el).value }, files[i]); } catch (er) { UI.toast('Erro ao enviar foto: ' + er.message, 'err'); } }
      st.textContent = ''; e.target.value = ''; UI.toast(files.length > 1 ? `${files.length} fotos adicionadas` : 'Foto adicionada'); draw();
    };
    draw();
  }
};

/* ---------------- Opções compartilhadas ---------------- */
Forms.loteOpts = (data, atual) => {
  const d = data || today();
  const lotes = DB.all('esterilizacoes').filter(e => e.id === atual || (e.status === 'liberado' && e.data <= d && e.validade >= d)).sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));
  return `<option value="">— sem lote / material descartável —</option>` + lotes.map(e => `<option value="${e.id}" ${e.id === atual ? 'selected' : ''}>${esc(e.lote)} · ${fdate(e.data)} · ${esc((e.itens || []).slice(0, 3).join(', '))}${e.biologico === 'pendente' ? ' (biológico pendente)' : ''}</option>`).join('');
};
Forms.projetoOpts = (clienteId, atual) => {
  const ps = DB.all('projetos').filter(p => p.clienteId === clienteId && (p.status === 'andamento' || p.id === atual));
  return `<option value="">— atendimento avulso —</option>` + ps.map(p => `<option value="${p.id}" ${p.id === atual ? 'selected' : ''}>${esc(p.titulo)} (${p.sessoesPrevistas} sessões)</option>`).join('');
};

/* ============================================================
   BIOSSEGURANÇA — ESTERILIZAÇÃO / AUTOCLAVE
   ============================================================ */
const ITENS_ESTERIL = ['Pinças', 'Tubos / biqueiras', 'Agulhas de piercing', 'Cânulas', 'Joias (1ª colocação)', 'Bandejas', 'Grips', 'Tesouras', 'Campos de tecido', 'Outros'];
Views.biosseguranca = {
  title: 'Esterilização & Biossegurança', st: { ym: ymNow() },
  sub() { return 'Registro dos ciclos de autoclave, indicadores e rastreabilidade de cada lote até o cliente'; },
  status(e) { return e.status === 'reprovado' ? 'reprovado' : e.validade < today() ? 'vencido' : 'liberado'; },
  alertas() {
    const E = DB.all('esterilizacoes'), out = [];
    const pend = E.filter(e => e.biologico === 'pendente'); if (pend.length) out.push({ cls: 'warn', pill: pend.length, t: 'Indicador biológico aguardando leitura', sub: pend.map(e => e.lote).join(', '), href: '#/biosseguranca' });
    const rep = E.filter(e => e.status === 'reprovado' && e.data >= ymShift(ymNow(), -1)); if (rep.length) out.push({ cls: 'bad', pill: rep.length, t: 'Ciclo reprovado — verificar rastreabilidade', sub: rep.map(e => e.lote).join(', '), href: '#/biosseguranca' });
    const d = new Date(); if (d.getDay() !== 0 && !E.some(e => e.data === today())) out.push({ cls: 'info', pill: '!', t: 'Nenhum ciclo de autoclave registrado hoje', sub: 'Registre o ciclo antes dos procedimentos', href: '#/biosseguranca' });
    return out;
  },
  cardHoje() {
    const E = DB.all('esterilizacoes'), hoje = E.filter(e => e.data === today()), validos = E.filter(e => this.status(e) === 'liberado');
    return `<div class="card"><h3>${ic('shield')} Biossegurança <span class="sp"></span><a class="small" href="#/biosseguranca">abrir</a></h3>
      <div class="total-line"><span>Ciclos hoje</span><b>${hoje.length}</b></div>
      <div class="total-line"><span>Lotes válidos disponíveis</span><b>${validos.length}</b></div>
      <div class="total-line"><span>Biológicos pendentes</span><b class="${E.some(e => e.biologico === 'pendente') ? 'down' : ''}">${E.filter(e => e.biologico === 'pendente').length}</b></div>
      ${hoje.length ? hoje.map(e => `<div class="li"><span class="pill ok">${esc(e.hora)}</span><div><div class="t">${esc(e.lote)}</div><small>${esc((e.itens || []).join(', '))}</small></div></div>`).join('') : `<div class="alert info mt">Nenhum ciclo hoje.</div>`}
      <button class="btn sm mt" onclick="Views.biosseguranca.form()">${ic('plus')} Registrar ciclo</button></div>`;
  },
  render(el) {
    const st = this.st, E = DB.all('esterilizacoes');
    const doMes = E.filter(e => e.data.startsWith(st.ym)).sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));
    const ult = [...E].sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora))[0];
    const bioSem = E.filter(e => e.biologico && e.biologico !== 'nao').sort((a, b) => b.data.localeCompare(a.data))[0];
    const usos = {}; DB.all('atendimentos').forEach(a => { if (a.loteEsterilizacao) usos[a.loteEsterilizacao] = (usos[a.loteEsterilizacao] || 0) + 1; });
    App.actions(`<button class="btn" id="bRast">${ic('search')} Rastrear lote</button><button class="btn pri" id="bNovo">${ic('plus')} Registrar ciclo</button>`);
    el.innerHTML = `${this.alertas().map(a => `<div class="alert ${a.cls === 'bad' ? 'bad' : a.cls === 'warn' ? 'warn' : 'info'} mb">${ic('alert')}<div><b>${a.t}</b> — ${esc(a.sub)}</div></div>`).join('')}
      <div class="grid g4 mb">
        <div class="card kpi green"><div class="ic">${ic('shield')}</div><div class="lbl">Ciclos no mês</div><div class="val">${doMes.length}</div><div class="hint">${doMes.filter(e => e.status === 'reprovado').length} reprovado(s)</div></div>
        <div class="card kpi"><div class="ic">${ic('clock')}</div><div class="lbl">Último ciclo</div><div class="val" style="font-size:20px">${ult ? fdate(ult.data) + ' ' + ult.hora : '—'}</div><div class="hint">${ult ? esc(ult.lote) : ''}</div></div>
        <div class="card kpi gold"><div class="ic">${ic('check')}</div><div class="lbl">Último teste biológico</div><div class="val" style="font-size:20px">${bioSem ? fdate(bioSem.data) : '—'}</div><div class="hint">${bioSem ? (bioSem.biologico === 'negativo' ? '<span class="up">Negativo (aprovado)</span>' : bioSem.biologico === 'positivo' ? '<span class="down">POSITIVO</span>' : 'aguardando leitura') : 'recomendado semanalmente'}</div></div>
        <div class="card kpi blue"><div class="ic">${ic('box')}</div><div class="lbl">Lotes válidos</div><div class="val">${E.filter(e => this.status(e) === 'liberado').length}</div><div class="hint">validade de ${DB.config.validadeEsterilizacao || 30} dias</div></div></div>
      <div class="toolbar"><button class="btn icon" id="mP">${ic('left')}</button><b style="min-width:130px;text-align:center">${ymLabel(st.ym)}</b><button class="btn icon" id="mN">${ic('right')}</button><span class="grow"></span><button class="btn sm" id="bCsv">${ic('download')} Exportar livro de registro (CSV)</button></div>
      ${UI.table([
        { t: 'Data / hora', v: e => `<b>${fdate(e.data)}</b><small>${e.hora}</small>` },
        { t: 'Lote', v: e => `<span class="strong nowrap">${esc(e.lote)}</span><small>ciclo nº ${e.ciclo || '—'}</small>` },
        { t: 'Tipo', v: e => esc(e.tipoCiclo || 'Rotina') },
        { t: 'Parâmetros', v: e => `<span class="nowrap">${num(e.temperatura, 1)}°C · ${num(e.pressao, 2)} kgf</span><small>${e.tempo} + ${e.secagem || 0} min</small>` },
        { t: 'Itens', v: e => `${esc((e.itens || []).join(', '))}<small>${e.pacotes || 0} pacote(s)</small>` },
        { t: 'Indicadores', v: e => `${e.quimico === 'ok' ? '<span class="pill ok">Químico OK</span>' : '<span class="pill bad">Químico falhou</span>'} ${e.biologico === 'pendente' ? '<span class="pill warn">Bio pendente</span>' : e.biologico === 'negativo' ? '<span class="pill ok">Bio negativo</span>' : e.biologico === 'positivo' ? '<span class="pill bad">Bio POSITIVO</span>' : ''}` },
        { t: 'Validade', v: e => `${fdate(e.validade)}<small>${usos[e.id] || 0} atend.</small>` },
        { t: 'Status', v: e => UI.statusPill(this.status(e)) },
        { t: '', cls: 'act', v: e => `${e.biologico === 'pendente' ? `<button class="btn sm ok" data-bio="${e.id}">Ler biológico</button>` : ''}<button class="btn sm icon" data-v="${e.id}">${ic('eye')}</button>${Perm.gestao() ? `<button class="btn sm icon" data-e="${e.id}">${ic('edit')}</button>` : ''}` }
      ], doMes, { emptyMsg: 'Nenhum ciclo registrado neste mês' })}
      <div class="alert info mt">${ic('shield')}<div>Registro conforme as boas práticas da vigilância sanitária para estúdios (RDC 15/2012 e normas estaduais/municipais): cada ciclo gera um <b>lote</b> com validade; o lote é informado no atendimento e fica vinculado ao cliente. Se um indicador falhar, o sistema lista todos os clientes atendidos com aquele lote.</div></div>`;
    $$('[data-v]', el).forEach(b => b.onclick = () => this.ver(b.dataset.v));
    $$('[data-e]', el).forEach(b => b.onclick = () => this.form(DB.get('esterilizacoes', b.dataset.e)));
    $$('[data-bio]', el).forEach(b => b.onclick = () => this.lerBio(b.dataset.bio));
    $('#bNovo').onclick = () => this.form();
    $('#bRast').onclick = () => this.rastrear();
    $('#mP').onclick = () => { st.ym = ymShift(st.ym, -1); this.render(el); };
    $('#mN').onclick = () => { st.ym = ymShift(st.ym, 1); this.render(el); };
    $('#bCsv').onclick = () => UI.download(`esterilizacao-${st.ym}.csv`, UI.csv([['Data', 'Hora', 'Lote', 'Equipamento', 'Ciclo', 'Tipo', 'Temperatura °C', 'Pressão', 'Tempo min', 'Secagem min', 'Itens', 'Pacotes', 'Indicador químico', 'Indicador biológico', 'Validade', 'Responsável', 'Status'], ...doMes.map(e => [fdate(e.data), e.hora, e.lote, e.equipamento, e.ciclo, e.tipoCiclo, e.temperatura, e.pressao, e.tempo, e.secagem, (e.itens || []).join(' / '), e.pacotes, e.quimico, e.biologico, fdate(e.validade), DB.get('profissionais', e.responsavelId)?.nome || '', this.status(e)])]), 'text/csv');
  },
  calcStatus(e) { return e.quimico === 'falha' || e.biologico === 'positivo' ? 'reprovado' : 'liberado'; },
  form(e = {}) {
    const edit = !!e.id, cfg = DB.config, eqs = cfg.autoclaves?.length ? cfg.autoclaves : ['Autoclave'];
    const hoje = today(), seq = DB.all('esterilizacoes').filter(x => x.data === hoje).length + 1;
    const ultCiclo = Math.max(0, ...DB.all('esterilizacoes').map(x => +x.ciclo || 0));
    e = { data: hoje, hora: new Date().toTimeString().slice(0, 5), equipamento: eqs[0], ciclo: ultCiclo + 1, tipoCiclo: 'Rotina', temperatura: 134, pressao: 2.1, tempo: 18, secagem: 20, itens: ['Pinças', 'Agulhas de piercing'], pacotes: 6, quimico: 'ok', biologico: 'nao', responsavelId: Perm.profId() || '', ...e };
    UI.modal({ title: edit ? 'Editar ciclo de esterilização' : 'Registrar ciclo de autoclave', size: 'lg', body: `<form class="fg" id="eF">
      ${UI.f('Data', 'data', e.data, { type: 'date', col: 3 })}${UI.f('Hora', 'hora', e.hora, { type: 'time', col: 2 })}${UI.f('Equipamento', 'equipamento', e.equipamento, { type: 'select', col: 4, opts: eqs })}${UI.f('Nº do ciclo', 'ciclo', e.ciclo, { type: 'number', col: 3 })}
      ${UI.f('Tipo de ciclo', 'tipoCiclo', e.tipoCiclo, { type: 'select', col: 4, opts: ['Rotina', 'Teste Bowie-Dick', 'Teste de vácuo', 'Teste biológico semanal', 'Após manutenção'] })}
      ${UI.f('Temperatura (°C)', 'temperatura', e.temperatura, { type: 'number', col: 2 })}${UI.f('Pressão (kgf/cm²)', 'pressao', e.pressao, { type: 'number', col: 2 })}${UI.f('Esterilização (min)', 'tempo', e.tempo, { type: 'number', col: 2 })}${UI.f('Secagem (min)', 'secagem', e.secagem, { type: 'number', col: 2 })}
      <div class="f c12"><label>Itens esterilizados</label><div class="row">${ITENS_ESTERIL.map(i => `<label class="pill" style="cursor:pointer;text-transform:none;font-size:12px"><input type="checkbox" data-item="${i}" ${(e.itens || []).includes(i) ? 'checked' : ''}> ${i}</label>`).join('')}</div></div>
      ${UI.f('Qtd. de pacotes', 'pacotes', e.pacotes, { type: 'number', col: 3 })}
      ${UI.f('Indicador químico (fita/integrador)', 'quimico', e.quimico, { type: 'select', col: 4, opts: [['ok', 'Virou corretamente (OK)'], ['falha', 'Não virou (FALHA)']] })}
      ${UI.f('Indicador biológico', 'biologico', e.biologico, { type: 'select', col: 5, opts: [['nao', 'Não realizado neste ciclo'], ['pendente', 'Em incubação (aguardando leitura)'], ['negativo', 'Negativo — esterilização eficaz'], ['positivo', 'POSITIVO — falha na esterilização']] })}
      ${UI.f('Responsável', 'responsavelId', e.responsavelId, { type: 'select', col: 6, opts: UI.opts('profissionais', { empty: '—' }) })}${UI.f('Validade dos pacotes (dias)', 'validadeDias', e.validadeDias || cfg.validadeEsterilizacao || 30, { type: 'number', col: 3 })}
      ${UI.f('Lote', 'lote', e.lote || `E${hoje.replace(/-/g, '')}-${String(seq).padStart(2, '0')}`, { col: 3, help: 'anote nos envelopes' })}
      ${UI.f('Observações', 'obs', e.obs, { type: 'textarea', col: 12 })}
      <div class="c12"><div class="alert info">${ic('camera')}Depois de salvar, abra o ciclo para anexar a foto do indicador e da impressão/display da autoclave.</div></div></form>`,
      foot: `${edit && Perm.isAdmin() ? `<button class="btn danger" id="eDel">${ic('trash')}</button><span class="grow"></span>` : ''}<button class="btn" data-close>Cancelar</button><button class="btn pri" id="eOk">Salvar ciclo</button>`,
      onOpen: m => {
        if (!edit) m.$('[name=data]').addEventListener('change', ev => { const ds = ev.target.value; const n = DB.all('esterilizacoes').filter(x => x.data === ds).length + 1; m.$('[name=lote]').value = `E${ds.replace(/-/g, '')}-${String(n).padStart(2, '0')}`; });
        m.$('#eOk').onclick = () => {
          const d = UI.formData(m.$('#eF')); d.itens = $$('[data-item]', m.el).filter(i => i.checked).map(i => i.dataset.item);
          if (!d.itens.length) return UI.toast('Marque os itens esterilizados', 'warn');
          const v = new Date(d.data + 'T12:00'); v.setDate(v.getDate() + (+d.validadeDias || 30)); d.validade = isoLocal(v);
          const r = { ...e, ...d }; r.status = this.calcStatus(r);
          DB.save('esterilizacoes', r); m.close();
          UI.toast(r.status === 'reprovado' ? 'Ciclo REPROVADO — não use este lote' : `Ciclo salvo — lote ${r.lote} liberado`, r.status === 'reprovado' ? 'err' : 'ok');
          if (r.status === 'reprovado') this.ver(r.id);
        };
        if (m.$('#eDel')) m.$('#eDel').onclick = () => UI.confirm('Excluir este registro de esterilização?', () => { DB.remove('esterilizacoes', e.id); m.close(); });
      }
    });
  },
  lerBio(id) {
    const e = DB.get('esterilizacoes', id);
    UI.modal({ title: `Leitura do indicador biológico — ${esc(e.lote)}`, size: 'sm', body: `<form class="fg" id="bF">${UI.f('Resultado', 'biologico', 'negativo', { type: 'select', col: 12, opts: [['negativo', 'Negativo (sem crescimento) — aprovado'], ['positivo', 'POSITIVO (houve crescimento) — reprovado']] })}${UI.f('Data da leitura', 'bioLeitura', today(), { type: 'date', col: 12 })}</form>`,
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="bOk">Registrar</button>`,
      onOpen: m => m.$('#bOk').onclick = () => { Object.assign(e, UI.formData(m.$('#bF'))); e.status = this.calcStatus(e); DB.save('esterilizacoes', e); m.close(); if (e.status === 'reprovado') { UI.toast('Resultado POSITIVO — veja os clientes afetados', 'err'); this.ver(e.id); } else UI.toast('Biológico negativo registrado'); } });
  },
  ver(id) {
    const e = DB.get('esterilizacoes', id); if (!e) return;
    const ats = DB.all('atendimentos').filter(a => a.loteEsterilizacao === id).sort((a, b) => a.data.localeCompare(b.data));
    const resp = DB.get('profissionais', e.responsavelId);
    UI.modal({ title: `Lote ${esc(e.lote)}`, size: 'lg', body: `
      <div class="row mb">${UI.statusPill(this.status(e))}<span class="muted small">${fdate(e.data)} ${e.hora} · ${esc(e.equipamento || '')} · ciclo nº ${e.ciclo} · ${esc(e.tipoCiclo || '')}</span></div>
      ${e.status === 'reprovado' ? `<div class="alert bad mb">${ic('alert')}<div><b>Lote reprovado.</b> ${ats.length ? `${ats.length} atendimento(s) usaram material deste lote. Recomenda-se contatar os clientes para acompanhamento e revisar a autoclave antes de novos ciclos.` : 'Nenhum atendimento usou este lote.'}</div></div>` : ''}
      <div class="calc-box"><div><small>Temperatura</small><b>${num(e.temperatura, 1)} °C</b></div><div><small>Pressão</small><b>${num(e.pressao, 2)} kgf/cm²</b></div><div><small>Esterilização</small><b>${e.tempo} min</b></div><div><small>Secagem</small><b>${e.secagem || 0} min</b></div><div><small>Pacotes</small><b>${e.pacotes || 0}</b></div><div><small>Validade</small><b>${fdate(e.validade)}</b></div></div>
      <div class="grid g2 mt small"><div><span class="muted">Itens:</span> ${esc((e.itens || []).join(', '))}</div><div><span class="muted">Responsável:</span> ${esc(resp?.nome || '—')}</div>
      <div><span class="muted">Indicador químico:</span> ${e.quimico === 'ok' ? 'OK' : '<b class="down">FALHA</b>'}</div><div><span class="muted">Indicador biológico:</span> ${{ nao: 'não realizado', pendente: 'em incubação', negativo: 'negativo (aprovado)' + (e.bioLeitura ? ' — lido em ' + fdate(e.bioLeitura) : ''), positivo: '<b class="down">POSITIVO</b>' }[e.biologico] || '—'}</div></div>
      ${e.obs ? `<div class="alert info mt">${esc(e.obs)}</div>` : ''}
      <h3 class="mt mb" style="font-size:13px;color:var(--muted)">FOTOS (INDICADORES / IMPRESSÃO DO CICLO)</h3><div id="eFotos"></div>
      <h3 class="mt mb" style="font-size:13px;color:var(--muted)">RASTREABILIDADE — ATENDIMENTOS COM ESTE LOTE</h3>
      ${UI.table([{ t: 'Data', v: a => fdate(a.data) }, { t: 'Cliente', v: a => `<span class="strong">${esc(DB.get('clientes', a.clienteId)?.nome || '')}</span><small>${esc(DB.get('clientes', a.clienteId)?.telefone || '')}</small>` }, { t: 'Procedimento', v: a => esc(DB.get('servicos', a.servicoId)?.nome || '') }, { t: 'Profissional', v: a => esc(DB.get('profissionais', a.profissionalId)?.nome || '') }, { t: '', cls: 'act', v: a => `<a class="btn sm" target="_blank" href="${UI.wa(DB.get('clientes', a.clienteId)?.telefone, '')}">${ic('wa')}</a>` }], ats, { emptyMsg: 'Nenhum atendimento vinculado a este lote' })}`,
      foot: `<button class="btn" onclick="window.print()">${ic('print')} Imprimir</button><span class="grow"></span><button class="btn" data-close>Fechar</button>`,
      onOpen: m => Fotos.widget(m.$('#eFotos'), { refTipo: 'esterilizacao', refId: e.id }, { tipos: ['Indicador químico', 'Indicador biológico', 'Impressão / display do ciclo'] }) });
  },
  rastrear() {
    UI.modal({ title: 'Rastrear lote de esterilização', size: 'sm', body: `<div class="f"><label>Código do lote (como está no envelope)</label><input id="rL" placeholder="Ex.: E20261109-01"></div><div id="rR" class="mt"></div>`,
      foot: `<button class="btn" data-close>Fechar</button><button class="btn pri" id="rOk">Buscar</button>`,
      onOpen: m => { const go = () => { const q = m.$('#rL').value.trim().toUpperCase(); const e = DB.all('esterilizacoes').find(x => x.lote.toUpperCase() === q); if (e) { m.close(); this.ver(e.id); } else m.$('#rR').innerHTML = '<div class="alert warn">Lote não encontrado.</div>'; }; m.$('#rOk').onclick = go; m.$('#rL').onkeydown = ev => ev.key === 'Enter' && go(); } });
  }
};

/* ============================================================
   ORÇAMENTOS & PROJETOS
   ============================================================ */
const ESTILOS = ['Fine line', 'Blackwork', 'Realismo', 'Old school', 'Neo tradicional', 'Aquarela', 'Geométrico', 'Pontilhismo', 'Lettering', 'Botânico', 'Oriental', 'Cobertura (cover-up)', 'Outro'];
Views.orcamentos = {
  title: 'Orçamentos & Projetos', st: { tab: 'orc', status: 'enviado', q: '' },
  sub() { return 'Do pedido do cliente ao projeto fechado em várias sessões'; },
  num(o) { return 'ORC-' + String(o.numero || 0).padStart(4, '0'); },
  validade(o) { const d = new Date((o.data || today()) + 'T12:00'); d.setDate(d.getDate() + (+o.validadeDias || 15)); return isoLocal(d); },
  statusReal(o) { return o.status === 'enviado' && this.validade(o) < today() ? 'expirado' : o.status; },
  info(p, ignoreAtId) {
    const ats = DB.all('atendimentos').filter(a => a.projetoId === p.id && a.id !== ignoreAtId);
    const sinais = DB.all('agendamentos').filter(a => a.projetoId === p.id && a.sinalPago && !['concluido', 'cancelado'].includes(a.status));
    const pago = sum(ats, a => a.valorLiquido) + sum(sinais, a => a.sinal);
    const prox = DB.all('agendamentos').filter(a => a.projetoId === p.id && a.data >= today() && !['cancelado', 'concluido', 'faltou'].includes(a.status)).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))[0];
    return { ats, feitas: ats.length, pago, saldo: Math.max(0, (+p.valorTotal || 0) - pago), prox };
  },
  cardPendentes() {
    const os = DB.all('orcamentos').filter(o => this.statusReal(o) === 'enviado' && (!Perm.profId() || o.profissionalId === Perm.profId())).sort((a, b) => a.data.localeCompare(b.data));
    return `<div class="card"><h3>${ic('clip')} Orçamentos aguardando resposta <span class="sp"></span><a class="small" href="#/orcamentos">ver todos</a></h3>${os.length ? os.slice(0, 6).map(o => `<div class="li"><div><div class="t">${esc(DB.get('clientes', o.clienteId)?.nome || o.clienteNome || '—')}</div><small>${esc(o.descricao)} · enviado ${fdate(o.data)}</small></div><div class="r strong">${brl(o.valorTotal)}</div></div>`).join('') : UI.empty('Nenhum orçamento pendente', 'clip')}</div>`;
  },
  render(el) {
    const st = this.st, pid = Perm.profId();
    const O = DB.all('orcamentos').filter(o => !pid || o.profissionalId === pid).map(o => ({ ...o, _st: this.statusReal(o) }));
    const P = DB.all('projetos').filter(p => !pid || p.profissionalId === pid);
    const ini = ymShift(ymNow(), -2) + '-01', rec = O.filter(o => o.data >= ini && ['aprovado', 'recusado', 'expirado'].includes(o._st));
    const conv = rec.length ? rec.filter(o => o._st === 'aprovado').length / rec.length * 100 : 0;
    App.actions(`<button class="btn pri" id="oNovo">${ic('plus')} Novo orçamento</button>`);
    el.innerHTML = `<div class="grid g4 mb">
      <div class="card kpi"><div class="ic">${ic('clip')}</div><div class="lbl">Aguardando resposta</div><div class="val">${O.filter(o => o._st === 'enviado').length}</div><div class="hint">${brl(sum(O.filter(o => o._st === 'enviado'), o => o.valorTotal))} em negociação</div></div>
      <div class="card kpi green"><div class="ic">${ic('check')}</div><div class="lbl">Aprovados no mês</div><div class="val">${O.filter(o => o._st === 'aprovado' && (o.aprovadoEm || o.data).startsWith(ymNow())).length}</div><div class="hint">${brl(sum(O.filter(o => o._st === 'aprovado' && (o.aprovadoEm || o.data).startsWith(ymNow())), o => o.valorTotal))}</div></div>
      <div class="card kpi gold"><div class="ic">${ic('trend')}</div><div class="lbl">Taxa de conversão</div><div class="val">${pct(conv)}</div><div class="hint">últimos 3 meses</div></div>
      <div class="card kpi blue"><div class="ic">${ic('needle')}</div><div class="lbl">Projetos em andamento</div><div class="val">${P.filter(p => p.status === 'andamento').length}</div><div class="hint">saldo a receber ${brl(sum(P.filter(p => p.status === 'andamento'), p => this.info(p).saldo))}</div></div></div>
      <div class="toolbar"><div class="tabs"><button data-tab="orc" class="${st.tab === 'orc' ? 'on' : ''}">Orçamentos</button><button data-tab="proj" class="${st.tab === 'proj' ? 'on' : ''}">Projetos (várias sessões)</button></div>
      ${st.tab === 'orc' ? `<div class="tabs">${[['enviado', 'Aguardando'], ['aprovado', 'Aprovados'], ['recusado', 'Recusados'], ['expirado', 'Expirados'], ['rascunho', 'Rascunhos'], ['', 'Todos']].map(([k, t]) => `<button data-s="${k}" class="${st.status === k ? 'on' : ''}">${t}</button>`).join('')}</div>
      <div class="search">${ic('search')}<input id="q" placeholder="Buscar cliente ou descrição..." value="${esc(st.q)}"></div>` : ''}</div><div id="lst"></div>`;
    const lst = $('#lst', el);
    if (st.tab === 'orc') {
      const draw = () => {
        const q = st.q.toLowerCase();
        const rows = O.filter(o => (!st.status || o._st === st.status) && (!q || [DB.get('clientes', o.clienteId)?.nome, o.descricao].join(' ').toLowerCase().includes(q))).sort((a, b) => (b.data + (b.criadoEm || '')).localeCompare(a.data + (a.criadoEm || '')));
        lst.innerHTML = UI.table([
          { t: 'Nº / data', v: o => `<b>${this.num(o)}</b><small>${fdate(o.data)}</small>` },
          { t: 'Cliente', v: o => `<span class="strong">${esc(DB.get('clientes', o.clienteId)?.nome || '—')}</span><small>${esc(DB.get('clientes', o.clienteId)?.telefone || '')}</small>` },
          { t: 'Trabalho', v: o => `${esc(o.descricao)}<small>${esc(o.estilo || '')} · ${esc(o.regiao || '')}${o.tamanho ? ' · ' + o.tamanho + 'cm' : ''} · ${o.colorida ? 'Colorida' : 'P&B'}</small>` },
          { t: 'Profissional', v: o => { const p = DB.get('profissionais', o.profissionalId); return `<span style="color:${p?.cor}">●</span> ${esc(p?.nome || '')}`; } },
          { t: 'Sessões', cls: 'num', v: o => o.sessoes },
          { t: 'Valor', cls: 'num', v: o => `<b>${brl(o.valorTotal)}</b><small>sinal ${brl(o.valorTotal * (o.sinalPct || 0) / 100)}</small>` },
          { t: 'Validade', v: o => `<span class="${o._st === 'expirado' ? 'down' : ''}">${fdate(this.validade(o))}</span>` },
          { t: 'Status', v: o => UI.statusPill(o._st) },
          { t: '', cls: 'act', v: o => `<button class="btn sm icon" data-wa="${o.id}" title="Enviar no WhatsApp">${ic('wa')}</button>${['enviado', 'expirado', 'rascunho'].includes(o._st) ? `<button class="btn sm ok" data-ap="${o.id}">${ic('check')} Aprovar</button>` : ''}<button class="btn sm icon" data-e="${o.id}">${ic('edit')}</button>` }
        ], rows, { emptyMsg: 'Nenhum orçamento aqui' });
        $$('[data-e]', lst).forEach(b => b.onclick = () => this.form(DB.get('orcamentos', b.dataset.e)));
        $$('[data-wa]', lst).forEach(b => b.onclick = () => this.enviar(DB.get('orcamentos', b.dataset.wa)));
        $$('[data-ap]', lst).forEach(b => b.onclick = () => this.aprovar(DB.get('orcamentos', b.dataset.ap)));
      };
      draw();
      $('#q').oninput = e => { st.q = e.target.value; draw(); };
      $$('[data-s]', el).forEach(b => b.onclick = () => { st.status = b.dataset.s; this.render(el); });
    } else {
      const rows = P.sort((a, b) => (a.status === 'andamento' ? 0 : 1) - (b.status === 'andamento' ? 0 : 1) || (b.criadoEm || '').localeCompare(a.criadoEm || ''));
      lst.innerHTML = rows.length ? `<div class="grid g3">${rows.map(p => { const i = this.info(p), c = DB.get('clientes', p.clienteId), pr = DB.get('profissionais', p.profissionalId), ps = Math.min(100, i.feitas / Math.max(1, p.sessoesPrevistas) * 100), pp = Math.min(100, p.valorTotal ? i.pago / p.valorTotal * 100 : 0);
        return `<div class="card proj"><div class="row"><div class="t grow">${esc(p.titulo)}</div>${UI.statusPill(p.status)}</div>
          <div class="small muted">${esc(c?.nome || '')} · <span style="color:${pr?.cor}">${esc(pr?.nome || '')}</span>${p.regiao ? ' · ' + esc(p.regiao) : ''}</div>
          <div><div class="row small"><span>Sessões</span><span class="grow"></span><b>${i.feitas} de ${p.sessoesPrevistas}</b></div><div class="bar mt" style="margin-top:5px"><i style="width:${ps}%"></i></div></div>
          <div><div class="row small"><span>Pago</span><span class="grow"></span><b>${brl(i.pago)} de ${brl(p.valorTotal)}</b></div><div class="bar mt" style="margin-top:5px"><i style="width:${pp}%;background:var(--gold)"></i></div></div>
          <div class="small">${i.prox ? `${ic('cal', 'ic-in')} Próxima sessão: <b>${fdate(i.prox.data)} ${i.prox.hora}</b>` : '<span class="muted">Sem próxima sessão agendada</span>'} · saldo <b>${brl(i.saldo)}</b></div>
          <div class="row">${p.status === 'andamento' ? `<button class="btn sm pri" data-ag="${p.id}">${ic('cal')} Agendar sessão</button>` : ''}<button class="btn sm" data-pv="${p.id}">${ic('eye')} Detalhes</button></div></div>`; }).join('')}</div>`
        : `<div class="tbl-wrap">${UI.empty('Nenhum projeto ainda — projetos são criados ao aprovar um orçamento com mais de uma sessão', 'needle')}</div>`;
      $$('[data-ag]', lst).forEach(b => b.onclick = () => { const p = DB.get('projetos', b.dataset.ag), i = this.info(p), s = DB.get('servicos', p.servicoId); Forms.agendamento({ clienteId: p.clienteId, profissionalId: p.profissionalId, servicoId: p.servicoId, projetoId: p.id, duracaoMin: s?.duracaoMin || 240, valorPrevisto: Math.round(i.saldo / Math.max(1, p.sessoesPrevistas - i.feitas)), obs: `${p.titulo} — sessão ${i.feitas + 1}/${p.sessoesPrevistas}` }); });
      $$('[data-pv]', lst).forEach(b => b.onclick = () => this.verProjeto(b.dataset.pv));
    }
    $$('[data-tab]', el).forEach(b => b.onclick = () => { st.tab = b.dataset.tab; this.render(el); });
    $('#oNovo').onclick = () => this.form();
  },

  form(o = {}) {
    const edit = !!o.id, cfg = DB.config;
    if (!o.id) o = { id: uid(), criadoEm: new Date().toISOString(), numero: Math.max(0, ...DB.all('orcamentos').map(x => +x.numero || 0)) + 1, data: today(), status: 'enviado', sessoes: 1, sinalPct: cfg.sinalPct || 30, validadeDias: cfg.validadeOrcamento || 15, colorida: false, profissionalId: Perm.profId() || '', ...o };
    UI.modal({ title: `${edit ? 'Editar' : 'Novo'} orçamento ${this.num(o)}`, size: 'lg', body: `<form class="fg" id="oF">
      <div class="f c6"><label>Cliente *</label><div class="row"><select name="clienteId" style="flex:1">${UI.opts('clientes').map(([v, t]) => `<option value="${v}" ${v === o.clienteId ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select><button type="button" class="btn icon" id="oCli">${ic('plus')}</button></div></div>
      ${UI.f('Profissional *', 'profissionalId', o.profissionalId, { type: 'select', col: 3, opts: UI.opts('profissionais', { filter: p => p.comissaoPct > 0 }), attrs: Perm.isArtista() ? 'disabled' : '' })}
      ${UI.f('Serviço base', 'servicoId', o.servicoId, { type: 'select', col: 3, opts: UI.opts('servicos') })}
      ${UI.f('Descrição do trabalho *', 'descricao', o.descricao, { col: 8, ph: 'Ex.: Fechamento de braço botânico com folhagens' })}${UI.f('Estilo', 'estilo', o.estilo, { type: 'select', col: 4, opts: ['', ...ESTILOS] })}
      ${UI.f('Região do corpo', 'regiao', o.regiao, { col: 4 })}${UI.f('Tamanho aprox. (cm)', 'tamanho', o.tamanho, { type: 'number', col: 2 })}
      ${UI.f('Cor', 'colorida', o.colorida ? '1' : '0', { type: 'select', col: 2, opts: [['0', 'Preto e cinza'], ['1', 'Colorida']] })}${UI.f('Nº de sessões', 'sessoes', o.sessoes, { type: 'number', col: 2 })}${UI.f('Horas por sessão', 'horasSessao', o.horasSessao || '', { type: 'number', col: 2 })}
      ${UI.f('Valor total (R$) *', 'valorTotal', o.valorTotal, { type: 'number', col: 3 })}${UI.f('Sinal para reservar (%)', 'sinalPct', o.sinalPct, { type: 'number', col: 3 })}${UI.f('Validade (dias)', 'validadeDias', o.validadeDias, { type: 'number', col: 3 })}
      ${UI.f('Status', 'status', o.status, { type: 'select', col: 3, opts: [['rascunho', 'Rascunho'], ['enviado', 'Enviado'], ['aprovado', 'Aprovado'], ['recusado', 'Recusado']] })}
      <div class="c12 calc-box" id="oCalc"></div>
      ${UI.f('Observações para o cliente', 'obs', o.obs, { type: 'textarea', col: 12, ph: 'Ex.: valor inclui retoque em até 30 dias' })}
      ${UI.f('Anotações internas (não vão para o cliente)', 'interno', o.interno, { type: 'textarea', col: 12 })}
      <div class="fsec">Referências enviadas pelo cliente</div><div class="c12" id="oFotos"></div></form>`,
      foot: `${edit && Perm.gestao() ? `<button class="btn danger" id="oDel">${ic('trash')}</button>` : ''}<button class="btn" id="oPrint">${ic('print')} Proposta</button><span class="grow"></span><button class="btn" data-close>Cancelar</button><button class="btn" id="oSave">Salvar</button><button class="btn pri" id="oSend">${ic('wa')} Salvar e enviar</button>`,
      onOpen: m => {
        const F = m.$('#oF');
        const calc = () => { const d = UI.formData(F), v = +d.valorTotal || 0, n = Math.max(1, +d.sessoes || 1); m.$('#oCalc').innerHTML = `<div><small>Valor por sessão</small><b>${brl(v / n)}</b></div><div><small>Sinal</small><b>${brl(v * (+d.sinalPct || 0) / 100)}</b></div><div><small>Válido até</small><b>${fdate(this.validade({ data: o.data, validadeDias: d.validadeDias }))}</b></div>${d.horasSessao ? `<div><small>Valor/hora</small><b>${brl(v / n / d.horasSessao)}</b></div>` : ''}`; };
        F.servicoId.onchange = () => { const s = DB.get('servicos', F.servicoId.value); if (s && !F.valorTotal.value) F.valorTotal.value = s.precoBase; calc(); };
        m.el.addEventListener('input', calc); calc();
        m.$('#oCli').onclick = () => Forms.clienteRapido(c => F.clienteId.add(new Option(c.nome, c.id, true, true)));
        const fm = { refTipo: 'orcamento', refId: o.id, clienteId: o.clienteId || '', profissionalId: o.profissionalId || '' };
        F.clienteId.addEventListener('change', () => fm.clienteId = F.clienteId.value); F.profissionalId.addEventListener('change', () => fm.profissionalId = F.profissionalId.value);
        Fotos.widget(m.$('#oFotos'), fm, { tipos: ['Referência', 'Local do corpo', 'Rascunho da arte'], emptyMsg: 'Anexe as referências que o cliente mandou' });
        const save = () => {
          const d = UI.formData(F); if (Perm.isArtista()) d.profissionalId = Perm.profId();
          if (!d.clienteId || !d.profissionalId || !d.descricao || !(+d.valorTotal > 0)) { UI.toast('Preencha cliente, profissional, descrição e valor', 'warn'); return null; }
          d.colorida = d.colorida === '1'; d.sessoes = Math.max(1, +d.sessoes || 1);
          return DB.save('orcamentos', { ...o, ...d });
        };
        m.$('#oSave').onclick = () => { if (save()) { m.close(); UI.toast('Orçamento salvo'); } };
        m.$('#oSend').onclick = () => { const r = save(); if (r) { if (r.status === 'rascunho') { r.status = 'enviado'; DB.save('orcamentos', r); } m.close(); this.enviar(r); } };
        m.$('#oPrint').onclick = () => { const r = save(); if (r) { m.close(); this.proposta(r); } };
        if (m.$('#oDel')) m.$('#oDel').onclick = () => UI.confirm('Excluir este orçamento?', () => { DB.remove('orcamentos', o.id); m.close(); });
      }
    });
  },

  texto(o) {
    const c = DB.get('clientes', o.clienteId), p = DB.get('profissionais', o.profissionalId), cfg = DB.config;
    return `Olá ${c ? c.nome.split(' ')[0] : ''}! 🌿 Aqui é do *${cfg.nome}*. Segue seu orçamento (${this.num(o)}):\n\n*${o.descricao}*\n` +
      [o.estilo && `Estilo: ${o.estilo}`, o.regiao && `Região: ${o.regiao}`, o.tamanho && `Tamanho: ~${o.tamanho} cm`, o.colorida ? 'Colorida' : 'Preto e cinza'].filter(Boolean).join(' · ') +
      `\nArtista: ${p?.nome || ''}\nSessões: ${o.sessoes}${o.horasSessao ? ` (~${o.horasSessao}h cada)` : ''}\n\n💰 *Valor total: ${brl(o.valorTotal)}*${o.sessoes > 1 ? ` (${brl(o.valorTotal / o.sessoes)} por sessão)` : ''}\n📌 Sinal para reservar a data: ${brl(o.valorTotal * (o.sinalPct || 0) / 100)}\n🗓️ Válido até ${fdate(this.validade(o))}` +
      (o.obs ? `\n\n${o.obs}` : '') + `\n\nPodemos agendar? É só responder por aqui!`;
  },
  enviar(o) {
    const c = DB.get('clientes', o.clienteId), t = this.texto(o);
    UI.modal({ title: `Enviar ${this.num(o)}`, body: `<div class="f"><label>Mensagem</label><textarea id="oT" style="min-height:260px">${esc(t)}</textarea></div>`,
      foot: `<button class="btn" id="oCp">${ic('copy')} Copiar</button><span class="grow"></span><a class="btn ok" id="oWa" target="_blank" href="${UI.wa(c?.telefone, t)}">${ic('wa')} Abrir WhatsApp${c?.telefone ? ' de ' + esc(c.nome.split(' ')[0]) : ''}</a>`,
      onOpen: m => { m.$('#oT').oninput = e => m.$('#oWa').href = UI.wa(c?.telefone, e.target.value); m.$('#oCp').onclick = () => UI.copy(m.$('#oT').value); } });
  },
  proposta(o) {
    const c = DB.get('clientes', o.clienteId), p = DB.get('profissionais', o.profissionalId), cfg = DB.config;
    UI.modal({ title: `Proposta ${this.num(o)}`, size: 'lg', body: `<div style="text-align:center"><img src="img/logo.png" style="width:110px;border-radius:50%"><div style="font-family:var(--disp);font-size:24px;letter-spacing:3px;margin-top:8px">${esc(cfg.nome.toUpperCase())}</div><div class="muted small">${esc(cfg.endereco || '')} · ${esc(cfg.telefone || '')} · ${esc(cfg.instagram || '')}</div></div>
      <div class="hr"></div><div class="row"><div><small class="muted">Proposta</small><div class="strong">${this.num(o)} · ${fdate(o.data)}</div></div><span class="grow"></span><div class="right"><small class="muted">Cliente</small><div class="strong">${esc(c?.nome || '')}</div></div></div>
      <h2 style="font-family:var(--disp);margin:18px 0 6px">${esc(o.descricao)}</h2>
      <div class="grid g4 small"><div><span class="muted">Estilo</span><br><b>${esc(o.estilo || '—')}</b></div><div><span class="muted">Região</span><br><b>${esc(o.regiao || '—')}</b></div><div><span class="muted">Tamanho</span><br><b>${o.tamanho ? '~' + o.tamanho + ' cm' : '—'}</b></div><div><span class="muted">Cor</span><br><b>${o.colorida ? 'Colorida' : 'Preto e cinza'}</b></div><div><span class="muted">Artista</span><br><b>${esc(p?.nome || '')}</b></div><div><span class="muted">Sessões</span><br><b>${o.sessoes}${o.horasSessao ? ` × ~${o.horasSessao}h` : ''}</b></div><div><span class="muted">Sinal</span><br><b>${brl(o.valorTotal * (o.sinalPct || 0) / 100)}</b></div><div><span class="muted">Validade</span><br><b>${fdate(this.validade(o))}</b></div></div>
      <div class="calc-box mt" style="justify-content:space-between"><div><small>Valor total do trabalho</small><b style="font-size:26px;color:var(--gold)">${brl(o.valorTotal)}</b></div>${o.sessoes > 1 ? `<div><small>Por sessão</small><b>${brl(o.valorTotal / o.sessoes)}</b></div>` : ''}</div>
      ${o.obs ? `<p class="mt">${esc(o.obs)}</p>` : ''}<p class="small muted mt">O sinal garante a reserva da data e é abatido do valor final. Remarcações com menos de 48h de antecedência podem implicar perda do sinal.</p><div id="prFotos" class="mt"></div>`,
      foot: `<span class="grow"></span><button class="btn" data-close>Fechar</button><button class="btn pri" onclick="window.print()">${ic('print')} Imprimir / salvar PDF</button>`,
      onOpen: m => Fotos.widget(m.$('#prFotos'), { refId: o.id }, { readonly: true, emptyMsg: '' }) });
  },
  aprovar(o) {
    const c = DB.get('clientes', o.clienteId);
    UI.confirm(`Aprovar ${this.num(o)} de <b>${esc(c?.nome || '')}</b> (${brl(o.valorTotal)})?<br><small class="muted">${o.sessoes > 1 ? `Será criado um projeto de ${o.sessoes} sessões e` : 'Em seguida'} abriremos o agendamento da ${o.sessoes > 1 ? '1ª sessão' : 'sessão'} com o sinal.</small>`, () => {
      o.status = 'aprovado'; o.aprovadoEm = today();
      let proj = null;
      if (o.sessoes > 1) { proj = DB.save('projetos', { titulo: o.descricao, clienteId: o.clienteId, profissionalId: o.profissionalId, servicoId: o.servicoId, regiao: o.regiao, estilo: o.estilo, sessoesPrevistas: o.sessoes, valorTotal: o.valorTotal, orcamentoId: o.id, status: 'andamento' }, true); o.projetoId = proj.id; }
      DB.save('orcamentos', o);
      const s = DB.get('servicos', o.servicoId);
      Forms.agendamento({ clienteId: o.clienteId, profissionalId: o.profissionalId, servicoId: o.servicoId, projetoId: proj?.id || '', duracaoMin: o.horasSessao ? o.horasSessao * 60 : (s?.duracaoMin || 120), valorPrevisto: Math.round(o.valorTotal / o.sessoes), sinal: Math.round(o.valorTotal * (o.sinalPct || 0) / 100), obs: `${o.descricao}${o.sessoes > 1 ? ` — sessão 1/${o.sessoes}` : ''} (${this.num(o)})` });
      UI.toast(proj ? 'Orçamento aprovado e projeto criado' : 'Orçamento aprovado');
    }, { yes: 'Aprovar', danger: false });
  },
  verProjeto(id) {
    const p = DB.get('projetos', id); if (!p) return; const i = this.info(p), c = DB.get('clientes', p.clienteId), pr = DB.get('profissionais', p.profissionalId);
    const ags = DB.all('agendamentos').filter(a => a.projetoId === id && !['concluido'].includes(a.status)).sort((a, b) => a.data.localeCompare(b.data));
    UI.modal({ title: esc(p.titulo), size: 'lg', body: `<div class="row mb">${UI.statusPill(p.status)}<span class="muted small">${esc(c?.nome || '')} · ${esc(pr?.nome || '')}${p.estilo ? ' · ' + esc(p.estilo) : ''}${p.regiao ? ' · ' + esc(p.regiao) : ''}</span></div>
      <div class="calc-box"><div><small>Sessões</small><b>${i.feitas} / ${p.sessoesPrevistas}</b></div><div><small>Valor total</small><b>${brl(p.valorTotal)}</b></div><div><small>Pago</small><b class="up">${brl(i.pago)}</b></div><div><small>Saldo</small><b>${brl(i.saldo)}</b></div></div>
      <h3 class="mt mb" style="font-size:13px;color:var(--muted)">SESSÕES REALIZADAS</h3>${UI.table([{ t: '#', v: (a) => i.ats.indexOf(a) + 1 }, { t: 'Data', v: a => fdate(a.data) }, { t: 'Descrição', v: a => esc(a.descricao || '') }, { t: 'Valor', cls: 'num', v: a => brl(a.valorLiquido) }], [...i.ats].sort((a, b) => a.data.localeCompare(b.data)), { emptyMsg: 'Nenhuma sessão realizada ainda' })}
      ${ags.length ? `<h3 class="mt mb" style="font-size:13px;color:var(--muted)">AGENDADAS</h3>${ags.map(a => `<div class="li"><div class="time-chip">${fdate(a.data).slice(0, 5)}</div><div><div class="t">${a.hora}</div><small>${a.sinalPago ? 'sinal pago ' + brl(a.sinal) : ''}</small></div><div class="r">${UI.statusPill(a.status)}</div></div>`).join('')}` : ''}
      <h3 class="mt mb" style="font-size:13px;color:var(--muted)">EVOLUÇÃO EM FOTOS</h3><div id="pjFotos"></div>`,
      foot: `${p.status === 'andamento' ? `<button class="btn" id="pjCanc">Cancelar projeto</button><button class="btn" id="pjConc">${ic('check')} Concluir</button>` : `<button class="btn" id="pjReab">Reabrir</button>`}<span class="grow"></span><button class="btn" data-close>Fechar</button>`,
      onOpen: m => {
        Fotos.widget(m.$('#pjFotos'), { projetoId: p.id, refTipo: 'projeto', refId: undefined, clienteId: p.clienteId, profissionalId: p.profissionalId }, { tipos: ['Evolução', 'Cicatrizado', 'Arte / stencil'] });
        const set = s => { p.status = s; DB.save('projetos', p); m.close(); UI.toast('Projeto atualizado'); };
        if (m.$('#pjConc')) m.$('#pjConc').onclick = () => set('concluido');
        if (m.$('#pjCanc')) m.$('#pjCanc').onclick = () => UI.confirm('Cancelar este projeto?', () => set('cancelado'));
        if (m.$('#pjReab')) m.$('#pjReab').onclick = () => set('andamento');
      } });
  }
};

/* ============================================================
   PORTFÓLIO & FOTOS
   ============================================================ */
Views.galeria = {
  title: 'Portfólio & Fotos', st: { prof: '', tipo: '' }, _cache: null,
  sub() { return 'Todas as fotos dos trabalhos — portfólio de cada artista'; },
  render(el) {
    const st = this.st; if (Perm.isArtista()) st.prof = Perm.profId();
    const profs = DB.all('profissionais').filter(p => p.comissaoPct > 0);
    App.actions(`<label class="btn pri">${ic('camera')} Adicionar ao portfólio<input type="file" accept="image/*" multiple hidden id="gUp"></label>`);
    el.innerHTML = `<div class="toolbar"><select id="gP" style="width:auto" ${Perm.isArtista() ? 'disabled' : ''}><option value="">Todos os artistas</option>${profs.map(p => `<option value="${p.id}" ${st.prof === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>
      <div class="tabs">${[['', 'Todas'], ['Portfólio', 'Portfólio'], ['Depois', 'Finalizadas'], ['Cicatrizado', 'Cicatrizadas'], ['Referência', 'Referências'], ['Evolução', 'Evolução']].map(([k, t]) => `<button data-t="${k}" class="${st.tipo === k ? 'on' : ''}">${t}</button>`).join('')}</div>
      <span class="grow"></span><span class="muted small" id="gCount"></span></div>
      <div class="foto-grid lg" id="gGrid"><div class="muted">Carregando fotos...</div></div>
      <div class="alert info mt">${ic('image')}<div>As fotos são comprimidas automaticamente (~150 KB cada) e guardadas no próprio banco do sistema — sem custo de armazenamento extra. No plano gratuito do Firebase cabem milhares de fotos.</div></div>`;
    const draw = fotos => {
      const f = fotos.filter(x => (!st.prof || x.profissionalId === st.prof) && (!st.tipo || x.tipo === st.tipo) && !['Indicador químico', 'Indicador biológico', 'Impressão / display do ciclo'].includes(x.tipo));
      const g = $('#gGrid', el); if (!g) return;
      $('#gCount', el).textContent = f.length + ' foto(s)';
      g.innerHTML = f.length ? Fotos.grid(f, { meta: true }) : `<div class="muted">Nenhuma foto. Adicione pelo botão acima ou dentro de cada atendimento.</div>`;
      $$('[data-f]', g).forEach(x => x.onclick = () => Fotos.ver(f.find(y => y.id === x.dataset.f)));
    };
    if (this._cache) draw(this._cache);
    Fotos.list(st.prof && DB.mode === 'firebase' ? { profissionalId: st.prof } : {}).then(f => { this._cache = f; draw(f); }).catch(e => { $('#gGrid', el).innerHTML = `<div class="alert bad">Erro ao carregar fotos: ${esc(e.message)}</div>`; });
    $('#gP').onchange = e => { st.prof = e.target.value; this.render(el); };
    $$('[data-t]', el).forEach(b => b.onclick = () => { st.tipo = b.dataset.t; this.render(el); });
    $('#gUp').onchange = async e => {
      const files = [...e.target.files]; if (!files.length) return;
      const prof = st.prof || Perm.profId() || profs[0]?.id;
      if (!st.prof && !Perm.isArtista()) UI.toast('Dica: filtre pelo artista antes de enviar para atribuir as fotos a ele', 'warn');
      for (const f of files) await Fotos.add({ refTipo: 'portfolio', profissionalId: prof, tipo: 'Portfólio' }, f);
      UI.toast(`${files.length} foto(s) adicionadas ao portfólio`); this._cache = null; this.render(el);
    };
  }
};

/* ============================================================
   USUÁRIOS & ACESSOS
   ============================================================ */
Views.usuarios = {
  title: 'Usuários & Acessos',
  sub() { return 'Quem acessa o sistema e o que cada perfil pode ver'; },
  matriz() {
    const linhas = [['Painel com faturamento e contas', 1, 1, 0], ['Painel pessoal (minha agenda e comissões)', 1, 1, 1], ['Agenda de toda a equipe', 1, 1, 0], ['Agenda própria', 1, 1, 1], ['Registrar atendimento', 1, 1, 1], ['Editar / excluir atendimento', 1, 1, 0], ['Orçamentos e projetos', 1, 1, 'próprios'], ['Clientes e fichas de anamnese', 1, 1, 1], ['PDV — venda de joias', 1, 1, 1], ['Estoque (insumos, joias)', 1, 1, 1], ['Esterilização / autoclave', 1, 1, 1], ['Contas a pagar e receber', 1, 1, 0], ['Lucro, DRE e relatórios', 1, 0, 0], ['Equipe, comissões e salários', 1, 0, 0], ['Serviços, preços e configurações', 1, 0, 0], ['Usuários e acessos', 1, 0, 0]];
    const c = v => v === 1 ? '<span class="up">✓</span>' : v === 0 ? '<span class="muted">—</span>' : `<span class="small">${v}</span>`;
    return `<div class="tbl-wrap"><table class="tbl perm"><thead><tr><th>Permissão</th><th class="c">Administrador</th><th class="c">Recepção</th><th class="c">Tatuador / Piercer</th></tr></thead><tbody>${linhas.map(l => `<tr><td>${l[0]}</td><td class="c">${c(l[1])}</td><td class="c">${c(l[2])}</td><td class="c">${c(l[3])}</td></tr>`).join('')}</tbody></table></div>`;
  },
  render(el) {
    if (DB.mode !== 'firebase') {
      el.innerHTML = `<div class="alert info mb">${ic('key')}<div>No <b>modo demonstração</b> não há login. Use o seletor <b>"Ver sistema como"</b> no rodapé do menu para ver o sistema como recepção ou como cada tatuador. Com o Firebase configurado, esta tela permite criar logins e definir o perfil de cada pessoa.</div></div><div class="card"><h3>O que cada perfil pode fazer</h3>${this.matriz()}</div>`;
      return;
    }
    App.actions(`<button class="btn pri" id="uNovo">${ic('plus')} Novo usuário</button>`);
    el.innerHTML = `<div id="uLst" class="mb"><div class="muted">Carregando usuários...</div></div><div class="card"><h3>O que cada perfil pode fazer</h3>${this.matriz()}</div>`;
    DB.fs.collection('acessos').get().then(s => {
      const rows = s.docs.map(d => ({ uid: d.id, ...d.data() }));
      $('#uLst', el).innerHTML = UI.table([{ t: 'Nome', v: u => `<span class="strong">${esc(u.nome || '')}</span><small>${esc(u.email || u.uid)}</small>` }, { t: 'Perfil', v: u => `<span class="pill ${u.papel === 'admin' ? 'acc' : ''}">${PAPEIS[u.papel] || u.papel}</span>` }, { t: 'Profissional vinculado', v: u => esc(DB.get('profissionais', u.profissionalId)?.nome || '—') }, { t: '', cls: 'act', v: u => u.uid === DB.user.uid ? '<span class="muted small">você</span>' : `<button class="btn sm icon" data-e="${u.uid}">${ic('edit')}</button><button class="btn sm icon danger" data-x="${u.uid}">${ic('trash')}</button>` }], rows);
      $$('[data-e]', el).forEach(b => b.onclick = () => this.form(rows.find(r => r.uid === b.dataset.e)));
      $$('[data-x]', el).forEach(b => b.onclick = () => UI.confirm('Remover o acesso deste usuário? (o login deixa de abrir o sistema)', () => DB.fs.collection('acessos').doc(b.dataset.x).delete().then(() => { UI.toast('Acesso removido'); this.render(el); })));
    }).catch(e => $('#uLst', el).innerHTML = `<div class="alert bad">Sem permissão para listar usuários: ${esc(e.message)}</div>`);
    $('#uNovo').onclick = () => this.form();
  },
  form(u) {
    const edit = !!u; u = u || { papel: 'artista' };
    UI.modal({ title: edit ? 'Editar acesso' : 'Novo usuário', body: `<form class="fg" id="uF">
      ${UI.f('Nome', 'nome', u.nome, { col: 6 })}${UI.f('E-mail (login)', 'email', u.email, { type: 'email', col: 6, attrs: edit ? 'readonly' : '' })}
      ${edit ? '' : UI.f('Senha inicial (mín. 6)', 'senha', '', { type: 'text', col: 6, help: 'a pessoa pode trocar em "Esqueci minha senha"' })}
      ${UI.f('Perfil', 'papel', u.papel, { type: 'select', col: 6, opts: Object.entries(PAPEIS) })}
      ${UI.f('Profissional vinculado (para tatuador/piercer)', 'profissionalId', u.profissionalId, { type: 'select', col: 12, opts: UI.opts('profissionais', { empty: '—' }) })}</form>`,
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="uOk">Salvar</button>`,
      onOpen: m => m.$('#uOk').onclick = async () => {
        const d = UI.formData(m.$('#uF'));
        if (d.papel === 'artista' && !d.profissionalId) return UI.toast('Vincule o tatuador/piercer ao cadastro da equipe', 'warn');
        const btn = m.$('#uOk'); btn.disabled = true;
        try {
          let id = u.uid;
          if (!edit) {
            if (!d.email || (d.senha || '').length < 6) throw new Error('Informe e-mail e senha com 6+ caracteres');
            const sec = firebase.apps.find(a => a.name === 'sec') || firebase.initializeApp(window.FIREBASE_CONFIG, 'sec');
            const cred = await sec.auth().createUserWithEmailAndPassword(d.email, d.senha); id = cred.user.uid; await sec.auth().signOut();
          }
          await DB.fs.collection('acessos').doc(id).set({ nome: d.nome, email: d.email || u.email, papel: d.papel, profissionalId: d.profissionalId || '' });
          m.close(); UI.toast(edit ? 'Acesso atualizado' : 'Usuário criado — já pode entrar'); App.render();
        } catch (e) { btn.disabled = false; UI.toast(e.message, 'err'); }
      } });
  }
};

/* ---------------- Painel do tatuador / piercer ---------------- */
Views.dashboard.renderArtista = function (el) {
  const pid = Perm.profId(), p = DB.get('profissionais', pid), ym = ymNow();
  const ats = DB.all('atendimentos').filter(a => a.profissionalId === pid && a.data.startsWith(ym));
  const hoje = DB.all('agendamentos').filter(a => a.profissionalId === pid && a.data === today() && a.status !== 'cancelado').sort((a, b) => a.hora.localeCompare(b.hora));
  const lim = new Date(); lim.setDate(lim.getDate() + 7); const limS = isoLocal(lim);
  const semana = DB.all('agendamentos').filter(a => a.profissionalId === pid && a.data > today() && a.data <= limS && !['cancelado'].includes(a.status)).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const meses = [...Array(6)].map((_, i) => ymShift(ym, i - 5));
  const com = meses.map(m => sum(DB.all('atendimentos').filter(a => a.profissionalId === pid && a.data.startsWith(m)), a => a.comissaoValor));
  const proj = DB.all('projetos').filter(x => x.profissionalId === pid && x.status === 'andamento');
  const li = a => { const c = DB.get('clientes', a.clienteId), s = DB.get('servicos', a.servicoId), ana = DB.all('anamneses').some(x => x.clienteId === a.clienteId); return `<div class="li" style="cursor:pointer" data-ag="${a.id}"><div class="time-chip">${a.data === today() ? a.hora : fdate(a.data).slice(0, 5)}</div><div><div class="t">${esc(c?.nome || '')}</div><small>${a.data !== today() ? a.hora + ' · ' : ''}${esc(s?.nome || '')} ${ana ? '' : '· <span class="down">sem ficha</span>'}</small></div><div class="r">${UI.statusPill(a.status)}</div></div>`; };
  App.actions(`<button class="btn" id="dOrc">${ic('clip')} Novo orçamento</button><button class="btn pri" id="dNovo">${ic('plus')} Novo atendimento</button>`);
  el.innerHTML = `<div class="card mb" style="background:linear-gradient(120deg,rgba(124,170,84,.15),rgba(224,191,110,.06))"><div style="font-family:var(--disp);font-size:22px;color:var(--stone)">Olá, ${esc((p?.nome || '').split(' ')[0])} 🌿</div><div class="muted">${hoje.length ? `Você tem ${hoje.length} atendimento(s) hoje.` : 'Nenhum atendimento hoje.'}</div></div>
    <div class="grid g4">
      <div class="card kpi"><div class="ic">${ic('needle')}</div><div class="lbl">Meus atendimentos no mês</div><div class="val">${ats.length}</div></div>
      <div class="card kpi green"><div class="ic">${ic('money')}</div><div class="lbl">Minha comissão no mês</div><div class="val">${brl(sum(ats, a => a.comissaoValor))}</div><div class="hint">${p?.comissaoPct || 0}% sobre ${brl(sum(ats, a => a.valorLiquido))}</div></div>
      <div class="card kpi gold"><div class="ic">${ic('clip')}</div><div class="lbl">Orçamentos aguardando</div><div class="val">${DB.all('orcamentos').filter(o => o.profissionalId === pid && Views.orcamentos.statusReal(o) === 'enviado').length}</div></div>
      <div class="card kpi blue"><div class="ic">${ic('trend')}</div><div class="lbl">Projetos em andamento</div><div class="val">${proj.length}</div></div></div>
    <div class="grid g2 mt"><div class="card"><h3>Minha agenda — hoje</h3>${hoje.length ? hoje.map(li).join('') : UI.empty('Livre hoje', 'cal')}<h3 class="mt">Próximos 7 dias</h3>${semana.length ? semana.slice(0, 8).map(li).join('') : UI.empty('Nada agendado', 'cal')}</div>
      <div class="card"><h3>Minhas comissões — 6 meses</h3>${UI.barChart(meses.map(m => MESES[+m.slice(5) - 1]), [{ name: 'Comissão', data: com }])}</div></div>
    <div class="grid g2 mt">${Views.orcamentos.cardPendentes()}${Views.biosseguranca.cardHoje()}</div>`;
  $$('[data-ag]', el).forEach(x => x.onclick = () => Forms.verAgendamento(x.dataset.ag));
  $('#dNovo').onclick = () => Forms.atendimento({ profissionalId: pid });
  $('#dOrc').onclick = () => Views.orcamentos.form();
};
