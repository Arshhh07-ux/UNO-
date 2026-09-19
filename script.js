/* =========================================================
   UNO 3D ULTIMATE
   ARSH PRO AI
========================================================= */

const COLORS = ["red","yellow","green","blue"];

const VALUES = [
  "0","1","2","3","4","5",
  "6","7","8","9",
  "+2","Skip","Reverse"
];

let deck = [];
let hand = [];

let current = {
  color:"red",
  value:"7"
};

let deckCount = 108;
let score = 0;
let busy = false;
let direction = 1;
let arshCards = 7;


/* =========================================================
   CREATE UNO DECK
========================================================= */

function createDeck(){

  deck = [];

  COLORS.forEach(color => {

    VALUES.forEach(value => {

      deck.push({
        color:color,
        value:value
      });

    });

  });

  /* Wild cards */

  for(let i=0;i<8;i++){

    deck.push({
      color:"black",
      value:i % 2 === 0 ? "Wild" : "+4"
    });

  }

  shuffle(deck);

}


/* =========================================================
   SHUFFLE
========================================================= */

function shuffle(array){

  for(let i=array.length-1;i>0;i--){

    const j =
      Math.floor(Math.random() * (i + 1));

    [array[i],array[j]] =
      [array[j],array[i]];

  }

}


/* =========================================================
   DRAW FROM DECK
========================================================= */

function drawFromDeck(){

  if(deck.length === 0){

    createDeck();

  }

  deckCount = Math.max(0,deckCount - 1);

  updateDeckCount();

  return deck.pop();

}


/* =========================================================
   START GAME
========================================================= */

function startGame(){

  createDeck();

  hand = [];

  for(let i=0;i<7;i++){

    hand.push(drawFromDeck());

  }

  current = {
    color:"red",
    value:"7"
  };

  score = 0;
  arshCards = 7;
  direction = 1;

  updateScore();
  updateDeckCount();
  updateCurrentCard();
  updateArshCards();

  renderHand();

}


/* =========================================================
   RENDER PLAYER HAND
========================================================= */

function renderHand(){

  const box =
    document.getElementById("hand");

  if(!box) return;

  box.innerHTML = "";

  hand.forEach((card,index) => {

    const el =
      document.createElement("div");

    el.className =
      "card " + card.color;

    el.textContent =
      card.value === "Wild"
        ? "★"
        : card.value;

    const angle =
      (index - (hand.length - 1) / 2) * 2;

    el.style.transform =
      `rotate(${angle}deg)`;

    el.style.animationDelay =
      `${index * 0.05}s`;

    el.onclick =
      () => playCard(index);

    box.appendChild(el);

  });

  const count =
    document.getElementById("youCount");

  if(count){

    count.textContent =
      hand.length + " Cards";

  }

}


/* =========================================================
   CHECK PLAYABLE CARD
========================================================= */

function canPlay(card){

  return (
    card.color === "black" ||
    card.color === current.color ||
    card.value === current.value
  );

}


/* =========================================================
   PLAY CARD
========================================================= */

function playCard(index){

  if(busy) return;

  const card = hand[index];

  if(!canPlay(card)){

    toast("❌ You can't play this card!");

    shakeTable();

    return;

  }

  busy = true;

  createFlyingCard(card);

  setTimeout(() => {

    hand.splice(index,1);

    current = {
      color:card.color,
      value:card.value
    };

    addScore(card);

    updateScore();

    updateCurrentCard();

    renderHand();

    specialCardEffect(card);

    if(hand.length === 0){

      setTimeout(winGame,600);

      return;

    }

    /* Wild card */

    if(card.color === "black"){

      setTimeout(() => {

        openWildPicker();

      },400);

      return;

    }

    setTimeout(() => {

      arshTurn();

    },1000);

  },500);

}


/* =========================================================
   DRAW CARD
========================================================= */

function drawCard(){

  if(busy) return;

  busy = true;

  const card =
    drawFromDeck();

  hand.push(card);

  renderHand();

  toast("🎴 Card drawn");

  setTimeout(() => {

    busy = false;

  },400);

}


