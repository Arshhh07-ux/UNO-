/* =========================================================
   ARSH CARD ARENA
   3D PLAYABLE CARD GAME
   Original UNO-style game system
   ========================================================= */

let scene = null;
let camera = null;
let renderer = null;

let gameMode = "OFFLINE";
let cardStyle = "NORMAL";
let difficulty = "PRO";

let gameRunning = false;
let playerHand = [];
let aiHand = [];
let deck = [];
let discardPile = [];

let currentTurn = "PLAYER";
let currentColor = null;

let playerGroup = null;
let aiGroup = null;
let deckGroup = null;
let discardGroup = null;
let boardGroup = null;

let selectedCard = null;
let selectedCardIndex = -1;

let playerNeedsUNO = false;
let playerCalledUNO = false;

let gameObjects = [];
let animationObjects = [];

let raycaster = null;
let pointer = new THREE.Vector2();
let pointerDown = false;

let messageTimer = null;
let turnTimer = null;

const COLORS = {
  RED: 0xff1744,
  BLUE: 0x1677ff,
  GREEN: 0x16c96b,
  YELLOW: 0xffc400,
  BLACK: 0x10131c
};

const COLOR_NAMES = ["RED", "BLUE", "GREEN", "YELLOW"];

const COLOR_HEX = {
  RED: "#ff1744",
  BLUE: "#1677ff",
  GREEN: "#16c96b",
  YELLOW: "#ffc400"
};


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

  if (gameRunning) return;

  gameRunning = true;

  /* Read values from existing menu if available */
  try {
    if (typeof window.gameMode !== "undefined") {
      gameMode = window.gameMode;
    }

    if (typeof window.cardStyle !== "undefined") {
      cardStyle = window.cardStyle;
    }

    if (typeof window.difficulty !== "undefined") {
      difficulty = window.difficulty;
    }
  } catch (e) {}

  gameMode = String(gameMode || "OFFLINE").toUpperCase();
  cardStyle = String(cardStyle || "NORMAL").toUpperCase();
  difficulty = String(difficulty || "PRO").toUpperCase();

  /* Completely replace ONLY after Enter Arena */
  document.body.innerHTML = `
    <div id="game3d"></div>

    <div id="gameVignette"></div>

    <div id="topUI">
      <div class="arenaLogo">CARD<br><span>ARENA</span></div>

      <div class="playerInfo">
        <b>ARSH</b>
        <small>PRO PLAYER</small>
      </div>

      <div class="modeInfo">
        ${gameMode}
      </div>
    </div>

    <div id="turnUI">YOUR TURN</div>

    <div id="colorUI">
      COLOR: <span>---</span>
    </div>

    <div id="cardCounter">
      YOU: <b>7</b>
    </div>

    <div id="aiCounter">
      ARSH: <b>7</b>
    </div>

    <button id="unoButton">
      UNO!
    </button>

    <button id="drawCard">
      DRAW CARD
    </button>

    <div id="gameMessage"></div>

    <div id="wildChooser">
      <div class="wildTitle">CHOOSE COLOR</div>

      <div class="wildColors">
        <button data-color="RED">RED</button>
        <button data-color="BLUE">BLUE</button>
        <button data-color="GREEN">GREEN</button>
        <button data-color="YELLOW">YELLOW</button>
      </div>
    </div>

    <div id="endScreen">
      <div class="endBox">
        <div id="endTitle">YOU WIN</div>
        <div id="endSub">CARD ARENA</div>
        <button id="restartGame">PLAY AGAIN</button>
        <button id="backMenu">BACK TO MENU</button>
      </div>
    </div>
  `;

  injectGameStyles();
  createArena3D();
  setupGame();
}


/* =========================================================
   GAME CSS
   ========================================================= */

function injectGameStyles() {

  const old = document.getElementById("arenaGameStyles");

  if (old) old.remove();

  const style = document.createElement("style");

  style.id = "arenaGameStyles";

  style.textContent = `
    *{
      box-sizing:border-box;
      -webkit-tap-highlight-color:transparent;
    }

    body{
      margin:0;
      overflow:hidden;
      background:#02040a;
      font-family:Arial,Helvetica,sans-serif;
      user-select:none;
      touch-action:none;
    }

    #game3d{
      position:fixed;
      inset:0;
      overflow:hidden;
      background:
        radial-gradient(circle at 50% 45%,#0d4029 0%,#03150d 42%,#010306 100%);
    }

    #game3d canvas{
      display:block;
      width:100%!important;
      height:100%!important;
    }

    #gameVignette{
      position:fixed;
      inset:0;
      pointer-events:none;
      z-index:3;
      background:
        radial-gradient(
          ellipse at center,
          transparent 45%,
          rgba(0,0,0,.22) 75%,
          rgba(0,0,0,.72) 100%
        );
    }

    #topUI{
      position:fixed;
      top:16px;
      left:16px;
      right:16px;
      height:62px;
      z-index:10;
      display:flex;
      align-items:center;
      gap:12px;
      pointer-events:none;
    }

    .arenaLogo{
      width:60px;
      height:48px;
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      border:2px solid rgba(255,255,255,.95);
      border-radius:14px;
      color:#fff;
      font-weight:1000;
      font-size:13px;
      line-height:12px;
      letter-spacing:1px;
      transform:rotate(-5deg);
      background:
        linear-gradient(135deg,#ff1744,#9e0027);
      box-shadow:
        0 0 15px rgba(255,23,68,.55),
        inset 0 0 10px rgba(255,255,255,.16);
    }

    .arenaLogo span{
      color:#ffd54a;
      font-size:11px;
    }

    .playerInfo{
      color:#fff;
    }

    .playerInfo b{
      display:block;
      font-size:15px;
      letter-spacing:2px;
    }

    .playerInfo small{
      color:#a9b3bd;
      font-size:8px;
      letter-spacing:2px;
    }

    .modeInfo{
      margin-left:auto;
      padding:8px 13px;
      border-radius:20px;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(0,0,0,.35);
      color:#ffd54a;
      font-size:9px;
      letter-spacing:2px;
      backdrop-filter:blur(8px);
    }

    #turnUI{
      position:fixed;
      top:84px;
      left:50%;
      transform:translateX(-50%);
      z-index:10;
      color:#ffd54a;
      font-size:11px;
      font-weight:900;
      letter-spacing:3px;
      text-shadow:
        0 0 8px #ffd54a,
        0 0 20px rgba(255,213,74,.6);
      pointer-events:none;
      white-space:nowrap;
    }

    #colorUI{
      position:fixed;
      top:108px;
      left:50%;
      transform:translateX(-50%);
      z-index:10;
      padding:5px 12px;
      border-radius:15px;
      color:#dfe8e4;
      background:rgba(0,0,0,.25);
      border:1px solid rgba(255,255,255,.08);
      font-size:8px;
      letter-spacing:2px;
      pointer-events:none;
    }

    #colorUI span{
      color:#fff;
      font-weight:900;
    }

    #cardCounter,
    #aiCounter{
      position:fixed;
      z-index:10;
      padding:7px 11px;
      border-radius:12px;
      color:#fff;
      background:rgba(0,0,0,.38);
      border:1px solid rgba(255,255,255,.1);
      font-size:9px;
      letter-spacing:1px;
      pointer-events:none;
      backdrop-filter:blur(7px);
    }

    #cardCounter{
      bottom:145px;
      left:16px;
    }

    #aiCounter{
      top:150px;
      right:16px;
    }

    #unoButton{
      position:fixed;
      z-index:20;
      bottom:25px;
      right:18px;
      width:74px;
      height:74px;
      border-radius:50%;
      border:3px solid #fff;
      background:
        radial-gradient(circle at 35% 30%,#ff687e,#ef123c 55%,#9e0027);
      color:#fff;
      font-size:18px;
      font-weight:1000;
      font-style:italic;
      box-shadow:
        0 0 15px rgba(255,23,68,.55),
        0 8px 25px rgba(0,0,0,.4);
      transition:
        transform .16s ease,
        filter .16s ease,
        opacity .16s ease;
    }

    #unoButton:active{
      transform:scale(.9);
    }

    #unoButton.ready{
      animation:unoPulse .75s infinite alternate;
    }

    @keyframes unoPulse{
      from{
        transform:scale(1);
        box-shadow:0 0 15px rgba(255,23,68,.55);
      }
      to{
        transform:scale(1.1);
        box-shadow:
          0 0 25px rgba(255,23,68,.9),
          0 0 50px rgba(255,23,68,.35);
      }
    }

    #drawCard{
      position:fixed;
      z-index:20;
      bottom:34px;
      left:50%;
      transform:translateX(-50%);
      padding:13px 23px;
      border:1px solid rgba(255,255,255,.28);
      border-radius:14px;
      color:#fff;
      background:
        linear-gradient(135deg,#16202b,#070a10);
      font-size:10px;
      font-weight:900;
      letter-spacing:1.5px;
      box-shadow:
        0 8px 25px rgba(0,0,0,.35),
        inset 0 1px rgba(255,255,255,.15);
    }

    #drawCard:active{
      transform:translateX(-50%) scale(.94);
    }

    #drawCard:disabled{
      opacity:.35;
    }

    #gameMessage{
      position:fixed;
      left:50%;
      top:47%;
      transform:translate(-50%,-50%) scale(.7);
      z-index:30;
      color:#fff;
      font-weight:1000;
      font-size:19px;
      letter-spacing:2px;
      text-align:center;
      opacity:0;
      pointer-events:none;
      text-shadow:0 3px 20px rgba(0,0,0,.8);
      transition:
        opacity .2s ease,
        transform .2s ease;
    }

    #gameMessage.show{
      opacity:1;
      transform:translate(-50%,-50%) scale(1);
    }

    #wildChooser{
      position:fixed;
      inset:0;
      z-index:50;
      display:none;
      align-items:center;
      justify-content:center;
      background:rgba(0,0,0,.7);
      backdrop-filter:blur(8px);
    }

    #wildChooser.show{
      display:flex;
    }

    .wildTitle{
      color:#fff;
      font-size:18px;
      font-weight:1000;
      letter-spacing:3px;
      text-align:center;
      margin-bottom:18px;
    }

    .wildColors{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:12px;
      width:240px;
    }

    .wildColors button{
      height:54px;
      border:2px solid rgba(255,255,255,.8);
      border-radius:14px;
      color:#fff;
      font-weight:1000;
      background:#111;
      box-shadow:0 8px 25px rgba(0,0,0,.35);
    }

    .wildColors button:nth-child(1){
      background:#d9163d;
    }

    .wildColors button:nth-child(2){
      background:#176ce5;
    }

    .wildColors button:nth-child(3){
      background:#12a958;
    }

    .wildColors button:nth-child(4){
      background:#dca900;
    }

    #endScreen{
      position:fixed;
      inset:0;
      z-index:100;
      display:none;
      align-items:center;
      justify-content:center;
      background:
        radial-gradient(circle,rgba(10,50,35,.75),rgba(0,0,0,.92));
      backdrop-filter:blur(10px);
    }

    #endScreen.show{
      display:flex;
    }

    .endBox{
      width:min(86vw,360px);
      padding:34px 25px;
      border-radius:25px;
      text-align:center;
      color:#fff;
      background:
        linear-gradient(
          145deg,
          rgba(21,31,28,.96),
          rgba(4,7,10,.96)
        );
      border:1px solid rgba(255,213,74,.4);
      box-shadow:
        0 20px 70px rgba(0,0,0,.65),
        0 0 35px rgba(255,213,74,.12);
    }

    #endTitle{
      font-size:34px;
      font-weight:1000;
      letter-spacing:3px;
      color:#ffd54a;
    }

    #endSub{
      margin:8px 0 25px;
      color:#aab4b0;
      font-size:10px;
      letter-spacing:4px;
    }

    .endBox button{
      display:block;
      width:100%;
      margin-top:10px;
      padding:14px;
      border-radius:13px;
      border:1px solid rgba(255,255,255,.2);
      color:#fff;
      background:#111922;
      font-weight:900;
      letter-spacing:1px;
    }

    .endBox button:first-of-type{
      background:linear-gradient(135deg,#e91d45,#a60029);
    }

    @media(max-width:600px){

      #topUI{
        top:10px;
        left:10px;
        right:10px;
      }

      .arenaLogo{
        width:54px;
        height:44px;
      }

      #turnUI{
        top:72px;
      }

      #colorUI{
        top:96px;
      }

      #cardCounter{
        bottom:125px;
      }

      #drawCard{
        bottom:25px;
        padding:12px 19px;
      }

      #unoButton{
        width:64px;
        height:64px;
        bottom:20px;
      }
    }
  `;

  document.head.appendChild(style);
}


