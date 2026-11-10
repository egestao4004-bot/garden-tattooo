/* ============================================================
   DADOS DE DEMONSTRAÇÃO — gerados relativos à data de hoje
   ============================================================ */
const Seed = {
  build() {
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const pick = a => a[Math.floor(rnd() * a.length)];
    const int = (a, b) => Math.floor(a + rnd() * (b - a + 1));
    const iso = d => isoLocal(d);
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const o = {}; COLS.forEach(c => o[c] = {});
    const put = (c, obj) => { obj.id = obj.id || uid() + Math.floor(rnd() * 1e6).toString(36); obj.criadoEm = obj.criadoEm || new Date().toISOString(); o[c][obj.id] = obj; return obj; };
    const now = new Date(); now.setHours(12, 0, 0, 0);

    // ---------- Equipe ----------
    const P = {
      rafa: put('profissionais', { nome: 'Rafa Moreno', funcao: 'Tatuador', vinculo: 'Comissionado', comissaoPct: 50, salario: 0, cor: '#7fae55', telefone: '(11) 98888-1001', ativo: true, especialidade: 'Realismo e blackwork' }),
      bia: put('profissionais', { nome: 'Bia Lopes', funcao: 'Tatuadora', vinculo: 'Comissionado', comissaoPct: 50, salario: 0, cor: '#e0bf6e', telefone: '(11) 98888-1002', ativo: true, especialidade: 'Fine line e colorido' }),
      diego: put('profissionais', { nome: 'Diego Prado', funcao: 'Body Piercer', vinculo: 'Comissionado', comissaoPct: 40, salario: 0, cor: '#5fb3a1', telefone: '(11) 98888-1003', ativo: true, especialidade: 'Piercing e joalheria' }),
      carla: put('profissionais', { nome: 'Carla Souza', funcao: 'Recepção', vinculo: 'CLT', comissaoPct: 0, salario: 1950, cor: '#c98a5a', telefone: '(11) 98888-1004', ativo: true }),
      marta: put('profissionais', { nome: 'Marta Dias', funcao: 'Limpeza', vinculo: 'Fixo (diarista)', comissaoPct: 0, salario: 1200, cor: '#a7c4a0', telefone: '(11) 98888-1005', ativo: true })
    };

    // ---------- Insumos ----------
    const ins = {};
    const I = (k, nome, categoria, unidade, custoUnit, qtd, minimo, fornecedor) => ins[k] = put('insumos', { nome, categoria, unidade, custoUnit, qtd, minimo, fornecedor: fornecedor || '', lote: 'L' + int(1000, 9999), validade: iso(addDays(now, int(60, 700))) });
    I('c3rl', 'Cartucho 3RL 0,35mm (traço fino)', 'Agulhas/Cartuchos', 'un', 4.6, 180, 60, 'Electric Ink');
    I('c5rl', 'Cartucho 5RL 0,35mm', 'Agulhas/Cartuchos', 'un', 4.6, 95, 50, 'Electric Ink');
    I('c7rl', 'Cartucho 7RL 0,35mm (contorno)', 'Agulhas/Cartuchos', 'un', 4.8, 38, 50, 'Electric Ink');
    I('c9m', 'Cartucho 9RM Magnum (sombra)', 'Agulhas/Cartuchos', 'un', 5.2, 120, 50, 'Electric Ink');
    I('c15m', 'Cartucho 15RM Magnum (preenchimento)', 'Agulhas/Cartuchos', 'un', 5.9, 70, 40, 'Electric Ink');
    I('a16', 'Agulha piercing 16G (1,2mm)', 'Agulhas/Cartuchos', 'un', 3.1, 64, 30, 'Body Piercing Supply');
    I('a14', 'Agulha piercing 14G (1,6mm)', 'Agulhas/Cartuchos', 'un', 3.3, 22, 30, 'Body Piercing Supply');
    I('a18', 'Agulha piercing 18G (1,0mm)', 'Agulhas/Cartuchos', 'un', 3.0, 40, 20, 'Body Piercing Supply');
    I('tpreta', 'Tinta preta Tribal Black 240ml', 'Tintas', 'ml', 0.78, 610, 240, 'Dynamic');
    I('tbranca', 'Tinta branca 120ml', 'Tintas', 'ml', 0.95, 180, 60, 'Electric Ink');
    I('tcolor', 'Tintas coloridas (kit 12 cores)', 'Tintas', 'ml', 1.1, 420, 150, 'Eternal Ink');
    I('diluente', 'Diluente / mix shading', 'Tintas', 'ml', 0.35, 300, 100);
    I('batoque', 'Batoque (copinho de tinta)', 'Descartáveis', 'un', 0.04, 1800, 500);
    I('luva', 'Luva nitrílica preta (unidade)', 'Descartáveis', 'un', 0.38, 1350, 400, 'Descarpack');
    I('pvc', 'Filme PVC', 'Descartáveis', 'm', 0.18, 820, 200);
    I('toalha', 'Papel toalha (folha)', 'Descartáveis', 'folha', 0.05, 2400, 600);
    I('transfer', 'Papel transfer (stencil)', 'Descartáveis', 'un', 1.9, 140, 50, 'Spirit');
    I('gelstencil', 'Gel fixador de stencil', 'Descartáveis', 'ml', 0.32, 260, 100);
    I('vaselina', 'Vaselina sólida', 'Descartáveis', 'g', 0.05, 1500, 400);
    I('barreira', 'Barreira p/ máquina e clip cord', 'Biossegurança', 'un', 0.22, 600, 200);
    I('campo', 'Campo descartável', 'Biossegurança', 'un', 0.55, 380, 150);
    I('mascara', 'Máscara descartável', 'Biossegurança', 'un', 0.22, 290, 150);
    I('envelope', 'Envelope de esterilização (autoclave)', 'Biossegurança', 'un', 0.42, 160, 100);
    I('coletor', 'Coletor perfurocortante 7L', 'Biossegurança', 'un', 9.8, 4, 3, 'Descarpack');
    I('lixoinf', 'Saco de lixo infectante', 'Biossegurança', 'un', 0.9, 85, 50);
    I('alcool', 'Álcool 70% líquido', 'Higienização/Limpeza', 'ml', 0.018, 6200, 2000);
    I('clorex', 'Clorexidina 2% degermante', 'Higienização/Limpeza', 'ml', 0.05, 1800, 500);
    I('desinf', 'Desinfetante hospitalar (quaternário)', 'Higienização/Limpeza', 'ml', 0.028, 4200, 2000);
    I('enzim', 'Detergente enzimático', 'Higienização/Limpeza', 'ml', 0.07, 900, 500);
    I('sanit', 'Água sanitária', 'Higienização/Limpeza', 'ml', 0.004, 8000, 3000);
    I('soro', 'Soro fisiológico 0,9%', 'Pós-procedimento', 'ml', 0.012, 3500, 1000);
    I('pomada', 'Pomada cicatrizante (sachê p/ cliente)', 'Pós-procedimento', 'un', 1.35, 26, 40);
    I('filmecura', 'Película de curativo (Second Skin)', 'Pós-procedimento', 'cm', 0.09, 2600, 1000);
    I('cafe', 'Café em pó', 'Copa/Café', 'g', 0.048, 1800, 1000);
    I('acucar', 'Açúcar', 'Copa/Café', 'g', 0.006, 3000, 1000);
    I('copo', 'Copo descartável 50ml', 'Copa/Café', 'un', 0.05, 380, 200);
    I('agua', 'Galão de água 20L', 'Copa/Café', 'un', 13, 2, 2);

    // ---------- Serviços com kit de insumos ----------
    const K = arr => arr.map(([k, q]) => ({ insumoId: ins[k].id, qtd: q }));
    const c = Math.ceil; const kitTattoo = (mult, extra) => K([['luva', c(6 * mult)], ['pvc', c(1.5 * mult)], ['toalha', c(15 * mult)], ['vaselina', c(10 * mult)], ['transfer', 1], ['gelstencil', 5], ['batoque', c(3 * mult)], ['barreira', 2], ['campo', 1], ['mascara', 1], ['alcool', c(20 * mult)], ['desinf', 40], ['lixoinf', 1], ['filmecura', c(120 * mult)], ['pomada', 1], ...extra]);
    const kitPierc = ag => K([[ag, 1], ['luva', 4], ['clorex', 10], ['envelope', 1], ['campo', 1], ['mascara', 1], ['soro', 20], ['alcool', 10], ['desinf', 20]]);
    const S = {};
    const SV = (k, nome, tipo, precoBase, duracaoMin, kit) => S[k] = put('servicos', { nome, tipo, precoBase, duracaoMin, kit, ativo: true });
    SV('fine', 'Tattoo Fine Line (até 10cm)', 'tattoo', 380, 90, kitTattoo(1, [['c3rl', 2], ['tpreta', 5]]));
    SV('media', 'Tattoo Média P&B (10–20cm)', 'tattoo', 850, 180, kitTattoo(1.5, [['c7rl', 1], ['c9m', 2], ['tpreta', 12], ['diluente', 10]]));
    SV('color', 'Tattoo Colorida Média', 'tattoo', 1150, 240, kitTattoo(1.8, [['c7rl', 1], ['c9m', 2], ['c15m', 1], ['tpreta', 6], ['tcolor', 18], ['tbranca', 3]]));
    SV('sessao', 'Sessão / Diária (fechamento)', 'tattoo', 1900, 360, kitTattoo(3, [['c7rl', 2], ['c9m', 3], ['c15m', 3], ['tpreta', 30], ['diluente', 25]]));
    SV('retoque', 'Retoque', 'tattoo', 150, 60, kitTattoo(0.6, [['c3rl', 1], ['tpreta', 2]]));
    SV('lobulo', 'Piercing Lóbulo / Hélix', 'piercing', 90, 30, kitPierc('a16'));
    SV('nostril', 'Piercing Nostril', 'piercing', 120, 30, kitPierc('a18'));
    SV('septo', 'Piercing Septo', 'piercing', 150, 40, kitPierc('a14'));
    SV('umbigo', 'Piercing Umbigo', 'piercing', 150, 40, kitPierc('a14'));
    SV('lingua', 'Piercing Língua', 'piercing', 160, 40, kitPierc('a14'));
    SV('troca', 'Troca de joia', 'piercing', 30, 15, K([['luva', 2], ['clorex', 5], ['soro', 10]]));

    // ---------- Joias ----------
    const J = {};
    const JO = (k, nome, categoria, material, bitola, tamanho, custo, markup, qtd, minimo) => J[k] = put('joias', { nome, sku: 'JW-' + String(Object.keys(J).length + 101), categoria, material, bitola, tamanho, custo, markup, precoAuto: true, preco: Biz.precoPorMarkup(custo, markup), qtd, minimo, fornecedor: material.includes('Ouro') ? 'Ourives Parceiro' : 'Body Piercing Supply' });
    JO('labti', 'Labret Titânio ponto de luz', 'Labret', 'Titânio ASTM F136', '1,2mm', '8mm', 28, 180, 34, 10);
    JO('argti', 'Argola segmento Titânio', 'Argola/Segmento', 'Titânio ASTM F136', '1,2mm', '8mm', 35, 160, 18, 8);
    JO('nosti', 'Nostril Titânio zircônia', 'Nostril', 'Titânio ASTM F136', '0,8mm', '6mm', 22, 200, 25, 10);
    JO('clicker', 'Septum Clicker Aço', 'Septum/Clicker', 'Aço cirúrgico 316L', '1,2mm', '10mm', 30, 170, 6, 6);
    JO('barbti', 'Barbell reto Titânio (língua)', 'Barbell', 'Titânio ASTM F136', '1,6mm', '16mm', 30, 150, 12, 5);
    JO('banana', 'Banana Titânio com zircônia', 'Banana (umbigo)', 'Titânio ASTM F136', '1,6mm', '10mm', 40, 150, 9, 5);
    JO('labouro', 'Labret Ouro 18k', 'Labret', 'Ouro 18k', '1,2mm', '8mm', 320, 80, 4, 2);
    JO('argouro', 'Argola Ouro 18k clicker', 'Argola/Segmento', 'Ouro 18k', '1,0mm', '8mm', 290, 85, 3, 2);
    JO('industrial', 'Industrial Barbell Aço', 'Industrial', 'Aço cirúrgico 316L', '1,6mm', '38mm', 18, 180, 7, 4);
    JO('tragus', 'Labret Tragus Titânio flor', 'Tragus/Hélix', 'Titânio ASTM F136', '1,2mm', '6mm', 32, 170, 2, 5);
    JO('plug', 'Plug Silicone', 'Alargador/Plug', 'Silicone', '10mm', '—', 6, 300, 30, 10);
    JO('tunnel', 'Tunnel Aço', 'Tunnel', 'Aço cirúrgico 316L', '12mm', '—', 12, 250, 14, 6);

    // ---------- Clientes ----------
    const nomes = ['Ana Beatriz Rocha','Bruno Henrique Lima','Camila Ferreira','Daniel Oliveira','Eduarda Martins','Felipe Santos','Gabriela Nunes','Henrique Alves','Isabela Costa','João Pedro Ribeiro','Karina Teixeira','Lucas Mendes','Mariana Gomes','Natália Barros','Otávio Cardoso','Paula Azevedo','Rafael Pinto','Sabrina Lopes','Thiago Moraes','Vanessa Duarte','William Freitas','Yasmin Carvalho','Leonardo Batista','Juliana Monteiro','Gustavo Araújo','Larissa Campos','Matheus Vieira','Bianca Ramos'];
    const C = nomes.map((n, i) => put('clientes', {
      nome: n, telefone: `(11) 9${int(7000, 9999)}-${int(1000, 9999)}`, email: n.split(' ')[0].toLowerCase() + '@email.com',
      instagram: '@' + n.split(' ')[0].toLowerCase() + int(10, 99), nasc: `${int(1980, 2006)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
      cpf: '', cidade: 'São Paulo', origem: pick(['Instagram', 'Indicação', 'Google', 'Passou na frente', 'TikTok']), obs: '', criadoEm: addDays(now, -int(10, 190)).toISOString()
    }));

    // ---------- Esterilização: ciclos de autoclave (últimos 75 dias) ----------
    const lotesDia = {};
    for (let d = 75; d >= 0; d--) {
      const dia = addDays(now, -d); if (dia.getDay() === 0) continue;
      const ds = iso(dia), n = d === 0 ? 1 : (rnd() < 0.35 ? 2 : 1);
      for (let k = 1; k <= n; k++) {
        const bio = dia.getDay() === 1 ? (d <= 1 ? 'pendente' : 'negativo') : (d === 1 ? 'pendente' : 'nao');
        const v = addDays(dia, 30);
        const e = put('esterilizacoes', { data: ds, hora: k === 1 ? '08:' + String(int(10, 40)) : '14:' + String(int(10, 40)), equipamento: 'Autoclave Cristófoli Vitale 21L', ciclo: 1200 + (75 - d) * 2 + k, tipoCiclo: bio !== 'nao' ? 'Teste biológico semanal' : 'Rotina',
          temperatura: 134, pressao: round2(2.0 + rnd() * 0.2), tempo: 18, secagem: 20, itens: pick([['Pinças', 'Agulhas de piercing', 'Cânulas'], ['Pinças', 'Tubos / biqueiras', 'Grips'], ['Agulhas de piercing', 'Joias (1ª colocação)', 'Pinças']]),
          pacotes: int(4, 10), quimico: 'ok', biologico: bio, bioLeitura: bio === 'negativo' ? iso(addDays(dia, 2)) : '', responsavelId: pick([P.diego.id, P.carla.id]), validadeDias: 30, validade: iso(v), lote: `E${ds.replace(/-/g, '')}-${String(k).padStart(2, '0')}`, status: 'liberado' });
        (lotesDia[ds] ||= []).push(e.id);
      }
    }
    const loteDe = d => { for (let i = 0; i < 6; i++) { const x = iso(addDays(new Date(d + 'T12:00'), -i)); if (lotesDia[x]) return lotesDia[x][0]; } return ''; };

    // ---------- Histórico: 6 meses ----------
    const tattooers = [P.rafa, P.bia];
    const srvT = [S.fine, S.fine, S.media, S.media, S.color, S.sessao, S.retoque];
    const srvP = [S.lobulo, S.lobulo, S.nostril, S.septo, S.umbigo, S.lingua, S.troca];
    const joiaPor = { [S.lobulo.id]: [J.labti, J.argti, J.labouro, J.tragus], [S.nostril.id]: [J.nosti, J.argouro], [S.septo.id]: [J.clicker], [S.umbigo.id]: [J.banana], [S.lingua.id]: [J.barbti], [S.troca.id]: [J.labti, J.argti, J.nosti] };
    const L = (x) => put('lancamentos', x);
    const lancRec = (valor, categoria, descricao, data, forma, origem) => {
      L({ tipo: 'receita', categoria, descricao, valor, data, status: 'pago', pagoEm: data, forma, origem });
      const tx = DEFAULT_CONFIG.taxas[forma] || 0;
      if (tx) L({ tipo: 'despesa', categoria: 'Taxas de cartão', descricao: `Taxa ${forma} (${tx}%) — ${descricao}`, valor: round2(valor * tx / 100), data, status: 'pago', pagoEm: data, forma, origem });
    };
    const fixas = [
      ['Aluguel', 'Aluguel do estúdio', 4200, 5], ['Condomínio/IPTU', 'Condomínio + IPTU', 680, 10], ['Energia elétrica', 'Conta de luz (Enel)', 0, 12], ['Água', 'Conta de água (Sabesp)', 0, 15],
      ['Internet/Telefone', 'Internet fibra + telefone', 189.9, 20], ['Salários e encargos', 'Salário + encargos — Carla (recepção)', 2480, 5], ['Limpeza e conservação', 'Diarista — Marta (limpeza)', 1200, 5],
      ['Contabilidade', 'Honorários contábeis', 450, 10], ['Software/Assinaturas', 'Assinaturas (Canva, Adobe, agenda)', 210, 8], ['Marketing/Anúncios', 'Anúncios Instagram/Meta', 0, 25],
      ['Coleta de resíduos', 'Coleta de resíduos infectantes', 160, 18], ['Pró-labore', 'Pró-labore sócio', 4000, 5]
    ];
    for (let m = 5; m >= 0; m--) {
      const base = new Date(now.getFullYear(), now.getMonth() - m, 1, 12);
      const ym = iso(base).slice(0, 7);
      const diasMes = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
      const limite = m === 0 ? now.getDate() - 1 : diasMes;
      let receitaMes = 0;
      // atendimentos
      const frac = m === 0 ? Math.max(0, (now.getDate() - 1) / diasMes) : 1;
      const nT = Math.round(int(40, 50) * frac), nP = Math.round(int(36, 48) * frac);
      const gerar = (n, lista, quem) => {
        for (let i = 0; i < n; i++) {
          if (limite < 1) break;
          const d = `${ym}-${String(int(1, limite)).padStart(2, '0')}`;
          const srv = pick(lista), prof = typeof quem === 'function' ? quem() : quem, cli = pick(C);
          const valor = srv.tipo === 'tattoo' ? Math.round(srv.precoBase * (0.95 + rnd() * 0.6) / 10) * 10 : srv.precoBase;
          const desconto = rnd() < 0.15 ? Math.round(valor * 0.1) : 0;
          const forma = pick(['PIX', 'PIX', 'PIX', 'Crédito à vista', 'Crédito parcelado', 'Débito', 'Dinheiro']);
          const kit = srv.kit.map(k => ({ insumoId: k.insumoId, qtd: k.qtd, custoUnit: o.insumos[k.insumoId].custoUnit }));
          const jop = joiaPor[srv.id]; const joias = [];
          if (jop) { const jj = pick(jop); joias.push({ joiaId: jj.id, qtd: 1, preco: jj.preco, custo: jj.custo }); }
          const at = put('atendimentos', {
            data: d, hora: pick(['10:00', '11:00', '13:00', '14:30', '16:00', '18:00']), clienteId: cli.id, profissionalId: prof.id, servicoId: srv.id, tipo: srv.tipo,
            descricao: srv.tipo === 'tattoo' ? pick(['Rosa fine line', 'Leão realista', 'Frase no antebraço', 'Mandala', 'Borboleta', 'Retrato', 'Geométrico', 'Old school andorinha', 'Fechamento de braço']) : srv.nome,
            regiao: srv.tipo === 'tattoo' ? pick(['Antebraço', 'Braço', 'Costela', 'Costas', 'Panturrilha', 'Coxa', 'Nuca', 'Pulso']) : pick(['Orelha', 'Nariz', 'Umbigo', 'Língua']),
            valor, desconto, sinal: 0, valorLiquido: valor - desconto, forma, insumos: kit,
            custoInsumos: round2(kit.reduce((s, k) => s + k.qtd * k.custoUnit, 0)), joias, totalJoias: joias.reduce((s, j) => s + j.preco, 0), custoJoias: joias.reduce((s, j) => s + j.custo, 0),
            comissaoPct: prof.comissaoPct, comissaoValor: round2((valor - desconto) * prof.comissaoPct / 100),
            loteEsterilizacao: srv.tipo === 'piercing' || rnd() < 0.4 ? loteDe(d) : ''
          });
          const desc = `${srv.nome} — ${cli.nome}`, ref = 'atendimento:' + at.id;
          lancRec(at.valorLiquido, srv.tipo === 'piercing' ? 'Piercing' : 'Tatuagem', desc, d, forma, ref);
          if (at.totalJoias) lancRec(at.totalJoias, 'Venda de joias', 'Joia aplicada — ' + desc, d, forma, ref);
          receitaMes += at.valorLiquido + at.totalJoias;
          const venc = (() => { const x = new Date(d + 'T12:00'); x.setMonth(x.getMonth() + 1); x.setDate(5); return iso(x); })();
          L({ tipo: 'despesa', categoria: 'Comissões', descricao: `Comissão ${prof.nome} (${prof.comissaoPct}%) — ${desc}`, valor: at.comissaoValor, data: d, vencimento: venc, status: m === 0 ? 'pendente' : 'pago', pagoEm: m === 0 ? null : venc, origem: ref, profissionalId: prof.id });
          if (m <= 1) for (const k of kit) put('movEstoque', { tipo: 'insumo', itemId: k.insumoId, nome: o.insumos[k.insumoId].nome, mov: 'saida', qtd: k.qtd, custoUnit: k.custoUnit, motivo: 'Uso em atendimento', ref, data: d });
        }
      };
      gerar(nT, srvT, () => pick(tattooers));
      gerar(nP, srvP, P.diego);
      // vendas balcão
      const nV = Math.round(int(16, 24) * (m === 0 ? Math.max(0, (now.getDate() - 1) / diasMes) : 1));
      for (let i = 0; i < nV && limite >= 1; i++) {
        const d = `${ym}-${String(int(1, limite)).padStart(2, '0')}`;
        const jj = pick(Object.values(J)); const q = rnd() < 0.2 ? 2 : 1; const forma = pick(['PIX', 'Crédito à vista', 'Débito', 'Dinheiro']);
        const v = put('vendas', { data: d, clienteId: pick(C).id, itens: [{ joiaId: jj.id, nome: jj.nome, qtd: q, preco: jj.preco, custo: jj.custo }], subtotal: jj.preco * q, desconto: 0, total: round2(jj.preco * q), custoTotal: round2(jj.custo * q), forma, profissionalId: P.diego.id });
        lancRec(v.total, 'Venda de joias', `Venda PDV #${v.id.slice(-5).toUpperCase()}`, d, forma, 'venda:' + v.id);
        receitaMes += v.total;
      }
      // despesas fixas
      fixas.forEach(([cat, desc, val, dia], idx) => {
        let v = val;
        if (cat === 'Energia elétrica') v = round2(780 + rnd() * 260);
        if (cat === 'Água') v = round2(140 + rnd() * 60);
        if (cat === 'Marketing/Anúncios') v = round2(500 + rnd() * 400);
        const data = `${ym}-${String(dia).padStart(2, '0')}`;
        const pago = m > 0 || dia < now.getDate();
        L({ tipo: 'despesa', categoria: cat, descricao: desc, valor: v, data, vencimento: data, status: pago ? 'pago' : 'pendente', pagoEm: pago ? data : null, forma: 'PIX', recorrente: true, recorrenteId: 'rec-' + idx });
      });
      // compras de estoque e café
      L({ tipo: 'despesa', categoria: 'Compra de insumos', descricao: 'Reposição de cartuchos e descartáveis', valor: round2(900 + rnd() * 700), data: `${ym}-08`, status: 'pago', pagoEm: `${ym}-08`, forma: 'PIX' });
      if (m % 2 === 0) L({ tipo: 'despesa', categoria: 'Compra de joias (estoque)', descricao: 'Reposição de joias titânio', valor: round2(700 + rnd() * 900), data: `${ym}-14`, status: 'pago', pagoEm: `${ym}-14`, forma: 'PIX' });
      L({ tipo: 'despesa', categoria: 'Copa/Café', descricao: 'Café, açúcar, água e copos', valor: round2(140 + rnd() * 60), data: `${ym}-03`, status: 'pago', pagoEm: `${ym}-03`, forma: 'Débito' });
      if (m % 3 === 1) L({ tipo: 'despesa', categoria: 'Manutenção de equipamentos', descricao: 'Manutenção autoclave / máquinas', valor: round2(250 + rnd() * 300), data: `${ym}-22`, status: 'pago', pagoEm: `${ym}-22`, forma: 'PIX' });
      // consumo interno (limpeza do estúdio e café)
      [['desinf', 1800], ['sanit', 3000], ['alcool', 1500], ['cafe', 1500], ['acucar', 1200], ['copo', 260]].forEach(([k, q]) => {
        if (m === 0 && now.getDate() < 3) return;
        put('movEstoque', { tipo: 'insumo', itemId: ins[k].id, nome: ins[k].nome, mov: 'saida', qtd: m === 0 ? Math.round(q * now.getDate() / 30) : q, custoUnit: ins[k].custoUnit, motivo: 'Consumo interno', ref: '', data: `${ym}-${String(Math.min(limite || 1, 28)).padStart(2, '0')}` });
      });
      // imposto do Simples sobre o faturamento do mês anterior
      if (m < 5) L({ tipo: 'despesa', categoria: 'Impostos (DAS/Simples)', descricao: 'DAS — Simples Nacional', valor: round2(receitaMes * 0.06), data: `${ym}-20`, vencimento: `${ym}-20`, status: (m > 0 || now.getDate() > 20) ? 'pago' : 'pendente', forma: 'PIX' });
    }

    // ---------- Agenda: semana atual e próxima ----------
    const st = ['confirmado', 'confirmado', 'agendado', 'agendado'];
    for (let d = -1; d <= 12; d++) {
      const dia = addDays(now, d); if (dia.getDay() === 0) continue;
      const qt = int(2, 5);
      const usados = new Set();
      for (let i = 0; i < qt; i++) {
        const tipoT = rnd() < 0.6; const prof = tipoT ? pick(tattooers) : P.diego; const srv = pick(tipoT ? srvT : srvP);
        let h = int(10, 19); const key = prof.id + h; if (usados.has(key)) continue; usados.add(key);
        const cli = pick(C);
        const valor = srv.tipo === 'tattoo' ? Math.round(srv.precoBase / 10) * 10 : srv.precoBase;
        put('agendamentos', {
          data: iso(dia), hora: `${String(h).padStart(2, '0')}:${pick(['00', '30'])}`, duracaoMin: Math.min(srv.duracaoMin, 240), clienteId: cli.id, profissionalId: prof.id, servicoId: srv.id,
          valorPrevisto: valor, sinal: srv.tipo === 'tattoo' ? Math.round(valor * 0.3 / 10) * 10 : 0, sinalPago: srv.tipo === 'tattoo' && rnd() < 0.7,
          status: d < 0 ? 'concluido' : pick(st), obs: srv.tipo === 'tattoo' ? pick(['Trazer referência', 'Arte já aprovada', 'Cliente quer ver o desenho antes', '']) : ''
        });
      }
    }

    // ---------- Projetos (várias sessões) ----------
    const sessoes = Object.values(o.atendimentos).filter(a => a.servicoId === S.sessao.id).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3);
    sessoes.forEach((a, k) => {
      const tot = [4, 3, 5][k], prj = put('projetos', { titulo: ['Fechamento de braço botânico', 'Costas — dragão oriental', 'Perna — floresta em blackwork'][k], clienteId: a.clienteId, profissionalId: a.profissionalId, servicoId: S.sessao.id, regiao: ['Braço', 'Costas', 'Panturrilha'][k], estilo: ['Botânico', 'Oriental', 'Blackwork'][k], sessoesPrevistas: tot, valorTotal: Math.round(a.valorLiquido * tot / 100) * 100, status: 'andamento' });
      a.projetoId = prj.id;
      put('agendamentos', { data: iso(addDays(now, 3 + k * 4)), hora: '10:00', duracaoMin: 300, clienteId: a.clienteId, profissionalId: a.profissionalId, servicoId: S.sessao.id, projetoId: prj.id, valorPrevisto: Math.round(prj.valorTotal / tot), sinal: 300, sinalPct: 0, sinalPago: true, status: 'confirmado', obs: `${prj.titulo} — sessão 2/${tot}`, sinalLancado: true });
      lancRec(300, 'Sinal/Adiantamento', `Sinal — ${o.clientes[a.clienteId].nome}`, iso(addDays(now, -2)), 'PIX', 'sinal:' + Object.values(o.agendamentos).slice(-1)[0].id);
    });

    // ---------- Orçamentos ----------
    const orcs = [['Rosa fine line com nome', 'Fine line', 'Antebraço', 8, false, 1, 380, 'enviado', -2, P.bia], ['Leão realista', 'Realismo', 'Braço', 22, false, 2, 2400, 'enviado', -5, P.rafa], ['Mandala no ombro', 'Geométrico', 'Ombro', 15, false, 1, 950, 'aprovado', -12, P.rafa],
      ['Borboletas aquarela', 'Aquarela', 'Costela', 18, true, 1, 1300, 'enviado', -1, P.bia], ['Fechamento de costas', 'Oriental', 'Costas', 50, true, 6, 9800, 'enviado', -8, P.rafa], ['Lettering na clavícula', 'Lettering', 'Clavícula', 12, false, 1, 450, 'recusado', -20, P.bia],
      ['Ramo de oliveira', 'Botânico', 'Pulso', 7, false, 1, 350, 'aprovado', -4, P.bia], ['Cover-up de tribal', 'Cobertura (cover-up)', 'Panturrilha', 20, false, 2, 1800, 'enviado', -25, P.rafa], ['Old school andorinhas', 'Old school', 'Peito', 16, true, 1, 1100, 'aprovado', -30, P.rafa]];
    orcs.forEach(([descricao, estilo, regiao, tamanho, colorida, sess, valor, status, dd, prof], k) => put('orcamentos', { numero: k + 1, data: iso(addDays(now, dd)), clienteId: pick(C).id, profissionalId: prof.id, servicoId: valor > 1500 ? S.sessao.id : valor > 900 ? S.media.id : S.fine.id, descricao, estilo, regiao, tamanho, colorida, sessoes: sess, horasSessao: sess > 1 ? 5 : '', valorTotal: valor, sinalPct: 30, validadeDias: 15, status, aprovadoEm: status === 'aprovado' ? iso(addDays(now, dd + 1)) : '', obs: 'Valor inclui um retoque gratuito em até 40 dias.' }));

    // ---------- Anamneses ----------
    const respostasBase = () => { const r = {}; ANAMNESE_PERGUNTAS.forEach(q => r[q.id] = 'nao'); return r; };
    [[C[0], 'tattoo', { alergia: 'sim' }, { alergia: 'Alergia a níquel' }, 'revisada', -20],
     [C[3], 'piercing', {}, {}, 'revisada', -9],
     [C[6], 'tattoo', { pressao: 'sim', medicamentos: 'sim' }, { pressao: 'Pressão alta controlada', medicamentos: 'Losartana 50mg' }, 'nova', 0],
     [C[11], 'piercing', { primeira: 'sim' }, {}, 'nova', 0]].forEach(([c, tipo, sim, det, status, dd]) => {
      const r = { ...respostasBase(), ...sim };
      put('anamneses', { clienteId: c.id, nome: c.nome, cpf: '', nasc: c.nasc, telefone: c.telefone, email: c.email, tipoProcedimento: tipo, regiao: tipo === 'tattoo' ? 'Antebraço' : 'Orelha', respostas: r, detalhes: det, contatoEmergencia: 'Mãe — (11) 97777-0000', aceiteTermos: true, aceiteLGPD: true, autorizaImagem: true, assinatura: '', status, criadoEm: addDays(now, dd).toISOString() });
    });

    o.config = { ...DEFAULT_CONFIG, atualizadoPeloUsuario: true };
    return o;
  }
};
