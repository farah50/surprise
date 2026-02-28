/* ══════════════ AUDIO ══════════════ */
const ACtx=window.AudioContext||window.webkitAudioContext; let actx;
function initAudio(){if(!actx){try{actx=new ACtx();}catch(e){}}}
function beep(f,d=.15,t='square',v=.1){
  if(!actx)return;
  try{const o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+d);o.start();o.stop(actx.currentTime+d+.01);}catch(e){}
}
function playCountBeep(n){initAudio();beep({3:220,2:330,1:440}[n]||330,.35,'square',.15);}
function playFanfare(){initAudio();[{f:523,t:0},{f:659,t:.12},{f:784,t:.24},{f:1047,t:.36},{f:880,t:.52},{f:988,t:.62},{f:1047,t:.72}].forEach(({f,t})=>setTimeout(()=>beep(f,.16,'square',.12),t*1000));}
function playWalkStep(){if(!actx)return;beep(55+Math.random()*20,.05,'square',.025);}
function playWalkBGM(){if(!actx)return;[392,0,440,0,392,0,330,0,294,0,330,0,392,0,392].forEach((f,i)=>{if(f)setTimeout(()=>beep(f,.1,'square',.04),i*180)});}
function playJumpSfx(){initAudio();[180,380,650].forEach((f,i)=>setTimeout(()=>beep(f,.09,'square',.08),i*40));}
function playFallSfx(){initAudio();[300,220,160,110,80].forEach((f,i)=>setTimeout(()=>beep(f,.1,'square',.09),i*60));}
function playCoinSfx(){initAudio();beep(880,.06,'triangle',.09);setTimeout(()=>beep(1100,.08,'triangle',.07),60);}
function playDialogueSfx(){initAudio();[880,1047,1175,1047,880].forEach((f,i)=>setTimeout(()=>beep(f,.12,'triangle',.08),i*100));}
function playCelebSfx(){initAudio();[523,659,784,1047,1047,988,1047,880,784,659,523].forEach((f,i)=>setTimeout(()=>beep(f,.16,'square',.12),i*120));}
function playBlowSfx(){initAudio();for(let i=0;i<6;i++)setTimeout(()=>beep(600-i*80,.06,'sine',.06),i*60);}

/* ══════════════ CONFETTI ══════════════ */
const COLORS=['#ff00aa','#ffee00','#00ffdd','#ff4444','#8844ff','#44ffaa','#ff88ff','#ff8800'];
const confLayer=document.getElementById('confetti-layer');
function spawnBits(n){for(let i=0;i<n;i++){const b=document.createElement('div');b.className='pixel-bit';b.style.cssText=`left:${Math.random()*100}vw;background:${COLORS[~~(Math.random()*COLORS.length)]};animation-duration:${2.5+Math.random()*4}s;animation-delay:${Math.random()*3}s;width:${[4,8,12,16][~~(Math.random()*4)]}px;height:${[4,8,12,16][~~(Math.random()*4)]}px;`;confLayer.appendChild(b);setTimeout(()=>b.remove(),7000);}}

/* ══════════════ BIRTHDAY INTRO ══════════════ */
const countEl=document.getElementById('count-display');
const flashEl=document.getElementById('flash');
let cc=3,introStarted=false;
function flashScreen(){flashEl.classList.remove('do-flash');void flashEl.offsetWidth;flashEl.classList.add('do-flash');}
function showCount(n){countEl.textContent=n;countEl.style.animation='none';void countEl.offsetWidth;countEl.style.animation='';playCountBeep(n);flashScreen();}
function startCountdown(){showCount(cc);const iv=setInterval(()=>{cc--;if(cc>0)showCount(cc);else{clearInterval(iv);setTimeout(showBirthday,900);}},1100);}

