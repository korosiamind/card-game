let G = {};
let phase = 'play'; // 'play' | 'selectSpellTarget' | 'selectAttackTarget'
let selectedCardUid = null;
let selectedCreatureUid = null;
let pendingSpell = null;
let pendingHeroSpell = null; // { creature, spellIdx } when hero casts from field
let heroPanel = null;        // { pi, uid } — open hero action panel

// ─── GAME MODE & AI ──────────────────────────────────────────────────────────

let gameMode     = 'pvp';
let aiDifficulty = 'medium';
let aiThinking   = false;
const AI_PLAYER  = 1;

// ─── ONLINE MULTIPLAYER ───────────────────────────────────────────────────────

let onlineMode      = false;
let onlineRole      = null;   // 'host' | 'guest'
let myPlayerIndex   = 0;
let socket          = null;
let guestDeckBuffer = null;   // host stores guest deck before both are ready
let myDeckBuffer    = null;   // guest stores own deck before game init received

// ─── DECK BUILDER STATE ───────────────────────────────────────────────────────

const deckBuilder = {
  playerIndex:     0,
  selectedSchools: [],
  selectedHeroes:  [],
  selectedSpells:  [],
  playerDecks:     [[], []],
  step:            'school',
};

// ─── START SCREEN ─────────────────────────────────────────────────────────────

let _selectedMode = null;
let _selectedDiff = null;

function showStartScreen() {
  document.getElementById('startScreen').classList.remove('hidden');
  document.getElementById('deckEditor').classList.add('hidden');
  document.getElementById('gameOver').classList.add('hidden');
  document.getElementById('waitingScreen').classList.add('hidden');
  _selectedMode = null;
  _selectedDiff = null;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('diffRow').classList.add('hidden');
  document.getElementById('onlineRow').classList.add('hidden');
  document.getElementById('joinRow').classList.add('hidden');
  document.getElementById('startBtn').classList.add('hidden');
}

function selectMode(mode) {
  _selectedMode = mode;
  document.getElementById('modePvp').classList.toggle('selected', mode === 'pvp');
  document.getElementById('modePve').classList.toggle('selected', mode === 'pve');
  document.getElementById('modeOnline').classList.toggle('selected', mode === 'online');

  document.getElementById('diffRow').classList.add('hidden');
  document.getElementById('onlineRow').classList.add('hidden');
  document.getElementById('joinRow').classList.add('hidden');
  document.getElementById('startBtn').classList.add('hidden');
  _selectedDiff = null;

  if (mode === 'pve') {
    document.getElementById('diffRow').classList.remove('hidden');
  } else if (mode === 'online') {
    document.getElementById('onlineRow').classList.remove('hidden');
  } else {
    document.getElementById('startBtn').classList.remove('hidden');
  }
}

function showJoinInput() {
  document.getElementById('joinRow').classList.remove('hidden');
  document.getElementById('joinCodeInput').focus();
}

function selectDiff(diff) {
  _selectedDiff = diff;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById(`diff${diff[0].toUpperCase() + diff.slice(1)}`).classList.add('selected');
  document.getElementById('startBtn').classList.remove('hidden');
}

function startGame() {
  if (!_selectedMode) return;
  if (_selectedMode === 'pve' && !_selectedDiff) return;
  gameMode     = _selectedMode;
  aiDifficulty = _selectedDiff || 'medium';
  document.getElementById('startScreen').classList.add('hidden');
  deckBuilder.playerDecks = [[], []];
  showDeckEditor(0);
}

// ─── ONLINE MULTIPLAYER LOGIC ─────────────────────────────────────────────────

function startOnlineHost() {
  onlineMode    = true;
  onlineRole    = 'host';
  myPlayerIndex = 0;
  connectWebSocket(() => {
    socket.send(JSON.stringify({ type: 'host' }));
  });
}

function startOnlineGuest() {
  const code = document.getElementById('joinCodeInput').value.trim();
  if (code.length !== 4) return;
  onlineMode    = true;
  onlineRole    = 'guest';
  myPlayerIndex = 1;
  connectWebSocket(() => {
    socket.send(JSON.stringify({ type: 'join', code }));
  });
}

function connectWebSocket(onOpen) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  socket = new WebSocket(`${proto}://${location.host}`);
  let everConnected = false;
  socket.onopen = () => { everConnected = true; onOpen(); };
  socket.onmessage = e => handleSocketMessage(JSON.parse(e.data));
  socket.onerror = () => {};
  socket.onclose = () => {
    if (!onlineMode) return;
    if (!everConnected) {
      alert('Не удалось подключиться к серверу.\n\nЗапустите сервер командой в терминале:\n  node server.js');
    } else {
      alert('Соединение потеряно');
    }
    cancelOnline();
  };
}

function handleSocketMessage(msg) {
  if (msg.type === 'room_created') {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('waitingScreen').classList.remove('hidden');
    document.getElementById('waitingTitle').textContent = 'Ожидание противника';
    document.getElementById('waitingCodeBlock').classList.remove('hidden');
    document.getElementById('roomCodeDisplay').textContent = msg.code;
    document.getElementById('waitingStatus').textContent = '';
  }

  else if (msg.type === 'joined') {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('waitingScreen').classList.remove('hidden');
    document.getElementById('waitingTitle').textContent = 'Подключено!';
    document.getElementById('waitingCodeBlock').classList.add('hidden');
    document.getElementById('waitingStatus').textContent = 'Собираем колоду...';
    setTimeout(() => {
      document.getElementById('waitingScreen').classList.add('hidden');
      deckBuilder.playerDecks = [[], []];
      showDeckEditor(myPlayerIndex);
    }, 800);
  }

  else if (msg.type === 'opponent_ready') {
    document.getElementById('waitingStatus').textContent = 'Противник подключился! Собираем колоду...';
    setTimeout(() => {
      document.getElementById('waitingScreen').classList.add('hidden');
      deckBuilder.playerDecks = [[], []];
      showDeckEditor(myPlayerIndex);
    }, 800);
  }

  else if (msg.type === 'deck') {
    if (onlineRole === 'host') {
      guestDeckBuffer = msg.deck;
      if (myDeckBuffer) startOnlineGame();
    } else {
      // Guest already initialized from 'init' message
    }
  }

  else if (msg.type === 'init') {
    // Guest receives initial game state from host
    G = msg.state;
    document.getElementById('deckEditor').classList.add('hidden');
    document.getElementById('waitingScreen').classList.add('hidden');
    render();
  }

  else if (msg.type === 'state') {
    G = msg.state;
    render();
  }

  else if (msg.type === 'opponent_disconnected') {
    alert('Противник отключился');
    cancelOnline();
  }

  else if (msg.type === 'error') {
    alert(msg.text);
    cancelOnline();
  }
}

function relayToOpponent(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'relay', payload }));
}

function syncState() {
  relayToOpponent({ type: 'state', state: JSON.parse(JSON.stringify(G)) });
}

function startOnlineGame() {
  deckBuilder.playerDecks[0] = myDeckBuffer;
  deckBuilder.playerDecks[1] = guestDeckBuffer;
  gameMode = 'online';
  document.getElementById('deckEditor').classList.add('hidden');
  document.getElementById('waitingScreen').classList.add('hidden');
  initGame();
  relayToOpponent({ type: 'init', state: JSON.parse(JSON.stringify(G)) });
}

function cancelOnline() {
  onlineMode = false;
  onlineRole = null;
  myPlayerIndex = 0;
  guestDeckBuffer = null;
  myDeckBuffer = null;
  if (socket) { socket.close(); socket = null; }
  showStartScreen();
}

// ─── DECK EDITOR ──────────────────────────────────────────────────────────────

function showDeckEditor(pi) {
  deckBuilder.playerIndex     = pi;
  deckBuilder.selectedSchools = [];
  deckBuilder.selectedHeroes  = [];
  deckBuilder.selectedSpells  = [];
  deckBuilder.step            = 'school';
  deckBuilder.mode            = 'manual';

  const name = (gameMode === 'pve' && pi === 0) ? 'Ваша колода' : `Игрок ${pi + 1}`;
  document.getElementById('dePlayerName').textContent = name;
  document.getElementById('deckEditor').classList.remove('hidden');
  renderDeckEditor();
}

function renderDeckEditor() {
  const { step } = deckBuilder;

  // Progress
  ['school','hero','spell'].forEach((s, i) => {
    const el = document.getElementById(`progStep${i + 1}`);
    el.classList.toggle('active', step === s);
    el.classList.toggle('done',
      (i === 0 && (step === 'hero' || step === 'spell')) ||
      (i === 1 && step === 'spell'));
  });
  document.getElementById('progLine12').classList.toggle('done', step === 'hero' || step === 'spell');
  document.getElementById('progLine23').classList.toggle('done', step === 'spell');

  document.getElementById('deStepSchool').classList.toggle('hidden', step !== 'school');
  document.getElementById('deStepHero').classList.toggle('hidden',   step !== 'hero');
  document.getElementById('deStepSpell').classList.toggle('hidden',  step !== 'spell');

  if (step === 'school')     renderSchoolStep();
  else if (step === 'hero')  renderHeroStep();
  else                       renderSpellStep();
}

// ─── STEP 1: FACTIONS ─────────────────────────────────────────────────────────

function renderSchoolStep() {
  // Sync mode buttons and panels
  const isManual = deckBuilder.mode !== 'preset';
  document.getElementById('deModeManual').classList.toggle('active', isManual);
  document.getElementById('deModePreset').classList.toggle('active', !isManual);
  document.getElementById('deSchoolArea').classList.toggle('hidden', !isManual);
  document.getElementById('dePresetArea').classList.toggle('hidden', isManual);
  if (!isManual) { renderPresetStep(); return; }

  const { selectedSchools } = deckBuilder;
  document.getElementById('deSchoolCards').innerHTML = Object.values(SCHOOLS).map(s => {
    const sel    = selectedSchools.includes(s.id);
    const locked = !sel && selectedSchools.length >= 2;
    return `<div class="de-school-card${sel ? ' selected' : ''}${locked ? ' locked' : ''}"
                 data-school="${s.id}"
                 onclick="${locked ? '' : `pickSchool('${s.id}')`}"
                 style="${sel ? `border-color:${s.color};box-shadow:0 12px 32px ${s.color}33` : ''}">
      <img class="de-school-img" src="${s.img}" alt="">
      <div class="de-school-name" style="color:${s.color}">${s.name}</div>
      <div class="de-school-tagline">${s.tagline}</div>
      <div class="de-school-desc">${s.description}</div>
      ${sel ? '<div class="de-school-check">✓</div>' : ''}
    </div>`;
  }).join('');
}

function selectDeckMode(mode) {
  deckBuilder.mode = mode;
  renderSchoolStep();
}

function renderPresetStep() {
  document.getElementById('dePresetGrid').innerHTML = PRESET_DECKS.map(p => {
    const s1 = SCHOOLS[p.schools[0]];
    const s2 = SCHOOLS[p.schools[1]];
    return `<div class="de-preset-card" onclick="pickPreset('${p.id}')">
      <div class="de-preset-art">${p.art}</div>
      <div class="de-preset-name">${p.name}</div>
      <div class="de-preset-schools">
        <span style="color:${s1.color}">${s1.name}</span>
        <span style="color:#888"> + </span>
        <span style="color:${s2.color}">${s2.name}</span>
      </div>
      <div class="de-preset-tagline">${p.tagline}</div>
      <div class="de-preset-desc">${p.description}</div>
    </div>`;
  }).join('');
}

