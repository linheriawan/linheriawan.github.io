// Universal Device API Handler
// Supports: Web Serial, Web HID, Web Bluetooth

// ==================== GLOBAL STATE ====================
let serialPort = null;
let serialReader = null;
let serialWriter = null;
let isSerialReading = false;
let serialViewMode = 'text'; // 'text', 'hex', or 'both'

let hidDevice = null;

let bluetoothDevice = null;
let bluetoothServer = null;
let bluetoothCharacteristics = new Map();

// ==================== DEVICE PROFILES ====================
const deviceProfiles = {
    at: {
        name: 'AT Commands',
        lineEnding: '\r\n',
        commands: [
            { label: 'Test', cmd: 'AT' },
            { label: 'Info', cmd: 'ATI' },
            { label: 'Signal', cmd: 'AT+CSQ' },
            { label: 'Network', cmd: 'AT+CREG?' },
            { label: 'SIM Status', cmd: 'AT+CPIN?' },
            { label: 'IMEI', cmd: 'AT+CGSN' }
        ]
    },
    escpos: {
        name: 'ESC/POS Printer',
        lineEnding: '',
        commands: [
            { label: 'Initialize', cmd: '\x1B\x40', hex: true },
            { label: 'Test Print', cmd: 'Hello from Web Serial!\n\n\n\x1D\x56\x00', hex: false },
            { label: 'Feed Paper', cmd: '\x1B\x64\x05', hex: true },
            { label: 'Cut Paper', cmd: '\x1D\x56\x00', hex: true },
            { label: 'Bold ON', cmd: '\x1B\x45\x01', hex: true },
            { label: 'Bold OFF', cmd: '\x1B\x45\x00', hex: true },
            { label: 'Align Center', cmd: '\x1B\x61\x01', hex: true },
            { label: 'Align Left', cmd: '\x1B\x61\x00', hex: true }
        ]
    },
    scale: {
        name: 'Weight Scale',
        lineEnding: '',
        commands: [
            { label: 'Request Weight', cmd: 'W\r\n' },
            { label: 'Zero Scale', cmd: 'Z\r\n' },
            { label: 'Tare', cmd: 'T\r\n' }
        ]
    },
    edc: {
        name: 'EDC Machine',
        lineEnding: '\r\n',
        commands: [
            { label: 'Status', cmd: 'STATUS' },
            { label: 'Reset', cmd: 'RESET' }
        ]
    },
    raw: {
        name: 'Raw Data',
        lineEnding: '',
        commands: []
    }
};

// ==================== UI HELPERS ====================

function switchTab(tab) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));

    // Show selected tab
    document.getElementById(`${tab}-tab`).classList.add('active');
    event.target.classList.add('active');
}

function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
}

function bytesToText(bytes) {
    return Array.from(bytes)
        .map(b => {
            // Show printable ASCII, escape others
            if (b >= 32 && b <= 126) {
                return String.fromCharCode(b);
            } else if (b === 10) {
                return '\\n';
            } else if (b === 13) {
                return '\\r';
            } else if (b === 9) {
                return '\\t';
            } else {
                return `\\x${b.toString(16).padStart(2, '0')}`;
            }
        })
        .join('');
}

function log(device, message, type = 'info', rawBytes = null) {
    const terminal = document.getElementById(`${device}-terminal`);
    const timestamp = new Date().toLocaleTimeString();
    const logClass = `log-${type}`;

    const logEntry = document.createElement('div');
    logEntry.className = logClass;

    // For serial device with hex view enabled
    if (device === 'serial' && rawBytes && (type === 'rx' || type === 'tx')) {
        const hexStr = bytesToHex(rawBytes);
        const textStr = bytesToText(rawBytes);

        if (serialViewMode === 'hex') {
            logEntry.textContent = `[${timestamp}] ${message} ${hexStr}`;
        } else if (serialViewMode === 'text') {
            logEntry.textContent = `[${timestamp}] ${message} ${textStr}`;
        } else { // both
            logEntry.textContent = `[${timestamp}] ${message}\n    HEX: ${hexStr}\n    TXT: ${textStr}`;
        }
    } else {
        logEntry.textContent = `[${timestamp}] ${message}`;
    }

    terminal.appendChild(logEntry);
    terminal.scrollTop = terminal.scrollHeight;

    console.log(`[${device}] ${message}`);
}

