/* ============================================================
   PAINEL · AGENDA · ATENDIMENTOS
   ============================================================ */

/* ---------------- PAINEL ---------------- */
Views.dashboard = {
  title: 'Painel', sub: () => new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
  render(el) {
    if (Perm.isArtista()) return this.renderArtista(el);
    const adm = Perm.isAdmin();
    const ym = ymNow(), prev = ymShift(ym, -1);
    const d = Biz.dre(ym), dp = Biz.dre(prev);
    const dia = today().slice(8), recAte = DB.all('lancamentos').filter(l => l.tipo === 'receita' && l.data.startsWith(prev) && l.data.slice(8) <= dia).reduce((s, l) => s + l.valor, 0);
    const var_ = recAte ? (d.receita - recAte) / recAte * 100 : 0;
    const ats = DB.all('atendimentos').filter(a => a.data.startsWith(ym));
    const tick = ats.length ? sum(ats, a => a.valorLiquido + (a.totalJoias || 0)) / ats.length : 0;
    const hoje = DB.all('agendamentos').filter(a => a.data === today() && !['cancelado'].includes(a.status)).sort((a, b) => a.hora.localeCompare(b.hora));
    const pend = DB.all('lancamentos').filter(l => l.status === 'pendente');
    const aPagar = sum(pend.filter(l => l.tipo === 'despesa'), l => l.valor);
    const lim = new Date(); lim.setDate(lim.getDate() + 7); const limS = isoLocal(lim);
    const vencendo = pend.filter(l => l.tipo === 'despesa' && (l.vencimento || l.data) <= limS).sort((a, b) => (a.vencimento || a.data).localeCompare(b.vencimento || b.data));
    const baixoI = DB.all('insumos').filter(i => i.qtd <= i.minimo), baixoJ = DB.all('joias').filter(j => j.qtd <= j.minimo);
    const novas = DB.all('anamneses').filter(a => a.status === 'nova');
    const mes = new Date().getMonth() + 1;
    const niver = DB.all('clientes').filter(c => c.nasc && +c.nasc.slice(5, 7) === mes).sort((a, b) => a.nasc.slice(8).localeCompare(b.nasc.slice(8)));
    const meta = +DB.config.metaMensal || 0, metaP = meta ? Math.min(100, d.receita / meta * 100) : 0;

    const meses = [...Array(6)].map((_, i) => ymShift(ym, i - 5));
    const dres = meses.map(m => Biz.dre(m));
    const labels = meses.map(m => MESES[+m.slice(5) - 1]);

    const rank = DB.all('profissionais').filter(p => p.comissaoPct > 0).map(p => { const a = ats.filter(x => x.profissionalId === p.id); return { p, n: a.length, v: sum(a, x => x.valorLiquido), c: sum(a, x => x.comissaoValor) }; }).sort((a, b) => b.v - a.v);
    const maxR = Math.max(1, ...rank.map(r => r.v));
    const opex = Object.entries(d.opex).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);

    App.actions(`<a class="btn" href="#/agenda">${ic('cal')} Agenda</a><button class="btn pri" id="dNovo">${ic('plus')} Novo atendimento</button>`);
    const passos = [
      ['Dados do estúdio, taxas da maquininha e alíquota', '#/config', DB.config.atualizadoPeloUsuario],
      ['Cadastrar a equipe (tatuadores, piercer, recepção)', '#/equipe', DB.all('profissionais').length > 0],
      ['Cadastrar insumos (agulhas, tintas, descartáveis, limpeza, café)', '#/insumos', DB.all('insumos').length > 0],
      ['Cadastrar serviços com o kit de insumos de cada um', '#/servicos', DB.all('servicos').length > 0],
      ['Cadastrar as joias com custo e markup', '#/joias', DB.all('joias').length > 0],
      ['Lançar as despesas fixas (aluguel, luz, salários...)', '#/financeiro', DB.all('lancamentos').some(l => l.recorrente)],
      ['Registrar o primeiro ciclo da autoclave', '#/biosseguranca', DB.all('esterilizacoes').length > 0]
    ];
    const faltam = passos.filter(p => !p[2]).length;
    el.innerHTML = `
      ${adm && faltam ? `<div class="card mb" style="background:linear-gradient(120deg,rgba(124,170,84,.14),rgba(224,191,110,.05))"><h3>🌿 Primeiros passos <span class="sp"></span><span style="text-transform:none" class="muted">${passos.length - faltam} de ${passos.length} concluídos</span></h3>
        <div class="grid g2" style="gap:6px 24px">${passos.map(([t, h, d]) => `<a class="li" href="${h}" style="color:${d ? 'var(--muted)' : 'var(--txt)'}"><span class="pill ${d ? 'ok' : ''}">${d ? '✓' : '•'}</span><div class="t" style="${d ? 'text-decoration:line-through;font-weight:400' : ''}">${t}</div></a>`).join('')}</div></div>` : ''}
      <div class="grid g4">
        <div class="card kpi"><div class="ic">${ic('money')}</div><div class="lbl">Faturamento do mês</div><div class="val">${brl(d.receita)}</div><div class="hint"><span class="${var_ >= 0 ? 'up' : 'down'}">${var_ >= 0 ? '▲' : '▼'} ${pct(Math.abs(var_))}</span> vs mesmo período de ${MESES[+prev.slice(5) - 1]}</div></div>
        ${adm ? `<div class="card kpi green"><div class="ic">${ic('trend')}</div><div class="lbl">Lucro líquido (DRE)</div><div class="val ${d.lucro < 0 ? 'down' : ''}">${brl(d.lucro)}</div><div class="hint">Margem ${pct(d.margemPct)} · ${MESES[+prev.slice(5) - 1]}: <span class="${dp.lucro >= 0 ? 'up' : 'down'}">${brl(dp.lucro)}</span></div></div>` : `<div class="card kpi green"><div class="ic">${ic('clip')}</div><div class="lbl">Orçamentos em aberto</div><div class="val">${DB.all('orcamentos').filter(o => Views.orcamentos.statusReal(o) === 'enviado').length}</div><div class="hint">${brl(sum(DB.all('orcamentos').filter(o => Views.orcamentos.statusReal(o) === 'enviado'), o => o.valorTotal))} aguardando resposta</div></div>`}
        <div class="card kpi gold"><div class="ic">${ic('needle')}</div><div class="lbl">Atendimentos no mês</div><div class="val">${ats.length}</div><div class="hint">${ats.filter(a => a.tipo === 'tattoo').length} tattoos · ${ats.filter(a => a.tipo === 'piercing').length} piercings · ticket ${brl(tick)}</div></div>
        <div class="card kpi blue"><div class="ic">${ic('clock')}</div><div class="lbl">Contas a pagar</div><div class="val">${brl(aPagar)}</div><div class="hint">${vencendo.length} vencendo em 7 dias</div></div>
      </div>
      ${meta ? `<div class="card mt"><div class="row"><b>Meta de faturamento — ${ymLabel(ym)}</b><span class="grow"></span><span class="muted">${brl(d.receita)} de ${brl(meta)}</span><b>${pct(metaP)}</b></div><div class="bar mt" style="height:10px"><i style="width:${metaP}%;background:linear-gradient(90deg,#5a8a3a,#9cc96e,var(--gold))"></i></div></div>` : ''}
      <div class="grid g-2-1 mt">
        <div class="card"><h3>${adm ? 'Receitas × Custos e despesas' : 'Faturamento'} — 6 meses</h3>${adm ? UI.barChart(labels, [{ name: 'Receita', data: dres.map(x => x.receita) }, { name: 'Custos + despesas', data: dres.map(x => x.receita - x.lucro), color: '#3b5243' }, { name: 'Lucro', data: dres.map(x => x.lucro), color: '#e0bf6e' }]) : UI.barChart(labels, [{ name: 'Faturamento', data: dres.map(x => x.receita) }])}</div>
        <div class="card"><h3>Agenda de hoje <span class="sp"></span><a class="small" href="#/agenda">ver tudo</a></h3>
          ${hoje.length ? `<div class="list">${hoje.map(a => { const c = DB.get('clientes', a.clienteId), p = DB.get('profissionais', a.profissionalId), s = DB.get('servicos', a.servicoId); return `<div class="li" style="cursor:pointer" data-ag="${a.id}"><div class="time-chip">${a.hora}</div><div><div class="t">${esc(c?.nome || '—')}</div><small>${esc(s?.nome || '')} · <span style="color:${p?.cor}">${esc(p?.nome || '')}</span></small></div><div class="r">${UI.statusPill(a.status)}</div></div>`; }).join('')}</div>` : UI.empty('Nenhum agendamento para hoje', 'cal')}
        </div>
      </div>
      <div class="grid g3 mt">
        <div class="card"><h3>${ic('alert')} Alertas</h3><div class="list">
          ${Views.biosseguranca.alertas().map(a => `<a class="li" href="${a.href}"><span class="pill ${a.cls}">${a.pill}</span><div><div class="t">${a.t}</div><small>${a.sub}</small></div></a>`).join('')}
          ${novas.length ? `<a class="li" href="#/anamneses"><span class="pill acc">${novas.length}</span><div><div class="t">Fichas de anamnese novas</div><small>Revisar antes do procedimento</small></div></a>` : ''}
          ${baixoI.length ? `<a class="li" href="#/insumos?f=baixo"><span class="pill bad">${baixoI.length}</span><div><div class="t">Insumos abaixo do mínimo</div><small>${esc(baixoI.slice(0, 3).map(i => i.nome.split(' (')[0]).join(', '))}${baixoI.length > 3 ? '…' : ''}</small></div></a>` : ''}
          ${baixoJ.length ? `<a class="li" href="#/joias?f=baixo"><span class="pill warn">${baixoJ.length}</span><div><div class="t">Joias com estoque baixo</div><small>${esc(baixoJ.slice(0, 3).map(i => i.nome).join(', '))}</small></div></a>` : ''}
          ${vencendo.slice(0, 4).map(l => `<a class="li" href="#/financeiro"><span class="pill ${(l.vencimento || l.data) < today() ? 'bad' : 'warn'}">${fdate(l.vencimento || l.data).slice(0, 5)}</span><div><div class="t">${esc(l.descricao.slice(0, 40))}</div><small>${esc(l.categoria)}</small></div><div class="r strong">${brl(l.valor)}</div></a>`).join('')}
          ${!Views.biosseguranca.alertas().length && !novas.length && !baixoI.length && !baixoJ.length && !vencendo.length ? UI.empty('Tudo em dia 🎉', 'check') : ''}
        </div></div>
        <div class="card"><h3>Ranking da equipe — ${MESES[+ym.slice(5) - 1]}</h3>
          ${rank.map(r => `<div class="mb"><div class="row"><i class="dot" style="background:${r.p.cor}"></i><b>${esc(r.p.nome)}</b><span class="grow"></span><span class="muted small">${r.n} atend.</span><b>${brl(r.v)}</b></div><div class="bar mt" style="margin-top:6px"><i style="width:${r.v / maxR * 100}%;background:${r.p.cor}"></i></div><div class="small muted" style="margin-top:3px">Comissão: ${brl(r.c)}</div></div>`).join('') || UI.empty('Sem atendimentos')}
        </div>
        ${adm ? `<div class="card"><h3>Despesas operacionais do mês</h3>${opex.length ? UI.donut(opex.slice(0, 8)) : UI.empty('Sem despesas')}</div>` : Views.orcamentos.cardPendentes()}
      </div>
      <div class="grid g2 mt">
        <div class="card"><h3>Aniversariantes do mês 🎂</h3>${niver.length ? `<div class="list">${niver.slice(0, 8).map(c => `<div class="li"><div class="avatar">${initials(c.nome)}</div><div><div class="t">${esc(c.nome)}</div><small>${c.nasc.slice(8)}/${c.nasc.slice(5, 7)} · ${idade(c.nasc) + 1} anos</small></div><div class="r"><a class="btn sm" target="_blank" href="${UI.wa(c.telefone, `Feliz aniversário, ${c.nome.split(' ')[0]}! 🎉 A equipe do ${DB.config.nome} te deseja tudo de bom. Passa aqui no estúdio que tem um presente esperando por você!`)}">${ic('wa')} Parabenizar</a></div></div>`).join('')}</div>` : UI.empty('Ninguém faz aniversário este mês')}</div>
        ${adm ? `<div class="card"><h3>Resumo DRE — ${ymLabel(ym)}</h3>
          <div class="total-line"><span>Receita bruta</span><b>${brl(d.receita)}</b></div>
          <div class="total-line muted"><span>(−) Taxas e impostos</span><span>${brl(d.taxas + d.impostos)}</span></div>
          <div class="total-line muted"><span>(−) Insumos consumidos</span><span>${brl(d.insumosAt)}</span></div>
          <div class="total-line muted"><span>(−) Custo das joias vendidas</span><span>${brl(d.cmvJoias)}</span></div>
          <div class="total-line muted"><span>(−) Comissões</span><span>${brl(d.comissoes)}</span></div>
          <div class="total-line"><span>= Margem de contribuição</span><b>${brl(d.margemContrib)}</b></div>
          <div class="total-line muted"><span>(−) Despesas operacionais</span><span>${brl(d.totalOpex)}</span></div>
          <div class="total-line big"><span>Lucro líquido</span><span class="${d.lucro >= 0 ? 'up' : 'down'}">${brl(d.lucro)}</span></div>
          <a class="btn sm mt" href="#/relatorios">${ic('chart')} DRE completa</a>
        </div>` : Views.biosseguranca.cardHoje()}
      </div>`;
    $('#dNovo').onclick = () => Forms.atendimento({});
    $$('[data-ag]', el).forEach(x => x.onclick = () => Forms.verAgendamento(x.dataset.ag));
  }
};

