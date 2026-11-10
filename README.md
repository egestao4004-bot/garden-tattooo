# GARDEN TATTOO — Sistema de Gestão para Estúdio de Tatuagem & Piercing

Sistema web completo para rodar todo o operacional de um estúdio de tattoo e piercing: agenda, clientes, fichas de anamnese online com assinatura, atendimentos com baixa automática de insumos, estoque de insumos e joias, PDV, financeiro, comissões e DRE.

Hospedagem: **GitHub Pages** (gratuito) + **Firebase** (Auth + Firestore, plano gratuito Spark atende um estúdio com folga).

*Desenvolvido por Evander*

---

## Módulos

| Módulo | O que faz |
|---|---|
| **Painel** | Faturamento, lucro líquido, meta do mês, gráfico 6 meses, agenda do dia, alertas (estoque baixo, contas vencendo, fichas novas), ranking da equipe, aniversariantes com botão de WhatsApp |
| **Agenda** | Visão semana/dia por profissional (cores), detecção de conflito de horário, sinal/adiantamento (entra no caixa), confirmação por WhatsApp, botão "Iniciar atendimento" |
| **Atendimentos** | Registro de tattoo/piercing com o kit de insumos do serviço (editável), joias aplicadas, desconto, sinal abatido, forma de pagamento. Calcula na hora: custo de insumos, comissão, taxa da maquininha e **lucro do estúdio** |
| **PDV** | Venda de joias no balcão, carrinho, desconto, lucro da venda, recibo para imprimir, estorno |
| **Clientes** | Cadastro, histórico completo, total gasto, ficha de anamnese, próximos horários, exportação CSV |
| **Fichas de Anamnese** | Link público (`anamnese.html`) que o cliente preenche no celular, com questionário de saúde, termo de consentimento, LGPD, autorização de imagem e **assinatura na tela**. Chega no sistema em tempo real, destaca riscos (alergia, anticoagulante, Roacutan, gestante, menor de idade...) e permite vincular ou criar o cliente |
| **Insumos** | Da agulha ao desinfetante e ao café: unidade de controle (un, ml, g, m, folha...), custo unitário com calculadora de embalagem, custo médio ponderado, mínimo, lote e validade, entrada/saída/ajuste de inventário, **baixa de consumo interno** (café, limpeza), lista de compras automática pelo WhatsApp |
| **Joias** | Custo, **markup %, margem de lucro %**, preço automático ou manual, reajuste em massa por material/tipo, valor do estoque a custo e a venda |
| **Movimentações** | Histórico de tudo que entrou/saiu + consumo do mês por insumo e categoria |
| **Contas & Caixa** | Receitas e despesas por competência, contas a pagar/receber (atrasadas, hoje, próximas), despesas fixas recorrentes (aluguel, luz, salários...), cálculo do DAS do Simples, fluxo de caixa diário |
| **DRE & Relatórios** | DRE gerencial com comparativo mensal, margem de contribuição, **ponto de equilíbrio**, 12 meses, lucro por serviço, por joia e por material, regiões mais tatuadas, origem dos clientes, clientes sumidos para reativar |
| **Equipe & Comissões** | Tatuadores, piercers, recepção, limpeza; vínculo (comissionado, CLT, diarista, MEI); comissão por profissional, extrato, pagamento das comissões, lançamento da folha do mês |
| **Serviços & Kits** | Cada serviço tem um kit de insumos. O sistema mostra custo do kit, comissão média e lucro estimado por procedimento |
| **Orçamentos & Projetos** | Orçamento com estilo, região, tamanho, cor, sessões, valor, sinal e validade; referências do cliente em foto; envio pronto pelo WhatsApp; proposta para imprimir/PDF; taxa de conversão. Ao aprovar, cria o **projeto de várias sessões** e abre o agendamento com o sinal. Cada projeto mostra sessões feitas, valor pago, saldo e próxima sessão |
| **Esterilização** | Livro de registro da autoclave: ciclo, temperatura, pressão, tempo, itens, pacotes, indicador químico e biológico (com leitura posterior), validade do lote e foto do indicador. O lote é informado no atendimento — se um indicador falhar, o sistema lista todos os clientes atendidos com aquele lote (rastreabilidade para a vigilância sanitária). Exporta CSV |
| **Portfólio & Fotos** | Fotos de antes/depois/cicatrizado no atendimento, evolução do projeto, referências do orçamento, portfólio por artista. Sem custo de Storage (ver abaixo) |
| **Usuários & Acessos** | Perfis **Administrador**, **Recepção** e **Tatuador/Piercer**. O admin cria os logins dentro do sistema. O tatuador vê só a própria agenda, atendimentos, orçamentos e comissões; não vê lucro, DRE, salários nem configurações |
| **Configurações** | Dados do estúdio, horário, meta, taxas por forma de pagamento, alíquota do Simples, backup/restauração em JSON |

### Como o dinheiro é calculado (DRE)

```
Receita bruta (serviços + joias + sinais)
(−) taxas de cartão (automáticas pela forma de pagamento) e impostos (DAS)
= Receita líquida
(−) insumos consumidos nos atendimentos  (custo real do kit usado)
(−) custo das joias vendidas
(−) comissões
= Margem de contribuição
(−) despesas operacionais (aluguel, luz, salários, limpeza, marketing,
    consumo interno de café/limpeza...)
= LUCRO LÍQUIDO
```

