/* ============================================================
   CAMADA DE DADOS — Firestore (online) ou localStorage (demo)
   Cache em memória + escrita imediata + sincronização em tempo real
   Desenvolvido por Evander
   ============================================================ */
const COLS = ['clientes','profissionais','servicos','insumos','joias','movEstoque','agendamentos','atendimentos','vendas','lancamentos','anamneses','esterilizacoes','orcamentos','projetos'];
const LS_KEY = 'gardentattoo_v1';

const DEFAULT_CONFIG = {
  nome: 'Garden Tattoo',
  cnpj: '', telefone: '(11) 90000-0000', endereco: 'Rua Exemplo, 123 — Centro', instagram: '@gardentattoo',
  taxas: { 'Dinheiro':0, 'PIX':0, 'Débito':1.6, 'Crédito à vista':3.4, 'Crédito parcelado':5.9 },
  diaComissao: 5,
  horaInicio: 9, horaFim: 21,
  aliquotaSimples: 6,
  metaMensal: 45000,
  autoclaves: ['Autoclave Cristófoli Vitale 21L'],
  validadeEsterilizacao: 30,
  validadeOrcamento: 15,
  sinalPct: 30
};

const CAT_RECEITA = ['Tatuagem','Piercing','Venda de joias','Venda de produtos','Sinal/Adiantamento','Outras receitas'];
const CAT_DESPESA = ['Aluguel','Condomínio/IPTU','Energia elétrica','Água','Internet/Telefone','Salários e encargos','Comissões','Pró-labore','Limpeza e conservação','Copa/Café','Compra de insumos','Compra de joias (estoque)','Marketing/Anúncios','Contabilidade','Impostos (DAS/Simples)','Taxas de cartão','Manutenção de equipamentos','Coleta de resíduos','Software/Assinaturas','Outras despesas'];
// Categorias que NÃO entram como despesa operacional na DRE (o custo aparece pelo consumo/venda ou em outra linha)
const CAT_FORA_OPEX = ['Comissões','Taxas de cartão','Impostos (DAS/Simples)','Compra de insumos','Compra de joias (estoque)'];
const CAT_INSUMO = ['Agulhas/Cartuchos','Tintas','Descartáveis','Biossegurança','Higienização/Limpeza','Pós-procedimento','Copa/Café','Escritório'];
const CAT_JOIA = ['Labret','Argola/Segmento','Nostril','Septum/Clicker','Barbell','Banana (umbigo)','Industrial','Tragus/Hélix','Alargador/Plug','Tunnel','Outros'];
const MATERIAIS = ['Titânio ASTM F136','Aço cirúrgico 316L','Ouro 18k','Ouro 18k + zircônia','Prata 925','Silicone','Bioplast','Nióbio'];
const FORMAS = ['PIX','Dinheiro','Débito','Crédito à vista','Crédito parcelado'];
const MOTIVOS_SAIDA = ['Consumo interno','Uso em atendimento','Perda/Vencido','Ajuste de inventário'];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
// datas sempre no fuso local (toISOString usaria UTC e viraria o dia às 21h no Brasil)
const isoLocal = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => isoLocal(new Date());
const round2 = n => Math.round((+n || 0) * 100) / 100;

