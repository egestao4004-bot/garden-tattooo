/* ============================================================
   INSUMOS · JOIAS · MOVIMENTAÇÕES · PDV
   ============================================================ */

/* ---------------- INSUMOS ---------------- */
Views.insumos = {
  title: 'Estoque de Insumos', st: { cat: '', q: '', f: '' },
  sub() { return 'Da agulha ao desinfetante — tudo que o estúdio consome'; },
  render(el, params) {
    const st = this.st; if (params.f) { st.f = params.f; delete params.f; }
    const all = DB.all('insumos');
    const lim = new Date(); lim.setDate(lim.getDate() + 60); const limS = isoLocal(lim);
    App.actions(`<button class="btn" id="iCompras">${ic('cart')} Lista de compras</button><button class="btn" id="iConsumo">${ic('coffee')} Baixa de consumo interno</button><button class="btn pri" id="iNovo">${ic('plus')} Novo insumo</button>`);
    el.innerHTML = `<div class="grid g4 mb">
      <div class="card kpi"><div class="ic">${ic('box')}</div><div class="lbl">Itens cadastrados</div><div class="val">${all.length}</div></div>
      <div class="card kpi gold"><div class="ic">${ic('money')}</div><div class="lbl">Valor em estoque</div><div class="val">${brl(sum(all, i => i.qtd * i.custoUnit))}</div></div>
      <div class="card kpi"><div class="ic">${ic('alert')}</div><div class="lbl">Abaixo do mínimo</div><div class="val down">${all.filter(i => i.qtd <= i.minimo).length}</div></div>
      <div class="card kpi blue"><div class="ic">${ic('clock')}</div><div class="lbl">Vencendo em 60 dias</div><div class="val">${all.filter(i => i.validade && i.validade <= limS).length}</div></div></div>
      <div class="toolbar"><div class="search">${ic('search')}<input id="q" placeholder="Buscar insumo, fornecedor, lote..." value="${esc(st.q)}"></div>
      <select id="cat" style="width:auto"><option value="">Todas as categorias</option>${CAT_INSUMO.map(c => `<option ${st.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <div class="tabs"><button data-f="" class="${!st.f ? 'on' : ''}">Todos</button><button data-f="baixo" class="${st.f === 'baixo' ? 'on' : ''}">Estoque baixo</button><button data-f="venc" class="${st.f === 'venc' ? 'on' : ''}">Vencendo</button></div></div><div id="lst"></div>`;
    const draw = () => {
      const q = st.q.toLowerCase();
      const rows = all.filter(i => (!st.cat || i.categoria === st.cat) && (!q || [i.nome, i.fornecedor, i.lote].join(' ').toLowerCase().includes(q)) && (st.f !== 'baixo' || i.qtd <= i.minimo) && (st.f !== 'venc' || (i.validade && i.validade <= limS)))
        .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome));
      $('#lst', el).innerHTML = UI.table([
        { t: 'Insumo', v: i => `<span class="strong">${esc(i.nome)}</span><small>${esc(i.categoria)}${i.fornecedor ? ' · ' + esc(i.fornecedor) : ''}</small>` },
        { t: 'Estoque', v: i => { const p = Math.min(100, i.minimo ? i.qtd / (i.minimo * 2) * 100 : 100); const c = i.qtd <= i.minimo ? 'var(--bad)' : i.qtd <= i.minimo * 1.5 ? 'var(--warn)' : 'var(--ok)'; return `<b style="color:${c}">${num(i.qtd)} ${esc(i.unidade)}</b><div class="bar" style="width:120px;margin-top:4px"><i style="width:${p}%;background:${c}"></i></div><small>mín. ${num(i.minimo)}</small>`; } },
        { t: 'Custo un.', cls: 'num', v: i => brl(i.custoUnit) + `<small>/${esc(i.unidade)}</small>` },
        { t: 'Valor total', cls: 'num', v: i => brl(i.qtd * i.custoUnit) },
        { t: 'Validade', v: i => i.validade ? `<span class="${i.validade < today() ? 'down' : i.validade <= limS ? '' : ''}">${fdate(i.validade)}</span>${i.validade <= limS ? `<small class="${i.validade < today() ? 'down' : ''}">${i.validade < today() ? 'VENCIDO' : 'vence em breve'}</small>` : ''}<small>${esc(i.lote || '')}</small>` : '—' },
        { t: '', cls: 'act', v: i => `<button class="btn sm ok" data-in="${i.id}" title="Entrada / compra">${ic('in')}</button><button class="btn sm" data-out="${i.id}" title="Saída / consumo">${ic('out')}</button><button class="btn sm icon" data-e="${i.id}">${ic('edit')}</button>` }
      ], rows, { emptyMsg: 'Nenhum insumo encontrado' });
      $$('[data-in]', el).forEach(b => b.onclick = () => Forms.movimento('insumo', b.dataset.in, 'entrada'));
      $$('[data-out]', el).forEach(b => b.onclick = () => Forms.movimento('insumo', b.dataset.out, 'saida'));
      $$('[data-e]', el).forEach(b => b.onclick = () => this.form(DB.get('insumos', b.dataset.e)));
    };
    draw();
    $('#q').oninput = e => { st.q = e.target.value; draw(); };
    $('#cat').onchange = e => { st.cat = e.target.value; draw(); };
    $$('[data-f]', el).forEach(b => b.onclick = () => { st.f = b.dataset.f; this.render(el, {}); });
    $('#iNovo').onclick = () => this.form();
    $('#iConsumo').onclick = () => this.consumo();
    $('#iCompras').onclick = () => Forms.listaCompras();
  },

  form(i = {}) {
    const edit = !!i.id; i = { categoria: 'Descartáveis', unidade: 'un', qtd: 0, minimo: 0, custoUnit: 0, ...i };
    UI.modal({ title: edit ? 'Editar insumo' : 'Novo insumo', body: `<form class="fg" id="iF">
      ${UI.f('Nome *', 'nome', i.nome, { col: 8, ph: 'Ex.: Cartucho 3RL 0,35mm' })}${UI.f('Categoria', 'categoria', i.categoria, { type: 'select', col: 4, opts: CAT_INSUMO })}
      ${UI.f('Unidade de controle', 'unidade', i.unidade, { type: 'select', col: 3, opts: ['un', 'par', 'ml', 'l', 'g', 'kg', 'm', 'cm', 'folha', 'caixa', 'rolo', 'pacote'] })}
      ${UI.f(edit ? 'Quantidade atual' : 'Quantidade inicial', 'qtd', i.qtd, { type: 'number', col: 3, attrs: edit ? 'readonly title="Use entrada/saída/ajuste"' : '' })}
      ${UI.f('Estoque mínimo', 'minimo', i.minimo, { type: 'number', col: 3 })}${UI.f('Custo por unidade (R$)', 'custoUnit', i.custoUnit, { type: 'number', col: 3 })}
      <div class="c12 calc-box"><div style="flex:1;min-width:260px"><small>Calculadora de custo unitário</small><div class="row mt"><input type="number" step="any" id="cPack" placeholder="Preço da embalagem R$" style="width:170px"><span>÷</span><input type="number" step="any" id="cQtd" placeholder="Qtd na embalagem" style="width:150px"><button type="button" class="btn sm" id="cApl">Aplicar</button></div><span class="help">Ex.: caixa de 100 luvas por R$ 38 → R$ 0,38 por unidade. Frasco de 240ml por R$ 187 → R$ 0,78/ml</span></div></div>
      ${UI.f('Fornecedor', 'fornecedor', i.fornecedor, { col: 4 })}${UI.f('Lote', 'lote', i.lote, { col: 4 })}${UI.f('Validade', 'validade', i.validade, { type: 'date', col: 4 })}
      ${UI.f('Observações', 'obs', i.obs, { type: 'textarea', col: 12 })}</form>`,
      foot: `${edit ? `<button class="btn danger" id="iDel">${ic('trash')}</button><button class="btn" id="iAj">Ajustar inventário</button><span class="grow"></span>` : ''}<button class="btn" data-close>Cancelar</button><button class="btn pri" id="iOk">Salvar</button>`,
      onOpen: m => {
        m.$('#cApl').onclick = () => { const p = +m.$('#cPack').value, q = +m.$('#cQtd').value; if (p && q) m.$('[name=custoUnit]').value = Math.round(p / q * 10000) / 10000; };
        m.$('#iOk').onclick = () => { const d = UI.formData(m.$('#iF')); if (!d.nome) return UI.toast('Informe o nome', 'warn'); ['qtd', 'minimo', 'custoUnit'].forEach(k => d[k] = +d[k] || 0); const r = DB.save('insumos', { ...i, ...d }); if (!edit && d.qtd) DB.save('movEstoque', { tipo: 'insumo', itemId: r.id, nome: r.nome, mov: 'entrada', qtd: d.qtd, saldo: d.qtd, custoUnit: d.custoUnit, motivo: 'Estoque inicial', data: today() }); m.close(); UI.toast('Insumo salvo'); };
        if (edit) { m.$('#iDel').onclick = () => UI.confirm('Excluir este insumo?', () => { DB.remove('insumos', i.id); m.close(); }); m.$('#iAj').onclick = () => { m.close(); Forms.movimento('insumo', i.id, 'ajuste'); }; }
      }
    });
  },

  consumo() {
    const itens = DB.all('insumos').filter(i => ['Copa/Café', 'Higienização/Limpeza', 'Descartáveis', 'Escritório'].includes(i.categoria)).sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome));
    UI.modal({ title: 'Baixa de consumo interno', size: 'lg', body: `<p class="muted mb">Registre o que foi gasto no dia a dia do estúdio fora dos atendimentos: café, açúcar, copos, água, produtos de limpeza do salão, papel... O custo entra na DRE como despesa operacional.</p>
      <div class="row mb"><div class="f" style="width:180px"><label>Data</label><input type="date" id="cData" value="${today()}"></div><div class="f grow"><label>Observação</label><input id="cObs" placeholder="Ex.: consumo da semana"></div></div>
      ${UI.table([{ t: 'Item', v: i => `<span class="strong">${esc(i.nome)}</span><small>${esc(i.categoria)}</small>` }, { t: 'Em estoque', cls: 'num', v: i => `${num(i.qtd)} ${esc(i.unidade)}` }, { t: 'Custo un.', cls: 'num', v: i => brl(i.custoUnit) }, { t: 'Qtd consumida', v: i => `<input type="number" step="any" data-c="${i.id}" style="width:120px" placeholder="0">` }, { t: 'Custo', cls: 'num', v: i => `<span data-v="${i.id}">—</span>` }], itens)}
      <div class="calc-box mt"><div><small>Total do consumo</small><b id="cTot">${brl(0)}</b></div></div>`,
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="cOk">Registrar baixa</button>`,
      onOpen: m => {
        const calc = () => { let t = 0; $$('[data-c]', m.el).forEach(inp => { const i = DB.get('insumos', inp.dataset.c), v = (+inp.value || 0) * i.custoUnit; t += v; $(`[data-v="${i.id}"]`, m.el).textContent = inp.value ? brl(v) : '—'; }); m.$('#cTot').textContent = brl(t); };
        m.el.addEventListener('input', calc);
        m.$('#cOk').onclick = () => { let n = 0; const d = m.$('#cData').value || today(); $$('[data-c]', m.el).forEach(inp => { if (+inp.value > 0) { Biz.mover({ tipo: 'insumo', itemId: inp.dataset.c, mov: 'saida', qtd: +inp.value, motivo: 'Consumo interno', ref: m.$('#cObs').value, data: d }); n++; } }); if (!n) return UI.toast('Informe ao menos uma quantidade', 'warn'); DB.emit(); m.close(); UI.toast(`${n} itens baixados do estoque`); };
      }
    });
  }
};

