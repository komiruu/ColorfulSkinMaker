const qwertyLayout = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L',';'],
    ['Z','X','C','V','B','N','M',',','.','/']
];


// To add other layouts, follow the same structure
const layouts = {
    qwerty: [ "QWERTY",
        ['q','w','e','r','t','y','u','i','o','p'],
        ['a','s','d','f','g','h','j','k','l',';'],
        ['z','x','c','v','b','n','m',',','.','/']
    ],
    azerty: [ "AZERTY",
        ['a','z','e','r','t','y','u','i','o','p'],
        ['q','s','d','f','g','h','j','k','l','m'],
        ['w','x','c','v','b','n',',',';',':','!']
    ],
    qwertz: [ "QWERTZ",
        ['q','w','e','r','t','z','u','i','o','p'],
        ['a','s','d','f','g','h','j','k','l','ö'],
        ['y','x','c','v','b','n','m',',','.','-']
    ],
    dvorak: [ "Dvorak",
        ['\'',',','.','p','y','f','g','c','r','l'],
        ['a','o','e','u','i','d','h','t','n','s'],
        [';','q','j','k','x','b','m','w','v','z']
    ],
    colemak: [ "Colemak",
        ['q','w','f','p','g','j','l','u','y',';'],
        ['a','r','s','t','d','h','n','e','i','o'],
        ['z','x','c','v','b','k','m',',','.','/']
    ]
};

let keyColors = {}; // Store colors for each key by "row-col" key on the customised keyboard
let draggedColorHex = null; // Used for drag-and-drop in case dataTransfer doesn't work


// Color Conversion Utilities
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
    const toHex = val => {
        const hex = Math.round((val + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function styleToHex(rgbString) {
    if (!rgbString || rgbString === '') return '#FFFFFF';
    if (rgbString.startsWith('#')) return rgbString;

    const matches = rgbString.match(/\d+/g);
    if (!matches) return '#FFFFFF';

    return "#" + matches.map(x => {
        const hex = Math.round(Math.max(0, Math.min(255, Number(x)))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join('');
}


// Better Drag and Drop support
function enableColorDragDrop(div, doHandleDrop, onDrop) {
    div.draggable = true;
    div.addEventListener('dragstart', e => {
        if (e.target.style.backgroundColor) {
            dragstartHandler(e)
        }});  
    div.addEventListener('dragover', e => e.preventDefault());
    if (doHandleDrop) div.addEventListener('drop', e => dropHandler(e, onDrop));
}

function dragstartHandler(dragEvent) {
    draggedColorHex = styleToHex(dragEvent.target.style.backgroundColor)
    dragEvent.dataTransfer.clearData()
    dragEvent.dataTransfer.setData("text", draggedColorHex)
}

function dropHandler(dragEvent, onColorChange) {
    dragEvent.preventDefault()
    const dtColorHex = dragEvent.dataTransfer.getData("text")
    const hex = dtColorHex || draggedColorHex;
    dragEvent.target.style.backgroundColor = hex;
    if (onColorChange) onColorChange(hex);
    draggedColorHex = null;
}

// Color Picker Setup
let currentColorBoxPicking = null;
let currentColorBoxPickingOnChange = null;
const colorPicker = new iro.ColorPicker("#color-picker", {
    width: 200,
    color: "#7b299bff"
})

colorPicker.on('color:change', (color) => {
    if (currentColorBoxPicking) {
        const boxId = currentColorBoxPicking.id;
        if (boxId.includes('base-box')) {
                updateBaseColor(boxId, color.hexString);
            } else {
                currentColorBoxPicking.style.backgroundColor = color.hexString;
                if (currentColorBoxPickingOnChange) {
                    currentColorBoxPickingOnChange(color.hexString);
                }
            }
    }
})

pickerContainer = document.getElementById('picker');
document.addEventListener('click', (e) => {
        if (!pickerContainer.contains(e.target) && e.target !== currentColorBoxPicking) {
            pickerContainer.style.display = 'none';
            currentColorBoxPicking = null;
        }
    });


// Only used for palettes, called when adjusting sliders, dropping or color picker
function updateBaseColor(boxId, hex) {
    if (hex) {
        const box = document.getElementById(boxId);
        const hsl = hexToHsl(hex);
        document.getElementById(`${boxId.slice(0,2)}-hue`).value = Math.round(hsl.h);
        document.getElementById(`${boxId.slice(0,2)}-hue-val`).textContent = Math.round(hsl.h) + '°';
        document.getElementById(`${boxId.slice(0,2)}-sat`).value = Math.round(hsl.s);
        document.getElementById(`${boxId.slice(0,2)}-sat-val`).textContent = Math.round(hsl.s) + '%';
        document.getElementById(`${boxId.slice(0,2)}-lig`).value = Math.round(hsl.l);
        document.getElementById(`${boxId.slice(0,2)}-lig-val`).textContent = Math.round(hsl.l) + '%';
        
        box.style.backgroundColor = hex;
    } else {
        const box = document.getElementById(boxId);
        const h = document.getElementById(`${boxId.slice(0,2)}-hue`).value;
        const s = document.getElementById(`${boxId.slice(0,2)}-sat`).value;
        const l = document.getElementById(`${boxId.slice(0,2)}-lig`).value;
        const hex = hslToHex(h, s, l);
        box.style.backgroundColor = hex;
    }
    generatePalette(boxId.startsWith('p1') ? 1 : 2);
}

// Palette Generation called when sliders change or color is dropped/picked
function generatePalette(num) {
    const h = document.getElementById(`p${num}-hue`).value;
    const s = document.getElementById(`p${num}-sat`).value;
    const l = document.getElementById(`p${num}-lig`).value;
    const mode = document.getElementById(`p${num}-mode`).value;
    const hsl = { h: parseInt(h), s: parseInt(s), l: parseInt(l) };
    const colors = [];

    if (mode === 'monochrome') {
        for (let i = 0; i < 24; i++) {
            const l = (299 * i / 23) % 100;
            colors.push(hslToHex(hsl.h, hsl.s, l));
        }
    } else if (mode === 'analogous') {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                const h = (hsl.h + (col * 15) + (row * 20)) % 360;
                colors.push(hslToHex(h, hsl.s, hsl.l));
        }}
    } else if (mode === 'complementary') {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                const h = col < 4 ? hsl.h : (hsl.h + 180) % 360;

                const t = (row * 4 + (col % 4)) / (3 * 4 - 1);
                const l = 0.5 * hsl.l + t * 50;

                colors.push(hslToHex(h, hsl.s, l));
        }}
    } else if (mode === 'triadic') {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                const h = (hsl.h + Math.floor(col / 3) * 120) % 360;

                const t = (row * 8 + col) / (3 * 8 - 1);
                const l = 0.5 * hsl.l + t * 50;

                colors.push(hslToHex(h, hsl.s, l));
        }}
    }

    // Populate the palette grid
    const grid = document.getElementById(`palette${num}`);
    const borderColor = document.getElementById('border-color-box').style.backgroundColor;
    grid.innerHTML = '';
    colors.forEach(color => {
        const div = document.createElement('div');
        div.className = 'palette-color';
        div.style.backgroundColor = color;
        div.style.borderColor = borderColor;
        enableColorDragDrop(div, false)
        grid.appendChild(div);
    });
}