function showBirthday(){
  flashScreen();
  document.getElementById('countdown').style.display='none';
  document.getElementById('birthday-screen').style.display='flex';
  document.getElementById('wish-btn').style.display='inline-block';
  document.getElementById('ticker').style.display='block';
  
  const bgm = document.getElementById('birthday-song');
  if(bgm) { 
      bgm.volume = 0.5; 
      bgm.play().catch(e => console.log("Audio autoplay blocked requires interaction first")); 
  }

  playFanfare();
  spawnBits(80);
  setInterval(()=>spawnBits(6),700);
}
function startIntro(){if(introStarted)return;introStarted=true;document.removeEventListener('click',startIntro);document.removeEventListener('keydown',startIntro);initAudio();startCountdown();}
document.addEventListener('click',startIntro);document.addEventListener('keydown',startIntro);
countEl.textContent='▶';countEl.style.cssText+='animation:none;opacity:1;transform:scale(1);font-size:clamp(30px,30vw,50px);text-shadow:3px 3px 0 #ff00aa,0 0 30px #aa00ff;';
const hint=document.createElement('div');hint.style.cssText='position:absolute;bottom:40%;left:50%;transform:translateX(-50%);font-family:"Press Start 2P",monospace;font-size:clamp(8px,10vw,10px);color:#ff44ff;text-shadow:0 0 10px #ff00ff;animation:blink 1s steps(1) infinite;z-index:40;text-align:center;white-space:nowrap;';hint.textContent='CLICK OR PRESS ANY KEY';document.getElementById('stage').appendChild(hint);
document.addEventListener('click',()=>hint.remove(),{once:true});document.addEventListener('keydown',()=>hint.remove(),{once:true});

/* ══════════════════════════════════════════════════
   GAME ENGINE
══════════════════════════════════════════════════ */
let cvs, g2d, VW=0, VH=0;
const S=3;
const GH=90;
const WORLD_W=3400;
const CAKE_WX=3050;

let camX=0;
let playerX=80, playerFeetY=0;
let velY=0;
let onGround=false;
let charDir=1, charWalk=false, walkTick=0;

const GRAV=0.72;
const JUMP_VEL=-17;

const PIT_REVEAL=72;
let pits=[
  {x:950,  w:80, vis:false},
  {x:2050, w:100, vis:false}
];

let coins=[];
function mkCoin(wx,h){return{wx,h,col:false,bob:Math.random()*Math.PI*2};}

let lives=3, totalCoins=0;
let playerDead=false, deathHandled=false;
let celebMode=false, candleLit=true, dlgShown=false;
let sceneBits=[];
let shakeFrames=0;
let loopRunning=false, bgmInt=null;

let inputL=false, inputR=false;
let canJump=true;

/* ── BATS ── */
const BATS=[
  {wx:700,  oy:0.35, phase:0,   spd:1.2},
  {wx:1600, oy:0.28, phase:1.5, spd:0.9},
  {wx:2500, oy:0.32, phase:0.8, spd:1.4},
];

window.enterWishLevel = function() {
  document.getElementById('wish-level').style.display='block';
  document.getElementById('mobile-controls').style.display='block';
  document.getElementById('ticker').style.display='none'; // hide ticker during gameplay
  
  // Stop the birthday song when entering the wish level
  document.getElementById('birthday-song').pause();

  initAudio();
  const fl=document.createElement('div');fl.style.cssText='position:absolute;inset:0;background:#fff;z-index:300;animation:flashAnim .5s ease-out forwards;pointer-events:none;';document.getElementById('wish-level').appendChild(fl);setTimeout(()=>fl.remove(),600);
  setTimeout(initScene,100);
}

function initScene(){
  cvs=document.getElementById('scene-canvas');g2d=cvs.getContext('2d');g2d.imageSmoothingEnabled=false;
  VW=window.innerWidth;VH=window.innerHeight;cvs.width=VW;cvs.height=VH;
  window.addEventListener('resize',()=>{VW=window.innerWidth;VH=window.innerHeight;cvs.width=VW;cvs.height=VH;g2d.imageSmoothingEnabled=false;});
  fullReset();
  setupInput();
  document.getElementById('intro-sign').style.display='flex';
  if(!loopRunning){loopRunning=true;requestAnimationFrame(loop);}
  if(bgmInt)clearInterval(bgmInt);
  playWalkBGM();bgmInt=setInterval(playWalkBGM,2870);
}