function pickPreset(id) {
  const preset = PRESET_DECKS.find(p => p.id === id);
  if (!preset) return;
  confirmDeck(preset.cards);
}

function pickSchool(id) {
  const { selectedSchools } = deckBuilder;
  const idx = selectedSchools.indexOf(id);
  if (idx >= 0) {
    selectedSchools.splice(idx, 1);
    renderSchoolStep();
  } else if (selectedSchools.length < 2) {
    selectedSchools.push(id);
    renderSchoolStep();
    if (selectedSchools.length === 2) setTimeout(goToHeroStep, 320);
  }
}

function goToHeroStep() {
  deckBuilder.step = 'hero';
  renderDeckEditor();
}

function goBackToSchoolStep() {
  deckBuilder.step = 'school';
  renderDeckEditor();
}

// ─── STEP 2: HEROES ───────────────────────────────────────────────────────────

function renderHeroStep() {
  const { selectedSchools, selectedHeroes } = deckBuilder;
  const heroes = Object.values(CARD_DEFS)
    .filter(c => c.type === 'hero' && selectedSchools.includes(c.school))
    .sort((a, b) => a.school.localeCompare(b.school) || a.cost - b.cost);

  document.getElementById('deHeroGrid').innerHTML = heroes.map(card => {
    const picked   = selectedHeroes.includes(card.id);
    const disabled = !picked && selectedHeroes.length >= 3;
    return dePickCardHTML(card, picked ? 1 : 0, 1, picked, disabled,
      `pickHero('${card.id}')`, '');
  }).join('');

  const cnt = selectedHeroes.length;
  document.getElementById('deHeroBadge').textContent = `${cnt}/3`;
  document.getElementById('deHeroNextBtn').disabled = cnt !== 3;
}

function pickHero(id) {
  const { selectedHeroes } = deckBuilder;
  const idx = selectedHeroes.indexOf(id);
  if (idx >= 0) selectedHeroes.splice(idx, 1);
  else if (selectedHeroes.length < 3) selectedHeroes.push(id);
  renderHeroStep();
}

function goToSpellStep() {
  deckBuilder.step = 'spell';
  renderDeckEditor();
}

function goBackToHeroStep() {
  deckBuilder.step = 'hero';
  renderDeckEditor();
}

// ─── STEP 3: SPELLS ───────────────────────────────────────────────────────────

function renderSpellStep() {
  const { selectedSchools, selectedSpells } = deckBuilder;
  const spells = Object.values(CARD_DEFS)
    .filter(c => c.type === 'spell' && selectedSchools.includes(c.school) && !c.disabled)
    .sort((a, b) => a.school.localeCompare(b.school) || a.cost - b.cost);

  const counts = {};
  selectedSpells.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
  const total = selectedSpells.length;

  document.getElementById('deSpellGrid').innerHTML = spells.map(card => {
    const count    = counts[card.id] || 0;
    const picked   = count > 0;
    const disabled = count >= 2 || (total >= 17 && count === 0);
    return dePickCardHTML(card, count, 2, picked, disabled,
      `pickSpell('${card.id}')`, count > 0 ? `removeSpell('${card.id}')` : '');
  }).join('');

  document.getElementById('deSpellBadge').textContent = `${total}/17`;
  document.getElementById('deConfirmBtn').disabled = total !== 17;
}

function pickSpell(id) {
  const { selectedSpells } = deckBuilder;
  if (selectedSpells.filter(s => s === id).length >= 2) return;
  if (selectedSpells.length >= 17) return;
  selectedSpells.push(id);
  renderSpellStep();
}

function removeSpell(id) {
  const idx = deckBuilder.selectedSpells.lastIndexOf(id);
  if (idx >= 0) deckBuilder.selectedSpells.splice(idx, 1);
  renderSpellStep();
}

// ─── PICK CARD HTML ────────────────────────────────────────────────────────────

function dePickCardHTML(card, count, maxCount, picked, disabled, addFn, removeFn) {
  const isHero  = card.type === 'hero';
  const subtype = card.subtype || '';
  const cls = [
    'card',
    isHero ? 'creature hero' : `spell${subtype ? ' sub-' + subtype : ''}`,
    card.image ? 'has-image' : '',
    picked   ? 'de-picked'        : '',
    disabled ? 'de-pick-disabled' : '',
  ].filter(Boolean).join(' ');

  const onClick    = disabled ? '' : `onclick="${addFn}"`;
  const checkBadge = (picked && maxCount === 1)
    ? '<div class="de-pick-check">✓</div>' : '';
  const countBadge = maxCount > 1
    ? `<div class="de-pick-count${count === maxCount ? ' max' : ''}">${count}/${maxCount}</div>` : '';
  const removeBtn  = (removeFn && count > 0)
    ? `<div class="de-pick-remove" onclick="event.stopPropagation();${removeFn}">−</div>` : '';

  const spellLines = isHero && card.spells?.length
    ? `<hr style="border:none;border-top:1px solid rgba(200,162,40,0.3);margin:5px 0"><b>Заклинания:</b>` +
      card.spells.map(s => `<div style="margin:3px 0"><b>${s.art || ''}${s.name}</b> 💎${s.cost}<br><span style="opacity:0.75">${s.description}</span></div>`).join('')
    : '';
  const pickTooltip = isHero
    ? `<div class="tooltip"><b>${card.name}</b><br>💎 ${card.cost} · ⚔ ${card.attack} · ❤ ${card.hp}<hr style="border:none;border-top:1px solid rgba(200,162,40,0.3);margin:5px 0">${card.description}${spellLines}</div>`
    : `<div class="tooltip"><b>${card.name}</b><br>💎 ${card.cost}<hr style="border:none;border-top:1px solid rgba(200,162,40,0.3);margin:5px 0">${card.description}</div>`;

  if (card.image) {
    return `<div class="${cls}" ${onClick}>
      <img class="card-custom-art" src="${encodeURI(card.image)}" alt="${card.name}">
      <span class="ci-cost">${card.cost}</span>
      ${isHero ? `<span class="ci-atk">${card.attack}</span><span class="ci-hp">${card.hp}</span>` : ''}
      <div class="ci-text">
        <div class="ci-name">${card.name}</div>
        <div class="ci-desc">${card.description}</div>
      </div>
      ${pickTooltip}${checkBadge}${countBadge}${removeBtn}
    </div>`;
  }

  const body = isHero
    ? `<div class="card-header"><div class="card-mana">${card.cost}</div><div class="card-name">${card.name}</div></div>
       <div class="card-art">${card.art}</div>
       <div class="card-desc">⚔ ${card.attack} ❤ ${card.hp}</div>
       <div class="card-desc" style="height:auto;padding-bottom:6px;font-size:8.5px">${card.description}</div>`
    : `<div class="card-header"><div class="card-mana">${card.cost}</div><div class="card-name">${card.name}</div></div>
       <div class="card-art">${card.art}</div>
       <div class="card-desc">${card.description}</div>`;

  return `<div class="${cls}" ${onClick}>${body}${pickTooltip}${checkBadge}${countBadge}${removeBtn}</div>`;
}

// ─── CONFIRM DECK ──────────────────────────────────────────────────────────────

function confirmDeck(overrideDeck) {
  const deck = overrideDeck ?? [...deckBuilder.selectedHeroes, ...deckBuilder.selectedSpells];
  if (deck.length !== 20) return;
  deckBuilder.playerDecks[deckBuilder.playerIndex] = deck;

  if (onlineMode) {
    if (onlineRole === 'host') {
      myDeckBuffer = deck;
      relayToOpponent({ type: 'deck', deck });
      if (guestDeckBuffer) {
        startOnlineGame();
      } else {
        document.getElementById('deckEditor').classList.add('hidden');
        document.getElementById('waitingScreen').classList.remove('hidden');
        document.getElementById('waitingTitle').textContent = 'Ожидание колоды противника...';
        document.getElementById('waitingCodeBlock').classList.add('hidden');
        document.getElementById('waitingStatus').textContent = '';
      }
    } else {
      relayToOpponent({ type: 'deck', deck });
      document.getElementById('deckEditor').classList.add('hidden');
      document.getElementById('waitingScreen').classList.remove('hidden');
      document.getElementById('waitingTitle').textContent = 'Ожидание начала игры...';
      document.getElementById('waitingCodeBlock').classList.add('hidden');
      document.getElementById('waitingStatus').textContent = '';
    }
    return;
  }

  if (gameMode === 'pvp' && deckBuilder.playerIndex === 0) {
    const overlay = document.createElement('div');
    overlay.className = 'turnOverlay';
    overlay.innerHTML = `
      <div class="turnOverlayBox">
        <h2>Игрок 1 собрал колоду</h2>
        <p>Передайте устройство Игроку 2</p>
        <button onclick="this.closest('.turnOverlay').remove(); showDeckEditor(1);">
          Готов!
        </button>
      </div>`;
    document.body.appendChild(overlay);
  } else {
    document.getElementById('deckEditor').classList.add('hidden');
    initGame();
  }
}

function restartGame() {
  document.getElementById('gameOver').classList.add('hidden');
  deckBuilder.playerDecks = [[], []];
  showDeckEditor(0);
}

// ─── AI DECK GENERATION ────────────────────────────────────────────────────────

function aiGenerateDeck() {
  const schoolMap = {
    easy:   ['light', 'order'],
    medium: ['dark',  'chaos'],
    hard:   ['dark',  'chaos'],
  };
  const [s1, s2] = schoolMap[aiDifficulty] || ['dark', 'chaos'];
  return aiSelectDeck(s1, s2);
}

function limitHeroesInDeck(cardIds) {
  const seenHeroes = new Set();
  return cardIds.filter(id => {
    if (CARD_DEFS[id]?.type === 'hero') {
      if (seenHeroes.has(id) || seenHeroes.size >= 3) return false;
      seenHeroes.add(id);
    }
    return true;
  });
}

function aiSelectDeck(school1, school2) {
  const available = Object.values(CARD_DEFS)
    .filter(c => (c.school === school1 || c.school === school2) && !c.disabled);

  if (aiDifficulty === 'hard') {
    const scored = available.map(c => ({
      id: c.id,
      score: (c.type === 'creature' || c.type === 'hero')
        ? (c.attack + c.hp) / c.cost + (c.passiveValue || 0) * 1.2
        : (c.value || 0) / c.cost
    })).sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 15).map(x => x.id);
    const deck = [];
    top.forEach(id => { deck.push(id, id); });
    return limitHeroesInDeck(shuffle(deck));
  }

  const pool = [];
  available.forEach(c => { pool.push(c.id, c.id); });
  return limitHeroesInDeck(shuffle(pool).slice(0, 30));
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

