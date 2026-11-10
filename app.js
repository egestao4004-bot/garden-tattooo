/* ============================================================
   APP — roteamento, layout, autenticação
   Desenvolvido por Evander
   ============================================================ */
const Views = {};
const NAV = [
  ['Principal', [['dashboard', 'Painel', 'dash'], ['agenda', 'Agenda', 'cal'], ['atendimentos', 'Atendimentos', 'needle'], ['orcamentos', 'Orçamentos & Projetos', 'clip'], ['pdv', 'PDV — Vendas', 'cart']]],
  ['Clientes', [['clientes', 'Clientes', 'users'], ['anamneses', 'Fichas de Anamnese', 'file'], ['galeria', 'Portfólio & Fotos', 'image']]],
  ['Estoque & Biossegurança', [['insumos', 'Insumos', 'box'], ['joias', 'Joias', 'gem'], ['movimentos', 'Movimentações', 'repeat'], ['biosseguranca', 'Esterilização', 'shield']]],
  ['Financeiro', [['financeiro', 'Contas & Caixa', 'money'], ['relatorios', 'DRE & Relatórios', 'chart']]],
  ['Gestão', [['equipe', 'Equipe & Comissões', 'team'], ['servicos', 'Serviços & Kits', 'needle'], ['usuarios', 'Usuários & Acessos', 'key'], ['config', 'Configurações', 'cog']]]
];

/* ---------- Permissões por perfil ---------- */
const PAPEIS = { admin: 'Administrador', recepcao: 'Recepção', artista: 'Tatuador / Piercer' };
const ROTAS_PAPEL = {
  admin: '*',
  recepcao: ['dashboard', 'agenda', 'atendimentos', 'orcamentos', 'pdv', 'clientes', 'anamneses', 'galeria', 'insumos', 'joias', 'movimentos', 'biosseguranca', 'financeiro'],
  artista: ['dashboard', 'agenda', 'atendimentos', 'orcamentos', 'pdv', 'clientes', 'anamneses', 'galeria', 'insumos', 'joias', 'biosseguranca']
};
const Perm = {
  papel() { const p = DB.user?.papel; return p === 'equipe' ? 'recepcao' : (PAPEIS[p] ? p : 'recepcao'); },
  isAdmin() { return this.papel() === 'admin'; },
  isArtista() { return this.papel() === 'artista'; },
  gestao() { return ['admin', 'recepcao'].includes(this.papel()); },
  profId() { return this.isArtista() ? (DB.user.profissionalId || '__nenhum__') : ''; },
  can(r) { const a = ROTAS_PAPEL[this.papel()] || []; return a === '*' || a.includes(r); }
};

