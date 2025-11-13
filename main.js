// ======================
// RITUAL PENANG - WebGL Interactive Space
// ======================

// Mobile detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// Global variables
let scene, camera, renderer, controls;
let entryScene, entryCamera, entryRenderer;
let mainModel, logoModel, entryLogoModel;
let raycaster, mouse;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let moveUp = false, moveDown = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let fullMoonMode = false;
let easterEggInput = '';
let secretRoomUnlocked = false;

// Interactive markers
let interactiveMarkers = [];
let hoveredMarker = null;

// Lighting control
let lightsOn = true;
let sceneLights = [];
let fullmoonSoundPlaying = false;

// Movement modes
let isFlying = false;
let movementSpeed = 80; // Reduced from 400 for smoother navigation

// Interaction state
let canClick = true;

// Sigil quotes
const sigilQuotes = [
    "Every ritual begins with listening.",
    "Drink the moonlight, it ferments within you.",
    "The cycle returns with each full moon.",
    "In darkness, we find our light.",
    "Sound is the bridge between worlds.",
    "Brew your intentions with care.",
    "The ritual is within you."
];

// ======================
// ENTRY SCREEN WITH 3D LOGO
// ======================

function initEntryScreen() {
    const canvas = document.getElementById('entry-canvas');

    // Entry Scene
    entryScene = new THREE.Scene();
    entryScene.background = new THREE.Color(0x000000);

    // Entry Camera
    entryCamera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    entryCamera.position.set(0, 0, 3);

    // Entry Renderer - optimized for mobile
    entryRenderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile, // Disable antialiasing on mobile for better performance
        alpha: true,
        powerPreference: "high-performance"
    });
    entryRenderer.setSize(window.innerWidth, window.innerHeight);
    entryRenderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)); // Cap pixel ratio on mobile

    // Chrome/Silver lights for entry scene
    const ambientLight = new THREE.AmbientLight(0xc0c0c0, 0.7);
    entryScene.add(ambientLight);

    const light1 = new THREE.PointLight(0x00d4ff, 2.5, 12);
    light1.position.set(2, 2, 2);
    entryScene.add(light1);

    const light2 = new THREE.PointLight(0x4a9eff, 2.5, 12);
    light2.position.set(-2, -2, 2);
    entryScene.add(light2);

    const light3 = new THREE.PointLight(0xe8e8e8, 2, 10);
    light3.position.set(0, 0, -2);
    entryScene.add(light3);

    // Load ritual logo for entry
    const loader = new THREE.GLTFLoader();
    loader.load(
        'rituallogo.glb',
        (gltf) => {
            entryLogoModel = gltf.scene;
            entryLogoModel.position.set(0, 0, 0);
            entryLogoModel.scale.set(1.5, 1.5, 1.5);
            entryScene.add(entryLogoModel);

            // Animate entry screen
            animateEntryScreen();
        },
        (xhr) => {
            console.log('Entry logo: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading entry logo:', error);
        }
    );

    // Click to enter
    document.getElementById('entry-screen').addEventListener('click', () => {
        // Play ritual music on user interaction (fixes autoplay policy)
        playSound('ritual-sound', true, 0.2);

        // Stop it shortly after as we transition to loading
        setTimeout(() => {
            stopSound('ritual-sound');
        }, 500);

        document.getElementById('entry-screen').style.display = 'none';
        document.getElementById('loading-screen').style.display = 'flex';
        initRitualScene();
    });
}

function animateEntryScreen() {
    requestAnimationFrame(animateEntryScreen);

    if (entryLogoModel) {
        entryLogoModel.rotation.y += 0.01;
        entryLogoModel.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
    }

    entryRenderer.render(entryScene, entryCamera);
}

// ======================
// THREE.JS SCENE SETUP
// ======================

