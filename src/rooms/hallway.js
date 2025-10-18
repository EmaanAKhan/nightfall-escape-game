import * as THREE from "three";

export function buildHallway(group, size, registerInteractable) {
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

    // Two tall bookcases beside window
    const bookcase1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 4.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
    );
    bookcase1.position.set(-2.5, -size.y / 2 + 2.25, size.z / 2 - 0.5);
    bookcase1.castShadow = true;
    group.add(bookcase1);

    const bookcase2 = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 4.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
    );
    bookcase2.position.set(2.5, -size.y / 2 + 2.25, size.z / 2 - 0.5);
    bookcase2.castShadow = true;
    group.add(bookcase2);

    // Books on shelves
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

    // Small side table
    const sideTable = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.08, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
    );
    sideTable.position.set(size.x / 2 - 1.5, -size.y / 2 + 0.6, 0);
    sideTable.castShadow = true;
    group.add(sideTable);

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

    // Cup on table
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

    // Crooked painting
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

    // Old lamp
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

    // Ink bottle
    const inkBottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 0.1, 16),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.3 })
    );
    inkBottle.position.set(0.8, -size.y / 2 + 1.0, size.z / 2 - 1.8);
    inkBottle.castShadow = true;
    group.add(inkBottle);

    // Cobwebs in corners
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

    // Cobwebs between shelves
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

    // Broken frame
    const brokenFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.7, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x3A2818, roughness: 0.85 })
    );
    brokenFrame.position.set(-size.x / 2 + 0.3, -size.y / 2 + 0.35, -2);
    brokenFrame.rotation.y = Math.PI / 2;
    brokenFrame.rotation.z = Math.PI / 12;
    brokenFrame.castShadow = true;
    group.add(brokenFrame);

    // Torn map
    const tornMap = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xC8C0B0, roughness: 0.9 })
    );
    tornMap.position.set(size.x / 2 - 0.3, -size.y / 2 + 0.4, 3);
    tornMap.rotation.y = -Math.PI / 2;
    tornMap.rotation.z = -Math.PI / 16;
    group.add(tornMap);

    // Dust particles
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
