# Bluetooth BLE Nordic UART Client

BLE UART client using *noble*.

Example code:

```
import BleUart from '@danielgjackson/ble-uart'

async function demo(address) {
    const bleUart = await BleUart.scanForBleUart(address)
    bleUart.addLineReader((line) => {
        console.log(`Received: ${line}`)
        //bleUart.write('response\n')
    })
    await bleUart.connect()
    bleUart.write('connected\n')
}

demo('A1:B2:C3:D4:E5:F6')
```
