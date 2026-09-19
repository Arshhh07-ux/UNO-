/* =========================================================
   CARD ARENA — 3D GAME ENGINE
========================================================= */

let arena3D = null;

function startGame(){

  // Hide everything
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.add("hidden");
  });

  // Remove old game if it exists
  const old = document.getElementById("game3d");
  if(old) old.remove();

  // Game container
  const game = document.createElement("div");

  game.id = "game3d";

  game.style.cssText = `
    position:fixed;
    inset:0;
    z-index:9999;
    overflow:hidden;
    background:#03100b;
  `;

  document.body.appendChild(game);

  create3DArena(game);
}


/* =========================================================
   CREATE ARENA
========================================================= */

function create3DArena(container){

  if(typeof THREE === "undefined"){

    alert("3D engine could not load. Check your internet connection.");
    return;

  }

  const scene =
    new THREE.Scene();

  scene.background =
    new THREE.Color(0x03100b);


  /* CAMERA */

  const camera =
    new THREE.PerspectiveCamera(
      55,
      innerWidth / innerHeight,
      .1,
      100
    );

  camera.position.set(
    0,
    9,
    11
  );

  camera.lookAt(
    0,
    0,
    0
  );


  /* RENDERER */

  const renderer =
    new THREE.WebGLRenderer({
      antialias:true,
      alpha:false
    });

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );

  renderer.setSize(
    innerWidth,
    innerHeight
  );

  renderer.shadowMap.enabled = true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  container.appendChild(
    renderer.domElement
  );


  /* =====================================================
     LIGHTING
  ===================================================== */

  const ambient =
    new THREE.HemisphereLight(
      0xffffff,
      0x06120c,
      2.2
    );

  scene.add(ambient);


  const keyLight =
    new THREE.DirectionalLight(
      0xffffff,
      4
    );

  keyLight.position.set(
    3,
    10,
    4
  );

  keyLight.castShadow = true;

  keyLight.shadow.mapSize.width =
    2048;

  keyLight.shadow.mapSize.height =
    2048;

  scene.add(keyLight);


  const redLight =
    new THREE.PointLight(
      0xff1744,
      25,
      18
    );

  redLight.position.set(
    -7,
    4,
    -3
  );

  scene.add(redLight);


  const goldLight =
    new THREE.PointLight(
      0xffc107,
      20,
      15
    );

  goldLight.position.set(
    6,
    3,
    2
  );

  scene.add(goldLight);


  /* =====================================================
     FLOOR
  ===================================================== */

  const floorGeometry =
    new THREE.PlaneGeometry(
      40,
      40
    );

  const floorMaterial =
    new THREE.MeshStandardMaterial({
      color:0x020504,
      roughness:.8,
      metalness:.15
    });

  const floor =
    new THREE.Mesh(
      floorGeometry,
      floorMaterial
    );

  floor.rotation.x =
    -Math.PI / 2;

  floor.receiveShadow = true;

  scene.add(floor);


  /* =====================================================
     MAIN TABLE
  ===================================================== */

  const tableShape =
    new THREE.Shape();

  const width = 9;
  const depth = 6;
  const radius = .8;

  tableShape.moveTo(
    -width + radius,
    -depth
  );

  tableShape.lineTo(
    width - radius,
    -depth
  );

  tableShape.quadraticCurveTo(
    width,
    -depth,
    width,
    -depth + radius
  );

  tableShape.lineTo(
    width,
    depth - radius
  );

  tableShape.quadraticCurveTo(
    width,
    depth,
    width - radius,
    depth
  );

  tableShape.lineTo(
    -width + radius,
    depth
  );

  tableShape.quadraticCurveTo(
    -width,
    depth,
    -width,
    depth - radius
  );

  tableShape.lineTo(
    -width,
    -depth + radius
  );

  tableShape.quadraticCurveTo(
    -width,
    -depth,
    -width + radius,
    -depth
  );


  const tableGeometry =
    new THREE.ExtrudeGeometry(
      tableShape,
      {
        depth:.55,
        bevelEnabled:true,
        bevelSegments:4,
        bevelSize:.18,
        bevelThickness:.18
      }
    );


  const tableMaterial =
    new THREE.MeshStandardMaterial({
      color:0x0b3b27,
      roughness:.32,
      metalness:.25
    });


  const table =
    new THREE.Mesh(
      tableGeometry,
      tableMaterial
    );

  table.rotation.x =
    -Math.PI / 2;

  table.position.y =
    .45;

  table.castShadow = true;

  table.receiveShadow = true;

  scene.add(table);


  /* =====================================================
     TABLE GOLD BORDER
  ===================================================== */

  const borderGeometry =
    new THREE.BoxGeometry(
      17.5,
      .08,
      .08
    );

  const borderMaterial =
    new THREE.MeshStandardMaterial({
      color:0xffc107,
      metalness:.9,
      roughness:.18,
      emissive:0x4d3300
    });


  const border1 =
    new THREE.Mesh(
      borderGeometry,
      borderMaterial
    );

  border1.position.set(
    0,
    1.15,
    6
  );

  scene.add(border1);


  const border2 =
    border1.clone();

  border2.position.z =
    -6;

  scene.add(border2);


  /* =====================================================
     CENTER DISC
  ===================================================== */

  const discGeometry =
    new THREE.CylinderGeometry(
      2.1,
      2.1,
      .08,
      64
    );

  const discMaterial =
    new THREE.MeshStandardMaterial({
      color:0x082d1e,
      metalness:.4,
      roughness:.25,
      emissive:0x03150d
    });

  const disc =
    new THREE.Mesh(
      discGeometry,
      discMaterial
    );

  disc.position.y =
    1.12;

  scene.add(disc);


  /* =====================================================
     CENTER UNO LOGO
  ===================================================== */

  const logo =
    createTextSprite(
      "UNO",
      "#ff1744",
      120
    );

  logo.scale.set(
    2.2,
    1.1,
    1
  );

  logo.position.set(
    0,
    1.22,
    0
  );

  logo.rotation.x =
    -Math.PI / 2;

  scene.add(logo);


  /* =====================================================
     DRAW DECK
  ===================================================== */

  for(let i = 0; i < 8; i++){

    const card =
      createCard(
        "UNO",
        "#ff1744"
      );

    card.position.set(
      -5.5,
      1.25 + i * .025,
      0
    );

    card.rotation.y =
      -Math.PI / 2;

    scene.add(card);

  }


  /* =====================================================
     CENTER CARD
  ===================================================== */

  const centerCard =
    createCard(
      "7",
      "#e91e43"
    );

  centerCard.position.set(
    0,
    1.35,
    0
  );

  centerCard.rotation.x =
    -.02;

  centerCard.rotation.y =
    -.15;

  scene.add(centerCard);


  /* =====================================================
     PLAYER HAND
  ===================================================== */

  const playerCards = [];

  const colors = [
    "#e91e43",
    "#2196ff",
    "#16b978",
    "#ffb300",
    "#9c27b0",
    "#e91e43",
    "#2196ff"
  ];


  for(let i = 0; i < 7; i++){

    const card =
      createCard(
        String(i + 1),
        colors[i]
      );

    const x =
      (i - 3) * 1.25;

    const z =
      4.25 -
      Math.abs(i - 3) * .13;

    card.position.set(
      x,
      1.35,
      z
    );

    card.rotation.x =
      -.15;

    card.rotation.y =
      (i - 3) * -.035;

    card.userData.index = i;

    scene.add(card);

    playerCards.push(card);

  }


  /* =====================================================
     OPPONENT
  ===================================================== */

  for(let i = 0; i < 7; i++){

    const card =
      createCard(
        "",
        "#a90029",
        true
      );

    card.position.set(
      (i - 3) * .85,
      1.32,
      -4.15
    );

    card.rotation.x =
      Math.PI + .15;

    card.rotation.y =
      (i - 3) * .03;

    scene.add(card);

  }


  /* =====================================================
     PLAYER NAME
  ===================================================== */

  const playerName =
    createTextSprite(
      "ARSH",
      "#ffd54a",
      80
    );

  playerName.scale.set(
    1.2,
    .55,
    1
  );

  playerName.position.set(
    0,
    1.2,
    5.3
  );

  playerName.rotation.x =
    -Math.PI / 2;

  scene.add(playerName);


  /* =====================================================
     OPPONENT NAME
  ===================================================== */

  const opponentName =
    createTextSprite(
      "ARSH PRO AI",
      "#ffffff",
      70
    );

  opponentName.scale.set(
    1.5,
    .7,
    1
  );

  opponentName.position.set(
    0,
    1.2,
    -5.2
  );

  opponentName.rotation.x =
    -Math.PI / 2;

  scene.add(opponentName);


  /* =====================================================
     UI
  ===================================================== */

  createGameUI(container);


  /* =====================================================
     MOUSE / TOUCH
  ===================================================== */

  const raycaster =
    new THREE.Raycaster();

  const pointer =
    new THREE.Vector2();

  let hovered = null;


  function movePointer(event){

    const rect =
      renderer.domElement.getBoundingClientRect();

    const x =
      event.clientX ??
      event.touches?.[0]?.clientX ??
      0;

    const y =
      event.clientY ??
      event.touches?.[0]?.clientY ??
      0;


    pointer.x =
      ((x - rect.left) / rect.width) * 2 - 1;

    pointer.y =
      -((y - rect.top) / rect.height) * 2 + 1;


    raycaster.setFromCamera(
      pointer,
      camera
    );


    const hits =
      raycaster.intersectObjects(
        playerCards,
        true
      );


    if(hits.length){

      const card =
        hits[0].object;

      if(hovered !== card){

        if(hovered)
          hovered.scale.setScalar(1);

        hovered = card;

        hovered.scale.setScalar(1.08);

      }

    }
    else{

      if(hovered){

        hovered.scale.setScalar(1);
        hovered = null;

      }

    }

  }


  renderer.domElement.addEventListener(
    "pointermove",
    movePointer
  );


  renderer.domElement.addEventListener(
    "pointerdown",
    movePointer
  );


  /* =====================================================
     RESIZE
  ===================================================== */

  window.addEventListener(
    "resize",
    () => {

      camera.aspect =
        innerWidth / innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        innerWidth,
        innerHeight
      );

    }
  );


  /* =====================================================
     ANIMATION
  ===================================================== */

  const clock =
    new THREE.Clock();


  function animate(){

    requestAnimationFrame(
      animate
    );


    const t =
      clock.getElapsedTime();


    centerCard.position.y =
      1.35 +
      Math.sin(t * 2) * .025;

    centerCard.rotation.z =
      Math.sin(t) * .01;


    goldLight.intensity =
      18 +
      Math.sin(t * 2) * 4;


    renderer.render(
      scene,
      camera
    );

  }


  animate();


  arena3D = {
    scene,
    camera,
    renderer
  };

}


