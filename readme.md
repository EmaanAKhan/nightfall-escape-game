<h1>Nightfall Escape - 3D Horror Escape Room Game</h1>
<p>An immersive 3D escape room game built with <a href="https://threejs.org/" target="_new">Three.js</a> and <a href="https://greensock.com/gsap/" target="_new">GSAP</a>. Navigate through 6 haunted rooms in an abandoned house, solve riddles, collect keys, and escape before time runs out!</p>

<h2>🎮 Game Features</h2>
<ul>
   <li>🏚️ <strong>Atmospheric Environment</strong> - Abandoned house with realistic lighting, fog, and dust particles</li>
   <li>👻 <strong>Ghost Player Character</strong> - Play as a semi-transparent ghost with ethereal glow</li>
   <li>🔦 <strong>Flashlight Mechanic</strong> - Limited battery that drains over time</li>
   <li>⏱️ <strong>Time Pressure</strong> - 6 minutes to escape all rooms</li>
   <li>🧩 <strong>Puzzle System</strong> - Solve riddles to unlock doors and progress</li>
   <li>🔑 <strong>Key Collection</strong> - Find keys hidden in glass boxes</li>
   <li>🎵 <strong>Ambient Sounds</strong> - Wind, creaking wood, and dripping water</li>
   <li>🚪 <strong>6 Unique Rooms</strong> - Hallway, Labs, Chairman's Office, Dorm, Common Room, Basement</li>
</ul>

<h2>🎯 How to Play</h2>
<ul>
   <li><strong>WASD</strong> - Move around</li>
   <li><strong>Mouse</strong> - Look around</li>
   <li><strong>E</strong> - Interact with objects</li>
   <li><strong>F</strong> - Toggle flashlight</li>
   <li><strong>Click</strong> - Start game</li>
</ul>

<h2>🧩 Riddle Answers</h2>
<ol>
   <li>Hallway: <code>shadow</code></li>
   <li>Labs: <code>middle</code></li>
   <li>Chairman's Office: <code>crimson</code></li>
   <li>Dorm: <code>four</code></li>
   <li>Common Room: <code>floor</code></li>
   <li>Basement: <code>silence</code></li>
</ol>
<h2>How to Run</h2>

# Install dependencies (only the first time)

```
npm install
```

# Run the local server at localhost:8080

```
npm run dev
```

# Build for production in the dist/ directory

```
npm run build
```

<h2>🏗️ Project Structure</h2>
<pre>
src/
├── rooms/           # Individual room modules
│   ├── hallway.js
│   ├── labs.js
│   ├── chairmanOffice.js
│   ├── dorm.js
│   ├── commonRoom.js
│   ├── basement.js
│   └── README.md    # Room development guide
├── script.js        # Main game logic
├── style.css        # UI styling
└── index.html       # Entry point
</pre>

<h2>👥 Contributing</h2>
<p>Each room is modular! To add furniture to a room:</p>
<ol>
   <li>Open the corresponding file in <code>src/rooms/</code></li>
   <li>Add your 3D objects using Three.js</li>
   <li>See <code>src/rooms/README.md</code> for detailed instructions</li>
</ol>

<h2>🎨 Technologies Used</h2>
<ul>
   <li><a href="https://threejs.org/" target="_new">Three.js</a> - 3D rendering</li>
   <li><a href="https://greensock.com/gsap/" target="_new">GSAP</a> - Animations</li>
   <li><a href="https://webpack.js.org/" target="_new">Webpack</a> - Module bundling</li>
   <li>Web Audio API - Ambient sounds</li>
</ul>

<h2>📸 Screenshots</h2>
<p><em>Add screenshots of your game here!</em></p>
<h2>📝 License</h2>
<p>This project is licensed under the MIT License.</p>

<h2>🙏 Credits</h2>
<p>Created as a college project. Special thanks to the Three.js community!</p>