// HSL Slider Event Listeners
['p1-hue', 'p2-hue'].forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
        document.getElementById(`${id}-val`).textContent = e.target.value + '°';
        updateBaseColor(`${id.slice(0,2)}-base-box`);
    });
});
['p1-sat', 'p2-sat'].forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
        document.getElementById(`${id}-val`).textContent = e.target.value + '%';
        updateBaseColor(`${id.slice(0,2)}-base-box`);
    });
});
['p1-lig', 'p2-lig'].forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
        document.getElementById(`${id}-val`).textContent = e.target.value + '%';
        updateBaseColor(`${id.slice(0,2)}-base-box`);
    });
});


// Setup for color picker boxes
function setupBoxWithColorPicker(boxId, onColorChange) {
    const picker = document.getElementById("picker");
    const box = document.getElementById(boxId);

    box.addEventListener('click', (e) => {
        currentColorBoxPicking = box;
        if (boxId.includes('base-box')) {
            const currentH = document.getElementById(`${boxId.slice(0,2)}-hue`).value;
            const currentS = document.getElementById(`${boxId.slice(0,2)}-sat`).value;
            const currentL = document.getElementById(`${boxId.slice(0,2)}-lig`).value;
            colorPicker.color.hsl = { h: currentH, s: currentS, l: currentL };
        } else {
            currentColorBoxPickingOnChange = onColorChange;
            colorPicker.color.hexString = styleToHex(box.style.backgroundColor);
        }
        picker.style.display = 'flex';
        picker.style.position = 'absolute';
        picker.style.top = `${e.pageY + 16}px`;
        if (e.pageX + 10 + picker.offsetWidth > window.innerWidth) {
            picker.style.left = `auto`;
            picker.style.right = `0px`;
        } else {
            picker.style.left = `${e.pageX + 10}px`;
        }
    });
    enableColorDragDrop(box, true, (hex) => onColorChange(hex));
}

