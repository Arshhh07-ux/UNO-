/* =========================================================
   CARD ARENA — GAME.JS
   PART 1 — MENU / SCREEN SYSTEM
========================================================= */

"use strict";

/* =========================================================
   GLOBAL GAME SETTINGS
========================================================= */

let gameMode = "OFFLINE";
let cardStyle = "RED";
let difficulty = "PRO";

let roomCode = "";


/* =========================================================
   SCREEN SYSTEM
========================================================= */

function show(id){

  const screens =
    document.querySelectorAll(".screen");

  screens.forEach(screen => {
    screen.classList.add("hidden");
    screen.classList.remove("fadeIn");
  });

  const target =
    document.getElementById(id);

  if(!target){
    console.warn("Screen not found:", id);
    return;
  }

  target.classList.remove("hidden");

  void target.offsetWidth;

  target.classList.add("fadeIn");
}


/* =========================================================
   OPTION SELECTOR
========================================================= */

function selectOption(button){

  if(!button) return;

  const parent =
    button.parentElement;

  if(parent){

    parent
      .querySelectorAll(".option")
      .forEach(option => {

        option.classList.remove("selected");

        const check =
          option.querySelector(".check");

        if(check){
          check.textContent = "";
        }

      });

  }

  button.classList.add("selected");

  const check =
    button.querySelector(".check");

  if(check){
    check.textContent = "✓";
  }

}


/* =========================================================
   DIFFICULTY
========================================================= */

function difficultySet(button){

  if(!button) return;

  const parent =
    button.parentElement;

  if(parent){

    parent
      .querySelectorAll("button")
      .forEach(btn => {

        btn.classList.remove("active");

      });

  }

  button.classList.add("active");

  difficulty =
    button.textContent
      .trim()
      .toUpperCase();

}


/* =========================================================
   CARD STYLE SCREEN
========================================================= */

function openStyles(mode){

  gameMode = mode || "OFFLINE";

  const modeText =
    document.getElementById("styleMode");

  if(modeText){

    modeText.textContent =
      gameMode === "ONLINE"
        ? "ONLINE CARD COLLECTION"
        : "SELECT YOUR CARD COLLECTION";

  }

  show("styles");

}


/* =========================================================
   ROOM CODE
========================================================= */

function generateRoom(){

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for(let i=0;i<6;i++){

    code +=
      chars[
        Math.floor(
          Math.random() * chars.length
        )
      ];

  }

  roomCode = code;

  const el =
    document.getElementById("roomCode");

  if(el){

    el.textContent = roomCode;

  }

  toastMessage(
    "ROOM CREATED • " + roomCode
  );

}


/* =========================================================
   JOIN ROOM
========================================================= */

function joinRoom(){

  const input =
    document.getElementById("joinCode");

  if(!input) return;

  const code =
    input.value
      .trim()
      .toUpperCase();

  if(code.length < 4){

    toastMessage(
      "ENTER A VALID ROOM CODE"
    );

    input.focus();

    return;

  }

  roomCode = code;

  toastMessage(
    "ROOM " + code + " JOINED"
  );

  setTimeout(() => {

    openStyles("ONLINE");

  },700);

}


/* =========================================================
   SIMPLE TOAST
========================================================= */

function toastMessage(message){

  let toast =
    document.getElementById("arenaToast");

  if(!toast){

    toast =
      document.createElement("div");

    toast.id =
      "arenaToast";

    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.bottom = "35px";

    toast.style.transform =
      "translateX(-50%)";

    toast.style.padding =
      "13px 20px";

    toast.style.borderRadius =
      "14px";

    toast.style.background =
      "rgba(20,20,20,.95)";

    toast.style.border =
      "1px solid rgba(255,255,255,.15)";

    toast.style.color =
      "white";

    toast.style.fontSize =
      "12px";

    toast.style.fontWeight =
      "900";

    toast.style.letterSpacing =
      "1px";

    toast.style.zIndex =
      "99999";

    toast.style.opacity =
      "0";

    toast.style.transition =
      ".25s ease";

    document.body.appendChild(toast);

  }

  toast.textContent =
    message;

  toast.style.opacity = "1";

  clearTimeout(
    toastMessage.timer
  );

  toastMessage.timer =
    setTimeout(() => {

      toast.style.opacity = "0";

    },1800);

}


/* =========================================================
   CARD STYLE SELECTION
========================================================= */

document.addEventListener(
  "click",
  function(event){

    const card =
      event.target.closest(".cardStyle");

    if(!card) return;

    document
      .querySelectorAll(".cardStyle")
      .forEach(item => {

        item.classList.remove("selected");

      });

    card.classList.add("selected");

    const name =
      card.querySelector(".styleName");

    if(name){

      cardStyle =
        name.textContent
          .trim()
          .toUpperCase();

    }

    toastMessage(
      "CARD STYLE SELECTED"
    );

  }
);


/* =========================================================
   INTRO
========================================================= */

function startArenaIntro(){

  const intro =
    document.getElementById("intro");

  const menu =
    document.getElementById("menu");

  if(!intro || !menu) return;

  show("intro");

}


/* =========================================================
   SAFE START
========================================================= */

window.addEventListener(
  "load",
  () => {

    /*
      We intentionally DO NOT start
      the 3D game here.

      The player must first go:

      INTRO
        ↓
      MENU
        ↓
      OFFLINE
        ↓
      CARD STYLE
        ↓
      GAME
    */

    console.log(
      "CARD ARENA ENGINE READY"
    );

  }
);


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.show = show;
window.selectOption = selectOption;
window.difficultySet = difficultySet;
window.openStyles = openStyles;
window.generateRoom = generateRoom;
window.joinRoom = joinRoom;


/* =========================================================
   PART 1 END
========================================================= */