/* =========================================================
   THREE.JS ARENA
   ========================================================= */

function createArena3D() {

  const container = document.getElementById("game3d");

  if (!container) return;

  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x02050a);

  camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(
    0,
    12.8,
    12.2
  );

  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    antialias:true,
    alpha:false,
    powerPreference:"high-performance"
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 1.5)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight,
    false
  );

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  renderer.domElement.style.touchAction = "none";

  container.appendChild(renderer.domElement);

  /* Lighting */

  scene.add(
    new THREE.HemisphereLight(
      0xd9fff0,
      0x06100b,
      1.35
    )
  );

  const keyLight = new THREE.DirectionalLight(
    0xfff3d0,
    2.4
  );

  keyLight.position.set(
    -4,
    12,
    5
  );

  keyLight.castShadow = true;

  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;

  keyLight.shadow.camera.left = -12;
  keyLight.shadow.camera.right = 12;
  keyLight.shadow.camera.top = 12;
  keyLight.shadow.camera.bottom = -12;

  scene.add(keyLight);

  const redLight = new THREE.PointLight(
    0xff1744,
    1.1,
    14
  );

  redLight.position.set(
    -6,
    3,
    0
  );

  scene.add(redLight);

  const blueLight = new THREE.PointLight(
    0x1677ff,
    .8,
    14
  );

  blueLight.position.set(
    6,
    3,
    0
  );

  scene.add(blueLight);

  /* Board */

  boardGroup = new THREE.Group();

  scene.add(boardGroup);

  createTable();

  createCenterDecoration();

  createPiles();

  /* Groups */

  playerGroup = new THREE.Group();
  aiGroup = new THREE.Group();

  scene.add(playerGroup);
  scene.add(aiGroup);

  raycaster = new THREE.Raycaster();

  setupPointer();

  window.addEventListener(
    "resize",
    resize3D,
    {passive:true}
  );

  animate3D();
}


/* =========================================================
   TABLE
   ========================================================= */

function createTable() {

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(
      7.2,
      7.2,
      .55,
      96
    ),
    new THREE.MeshStandardMaterial({
      color:0x073b26,
      roughness:.28,
      metalness:.28
    })
  );

  table.position.y = -.32;

  table.receiveShadow = true;

  boardGroup.add(table);

  /* Outer gold rim */

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(
      7.05,
      .12,
      18,
      128
    ),
    new THREE.MeshStandardMaterial({
      color:0xffc400,
      metalness:.85,
      roughness:.2
    })
  );

  rim.rotation.x = Math.PI / 2;
  rim.position.y = -.01;

  rim.castShadow = true;

  boardGroup.add(rim);

  /* Inner rim */

  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(
      5.9,
      .035,
      12,
      128
    ),
    new THREE.MeshBasicMaterial({
      color:0x1a7c52
    })
  );

  inner.rotation.x = Math.PI / 2;
  inner.position.y = .015;

  boardGroup.add(inner);

  /* Floor shadow/base */

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(
      7.35,
      7.45,
      .25,
      96
    ),
    new THREE.MeshStandardMaterial({
      color:0x030609,
      roughness:.8
    })
  );

  base.position.y = -.68;

  base.receiveShadow = true;

  boardGroup.add(base);
}


/* =========================================================
   CENTER DECORATION
   ========================================================= */

function createCenterDecoration() {

  const center = new THREE.Mesh(
    new THREE.CylinderGeometry(
      3.05,
      3.05,
      .07,
      80
    ),
    new THREE.MeshStandardMaterial({
      color:0x06291b,
      roughness:.42,
      metalness:.18
    })
  );

  center.position.y = .02;

  center.receiveShadow = true;

  boardGroup.add(center);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
      2.7,
      .035,
      12,
      96
    ),
    new THREE.MeshBasicMaterial({
      color:0x257f58
    })
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.y = .07;

  boardGroup.add(ring);

  /* Decorative small lights */

  for (let i = 0; i < 16; i++) {

    const a = (Math.PI * 2 / 16) * i;

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(
        .035,
        8,
        8
      ),
      new THREE.MeshBasicMaterial({
        color:0xffc400
      })
    );

    dot.position.set(
      Math.cos(a) * 2.78,
      .11,
      Math.sin(a) * 2.78
    );

    boardGroup.add(dot);
  }
}


/* =========================================================
   GAME SETUP
   ========================================================= */

function setupGame() {

  playerHand = [];
  aiHand = [];
  deck = [];
  discardPile = [];

  currentTurn = "PLAYER";

  currentColor = null;

  selectedCard = null;
  selectedCardIndex = -1;

  playerNeedsUNO = false;
  playerCalledUNO = false;

  createDeck();

  shuffle(deck);

  dealInitialCards();

  startFirstDiscard();

  renderHands(true);

  renderDiscard();

  updateUI();

  setupButtons();

  showMessage("YOUR TURN", 900);
}


/* =========================================================
   CREATE FULL DECK
   ========================================================= */

function createDeck() {

  deck = [];

  for (const color of COLOR_NAMES) {

    /* Zero */

    deck.push({
      color,
      value:"0",
      type:"number"
    });

    /* 1 - 9 twice */

    for (let n = 1; n <= 9; n++) {

      deck.push({
        color,
        value:String(n),
        type:"number"
      });

      deck.push({
        color,
        value:String(n),
        type:"number"
      });
    }

    /* Action cards */

    for (let i = 0; i < 2; i++) {

      deck.push({
        color,
        value:"SKIP",
        type:"skip"
      });

      deck.push({
        color,
        value:"REVERSE",
        type:"reverse"
      });

      deck.push({
        color,
        value:"+2",
        type:"draw2"
      });
    }
  }

  /* Wild cards */

  for (let i = 0; i < 4; i++) {

    deck.push({
      color:null,
      value:"WILD",
      type:"wild"
    });

    deck.push({
      color:null,
      value:"+4",
      type:"wild4"
    });
  }
}


/* =========================================================
   DEAL
   ========================================================= */

function dealInitialCards() {

  for (let i = 0; i < 7; i++) {

    playerHand.push(drawFromDeck());

    aiHand.push(drawFromDeck());
  }
}


/* =========================================================
   FIRST DISCARD
   ========================================================= */

function startFirstDiscard() {

  let first = drawFromDeck();

  /* Avoid starting with +4 */

  while (
    first &&
    (
      first.type === "wild4" ||
      first.type === "wild"
    )
  ) {

    deck.unshift(first);

    shuffle(deck);

    first = drawFromDeck();
  }

  discardPile.push(first);

  currentColor = first.color;
}


/* =========================================================
   DRAW FROM DECK
   ========================================================= */

function drawFromDeck() {

  if (deck.length === 0) {

    refillDeck();

  }

  return deck.pop();
}


/* =========================================================
   REFILL DECK
   ========================================================= 
function drawFromDeck() {

  if (deck.length === 0) {
    refillDeck();
  }

  return deck.pop();
}


/* =========================================================
   REFILL DECK
   ========================================================= */

function refillDeck() {

  if (discardPile.length <= 1) {
    return;
  }

  const topCard =
    discardPile[discardPile.length - 1];

  const oldCards =
    discardPile.slice(0, -1);

  deck = oldCards.map(card => ({
    color: card.color,
    value: card.value,
    type: card.type
  }));

  discardPile = [topCard];

  shuffle(deck);

  showMessage(
    "DECK SHUFFLED",
    700
  );
}


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffle(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    const temp = array[i];

    array[i] = array[j];

    array[j] = temp;
  }

  return array;
}


/* =========================================================
   CAN PLAY CARD
   ========================================================= */

function canPlay(card) {

  if (!card) {
    return false;
  }

  const topCard =
    discardPile[
      discardPile.length - 1
    ];

  if (!topCard) {
    return true;
  }

  /* Wild cards can always be played */

  if (
    card.type === "wild" ||
    card.type === "wild4"
  ) {
    return true;
  }

  /* Same colour */

  if (
    card.color === currentColor
  ) {
    return true;
  }

  /* Same number/action */

  if (
    card.value === topCard.value
  ) {
    return true;
  }

  return false;
}


/* =========================================================
   RENDER PLAYER + AI HAND
   ========================================================= */

