/**
 * ═══════════════════════════════════════════════════════════
 * TOP PRIME — Sistema de Propostas  |  app.js
 *
 * Como adicionar o logo de uma nova operadora:
 *   1. Coloque o arquivo PNG na pasta /img/
 *   2. O nome do arquivo deve ser o nome da operadora
 *      em minúsculas, sem acento, espaços viram hífen.
 *      Ex: "Select Saúde"  → img/logo-select-saude.png
 *          "Bradesco Saúde"→ img/logo-bradesco-saude.png
 *          "Unimed"        → img/logo-unimed.png
 *   3. Só isso. Não precisa mexer em nenhum código.
 *
 * Como funciona o PDF:
 *   Abre nova aba com HTML + CSS inline + imagens em base64
 *   e chama window.print(). O vendedor salva como PDF.
 * ═══════════════════════════════════════════════════════════
 */

/* ─────────────────────────────────────────────────────────
   ESTADO
───────────────────────────────────────────────────────── */
var linhasPlano        = 0;
var historicoPropostas = [];

/* ─────────────────────────────────────────────────────────
   INICIALIZAÇÃO
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  preencherDatasIniciais();
  adicionarLinhaPlano();
  vincularEventos();
  iniciarNavegacao();
});

/* ─────────────────────────────────────────────────────────
   CONVERTER NOME DE OPERADORA → NOME DO ARQUIVO
   Ex: "Select Saúde" → "img/logo-select-saude.png"
───────────────────────────────────────────────────────── */
function nomeParaArquivo(nome) {
  var slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[^a-z0-9\s]/g, '')       // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-');             // espaços → hífen
  return 'img/logo-' + slug + '.png';
}

/* ─────────────────────────────────────────────────────────
   BUSCAR IMAGEM E CONVERTER PARA BASE64
   Usa fetch() para buscar a imagem do servidor.
   Retorna Promise com data URL ou string vazia se não achar.
───────────────────────────────────────────────────────── */
function buscarImagemBase64(caminho) {
  return fetch(caminho)
    .then(function (res) {
      if (!res.ok) throw new Error('not found');
      return res.blob();
    })
    .then(function (blob) {
      return new Promise(function (resolve) {
        var reader    = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = function () { resolve(''); };
        reader.readAsDataURL(blob);
      });
    })
    .catch(function () { return ''; });
}

/* ─────────────────────────────────────────────────────────
   DATAS
───────────────────────────────────────────────────────── */
function preencherDatasIniciais() {
  var hoje     = new Date();
  var vigencia = new Date();
  vigencia.setDate(vigencia.getDate() + 30);
  document.getElementById('data-proposta').value = dataParaInput(hoje);
  document.getElementById('data-vigencia').value  = dataParaInput(vigencia);
}

