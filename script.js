let gameActive = false, sunMoney = 100, totalKills = 0, currentChoice = 'sunflower';
let defenders = [], attackers = [], projectiles = [], frame = 0;
let notificationText = "", notificationTimer = 0;

window.startGame = () => { document.getElementById('menu-overlay').style.display = 'none'; gameActive = true; };
window.selectPlant = (type) => {
    currentChoice = type;
    document.querySelectorAll('.plant-choice').forEach(el => el.classList.remove('selected'));
    document.getElementById('btn-' + type).classList.add('selected');
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 400;

const CONFIG = {
    sunflower: 'imahe/sunflower.jpg', shooter: 'imahe/Shooter1.png',
    shooter2: 'imahe/Shooter 2.jpg', shooter3: 'imahe/Shooooter.jpg',
    zombie: 'imahe/Zombe1.png', zombie2: 'imahe/Zombe 2.jpg',
    bullet1: 'imahe/Bullet 1.jpg', bullet2: 'imahe/bullet 2.jpeg', bullet3: 'imahe/Bullet 3..png' 
};

const images = {};
let loaded = 0;
Object.keys(CONFIG).forEach(k => {
    images[k] = new Image(); images[k].src = CONFIG[k];
    images[k].onload = () => { if(++loaded === Object.keys(CONFIG).length) animate(); };
});

class Defender {
    constructor(x, y, type) { this.x = x; this.y = y; this.type = type; this.health = 200; this.timer = 0; }
    draw() {
        if (images[this.type]?.complete) ctx.drawImage(images[this.type], this.x+5, this.y+5, 70, 70);
        ctx.fillStyle = 'red'; ctx.fillRect(this.x+10, this.y+75, 60, 5);
        ctx.fillStyle = 'lime'; ctx.fillRect(this.x+10, this.y+75, (this.health/200)*60, 5);
    }
    update() {
        if (attackers.some(a => a.y === this.y && a.x > this.x)) {
            if (this.type === 'shooter' && frame % 100 === 0) projectiles.push(new Bullet(this.x+60, this.y+30, 4, images.bullet1, 25, 'none'));
            if (this.type === 'shooter2' && frame % 60 === 0) projectiles.push(new Bullet(this.x+60, this.y+30, 6, images.bullet2, 45, 'freeze'));
            if (this.type === 'shooter3' && frame % 40 === 0) projectiles.push(new Bullet(this.x+60, this.y+30, 8, images.bullet3, 50, 'fire'));
        }
        if (this.type === 'sunflower' && ++this.timer % 300 === 0) {
            sunMoney += 24; document.getElementById('sun-count').innerText = sunMoney;
        }
    }
}

class Attacker {
    constructor(y, type) {
        this.x = canvas.width; this.y = y; this.type = type;
        let lvl2 = totalKills >= 25, rage = totalKills >= 30, boss = totalKills >= 31;
        this.dmg = boss ? 100 : (rage ? 40 : 20);
        let hpAdd = boss ? 150 : 0;
        if (this.type === 'zombie2') {
            this.maxHealth = (boss ? 700 : 750 ) + hpAdd;
            this.speed = boss ? 1.0 : (rage ? 0.9 : 0.4);
        } else {
            this.maxHealth = (boss ? 650 : 650) + hpAdd;
            this.speed = boss ? 1.2 : (rage ? 1.1 : 0.5);
        }
        this.health = this.maxHealth; this.freezeTimer = 0;
    }
    draw() {
        ctx.save();
        if (totalKills >= 100) { ctx.shadowBlur = 15; ctx.shadowColor = "gold"; }
        if (this.freezeTimer > 0) ctx.filter = 'hue-rotate(180deg) brightness(1.2)';
        if (images[this.type]?.complete) ctx.drawImage(images[this.type], this.x, this.y+5, 70, 70);
        ctx.fillStyle = 'red'; ctx.fillRect(this.x+10, this.y, 60, 5);
        ctx.fillStyle = totalKills >= 100 ? 'gold' : 'lime';
        ctx.fillRect(this.x+10, this.y, (this.health/this.maxHealth)*60, 5);
        ctx.restore();
    }
    update() {
        let s = this.freezeTimer > 0 ? 0 : this.speed;
        if (this.freezeTimer > 0) this.freezeTimer--;
        let eating = false;
        defenders.forEach(d => {
            if (this.x < d.x+60 && this.x+20 > d.x && this.y === d.y) {
                eating = true; if (frame % 60 === 0) d.health -= this.dmg;
            }
        });
        if (!eating) this.x -= s;
    }
}

class Bullet {
    constructor(x, y, speed, img, dmg, effect) { this.x = x; this.y = y; this.speed = speed; this.img = img; this.dmg = dmg; this.effect = effect; }
    draw() { if (this.img?.complete) ctx.drawImage(this.img, this.x, this.y, 25, 25); }
    update() { this.x += this.speed; }
}

function handleInput(e) {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const x = Math.floor(((clientX - rect.left) * scaleX) / 80) * 80;
    const y = Math.floor(((clientY - rect.top) * scaleY) / 80) * 80;
    if (currentChoice === 'remove') defenders = defenders.filter(d => !(d.x === x && d.y === y));
    else {
        const costs = { sunflower: 20, shooter: 100, shooter2: 250, shooter3: 500 };
        if (sunMoney >= costs[currentChoice] && !defenders.find(d => d.x === x && d.y === y)) {
            defenders.push(new Defender(x, y, currentChoice));
            sunMoney -= costs[currentChoice]; document.getElementById('sun-count').innerText = sunMoney;
        }
    }
}

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(e); }, {passive: false});
canvas.addEventListener('mousedown', handleInput);