function fullReset(){
  playerX=80; playerFeetY=gndY(); velY=0; onGround=true;
  charDir=1; charWalk=false; camX=0;
  lives=3; totalCoins=0;
  playerDead=false; deathHandled=false;
  celebMode=false; candleLit=true; dlgShown=false;
  pits.forEach(p=>p.vis=false);
  shakeFrames=0;
  inputL=false; inputR=false; canJump=true;
  buildCoins();
  updateHUD();
}

window.retryReset = function(){
  playerX=80; playerFeetY=gndY(); velY=0; onGround=true;
  charDir=1; charWalk=false; camX=0;
  playerDead=false; deathHandled=false;
  pits.forEach(p=>p.vis=false);
  shakeFrames=0;
  inputL=false; inputR=false; canJump=true;
  coins.forEach(c=>c.col=false);
  dlgShown=false;
  document.getElementById('dialogue').style.display='none';
  cvs.style.transform='';
  updateHUD();
}

function gndY(){return VH-GH;}
function toSX(wx){return Math.round(wx-camX);}

function setupInput(){
  if(window._kd)document.removeEventListener('keydown',window._kd);
  if(window._ku)document.removeEventListener('keyup',window._ku);
  window._kd=e=>{
    if(e.key==='ArrowLeft'||e.key==='a')inputL=true;
    if(e.key==='ArrowRight'||e.key==='d')inputR=true;
    if(e.key==='ArrowUp'||e.key==='w'||e.key===' '){e.preventDefault();tryJump();}
  };
  window._ku=e=>{
    if(e.key==='ArrowLeft'||e.key==='a')inputL=false;
    if(e.key==='ArrowRight'||e.key==='d')inputR=false;
    if(e.key==='ArrowUp'||e.key==='w'||e.key===' ')canJump=true;
  };
  document.addEventListener('keydown',window._kd);document.addEventListener('keyup',window._ku);
  
  const BL=document.getElementById('btn-left'), BR=document.getElementById('btn-right');
  const BA=document.getElementById('btn-a'), BB=document.getElementById('btn-b');
  
  const addEvt=(el, downFn, upFn)=>{
    el.addEventListener('mousedown',downFn);el.addEventListener('touchstart',downFn,{passive:false});
    el.addEventListener('mouseup',upFn);el.addEventListener('touchend',upFn);
    el.addEventListener('mouseleave',upFn);el.addEventListener('touchcancel',upFn);
  };
  
  addEvt(BL, e=>{e.preventDefault();inputL=true;}, e=>{e.preventDefault();inputL=false;});
  addEvt(BR, e=>{e.preventDefault();inputR=true;}, e=>{e.preventDefault();inputR=false;});
  addEvt(BA, e=>{e.preventDefault();tryJump();}, e=>{e.preventDefault();canJump=true;});
  addEvt(BB, e=>{e.preventDefault();tryJump();}, e=>{e.preventDefault();canJump=true;});
}

function tryJump(){
  if(onGround && canJump && !playerDead && !deathHandled && !celebMode){
    velY=JUMP_VEL; onGround=false; canJump=false; playJumpSfx(); initAudio();
  }
}

function buildCoins(){
  coins=[];
  [250, 420, 600, 800, 1150, 1300, 1500, 1750, 1950, 2300, 2500, 2750].forEach(wx=>{
    if(pits.some(p=>wx>p.x-40&&wx<p.x+p.w+40))return;
    coins.push(mkCoin(wx,60+Math.random()*40));
  });
}

