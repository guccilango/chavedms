/* Menorzinho Midia Simulator App */

const state = {
  config: null,
  teamSize: 4,
  players: [],
  selected: new Map(),
  lastAdded: null,
  lastRemoved: null,
};

const els = {
  cfgDescricao: document.getElementById('cfgDescricao'),
  cfgMaxIndividual: document.getElementById('cfgMaxIndividual'),
  cfgSizes: document.getElementById('cfgSizes'),
  cfgFormula: document.getElementById('cfgFormula'),
  sizePicker: document.getElementById('sizePicker'),
  searchInput: document.getElementById('searchInput'),
  btnAutoTop: document.getElementById('btnAutoTop'),
  btnAutoRandom: document.getElementById('btnAutoRandom'),
  btnLimpar: document.getElementById('btnLimpar'),
  playersList: document.getElementById('playersList'),
  playersCount: document.getElementById('playersCount'),
  teamList: document.getElementById('teamList'),
  teamCount: document.getElementById('teamCount'),
  resultCard: document.getElementById('resultCard'),
  resultRank: document.getElementById('resultRank'),
  resultPhrase: document.getElementById('resultPhrase'),
  metricSoma: document.getElementById('metricSoma'),
  metricMedia: document.getElementById('metricMedia'),
  metricRank: document.getElementById('metricRank'),
  ruleMaxTotal: document.getElementById('ruleMaxTotal'),
  ruleBase: document.getElementById('ruleBase'),
  ruleFormula: document.getElementById('ruleFormula'),
  warnings: document.getElementById('warnings'),
  rankBands: document.getElementById('rankBands'),
  introOverlay: document.getElementById('introOverlay'),
};

const rankPhrases = {
  S: 'Calma chefe tudo isso',
  A: 'geralmente choram',
  B: 'Ganhavel',
  C: 'Tem certeza?',
  D: 'Manda alguem logar pfv',
  E: 'Nem manda isso',
};

/* ───────── Config Load ───────── */
async function loadConfig() {
  try {
    const res = await fetch('./rankbase.json');
    const json = await res.json();
    state.config = json;
    bindConfig();
    bindBands();
    state.players = [...json.jogadores];
    renderPlayers();
    updateRules();
    updateMetrics();
  } catch (err) {
    console.error('Falha ao carregar rankbase.json', err);
    if (els.warnings) els.warnings.textContent = 'Falha ao carregar rankbase.json.';
  }
}

function bindConfig() {
  const cfg = state.config.sistema_rank;
  if (els.cfgDescricao) els.cfgDescricao.textContent = cfg.descricao;
  if (els.cfgMaxIndividual) els.cfgMaxIndividual.textContent = String(cfg.pontuacao_maxima_individual);
  if (els.cfgSizes) els.cfgSizes.textContent = (cfg.tamanhos_de_time_permitidos || []).join(', ');
  const f = cfg.formula_calculo;
  if (f && f.formula_matematica && els.cfgFormula) {
    els.cfgFormula.textContent = f.formula_matematica;
  }
}

function bindBands() {
  const bands = state.config.faixas_de_rank;
  const letters = Object.keys(bands);
  if (!els.rankBands) return;
  els.rankBands.innerHTML = '';
  letters.sort((a, b) => bands[b].min - bands[a].min);
  for (const letter of letters) {
    const { min, max } = bands[letter];
    const div = document.createElement('div');
    div.className = 'band';
    div.innerHTML = `<div class="band-title">${letter}</div><div class="band-range">${min} – ${max}</div>`;
    els.rankBands.appendChild(div);
  }
}

/* ───────── Render Players ───────── */
function renderPlayers() {
  const term = (els.searchInput?.value || '').trim().toLowerCase();
  const filtered = state.players
    .filter(p => !state.selected.has(p.nome) && p.nome.toLowerCase().includes(term))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  els.playersList.innerHTML = '';
  if (els.playersCount) els.playersCount.textContent = `${filtered.length} jogadores`;

  const isFull = state.selected.size >= state.teamSize;

  for (const player of filtered) {
    const li = document.createElement('li');
    li.className = 'player-row slide-in';
    li.dataset.name = player.nome;

    li.innerHTML = `
      <span class="player-name">${player.nome}</span>
      <div class="player-actions">
        <button class="btn btn-add" ${isFull ? 'disabled title="Time cheio"' : ''}>
          <svg class="btn-svg" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          <span>Adicionar</span>
        </button>
      </div>
    `;

    const btn = li.querySelector('.btn-add');
    btn.addEventListener('click', (e) => { e.stopPropagation(); togglePlayer(player); });
    li.addEventListener('click', () => { if (!isFull) togglePlayer(player); });

    els.playersList.appendChild(li);
  }
}

/* ───────── Render Team ───────── */
function renderTeam() {
  els.teamList.innerHTML = '';
  const team = [...state.selected.values()];

  for (const player of team) {
    const li = document.createElement('li');
    li.className = 'player-row';
    li.dataset.name = player.nome;

    if (state.lastAdded === player.nome) {
      li.classList.add('slide-in', 'flash-add');
    }

    li.innerHTML = `
      <span class="player-name">${player.nome}</span>
      <div class="player-actions">
        <button class="btn btn-remove">
          <svg class="btn-svg" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
          <span>Remover</span>
        </button>
      </div>
    `;

    const btn = li.querySelector('.btn-remove');
    btn.addEventListener('click', (e) => { e.stopPropagation(); togglePlayer(player); });
    li.addEventListener('click', () => togglePlayer(player));

    els.teamList.appendChild(li);
  }

  if (els.teamCount) els.teamCount.textContent = `${team.length} / ${state.teamSize}`;
  state.lastAdded = null;
  state.lastRemoved = null;
}