function setStatus(device, connected, message) {
    const statusEl = document.getElementById(`${device}-status`);
    statusEl.className = `status ${connected ? 'connected' : 'disconnected'}`;

    const indicator = statusEl.querySelector('.status-indicator');
    const text = statusEl.querySelector('span:last-child');
    text.textContent = message;
}

function clearLog(device) {
    document.getElementById(`${device}-terminal`).innerHTML = '';
    log(device, 'Terminal cleared', 'info');
}

// ==================== SERIAL API ====================

async function serialCheckPreviousDevices() {
    if (!('serial' in navigator)) return;

    try {
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
            log('serial', `Found ${ports.length} previously authorized device(s)`, 'info');
            document.getElementById('serial-reconnect').style.display = 'inline-block';
        }
    } catch (err) {
        // Ignore errors
    }
}

async function serialReconnect() {
    if (!('serial' in navigator)) {
        log('serial', 'Web Serial API not supported. Use Chrome or Edge!', 'error');
        return;
    }

    try {
        const ports = await navigator.serial.getPorts();
        if (ports.length === 0) {
            log('serial', 'No previously authorized devices found', 'error');
            return;
        }

        const baudRate = parseInt(document.getElementById('serial-baudrate').value);
        serialPort = ports[0]; // Use first authorized device

        log('serial', `Reconnecting to last device (${baudRate} baud)...`, 'info');
        await serialPort.open({ baudRate: baudRate });

        log('serial', '✅ Reconnected!', 'success');
        setStatus('serial', true, 'Connected (Remembered)');

        // Enable/disable buttons
        document.getElementById('serial-disconnect').disabled = false;
        document.getElementById('serial-reconnect').style.display = 'none';

        // Setup reader and writer
        serialWriter = serialPort.writable.getWriter();
        serialStartReading();

    } catch (err) {
        log('serial', `❌ Reconnect error: ${err.message}`, 'error');
        if (err.message.includes('already open')) {
            log('serial', 'Device may be in use. Try disconnecting first.', 'error');
        }
        setStatus('serial', false, `Error: ${err.message}`);
    }
}

async function serialConnect() {
    if (!('serial' in navigator)) {
        log('serial', 'Web Serial API not supported. Use Chrome or Edge!', 'error');
        alert('Web Serial API not supported. Please use Chrome or Edge browser.');
        return;
    }

    try {
        const baudRate = parseInt(document.getElementById('serial-baudrate').value);
        log('serial', `Requesting serial port (Baud: ${baudRate})...`, 'info');

        // Request port from user
        serialPort = await navigator.serial.requestPort();

        // Open port
        await serialPort.open({
            baudRate: baudRate,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none'
        });

        log('serial', `✅ Connected! Baud rate: ${baudRate}`, 'success');
        setStatus('serial', true, 'Connected');

        // Enable/disable buttons
        document.getElementById('serial-disconnect').disabled = false;
        document.getElementById('serial-reconnect').style.display = 'none';

        // Setup reader and writer
        serialWriter = serialPort.writable.getWriter();
        serialStartReading();

    } catch (err) {
        log('serial', `❌ Connection error: ${err.message}`, 'error');
        setStatus('serial', false, `Error: ${err.message}`);
    }
}

async function serialDisconnect() {
    try {
        isSerialReading = false;

        if (serialReader) {
            await serialReader.cancel();
            serialReader.releaseLock();
            serialReader = null;
        }

        if (serialWriter) {
            serialWriter.releaseLock();
            serialWriter = null;
        }

        if (serialPort) {
            await serialPort.close();
            serialPort = null;
        }

        log('serial', '🔌 Disconnected', 'info');
        setStatus('serial', false, 'Not Connected');
        document.getElementById('serial-disconnect').disabled = true;

        // Show reconnect button after disconnect
        serialCheckPreviousDevices();

    } catch (err) {
        log('serial', `❌ Disconnect error: ${err.message}`, 'error');
    }
}