Forms.listaCompras = () => {
  const ins = DB.all('insumos').filter(i => i.qtd <= i.minimo).map(i => ({ n: i.nome, cat: i.categoria, f: i.fornecedor, q: Math.ceil(i.minimo * 2 - i.qtd), u: i.unidade, c: i.custoUnit }));
  const jo = DB.all('joias').filter(j => j.qtd <= j.minimo).map(j => ({ n: `${j.nome} ${j.bitola || ''} ${j.tamanho || ''}`, cat: 'Joias', f: j.fornecedor, q: Math.ceil(j.minimo * 2 - j.qtd), u: 'un', c: j.custo }));
  const all = [...ins, ...jo]; const tot = sum(all, x => x.q * x.c);
  const txt = `*Lista de compras — ${DB.config.nome}* (${fdate(today())})\n\n` + all.map(x => `• ${x.n}: ${num(x.q)} ${x.u}${x.f ? ` (${x.f})` : ''}`).join('\n') + `\n\nEstimativa: ${brl(tot)}`;
  UI.modal({ title: 'Lista de compras sugerida', size: 'lg', body: `<p class="muted mb">Itens abaixo do estoque mínimo. Quantidade sugerida = repor até 2× o mínimo.</p>
    ${UI.table([{ t: 'Item', v: x => `<span class="strong">${esc(x.n)}</span><small>${esc(x.cat)}</small>` }, { t: 'Fornecedor', v: x => esc(x.f || '—') }, { t: 'Comprar', cls: 'num', v: x => `<b>${num(x.q)} ${esc(x.u)}</b>` }, { t: 'Custo estimado', cls: 'num', v: x => brl(x.q * x.c) }], all, { emptyMsg: 'Nada para comprar — estoque em dia!', foot: all.length ? `<tr><td colspan="3">Total estimado</td><td class="num">${brl(tot)}</td></tr>` : '' })}`,
    foot: `<button class="btn" onclick="window.print()">${ic('print')} Imprimir</button><button class="btn" id="lcCp">${ic('copy')} Copiar</button><a class="btn ok" target="_blank" href="https://wa.me/?text=${encodeURIComponent(txt)}">${ic('wa')} Enviar no WhatsApp</a>`,
    onOpen: m => m.$('#lcCp').onclick = () => UI.copy(txt) });
};

