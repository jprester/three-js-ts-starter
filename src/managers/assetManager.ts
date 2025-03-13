import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

const textureLoader = new THREE.TextureLoader();

export const loadTexture = async ({
  diffuseMapUrl,
  emissionMapUrl,
}: {
  diffuseMapUrl?: string;
  emissionMapUrl?: string;
}) => {
  try {
    console.log("Loading textures...");
    if (!diffuseMapUrl) {
      console.warn("Missing texture URLs");
      return;
    }

    // Load textures
    const diffuseMap = textureLoader.load(diffuseMapUrl);
    diffuseMap.flipY = false; // GLTF expects unflipped textures
    diffuseMap.needsUpdate = true;
    console.log("Diffuse texture loaded successfully! ", diffuseMap);

    if (!emissionMapUrl) {
      console.warn("Missing emission map URL");
      return { diffuseMap };
    }
    const emissiveMap = textureLoader.load(emissionMapUrl);
    emissiveMap.flipY = false; // GLTF expects unflipped textures
    emissiveMap.needsUpdate = true;

    console.log("Emissive texture loaded successfully! ", emissiveMap);

    // diffuseMap.repeat.set(4, 4);

    return { diffuseMap, emissiveMap };
  } catch (error) {
    console.error("Error loading textures:", error);
  }
};

export const loadModel = async (
  modelUrl: string,
  scene: THREE.Scene,
  textures?: {
    diffuseMap?: THREE.Texture;
    emissiveMap?: THREE.Texture;
  },
  options?: {
    position?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
  }
) => {
  try {
    console.log("Initializing city scene...");
    const { diffuseMap, emissiveMap } = textures || {};

    const gltfLoader = new GLTFLoader();
    // const objLoader = new OBJLoader();

    // Loading a GLB with embedded textures
    // Load OBJ model

    gltfLoader.load(
      modelUrl, // Replace with your OBJ file path
      (mesh) => {
        const model = mesh.scene;
        // Traverse the object to apply material
        if (diffuseMap) {
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const material = new THREE.MeshStandardMaterial(
                emissiveMap
                  ? {
                      map: diffuseMap, // Diffuse texture
                      metalness: 1, // Adjust as needed
                      roughness: 1, // Adjust as needed
                      emissive: new THREE.Color(0xffffff), // Emissive color (white default)
                      emissiveMap: emissiveMap, // Emission texture
                      emissiveIntensity: 1.4, // Strength of emission
                    }
                  : {
                      map: diffuseMap, // Diffuse texture
                      metalness: 1, // Adjust as needed
                      roughness: 1, // Adjust as needed
                    }
              );
              child.material = material;
            }
          });
        }

        model.position.set(
          options?.position?.x || 0,
          options?.position?.y || 0,
          options?.position?.z || 0
        );
        model.scale.set(
          options?.scale?.x || 1,
          options?.scale?.y || 1,
          options?.scale?.z || 1
        );
        model.rotation.set(
          options?.rotation?.x || 0,
          options?.rotation?.y || 0,
          options?.rotation?.z || 0
        );

        scene.add(model);
      },
      (xhr) => {
        // Loading progress
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("An error occurred:", error);
      }
    );
  } catch (error) {
    console.error("Error initializing city scene:", error);
  }
};
