import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { TextGeometry } from "jsm/geometries/TextGeometry.js";
import { FontLoader } from "jsm/loaders/FontLoader.js";

const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
camera.position.z = 10;
const bgElements = [];
let backgroundWaveTimer = 0;
const waveInterval = 0.010; // seconds between each wave
//tracking mouse (ME)
const mouse = new THREE.Vector2();
window.addEventListener("mousemove", (event) =>{
  // so that it is in coordinates
    mouse.x = (event.clientX / window.innerWidth) *2-1;
    mouse.y = ((event.clientY / window.innerHeight) *2-1)*-1;
})

// asked ai for a 3d mouse:
const cursorDot = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
scene.add(cursorDot);

// ai made bg
function createBackgroundElements() {
  const colors = [0x44aaff, 0xff4499, 0x44ff99, 0xffff66, 0xaa88ff];
  const count = 10;

  for (let i = 0; i < count; i++) {
    const geometry = new THREE.PlaneGeometry(
      THREE.MathUtils.randFloat(4, 10),
      THREE.MathUtils.randFloat(1.5, 3)
    );

    const material = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      transparent: true,
      opacity: THREE.MathUtils.randFloat(0.05, 0.15),
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const side = i % 2 === 0 ? -1 : 1;
    const startX = side * w / 100 + THREE.MathUtils.randFloat(0, 5);

    mesh.position.set(startX, (i - count / 2) * 2.5, -8 - i * 0.05);

    mesh.userData = {
      side,
      targetX: THREE.MathUtils.randFloat(-2, 2),
      driftSpeed: THREE.MathUtils.randFloat(0.2, 0.5),
      scalePulse: THREE.MathUtils.randFloat(0.01, 0.03),
      phase: Math.random() * Math.PI * 2,
      parallax: 0.1 + Math.random() * 0.3,
      timer: Math.random() * 5 + 5,
      state: "in", // or "out"
    };

    bgElements.push(mesh);
    scene.add(mesh);
  }
}
function spawnBackgroundWave(count = 4) {
  const colors = [0x44aaff, 0xff4499, 0x44ff99, 0xffff66, 0xaa88ff];

  for (let i = 0; i < count; i++) {
    const geometry = new THREE.PlaneGeometry(
      THREE.MathUtils.randFloat(4, 10),
      THREE.MathUtils.randFloat(1.5, 3)
    );

    const material = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true,
      opacity: THREE.MathUtils.randFloat(0.05, 0.15),
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const side = Math.random() < 0.5 ? -1 : 1;

    // start offscreen on the side
    mesh.position.set(side * 20, THREE.MathUtils.randFloat(-10, 10), -8 - Math.random() * 2);

    mesh.userData = {
      side,
      targetX: THREE.MathUtils.randFloat(-2, 2),
      driftSpeed: THREE.MathUtils.randFloat(0.2, 0.5),
      scalePulse: THREE.MathUtils.randFloat(0.01, 0.03),
      phase: Math.random() * Math.PI * 2,
      parallax: 0.1 + Math.random() * 0.3,
      timer: Math.random() * 6 + 4,
      state: "in",
      fadingOut: false,
      fadeProgress: 0, // 0 to 1
    };

    bgElements.push(mesh);
    scene.add(mesh);
  }
}
function fadeOutBackground() {
  bgElements.forEach((mesh) => {
    mesh.userData.fadingOut = true;
    mesh.userData.fadeProgress = 0;
  });
}



const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;

const light = new THREE.HemisphereLight(0x8497ff, 0xff9c2d, 1);
scene.add(light);

const loader = new FontLoader();

// let mesh = null;      // Mesh created after font loads, to prevent nullings
let scrollPos = 0;  // offset / distance scrolled

console.log("Loading font...");

const texts = ["Climate Change", "What is it doing to our world?", "What we can do to help?"];
let font = null;
let meshes = [];
let lineSizes = [3, 1, 1]; // size per line in array
const lineSpacing = 3; // vertical spacing

