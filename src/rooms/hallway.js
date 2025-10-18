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
    
    if (type === 'candle_light') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
    } else if (type === 'pendulum_possess') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 2);
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 3);
    } else if (type === 'key_drop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'key_pickup') {
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
    } else if (type === 'door_unlock') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 1);
        gain.gain.setValueAtTime(1.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2);
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
    } else if (type === 'riddle_solve') {
        [440, 554, 659].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.4, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1 + i * 0.1);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + 1.5 + i * 0.1);
        });
    }
}

export function buildHallway(group, size, registerInteractable) {
    console.log("Building hallway...");
    
    const hallwayState = {
        candlesLit: [false, false, false],
        riddleSolved: false,
        keyDropped: false,
        keyCollected: false,
        doorUnlocked: false,
        shownGuidelines: new Set()
    };
    
    // UI Elements
    const hallwayRiddle = document.getElementById('hallway-riddle');
    const hallwayRiddleInput = document.getElementById('hallway-riddle-input');
    const guidelines = document.getElementById('guidelines');
    
    let currentGuidelineTimeout = null;
    
    // Guidelines Manager
    function showGuideline(text, duration = 7000, key = null) {
        if (!guidelines) return;
        if (key && hallwayState.shownGuidelines.has(key)) return;
        
        if (currentGuidelineTimeout) {
            clearTimeout(currentGuidelineTimeout);
        }
        
        guidelines.classList.remove('active');
        setTimeout(() => {
            guidelines.textContent = text;
            guidelines.classList.add('active');
            
            if (key) hallwayState.shownGuidelines.add(key);
            
            currentGuidelineTimeout = setTimeout(() => {
                guidelines.classList.remove('active');
            }, duration);
        }, 100);
    }
    
    // Riddle UI
    function showRiddle() {
        if (hallwayRiddle) {
            console.log("Showing riddle");
            hallwayRiddle.style.display = 'block';
            setTimeout(() => hallwayRiddle.classList.add('active'), 50);
            if (hallwayRiddleInput) {
                hallwayRiddleInput.value = '';
                hallwayRiddleInput.focus();
            }
        }
    }
    
    function hideRiddle() {
        if (hallwayRiddle) {
            hallwayRiddle.classList.remove('active');
            setTimeout(() => hallwayRiddle.style.display = 'none', 500);
        }
    }
    
    // Riddle submission
    if (hallwayRiddleInput) {
        hallwayRiddleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const answer = hallwayRiddleInput.value.trim().toLowerCase();
                console.log("Riddle answer:", answer);
                if (answer === 'candle') {
                    playDramaticSound('riddle_solve');
                    hideRiddle();
                    hallwayState.riddleSolved = true;
                    pendulum.userData.enabled = true;
                    pendulum.userData.prompt = "Press E to possess pendulum";
                    showGuideline("Clever… time wants to move now.", 7000, 'riddle_solved');
                    setTimeout(() => {
                        showGuideline("Something nearby just changed. The clock… it's alive again.", 7000, 'clock_active');
                    }, 7500);
                } else {
                    hallwayRiddle.classList.add('shake');
                    setTimeout(() => hallwayRiddle.classList.remove('shake'), 500);
                }
            }
        });
    }
    
    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x, size.z),
        new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -size.y / 2;
    floor.receiveShadow = true;
    group.add(floor);
    
    // CANDLES
    const candles = [];
    const candlePositions = [
        { x: -3, y: -size.y / 2 + 0.5, z: -4 },
        { x: 0, y: -size.y / 2 + 0.5, z: -4 },
        { x: 3, y: -size.y / 2 + 0.5, z: -4 }
    ];
    
    candlePositions.forEach((pos, idx) => {
        const candleBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.18, 0.8, 16),
            new THREE.MeshStandardMaterial({ color: 0xE8D4B0, roughness: 0.9 })
        );
        candleBase.position.set(pos.x, pos.y, pos.z);
        candleBase.castShadow = true;
        candleBase.userData.type = "possess_candle";
        candleBase.userData.candleIndex = idx;
        candleBase.userData.prompt = "Press E to light candle";
        candleBase.userData.enabled = true;
        group.add(candleBase);
        registerInteractable(candleBase);
        
        // Wick (unlit)
        const wick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8),
            new THREE.MeshStandardMaterial({ color: 0x1A1A1A })
        );
        wick.position.set(pos.x, pos.y + 0.45, pos.z);
        group.add(wick);
        
        // Flame (hidden initially)
        const candleFlame = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16),
            new THREE.MeshStandardMaterial({ 
                color: 0xFF6600, 
                emissive: 0xFF4400, 
                emissiveIntensity: 2 
            })
        );
        candleFlame.position.set(pos.x, pos.y + 0.5, pos.z);
        candleFlame.visible = false;
        group.add(candleFlame);
        
        const light = new THREE.PointLight(0xFF6600, 0, 5);
        light.position.set(pos.x, pos.y + 0.5, pos.z);
        light.castShadow = true;
        group.add(light);
        
        // Label
        const labelCanvas = document.createElement('canvas');
        const ctx = labelCanvas.getContext('2d');
        labelCanvas.width = 512;
        labelCanvas.height = 128;
        ctx.font = 'bold 56px serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText('Candle', 256, 64);
        ctx.fillText('Candle', 256, 64);
        
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, transparent: true }));
        labelSprite.scale.set(2, 0.5, 1);
        labelSprite.position.set(pos.x, pos.y + 1.5, pos.z);
        group.add(labelSprite);
        
        candles.push({ flame: candleFlame, light: light, base: candleBase });
    });
    
    // GRANDFATHER CLOCK - positioned against right wall, facing into room
    const clockGroup = new THREE.Group();
    clockGroup.position.set(size.x / 2 - 0.8, -size.y / 2, 0);
    clockGroup.rotation.y = -Math.PI / 2; // Face into room
    
    // Base cabinet
    const clockBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x3A2818, roughness: 0.6 })
    );
    clockBase.position.y = 0.75;
    clockBase.castShadow = true;
    clockGroup.add(clockBase);
    
    // Middle section
    const clockMiddle = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 1.2, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x4A3828, roughness: 0.6 })
    );
    clockMiddle.position.y = 2.1;
    clockMiddle.castShadow = true;
    clockGroup.add(clockMiddle);
    
    // Top hood
    const clockTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.8, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x3A2818, roughness: 0.6 })
    );
    clockTop.position.y = 3.1;
    clockTop.castShadow = true;
    clockGroup.add(clockTop);
    
    // Clock face
    const clockFace = new THREE.Mesh(
        new THREE.CircleGeometry(0.35, 32),
        new THREE.MeshStandardMaterial({ color: 0xE8D4B0, roughness: 0.8 })
    );
    clockFace.position.set(0, 2.7, 0.21);
    clockGroup.add(clockFace);
    
    // Hour markers
    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI * 2) / 12;
        const marker = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.06, 0.01),
            new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        marker.position.set(
            Math.sin(angle) * 0.28,
            2.7 + Math.cos(angle) * 0.28,
            0.22
        );
        marker.rotation.z = -angle;
        clockGroup.add(marker);
    }
    
    // Hour hand
    const hourHand = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.18, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    hourHand.position.set(0, 2.79, 0.23);
    clockGroup.add(hourHand);
    
    // Minute hand
    const minuteHand = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.25, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    minuteHand.position.set(0, 2.825, 0.24);
    minuteHand.rotation.z = Math.PI / 4;
    clockGroup.add(minuteHand);
    
    // Glass door for pendulum
    const glassPanel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 0.9),
        new THREE.MeshStandardMaterial({ 
            color: 0x88AACC, 
            transparent: true, 
            opacity: 0.3,
            roughness: 0.1
        })
    );
    glassPanel.position.set(0, 1.5, 0.21);
    clockGroup.add(glassPanel);
    
    // Pendulum (visible through glass)
    const pendulum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.3, metalness: 0.8 })
    );
    pendulum.position.set(0, 1.5, 0.1);
    pendulum.name = "clock_pendulum_01";
    pendulum.userData.type = "possess_pendulum";
    pendulum.userData.prompt = "Solve the riddle first";
    pendulum.userData.enabled = false;
    clockGroup.add(pendulum);
    
    group.add(clockGroup);
    registerInteractable(pendulum);
    
    // Clock label
    const clockLabelCanvas = document.createElement('canvas');
    const clockCtx = clockLabelCanvas.getContext('2d');
    clockLabelCanvas.width = 512;
    clockLabelCanvas.height = 128;
    clockCtx.font = 'bold 56px serif';
    clockCtx.fillStyle = '#FFFFFF';
    clockCtx.strokeStyle = '#000000';
    clockCtx.lineWidth = 4;
    clockCtx.textAlign = 'center';
    clockCtx.textBaseline = 'middle';
    clockCtx.strokeText('Grandfather Clock', 256, 64);
    clockCtx.fillText('Grandfather Clock', 256, 64);
    const clockLabelTexture = new THREE.CanvasTexture(clockLabelCanvas);
    const clockLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: clockLabelTexture, transparent: true }));
    clockLabel.scale.set(3, 0.75, 1);
    clockLabel.position.set(size.x / 2 - 0.8, -size.y / 2 + 4.2, 0);
    group.add(clockLabel);
    
    // KEY - realistic design near clock
    const keyGroup = new THREE.Group();
    
    // Key shaft
    const keyShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
        new THREE.MeshStandardMaterial({ 
            color: 0xB8860B, 
            roughness: 0.3, 
            metalness: 0.9
        })
    );
    keyShaft.rotation.z = Math.PI / 2;
    keyGroup.add(keyShaft);
    
    // Key bow (handle)
    const keyBow = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.02, 8, 16),
        new THREE.MeshStandardMaterial({ 
            color: 0xB8860B, 
            roughness: 0.3, 
            metalness: 0.9
        })
    );
    keyBow.position.x = -0.25;
    keyGroup.add(keyBow);
    
    // Key teeth
    for (let i = 0; i < 3; i++) {
        const tooth = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.06, 0.02),
            new THREE.MeshStandardMaterial({ 
                color: 0xB8860B, 
                roughness: 0.3, 
                metalness: 0.9
            })
        );
        tooth.position.set(0.15 + i * 0.05, -0.03, 0);
        keyGroup.add(tooth);
    }
    
    keyGroup.position.set(size.x / 2 - 1.2, -size.y / 2 + 0.02, 0.3);
    keyGroup.rotation.y = Math.PI / 4;
    keyGroup.name = "fallen_key";
    keyGroup.userData.type = "key_pickup";
    keyGroup.userData.prompt = "Only the living can pick this up";
    keyGroup.userData.enabled = false;
    keyGroup.visible = false;
    group.add(keyGroup);
    registerInteractable(keyGroup);
    
    // Key label
    const keyLabelCanvas = document.createElement('canvas');
    const keyCtx = keyLabelCanvas.getContext('2d');
    keyLabelCanvas.width = 512;
    keyLabelCanvas.height = 128;
    keyCtx.font = 'bold 56px serif';
    keyCtx.fillStyle = '#FFFFFF';
    keyCtx.strokeStyle = '#000000';
    keyCtx.lineWidth = 4;
    keyCtx.textAlign = 'center';
    keyCtx.textBaseline = 'middle';
    keyCtx.strokeText('Fallen Key', 256, 64);
    keyCtx.fillText('Fallen Key', 256, 64);
    const keyLabelTexture = new THREE.CanvasTexture(keyLabelCanvas);
    const keyLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: keyLabelTexture, transparent: true }));
    keyLabel.scale.set(2, 0.5, 1);
    keyLabel.position.set(size.x / 2 - 1.2, -size.y / 2 + 0.8, 0.3);
    keyLabel.visible = false;
    group.add(keyLabel);
    
    // DOOR
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.9, -size.y / 2 + 1.3, size.z / 2 - 0.1);
    group.add(doorPivot);
    
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 2.6, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x4A3828, roughness: 0.6 })
    );
    door.position.set(0.9, 0, 0);
    door.castShadow = true;
    doorPivot.add(door);
    
    // Dark hallway behind door
    const darkHallway = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 3),
        new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1 })
    );
    darkHallway.position.set(0, 0, -0.2);
    doorPivot.add(darkHallway);
    
    // BUTLER
    const butlerBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 2.0, 16),
        new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.7 })
    );
    butlerBody.position.set(0, -size.y / 2 + 1.0, 0);
    butlerBody.castShadow = true;
    
    const butlerHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.8 })
    );
    butlerHead.position.set(0, -size.y / 2 + 2.3, 0);
    butlerHead.castShadow = true;
    
    const butlerGroup = new THREE.Group();
    butlerGroup.add(butlerBody);
    butlerGroup.add(butlerHead);
    butlerGroup.position.set(0, 0, 4);
    butlerGroup.userData.type = "possess_butler";
    butlerGroup.userData.prompt = "Collect the key first";
    butlerGroup.userData.enabled = false;
    group.add(butlerGroup);
    registerInteractable(butlerGroup);
    
    // Butler label
    const butlerLabelCanvas = document.createElement('canvas');
    const butlerCtx = butlerLabelCanvas.getContext('2d');
    butlerLabelCanvas.width = 512;
    butlerLabelCanvas.height = 128;
    butlerCtx.font = 'bold 56px serif';
    butlerCtx.fillStyle = '#FFFFFF';
    butlerCtx.strokeStyle = '#000000';
    butlerCtx.lineWidth = 4;
    butlerCtx.textAlign = 'center';
    butlerCtx.textBaseline = 'middle';
    butlerCtx.strokeText('Old Butler', 256, 64);
    butlerCtx.fillText('Old Butler', 256, 64);
    const butlerLabelTexture = new THREE.CanvasTexture(butlerLabelCanvas);
    const butlerLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: butlerLabelTexture, transparent: true }));
    butlerLabel.scale.set(2, 0.5, 1);
    butlerLabel.position.set(0, -size.y / 2 + 3.5, 4);
    group.add(butlerLabel);
    

    
    // POSSESSION LOGIC
    group.userData.possess = function(object) {
        const type = object.userData.type;
        console.log("Possessing:", type);
        
        if (type === "possess_candle") {
            const idx = object.userData.candleIndex;
            if (!hallwayState.candlesLit[idx]) {
                playDramaticSound('candle_light');
                hallwayState.candlesLit[idx] = true;
                candles[idx].flame.visible = true;
                candles[idx].light.intensity = 0.8;
                
                const litCount = hallwayState.candlesLit.filter(lit => lit).length;
                if (litCount === 1) {
                    showGuideline("The air shimmers when I touch the fire...", 5000, 'first_candle');
                } else if (litCount === 2) {
                    showGuideline("Each flame reveals something hidden.", 5000, 'second_candle');
                }
                
                if (hallwayState.candlesLit.every(lit => lit)) {
                    setTimeout(() => {
                        showGuideline("Oh… words in the light. What do they mean?", 7000, 'all_candles');
                        setTimeout(() => {
                            showGuideline("These markings… they're a riddle from before I died.", 7000, 'riddle_hint');
                            setTimeout(() => {
                                showGuideline("Type the answer in the light below.", 7000, 'riddle_prompt');
                                showRiddle();
                            }, 7500);
                        }, 7500);
                    }, 500);
                }
            }
            return { duration: 10, message: "Possessing candle flame..." };
        }
        
        if (type === "possess_pendulum" && hallwayState.riddleSolved) {
            playDramaticSound('pendulum_possess');
            showGuideline("Swing... three times should be enough.", 3000, 'pendulum_swing');
            let swingCount = 0;
            const swingInterval = setInterval(() => {
                swingCount++;
                pendulum.rotation.z = Math.sin(swingCount * 0.5) * 0.3;
                
                if (swingCount >= 6) {
                    clearInterval(swingInterval);
                    pendulum.rotation.z = 0;
                    
                    if (!hallwayState.keyDropped) {
                        playDramaticSound('key_drop');
                        hallwayState.keyDropped = true;
                        keyGroup.visible = true;
                        keyLabel.visible = true;
                        butlerGroup.userData.enabled = true;
                        butlerGroup.userData.prompt = "Press E to possess butler and pick up key";
                        setTimeout(() => {
                            showGuideline("A key fell… but I can't pick it up. I need someone alive.", 7000, 'key_dropped');
                            setTimeout(() => {
                                showGuideline("Maybe the butler can help me.", 7000, 'butler_hint');
                            }, 7500);
                        }, 500);
                    }
                }
            }, 200);
            
            return { duration: 3, message: "Swinging pendulum..." };
        }
        
        if (type === "possess_butler") {
            if (!hallwayState.keyCollected) {
                // Butler picks up key
                return { 
                    duration: 8, 
                    message: "Possessing butler to pick up key...",
                    onEnd: () => {
                        playDramaticSound('key_pickup');
                        hallwayState.keyCollected = true;
                        keyGroup.visible = false;
                        keyLabel.visible = false;
                        butlerGroup.userData.prompt = "Press E to possess butler and unlock door";
                        showGuideline("The butler has the key now. Possess him again to unlock the door.", 7000, 'key_collected');
                        setTimeout(() => {
                            showGuideline("That door hides something important...", 7000, 'door_hint');
                        }, 7500);
                    }
                };
            } else {
                // Butler unlocks door
                return { 
                    duration: 15, 
                    message: "Possessing butler to unlock door...",
                    onEnd: () => {
                        if (!hallwayState.doorUnlocked) {
                            playDramaticSound('door_unlock');
                            hallwayState.doorUnlocked = true;
                            doorPivot.rotation.y = -Math.PI / 2;
                            showGuideline("Light again… and something of me returns.", 7000, 'door_unlocked');
                            setTimeout(() => {
                                showGuideline("A heartbeat… it's mine.", 7000, 'heartbeat');
                            }, 7500);
                            if (group.userData.spawnHeart) {
                                playDramaticSound('heart_spawn');
                                group.userData.spawnHeart();
                                setTimeout(() => {
                                    showGuideline("The heart beats again. One piece found. More to remember...", 7000, 'heart_appears');
                                }, 15500);
                            }
                        }
                    }
                };
            }
        }
        
        return null;
    };
    
    // Enable butler possession after key drops
    group.userData.onKeyDropped = function() {
        butlerGroup.userData.enabled = true;
        butlerGroup.userData.prompt = "Press E to possess butler and pick up key";
    };
    
    // BUTLER ANIMATION
    const patrolPoints = [
        new THREE.Vector3(-3, 0, 2),
        new THREE.Vector3(3, 0, 2),
        new THREE.Vector3(3, 0, 5),
        new THREE.Vector3(-3, 0, 5)
    ];
    let butlerTime = 0;
    
    group.userData.updateButler = function(deltaTime) {
        butlerTime += deltaTime * 0.5;
        const t = (Math.sin(butlerTime) + 1) / 2;
        const currentIdx = Math.floor(butlerTime / Math.PI) % patrolPoints.length;
        const nextIdx = (currentIdx + 1) % patrolPoints.length;
        
        butlerGroup.position.lerpVectors(patrolPoints[currentIdx], patrolPoints[nextIdx], t);
        butlerLabel.position.set(butlerGroup.position.x, -size.y / 2 + 3.5, butlerGroup.position.z);
        
        const direction = new THREE.Vector3().subVectors(patrolPoints[nextIdx], patrolPoints[currentIdx]).normalize();
        if (direction.length() > 0) {
            butlerGroup.rotation.y = Math.atan2(direction.x, direction.z);
        }
    };
    
    // Proximity detection for guidelines
    group.userData.checkProximity = function(playerPos) {
        // Check candle proximity
        candlePositions.forEach((pos, idx) => {
            if (!hallwayState.candlesLit[idx]) {
                const dist = Math.sqrt(
                    Math.pow(playerPos.x - pos.x, 2) + 
                    Math.pow(playerPos.z - pos.z, 2)
                );
                if (dist < 2.5) {
                    showGuideline("That flame... it feels familiar. Press E to possess it.", 7000, 'candle_approach');
                }
            }
        });
        
        // Check clock proximity after riddle solved
        if (hallwayState.riddleSolved && !hallwayState.keyDropped) {
            const clockPos = clockGroup.position;
            const dist = Math.sqrt(
                Math.pow(playerPos.x - (size.x / 2 - 0.8), 2) + 
                Math.pow(playerPos.z - 0, 2)
            );
            if (dist < 3) {
                showGuideline("The pendulum waits for me. Press E to possess the clock.", 7000, 'clock_approach');
            }
        }
        
        // Check butler proximity after key dropped
        if (hallwayState.keyDropped && !hallwayState.keyCollected) {
            const dist = Math.sqrt(
                Math.pow(playerPos.x - butlerGroup.position.x, 2) + 
                Math.pow(playerPos.z - butlerGroup.position.z, 2)
            );
            if (dist < 3) {
                showGuideline("He still wanders... I can borrow his hands. Press E to possess.", 7000, 'butler_approach');
            }
        }
    };
    
    // Initial guidelines sequence
    setTimeout(() => {
        showGuideline("Hmm… I feel something warm nearby.", 7000, 'start_1');
        setTimeout(() => {
            showGuideline("Maybe I should follow the flicker of light.", 7000, 'start_2');
        }, 7500);
    }, 1000);
    
    // FURNITURE - Chairs and Sofa
    // Chair 1 - Left side
    const chair1 = new THREE.Group();
    const chair1Seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.1, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
    );
    chair1Seat.position.y = 0.5;
    chair1.add(chair1Seat);
    
    const chair1Back = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.9, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
    );
    chair1Back.position.set(0, 0.95, -0.25);
    chair1.add(chair1Back);
    
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x4A3828, roughness: 0.8 })
        );
        const x = i % 2 === 0 ? -0.25 : 0.25;
        const z = i < 2 ? -0.25 : 0.25;
        leg.position.set(x, 0.25, z);
        chair1.add(leg);
    }
    
    chair1.position.set(-3.5, -size.y / 2, 1);
    chair1.castShadow = true;
    group.add(chair1);
    
    // Chair 2 - Right side
    const chair2 = chair1.clone();
    chair2.position.set(3.5, -size.y / 2, 1);
    chair2.rotation.y = Math.PI;
    group.add(chair2);
    
    // Large Sofa - Against back wall
    const sofa = new THREE.Group();
    
    // Sofa base
    const sofaBase = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.15, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x3E3A34, roughness: 0.9 })
    );
    sofaBase.position.y = 0.5;
    sofa.add(sofaBase);
    
    // Sofa seat cushions
    for (let i = 0; i < 3; i++) {
        const cushion = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 0.25, 1),
            new THREE.MeshStandardMaterial({ color: 0x4A4540, roughness: 0.85 })
        );
        cushion.position.set(-1 + i * 1, 0.7, 0);
        sofa.add(cushion);
    }
    
    // Sofa backrest
    const sofaBack = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x3E3A34, roughness: 0.9 })
    );
    sofaBack.position.set(0, 1.1, -0.5);
    sofa.add(sofaBack);
    
    // Sofa armrests
    const armrest1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.6, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x3E3A34, roughness: 0.9 })
    );
    armrest1.position.set(-1.5, 0.9, 0);
    sofa.add(armrest1);
    
    const armrest2 = armrest1.clone();
    armrest2.position.x = 1.5;
    sofa.add(armrest2);
    
    // Sofa legs
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: 0x2A2520, roughness: 0.7 })
        );
        const x = i % 2 === 0 ? -1.3 : 1.3;
        const z = i < 2 ? -0.4 : 0.4;
        leg.position.set(x, 0.2, z);
        sofa.add(leg);
    }
    
    sofa.position.set(0, -size.y / 2, size.z / 2 - 1.5);
    sofa.traverse(child => { if (child.isMesh) child.castShadow = true; });
    group.add(sofa);
    
    // Set up spawnHeart callback
    group.userData.spawnHeart = function() {
        if (window.spawnHeartFragment) {
            window.spawnHeartFragment();
        }
    };
    
    console.log("Hallway built successfully");
}