/* =========================================================
   CARD CREATOR
========================================================= */

function createCard(
  text,
  color,
  back = false
){

  const group =
    new THREE.Group();


  const geometry =
    new THREE.BoxGeometry(
      1.05,
      .12,
      1.55
    );


  const material =
    new THREE.MeshStandardMaterial({
      color:
        new THREE.Color(color),
      metalness:.25,
      roughness:.25
    });


  const card =
    new THREE.Mesh(
      geometry,
      material
    );


  card.castShadow = true;
  card.receiveShadow = true;


  group.add(card);


  const logo =
    createTextSprite(
      back ? "UNO" : text,
      back ? "#ffffff" : "#ffffff",
      back ? 70 : 90
    );


  logo.scale.set(
    .7,
    1,
    1
  );


  logo.position.y =
    .08;


  logo.rotation.x =
    Math.PI / 2;


  group.add(logo);


  return group;

}


/* =========================================================
   TEXT SPRITE
========================================================= */

function createTextSprite(
  text,
  color,
  size
){

  const canvas =
    document.createElement("canvas");

  canvas.width =
    512;

  canvas.height =
    256;


  const ctx =
    canvas.getContext("2d");


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    color;

  ctx.font =
    `900 ${size}px Arial`;

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.shadowColor =
    "rgba(255,255,255,.4)";

  ctx.shadowBlur =
    15;


  ctx.fillText(
    text,
    256,
    128
  );


  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.needsUpdate =
    true;


  const material =
    new THREE.SpriteMaterial({
      map:texture,
      transparent:true
    });


  return new THREE.Sprite(
    material
  );

}


