(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const W = 384, H = 216, VIEW_W = 1200, VIEW_H = 800;
  const FLOOR = 178, ARCHIVE_W = 1330, ARCHIVE_EXIT_X = 1248, SCREENING_W = 1000, SCREENING_EXIT_X = 932, PORTFOLIO_W = 1040, PORTFOLIO_EXIT_X = 978;
  const START_HEARTS = 3, HEARTS_PER_STAGE = 1;
  const keys = Object.create(null);
  const mouse = { left:false, aimX:W*.82, aimY:FLOOR-10, aiming:false };
  const palette = {
    ink:'#101722', deep:'#182330', steel:'#293a49', steel2:'#405364', edge:'#71808a',
    paper:'#c8bca6', paperHi:'#eadfca', paperShade:'#948b7d', paperInk:'#665f57',
    red:'#d94f54', redDark:'#80373f', teal:'#55a4a1', tealDark:'#2e6268',
    lime:'#c3dc70', light:'#f4f2ff', shadow:'#0c121d'
  };
  const difficulty = {
    junior:{label:'Джун', hp:12, tell:1.4, gap:1.25, vuln:2.1, shot:.65, extra:false},
    middle:{label:'Мидл', hp:24, tell:1.05, gap:.88, vuln:1.4, shot:.92, extra:false},
    senior:{label:'Сеньор / лид', hp:30, tell:.88, gap:.65, vuln:1.08, shot:1.08, extra:true}
  };
  const difficulties = Object.keys(difficulty);
  let mode='title', room='archive', selectedDifficulty='junior';
  let player, platforms=[], breakables=[], hostileShots=[], playerShots=[], archiveBots=[], flyingBots=[], archiveTraps=[], hrQuestioners=[], portfolioCritics=[], particles=[], coreStage=1, portfolioDropTimer=0;
  let archiveTime=0, camera=0, time=0, tutorialStep=0, moveTally=0;
  let shootClock=0, hearts=3, boss=null, nextRoom=null;
  let transitionTime=0, outroTime=0, deaths=0, hitsTaken=0, startTime=0;
  let sound=false, audio=null, pauseFrom='play';

  // Original canvas pixel art keeps a single grid and palette throughout both halls.
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
  function fx(name,x,y,w,h,seconds=time,options={}){window.PixelFXAssets?.draw(name,ctx,seconds,x,y,w,h,options);}
  function drawAtmosphere(){
    const haze=ctx.createLinearGradient(0,24,0,FLOOR+10);haze.addColorStop(0,'rgba(164,178,194,.025)');haze.addColorStop(.42,'rgba(126,145,164,.075)');haze.addColorStop(.82,'rgba(108,130,151,.18)');haze.addColorStop(1,'rgba(14,20,31,.32)');
    ctx.fillStyle=haze;ctx.fillRect(0,24,W,FLOOR-12);
    const drift=(time*5)%460;for(let i=0;i<3;i++){const y=66+i*37+Math.sin(time*.25+i)*4;const fog=ctx.createLinearGradient(0,y, W,y+8);fog.addColorStop(0,'rgba(150,169,184,0)');fog.addColorStop(.5,'rgba(150,169,184,.05)');fog.addColorStop(1,'rgba(150,169,184,0)');ctx.fillStyle=fog;ctx.fillRect(-drift,y,W+460,9);}
  }
  function line(x1,y1,x2,y2,color){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Math.round(x1)+.5,Math.round(y1)+.5);ctx.lineTo(Math.round(x2)+.5,Math.round(y2)+.5);ctx.stroke();}
  function txt(value,x,y,size=7,color=palette.light,align='left'){ctx.font=`${size}px monospace`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;ctx.fillText(value,x,y);}
  function poly(points,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fill();}
  function tone(freq=440,duration=.07,wave='square'){if(!sound)return;try{audio ||= new(window.AudioContext||window.webkitAudioContext)();const osc=audio.createOscillator(),gain=audio.createGain();osc.type=wave;osc.frequency.value=freq;gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration)}catch{}}
  function panel(html,extra=''){overlay.innerHTML=`<div class="card ${extra}">${html}</div>`;}

  function renderTitle(){
    mode='title'; room='archive';
    const gradeDescriptions={junior:'Боссы слабее и медленнее. Окно для атаки дольше.',middle:'Обычная сложность: сбалансированные боссы и атаки.',senior:'Боссы крепче и быстрее, появляются дополнительные атаки.'};
    panel(`<h1>ПОЙМАЙ ОФФЕР</h1><p class="subtitle">Пробейся через этапы собеседования<br>и переживи автоматический отбор.</p><div class="difficulty-picker" aria-label="Сложность">${difficulties.map(key=>`<button class="difficulty-choice ${key===selectedDifficulty?'selected':''}" data-difficulty="${key}" aria-pressed="${key===selectedDifficulty}"><span class="difficulty-name">${difficulty[key].label}</span><span class="difficulty-description">${gradeDescriptions[key]}</span></button>`).join('')}</div><button class="primary" id="start">НАЧАТЬ ИГРУ</button>`,'title-card');
    overlay.querySelectorAll('[data-difficulty]').forEach(button=>button.addEventListener('click',()=>{selectedDifficulty=button.dataset.difficulty;renderTitle()}));
    document.getElementById('start').onclick=startGame;
  }
  function startGame(){
    deaths=0;hitsTaken=0;hearts=START_HEARTS;startTime=performance.now();room='archive';mode='play';setupArchive(true);overlay.innerHTML='';tone(560,.12);
  }
  function makePlayer(x=30){return{x,y:FLOOR-23,vx:0,vy:0,w:16,h:23,hp:hearts,face:1,aimAngle:0,crouching:false,ground:true,coyote:.1,jumpBuffer:0,inv:0,run:0,shootCooldown:0,hurt:0,standing:null};}
  function setupArchive(resetPlayer=false){
    room='archive';camera=0;archiveTime=0;tutorialStep=0;moveTally=0;
    platforms=[
      {x:0,y:FLOOR,w:291,h:H-FLOOR,kind:'ground'}, {x:311,y:FLOOR,w:278,h:H-FLOOR,kind:'ground'},
      {x:609,y:FLOOR,w:279,h:H-FLOOR,kind:'ground'}, {x:908,y:FLOOR,w:422,h:H-FLOOR,kind:'ground'},
      {x:136,y:150,w:56,h:9,kind:'paper'}, {x:251,y:145,w:54,h:9,kind:'paper'},
      {x:333,y:147,w:56,h:9,kind:'paper'}, {x:447,y:142,w:60,h:9,kind:'conveyor'},
      {x:553,y:145,w:48,h:9,kind:'crumble',timer:0,active:true},
      {x:634,y:146,w:47,h:9,kind:'paper'}, {x:749,y:140,w:56,h:9,kind:'paper'},
      {x:843,y:147,w:40,h:9,kind:'crumble',timer:0,active:true},
      {x:955,y:145,w:58,h:9,kind:'paper'}, {x:1080,y:148,w:55,h:9,kind:'paper'}
    ];
    breakables=[{x:387,y:154,w:28,h:24,hp:2,seed:2},{x:785,y:154,w:25,h:24,hp:2,seed:3},{x:1037,y:154,w:28,h:24,hp:2,seed:4}];
    hostileShots=[];hrQuestioners=[];
    archiveTraps=[{x:524,w:40,phase:0},{x:1072,w:40,phase:3.2}];
    archiveBots=[
      {x:355,min:335,max:390,inspectX:365,dir:1,speed:21,state:'patrol',timer:0,fireCooldown:1.5,hp:1,alive:true},
      {x:505,min:480,max:555,inspectX:520,dir:1,speed:22,state:'patrol',timer:0,fireCooldown:2.4,hp:1,alive:true},
      {x:675,min:640,max:715,inspectX:700,dir:1,speed:22,state:'patrol',timer:0,fireCooldown:1.9,hp:1,alive:true},
      {x:825,min:785,max:860,inspectX:830,dir:1,speed:23,state:'patrol',timer:0,fireCooldown:2.8,hp:1,alive:true},
      {x:975,min:935,max:1025,inspectX:980,dir:1,speed:22,state:'patrol',timer:0,fireCooldown:1.7,hp:1,alive:true},
      {x:1170,min:1120,max:1210,inspectX:1160,dir:1,speed:24,state:'patrol',timer:0,fireCooldown:2.6,hp:1,alive:true}
    ];
    flyingBots=[
      {x:430,y:110,baseY:110,min:365,max:520,dir:1,speed:24,phase:.5,state:'fly',timer:0,fireCooldown:1.8,hp:1,alive:true},
      {x:740,y:115,baseY:115,min:645,max:835,dir:-1,speed:20,phase:2.2,state:'fly',timer:0,fireCooldown:2.7,hp:1,alive:true},
      {x:1080,y:106,baseY:106,min:995,max:1220,dir:1,speed:22,phase:4.1,state:'fly',timer:0,fireCooldown:2.2,hp:1,alive:true}
    ];
    playerShots=[];particles=[];if(resetPlayer||!player)player=makePlayer(30);else{player=makePlayer(30);player.hp=hearts;}
    boss=null;
  }
  function setupCore(stage=1){
    coreStage=stage;
    room='core';camera=0;platforms=[{x:0,y:FLOOR,w:W,h:H-FLOOR,kind:'arena'},{x:36,y:145,w:55,h:8,kind:'paper'},{x:294,y:145,w:55,h:8,kind:'paper'}];
    breakables=[];hostileShots=[];playerShots=[];archiveBots=[];flyingBots=[];archiveTraps=[];hrQuestioners=[];particles=[];player=makePlayer(28);player.hp=hearts;
    const config=difficulty[selectedDifficulty],hr=stage===2,creative=stage===3,ceo=stage===4,bossHp=ceo?Math.round(config.hp*1.65):config.hp;boss={x:ceo?180:242,y:hr?82:creative?83:ceo?43:53,w:ceo?164:112,h:ceo?158:113,hp:bossHp,maxHp:bossHp,state:'intro',timer:2.15,attackIndex:0,attack:hr?'questionBurst':creative?'commentSpread':ceo?'ceoVolley':'volley',targetX:100,warningXs:[],hitCooldown:0,flash:0,face:'sleep',filter:'',stampY:-80,beamTimer:0,phase:0,phaseBanner:0,phaseShield:0,moveDir:-1,moveSpeed:hr?58:ceo?66:42,moving:false,walkDir:-1,walkSpeed:27,jumpVy:0,jumping:false,jumpCooldown:2+Math.random()*2.2,jumpTargetX:0,floorTrapTimer:3.2,floorTrapWarning:0,floorTrapActive:0,floorTrapX:190,platformDropTimer:4.6,variant:hr?'hr':creative?'creative':ceo?'ceo':'skull'};
    if(ceo)platforms=[{x:0,y:FLOOR,w:W,h:H-FLOOR,kind:'arena'},{x:36,y:145,w:55,h:8,kind:'crumble',timer:0,active:true,respawn:0},{x:294,y:145,w:55,h:8,kind:'crumble',timer:0,active:true,respawn:0}];
    mode='intro';
  }
  function setupScreening(){
    room='screening';camera=0;archiveTime=0;boss=null;
    platforms=[
      {x:0,y:FLOOR,w:291,h:H-FLOOR,kind:'ground'}, {x:311,y:FLOOR,w:278,h:H-FLOOR,kind:'ground'},
      {x:609,y:FLOOR,w:279,h:H-FLOOR,kind:'ground'}, {x:908,y:FLOOR,w:92,h:H-FLOOR,kind:'ground'},
      {x:126,y:147,w:58,h:9,kind:'paper'}, {x:344,y:140,w:62,h:9,kind:'paper'},
      {x:492,y:148,w:52,h:9,kind:'paper'}, {x:675,y:138,w:62,h:9,kind:'paper'},
      {x:824,y:146,w:58,h:9,kind:'paper'}
    ];
    breakables=[{x:390,y:154,w:27,h:24,hp:2,seed:5},{x:714,y:154,w:29,h:24,hp:2,seed:6}];
    hostileShots=[];playerShots=[];archiveBots=[];flyingBots=[];archiveTraps=[];particles=[];
    hrQuestioners=[
      {x:220,min:190,max:252,dir:-1,speed:17,state:'patrol',timer:0,fireCooldown:1.8,hp:2,alive:true},
      {x:455,min:415,max:535,dir:1,speed:19,state:'patrol',timer:0,fireCooldown:2.2,hp:2,alive:true},
      {x:735,min:690,max:790,dir:-1,speed:18,state:'patrol',timer:0,fireCooldown:1.9,hp:2,alive:true},
      {x:875,min:850,max:910,dir:1,speed:20,state:'patrol',timer:0,fireCooldown:2.5,hp:2,alive:true}
    ];
    player=makePlayer(28);player.hp=hearts;mode='play';overlay.innerHTML='';
  }
  function setupPortfolio(){
    room='portfolio';camera=0;archiveTime=0;boss=null;portfolioDropTimer=2.2;
    platforms=[{x:0,y:FLOOR,w:530,h:H-FLOOR,kind:'ground'},{x:554,y:FLOOR,w:486,h:H-FLOOR,kind:'ground'},
      {x:166,y:145,w:54,h:9,kind:'paper'},{x:392,y:139,w:58,h:9,kind:'paper'},{x:652,y:146,w:54,h:9,kind:'paper'},{x:824,y:137,w:58,h:9,kind:'paper'}];
    breakables=[];hostileShots=[];playerShots=[];archiveBots=[];flyingBots=[];archiveTraps=[];hrQuestioners=[];particles=[];
    portfolioCritics=[{x:330,min:305,max:420,dir:-1,speed:20,fireCooldown:2.1,alive:true},{x:700,min:650,max:780,dir:1,speed:17,fireCooldown:3.0,alive:true}];
    player=makePlayer(28);player.hp=hearts;mode='play';overlay.innerHTML='';
  }
  function restartRoom(){if(room==='archive'){hearts=START_HEARTS;setupArchive(true);mode='play'}else if(room==='screening'){hearts=START_HEARTS;setupScreening()}else if(room==='portfolio'){hearts=START_HEARTS;setupPortfolio()}else{hearts=START_HEARTS;setupCore(coreStage)}overlay.innerHTML='';}

  // Layered archive architecture. Camera offsets differ by depth to keep the corridor alive.
  function drawArchiveBack(){
    rect(0,0,W,H,'#09091b');rect(0,22,W,142,'#11112d');
    for(let y=30;y<160;y+=26){rect(0,y,W,1,'#252c40');rect(0,y+1,W,1,'#171f30');}
    const drift=camera*.16,first=Math.floor(drift/144)*144-144;
    for(let wx=first;wx<drift+W+144;wx+=144){const x=wx-drift,bay=(Math.floor(wx/144)%3+3)%3;
      rect(x+8,36,112,103,'#263544');rect(x+13,41,102,91,'#101a28');rect(x+15,43,98,3,'#3c3b5d');rect(x+15,126,98,3,'#34354d');
      if(bay===0){rect(x+28,54,70,56,'#263b49');rect(x+33,59,60,46,'#0e1c27');rect(x+38,65,49,3,'#75c8c3');rect(x+38,76,36,2,'#827ab2');rect(x+38,86,46,2,'#c77aa2');rect(x+38,96,24,2,'#c3dc70');}
      else if(bay===1){for(let i=0;i<5;i++){const h=22+(i%3)*12;rect(x+26+i*15,119-h,7,h,'#292052');rect(x+28+i*15,121-h,2,h-4,i%2?'#75c8c3':'#c77aa2');}rect(x+24,120,78,3,'#4f36a0');}
      else{rect(x+34,55,55,56,'#25205e');rect(x+38,59,47,45,'#090b22');fx('hologram',x+29,48,65,68,time*.7+bay,{alpha:.82});}
      rect(x+18,34,2,96,'#455568');rect(x+107,34,2,96,'#32265e');rect(x+18,139,8,2,'#75c8c3');rect(x+101,139,8,2,'#c77aa2');
    }
    for(let x=24-Math.floor(camera*.42)%96;x<W;x+=96){rect(x,22,34,3,'#34286f');rect(x+5,26,24,2,'#75c8c3');rect(x+13,28,8,13,'#1d1a4d');rect(x+15,41,4,9,'#c77aa2');}
    rect(0,162,W,16,'#171638');rect(0,164,W,2,'#75c8c3');rect(0,175,W,3,'#c77aa2');
    for(let x=-((camera*.65)%32);x<W+32;x+=32){rect(x,168,22,4,'#28204f');rect(x+5,169,13,1,'#c3dc70');}
  }
  function drawArchiveShelves(){
    for(let wx=38;wx<ARCHIVE_W;wx+=218){const x=wx-camera;if(x<-115||x>W+115)continue;rect(x+9,62,96,78,'#263544');rect(x+13,66,88,69,'#101a28');rect(x+16,70,82,3,'#75c8c3');rect(x+18,82,34,43,'#181746');rect(x+21,85,28,37,'#101a28');for(let i=0;i<4;i++){rect(x+57,84+i*9,35-(i%2)*9,2,i===2?'#c77aa2':'#7771c8');rect(x+57,87+i*9,5,2,'#c3dc70');}rect(x+5,139,104,4,'#5143a0');rect(x+15,145,84,3,'#201b50');if(Math.floor(wx/218)%2===0)fx('hologram',x+18,45,72,74,time*.78,{alpha:.68});rect(x+105,77,4,26,'#c77aa2');rect(x+108,82,5,5,'#75c8c3');rect(x+110,95,5,5,'#c3dc70');}
  }
  function drawPlatform(p){
    if(p.active===false)return;
    const x=p.x-camera;if(x+p.w<0||x>W)return;
    if(p.kind==='ground'||p.kind==='arena'){
      rect(x,p.y,p.w,3,'#75c8c3');rect(x,p.y+3,p.w,2,'#563d94');rect(x,p.y+5,p.w,p.h-5,'#11132d');
      for(let gx=x+8;gx<x+p.w;gx+=30){rect(gx,p.y+8,1,Math.max(0,p.h-9),'#34434c');rect(gx+3,p.y+10,2,1,'#718087');}
      if(p.kind==='arena')for(let gx=x+12;gx<x+p.w;gx+=48){rect(gx,p.y+6,2,2,'#60717a');rect(gx+3,p.y+6,1,1,'#141c27');}
      return;
    }
    if(p.kind==='conveyor'){
      rect(x,p.y,p.w,3,'#87918b');rect(x,p.y+3,p.w,p.h-3,'#414f56');
      for(let bx=x+4;bx<x+p.w-4;bx+=11){rect(bx,p.y+4,6,3,'#1c2833');rect(bx+1,p.y+4,3,1,'#a7a28f');}
      return;
    }
    const shake=p.kind==='crumble'&&p.timer>0?Math.sin(time*55)*1.2:0;
    rect(x+shake,p.y,p.w,p.h,'#33255e');rect(x+2+shake,p.y-3,p.w-4,3,'#75c8c3');rect(x+5+shake,p.y-5,p.w-11,2,'#c77aa2');
    rect(x+5+shake,p.y+3,2,2,'#d9cbb4');rect(x+p.w-8+shake,p.y+3,2,2,'#d9cbb4');
    for(let bx=x+11;bx<x+p.w-7;bx+=15){rect(bx+shake,p.y+2,1,p.h-4,'#9c907f');}
    if(p.kind==='crumble'){rect(x+p.w/2-1,p.y+4,2,4,p.timer>0?'#bb7770':'#9c554f');}
  }
  function drawPaperStack(block){
    const x=block.x-camera,y=block.y;if(x+block.w<0||x>W)return;
    rect(x+2,y+4,block.w,block.h-4,'#72685c');rect(x,y+2,block.w-2,block.h-3,'#b5a991');rect(x+2,y,block.w-4,block.h-3,'#e1d5bf');
    rect(x+4,y+3,block.w-8,1,'#928776');rect(x+5,y+7,block.w-10,1,'#9f9789');rect(x+6,y+11,block.w-12,1,'#b0a797');
    rect(x+block.w-8,y+4,4,3,'#aa5551');rect(x+block.w-7,y+5,2,1,'#e3c6ae');
    if(block.hp===1){rect(x+block.w/2,y+1,1,6,'#6b3c3b');rect(x+block.w/2+2,y+6,1,7,'#6b3c3b');}
  }
  function drawShredder(){
    const x=450-camera;if(x<-20||x>W+80)return;const phase=(archiveTime%4.8);const warning=phase>1.6&&phase<2.35;const active=phase>=2.35&&phase<3.05;
    rect(x-8,144,62,34,'#26333d');rect(x-4,147,54,24,'#4a5558');rect(x,151,46,13,'#131c25');
    for(let i=0;i<9;i++){const bx=x+2+i*5;rect(bx,152,2,8,active?'#d84d50':'#87908a');rect(bx+2,160,2,3,'#293640');}
    rect(x-10,143,66,4,'#808982');rect(x-6,168,58,3,'#9b8d76');
    rect(x+56,150,13,25,'#313d45');rect(x+59,153,7,7,warning||active?'#dc514f':'#53655f');
    if(warning||active){rect(x-5,132,48,7,'#161d27');txt(active?'ШРЕДЕР АКТИВЕН':'ОСТОРОЖНО',x+19,138,5,active?'#ff6863':'#f2ce79','center');}
    for(let i=0;i<3;i++){rect(x+9+i*14,166+(i%2),3,2,'#ded1bb');}
  }
  function drawStamp(){
    const x=706-camera;if(x<-45||x>W+45)return;const cycle=archiveTime%6.6;const warning=cycle>3.45&&cycle<4.35;const slam=cycle>=4.35&&cycle<4.92;const drop=slam?Math.min(67,(cycle-4.35)*240):warning?Math.sin(time*36)*2:0;
    rect(x-4,34,8,75,'#485a62');rect(x-18,37,36,6,'#718080');rect(x-13,41,26,5,'#33434c');
    rect(x-21,45+drop,42,13,'#7c8179');rect(x-17,58+drop,34,10,'#a6977a');rect(x-11,68+drop,22,8,'#5c625d');rect(x-8,76+drop,16,3,'#b9aa8c');
    rect(x-30,40,5,5,warning||slam?'#e25a55':'#657a78');rect(x+25,40,5,5,warning||slam?'#e25a55':'#657a78');
    if(warning){rect(x-22,FLOOR-2,44,2,'#e15a56');rect(x-22,154,44,1,'#a33f48');txt('ШТАМП!',x,149,6,'#ef7770','center');}
    if(slam){rect(x-23,FLOOR-7,46,2,'#f57c64');rect(x-34,FLOOR-5,8,2,'#e9c18a');rect(x+28,FLOOR-5,8,2,'#e9c18a');}
  }
  function drawArchiveBot(bot){
    if(!bot.alive)return;const x=Math.round(bot.x-camera),y=FLOOR-14,scan=bot.state==='scan',step=Math.floor(time*12)%2;
    if(x<-24||x>W+24)return;
    if(bot.state==='aim'){
      const targetX=(bot.targetX??player.x+player.w/2)-camera,targetY=bot.targetY??player.y+player.h/2;
      line(x+8,y+5,targetX,targetY,'#b64b55');rect(targetX-2,targetY-2,5,1,'#ef6560');rect(targetX,targetY-4,1,5,'#ef6560');
      rect(x+4,y+4,8,3,'#ef5355');
    }
    if(scan){
      const scanY=y-23+(Math.floor(time*7)%5);
      rect(x+8,y-22,1,12,'#457b78');rect(x+4,y-15,9,1,'#71c8b0');
      rect(x+1,y-27,15,9,'#b9ad96');rect(x+3,y-25,11,1,'#746d62');rect(x+3,y-21,9,1,'#857a6a');rect(x+3,scanY,11,1,'#c3dc70');
    }
    // Small wheeled CRT auditors pace the archive floor and pause to scan a résumé.
    rect(x+2,y+11,5,2,'#17232b');rect(x+10,y+11,5,2,'#17232b');
    rect(x+3+(step?1:0),y+10,3,3,'#7e8881');rect(x+10-(step?1:0),y+10,3,3,'#7e8881');
    rect(x,y+4,17,7,'#293b45');rect(x+2,y+2,13,8,'#56686c');rect(x+4,y+3,9,5,'#112029');
    rect(x+5,y+4,6,2,scan?'#c3dc70':'#79d2bb');rect(x+6+(bot.dir>0?2:0),y+4,2,2,'#10202a');
    rect(x+1,y+7,3,2,'#d85753');rect(x+14,y+7,2,2,'#d6c5a2');
    rect(x+7,y,3,2,'#697a79');rect(x+8,y-2,1,2,scan?'#c3dc70':'#7b8c86');
    rect(x+2,y+3,2,1,'#d9caaa');rect(x+14,y+3,2,1,'#d9caaa');
  }
  function drawFlyingBot(bot){
    if(!bot.alive)return;const x=Math.round(bot.x-camera),y=Math.round(bot.y),rotor=Math.floor(time*14)%2;
    if(x<-30||x>W+30)return;
    if(bot.state==='aim'){
      const tx=(bot.targetX??player.x+player.w/2)-camera,ty=bot.targetY??player.y+player.h/2;
      line(x+11,y+8,tx,ty,'#b64b55');rect(tx-2,ty-2,5,1,'#ef6560');rect(tx,ty-4,1,5,'#ef6560');
    }
    // Compact résumé drones hover above the lane and telegraph each shot with a red targeting beam.
    rect(x+1,y+5,5,6,'#344852');rect(x+16,y+5,5,6,'#344852');
    rect(x+3,y+3,16,11,'#52646a');rect(x+5,y+4,12,8,'#1b2932');
    rect(x+7,y+6,8,3,bot.state==='aim'?'#ef5355':'#78d2bb');rect(x+9,y+6,3,2,'#13232c');
    rect(x+6,y+1,10,2,'#71817b');rect(x+8+rotor,y-1,6,2,'#d5c6a5');
    rect(x+4,y+12,3,2,'#d85753');rect(x+15,y+12,4,2,'#c3dc70');
    rect(x+8,y+14,2,2,rotor?'#e97c5d':'#c3dc70');rect(x+13,y+14,2,2,rotor?'#c3dc70':'#e97c5d');
  }
  function drawArchivePits(){
    const gaps=room==='portfolio'?[[530,554]]:[[291,311],[589,609],[888,908]];
    for(const [left,right] of gaps){
      const x=left-camera,w=right-left;if(x+w<-4||x>W+4)continue;
      // Open shaft, beveled walls, striped lips and a dim warning glow below.
      poly([[x-2,FLOOR-2],[x+w+2,FLOOR-2],[x+w-2,H],[x+2,H]],'#05090f');
      poly([[x,FLOOR],[x+4,FLOOR+5],[x+4,H],[x,H]],'#3c4b50');
      poly([[x+w,FLOOR],[x+w-4,FLOOR+5],[x+w-4,H],[x+w,H]],'#34444b');
      rect(x+5,FLOOR+5,Math.max(0,w-10),H-FLOOR-5,'#070c13');
      for(let y=FLOOR+11;y<H-3;y+=9){rect(x+6,y,Math.max(0,w-12),1,'#1a2831');rect(x+8,y+2,2,1,'#35464c');}
      rect(x+7,H-7,Math.max(0,w-14),2,'#863f45');rect(x+10,H-5,Math.max(0,w-20),1,'#d26a50');
      rect(x-2,FLOOR-3,2,3,'#87918a');rect(x+w,FLOOR-3,2,3,'#87918a');
      for(let y=FLOOR+2;y<H;y+=8){const warning=Math.floor((y-FLOOR)/8)%2===0;rect(x,y,3,4,warning?'#bd8950':'#27343a');rect(x+w-3,y,3,4,warning?'#bd8950':'#27343a');}
      rect(x+1,FLOOR-1,3,1,'#f0c879');rect(x+w-4,FLOOR-1,3,1,'#f0c879');
    }
  }
  function archiveTrapState(trap){
    const phase=(archiveTime+trap.phase)%6.8;
    return {warning:phase>=2.5&&phase<3.3,active:phase>=3.3&&phase<4.1};
  }
  function drawArchiveTraps(){
    for(const trap of archiveTraps){
      const x=trap.x-camera;if(x<-45||x>W+45)continue;
      const {warning,active}=archiveTrapState(trap),beam=active?'#ee5356':warning?(Math.floor(time*8)%2?'#e3ba65':'#8a754f'):'#55827d';
      rect(x-3,151,5,27,'#33444d');rect(x-2,153,3,20,'#667572');rect(x+trap.w-2,151,5,27,'#33444d');rect(x+trap.w-1,153,3,20,'#667572');
      rect(x-4,148,7,4,warning||active?'#d87a58':'#7b8b83');rect(x+trap.w-3,148,7,4,warning||active?'#d87a58':'#7b8b83');
      rect(x+3,164,trap.w-6,1,beam);
      if(warning||active)rect(x+3,161,trap.w-6,active?3:1,beam);
      rect(x+trap.w/2-31,140,62,8,'#101820');txt(active?'ЛАЗЕР АКТИВЕН':warning?'ЛАЗЕР ГОТОВ':'ЛАЗЕРНЫЕ ВОРОТА',x+trap.w/2,146,4,active?'#ff7169':warning?'#e8c777':'#78a49c','center');
    }
  }
  function drawTerminal(){
    const x=ARCHIVE_EXIT_X-camera;if(x<-90||x>W+70)return;
    rect(x+8,68,58,112,'#111923');rect(x+3,73,65,104,'#52616a');rect(x+7,77,57,96,'#263945');rect(x+13,83,45,51,'#121d28');
    rect(x+16,86,39,44,'#1c363e');rect(x+20,91,31,2,'#75aaa0');rect(x+20,98,26,2,'#688e8b');rect(x+20,105,31,2,'#688e8b');
    rect(x+24,115,23,9,'#385d5b');txt('ATS',x+35,122,6,'#bce2ba','center');
    rect(x+16,139,39,4,'#71817d');rect(x+18,145,35,22,'#384951');rect(x+20,148,31,12,'#1b2932');
    rect(x+32,160,8,6,'#d7c69d');rect(x+9,174,57,5,'#81867d');rect(x+21,179,33,3,'#536069');
    rect(x-3,128,9,22,'#6c7776');rect(x-1,131,5,14,'#c4b78f');rect(x+65,86,5,72,'#a99a7a');
    txt('АРХИВ → ATS',x+35,61,5,'#d5c9ae','center');
    if(Math.abs((player.x+player.w/2)-(ARCHIVE_EXIT_X+32))<52){rect(x-14,49,95,13,'#111a22');txt('E — ВОЙТИ В ATS',x+33,58,6,palette.lime,'center');}
  }
  function drawArchive(){
    ctx.save();ctx.globalAlpha=.38;drawArchiveBack();drawArchiveShelves();
    // Occasional service columns break the repeating shelving rhythm.
    for(let wx=Math.floor(camera/360)*360+250;wx<camera+W+360;wx+=360){const x=wx-camera;rect(x,25,13,132,'#263541');rect(x+3,27,7,126,'#475a63');rect(x+5,30,2,112,'#73817e');rect(x-4,146,21,4,'#88918a');rect(x-1,152,15,2,'#222d37');}ctx.restore();drawAtmosphere();
    for(const p of platforms)drawPlatform(p);
    drawArchivePits();drawArchiveTraps();
    drawShredder();drawStamp();drawTerminal();
    for(const b of breakables)if(b.hp>0)drawPaperStack(b);
    for(const bot of archiveBots)drawArchiveBot(bot);
    for(const bot of flyingBots)drawFlyingBot(bot);
  }
  function drawScreeningBack(){
    rect(0,0,W,H,'#080b1c');rect(0,22,W,140,'#171234');
    for(let i=0;i<5;i++){const x=12+i*74+Math.sin(time*.5+i)*3;rect(x,36,58,104,'#38205f');rect(x+4,40,50,96,'#0c102b');rect(x+7,44,44,28,'#201743');rect(x+10,48,38,2,'#75c8c3');rect(x+10,56,24,2,'#8370ce');rect(x+10,64,31,2,'#c77aa2');rect(x+7,79,44,3,'#514083');rect(x+10,87,5,31,'#75c8c3');rect(x+19,87,5,31,'#735be0');rect(x+31,88,19,2,'#75c8c3');rect(x+31,95,17,2,'#c77aa2');rect(x+31,102,19,2,'#c3dc70');rect(x+8,127,42,2,'#8878cf');}
    for(let x=24-Math.floor(time*10)%48;x<W;x+=48){rect(x,24,2,118,'#281b52');rect(x+3,24,1,118,'#17234b');}
    rect(0,FLOOR,W,3,'#75c8c3');rect(0,FLOOR+3,W,4,'#563d94');rect(0,FLOOR+7,W,H-FLOOR-7,'#0b1027');
    for(let gx=0;gx<W;gx+=32){rect(gx,FLOOR+11,1,H-FLOOR-11,'#252552');rect(gx+5,FLOOR+14,3,1,'#c77aa2');}
    for(const gapX of [291,589,888])fx('laser-grid',gapX-34,FLOOR-69,88,57,time*.65,{alpha:.76});
    rect(64,26,16,3,'#c3dc70');rect(303,26,38,3,'#c77aa2');
  }
  function drawHrQuestioner(bot){
    if(!bot.alive)return;const x=Math.round(bot.x-camera),y=FLOOR-25,step=Math.floor(time*9)%2;
    if(x<-32||x>W+32)return;
    if(bot.state==='aim'){
      const tx=(bot.targetX??player.x+player.w/2)-camera,ty=bot.targetY??player.y+player.h/2;
      line(x+10,y+8,tx,ty,'#b94e54');rect(tx-2,ty-2,5,1,'#f06c62');rect(tx,ty-4,1,5,'#f06c62');
    }
    rect(x+3,y+21,7,3,'#17212a');rect(x+12,y+21,7,3,'#17212a');
    rect(x+4+(step?1:0),y+18,5,4,'#38434b');rect(x+13-(step?1:0),y+18,5,4,'#303a44');
    rect(x+4,y+8,14,12,'#303f4b');rect(x+6,y+9,10,9,'#d2c5ab');rect(x+10,y+10,2,8,'#b54d50');
    rect(x+5,y+2,12,8,'#bb9b7a');rect(x+4,y,14,4,'#46353a');rect(x+6,y+4,2,2,'#17232b');rect(x+14,y+4,2,2,'#17232b');
    rect(x+1,y+9,5,9,'#d7cbb3');rect(x+16,y+10,5,7,'#d7cbb3');
    rect(x-1,y-13,25,10,bot.state==='aim'?'#542d38':'#17252e');rect(x+1,y-11,21,6,bot.state==='aim'?'#e85d5b':'#79bcb0');txt(bot.state==='aim'?'ПОЧЕМУ?':'HR',x+11,y-6,4,bot.state==='aim'?'#fff0d1':'#17232b','center');
  }
  function drawScreeningExit(){
    const x=SCREENING_EXIT_X-camera;if(x<-70||x>W+60)return;
    rect(x-5,74,55,104,'#3f525a');rect(x,79,45,99,'#111a23');rect(x+5,84,35,88,'#293c46');rect(x+9,91,27,48,'#182631');rect(x+13,97,19,2,'#d6c5a2');rect(x+13,104,19,2,'#85918b');rect(x+16,115,13,8,'#475e5f');txt('02',x+22,121,6,'#c3dc70','center');rect(x+19,147,7,3,'#d8c8a7');rect(x-8,175,61,5,'#929084');txt('HR-ДИРЕКТОР',x+22,69,5,'#d4c5a5','center');
    if(nearScreeningExit()){rect(x-20,50,88,13,'#101820');txt('E — К БОССУ',x+23,59,5,'#c3dc70','center');}
  }
  function drawScreening(){
    ctx.save();ctx.globalAlpha=.40;drawScreeningBack();ctx.restore();drawAtmosphere();for(const p of platforms)drawPlatform(p);drawArchivePits();
    for(let wx=90;wx<SCREENING_W;wx+=230){const x=wx-camera;if(x<-40||x>W+20)continue;rect(x,151,42,24,'#343f49');rect(x+4,155,34,12,'#1a2732');rect(x+8,158,24,2,'#79aaa2');rect(x+8,164,17,2,'#6c7f81');rect(x+12,175,18,4,'#78817d');}
    for(const block of breakables)if(block.hp>0)drawPaperStack(block);for(const bot of hrQuestioners)drawHrQuestioner(bot);drawScreeningExit();
  }
  function drawPortfolioBack(){
    rect(0,0,W,H,'#111321');rect(0,22,W,140,'#24213a');
    for(let wx=Math.floor(camera*.12/128)*128-128;wx<camera*.12+W+128;wx+=128){const x=wx-camera*.12;rect(x+6,37,110,91,'#36324d');rect(x+10,41,102,83,'#1e2133');rect(x+14,47,94,5,'#77748a');rect(x+16,58,34,52,'#34384c');rect(x+20,62,26,44,'#272c3e');for(let i=0;i<4;i++){rect(x+57,62+i*11,42-(i%2)*8,2,'#848394');rect(x+57,66+i*11,5,2,'#9da58e');}rect(x+14,115,94,2,'#58576b');}
    rect(0,FLOOR,W,3,'#81928e');rect(0,FLOOR+3,W,4,'#454d58');rect(0,FLOOR+7,W,H-FLOOR-7,'#171e2c');
    for(let x=0;x<W;x+=32){rect(x,FLOOR+11,1,H-FLOOR-11,'#343e49');rect(x+5,FLOOR+14,3,1,'#7c8580');}
  }
  function drawPortfolioCritic(bot){
    const x=Math.round(bot.x-camera),y=FLOOR-24,step=Math.floor(time*9)%2;if(x<-40||x>W+40)return;
    rect(x+2,y+21,7,3,'#17212a');rect(x+13,y+21,7,3,'#17212a');rect(x+4+(step?1:0),y+17,5,5,'#343943');rect(x+13-(step?1:0),y+17,5,5,'#343943');
    rect(x+2,y+7,19,12,'#46515c');rect(x+4,y+9,15,7,'#111b27');rect(x+6,y+10,10,3,'#9ba9a2');rect(x+14,y+10,2,2,'#d6dcad');rect(x+3,y+14,5,2,'#c77a8d');
    rect(x-7,y-10,43,9,'#25263a');rect(x-5,y-8,39,5,'#858292');txt('ПРАВКА',x+14,y-4,4,'#151722','center');
  }
  function drawPortfolioExit(){
    const x=PORTFOLIO_EXIT_X-camera;if(x<-70||x>W+60)return;
    rect(x-5,68,56,110,'#56636b');rect(x,73,46,105,'#111a23');rect(x+5,78,36,94,'#34404a');rect(x+9,88,28,47,'#18232f');
    rect(x+12,94,22,2,'#9ba9a2');rect(x+12,101,19,2,'#7d8d87');rect(x+12,108,22,2,'#a39c8b');rect(x+18,143,7,3,'#c7dc78');rect(x-8,175,62,5,'#87918a');
    txt('ЗАЩИТА',x+23,64,5,'#ded4c5','center');if(Math.abs((player.x+player.w/2)-(PORTFOLIO_EXIT_X+23))<50){rect(x-20,47,88,13,'#101820');txt('E — НА ЗАЩИТУ',x+23,56,5,'#c7dc78','center');}
  }
  function drawPortfolio(){
    ctx.save();ctx.globalAlpha=.36;drawPortfolioBack();ctx.restore();drawAtmosphere();for(const p of platforms)drawPlatform(p);drawArchivePits();
    for(let wx=112;wx<PORTFOLIO_W;wx+=235){const x=wx-camera;if(x<-50||x>W+50)continue;rect(x,149,57,27,'#343f49');rect(x+4,153,49,15,'#1a2732');rect(x+8,157,39,2,'#79aaa2');rect(x+8,163,30,2,'#8b849b');rect(x+15,174,26,4,'#78817d');}
    for(const bot of portfolioCritics)drawPortfolioCritic(bot);
    for(const q of hostileShots)if(q.kind==='bundle'&&q.falling){const x=q.x-camera;rect(x-4,FLOOR-7,34,2,'#c77a8d');txt('КЕЙС!',x+13,FLOOR-10,4,'#e5a0ac','center');}
    drawPortfolioExit();
  }

  function drawHero(){
    const p=player,x=Math.round(p.x-camera),y=Math.round(p.y);const step=Math.floor(p.run*9)%2;const hurt=p.hurt>0&&Math.floor(time*18)%2===0;
    ctx.save();if(p.crouching){const feet=y+23;ctx.translate(0,feet);ctx.scale(1,.62);ctx.translate(0,-feet);}
    if(hurt)rect(x-1,y-1,18,24,'#f3e7cd');
    const flip=p.face<0;ctx.save();if(flip){ctx.translate(x+p.w,0);ctx.scale(-1,1)}
    const ox=flip?0:x;
    // Shadow and boots.
    rect(ox+1,y+22,15,2,'#111a22');rect(ox+3+(step?2:0),y+20,5,3,'#262b38');rect(ox+9-(step?2:0),y+20,5,3,'#262b38');
    // Trouser legs, jacket and messenger-bag strap.
    rect(ox+4+(step?1:0),y+15,4,6,'#43404c');rect(ox+9-(step?1:0),y+15,4,6,'#353744');
    rect(ox+3,y+8,11,8,'#3f8585');rect(ox+4,y+9,8,5,'#5da8a1');rect(ox+2,y+11,3,4,'#285e68');
    rect(ox+11,y+11,4,5,'#a47a4f');rect(ox+12,y+12,3,3,'#d4b176');rect(ox+9,y+9,2,7,'#e0c391');
    // Face, fringe, headset and stylus.
    rect(ox+4,y+2,9,7,'#c99b75');rect(ox+3,y+1,10,4,'#392e32');rect(ox+5,y,7,2,'#514047');
    rect(ox+10,y+4,2,2,'#17232c');rect(ox+12,y+5,2,2,'#9b6354');rect(ox+2,y+3,2,4,'#536875');rect(ox+1,y+4,2,2,'#9ab1a5');
    ctx.restore();
    const handX=x+(p.face>0?12:4),handY=y+12;ctx.save();ctx.translate(handX,handY);ctx.rotate(p.aimAngle||0);
    rect(-1,-2,6,4,'#d6c49e');rect(3,-1,5,2,'#c3dc70');rect(7,-1,3,2,'#fff0c8');ctx.restore();
    ctx.restore();
  }
  function drawResumeShot(q){const x=q.x-camera,y=q.y;if(x<-40||x>W+40)return;if(q.kind==='orb'){rect(x-2,y-1,14,14,'#461b29');rect(x,y-2,10,13,'#d45257');rect(x+2,y,6,8,'#ffb46c');rect(x+3,y+2,3,3,'#fff0c8');rect(x-5,y+4,4,4,'#f08b68');return;}if(q.kind==='comment'){rect(x-2,y-2,q.w+4,q.h+4,'#27333a');rect(x,y,q.w,q.h,'#eee4d2');rect(x+3,y+3,q.w-6,1,'#8d7775');rect(x+3,y+6,q.w-10,1,'#948d82');txt(q.label||'МЕЛКО?',x+q.w/2,y+q.h-2,4,'#6b444b','center');return;}if(q.kind==='contract'){rect(x-2,y-2,q.w+4,q.h+4,'#443927');rect(x,y,q.w,q.h,'#d8c69b');rect(x+3,y+3,q.w-6,2,'#907a4f');rect(x+3,y+7,q.w-9,1,'#776c5d');rect(x+3,y+10,q.w-8,1,'#776c5d');txt('ГПХ',x+q.w/2,y+q.h-2,5,'#7b3538','center');return;}if(q.kind==='cursor'){ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(q.vy,q.vx));fx('bullet-tracer',-18,-4,36,8,time*1.8);ctx.restore();return;}if(q.kind==='question'){line(x-q.vx*.10,y-q.vy*.10,x-2,y+7,'#ff9b79');rect(x-3,y+2,q.w+6,14,'#f0d8b2');rect(x,y,q.w,13,'#f36663');rect(x+2,y+2,q.w-4,9,'#9f363e');txt('?',x+q.w/2,y+10,9,'#fff4d4','center');rect(x+4,y+13,5,4,'#e4d5ba');rect(x+q.w-8,y+13,4,3,'#c3dc70');return;}if(q.kind==='stamp'){rect(x,y,q.w,5,'#465862');rect(x+3,y+5,q.w-6,4,'#8d8a7d');rect(x+5,y+9,q.w-10,14,'#bb514d');rect(x+8,y+11,q.w-16,3,'#e6ba9b');txt('ОТКАЗ',x+q.w/2,y+19,4,'#401f2a','center');rect(x+10,y+23,q.w-20,2,'#5c686a');return;}rect(x-3,y+3,12,3,'#d9c8a7');rect(x,y,11,8,'#e7dbc5');rect(x+1,y+1,8,1,'#a8a08e');rect(x+1,y+3,6,1,'#8b8276');rect(x+1,y+5,7,1,'#a99b85');rect(x+7,y+1,2,2,'#b44d4d');rect(x+3,y+7,9,2,'#5f6b70');}
  function drawBullet(q){
    const x=Math.round(q.x-camera),y=Math.round(q.y);if(x<-32||x>W+32||y<-16||y>H+16)return;
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(q.vy,q.vx));
    if(!window.PixelFXAssets?.draw('bullet-tracer',ctx,time*1.7,-22,-5,44,10,{frame:Math.floor(time*18)%18})) {rect(-9,-1,5,2,'#75c8c3');rect(-4,-2,8,4,'#c3dc70');rect(-2,-1,5,2,'#fff0c8');}
    ctx.restore();
  }
  function drawParticles(){for(const p of particles){if(p.life<=0)continue;const x=Math.round(p.x-camera),y=Math.round(p.y);if(p.fx){fx('hit-spark',x-20,y-12,40,24,p.age*2);continue;}rect(x,y,p.size||2,p.size||2,p.color);}}
  function drawAim(){if(mode!=='play'||!mouse.aiming)return;const x=Math.round(mouse.aimX),y=Math.round(mouse.aimY);rect(x-6,y-1,4,2,'#c3dc70');rect(x+3,y-1,4,2,'#c3dc70');rect(x-1,y-6,2,4,'#c3dc70');rect(x-1,y+3,2,4,'#c3dc70');rect(x-1,y-1,2,2,'#fff0c8');}

  function drawCoreBack(){
    if(boss?.variant==='ceo'){
      rect(0,0,W,H,'#0c1018');rect(0,22,W,145,'#171d27');
      for(let i=0;i<5;i++){const x=10+i*76;rect(x,38,68,82,'#2a343b');rect(x+4,42,60,73,'#0d1720');for(let j=0;j<4;j++){rect(x+8+j*14,54+(j%2)*8,8,2,'#80908c');rect(x+8+j*14,66+(j%2)*8,8,2,'#596a70');}}
      rect(24,29,336,4,'#655a4a');rect(31,34,322,2,'#b39a6f');for(let x=42;x<350;x+=44)rect(x,37,2,16,'#c9aa73');
      rect(0,FLOOR,W,3,'#b8a174');rect(0,FLOOR+3,W,4,'#58636a');rect(0,FLOOR+7,W,H-FLOOR-7,'#101721');for(let x=0;x<W;x+=32){rect(x,FLOOR+10,1,H-FLOOR-10,'#34414a');rect(x+4,FLOOR+12,2,1,'#9b8a68');}
      fx('hologram',112,28,164,108,time*.35,{alpha:.16});return;
    }
    if(boss?.variant==='creative'){
      rect(0,0,W,H,'#10131d');rect(0,22,W,145,'#222331');
      for(let i=0;i<4;i++){const x=14+i*96;rect(x,40,76,93,'#393746');rect(x+4,44,68,85,'#171c29');rect(x+8,50,60,4,'#77747e');rect(x+9,61,18,26,'#333746');rect(x+32,62,34,2,'#85818d');rect(x+32,70,27,2,'#8d8793');rect(x+32,78,31,2,'#b17988');rect(x+9,94,56,2,'#7e7a88');rect(x+9,105,43,2,'#667d7e');rect(x+7,122,62,3,'#9a8b79');}
      rect(0,FLOOR,W,3,'#9aa89f');rect(0,FLOOR+3,W,4,'#55545b');rect(0,FLOOR+7,W,H-FLOOR-7,'#151b26');
      for(let x=0;x<W;x+=32){rect(x,FLOOR+10,1,H-FLOOR-10,'#363c46');rect(x+4,FLOOR+12,2,1,'#888782');}
      fx('hologram',145,28,96,94,time*.56,{alpha:.25});return;
    }
    rect(0,0,W,H,'#070817');rect(0,22,W,145,'#0e1028');
    for(let side of [0,322]){rect(side,36,62,134,'#242054');rect(side+5,41,51,124,'#11132d');rect(side+9,45,43,116,'#090b1d');for(let y=51;y<158;y+=24){rect(side+9,y,43,2,'#514c98');rect(side+13,y+5,4,11,'#27336e');rect(side+21,y+5,4,11,'#343b7b');rect(side+30,y+5,16,2,'#75c8c3');rect(side+30,y+10,12,2,'#c77aa2');rect(side+30,y+15,16,2,'#5361bb');}rect(side+27,29,10,4,'#c77aa2');rect(side+29,30,4,2,'#fff0a0');}
    rect(70,30,244,9,'#28215c');rect(74,34,236,2,'#75c8c3');
    for(let i=0;i<9;i++){const x=89+i*24;rect(x,43,8,1,'#514c98');rect(x+2,46,3,1,'#25264f');}
    for(let i=0;i<5;i++){const x=86+i*52;rect(x,24,2,12,'#34336e');rect(x-2,34,6,2,'#7562c2');rect(x+1,33,2,3,(i+Math.floor(time*2))%4===0?'#c77aa2':'#75c8c3');}
    rect(0,FLOOR,W,3,'#75c8c3');rect(0,FLOOR+3,W,4,'#3b2b74');rect(0,FLOOR+7,W,H-FLOOR-7,'#101a28');
    for(let x=0;x<W;x+=32){rect(x,FLOOR+10,1,H-FLOOR-10,'#252551');rect(x+4,FLOOR+12,2,1,'#c3dc70');rect(x+18,FLOOR+14,6,1,'#181c3b');}
    fx('energy-core',105,26,174,144,time*.48,{alpha:.45});
    rect(0,160,W,1,'#252451');rect(6,166,372,1,'#343263');
  }
  function drawArenaPlatform(p){const x=p.x;if(p.kind==='arena')return;const danger=p.kind==='crumble'&&p.timer>0&&Math.sin(time*28)>0;rect(x,p.y,p.w,8,danger?'#a74e55':'#5e6b70');rect(x+2,p.y-2,p.w-4,2,danger?'#e07a70':'#a69c84');rect(x+4,p.y+3,p.w-8,2,'#2e414b');for(let i=x+8;i<x+p.w-5;i+=12){rect(i,p.y-1,2,1,'#d2c4a5');rect(i+4,p.y+4,1,2,'#76827e');}if(danger){line(x+9,p.y+1,x+19,p.y+7,'#e9a08a');line(x+31,p.y+1,x+39,p.y+7,'#e9a08a');}}
  function drawBoss(){
    if(!boss)return;const b=boss,x=Math.round(b.x),bob=b.state==='tell'?Math.sin(time*18)*1:Math.sin(time*2.4)*1.5;const y=Math.round(b.y+bob);const hurtFlash=b.state==='hurt'&&Math.floor(time*24)%2===0;
    if(b.variant==='hr'){drawHrBoss(b,x,y,hurtFlash);return;}
    if(b.variant==='creative'){drawCreativeBoss(b,x,y,hurtFlash);return;}
    if(b.variant==='ceo'){drawCeoBoss(b,x,y,hurtFlash);return;}
    if(b.variant==='hr'&&b.jumping){const shadow=Math.max(.25,1-(82-b.y)/74);ctx.save();ctx.globalAlpha=shadow*.55;rect(x+13,FLOOR-3,84,2,'#070911');ctx.restore();}
    const scale=.76,cx=x+b.w/2,cy=y+b.h/2;ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);ctx.translate(-cx,-cy);
    // Bundled data cables curl out from the skull-server into the room.
    const cable='#344852',cableHi='#687a79';
    for(let i=0;i<4;i++){
      const side=i%2===0?-1:1,base=x+(side<0?18:94)+Math.floor(i/2)*7;
      rect(base,y+20,3,10,cable);rect(base+side*4,y+14,4,8,cableHi);rect(base+side*9,y+10,5,4,cable);
      rect(base+side*14,y+7,7,3,(i+Math.floor(time*3))%4===0?'#d85855':'#405b64');
      rect(base+side*19,y+3,6,4,cable);rect(base+side*23,y-3,4,8,cableHi);
    }
    // The CRT is built into a heavy, stepped skull-shaped server shell.
    poly([[x+27,y+8],[x+84,y+8],[x+101,y+21],[x+104,y+46],[x+96,y+59],[x+94,y+76],[x+82,y+91],[x+76,y+104],[x+36,y+104],[x+30,y+94],[x+17,y+88],[x+14,y+68],[x+7,y+58],[x+8,y+29],[x+17,y+15]],'#111923');
    poly([[x+28,y+9],[x+83,y+9],[x+98,y+21],[x+100,y+44],[x+92,y+57],[x+91,y+73],[x+80,y+86],[x+74,y+98],[x+38,y+98],[x+32,y+88],[x+19,y+82],[x+17,y+66],[x+11,y+56],[x+12,y+30],[x+20,y+17]],hurtFlash?'#e2d4b7':'#53646a');
    // Reinforced temple plates, bolts and an exposed lower jaw hinge.
    poly([[x+17,y+28],[x+27,y+23],[x+29,y+55],[x+21,y+67],[x+15,y+58]],'#263a44');
    poly([[x+92,y+27],[x+99,y+33],[x+97,y+56],[x+90,y+66],[x+87,y+55]],'#263a44');
    rect(x+18,y+32,4,3,'#e05955');rect(x+92,y+32,4,3,'#e05955');
    rect(x+20,y+63,7,4,'#81908a');rect(x+86,y+63,7,4,'#81908a');
    rect(x+18,y+70,7,5,'#9a8e78');rect(x+87,y+70,7,5,'#9a8e78');
    // Bright visor: an original scanning face, inset into the skull brow.
    rect(x+20,y+16,73,38,'#101720');rect(x+23,y+19,67,32,'#304850');rect(x+26,y+22,61,26,b.state==='defeat'?'#34282c':'#102b31');
    rect(x+28,y+24,57,1,'#587977');rect(x+29,y+46,55,1,'#466663');
    const eyeColor=b.state==='vulnerable'?'#c3dc70':b.state==='hurt'?'#fff0c8':b.state==='tell'||b.state==='attack'?'#ff625b':'#71e8d0';
    if(b.state==='defeat'){fx('emp-blast',x-74,y-52,260,232,Math.max(0,3.4-b.timer)*.75,{alpha:.8});
      rect(x+35,y+29,43,2,'#f5e4cf');txt('ATS: ОШИБКА',x+56,y+39,5,'#ff7770','center');rect(x+41,y+43,30,2,'#a83941');
    }else{
      // Eye slits narrow during attack wind-up, then flare during the open window.
      const blink=b.state==='tell'&&Math.floor(time*7)%5===0;
      const eyeY=y+(blink?36:b.state==='attack'?31:30);
      if(blink){rect(x+34,eyeY,16,2,eyeColor);rect(x+63,eyeY,16,2,eyeColor);}
      else{
        poly([[x+32,eyeY+2],[x+49,eyeY],[x+49,eyeY+9],[x+34,eyeY+9]],eyeColor);
        poly([[x+62,eyeY],[x+79,eyeY+2],[x+77,eyeY+9],[x+62,eyeY+9]],eyeColor);
        rect(x+39,eyeY+2,4,5,'#10202a');rect(x+68,eyeY+2,4,5,'#10202a');
        rect(x+40,eyeY+3,1,2,'#f0f2d0');rect(x+69,eyeY+3,1,2,'#f0f2d0');
      }
      rect(x+29,y+27,54,1,b.state==='tell'||b.state==='attack'?'#ff625b':'#65a69a');
      if(b.state==='vulnerable'){rect(x+29,y+48,54,2,'#c3dc70');txt('ОТКРЫТ — СТРЕЛЯЙ',x+56,y+46,4,'#c3dc70','center');}
      if(b.filter&&b.state==='tell')txt(b.filter.slice(0,18),x+56,y+46,3,'#f0d098','center');
      if(b.hp<=Math.ceil(b.maxHp/2)){rect(x+83,y+27,2,10,'#d94f54');rect(x+82,y+38,4,2,'#d94f54');rect(x+26,y+42,3,2,'#d94f54');}
    }
    // Tapered cheekbones and jaw make the machine read as a skull beneath its visor.
    poly([[x+27,y+55],[x+40,y+59],[x+38,y+69],[x+31,y+77],[x+23,y+73],[x+21,y+64]],'#d0c1a0');
    poly([[x+85,y+55],[x+91,y+64],[x+89,y+73],[x+81,y+77],[x+74,y+69],[x+72,y+59]],'#b7a98b');
    poly([[x+48,y+55],[x+64,y+55],[x+69,y+68],[x+61,y+75],[x+52,y+70]],'#101923');
    rect(x+54,y+59,4,3,'#080e15');rect(x+61,y+68,5,3,'#cfc09f');
    poly([[x+25,y+70],[x+34,y+76],[x+42,y+79],[x+76,y+79],[x+85,y+75],[x+92,y+69],[x+87,y+91],[x+76,y+99],[x+38,y+99],[x+29,y+92]],'#7f8984');
    rect(x+32,y+76,50,3,'#283a43');rect(x+36,y+79,42,3,'#879086');rect(x+40,y+82,34,2,'#d1c3a1');
    // Teeth are also cooling fins: bone-colored blocks over dark intake slots.
    rect(x+38,y+85,38,9,'#16232c');
    for(let i=0;i<6;i++){const tx=x+40+i*6;rect(tx,y+83,4,7,i%2?'#c9ba98':'#e1d4b6');rect(tx+1,y+89,2,3,'#667578');}
    rect(x+43,y+96,28,4,'#293b44');for(let i=0;i<5;i++)rect(x+47+i*5,y+97,2,2,'#75827b');
    // Exposed processor stack and résumé feeder form the neck of the skull.
    rect(x+73,y+52,37,12,'#344852');rect(x+102,y+48,13,17,'#59676a');rect(x+110,y+52,13,11,'#8d826c');
    rect(x+107,y+63,7,13,'#b8aa8c');rect(x+105,y+76,11,4,'#615c51');
    rect(x+28,y+101,56,7,'#202d36');rect(x+33,y+103,46,2,'#8d927f');
    for(let i=0;i<6;i++)rect(x+35+i*7,y+106,3,2,i%2?'#546d72':'#c0a775');
    // Servo arms and chunky hand plates frame the new silhouette.
    const armSwing=b.state==='tell'?Math.sin(time*16)*3:0;
    rect(x-1,y+58+armSwing,13,10,'#647175');rect(x-10,y+67+armSwing,14,8,'#384a53');rect(x-15,y+73+armSwing,9,8,'#9b8c73');rect(x-16,y+80+armSwing,11,4,'#5d686a');
    rect(x+b.w-12,y+58-armSwing,13,10,'#647175');rect(x+b.w-2,y+67-armSwing,14,8,'#384a53');rect(x+b.w+9,y+73-armSwing,9,8,'#9b8c73');rect(x+b.w+9,y+80-armSwing,11,4,'#5d686a');
    // Red warning indicators pulse only during telegraph/attack.
    rect(x+3,y+4,4,3,b.state==='tell'||b.state==='attack'?'#ed5b55':'#56625e');rect(x+b.w-7,y+4,4,3,b.state==='tell'||b.state==='attack'?'#ed5b55':'#56625e');
    if(b.hp>0){rect(104,36,6,2,'#d95752');rect(275,36,6,2,'#d95752');}
    ctx.restore();
  }
  function drawCreativeBoss(b,x,y,flash){
    const cx=x+b.w/2,cy=y+b.h/2;ctx.save();ctx.translate(cx,cy);ctx.scale(.76,.76);ctx.translate(-cx,-cy);
    const suit=flash?'#e9dfc8':'#303a43',skin=flash?'#fff1d3':'#c69a78',step=b.moving?Math.sin(time*10)*2.2:0;
    // A self-important art director: sculpted hair, round glasses, dark turtleneck and a giant red markup pen.
    poly([[x+27,y+49],[x+36,y+40],[x+77,y+40],[x+91,y+51],[x+98,y+83],[x+87,y+98],[x+25,y+98],[x+13,y+83],[x+17,y+59]],'#0d111b');
    poly([[x+29,y+50],[x+39,y+44],[x+75,y+44],[x+86,y+53],[x+92,y+80],[x+82,y+92],[x+31,y+92],[x+21,y+80]],suit);
    rect(x+43,y+37,24,12,'#705449');poly([[x+39,y+15],[x+71,y+15],[x+75,y+31],[x+68,y+42],[x+45,y+42],[x+36,y+30]],skin);
    poly([[x+36,y+20],[x+39,y+8],[x+52,y+4],[x+61,y+8],[x+75,y+5],[x+79,y+19],[x+70,y+16],[x+61,y+20],[x+52,y+15],[x+44,y+20]],'#312a35');
    rect(x+42,y+24,12,8,'#171d29');rect(x+59,y+24,12,8,'#171d29');rect(x+44,y+26,8,4,'#b8d1c6');rect(x+61,y+26,8,4,'#b8d1c6');rect(x+54,y+27,5,2,'#c77a8d');
    rect(x+49,y+35,20,2,'#594247');rect(x+53,y+36,12,2,'#ece1cb');
    rect(x+34,y+50,46,4,'#85848a');poly([[x+47,y+48],[x+66,y+48],[x+62,y+59],[x+57,y+76],[x+51,y+59]],'#c9c4ba');poly([[x+52,y+53],[x+61,y+53],[x+59,y+72],[x+56,y+78],[x+54,y+72]],'#687f83');
    rect(x+68,y+78,18,11,'#161d27');rect(x+71,y+80,12,2,'#c3dc70');txt('ART',x+77,y+87,4,'#c3dc70','center');
    rect(x+12,y+56+step,14,20,'#8a9294');rect(x+5,y+68+step,13,12,skin);rect(x+1,y+59+step,15,7,'#ddd3c1');
    rect(x+84,y+54-step,13,22,'#8a9294');rect(x+93,y+61-step,13,11,skin);rect(x+96,y+42,7,31,'#8f414b');rect(x+98,y+39,4,5,'#e8c5a4');
    rect(x+27,y+93+step,23,12,'#292f39');rect(x+63,y+93-step,23,12,'#292f39');rect(x+25,y+103+step,27,4,'#555d65');rect(x+61,y+103-step,28,4,'#555d65');
    if(b.state==='tell'||b.state==='attack'){rect(x+38,y+2,45,2,'#c77a8d');rect(x+43,y-2,33,2,'#e7b2aa');}
    if(b.state==='vulnerable'){rect(x+42,y+45,34,2,'#c3dc70');txt('СЛУШАЮ',x+59,y+52,4,'#c3dc70','center');}
    if(b.state==='defeat')fx('pixel-dissolve',x-78,y-34,265,188,Math.max(0,2.4-b.timer)*.9,{alpha:.72});
    if(b.phaseShield>0){ctx.save();ctx.globalAlpha=.68;ctx.strokeStyle='#c77a8d';ctx.lineWidth=2;ctx.strokeRect(x+5,y+2,102,109);ctx.restore();}
    ctx.restore();
  }
  function drawCeoBoss(b,x,y,flash){
    const cx=x+b.w/2,cy=y+b.h/2;ctx.save();ctx.translate(cx,cy);ctx.scale(.76,.76);ctx.translate(-cx,-cy);
    const suit=flash?'#e8ddc1':'#303943',skin=flash?'#fff0d2':'#bd9878',step=b.moving?Math.sin(time*13)*2:0;
    // A towering company chief: silver crown-like hair, severe face, armored suit and a golden contract.
    poly([[x+23,y+62],[x+39,y+48],[x+125,y+48],[x+147,y+65],[x+158,y+117],[x+144,y+137],[x+127,y+145],[x+39,y+145],[x+19,y+130],[x+8,y+99]],'#080d15');
    poly([[x+29,y+65],[x+43,y+54],[x+119,y+54],[x+139,y+68],[x+148,y+112],[x+136,y+128],[x+121,y+137],[x+44,y+137],[x+27,y+124],[x+17,y+98]],suit);
    rect(x+66,y+42,34,19,'#604c43');
    poly([[x+57,y+17],[x+105,y+17],[x+113,y+35],[x+105,y+51],[x+94,y+59],[x+68,y+55],[x+54,y+40]],skin);
    poly([[x+52,y+28],[x+48,y+14],[x+58,y+5],[x+68,y+9],[x+76,y+1],[x+87,y+8],[x+99,y+2],[x+111,y+14],[x+108,y+29],[x+101,y+20],[x+92,y+19],[x+84,y+14],[x+75,y+20],[x+64,y+17],[x+58,y+29]],'#9a9b91');
    rect(x+62,y+29,17,10,'#18232a');rect(x+88,y+29,17,10,'#18232a');rect(x+65,y+31,10,5,'#d6c7a5');rect(x+91,y+31,10,5,'#d6c7a5');rect(x+80,y+32,8,2,'#6f7d7e');rect(x+81,y+36,5,9,'#94735f');rect(x+69,y+47,29,3,'#604243');rect(x+75,y+49,18,2,'#e8d7bb');
    // Gold lapel pin and a stacked dossier glow brighter in each phase.
    poly([[x+68,y+63],[x+98,y+63],[x+91,y+79],[x+84,y+102],[x+76,y+79]],'#c4b69a');poly([[x+77,y+69],[x+92,y+69],[x+88,y+95],[x+84,y+103],[x+80,y+95]],'#70505f');
    rect(x+105,y+105,27,20,'#101a22');rect(x+109,y+109,19,2,'#d6bd79');txt('CEO',x+118,y+119,6,'#e4cb88','center');
    // Contract portfolio in one hand; the other wields an oversized signing pen.
    rect(x+2,y+72+step,20,31,'#77858a');rect(x-6,y+91+step,26,22,skin);rect(x-12,y+84+step,30,16,'#e0d6c5');rect(x-8,y+88+step,21,2,'#9d4d50');rect(x-8,y+94+step,16,2,'#91897e');rect(x-8,y+100+step,18,2,'#b39a6f');
    rect(x+139,y+68-step,15,35,'#77858a');rect(x+149,y+89-step,15,24,skin);rect(x+151,y+43,9,59,'#8b454d');rect(x+153,y+37,5,8,'#e8cc91');
    rect(x+40,y+138+step,35,11,'#202933');rect(x+91,y+138-step,35,11,'#202933');rect(x+35,y+146+step,44,5,'#59636a');rect(x+87,y+146-step,45,5,'#59636a');
    if(b.phase===1){rect(x+51,y+59,62,2,'#d3ad71');txt('ПЕРЕСМОТР УСЛОВИЙ',x+82,y+74,5,'#dbc38a','center');}
    if(b.phase>=2){rect(x+51,y+59,62,3,'#d95758');txt('СОВЕТ ДИРЕКТОРОВ',x+82,y+74,5,'#f08e83','center');}
    if(b.state==='tell'||b.state==='attack'){rect(x+48,y+1,67,3,'#d6b36d');rect(x+57,y-4,49,2,'#f1d18a');}
    if(b.state==='vulnerable'){rect(x+59,y+61,52,2,'#c3dc70');txt('ПОДПИШИ',x+85,y+69,5,'#c3dc70','center');}
    if(b.phaseShield>0){ctx.save();ctx.globalAlpha=.72;ctx.strokeStyle='#e0bf79';ctx.lineWidth=3;ctx.strokeRect(x+2,y-3,160,154);ctx.restore();}
    if(b.state==='defeat')fx('emp-blast',x-50,y-20,260,210,Math.max(0,3.4-b.timer)*.8,{alpha:.86});
    ctx.restore();
  }
  function drawHrBoss(b,x,y,flash){
    const cx=x+b.w/2,cy=y+b.h/2;ctx.save();ctx.translate(cx,cy);ctx.scale(.76,.76);ctx.translate(-cx,-cy);
    const stride=b.jumping?-3:Math.sin(time*11)*(b.walking?2.5:0);
    const suit=flash?'#e2d4b7':'#384953',skin=flash?'#fff0d1':'#c59a78';
    // A severe HR director with tied-back hair, glasses, interview tablet and refusal stamp.
    poly([[x+17,y+47],[x+30,y+39],[x+82,y+39],[x+98,y+48],[x+105,y+76],[x+94,y+88],[x+88,y+103],[x+25,y+103],[x+18,y+87],[x+7,y+77]],'#111923');
    poly([[x+20,y+49],[x+33,y+43],[x+79,y+43],[x+93,y+50],[x+98,y+74],[x+88,y+83],[x+82,y+98],[x+30,y+98],[x+25,y+83],[x+14,y+75]],suit);
    // Tied-back hair frames a calm, sharp-eyed face.
    rect(x+47,y+34,20,13,'#5b4b45');rect(x+37,y+7,39,36,'#302630');
    poly([[x+40,y+19],[x+38,y+12],[x+45,y+5],[x+63,y+4],[x+74,y+10],[x+77,y+20],[x+76,y+34],[x+71,y+42],[x+68,y+21],[x+66,y+12],[x+47,y+12],[x+44,y+31],[x+42,y+41],[x+37,y+34]],'#46313a');rect(x+70,y+8,11,5,'#5a3940');rect(x+77,y+10,7,8,'#46313a');rect(x+39,y+20,4,8,'#46313a');
    poly([[x+41,y+13],[x+72,y+13],[x+75,y+25],[x+70,y+38],[x+61,y+43],[x+47,y+39],[x+39,y+29]],skin);
    rect(x+42,y+22,12,8,'#7b8990');rect(x+60,y+22,12,8,'#7b8990');rect(x+44,y+24,8,4,'#171f28');rect(x+62,y+24,8,4,'#171f28');rect(x+54,y+25,6,2,'#7b8990');rect(x+56,y+27,4,6,'#a27863');rect(x+41,y+27,2,3,'#d2ad92');
    rect(x+50,y+36,18,2,'#76494a');rect(x+54,y+38,10,1,'#e4c8b1');
    rect(x+31,y+48,50,5,'#87918a');poly([[x+48,y+47],[x+67,y+47],[x+62,y+59],[x+57,y+78],[x+52,y+59]],'#b8d4cf');poly([[x+52,y+54],[x+62,y+54],[x+60,y+67],[x+57,y+71],[x+54,y+67]],'#744c64');rect(x+55,y+70,4,5,'#b84c53');rect(x+40,y+28,2,3,'#d5b37d');rect(x+72,y+28,2,3,'#d5b37d');
    rect(x+65,y+78,21,11,'#17232c');rect(x+68,y+80,15,2,'#c3dc70');txt('HR',x+75,y+86,4,'#c3dc70','center');
    // One hand grips an interview sheet; the other raises the familiar red refusal stamp.
    rect(x+10,y+53+stride,13,20,'#b9c0b6');rect(x+3,y+67+stride,13,15,'#c59a78');rect(x-2,y+58+stride,17,9,'#e4d5ba');rect(x+1,y+60+stride,11,2,'#a94e52');rect(x+2,y+64+stride,9,1,'#78827d');
    rect(x+88,y+51-stride,13,21,'#b9c0b6');rect(x+97,y+63-stride,10,14,'#c59a78');rect(x+94,y+49,19,8,'#574747');rect(x+98,y+42,11,8,'#bc4e53');rect(x+101,y+44,5,2,'#f2d2ad');
    rect(x+27,y+99+stride,22,9,'#26343c');rect(x+63,y+99-stride,22,9,'#26343c');rect(x+25,y+106+stride,25,4,'#59646a');rect(x+62,y+106-stride,27,4,'#59646a');
    if(b.state==='tell'||b.state==='attack'){rect(x+36,y+4,50,2,'#dd5a55');rect(x+40,y+1,42,2,'#ed776b');}
    if(b.state==='vulnerable'){rect(x+44,y+45,33,2,'#c3dc70');}
    if(b.state==='defeat'){fx('emp-blast',x-74,y-52,260,232,Math.max(0,3.4-b.timer)*.75,{alpha:.8});rect(x+42,y+28,32,3,'#f0776e');}
    ctx.restore();
  }
  function drawBossWarnings(){
    if(!boss)return;const b=boss;
    if(b.state==='tell'&&b.attack==='questionBurst'){for(let i=0;i<3;i++){const px=b.x+(b.x>W/2?8:b.w-18),py=b.y+35+i*8;rect(px-3,py-3,10,8,'#bd4b50');txt('?',px+2,py+3,5,'#fff0d1','center');}}
    if(b.state==='tell'&&b.attack==='deadlineRain')for(const x of b.warningXs){rect(x-10,FLOOR-3,20,2,'#e05851');rect(x-4,122,1,50,'#82434a');rect(x+4,122,1,50,'#82434a');}
    if(b.state==='tell'&&b.attack==='hrScan'){rect(18,150,W-36,13,'#4b343a');for(let x=20;x<W-20;x+=12)rect(x,151,2,10,'#a8474c');}
    if(b.state==='tell'&&b.attack==='ceoRain')for(const x of b.warningXs){rect(x-12,FLOOR-3,24,2,'#d6b66f');rect(x-5,117,1,55,'#817049');rect(x+5,117,1,55,'#817049');txt('ГПХ',x,111,4,'#e4cc91','center');}
    if(b.state==='tell'&&b.attack==='ceoBeam'){rect(18,150,W-36,13,'#3d3024');for(let x=20;x<W-20;x+=12)rect(x,151,2,10,'#b99b5c');}
    if(b.state==='tell'&&b.attack==='ceoSlam'){rect(b.targetX-23,FLOOR-3,46,2,'#e0bf79');txt('ПОДПИСЬ',b.targetX,FLOOR-8,5,'#e8cf94','center');}
    if(b.state==='tell'&&b.attack==='paperRain')for(const x of b.warningXs){rect(x-10,FLOOR-3,20,2,'#e05851');rect(x-4,130,1,42,'#82434a');rect(x+4,130,1,42,'#82434a');}
    if(b.state==='tell'&&(b.attack==='resumeRain'||b.attack==='caseRain'))for(const x of b.warningXs){rect(x-12,FLOOR-3,24,2,'#c77a8d');rect(x-5,117,1,55,'#8f5d74');rect(x+5,117,1,55,'#8f5d74');txt('КЕЙС',x,111,4,'#e6a7b5','center');}
    if(b.state==='tell'&&b.attack==='stamp'){rect(b.targetX-21,FLOOR-2,42,2,'#e05851');txt('ОТКАЗ',b.targetX,FLOOR-8,6,'#ef7770','center');}
    if(b.state==='tell'&&(b.attack==='filter'||b.attack==='reviewBeam')){rect(18,150,W-36,13,'#4b343a');for(let x=20;x<W-20;x+=12)rect(x,151,2,10,b.attack==='reviewBeam'?'#c77a8d':'#a8474c');}
    if(b.variant==='creative'&&b.floorTrapWarning>0){rect(b.floorTrapX-29,FLOOR-5,58,3,'#e0a05f');rect(b.floorTrapX-22,FLOOR-15,2,10,'#e0a05f');rect(b.floorTrapX+20,FLOOR-15,2,10,'#e0a05f');txt('ПОЛ ПРОШИВАЕТ',b.floorTrapX,FLOOR-20,5,'#f0bd79','center');}
    if(b.variant==='creative'&&b.floorTrapActive>0){rect(b.floorTrapX-31,FLOOR-18,62,18,'#9c414b');for(let x=b.floorTrapX-26;x<b.floorTrapX+25;x+=10)poly([[x,FLOOR-18],[x+5,FLOOR-30],[x+10,FLOOR-18]],'#e87970');}
    if(b.state==='attack'&&b.attack==='stamp'){rect(b.targetX-20,112,40,64,'#5d4243');rect(b.targetX-16,119,32,54,'#8e524e');rect(b.targetX-11,154,22,12,'#d4b69a');txt('ОТКАЗ',b.targetX,163,6,'#4a242c','center');}
    if(b.state==='attack'&&b.attack==='filter'){rect(18,150,W-36,13,'#c94e50');rect(18,153,W-36,3,'#f4d3a0');for(let x=20;x<W-20;x+=16)rect(x,149,2,16,'#f58168');}
    if(b.state==='attack'&&(b.attack==='hrScan'||b.attack==='reviewBeam')){rect(18,150,W-36,13,b.attack==='reviewBeam'?'#bd6679':'#bc4d56');rect(18,153,W-36,3,'#f5d2a2');for(let x=20;x<W-20;x+=16)rect(x,149,2,16,b.attack==='reviewBeam'?'#e9a3a0':'#f58168');}
    if(b.state==='attack'&&b.attack==='ceoBeam'){rect(18,150,W-36,13,'#b59555');rect(18,153,W-36,3,'#fff0bc');for(let x=20;x<W-20;x+=16)rect(x,149,2,16,'#e2c477');}
    if(b.state==='attack'&&b.attack==='ceoSlam'){rect(b.targetX-22,105,44,70,'#443927');rect(b.targetX-17,111,34,61,'#d8c69b');rect(b.targetX-13,120,26,3,'#92794a');txt('ГПХ',b.targetX,153,6,'#75393c','center');}
  }
  function drawCore(){
    ctx.save();ctx.globalAlpha=.40;drawCoreBack();ctx.restore();drawAtmosphere();rect(0,FLOOR,W,2,'#75c8c3');for(const p of platforms)drawArenaPlatform(p);drawBossWarnings();drawBoss();
  }
  function drawElevator(){
    rect(0,0,W,H,'#16212c');rect(0,22,W,156,'#202e39');
    for(let x=18;x<W;x+=48){rect(x,36,22,130,'#283b46');rect(x+3,40,16,122,'#192630');rect(x+7,46,8,2,'#75827b');rect(x+7,54,8,2,'#4d6870');}
    rect(118,34,148,143,'#3a4c53');rect(126,39,132,135,'#111a23');rect(133,45,59,122,'#5f6f70');rect(193,45,59,122,'#596b6d');
    rect(191,45,3,122,'#c4b391');rect(174,104,6,2,'#e8d4a7');rect(204,104,6,2,'#e8d4a7');
    rect(154,76,76,21,'#17232d');txt('HR  ↑',192,90,9,'#c3dc70','center');
    rect(145,110,94,20,'#293b44');for(let i=0;i<6;i++)rect(152+i*13,115,7,8,['#788078','#ab9d80','#657879','#908171','#6d7d7b','#b6a786'][i]);
    rect(0,FLOOR,W,H-FLOOR,'#17222c');rect(0,FLOOR,W,3,'#9d927b');
  }
  function drawHud(){
    rect(0,0,W,22,'#09091e');rect(0,21,W,2,'#75c8c3');rect(0,0,4,22,'#c77aa2');
    txt(room==='archive'?'ЭТАП 01/03 · ОТКЛИК':room==='core'?coreStage===4?'ФИНАЛ · РУКОВОДИТЕЛЬ':`ЭТАП 0${coreStage}/03 · ${coreStage===1?'ЯДРО ATS':coreStage===2?'БОСС HR':'БОСС ПОРТФОЛИО'}`:room==='screening'?'ЭТАП 02/03 · HR-СКРИНИНГ':room==='portfolio'?'ЭТАП 03/03 · ПРОВЕРКА ПОРТФОЛИО':'ЭТАП 03/03 · ПРОЙДЕН',8,14,8,palette.light);
    const heartCapacity=START_HEARTS;
    for(let i=0;i<heartCapacity;i++)txt('♥',W-54+i*15,15,10,i<player.hp?'#e45b5c':'#60434a');
    if(room==='core'&&boss){rect(132,8,116,7,'#303943');rect(134,10,112,3,'#60474b');rect(134,10,112*Math.max(0,boss.hp/boss.maxHp),3,boss.variant==='creative'?'#c77a8d':boss.variant==='ceo'?'#d6b66f':'#dd5a55');txt(boss.variant==='hr'?'HR':boss.variant==='creative'?(boss.phase>=2?'ART · II':'ART'):boss.variant==='ceo'?`CEO · ${boss.phase>=2?'III':boss.phase===1?'II':'I'}`:'ATS',190,20,5,'#d1c3a8','center');}
    if(room==='archive'){
      if(tutorialStep<3){rect(8,29,187,15,'#101720');txt(['A / D — ДВИЖЕНИЕ','SPACE — ПРЫЖОК ЧЕРЕЗ ЯМУ','МЫШЬ — ПРИЦЕЛ, ЛКМ — ВЫСТРЕЛ'][tutorialStep],13,39,7,'#e6decd');}
      else if(tutorialStep===3){rect(8,29,197,15,'#101720');txt('E — ВОЙТИ В ATS У ТЕРМИНАЛА',13,39,7,'#c3dc70');}
      else {rect(8,29,174,15,'#101720');txt('ЦЕЛЬ: доберись до терминала',13,39,7,'#c3dc70');}
    }
    if(room==='screening'&&nearScreeningExit()){rect(92,29,200,15,'#101720');txt('E — ВОЙТИ К HR-БОССУ',192,39,7,'#c3dc70','center');}
    if(room==='portfolio'&&Math.abs((player.x+player.w/2)-(PORTFOLIO_EXIT_X+23))<50){rect(92,29,200,15,'#101720');txt('E — НА ЗАЩИТУ',192,39,7,'#c3dc70','center');}
    if(room==='core'&&boss&&boss.state==='tell'){
      const msg=boss.attack==='orbVolley'?'АРГУМЕНТЫ HR: ВХОДЯЩИЕ ШАРЫ':boss.attack==='resumeRain'?'СРОЧНАЯ ПРАВКА: РЕЗЮМЕ СВЕРХУ':boss.attack==='questionBurst'?'МЫ ОДНА СЕМЬЯ — ПОЧЕМУ ВЫ ПОДХОДИТЕ?':boss.attack==='deadlineRain'?'НЕБОЛЬШОЕ ТЕСТОВОЕ: ДОКУМЕНТЫ СВЕРХУ':boss.attack==='hrScan'?'МЫ ВЫБРАЛИ ДРУГОГО КАНДИДАТА':boss.attack==='commentSpread'?'ФИДБЭК БЕЗ ФИЛЬТРА':boss.attack==='markupVolley'?'ПРАВКИ КРАСНЫМ МАРКЕРОМ':boss.attack==='caseRain'?'КЕЙСЫ НА ДОРАБОТКУ':boss.attack==='reviewBeam'?'ВЫРОВНЯЙТЕ ВСЕ ОТСТУПЫ':boss.attack==='volley'?'ФИЛЬТР: формат резюме не тот':boss.attack==='paperRain'?boss.filter:boss.attack==='stamp'?'ПОДПИСЬ ОТКАЗА ГОТОВА':'АБСУРДНЫЙ ФИЛЬТР: '+boss.filter;
      const displayedMsg=boss.variant==='ceo'?(boss.attack==='ceoVolley'?'ПЛАН ПО УВОЛЬНЕНИЯМ УТВЕРЖДЁН':boss.attack==='ceoRain'?'УСЛОВИЯ ОФФЕРА СВЕРХУ':boss.attack==='ceoBeam'?'ПОСЛЕ РАБОТЫ ТОЖЕ РАБОТА':'ПОДПИШИТЕ НЕ ЧИТАЯ'):msg;
      rect(71,27,242,15,boss.variant==='ceo'?'#211d17':'#101720');txt(displayedMsg,192,37,6,boss.variant==='ceo'?'#e4cc91':boss.attack==='stamp'?'#ef8e7e':'#ded1b5','center');
      if(boss.attack==='filter'||boss.attack==='hrScan'||boss.attack==='reviewBeam'||boss.attack==='ceoBeam'){rect(111,44,162,9,'#101720');txt('ALT — ПРИСЕСТЬ ПОД ЛУЧОМ',192,51,5,'#c3dc70','center');}
    }
    if(room==='core'&&boss?.variant==='creative'&&boss.phaseBanner>0){rect(83,55,218,13,'#311d29');txt('ФАЗА 02 · ЗАЩИТА 3 СЕК',192,64,6,'#f0a2ad','center');}
    if(room==='core'&&boss?.variant==='ceo'&&boss.phaseBanner>0){rect(77,55,230,13,'#30281b');txt(boss.phase===1?'РУКОВОДИТЕЛЬ ПОВЫШАЕТ СТАВКИ':'СОВЕТ ДИРЕКТОРОВ ВМЕШАЛСЯ',192,64,6,'#e4cc91','center');}
  }
  function drawFrame(){
    ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;rect(0,0,VIEW_W,VIEW_H,'#11131b');
    const scaleX=VIEW_W/W,scaleY=VIEW_H/H;ctx.setTransform(scaleX,0,0,scaleY,0,0);
    if(room==='archive')drawArchive();else if(room==='core')drawCore();else if(room==='screening')drawScreening();else if(room==='portfolio')drawPortfolio();else drawElevator();
    if(player&&room!=='elevator')drawHero();
    for(const q of hostileShots)drawResumeShot(q);for(const q of playerShots)drawBullet(q);drawParticles();
    if(player)drawHud();drawAim();
    if(mode==='intro'){rect(74,77,236,40,'#111a22');rect(78,81,228,32,'#25343c');txt(boss?.variant==='hr'?'HR-ДИРЕКТОР НА ЛИНИИ':boss?.variant==='creative'?'КРЕАТИВНЫЙ ДИРЕКТОР':boss?.variant==='ceo'?'РУКОВОДИТЕЛЬ КОМПАНИИ':'КАНДИДАТ ЗАГРУЖЕН',192,94,boss?.variant==='hr'?3.5:7,'#d8c6a2','center');txt(boss?.variant==='hr'?'СОБЕСЕДОВАНИЕ НАЧАТО':boss?.variant==='creative'?'ЗАЩИТА ПОРТФОЛИО НАЧАТА':boss?.variant==='ceo'?'ПОСЛЕДНИЙ РАУНД':'АВТОМАТИЧЕСКИЙ ОТБОР НАЧАТ',192,106,6,'#e66a5f','center');}
    if(mode==='transition')drawDissolve();
    if(room==='core'&&boss&&boss.state==='defeat'){
      if(Math.floor(time*12)%3===0)rect(0,24,W,H-24,'rgba(205,76,68,.08)');
      for(let i=0;i<8;i++){const seed=(Math.floor(time*7)+i*23)%140;rect(boss.x+Math.sin(seed)*65,boss.y+Math.cos(seed*3)*50,1+(i%3),1,'#ee7363');}
    }
  }
  function drawDissolve(){
    const progress=1-transitionTime/(nextRoom==='ceoBoss'?.9:.72),name=nextRoom==='stage2Boss'||nextRoom==='ceoBoss'?'pixel-dissolve':'glitch-wipe';
    fx(name,0,0,W,H,progress*(name==='pixel-dissolve'?2.2:1.8),{alpha:.94});
    if(transitionTime>.32){rect(48,91,288,29,'#0b0b20');rect(48,91,288,2,'#75c8c3');rect(48,118,288,2,'#c77aa2');txt(nextRoom==='core'?'ПЕРЕХОД В ЯДРО ATS':nextRoom==='screening'?'ЛИФТ ДОСТАВЛЯЕТ В HR-ОТДЕЛ':nextRoom==='stage2Boss'?'ПЕРЕХОД В ЗАЛ HR-БОССА · ЭТАП 02':nextRoom==='ceoBoss'?'РУКОВОДИТЕЛЬ ЖДЁТ В СВОЁМ КАБИНЕТЕ':'СИСТЕМА ПЕРЕЗАПУСКАЕТСЯ',192,109,7,'#c3dc70','center');}
  }

  function supportSurfaces(){return platforms.filter(p=>p.active!==false).concat(breakables.filter(b=>b.hp>0).map(b=>({x:b.x,y:b.y,w:b.w,h:b.h,kind:'paperBlock',source:b})));}
  function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function worldWidth(){return room==='archive'?ARCHIVE_W:room==='screening'?SCREENING_W:room==='portfolio'?PORTFOLIO_W:W;}
  function bossBounds(){return boss?.variant==='ceo'?{x:boss.x+15,y:boss.y+20,w:134,h:125}:boss?.variant==='hr'||boss?.variant==='creative'?{x:boss.x+17,y:boss.y+19,w:82,h:77}:{x:boss.x+1,y:boss.y+10,w:115,h:86};}
  function nearTerminal(){return room==='archive'&&Math.abs((player.x+player.w/2)-(ARCHIVE_EXIT_X+32))<54;}
  function nearScreeningExit(){return room==='screening'&&Math.abs((player.x+player.w/2)-(SCREENING_EXIT_X+22))<52;}
  function nearPortfolioExit(){return room==='portfolio'&&Math.abs((player.x+player.w/2)-(PORTFOLIO_EXIT_X+23))<50;}
  function recordTutorial(action){const expected=['move','jump','shoot','interact'][tutorialStep];if(action===expected&&tutorialStep<4)tutorialStep++;}
  function hurt(){if(player.inv>0||mode!=='play')return;player.hp--;hearts=player.hp;fx('hit-flash',player.x-camera-9,player.y-5,34,32,0);player.inv=1.05;player.hurt=.28;player.vy=-86;player.vx=-player.face*38;hitsTaken++;tone(138,.13,'sawtooth');for(let i=0;i<10;i++)particles.push({x:player.x+8,y:player.y+12,vx:(Math.random()-.5)*65,vy:(Math.random()-.7)*55,life:.36,size:i%3===0?3:2,color:i%2?'#e95c56':'#eee0c7'});if(player.hp<=0)fail();}
  function fail(){
    deaths++;mode='fail';const lostBoss=room==='core'&&coreStage===2,creativeBoss=room==='core'&&coreStage===3,ceoBoss=room==='core'&&coreStage===4;tone(120,.28,'sawtooth');
    const reason=lostBoss?'Вы получили отказ. Попробуйте еще раз, пройдя этап отбора.':creativeBoss?'Креативный директор отправил портфолио на бесконечную доработку.':ceoBoss?'Руководитель компании предложил обсудить оффер после испытательного срока.':room==='archive'?'Резюме потерялось среди остальных.':room==='screening'?'Вы сказали «не знаю» на вопрос «расскажите о себе».':room==='portfolio'?'Редактура затянулась, а дедлайн не ждёт.':'Компьютер предпочёл кандидата с опытом работы на этом компьютере.';
    panel(`<p class="eyebrow ${lostBoss?'hr-director-label':''}">${room==='archive'?'АРХИВ РЕЗЮМЕ':room==='screening'?'HR-СКРИНИНГ':room==='portfolio'?'ПОРТФОЛИО':boss?.variant==='hr'?'HR-ДИРЕКТОР':creativeBoss?'КРЕАТИВНЫЙ ДИРЕКТОР':ceoBoss?'РУКОВОДИТЕЛЬ КОМПАНИИ':'ЯДРО ATS'}</p><h2>ВАМ ОТКАЗАНО</h2><p>${reason}</p><button class="primary" id="retry">${lostBoss?'СНОВА HR-СКРИНИНГ':creativeBoss?'СНОВА К ПОРТФОЛИО':ceoBoss?'ЕЩЁ РАУНД С CEO':'ПОВТОРИТЬ ЗАЛ'}&nbsp; ↻</button>`);
    document.getElementById('retry').onclick=()=>{if(lostBoss){hearts=START_HEARTS;setupScreening();startTime=performance.now();}else if(creativeBoss){hearts=START_HEARTS;setupPortfolio();startTime=performance.now();}else restartRoom();overlay.innerHTML='';};
  }
  function spawnBurst(x,y,color='#f1dfb5',amount=8){particles.push({x,y,vx:0,vy:0,life:.48,age:0,fx:true});for(let i=0;i<amount;i++){const angle=(Math.PI*2*i/amount)+Math.random()*.3,speed=18+Math.random()*52;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-12,life:.28+Math.random()*.34,color,size:i%3===0?3:2});}}
  function shoot(){
    if(mode!=='play'||player.shootCooldown>0)return;player.shootCooldown=.23;tone(680,.035,'square');recordTutorial('shoot');
    const sx=player.x+player.w/2,sy=player.y+player.h/2;
    const targetX=mouse.aiming?camera+mouse.aimX:sx+(player.face||1)*120;
    const targetY=mouse.aiming?mouse.aimY:sy;
    const dx=targetX-sx,dy=targetY-sy,len=Math.max(1,Math.hypot(dx,dy));
    const vx=dx/len*360,vy=dy/len*360;player.face=dx<0?-1:1;player.aimAngle=Math.atan2(vy,vx);
    playerShots.push({x:sx+dx/len*12,y:sy+dy/len*12,vx,vy,life:1.5,damage:1,alive:true});
  }
  function damageBoss(amount){if(!boss||boss.state!=='vulnerable'||boss.hitCooldown>0||boss.phaseShield>0)return;boss.hp=Math.max(0,boss.hp-amount);boss.flash=.18;boss.hitCooldown=.18;boss.vulnLeft=boss.timer;boss.state='hurt';boss.timer=.2;tone(boss.hp===0?160:520,.1,boss.hp===0?'sawtooth':'square');spawnBurst(boss.x+18,boss.y+58,'#f4d49d',11);if(boss.hp<=0){boss.state='defeat';boss.timer=3.4;hostileShots=[];mouse.left=false;}}
  function moveAndCollide(dt){
    const p=player;const oldX=p.x;const wantCrouch=(keys.AltLeft||keys.AltRight)&&p.ground;
    if(wantCrouch&&!p.crouching){p.y+=9;p.h=14;}else if(!wantCrouch&&p.crouching){p.y-=9;p.h=23;}p.crouching=wantCrouch;
    const dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);p.vx=dx*94;if(dx)p.face=dx;p.run+=Math.abs(p.vx)*dt*.035;
    p.x=Math.max(0,Math.min(worldWidth()-p.w,p.x+p.vx*dt));
    if(room==='archive'||room==='screening')for(const b of breakables)if(b.hp>0&&p.y+p.h>b.y+2&&p.y<b.y+b.h&&overlaps(p,b)){p.x=dx>0?b.x-p.w:b.x+b.w;}
    if(room==='archive'&&tutorialStep===0){moveTally+=Math.abs(p.x-oldX);if(moveTally>26)recordTutorial('move');}
    if(p.ground)p.coyote=.11;else p.coyote=Math.max(0,p.coyote-dt);
    p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
    if(p.jumpBuffer>0&&p.coyote>0){p.vy=-194;p.jumpBuffer=0;p.ground=false;p.coyote=0;p.standing=null;recordTutorial('jump');tone(370,.07);}
    const oldBottom=p.y+p.h;p.vy=Math.min(270,p.vy+440*dt);p.y+=p.vy*dt;p.ground=false;p.standing=null;
    if(p.vy>=0){let land=null;for(const s of supportSurfaces()){if(oldBottom<=s.y+2&&p.y+p.h>=s.y&&p.x+p.w>s.x+2&&p.x<s.x+s.w-2){if(!land||s.y<land.y)land=s;}}if(land){p.y=land.y-p.h;p.vy=0;p.ground=true;p.standing=land;if(land.kind==='crumble'&&land.timer===0)land.timer=.72;}}
    if(room==='core'&&p.y+p.h>=FLOOR){p.y=FLOOR-p.h;p.vy=0;p.ground=true;}
    if(p.y<24){p.y=24;p.vy=Math.max(0,p.vy);}
    if(p.y>H+36){hurt();p.x=Math.max(20,Math.min(worldWidth()-p.w,p.x-42));p.y=FLOOR-p.h;p.vy=0;p.ground=true;}
    if(room==='archive'||room==='screening'||room==='portfolio'){
      for(const plat of platforms)if(plat.kind==='crumble'&&plat.timer>0){plat.timer-=dt;if(plat.timer<=0)plat.active=false;}
      if(p.standing?.kind==='conveyor')p.x=Math.min(ARCHIVE_W-p.w,p.x+14*dt);
      camera=Math.max(0,Math.min(worldWidth()-W,p.x-130));
    }else camera=0;
    p.inv=Math.max(0,p.inv-dt);p.hurt=Math.max(0,p.hurt-dt);p.shootCooldown=Math.max(0,p.shootCooldown-dt);
  }
  function updateShots(dt){
    for(const q of playerShots){if(!q.alive)continue;q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;const shotBox={x:q.x-4,y:q.y-2,w:8,h:4};
      // Cursor shots can destroy HR question cards and other hostile projectiles.
      for(const target of hostileShots)if(q.life>0&&target.alive&&target.team!=='player'&&overlaps(shotBox,{x:target.x,y:target.y,w:target.w,h:target.h})){q.life=0;target.alive=false;spawnBurst(target.x+target.w/2,target.y+target.h/2,'#c3dc70',7);tone(880,.04,'square');break;}
      if(room==='archive'){
        for(const b of breakables)if(q.life>0&&b.hp>0&&overlaps({x:q.x-4,y:q.y-2,w:8,h:4},b)){b.hp--;q.life=0;spawnBurst(q.x,q.y,'#d8c7a8',6);break;}
        if(q.life>0)for(const bot of archiveBots)if(bot.alive&&overlaps({x:q.x-4,y:q.y-2,w:8,h:4},{x:bot.x,y:FLOOR-14,w:17,h:14})){bot.hp--;q.life=0;if(bot.hp<=0){bot.alive=false;spawnBurst(bot.x+8,FLOOR-8,'#72d3bd',8);}break;}
        if(q.life>0)for(const bot of flyingBots)if(bot.alive&&overlaps({x:q.x-4,y:q.y-2,w:8,h:4},{x:bot.x,y:bot.y,w:22,h:16})){bot.hp--;q.life=0;if(bot.hp<=0){bot.alive=false;spawnBurst(bot.x+11,bot.y+8,'#72d3bd',8);}break;}
      }
      else if(room==='screening'){
        for(const b of breakables)if(q.life>0&&b.hp>0&&overlaps({x:q.x-4,y:q.y-2,w:8,h:4},b)){b.hp--;q.life=0;spawnBurst(q.x,q.y,'#d8c7a8',6);break;}
        if(q.life>0)for(const bot of hrQuestioners)if(bot.alive&&overlaps({x:q.x-4,y:q.y-2,w:8,h:4},{x:bot.x,y:FLOOR-25,w:21,h:25})){bot.hp--;q.life=0;if(bot.hp<=0){bot.alive=false;spawnBurst(bot.x+10,FLOOR-12,'#e7d4b8',10);}break;}
      }
      else if(room==='core'&&boss&&boss.state!=='defeat'&&boss.state!=='intro'&&overlaps({x:q.x-4,y:q.y-2,w:8,h:4},bossBounds())){damageBoss(q.damage);q.life=0;}
      if(q.life<=0||q.x<-20||q.x>worldWidth()+20||q.y<-20||q.y>H+20)q.life=0;
    }
    playerShots=playerShots.filter(q=>q.life>0);
    for(const q of hostileShots){if(!q.alive)continue;if(q.homing&&q.team!=='player'){const current=Math.atan2(q.vy,q.vx),target=Math.atan2(player.y+player.h/2-q.y-q.h/2,player.x+player.w/2-q.x-q.w/2),delta=Math.atan2(Math.sin(target-current),Math.cos(target-current)),angle=current+Math.max(-2.8*dt,Math.min(2.8*dt,delta)),speed=Math.max(120,Math.hypot(q.vx,q.vy));q.vx=Math.cos(angle)*speed;q.vy=Math.sin(angle)*speed;}q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.gravity)q.vy+=q.gravity*dt;
      if(q.team==='player'&&room==='core'&&boss&&overlaps({x:q.x,y:q.y,w:q.w,h:q.h},boss)){damageBoss(q.damage||1);q.alive=false;}
      else if(q.team==='player'&&room==='screening'){for(const bot of hrQuestioners)if(bot.alive&&overlaps({x:q.x,y:q.y,w:q.w,h:q.h},{x:bot.x,y:FLOOR-25,w:21,h:25})){bot.hp-=q.damage||1;q.alive=false;if(bot.hp<=0){bot.alive=false;spawnBurst(bot.x+10,FLOOR-12,'#e7d4b8',10);}break;}}
      else if(q.team!=='player'&&overlaps(player,{x:q.x,y:q.y,w:q.w,h:q.h})){q.alive=false;hurt();}
      if(room==='portfolio'&&q.falling&&q.y+q.h>=FLOOR){q.y=FLOOR-q.h;q.vy=0;q.falling=false;q.life=.38;}
      if(room==='portfolio'&&q.life!==undefined){q.life-=dt;if(q.life<=0)q.alive=false;}
      if(q.y>H+30||q.x<camera-35||q.x>camera+W+35)q.alive=false;
    }
    hostileShots=hostileShots.filter(q=>q.alive);
    particles=particles.filter(p=>p.life>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.fx)p.vy+=96*dt;else p.age+=dt;p.life-=dt;}
  }
  function archiveHazards(dt){
    archiveTime+=dt;
    const shred=archiveTime%4.8;
    if(shred>=2.35&&shred<3.05&&player.x+player.w>450&&player.x<506&&player.y+player.h>164)hurt();
    const stamp=(archiveTime%6.6);if(stamp>=4.35&&stamp<4.92&&player.x+player.w>706-18&&player.x<706+18&&player.y+player.h>106)hurt();
    for(const trap of archiveTraps)if(archiveTrapState(trap).active&&overlaps(player,{x:trap.x+3,y:158,w:trap.w-6,h:15}))hurt();
    // Paper projectiles approach slowly enough to read and dodge.
  }
  function updateArchiveBots(dt){
    for(const bot of archiveBots){
      if(!bot.alive)continue;
      if(bot.state==='aim'){
        bot.timer-=dt;
        if(bot.timer<=0){
          const sx=bot.x+8,sy=FLOOR-8,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,len=Math.max(1,Math.hypot(dx,dy));
          hostileShots.push({x:sx,y:sy,vx:dx/len*88,vy:dy/len*88,w:7,h:5,alive:true,kind:'cursor'});
          bot.state='patrol';bot.fireCooldown=2.35;
        }
      }else if(bot.state==='scan'){
        bot.timer-=dt;
        if(bot.timer<=0){bot.state='patrol';bot.dir=-bot.dir;}
      }else{
        bot.fireCooldown-=dt;
        const distance=Math.abs(player.x+player.w/2-(bot.x+8));
        if(bot.fireCooldown<=0&&distance<245){bot.state='aim';bot.timer=.48;bot.targetX=player.x+player.w/2;bot.targetY=player.y+player.h/2;}
        else{
          const oldX=bot.x;bot.x+=bot.dir*bot.speed*dt;
          if(bot.dir>0&&oldX<=bot.inspectX&&bot.x>=bot.inspectX){bot.x=bot.inspectX;bot.state='scan';bot.timer=1.25;}
          else if(bot.x>=bot.max){bot.x=bot.max;bot.dir=-1;}
          else if(bot.x<=bot.min){bot.x=bot.min;bot.dir=1;}
        }
      }
      if(overlaps(player,{x:bot.x+2,y:FLOOR-13,w:13,h:12}))hurt();
    }
  }
  function updateHrQuestioners(dt){
    for(const bot of hrQuestioners){
      if(!bot.alive)continue;
      if(bot.state==='aim'){
        bot.timer-=dt;
        if(bot.timer<=0){const sx=bot.x+11,sy=FLOOR-15,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,len=Math.max(1,Math.hypot(dx,dy)),startX=sx+dx/len*20,startY=sy+dy/len*20;hostileShots.push({x:startX-13,y:startY-8,vx:dx/len*82,vy:dy/len*82,w:26,h:17,alive:true,kind:'question'});bot.state='patrol';bot.fireCooldown=2.25;}
      }else{
        bot.fireCooldown-=dt;const distance=Math.abs(player.x+player.w/2-(bot.x+11));
        if(bot.fireCooldown<=0&&distance<360){bot.state='aim';bot.timer=.52;bot.targetX=player.x+player.w/2;bot.targetY=player.y+player.h/2;}
        else{bot.x+=bot.dir*bot.speed*dt;if(bot.x>=bot.max){bot.x=bot.max;bot.dir=-1;}else if(bot.x<=bot.min){bot.x=bot.min;bot.dir=1;}}
      }
      if(overlaps(player,{x:bot.x+2,y:FLOOR-22,w:17,h:21}))hurt();
    }
  }
  function updatePortfolio(dt){
    portfolioDropTimer-=dt;
    if(portfolioDropTimer<=0){const x=Math.max(camera+28,Math.min(camera+W-30,player.x+player.w+45+Math.random()*140));hostileShots.push({x:x-13,y:28,vx:(Math.random()-.5)*10,vy:22,gravity:190,w:26,h:17,alive:true,kind:'bundle',falling:true});portfolioDropTimer=2.5+Math.random()*2.2;}
    for(const bot of portfolioCritics){if(!bot.alive)continue;bot.x+=bot.dir*bot.speed*dt;if(bot.x<=bot.min){bot.x=bot.min;bot.dir=1;}else if(bot.x>=bot.max){bot.x=bot.max;bot.dir=-1;}bot.fireCooldown-=dt;
      if(bot.fireCooldown<=0){const sx=bot.x+11,sy=FLOOR-17,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,len=Math.max(1,Math.hypot(dx,dy));hostileShots.push({x:sx,y:sy,vx:dx/len*74,vy:dy/len*74,w:42,h:14,alive:true,kind:'comment'});bot.fireCooldown=2.1+Math.random()*1.1;}
    }
  }
  function updateFlyingBots(dt){
    for(const bot of flyingBots){
      if(!bot.alive)continue;
      bot.y=bot.baseY+Math.sin(time*2.2+bot.phase)*7;
      if(bot.state==='aim'){
        bot.timer-=dt;
        if(bot.timer<=0){
          const sx=bot.x+11,sy=bot.y+8,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,len=Math.max(1,Math.hypot(dx,dy));
          hostileShots.push({x:sx,y:sy,vx:dx/len*102,vy:dy/len*102,w:7,h:5,alive:true,kind:'cursor'});
          bot.state='fly';bot.fireCooldown=3.1;
        }
      }else{
        bot.fireCooldown-=dt;
        const distance=Math.hypot(player.x+player.w/2-(bot.x+11),player.y+player.h/2-(bot.y+8));
        if(bot.fireCooldown<=0&&distance<300){bot.state='aim';bot.timer=.56;bot.targetX=player.x+player.w/2;bot.targetY=player.y+player.h/2;}
        else{
          bot.x+=bot.dir*bot.speed*dt;
          if(bot.x>=bot.max){bot.x=bot.max;bot.dir=-1;}else if(bot.x<=bot.min){bot.x=bot.min;bot.dir=1;}
        }
      }
      if(overlaps(player,{x:bot.x+2,y:bot.y+1,w:18,h:13}))hurt();
    }
  }
  function updateBoss(dt){
    if(!boss)return;const config=difficulty[selectedDifficulty];boss.hitCooldown=Math.max(0,boss.hitCooldown-dt);boss.flash=Math.max(0,boss.flash-dt);
    if(boss.variant==='creative'&&boss.hp<boss.maxHp*.5&&boss.phase<2){boss.phase=2;boss.phaseBanner=3.0;boss.phaseShield=3.0;boss.attackIndex=0;boss.timer=Math.max(boss.timer,3.0);tone(190,.25,'sawtooth');}
    if(boss.variant==='ceo'&&boss.phase===0&&boss.hp<=boss.maxHp*.67){boss.phase=1;boss.phaseBanner=2.0;boss.phaseShield=1.5;boss.attackIndex=0;tone(155,.24,'sawtooth');}
    else if(boss.variant==='ceo'&&boss.phase===1&&boss.hp<=boss.maxHp*.34){boss.phase=2;boss.phaseBanner=2.4;boss.phaseShield=1.8;boss.attackIndex=0;boss.moveSpeed=92;tone(120,.32,'sawtooth');}
    boss.phaseBanner=Math.max(0,(boss.phaseBanner||0)-dt);boss.phaseShield=Math.max(0,(boss.phaseShield||0)-dt);
    if(boss.state==='defeat'){
      boss.timer-=dt;for(let i=0;i<2;i++)spawnBurst(boss.x+12+Math.random()*90,boss.y+20+Math.random()*85,i%2?'#ee6a5c':'#cfc1a4',1);
      if(boss.timer<=0){mode='victory';showVictory();}return;
    }
    if(boss.variant==='hr'){
      const groundY=82,minX=20,maxX=W-boss.w-20;
      boss.jumpCooldown-=dt;
      if(boss.jumping){
        boss.jumpVy+=430*dt;boss.y+=boss.jumpVy*dt;
        const dx=boss.jumpTargetX-boss.x;boss.x+=Math.sign(dx)*Math.min(Math.abs(dx),boss.jumpSpeed*dt);
        if(boss.y>=groundY){boss.y=groundY;boss.jumpVy=0;boss.jumping=false;boss.walking=false;spawnBurst(boss.x+boss.w/2,FLOOR-2,'#c77aa2',8);}
      }else{
        const delta=(player.x+player.w/2)-(boss.x+boss.w/2);boss.walkDir=Math.sign(delta)||boss.walkDir;
        boss.walking=Math.abs(delta)>72;
        if(boss.walking)boss.x+=boss.walkDir*boss.walkSpeed*dt;
        if(boss.jumpCooldown<=0&&boss.state!=='intro'&&boss.state!=='defeat'){
          boss.jumping=true;boss.walking=false;boss.jumpVy=-220;boss.jumpSpeed=68;
          boss.jumpTargetX=Math.max(minX,Math.min(maxX,player.x+(delta<0?-26:26)));
          boss.jumpCooldown=2.1+Math.random()*3.0;
        }
      }
      boss.x=Math.max(minX,Math.min(maxX,boss.x));
    }else if(boss.variant==='creative'){
      const groundY=83,minX=42,maxX=W-boss.w-42;
      if(boss.jumping){boss.jumpVy+=430*dt;boss.y+=boss.jumpVy*dt;const dx=boss.jumpTargetX-boss.x;boss.x+=Math.sign(dx)*Math.min(Math.abs(dx),boss.jumpSpeed*dt);if(boss.y>=groundY){boss.y=groundY;boss.jumpVy=0;boss.jumping=false;spawnBurst(boss.x+boss.w/2,FLOOR-2,'#c77a8d',7);}}
      else{const dx=(player.x+player.w/2)-(boss.x+boss.w/2),distance=Math.abs(dx);boss.walkDir=Math.sign(dx)||boss.walkDir;boss.walking=distance>88;if(boss.walking)boss.x+=boss.walkDir*boss.walkSpeed*.58*dt;boss.jumpCooldown-=dt;if(boss.jumpCooldown<=0&&boss.state!=='intro'&&boss.state!=='defeat'){boss.jumping=true;boss.jumpVy=-176;boss.jumpSpeed=54;const landingGap=dx<0?74:-74;boss.jumpTargetX=Math.max(minX,Math.min(maxX,player.x+landingGap));boss.jumpCooldown=3.2+Math.random()*2.1;}}
      boss.x=Math.max(minX,Math.min(maxX,boss.x));
    }else{
      if(boss.hp<=boss.maxHp*.5)boss.moving=true;
      if(boss.variant==='ceo'&&boss.phase>=1)boss.moving=true;
      if(boss.moving&&boss.state!=='intro'){
        boss.x+=boss.moveDir*boss.moveSpeed*dt;
        if(boss.x<=70){boss.x=70;boss.moveDir=1;}else if(boss.x>=W-boss.w-22){boss.x=W-boss.w-22;boss.moveDir=-1;}
      }
    }
    boss.timer-=dt;
    if(boss.state==='intro'){if(boss.timer<=0){boss.state='wait';boss.timer=config.gap;boss.face='watch';mode='play';}return;}
    if(boss.state==='wait'&&boss.timer<=0){
      const hrPhase=boss.hp<boss.maxHp*.5?2:boss.hp<=boss.maxHp*2/3?1:0;
      const attacks=boss.variant==='hr'?(hrPhase===0?['questionBurst']:hrPhase===1?['deadlineRain','hrScan']:['orbVolley','resumeRain','orbVolley','questionBurst','resumeRain']):boss.variant==='creative'?(hrPhase===0?['commentSpread']:hrPhase===1?['caseRain','reviewBeam']:['markupVolley','caseRain','markupVolley','commentSpread','reviewBeam','caseRain','markupVolley']):boss.variant==='ceo'?(boss.phase===0?['ceoVolley','ceoSlam']:boss.phase===1?['ceoVolley','ceoRain','ceoBeam','ceoSlam','ceoVolley']:['ceoVolley','ceoRain','ceoVolley','ceoBeam','ceoSlam','ceoRain','ceoVolley']):config.extra?['volley','paperRain','stamp','filter','volley','filter']:['volley','filter'];
      boss.attack=attacks[boss.attackIndex%attacks.length];boss.attackIndex++;
      boss.filter=boss.variant==='hr'?['Почему именно мы?','Назовите свою слабую сторону.','Где вы видите себя через 5 лет?','Есть ли у вас вопросы?'][boss.attackIndex%4]:boss.variant==='ceo'?['Готовы работать за идею?','Офис — это семья.','30 000 ₽ и бесплатный чай.','ГПХ, но с перспективой.'][boss.attackIndex%4]:['Junior. Опыт от 5 лет.','Знание 12 программ.','Возраст до 25. Опыт от 10 лет.','Сильный продуктовый майндсет.'][boss.attackIndex%4];
      boss.targetX=Math.max(38,Math.min(W-38,player.x+player.vx*.35));boss.warningXs=(boss.attack==='ceoRain'||boss.attack==='caseRain'&&boss.variant==='creative'&&hrPhase===2)?[36,104,172,240,308,370]:['resumeRain','caseRain'].includes(boss.attack)?[48,144,240,336]:[Math.max(38,boss.targetX-43),boss.targetX,Math.min(W-38,boss.targetX+43)];
      boss.state='tell';boss.timer=config.tell;boss.attackSpawned=false;boss.face='alert';return;
    }
    if(boss.state==='tell'&&boss.timer<=0){boss.state='attack';boss.face='attack';boss.timer=['paperRain','deadlineRain','resumeRain','caseRain','ceoRain'].includes(boss.attack)?1.6:boss.attack==='volley'||boss.attack==='ceoVolley'?1.1:boss.attack==='stamp'||boss.attack==='ceoSlam'?.72:1.0;activateBossAttack();return;}
    if(boss.state==='attack'){
      if((boss.attack==='paperRain'||boss.attack==='deadlineRain'||boss.attack==='resumeRain'||boss.attack==='caseRain'||boss.attack==='ceoRain')&&!boss.attackSpawned&&boss.timer<1.25){
        boss.attackSpawned=true;
        for(const x of boss.warningXs)hostileShots.push({x:x-13,y:34,vx:0,vy:18,gravity:180,w:boss.attack==='ceoRain'?30:26,h:boss.attack==='ceoRain'?22:17,alive:true,kind:boss.attack==='deadlineRain'?'question':boss.attack==='ceoRain'?'contract':'bundle',falling:true});
      }
      if(boss.attack==='stamp'&&boss.timer<.4&&boss.timer>.36&&Math.abs(player.x+player.w/2-boss.targetX)<23&&player.y+player.h>120)hurt();
      if((boss.attack==='filter'||boss.attack==='hrScan'||boss.attack==='reviewBeam'||boss.attack==='ceoBeam')&&player.y+player.h>149&&player.y<164&&player.x+player.w>22&&player.x<W-22)hurt();
      if(boss.timer<=0){boss.state='vulnerable';boss.face='weak';boss.timer=config.vuln;return;}
    }
    if(boss.state==='vulnerable'&&boss.timer<=0){boss.state='wait';boss.face='watch';boss.timer=config.gap*(boss.variant==='ceo'&&boss.phase>=2?.34:boss.variant==='creative'&&boss.phase>=2?.58:1);}
    if(boss.state==='hurt'&&boss.timer<=0){boss.state='vulnerable';boss.face='weak';boss.timer=boss.vulnLeft||.5;}
  }
  function activateBossAttack(){
    if(boss.attack==='orbVolley'||boss.attack==='markupVolley'){
      const sx=boss.x+(boss.x>W/2?10:boss.w-16),sy=boss.y+54,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,angle=Math.atan2(dy,dx);
      const spreads=boss.variant==='creative'&&boss.phase>=2?[-.48,-.24,0,.24,.48]:[-.30,0,.30],speed=boss.variant==='creative'&&boss.phase>=2?116:96;
      for(const spread of spreads){const a=angle+spread;hostileShots.push({x:sx,y:sy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-12,gravity:74,w:12,h:12,alive:true,kind:'orb'});}
    }else if(boss.attack==='commentSpread'){
      const sx=boss.x+(boss.x>W/2?12:boss.w-20),sy=boss.y+50,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,angle=Math.atan2(dy,dx);
      for(const spread of [-.34,0,.34]){const a=angle+spread;hostileShots.push({x:sx,y:sy,vx:Math.cos(a)*88,vy:Math.sin(a)*88,w:42,h:14,alive:true,kind:'comment',label:['МЕЛКО?','СЕТКА?','ШРИФТ?','ВОЗДУХ?','КЕЙС?','ПРАВЬ!'][Math.floor(Math.random()*6)]});}
    }else if(boss.attack==='questionBurst'){
      const sx=boss.x+(boss.x>W/2?7:boss.w-16),sy=boss.y+43,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,angle=Math.atan2(dy,dx);
      for(const spread of [-.28,0,.28]){const a=angle+spread;hostileShots.push({x:sx,y:sy+spread*18,vx:Math.cos(a)*78,vy:Math.sin(a)*78,w:22,h:15,alive:true,kind:'question'});}
    }else if(boss.attack==='volley'){
      const speeds=[62,76,66].map(s=>s*difficulty[selectedDifficulty].shot);
      const dir=player.x+player.w/2<boss.x+boss.w/2?-1:1;
      for(let i=0;i<3;i++){const targetY=player.y+10+(i-1)*22;const dy=targetY-(boss.y+48);hostileShots.push({x:boss.x+(dir<0?5:boss.w-18),y:boss.y+46+i*8,vx:dir*speeds[i],vy:Math.max(-15,Math.min(15,dy*.22)),w:14,h:9,alive:true,kind:'resume'});}
    }else if(boss.attack==='ceoVolley'){
      const sx=boss.x+(boss.x>W/2?8:boss.w-18),sy=boss.y+78,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,angle=Math.atan2(dy,dx),spread=boss.phase>=2?[-.52,-.34,-.17,0,.17,.34,.52]:boss.phase===1?[-.42,-.21,0,.21,.42]:[-.3,0,.3],speed=boss.phase>=2?160:boss.phase===1?148:136;
      for(const a0 of spread){const a=angle+a0;hostileShots.push({x:sx,y:sy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,w:17,h:17,alive:true,kind:'orb',homing:true});}
    }else if(boss.attack==='ceoSlam'){
      hostileShots.push({x:boss.targetX-18,y:-28,vx:0,vy:0,w:36,h:30,alive:true,kind:'contract',falling:true});
    }else if(boss.attack==='paperRain'||boss.attack==='resumeRain'||boss.attack==='caseRain'){
      // Bundles spawn only after the marked floor zones have been visible.
    }else if(boss.attack==='stamp'){
      boss.stampY=-24;hostileShots.push({x:boss.targetX-16,y:-22,vx:0,vy:0,w:32,h:25,alive:true,kind:'stamp',falling:true});
    }else if(boss.attack==='ceoBeam'||boss.attack==='filter'||boss.attack==='hrScan'||boss.attack==='reviewBeam'){
      boss.beamTimer=1.0;
    }
  }
  function updateCoreSpecial(dt){
    if(!boss)return;
    if(boss.variant==='creative'){
      boss.floorTrapTimer-=dt;
      if(boss.floorTrapTimer<=0&&boss.floorTrapWarning<=0&&boss.floorTrapActive<=0){boss.floorTrapX=[54,124,194,264,334][Math.floor(Math.random()*5)];boss.floorTrapWarning=.72;boss.floorTrapTimer=2.7+Math.random()*1.4;}
      if(boss.floorTrapWarning>0){boss.floorTrapWarning-=dt;if(boss.floorTrapWarning<=0)boss.floorTrapActive=.62;}
      if(boss.floorTrapActive>0){boss.floorTrapActive-=dt;if(player.y+player.h>=FLOOR-4&&player.x+player.w>boss.floorTrapX-27&&player.x<boss.floorTrapX+27)hurt();}
    }
    if(boss.variant==='ceo'){
      boss.platformDropTimer-=dt;
      for(const platform of platforms)if(platform.kind==='crumble'){
        if(platform.active&&platform.timer>0){platform.timer-=dt;if(platform.timer<=0){platform.timer=0;platform.active=false;platform.respawn=1.7;}}
        else if(!platform.active){platform.respawn-=dt;if(platform.respawn<=0){platform.active=true;platform.respawn=0;}}
      }
      if(boss.platformDropTimer<=0){const available=platforms.filter(p=>p.kind==='crumble'&&p.active&&p.timer<=0);if(available.length)available[Math.floor(Math.random()*available.length)].timer=.82;boss.platformDropTimer=3.8+Math.random()*1.5;}
    }
    for(const q of hostileShots)if(q.falling&&boss.state==='attack'){q.y+=220*dt;if(q.y>FLOOR-23){q.y=FLOOR-23;q.vx=0;q.falling=false;q.life=.65;}}
    hostileShots=hostileShots.filter(q=>!q.life||q.life>0);
    for(const q of hostileShots)if(q.life)q.life-=dt;
    if(boss.hp>0&&boss.state!=='defeat'&&overlaps(player,bossBounds())){
      const freshHit=player.inv<=0;
      hurt();
      if(boss.variant==='creative'&&freshHit){
        const nearLeft=player.x<52,nearRight=player.x+player.w>W-52;
        if(nearLeft||nearRight){const escape=nearLeft?1:-1;player.vx=escape*108;boss.x=Math.max(42,Math.min(W-boss.w-42,boss.x-escape*24));boss.x=nearLeft?Math.max(boss.x,player.x+player.w+14):Math.min(boss.x,player.x-boss.w-14);boss.x=Math.max(42,Math.min(W-boss.w-42,boss.x));}
      }
    }
    updateBoss(dt);
  }
  function update(dt){
    if(mode==='transition'){transitionTime-=dt;if(transitionTime<=0){if(nextRoom==='core'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupCore(1);}else if(nextRoom==='screening'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupScreening();}else if(nextRoom==='stage2Boss'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupCore(2);}else if(nextRoom==='portfolio'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupPortfolio();}else if(nextRoom==='portfolioBoss'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupCore(3);}else if(nextRoom==='ceoBoss'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupCore(4);}else{mode='play';room='archive';} }return;}
    if(mode==='intro'){updateShots(dt);updateBoss(dt);return;}
    if(mode!=='play')return;
    moveAndCollide(dt);
    if(mouse.left)shoot();
    updateShots(dt);
    if(room==='archive'){updateArchiveBots(dt);updateFlyingBots(dt);archiveHazards(dt);}else if(room==='screening'){updateHrQuestioners(dt);}else if(room==='portfolio'){updatePortfolio(dt);}else{updateCoreSpecial(dt);}
    if(room==='archive'&&nearTerminal()){} // terminal prompt is drawn at the object
  }

  function showVictory(){
    if(coreStage===3){nextRoom='ceoBoss';transitionTime=.9;mode='transition';hostileShots=[];playerShots=[];return;}
    if(coreStage===4){
      const finishRun=()=>{mode='done';nextRoom=null;transitionTime=0;hostileShots=[];playerShots=[];for(const key of Object.keys(keys))keys[key]=false;};
      const elapsed=()=>`${Math.max(1,Math.round((performance.now()-startTime)/1000))} сек · Получено ударов: ${hitsTaken}`;
      function showStagePicker(backAction=showOffer){
        finishRun();
        panel(`<p class="eyebrow">ПОВТОРНЫЙ ЗАХОД</p><h2>ВЫБРАТЬ ЭТАП</h2><p>Начните игру с нужной главы.</p><div class="stage-grid"><button class="primary" data-stage="1">01 · ОТКЛИК</button><button class="primary" data-stage="2">02 · HR-СКРИНИНГ</button><button class="primary" data-stage="3">03 · ПОРТФОЛИО</button><button class="primary" data-stage="4">ФИНАЛ · CEO</button></div><button class="secondary" id="backToEnding">НАЗАД К ФИНАЛУ</button>`);
        overlay.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{
          deaths=0;hitsTaken=0;hearts=START_HEARTS;startTime=performance.now();nextRoom=null;const stage=Number(button.dataset.stage);
          if(stage===1){setupArchive(true);mode='play';}else if(stage===2)setupScreening();else if(stage===3)setupPortfolio();else setupCore(4);
          overlay.innerHTML='';
        }));
        document.getElementById('backToEnding').onclick=backAction;
      }
      function showEnding(accepted=false){
        finishRun();
        panel(accepted?`<p class="eyebrow">ОФФЕР ПРИНЯТ</p><h2>ВЫХОД В ПОНЕДЕЛЬНИК</h2><p>Первая задача уже ждёт:<br>«освежить весь бренд к утру».</p><button class="primary" id="stageSelect">ВЫБРАТЬ ЭТАП</button>`:`<p class="eyebrow">ОФФЕР ОТКЛОНЁН</p><h2>ПОИСК ЗАВЕРШЁН</h2><p>Вы закрыли эту главу.<br>«Срочно» не обязательно значит «вчера».</p><button class="primary" id="stageSelect">ВЫБРАТЬ ЭТАП</button>`,'ending-card');
        document.getElementById('stageSelect').onclick=()=>showStagePicker(()=>showEnding(accepted));
      }
      function showOffer(){
        finishRun();
      panel(`<p class="eyebrow">ФИНАЛ · РУКОВОДИТЕЛЬ КОМПАНИИ</p><h2>ОФФЕР НА СТОЛЕ</h2><p>30 000 ₽ · офис 5/2 · ГПХ.<br>Бесплатные печеньки прилагаются.</p><div class="actions"><button class="primary" id="acceptOffer">ПРИНЯТЬ ОФФЕР</button><button class="secondary" id="searchFurther">ОТКЛОНИТЬ ОФФЕР</button></div>`);
        document.getElementById('acceptOffer').onclick=()=>showEnding(true);
        document.getElementById('searchFurther').onclick=()=>showEnding(false);
      }
      showOffer();
      return;
    }
    if(coreStage===2){mode='done';panel(`<p class="eyebrow">Этап 02/03 — Собеседование</p><h2>HR-СКРИНИНГ ПРОЙДЕН</h2><p>Дальше — проверка портфолио.</p><button class="primary" id="nextPortfolio">Продолжить</button>`);document.getElementById('nextPortfolio').onclick=()=>{nextRoom='portfolio';transitionTime=.72;mode='transition';hostileShots=[];playerShots=[];};return;}
    panel(`<p class="eyebrow">ЭТАП 01/03</p><h2>РЕЗЮМЕ ПРОШЛО ПРОВЕРКУ</h2><p>HR согласился на встречу.<br>Дальше — следующий этап.</p><button class="primary" id="lift">ПРОДОЛЖИТЬ ИГРУ</button>`);
    document.getElementById('lift').onclick=()=>{nextRoom='screening';transitionTime=.72;mode='transition';hostileShots=[];playerShots=[];};
  }
  function showScreeningComplete(){
    nextRoom='stage2Boss';transitionTime=.72;mode='transition';hostileShots=[];playerShots=[];
  }
  function showPortfolioComplete(){
    nextRoom='portfolioBoss';transitionTime=.72;mode='transition';hostileShots=[];playerShots=[];
  }
  function pause(){if(mode!=='play'&&mode!=='intro')return;pauseFrom=mode;mode='pause';panel(`<p class="eyebrow">АРХИВ СОХРАНЁН</p><h2>ПАУЗА</h2><p>Можно выдохнуть. Система подождёт.</p><button class="primary" id="resume">ПРОДОЛЖИТЬ</button>`);document.getElementById('resume').onclick=()=>{mode=pauseFrom;overlay.innerHTML=''};}

  // Input stays attached to the game surface.
  canvas.addEventListener('mousedown',event=>{
    event.preventDefault();canvas.focus();if(event.button===0){mouse.left=true;if(mode==='play'&&!player.shootCooldown)shoot();}
  });
  canvas.addEventListener('mousemove',event=>{
    const bounds=canvas.getBoundingClientRect(),screenX=(event.clientX-bounds.left)*VIEW_W/bounds.width,screenY=(event.clientY-bounds.top)*VIEW_H/bounds.height,gameScaleX=VIEW_W/W,gameScaleY=VIEW_H/H;
    mouse.aimX=Math.max(0,Math.min(W,screenX/gameScaleX));mouse.aimY=Math.max(0,Math.min(H,screenY/gameScaleY));mouse.aiming=true;
    if(player){const dx=camera+mouse.aimX-(player.x+player.w/2),dy=mouse.aimY-(player.y+player.h/2);player.aimAngle=Math.atan2(dy,dx);player.face=dx<0?-1:1;}
  });
  window.addEventListener('mouseup',event=>{if(event.button===0)mouse.left=false;});
  window.addEventListener('blur',()=>{mouse.left=false;for(const key of Object.keys(keys))keys[key]=false;});
  window.addEventListener('keydown',event=>{
    if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','AltLeft','AltRight'].includes(event.code))event.preventDefault();
    keys[event.code]=true;if(event.repeat)return;
    if((event.code==='Space'||event.code==='ArrowUp')&&mode==='play'){player.jumpBuffer=.13;}
    if(event.code==='KeyE'&&mode==='play'){
      if(room==='archive'&&nearTerminal()){recordTutorial('interact');mode='transition';nextRoom='core';transitionTime=.72;hostileShots=[];playerShots=[];tone(260,.18,'triangle');}
      else if(room==='core'&&boss?.state==='defeat'&&boss.timer<2.2){showVictory();}
      else if(room==='screening'&&nearScreeningExit()){showScreeningComplete();tone(420,.12,'triangle');}
      else if(room==='portfolio'&&nearPortfolioExit()){showPortfolioComplete();tone(520,.12,'triangle');}
    }
    if(event.code==='Escape'){if(mode==='pause'){mode=pauseFrom;overlay.innerHTML='';}else pause();}
    if(event.code==='KeyR'&&mode==='fail')restartRoom();
  });
  window.addEventListener('keyup',event=>{keys[event.code]=false;});

  function frame(now){const dt=Math.min((now-(frame.last||now))/1000,.033);frame.last=now;time+=dt;if(mode==='play'||mode==='intro'||mode==='transition')update(dt);drawFrame();requestAnimationFrame(frame);}
  const previewRoom=new URLSearchParams(window.location.search).get('preview');
  if(previewRoom==='archive'){
    startTime=performance.now();hearts=START_HEARTS;mode='play';setupArchive(true);overlay.innerHTML='';
  }else if(previewRoom==='ats'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(1);overlay.innerHTML='';
  }else if(previewRoom==='stage2'){
    startTime=performance.now();hearts=START_HEARTS;setupScreening();
  }else if(previewRoom==='stage2boss'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(2);overlay.innerHTML='';
  }else if(previewRoom==='stage3'){
    startTime=performance.now();hearts=START_HEARTS;setupPortfolio();
  }else if(previewRoom==='stage3boss'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(3);overlay.innerHTML='';
  }else if(previewRoom==='stage4boss'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(4);overlay.innerHTML='';
  }else{player=makePlayer(30);renderTitle();}
  requestAnimationFrame(frame);
})();



