Forms.movimento = (tipo, id, mov) => {
  const col = tipo === 'joia' ? 'joias' : 'insumos'; const it = DB.get(col, id); if (!it) return;
  const cu = tipo === 'joia' ? it.custo : it.custoUnit, un = tipo === 'joia' ? 'un' : it.unidade;
  const tit = { entrada: 'Entrada no estoque (compra)', saida: 'Saída do estoque', ajuste: 'Ajuste de inventário (contagem)' }[mov];
  UI.modal({ title: tit, size: 'sm', body: `<div class="mb"><b>${esc(it.nome)}</b><div class="muted small">Estoque atual: ${num(it.qtd)} ${esc(un)} · custo ${brl(cu)}/${esc(un)}</div></div><form class="fg" id="mF">
    ${UI.f(mov === 'ajuste' ? 'Quantidade contada' : 'Quantidade (' + un + ')', 'qtd', '', { type: 'number', col: 6 })}${UI.f('Data', 'data', today(), { type: 'date', col: 6 })}
    ${mov === 'entrada' ? `${UI.f('Custo por ' + un + ' (R$)', 'custoUnit', cu, { type: 'number', col: 6, help: 'atualiza o custo médio' })}${UI.f('Valor total da nota', 'total', '', { type: 'number', col: 6 })}
      <div class="c12"><label class="row small"><input type="checkbox" name="gerarDesp" checked> Lançar despesa no financeiro (${tipo === 'joia' ? 'Compra de joias' : 'Compra de insumos'})</label></div>
      ${UI.f('Status do pagamento', 'statusPg', 'pago', { type: 'select', col: 6, opts: [['pago', 'Pago'], ['pendente', 'A pagar']] })}${UI.f('Fornecedor / NF', 'ref', it.fornecedor || '', { col: 6 })}` : ''}
    ${mov === 'saida' ? UI.f('Motivo', 'motivo', 'Consumo interno', { type: 'select', col: 12, opts: MOTIVOS_SAIDA }) + UI.f('Observação', 'ref', '', { col: 12 }) : ''}
    ${mov === 'ajuste' ? UI.f('Motivo do ajuste', 'ref', 'Contagem de inventário', { col: 12 }) : ''}</form>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="mOk">Confirmar</button>`,
    onOpen: m => {
      const F = m.$('#mF');
      if (mov === 'entrada') { const sync = () => { if (F.qtd.value && F.custoUnit.value) F.total.value = Math.round(F.qtd.value * F.custoUnit.value * 100) / 100; }; F.qtd.oninput = sync; F.custoUnit.oninput = sync; F.total.oninput = () => { if (F.qtd.value && F.total.value) F.custoUnit.value = Math.round(F.total.value / F.qtd.value * 10000) / 10000; }; }
      m.$('#mOk').onclick = () => {
        const d = UI.formData(F); if (d.qtd === '' || (mov !== 'ajuste' && !(d.qtd > 0))) return UI.toast('Informe a quantidade', 'warn');
        Biz.mover({ tipo, itemId: id, mov, qtd: d.qtd, custoUnit: mov === 'entrada' ? d.custoUnit : null, motivo: mov === 'entrada' ? 'Compra' : mov === 'ajuste' ? 'Ajuste de inventário' : d.motivo, ref: d.ref, data: d.data });
        if (mov === 'entrada' && d.gerarDesp) DB.save('lancamentos', { tipo: 'despesa', categoria: tipo === 'joia' ? 'Compra de joias (estoque)' : 'Compra de insumos', descricao: `Compra: ${d.qtd} ${un} ${it.nome}${d.ref ? ' — ' + d.ref : ''}`, valor: round2(d.total || d.qtd * d.custoUnit), data: d.data, vencimento: d.data, status: d.statusPg, pagoEm: d.statusPg === 'pago' ? d.data : null, forma: 'PIX' }, true);
        DB.emit(); m.close(); UI.toast('Estoque atualizado');
      };
    }
  });
};

