const fileIn = document.getElementById('fileIn'), ySlider = document.getElementById('ySlider'), sSlider = document.getElementById('sSlider'), wSlider = document.getElementById('wSlider'), guideCb = document.getElementById('guideCb'), sfxCb = document.getElementById('sfxCb'), dlBtn = document.getElementById('dlBtn'), rstBtn = document.getElementById('rstBtn'), tBtn = document.getElementById('tBtn'), cvs = document.getElementById('cvs'), wrap = document.getElementById('wrap'), ctx = cvs.getContext('2d');

let pikachu = null, sW = 0, sH = 0, isCoolingDown = false;
let stickers = [];
let draggingSticker = null;
let audioCtx = null;

// Theme Toggle
tBtn.addEventListener('click', () => {
    const mode = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', mode);
    tBtn.innerText = mode === 'dark' ? '☀️' : '🌙';
});

fileIn.addEventListener('click', function() { this.value = null; });

// Image Upload
fileIn.addEventListener('change', e => {
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 10 * 1024 * 1024) return alert("File too big! (10MB max)");

    const reader = new FileReader();
    reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
            pikachu = img;
            const maxW = 800;
            let ratio = img.width > maxW ? maxW / img.width : 1;
            sW = img.width * ratio;
            sH = img.height * ratio;
            dlBtn.removeAttribute('disabled');
            rstBtn.removeAttribute('disabled');
            wrap.classList.add('active');
            resetParams();
        }
        img.src = ev.target.result;
    }
    reader.readAsDataURL(file);
});

// Sound Effect Synthesizer
function playSlideWhistle(value) {
    if(!sfxCb.checked) return;
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.frequency.value = 200 + (value * 150); 
    osc.type = 'sine';
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
    osc.stop(audioCtx.currentTime + 0.1);
}

// Redraw events
ySlider.addEventListener('input', () => drawStretchedImage());
sSlider.addEventListener('input', (e) => { drawStretchedImage(); playSlideWhistle(e.target.value); });
wSlider.addEventListener('input', () => drawStretchedImage());
guideCb.addEventListener('change', () => drawStretchedImage());

rstBtn.addEventListener('click', resetParams);

function resetParams() {
    sSlider.value = 1; wSlider.value = 1; ySlider.value = 25;
    stickers = []; guideCb.checked = true;
    drawStretchedImage();
}

// Sticker Logic
document.querySelectorAll('.sticker-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if(e.target.id === 'clearStickers') { stickers = []; } 
        else {
            stickers.push({ text: e.target.innerText, x: sW / 2, y: sH * 0.2, size: 60 });
        }
        drawStretchedImage();
    });
});

// Dragging Stickers
cvs.addEventListener('mousedown', e => {
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    const scaleY = cvs.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for(let i = stickers.length - 1; i >= 0; i--) {
        const s = stickers[i];
        ctx.font = `${s.size}px Arial`;
        const metrics = ctx.measureText(s.text);
        if(mx > s.x - metrics.width/2 && mx < s.x + metrics.width/2 && my > s.y - s.size && my < s.y) {
            draggingSticker = s;
            break;
        }
    }
});

cvs.addEventListener('mousemove', e => {
    if(!draggingSticker) return;
    const rect = cvs.getBoundingClientRect();
    draggingSticker.x = (e.clientX - rect.left) * (cvs.width / rect.width);
    draggingSticker.y = (e.clientY - rect.top) * (cvs.height / rect.height);
    drawStretchedImage();
});

cvs.addEventListener('mouseup', () => { draggingSticker = null; });
cvs.addEventListener('mouseleave', () => { draggingSticker = null; });

