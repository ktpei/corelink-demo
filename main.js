// Corelink Configuration
const workspace = 'Holodeck'
const protocol = 'ws'
const datatype = 'testdata'

const config = {
  username: 'Testuser',
  password: 'Testpassword',
  host: 'corelink.hpc.nyu.edu',
  port: 20012,
}

// Global stream references
let sender = null
let receiver = null

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
function sendMessage(message) {
  if (!sender) {
    console.error('Sender not initialized')
    return
  }
  corelink.send(sender, str2ab(message))
  console.log('Sent:', message)
}

// Initialize Corelink connection
async function run() {
  try {
    // Connect to Corelink server
    const connected = await corelink.connect(
      { username: config.username, password: config.password },
      { ControlIP: config.host, ControlPort: config.port }
    )

    if (!connected) {
      console.error('Failed to connect to Corelink')
      return
    }

    console.log('✅ Connected to Corelink')

    // Create receiver
    receiver = await corelink.createReceiver({
      workspace,
      protocol,
      type: datatype,
      echo: true,
      alert: true,
    })
    console.log('Receiver created:', receiver)

    // Create sender
    sender = await corelink.createSender({
      workspace,
      protocol,
      type: datatype,
    })
    console.log('Sender created:', sender)

    // When a new receiver is created, subscribe to it
    corelink.on('receiver', async (data) => {
      console.log('New receiver available:', data)
      await corelink.subscribe([data.streamID])
    })

    // Handle incoming data
    corelink.on('data', (streamID, data) => {
      const message = ab2str(data)
      console.log('Received:', message)
      document.getElementById('content').innerHTML = message
    })

    // Log other events
    corelink.on('sender', (e) => console.log('Sender event:', e))
    corelink.on('stale', (e) => console.log('Stale stream:', e))
    corelink.on('dropped', (e) => console.log('Dropped stream:', e))
  } catch (err) {
    console.error('Error initializing Corelink:', err)
  }
}

// Start the application
run()