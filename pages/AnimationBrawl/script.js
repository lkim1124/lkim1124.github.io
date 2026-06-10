// Canvas Setup
const canvas = document.getElementById('effect-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const container = document.getElementById('main-screen');
  if (container && canvas) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Particle Classes and State
const particles = [];
const ambientStars = [];

// Horizon center point coordinates on canvas
let horizonX = canvas.width / 2;
let horizonY = canvas.height * 0.58;

window.addEventListener('resize', () => {
  horizonX = canvas.width / 2;
  horizonY = canvas.height * 0.58;
});

// Speed Dust/Star Particle Class (simulating travel down the stone road)
class RoadDust {
  constructor() {
    this.reset();
  }

  reset() {
    this.angle = Math.random() * Math.PI * 2;
    if (Math.random() < 0.7) {
      this.angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.6; // Downward cone
    }
    this.distance = Math.random() * 20 + 2;
    this.speed = Math.random() * 2 + 1;
    this.size = 1.5;
    this.alpha = 0;
    this.color = Math.random() > 0.5 ? '#00ffff' : '#ff00ff';
  }

  update() {
    this.distance += this.speed;
    this.speed += 0.08;
    this.size = (this.distance / 120) * 4;

    this.x = horizonX + Math.cos(this.angle) * this.distance;
    this.y = horizonY + Math.sin(this.angle) * this.distance * 0.6;

    if (this.distance < 30) {
      this.alpha = (this.distance - 2) / 28;
    } else if (this.distance > canvas.width * 0.6) {
      this.reset();
    } else {
      this.alpha = 0.8;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), Math.max(2, Math.floor(this.size)), Math.max(2, Math.floor(this.size)));
  }
}

// Explosion Particle Class
class ExplodeParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 8 + 3;
    this.gravity = 0.15;
    this.drag = 0.95;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed - Math.random() * 3;
    this.size = Math.random() * 6 + 3;
    this.color = ['#ff0055', '#00ffff', '#ffff00', '#ff00ff', '#ffffff'][Math.floor(Math.random() * 5)];
    this.life = 1.0;
    this.decay = Math.random() * 0.03 + 0.015;
  }

  update() {
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.life;
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), Math.floor(this.size), Math.floor(this.size));
  }
}

// Initialize road speed particles
const dustCount = 40;
for (let i = 0; i < dustCount; i++) {
  ambientStars.push(new RoadDust());
  ambientStars[i].distance = Math.random() * canvas.width * 0.5;
}

// Animation Loop
function loop() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ambientStars.forEach(star => {
    star.update();
    star.draw();
  });

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    if (p.life <= 0) {
      particles.splice(i, 1);
    } else {
      p.draw();
    }
  }

  ctx.globalAlpha = 1.0;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Audio Synthesis (Web Audio API retro 8-bit sound effects)
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(freq, duration, delay, type = 'square', startGain = 0.12) {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);

  gainNode.gain.setValueAtTime(startGain, audioCtx.currentTime + delay);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration);
}

// 1. Classic Start Game Melody
function playStartSound() {
  initAudio();
  playTone(329.63, 0.08, 0.0);      // E4
  playTone(392.00, 0.08, 0.06);     // G4
  playTone(523.25, 0.08, 0.12);     // C5
  playTone(659.25, 0.08, 0.18);     // E5
  playTone(783.99, 0.08, 0.24);     // G5
  playTone(1046.50, 0.35, 0.30);    // C6
  playTone(1318.51, 0.35, 0.30, 'triangle');
}

// 2. Select stage beep
function playSelectSound() {
  initAudio();
  playTone(523.25, 0.05, 0.0, 'triangle', 0.1);
  playTone(783.99, 0.08, 0.04, 'square', 0.08);
}

// 3. Confirm launch chime
function playConfirmSound() {
  initAudio();
  playTone(587.33, 0.06, 0.0);      // D5
  playTone(659.25, 0.06, 0.05);     // E5
  playTone(783.99, 0.06, 0.10);     // G5
  playTone(1046.50, 0.08, 0.15);    // C6
  playTone(1318.51, 0.3, 0.20, 'square', 0.15);
}

// 4. Cancel/Return tone
function playCancelSound() {
  initAudio();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440.00, now);
  osc.frequency.linearRampToValueAtTime(220.00, now + 0.25);

  gainNode.gain.setValueAtTime(0.12, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}


// --- SCREEN NAVIGATION & LEVEL DATA ---
const startBtn = document.getElementById('start-btn');
const startTxt = document.getElementById('start-txt');
const mainScreen = document.getElementById('main-screen');
const mapScreen = document.getElementById('map-screen');
const viewport = document.getElementById('cabinet-viewport');

const backBtn = document.getElementById('back-btn');
const launchBtn = document.getElementById('launch-btn');
const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.getElementById('progress-bar');
const loadingTxt = document.getElementById('loading-txt');

const levelNodes = document.querySelectorAll('.level-node');
const avatar = document.getElementById('avatar');

const stageLocation = document.getElementById('stage-location');
const stageBoss = document.getElementById('stage-boss');
const stageDanger = document.getElementById('stage-danger');
const stageDesc = document.getElementById('stage-desc');

const levelData = {
  1: {
    location: "WOODLAND TOWN",
    boss: "BARNY THE BULLY",
    danger: "★★☆☆☆",
    desc: "A peaceful farming village overrun by rogue ruffians. Fight through the streets, liberate the town house, and restore peace to the valley."
  },
  2: {
    location: "SUNNY BEACH",
    boss: "CAPTAIN CRAB CLAW",
    danger: "★★★☆☆",
    desc: "A beautiful tropical shore now occupied by sandy pirates. Dodge incoming beach hazards, leap between palm trees, and secure the docks."
  },
  3: {
    location: "LAVA CALDERA",
    boss: "LORD ASH BREATH",
    danger: "★★★★★",
    desc: "Deep inside the volcanic caverns. Watch out for spewing magma plumes, navigate crumbling obsidian pathways, and infiltrate the skull-shaped cave."
  }
};

let selectedStage = 1;
let isTransitioning = false;

// Persistent Progression State
let playerStats = {
  coins: parseInt(localStorage.getItem('hero_coins')) || 0,
  diamonds: parseInt(localStorage.getItem('hero_diamonds')) || 0,
  upgrades: {
    hp: parseInt(localStorage.getItem('hero_upgrade_hp')) || 0,
    damage: parseInt(localStorage.getItem('hero_upgrade_damage')) || 0,
    potionsCount: parseInt(localStorage.getItem('hero_upgrade_potions_count')) || 0,
    potionHeal: parseInt(localStorage.getItem('hero_upgrade_potion_heal')) || 0
  },
  unlockedSkins: JSON.parse(localStorage.getItem('hero_unlocked_skins')) || ['default'],
  equippedSkin: localStorage.getItem('hero_equipped_skin') || 'default'
};

const skinsData = {
  default: {
    name: "Woodland Knight",
    cost: 0,
    capeColor: '#b71c1c',
    helmetColor: '#c0c0c8',
    eyeColor: '#ffff00',
    plumeColor: '#0055ff',
    plumeHighlightColor: '#00bfff',
    torsoBackColor: '#a0a0a8',
    torsoFrontColor: '#e2e2e8',
    emblemColor: '#ffd700',
    pauldronColor: '#ffd700',
    pauldronShadowColor: '#8e8e9c',
    bootsColor: '#5c4033',
    bootsShadowColor: '#473024',
    slashColor: 'rgba(0, 255, 255, 0.45)',
    bladeColor: '#e2e2e8',
    hiltColor: '#ffd700',
    description: "Classic defender of the woodland valley."
  },
  ranger: {
    name: "Forest Ranger",
    cost: 5,
    unlockDesc: "Unlocks on Stage 1 completion",
    capeColor: '#5d4037',
    helmetColor: '#2e7d32',
    eyeColor: '#00ff00',
    plumeColor: '#1b5e20',
    plumeHighlightColor: '#4caf50',
    torsoBackColor: '#1b5e20',
    torsoFrontColor: '#81c784',
    emblemColor: '#c8e6c9',
    pauldronColor: '#2e7d32',
    pauldronShadowColor: '#1b5e20',
    bootsColor: '#3e2723',
    bootsShadowColor: '#271510',
    slashColor: 'rgba(0, 255, 0, 0.45)',
    bladeColor: '#81c784',
    hiltColor: '#2e7d32',
    description: "A green-clad master of stealth and woodland survival."
  },
  pirate: {
    name: "Ocean Pirate",
    cost: 10,
    unlockDesc: "Unlocks on Stage 2 completion",
    capeColor: '#212121',
    helmetColor: '#0277bd',
    eyeColor: '#00ffff',
    plumeColor: '#01579b',
    plumeHighlightColor: '#00e5ff',
    torsoBackColor: '#0288d1',
    torsoFrontColor: '#ffd700',
    emblemColor: '#e65100',
    pauldronColor: '#ffd700',
    pauldronShadowColor: '#f57c00',
    bootsColor: '#212121',
    bootsShadowColor: '#000000',
    slashColor: 'rgba(0, 255, 255, 0.45)',
    bladeColor: '#cfd8dc',
    hiltColor: '#ffd700',
    description: "A seasoned pirate voyager wearing deep ocean blue armor."
  },
  slayer: {
    name: "Magma Slayer",
    cost: 15,
    unlockDesc: "Unlocks on Stage 3 completion",
    capeColor: '#d50000',
    helmetColor: '#212121',
    eyeColor: '#ff3d00',
    plumeColor: '#dd2c00',
    plumeHighlightColor: '#ff9100',
    torsoBackColor: '#212121',
    torsoFrontColor: '#ff3d00',
    emblemColor: '#ffea00',
    pauldronColor: '#ff3d00',
    pauldronShadowColor: '#dd2c00',
    bootsColor: '#212121',
    bootsShadowColor: '#000000',
    slashColor: 'rgba(255, 61, 0, 0.5)',
    bladeColor: '#37474f',
    hiltColor: '#ff3d00',
    description: "Armor forged inside caldera core lava flows."
  },
  ninja: {
    name: "Shadow Ninja",
    cost: 8,
    unlockDesc: "Buy for 8 Diamonds",
    capeColor: '#4a148c',
    helmetColor: '#0d0d0d',
    eyeColor: '#ff007f',
    plumeColor: '#4a148c',
    plumeHighlightColor: '#8e24aa',
    torsoBackColor: '#212121',
    torsoFrontColor: '#121212',
    emblemColor: '#4a148c',
    pauldronColor: '#311b92',
    pauldronShadowColor: '#1a237e',
    bootsColor: '#0d0d0d',
    bootsShadowColor: '#000000',
    slashColor: 'rgba(142, 36, 170, 0.5)',
    bladeColor: '#37474f',
    hiltColor: '#4a148c',
    description: "Strikes invisibly from darkness, cloaked in royal purple shadow."
  },
  king: {
    name: "Golden King",
    cost: 20,
    unlockDesc: "Buy for 20 Diamonds",
    capeColor: '#4a148c',
    helmetColor: '#ffc107',
    eyeColor: '#ffffff',
    plumeColor: '#ffeb3b',
    plumeHighlightColor: '#ffd54f',
    torsoBackColor: '#ffc107',
    torsoFrontColor: '#ffe082',
    emblemColor: '#e040fb',
    pauldronColor: '#ffd700',
    pauldronShadowColor: '#ff8f00',
    bootsColor: '#5c4033',
    bootsShadowColor: '#3e2723',
    slashColor: 'rgba(255, 235, 59, 0.5)',
    bladeColor: '#ffffff',
    hiltColor: '#e040fb',
    description: "A monarch dressed in solid gold armor with violet royal cape."
  },
  skinwalker: {
    name: "Skinwalker",
    cost: 12,
    unlockDesc: "Unlocks on Stage 4 completion",
    capeColor: '#303030',
    helmetColor: '#757575',
    eyeColor: '#ff1744',
    plumeColor: '#424242',
    plumeHighlightColor: '#616161',
    torsoBackColor: '#757575',
    torsoFrontColor: '#616161',
    emblemColor: '#ff1744',
    pauldronColor: '#424242',
    pauldronShadowColor: '#303030',
    bootsColor: '#212121',
    bootsShadowColor: '#151515',
    slashColor: 'rgba(255, 23, 68, 0.45)',
    bladeColor: '#616161',
    hiltColor: '#ff1744',
    description: "A creepy entity mimicking human form, cloaked in grey ash."
  },
  freddy: {
    name: "Freddy Fazbear",
    cost: 15,
    unlockDesc: "Unlocks on Stage 5 completion",
    capeColor: '#5d4037', // brown cape
    helmetColor: '#8d6e63', // brown head
    eyeColor: '#00e5ff', // blue eyes
    plumeColor: '#121212', // black top hat
    plumeHighlightColor: '#424242',
    torsoBackColor: '#5d4037',
    torsoFrontColor: '#8d6e63',
    emblemColor: '#121212', // black bowtie emblem
    pauldronColor: '#3e2723',
    pauldronShadowColor: '#271510',
    bootsColor: '#121212',
    bootsShadowColor: '#000000',
    slashColor: 'rgba(93, 64, 55, 0.45)', // brown slash
    bladeColor: '#8d6e63',
    hiltColor: '#121212',
    description: "The main star of Freddy Fazbear's Pizzeria, complete with a tiny top hat."
  },
  squid: {
    name: "Green Contestant",
    cost: 20,
    unlockDesc: "Unlocks on Stage 6 completion",
    capeColor: '#004d40', // dark green tracksuit cape
    helmetColor: '#00796b', // green tracksuit hood
    eyeColor: '#ffffff', // white glow eyes
    plumeColor: '#004d40',
    plumeHighlightColor: '#00796b',
    torsoBackColor: '#004d40',
    torsoFrontColor: '#00796b',
    emblemColor: '#ffffff', // white number emblem
    pauldronColor: '#004d40',
    pauldronShadowColor: '#00332c',
    bootsColor: '#eceff1', // white sneakers
    bootsShadowColor: '#cfd8dc',
    slashColor: 'rgba(0, 150, 136, 0.45)', // green slash
    bladeColor: '#cfd8dc',
    hiltColor: '#00796b',
    description: "Tracksuit contestant number 456, ready for the games."
  }
};

function saveProgression() {
  localStorage.setItem('hero_coins', playerStats.coins);
  localStorage.setItem('hero_diamonds', playerStats.diamonds);
  localStorage.setItem('hero_upgrade_hp', playerStats.upgrades.hp);
  localStorage.setItem('hero_upgrade_damage', playerStats.upgrades.damage);
  localStorage.setItem('hero_upgrade_potions_count', playerStats.upgrades.potionsCount);
  localStorage.setItem('hero_upgrade_potion_heal', playerStats.upgrades.potionHeal);
  localStorage.setItem('hero_unlocked_skins', JSON.stringify(playerStats.unlockedSkins));
  localStorage.setItem('hero_equipped_skin', playerStats.equippedSkin);
  updateMapCurrencyDisplay();
}

function updateMapCurrencyDisplay() {
  const mapCoins = document.getElementById('map-coins');
  const mapDiamonds = document.getElementById('map-diamonds');
  if (mapCoins) mapCoins.textContent = String(playerStats.coins).padStart(4, '0');
  if (mapDiamonds) mapDiamonds.textContent = String(playerStats.diamonds).padStart(3, '0');
}

// Initial update on page load
setTimeout(updateMapCurrencyDisplay, 100);

// Stage completion state (persisted via localStorage)
const stageCompleted = {
  1: localStorage.getItem('stage_1_completed') === 'true',
  2: localStorage.getItem('stage_2_completed') === 'true',
  3: localStorage.getItem('stage_3_completed') === 'true',
  4: localStorage.getItem('stage_4_completed') === 'true',
  5: localStorage.getItem('stage_5_completed') === 'true',
  6: localStorage.getItem('stage_6_completed') === 'true'
};

function applyMapCompletionStates() {
  const townNode = document.getElementById('node-town');
  const beachNode = document.getElementById('node-beach');
  const lavaNode = document.getElementById('node-lava');

  // Stage 1: Woodland Town
  const ruinedEl = townNode ? townNode.querySelector('.cottage-ruined') : null;
  const restoredEl = townNode ? townNode.querySelector('.cottage-restored') : null;
  if (stageCompleted[1]) {
    townNode && townNode.classList.remove('ruined');
    townNode && townNode.classList.add('completed');
    if (ruinedEl) ruinedEl.style.display = 'none';
    if (restoredEl) restoredEl.style.display = 'flex';
  } else {
    townNode && townNode.classList.add('ruined');
    townNode && townNode.classList.remove('completed');
    if (ruinedEl) ruinedEl.style.display = 'flex';
    if (restoredEl) restoredEl.style.display = 'none';
  }

  // Stage 2: Sunny Beach
  const beachLock = beachNode ? beachNode.querySelector('.lock-overlay') : null;
  if (stageCompleted[2]) {
    beachNode && beachNode.classList.add('completed');
  } else {
    beachNode && beachNode.classList.remove('completed');
  }
  if (!stageCompleted[1]) {
    beachNode && beachNode.classList.add('locked');
    if (beachLock) beachLock.style.display = 'flex';
  } else {
    beachNode && beachNode.classList.remove('locked');
    if (beachLock) beachLock.style.display = 'none';
  }

  // Stage 3: Lava Caldera
  const lavaLock = lavaNode ? lavaNode.querySelector('.lock-overlay') : null;
  if (stageCompleted[3]) {
    lavaNode && lavaNode.classList.add('completed');
  } else {
    lavaNode && lavaNode.classList.remove('completed');
  }
  if (!stageCompleted[2]) {
    lavaNode && lavaNode.classList.add('locked');
    if (lavaLock) lavaLock.style.display = 'flex';
  } else {
    lavaNode && lavaNode.classList.remove('locked');
    if (lavaLock) lavaLock.style.display = 'none';
  }
}

// Apply on load
applyMapCompletionStates();

// Reset stages button
const resetMapBtn = document.getElementById('reset-map-btn');
if (resetMapBtn) {
  resetMapBtn.addEventListener('click', () => {
    localStorage.removeItem('stage_1_completed');
    localStorage.removeItem('stage_2_completed');
    localStorage.removeItem('stage_3_completed');
    localStorage.removeItem('stage_4_completed');
    localStorage.removeItem('stage_5_completed');
    localStorage.removeItem('stage_6_completed');
    stageCompleted[1] = false;
    stageCompleted[2] = false;
    stageCompleted[3] = false;
    stageCompleted[4] = false;
    stageCompleted[5] = false;
    stageCompleted[6] = false;
    applyMapCompletionStates();
    try { playCancelSound(); } catch (e) { }
  });
}

// Secret level code search input validation
const submitCodeBtn = document.getElementById('submit-code-btn');
const levelCodeInput = document.getElementById('level-code-input');

if (submitCodeBtn && levelCodeInput) {
  submitCodeBtn.addEventListener('click', () => {
    validateAndDeploySecretCode();
  });
  levelCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      validateAndDeploySecretCode();
    }
  });
}

function validateAndDeploySecretCode() {
  const code = levelCodeInput.value.trim().toUpperCase();
  if (code === 'A113') {
    levelCodeInput.value = '';
    deploySecretLevelA113();
  } else if (code === 'FNAF') {
    levelCodeInput.value = '';
    deploySecretLevelFNAF();
  } else if (code === 'SQUID') {
    levelCodeInput.value = '';
    deploySecretLevelSQUID();
  } else {
    // Incorrect code: shake input box and play cancel sound
    levelCodeInput.classList.add('code-error-shake');
    try { playCancelSound(); } catch (err) {}
    setTimeout(() => {
      levelCodeInput.classList.remove('code-error-shake');
    }, 400);
  }
}

function deploySecretLevelA113() {
  if (isTransitioning) return;
  isTransitioning = true;

  try { playConfirmSound(); } catch (e) {}

  loadingTxt.textContent = "DEPLOYING SECRET MISSION: A113...";
  loadingScreen.classList.add('active');

  progressBar.style.width = '0%';
  let progress = 0;

  const fillInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(fillInterval);
      
      setTimeout(() => {
        loadingTxt.textContent = "SECRET TELEPORT COMPLETED!";
        playTone(987.77, 0.4, 0.0, 'sine', 0.15); // B5 tone for teleport
        
        setTimeout(() => {
          loadingScreen.classList.remove('active');
          isTransitioning = false;
          
          // Launch Backrooms Stage 4
          startPlatformerGame(4);
        }, 800);
      }, 400);
    }
    progressBar.style.width = progress + '%';
  }, 120);
}

function deploySecretLevelFNAF() {
  if (isTransitioning) return;
  isTransitioning = true;

  try { playConfirmSound(); } catch (e) {}

  loadingTxt.textContent = "DEPLOYING SECRET MISSION: FNAF...";
  loadingScreen.classList.add('active');

  progressBar.style.width = '0%';
  let progress = 0;

  const fillInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(fillInterval);
      
      setTimeout(() => {
        loadingTxt.textContent = "FIVE NIGHTS AT FREDDY'S DEPLOYED!";
        try {
          playTone(130, 0.4, 0.0, 'sawtooth', 0.15); // Creepy low tone
          playTone(65, 0.5, 0.04, 'sawtooth', 0.2);
        } catch (e) {}
        
        setTimeout(() => {
          loadingScreen.classList.remove('active');
          isTransitioning = false;
          
          // Launch FNAF Stage 5
          startPlatformerGame(5);
        }, 800);
      }, 400);
    }
    progressBar.style.width = progress + '%';
  }, 120);
}

function deploySecretLevelSQUID() {
  if (isTransitioning) return;
  isTransitioning = true;

  try { playConfirmSound(); } catch (e) {}

  loadingTxt.textContent = "DEPLOYING SECRET MISSION: SQUID GAME...";
  loadingScreen.classList.add('active');

  progressBar.style.width = '0%';
  let progress = 0;

  const fillInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(fillInterval);
      
      setTimeout(() => {
        loadingTxt.textContent = "RED LIGHT, GREEN LIGHT DEPLOYED!";
        try {
          playTone(523.25, 0.2, 0.0, 'sine', 0.1);
          playTone(659.25, 0.2, 0.08, 'sine', 0.15);
        } catch (e) {}
        
        setTimeout(() => {
          loadingScreen.classList.remove('active');
          isTransitioning = false;
          
          // Launch Squid Game Stage 6
          startPlatformerGame(6);
        }, 800);
      }, 400);
    }
    progressBar.style.width = progress + '%';
  }, 120);
}

const nodePositions = {
  1: { left: '15%', top: '58%' },
  2: { left: '48%', top: '22%' },
  3: { left: '78%', top: '58%' }
};

// Reposition player avatar above selected stage node
function updateAvatarPosition() {
  const pos = nodePositions[selectedStage];
  if (pos) {
    avatar.style.left = `calc(${pos.left} + 40px)`;
    avatar.style.top = `calc(${pos.top} - 28px)`;
  }
}

// Initial placement
setTimeout(updateAvatarPosition, 100);

// Switch details card info
function selectStage(stageNum) {
  if (isTransitioning) return;
  selectedStage = stageNum;

  playSelectSound();

  levelNodes.forEach(node => {
    if (parseInt(node.getAttribute('data-stage')) === stageNum) {
      node.classList.add('selected');
    } else {
      node.classList.remove('selected');
    }
  });

  updateAvatarPosition();

  const info = levelData[stageNum];
  if (info) {
    stageLocation.textContent = info.location;
    stageBoss.textContent = info.boss;
    stageDanger.textContent = info.danger;
    stageDesc.textContent = info.desc;
  }
}

levelNodes.forEach(node => {
  node.addEventListener('click', () => {
    const stageNum = parseInt(node.getAttribute('data-stage'));
    if (stageNum === 2 && !stageCompleted[1]) {
      try { playCancelSound(); } catch (e) { }
      return;
    }
    if (stageNum === 3 && !stageCompleted[2]) {
      try { playCancelSound(); } catch (e) { }
      return;
    }
    selectStage(stageNum);
  });
});

// --- TRANSITION: LANDING -> ROAD MAP ---
function triggerLandingToMapTransition(e) {
  if (isTransitioning) return;
  isTransitioning = true;

  try { playStartSound(); } catch (e) { }

  let clickX = canvas.width / 2;
  let clickY = canvas.height * 0.75;
  if (e && e.clientX) {
    const rect = canvas.getBoundingClientRect();
    clickX = e.clientX - rect.left;
    clickY = e.clientY - rect.top;
  }
  for (let i = 0; i < 70; i++) {
    particles.push(new ExplodeParticle(clickX, clickY));
  }

  viewport.classList.add('shake');

  setTimeout(() => {
    viewport.classList.remove('shake');
    viewport.classList.add('shutoff');
  }, 350);

  setTimeout(() => {
    mainScreen.style.display = 'none';
    mapScreen.style.display = 'flex';
    selectStage(1);

    viewport.classList.remove('shutoff');
    viewport.classList.add('power-on');
  }, 950);

  setTimeout(() => {
    viewport.classList.remove('power-on');
    isTransitioning = false;
  }, 1450);
}

