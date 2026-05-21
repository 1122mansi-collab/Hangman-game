/* ===== WORD BANK ===== */
const WORD_BANK = {
  animals: [
    {word:"elephant",hint:"Large mammal with a trunk"},
    {word:"dolphin",hint:"Intelligent ocean mammal"},
    {word:"penguin",hint:"Flightless Antarctic bird"},
    {word:"cheetah",hint:"Fastest land animal"},
    {word:"gorilla",hint:"Largest primate"},
    {word:"flamingo",hint:"Pink wading bird"},
    {word:"crocodile",hint:"Ancient reptile"},
    {word:"butterfly",hint:"Beautiful winged insect"},
    {word:"pangolin",hint:"Scaly ant-eating mammal"},
    {word:"chameleon",hint:"Colour-changing lizard"},
  ],
  food: [
    {word:"pineapple",hint:"Spiky tropical fruit"},
    {word:"chocolate",hint:"Sweet made from cacao"},
    {word:"spaghetti",hint:"Long Italian pasta"},
    {word:"avocado",hint:"Green buttery fruit"},
    {word:"croissant",hint:"Flaky French pastry"},
    {word:"sushi",hint:"Japanese rice dish"},
    {word:"lasagna",hint:"Layered Italian pasta bake"},
    {word:"blueberry",hint:"Small blue antioxidant-rich fruit"},
    {word:"tiramisu",hint:"Italian coffee dessert"},
    {word:"pretzel",hint:"Twisted salty snack"},
  ],
  places: [
    {word:"pyramid",hint:"Ancient Egyptian structure"},
    {word:"volcano",hint:"Erupts with lava"},
    {word:"mountain",hint:"Tall natural landform"},
    {word:"antarctica",hint:"Southernmost continent"},
    {word:"amazon",hint:"Vast South American rainforest"},
    {word:"sahara",hint:"World's largest hot desert"},
    {word:"niagara",hint:"Famous North American waterfall"},
    {word:"colosseum",hint:"Ancient Roman amphitheatre"},
    {word:"acropolis",hint:"Ancient Greek citadel in Athens"},
    {word:"fjord",hint:"Narrow sea inlet between cliffs"},
  ],
  tech: [
    {word:"javascript",hint:"Popular web programming language"},
    {word:"algorithm",hint:"Step-by-step problem-solving method"},
    {word:"database",hint:"Organised collection of data"},
    {word:"encryption",hint:"Secures data with a cipher"},
    {word:"bandwidth",hint:"Data transfer capacity"},
    {word:"compiler",hint:"Translates code to machine language"},
    {word:"recursion",hint:"Function that calls itself"},
    {word:"interface",hint:"Point of interaction between systems"},
    {word:"blockchain",hint:"Distributed ledger technology"},
    {word:"firewall",hint:"Network security barrier"},
  ],
  entertainment: [
    {word:"cinema",hint:"Place where movies are screened"},
    {word:"comedy",hint:"Genre meant to make you laugh"},
    {word:"thriller",hint:"Suspenseful genre of film or book"},
    {word:"orchestra",hint:"Large ensemble of musicians"},
    {word:"broadway",hint:"Famous New York theatre street"},
    {word:"animation",hint:"Moving pictures drawn frame by frame"},
    {word:"documentary",hint:"Non-fiction film about real events"},
    {word:"podcast",hint:"Audio show you stream or download"},
    {word:"festival",hint:"Celebration with music and performances"},
    {word:"screenplay",hint:"Script written for a film"},
  ],
};

const HUNT_LEVELS = [
  { title:"The Dungeon",  desc:"A dark prison hides its secret. Decode the word to escape...", emoji:"🏰", timeBonus:30 },
  { title:"The Forest",   desc:"Ancient trees whisper clues. What creature lurks within?",      emoji:"🌲", timeBonus:25 },
  { title:"The Desert",   desc:"Sands shift to reveal a relic. Only the wise shall find it...", emoji:"🏜️", timeBonus:20 },
  { title:"The Ocean",    desc:"Deep waters hold a secret. Dive in and discover the word!",      emoji:"🌊", timeBonus:15 },
  { title:"The Summit",   desc:"The final peak! Conquer this last word and claim the treasure!",emoji:"🏔️", timeBonus:10 },
];
const HUNT_COINS_PER_LEVEL = [15,20,25,30,50];
const HUNT_COMPLETION_BONUS = 75;
const DAILY_COINS = 15;
const PARTS = ["p-head","p-body","p-larm","p-rarm","p-lleg","p-rleg"];
const WIN_BASE_COINS = 10;
const DIFF = {
  easy:   {lives:6, minLen:4, maxLen:6, mult:1, timer:90},
  medium: {lives:6, minLen:1, maxLen:99, mult:2, timer:60},
  hard:   {lives:4, minLen:7, maxLen:99, mult:3, timer:45},
};

const SEC_QUESTIONS = {
  pet:    "What was the name of your first pet?",
  city:   "In what city were you born?",
  mother: "What is your mother's maiden name?",
  school: "What was the name of your first school?",
  hero:   "Who is your favourite fictional hero?",
};

/* ===== STATE ===== */
let coins=0, secret="", guessed=new Set(), wrong=0, maxWrong=6;
let gameOver=false, streak=0, totalWins=0;
let currentDiff="easy", currentCat="all", currentMode="classic";
let timerInterval=null, timeLeft=90, paused=false;

let huntLevel=0, huntCoins=0, huntLevelResults=[], huntActive=false;
let huntSecret="", huntGuessed=new Set(), huntWrong=0, huntMaxWrong=6;
let huntGameOver=false, huntTimeLeft=60;
let huntTimerInterval=null, huntPaused=false;