// Create a group for all text lines
const textGroup = new THREE.Group();
scene.add(textGroup);

function createTexts(font) {
  meshes.forEach(mesh => textGroup.remove(mesh));
  meshes = [];

  texts.forEach((txt, i) => {
    const size = lineSizes[i];
    const textGeo = new TextGeometry(txt, {
      font: font,
      size: size,
      height: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
    textGeo.center();

    const textMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(textGeo, textMat);

    mesh.position.y = getLineY(i);
    textGroup.add(mesh);
    meshes.push(mesh);
  });
}





loader.load(
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
  (loadedFont) => {
    font = loadedFont;
    createTexts(font);
  }
);

window.addEventListener("wheel", (event) => {
  if (event.deltaY < 0) {
    scrollPos--;
  } else if (event.deltaY > 0) {
    scrollPos++;
  }
  console.log("scrollPos:", scrollPos);
});

function getLineY(i) {
  let y = 0;
  for (let j = 0; j < i; j++) {
    y -= lineSizes[j] + lineSpacing;
  }
  return y;
}

//AI perfected my trees, witch i modified to how I wanted them
function createTree(x, y, z) {
  const tree = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.5; // raise trunk so base is at y = 0
  tree.add(trunk);

  // Leaves
  const leafGeo = new THREE.ConeGeometry(0.8, 2, 8);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
  const leaves = new THREE.Mesh(leafGeo, leafMat);
  leaves.position.y = 2; // sit atop trunk
  tree.add(leaves);

  tree.position.set(x, y, z);
  scene.add(tree);
}

for (let i = -10; i <= 5; i++) {
  createTree(i * 2.5, -10, -2 + Math.random() * 9); // random slight depth
}
// anbient sun by ai, then modified
function createSunRays(parent, numRays = 12, radius = 1.6, rayLength = 2, rayWidth = 0.05) {
  const rayGeo = new THREE.ConeGeometry(rayWidth, rayLength, 3);
  const rayMat = new THREE.MeshBasicMaterial({ color: 0xffdd33, emissive: 0xffcc00 });

  for (let i = 0; i < numRays; i++) {
    const ray = new THREE.Mesh(rayGeo, rayMat);
    const angle = (i / numRays) * Math.PI * 2;

    ray.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0
    );

    // Rotate cone so it points outward from center
    ray.rotation.z = angle - Math.PI / 2;

    parent.add(ray);
  }
}

// Create sun sphere
const sunGeo = new THREE.SphereGeometry(1, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ 
  color: 0xffdd33,
  emissive: 0xffcc00,
  emissiveIntensity: 1,
});
const sun = new THREE.Mesh(sunGeo, sunMat);

// Create a group to hold the sun and rays
const sunGroup = new THREE.Group();

// Add sun mesh to group (do NOT add sun to scene directly)
sun.position.set(0, 0, 0); // center inside group
sunGroup.add(sun);

// Add rays around the sun
createSunRays(sunGroup);

// Position sunGroup above top text line
const topLineY = getLineY(0);
sunGroup.position.set(0, topLineY + 3, 0);

// Add sunGroup to scene
scene.add(sunGroup);

// Create and add sun light as child of sunGroup so it moves with the sun
const sunLight = new THREE.PointLight(0xffee88, 1.5, 20);
sunLight.position.set(0, 0, 0);  // center of sunGroup
sunGroup.position.x += 16;
sunGroup.position.y += 2;

sunGroup.add(sunLight);
let cube;//make GLOBAL

// adding the pictures AI BUT it didnt work so I editied
const loader_txtr = new THREE.TextureLoader();
loader_txtr.load('tornado_coding.jpg', function(texture) {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  cube = new THREE.Mesh(geometry, material);
  cube.position.set(2, 0, 0);
  scene.add(cube);
});

