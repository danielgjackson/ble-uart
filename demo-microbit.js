// Micro:bit UART peripheral demo
//
// At https://makecode.microbit.org/, in the Blocks column select "Advanced", "+ Extensions", 
// search for "bluetooth", select "bluetooth (Bluetooth services)", click "Remove extension(s) and add bluetooth", 
// edit the blocks as below (you can paste this code in JavaScript view, and then return to Blocks view),
// then "Download" the code to program your micro:bit.
//
// Important: You must first pair your computer with the micro:bit by holding down the micro:bit's _A_ + _B_ buttons 
// while pressing the _Reset_ button on the back, then pair your computer.
// For example, "bluetoothctl", "scan on", wait to see your device's address, "scan off", "pair A1:B2:C3:D4:E5:F6"
// (substituting "A1:B2:C3:D4:E5:F6" with your device's address), wait to see "Pairing successful", "exit".
//

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
