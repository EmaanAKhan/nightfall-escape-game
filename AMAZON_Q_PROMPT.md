# Amazon Q Prompt for Room Implementation

**Copy and paste this to Amazon Q:**

---

I'm working on a ghost possession game. The core system is already built in `src/script.js`. I need to implement my assigned room using the existing possession framework.

**My assigned file:** `src/rooms/[YOUR_ROOM].js`
- labs.js (Friend 1)
- chairmanOffice.js (Friend 2)  
- dorm.js (Friend 3)
- commonRoom.js (Friend 4)
- basement.js (Friend 5)

**Reference implementation:** `src/rooms/hallway.js` (already complete)

**Task:** Build my room with possession puzzles following the exact pattern in hallway.js.

**Requirements:**

1. **Room structure:**
   - Export function: `export function buildMyRoom(group, size, registerInteractable)`
   - Create room state object to track puzzle progress
   - Add floor, walls, and objects using Three.js

2. **Make objects possessable:**
   ```javascript
   object.userData.type = "possess_objectname"; // Must start with "possess_"
   object.userData.prompt = "Press E to possess";
   object.userData.enabled = true; // or false if locked initially
   registerInteractable(object); // REQUIRED
   ```

3. **Implement possession logic:**
   ```javascript
   group.userData.possess = function(object) {
       if (object.userData.type === "possess_objectname") {
           // Your puzzle logic
           return { 
               duration: 5, 
               message: "Possessing...",
               onEnd: () => { /* optional callback */ }
           };
       }
       return null;
   };
   ```

4. **Add riddle callback:**
   ```javascript
   group.userData.onRiddleSolved = function() {
       // Unlock next puzzle step
   };
   ```

5. **Spawn body part when complete:**
   ```javascript
   if (group.userData.spawnHeart) {
       group.userData.spawnHeart();
   }
   ```

**Room dimensions:**
- Width: size.x = 9.2
- Height: size.y = 8  
- Depth: size.z = 13.2
- Floor Y: -size.y / 2
- Ceiling Y: size.y / 2

**Color palette:**
- Wood: 0x5A4636
- Dark Wood: 0x4A3828
- Metal: 0x8A7A6A
- Paper: 0xD8D0C0

**My room's riddle answer:** [shadow/middle/crimson/four/floor/silence]

**Puzzle flow example:**
1. Player solves riddle → unlocks first object
2. Possess object 1 → triggers event → unlocks object 2
3. Possess object 2 → triggers event → unlocks object 3
4. Possess object 3 → spawns heart fragment → player collects → next room

**Critical rules:**
- Do NOT modify `src/script.js`
- Do NOT modify other room files
- Only edit my assigned room file
- Follow the exact pattern from `src/rooms/hallway.js`
- All possession types must start with "possess_"
- Always call `registerInteractable()` on interactive objects
- Return `{ duration, message, onEnd }` from possess function

**Please:**
1. Read `src/rooms/hallway.js` to understand the pattern
2. Implement my room file with 3-4 possession puzzles
3. Ensure proper state management and puzzle sequencing
4. Add atmospheric objects and lighting
5. Test that all objects are properly registered

Generate the complete room implementation following this exact structure.

---

**After Amazon Q generates your code:**
1. Test with `npm run dev`
2. Commit only your room file: `git add src/rooms/yourroom.js`
3. Push: `git commit -m "Add [room name] puzzles" && git push`