// animate Function
let displayedScrollPos = 0;
const scrollEase = 0.02; // smaller = smoother/slower easing


// const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // plane facing camera at z = 0
const raycaster = new THREE.Raycaster();
const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Plane at z = 0


let clock = new THREE.Clock();
const maxTipAngle = Math.PI / 10; // max tip 30 degrees
createBackgroundElements();

// ai smothed the animations and added background
function animate() {
  requestAnimationFrame(animate);
  controls.update();
// for 3d mouse 
const intersectionPoint = new THREE.Vector3();
raycaster.ray.intersectPlane(mousePlane, intersectionPoint);

cursorDot.position.copy(intersectionPoint);

  displayedScrollPos += (scrollPos - displayedScrollPos) * scrollEase;

  const elapsed = clock.getElapsedTime();

  // Smooth vertical positioning for each line
  meshes.forEach((mesh, i) => {
    const targetY = displayedScrollPos + getLineY(i);
    mesh.position.y += (targetY - mesh.position.y) * 0.1;

    // Color shift
    const hue = (displayedScrollPos * 10 + i * 50) % 360;
    mesh.material.color.setHSL(hue / 360, 0.8, 0.7);
  });

  // Rollercoaster tip rotation
  const tipAngle = maxTipAngle * Math.sin(displayedScrollPos * 0.3);
  const wobble = 0.05 * Math.sin(elapsed * 5);
  textGroup.rotation.x = tipAngle + wobble;

  // Camera zoom and fog
  camera.position.z = 10 + displayedScrollPos * 0.1;
  camera.lookAt(scene.position);
  scene.fog = new THREE.FogExp2(0x202040, 0.05);
  renderer.setClearColor(scene.fog.color);

  const delta = clock.getDelta();

  // Animate background elements
  for (let i = bgElements.length - 1; i >= 0; i--) {
    const mesh = bgElements[i];
    const t = elapsed + mesh.userData.phase;
    const ud = mesh.userData;

    if (ud.fadingOut) {
      ud.fadeProgress += delta;
      const fadeAmount = THREE.MathUtils.clamp(1 - ud.fadeProgress, 0, 1);
      mesh.material.opacity = fadeAmount * 0.15;

      if (ud.fadeProgress >= 1) {
        scene.remove(mesh);
        bgElements.splice(i, 1);
        continue; // skip rest of this iteration
      }
    } else {
      // Slide logic
      ud.timer -= delta;
      if (ud.timer <= 0) {
        if (ud.state === "in") {
          ud.targetX = ud.side * 20;
          ud.state = "out";
          ud.timer = Math.random() * 3 + 2;
        } else {
          ud.side *= -1;
          mesh.position.x = ud.side * 20;
          mesh.position.y = THREE.MathUtils.randFloat(-10, 10);
          ud.targetX = THREE.MathUtils.randFloat(-2, 2);
          ud.state = "in";
          ud.timer = Math.random() * 8 + 5;
          mesh.material.color.setHex(Math.random() * 0xffffff);
          mesh.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.3));
        }
      }
      // edited pulsing from ai
      mesh.position.x += (ud.targetX - mesh.position.x) * 0.05;
      mesh.position.y += Math.sin(t * ud.driftSpeed) * 0.01;
      const pulse = 1 + Math.sin(t * 2) * ud.scalePulse;
      mesh.scale.set(pulse, pulse, 1);
      mesh.position.y += (displayedScrollPos * ud.parallax - mesh.position.y) * 0.01;
    }
  }
  // sunray rotation
  sunGroup.rotation.z += 0.01;
  //more 3d mouse
  if (typeof cube !== 'undefined') {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(cube);
  if (intersects.length > 0) {
    cursorDot.position.copy(intersects[0].point);
  }
}

  // scrolltest
  scrollDisplay.textContent = `displayedScrollPos: ${displayedScrollPos}`;
  //render 
  renderer.render(scene, camera);
}


animate();

