import * as THREE from "three";

/**
 * LABS ROOM - Room 1
 * Friend 1: Add your lab furniture and decorations here
 * 
 * Available parameters:
 * - group: THREE.Group to add objects to
 * - size: { x, y, z } room dimensions
 * - registerInteractable: function to make objects interactive
 */
export function buildLabs(group, size, registerInteractable) {
    // TODO: Add lab equipment, tables, beakers, etc.
    // Example:
    
    // Lab table
    const labTable = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.1, 1),
        new THREE.MeshStandardMaterial({ color: 0x5A4636, roughness: 0.8 })
    );
    labTable.position.set(0, -size.y / 2 + 0.8, 2);
    labTable.castShadow = true;
    group.add(labTable);
    
    // Add more furniture here...
}
