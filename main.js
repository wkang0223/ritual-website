// ======================
// RITUAL PENANG - WebGL Interactive Space
// ======================

// Debug log
console.log('✅ main.js starting...');

// Mobile detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);

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
let movementSpeed = 50;

// Interaction state
let canClick = true;

// Sigil quotes
const sigilQuotes = [
    "Ritual begins with listening.",
    "Drunken moonlight, when it ferments within you.",
    "The cycle returns with each full moon.",
    "In darkness we find our light.",
    "Sound is bridge between worlds, u & i",
    "Brew your intentions with extra care.",
    "The ritual is within you."
];

// ======================
// ENTRY SCREEN WITH 3D LOGO
// ======================

function initEntryScreen() {
    const canvas = document.getElementById('entry-canvas');
    if (!canvas) {
        console.error('❌ entry-canvas not found in HTML!');
        return;
    }

    entryScene = new THREE.Scene();
    entryScene.background = new THREE.Color(0x000000);

    entryCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    entryCamera.position.set(0, 0, 3);

    entryRenderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        alpha: true,
        powerPreference: "high-performance"
    });
    entryRenderer.setSize(window.innerWidth, window.innerHeight);
    entryRenderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

    // Lights for entry scene
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

    // Load logo (skip on mobile)
    if (!isMobile) {
        const loader = new THREE.GLTFLoader();
        loader.load(
            'rituallogo.glb',
            (gltf) => {
                if (!entryScene) {
                    console.warn('Entry scene cleaned up before logo loaded');
                    return;
                }
                
                entryLogoModel = gltf.scene;
                entryLogoModel.position.set(0, 0, 0);
                entryLogoModel.scale.set(1.5, 1.5, 1.5);
                entryScene.add(entryLogoModel);
                animateEntryScreen();
            },
            (xhr) => {
                console.log('Entry logo: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading entry logo:', error);
                animateEntryScreen();
            }
        );
    } else {
        console.log('Mobile detected: Skipping entry logo');
        animateEntryScreen();
    }

    document.getElementById('entry-screen').addEventListener('click', () => {
        playSound('wow-sound', true, 0.4);
        setTimeout(() => stopSound('wow-sound'), 500);

        cleanupEntryScene();
        document.getElementById('entry-screen').style.display = 'none';
        document.getElementById('loading-screen').style.display = 'flex';

        try {
            initRitualScene();
        } catch (error) {
            console.error('Error initializing main scene:', error);
        }
    });
}

function cleanupEntryScene() {
    if (entryLogoModel) {
        entryLogoModel.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        entryScene.remove(entryLogoModel);
        entryLogoModel = null;
    }

    if (entryRenderer) {
        entryRenderer.dispose();
        entryRenderer = null;
    }

    if (entryScene) {
        entryScene.clear();
        entryScene = null;
    }

    console.log('Entry scene cleaned up');
}

function animateEntryScreen() {
    if (!entryRenderer) return;
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
    if (typeof THREE === 'undefined') {
        console.error('❌ THREE.js is not loaded! Check your script tags.');
        return;
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0f0f15, 25, 120);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-5.66, 5.57, 10);

    const canvas = document.getElementById('ritual-canvas');
    if (!canvas) {
        console.error('❌ ritual-canvas not found in HTML!');
        return;
    }

    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false
    });

    if (isMobile) {
        const maxWidth = Math.min(window.innerWidth, 1280);
        const maxHeight = Math.min(window.innerHeight, 720);
        renderer.setSize(maxWidth, maxHeight);
        renderer.setPixelRatio(1);
        console.log(`Mobile: Canvas limited to ${maxWidth}x${maxHeight}`);
    } else {
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    renderer.shadowMap.enabled = !isMobile;
    if (!isMobile) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        console.error('WebGL context lost!');
        document.getElementById('loading-screen').innerHTML = '<p>Connection lost. Refreshing...</p>';
        setTimeout(() => window.location.reload(), 2000);
    }, false);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    setupLights();
    addGroundPlane();
    loadModels();
    createInteractiveMarkers();
    setupControls();
    setupEventListeners();

    animate();
    console.log('✅ Scene initialized');
}

// ======================
// LIGHTING
// ======================