function renderHands(initial = false) {

  if (!playerGroup || !aiGroup) {
    return;
  }

  clearGroup(playerGroup);
  clearGroup(aiGroup);

  /* ---------------- PLAYER ---------------- */

  const playerCount =
    playerHand.length;

  const playerSpread =
    Math.min(
      1.08,
      7.4 /
      Math.max(
        playerCount,
        1
      )
    );

  for (
    let i = 0;
    i < playerCount;
    i++
  ) {

    const card =
      playerHand[i];

    const center =
      (playerCount - 1) / 2;

    const x =
      (i - center) *
      playerSpread;

    const mesh =
      createCardMesh(
        card,
        true
      );

    mesh.position.set(
      x,
      .18,
      4.25
    );

    mesh.rotation.y =
      (i - center) *
      -0.035;

    mesh.userData.cardIndex =
      i;

    mesh.userData.playerCard =
      true;

    playerGroup.add(mesh);
  }


  /* ---------------- AI ---------------- */

  const aiCount =
    aiHand.length;

  const aiSpread =
    Math.min(
      1.05,
      7.2 /
      Math.max(
        aiCount,
        1
      )
    );

  for (
    let i = 0;
    i < aiCount;
    i++
  ) {

    const center =
      (aiCount - 1) / 2;

    const x =
      (i - center) *
      aiSpread;

    const mesh =
      createCardBackMesh();

    mesh.position.set(
      x,
      .18,
      -4.15
    );

    mesh.rotation.y =
      (i - center) *
      0.035;

    aiGroup.add(mesh);
  }

  updateUI();
}


/* =========================================================
   CLEAR GROUP
   ========================================================= */

function clearGroup(group) {

  while (
    group.children.length > 0
  ) {

    const child =
      group.children.pop();

    disposeObject(child);
  }
}


/* =========================================================
   DISPOSE 3D OBJECT
   ========================================================= */

function disposeObject(object) {

  if (!object) {
    return;
  }

  object.traverse(child => {

    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {

      if (
        Array.isArray(
          child.material
        )
      ) {

        child.material.forEach(
          material => {

            if (material.map) {
              material.map.dispose();
            }

            material.dispose();
          }
        );

      } else {

        if (
          child.material.map
        ) {
          child.material.map.dispose();
        }

        child.material.dispose();
      }
    }
  });
}


/* =========================================================
   CREATE 3D CARD
   ========================================================= */

function createCardMesh(
  card,
  playerCard
) {

  const group =
    new THREE.Group();

  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .98,
        .13,
        1.5
      ),
      new THREE.MeshStandardMaterial({
        color:
          getCardBaseColor(card),
        roughness:.32,
        metalness:.08
      })
    );

  body.castShadow = true;
  body.receiveShadow = true;

  group.add(body);


  /* CARD FRONT */

  const frontTexture =
    createCardTexture(card);

  const front =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        .86,
        1.36
      ),
      new THREE.MeshBasicMaterial({
        map:frontTexture,
        transparent:true
      })
    );

  front.position.y =
    .071;

  front.rotation.x =
    -Math.PI / 2;

  group.add(front);


  /* CARD BACK/BOTTOM */

  const backTexture =
    createCardTexture(card);

  const back =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        .86,
        1.36
      ),
      new THREE.MeshBasicMaterial({
        map:backTexture,
        transparent:true
      })
    );

  back.position.y =
    -.071;

  back.rotation.x =
    Math.PI / 2;

  group.add(back);


  /* SELECTION RING */

  const ring =
    new THREE.Mesh(
      new THREE.TorusGeometry(
        .52,
        .025,
        8,
        40
      ),
      new THREE.MeshBasicMaterial({
        color:0xffd54a,
        transparent:true,
        opacity:0
      })
    );

  ring.rotation.x =
    Math.PI / 2;

  ring.position.y =
    .09;

  ring.name =
    "selectionRing";

  group.add(ring);


  /* GALAXY LIGHT */

  if (
    cardStyle === "GALAXY" ||
    cardStyle.includes("GALAXY")
  ) {

    const glow =
      new THREE.PointLight(
        getCardBaseColor(card),
        .08,
        2
      );

    glow.position.y =
      .35;

    group.add(glow);
  }

  group.userData.card =
    card;

  group.userData.playerCard =
    playerCard;

  return group;
}


/* =========================================================
   CREATE AI CARD BACK
   ========================================================= */

function createCardBackMesh() {

  const group =
    new THREE.Group();

  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .98,
        .13,
        1.5
      ),
      new THREE.MeshStandardMaterial({
        color:0x111827,
        roughness:.3,
        metalness:.12
      })
    );

  body.castShadow = true;
  body.receiveShadow = true;

  group.add(body);


  const texture =
    createBackTexture();

  const face =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        .86,
        1.36
      ),
      new THREE.MeshBasicMaterial({
        map:texture
      })
    );

  face.position.y =
    .071;

  face.rotation.x =
    -Math.PI / 2;

  group.add(face);


  return group;
}


/* =========================================================
   CARD BASE COLOR
   ========================================================= */

function getCardBaseColor(card) {

  if (!card) {
    return 0x151a24;
  }

  if (!card.color) {
    return 0x171b28;
  }

  return (
    COLORS[card.color] ||
    0x171b28
  );
}


/* =========================================================
   CARD TEXTURE
   ========================================================= */

