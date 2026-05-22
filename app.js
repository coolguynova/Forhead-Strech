const fileIn = document.getElementById('fileIn'), ySlider = document.getElementById('ySlider'), sSlider = document.getElementById('sSlider'), wSlider = document.getElementById('wSlider'), guideCb = document.getElementById('guideCb'), dlBtn = document.getElementById('dlBtn'), rstBtn = document.getElementById('rstBtn'), tBtn = document.getElementById('tBtn'), cvs = document.getElementById('cvs'), wrap = document.getElementById('wrap'), ctx = cvs.getContext('2d');

let img = null;
tBtn.onclick = () => document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';

fileIn.onchange = e => {
    const reader = new FileReader();
    reader.onload = ev => {
        img = new Image();
        img.onload = () => { wrap.classList.add('active'); dlBtn.disabled = rstBtn.disabled = false; draw(); };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
};

function draw(isExp = false) {
    if (!img) return;
    const sH = img.height, sW = img.width, cut = sH * (ySlider.value/100);
    cvs.width = sW; cvs.height = (cut * sSlider.value) + (sH - cut);
    ctx.clearRect(0,0,cvs.width,cvs.height);
    ctx.drawImage(img, 0,0, sW, cut, (sW - sW*wSlider.value)/2, 0, sW*wSlider.value, cut*sSlider.value);
    ctx.drawImage(img, 0, cut, sW, sH-cut, 0, cut*sSlider.value, sW, sH-cut);
    if(guideCb.checked && !isExp) { ctx.strokeStyle='red'; ctx.lineWidth=5; ctx.strokeRect(0,0,cvs.width, cut*sSlider.value); }
}

[ySlider, sSlider, wSlider, guideCb].forEach(el => el.oninput = () => draw());
rstBtn.onclick = () => { sSlider.value = 1; wSlider.value = 1; ySlider.value = 25; draw(); };
dlBtn.onclick = () => { draw(true); const a = document.createElement('a'); a.href = cvs.toDataURL(); a.download='forehead.png'; a.click(); draw(); };