function initRitualScene() {
    // Scene with chrome atmosphere
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0f0f15, 25, 120);

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    // Position camera at the entrance/inside the main.glb environment
    // Model center is at approximately (-5.66, 5.57, -0.35)
    camera.position.set(-5.66, 5.57, 10); // Positioned to look into the environment

    // Renderer - optimized for mobile
    const canvas = document.getElementById('ritual-canvas');
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile, // Disable antialiasing on mobile
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)); // Cap pixel ratio on mobile
    renderer.shadowMap.enabled = !isMobile; // Disable shadows on mobile for performance
    if (!isMobile) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Raycaster for clicking
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lights - MUCH MORE LIGHTING!
    setupLights();

    // Add ground plane for reference
    addGroundPlane();

    // Load models
    loadModels();

    // Create interactive markers
    createInteractiveMarkers();

    // Controls (will be enabled after models load)
    setupControls();

    // Event listeners
    setupEventListeners();

    // Start animation
    animate();
}

// ======================
// LIGHTING - ENHANCED!
// ======================

function setupLights() {
    // Strong chrome ambient light for overall visibility
    const ambientLight = new THREE.AmbientLight(0xe8e8e8, 0.8);
    scene.add(ambientLight);
    sceneLights.push(ambientLight);

    // Chrome hemisphere light for metallic atmosphere
    const hemiLight = new THREE.HemisphereLight(0xe8e8e8, 0xa8a8a8, 0.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    sceneLights.push(hemiLight);

    // Main directional light with cyan tint
    const dirLight = new THREE.DirectionalLight(0xd0f0ff, 1.2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
    sceneLights.push(dirLight);

    // Secondary directional light from opposite side
    const dirLight2 = new THREE.DirectionalLight(0xc0c0c0, 0.7);
    dirLight2.position.set(-5, 10, -5);
    scene.add(dirLight2);
    sceneLights.push(dirLight2);

    // Cyan point lights for chrome atmosphere
    const pointLight1 = new THREE.PointLight(0x00d4ff, 2, 35);
    pointLight1.position.set(5, 3, 5);
    pointLight1.castShadow = true;
    scene.add(pointLight1);
    sceneLights.push(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4a9eff, 2, 35);
    pointLight2.position.set(-5, 3, -5);
    pointLight2.castShadow = true;
    scene.add(pointLight2);
    sceneLights.push(pointLight2);

    const pointLight3 = new THREE.PointLight(0xc0c0c0, 1.5, 30);
    pointLight3.position.set(5, 2, -5);
    scene.add(pointLight3);
    sceneLights.push(pointLight3);

    const pointLight4 = new THREE.PointLight(0xe8e8e8, 1.5, 30);
    pointLight4.position.set(-5, 2, 5);
    scene.add(pointLight4);
    sceneLights.push(pointLight4);

    // Overhead spotlight with blue-white light
    const spotLight = new THREE.SpotLight(0xf0f8ff, 1.3);
    spotLight.position.set(0, 15, 0);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.3;
    spotLight.decay = 2;
    spotLight.distance = 50;
    spotLight.castShadow = true;
    scene.add(spotLight);
    sceneLights.push(spotLight);

    // Additional fill lights with chrome tones
    const fillLight1 = new THREE.PointLight(0xf5f5f5, 1, 25);
    fillLight1.position.set(0, 5, 10);
    scene.add(fillLight1);
    sceneLights.push(fillLight1);

    const fillLight2 = new THREE.PointLight(0xf5f5f5, 1, 25);
    fillLight2.position.set(0, 5, -10);
    scene.add(fillLight2);
    sceneLights.push(fillLight2);

    // Ground-level cyan rim lights
    const rimLight1 = new THREE.PointLight(0x00d4ff, 0.8, 18);
    rimLight1.position.set(8, 0.5, 0);
    scene.add(rimLight1);
    sceneLights.push(rimLight1);

    const rimLight2 = new THREE.PointLight(0x4a9eff, 0.8, 18);
    rimLight2.position.set(-8, 0.5, 0);
    scene.add(rimLight2);
    sceneLights.push(rimLight2);
}

// ======================
// GROUND PLANE
// ======================

function addGroundPlane() {
    // Create a large chrome/metallic ground plane
    const groundGeometry = new THREE.PlaneGeometry(150, 150);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.3,
        metalness: 0.8,
        envMapIntensity: 1.5
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add cyan grid for depth perception
    const gridHelper = new THREE.GridHelper(150, 75, 0x00d4ff, 0x4a9eff);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
}

// ======================
// INTERACTIVE MARKERS
// ======================

function createInteractiveMarkers() {
    const markerData = [
        { name: 'Home', panel: 'home-panel', color: 0x00d4ff, position: { x: 8, y: 2, z: 8 } },
        { name: 'About', panel: 'about-panel', color: 0x4a9eff, position: { x: -8, y: 2, z: 8 } },
        { name: 'Event Calendar', panel: 'event-panel', color: 0xc0c0c0, position: { x: 12, y: 2, z: 0 } },
        { name: 'Workshop', panel: 'workshop-panel', color: 0x00fff7, position: { x: 8, y: 2, z: -8 } },
        { name: 'Address', panel: 'address-panel', color: 0xff00ff, position: { x: -8, y: 2, z: -8 } },
        { name: 'Archives', panel: 'archives-panel', color: 0xffaa00, position: { x: -12, y: 2, z: 0 } },
        { name: 'Ritual Merch', panel: 'merch-panel', color: 0x00ff88, position: { x: 0, y: 2, z: 12 } },
        { name: '3D Design', panel: 'design-panel', color: 0xff0088, position: { x: 0, y: 2, z: -12 } }
    ];

    markerData.forEach(data => {
        createMarker(data.name, data.panel, data.color, data.position);
    });
}

function createMarker(name, panelId, color, position) {
    // Create marker group
    const markerGroup = new THREE.Group();
    markerGroup.position.set(position.x, position.y, position.z);
    markerGroup.userData = { panelId: panelId, name: name };

    // Create glowing sphere
    const sphereGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    markerGroup.add(sphere);

    // Create outer glow ring
    const ringGeometry = new THREE.TorusGeometry(1.2, 0.1, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    markerGroup.add(ring);

    // Add point light for glow effect
    const pointLight = new THREE.PointLight(color, 2, 10);
    pointLight.position.set(0, 0, 0);
    markerGroup.add(pointLight);

    // Create text sprite
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = 'Bold 48px RX100, Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(4, 1, 1);
    sprite.position.set(0, 2, 0);
    markerGroup.add(sprite);

    // Store references
    markerGroup.userData.sphere = sphere;
    markerGroup.userData.ring = ring;
    markerGroup.userData.originalColor = color;
    markerGroup.userData.originalEmissiveIntensity = 0.8;

    scene.add(markerGroup);
    interactiveMarkers.push(markerGroup);
}

function animateMarkers() {
    const time = Date.now() * 0.001;

    interactiveMarkers.forEach((marker, index) => {
        // Floating animation
        marker.position.y = marker.userData.originalY || marker.position.y;
        marker.userData.originalY = marker.userData.originalY || marker.position.y;
        marker.position.y = marker.userData.originalY + Math.sin(time * 2 + index) * 0.3;

        // Rotate ring
        if (marker.userData.ring) {
            marker.userData.ring.rotation.z += 0.02;
        }

        // Pulse sphere on hover
        if (marker === hoveredMarker && marker.userData.sphere) {
            const scale = 1 + Math.sin(time * 5) * 0.1;
            marker.userData.sphere.scale.set(scale, scale, scale);
            marker.userData.sphere.material.emissiveIntensity = 1.2;
        } else if (marker.userData.sphere) {
            marker.userData.sphere.scale.set(1, 1, 1);
            marker.userData.sphere.material.emissiveIntensity = marker.userData.originalEmissiveIntensity;
        }
    });
}

// ======================
// MODEL LOADING
// ======================

function loadModels() {
    // Setup GLTF loader with Draco support
    const loader = new THREE.GLTFLoader();

    // Setup Draco decoder for compressed models
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(dracoLoader);

    let modelsLoaded = 0;
    const totalModels = 1; // Only loading main.glb

    function checkAllModelsLoaded() {
        modelsLoaded++;
        if (modelsLoaded === totalModels) {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('scene-container').style.display = 'block';
            controls.lock();
            // Restart ambient sound for main scene at 35% volume for audible background
            playSound('ambient-sound', true, 0.5);
        }
    }

    // Load main model
    loader.load(
        'main.glb',
        (gltf) => {
            mainModel = gltf.scene;
            mainModel.position.set(0, 0, 0);
            mainModel.scale.set(1, 1, 1);

            // Calculate bounding box for debugging
            const box = new THREE.Box3().setFromObject(mainModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            console.log('=== MAIN MODEL DEBUG ===');
            console.log('Size:', size.x.toFixed(2), 'x', size.y.toFixed(2), 'x', size.z.toFixed(2));
            console.log('Center:', center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2));
            console.log('Bounding Box Min:', box.min);
            console.log('Bounding Box Max:', box.max);
            console.log('Children:', mainModel.children.length);

            // Add visible bounding box helper (green wireframe box)
            const boxHelper = new THREE.Box3Helper(box, 0x00ff00);
            scene.add(boxHelper);

            // Add axis helper at model center (RGB = XYZ)
            const axisHelper = new THREE.AxesHelper(10);
            axisHelper.position.copy(center);
            scene.add(axisHelper);

            let meshCount = 0;
            mainModel.traverse((child) => {
                if (child.isMesh) {
                    meshCount++;
                    child.castShadow = true;
                    child.receiveShadow = true;

                    console.log('Mesh #' + meshCount + ':', child.name || 'unnamed');
                    console.log('  Material:', child.material ? child.material.type : 'none');

                    // Enhance material brightness and visibility
                    if (child.material) {
                        // Force materials to be visible
                        child.material.transparent = false;
                        child.material.opacity = 1.0;
                        child.material.side = THREE.DoubleSide;

                        // Add emissive glow
                        child.material.emissive = new THREE.Color(0x444444);
                        child.material.emissiveIntensity = 0.5;

                        // Update material
                        child.material.needsUpdate = true;

                        console.log('  Updated material - Emissive: 0x444444, Intensity: 0.5');
                    }
                }
            });

            console.log('Total meshes found:', meshCount);

            scene.add(mainModel);

            // Add multiple bright lights around the model
            const modelLight1 = new THREE.PointLight(0xffffff, 4, 60);
            modelLight1.position.set(center.x, center.y + 10, center.z);
            scene.add(modelLight1);

            const modelLight2 = new THREE.PointLight(0xffffff, 3, 50);
            modelLight2.position.set(center.x + 10, center.y + 5, center.z + 10);
            scene.add(modelLight2);

            const modelLight3 = new THREE.PointLight(0xffffff, 3, 50);
            modelLight3.position.set(center.x - 10, center.y + 5, center.z - 10);
            scene.add(modelLight3);

            console.log('Camera position:', camera.position);
            console.log('Camera is looking at center:', center);
            console.log('Distance from camera to model:', camera.position.distanceTo(center).toFixed(2));
            console.log('===================');

            // Position camera to look at the model center
            camera.lookAt(center.x, center.y, center.z);

            checkAllModelsLoaded();
        },
        (xhr) => {
            console.log('Main model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading main model:', error);
            checkAllModelsLoaded();
        }
    );

}

// ======================
// CONTROLS
// ======================

function setupControls() {
    controls = new THREE.PointerLockControls(camera, document.body);

    controls.addEventListener('lock', () => {
        console.log('Controls locked');
    });

    controls.addEventListener('unlock', () => {
        console.log('Controls unlocked');
    });
}

// ======================
// EVENT LISTENERS
// ======================

function setupEventListeners() {
    // Keyboard
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Mouse and Touch
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    // Mobile touch events
    if (isMobile) {
        window.addEventListener('touchstart', onTouchStart, { passive: false });
        window.addEventListener('touchend', onTouchEnd, { passive: false });
        window.addEventListener('touchmove', onTouchMove, { passive: false });

        // Update instructions for mobile
        const instructions = document.getElementById('instructions');
        if (instructions) {
            instructions.querySelector('p').textContent = 'Tap to Look Around | Tap Markers to Interact | Swipe to Move';
        }
    }

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function onKeyDown(event) {
    // Check for Ctrl key combinations first
    if (event.ctrlKey) {
        switch (event.code) {
            case 'KeyF':
                event.preventDefault();
                toggleFlyingMode(true);
                return;
            case 'KeyW':
                event.preventDefault();
                toggleFlyingMode(false);
                return;
        }
    }

    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (isFlying) {
                event.preventDefault();
                moveUp = true;
            }
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            if (isFlying) {
                moveDown = true;
            }
            break;
        case 'KeyM':
            toggleLights();
            break;
    }

    // Easter egg: typing "RITUAL"
    if (!event.ctrlKey) {
        easterEggInput += event.key.toUpperCase();
        if (easterEggInput.length > 6) {
            easterEggInput = easterEggInput.slice(-6);
        }
        if (easterEggInput === 'RITUAL') {
            triggerEasterEgg();
            easterEggInput = '';
        }
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
        case 'Space':
            moveUp = false;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            moveDown = false;
            break;
    }
}

function onClick(event) {
    if (!canClick) return;

    // Check if clicking on UI elements
    if (event.target.tagName !== 'CANVAS') return;

    // Calculate mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast
    raycaster.setFromCamera(mouse, camera);

    // Check interactive markers first
    const markerObjects = [];
    interactiveMarkers.forEach(marker => {
        marker.traverse(child => {
            if (child.isMesh || child.isSprite) {
                markerObjects.push(child);
            }
        });
    });

    const markerIntersects = raycaster.intersectObjects(markerObjects, false);

    if (markerIntersects.length > 0) {
        // Find the marker group
        let clickedObject = markerIntersects[0].object;
        while (clickedObject.parent && !clickedObject.userData.panelId) {
            clickedObject = clickedObject.parent;
        }

        if (clickedObject.userData.panelId) {
            showPanel(clickedObject.userData.panelId);
            playSound('ritual-sound', false, 0.2);
            return;
        }
    }

    // Check other objects
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;

        // Check which model was clicked
        if (mainModel && isDescendant(object, mainModel)) {
            onMainModelClick();
        } else if (logoModel && isDescendant(object, logoModel)) {
            onLogoClick();
        }
    }
}

// Mouse move for hover effects
function onMouseMove(event) {
    if (!controls || !controls.isLocked) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const markerObjects = [];
    interactiveMarkers.forEach(marker => {
        marker.traverse(child => {
            if (child.isMesh || child.isSprite) {
                markerObjects.push(child);
            }
        });
    });

    const intersects = raycaster.intersectObjects(markerObjects, false);

    if (intersects.length > 0) {
        let hoveredObject = intersects[0].object;
        while (hoveredObject.parent && !hoveredObject.userData.panelId) {
            hoveredObject = hoveredObject.parent;
        }

        if (hoveredObject.userData.panelId) {
            hoveredMarker = hoveredObject;
            document.getElementById('interaction-hint').style.display = 'block';
            document.getElementById('hint-text').textContent = 'Click to view ' + hoveredObject.userData.name;
            return;
        }
    }

    hoveredMarker = null;
    document.getElementById('interaction-hint').style.display = 'none';
}

// Touch event handlers for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchMoveX = 0;
let touchMoveY = 0;

function onTouchStart(event) {
    if (!controls || !controls.isLocked) {
        // If not locked, tap to lock
        if (event.target.closest('.info-panel') || event.target.closest('button')) {
            return; // Don't interfere with UI interactions
        }
        return;
    }

    event.preventDefault();
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function onTouchMove(event) {
    if (!controls || !controls.isLocked) return;

    event.preventDefault();
    touchMoveX = event.touches[0].clientX;
    touchMoveY = event.touches[0].clientY;

    const deltaX = touchMoveX - touchStartX;
    const deltaY = touchMoveY - touchStartY;

    // Update camera rotation based on touch movement
    camera.rotation.y -= deltaX * 0.002;
    camera.rotation.x -= deltaY * 0.002;
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

    touchStartX = touchMoveX;
    touchStartY = touchMoveY;
}

function onTouchEnd(event) {
    // Simulate click for tap events on markers
    if (!controls || !controls.isLocked) return;

    const touch = event.changedTouches[0];
    const clickEvent = new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    onClick(clickEvent);
}

function isDescendant(child, parent) {
    let node = child;
    while (node) {
        if (node === parent) return true;
        node = node.parent;
    }
    return false;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (entryCamera && entryRenderer) {
        entryCamera.aspect = window.innerWidth / window.innerHeight;
        entryCamera.updateProjectionMatrix();
        entryRenderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// ======================
// INTERACTION HANDLERS
// ======================

function onMainModelClick() {
    // Trigger teleportation effect
    teleportEffect();
    playSound('portal-sound', false, 0.5);

    // Show random sigil quote
    setTimeout(() => {
        showSigilQuote();
    }, 500);
}

function onLogoClick() {
    // Show Patreon panel
    showPanel('patreon-panel');
    playSound('ritual-sound', false, 0.2);
}

function teleportEffect() {
    // Smooth camera movement to new position
    const newPosition = {
        x: (Math.random() - 0.5) * 10,
        y: 1.6,
        z: (Math.random() - 0.5) * 10
    };

    const startPosition = camera.position.clone();
    const duration = 1000; // ms
    const startTime = Date.now();

    function animateTeleport() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        camera.position.x = startPosition.x + (newPosition.x - startPosition.x) * progress;
        camera.position.z = startPosition.z + (newPosition.z - startPosition.z) * progress;

        if (progress < 1) {
            requestAnimationFrame(animateTeleport);
        }
    }

    animateTeleport();
}

function showSigilQuote() {
    const quote = sigilQuotes[Math.floor(Math.random() * sigilQuotes.length)];
    const popup = document.getElementById('quote-popup');
    const quoteText = document.getElementById('quote-text');

    quoteText.textContent = quote;
    popup.style.display = 'block';

    setTimeout(() => {
        popup.style.display = 'none';
    }, 3000);
}

function toggleLights() {
    lightsOn = !lightsOn;

    if (!lightsOn) {
        // Lights OFF - Dark mode with glowing markers
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 10, 50);

        // Turn off all scene lights
        sceneLights.forEach(light => {
            light.intensity = 0;
        });

        // Make interactive markers glow like stars
        interactiveMarkers.forEach(marker => {
            if (marker.userData.sphere) {
                marker.userData.sphere.material.emissiveIntensity = 3.5; // Much brighter
                marker.userData.sphere.material.roughness = 0.1;
            }
            if (marker.userData.ring) {
                marker.userData.ring.material.opacity = 1.0;
            }
            // Increase point light intensity in markers
            marker.traverse((child) => {
                if (child instanceof THREE.PointLight) {
                    child.intensity = 5; // Stronger glow
                    child.distance = 20;
                }
            });
        });

        // Play fullmoon sound in dark mode (only if not already playing)
        if (!fullmoonSoundPlaying) {
            playSound('fullmoon-sound', true, 0.25);
            fullmoonSoundPlaying = true;
        }

        console.log('Lights OFF - Markers glowing like stars');
    } else {
        // Lights ON - Restore normal lighting
        scene.background = new THREE.Color(0x0a0a0a);
        scene.fog = new THREE.Fog(0x0f0f15, 25, 120);

        // Restore all scene lights to original intensity
        sceneLights.forEach(light => {
            if (light instanceof THREE.AmbientLight) {
                light.intensity = 0.8;
            } else if (light instanceof THREE.HemisphereLight) {
                light.intensity = 0.6;
            } else if (light instanceof THREE.DirectionalLight) {
                if (light.color.getHex() === 0xd0f0ff) {
                    light.intensity = 1.2;
                } else {
                    light.intensity = 0.7;
                }
            } else if (light instanceof THREE.PointLight) {
                const hex = light.color.getHex();
                if (hex === 0x00d4ff || hex === 0x4a9eff) {
                    light.intensity = light.distance > 30 ? 2 : 0.8;
                } else if (hex === 0xc0c0c0 || hex === 0xe8e8e8 || hex === 0xf5f5f5) {
                    light.intensity = 1.5;
                }
            } else if (light instanceof THREE.SpotLight) {
                light.intensity = 1.3;
            }
        });

        // Return markers to normal glow
        interactiveMarkers.forEach(marker => {
            if (marker.userData.sphere) {
                marker.userData.sphere.material.emissiveIntensity = marker.userData.originalEmissiveIntensity || 0.8;
                marker.userData.sphere.material.roughness = 0.2;
            }
            if (marker.userData.ring) {
                marker.userData.ring.material.opacity = 0.6;
            }
            // Reset point light intensity in markers
            marker.traverse((child) => {
                if (child instanceof THREE.PointLight) {
                    child.intensity = 2;
                    child.distance = 10;
                }
            });
        });

        // Stop fullmoon sound when lights are on
        if (fullmoonSoundPlaying) {
            stopSound('fullmoon-sound');
            fullmoonSoundPlaying = false;
        }

        console.log('Lights ON - Normal lighting restored');
    }
}

function toggleFlyingMode(enableFlying) {
    isFlying = enableFlying;

    // Update instructions
    const instructions = document.getElementById('instructions');
    if (isFlying) {
        instructions.innerHTML = '<p>WASD - Move | Space - Up | Shift - Down | Mouse - Look | M - Full Moon | Ctrl+W - Walk Mode</p>';
        console.log('Flying Mode Enabled');
    } else {
        instructions.innerHTML = '<p>WASD - Move | Mouse - Look Around | M - Full Moon Mode | Ctrl+F - Fly Mode | Click - Interact</p>';
        console.log('Walking Mode Enabled');
        // Reset vertical movement when switching to walking
        moveUp = false;
        moveDown = false;
    }
}

function triggerEasterEgg() {
    // Show red mystical effect
    const easterEggDiv = document.getElementById('easter-egg-effect');
    easterEggDiv.style.display = 'block';

    // Add red lights
    const redLight1 = new THREE.PointLight(0xff0000, 5, 30);
    redLight1.position.set(0, 2, 0);
    scene.add(redLight1);

    const redLight2 = new THREE.PointLight(0xff0000, 5, 30);
    redLight2.position.set(5, 2, 5);
    scene.add(redLight2);

    // Play sound
    playSound('easteregg-sound', false, 0.5);

    // Remove effect after 1 second
    setTimeout(() => {
        easterEggDiv.style.display = 'none';
        scene.remove(redLight1);
        scene.remove(redLight2);
    }, 1000);
}

// ======================
// PANEL MANAGEMENT
// ======================

function showPanel(panelId) {
    // Unlock controls to show cursor
    if (controls.isLocked) {
        controls.unlock();
    }

    document.getElementById(panelId).style.display = 'block';
}

function closePanel(panelId) {
    document.getElementById(panelId).style.display = 'none';

    // Relock controls
    if (!controls.isLocked) {
        controls.lock();
    }
}

// Make closePanel global for HTML onclick
window.closePanel = closePanel;

// ======================
// PATREON ACCESS CODE
// ======================

function checkAccessCode() {
    const input = document.getElementById('access-code-input').value.toUpperCase();
    const validCode = 'FULLMOON'; // You can change this

    if (input === validCode) {
        secretRoomUnlocked = true;
        alert('✨ Secret Room Unlocked! Look for the hidden portal...');
        closePanel('patreon-panel');

        // Add secret room indicator
        const secretLight = new THREE.PointLight(0x00ff00, 2, 10);
        secretLight.position.set(10, 1, 10);
        scene.add(secretLight);
    } else {
        alert('❌ Invalid access code. Please check your Patreon for the correct code.');
    }
}

// Make checkAccessCode global for HTML onclick
window.checkAccessCode = checkAccessCode;

// ======================
// AUDIO MANAGEMENT
// ======================

function playSound(soundId, loop = false, volume = 1.0) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.volume = volume;
        sound.loop = loop;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

function stopSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.pause();
        sound.currentTime = 0;
        sound.loop = false;
    }
}


// ======================
// ANIMATION LOOP
// ======================

function animate() {
    requestAnimationFrame(animate);

    // Update controls
    if (controls && controls.isLocked) {
        const delta = 0.1;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= velocity.y * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.y = Number(moveUp) - Number(moveDown);
        direction.normalize();

        // Use the reduced movement speed
        if (moveForward || moveBackward) velocity.z -= direction.z * movementSpeed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * movementSpeed * delta;

        // Horizontal movement
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // Vertical movement (only in flying mode)
        if (isFlying) {
            if (moveUp || moveDown) velocity.y -= direction.y * movementSpeed * delta;
            camera.position.y += velocity.y * delta;
            // Allow free vertical movement in flying mode
            camera.position.y = Math.max(camera.position.y, 0.5); // Minimum height
        } else {
            // Keep camera at walking height in walking mode
            // Gradually move to walking height
            const targetHeight = 1.6;
            camera.position.y += (targetHeight - camera.position.y) * 0.1;
        }
    }

    // Animate interactive markers
    animateMarkers();

    // Render
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// ======================
// INITIALIZATION
// ======================

window.addEventListener('DOMContentLoaded', () => {
    initEntryScreen();
});
