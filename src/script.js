import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { gsap } from "gsap";
import { Capsule } from "three/examples/jsm/math/Capsule.js";
import { buildBasement as buildBasementRoom1 } from "./rooms/hallway.js";
import { buildLabs } from "./rooms/labs.js";
import { buildChairmanOffice } from "./rooms/chairmanOffice.js";
import { buildDorm } from "./rooms/dorm.js";
import { buildCommonRoom } from "./rooms/commonRoom.js";
import { buildBasement } from "./rooms/basement.js";

/**
 * DOM references
 */
const canvas = document.querySelector("canvas.webgl");
const loadingBarElement = document.querySelector(".loading-bar");
const instructionsElement = document.getElementById("instructions");
const batteryFillElement = document.getElementById("battery-fill");
const timerElement = document.getElementById("timer");
const centerPromptElement = document.getElementById("center-prompt");
const interactionPromptElement = document.getElementById("interaction-prompt");
const riddleOverlayElement = document.getElementById("riddle-overlay");
const riddleQuestionElement = document.getElementById("riddle-question");
const riddleAnswerElement = document.getElementById("riddle-answer");
const riddleSubmitButton = document.getElementById("riddle-submit");
const riddleCloseButton = document.getElementById("riddle-close");
const deathScreenElement = document.getElementById("death-screen");
const restartButton = document.getElementById("restart-button");
const victoryScreenElement = document.getElementById("victory-screen");

/**
 * Game state
 */
const state = {
    gameStarted: false,
    flashlightOn: false,
    battery: 1,
    batteryDrainRate: 0,
    timeRemaining: 999 * 60,
    hoveredInteraction: null,
    riddleActive: false,
    currentRiddle: null,
    gameOver: false,
    activeRoomIndex: 0,
    centerPromptTimeout: null,
    thirdPersonView: false,
};

/**
 * Loaders
 */
const loadingManager = new THREE.LoadingManager(
    () => {
        window.setTimeout(() => {
            loadingBarElement.classList.add("ended");
            loadingBarElement.style.transform = "";
        }, 400);
    },
    (itemUrl, itemsLoaded, itemsTotal) => {
        const progressRatio = itemsLoaded / itemsTotal;
        loadingBarElement.style.transform = `translate(-50%, -50%) scaleX(${progressRatio})`;
    }
);

// Textures removed for clean scene

/**
 * Scene setup
 */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9E917E);
scene.fog = new THREE.FogExp2(0x9E917E, 0.03);

/**
 * Player configuration
 */
const PLAYER_HEIGHT = 1.8;
const PLAYER_EYE_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.35;
const THIRD_PERSON_DISTANCE = 3.0;
const THIRD_PERSON_HEIGHT = 1.5;
const THIRD_PERSON_PITCH_OFFSET = THREE.MathUtils.degToRad(-10);
const CAMERA_BLEND_DURATION = 1.0;
const PLAYER_MOVE_SPEED = 3.25;
const PLAYER_AIR_MOVE_SPEED = 2.4;
const PLAYER_JUMP_VELOCITY = 6.2;
const GRAVITY = 18.0;
const PLAYER_COLLISION_LAYERS = new Set(["Ground", "Furniture", "Walls"]);

const camera = new THREE.PerspectiveCamera(
    72,
    window.innerWidth / window.innerHeight,
    0.1,
    220
);
camera.position.set(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const playerRoot = new THREE.Group();
playerRoot.name = "PlayerRoot";
playerRoot.position.set(0, PLAYER_HEIGHT, 0);
scene.add(playerRoot);

const cameraPivot = new THREE.Group();
cameraPivot.name = "CameraPivot";
cameraPivot.position.set(0, PLAYER_EYE_HEIGHT - PLAYER_HEIGHT, 0);
playerRoot.add(cameraPivot);
cameraPivot.add(camera);

const ghostAnchor = new THREE.Group();
ghostAnchor.name = "GhostAnchor";
ghostAnchor.position.set(0, -PLAYER_HEIGHT, 0);
playerRoot.add(ghostAnchor);

const playerCollider = new Capsule(
    new THREE.Vector3(0, PLAYER_RADIUS, 0),
    new THREE.Vector3(0, PLAYER_HEIGHT - PLAYER_RADIUS, 0),
    PLAYER_RADIUS
);

const playerState = {
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(),
    verticalVelocity: 0,
    onGround: true,
};

let playerYaw = 0;
let playerPitch = 0;
let pointerLocked = false;

const playerHeadOffset = new THREE.Vector3(0, PLAYER_HEIGHT, 0);
const upVector = new THREE.Vector3(0, 1, 0);
const previousPlayerPosition = new THREE.Vector3();
const playerWorldPosition = new THREE.Vector3();
const cameraPivotWorld = new THREE.Vector3();
const cameraWorldPosition = new THREE.Vector3();
const cameraLocalDirection = new THREE.Vector3();
const cameraRayDirection = new THREE.Vector3();
const cameraCollisionRay = new THREE.Raycaster();
const capsuleCenter = new THREE.Vector3();
const closestPoint = new THREE.Vector3();
const boxWorld = new THREE.Box3();
const collisionResolution = new THREE.Vector3();

const firstPersonOffset = new THREE.Vector3(0, 0, 0);
const thirdPersonOffset = new THREE.Vector3(
    0,
    THIRD_PERSON_HEIGHT - PLAYER_EYE_HEIGHT,
    THIRD_PERSON_DISTANCE
);
const currentCameraOffset = firstPersonOffset.clone();
let currentPitchOffset = 0;
const cameraBlendState = {
    active: false,
    start: performance.now(),
    fromOffset: firstPersonOffset.clone(),
    toOffset: firstPersonOffset.clone(),
    fromPitchOffset: 0,
    toPitchOffset: 0,
};

function beginCameraBlend(targetOffset, targetPitchOffset) {
    cameraBlendState.active = true;
    cameraBlendState.start = performance.now();
    cameraBlendState.fromOffset.copy(currentCameraOffset);
    cameraBlendState.toOffset.copy(targetOffset);
    cameraBlendState.fromPitchOffset = currentPitchOffset;
    cameraBlendState.toPitchOffset = targetPitchOffset;
}

function updateCameraRig() {
    if (cameraBlendState.active) {
        const elapsedSeconds = (performance.now() - cameraBlendState.start) / 1000;
        const duration = CAMERA_BLEND_DURATION;
        const t = Math.min(elapsedSeconds / duration, 1);
        const eased = THREE.MathUtils.smootherstep(t, 0, 1);
        currentCameraOffset.copy(cameraBlendState.fromOffset).lerp(cameraBlendState.toOffset, eased);
        currentPitchOffset = THREE.MathUtils.lerp(
            cameraBlendState.fromPitchOffset,
            cameraBlendState.toPitchOffset,
            eased
        );
        if (t >= 1) {
            cameraBlendState.active = false;
        }
    }
    camera.position.copy(currentCameraOffset);
    cameraPivot.rotation.x = playerPitch + currentPitchOffset;

    cameraPivot.getWorldPosition(cameraPivotWorld);
    camera.getWorldPosition(cameraWorldPosition);

    if (state.thirdPersonView && collisionMeshes.length > 0) {
        cameraRayDirection.subVectors(cameraWorldPosition, cameraPivotWorld);
        const desiredDistance = cameraRayDirection.length();
        if (desiredDistance > 0.05) {
            cameraRayDirection.normalize();
            cameraCollisionRay.set(cameraPivotWorld, cameraRayDirection);
            cameraCollisionRay.far = desiredDistance;
            const intersections = cameraCollisionRay.intersectObjects(collisionMeshes, false);
            if (intersections.length > 0 && intersections[0].distance < desiredDistance) {
                const desiredLocalLength = currentCameraOffset.length();
                const safeDistance = Math.max(
                    Math.min(intersections[0].distance - 0.25, desiredLocalLength),
                    0.35
                );
                if (desiredLocalLength > 0.0001) {
                    cameraLocalDirection.copy(currentCameraOffset).normalize().multiplyScalar(safeDistance);
                    camera.position.copy(cameraLocalDirection);
                    camera.getWorldPosition(cameraWorldPosition);
                }
            }
        }
    }
}

function setCameraView(thirdPerson) {
    if (state.thirdPersonView === thirdPerson) {
        return;
    }
    state.thirdPersonView = thirdPerson;
    ghostPlayer.visible = thirdPerson;
    beginCameraBlend(thirdPerson ? thirdPersonOffset : firstPersonOffset, thirdPerson ? THIRD_PERSON_PITCH_OFFSET : 0);
}

function toggleCameraView() {
    setCameraView(!state.thirdPersonView);
}

function updatePlayerColliderFromState() {
    playerCollider.start.set(
        playerState.position.x,
        playerState.position.y + PLAYER_RADIUS,
        playerState.position.z
    );
    playerCollider.end.set(
        playerState.position.x,
        playerState.position.y + PLAYER_HEIGHT - PLAYER_RADIUS,
        playerState.position.z
    );
}

function syncPlayerTransforms() {
    updatePlayerColliderFromState();
    playerRoot.position.set(
        playerState.position.x,
        playerState.position.y + PLAYER_HEIGHT,
        playerState.position.z
    );
    playerRoot.rotation.y = playerYaw;
    playerWorldPosition.copy(playerState.position).add(playerHeadOffset);
}

function resetPlayerTransform() {
    playerState.position.set(0, 0, 0);
    playerState.velocity.set(0, 0, 0);
    playerState.verticalVelocity = 0;
    playerState.onGround = true;
    previousPlayerPosition.copy(playerState.position);
    playerYaw = 0;
    playerPitch = 0;
    state.thirdPersonView = false;
    ghostPlayer.visible = false;
    currentCameraOffset.copy(firstPersonOffset);
    currentPitchOffset = 0;
    cameraBlendState.active = false;
    syncPlayerTransforms();
    updateCameraRig();
}

function requestPointerLock() {
    if (pointerLocked) {
        return;
    }
    document.body.requestPointerLock();
}

function releasePointerLock() {
    if (!pointerLocked) {
        return;
    }
    document.exitPointerLock();
}

function handlePointerLockChange() {
    pointerLocked = document.pointerLockElement === document.body;
    if (pointerLocked) {
        instructionsElement.classList.add("hidden");
    } else if (!state.riddleActive && !state.gameOver) {
        instructionsElement.classList.remove("hidden");
        movement.forward = false;
        movement.backward = false;
        movement.left = false;
        movement.right = false;
        movement.jump = false;
    }
}

const MIN_PITCH = THREE.MathUtils.degToRad(-80);
const MAX_PITCH = THREE.MathUtils.degToRad(80);
const LOOK_SENSITIVITY = 0.002;

function handlePointerMove(event) {
    if (!pointerLocked || state.gameOver) {
        return;
    }
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    playerYaw -= movementX * LOOK_SENSITIVITY;
    playerPitch = THREE.MathUtils.clamp(playerPitch - movementY * LOOK_SENSITIVITY, MIN_PITCH, MAX_PITCH);
    playerRoot.rotation.y = playerYaw;
    updateCameraRig();
}

document.addEventListener("pointerlockchange", handlePointerLockChange);
document.addEventListener("pointerlockerror", () => {
    console.error("Unable to acquire pointer lock.");
});
document.addEventListener("mousemove", handlePointerMove);

/**
 * Ghost Player Character
 */
const ghostMaterial = new THREE.MeshStandardMaterial({
    color: 0xB8C2C4,
    transparent: true,
    opacity: 0.45,
    emissive: 0x9fb4ba,
    emissiveIntensity: 0.18,
    roughness: 0.78,
    metalness: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
});

const ghostPlayer = new THREE.Group();
ghostPlayer.name = "GhostPlayer";

const ghostBody = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 1.3, 24), ghostMaterial);
ghostBody.position.y = 0.65;
ghostPlayer.add(ghostBody);

