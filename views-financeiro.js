/* ============================================================
   FINANCEIRO · DRE & RELATÓRIOS · CONFIGURAÇÕES
   ============================================================ */

/* ---------------- FINANCEIRO ---------------- */
Views.financeiro = {
  title: 'Contas & Caixa', st: { ym: ymNow(), tab: 'lanc', tipo: '', cat: '', status: '', q: '' },
  sub() { return 'Lançamentos, contas a pagar e receber, despesas fixas e fluxo de caixa'; },
  render(el) {
    const st = this.st;
    const L = DB.all('lancamentos');
    const doMes = L.filter(l => (l.data || '').startsWith(st.ym));
    const recM = sum(doMes.filter(l => l.tipo === 'receita'), l => l.valor), despM = sum(doMes.filter(l => l.tipo === 'despesa'), l => l.valor);
    const cx = Biz.caixa(st.ym);
    const atras = L.filter(l => l.status === 'pendente' && l.tipo === 'despesa' && (l.vencimento || l.data) < today());
    App.actions(`<button class="btn" id="fRec">${ic('repeat')} Gerar fixas do mês</button><button class="btn" id="fDas">DAS do mês</button><button class="btn ok" id="fNR">${ic('plus')} Receita</button><button class="btn pri" id="fND">${ic('plus')} Despesa</button>`);
    el.innerHTML = `<div class="toolbar"><button class="btn icon" id="mP">${ic('left')}</button><b style="min-width:130px;text-align:center">${ymLabel(st.ym)}</b><button class="btn icon" id="mN">${ic('right')}</button><span class="grow"></span>
      <div class="tabs">${[['lanc', 'Lançamentos'], ['pagar', 'Contas a pagar'], ['receber', 'A receber'], ['fluxo', 'Fluxo de caixa']].map(([k, t]) => `<button data-t="${k}" class="${st.tab === k ? 'on' : ''}">${t}</button>`).join('')}</div></div>
      <div class="grid g4 mb">
        <div class="card kpi green"><div class="ic">${ic('in')}</div><div class="lbl">Receitas (competência)</div><div class="val">${brl(recM)}</div></div>
        <div class="card kpi"><div class="ic">${ic('out')}</div><div class="lbl">Despesas (competência)</div><div class="val">${brl(despM)}</div><div class="hint">inclui compras de estoque</div></div>
        <div class="card kpi gold"><div class="ic">${ic('money')}</div><div class="lbl">Saldo de caixa do mês</div><div class="val ${cx.saldo < 0 ? 'down' : ''}">${brl(cx.saldo)}</div><div class="hint">entrou ${brl(cx.ent)} · saiu ${brl(cx.sai)}</div></div>
        <div class="card kpi blue"><div class="ic">${ic('alert')}</div><div class="lbl">Contas em atraso</div><div class="val ${atras.length ? 'down' : ''}">${atras.length}</div><div class="hint">${brl(sum(atras, l => l.valor))}</div></div></div>
      <div id="body"></div>`;
    const body = $('#body', el);
    const venc = l => l.vencimento || l.data;
    const actions = l => `${l.status === 'pendente' ? `<button class="btn sm ok" data-pay="${l.id}">${ic('check')} ${l.tipo === 'receita' ? 'Receber' : 'Pagar'}</button>` : ''}<button class="btn sm icon" data-e="${l.id}">${ic('edit')}</button>`;
    const stPill = l => l.status === 'pendente' && venc(l) < today() ? UI.statusPill('atrasado') : UI.statusPill(l.status);
    const bind = () => {
      $$('[data-pay]', el).forEach(b => b.onclick = () => { const l = DB.get('lancamentos', b.dataset.pay); l.status = 'pago'; l.pagoEm = today(); DB.save('lancamentos', l); UI.toast(l.tipo === 'receita' ? 'Recebimento registrado' : 'Pagamento registrado'); });
      $$('[data-e]', el).forEach(b => b.onclick = () => this.form(DB.get('lancamentos', b.dataset.e)));
    };
    if (st.tab === 'lanc') {
      const cats = [...new Set(doMes.map(l => l.categoria))].sort();
      body.innerHTML = `<div class="toolbar"><div class="search">${ic('search')}<input id="q" placeholder="Buscar descrição..." value="${esc(st.q)}"></div>
        <select id="fT" style="width:auto"><option value="">Receitas e despesas</option><option value="receita" ${st.tipo === 'receita' ? 'selected' : ''}>Só receitas</option><option value="despesa" ${st.tipo === 'despesa' ? 'selected' : ''}>Só despesas</option></select>
        <select id="fC" style="width:auto"><option value="">Todas as categorias</option>${cats.map(c => `<option ${st.cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        <select id="fS" style="width:auto"><option value="">Todos os status</option><option value="pago" ${st.status === 'pago' ? 'selected' : ''}>Pago</option><option value="pendente" ${st.status === 'pendente' ? 'selected' : ''}>Pendente</option></select>
        <button class="btn" id="fCsv">${ic('download')} CSV</button></div><div id="lst"></div>`;
      const draw = () => {
        const q = st.q.toLowerCase();
        const rows = doMes.filter(l => (!st.tipo || l.tipo === st.tipo) && (!st.cat || l.categoria === st.cat) && (!st.status || l.status === st.status) && (!q || (l.descricao || '').toLowerCase().includes(q))).sort((a, b) => b.data.localeCompare(a.data));
        this._rows = rows;
        const r = sum(rows.filter(l => l.tipo === 'receita'), l => l.valor), d = sum(rows.filter(l => l.tipo === 'despesa'), l => l.valor);
        $('#lst', el).innerHTML = UI.table([
          { t: 'Data', v: l => fdate(l.data) },
          { t: 'Descrição', v: l => `<span class="strong">${esc(l.descricao)}</span><small>${esc(l.categoria)}${l.recorrente ? ' · <span class="pill" style="padding:1px 6px">fixa</span>' : ''}${l.origem ? ' · automático' : ''}</small>` },
          { t: 'Forma', v: l => esc(l.forma || '—') },
          { t: 'Vencimento', v: l => fdate(venc(l)) },
          { t: 'Status', v: stPill },
          { t: 'Valor', cls: 'num', v: l => `<b class="${l.tipo === 'receita' ? 'up' : 'down'}">${l.tipo === 'receita' ? '+' : '−'} ${brl(l.valor)}</b>` },
          { t: '', cls: 'act', v: actions }
        ], rows, { emptyMsg: 'Sem lançamentos', foot: `<tr><td colspan="5">Receitas ${brl(r)} · Despesas ${brl(d)}</td><td class="num ${r - d >= 0 ? 'up' : 'down'}">${brl(r - d)}</td><td></td></tr>` });
        bind();
      };
      draw();
      $('#q').oninput = e => { st.q = e.target.value; draw(); };
      $('#fT').onchange = e => { st.tipo = e.target.value; draw(); };
      $('#fC').onchange = e => { st.cat = e.target.value; draw(); };
      $('#fS').onchange = e => { st.status = e.target.value; draw(); };
      $('#fCsv').onclick = () => UI.download(`financeiro-${st.ym}.csv`, UI.csv([['Data', 'Tipo', 'Categoria', 'Descrição', 'Forma', 'Vencimento', 'Status', 'Pago em', 'Valor'], ...this._rows.map(l => [fdate(l.data), l.tipo, l.categoria, l.descricao, l.forma, fdate(venc(l)), l.status, fdate(l.pagoEm), num(l.valor)])]), 'text/csv');
    } else if (st.tab === 'pagar' || st.tab === 'receber') {
      const tp = st.tab === 'pagar' ? 'despesa' : 'receita';
      const rows = L.filter(l => l.tipo === tp && l.status === 'pendente').sort((a, b) => venc(a).localeCompare(venc(b)));
      const grp = { atr: rows.filter(l => venc(l) < today()), hoje: rows.filter(l => venc(l) === today()), prox: rows.filter(l => venc(l) > today()) };
      const cols = [{ t: 'Vencimento', v: l => `<b class="${venc(l) < today() ? 'down' : ''}">${fdate(venc(l))}</b>` }, { t: 'Descrição', v: l => `<span class="strong">${esc(l.descricao)}</span><small>${esc(l.categoria)}</small>` }, { t: 'Status', v: stPill }, { t: 'Valor', cls: 'num', v: l => `<b>${brl(l.valor)}</b>` }, { t: '', cls: 'act', v: actions }];
      body.innerHTML = [['atr', 'Em atraso', 'bad'], ['hoje', 'Vence hoje', 'warn'], ['prox', 'Próximos', 'info']].map(([k, t, c]) => `<div class="card mb"><h3><span class="pill ${c}">${grp[k].length}</span> ${t} <span class="sp"></span><span style="text-transform:none;color:var(--txt)">${brl(sum(grp[k], l => l.valor))}</span></h3>${UI.table(cols, grp[k], { emptyMsg: 'Nada aqui' })}</div>`).join('');
      bind();
    } else {
      const [y, m] = st.ym.split('-').map(Number); const nd = new Date(y, m, 0).getDate();
      const pagos = L.filter(l => l.status === 'pago' && (l.pagoEm || l.data || '').startsWith(st.ym));
      const anteriores = L.filter(l => l.status === 'pago' && (l.pagoEm || l.data) < st.ym + '-01');
      let saldo = sum(anteriores.filter(l => l.tipo === 'receita'), l => l.valor) - sum(anteriores.filter(l => l.tipo === 'despesa'), l => l.valor);
      const inicial = saldo;
      const dias = [...Array(nd)].map((_, i) => { const d = `${st.ym}-${String(i + 1).padStart(2, '0')}`; const dl = pagos.filter(l => (l.pagoEm || l.data) === d); const e = sum(dl.filter(l => l.tipo === 'receita'), l => l.valor), s = sum(dl.filter(l => l.tipo === 'despesa'), l => l.valor); saldo += e - s; return { d, e, s, saldo }; });
      body.innerHTML = `<div class="card mb"><h3>Saldo acumulado no mês <span class="sp"></span><span class="muted" style="text-transform:none">saldo inicial ${brl(inicial)} → final ${brl(saldo)}</span></h3>${UI.lineChart(dias.map(x => x.d.slice(8)), dias.map(x => x.saldo), { color: '#e0bf6e' })}</div>
        ${UI.table([{ t: 'Dia', v: x => fdate(x.d) }, { t: 'Entradas', cls: 'num', v: x => x.e ? `<span class="up">${brl(x.e)}</span>` : '—' }, { t: 'Saídas', cls: 'num', v: x => x.s ? `<span class="down">${brl(x.s)}</span>` : '—' }, { t: 'Resultado do dia', cls: 'num', v: x => brl(x.e - x.s) }, { t: 'Saldo acumulado', cls: 'num', v: x => `<b class="${x.saldo < 0 ? 'down' : ''}">${brl(x.saldo)}</b>` }], dias.filter(x => x.e || x.s))}`;
    }
    $$('[data-t]', el).forEach(b => b.onclick = () => { st.tab = b.dataset.t; this.render(el); });
    $('#mP').onclick = () => { st.ym = ymShift(st.ym, -1); this.render(el); };
    $('#mN').onclick = () => { st.ym = ymShift(st.ym, 1); this.render(el); };
    $('#fNR').onclick = () => this.form({ tipo: 'receita' });
    $('#fND').onclick = () => this.form({ tipo: 'despesa' });
    $('#fRec').onclick = () => { const n = Biz.gerarRecorrentes(st.ym); UI.toast(n ? `${n} despesas fixas geradas em ${ymLabel(st.ym)}` : 'As despesas fixas deste mês já foram geradas', n ? 'ok' : 'warn'); };
    $('#fDas').onclick = () => {
      const ant = ymShift(st.ym, -1), rb = Biz.dre(ant).receita, al = +DB.config.aliquotaSimples || 0, v = round2(rb * al / 100);
      if (DB.all('lancamentos').some(l => l.dasRef === ant)) return UI.toast('DAS referente a ' + ymLabel(ant) + ' já lançado', 'warn');
      UI.confirm(`Lançar DAS de <b>${brl(v)}</b> (${al}% sobre o faturamento de ${ymLabel(ant)}: ${brl(rb)}) com vencimento em 20/${st.ym.slice(5)}?<br><small class="muted">Alíquota configurável em Configurações. Confirme o valor real no PGDAS.</small>`, () => { DB.save('lancamentos', { tipo: 'despesa', categoria: 'Impostos (DAS/Simples)', descricao: `DAS Simples Nacional — competência ${ymLabel(ant)}`, valor: v, data: `${st.ym}-20`, vencimento: `${st.ym}-20`, status: 'pendente', dasRef: ant }); UI.toast('DAS lançado'); }, { yes: 'Lançar', danger: false });
    };
  },

  form(l = {}) {
    const edit = !!l.id; l = { tipo: 'despesa', status: 'pago', data: today(), forma: 'PIX', ...l };
    const cats = l.tipo === 'receita' ? CAT_RECEITA : CAT_DESPESA;
    UI.modal({ title: `${edit ? 'Editar' : 'Nova'} ${l.tipo === 'receita' ? 'receita' : 'despesa'}`, body: `
      ${l.origem ? `<div class="alert info mb">${ic('link')}Lançamento gerado automaticamente por ${l.origem.startsWith('atendimento') ? 'um atendimento' : l.origem.startsWith('venda') ? 'uma venda do PDV' : 'um sinal de agendamento'}. Para alterar valores, edite a origem.</div>` : ''}
      <form class="fg" id="lF">
      ${UI.f('Descrição *', 'descricao', l.descricao, { col: 8, ph: l.tipo === 'receita' ? 'Ex.: Workshop de fine line' : 'Ex.: Aluguel de novembro' })}${UI.f('Categoria', 'categoria', l.categoria || cats[0], { type: 'select', col: 4, opts: cats })}
      ${UI.f('Valor (R$) *', 'valor', l.valor, { type: 'number', col: 3 })}${UI.f('Competência', 'data', l.data, { type: 'date', col: 3, help: 'mês em que entra na DRE' })}${UI.f('Vencimento', 'vencimento', l.vencimento || l.data, { type: 'date', col: 3 })}${UI.f('Forma', 'forma', l.forma, { type: 'select', col: 3, opts: ['', ...FORMAS, 'Boleto', 'Transferência'] })}
      ${UI.f('Status', 'status', l.status, { type: 'select', col: 3, opts: [['pago', l.tipo === 'receita' ? 'Recebido' : 'Pago'], ['pendente', 'Pendente']] })}${UI.f('Data do pagamento', 'pagoEm', l.pagoEm || (l.status === 'pago' ? l.data : ''), { type: 'date', col: 3 })}
      ${UI.f('Profissional (opcional)', 'profissionalId', l.profissionalId, { type: 'select', col: 6, opts: UI.opts('profissionais', { empty: '—' }) })}
      <div class="c12"><label class="row small"><input type="checkbox" name="recorrente" ${l.recorrente ? 'checked' : ''}> Despesa/receita fixa mensal (aluguel, internet, salários...) — gerada pelo botão "Gerar fixas do mês"</label></div>
      ${UI.f('Observações', 'obs', l.obs, { type: 'textarea', col: 12 })}</form>`,
      foot: `${edit ? `<button class="btn danger" id="lDel">${ic('trash')} Excluir</button><span class="grow"></span>` : ''}<button class="btn" data-close>Cancelar</button><button class="btn pri" id="lOk">Salvar</button>`,
      onOpen: m => {
        const F = m.$('#lF');
        F.status.onchange = () => { if (F.status.value === 'pago' && !F.pagoEm.value) F.pagoEm.value = today(); if (F.status.value === 'pendente') F.pagoEm.value = ''; };
        m.$('#lOk').onclick = () => {
          const d = UI.formData(F); if (!d.descricao || !(+d.valor > 0)) return UI.toast('Informe descrição e valor', 'warn');
          if (d.status === 'pago' && !d.pagoEm) d.pagoEm = d.data;
          DB.save('lancamentos', { ...l, ...d, valor: +d.valor }); m.close(); UI.toast('Lançamento salvo');
        };
        if (edit) m.$('#lDel').onclick = () => UI.confirm('Excluir este lançamento?', () => { DB.remove('lancamentos', l.id); m.close(); });
      }
    });
  }
};

/* ---------------- DRE & RELATÓRIOS ---------------- */
Views.relatorios = {
  title: 'DRE & Relatórios', st: { ym: ymNow(), tab: 'dre' },
  sub() { return 'Resultado gerencial, lucratividade por serviço e produto, ponto de equilíbrio'; },
  render(el) {
    const st = this.st;
    App.actions(`<button class="btn" onclick="window.print()">${ic('print')} Imprimir</button>`);
    el.innerHTML = `<div class="toolbar"><button class="btn icon" id="mP">${ic('left')}</button><b style="min-width:130px;text-align:center">${ymLabel(st.ym)}</b><button class="btn icon" id="mN">${ic('right')}</button><span class="grow"></span>
      <div class="tabs">${[['dre', 'DRE do mês'], ['anual', '12 meses'], ['servicos', 'Por serviço'], ['joias', 'Joias'], ['clientes', 'Clientes']].map(([k, t]) => `<button data-t="${k}" class="${st.tab === k ? 'on' : ''}">${t}</button>`).join('')}</div></div><div id="body"></div>`;
    const body = $('#body', el), ym = st.ym;
    if (st.tab === 'dre') {
      const d = Biz.dre(ym), p = Biz.dre(ymShift(ym, -1));
      const fixas = sum(DB.all('lancamentos').filter(l => l.recorrente && l.data.startsWith(ym)), l => l.valor);
      const mcPct = d.receita ? d.margemContrib / d.receita : 0, pe = mcPct > 0 ? d.totalOpex / mcPct : 0;
      const line = (t, v, pv, o = {}) => `<tr class="${o.cls || ''}"><td style="${o.ind ? 'padding-left:32px' : ''}">${o.b ? `<b>${t}</b>` : t}</td><td class="num">${o.b ? `<b>${brl(v)}</b>` : brl(v)}</td><td class="num muted">${d.receita ? pct(v / d.receita * 100) : '—'}</td><td class="num muted">${brl(pv)}</td><td class="num">${pv ? `<span class="${(v - pv) * (o.neg ? -1 : 1) >= 0 ? 'up' : 'down'}">${pct((v - pv) / Math.abs(pv) * 100)}</span>` : '—'}</td></tr>`;
      const recKeys = [...new Set([...Object.keys(d.rec), ...Object.keys(p.rec)])], opKeys = [...new Set([...Object.keys(d.opex), ...Object.keys(p.opex)])].sort((a, b) => (d.opex[b] || 0) - (d.opex[a] || 0));
      body.innerHTML = `<div class="grid g4 mb">
        <div class="card kpi"><div class="lbl">Receita bruta</div><div class="val">${brl(d.receita)}</div><div class="hint">${d.nAt} atendimentos · ${d.nVd} vendas</div></div>
        <div class="card kpi green"><div class="lbl">Lucro líquido</div><div class="val ${d.lucro < 0 ? 'down' : 'up'}">${brl(d.lucro)}</div><div class="hint">margem ${pct(d.margemPct)}</div></div>
        <div class="card kpi gold"><div class="lbl">Margem de contribuição</div><div class="val">${pct(mcPct * 100)}</div><div class="hint">sobra de cada R$ 100 após custos variáveis: ${brl(mcPct * 100)}</div></div>
        <div class="card kpi blue"><div class="lbl">Ponto de equilíbrio</div><div class="val">${brl(pe)}</div><div class="hint">faturamento mínimo p/ cobrir ${brl(d.totalOpex)} de despesas</div></div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Demonstrativo de Resultado — ${ymLabel(ym)}</th><th class="num">Valor</th><th class="num">% receita</th><th class="num">Mês anterior</th><th class="num">Variação</th></tr></thead><tbody>
          ${line('RECEITA BRUTA', d.receita, p.receita, { b: true })}
          ${recKeys.map(k => line(k, d.rec[k] || 0, p.rec[k] || 0, { ind: true })).join('')}
          ${line('(−) Taxas de cartão', d.taxas, p.taxas, { ind: true, neg: true })}${line('(−) Impostos (Simples Nacional)', d.impostos, p.impostos, { ind: true, neg: true })}
          ${line('= RECEITA LÍQUIDA', d.receitaLiq, p.receitaLiq, { b: true })}
          ${line('(−) Insumos consumidos nos atendimentos', d.insumosAt, p.insumosAt, { ind: true, neg: true })}${line('(−) Custo das joias vendidas (CMV)', d.cmvJoias, p.cmvJoias, { ind: true, neg: true })}${line('(−) Comissões dos profissionais', d.comissoes, p.comissoes, { ind: true, neg: true })}
          ${line('= MARGEM DE CONTRIBUIÇÃO', d.margemContrib, p.margemContrib, { b: true })}
          ${opKeys.map(k => line('(−) ' + k, d.opex[k] || 0, p.opex[k] || 0, { ind: true, neg: true })).join('')}
          ${line('= TOTAL DESPESAS OPERACIONAIS', d.totalOpex, p.totalOpex, { b: true, neg: true })}
        </tbody><tfoot><tr><td style="font-size:16px">LUCRO LÍQUIDO</td><td class="num ${d.lucro >= 0 ? 'up' : 'down'}" style="font-size:16px">${brl(d.lucro)}</td><td class="num">${pct(d.margemPct)}</td><td class="num">${brl(p.lucro)}</td><td class="num">${p.lucro ? pct((d.lucro - p.lucro) / Math.abs(p.lucro) * 100) : '—'}</td></tr></tfoot></table></div>
        <div class="alert info mt">${ic('alert')}<div>DRE gerencial por competência. Compras de estoque não entram como despesa: o custo é reconhecido quando o insumo é <b>consumido</b> (atendimento ou consumo interno) ou a joia é <b>vendida</b>. Despesas fixas do mês: ${brl(fixas)}.</div></div>`;
    } else if (st.tab === 'anual') {
      const ms = [...Array(12)].map((_, i) => ymShift(ym, i - 11)), ds = ms.map(m => ({ m, ...Biz.dre(m) }));
      const T = k => sum(ds, x => x[k]);
      body.innerHTML = `<div class="card mb"><h3>Lucro líquido — últimos 12 meses</h3>${UI.lineChart(ms.map(m => MESES[+m.slice(5) - 1]), ds.map(x => x.lucro), { color: '#9cc96e' })}</div>
        <div class="card mb"><h3>Receita × custos variáveis × despesas</h3>${UI.barChart(ms.map(m => MESES[+m.slice(5) - 1]), [{ name: 'Receita', data: ds.map(x => x.receita) }, { name: 'Custos variáveis', data: ds.map(x => x.custosVar + x.taxas + x.impostos), color: '#e0bf6e' }, { name: 'Despesas operacionais', data: ds.map(x => x.totalOpex), color: '#3b5243' }])}</div>
        ${UI.table([{ t: 'Mês', v: x => ymLabel(x.m) }, { t: 'Receita', cls: 'num', v: x => brl(x.receita) }, { t: 'Taxas/impostos', cls: 'num', v: x => brl(x.taxas + x.impostos) }, { t: 'Insumos', cls: 'num', v: x => brl(x.insumosAt) }, { t: 'CMV joias', cls: 'num', v: x => brl(x.cmvJoias) }, { t: 'Comissões', cls: 'num', v: x => brl(x.comissoes) }, { t: 'Despesas', cls: 'num', v: x => brl(x.totalOpex) }, { t: 'Lucro', cls: 'num', v: x => `<b class="${x.lucro >= 0 ? 'up' : 'down'}">${brl(x.lucro)}</b>` }, { t: 'Margem', cls: 'num', v: x => pct(x.margemPct) }], ds,
          { foot: `<tr><td>Total</td><td class="num">${brl(T('receita'))}</td><td class="num">${brl(T('taxas') + T('impostos'))}</td><td class="num">${brl(T('insumosAt'))}</td><td class="num">${brl(T('cmvJoias'))}</td><td class="num">${brl(T('comissoes'))}</td><td class="num">${brl(T('totalOpex'))}</td><td class="num">${brl(T('lucro'))}</td><td class="num">${pct(T('receita') ? T('lucro') / T('receita') * 100 : 0)}</td></tr>` })}
        <button class="btn mt" id="dreCsv">${ic('download')} Exportar CSV</button>`;
      $('#dreCsv').onclick = () => UI.download('dre-12-meses.csv', UI.csv([['Mês', 'Receita', 'Taxas', 'Impostos', 'Insumos', 'CMV joias', 'Comissões', 'Despesas operacionais', 'Lucro', 'Margem %'], ...ds.map(x => [ymLabel(x.m), num(x.receita), num(x.taxas), num(x.impostos), num(x.insumosAt), num(x.cmvJoias), num(x.comissoes), num(x.totalOpex), num(x.lucro), num(x.margemPct, 1)])]), 'text/csv');
    } else if (st.tab === 'servicos') {
      const ats = DB.all('atendimentos').filter(a => a.data.startsWith(ym));
      const g = {}; ats.forEach(a => { const s = g[a.servicoId] ||= { n: 0, fat: 0, ins: 0, com: 0 }; s.n++; s.fat += a.valorLiquido; s.ins += a.custoInsumos; s.com += a.comissaoValor; });
      const rows = Object.entries(g).map(([id, s]) => ({ ...s, s: DB.get('servicos', id), luc: s.fat - s.ins - s.com })).sort((a, b) => b.luc - a.luc);
      const reg = {}; ats.filter(a => a.tipo === 'tattoo').forEach(a => reg[a.regiao || 'Não informado'] = (reg[a.regiao || 'Não informado'] || 0) + 1);
      body.innerHTML = UI.table([{ t: 'Serviço', v: r => `<span class="strong">${esc(r.s?.nome || '(removido)')}</span><small>${r.s?.tipo === 'piercing' ? 'Piercing' : 'Tatuagem'}</small>` }, { t: 'Qtd', cls: 'num', v: r => r.n }, { t: 'Faturamento', cls: 'num', v: r => brl(r.fat) }, { t: 'Ticket médio', cls: 'num', v: r => brl(r.fat / r.n) }, { t: 'Insumos', cls: 'num', v: r => `${brl(r.ins)}<small>${brl(r.ins / r.n)} / atend.</small>` }, { t: 'Comissões', cls: 'num', v: r => brl(r.com) }, { t: 'Lucro bruto', cls: 'num', v: r => `<b class="up">${brl(r.luc)}</b>` }, { t: 'Margem', cls: 'num', v: r => pct(r.fat ? r.luc / r.fat * 100 : 0) }], rows, { emptyMsg: 'Sem atendimentos no mês' })
        + `<div class="grid g2 mt"><div class="card"><h3>Faturamento por profissional</h3>${UI.donut(DB.all('profissionais').map(p => ({ k: p.nome, v: sum(ats.filter(a => a.profissionalId === p.id), a => a.valorLiquido) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v))}</div>
           <div class="card"><h3>Regiões do corpo mais tatuadas</h3>${UI.donut(Object.entries(reg).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v), { fmt: v => num(v, 0) })}</div></div>`;
    } else if (st.tab === 'joias') {
      const g = {};
      DB.all('vendas').filter(v => v.data.startsWith(ym)).forEach(v => v.itens.forEach(i => { const x = g[i.joiaId] ||= { q: 0, r: 0, c: 0 }; x.q += i.qtd; x.r += i.qtd * i.preco; x.c += i.qtd * i.custo; }));
      DB.all('atendimentos').filter(a => a.data.startsWith(ym)).forEach(a => (a.joias || []).forEach(i => { const x = g[i.joiaId] ||= { q: 0, r: 0, c: 0 }; x.q += i.qtd; x.r += i.qtd * i.preco; x.c += i.qtd * i.custo; }));
      const rows = Object.entries(g).map(([id, x]) => ({ ...x, j: DB.get('joias', id) })).sort((a, b) => (b.r - b.c) - (a.r - a.c));
      const mat = {}; rows.forEach(r => { const k = r.j?.material || '—'; mat[k] = (mat[k] || 0) + r.r - r.c; });
      body.innerHTML = `<div class="grid g3 mb"><div class="card kpi"><div class="lbl">Peças vendidas</div><div class="val">${sum(rows, r => r.q)}</div></div><div class="card kpi gold"><div class="lbl">Receita com joias</div><div class="val">${brl(sum(rows, r => r.r))}</div></div><div class="card kpi green"><div class="lbl">Lucro com joias</div><div class="val">${brl(sum(rows, r => r.r - r.c))}</div><div class="hint">margem ${pct(sum(rows, r => r.r) ? sum(rows, r => r.r - r.c) / sum(rows, r => r.r) * 100 : 0)}</div></div></div>
        <div class="grid g-2-1"><div>${UI.table([{ t: 'Joia', v: r => `<span class="strong">${esc(r.j?.nome || '(removida)')}</span><small>${esc(r.j?.material || '')}</small>` }, { t: 'Qtd', cls: 'num', v: r => r.q }, { t: 'Receita', cls: 'num', v: r => brl(r.r) }, { t: 'Custo', cls: 'num', v: r => brl(r.c) }, { t: 'Lucro', cls: 'num', v: r => `<b class="up">${brl(r.r - r.c)}</b>` }, { t: 'Margem', cls: 'num', v: r => pct(r.r ? (r.r - r.c) / r.r * 100 : 0) }], rows, { emptyMsg: 'Nenhuma joia vendida no mês' })}</div>
        <div class="card"><h3>Lucro por material</h3>${UI.donut(Object.entries(mat).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v))}</div></div>`;
    } else {
      const cl = DB.all('clientes'), ats = DB.all('atendimentos');
      const novos = cl.filter(c => (c.criadoEm || '').startsWith(ym)).length;
      const org = {}; cl.forEach(c => org[c.origem || 'Não informado'] = (org[c.origem || 'Não informado'] || 0) + 1);
      const g = {}; ats.forEach(a => { const x = g[a.clienteId] ||= { n: 0, v: 0, u: '' }; x.n++; x.v += a.valorLiquido + (a.totalJoias || 0); if (a.data > x.u) x.u = a.data; });
      const top = Object.entries(g).map(([id, x]) => ({ ...x, c: DB.get('clientes', id) })).filter(x => x.c).sort((a, b) => b.v - a.v).slice(0, 15);
      const rec = Object.values(g).filter(x => x.n > 1).length, lim = new Date(); lim.setMonth(lim.getMonth() - 4);
      const sumidos = Object.entries(g).filter(([, x]) => x.u < isoLocal(lim)).map(([id, x]) => ({ ...x, c: DB.get('clientes', id) })).filter(x => x.c).sort((a, b) => b.v - a.v).slice(0, 10);
      body.innerHTML = `<div class="grid g4 mb"><div class="card kpi"><div class="lbl">Clientes na base</div><div class="val">${cl.length}</div></div><div class="card kpi"><div class="lbl">Novos em ${MESES[+ym.slice(5) - 1]}</div><div class="val">${novos}</div></div><div class="card kpi green"><div class="lbl">Taxa de retorno</div><div class="val">${pct(Object.keys(g).length ? rec / Object.keys(g).length * 100 : 0)}</div><div class="hint">voltaram mais de 1 vez</div></div><div class="card kpi gold"><div class="lbl">Valor médio por cliente</div><div class="val">${brl(Object.keys(g).length ? sum(Object.values(g), x => x.v) / Object.keys(g).length : 0)}</div></div></div>
        <div class="grid g2"><div class="card"><h3>Top clientes (todo o período)</h3>${UI.table([{ t: 'Cliente', v: x => esc(x.c.nome) }, { t: 'Visitas', cls: 'num', v: x => x.n }, { t: 'Total', cls: 'num', v: x => `<b>${brl(x.v)}</b>` }], top)}</div>
        <div><div class="card mb"><h3>Como os clientes conheceram o estúdio</h3>${UI.donut(Object.entries(org).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v), { fmt: v => num(v, 0) })}</div>
        <div class="card"><h3>Bons clientes sumidos há +4 meses — chame de volta</h3>${sumidos.length ? sumidos.map(x => `<div class="li"><div><div class="t">${esc(x.c.nome)}</div><small>última visita ${fdate(x.u)} · ${brl(x.v)}</small></div><div class="r"><a class="btn sm" target="_blank" href="${UI.wa(x.c.telefone, `Oi ${x.c.nome.split(' ')[0]}! Saudades de você aqui no ${DB.config.nome} 🌿 Que tal a próxima arte? Temos horários disponíveis esta semana!`)}">${ic('wa')}</a></div></div>`).join('') : UI.empty('Ninguém sumido')}</div></div></div>`;
    }
    $$('[data-t]', el).forEach(b => b.onclick = () => { st.tab = b.dataset.t; this.render(el); });
    $('#mP').onclick = () => { st.ym = ymShift(st.ym, -1); this.render(el); };
    $('#mN').onclick = () => { st.ym = ymShift(st.ym, 1); this.render(el); };
  }
};

/* ---------------- CONFIGURAÇÕES ---------------- */
Views.config = {
  title: 'Configurações',
  render(el) {
    const c = DB.config, tx = c.taxas || {};
    el.innerHTML = `<div class="grid g2">
      <div class="card"><h3>Dados do estúdio</h3><form class="fg" id="cfE">
        ${UI.f('Nome do estúdio', 'nome', c.nome, { col: 12 })}${UI.f('CNPJ', 'cnpj', c.cnpj, { col: 6 })}${UI.f('Telefone / WhatsApp', 'telefone', c.telefone, { col: 6 })}
        ${UI.f('Endereço', 'endereco', c.endereco, { col: 8 })}${UI.f('Instagram', 'instagram', c.instagram, { col: 4 })}
        ${UI.f('Abre às (h)', 'horaInicio', c.horaInicio, { type: 'number', col: 3 })}${UI.f('Fecha às (h)', 'horaFim', c.horaFim, { type: 'number', col: 3 })}${UI.f('Meta mensal (R$)', 'metaMensal', c.metaMensal, { type: 'number', col: 6 })}
        ${UI.f('Dia de pagamento das comissões', 'diaComissao', c.diaComissao, { type: 'number', col: 6 })}${UI.f('Alíquota Simples Nacional (%)', 'aliquotaSimples', c.aliquotaSimples, { type: 'number', col: 6 })}
        ${UI.f('Sinal padrão dos orçamentos (%)', 'sinalPct', c.sinalPct, { type: 'number', col: 4 })}${UI.f('Validade dos orçamentos (dias)', 'validadeOrcamento', c.validadeOrcamento, { type: 'number', col: 4 })}${UI.f('Validade da esterilização (dias)', 'validadeEsterilizacao', c.validadeEsterilizacao, { type: 'number', col: 4 })}
        ${UI.f('Autoclaves do estúdio (uma por linha)', 'autoclaves', (c.autoclaves || []).join('\n'), { type: 'textarea', col: 12 })}
      </form></div>
      <div class="card"><h3>Taxas das maquininhas (%)</h3><p class="muted small mb">Aplicadas automaticamente em cada atendimento e venda, lançadas como despesa "Taxas de cartão".</p><div class="fg" id="cfT">
        ${FORMAS.map(f => UI.f(f, 'tx_' + f, tx[f] ?? 0, { type: 'number', col: 4 })).join('')}</div>
        <div class="hr"></div><h3>Ficha de anamnese</h3><p class="muted small mb">Link público para os clientes preencherem. Pode colocar na bio do Instagram!</p><button class="btn" id="cfLk">${ic('link')} Ver link da ficha</button></div>
      <div class="card"><h3>Backup & dados</h3>
        <p class="muted small mb">Exporte um backup completo (JSON) regularmente. A importação mescla os registros pelo ID.</p>
        <div class="row"><button class="btn" id="bkE">${ic('download')} Exportar backup</button><label class="btn">${ic('in')} Importar backup<input type="file" id="bkI" accept=".json" hidden></label></div>
        ${DB.mode === 'demo' ? `<div class="hr"></div><h3>Modo demonstração</h3><div class="row"><button class="btn" id="dmR">Recarregar dados de exemplo</button><button class="btn danger" id="dmZ">Começar do zero (apagar tudo)</button></div>` : ''}</div>
      <div class="card"><h3>Conexão</h3>
        ${DB.mode === 'firebase' ? `<div class="alert ok">${ic('check')}<div>Conectado ao Firebase — projeto <b>${esc(window.FIREBASE_CONFIG.projectId)}</b>. Dados sincronizados em tempo real entre todos os computadores e celulares da equipe.</div></div>`
          : `<div class="alert warn">${ic('alert')}<div>Rodando em <b>modo demonstração</b> (dados apenas neste navegador). Para usar online com toda a equipe, configure o Firebase em <code>js/firebase-config.js</code> — passo a passo no README.</div></div>`}
        <div class="small muted mt">Versão 1.0 · Desenvolvido por Evander</div></div></div>
      <div class="row end mt"><button class="btn pri" id="cfOk">${ic('check')} Salvar configurações</button></div>`;
    $('#cfOk').onclick = () => {
      const d = UI.formData($('#cfE')); const t = UI.formData($('#cfT')); const taxas = {}; FORMAS.forEach(f => taxas[f] = +t['tx_' + f] || 0);
      ['horaInicio', 'horaFim', 'metaMensal', 'diaComissao', 'aliquotaSimples', 'sinalPct', 'validadeOrcamento', 'validadeEsterilizacao'].forEach(k => d[k] = +d[k] || 0);
      d.autoclaves = (d.autoclaves || '').split('\n').map(x => x.trim()).filter(Boolean);
      DB.saveConfig({ ...d, taxas, atualizadoPeloUsuario: true }); UI.toast('Configurações salvas');
    };
    $('#cfLk').onclick = () => Forms.linkAnamnese();
    $('#bkE').onclick = () => UI.download(`backup-${(c.nome || 'studio').replace(/\W+/g, '-').toLowerCase()}-${today()}.json`, JSON.stringify(DB.exportJSON(), null, 1));
    $('#bkI').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const o = JSON.parse(r.result); UI.confirm('Importar este backup? Registros com o mesmo ID serão substituídos.', () => { DB.importJSON(o); UI.toast('Backup importado'); }, { danger: false, yes: 'Importar' }); } catch (er) { UI.toast('Arquivo inválido', 'err'); } }; r.readAsText(f); };
    if ($('#dmR')) { $('#dmR').onclick = () => UI.confirm('Substituir os dados atuais pelos dados de exemplo?', () => { DB.resetDemo(false); UI.toast('Dados de exemplo carregados'); }); $('#dmZ').onclick = () => UI.confirm('Apagar TODOS os dados deste navegador e começar do zero?', () => { DB.resetDemo(true); UI.toast('Sistema zerado'); }); }
  }
};
