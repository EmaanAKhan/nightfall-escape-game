# 👻 Possession System Guide for Team

## 🎮 Game Concept
You play as a ghost collecting body parts across haunted rooms. You can't touch objects directly — you must **possess** objects/NPCs to solve puzzles.

## 📂 Your Assignment
- **Friend 1**: `src/rooms/labs.js` (Room 2)
- **Friend 2**: `src/rooms/chairmanOffice.js` (Room 3)
- **Friend 3**: `src/rooms/dorm.js` (Room 4)
- **Friend 4**: `src/rooms/commonRoom.js` (Room 5)
- **Friend 5**: `src/rooms/basement.js` (Room 6)

## 🚀 Getting Started

### 1. Pull Latest Code
```bash
git pull origin main
```

### 2. Open Your Room File
Example: `src/rooms/labs.js`

### 3. Copy This Template

```javascript
import * as THREE from "three";

export function buildLabs(group, size, registerInteractable) {
    // YOUR ROOM STATE - track puzzle progress
    const roomState = {
        puzzle1Complete: false,
        puzzle2Complete: false,
        doorUnlocked: false
    };

    // FLOOR
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x, size.z),
        new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -size.y / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // ADD YOUR OBJECTS HERE
    const microscope = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.4, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    microscope.position.set(0, -size.y / 2 + 0.2, 0);
    microscope.userData.type = "possess_microscope"; // IMPORTANT!
    microscope.userData.prompt = "Press E to possess microscope";
    microscope.userData.enabled = true; // false = locked until puzzle solved
    group.add(microscope);
    registerInteractable(microscope); // Makes it clickable

    // POSSESSION LOGIC - This is called when player presses E
    group.userData.possess = function(object) {
        const type = object.userData.type;
        
        if (type === "possess_microscope") {
            // Your puzzle logic here
            roomState.puzzle1Complete = true;
            
            return { 
                duration: 5, // How long possession lasts (seconds)
                message: "Examining sample...",
                onEnd: () => {
                    // Code that runs when possession ends
                    console.log("Microscope possession ended");
                }
            };
        }
        
        return null; // Object can't be possessed
    };

    // RIDDLE CALLBACK - Called when player solves your room's riddle
    group.userData.onRiddleSolved = function() {
        // Unlock next puzzle
        microscope.userData.enabled = true;
        microscope.userData.prompt = "Press E to possess microscope";
    };

    // SPAWN BODY PART - Called when puzzles complete
    group.userData.spawnHeart = function() {
        // This is already handled by script.js
        // Just call it when your puzzles are done
    };
}
```

## 🔑 Key Rules

### Making Objects Possessable
```javascript
object.userData.type = "possess_YOURNAME"; // Must start with "possess_"
object.userData.prompt = "Press E to possess";
object.userData.enabled = true; // false = locked
registerInteractable(object); // REQUIRED!
```

### Possession Return Format
```javascript
return { 
    duration: 5,              // Seconds
    message: "Possessing...", // Shows on screen
    onEnd: () => {            // Optional callback
        // Code when possession ends
    }
};
```

### Unlocking Objects After Riddle
```javascript
group.userData.onRiddleSolved = function() {
    myObject.userData.enabled = true;
    myObject.userData.prompt = "Press E to possess";
};
```

### Spawning Body Part (End of Room)
```javascript
if (group.userData.spawnHeart) {
    group.userData.spawnHeart(); // Spawns heart fragment
}
```

## 📋 Room Riddle Answers
- **Hallway**: "shadow"
- **Labs**: "middle"
- **Chairman's Office**: "crimson"
- **Dorm**: "four"
- **Common Room**: "floor"
- **Basement**: "silence"

## 🎨 Color Palette (Use These)
```javascript
Wood: 0x5A4636
Dark Wood: 0x4A3828
Metal: 0x8A7A6A
Paper: 0xD8D0C0
Fabric: 0x3E3A34
```

## 📐 Room Dimensions
```javascript
size.x = 9.2  // Width
size.y = 8    // Height
size.z = 13.2 // Depth

Floor Y: -size.y / 2 = -4
Ceiling Y: size.y / 2 = 4
```

## 🔄 Git Workflow

### Work on Your Room
```bash
# 1. Pull latest
git pull origin main

# 2. Edit your room file ONLY
# src/rooms/labs.js (or your assigned room)

# 3. Test locally
npm run dev

# 4. Commit YOUR file only
git add src/rooms/labs.js
git commit -m "Add labs room puzzles"
git push
```

### ⚠️ NEVER EDIT:
- `src/script.js` (already has possession system)
- Other people's room files
- Any file outside `src/rooms/`

## 💡 Example: Full Room Flow

```javascript
export function buildLabs(group, size, registerInteractable) {
    const state = { step: 0 };

    // Object 1: Beaker
    const beaker = new THREE.Mesh(...);
    beaker.userData.type = "possess_beaker";
    beaker.userData.enabled = false; // Locked initially
    registerInteractable(beaker);

    // Object 2: Bunsen Burner
    const burner = new THREE.Mesh(...);
    burner.userData.type = "possess_burner";
    burner.userData.enabled = false;
    registerInteractable(burner);

    group.userData.possess = function(object) {
        if (object.userData.type === "possess_beaker" && state.step === 1) {
            state.step = 2;
            burner.userData.enabled = true; // Unlock next object
            return { duration: 3, message: "Mixing chemicals..." };
        }
        
        if (object.userData.type === "possess_burner" && state.step === 2) {
            state.step = 3;
            if (group.userData.spawnHeart) {
                group.userData.spawnHeart(); // Spawn body part!
            }
            return { duration: 5, message: "Heating mixture..." };
        }
        
        return null;
    };

    // Riddle unlocks first object
    group.userData.onRiddleSolved = function() {
        state.step = 1;
        beaker.userData.enabled = true;
    };
}
```

## 🆘 Need Help?
1. Look at `src/rooms/hallway.js` for complete example
2. Test with `npm run dev`
3. Ask in group chat

## ✅ Checklist Before Pushing
- [ ] Objects have `userData.type = "possess_X"`
- [ ] Called `registerInteractable()` on all objects
- [ ] `group.userData.possess()` function exists
- [ ] Returns `{ duration, message }` format
- [ ] Tested locally with `npm run dev`
- [ ] Only committing YOUR room file

---

**Remember**: Each room is independent. You can't break other rooms. Just follow the template! 🚀