function createCardTexture(card) {

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = 256;
  canvas.height = 380;

  const ctx =
    canvas.getContext(
      "2d"
    );

  const isGalaxy =
    String(cardStyle)
      .toUpperCase()
      .includes("GALAXY");

  /* ---------------- GALAXY ---------------- */

  if (isGalaxy) {

    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        256,
        380
      );

    gradient.addColorStop(
      0,
      galaxyColor(card)
    );

    gradient.addColorStop(
      .5,
      "#101936"
    );

    gradient.addColorStop(
      1,
      "#03040d"
    );

    ctx.fillStyle =
      gradient;

    roundRect(
      ctx,
      6,
      6,
      244,
      368,
      30
    );

    ctx.fill();


    /* Stars */

    for (
      let i = 0;
      i < 70;
      i++
    ) {

      const x =
        Math.random() * 256;

      const y =
        Math.random() * 380;

      const r =
        Math.random() * 1.8 +
        .3;

      ctx.globalAlpha =
        Math.random() * .7 +
        .3;

      ctx.fillStyle =
        i % 5 === 0
          ? "#ffd54a"
          : "#ffffff";

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        r,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    ctx.globalAlpha = 1;


    /* Galaxy ring */

    ctx.strokeStyle =
      "rgba(255,255,255,.18)";

    ctx.lineWidth = 18;

    ctx.beginPath();

    ctx.arc(
      125,
      190,
      95,
      -.8,
      2.3
    );

    ctx.stroke();

  }

  /* ---------------- NORMAL ---------------- */

  else {

    ctx.fillStyle =
      getNormalCSSColor(
        card
      );

    roundRect(
      ctx,
      6,
      6,
      244,
      368,
      30
    );

    ctx.fill();


    /* White inner oval */

    ctx.fillStyle =
      "rgba(255,255,255,.96)";

    ctx.beginPath();

    ctx.ellipse(
      128,
      190,
      75,
      150,
      -.35,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  /* ---------------- CARD VALUE ---------------- */

  const value =
    card.value;

  let fontSize = 78;

  if (
    value.length >= 5
  ) {
    fontSize = 32;

  } else if (
    value.length >= 3
  ) {
    fontSize = 45;
  }

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.font =
    `900 ${fontSize}px Arial`;

  ctx.lineWidth = 8;

  ctx.strokeStyle =
    "rgba(0,0,0,.55)";

  ctx.strokeText(
    value,
    128,
    190
  );

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    value,
    128,
    190
  );


  /* Corner number */

  ctx.font =
    "900 24px Arial";

  ctx.fillText(
    value,
    36,
    40
  );


  ctx.save();

  ctx.translate(
    220,
    340
  );

  ctx.rotate(
    Math.PI
  );

  ctx.fillText(
    value,
    0,
    0
  );

  ctx.restore();


  if (isGalaxy) {

    ctx.font =
      "900 13px Arial";

    ctx.fillStyle =
      "#ffd54a";

    ctx.fillText(
      "GALAXY",
      128,
      345
    );
  }


  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;

  texture.anisotropy =
    Math.min(
      renderer.capabilities
        .getMaxAnisotropy(),
      4
    );

  return texture;
}


/* =========================================================
   CARD BACK TEXTURE
   ========================================================= */

function createBackTexture() {

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = 256;
  canvas.height = 380;

  const ctx =
    canvas.getContext(
      "2d"
    );

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      256,
      380
    );

  gradient.addColorStop(
    0,
    "#e31743"
  );

  gradient.addColorStop(
    .5,
    "#4a0b20"
  );

  gradient.addColorStop(
    1,
    "#090c14"
  );

  ctx.fillStyle =
    gradient;

  roundRect(
    ctx,
    6,
    6,
    244,
    368,
    30
  );

  ctx.fill();


  ctx.strokeStyle =
    "#ffffff";

  ctx.lineWidth = 6;

  roundRect(
    ctx,
    20,
    20,
    216,
    340,
    24
  );

  ctx.stroke();


  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "italic 900 42px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    "ARENA",
    128,
    190
  );


  for (
    let i = 0;
    i < 25;
    i++
  ) {

    ctx.fillStyle =
      "rgba(255,213,74,.6)";

    ctx.beginPath();

    ctx.arc(
      Math.random() * 256,
      Math.random() * 380,
      Math.random() * 2 + .4,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;

  return texture;
}


/* =========================================================
   TEXTURE HELPERS
   ========================================================= */

function roundRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {

  ctx.beginPath();

  ctx.moveTo(
    x + radius,
    y
  );

  ctx.arcTo(
    x + width,
    y,
    x + width,
    y + height,
    radius
  );

  ctx.arcTo(
    x + width,
    y + height,
    x,
    y + height,
    radius
  );

  ctx.arcTo(
    x,
    y + height,
    x,
    y,
    radius
  );

  ctx.arcTo(
    x,
    y,
    x + width,
    y,
    radius
  );

  ctx.closePath();
}


function getNormalCSSColor(card) {

  if (!card || !card.color) {
    return "#202632";
  }

  return (
    COLOR_HEX[card.color] ||
    "#202632"
  );
}


function galaxyColor(card) {

  if (!card || !card.color) {
    return "#7b1cff";
  }

  if (card.color === "RED") {
    return "#b90d51";
  }

  if (card.color === "BLUE") {
    return "#1454c4";
  }

  if (card.color === "GREEN") {
    return "#087c5b";
  }

  if (card.color === "YELLOW") {
    return "#a97100";
  }

  return "#7b1cff";
       }
/* =========================================================
   PILE / CARD OBJECT HELPERS
   ========================================================= */

function createCardObject(card, x, z, rotation = 0) {

  const group = new THREE.Group();

  group.position.set(x, 0.18, z);
  group.rotation.y = rotation;

  const mesh = createCardMesh(card);

  group.add(mesh);

  group.userData.card = card;

  scene.add(group);

  return group;
}


/* =========================================================
   CENTER DISCARD PILE
   ========================================================= */

function renderDiscardPile() {

  if (!discardGroup) {

    discardGroup = new THREE.Group();

    scene.add(discardGroup);

  }

  clearGroup(discardGroup);

  if (!discardPile.length) return;

  const start =
    Math.max(0, discardPile.length - 3);

  for (
    let i = start;
    i < discardPile.length;
    i++
  ) {

    const card = discardPile[i];

    const mesh =
      createCardMesh(card);

    mesh.position.set(
      (i - start) * 0.04,
      0.16 + (i - start) * 0.025,
      0
    );

    mesh.rotation.y =
      (i - start) * 0.035;

    discardGroup.add(mesh);

  }

}


/* =========================================================
   DECK VISUAL
   ========================================================= */

function renderDeck() {

  if (!deckGroup) {

    deckGroup = new THREE.Group();

    scene.add(deckGroup);

  }

  clearGroup(deckGroup);

  const visibleCards =
    Math.min(deck.length, 6);

  for (let i = 0; i < visibleCards; i++) {

    const card =
      createCardBackMesh();

    card.position.set(
      0,
      0.16 + i * 0.035,
      0.05
    );

    card.rotation.y =
      (i % 2 === 0 ? 1 : -1) * 0.02;

    deckGroup.add(card);

  }

}


/* =========================================================
   PLAYER HAND
   ========================================================= */

function renderPlayerHand() {

  if (!playerGroup) {

    playerGroup =
      new THREE.Group();

    scene.add(playerGroup);

  }

  clearGroup(playerGroup);

  const count =
    playerHand.length;

  if (!count) return;

  const spacing =
    count <= 7 ? 1.18 :
    count <= 9 ? 1.02 :
    count <= 11 ? 0.86 :
    0.74;

  const center =
    (count - 1) / 2;

  playerHand.forEach(
    (card, i) => {

      const mesh =
        createCardMesh(card);

      const x =
        (i - center) * spacing;

      const distance =
        Math.abs(i - center);

      const y =
        0.16 +
        Math.max(
          0,
          0.22 - distance * 0.025
        );

      const z =
        4.55 +
        distance * 0.055;

      mesh.position.set(
        x,
        y,
        z
      );

      mesh.rotation.y =
        (i - center) * -0.025;

      mesh.userData.handIndex = i;
      mesh.userData.card = card;

      playerGroup.add(mesh);

    }
  );

}


/* =========================================================
   AI HAND
   ========================================================= */

function renderAIHand() {

  if (!aiGroup) {

    aiGroup =
      new THREE.Group();

    scene.add(aiGroup);

  }

  clearGroup(aiGroup);

  const count =
    aiHand.length;

  if (!count) return;

  const spacing =
    count <= 7 ? 1.18 :
    count <= 9 ? 1.02 :
    0.85;

  const center =
    (count - 1) / 2;

  aiHand.forEach(
    (card, i) => {

      const mesh =
        createCardBackMesh();

      mesh.position.set(
        (i - center) * spacing,
        0.17,
        -4.45
      );

      mesh.rotation.y =
        (i - center) * 0.025;

      aiGroup.add(mesh);

    }
  );

}


/* =========================================================
   FULL BOARD RENDER
   ========================================================= */

function renderBoard() {

  renderPlayerHand();

  renderAIHand();

  renderDiscardPile();

  renderDeck();

  updateGameUI();

}


/* =========================================================
   CARD CLICK
   ========================================================= */

function setupCardInteraction() {

  renderer.domElement.addEventListener(
    "pointerdown",
    onBoardPointerDown
  );

}


function onBoardPointerDown(event) {

  if (gameOver) return;

  if (currentTurn !== "PLAYER") return;

  const rect =
    renderer.domElement.getBoundingClientRect();

  mouse.x =
    ((event.clientX - rect.left) /
      rect.width) * 2 - 1;

  mouse.y =
    -((event.clientY - rect.top) /
      rect.height) * 2 + 1;

  raycaster.setFromCamera(
    mouse,
    camera
  );

  const objects =
    raycaster.intersectObjects(
      playerGroup.children,
      true
    );

  if (!objects.length) return;

  let object =
    objects[0].object;

  while (
    object &&
    object.parent !== playerGroup
  ) {

    object =
      object.parent;

  }

  if (!object) return;

  const index =
    object.userData.handIndex;

  if (
    index === undefined ||
    !playerHand[index]
  ) return;

  playPlayerCard(index);

}


/* =========================================================
   PLAYER PLAY
   ========================================================= */

function playPlayerCard(index) {

  if (currentTurn !== "PLAYER") return;

  const card =
    playerHand[index];

  if (!card) return;

  if (!canPlay(card)) {

    showMessage(
      "CARD CANNOT BE PLAYED"
    );

    shakeCamera();

    return;

  }

  playerHand.splice(index, 1);

  discardPile.push(card);

  if (
    card.color === "WILD"
  ) {

    openColorSelector(card);

    return;

  }

  currentColor =
    card.color;

  afterPlayerCard(card);

}


/* =========================================================
   AFTER PLAYER CARD
   ========================================================= */

function afterPlayerCard(card) {

  animatePlayedCard();

  renderBoard();

  if (
    playerHand.length === 0
  ) {

    finishGame("PLAYER");

    return;

  }

  if (
    playerHand.length === 1
  ) {

    unoRequired = true;

    showMessage(
      "UNO! PRESS THE UNO BUTTON!"
    );

    startUnoTimer();

    return;

  }

  nextTurn();

}


/* =========================================================
   UNO TIMER
   ========================================================= */

function startUnoTimer() {

  clearTimeout(unoTimer);

  unoCalled = false;

  const button =
    document.getElementById(
      "unoButton"
    );

  if (button) {

    button.disabled = false;

    button.classList.add(
      "unoReady"
    );

  }

  unoTimer =
    setTimeout(() => {

      if (
        unoRequired &&
        !unoCalled
      ) {

        applyUnoPenalty();

      }

    }, 3000);

}


/* =========================================================
   UNO BUTTON
   ========================================================= */

function callUNO() {

  if (!unoRequired) {

    showMessage(
      "UNO IS AVAILABLE WHEN YOU HAVE 1 CARD"
    );

    return;

  }

  if (unoCalled) return;

  unoCalled = true;

  unoRequired = false;

  clearTimeout(unoTimer);

  const button =
    document.getElementById(
      "unoButton"
    );

  if (button) {

    button.disabled = true;

    button.classList.remove(
      "unoReady"
    );

  }

  showMessage(
    "🔥 UNO!"
  );

  pulseUNO();

  setTimeout(
    nextTurn,
    500
  );

}


/* =========================================================
   UNO PENALTY +2
   ========================================================= */

function applyUnoPenalty() {

  unoRequired = false;

  const button =
    document.getElementById(
      "unoButton"
    );

  if (button) {

    button.disabled = true;

    button.classList.remove(
      "unoReady"
    );

  }

  drawCardsForPlayer(2);

  showMessage(
    "UNO MISS! +2 CARDS"
  );

  shakeCamera();

  renderBoard();

  setTimeout(
    nextTurn,
    700
  );

}


/* =========================================================
   DRAW BUTTON
   ========================================================= */

function playerDrawCard() {

  if (gameOver) return;

  if (currentTurn !== "PLAYER") {

    showMessage(
      "WAIT FOR YOUR TURN"
    );

    return;

  }

  if (unoRequired) {

    applyUnoPenalty();

    return;

  }

  const card =
    drawFromDeck();

  if (!card) {

    showMessage(
      "DECK EMPTY"
    );

    return;

  }

  playerHand.push(card);

  animateDraw();

  renderBoard();

  showMessage(
    "CARD DRAWN"
  );

  setTimeout(() => {

    const playable =
      canPlay(card);

    if (playable) {

      showMessage(
        "YOU CAN PLAY THE NEW CARD"
      );

    } else {

      nextTurn();

    }

  }, 500);

}


/* =========================================================
   DRAW CARDS
   ========================================================= */

function drawCardsForPlayer(amount) {

  for (
    let i = 0;
    i < amount;
    i++
  ) {

    const card =
      drawFromDeck();

    if (card) {

      playerHand.push(card);

    }

  }

}


/* =========================================================
   NEXT TURN
   ========================================================= */

function nextTurn() {

  if (gameOver) return;

  if (unoRequired) {

    if (!unoCalled) {

      applyUnoPenalty();

      return;

    }

  }

  currentTurn =
    currentTurn === "PLAYER"
      ? "AI"
      : "PLAYER";

  updateGameUI();

  if (
    currentTurn === "AI"
  ) {

    setTimeout(
      aiTurn,
      900
    );

  }

}


/* =========================================================
   AI TURN
   ========================================================= */

function aiTurn() {

  if (gameOver) return;

  if (currentTurn !== "AI") return;

  showMessage(
    "ARSH IS THINKING..."
  );

  const playable = [];

  aiHand.forEach(
    (card, index) => {

      if (
        canPlay(card)
      ) {

        playable.push({
          card,
          index
        });

      }

    }
  );

  setTimeout(() => {

    if (!playable.length) {

      const card =
        drawFromDeck();

      if (card) {

        aiHand.push(card);

      }

      renderBoard();

      showMessage(
        "ARSH DREW A CARD"
      );

      setTimeout(
        finishAITurn,
        700
      );

      return;

    }

    const selected =
      chooseAICard(playable);

    playAICard(
      selected.index
    );

  }, 700);

}


/* =========================================================
   AI CARD CHOICE
   ========================================================= */

function chooseAICard(playable) {

  if (
    difficulty === "EASY"
  ) {

    return playable[
      Math.floor(
        Math.random() *
        playable.length
      )
    ];

  }

  if (
    difficulty === "HARD"
  ) {

    playable.sort(
      (a, b) =>
        cardPower(b.card) -
        cardPower(a.card)
    );

    return playable[0];

  }

  // PRO

  playable.sort(
    (a, b) =>
      cardPower(b.card) -
      cardPower(a.card)
  );

  return playable[0];

}


/* =========================================================
   CARD POWER
   ========================================================= */

function cardPower(card) {

  if (!card) return 0;

  if (
    card.type === "WILD4"
  ) return 100;

  if (
    card.type === "WILD"
  ) return 80;

  if (
    card.type === "DRAW2"
  ) return 70;

  if (
    card.type === "SKIP"
  ) return 60;

  if (
    card.type === "REVERSE"
  ) return 55;

  return Number(
    card.value || 0
  );

}


/* =========================================================
   AI PLAY
   ========================================================= */

function playAICard(index) {

  const card =
    aiHand[index];

  if (!card) {

    finishAITurn();

    return;

  }

  aiHand.splice(
    index,
    1
  );

  discardPile.push(card);

  if (
    card.color === "WILD"
  ) {

    currentColor =
      chooseAIColor();

  } else {

    currentColor =
      card.color;

  }

  animatePlayedCard();

  renderBoard();

  showMessage(
    "ARSH PLAYED " +
    getCardLabel(card)
  );

  if (
    aiHand.length === 0
  ) {

    finishGame("AI");

    return;

  }

  setTimeout(
    finishAITurn,
    800
  );

}


/* =========================================================
   AI COLOR
   ========================================================= */

function chooseAIColor() {

  const counts = {
    RED: 0,
    BLUE: 0,
    GREEN: 0,
    YELLOW: 0
  };

  aiHand.forEach(
    card => {

      if (
        counts[card.color] !== undefined
      ) {

        counts[card.color]++;

      }

    }
  );

  let best =
    "RED";

  Object.keys(counts)
    .forEach(color => {

      if (
        counts[color] >
        counts[best]
      ) {

        best = color;

      }

    });

  return best;

}


/* =========================================================
   AI FINISH TURN
   ========================================================= */

function finishAITurn() {

  if (gameOver) return;

  currentTurn =
    "PLAYER";

  renderBoard();

  showMessage(
    "YOUR TURN"
  );

}


/* =========================================================
   COLOR SELECTOR
   ========================================================= */

function openColorSelector(card) {

  let box =
    document.getElementById(
      "colorSelector"
    );

  if (box) {

    box.remove();

  }

  box =
    document.createElement(
      "div"
    );

  box.id =
    "colorSelector";

  box.innerHTML = `
    <div class="colorTitle">
      CHOOSE COLOR
    </div>

    <div class="colorButtons">

      <button data-color="RED">
        RED
      </button>

      <button data-color="BLUE">
        BLUE
      </button>

      <button data-color="GREEN">
        GREEN
      </button>

      <button data-color="YELLOW">
        YELLOW
      </button>

    </div>
  `;

  document.body.appendChild(box);

  box.querySelectorAll(
    "button"
  ).forEach(button => {

    button.onclick =
      () => {

        currentColor =
          button.dataset.color;

        box.remove();

        afterPlayerCard(card);

      };

  });

}


/* =========================================================
   GAME OVER
   ========================================================= */

function finishGame(winner) {

  gameOver = true;

  clearTimeout(unoTimer);

  if (
    winner === "PLAYER"
  ) {

    showMessage(
      "🏆 YOU WON!"
    );

  } else {

    showMessage(
      "ARSH WON!"
    );

  }

  setTimeout(
    showGameOver,
    1200
  );

}


/* =========================================================
   GAME OVER PANEL
   ========================================================= */

function showGameOver() {

  let panel =
    document.getElementById(
      "gameOverPanel"
    );

  if (panel) {

    panel.remove();

  }

  panel =
    document.createElement(
      "div"
    );

  panel.id =
    "gameOverPanel";

  panel.innerHTML = `
    <div class="gameOverBox">

      <div class="gameOverTitle">
        ${winnerText()}
      </div>

      <button id="restartGame">
        PLAY AGAIN
      </button>

    </div>
  `;

  document.body.appendChild(
    panel
  );

  document
    .getElementById(
      "restartGame"
    )
    .onclick = () => {

      panel.remove();

      startGame();

    };

}


function winnerText() {

  if (
    playerHand.length === 0
  ) {

    return "YOU WIN";

  }

  return "ARSH WINS";

}


/* =========================================================
   CARD LABEL
   ========================================================= */

function getCardLabel(card) {

  if (!card) return "";

  if (
    card.type === "WILD4"
  ) return "WILD +4";

  if (
    card.type === "WILD"
  ) return "WILD";

  if (
    card.type === "DRAW2"
  ) return "+2";

  if (
    card.type === "SKIP"
  ) return "SKIP";

  if (
    card.type === "REVERSE"
  ) return "REVERSE";

  return String(
    card.value
  );

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(message) {

  const el =
    document.getElementById(
      "gameMessage"
    );

  if (!el) return;

  el.textContent =
    message;

  el.classList.remove(
    "messagePop"
  );

  void el.offsetWidth;

  el.classList.add(
    "messagePop"
  );

}


/* =========================================================
   UNO BUTTON EFFECT
   ========================================================= */

function pulseUNO() {

  const button =
    document.getElementById(
      "unoButton"
    );

  if (!button) return;

  button.classList.add(
    "unoFlash"
  );

  setTimeout(
    () => button.classList.remove(
      "unoFlash"
    ),
    500
  );

}


/* =========================================================
   CAMERA SHAKE
   ========================================================= */

function shakeCamera() {

  if (!camera) return;

  const originalX =
    camera.position.x;

  const originalY =
    camera.position.y;

  const originalZ =
    camera.position.z;

  let count = 0;

  const shake =
    setInterval(() => {

      camera.position.x =
        originalX +
        (Math.random() - 0.5) *
        0.18;

      camera.position.y =
        originalY +
        (Math.random() - 0.5) *
        0.12;

      camera.position.z =
        originalZ +
        (Math.random() - 0.5) *
        0.18;

      count++;

      if (count >= 8) {

        clearInterval(shake);

        camera.position.set(
          originalX,
          originalY,
          originalZ
        );

      }

    }, 30);

}


/* =========================================================
   DRAW ANIMATION
   ========================================================= */

function animateDraw() {

  if (!deckGroup) return;

  deckGroup.position.y =
    0.25;

  setTimeout(() => {

    if (deckGroup) {

      deckGroup.position.y =
        0;

    }

  }, 250);

}


/* =========================================================
   PLAY ANIMATION
   ========================================================= */

function animatePlayedCard() {

  if (!discardGroup) return;

  discardGroup.scale.set(
    1.08,
    1.08,
    1.08
  );

  setTimeout(() => {

    if (discardGroup) {

      discardGroup.scale.set(
        1,
        1,
        1
      );

    }

  }, 220);

}


/* =========================================================
   START UNO / GAME UI
   ========================================================= */

function createGameUI() {

  let old =
    document.getElementById(
      "gameHUD"
    );

  if (old) old.remove();

  const hud =
    document.createElement(
      "div"
    );

  hud.id =
    "gameHUD";

  hud.innerHTML = `

    <div id="gameTop">

      <div class="playerInfo">
        <strong>ARSH</strong>
        <span id="aiCards">
          7 CARDS
        </span>
      </div>

      <div id="gameLogo">
        CARD ARENA
      </div>

      <div class="playerInfo right">
        <strong>YOU</strong>
        <span id="playerCards">
          7 CARDS
        </span>
      </div>

    </div>


    <div id="gameMessage">
      YOUR TURN
    </div>


    <div id="turnText">
      YOUR TURN
    </div>


    <div id="gameActions">

      <button id="drawButton">
        DRAW CARD
      </button>

      <button id="unoButton">
        UNO
      </button>

    </div>

  `;

  document.body.appendChild(
    hud
  );

  document
    .getElementById(
      "drawButton"
    )
    .onclick =
    playerDrawCard;

  document
    .getElementById(
      "unoButton"
    )
    .onclick =
    callUNO;

}


/* =========================================================
   UPDATE GAME UI
   ========================================================= */

function updateGameUI() {

  const playerCards =
    document.getElementById(
      "playerCards"
    );

  const aiCards =
    document.getElementById(
      "aiCards"
    );

  const turn =
    document.getElementById(
      "turnText"
    );

  if (playerCards) {

    playerCards.textContent =
      playerHand.length +
      " CARDS";

  }

    if (aiCards) {

    aiCards.textContent =
      aiHand.length +
      " CARDS";

  }

  if (turn) {

    if (currentTurn === "PLAYER") {

      turn.textContent =
        "YOUR TURN";

    } else {

      turn.textContent =
        "ARSH'S TURN";

    }

  }

  const message =
    document.getElementById(
      "gameMessage"
    );

  if (message && !message.textContent) {

    message.textContent =
      currentTurn === "PLAYER"
        ? "YOUR TURN"
        : "ARSH IS THINKING...";

  }

  const drawButton =
    document.getElementById(
      "drawButton"
    );

  if (drawButton) {

    drawButton.disabled =
      currentTurn !== "PLAYER" ||
      gameOver;

  }

  const unoButton =
    document.getElementById(
      "unoButton"
    );

  if (unoButton) {

    unoButton.disabled =
      !unoRequired ||
      unoCalled ||
      gameOver;

  }

}


/* =========================================================
   GAME UI STYLE
   ========================================================= */

function addGameUIStyle() {

  if (
    document.getElementById(
      "cardArenaGameStyle"
    )
  ) {

    return;

  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "cardArenaGameStyle";

  style.textContent = `

    #gameHUD{
      position:fixed;
      inset:0;
      z-index:20;
      pointer-events:none;
      font-family:Arial,sans-serif;
    }

    #gameTop{
      position:absolute;
      top:18px;
      left:18px;
      right:18px;

      display:flex;
      align-items:center;
      justify-content:space-between;

      color:white;
    }

    #gameLogo{
      padding:9px 20px;

      border:2px solid #f4c542;
      border-radius:18px;

      background:
        linear-gradient(
          135deg,
          #250b0b,
          #080808
        );

      color:#ffd54a;

      font-size:16px;
      font-weight:900;

      letter-spacing:3px;

      box-shadow:
        0 0 22px
        rgba(255,200,50,.3);
    }

    .playerInfo{
      min-width:100px;

      padding:10px 14px;

      border-radius:14px;

      background:
        rgba(0,0,0,.58);

      border:1px solid
        rgba(255,255,255,.12);

      backdrop-filter:blur(8px);
    }

    .playerInfo.right{
      text-align:right;
    }

    .playerInfo strong{
      display:block;
      font-size:13px;
      letter-spacing:2px;
    }

    .playerInfo span{
      display:block;
      margin-top:3px;
      color:#aaa;
      font-size:9px;
      letter-spacing:1px;
    }

    #gameMessage{
      position:absolute;

      top:82px;
      left:50%;

      transform:
        translateX(-50%);

      color:#ffd54a;

      font-size:12px;
      font-weight:900;

      letter-spacing:3px;

      text-shadow:
        0 0 18px
        rgba(255,210,70,.8);

      white-space:nowrap;
    }

    #turnText{
      position:absolute;

      bottom:102px;
      left:50%;

      transform:
        translateX(-50%);

      color:white;

      font-size:11px;
      font-weight:900;

      letter-spacing:4px;
    }

    #gameActions{
      position:absolute;

      bottom:22px;
      left:50%;

      transform:
        translateX(-50%);

      display:flex;
      gap:12px;

      pointer-events:auto;
    }

    #gameActions button{

      min-width:120px;

      padding:13px 20px;

      border:0;
      border-radius:14px;

      color:white;

      font-size:11px;
      font-weight:900;

      letter-spacing:1.5px;

      cursor:pointer;

      transition:
        transform .15s,
        filter .15s,
        box-shadow .15s;

      background:
        linear-gradient(
          135deg,
          #151515,
          #333
        );

      border:
        1px solid
        rgba(255,255,255,.18);

      box-shadow:
        0 8px 25px
        rgba(0,0,0,.45);
    }

    #gameActions button:active{
      transform:scale(.95);
    }

    #gameActions button:disabled{
      opacity:.35;
      cursor:not-allowed;
    }

    #unoButton{

      background:
        linear-gradient(
          135deg,
          #ff1744,
          #a90029
        ) !important;

      border:
        1px solid
        rgba(255,255,255,.4)
        !important;
    }

    #unoButton.unoReady{

      animation:
        unoPulse .7s infinite alternate;

    }

    @keyframes unoPulse{

      from{
        transform:scale(1);

        box-shadow:
          0 0 15px
          rgba(255,20,70,.4);
      }

      to{
        transform:scale(1.08);

        box-shadow:
          0 0 35px
          rgba(255,20,70,.95);
      }

    }

    #colorSelector{

      position:fixed;
      inset:0;

      z-index:100;

      display:flex;
      flex-direction:column;

      align-items:center;
      justify-content:center;

      gap:20px;

      background:
        rgba(0,0,0,.72);

      backdrop-filter:
        blur(12px);

      pointer-events:auto;
    }

    .colorTitle{

      color:white;

      font-size:20px;
      font-weight:900;

      letter-spacing:5px;
    }

    .colorButtons{

      display:grid;

      grid-template-columns:
        repeat(2,130px);

      gap:12px;
    }

    .colorButtons button{

      padding:18px 10px;

      border:0;
      border-radius:15px;

      color:white;

      font-size:11px;
      font-weight:900;

      letter-spacing:2px;

      cursor:pointer;

      box-shadow:
        0 10px 25px
        rgba(0,0,0,.4);
    }

    .colorButtons button:nth-child(1){
      background:#d41445;
    }

    .colorButtons button:nth-child(2){
      background:#1768dc;
    }

    .colorButtons button:nth-child(3){
      background:#07935f;
    }

    .colorButtons button:nth-child(4){
      background:#d49d00;
    }

    #gameOverPanel{

      position:fixed;
      inset:0;

      z-index:150;

      display:flex;
      align-items:center;
      justify-content:center;

      background:
        rgba(0,0,0,.65);

      backdrop-filter:
        blur(12px);

      pointer-events:auto;
    }

    .gameOverBox{

      width:min(330px,85vw);

      padding:32px;

      border-radius:24px;

      text-align:center;

      background:
        linear-gradient(
          145deg,
          #101612,
          #050806
        );

      border:
        1px solid
        rgba(255,215,80,.35);

      box-shadow:
        0 20px 60px
        rgba(0,0,0,.7);
    }

    .gameOverTitle{

      color:#ffd54a;

      font-size:27px;
      font-weight:900;

      letter-spacing:4px;

      margin-bottom:25px;
    }

    #restartGame{

      width:100%;

      padding:15px;

      border:0;
      border-radius:14px;

      background:
        linear-gradient(
          135deg,
          #d41445,
          #8c0626
        );

      color:white;

      font-weight:900;

      letter-spacing:2px;

      cursor:pointer;
    }

  `;

  document.head.appendChild(
    style
  );

}
/* =========================================================
   CREATE GAME HUD
   ========================================================= */

function createGameUI() {

  let oldHUD =
    document.getElementById("gameHUD");

  if (oldHUD) {
    oldHUD.remove();
  }

  const hud =
    document.createElement("div");

  hud.id = "gameHUD";

  hud.innerHTML = `

    <div id="gameTop">

      <div class="playerInfo">
        <strong>ARSH</strong>
        <span id="aiCards">7 CARDS</span>
      </div>

      <div id="gameLogo">
        CARD ARENA
      </div>

      <div class="playerInfo right">
        <strong>YOU</strong>
        <span id="playerCards">7 CARDS</span>
      </div>

    </div>

    <div id="gameMessage">
      YOUR TURN
    </div>

    <div id="turnText">
      YOUR TURN
    </div>

    <div id="gameActions">

      <button
        id="drawButton"
        type="button">
        DRAW CARD
      </button>

      <button
        id="unoButton"
        type="button"
        disabled>
        UNO
      </button>

    </div>

  `;

  document.body.appendChild(hud);


  /* DRAW */

  const drawButton =
    document.getElementById(
      "drawButton"
    );

  if (drawButton) {

    drawButton.onclick =
      function () {

        playerDrawCard();

      };

  }


  /* UNO */

  const unoButton =
    document.getElementById(
      "unoButton"
    );

  if (unoButton) {

    unoButton.onclick =
      function () {

        callUNO();

      };

  }

}


/* =========================================================
   GAME UI INITIALIZATION
   ========================================================= */

function ensureGameUI() {

  addGameUIStyle();

  createGameUI();

}


/* =========================================================
   KEYBOARD CONTROLS
   ========================================================= */

function setupKeyboardControls() {

  window.addEventListener(
    "keydown",
    function(event) {

      if (gameOver) return;

      const key =
        event.key.toLowerCase();


      if (key === "u") {

        callUNO();

      }


      if (key === "d") {

        playerDrawCard();

      }

    }
  );

}


/* =========================================================
   BOARD POINTER CONTROLS
   ========================================================= */

function setupPointerControls() {

  if (!renderer) return;

  renderer.domElement.addEventListener(
    "pointerdown",
    onBoardPointerDown
  );

}


/* =========================================================
   RESPONSIVE
   ========================================================= */

function setupResize() {

  window.addEventListener(
    "resize",
    resize3D
  );

}


/* =========================================================
   FINAL GAME INITIALIZATION
   ========================================================= */

function beginPlayableGame() {

  ensureGameUI();

  setupPointerControls();

  setupKeyboardControls();

  setupResize();

  renderBoard();

  updateGameUI();

  showMessage(
    "YOUR TURN"
  );

}


/* =========================================================
   START GAME CONNECTION
   ========================================================= */

function startGame() {

  /* Remove old game screen if any */

  const oldGame =
    document.getElementById(
      "gameRoot"
    );

  if (oldGame) {

    oldGame.remove();

  }


  /* Read selected options */

  try {

    if (
      typeof window.gameMode !==
      "undefined"
    ) {

      gameMode =
        window.gameMode;

    }

    if (
      typeof window.cardStyle !==
      "undefined"
    ) {

      cardStyle =
        window.cardStyle;

    }

    if (
      typeof window.difficulty !==
      "undefined"
    ) {

      difficulty =
        window.difficulty;

    }

  } catch (error) {

    console.log(
      "Game settings loaded with defaults."
    );

  }


  /* Normalize */

  gameMode =
    String(
      gameMode || "OFFLINE"
    ).toUpperCase();

  cardStyle =
    String(
      cardStyle || "NORMAL"
    ).toUpperCase();

  difficulty =
    String(
      difficulty || "PRO"
    ).toUpperCase();


  /* Reset */

  gameOver = false;

  currentTurn = "PLAYER";

  currentColor = null;

  unoRequired = false;

  unoCalled = false;

  clearTimeout(unoTimer);


  /* Create game scene */

  createArena3D();


  /* Create fresh deck */

  createDeck();

  shuffle(deck);


  /* Deal cards */

  playerHand = [];

  aiHand = [];

  discardPile = [];


  for (let i = 0; i < 7; i++) {

    playerHand.push(
      drawFromDeck()
    );

    aiHand.push(
      drawFromDeck()
    );

  }


  /* First discard */

  let firstCard =
    drawFromDeck();


  while (
    firstCard &&
    (
      firstCard.type === "WILD4"
    )
  ) {

    deck.unshift(firstCard);

    shuffle(deck);

    firstCard =
      drawFromDeck();

  }


  if (firstCard) {

    discardPile.push(
      firstCard
    );

    currentColor =
      firstCard.color;

  }


  /* UI */

  beginPlayableGame();

}


/* =========================================================
   START ANIMATION LOOP
   ========================================================= */

function startRenderLoop() {

  if (animationStarted) {
    return;
  }

  animationStarted = true;

  animate3D();

}


/* =========================================================
   SAFETY CHECK
   ========================================================= */

function gameSafetyCheck() {

  if (!scene) return;

  if (!camera) return;

  if (!renderer) return;

  if (
    !document.body.contains(
      renderer.domElement
    )
  ) {

    return;

  }

}


/* =========================================================
   GAME START FLAG
   ========================================================= */

let animationStarted = false;


/* =========================================================
   AUTO START LOOP AFTER FUNCTIONS LOAD
   ========================================================= */

if (
  typeof window !== "undefined"
) {

  window.addEventListener(
    "load",
    function() {

      /* 
         Do NOT start the game here.
         Existing index.html menu
         controls the actual start.
      */

      console.log(
        "CARD ARENA GAME ENGINE READY"
      );

    }
  );

}
/* =========================================================
   FINAL 3D ARENA CONNECTION
   ========================================================= */

function createArena3D() {

  /* ---------- OLD CANVAS CLEANUP ---------- */

  const oldCanvas =
    document.querySelector(
      "#game3d canvas"
    );

  if (oldCanvas) {
    oldCanvas.remove();
  }


  /* ---------- CONTAINER ---------- */

  let container =
    document.getElementById(
      "game3d"
    );

  if (!container) {

    container =
      document.createElement(
        "div"
      );

    container.id =
      "game3d";

    document.body.appendChild(
      container
    );

  }


  container.innerHTML = "";


  /* ---------- SCENE ---------- */

  scene =
    new THREE.Scene();

  scene.background =
    new THREE.Color(
      0x020605
    );


  /* ---------- CAMERA ---------- */

  camera =
    new THREE.PerspectiveCamera(
      43,
      innerWidth / innerHeight,
      0.1,
      100
    );

  camera.position.set(
    0,
    10.8,
    11.8
  );

  camera.lookAt(
    0,
    0,
    0
  );


  /* ---------- RENDERER ---------- */

  renderer =
    new THREE.WebGLRenderer({
      antialias:true,
      alpha:false
    });

  renderer.setSize(
    innerWidth,
    innerHeight
  );

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      1.8
    )
  );

  renderer.shadowMap.enabled =
    true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  container.appendChild(
    renderer.domElement
  );


  /* =======================================================
     LIGHTING
     ======================================================= */

  const ambient =
    new THREE.AmbientLight(
      0xffffff,
      1.15
    );

  scene.add(
    ambient
  );


  const goldLight =
    new THREE.PointLight(
      0xffd34e,
      3.2,
      35
    );

  goldLight.position.set(
    0,
    7,
    1
  );

  goldLight.castShadow =
    true;

  scene.add(
    goldLight
  );


  const redLight =
    new THREE.PointLight(
      0xff1744,
      1.8,
      24
    );

  redLight.position.set(
    -5,
    3,
    2
  );

  scene.add(
    redLight
  );


  const blueLight =
    new THREE.PointLight(
      0x1677ff,
      1.4,
      24
    );

  blueLight.position.set(
    5,
    3,
    -2
  );

  scene.add(
    blueLight
  );


  /* =======================================================
     FLOOR
     ======================================================= */

  const floor =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        8.3,
        8.3,
        0.45,
        64
      ),

      new THREE.MeshStandardMaterial({
        color:0x06150f,
        roughness:0.32,
        metalness:0.35
      })

    );

  floor.position.y =
    -0.45;

  floor.receiveShadow =
    true;

  scene.add(
    floor
  );


  /* =======================================================
     GOLD TABLE BORDER
     ======================================================= */

  const outerRing =
    new THREE.Mesh(

      new THREE.TorusGeometry(
        7.25,
        0.14,
        20,
        120
      ),

      new THREE.MeshStandardMaterial({
        color:0xffc928,
        metalness:0.95,
        roughness:0.16
      })

    );

  outerRing.rotation.x =
    Math.PI / 2;

  outerRing.position.y =
    -0.02;

  scene.add(
    outerRing
  );


  /* =======================================================
     INNER TABLE
     ======================================================= */

  const table =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        7.05,
        7.05,
        0.18,
        64
      ),

      new THREE.MeshStandardMaterial({
        color:0x08331f,
        roughness:0.38,
        metalness:0.25
      })

    );

  table.position.y =
    -0.15;

  table.receiveShadow =
    true;

  scene.add(
    table
  );


  /* =======================================================
     CENTER ARENA
     ======================================================= */

  const center =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        3.15,
        3.15,
        0.08,
        64
      ),

      new THREE.MeshStandardMaterial({
        color:0x062417,
        roughness:0.35,
        metalness:0.15
      })

    );

  center.position.y =
    -0.01;

  scene.add(
    center
  );


  /* =======================================================
     CENTER GOLD RING
     ======================================================= */

  const centerRing =
    new THREE.Mesh(

      new THREE.TorusGeometry(
        3.05,
        0.055,
        12,
        100
      ),

      new THREE.MeshStandardMaterial({
        color:0xffd54a,
        metalness:0.9,
        roughness:0.2
      })

    );

  centerRing.rotation.x =
    Math.PI / 2;

  centerRing.position.y =
    0.05;

  scene.add(
    centerRing
  );


  /* =======================================================
     DECORATIVE CENTER GLOW
     ======================================================= */

  const centerLight =
    new THREE.PointLight(
      0xffd54a,
      0.8,
      9
    );

  centerLight.position.set(
    0,
    1.2,
    0
  );

  scene.add(
    centerLight
  );


  /* =======================================================
     GAME GROUPS
     ======================================================= */

  deckGroup =
    new THREE.Group();

  discardGroup =
    new THREE.Group();

  playerGroup =
    new THREE.Group();

  aiGroup =
    new THREE.Group();


  scene.add(
    deckGroup
  );

  scene.add(
    discardGroup
  );

  scene.add(
    playerGroup
  );

  scene.add(
    aiGroup
  );


  /* =======================================================
     DECK POSITION
     ======================================================= */

  deckGroup.position.set(
    -1.15,
    0,
    0
  );


  /* =======================================================
     DISCARD POSITION
     ======================================================= */

  discardGroup.position.set(
    1.15,
    0,
    0
  );


  /* =======================================================
     PLAYER HAND POSITION
     ======================================================= */

  playerGroup.position.set(
    0,
    0,
    0
  );


  /* =======================================================
     AI HAND POSITION
     ======================================================= */

  aiGroup.position.set(
    0,
    0,
    0
  );


  /* =======================================================
     START RENDER LOOP
     ======================================================= */

  startRenderLoop();

}


