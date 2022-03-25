# Micro:bit Bluetooth UART Connection with the Raspberry Pi

## Program the micro:bit

At [makecode.microbit.org](https://makecode.microbit.org/), in the Blocks column select _Advanced_, _+ Extensions_, search for `bluetooth`, select _bluetooth_ (_Bluetooth services_), click _Remove extension(s) and add bluetooth_, edit the blocks as follows (you can paste this code in _JavaScript_ view, and then return to _Blocks_ view):

```javascript
bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.Yes)
})
bluetooth.onBluetoothDisconnected(function () {
    basic.showIcon(IconNames.No)
})
input.onButtonPressed(Button.A, function () {
    bluetooth.uartWriteLine("a")
})
bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    recv = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine))
    basic.showString(recv)
})
input.onButtonPressed(Button.B, function () {
    bluetooth.uartWriteLine("b")
})
let recv = ""
bluetooth.startUartService()
basic.showString("-")
basic.forever(function () {
})
```

_Download_ the code to program your micro:bit.


## Pair your Raspberry Pi with the micro:bit

1. Enter pairing mode on the micro:bit by holding down _A_ + _B_ buttons while pressing the _Reset_ button on the back.

2. Pair with your Pi with your micro:bit:

    a. Start a scan for devices with your Raspberry Pi:

     ```
     bluetoothctl
     menu scan
     duplicate-data off
     back
     scan on
     ```

    b. If you already know your micro:bit's Bluetooth address (recommended, for example, from previously making it an Eddystone beacon with a unique URL), you can move on.  Otherwise, try to identify your micro:bit (it is tricky to find your device when there is lots of other traffic, so perhaps best to try in an area with fewer other Bluetooth devices), and record the address, as an example (with the address `A1:B2:C3:D4:E5:F6`):

     ```
     [NEW] Device A1:B2:C3:D4:E5:F6 BBC micro:bit [name]
     ```

    c. Stop the scan:

     ```
     scan off
     ```

    d. Pair with your micro:bit (replace `A1:B2:C3:D4:E5:F6` with your micro:bit's address):

     ```
     pair A1:B2:C3:D4:E5:F6
     ```

    e. When you see _Pairing successful_, exit the _bluetoothctl_ program:

     ```
     exit
     ```

## Communicate with your micro:bit

Create a new folder, initialize npm, and add the `noble` package for BLE communication (the `@abandonware` version as the original does not work with recent versions of *node*):

```bash
mkdir sample-ble-uart
cd sample-ble-uart
npm init -y
npm i -s @danielgjackson/ble-uart
```

Create a new test program that uses this module, `demo.mjs`:

```javascript
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
```

Run your program as root, substituting `A1:B2:C3:D4:E5:F6` with your device's address (the `which node` substitution is made to be compatible with `nvm`):

```bash
sudo $(which node) demo.mjs A1:B2:C3:D4:E5:F6
```

If your micro:bit is powered, running the above code, paired (as above), and you have specified the correct address -- your Pi should connect and the micro:bit will briefly display a tick (`✓`) to show it is connected, then an exclamation mark (`!`) as send from the Pi and received by the micro:bit.  If you press the *A* button a number of times you should see the `UART-RECV:` lines on the Pi.  If you press the *B* button, the Pi will send back the total number of *A* presses it counted, and that will be shown on the micro:bit.

> &#9758; To run this without needing `sudo`, as a normal user, you can give the current `node` binary permission to use Bluetooth at a low level (and this must be repeated if you change the node version, e.g. with `nvm`):
> ```bash
> sudo setcap cap_net_raw+eip $(eval readlink -f $(which node))
> ```
