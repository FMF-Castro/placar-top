/**
 * ═══════════════════════════════════════════════════════════
 * TOP PRIME — Servidor Local
 * servidor.js
 *
 * COMO RODAR:
 *   node servidor.js
 *
 * COMO ACESSAR:
 *   Neste computador:  http://localhost:3000
 *   Na rede local:     http://SEU_IP:3000
 *   (rode ipconfig no cmd para descobrir seu IP)
 * ═══════════════════════════════════════════════════════════
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

/* ─── Configurações ─── */
const PORTA          = 8080;
const ARQUIVO_DADOS  = path.join(__dirname, 'propostas.json');
const ARQUIVO_PLACAR = path.join(__dirname, 'placar.json');
const ARQUIVO_PLACAR2 = path.join(__dirname, 'placar2.json');

/* ─── Cores para o terminal ─── */
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
  gray:   '\x1b[90m',
  bgGreen:  '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue:   '\x1b[44m',
};

/* ─── Mapa de tipos de arquivo para Content-Type ─── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

/* ─── Garante que os arquivos de dados existem ─── */
if (!fs.existsSync(ARQUIVO_DADOS)) {
  fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify({ propostas: [] }, null, 2));
}
if (!fs.existsSync(ARQUIVO_PLACAR)) {
  fs.writeFileSync(ARQUIVO_PLACAR, JSON.stringify({ data: null }, null, 2));
}

/* ═══════════════════════════════════════════════════════════
   LOG FORMATADO
   Exibe hora, tipo do evento, IP e detalhes no terminal.
═══════════════════════════════════════════════════════════ */

/** Retorna a hora atual formatada — ex: 14:32:07 */
function agora() {
  return new Date().toLocaleTimeString('pt-BR');
}

/** Pega o IP real do cliente — lida com proxies */
function pegarIP(req) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?';
  /* Remove prefixo IPv6 ::ffff: que aparece em IPv4 mapeado */
  return ip.replace('::ffff:', '').split(',')[0].trim();
}

/**
 * Imprime uma linha de log colorida no terminal.
 * @param {string} tipo    - 'PROPOSTA' | 'PLACAR' | 'PLACAR_LIMPO'
 * @param {string} ip      - IP da máquina que fez a ação
 * @param {string} detalhe - Texto com os dados relevantes
 */
function log(tipo, ip, detalhe) {
  var hora = C.gray + '[' + agora() + ']' + C.reset;

  var badge;
  if (tipo === 'PROPOSTA') {
    badge = C.bgGreen + C.bold + ' PROPOSTA ' + C.reset + C.green;
  } else if (tipo === 'PLACAR') {
    badge = C.bgYellow + C.bold + ' PLACAR   ' + C.reset + C.yellow;
  } else if (tipo === 'PLACAR_LIMPO') {
    badge = C.bgBlue + C.bold + ' PLACAR   ' + C.reset + C.blue;
  } else {
    badge = C.gray + ' INFO     ' + C.reset;
  }

  var ipStr  = C.cyan + '  IP: ' + ip + C.reset;
  var detStr = '  ' + detalhe + C.reset;

  console.log('\n' + hora + ' ' + badge + C.reset);
  console.log(ipStr);
  console.log('  ' + detalhe);
}

/* ═══════════════════════════════════════════════════════════
   FUNÇÕES DE DADOS
═══════════════════════════════════════════════════════════ */

function lerPropostas() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO_DADOS, 'utf8')).propostas || [];
  } catch (e) {
    return [];
  }
}

