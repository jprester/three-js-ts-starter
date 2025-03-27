import * as THREE from "three";

// Define TypeScript interfaces
interface CameraState {
  rotationY: number;
  rotationX: number;
  distance: number;
  target: THREE.Vector3;
  isDragging: boolean;
  previousMouseX: number;
  previousMouseY: number;
  dampingFactor: number;
  velocityX: number;
  velocityY: number;
}

interface BuildingOptions {
  width?: number;
  depth?: number;
  height?: number;
  position?: THREE.Vector3;
  material?: THREE.Material;
  windows?: boolean;
}

interface SignOptions {
  text?: string;
  color?: string;
  template?: string;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
}

interface SignTemplate {
  width: number;
  height: number;
  glowIntensity: number;
}

export const initThreeScene = (container: HTMLDivElement) => {
  // Setup scene
  const scene = new THREE.Scene();

  scene.background = new THREE.Color("#050510"); // Very dark blue background
  scene.fog = new THREE.FogExp2("#050510", 0.015);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(25, 15, 25);
  camera.lookAt(0, 0, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Custom camera controls
  const cameraState: CameraState = {
    rotationY: 0,
    rotationX: 0.5,
    distance: 35,
    target: new THREE.Vector3(0, 0, 0),
    isDragging: false,
    previousMouseX: 0,
    previousMouseY: 0,
    dampingFactor: 0.92,
    velocityX: 0,
    velocityY: 0,
  };

  // Update camera position based on angles and distance
  const updateCameraPosition = (): void => {
    // Clamp vertical rotation to avoid going below ground or fully overhead
    cameraState.rotationX = Math.max(
      0.1,
      Math.min(Math.PI / 2 - 0.1, cameraState.rotationX)
    );

    // Convert spherical coordinates to Cartesian
    const x =
      cameraState.distance *
      Math.sin(cameraState.rotationX) *
      Math.sin(cameraState.rotationY);
    const y = cameraState.distance * Math.cos(cameraState.rotationX);
    const z =
      cameraState.distance *
      Math.sin(cameraState.rotationX) *
      Math.cos(cameraState.rotationY);

    camera.position.set(x, y, z);
    camera.lookAt(cameraState.target);
  };

  // Mouse event handlers
  const handleMouseDown = (event: MouseEvent): void => {
    cameraState.isDragging = true;
    cameraState.previousMouseX = event.clientX;
    cameraState.previousMouseY = event.clientY;
    container.style.cursor = "grabbing";
  };

  const handleMouseMove = (event: MouseEvent): void => {
    if (!cameraState.isDragging) return;

    const deltaX = event.clientX - cameraState.previousMouseX;
    const deltaY = event.clientY - cameraState.previousMouseY;

    cameraState.rotationY += deltaX * 0.01;
    cameraState.rotationX += deltaY * 0.01;

    cameraState.velocityX = deltaX * 0.01;
    cameraState.velocityY = deltaY * 0.01;

    cameraState.previousMouseX = event.clientX;
    cameraState.previousMouseY = event.clientY;

    updateCameraPosition();
  };

  const handleMouseUp = (): void => {
    cameraState.isDragging = false;
    container.style.cursor = "grab";
  };

  const handleMouseWheel = (event: WheelEvent): void => {
    // Adjust zoom level based on scroll direction
    cameraState.distance += event.deltaY * 0.05;

    // Clamp distance between min and max values
    cameraState.distance = Math.max(5, Math.min(100, cameraState.distance));

    updateCameraPosition();
    event.preventDefault();
  };

  // Add event listeners
  container.style.cursor = "grab";
  container.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
  container.addEventListener("wheel", handleMouseWheel);

  // Initial camera position
  updateCameraPosition();

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x101020);
  scene.add(ambientLight);

  // Street lights
  const addStreetLight = (x: number, z: number): void => {
    const light = new THREE.PointLight(0xffffaa, 0.8, 30);
    light.position.set(x, 6, z);
    scene.add(light);

    // Light pole (simple cylinder)
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, 3, z);
    scene.add(pole);
  };

  // Add street lights along roads
  for (let i = -45; i <= 45; i += 15) {
    addStreetLight(i, -8);
    addStreetLight(i, 8);
  }

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(150, 150);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.8,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  scene.add(ground);

  // Road
  const roadGeo = new THREE.PlaneGeometry(150, 16);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0;
  scene.add(road);

  // Neon Sign Factory
  class NeonSignFactory {
    private textureCache: Map<string, THREE.Texture>;
    private templates: Record<string, SignTemplate>;
    private japaneseTexts: string[];
    private englishTexts: string[];
    private neonColors: string[];

    constructor() {
      this.textureCache = new Map<string, THREE.Texture>();

      // Common sign templates
      this.templates = {
        small: { width: 3, height: 1, glowIntensity: 1.1 },
        medium: { width: 5, height: 1.5, glowIntensity: 1.2 },
        large: { width: 8, height: 2, glowIntensity: 1.3 },
        vertical: { width: 1.5, height: 6, glowIntensity: 1.2 },
      };

      // Common Japanese store/business names and phrases
      this.japaneseTexts = [
        "居酒屋",
        "寿司",
        "ラーメン",
        "カラオケ",
        "バー",
        "ホテル",
        "24時間",
        "美容院",
        "銀行",
        "カフェ",
        "書店",
        "ゲームセンター",
        "歓迎",
        "新鮮",
        "激安",
        "本日営業",
        "成功",
        "電器",
        "薬局",
      ];

      // Common English store/business words
      this.englishTexts = [
        "BAR",
        "HOTEL",
        "LOUNGE",
        "CAFE",
        "CLUB",
        "NOODLE",
        "SUSHI",
        "TECH",
        "CYBER",
        "NIGHT",
        "DREAM",
        "STAR",
        "LUCKY",
        "DRAGON",
        "GLOW",
        "GAMES",
        "24H",
        "OPEN",
      ];

      // Neon colors
      this.neonColors = [
        "#ff3366",
        "#33ccff",
        "#ffcc00",
        "#66ff66",
        "#cc33ff",
        "#ff6600",
        "#00ffcc",
        "#ff0099",
      ];
    }

    getRandomText(lang: "ja" | "en" | "mixed" = "mixed"): string {
      if (lang === "ja") {
        return this.japaneseTexts[
          Math.floor(Math.random() * this.japaneseTexts.length)
        ];
      } else if (lang === "en") {
        return this.englishTexts[
          Math.floor(Math.random() * this.englishTexts.length)
        ];
      } else {
        // Mixed: 70% chance Japanese, 30% chance English
        return Math.random() < 0.7
          ? this.japaneseTexts[
              Math.floor(Math.random() * this.japaneseTexts.length)
            ]
          : this.englishTexts[
              Math.floor(Math.random() * this.englishTexts.length)
            ];
      }
    }

    getRandomColor(): string {
      return this.neonColors[
        Math.floor(Math.random() * this.neonColors.length)
      ];
    }

    getRandomTemplate(): string {
      const templates = Object.keys(this.templates);
      return templates[Math.floor(Math.random() * templates.length)];
    }

    createTextTexture(text: string, color: string): THREE.Texture {
      const cacheKey = `${text}_${color}`;

      if (this.textureCache.has(cacheKey)) {
        return this.textureCache.get(cacheKey)!;
      }

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.width = 512;
      canvas.height = 256;

      // Clear background
      context.fillStyle = "rgba(0,0,0,0)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Set font based on whether text is Japanese or not
      const isJapanese =
        /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(
          text
        );
      context.font = isJapanese
        ? 'bold 80px "Noto Sans JP", "MS Gothic", sans-serif'
        : 'bold 80px "Arial", sans-serif';

      context.textAlign = "center";
      context.textBaseline = "middle";

      // Multi-layer glow effect
      for (let i = 15; i > 0; i -= 3) {
        context.shadowColor = color;
        context.shadowBlur = 30 + i;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.fillStyle = `rgba(${parseInt(
          color.slice(1, 3),
          16
        )}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(
          color.slice(5, 7),
          16
        )}, 0.${i})`;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
      }

      // Core text
      context.shadowBlur = 10;
      context.fillStyle = "#ffffff";
      context.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      this.textureCache.set(cacheKey, texture);
      return texture;
    }

    createNeonSign(options: SignOptions = {}): THREE.Group {
      const text = options.text || this.getRandomText();
      const color = options.color || this.getRandomColor();
      const templateName = options.template || this.getRandomTemplate();
      const template = this.templates[templateName];
      const position = options.position || new THREE.Vector3(0, 0, 0);
      const rotation = options.rotation || new THREE.Euler(0, 0, 0);

      // Create group for the sign
      const group = new THREE.Group();

      // Create text texture
      const texture = this.createTextTexture(text, color);

      // Text plane
      const textGeo = new THREE.PlaneGeometry(template.width, template.height);
      const textMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const textMesh = new THREE.Mesh(textGeo, textMat);
      group.add(textMesh);

      // Frame
      const frameGeo = new THREE.PlaneGeometry(
        template.width + 0.2,
        template.height + 0.2
      );
      const frameMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.7,
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.z = -0.05;
      group.add(frameMesh);

      // Thin backing board
      const backGeo = new THREE.BoxGeometry(
        template.width + 0.3,
        template.height + 0.3,
        0.1
      );
      const backMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.8,
        metalness: 0.2,
      });
      const backMesh = new THREE.Mesh(backGeo, backMat);
      backMesh.position.z = -0.1;
      group.add(backMesh);

      // Position and rotate
      group.position.copy(position);
      group.rotation.copy(rotation);

      return group;
    }
  }

  // Building Factory
  class BuildingFactory {
    private materials: THREE.MeshStandardMaterial[];
    private windowsMaterial: THREE.MeshStandardMaterial;

    constructor() {
      this.materials = [
        new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.7 }),
      ];

      // Windows material (emissive)
      this.windowsMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffcc,
        emissive: 0xffffcc,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8,
      });
    }

    createBuilding(options: BuildingOptions = {}): THREE.Group {
      const width = options.width || 5 + Math.random() * 5;
      const depth = options.depth || 5 + Math.random() * 5;
      const height = options.height || 5 + Math.random() * 20;
      const position = options.position || new THREE.Vector3();

      const group = new THREE.Group();

      // Main building structure
      const buildingGeo = new THREE.BoxGeometry(width, height, depth);
      const buildingMat =
        options.material ||
        this.materials[Math.floor(Math.random() * this.materials.length)];
      const building = new THREE.Mesh(buildingGeo, buildingMat);
      building.position.y = height / 2;
      group.add(building);

      // Add windows as a separate geometry
      if (options.windows !== false) {
        // Random window pattern
        const rows = Math.floor(height / 2);
        const colsX = Math.floor(width / 1.5);
        const colsZ = Math.floor(depth / 1.5);

        const windowSize = 0.6;
        const windowGeo = new THREE.PlaneGeometry(windowSize, windowSize);

        // Add windows to each side of building
        const sides = [
          { rot: [0, 0, 0], posZ: depth / 2 + 0.01, cols: colsX, rows }, // Front
          { rot: [0, Math.PI, 0], posZ: -depth / 2 - 0.01, cols: colsX, rows }, // Back
          {
            rot: [0, Math.PI / 2, 0],
            posX: width / 2 + 0.01,
            cols: colsZ,
            rows,
          }, // Right
          {
            rot: [0, -Math.PI / 2, 0],
            posX: -width / 2 - 0.01,
            cols: colsZ,
            rows,
          }, // Left
        ];

        sides.forEach((side) => {
          for (let row = 0; row < side.rows; row++) {
            for (let col = 0; col < side.cols; col++) {
              // 30% chance of window being dark
              if (Math.random() < 0.3) continue;

              const window = new THREE.Mesh(
                windowGeo,
                this.windowsMaterial.clone()
              );

              // Position window
              window.position.y = row * 1.5 + 1;

              if (side.posZ !== undefined) {
                window.position.z = side.posZ;
                window.position.x = col * 1.5 - ((side.cols - 1) * 1.5) / 2;
              } else {
                window.position.x = side.posX;
                window.position.z = col * 1.5 - ((side.cols - 1) * 1.5) / 2;
              }

              // Set random brightness for window
              window.material.emissiveIntensity = 0.1 + Math.random() * 0.3;
              window.rotation.set(...(side.rot as [number, number, number]));

              group.add(window);
            }
          }
        });
      }

      // Position the building
      group.position.copy(position);

      return group;
    }
  }

  // Create factories
  const signFactory = new NeonSignFactory();
  const buildingFactory = new BuildingFactory();

  // Create city grid
  const gridSize = 6; // 6x6 grid
  const blockSize = 15;
  const buildings: THREE.Group[] = [];

  for (let x = -gridSize / 2; x < gridSize / 2; x++) {
    for (let z = -gridSize / 2; z < gridSize / 2; z++) {
      // Skip the road area
      if (Math.abs(z) < 1) continue;

      // Create building
      const posX = x * blockSize;
      const posZ = z * blockSize + (z > 0 ? 8 : -8); // Add offset for road

      const height = 5 + Math.floor(Math.random() * 20);
      const building = buildingFactory.createBuilding({
        width: 8 + Math.random() * 4,
        depth: 8 + Math.random() * 4,
        height,
        position: new THREE.Vector3(posX, 0, posZ),
      });

      scene.add(building);
      buildings.push(building);

      // Add neon signs to the building
      const signCount = Math.floor(Math.random() * 3) + 1; // 1-3 signs per building

      for (let i = 0; i < signCount; i++) {
        const side = Math.floor(Math.random() * 4); // 0=front, 1=right, 2=back, 3=left
        const signHeight = 3 + Math.random() * (height - 6); // Random height on building

        // If vertical sign
        const isVertical = Math.random() < 0.3;
        const template = isVertical
          ? "vertical"
          : Math.random() < 0.7
          ? "small"
          : "medium";

        let rotation: THREE.Euler;
        let position: THREE.Vector3;
        const buildingWidth = (
          (building.children[0] as THREE.Mesh).geometry as THREE.BoxGeometry
        ).parameters.width;
        const buildingDepth = (
          (building.children[0] as THREE.Mesh).geometry as THREE.BoxGeometry
        ).parameters.depth;

        switch (side) {
          case 0: // front
            rotation = new THREE.Euler(0, 0, 0);
            position = new THREE.Vector3(
              posX + (Math.random() - 0.5) * (buildingWidth - 2),
              signHeight,
              posZ + buildingDepth / 2 + 0.1
            );
            break;
          case 1: // right
            rotation = new THREE.Euler(0, Math.PI / 2, 0);
            position = new THREE.Vector3(
              posX + buildingWidth / 2 + 0.1,
              signHeight,
              posZ + (Math.random() - 0.5) * (buildingDepth - 2)
            );
            break;
          case 2: // back
            rotation = new THREE.Euler(0, Math.PI, 0);
            position = new THREE.Vector3(
              posX + (Math.random() - 0.5) * (buildingWidth - 2),
              signHeight,
              posZ - buildingDepth / 2 - 0.1
            );
            break;
          case 3: // left
            rotation = new THREE.Euler(0, -Math.PI / 2, 0);
            position = new THREE.Vector3(
              posX - buildingWidth / 2 - 0.1,
              signHeight,
              posZ + (Math.random() - 0.5) * (buildingDepth - 2)
            );
            break;
          default:
            // fallback (should never happen)
            rotation = new THREE.Euler(0, 0, 0);
            position = new THREE.Vector3(posX, signHeight, posZ);
        }

        // Create sign and add to scene
        const sign = signFactory.createNeonSign({
          template,
          position,
          rotation,
        });

        scene.add(sign);
      }
    }
  }

  // Animate
  const animate = (): void => {
    requestAnimationFrame(animate);

    // Apply inertia if not dragging
    if (!cameraState.isDragging) {
      cameraState.velocityX *= cameraState.dampingFactor;
      cameraState.velocityY *= cameraState.dampingFactor;

      if (
        Math.abs(cameraState.velocityX) > 0.001 ||
        Math.abs(cameraState.velocityY) > 0.001
      ) {
        cameraState.rotationY += cameraState.velocityX;
        cameraState.rotationX += cameraState.velocityY;
        updateCameraPosition();
      }
    }

    renderer.render(scene, camera);
  };

  animate();

  // Handle window resize
  const handleResize = (): void => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
    container.removeEventListener("mousedown", handleMouseDown);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    container.removeEventListener("wheel", handleMouseWheel);
    if (container) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
  };
};