async function serialStartReading() {
    isSerialReading = true;
    serialReader = serialPort.readable.getReader();

    try {
        while (isSerialReading) {
            const { value, done } = await serialReader.read();
            if (done) break;

            // Pass raw bytes to log for hex/text display
            log('serial', 'RX:', 'rx', value);
        }
    } catch (err) {
        if (isSerialReading) {
            log('serial', `❌ Read error: ${err.message}`, 'error');
        }
    } finally {
        serialReader.releaseLock();
        serialReader = null;
    }
}

function serialChangeView(mode) {
    serialViewMode = mode;
    log('serial', `View mode changed to: ${mode}`, 'info');
}

function loadDeviceProfile() {
    const profileSelect = document.getElementById('serial-device-profile');
    const profile = deviceProfiles[profileSelect.value];
    const commandsDiv = document.getElementById('serial-quick-commands');

    commandsDiv.innerHTML = '';

    if (profile.commands.length === 0) {
        commandsDiv.innerHTML = '<p style="color: #888; grid-column: 1 / -1;">No quick commands for this profile</p>';
        return;
    }

    profile.commands.forEach(cmd => {
        const button = document.createElement('button');
        button.className = 'button secondary';
        button.textContent = cmd.label;
        button.onclick = () => serialSendQuick(cmd.cmd, cmd.hex);
        commandsDiv.appendChild(button);
    });
}

async function serialSend() {
    const input = document.getElementById('serial-input');
    const data = input.value;

    if (!data) {
        log('serial', '⚠️ No data to send', 'error');
        return;
    }

    await serialSendData(data, false);
    input.value = '';
}

async function serialSendQuick(command, isHex = false) {
    await serialSendData(command, isHex);
}

async function serialSendData(data, isHex = false) {
    if (!serialPort || !serialWriter) {
        log('serial', '❌ Not connected!', 'error');
        return;
    }

    try {
        const profileSelect = document.getElementById('serial-device-profile');
        const profile = deviceProfiles[profileSelect.value];

        let encoded;
        if (isHex) {
            // Data is already a string with escape sequences
            encoded = new TextEncoder().encode(data);
        } else {
            // Add line ending based on profile
            const textToSend = data + profile.lineEnding;
            encoded = new TextEncoder().encode(textToSend);
        }

        await serialWriter.write(encoded);
        log('serial', 'TX:', 'tx', encoded);
    } catch (err) {
        log('serial', `❌ Send error: ${err.message}`, 'error');
    }
}

// Handle Enter key for serial input
document.addEventListener('DOMContentLoaded', () => {
    const serialInput = document.getElementById('serial-input');
    if (serialInput) {
        serialInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') serialSend();
        });
    }

    // Load device profile on change
    const profileSelect = document.getElementById('serial-device-profile');
    if (profileSelect) {
        profileSelect.addEventListener('change', loadDeviceProfile);
        loadDeviceProfile(); // Load initial profile
    }
});

// ==================== HID API ====================

async function hidConnect() {
    if (!('hid' in navigator)) {
        log('hid', 'Web HID API not supported. Use Chrome or Edge!', 'error');
        alert('Web HID API not supported. Please use Chrome or Edge browser.');
        return;
    }

    try {
        log('hid', 'Opening device picker...', 'info');

        // Request device (no filters = show all HID devices)
        const devices = await navigator.hid.requestDevice({
            filters: []
        });

        if (devices.length === 0) {
            log('hid', '⚠️ No device selected', 'error');
            return;
        }

        hidDevice = devices[0];

        // Open device
        await hidDevice.open();

        log('hid', `✅ Connected: ${hidDevice.productName}`, 'success');
        log('hid', `   VID: 0x${hidDevice.vendorId.toString(16).padStart(4, '0')}`, 'info');
        log('hid', `   PID: 0x${hidDevice.productId.toString(16).padStart(4, '0')}`, 'info');

        setStatus('hid', true, 'Connected');
        document.getElementById('hid-disconnect').disabled = false;

        // Show device info
        document.getElementById('hid-device-info').style.display = 'block';
        document.getElementById('hid-name').textContent = hidDevice.productName || 'Unknown';
        document.getElementById('hid-ids').textContent =
            `VID: 0x${hidDevice.vendorId.toString(16).padStart(4, '0')} / PID: 0x${hidDevice.productId.toString(16).padStart(4, '0')}`;

        // Listen for input reports
        hidDevice.addEventListener('inputreport', hidHandleInputReport);

    } catch (err) {
        log('hid', `❌ Connection error: ${err.message}`, 'error');
        setStatus('hid', false, `Error: ${err.message}`);
    }
}

