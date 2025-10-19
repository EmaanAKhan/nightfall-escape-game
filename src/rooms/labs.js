import * as THREE from "three";

function createLabel(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 56px serif';
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
    return sprite;
}

export function buildLabs(group, size, registerInteractable) {
    // Walls - White with golden diagonal lines
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 512;
    wallCanvas.height = 512;
    const wallCtx = wallCanvas.getContext('2d');
    wallCtx.fillStyle = '#FFFFFF';
    wallCtx.fillRect(0, 0, 512, 512);
    
    // Golden diagonal lines
    wallCtx.strokeStyle = '#FFD700';
    wallCtx.lineWidth = 3;
    for (let i = -10; i < 20; i++) {
        wallCtx.beginPath();
        wallCtx.moveTo(i * 50, 0);
        wallCtx.lineTo(i * 50 + 512, 512);
        wallCtx.stroke();
    }
    
    const wallTexture = new THREE.CanvasTexture(wallCanvas);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 2);
    
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture, color: 0xFFFFFF });
    const wallPositions = [
        { pos: [0, 0, -size.z/2], rot: [0, 0, 0], size: [size.x, size.y] },
        { pos: [0, 0, size.z/2], rot: [0, Math.PI, 0], size: [size.x, size.y] },
        { pos: [-size.x/2, 0, 0], rot: [0, Math.PI/2, 0], size: [size.z, size.y] },
        { pos: [size.x/2, 0, 0], rot: [0, -Math.PI/2, 0], size: [size.z, size.y] }
    ];
    
    wallPositions.forEach(w => {
        const wall = new THREE.Mesh(
            new THREE.PlaneGeometry(w.size[0], w.size[1]),
            wallMaterial.clone()
        );
        wall.position.set(...w.pos);
        wall.rotation.set(...w.rot);
        group.add(wall);
    });
    
    // Floor - Lightest Brown with wooden texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const floorCtx = floorCanvas.getContext('2d');
    floorCtx.fillStyle = '#A0826D';
    floorCtx.fillRect(0, 0, 512, 512);
    
    // Wood grain lines
    floorCtx.strokeStyle = '#8B7355';
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
        new THREE.MeshStandardMaterial({ map: floorTexture, color: 0xA0826D, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -size.y / 2;
    group.add(floor);
    
    // Big Brown Rug in middle
    const rug = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 3),
        new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, -size.y / 2 + 0.01, 0);
    group.add(rug);
    
    // Ceiling
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x, size.z),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = size.y / 2;
    group.add(ceiling);
    
    // Ceiling-length Bookshelves (left and right only, wider and away from door)
    [-3.5, 3.5].forEach(xPos => {
        const shelf = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, size.y, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x5A4636 })
        );
        shelf.position.set(xPos, 0, -size.z / 2 + 0.3);
        group.add(shelf);
        
        // Ivory colored books
        const bookRows = Math.floor(size.y / 0.3);
        for (let j = 0; j < bookRows * 7; j++) {
            const book = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.25, 0.15),
                new THREE.MeshStandardMaterial({ color: 0xFFFFF0 })
            );
            book.position.set(
                xPos + (j % 7 - 3) * 0.25,
                -size.y / 2 + 0.5 + Math.floor(j / 7) * 0.3,
                -size.z / 2 + 0.5
            );
            group.add(book);
        }
    });
    
    // Two Round Cozy Couches attached to back wall
    const couch1 = new THREE.Group();
    const couch1Seat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16),
        new THREE.MeshStandardMaterial({ color: 0xC19A6B, roughness: 0.95 })
    );
    couch1Seat.rotation.x = Math.PI / 2;
    const couch1Back = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xC19A6B, roughness: 0.95 })
    );
    couch1Back.rotation.z = Math.PI / 2;
    couch1Back.position.set(0, 0.3, -0.3);
    couch1.add(couch1Seat, couch1Back);
    couch1.position.set(-2, -size.y / 2 + 0.4, size.z / 2 - 0.6);
    group.add(couch1);
    
    const couch2 = new THREE.Group();
    const couch2Seat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16),
        new THREE.MeshStandardMaterial({ color: 0xC19A6B, roughness: 0.95 })
    );
    couch2Seat.rotation.x = Math.PI / 2;
    const couch2Back = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xC19A6B, roughness: 0.95 })
    );
    couch2Back.rotation.z = Math.PI / 2;
    couch2Back.position.set(0, 0.3, -0.3);
    couch2.add(couch2Seat, couch2Back);
    couch2.position.set(2, -size.y / 2 + 0.4, size.z / 2 - 0.6);
    group.add(couch2);
    

    
    // Light
    const light = new THREE.PointLight(0xFFFFFF, 1, 20);
    light.position.set(0, size.y / 2 - 1, 0);
    group.add(light);
    
    // HUGE SIDE LAMP in corner
    const lampStand = new THREE.Group();
    
    // Base
    const lampBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 0.1, 16),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8 })
    );
    lampBase.position.y = -size.y / 2 + 0.05;
    lampStand.add(lampBase);
    
    // Tall pole
    const lampPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8 })
    );
    lampPole.position.y = -size.y / 2 + 1.3;
    lampStand.add(lampPole);
    
    // Large lampshade
    const lampShade = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xFFF8DC, emissive: 0xFFFFFF, emissiveIntensity: 0.5 })
    );
    lampShade.position.y = -size.y / 2 + 2.8;
    lampStand.add(lampShade);
    
    // Golden light
    const brightLight = new THREE.PointLight(0xFFD700, 3, 15);
    brightLight.position.y = -size.y / 2 + 2.6;
    brightLight.castShadow = true;
    lampStand.add(brightLight);
    
    lampStand.position.set(-size.x / 2 + 0.5, 0, -size.z / 2 + 0.5);
    group.add(lampStand);
    
    // Three huge paintings on left wall
    const paintingPositions = [-3, 0, 3];
    paintingPositions.forEach(zPos => {
        // Frame
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 1.6, 0.1),
            new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.6, roughness: 0.4 })
        );
        frame.position.set(-size.x / 2 + 0.1, 0.5, zPos);
        frame.rotation.y = Math.PI / 2;
        group.add(frame);
        
        // Canvas with face
        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = 256;
        faceCanvas.height = 384;
        const faceCtx = faceCanvas.getContext('2d');
        faceCtx.fillStyle = '#8B7355';
        faceCtx.fillRect(0, 0, 256, 384);
        faceCtx.fillStyle = '#3A2818';
        faceCtx.beginPath();
        faceCtx.arc(128, 150, 80, 0, Math.PI * 2);
        faceCtx.fill();
        faceCtx.fillStyle = '#FFFFFF';
        faceCtx.beginPath();
        faceCtx.arc(110, 140, 12, 0, Math.PI * 2);
        faceCtx.arc(146, 140, 12, 0, Math.PI * 2);
        faceCtx.fill();
        faceCtx.fillStyle = '#000000';
        faceCtx.beginPath();
        faceCtx.arc(110, 140, 6, 0, Math.PI * 2);
        faceCtx.arc(146, 140, 6, 0, Math.PI * 2);
        faceCtx.fill();
        faceCtx.strokeStyle = '#000000';
        faceCtx.lineWidth = 3;
        faceCtx.beginPath();
        faceCtx.arc(128, 170, 25, 0, Math.PI, false);
        faceCtx.stroke();
        const faceTexture = new THREE.CanvasTexture(faceCanvas);
        const canvas = new THREE.Mesh(
            new THREE.PlaneGeometry(1.1, 1.5),
            new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.8 })
        );
        canvas.position.set(-size.x / 2 + 0.08, 0.5, zPos);
        canvas.rotation.y = Math.PI / 2;
        group.add(canvas);
        
        // Portrait label
        const portraitLabel = createLabel('Portrait');
        portraitLabel.position.set(-size.x / 2 + 0.5, 1.8, zPos);
        group.add(portraitLabel);
    });
    
    // Tall brown ladder on right wall
    const ladderHeight = size.y * 0.9;
    const ladderMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4423, roughness: 0.85 });
    
    // Left rail
    const leftRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, ladderHeight, 0.08),
        ladderMaterial
    );
    leftRail.position.set(size.x / 2 - 0.15, -size.y / 2 + ladderHeight / 2, 0);
    leftRail.rotation.y = -Math.PI / 2;
    group.add(leftRail);
    
    // Right rail
    const rightRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, ladderHeight, 0.08),
        ladderMaterial
    );
    rightRail.position.set(size.x / 2 - 0.15, -size.y / 2 + ladderHeight / 2, 0.6);
    rightRail.rotation.y = -Math.PI / 2;
    group.add(rightRail);
    
    // Ladder steps
    const numSteps = 15;
    for (let i = 0; i < numSteps; i++) {
        const step = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.06, 0.08),
            ladderMaterial
        );
        step.position.set(
            size.x / 2 - 0.15,
            -size.y / 2 + 0.5 + (i * (ladderHeight - 1) / (numSteps - 1)),
            0.3
        );
        step.rotation.y = -Math.PI / 2;
        group.add(step);
    }
    
    // State tracking
    const labState = {
        paperDropped: false,
        cabinetMoved: false,
        safeOpened: false,
        letterRead: false,
        heartCollected: false,
        keyPickedUp: false
    };
    
    // 1. RAT (double size with white eyes, four feet, long tail)
    const rat = new THREE.Group();
    const ratBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x4A4A4A })
    );
    ratBody.rotation.z = Math.PI / 2;
    const ratHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x4A4A4A })
    );
    ratHead.position.set(0.4, 0, 0);
    
    // White eyes
    const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 0.5 })
    );
    leftEye.position.set(0.5, 0.08, 0.08);
    const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 0.5 })
    );
    rightEye.position.set(0.5, 0.08, -0.08);
    
    // Four tiny feet
    for (let i = 0; i < 4; i++) {
        const foot = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 6, 6),
            new THREE.MeshStandardMaterial({ color: 0x3A3A3A })
        );
        foot.position.set(
            i < 2 ? 0.2 : -0.2,
            -0.16,
            i % 2 === 0 ? 0.1 : -0.1
        );
        rat.add(foot);
    }
    
    // Long tail
    const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.01, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x3A3A3A })
    );
    tail.rotation.z = Math.PI / 2;
    tail.rotation.y = -0.3;
    tail.position.set(-0.6, -0.05, 0);
    
    rat.add(ratBody, ratHead, leftEye, rightEye, tail);
    rat.position.set(-3, -size.y / 2 + 0.2, 3);
    rat.userData = { type: 'possess_rat', prompt: 'Press E to possess rat', enabled: true };
    group.add(rat);
    registerInteractable(rat);
    
    const ratLabel = createLabel('Rat');
    ratLabel.position.set(-3, -size.y / 2 + 1.2, 3);
    group.add(ratLabel);
    
    // 2. VENT - Big horizontal vent on left wall near floor
    const vent = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.6, 3),
        new THREE.MeshStandardMaterial({ color: 0x2A2A2A })
    );
    vent.position.set(-size.x / 2 + 0.1, -size.y / 2 + 0.8, 0);
    vent.rotation.y = Math.PI / 2;
    group.add(vent);
    
    const ventLabel = createLabel('Vent');
    ventLabel.position.set(-size.x / 2 + 0.5, -size.y / 2 + 1.5, 0);
    group.add(ventLabel);
    
    // 3. COMBINATION PAPER
    const paper = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xFFF8DC, emissive: 0xFFFF00, emissiveIntensity: 0.2 })
    );
    paper.rotation.x = -Math.PI / 2;
    paper.position.set(2, -size.y / 2 + 0.02, -2);
    paper.visible = false;
    paper.userData = { type: 'paper', prompt: 'Press E to read paper', enabled: false };
    paper.scale.set(0, 0, 0);
    group.add(paper);
    
    const paperLabel = createLabel('Paper');
    paperLabel.position.set(2, -size.y / 2 + 0.6, -2);
    paperLabel.visible = false;
    group.add(paperLabel);
    
    // 4. CABINET
    const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x5A4636 })
    );
    cabinet.position.set(3.5, -size.y / 2 + 1, -2);
    cabinet.userData = { type: 'possess_cabinet', prompt: 'Press E to possess cabinet', enabled: true };
    group.add(cabinet);
    registerInteractable(cabinet);
    
    const cabinetLabel = createLabel('Cabinet');
    cabinetLabel.position.set(3.5, -size.y / 2 + 2.5, -2);
    group.add(cabinetLabel);
    
    // 5. MAID BOT
    const maid = new THREE.Group();
    const maidBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 1.6, 16),
        new THREE.MeshStandardMaterial({ color: 0x2A2A2A })
    );
    const maidHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xD4A574 })
    );
    maidHead.position.y = 1;
    maid.add(maidBody, maidHead);
    maid.position.set(-2, -size.y / 2 + 0.8, 0);
    maid.userData = { type: 'possess_maid', prompt: 'Press E to possess maid', enabled: true };
    group.add(maid);
    registerInteractable(maid);
    
    const maidLabel = createLabel('Maid');
    maidLabel.position.set(-2, -size.y / 2 + 2.8, 0);
    group.add(maidLabel);
    
    const maidPath = [
        new THREE.Vector3(-2, -size.y / 2 + 0.8, 0),
        new THREE.Vector3(2, -size.y / 2 + 0.8, 0),
        new THREE.Vector3(2, -size.y / 2 + 0.8, 3),
        new THREE.Vector3(-2, -size.y / 2 + 0.8, 3)
    ];
    maid.userData.pathIndex = 0;
    maid.userData.moveTime = 0;
    
    group.userData.updateMaid = function(deltaTime) {
        const speed = 0.5;
        maid.userData.moveTime += deltaTime;
        const distance = speed * maid.userData.moveTime;
        const currentPoint = maidPath[maid.userData.pathIndex];
        const nextPoint = maidPath[(maid.userData.pathIndex + 1) % maidPath.length];
        const segmentLength = currentPoint.distanceTo(nextPoint);
        if (distance >= segmentLength) {
            maid.userData.pathIndex = (maid.userData.pathIndex + 1) % maidPath.length;
            maid.userData.moveTime = 0;
            maid.position.copy(nextPoint);
        } else {
            const t = distance / segmentLength;
            maid.position.lerpVectors(currentPoint, nextPoint, t);
        }
        maidLabel.position.copy(maid.position);
        maidLabel.position.y += 2;
    };
    
    // 6. SAFE
    const safe = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.6, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A, metalness: 0.8 })
    );
    safe.position.set(3.5, -size.y / 2 + 0.8, -2.5);
    safe.visible = false;
    safe.userData = { type: 'safe', prompt: 'Press E to interact', enabled: false };
    group.add(safe);
    
    const safeLabel = createLabel('Safe');
    safeLabel.position.set(3.5, -size.y / 2 + 1.5, -2.5);
    safeLabel.visible = false;
    group.add(safeLabel);
    
    // 7. GOLDEN KEY
    const key = new THREE.Group();
    const keyShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9 })
    );
    keyShaft.rotation.z = Math.PI / 2;
    const keyHead = new THREE.Mesh(
        new THREE.TorusGeometry(0.15, 0.05, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9 })
    );
    keyHead.position.x = -0.25;
    key.add(keyShaft, keyHead);
    key.position.set(0.8, -size.y / 2 + 0.3, 0);
    key.visible = false;
    key.userData = { type: 'golden_key', prompt: 'Possess maid to pick up key', enabled: false };
    group.add(key);
    
    const keyLabel = createLabel('Golden Key');
    keyLabel.position.set(0.8, -size.y / 2 + 1, 0);
    keyLabel.visible = false;
    group.add(keyLabel);
    
    // 8. HEART FRAGMENT #2
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.3, -0.15, 0.3, -0.15, 0.15);
    heartShape.bezierCurveTo(-0.15, 0, -0.15, -0.1, 0, -0.3);
    heartShape.bezierCurveTo(0.15, -0.1, 0.15, 0, 0.15, 0.15);
    heartShape.bezierCurveTo(0.15, 0.3, 0, 0.3, 0, 0.2);
    const heart = new THREE.Mesh(
        new THREE.ExtrudeGeometry(heartShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 }),
        new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.8 })
    );
    heart.position.set(0, -size.y / 2 + 1.5, 0);
    heart.rotation.y = Math.PI;
    heart.scale.set(3, 3, 3);
    heart.visible = false;
    heart.userData = { type: 'heart_fragment', prompt: 'Press E to collect Heart Fragment #2', enabled: false };
    group.add(heart);
    
    const heartLabel = createLabel('Heart Fragment');
    heartLabel.position.set(0, -size.y / 2 + 2.5, 0);
    heartLabel.visible = false;
    group.add(heartLabel);
    
    // 9. BURNT LETTER #2
    const letter = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x8B7355, emissive: 0xFF6600, emissiveIntensity: 0.1 })
    );
    letter.rotation.x = -Math.PI / 2;
    letter.position.set(-0.8, -size.y / 2 + 0.82, 0);
    letter.visible = false;
    letter.userData = { type: 'letter', prompt: 'Press E to read letter', enabled: false };
    group.add(letter);
    
    const letterLabel = createLabel('Letter');
    letterLabel.position.set(-0.8, -size.y / 2 + 1.5, 0);
    letterLabel.visible = false;
    group.add(letterLabel);
    
    // 0. Room Enter Hook
    let idleTimer = null;
    
    function speakHint(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 0.7;
            utterance.volume = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    }
    
    group.userData.onRoomEnter = function() {
        if (window.showCenterPrompt) {
            window.showCenterPrompt("Room 2 — Library of Whispers", 3);
        }
        setTimeout(() => {
            const hint = "Something small watches from below.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(hint, 10);
            }
            speakHint(hint);
        }, 3500);
        setTimeout(() => {
            const hint = "It sees where you cannot.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(hint, 10);
            }
            speakHint(hint);
        }, 15500);
        setTimeout(() => {
            const hint = "Become the rat. Follow the vents.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(hint, 10);
            }
            speakHint(hint);
        }, 27500);
        idleTimer = setTimeout(() => {
            const hint = "The answer hides in the dark metal veins.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(hint, 10);
            }
            speakHint(hint);
        }, 39500);
    };
    
    // Possession logic
    group.userData.possess = function(object) {
        const type = object.userData.type;
        
        // 1. Possess Rat → crawl vent → drop paper
        if (type === 'possess_rat') {
            if (idleTimer) clearTimeout(idleTimer);
            const hint = "Small and silent… follow the cold air.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(hint, 9);
            }
            speakHint(hint);
            return {
                duration: 5,
                message: 'Crawling through vent...',
                onEnd: () => {
                    if (!labState.paperDropped) {
                        paper.visible = true;
                        paper.scale.set(1, 1, 1);
                        paper.userData.enabled = true;
                        paperLabel.visible = true;
                        registerInteractable(paper);
                        labState.paperDropped = true;
                        const hint = "A paper fell near the tall cabinet.";
                        if (window.showCenterPrompt) {
                            window.showCenterPrompt(hint, 9);
                        }
                        speakHint(hint);
                        if (window.markChecklistItem) {
                            window.markChecklistItem('checklist-rat');
                        }
                    }
                }
            };
        }
        
        // 4. Possess Cabinet → slides aside → reveals safe
        if (type === 'possess_cabinet') {
            return {
                duration: 3,
                message: 'Moving cabinet...',
                onEnd: () => {
                    if (!labState.cabinetMoved) {
                        cabinet.position.x -= 1;
                        cabinetLabel.position.x -= 1;
                        safe.visible = true;
                        safeLabel.visible = true;
                        safe.userData.enabled = true;
                        registerInteractable(safe);
                        labState.cabinetMoved = true;
                        const hint = "Safe revealed!";
                        if (window.showCenterPrompt) {
                            window.showCenterPrompt(hint, 8);
                        }
                        speakHint(hint);
                    }
                }
            };
        }
        
        // 5. Possess Maid → pick up key and unlock door → transition to room 3
        if (type === 'possess_maid') {
            if (!labState.letterRead) {
                return { duration: 2, message: 'Read the letter first...' };
            }
            if (!labState.heartCollected) {
                return { duration: 2, message: 'Collect the heart first...' };
            }
            if (!labState.keyPickedUp) {
                return {
                    duration: 4,
                    message: 'Picking up golden key...',
                    onEnd: () => {
                        labState.keyPickedUp = true;
                        key.visible = false;
                        keyLabel.visible = false;
                        const door = group.parent.children.find(c => c.userData && c.userData.type === 'door' && c.userData.roomIndex === 1);
                        if (door) door.userData.locked = false;
                        const hint = "Door unlocked! Transitioning to next room...";
                        if (window.showCenterPrompt) {
                            window.showCenterPrompt(hint, 6);
                        }
                        speakHint(hint);
                        setTimeout(() => {
                            if (window.__transitionToRoom) {
                                window.__transitionToRoom(2);
                            }
                        }, 3000);
                    }
                };
            }
        }
        
        return null;
    };
    
    // Interaction logic
    group.userData.interact = function(object) {
        const type = object.userData.type;
        
        // Read Paper
        if (type === 'paper') {
            labState.cabinet_hint_received = true;
            const overlay = document.createElement('div');
            overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); display: flex; justify-content: center; align-items: center; z-index: 1000;`;
            const popup = document.createElement('div');
            popup.style.cssText = `background: #FFF8DC; border: 5px solid #8B4513; padding: 40px; max-width: 700px; box-shadow: 0 0 30px rgba(0,0,0,0.8);`;
            popup.innerHTML = `<div style="color: #2A1810; font-family: 'Georgia', serif; font-size: 22px; line-height: 1.8; text-align: center;"><strong style="font-size: 28px; text-decoration: underline;">Mysterious Note</strong><br><br>The cabinets of wonders hide the mystery of the dead.<br><br><span style="font-size: 16px; color: #666;">[Press E or Enter to close]</span></div>`;
            overlay.appendChild(popup);
            document.body.appendChild(overlay);
            
            const closeOverlay = () => {
                if (overlay.parentNode) document.body.removeChild(overlay);
                document.removeEventListener('keydown', keyHandler);
            };
            
            const keyHandler = (e) => {
                if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') closeOverlay();
            };
            document.addEventListener('keydown', keyHandler);
            
            return { duration: 0, message: '' };
        }
        
        // Read Letter #2
        if (type === 'letter') {
            labState.letterRead = true;
            letter.visible = false;
            letterLabel.visible = false;
            key.userData.enabled = true;
            registerInteractable(key);
            const overlay = document.createElement('div');
            overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;`;
            const popup = document.createElement('div');
            popup.style.cssText = `background: #D2B48C; border: 3px solid #8B4513; padding: 30px; max-width: 600px;`;
            popup.innerHTML = `<div style="color: #000; font-family: serif; font-size: 18px; text-align: center;"><strong>Letter #2 – "Erased"</strong><br><br>These files mention my name, then strike it out.<br>Police reports, witness lists — all edited.<br>Someone wanted me gone, erased from every record.<br>But why?<br><br><span style="font-size: 14px; color: #666;">[Press E to close]</span></div>`;
            overlay.appendChild(popup);
            document.body.appendChild(overlay);
            const closeOverlay = () => {
                if (overlay.parentNode) document.body.removeChild(overlay);
                document.removeEventListener('keydown', keyHandler);
                const hint = "Now possess the maid to pick up the key.";
                if (window.showCenterPrompt) {
                    window.showCenterPrompt(hint, 7);
                }
                speakHint(hint);
            };
            const keyHandler = (e) => {
                if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') closeOverlay();
            };
            document.addEventListener('keydown', keyHandler);
            return { duration: 0, message: '' };
        }
        
        // Safe interaction
        if (type === 'safe') {
            const overlay = document.createElement('div');
            overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); display: flex; justify-content: center; align-items: center; z-index: 1000;`;
            const popup = document.createElement('div');
            popup.style.cssText = `background: #2A2A2A; border: 5px solid #FFD700; padding: 40px; max-width: 500px; box-shadow: 0 0 30px rgba(255,215,0,0.5);`;
            popup.innerHTML = `<div style="color: #FFD700; font-family: 'Courier New', monospace; font-size: 20px; text-align: center;"><strong style="font-size: 28px;">SAFE CODE REQUIRED</strong><br><br>Count the PORTRAITS that stare into nothing.<br><br><input type="text" id="safeCodeInput" maxlength="3" style="width: 150px; padding: 10px; font-size: 24px; text-align: center; background: #1A1A1A; color: #FFD700; border: 2px solid #FFD700; font-family: 'Courier New', monospace;" placeholder="***"><br><br><span style="font-size: 16px; color: #AAA;">[Enter code and press Enter]</span></div>`;
            overlay.appendChild(popup);
            document.body.appendChild(overlay);
            
            const input = document.getElementById('safeCodeInput');
            input.focus();
            
            const closeOverlay = () => {
                if (overlay.parentNode) document.body.removeChild(overlay);
                document.removeEventListener('keydown', keyHandler);
            };
            
            const keyHandler = (e) => {
                if (e.key === 'Enter') {
                    const code = input.value.trim();
                    if (code === '3') {
                        closeOverlay();
                        labState.safeOpened = true;
                        key.visible = true;
                        keyLabel.visible = true;
                        heart.visible = true;
                        heart.userData.enabled = true;
                        heartLabel.visible = true;
                        letter.visible = true;
                        letter.userData.enabled = true;
                        letterLabel.visible = true;
                        registerInteractable(letter);
                        registerInteractable(heart);
                        const hint = "Safe opened! Read the letter first.";
                        if (window.showCenterPrompt) {
                            window.showCenterPrompt(hint, 8);
                        }
                        speakHint(hint);
                    } else {
                        closeOverlay();
                        const hint = "Wrong code. Safe locked.";
                        if (window.showCenterPrompt) {
                            window.showCenterPrompt(hint, 6);
                        }
                        speakHint(hint);
                    }
                } else if (e.key === 'Escape') {
                    closeOverlay();
                }
            };
            document.addEventListener('keydown', keyHandler);
            
            return { duration: 0, message: '' };
        }
        
        // Collect Heart Fragment #2
        if (type === 'heart_fragment') {
            labState.heartCollected = true;
            heart.visible = false;
            heartLabel.visible = false;
            const hint = "Heart Fragment #2 collected! Now read the letter.";
            if (window.showCenterPrompt) {
                window.showCenterPrompt(hint, 9);
            }
            speakHint(hint);
            return { duration: 2, message: 'Heart Fragment #2 collected!' };
        }
        
        return null;
    };
    
    console.log("Library of Whispers built successfully");
}