if (startBtn) startBtn.addEventListener('click', triggerLandingToMapTransition);
if (startTxt) startTxt.addEventListener('click', triggerLandingToMapTransition);


// --- TRANSITION: ROAD MAP -> LANDING ---
if (backBtn) {
  backBtn.addEventListener('click', () => {
    if (isTransitioning) return;
    isTransitioning = true;

    try { playCancelSound(); } catch (e) { }

    viewport.classList.add('shutoff');

    setTimeout(() => {
      mapScreen.style.display = 'none';
      mainScreen.style.display = 'flex';
      viewport.classList.remove('shutoff');
      viewport.classList.add('power-on');
    }, 650);

    setTimeout(() => {
      viewport.classList.remove('power-on');
      isTransitioning = false;
      resizeCanvas();
    }, 1150);
  });
}


// --- DEPLOY STAGE LOADING TRIGGER ---
if (launchBtn) {
  launchBtn.addEventListener('click', () => {
    if (isTransitioning) return;
    isTransitioning = true;

    try { playConfirmSound(); } catch (e) { }

    const info = levelData[selectedStage];
    loadingTxt.textContent = `LOADING: ${info.location}...`;

    loadingScreen.classList.add('active');

    progressBar.style.width = '0%';
    let progress = 0;

    const fillInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(fillInterval);

        setTimeout(() => {
          loadingTxt.textContent = "DEPLOYMENT COMPLETE!";
          playTone(880.00, 0.4, 0.0, 'sine', 0.15);

          setTimeout(() => {
            loadingScreen.classList.remove('active');
            isTransitioning = false;

            // Launch the correct level
            startPlatformerGame(selectedStage);
          }, 800);

        }, 400);
      }
      progressBar.style.width = progress + '%';
    }, 150);
  });
}

// ================= PLAYABLE PLATFORMER GAME FOR STAGE 1 (WOODLAND TOWN) =================
const playScreen = document.getElementById('play-screen');
const gameCanvas = document.getElementById('game-canvas');
const gctx = gameCanvas.getContext('2d');

const playerHpBar = document.getElementById('player-hp-bar');
const playerScoreText = document.getElementById('player-score');
const bossHud = document.getElementById('boss-hud');
const bossHpBar = document.getElementById('boss-hp-bar');