let forgotUsername="";
let pendingSecqUsername = "";
let lastPickedWord = "";

/* ===== SECURITY QUESTION MODAL ===== */
function openSecqModal(username, isNewSignup) {
  pendingSecqUsername = username;
  document.getElementById("secq-select").value = "";
  document.getElementById("secq-answer").value = "";
  document.getElementById("secq-msg").className = "secq-msg";
  document.getElementById("secq-msg").textContent = "";
  document.getElementById("secq-sub-text").textContent = isNewSignup
    ? "Add a security question so you can recover your passphrase if you ever forget it."
    : "Your account was created before security questions were added. Please set one now to enable passphrase recovery.";
  document.getElementById("secq-modal").classList.add("visible");
}

function saveSecq() {
  const q = document.getElementById("secq-select").value;
  const a = document.getElementById("secq-answer").value.trim();
  const msgEl = document.getElementById("secq-msg");

  if (!q) { msgEl.textContent = "Please choose a security question."; msgEl.className = "secq-msg error"; return; }
  if (!a) { msgEl.textContent = "Please enter your security answer."; msgEl.className = "secq-msg error"; return; }

  const users = JSON.parse(localStorage.getItem("hm_users") || "{}");
  if (users[pendingSecqUsername]) {
    users[pendingSecqUsername].secq = q;
    users[pendingSecqUsername].seca = a.toLowerCase();
    localStorage.setItem("hm_users", JSON.stringify(users));
  }
  document.getElementById("secq-modal").classList.remove("visible");
  finishLogin(pendingSecqUsername);
}

function skipSecq() {
  document.getElementById("secq-modal").classList.remove("visible");
  finishLogin(pendingSecqUsername);
}

/* ===== TAB SWITCHER ===== */
function switchTab(tab) {
  clearAuthMsg();
  if (tab === "signup") {
    document.getElementById("tab-signup").classList.add("active");
    document.getElementById("tab-login").classList.remove("active");
    document.getElementById("form-signup").style.display = "block";
    document.getElementById("form-login").style.display = "none";
  } else {
    document.getElementById("tab-login").classList.add("active");
    document.getElementById("tab-signup").classList.remove("active");
    document.getElementById("form-login").style.display = "block";
    document.getElementById("form-signup").style.display = "none";
  }
}

/* ===== STORAGE HELPERS ===== */
function currentUserKey() {
  const u = localStorage.getItem("hm_currentUser");
  return u ? u.toLowerCase() : "guest";
}
function saveKey(userKey) { return "hm_save_" + (userKey || currentUserKey()); }
function dailyKey(userKey) { return "hm_daily_" + (userKey || currentUserKey()); }

function loadStorage() {
  const s = JSON.parse(localStorage.getItem(saveKey()) || "{}");
  coins = s.coins || 0;
  streak = s.streak || 0;
  totalWins = s.wins || 0;
  updateCoinDisplay();
  updateScoreBar();
}

function saveStorage() {
  const prev = JSON.parse(localStorage.getItem(saveKey()) || "{}");
  const payload = {
    bestStreak:    Math.max(prev.bestStreak   || 0, streak),
    bestCoins:     Math.max(prev.bestCoins    || 0, coins),
    wins:          totalWins,
    streak, coins,
    gamesPlayed:   prev.gamesPlayed   || 0,
    hasFlawless:   prev.hasFlawless   || false,
    hardWin:       prev.hardWin       || false,
    multiWin:      prev.multiWin      || false,
    huntCompleted: prev.huntCompleted || false,
  };
  localStorage.setItem(saveKey(), JSON.stringify(payload));
  updateScoreBar();
}

function updateScoreBar() {
  const s = JSON.parse(localStorage.getItem(saveKey()) || "{}");
  document.getElementById("hs-streak").textContent = s.bestStreak || 0;
  document.getElementById("hs-coins").textContent  = s.bestCoins  || 0;
  document.getElementById("hs-wins").textContent   = s.wins || 0;
}

function addCoins(n)   { coins = Math.max(0, coins+n); updateCoinDisplay(); }
function updateCoinDisplay() { document.getElementById("coin-display").textContent = coins; }
function spendCoins(n) {
  if (coins < n) { showNotif("Not enough coins! 🪙"); return false; }
  coins -= n; updateCoinDisplay(); return true;
}

/* ===== PAGE NAV ===== */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  const showBar = (id !== "page-loading" && id !== "page-auth");
  document.getElementById("top-bar").style.display = showBar ? "flex" : "none";
}

document.getElementById("dark-toggle").addEventListener("click", () => {
  const dark = document.body.getAttribute("data-theme") === "dark";
  document.body.setAttribute("data-theme", dark ? "light" : "dark");
});

function showNotif(msg, dur=2000) {
  const n = document.getElementById("notif");
  n.textContent = msg; n.classList.add("show");
  setTimeout(() => n.classList.remove("show"), dur);
}

function launchConfetti() {
  const colors = ["#c09840","#7a1a30","#fdfaf0","#e8c060","#d8ecd8"];
  for (let i=0; i<60; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.left = Math.random()*100+"vw";
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    el.style.width = (6+Math.random()*8)+"px";
    el.style.height = el.style.width;
    el.style.borderRadius = Math.random()>0.5 ? "50%" : "2px";
    el.style.animationDuration = (1.5+Math.random()*2)+"s";
    el.style.animationDelay = Math.random()*0.5+"s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
}

/* ===== AUTH HELPERS ===== */
function showAuthMsg(msg, type) {
  const el = document.getElementById("auth-msg");
  el.textContent = msg; el.className = "auth-msg " + type;
}
function clearAuthMsg() {
  const el = document.getElementById("auth-msg");
  el.className = "auth-msg"; el.textContent = "";
}
function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === "password") { inp.type="text"; btn.textContent="🙈"; }
  else { inp.type="password"; btn.textContent="👁️"; }
}