const ghostHem = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.35, 24, 1, true), ghostMaterial);
ghostHem.position.y = 0.175;
ghostHem.rotation.x = Math.PI;
ghostPlayer.add(ghostHem);

const ghostHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 24), ghostMaterial);
ghostHead.position.y = 1.55;
ghostPlayer.add(ghostHead);

const armGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.55, 12);
const leftArm = new THREE.Mesh(armGeometry, ghostMaterial);
leftArm.position.set(-0.38, 1.05, 0.05);
leftArm.rotation.z = Math.PI / 5;
ghostPlayer.add(leftArm);

const rightArm = leftArm.clone();
rightArm.position.x *= -1;
rightArm.rotation.z *= -1;
ghostPlayer.add(rightArm);

ghostPlayer.traverse((child) => {
    if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
    }
});

ghostPlayer.visible = false;
ghostAnchor.add(ghostPlayer);

resetPlayerTransform();

/**
 * Lighting
 */
// Warm key light (adjusted for taller ceiling)
const keyLight = new THREE.DirectionalLight(0xC2A87B, 0.35);
keyLight.position.set(5, 12, 3);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 80;
keyLight.shadow.camera.left = -15;
keyLight.shadow.camera.right = 15;
keyLight.shadow.camera.top = 20;
keyLight.shadow.camera.bottom = -20;
scene.add(keyLight);

// Dim fill light (adjusted for taller ceiling)
const fillLight = new THREE.DirectionalLight(0xB0A18A, 0.2);
fillLight.position.set(-3, 10, -2);
scene.add(fillLight);

// Ambient occlusion effect (simulated with low ambient)
const ambientLight = new THREE.AmbientLight(0x9E917E, 0.08);
scene.add(ambientLight);

const flashlight = new THREE.SpotLight(0xaad1ff, 3.2, 18, THREE.MathUtils.degToRad(24), 0.45, 1);
flashlight.castShadow = true;
flashlight.shadow.mapSize.set(1024, 1024);
flashlight.shadow.bias = -0.00012;
flashlight.position.set(0, 0, 0);
flashlight.intensity = 0;
camera.add(flashlight);

const flashlightTarget = new THREE.Object3D();
flashlightTarget.position.set(0, 0, -1);
camera.add(flashlightTarget);
flashlight.target = flashlightTarget;

const flickerLights = [];

/**
 * Geometry helpers
 */
const roomsData = [];
const doors = [];
const keys = [];
const riddleNodes = [];
const interactables = [];
const collisionMeshes = [];

function registerCollisionMesh(mesh, layer) {
    mesh.userData = mesh.userData || {};
    mesh.userData.collisionLayer = layer;
    if (mesh.geometry && !mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox();
    }
    collisionMeshes.push(mesh);
}

const defaultRoomSize = new THREE.Vector3(9.2, 8, 13.2); // 15% wider, 10% deeper, 2x height

const roomBlueprints = [
    {
        name: "Basement",
        position: new THREE.Vector3(0, 0, 0),
        keyPosition: new THREE.Vector3(-2.2, -defaultRoomSize.y / 2 + 0.55, 2.9),
        riddlePosition: new THREE.Vector3(2.6, -defaultRoomSize.y / 2 + 0.55, -1.4),
        riddle: {
            question: "Three shadows march, yet only one is real. Which remains when the light is gone?",
            answer: "shadow",
        },
        nextRoomIndex: 1,
    },
    {
        name: "Library of Whispers",
        position: new THREE.Vector3(0, 0, -15),
        keyPosition: new THREE.Vector3(1.8, -defaultRoomSize.y / 2 + 0.55, -2.8),
        riddlePosition: new THREE.Vector3(-2.4, -defaultRoomSize.y / 2 + 0.55, 1.8),
        riddle: {
            question: "Glass eyes watch in rows. One blinks and lies. Which one hides the truth?",
            answer: "middle",
        },
        nextRoomIndex: 2,
    },
    {
        name: "Chairman’s Office",
        position: new THREE.Vector3(0, 0, -30),
        keyPosition: new THREE.Vector3(-1.6, -defaultRoomSize.y / 2 + 0.55, 3.1),
        riddlePosition: new THREE.Vector3(2.3, -defaultRoomSize.y / 2 + 0.55, -2.2),
        riddle: {
            question: "Five portraits whisper dates. Only one wears a crimson tie. What color is the truth?",
            answer: "crimson",
        },
        nextRoomIndex: 3,
    },
    {
        name: "Private Chamber",
        position: new THREE.Vector3(0, 0, -45),
        keyPosition: new THREE.Vector3(2.5, -defaultRoomSize.y / 2 + 0.55, -1.4),
        riddlePosition: new THREE.Vector3(-2.7, -defaultRoomSize.y / 2 + 0.55, 1.5),
        riddle: {
            question: "Four beds breathe slowly. One is still and cold. Which number will not wake?",
            answer: "four",
        },
        nextRoomIndex: 4,
    },
    {
        name: "Common Room",
        position: new THREE.Vector3(0, 0, -60),
        keyPosition: new THREE.Vector3(-1.9, -defaultRoomSize.y / 2 + 0.55, -2.4),
        riddlePosition: new THREE.Vector3(2.1, -defaultRoomSize.y / 2 + 0.55, 2.1),
        riddle: {
            question: "Three bottles stand upright. One lies flat—where is truth?",
            answer: "floor",
        },
        nextRoomIndex: 5,
    },
    {
        name: "Basement",
        position: new THREE.Vector3(0, 0, -75),
        keyPosition: new THREE.Vector3(0, -defaultRoomSize.y / 2 + 0.55, 0),
        riddlePosition: new THREE.Vector3(0, -defaultRoomSize.y / 2 + 0.55, -2.4),
        riddle: {
            question: "The last door hums with quiet dread. What word will still it?",
            answer: "silence",
        },
        nextRoomIndex: null,
    },
];

/**
 * Materials - basic placeholders, will be updated in Step 3-4
 */
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x4A3B2D,
    roughness: 0.6,
    metalness: 0.0,
});

const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x6B5E54,
    roughness: 0.7,
    metalness: 0.0,
});

const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x7B6E64,
    roughness: 0.7,
    metalness: 0.0,
});

/**
 * Utility vectors
 */
