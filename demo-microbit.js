// Micro:bit UART peripheral demo
//
// At https://makecode.microbit.org/, in the Blocks column select "Advanced", "+ Extensions", 
// search for `bluetooth`, select "bluetooth (Bluetooth services)", click "Remove extension(s) and add bluetooth", 
// edit the blocks as below (you can paste this code in JavaScript view, and then return to Blocks view),
// then "Download" the code to program your micro:bit.

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
