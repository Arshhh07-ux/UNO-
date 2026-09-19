// ===============================
// ARSH 3D UNO BOARD
// ===============================

let scene, camera, renderer, animationId;

function startGame() {

  // Old page hatao aur direct 3D game kholo
  document.body.innerHTML = `
    <div id="uno3d"></div>

    <div id="gameInfo">
      <b>ARSH UNO ARENA</b>
      <span>YOU VS PRO AI</span>
    </div>

    <button id="drawBtn">DRAW CARD</button>
  `;

  create3DBoard();
}


// ===============================
// CREATE 3D BOARD
// ===============================

function create3DBoard() {

  const container = document.getElementById("uno3d");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030505);

  // CAMERA
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.set(0, 11, 12);
  camera.lookAt(0, 0, 0);


  // RENDERER
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  container.appendChild(renderer.domElement);


  // LIGHTS
  const ambient = new THREE.AmbientLight(
    0xffffff,
    1.4
  );

  scene.add(ambient);

  const light = new THREE.PointLight(
    0xffffff,
    2,
    50
  );

  light.position.set(0, 10, 5);

  scene.add(light);


  // ===============================
  // FLOOR
  // ===============================

  const floorGeometry =
    new THREE.CylinderGeometry(
      8,
      8,
      0.5,
      64
    );

  const floorMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x07120d,
      metalness: 0.5,
      roughness: 0.35
    });

  const floor =
    new THREE.Mesh(
      floorGeometry,
      floorMaterial
    );

  floor.position.y = -0.5;

  scene.add(floor);


  // ===============================
  // TABLE
  // ===============================

  const tableGeometry =
    new THREE.CylinderGeometry(
      6.8,
      6.8,
      0.6,
      64
    );

  const tableMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x123d29,
      metalness: 0.35,
      roughness: 0.3
    });

  const table =
    new THREE.Mesh(
      tableGeometry,
      tableMaterial
    );

  table.position.y = 0;

  scene.add(table);


  // GOLD TABLE BORDER
  const borderGeometry =
    new THREE.TorusGeometry(
      6.5,
      0.12,
      16,
      100
    );

  const goldMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xffc400,
      metalness: 0.8,
      roughness: 0.2
    });

  const border =
    new THREE.Mesh(
      borderGeometry,
      goldMaterial
    );

  border.rotation.x =
    Math.PI / 2;

  border.position.y = 0.34;

  scene.add(border);


  // ===============================
  // CENTER CIRCLE
  // ===============================

  const centerGeometry =
    new THREE.CylinderGeometry(
      2.7,
      2.7,
      0.08,
      64
    );

  const centerMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x092619,
      metalness: 0.2,
      roughness: 0.4
    });

  const center =
    new THREE.Mesh(
      centerGeometry,
      centerMaterial
    );

  center.position.y = 0.35;

  scene.add(center);


  // ===============================
  // UNO STYLE LOGO
  // ===============================

  const logoCanvas =
    document.createElement("canvas");

  logoCanvas.width = 512;
  logoCanvas.height = 256;

  const ctx =
    logoCanvas.getContext("2d");

  ctx.clearRect(
    0,
    0,
    512,
    256
  );

  ctx.fillStyle = "#ff1744";

  ctx.beginPath();

  ctx.ellipse(
    256,
    128,
    210,
    90,
    -0.12,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "white";

  ctx.font =
    "bold 115px Arial";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    "UNO",
    256,
    128
  );

  const logoTexture =
    new THREE.CanvasTexture(
      logoCanvas
    );

  const logoMaterial =
    new THREE.SpriteMaterial({
      map: logoTexture,
      transparent: true
    });

  const logo =
    new THREE.Sprite(
      logoMaterial
    );

  logo.scale.set(
    4,
    2,
    1
  );

  logo.position.set(
    0,
    0.55,
    0
  );

  scene.add(logo);


  // ===============================
  // CENTER CARDS
  // ===============================

  createCard(
    -0.8,
    0.6,
    0,
    "#ff1744",
    "7"
  );

  createCard(
    0.8,
    0.65,
    0.2,
    "#1976ff",
    "2"
  );


  // ===============================
  // PLAYER CARDS
  // ===============================

  const colors = [
    "#ff1744",
    "#1976ff",
    "#20c96b",
    "#ffd600",
    "#9c27b0",
    "#ff6d00",
    "#00bcd4"
  ];

  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const x =
      (i - 3) * 1.25;

    createCard(
      x,
      0.65,
      5.1,
      colors[i],
      String(i + 1),
      true
    );
  }


  // ===============================
  // AI CARDS
  // ===============================

  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const x =
      (i - 3) * 1.25;

    createBackCard(
      x,
      0.65,
      -5.2
    );
  }


  // ===============================
  // DRAW BUTTON
  // ===============================

  document
    .getElementById("drawBtn")
    .onclick = function () {

      createCard(
        Math.random() * 5 - 2.5,
        0.75,
        Math.random() * 2 - 1,
        colors[
          Math.floor(
            Math.random() *
            colors.length
          )
        ],
        String(
          Math.floor(
            Math.random() * 9
          ) + 1
        ),
        true
      );

    };


  // RESIZE
  window.addEventListener(
    "resize",
    resizeGame
  );


  animate();
}