const tempVec3 = new THREE.Vector3();
const tempVec2 = new THREE.Vector2();

/**
 * Audio
 */
let audioContext = null;
let ambientGain = null;
let ambientSource = null;

function ensureAudioContext() {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
}

function startAmbientBed() {
    if (!audioContext || ambientSource) {
        return;
    }

    // Faint wind through window (constant, soft)
    const length = audioContext.sampleRate * 12;
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;

    for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        const wind = Math.sin(i * 0.00006) * 0.06;
        data[i] = (lastOut + 0.012 * white) / 1.012;
        lastOut = data[i];
        data[i] = (data[i] * 0.18 + wind) * 0.6;
    }

    ambientSource = audioContext.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    ambientGain = audioContext.createGain();
    ambientGain.gain.value = 0.0;

    ambientSource.connect(ambientGain);
    ambientGain.connect(audioContext.destination);

    ambientSource.start();
    gsap.to(ambientGain.gain, { value: 0.14, duration: 5, ease: "power1.inOut" });

    // Wood creaking occasionally (random timing)
    setInterval(() => {
        if (!audioContext || state.gameOver) return;
        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(110 + Math.random() * 50, now);
        osc.frequency.linearRampToValueAtTime(90 + Math.random() * 40, now + 0.35);
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.009, now + 0.06);
        gain.gain.linearRampToValueAtTime(0.005, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain).connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    }, 4000 + Math.random() * 5000);

    // Light dripping in background (distant, subtle)
    setInterval(() => {
        if (!audioContext || state.gameOver) return;
        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 550;
        osc.type = "sine";
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.09);
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.012, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(filter).connect(gain).connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.16);
    }, 6000 + Math.random() * 6000);
}

function playUnlockSound() {
    if (!audioContext) {
        return;
    }
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 1.2);
    gain.gain.value = 0.0;
    gain.gain.linearRampToValueAtTime(0.22, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 1.6);
}

/**
 * Helpers
 */
function showCenterPrompt(message, duration = 2.6) {
    centerPromptElement.textContent = message;
    centerPromptElement.classList.add("visible");
    if (state.centerPromptTimeout) {
        window.clearTimeout(state.centerPromptTimeout);
    }
    state.centerPromptTimeout = window.setTimeout(() => {
        centerPromptElement.classList.remove("visible");
    }, duration * 1000);
}

function updateBatteryUI() {
    const clamped = Math.max(state.battery, 0);
    batteryFillElement.style.width = `${clamped * 100}%`;
    if (clamped > 0.35) {
        batteryFillElement.style.background = "linear-gradient(90deg, #428ef6, #69b0ff)";
    } else if (clamped > 0.15) {
        batteryFillElement.style.background = "linear-gradient(90deg, #ffb85c, #ff7c54)";
    } else {
        batteryFillElement.style.background = "linear-gradient(90deg, #ff6b6b, #d7385e)";
    }
}

function updateTimerUI() {
    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = Math.floor(state.timeRemaining % 60);
    const formatted = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    timerElement.textContent = formatted;
}

function createGlowSprite(color = 0x355fff, scaleX = 1.4, scaleY = 3.2) {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    const rgb = new THREE.Color(color);
    gradient.addColorStop(0, `rgba(${rgb.r * 255}, ${rgb.g * 255}, ${rgb.b * 255}, 0.55)`);
    gradient.addColorStop(0.35, `rgba(${rgb.r * 255}, ${rgb.g * 255}, ${rgb.b * 255}, 0.18)`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(scaleX, scaleY, 1);
    sprite.material.opacity = 0.55;
    return sprite;
}

function registerInteractable(object3d) {
    interactables.push(object3d);
}

window.spawnHeartFragment = function spawnHeartFragment() {
    const currentRoom = roomsData[state.activeRoomIndex];
    if (!currentRoom) return;
    
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.3, -0.15, 0.3, -0.15, 0.15);
    heartShape.bezierCurveTo(-0.15, 0, -0.15, -0.1, 0, -0.3);
    heartShape.bezierCurveTo(0.15, -0.1, 0.15, 0, 0.15, 0.15);
    heartShape.bezierCurveTo(0.15, 0.3, 0, 0.3, 0, 0.2);
    
    const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 };
    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    
    const heart = new THREE.Mesh(
        heartGeometry,
        new THREE.MeshStandardMaterial({ 
            color: 0xFF0000, 
            emissive: 0xFF0000, 
            emissiveIntensity: 0.8 
        })
    );
    heart.position.set(0, -currentRoom.size.y / 2 + 1.5, 0);
    heart.rotation.y = Math.PI;
    heart.scale.set(3, 3, 3);
    heart.userData.type = "heart_fragment";
    heart.userData.prompt = "Press E to collect Heart Fragment";
    currentRoom.group.add(heart);
    registerInteractable(heart);
    
    const heartLight = new THREE.PointLight(0xFF0000, 1, 5);
    heartLight.position.set(0, 0.2, 0);
    heart.add(heartLight);
    
    showCenterPrompt("A Heart Fragment appears!", 3);
}

function transitionToRoom(targetIndex, showTitle = true) {
    if (typeof targetIndex !== "number") {
        return false;
    }
    if (targetIndex < 0 || targetIndex >= roomsData.length) {
        return false;
    }
    const nextRoom = roomsData[targetIndex];
    if (!nextRoom) {
        return false;
    }
    playerState.position.set(
        nextRoom.group.position.x,
        nextRoom.floorY,
        nextRoom.group.position.z + 4
    );
    previousPlayerPosition.copy(playerState.position);
    updatePlayerColliderFromState();
    syncPlayerTransforms();
    state.activeRoomIndex = targetIndex;
    if (showTitle) {
        showCenterPrompt(nextRoom.name, 3);
    }
    return true;
}

function transitionToRoomByName(name, showTitle = true) {
    if (!name) {
        return false;
    }
    const targetIndex = roomsData.findIndex((room) => {
        if (!room || !room.group) return false;
        return room.name === name || room.group.name === name;
    });
    if (targetIndex === -1) {
        return false;
    }
    return transitionToRoom(targetIndex, showTitle);
}

window.__transitionToRoom = transitionToRoom;
window.__transitionToRoomByName = (name, showTitle = true) => transitionToRoomByName(name, showTitle);
window.showCenterPrompt = showCenterPrompt;
window.transitionToRoom = transitionToRoomByName;
window.state = state;

// Checklist functionality
window.markChecklistItem = function(itemId) {
    const item = document.getElementById(itemId);
    if (item && !item.classList.contains('completed')) {
        item.classList.add('completed');
        const checkbox = item.querySelector('.checkbox');
        if (checkbox) {
            checkbox.textContent = '☑';
        }
    }
};

