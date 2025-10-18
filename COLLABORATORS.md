# 👥 Collaborators Guide

## How to Join the Project

### Step 1: Get Added as Collaborator
1. Send your GitHub username to **EmaanAKhan**
2. Wait for the invitation email from GitHub
3. Accept the invitation

### Step 2: Clone the Repository
```bash
git clone https://github.com/EmaanAKhan/nightfall-escape-game.git
cd nightfall-escape-game
npm install
```

### Step 3: Choose Your Room
Each person works on ONE room:
- **Friend 1**: `src/rooms/labs.js`
- **Friend 2**: `src/rooms/chairmanOffice.js`
- **Friend 3**: `src/rooms/dorm.js`
- **Friend 4**: `src/rooms/commonRoom.js`
- **Friend 5**: `src/rooms/basement.js`

### Step 4: Work on Your Room
1. Open your assigned file
2. Read `src/rooms/README.md` for instructions
3. Add furniture and decorations
4. Test with `npm run dev`

### Step 5: Push Your Changes
```bash
git add src/rooms/YOUR_ROOM.js
git commit -m "Added furniture to [Room Name]"
git pull origin main
git push origin main
```

## 🚨 Important Rules
- ❌ **DON'T** edit other people's room files
- ❌ **DON'T** edit `src/script.js` (main file)
- ❌ **DON'T** change room sizes or positions
- ✅ **DO** test your changes before pushing
- ✅ **DO** pull before you push
- ✅ **DO** ask for help if stuck

## 🎨 Color Palette
Use these colors for consistency:
- Wood: `0x5A4636`
- Dark Wood: `0x4A3828`
- Metal: `0x8A7A6A`
- Paper: `0xD8D0C0`
- Fabric: `0x3E3A34`

## 📞 Need Help?
Contact **EmaanAKhan** on GitHub or in your group chat!