function dataParaInput(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function dataParaExibicao(s) {
  if (!s) return '—';
  var p = s.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

/* ─────────────────────────────────────────────────────────
   VINCULAR EVENTOS
───────────────────────────────────────────────────────── */
function vincularEventos() {
  document.getElementById('btn-add-plano')
    .addEventListener('click', adicionarLinhaPlano);

  document.getElementById('btn-gerar-pdf')
    .addEventListener('click', gerarPDF);
  document.getElementById('btn-gerar-pdf-bottom')
    .addEventListener('click', gerarPDF);

  document.getElementById('btn-limpar')
    .addEventListener('click', limparFormulario);

  document.getElementById('operadora')
    .addEventListener('change', aoMudarOperadora);
}

/* ─────────────────────────────────────────────────────────
   PREVIEW DO LOGO DA OPERADORA NO FORMULÁRIO
   Tenta carregar a imagem pelo nome do arquivo padrão.
───────────────────────────────────────────────────────── */
function aoMudarOperadora() {
  var valor       = document.getElementById('operadora').value;
  var grupoCustom = document.getElementById('grupo-operadora-custom');
  var grupoLogo   = document.getElementById('grupo-logo-preview');
  var imgPreview  = document.getElementById('op-logo-preview-img');

  grupoCustom.style.display = (valor === 'Outro') ? 'block' : 'none';

  if (!valor || valor === 'Outro') {
    grupoLogo.style.display = 'none';
    return;
  }

  /* Tenta carregar a imagem pelo nome padronizado */
  var caminho = nomeParaArquivo(valor);
  imgPreview.onerror = function () {
    grupoLogo.style.display = 'none';
  };
  imgPreview.onload = function () {
    grupoLogo.style.display = 'block';
  };
  imgPreview.src = caminho;
}

/* ─────────────────────────────────────────────────────────
   GERENCIAR LINHAS DE PRODUTOS
───────────────────────────────────────────────────────── */
function adicionarLinhaPlano() {
  linhasPlano++;
  var id    = linhasPlano;
  var tbody = document.getElementById('planos-tbody');

  var vazia = tbody.querySelector('.empty-row');
  if (vazia) vazia.remove();

  var tr        = document.createElement('tr');
  tr.id         = 'linha-plano-' + id;
  tr.dataset.id = String(id);

  tr.innerHTML =
    '<td><input type="text" class="input-produto" placeholder="Ex: Plano Master"></td>' +
    '<td><input type="number" class="input-vidas" value="1" min="1" style="width:58px"></td>' +
    '<td>' +
      '<select class="input-acomodacao">' +
        '<option>Apartamento</option>' +
        '<option>Enfermaria</option>' +
      '</select>' +
    '</td>' +
    '<td>' +
      '<select class="input-modalidade">' +
        '<option>Sem Coparticipação</option>' +
        '<option>Com Coparticipação</option>' +
        '<option>Coparticipação Parcial</option>' +
      '</select>' +
    '</td>' +
    '<td><input type="text" class="input-valor" placeholder="R$ 0,00" oninput="formatarMoeda(this)"></td>' +
    '<td><button class="btn-del-row" onclick="removerLinha(' + id + ')" title="Remover">×</button></td>';

  tbody.appendChild(tr);
}

function removerLinha(id) {
  var linha = document.getElementById('linha-plano-' + id);
  if (linha) linha.remove();
  var tbody = document.getElementById('planos-tbody');
  if (!tbody.querySelector('tr:not(.empty-row)')) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Nenhum produto. Clique em "+ Adicionar Produto".</td></tr>';
  }
}

/* ─────────────────────────────────────────────────────────
   FORMATAR MOEDA
───────────────────────────────────────────────────────── */
function formatarMoeda(input) {
  var nums = input.value.replace(/\D/g, '');
  if (!nums) { input.value = ''; return; }
  input.value = 'R$ ' + (parseInt(nums, 10) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

/* ─────────────────────────────────────────────────────────
   COLETAR DADOS DO FORMULÁRIO
───────────────────────────────────────────────────────── */
function coletarDados() {
  var selectOp  = document.getElementById('operadora');
  var operadora = selectOp.value === 'Outro'
    ? document.getElementById('operadora-custom').value.trim()
    : selectOp.value;

  var dados = {
    tipoPlano:    document.getElementById('tipo-plano').value,
    operadora:    operadora,
    dataProposta: document.getElementById('data-proposta').value,
    dataVigencia: document.getElementById('data-vigencia').value,
    responsavel:  document.getElementById('responsavel').value.trim(),
    nomeEmpresa:  document.getElementById('nome-empresa').value.trim(),
    observacoes:  document.getElementById('observacoes').value.trim(),
    produtos:     lerProdutos(),
    geradoEm:     new Date().toLocaleString('pt-BR'),
  };

  if (!dados.tipoPlano)       { mostrarToast('Selecione o tipo de plano.',      true); return null; }
  if (!dados.operadora)       { mostrarToast('Selecione a operadora.',           true); return null; }
  if (!dados.nomeEmpresa)     { mostrarToast('Informe o nome do contratante.',   true); return null; }
  if (!dados.responsavel)     { mostrarToast('Informe o responsável.',           true); return null; }
  if (!dados.produtos.length) { mostrarToast('Adicione pelo menos um produto.', true); return null; }

  return dados;
}

function lerProdutos() {
  var linhas = document.querySelectorAll('#planos-tbody tr:not(.empty-row)');
  var lista  = [];
  linhas.forEach(function (tr) {
    lista.push({
      produto:    val(tr, '.input-produto'),
      vidas:      val(tr, '.input-vidas') || '1',
      acomodacao: val(tr, '.input-acomodacao'),
      modalidade: val(tr, '.input-modalidade'),
      valor:      val(tr, '.input-valor'),
    });
  });
  return lista;
}

function val(el, sel) {
  var found = el.querySelector(sel);
  return found ? found.value.trim() : '—';
}

/* ─────────────────────────────────────────────────────────
   GERAR PDF
   1. Coleta dados e valida
   2. Busca as imagens via fetch (converte para base64)
   3. Monta o HTML completo da proposta
   4. Abre em nova aba e dispara window.print()
───────────────────────────────────────────────────────── */
function gerarPDF() {
  var dados = coletarDados();
  if (!dados) return;

  mostrarToast('Carregando imagens...');

  var caminhoOP = nomeParaArquivo(dados.operadora);

  Promise.all([
    buscarImagemBase64('img/logo-topprime.png'),
    buscarImagemBase64(caminhoOP),
  ]).then(function (resultados) {
    var b64TopPrime  = resultados[0];
    var b64Operadora = resultados[1];

    mostrarToast('Gerando proposta...');

    /* Salva no servidor (persistente) */
    salvarPropostaNoServidor(dados);

    var html = montarHTMLProposta(dados, b64TopPrime, b64Operadora);

    var janela = window.open('', '_blank');
    if (!janela) {
      mostrarToast('Permita pop-ups para gerar o PDF.', true);
      return;
    }

    janela.document.write(html);
    janela.document.close();

    mostrarToast('Proposta aberta! Salve como PDF.');
  });
}

/* ─────────────────────────────────────────────────────────
   SALVAR PROPOSTA NO SERVIDOR
   POST /api/propostas → servidor grava em propostas.json
───────────────────────────────────────────────────────── */
function salvarPropostaNoServidor(dados) {
  fetch('/api/propostas', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(dados),
  })
  .then(function (res) { return res.json(); })
  .then(function (json) {
    if (json.ok) carregarHistorico();
  })
  .catch(function (err) {
    console.warn('Não foi possível salvar no servidor:', err);
  });
}

/* ─────────────────────────────────────────────────────────
   MONTAR HTML COMPLETO DA PROPOSTA
───────────────────────────────────────────────────────── */
function montarHTMLProposta(dados, b64TP, b64OP) {

  /* Logo Top Prime */
  var logoTPTag = b64TP
    ? '<img src="' + b64TP + '" class="logo-empresa" alt="Top Prime">'
    : '<span class="logo-texto">TOP PRIME</span>';

  /* Logo Operadora */
  var logoOPTag = b64OP
    ? '<img src="' + b64OP + '" alt="' + h(dados.operadora) + '">'
    : '<span class="op-iniciais">' + h(dados.operadora.substring(0, 2).toUpperCase()) + '</span>';

  /* Linhas da tabela */
  var linhasTabela = dados.produtos.map(function (p) {
    return (
      '<tr>' +
        '<td><span class="badge">' + h(p.produto) + '</span></td>' +
        '<td>' + h(p.vidas) + '</td>' +
        '<td>' + h(p.acomodacao) + '</td>' +
        '<td>' + h(p.modalidade) + '</td>' +
        '<td class="valor">' + h(p.valor) + '</td>' +
      '</tr>'
    );
  }).join('');

  return (
    '<!DOCTYPE html><html lang="pt-BR"><head>' +
    '<meta charset="UTF-8">' +
    '<title>Proposta — ' + h(dados.nomeEmpresa) + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">' +
    '<style>' + cssPropostaPDF() + '</style>' +
    '</head><body>' +

    /* HEADER */
    '<div class="header">' +
      '<div class="header-left">' +
        logoTPTag +
        '<div>' +
          '<div class="company-name">Top Prime Seguros &amp; Sa&#250;de</div>' +
          '<div class="company-sub">Corretora de Seguros e Sa&#250;de</div>' +
        '</div>' +
      '</div>' +
      '<div class="header-right">' +
        '<div class="doc-title">Proposta Comercial</div>' +
        '<div class="doc-sub">' + h(dados.tipoPlano) + '</div>' +
      '</div>' +
    '</div>' +

    /* META */
    '<div class="meta-row">' +
      celula('Data da Proposta',  dataParaExibicao(dados.dataProposta)) +
      celula('Data de Vig&#234;ncia', dataParaExibicao(dados.dataVigencia)) +
      celula('Respons&#225;vel', h(dados.responsavel), true) +
    '</div>' +

    /* SIGNATÁRIOS */
    '<div class="sign-row">' +
      celula('Contratante',        h(dados.nomeEmpresa)) +
      celula('Diretor Executivo',  'Giovani J&#250;nior') +
      celula('Supervisor T&#233;cnico', 'Cristian Ara&#250;jo', true) +
    '</div>' +

    /* OPERADORA */
    '<div class="section-wrap">' +
      '<div class="section-lbl">Operadora</div>' +
      '<div class="op-card">' +
        '<div class="op-logo-box">' + logoOPTag + '</div>' +
        '<div class="op-info">' +
          '<div class="op-nome">' + h(dados.operadora) + '</div>' +
          '<div class="op-tipo">' + h(dados.tipoPlano) + '</div>' +
        '</div>' +
        '<div class="op-badge">Parceiro Premium</div>' +
      '</div>' +
    '</div>' +

    /* TABELA */
    '<div class="section-wrap">' +
      '<div class="section-lbl">Produtos Cotados</div>' +
      '<table>' +
        '<thead><tr>' +
          '<th>Produto / Plano</th><th>Vidas</th>' +
          '<th>Acomoda&#231;&#227;o</th><th>Modalidade</th><th>Valor Mensal</th>' +
        '</tr></thead>' +
        '<tbody>' + linhasTabela + '</tbody>' +
      '</table>' +
    '</div>' +

    /* OBSERVAÇÕES */
    '<div class="section-wrap">' +
      '<div class="section-lbl">Observa&#231;&#245;es</div>' +
      '<div class="obs-box">' + h(dados.observacoes) + '</div>' +
    '</div>' +

    /* FOOTER */
    '<div class="footer">' +
      '<div class="footer-txt">Av. Alvaro Maia, 365 &#8212; Manaus/AM &nbsp;&#183;&nbsp; (92) 3198-2900 &nbsp;&#183;&nbsp; contato@topprimeseguros.com.br</div>' +
      '<div class="footer-brand">TOP PRIME</div>' +
    '</div>' +

    '<script>window.onload = function(){ window.print(); }<\/script>' +
    '</body></html>'
  );
}

function celula(label, valor, last) {
  return '<div class="cell' + (last ? ' last' : '') + '">' +
    '<div class="lbl">' + label + '</div>' +
    '<div class="val">' + valor + '</div>' +
  '</div>';
}

/* ─────────────────────────────────────────────────────────
   CSS INLINE DA PROPOSTA
───────────────────────────────────────────────────────── */
function cssPropostaPDF() {
  return [
    '* { box-sizing:border-box; margin:0; padding:0; }',
    'body { font-family:"Open Sans",Arial,sans-serif; font-size:13px; color:#222; background:#fff; }',
    '@page { size:A4; margin:10mm 12mm; }',
    '@media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }',

    /* Header */
    '.header { background:#111; padding:22px 30px; display:flex; align-items:center; justify-content:space-between; gap:20px; border-bottom:4px solid #f7c948; margin-bottom:0; }',
    '.header-left { display:flex; align-items:center; gap:14px; }',
    '.logo-empresa { height:46px; width:auto; max-width:160px; object-fit:contain; background:#fff; border-radius:7px; padding:4px 8px; }',
    '.logo-texto { font-family:"Montserrat",Arial,sans-serif; font-size:16px; font-weight:800; color:#f7c948; }',
    '.company-name { font-family:"Montserrat",Arial,sans-serif; font-size:15px; font-weight:800; color:#fff; }',
    '.company-sub  { font-size:10px; color:#f7c948; font-weight:700; letter-spacing:.06em; text-transform:uppercase; margin-top:3px; }',
    '.header-right { text-align:right; }',
    '.doc-title { font-family:"Montserrat",Arial,sans-serif; font-size:17px; font-weight:800; color:#f7c948; }',
    '.doc-sub   { font-size:11px; color:rgba(255,255,255,.5); margin-top:4px; }',

    /* Células meta / sign */
    '.meta-row, .sign-row { display:flex; border-bottom:1px solid #e5e5e5; }',
    '.sign-row { background:#f7f7f7; }',
    '.cell { flex:1; padding:11px 20px; border-right:1px solid #e5e5e5; }',
    '.cell.last { border-right:none; }',
    '.lbl { font-family:"Montserrat",Arial,sans-serif; font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.10em; color:#aaa; margin-bottom:4px; }',
    '.val { font-size:13px; font-weight:600; color:#111; }',

    /* Seções */
    '.section-wrap { padding:16px 22px; border-bottom:1px solid #e5e5e5; }',
    '.section-lbl  { font-family:"Montserrat",Arial,sans-serif; font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:#aaa; margin-bottom:10px; }',

    /* Card operadora */
    '.op-card { display:flex; align-items:center; gap:18px; padding:13px 16px; border:1.5px solid #e5e5e5; border-radius:10px; background:#fafafa; position:relative; }',
    '.op-logo-box { width:130px; height:64px; background:#fff; border:1px solid #e0e0e0; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; padding:6px; }',
    '.op-logo-box img { max-width:100%; max-height:100%; object-fit:contain; }',
    '.op-iniciais { font-family:"Montserrat",Arial,sans-serif; font-size:22px; font-weight:800; color:#333; }',
    '.op-nome { font-family:"Montserrat",Arial,sans-serif; font-size:19px; font-weight:800; color:#111; }',
    '.op-tipo { font-size:12px; color:#888; margin-top:3px; }',
    '.op-badge { position:absolute; right:16px; top:50%; transform:translateY(-50%); background:#111; color:#f7c948; font-family:"Montserrat",Arial,sans-serif; font-size:9px; font-weight:700; padding:5px 13px; border-radius:20px; letter-spacing:.08em; text-transform:uppercase; }',

    /* Tabela */
    'table { width:100%; border-collapse:collapse; border:1px solid #e0e0e0; overflow:hidden; border-radius:8px; }',
    'thead tr { background:#111 !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }',
    'thead th { padding:10px 13px; text-align:left; font-family:"Montserrat",Arial,sans-serif; font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:#f7c948; }',
    'tbody tr { border-bottom:1px solid #efefef; }',
    'tbody tr:last-child { border-bottom:none; }',
    'tbody tr:nth-child(even) { background:#fafafa; }',
    'tbody td { padding:10px 13px; font-size:13px; color:#222; vertical-align:middle; }',
    '.badge { display:inline-block; padding:3px 10px; border-radius:20px; background:#111; color:#f7c948; font-family:"Montserrat",Arial,sans-serif; font-size:10px; font-weight:700; -webkit-print-color-adjust:exact; print-color-adjust:exact; }',
    '.valor { font-family:"Montserrat",Arial,sans-serif; font-size:13px; font-weight:700; color:#111; }',

    /* Observações */
    '.obs-box { border:1px solid #e5e5e5; border-radius:8px; padding:12px 16px; background:#f9f9f9; font-size:12px; color:#555; line-height:1.7; }',

    /* Footer */
    '.footer { background:#111 !important; padding:13px 30px; display:flex; align-items:center; justify-content:space-between; border-top:3px solid #f7c948; -webkit-print-color-adjust:exact; print-color-adjust:exact; }',
    '.footer-txt   { font-size:11px; color:rgba(255,255,255,.45); }',
    '.footer-brand { font-family:"Montserrat",Arial,sans-serif; font-size:13px; font-weight:800; color:#f7c948; letter-spacing:.08em; }',
  ].join('\n');
}

/* ─────────────────────────────────────────────────────────
   ESCAPE HTML
───────────────────────────────────────────────────────── */
function h(str) {
  return String(str || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* ─────────────────────────────────────────────────────────
   HISTÓRICO — busca do servidor (persistente)
───────────────────────────────────────────────────────── */

/** Busca todas as propostas salvas e atualiza a tela */
function carregarHistorico() {
  fetch('/api/propostas')
    .then(function (res) { return res.json(); })
    .then(function (json) { renderizarHistorico(json.propostas || []); })
    .catch(function ()    { renderizarHistorico([]); });
}

/** Renderiza a lista no DOM */
function renderizarHistorico(propostas) {
  var lista = document.getElementById('historico-lista');

  if (!propostas || !propostas.length) {
    lista.innerHTML = '<p class="empty-state">Nenhuma proposta registrada ainda.</p>';
    return;
  }

  lista.innerHTML = propostas.map(function (item) {
    var qtd  = (item.produtos || []).length;
    var data = item.geradoEm || (item.savedAt ? new Date(item.savedAt).toLocaleString('pt-BR') : '—');
    return (
      '<div class="historico-item">' +
        '<div class="historico-info">' +
          '<strong>' + h(item.nomeEmpresa || '—') + '</strong>' +
          '<span>' + h(item.operadora||'—') + ' &nbsp;·&nbsp; ' + h(item.tipoPlano||'—') + ' &nbsp;·&nbsp; ' + qtd + ' produto(s)</span>' +
          '<span class="historico-data">' + h(data) + ' &nbsp;·&nbsp; por ' + h(item.responsavel||'—') + '</span>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

/* ─────────────────────────────────────────────────────────
   NAVEGAÇÃO
───────────────────────────────────────────────────────── */
function iniciarNavegacao() {
  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.addEventListener('click', function (e) {
      /* Placar tem href real — deixa o navegador seguir normalmente */
      if (this.id === 'nav-placar') return;

      e.preventDefault();
      var secao = this.dataset.section;

      document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
      this.classList.add('active');

      document.getElementById('section-cadastro').style.display  = secao === 'cadastro'  ? 'block' : 'none';
      document.getElementById('section-historico').style.display = secao === 'historico' ? 'block' : 'none';

      var titulos = {
        cadastro:  ['Nova Proposta', 'Preencha os dados abaixo para gerar a proposta em PDF'],
        historico: ['Histórico',     'Propostas geradas nesta sessão'],
      };
      document.querySelector('.page-title').textContent    = titulos[secao][0];
      document.querySelector('.page-subtitle').textContent = titulos[secao][1];

      if (secao === 'historico') carregarHistorico();
    });
  });
}

/* ─────────────────────────────────────────────────────────
   LIMPAR FORMULÁRIO
───────────────────────────────────────────────────────── */
function limparFormulario() {
  if (!confirm('Deseja limpar todos os campos?')) return;

  ['tipo-plano','operadora','responsavel','nome-empresa','operadora-custom'].forEach(function (id) {
    document.getElementById(id).value = '';
  });

  document.getElementById('grupo-operadora-custom').style.display = 'none';
  document.getElementById('grupo-logo-preview').style.display     = 'none';
  document.getElementById('op-logo-preview-img').src              = '';
  document.getElementById('observacoes').value =
    'A Top Prime Seguros e Saúde agradece por fazer negócio com sua empresa! ' +
    'Caso possua quaisquer dúvidas sobre as cotações passadas, comunicar com o responsável pela cotação.';

  document.getElementById('planos-tbody').innerHTML = '';
  linhasPlano = 0;
  adicionarLinhaPlano();
  preencherDatasIniciais();
  mostrarToast('Formulário limpo.');
}

/* ─────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────── */
var _toastTimer = null;

function mostrarToast(msg, erro) {
  var old = document.querySelector('.toast');
  if (old) old.remove();
  if (_toastTimer) clearTimeout(_toastTimer);

  var t       = document.createElement('div');
  t.className = 'toast' + (erro ? ' erro' : '');
  t.textContent = msg;
  document.body.appendChild(t);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () { t.classList.add('show'); });
  });

  _toastTimer = setTimeout(function () {
    t.classList.remove('show');
    setTimeout(function () { t.remove(); }, 300);
  }, 3500);
}