/* ===== SIGN UP ===== */
function handleSignUp() {
  clearAuthMsg();
  const username = document.getElementById("su-username").value.trim();
  const email    = document.getElementById("su-email").value.trim();
  const pw       = document.getElementById("su-password").value;
  const confirm  = document.getElementById("su-confirm").value;

  if (!username)           { showAuthMsg("Please enter a champion name.", "error"); return; }
  if (username.length < 3) { showAuthMsg("Champion name must be at least 3 characters.", "error"); return; }
  if (!email || !email.includes("@")) { showAuthMsg("Please enter a valid email address.", "error"); return; }
  if (!pw)                 { showAuthMsg("Please enter your passphrase.", "error"); return; }
  if (pw.length < 6)       { showAuthMsg("Passphrase must be at least 6 characters.", "error"); return; }
  if (pw !== confirm)      { showAuthMsg("Passphrases do not match. Try again.", "error"); return; }

  const users = JSON.parse(localStorage.getItem("hm_users") || "{}");
  const key = username.toLowerCase();
  if (users[key]) { showAuthMsg("This champion name is already taken. Try logging in instead.", "error"); return; }

  users[key] = { email, pw, created: Date.now() };
  localStorage.setItem("hm_users", JSON.stringify(users));
  localStorage.setItem("hm_currentUser", key);

  showAuthMsg("⚔ Account created! Welcome, " + key + "!", "success");
  setTimeout(() => { clearAuthMsg(); openSecqModal(key, true); }, 1000);
}

/* ===== LOGIN ===== */
function handleLogin() {
  clearAuthMsg();
  const input = document.getElementById("li-username").value.trim().toLowerCase();
  const pw    = document.getElementById("li-password").value;

  if (!input) { showAuthMsg("Please enter your username or email.", "error"); return; }
  if (!pw)    { showAuthMsg("Please enter your passphrase.", "error"); return; }

  const users = JSON.parse(localStorage.getItem("hm_users") || "{}");
  let key = null;
  if (users[input]) {
    key = input;
  } else {
    for (const k of Object.keys(users)) {
      if (users[k].email && users[k].email.toLowerCase() === input) { key = k; break; }
    }
  }

  if (!key)                { showAuthMsg("No account found with that username or email.", "error"); return; }
  if (users[key].pw !== pw){ showAuthMsg("Wrong passphrase. Try again or use Forgot passphrase.", "error"); return; }

  localStorage.setItem("hm_currentUser", key);
  showAuthMsg("👑 Welcome back, " + key + "!", "success");

  setTimeout(() => {
    clearAuthMsg();
    if (!users[key].secq) { openSecqModal(key, false); }
    else { finishLogin(key); }
  }, 900);
}

function handleGuest() {
  localStorage.removeItem("hm_currentUser");
  finishLogin("guest");
}

function finishLogin(username) {
  if (username !== "guest") {
    document.querySelector(".top-bar-brand").textContent = "⚔ " + username;
    document.getElementById("profile-top-btn").style.display = "flex";
    document.getElementById("profile-avatar-mini").textContent = username.charAt(0).toUpperCase();
    document.getElementById("profile-top-name").textContent =
      username.length > 8 ? username.slice(0,8)+"…" : username;
  } else {
    document.querySelector(".top-bar-brand").textContent = "Hangman";
    document.getElementById("profile-top-btn").style.display = "none";
  }
  loadStorage();
  showDailyCoins();
}

/* ===== FORGOT PASSWORD ===== */
function openForgotModal() {
  document.querySelectorAll(".forgot-step").forEach(s => s.classList.remove("active"));
  document.getElementById("fstep-1").classList.add("active");
  document.getElementById("fr-username").value = "";
  document.getElementById("fr-answer").value = "";
  document.getElementById("fr-newpw").value = "";
  document.getElementById("fr-confirmpw").value = "";
  hideForgotMsg();
  document.getElementById("forgot-modal").classList.add("visible");
}
function closeForgotModal() {
  document.getElementById("forgot-modal").classList.remove("visible");
  switchTab("login");
}
function showForgotMsg(msg, type) {
  const el = document.getElementById("forgot-msg");
  el.textContent = msg; el.className = "forgot-msg " + type;
}
function hideForgotMsg() {
  const el = document.getElementById("forgot-msg");
  el.className = "forgot-msg"; el.textContent = "";
}
function forgotGoBack(toStep) {
  hideForgotMsg();
  document.querySelectorAll(".forgot-step").forEach(s => s.classList.remove("active"));
  document.getElementById("fstep-" + toStep).classList.add("active");
}

function forgotStep1() {
  hideForgotMsg();
  const username = document.getElementById("fr-username").value.trim().toLowerCase();
  if (!username) { showForgotMsg("Please enter your username.", "error"); return; }
  const users = JSON.parse(localStorage.getItem("hm_users") || "{}");
  if (!users[username]) { showForgotMsg("No account found with that username.", "error"); return; }
  if (!users[username].secq) {
    showForgotMsg("This account has no security question set yet. Please log in first to set one up.", "error");
    return;
  }
  forgotUsername = username;
  const qLabel = SEC_QUESTIONS[users[username].secq] || "Your security question:";
  document.getElementById("fr-question-text").textContent = "🔐 " + qLabel;
  document.querySelectorAll(".forgot-step").forEach(s => s.classList.remove("active"));
  document.getElementById("fstep-2").classList.add("active");
}