// Rendering Engine
function drawStretchedImage(isExporting = false, targetCtx = ctx, targetWidth = cvs.width, targetHeight = cvs.height) {
    if (!pikachu) return;

    const sm = parseFloat(sSlider.value);
    const wm = parseFloat(wSlider.value);
    const cutY = sH * (parseFloat(ySlider.value) / 100);

    const newTopH = cutY * sm;
    const botH = sH - cutY;
    
    if(!isExporting) {
        cvs.width = sW;
        cvs.height = newTopH + botH;
        targetWidth = cvs.width;
        targetHeight = cvs.height;
    }

    targetCtx.clearRect(0, 0, targetWidth, targetHeight);

    const tw = targetWidth * wm;
    const tx = (targetWidth - tw) / 2;
    const origCut = pikachu.height * (parseFloat(ySlider.value) / 100);
    const origBot = pikachu.height - origCut;

    targetCtx.drawImage(pikachu, 0, 0, pikachu.width, origCut, tx, 0, tw, newTopH);
    targetCtx.drawImage(pikachu, 0, origCut, pikachu.width, origBot, 0, newTopH, targetWidth, botH);

    targetCtx.textAlign = "center";
    stickers.forEach(s => {
        targetCtx.font = `${s.size}px Arial`;
        targetCtx.fillText(s.text, s.x, s.y);
    });

    if (guideCb.checked && !isExporting && targetCtx === ctx) {
        targetCtx.beginPath();
        targetCtx.moveTo(0, newTopH);
        targetCtx.lineTo(targetWidth, newTopH);
        targetCtx.strokeStyle = '#ff4747'; 
        targetCtx.lineWidth = 3;
        targetCtx.setLineDash([10, 8]); 
        targetCtx.stroke();
        targetCtx.setLineDash([]); 
    }
}

// Side-by-Side Polaroid Export
dlBtn.addEventListener('click', () => {
    if (!pikachu || isCoolingDown) return;
    isCoolingDown = true;
    dlBtn.innerText = 'WAIT...';
    
    const sm = parseFloat(sSlider.value);
    const cutY = sH * (parseFloat(ySlider.value) / 100);
    const stretchedH = (cutY * sm) + (sH - cutY);
    
    const exportCvs = document.createElement('canvas');
    const exportCtx = exportCvs.getContext('2d');
    
    const padding = 40;
    const finalImageH = Math.max(sH, stretchedH);
    exportCvs.width = (sW * 2) + (padding * 3);
    exportCvs.height = finalImageH + (padding * 3) + 60;

    // Background
    exportCtx.fillStyle = '#f4f4f0';
    exportCtx.fillRect(0, 0, exportCvs.width, exportCvs.height);
    
    // Left (Original)
    exportCtx.fillStyle = '#111';
    exportCtx.fillRect(padding - 5, padding - 5, sW + 10, sH + 10);
    exportCtx.drawImage(pikachu, padding, padding, sW, sH);
    
    // Right (Stretched)
    const rightStartX = sW + (padding * 2);
    exportCtx.fillRect(rightStartX - 5, padding - 5, sW + 10, stretchedH + 10);
    
    exportCtx.save();
    exportCtx.translate(rightStartX, padding);
    drawStretchedImage(true, exportCtx, sW, stretchedH);
    exportCtx.restore();

    // Text & Watermark
    exportCtx.fillStyle = '#111';
    exportCtx.font = 'bold 30px Arial';
    exportCtx.textAlign = "center";
    exportCtx.fillText("BEFORE", padding + (sW/2), sH + padding + 40);
    exportCtx.fillText("AFTER", rightStartX + (sW/2), stretchedH + padding + 40);
    exportCtx.font = 'bold 20px Arial';
    exportCtx.fillText("🧠 Created with Forehead Stretcher Pro", exportCvs.width / 2, exportCvs.height - 20);

    const a = document.createElement('a');
    a.download = 'forehead-polaroid.png';
    a.href = exportCvs.toDataURL('image/png');
    a.click();
    
    setTimeout(() => {
        isCoolingDown = false;
        dlBtn.innerText = '💾 Export Polaroid';
    }, 2000);
});
