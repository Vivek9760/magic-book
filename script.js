// Each animal has bits[] = which pages it appears on (bitmask: 1, 2, 4, 8)
// The key magic: id === sum of bits where it appears
// e.g. Owl = bits [1,2] → id=3; Fox = bits[1,8] → id=9
const NAMES = [
  { id: 1, name: "Cat", icon: "🐱", bits: [1] },
  { id: 2, name: "Dog", icon: "🐶", bits: [2] },
  { id: 3, name: "Owl", icon: "🦉", bits: [1, 2] },
  { id: 4, name: "Bee", icon: "🐝", bits: [4] },
  { id: 5, name: "Ant", icon: "🐜", bits: [1, 4] },
  { id: 6, name: "Cow", icon: "🐮", bits: [2, 4] },
  { id: 7, name: "Pig", icon: "🐷", bits: [1, 2, 4] },
  { id: 8, name: "Hen", icon: "🐔", bits: [8] },
  { id: 9, name: "Fox", icon: "🦊", bits: [1, 8] },
  { id: 10, name: "Bat", icon: "🦇", bits: [2, 8] },
];

const SARCASM = [
  { icon: "🎩", comment: "Ah yes, the legendary ability to say 'yes' when you mean 'no'. Truly a gift.", sub: "The Oracle is not amused" },
  { icon: "🔮", comment: "The crystal ball weeps. Did you perhaps confuse 'yes' and 'no' whilst blinking?", sub: "Perhaps try again, slowly" },
  { icon: "🦉", comment: "Even the Owl — wise beyond measure — could not foresee this level of chaos.", sub: "The spirits are baffled" },
  { icon: "🧙", comment: "In 400 years of mystic practice, the Oracle has never seen such... creative answers.", sub: "We all make mistakes" },
  {
    icon: "🌀",
    comment: "The ancient book trembles. You answered with the confidence of someone who wasn't paying attention.",
    sub: "No judgment. Well, a little",
  },
  { icon: "✨", comment: "Your creature escaped through a logical gap you helpfully provided. Impressive.", sub: "The oracle sighs" },
  { icon: "🐾", comment: "The animals held a vote. They've agreed you were distracted. They're very forgiving.", sub: "Try once more, brave soul" },
];

const DECO_VERSES = [
  "Ponder well,\nfor the Oracle sees\nall hesitation…",
  "Truth resides\nin the quiet mind,\nnot the quick hand.",
  "The ancient ink\nknows not of doubt —\nonly answers.",
  "Does thy creature\ndwell herein?\nSpeak true.",
];

let state = { screen: "cover", currentPage: 0, selections: [] };
let shownSarcasm = false;