/* =========================================================
   SMART ARSH AI
========================================================= */

function arshTurn(){

  busy = true;

  setTurn("ARSH PRO TURN");

  document
    .getElementById("player1")
    ?.classList
    .remove("active");

  document
    .getElementById("player2")
    ?.classList
    .add("active");


  setTimeout(() => {

    /*
      ARSH DOES NOT PLAY RANDOMLY.

      He checks:
      1. Matching color
      2. Matching number/action
      3. Special cards
      4. Wild cards
    */

    let possible =
      deck.filter(card =>
        card.color === current.color ||
        card.value === current.value ||
        card.color === "black"
      );


    /* If no playable card, draw */

    if(possible.length === 0){

      const drawn =
        drawFromDeck();

      possible =
        canPlay(drawn)
          ? [drawn]
          : [];

      arshCards++;

      updateArshCards();

    }


    if(possible.length > 0){

      const chosen =
        chooseBestArshCard(possible);

      playArshCard(chosen);

    }

    else{

      finishArshTurn();

    }

  },850);

}


/* =========================================================
   ARSH SMART CARD SELECTION
========================================================= */

function chooseBestArshCard(possible){

  /*
    Higher score = smarter choice.
  */

  let best = possible[0];

  let bestScore = -999;

  possible.forEach(card => {

    let value = 0;


    /* Try to empty hand */

    if(arshCards <= 3){

      if(card.value === "+4")
        value += 70;

      if(card.value === "+2")
        value += 55;

      if(card.value === "Skip")
        value += 35;

      if(card.value === "Reverse")
        value += 25;

    }


    /* Attack player */

    if(card.value === "+4")
      value += 45;

    if(card.value === "+2")
      value += 35;

    if(card.value === "Skip")
      value += 20;


    /* Avoid wasting Wild */

    if(card.color === "black")
      value -= 10;


    /* Match current color */

    if(card.color === current.color)
      value += 12;


    /* Match current value */

    if(card.value === current.value)
      value += 18;


    /*
      Small randomness so Arsh
      doesn't behave exactly the same.
    */

    value += Math.random() * 8;


    if(value > bestScore){

      bestScore = value;
      best = card;

    }

  });


  return best;

}


/* =========================================================
   ARSH PLAY CARD
========================================================= */

function playArshCard(card){

  setTimeout(() => {

    createOpponentFlyingCard(card);

    setTimeout(() => {

      current = {
        color:card.color,
        value:card.value
      };

      arshCards =
        Math.max(0,arshCards - 1);

      updateArshCards();

      updateCurrentCard();

      specialCardEffect(card);

      toast(
        card.value === "+4"
          ? "💣 ARSH PLAYED +4!"
          : "🔥 ARSH PLAYED " + card.value
      );


      /* Arsh wins */

      if(arshCards <= 0){

        setTimeout(loseGame,700);

        return;

      }


      /* Wild */

      if(card.color === "black"){

        setTimeout(() => {

          arshChooseColor();

        },500);

        return;

      }


      finishArshTurn();

    },500);

  },250);

}


/* =========================================================
   ARSH CHOOSES COLOR
========================================================= */

function arshChooseColor(){

  /*
    Arsh chooses the color
    that appears most often in
    his remaining strategic hand.
  */

  const counts = {
    red:0,
    yellow:0,
    green:0,
    blue:0
  };


  deck.forEach(card => {

    if(counts[card.color] !== undefined){

      counts[card.color]++;

    }

  });


  let bestColor = "red";
  let highest = -1;


  COLORS.forEach(color => {

    if(counts[color] > highest){

      highest = counts[color];
      bestColor = color;

    }

  });


  current.color = bestColor;

  updateCurrentCard();

  toast(
    "🌈 ARSH chose " +
    bestColor.toUpperCase()
  );


  finishArshTurn();

}


/* =========================================================
   FINISH ARSH TURN
========================================================= */

function finishArshTurn(){

  setTimeout(() => {

    document
      .getElementById("player2")
      ?.classList
      .remove("active");

    document
      .getElementById("player1")
      ?.classList
      .add("active");

    setTurn("YOUR TURN");

    busy = false;

  },850);

}