function setupLights() {
    if (isMobile) {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);
        sceneLights.push(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xe8e8e8, 0xa8a8a8, 0.8);
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);
        sceneLights.push(hemiLight);

        console.log('Mobile: Simplified lighting');
        return;
    }

    const ambientLight = new THREE.AmbientLight(0xe8e8e8, 0.8);
    scene.add(ambientLight);
    sceneLights.push(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe8e8e8, 0xa8a8a8, 0.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    sceneLights.push(hemiLight);

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

    const pointLight1 = new THREE.PointLight(0x00d4ff, 2, 35);
    pointLight1.position.set(5, 3, 5);
    pointLight1.castShadow = true;
    scene.add(pointLight1);
    sceneLights.push(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4a9eff, 2, 35);
    pointLight2.position.set(-5, 3, -5);
    scene.add(pointLight2);
    sceneLights.push(pointLight2);
}

// ======================
// GROUND PLANE
// ======================

function addGroundPlane() {
    const groundGeometry = new THREE.PlaneGeometry(150, 150);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.3,
        metalness: 0.8,
        envMapIntensity: 1.5
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(150, 75, 0x00d4ff, 0x4a9eff);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
}

// ======================
// INTERACTIVE MARKERS
// ======================

function createInteractiveMarkers() {
    // ✅ FIX: Changed 'panel' to 'panelId'
    const markerData = [
        { name: 'Home', panelId: 'home-panel', color: 0x00d4ff, position: { x: 8, y: 3, z: 8 } },
        { name: 'About', panelId: 'about-panel', color: 0x4a9eff, position: { x: -8, y: 3, z: 8 } },
        { name: 'Event Calendar', panelId: 'event-panel', color: 0xc0c0c0, position: { x: 12, y: 3, z: 0 } },
        { name: 'Workshop', panelId: 'workshop-panel', color: 0x00fff7, position: { x: 8, y: 3, z: -8 } },
        { name: 'Address', panelId: 'address-panel', color: 0xff00ff, position: { x: -8, y: 3, z: -8 } },
        { name: 'Archives', panelId: 'archives-panel', color: 0xffaa00, position: { x: -12, y: 3, z: 0 } },
        { name: 'Ritual Merch', panelId: 'merch-panel', color: 0x00ff88, position: { x: 0, y: 3, z: 12 } },
        { name: '3D Design', panelId: 'design-panel', color: 0xff0088, position: { x: 0, y: 3, z: -12 } }
    ];

    markerData.forEach(data => {
        createMarker(data.name, data.panelId, data.color, data.position);
    });
}

