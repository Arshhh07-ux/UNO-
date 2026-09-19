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