function salvarProposta(proposta) {
  try {
    var propostas  = lerPropostas();
    proposta.id      = Date.now();
    proposta.savedAt = new Date().toISOString();
    propostas.unshift(proposta);
    fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify({ propostas: propostas }, null, 2));
    return true;
  } catch (e) {
    console.error('Erro ao salvar proposta:', e.message);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════
   ROTEAMENTO
═══════════════════════════════════════════════════════════ */

function tratarRequisicao(req, res) {

  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  var ip = pegarIP(req);

  /* ── GET /api/propostas ── */
  if (req.method === 'GET' && req.url === '/api/propostas') {
    var propostas = lerPropostas();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, propostas: propostas }));
    return;
  }

  /* ── POST /api/propostas ── */
  if (req.method === 'POST' && req.url === '/api/propostas') {
    var corpo = '';
    req.on('data', function (chunk) { corpo += chunk.toString(); });
    req.on('end', function () {
      try {
        var proposta = JSON.parse(corpo);
        var ok       = salvarProposta(proposta);

        if (ok) {
          /* ── LOG detalhado da proposta ── */
          log(
            'PROPOSTA', ip,
            C.bold + 'Responsável : ' + C.reset + (proposta.responsavel || '—') + '\n' +
            '  ' + C.bold + 'Empresa     : ' + C.reset + (proposta.nomeEmpresa || '—') + '\n' +
            '  ' + C.bold + 'Operadora   : ' + C.reset + (proposta.operadora  || '—') + '\n' +
            '  ' + C.bold + 'Tipo        : ' + C.reset + (proposta.tipoPlano  || '—') + '\n' +
            '  ' + C.bold + 'Produtos    : ' + C.reset + (proposta.produtos   ? proposta.produtos.length : 0)
          );
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, erro: 'JSON inválido.' }));
      }
    });
    return;
  }

  /* ── GET /api/placar ── */
  if (req.method === 'GET' && req.url === '/api/placar') {
    try {
      var conteudo = fs.readFileSync(ARQUIVO_PLACAR, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(conteudo);
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: null }));
    }
    return;
  }

  /* ── POST /api/placar ── */
  if (req.method === 'POST' && req.url === '/api/placar') {
    var corpo = '';
    req.on('data', function (chunk) { corpo += chunk.toString(); });
    req.on('end', function () {
      try {
        var data = JSON.parse(corpo);
        fs.writeFileSync(ARQUIVO_PLACAR, JSON.stringify({ data: data }, null, 2));

        /* Conta consultores ativos e soma vendas */
        var consultores = (data.consultants || []).filter(function (c) { return c.active == 1; });
        var totalVendas = consultores.reduce(function (s, c) { return s + (c.sales || 0); }, 0);
        var nomes       = consultores.map(function (c) { return c.name; }).join(', ');

        /* ── LOG detalhado do placar ── */
        log(
          'PLACAR', ip,
          C.bold + 'Atualização : ' + C.reset + (data.updateLabel || '—') + '\n' +
          '  ' + C.bold + 'Consultores : ' + C.reset + consultores.length + ' ativos (' + nomes + ')\n' +
          '  ' + C.bold + 'Vendas hoje : ' + C.reset + totalVendas + ' / meta ' + (data.goalSales || '—')
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  /* ── DELETE /api/placar ── */
  if (req.method === 'DELETE' && req.url === '/api/placar') {
    fs.writeFileSync(ARQUIVO_PLACAR, JSON.stringify({ data: null }, null, 2));
    log('PLACAR_LIMPO', ip, C.blue + 'Dados do placar foram apagados.' + C.reset);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  /* ── GET /api/placar2 (novo placar com funis) ── */
  if (req.method === 'GET' && req.url === '/api/placar2') {
    try {
      var conteudo = fs.readFileSync(ARQUIVO_PLACAR2, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(conteudo);
    } catch(e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: null }));
    }
    return;
  }

  /* ── POST /api/placar2 ── */
  if (req.method === 'POST' && req.url === '/api/placar2') {
    var corpo = '';
    req.on('data', function(chunk) { corpo += chunk.toString(); });
    req.on('end', function() {
      try {
        var data = JSON.parse(corpo);
        fs.writeFileSync(ARQUIVO_PLACAR2, JSON.stringify({ data: data }, null, 2));

        /* Log por funil atualizado */
        ['b2cor','3cplus','pme'].forEach(function(f) {
          if (!data[f]) return;
          var ativos = (data[f].vendedores||[]).filter(function(c){return c.active==1;});
          var vendas = ativos.reduce(function(s,c){return s+(c.sales||0);},0);
          var nomeFunil = f === 'b2cor' ? 'B2COR' : f === '3cplus' ? '3CPlus' : 'PME';
          log('PLACAR', ip,
            C.bold + 'Funil    : ' + C.reset + nomeFunil + '\n' +
            '  ' + C.bold + 'Período  : ' + C.reset + (data[f].updateLabel||'—') + '\n' +
            '  ' + C.bold + 'Vendas   : ' + C.reset + vendas + ' / meta ' + (data[f].goalSales||'—')
          );
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  /* ── DELETE /api/placar2 ── */
  if (req.method === 'DELETE' && req.url === '/api/placar2') {
    fs.writeFileSync(ARQUIVO_PLACAR2, JSON.stringify({ data: null }, null, 2));
    log('PLACAR_LIMPO', ip, C.blue + 'Placar2 limpo.' + C.reset);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  /* ── Arquivos estáticos ── */
  var urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  var filePath = path.join(__dirname, urlPath);
  var ext      = path.extname(filePath).toLowerCase();
  var mime     = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 — Arquivo não encontrado: ' + urlPath);
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

/* ═══════════════════════════════════════════════════════════
   INICIAR SERVIDOR
═══════════════════════════════════════════════════════════ */

var servidor = http.createServer(tratarRequisicao);

servidor.listen(PORTA, '0.0.0.0', function () {

  var ip = 'SEU_IP';
  var interfaces = os.networkInterfaces();
  for (var nome in interfaces) {
    for (var iface of interfaces[nome]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ip = iface.address;
        break;
      }
    }
  }

  console.log('\n' + C.bold + C.yellow + '══════════════════════════════════════════' + C.reset);
  console.log(C.bold + C.yellow + '  TOP PRIME — Servidor rodando!' + C.reset);
  console.log(C.bold + C.yellow + '══════════════════════════════════════════' + C.reset);
  console.log(C.cyan + '  Neste computador : ' + C.reset + 'http://localhost:' + PORTA);
  console.log(C.cyan + '  Na rede local    : ' + C.reset + 'http://' + ip + ':' + PORTA);
  console.log(C.gray + '──────────────────────────────────────────' + C.reset);
  console.log(C.gray + '  Propostas : propostas.json' + C.reset);
  console.log(C.gray + '  Placar    : placar.json' + C.reset);
  console.log(C.gray + '  Para parar: Ctrl + C' + C.reset);
  console.log(C.bold + C.yellow + '══════════════════════════════════════════' + C.reset + '\n');
  console.log(C.gray + '  Aguardando atividade...' + C.reset + '\n');
});