function updatePhysics(){
  if(celebMode||deathHandled)return;
  const spd=3.0;
  if(inputL){playerX=Math.max(10,playerX-spd);charDir=-1;charWalk=true;}
  else if(inputR){playerX=Math.min(CAKE_WX,playerX+spd);charDir=1;charWalk=true;}
  else charWalk=false;
  
  if(charWalk&&onGround&&walkTick%16===0)playWalkStep();
  velY+=GRAV; playerFeetY+=velY;
  const floor=gndY();
  
  if(!playerDead){
    const overPit=pits.some(p=>p.vis && playerX>p.x+10 && playerX<p.x+p.w-10);
    if(overPit && playerFeetY>=floor){playerDead=true;velY=2;onGround=false;playFallSfx();}
    if(!overPit){
      if(playerFeetY>=floor){playerFeetY=floor;velY=0;onGround=true;}
      else{onGround=false;}
    }
  } else {
    onGround=false;
    if(playerFeetY>VH+100)handleDeath();
  }
  
  if(!playerDead){
    pits.forEach(p=>{if(!p.vis && p.x-playerX>=0 && p.x-playerX<PIT_REVEAL){p.vis=true;doShake(20);}});
    const psx=toSX(playerX),psy=playerFeetY;
    coins.forEach(c=>{
      if(c.col)return;
      const csx=toSX(c.wx),csy=gndY()-c.h;
      if(Math.abs(psx-csx)<26&&Math.abs((psy-50)-csy)<34){c.col=true;totalCoins++;playCoinSfx();showCoinPopup(csx,csy);}
    });
  }
  camX=Math.round(Math.max(0,Math.min(playerX-VW*.30,WORLD_W-VW)));
  if(!playerDead&&!dlgShown&&Math.abs(playerX-CAKE_WX)<110){dlgShown=true;setTimeout(showDialogue,200);}
  updateHUD();
}

function handleDeath(){
  if(deathHandled)return; deathHandled=true;
  lives--; updateHUD();
  document.getElementById('fell-overlay').style.display='flex';
  if(lives<=0) lives=3; // Reset lives secretly so they keep playing
}
window.retryAfterFall = function(){document.getElementById('fell-overlay').style.display='none';retryReset();}
window.closeIntroSign = function(){const s=document.getElementById('intro-sign');s.style.opacity='0';setTimeout(()=>{s.style.display='none';s.style.opacity='';},320);initAudio();}
function doShake(f){shakeFrames=f;}

/* ── HUD ── */
function updateHUD(){
  const hd=document.getElementById('hud-lives');
  let html='';
  for(let i=0;i<4;i++){
    if(i<lives)html+=`<span class="heart">♥</span>`;
    else html+=`<span class="heart empty">♥</span>`;
  }
  hd.innerHTML=html;
  document.getElementById('hud-coins').textContent=`🪙 x${totalCoins}`;
}
function showCoinPopup(sx,sy){
  const el=document.createElement('div');el.className='coin-popup';el.textContent='+1 🪙';
  el.style.left=(sx-18)+'px';el.style.top=(sy-20)+'px';
  document.getElementById('wish-level').appendChild(el);setTimeout(()=>el.remove(),900);
}

/* ══════════════ DRAWING FUNCTIONS ══════════════ */
function r(x,y,w,h,c){g2d.fillStyle=c;g2d.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}

/* ── DUNGEON BACKGROUND (Arches & Columns) ── */
function drawDungeonBg(){
  const gy=gndY();
  // Deep background wall
  r(0, 0, VW, gy, '#0f0018');
  
  // Crowd Silhouettes (behind arches)
  const t = Date.now();
  for(let i=0; i<30; i++) {
     const bx = (i * 120 - camX * 0.3) % (VW + 200);
     if (bx > -100 && bx < VW + 100) {
       const bob = Math.sin(t/300 + i)*3;
       r(bx, gy - 60 + bob, 20, 30, '#3a0050');
       r(bx+4, gy - 75 + bob, 12, 15, '#3a0050'); // head
     }
  }

  // Draw Background Archways
  const archW = 350;
  const archStartX = -(camX * 0.5) % archW - archW;
  for(let x=archStartX; x<VW; x+=archW) {
    // Arch Column
    r(x, 0, 40, gy, '#18002a');
    // Arch curve (pixel style)
    r(x+40, 0, archW-40, 40, '#18002a');
    r(x+40, 40, 20, 20, '#18002a');
    r(x+archW-20, 40, 20, 20, '#18002a');
    r(x+60, 60, 20, 20, '#18002a');
    r(x+archW-40, 60, 20, 20, '#18002a');
  }
  
  // Decorative floating platforms in background
  r((100 - camX*0.6)%WORLD_W, gy-120, 150, 20, '#220038');
  r((600 - camX*0.6)%WORLD_W, gy-160, 200, 20, '#220038');
}