function initGame() {
  const diffLabel = { easy: 'лёгкий', medium: 'средний', hard: 'сложный' }[aiDifficulty];
  const p2name = gameMode === 'pve' ? `🤖 ИИ (${diffLabel})` : 'Игрок 2';
  const p2deck = gameMode === 'pve' ? aiGenerateDeck() : deckBuilder.playerDecks[1];

  G = {
    players: [
      makePlayer(0, 'Игрок 1', deckBuilder.playerDecks[0]),
      makePlayer(1, p2name,    p2deck)
    ],
    currentPlayer: 0,
    turn: 1,
    gameOver: false,
    winner: null
  };
  phase = 'play';
  selectedCardUid = null;
  selectedCreatureUid = null;
  pendingSpell = null;
  aiThinking = false;

  // Heroes go to heroHand (permanent roster); deal 6 spells to regular hand
  for (let pi = 0; pi < 2; pi++) {
    const p = G.players[pi];
    p.heroHand = p.deck.filter(c => c.type === 'hero');
    p.deck     = p.deck.filter(c => c.type !== 'hero');
    for (let i = 0; i < 6 && p.deck.length > 0; i++) p.hand.push(p.deck.shift());
  }
  G.players[0].maxMana = 3; G.players[0].mana = 3;
  G.players[1].maxMana = 3; G.players[1].mana = 3;

  document.getElementById('gameOver').classList.add('hidden');
  render();
}

function makePlayer(id, name, deckList) {
  return {
    id, name, hp: 30, maxHp: 30, shield: 0, mana: 0, maxMana: 0,
    heroHand: [], hand: [], field: [], deck: buildDeckFromList(deckList), curses: [], graveyard: []
  };
}

// ─── CARD DRAWING ─────────────────────────────────────────────────────────────

function drawCard(pi) {
  const p = G.players[pi];
  if (p.deck.length === 0) { applyDamageToPlayer(pi, 2); return; }
  if (p.hand.length >= 6)  { p.deck.shift(); return; }
  p.hand.push(p.deck.shift());
}

// ─── TURN MANAGEMENT ──────────────────────────────────────────────────────────

function endTurn() {
  if (G.gameOver) return;
  if (aiThinking) return;
  if (onlineMode && G.currentPlayer !== myPlayerIndex) return;
  cancelSelection();

  const next = 1 - G.currentPlayer;
  G.currentPlayer = next;
  G.players[next].maxMana = Math.min(G.players[next].maxMana + 1, 10);
  G.players[next].mana = G.players[next].maxMana;
  if (next === 0) G.turn++;

  G.players[next].field.forEach(c => {
    c.hasAttacked = false;
    if (!c.canAttack) c.canAttack = true;
  });

  applyStartOfTurnEffects(next);

  const drawCount = 6 - G.players[next].hand.length;
  for (let i = 0; i < drawCount; i++) drawCard(next);

  checkGameOver();
  if (!G.gameOver) {
    if (gameMode === 'pve' && next === AI_PLAYER) {
      render();
      runAiTurn();
    } else {
      render();
      if (onlineMode) syncState();
    }
  } else {
    render();
    if (onlineMode) syncState();
  }
}

function applyStartOfTurnEffects(pi) {
  const p   = G.players[pi];
  const opp = G.players[1 - pi];

  // Hero curses
  p.curses = p.curses.filter(curse => {
    applyDamageToPlayer(pi, curse.value);
    curse.turnsLeft--;
    return curse.turnsLeft > 0;
  });

  // Creature curses
  p.field.forEach(c => {
    c.curses = c.curses.filter(curse => {
      hurtCreature(c, curse.value);
      curse.turnsLeft--;
      return curse.turnsLeft > 0;
    });
  });
  removeDeadCreatures(pi);

  // Tick hero spell cooldowns
  p.field.forEach(c => {
    if (c.spells) c.spells.forEach(s => { if (s.currentCooldown > 0) s.currentCooldown--; });
  });

  // Passives
  [...p.field].forEach(c => applyPassive(c, pi));
  removeDeadCreatures(pi);
  removeDeadCreatures(1 - pi);
}

function hurtCreature(c, amount) {
  if (amount <= 0) return;
  c.currentHp -= amount;
  if (c.onDamage === 'rage') c.currentAttack += 1;
}

function applyPassive(creature, ownerPi) {
  const owner = G.players[ownerPi];
  const opp   = G.players[1 - ownerPi];
  if (!creature.passive) return;

  switch (creature.passive) {
    case 'healHero':
      owner.hp = Math.min(owner.hp + creature.passiveValue, owner.maxHp);
      break;
    case 'healSelf':
      creature.currentHp = Math.min(creature.currentHp + creature.passiveValue, creature.maxHp);
      break;
    case 'healAllCreatures':
      owner.field.forEach(c => {
        c.currentHp = Math.min(c.currentHp + creature.passiveValue, c.maxHp);
      });
      break;
    case 'damageEnemy':
      applyDamageToPlayer(1 - ownerPi, creature.passiveValue);
      break;
    case 'shieldHero':
      owner.shield += creature.passiveValue;
      break;
    case 'damageAllEnemyCreatures':
      opp.field.forEach(c => { hurtCreature(c, creature.passiveValue); });
      break;
    case 'buffAllCreatures':
      owner.field.forEach(c => { c.currentAttack += creature.passiveValue; });
      break;
    case 'massHealAll':
      owner.hp = Math.min(owner.hp + creature.passiveValue, owner.maxHp);
      owner.field.forEach(c => { c.currentHp = Math.min(c.currentHp + creature.passiveValue, c.maxHp); });
      break;
    case 'divineAura':
      owner.hp = Math.min(owner.hp + creature.passiveValue, owner.maxHp);
      owner.field.forEach(c => { c.currentAttack += 1; });
      break;
    case 'warAura':
      owner.field.forEach(c => {
        c.currentAttack += creature.passiveValue;
        c.currentHp = Math.min(c.currentHp + 1, c.maxHp);
      });
      break;
    case 'darkDrain':
      applyDamageToPlayer(1 - ownerPi, creature.passiveValue);
      creature.currentHp = Math.min(creature.currentHp + creature.passiveValue, creature.maxHp);
      break;
    case 'shadowStorm':
      opp.field.forEach(c => { hurtCreature(c, creature.passiveValue); });
      applyDamageToPlayer(1 - ownerPi, creature.passiveValue);
      break;
    case 'bloodlust':
      creature.currentAttack += creature.passiveValue;
      break;
    case 'maintainShield':
      owner.shield = Math.max(owner.shield, creature.passiveValue);
      break;
  }
}

function removeDeadCreatures(pi) {
  const p = G.players[pi];
  p.field.filter(c => c.currentHp <= 0).forEach(c => {
    showDeathGhost(creatureEl(pi, c.uid));
    p.graveyard.push(c);
  });
  p.field = p.field.filter(c => c.currentHp > 0);
}

// ─── PLAYING CARDS ────────────────────────────────────────────────────────────

const AUTO_TARGET_SUBTYPES = new Set([
  'aoeAll', 'aoeCreatures', 'massCurse', 'massBuffAtk', 'resurrection'
]);

function handleCardClick(uid) {
  if (G.gameOver) return;
  if (aiThinking || (gameMode === 'pve' && G.currentPlayer === AI_PLAYER)) return;
  if (onlineMode && G.currentPlayer !== myPlayerIndex) return;
  const cp = G.currentPlayer;
  const p  = G.players[cp];
  const card = p.hand.find(c => c.uid === uid);
  if (!card) return;
  if (p.mana < card.cost) return;
  if (phase !== 'play') { cancelSelection(); render(); return; }

  if (card.type === 'creature' || card.type === 'hero') {
    if (p.field.filter(f => f.type === 'hero').length >= 3) return;
    if (p.field.length >= 6) return;
    playCreature(cp, card);
    if (onlineMode) syncState();
  } else if (card.target === 'self' || AUTO_TARGET_SUBTYPES.has(card.subtype)) {
    playInstantSpell(cp, card);
    if (onlineMode) syncState();
  } else {
    selectedCardUid = uid;
    pendingSpell    = card;
    phase           = 'selectSpellTarget';
  }
  render();
}

function playCreature(pi, card) {
  const p = G.players[pi];
  p.mana -= card.cost;
  const defSpells = CARD_DEFS[card.id]?.spells;
  p.field.push({
    id: card.id, uid: card.uid, name: card.name, cost: card.cost, type: card.type,
    attack: card.attack, currentAttack: card.attack,
    hp: card.hp, maxHp: card.hp, currentHp: card.hp,
    passive: card.passive || null, passiveValue: card.passiveValue || 0,
    onAttack: card.onAttack || null, onDamage: card.onDamage || null,
    description: card.description, art: card.art, image: card.image || null,
    canAttack: false, hasAttacked: false, curses: [], owner: pi,
    spells: defSpells ? defSpells.map(s => ({ ...s, currentCooldown: 0 })) : undefined,
  });
  if (card.battlecry === 'summonKnights') {
    const slots = 6 - p.field.length;
    for (let i = 0; i < Math.min(3, slots); i++) {
      p.field.push({
        id: 'knightToken', uid: `kt_${Date.now()}_${i}`,
        name: 'Рыцарь', type: 'token', cost: 0,
        attack: 2, currentAttack: 2, hp: 2, maxHp: 2, currentHp: 2,
        passive: null, passiveValue: 0, onAttack: null, onDamage: null,
        description: 'Призван Маршалом', art: '⚔️', image: null,
        canAttack: false, hasAttacked: false, curses: [], owner: pi
      });
    }
  }

  p.hand = p.hand.filter(c => c.uid !== card.uid);
  render();
  const uid = card.uid;
  setTimeout(() => pulseEl(creatureEl(pi, uid), 'anim-play', 520), 0);
}

function playHeroFromHeroHand(pi, card) {
  const p = G.players[pi];
  p.mana -= card.cost;
  const defSpells = CARD_DEFS[card.id]?.spells;
  const fieldUid = `${card.id}_f_${Date.now()}`;
  p.field.push({
    id: card.id, uid: fieldUid, name: card.name, cost: card.cost, type: card.type,
    attack: card.attack, currentAttack: card.attack,
    hp: card.hp, maxHp: card.hp, currentHp: card.hp,
    passive: card.passive || null, passiveValue: card.passiveValue || 0,
    onAttack: card.onAttack || null, onDamage: card.onDamage || null,
    description: card.description, art: card.art, image: card.image || null,
    canAttack: false, hasAttacked: false, curses: [], owner: pi,
    spells: defSpells ? defSpells.map(s => ({ ...s, currentCooldown: 0 })) : undefined,
  });
  if (card.battlecry === 'summonKnights') {
    const slots = 6 - p.field.length;
    for (let i = 0; i < Math.min(3, slots); i++) {
      p.field.push({
        id: 'knightToken', uid: `kt_${Date.now()}_${i}`,
        name: 'Рыцарь', type: 'token', cost: 0,
        attack: 2, currentAttack: 2, hp: 2, maxHp: 2, currentHp: 2,
        passive: null, passiveValue: 0, onAttack: null, onDamage: null,
        description: 'Призван Маршалом', art: '⚔️', image: null,
        canAttack: false, hasAttacked: false, curses: [], owner: pi
      });
    }
  }
  // heroHand card stays — no removal
  render();
  setTimeout(() => pulseEl(creatureEl(pi, fieldUid), 'anim-play', 520), 0);
}