// ===============================
// FRONT CARD
// ===============================

function createCard(
  x,
  y,
  z,
  color,
  number,
  clickable = false
) {

  const geometry =
    new THREE.BoxGeometry(
      1,
      0.12,
      1.55
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.3
    });

  const card =
    new THREE.Mesh(
      geometry,
      material
    );

  card.position.set(
    x,
    y,
    z
  );

  card.rotation.y =
    Math.random() * 0.12 - 0.06;

  scene.add(card);


  // CARD FACE
  const canvas =
    document.createElement("canvas");

  canvas.width = 256;
  canvas.height = 384;

  const ctx =
    canvas.getContext("2d");

  ctx.fillStyle =
    color;

  ctx.roundRect(
    8,
    8,
    240,
    368,
    28
  );

  ctx.fill();


  // WHITE OVAL
  ctx.fillStyle =
    "rgba(255,255,255,.9)";

  ctx.beginPath();

  ctx.ellipse(
    128,
    192,
    75,
    145,
    -0.35,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // NUMBER
  ctx.fillStyle =
    color;

  ctx.font =
    "bold 110px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    number,
    128,
    192
  );


  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  const faceMaterial =
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.25
    });

  const face =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        0.94,
        1.48
      ),
      faceMaterial
    );

  face.rotation.x =
    -Math.PI / 2;

  face.position.y =
    0.07;

  card.add(face);


  if (clickable) {

    card.userData.originalY =
      y;

    card.userData.selected =
      false;

    card.userData.clickable =
      true;

    card.addEventListener = undefined;
  }

  return card;
}


// ===============================
// BACK CARD
// ===============================

function createBackCard(
  x,
  y,
  z
) {

  const geometry =
    new THREE.BoxGeometry(
      1,
      0.12,
      1.55
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0xff1744,
      metalness: 0.15,
      roughness: 0.3
    });

  const card =
    new THREE.Mesh(
      geometry,
      material
    );

  card.position.set(
    x,
    y,
    z
  );

  card.rotation.y =
    Math.PI;

  scene.add(card);

  return card;
}


// ===============================
// ANIMATION
// ===============================

function animate() {

  animationId =
    requestAnimationFrame(
      animate
    );

  // Slow cinematic camera movement
  const time =
    Date.now() * 0.00025;

  camera.position.x =
    Math.sin(time) * 0.8;

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


// ===============================
// RESIZE
// ===============================

function resizeGame() {

  if (!camera || !renderer)
    return;

  camera.aspect =
    window.innerWidth /
    window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
}


// ===============================
// START GAME BUTTON SUPPORT
// ===============================

window.startGame =
  startGame;
