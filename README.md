# 🌙 Ritual Penang - Interactive WebGL Experience

An immersive 3D web experience for Ritual Penang, featuring interactive spaces, mystical atmospheres, and community engagement.

## ✨ Features

### 🎭 Entry Experience
- **Smoke Effect Animation**: Atmospheric particle system creates a mystical entrance
- **Glowing Sigil**: Click the ritual sigil to enter the 3D space
- **Loading Screen**: Smooth transition while 3D models load

### 🌍 Interactive 3D World
Navigate through the ritual space using:
- **WASD / Arrow Keys**: Move around the space
- **Mouse**: Look around (first-person view)
- **Click**: Interact with 3D models and objects

### 🏛️ Ritual Spaces (Concept)

1. **Moon Hall (月亮大厅)**
   - Central floating moon
   - Displays upcoming events
   - Click to view event calendar

2. **Transmission Chamber (传输间)**
   - Flowing sound waveforms on walls
   - Patreon integration
   - Click glowing sigil for membership info

3. **The Brew Room (酿造室)**
   - Featuring YamChi ritual beverage
   - Information about Ritual Brew

4. **Ritual Stage (舞台)**
   - Floating projection screen
   - Media gallery of past events

5. **Sigil Gate (符文之门)**
   - Contact information portal
   - Social media links

### 🎯 Interactive Features

#### Click Interactions
- **Main Model**: Triggers teleportation effect and shows random sigil quotes
- **Logo Model**: Opens Patreon support panel
- **Mystical Quotes**: Random wisdom appears when exploring

#### Keyboard Shortcuts
- **M Key**: Toggle Full Moon Mode
  - Changes atmosphere to moonlight silver
  - Plays special ambient sound
  - Enhanced ethereal lighting

#### Hidden Easter Egg 🥚
- Type **"RITUAL"** anywhere to trigger a secret mystical effect
- Red energy burst with special sound

#### Patreon Integration
- Support panel with membership benefits
- Access code system for exclusive content
- Secret room unlock (Code: `FULLMOON`)

### 🎵 Sound Design
- **Ambient Background**: Continuous atmospheric loop
- **Ritual Sound**: Interaction feedback
- **Full Moon Mode**: Special moonlight ambience
- **Portal Sound**: Teleportation effect
- **Easter Egg Sound**: Secret discovery chime

## 🚀 Setup & Installation

### 1. Clone Repository
```bash
git clone https://github.com/wkang0223/ritual-website.git
cd ritual-website
```

### 2. Add Audio Files
Place the following MP3 files in the `sounds/` directory:
- `ritual-sound.mp3`
- `fullmoon-sound.mp3`
- `portal-sound.mp3`
- `easteregg-sound.mp3`
- `ambient.mp3`

See `sounds/README.md` for details on what each file should contain.

### 3. Local Development
Simply open `index.html` in a modern web browser, or use a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

### 4. Deploy to GitHub Pages
1. Go to your repository settings on GitHub
2. Navigate to "Pages" section
3. Select "main" branch as source
4. Your site will be live at: `https://wkang0223.github.io/ritual-website/`

## 📁 Project Structure

```
ritual-website/
├── index.html          # Main HTML structure
├── style.css           # Ritual-themed styling
├── main.js             # Three.js interactive logic
├── main.glb            # Main 3D space model (21MB)
├── rituallogo.glb      # Ritual logo 3D model (17MB)
├── sounds/             # Audio files directory
│   ├── README.md       # Audio requirements
│   ├── ambient.mp3
│   ├── ritual-sound.mp3
│   ├── fullmoon-sound.mp3
│   ├── portal-sound.mp3
│   └── easteregg-sound.mp3
└── README.md           # This file
```

## 🎨 Customization

### Sigil Quotes
Edit the `sigilQuotes` array in `main.js`:
```javascript
const sigilQuotes = [
    "Every ritual begins with listening.",
    "Your custom quote here...",
];
```

### Patreon Access Code
Change the secret room code in `main.js`:
```javascript
const validCode = 'FULLMOON'; // Change to your code
```

### Colors & Styling
Modify `style.css` to adjust:
- Color scheme (currently red/gold theme)
- Font styles
- Animation timings
- Panel layouts

### 3D Models
Replace `main.glb` and `rituallogo.glb` with your own models:
- Export from Blender, Cinema 4D, or other 3D software
- Use GLB/GLTF format
- Keep file sizes reasonable for web

## 🌐 Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Requires:
- WebGL support
- Pointer Lock API
- Modern JavaScript (ES6+)

## 🔧 Technical Stack

- **Three.js** (r128): 3D rendering engine
- **GLTFLoader**: 3D model loading
- **PointerLockControls**: First-person camera controls
- **Vanilla JavaScript**: No framework dependencies
- **CSS3 Animations**: Smooth UI transitions

## 🎯 Roadmap

### Current Version (v1.0)
- ✅ Entry screen with sigil
- ✅ 3D space navigation
- ✅ Model loading (main + logo)
- ✅ Click interactions
- ✅ Full Moon Mode
- ✅ Patreon integration
- ✅ Hidden easter egg
- ✅ Sound system

### Future Enhancements
- [ ] Multiple distinct rooms (Moon Hall, Transmission Chamber, etc.)
- [ ] Video texture integration for Ritual Stage
- [ ] Real-time event calendar API
- [ ] Multiplayer/social features
- [ ] VR support
- [ ] Mobile optimization
- [ ] CMS integration for content updates
- [ ] Analytics tracking

## 📝 Notes

- The website works without audio files, but interactive sounds will be silent
- Models are loaded asynchronously - loading time depends on connection speed
- First-person controls require pointer lock (click to activate)
- Some features may require user interaction before audio can play (browser policy)

## 🙏 Credits

**Ritual Penang Team**
- Concept & Design
- 3D Models
- Sound Design

**Technology**
- Three.js by Mr.doob and contributors
- GLB models created in Blender

## 📄 License

© 2025 Ritual Penang. All rights reserved.

---

**For questions or support:**
- Instagram: [@ritual.penang](https://instagram.com/ritual.penang)
- Email: ritualpg@gmail.com

*Every ritual begins with listening.* 🌙