/* =========================================================
   WILD COLOR PICKER
========================================================= */

function openWildPicker(){

  const picker =
    document.getElementById("wildPicker");

  if(!picker){

    /*
      If HTML doesn't have the picker,
      automatically continue.
    */

    arshTurn();

    return;

  }

  picker.classList.add("show");

}


/* =========================================================
   CHOOSE WILD COLOR
========================================================= */

function chooseWild(color){

  current.color = color;

  document
    .getElementById("wildPicker")
    ?.classList
    .remove("show");

  updateCurrentCard();

  toast(
    "🌈 Color changed to " +
    color.toUpperCase()
  );

  setTimeout(() => {

    arshTurn();

  },700);

}


/* =========================================================
   SPECIAL CARD EFFECTS
========================================================= */

function specialCardEffect(card){

  if(card.value === "+2"){

    toast("💥 +2 ATTACK!");

    shakeTable();

    flash();

  }

  else if(card.value === "+4"){

    toast("💣 +4 ATTACK!");

    shakeTable();

    flash();

    createParticles();

  }

  else if(card.value === "Skip"){

    toast("⛔ SKIP!");

    flash();

  }

  else if(card.value === "Reverse"){

    direction *= -1;

    toast("🔄 REVERSE!");

    rotateTable();

  }

}


/* =========================================================
   CURRENT CARD
========================================================= */

function updateCurrentCard(){

  const el =
    document.getElementById("currentCard");

  if(!el) return;

  el.className =
    "currentCard " + current.color;

  el.textContent =
    current.value === "Wild"
      ? "★"
      : current.value;

  el.classList.remove("played");

  void el.offsetWidth;

  el.classList.add("played");

}


/* =========================================================
   SCORE
========================================================= */

function addScore(card){

  if(card.value === "+4")
    score += 50;

  else if(card.value === "+2")
    score += 25;

  else if(card.color === "black")
    score += 40;

  else if(
    card.value === "Skip" ||
    card.value === "Reverse"
  )
    score += 20;

  else
    score += 10;

}


function updateScore(){

  const el =
    document.getElementById("score");

  if(el){

    el.textContent = score;

  }

}


/* =========================================================
   COUNTERS
========================================================= */

function updateDeckCount(){

  const el =
    document.getElementById("deckCount");

  if(el){

    el.textContent =
      deckCount + " Cards";

  }

}


function updateArshCards(){

  const player =
    document.getElementById("player2");

  if(!player) return;

  const small =
    player.querySelector("small");

  if(small){

    small.textContent =
      arshCards + " Cards";

  }

}


/* =========================================================
   TURN
========================================================= */

function setTurn(text){

  const el =
    document.getElementById("turnBox");

  if(el){

    el.textContent = text;

  }

}


/* =========================================================
   FLYING PLAYER CARD
========================================================= */

function createFlyingCard(card){

  const el =
    document.createElement("div");

  el.className =
    "flyCard " + card.color;

  el.textContent =
    card.value === "Wild"
      ? "★"
      : card.value;

  el.style.left="50%";
  el.style.top="88%";

  document.body.appendChild(el);

  requestAnimationFrame(() => {

    el.style.left="50%";
    el.style.top="47%";

    el.style.transform=
      "translate(-50%,-50%) rotate(720deg) scale(.65)";

    el.style.opacity="0";

  });

  setTimeout(() => {

    el.remove();

  },700);

}


/* =========================================================
   FLYING ARSH CARD
========================================================= */

function createOpponentFlyingCard(card){

  const el =
    document.createElement("div");

  el.className =
    "flyCard " + card.color;

  el.textContent =
    card.value === "Wild"
      ? "★"
      : card.value;

  el.style.left="50%";
  el.style.top="18%";

  document.body.appendChild(el);

  requestAnimationFrame(() => {

    el.style.left="50%";
    el.style.top="47%";

    el.style.transform=
      "translate(-50%,-50%) rotate(-720deg) scale(.65)";

    el.style.opacity="0";

  });

  setTimeout(() => {

    el.remove();

  },700);

}


