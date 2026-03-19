/**
 * TOP PRIME — Placar Comercial | placar.js
 */

/* ── Constantes ── */
const VENDEDORES = ['Jean','Francisco','Andreo','Bruno','Gabriel'];
const SDRS_POR_FUNIL = {
  b2cor:    ['João','Daniel','Ezequiel','Eric'],
  '3cplus': ['João','Daniel','Ezequiel','Eric'],
  pme:      ['João','Daniel'],
};
const LISTAS_3C_DEFAULT = ['Contabilidade','Educação','Tecnologia'];
const FUNIL_LABELS = { b2cor:'B2COR', '3cplus':'3CPlus', pme:'Formulário PME' };
const BADGE_MAP    = { '10h':'🕘 10h', '15h':'🕒 15h', '18h':'🕕 18h' };
const DAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const MTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const POS_CLS = ['g','s','b'];
const ROW_CLS = ['p1','p2','p3'];
const MEDALS  = ['1°','2°','3°'];

/* ── Estado ── */
let funil       = 'b2cor';
let lista3c     = '';
let dadosGlobal = null;

/* ── Reuniões: estado do modal ── */
let reunioesModalFunil = null;
let reunioesModalLista = null;

/* ══════════════════════════════════
   HELPERS — listas dinâmicas
══════════════════════════════════ */
function getListas3C() {
  const d = dadosGlobal?.['3cplus'];
  if (d?.listasConfig?.length > 0) return d.listasConfig.map(l => l.nome);
  return LISTAS_3C_DEFAULT;
}
function getListaConfig(nome) {
  const d = dadosGlobal?.['3cplus'];
  return d?.listasConfig?.find(l => l.nome === nome) || { nome, totalEmpresas:0, totalLigacoes:0 };
}
function sl(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
}

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  tick(); setInterval(tick,1000);
  await carregarDados();
  const listas = getListas3C();
  lista3c = listas[0] || '';
  buildForm();
  if (dadosGlobal) { renderDashboard(); showDashboard(); }
});

function tick() {
  const n = new Date();
  const clk = document.getElementById('clock');
  const dtl = document.getElementById('date-lbl');
  if (clk) clk.textContent = n.toLocaleTimeString('pt-BR');
  if (dtl) dtl.textContent = `${DAYS[n.getDay()]}, ${n.getDate()} ${MTHS[n.getMonth()]} ${n.getFullYear()}`;
}

/* ══════════════════════════════════
   API
══════════════════════════════════ */
async function carregarDados() {
  try {
    const r = await fetch('/api/placar2');
    const j = await r.json();
    dadosGlobal = j.data || null;
  } catch(e) { dadosGlobal = null; }
}
async function salvarDados(data) {
  try {
    await fetch('/api/placar2', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data),
    });
    dadosGlobal = data;
  } catch(e) { console.warn('Erro ao salvar:',e); }
}
async function limparDados() {
  try { await fetch('/api/placar2',{method:'DELETE'}); dadosGlobal=null; } catch(e){}
}

/* ══════════════════════════════════
   DADOS PADRÃO
══════════════════════════════════ */
function dadosPadrao(f) {
  const sdrs = SDRS_POR_FUNIL[f];
  const d = {
    updateLabel:'15h', goalSales:6, goalContacts:30, goalSims:8, goalSalesInd:2,
    alertLeads:0, alertBelow:0,
    vendedores: VENDEDORES.map(n=>({name:n,leads:0,contacts:0,sims:0,sales:0,resp:0,active:1})),
    sdrs: sdrs.map(n=>({name:n,leads:0,qualificados:0,negociacao:0,ligacoes:0,efetivas:0,emails:0,qualifs:0,reunioes:0,semInteresse:0,active:1})),
    reunioes: [],
  };
  if (f==='3cplus') {
    d.listasConfig = LISTAS_3C_DEFAULT.map(nome=>({nome,totalEmpresas:0,totalLigacoes:0}));
    d.listas = {};
    LISTAS_3C_DEFAULT.forEach(l => {
      d.listas[l] = sdrs.map(n=>({name:n,efetivas:0,emails:0,negociacao:0,qualificados:0,propostas:0,semInteresse:0}));
      d.reunioes_lista = d.reunioes_lista || {};
      d.reunioes_lista[l] = [];
    });
  }
  return d;
}
function getFunil(f) {
  return (dadosGlobal && dadosGlobal[f]) ? dadosGlobal[f] : dadosPadrao(f);
}