function buildRoom(blueprint, index) {
    const group = new THREE.Group();
    group.name = blueprint.name;
    const size = blueprint.size ? blueprint.size.clone() : defaultRoomSize.clone();
    group.position.copy(blueprint.position);
    group.position.y += size.y / 2;
    scene.add(group);
    const floorY = group.position.y - size.y / 2;

    const floorMat = floorMaterial.clone();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.z), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -size.y / 2;
    floor.receiveShadow = true;
    group.add(floor);
    registerCollisionMesh(floor, "Ground");

    const ceilingMat = ceilingMaterial.clone();
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.z), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = size.y / 2;
    ceiling.receiveShadow = false;
    ceiling.castShadow = false;
    group.add(ceiling);

    // Add large window on back wall (first room only for now)
    if (index === 0) {
        const windowFrame = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 2.5, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 })
        );
        windowFrame.position.set(0, 0.3, size.z / 2 - 0.05);
        group.add(windowFrame);

        // Window glass
        const windowGlass = new THREE.Mesh(
            new THREE.PlaneGeometry(3.2, 2.2),
            new THREE.MeshStandardMaterial({
                color: 0x6a7a8a,
                transparent: true,
                opacity: 0.3,
                roughness: 0.1,
            })
        );
        windowGlass.position.set(0, 0.3, size.z / 2 - 0.01);
        group.add(windowGlass);

        // Left shutter (half-open)
        const leftShutter = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 2.2, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x4a3828, roughness: 0.85 })
        );
        leftShutter.position.set(-2.2, 0.3, size.z / 2 - 0.02);
        leftShutter.rotation.y = -Math.PI / 6;
        group.add(leftShutter);

        // Right shutter (half-open)
        const rightShutter = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 2.2, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x4a3828, roughness: 0.85 })
        );
        rightShutter.position.set(2.2, 0.3, size.z / 2 - 0.02);
        rightShutter.rotation.y = Math.PI / 6;
        group.add(rightShutter);
    }

    // Add cobwebs in corners
    const cobwebPositions = [
        [-size.x / 2 + 0.3, size.y / 2 - 0.3, -size.z / 2 + 0.3],
        [size.x / 2 - 0.3, size.y / 2 - 0.3, -size.z / 2 + 0.3],
        [-size.x / 2 + 0.3, size.y / 2 - 0.3, size.z / 2 - 0.3],
        [size.x / 2 - 0.3, size.y / 2 - 0.3, size.z / 2 - 0.3],
    ];

    cobwebPositions.forEach(([x, y, z]) => {
        const cobweb = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 0.6),
            new THREE.MeshStandardMaterial({
                color: 0xb0a898,
                roughness: 0.9,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide,
            })
        );
        cobweb.position.set(x, y, z);
        cobweb.rotation.set(
            Math.random() * 0.5,
            Math.random() * Math.PI * 2,
            Math.random() * 0.5
        );
        group.add(cobweb);
    });

    const wallPairs = [
        { axis: "z", offset: -size.z / 2, rotationY: 0 },
        { axis: "z", offset: size.z / 2, rotationY: Math.PI },
        { axis: "x", offset: -size.x / 2, rotationY: Math.PI / 2 },
        { axis: "x", offset: size.x / 2, rotationY: -Math.PI / 2 },
    ];

    wallPairs.forEach((info) => {
        const wallMat = wallMaterial.clone();
        // Adjust texture tiling for taller walls
        const wall = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.y), wallMat);
        wall.castShadow = true;
        wall.receiveShadow = true;
        if (info.axis === "z") {
            wall.geometry = new THREE.PlaneGeometry(size.x, size.y);
            wall.position.set(0, 0, info.offset);
        } else {
            wall.geometry = new THREE.PlaneGeometry(size.z, size.y);
            wall.position.set(info.offset, 0, 0);
        }
        wall.rotation.y = info.rotationY;
        group.add(wall);
        registerCollisionMesh(wall, "Walls");

        // Add blended stains - mid-tone (#8B7E74)
        for (let i = 0; i < 2; i++) {
            const stain1 = new THREE.Mesh(
                new THREE.CircleGeometry(0.4 + Math.random() * 0.5, 16),
                new THREE.MeshStandardMaterial({
                    color: 0x8B7E74,
                    roughness: 0.7,
                    transparent: true,
                    opacity: 0.5,
                })
            );
            stain1.position.copy(wall.position);
            stain1.rotation.copy(wall.rotation);
            if (info.axis === "z") {
                stain1.position.x += (Math.random() - 0.5) * size.x * 0.7;
                stain1.position.y += (Math.random() - 0.5) * size.y * 0.7;
                stain1.position.z += info.offset > 0 ? -0.01 : 0.01;
            } else {
                stain1.position.z += (Math.random() - 0.5) * size.z * 0.7;
                stain1.position.y += (Math.random() - 0.5) * size.y * 0.7;
                stain1.position.x += info.offset > 0 ? -0.01 : 0.01;
            }
            group.add(stain1);
        }

        // Add dark grime (#514941)
        for (let i = 0; i < 2; i++) {
            const stain2 = new THREE.Mesh(
                new THREE.CircleGeometry(0.3 + Math.random() * 0.4, 16),
                new THREE.MeshStandardMaterial({
                    color: 0x514941,
                    roughness: 0.7,
                    transparent: true,
                    opacity: 0.6,
                })
            );
            stain2.position.copy(wall.position);
            stain2.rotation.copy(wall.rotation);
            if (info.axis === "z") {
                stain2.position.x += (Math.random() - 0.5) * size.x * 0.8;
                stain2.position.y += (Math.random() - 0.5) * size.y * 0.6;
                stain2.position.z += info.offset > 0 ? -0.01 : 0.01;
            } else {
                stain2.position.z += (Math.random() - 0.5) * size.z * 0.8;
                stain2.position.y += (Math.random() - 0.5) * size.y * 0.6;
                stain2.position.x += info.offset > 0 ? -0.01 : 0.01;
            }
            group.add(stain2);
        }

        // Add light faded patches (#A49B8F)
        for (let i = 0; i < 1; i++) {
            const stain3 = new THREE.Mesh(
                new THREE.CircleGeometry(0.5 + Math.random() * 0.6, 16),
                new THREE.MeshStandardMaterial({
                    color: 0xA49B8F,
                    roughness: 0.7,
                    transparent: true,
                    opacity: 0.4,
                })
            );
            stain3.position.copy(wall.position);
            stain3.rotation.copy(wall.rotation);
            if (info.axis === "z") {
                stain3.position.x += (Math.random() - 0.5) * size.x * 0.6;
                stain3.position.y += (Math.random() - 0.5) * size.y * 0.5;
                stain3.position.z += info.offset > 0 ? -0.01 : 0.01;
            } else {
                stain3.position.z += (Math.random() - 0.5) * size.z * 0.6;
                stain3.position.y += (Math.random() - 0.5) * size.y * 0.5;
                stain3.position.x += info.offset > 0 ? -0.01 : 0.01;
            }
            group.add(stain3);
        }
    });

    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        new THREE.MeshStandardMaterial({
            color: 0xc8b898,
            emissive: 0x6a5438,
            emissiveIntensity: 0.3,
            roughness: 0.8,
            metalness: 0.0,
        })
    );
    bulb.position.set(0, size.y / 2 - 0.4, 0);
    bulb.castShadow = false;
    bulb.receiveShadow = false;
    group.add(bulb);

    const bulbLight = new THREE.PointLight(0x8a7a5a, 0.5, 18, 2.0);
    bulbLight.position.set(0, -0.1, 0);
    bulbLight.castShadow = true;
    bulb.add(bulbLight);

    const doorWidth = 1.8;
    const doorHeight = index === 1 ? size.y * 0.95 : 2.6;
    const doorPivot = new THREE.Group();
    doorPivot.position.set(0, -size.y / 2 + doorHeight / 2, -size.z / 2 + 0.12);
    group.add(doorPivot);

    const doorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, doorHeight, 0.14),
        new THREE.MeshStandardMaterial({
            color: index === 1 ? 0x8B6F47 : 0x4a3828,
            roughness: 0.92,
            metalness: 0.0,
        })
    );
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    doorMesh.position.set(doorWidth / 2, 0, 0);
    doorPivot.add(doorMesh);
    registerCollisionMesh(doorMesh, "Walls");

    // Door knob
    const doorKnob = new THREE.Mesh(
        new THREE.SphereGeometry(index === 1 ? 0.15 : 0.08, 16, 16),
        new THREE.MeshStandardMaterial({
            color: index === 1 ? 0xFFD700 : 0x8a7a5a,
            roughness: index === 1 ? 0.2 : 0.6,
            metalness: index === 1 ? 0.9 : 0.5,
        })
    );
    doorKnob.position.set(doorWidth * 0.4, 0, 0.08);
    doorMesh.add(doorKnob);

    const doorGlow = createGlowSprite(0x6a5438, 0.8, 1.8);
    doorGlow.position.set(0.3, 0, 0.3);
    doorGlow.material.opacity = 0.1;
    doorPivot.add(doorGlow);

    const doorData = {
        type: "door",
        roomIndex: index,
        locked: true,
        mesh: doorMesh,
        pivot: doorPivot,
        glow: doorGlow,
        range: 3.0,
        label: `${blueprint.name} Door`,
        nextRoomIndex: blueprint.nextRoomIndex,
        opened: false,
    };
    doorPivot.userData = doorData;
    doors.push(doorPivot);
    registerInteractable(doorPivot);

    const key = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.22, 1),
        new THREE.MeshStandardMaterial({
            color: 0xdcc374,
            emissive: 0x8a6322,
            emissiveIntensity: 0.55,
            metalness: 0.85,
            roughness: 0.25,
        })
    );
    key.position.copy(blueprint.keyPosition);
    key.castShadow = true;
    key.visible = false;
    key.userData = {
        type: "key",
        roomIndex: index,
        active: false,
        targetDoorIndex: index,
        range: 3.0,
        label: `${blueprint.name} Key`,
    };
    group.add(key);
    keys.push(key);
    registerInteractable(key);

    const keyLight = new THREE.PointLight(0xf6d58a, 0.5, 4, 2);
    keyLight.position.set(0, 0.1, 0);
    key.add(keyLight);

    const riddleMesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.28, 0.08, 80, 10),
        new THREE.MeshStandardMaterial({
            color: 0x1a2330,
            roughness: 0.4,
            metalness: 0.65,
            emissive: 0x123450,
            emissiveIntensity: 0.4,
        })
    );
    riddleMesh.castShadow = true;
    riddleMesh.position.copy(blueprint.riddlePosition);
    riddleMesh.userData = {
        type: "riddle",
        roomIndex: index,
        range: 3.0,
        label: `${blueprint.name} Relic`,
        question: blueprint.riddle.question,
        answer: blueprint.riddle.answer.toLowerCase(),
        solved: false,
    };
    riddleMesh.visible = (index !== 0);
    group.add(riddleMesh);
    riddleNodes.push(riddleMesh);
    if (index !== 0) {
        registerInteractable(riddleMesh);
    }

    const coldLight = new THREE.PointLight(0x6a5f4a, 0.2, 20, 2.0);
    coldLight.position.set(0, size.y / 2 - 1, 1.5);
    group.add(coldLight);

    const warmLight = new THREE.PointLight(0x7a6a4a, 0.25, 16, 2.0);
    warmLight.position.set(-2.4 + Math.random() * 4.8, 0.8, -2.4 + Math.random() * 4.8);
    group.add(warmLight);

    flickerLights.push({
        light: coldLight,
        baseIntensity: 0.15 + Math.random() * 0.1,
        speed: 0.8 + Math.random() * 0.6,
        offset: Math.random() * Math.PI * 2,
    });
    flickerLights.push({
        light: warmLight,
        baseIntensity: 0.2 + Math.random() * 0.1,
        speed: 1.2 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2,
    });

    const bounds = {
        minX: blueprint.position.x - size.x / 2 + 0.7,
        maxX: blueprint.position.x + size.x / 2 - 0.7,
        minZ: blueprint.position.z - size.z / 2 + 0.9,
        maxZ: blueprint.position.z + size.z / 2 - 0.9,
    };

    // Call appropriate room builder based on index
    if (index === 0) {
        buildBasementRoom1(group, size, registerInteractable);
    } else if (index === 1) {
        buildLabs(group, size, registerInteractable);
    } else if (index === 2) {
        buildChairmanOffice(group, size, registerInteractable);
    } else if (index === 3) {
        buildDorm(group, size, registerInteractable);
    } else if (index === 4) {
        buildCommonRoom(group, size, registerInteractable);
    } else if (index === 5) {
        buildBasement(group, size, registerInteractable);
    }

    // OLD CODE - keeping for reference, will be removed
    if (false && index === 0) {
        // Large wooden desk against back wall
        const deskTop = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 0.12, 1.5),
            new THREE.MeshStandardMaterial({ 
                color: 0x5A4636, 
                roughness: 0.8, 
                metalness: 0.0 
            })
        );
    deskTop.position.set(0, -size.y / 2 + 0.85, size.z / 2 - 2);
    deskTop.castShadow = true;
    group.add(deskTop);
    registerCollisionMesh(deskTop, "Furniture");

        const legGeometry = new THREE.BoxGeometry(0.12, 0.75, 0.12);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 });
        [[-1.5, 0.65], [1.5, 0.65], [-1.5, -0.65], [1.5, -0.65]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x, -size.y / 2 + 0.38, size.z / 2 - 2 + z);
            leg.castShadow = true;
            group.add(leg);
        });

        // Chair behind desk
        const chair1Seat = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.08, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
        );
        chair1Seat.position.set(0, -size.y / 2 + 0.5, size.z / 2 - 3.2);
        chair1Seat.castShadow = true;
        group.add(chair1Seat);

        const chair1Back = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.8, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
        );
        chair1Back.position.set(0, -size.y / 2 + 0.9, size.z / 2 - 3.45);
        chair1Back.castShadow = true;
        group.add(chair1Back);

        // Tilted chair off to side
        const chair2Seat = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.08, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
        );
        chair2Seat.position.set(3, -size.y / 2 + 0.35, 2);
        chair2Seat.rotation.z = Math.PI / 8;
        chair2Seat.rotation.y = Math.PI / 6;
        chair2Seat.castShadow = true;
        group.add(chair2Seat);

        const chair2Back = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.8, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
        );
        chair2Back.position.set(3, -size.y / 2 + 0.7, 1.75);
        chair2Back.rotation.z = Math.PI / 8;
        chair2Back.rotation.y = Math.PI / 6;
        chair2Back.castShadow = true;
        group.add(chair2Back);

        // Two tall bookcases beside window (taller for new ceiling)
        const bookcase1 = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 4.5, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
        );
    bookcase1.position.set(-2.5, -size.y / 2 + 2.25, size.z / 2 - 0.5);
    bookcase1.castShadow = true;
    group.add(bookcase1);
    registerCollisionMesh(bookcase1, "Furniture");

        const bookcase2 = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 4.5, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
        );
    bookcase2.position.set(2.5, -size.y / 2 + 2.25, size.z / 2 - 0.5);
    bookcase2.castShadow = true;
    group.add(bookcase2);
    registerCollisionMesh(bookcase2, "Furniture");

        // Books on shelves (half-filled, some fallen, more shelves for taller bookcase)
        for (let shelf = 0; shelf < 5; shelf++) {
            for (let i = 0; i < 4; i++) {
                const book = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.25, 0.15),
                    new THREE.MeshStandardMaterial({ 
                        color: [0x5A4636, 0x4A3828, 0x6A5848, 0x3A2818][i % 4],
                        roughness: 0.85 
                    })
                );
                book.position.set(
                    -2.5 + (i - 2) * 0.2,
                    -size.y / 2 + 0.5 + shelf * 0.8,
                    size.z / 2 - 0.5
                );
                book.rotation.y = (Math.random() - 0.5) * 0.3;
                group.add(book);
            }
        }

        // Small side table near right wall
        const sideTable = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.08, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
        );
    sideTable.position.set(size.x / 2 - 1.5, -size.y / 2 + 0.6, 0);
    sideTable.castShadow = true;
    group.add(sideTable);
    registerCollisionMesh(sideTable, "Furniture");

        // Table legs
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
                new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
            );
            const x = i % 2 === 0 ? -0.3 : 0.3;
            const z = i < 2 ? -0.3 : 0.3;
            leg.position.set(size.x / 2 - 1.5 + x, -size.y / 2 + 0.3, z);
            leg.castShadow = true;
            group.add(leg);
        }

        // Cracked cup on table
        const cup = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.05, 0.12, 16),
            new THREE.MeshStandardMaterial({ color: 0x8A7A6A, roughness: 0.7 })
        );
        cup.position.set(size.x / 2 - 1.6, -size.y / 2 + 0.7, 0.1);
        cup.castShadow = true;
        group.add(cup);

        // Parchment on table
        const parchment = new THREE.Mesh(
            new THREE.PlaneGeometry(0.25, 0.3),
            new THREE.MeshStandardMaterial({ color: 0xD8D0C0, roughness: 0.9 })
        );
        parchment.rotation.x = -Math.PI / 2;
        parchment.rotation.z = Math.PI / 8;
        parchment.position.set(size.x / 2 - 1.4, -size.y / 2 + 0.65, -0.1);
        group.add(parchment);

        // Worn rug under desk
        const rug = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 2.5),
            new THREE.MeshStandardMaterial({ color: 0x3E3A34, roughness: 0.95 })
        );
        rug.rotation.x = -Math.PI / 2;
        rug.position.set(0, -size.y / 2 + 0.01, size.z / 2 - 2);
        rug.receiveShadow = true;
        group.add(rug);

        // Crooked painting on left wall
        const paintingFrame = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 1, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x3A2818, roughness: 0.8 })
        );
        paintingFrame.position.set(-size.x / 2 + 0.1, 0.5, 0);
        paintingFrame.rotation.y = Math.PI / 2;
        paintingFrame.rotation.z = -Math.PI / 16;
        paintingFrame.castShadow = true;
        group.add(paintingFrame);

        const paintingCanvas = new THREE.Mesh(
            new THREE.PlaneGeometry(0.7, 0.9),
            new THREE.MeshStandardMaterial({ color: 0x6A5A4A, roughness: 0.7 })
        );
        paintingCanvas.position.set(-size.x / 2 + 0.08, 0.5, 0);
        paintingCanvas.rotation.y = Math.PI / 2;
        paintingCanvas.rotation.z = -Math.PI / 16;
        group.add(paintingCanvas);

        // Scattered papers on desk
        for (let i = 0; i < 6; i++) {
            const paper = new THREE.Mesh(
                new THREE.PlaneGeometry(0.15, 0.2),
                new THREE.MeshStandardMaterial({ color: 0xD8D0C0, roughness: 0.9 })
            );
            paper.rotation.x = -Math.PI / 2;
            paper.rotation.z = Math.random() * Math.PI * 2;
            paper.position.set(
                (Math.random() - 0.5) * 2.5,
                -size.y / 2 + 0.98,
                size.z / 2 - 2 + (Math.random() - 0.5) * 1
            );
            group.add(paper);
        }

        // Old lamp on desk
        const lampBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 0.15, 16),
            new THREE.MeshStandardMaterial({ color: 0x4A3828, roughness: 0.7, metalness: 0.3 })
        );
        lampBase.position.set(-1, -size.y / 2 + 1.05, size.z / 2 - 2.2);
        lampBase.castShadow = true;
        group.add(lampBase);

        const lampShade = new THREE.Mesh(
            new THREE.ConeGeometry(0.15, 0.2, 16),
            new THREE.MeshStandardMaterial({ color: 0x6A5A4A, roughness: 0.8 })
        );
        lampShade.position.set(-1, -size.y / 2 + 1.25, size.z / 2 - 2.2);
        lampShade.castShadow = true;
        group.add(lampShade);

        // Ink bottle on desk
        const inkBottle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.1, 16),
            new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.3 })
        );
        inkBottle.position.set(0.8, -size.y / 2 + 1.0, size.z / 2 - 1.8);
        inkBottle.castShadow = true;
        group.add(inkBottle);

        // Cobwebs in room corners
        const cobwebPositions = [
            [-size.x / 2 + 0.3, size.y / 2 - 0.3, -size.z / 2 + 0.3],
            [size.x / 2 - 0.3, size.y / 2 - 0.3, -size.z / 2 + 0.3],
            [-size.x / 2 + 0.3, size.y / 2 - 0.3, size.z / 2 - 0.3],
            [size.x / 2 - 0.3, size.y / 2 - 0.3, size.z / 2 - 0.3],
        ];

        cobwebPositions.forEach(([x, y, z]) => {
            const cobweb = new THREE.Mesh(
                new THREE.PlaneGeometry(0.8, 0.8),
                new THREE.MeshStandardMaterial({
                    color: 0xB0A898,
                    roughness: 0.9,
                    transparent: true,
                    opacity: 0.25,
                    side: THREE.DoubleSide,
                })
            );
            cobweb.position.set(x, y, z);
            cobweb.rotation.set(
                Math.random() * 0.5,
                Math.random() * Math.PI * 2,
                Math.random() * 0.5
            );
            group.add(cobweb);
        });

        // Cobwebs between bookcase shelves
        for (let i = 0; i < 3; i++) {
            const cobweb = new THREE.Mesh(
                new THREE.PlaneGeometry(0.4, 0.4),
                new THREE.MeshStandardMaterial({
                    color: 0xB0A898,
                    roughness: 0.9,
                    transparent: true,
                    opacity: 0.2,
                    side: THREE.DoubleSide,
                })
            );
            cobweb.position.set(-2.5, -size.y / 2 + 1 + i * 1.2, size.z / 2 - 0.5);
            cobweb.rotation.y = Math.random() * Math.PI;
            group.add(cobweb);
        }

        // Broken frame leaning against wall
        const brokenFrame = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.7, 0.03),
            new THREE.MeshStandardMaterial({ color: 0x3A2818, roughness: 0.85 })
        );
        brokenFrame.position.set(-size.x / 2 + 0.3, -size.y / 2 + 0.35, -2);
        brokenFrame.rotation.y = Math.PI / 2;
        brokenFrame.rotation.z = Math.PI / 12;
        brokenFrame.castShadow = true;
        group.add(brokenFrame);

        // Torn map leaning against wall
        const tornMap = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 0.8),
            new THREE.MeshStandardMaterial({ color: 0xC8C0B0, roughness: 0.9 })
        );
        tornMap.position.set(size.x / 2 - 0.3, -size.y / 2 + 0.4, 3);
        tornMap.rotation.y = -Math.PI / 2;
        tornMap.rotation.z = -Math.PI / 16;
        group.add(tornMap);

        // Dust particle effect
        const dustGeometry = new THREE.BufferGeometry();
        const dustCount = 200;
        const dustPositions = new Float32Array(dustCount * 3);

        for (let i = 0; i < dustCount * 3; i += 3) {
            dustPositions[i] = (Math.random() - 0.5) * size.x;
            dustPositions[i + 1] = (Math.random() - 0.5) * size.y;
            dustPositions[i + 2] = (Math.random() - 0.5) * size.z;
        }

        dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

        const dustMaterial = new THREE.PointsMaterial({
            color: 0xD8D0C0,
            size: 0.02,
            transparent: true,
            opacity: 0.15,
            sizeAttenuation: true,
        });

        const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
        group.add(dustParticles);
    }

    // Add glass box
    const glassBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.6, 0.6),
        new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.9,
        })
    );
    glassBox.position.set(
        blueprint.riddlePosition.x,
        -size.y / 2 + 0.8,
        blueprint.riddlePosition.z
    );
    glassBox.castShadow = true;
    glassBox.visible = (index !== 0);
    if (index !== 0) {
        glassBox.userData = {
            type: "box",
            roomIndex: index,
            range: 3.0,
            label: "Glass Box",
            solved: false,
        };
        registerInteractable(glassBox);
    }
    group.add(glassBox);
    if (index !== 0) {
        registerCollisionMesh(glassBox, "Furniture");
    }

    // Letter/paper on box
    const letter = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xfff8dc, roughness: 0.8 })
    );
    letter.position.set(
        glassBox.position.x,
        glassBox.position.y + 0.35,
        glassBox.position.z
    );
    letter.rotation.x = -Math.PI / 6;
    letter.visible = (index !== 0);
    group.add(letter);

    // Key inside box (visible from start, except hallway)
    if (index !== 0) {
        key.position.set(
            glassBox.position.x,
            glassBox.position.y,
            glassBox.position.z
        );
        key.visible = true;
        key.userData.active = false;
    }

    const roomData = {
        name: blueprint.name,
        index,
        group,
        size,
        bounds,
        floorY,
        door: doorPivot,
        key,
        riddle: riddleMesh,
        visited: index === 0,
    };

    roomsData.push(roomData);
}

