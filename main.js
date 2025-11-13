// ======================
// RITUAL PENANG - WebGL Interactive Space
// ======================

// Global variables
let scene, camera, renderer, controls;
let mainModel, logoModel;
let raycaster, mouse;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let fullMoonMode = false;
let easterEggInput = '';
let secretRoomUnlocked = false;

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
// ENTRY SCREEN
// ======================

function initEntryScreen() {
    const canvas = document.getElementById('smoke-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Simple smoke effect with particles
    const particles = [];
    const particleCount = 50;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 100;
            this.size = Math.random() * 30 + 10;
            this.speedY = Math.random() * 1 + 0.5;
            this.opacity = Math.random() * 0.5;
        }

        update() {
            this.y -= this.speedY;
            this.opacity -= 0.002;

            if (this.y < -50 || this.opacity <= 0) {
                this.y = canvas.height + Math.random() * 100;
                this.opacity = Math.random() * 0.5;
            }
        }

        draw() {
            ctx.fillStyle = `rgba(255, 107, 107, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Animate smoke
    function animateSmoke() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        requestAnimationFrame(animateSmoke);
    }

    animateSmoke();

    // Handle sigil click
    document.getElementById('sigil-container').addEventListener('click', () => {
        document.getElementById('entry-screen').style.display = 'none';
        document.getElementById('loading-screen').style.display = 'flex';
        initRitualScene();
    });
}

// ======================
// THREE.JS SCENE SETUP
// ======================

function initRitualScene() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 10, 50);

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.6, 5);

    // Renderer
    const canvas = document.getElementById('ritual-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Raycaster for clicking
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lights
    setupLights();

    // Load models
    loadModels();

    // Controls (will be enabled after models load)
    setupControls();

    // Event listeners
    setupEventListeners();

    // Start animation
    animate();
}

// ======================
// LIGHTING
// ======================

function setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Point lights for ritual atmosphere
    const light1 = new THREE.PointLight(0xff6b6b, 1, 20);
    light1.position.set(5, 3, 5);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffd93d, 1, 20);
    light2.position.set(-5, 3, -5);
    scene.add(light2);

    // Directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(0, 10, 0);
    dirLight.castShadow = true;
    scene.add(dirLight);
}

// ======================
// MODEL LOADING
// ======================

function loadModels() {
    const loader = new THREE.GLTFLoader();
    let modelsLoaded = 0;
    const totalModels = 2;

    function checkAllModelsLoaded() {
        modelsLoaded++;
        if (modelsLoaded === totalModels) {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('scene-container').style.display = 'block';
            controls.lock();
            playAmbientSound();
        }
    }

    // Load main model
    loader.load(
        'main.glb',
        (gltf) => {
            mainModel = gltf.scene;
            mainModel.position.set(0, 0, 0);
            mainModel.scale.set(1, 1, 1);
            mainModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(mainModel);
            checkAllModelsLoaded();
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading main model:', error);
            checkAllModelsLoaded();
        }
    );

    // Load logo model
    loader.load(
        'rituallogo.glb',
        (gltf) => {
            logoModel = gltf.scene;
            logoModel.position.set(0, 2, -3);
            logoModel.scale.set(0.5, 0.5, 0.5);
            logoModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                }
            });
            scene.add(logoModel);

            // Add glow effect to logo
            const glowLight = new THREE.PointLight(0xffd93d, 2, 5);
            glowLight.position.copy(logoModel.position);
            scene.add(glowLight);

            checkAllModelsLoaded();
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading logo model:', error);
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

    // Mouse click
    window.addEventListener('click', onClick);

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function onKeyDown(event) {
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
        case 'KeyM':
            toggleFullMoonMode();
            break;
    }

    // Easter egg: typing "RITUAL"
    easterEggInput += event.key.toUpperCase();
    if (easterEggInput.length > 6) {
        easterEggInput = easterEggInput.slice(-6);
    }
    if (easterEggInput === 'RITUAL') {
        triggerEasterEgg();
        easterEggInput = '';
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

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;

        // Check which model was clicked
        if (mainModel && object.parent === mainModel) {
            onMainModelClick();
        } else if (logoModel && object.parent === logoModel) {
            onLogoClick();
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ======================
// INTERACTION HANDLERS
// ======================

function onMainModelClick() {
    // Trigger teleportation effect
    teleportEffect();
    playSound('portal-sound');

    // Show random sigil quote
    setTimeout(() => {
        showSigilQuote();
    }, 500);
}

function onLogoClick() {
    // Show Patreon panel
    showPanel('patreon-panel');
    playSound('ritual-sound');
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

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        camera.position.x = startPosition.x + (newPosition.x - startPosition.x) * progress;
        camera.position.z = startPosition.z + (newPosition.z - startPosition.z) * progress;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
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

function toggleFullMoonMode() {
    fullMoonMode = !fullMoonMode;

    if (fullMoonMode) {
        // Change to moonlight atmosphere
        scene.background = new THREE.Color(0x1a1a2e);
        scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

        // Increase ambient light
        scene.children.forEach(child => {
            if (child instanceof THREE.AmbientLight) {
                child.intensity = 0.8;
                child.color = new THREE.Color(0xaaccff);
            }
        });

        playSound('fullmoon-sound', true);
    } else {
        // Restore normal atmosphere
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 10, 50);

        scene.children.forEach(child => {
            if (child instanceof THREE.AmbientLight) {
                child.intensity = 0.3;
                child.color = new THREE.Color(0xffffff);
            }
        });

        stopSound('fullmoon-sound');
    }
}

function triggerEasterEgg() {
    // Show red mystical effect
    const easterEggDiv = document.getElementById('easter-egg-effect');
    easterEggDiv.style.display = 'block';

    // Add red lights
    const redLight1 = new THREE.PointLight(0xff0000, 3, 20);
    redLight1.position.set(0, 2, 0);
    scene.add(redLight1);

    const redLight2 = new THREE.PointLight(0xff0000, 3, 20);
    redLight2.position.set(5, 2, 5);
    scene.add(redLight2);

    // Play sound
    playSound('easteregg-sound');

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

        // Add secret room indicator (optional)
        // You could add a special glowing portal model here
    } else {
        alert('❌ Invalid access code. Please check your Patreon for the correct code.');
    }
}

// Make checkAccessCode global for HTML onclick
window.checkAccessCode = checkAccessCode;

// ======================
// AUDIO MANAGEMENT
// ======================

function playSound(soundId, loop = false) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.loop = loop;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

function stopSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.pause();
        sound.currentTime = 0;
    }
}

function playAmbientSound() {
    playSound('ambient-sound', true);
}

// ======================
// ANIMATION LOOP
// ======================

function animate() {
    requestAnimationFrame(animate);

    // Update controls
    if (controls.isLocked) {
        const delta = 0.1;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // Keep camera at reasonable height
        camera.position.y = Math.max(camera.position.y, 1.6);
    }

    // Rotate logo model slowly
    if (logoModel) {
        logoModel.rotation.y += 0.005;
    }

    // Render
    renderer.render(scene, camera);
}

// ======================
// INITIALIZATION
// ======================

window.addEventListener('DOMContentLoaded', () => {
    initEntryScreen();
});