function spawnSparkles(x, y) {
  const emojis = ["✨", "⭐", "💫", "🌟", "✦"];
  for (let i = 0; i < 8; i++) {
    const el = document.createElement("div");
    el.className = "sparkle";
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.setProperty("--tx", Math.random() * 160 - 80 + "px");
    el.style.setProperty("--ty", Math.random() * 160 - 80 + "px");
    el.style.animationDelay = Math.random() * 0.3 + "s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
}

function showSarcasm() {
  const s = SARCASM[Math.floor(Math.random() * SARCASM.length)];
  const toast = document.createElement("div");
  toast.className = "sarcasm-toast";
  toast.innerHTML = `
    <div class="toast-icon">${s.icon}</div>
    <div class="toast-comment">${s.comment}</div>
    <div class="toast-sub">✦ ${s.sub} ✦</div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 0.6s, transform 0.6s";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(-20px)";
    setTimeout(() => toast.remove(), 700);
  }, 3500);
}

function progressDots(current) {
  return [0, 1, 2, 3].map((i) => `<div class="progress-dot ${i < current ? "done" : i === current ? "active" : ""}"></div>`).join("");
}

function pageLines(count = 30) {
  return Array.from({ length: count }, () => '<div class="page-line"></div>').join("");
}

function render() {
  const app = document.getElementById("app");

  if (state.screen === "cover") {
    app.innerHTML = `
    <div class="screen">
      <div class="scene">
        <div class="book-3d" id="coverBook" onclick="startOpenAnimation(event)">
          <div class="book-spine"></div>
          <div class="book-pages-side">${pageLines(40)}</div>
          <div class="book-face">
            <div class="cover-shimmer"></div>
            <div class="cover-emblem">📖</div>
            <div class="cover-divider"></div>
            <div class="cover-title">MAGIC<br>BOOK</div>
            <div class="cover-divider"></div>
            <div class="cover-subtitle">A Mystical Mind Game</div>
            <div class="cover-click-hint">~ Touch to Open ~</div>
          </div>
          <div class="book-back"></div>
        </div>
      </div>
    </div>`;
  } else if (state.screen === "choose") {
    app.innerHTML = `
    <div class="screen">
      <div class="book-spread-wrapper">
        <div class="choose-spread">
          <div class="spine-crease"></div>
          <div class="choose-page choose-page-left">
            <div class="big-emote">🔮</div>
            <div class="left-title">Gaze into<br>the Crystal</div>
            <div class="left-subtitle">Choose one animal<br>and hold it in your mind…</div>
          </div>
          <div class="choose-page choose-page-right">
            <div class="right-title">✦ The Creatures ✦</div>
            <div class="animals-choose-grid">
              ${NAMES.map(
                (n) => `
                <div class="choose-animal">
                  <div class="icon">${n.icon}</div>
                  <div class="label">${n.name}</div>
                </div>`,
              ).join("")}
            </div>
            <button class="btn-begin" onclick="beginMagic(event)">✦ I have chosen ✦</button>
          </div>
        </div>
      </div>
    </div>`;
  } else if (state.screen === "page") {
    const bitValue = Math.pow(2, state.currentPage);
    const pageAnimals = NAMES.filter((n) => n.bits.includes(bitValue));
    const pageNum = state.currentPage + 1;
    const verse = DECO_VERSES[state.currentPage];

    app.innerHTML = `
    <div class="screen">
      <div class="book-spread-wrapper">
        <div class="book-spread">
          <div class="spine-crease"></div>
          <div class="page-left">
            <div class="page-header">✦ Chapter ${pageNum} of 4 ✦</div>
            <div class="divider-ornament">— ✦ —</div>
            <div class="page-question">Does your creature appear among these?</div>
            <div class="animals-grid">
              ${pageAnimals
                .map(
                  (n) => `
                <div class="animal-tile">
                  <div class="animal-icon">${n.icon}</div>
                  <div class="animal-name">${n.name}</div>
                </div>`,
                )
                .join("")}
            </div>
            <div class="page-number">${pageNum}</div>
            <div class="corner-deco" style="top:10px;left:10px">
              <svg viewBox="0 0 30 30" fill="none"><path d="M2 28 L2 2 L28 2" stroke="#c9933a" stroke-width="1.5" fill="none" opacity="0.4"/></svg>
            </div>
          </div>
          <div class="page-right">
            <div class="page-header">✦ The Oracle Asks ✦</div>
            <div class="divider-ornament">— ✦ —</div>
            <div class="right-page-inner">
              <div class="page-decorative-art">
                <div class="deco-rune">⚜</div>
                <div class="deco-lines">
                  <div class="deco-line"></div>
                  <div class="deco-verse">${verse.replace(/\n/g, "<br>")}</div>
                  <div class="deco-line"></div>
                </div>
                <div class="deco-rune" style="font-size:clamp(16px,3vw,22px); opacity:0.5">✦ ✦ ✦</div>
              </div>
              <div>
                <div class="answer-buttons">
                  <button class="btn-yes" onclick="nextPage(true, event)">✦ YES</button>
                  <button class="btn-no"  onclick="nextPage(false, event)">NO ✦</button>
                </div>
                <div class="page-progress">${progressDots(state.currentPage)}</div>
              </div>
            </div>
            <div class="page-number">${pageNum + 1}</div>
            <div class="corner-deco" style="bottom:10px;right:10px">
              <svg viewBox="0 0 30 30" fill="none"><path d="M28 2 L28 28 L2 28" stroke="#c9933a" stroke-width="1.5" fill="none" opacity="0.4"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  } else if (state.screen === "result") {
    const total = state.selections.reduce((acc, val) => acc + val, 0);
    const found = NAMES.find((n) => n.id === total);

    app.innerHTML = `
    <div class="screen">
      <div class="book-spread-wrapper">
        <div class="result-spread">
          <div class="spine-crease" style="background:linear-gradient(90deg,rgba(0,0,0,0.3),rgba(0,0,0,0.15),rgba(0,0,0,0.3));"></div>
          <div class="result-page-left">
            <div class="magic-reveal-label">✦ THE ORACLE SPEAKS ✦</div>
            ${
              found
                ? `<div class="reveal-animal-icon" id="revealIcon">${found.icon}</div>
                 <div class="reveal-name" id="revealName">${found.name}</div>
                 <div class="reveal-stars">✦ ✦ ✦</div>`
                : `<div class="reveal-animal-icon" id="revealIcon">🌀</div>
                 <div class="reveal-name" style="font-size:clamp(11px,3vw,14px)">The spirits are<br>confused…</div>`
            }
            <div style="margin-top:14px;font-family:'Crimson Pro',serif;font-style:italic;font-size:clamp(10px,2.2vw,12px);color:#c9933a55;text-align:center;">
              The magic has read<br>your thoughts
            </div>
          </div>
          <div class="result-page-right">
            <div class="right-intro">All the Gates of<br>the Ancient Book…</div>
            <div class="gates-label">✦ THE TEN GATES ✦</div>
            <div class="gates-grid">
              ${NAMES.map(
                (n) => `
                <div class="gate-door ${n.id === total ? "is-result" : ""}" id="gate-${n.id}">
                  <span class="gate-door-num">${n.id}</span>
                  <span class="gate-door-icon">${n.icon}</span>
                </div>`,
              ).join("")}
            </div>
            <div style="font-family:'Crimson Pro',serif;font-size:clamp(10px,2.2vw,12px);font-style:italic;color:#7a6040;text-align:center;margin-bottom:10px;">
              ${found ? `Gate ${found.id} opens to reveal your creature` : "The spirits could not find your creature"}
            </div>
            <button class="btn-restart" onclick="location.reload()">✦ Cast a New Spell ✦</button>
          </div>
        </div>
      </div>
    </div>`;

    // Open all gates
    NAMES.forEach((n, i) => {
      setTimeout(
        () => {
          const gate = document.getElementById(`gate-${n.id}`);
          if (gate) gate.classList.add("open");
          if (n.id === total && i === NAMES.length - 1) {
            const icon = document.getElementById("revealIcon");
            if (icon) {
              const rect = icon.getBoundingClientRect();
              spawnSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
          }
        },
        400 + i * 120,
      );
    });

    // Show sarcasm if result not found (wrong answers)
    if (!found && !shownSarcasm) {
      shownSarcasm = true;
      setTimeout(() => showSarcasm(), 800);
    }
    // Also show sarcasm if total is 0 (all answered no) or not matching any creature
    if (total === 0) {
      setTimeout(() => showSarcasm(), 800);
    }
  }
}

function startOpenAnimation(e) {
  spawnSparkles(e.clientX, e.clientY);
  const book = document.getElementById("coverBook");
  if (book) book.classList.add("opening");
  setTimeout(() => {
    state.screen = "choose";
    render();
  }, 700);
}

function beginMagic(e) {
  spawnSparkles(e.clientX, e.clientY);
  state.currentPage = 0;
  state.selections = [];
  state.screen = "page";
  shownSarcasm = false;

  const overlay = document.createElement("div");
  overlay.className = "page-turn-overlay";
  overlay.innerHTML = '<div class="page-curl"></div>';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 800);
  setTimeout(() => render(), 200);
}

function nextPage(isYes, e) {
  spawnSparkles(e.clientX, e.clientY);
  if (isYes) state.selections.push(Math.pow(2, state.currentPage));

  const overlay = document.createElement("div");
  overlay.className = "page-turn-overlay";
  overlay.innerHTML = '<div class="page-curl"></div>';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 800);

  setTimeout(() => {
    if (state.currentPage < 3) {
      state.currentPage++;
    } else {
      state.screen = "result";
    }
    render();
  }, 300);
}

render();