async function hidDisconnect() {
    try {
        if (hidDevice) {
            hidDevice.removeEventListener('inputreport', hidHandleInputReport);
            await hidDevice.close();
            hidDevice = null;
        }

        log('hid', '🔌 Disconnected', 'info');
        setStatus('hid', false, 'Not Connected');
        document.getElementById('hid-disconnect').disabled = true;
        document.getElementById('hid-device-info').style.display = 'none';

    } catch (err) {
        log('hid', `❌ Disconnect error: ${err.message}`, 'error');
    }
}

function hidHandleInputReport(event) {
    const { data, reportId } = event;
    const bytes = new Uint8Array(data.buffer);
    const hexString = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');

    log('hid', `RX [Report ${reportId}]: ${hexString}`, 'rx');
}

async function hidSend() {
    if (!hidDevice) {
        log('hid', '❌ Not connected!', 'error');
        return;
    }

    const input = document.getElementById('hid-input').value.trim();
    if (!input) {
        log('hid', '⚠️ No data to send', 'error');
        return;
    }

    try {
        // Parse hex string to bytes
        const hexBytes = input.split(/\s+/).map(h => parseInt(h, 16));

        if (hexBytes.some(b => isNaN(b) || b < 0 || b > 255)) {
            log('hid', '❌ Invalid hex format. Use: 01 02 03 04', 'error');
            return;
        }

        const reportId = hexBytes[0]; // First byte is report ID
        const data = new Uint8Array(hexBytes.slice(1));

        await hidDevice.sendReport(reportId, data);
        log('hid', `TX [Report ${reportId}]: ${input}`, 'tx');

        document.getElementById('hid-input').value = '';

    } catch (err) {
        log('hid', `❌ Send error: ${err.message}`, 'error');
    }
}

// Handle Enter key for HID input
document.addEventListener('DOMContentLoaded', () => {
    const hidInput = document.getElementById('hid-input');
    if (hidInput) {
        hidInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') hidSend();
        });
    }
});

// ==================== BLUETOOTH API ====================

async function bluetoothConnect() {
    if (!('bluetooth' in navigator)) {
        log('bluetooth', 'Web Bluetooth API not supported. Use Chrome or Edge!', 'error');
        alert('Web Bluetooth API not supported. Please use Chrome or Edge browser.');
        return;
    }

    try {
        const serviceUUID = document.getElementById('bluetooth-service-uuid').value.trim();

        log('bluetooth', 'Opening device picker...', 'info');

        // Request device
        const options = {
            acceptAllDevices: !serviceUUID,
            optionalServices: serviceUUID ? [serviceUUID] : []
        };

        if (serviceUUID) {
            options.filters = [{ services: [serviceUUID] }];
            delete options.acceptAllDevices;
        }

        bluetoothDevice = await navigator.bluetooth.requestDevice(options);

        log('bluetooth', `Device selected: ${bluetoothDevice.name || 'Unknown'}`, 'info');

        // Connect to GATT server
        bluetoothServer = await bluetoothDevice.gatt.connect();

        log('bluetooth', '✅ Connected to GATT server', 'success');
        setStatus('bluetooth', true, 'Connected');
        document.getElementById('bluetooth-disconnect').disabled = false;

        // Show device info
        document.getElementById('bluetooth-device-info').style.display = 'block';
        document.getElementById('bluetooth-name').textContent = bluetoothDevice.name || 'Unknown';
        document.getElementById('bluetooth-id').textContent = bluetoothDevice.id;

        // Get services
        const services = await bluetoothServer.getPrimaryServices();
        log('bluetooth', `Found ${services.length} service(s)`, 'info');

        for (const service of services) {
            log('bluetooth', `  Service: ${service.uuid}`, 'info');

            // Get characteristics
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
                log('bluetooth', `    Characteristic: ${char.uuid}`, 'info');
                bluetoothCharacteristics.set(char.uuid, char);

                // Start notifications if supported
                if (char.properties.notify) {
                    await char.startNotifications();
                    char.addEventListener('characteristicvaluechanged', bluetoothHandleNotification);
                    log('bluetooth', `    📡 Notifications enabled for ${char.uuid}`, 'success');
                }
            }
        }

        // Handle disconnection
        bluetoothDevice.addEventListener('gattserverdisconnected', () => {
            log('bluetooth', '🔌 Device disconnected', 'info');
            setStatus('bluetooth', false, 'Disconnected');
            document.getElementById('bluetooth-disconnect').disabled = true;
        });

    } catch (err) {
        log('bluetooth', `❌ Connection error: ${err.message}`, 'error');
        setStatus('bluetooth', false, `Error: ${err.message}`);
    }
}