/* =========================================================
   FINAL RESIZE
   ========================================================= */

function resize3D() {

  if (
    !camera ||
    !renderer
  ) {

    return;

  }

  camera.aspect =
    innerWidth /
    innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    innerWidth,
    innerHeight
  );

}


/* =========================================================
   STABLE CAMERA ANIMATION
   ========================================================= */

function animate3D() {

  requestAnimationFrame(
    animate3D
  );


  if (
    !renderer ||
    !scene ||
    !camera
  ) {

    return;

  }


  /* Very small cinematic movement */

  const time =
    performance.now() *
    0.00025;

  camera.position.x =
    Math.sin(time) *
    0.16;

  camera.position.z =
    11.8 +
    Math.cos(time) *
    0.08;

  camera.lookAt(
    0,
    0,
    0
  );


  renderer.render(
    scene,
    camera
  );

}


/* =========================================================
   TOUCH SUPPORT
   ========================================================= */

if (
  "ontouchstart" in window
) {

  document.addEventListener(
    "touchstart",
    function() {

      /*
        Pointer events already handle
        card touching on supported browsers.
      */

    },
    {
      passive:true
    }
  );

}


/* =========================================================
   ENGINE READY
   ========================================================= */

console.log(
  "CARD ARENA 3D ENGINE READY"
);
/* =========================================================
   CARD ARENA — CORE GAME DATA
   ========================================================= */