roomBlueprints.forEach((blueprint, index) => {
    buildRoom(blueprint, index);
});

/**
 * Culling original campus model to props
 */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);

const preservedNodes = [
    "Plane005",
    "Cube002",
    "Plane003",
    "Cube005",
    "Plane056",
    "Cube028",
];

gltfLoader.load("baked2.glb", (gltf) => {
    const decoGroup = new THREE.Group();
    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: 0x131f31,
                metalness: 0.15,
                roughness: 0.85,
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    preservedNodes.forEach((name, idx) => {
        const source = gltf.scene.getObjectByName(name);
        if (!source) {
            return;
        }
        const clone = source.clone(true);
        const room = roomsData[Math.min(idx, roomsData.length - 1)];
        clone.scale.multiplyScalar(0.25 + Math.random() * 0.1);
        clone.rotation.y = Math.random() * Math.PI * 2;
        clone.position.set(
            room.group.position.x + (Math.random() - 0.5) * (room.size.x - 2.5),
            -room.size.y / 2 + 0.2,
            room.group.position.z + (Math.random() - 0.5) * (room.size.z - 2.5)
        );
        decoGroup.add(clone);
    });
    scene.add(decoGroup);
});

/**
 * Interaction logic
 */
const movement = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
};

function getPromptForInteraction(object3d) {
    if (!object3d || !object3d.userData) {
        return "";
    }
    if (object3d.userData.enabled === false) {
        return "";
    }
    if (object3d.visible === false) {
        return "";
    }
    if (object3d.userData.prompt) {
        return object3d.userData.prompt;
    }
    const type = object3d.userData.type;
    if (!type) {
        return "";
    }
    if (type === "key") {
        return object3d.userData.active ? "Press E to collect" : "";
    }
    if (type === "door") {
        return object3d.userData.locked ? "Press E to unlock" : "Press E to open";
    }
    if (type === "riddle") {
        return object3d.userData.solved ? "" : "Press E to inspect";
    }
    if (type === "box") {
        return "Press E to inspect";
    }
    if (type.startsWith("possess_")) {
        return "Press E to interact";
    }
    return "";
}

