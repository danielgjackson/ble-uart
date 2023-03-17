// Simple BLE UART Connection (tested with micro:bit Bluetooth UART)
// Dan Jackson, 2022

import noble from '@abandonware/noble'
import EventEmitter from 'events'

export default class BleUart extends EventEmitter {

    constructor(peripheral) {
        super()
        this.peripheral = peripheral

        this.connected = false
        this.uartTx = null
        this.uartRx = null

        this.onRead = this.onRead.bind(this)
        this.onDisconnect = this.onDisconnect.bind(this)
    }

    async connect() {
        BleUart.log(`UART: Connecting...`)
        await this.peripheral.connectAsync()

        this.peripheral.on('disconnect', this.onDisconnect)

        BleUart.log(`UART: Finding UART services...`)
        const { services } = await this.peripheral.discoverAllServicesAndCharacteristicsAsync([BleUart.UART_SERVICE_UUID], [BleUart.UART_RX_UUID, BleUart.UART_TX_UUID])
        let uartService = null
        for (const service of services) {
            if (service.uuid == BleUart.UART_SERVICE_UUID) uartService = service
        }
        if (uartService == null) {
            BleUart.log('UART-ERROR: UART service not found')
            throw new Error('UART-ERROR: UART service not found')
        }

        const characteristics = { rx: null, tx: null }
        for (const characteristic of uartService.characteristics) {
            if (characteristic.uuid == BleUart.UART_RX_UUID) characteristics.rx = characteristic
            if (characteristic.uuid == BleUart.UART_TX_UUID) characteristics.tx = characteristic
        }

        if (characteristics.rx == null || characteristics.tx == null) {
            BleUart.log('UART-ERROR: UART Tx/Rx characteristics not found')
            throw new Error('UART-ERROR: UART Tx/Rx characteristics not found')
        }

        if ((characteristics.tx.properties.indexOf('notify') >= 0 || characteristics.tx.properties.indexOf('indicate') >= 0) && (characteristics.rx.properties.indexOf('writeWithoutResponse') >= 0 || characteristics.rx.properties.indexOf('write') >= 0)) {
            this.uartTx = characteristics.tx
            this.uartRx = characteristics.rx
        } else if ((characteristics.rx.properties.indexOf('notify') >= 0 || characteristics.rx.properties.indexOf('indicate') >= 0) && (characteristics.tx.properties.indexOf('writeWithoutResponse') >= 0 || characteristics.tx.properties.indexOf('write') >= 0)) {
            BleUart.log('UART: Using inverted Tx/Rx characteristics')
            this.uartTx = characteristics.rx
            this.uartRx = characteristics.tx
        } else {
            BleUart.log('UART-ERROR: Tx/Rx characteristics do not have expected properties: notify/indicate or writeWithoutResponse/write.')
            throw new Error('UART-ERROR: Tx/Rx characteristics do not have expected properties: notify/indicate or writeWithoutResponse/write.')
        }

        BleUart.log('UART: Found UART service and Tx/Rx characteristics')
        this.uartTx.notify(true)
        this.uartTx.on('read', this.onRead)

        BleUart.log('UART: Connected')
        this.connected = true

        this.emit('connect')
    }

    write(data) {
        if (!this.connected || !this.uartRx) throw new Error('UART-ERROR: Transmit not possible.')
        const writeWithoutResponse = this.uartRx.properties.indexOf('writeWithoutResponse') >= 0
        while (data.length > 0) {
            const buff = data.slice(0, BleUart.UART_CHUNK_SIZE)
            BleUart.log(`UART-WRITE: ${buff.toString().trim()}`)
            this.uartRx.write(Buffer.from(buff), writeWithoutResponse)
            data = data.slice(BleUart.UART_CHUNK_SIZE)
        }
    }