function handleHeroHandClick(heroId) {
  if (G.gameOver) return;
  if (aiThinking || (gameMode === 'pve' && G.currentPlayer === AI_PLAYER)) return;
  if (onlineMode && G.currentPlayer !== myPlayerIndex) return;
  const cp = G.currentPlayer;
  const p  = G.players[cp];
  const card = p.heroHand.find(c => c.id === heroId);
  if (!card) return;
  if (p.mana < card.cost) return;
  if (phase !== 'play') { cancelSelection(); render(); return; }
  if (p.field.some(f => f.id === heroId)) return;
  if (p.field.length >= 6) return;
  playHeroFromHeroHand(cp, card);
  if (onlineMode) syncState();
}

function playInstantSpell(pi, card) {
  const p   = G.players[pi];
  const opp = G.players[1 - pi];
  p.mana -= card.cost;
  p.hand  = p.hand.filter(c => c.uid !== card.uid);
  showSpellCast(card);

  const heroEl = document.getElementById(`p${pi + 1}Hero`);

  switch (card.subtype) {
    case 'heal':
      p.hp = Math.min(p.hp + card.value, p.maxHp);
      showFloatOnEl(heroEl, `+${card.value}`, 'heal');
      break;

    case 'shield':
      p.shield += card.value;
      showFloatOnEl(heroEl, `🛡${card.value}`, 'shield-num');
      break;

    case 'massBuffAtk':
      p.field.forEach(c => { c.currentAttack += card.value; });
      showFloatOnEl(heroEl, `+${card.value}⚔`, 'heal');
      break;

    case 'aoeAll':
      [0, 1].forEach(side => {
        G.players[side].field.forEach(c => {
          showFloatOnEl(creatureEl(side, c.uid), `-${card.value}`, 'damage');
          pulseEl(creatureEl(side, c.uid), 'anim-hit', 450);
          hurtCreature(c, card.value);
        });
        removeDeadCreatures(side);
      });
      break;

    case 'aoeCreatures':
      opp.field.forEach(c => {
        showFloatOnEl(creatureEl(1 - pi, c.uid), `-${card.value}`, 'damage');
        pulseEl(creatureEl(1 - pi, c.uid), 'anim-hit', 450);
        c.currentHp -= card.value;
      });
      removeDeadCreatures(1 - pi);
      break;

    case 'massCurse':
      opp.field.forEach(c => {
        c.curses.push({ value: card.value, turnsLeft: card.duration });
      });
      break;

    case 'resurrection': {
      const yard = p.graveyard;
      if (yard.length > 0 && p.field.filter(f => f.type === 'hero').length < 3) {
        const dead = yard[yard.length - 1];
        yard.splice(yard.length - 1, 1);
        const revived = {
          ...dead,
          currentHp: dead.hp, maxHp: dead.hp,
          currentAttack: dead.attack,
          canAttack: false, hasAttacked: false,
          curses: [],
          uid: `${dead.id}_rev_${Math.random().toString(36).slice(2)}`
        };
        p.field.push(revived);
        setTimeout(() => pulseEl(creatureEl(pi, revived.uid), 'anim-play', 520), 50);
      }
      break;
    }
  }
  checkGameOver();
  render();
}

// ─── TARGETING ────────────────────────────────────────────────────────────────

function handleHeroClick(pi) {
  if (G.gameOver) return;
  if (aiThinking || (gameMode === 'pve' && G.currentPlayer === AI_PLAYER)) return;
  if (onlineMode && G.currentPlayer !== myPlayerIndex) return;
  const cp = G.currentPlayer;

  if (phase === 'selectSpellTarget') {
    if (pendingHeroSpell && pi !== cp) {
      const { creature, spellIdx } = pendingHeroSpell;
      const spell = creature.spells[spellIdx];
      const validHero = spell.target === 'any' || spell.target === 'enemyHero' || spell.target === 'allEnemies';
      if (validHero) {
        resolveHeroSpell(cp, pi, 'hero', creature, spellIdx);
        cancelSelection();
        if (onlineMode) syncState();
      }
    } else if (pendingSpell && !pendingHeroSpell && pi !== cp) {
      const spell = pendingSpell;
      const validHero = spell.target === 'any' || spell.target === 'enemyHero' || spell.target === 'allEnemies';
      if (validHero) {
        resolveSpellOnHero(cp, pi, spell);
        cancelSelection();
        if (onlineMode) syncState();
      }
    }

  } else if (phase === 'selectAttackTarget' && pi !== cp) {
    const hasTaunt = G.players[pi].field.some(c => c.passive === 'taunt');
    if (hasTaunt) { render(); return; }
    const attacker = G.players[cp].field.find(c => c.uid === selectedCreatureUid);
    if (attacker) {
      const atkUid = attacker.uid;
      attacker.hasAttacked = true;
      const dmg = attacker.currentAttack;
      applyDamageToPlayer(pi, dmg);
      if (attacker.onAttack === 'lifesteal' && dmg > 0) {
        const heal = Math.ceil(dmg / 2);
        attacker.currentHp = Math.min(attacker.currentHp + heal, attacker.maxHp);
        showFloatOnEl(creatureEl(cp, atkUid), `+${heal}`, 'heal');
      }
      checkGameOver();
      setTimeout(() => pulseEl(creatureEl(cp, atkUid), 'anim-attack', 420), 0);
    }
    cancelSelection();
    if (onlineMode) syncState();
  }
  render();
}

function handleCreatureClick(pi, uid) {
  if (G.gameOver) return;
  if (aiThinking || (gameMode === 'pve' && G.currentPlayer === AI_PLAYER)) return;
  if (onlineMode && G.currentPlayer !== myPlayerIndex && phase === 'play') return;
  const cp = G.currentPlayer;

  if (phase === 'selectSpellTarget') {
    const isOwn   = pi === cp;
    const isEnemy = pi !== cp;
    if (pendingHeroSpell) {
      const { creature, spellIdx } = pendingHeroSpell;
      const spell = creature.spells[spellIdx];
      if (spell.target === 'any' ||
          (spell.target === 'friendlyCreature' && isOwn) ||
          (spell.target === 'enemyCreature'    && isEnemy) ||
          (spell.target === 'allEnemies'       && isEnemy)) {
        resolveHeroSpell(cp, pi, uid, creature, spellIdx);
        cancelSelection();
        if (onlineMode) syncState();
      }
    } else if (pendingSpell) {
      const spell = pendingSpell;
      if (spell.target === 'any' ||
          (spell.target === 'friendlyCreature' && isOwn) ||
          (spell.target === 'enemyCreature'    && isEnemy) ||
          (spell.target === 'allEnemies'       && isEnemy)) {
        resolveSpellOnCreature(cp, pi, uid, spell);
        cancelSelection();
        if (onlineMode) syncState();
      }
    }

  } else if (phase === 'selectAttackTarget' && pi !== cp) {
    const attacker = G.players[cp].field.find(c => c.uid === selectedCreatureUid);
    const defender = G.players[pi].field.find(c => c.uid === uid);
    const tauntCreatures = G.players[pi].field.filter(c => c.passive === 'taunt');
    if (tauntCreatures.length > 0 && defender?.passive !== 'taunt') { render(); return; }
    if (attacker && defender) {
      const atkEl  = creatureEl(cp, attacker.uid);
      const defEl  = creatureEl(pi, defender.uid);
      const atkDmg = attacker.currentAttack;
      const defDmg = defender.currentAttack;
      const atkUid = attacker.uid;

      showFloatOnEl(defEl, `-${atkDmg}`, 'damage');
      if (defDmg > 0) showFloatOnEl(atkEl, `-${defDmg}`, 'damage');
      pulseEl(defEl, 'anim-hit', 450);

      attacker.hasAttacked = true;
      hurtCreature(defender, atkDmg);
      hurtCreature(attacker, defDmg);

      if (attacker.onAttack === 'lifesteal' && atkDmg > 0) {
        const heal = Math.ceil(atkDmg / 2);
        attacker.currentHp = Math.min(attacker.currentHp + heal, attacker.maxHp);
        showFloatOnEl(atkEl, `+${heal}`, 'heal');
      }

      removeDeadCreatures(cp);
      removeDeadCreatures(pi);

      setTimeout(() => pulseEl(creatureEl(cp, atkUid), 'anim-attack', 420), 0);
    }
    cancelSelection();
    if (onlineMode) syncState();

  } else if (phase === 'play' && pi === cp) {
    const creature = G.players[cp].field.find(c => c.uid === uid);
    if (!creature) return;
    if (creature.type === 'hero' && creature.spells?.length) {
      if (heroPanel?.uid === uid) { closeHeroPanel(); return; }
      openHeroPanel(pi, uid);
      return;
    }
    if (!creature.canAttack || creature.hasAttacked) return;
    selectedCreatureUid = uid;
    phase = 'selectAttackTarget';
  }
  render();
}

function resolveSpellOnHero(casterPi, targetPi, spell) {
  const caster = G.players[casterPi];
  caster.mana -= spell.cost;
  caster.hand  = caster.hand.filter(c => c.uid !== spell.uid);
  showSpellCast(spell);

  if (spell.subtype === 'damage' || spell.subtype === 'aoe') {
    applyDamageToPlayer(targetPi, spell.value);
    if (spell.subtype === 'aoe') {
      G.players[targetPi].field.forEach(c => {
        showFloatOnEl(creatureEl(targetPi, c.uid), `-${spell.value}`, 'damage');
        hurtCreature(c, spell.value);
      });
      removeDeadCreatures(targetPi);
    }
  } else if (spell.subtype === 'curse') {
    G.players[targetPi].curses.push({ value: spell.value, turnsLeft: spell.duration });
  }
  checkGameOver();
  pendingSpell = null;
}

function resolveSpellOnCreature(casterPi, targetPi, targetUid, spell) {
  const caster   = G.players[casterPi];
  const creature = G.players[targetPi].field.find(c => c.uid === targetUid);
  if (!creature) return;
  caster.mana -= spell.cost;
  caster.hand  = caster.hand.filter(c => c.uid !== spell.uid);
  showSpellCast(spell);

  const defEl = creatureEl(targetPi, creature.uid);

  switch (spell.subtype) {
    case 'damage':
    case 'aoe':
      showFloatOnEl(defEl, `-${spell.value}`, 'damage');
      pulseEl(defEl, 'anim-hit', 450);
      hurtCreature(creature, spell.value);
      removeDeadCreatures(targetPi);
      break;

    case 'buff':
      creature.currentAttack += spell.value;
      showFloatOnEl(defEl, `+${spell.value}⚔`, 'heal');
      break;

    case 'hpbuff':
      creature.currentHp += spell.value;
      creature.maxHp     += spell.value;
      showFloatOnEl(defEl, `+${spell.value}❤`, 'heal');
      break;

    case 'fullbuff':
      creature.currentAttack += spell.value;
      creature.currentHp     += spell.value;
      creature.maxHp         += spell.value;
      showFloatOnEl(defEl, `+${spell.value}/+${spell.value}`, 'heal');
      break;

    case 'drain': {
      showFloatOnEl(defEl, `-${spell.value}`, 'damage');
      pulseEl(defEl, 'anim-hit', 450);
      hurtCreature(creature, spell.value);
      removeDeadCreatures(targetPi);
      const heroEl = document.getElementById(`p${casterPi + 1}Hero`);
      G.players[casterPi].hp = Math.min(G.players[casterPi].hp + spell.value, G.players[casterPi].maxHp);
      showFloatOnEl(heroEl, `+${spell.value}`, 'heal');
      break;
    }

    case 'creatureCurse':
      creature.curses.push({ value: spell.value, turnsLeft: spell.duration });
      break;
  }
  pendingSpell = null;
}