/* ══════════════════════════════════
   NAVEGAÇÃO
══════════════════════════════════ */
function showDashboard() {
  document.getElementById('form-view').classList.remove('active');
  document.getElementById('dashboard-view').classList.add('active');
  document.getElementById('btn-export').style.display = 'flex';
  document.getElementById('btn-edit').style.display   = 'block';
}
function showForm() {
  document.getElementById('dashboard-view').classList.remove('active');
  document.getElementById('form-view').classList.add('active');
  document.getElementById('btn-export').style.display = 'none';
  document.getElementById('btn-edit').style.display   = 'none';
  buildForm();
}
function setFunil(f) {
  funil = f;
  document.querySelectorAll('.funil-btn').forEach(b=>b.classList.toggle('active',b.dataset.funil===f));
  document.getElementById('hdr-funil').textContent = FUNIL_LABELS[f];
  document.getElementById('lista-bar').style.display = f==='3cplus'?'flex':'none';
  if (f==='3cplus') renderListaBar();
  renderDashboard();
}
function setLista(l) {
  lista3c = l;
  document.querySelectorAll('.lista-btn').forEach(b=>b.classList.toggle('active',b.dataset.lista===l));
  renderSDR(getFunil('3cplus'));
}
function setFormTab(f) {
  document.querySelectorAll('.form-tab').forEach(b=>b.classList.toggle('active',b.dataset.funil===f));
  document.querySelectorAll('.funil-panel').forEach(p=>p.classList.toggle('active',p.dataset.funil===f));
}
function renderListaBar() {
  const bar = document.getElementById('lista-bar').style.display = 'block';;
  const listas = getListas3C();
  if (!listas.includes(lista3c)) lista3c = listas[0]||'';
  bar.innerHTML = `<span class="lista-label">Lista:</span>` +
    listas.map(l=>`<button class="lista-btn ${l===lista3c?'active':''}" data-lista="${l}" onclick="setLista('${l.replace(/'/g,"\\'")}'">${l}</button>`).join('');
}

/* ══════════════════════════════════
   BUILD FORM
══════════════════════════════════ */
function buildForm() {
  ['b2cor','3cplus','pme'].forEach(buildFormFunil);
}
function sv(id,val) { const e=document.getElementById(id); if(e) e.value=val; }
function gv(id)     { const e=document.getElementById(id); return e?e.value:''; }

function buildFormFunil(f) {
  const d = getFunil(f);
  const sdrs = SDRS_POR_FUNIL[f];
  sv(`${f}-update`,     d.updateLabel||'15h');
  sv(`${f}-goal-sales`, d.goalSales??6);
  sv(`${f}-goal-cont`,  d.goalContacts??30);
  sv(`${f}-goal-sims`,  d.goalSims??8);
  sv(`${f}-goal-s-ind`, d.goalSalesInd??2);
  sv(`${f}-alert-leads`,d.alertLeads??0);
  sv(`${f}-alert-below`,d.alertBelow??0);

  /* Vendedores */
  const vtb = document.getElementById(`${f}-vtbody`);
  if (vtb) {
    vtb.innerHTML='';
    VENDEDORES.forEach((name,i)=>{
      const c=d.vendedores?.[i]||{};
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${name}</td>
        <td><input type="number" id="${f}-v${i}-leads"    value="${c.leads??0}" min="0"></td>
        <td><input type="number" id="${f}-v${i}-contacts" value="${c.contacts??0}" min="0"></td>
        <td><input type="number" id="${f}-v${i}-sims"     value="${c.sims??0}" min="0"></td>
        <td><input type="number" id="${f}-v${i}-sales"    value="${c.sales??0}" min="0"></td>
        <td><input type="number" id="${f}-v${i}-resp"     value="${c.resp??0}" min="0" step="0.1"></td>
        <td><select id="${f}-v${i}-active">
          <option value="1" ${(c.active??1)==1?'selected':''}>✅ Sim</option>
          <option value="0" ${(c.active??1)==0?'selected':''}>❌ Não</option>
        </select></td>`;
      vtb.appendChild(tr);
    });
  }

  /* SDRs b2cor/pme */
  if (f!=='3cplus') {
    const stb=document.getElementById(`${f}-stbody`);
    if (stb) {
      stb.innerHTML='';
      sdrs.forEach((name,i)=>{
        const s=d.sdrs?.[i]||{};
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>${name}</td>
          <td><input type="number" id="${f}-s${i}-leads"   value="${s.leads??0}" min="0"></td>
          <td><input type="number" id="${f}-s${i}-qual"    value="${s.qualificados??0}" min="0"></td>
          <td><input type="number" id="${f}-s${i}-neg"     value="${s.negociacao??0}" min="0"></td>
          <td><input type="number" id="${f}-s${i}-lig"     value="${s.ligacoes??0}" min="0"></td>
          <td><input type="number" id="${f}-s${i}-efet"    value="${s.efetivas??0}" min="0"></td>
          <td><input type="number" id="${f}-s${i}-email"   value="${s.emails??0}" min="0"></td>
          <td><input type="number" id="${f}-s${i}-qualifs" value="${s.qualifs??0}" min="0"></td>
          <td><input type="number" id="${f}-s${i}-reun"    value="${s.reunioes??0}" min="0"></td>
          <td><input type="number" id="${f}-s${i}-sint"    value="${s.semInteresse??0}" min="0"></td>
          <td><select id="${f}-s${i}-active">
            <option value="1" ${(s.active??1)==1?'selected':''}>✅</option>
            <option value="0" ${(s.active??1)==0?'selected':''}>❌</option>
          </select></td>`;
        stb.appendChild(tr);
      });
    }
  }

  /* 3CPlus listas dinâmicas */
  if (f==='3cplus') build3CForm(d,sdrs);
}