/* ---------------- AGENDA ---------------- */
Views.agenda = {
  title: 'Agenda', st: { base: today(), modo: window.innerWidth < 700 ? 'dia' : 'semana', prof: '' },
  sub() { return 'Clique num horário vazio para agendar ou num card para ver detalhes'; },
  render(el) {
    const st = this.st, cfg = DB.config, H0 = +cfg.horaInicio || 9, H1 = +cfg.horaFim || 21, PX = 56;
    const b = new Date(st.base + 'T12:00');
    let dias = [];
    if (st.modo === 'dia') dias = [new Date(b)];
    else { const seg = new Date(b); seg.setDate(b.getDate() - ((b.getDay() + 6) % 7)); dias = [...Array(7)].map((_, i) => { const d = new Date(seg); d.setDate(seg.getDate() + i); return d; }); }
    const isoD = d => isoLocal(d);
    const profs = DB.all('profissionais').filter(p => p.ativo !== false && ['Tatuador', 'Tatuadora', 'Body Piercer', 'Tatuador(a) e Piercer'].includes(p.funcao) || (p.comissaoPct > 0 && p.ativo !== false));
    if (Perm.isArtista()) st.prof = Perm.profId();
    const ags = DB.all('agendamentos').filter(a => dias.some(d => isoD(d) === a.data) && (!st.prof || a.profissionalId === st.prof));
    const titulo = st.modo === 'dia' ? b.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : `${dias[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${dias[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    const horas = []; for (let h = H0; h < H1; h++) horas.push(h);
    const now = new Date(), nowMin = (now.getHours() - H0) * 60 + now.getMinutes();
    const tot = sum(ags.filter(a => !['cancelado', 'faltou'].includes(a.status)), a => a.valorPrevisto);

    App.actions(`<button class="btn" id="agLink">${ic('link')} Link da ficha</button><button class="btn pri" id="agNovo">${ic('plus')} Agendar</button>`);
    el.innerHTML = `
      <div class="cal-head">
        <button class="btn icon" id="prev">${ic('left')}</button><button class="btn sm" id="hoje">Hoje</button><button class="btn icon" id="next">${ic('right')}</button>
        <h2 style="text-transform:capitalize">${titulo}</h2>
        <div class="tabs"><button data-m="dia" class="${st.modo === 'dia' ? 'on' : ''}">Dia</button><button data-m="semana" class="${st.modo === 'semana' ? 'on' : ''}">Semana</button></div>
        <input type="date" id="goDate" value="${st.base}" style="width:auto">
        <select id="fProf" style="width:auto" ${Perm.isArtista() ? 'disabled' : ''}><option value="">Todos os profissionais</option>${profs.map(p => `<option value="${p.id}" ${st.prof === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>
        <span class="grow"></span><span class="muted small">${ags.length} agendamentos · previsto ${brl(tot)}</span>
      </div>
      <div class="legend mb">${profs.map(p => `<span><i class="dot" style="background:${p.cor}"></i>${esc(p.nome)}</span>`).join('')}</div>
      <div class="cal"><div class="cal-grid ${st.modo === 'dia' ? 'day' : ''}">
        <div class="cal-dh" style="border-left:0"></div>
        ${dias.map(d => `<div class="cal-dh ${isoD(d) === today() ? 'today' : ''}"><small>${d.toLocaleDateString('pt-BR', { weekday: 'short' })}</small><b>${d.getDate()}</b></div>`).join('')}
        <div class="cal-hours">${horas.map(h => `<div class="cal-h">${String(h).padStart(2, '0')}:00</div>`).join('')}</div>
        ${dias.map(d => {
          const ds = isoD(d); const evs = ags.filter(a => a.data === ds).sort((a, b) => a.hora.localeCompare(b.hora));
          // colunas para sobreposição
          // agrupa eventos que se sobrepõem e distribui em colunas só dentro do grupo
          let grp = [], gEnd = -1, lanes = [];
          const close = () => { grp.forEach(e => e._n = lanes.length); grp = []; lanes = []; };
          evs.forEach(e => { const [hh, mm] = e.hora.split(':').map(Number); e._s = (hh - H0) * 60 + mm; e._e = e._s + (+e.duracaoMin || 60);
            if (e._s >= gEnd) close();
            let l = lanes.findIndex(x => x <= e._s); if (l < 0) { l = lanes.length; lanes.push(0); } lanes[l] = e._e; e._l = l; grp.push(e); gEnd = Math.max(gEnd, e._e); });
          close();
          return `<div class="cal-col ${ds === today() ? 'today' : ''}" data-d="${ds}">${horas.map(h => `<div class="cal-slot" data-h="${h}"></div>`).join('')}
            ${evs.map(e => { const p = DB.get('profissionais', e.profissionalId), c = DB.get('clientes', e.clienteId), s = DB.get('servicos', e.servicoId); const w = 100 / (e._n || 1);
              return `<div class="ev ${e.status}" data-id="${e.id}" style="top:${e._s / 60 * PX}px;height:${Math.max(26, (e._e - e._s) / 60 * PX - 3)}px;left:calc(${e._l * w}% + 3px);right:auto;width:calc(${w}% - 6px);border-color:${p?.cor || '#888'};background:${(p?.cor || '#888')}22"><b>${e.hora} ${esc(c?.nome || '—')}</b><span>${esc(s?.nome || '')}</span><span>${esc(p?.nome || '')}${e.sinalPago ? ' · sinal ✓' : ''}</span></div>`; }).join('')}
            ${ds === today() && nowMin > 0 && nowMin < (H1 - H0) * 60 ? `<div class="now-line" style="top:${nowMin / 60 * PX}px"></div>` : ''}
          </div>`;
        }).join('')}
      </div></div>`;
    const shift = n => { const d = new Date(st.base + 'T12:00'); d.setDate(d.getDate() + n * (st.modo === 'dia' ? 1 : 7)); st.base = isoD(d); this.render(el); };
    $('#prev').onclick = () => shift(-1); $('#next').onclick = () => shift(1);
    $('#hoje').onclick = () => { st.base = today(); this.render(el); };
    $('#goDate').onchange = e => { st.base = e.target.value || today(); this.render(el); };
    $('#fProf').onchange = e => { st.prof = e.target.value; this.render(el); };
    $$('[data-m]', el).forEach(x => x.onclick = () => { st.modo = x.dataset.m; this.render(el); });
    $$('.cal-slot', el).forEach(s => s.onclick = () => Forms.agendamento({ data: s.parentElement.dataset.d, hora: String(s.dataset.h).padStart(2, '0') + ':00', profissionalId: st.prof }));
    $$('.ev', el).forEach(e => e.onclick = ev => { ev.stopPropagation(); Forms.verAgendamento(e.dataset.id); });
    $('#agNovo').onclick = () => Forms.agendamento({ data: st.base });
    $('#agLink').onclick = () => Forms.linkAnamnese();
  }
};

/* ---------------- ATENDIMENTOS ---------------- */
Views.atendimentos = {
  title: 'Atendimentos', st: { ym: ymNow(), tipo: '', prof: '', q: '' },
  sub() { return 'Cada atendimento baixa os insumos do estoque, lança a receita, as taxas e a comissão'; },
  render(el) {
    const st = this.st;
    App.actions(`<button class="btn" id="atCsv">${ic('download')} CSV</button><button class="btn pri" id="atNovo">${ic('plus')} Novo atendimento</button>`);
    el.innerHTML = `<div class="toolbar">
      <button class="btn icon" id="mPrev">${ic('left')}</button><b style="min-width:130px;text-align:center">${ymLabel(st.ym)}</b><button class="btn icon" id="mNext">${ic('right')}</button>
      <div class="tabs">${[['', 'Todos'], ['tattoo', 'Tatuagem'], ['piercing', 'Piercing']].map(([k, t]) => `<button data-t="${k}" class="${st.tipo === k ? 'on' : ''}">${t}</button>`).join('')}</div>
      <select id="fP" style="width:auto" ${Perm.isArtista() ? 'disabled' : ''}><option value="">Todos os profissionais</option>${DB.all('profissionais').filter(p => p.comissaoPct > 0).map(p => `<option value="${p.id}" ${st.prof === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>
      <div class="search">${ic('search')}<input id="q" placeholder="Buscar cliente, descrição..." value="${esc(st.q)}"></div></div>
      <div id="kp"></div><div id="lst" class="mt"></div>`;
    const draw = () => {
      const q = st.q.toLowerCase();
      if (Perm.isArtista()) st.prof = Perm.profId();
      const rows = DB.all('atendimentos').filter(a => a.data.startsWith(st.ym) && (!st.tipo || a.tipo === st.tipo) && (!st.prof || a.profissionalId === st.prof))
        .map(a => ({ ...a, _c: DB.get('clientes', a.clienteId), _p: DB.get('profissionais', a.profissionalId), _s: DB.get('servicos', a.servicoId) }))
        .filter(a => !q || [a._c?.nome, a.descricao, a._s?.nome].join(' ').toLowerCase().includes(q))
        .sort((a, b) => (b.data + (b.hora || '')).localeCompare(a.data + (a.hora || '')));
      rows.forEach(a => { a._tx = (a.valorLiquido - (a.sinal || 0) + (a.totalJoias || 0)) * Biz.taxaForma(a.forma) / 100; a._lucro = a.valorLiquido + (a.totalJoias || 0) - a.custoInsumos - (a.custoJoias || 0) - a.comissaoValor - a._tx; });
      const T = k => sum(rows, r => r[k]);
      $('#kp', el).innerHTML = `<div class="grid g4">
        <div class="card kpi"><div class="lbl">Faturado (serviços + joias)</div><div class="val">${brl(T('valorLiquido') + T('totalJoias'))}</div><div class="hint">${rows.length} atendimentos</div></div>
        <div class="card kpi gold"><div class="lbl">Custo de insumos</div><div class="val">${brl(T('custoInsumos'))}</div><div class="hint">média ${brl(rows.length ? T('custoInsumos') / rows.length : 0)} por atendimento</div></div>
        <div class="card kpi blue"><div class="lbl">Comissões</div><div class="val">${brl(T('comissaoValor'))}</div></div>
        ${Perm.isAdmin() ? `<div class="card kpi green"><div class="lbl">Lucro bruto dos atendimentos</div><div class="val">${brl(T('_lucro'))}</div><div class="hint">margem ${pct((T('valorLiquido') + T('totalJoias')) ? T('_lucro') / (T('valorLiquido') + T('totalJoias')) * 100 : 0)}</div></div>` : `<div class="card kpi green"><div class="lbl">Ticket médio</div><div class="val">${brl(rows.length ? (T('valorLiquido') + T('totalJoias')) / rows.length : 0)}</div></div>`}</div>`;
      $('#lst', el).innerHTML = UI.table([
        { t: 'Data', v: a => `<b>${fdate(a.data)}</b><small>${a.hora || ''}</small>` },
        { t: 'Cliente', v: a => `<span class="strong">${esc(a._c?.nome || '—')}</span><small>${esc(a.regiao || '')}</small>` },
        { t: 'Serviço', v: a => `${a.tipo === 'piercing' ? '<span class="pill info">Piercing</span>' : '<span class="pill acc">Tattoo</span>'} ${esc(a._s?.nome || '')}<small>${esc(a.descricao || '')}</small>` },
        { t: 'Profissional', v: a => `<span style="color:${a._p?.cor}">●</span> ${esc(a._p?.nome || '—')}` },
        { t: 'Valor', cls: 'num', v: a => `${brl(a.valorLiquido + (a.totalJoias || 0))}<small>${esc(a.forma || '')}</small>` },
        { t: 'Insumos', cls: 'num', v: a => brl(a.custoInsumos) },
        { t: 'Comissão', cls: 'num', v: a => `${brl(a.comissaoValor)}<small>${a.comissaoPct}%</small>` },
        ...(Perm.isAdmin() ? [{ t: 'Lucro', cls: 'num', v: a => `<b class="${a._lucro < 0 ? 'down' : 'up'}">${brl(a._lucro)}</b>` }] : []),
        { t: '', cls: 'act', v: a => `<button class="btn sm icon" data-v="${a.id}" title="Ver">${ic('eye')}</button>${Perm.gestao() ? `<button class="btn sm icon" data-e="${a.id}" title="Editar">${ic('edit')}</button><button class="btn sm icon danger" data-x="${a.id}" title="Excluir">${ic('trash')}</button>` : ''}` }
      ], rows, { emptyMsg: 'Nenhum atendimento neste período' });
      $$('[data-e]', el).forEach(b => b.onclick = () => Forms.atendimento(DB.get('atendimentos', b.dataset.e)));
      $$('[data-v]', el).forEach(b => b.onclick = () => Forms.verAtendimento(b.dataset.v));
      $$('[data-x]', el).forEach(b => b.onclick = () => UI.confirm('Excluir este atendimento? Os insumos e joias voltam ao estoque e os lançamentos financeiros vinculados são removidos.', () => { Biz.estornarAtendimento(b.dataset.x); UI.toast('Atendimento excluído e estornado'); }, { yes: 'Excluir e estornar' }));
      this._rows = rows;
    };
    draw();
    $('#q').oninput = e => { st.q = e.target.value; draw(); };
    $('#fP').onchange = e => { st.prof = e.target.value; draw(); };
    $$('[data-t]', el).forEach(b => b.onclick = () => { st.tipo = b.dataset.t; this.render(el); });
    $('#mPrev').onclick = () => { st.ym = ymShift(st.ym, -1); this.render(el); };
    $('#mNext').onclick = () => { st.ym = ymShift(st.ym, 1); this.render(el); };
    $('#atNovo').onclick = () => Forms.atendimento({});
    $('#atCsv').onclick = () => UI.download(`atendimentos-${st.ym}.csv`, UI.csv([['Data', 'Hora', 'Cliente', 'Tipo', 'Serviço', 'Descrição', 'Profissional', 'Valor líquido', 'Joias', 'Forma', 'Custo insumos', 'Comissão', 'Lucro'], ...this._rows.map(a => [fdate(a.data), a.hora, a._c?.nome, a.tipo, a._s?.nome, a.descricao, a._p?.nome, num(a.valorLiquido), num(a.totalJoias || 0), a.forma, num(a.custoInsumos), num(a.comissaoValor), num(a._lucro)])]), 'text/csv');
  }
};

/* ============================================================
   FORMULÁRIOS COMPARTILHADOS
   ============================================================ */
const Forms = {
  clienteRapido(cb) {
    UI.modal({ title: 'Novo cliente', size: 'sm', body: `<form class="fg" id="cr">${UI.f('Nome completo *', 'nome', '', { col: 12 })}${UI.f('WhatsApp', 'telefone', '', { col: 6, ph: '(00) 00000-0000' })}${UI.f('Nascimento', 'nasc', '', { type: 'date', col: 6 })}</form>`,
      foot: '<button class="btn" data-close>Cancelar</button><button class="btn pri" id="crOk">Salvar</button>',
      onOpen: m => m.$('#crOk').onclick = () => { const d = UI.formData(m.$('#cr')); if (!d.nome) return UI.toast('Informe o nome', 'warn'); const c = DB.save('clientes', { ...d, origem: 'Cadastro rápido' }); m.close(); cb && cb(c); } });
  },

  linkAnamnese(cli) {
    const base = location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '').replace(/\/?$/, '/');
    const url = base + 'anamnese.html' + (cli ? `?c=${cli.id}&n=${encodeURIComponent(cli.nome)}` : '');
    const msg = `Olá${cli ? ' ' + cli.nome.split(' ')[0] : ''}! 🌿 Aqui é do ${DB.config.nome}. Para agilizar seu atendimento, preencha sua ficha de anamnese antes de vir ao estúdio: ${url}`;
    UI.modal({ title: 'Enviar ficha de anamnese', size: 'sm', body: `<p class="muted mb">O cliente preenche pelo celular, assina na tela e a ficha cai automaticamente em <b>Fichas de Anamnese</b>.</p>
      <div class="f"><label>Link da ficha</label><input readonly value="${esc(url)}" id="lkU"></div>
      <div class="row mt"><button class="btn" id="lkC">${ic('copy')} Copiar link</button>${cli?.telefone ? `<a class="btn ok" target="_blank" href="${UI.wa(cli.telefone, msg)}">${ic('wa')} Enviar no WhatsApp</a>` : `<a class="btn ok" target="_blank" href="https://wa.me/?text=${encodeURIComponent(msg)}">${ic('wa')} Compartilhar no WhatsApp</a>`}<a class="btn" target="_blank" href="${esc(url)}">${ic('eye')} Abrir</a></div>`,
      onOpen: m => m.$('#lkC').onclick = () => UI.copy(url) });
  },

  agendamento(a = {}) {
    const edit = !!a.id; a = { status: 'agendado', duracaoMin: 60, ...a };
    const profs = UI.opts('profissionais', { filter: p => p.comissaoPct > 0 && p.ativo !== false });
    UI.modal({ title: edit ? 'Editar agendamento' : 'Novo agendamento', body: `<form class="fg" id="agF">
      <div class="f c12"><label>Cliente *</label><div class="row"><select name="clienteId" class="grow" style="flex:1">${UI.opts('clientes').map(([v, t]) => `<option value="${v}" ${v === a.clienteId ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select><button type="button" class="btn" id="agCli">${ic('plus')} Novo</button></div></div>
      ${UI.f('Profissional *', 'profissionalId', a.profissionalId, { type: 'select', opts: profs })}
      ${UI.f('Serviço *', 'servicoId', a.servicoId, { type: 'select', opts: UI.opts('servicos', { filter: s => s.ativo !== false }) })}
      ${UI.f('Data *', 'data', a.data || today(), { type: 'date', col: 4 })}${UI.f('Hora *', 'hora', a.hora || '10:00', { type: 'time', col: 4 })}${UI.f('Duração (min)', 'duracaoMin', a.duracaoMin, { type: 'number', col: 4 })}
      ${UI.f('Valor previsto (R$)', 'valorPrevisto', a.valorPrevisto, { type: 'number', col: 4 })}${UI.f('Sinal (R$)', 'sinal', a.sinal, { type: 'number', col: 4 })}
      ${UI.f('Forma do sinal', 'formaSinal', a.formaSinal || 'PIX', { type: 'select', col: 4, opts: FORMAS })}
      <div class="f c6"><label>&nbsp;</label><label class="row" style="font-size:13px;color:var(--txt)"><input type="checkbox" name="sinalPago" ${a.sinalPago ? 'checked' : ''}> Sinal já foi pago (lança no caixa)</label></div>
      <div class="f c6"><label>Projeto (várias sessões)</label><select name="projetoId" id="agProj"></select></div>
      ${UI.f('Status', 'status', a.status, { type: 'select', opts: [['agendado', 'Agendado'], ['confirmado', 'Confirmado'], ['concluido', 'Concluído'], ['cancelado', 'Cancelado'], ['faltou', 'Faltou']] })}
      ${UI.f('Observações / referência da arte', 'obs', a.obs, { type: 'textarea', col: 12 })}
      <div class="c12" id="agConf"></div></form>`,
      foot: `${edit ? `<button class="btn danger" id="agDel">${ic('trash')} Excluir</button><span class="grow"></span>` : ''}<button class="btn" data-close>Cancelar</button><button class="btn pri" id="agOk">Salvar</button>`,
      onOpen: m => {
        const F = m.$('#agF');
        const checkConf = () => {
          const d = UI.formData(F); const [hh, mm] = (d.hora || '0:0').split(':').map(Number); const s = hh * 60 + mm, e = s + (+d.duracaoMin || 60);
          const conf = DB.all('agendamentos').filter(x => x.id !== a.id && x.data === d.data && x.profissionalId === d.profissionalId && !['cancelado', 'faltou'].includes(x.status)).filter(x => { const [h2, m2] = x.hora.split(':').map(Number); const s2 = h2 * 60 + m2, e2 = s2 + (+x.duracaoMin || 60); return s < e2 && s2 < e; });
          m.$('#agConf').innerHTML = conf.length ? `<div class="alert warn">${ic('alert')}Conflito: este profissional já tem ${conf.map(x => `${x.hora} (${esc(DB.get('clientes', x.clienteId)?.nome || '')})`).join(', ')} neste horário.</div>` : '';
        };
        F.servicoId.onchange = () => { const s = DB.get('servicos', F.servicoId.value); if (s) { F.duracaoMin.value = s.duracaoMin; F.valorPrevisto.value = s.precoBase; if (s.tipo === 'tattoo' && !F.sinal.value) F.sinal.value = Math.round(s.precoBase * 0.3 / 10) * 10; } checkConf(); };
        ['data', 'hora', 'duracaoMin', 'profissionalId'].forEach(n => F[n].addEventListener('change', checkConf)); checkConf();
        const projOpts = () => { m.$('#agProj').innerHTML = Forms.projetoOpts(F.clienteId.value, a.projetoId); };
        F.clienteId.addEventListener('change', projOpts); projOpts();
        if (Perm.isArtista()) { F.profissionalId.value = Perm.profId(); F.profissionalId.disabled = true; }
        m.$('#agCli').onclick = () => Forms.clienteRapido(c => { const o = new Option(c.nome, c.id, true, true); F.clienteId.add(o); });
        if (edit) m.$('#agDel').onclick = () => UI.confirm('Excluir este agendamento?', () => { DB.all('lancamentos').filter(l => l.origem === 'sinal:' + a.id).forEach(l => DB.remove('lancamentos', l.id, true)); DB.remove('agendamentos', a.id); m.close(); UI.toast('Agendamento excluído'); });
        m.$('#agOk').onclick = () => {
          const d = UI.formData(F); if (Perm.isArtista()) d.profissionalId = Perm.profId();
          if (!d.clienteId || !d.profissionalId || !d.servicoId || !d.data || !d.hora) return UI.toast('Preencha cliente, profissional, serviço, data e hora', 'warn');
          const ag = DB.save('agendamentos', { ...a, ...d }, true);
          const ref = 'sinal:' + ag.id; const ex = DB.all('lancamentos').filter(l => l.origem === ref);
          const podeRefazer = Perm.gestao(); // tatuador não lê/edita o financeiro: só lança o sinal uma vez
          if (podeRefazer) ex.forEach(l => DB.remove('lancamentos', l.id, true));
          if (ag.sinalPago && ag.sinal > 0 && (podeRefazer || !a.sinalLancado)) { ag.sinalLancado = true; DB.save('agendamentos', ag, true); } else if (!ag.sinalPago && podeRefazer) { ag.sinalLancado = false; DB.save('agendamentos', ag, true); }
          if (ag.sinalPago && ag.sinal > 0 && (podeRefazer || !a.sinalLancado)) Biz.lancReceita({ valor: ag.sinal, categoria: 'Sinal/Adiantamento', descricao: `Sinal — ${DB.get('clientes', ag.clienteId)?.nome || ''} (${fdate(ag.data)})`, data: ex[0]?.data || today(), forma: ag.formaSinal, origem: ref, clienteId: ag.clienteId });
          DB.emit(); m.close(); UI.toast('Agendamento salvo');
        };
      }
    });
  },

  verAgendamento(id) {
    const a = DB.get('agendamentos', id); if (!a) return;
    const c = DB.get('clientes', a.clienteId), p = DB.get('profissionais', a.profissionalId), s = DB.get('servicos', a.servicoId);
    const ana = DB.all('anamneses').filter(x => x.clienteId === a.clienteId).sort((x, y) => (y.criadoEm || '').localeCompare(x.criadoEm || ''))[0];
    const alertas = ana ? Biz.anamneseAlertas(ana) : [];
    const msgConf = `Olá ${c?.nome.split(' ')[0]}! Confirmando seu horário no ${DB.config.nome}: ${fdate(a.data)} às ${a.hora} com ${p?.nome} (${s?.nome}). 🌿 Lembre-se: alimente-se bem antes, evite álcool nas 24h anteriores e venha com a região limpa e hidratada. Podemos confirmar?`;
    UI.modal({ title: `${a.hora} · ${esc(c?.nome || '')}`, body: `
      <div class="row mb">${UI.statusPill(a.status)}<span class="pill" style="color:${p?.cor}">● ${esc(p?.nome || '')}</span><span class="pill">${esc(s?.nome || '')}</span></div>
      <div class="grid g3"><div><small class="muted">Data</small><div class="strong">${fdate(a.data)} · ${a.hora} (${a.duracaoMin} min)</div></div><div><small class="muted">Valor previsto</small><div class="strong">${brl(a.valorPrevisto)}</div></div><div><small class="muted">Sinal</small><div class="strong">${brl(a.sinal)} ${a.sinal ? (a.sinalPago ? '<span class="pill ok">pago</span>' : '<span class="pill warn">pendente</span>') : ''}</div></div></div>
      ${a.obs ? `<div class="alert info mt">${esc(a.obs)}</div>` : ''}
      <div class="hr"></div>
      <b>Ficha de anamnese</b>
      ${ana ? `<div class="row mt">${UI.statusPill(ana.status)}<span class="muted small">enviada em ${fdt(ana.criadoEm)}</span><button class="btn sm" id="vaVer">${ic('eye')} Ver ficha</button></div>${alertas.length ? `<div class="alert warn mt">${ic('alert')}<div><b>Atenção:</b> ${alertas.map(esc).join(' · ')}</div></div>` : '<div class="alert ok mt">Nenhum ponto de atenção na ficha.</div>'}`
        : `<div class="alert warn mt">${ic('alert')}Cliente ainda não preencheu a ficha de anamnese.</div><button class="btn sm mt" id="vaLink">${ic('link')} Enviar link da ficha</button>`}`,
      foot: `<a class="btn" target="_blank" href="${UI.wa(c?.telefone, msgConf)}">${ic('wa')} Confirmar no WhatsApp</a><span class="grow"></span>
        <button class="btn" id="vaEd">${ic('edit')} Editar</button>
        ${a.status !== 'concluido' ? `<button class="btn" id="vaConf">${ic('check')} Confirmado</button><button class="btn pri" id="vaAt">${ic('needle')} Iniciar atendimento</button>` : (a.atendimentoId ? `<button class="btn" id="vaVerAt">Ver atendimento</button>` : '')}`,
      onOpen: m => {
        m.$('#vaEd').onclick = () => { m.close(); Forms.agendamento(a); };
        if (m.$('#vaVer')) m.$('#vaVer').onclick = () => Forms.verAnamnese(ana.id);
        if (m.$('#vaLink')) m.$('#vaLink').onclick = () => Forms.linkAnamnese(c);
        if (m.$('#vaConf')) m.$('#vaConf').onclick = () => { a.status = 'confirmado'; DB.save('agendamentos', a); m.close(); UI.toast('Agendamento confirmado'); };
        if (m.$('#vaAt')) m.$('#vaAt').onclick = () => { m.close(); Forms.atendimento({ clienteId: a.clienteId, profissionalId: a.profissionalId, servicoId: a.servicoId, data: a.data, hora: a.hora, valor: a.valorPrevisto, sinal: a.sinalPago ? a.sinal : 0, agendamentoId: a.id, descricao: a.obs, projetoId: a.projetoId || '' }); };
        if (m.$('#vaVerAt')) m.$('#vaVerAt').onclick = () => Forms.verAtendimento(a.atendimentoId);
      }
    });
  },

  atendimento(at = {}) {
    const edit = !!at.id;
    at = { data: today(), hora: new Date().toTimeString().slice(0, 5), forma: 'PIX', desconto: 0, sinal: 0, insumos: [], joias: [], ...at };
    if (!edit && at.servicoId && !at.insumos.length) { const s = DB.get('servicos', at.servicoId); if (s) at.insumos = (s.kit || []).map(k => ({ ...k })); }
    const insOpts = UI.opts('insumos', { empty: '— insumo —', label: i => `${i.nome} (${i.unidade})` });
    const joOpts = UI.opts('joias', { empty: '— joia —', label: j => `${j.nome} ${j.bitola || ''} · ${brl(j.preco)} · est. ${j.qtd}` });
    const insRow = (r = {}) => `<tr><td><select data-k="insumoId">${insOpts.map(([v, t]) => `<option value="${v}" ${v === r.insumoId ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></td><td style="width:110px"><input type="number" step="any" data-k="qtd" value="${r.qtd ?? 1}"></td><td class="num" data-cu style="width:110px"></td><td style="width:40px"><button type="button" class="btn sm icon danger" data-rm>${ic('x')}</button></td></tr>`;
    const joRow = (r = {}) => `<tr><td><select data-k="joiaId">${joOpts.map(([v, t]) => `<option value="${v}" ${v === r.joiaId ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></td><td style="width:80px"><input type="number" data-k="qtd" value="${r.qtd ?? 1}"></td><td style="width:120px"><input type="number" step="any" data-k="preco" value="${r.preco ?? ''}" placeholder="preço"></td><td style="width:40px"><button type="button" class="btn sm icon danger" data-rm>${ic('x')}</button></td></tr>`;
    UI.modal({ title: edit ? 'Editar atendimento' : 'Registrar atendimento', size: 'lg', body: `<form class="fg" id="atF">
      <div class="f c6"><label>Cliente *</label><div class="row"><select name="clienteId" style="flex:1">${UI.opts('clientes').map(([v, t]) => `<option value="${v}" ${v === at.clienteId ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select><button type="button" class="btn icon" id="atCli">${ic('plus')}</button></div></div>
      ${UI.f('Profissional *', 'profissionalId', at.profissionalId, { type: 'select', col: 3, opts: UI.opts('profissionais', { filter: p => p.comissaoPct > 0 || p.id === at.profissionalId }) })}
      ${UI.f('Serviço *', 'servicoId', at.servicoId, { type: 'select', col: 3, opts: UI.opts('servicos') })}
      <div class="c12" id="atAna"></div>
      ${UI.f('Data', 'data', at.data, { type: 'date', col: 3 })}${UI.f('Hora', 'hora', at.hora, { type: 'time', col: 2 })}
      ${UI.f('Descrição / arte', 'descricao', at.descricao, { col: 4, ph: 'Ex.: rosa fine line' })}${UI.f('Região do corpo', 'regiao', at.regiao, { col: 3, ph: 'Ex.: antebraço' })}
      <div class="f c6"><label>Lote esterilizado (autoclave) ${ic('shield', 'ic-in')}</label><select name="loteEsterilizacao">${Forms.loteOpts(at.data, at.loteEsterilizacao)}</select><span class="help" id="atLoteH"></span></div>
      <div class="f c6"><label>Projeto (várias sessões)</label><select name="projetoId" id="atProj"></select><span class="help" id="atProjH"></span></div>
      <div class="fsec">Valores</div>
      ${UI.f('Valor do serviço (R$) *', 'valor', at.valor, { type: 'number', col: 3 })}${UI.f('Desconto (R$)', 'desconto', at.desconto, { type: 'number', col: 2 })}
      ${UI.f('Sinal já recebido', 'sinal', at.sinal, { type: 'number', col: 2, help: 'abatido do valor a receber' })}
      ${UI.f('Forma de pagamento', 'forma', at.forma, { type: 'select', col: 3, opts: FORMAS })}${UI.f('Comissão %', 'comissaoPct', at.comissaoPct ?? '', { type: 'number', col: 2, ph: 'padrão' })}
      <div class="fsec">Insumos utilizados <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:400">— carregados do kit do serviço, ajuste conforme o uso real</span></div>
      <div class="c12"><div class="tbl-wrap"><table class="tbl" id="insT"><thead><tr><th>Insumo</th><th>Qtd</th><th class="num">Custo</th><th></th></tr></thead><tbody>${at.insumos.map(insRow).join('')}</tbody></table></div><button type="button" class="btn sm mt" id="addIns">${ic('plus')} Insumo</button> <button type="button" class="btn sm mt" id="kitIns">${ic('repeat')} Recarregar kit do serviço</button></div>
      <div class="fsec">Joias aplicadas (piercing)</div>
      <div class="c12"><div class="tbl-wrap"><table class="tbl" id="joT"><thead><tr><th>Joia</th><th>Qtd</th><th>Preço un.</th><th></th></tr></thead><tbody>${at.joias.map(joRow).join('')}</tbody></table></div><button type="button" class="btn sm mt" id="addJo">${ic('plus')} Joia</button></div>
      ${UI.f('Observações', 'obs', at.obs, { type: 'textarea', col: 12 })}
      <div class="c12 calc-box" id="atCalc"></div></form>`,
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="atOk">${ic('check')} ${edit ? 'Salvar alterações' : 'Concluir atendimento'}</button>`,
      onOpen: m => {
        const F = m.$('#atF');
        const readRows = (sel) => $$(sel + ' tbody tr', m.el).map(tr => { const o = {}; $$('[data-k]', tr).forEach(i => o[i.dataset.k] = i.type === 'number' ? +i.value : i.value); return o; });
        const calc = () => {
          const d = UI.formData(F); const prof = DB.get('profissionais', d.profissionalId);
          const ins = readRows('#insT'), jo = readRows('#joT');
          $$('#insT tbody tr', m.el).forEach((tr, i) => { const it = DB.get('insumos', ins[i].insumoId); $('[data-cu]', tr).innerHTML = it ? `${brl(it.custoUnit * ins[i].qtd)}${it.qtd < ins[i].qtd ? '<small class="down">estoque insuficiente</small>' : ''}` : '—'; });
          const ci = sum(ins, r => { const it = DB.get('insumos', r.insumoId); return it ? it.custoUnit * r.qtd : 0; });
          const tj = sum(jo, r => r.qtd * (r.preco || DB.get('joias', r.joiaId)?.preco || 0)), cj = sum(jo, r => r.qtd * (DB.get('joias', r.joiaId)?.custo || 0));
          const vl = (+d.valor || 0) - (+d.desconto || 0); const cp = d.comissaoPct !== '' ? +d.comissaoPct : (prof?.comissaoPct || 0); const cv = vl * cp / 100;
          const tx = (vl - (+d.sinal || 0) + tj) * Biz.taxaForma(d.forma) / 100; const lucro = vl + tj - ci - cj - cv - tx;
          m.$('#atCalc').innerHTML = `<div><small>Total cliente</small><b>${brl(vl + tj)}</b></div><div><small>A receber agora</small><b>${brl(vl + tj - (+d.sinal || 0))}</b></div><div><small>Custo insumos</small><b>${brl(ci)}</b></div><div><small>Custo joias</small><b>${brl(cj)}</b></div><div><small>Comissão (${cp}%)</small><b>${brl(cv)}</b></div><div><small>Taxa ${esc(d.forma)}</small><b>${brl(tx)}</b></div><div><small>Lucro do estúdio</small><b class="${lucro < 0 ? 'down' : 'up'}">${brl(lucro)} · ${pct(vl + tj ? lucro / (vl + tj) * 100 : 0)}</b></div>`;
        };
        const anaCheck = () => {
          const cid = F.clienteId.value; if (!cid) { m.$('#atAna').innerHTML = ''; return; }
          const ana = DB.all('anamneses').filter(x => x.clienteId === cid).sort((x, y) => (y.criadoEm || '').localeCompare(x.criadoEm || ''))[0];
          const al = ana ? Biz.anamneseAlertas(ana) : [];
          m.$('#atAna').innerHTML = !ana ? `<div class="alert warn">${ic('alert')}<div>Cliente sem ficha de anamnese. <a href="#" id="atLk">Enviar link agora</a></div></div>` : al.length ? `<div class="alert warn">${ic('alert')}<div><b>Ficha de anamnese:</b> ${al.map(esc).join(' · ')}</div></div>` : `<div class="alert ok">${ic('check')}Ficha de anamnese OK (${fdate(ana.criadoEm)})</div>`;
          if (m.$('#atLk')) m.$('#atLk').onclick = e => { e.preventDefault(); Forms.linkAnamnese(DB.get('clientes', cid)); };
        };
        const bindRows = () => { $$('[data-rm]', m.el).forEach(b => b.onclick = () => { b.closest('tr').remove(); calc(); }); };
        m.el.addEventListener('input', calc); m.el.addEventListener('change', calc);
        F.clienteId.addEventListener('change', anaCheck);
        const projSync = () => { m.$('#atProj').innerHTML = Forms.projetoOpts(F.clienteId.value, at.projetoId); projHelp(); };
        const projHelp = () => { const p = DB.get('projetos', F.projetoId.value); if (!p) { m.$('#atProjH').textContent = ''; return; } const i = Views.orcamentos.info(p, at.id); m.$('#atProjH').textContent = `Sessão ${i.feitas + 1} de ${p.sessoesPrevistas} · saldo ${brl(i.saldo)}`; if (!F.valor.value) F.valor.value = Math.max(0, Math.round(i.saldo / Math.max(1, p.sessoesPrevistas - i.feitas))); };
        F.clienteId.addEventListener('change', projSync); F.projetoId.addEventListener('change', () => { projHelp(); calc(); }); projSync();
        const loteH = () => { const e = DB.get('esterilizacoes', F.loteEsterilizacao.value), s = DB.get('servicos', F.servicoId.value); m.$('#atLoteH').innerHTML = e ? `Válido até ${fdate(e.validade)} · ${esc((e.itens || []).join(', '))}` : (s?.tipo === 'piercing' ? '<span class="down">Piercing: informe o lote do material esterilizado (rastreabilidade)</span>' : 'Opcional para tattoo com material 100% descartável'); };
        F.data.addEventListener('change', () => { F.loteEsterilizacao.innerHTML = Forms.loteOpts(F.data.value, F.loteEsterilizacao.value); loteH(); });
        F.loteEsterilizacao.addEventListener('change', loteH); F.servicoId.addEventListener('change', loteH); loteH();
        if (Perm.isArtista() && !edit) { F.profissionalId.value = Perm.profId(); F.profissionalId.disabled = true; }
        F.servicoId.addEventListener('change', () => { const s = DB.get('servicos', F.servicoId.value); if (!s) return; if (!F.valor.value) F.valor.value = s.precoBase; $('#insT tbody', m.el).innerHTML = (s.kit || []).map(insRow).join(''); bindRows(); calc(); });
        F.profissionalId.addEventListener('change', () => { F.comissaoPct.value = ''; calc(); });
        m.$('#addIns').onclick = () => { $('#insT tbody', m.el).insertAdjacentHTML('beforeend', insRow()); bindRows(); calc(); };
        m.$('#kitIns').onclick = () => { const s = DB.get('servicos', F.servicoId.value); if (!s) return UI.toast('Escolha o serviço', 'warn'); $('#insT tbody', m.el).innerHTML = (s.kit || []).map(insRow).join(''); bindRows(); calc(); };
        m.$('#addJo').onclick = () => { $('#joT tbody', m.el).insertAdjacentHTML('beforeend', joRow()); bindRows(); calc(); };
        m.el.addEventListener('change', e => { if (e.target.dataset.k === 'joiaId') { const j = DB.get('joias', e.target.value); const p = e.target.closest('tr').querySelector('[data-k=preco]'); if (j && !p.value) p.value = j.preco; calc(); } });
        m.$('#atCli').onclick = () => Forms.clienteRapido(c => { F.clienteId.add(new Option(c.nome, c.id, true, true)); anaCheck(); });
        bindRows(); calc(); anaCheck();
        m.$('#atOk').onclick = () => {
          const d = UI.formData(F); if (Perm.isArtista()) d.profissionalId = Perm.profId();
          if (!d.clienteId || !d.profissionalId || !d.servicoId || !(+d.valor >= 0) || d.valor === '') return UI.toast('Preencha cliente, profissional, serviço e valor', 'warn');
          const rec = { ...at, ...d, insumos: readRows('#insT'), joias: readRows('#joT') };
          Biz.registrarAtendimento(rec); m.close(); UI.toast(edit ? 'Atendimento atualizado' : 'Atendimento registrado — estoque e financeiro atualizados');
        };
      }
    });
  },

  verAtendimento(id) {
    const a = DB.get('atendimentos', id); if (!a) return;
    const c = DB.get('clientes', a.clienteId), p = DB.get('profissionais', a.profissionalId), s = DB.get('servicos', a.servicoId);
    UI.modal({ title: `Atendimento — ${esc(c?.nome || '')}`, size: 'lg', body: `
      <div class="grid g4"><div><small class="muted">Data</small><div class="strong">${fdate(a.data)} ${a.hora || ''}</div></div><div><small class="muted">Serviço</small><div class="strong">${esc(s?.nome || '')}</div></div><div><small class="muted">Profissional</small><div class="strong">${esc(p?.nome || '')}</div></div><div><small class="muted">Região</small><div class="strong">${esc(a.regiao || '—')}</div></div></div>
      ${a.descricao ? `<p class="mt">${esc(a.descricao)}</p>` : ''}
      <div class="row mt">${a.loteEsterilizacao && DB.get('esterilizacoes', a.loteEsterilizacao) ? `<span class="pill ok">${ic('shield', 'ic-in')} Lote ${esc(DB.get('esterilizacoes', a.loteEsterilizacao).lote)}</span>` : '<span class="pill">Sem lote de esterilização</span>'}${a.projetoId && DB.get('projetos', a.projetoId) ? `<span class="pill info">Projeto: ${esc(DB.get('projetos', a.projetoId).titulo)}</span>` : ''}</div>
      <h3 class="mt" style="font-size:13px;color:var(--muted);margin-bottom:8px">FOTOS DO TRABALHO</h3><div id="atFotos"></div>
      <div class="calc-box mt"><div><small>Serviço</small><b>${brl(a.valorLiquido)}</b></div><div><small>Joias</small><b>${brl(a.totalJoias || 0)}</b></div><div><small>Insumos</small><b>${brl(a.custoInsumos)}</b></div><div><small>Comissão</small><b>${brl(a.comissaoValor)}</b></div><div><small>Pagamento</small><b>${esc(a.forma)}</b></div></div>
      <h3 class="mt" style="font-size:13px;color:var(--muted);margin-bottom:8px">INSUMOS BAIXADOS DO ESTOQUE</h3>
      ${UI.table([{ t: 'Insumo', v: r => esc(DB.get('insumos', r.insumoId)?.nome || '(removido)') }, { t: 'Qtd', cls: 'num', v: r => `${num(r.qtd)} ${DB.get('insumos', r.insumoId)?.unidade || ''}` }, { t: 'Custo un.', cls: 'num', v: r => brl(r.custoUnit) }, { t: 'Total', cls: 'num', v: r => brl(r.qtd * r.custoUnit) }], a.insumos || [], { emptyMsg: 'Nenhum insumo' })}
      ${(a.joias || []).length ? `<h3 class="mt" style="font-size:13px;color:var(--muted);margin-bottom:8px">JOIAS</h3>${UI.table([{ t: 'Joia', v: r => esc(DB.get('joias', r.joiaId)?.nome || '') }, { t: 'Qtd', cls: 'num', v: r => r.qtd }, { t: 'Preço', cls: 'num', v: r => brl(r.preco) }, { t: 'Custo', cls: 'num', v: r => brl(r.custo) }], a.joias)}` : ''}`,
      foot: `<button class="btn" onclick="window.print()">${ic('print')} Imprimir</button><span class="grow"></span><button class="btn" data-close>Fechar</button>`,
      onOpen: m => Fotos.widget(m.$('#atFotos'), { refTipo: 'atendimento', refId: a.id, clienteId: a.clienteId, profissionalId: a.profissionalId, projetoId: a.projetoId || '' }, { tipos: ['Antes', 'Depois', 'Cicatrizado', 'Arte / stencil'] }) });
  }
};