const instructionsOverlay = document.getElementById('instructions-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const victoryOverlay = document.getElementById('victory-overlay');

const retryBtn = document.getElementById('retry-btn');
const mapReturnBtn = document.getElementById('map-return-btn');
const victoryOkBtn = document.getElementById('victory-ok-btn');

let gameRunning = false;
let gameLoopId = null;
let keys = {};
let currentLevel = 1;

// Per-level HUD / overlay text
const levelHudData = {
  1: { hud: 'STG-01: WOODLAND TOWN', boss: 'BOSS: BARNY THE BULLY', bossIntroText: 'BOSS ENCOUNTER: BARNY THE BULLY', briefingTitle: 'STAGE 1 BRIEFING', briefingDesc: 'Barny the Bully is terrorizing Woodland Town!', victoryDesc: 'Barny the Bully has been defeated!', victorySub: 'WOODLAND TOWN IS FREE!' },
  2: { hud: 'STG-02: SUNNY BEACH', boss: 'BOSS: CAPTAIN CRAB CLAW', bossIntroText: 'BOSS ENCOUNTER: CAPTAIN CRAB CLAW', briefingTitle: 'STAGE 2 BRIEFING', briefingDesc: 'Sandy pirates have seized the tropical coast!', victoryDesc: 'Captain Crab Claw has been defeated!', victorySub: 'THE BEACH IS LIBERATED!' },
  3: { hud: 'STG-03: LAVA CALDERA', boss: 'BOSS: LORD ASH BREATH', bossIntroText: 'BOSS ENCOUNTER: LORD ASH BREATH', briefingTitle: 'STAGE 3 BRIEFING', briefingDesc: 'The volcanic depths burn! Defeat the Fire Dragon!', victoryDesc: 'Lord Ash Breath has been defeated!', victorySub: 'THE VOLCANO IS SEALED!' },
  4: { hud: 'STG-SECRET: THE BACKROOMS', boss: 'ENTITY: THE BACTERIA', bossIntroText: 'ENTITY ENCOUNTER: THE BACTERIA', briefingTitle: 'A113 BRIEFING', briefingDesc: 'You fell out of reality... Maintain sanity. Avoid the entities. Find Almond Water.', victoryDesc: 'The Bacteria has been dissolved!', victorySub: 'YOU ESCAPED THE BACKROOMS!' },
  5: { 
    hud: 'STG-SECRET: FREDDY PIZZERIA', 
    boss: 'ANIMATRONIC: FREDDY FAZBEAR', 
    bossIntroText: 'WARNING: FREDDY FAZBEAR IS ACTIVE', 
    briefingTitle: 'FNAF BRIEFING', 
    briefingDesc: 'Survival mode active. The animatronics wander the pizzeria halls. Watch your power. Find pizza slices to survive.', 
    victoryDesc: 'Freddy has been deactivated!', 
    victorySub: 'YOU SURVIVED THE NIGHT!' 
  },
  6: {
    hud: 'STG-SECRET: SQUID GAME',
    boss: 'THE DOLL: CHONG',
    bossIntroText: 'RED LIGHT, GREEN LIGHT STARTED!',
    briefingTitle: 'SQUID GAME BRIEFING',
    briefingDesc: 'Run to the finish line (x = 3800) during GREEN LIGHT. Freeze completely during RED LIGHT. Don\'t let the doll catch you moving!',
    victoryDesc: 'You crossed the finish line!',
    victorySub: 'YOU SURVIVED THE SQUID GAME!'
  }
};

// Game Resolution Constants
const V_WIDTH = 500;
const V_HEIGHT = 260;
gameCanvas.width = V_WIDTH;
gameCanvas.height = V_HEIGHT;

// Physics variables
let player = {};
let platforms = [];
let hazards = [];
let enemies = [];
let pickups = [];
let boss = null;
let cameraX = 0;
let score = 0;
let doubleJumpCount = 0;
let bossIntroTriggered = false;
let bossIntroTimer = 0;
let playerPotions = 3;
let healParticles = []; // {x,y,vy,life,alpha}
let gateY = -80;
let gateLocked = false;
let bossSkyCrimson = 0; // 0=normal purple, 1=full red

// Squid Game (Red Light, Green Light) variables
let squidState = 'green'; // 'green' or 'red'
let squidStateTimer = 180; // duration in ticks
let squidTimeRemaining = 7200; // 120 seconds (at 60fps)
let squidGraceFrames = 0; // grace frames when switching to red light
let squidChantStep = 0;
let squidChantTimer = 0;
let laserTraces = []; // {x1, y1, x2, y2, alpha}

function createSniperLaser(tx, ty) {
  laserTraces.push({
    x1: tx + (Math.random() - 0.5) * 200,
    y1: 0,
    x2: tx,
    y2: ty,
    alpha: 1.0
  });
}

// Extra Synth Sounds
function playJumpSound() {
  initAudio();
  playTone(220, 0.08, 0.0, 'triangle', 0.1);
  playTone(392, 0.1, 0.03, 'sine', 0.08);
}

function playSlashSound() {
  initAudio();
  if (!audioCtx) return;
  // White noise sword slash
  const bufferSize = audioCtx.sampleRate * 0.1;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start();
  noise.stop(audioCtx.currentTime + 0.1);
}

function playHurtSound() {
  initAudio();
  playTone(180, 0.12, 0.0, 'sawtooth', 0.15);
  playTone(90, 0.15, 0.04, 'sawtooth', 0.1);
}

function playDeathSound() {
  initAudio();
  playTone(220, 0.18, 0.0, 'sawtooth', 0.15);
  playTone(147, 0.22, 0.12, 'sawtooth', 0.15);
  playTone(110, 0.35, 0.3, 'sawtooth', 0.15);
}

function playWinSound() {
  initAudio();
  playTone(523.25, 0.08, 0.0);      // C5
  playTone(659.25, 0.08, 0.08);     // E5
  playTone(783.99, 0.08, 0.16);     // G5
  playTone(1046.50, 0.12, 0.24);    // C6
  playTone(783.99, 0.08, 0.36);     // G5
  playTone(1046.50, 0.45, 0.44, 'square', 0.12); // C6
}

function playHitSound() {
  initAudio();
  playTone(130, 0.05, 0.0, 'sawtooth', 0.12);
}

// Map Layout dispatcher
function initLevel() {
  if (currentLevel === 1) initLevel1();
  else if (currentLevel === 2) initLevel2();
  else if (currentLevel === 3) initLevel3();
  else if (currentLevel === 4) initLevel4();
  else if (currentLevel === 5) initLevel5();
  else if (currentLevel === 6) initLevel6();
}

// Map Layout (Woodland Town Theme)
function initLevel1() {
  platforms = [
    // Ground sections separated by pits
    { x: 0, y: 230, w: 320, h: 50 },    // Section 1 Ground
    { x: 380, y: 230, w: 460, h: 50 },  // Section 2 Ground
    { x: 920, y: 230, w: 520, h: 50 },  // Section 3 Ground
    { x: 1530, y: 230, w: 700, h: 50 }, // Boss Arena Ground

    // Pit crossing platforms
    { x: 310, y: 170, w: 45, h: 8 },    // Pit 1 Ledge
    { x: 345, y: 140, w: 45, h: 8 },
    { x: 840, y: 180, w: 50, h: 8 },    // Pit 2 Ledge
    { x: 1445, y: 170, w: 55, h: 8 },   // Pit 3 Ledge

    // Floating Platforms for extra height & layout
    { x: 120, y: 160, w: 80, h: 8 },
    { x: 500, y: 160, w: 90, h: 8 },
    { x: 670, y: 130, w: 80, h: 8 },
    { x: 1040, y: 160, w: 90, h: 8 },
    { x: 1200, y: 130, w: 90, h: 8 }
  ];

  // Spikes removed from the boss arena entrance (x = 1630 spikes deleted)
  hazards = [
    // Spikes (x, y, w)
    { x: 580, y: 230, w: 32, damage: 15 },
    { x: 1100, y: 230, w: 40, damage: 15 }
  ];

  // Healing Pickups: scattered hearts
  pickups = [
    { x: 150, y: 130, w: 12, h: 12, type: 'heart', active: true },
    { x: 540, y: 130, w: 12, h: 12, type: 'heart', active: true },
    { x: 1080, y: 130, w: 12, h: 12, type: 'heart', active: true },
    { x: 1460, y: 140, w: 12, h: 12, type: 'heart', active: true }
  ];

  // Enemies: damage scales with size (Goblin 16px -> 10 dmg, Orc 24px -> 25 dmg, Golem 36px -> 45 dmg)
  enemies = [
    // Small Goblin (16px, 10 damage)
    {
      x: 200, y: 200, w: 16, h: 16, hp: 20, maxHp: 20, vx: 1.0, damage: 10,
      color: '#4caf50', name: 'Goblin', patrolStart: 100, patrolEnd: 300, isHurt: 0
    },
    // Medium Orc (24px, 25 damage)
    {
      x: 480, y: 200, w: 24, h: 24, hp: 40, maxHp: 40, vx: 1.2, damage: 25,
      color: '#00e5ff', name: 'Orc', patrolStart: 400, patrolEnd: 780, isHurt: 0
    },
    // Small Goblin 2 (16px, 10 damage) on floating ledge
    {
      x: 520, y: 130, w: 16, h: 16, hp: 20, maxHp: 20, vx: 0.8, damage: 10,
      color: '#4caf50', name: 'Goblin', patrolStart: 500, patrolEnd: 580, isHurt: 0
    },
    // Large Golem (36px, 45 damage)
    {
      x: 1000, y: 190, w: 36, h: 36, hp: 80, maxHp: 80, vx: 0.6, damage: 45,
      color: '#e040fb', name: 'Golem', patrolStart: 940, patrolEnd: 1350, isHurt: 0
    },
    // Medium Orc 2 (24px, 25 damage)
    {
      x: 1360, y: 200, w: 24, h: 24, hp: 40, maxHp: 40, vx: 1.0, damage: 25,
      color: '#00e5ff', name: 'Orc', patrolStart: 1250, patrolEnd: 1420, isHurt: 0
    }
  ];

  // Boss Barny the Bully (48px, 30 dmg) — TUNED EASIER
  boss = {
    x: 2050, y: -80, w: 48, h: 48, hp: 180, maxHp: 180, vx: 0, vy: 0,
    damage: 30, color: '#ff007f', isHurt: 0, state: 'falling', stateTimer: 0,
    isGrounded: false, direction: -1, projectiles: [], debrisWarnings: [],
    landed: false, enraged: false
  };
}

// Map Layout (Sunny Beach Theme)
function initLevel2() {
  platforms = [
    // Ground sections separated by water pits - redesigned for high piers & leaf traversal
    { x: 0, y: 230, w: 220, h: 50 },    // Section 1: Beach Sand

    // High wooden pier dock sections (Section 2)
    { x: 480, y: 160, w: 220, h: 100 }, // High wooden pier (top is y=160)
    { x: 560, y: 110, w: 80, h: 10 },   // Higher platform structure above the pier

    // Low-lying beach/dock pathway (Section 3)
    { x: 840, y: 210, w: 180, h: 50 },  // Lower dock path

    // High-altitude docks & platforms
    { x: 1160, y: 200, w: 120, h: 60 }, // Low-mid dock
    { x: 1310, y: 150, w: 150, h: 110 },// High-mid dock (top is y=150)

    // Boss Arena: sandy shores
    { x: 1530, y: 230, w: 700, h: 50 }, // Boss Arena Ground
    { x: 1680, y: 165, w: 90, h: 10 },   // Boss arena pier left
    { x: 1850, y: 120, w: 90, h: 10 },   // Boss arena pier middle high
    { x: 2020, y: 165, w: 90, h: 10 },   // Boss arena pier right

    // Pit crossing logs/walkways and palm tree leaf platforms
    { x: 260, y: 190, w: 80, h: 8 },    // Floating log 1
    { x: 380, y: 135, w: 60, h: 8 },    // Palm leaf 1 (high)
    { x: 740, y: 95, w: 70, h: 8 },     // Palm leaf 2 (very high)
    { x: 1060, y: 155, w: 60, h: 8 },   // Palm leaf 3
    { x: 1480, y: 120, w: 40, h: 8 }     // Palm leaf 4 (boss entry step)
  ];

  hazards = [
    // Sea Urchins (placed on lower and higher structures)
    { x: 900, y: 210, w: 24, damage: 20 },
    { x: 1380, y: 150, w: 24, damage: 20 }
  ];

  pickups = [
    { x: 120, y: 195, w: 12, h: 12, type: 'heart', active: true },
    { x: 300, y: 155, w: 12, h: 12, type: 'heart', active: true },
    { x: 600, y: 75, w: 12, h: 12, type: 'heart', active: true },
    { x: 930, y: 175, w: 12, h: 12, type: 'heart', active: true },
    { x: 1380, y: 85, w: 12, h: 12, type: 'heart', active: true },
    { x: 1720, y: 130, w: 12, h: 12, type: 'heart', active: true }
  ];

  enemies = [
    // Crabs (replace Goblins, HP: 30, Dmg: 15)
    {
      x: 80, y: 200, w: 16, h: 16, hp: 30, maxHp: 30, vx: 1.3, damage: 15,
      color: '#ff5722', name: 'Crab', patrolStart: 20, patrolEnd: 180, isHurt: 0
    },
    {
      x: 590, y: 80, w: 16, h: 16, hp: 30, maxHp: 30, vx: 1.0, damage: 15,
      color: '#ff5722', name: 'Crab', patrolStart: 565, patrolEnd: 630, isHurt: 0
    },
    // Skeleton Pirates (replace Orcs, HP: 50, Dmg: 30)
    {
      x: 520, y: 130, w: 24, h: 24, hp: 50, maxHp: 50, vx: 1.2, damage: 30,
      color: '#eceff1', name: 'Skeleton Pirate', patrolStart: 490, patrolEnd: 680, isHurt: 0
    },
    {
      x: 1350, y: 120, w: 24, h: 24, hp: 50, maxHp: 50, vx: 1.1, damage: 30,
      color: '#eceff1', name: 'Skeleton Pirate', patrolStart: 1320, patrolEnd: 1450, isHurt: 0
    },
    // Shark Warrior (replaces Golem, HP: 100, Dmg: 45)
    {
      x: 900, y: 170, w: 32, h: 32, hp: 100, maxHp: 100, vx: 0.8, damage: 45,
      color: '#607d8b', name: 'Shark Warrior', patrolStart: 850, patrolEnd: 1000, isHurt: 0
    }
  ];

  // Captain Crab Claw (Medium difficulty: 260 HP, 35 damage)
  boss = {
    x: 2050, y: -80, w: 48, h: 48, hp: 260, maxHp: 260, vx: 0, vy: 0,
    damage: 35, color: '#e64a19', isHurt: 0, state: 'falling', stateTimer: 0,
    isGrounded: false, direction: -1, projectiles: [], debrisWarnings: [],
    landed: false, enraged: false
  };
}

// Map Layout (Lava Caldera Theme)
function initLevel3() {
  platforms = [
    // Ground sections separated by massive lava pits - high stress basalt columns
    { x: 0, y: 230, w: 150, h: 50 },    // Section 1: Basalt rock starting area

    // Narrow vertical basalt pillars/columns over the lava pit (requires precision jumps)
    { x: 180, y: 200, w: 30, h: 80 },   // Pillar 1
    { x: 250, y: 170, w: 30, h: 110 },  // Pillar 2
    { x: 320, y: 140, w: 30, h: 140 },  // Pillar 3
    { x: 390, y: 170, w: 30, h: 110 },  // Pillar 4

    // Section 2: Rising lava shelf
    { x: 460, y: 200, w: 280, h: 80 },  // Mid-ground basalt path

    // Mid-section gap basalt column
    { x: 780, y: 160, w: 40, h: 120 },  // Pillar 5

    // Section 3: Jagged obsidian floor
    { x: 950, y: 220, w: 350, h: 60 },  // Floor path

    // Final volcanic gap basalt columns and crumbling rocks
    { x: 1340, y: 180, w: 30, h: 100 }, // Pillar 6

    // Boss Arena: caldera floor (with elevated obsidian rocks for tactical dodging)
    { x: 1530, y: 230, w: 700, h: 50 }, // Boss Arena Ground
    { x: 1650, y: 155, w: 60, h: 8 },   // Tactical ledge left
    { x: 1850, y: 135, w: 60, h: 8 },   // Tactical ledge center
    { x: 2050, y: 160, w: 60, h: 8 },   // Tactical ledge right

    // Floating obsidian platforms
    { x: 100, y: 155, w: 50, h: 8 },    // Floating start ledge
    { x: 500, y: 130, w: 60, h: 8 },    // Above lava shelf 1
    { x: 620, y: 100, w: 60, h: 8 },    // Above lava shelf 2
    { x: 860, y: 120, w: 50, h: 8 },    // Floating gap platform
    { x: 1000, y: 150, w: 70, h: 8 },   // Obsidian ledge 1
    { x: 1120, y: 110, w: 70, h: 8 },   // Obsidian ledge 2
    { x: 1240, y: 150, w: 70, h: 8 },   // Obsidian ledge 3
    { x: 1410, y: 140, w: 35, h: 8 },   // Crumbling rock step 1
    { x: 1475, y: 180, w: 35, h: 8 }    // Crumbling rock step 2
  ];

  hazards = [
    // Lava Plumes (x, y, w)
    { x: 580, y: 200, w: 40, damage: 25 },
    { x: 1100, y: 220, w: 48, damage: 25 }
  ];

  pickups = [
    { x: 265, y: 130, w: 12, h: 12, type: 'heart', active: true },
    { x: 530, y: 90, w: 12, h: 12, type: 'heart', active: true },
    { x: 865, y: 80, w: 12, h: 12, type: 'heart', active: true },
    { x: 1150, y: 70, w: 12, h: 12, type: 'heart', active: true },
    { x: 1420, y: 100, w: 12, h: 12, type: 'heart', active: true },
    { x: 1860, y: 90, w: 12, h: 12, type: 'heart', active: true }
  ];

  enemies = [
    // Lava Slimes (replace Goblins, HP: 40, Dmg: 20, move fast)
    {
      x: 80, y: 200, w: 16, h: 16, hp: 40, maxHp: 40, vx: 1.5, damage: 20,
      color: '#ff3d00', name: 'Lava Slime', patrolStart: 20, patrolEnd: 130, isHurt: 0
    },
    {
      x: 480, y: 180, w: 16, h: 16, hp: 40, maxHp: 40, vx: 1.2, damage: 20,
      color: '#ff3d00', name: 'Lava Slime', patrolStart: 470, patrolEnd: 540, isHurt: 0
    },
    // Fire Demons (replace Orcs, HP: 70, Dmg: 35)
    {
      x: 640, y: 170, w: 24, h: 24, hp: 70, maxHp: 70, vx: 1.3, damage: 35,
      color: '#c62828', name: 'Fire Demon', patrolStart: 600, patrolEnd: 730, isHurt: 0
    },
    {
      x: 1250, y: 190, w: 24, h: 24, hp: 70, maxHp: 70, vx: 1.2, damage: 35,
      color: '#c62828', name: 'Fire Demon', patrolStart: 1200, patrolEnd: 1290, isHurt: 0
    },
    // Magma Golem (replaces Golem, HP: 130, Dmg: 55)
    {
      x: 1040, y: 180, w: 36, h: 36, hp: 130, maxHp: 130, vx: 0.7, damage: 55,
      color: '#212121', name: 'Magma Golem', patrolStart: 960, patrolEnd: 1090, isHurt: 0
    }
  ];

  // Lord Ash Breath (Hard difficulty: 400 HP, 45 damage)
  boss = {
    x: 2050, y: -80, w: 48, h: 48, hp: 400, maxHp: 400, vx: 0, vy: 0,
    damage: 45, color: '#1a0d0d', isHurt: 0, state: 'falling', stateTimer: 0,
    isGrounded: false, direction: -1, projectiles: [], debrisWarnings: [],
    landed: false, enraged: false
  };
}

// Map Layout (The Backrooms Theme)
function initLevel4() {
  platforms = [
    // Flat yellow corridors with ceiling drop points
    { x: 0, y: 230, w: 450, h: 50 },    // Section 1: Yellow damp carpet corridor
    { x: 520, y: 230, w: 400, h: 50 },  // Section 2
    { x: 1000, y: 230, w: 450, h: 50 }, // Section 3
    { x: 1530, y: 230, w: 700, h: 50 }, // Boss Room

    // Narrow corridors or ceiling vents (floating platforms simulating vents/pipes)
    { x: 220, y: 160, w: 90, h: 8 },
    { x: 380, y: 130, w: 70, h: 8 },
    { x: 450, y: 170, w: 50, h: 8 },    // Bridge step
    { x: 700, y: 150, w: 100, h: 8 },
    { x: 920, y: 180, w: 50, h: 8 },
    { x: 1100, y: 140, w: 80, h: 8 },
    { x: 1250, y: 170, w: 80, h: 8 },
    { x: 1450, y: 150, w: 50, h: 8 }
  ];

  hazards = [
    // Carpet Mold Spills
    { x: 600, y: 230, w: 32, damage: 15 },
    { x: 1200, y: 230, w: 40, damage: 15 }
  ];

  pickups = [
    // Almond Water bottle items (represented by water type)
    { x: 150, y: 120, w: 12, h: 12, type: 'water', active: true },
    { x: 410, y: 90, w: 12, h: 12, type: 'water', active: true },
    { x: 750, y: 110, w: 12, h: 12, type: 'water', active: true },
    { x: 1140, y: 100, w: 12, h: 12, type: 'water', active: true },
    { x: 1280, y: 130, w: 12, h: 12, type: 'water', active: true },
    { x: 1650, y: 140, w: 12, h: 12, type: 'water', active: true }
  ];

  enemies = [
    { 
      x: 260, y: 198, w: 20, h: 32, hp: 9999, maxHp: 9999, vx: 1.4, damage: 20, 
      color: '#a0a0a0', name: 'Skinwalker', patrolStart: 100, patrolEnd: 420, isHurt: 0 
    },
    { 
      x: 640, y: 206, w: 24, h: 24, hp: 9999, maxHp: 9999, vx: 1.6, damage: 25, 
      color: '#000000', name: 'Smiler', patrolStart: 530, patrolEnd: 880, isHurt: 0 
    },
    { 
      x: 1080, y: 198, w: 28, h: 32, hp: 9999, maxHp: 9999, vx: 0.9, damage: 30, 
      color: '#8bc34a', name: 'Shrek', patrolStart: 1010, patrolEnd: 1380, isHurt: 0 
    }
  ];

  // The Bacteria (skinny black stick figure boss)
  boss = {
    x: 2050, y: -80, w: 48, h: 64, hp: 350, maxHp: 350, vx: 0, vy: 0, 
    damage: 40, color: '#000000', isHurt: 0, state: 'falling', stateTimer: 0,
    isGrounded: false, direction: -1, projectiles: [], debrisWarnings: [],
    landed: false, enraged: false
  };
}

// Map Layout (FNAF Pizzeria Theme)
function initLevel5() {
  platforms = [
    // Pizzeria corridors & hallways
    { x: 0, y: 230, w: 450, h: 50 },    // Corridor 1
    { x: 520, y: 230, w: 400, h: 50 },  // Corridor 2
    { x: 1000, y: 230, w: 450, h: 50 }, // Corridor 3
    { x: 1530, y: 230, w: 700, h: 50 }, // Security Office / Show Stage Area

    // Security tables & party table platforms
    { x: 220, y: 160, w: 80, h: 8 },
    { x: 380, y: 130, w: 70, h: 8 },
    { x: 450, y: 170, w: 50, h: 8 },    // Bridge step
    { x: 700, y: 150, w: 100, h: 8 },
    { x: 920, y: 180, w: 50, h: 8 },
    { x: 1100, y: 140, w: 80, h: 8 },
    { x: 1250, y: 170, w: 80, h: 8 },
    { x: 1450, y: 150, w: 50, h: 8 }
  ];

  hazards = [
    // Exposed electrical wiring
    { x: 600, y: 230, w: 32, damage: 20 },
    { x: 1220, y: 230, w: 40, damage: 20 }
  ];

  pickups = [
    // Pizza Slices
    { x: 150, y: 120, w: 12, h: 12, type: 'pizza', active: true },
    { x: 410, y: 90, w: 12, h: 12, type: 'pizza', active: true },
    { x: 750, y: 110, w: 12, h: 12, type: 'pizza', active: true },
    { x: 1140, y: 100, w: 12, h: 12, type: 'pizza', active: true },
    { x: 1280, y: 130, w: 12, h: 12, type: 'pizza', active: true },
    { x: 1650, y: 140, w: 12, h: 12, type: 'pizza', active: true }
  ];

  enemies = [
    { 
      x: 260, y: 198, w: 20, h: 32, hp: 45, maxHp: 45, vx: 1.1, damage: 15, 
      color: '#673ab7', name: 'Bonnie', patrolStart: 100, patrolEnd: 420, isHurt: 0 
    },
    { 
      x: 640, y: 206, w: 22, h: 24, hp: 35, maxHp: 35, vx: 1.3, damage: 12, 
      color: '#ffeb3b', name: 'Chica', patrolStart: 530, patrolEnd: 880, isHurt: 0 
    },
    { 
      x: 1080, y: 198, w: 18, h: 32, hp: 50, maxHp: 50, vx: 2.2, damage: 18, 
      color: '#ff3d00', name: 'Foxy', patrolStart: 1010, patrolEnd: 1380, isHurt: 0 
    }
  ];

  // 1/10 chance to face Golden Freddy instead of Freddy Fazbear
  const isGolden = Math.random() < 0.1;
  if (isGolden) {
    boss = {
      x: 2050, y: -80, w: 48, h: 48, hp: 500, maxHp: 500, vx: 0, vy: 0, 
      damage: 50, color: '#ffd700', isHurt: 0, state: 'falling', stateTimer: 0,
      isGrounded: false, direction: -1, projectiles: [], debrisWarnings: [],
      landed: false, enraged: false, isGoldenFreddy: true
    };
    levelHudData[5].boss = 'ENTITY: GOLDEN FREDDY';
    levelHudData[5].bossIntroText = "IT'S ME: GOLDEN FREDDY";
    levelHudData[5].victoryDesc = 'Golden Freddy faded away!';
    levelHudData[5].victorySub = 'YOU SURVIVED THE HALLUCINATION!';
  } else {
    boss = {
      x: 2050, y: -80, w: 48, h: 48, hp: 380, maxHp: 380, vx: 0, vy: 0, 
      damage: 35, color: '#5d4037', isHurt: 0, state: 'falling', stateTimer: 0,
      isGrounded: false, direction: -1, projectiles: [], debrisWarnings: [],
      landed: false, enraged: false, isGoldenFreddy: false
    };
    levelHudData[5].boss = 'ANIMATRONIC: FREDDY FAZBEAR';
    levelHudData[5].bossIntroText = 'WARNING: FREDDY FAZBEAR IS ACTIVE';
    levelHudData[5].victoryDesc = 'Freddy has been deactivated!';
    levelHudData[5].victorySub = 'YOU SURVIVED THE NIGHT!';
  }
}

function initLevel6() {
  platforms = [
    // Starting Ground
    { x: 0, y: 230, w: 300, h: 50 },

    // Parkour Jumps - Phase 1 (easy)
    { x: 380, y: 190, w: 60, h: 10 },
    { x: 500, y: 150, w: 60, h: 10 },
    { x: 620, y: 120, w: 60, h: 10 },
    { x: 740, y: 160, w: 80, h: 10 },
    { x: 880, y: 200, w: 50, h: 10 },

    // Checkpoint 1 Floor (safe area, but has a spike in the middle)
    { x: 980, y: 230, w: 200, h: 50 },

    // Parkour Jumps - Phase 2 (medium, floating columns)
    { x: 1250, y: 180, w: 70, h: 10 },
    { x: 1390, y: 140, w: 60, h: 10 },
    { x: 1520, y: 180, w: 50, h: 10 },
    { x: 1640, y: 210, w: 80, h: 10 },
    { x: 1780, y: 170, w: 70, h: 10 },
    { x: 1910, y: 130, w: 60, h: 10 },
    { x: 2020, y: 90, w: 50, h: 10 },
    { x: 2130, y: 140, w: 70, h: 10 },
    { x: 2260, y: 180, w: 60, h: 10 },

    // Checkpoint 2 Floor
    { x: 2380, y: 230, w: 250, h: 50 },

    // Parkour Jumps - Phase 3 (challenging, steep jumps)
    { x: 2700, y: 180, w: 70, h: 10 },
    { x: 2840, y: 140, w: 50, h: 10 },
    { x: 2960, y: 100, w: 60, h: 10 },
    { x: 3080, y: 140, w: 50, h: 10 },
    { x: 3200, y: 180, w: 70, h: 10 },
    { x: 3320, y: 220, w: 60, h: 10 },

    // Finish Ground
    { x: 3430, y: 230, w: 700, h: 50 }
  ];

  hazards = [
    // Concrete spikes / glass traps
    { x: 1060, y: 230, w: 32, damage: 20 },
    { x: 2480, y: 230, w: 40, damage: 20 },
    { x: 3550, y: 230, w: 32, damage: 20 }
  ];

  pickups = [
    // Dalgona candy pickups
    { x: 410, y: 150, w: 12, h: 12, type: 'dalgona', active: true },
    { x: 650, y: 80, w: 12, h: 12, type: 'dalgona', active: true },
    { x: 1410, y: 100, w: 12, h: 12, type: 'dalgona', active: true },
    { x: 1800, y: 130, w: 12, h: 12, type: 'dalgona', active: true },
    { x: 2040, y: 50, w: 12, h: 12, type: 'dalgona', active: true },
    { x: 2980, y: 60, w: 12, h: 12, type: 'dalgona', active: true },
    { x: 3450, y: 190, w: 12, h: 12, type: 'dalgona', active: true }
  ];

  enemies = [
    // NPC contestants (Ali #199, Sang-woo #218, Deok-su #101, Sae-byeok #067)
    {
      x: 30, y: 198, w: 16, h: 24, hp: 100, maxHp: 100, vx: 0.0, vy: 0,
      name: 'Contestant 199', color: '#00796b', targetX: 3800,
      reactionDelay: 10, reactionTimer: 0, isGrounded: true, patrolStart: 0, patrolEnd: 4000
    },
    {
      x: 70, y: 198, w: 16, h: 24, hp: 100, maxHp: 100, vx: 0.0, vy: 0,
      name: 'Contestant 218', color: '#00796b', targetX: 3800,
      reactionDelay: 16, reactionTimer: 0, isGrounded: true, patrolStart: 0, patrolEnd: 4000
    },
    {
      x: 110, y: 198, w: 16, h: 24, hp: 100, maxHp: 100, vx: 0.0, vy: 0,
      name: 'Contestant 101', color: '#00796b', targetX: 3800,
      reactionDelay: 25, reactionTimer: 0, isGrounded: true, patrolStart: 0, patrolEnd: 4000
    },
    {
      x: 150, y: 198, w: 16, h: 24, hp: 100, maxHp: 100, vx: 0.0, vy: 0,
      name: 'Contestant 067', color: '#00796b', targetX: 3800,
      reactionDelay: 5, reactionTimer: 0, isGrounded: true, patrolStart: 0, patrolEnd: 4000
    }
  ];

  // Define boss as the Giant Doll at the far end (indestructible)
  boss = null;
}

function startPlatformerGame(levelNum = 1) {
  currentLevel = levelNum;
  mapScreen.style.display = 'none';
  playScreen.style.display = 'flex';

  // Update all dynamic HUD and overlay labels
  const ld = levelHudData[levelNum] || levelHudData[1];
  document.getElementById('stage-hud-label').textContent = ld.hud;
  document.getElementById('boss-hud-label').textContent = ld.boss;
  document.getElementById('briefing-title').textContent = ld.briefingTitle;
  document.getElementById('briefing-desc').textContent = ld.briefingDesc;
  document.getElementById('victory-desc').textContent = ld.victoryDesc;
  document.getElementById('victory-subtitle').textContent = ld.victorySub;

  // Show briefing overlays
  instructionsOverlay.classList.add('active');
  gameoverOverlay.classList.remove('active');
  victoryOverlay.classList.remove('active');
  bossHud.style.display = 'none';

  score = 0;
  playerScoreText.textContent = "0000";
  playerHpBar.style.width = '100%';

  // Potions
  playerPotions = 3 + playerStats.upgrades.potionsCount;
  const potEl = document.getElementById('player-potions');
  if (potEl) potEl.textContent = playerPotions;
  healParticles = [];
  gateY = -80; // gate starts above screen
  gateLocked = false;
  bossSkyCrimson = 0; // sky red blend factor 0..1
  
  // Squid Game variables reset
  squidState = 'green';
  squidStateTimer = 180;
  squidTimeRemaining = 7200; // 120 seconds
  squidGraceFrames = 0;
  squidChantStep = 0;
  squidChantTimer = 0;
  laserTraces = [];

  const upgradedMaxHp = 100 + playerStats.upgrades.hp * 20;
  player = {
    x: 50, y: 180, w: 16, h: 24, vx: 0, vy: 0, hp: upgradedMaxHp, maxHp: upgradedMaxHp,
    isGrounded: false, direction: 'right', isAttacking: false,
    attackCooldown: 0, attackAnimTimer: 0, isHurt: 0
  };

  bossIntroTriggered = false;
  bossIntroTimer = 0;

  initLevel();
  cameraX = 0;
  gameRunning = false;

  // Listeners
  keys = {};
  window.addEventListener('keydown', handleGameKeyDown);
  window.addEventListener('keyup', handleGameKeyUp);

  instructionsOverlay.addEventListener('click', startActualPlay);
}

function startActualPlay() {
  instructionsOverlay.removeEventListener('click', startActualPlay);
  instructionsOverlay.classList.remove('active');

  gameRunning = true;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  gameLoopId = requestAnimationFrame(gameStep);
}

function handleGameKeyDown(e) {
  keys[e.code] = true;

  // Dismiss instruction overlay on any key press
  if (instructionsOverlay.classList.contains('active')) {
    startActualPlay();
    return;
  }

  // Jump logic (Jump + Double Jump)
  if (e.code === 'ArrowUp' || e.code === 'KeyW') {
    if (player.isGrounded) {
      player.vy = -7.5;
      player.isGrounded = false;
      doubleJumpCount = 1;
      try { playJumpSound(); } catch (err) { }
    } else if (doubleJumpCount > 0) {
      player.vy = -7.0;
      doubleJumpCount = 0;
      try { playJumpSound(); } catch (err) { }
    }
  }

  // Attack logic
  if (e.code === 'Space') {
    if (player.attackCooldown <= 0) {
      player.isAttacking = true;
      player.attackCooldown = 22;
      player.attackAnimTimer = 12;
      try { playSlashSound(); } catch (err) { }
      checkPlayerAttackHit();
    }
  }

  // Potion healing (H key)
  if (e.code === 'KeyH') {
    if (playerPotions > 0 && player.hp > 0 && player.hp < player.maxHp) {
      playerPotions--;
      const potEl = document.getElementById('player-potions');
      if (potEl) potEl.textContent = playerPotions;
      const healAmt = 35 + playerStats.upgrades.potionHeal * 10;
      const heal = Math.min(healAmt, player.maxHp - player.hp);
      player.hp += heal;
      playerHpBar.style.width = (player.hp / player.maxHp) * 100 + '%';
      // Spawn green/cyan heal particles
      for (let i = 0; i < 10; i++) {
        healParticles.push({
          x: player.x + 4 + Math.random() * 8,
          y: player.y + 10,
          vx: (Math.random() - 0.5) * 1.4,
          vy: -(Math.random() * 2 + 1),
          life: 1.0,
          color: currentLevel === 4 ? '#00e5ff' : '#00ff88' // cyan particles for almond water!
        });
      }
      try {
        playTone(440, 0.08, 0.0, 'sine', 0.1);
        playTone(523.25, 0.08, 0.07, 'sine', 0.1);
        playTone(659.25, 0.14, 0.14, 'sine', 0.12);
      } catch (err) { }
    }
  }
}

function handleGameKeyUp(e) {
  keys[e.code] = false;
}

// Collisions helper
function boxCollision(b1, b2) {
  return b1.x < b2.x + b2.w &&
    b1.x + b1.w > b2.x &&
    b1.y < b2.y + b2.h &&
    b1.y + b1.h > b2.y;
}

function checkPlayerAttackHit() {
  // Sword slash hitbox in front of player
  const slashWidth = 26;
  const slashHeight = 32;
  const attackBox = {
    x: player.direction === 'right' ? player.x + player.w : player.x - slashWidth,
    y: player.y - 4,
    w: slashWidth,
    h: slashHeight
  };

  // Check normal enemies
  enemies.forEach(enemy => {
    if (enemy.hp > 0 && boxCollision(attackBox, enemy)) {
      enemy.hp -= (20 + playerStats.upgrades.damage * 5);
      enemy.isHurt = 12; // flash red ticks
      try { playHitSound(); } catch (e) { }
      // Knockback enemy
      enemy.x += player.direction === 'right' ? 8 : -8;
      if (enemy.hp <= 0) {
        score += 100;
        playerScoreText.textContent = String(score).padStart(4, '0');
      }
    }
  });

  // Check Boss
  if (boss && boss.hp > 0 && boxCollision(attackBox, boss)) {
    if (player.x > 1530) {
      // If boss is spinning, deflect attack
      if (boss.state === 'spin') {
        try {
          playTone(1200, 0.05, 0.0, 'sine', 0.15); // high metal ding
        } catch (e) { }
        // Knockback player hard
        player.vx = player.direction === 'right' ? -4.5 : 4.5;
        player.vy = -2.0;
      } else {
        boss.hp -= (15 + playerStats.upgrades.damage * 5);
        boss.isHurt = 12;
        try { playHitSound(); } catch (e) { }
        if (boss.hp < 0) boss.hp = 0;
        bossHpBar.style.width = (boss.hp / boss.maxHp) * 100 + '%';

        // Knock back player a little (taking no damage) to allow boss space to attack
        player.vx = player.x < boss.x + boss.w / 2 ? -2.5 : 2.5;
        player.vy = -1.5;
      }
    }
  }
}

// Main Game loop
function gameStep() {
  if (!gameRunning) return;

  updatePhysics();
  drawGame();

  gameLoopId = requestAnimationFrame(gameStep);
}

function updatePhysics() {
  // 0. Check Boss Intro Stage Trigger
  if (currentLevel !== 6 && player.x > 1530 && !bossIntroTriggered) {
    bossIntroTriggered = true;
    bossIntroTimer = 160; // ~2.7s intro at 60fps
    boss.x = 1860;
    boss.y = -80; // Drop from sky
    boss.vy = 0;
    boss.state = 'falling';

    // Lock iron gate
    gateLocked = true;
    gateY = -80;

    // Trigger Boss Siren (dual-tone alarm)
    try {
      playTone(330, 0.25, 0.0, 'sawtooth', 0.1);
      playTone(220, 0.25, 0.2, 'sawtooth', 0.1);
      playTone(330, 0.25, 0.4, 'sawtooth', 0.1);
      playTone(220, 0.25, 0.6, 'sawtooth', 0.1);
    } catch (e) { }
  }

  // Animate gate sliding down
  if (gateLocked && gateY < 0) {
    gateY += 4;
    if (gateY > 0) gateY = 0;
  }

  // Animate sky crimson shift during boss
  if (bossIntroTriggered && bossSkyCrimson < 1) {
    bossSkyCrimson += 0.008;
    if (bossSkyCrimson > 1) bossSkyCrimson = 1;
  }

  if (bossIntroTimer > 0) {
    bossIntroTimer--;
    // Freeze player input but allow gravity
    player.vx = 0;
    // Boss falls from sky
    if (boss.state === 'falling') {
      boss.vy += 0.6;
      boss.y += boss.vy;
      // Check ground landing
      if (boss.y >= 182) {
        boss.y = 182;
        boss.vy = 0;
        boss.state = 'idle';
        boss.stateTimer = 80;
        boss.landed = true;
        // CRASH landing
        viewport.classList.add('shake');
        setTimeout(() => viewport.classList.remove('shake'), 500);
        try {
          playTone(55, 0.5, 0.0, 'sawtooth', 0.25);
          playTone(80, 0.4, 0.1, 'sawtooth', 0.2);
        } catch (e) { }
      }
    }
    // Siren repeats
    if (bossIntroTimer === 100 || bossIntroTimer === 50) {
      try {
        playTone(330, 0.25, 0.0, 'sawtooth', 0.1);
        playTone(220, 0.25, 0.2, 'sawtooth', 0.1);
      } catch (e) { }
    }
    if (bossIntroTimer > 0) return; // Still in intro — freeze player
  }

  // Update heal particles
  for (let i = healParticles.length - 1; i >= 0; i--) {
    const hp = healParticles[i];
    hp.x += hp.vx;
    hp.y += hp.vy;
    hp.life -= 0.04;
    if (hp.life <= 0) healParticles.splice(i, 1);
  }

  // Update laser traces
  for (let i = laserTraces.length - 1; i >= 0; i--) {
    laserTraces[i].alpha -= 0.08;
    if (laserTraces[i].alpha <= 0) laserTraces.splice(i, 1);
  }

  // Squid Game Rules & Sound Effects
  if (currentLevel === 6 && gameRunning && !instructionsOverlay.classList.contains('active')) {
    // Tick general timer
    squidTimeRemaining--;
    if (squidTimeRemaining <= 0) {
      squidTimeRemaining = 0;
      player.hp = 0;
      triggerPlayerDeath();
    }

    if (squidState === 'green') {
      squidChantTimer--;
      if (squidChantTimer <= 0) {
        if (squidChantStep < 10) {
          const melody = [392, 392, 440, 392, 330, 440, 440, 392, 330, 294];
          try {
            playTone(melody[squidChantStep], 0.12, 0.0, 'sine', 0.08);
          } catch (e) { }
          
          const chantInterval = [14, 14, 20, 14, 18, 14, 14, 18, 14, 26];
          squidChantTimer = chantInterval[squidChantStep];
          squidChantStep++;
        } else {
          // Switch to RED LIGHT
          squidState = 'red';
          squidStateTimer = Math.floor(Math.random() * 90) + 90; // 1.5 - 3s
          squidGraceFrames = 14;
          squidChantStep = 0;
          squidChantTimer = 0;
          try {
            playTone(150, 0.3, 0.0, 'sawtooth', 0.15); // low buzz warning
          } catch (e) { }
          
          // Set reaction timers for NPCs
          enemies.forEach(npc => {
            if (npc.name && npc.name.startsWith('Contestant')) {
              npc.reactionTimer = npc.reactionDelay;
            }
          });
        }
      }
    } else {
      // Red light phase
      squidStateTimer--;
      if (squidGraceFrames > 0) squidGraceFrames--;

      // Check player movement
      if (squidGraceFrames === 0) {
        const isMoving = Math.abs(player.vx) > 0.15 || Math.abs(player.vy) > 0.1;
        if (isMoving && player.hp > 0 && player.x < 3800) {
          damagePlayer(35, player.direction === 'right' ? -2.5 : 2.5); // knock back
          try {
            playTone(80, 0.15, 0.0, 'sawtooth', 0.2);
            playTone(40, 0.2, 0.03, 'sawtooth', 0.25);
          } catch (e) { }
          createSniperLaser(player.x + player.w/2, player.y + player.h/2);
        }
      }

      if (squidStateTimer <= 0) {
        squidState = 'green';
        squidChantStep = 0;
        squidChantTimer = 10;
        try {
          playTone(523.25, 0.1, 0.0, 'sine', 0.1);
          playTone(659.25, 0.1, 0.06, 'sine', 0.1);
        } catch (e) { }
      }
    }
  }

  // 1. Move Player Left/Right
  const accel = 0.45;
  const maxSpeed = 3.2;
  const friction = 0.82;

  if (keys['ArrowLeft'] || keys['KeyA']) {
    player.vx -= accel;
    player.direction = 'left';
  } else if (keys['ArrowRight'] || keys['KeyD']) {
    player.vx += accel;
    player.direction = 'right';
  } else {
    player.vx *= friction;
  }

  // Clamp player speed
  if (player.vx > maxSpeed) player.vx = maxSpeed;
  if (player.vx < -maxSpeed) player.vx = -maxSpeed;

  // Apply gravity
  player.vy += 0.38;

  // Update attack timers
  if (player.attackCooldown > 0) player.attackCooldown--;
  if (player.attackAnimTimer > 0) player.attackAnimTimer--;
  if (player.attackAnimTimer === 0) player.isAttacking = false;

  // Update invincibility frames
  if (player.isHurt > 0) player.isHurt--;

  // X Collision
  player.x += player.vx;
  platforms.forEach(plat => {
    if (boxCollision(player, plat)) {
      if (player.vx > 0) player.x = plat.x - player.w;
      else if (player.vx < 0) player.x = plat.x + plat.w;
      player.vx = 0;
    }
  });

  // Y Collision
  player.isGrounded = false;
  player.y += player.vy;
  platforms.forEach(plat => {
    if (boxCollision(player, plat)) {
      if (player.vy > 0) {
        player.y = plat.y - player.h;
        player.vy = 0;
        player.isGrounded = true;
      } else if (player.vy < 0) {
        player.y = plat.y + plat.h;
        player.vy = 0;
      }
    }
  });

  // 2. Camera scroll (follow player, clamp between stage edges)
  cameraX = player.x - 180;
  if (cameraX < 0) cameraX = 0;
  // If player reaches boss arena (x > 1530), camera locks
  if (player.x > 1530) {
    if (currentLevel !== 6) {
      cameraX = 1530;
    }
  } else {
    if (cameraX > 1530) {
      if (currentLevel !== 6) cameraX = 1530;
    }
  }

  // Clamp camera at the far right of Squid Game stage
  const maxCameraX = currentLevel === 6 ? 3500 : 1530;
  if (currentLevel === 6 && cameraX > maxCameraX) cameraX = maxCameraX;

  // Clamp player within stage bounds
  if (player.x < 0) player.x = 0;
  if (gateLocked && player.x < 1546) player.x = 1546;
  if (gateLocked && player.x > 1998) player.x = 1998;
  const maxPlayerX = currentLevel === 6 ? 3950 : 2180;
  if (player.x > maxPlayerX) player.x = maxPlayerX;

  // Fall in pit death check
  if (player.y > V_HEIGHT + 30) {
    player.hp = 0;
    triggerPlayerDeath();
  }

  // 3. Spikes Hazard Collision
  hazards.forEach(spike => {
    const spikeBox = { x: spike.x, y: spike.y - 4, w: spike.w, h: 8 };
    if (boxCollision(player, spikeBox)) {
      damagePlayer(spike.damage, player.x < spike.x + spike.w / 2 ? -1.8 : 1.8);
    }
  });

  // 4. Enemy Updates (patrol & hit checks or NPC runners)
  if (currentLevel === 6) {
    enemies.forEach(npc => {
      if (npc.hp <= 0) return;

      // Apply gravity
      npc.vy += 0.35;
      if (npc.vy > 8) npc.vy = 8;

      // React to light
      if (squidState === 'green') {
        // Green light: run forward. Smarter: adapt speed based on time left.
        let baseSpeed = 1.5 + (npc.name.charCodeAt(11) % 5) * 0.25;
        if (squidTimeRemaining < 1800) baseSpeed += 0.8;
        npc.vx = baseSpeed;
        // Set up reaction delay for the next red light
        npc.reactionTimer = Math.floor(Math.random() * 5) + 2; 
      } else {
        // Red light: stop after reaction delay
        if (npc.reactionTimer > 0) {
          npc.reactionTimer--;
        } else {
          npc.vx = 0; // Hard stop
          npc.vy = 0; // Prevent jumping mid-stop
        }
      }

      // Apply X movement
      npc.x += npc.vx;
      
      // Platform collision X
      platforms.forEach(plat => {
        if (boxCollision(npc, plat)) {
          if (npc.vx > 0) npc.x = plat.x - npc.w;
          else if (npc.vx < 0) npc.x = plat.x + plat.w;
          // Blocked: try to jump
          if (npc.isGrounded) {
            npc.vy = -6.5;
            npc.isGrounded = false;
          }
        }
      });

      // Apply Y movement
      npc.isGrounded = false;
      npc.y += npc.vy;
      
      // Platform collision Y
      platforms.forEach(plat => {
        if (boxCollision(npc, plat)) {
          if (npc.vy > 0) {
            npc.y = plat.y - npc.h;
            npc.vy = 0;
            npc.isGrounded = true;
          } else if (npc.vy < 0) {
            npc.y = plat.y + plat.h;
            npc.vy = 0;
          }
        }
      });

      // Smart Jump over gaps: check if there's no platform ahead
      if (npc.isGrounded && Math.abs(npc.vx) > 0) {
        let groundAhead = false;
        const testFootX = npc.x + npc.w + (npc.vx * 12);
        const testFootY = npc.y + npc.h + 8;
        platforms.forEach(plat => {
          if (testFootX >= plat.x && testFootX <= plat.x + plat.w && testFootY >= plat.y && testFootY <= plat.y + plat.h + 20) {
            groundAhead = true;
          }
        });
        if (!groundAhead) {
          npc.vy = -6.8;
          npc.isGrounded = false;
        }
      }

      // Fall in pit check
      if (npc.y > V_HEIGHT + 30) {
        npc.hp = 0;
      }

      // Shot check during red light
      if (squidState === 'red' && squidGraceFrames === 0) {
        const isMoving = Math.abs(npc.vx) > 0.05 || Math.abs(npc.vy) > 0.05;
        if (isMoving && npc.x < 3800) {
          npc.hp = 0;
          createSniperLaser(npc.x + npc.w/2, npc.y + npc.h/2);
          for (let p = 0; p < 8; p++) {
            particles.push(new ExplodeParticle(npc.x + npc.w/2, npc.y + npc.h/2));
          }
          try { playTone(80, 0.15, 0.0, 'sawtooth', 0.2); } catch(e){}
        }
      }
    });
  } else {
    enemies.forEach(enemy => {
      if (enemy.hp <= 0) return;

      // Patrol AI
      enemy.x += enemy.vx;
      if (enemy.x <= enemy.patrolStart) {
        enemy.x = enemy.patrolStart;
        enemy.vx = -enemy.vx;
      } else if (enemy.x + enemy.w >= enemy.patrolEnd) {
        enemy.x = enemy.patrolEnd - enemy.w;
        enemy.vx = -enemy.vx;
      }

      if (enemy.isHurt > 0) enemy.isHurt--;

      // Collision with player (deals size-based damage)
      if (boxCollision(player, enemy)) {
        damagePlayer(enemy.damage, player.x < enemy.x + enemy.w / 2 ? -2.2 : 2.2);
      }
    });
  }

  // 5. Healing Pickups Collision checks
  pickups.forEach(heart => {
    if (heart.active && boxCollision(player, heart)) {
      heart.active = false;
      player.hp = Math.min(player.maxHp, player.hp + 30);
      playerHpBar.style.width = (player.hp / player.maxHp) * 100 + '%';
      score += 50;
      playerScoreText.textContent = String(score).padStart(4, '0');
      if (currentLevel === 6) {
        try {
          playTone(440, 0.08, 0.0, 'triangle', 0.1);
          playTone(880, 0.1, 0.05, 'triangle', 0.12);
        } catch (e) { }
      } else {
        try {
          playTone(523.25, 0.08, 0.0, 'sine', 0.12); // C5
          playTone(659.25, 0.12, 0.04, 'sine', 0.12); // E5
        } catch (err) { }
      }
    }
  });

  // 6. Boss Battle Logic
  if (boss && boss.hp > 0) {
    if (boss.isHurt > 0) boss.isHurt--;

    if (player.x > 1530) {
      bossHud.style.display = 'flex';

      // Boss state machine
      boss.stateTimer--;

      // Gravity
      boss.vy += 0.35;
      boss.y += boss.vy;
      boss.isGrounded = false;

      // Boss platform collision
      platforms.forEach(plat => {
        if (boxCollision(boss, plat)) {
          if (boss.vy > 0) {
            boss.y = plat.y - boss.h;
            boss.vy = 0;
            boss.isGrounded = true;
          }
        }
      });

      // Check enrage (below 50% HP)
      if (!boss.enraged && boss.hp <= boss.maxHp * 0.5) {
        boss.enraged = true;
        try {
          playTone(110, 0.4, 0.0, 'sawtooth', 0.2);
          playTone(150, 0.4, 0.15, 'sawtooth', 0.18);
        } catch (e) { }
      }
      const speedMult = boss.enraged ? 1.3 : 1.0;
      // Boss states
      if (boss.state === 'idle') {
        boss.vx = 0;
        boss.direction = player.x < boss.x ? -1 : 1;
        if (boss.stateTimer <= 0) {
          const choice = Math.random();
          // Level-dependent difficulty multipliers
          const diffMult = currentLevel === 1 ? 1.0 : (currentLevel === 2 ? 1.25 : 1.5);

          if (choice < 0.28) {
            // Charge attack
            boss.state = 'charge';
            boss.stateTimer = currentLevel === 1 ? 75 : (currentLevel === 2 ? 65 : 50);
            boss.vx = boss.direction * 3.0 * speedMult * diffMult;
          } else if (choice < 0.50) {
            // Stomp attack
            boss.state = 'stomp';
            boss.stateTimer = currentLevel === 1 ? 110 : (currentLevel === 2 ? 95 : 80);
            boss.vy = currentLevel === 1 ? -8.0 : (currentLevel === 2 ? -8.7 : -9.5); // jump height
            boss.isGrounded = false;
          } else if (choice < 0.75) {
            // Shockwave projectile blast
            boss.state = 'shockwave';
            boss.stateTimer = currentLevel === 1 ? 65 : (currentLevel === 2 ? 55 : 42);
            try { playTone(140, 0.22, 0.0, 'sawtooth', 0.15); } catch (e) { }
          } else if (choice < 0.9) {
            // Cyclone Spin attack
            boss.state = 'spin';
            boss.stateTimer = currentLevel === 1 ? 130 : (currentLevel === 2 ? 110 : 85);
            boss.vx = boss.direction * 1.6 * speedMult * diffMult;
          } else {
            // Earth Shatter / Meteor Rain
            boss.state = 'earthshatter';
            boss.stateTimer = currentLevel === 1 ? 100 : (currentLevel === 2 ? 90 : 75);
            boss.debrisWarnings = [];
            const arenaLeft = 1550;
            const debrisCount = currentLevel === 1 ? 3 : (currentLevel === 2 ? 4 : 5);
            const warningTicks = currentLevel === 1 ? 50 : (currentLevel === 2 ? 40 : 30); // faster meteors

            const arenaWidth = 400;
            for (let di = 0; di < debrisCount; di++) {
              boss.debrisWarnings.push({
                x: arenaLeft + di * (arenaWidth / debrisCount) + Math.random() * 20,
                warningTimer: warningTicks,
                rock: null
              });
            }
            try {
              playTone(200, 0.1, 0.0, 'triangle', 0.12);
              playTone(160, 0.1, 0.08, 'triangle', 0.1);
            } catch (e) { }
          }
        }
      } else if (boss.state === 'charge') {
        boss.x += boss.vx;
        // Clamp in arena bounds
        if (boss.x < 1550) { boss.x = 1550; boss.vx = -boss.vx; }
        if (boss.x + boss.w > 2014) { boss.x = 2014 - boss.w; boss.vx = -boss.vx; }

        if (boss.stateTimer <= 0) {
          boss.state = 'idle';
          boss.stateTimer = currentLevel === 1 ? 90 : (currentLevel === 2 ? 60 : 35); // dizzy rests (shorter on higher diff)
        }
      } else if (boss.state === 'stomp') {
        // Track player on rise, slam down on fall
        if (boss.vy < 0) {
          const dx = player.x - boss.x;
          boss.x += Math.sign(dx) * 1.5;
        } else {
          boss.vy += 0.4;
        }

        boss.x += boss.vx;
        if (boss.x < 1550) boss.x = 1550;
        if (boss.x + boss.w > 2014) boss.x = 2014 - boss.w;

        // Ground landing creates screen shake + shockwave
        if (boss.isGrounded && boss.vy === 0 && boss.stateTimer > 0) {
          boss.state = 'idle';
          boss.stateTimer = currentLevel === 1 ? 60 : (currentLevel === 2 ? 40 : 20); // stunned rest

          viewport.classList.add('shake');
          setTimeout(() => viewport.classList.remove('shake'), 400);
          try { playTone(80, 0.35, 0.0, 'sawtooth', 0.2); } catch (e) { }

          // Shockwave hits player if player is grounded
          const shockwaveDist = currentLevel === 1 ? 220 : (currentLevel === 2 ? 250 : 280);
          const shockwaveDmg = currentLevel === 1 ? 15 : (currentLevel === 2 ? 22 : 30);
          if (player.isGrounded && Math.abs(player.x - boss.x) < shockwaveDist) {
            damagePlayer(shockwaveDmg, player.x < boss.x ? -2.0 : 2.0);
          }
        }
      } else if (boss.state === 'shockwave') {
        // Spawn floor projectiles halfway through state
        const midTime = currentLevel === 1 ? 32 : (currentLevel === 2 ? 27 : 21);
        if (boss.stateTimer === midTime) {
          if (!boss.projectiles) boss.projectiles = [];
          if (currentLevel === 1) {
            // Left rock wave
            boss.projectiles.push({
              x: boss.x - 12,
              y: boss.y + boss.h - 16,
              w: 12,
              h: 12,
              vx: -3.5,
              damage: 15
            });
            // Right rock wave
            boss.projectiles.push({
              x: boss.x + boss.w,
              y: boss.y + boss.h - 16,
              w: 12,
              h: 12,
              vx: 3.5,
              damage: 15
            });
          } else if (currentLevel === 2) {
            // Left bubble
            boss.projectiles.push({
              x: boss.x - 12,
              y: boss.y + boss.h - 16,
              w: 12,
              h: 12,
              vx: -4.5,
              damage: 22
            });
            // Right bubble
            boss.projectiles.push({
              x: boss.x + boss.w,
              y: boss.y + boss.h - 16,
              w: 12,
              h: 12,
              vx: 4.5,
              damage: 22
            });
          } else {
            // Left fireball
            boss.projectiles.push({
              x: boss.x - 12,
              y: boss.y + boss.h - 16,
              w: 12,
              h: 12,
              vx: -5.5,
              damage: 30
            });
            // Right fireball
            boss.projectiles.push({
              x: boss.x + boss.w,
              y: boss.y + boss.h - 16,
              w: 12,
              h: 12,
              vx: 5.5,
              damage: 30
            });
            // Upper fireball targeting player direction
            boss.projectiles.push({
              x: boss.x + boss.w / 2 - 6,
              y: boss.y + boss.h - 32,
              w: 12,
              h: 12,
              vx: player.x < boss.x ? -5.0 : 5.0,
              damage: 30
            });
          }
          try {
            playTone(400, 0.12, 0.0, 'triangle', 0.08);
            playTone(300, 0.12, 0.05, 'triangle', 0.08);
          } catch (e) { }
        }
        if (boss.stateTimer <= 0) {
          boss.state = 'idle';
          boss.stateTimer = currentLevel === 1 ? 45 : (currentLevel === 2 ? 35 : 20);
        }
      } else if (boss.state === 'spin') {
        boss.x += boss.vx;
        if (boss.x < 1550) { boss.x = 1550; boss.vx = -boss.vx; }
        if (boss.x + boss.w > 2014) { boss.x = 2014 - boss.w; boss.vx = -boss.vx; }

        if (boss.stateTimer <= 0) {
          boss.state = 'idle';
          boss.stateTimer = currentLevel === 1 ? 90 : (currentLevel === 2 ? 60 : 35);
        }
      } else if (boss.state === 'earthshatter') {
        boss.vx = 0; // Stay still while shattering
        boss.debrisWarnings.forEach(dw => {
          if (dw.warningTimer > 0) {
            dw.warningTimer--;
          } else if (!dw.rock) {
            dw.rock = { x: dw.x, y: -10, w: 14, h: 14, vy: 2.5 + Math.random() * 2, done: false };
            try { playTone(300, 0.08, 0.0, 'triangle', 0.1); } catch (e) { }
          } else if (!dw.rock.done) {
            dw.rock.y += dw.rock.vy;
            dw.rock.vy += 0.5;
            // Check ground
            if (dw.rock.y + dw.rock.h >= 230) {
              dw.rock.y = 216;
              dw.rock.done = true;
              viewport.classList.add('shake');
              setTimeout(() => viewport.classList.remove('shake'), 200);
              try { playTone(80, 0.2, 0.0, 'sawtooth', 0.15); } catch (e) { }
            }
            // Player hit
            const rb = dw.rock;
            if (!dw.rock.done && boxCollision(player, rb)) {
              const rockDmg = currentLevel === 1 ? 25 : (currentLevel === 2 ? 30 : 40);
              damagePlayer(rockDmg, player.x < rb.x + rb.w / 2 ? -2.0 : 2.0);
              dw.rock.done = true;
            }
          }
        });
        if (boss.stateTimer <= 0) {
          boss.state = 'idle';
          boss.stateTimer = currentLevel === 1 ? 70 : (currentLevel === 2 ? 50 : 30);
          boss.debrisWarnings = [];
        }
      }

      // Update Boss Projectiles
      if (boss.projectiles) {
        for (let i = boss.projectiles.length - 1; i >= 0; i--) {
          const proj = boss.projectiles[i];
          proj.x += proj.vx;

          // Collision with player
          if (boxCollision(player, proj)) {
            damagePlayer(proj.damage, proj.vx > 0 ? 2.0 : -2.0);
            boss.projectiles.splice(i, 1);
            continue;
          }

          // Out of bounds
          if (proj.x < 1530 || proj.x > 2200) {
            boss.projectiles.splice(i, 1);
          }
        }
      }

      // Check boss/player collision
      if (boxCollision(player, boss)) {
        // If boss is spinning, deal rapid small contact damage
        if (boss.state === 'spin') {
          damagePlayer(15, player.x < boss.x + boss.w / 2 ? -2.5 : 2.5);
        } else {
          damagePlayer(boss.damage, player.x < boss.x + boss.w / 2 ? -3.0 : 3.0);
        }
      }
    }
  }

  // Boss defeated check
  if (boss && boss.hp <= 0 && gameRunning) {
    // Clear active projectiles on defeat
    if (boss.projectiles) boss.projectiles = [];
    triggerVictory();
  }

  // Squid Game victory check
  if (currentLevel === 6 && player.x >= 3800 && gameRunning) {
    triggerVictory();
  }
}

function damagePlayer(amount, knockbackX = 0) {
  if (player.isHurt > 0 || player.hp <= 0) return;

  player.hp -= amount;
  if (player.hp < 0) player.hp = 0;

  playerHpBar.style.width = (player.hp / player.maxHp) * 100 + '%';

  if (player.hp <= 0) {
    triggerPlayerDeath();
  } else {
    player.isHurt = 40; // invincibility frame ticks
    player.vx = knockbackX;
    player.vy = -3.0; // pop up
    try { playHurtSound(); } catch (err) { }
  }
}

function triggerPlayerDeath() {
  gameRunning = false;
  try { playDeathSound(); } catch (err) { }
  gameoverOverlay.classList.add('active');
  window.removeEventListener('keydown', handleGameKeyDown);
  window.removeEventListener('keyup', handleGameKeyUp);
}

function triggerVictory() {
  gameRunning = false;
  bossHud.style.display = 'none';
  try { playWinSound(); } catch (err) { }
  victoryOverlay.classList.add('active');
  window.removeEventListener('keydown', handleGameKeyDown);
  window.removeEventListener('keyup', handleGameKeyUp);

  // Compute rewards
  const baseCoins = 100;
  const scoreCoins = Math.floor(score / 10);
  const totalCoinsGained = baseCoins + scoreCoins;

  let diamondsGained = 0;
  if (currentLevel === 1) diamondsGained = 2;
  else if (currentLevel === 2) diamondsGained = 3;
  else if (currentLevel === 3) diamondsGained = 5;
  else if (currentLevel === 4) diamondsGained = 10;
  else if (currentLevel === 5) diamondsGained = 15;
  else if (currentLevel === 6) diamondsGained = 20;

  let unlockedSkinKey = null;
  if (currentLevel === 1 && !playerStats.unlockedSkins.includes('ranger')) {
    unlockedSkinKey = 'ranger';
    playerStats.unlockedSkins.push('ranger');
  } else if (currentLevel === 2 && !playerStats.unlockedSkins.includes('pirate')) {
    unlockedSkinKey = 'pirate';
    playerStats.unlockedSkins.push('pirate');
  } else if (currentLevel === 3 && !playerStats.unlockedSkins.includes('slayer')) {
    unlockedSkinKey = 'slayer';
    playerStats.unlockedSkins.push('slayer');
  } else if (currentLevel === 4 && !playerStats.unlockedSkins.includes('skinwalker')) {
    unlockedSkinKey = 'skinwalker';
    playerStats.unlockedSkins.push('skinwalker');
  } else if (currentLevel === 5 && !playerStats.unlockedSkins.includes('freddy')) {
    unlockedSkinKey = 'freddy';
    playerStats.unlockedSkins.push('freddy');
  } else if (currentLevel === 6 && !playerStats.unlockedSkins.includes('squid')) {
    unlockedSkinKey = 'squid';
    playerStats.unlockedSkins.push('squid');
  }

  // Update persistent state
  playerStats.coins += totalCoinsGained;
  playerStats.diamonds += diamondsGained;
  saveProgression();

  // Mark current stage as completed and restore map node
  if (!stageCompleted[currentLevel]) {
    stageCompleted[currentLevel] = true;
    localStorage.setItem(`stage_${currentLevel}_completed`, 'true');
    applyMapCompletionStates();
  }

  // Animate the ticking up of rewards in the overlay UI
  const coinsText = document.getElementById('victory-coins-earned');
  const diamondsText = document.getElementById('victory-diamonds-earned');
  const skinUnlockText = document.getElementById('victory-skin-unlock');

  if (coinsText) coinsText.textContent = "+0";
  if (diamondsText) diamondsText.textContent = "+0";
  if (skinUnlockText) {
    if (unlockedSkinKey && skinsData[unlockedSkinKey]) {
      skinUnlockText.innerHTML = `UNLOCKED SKIN:<br><span style="color:#00ff00;">${skinsData[unlockedSkinKey].name}</span>!`;
      skinUnlockText.style.display = 'block';
    } else {
      skinUnlockText.style.display = 'none';
    }
  }

  let coinsAnim = 0;
  let diamondsAnim = 0;
  const tickInterval = setInterval(() => {
    let active = false;
    if (coinsAnim < totalCoinsGained) {
      coinsAnim += Math.ceil((totalCoinsGained - coinsAnim) / 10);
      if (coinsAnim > totalCoinsGained) coinsAnim = totalCoinsGained;
      if (coinsText) coinsText.textContent = "+" + coinsAnim;
      active = true;
    }
    if (diamondsAnim < diamondsGained) {
      diamondsAnim += 1;
      if (diamondsText) diamondsText.textContent = "+" + diamondsAnim;
      active = true;
    }

    if (active) {
      try { playTone(600 + Math.random() * 200, 0.04, 0.0, 'sine', 0.08); } catch (e) { }
    } else {
      clearInterval(tickInterval);
      try { playTone(880, 0.15, 0.0, 'sine', 0.15); } catch (e) { }
    }
  }, 50);
}

function drawPinkGuard(gx, gy, shape) {
  // Pink jumpsuit torso/legs
  gctx.fillStyle = '#ff4081'; // bright pink/magenta
  gctx.fillRect(gx + 2, gy + 12, 12, 16); // torso
  gctx.fillRect(gx + 2, gy + 28, 4, 8); // left leg
  gctx.fillRect(gx + 10, gy + 28, 4, 8); // right leg
  gctx.fillStyle = '#d81b60'; // shoes
  gctx.fillRect(gx + 1, gy + 34, 5, 2);
  gctx.fillRect(gx + 10, gy + 34, 5, 2);

  // Black head / mask
  gctx.fillStyle = '#121212';
  gctx.fillRect(gx + 3, gy + 2, 10, 10);
  
  // White shape on mask
  gctx.fillStyle = '#ffffff';
  if (shape === 'circle') {
    // Circle outline
    gctx.fillRect(gx + 6, gy + 4, 4, 1);
    gctx.fillRect(gx + 6, gy + 9, 4, 1);
    gctx.fillRect(gx + 5, gy + 5, 1, 4);
    gctx.fillRect(gx + 10, gy + 5, 1, 4);
  } else if (shape === 'triangle') {
    // Triangle outline
    gctx.fillRect(gx + 7, gy + 4, 2, 1);
    gctx.fillRect(gx + 6, gy + 5, 4, 1);
    gctx.fillRect(gx + 5, gy + 7, 6, 1);
    gctx.fillRect(gx + 4, gy + 9, 8, 1);
  } else {
    // Square outline
    gctx.fillRect(gx + 5, gy + 4, 6, 1);
    gctx.fillRect(gx + 5, gy + 9, 6, 1);
    gctx.fillRect(gx + 5, gy + 5, 1, 4);
    gctx.fillRect(gx + 10, gy + 5, 1, 4);
  }
}

function drawGame() {
  gctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

  // Color lerp helper
  function lerpColor(a, b, t) {
    const ah = parseInt(a.slice(1), 16);
    const bh = parseInt(b.slice(1), 16);
    const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb2 = Math.round(ab + (bb - ab) * t);
    return `#${rr.toString(16).padStart(2, '0')}${rg.toString(16).padStart(2, '0')}${rb2.toString(16).padStart(2, '0')}`;
  }

  // 1. Draw Layer 1: Sky background gradient (shifts to crimson during boss fight)
  let skyTopNormal, skyTopBoss, skyBotNormal, skyBotBoss;
  if (currentLevel === 1) {
    skyTopNormal = '#0a0518';
    skyTopBoss = '#1a0004';
    skyBotNormal = '#1b122e';
    skyBotBoss = '#3a0c08';
  } else if (currentLevel === 2) {
    skyTopNormal = '#ff8f00'; // Sunset orange
    skyTopBoss = '#4a0e17';   // Deep magenta/purple
    skyBotNormal = '#3f51b5'; // Twilight blue/indigo
    skyBotBoss = '#880e4f';   // Sunset crimson
  } else if (currentLevel === 4) {
    skyTopNormal = '#e5d38a'; // Damp yellow/beige
    skyTopBoss = '#7f7344';   // Dimmer yellow/beige during encounter
    skyBotNormal = '#c2b270';
    skyBotBoss = '#5a5230';
  } else if (currentLevel === 5) {
    skyTopNormal = '#050508'; // Very dark grey/blue
    skyTopBoss = '#100505';   // Dark red during encounter
    skyBotNormal = '#151520'; // Dim security blue
    skyBotBoss = '#250808';   // Dim warning red
  } else if (currentLevel === 6) {
    skyTopNormal = '#80deea'; // Light sky blue
    skyTopBoss = '#80deea';
    skyBotNormal = '#ffe082'; // Sandy yellow Wall Base
    skyBotBoss = '#ffe082';
  } else {
    skyTopNormal = '#110a08'; // Dark basalt ash
    skyTopBoss = '#4e0b00';   // Volcanic fire red
    skyBotNormal = '#22120b'; // Deep magma orange
    skyBotBoss = '#d84315';   // Glowing lava orange
  }
  const skyTop = lerpColor(skyTopNormal, skyTopBoss, bossSkyCrimson);
  const skyBot = lerpColor(skyBotNormal, skyBotBoss, bossSkyCrimson);
  const bgGrad = gctx.createLinearGradient(0, 0, 0, V_HEIGHT);
  bgGrad.addColorStop(0, skyTop);
  bgGrad.addColorStop(1, skyBot);
  gctx.fillStyle = bgGrad;
  gctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

  // Twinkling Stars / Rising Ash
  const starCoords = [
    { x: 40, y: 30 }, { x: 120, y: 15 }, { x: 180, y: 45 }, { x: 230, y: 20 },
    { x: 310, y: 55 }, { x: 370, y: 10 }, { x: 420, y: 35 }, { x: 470, y: 25 },
    { x: 80, y: 60 }, { x: 150, y: 80 }, { x: 280, y: 70 }, { x: 350, y: 90 }
  ];

  if (currentLevel === 3) {
    // Volcanic ash sparks rising
    gctx.fillStyle = '#ff8f00';
    starCoords.forEach((s, idx) => {
      const floatY = (s.y - (Date.now() / 40 + idx * 20)) % V_HEIGHT;
      const finalY = floatY < 0 ? floatY + V_HEIGHT : floatY;
      const alpha = 0.4 + 0.6 * Math.abs(Math.sin(Date.now() / 200 + idx));
      gctx.globalAlpha = alpha;
      gctx.fillRect(s.x, finalY, 2, 2);
    });
  } else if (currentLevel !== 4) {
    gctx.fillStyle = currentLevel === 2 ? '#ffecb3' : '#ffffa0';
    starCoords.forEach((s, idx) => {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() / 240 + idx));
      gctx.globalAlpha = alpha;
      gctx.fillRect(s.x, s.y, 2, 2);
    });
  }
  gctx.globalAlpha = 1.0;

  // Layer 2: Distant Silhouette Mountains (Static)
  if (currentLevel === 1) {
    gctx.fillStyle = '#140c26'; // dark mountain purple
  } else if (currentLevel === 2) {
    gctx.fillStyle = '#1c1b4b'; // deep ocean indigo
  } else if (currentLevel === 4) {
    gctx.fillStyle = '#8f8252'; // dark wallpaper yellow-brown silhouette
  } else if (currentLevel === 5) {
    gctx.fillStyle = '#101018'; // very dark purple/black pizzeria details
  } else if (currentLevel === 6) {
    gctx.fillStyle = '#f8bbd0'; // Light pink playground wall silhouette
  } else {
    gctx.fillStyle = '#1c0808'; // dark basalt volcanic silhouette
  }
  gctx.beginPath();
  if (currentLevel === 2) {
    // Rolling sea dunes / ocean cliffs silhouette
    gctx.moveTo(0, 220);
    gctx.quadraticCurveTo(80, 180, 180, 220);
    gctx.quadraticCurveTo(280, 170, 380, 220);
    gctx.quadraticCurveTo(450, 190, V_WIDTH, 220);
    gctx.lineTo(V_WIDTH, V_HEIGHT);
    gctx.lineTo(0, V_HEIGHT);
  } else if (currentLevel === 6) {
    // High flat playground wall
    gctx.moveTo(0, 120);
    gctx.lineTo(V_WIDTH, 120);
    gctx.lineTo(V_WIDTH, V_HEIGHT);
    gctx.lineTo(0, V_HEIGHT);
  } else if (currentLevel === 3) {
    // Jagged volcano peaks
    gctx.moveTo(0, 220);
    gctx.lineTo(80, 130);
    gctx.lineTo(130, 180);
    gctx.lineTo(250, 110);
    gctx.lineTo(330, 190);
    gctx.lineTo(420, 140);
    gctx.lineTo(V_WIDTH, 220);
    gctx.lineTo(V_WIDTH, V_HEIGHT);
    gctx.lineTo(0, V_HEIGHT);
  } else if (currentLevel === 4) {
    // Distant wallpaper pillars
    gctx.moveTo(0, 220);
    gctx.lineTo(40, 220);
    gctx.lineTo(40, 120);
    gctx.lineTo(60, 120);
    gctx.lineTo(60, 220);
    gctx.lineTo(180, 220);
    gctx.lineTo(180, 100);
    gctx.lineTo(205, 100);
    gctx.lineTo(205, 220);
    gctx.lineTo(320, 220);
    gctx.lineTo(320, 130);
    gctx.lineTo(340, 130);
    gctx.lineTo(340, 220);
    gctx.lineTo(V_WIDTH, 220);
    gctx.lineTo(V_WIDTH, V_HEIGHT);
    gctx.lineTo(0, V_HEIGHT);
  } else if (currentLevel === 5) {
    // Office windows/monitors
    gctx.moveTo(0, 220);
    gctx.lineTo(20, 220);
    gctx.lineTo(20, 100);
    gctx.lineTo(140, 100);
    gctx.lineTo(140, 220);
    gctx.lineTo(180, 220);
    gctx.lineTo(180, 100);
    gctx.lineTo(300, 100);
    gctx.lineTo(300, 220);
    gctx.lineTo(V_WIDTH, 220);
    gctx.lineTo(V_WIDTH, V_HEIGHT);
    gctx.lineTo(0, V_HEIGHT);
  } else {
    // Level 1 Mountains
    gctx.moveTo(0, 220);
    gctx.lineTo(90, 150);
    gctx.lineTo(210, 220);
    gctx.lineTo(310, 140);
    gctx.lineTo(410, 220);
    gctx.lineTo(V_WIDTH, 160);
    gctx.lineTo(V_WIDTH, V_HEIGHT);
    gctx.lineTo(0, V_HEIGHT);
  }
  gctx.closePath();
  gctx.fill();

  // Layer 3: Parallax Forest / Coast / Lava (scrolling at 0.35x speed)
  gctx.save();
  gctx.translate(-Math.floor(cameraX * 0.35), 0);

  if (currentLevel === 1) {
    gctx.fillStyle = '#121921'; // very dark forest teal
    // Draw blocky pine tree rows along the horizon
    gctx.beginPath();
    gctx.moveTo(0, 230);
    for (let px = 0; px < V_WIDTH + 800; px += 24) {
      gctx.lineTo(px, 230);
      gctx.lineTo(px + 8, 190); // tree top
      gctx.lineTo(px + 16, 230);
    }
    gctx.lineTo(V_WIDTH + 800, 230);
    gctx.lineTo(V_WIDTH + 800, V_HEIGHT);
    gctx.lineTo(0, V_HEIGHT);
    gctx.closePath();
    gctx.fill();

    // Distant cottages in Woodland Town
    gctx.fillStyle = '#1a222e'; // dark cottage silhouettes
    gctx.fillRect(150, 205, 20, 25);
    gctx.beginPath(); gctx.moveTo(146, 205); gctx.lineTo(160, 190); gctx.lineTo(174, 205); gctx.closePath(); gctx.fill();
    gctx.fillRect(600, 205, 20, 25);
    gctx.beginPath(); gctx.moveTo(596, 205); gctx.lineTo(610, 190); gctx.lineTo(624, 205); gctx.closePath(); gctx.fill();
    gctx.fillRect(1100, 205, 20, 25);
    gctx.beginPath(); gctx.moveTo(1096, 205); gctx.lineTo(1110, 190); gctx.lineTo(1124, 205); gctx.closePath(); gctx.fill();
  } else if (currentLevel === 2) {
    // Sunny Beach: ocean waves and palm tree silhouettes
    gctx.fillStyle = '#1d3557'; // Ocean blue/teal
    gctx.beginPath();
    gctx.moveTo(0, 230);
    for (let px = 0; px < V_WIDTH + 800; px += 32) {
      gctx.quadraticCurveTo(px + 16, 215, px + 32, 230);
    }
    gctx.lineTo(V_WIDTH + 800, V_HEIGHT);
    gctx.lineTo(0, V_HEIGHT);
    gctx.closePath();
    gctx.fill();

    // Palm tree silhouettes
    gctx.fillStyle = '#0f2038';
    const palmPositions = [100, 320, 550, 780, 1050, 1300];
    palmPositions.forEach(px => {
      gctx.beginPath();
      gctx.moveTo(px, 230);
      gctx.quadraticCurveTo(px - 10, 190, px - 5, 160);
      gctx.strokeStyle = '#0f2038';
      gctx.lineWidth = 4;
      gctx.stroke();

      const tx = px - 5;
      const ty = 160;
      gctx.beginPath();
      gctx.moveTo(tx, ty); gctx.quadraticCurveTo(tx - 15, ty - 5, tx - 20, ty + 10);
      gctx.moveTo(tx, ty); gctx.quadraticCurveTo(tx - 12, ty - 12, tx - 10, ty - 2);
      gctx.moveTo(tx, ty); gctx.quadraticCurveTo(tx + 15, ty - 5, tx + 20, ty + 10);
      gctx.moveTo(tx, ty); gctx.quadraticCurveTo(tx + 12, ty - 12, tx + 10, ty - 2);
      gctx.lineWidth = 2;
      gctx.stroke();
    });
  } else if (currentLevel === 4) {
    // Backrooms wallpaper scrolling background
    gctx.fillStyle = '#a89a63'; // main wallpaper yellow
    gctx.fillRect(0, 50, V_WIDTH + 800, 180);
    
    // Draw repeating vertical wallpaper stripes/pillars in background
    gctx.fillStyle = '#8f8252';
    for (let px = 0; px < V_WIDTH + 800; px += 40) {
      gctx.fillRect(px, 50, 3, 180);
    }
    // Draw some ceiling vents and fluorescent lights
    gctx.fillStyle = '#5c5435';
    for (let px = 80; px < V_WIDTH + 800; px += 160) {
      gctx.fillRect(px, 58, 20, 5); // Vent
      gctx.fillStyle = '#ffecb3'; // Glowing light tube
      gctx.fillRect(px + 60, 50, 32, 4);
      gctx.fillStyle = '#5c5435';
    }
  } else if (currentLevel === 5) {
    // Pizzeria dark walls
    gctx.fillStyle = '#1e1e24'; // dark grey wallpaper
    gctx.fillRect(0, 50, V_WIDTH + 800, 180);
    
    // Draw security camera lines or pipes
    gctx.fillStyle = '#37474f'; // metal pipe
    gctx.fillRect(0, 58, V_WIDTH + 800, 6);
    
    // Draw checkered wall trim line (black/white tiles)
    for (let px = 0; px < V_WIDTH + 800; px += 16) {
      gctx.fillStyle = (px / 16) % 2 === 0 ? '#ffffff' : '#000000';
      gctx.fillRect(px, 140, 16, 8);
      gctx.fillRect(px, 148, 16, 8);
    }
    
    // Draw poster frames in the background
    gctx.fillStyle = '#2d1a10'; // brown frames
    for (let px = 120; px < V_WIDTH + 800; px += 240) {
      gctx.fillRect(px, 70, 32, 40); // frame border
      gctx.fillStyle = '#4e342e'; // inside poster
      gctx.fillRect(px + 2, 72, 28, 36);
      
      // Poster balloon
      gctx.fillStyle = '#ff1744';
      gctx.beginPath();
      gctx.arc(px + 16, 86, 6, 0, Math.PI * 2);
      gctx.fill();
      gctx.fillStyle = '#2d1a10';
    }
  } else {
    // Lava Caldera: lava flows and basalt pillars
    gctx.fillStyle = '#ff3d00'; // glowing red/orange lava river in background
    gctx.beginPath();
    gctx.moveTo(0, 230);
    for (let px = 0; px < V_WIDTH + 800; px += 40) {
      gctx.lineTo(px, 230);
      gctx.lineTo(px + 20, 222 + Math.sin(Date.now() / 300 + px) * 4);
      gctx.lineTo(px + 40, 230);
    }
    gctx.lineTo(V_WIDTH + 800, V_HEIGHT);
    gctx.lineTo(0, V_HEIGHT);
    gctx.closePath();
    gctx.fill();

    // Basalt pillar silhouettes
    gctx.fillStyle = '#1e0f0f';
    const pillarPositions = [80, 220, 420, 680, 850, 1050, 1280];
    pillarPositions.forEach(px => {
      gctx.fillRect(px, 170, 25, 60);
      gctx.fillStyle = '#2d1414';
      gctx.fillRect(px + 2, 172, 21, 58);
      gctx.fillStyle = '#1e0f0f';
    });
  }

  gctx.restore();

  // Draw background stone/sand/lava road tiles at the bottom
  if (currentLevel === 1) {
    gctx.fillStyle = '#140c21';
  } else if (currentLevel === 2) {
    gctx.fillStyle = '#bf9e5a'; // Deep sand
  } else if (currentLevel === 4) {
    gctx.fillStyle = '#5c5230'; // Damp Backrooms carpet
  } else if (currentLevel === 5) {
    gctx.fillStyle = '#121212'; // dark grey base
  } else if (currentLevel === 6) {
    gctx.fillStyle = '#e5c185'; // Light yellow-brown playground sand
  } else {
    gctx.fillStyle = '#160b0b'; // Obsidian basalt floor
  }
  gctx.fillRect(0, 230, V_WIDTH, V_HEIGHT - 230);

  // Draw white checkered tiles on top if level 5
  if (currentLevel === 5) {
    for (let fx = 0; fx < V_WIDTH; fx += 16) {
      for (let fy = 230; fy < V_HEIGHT; fy += 12) {
        if (((fx / 16) + Math.floor((fy - 230) / 12)) % 2 === 0) {
          gctx.fillStyle = '#f5f5f5';
          gctx.fillRect(fx, fy, 16, 12);
        }
      }
    }
  }

  // Apply main camera scrolling
  gctx.save();
  gctx.translate(-cameraX, 0);

  // Draw iron gates (at x=1530 and x=2200, slides down from top when boss triggered)
  if (gateLocked) {
    const gateH = V_HEIGHT;
    
    // Left Gate (x = 1530)
    gctx.fillStyle = '#37474f';
    gctx.fillRect(1530, gateY, 16, gateH);
    // Bars
    for (let gy = gateY; gy < gateY + gateH; gy += 18) {
      gctx.fillStyle = '#263238';
      gctx.fillRect(1530, gy, 16, 10);
      gctx.fillStyle = '#546e7a';
      gctx.fillRect(1532, gy + 1, 12, 8);
      // Bottom spike
      gctx.fillStyle = '#b0bec5';
      gctx.fillRect(1536, gy + 10, 4, 4);
    }
    // Horizontal braces
    gctx.fillStyle = '#263238';
    gctx.fillRect(1526, gateY + 40, 24, 4);
    gctx.fillRect(1526, gateY + 100, 24, 4);
    gctx.fillRect(1526, gateY + 160, 24, 4);

    // Right Gate (x = 2014)
    gctx.fillStyle = '#37474f';
    gctx.fillRect(2014, gateY, 16, gateH);
    // Bars
    for (let gy = gateY; gy < gateY + gateH; gy += 18) {
      gctx.fillStyle = '#263238';
      gctx.fillRect(2014, gy, 16, 10);
      gctx.fillStyle = '#546e7a';
      gctx.fillRect(2016, gy + 1, 12, 8);
      // Bottom spike
      gctx.fillStyle = '#b0bec5';
      gctx.fillRect(2020, gy + 10, 4, 4);
    }
    // Horizontal braces
    gctx.fillStyle = '#263238';
    gctx.fillRect(2010, gateY + 40, 24, 4);
    gctx.fillRect(2010, gateY + 100, 24, 4);
    gctx.fillRect(2010, gateY + 160, 24, 4);
  }

  // 2. Draw platforms
  platforms.forEach(plat => {
    if (currentLevel === 1) {
      gctx.fillStyle = '#403055';
      gctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      gctx.fillStyle = '#251c36';
      gctx.fillRect(plat.x, plat.y, plat.w, 4);
      gctx.strokeStyle = '#2b1c3c';
      gctx.lineWidth = 1;
      for (let bx = plat.x; bx < plat.x + plat.w; bx += 16) {
        gctx.strokeRect(bx, plat.y, 16, plat.h);
      }
    } else if (currentLevel === 6) {
      // Concrete platforms / metal supports
      gctx.fillStyle = '#b0bec5'; // light concrete grey
      gctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      gctx.fillStyle = '#78909c'; // darker concrete side
      gctx.fillRect(plat.x, plat.y, plat.w, 3);
      gctx.strokeStyle = '#37474f';
      gctx.lineWidth = 1;
      gctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    } else if (currentLevel === 2) {
      // Wood docks/sand banks
      gctx.fillStyle = '#8d6e63'; // wood brown
      gctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      gctx.fillStyle = '#ffe082'; // sand yellow top
      gctx.fillRect(plat.x, plat.y, plat.w, 3);
      gctx.strokeStyle = '#5d4037'; // darker brown lines
      gctx.lineWidth = 1.5;
      for (let bx = plat.x; bx < plat.x + plat.w; bx += 20) {
        gctx.strokeRect(bx, plat.y, 20, plat.h);
      }
    } else if (currentLevel === 4) {
      // Backrooms wall partitions
      gctx.fillStyle = '#c2b270'; // wallpaper yellow/beige
      gctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      gctx.fillStyle = '#8f8252'; // baseboard
      gctx.fillRect(plat.x, plat.y + plat.h - 4, plat.w, 4);
      gctx.fillStyle = '#e5d38a'; // molding top
      gctx.fillRect(plat.x, plat.y, plat.w, 3);
      
      // Outline border
      gctx.strokeStyle = '#5a5230';
      gctx.lineWidth = 1;
      gctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    } else if (currentLevel === 5) {
      // Pizzeria party tables with tablecloth
      gctx.fillStyle = '#4e342e'; // wood table legs/sides
      gctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      gctx.fillStyle = '#b0bec5'; // metal table top
      gctx.fillRect(plat.x, plat.y, plat.w, 4);
      
      // Draw red and white checkered tablecloth overhang
      for (let tx = plat.x; tx < plat.x + plat.w; tx += 8) {
        gctx.fillStyle = (tx / 8) % 2 === 0 ? '#ff1744' : '#ffffff';
        gctx.fillRect(tx, plat.y + 4, 8, 3);
      }
      gctx.strokeStyle = '#263238';
      gctx.lineWidth = 1;
      gctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    } else {
      // Volcanic rock / obsidian
      gctx.fillStyle = '#262626'; // dark basalt
      gctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      gctx.fillStyle = '#ff4500'; // glowing orange top
      gctx.fillRect(plat.x, plat.y, plat.w, 3);

      gctx.strokeStyle = '#ff8f00';
      gctx.lineWidth = 1;
      for (let bx = plat.x + 8; bx < plat.x + plat.w; bx += 16) {
        gctx.beginPath();
        gctx.moveTo(bx, plat.y);
        gctx.lineTo(bx + (Math.random() - 0.5) * 8, plat.y + plat.h);
        gctx.stroke();
      }
    }
  });

  // 3. Draw spikes / urchins / lava plumes
  hazards.forEach(spike => {
    if (currentLevel === 1) {
      gctx.fillStyle = '#7a2240';
      for (let sx = spike.x; sx < spike.x + spike.w; sx += 8) {
        gctx.beginPath();
        gctx.moveTo(sx, spike.y);
        gctx.lineTo(sx + 4, spike.y - 10);
        gctx.lineTo(sx + 8, spike.y);
        gctx.closePath();
        gctx.fill();
      }
    } else if (currentLevel === 2) {
      // Sea Urchins
      for (let sx = spike.x; sx < spike.x + spike.w; sx += 12) {
        const cx = sx + 6;
        const cy = spike.y - 4;
        gctx.fillStyle = '#2e1c47'; // dark purple body
        gctx.beginPath();
        gctx.arc(cx, cy, 4, 0, Math.PI * 2);
        gctx.fill();

        gctx.strokeStyle = '#e040fb'; // pink spikes
        gctx.lineWidth = 1;
        for (let sa = 0; sa < Math.PI * 2; sa += Math.PI / 4) {
          gctx.beginPath();
          gctx.moveTo(cx, cy);
          gctx.lineTo(cx + Math.cos(sa) * 7, cy + Math.sin(sa) * 7);
          gctx.stroke();
        }
      }
    } else if (currentLevel === 4) {
      // Carpet Mold Spills
      gctx.fillStyle = '#1c2e17'; // dark green/black mold
      for (let sx = spike.x; sx < spike.x + spike.w; sx += 8) {
        const bx = sx + 4;
        const by = spike.y - 2;
        const radius = 3 + Math.sin(Date.now() / 120 + sx) * 1.5;
        gctx.beginPath();
        gctx.arc(bx, by, radius, 0, Math.PI * 2);
        gctx.fill();
        
        gctx.fillStyle = '#3f6333';
        gctx.fillRect(bx - 1, by - 1, 2, 2);
        gctx.fillStyle = '#1c2e17';
      }
    } else if (currentLevel === 5) {
      // Exposed wires with sparks
      gctx.fillStyle = '#546e7a';
      gctx.fillRect(spike.x, spike.y - 4, spike.w, 4); // wire casing
      gctx.fillStyle = '#00e5ff';
      for (let sx = spike.x + 4; sx < spike.x + spike.w; sx += 8) {
        if (Math.random() > 0.5) {
          gctx.fillRect(sx + (Math.random() - 0.5) * 4, spike.y - 10 - Math.random() * 6, 2, 2);
        }
      }
    } else if (currentLevel === 6) {
      // Concrete spikes / glass shards
      gctx.fillStyle = '#90a4ae'; // grey shards
      for (let sx = spike.x; sx < spike.x + spike.w; sx += 8) {
        gctx.beginPath();
        gctx.moveTo(sx, spike.y);
        gctx.lineTo(sx + 4, spike.y - 12);
        gctx.lineTo(sx + 8, spike.y);
        gctx.closePath();
        gctx.fill();
        gctx.fillStyle = '#cfd8dc'; // highlights
        gctx.fillRect(sx + 2, spike.y - 6, 2, 6);
        gctx.fillStyle = '#90a4ae';
      }
    } else {
      // Magma Spikes
      gctx.fillStyle = '#ff1744';
      for (let sx = spike.x; sx < spike.x + spike.w; sx += 8) {
        gctx.beginPath();
        gctx.moveTo(sx, spike.y);
        gctx.lineTo(sx + 4, spike.y - 12);
        gctx.lineTo(sx + 8, spike.y);
        gctx.closePath();
        gctx.fill();
        // Inner core
        gctx.fillStyle = '#ffd700';
        gctx.beginPath();
        gctx.moveTo(sx + 2, spike.y);
        gctx.lineTo(sx + 4, spike.y - 8);
        gctx.lineTo(sx + 6, spike.y);
        gctx.closePath();
        gctx.fill();
      }
    }
  });

  // Draw Pickups (Hearts / Shells / Rubies)
  pickups.forEach(heart => {
    if (!heart.active) return;

    const floatY = Math.sin(Date.now() / 150 + heart.x) * 3;
    const hx = heart.x;
    const hy = heart.y + floatY;

    if (currentLevel === 1) {
      gctx.fillStyle = '#ff0055';
      gctx.fillRect(hx + 2, hy + 2, 3, 3);
      gctx.fillRect(hx + 7, hy + 2, 3, 3);
      gctx.fillRect(hx + 1, hy + 5, 10, 3);
      gctx.fillRect(hx + 3, hy + 8, 6, 2);
      gctx.fillRect(hx + 5, hy + 10, 2, 2);
      gctx.fillStyle = '#ffd700';
      gctx.fillRect(hx + 5, hy, 2, 2);
    } else if (currentLevel === 2) {
      // Beach shell
      gctx.fillStyle = '#ff8a80'; // pinkish coral
      gctx.fillRect(hx + 2, hy + 8, 8, 3);
      gctx.fillRect(hx + 1, hy + 4, 10, 4);
      gctx.fillRect(hx + 3, hy + 2, 6, 2);
      gctx.fillRect(hx + 5, hy, 2, 2);
      gctx.fillStyle = '#ffe082';
      gctx.fillRect(hx + 3, hy + 4, 2, 3);
      gctx.fillRect(hx + 7, hy + 4, 2, 3);
    } else if (currentLevel === 4) {
      // Almond Water Bottle
      gctx.fillStyle = '#e0f7fa'; // plastic bottle
      gctx.fillRect(hx + 3, hy + 3, 6, 8);
      gctx.fillRect(hx + 4, hy + 1, 4, 2); // neck
      gctx.fillStyle = '#0288d1'; // blue cap
      gctx.fillRect(hx + 4, hy, 4, 1);
      gctx.fillStyle = '#ffd700'; // label
      gctx.fillRect(hx + 3, hy + 6, 6, 3);
    } else if (currentLevel === 5) {
      // Pizza slice (triangle)
      gctx.fillStyle = '#ffd54f'; // cheese
      gctx.beginPath();
      gctx.moveTo(hx + 6, hy);
      gctx.lineTo(hx + 12, hy + 10);
      gctx.lineTo(hx, hy + 10);
      gctx.closePath();
      gctx.fill();
      
      gctx.fillStyle = '#8d6e63'; // crust
      gctx.fillRect(hx, hy + 10, 12, 2);
      
      gctx.fillStyle = '#ff1744'; // pepperoni dots
      gctx.fillRect(hx + 3, hy + 5, 2, 2);
      gctx.fillRect(hx + 7, hy + 7, 2, 2);
    } else if (heart.type === 'dalgona') {
      // Dalgona candy: circle with a triangle inside
      gctx.fillStyle = '#dfb15b'; // golden dalgona caramel color
      gctx.beginPath();
      gctx.arc(hx + 6, hy + 6, 6, 0, Math.PI * 2);
      gctx.fill();

      // Border outline
      gctx.strokeStyle = '#b8860b';
      gctx.lineWidth = 1;
      gctx.stroke();

      // Triangle carving inside
      gctx.fillStyle = '#a67c1e'; // darker carve color
      gctx.beginPath();
      gctx.moveTo(hx + 6, hy + 3);
      gctx.lineTo(hx + 9, hy + 8);
      gctx.lineTo(hx + 3, hy + 8);
      gctx.closePath();
      gctx.fill();
    } else {
      // Volcano ruby
      gctx.fillStyle = '#ff1744'; // hot red
      gctx.beginPath();
      gctx.moveTo(hx + 6, hy);
      gctx.lineTo(hx + 12, hy + 6);
      gctx.lineTo(hx + 6, hy + 12);
      gctx.lineTo(hx, hy + 6);
      gctx.closePath();
      gctx.fill();
      gctx.fillStyle = '#ffeb3b'; // yellow core
      gctx.fillRect(hx + 5, hy + 5, 2, 2);
    }
  });

  // Draw Boss Projectiles (Fireballs / Bubbles / Rock shockwaves)
  if (boss && boss.projectiles) {
    boss.projectiles.forEach(proj => {
      if (currentLevel === 2) {
        // Water bubble
        gctx.fillStyle = '#00e5ff';
        gctx.fillRect(proj.x, proj.y, proj.w, proj.h);
        gctx.fillStyle = '#ffffff';
        gctx.fillRect(proj.x + 2, proj.y + 2, proj.w / 3, proj.h / 3);
      } else if (currentLevel === 3) {
        // Volcano: Fireball
        const angle = (Date.now() / 80) % (Math.PI * 2);
        gctx.save();
        gctx.translate(proj.x + proj.w / 2, proj.y + proj.h / 2);
        gctx.rotate(angle);
        gctx.fillStyle = '#ff3d00';
        gctx.fillRect(-proj.w / 2, -proj.h / 2, proj.w, proj.h);
        gctx.fillStyle = '#ffd700';
        gctx.fillRect(-proj.w / 4, -proj.h / 4, proj.w / 2, proj.h / 2);
        gctx.restore();
      } else if (currentLevel === 4) {
        // Glitch static block
        gctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
        gctx.fillRect(proj.x, proj.y, proj.w, proj.h);
        gctx.strokeStyle = '#00ff00';
        gctx.lineWidth = 1;
        gctx.strokeRect(proj.x, proj.y, proj.w, proj.h);
      } else if (currentLevel === 5) {
        // Freddy's Microphone
        gctx.fillStyle = '#37474f'; // stand
        gctx.fillRect(proj.x + 4, proj.y, 4, proj.h);
        gctx.fillStyle = '#cfd8dc'; // metal top
        gctx.fillRect(proj.x + 2, proj.y, 8, 4);
      } else {
        // Level 1: Slate rock
        gctx.fillStyle = '#78909c';
        gctx.fillRect(proj.x, proj.y, proj.w, proj.h);
        gctx.fillStyle = '#cfd8dc';
        gctx.fillRect(proj.x + 1, proj.y + 1, proj.w - 2, 2);
      }
    });
  }

  // Draw Earth Shatter warnings and rocks/coconuts/meteors
  if (boss && boss.debrisWarnings) {
    boss.debrisWarnings.forEach(dw => {
      if (dw.warningTimer > 0) {
        const alpha = 0.15 + 0.3 * Math.abs(Math.sin(Date.now() / 80));
        gctx.fillStyle = `rgba(255, 30, 0, ${alpha})`;
        gctx.fillRect(dw.x - 8, 0, 16, V_HEIGHT);
        gctx.fillStyle = '#ff2200';
        gctx.fillRect(dw.x - 5, 0, 10, 6);
        gctx.fillStyle = '#ffcc00';
        gctx.fillRect(dw.x - 3, 1, 6, 4);
      }
      if (dw.rock && !dw.rock.done) {
        if (currentLevel === 2) {
          // Coconut
          gctx.fillStyle = '#5d4037';
          gctx.beginPath();
          gctx.arc(dw.rock.x, dw.rock.y + dw.rock.h / 2, dw.rock.w / 2, 0, Math.PI * 2);
          gctx.fill();
          gctx.fillStyle = '#3e2723';
          gctx.fillRect(dw.rock.x - 2, dw.rock.y + dw.rock.h / 2 - 2, 1, 1);
          gctx.fillRect(dw.rock.x, dw.rock.y + dw.rock.h / 2 - 2, 1, 1);
          gctx.fillRect(dw.rock.x - 1, dw.rock.y + dw.rock.h / 2, 1, 1);
        } else if (currentLevel === 3) {
          // Meteor
          gctx.fillStyle = '#ff3d00';
          gctx.fillRect(dw.rock.x - dw.rock.w / 2, dw.rock.y, dw.rock.w, dw.rock.h);
          gctx.fillStyle = '#ffd700';
          gctx.fillRect(dw.rock.x - dw.rock.w / 2 + 2, dw.rock.y + 2, dw.rock.w - 4, dw.rock.h - 4);
        } else if (currentLevel === 4) {
          // Falling fluorescent light tube
          gctx.fillStyle = '#eceff1'; // casing
          gctx.fillRect(dw.rock.x - dw.rock.w / 2, dw.rock.y, dw.rock.w, dw.rock.h / 3);
          gctx.fillStyle = Math.random() > 0.2 ? '#ffffc0' : '#757575'; // flickering tube
          gctx.fillRect(dw.rock.x - dw.rock.w / 2 + 2, dw.rock.y + dw.rock.h / 3, dw.rock.w - 4, 3);
        } else if (currentLevel === 5) {
          // Falling party hat (colorful triangle)
          gctx.fillStyle = '#ff007f'; // pink
          gctx.beginPath();
          gctx.moveTo(dw.rock.x, dw.rock.y);
          gctx.lineTo(dw.rock.x + dw.rock.w / 2, dw.rock.y + dw.rock.h);
          gctx.lineTo(dw.rock.x - dw.rock.w / 2, dw.rock.y + dw.rock.h);
          gctx.closePath();
          gctx.fill();
          // pom-pom
          gctx.fillStyle = '#ffff00';
          gctx.fillRect(dw.rock.x - 2, dw.rock.y - 2, 4, 4);
        } else {
          // Boulder
          gctx.fillStyle = '#5d4037';
          gctx.fillRect(dw.rock.x - dw.rock.w / 2, dw.rock.y, dw.rock.w, dw.rock.h);
          gctx.fillStyle = '#795548';
          gctx.fillRect(dw.rock.x - dw.rock.w / 2 + 2, dw.rock.y + 2, dw.rock.w - 4, dw.rock.h - 4);
          gctx.fillStyle = '#4e342e';
          gctx.fillRect(dw.rock.x - 2, dw.rock.y + 3, 2, 6);
        }
      } else if (dw.rock && dw.rock.done) {
        if (currentLevel === 2) {
          // Broken coconut halves
          gctx.fillStyle = '#5d4037';
          gctx.fillRect(dw.rock.x - 6, dw.rock.y + 8, 4, 4);
          gctx.fillRect(dw.rock.x + 2, dw.rock.y + 8, 4, 4);
          gctx.fillStyle = '#f5f5f5';
          gctx.fillRect(dw.rock.x - 5, dw.rock.y + 9, 2, 2);
          gctx.fillRect(dw.rock.x + 3, dw.rock.y + 9, 2, 2);
        } else if (currentLevel === 3) {
          // Volcanic rubble
          gctx.fillStyle = '#212121';
          gctx.fillRect(dw.rock.x - dw.rock.w / 2, dw.rock.y + 8, dw.rock.w, 6);
          gctx.fillStyle = '#ff5722';
          gctx.fillRect(dw.rock.x - 3, dw.rock.y + 10, 6, 3);
        } else if (currentLevel === 4) {
          // Broken glass and sparks
          gctx.fillStyle = '#b0bec5';
          gctx.fillRect(dw.rock.x - 6, dw.rock.y + 10, 4, 2);
          gctx.fillRect(dw.rock.x + 2, dw.rock.y + 10, 4, 2);
          if (Math.random() > 0.5) {
            gctx.fillStyle = '#ffff00'; // electric sparks
            gctx.fillRect(dw.rock.x - 3 + Math.random() * 6, dw.rock.y + 8, 2, 2);
          }
        } else if (currentLevel === 5) {
          // Confetti explosion
          gctx.fillStyle = '#00e5ff';
          gctx.fillRect(dw.rock.x - 6, dw.rock.y + 10, 3, 3);
          gctx.fillStyle = '#ffeb3b';
          gctx.fillRect(dw.rock.x + 3, dw.rock.y + 10, 3, 3);
          gctx.fillStyle = '#ff00ff';
          gctx.fillRect(dw.rock.x - 2, dw.rock.y + 8, 4, 3);
        } else {
          gctx.fillStyle = '#5d4037';
          gctx.fillRect(dw.rock.x - dw.rock.w / 2, dw.rock.y + 8, dw.rock.w, 6);
        }
      }
    });
  }

  // 4. Draw enemies
  enemies.forEach(enemy => {
    if (enemy.hp <= 0) return;

    const gx = enemy.x;
    const gy = enemy.y;
    const gw = enemy.w;
    const gh = enemy.h;
    const faceRight = enemy.vx > 0;

    const flashWhite = enemy.isHurt > 0 && Math.floor(enemy.isHurt / 2) % 2 === 0;

    if (flashWhite) {
      gctx.fillStyle = '#ffffff';
      gctx.fillRect(gx, gy, gw, gh);
    } else {
      if (enemy.name === 'Goblin') {
        // Goblin
        gctx.fillStyle = '#388e3c';
        gctx.fillRect(gx + 2, gy, gw - 4, gh - 4);
        if (faceRight) {
          gctx.fillRect(gx, gy + 1, 2, 2);
          gctx.fillRect(gx + gw - 2, gy + 3, 2, 2);
        } else {
          gctx.fillRect(gx, gy + 3, 2, 2);
          gctx.fillRect(gx + gw - 2, gy + 1, 2, 2);
        }
        gctx.fillStyle = '#5d4037';
        gctx.fillRect(gx + 3, gy + 8, gw - 6, 6);
        gctx.fillStyle = '#ffd700';
        gctx.fillRect(gx + 7, gy + 11, 2, 2);
        gctx.fillStyle = '#2e7d32';
        gctx.fillRect(gx + 4, gy + 14, 2, 2);
        gctx.fillRect(gx + gw - 6, gy + 14, 2, 2);
        gctx.fillStyle = '#ff3300';
        gctx.fillRect(gx + (faceRight ? gw - 6 : 4), gy + 3, 2, 2);
      } else if (enemy.name === 'Orc') {
        // Orc
        gctx.fillStyle = '#00acc1';
        gctx.fillRect(gx + 4, gy, 16, 10);
        gctx.fillStyle = '#ffffff';
        if (faceRight) {
          gctx.fillRect(gx + 16, gy + 8, 2, 2);
          gctx.fillRect(gx + 12, gy + 8, 1, 1);
        } else {
          gctx.fillRect(gx + 6, gy + 8, 2, 2);
          gctx.fillRect(gx + 11, gy + 8, 1, 1);
        }
        gctx.fillStyle = '#ffff00';
        gctx.fillRect(gx + (faceRight ? 14 : 8), gy + 3, 2, 2);
        gctx.fillStyle = '#37474f';
        gctx.fillRect(gx + 4, gy + 10, 16, 10);
        gctx.fillStyle = '#c62828';
        gctx.fillRect(gx + 6, gy + 12, 12, 4);
        gctx.fillStyle = '#78909c';
        gctx.fillRect(gx + 2, gy + 10, 3, 3);
        gctx.fillRect(gx + gw - 5, gy + 10, 3, 3);
        gctx.fillStyle = '#5d4037';
        gctx.fillRect(gx + 6, gy + 20, 4, 4);
        gctx.fillRect(gx + gw - 10, gy + 20, 4, 4);
        gctx.fillStyle = '#3e2723';
        gctx.fillRect(gx + 5, gy + 22, 5, 2);
        gctx.fillRect(gx + gw - 10, gy + 22, 5, 2);
      } else if (enemy.name === 'Golem') {
        // Golem
        gctx.fillStyle = '#4a148c';
        gctx.fillRect(gx, gy, gw, gh);
        gctx.fillStyle = '#8e24aa';
        gctx.fillRect(gx + 3, gy + 3, gw - 6, gh - 6);
        gctx.fillStyle = '#6a1b9a';
        gctx.fillRect(gx - 4, gy + 12, 6, 12);
        gctx.fillRect(gx + gw - 2, gy + 12, 6, 12);
        gctx.fillStyle = '#ff007f';
        gctx.fillRect(gx + 6, gy + 8, 2, 16);
        gctx.fillRect(gx + 6, gy + 16, 14, 2);
        gctx.fillRect(gx + gw - 8, gy + 10, 2, 14);
        gctx.fillRect(gx + 14, gy + 22, 12, 2);
        gctx.fillRect(gx + 10, gy + 5, 5, 2);
        gctx.fillRect(gx + gw - 15, gy + 5, 5, 2);
        gctx.fillStyle = '#ffd700';
        gctx.fillRect(gx + 15, gy + 12, 6, 6);
        gctx.fillStyle = '#8e24aa';
        gctx.fillRect(gx + 17, gy + 14, 2, 2);
      } else if (enemy.name === 'Crab') {
        // Crab (Level 2)
        gctx.fillStyle = '#e64a19';
        gctx.fillRect(gx + 2, gy + 4, gw - 4, gh - 8);
        gctx.fillStyle = '#d84315';
        if (faceRight) {
          gctx.fillRect(gx + gw - 4, gy + 2, 4, 4);
          gctx.fillRect(gx, gy + 6, 3, 3);
        } else {
          gctx.fillRect(gx, gy + 2, 4, 4);
          gctx.fillRect(gx + gw - 3, gy + 6, 3, 3);
        }
        gctx.fillStyle = '#bf360c';
        gctx.fillRect(gx + 3, gy + gh - 4, 2, 4);
        gctx.fillRect(gx + 7, gy + gh - 4, 2, 4);
        gctx.fillRect(gx + 11, gy + gh - 4, 2, 4);
        gctx.fillStyle = '#ffffff';
        gctx.fillRect(gx + 4, gy, 2, 4);
        gctx.fillRect(gx + 10, gy, 2, 4);
        gctx.fillStyle = '#000000';
        gctx.fillRect(gx + 4, gy, 2, 2);
        gctx.fillRect(gx + 10, gy, 2, 2);
      } else if (enemy.name === 'Skeleton Pirate') {
        // Skeleton Pirate (Level 2)
        gctx.fillStyle = '#eceff1';
        gctx.fillRect(gx + 6, gy + 4, gw - 12, gh - 8);
        gctx.fillStyle = '#f5f5f5';
        gctx.fillRect(gx + 5, gy - 2, 10, 8);
        gctx.fillStyle = '#212121';
        gctx.fillRect(gx + (faceRight ? 9 : 5), gy, 3, 3);
        gctx.strokeStyle = '#212121';
        gctx.beginPath();
        gctx.moveTo(gx + 5, gy - 1);
        gctx.lineTo(gx + 13, gy + 2);
        gctx.stroke();
        gctx.fillStyle = '#d32f2f';
        gctx.fillRect(gx + 4, gy - 4, 12, 3);
        gctx.fillRect(gx + (faceRight ? 3 : 13), gy - 2, 2, 4);
        gctx.fillStyle = '#b0bec5';
        if (faceRight) {
          gctx.fillRect(gx + gw - 4, gy + 4, 3, 10);
          gctx.fillStyle = '#ffd700';
          gctx.fillRect(gx + gw - 6, gy + 12, 5, 2);
        } else {
          gctx.fillRect(gx + 1, gy + 4, 3, 10);
          gctx.fillStyle = '#ffd700';
          gctx.fillRect(gx + 1, gy + 12, 5, 2);
        }
        gctx.fillStyle = '#eceff1';
        gctx.fillRect(gx + 6, gy + gh - 4, 2, 4);
        gctx.fillRect(gx + gw - 8, gy + gh - 4, 2, 4);
      } else if (enemy.name === 'Shark Warrior') {
        // Shark Warrior (Level 2)
        gctx.fillStyle = '#455a64';
        gctx.fillRect(gx, gy, gw, gh);
        gctx.fillStyle = '#cfd8dc';
        if (faceRight) {
          gctx.fillRect(gx + 8, gy + 8, gw - 8, gh - 12);
        } else {
          gctx.fillRect(gx, gy + 8, gw - 8, gh - 12);
        }
        gctx.fillStyle = '#37474f';
        if (faceRight) {
          gctx.beginPath();
          gctx.moveTo(gx, gy + 6);
          gctx.lineTo(gx - 6, gy + 12);
          gctx.lineTo(gx, gy + 18);
          gctx.fill();
        } else {
          gctx.beginPath();
          gctx.moveTo(gx + gw, gy + 6);
          gctx.lineTo(gx + gw + 6, gy + 12);
          gctx.lineTo(gx + gw, gy + 18);
          gctx.fill();
        }
        gctx.fillStyle = '#000000';
        gctx.fillRect(gx + (faceRight ? gw - 8 : 6), gy + 4, 2, 2);
        gctx.fillStyle = '#ff1744';
        gctx.fillRect(gx + (faceRight ? gw - 7 : 6), gy + 4, 1, 1);
        gctx.fillStyle = '#ffffff';
        if (faceRight) {
          gctx.fillRect(gx + gw - 6, gy + 12, 6, 2);
          gctx.fillRect(gx + gw - 4, gy + 14, 4, 2);
        } else {
          gctx.fillRect(gx, gy + 12, 6, 2);
          gctx.fillRect(gx, gy + 14, 4, 2);
        }
      } else if (enemy.name === 'Lava Slime') {
        // Lava Slime (Level 3)
        gctx.fillStyle = '#ff3d00';
        gctx.fillRect(gx, gy + 2, gw, gh - 2);
        gctx.fillStyle = '#ffea00';
        gctx.fillRect(gx + 3, gy + 5, gw - 6, gh - 8);
        gctx.fillStyle = '#ff9100';
        gctx.fillRect(gx - 1, gy + gh - 1, gw + 2, 1);
        gctx.fillStyle = '#0e0a1b';
        gctx.fillRect(gx + 3, gy + 6, 2, 2);
        gctx.fillRect(gx + gw - 5, gy + 6, 2, 2);
      } else if (enemy.name === 'Fire Demon') {
        // Fire Demon (Level 3)
        gctx.fillStyle = '#c62828';
        gctx.fillRect(gx + 4, gy, gw - 8, gh - 4);
        gctx.fillStyle = '#ff8f00';
        if (Math.floor(Date.now() / 150) % 2 === 0) {
          gctx.fillRect(gx, gy - 2, 4, gh - 6);
          gctx.fillRect(gx + gw - 4, gy - 2, 4, gh - 6);
        } else {
          gctx.fillRect(gx, gy + 4, 4, gh - 6);
          gctx.fillRect(gx + gw - 4, gy + 4, 4, gh - 6);
        }
        gctx.fillStyle = '#ffd54f';
        gctx.fillRect(gx + 5, gy - 3, 2, 3);
        gctx.fillRect(gx + gw - 7, gy - 3, 2, 3);
        gctx.fillStyle = '#ffeb3b';
        gctx.fillRect(gx + (faceRight ? gw - 7 : 5), gy + 3, 2, 2);
        gctx.fillStyle = '#37474f';
        const hx = faceRight ? gx + gw - 3 : gx + 1;
        gctx.fillRect(hx, gy + 2, 2, gh - 4);
        gctx.fillStyle = '#cfd8dc';
        gctx.fillRect(hx - 1, gy - 1, 4, 1);
        gctx.fillRect(hx - 1, gy - 3, 1, 2);
        gctx.fillRect(hx + 2, gy - 3, 1, 2);
      } else if (enemy.name === 'Magma Golem') {
        // Magma Golem (Level 3)
        gctx.fillStyle = '#212121';
        gctx.fillRect(gx, gy, gw, gh);
        gctx.fillStyle = '#ff3d00';
        gctx.fillRect(gx + 4, gy + 4, gw - 8, gh - 8);
        gctx.fillStyle = '#ffd700';
        gctx.fillRect(gx + 6, gy + 6, 2, 12);
        gctx.fillRect(gx + 14, gy + 8, 2, 10);
        gctx.fillRect(gx + 4, gy + 12, gw - 8, 2);
        gctx.fillStyle = '#ff6f00';
        gctx.fillRect(gx - 3, gy + 10, 5, gh - 14);
        gctx.fillRect(gx + gw - 2, gy + 10, 5, gh - 14);
        gctx.fillStyle = '#ff1744';
        gctx.fillRect(gx + 6, gy + 3, 3, 2);
        gctx.fillRect(gx + gw - 9, gy + 3, 3, 2);
      } else if (enemy.name === 'Skinwalker') {
        // Skinwalker (Level 4)
        gctx.fillStyle = '#757575'; // grey skin
        gctx.fillRect(gx + 4, gy, gw - 8, gh - 8);
        gctx.fillStyle = '#424242'; // legs
        gctx.fillRect(gx + 4, gy + gh - 8, 4, 8);
        gctx.fillRect(gx + gw - 8, gy + gh - 8, 4, 8);
        gctx.fillStyle = '#ff1744'; // glowing red eyes
        gctx.fillRect(gx + (faceRight ? gw - 7 : 5), gy + 3, 2, 2);
        gctx.fillRect(gx + (faceRight ? gw - 11 : 9), gy + 3, 2, 2);
      } else if (enemy.name === 'Smiler') {
        // Smiler (Level 4)
        gctx.fillStyle = '#0a0a0a'; // dark shadow
        gctx.fillRect(gx, gy, gw, gh);
        gctx.fillStyle = '#ffffff'; // white eyes
        gctx.fillRect(gx + 4, gy + 4, 3, 2);
        gctx.fillRect(gx + gw - 7, gy + 4, 3, 2);
        gctx.beginPath(); // white smile
        gctx.strokeStyle = '#ffffff';
        gctx.lineWidth = 1.5;
        gctx.moveTo(gx + 3, gy + 12);
        gctx.quadraticCurveTo(gx + gw / 2, gy + 18, gx + gw - 3, gy + 12);
        gctx.stroke();
      } else if (enemy.name === 'Shrek') {
        // Shrek (Level 4)
        gctx.fillStyle = '#8bc34a'; // green ogre head
        gctx.fillRect(gx + 4, gy, gw - 8, 10);
        gctx.fillRect(gx + 2, gy - 2, 2, 3); // ears
        gctx.fillRect(gx + gw - 4, gy - 2, 2, 3);
        gctx.fillStyle = '#795548'; // brown vest
        gctx.fillRect(gx + 3, gy + 10, gw - 6, gh - 10);
        gctx.fillStyle = '#ffeb3b'; // yellow eyes
        gctx.fillRect(gx + (faceRight ? gw - 8 : 6), gy + 3, 2, 2);
      } else if (enemy.name === 'Bonnie') {
        // Bonnie (Purple rabbit)
        gctx.fillStyle = '#673ab7'; // main purple body
        gctx.fillRect(gx + 3, gy + 10, gw - 6, gh - 10); // torso and legs
        gctx.fillRect(gx + 4, gy + 4, gw - 8, 7); // head
        
        // Ears (rabbit ears!)
        gctx.fillRect(gx + 4, gy - 2, 3, 7); // left ear base
        gctx.fillRect(gx + gw - 7, gy - 2, 3, 7); // right ear base
        gctx.fillStyle = '#e91e63'; // pink inner ears
        gctx.fillRect(gx + 5, gy - 1, 1, 5);
        gctx.fillRect(gx + gw - 6, gy - 1, 1, 5);
        
        // Eyes (red eyes!)
        gctx.fillStyle = '#ff1744';
        gctx.fillRect(gx + (faceRight ? gw - 7 : 5), gy + 6, 2, 2);
        gctx.fillRect(gx + (faceRight ? gw - 11 : 9), gy + 6, 2, 2);
        
        // Bowtie (red bowtie)
        gctx.fillStyle = '#d50000';
        gctx.fillRect(gx + gw/2 - 2, gy + 12, 4, 2);
        gctx.fillRect(gx + gw/2 - 4, gy + 11, 2, 4);
        gctx.fillRect(gx + gw/2 + 2, gy + 11, 2, 4);
        
        // Legs (darker purple feet)
        gctx.fillStyle = '#4527a0';
        gctx.fillRect(gx + 3, gy + gh - 3, 5, 3);
        gctx.fillRect(gx + gw - 8, gy + gh - 3, 5, 3);
      } else if (enemy.name === 'Chica') {
        // Chica (Yellow chicken)
        gctx.fillStyle = '#ffeb3b'; // main yellow body
        gctx.fillRect(gx + 3, gy + 6, gw - 6, gh - 6); // body
        gctx.fillRect(gx + 5, gy + 1, gw - 10, 6); // head
        
        // Bib (white bib)
        gctx.fillStyle = '#ffffff';
        gctx.fillRect(gx + 5, gy + 7, gw - 10, 5);
        // Purple text dots on bib ("Let's Eat!")
        gctx.fillStyle = '#e040fb';
        gctx.fillRect(gx + 7, gy + 9, 2, 2);
        gctx.fillRect(gx + gw - 9, gy + 9, 2, 2);
        
        // Eyes (purple eyes)
        gctx.fillStyle = '#9c27b0';
        gctx.fillRect(gx + (faceRight ? gw - 8 : 6), gy + 3, 2, 2);
        gctx.fillRect(gx + (faceRight ? gw - 12 : 10), gy + 3, 2, 2);
        
        // Orange Beak
        gctx.fillStyle = '#ff9100';
        if (faceRight) {
          gctx.fillRect(gx + gw - 6, gy + 4, 4, 3);
        } else {
          gctx.fillRect(gx + 2, gy + 4, 4, 3);
        }
        
        // Orange feet
        gctx.fillStyle = '#ff6d00';
        gctx.fillRect(gx + 4, gy + gh - 2, 5, 2);
        gctx.fillRect(gx + gw - 9, gy + gh - 2, 5, 2);
      } else if (enemy.name === 'Foxy') {
        // Foxy (Red fox)
        gctx.fillStyle = '#ff3d00'; // main red body
        gctx.fillRect(gx + 2, gy + 9, gw - 4, gh - 9); // body
        gctx.fillRect(gx + 4, gy + 3, gw - 8, 7); // head
        
        // Pointy ears
        gctx.fillRect(gx + 4, gy - 1, 3, 4); // left ear
        gctx.fillRect(gx + gw - 7, gy - 1, 3, 4); // right ear
        
        // Yellow eye (good eye) & Eyepatch (black)
        gctx.fillStyle = '#ffea00'; // yellow eye
        gctx.fillRect(gx + (faceRight ? gw - 7 : 5), gy + 5, 2, 2);
        gctx.fillStyle = '#212121'; // black eyepatch over the other eye
        gctx.fillRect(gx + (faceRight ? gw - 11 : 9), gy + 4, 3, 3);
        // Eyepatch strap
        gctx.fillRect(gx + 4, gy + 4, gw - 8, 1);
        
        // Snout
        gctx.fillStyle = '#d84315'; // darker red snout
        if (faceRight) {
          gctx.fillRect(gx + gw - 5, gy + 6, 3, 2);
        } else {
          gctx.fillRect(gx + 2, gy + 6, 3, 2);
        }
        
        // Hook hand (silver)
        gctx.fillStyle = '#cfd8dc'; // silver hook
        if (faceRight) {
          // hook on right hand, normal arm on left
          gctx.fillRect(gx + gw - 3, gy + 13, 3, 3);
          gctx.fillRect(gx + gw - 2, gy + 11, 1, 2);
        } else {
          // hook on left hand
          gctx.fillRect(gx, gy + 13, 3, 3);
          gctx.fillRect(gx + 1, gy + 11, 1, 2);
        }
        
        // Brown pants & legs
        gctx.fillStyle = '#795548'; // brown pants
        gctx.fillRect(gx + 3, gy + gh - 9, gw - 6, 6);
        gctx.fillStyle = '#37474f'; // metal endoskeleton legs
        gctx.fillRect(gx + 4, gy + gh - 3, 2, 3);
        gctx.fillRect(gx + gw - 6, gy + gh - 3, 2, 3);
      } else if (enemy.name && enemy.name.startsWith('Contestant')) {
        // Draw Contestant (Green Tracksuit)
        gctx.fillStyle = '#00796b'; // teal tracksuit color
        gctx.fillRect(gx + 3, gy + 8, gw - 6, 10); // torso
        gctx.fillRect(gx + 3, gy + 18, 4, 6); // left leg
        gctx.fillRect(gx + gw - 7, gy + 18, 4, 6); // right leg
        
        gctx.fillStyle = '#eceff1'; // white sneaker boots
        gctx.fillRect(gx + 2, gy + 22, 5, 2);
        gctx.fillRect(gx + gw - 7, gy + 22, 5, 2);
        
        // Head / Skin
        gctx.fillStyle = '#ffcc80'; // skin tone
        gctx.fillRect(gx + 4, gy + 2, 8, 6); // head
        
        // Hair (each contestant has different hair colors!)
        gctx.fillStyle = enemy.name.includes('199') ? '#3e2723' : (enemy.name.includes('218') ? '#121212' : '#5d4037');
        gctx.fillRect(gx + 3, gy, 10, 3);
        
        // Number badge (white square on chest)
        gctx.fillStyle = '#ffffff';
        gctx.fillRect(gx + 6, gy + 10, 4, 4);
        
        // Small face features
        gctx.fillStyle = '#000000';
        gctx.fillRect(gx + (faceRight ? 9 : 5), gy + 4, 2, 2);
      }
    }
  });

  // 5. Draw Boss
  if (boss && boss.hp > 0 && player.x > 1530) {
    const bx = boss.x;
    const by = boss.y;
    const bw = boss.w;
    const bh = boss.h;
    const bossDir = boss.direction;

    // Draw motion blur trail for charge state
    if (boss.state === 'charge' && Math.floor(boss.stateTimer / 3) % 2 === 0) {
      if (currentLevel === 2) {
        gctx.fillStyle = 'rgba(230, 74, 25, 0.2)';
      } else if (currentLevel === 3) {
        gctx.fillStyle = 'rgba(255, 61, 0, 0.2)';
      } else {
        gctx.fillStyle = 'rgba(255, 0, 127, 0.2)';
      }
      gctx.fillRect(bx - boss.vx * 3, by, bw, bh);
      gctx.fillRect(bx - boss.vx * 1.5, by, bw, bh);
    }

    // Enraged fire trail
    if (boss.enraged) {
      const trailAlpha = 0.15 + 0.2 * Math.abs(Math.sin(Date.now() / 60));
      if (currentLevel === 2) {
        gctx.fillStyle = `rgba(0, 229, 255, ${trailAlpha})`;
        gctx.fillRect(bx - boss.direction * 10, by + 8, bw, bh - 8);
      } else if (currentLevel === 3) {
        gctx.fillStyle = `rgba(255, 61, 0, ${trailAlpha})`;
        gctx.fillRect(bx - boss.direction * 10, by + 8, bw, bh - 8);
        gctx.fillStyle = `rgba(255, 235, 59, ${trailAlpha * 0.5})`;
        gctx.fillRect(bx - boss.direction * 18, by + 14, bw - 8, bh - 14);
      } else {
        gctx.fillStyle = `rgba(255, 80, 0, ${trailAlpha})`;
        gctx.fillRect(bx - boss.direction * 10, by + 8, bw, bh - 8);
        gctx.fillStyle = `rgba(255, 200, 0, ${trailAlpha * 0.5})`;
        gctx.fillRect(bx - boss.direction * 18, by + 14, bw - 8, bh - 14);
      }
    }

    const flashWhite = boss.isHurt > 0 && Math.floor(boss.isHurt / 2) % 2 === 0;

    if (flashWhite) {
      gctx.fillStyle = '#ffffff';
      gctx.fillRect(bx, by, bw, bh);
    } else {
      if (currentLevel === 1) {
        gctx.fillStyle = '#ff4081';
        gctx.fillRect(bx + 4, by + 8, bw - 8, bh - 8);
        gctx.fillStyle = '#212121';
        gctx.fillRect(bx + 6, by + 16, bw - 12, bh - 20);
        gctx.fillStyle = '#ffd700';
        gctx.fillRect(bx + 6, by + 16, bw - 12, 3);
        gctx.fillRect(bx + 6, by + 33, bw - 12, 3);
        gctx.fillStyle = '#ff003c';
        gctx.fillRect(bx + (bw / 2 - 3), by + 22, 6, 6);
        gctx.fillStyle = '#424242';
        gctx.fillRect(bx + 2, by + 12, 8, 8);
        gctx.fillRect(bx + bw - 10, by + 12, 8, 8);
        gctx.fillStyle = '#b0bec5';
        gctx.fillRect(bx + 4, by + 8, 2, 4);
        gctx.fillRect(bx + bw - 6, by + 8, 2, 4);
        gctx.fillStyle = '#263238';
        gctx.fillRect(bx + 12, by + 2, 24, 14);
        gctx.fillStyle = '#cfd8dc';
        gctx.fillRect(bx + 14, by - 2, 2, 4);
        gctx.fillRect(bx + 23, by - 4, 2, 6);
        gctx.fillRect(bx + 32, by - 2, 2, 4);
        gctx.fillStyle = '#ff0000';
        if (bossDir < 0) {
          gctx.fillRect(bx + 16, by + 6, 4, 3);
          gctx.fillRect(bx + 25, by + 6, 4, 3);
        } else {
          gctx.fillRect(bx + 19, by + 6, 4, 3);
          gctx.fillRect(bx + 28, by + 6, 4, 3);
        }
        gctx.fillStyle = '#ff9100';
        gctx.fillRect(bx + (bossDir < 0 ? 0 : bw - 14), by + bh - 16, 14, 14);
        gctx.fillStyle = '#ffd700';
        gctx.fillRect(bx + (bossDir < 0 ? 2 : bw - 12), by + bh - 14, 10, 10);
        gctx.fillStyle = '#212121';
        gctx.fillRect(bx + 8, by + bh - 6, bw - 16, 6);
      } else if (currentLevel === 2) {
        // Captain Crab Claw
        gctx.fillStyle = '#e64a19';
        gctx.fillRect(bx + 4, by + 12, bw - 8, bh - 16);
        gctx.fillStyle = '#212121';
        gctx.beginPath();
        gctx.moveTo(bx + 6, by + 12);
        gctx.lineTo(bx + bw / 2, by + 2);
        gctx.lineTo(bx + bw - 6, by + 12);
        gctx.closePath();
        gctx.fill();
        gctx.fillStyle = '#ffd700';
        gctx.fillRect(bx + 4, by + 10, bw - 8, 3);
        gctx.fillStyle = '#ffffff';
        gctx.fillRect(bx + bw / 2 - 2, by + 6, 4, 4);
        gctx.fillStyle = '#000000';
        gctx.fillRect(bx + bw / 2 - 1, by + 8, 1, 1);
        gctx.fillRect(bx + bw / 2 + 1, by + 8, 1, 1);
        gctx.fillStyle = '#ffffff';
        gctx.fillRect(bx + 14, by + 6, 4, 5);
        gctx.fillRect(bx + bw - 18, by + 6, 4, 5);
        gctx.fillStyle = '#000000';
        if (bossDir < 0) {
          gctx.fillRect(bx + 12, by + 5, 8, 5);
          gctx.fillRect(bx + bw - 17, by + 6, 2, 2);
        } else {
          gctx.fillRect(bx + 15, by + 6, 2, 2);
          gctx.fillRect(bx + bw - 20, by + 5, 8, 5);
        }
        gctx.fillStyle = '#ffb300';
        const clawOnRight = bossDir < 0;
        const clawX = clawOnRight ? bx + 2 : bx + bw - 18;
        gctx.fillRect(clawX, by + bh - 20, 16, 16);
        gctx.fillStyle = '#ffd54f';
        gctx.fillRect(clawX + 2, by + bh - 18, 12, 12);
        gctx.fillStyle = '#e64a19';
        gctx.fillRect(clawX + 6, by + bh - 22, 4, 5);
        const swordX = clawOnRight ? bx + bw - 10 : bx + 2;
        gctx.fillStyle = '#b0bec5';
        gctx.fillRect(swordX, by + bh - 26, 6, 16);
        gctx.fillStyle = '#795548';
        gctx.fillRect(swordX + 1, by + bh - 10, 4, 4);
        gctx.fillStyle = '#d84315';
        gctx.fillRect(bx + 8, by + bh - 4, 4, 5);
        gctx.fillRect(bx + 20, by + bh - 4, 4, 5);
        gctx.fillStyle = '#795548';
        gctx.fillRect(bx + bw - 14, by + bh - 4, 3, 6);
      } else if (currentLevel === 4) {
        // The Bacteria (creepy black stick-figure/wireframe entity)
        gctx.strokeStyle = '#000000';
        gctx.lineWidth = 3.5;
        
        // Spine
        gctx.beginPath();
        gctx.moveTo(bx + bw / 2, by + 12);
        gctx.lineTo(bx + bw / 2, by + bh - 16);
        gctx.stroke();
        
        // Head
        gctx.fillStyle = '#000000';
        gctx.fillRect(bx + bw / 2 - 6, by + 2, 12, 10);
        gctx.fillStyle = Math.random() > 0.5 ? '#ff0000' : '#ffffff';
        gctx.fillRect(bx + bw / 2 - 2, by + 5, 4, 3);
        
        // Arms
        gctx.beginPath();
        gctx.moveTo(bx + bw / 2, by + 16);
        const armWaved = Math.sin(Date.now() / 100) * 8;
        gctx.lineTo(bx + 4, by + 24 + armWaved);
        gctx.moveTo(bx + bw / 2, by + 16);
        gctx.lineTo(bx + bw - 4, by + 24 - armWaved);
        gctx.stroke();
        
        // Legs
        gctx.beginPath();
        gctx.moveTo(bx + bw / 2, by + bh - 16);
        gctx.lineTo(bx + 6, by + bh - 2);
        gctx.moveTo(bx + bw / 2, by + bh - 16);
        gctx.lineTo(bx + bw - 6, by + bh - 2);
        gctx.stroke();
        
        // Feet
        gctx.fillStyle = '#000000';
        gctx.fillRect(bx + 2, by + bh - 2, 6, 2);
        gctx.fillRect(bx + bw - 8, by + bh - 2, 6, 2);
      } else if (currentLevel === 3) {
        // Lord Ash Breath
        gctx.fillStyle = '#1a0d0d';
        gctx.fillRect(bx + 4, by + 10, bw - 8, bh - 14);
        gctx.fillStyle = '#ff3d00';
        gctx.fillRect(bx + 8, by + 20, bw - 16, 2);
        gctx.fillRect(bx + 10, by + 26, bw - 20, 2);
        gctx.fillRect(bx + 12, by + 32, bw - 24, 2);
        gctx.fillStyle = '#d84315';
        if (Math.floor(Date.now() / 120) % 2 === 0) {
          gctx.fillRect(bx - 12, by + 4, 16, 16);
          gctx.fillRect(bx + bw - 4, by + 4, 16, 16);
          gctx.fillStyle = '#ff9100';
          gctx.fillRect(bx - 14, by + 2, 4, 4);
          gctx.fillRect(bx + bw + 10, by + 2, 4, 4);
        } else {
          gctx.fillRect(bx - 10, by + 14, 14, 16);
          gctx.fillRect(bx + bw - 4, by + 14, 14, 16);
          gctx.fillStyle = '#ff9100';
          gctx.fillRect(bx - 12, by + 28, 4, 4);
          gctx.fillRect(bx + bw + 8, by + 28, 4, 4);
        }
        gctx.fillStyle = '#1a0d0d';
        gctx.fillRect(bx + 12, by + 2, 24, 10);
        gctx.fillStyle = '#ffd54f';
        gctx.beginPath();
        gctx.moveTo(bx + 14, by + 2);
        gctx.lineTo(bx + 10, by - 6);
        gctx.lineTo(bx + 18, by + 2);
        gctx.moveTo(bx + 34, by + 2);
        gctx.lineTo(bx + 38, by - 6);
        gctx.lineTo(bx + 30, by + 2);
        gctx.closePath();
        gctx.fill();
        gctx.fillStyle = '#ff1744';
        if (bossDir < 0) {
          gctx.fillRect(bx + 15, by + 6, 5, 2);
          gctx.fillRect(bx + 24, by + 6, 4, 2);
        } else {
          gctx.fillRect(bx + 20, by + 6, 4, 2);
          gctx.fillRect(bx + 29, by + 6, 5, 2);
        }
        if (Math.random() < 0.3) {
          gctx.fillStyle = '#ffea00';
          const nX = bossDir < 0 ? bx + 12 : bx + bw - 14;
          gctx.fillRect(nX + (Math.random() - 0.5) * 4, by + 10, 2, 2);
        }
        gctx.fillStyle = '#1a0d0d';
        const tailX = bossDir < 0 ? bx + bw : bx - 10;
        gctx.fillRect(tailX, by + bh - 16, 10, 6);
        gctx.fillStyle = '#ff3d00';
        gctx.fillRect(tailX + (bossDir < 0 ? 8 : 0), by + bh - 18, 4, 4);
      } else if (currentLevel === 5) {
        // Level 5 Boss: Freddy Fazbear or Golden Freddy
        const isGolden = boss.isGoldenFreddy;
        
        // Base colors
        const baseColor = isGolden ? '#ffd700' : '#5d4037'; // gold vs brown
        const snoutColor = isGolden ? '#ffb300' : '#8d6e63'; // golden orange vs lighter brown
        const hatColor = '#121212'; // black hat
        const eyeColor = isGolden ? '#000000' : '#00e5ff'; // hollow black vs glowing blue
        
        // If slouched (Golden Freddy), we shift the head slightly down or change slouch stance
        const slouchOffset = isGolden ? 4 : 0;
        
        // Draw Ears
        gctx.fillStyle = baseColor;
        gctx.fillRect(bx + 8, by + 6 + slouchOffset, 8, 8); // left ear
        gctx.fillRect(bx + bw - 16, by + 6 + slouchOffset, 8, 8); // right ear
        gctx.fillStyle = snoutColor; // inner ear
        gctx.fillRect(bx + 10, by + 8 + slouchOffset, 4, 4);
        gctx.fillRect(bx + bw - 14, by + 8 + slouchOffset, 4, 4);
        
        // Draw Head
        gctx.fillStyle = baseColor;
        gctx.fillRect(bx + 8, by + 12 + slouchOffset, 32, 20);
        
        // Top Hat
        gctx.fillStyle = hatColor;
        gctx.fillRect(bx + 14, by + slouchOffset, 20, 4); // brim
        gctx.fillRect(bx + 17, by - 6 + slouchOffset, 14, 6); // top part
        
        // Eyes
        gctx.fillStyle = eyeColor;
        gctx.fillRect(bx + 14, by + 17 + slouchOffset, 6, 6); // left eye socket
        gctx.fillRect(bx + bw - 20, by + 17 + slouchOffset, 6, 6); // right eye socket
        
        if (isGolden) {
          // Blinking white pupils inside hollow sockets
          if (Math.floor(Date.now() / 250) % 3 !== 0) {
            gctx.fillStyle = '#ffffff';
            gctx.fillRect(bx + 16, by + 19 + slouchOffset, 2, 2);
            gctx.fillRect(bx + bw - 18, by + 19 + slouchOffset, 2, 2);
          }
        } else {
          // Blue glowing pupils
          gctx.fillStyle = '#ffffff';
          gctx.fillRect(bx + 15, by + 18, 2, 2);
          gctx.fillRect(bx + bw - 19, by + 18, 2, 2);
        }
        
        // Snout
        gctx.fillStyle = snoutColor;
        gctx.fillRect(bx + 18, by + 23 + slouchOffset, 12, 6);
        gctx.fillStyle = '#121212'; // nose
        gctx.fillRect(bx + 23, by + 22 + slouchOffset, 2, 2);
        
        // Torso / Body (Golden Freddy is slouched, body sits lower and tilted)
        gctx.fillStyle = baseColor;
        if (isGolden) {
          // Slouched torso
          gctx.fillRect(bx + 6, by + 32, 36, 12);
          // Bowtie (black)
          gctx.fillStyle = '#121212';
          gctx.fillRect(bx + 22, by + 32, 4, 3);
          gctx.fillRect(bx + 19, by + 31, 10, 1);
        } else {
          // Normal standing torso
          gctx.fillRect(bx + 6, by + 32, 36, 16);
          // Bowtie (black)
          gctx.fillStyle = '#121212';
          gctx.fillRect(bx + 22, by + 32, 4, 3);
          gctx.fillRect(bx + 19, by + 31, 10, 1);
        }
        
        // Microphone in hand
        if (!isGolden) {
          // Freddy holds a microphone
          gctx.fillStyle = '#37474f'; // stand
          gctx.fillRect(bx + (bossDir < 0 ? 2 : bw - 5), by + 24, 3, 14);
          gctx.fillStyle = '#cfd8dc'; // mic head
          gctx.fillRect(bx + (bossDir < 0 ? 1 : bw - 6), by + 20, 5, 5);
        }
        
        // Draw Legs
        gctx.fillStyle = baseColor;
        if (isGolden) {
          // Slouched legs on the floor
          gctx.fillRect(bx + 4, by + 44, 12, 4);
          gctx.fillRect(bx + bw - 16, by + 44, 12, 4);
        } else {
          // Standing legs
          gctx.fillRect(bx + 10, by + 44, 8, 4);
          gctx.fillRect(bx + bw - 18, by + 44, 8, 4);
        }
      }
    }
  }

  // 6. Draw Player (Knight)
  if (player.hp > 0) {
    let showPlayer = true;
    if (player.isHurt > 0 && Math.floor(player.isHurt / 4) % 2 === 0) {
      showPlayer = false;
    }

    if (showPlayer) {
      const px = player.x;
      const py = player.y;
      const isRight = player.direction === 'right';

      const activeSkinKey = playerStats.equippedSkin || 'default';
      const activeSkin = skinsData[activeSkinKey] || skinsData.default;

      // 1. Cape
      gctx.fillStyle = activeSkin.capeColor;
      if (isRight) {
        gctx.fillRect(px - 3, py + 8, 5, 14);
        gctx.fillRect(px - 1, py + 22, 4, 2);
      } else {
        gctx.fillRect(px + player.w - 2, py + 8, 5, 14);
        gctx.fillRect(px + player.w - 3, py + 22, 4, 2);
      }

      // 2. Helmet / Visor
      gctx.fillStyle = activeSkin.helmetColor;
      gctx.fillRect(px + 2, py, 12, 8);
      gctx.fillStyle = activeSkin.plumeHighlightColor; // highlights
      gctx.fillRect(px + 3, py + 1, 10, 3);

      // Visor slit
      gctx.fillStyle = '#171721';
      if (isRight) {
        gctx.fillRect(px + 7, py + 3, 7, 3);
        gctx.fillStyle = activeSkin.eyeColor; // glowing gold visor eye
        gctx.fillRect(px + 9, py + 4, 2, 1);
      } else {
        gctx.fillRect(px + 2, py + 3, 7, 3);
        gctx.fillStyle = activeSkin.eyeColor;
        gctx.fillRect(px + 5, py + 4, 2, 1);
      }

      // Plume
      gctx.fillStyle = activeSkin.plumeColor; // plume
      gctx.fillRect(px + (isRight ? 1 : 11), py - 3, 4, 4);
      gctx.fillStyle = activeSkin.plumeHighlightColor;
      gctx.fillRect(px + (isRight ? 2 : 10), py - 2, 2, 2);

      // 3. Torso / Breastplate
      gctx.fillStyle = activeSkin.torsoBackColor; // steel backing
      gctx.fillRect(px + 2, py + 8, 12, 8);
      gctx.fillStyle = activeSkin.torsoFrontColor; // shiny breastplate
      gctx.fillRect(px + 4, py + 9, 8, 6);

      // Golden emblem cross on chest
      gctx.fillStyle = activeSkin.emblemColor;
      gctx.fillRect(px + 7, py + 9, 2, 6);
      gctx.fillRect(px + 5, py + 11, 6, 2);

      // Shoulder pauldrons
      gctx.fillStyle = activeSkin.pauldronColor; // gold shoulder trim
      gctx.fillRect(px + (isRight ? 1 : 11), py + 8, 3, 3);
      gctx.fillStyle = activeSkin.pauldronShadowColor;
      gctx.fillRect(px + (isRight ? 12 : 1), py + 8, 3, 3);

      // 4. Legs / Boots
      gctx.fillStyle = activeSkin.torsoBackColor;
      let walkCycle = Math.abs(player.vx) > 0.1 && player.isGrounded && (Math.floor(Date.now() / 100) % 2 === 0);
      if (walkCycle) {
        gctx.fillRect(px + 3, py + 16, 4, 5);
        gctx.fillStyle = activeSkin.bootsColor; // boots
        gctx.fillRect(px + 2, py + 21, 5, 3);

        gctx.fillStyle = activeSkin.pauldronShadowColor; // back leg shadow
        gctx.fillRect(px + 9, py + 16, 4, 5);
        gctx.fillStyle = activeSkin.bootsShadowColor;
        gctx.fillRect(px + 10, py + 21, 4, 3);
      } else {
        // standing
        gctx.fillRect(px + 3, py + 16, 4, 6);
        gctx.fillRect(px + 9, py + 16, 4, 6);
        gctx.fillStyle = activeSkin.bootsColor; // boots
        gctx.fillRect(px + 2, py + 22, 5, 2);
        gctx.fillRect(px + 9, py + 22, 5, 2);
      }

      // 5. Sword Slash Crescent wave
      if (player.isAttacking) {
        gctx.fillStyle = activeSkin.slashColor; // crescent slash trail

        if (isRight) {
          gctx.fillRect(px + 16, py - 4, 12, 4);
          gctx.fillRect(px + 24, py, 14, 6);
          gctx.fillRect(px + 30, py + 6, 8, 12);
          gctx.fillRect(px + 24, py + 18, 14, 6);
          gctx.fillRect(px + 16, py + 24, 12, 4);

          // Silver blade inside trail
          gctx.fillStyle = activeSkin.bladeColor;
          gctx.fillRect(px + 18, py + 8, 16, 4);
          gctx.fillStyle = '#ffffff'; // shine
          gctx.fillRect(px + 20, py + 9, 14, 2);

          // Golden crossguard / hilt
          gctx.fillStyle = activeSkin.hiltColor;
          gctx.fillRect(px + 14, py + 6, 4, 8);
          gctx.fillStyle = '#5c4033'; // handle
          gctx.fillRect(px + 10, py + 9, 4, 2);
        } else {
          gctx.fillRect(px - 12, py - 4, 12, 4);
          gctx.fillRect(px - 22, py, 14, 6);
          gctx.fillRect(px - 22, py + 6, 8, 12);
          gctx.fillRect(px - 22, py + 18, 14, 6);
          gctx.fillRect(px - 12, py + 24, 12, 4);

          // Blade
          gctx.fillStyle = activeSkin.bladeColor;
          gctx.fillRect(px - 18, py + 8, 16, 4);
          gctx.fillStyle = '#ffffff';
          gctx.fillRect(px - 18, py + 9, 14, 2);

          // Hilt
          gctx.fillStyle = activeSkin.hiltColor;
          gctx.fillRect(px - 2, py + 6, 4, 8);
          gctx.fillStyle = '#5c4033';
          gctx.fillRect(px + 2, py + 9, 4, 2);
        }
      }
    }
  }

  // Draw finish line ribbon for Squid Game
  if (currentLevel === 6) {
    // Red/pink finish line ribbon at x = 3800
    gctx.fillStyle = '#ff1744'; // Red ribbon
    gctx.fillRect(3800, 50, 4, 180); // vertical post/ribbon
    
    // Checkered pattern on the ground at x = 3800
    for (let checkY = 230; checkY < V_HEIGHT; checkY += 6) {
      gctx.fillStyle = (checkY / 6) % 2 === 0 ? '#ffffff' : '#000000';
      gctx.fillRect(3794, checkY, 6, 6);
      gctx.fillRect(3800, checkY, 6, 6);
    }

    // Giant Doll has been deleted per user request
  }

  // Draw laser sniper strikes
  laserTraces.forEach(laser => {
    gctx.strokeStyle = `rgba(255, 23, 68, ${laser.alpha})`;
    gctx.lineWidth = 2;
    gctx.beginPath();
    gctx.moveTo(laser.x1, laser.y1);
    gctx.lineTo(laser.x2, laser.y2);
    gctx.stroke();
    
    // Draw explosion particles at impact point
    gctx.fillStyle = `rgba(255, 255, 255, ${laser.alpha})`;
    gctx.fillRect(laser.x2 - 4, laser.y2 - 4, 8, 8);
  });
 
  gctx.restore();

  // Draw heal particles (above camera translate, in screen coords)
  healParticles.forEach(hp => {
    gctx.globalAlpha = hp.life;
    gctx.fillStyle = '#00ff88';
    gctx.fillRect(
      Math.floor(hp.x - cameraX),
      Math.floor(hp.y),
      3, 3
    );
  });
  gctx.globalAlpha = 1.0;

  // 7. Draw Boss Intro Banner (Not translated, absolute coordinates on screen)
  if (bossIntroTriggered && bossIntroTimer > 0) {
    // Red translucent letterbox strip
    gctx.fillStyle = 'rgba(255, 0, 60, 0.15)';
    gctx.fillRect(0, V_HEIGHT / 2 - 35, V_WIDTH, 70);

    // Borders
    gctx.fillStyle = '#ff003c';
    gctx.fillRect(0, V_HEIGHT / 2 - 35, V_WIDTH, 3);
    gctx.fillRect(0, V_HEIGHT / 2 + 32, V_WIDTH, 3);

    // Flashing WARNING text
    if (Math.floor(bossIntroTimer / 8) % 2 === 0) {
      gctx.fillStyle = '#ff003c';
      gctx.font = "16px 'Press Start 2P', monospace";
      gctx.textAlign = "center";
      gctx.fillText("WARNING!", V_WIDTH / 2, V_HEIGHT / 2 - 8);

      gctx.fillStyle = '#ffffff';
      gctx.font = "8px 'Press Start 2P', monospace";
      gctx.fillText(levelHudData[currentLevel]?.bossIntroText || "BOSS ENCOUNTER", V_WIDTH / 2, V_HEIGHT / 2 + 16);
    }
  }

  // Squid Game HUD Overlay (Drawn in screenspace absolute coordinates)
  if (currentLevel === 6 && gameRunning && !instructionsOverlay.classList.contains('active')) {
    gctx.font = "12px 'Press Start 2P', monospace";
    gctx.textAlign = "center";
    
    // Draw Light State
    if (squidState === 'green') {
      gctx.fillStyle = '#00ff88'; // green
      gctx.fillText("GREEN LIGHT", V_WIDTH / 2, 45);
    } else {
      gctx.fillStyle = '#ff1744'; // red
      gctx.fillText("RED LIGHT", V_WIDTH / 2, 45);
      
      // Flash red border during Red Light as a high tension effect!
      if (Math.floor(Date.now() / 150) % 2 === 0) {
        gctx.strokeStyle = '#ff1744';
        gctx.lineWidth = 4;
        gctx.strokeRect(0, 0, V_WIDTH, V_HEIGHT);
      }
    }
    
    // Draw remaining time
    gctx.font = "8px 'Press Start 2P', monospace";
    gctx.fillStyle = '#ffffff';
    const sec = Math.ceil(squidTimeRemaining / 60);
    gctx.fillText(`TIME: ${sec}S`, V_WIDTH / 2, 60);
  }
}