/* ── FOREGROUND COLUMNS & TORCHES ── */
function drawColumnsAndTorches(){
  const gy = gndY();
  const t = Date.now();
  for(let x=150; x<WORLD_W; x+=450) {
    const sx = toSX(x);
    if(sx < -80 || sx > VW) continue;
    
    // Pillar
    r(sx, 0, 60, gy, '#220035');
    r(sx+4, 0, 52, gy, '#2a0044'); // Highlight face
    // Pillar bricks
    for(let by=0; by<gy; by+=30) {
       r(sx, by, 60, 2, '#110022');
       if((by/30)%2===0) r(sx+30, by, 2, 30, '#110022');
    }
    // Base/Cap
    r(sx-10, gy-20, 80, 20, '#1a002a');
    r(sx-5, 0, 70, 20, '#1a002a');
    
    // Torch on pillar
    r(sx+25, gy-140, 10, 40, '#4a2a00');
    // Flame
    const fl = Math.sin(t/150 + x)*4;
    g2d.fillStyle='#ff00aa'; g2d.beginPath(); g2d.arc(sx+30, gy-145+fl, 12, 0, Math.PI*2); g2d.fill();
    g2d.fillStyle='#ff88ff'; g2d.beginPath(); g2d.arc(sx+30, gy-148+fl, 6, 0, Math.PI*2); g2d.fill();
    // Glow
    g2d.fillStyle='rgba(255,0,170,0.3)'; g2d.beginPath(); g2d.arc(sx+30, gy-145+fl, 30, 0, Math.PI*2); g2d.fill();
  }
}

/* ── PIXEL BRICK FLOOR ── */
function drawGround(){
  const gy = gndY();
  
  // Top thick stone border
  r(0, gy, VW, 10, '#3a0060');
  r(0, gy+10, VW, 5, '#110022');
  
  // Brick face
  r(0, gy+15, VW, GH-15, '#220038');
  
  // Draw bricks logic across the visible ground
  const bW = 60, bH = 25;
  const startCol = Math.floor(camX / bW);
  const endCol = startCol + Math.ceil(VW / bW) + 1;
  
  for(let row = 0; row*bH < GH-15; row++) {
    const by = gy + 15 + row*bH;
    const offset = (row % 2 === 0) ? 0 : bW/2;
    for(let col = startCol; col < endCol; col++) {
      const bx = col * bW - camX + offset;
      // Mortar
      r(bx, by, bW, 2, '#110022');
      r(bx, by, 2, bH, '#110022');
      // Highlight
      r(bx+4, by+4, bW-8, 4, 'rgba(255,0,170,0.1)');
    }
  }
  
  // Bottom thick border to simulate elevated platform
  r(0, VH-10, VW, 10, '#0d001a');

  // Pits
  pits.forEach(p=>{
    if(!p.vis) return;
    const px=toSX(p.x), pw=p.w;
    if(px+pw<0 || px>VW) return;
    
    // The "Hole" cuts through the platform
    g2d.clearRect(px, gy, pw, GH);
    r(px, gy, pw, GH, '#080011'); // Dark void
    
    // Side walls of the pit (showing depth)
    r(px-10, gy, 10, GH, '#110022');
    r(px+pw, gy, 10, GH, '#110022');
    
    // Bottom neon mist
    const lg = g2d.createLinearGradient(0, VH-40, 0, VH);
    lg.addColorStop(0, 'rgba(255,0,170,0)');
    lg.addColorStop(1, 'rgba(255,0,170,0.6)');
    g2d.fillStyle = lg; g2d.fillRect(px, gy, pw, GH);
  });
}

