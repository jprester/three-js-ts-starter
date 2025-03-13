import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

const textureLoader = new THREE.TextureLoader();

export const loadTextures = async (textureUrl: string) => {
  try {
    console.log("Loading textures...");

    // Load textures
    const diffuseMap = textureLoader.load(textureUrl);

    console.log("Textures loaded successfully! ", diffuseMap);

    return { diffuseMap };
  } catch (error) {
    console.error("Error loading textures:", error);
  }
};

export const loadModels = async (
  modelUrl: string,
  scene: THREE.Scene,
  textures?: {
    diffuseMap?: THREE.Texture;
    normalMap?: THREE.Texture;
  }
) => {
  try {
    console.log("Initializing city scene...");
    const { diffuseMap } = textures || {};

    const gltfLoader = new GLTFLoader();

    // Loading a GLB with embedded textures
    gltfLoader.load(
      modelUrl,
      (gltf) => {
        console.log("Model loaded successfully! ", gltf);
        const model = gltf.scene;
        // Traverse the model to apply texture to all meshes
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            console.log("diffuseMap: ", diffuseMap);
            // Create a new material with the diffuse texture
            const material = new THREE.MeshStandardMaterial({
              map: diffuseMap, // Diffuse texture
              metalness: 0.8, // Adjust as needed
              roughness: 0.5, // Adjust as needed
            });

            // Apply the new material
            child.material = material;
          }
        });

        scene.add(model);
        scene.add(gltf.scene);
      },
      (xhr) => {
        console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error("Error loading model:", error);
      }
    );
  } catch (error) {
    console.error("Error initializing city scene:", error);
  }
};