function forgotStep2() {
  hideForgotMsg();
  const answer = document.getElementById("fr-answer").value.trim().toLowerCase();
  if (!answer) { showForgotMsg("Please enter your security answer.", "error"); return; }
  const users = JSON.parse(localStorage.getItem("hm_users") || "{}");
  const stored = (users[forgotUsername].seca || "").toLowerCase();
  if (answer !== stored) { showForgotMsg("Incorrect answer. Please try again.", "error"); return; }
  document.querySelectorAll(".forgot-step").forEach(s => s.classList.remove("active"));
  document.getElementById("fstep-3").classList.add("active");
}

function forgotStep3() {
  hideForgotMsg();
  const newpw     = document.getElementById("fr-newpw").value;
  const confirmpw = document.getElementById("fr-confirmpw").value;
  if (!newpw)           { showForgotMsg("Please enter a new passphrase.", "error"); return; }
  if (newpw.length < 6) { showForgotMsg("Passphrase must be at least 6 characters.", "error"); return; }
  if (newpw !== confirmpw) { showForgotMsg("Passphrases do not match.", "error"); return; }
  const users = JSON.parse(localStorage.getItem("hm_users") || "{}");
  users[forgotUsername].pw = newpw;
  localStorage.setItem("hm_users", JSON.stringify(users));
  document.querySelectorAll(".forgot-step").forEach(s => s.classList.remove("active"));
  document.getElementById("fstep-4").classList.add("active");
}

/* ===== DAILY COINS ===== */
function showDailyCoins() {
  showPage("page-coins");
  const today    = new Date().toDateString();
  const lastDate = localStorage.getItem(dailyKey());
  let reward = 0;
  if (lastDate !== today) {
    reward = DAILY_COINS;
    addCoins(DAILY_COINS);
    localStorage.setItem(dailyKey(), today);
    saveStorage();
  }
  document.getElementById("daily-coins-display").textContent = reward || 0;
  document.querySelector(".coins-card .sub").textContent = reward
    ? "Welcome back, brave challenger!"
    : "You already claimed today's reward!";
}
document.getElementById("coins-continue-btn").addEventListener("click", () => showPage("page-setup"));

/* ===== PROFILE ===== */
function openProfile() {
  const username = localStorage.getItem("hm_currentUser") || "guest";
  const users    = JSON.parse(localStorage.getItem("hm_users") || "{}");
  const userData = users[username.toLowerCase()] || {};
  const save     = JSON.parse(localStorage.getItem(saveKey()) || "{}");

  document.getElementById("prof-avatar-big").textContent = username.charAt(0).toUpperCase();
  document.getElementById("prof-name").textContent = username;
  const wins  = save.wins || 0;
  const games = save.gamesPlayed || 0;
  let rank = "🏅 Recruit";
  if (wins >= 50)      rank = "👑 Grandmaster";
  else if (wins >= 25) rank = "⚔ Knight";
  else if (wins >= 10) rank = "🛡 Squire";
  else if (wins >= 3)  rank = "📜 Apprentice";
  document.getElementById("prof-rank").textContent  = rank;
  document.getElementById("prof-role").textContent  = wins >= 10 ? "Seasoned Word Warrior" : "Royal Challenger";
  document.getElementById("prof-wins").textContent       = wins;
  document.getElementById("prof-streak").textContent     = save.bestStreak || 0;
  document.getElementById("prof-coins-stat").textContent = save.bestCoins  || 0;
  document.getElementById("prof-games").textContent      = games;
  document.getElementById("prof-cur-coins").textContent  = coins;
  const wr = games > 0 ? Math.round((wins/games)*100) : 0;
  document.getElementById("prof-winrate").textContent    = wr+"%";
  document.getElementById("prof-username-val").textContent = username;
  document.getElementById("prof-email-val").textContent    = userData.email || "—";
  document.getElementById("prof-type-val").textContent     = username === "guest" ? "Guest" : "Registered";
  const created = userData.created
    ? new Date(userData.created).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})
    : "—";
  document.getElementById("prof-since-val").textContent    = created;
  document.getElementById("prof-joined").textContent       = created !== "—" ? "Joined "+created : "";
  const lastLogin = userData.lastLogin
    ? new Date(userData.lastLogin).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})
    : "Today";
  document.getElementById("prof-lastlogin-val").textContent = lastLogin;

  const ALL_ACHS = [
    { id:"first_win", icon:"⚔",  label:"First Victory",       earned: wins>=1 },
    { id:"win3",      icon:"🔥",  label:"3-Win Streak",        earned: (save.bestStreak||0)>=3 },
    { id:"win5",      icon:"💫",  label:"5-Win Streak",        earned: (save.bestStreak||0)>=5 },
    { id:"win10",     icon:"🏆",  label:"10 Victories",        earned: wins>=10 },
    { id:"flawless",  icon:"✨",  label:"Flawless Victor",     earned: !!(save.hasFlawless) },
    { id:"coin100",   icon:"🪙",  label:"100 Coins Collected", earned: (save.bestCoins||0)>=100 },
    { id:"coin500",   icon:"💰",  label:"500 Coins Collected", earned: (save.bestCoins||0)>=500 },
    { id:"hunt_done", icon:"🗺️", label:"Treasure Hunter",     earned: !!(save.huntCompleted) },
    { id:"hard_win",  icon:"🔱",  label:"Hard Mode Victor",    earned: !!(save.hardWin) },
    { id:"multi_win", icon:"👥",  label:"Multiplayer Master",  earned: !!(save.multiWin) },
  ];
  const grid = document.getElementById("prof-ach-grid");
  grid.innerHTML = "";
  ALL_ACHS.forEach(a => {
    const div = document.createElement("div");
    div.className = "ach-tile"+(a.earned ? " earned" : "");
    div.innerHTML = `<span class="ach-icon">${a.icon}</span>${a.label}`;
    grid.appendChild(div);
  });

  if (userData.email) {
    userData.lastLogin = Date.now();
    users[username.toLowerCase()] = userData;
    localStorage.setItem("hm_users", JSON.stringify(users));
  }

  showPage("page-profile");
  window.scrollTo({top:0, behavior:"smooth"});
}