let scene = null;
let camera = null;
let renderer = null;

let deck = [];
let discardPile = [];

let playerHand = [];
let aiHand = [];

let currentTurn = "PLAYER";
let currentColor = null;

let gameOver = false;

let unoRequired = false;
let unoCalled = false;
let unoTimer = null;

let gameMode = "OFFLINE";
let cardStyle = "NORMAL";
let difficulty = "PRO";

let mouse =
  new THREE.Vector2();

let raycaster =
  new THREE.Raycaster();

let deckGroup = null;
let discardGroup = null;
let playerGroup = null;
let aiGroup = null;


/* =========================================================
   CREATE UNO-STYLE DECK
   ========================================================= */

function createDeck() {

  deck = [];

  const colors = [
    "RED",
    "BLUE",
    "GREEN",
    "YELLOW"
  ];


  colors.forEach(color => {

    /* ZERO */

    deck.push({
      color:color,
      type:"NUMBER",
      value:0
    });


    /* 1 - 9 */

    for (
      let value = 1;
      value <= 9;
      value++
    ) {

      deck.push({
        color:color,
        type:"NUMBER",
        value:value
      });

      deck.push({
        color:color,
        type:"NUMBER",
        value:value
      });

    }


    /* SKIP */

    for (let i = 0; i < 2; i++) {

      deck.push({
        color:color,
        type:"SKIP",
        value:"SKIP"
      });

    }


    /* REVERSE */

    for (let i = 0; i < 2; i++) {

      deck.push({
        color:color,
        type:"REVERSE",
        value:"REV"
      });

    }


    /* DRAW 2 */

    for (let i = 0; i < 2; i++) {

      deck.push({
        color:color,
        type:"DRAW2",
        value:"+2"
      });

    }

  });


  /* WILD */

  for (let i = 0; i < 4; i++) {

    deck.push({
      color:"WILD",
      type:"WILD",
      value:"WILD"
    });

  }


  /* WILD +4 */

  for (let i = 0; i < 4; i++) {

    deck.push({
      color:"WILD",
      type:"WILD4",
      value:"+4"
    });

  }

}


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffle(array) {

  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      array[i],
      array[j]
    ] =
    [
      array[j],
      array[i]
    ];

  }

}