Compras de estoque **não** entram como despesa na DRE (só no caixa): o custo aparece quando o item é consumido ou vendido. Assim o lucro do mês fica correto mesmo quando se compra uma caixa grande de cartuchos.

---

## Testar agora (modo demonstração)

Abra `index.html` pelo navegador (ou publique no GitHub Pages sem configurar nada). Sem Firebase configurado o sistema entra em **modo demonstração**, com 6 meses de dados de exemplo salvos no próprio navegador. Em *Configurações* dá para recarregar os exemplos ou começar do zero.

> Para testar a ficha de anamnese em modo demo, abra `anamnese.html` no **mesmo navegador**: a ficha enviada aparece no sistema.

---

## Colocar online (GitHub Pages + Firebase)

### 1. Firebase
1. Acesse <https://console.firebase.google.com> → **Adicionar projeto** (pode desativar o Analytics).
2. **Build → Authentication → Começar → E-mail/senha → Ativar.**
3. Em **Authentication → Usuários → Adicionar usuário**, crie o login de cada pessoa da equipe (e-mail + senha).
4. **Build → Firestore Database → Criar banco** → modo de produção → local `southamerica-east1 (São Paulo)`.
5. Em **Firestore → Regras**, apague tudo, cole o conteúdo do arquivo `firestore.rules` e clique **Publicar**.
6. Libere **o primeiro administrador**: em **Firestore → Dados → Iniciar coleção** com o ID `acessos`.
   - ID do documento = **UID** do usuário (copie da tela de Authentication)
   - Campos: `nome` (string), `papel` (string) = `admin`
   - Os demais usuários o admin cria pela tela **Usuários & Acessos** do próprio sistema (perfis `admin`, `recepcao` ou `artista` + vínculo ao cadastro da equipe). Quem fizer login sem estar liberado vê a tela "Acesso não liberado" com o UID.
7. **Configurações do projeto (engrenagem) → Seus apps → Web (`</>`)** → registre o app e copie o objeto `firebaseConfig`.
8. Cole os valores no arquivo `js/firebase-config.js`.

### 2. GitHub Pages
1. Crie um repositório no GitHub (ex.: `studio-gestao`) e envie todos os arquivos desta pasta.
2. **Settings → Pages → Source: Deploy from a branch → Branch: `main` / root → Save.**
3. Em 1–2 minutos o sistema estará em `https://SEU-USUARIO.github.io/studio-gestao/`.
4. No Firebase: **Authentication → Configurações → Domínios autorizados → Adicionar** `SEU-USUARIO.github.io`.

### Fotos sem pagar armazenamento
O Firebase Storage exige o plano pago (Blaze). Por isso o sistema **não usa o Storage**: cada foto é redimensionada e comprimida no navegador (~150 KB, JPEG 1280px) e salva como documento na coleção `fotos` do Firestore, que no plano gratuito oferece 1 GB (≈ 6–7 mil fotos) e 50 mil leituras/dia. As fotos são carregadas só quando a tela precisa delas. No modo demonstração ficam no IndexedDB do navegador.

### 3. Primeiro uso
1. Entre com um usuário `admin`.
2. **Configurações**: nome do estúdio, taxas da maquininha, alíquota do Simples, meta. Clique em *Salvar* (isso também publica o nome do estúdio no cabeçalho da ficha de anamnese).
3. Cadastre a **Equipe**, os **Insumos**, as **Joias** e os **Serviços** (com o kit de insumos de cada um).
4. Cadastre as despesas fixas em **Contas & Caixa** marcando "fixa mensal"; nos meses seguintes use **Gerar fixas do mês**.
5. Envie o link da ficha (`.../anamnese.html`) aos clientes ou coloque na bio do Instagram.

> Para migrar os dados de teste do modo demo para o Firebase: no modo demo, *Configurações → Exportar backup*; depois de configurado o Firebase, *Importar backup*.

---

## Segurança e LGPD

- A ficha de anamnese contém **dados de saúde (dados sensíveis pela LGPD)**. As regras do Firestore só permitem que o público **crie** fichas; ninguém sem login liberado na coleção `acessos` consegue ler nada.
- Os usuários são liberados apenas pelo administrador. Mesmo que alguém crie uma conta pela API, não acessa dados sem estar em `acessos`.
- As permissões por perfil valem na tela **e** nas regras do Firestore: tatuadores não conseguem ler o financeiro (`lancamentos`) nem alterar equipe, serviços e configurações, mesmo acessando o banco diretamente.
- O termo da ficha registra o consentimento do cliente (LGPD) e a autorização de uso de imagem separadamente.
- Faça backup (JSON) periodicamente em *Configurações*.
- Recomendado: em **Firebase → App Check**, ativar reCAPTCHA para reduzir spam no formulário público.

## Estrutura

```
index.html            sistema (login + painel)
anamnese.html         ficha pública para o cliente
firestore.rules       regras de segurança do banco
css/style.css         visual
js/firebase-config.js credenciais do Firebase (preencher)
js/db.js              camada de dados (Firestore / localStorage) e regras de negócio
js/seed.js            dados de demonstração
js/ui.js              componentes, gráficos, utilitários
js/app.js             rotas, menu, login
js/views-*.js         telas (views-extra.js: fotos, esterilização, orçamentos, portfólio, usuários)
```

Sem build, sem dependências: HTML + CSS + JavaScript puro e o SDK do Firebase via CDN.