/* ---------------- JOIAS ---------------- */
Views.joias = {
  title: 'Estoque de Joias', st: { cat: '', mat: '', q: '', f: '' },
  sub() { return 'Custo, markup, margem de lucro e preço de venda de cada peça'; },
  render(el, params) {
    const st = this.st; if (params.f) { st.f = params.f; delete params.f; }
    const all = DB.all('joias');
    const vC = sum(all, j => j.qtd * j.custo), vV = sum(all, j => j.qtd * j.preco);
    App.actions(`<button class="btn" id="jMk">${ic('trend')} Reajuste de markup</button><button class="btn pri" id="jNovo">${ic('plus')} Nova joia</button>`);
    el.innerHTML = `<div class="grid g4 mb">
      <div class="card kpi"><div class="ic">${ic('gem')}</div><div class="lbl">Peças em estoque</div><div class="val">${num(sum(all, j => j.qtd), 0)}</div><div class="hint">${all.length} modelos</div></div>
      <div class="card kpi gold"><div class="ic">${ic('money')}</div><div class="lbl">Valor de custo</div><div class="val">${brl(vC)}</div></div>
      <div class="card kpi green"><div class="ic">${ic('trend')}</div><div class="lbl">Valor de venda</div><div class="val">${brl(vV)}</div><div class="hint">lucro potencial ${brl(vV - vC)}</div></div>
      <div class="card kpi"><div class="ic">${ic('alert')}</div><div class="lbl">Estoque baixo</div><div class="val down">${all.filter(j => j.qtd <= j.minimo).length}</div></div></div>
      <div class="toolbar"><div class="search">${ic('search')}<input id="q" placeholder="Buscar joia, SKU..." value="${esc(st.q)}"></div>
      <select id="cat" style="width:auto"><option value="">Todos os tipos</option>${CAT_JOIA.map(c => `<option ${st.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <select id="mat" style="width:auto"><option value="">Todos os materiais</option>${MATERIAIS.map(c => `<option ${st.mat === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <div class="tabs"><button data-f="" class="${!st.f ? 'on' : ''}">Todas</button><button data-f="baixo" class="${st.f === 'baixo' ? 'on' : ''}">Estoque baixo</button></div></div><div id="lst"></div>`;
    const draw = () => {
      const q = st.q.toLowerCase();
      const rows = all.filter(j => (!st.cat || j.categoria === st.cat) && (!st.mat || j.material === st.mat) && (st.f !== 'baixo' || j.qtd <= j.minimo) && (!q || [j.nome, j.sku, j.material].join(' ').toLowerCase().includes(q))).sort((a, b) => a.nome.localeCompare(b.nome));
      $('#lst', el).innerHTML = UI.table([
        { t: 'Joia', v: j => `<span class="strong">${esc(j.nome)}</span><small>${esc(j.sku || '')} · ${esc(j.categoria)}</small>` },
        { t: 'Material / medida', v: j => `${esc(j.material)}<small>${esc(j.bitola || '')} ${j.tamanho && j.tamanho !== '—' ? '× ' + esc(j.tamanho) : ''}</small>` },
        { t: 'Estoque', cls: 'num', v: j => `<b class="${j.qtd <= j.minimo ? 'down' : ''}">${num(j.qtd, 0)}</b><small>mín. ${j.minimo}</small>` },
        { t: 'Custo', cls: 'num', v: j => brl(j.custo) },
        { t: 'Markup', cls: 'num', v: j => pct(Biz.markup(j.preco, j.custo)) },
        { t: 'Preço venda', cls: 'num', v: j => `<b style="color:var(--gold)">${brl(j.preco)}</b>` },
        { t: 'Lucro / margem', cls: 'num', v: j => `<b class="up">${brl(j.preco - j.custo)}</b><small>${pct(Biz.margem(j.preco, j.custo))} sobre a venda</small>` },
        { t: '', cls: 'act', v: j => `<button class="btn sm ok" data-in="${j.id}" title="Entrada">${ic('in')}</button><button class="btn sm" data-out="${j.id}" title="Saída">${ic('out')}</button><button class="btn sm icon" data-e="${j.id}">${ic('edit')}</button>` }
      ], rows, { emptyMsg: 'Nenhuma joia encontrada' });
      $$('[data-in]', el).forEach(b => b.onclick = () => Forms.movimento('joia', b.dataset.in, 'entrada'));
      $$('[data-out]', el).forEach(b => b.onclick = () => Forms.movimento('joia', b.dataset.out, 'saida'));
      $$('[data-e]', el).forEach(b => b.onclick = () => this.form(DB.get('joias', b.dataset.e)));
    };
    draw();
    $('#q').oninput = e => { st.q = e.target.value; draw(); };
    $('#cat').onchange = e => { st.cat = e.target.value; draw(); };
    $('#mat').onchange = e => { st.mat = e.target.value; draw(); };
    $$('[data-f]', el).forEach(b => b.onclick = () => { st.f = b.dataset.f; this.render(el, {}); });
    $('#jNovo').onclick = () => this.form();
    $('#jMk').onclick = () => this.reajuste();
  },

  form(j = {}) {
    const edit = !!j.id; j = { categoria: 'Labret', material: 'Titânio ASTM F136', markup: 150, precoAuto: true, qtd: 0, minimo: 3, custo: 0, ...j };
    UI.modal({ title: edit ? 'Editar joia' : 'Nova joia', body: `<form class="fg" id="jF">
      ${UI.f('Nome *', 'nome', j.nome, { col: 8, ph: 'Ex.: Labret Titânio ponto de luz' })}${UI.f('SKU / código', 'sku', j.sku || 'JW-' + (DB.all('joias').length + 101), { col: 4 })}
      ${UI.f('Tipo', 'categoria', j.categoria, { type: 'select', col: 4, opts: CAT_JOIA })}${UI.f('Material', 'material', j.material, { type: 'select', col: 4, opts: MATERIAIS })}
      ${UI.f('Bitola (espessura)', 'bitola', j.bitola, { col: 2, ph: '1,2mm' })}${UI.f('Tamanho', 'tamanho', j.tamanho, { col: 2, ph: '8mm' })}
      <div class="fsec">Precificação</div>
      ${UI.f('Custo (R$) *', 'custo', j.custo, { type: 'number', col: 3 })}${UI.f('Markup (%)', 'markup', j.markup, { type: 'number', col: 3, help: 'quanto acima do custo' })}
      ${UI.f('Preço de venda (R$)', 'preco', j.preco ?? Biz.precoPorMarkup(j.custo, j.markup), { type: 'number', col: 3 })}
      <div class="f c3"><label>Cálculo do preço</label><select name="precoAuto"><option value="1" ${j.precoAuto !== false ? 'selected' : ''}>Automático (markup)</option><option value="0" ${j.precoAuto === false ? 'selected' : ''}>Manual</option></select></div>
      <div class="c12 calc-box" id="jC"></div>
      <div class="fsec">Estoque</div>
      ${UI.f(edit ? 'Quantidade atual' : 'Quantidade inicial', 'qtd', j.qtd, { type: 'number', col: 3, attrs: edit ? 'readonly' : '' })}${UI.f('Estoque mínimo', 'minimo', j.minimo, { type: 'number', col: 3 })}${UI.f('Fornecedor', 'fornecedor', j.fornecedor, { col: 6 })}</form>`,
      foot: `${edit ? `<button class="btn danger" id="jDel">${ic('trash')}</button><button class="btn" id="jAj">Ajustar inventário</button><span class="grow"></span>` : ''}<button class="btn" data-close>Cancelar</button><button class="btn pri" id="jOk">Salvar</button>`,
      onOpen: m => {
        const F = m.$('#jF');
        const calc = src => {
          const c = +F.custo.value || 0, auto = F.precoAuto.value === '1';
          if (src === 'preco') { F.precoAuto.value = '0'; F.markup.value = Math.round(Biz.markup(+F.preco.value, c) * 10) / 10; }
          else if (auto || src === 'markup') { F.preco.value = Biz.precoPorMarkup(c, +F.markup.value); if (src === 'markup') F.precoAuto.value = '1'; }
          const p = +F.preco.value || 0;
          m.$('#jC').innerHTML = `<div><small>Custo</small><b>${brl(c)}</b></div><div><small>Preço de venda</small><b style="color:var(--gold)">${brl(p)}</b></div><div><small>Lucro por peça</small><b class="up">${brl(p - c)}</b></div><div><small>Markup</small><b>${pct(Biz.markup(p, c))}</b></div><div><small>Margem de lucro (sobre venda)</small><b>${pct(Biz.margem(p, c))}</b></div><div><small>Lucro no estoque</small><b>${brl((p - c) * (+F.qtd.value || 0))}</b></div>`;
        };
        F.custo.oninput = () => calc('custo'); F.markup.oninput = () => calc('markup'); F.preco.oninput = () => calc('preco'); F.precoAuto.onchange = () => calc('custo'); F.qtd.oninput = () => calc();
        calc();
        m.$('#jOk').onclick = () => {
          const d = UI.formData(F); if (!d.nome) return UI.toast('Informe o nome', 'warn');
          d.precoAuto = d.precoAuto === '1'; ['custo', 'markup', 'preco', 'qtd', 'minimo'].forEach(k => d[k] = +d[k] || 0);
          const r = DB.save('joias', { ...j, ...d });
          if (!edit && d.qtd) DB.save('movEstoque', { tipo: 'joia', itemId: r.id, nome: r.nome, mov: 'entrada', qtd: d.qtd, saldo: d.qtd, custoUnit: d.custo, motivo: 'Estoque inicial', data: today() });
          m.close(); UI.toast('Joia salva');
        };
        if (edit) { m.$('#jDel').onclick = () => UI.confirm('Excluir esta joia?', () => { DB.remove('joias', j.id); m.close(); }); m.$('#jAj').onclick = () => { m.close(); Forms.movimento('joia', j.id, 'ajuste'); }; }
      }
    });
  },

  reajuste() {
    UI.modal({ title: 'Reajuste de markup em massa', size: 'sm', body: `<form class="fg" id="rF">
      ${UI.f('Aplicar a', 'alvo', '', { type: 'select', col: 12, opts: [['', 'Todas as joias'], ...MATERIAIS.map(m => ['mat:' + m, 'Material: ' + m]), ...CAT_JOIA.map(c => ['cat:' + c, 'Tipo: ' + c])] })}
      ${UI.f('Novo markup (%)', 'markup', 150, { type: 'number', col: 12 })}
      <div class="c12 small muted">Joias com preço manual também passarão a usar o cálculo automático.</div></form>`,
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="rOk">Aplicar</button>`,
      onOpen: m => m.$('#rOk').onclick = () => {
        const d = UI.formData(m.$('#rF')); let n = 0;
        DB.all('joias').forEach(j => { if (d.alvo.startsWith('mat:') && j.material !== d.alvo.slice(4)) return; if (d.alvo.startsWith('cat:') && j.categoria !== d.alvo.slice(4)) return; j.markup = +d.markup; j.precoAuto = true; j.preco = Biz.precoPorMarkup(j.custo, j.markup); DB.save('joias', j, true); n++; });
        DB.emit(); m.close(); UI.toast(`${n} joias reajustadas`);
      } });
  }
};

/* ---------------- MOVIMENTAÇÕES ---------------- */
Views.movimentos = {
  title: 'Movimentações de Estoque', st: { ym: ymNow(), tipo: '', mov: '', q: '' },
  sub() { return 'Histórico completo de entradas, saídas e ajustes + consumo por item'; },
  render(el) {
    const st = this.st;
    const all = DB.all('movEstoque').filter(m => (m.data || '').startsWith(st.ym));
    const cons = {}; all.filter(m => m.mov === 'saida' && m.tipo === 'insumo').forEach(m => { const c = cons[m.itemId] ||= { nome: m.nome, q: 0, v: 0, un: DB.get('insumos', m.itemId)?.unidade || '', cat: DB.get('insumos', m.itemId)?.categoria || '', at: 0, int: 0 }; c.q += m.qtd; c.v += m.qtd * (m.custoUnit || 0); if (m.motivo === 'Uso em atendimento') c.at += m.qtd * (m.custoUnit || 0); else c.int += m.qtd * (m.custoUnit || 0); });
    const cl = Object.values(cons).sort((a, b) => b.v - a.v);
    const byCat = {}; cl.forEach(c => byCat[c.cat] = (byCat[c.cat] || 0) + c.v);
    el.innerHTML = `<div class="toolbar"><button class="btn icon" id="mP">${ic('left')}</button><b style="min-width:130px;text-align:center">${ymLabel(st.ym)}</b><button class="btn icon" id="mN">${ic('right')}</button></div>
      <div class="grid g-2-1 mb"><div class="card"><h3>Consumo de insumos no mês <span class="sp"></span><span class="muted" style="text-transform:none">${brl(sum(cl, c => c.v))}</span></h3>
        <div style="max-height:340px;overflow:auto">${UI.table([{ t: 'Insumo', v: c => `<span class="strong">${esc(c.nome)}</span><small>${esc(c.cat)}</small>` }, { t: 'Qtd', cls: 'num', v: c => `${num(c.q)} ${esc(c.un)}` }, { t: 'Atendimentos', cls: 'num', v: c => brl(c.at) }, { t: 'Interno/perdas', cls: 'num', v: c => brl(c.int) }, { t: 'Total', cls: 'num', v: c => `<b>${brl(c.v)}</b>` }], cl, { emptyMsg: 'Sem consumo no período' })}</div></div>
        <div class="card"><h3>Consumo por categoria</h3>${UI.donut(Object.entries(byCat).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v))}</div></div>
      <div class="toolbar"><div class="search">${ic('search')}<input id="q" placeholder="Buscar item..." value="${esc(st.q)}"></div>
        <div class="tabs">${[['', 'Tudo'], ['insumo', 'Insumos'], ['joia', 'Joias']].map(([k, t]) => `<button data-tp="${k}" class="${st.tipo === k ? 'on' : ''}">${t}</button>`).join('')}</div>
        <div class="tabs">${[['', 'Todos'], ['entrada', 'Entradas'], ['saida', 'Saídas'], ['ajuste', 'Ajustes']].map(([k, t]) => `<button data-mv="${k}" class="${st.mov === k ? 'on' : ''}">${t}</button>`).join('')}</div></div><div id="lst"></div>`;
    const draw = () => {
      const q = st.q.toLowerCase();
      const rows = all.filter(m => (!st.tipo || m.tipo === st.tipo) && (!st.mov || m.mov === st.mov) && (!q || (m.nome || '').toLowerCase().includes(q))).sort((a, b) => (b.data + (b.criadoEm || '')).localeCompare(a.data + (a.criadoEm || ''))).slice(0, 400);
      $('#lst', el).innerHTML = UI.table([
        { t: 'Data', v: m => fdate(m.data) },
        { t: 'Item', v: m => `<span class="strong">${esc(m.nome)}</span><small>${m.tipo === 'joia' ? 'Joia' : 'Insumo'}</small>` },
        { t: 'Movimento', v: m => m.mov === 'entrada' ? '<span class="pill ok">Entrada</span>' : m.mov === 'saida' ? '<span class="pill bad">Saída</span>' : '<span class="pill info">Ajuste</span>' },
        { t: 'Qtd', cls: 'num', v: m => `<b>${m.mov === 'saida' ? '−' : m.mov === 'entrada' ? '+' : (m.qtd >= 0 ? '+' : '')}${num(m.qtd)}</b>` },
        { t: 'Valor', cls: 'num', v: m => brl(Math.abs(m.qtd) * (m.custoUnit || 0)) },
        { t: 'Motivo', v: m => `${esc(m.motivo || '')}<small>${esc((m.ref || '').startsWith('atendimento:') || (m.ref || '').startsWith('venda:') ? '' : m.ref || '')}</small>` },
        { t: 'Saldo', cls: 'num', v: m => m.saldo != null ? num(m.saldo) : '—' }
      ], rows, { emptyMsg: 'Sem movimentações' });
    };
    draw();
    $('#q').oninput = e => { st.q = e.target.value; draw(); };
    $$('[data-tp]', el).forEach(b => b.onclick = () => { st.tipo = b.dataset.tp; this.render(el); });
    $$('[data-mv]', el).forEach(b => b.onclick = () => { st.mov = b.dataset.mv; this.render(el); });
    $('#mP').onclick = () => { st.ym = ymShift(st.ym, -1); this.render(el); };
    $('#mN').onclick = () => { st.ym = ymShift(st.ym, 1); this.render(el); };
  }
};

/* ---------------- PDV ---------------- */
Views.pdv = {
  title: 'PDV — Venda de Joias', cart: [], st: { q: '', cat: '', cli: '', forma: 'PIX', desc: 0 },
  sub() { return 'Venda de balcão com baixa automática no estoque'; },
  render(el) {
    const st = this.st;
    const hoje = DB.all('vendas').filter(v => v.data === today());
    App.actions(`<span class="muted small">Hoje: ${hoje.length} vendas · <b style="color:var(--txt)">${brl(sum(hoje, v => v.total))}</b></span>`);
    el.innerHTML = `<div class="pdv"><div>
      <div class="toolbar"><div class="search">${ic('search')}<input id="q" placeholder="Buscar joia ou SKU..." value="${esc(st.q)}"></div>
      <select id="cat" style="width:auto"><option value="">Todos os tipos</option>${CAT_JOIA.map(c => `<option ${st.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="prod-grid" id="grid"></div>
      <div class="card mt"><h3>Últimas vendas</h3><div id="ult"></div></div></div>
      <div class="card cart"><h3>${ic('cart')} Carrinho</h3><div id="cartBox"></div></div></div>`;
    const grid = () => {
      const q = st.q.toLowerCase();
      $('#grid', el).innerHTML = DB.all('joias').filter(j => (!st.cat || j.categoria === st.cat) && (!q || [j.nome, j.sku, j.material].join(' ').toLowerCase().includes(q))).sort((a, b) => a.nome.localeCompare(b.nome))
        .map(j => `<div class="prod ${j.qtd <= 0 ? 'out' : ''}" data-j="${j.id}"><div class="n">${esc(j.nome)}</div><small>${esc(j.material)} · ${esc(j.bitola || '')} ${j.tamanho && j.tamanho !== '—' ? '× ' + esc(j.tamanho) : ''}</small><div class="row" style="justify-content:space-between"><div class="p">${brl(j.preco)}</div><small>${j.qtd} un</small></div></div>`).join('') || UI.empty('Nenhuma joia');
      $$('[data-j]', el).forEach(p => p.onclick = () => { const j = DB.get('joias', p.dataset.j); const c = this.cart.find(x => x.joiaId === j.id); if (c) { if (c.qtd < j.qtd) c.qtd++; else UI.toast('Estoque insuficiente', 'warn'); } else this.cart.push({ joiaId: j.id, qtd: 1, preco: j.preco }); cart(); });
    };
    const cart = () => {
      const sub = sum(this.cart, i => i.qtd * i.preco), tot = Math.max(0, sub - (+st.desc || 0)), custo = sum(this.cart, i => i.qtd * (DB.get('joias', i.joiaId)?.custo || 0)), tx = tot * Biz.taxaForma(st.forma) / 100;
      $('#cartBox', el).innerHTML = `${this.cart.length ? this.cart.map((i, k) => { const j = DB.get('joias', i.joiaId); return `<div class="cart-item"><div><div class="strong small">${esc(j?.nome)}</div><small class="muted">${brl(i.preco)} un.</small></div><div class="qty"><button data-m="${k}">−</button><b>${i.qtd}</b><button data-p="${k}">+</button></div><b>${brl(i.qtd * i.preco)}</b></div>`; }).join('') : UI.empty('Clique nas joias para adicionar', 'cart')}
        <div class="fg mt">
          <div class="f c12"><label>Cliente (opcional)</label><select id="cCli">${UI.opts('clientes', { empty: 'Consumidor não identificado' }).map(([v, t]) => `<option value="${v}" ${v === st.cli ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
          ${UI.f('Forma de pagamento', 'forma', st.forma, { type: 'select', col: 7, opts: FORMAS })}${UI.f('Desconto R$', 'desc', st.desc || '', { type: 'number', col: 5 })}
        </div>
        <div class="mt" id="pdvTot"></div>
        <div class="row mt"><button class="btn" id="clr" ${!this.cart.length ? 'disabled' : ''}>Limpar</button><button class="btn ok grow" style="justify-content:center;padding:11px" id="fin" ${!this.cart.length ? 'disabled' : ''}>${ic('check')} Finalizar venda</button></div>`;
      $$('[data-m]', el).forEach(b => b.onclick = () => { const i = this.cart[b.dataset.m]; i.qtd--; if (i.qtd <= 0) this.cart.splice(b.dataset.m, 1); cart(); });
      $$('[data-p]', el).forEach(b => b.onclick = () => { const i = this.cart[b.dataset.p]; if (i.qtd < (DB.get('joias', i.joiaId)?.qtd || 0)) i.qtd++; cart(); });
      $('#cCli', el).onchange = e => st.cli = e.target.value;
      const tot2 = () => {
        const sub = sum(this.cart, i => i.qtd * i.preco), d = Math.min(+st.desc || 0, sub), tot = Math.max(0, sub - d), custo = sum(this.cart, i => i.qtd * (DB.get('joias', i.joiaId)?.custo || 0)), tx = tot * Biz.taxaForma(st.forma) / 100;
        $('#pdvTot', el).innerHTML = `<div class="total-line muted"><span>Subtotal</span><span>${brl(sub)}</span></div><div class="total-line muted"><span>Desconto</span><span>− ${brl(d)}</span></div>
        <div class="total-line big"><span>Total</span><span style="color:var(--gold)">${brl(tot)}</span></div>
        <div class="total-line small muted"><span>Lucro da venda (após custo e taxa)</span><span class="up">${brl(tot - custo - tx)} · ${pct(tot ? (tot - custo - tx) / tot * 100 : 0)}</span></div>`;
      };
      $('[name=forma]', el).onchange = e => { st.forma = e.target.value; tot2(); };
      $('[name=desc]', el).oninput = e => { st.desc = +e.target.value || 0; tot2(); };
      tot2();
      $('#clr', el).onclick = () => { this.cart = []; cart(); };
      $('#fin', el).onclick = () => { const sub = sum(this.cart, i => i.qtd * i.preco); const v = Biz.registrarVenda({ data: today(), clienteId: st.cli, itens: this.cart.map(i => ({ ...i })), desconto: Math.min(+st.desc || 0, sub), forma: st.forma }); this.cart = []; st.desc = 0; st.cli = ''; UI.toast('Venda registrada!'); this.recibo(v.id); };
    };
    const ult = () => {
      const rows = DB.all('vendas').sort((a, b) => (b.data + (b.criadoEm || '')).localeCompare(a.data + (a.criadoEm || ''))).slice(0, 12);
      $('#ult', el).innerHTML = UI.table([{ t: 'Data', v: v => fdate(v.data) }, { t: 'Itens', v: v => v.itens.map(i => `${i.qtd}× ${esc(i.nome)}`).join(', ') }, { t: 'Cliente', v: v => esc(DB.get('clientes', v.clienteId)?.nome || '—') }, { t: 'Pgto', v: v => esc(v.forma) }, { t: 'Total', cls: 'num', v: v => `<b>${brl(v.total)}</b>` }, { t: '', cls: 'act', v: v => `<button class="btn sm icon" data-r="${v.id}">${ic('print')}</button><button class="btn sm icon danger" data-x="${v.id}">${ic('trash')}</button>` }], rows, { emptyMsg: 'Nenhuma venda' });
      $$('[data-r]', el).forEach(b => b.onclick = () => this.recibo(b.dataset.r));
      $$('[data-x]', el).forEach(b => b.onclick = () => UI.confirm('Estornar esta venda? As joias voltam ao estoque e o lançamento é removido.', () => { Biz.estornarVenda(b.dataset.x); UI.toast('Venda estornada'); }, { yes: 'Estornar' }));
    };
    grid(); cart(); ult();
    $('#q').oninput = e => { st.q = e.target.value; grid(); };
    $('#cat').onchange = e => { st.cat = e.target.value; grid(); };
  },
  recibo(id) {
    const v = DB.get('vendas', id); if (!v) return; const c = DB.get('clientes', v.clienteId), cfg = DB.config;
    UI.modal({ title: 'Recibo de venda', size: 'sm', body: `<div style="font-family:monospace;font-size:13px"><div style="text-align:center"><b style="font-size:15px">${esc(cfg.nome)}</b><br>${esc(cfg.endereco || '')}<br>${esc(cfg.telefone || '')} ${cfg.cnpj ? '<br>CNPJ ' + esc(cfg.cnpj) : ''}</div><div class="hr"></div>
      Venda #${v.id.slice(-6).toUpperCase()} — ${fdate(v.data)}<br>Cliente: ${esc(c?.nome || 'Consumidor')}<div class="hr"></div>
      ${v.itens.map(i => `<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span>${i.qtd}× ${esc(i.nome)}</span><span>${brl(i.qtd * i.preco)}</span></div>`).join('')}<div class="hr"></div>
      ${v.desconto ? `<div class="row" style="justify-content:space-between"><span>Desconto</span><span>− ${brl(v.desconto)}</span></div>` : ''}<div class="row" style="justify-content:space-between;font-size:16px"><b>TOTAL</b><b>${brl(v.total)}</b></div>Pagamento: ${esc(v.forma)}<div class="hr"></div>
      <div style="text-align:center;font-size:11px">Joias para piercing: limpe com soro fisiológico 2× ao dia.<br>Obrigado pela preferência! 🌿</div></div>`,
      foot: `<button class="btn" data-close>Fechar</button><button class="btn pri" onclick="window.print()">${ic('print')} Imprimir</button>` });
  }
};