/* =========================================================
   CHECK PLAYABLE CARD
   ========================================================= */

function canPlay(card) {

  if (!card) {
    return false;
  }


  if (
    card.color === "WILD"
  ) {

    return true;

  }


  if (
    !discardPile.length
  ) {

    return true;

  }


  const top =
    discardPile[
      discardPile.length - 1
    ];


  if (!top) {
    return true;
  }


  /* Same colour */

  if (
    card.color === currentColor
  ) {

    return true;

  }


  /* Same number / action */

  if (
    card.type === top.type &&
    card.type !== "NUMBER"
  ) {

    return true;

  }


  if (
    card.type === "NUMBER" &&
    top.type === "NUMBER" &&
    card.value === top.value
  ) {

    return true;

  }


  return false;

}


/* =========================================================
   DRAW FROM DECK
   ========================================================= */

function drawFromDeck() {

  if (
    deck.length === 0
  ) {

    refillDeck();

  }

  return deck.pop();

}


/* =========================================================
   REFILL DECK
   ========================================================= */

function refillDeck() {

  if (
    discardPile.length <= 1
  ) {

    return;

  }


  const top =
    discardPile.pop();


  deck =
    discardPile.splice(
      0,
      discardPile.length
    );


  shuffle(deck);


  discardPile = [
    top
  ];


  currentColor =
    top.color;

}


/* =========================================================
   GET TOP CARD
   ========================================================= */

function getTopCard() {

  if (
    !discardPile.length
  ) {

    return null;

  }

  return discardPile[
    discardPile.length - 1
  ];

}


/* =========================================================
   CLEAR THREE.JS GROUP
   ========================================================= */

function clearGroup(group) {

  if (!group) {
    return;
  }


  while (
    group.children.length
  ) {

    const object =
      group.children.pop();


    object.traverse(
      child => {

        if (
          child.geometry
        ) {

          child.geometry.dispose();

        }


        if (
          child.material
        ) {

          if (
            Array.isArray(
              child.material
            )
          ) {

            child.material.forEach(
              material => {

                if (
                  material.map
                ) {

                  material.map.dispose();

                }

                material.dispose();

              }
            );

          } else {

            if (
              child.material.map
            ) {

              child.material.map.dispose();

            }

            child.material.dispose();

          }

        }

      }
    );

  }

}