document.getElementById("profile-top-btn").addEventListener("click", openProfile);
document.getElementById("prof-back-btn").addEventListener("click", () => showPage("page-setup"));
document.getElementById("prof-play-btn").addEventListener("click", () => showPage("page-setup"));
document.getElementById("prof-logout-btn").addEventListener("click", () => {
  if (confirm("Log out and return to the sign-in page?")) {
    saveStorage();
    localStorage.removeItem("hm_currentUser");
    document.getElementById("profile-top-btn").style.display = "none";
    document.querySelector(".top-bar-brand").textContent = "Hangman";
    document.getElementById("su-username").value = "";
    document.getElementById("su-email").value = "";
    document.getElementById("su-password").value = "";
    document.getElementById("su-confirm").value = "";
    document.getElementById("li-username").value = "";
    document.getElementById("li-password").value = "";
    clearAuthMsg();
    coins=0; streak=0; totalWins=0;
    updateCoinDisplay();
    switchTab("login");
    showPage("page-auth");
  }
});

/* ===== LOADING ===== */
window.addEventListener("load", () => {
  setTimeout(() => showPage("page-auth"), 3500);
});

/* ===== SETUP PAGE ===== */
document.querySelectorAll(".diff-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    currentDiff = btn.dataset.diff;
  });
});
document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    currentCat = btn.dataset.cat;
  });
});
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    currentMode = btn.dataset.mode;
    document.getElementById("mp-input-section").style.display = currentMode==="multi" ? "block" : "none";
  });
});

document.getElementById("start-game-btn").addEventListener("click", () => {
  if (currentMode === "hunt") { startHunt(); return; }
  if (currentMode === "multi") {
    const w = document.getElementById("mp-word-input").value.trim().toLowerCase().replace(/[^a-z]/g,"");
    const h = document.getElementById("mp-hint-input").value.trim();
    if (!w) { showNotif("Enter a word for your friend!"); return; }
    startGame({word:w, hint:h || "Your friend's word"});
  } else {
    startGame(pickWord());
  }
});

/* ===== WORD PICKER ===== */
function pickWord(diffOverride, catOverride) {
  const d = diffOverride || currentDiff;
  const c = catOverride  || currentCat;
  const diff = DIFF[d];
  let pool;
  if (c === "all") pool = Object.values(WORD_BANK).flat();
  else pool = WORD_BANK[c] || Object.values(WORD_BANK).flat();
  const filtered = pool.filter(w => w.word.length >= diff.minLen && w.word.length <= diff.maxLen);
  const src = filtered.length ? filtered : pool;
  const candidates = src.length > 1 ? src.filter(w => w.word !== lastPickedWord) : src;
  const picked = candidates[Math.floor(Math.random()*candidates.length)];
  lastPickedWord = picked.word;
  return picked;
}

/* ===== GAME CORE ===== */
function startGame(entry) {
  secret=entry.word; guessed=new Set(); wrong=0; gameOver=false; paused=false;
  maxWrong = DIFF[currentDiff].lives;
  PARTS.forEach(id => document.getElementById(id).setAttribute("visibility","hidden"));
  document.getElementById("status").textContent = "";
  document.getElementById("status").style.color = "var(--maroon)";
  document.getElementById("mistakes").textContent = `Mistakes: 0 / ${maxWrong}`;
  document.getElementById("hint-text").textContent = "Guess: " + entry.hint;
  document.getElementById("diff-label").textContent =
    currentDiff.charAt(0).toUpperCase()+currentDiff.slice(1)+" ×"+DIFF[currentDiff].mult;
  document.getElementById("results-overlay").classList.remove("visible");
  document.getElementById("streak-display").textContent = streak;
  renderWord(); renderKeyboard();
  clearInterval(timerInterval);
  timeLeft = DIFF[currentDiff].timer;
  const tb = document.getElementById("timer-box");
  tb.style.display = "block"; tb.textContent = timeLeft; tb.classList.remove("urgent");
  timerInterval = setInterval(() => {
    if (paused) return;
    timeLeft--;
    tb.textContent = timeLeft;
    if (timeLeft <= 10) tb.classList.add("urgent");
    if (timeLeft <= 0) { clearInterval(timerInterval); endGame(false); }
  }, 1000);
  showPage("page-game");
  window.scrollTo({top:0, behavior:"smooth"});
}

function renderWord() {
  const el = document.getElementById("word-display");
  el.innerHTML = "";
  for (const ch of secret) {
    const box = document.createElement("div");
    box.className = "letter-box";
    if (guessed.has(ch)) { box.textContent = ch.toUpperCase(); box.classList.add("revealed"); }
    el.appendChild(box);
  }
}

