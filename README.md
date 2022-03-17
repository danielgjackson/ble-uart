# Bluetooth BLE Nordic UART Client

BLE UART client using *noble*.

To use the package:

```bash
npm i -s @danielgjackson/ble-uart
```

Example code for `demo.mjs` (substitute `A1:B2:C3:D4:E5:F6` with your device's address):

```javascript
import BleUart from '@danielgjackson/ble-uart'

async function demo(address) {
    console.log('Scanning...')
    const bleUart = await BleUart.scanForBleUart(address)

    bleUart.addLineReader((line) => {
        console.log(`Received: ${line}`)
    })

    console.log('Connecting...')
    await bleUart.connect()

    console.log('Connected!')
    bleUart.write('connected\n')
}

demo('A1:B2:C3:D4:E5:F6')
```

To run the example:

```bash
sudo $(which node) demo.mjs
```

To run this without needing `sudo` access each time, you can give the current `node` binary permission to use Bluetooth at a low level (and this must be repeated if you change the node version, e.g. with `nvm`):

```bash
sudo setcap cap_net_raw+eip $(eval readlink -f $(which node))
```

...after which, you should be able to run using:

```bash
node demo.mjs
```