/* =========================================================
   CARD BASE COLOR
   ========================================================= */

function getCardBaseColor(card) {

  if (!card) {

    return 0xffffff;

  }


  switch (
    card.color
  ) {

    case "RED":
      return 0xd41445;

    case "BLUE":
      return 0x1768dc;

    case "GREEN":
      return 0x07935f;

    case "YELLOW":
      return 0xd4a000;

    case "WILD":
      return 0x222222;

    default:
      return 0xffffff;

  }

}


/* =========================================================
   CARD LABEL
   ========================================================= */

function getCardLabel(card) {

  if (!card) {
    return "";
  }


  if (
    card.type === "WILD4"
  ) {

    return "+4";

  }


  if (
    card.type === "WILD"
  ) {

    return "WILD";

  }


  if (
    card.type === "DRAW2"
  ) {

    return "+2";

  }


  if (
    card.type === "SKIP"
  ) {

    return "SKIP";

  }


  if (
    card.type === "REVERSE"
  ) {

    return "↻";

  }


  return String(
    card.value
  );

}


/* =========================================================
   RESET GAME
   ========================================================= */

function resetGameData() {

  deck = [];

  discardPile = [];

  playerHand = [];

  aiHand = [];

  currentTurn =
    "PLAYER";

  currentColor =
    null;

  gameOver =
    false;

  unoRequired =
    false;

  unoCalled =
    false;

  clearTimeout(
    unoTimer
  );

}


/* =========================================================
   FORCE PLAYER TURN
   ========================================================= */

function setPlayerTurn() {

  currentTurn =
    "PLAYER";

  updateGameUI();

}


/* =========================================================
   FORCE AI TURN
   ========================================================= */

function setAITurn() {

  currentTurn =
    "AI";

  updateGameUI();

}


/* =========================================================
   GAME STATUS
   ========================================================= */

function getGameStatus() {

  return {

    playerCards:
      playerHand.length,

    aiCards:
      aiHand.length,

    turn:
      currentTurn,

    color:
      currentColor,

    deck:
      deck.length

  };

}


/* =========================================================
   DEBUG
   ========================================================= */

window.CardArena =
  {

    status:
      getGameStatus,

    deck:
      () => deck,

    player:
      () => playerHand,

    ai:
      () => aiHand

  };


console.log(
  "CARD ARENA CORE READY"
);
/* =========================================================
   3D CARD CREATION
   ========================================================= */

function createCardMesh(card) {

  const group =
    new THREE.Group();


  /* CARD BODY */

  const baseColor =
    getCardBaseColor(card);

  const body =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        1.02,
        0.12,
        1.48
      ),

      new THREE.MeshStandardMaterial({

        color:baseColor,

        roughness:
          cardStyle === "GALAXY"
            ? 0.22
            : 0.3,

        metalness:
          cardStyle === "GALAXY"
            ? 0.35
            : 0.12

      })

    );


  body.castShadow =
    true;

  body.receiveShadow =
    true;

  group.add(body);


  /* FRONT FACE */

  const texture =
    createCardTexture(card);


  const front =
    new THREE.Mesh(

      new THREE.PlaneGeometry(
        0.88,
        1.34
      ),

      new THREE.MeshBasicMaterial({

        map:texture,

        transparent:true

      })

    );


  front.rotation.x =
    -Math.PI / 2;

  front.position.y =
    0.066;

  group.add(front);


  /* BACK/FACE DECORATION */

  const edge =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        0.94,
        0.025,
        1.40
      ),

      new THREE.MeshStandardMaterial({

        color:
          cardStyle === "GALAXY"
            ? 0x39127a
            : baseColor,

        metalness:
          cardStyle === "GALAXY"
            ? 0.65
            : 0.25,

        roughness:0.25

      })

    );


  edge.position.y =
    0.075;


  group.add(edge);


  /* MOVE FACE ABOVE EDGE */

  front.position.y =
    0.091;


  /* CARD DATA */

  group.userData.card =
    card;


  return group;

}


/* =========================================================
   CARD BACK
   ========================================================= */

function createCardBackMesh() {

  const group =
    new THREE.Group();


  const body =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        1.02,
        0.12,
        1.48
      ),

      new THREE.MeshStandardMaterial({

        color:
          cardStyle === "GALAXY"
            ? 0x241044
            : 0x5e071d,

        roughness:0.25,

        metalness:
          cardStyle === "GALAXY"
            ? 0.5
            : 0.2

      })

    );


  body.castShadow =
    true;

  body.receiveShadow =
    true;

  group.add(body);


  const backTexture =
    createBackTexture();


  const back =
    new THREE.Mesh(

      new THREE.PlaneGeometry(
        0.88,
        1.34
      ),

      new THREE.MeshBasicMaterial({

        map:backTexture

      })

    );


  back.rotation.x =
    -Math.PI / 2;

  back.position.y =
    0.066;


  group.add(back);


  return group;

}


/* =========================================================
   CARD FRONT TEXTURE
   ========================================================= */

function createCardTexture(card) {

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    440;

  canvas.height =
    620;


  const ctx =
    canvas.getContext(
      "2d"
    );


  const color =
    getCardCanvasColor(
      card
    );


  /* BACKGROUND */

  if (
    cardStyle === "GALAXY"
  ) {

    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        440,
        620
      );

    gradient.addColorStop(
      0,
      "#090014"
    );

    gradient.addColorStop(
      0.45,
      color
    );

    gradient.addColorStop(
      1,
      "#030006"
    );

    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      0,
      0,
      440,
      620
    );


    /* STARS */

    for (
      let i = 0;
      i < 70;
      i++
    ) {

      const x =
        Math.random() * 440;

      const y =
        Math.random() * 620;

      const size =
        Math.random() * 2.5;

      ctx.fillStyle =
        "rgba(255,255,255," +
        (
          0.25 +
          Math.random() * 0.75
        ) +
        ")";

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        size,
        0,
        Math.PI * 2
      );

      ctx.fill();

    }

  } else {

    ctx.fillStyle =
      color;

    ctx.fillRect(
      0,
      0,
      440,
      620
    );

  }


  /* INNER WHITE FRAME */

  ctx.strokeStyle =
    "rgba(255,255,255,.85)";

  ctx.lineWidth =
    10;

  ctx.roundRect(
    18,
    18,
    404,
    584,
    42
  );

  ctx.stroke();


  /* CENTER OVAL */

  ctx.save();

  ctx.translate(
    220,
    310
  );

  ctx.rotate(
    -0.12
  );

  ctx.fillStyle =
    "rgba(255,255,255,.96)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    0,
    145,
    190,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();


  /* CARD VALUE */

  const label =
    getCardLabel(
      card
    );


  ctx.save();

  ctx.translate(
    220,
    315
  );

  ctx.rotate(
    -0.12
  );


  if (
    card.color === "WILD"
  ) {

    ctx.fillStyle =
      "#151515";

  } else {

    ctx.fillStyle =
      color;

  }


  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";


  let fontSize =
    170;


  if (
    label === "SKIP" ||
    label === "WILD"
  ) {

    fontSize =
      72;

  }


  ctx.font =
    "900 " +
    fontSize +
    "px Arial";


  ctx.fillText(
    label,
    0,
    0
  );


  ctx.restore();


  /* CORNER VALUE */

  ctx.fillStyle =
    "white";

  ctx.font =
    "900 55px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";


  ctx.fillText(
    label,
    65,
    68
  );


  ctx.fillText(
    label,
    375,
    552
  );


  const texture =
    new THREE.CanvasTexture(
      canvas
    );


  texture.colorSpace =
    THREE.SRGBColorSpace;


  return texture;

}


/* =========================================================
   CARD BACK TEXTURE
   ========================================================= */

function createBackTexture() {

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    440;

  canvas.height =
    620;


  const ctx =
    canvas.getContext(
      "2d"
    );


  if (
    cardStyle === "GALAXY"
  ) {

    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        440,
        620
      );

    gradient.addColorStop(
      0,
      "#05000d"
    );

    gradient.addColorStop(
      .5,
      "#5313a5"
    );

    gradient.addColorStop(
      1,
      "#090014"
    );

    ctx.fillStyle =
      gradient;

  } else {

    ctx.fillStyle =
      "#700020";

  }


  ctx.fillRect(
    0,
    0,
    440,
    620
  );


  /* BORDER */

  ctx.strokeStyle =
    "#ffd54a";

  ctx.lineWidth =
    12;

  ctx.roundRect(
    20,
    20,
    400,
    580,
    42
  );

  ctx.stroke();


  /* CENTER LOGO */

  ctx.save();

  ctx.translate(
    220,
    310
  );

  ctx.rotate(
    -0.12
  );


  ctx.fillStyle =
    "rgba(255,255,255,.96)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    0,
    140,
    175,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.fillStyle =
    "#161616";

  ctx.font =
    "900 58px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    "CARD",
    0,
    -28
  );

  ctx.fillText(
    "ARENA",
    0,
    38
  );


  ctx.restore();


  const texture =
    new THREE.CanvasTexture(
      canvas
    );


  texture.colorSpace =
    THREE.SRGBColorSpace;


  return texture;

}


/* =========================================================
   CANVAS CARD COLORS
   ========================================================= */

function getCardCanvasColor(card) {

  if (!card) {

    return "#333333";

  }


  switch (
    card.color
  ) {

    case "RED":
      return "#d41445";

    case "BLUE":
      return "#1768dc";

    case "GREEN":
      return "#07935f";

    case "YELLOW":
      return "#d29b00";

    case "WILD":
      return galaxyColor(card);

    default:
      return "#333333";

  }

}


/* =========================================================
   GALAXY COLOR
   ========================================================= */

function galaxyColor(card) {

  if (
    !card ||
    !card.color
  ) {

    return "#7b1cff";

  }


  switch (
    card.color
  ) {

    case "RED":
      return "#b90d51";

    case "BLUE":
      return "#1454c4";

    case "GREEN":
      return "#087c5b";

    case "YELLOW":
      return "#a97100";

    case "WILD":
      return "#7b1cff";

    default:
      return "#7b1cff";

  }

}


/* =========================================================
   CARD ARENA READY
   ========================================================= */

console.log(
  "CARD TEXTURE SYSTEM READY"
);