// Button actions
retryBtn.addEventListener('click', () => {
  startPlatformerGame(currentLevel);
});

mapReturnBtn.addEventListener('click', () => {
  exitGameToMap();
});

victoryOkBtn.addEventListener('click', () => {
  exitGameToMap();
});

function exitGameToMap() {
  gameRunning = false;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  window.removeEventListener('keydown', handleGameKeyDown);
  window.removeEventListener('keyup', handleGameKeyUp);
  
  viewport.classList.add('shutoff');
  setTimeout(() => {
    playScreen.style.display = 'none';
    mapScreen.style.display = 'flex';
    viewport.classList.remove('shutoff');
    viewport.classList.add('power-on');
  }, 650);

  setTimeout(() => {
    viewport.classList.remove('power-on');
    resizeCanvas(); // redraw main screen canvas stars
  }, 1150);
}

// ================= HERO SHOP & UPGRADES SYSTEM =================
const shopOverlay = document.getElementById('shop-overlay');
const openShopBtn = document.getElementById('open-shop-btn');
const closeShopBtn = document.getElementById('close-shop-btn');
const tabUpgrades = document.getElementById('tab-upgrades');
const tabSkins = document.getElementById('tab-skins');
const panelUpgrades = document.getElementById('panel-upgrades-content');
const panelSkins = document.getElementById('panel-skins-content');