    // Add a buffered reader to read lines (emit 'line' events, optionally add a specified line handler)
    addLineReader(lineHandler, userDelimiter) {
        const delimiter = userDelimiter || '\n'
        let received = ''

        const onRead = (data) => {
            received = received.concat(data)
            for (;;) {
                const lineEnd = received.indexOf(delimiter)
                if (lineEnd < 0) break
                // Special case: also remove CRLF \r\n when splitting at LF \n
                const removeCr = (delimiter == '\n' && lineEnd > 0 && received[lineEnd - 1] == '\r')
                const line = received.slice(0, removeCr ? lineEnd - 1 : lineEnd)
                received = received.slice(lineEnd + 1)

                BleUart.log(`UART-RECV: ${line}`)
                this.emit('line', line)
            }
        }

        if (lineHandler != null) {
            this.addListener('line', lineHandler)
        }

        this.addListener('read', onRead)
    }

    async disconnect() {
        this.peripheral.disconnectAsync()
    }

    onRead(data, notification) {
        if (!notification) BleUart.log('UART-WARNING: Tx read without notification')
        this.emit('read', data)
    }

    onDisconnect() {
        this.connected = false
        this.emit('disconnect')
    }
}

// Static constants
BleUart.UART_CHUNK_SIZE = 20
// From: https://developer.nordicsemi.com/nRF_Connect_SDK/doc/1.4.0/nrf/include/bluetooth/services/nus.html
// As the central, send data to device's Rx, receive data from device's Tx.
// Allow these to be inverted, as the current micro:bit implementation appears to be reversed.
BleUart.UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'.replaceAll('-', '').toLowerCase()
BleUart.UART_RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'.replaceAll('-', '').toLowerCase()     // 'write'/'writeWithoutResponse'
BleUart.UART_TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'.replaceAll('-', '').toLowerCase()     // 'notify' ('indicate' on micro:bit)

// Static values
BleUart.verbose = false     // logging

// Static utility: Wait until noble is in the 'poweredOn' state
BleUart.waitForPoweredOn = async () => {
    return new Promise((resolve) => {
        if (noble.state == 'poweredOn') {
            BleUart.log(`UART: Already in poweredOn state.`)
            resolve()
            return
        }
        const onStateChange = (state) => {
            if (state === 'poweredOn') {
                noble.removeListener('stateChange', onStateChange)
                BleUart.log(`UART: ...now in poweredOn state.`)
                resolve()
            } else {
                BleUart.log(`UART: ...now in state: ${state}`)
            }
        }
        BleUart.log(`UART: Waiting for poweredOn state (currently ${noble.state})...`)
        noble.addListener('stateChange', onStateChange)
    })
}

// Static utility: Scan for, and return a peripheral specified by address
BleUart.scanForPeripheral = async (address) => {
    return new Promise(async (resolve, reject) => {
        if (!/^([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/.test(address)) {
            reject(new Error('UART: Address incorrectly formed'))
        }

        await BleUart.waitForPoweredOn()

        const onScanStop = () => {
            noble.removeListener('scanStop', onScanStop)
            noble.removeListener('onDiscover', onDiscover)
            reject(new Error('UART: Scan stopped before device was found'))
        }

        const onDiscover = async (peripheral) => {
            if (peripheral.address != address.toLowerCase()) return

            noble.removeListener('scanStop', onScanStop)
            noble.removeListener('onDiscover', onDiscover)

            BleUart.log(`UART-DEVICE: Found device ${peripheral.address} (${peripheral.advertisement.localName})`)

            BleUart.log(`UART: Stopping scan...`)
            await noble.stopScanningAsync()

            resolve(peripheral)
        }

        noble.addListener('scanStop', onScanStop)
        noble.addListener('discover', onDiscover)

        BleUart.log(`UART: Starting scan...`)
        await noble.startScanningAsync([], false)
    })
}

// Static utility: Scan for, and create a UART peripheral specified by address
BleUart.scanForBleUart = async (address) => {
    const peripheral = await BleUart.scanForPeripheral(address)
    const bleUart = new BleUart(peripheral)
    return bleUart
}

BleUart.log = (line) => {
    if (!BleUart.verbose) return
    console.log(line)
}