/* ───────── Toggle Player ───────── */
function togglePlayer(player) {
  if (state.selected.has(player.nome)) {
    state.selected.delete(player.nome);
    state.lastRemoved = player.nome;
  } else {
    if (state.selected.size >= state.teamSize) return;
    state.selected.set(player.nome, player);
    state.lastAdded = player.nome;
  }
  renderPlayers();
  renderTeam();
  updateMetrics();
}

/* ───────── Team Size ───────── */
function setTeamSize(size) {
  state.teamSize = size;
  while (state.selected.size > state.teamSize) {
    const first = state.selected.keys().next().value;
    state.selected.delete(first);
  }
  renderPlayers();
  renderTeam();
  updateRules();
  updateMetrics();
}

/* ───────── Rules ───────── */
function updateRules() {
  if (!state.config) return;
  const rules = state.config.regras_por_tamanho;
  const key = state.teamSize === 4 ? '4_jogadores' : '6_jogadores';
  const r = rules[key];
  if (els.ruleMaxTotal) els.ruleMaxTotal.textContent = r.pontuacao_maxima_total;
  if (els.ruleBase) els.ruleBase.textContent = r.rank_baseado_em;
  if (els.ruleFormula) els.ruleFormula.textContent = r.calculo;
}

/* ───────── Metrics ───────── */
function sum(arr) { return arr.reduce((a, b) => a + b, 0); }

function getRankByAverage(media) {
  if (!state.config) return '—';
  const bands = state.config.faixas_de_rank;
  for (const [letter, range] of Object.entries(bands)) {
    if (media >= range.min && media <= range.max) return letter;
  }
  return '—';
}

function updateMetrics() {
  if (!state.config) return;
  const team = [...state.selected.values()];
  const scores = team.map(p => p.pontuacao);
  const soma = sum(scores);
  const media = team.length ? soma / state.teamSize : 0;
  const rank = getRankByAverage(media);

  if (els.metricSoma) els.metricSoma.textContent = soma.toFixed(0);
  if (els.metricMedia) els.metricMedia.textContent = media.toFixed(2);
  if (els.metricRank) els.metricRank.textContent = rank;

  if (els.resultCard) els.resultCard.classList.remove('reveal');

  if (team.length < state.teamSize) {
    if (els.resultRank) els.resultRank.textContent = '—';
    if (els.resultPhrase) els.resultPhrase.textContent = `Selecione ${state.teamSize} jogadores para ver o rank.`;
  } else {
    if (els.resultRank) els.resultRank.textContent = rank;
    if (els.resultPhrase) els.resultPhrase.textContent = rankPhrases[rank] || '—';
    if (els.resultCard) els.resultCard.classList.add('reveal');

    // Rank cutscene overlay with per-rank styling
    const letterEl = document.getElementById('rankOverlayLetter');
    const phraseEl = document.getElementById('rankOverlayPhrase');
    const overlay = document.getElementById('rankOverlay');
    if (letterEl && overlay) {
      // Remove previous rank classes
      overlay.className = 'rank-overlay';
      
      // Set content
      letterEl.textContent = rank;
      if (phraseEl) phraseEl.textContent = rankPhrases[rank] || '';
      
      // Add rank-specific class for colors/effects
      overlay.classList.add(`rank-${rank}`, 'show');
      
      // Auto-hide after animation
      setTimeout(() => {
        overlay.classList.remove('show');
      }, 2000);
    }
  }
}

/* ───────── Auto Team ───────── */
function autoTop() {
  const top = [...state.players].sort((a, b) => b.pontuacao - a.pontuacao).slice(0, state.teamSize);
  state.selected.clear();
  top.forEach(p => state.selected.set(p.nome, p));
  renderPlayers();
  renderTeam();
  updateMetrics();
}

function autoRandom() {
  const shuffled = [...state.players].sort(() => Math.random() - 0.5);
  const pick = shuffled.slice(0, state.teamSize);
  state.selected.clear();
  pick.forEach(p => state.selected.set(p.nome, p));
  renderPlayers();
  renderTeam();
  updateMetrics();
}

function clearSelection() {
  state.selected.clear();
  renderPlayers();
  renderTeam();
  updateMetrics();
}

/* ───────── Events ───────── */
function initEvents() {
  if (els.sizePicker) {
    els.sizePicker.addEventListener('change', (e) => {
      const v = Number(e.target.value);
      if (v === 4 || v === 6) setTeamSize(v);
    });
  }
  if (els.searchInput) els.searchInput.addEventListener('input', renderPlayers);
  if (els.btnAutoTop) els.btnAutoTop.addEventListener('click', autoTop);
  if (els.btnAutoRandom) els.btnAutoRandom.addEventListener('click', autoRandom);
  if (els.btnLimpar) els.btnLimpar.addEventListener('click', clearSelection);

  // Ripple effect
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  // Enter key adds first player
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && els.playersList) {
      const first = els.playersList.querySelector('.player-row');
      if (first) {
        const name = first.dataset.name;
        const p = state.players.find(pp => pp.nome === name);
        if (p) togglePlayer(p);
      }
    }
  });
}

/* ───────── Intro Overlay ───────── */
function dismissIntro() {
  if (!els.introOverlay) return;
  els.introOverlay.classList.add('hide');
  setTimeout(() => els.introOverlay.remove(), 700);
}

function setupIntro() {
  if (!els.introOverlay) return;
  // Dismiss on click or any key
  els.introOverlay.addEventListener('click', dismissIntro);
  document.addEventListener('keydown', function handler() {
    dismissIntro();
    document.removeEventListener('keydown', handler);
  });
  // Auto dismiss after 3s if no interaction
  setTimeout(dismissIntro, 3000);
}

/* ───────── Init ───────── */
initEvents();
loadConfig();
setupIntro();