async function bluetoothDisconnect() {
    try {
        if (bluetoothDevice && bluetoothDevice.gatt.connected) {
            bluetoothDevice.gatt.disconnect();
        }

        bluetoothDevice = null;
        bluetoothServer = null;
        bluetoothCharacteristics.clear();

        log('bluetooth', '🔌 Disconnected', 'info');
        setStatus('bluetooth', false, 'Not Connected');
        document.getElementById('bluetooth-disconnect').disabled = true;
        document.getElementById('bluetooth-device-info').style.display = 'none';

    } catch (err) {
        log('bluetooth', `❌ Disconnect error: ${err.message}`, 'error');
    }
}

function bluetoothHandleNotification(event) {
    const value = event.target.value;
    const bytes = new Uint8Array(value.buffer);
    const hexString = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');

    // Try to decode as text
    const decoder = new TextDecoder();
    const text = decoder.decode(value);

    log('bluetooth', `RX [${event.target.uuid}]: ${hexString}`, 'rx');
    if (text.match(/^[\x20-\x7E\s]+$/)) {
        log('bluetooth', `    Text: "${text}"`, 'info');
    }
}

async function bluetoothSend() {
    if (!bluetoothDevice || !bluetoothDevice.gatt.connected) {
        log('bluetooth', '❌ Not connected!', 'error');
        return;
    }

    const charUUID = document.getElementById('bluetooth-char-uuid').value.trim();
    const data = document.getElementById('bluetooth-input').value.trim();

    if (!charUUID || !data) {
        log('bluetooth', '⚠️ Please provide characteristic UUID and data', 'error');
        return;
    }

    try {
        const characteristic = bluetoothCharacteristics.get(charUUID);

        if (!characteristic) {
            log('bluetooth', `❌ Characteristic ${charUUID} not found`, 'error');
            log('bluetooth', 'Available characteristics:', 'info');
            bluetoothCharacteristics.forEach((char, uuid) => {
                log('bluetooth', `  ${uuid}`, 'info');
            });
            return;
        }

        // Encode data
        const encoder = new TextEncoder();
        const encoded = encoder.encode(data);

        await characteristic.writeValue(encoded);
        log('bluetooth', `TX [${charUUID}]: ${data}`, 'tx');

        document.getElementById('bluetooth-input').value = '';

    } catch (err) {
        log('bluetooth', `❌ Send error: ${err.message}`, 'error');
    }
}

// Handle Enter key for Bluetooth input
document.addEventListener('DOMContentLoaded', () => {
    const bluetoothInput = document.getElementById('bluetooth-input');
    if (bluetoothInput) {
        bluetoothInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') bluetoothSend();
        });
    }
});

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    // Check API support
    if (!('serial' in navigator)) {
        log('serial', '⚠️ Web Serial API not supported in this browser', 'error');
        log('serial', '   Please use Chrome or Edge browser', 'error');
    } else {
        log('serial', '🚀 Serial API ready. Select device profile and click Connect.', 'info');
        serialCheckPreviousDevices(); // Check for previously authorized devices
    }

    if (!('hid' in navigator)) {
        log('hid', '⚠️ Web HID API not supported in this browser', 'error');
    } else {
        log('hid', '🚀 HID API ready. Click Connect to start.', 'info');
    }

    if (!('bluetooth' in navigator)) {
        log('bluetooth', '⚠️ Web Bluetooth API not supported in this browser', 'error');
    } else {
        log('bluetooth', '🚀 Bluetooth API ready. Click Connect to start.', 'info');
    }
});