function build3CForm(d,sdrs) {
  const container=document.getElementById('3c-listas-container');
  if (!container) return;
  const configs=d.listasConfig||LISTAS_3C_DEFAULT.map(n=>({nome:n,totalEmpresas:0,totalLigacoes:0}));
  container.innerHTML='';
  configs.forEach((cfg,li)=>{
    const listaData=d.listas?.[cfg.nome]||[];
    const slNome=sl(cfg.nome);
    const card=document.createElement('div');
    card.className='lista-form-card';
    card.innerHTML=`
      <div class="lista-form-header">
        <div class="lista-form-title">${cfg.nome}</div>
        <button class="btn-remove-lista" onclick="removeLista(${li})" title="Remover">✕</button>
      </div>
      <div class="lista-global-fields">
        <div class="fld"><label>Total de Empresas</label>
          <input type="number" id="3c-${slNome}-total-emp" value="${cfg.totalEmpresas??0}" min="0"></div>
        <div class="fld"><label>Ligações Plataforma</label>
          <input type="number" id="3c-${slNome}-total-lig" value="${cfg.totalLigacoes??0}" min="0"></div>
      </div>
      <div class="lista-sdr-title">Resultados por SDR</div>
      <table class="ctbl">
        <thead><tr><th>SDR</th><th>Efetivas</th><th>Emails</th><th>Em contato</th><th>Qualif.</th><th>Propostas</th><th>Sem Int.</th></tr></thead>
        <tbody id="3c-${slNome}-tbody"></tbody>
      </table>`;
    container.appendChild(card);
    const tbody=document.getElementById(`3c-${slNome}-tbody`);
    sdrs.forEach((name,i)=>{
      const s=listaData[i]||{};
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${name}</td>
        <td><input type="number" id="3c-${slNome}-${i}-efet"  value="${s.efetivas??0}" min="0"></td>
        <td><input type="number" id="3c-${slNome}-${i}-email" value="${s.emails??0}" min="0"></td>
        <td><input type="number" id="3c-${slNome}-${i}-neg"   value="${s.negociacao??0}" min="0"></td>
        <td><input type="number" id="3c-${slNome}-${i}-qual"  value="${s.qualificados??0}" min="0"></td>
        <td><input type="number" id="3c-${slNome}-${i}-prop"  value="${s.propostas??0}" min="0"></td>
        <td><input type="number" id="3c-${slNome}-${i}-sint"  value="${s.semInteresse??0}" min="0"></td>`;
      tbody.appendChild(tr);
    });
  });
}

function adicionarLista() {
  const input=document.getElementById('nova-lista-nome');
  const nome=input?input.value.trim():'';
  if (!nome){showToast('Digite o nome da lista.');return;}
  const d=getFunil('3cplus');
  if (!d.listasConfig) d.listasConfig=[];
  if (!d.listas) d.listas={};
  if (!d.reunioes_lista) d.reunioes_lista={};
  if (d.listasConfig.find(l=>l.nome.toLowerCase()===nome.toLowerCase())){showToast('Lista já existe.');return;}
  d.listasConfig.push({nome,totalEmpresas:0,totalLigacoes:0});
  d.listas[nome]=SDRS_POR_FUNIL['3cplus'].map(n=>({name:n,efetivas:0,emails:0,negociacao:0,qualificados:0,propostas:0,semInteresse:0}));
  d.reunioes_lista[nome]=[];
  if (!dadosGlobal) dadosGlobal={};
  dadosGlobal['3cplus']=d;
  if (input) input.value='';
  build3CForm(d,SDRS_POR_FUNIL['3cplus']);
  showToast(`Lista "${nome}" adicionada!`);
}

function removeLista(li) {
  const d=getFunil('3cplus');
  if (!d.listasConfig||d.listasConfig.length<=1){showToast('Mantenha ao menos uma lista.');return;}
  const cfg=d.listasConfig[li];
  if (!confirm(`Remover a lista "${cfg.nome}"?`)) return;
  d.listasConfig.splice(li,1);
  delete d.listas[cfg.nome];
  if (d.reunioes_lista) delete d.reunioes_lista[cfg.nome];
  if (!dadosGlobal) dadosGlobal={};
  dadosGlobal['3cplus']=d;
  build3CForm(d,SDRS_POR_FUNIL['3cplus']);
  showToast(`Lista "${cfg.nome}" removida.`);
}

/* ══════════════════════════════════
   SUBMIT
══════════════════════════════════ */
async function submitForm() {
  const dados=dadosGlobal?{...dadosGlobal}:{};
  ['b2cor','3cplus','pme'].forEach(f=>{
    const sdrs=SDRS_POR_FUNIL[f];
    const d={
      updateLabel: gv(`${f}-update`),
      goalSales:   +gv(`${f}-goal-sales`)||6,
      goalContacts:+gv(`${f}-goal-cont`)||30,
      goalSims:    +gv(`${f}-goal-sims`)||8,
      goalSalesInd:+gv(`${f}-goal-s-ind`)||2,
      alertLeads:  +gv(`${f}-alert-leads`)||0,
      alertBelow:  +gv(`${f}-alert-below`)||0,
      vendedores: VENDEDORES.map((name,i)=>({
        name, leads:+gv(`${f}-v${i}-leads`)||0, contacts:+gv(`${f}-v${i}-contacts`)||0,
        sims:+gv(`${f}-v${i}-sims`)||0, sales:+gv(`${f}-v${i}-sales`)||0,
        resp:+gv(`${f}-v${i}-resp`)||0, active:+gv(`${f}-v${i}-active`)??1,
      })),
      reunioes: dados[f]?.reunioes||[],
    };
    if (f!=='3cplus') {
      d.sdrs=sdrs.map((name,i)=>({
        name,
        leads:+gv(`${f}-s${i}-leads`)||0, qualificados:+gv(`${f}-s${i}-qual`)||0,
        negociacao:+gv(`${f}-s${i}-neg`)||0, ligacoes:+gv(`${f}-s${i}-lig`)||0,
        efetivas:+gv(`${f}-s${i}-efet`)||0, emails:+gv(`${f}-s${i}-email`)||0,
        qualifs:+gv(`${f}-s${i}-qualifs`)||0, reunioes:+gv(`${f}-s${i}-reun`)||0,
        semInteresse:+gv(`${f}-s${i}-sint`)||0, active:+gv(`${f}-s${i}-active`)??1,
      }));
    } else {
      const existente=getFunil('3cplus');
      const configs=existente.listasConfig||[];
      d.listasConfig=configs.map(cfg=>({
        nome:cfg.nome,
        totalEmpresas:+gv(`3c-${sl(cfg.nome)}-total-emp`)||0,
        totalLigacoes:+gv(`3c-${sl(cfg.nome)}-total-lig`)||0,
      }));
      d.listas={};
      configs.forEach(cfg=>{
        d.listas[cfg.nome]=sdrs.map((name,i)=>({
          name,
          efetivas:+gv(`3c-${sl(cfg.nome)}-${i}-efet`)||0,
          emails:+gv(`3c-${sl(cfg.nome)}-${i}-email`)||0,
          negociacao:+gv(`3c-${sl(cfg.nome)}-${i}-neg`)||0,
          qualificados:+gv(`3c-${sl(cfg.nome)}-${i}-qual`)||0,
          propostas:+gv(`3c-${sl(cfg.nome)}-${i}-prop`)||0,
          semInteresse:+gv(`3c-${sl(cfg.nome)}-${i}-sint`)||0,
        }));
      });
      d.reunioes_lista=dados['3cplus']?.reunioes_lista||{};
    }
    dados[f]=d;
  });
  dados.savedAt=new Date().toISOString();
  await salvarDados(dados);
  renderDashboard();
  showDashboard();
  showToast('✅ Placar atualizado!');
}

/* ══════════════════════════════════
   RENDER DASHBOARD
══════════════════════════════════ */
function renderDashboard() {
  const d=getFunil(funil);
  const badge=document.getElementById('dash-badge');
  if (badge) badge.textContent=BADGE_MAP[d.updateLabel]||d.updateLabel;
  renderVendedores(d);
  if (funil==='3cplus') renderListaBar();
  renderSDR(d);
}

/* ── Vendedores ── */
function renderVendedores(d) {
  const ativos=(d.vendedores||[]).filter(c=>c.active==1)
    .map(c=>({...c,conv:c.leads>0?+(c.sales/c.leads*100).toFixed(1):0}))
    .sort((a,b)=>b.sales!==a.sales?b.sales-a.sales:b.conv-a.conv);

  document.getElementById('rank-vend-rows').innerHTML=ativos.map((c,i)=>{
    const pCls=i<3?POS_CLS[i]:'n', rCls=i<3?ROW_CLS[i]:'', lbl=i<3?MEDALS[i]:`${i+1}º`;
    const cCls=c.conv>=15?'ch':c.conv>=8?'cm':'cl';
    return `<div class="rank-row rank-vend ${rCls}">
      <div class="rank-pos-wrap"><div class="rank-pos ${pCls}">${lbl}</div></div>
      <div class="cname">${c.name}</div>
      <div class="sv">${c.leads}</div><div class="sv">${c.contacts}</div>
      <div class="sv">${c.sims}</div><div class="sv-sales">${c.sales}</div>
      <div style="text-align:center"><span class="cbadge ${cCls}">${c.conv.toFixed(1)}%</span></div>
    </div>`;
  }).join('');

  const tL=ativos.reduce((s,c)=>s+c.leads,0), tC=ativos.reduce((s,c)=>s+c.contacts,0);
  const tS=ativos.reduce((s,c)=>s+c.sims,0),  tV=ativos.reduce((s,c)=>s+c.sales,0);
  const cv=tL>0?+(tV/tL*100).toFixed(1):0;
  const cCls=cv>=10?'c-green':'c-gold';
  document.getElementById('vend-ind').innerHTML=`
    <div class="ind-card"><div class="ind-icon">📥</div><div><div class="ind-label">Leads</div><div class="ind-val c-blue">${tL}</div></div></div>
    <div class="ind-card"><div class="ind-icon">📞</div><div><div class="ind-label">Contatos</div><div class="ind-val c-purple">${tC}</div></div></div>
    <div class="ind-card"><div class="ind-icon">📄</div><div><div class="ind-label">Propostas</div><div class="ind-val c-gold">${tS}</div></div></div>
    <div class="ind-card"><div class="ind-icon">💰</div><div><div class="ind-label">Vendas</div><div class="ind-val c-green">${tV}</div></div></div>
    <div class="ind-card" style="grid-column:span 2"><div class="ind-icon">🎯</div><div><div class="ind-label">Conversão do Time</div><div class="ind-val ${cCls}">${cv.toFixed(1)}%</div></div></div>`;

  const pct=Math.min(tV/(d.goalSales||1)*100,100);
  document.getElementById('vend-goal-text').textContent=`${tV} / ${d.goalSales||6} vendas`;
  document.getElementById('vend-pbar').style.width=pct+'%';
  document.getElementById('vend-goal-pct').textContent=`${pct.toFixed(0)}% da meta atingida`;

  if (ativos.length) {
    const mC=ativos.reduce((a,b)=>a.contacts>=b.contacts?a:b);
    const mS=ativos.reduce((a,b)=>a.sales>=b.sales?a:b);
    document.getElementById('vend-highlights').innerHTML=[
      {l:'📞 Mais contatos',v:`${mC.name} — ${mC.contacts}`},
      {l:'💰 Mais vendas',  v:`${mS.name} — ${mS.sales}`},
    ].map(r=>`<div class="hl-row"><span class="hl-lbl">${r.l}</span><span class="hl-val">${r.v}</span></div>`).join('');
  }

  const als=[];
  if (d.alertLeads>0) als.push(`${d.alertLeads} lead(s) sem contato há +10 min`);
  ativos.forEach(c=>{if(c.contacts<Math.round((d.goalContacts||30)*0.5))als.push(`${c.name} — abaixo de 50% da meta`);});
  document.getElementById('vend-alerts').innerHTML=als.length
    ?als.map(a=>`<div class="alert-item"><div class="adot"></div><span>${a}</span></div>`).join('')
    :`<span style="color:var(--green);font-size:.75rem">✅ Nenhum alerta</span>`;
}

/* ── SDR ── */
function renderSDR(d) {
  if (funil==='3cplus') {
    const listaData=d.listas?.[lista3c]||[];
    const cfg=getListaConfig(lista3c);
    const total=cfg.totalEmpresas||1;
    const sdrs=listaData.map(s=>({...s,conv:+(s.qualificados/total*100).toFixed(1)}))
      .sort((a,b)=>b.qualificados-a.qualificados);

    /* Cabeçalho */
    const head=document.getElementById('rank-sdr-head');
    if (head) {
      head.className='rank-head rank-sdr-3c';
      head.innerHTML=`<div>#</div><div>SDR</div>
        <div style="text-align:center">Efetivas</div>
        <div style="text-align:center">Qualif.</div>
        <div style="text-align:center">Propostas</div>
        <div style="text-align:center">Conv.%</div>`;
    }

    /* Ranking */
    document.getElementById('rank-sdr-rows').innerHTML=sdrs.map((s,i)=>{
      const pCls=i<3?POS_CLS[i]:'n', rCls=i<3?ROW_CLS[i]:'', lbl=i<3?MEDALS[i]:`${i+1}º`;
      const cCls=s.conv>=20?'ch':s.conv>=10?'cm':'cl';
      return `<div class="rank-row rank-sdr-3c ${rCls}">
        <div class="rank-pos-wrap"><div class="rank-pos ${pCls}">${lbl}</div></div>
        <div class="cname">${s.name}</div>
        <div class="sv">${s.efetivas||0}</div>
        <div class="sv-qual">${s.qualificados||0}</div>
        <div class="sv">${s.propostas||0}</div>
        <div style="text-align:center"><span class="cbadge ${cCls}">${s.conv.toFixed(1)}%</span></div>
      </div>`;
    }).join('');

    /* Indicadores da lista */
    const tEf=listaData.reduce((s,c)=>s+(c.efetivas||0),0);
    const tEm=listaData.reduce((s,c)=>s+(c.emails||0),0);
    const tNeg=listaData.reduce((s,c)=>s+(c.negociacao||0),0);
    const tQl=listaData.reduce((s,c)=>s+(c.qualificados||0),0);
    const tPr=listaData.reduce((s,c)=>s+(c.propostas||0),0);
    const cvQ=cfg.totalEmpresas>0?+(tQl/cfg.totalEmpresas*100).toFixed(1):0;
    const reunLista=(d.reunioes_lista?.[lista3c]||[]).length;

    document.getElementById('sdr-ind').innerHTML=`
      <div class="ind-card" style="grid-column:span 2">
        <div class="ind-icon">🏢</div>
        <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
          <div><div class="ind-label">Lista: ${lista3c}</div></div>
          <div><div class="ind-label">Empresas</div><div class="ind-val c-blue">${cfg.totalEmpresas}</div></div>
          <div><div class="ind-label">Lig. Plataforma</div><div class="ind-val c-purple">${cfg.totalLigacoes}</div></div>
        </div>
      </div>
      <div class="ind-card"><div class="ind-icon">🎯</div><div><div class="ind-label">Efetivas</div><div class="ind-val c-gold">${tEf}</div></div></div>
      <div class="ind-card"><div class="ind-icon">📧</div><div><div class="ind-label">Emails</div><div class="ind-val c-teal">${tEm}</div></div></div>
      <div class="ind-card"><div class="ind-icon">💬</div><div><div class="ind-label">Em contato</div><div class="ind-val c-orange">${tNeg}</div></div></div>
      <div class="ind-card"><div class="ind-icon">✅</div><div><div class="ind-label">Qualificados</div><div class="ind-val c-green">${tQl} <span style="font-size:.68rem;color:var(--text-muted)">(${cvQ}%)</span></div></div></div>
      <div class="ind-card"><div class="ind-icon">📄</div><div><div class="ind-label">Propostas</div><div class="ind-val c-blue">${tPr}</div></div></div>
      <div class="ind-card ind-card-click" onclick="abrirReunioes('3cplus','${lista3c.replace(/'/g,"\\'")}')">
        <div class="ind-icon">📅</div>
        <div><div class="ind-label">Reuniões</div><div class="ind-val c-orange">${reunLista} <span style="font-size:.62rem;color:var(--text-muted)">ver detalhes →</span></div></div>
      </div>`;

  } else {
    /* B2COR e PME */
    const sdrs=(d.sdrs||[]).filter(s=>s.active==1)
      .map(s=>({...s,conv:s.leads>0?+(s.qualificados/s.leads*100).toFixed(1):0}))
      .sort((a,b)=>b.qualificados-a.qualificados);

    const head=document.getElementById('rank-sdr-head');
    if (head) {
      head.className='rank-head rank-sdr';
      head.innerHTML=`<div>#</div><div>SDR</div>
        <div style="text-align:center">Leads</div>
        <div style="text-align:center">Qualif.</div>
        <div style="text-align:center">Conv.%</div>`;
    }

    document.getElementById('rank-sdr-rows').innerHTML=sdrs.map((s,i)=>{
      const pCls=i<3?POS_CLS[i]:'n', rCls=i<3?ROW_CLS[i]:'', lbl=i<3?MEDALS[i]:`${i+1}º`;
      const cCls=s.conv>=20?'ch':s.conv>=10?'cm':'cl';
      return `<div class="rank-row rank-sdr ${rCls}">
        <div class="rank-pos-wrap"><div class="rank-pos ${pCls}">${lbl}</div></div>
        <div class="cname">${s.name}</div>
        <div class="sv">${s.leads}</div>
        <div class="sv-qual">${s.qualificados}</div>
        <div style="text-align:center"><span class="cbadge ${cCls}">${s.conv.toFixed(1)}%</span></div>
      </div>`;
    }).join('');

    const tL=sdrs.reduce((s,c)=>s+(c.leads||0),0);
    const tQ=sdrs.reduce((s,c)=>s+(c.qualificados||0),0);
    const tN=sdrs.reduce((s,c)=>s+(c.negociacao||0),0);
    const cv=tL>0?+(tQ/tL*100).toFixed(1):0;

    const reunCount=(d.reunioes||[]).length;
    const reunBtn=funil==='pme'
      ?`<div class="ind-card ind-card-click" onclick="abrirReunioes('pme',null)">
          <div class="ind-icon">📅</div>
          <div><div class="ind-label">Reuniões</div><div class="ind-val c-orange">${reunCount} <span style="font-size:.62rem;color:var(--text-muted)">ver detalhes →</span></div></div>
        </div>`
      :'';

    document.getElementById('sdr-ind').innerHTML=`
      <div class="ind-card"><div class="ind-icon">📥</div><div><div class="ind-label">Leads Recebidos</div><div class="ind-val c-blue">${tL}</div></div></div>
      <div class="ind-card"><div class="ind-icon">✅</div><div><div class="ind-label">Qualificados</div><div class="ind-val c-green">${tQ} <span style="font-size:.68rem;color:var(--text-muted)">(${cv}%)</span></div></div></div>
      <div class="ind-card" style="grid-column:span 2"><div class="ind-icon">💬</div><div><div class="ind-label">Em contato</div><div class="ind-val c-orange">${tN}</div></div></div>
      ${reunBtn}`;
  }
}

/* ══════════════════════════════════
   MODAL DE REUNIÕES
══════════════════════════════════ */
function abrirReunioes(f, lista) {
  reunioesModalFunil = f;
  reunioesModalLista = lista;
  const d = getFunil(f);
  const reunioes = lista
    ? (d.reunioes_lista?.[lista] || [])
    : (d.reunioes || []);

  const sdrs = SDRS_POR_FUNIL[f];
  const titulo = lista ? `Reuniões — ${lista}` : `Reuniões — Formulário PME`;

  document.getElementById('modal-titulo').textContent = titulo;

  /* Lista de reuniões */
  const listaEl = document.getElementById('modal-lista-reunioes');
  if (!reunioes.length) {
    listaEl.innerHTML = `<div style="color:var(--text-muted);font-size:.82rem;padding:8px 0">Nenhuma reunião registrada ainda.</div>`;
  } else {
    listaEl.innerHTML = reunioes.map((r,i) => `
      <div class="reun-item">
        <div class="reun-info">
          <span class="reun-sdr">${r.sdr}</span>
          <span class="reun-empresa">${r.empresa}</span>
          <span class="reun-vidas">${r.vidas} vidas</span>
          ${r.obs?`<span class="reun-obs">${r.obs}</span>`:''}
        </div>
        <button class="btn-remove-reun" onclick="removerReuniao(${i})">✕</button>
      </div>`).join('');
  }

  /* Preenche select de SDRs */
  const selSdr = document.getElementById('modal-sdr');
  selSdr.innerHTML = sdrs.map(s=>`<option value="${s}">${s}</option>`).join('');

  /* Limpa campos */
  document.getElementById('modal-empresa').value = '';
  document.getElementById('modal-vidas').value   = '';
  document.getElementById('modal-obs').value     = '';

  document.getElementById('modal-reunioes').classList.add('active');
}

function fecharReunioes() {
  document.getElementById('modal-reunioes').classList.remove('active');
}

function adicionarReuniao() {
  const sdr     = document.getElementById('modal-sdr').value;
  const empresa = document.getElementById('modal-empresa').value.trim();
  const vidas   = document.getElementById('modal-vidas').value;
  const obs     = document.getElementById('modal-obs').value.trim();

  if (!empresa || !vidas) { showToast('Preencha empresa e vidas.'); return; }

  const d = getFunil(reunioesModalFunil);
  const novaReuniao = { sdr, empresa, vidas: +vidas, obs, criadoEm: new Date().toISOString() };

  if (reunioesModalLista) {
    if (!d.reunioes_lista) d.reunioes_lista = {};
    if (!d.reunioes_lista[reunioesModalLista]) d.reunioes_lista[reunioesModalLista] = [];
    d.reunioes_lista[reunioesModalLista].push(novaReuniao);
  } else {
    if (!d.reunioes) d.reunioes = [];
    d.reunioes.push(novaReuniao);
  }

  if (!dadosGlobal) dadosGlobal = {};
  dadosGlobal[reunioesModalFunil] = d;
  salvarDados(dadosGlobal);

  /* Atualiza modal sem fechar */
  abrirReunioes(reunioesModalFunil, reunioesModalLista);
  renderSDR(d);
  showToast('✅ Reunião registrada!');
}

function removerReuniao(idx) {
  if (!confirm('Remover esta reunião?')) return;
  const d = getFunil(reunioesModalFunil);
  if (reunioesModalLista) {
    d.reunioes_lista[reunioesModalLista].splice(idx,1);
  } else {
    d.reunioes.splice(idx,1);
  }
  dadosGlobal[reunioesModalFunil] = d;
  salvarDados(dadosGlobal);
  abrirReunioes(reunioesModalFunil, reunioesModalLista);
  renderSDR(d);
}

/* ══════════════════════════════════
   EXPORT / LIMPAR / TOAST
══════════════════════════════════ */
function exportExcel() {
  if (!dadosGlobal){alert('Nenhum dado.');return;}
  if (typeof XLSX==='undefined'){showToast('❌ XLSX indisponível');return;}
  const now=new Date(), ds=`${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  const d=getFunil(funil), nf=FUNIL_LABELS[funil];
  const vAtivos=(d.vendedores||[]).filter(c=>c.active==1)
    .map(c=>({...c,conv:c.leads>0?+(c.sales/c.leads*100).toFixed(1):0})).sort((a,b)=>b.sales-a.sales);
  const rows=[[`TOP PRIME — Placar ${nf} — ${ds}`],[],
    ['VENDEDORES'],['Pos.','Nome','Leads','Contatos','Propostas','Vendas','Conv.%'],
    ...vAtivos.map((c,i)=>[`${i+1}°`,c.name,c.leads,c.contacts,c.sims,c.sales,`${c.conv}%`])];
  const wb=XLSX.utils.book_new(), ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[{wch:6},{wch:14},{wch:8},{wch:10},{wch:10},{wch:8},{wch:10}];
  XLSX.utils.book_append_sheet(wb,ws,`Placar ${nf}`);
  XLSX.writeFile(wb,`Placar_${nf}_${ds.replace(/\//g,'-')}.xlsx`);
  showToast('📊 Excel exportado!');
}

async function clearData() {
  if (!confirm('Limpar todos os dados?')) return;
  await limparDados();
  lista3c=LISTAS_3C_DEFAULT[0];
  buildForm();
  showToast('🗑️ Dados limpos!');
}

function showToast(msg) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}