// Calling setup for each color box with color picker on click
setupBoxWithColorPicker('p1-base-box', (hex) => updateBaseColor('p1-base-box', hex));
setupBoxWithColorPicker('p2-base-box', (hex) => updateBaseColor('p2-base-box', hex));
setupBoxWithColorPicker('letter-color-box',
    (hex) => document.querySelectorAll('.key').forEach(key => key.style.color = hex)
);
setupBoxWithColorPicker('border-color-box',
    (hex) => document.querySelectorAll('.key, .palette-color, .color-box').forEach(div => div.style.borderColor = hex)
);
setupBoxWithColorPicker('pressed-key-box');
setupBoxWithColorPicker('approach-circle-box');
setupBoxWithColorPicker('hold-note-box');

// Initialize second section palettes
function initRainbowPalette() {
    const palette = document.getElementById('rainbow-palette');
    for (let i = 0; i < 10; i++) {
        const h = (i * 36) % 360;
        const color = hslToHex(h, 80, 50);
        const div = document.createElement('div');
        div.className = 'palette-color';
        div.style.backgroundColor = color;
        enableColorDragDrop(div, false)
        palette.appendChild(div);
    }
}

function initSavedColors() {
    const saver = document.getElementById('saved-colors');
    for (let i = 0; i < 10; i++) {
        const div = document.createElement('div');
        div.className = 'palette-color';
        enableColorDragDrop(div, true)
        saver.appendChild(div);
    }
}

// Third section keyboard setup

document.getElementById('show-letters').addEventListener('change', e => {
    const show = e.target.checked;
    document.querySelectorAll('.key').forEach(key => {
        key.textContent = show ? key.dataset.letter : '';
    });
});

// Keyboard Setup
function initKeyboard() {
    const grid = document.getElementById('keyboard-grid');
    grid.innerHTML = '';

    const corner = document.createElement('div');
    grid.appendChild(corner);

    for (let col = 0; col < 10; col++) {
        const circle = document.createElement('div');
        circle.className = 'control-circle';
        circle.dataset.col = col;
        circle.style.gridColumn = col + 2;
        circle.style.gridRow = 1;
        enableColorDragDrop(circle, true, () => applyToColumn(col));
        grid.appendChild(circle);
    }

    for (let row = 0; row < 3; row++) {
        const circle = document.createElement('div');
        circle.className = 'control-circle';
        circle.dataset.row = row;
        circle.style.gridColumn = 1;
        circle.style.gridRow = row + 2;
        enableColorDragDrop(circle, true, () => applyToRow(row));
        grid.appendChild(circle);

        for (let col = 0; col < 10; col++) {
            const key = document.createElement('div');
            key.className = 'key';
            key.dataset.row = row;
            key.dataset.col = col;
            key.dataset.letter = qwertyLayout[row][col];
            key.textContent = key.dataset.letter;
            key.style.gridColumn = col + 2;
            key.style.gridRow = row + 2;

            if (row === 1) key.style.transform = 'translateX(11.25px)';
            if (row === 2) key.style.transform = 'translateX(18.75px)';

            enableColorDragDrop(key, true, () => applyToKey(key))
            grid.appendChild(key);
        }
    }
}

// Functions for keyboard
function applyToKey(key) {
    const row = key.dataset.row;
    const col = key.dataset.col;
    keyColors[`${row}-${col}`] = styleToHex(key.style.backgroundColor);
    updateControlCircles();
}

function applyToColumn(col) {
    const color = document.querySelector(`[data-col="${col}"]`).style.backgroundColor;
    for (let row = 0; row < 3; row++) {
        const key = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        key.style.backgroundColor = color;
        keyColors[`${row}-${col}`] = color;
    }
    updateControlCircles();
}

function applyToRow(row) {
    const color = document.querySelector(`[data-row="${row}"]`).style.backgroundColor;
    for (let col = 0; col < 10; col++) {
        const key = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        key.style.backgroundColor = color;
        keyColors[`${row}-${col}`] = color;
    }
    updateControlCircles();
}

