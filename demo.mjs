// This demonstration is designed to communicate with a micro:bit programmed with "demo-microbit.js"

import BleUart from '@danielgjackson/ble-uart'

//BleUart.verbose = true

// Example functionality
let counter = 0
async function run(address) {

    console.log(`Scanning... ${address}`)
    const bleUart = await BleUart.scanForBleUart(address)
    console.log('...found!')

    bleUart.addLineReader((line) => {
        console.log(`Received: ${line}`)

        // Button A to add one to the counter
        if (line == 'a') {
            counter++
            console.log(`Counter: ${counter}`)
        }

        // Button B to send back the total and clear the counter.
        if (line == 'b') {
            const send = '' + counter
            console.log(`Sending: ${send}`)
            bleUart.write(send + '\n')
            counter = 0
        }
    })

    console.log('Connecting...')
    await bleUart.connect()
    console.log('...connected!')

    // Send an exclamation mark when first connected
    const send = '!'
    console.log(`Sending: ${send}`)
    bleUart.write(send + '\n')  // Add line-feed character so that we're sending a line of text
}

// Device address as program parameter
let address = null
if (process.argv.length == 3) address = process.argv[2]
if (address) {
    run(address)
} else {
    console.log('ERROR: Address not specified on command line.  Type:  node demo.mjs A1:B2:C3:D4:E5:F6')
}
