# Corelink Movie Room

A synchronized video player that uses [Corelink](https://corelink.hpc.nyu.edu/) to keep multiple viewers in sync in real-time.

## Features

- **Bidirectional Control Sync**
  - Play, pause, and seek events propagate instantly between all connected clients.

- **Playback-Rate Drift Correction**
  - Adjusts playback speed (0.5×–2×) to smoothly converge instead of jumping.

- **Peer-to-peer**: All connected clients sync with each other 

## How to Run

1. **Play/Pause/Seek**: When any user controls the video, all connected users receive the same action
2. **Continuous sync**: Every second, clients exchange timestamps and adjust playback speed to stay synchronized
3. **Smart drift correction**: 
   - Large drift (>1s): Jumps to sync position
   - Small drift: Adjusts playback rate using `targetTime/currentTime` ratio
   - In sync (<0.02s): Normal 1.0x playback

---
## Setup

### Option A — Open Directly
1. Download the project folder.
2. Double-click `index.html` to open it in Chrome.
3. Open the same file in another tab or browser window.
4. Both tabs will connect to Corelink and sync automatically.

### Option B — Run With Local Server (for multi-device testing)
1. In the project folder, run one of these commands:

   ```bash
   npx http-server .
   ```
   
   or
   
   ```bash
   npx serve
   ```

2. Open the URL shown in the terminal, usually:
   ```
   http://localhost:8080
   ```

3. Open the same URL on:
   - Another browser tab, or
   - Another device on the same Wi-Fi network
  