const App = {
  route: 'dashboard', params: {},

  async start() {
    DB.on(() => this.renderSoft());
    if (DB.initFirebase()) {
      document.body.innerHTML = '<div class="login"><div class="muted">Conectando...</div></div>';
      DB.auth.onAuthStateChanged(async u => {
        if (!u) return this.loginScreen();
        const ok = await DB.fs.collection('acessos').doc(u.uid).get().then(d => d.exists ? d.data() : null).catch(() => null);
        if (!ok) return this.noAccess(u);
        DB.user = { uid: u.uid, email: u.email, nome: ok.nome || u.email, papel: ok.papel || 'recepcao', profissionalId: ok.profissionalId || '' };
        document.body.innerHTML = '<div class="login"><div class="muted">Sincronizando dados do estúdio...</div></div>';
        await DB.load(); this.shell();
      });
    } else {
      await DB.load(); this.demoUser(); this.shell();
    }
  },

  loginScreen(msg = '') {
    DB._unsubs.forEach(u => { try { u(); } catch (e) {} }); DB._unsubs = [];
    document.body.innerHTML = `<div class="login"><div class="login-box">
      <img class="emblem" src="img/logo.png" alt="Garden Tattoo"><div class="logo">GARDEN <b>TATTOO</b></div><p class="s">Sistema de Gestão do Estúdio</p>
      <form class="card" id="lf"><div class="fg">
        ${UI.f('E-mail', 'email', '', { type: 'email', col: 12 })}${UI.f('Senha', 'senha', '', { type: 'password', col: 12 })}
        <div class="c12">${msg ? `<div class="alert bad">${msg}</div>` : ''}</div>
        <div class="c12"><button class="btn pri" style="width:100%;justify-content:center;padding:11px">Entrar</button></div>
        <div class="c12 small muted" style="text-align:center"><a href="#" id="forgot">Esqueci minha senha</a></div>
      </div></form></div></div><div class="sign">Desenvolvido por <b>Evander</b></div>`;
    $('#lf').onsubmit = e => {
      e.preventDefault(); const d = UI.formData(e.target);
      DB.auth.signInWithEmailAndPassword(d.email, d.senha).catch(() => this.loginScreen('E-mail ou senha inválidos.'));
    };
    $('#forgot').onclick = e => { e.preventDefault(); const em = $('[name=email]').value; if (!em) return UI.toast('Digite seu e-mail acima', 'warn'); DB.auth.sendPasswordResetEmail(em).then(() => UI.toast('E-mail de redefinição enviado')); };
  },

  noAccess(u) {
    document.body.innerHTML = `<div class="login"><div class="login-box card"><h2 style="margin-bottom:10px">Acesso não liberado</h2>
      <p class="muted">Seu usuário existe, mas ainda não foi liberado no estúdio. Peça ao administrador para criar o documento abaixo no Firestore:</p>
      <div class="alert info mt">Coleção <b>acessos</b> → documento <b>${u.uid}</b><br>campos: nome, papel ("admin" ou "equipe")</div>
      <div class="row mt"><button class="btn" onclick="UI.copy('${u.uid}')">${ic('copy')} Copiar UID</button><span class="grow"></span><button class="btn" onclick="DB.auth.signOut()">Sair</button></div></div></div>`;
  },

  /* No modo demo dá para "ver como" cada perfil, para apresentar as permissões */
  demoUser() {
    const r = sessionStorage.getItem('gt_role') || 'admin';
    if (r.startsWith('artista:')) { const p = DB.get('profissionais', r.slice(8)); if (p) { DB.user = { email: 'demo@studio', nome: p.nome, papel: 'artista', profissionalId: p.id }; return; } }
    if (r === 'recepcao') { const p = DB.all('profissionais').find(x => /recep/i.test(x.funcao)); DB.user = { email: 'demo@studio', nome: p ? p.nome : 'Recepção', papel: 'recepcao' }; return; }
    DB.user = { email: 'demo@studio', nome: 'Administrador (demo)', papel: 'admin' };
  },

  shell() {
    document.body.innerHTML = `
      ${DB.mode === 'demo' ? '<div class="demo-bar">⚠ MODO DEMONSTRAÇÃO — dados salvos apenas neste navegador. Configure o Firebase em <b>js/firebase-config.js</b> para usar online com a equipe.</div>' : ''}
      <div class="app"><aside class="side" id="side">
        <div class="brand"><img src="img/logo.png" alt=""><div><div class="logo" id="brandLogo"></div><small>Tattoo · Piercing · Gestão</small></div></div>
        <nav class="nav" id="nav"></nav>
        <div class="side-foot"><div class="user"><div class="avatar">${initials(DB.user.nome)}</div><div><div style="color:var(--txt);font-weight:600">${esc(DB.user.nome)}</div><div>${esc(DB.user.email)}</div></div></div>
          <div class="small" style="margin:-4px 0 10px 42px;color:var(--acc2)">${PAPEIS[Perm.papel()]}</div>
          ${DB.mode === 'firebase' ? `<button class="btn sm ghost" id="logout">${ic('logout')} Sair</button>` : `<div class="f"><label>Ver sistema como (demo)</label><select id="roleSw">${[['admin', 'Administrador'], ['recepcao', 'Recepção'], ...DB.all('profissionais').filter(p => p.comissaoPct > 0).map(p => ['artista:' + p.id, p.nome + ' (' + p.funcao + ')'])].map(([v, t]) => `<option value="${v}" ${(sessionStorage.getItem('gt_role') || 'admin') === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`}</div>
      </aside>
      <main class="main"><header class="top"><button class="btn icon menu-btn" id="menuBtn">${ic('menu')}</button><div><h1 id="ttl"></h1><div class="sub" id="subttl"></div></div><div class="sp"></div><div id="topAct" class="row"></div></header>
      <section class="content" id="view"></section></main></div>
      <div class="side-back" id="sideBack"></div>
      <div class="sign">Desenvolvido por <b>Evander</b></div>`;
    $('#menuBtn').onclick = () => $('#side').classList.toggle('open');
    $('#sideBack').onclick = () => $('#side').classList.remove('open');
    if ($('#logout')) $('#logout').onclick = () => DB.auth.signOut();
    if ($('#roleSw')) $('#roleSw').onchange = e => { sessionStorage.setItem('gt_role', e.target.value); this.demoUser(); location.hash = '#/dashboard'; this.shell(); UI.toast('Visualizando como: ' + DB.user.nome); };
    window.onhashchange = () => this.go();
    this.go();
  },

  brand() {
    const n = (DB.config.nome || 'Garden Tattoo').toUpperCase().split(' ');
    $('#brandLogo').innerHTML = n.length > 1 ? `${esc(n[0])}<b>${esc(n.slice(1, 3).join(' '))}</b>` : `<b>${esc(n[0])}</b>`;
    document.title = (DB.config.nome || 'Garden Tattoo') + ' — Gestão';
  },

  nav() {
    const novas = DB.all('anamneses').filter(a => a.status === 'nova').length;
    const baixo = DB.all('insumos').filter(i => i.qtd <= i.minimo).length + DB.all('joias').filter(j => j.qtd <= j.minimo).length;
    const badge = { anamneses: novas, insumos: DB.all('insumos').filter(i => i.qtd <= i.minimo).length, joias: DB.all('joias').filter(j => j.qtd <= j.minimo).length,
      biosseguranca: DB.all('esterilizacoes').filter(e => e.biologico === 'pendente').length, orcamentos: DB.all('orcamentos').filter(o => Views.orcamentos.statusReal(o) === 'enviado' && (!Perm.profId() || o.profissionalId === Perm.profId())).length };
    $('#nav').innerHTML = NAV.map(([sec, items]) => [sec, items.filter(([k]) => Perm.can(k))]).filter(([, it]) => it.length).map(([sec, items]) => `<div class="sec">${sec}</div>` + items.map(([k, t, i]) => `<a href="#/${k}" class="${this.route === k ? 'on' : ''}">${ic(i, 'ic')}<span>${t}</span>${badge[k] ? `<span class="badge">${badge[k]}</span>` : ''}</a>`).join('')).join('');
  },

  go() {
    const h = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [r, q] = h.split('?');
    this.route = Views[r] && Perm.can(r) ? r : 'dashboard';
    this.params = Object.fromEntries(new URLSearchParams(q || ''));
    $('#side').classList.remove('open');
    this.render(true);
  },

  render(scrollTop) {
    const v = Views[this.route];
    this.brand(); this.nav();
    $('#ttl').textContent = v.title; $('#subttl').textContent = v.sub ? v.sub() : '';
    $('#topAct').innerHTML = '';
    const el = $('#view');
    try { v.render(el, this.params); } catch (e) { console.error(e); el.innerHTML = `<div class="alert bad">Erro ao carregar a tela: ${esc(e.message)}</div>`; }
    if (scrollTop) window.scrollTo(0, 0);
  },

  /* Re-render após mudanças de dados, preservando foco/scroll e sem atrapalhar digitação */
  renderSoft() {
    if (!$('#view')) return;
    const a = document.activeElement;
    if (a && $('#view').contains(a) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) { this.nav(); return; }
    const y = window.scrollY; this.render(false); window.scrollTo(0, y);
  },

  actions(html) { $('#topAct').innerHTML = html; }
};

document.addEventListener('DOMContentLoaded', () => App.start());
