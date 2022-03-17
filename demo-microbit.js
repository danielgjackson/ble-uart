// Micro:bit UART peripheral demo
//
// At https://makecode.microbit.org/, in the Blocks column select "Advanced", "+ Extensions", 
// search for "bluetooth", select "bluetooth (Bluetooth services)", click "Remove extension(s) and add bluetooth", 
// edit the blocks as below (you can paste this code in JavaScript view, and then return to Blocks view),
// then "Download" the code to program your micro:bit.
//
// Important: Before communicating with the computer, you must first pair it with the micro:bit.  
// Hold down the micro:bit's _A_ + _B_ buttons while pressing the "Reset" button on the back, then pair your computer.
// e.g. On a Raspberry Pi, use: "bluetoothctl", "scan on", wait to see your device's address, "scan off", "pair A1:B2:C3:D4:E5:F6"
// (substituting "A1:B2:C3:D4:E5:F6" with your device's address), wait to see "Pairing successful", "exit",
// then press the "Reset" button on the back of your micro:bit to restart your application.
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