const DB = {
  mode: 'demo', cache: {}, config: { ...DEFAULT_CONFIG }, listeners: [], fs: null, auth: null, user: null, _unsubs: [],

  isFirebase() { const c = window.FIREBASE_CONFIG || {}; return !!(c.apiKey && c.projectId && window.firebase); },

  initFirebase() {
    if (!this.isFirebase()) return false;
    if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
    this.fs = firebase.firestore();
    this.auth = firebase.auth();
    try { this.fs.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch (e) {}
    this.mode = 'firebase';
    return true;
  },

  /* Carrega tudo: no Firebase escuta cada coleção em tempo real */
  load() {
    COLS.forEach(c => this.cache[c] = this.cache[c] || {});
    if (this.mode === 'demo') {
      let raw = null; try { raw = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) {}
      if (!raw) { raw = Seed.build(); localStorage.setItem(LS_KEY, JSON.stringify(raw)); }
      COLS.forEach(c => this.cache[c] = raw[c] || {});
      this.config = { ...DEFAULT_CONFIG, ...(raw.config || {}) };
      // anamneses enviadas pelo formulário público (mesmo navegador) chegam por aqui
      window.addEventListener('storage', e => { if (e.key === LS_KEY) { this.load(); this.emit(); } });
      return Promise.resolve();
    }
    this._unsubs.forEach(u => u()); this._unsubs = [];
    const waits = COLS.map(c => new Promise(res => {
      let first = true;
      this._unsubs.push(this.fs.collection(c).onSnapshot(snap => {
        const o = {}; snap.forEach(d => o[d.id] = { ...d.data(), id: d.id });
        this.cache[c] = o;
        if (first) { first = false; res(); } else this.emit();
      }, err => { console.error(c, err); res(); }));
    }));
    waits.push(new Promise(res => {
      this._unsubs.push(this.fs.collection('config').doc('studio').onSnapshot(d => {
        this.config = { ...DEFAULT_CONFIG, ...(d.exists ? d.data() : {}) }; res(); this.emit();
      }, () => res()));
    }));
    return Promise.all(waits);
  },

  persistLocal() {
    if (this.mode !== 'demo') return;
    const o = { config: this.config }; COLS.forEach(c => o[c] = this.cache[c]);
    try { localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) { UI.toast('Armazenamento local cheio', 'err'); }
  },

  all(c) { return Object.values(this.cache[c] || {}); },
  get(c, id) { return id ? (this.cache[c] || {})[id] : null; },

  save(c, obj, silent) {
    if (!obj.id) obj.id = uid();
    if (!obj.criadoEm) obj.criadoEm = new Date().toISOString();
    obj.atualizadoEm = new Date().toISOString();
    this.cache[c][obj.id] = obj;
    if (this.mode === 'firebase') {
      const clean = JSON.parse(JSON.stringify(obj));
      this.fs.collection(c).doc(obj.id).set(clean).catch(e => UI.toast('Erro ao salvar: ' + e.message, 'err'));
    } else this.persistLocal();
    if (!silent) this.emit();
    return obj;
  },

  remove(c, id, silent) {
    delete this.cache[c][id];
    if (this.mode === 'firebase') this.fs.collection(c).doc(id).delete().catch(e => UI.toast('Erro: ' + e.message, 'err'));
    else this.persistLocal();
    if (!silent) this.emit();
  },

  saveConfig(cfg) {
    this.config = { ...this.config, ...cfg };
    if (this.mode === 'firebase') {
      this.fs.collection('config').doc('studio').set(JSON.parse(JSON.stringify(this.config)));
      // dados públicos usados no cabeçalho da ficha de anamnese (sem login)
      const c = this.config; this.fs.collection('publico').doc('studio').set({ nome: c.nome || '', telefone: c.telefone || '', instagram: c.instagram || '', endereco: c.endereco || '' });
    }
    else this.persistLocal();
    this.emit();
  },

  on(fn) { this.listeners.push(fn); },
  _t: null,
  emit() { clearTimeout(this._t); this._t = setTimeout(() => this.listeners.forEach(f => f()), 30); },

  exportJSON() { const o = { config: this.config, exportadoEm: new Date().toISOString() }; COLS.forEach(c => o[c] = this.cache[c]); return o; },

  async importJSON(o) {
    COLS.forEach(c => { if (o[c]) Object.values(o[c]).forEach(r => this.save(c, r, true)); });
    if (o.config) this.saveConfig(o.config);
    this.emit();
  },

  resetDemo(empty) {
    const raw = empty ? { config: DEFAULT_CONFIG } : Seed.build();
    localStorage.setItem(LS_KEY, JSON.stringify(raw)); this.load(); this.emit();
  }
};

/* ============================================================
   REGRAS DE NEGÓCIO
   ============================================================ */
const Biz = {
  precoPorMarkup(custo, markup) { return round2(custo * (1 + (+markup || 0) / 100)); },
  margem(preco, custo) { return preco > 0 ? ((preco - custo) / preco) * 100 : 0; },
  markup(preco, custo) { return custo > 0 ? ((preco - custo) / custo) * 100 : 0; },

  custoKit(kit) {
    return round2((kit || []).reduce((s, k) => { const i = DB.get('insumos', k.insumoId); return s + (i ? i.custoUnit * k.qtd : 0); }, 0));
  },

  taxaForma(forma) { return +(DB.config.taxas || {})[forma] || 0; },

  /* Movimenta estoque e registra no histórico */
  mover({ tipo, itemId, mov, qtd, custoUnit, motivo, ref, data }) {
    const col = tipo === 'joia' ? 'joias' : 'insumos';
    const it = DB.get(col, itemId); if (!it) return;
    qtd = +qtd || 0;
    const antes = +it.qtd || 0;
    if (mov === 'entrada') {
      // custo médio ponderado
      if (custoUnit != null && custoUnit !== '' && (antes + qtd) > 0) {
        const cu = tipo === 'joia' ? it.custo : it.custoUnit;
        const novo = round2(((antes * cu) + (qtd * +custoUnit)) / (antes + qtd) * 10000) / 10000;
        if (tipo === 'joia') { it.custo = round2(novo); if (it.precoAuto !== false) it.preco = Biz.precoPorMarkup(it.custo, it.markup); }
        else it.custoUnit = novo;
      }
      it.qtd = round2(antes + qtd);
    } else if (mov === 'saida') it.qtd = round2(antes - qtd);
    else if (mov === 'ajuste') { it.qtd = round2(qtd); qtd = round2(qtd - antes); }
    DB.save(col, it, true);
    DB.save('movEstoque', {
      tipo, itemId, nome: it.nome, mov, qtd, saldo: it.qtd,
      custoUnit: custoUnit != null && custoUnit !== '' ? +custoUnit : (tipo === 'joia' ? it.custo : it.custoUnit),
      motivo: motivo || '', ref: ref || '', data: data || today(), usuario: DB.user ? DB.user.email : 'demo'
    }, true);
  },

  lancReceita({ valor, categoria, descricao, data, forma, origem, clienteId, profissionalId }) {
    if (!(valor > 0)) return;
    DB.save('lancamentos', { tipo: 'receita', categoria, descricao, valor: round2(valor), data, status: 'pago', pagoEm: data, forma, origem, clienteId, profissionalId }, true);
    const tx = Biz.taxaForma(forma);
    if (tx > 0) DB.save('lancamentos', { tipo: 'despesa', categoria: 'Taxas de cartão', descricao: `Taxa ${forma} (${tx}%) — ${descricao}`, valor: round2(valor * tx / 100), data, status: 'pago', pagoEm: data, forma, origem }, true);
  },

  vencComissao(data) {
    const d = new Date(data + 'T12:00'); d.setMonth(d.getMonth() + 1); d.setDate(DB.config.diaComissao || 5);
    return isoLocal(d);
  },

  /* Registra um atendimento (tattoo/piercing) com todas as integrações */
  registrarAtendimento(at) {
    const editing = at.id && DB.get('atendimentos', at.id);
    if (editing) Biz.estornarAtendimento(at.id, true);
    at.id = at.id || uid();
    const ref = 'atendimento:' + at.id;
    const cli = DB.get('clientes', at.clienteId); const srv = DB.get('servicos', at.servicoId); const prof = DB.get('profissionais', at.profissionalId);
    const desc = `${srv ? srv.nome : 'Atendimento'} — ${cli ? cli.nome : 'Cliente'}`;
    // insumos
    at.insumos = (at.insumos || []).filter(i => i.insumoId && +i.qtd > 0).map(i => { const ins = DB.get('insumos', i.insumoId); return { insumoId: i.insumoId, qtd: +i.qtd, custoUnit: ins ? ins.custoUnit : 0 }; });
    at.insumos.forEach(i => Biz.mover({ tipo: 'insumo', itemId: i.insumoId, mov: 'saida', qtd: i.qtd, motivo: 'Uso em atendimento', ref, data: at.data }));
    at.custoInsumos = round2(at.insumos.reduce((s, i) => s + i.qtd * i.custoUnit, 0));
    // joias aplicadas no procedimento
    at.joias = (at.joias || []).filter(j => j.joiaId && +j.qtd > 0).map(j => { const jo = DB.get('joias', j.joiaId); return { joiaId: j.joiaId, qtd: +j.qtd, preco: +j.preco || (jo ? jo.preco : 0), custo: jo ? jo.custo : 0 }; });
    at.joias.forEach(j => Biz.mover({ tipo: 'joia', itemId: j.joiaId, mov: 'saida', qtd: j.qtd, motivo: 'Aplicada em atendimento', ref, data: at.data }));
    at.totalJoias = round2(at.joias.reduce((s, j) => s + j.qtd * j.preco, 0));
    at.custoJoias = round2(at.joias.reduce((s, j) => s + j.qtd * j.custo, 0));
    at.valor = +at.valor || 0; at.desconto = +at.desconto || 0; at.sinal = +at.sinal || 0;
    at.valorLiquido = round2(at.valor - at.desconto);
    at.comissaoPct = at.comissaoPct != null && at.comissaoPct !== '' ? +at.comissaoPct : (prof ? +prof.comissaoPct || 0 : 0);
    at.comissaoValor = round2(at.valorLiquido * at.comissaoPct / 100);
    at.tipo = srv ? srv.tipo : (at.tipo || 'tattoo');
    // financeiro
    const receber = round2(at.valorLiquido - at.sinal);
    Biz.lancReceita({ valor: receber, categoria: at.tipo === 'piercing' ? 'Piercing' : 'Tatuagem', descricao: desc, data: at.data, forma: at.forma, origem: ref, clienteId: at.clienteId, profissionalId: at.profissionalId });
    Biz.lancReceita({ valor: at.totalJoias, categoria: 'Venda de joias', descricao: 'Joia aplicada — ' + desc, data: at.data, forma: at.forma, origem: ref, clienteId: at.clienteId });
    if (at.comissaoValor > 0) DB.save('lancamentos', { tipo: 'despesa', categoria: 'Comissões', descricao: `Comissão ${prof ? prof.nome : ''} (${at.comissaoPct}%) — ${desc}`, valor: at.comissaoValor, data: at.data, vencimento: Biz.vencComissao(at.data), status: 'pendente', origem: ref, profissionalId: at.profissionalId }, true);
    if (at.agendamentoId) { const ag = DB.get('agendamentos', at.agendamentoId); if (ag) { ag.status = 'concluido'; ag.atendimentoId = at.id; DB.save('agendamentos', ag, true); } }
    DB.save('atendimentos', at, true);
    DB.emit();
    return at;
  },

  estornarAtendimento(id, keep) {
    const at = DB.get('atendimentos', id); if (!at) return;
    const ref = 'atendimento:' + id;
    (at.insumos || []).forEach(i => Biz.mover({ tipo: 'insumo', itemId: i.insumoId, mov: 'entrada', qtd: i.qtd, motivo: 'Estorno de atendimento', ref }));
    (at.joias || []).forEach(j => Biz.mover({ tipo: 'joia', itemId: j.joiaId, mov: 'entrada', qtd: j.qtd, motivo: 'Estorno de atendimento', ref }));
    DB.all('lancamentos').filter(l => l.origem === ref).forEach(l => DB.remove('lancamentos', l.id, true));
    if (!keep) {
      if (at.agendamentoId) { const ag = DB.get('agendamentos', at.agendamentoId); if (ag) { ag.status = 'confirmado'; delete ag.atendimentoId; DB.save('agendamentos', ag, true); } }
      DB.remove('atendimentos', id, true);
    }
    DB.emit();
  },

  registrarVenda(v) {
    v.id = uid(); const ref = 'venda:' + v.id;
    v.itens = v.itens.map(i => { const j = DB.get('joias', i.joiaId); return { ...i, custo: j ? j.custo : 0, nome: j ? j.nome : '' }; });
    v.subtotal = round2(v.itens.reduce((s, i) => s + i.qtd * i.preco, 0));
    v.total = round2(v.subtotal - (+v.desconto || 0));
    v.custoTotal = round2(v.itens.reduce((s, i) => s + i.qtd * i.custo, 0));
    v.itens.forEach(i => Biz.mover({ tipo: 'joia', itemId: i.joiaId, mov: 'saida', qtd: i.qtd, motivo: 'Venda (PDV)', ref, data: v.data }));
    const cli = DB.get('clientes', v.clienteId);
    Biz.lancReceita({ valor: v.total, categoria: 'Venda de joias', descricao: `Venda PDV #${v.id.slice(-5).toUpperCase()}${cli ? ' — ' + cli.nome : ''}`, data: v.data, forma: v.forma, origem: ref, clienteId: v.clienteId });
    DB.save('vendas', v, true); DB.emit();
    return v;
  },

  estornarVenda(id) {
    const v = DB.get('vendas', id); if (!v) return; const ref = 'venda:' + id;
    v.itens.forEach(i => Biz.mover({ tipo: 'joia', itemId: i.joiaId, mov: 'entrada', qtd: i.qtd, motivo: 'Estorno de venda', ref }));
    DB.all('lancamentos').filter(l => l.origem === ref).forEach(l => DB.remove('lancamentos', l.id, true));
    DB.remove('vendas', id, true); DB.emit();
  },

  /* Gera as despesas recorrentes do mês (aluguel, salários, etc.) */
  gerarRecorrentes(ym) {
    const base = DB.all('lancamentos').filter(l => l.recorrente);
    const modelos = {}; base.forEach(l => { const k = l.recorrenteId || l.id; if (!modelos[k] || modelos[k].data < l.data) modelos[k] = l; });
    let n = 0;
    Object.entries(modelos).forEach(([k, m]) => {
      if (DB.all('lancamentos').some(l => (l.recorrenteId === k || l.id === k) && l.data.slice(0, 7) === ym)) return;
      const dia = m.data.slice(8, 10);
      const [y, mo] = ym.split('-').map(Number); const last = new Date(y, mo, 0).getDate();
      const data = `${ym}-${String(Math.min(+dia, last)).padStart(2, '0')}`;
      DB.save('lancamentos', { tipo: m.tipo, categoria: m.categoria, descricao: m.descricao, valor: m.valor, data, vencimento: data, status: 'pendente', recorrente: true, recorrenteId: k, profissionalId: m.profissionalId }, true);
      n++;
    });
    DB.emit(); return n;
  },

  /* DRE gerencial do período (ym = 'AAAA-MM' ou ano 'AAAA') */
  dre(prefix) {
    const inP = d => (d || '').startsWith(prefix);
    const L = DB.all('lancamentos').filter(l => inP(l.data));
    const rec = {}; L.filter(l => l.tipo === 'receita').forEach(l => rec[l.categoria] = (rec[l.categoria] || 0) + l.valor);
    const receita = Object.values(rec).reduce((a, b) => a + b, 0);
    const sumCat = c => L.filter(l => l.tipo === 'despesa' && l.categoria === c).reduce((s, l) => s + l.valor, 0);
    const taxas = sumCat('Taxas de cartão'), impostos = sumCat('Impostos (DAS/Simples)'), comissoes = sumCat('Comissões');
    const ats = DB.all('atendimentos').filter(a => inP(a.data));
    const vds = DB.all('vendas').filter(v => inP(v.data));
    const insumosAt = ats.reduce((s, a) => s + (a.custoInsumos || 0), 0);
    const cmvJoias = ats.reduce((s, a) => s + (a.custoJoias || 0), 0) + vds.reduce((s, v) => s + (v.custoTotal || 0), 0);
    const consumoInterno = DB.all('movEstoque').filter(m => inP(m.data) && m.mov === 'saida' && ['Consumo interno', 'Perda/Vencido'].includes(m.motivo)).reduce((s, m) => s + m.qtd * (m.custoUnit || 0), 0);
    const opex = {}; L.filter(l => l.tipo === 'despesa' && !CAT_FORA_OPEX.includes(l.categoria)).forEach(l => opex[l.categoria] = (opex[l.categoria] || 0) + l.valor);
    if (consumoInterno > 0) opex['Consumo interno de insumos (café, limpeza...)'] = consumoInterno;
    const totalOpex = Object.values(opex).reduce((a, b) => a + b, 0);
    const receitaLiq = receita - taxas - impostos;
    const custosVar = insumosAt + cmvJoias + comissoes;
    const margemContrib = receitaLiq - custosVar;
    const lucro = margemContrib - totalOpex;
    return { rec, receita, taxas, impostos, receitaLiq, insumosAt, cmvJoias, comissoes, custosVar, margemContrib, opex, totalOpex, lucro, margemPct: receita ? lucro / receita * 100 : 0, nAt: ats.length, nVd: vds.length };
  },

  caixa(prefix) {
    const L = DB.all('lancamentos').filter(l => l.status === 'pago' && (l.pagoEm || l.data || '').startsWith(prefix));
    const ent = L.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0);
    const sai = L.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0);
    return { ent, sai, saldo: ent - sai };
  },

  anamneseAlertas(a) {
    const r = a.respostas || {}; const out = [];
    ANAMNESE_PERGUNTAS.forEach(q => { if (r[q.id] === 'sim' && q.alerta) out.push(q.curto || q.txt); });
    return out;
  }
};