function animate() {
    if (gameActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        for(let i=0; i<=canvas.width; i+=80) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }
        for(let j=0; j<=canvas.height; j+=80) { ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(canvas.width,j); ctx.stroke(); }

        projectiles.forEach((p, i) => {
            p.update(); p.draw();
            attackers.forEach(a => {
                if (p.x < a.x+70 && p.x > a.x && p.y > a.y && p.y < a.y+70) {
                    a.health -= p.dmg;
                    if (p.effect === 'freeze') a.freezeTimer = (totalKills >= 30) ? 20 : 60;
                    projectiles.splice(i, 1);
                }
            });
        });

        defenders.forEach((d, i) => { d.update(); d.draw(); if (d.health <= 0) defenders.splice(i, 1); });
        
        attackers.forEach((a, i) => { 
            a.update(); a.draw(); 
            if (a.health <= 0) {
                attackers.splice(i, 1); totalKills++; 
                document.getElementById('kill-count').innerText = totalKills;
                if (totalKills === 25) { notificationText = "EVOLVED"; notificationTimer = 120; }
                if (totalKills === 30) { notificationText = "RAGE MODE!"; notificationTimer = 120; }
                if (totalKills === 35) { notificationText = "FINAL PHASE"; notificationTimer = 120; }
                if (totalKills >= 400) { gameActive = false; document.getElementById('victory-overlay').style.display = 'flex'; }
            }
            if (a.x < 0) { gameActive = false; document.getElementById('gameover-overlay').style.display = 'flex'; document.getElementById('final-stats').innerText = "Kills: " + totalKills; }
        });

        if (notificationTimer > 0) {
            ctx.fillStyle = "yellow"; ctx.font = "bold 40px Arial"; ctx.textAlign = "center";
            ctx.fillText(notificationText, canvas.width/2, canvas.height/2); notificationTimer--;
        }

        if (frame % (totalKills >= 50 ? 120 : 180) === 0 && totalKills < 62) {
            attackers.push(new Attacker(Math.floor(Math.random()*5)*80, Math.random()>0.8?'zombie2':'zombie'));
        }
        frame++;
    }
    requestAnimationFrame(animate);

}

