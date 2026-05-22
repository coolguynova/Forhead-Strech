// Grab all the UI elements
const fileIn = document.getElementById('fileIn');
const ySlider = document.getElementById('ySlider');
const sSlider = document.getElementById('sSlider');
const wSlider = document.getElementById('wSlider');
const guideCb = document.getElementById('guideCb');
const dlBtn = document.getElementById('dlBtn');
const rstBtn = document.getElementById('rstBtn');
const tBtn = document.getElementById('tBtn');
const cvs = document.getElementById('cvs');
const wrap = document.getElementById('wrap');
const ctx = cvs.getContext('2d');

// State variables
let pikachu = null; // Holds the image object
let sW = 0; // Scaled Width
let sH = 0; // Scaled Height
let isCoolingDown = false;

// Theme Toggle
tBtn.addEventListener('click', () => {
    const currentMode = document.body.getAttribute('data-theme');
    const newMode = currentMode === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newMode);
    tBtn.innerText = newMode === 'dark' ? '☀️' : '🌙';
});

// Clear file input on click so you can re-upload the same file
fileIn.addEventListener('click', function() {
    this.value = null; 
});

// Handle File Upload
fileIn.addEventListener('change', e => {
    const file = e.target.files[0];
    if(!file) return;
    
    // File size limiter (10MB)
    const maxMb = 10 * 1024 * 1024;
    if(file.size > maxMb) {
        alert("Whoa there! That file is huge (over 10MB). Upload something smaller so your browser doesn't explode.");
        e.target.value = null;
        return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
            pikachu = img;
            
            // Downscale huge images to a max width of 800px to prevent UI lag
            const maxW = 800;
            let ratio = 1;
            if (img.width > maxW) {
                ratio = maxW / img.width;
            }
            
            sW = img.width * ratio;
            sH = img.height * ratio;

            // Enable buttons and show canvas
            dlBtn.removeAttribute('disabled');
            rstBtn.removeAttribute('disabled');
            wrap.classList.add('active');
            
            resetParams();
        }
        img.src = ev.target.result;
    }
    reader.readAsDataURL(file);
});

// Redraw when sliders change
ySlider.addEventListener('input', () => drawStretchedImage(false));
sSlider.addEventListener('input', () => drawStretchedImage(false));
wSlider.addEventListener('input', () => drawStretchedImage(false));
guideCb.addEventListener('change', () => drawStretchedImage(false));

// Reset Button Logic
rstBtn.addEventListener('click', resetParams);

function resetParams() {
    sSlider.value = 1;
    wSlider.value = 1;
    ySlider.value = 25;
    guideCb.checked = true;
    drawStretchedImage(false);
}

// Main Drawing Function
function drawStretchedImage(isExporting) {
    if (!pikachu) return;

    const sm = parseFloat(sSlider.value); // Stretch Multiplier
    const wm = parseFloat(wSlider.value); // Width Multiplier
    
    // Where is the cut happening based on the slider?
    const cutY = sH * (parseFloat(ySlider.value) / 100);

    const newTopH = cutY * sm;
    const botH = sH - cutY;
    
    // Set canvas dimensions
    cvs.width = sW;
    cvs.height = newTopH + botH;

    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // Alien Mode calculations
    const tw = cvs.width * wm;
    const tx = (cvs.width - tw) / 2;
    const origCut = pikachu.height * (parseFloat(ySlider.value) / 100);
    const origBot = pikachu.height - origCut;

    // Draw the Stretched Forehead (Top Half)
    ctx.drawImage(pikachu, 0, 0, pikachu.width, origCut, tx, 0, tw, newTopH);
    
    // Draw the Normal Face (Bottom Half)
    ctx.drawImage(pikachu, 0, origCut, pikachu.width, origBot, 0, newTopH, cvs.width, botH);

    // Draw the Red Guide Line
    if (guideCb.checked && !isExporting) {
        ctx.beginPath();
        ctx.moveTo(0, newTopH);
        ctx.lineTo(cvs.width, newTopH);
        ctx.strokeStyle = '#ff4747'; 
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]); 
        ctx.stroke();
        ctx.setLineDash([]); 
    }
}

// Download Button Logic
dlBtn.addEventListener('click', () => {
    if (!pikachu || isCoolingDown) return;
    
    isCoolingDown = true;
    const ogText = dlBtn.innerText;
    dlBtn.innerText = 'WAIT...';
    dlBtn.style.opacity = '0.7';

    // Draw without red line
    drawStretchedImage(true);
    
    // Trigger download
    const a = document.createElement('a');
    a.download = 'mega-forehead.png';
    a.href = cvs.toDataURL('image/png');
    a.click();
    
    // Redraw with red line
    drawStretchedImage(false);

    // 3 Second Cooldown to prevent spam
    setTimeout(() => {
        isCoolingDown = false;
        dlBtn.innerText = ogText;
        dlBtn.style.opacity = '1';
    }, 3000);
});
