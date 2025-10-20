import * as THREE from "three";

function playDramaticSound(type) {
    if (!window.audioContext) {
        try {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.log('Audio not available');
            return;
        }
    }
    const ctx = window.audioContext;
    const now = ctx.currentTime;
    
    if (type === 'gas_valve') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 1);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.5);
    } else if (type === 'fan_spin') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 2);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 3);
    } else if (type === 'pot_open') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'letter_pickup') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'heart_spawn') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.5);
        osc.frequency.exponentialRampToValueAtTime(220, now + 1);
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.5);
    }
}

export function buildChairmanOffice(group, size, registerInteractable) {
    console.log("Building chairman office...");
    
    const officeState = {
        gasValveOpen: false,
        chefDistracted: false,
        potOpened: false,
        letterRevealed: false,
        letterRead: false,
        heartCollected: false,
        heartReward: null,
        shownGuidelines: new Set(),
        roomEnterTime: Date.now(),
        lastActivity: Date.now(),
        playerNearValve: false,
        playerLookingAtFan: false
    };
    
    let currentGuidelineTimeout = null;
    
    function showHint(text, duration = 7000, key = null) {
        if (key && officeState.shownGuidelines.has(key)) return;
        
        // Speak the hint with husky voice
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 0.7;
            utterance.volume = 0.9;
            window.speechSynthesis.speak(utterance);
        }
        
        if (window.showCenterPrompt) {
            window.showCenterPrompt(text, duration / 1000);
        }
        
        if (key) officeState.shownGuidelines.add(key);
    }
    
    // Progressive hint system - only for Chairman's Office
    let hintTimer = 0;
    function updateHints(deltaTime, playerPos) {
        // Only run hints if player is in Chairman's Office (room index 2)
        if (window.state && window.state.activeRoomIndex !== 2) return;
        if (officeState.gasValveOpen) return;
        
        hintTimer += deltaTime;
        const timeSinceEnter = (Date.now() - officeState.roomEnterTime) / 1000;
        
        // Initial hint
        if (timeSinceEnter > 2 && !officeState.shownGuidelines.has('initial')) {
            showHint("He guards that pot like it holds his sins. Search the room something will make him leave.", 8000, 'initial');
        }
        
        // Idle hint after 10s
        if (timeSinceEnter > 10 && !officeState.shownGuidelines.has('idle')) {
            showHint("There must be something here that creates a distraction. Look around.", 7000, 'idle');
        }
        
        // Check player position for contextual hints
        const valvePos = new THREE.Vector3(2.5, 0, -4.5);
        const fanPos = new THREE.Vector3(3, 0, -2);
        const distToValve = playerPos.distanceTo(valvePos);
        const distToFan = playerPos.distanceTo(fanPos);
        
        // Near stove area hint
        if (playerPos.x < -1 && playerPos.z < -2 && !officeState.shownGuidelines.has('stove')) {
            showHint("The air smells strange to the right. Follow it.", 6000, 'stove');
        }
        
        // Looking at fan area - only show once when first near
        if (distToFan < 4 && !officeState.shownGuidelines.has('fan') && timeSinceEnter > 5) {
            showHint("Stir the wind up there - it might help.", 6000, 'fan');
        }
        
        // Near right wall
        if (playerPos.x > 1 && !officeState.shownGuidelines.has('rightwall')) {
            showHint("A red wheel and a green grille - one opens, the other moves. Experiment.", 8000, 'rightwall');
        }
        
        // Final escalation hint after 30s
        if (timeSinceEnter > 30 && !officeState.shownGuidelines.has('final')) {
            showHint("Combine the objects on the right wall to create a distraction.", 10000, 'final');
        }
    }
    
    
    // Floor - White with cracks
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const floorCtx = floorCanvas.getContext('2d');
    floorCtx.fillStyle = '#FFFFFF';
    floorCtx.fillRect(0, 0, 512, 512);
    floorCtx.strokeStyle = '#CCCCCC';
    floorCtx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
        floorCtx.beginPath();
        floorCtx.moveTo(Math.random() * 512, Math.random() * 512);
        floorCtx.lineTo(Math.random() * 512, Math.random() * 512);
        floorCtx.stroke();
    }
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);
    
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x, size.z),
        new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -size.y / 2;
    floor.receiveShadow = true;
    group.add(floor);
    
    // Walls - Black and white checkerboard
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 512;
    wallCanvas.height = 512;
    const wallCtx = wallCanvas.getContext('2d');
    const tileSize = 64;
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            wallCtx.fillStyle = (x + y) % 2 === 0 ? '#000000' : '#FFFFFF';
            wallCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }
    const wallTexture = new THREE.CanvasTexture(wallCanvas);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 2);
    
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.9 });
    
    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x, size.y),
        wallMaterial
    );
    backWall.position.set(0, 0, -size.z / 2);
    group.add(backWall);
    
    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(size.z, size.y),
        wallMaterial
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-size.x / 2, 0, 0);
    group.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(size.z, size.y),
        wallMaterial
    );
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(size.x / 2, 0, 0);
    group.add(rightWall);
    
    // Front wall
    const frontWall = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x, size.y),
        wallMaterial
    );
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, 0, size.z / 2);
    group.add(frontWall);
    
    // Gas hiss sound near valve
    let gasHissSource = null;
    function playGasHiss(volume = 0.1) {
        if (!window.audioContext) return;
        if (gasHissSource) gasHissSource.stop();
        
        const ctx = window.audioContext;
        const now = ctx.currentTime;
        gasHissSource = ctx.createOscillator();
        const gain = ctx.createGain();
        gasHissSource.type = 'white';
        gasHissSource.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(volume, now);
        gasHissSource.connect(gain).connect(ctx.destination);
        gasHissSource.start(now);
        gasHissSource.stop(now + 0.5);
    }
    
    // Flickering bulb lighting
    const bulbLight = new THREE.PointLight(0xFFE4B5, 0.8, 15);
    bulbLight.position.set(0, size.y / 2 - 0.5, 0);
    bulbLight.castShadow = true;
    group.add(bulbLight);
    
    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFE4B5, emissive: 0xFFE4B5, emissiveIntensity: 0.5 })
    );
    bulb.position.set(0, size.y / 2 - 0.5, 0);
    group.add(bulb);
    
    const bulbCord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0x2A2A2A })
    );
    bulbCord.position.set(0, size.y / 2 - 1, 0);
    group.add(bulbCord);
    
    // Flickering effect
    let flickerTime = 0;
    group.userData.updateLighting = function(deltaTime) {
        flickerTime += deltaTime * 10;
        const flicker = 0.7 + Math.sin(flickerTime) * 0.1 + Math.random() * 0.1;
        bulbLight.intensity = flicker;
        bulb.material.emissiveIntensity = flicker * 0.5;
    };
    
    // KITCHEN COUNTER - left side
    const counter = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x4A3828, roughness: 0.6 })
    );
    counter.position.set(-2, -size.y / 2 + 0.5, -3);
    counter.castShadow = true;
    group.add(counter);
    
    // STOVE on counter
    const stove = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.2, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.3, metalness: 0.8 })
    );
    stove.position.set(-3, -size.y / 2 + 1.1, -3);
    stove.castShadow = true;
    group.add(stove);
    
    // POT on stove
    const potBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.35, 0.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.4, metalness: 0.9 })
    );
    potBase.position.set(0, 0, 0);
    potBase.castShadow = true;
    
    const potLid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.4, metalness: 0.9 })
    );
    potLid.position.set(0, 0.25, 0);
    potLid.castShadow = true;
    
    const pot = new THREE.Group();
    pot.position.set(-3, -size.y / 2 + 1.4, -3);
    pot.add(potBase);
    pot.add(potLid);
    pot.userData.type = "possess_pot";
    pot.userData.prompt = "Chef is blocking the pot";
    pot.userData.enabled = false;
    pot.userData.lid = potLid;
    group.add(pot);
    registerInteractable(pot);    
    // SINK on counter
    const sink = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.3, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xE8E8E8, roughness: 0.2, metalness: 0.7 })
    );
    sink.position.set(-1, -size.y / 2 + 1.15, -3);
    sink.castShadow = true;
    group.add(sink);
    
    // CHOPPING BOARD on counter
    const choppingBoard = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.05, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 })
    );
    choppingBoard.position.set(-0.5, -size.y / 2 + 1.125, -3);
    choppingBoard.castShadow = true;
    group.add(choppingBoard);
    
    // EXHAUST FAN - right side wall
    const fanBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16),
        new THREE.MeshStandardMaterial({ color: 0x90EE90, roughness: 0.3, metalness: 0.8 })
    );
    fanBase.position.set(0, 0, 0);
    fanBase.castShadow = true;
    
    const fanBlades = new THREE.Group();
    for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.02, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x90EE90, roughness: 0.4, metalness: 0.9 })
        );
        blade.rotation.z = (i * Math.PI) / 2;
        fanBlades.add(blade);
    }
    fanBlades.position.set(0, 0, 0.1);
    
    const exhaustFan = new THREE.Group();
    exhaustFan.position.set(3, -size.y / 2 + 2.5, -2);
    exhaustFan.add(fanBase);
    exhaustFan.add(fanBlades);
    exhaustFan.userData.type = "possess_fan";
    exhaustFan.userData.prompt = "Open gas valve first";
    exhaustFan.userData.enabled = false;
    exhaustFan.userData.blades = fanBlades;
    group.add(exhaustFan);
    registerInteractable(exhaustFan);
    
    // GAS VALVE - right wall near exhaust fan
    const valveBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.4, metalness: 0.8 })
    );
    valveBase.position.set(0, 0, 0);
    valveBase.rotation.x = Math.PI / 2;
    
    const valveHandle = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.05, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.3, metalness: 0.9 })
    );
    valveHandle.position.set(0, 0, 0.2);
    
    const gasValve = new THREE.Group();
    gasValve.position.set(2.5, -size.y / 2 + 1.5, -4.5);
    gasValve.add(valveBase);
    gasValve.add(valveHandle);
    gasValve.userData.type = "possess_valve";
    gasValve.userData.prompt = "Press E to open gas valve";
    gasValve.userData.enabled = true;
    gasValve.userData.handle = valveHandle;
    group.add(gasValve);
    registerInteractable(gasValve);
    
    // Add subtle valve animation and glow
    let valveTime = 0;
    gasValve.userData.updateValve = function(deltaTime) {
        valveTime += deltaTime;
        valveHandle.rotation.z += Math.sin(valveTime * 2) * 0.002; // Micro wobble
        
        // Add reflective material
        if (!gasValve.userData.glowAdded) {
            valveBase.material.metalness = 0.9;
            valveBase.material.roughness = 0.1;
            valveHandle.material.metalness = 0.9;
            valveHandle.material.roughness = 0.1;
            gasValve.userData.glowAdded = true;
        }
    };
    
    // WROUGHT-IRON KITCHEN SHELVES - replacing office furniture
    const ironMaterial = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.4, metalness: 0.8 });
    
    // Shelf 1 - center right (replacing desk)
    const shelf1Frame = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.05, 1.2),
        ironMaterial
    );
    shelf1Frame.position.set(2, -size.y / 2 + 0.8, 1);
    shelf1Frame.castShadow = true;
    group.add(shelf1Frame);
    
    // Shelf 1 supports
    for (let i = 0; i < 4; i++) {
        const support = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8),
            ironMaterial
        );
        support.position.set(2 + (i % 2) * 2.3 - 1.15, -size.y / 2 + 0.4, 1 + Math.floor(i / 2) * 1 - 0.5);
        group.add(support);
    }
    
    // Dusty spice jars on shelf 1
    for (let i = 0; i < 3; i++) {
        const jar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8),
            new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, transparent: true, opacity: 0.7 })
        );
        jar.position.set(2 + (i - 1) * 0.4, -size.y / 2 + 0.9, 1);
        group.add(jar);
    }
    
    // Shelf 2 - behind (replacing chair area)
    const shelf2Frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.05, 0.8),
        ironMaterial
    );
    shelf2Frame.position.set(2, -size.y / 2 + 1.2, 2);
    shelf2Frame.castShadow = true;
    group.add(shelf2Frame);
    
    // Rusted pans on shelf 2
    for (let i = 0; i < 2; i++) {
        const pan = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.12, 0.03, 16),
            new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9, metalness: 0.3 })
        );
        pan.position.set(2 + (i - 0.5) * 0.6, -size.y / 2 + 1.25, 2);
        group.add(pan);
    }
    
    // Shelf 3 - front wall (replacing bookshelf)
    const shelf3Frame = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.05, 0.4),
        ironMaterial
    );
    shelf3Frame.position.set(-1, -size.y / 2 + 1.25, 4.3);
    shelf3Frame.castShadow = true;
    group.add(shelf3Frame);
    
    // Vertical supports for shelf 3
    for (let i = 0; i < 2; i++) {
        const support = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8),
            ironMaterial
        );
        support.position.set(-1 + (i * 2 - 1) * 0.9, -size.y / 2 + 1.25, 4.3);
        group.add(support);
    }
    
    // More dusty jars and rusted items on shelf 3
    for (let i = 0; i < 4; i++) {
        const item = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.12, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9 })
        );
        item.position.set(-1 + (i - 1.5) * 0.3, -size.y / 2 + 1.31, 4.3);
        group.add(item);
    }
    
    // CHEF NPC
    const chefBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 1.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.7 })
    );
    chefBody.castShadow = true;
    
    const chefHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.8 })
    );
    chefHead.position.y = 1.2;
    chefHead.castShadow = true;
    
    const chefHat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 0.4, 16),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 })
    );
    chefHat.position.y = 1.6;
    chefHat.castShadow = true;
    
    const chef = new THREE.Group();
    chef.add(chefBody);
    chef.add(chefHead);
    chef.add(chefHat);
    chef.position.set(-3, -size.y / 2 + 0.9, -2.5);
    group.add(chef);
    
    // Chef label
    const chefLabelCanvas = document.createElement('canvas');
    const chefCtx = chefLabelCanvas.getContext('2d');
    chefLabelCanvas.width = 512;
    chefLabelCanvas.height = 128;
    chefCtx.font = 'bold 56px serif';
    chefCtx.fillStyle = '#FFFFFF';
    chefCtx.strokeStyle = '#000000';
    chefCtx.lineWidth = 4;
    chefCtx.textAlign = 'center';
    chefCtx.textBaseline = 'middle';
    chefCtx.strokeText('Guilty Chef', 256, 64);
    chefCtx.fillText('Guilty Chef', 256, 64);
    const chefLabelTexture = new THREE.CanvasTexture(chefLabelCanvas);
    const chefLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: chefLabelTexture, transparent: true }));
    chefLabel.scale.set(2, 0.5, 1);
    chefLabel.position.set(-3, -size.y / 2 + 3.2, -2.5);
    group.add(chefLabel);
    
    // Object labels
    function createLabel(text, position) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        ctx.font = 'bold 48px serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(text, 256, 64);
        ctx.fillText(text, 256, 64);
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        sprite.scale.set(2, 0.5, 1);
        sprite.position.copy(position);
        return sprite;
    }
    
    group.add(createLabel('Exhaust Fan', new THREE.Vector3(3, -size.y / 2 + 3.5, -2)));
    group.add(createLabel('Gas Valve', new THREE.Vector3(2.5, -size.y / 2 + 2.5, -4.5)));
    group.add(createLabel('Cooking Pot', new THREE.Vector3(-3, -size.y / 2 + 2.5, -3)));
    
    // Smoke particles
    const smokeParticles = [];
    for (let i = 0; i < 20; i++) {
        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: 0x666666, 
                transparent: true, 
                opacity: 0.3 
            })
        );
        smoke.visible = false;
        smokeParticles.push(smoke);
        group.add(smoke);
    }

    // INTERACTION LOGIC
    group.userData.interact = function() {
        return null;
    };
    
    // POSSESSION LOGIC
    group.userData.possess = function(object) {
        const type = object.userData.type;
        
        if (type === "possess_valve") {
            if (!officeState.gasValveOpen) {
                playDramaticSound('gas_valve');
                officeState.gasValveOpen = true;
                object.userData.handle.rotation.z = Math.PI / 4;
                object.userData.prompt = "Gas valve opened";
                exhaustFan.userData.enabled = true;
                exhaustFan.userData.prompt = "Press E to blow smoke";
                setTimeout(() => {
                    showHint("Gas flows freely now. Something else in this room might use it.", 7000);
                }, 3500);
            }
            return { duration: 3, message: "Opening gas valve..." };
        }

    if (type === "possess_fan" && officeState.gasValveOpen) {
        playDramaticSound('fan_spin');
        
        // Chef moves away immediately when smoke starts
        const chefStartPos = chef.position.clone();
        const chefTargetPos = new THREE.Vector3(1, -size.y / 2 + 0.9, 1);
        let chefMoveTime = 0;
        
        let spinTime = 0;
        const spinInterval = setInterval(() => {
            spinTime += 0.1;
            object.userData.blades.rotation.z += 0.5;
            
            // Move chef away from counter
            if (chefMoveTime < 2) {
                chefMoveTime += 0.1;
                const t = Math.min(chefMoveTime / 2, 1);
                chef.position.lerpVectors(chefStartPos, chefTargetPos, t);
                chefLabel.position.set(chef.position.x, -size.y / 2 + 3.2, chef.position.z);
            }
            
            smokeParticles.forEach((smoke) => {
                smoke.visible = true;
                smoke.position.set(
                    3 + Math.random() * 2 - 1,
                    -size.y / 2 + 1 + Math.random() * 2,
                    -2 + Math.random() * 4
                );
            });
            
            if (spinTime >= 3) {
                clearInterval(spinInterval);
                officeState.chefDistracted = true;
                pot.userData.enabled = true;
                pot.userData.prompt = "Press E to open pot";
                showHint("The chef stumbles away, coughing. His station is unguarded now.", 7000);
                
                setTimeout(() => {
                    smokeParticles.forEach((smoke) => (smoke.visible = false));
                }, 5000);
            }
        }, 100);
        
        return { duration: 5, message: "Blowing smoke across room..." };
    }

    if (type === "possess_pot" && officeState.chefDistracted) {
        if (!officeState.potOpened) {
            playDramaticSound('pot_open');
            officeState.potOpened = true;
            object.userData.lid.position.x += 0.3;
            object.userData.lid.rotation.z = Math.PI / 6;
            object.userData.enabled = false;
            pot.userData.enabled = false;
            exhaustFan.userData.enabled = false;
            gasValve.userData.enabled = false;
            officeState.letterRevealed = true;

            let reward = null;
            if (window.spawnHeartFragment) {
                reward = window.spawnHeartFragment(2, {
                    silent: true,
                    prompt: "Read the letter before touching the heart fragment.",
                    collectMessage: "Heart Fragment #3 collected.",
                    onCollect: () => {
                        officeState.heartCollected = true;
                        officeState.heartReward = null;
                        const followHint = "The fragment beats hot in your grasp. Take the chairman's key before he returns.";
                        showHint(followHint, 9000, 'heart_collected');
                    },
                    letterOverrides: {
                        prompt: "Press E to read the chairman's confession",
                        revisitPrompt: "Press E to revisit the chairman's confession",
                        onRead: () => {
                            officeState.letterRead = true;
                            const hint = "The truth is in your hands. Claim the heart fragment, then the key.";
                            showHint(hint, 9000, 'letter_read');
                            if (officeState.heartReward) {
                                officeState.heartReward.userData.prompt = "Press E to collect Heart Fragment #3";
                                officeState.heartReward.userData.collectMessage = "Heart Fragment #3 collected.";
                                officeState.heartReward.userData.canCollect = null;
                            }
                        }
                    }
                });
                playDramaticSound('heart_spawn');
            } else if (window.spawnLetter) {
                const letterOverlay = window.spawnLetter(2, {
                    prompt: "Press E to read the chairman's confession",
                    revisitPrompt: "Press E to revisit the chairman's confession",
                    onRead: () => {
                        officeState.letterRead = true;
                        const hint = "The truth is in your hands. Claim the heart fragment, then the key.";
                        showHint(hint, 9000, 'letter_read');
                    }
                });
                reward = { heart: null, letter: letterOverlay };
            }

            officeState.heartReward = reward ? reward.heart : null;
            if (officeState.heartReward && !officeState.letterRead) {
                officeState.heartReward.userData.canCollect = () => {
                    const message = "Read the letter before touching the heart fragment.";
                    showHint(message, 7000, 'heart_guard');
                    return { allowed: false, message, duration: 7 };
                };
            }

            showHint("Something hidden inside the pot stirs - the evidence, the heartbeat, everything they burned.", 9000, 'pot_opened');
            if (window.showCenterPrompt) {
                window.showCenterPrompt("Read the letter that survived the fire.", 6);
            }
        }
        return { duration: 4, message: "Opening cooking pot..." };
    }



    return null;
};

    // CHEF ANIMATION
    const chefPatrolPoints = [
        new THREE.Vector3(-3, -size.y / 2 + 0.9, -1.5),
        new THREE.Vector3(-1, -size.y / 2 + 0.9, -1.5),
        new THREE.Vector3(-0.5, -size.y / 2 + 0.9, -1.5)
    ];
    let chefTime = 0;
    
    // Player proximity tracking - only for Chairman's Office
    group.userData.checkProximity = function(playerPos) {
        // Only run if player is in Chairman's Office
        if (window.state && window.state.activeRoomIndex !== 2) return;
        
        const valvePos = new THREE.Vector3(2.5, playerPos.y, -4.5);
        const distToValve = playerPos.distanceTo(valvePos);
        
        // Play gas hiss when near valve
        if (distToValve < 3 && !officeState.gasValveOpen) {
            const volume = Math.max(0, (3 - distToValve) / 3) * 0.15;
            if (Math.random() < 0.1) playGasHiss(volume);
        }
        
        // Update hints based on position
        updateHints(0.1, playerPos);
    };
    
    group.userData.updateChef = function(deltaTime) {
        if (officeState.chefDistracted) {
            chefTime += deltaTime * 2;
            chef.position.set(
                Math.sin(chefTime) * 2 + 1,
                -size.y / 2 + 0.9,
                Math.cos(chefTime) * 2 + 1
            );
            chefLabel.position.set(chef.position.x, -size.y / 2 + 3.2, chef.position.z);
        } else {
            chefTime += deltaTime * 0.8;
            const t = (Math.sin(chefTime) + 1) / 2;
            const currentIdx = Math.floor(chefTime / Math.PI) % chefPatrolPoints.length;
            const nextIdx = (currentIdx + 1) % chefPatrolPoints.length;
            
            chef.position.lerpVectors(chefPatrolPoints[currentIdx], chefPatrolPoints[nextIdx], t);
            chefLabel.position.set(chef.position.x, -size.y / 2 + 3.2, chef.position.z);
        }
        
        chefHead.rotation.y = Math.sin(chefTime * 3) * 0.3;
        
        // Update flickering light
        if (group.userData.updateLighting) {
            group.userData.updateLighting(deltaTime);
        }
        
        // Update valve animation
        if (gasValve.userData.updateValve) {
            gasValve.userData.updateValve(deltaTime);
        }
        
        // Update hints only if in Chairman's Office
        if (window.state && window.state.activeRoomIndex === 2) {
            updateHints(deltaTime, new THREE.Vector3(0, 0, 0));
        }
    };

    console.log("Chairman office built successfully");

}