/* Perguntas da ficha (usadas no formulário público e na visualização) */
const ANAMNESE_PERGUNTAS = [
  { id: 'tratamento', txt: 'Está em tratamento médico atualmente?', det: true, alerta: true, curto: 'Em tratamento médico' },
  { id: 'medicamentos', txt: 'Faz uso contínuo de algum medicamento?', det: true, alerta: true, curto: 'Medicamento contínuo' },
  { id: 'anticoagulante', txt: 'Usa anticoagulante ou AAS (aspirina) nos últimos 7 dias?', alerta: true, curto: 'Anticoagulante/AAS' },
  { id: 'roacutan', txt: 'Usou isotretinoína (Roacutan) nos últimos 6 meses?', alerta: true, curto: 'Isotretinoína recente' },
  { id: 'diabetes', txt: 'Tem diabetes?', alerta: true, curto: 'Diabetes' },
  { id: 'hemofilia', txt: 'Tem hemofilia ou outro distúrbio de coagulação?', alerta: true, curto: 'Distúrbio de coagulação' },
  { id: 'cardiaco', txt: 'Tem problemas cardíacos ou usa marca-passo?', alerta: true, curto: 'Problema cardíaco' },
  { id: 'pressao', txt: 'Tem pressão alta ou baixa?', det: true, alerta: true, curto: 'Pressão alterada' },
  { id: 'epilepsia', txt: 'Tem epilepsia, convulsões ou histórico de desmaios?', alerta: true, curto: 'Epilepsia/desmaios' },
  { id: 'hepatite', txt: 'Tem ou já teve hepatite?', det: true, alerta: true, curto: 'Hepatite' },
  { id: 'infecto', txt: 'Possui alguma doença infectocontagiosa (HIV, sífilis, etc.)?', alerta: true, curto: 'Doença infectocontagiosa' },
  { id: 'imuno', txt: 'Tem baixa imunidade ou doença autoimune?', det: true, alerta: true, curto: 'Imunidade baixa/autoimune' },
  { id: 'queloide', txt: 'Tem tendência a queloide ou problemas de cicatrização?', alerta: true, curto: 'Queloide/cicatrização' },
  { id: 'pele', txt: 'Tem doença de pele (psoríase, dermatite, vitiligo) na região?', det: true, alerta: true, curto: 'Doença de pele' },
  { id: 'alergia', txt: 'Tem alergia (látex, metais, níquel, pigmentos, anestésicos, medicamentos)?', det: true, alerta: true, curto: 'Alergia' },
  { id: 'gestante', txt: 'Está gestante ou amamentando?', alerta: true, curto: 'Gestante/amamentando' },
  { id: 'cirurgia', txt: 'Passou por cirurgia nos últimos 6 meses?', det: true, alerta: true, curto: 'Cirurgia recente' },
  { id: 'alcool', txt: 'Ingeriu bebida alcoólica nas últimas 24 horas?', alerta: true, curto: 'Álcool nas últimas 24h' },
  { id: 'drogas', txt: 'Fez uso de drogas nas últimas 24 horas?', alerta: true, curto: 'Drogas nas últimas 24h' },
  { id: 'jejum', txt: 'Está em jejum (sem se alimentar há mais de 4 horas)?', alerta: true, curto: 'Em jejum' },
  { id: 'sol', txt: 'Tomou sol intenso ou está com a pele queimada na região?', alerta: true, curto: 'Pele queimada de sol' },
  { id: 'primeira', txt: 'É sua primeira tatuagem/piercing?' }
];
