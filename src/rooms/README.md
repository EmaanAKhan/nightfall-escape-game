# Room Development Guide

## 📁 File Structure
Each room has its own file:
- `hallway.js` - Room 0 (DONE)
- `labs.js` - Room 1 (Friend 1)
- `chairmanOffice.js` - Room 2 (Friend 2)
- `dorm.js` - Room 3 (Friend 3)
- `commonRoom.js` - Room 4 (Friend 4)
- `basement.js` - Room 5 (Friend 5)

## 🎯 How to Work on Your Room

### 1. Open your assigned file
Example: If you're working on Labs, open `labs.js`

### 2. Add furniture and decorations
Use the provided parameters:
- `group` - Add all your objects to this
- `size` - Room dimensions { x: 9.2, y: 8, z: 13.2 }
- `registerInteractable` - Make objects clickable (optional)

### 3. Example Code
```javascript
// Create a table
const table = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.1, 1),
    new THREE.MeshStandardMaterial({ 
        color: 0x5A4636,  // Brown wood
        roughness: 0.8 
    })
);
table.position.set(0, -size.y / 2 + 0.8, 2);
table.castShadow = true;
group.add(table);
```

## 🎨 Color Palette (Use these colors)
- Wood: `0x5A4636`
- Dark Wood: `0x4A3828`
- Metal: `0x8A7A6A`
- Paper: `0xD8D0C0`
- Fabric: `0x3E3A34`

## 📏 Position Reference
- Floor level: `-size.y / 2` (which is -4)
- Ceiling level: `size.y / 2` (which is 4)
- Back wall: `size.z / 2` (which is 6.6)
- Front wall: `-size.z / 2` (which is -6.6)
- Left wall: `-size.x / 2` (which is -4.6)
- Right wall: `size.x / 2` (which is 4.6)

## ✅ Testing Your Room
1. Save your file
2. Run `npm run dev` in the main folder
3. Play the game and navigate to your room
4. Check if furniture looks good

## 🚫 Don't Touch
- Don't modify `script.js` (main file)
- Don't change other room files
- Don't modify the room size

## 💡 Tips
- Look at `hallway.js` for examples
- Keep furniture against walls (not in center)
- Add shadows: `object.castShadow = true`
- Add variety: tilted chairs, scattered papers, etc.
- Test frequently!

## 🆘 Need Help?
Ask the person who set this up!
