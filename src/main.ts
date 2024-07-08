import "./style.css";
import {
  ACESFilmicToneMapping,
  Color,
  Mesh,
  PMREMGenerator,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from "three";
import {
  GLTFLoader,
  OrbitControls,
  RGBELoader,
} from "three/examples/jsm/Addons.js";

import { DiamondMaterial } from "./diamondMaterial";

async function startApp() {
  const scene = new Scene();
  scene.background = new Color("#f5f5f5");

  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 2;
  camera.position.y = 1;

  const renderer = new WebGLRenderer();
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setSize(window.innerWidth, window.innerHeight);

  const appContainer = document.getElementById("app");
  if (appContainer) {
    appContainer.appendChild(renderer.domElement);
  } else {
    throw new Error("Couldn't find a container with id #app");
  }

  // Load the environment map
  const pmremGenerator = new PMREMGenerator(renderer);
  const rgbeLoader = new RGBELoader();

  const envTexture = await rgbeLoader.loadAsync("/env.hdr");
  const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;

  scene.environment = envMap;

  envTexture.dispose();
  pmremGenerator.dispose();

  // Create diamond materials beforehand
  const coloredDiamondMaterial = new DiamondMaterial({
    envMap,
    color: new Color("#741414"),
  });
  const whiteDiamondMaterial = new DiamondMaterial({
    envMap,
    color: new Color("#ffffff"),
  });

  // Load the model
  const loader = new GLTFLoader();

  loader.load("/ring.glb", (data) => {
    data.scene.traverse((child) => {
      if (child instanceof Mesh) {
        if (child.name === "#occluder") {
          child.visible = false;
        } else if (child.name.includes("Diamond")) {
          const diamondNumber = parseInt(child.name.replace("Diamond", ""));

          if (diamondNumber < 192) {
            child.material = coloredDiamondMaterial;
          } else {
            child.material = whiteDiamondMaterial;
          }
        } else if (child.name === "Oval003") {
          child.material = coloredDiamondMaterial;
        } else if (
          child.name === "Oval002" ||
          child.name === "trillion003" ||
          child.name === "trillion004"
        ) {
          child.material = whiteDiamondMaterial;
        }
      }

      scene.add(data.scene);
    });
  });

  const controls = new OrbitControls(camera, renderer.domElement);

  function animate() {
    controls.update();
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(animate);

  // Init parameters UI
  const parametersElements = document.querySelectorAll(".parameters-item");
  parametersElements.forEach((item) => {
    if (item instanceof HTMLElement) {
      item.addEventListener("click", () => {
        coloredDiamondMaterial.uniforms.color.value = new Color(
          item.dataset.color
        );

        const activeParameter = document.querySelector(
          ".parameters-item.active"
        );

        if (activeParameter) {
          activeParameter.classList.remove("active");
        }

        item.classList.add("active");
      });
    }
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

startApp();