function updateInteractionTarget() {
    if (state.gameOver || state.riddleActive) {
        interactionPromptElement.classList.remove("visible");
        state.hoveredInteraction = null;
        return;
    }

    const playerPosition = playerWorldPosition;
    let closest = null;
    let closestDistance = Infinity;

    interactables.forEach((item) => {
        const { type, range } = item.userData;
        if (type === "key" && !item.userData.active) {
            return;
        }
        if (type === "riddle" && item.userData.solved) {
            return;
        }
        if (type === "box" && item.userData.solved) {
            return;
        }
        if (item.userData.enabled === false) {
            return;
        }
        if (item.visible === false) {
            return;
        }
        tempVec3.setFromMatrixPosition(item.matrixWorld);
        const distance = tempVec3.distanceTo(playerPosition);
        if (distance < (range || 3.0) && distance < closestDistance) {
            closest = item;
            closestDistance = distance;
        }
    });

    state.hoveredInteraction = closest;
    if (closest) {
        const prompt = getPromptForInteraction(closest);
        if (prompt) {
            interactionPromptElement.textContent = prompt;
            interactionPromptElement.classList.add("visible");
        } else {
            interactionPromptElement.classList.remove("visible");
        }
    } else {
        interactionPromptElement.classList.remove("visible");
    }
}

function unlockDoor(doorPivot) {
    const data = doorPivot.userData;
    if (!data.locked) {
        return;
    }
    data.locked = false;
    playUnlockSound();
    gsap.to(data.mesh.material.emissive, {
        r: 0.0,
        g: 0.0,
        b: 0.0,
        duration: 1.2,
        ease: "power2.out",
    });
    gsap.to(data.glow.material, {
        opacity: 0.05,
        duration: 1.4,
        ease: "power2.out",
    });
    gsap.to(data.pivot.rotation, {
        y: -Math.PI / 2,
        duration: 1.2,
        ease: "power2.inOut",
        onComplete: () => {
            data.opened = true;
        },
    });
    showCenterPrompt(`${roomsData[data.roomIndex].name} door unlocked.`);
}

function collectKey(key) {
    if (!key.userData.active) {
        return;
    }
    key.visible = false;
    key.userData.active = false;
    const door = doors[key.userData.targetDoorIndex];
    if (door) {
        unlockDoor(door);
    }
    showCenterPrompt(`${roomsData[key.userData.roomIndex].name} key collected.`);
}