function applyDamageToPlayer(pi, amount) {
  const p      = G.players[pi];
  const heroEl = document.getElementById(`p${pi + 1}Hero`);

  const absorbed = Math.min(p.shield, amount);
  p.shield -= absorbed;
  const dmg = amount - absorbed;
  p.hp = Math.max(0, p.hp - dmg);

  if (dmg > 0) {
    showFloatOnEl(heroEl, `-${dmg}`, 'damage');
    pulseEl(heroEl, 'anim-hit', 500);
    if (dmg >= 3) screenFlash('red');
  }
  if (absorbed > 0) showFloatOnEl(heroEl, `🛡${absorbed}`, 'shield-num');
}

function handleHeroSpellClick(pi, heroUid, spellIdx) {
  if (G.gameOver) return;
  if (aiThinking || (gameMode === 'pve' && G.currentPlayer === AI_PLAYER)) return;
  const cp = G.currentPlayer;
  if (pi !== cp) return;
  if (phase !== 'play') { cancelSelection(); }

  const creature = G.players[cp].field.find(c => c.uid === heroUid);
  if (!creature || creature.type !== 'hero') return;
  if (creature.hasAttacked) return;

  const spell = creature.spells?.[spellIdx];
  if (!spell || spell.currentCooldown > 0) return;
  if (G.players[cp].mana < spell.cost) return;

  const needsTarget = spell.target === 'any' || spell.target === 'enemyCreature' || spell.target === 'friendlyCreature';
  if (needsTarget) {
    pendingHeroSpell = { creature, spellIdx };
    pendingSpell = spell;
    phase = 'selectSpellTarget';
  } else {
    resolveHeroSpell(cp, null, null, creature, spellIdx);
  }
  render();
}

function resolveHeroSpell(casterPi, targetPi, targetUid, creature, spellIdx) {
  const spell  = creature.spells[spellIdx];
  const p      = G.players[casterPi];
  const oppPi  = 1 - casterPi;
  const opp    = G.players[oppPi];
  const heroEl = document.getElementById(`p${casterPi + 1}Hero`);

  p.mana -= spell.cost;
  creature.hasAttacked = true;
  spell.currentCooldown = spell.cooldown;

  showSpellCast(spell);

  switch (spell.subtype) {
    case 'heal':
      p.hp = Math.min(p.hp + spell.value, p.maxHp);
      showFloatOnEl(heroEl, `+${spell.value}`, 'heal');
      break;

    case 'shield':
      p.shield += spell.value;
      showFloatOnEl(heroEl, `🛡${spell.value}`, 'shield-num');
      break;

    case 'massHealAll':
      p.hp = Math.min(p.hp + spell.value, p.maxHp);
      p.field.forEach(c => { c.currentHp = Math.min(c.currentHp + spell.value, c.maxHp); });
      showFloatOnEl(heroEl, `+${spell.value}`, 'heal');
      break;

    case 'massBuffAtk':
      p.field.forEach(c => { c.currentAttack += spell.value; });
      showFloatOnEl(heroEl, `+${spell.value}⚔`, 'heal');
      break;

    case 'massBuff':
      p.field.forEach(c => {
        c.currentAttack += spell.value;
        c.currentHp     += spell.value;
        c.maxHp         += spell.value;
      });
      showFloatOnEl(heroEl, `+${spell.value}/+${spell.value}`, 'heal');
      break;

    case 'massHpBuff':
      p.field.forEach(c => {
        c.currentHp += spell.value;
        c.maxHp     += spell.value;
      });
      showFloatOnEl(heroEl, `+${spell.value}❤`, 'heal');
      break;

    case 'selfBuff':
      creature.currentAttack += spell.value;
      showFloatOnEl(creatureEl(casterPi, creature.uid), `+${spell.value}⚔`, 'heal');
      break;

    case 'heroSelfAttack': {
      const dmg = creature.currentAttack;
      applyDamageToPlayer(oppPi, dmg);
      break;
    }

    case 'aoeCreatures':
      opp.field.forEach(c => {
        showFloatOnEl(creatureEl(oppPi, c.uid), `-${spell.value}`, 'damage');
        pulseEl(creatureEl(oppPi, c.uid), 'anim-hit', 450);
        hurtCreature(c, spell.value);
      });
      removeDeadCreatures(oppPi);
      break;

    case 'aoeAll':
      [0, 1].forEach(side => {
        G.players[side].field.forEach(c => {
          showFloatOnEl(creatureEl(side, c.uid), `-${spell.value}`, 'damage');
          pulseEl(creatureEl(side, c.uid), 'anim-hit', 450);
          hurtCreature(c, spell.value);
        });
        removeDeadCreatures(side);
      });
      break;

    case 'aoe':
      applyDamageToPlayer(oppPi, spell.value);
      opp.field.forEach(c => {
        showFloatOnEl(creatureEl(oppPi, c.uid), `-${spell.value}`, 'damage');
        pulseEl(creatureEl(oppPi, c.uid), 'anim-hit', 450);
        hurtCreature(c, spell.value);
      });
      removeDeadCreatures(oppPi);
      break;

    case 'damage':
      if (targetUid === 'hero' || spell.target === 'enemyHero') {
        applyDamageToPlayer(targetPi ?? oppPi, spell.value);
      } else if (targetUid) {
        const tc = G.players[targetPi].field.find(c => c.uid === targetUid);
        if (tc) {
          showFloatOnEl(creatureEl(targetPi, tc.uid), `-${spell.value}`, 'damage');
          pulseEl(creatureEl(targetPi, tc.uid), 'anim-hit', 450);
          hurtCreature(tc, spell.value);
          removeDeadCreatures(targetPi);
        }
      }
      break;

    case 'drain':
      if (targetUid) {
        const tc = G.players[targetPi].field.find(c => c.uid === targetUid);
        if (tc) {
          showFloatOnEl(creatureEl(targetPi, tc.uid), `-${spell.value}`, 'damage');
          pulseEl(creatureEl(targetPi, tc.uid), 'anim-hit', 450);
          hurtCreature(tc, spell.value);
          removeDeadCreatures(targetPi);
          p.hp = Math.min(p.hp + spell.value, p.maxHp);
          showFloatOnEl(heroEl, `+${spell.value}`, 'heal');
        }
      }
      break;

    case 'creatureCurse':
      if (targetUid) {
        const tc = G.players[targetPi].field.find(c => c.uid === targetUid);
        if (tc) tc.curses.push({ value: spell.value, turnsLeft: spell.duration });
      }
      break;

    case 'resurrection': {
      const yard = p.graveyard;
      if (yard.length > 0 && p.field.length < 6) {
        const dead    = yard[yard.length - 1];
        yard.splice(yard.length - 1, 1);
        const revived = {
          ...dead,
          currentHp: dead.hp, maxHp: dead.hp, currentAttack: dead.attack,
          canAttack: false, hasAttacked: false, curses: [],
          uid: `${dead.id}_rev_${Math.random().toString(36).slice(2)}`
        };
        p.field.push(revived);
        setTimeout(() => pulseEl(creatureEl(casterPi, revived.uid), 'anim-play', 520), 50);
      }
      break;
    }

    case 'summonToken':
      if (p.field.length < 6) {
        const token = {
          id: 'knightToken', uid: `kt_${Date.now()}_spell`,
          name: 'Рыцарь', type: 'token', cost: 0,
          attack: 2, currentAttack: 2, hp: 2, maxHp: 2, currentHp: 2,
          passive: null, passiveValue: 0, onAttack: null, onDamage: null,
          description: 'Призван Маршалом', art: '⚔️', image: null,
          canAttack: false, hasAttacked: false, curses: [], owner: casterPi
        };
        p.field.push(token);
        setTimeout(() => pulseEl(creatureEl(casterPi, token.uid), 'anim-play', 520), 50);
      }
      break;
  }

  pendingHeroSpell = null;
  checkGameOver();
}

function openHeroPanel(pi, uid) {
  heroPanel = { pi, uid };
  renderHeroPanel();
}

function closeHeroPanel() {
  heroPanel = null;
  const el = document.getElementById('heroPanelEl');
  if (el) el.remove();
}