function createMarker(name, panelId, color, position) {
    const markerGroup = new THREE.Group();
    markerGroup.position.set(position.x, position.y, position.z);
    markerGroup.userData = { panelId: panelId, name: name, modelLoaded: false };

    const loader = new THREE.GLTFLoader();
    loader.load(
        'marker.glb', // ✅ This must exist in your repo root
        (gltf) => {
            const model = gltf.scene;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material = new THREE.MeshStandardMaterial({
                        color: color,
                        emissive: color,
                        emissiveIntensity: 0.6,
                        roughness: 0.8,
                        metalness: 0.8,
                        map: child.material.map || null
                    });
                }
            });

            markerGroup.userData.model = model;
            markerGroup.userData.modelLoaded = true;
            markerGroup.add(model);
            setupModelAnimations(markerGroup);
        },
        (progress) => {
            console.log(`Loading ${name}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
        },
        (error) => {
            console.error(`Error loading model for ${name}:`, error);
            createFallbackSphere(markerGroup, color);
        }
    );

    const ringGeometry = new THREE.TorusGeometry(1.2, 0.1, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    markerGroup.add(ring);

    const pointLight = new THREE.PointLight(color, 2, 10);
    markerGroup.add(pointLight);

    const crystal = createCrystalForMarker(name, color);
    crystal.position.set(0, 3.5, 0);
    markerGroup.add(crystal);

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

    markerGroup.userData.ring = ring;
    markerGroup.userData.crystal = crystal;
    markerGroup.userData.originalColor = color;
    markerGroup.userData.originalEmissiveIntensity = 0.8;

    scene.add(markerGroup);
    interactiveMarkers.push(markerGroup);
}

function createFallbackSphere(markerGroup, color) {
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
    markerGroup.userData.model = sphere;
    markerGroup.userData.modelLoaded = true;
}

function setupModelAnimations(markerGroup) {
    const rotations = {
        'Home': { x: 0, y: 0.01, z: 0 },
        'About': { x: 0.01, y: 0.01, z: 0 },
        'Event Calendar': { x: 0.02, y: 0.01, z: 0 },
        'Workshop': { x: 0.03, y: 0.01, z: 0 },
        'Address': { x: 0.04, y: 0.01, z: 0 },
        'Archives': { x: 0.05, y: 0.01, z: 0 },
        'Ritual Merch': { x: 0.06, y: 0.01, z: 0 },
        '3D Design': { x: 0.07, y: 0.01, z: 0 },
    };
    const rotation = rotations[markerGroup.userData.name] || { x: 0, y: 0.01, z: 0 };
    markerGroup.userData.modelRotation = rotation;
}

function createCrystalForMarker(markerName, color) {
    let geometry;
    switch(markerName) {
        case 'Home': geometry = new THREE.OctahedronGeometry(0.6, 0); break;
        case 'About': geometry = new THREE.IcosahedronGeometry(0.6, 0); break;
        case 'Event Calendar': geometry = new THREE.TetrahedronGeometry(0.6, 0); break;
        case 'Workshop': geometry = new THREE.DodecahedronGeometry(0.6, 0); break;
        case 'Address': geometry = new THREE.ConeGeometry(0.5, 1.2, 6); break;
        case 'Archives': geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8); break;
        case 'Ritual Merch': geometry = new THREE.TorusGeometry(0.5, 0.2, 8, 16); break;
        case '3D Design': geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 6); break;
        default: geometry = new THREE.OctahedronGeometry(0.6, 0);
    }

    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.4,
        metalness: 0.9,
        transparent: true,
        opacity: 0.9
    });

    const crystal = new THREE.Mesh(geometry, material);
    crystal.castShadow = true;
    return crystal;
}

function animateMarkers() {
    const time = Date.now() * 0.001;
    interactiveMarkers.forEach((marker, index) => {
        marker.userData.originalY = marker.userData.originalY || marker.position.y;
        marker.position.y = marker.userData.originalY + Math.sin(time * 2 + index) * 0.3;

        if (marker.userData.ring) {
            marker.userData.ring.rotation.z += 0.02;
        }

        if (marker.userData.crystal) {
            marker.userData.crystal.rotation.y += 0.01;
            marker.userData.crystal.rotation.x = Math.sin(time + index) * 0.1;
            marker.userData.crystal.rotation.z = Math.cos(time + index) * 0.1;
            const bounceOffset = Math.sin(time * 3 + index * 0.5) * 0.15;
            marker.userData.crystal.position.y = 3.5 + bounceOffset;

            if (marker === hoveredMarker) {
                marker.userData.crystal.material.emissiveIntensity = 0.8 + Math.sin(time * 5) * 0.2;
            } else {
                marker.userData.crystal.material.emissiveIntensity = 0.6;
            }
        }

        if (marker.userData.model && marker.userData.modelLoaded) {
            if (marker === hoveredMarker) {
                const scale = 1 + Math.sin(time * 5) * 0.1;
                marker.userData.model.scale.set(scale, scale, scale);
                marker.userData.model.traverse((child) => {
                    if (child.isMesh) {
                        child.material.emissiveIntensity = 1.2;
                    }
                });
            } else {
                marker.userData.model.scale.set(1, 1, 1);
                marker.userData.model.traverse((child) => {
                    if (child.isMesh) {
                        child.material.emissiveIntensity = marker.userData.originalEmissiveIntensity;
                    }
                });
            }

            if (marker.userData.modelRotation) {
                const rot = marker.userData.modelRotation;
                marker.userData.model.rotation.x += rot.x;
                marker.userData.model.rotation.y += rot.y;
                marker.userData.model.rotation.z += rot.z;
            }
        }
    });
}

// ======================
// MODEL LOADING
// ======================

function loadModels() {
    const loader = new THREE.GLTFLoader();
    const dracoLoader = new THREE.DRACOLoader();
    
    // ✅ FIX: Removed trailing space
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(dracoLoader);

    let modelsLoaded = 0;
    const totalModels = 1; // ✅ FIX: Changed from 4 to 1

    function checkAllModelsLoaded() {
        modelsLoaded++;
        if (modelsLoaded === totalModels) {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('scene-container').style.display = 'block';
            
            // ✅ FIX: Defer pointer lock to avoid error
            setTimeout(() => {
                if (controls) controls.lock();
            }, 100);
            
            playSound('ambient-sound', true, 0.5);
        }
    }

    loader.load(
        'main.glb',
        (gltf) => {
            mainModel = gltf.scene;
            mainModel.position.set(0, 0, 0);
            mainModel.scale.set(1, 1, 1);

            const box = new THREE.Box3().setFromObject(mainModel);
            const center = box.getCenter(new THREE.Vector3());
            console.log('Main model loaded. Center:', center);

            mainModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.transparent = false;
                        child.material.opacity = 1.0;
                        child.material.side = THREE.DoubleSide;
                        child.material.emissive = new THREE.Color(0x444444);
                        child.material.emissiveIntensity = 0.5;
                        child.material.needsUpdate = true;
                    }
                }
            });

            scene.add(mainModel);
            const modelLight1 = new THREE.PointLight(0xffffff, 4, 60);
            modelLight1.position.set(center.x, center.y + 10, center.z);
            scene.add(modelLight1);

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
// CONTROLS & EVENTS
// ======================

function setupControls() {
    controls = new THREE.PointerLockControls(camera, document.body);
    controls.addEventListener('lock', () => console.log('Controls locked'));
    controls.addEventListener('unlock', () => console.log('Controls unlocked'));
}

function setupEventListeners() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    if (isMobile) {
        window.addEventListener('touchstart', onTouchStart, { passive: false });
        window.addEventListener('touchend', onTouchEnd, { passive: false });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
    }

    window.addEventListener('resize', onWindowResize);
}

function onKeyDown(event) {
    if (event.ctrlKey) {
        switch (event.code) {
            case 'KeyF': event.preventDefault(); toggleFlyingMode(true); return;
            case 'KeyW': event.preventDefault(); toggleFlyingMode(false); return;
        }
    }

    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = true; break;
        case 'Space': if (isFlying) { event.preventDefault(); moveUp = true; } break;
        case 'ShiftLeft':
        case 'ShiftRight': if (isFlying) moveDown = true; break;
        case 'KeyM': toggleLights(); break;
    }

    if (!event.ctrlKey) {
        easterEggInput += event.key.toUpperCase();
        if (easterEggInput.length > 6) easterEggInput = easterEggInput.slice(-6);
        if (easterEggInput === 'RITUAL') {
            triggerEasterEgg();
            easterEggInput = '';
        }
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = false; break;
        case 'Space': moveUp = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': moveDown = false; break;
    }
}

function onClick(event) {
    if (!canClick) return;
    if (event.target.tagName !== 'CANVAS') return;

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

    const markerIntersects = raycaster.intersectObjects(markerObjects, false);

    if (markerIntersects.length > 0) {
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

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (mainModel && isDescendant(object, mainModel)) {
            onMainModelClick();
        } else if (logoModel && isDescendant(object, logoModel)) {
            onLogoClick();
        }
    }
}

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
            const hint = document.getElementById('interaction-hint');
            const hintText = document.getElementById('hint-text');
            if (hint && hintText) {
                hint.style.display = 'block';
                hintText.textContent = 'Click to view ' + hoveredObject.userData.name;
            }
            return;
        }
    }

    hoveredMarker = null;
    const hint = document.getElementById('interaction-hint');
    if (hint) hint.style.display = 'none';
}

// Touch handlers for mobile
let touchStartX = 0, touchStartY = 0;

function onTouchStart(event) {
    if (!controls || !controls.isLocked) return;
    event.preventDefault();
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function onTouchMove(event) {
    if (!controls || !controls.isLocked) return;
    event.preventDefault();
    const touchMoveX = event.touches[0].clientX;
    const touchMoveY = event.touches[0].clientY;
    const deltaX = touchMoveX - touchStartX;
    const deltaY = touchMoveY - touchStartY;

    camera.rotation.y -= deltaX * 0.002;
    camera.rotation.x -= deltaY * 0.002;
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

    touchStartX = touchMoveX;
    touchStartY = touchMoveY;
}

function onTouchEnd(event) {
    if (!controls || !controls.isLocked) return;
    const touch = event.changedTouches[0];
    const clickEvent = new MouseEvent('click', { clientX: touch.clientX, clientY: touch.clientY });
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
    teleportEffect();
    playSound('portal-sound', false, 0.4);
    setTimeout(() => showSigilQuote(), 500);
}

function onLogoClick() {
    showPanel('patreon-panel');
    playSound('ritual-sound', false, 0.2);
}

function teleportEffect() {
    const newPosition = {
        x: (Math.random() - 0.5) * 10,
        y: 1.6,
        z: (Math.random() - 0.5) * 10
    };

    const startPosition = camera.position.clone();
    const duration = 1000;
    const startTime = Date.now();

    function animateTeleport() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        camera.position.x = startPosition.x + (newPosition.x - startPosition.x) * progress;
        camera.position.z = startPosition.z + (newPosition.z - startPosition.z) * progress;
        if (progress < 1) requestAnimationFrame(animateTeleport);
    }

    animateTeleport();
}

function showSigilQuote() {
    const quote = sigilQuotes[Math.floor(Math.random() * sigilQuotes.length)];
    const popup = document.getElementById('quote-popup');
    const quoteText = document.getElementById('quote-text');
    if (popup && quoteText) {
        quoteText.textContent = quote;
        popup.style.display = 'block';
        setTimeout(() => popup.style.display = 'none', 3000);
    }
}

function toggleLights() {
    lightsOn = !lightsOn;

    if (!lightsOn) {
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 10, 50);
        sceneLights.forEach(light => { light.intensity = 0; });

        interactiveMarkers.forEach(marker => {
            if (marker.userData.model) {
                marker.userData.model.traverse((child) => {
                    if (child.isMesh) {
                        child.material.emissiveIntensity = 3.5;
                    }
                });
            }
            marker.traverse((child) => {
                if (child instanceof THREE.PointLight) {
                    child.intensity = 5;
                    child.distance = 20;
                }
            });
        });

        if (!fullmoonSoundPlaying) {
            playSound('fullmoon-sound', true, 0.25);
            fullmoonSoundPlaying = true;
        }
    } else {
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
        
        if (fullmoonSoundPlaying) {
            stopSound('fullmoon-sound');
            fullmoonSoundPlaying = false;
        }
    }
}

function toggleFlyingMode(enableFlying) {
    isFlying = enableFlying;
    const instructions = document.getElementById('instructions');
    if (instructions) {
        if (isFlying) {
            instructions.innerHTML = '<p>WASD - Move | Space - Up | Shift - Down | Mouse - Look | M - Full Moon | Ctrl+W - Walk Mode</p>';
        } else {
            instructions.innerHTML = '<p>WASD - Move | Mouse - Look Around | M - Full Moon Mode | Ctrl+F - Fly Mode | Click - Interact</p>';
            moveUp = false;
            moveDown = false;
        }
    }
}

function triggerEasterEgg() {
    const easterEggDiv = document.getElementById('easter-egg-effect');
    if (easterEggDiv) easterEggDiv.style.display = 'block';

    const redLight1 = new THREE.PointLight(0xff0000, 5, 30);
    redLight1.position.set(0, 2, 0);
    scene.add(redLight1);

    const redLight2 = new THREE.PointLight(0xff0000, 5, 30);
    redLight2.position.set(5, 2, 5);
    scene.add(redLight2);

    playSound('easteregg-sound', false, 0.4);

    setTimeout(() => {
        if (easterEggDiv) easterEggDiv.style.display = 'none';
        scene.remove(redLight1);
        scene.remove(redLight2);
    }, 1000);
}

// ======================
// PANEL MANAGEMENT
// ======================

function showPanel(panelId) {
    if (controls.isLocked) controls.unlock();
    const panel = document.getElementById(panelId);
    if (panel) panel.style.display = 'block';
}

function closePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) panel.style.display = 'none';
    if (!controls.isLocked) controls.lock();
}

// Make global for HTML onclick
window.closePanel = closePanel;

// ======================
// PATREON ACCESS CODE
// ======================

function checkAccessCode() {
    const input = document.getElementById('access-code-input');
    const validCode = 'FULLMOON';
    if (input && input.value.toUpperCase() === validCode) {
        secretRoomUnlocked = true;
        alert('✨ Secret Room Unlocked! Look for the hidden portal...');
        closePanel('patreon-panel');
        const secretLight = new THREE.PointLight(0x00ff00, 2, 10);
        secretLight.position.set(10, 1, 10);
        scene.add(secretLight);
    } else {
        alert('❌ Invalid access code. Check your Patreon for the correct code.');
    }
}

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
    } else {
        console.warn(`Audio element '${soundId}' not found`);
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

    if (controls && controls.isLocked) {
        const delta = 0.1;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= velocity.y * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.y = Number(moveUp) - Number(moveDown);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * movementSpeed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * movementSpeed * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        if (isFlying) {
            if (moveUp || moveDown) velocity.y -= direction.y * movementSpeed * delta;
            camera.position.y += velocity.y * delta;
            camera.position.y = Math.max(camera.position.y, 0.5);
        } else {
            const targetHeight = 1.8;
            camera.position.y += (targetHeight - camera.position.y) * 0.1;
        }
    }

    animateMarkers();

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// ======================
// INITIALIZATION
// ======================

window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing entry screen...');
    initEntryScreen();
});
