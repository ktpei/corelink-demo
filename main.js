

const workspace = 'Holodeck'
const protocol = 'ws'
const datatype = 'testdata'

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

function sendMessage(message) {
    corelink.send(sender, str2ab(message))
}


  

async function run() {
    const config = {
        username: 'Testuser',
        password: 'Testpassword',
        host: 'corelink.hpc.nyu.edu',
        port: 20012,
        payload: 4096
    }
    if (await corelink.connect(
        { username: config.username, password: config.password }, 
        { ControlIP: config.host, ControlPort: config.port }
    ).catch((e) => console.log(e))) {

    // This part creates the receiver.
    receiver = await corelink.createReceiver({
        workspace, protocol, type: datatype, echo: true, alert: true,
    }).catch((err) => { console.log(err) })
    // This part creates the sender.
    sender = await corelink.createSender({
        workspace,
        protocol,
        type: datatype,
        // metadata: { name: 'Random Data' },
    }).catch((err) => { console.log(err) })

    
    corelink.on('receiver', (e) => console.log('receiver callback', e))
    corelink.on('sender', (e) => console.log('sender callback', e))
    corelink.on('stale', (e) => console.log('stale callback', e))
    corelink.on('dropped', (e) => console.log('dropped callback', e))
    
    }
    
    corelink.on('receiver', async (data) => {
        await corelink.subscribe([data.streamID])
    })


    corelink.on('data', (streamID, data) => {
        console.log(ab2str(data))
	document.getElementById("content").innerHTML = ab2str(data)

    })

}

run()