const shopCoinsText = document.getElementById('shop-coins');
const shopDiamondsText = document.getElementById('shop-diamonds');

const buyHpBtn = document.getElementById('buy-hp');
const buyDamageBtn = document.getElementById('buy-damage');
const buyPotionsBtn = document.getElementById('buy-potions');
const buyPotionHealBtn = document.getElementById('buy-potionheal');

const rankHpText = document.getElementById('rank-hp');
const rankDamageText = document.getElementById('rank-damage');
const rankPotionsText = document.getElementById('rank-potions');
const rankPotionHealText = document.getElementById('rank-potionheal');

const skinListContainer = document.getElementById('skin-list-container');
const previewSkinName = document.getElementById('preview-skin-name');
const previewSkinDesc = document.getElementById('preview-skin-desc');
const equipSkinBtn = document.getElementById('equip-skin-btn');

let selectedPreviewSkin = 'default';
let shopPreviewLoopId = null;

function updateShopUI() {
  shopCoinsText.textContent = String(playerStats.coins).padStart(4, '0');
  shopDiamondsText.textContent = String(playerStats.diamonds).padStart(3, '0');
  updateShopUpgradesUI();
  updateShopSkinsUI();
}

function updateShopUpgradesUI() {
  // Max HP
  const hpLevel = playerStats.upgrades.hp;
  rankHpText.textContent = `RANK: ${hpLevel}/5`;
  if (hpLevel >= 5) {
    buyHpBtn.textContent = 'MAX';
    buyHpBtn.disabled = true;
    buyHpBtn.className = 'buy-btn maxed';
  } else {
    const cost = 100 * (hpLevel + 1);
    buyHpBtn.textContent = `${cost} 🪙`;
    buyHpBtn.disabled = playerStats.coins < cost;
    buyHpBtn.className = 'buy-btn';
  }

  // Attack Damage
  const damageLevel = playerStats.upgrades.damage;
  rankDamageText.textContent = `RANK: ${damageLevel}/5`;
  if (damageLevel >= 5) {
    buyDamageBtn.textContent = 'MAX';
    buyDamageBtn.disabled = true;
    buyDamageBtn.className = 'buy-btn maxed';
  } else {
    const cost = 150 + 100 * damageLevel;
    buyDamageBtn.textContent = `${cost} 🪙`;
    buyDamageBtn.disabled = playerStats.coins < cost;
    buyDamageBtn.className = 'buy-btn';
  }

  // Potion capacity
  const potionsLevel = playerStats.upgrades.potionsCount;
  rankPotionsText.textContent = `RANK: ${potionsLevel}/3`;
  if (potionsLevel >= 3) {
    buyPotionsBtn.textContent = 'MAX';
    buyPotionsBtn.disabled = true;
    buyPotionsBtn.className = 'buy-btn maxed';
  } else {
    const cost = 120 * (potionsLevel + 1);
    buyPotionsBtn.textContent = `${cost} 🪙`;
    buyPotionsBtn.disabled = playerStats.coins < cost;
    buyPotionsBtn.className = 'buy-btn';
  }

  // Potion heal potency
  const healLevel = playerStats.upgrades.potionHeal;
  rankPotionHealText.textContent = `RANK: ${healLevel}/4`;
  if (healLevel >= 4) {
    buyPotionHealBtn.textContent = 'MAX';
    buyPotionHealBtn.disabled = true;
    buyPotionHealBtn.className = 'buy-btn maxed';
  } else {
    const cost = 100 + 80 * healLevel;
    buyPotionHealBtn.textContent = `${cost} 🪙`;
    buyPotionHealBtn.disabled = playerStats.coins < cost;
    buyPotionHealBtn.className = 'buy-btn';
  }
}