function renderKeyboard() {
  const el = document.getElementById("keyboard");
  el.innerHTML = "";
  for (let i=65; i<=90; i++) {
    const ch = String.fromCharCode(i).toLowerCase();
    const btn = document.createElement("button");
    btn.className="key"; btn.textContent=ch.toUpperCase(); btn.id="key-"+ch;
    btn.onclick = () => guess(ch);
    if (guessed.has(ch)) {
      btn.disabled=true;
      btn.className = "key "+(secret.includes(ch) ? "correct" : "wrong");
    }
    el.appendChild(btn);
  }
}

function guess(ch) {
  if (gameOver || guessed.has(ch) || paused) return;
  guessed.add(ch);
  const btn = document.getElementById("key-"+ch);
  if (secret.includes(ch)) {
    btn.className="key correct"; btn.disabled=true;
    renderWord();
    if ([...secret].every(c => guessed.has(c))) { clearInterval(timerInterval); endGame(true); }
  } else {
    btn.className="key wrong"; btn.disabled=true;
    const part = document.getElementById(PARTS[wrong]);
    part.setAttribute("visibility","visible");
    part.classList.remove("part-animate"); void part.offsetWidth; part.classList.add("part-animate");
    wrong++;
    document.getElementById("mistakes").textContent = `Mistakes: ${wrong} / ${maxWrong}`;
    const gc = document.querySelector(".game-card");
    gc.classList.remove("shake"); void gc.offsetWidth; gc.classList.add("shake");
    if (wrong >= maxWrong) { clearInterval(timerInterval); endGame(false); }
  }
}

function endGame(won) {
  gameOver = true;
  document.querySelectorAll(".key").forEach(b => b.disabled=true);
  if (!won) {
    const boxes = document.getElementById("word-display").querySelectorAll(".letter-box");
    [...secret].forEach((ch,i) => {
      if (!guessed.has(ch)) { boxes[i].textContent=ch.toUpperCase(); boxes[i].style.color="#e03030"; }
    });
  }
  let earned = 0;
  if (won) {
    const mult = DIFF[currentDiff].mult;
    earned = WIN_BASE_COINS * mult + Math.floor(timeLeft/5);
    streak++; totalWins++;
    if (streak>0 && streak%3===0) { earned+=15; showNotif(`🔥 ${streak}-streak bonus! +15 🪙`); }
    addCoins(earned);
    launchConfetti();
  } else { streak=0; }

  const prev2 = JSON.parse(localStorage.getItem(saveKey()) || "{}");
  prev2.gamesPlayed = (prev2.gamesPlayed||0)+1;
  if (won && wrong===0) prev2.hasFlawless=true;
  if (won && currentDiff==="hard") prev2.hardWin=true;
  if (won && currentMode==="multi") prev2.multiWin=true;
  localStorage.setItem(saveKey(), JSON.stringify(prev2));
  saveStorage();

  const achs = [];
  if (won && wrong===0)     achs.push({label:"🏆 Flawless Victory", isNew:true});
  if (streak>=5)            achs.push({label:`🔥 ${streak} Game Streak`, isNew:true});
  if (won && totalWins===1) achs.push({label:"⚔ First Victory", isNew:true});

  const heading = document.getElementById("result-heading");
  heading.textContent = won ? "Victory!" : "Defeated…";
  heading.className   = won ? "win" : "lose";
  document.getElementById("result-word").textContent    = "The word was: "+secret.toUpperCase();
  document.getElementById("earned-display").textContent = "+"+earned;
  document.getElementById("total-display").textContent  = coins;
  document.getElementById("streak-result").textContent  = streak;
  document.getElementById("streak-display").textContent = streak;

  const achRow = document.getElementById("ach-row");
  achRow.innerHTML = "";
  achs.forEach(a => {
    const span = document.createElement("span");
    span.className = "ach-badge"+(a.isNew ? " new" : "");
    span.textContent = a.label;
    achRow.appendChild(span);
  });
  setTimeout(() => document.getElementById("results-overlay").classList.add("visible"), 600);
}

/* ===== PAUSE ===== */
document.getElementById("pause-btn").addEventListener("click", () => {
  paused=true; document.getElementById("pause-overlay").classList.add("visible");
});
document.getElementById("resume-btn").addEventListener("click", () => {
  paused=false; huntPaused=false; document.getElementById("pause-overlay").classList.remove("visible");
});
document.getElementById("quit-btn").addEventListener("click", () => {
  clearInterval(timerInterval); clearInterval(huntTimerInterval);
  paused=false; huntPaused=false;
  document.getElementById("pause-overlay").classList.remove("visible");
  document.getElementById("results-overlay").classList.remove("visible");
  document.getElementById("hunt-results-overlay").classList.remove("visible");
  showPage("page-setup");
});
document.getElementById("back-btn").addEventListener("click", () => {
  if (confirm("Return to setup? Your current game will be lost.")) {
    clearInterval(timerInterval); gameOver=true;
    document.getElementById("results-overlay").classList.remove("visible");
    showPage("page-setup");
  }
});

/* ===== SHOP ===== */
document.getElementById("shop-open-btn").addEventListener("click", () =>
  document.getElementById("shop-modal").classList.add("visible"));
document.getElementById("shop-close-btn").addEventListener("click", () =>
  document.getElementById("shop-modal").classList.remove("visible"));