/* =========================================================
   GAME UI
========================================================= */

function createGameUI(container){

  const ui =
    document.createElement("div");

  ui.style.cssText = `
    position:absolute;
    inset:0;
    pointer-events:none;
    font-family:Arial,sans-serif;
  `;


  ui.innerHTML = `

    <div style="
      position:absolute;
      top:18px;
      left:20px;
      font-size:14px;
      font-weight:900;
      letter-spacing:3px;
      color:#ffd54a;
      text-shadow:0 0 15px rgba(255,193,7,.5);
    ">
      UNO ARENA
    </div>


    <div style="
      position:absolute;
      top:18px;
      right:20px;
      padding:8px 13px;
      border-radius:10px;
      background:rgba(0,0,0,.4);
      border:1px solid rgba(255,255,255,.15);
      color:#72ffb0;
      font-size:10px;
      letter-spacing:2px;
    ">
      ● ONLINE
    </div>


    <div style="
      position:absolute;
      bottom:22px;
      left:50%;
      transform:translateX(-50%);
      padding:10px 18px;
      border-radius:15px;
      background:rgba(0,0,0,.55);
      border:1px solid rgba(255,255,255,.12);
      color:#aaa;
      font-size:10px;
      letter-spacing:2px;
      white-space:nowrap;
    ">
      TAP A CARD TO PLAY
    </div>

  `;


  container.appendChild(ui);

    }