function updateShopSkinsUI() {
  skinListContainer.innerHTML = '';
  Object.keys(skinsData).forEach(skinKey => {
    const skin = skinsData[skinKey];
    const card = document.createElement('div');
    const isUnlocked = playerStats.unlockedSkins.includes(skinKey);
    const isEquipped = playerStats.equippedSkin === skinKey;

    card.className = `skin-card ${selectedPreviewSkin === skinKey ? 'selected' : ''}`;

    let statusText = '';
    if (isEquipped) {
      statusText = 'EQUIPPED';
    } else if (isUnlocked) {
      statusText = 'UNLOCKED';
    } else if (skin.unlockStage && stageCompleted[skin.unlockStage]) {
      // Auto-unlock completed stage skins
      playerStats.unlockedSkins.push(skinKey);
      localStorage.setItem('hero_unlocked_skins', JSON.stringify(playerStats.unlockedSkins));
      statusText = 'UNLOCKED';
    } else {
      statusText = `${skin.cost} 💎`;
    }

    card.innerHTML = `
      <div class="skin-card-name">${skin.name}</div>
      <div class="skin-card-status" style="${isEquipped ? 'color: #00ff00;' : (isUnlocked ? 'color: #00ffff;' : 'color: #ffff00;')}">${statusText}</div>
    `;

    card.addEventListener('click', () => {
      selectedPreviewSkin = skinKey;
      try { playSelectSound(); } catch (e) { }
      updateShopSkinsUI();
    });

    skinListContainer.appendChild(card);
  });

  updateSelectedSkinPreview();
}

