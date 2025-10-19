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
    const chest = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.4, 1.4),
        new THREE.MeshStandardMaterial({ 
            color: 0xFFD700, 
            roughness: 0.2, 
            metalness: 0.9 
        })
    );
    chest.position.set(3, -size.y / 2 + 0.7, -3);
    chest.userData.type = "ornate_chest";
    chest.userData.prompt = "Locked. Find the final key.";
    chest.userData.locked = true;
    group.add(chest);
    registerInteractable(chest);
    
    // Golden decorations on chest
    const chestLock = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.5, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.9 })
    );
    chestLock.position.set(3, -size.y / 2 + 0.7, -2.3);
    group.add(chestLock);
    
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
    
    // Final letter (glowing)
    const finalLetter = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.4),
        new THREE.MeshStandardMaterial({ 
            color: 0xFFF8DC, 
            emissive: 0xFFD700, 
            emissiveIntensity: 0.3 
        })
    );
    finalLetter.rotation.x = -Math.PI / 2;
    finalLetter.position.set(-3, -size.y / 2 + 0.86, 2);
    finalLetter.userData.type = "final_letter";
    finalLetter.userData.prompt = "Press E to read the final letter";
    finalLetter.visible = false;
    group.add(finalLetter);
    registerInteractable(finalLetter);
    
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
    mirror.userData.type = "cracked_mirror";
    mirror.userData.prompt = "The mirror awaits...";
    mirror.userData.enabled = false;
    group.add(mirror);
    registerInteractable(mirror);
    
    // HUGE white ivory bed on back wall
    const bedFrame = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.5, 3),
        new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.7 })
    );
    bedFrame.position.set(0, -size.y / 2 + 0.25, size.z / 2 - 1.6);
    group.add(bedFrame);
    
    const mattress = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.6, 2.8),
        new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.8 })
    );
    mattress.position.set(0, -size.y / 2 + 0.65, size.z / 2 - 1.6);
    group.add(mattress);
    
    // Headboard
    const headboard = new THREE.Mesh(
        new THREE.BoxGeometry(5, 2, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.7 })
    );
    headboard.position.set(0, -size.y / 2 + 1.5, size.z / 2 - 0.15);
    group.add(headboard);
    
    // Pillows
    for (let i = 0; i < 3; i++) {
        const pillow = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.3, 0.5),
            new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.9 })
        );
        pillow.position.set((i - 1) * 1.5, -size.y / 2 + 1.1, size.z / 2 - 1);
        group.add(pillow);
    }
    
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
    
    // Speech synthesis helper
    function speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 0.7;
            utterance.volume = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // Room entry event
    group.userData.onRoomEnter = function() {
        if (window.showCenterPrompt) {
            window.showCenterPrompt("The Private Chamber", 3);
        }
        
        setTimeout(() => {
            const text = "The chamber awaits the truth you buried.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(text, 8);
            }
            speakText(text);
        }, 3500);
        
        setTimeout(() => {
            const text = "Find the heart. Reclaim the name.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(text, 8);
            }
            speakText(text);
        }, 12000);
    };
    
    // Interaction logic
    group.userData.interact = function(object) {
        const type = object.userData.type;
        
        if (type === "heart_relic" && !chamberState.heartMerged) {
            chamberState.heartMerged = true;
            
            // Heart merge animation
            heartRelic.material.emissiveIntensity = 1.5;
            heartLight.intensity = 3;
            
            const text = "The heart beats again. You remember your name.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(text, 8);
            }
            speakText(text);
            
            // Reveal final key
            setTimeout(() => {
                finalKey.visible = true;
                const keyText = "The lock that killed you now seeks to open itself.";
                if (window.showCenterPrompt) {
                    window.showCenterPrompt(keyText, 8);
                }
                speakText(keyText);
                chamberState.keyRevealed = true;
            }, 3000);
            
            // Reveal final letter
            setTimeout(() => {
                finalLetter.visible = true;
            }, 5000);
            
            return { duration: 3, message: "Merging heart fragment..." };
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
        
        if (type === "final_letter" && chamberState.heartMerged) {
            chamberState.letterRead = true;
            
            const letterText = "My Dearest — You should not have returned here. I wrote your name out of the will because you were already gone. The poison was mine, but the guilt was yours. We built this mansion from secrets — each room another lie we told ourselves. And now, you stand where your heart last beat. Forgive me… or finish what we began.";
            speakText(letterText);
            
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;';
            
            const popup = document.createElement('div');
            popup.style.cssText = 'background: #D2B48C; border: 3px solid #8B4513; padding: 30px; max-width: 600px; max-height: 400px; overflow-y: auto;';
            popup.innerHTML = '<div style="color: #000; font-family: serif; font-size: 18px; line-height: 1.8;"><strong>Final Letter</strong><br><br>My Dearest —<br><br>You should not have returned here.<br>I wrote your name out of the will because you were already gone.<br>The poison was mine, but the guilt was yours.<br>We built this mansion from secrets — each room another lie we told ourselves.<br><br>And now, you stand where your heart last beat.<br><br>Forgive me… or finish what we began.<br><br><span style="font-size: 14px; color: #666;">[Press E to close]</span></div>';
            overlay.appendChild(popup);
            document.body.appendChild(overlay);
            
            const closeHandler = (e) => {
                if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') {
                    window.speechSynthesis.cancel();
                    document.body.removeChild(overlay);
                    document.removeEventListener('keydown', closeHandler);
                    
                    // Activate mirror
                    mirror.userData.enabled = true;
                    mirror.material.emissiveIntensity = 0.3;
                    mirror.userData.prompt = "Press E to face the truth";
                    
                    const mirrorText = "The mirror calls to you.";
                    if (window.showCenterPrompt) {
                        window.showCenterPrompt(mirrorText, 8);
                    }
                    speakText(mirrorText);
                }
            };
            document.addEventListener('keydown', closeHandler);
            
            return { duration: 0, message: '' };
        }
        
        if (type === "ornate_chest" && !chest.userData.locked) {
            const text = "The chest opens. Your journey ends here.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(text, 8);
            }
            speakText(text);
            
            // Trigger victory or next sequence
            setTimeout(() => {
                if (window.showCenterPrompt) {
                    window.showCenterPrompt("You have found the truth.", 5);
                }
            }, 3000);
            
            return { duration: 3, message: "Opening the chest..." };
        }
        
        if (type === "cracked_mirror" && chamberState.letterRead) {
            chamberState.mirrorActivated = true;
            
            const text = "She poured the poison. But you raised the glass. You both wanted the silence.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(text, 12);
            }
            speakText(text);
            
            setTimeout(() => {
                const choiceText = "Approach the heart to forgive. Approach the mirror to possess.";
                if (window.showCenterPrompt) {
                    window.showCenterPrompt(choiceText, 10);
                }
                speakText(choiceText);
            }, 12000);
            
            return { duration: 5, message: "The mirror reveals the truth..." };
        }
        
        return null;
    };
    
    console.log("Private Chamber built successfully");
}