/* ── BATS ── */
function drawBats(){
  const t=Date.now();
  BATS.forEach(bat=>{
    const wx = bat.wx + (Math.sin(t/1000*bat.spd + bat.phase)*80);
    const sx = toSX(wx);
    if(sx<-40||sx>VW+40)return;
    const sy = VH*bat.oy + Math.sin(t/500+bat.phase)*20;
    
    r(sx-6, sy-4, 12, 8, '#1a0033'); // body
    r(sx-4, sy-8, 2, 4, '#1a0033'); // ear
    r(sx+2, sy-8, 2, 4, '#1a0033'); // ear
    
    // Wings
    const wFlap=Math.sin(t/100+bat.phase)>0 ? 1 : -1;
    if(wFlap > 0) {
      r(sx-20, sy-8, 14, 4, '#2a0044'); // Up wing left
      r(sx+6, sy-8, 14, 4, '#2a0044');  // Up wing right
    } else {
      r(sx-20, sy+4, 14, 4, '#2a0044'); // Down wing left
      r(sx+6, sy+4, 14, 4, '#2a0044');  // Down wing right
    }
    
    // Eyes
    r(sx-3, sy-2, 2, 2, '#ff00aa');
    r(sx+1, sy-2, 2, 2, '#ff00aa');
  });
}

/* ── COINS (Pixel Art) ── */
function drawCoins(){
  const t=Date.now();
  coins.forEach(c=>{
    if(c.col)return;
    const cx=toSX(c.wx); if(cx<-20||cx>VW+20)return;
    const bob=Math.sin(t/300+c.bob)*6, cy=gndY()-c.h+bob;
    
    // Pixel coin shape (approximate circle with rects)
    r(cx-6, cy-10, 12, 20, '#cc8800'); // Outline vertical
    r(cx-10, cy-6, 20, 12, '#cc8800'); // Outline horizontal
    r(cx-6, cy-8, 12, 16, '#ffee00');  // Inner Gold
    r(cx-8, cy-6, 16, 12, '#ffee00');
    r(cx-2, cy-6, 4, 12, '#ffaa00');   // Inner shine
  });
}

/* ── TREASURE CHEST ── */
function drawChest(sx, sy){
  r(sx, sy-30, 40, 30, '#111'); // Outline
  r(sx+2, sy-28, 36, 26, '#666'); // Silver body
  r(sx+2, sy-14, 36, 4, '#111'); // Separation
  r(sx+16, sy-18, 8, 10, '#ffee00'); // Gold Lock
  r(sx+18, sy-16, 4, 4, '#000'); // Keyhole
}

/* ── CAKE AREA ── */
function drawCake(){
  const tx=toSX(CAKE_WX), ty=gndY();
  if(tx>VW+300||tx<-300)return;
  
  drawChest(tx-80, ty);
  
  const ci=document.getElementById('cake-sprite'); let iw=100;
  if(ci&&ci.complete&&ci.naturalWidth){
    const th=120, sc=th/ci.naturalHeight; iw=ci.naturalWidth*sc;
    g2d.drawImage(ci, tx, ty-th, iw, th);
    if(!candleLit){
      for(let i=0;i<3;i++){r(tx+(iw*.35)+(i*12),ty-th-10,S,3*S,'#aaa');}
    }
  }
}
function drawPartyGroup(){
  const ty = gndY();
  // Start drawing to the right of the cake
  let startX = CAKE_WX + 100;
  const spacing = 10; // Space between characters

  for(let i=1; i<=6; i++){
      const img = document.getElementById('gc'+i);
      if(img && img.complete && img.naturalWidth > 0){
          const targetH = 70;
          const scale = targetH / img.naturalHeight;
          const dw = img.naturalWidth * scale;
          const dh = img.naturalHeight * scale;

          const wx = startX + (i-1)*spacing;
          const sx = toSX(wx);
          if(sx > -dw && sx < VW){
              g2d.drawImage(img, sx, ty - dh, dw, dh);
          }
      }
  }
}