function renderHeroPanel() {
  const el = document.getElementById('heroPanelEl');
  if (el) el.remove();
  if (!heroPanel) return;

  const { pi, uid } = heroPanel;
  const p   = G.players[pi];
  const c   = p.field.find(x => x.uid === uid);
  if (!c) return;

  const cp      = G.currentPlayer;
  const isOwn   = pi === cp;
  const canAtk  = isOwn && c.canAttack && !c.hasAttacked;

  const spellRows = (c.spells || []).map((s, i) => {
    const onCd    = s.currentCooldown > 0;
    const noMana  = p.mana < s.cost;
    const canCast = isOwn && !onCd && !noMana && !c.hasAttacked;
    let statusNote = '';
    if (onCd)           statusNote = `⏳ Перезарядка: ${s.currentCooldown} хода`;
    else if (noMana)    statusNote = `❌ Нет маны (нужно ${s.cost})`;
    else if (c.hasAttacked) statusNote = '❌ Герой уже действовал';
    const cls   = canCast ? 'hp-spell hp-spell-on' : 'hp-spell hp-spell-off';
    const click = canCast ? `onclick="closeHeroPanel();handleHeroSpellClick(${pi},'${uid}',${i})"` : '';
    return `<div class="${cls}" ${click}>
      <div class="hps-icon">${s.art}</div>
      <div class="hps-info">
        <div class="hps-name">${s.name}</div>
        <div class="hps-desc">${statusNote || s.description}</div>
      </div>
      <div class="hps-cost ${onCd ? 'hps-cd' : ''}">${onCd ? `⏳${s.currentCooldown}` : `💎${s.cost}`}</div>
    </div>`;
  }).join('');

  const atkCls  = canAtk ? 'hp-atk-btn' : 'hp-atk-btn hp-atk-off';
  const atkText = !c.canAttack ? '💤 Не готов к атаке' : c.hasAttacked ? '✓ Уже атаковал' : '⚔️ Атаковать';
  const atkClick = canAtk ? `onclick="closeHeroPanel();startHeroAttack(${pi},'${uid}')"` : '';

  const wrap = document.createElement('div');
  wrap.id = 'heroPanelEl';
  wrap.innerHTML = `
    <div class="hp-backdrop" onclick="closeHeroPanel()"></div>
    <div class="hp-panel">
      <div class="hp-header">
        <span class="hp-hart">${c.art}</span>
        <div class="hp-htitle">
          <div class="hp-hname">${c.name}</div>
          <div class="hp-hdesc">${c.description}</div>
        </div>
        <button class="hp-close" onclick="closeHeroPanel()">✕</button>
      </div>
      <div class="hp-spells">${spellRows || '<div class="hp-no-spells">Нет заклинаний</div>'}</div>
      <div class="hp-footer">
        <button class="${atkCls}" ${atkClick}>${atkText}</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
}

function startHeroAttack(pi, uid) {
  selectedCreatureUid = uid;
  phase = 'selectAttackTarget';
  render();
}

function cancelSelection() {
  phase               = 'play';
  selectedCardUid     = null;
  selectedCreatureUid = null;
  pendingSpell        = null;
  pendingHeroSpell    = null;
  closeHeroPanel();
}

function checkGameOver() {
  for (let i = 0; i < 2; i++) {
    if (G.players[i].hp <= 0) {
      G.gameOver = true;
      document.getElementById('winnerText').textContent =
        `🏆 ${G.players[1 - i].name} победил!`;
      document.getElementById('gameOver').classList.remove('hidden');
      return;
    }
  }
}

// ─── TURN TRANSITION OVERLAY ──────────────────────────────────────────────────

function showTurnTransition(playerName) {
  render();
  const isPve = gameMode === 'pve';
  const overlay = document.createElement('div');
  overlay.className = 'turnOverlay';
  overlay.innerHTML = `
    <div class="turnOverlayBox">
      <h2>${isPve ? '🤖 Ход компьютера завершён' : 'Ход завершён'}</h2>
      <p>${isPve ? 'Ваш ход!' : `Передайте устройство<br>${playerName}`}</p>
      <button onclick="this.closest('.turnOverlay').remove(); render();">
        ${isPve ? '⚔ К битве!' : 'Готов!'}
      </button>
    </div>`;
  document.body.appendChild(overlay);
}

// ─── RENDERING ────────────────────────────────────────────────────────────────

function applyHandFan(pi) {
  const hand  = document.getElementById(`p${pi + 1}Hand`);
  const cards = [...hand.children];
  const n     = cards.length;
  const MAX_ROT = 12;
  cards.forEach((card, i) => {
    const t   = n <= 1 ? 0 : (i / (n - 1)) * 2 - 1;
    const rot = (t * MAX_ROT).toFixed(2);
    card.style.setProperty('--card-rot', `${rot}deg`);
    const midDist = Math.abs(i - (n - 1) / 2);
    card.style.zIndex = String(Math.round(n - midDist));
  });
}

function render() {
  // Flip board for P2 perspective: online guest OR hotseat P2 turn
  const isP2View = onlineMode
    ? (myPlayerIndex === 1)
    : (gameMode === 'pvp' && G.currentPlayer === 1);
  document.getElementById('game').classList.toggle('game-p2', isP2View);

  // Update sidebar "Вы / Противник" labels to match current perspective
  const ownLabel = isP2View ? 'Противник' : 'Вы';
  const oppLabel = isP2View ? 'Вы' : 'Противник';
  document.querySelector('#hs-own .hs-label').textContent   = ownLabel;
  document.querySelector('#hs-enemy .hs-label').textContent = oppLabel;

  [0, 1].forEach(renderPlayer);
  [0, 1].forEach(renderField);
  [0, 1].forEach(applyHandFan);
  renderStatus();
  highlightTargets();
}

function renderPlayer(pi) {
  const p  = G.players[pi];
  const px = `p${pi + 1}`;
  const cp = G.currentPlayer;

  document.getElementById(`${px}Hp`).textContent   = p.hp;
  const hpMaxEl = document.getElementById(`${px}HpMax`);
  if (hpMaxEl) hpMaxEl.textContent = `/${p.maxHp}`;
  const hpBarEl = document.getElementById(`${px}HpBar`);
  if (hpBarEl) hpBarEl.style.width = `${Math.max(0, p.hp / p.maxHp * 100)}%`;
  document.getElementById(`${px}Mana`).textContent  = `💎 ${p.mana}/${p.maxMana}`;
  document.getElementById(`${px}Deck`).textContent  = `📚 ${p.deck.length}`;

  const shieldEl = document.getElementById(`${px}Shield`);
  if (p.shield > 0) {
    shieldEl.classList.remove('hidden');
    document.getElementById(`${px}ShieldVal`).textContent = p.shield;
  } else {
    shieldEl.classList.add('hidden');
  }

  document.getElementById(`${px}Curses`).innerHTML =
    p.curses.map(c => `<div class="curse-tag">💀${c.value}/ход × ${c.turnsLeft}</div>`).join('');

  const hpBadge = document.getElementById(`${px}HpBadge`);
  if (hpBadge) {
    hpBadge.style.borderColor = p.hp <= 10 ? '#cc2020' : '#3a5aaa';
    hpBadge.style.boxShadow   = p.hp <= 10
      ? '0 5px 14px rgba(0,0,0,0.8), 0 0 14px rgba(200,30,30,0.4)' : '';
  }
  document.getElementById(`${px}Hero`).classList.toggle('low-hp', p.hp <= 10);

  const handEl = document.getElementById(`${px}Hand`);
  const showCards = onlineMode
    ? (pi === myPlayerIndex)
    : (pi === cp && !(gameMode === 'pve' && pi === AI_PLAYER));
  if (!showCards) {
    handEl.innerHTML = p.hand.map(() => `<div class="card-back">🂠</div>`).join('');
  } else {
    handEl.innerHTML = p.hand.map(card => cardHTML(card, p.mana)).join('');
  }

  const heroHandEl = document.getElementById(`${px}HeroHand`);
  if (heroHandEl) {
    const showHeroArt = gameMode === 'pve'
      ? true
      : (onlineMode ? (pi === myPlayerIndex) : (pi === cp));
    if (!showHeroArt) {
      heroHandEl.innerHTML = p.heroHand.map(() => `<div class="card-back">🂠</div>`).join('');
    } else {
      const isActive = onlineMode
        ? (pi === myPlayerIndex && pi === cp)
        : (pi === cp && !(gameMode === 'pve' && pi === AI_PLAYER));
      heroHandEl.innerHTML = p.heroHand.map(card => heroHandCardHTML(card, p, isActive)).join('');
    }
  }
}

function heroHandCardHTML(card, p, isActive) {
  const onField    = p.field.some(f => f.id === card.id);
  const affordable = p.mana >= card.cost;
  let cls = 'card creature hero has-image hh-card';
  if (onField)          cls += ' hh-on-field';
  else if (!affordable) cls += ' unaffordable';
  const onclick = (isActive && !onField) ? `onclick="handleHeroHandClick('${card.id}')"` : '';

  const tooltipBase = `<b>${card.name}</b><br>💎 ${card.cost} · ⚔ ${card.attack} · ❤ ${card.hp}<hr style="border:none;border-top:1px solid rgba(200,162,40,0.3);margin:5px 0">${card.description}`;
  const spellLines  = card.spells?.length
    ? `<hr style="border:none;border-top:1px solid rgba(200,162,40,0.3);margin:5px 0"><b>Заклинания:</b>` +
      card.spells.map(s => `<div style="margin:2px 0"><b>${s.art || ''}${s.name}</b> 💎${s.cost}<br><span style="opacity:0.75;font-size:11px">${s.description}</span></div>`).join('')
    : '';
  const onFieldBadge = onField ? '<div class="hh-on-field-badge">В бою</div>' : '';

  if (card.image) {
    return `<div class="${cls}" ${onclick}>
      <img class="card-custom-art" src="${encodeURI(card.image)}" alt="${card.name}">
      <span class="ci-cost">${card.cost}</span>
      <div class="ci-text"><div class="ci-name">${card.name}</div></div>
      ${onFieldBadge}<div class="tooltip">${tooltipBase}${spellLines}</div>
    </div>`;
  }
  return `<div class="${cls}" ${onclick}>
    <div style="font-size:16px;margin:auto">${card.art || '⚔'}</div>
    <div style="font-size:8px;text-align:center;padding:1px 2px;color:#c8d8ee">${card.name}</div>
    ${onFieldBadge}<div class="tooltip">${tooltipBase}${spellLines}</div>
  </div>`;
}

function cardHTML(card, mana) {
  const affordable = mana >= card.cost;
  const selected   = card.uid === selectedCardUid;
  let cls = `card ${card.type}`;
  if (card.subtype) cls += ` sub-${card.subtype}`;
  if (!affordable)  cls += ' unaffordable';
  if (selected)     cls += ' selected';

  let tooltipHTML;
  if (card.type === 'hero') {
    const spellLines = card.spells?.length
      ? `<hr style="border:none;border-top:1px solid rgba(200,162,40,0.3);margin:5px 0"><b>Заклинания:</b>` +
        card.spells.map(s => `<div style="margin:3px 0"><b>${s.art || ''}${s.name}</b> 💎${s.cost}<br><span style="opacity:0.75;font-size:11px">${s.description}</span></div>`).join('')
      : '';
    tooltipHTML = `<b>${card.name}</b><br>💎 ${card.cost} · ⚔ ${card.attack} · ❤ ${card.hp}<hr style="border:none;border-top:1px solid rgba(200,162,40,0.3);margin:5px 0">${card.description}${spellLines}`;
  } else if (card.type === 'creature') {
    tooltipHTML = `<b>${card.name}</b><br>💎 ${card.cost} · ⚔ ${card.attack} · ❤ ${card.hp}<hr style="border:none;border-top:1px solid rgba(200,162,40,0.3);margin:5px 0">${card.description}`;
  } else {
    tooltipHTML = `<b>${card.name}</b><br>💎 ${card.cost}<hr style="border:none;border-top:1px solid rgba(200,162,40,0.3);margin:5px 0">${card.description}`;
  }

  if (card.image && card.type === 'spell') {
    return `<div class="${cls} has-image" onclick="handleCardClick('${card.uid}')">
      <img class="card-custom-art" src="${encodeURI(card.image)}" alt="${card.name}">
      <span class="ci-cost">${card.cost}</span>
      <div class="ci-text">
        <div class="ci-name">${card.name}</div>
        <div class="ci-desc">${card.description}</div>
      </div>
      <div class="tooltip">${tooltipHTML}</div>
    </div>`;
  }

  if (card.image) {
    return `<div class="${cls} has-image" onclick="handleCardClick('${card.uid}')">
      <img class="card-custom-art" src="${encodeURI(card.image)}" alt="${card.name}">
      <span class="ci-cost">${card.cost}</span>
      <span class="ci-atk">${card.attack}</span>
      <span class="ci-hp">${card.hp}</span>
      <div class="ci-text">
        <div class="ci-name">${card.name}</div>
        <div class="ci-desc">${card.description}</div>
      </div>
      <div class="tooltip">${tooltipHTML}</div>
    </div>`;
  }

  return `<div class="${cls}" onclick="handleCardClick('${card.uid}')">
    <div class="card-header">
      <div class="card-mana">${card.cost}</div>
      <div class="card-name">${card.name}</div>
    </div>
    <div class="card-art">${card.art}</div>
    <div class="card-desc">${card.description}</div>
    <div class="tooltip">${tooltipHTML}</div>
  </div>`;
}

function renderField(pi) {
  const p  = G.players[pi];
  const cp = G.currentPlayer;
  const el = document.getElementById(`p${pi + 1}Field`);

  el.innerHTML = p.field.map(c => {
    let cls = 'creature';
    if (c.type === 'hero') cls += ' hero-unit';
    if (c.image) cls += ' has-image';
    if (c.uid === selectedCreatureUid) cls += ' selected';
    if (pi === cp && c.canAttack && !c.hasAttacked && phase === 'play') cls += ' ready';
    if (!c.canAttack) cls += ' sleeping';
    else if (c.hasAttacked) cls += ' exhausted';
    if (c.passive === 'taunt') cls += ' taunt';

    const badges = [
      !c.canAttack        ? '<span class="c-badge">💤</span>' : '',
      c.curses.length > 0 ? '<span class="c-badge">🩸</span>' : '',
      c.passive === 'taunt' ? '<span class="c-badge taunt-badge" title="Насмешка">🗡️</span>' : ''
    ].join('');

    const inner = c.image
      ? `<img class="creature-custom-art" src="${encodeURI(c.image)}" alt="${c.name}">
         <span class="ci-cost">${c.cost}</span>
         <span class="ci-atk">${c.currentAttack}</span>
         <span class="ci-hp">${c.currentHp}</span>
         <div class="ci-text">
           <div class="ci-name">${c.name}</div>
           <div class="ci-desc">${c.description}</div>
         </div>`
      : `<div class="creature-name">${c.name}</div>
         <div class="creature-art">${c.art}</div>
         <div class="creature-desc">${c.description}</div>`;

    const tooltipBase = `<b>${c.name}</b><br>⚔ ${c.currentAttack} · ❤ ${c.currentHp}/${c.maxHp}<hr style="border:none;border-top:1px solid rgba(200,162,40,0.3);margin:6px 0">${c.description}`;
    const tooltipSpells = (c.type === 'hero' && c.spells?.length)
      ? `<hr style="border:none;border-top:1px solid rgba(200,162,40,0.3);margin:6px 0"><b>Заклинания:</b>` +
        c.spells.map(s => {
          const st = s.currentCooldown > 0 ? `⏳${s.currentCooldown}` : `💎${s.cost}`;
          return `<div style="margin:4px 0"><b>${s.art || ''}${s.name}</b> [${st}]<br><span style="opacity:0.75">${s.description}</span></div>`;
        }).join('')
      : '';
    const creatureDiv = `<div class="${cls}" data-uid="${c.uid}" onclick="handleCreatureClick(${pi}, '${c.uid}')">
      <div class="creature-badges">${badges}</div>
      ${inner}
      ${c.image ? '' : `<div class="cc-atk">${c.currentAttack}</div><div class="cc-hp">${c.currentHp}</div>`}
      <div class="tooltip">${tooltipBase}${tooltipSpells}</div>
    </div>`;

    let spellsDiv = '';
    if (c.type === 'hero' && c.spells?.length) {
      const isOwn = pi === cp;
      const dots  = c.spells.map(s => {
        const onCd   = s.currentCooldown > 0;
        const noMana = G.players[pi].mana < s.cost;
        const ready  = !onCd && !noMana && !c.hasAttacked;
        const cls    = onCd ? 'hsi-cd' : noMana ? 'hsi-nomana' : c.hasAttacked ? 'hsi-used' : 'hsi-ready';
        const label  = onCd ? `⏳${s.currentCooldown}` : `💎${s.cost}`;
        return `<div class="hero-spell-ind ${cls}" title="${s.name}: ${s.description}">
          <span class="hsi-art">${s.art}</span><span class="hsi-label">${label}</span>
        </div>`;
      }).join('');
      const hint = isOwn && !c.hasAttacked ? '<div class="hsi-hint">Клик → действия</div>' : '';
      spellsDiv = `<div class="hero-spells" onclick="event.stopPropagation()">${dots}${hint}</div>`;
    }

    return `<div class="creature-wrap">${creatureDiv}${spellsDiv}</div>`;
  }).join('');
}

function renderStatus() {
  const isMyTurn = !onlineMode || G.currentPlayer === myPlayerIndex;
  document.getElementById('turnInfo').textContent =
    `Ход ${G.turn} — ${G.players[G.currentPlayer].name}` +
    (onlineMode ? (isMyTurn ? ' (Ваш ход)' : ' (Ход противника)') : '');
  document.getElementById('endTurnBtn').disabled = !isMyTurn || aiThinking;

  if (aiThinking) return;

  let msg = '';
  if (phase === 'selectSpellTarget')
    msg = `Выберите цель для "${pendingSpell?.name}" (Esc — отмена)`;
  else if (phase === 'selectAttackTarget') {
    const c = G.players[G.currentPlayer].field.find(x => x.uid === selectedCreatureUid);
    msg = `Выберите цель для атаки "${c?.name}" (Esc — отмена)`;
  }

  const s = document.getElementById('statusMsg');
  s.textContent = msg;
  s.style.display = msg ? 'block' : 'none';
  s.className = '';
}

function highlightTargets() {
  document.querySelectorAll('.targetable').forEach(el => el.classList.remove('targetable'));
  const cp  = G.currentPlayer;
  const opp = 1 - cp;

  if (phase === 'selectSpellTarget' && pendingSpell) {
    const t = pendingSpell.target;
    if (t === 'any' || t === 'enemyHero' || t === 'allEnemies')
      document.getElementById(`p${opp + 1}Hero`).classList.add('targetable');
    if (t === 'any' || t === 'allEnemies' || t === 'enemyCreature')
      document.querySelectorAll(`#p${opp + 1}Field .creature`).forEach(el => el.classList.add('targetable'));
    if (t === 'any' || t === 'friendlyCreature')
      document.querySelectorAll(`#p${cp + 1}Field .creature`).forEach(el => el.classList.add('targetable'));

  } else if (phase === 'selectAttackTarget') {
    const tauntCreatures = G.players[opp].field.filter(c => c.passive === 'taunt');
    if (tauntCreatures.length > 0) {
      tauntCreatures.forEach(c => {
        const el = document.querySelector(`#p${opp + 1}Field [data-uid="${c.uid}"]`);
        if (el) el.classList.add('targetable');
      });
    } else {
      document.getElementById(`p${opp + 1}Hero`).classList.add('targetable');
      document.querySelectorAll(`#p${opp + 1}Field .creature`).forEach(el => el.classList.add('targetable'));
    }
  }
}

