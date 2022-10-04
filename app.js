const serviceLightMode = '71261000-3692-ae93-e711-472ba41689c9';
const characteristicLightMode = '71261001-3692-ae93-e711-472ba41689c9';
// possible values hex:
// 00
// 01
// 05
// 07
// 08
// 3F

const options = {
    filters: [
        { namePrefix: 'Flare' },
        { namePrefix: 'Ion' }
    ],
    optionalServices: ["battery_service", serviceLightMode]
};

let bluetoothDevice;
let lightModeCharacteristic;

let deviceNameElement = document.getElementById("deviceName");
let batteryLevelElement = document.getElementById("batteryLevel");
let lightModeTextElement = document.getElementById("lightMode");
let statusTextElement = document.getElementById("status");
let changeLightMode = document.getElementById("changeLightMode");
let selectLightMode = document.getElementById("selectLightMode");

function onDisconnectButtonClick() {
    if (!bluetoothDevice) {
        return;
    }
    console.log('Disconnecting from Bluetooth Device...');
    if (bluetoothDevice.gatt.connected) {
        bluetoothDevice.gatt.disconnect();
    } else {
        console.log('Bluetooth Device is already disconnected');
    }
}

function onDisconnected(event) {
    console.log('Bluetooth Device disconnected');
    let button = document.getElementById("button")
    button.innerHTML = 'Connect'
    button.className = 'connect';
    button.onclick = onConnectButtonClick;
    statusTextElement.innerHTML = 'disconnected';
    batteryLevelElement.innerHTML = '';
    lightModeTextElement.innerHTML = '';
    deviceNameElement.innerHTML = '';
    changeLightMode.style.display = "none";
}

function onConnectButtonClick() {
    console.log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice(options)
        .then(device => {
            bluetoothDevice = device;
            console.log('Connecting to GATT Server...');
            statusTextElement.innerHTML = 'Connecting...'
            deviceNameElement.innerHTML = device.name;
            bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
            return bluetoothDevice.gatt.connect();
        })
        .then(server => {
            console.log('Getting Battery Service...');
            statusTextElement.innerHTML = 'Getting Battery Service...'
            return server.getPrimaryService('battery_service');
        })
        .then(service => {
            console.log('Getting Battery Level Characteristic...');
            statusTextElement.innerHTML = 'Getting Battery Level Characteristic...'
            return service.getCharacteristic('battery_level');
        })
        .then(characteristic => {
            console.log('Reading Battery Level...');
            statusTextElement.innerHTML = 'Reading Battery Level...';
            return characteristic.readValue();
        })
        .then(value => {
            let batteryLevel = value.getUint8(0);
            console.log('Battery Level is ' + batteryLevel + '%');
            statusTextElement.innerHTML = '';
            batteryLevelElement.innerHTML = 'Battery Level: ' + batteryLevel + '%';
            var button = document.getElementById("button")
            button.innerHTML = 'Disconnect'
            button.className = 'disconnect';
            button.setAttribute("onClick", "onDisconnectButtonClick();");

            readLightMode();
        })
        .catch(error => {
            console.log('Error: ' + error);
            statusTextElement.innerHTML = 'Error: ' + error;
        });
}

function readLightMode() {
    bluetoothDevice.gatt.getPrimaryService(serviceLightMode)
        .then(service => {
            console.log('Getting Light Mode Characteristic...');
            statusTextElement.innerHTML = 'Getting Light Mode Characteristic...';
            return service.getCharacteristic(characteristicLightMode);
        }).then(characteristic => {
            lightModeCharacteristic = characteristic;
            console.log('Reading Light Mode...');
            statusTextElement.innerHTML = 'Reading Light Mode...';
            characteristic.addEventListener('characteristicvaluechanged', handleLightModeChanged);
            characteristic.startNotifications()
                .then(_ => {
                    console.log('Light Mode Notifications started');
                })
                .catch(error => {
                    log('Argh! ' + error);
                });
            return characteristic.readValue();
        }).then(value => {
            var lightMode = value.getUint8(0).toString(16);
            // console.log('Light mode is ' + lightMode);
            statusTextElement.innerHTML = '';
            // lightModeTextElement.innerHTML = 'Light mode: ' + lightMode;
            changeLightMode.style.display = "block";
        })
        .catch(error => {
            console.log('Error: ' + error);
            statusTextElement.innerHTML = 'Error: ' + error;
        });
}

function handleLightModeChanged(event) {
    console.log('Handle light mode changed notification');
    let lightMode = event.target.value.getUint8(0).toString(16);
    if (lightMode.length == 1) {
        lightMode = '0' + lightMode;
    }
    console.log('Light mode: ' + lightMode);
    lightModeTextElement.innerHTML = 'Light mode: ' + lightMode;
    selectLightMode.value = lightMode;
}

function setLightMode() {
    console.log("light mode charateristic write value");

    // TODO write value 3f?
    // GATT Error: invalid attribute length

    let lightModeCharacteristicToWriteValue = Uint8Array.of(selectLightMode.value);
    lightModeCharacteristic.writeValue(lightModeCharacteristicToWriteValue)
        .then(_ => {
            console.log('Light mode changed');
        })
        .catch(error => {
            console.log('Error: ' + error);
            statusTextElement.innerHTML = 'Error: ' + error;
        });
}
