import * as THREE from "three";

/**
 * PRIVATE CHAMBER - Room 4
 * The final memory chamber where truth is revealed
 */
export function buildDorm(group, size, registerInteractable) {
    console.log("Building Private Chamber...");
    
    const chamberState = {
        heartMerged: false,
        keyRevealed: false,
        letterRead: false,
        mirrorActivated: false,
        choiceMade: false
    };
    
    // Floor - Black with wooden texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const floorCtx = floorCanvas.getContext('2d');
    floorCtx.fillStyle = '#000000';
    floorCtx.fillRect(0, 0, 512, 512);
    
    // Wood grain lines
    floorCtx.strokeStyle = '#1a1a1a';
    floorCtx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
        floorCtx.beginPath();
        floorCtx.moveTo(0, i * 8.5);
        floorCtx.lineTo(512, i * 8.5 + (Math.random() - 0.5) * 10);
        floorCtx.stroke();
    }
    
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);
    
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x, size.z),
        new THREE.MeshStandardMaterial({ map: floorTexture, color: 0x000000, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -size.y / 2;
    group.add(floor);
    
    // Walls - Darkest blue (no animation)
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x0a1628, roughness: 0.8 });
    const wallPositions = [
        { pos: [0, 0, -size.z/2], rot: [0, 0, 0] },
        { pos: [0, 0, size.z/2], rot: [0, Math.PI, 0] },
        { pos: [-size.x/2, 0, 0], rot: [0, Math.PI/2, 0] },
        { pos: [size.x/2, 0, 0], rot: [0, -Math.PI/2, 0] }
    ];
    
    wallPositions.forEach(w => {
        const wall = new THREE.Mesh(
            new THREE.PlaneGeometry(size.x, size.y),
            wallMaterial.clone()
        );
        wall.position.set(...w.pos);
        wall.rotation.set(...w.rot);
        group.add(wall);
    });
    
    // Ceiling - Darkest blue
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x, size.z),
        new THREE.MeshStandardMaterial({ color: 0x0a1628 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = size.y / 2;
    group.add(ceiling);
    
    // Heart-shaped relic on pedestal
    const pedestalBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 1.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.6 })
    );
    pedestalBase.position.set(0, -size.y / 2 + 0.6, 0);
    group.add(pedestalBase);
    
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.3, -0.15, 0.3, -0.15, 0.15);
    heartShape.bezierCurveTo(-0.15, 0, -0.15, -0.1, 0, -0.3);
    heartShape.bezierCurveTo(0.15, -0.1, 0.15, 0, 0.15, 0.15);
    heartShape.bezierCurveTo(0.15, 0.3, 0, 0.3, 0, 0.2);
    
    const heartRelic = new THREE.Mesh(
        new THREE.ExtrudeGeometry(heartShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 }),
        new THREE.MeshStandardMaterial({ 
            color: 0xFF0000, 
            emissive: 0xFF0000, 
            emissiveIntensity: 0.5 
        })
    );
    heartRelic.position.set(0, -size.y / 2 + 1.5, 0);
    heartRelic.rotation.y = Math.PI;
    heartRelic.scale.set(2, 2, 2);
    heartRelic.userData.type = "heart_relic";
    heartRelic.userData.prompt = "Press E to merge heart fragment";
    group.add(heartRelic);
    registerInteractable(heartRelic);
    
    const heartLight = new THREE.PointLight(0xFF0000, 1, 5);
    heartLight.position.set(0, -size.y / 2 + 1.5, 0);
    group.add(heartLight);
    
    // Ornate chest (final safe) - Bigger and golden
    const chestGroup = new THREE.Group();
    chestGroup.position.set(3, -size.y / 2 + 0.7, -3);
    
    // Chest body
    const chestBody = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.9, 1.4),
        new THREE.MeshStandardMaterial({ 
            color: 0xFFD700, 
            roughness: 0.2, 
            metalness: 0.9 
        })
    );
    chestBody.position.y = -0.25;
    chestGroup.add(chestBody);
    
    // Chest lid
    const chestLid = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.5, 1.4),
        new THREE.MeshStandardMaterial({ 
            color: 0xFFD700, 
            roughness: 0.2, 
            metalness: 0.9 
        })
    );
    chestLid.position.set(0, 0.45, -0.7);
    chestGroup.add(chestLid);
    
    chestGroup.userData.type = "ornate_chest";
    chestGroup.userData.prompt = "Locked. Find the final key.";
    chestGroup.userData.locked = true;
    group.add(chestGroup);
    registerInteractable(chestGroup);
    
    const chest = chestGroup;
    
    // Golden decorations on chest
    const chestLock = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.5, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.9 })
    );
    chestLock.position.set(3, -size.y / 2 + 0.7, -2.3);
    group.add(chestLock);
    
    // Chest glow light
    const chestGlowLight = new THREE.PointLight(0xFFD700, 0, 8);
    chestGlowLight.position.set(3, -size.y / 2 + 0.7, -3);
    group.add(chestGlowLight);
    
    // Key inside chest
    const chestKey = new THREE.Group();
    const chestKeyShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9, emissive: 0xFFD700, emissiveIntensity: 0.5 })
    );
    chestKeyShaft.rotation.z = Math.PI / 2;
    chestKey.add(chestKeyShaft);
    const chestKeyBow = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.04, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9, emissive: 0xFFD700, emissiveIntensity: 0.5 })
    );
    chestKeyBow.position.x = -0.35;
    chestKey.add(chestKeyBow);
    chestKey.position.set(0, 0.3, 0);
    chestKey.visible = false;
    chestGroup.add(chestKey);
    
    const chestKeyLight = new THREE.PointLight(0xFFD700, 1, 3);
    chestKeyLight.position.set(0, 0.1, 0);
    chestKey.add(chestKeyLight);
    
    // Desk with scattered letters
    const desk = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.1, 1),
        new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
    );
    desk.position.set(-3, -size.y / 2 + 0.8, 2);
    group.add(desk);
    
    // Desk legs
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0x5A4636 })
        );
        const x = i % 2 === 0 ? -0.9 : 0.9;
        const z = i < 2 ? -0.4 : 0.4;
        leg.position.set(-3 + x, -size.y / 2 + 0.4, 2 + z);
        group.add(leg);
    }    
    // Cracked mirror
    const mirrorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2.5, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x3A2818, roughness: 0.6 })
    );
    mirrorFrame.position.set(-size.x / 2 + 0.1, 0.5, 0);
    mirrorFrame.rotation.y = Math.PI / 2;
    group.add(mirrorFrame);
    
    const mirror = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 2.3),
        new THREE.MeshStandardMaterial({ 
            color: 0x6a7a8a, 
            metalness: 0.9, 
            roughness: 0.1,
            emissive: 0x000000,
            emissiveIntensity: 0
        })
    );
    mirror.position.set(-size.x / 2 + 0.08, 0.5, 0);
    mirror.rotation.y = Math.PI / 2;
    group.add(mirror);
    
    // Invisible interaction box in front of mirror
    const mirrorInteraction = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1.5),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    mirrorInteraction.position.set(-size.x / 2 + 1, 0.5, 0);
    mirrorInteraction.userData.type = "cracked_mirror";
    mirrorInteraction.userData.prompt = "The mirror awaits...";
    group.add(mirrorInteraction);
    registerInteractable(mirrorInteraction);
    
    // HUGE white ivory bed on back wall
    // Bed legs
    const bedLegPositions = [
        [-2.2, size.z / 2 - 2.8],
        [2.2, size.z / 2 - 2.8],
        [-2.2, size.z / 2 - 0.4],
        [2.2, size.z / 2 - 0.4]
    ];
    bedLegPositions.forEach(([x, z]) => {
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.12, 0.5, 8),
            new THREE.MeshStandardMaterial({ color: 0xE8DCC8, roughness: 0.6 })
        );
        leg.position.set(x, -size.y / 2 + 0.25, z);
        group.add(leg);
    });
    
    // Bed frame base
    const bedFrame = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.15, 2.6),
        new THREE.MeshStandardMaterial({ color: 0xE8DCC8, roughness: 0.6 })
    );
    bedFrame.position.set(0, -size.y / 2 + 0.5, size.z / 2 - 1.6);
    group.add(bedFrame);
    
    // Mattress
    const mattress = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, 0.4, 2.4),
        new THREE.MeshStandardMaterial({ color: 0xFFB366, roughness: 0.8 })
    );
    mattress.position.set(0, -size.y / 2 + 0.68, size.z / 2 - 1.6);
    group.add(mattress);
    
    // Headboard
    const headboard = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1.8, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xE8DCC8, roughness: 0.6 })
    );
    headboard.position.set(0, -size.y / 2 + 1.4, size.z / 2 - 0.3);
    group.add(headboard);
    
    // Pillows
    for (let i = 0; i < 3; i++) {
        const pillow = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.25, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xFFB366, roughness: 0.9 })
        );
        pillow.position.set((i - 1) * 1.4, -size.y / 2 + 0.95, size.z / 2 - 0.7);
        pillow.rotation.x = -0.2;
        group.add(pillow);
    }
    
    // Blanket
    const blanket = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.1, 1.8),
        new THREE.MeshStandardMaterial({ color: 0xFF9944, roughness: 0.9 })
    );
    blanket.position.set(0, -size.y / 2 + 0.9, size.z / 2 - 2);
    group.add(blanket);
    
    // Final key (materializes after heart merge)
    const finalKey = new THREE.Group();
    const keyShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9 })
    );
    keyShaft.rotation.z = Math.PI / 2;
    finalKey.add(keyShaft);
    
    const keyBow = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.04, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9 })
    );
    keyBow.position.x = -0.4;
    finalKey.add(keyBow);
    
    finalKey.position.set(0, -size.y / 2 + 1.2, 0);
    finalKey.visible = false;
    finalKey.userData.type = "final_key";
    finalKey.userData.prompt = "Press E to take the final key";
    group.add(finalKey);
    registerInteractable(finalKey);
    
    const keyLight = new THREE.PointLight(0xFFD700, 0.5, 3);
    keyLight.position.set(0, 0.1, 0);
    finalKey.add(keyLight);
    
    // Flickering candles around the room
    const candlePositions = [
        [-3, -size.y / 2 + 0.5, -3],
        [3, -size.y / 2 + 0.5, -3],
        [-3, -size.y / 2 + 0.5, 4],
        [3, -size.y / 2 + 0.5, 4]
    ];
    
    candlePositions.forEach(pos => {
        const candle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 0.4, 16),
            new THREE.MeshStandardMaterial({ color: 0xE8D4B0 })
        );
        candle.position.set(...pos);
        group.add(candle);
        
        const flame = new THREE.PointLight(0xFF6600, 0.3, 4);
        flame.position.set(pos[0], pos[1] + 0.3, pos[2]);
        group.add(flame);
    });
    
    // BIG CHANDELIER with bright white light
    const chandelierBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9 })
    );
    chandelierBase.position.set(0, size.y / 2 - 0.3, 0);
    group.add(chandelierBase);
    
    // Chandelier arms
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8),
            new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9 })
        );
        arm.position.set(
            Math.sin(angle) * 0.75,
            size.y / 2 - 1.3,
            Math.cos(angle) * 0.75
        );
        arm.rotation.z = Math.PI / 6;
        group.add(arm);
        
        // Candle holders
        const holder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 0.3, 16),
            new THREE.MeshStandardMaterial({ color: 0xFFFFF0 })
        );
        holder.position.set(
            Math.sin(angle) * 1.2,
            size.y / 2 - 1.8,
            Math.cos(angle) * 1.2
        );
        group.add(holder);
    }
    
    // Bright white light falling down
    const chandelierLight = new THREE.PointLight(0xFFFFFF, 2, 25);
    chandelierLight.position.set(0, size.y / 2 - 1.5, 0);
    chandelierLight.castShadow = true;
    group.add(chandelierLight);
    
    // Additional spotlight effect
    const spotLight = new THREE.SpotLight(0xFFFFFF, 1.5, 30, Math.PI / 4, 0.5, 1);
    spotLight.position.set(0, size.y / 2 - 1, 0);
    spotLight.target.position.set(0, -size.y / 2, 0);
    group.add(spotLight);
    group.add(spotLight.target);
    
    const dormState = {
        shownMessages: new Set(),
        roomEnterTime: Date.now()
    };
    
    function showHint(text, duration = 8000, key = null) {
        if (key && dormState.shownMessages.has(key)) return;
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.7;
            utterance.pitch = 0.6;
            utterance.volume = 0.9;
            window.speechSynthesis.speak(utterance);
        }
        
        if (window.showCenterPrompt) {
            window.showCenterPrompt(text, duration / 1000);
        }
        
        if (key) dormState.shownMessages.add(key);
    }
    
    function updateDormHints(deltaTime) {
        const timeSinceEnter = (Date.now() - dormState.roomEnterTime) / 1000;
        
        if (timeSinceEnter > 1 && !dormState.shownMessages.has('allLines')) {
            showHint("The heart beats only for the one who dares to remember. Seek the key that death refused to hold. Only then may breath return to silence.", 11000, 'allLines');
        }
    }
    
    // Speech synthesis helper for interactions
    function speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 0.7;
            utterance.volume = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // Interaction logic
    group.userData.interact = function(object) {
        console.log("DORM INTERACT CALLED", object.userData.type);
        const type = object.userData.type;
        
        if (type === "heart_relic") {
            console.log("Heart relic interaction, merged:", chamberState.heartMerged);
            if (!chamberState.heartMerged) {
                chamberState.heartMerged = true;
                
                // Heart merge animation
                heartRelic.scale.set(2.5, 2.5, 2.5);
                heartRelic.material.emissiveIntensity = 2.5;
                heartLight.intensity = 5;
                
                showHint("The heart beats again. You remember your name.", 8000, null);
                
                // Reveal final letter
                setTimeout(() => {
                    if (window.spawnLetter) {
                        const letterText = "He was right about everything. The bribes, the bodies, the silence. We burned the only man who told the truth.";
                        window.spawnLetter(3, {
                            prompt: "Press E to read the final letter",
                            revisitPrompt: "Press E to revisit the final letter",
                            onRead: () => {
                                chamberState.letterRead = true;
                                speakText(letterText);
                                chest.userData.locked = false;
                                chest.userData.prompt = "Press E to open the chest";
                                chestBody.material.emissive = new THREE.Color(0xFFD700);
                                chestBody.material.emissiveIntensity = 0.5;
                                chestGlowLight.intensity = 2;
                                mirror.material.emissiveIntensity = 0.3;
                                chamberState.keyRevealed = true;

                                const msg1 = "The chest unlocks. Your truth has been revealed.";
                                const utterance1 = new SpeechSynthesisUtterance(msg1);
                                utterance1.rate = 0.7;
                                utterance1.pitch = 0.6;
                                utterance1.volume = 0.9;
                                utterance1.onend = () => {
                                    const msg2 = "The mirror calls to you.";
                                    const utterance2 = new SpeechSynthesisUtterance(msg2);
                                    utterance2.rate = 0.7;
                                    utterance2.pitch = 0.6;
                                    utterance2.volume = 0.9;
                                    window.speechSynthesis.speak(utterance2);
                                    window.showCenterPrompt(msg2, 8);
                                    mirrorInteraction.userData.prompt = "Press E. The mirror awaits...";
                                };

                                window.speechSynthesis.speak(utterance1);
                                window.showCenterPrompt(msg1, 8);
                            }
                        });
                    }
                    showHint("A letter appears revealing the truth of your death.", 8000);
                }, 3000);
                
                return { duration: 3, message: "" };
            } else {
                return { duration: 0, message: "Already merged" };
            }
        }
        
        if (type === "final_key" && chamberState.keyRevealed) {
            finalKey.visible = false;
            chest.userData.locked = false;
            chest.userData.prompt = "Press E to open the chest";
            
            const text = "The final key is yours.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(text, 5);
            }
            speakText(text);
            
            return { duration: 2, message: "Taking the final key..." };
        }
        
        if (type === "ornate_chest" && !chest.userData.locked) {
            // Open chest lid animation
            chestLid.rotation.x = -Math.PI / 2.5;
            chestKey.visible = true;
            showHint("The chest opens. A key lies within.", 8000);
            
            // Show ending choice message
            setTimeout(() => {
                showHint("Decide your ending - redemption or rebirth through corruption - the mirror or the key?", 12000);
                mirrorInteraction.userData.prompt = "Press E. The mirror awaits...";
            }, 3000);
            
            return { duration: 3, message: "" };
        }
        
        if (type === "cracked_mirror") {
            if (chamberState.letterRead) {
                window.changeRoom('Basement');
                return { duration: 0, message: "" };
            } else {
                return { duration: 0, message: "Read the letter first" };
            }
        }
        
        return null;
    };
    
    group.userData.updateDorm = function(deltaTime) {
        updateDormHints(deltaTime);
    };
    
    // Reset room enter time when entering
    group.userData.onEnter = function() {
        dormState.roomEnterTime = Date.now();
        dormState.shownMessages.clear();
    };
    
    console.log("Private Chamber built successfully");
}