function openRiddleOverlay(riddleNode) {
    state.riddleActive = true;
    state.currentRiddle = riddleNode;
    riddleOverlayElement.classList.add("active");
    riddleQuestionElement.textContent = riddleNode.userData.question;
    riddleAnswerElement.value = "";
    interactionPromptElement.classList.remove("visible");
    releasePointerLock();
    window.setTimeout(() => {
        riddleAnswerElement.focus();
    }, 50);
}

function closeRiddleOverlay() {
    riddleOverlayElement.classList.remove("active");
    state.riddleActive = false;
    state.currentRiddle = null;
    if (!state.gameOver) {
        instructionsElement.classList.add("hidden");
        requestPointerLock();
    }
}

function solveRiddle(riddleNode) {
    riddleNode.userData.solved = true;
    const room = roomsData[riddleNode.userData.roomIndex];
    if (room) {
        room.key.userData.active = true;
        // Mark the box as solved too
        interactables.forEach((item) => {
            if (item.userData.type === "box" && item.userData.roomIndex === riddleNode.userData.roomIndex) {
                item.userData.solved = true;
            }
        });
        showCenterPrompt(`The glass box unlocks. Take the key.`);
    }
}

function handleInteraction() {
    if (state.gameOver || state.riddleActive || !state.hoveredInteraction) {
        return;
    }
    const interaction = state.hoveredInteraction;
    const type = interaction.userData.type;

    if (type === "key" || type === "key_pickup") {
        // In hallway, show message that ghost can't pick up key
        if (state.activeRoomIndex === 0 && type === "key_pickup") {
            showCenterPrompt("You cannot pick up the key. Possess the butler to pick it up.", 8);
            return;
        }
        collectKey(interaction);
    } else if (type === "door") {
        if (interaction.userData.locked) {
            showCenterPrompt("The door is sealed tight.");
        } else {
            const doorData = interaction.userData;
            if (doorData.nextRoomIndex !== null) {
                const nextRoom = roomsData[doorData.nextRoomIndex];
                playerState.position.set(
                    nextRoom.group.position.x,
                    nextRoom.floorY,
                    nextRoom.group.position.z + 4
                );
                previousPlayerPosition.copy(playerState.position);
                updatePlayerColliderFromState();
                syncPlayerTransforms();
                state.activeRoomIndex = doorData.nextRoomIndex;
                if (!nextRoom.visited) {
                    nextRoom.visited = true;
                    showCenterPrompt(nextRoom.name, 3);
                }
            } else {
                // Final door - trigger victory
                triggerVictory();
            }
        }
    } else if (type === "riddle") {
        openRiddleOverlay(interaction);
    } else if (type === "box") {
        const roomIndex = interaction.userData.roomIndex;
        const riddleNode = riddleNodes[roomIndex];
        if (riddleNode) {
            openRiddleOverlay(riddleNode);
        }
    } else if (type === "letter_read") {
        const currentRoom = roomsData[state.activeRoomIndex];
        if (currentRoom && currentRoom.group.userData.interact) {
            currentRoom.group.userData.interact(interaction);
        }
    } else if (type && type.startsWith("possess_")) {
        if (!interaction.userData.enabled && interaction.userData.enabled !== undefined) {
            showCenterPrompt(interaction.userData.prompt || "Not available yet", 2);
            return;
        }
        const currentRoom = roomsData[state.activeRoomIndex];
        if (currentRoom && currentRoom.group.userData.possess) {
            const result = currentRoom.group.userData.possess(interaction);
            if (result) {
                showCenterPrompt(result.message, result.duration);
                if (result.onEnd) {
                    setTimeout(result.onEnd, result.duration * 1000);
                }
            }
        }
    } else if (type === "letter_pickup" || type === "paper" || type === "letter" || type === "safe") {
        const currentRoom = roomsData[state.activeRoomIndex];
        if (currentRoom && currentRoom.group.userData.interact) {
            const result = currentRoom.group.userData.interact(interaction);
            if (result && result.message) {
                showCenterPrompt(result.message, result.duration);
            }
        }
    } else if (type === "heart_fragment") {
        showCenterPrompt("Heart Fragment collected! Transitioning...", 3);
        interaction.visible = false;
        setTimeout(() => {
            transitionToRoom(Math.min(state.activeRoomIndex + 1, roomsData.length - 1));
        }, 3000);
    }
}

/**
 * Pointer lock
 */
instructionsElement.addEventListener("click", (event) => {
    // Handle skip buttons
    if (event.target.id === "skip-to-room2") {
        startGameAtRoom(1); // Labs (index 1)
        return;
    }
    if (event.target.id === "skip-to-room3") {
        startGameAtRoom(2); // Chairman's Office (index 2)
        return;
    }
    if (event.target.id === "skip-to-room4") {
        startGameAtRoom(3); // Dorm (index 3)
        return;
    }
    
    // Regular game start
    if (state.gameOver) {
        return;
    }
    startGameAtRoom(0); // Hallway (index 0)
});

function startGameAtRoom(roomIndex) {
    ensureAudioContext();
    if (!window.audioContext) {
        window.audioContext = audioContext;
    }
    
    // Initialize speech synthesis with user interaction
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Test utterance to initialize
        const testUtterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(testUtterance);
    }
    
    startAmbientBed();
    instructionsElement.classList.add("hidden");
    resetPlayerTransform();
    
    // Set up game state for the target room
    state.gameStarted = true;
    state.activeRoomIndex = roomIndex;
    
    // Position player in the target room
    const targetRoom = roomsData[roomIndex];
    if (targetRoom) {
        playerState.position.set(
            targetRoom.group.position.x,
            targetRoom.floorY,
            targetRoom.group.position.z + 4
        );
        previousPlayerPosition.copy(playerState.position);
        updatePlayerColliderFromState();
        syncPlayerTransforms();
        
        // Mark room as visited
        targetRoom.visited = true;
        
        // Show room name
        showCenterPrompt(targetRoom.name, 3);
        
        // Chairman's Office will handle its own hints via the room's hint system
        
        // If skipping to room 2 or 3, unlock previous doors and make keys available
        if (roomIndex >= 1) {
            // Unlock basement door and make key available
            const basementDoor = doors[0];
            if (basementDoor) {
                basementDoor.userData.locked = false;
                basementDoor.userData.opened = true;
                gsap.set(basementDoor.rotation, { y: -Math.PI / 2 });
            }
            
            // Make basement key available (solve riddle)
            const basementRiddle = riddleNodes[0];
            if (basementRiddle) {
                basementRiddle.userData.solved = true;
                roomsData[0].key.userData.active = true;
            }
        }
        
        if (roomIndex >= 2) {
            // Unlock labs door and make key available
            const labsDoor = doors[1];
            if (labsDoor) {
                labsDoor.userData.locked = false;
                labsDoor.userData.opened = true;
                gsap.set(labsDoor.rotation, { y: -Math.PI / 2 });
            }
            
            // Make labs key available (solve riddle)
            const labsRiddle = riddleNodes[1];
            if (labsRiddle) {
                labsRiddle.userData.solved = true;
                roomsData[1].key.userData.active = true;
            }
        }
        
        if (roomIndex >= 3) {
            // Unlock chairman's office door and make key available
            const chairmanDoor = doors[2];
            if (chairmanDoor) {
                chairmanDoor.userData.locked = false;
                chairmanDoor.userData.opened = true;
                gsap.set(chairmanDoor.rotation, { y: -Math.PI / 2 });
            }
            
            // Make chairman's office key available (solve riddle)
            const chairmanRiddle = riddleNodes[2];
            if (chairmanRiddle) {
                chairmanRiddle.userData.solved = true;
                roomsData[2].key.userData.active = true;
            }
        }
    }
    
    requestPointerLock();
}



// Add skip button event listeners
document.getElementById("skip-to-room2").addEventListener("click", (event) => {
    event.stopPropagation();
    startGameAtRoom(1);
});

document.getElementById("skip-to-room3").addEventListener("click", (event) => {
    event.stopPropagation();
    startGameAtRoom(2);
});

document.getElementById("skip-to-room4").addEventListener("click", (event) => {
    event.stopPropagation();
    startGameAtRoom(3);
});

/**
 * Event listeners
 */
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

document.addEventListener("keydown", (event) => {
    if (state.gameOver) {
        return;
    }

    switch (event.code) {
        case "KeyW":
            movement.forward = true;
            break;
        case "KeyS":
            movement.backward = true;
            break;
        case "KeyA":
            movement.left = true;
            break;
        case "KeyD":
            movement.right = true;
            break;
        case "KeyF":
            state.flashlightOn = !state.flashlightOn;
            flashlight.intensity = state.flashlightOn ? 4.8 * Math.max(state.battery, 0.25) : 0;
            showCenterPrompt(state.flashlightOn ? "Flashlight engaged." : "Flashlight dark.");
            break;
        case "KeyE":
            handleInteraction();
            break;
        case "Space":
            movement.jump = true;
            break;
        case "KeyV":
            toggleCameraView();
            showCenterPrompt(state.thirdPersonView ? "Third-person camera" : "First-person camera", 2);
            break;
        default:
    }
});