/* =========================================================
   TABLE SHAKE
========================================================= */

function shakeTable(){

  const table =
    document.querySelector(".table");

  if(!table) return;

  table.animate(

    [
      {
        transform:
          "translate(-50%,-50%) rotateX(57deg)"
      },

      {
        transform:
          "translate(calc(-50% - 10px),-50%) rotateX(57deg)"
      },

      {
        transform:
          "translate(calc(-50% + 10px),-50%) rotateX(57deg)"
      },

      {
        transform:
          "translate(-50%,-50%) rotateX(57deg)"
      }
    ],

    {
      duration:380,
      easing:"ease-out"
    }

  );

}


/* =========================================================
   FLASH
========================================================= */

function flash(){

  const el =
    document.createElement("div");

  el.style.position="fixed";
  el.style.inset="0";
  el.style.zIndex="800";
  el.style.background="white";
  el.style.opacity="0";

  document.body.appendChild(el);

  el.animate(

    [
      {opacity:0},
      {opacity:.28},
      {opacity:0}
    ],

    {
      duration:400
    }

  );

  setTimeout(() => {

    el.remove();

  },450);

}


/* =========================================================
   REVERSE ANIMATION
========================================================= */

function rotateTable(){

  const table =
    document.querySelector(".table");

  if(!table) return;

  table.animate(

    [
      {
        transform:
          "translate(-50%,-50%) rotateX(57deg) rotateZ(0deg)"
      },

      {
        transform:
          "translate(-50%,-50%) rotateX(57deg) rotateZ(8deg)"
      },

      {
        transform:
          "translate(-50%,-50%) rotateX(57deg) rotateZ(-8deg)"
      },

      {
        transform:
          "translate(-50%,-50%) rotateX(57deg) rotateZ(0deg)"
      }
    ],

    {
      duration:550
    }

  );

}


/* =========================================================
   PARTICLES
========================================================= */

function createParticles(){

  for(let i=0;i<40;i++){

    const p =
      document.createElement("div");

    p.style.position="fixed";
    p.style.left="50%";
    p.style.top="50%";

    p.style.width="7px";
    p.style.height="7px";

    p.style.borderRadius="50%";

    p.style.zIndex="1200";

    p.style.background =
      COLORS[
        Math.floor(Math.random()*4)
      ];

    document.body.appendChild(p);

    const angle =
      Math.random()*Math.PI*2;

    const distance =
      100 + Math.random()*300;

    p.animate(

      [
        {
          transform:
            "translate(-50%,-50%) scale(1)",
          opacity:1
        },

        {
          transform:
            `translate(
              calc(-50% + ${Math.cos(angle)*distance}px),
              calc(-50% + ${Math.sin(angle)*distance}px)
            ) scale(0)`,
          opacity:0
        }
      ],

      {
        duration:
          700 + Math.random()*700,
        easing:"cubic-bezier(.2,.8,.2,1)"
      }

    );

    setTimeout(() => {

      p.remove();

    },1500);

  }

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;

function toast(message){

  const el =
    document.getElementById("toast");

  if(!el) return;

  el.textContent = message;

  el.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(() => {

      el.classList.remove("show");

    },1400);

}


/* =========================================================
   UNO BUTTON
========================================================= */

function sayUno(){

  if(hand.length === 1){

    toast("🔥 UNO!");

    score += 25;

    updateScore();

    createParticles();

  }

  else{

    toast(
      "You need exactly 1 card!"
    );

  }

}


/* =========================================================
   WIN
========================================================= */

function winGame(){

  createParticles();

  const final =
    document.getElementById("finalScore");

  if(final){

    final.textContent = score;

  }

  document
    .getElementById("win")
    ?.classList
    .add("show");

}


/* =========================================================
   LOSE
========================================================= */

function loseGame(){

  toast("😈 ARSH WINS!");

  shakeTable();

  flash();

  setTimeout(() => {

    alert(
      "😈 ARSH PRO defeated you!"
    );

    location.reload();

  },700);

}


/* =========================================================
   START
========================================================= */

startGame();
