/* ============================================================
   CLIENTES · ANAMNESES · EQUIPE · SERVIÇOS
   ============================================================ */

/* ---------------- CLIENTES ---------------- */
Views.clientes = {
  title: 'Clientes', st: { q: '', ord: 'nome' },
  sub() { return DB.all('clientes').length + ' clientes cadastrados'; },
  render(el) {
    const st = this.st;
    App.actions(`<button class="btn" id="cCsv">${ic('download')} CSV</button><button class="btn" id="cLink">${ic('link')} Link da ficha</button><button class="btn pri" id="cNovo">${ic('plus')} Novo cliente</button>`);
    el.innerHTML = `<div class="toolbar"><div class="search">${ic('search')}<input id="q" placeholder="Buscar por nome, telefone, Instagram, CPF..." value="${esc(st.q)}"></div>
      <select id="ord" style="width:auto">${[['nome', 'Ordenar: nome'], ['gasto', 'Maior gasto'], ['ultima', 'Última visita'], ['novo', 'Mais recentes']].map(([v, t]) => `<option value="${v}" ${st.ord === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div><div id="lst"></div>`;
    const stats = {};
    DB.all('atendimentos').forEach(a => { const s = stats[a.clienteId] ||= { n: 0, v: 0, u: '' }; s.n++; s.v += a.valorLiquido + (a.totalJoias || 0); if (a.data > s.u) s.u = a.data; });
    DB.all('vendas').forEach(v => { if (!v.clienteId) return; const s = stats[v.clienteId] ||= { n: 0, v: 0, u: '' }; s.v += v.total; if (v.data > s.u) s.u = v.data; });
    const anaSet = new Set(DB.all('anamneses').map(a => a.clienteId));
    const draw = () => {
      const q = st.q.toLowerCase();
      let rows = DB.all('clientes').filter(c => !q || [c.nome, c.telefone, c.instagram, c.cpf, c.email].join(' ').toLowerCase().includes(q)).map(c => ({ ...c, _s: stats[c.id] || { n: 0, v: 0, u: '' } }));
      const o = { nome: (a, b) => a.nome.localeCompare(b.nome), gasto: (a, b) => b._s.v - a._s.v, ultima: (a, b) => b._s.u.localeCompare(a._s.u), novo: (a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || '') };
      rows.sort(o[st.ord]); this._rows = rows;
      $('#lst', el).innerHTML = UI.table([
        { t: 'Cliente', v: c => `<div class="row" style="flex-wrap:nowrap"><div class="avatar">${initials(c.nome)}</div><div><span class="strong">${esc(c.nome)}</span><small>${esc(c.instagram || '')} ${c.nasc ? '· ' + idade(c.nasc) + ' anos' : ''}</small></div></div>` },
        { t: 'Contato', v: c => `${esc(c.telefone || '—')}<small>${esc(c.email || '')}</small>` },
        { t: 'Origem', v: c => `<span class="pill">${esc(c.origem || '—')}</span>` },
        { t: 'Ficha', v: c => anaSet.has(c.id) ? '<span class="pill ok">OK</span>' : '<span class="pill warn">Pendente</span>' },
        { t: 'Atend.', cls: 'num', v: c => c._s.n },
        { t: 'Total gasto', cls: 'num', v: c => `<b>${brl(c._s.v)}</b>` },
        { t: 'Última visita', v: c => fdate(c._s.u) },
        { t: '', cls: 'act', v: c => `<a class="btn sm icon" target="_blank" href="${UI.wa(c.telefone, '')}" title="WhatsApp">${ic('wa')}</a><button class="btn sm icon" data-v="${c.id}" title="Ficha do cliente">${ic('eye')}</button><button class="btn sm icon" data-e="${c.id}">${ic('edit')}</button>` }
      ], rows, { emptyMsg: 'Nenhum cliente encontrado' });
      $$('[data-v]', el).forEach(b => b.onclick = () => this.ver(b.dataset.v));
      $$('[data-e]', el).forEach(b => b.onclick = () => this.form(DB.get('clientes', b.dataset.e)));
    };
    draw();
    $('#q').oninput = e => { st.q = e.target.value; draw(); };
    $('#ord').onchange = e => { st.ord = e.target.value; draw(); };
    $('#cNovo').onclick = () => this.form();
    $('#cLink').onclick = () => Forms.linkAnamnese();
    $('#cCsv').onclick = () => UI.download('clientes.csv', UI.csv([['Nome', 'Telefone', 'E-mail', 'Instagram', 'Nascimento', 'CPF', 'Cidade', 'Origem', 'Atendimentos', 'Total gasto', 'Última visita'], ...this._rows.map(c => [c.nome, c.telefone, c.email, c.instagram, fdate(c.nasc), c.cpf, c.cidade, c.origem, c._s.n, num(c._s.v), fdate(c._s.u)])]), 'text/csv');
  },

  form(c = {}) {
    const edit = !!c.id;
    UI.modal({ title: edit ? 'Editar cliente' : 'Novo cliente', body: `<form class="fg" id="cF">
      ${UI.f('Nome completo *', 'nome', c.nome, { col: 8 })}${UI.f('CPF', 'cpf', c.cpf, { col: 4, ph: '000.000.000-00' })}
      ${UI.f('WhatsApp', 'telefone', c.telefone, { col: 4, ph: '(00) 00000-0000' })}${UI.f('E-mail', 'email', c.email, { type: 'email', col: 4 })}${UI.f('Instagram', 'instagram', c.instagram, { col: 4, ph: '@usuario' })}
      ${UI.f('Nascimento', 'nasc', c.nasc, { type: 'date', col: 4 })}${UI.f('Cidade', 'cidade', c.cidade, { col: 4 })}${UI.f('Como conheceu', 'origem', c.origem, { type: 'select', col: 4, opts: ['', 'Instagram', 'TikTok', 'Indicação', 'Google', 'Passou na frente', 'Evento', 'Outro'] })}
      ${UI.f('Endereço', 'endereco', c.endereco, { col: 12 })}
      ${UI.f('Observações (preferências, estilo, histórico)', 'obs', c.obs, { type: 'textarea', col: 12 })}</form>`,
      foot: `${edit ? `<button class="btn danger" id="cDel">${ic('trash')} Excluir</button><span class="grow"></span>` : ''}<button class="btn" data-close>Cancelar</button><button class="btn pri" id="cOk">Salvar</button>`,
      onOpen: m => {
        m.$('#cOk').onclick = () => { const d = UI.formData(m.$('#cF')); if (!d.nome) return UI.toast('Informe o nome', 'warn'); DB.save('clientes', { ...c, ...d }); m.close(); UI.toast('Cliente salvo'); };
        if (edit) m.$('#cDel').onclick = () => {
          if (DB.all('atendimentos').some(a => a.clienteId === c.id)) return UI.toast('Cliente possui atendimentos — não pode ser excluído', 'warn');
          UI.confirm(`Excluir ${esc(c.nome)}?`, () => { DB.remove('clientes', c.id); m.close(); });
        };
      }
    });
  },

  ver(id) {
    const c = DB.get('clientes', id); if (!c) return;
    const ats = DB.all('atendimentos').filter(a => a.clienteId === id).sort((a, b) => b.data.localeCompare(a.data));
    const vds = DB.all('vendas').filter(v => v.clienteId === id).sort((a, b) => b.data.localeCompare(a.data));
    const anas = DB.all('anamneses').filter(a => a.clienteId === id).sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
    const ags = DB.all('agendamentos').filter(a => a.clienteId === id && a.data >= today() && !['cancelado', 'concluido'].includes(a.status)).sort((a, b) => a.data.localeCompare(b.data));
    const tot = sum(ats, a => a.valorLiquido + (a.totalJoias || 0)) + sum(vds, v => v.total);
    UI.modal({ title: esc(c.nome), size: 'lg', body: `
      <div class="grid g4">
        <div class="card kpi"><div class="lbl">Total gasto</div><div class="val">${brl(tot)}</div></div>
        <div class="card kpi"><div class="lbl">Atendimentos</div><div class="val">${ats.length}</div><div class="hint">${ats.filter(a => a.tipo === 'tattoo').length} tattoo · ${ats.filter(a => a.tipo === 'piercing').length} piercing</div></div>
        <div class="card kpi"><div class="lbl">Ticket médio</div><div class="val">${brl(ats.length ? tot / ats.length : 0)}</div></div>
        <div class="card kpi"><div class="lbl">Cliente desde</div><div class="val" style="font-size:18px">${fdate(c.criadoEm)}</div></div>
      </div>
      <div class="grid g3 mt small"><div><span class="muted">WhatsApp:</span> ${esc(c.telefone || '—')}</div><div><span class="muted">Instagram:</span> ${esc(c.instagram || '—')}</div><div><span class="muted">Nascimento:</span> ${fdate(c.nasc)} ${c.nasc ? `(${idade(c.nasc)} anos)` : ''}</div><div><span class="muted">E-mail:</span> ${esc(c.email || '—')}</div><div><span class="muted">CPF:</span> ${esc(c.cpf || '—')}</div><div><span class="muted">Origem:</span> ${esc(c.origem || '—')}</div></div>
      ${c.obs ? `<div class="alert info mt">${esc(c.obs)}</div>` : ''}
      ${ags.length ? `<h3 class="mt mb" style="font-size:13px;color:var(--muted)">PRÓXIMOS AGENDAMENTOS</h3>${ags.map(a => `<div class="li"><div class="time-chip">${fdate(a.data).slice(0, 5)}</div><div><div class="t">${a.hora} · ${esc(DB.get('servicos', a.servicoId)?.nome || '')}</div><small>${esc(DB.get('profissionais', a.profissionalId)?.nome || '')}</small></div><div class="r">${UI.statusPill(a.status)}</div></div>`).join('')}` : ''}
      <h3 class="mt mb" style="font-size:13px;color:var(--muted)">FICHAS DE ANAMNESE</h3>
      ${anas.length ? anas.map(a => `<div class="li"><div>${UI.statusPill(a.status)}</div><div><div class="t">${a.tipoProcedimento === 'piercing' ? 'Piercing' : 'Tatuagem'} — ${fdt(a.criadoEm)}</div><small>${Biz.anamneseAlertas(a).map(esc).join(' · ') || 'Sem pontos de atenção'}</small></div><div class="r"><button class="btn sm" data-ana="${a.id}">${ic('eye')} Ver</button></div></div>`).join('') : '<div class="alert warn">Nenhuma ficha preenchida.</div>'}
      ${DB.all('projetos').filter(p => p.clienteId === id).length ? `<h3 class="mt mb" style="font-size:13px;color:var(--muted)">PROJETOS</h3>${DB.all('projetos').filter(p => p.clienteId === id).map(p => { const i = Views.orcamentos.info(p); return `<div class="li"><div><div class="t">${esc(p.titulo)}</div><small>${i.feitas}/${p.sessoesPrevistas} sessões · pago ${brl(i.pago)} de ${brl(p.valorTotal)}</small></div><div class="r">${UI.statusPill(p.status)}</div></div>`; }).join('')}` : ''}
      <h3 class="mt mb" style="font-size:13px;color:var(--muted)">HISTÓRICO</h3>
      ${UI.table([{ t: 'Data', v: a => fdate(a.data) }, { t: 'Serviço', v: a => `${esc(DB.get('servicos', a.servicoId)?.nome || '')}<small>${esc(a.descricao || '')} ${a.regiao ? '· ' + esc(a.regiao) : ''}</small>` }, { t: 'Profissional', v: a => esc(DB.get('profissionais', a.profissionalId)?.nome || '') }, { t: 'Valor', cls: 'num', v: a => brl(a.valorLiquido + (a.totalJoias || 0)) }], ats, { emptyMsg: 'Sem atendimentos' })}
      <h3 class="mt mb" style="font-size:13px;color:var(--muted)">FOTOS</h3><div id="cliFotos"></div>
      ${vds.length ? `<h3 class="mt mb" style="font-size:13px;color:var(--muted)">COMPRAS NO BALCÃO</h3>${UI.table([{ t: 'Data', v: v => fdate(v.data) }, { t: 'Itens', v: v => v.itens.map(i => `${i.qtd}× ${esc(i.nome)}`).join(', ') }, { t: 'Total', cls: 'num', v: v => brl(v.total) }], vds)}` : ''}`,
      foot: `<a class="btn" target="_blank" href="${UI.wa(c.telefone, '')}">${ic('wa')} WhatsApp</a><button class="btn" id="vcLink">${ic('link')} Enviar ficha</button><span class="grow"></span><button class="btn" id="vcAg">${ic('cal')} Agendar</button><button class="btn" id="vcEd">${ic('edit')} Editar</button><button class="btn pri" id="vcAt">${ic('needle')} Novo atendimento</button>`,
      onOpen: m => {
        $$('[data-ana]', m.el).forEach(b => b.onclick = () => Forms.verAnamnese(b.dataset.ana));
        Fotos.widget(m.$('#cliFotos'), { clienteId: c.id }, { readonly: true, emptyMsg: 'Nenhuma foto deste cliente ainda — adicione pelos atendimentos' });
        m.$('#vcLink').onclick = () => Forms.linkAnamnese(c);
        m.$('#vcEd').onclick = () => { m.close(); this.form(c); };
        m.$('#vcAg').onclick = () => { m.close(); Forms.agendamento({ clienteId: c.id }); };
        m.$('#vcAt').onclick = () => { m.close(); Forms.atendimento({ clienteId: c.id }); };
      }
    });
  }
};

/* ---------------- ANAMNESES ---------------- */
Views.anamneses = {
  title: 'Fichas de Anamnese', st: { tab: 'nova', q: '' },
  sub() { return 'Fichas preenchidas online pelos clientes chegam aqui em tempo real'; },
  render(el) {
    const st = this.st, all = DB.all('anamneses');
    App.actions(`<button class="btn pri" id="anLink">${ic('link')} Link da ficha para clientes</button>`);
    const cnt = s => all.filter(a => a.status === s).length;
    el.innerHTML = `<div class="toolbar"><div class="tabs">${[['nova', `Novas (${cnt('nova')})`], ['revisada', `Revisadas (${cnt('revisada')})`], ['arquivada', 'Arquivadas'], ['', 'Todas']].map(([k, t]) => `<button data-t="${k}" class="${st.tab === k ? 'on' : ''}">${t}</button>`).join('')}</div>
      <div class="search">${ic('search')}<input id="q" placeholder="Buscar por nome, CPF..." value="${esc(st.q)}"></div></div>
      <div class="alert info mb">${ic('file')}<div>Envie o link para o cliente pelo WhatsApp (botão acima, na agenda ou na ficha do cliente). Ele preenche no celular, assina com o dedo e a ficha aparece aqui como <b>Nova</b>. Fichas com respostas de risco aparecem destacadas.</div></div><div id="lst"></div>`;
    const draw = () => {
      const q = st.q.toLowerCase();
      const rows = all.filter(a => (!st.tab || a.status === st.tab) && (!q || [a.nome, a.cpf, a.telefone].join(' ').toLowerCase().includes(q))).sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
      $('#lst', el).innerHTML = UI.table([
        { t: 'Recebida', v: a => fdt(a.criadoEm) },
        { t: 'Cliente', v: a => `<span class="strong">${esc(a.nome)}</span><small>${esc(a.telefone || '')} ${a.nasc ? '· ' + idade(a.nasc) + ' anos' : ''}</small>` },
        { t: 'Procedimento', v: a => `${a.tipoProcedimento === 'piercing' ? '<span class="pill info">Piercing</span>' : '<span class="pill acc">Tatuagem</span>'}<small>${esc(a.regiao || '')}</small>` },
        { t: 'Atenção', v: a => { const al = Biz.anamneseAlertas(a); const menor = a.nasc && idade(a.nasc) < 18; return (menor ? '<span class="pill bad">MENOR DE IDADE</span> ' : '') + (al.length ? `<span class="pill warn">${al.length} ponto(s)</span><small>${esc(al.slice(0, 3).join(', '))}</small>` : '<span class="pill ok">OK</span>'); } },
        { t: 'Vínculo', v: a => a.clienteId && DB.get('clientes', a.clienteId) ? `<span class="pill ok">Cliente</span>` : '<span class="pill warn">Sem vínculo</span>' },
        { t: 'Status', v: a => UI.statusPill(a.status) },
        { t: '', cls: 'act', v: a => `<button class="btn sm" data-v="${a.id}">${ic('eye')} Abrir</button>` }
      ], rows, { emptyMsg: 'Nenhuma ficha aqui' });
      $$('[data-v]', el).forEach(b => b.onclick = () => Forms.verAnamnese(b.dataset.v));
    };
    draw();
    $('#q').oninput = e => { st.q = e.target.value; draw(); };
    $$('[data-t]', el).forEach(b => b.onclick = () => { st.tab = b.dataset.t; this.render(el); });
    $('#anLink').onclick = () => Forms.linkAnamnese();
  }
};

Forms.verAnamnese = id => {
  const a = DB.get('anamneses', id); if (!a) return;
  const r = a.respostas || {}, det = a.detalhes || {}, al = Biz.anamneseAlertas(a), menor = a.nasc && idade(a.nasc) < 18;
  const cli = DB.get('clientes', a.clienteId);
  const match = !cli ? DB.all('clientes').find(c => (a.cpf && c.cpf && c.cpf.replace(/\D/g, '') === a.cpf.replace(/\D/g, '')) || (a.telefone && c.telefone && c.telefone.replace(/\D/g, '').slice(-8) === a.telefone.replace(/\D/g, '').slice(-8))) : null;
  UI.modal({ title: 'Ficha de Anamnese', size: 'lg', body: `
    <div class="row mb"><div><div style="font-size:20px;font-weight:700">${esc(a.nome)}</div><div class="muted small">Recebida em ${fdt(a.criadoEm)} · ${a.tipoProcedimento === 'piercing' ? 'Piercing' : 'Tatuagem'} ${a.regiao ? '— ' + esc(a.regiao) : ''}</div></div><span class="grow"></span>${UI.statusPill(a.status)}</div>
    ${menor ? `<div class="alert bad mb">${ic('alert')}<div><b>Menor de idade (${idade(a.nasc)} anos).</b> Exige autorização e presença do responsável legal. Responsável: ${esc(a.responsavel || 'não informado')} ${a.responsavelCpf ? '— CPF ' + esc(a.responsavelCpf) : ''}</div></div>` : ''}
    ${al.length ? `<div class="alert warn mb">${ic('alert')}<div><b>Pontos de atenção:</b> ${al.map(esc).join(' · ')}</div></div>` : '<div class="alert ok mb">Nenhuma resposta de risco.</div>'}
    <div class="grid g3 small">
      <div><span class="muted">CPF:</span> ${esc(a.cpf || '—')}</div><div><span class="muted">Nascimento:</span> ${fdate(a.nasc)} ${a.nasc ? `(${idade(a.nasc)} anos)` : ''}</div><div><span class="muted">WhatsApp:</span> ${esc(a.telefone || '—')}</div>
      <div><span class="muted">E-mail:</span> ${esc(a.email || '—')}</div><div><span class="muted">Endereço:</span> ${esc(a.endereco || '—')}</div><div><span class="muted">Contato de emergência:</span> ${esc(a.contatoEmergencia || '—')}</div>
    </div>
    <div class="hr"></div>
    <div class="grid g2" style="gap:0 28px">${ANAMNESE_PERGUNTAS.map(q => `<div class="ana-q"><span>${q.txt}</span><b class="${r[q.id] === 'sim' && q.alerta ? 'down' : ''}">${r[q.id] === 'sim' ? 'SIM' : r[q.id] === 'nao' ? 'Não' : '—'}</b>${det[q.id] ? `<div class="det">↳ ${esc(det[q.id])}</div>` : ''}</div>`).join('')}</div>
    ${a.obs ? `<div class="alert info mt">${esc(a.obs)}</div>` : ''}
    <div class="hr"></div>
    <div class="grid g2"><div class="small">
      <div>${a.aceiteTermos ? '✅' : '❌'} Declarou veracidade das informações e aceitou o termo de consentimento e os cuidados pós-procedimento</div>
      <div class="mt">${a.aceiteLGPD ? '✅' : '❌'} Autorizou o tratamento de dados pessoais e de saúde (LGPD)</div>
      <div class="mt">${a.autorizaImagem ? '✅' : '➖'} ${a.autorizaImagem ? 'Autorizou' : 'Não autorizou'} uso de imagem do trabalho nas redes do estúdio</div>
    </div><div>${a.assinatura ? `<div class="small muted mb">Assinatura</div><img class="sig-img" src="${a.assinatura}">` : '<div class="muted small">Sem assinatura digital</div>'}</div></div>
    <div class="hr no-print"></div>
    <div class="no-print">${cli ? `<div class="alert ok">${ic('users')}Vinculada ao cliente <b>&nbsp;${esc(cli.nome)}</b></div>` : `<div class="alert warn">${ic('users')}<div>Ficha ainda não vinculada a um cliente.${match ? ` Encontramos um cadastro compatível: <b>${esc(match.nome)}</b>.` : ''}</div></div>
      <div class="row mt">${match ? `<button class="btn ok" id="aLinkM">Vincular a ${esc(match.nome.split(' ')[0])}</button>` : ''}<button class="btn" id="aNew">${ic('plus')} Criar cliente com estes dados</button><select id="aSel" style="width:auto;max-width:260px">${UI.opts('clientes', { empty: '— vincular a outro cliente —' }).map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></div>`}</div>`,
    foot: `<button class="btn" onclick="window.print()">${ic('print')} Imprimir / PDF</button>${a.telefone ? `<a class="btn" target="_blank" href="${UI.wa(a.telefone, '')}">${ic('wa')}</a>` : ''}<span class="grow"></span>
      <button class="btn danger" id="aDel">${ic('trash')}</button>${a.status !== 'arquivada' ? '<button class="btn" id="aArq">Arquivar</button>' : ''}${a.status !== 'revisada' ? `<button class="btn pri" id="aRev">${ic('check')} Marcar como revisada</button>` : ''}`,
    onOpen: m => {
      const link = cid => { a.clienteId = cid; DB.save('anamneses', a); UI.toast('Ficha vinculada ao cliente'); m.close(); Forms.verAnamnese(a.id); };
      if (m.$('#aLinkM')) m.$('#aLinkM').onclick = () => link(match.id);
      if (m.$('#aSel')) m.$('#aSel').onchange = e => e.target.value && link(e.target.value);
      if (m.$('#aNew')) m.$('#aNew').onclick = () => { const c = DB.save('clientes', { nome: a.nome, cpf: a.cpf, nasc: a.nasc, telefone: a.telefone, email: a.email, endereco: a.endereco, instagram: a.instagram || '', origem: 'Ficha online' }); link(c.id); };
      if (m.$('#aRev')) m.$('#aRev').onclick = () => { a.status = 'revisada'; a.revisadaPor = DB.user.nome; a.revisadaEm = new Date().toISOString(); DB.save('anamneses', a); m.close(); UI.toast('Ficha revisada'); };
      if (m.$('#aArq')) m.$('#aArq').onclick = () => { a.status = 'arquivada'; DB.save('anamneses', a); m.close(); };
      m.$('#aDel').onclick = () => UI.confirm('Excluir definitivamente esta ficha de anamnese?', () => { DB.remove('anamneses', a.id); m.close(); });
    }
  });
};

/* ---------------- EQUIPE & COMISSÕES ---------------- */
Views.equipe = {
  title: 'Equipe & Comissões', st: { ym: ymNow(), tab: 'comissoes' },
  sub() { return 'Tatuadores, piercers, recepção e limpeza — salários, comissões e pagamentos'; },
  render(el) {
    const st = this.st;
    App.actions(`<button class="btn pri" id="eqNovo">${ic('plus')} Novo membro</button>`);
    const profs = DB.all('profissionais').sort((a, b) => a.nome.localeCompare(b.nome));
    const ats = DB.all('atendimentos').filter(a => a.data.startsWith(st.ym));
    const com = DB.all('lancamentos').filter(l => l.categoria === 'Comissões');
    el.innerHTML = `<div class="toolbar"><div class="tabs"><button data-t="comissoes" class="${st.tab === 'comissoes' ? 'on' : ''}">Comissões do mês</button><button data-t="equipe" class="${st.tab === 'equipe' ? 'on' : ''}">Cadastro da equipe</button></div>
      ${st.tab === 'comissoes' ? `<span class="grow"></span><button class="btn icon" id="mP">${ic('left')}</button><b style="min-width:130px;text-align:center">${ymLabel(st.ym)}</b><button class="btn icon" id="mN">${ic('right')}</button><button class="btn" id="folha">${ic('money')} Lançar folha do mês</button>` : ''}</div><div id="body"></div>`;
    const body = $('#body', el);
    if (st.tab === 'equipe') {
      body.innerHTML = UI.table([
        { t: 'Nome', v: p => `<div class="row" style="flex-wrap:nowrap"><div class="avatar" style="background:${p.cor}">${initials(p.nome)}</div><div><span class="strong">${esc(p.nome)}</span><small>${esc(p.especialidade || '')}</small></div></div>` },
        { t: 'Função', v: p => esc(p.funcao) }, { t: 'Vínculo', v: p => `<span class="pill">${esc(p.vinculo)}</span>` },
        { t: 'Salário fixo', cls: 'num', v: p => p.salario ? brl(p.salario) : '—' }, { t: 'Comissão', cls: 'num', v: p => p.comissaoPct ? p.comissaoPct + '%' : '—' },
        { t: 'Telefone', v: p => esc(p.telefone || '') }, { t: 'Status', v: p => p.ativo !== false ? '<span class="pill ok">Ativo</span>' : '<span class="pill">Inativo</span>' },
        { t: '', cls: 'act', v: p => `<button class="btn sm icon" data-e="${p.id}">${ic('edit')}</button>` }
      ], profs);
      $$('[data-e]', el).forEach(b => b.onclick = () => this.form(DB.get('profissionais', b.dataset.e)));
    } else {
      const rows = profs.filter(p => p.comissaoPct > 0 || ats.some(a => a.profissionalId === p.id)).map(p => {
        const a = ats.filter(x => x.profissionalId === p.id), c = com.filter(l => l.profissionalId === p.id && l.data.startsWith(st.ym));
        return { p, n: a.length, fat: sum(a, x => x.valorLiquido), tot: sum(c, l => l.valor), pago: sum(c.filter(l => l.status === 'pago'), l => l.valor), pend: sum(c.filter(l => l.status === 'pendente'), l => l.valor), ids: c.filter(l => l.status === 'pendente').map(l => l.id) };
      });
      const fixos = profs.filter(p => p.salario > 0 && p.ativo !== false);
      body.innerHTML = `<div class="grid g4 mb">
        <div class="card kpi"><div class="lbl">Comissões geradas</div><div class="val">${brl(sum(rows, r => r.tot))}</div></div>
        <div class="card kpi green"><div class="lbl">Já pagas</div><div class="val">${brl(sum(rows, r => r.pago))}</div></div>
        <div class="card kpi gold"><div class="lbl">A pagar</div><div class="val">${brl(sum(rows, r => r.pend))}</div><div class="hint">vencimento dia ${DB.config.diaComissao} do mês seguinte</div></div>
        <div class="card kpi blue"><div class="lbl">Folha fixa (salários/diaristas)</div><div class="val">${brl(sum(fixos, p => p.salario))}</div><div class="hint">${fixos.length} pessoas</div></div></div>
        ${UI.table([
          { t: 'Profissional', v: r => `<span style="color:${r.p.cor}">●</span> <b>${esc(r.p.nome)}</b><small>${esc(r.p.funcao)} · ${r.p.comissaoPct}%</small>` },
          { t: 'Atendimentos', cls: 'num', v: r => r.n }, { t: 'Faturamento', cls: 'num', v: r => brl(r.fat) },
          { t: 'Comissão total', cls: 'num', v: r => `<b>${brl(r.tot)}</b>` }, { t: 'Pago', cls: 'num', v: r => brl(r.pago) }, { t: 'Pendente', cls: 'num', v: r => r.pend ? `<b class="down">${brl(r.pend)}</b>` : '—' },
          { t: '', cls: 'act', v: r => `<button class="btn sm" data-ext="${r.p.id}">${ic('eye')} Extrato</button>${r.pend ? `<button class="btn sm ok" data-pay="${r.p.id}">${ic('check')} Pagar ${brl(r.pend)}</button>` : ''}` }
        ], rows, { emptyMsg: 'Sem comissões no período', foot: `<tr><td>Total</td><td class="num">${sum(rows, r => r.n)}</td><td class="num">${brl(sum(rows, r => r.fat))}</td><td class="num">${brl(sum(rows, r => r.tot))}</td><td class="num">${brl(sum(rows, r => r.pago))}</td><td class="num">${brl(sum(rows, r => r.pend))}</td><td></td></tr>` })}`;
      $$('[data-pay]', el).forEach(b => b.onclick = () => { const r = rows.find(x => x.p.id === b.dataset.pay); UI.confirm(`Confirmar pagamento de <b>${brl(r.pend)}</b> em comissões para <b>${esc(r.p.nome)}</b> (${ymLabel(st.ym)})?`, () => { r.ids.forEach(id => { const l = DB.get('lancamentos', id); l.status = 'pago'; l.pagoEm = today(); DB.save('lancamentos', l, true); }); DB.emit(); UI.toast('Comissões pagas'); }, { yes: 'Pagar', danger: false }); });
      $$('[data-ext]', el).forEach(b => b.onclick = () => this.extrato(b.dataset.ext, st.ym));
      $('#mP').onclick = () => { st.ym = ymShift(st.ym, -1); this.render(el); };
      $('#mN').onclick = () => { st.ym = ymShift(st.ym, 1); this.render(el); };
      $('#folha').onclick = () => {
        let n = 0;
        const doMesL = DB.all('lancamentos').filter(l => l.tipo === 'despesa' && l.data.startsWith(st.ym));
        fixos.forEach(p => { if (doMesL.some(l => l.folhaRef === `${p.id}:${st.ym}` || l.profissionalId === p.id && ['Salários e encargos', 'Limpeza e conservação'].includes(l.categoria) || (['Salários e encargos', 'Limpeza e conservação'].includes(l.categoria) && l.descricao.includes(p.nome.split(' ')[0])))) return; DB.save('lancamentos', { tipo: 'despesa', categoria: /limpeza/i.test(p.funcao) ? 'Limpeza e conservação' : 'Salários e encargos', descricao: `${/limpeza/i.test(p.funcao) ? 'Limpeza' : 'Salário'} — ${p.nome} (${ymLabel(st.ym)})`, valor: p.salario, data: `${st.ym}-05`, vencimento: `${ymShift(st.ym, 1)}-05`, status: 'pendente', profissionalId: p.id, folhaRef: `${p.id}:${st.ym}` }, true); n++; });
        DB.emit(); UI.toast(n ? `${n} lançamento(s) de folha criados em Contas a pagar` : 'Folha deste mês já lançada', n ? 'ok' : 'warn');
      };
    }
    $$('[data-t]', el).forEach(b => b.onclick = () => { st.tab = b.dataset.t; this.render(el); });
    $('#eqNovo').onclick = () => this.form();
  },

  extrato(pid, ym) {
    const p = DB.get('profissionais', pid);
    const ats = DB.all('atendimentos').filter(a => a.profissionalId === pid && a.data.startsWith(ym)).sort((a, b) => a.data.localeCompare(b.data));
    UI.modal({ title: `Extrato de comissões — ${esc(p.nome)}`, size: 'lg', body: `<p class="muted mb">${ymLabel(ym)} · comissão padrão ${p.comissaoPct}%</p>${UI.table([
      { t: 'Data', v: a => fdate(a.data) }, { t: 'Cliente', v: a => esc(DB.get('clientes', a.clienteId)?.nome || '') }, { t: 'Serviço', v: a => esc(DB.get('servicos', a.servicoId)?.nome || '') },
      { t: 'Valor', cls: 'num', v: a => brl(a.valorLiquido) }, { t: '%', cls: 'num', v: a => a.comissaoPct + '%' }, { t: 'Comissão', cls: 'num', v: a => `<b>${brl(a.comissaoValor)}</b>` }
    ], ats, { foot: `<tr><td colspan="3">Total</td><td class="num">${brl(sum(ats, a => a.valorLiquido))}</td><td></td><td class="num">${brl(sum(ats, a => a.comissaoValor))}</td></tr>` })}`,
      foot: `<button class="btn" onclick="window.print()">${ic('print')} Imprimir</button><span class="grow"></span><button class="btn" data-close>Fechar</button>` });
  },

  form(p = {}) {
    const edit = !!p.id; p = { ativo: true, cor: '#7fae55', vinculo: 'Comissionado', funcao: 'Tatuador', comissaoPct: 50, salario: 0, ...p };
    UI.modal({ title: edit ? 'Editar membro da equipe' : 'Novo membro da equipe', body: `<form class="fg" id="pF">
      ${UI.f('Nome *', 'nome', p.nome, { col: 8 })}${UI.f('Cor na agenda', 'cor', p.cor, { type: 'color', col: 4, attrs: 'style="height:40px;padding:4px"' })}
      ${UI.f('Função', 'funcao', p.funcao, { type: 'select', col: 4, opts: ['Tatuador', 'Tatuadora', 'Body Piercer', 'Tatuador(a) e Piercer', 'Recepção', 'Limpeza', 'Gerente', 'Aprendiz', 'Outro'] })}
      ${UI.f('Vínculo', 'vinculo', p.vinculo, { type: 'select', col: 4, opts: ['Comissionado', 'CLT', 'CLT + comissão', 'Fixo (diarista)', 'MEI / PJ', 'Sócio'] })}
      ${UI.f('Especialidade', 'especialidade', p.especialidade, { col: 4, ph: 'Ex.: realismo' })}
      ${UI.f('Comissão (%)', 'comissaoPct', p.comissaoPct, { type: 'number', col: 4, help: '% sobre o valor líquido do serviço' })}
      ${UI.f('Salário / valor fixo mensal (R$)', 'salario', p.salario, { type: 'number', col: 4, help: 'incluir encargos para custo real' })}
      ${UI.f('Telefone', 'telefone', p.telefone, { col: 4 })}
      ${UI.f('Chave PIX', 'pix', p.pix, { col: 8 })}${UI.f('Status', 'ativo', p.ativo ? '1' : '0', { type: 'select', col: 4, opts: [['1', 'Ativo'], ['0', 'Inativo']] })}</form>`,
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="pOk">Salvar</button>`,
      onOpen: m => m.$('#pOk').onclick = () => { const d = UI.formData(m.$('#pF')); if (!d.nome) return UI.toast('Informe o nome', 'warn'); d.ativo = d.ativo === '1'; d.comissaoPct = +d.comissaoPct || 0; d.salario = +d.salario || 0; DB.save('profissionais', { ...p, ...d }); m.close(); UI.toast('Salvo'); } });
  }
};