function buyHint() {
  if (gameOver) return;
  if (!spendCoins(5)) return;
  const hidden = [...secret].filter(ch => !guessed.has(ch));
  if (!hidden.length) { addCoins(5); return; }
  const ch = hidden[Math.floor(Math.random()*hidden.length)];
  guess(ch); showNotif(`💡 Revealed: ${ch.toUpperCase()}`);
}
function buyExtraLife() {
  if (gameOver || wrong===0) { showNotif("No mistakes to remove!"); return; }
  if (!spendCoins(8)) return;
  wrong--;
  document.getElementById(PARTS[wrong]).setAttribute("visibility","hidden");
  document.getElementById("mistakes").textContent = `Mistakes: ${wrong} / ${maxWrong}`;
  showNotif("❤️ Life restored!");
}
function shopBuy(item) {
  document.getElementById("shop-modal").classList.remove("visible");
  const onHunt = document.getElementById("page-hunt").classList.contains("active");
  if (item==="hint")       { if (onHunt) buyHuntHint(); else buyHint(); }
  else if (item==="life")  { if (onHunt) buyHuntExtraLife(); else buyExtraLife(); }
  else if (item==="skip") {
    if (onHunt) { showNotif("Cannot skip in Treasure Hunt!"); return; }
    if (!spendCoins(6)) return;
    showNotif("⏩ New word incoming!");
    setTimeout(() => startGame(pickWord()), 500);
  }
}

document.getElementById("new-game-btn").addEventListener("click", () => {
  document.getElementById("results-overlay").classList.remove("visible");
  startGame(pickWord());
});
document.getElementById("change-setup-btn").addEventListener("click", () => {
  document.getElementById("results-overlay").classList.remove("visible");
  showPage("page-setup");
});

/* ===== KEYBOARD ===== */
document.addEventListener("keydown", e => {
  const ch = e.key.toLowerCase();
  if (ch.length!==1 || ch<"a" || ch>"z") return;
  if (document.getElementById("page-game").classList.contains("active") && !paused) guess(ch);
  else if (document.getElementById("page-hunt").classList.contains("active") && !huntPaused) huntGuess(ch);
});

/* ===== TREASURE HUNT ===== */
function startHunt() {
  huntLevel=0; huntCoins=0; huntLevelResults=[]; huntActive=true;
  startHuntLevel();
}
function startHuntLevel() {
  const level = HUNT_LEVELS[huntLevel];
  const entry = pickWord("medium", currentCat);
  huntSecret=entry.word; huntGuessed=new Set(); huntWrong=0; huntMaxWrong=6;
  huntGameOver=false; huntPaused=false;
  huntTimeLeft = 60+(huntLevel===0?30:huntLevel===1?25:huntLevel===2?20:huntLevel===3?15:10);

  document.getElementById("hunt-level-badge").textContent = `Level ${huntLevel+1} of 5`;
  document.getElementById("hunt-level-title").textContent = level.emoji+" "+level.title;
  document.getElementById("hunt-level-desc").textContent  = level.desc;
  document.getElementById("hunt-hint-text").textContent   = "Guess: "+entry.hint;
  document.getElementById("hunt-status").textContent      = "";
  document.getElementById("hunt-mistakes").textContent    = `Mistakes: 0 / ${huntMaxWrong}`;
  document.getElementById("hunt-level-num").textContent   = `${huntLevel+1}/5`;
  document.getElementById("hunt-coins-so-far").textContent= huntCoins;
  document.getElementById("hunt-lives-left").textContent  = huntMaxWrong;

  const progress = document.getElementById("hunt-progress");
  progress.innerHTML = "";
  for (let i=0; i<5; i++) {
    const dot = document.createElement("div");
    dot.className = "hunt-dot"+(i<huntLevel?" done":i===huntLevel?" current":"");
    progress.appendChild(dot);
  }

  clearInterval(huntTimerInterval);
  const tb = document.getElementById("hunt-timer-box");
  tb.textContent=huntTimeLeft; tb.classList.remove("urgent");
  huntTimerInterval = setInterval(() => {
    if (huntPaused) return;
    huntTimeLeft--;
    tb.textContent = huntTimeLeft;
    if (huntTimeLeft<=10) tb.classList.add("urgent");
    if (huntTimeLeft<=0) { clearInterval(huntTimerInterval); huntEndLevel(false); }
  }, 1000);

  renderHuntWord(); renderHuntKeyboard();
  showPage("page-hunt");
  window.scrollTo({top:0, behavior:"smooth"});
}