/* ── CHARACTER ── */
function drawChar(){
  const sx=toSX(playerX),sy=playerFeetY;
  const sd=sy-gndY();
  if(sd>-120){const ss=Math.max(.15,1+sd/100);g2d.fillStyle='rgba(0,0,0,0.5)';g2d.fillRect(sx-~~(14*ss),gndY()-4,~~(28*ss),6);}
  const img=document.getElementById('char-sprite');
  if(!img||!img.complete||!img.naturalWidth)return;
  const cols=7,rows=5,sw2=img.naturalWidth/cols,sh2=img.naturalHeight/rows;
  let srcX=0,srcY=0,flip=false;
  if(celebMode){srcY=2*sh2;srcX=sw2;}
  else if(!onGround){srcY=sh2;srcX=2*sw2;flip=charDir<0;}
  else if(charWalk){srcY=sh2;srcX=~~(walkTick/8)%4*sw2;flip=charDir<0;}
  else{srcY=0;srcX=0;flip=false;}
  const sc=.65,dw=sw2*sc,dh=sh2*sc;
  g2d.save();g2d.translate(sx,sy);if(flip)g2d.scale(-1,1);
  g2d.drawImage(img,srcX,srcY,sw2,sh2,-dw/2,-dh,dw,dh);
  g2d.restore();
}

/* ── CELEBRATE BITS ── */
function initBits(){sceneBits=[];for(let i=0;i<60;i++)sceneBits.push({x:Math.random()*VW,y:Math.random()*VH,vy:1+Math.random()*2,vx:(Math.random()-.5)*1.5,c:COLORS[~~(Math.random()*COLORS.length)],sz:[4,6,8][~~(Math.random()*3)]});}
function drawBits(){sceneBits.forEach(b=>{r(b.x,b.y,b.sz,b.sz,b.c);b.y+=b.vy;b.x+=b.vx;if(b.y>VH){b.y=-10;b.x=Math.random()*VW;}});}

/* ══════════════ MAIN LOOP ══════════════ */
function loop(){
  walkTick++;
  updatePhysics();

  if(shakeFrames>0){shakeFrames--;cvs.style.transform=`translate(${(Math.random()-.5)*8}px,${(Math.random()-.5)*6}px)`;}
  else cvs.style.transform='';

  g2d.clearRect(0,0,VW,VH);

  drawDungeonBg();
  drawColumnsAndTorches();
  drawBats();
  drawGround();
  drawCoins();
  drawCake();
  drawPartyGroup();
  drawChar();
  if(celebMode)drawBits();

  requestAnimationFrame(loop);
}

/* ── DIALOGUE & CELEBRATION ── */
window.showDialogue = function(){document.getElementById('dialogue').style.display='block';playDialogueSfx();}
window.closeDialogue = function(){document.getElementById('dialogue').style.display='none';dlgShown=false;}
window.blowCandles = function(){
  closeDialogue();playBlowSfx();
  setTimeout(()=>{
    candleLit=false;celebMode=true;charWalk=false;initBits();
    setTimeout(()=>{
      playCelebSfx();
      document.getElementById('celeb-text').style.display='block';
      
      /* SHOW RPG CARD AFTER A MOMENT */
      setTimeout(()=>{
         const card = document.getElementById('rpg-card');
         card.style.display = 'block';
         // Update coins in the card
         document.getElementById('final-coins').innerText = (totalCoins<10?'0':'')+totalCoins;
      }, 1500);

      launchFW();spawnBits(80);setInterval(()=>spawnBits(8),500);
    },300);
  },500);
}

/* ── FIREWORKS ── */
function launchFW(){
  const fwl=document.getElementById('fw-layer');let cnt=0;
  function s(){cnt++;const x=50+Math.random()*(VW-100),y=30+Math.random()*(VH*.55);burst(fwl,x,y,COLORS[~~(Math.random()*COLORS.length)]);if(cnt<80)setTimeout(s,180+Math.random()*350);}s();
}
function burst(l,x,y,c){
  for(let i=0;i<18;i++){
    const sp=document.createElement('div');sp.className='fw-spark';
    const a=(i/18)*Math.PI*2,d=50+Math.random()*90;
    sp.style.cssText=`left:${x}px;top:${y}px;background:${c};width:${3+~~(Math.random()*6)}px;height:${3+~~(Math.random()*6)}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d}px;animation-duration:${.5+Math.random()*.6}s;`;
    l.appendChild(sp);setTimeout(()=>sp.remove(),1300);
  }
  beep(150+Math.random()*500,.07,'square',.04);
}