function updateSelectedSkinPreview() {
  const skin = skinsData[selectedPreviewSkin] || skinsData.default;
  previewSkinName.textContent = skin.name.toUpperCase();
  previewSkinDesc.textContent = skin.description;

  const isUnlocked = playerStats.unlockedSkins.includes(selectedPreviewSkin);
  const isEquipped = playerStats.equippedSkin === selectedPreviewSkin;

  if (isEquipped) {
    equipSkinBtn.textContent = 'EQUIPPED';
    equipSkinBtn.disabled = true;
    equipSkinBtn.className = 'equip-btn equipped-state';
  } else if (isUnlocked) {
    equipSkinBtn.textContent = 'EQUIP';
    equipSkinBtn.disabled = false;
    equipSkinBtn.className = 'equip-btn';
  } else {
    // Locked, buyable early with diamonds
    equipSkinBtn.textContent = `BUY FOR ${skin.cost} 💎`;
    equipSkinBtn.disabled = playerStats.diamonds < skin.cost;
    equipSkinBtn.className = 'equip-btn';
  }
}

// Buy Upgrades Listeners
if (buyHpBtn) buyHpBtn.addEventListener('click', () => {
  const hpLevel = playerStats.upgrades.hp;
  if (hpLevel < 5) {
    const cost = 100 * (hpLevel + 1);
    if (playerStats.coins >= cost) {
      playerStats.coins -= cost;
      playerStats.upgrades.hp++;
      saveProgression();
      try { playConfirmSound(); } catch (e) { }
      updateShopUI();
    }
  }
});