document.addEventListener("keyup", (event) => {
    switch (event.code) {
        case "KeyW":
            movement.forward = false;
            break;
        case "KeyS":
            movement.backward = false;
            break;
        case "KeyA":
            movement.left = false;
            break;
        case "KeyD":
            movement.right = false;
            break;
        case "Space":
            movement.jump = false;
            break;
        default:
    }
});

riddleSubmitButton.addEventListener("click", () => {
    if (!state.currentRiddle) {
        return;
    }
    const attempted = riddleAnswerElement.value.trim().toLowerCase();
    if (!attempted) {
        return;
    }
    if (attempted === state.currentRiddle.userData.answer) {
        solveRiddle(state.currentRiddle);
        closeRiddleOverlay();
    } else {
        showCenterPrompt("The relic rejects your answer.", 2);
    }
});

riddleAnswerElement.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        riddleSubmitButton.click();
    }
});

riddleCloseButton.addEventListener("click", () => {
    closeRiddleOverlay();
});

restartButton.addEventListener("click", () => {
    window.location.reload();
});

/**
 * Death handling
 */
function triggerDeath(message) {
    if (state.gameOver) {
        return;
    }
    state.gameOver = true;
    state.flashlightOn = false;
    flashlight.intensity = 0;
    if (ambientGain) {
        gsap.to(ambientGain.gain, { value: 0.05, duration: 4, ease: "power1.out" });
    }
    centerPromptElement.classList.remove("visible");
    interactionPromptElement.classList.remove("visible");
    const heading = deathScreenElement.querySelector("h1");
    heading.textContent = message || "You remain trapped forever.";
    deathScreenElement.classList.add("active");
    instructionsElement.classList.add("hidden");
    releasePointerLock();
}

function triggerVictory() {
    if (state.gameOver) {
        return;
    }
    state.gameOver = true;
    state.flashlightOn = false;
    flashlight.intensity = 0;
    if (ambientGain) {
        gsap.to(ambientGain.gain, { value: 0.1, duration: 3, ease: "power1.out" });
    }
    centerPromptElement.classList.remove("visible");
    interactionPromptElement.classList.remove("visible");
    victoryScreenElement.classList.add("active");
    instructionsElement.classList.add("hidden");
    releasePointerLock();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x90ee90, 0.008);
}

/**
 * Movement + game loop
 */
const clock = new THREE.Clock();
let previousTime = 0;
const movementInput = new THREE.Vector2();
const horizontalDelta = new THREE.Vector3();

function updateMovement(deltaTime) {
    syncPlayerTransforms();
    updateCameraRig();

    if (!pointerLocked || state.gameOver) {
        previousPlayerPosition.copy(playerState.position);
        return;
    }

    const activeRoom = roomsData[state.activeRoomIndex];
    const floorY = activeRoom ? activeRoom.floorY : 0;

    movementInput.set(
        Number(movement.right) - Number(movement.left),
        Number(movement.forward) - Number(movement.backward)
    );
    if (movementInput.lengthSq() > 0) {
        movementInput.normalize();
    }

    const forward = new THREE.Vector3(-Math.sin(playerYaw), 0, -Math.cos(playerYaw));
    const right = new THREE.Vector3().crossVectors(forward, upVector);

    const moveSpeed = playerState.onGround ? PLAYER_MOVE_SPEED : PLAYER_AIR_MOVE_SPEED;
    horizontalDelta
        .copy(forward)
        .multiplyScalar(movementInput.y * moveSpeed * deltaTime)
        .addScaledVector(right, movementInput.x * moveSpeed * deltaTime);

    previousPlayerPosition.copy(playerState.position);
    playerState.position.add(horizontalDelta);

    if (movement.jump && playerState.onGround) {
        playerState.verticalVelocity = PLAYER_JUMP_VELOCITY;
        playerState.onGround = false;
        movement.jump = false;
    }

    playerState.verticalVelocity -= GRAVITY * deltaTime;
    playerState.position.y += playerState.verticalVelocity * deltaTime;

    if (playerState.position.y <= floorY) {
        playerState.position.y = floorY;
        playerState.verticalVelocity = 0;
        playerState.onGround = true;
    }

    enforceRoomBounds();
    updatePlayerColliderFromState();
    resolvePlayerCollisions();
    syncPlayerTransforms();
    updateCameraRig();
    enforceDoorLogic(playerWorldPosition);
}

function enforceDoorLogic(playerHeadPosition) {
    doors.forEach((doorPivot) => {
        const data = doorPivot.userData;
        doorPivot.getWorldPosition(tempVec3);
        const distance = tempVec3.distanceTo(playerHeadPosition);
        if (data.locked && distance < 1.1) {
            playerState.position.copy(previousPlayerPosition);
            playerState.verticalVelocity = 0;
            updatePlayerColliderFromState();
            syncPlayerTransforms();
            updateCameraRig();
        }
        if (!data.locked && data.nextRoomIndex !== null) {
            if (distance < 1 && playerHeadPosition.z < tempVec3.z - 0.4) {
                if (state.activeRoomIndex !== data.nextRoomIndex) {
                    state.activeRoomIndex = data.nextRoomIndex;
                    if (!roomsData[state.activeRoomIndex].visited) {
                        roomsData[state.activeRoomIndex].visited = true;
                        showCenterPrompt(roomsData[state.activeRoomIndex].name, 3);
                    }
                }
            }
        }
    });
}

function enforceRoomBounds() {
    const room = roomsData[state.activeRoomIndex];
    if (!room) {
        return;
    }
    const bounds = room.bounds;
    playerState.position.x = THREE.MathUtils.clamp(playerState.position.x, bounds.minX, bounds.maxX);
    playerState.position.z = THREE.MathUtils.clamp(playerState.position.z, bounds.minZ - 0.6, bounds.maxZ);
}

function resolvePlayerCollisions() {
    if (collisionMeshes.length === 0) {
        return;
    }

    let collided = false;

    for (let i = 0; i < collisionMeshes.length; i += 1) {
        const mesh = collisionMeshes[i];
        if (!mesh.visible) {
            continue;
        }
        const layer = mesh.userData.collisionLayer;
        if (layer && !PLAYER_COLLISION_LAYERS.has(layer)) {
            continue;
        }
        if (!mesh.geometry || !mesh.geometry.boundingBox) {
            continue;
        }

        boxWorld.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);

        if (!playerCollider.intersectsBox(boxWorld)) {
            continue;
        }

        playerCollider.getCenter(capsuleCenter);
        boxWorld.clampPoint(capsuleCenter, closestPoint);
        collisionResolution.copy(capsuleCenter).sub(closestPoint);
        const offset = collisionResolution.length();

        if (offset === 0) {
            collisionResolution.set(0, 1, 0);
        } else if (offset > 0) {
            collisionResolution.divideScalar(offset);
        }

        const penetration = playerCollider.radius - offset;
        if (penetration > 0) {
            const pushVector = collisionResolution.multiplyScalar(penetration + 0.01);
            playerState.position.add(pushVector);
            playerCollider.translate(pushVector);
            collided = true;
            if (pushVector.y > 0.001) {
                playerState.onGround = true;
            }
        }
    }

    if (collided) {
        playerState.verticalVelocity = Math.min(playerState.verticalVelocity, 0);
    }
}

function updateFlashlight(deltaTime) {
    if (!state.flashlightOn) {
        flashlight.intensity = 0;
        return;
    }
    flashlight.intensity = 4.8;
    updateBatteryUI();
}

function updateTimer(deltaTime) {
    if (state.gameOver) {
        return;
    }
    updateTimerUI();
}

function updateFlickerLights(elapsedTime) {
    flickerLights.forEach((entry) => {
        const { light, baseIntensity, speed, offset } = entry;
        const wave = Math.sin(elapsedTime * speed + offset);
        const flicker = baseIntensity * (0.9 + 0.1 * wave + 0.05 * Math.random());
        light.intensity = flicker;
    });
}

function tick() {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    if (state.gameStarted && !state.gameOver) {
        updateMovement(deltaTime);
        updateFlashlight(deltaTime);
        updateTimer(deltaTime);
        updateInteractionTarget();
        updateFlickerLights(elapsedTime);
        
        // Room-specific updates
        const currentRoom = roomsData[state.activeRoomIndex];
        if (currentRoom) {
            if (currentRoom.group.userData.updateButler) {
                currentRoom.group.userData.updateButler(deltaTime);
            }
            if (currentRoom.group.userData.updateMaid) {
                currentRoom.group.userData.updateMaid(deltaTime, playerState.position);
            }
            if (currentRoom.group.userData.updateChandeliers) {
                currentRoom.group.userData.updateChandeliers(deltaTime, playerState.position);
            }
            if (currentRoom.group.userData.checkProximity) {
                currentRoom.group.userData.checkProximity(playerState.position);
            }
        }
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
}

updateBatteryUI();
updateTimerUI();
tick();