function updateControlCircles() {
    for (let col = 0; col < 10; col++) {
        const colors = [];
        for (let row = 0; row < 3; row++) {
            const color = keyColors[`${row}-${col}`];
            if (color) colors.push(color);
        }
        const circle = document.querySelector(`[data-col="${col}"]`);
        if (colors.length === 3 && colors.every(c => c === colors[0])) {
            circle.style.backgroundColor = colors[0];
        } else {
            circle.style.backgroundColor = 'white';
        }
    }

    for (let row = 0; row < 3; row++) {
        const colors = [];
        for (let col = 0; col < 10; col++) {
            const color = keyColors[`${row}-${col}`];
            if (color) colors.push(color);
        }
        const circle = document.querySelector(`[data-row="${row}"]`);
        if (colors.length === 10 && colors.every(c => c === colors[0])) {
            circle.style.backgroundColor = colors[0];
        } else {
            circle.style.backgroundColor = 'white';
        }
    }
}

// Third section controls

// Add slider event listeners to update values
document.getElementById('label-size').addEventListener('input', e => {
    document.getElementById('label-size-val').textContent = e.target.value;
});

document.getElementById('border-thickness').addEventListener('input', e => {
    document.getElementById('border-thickness-val').textContent = e.target.value + 'px';
});

document.getElementById('hold-opacity').addEventListener('input', e => {
    document.getElementById('hold-opacity-val').textContent = e.target.value + '%';
});


function copyToClipboard() {
    const text = document.getElementById('json-output').textContent;
    navigator.clipboard.writeText(text);
}

function updateExport() {
    const layout = document.getElementById('layout-select').value;
    const keys = layouts[layout];
    const keyColorsExport = {};

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 10; col++) {
            const color = keyColors[`${row}-${col}`];
            if (color) {
                keyColorsExport[keys[row+1][col]] = styleToHex(color);
            }
        }
    }

    const showLetters = document.getElementById('show-letters').checked;
    const labelColor = styleToHex(document.getElementById('letter-color-box').style.backgroundColor);
    const borderColor = styleToHex(document.getElementById('border-color-box').style.backgroundColor);
    const labelSize = parseInt(document.getElementById('label-size').value);
    const borderThickness = parseInt(document.getElementById('border-thickness').value);
    const pressedKeyColor = styleToHex(document.getElementById('pressed-key-box').style.backgroundColor);
    const approachCircle = styleToHex(document.getElementById('approach-circle-box').style.backgroundColor);
    const holdNote = styleToHex(document.getElementById('hold-note-box').style.backgroundColor);
    const holdOpacity = parseInt(document.getElementById('hold-opacity').value) / 100;

    const output = {
        name: "Custom Skin",
        author: "You",
        version: "1.0",
        description: "Made with Komiru's Colorful Skin Maker",
        colors: {
            labelSize: labelSize,
            label: labelColor,
            border: borderColor,
            keyBorderThickness: borderThickness,
            keyPressedColor: pressedKeyColor,
            keyPressedLightColor: pressedKeyColor,
            approachCircle: approachCircle,
            holdNote: holdNote,
            holdNoteActive: approachCircle,
            holdNoteOpacity: holdOpacity,
            keyColors: keyColorsExport
        }
    };

    const json = JSON.stringify(output, null, 2);
    document.getElementById('json-output').value = json;
}


// Download Zip simply put the current textarea content into a zip file
function downloadZip() {
    const jsonString = document.getElementById('json-output').value;
    
    if (!jsonString || jsonString.trim() === '' || jsonString.includes('Select a layout')) {
        alert('Please generate the JSON before downloading.');
        return;
    }

    try {
        JSON.parse(jsonString);
    } catch (e) {
        alert('Invalid JSON! Please fix the format before downloading.');
        return;
    }

    const zip = new JSZip();
    zip.file("skin.json", jsonString);

    zip.generateAsync({type: "blob"}).then(function(content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'ColorfulSkin.zip';
        link.click();
        URL.revokeObjectURL(link.href);
    });
}


// Initial Setup Calls
updateBaseColor('p1-base-box');
updateBaseColor('p2-base-box');
initRainbowPalette();
initSavedColors();
initKeyboard();

const initialBorderColor = '#303030ff'
document.getElementById('border-color-box').style.backgroundColor = initialBorderColor;
document.querySelectorAll('.key, .palette-color, .color-box').forEach(div => div.style.borderColor = initialBorderColor);
const initialLetterColor = '#646464ff'
document.getElementById('letter-color-box').style.backgroundColor = initialLetterColor;
document.querySelectorAll('.key').forEach(key => key.style.color = initialLetterColor);

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
}