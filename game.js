let scene;
let camera;
let renderer;

function startGame(){

  // Existing screen ko completely replace only AFTER Enter Arena
  document.body.innerHTML = `
    <div id="game3d"></div>

    <div id="topUI">
      <div class="gameLogo">UNO</div>
      <div>
        <b>ARSH</b>
        <small>PRO PLAYER</small>
      </div>
    </div>

    <div id="turnUI">
      YOUR TURN
    </div>

    <button id="drawCard">
      DRAW CARD
    </button>
  `;

  const style = document.createElement("style");

  style.textContent = `
    #game3d{
      position:fixed;
      inset:0;
      background:#020705;
    }

    #game3d canvas{
      width:100%!important;
      height:100%!important;
      display:block;
    }

    #topUI{
      position:fixed;
      top:20px;
      left:20px;
      right:20px;
      z-index:5;
      display:flex;
      align-items:center;
      gap:12px;
      color:white;
      font-family:Arial;
    }

    .gameLogo{
      background:#ed1239;
      border:3px solid white;
      border-radius:50%;
      padding:8px 20px;
      font-size:25px;
      font-weight:900;
      font-style:italic;
      transform:rotate(-8deg);
      box-shadow:0 0 25px #ff1744;
    }

    #topUI b{
      display:block;
      font-size:16px;
    }

    #topUI small{
      color:#aaa;
      font-size:9px;
      letter-spacing:2px;
    }

    #turnUI{
      position:fixed;
      top:90px;
      left:50%;
      transform:translateX(-50%);
      z-index:5;
      color:#ffd54a;
      font-family:Arial;
      font-size:12px;
      font-weight:bold;
      letter-spacing:3px;
      text-shadow:0 0 15px #ffd54a;
    }

    #drawCard{
      position:fixed;
      bottom:25px;
      left:50%;
      transform:translateX(-50%);
      z-index:5;
      padding:15px 35px;
      border:0;
      border-radius:16px;
      background:linear-gradient(135deg,#ff1744,#b4002b);
      color:white;
      font-weight:900;
      letter-spacing:1px;
      box-shadow:0 10px 30px rgba(255,23,68,.4);
    }
  `;

  document.head.appendChild(style);

  createArena3D();
}


function createArena3D(){

  const container =
    document.getElementById("game3d");

  scene = new THREE.Scene();

  scene.background =
    new THREE.Color(0x020705);


  camera =
    new THREE.PerspectiveCamera(
      45,
      innerWidth / innerHeight,
      .1,
      100
    );

  camera.position.set(
    0,
    11,
    11
  );

  camera.lookAt(
    0,
    0,
    0
  );


  renderer =
    new THREE.WebGLRenderer({
      antialias:true
    });

  renderer.setSize(
    innerWidth,
    innerHeight
  );

  renderer.setPixelRatio(
    Math.min(devicePixelRatio,2)
  );

  container.appendChild(
    renderer.domElement
  );


  // LIGHT

  scene.add(
    new THREE.AmbientLight(
      0xffffff,
      1.4
    )
  );


  const light =
    new THREE.PointLight(
      0xffd54a,
      3,
      40
    );

  light.position.set(
    0,
    8,
    2
  );

  scene.add(light);


  // TABLE

  const table =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        7,
        7,
        .6,
        64
      ),
      new THREE.MeshStandardMaterial({
        color:0x0b4028,
        roughness:.3,
        metalness:.35
      })
    );

  table.position.y =
    -.3;

  scene.add(table);


  // GOLD BORDER

  const border =
    new THREE.Mesh(
      new THREE.TorusGeometry(
        6.8,
        .13,
        16,
        100
      ),
      new THREE.MeshStandardMaterial({
        color:0xffc400,
        metalness:.9,
        roughness:.2
      })
    );

  border.rotation.x =
    Math.PI/2;

  border.position.y =
    .05;

  scene.add(border);


  // CENTER

  const center =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        2.8,
        2.8,
        .08,
        64
      ),
      new THREE.MeshStandardMaterial({
        color:0x082719,
        roughness:.4
      })
    );

  center.position.y =
    .05;

  scene.add(center);


  // CENTER CARDS

  makeCard(
    -.65,
    .15,
    0,
    0xff1744,
    "7"
  );

  makeCard(
    .65,
    .18,
    .1,
    0x1677ff,
    "2"
  );


  // PLAYER HAND

  const colors = [
    0xff1744,
    0x1677ff,
    0x18bd62,
    0xffc400,
    0x9c27b0,
    0xff6d00,
    0x00bcd4
  ];

  for(let i=0;i<7;i++){

    makeCard(
      (i-3)*1.25,
      .18,
      4.8,
      colors[i],
      i+1
    );

  }


  // AI HAND

  for(let i=0;i<7;i++){

    makeBackCard(
      (i-3)*1.25,
      .18,
      -4.8
    );

  }


  document
    .getElementById("drawCard")
    .onclick = function(){

      alert("Card drawn!");

    };


  window.onresize =
    resize3D;


  animate3D();
}


function makeCard(
  x,
  y,
  z,
  color,
  number
){

  const card =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1,
        .12,
        1.55
      ),
      new THREE.MeshStandardMaterial({
        color:color,
        roughness:.25,
        metalness:.1
      })
    );

  card.position.set(
    x,
    y,
    z
  );

  scene.add(card);


  const glow =
    new THREE.PointLight(
      color,
      .15,
      3
    );

  glow.position.set(
    x,
    .5,
    z
  );

  scene.add(glow);

}


function makeBackCard(
  x,
  y,
  z
){

  const card =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1,
        .12,
        1.55
      ),
      new THREE.MeshStandardMaterial({
        color:0xa90029,
        roughness:.3
      })
    );

  card.position.set(
    x,
    y,
    z
  );

  scene.add(card);

}


function animate3D(){

  requestAnimationFrame(
    animate3D
  );

  const t =
    Date.now()*.0003;

  camera.position.x =
    Math.sin(t)*.7;

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


function resize3D(){

  camera.aspect =
    innerWidth/innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    innerWidth,
    innerHeight
  );

}
