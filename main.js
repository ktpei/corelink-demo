// Corelink Configuration
const workspace = 'MovieRoom'
const protocol = 'ws'
const datatype = 'movie-control'

const config = {
  username: 'Testuser',
  password: 'Testpassword',
  host: 'corelink.hpc.nyu.edu',
  port: 20012,
};

// Global stream references
let sender = null
let receiver = null
let suppressBroadcast = false;

const video = document.getElementById('player')
video.muted = true  
// chrome restricts autoplay unless video is muted.
// without muting, browsers block programmatic video playback 
// e.g., synced 'play' event will not work.

// Helper functions
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}
function str2ab(str) {
  const buf = new ArrayBuffer(str.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0; i < str.length; i += 1) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

// Send message through Corelink
// function sendMessage(message) {
//   if (!sender) {
//     console.error('Sender not initialized')
//     return
//   }
//   corelink.send(sender, str2ab(message))
//   console.log('Sent:', message)
// }

// Second video controls over Corelink
function sendControl(action, payload = {}) {
  if (!sender) {
    console.error('Sender not initialized')
    return
  }
  const message = { 
    action,
    time: video.currentTime,
    sentAt: Date.now(),
    ...payload,
  }
  corelink.send(sender, str2ab(JSON.stringify(message)))
  console.log('Sent:', message)
}

// Initialize Corelink connection
async function connectCorelink() {  
  try {
    // Connect to Corelink server
    const connected = await corelink.connect(
      { username: config.username, password: config.password },
      { ControlIP: config.host, ControlPort: config.port }
    );
    
    if (!connected) {
      throw new Error('Connection returned false');
    }
    
    console.log('Connected to Corelink', connected);

    // Create receiver
    receiver = await corelink.createReceiver({
      workspace,
      protocol,
      type: datatype,
      echo: true,
      alert: true,
    });
    
    if (!receiver) {
      throw new Error('Failed to create receiver');
    }

    // Create sender
    sender = await corelink.createSender({
      workspace,
      protocol,
      type: datatype,
    });
    
    if (!sender) {
      throw new Error('Failed to create sender');
    }

    // When a new receiver is created, subscribe to it
    corelink.on('receiver', async (data) => {
      console.log('New receiver available:', data);
      try {
        await corelink.subscribe([data.streamID]);
      } catch (e) {
        console.error('Failed to subscribe to receiver:', e);
      }
    });

    // Handle incoming data
    corelink.on('data', (streamID, buf) => {
      const message = ab2str(buf);
      console.log('Received:', message);
      try {
        const control = JSON.parse(message);
        handleControl(control);
      } catch (e) {
        console.error('Failed to parse control:', e);
      }
    });


    
  } catch (e) {
    console.error('Failed to connect to Corelink:', e);
    connectionState = 'error';
    
    // Cleanup partial state
    if (sender) {
      sender = null;
    }
    if (receiver) {
      receiver = null;
    }
    
    alert('Failed to connect. Please refresh and try again.');
    return false;
  }
}

async function handleControl(control) {
  console.log('Received control:', control);
  suppressBroadcast = true;
  
  try {
    switch (control.action) {
      case 'PLAY':
        video.currentTime = control.time ?? video.currentTime;
        video.play();
        break;
      case 'PAUSE':
        video.currentTime = control.time ?? video.currentTime;
        video.pause();
        break;
      case 'SEEK':
        video.currentTime = control.time;
        break;
      case 'SYNC':
        // const targetTime = (video.currentTime + control.time) / 2;
        // diff = Math.abs(targetTime - video.currentTime);
        // if (diff > 1.0 || video.currentTime < 1.0) {
        //   video.currentTime = control.time;
        //   video.playbackRate = 1.0;
        // } else if (diff > 0.02) {
        //   video.playbackRate = targetTime / video.currentTime;
        // } else {
        //   video.playbackRate = 1.0;
        // }
        // break;
      default:
        console.log('Unknown action:', control.action);
    }
  } catch (e) {
    console.error('Failed to handle control:', e);
  } finally {
    // Use finally to ensure flag is always reset
    setTimeout(() => {
      suppressBroadcast = false;
    }, 100);
  }
}

function attachVideoListeners() {
  video.addEventListener('play', () => {
      if (suppressBroadcast) return;
      sendControl('PLAY');
    });
  
    video.addEventListener('pause', () => {
      if (suppressBroadcast) return;
      sendControl('PAUSE');
    });
  
    video.addEventListener('seeking', () => {
      if (suppressBroadcast) return;
      sendControl('SEEK', { targetTime: video.currentTime });
    })
    setInterval(() => {
      if (!suppressBroadcast) {
        sendControl('SYNC');
      }
    }, 1000);
}

// Disconnect from Corelink
async function handleDisconnect() {
  try {    
    // Disconnect from our workspace and type
    const result = await corelink.disconnect({
      workspaces: workspace,
      types: datatype
    });
    
    console.log('Disconnected from Corelink:', result);
    
    // Reset stream references
    sender = null;
    receiver = null;
    
    // Reset video state
    video.pause();
    video.currentTime = 0;
    video.playbackRate = 1;
    
    alert('Disconnected from Corelink');
  } catch (e) {
    console.error('Failed to disconnect from Corelink:', e);
  }
}

// Start the application
attachVideoListeners();
(async () => {
  const connected = await connectCorelink();
  if (connected) {
    console.log('Application ready');
  } else {
    console.error('Failed to initialize application');
  }
})();
