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

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);

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