if (buyDamageBtn) buyDamageBtn.addEventListener('click', () => {
  const damageLevel = playerStats.upgrades.damage;
  if (damageLevel < 5) {
    const cost = 150 + 100 * damageLevel;
    if (playerStats.coins >= cost) {
      playerStats.coins -= cost;
      playerStats.upgrades.damage++;
      saveProgression();
      try { playConfirmSound(); } catch (e) { }
      updateShopUI();
    }
  }
});

if (buyPotionsBtn) buyPotionsBtn.addEventListener('click', () => {
  const potionsLevel = playerStats.upgrades.potionsCount;
  if (potionsLevel < 3) {
    const cost = 120 * (potionsLevel + 1);
    if (playerStats.coins >= cost) {
      playerStats.coins -= cost;
      playerStats.upgrades.potionsCount++;
      saveProgression();
      try { playConfirmSound(); } catch (e) { }
      updateShopUI();
    }
  }
});

if (buyPotionHealBtn) buyPotionHealBtn.addEventListener('click', () => {
  const healLevel = playerStats.upgrades.potionHeal;
  if (healLevel < 4) {
    const cost = 100 + 80 * healLevel;
    if (playerStats.coins >= cost) {
      playerStats.coins -= cost;
      playerStats.upgrades.potionHeal++;
      saveProgression();
      try { playConfirmSound(); } catch (e) { }
      updateShopUI();
    }
  }
});

// Equip/Buy Skin Listener
if (equipSkinBtn) equipSkinBtn.addEventListener('click', () => {
  const isUnlocked = playerStats.unlockedSkins.includes(selectedPreviewSkin);
  const skin = skinsData[selectedPreviewSkin];

  if (isUnlocked) {
    playerStats.equippedSkin = selectedPreviewSkin;
    saveProgression();
    try { playConfirmSound(); } catch (e) { }
    updateShopUI();
  } else {
    // Buy skin
    if (playerStats.diamonds >= skin.cost) {
      playerStats.diamonds -= skin.cost;
      playerStats.unlockedSkins.push(selectedPreviewSkin);
      playerStats.equippedSkin = selectedPreviewSkin;
      saveProgression();
      try { playConfirmSound(); } catch (e) { }
      updateShopUI();
    }
  }
});

// Shop Tabs Event Listeners
if (tabUpgrades) tabUpgrades.addEventListener('click', () => {
  tabUpgrades.classList.add('active');
  tabSkins.classList.remove('active');
  panelUpgrades.style.display = 'flex';
  panelSkins.style.display = 'none';
  try { playSelectSound(); } catch (e) { }
});

if (tabSkins) tabSkins.addEventListener('click', () => {
  tabSkins.classList.add('active');
  tabUpgrades.classList.remove('active');
  panelSkins.style.display = 'flex';
  panelUpgrades.style.display = 'none';
  try { playSelectSound(); } catch (e) { }
  updateShopSkinsUI();
});

// Shop Open/Close Listeners
if (openShopBtn) openShopBtn.addEventListener('click', () => {
  selectedPreviewSkin = playerStats.equippedSkin || 'default';

  // Reset tab to upgrades
  tabUpgrades.classList.add('active');
  tabSkins.classList.remove('active');
  panelUpgrades.style.display = 'flex';
  panelSkins.style.display = 'none';

  updateShopUI();
  shopOverlay.style.display = 'flex';

  startShopPreviewLoop();
  try { playConfirmSound(); } catch (e) { }
});

if (closeShopBtn) closeShopBtn.addEventListener('click', () => {
  shopOverlay.style.display = 'none';
  if (shopPreviewLoopId) cancelAnimationFrame(shopPreviewLoopId);
  try { playCancelSound(); } catch (e) { }
});

// Skin preview drawing logic
function startShopPreviewLoop() {
  const pCanvas = document.getElementById('shop-skin-preview');
  if (!pCanvas) return;
  const pCtx = pCanvas.getContext('2d');

  function step() {
    if (shopOverlay.style.display === 'none') {
      return;
    }

    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

    // Draw background grid
    pCtx.fillStyle = '#05030c';
    pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);
    pCtx.strokeStyle = 'rgba(54, 46, 84, 0.4)';
    pCtx.lineWidth = 1;
    for (let x = 0; x < pCanvas.width; x += 8) {
      pCtx.beginPath();
      pCtx.moveTo(x, 0);
      pCtx.lineTo(x, pCanvas.height);
      pCtx.stroke();
    }
    for (let y = 0; y < pCanvas.height; y += 8) {
      pCtx.beginPath();
      pCtx.moveTo(0, y);
      pCtx.lineTo(pCanvas.width, y);
      pCtx.stroke();
    }

    pCtx.save();
    pCtx.scale(2.5, 2.5);

    const px = 10;
    const py = 12;
    const isRight = true;

    const activeSkin = skinsData[selectedPreviewSkin] || skinsData.default;

    // 1. Cape
    pCtx.fillStyle = activeSkin.capeColor;
    pCtx.fillRect(px - 3, py + 8, 5, 14);
    pCtx.fillRect(px - 1, py + 22, 4, 2);

    // 2. Helmet
    pCtx.fillStyle = activeSkin.helmetColor;
    pCtx.fillRect(px + 2, py, 12, 8);
    pCtx.fillStyle = activeSkin.plumeHighlightColor;
    pCtx.fillRect(px + 3, py + 1, 10, 3);

    // Visor slit
    pCtx.fillStyle = '#171721';
    pCtx.fillRect(px + 7, py + 3, 7, 3);
    pCtx.fillStyle = activeSkin.eyeColor;
    pCtx.fillRect(px + 9, py + 4, 2, 1);

    // Plume
    pCtx.fillStyle = activeSkin.plumeColor;
    pCtx.fillRect(px + 1, py - 3, 4, 4);
    pCtx.fillStyle = activeSkin.plumeHighlightColor;
    pCtx.fillRect(px + 2, py - 2, 2, 2);

    // 3. Torso
    pCtx.fillStyle = activeSkin.torsoBackColor;
    pCtx.fillRect(px + 2, py + 8, 12, 8);
    pCtx.fillStyle = activeSkin.torsoFrontColor;
    pCtx.fillRect(px + 4, py + 9, 8, 6);

    // Emblem
    pCtx.fillStyle = activeSkin.emblemColor;
    pCtx.fillRect(px + 7, py + 9, 2, 6);
    pCtx.fillRect(px + 5, py + 11, 6, 2);

    // Pauldrons
    pCtx.fillStyle = activeSkin.pauldronColor;
    pCtx.fillRect(px + 1, py + 8, 3, 3);
    pCtx.fillStyle = activeSkin.pauldronShadowColor;
    pCtx.fillRect(px + 12, py + 8, 3, 3);

    // 4. Legs (breathing animation)
    const breath = Math.sin(Date.now() / 180) * 1.0;
    pCtx.fillStyle = activeSkin.torsoBackColor;
    pCtx.fillRect(px + 3, py + 16, 4, 6);
    pCtx.fillRect(px + 9, py + 16, 4, 6);

    pCtx.fillStyle = activeSkin.bootsColor;
    pCtx.fillRect(px + 2, py + 22 + Math.round(breath * 0.1), 5, 2);
    pCtx.fillRect(px + 9, py + 22 + Math.round(breath * 0.1), 5, 2);

    // 5. Sword
    pCtx.fillStyle = activeSkin.hiltColor;
    pCtx.fillRect(px + 14, py + 12 + Math.round(breath * 0.08), 2, 5);
    pCtx.fillStyle = activeSkin.pauldronShadowColor;
    pCtx.fillRect(px + 12, py + 13 + Math.round(breath * 0.08), 6, 2);
    pCtx.fillStyle = activeSkin.bladeColor;
    pCtx.fillRect(px + 14, py + 2 + Math.round(breath * 0.08), 2, 11);
    pCtx.fillStyle = '#ffffff';
    pCtx.fillRect(px + 14, py + 3 + Math.round(breath * 0.08), 1, 9);

    pCtx.restore();

    shopPreviewLoopId = requestAnimationFrame(step);
  }
  shopPreviewLoopId = requestAnimationFrame(step);
}