/* ---------------- SERVIÇOS & KITS ---------------- */
Views.servicos = {
  title: 'Serviços & Kits de Insumos', st: { tipo: '' },
  sub() { return 'Defina o que cada procedimento consome — o custo e o lucro são calculados automaticamente'; },
  render(el) {
    const st = this.st;
    App.actions(`<button class="btn pri" id="sNovo">${ic('plus')} Novo serviço</button>`);
    const comTipo = t => { const ps = DB.all('profissionais').filter(p => p.ativo !== false && p.comissaoPct > 0 && (t === 'piercing' ? /pierc/i.test(p.funcao) : /tatu/i.test(p.funcao))); return ps.length ? sum(ps, p => p.comissaoPct) / ps.length : 0; };
    const rows = DB.all('servicos').filter(s => !st.tipo || s.tipo === st.tipo).map(s => { const k = Biz.custoKit(s.kit), c = comTipo(s.tipo), cv = s.precoBase * c / 100, l = s.precoBase - k - cv; return { ...s, _k: k, _c: c, _l: l }; }).sort((a, b) => a.tipo.localeCompare(b.tipo) || a.precoBase - b.precoBase);
    el.innerHTML = `<div class="toolbar"><div class="tabs">${[['', 'Todos'], ['tattoo', 'Tatuagem'], ['piercing', 'Piercing']].map(([k, t]) => `<button data-t="${k}" class="${st.tipo === k ? 'on' : ''}">${t}</button>`).join('')}</div></div>
      ${UI.table([
        { t: 'Serviço', v: s => `<span class="strong">${esc(s.nome)}</span><small>${s.tipo === 'piercing' ? 'Piercing' : 'Tatuagem'} · ${s.duracaoMin} min · ${(s.kit || []).length} itens no kit</small>` },
        { t: 'Preço base', cls: 'num', v: s => brl(s.precoBase) },
        { t: 'Custo do kit', cls: 'num', v: s => `${brl(s._k)}<small>${pct(s.precoBase ? s._k / s.precoBase * 100 : 0)} do preço</small>` },
        { t: 'Comissão média', cls: 'num', v: s => `${brl(s.precoBase * s._c / 100)}<small>${pct(s._c)}</small>` },
        { t: 'Lucro estimado', cls: 'num', v: s => `<b class="${s._l < 0 ? 'down' : 'up'}">${brl(s._l)}</b><small>margem ${pct(s.precoBase ? s._l / s.precoBase * 100 : 0)}</small>` },
        { t: 'Status', v: s => s.ativo !== false ? '<span class="pill ok">Ativo</span>' : '<span class="pill">Inativo</span>' },
        { t: '', cls: 'act', v: s => `<button class="btn sm icon" data-e="${s.id}">${ic('edit')}</button>` }
      ], rows)}
      <div class="alert info mt">${ic('alert')}<div>Lucro estimado = preço base − custo do kit de insumos − comissão média dos profissionais do tipo. Não considera taxas de cartão nem despesas fixas (veja a DRE para o resultado completo).</div></div>`;
    $$('[data-t]', el).forEach(b => b.onclick = () => { st.tipo = b.dataset.t; this.render(el); });
    $$('[data-e]', el).forEach(b => b.onclick = () => this.form(DB.get('servicos', b.dataset.e)));
    $('#sNovo').onclick = () => this.form();
  },

  form(s = {}) {
    const edit = !!s.id; s = { tipo: 'tattoo', duracaoMin: 60, ativo: true, kit: [], ...s };
    const opts = UI.opts('insumos', { empty: '— insumo —', label: i => `${i.nome} (${i.unidade} · ${brl(i.custoUnit)})` });
    const row = (k = {}) => `<tr><td><select data-k="insumoId">${opts.map(([v, t]) => `<option value="${v}" ${v === k.insumoId ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></td><td style="width:110px"><input type="number" step="any" data-k="qtd" value="${k.qtd ?? 1}"></td><td class="num" data-c style="width:100px"></td><td style="width:40px"><button type="button" class="btn sm icon danger" data-rm>${ic('x')}</button></td></tr>`;
    UI.modal({ title: edit ? 'Editar serviço' : 'Novo serviço', size: 'lg', body: `<form class="fg" id="sF">
      ${UI.f('Nome *', 'nome', s.nome, { col: 6 })}${UI.f('Tipo', 'tipo', s.tipo, { type: 'select', col: 2, opts: [['tattoo', 'Tatuagem'], ['piercing', 'Piercing'], ['outro', 'Outro']] })}
      ${UI.f('Preço base (R$)', 'precoBase', s.precoBase, { type: 'number', col: 2 })}${UI.f('Duração (min)', 'duracaoMin', s.duracaoMin, { type: 'number', col: 2 })}
      <div class="fsec">Kit de insumos consumidos por procedimento</div>
      <div class="c12"><div class="tbl-wrap"><table class="tbl" id="kT"><thead><tr><th>Insumo</th><th>Qtd</th><th class="num">Custo</th><th></th></tr></thead><tbody>${s.kit.map(row).join('')}</tbody></table></div><button type="button" class="btn sm mt" id="kAdd">${ic('plus')} Adicionar insumo</button></div>
      ${UI.f('Status', 'ativo', s.ativo !== false ? '1' : '0', { type: 'select', col: 3, opts: [['1', 'Ativo'], ['0', 'Inativo']] })}
      <div class="c9 calc-box" id="kC"></div></form>`,
      foot: `${edit ? `<button class="btn danger" id="sDel">${ic('trash')}</button><span class="grow"></span>` : ''}<button class="btn" data-close>Cancelar</button><button class="btn pri" id="sOk">Salvar</button>`,
      onOpen: m => {
        const read = () => $$('#kT tbody tr', m.el).map(tr => ({ insumoId: $('[data-k=insumoId]', tr).value, qtd: +$('[data-k=qtd]', tr).value || 0 })).filter(k => k.insumoId);
        const calc = () => { $$('#kT tbody tr', m.el).forEach(tr => { const i = DB.get('insumos', $('[data-k=insumoId]', tr).value); $('[data-c]', tr).textContent = i ? brl(i.custoUnit * (+$('[data-k=qtd]', tr).value || 0)) : '—'; }); const k = Biz.custoKit(read()), p = +m.$('[name=precoBase]').value || 0; m.$('#kC').innerHTML = `<div><small>Custo do kit</small><b>${brl(k)}</b></div><div><small>% do preço</small><b>${pct(p ? k / p * 100 : 0)}</b></div><div><small>Sobra antes da comissão</small><b class="up">${brl(p - k)}</b></div>`; };
        const bind = () => $$('[data-rm]', m.el).forEach(b => b.onclick = () => { b.closest('tr').remove(); calc(); });
        m.el.addEventListener('input', calc); m.el.addEventListener('change', calc);
        m.$('#kAdd').onclick = () => { $('#kT tbody', m.el).insertAdjacentHTML('beforeend', row()); bind(); calc(); };
        bind(); calc();
        m.$('#sOk').onclick = () => { const d = UI.formData(m.$('#sF')); if (!d.nome) return UI.toast('Informe o nome', 'warn'); DB.save('servicos', { ...s, nome: d.nome, tipo: d.tipo, precoBase: +d.precoBase || 0, duracaoMin: +d.duracaoMin || 60, ativo: d.ativo === '1', kit: read() }); m.close(); UI.toast('Serviço salvo'); };
        if (edit) m.$('#sDel').onclick = () => UI.confirm('Excluir este serviço? (atendimentos antigos são mantidos)', () => { DB.remove('servicos', s.id); m.close(); });
      }
    });
  }
};