// ─── ANIMATION HELPERS ────────────────────────────────────────────────────────

function showFloatOnEl(el, text, type) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const f = document.createElement('div');
  f.className   = `float-num ${type}`;
  f.textContent = text;
  f.style.left  = (r.left + r.width / 2) + 'px';
  f.style.top   = (r.top + 12) + 'px';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1400);
}

function pulseEl(el, cls, ms = 500) {
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => { if (el) el.classList.remove(cls); }, ms);
}

function creatureEl(pi, uid) {
  return document.querySelector(`#p${pi + 1}Field [data-uid="${uid}"]`);
}

function showDeathGhost(el) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const g = document.createElement('div');
  g.className   = 'death-ghost';
  g.textContent = '💀';
  g.style.left  = (r.left + r.width  / 2) + 'px';
  g.style.top   = (r.top  + r.height / 2) + 'px';
  document.body.appendChild(g);
  setTimeout(() => g.remove(), 950);
}

function screenFlash(type) {
  const f = document.createElement('div');
  f.className = `screen-flash ${type}`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 500);
}

function showSpellCast(card) {
  const glowByType = {
    damage: '#ff4422', aoe: '#ff6633', aoeAll: '#ff8800', aoeCreatures: '#ff6622',
    heal: '#33ee77', shield: '#3388ff', buff: '#ffcc22', hpbuff: '#44ffaa',
    fullbuff: '#ffdd44', massBuffAtk: '#ffbb00',
    curse: '#bb44ff', creatureCurse: '#9922dd', massCurse: '#cc22ff',
    drain: '#aa22cc', resurrection: '#88ffcc',
  };
  const glow = glowByType[card.subtype] || '#c8a228';
  const el   = document.createElement('div');
  el.className = 'spell-cast-reveal';
  el.style.borderColor = glow + '99';
  el.style.boxShadow   = `0 0 100px rgba(0,0,0,0.95), 0 0 70px ${glow}30`;
  el.innerHTML = `
    <div class="spell-cast-art" style="filter:drop-shadow(0 0 28px ${glow}cc)">${card.art}</div>
    <div class="spell-cast-name">${card.name}</div>
    <div class="spell-cast-desc">${card.description}</div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

// ─── AI SYSTEM ────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function setAiStatus(msg) {
  const s = document.getElementById('statusMsg');
  s.textContent   = `🤖 ${msg}`;
  s.style.display = 'block';
  s.className     = 'ai-thinking';
}

async function runAiTurn() {
  aiThinking = true;
  document.getElementById('endTurnBtn').disabled = true;

  const delay = aiDifficulty === 'easy' ? 550 : aiDifficulty === 'medium' ? 750 : 1000;

  setAiStatus('Думает...');
  await sleep(delay);

  // Phase 1: Play cards
  let keepPlaying = true;
  while (keepPlaying && !G.gameOver) {
    const action = aiDecidePlay();
    if (!action) { keepPlaying = false; break; }
    setAiStatus(`Играет: ${action.card.name}`);
    await sleep(delay * 0.7);
    aiDoPlay(action);
    render();
    await sleep(delay * 0.8);
  }

  // Phase 1.5: Hero spells
  if (!G.gameOver) {
    for (const hero of [...G.players[AI_PLAYER].field]) {
      if (G.gameOver || hero.type !== 'hero' || hero.hasAttacked || !hero.spells) continue;
      for (let si = 0; si < hero.spells.length; si++) {
        const spell = hero.spells[si];
        if (spell.currentCooldown > 0) continue;
        if (G.players[AI_PLAYER].mana < spell.cost) continue;
        const tgt = aiHeroSpellTarget(spell, AI_PLAYER);
        if (tgt === null) continue;
        setAiStatus(`${hero.name}: ${spell.name}`);
        await sleep(delay * 0.6);
        resolveHeroSpell(AI_PLAYER, tgt.targetPi, tgt.targetUid, hero, si);
        render();
        await sleep(delay * 0.7);
        break; // hero.hasAttacked is now true
      }
    }
  }

  if (!G.gameOver) {
    await sleep(300);
    // Phase 2: Attack
    const readyAttackers = () =>
      [...G.players[AI_PLAYER].field].filter(c => c.canAttack && !c.hasAttacked);

    for (const attacker of readyAttackers()) {
      if (G.gameOver) break;
      const target = aiDecideAttack(attacker);
      if (!target) continue;
      const opp        = G.players[1 - AI_PLAYER];
      const targetName = target.type === 'hero'
        ? opp.name
        : (opp.field.find(c => c.uid === target.uid)?.name ?? '?');
      setAiStatus(`${attacker.name} атакует ${targetName}!`);
      await sleep(delay * 0.5);
      aiDoAttack(attacker, target);
      render();
      await sleep(delay * 0.9);
    }
  }

  aiThinking = false;
  document.getElementById('endTurnBtn').disabled = false;
  const s = document.getElementById('statusMsg');
  s.style.display = 'none';
  s.className = '';

  if (!G.gameOver) endTurn();
}

function aiHeroSpellTarget(spell, pi) {
  const opp = G.players[1 - pi];
  const p   = G.players[pi];

  // Skip pointless casts
  if (spell.subtype === 'resurrection'  && (p.graveyard.length === 0 || p.field.length >= 6)) return null;
  if (spell.subtype === 'summonToken'   && p.field.length >= 6) return null;
  if (spell.subtype === 'aoeCreatures'  && opp.field.length === 0) return null;
  if (spell.subtype === 'drain'         && opp.field.length === 0) return null;
  if (spell.subtype === 'creatureCurse' && opp.field.length === 0) return null;
  if (spell.subtype === 'heal'          && p.hp >= p.maxHp - 2)    return null;

  // Spells that need target selection
  if (spell.target === 'any') {
    if (aiDifficulty === 'hard' && spell.subtype === 'damage' && opp.field.length > 0) {
      const kill = opp.field.find(c => c.currentHp <= spell.value);
      if (kill) return { targetPi: 1 - pi, targetUid: kill.uid };
    }
    return { targetPi: 1 - pi, targetUid: 'hero' };
  }
  if (spell.target === 'enemyCreature') {
    if (opp.field.length === 0) return null;
    const threat = opp.field.reduce((b, c) => (!b || c.currentAttack > b.currentAttack) ? c : b, null);
    return { targetPi: 1 - pi, targetUid: threat.uid };
  }
  if (spell.target === 'friendlyCreature') {
    if (p.field.length === 0) return null;
    const best = p.field.reduce((b, c) => (!b || c.currentAttack > b.currentAttack) ? c : b, null);
    return { targetPi: pi, targetUid: best.uid };
  }

  // Auto-target
  return { targetPi: null, targetUid: null };
}

function aiDecidePlay() {
  const pi  = AI_PLAYER;
  const p   = G.players[pi];
  const opp = G.players[1 - pi];

  const canPlay = (c) => {
    if (c.cost > p.mana) return false;
    if (c.type === 'creature' || c.type === 'hero') return p.field.filter(f => f.type === 'hero').length < 3 && p.field.length < 6;
    if (c.target === 'friendlyCreature') return p.field.length > 0;
    if (c.target === 'enemyCreature')    return opp.field.length > 0;
    if (c.subtype === 'creatureCurse')   return opp.field.length > 0;
    if (c.subtype === 'drain')           return opp.field.length > 0;
    if (c.subtype === 'massCurse')       return opp.field.length > 0;
    if (c.subtype === 'massBuffAtk')     return p.field.length > 0;
    if (c.subtype === 'aoeCreatures')    return opp.field.length > 0;
    if (c.subtype === 'resurrection')    return p.graveyard.length > 0 && p.field.filter(f => f.type === 'hero').length < 3;
    return true;
  };

  const heroPlayable = p.heroHand.filter(c =>
    c.cost <= p.mana &&
    !p.field.some(f => f.id === c.id) &&
    p.field.length < 6
  );
  const playable = [...heroPlayable, ...p.hand.filter(canPlay)];
  if (playable.length === 0) return null;

  if (aiDifficulty === 'easy') {
    if (Math.random() > 0.72) return null;
    const card = playable[Math.floor(Math.random() * playable.length)];
    return { card, ...aiSpellTarget(card, pi, opp) };
  }

  let best = null, bestScore = aiDifficulty === 'hard' ? 0.5 : -Infinity;
  for (const card of playable) {
    const score = aiScoreCard(card, pi, opp);
    if (score > bestScore) { bestScore = score; best = card; }
  }
  if (!best) return null;
  return { card: best, ...aiSpellTarget(best, pi, opp) };
}

function aiScoreCard(card, pi, opp) {
  const p = G.players[pi];

  if (card.type === 'creature' || card.type === 'hero') {
    const eff     = (card.attack + card.hp) / card.cost;
    const passive = card.passive ? card.passiveValue * 1.5 : 0;
    return eff * 3 + passive;
  }

  switch (card.subtype) {
    case 'damage': {
      if (aiDifficulty === 'hard' && opp.hp - opp.shield <= card.value) return 999;
      return card.value * 1.8;
    }
    case 'aoe':
    case 'aoeCreatures': {
      if (aiDifficulty === 'hard' && card.subtype === 'aoe' && opp.hp - opp.shield <= card.value) return 999;
      return card.value * (opp.field.length + 1) * 1.3;
    }
    case 'aoeAll': {
      const netEnemies = opp.field.length - p.field.length;
      return card.value * (netEnemies + 0.5) * 1.5;
    }
    case 'heal': {
      const deficit = p.maxHp - p.hp;
      if (deficit <= 2) return 0;
      return Math.min(deficit, card.value) * (p.hp < 15 ? 2.5 : 0.6);
    }
    case 'shield':
      return card.value * (p.hp < 18 ? 1.8 : 0.6);
    case 'buff':
    case 'hpbuff':
      return p.field.length > 0 ? card.value * 3 : 0;
    case 'fullbuff':
      return p.field.length > 0 ? card.value * 5 : 0;
    case 'massBuffAtk':
      return p.field.length > 0 ? card.value * p.field.length * 2.5 : 0;
    case 'curse':
      return card.value * card.duration * 1.2;
    case 'massCurse':
      return opp.field.length > 0 ? card.value * card.duration * opp.field.length * 1.5 : 0;
    case 'creatureCurse': {
      if (opp.field.length === 0) return 0;
      const topThreat = Math.max(...opp.field.map(c => c.currentAttack));
      return card.value * card.duration * (topThreat >= 3 ? 2.2 : 0.8);
    }
    case 'drain':
      return opp.field.length > 0
        ? card.value * 2 + (p.hp < 15 ? card.value * 1.5 : 0)
        : 0;
    case 'resurrection':
      return p.graveyard.length > 0 && p.field.filter(f => f.type === 'hero').length < 3 ? 8 : 0;
    default: return 0;
  }
}

function aiSpellTarget(card, pi, opp) {
  const p = G.players[pi];
  if (card.type === 'creature' || card.type === 'hero') return {};
  if (card.target === 'self' || AUTO_TARGET_SUBTYPES.has(card.subtype)) return {};

  if (card.target === 'enemyHero')
    return { targetPi: 1 - pi, targetUid: 'hero' };
  if (card.target === 'allEnemies')
    return { targetPi: 1 - pi, targetUid: 'hero' };

  if (card.subtype === 'damage' || card.subtype === 'aoe') {
    if (aiDifficulty === 'hard' && opp.field.length > 0) {
      const kill = opp.field.find(c => c.currentHp <= card.value);
      if (kill) return { targetPi: 1 - pi, targetUid: kill.uid };
    }
    return { targetPi: 1 - pi, targetUid: 'hero' };
  }

  if (card.subtype === 'buff' || card.subtype === 'hpbuff' || card.subtype === 'fullbuff') {
    const best = p.field.reduce((b, c) => (!b || c.currentAttack > b.currentAttack) ? c : b, null);
    return best ? { targetPi: pi, targetUid: best.uid } : {};
  }

  if (card.subtype === 'drain' || card.target === 'enemyCreature' || card.subtype === 'creatureCurse') {
    const threat = opp.field.reduce((b, c) => (!b || c.currentAttack > b.currentAttack) ? c : b, null);
    return threat ? { targetPi: 1 - pi, targetUid: threat.uid } : {};
  }

  return { targetPi: 1 - pi, targetUid: 'hero' };
}

function aiDoPlay({ card, targetPi, targetUid }) {
  const pi = AI_PLAYER;
  const p  = G.players[pi];

  if (card.type === 'hero') { playHeroFromHeroHand(pi, card); return; }
  if (card.type === 'creature') { playCreature(pi, card); return; }
  if (card.target === 'self' || AUTO_TARGET_SUBTYPES.has(card.subtype)) {
    playInstantSpell(pi, card);
    return;
  }

  p.mana -= card.cost;
  p.hand  = p.hand.filter(c => c.uid !== card.uid);

  if (targetUid === 'hero' || targetUid == null) {
    resolveSpellOnHero(pi, targetPi ?? (1 - pi), card);
  } else {
    resolveSpellOnCreature(pi, targetPi, targetUid, card);
  }
}

function aiDecideAttack(attacker) {
  const pi  = AI_PLAYER;
  const opp = G.players[1 - pi];

  const tauntTargets = opp.field.filter(c => c.passive === 'taunt');
  if (tauntTargets.length > 0) {
    return { type: 'creature', uid: tauntTargets[0].uid };
  }

  if (aiDifficulty === 'easy') {
    const targets = [
      ...opp.field.map(c => ({ type: 'creature', uid: c.uid })),
      { type: 'hero' }
    ];
    return targets[Math.floor(Math.random() * targets.length)];
  }

  if (aiDifficulty === 'hard') {
    const totalAtk = G.players[pi].field
      .filter(c => c.canAttack && !c.hasAttacked)
      .reduce((s, c) => s + c.currentAttack, 0);
    if (totalAtk >= opp.hp - opp.shield) return { type: 'hero' };
  }

  const killable = opp.field
    .filter(c => c.currentHp <= attacker.currentAttack)
    .sort((a, b) => b.currentAttack - a.currentAttack)[0];
  if (killable) return { type: 'creature', uid: killable.uid };

  return { type: 'hero' };
}

function aiDoAttack(attacker, target) {
  const pi  = AI_PLAYER;
  const opp = 1 - pi;

  if (target.type === 'hero') {
    const atkUid = attacker.uid;
    attacker.hasAttacked = true;
    const dmg = attacker.currentAttack;
    applyDamageToPlayer(opp, dmg);
    if (attacker.onAttack === 'lifesteal' && dmg > 0) {
      const heal = Math.ceil(dmg / 2);
      attacker.currentHp = Math.min(attacker.currentHp + heal, attacker.maxHp);
      showFloatOnEl(creatureEl(pi, atkUid), `+${heal}`, 'heal');
    }
    checkGameOver();
    setTimeout(() => pulseEl(creatureEl(pi, atkUid), 'anim-attack', 420), 0);
  } else {
    const defender = G.players[opp].field.find(c => c.uid === target.uid);
    if (!defender) return;

    const atkEl  = creatureEl(pi, attacker.uid);
    const defEl  = creatureEl(opp, defender.uid);
    const atkDmg = attacker.currentAttack;
    const defDmg = defender.currentAttack;
    const atkUid = attacker.uid;

    showFloatOnEl(defEl, `-${atkDmg}`, 'damage');
    if (defDmg > 0) showFloatOnEl(atkEl, `-${defDmg}`, 'damage');
    pulseEl(defEl, 'anim-hit', 450);

    attacker.hasAttacked = true;
    hurtCreature(defender, atkDmg);
    hurtCreature(attacker, defDmg);

    if (attacker.onAttack === 'lifesteal' && atkDmg > 0) {
      const heal = Math.ceil(atkDmg / 2);
      attacker.currentHp = Math.min(attacker.currentHp + heal, attacker.maxHp);
      showFloatOnEl(atkEl, `+${heal}`, 'heal');
    }

    removeDeadCreatures(pi);
    removeDeadCreatures(opp);
    setTimeout(() => pulseEl(creatureEl(pi, atkUid), 'anim-attack', 420), 0);
  }
}

// ─── KEYBOARD ─────────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !aiThinking) { closeHeroPanel(); cancelSelection(); render(); }
});

// ─── RESPONSIVE SCALING ───────────────────────────────────────────────────────

const BASE_W = 1280;
const BASE_H = 800;

function scaleGame() {
  const game  = document.getElementById('game');
  const scale = window.innerHeight / BASE_H;
  game.style.width     = Math.ceil(window.innerWidth / scale) + 'px';
  game.style.transform = `scale(${scale})`;
  game.style.left = '0px';
  game.style.top  = '0px';
}

window.addEventListener('resize', scaleGame);

// ─── START ────────────────────────────────────────────────────────────────────

scaleGame();
showStartScreen();
