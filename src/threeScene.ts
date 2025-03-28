import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { loadTexture, loadModel } from "./managers/assetManager";

export const initThreeScene = (container: HTMLDivElement) => {
  // Setup scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  // Setup camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // Setup renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Add orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // adds smooth damping effect
  controls.dampingFactor = 0.05;

  // Create a blue cube
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshStandardMaterial({
    color: 0x0066ff,
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(2, 0, 0);
  scene.add(cube);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 5);
  ambientLight.position.set(0, 5, 0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
  directionalLight.position.set(0, 25, 5);
  scene.add(directionalLight);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  directionalLight.castShadow = true;

  // Handle window resize
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener("resize", handleResize);

  // Initialize scene with proper async loading sequence
  const initAssetLoad = async () => {
    try {
      // First load textures and await the result
      const textures = await loadTexture({
        diffuseMapUrl: "./assets/textures/UV_checker_Map.jpg",
      });

      // Then load models with the loaded textures
      await loadModel("./assets/models/glassyCube.glb", scene, textures, {
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
      });
    } catch (error) {
      console.error("Error initializing scene:", error);
    }
  };

  // Start the initialization process
  initAssetLoad();

  // Point lights for enhanced glow effect
  const mainLight = new THREE.PointLight(0xff3366, 1, 10);
  mainLight.position.set(-2, 2, 3);
  scene.add(mainLight);

  const secondaryLight = new THREE.PointLight(0xff3366, 1, 10);
  secondaryLight.position.set(2, -2, 3);
  scene.add(secondaryLight);

  // Create canvas for text
  const createTextTexture = (text, color) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 1024;
    canvas.height = 512;

    // Background (transparent)
    context.fillStyle = "rgba(0,0,0,0)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Text settings
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = 'bold 180px "Noto Sans JP", "MS Gothic", sans-serif';

    // Outer glow (multiple passes)
    for (let i = 20; i > 0; i -= 5) {
      context.shadowColor = color;
      context.shadowBlur = 40 + i;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(
        color.slice(3, 5),
        16
      )}, ${parseInt(color.slice(5, 7), 16)}, 0.${i})`;
      context.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    // Core text
    context.shadowBlur = 10;
    context.fillStyle = "#ffffff";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  // Create a neon sign plane with the texture
  const createNeonSign = (text, color, position) => {
    const texture = createTextTexture(text, color);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.PlaneGeometry(4, 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    return mesh;
  };

  // Create background frame/outline with the same treatment as text
  const createNeonFrame = () => {
    // Create canvas for frame
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 1024;
    canvas.height = 512;

    // Background (transparent)
    context.fillStyle = "rgba(0,0,0,0)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw frame
    const frameColor = "#ff3366"; // Same as text color
    const frameWidth = 20;

    // Outer glow (multiple passes)
    for (let i = 20; i > 0; i -= 5) {
      context.shadowColor = frameColor;
      context.shadowBlur = 40 + i;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.strokeStyle = `rgba(${parseInt(
        frameColor.slice(1, 3),
        16
      )}, ${parseInt(frameColor.slice(3, 5), 16)}, ${parseInt(
        frameColor.slice(5, 7),
        16
      )}, 0.${i})`;
      context.lineWidth = frameWidth + i;
      context.strokeRect(
        canvas.width / 2 - 350,
        canvas.height / 2 - 150,
        700,
        300
      );
    }

    // Core frame
    // context.shadowBlur = 10;
    context.strokeStyle = "#ffffff";
    context.lineWidth = frameWidth - 5;
    context.strokeRect(
      canvas.width / 2 - 350,
      canvas.height / 2 - 150,
      700,
      300
    );

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.PlaneGeometry(4.5, 2.5);
    const frameMesh = new THREE.Mesh(geometry, material);
    frameMesh.position.z = -0.1; // Behind the text

    return frameMesh;
  };

  // Create the neon sign and frame
  const neonSign = createNeonSign(
    "光る夜",
    "#ff3366",
    new THREE.Vector3(0, 0, 0)
  );
  const frame = createNeonFrame();

  neonSign.position.z = 0.8; // In front of the frame

  frame.position.copy(neonSign.position);

  scene.add(neonSign);
  // scene.add(frame);

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);

    // Update controls
    controls.update();

    renderer.render(scene, camera);
  };
  animate();

  // Return cleanup function
  return () => {
    window.removeEventListener("resize", handleResize);
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    controls.dispose();
  };
};