function renderHuntWord() {
  const el = document.getElementById("hunt-word-display");
  el.innerHTML = "";
  for (const ch of huntSecret) {
    const box = document.createElement("div");
    box.className = "letter-box";
    if (huntGuessed.has(ch)) { box.textContent=ch.toUpperCase(); box.classList.add("revealed"); }
    el.appendChild(box);
  }
}
function renderHuntKeyboard() {
  const el = document.getElementById("hunt-keyboard");
  el.innerHTML = "";
  for (let i=65; i<=90; i++) {
    const ch = String.fromCharCode(i).toLowerCase();
    const btn = document.createElement("button");
    btn.className="key"; btn.textContent=ch.toUpperCase(); btn.id="hkey-"+ch;
    btn.onclick = () => huntGuess(ch);
    if (huntGuessed.has(ch)) { btn.disabled=true; btn.className="key "+(huntSecret.includes(ch)?"correct":"wrong"); }
    el.appendChild(btn);
  }
}
function huntGuess(ch) {
  if (huntGameOver || huntGuessed.has(ch) || huntPaused) return;
  huntGuessed.add(ch);
  const btn = document.getElementById("hkey-"+ch);
  if (huntSecret.includes(ch)) {
    btn.className="key correct"; btn.disabled=true;
    renderHuntWord();
    if ([...huntSecret].every(c => huntGuessed.has(c))) { clearInterval(huntTimerInterval); huntEndLevel(true); }
  } else {
    btn.className="key wrong"; btn.disabled=true;
    huntWrong++;
    document.getElementById("hunt-mistakes").textContent = `Mistakes: ${huntWrong} / ${huntMaxWrong}`;
    document.getElementById("hunt-lives-left").textContent = huntMaxWrong-huntWrong;
    if (huntWrong>=huntMaxWrong) { clearInterval(huntTimerInterval); huntEndLevel(false); }
  }
}
function huntEndLevel(won) {
  huntGameOver=true;
  document.querySelectorAll("#hunt-keyboard .key").forEach(b => b.disabled=true);
  let coinsEarned=0;
  if (won) {
    coinsEarned = HUNT_COINS_PER_LEVEL[huntLevel]+Math.floor(huntTimeLeft/3);
    huntCoins += coinsEarned;
    document.getElementById("hunt-coins-so-far").textContent=huntCoins;
    document.getElementById("hunt-status").textContent="✓ Word Found!";
    document.getElementById("hunt-status").style.color="var(--green)";
  } else {
    const boxes = document.getElementById("hunt-word-display").querySelectorAll(".letter-box");
    [...huntSecret].forEach((ch,i) => {
      if (!huntGuessed.has(ch)) { boxes[i].textContent=ch.toUpperCase(); boxes[i].style.color="#e03030"; }
    });
    document.getElementById("hunt-status").textContent="✗ Level Failed";
    document.getElementById("hunt-status").style.color="#e03030";
  }
  huntLevelResults.push({level:huntLevel+1, title:HUNT_LEVELS[huntLevel].title, word:huntSecret, won, coins:coinsEarned});
  setTimeout(() => {
    if (!won) {
      showHuntResults(false);
    } else if (huntLevel>=4) {
      huntCoins += HUNT_COMPLETION_BONUS;
      addCoins(huntCoins);
      const ph = JSON.parse(localStorage.getItem(saveKey())||"{}");
      ph.huntCompleted=true; localStorage.setItem(saveKey(), JSON.stringify(ph));
      saveStorage(); launchConfetti(); showHuntResults(true);
    } else {
      huntLevel++;
      showNotif(`✅ Level ${huntLevel} cleared! +${coinsEarned} 🪙`, 1800);
      setTimeout(startHuntLevel, 2000);
    }
  }, 1200);
}
function showHuntResults(won) {
  const el = document.getElementById("hunt-result-heading");
  el.textContent = won ? "Treasure Found!" : "Hunt Failed…";
  el.style.color = won ? "var(--green)" : "var(--maroon)";
  document.getElementById("hunt-result-sub").textContent = won
    ? "You conquered all 5 levels and claimed the treasure chest! 🎉"
    : `Defeated at Level ${huntLevelResults.length}. Better luck next hunt!`;
  document.getElementById("hunt-final-coins").textContent = "+"+huntCoins;
  const resultsEl = document.getElementById("hunt-level-results");
  resultsEl.innerHTML = "";
  huntLevelResults.forEach(r => {
    const row = document.createElement("div");
    row.className = "hunt-level-row";
    row.innerHTML = `<span>${r.won?"✅":"❌"} L${r.level}: ${r.title}</span><span style="color:var(--text2);font-style:italic;">${r.word.toUpperCase()}</span><span style="color:var(--gold);font-weight:700;">+${r.coins}🪙</span>`;
    resultsEl.appendChild(row);
  });
  if (won) {
    const bonus = document.createElement("div");
    bonus.className="hunt-level-row";
    bonus.innerHTML=`<span>🏆 Completion Bonus</span><span></span><span style="color:var(--gold);font-weight:700;">+${HUNT_COMPLETION_BONUS}🪙</span>`;
    resultsEl.appendChild(bonus);
  }
  if (!won) { addCoins(huntCoins); saveStorage(); }
  document.getElementById("hunt-results-overlay").classList.add("visible");
}

document.getElementById("hunt-pause-btn").addEventListener("click", () => {
  huntPaused=true; document.getElementById("pause-overlay").classList.add("visible");
});
document.getElementById("hunt-back-btn").addEventListener("click", () => {
  if (confirm("Quit the Treasure Hunt? All progress will be lost.")) {
    clearInterval(huntTimerInterval); huntActive=false;
    document.getElementById("hunt-results-overlay").classList.remove("visible");
    showPage("page-setup");
  }
});
document.getElementById("hunt-setup-btn").addEventListener("click", () => {
  document.getElementById("hunt-results-overlay").classList.remove("visible");
  showPage("page-setup");
});
document.getElementById("hunt-retry-btn").addEventListener("click", () => {
  document.getElementById("hunt-results-overlay").classList.remove("visible");
  startHunt();
});

function buyHuntHint() {
  if (huntGameOver) return;
  if (!spendCoins(5)) return;
  const hidden = [...huntSecret].filter(ch => !huntGuessed.has(ch));
  if (!hidden.length) { addCoins(5); return; }
  const ch = hidden[Math.floor(Math.random()*hidden.length)];
  huntGuess(ch); showNotif(`💡 Revealed: ${ch.toUpperCase()}`);
}
function buyHuntExtraLife() {
  if (huntGameOver || huntWrong===0) { showNotif("No mistakes to remove!"); return; }
  if (!spendCoins(8)) return;
  huntWrong--;
  document.getElementById("hunt-mistakes").textContent = `Mistakes: ${huntWrong} / ${huntMaxWrong}`;
  document.getElementById("hunt-lives-left").textContent = huntMaxWrong-huntWrong;
  showNotif("❤️ Life restored!");
}