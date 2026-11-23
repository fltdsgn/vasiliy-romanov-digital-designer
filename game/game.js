(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const footerStage = document.getElementById('stage-note');
  const W = 384, H = 216, VIEW_W = 1200, VIEW_H = 800;
  const FLOOR = 178, ARCHIVE_W = 1190, ARCHIVE_EXIT_X = 1070, SCREENING_W = 384, SCREENING_WORLD_H = 672, SCREENING_FLOOR = 644, SCREENING_SHIFT = 96, SCREENING_FALL_DEATH = 100, SCREENING_EXIT_X = 170, SCREENING_EXIT_Y = 136, PORTFOLIO_W = 1040, PORTFOLIO_EXIT_X = 920, PORTFOLIO_EXIT_Y = FLOOR;
  const art={archive:new Image(),archiveDoor:new Image(),archiveWalker:new Image(),archiveDrone:new Image(),archiveGround:new Image(),archivePlatform:new Image(),archiveTrapPlate:new Image(),archiveTrapSpikes:new Image(),archiveTrapLaser:new Image(),archiveTrapLaserLeft:new Image(),archiveTrapLaserRight:new Image(),arena:new Image(),hrArena:new Image(),hrBasement:new Image(),hrProps:new Image(),hrBoss:new Image(),hrBossWalk:new Image(),hrBossApproach:new Image(),hrBossApproved:new Image(),hrBossWalkCycle:new Image(),hrBossJump:new Image(),hrBossAttackCycle:new Image(),screeningTower:new Image(),screeningPlatforms:new Image(),recruiters:new Image(),hero:new Image(),heroRun:new Image(),skull:new Image(),portfolioHall:new Image(),portfolioBossArena:new Image(),portfolioBoss:new Image(),portfolioPlatforms:new Image(),portfolioShafts:new Image(),portfolioRobots:new Image(),offerLantern:new Image(),offerPedestal:new Image()};
  art.archive.src='assets/art/archive-hall.png';art.archiveDoor.src='assets/art/archive-tower-tall.png';art.archiveWalker.src='assets/art/archive-walker.png';art.archiveDrone.src='assets/art/archive-drone.png';art.archiveGround.src='assets/art/archive-ground-module.png';art.archivePlatform.src='assets/art/archive-platform.png';art.archiveTrapPlate.src='assets/art/archive-trap-plate.png';art.archiveTrapSpikes.src='assets/art/archive-trap-spikes.png';art.archiveTrapLaserLeft.src='assets/art/archive-trap-laser-left.png';art.archiveTrapLaserRight.src='assets/art/archive-trap-laser-right.png';art.arena.src='assets/art/ats-arena.png';art.hrArena.src='assets/art/stage2-hr-arena-v2.png';art.hrBasement.src='assets/art/stage2-basement-arena.png';art.hrProps.src='assets/art/stage2-hr-midground-props.png';art.hrBoss.src='assets/art/stage2-hr-boss-male.png';art.hrBossWalk.src='assets/art/stage2-hr-boss-walk.png';art.hrBossApproach.src='assets/art/stage2-hr-boss-approach.png';art.hrBossApproved.src='assets/art/stage2-hr-boss-approved.png';art.hrBossWalkCycle.src='assets/art/stage2-hr-boss-walk-cycle.png';art.hrBossJump.src='assets/art/stage2-hr-boss-jump.png';art.hrBossAttackCycle.src='assets/art/stage2-hr-boss-attack-cycle.png';art.screeningTower.src='assets/art/stage2-tower.png';art.screeningPlatforms.src='assets/art/stage2-platform-atlas.png';art.recruiters.src='assets/art/stage2-recruiter-women.png';art.hero.src='assets/art/applicant.png';art.heroRun.src='assets/art/applicant-run.png';art.skull.src='assets/art/ats-skull.png';art.portfolioHall.src='assets/art/act3-gallery-hall-v2.png';art.portfolioBossArena.src='assets/art/act3-boss-arena-v2.png';art.portfolioBoss.src='assets/art/act3-boss-curator.png';art.portfolioPlatforms.src='assets/art/act3-platforms.png';art.portfolioShafts.src='assets/art/act3-shafts.png';art.portfolioRobots.src='assets/art/act3-robots.png';art.offerLantern.src='assets/art/act3-offer-lantern.png';art.offerPedestal.src='assets/art/act3-offer-pedestal.png';
  const START_HEARTS = 3, HEARTS_PER_STAGE = 1;
  const keys = Object.create(null);
  const mouse = { left:false, aimX:W*.82, aimY:FLOOR-10, aiming:false };
  const palette = {
    ink:'#101722', deep:'#182330', steel:'#293a49', steel2:'#405364', edge:'#71808a',
    paper:'#c8bca6', paperHi:'#eadfca', paperShade:'#948b7d', paperInk:'#665f57',
    red:'#d94f54', redDark:'#80373f', teal:'#55a4a1', tealDark:'#2e6268',
    lime:'#c3dc70', light:'#f4f2ff', shadow:'#0c121d'
  };
  const gameBalance={hp:12,tell:1.4,gap:1.25,vuln:2.1,shot:.65};
  let mode='title', room='archive';
  let player, platforms=[], breakables=[], hostileShots=[], playerShots=[], archiveBots=[], flyingBots=[], archiveTraps=[], hrQuestioners=[], screeningTraps=[], portfolioCritics=[], creativeDrones=[], portfolioLasers=[], portfolioRocks=[], particles=[], coreStage=1, portfolioDropTimer=0;
  let archiveTime=0, camera=0, cameraY=0, time=0, tutorialStep=0, moveTally=0;
  let shootClock=0, hearts=3, boss=null, nextRoom=null, hrLiftOpen=false, portfolioFinale=null, finalOffer=null;
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
    panel(`<h1>ПОЙМАЙ ОФФЕР</h1><p class="subtitle">Полгода в пути. Ни одного оффера.<br>Но сегодня ты дойдёшь до конца.</p><button class="primary" id="start">НАЧАТЬ ИГРУ</button>`,'title-card');
    document.getElementById('start').onclick=startGame;
  }
  function startGame(){
    deaths=0;hitsTaken=0;hearts=START_HEARTS;startTime=performance.now();room='archive';mode='play';setupArchive(true);overlay.innerHTML='';tone(560,.12);
  }
  function makePlayer(x=30){return{x,y:FLOOR-23,vx:0,vy:0,w:16,h:23,hp:hearts,face:1,aimAngle:0,crouching:false,ground:true,coyote:.1,jumpBuffer:0,inv:0,run:0,shootCooldown:0,hurt:0,standing:null,lastSafeX:x,lastSafeY:FLOOR-23,fallOriginY:FLOOR};}
  function setupArchive(resetPlayer=false){
    room='archive';camera=0;archiveTime=0;tutorialStep=0;moveTally=0;
    platforms=[
      // One broad archive shaft: five stepping stones carry the player across, with a single collapsing stone in the middle.
      {x:0,y:FLOOR,w:165,h:H-FLOOR,kind:'ground'},
      {x:650,y:FLOOR,w:ARCHIVE_W-650,h:H-FLOOR,kind:'ground'},
      {x:195,y:153,w:66,h:10,kind:'paper'},
      {x:285,y:141,w:70,h:10,kind:'paper'},
      {x:380,y:153,w:76,h:10,kind:'crumble',timer:0,active:true},
      {x:475,y:141,w:70,h:10,kind:'paper'},
      {x:570,y:153,w:74,h:10,kind:'paper'}
    ];
    breakables=[];
    hostileShots=[];hrQuestioners=[];
    archiveTraps=[
      {x:132,w:32,phase:0,kind:'spikes'},
      {x:785,w:42,phase:2.1,kind:'spikes'},
      {x:940,w:48,phase:4.2,kind:'laser'}
    ];
    archiveBots=[
      {x:60,min:35,max:95,inspectX:75,dir:1,speed:21,state:'patrol',timer:0,fireCooldown:1.8,hp:1,alive:true},
      {x:715,min:685,max:765,inspectX:735,dir:1,speed:22,state:'patrol',timer:0,fireCooldown:2.5,hp:1,alive:true},
      {x:860,min:830,max:910,inspectX:880,dir:-1,speed:23,state:'patrol',timer:0,fireCooldown:2.8,hp:1,alive:true}
    ];
    flyingBots=[
      {x:260,y:104,baseY:104,min:205,max:365,dir:1,speed:24,phase:.5,state:'fly',timer:0,fireCooldown:1.8,hp:1,alive:true},
      {x:430,y:95,baseY:95,min:360,max:535,dir:-1,speed:20,phase:2.2,state:'fly',timer:0,fireCooldown:2.7,hp:1,alive:true},
      {x:575,y:108,baseY:108,min:520,max:640,dir:1,speed:22,phase:4.1,state:'fly',timer:0,fireCooldown:2.2,hp:1,alive:true}
    ];
    playerShots=[];particles=[];if(resetPlayer||!player)player=makePlayer(30);else{player=makePlayer(30);player.hp=hearts;}
    boss=null;
  }
  function setupCore(stage=1){
    coreStage=stage;hrLiftOpen=false;portfolioFinale=null;finalOffer=null;
    room='core';camera=0;cameraY=0;platforms=stage===1?[
      {x:0,y:FLOOR,w:160,h:H-FLOOR,kind:'arena'},{x:224,y:FLOOR,w:W-224,h:H-FLOOR,kind:'arena'},
      {x:36,y:145,w:55,h:8,kind:'crumble',timer:0,active:true,respawn:0},{x:166,y:132,w:52,h:8,kind:'crumble',timer:0,active:true,respawn:0},{x:294,y:145,w:55,h:8,kind:'crumble',timer:0,active:true,respawn:0}
    ]:[{x:0,y:FLOOR,w:W,h:H-FLOOR,kind:'arena'},...(stage===2?[
      {x:22,y:146,w:72,h:8,kind:'paper'},{x:116,y:115,w:58,h:8,kind:'paper'},
      {x:207,y:84,w:72,h:8,kind:'paper'},{x:298,y:53,w:64,h:8,kind:'paper'}
    ]:stage===3?[
      // A broad, raised center dais gives the art director arena its own silhouette.
      {x:25,y:148,w:94,h:8,kind:'bossLedge'},
      {x:151,y:116,w:116,h:8,kind:'bossLedge'},
      {x:300,y:143,w:76,h:8,kind:'bossLedge'}
    ]:[{x:36,y:145,w:55,h:8,kind:'paper'},{x:294,y:145,w:55,h:8,kind:'paper'}])];
    breakables=[];hostileShots=[];playerShots=[];archiveBots=[];flyingBots=[];archiveTraps=[];hrQuestioners=[];creativeDrones=[];particles=[];player=makePlayer(28);player.hp=hearts;
    const config=gameBalance,hr=stage===2,creative=stage===3,ceo=stage===4,bossHp=ceo?Math.round(config.hp*1.65):config.hp;boss={x:hr?W+8:ceo?180:creative?206:228,y:hr?FLOOR-66:creative?50:ceo?43:35,w:ceo?164:hr?52:creative?132:112,h:ceo?158:hr?66:creative?95:102,hp:bossHp,maxHp:bossHp,state:'intro',timer:hr?3.3:2.15,entranceTargetX:hr?224:null,entranceSpeed:hr?72:0,attackIndex:0,attack:hr?'questionBurst':creative?'commentSpread':ceo?'ceoVolley':'volley',targetX:100,warningXs:[],hitCooldown:0,stompCooldown:0,flash:0,face:'sleep',filter:'',stampY:-80,beamTimer:0,phase:0,phaseBanner:0,phaseShield:0,moveDir:-1,moveSpeed:hr?58:ceo?66:42,moving:stage===1,walkDir:-1,walkSpeed:27,jumpVy:0,jumping:false,jumpWindup:0,jumpCooldown:hr?6.5+Math.random()*2.5:2+Math.random()*2.2,jumpTargetX:0,flightPhase:Math.random()*Math.PI*2,recruiterTraps:[],recruiterTrapTimer:1.8,floorTrapTimer:3.2,floorTrapWarning:0,floorTrapActive:0,floorTrapX:190,platformDropTimer:4.6,variant:hr?'hr':creative?'creative':ceo?'ceo':'skull'};
    if(ceo)platforms=[{x:0,y:FLOOR,w:W,h:H-FLOOR,kind:'arena'},{x:36,y:145,w:55,h:8,kind:'crumble',timer:0,active:true,respawn:0},{x:294,y:145,w:55,h:8,kind:'crumble',timer:0,active:true,respawn:0}];
    mode='intro';
  }
  function spawnCreativeDrones(){
    creativeDrones=[
      {kind:'flyer',x:54,y:47,baseY:47,min:30,max:150,dir:1,speed:23,phase:.6,state:'patrol',fireCooldown:1.0,hp:2,alive:true},
      {kind:'flyer',x:299,y:66,baseY:66,min:224,max:344,dir:-1,speed:25,phase:2.8,state:'patrol',fireCooldown:1.8,hp:2,alive:true}
    ];
  }
  function setupScreening(){
    room='screening';camera=0;archiveTime=0;boss=null;
    cameraY=SCREENING_WORLD_H-H;
    platforms=[
      {x:0,y:SCREENING_FLOOR,w:W,h:SCREENING_WORLD_H-SCREENING_FLOOR,kind:'tower'},
      {x:142,y:510,w:100,h:9,kind:'tower'},
      {x:18,y:472,w:108,h:9,kind:'tower'},
      {x:258,y:472,w:108,h:9,kind:'tower',motion:{minX:244,maxX:270,speed:20,dir:1}},
      {x:18,y:434,w:100,h:9,kind:'tower',motion:{minX:18,maxX:266,speed:48,dir:1}},
      {x:18,y:396,w:102,h:9,kind:'tower'},
      {x:264,y:396,w:102,h:9,kind:'tower'},
      {x:142,y:358,w:100,h:9,kind:'tower'},
      {x:178,y:320,w:100,h:9,kind:'tower'},
      {x:42,y:282,w:100,h:9,kind:'tower',motion:{minX:22,maxX:60,speed:26,dir:-1}},
      {x:178,y:244,w:100,h:9,kind:'tower'},
      {x:42,y:206,w:100,h:9,kind:'crumble',timer:0,active:true,respawn:0},
      {x:178,y:168,w:100,h:9,kind:'tower'},
      {x:42,y:130,w:100,h:9,kind:'tower'},
      {x:18,y:92,w:100,h:9,kind:'tower',motion:{minX:18,maxX:266,speed:48,dir:1}},
      {x:124,y:54,w:136,h:9,kind:'tower'}
    ];
    for(const p of platforms)if(p.y<SCREENING_FLOOR)p.y+=SCREENING_SHIFT;
    // Row four is a split landing with two timed spike plates.
    screeningTraps=[
      {x:46,y:387,w:28,h:9,period:3.8,offset:1.1},
      {x:292,y:387,w:28,h:9,period:3.8,offset:2.3},
      {x:212,y:311,w:32,h:9,period:4.2,offset:2.0},
      {x:214,y:159,w:34,h:9,period:3.6,offset:2.7}
    ];
    for(const trap of screeningTraps)trap.y+=SCREENING_SHIFT;
    breakables=[];
    hostileShots=[];playerShots=[];archiveBots=[];archiveTraps=[];particles=[];
    hrQuestioners=[
      {x:291,y:436,platformY:472,min:0,max:0,dir:1,speed:12,state:'patrol',timer:0,fireCooldown:1.5,hp:2,alive:true},
      {x:46,y:398,platformY:434,min:0,max:0,dir:-1,speed:14,state:'patrol',timer:0,fireCooldown:1.35,hp:2,alive:true},
      {x:220,y:284,platformY:320,min:196,max:246,dir:-1,speed:13,state:'patrol',timer:0,fireCooldown:1.7,hp:2,alive:true},
      {x:220,y:208,platformY:244,min:194,max:246,dir:1,speed:14,state:'patrol',timer:0,fireCooldown:1.5,hp:2,alive:true},
      {x:220,y:132,platformY:168,min:194,max:246,dir:-1,speed:15,state:'patrol',timer:0,fireCooldown:1.4,hp:2,alive:true},
      {x:58,y:56,platformY:92,min:22,max:94,dir:1,speed:16,state:'patrol',timer:0,fireCooldown:1.3,hp:2,alive:true},
      {x:184,y:18,platformY:54,min:150,max:216,dir:-1,speed:13,state:'patrol',timer:0,fireCooldown:1.45,hp:2,alive:true}
    ];
    for(const bot of hrQuestioners){bot.y+=SCREENING_SHIFT;bot.platformY+=SCREENING_SHIFT;bot.platformRef=platforms.find(p=>p.y===bot.platformY&&p.x<=bot.x+24&&p.x+p.w>=bot.x)||null;if(bot.platformRef)bot.y=bot.platformRef.y-36;}
    flyingBots=[
      {x:58,y:390,baseY:390,min:22,max:122,dir:1,speed:25,phase:.7,state:'fly',timer:0,fireCooldown:1.8,hp:1,alive:true},
      {x:300,y:278,baseY:278,min:262,max:352,dir:-1,speed:22,phase:2.3,state:'fly',timer:0,fireCooldown:2.2,hp:1,alive:true},
      {x:52,y:162,baseY:162,min:20,max:122,dir:1,speed:24,phase:4.4,state:'fly',timer:0,fireCooldown:1.7,hp:1,alive:true}
    ];
    player=makePlayer(174);player.y=SCREENING_FLOOR-player.h;player.lastSafeX=player.x;player.lastSafeY=player.y;player.fallOriginY=SCREENING_FLOOR;player.hp=hearts;mode='play';overlay.innerHTML='';
  }
  function setupPortfolio(){
    room='portfolio';camera=0;archiveTime=0;boss=null;portfolioDropTimer=2.2;
    // Follow the broken bridge spans, then climb the staggered route to the director's hall.
    platforms=[{x:0,y:FLOOR,w:164,h:H-FLOOR,kind:'ground'},
      {x:216,y:FLOOR,w:119,h:H-FLOOR,kind:'ground'},{x:397,y:FLOOR,w:121,h:H-FLOOR,kind:'ground'},
      {x:575,y:FLOOR,w:120,h:H-FLOOR,kind:'ground'},
      {x:170,y:159,w:48,h:9,kind:'bridgeStep'},{x:341,y:154,w:56,h:9,kind:'bridgeStep'},
      {x:525,y:159,w:50,h:9,kind:'bridgeStep'},{x:702,y:154,w:60,h:9,kind:'bridgeStep'},
      {x:778,y:154,w:90,h:9,kind:'gallery'},{x:824,y:130,w:58,h:9,kind:'gallery'},
      {x:870,y:106,w:40,h:9,kind:'gallery'},
      // The final stair drops back to the lower gallery floor where the portal stands.
      {x:910,y:FLOOR,w:PORTFOLIO_W-910,h:H-FLOOR,kind:'ground'}];
    breakables=[];hostileShots=[];playerShots=[];archiveBots=[];flyingBots=[];archiveTraps=[];hrQuestioners=[];particles=[];
    portfolioCritics=[
      {kind:'walker',x:275,y:FLOOR-31,baseY:FLOOR-31,min:230,max:318,dir:1,speed:17,phase:.4,state:'patrol',fireCooldown:3.2,hp:2,alive:true},
      {kind:'flyer',x:346,y:112,baseY:112,min:300,max:470,dir:-1,speed:24,phase:1.7,state:'patrol',fireCooldown:2.9,hp:2,alive:true},
      {kind:'walker',x:455,y:FLOOR-31,baseY:FLOOR-31,min:415,max:493,dir:-1,speed:19,phase:2.2,state:'patrol',fireCooldown:3.4,hp:2,alive:true},
      {kind:'flyer',x:557,y:102,baseY:102,min:520,max:682,dir:1,speed:26,phase:3.1,state:'patrol',fireCooldown:2.7,hp:2,alive:true},
      {kind:'heavy',x:638,y:FLOOR-42,baseY:FLOOR-42,min:590,max:667,dir:-1,speed:12,phase:3.8,state:'patrol',fireCooldown:4.4,hp:4,alive:true},
      {kind:'flyer',x:748,y:126,baseY:126,min:710,max:792,dir:1,speed:22,phase:4.5,state:'patrol',fireCooldown:3.6,hp:2,alive:true},
      {kind:'flyer',x:858,y:66,baseY:66,min:816,max:920,dir:-1,speed:21,phase:5.2,state:'patrol',fireCooldown:3.3,hp:2,alive:true}
    ];
    portfolioRocks=[{x:276,y:FLOOR-27,w:40,h:27,shade:0},{x:443,y:FLOOR-30,w:45,h:30,shade:1},{x:620,y:FLOOR-26,w:38,h:26,shade:2}];
    portfolioLasers=[{x:185,range:48,speed:.42,phase:1.4},{x:478,range:44,speed:.38,phase:1.6},{x:755,range:32,speed:.44,phase:3.2},{x:895,range:23,speed:.4,phase:4.8}];
    player=makePlayer(108);player.hp=hearts;mode='play';overlay.innerHTML='';
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
  function drawScreeningPlatform(p,x,shake=0){
    const y=p.y+shake,floor=p.y>=SCREENING_FLOOR;
    if(art.screeningPlatforms.complete&&art.screeningPlatforms.naturalWidth){
      const image=art.screeningPlatforms;ctx.save();ctx.imageSmoothingEnabled=false;
      if(floor)ctx.drawImage(image,15,35,1503,251,x,y-1,p.w,68);
      else if(p.w>=120)ctx.drawImage(image,220,359,1096,200,x,y-2,p.w,p.w*200/1096);
      else if(p.w>=83)ctx.drawImage(image,422,604,692,190,x,y-2,p.w,p.w*190/692);
      else ctx.drawImage(image,556,835,424,169,x,y-2,p.w,p.w*169/424);
      ctx.restore();return;
    }
    // Limestone and dark iron braces distinguish the HR tower from the archive machinery.
    if(floor){
      rect(x,y,p.w,p.h,'#252a31');rect(x,y,p.w,3,'#b7a17a');rect(x,y+1,p.w,1,'#e1c995');
      rect(x+2,y+3,p.w-4,5,'#59605d');rect(x+2,y+8,p.w-4,p.h-8,'#323a40');
      for(let bx=x;bx<x+p.w;bx+=36){const bw=Math.min(36,x+p.w-bx);rect(bx+1,y+3,bw-2,3,(Math.floor((bx-x)/36)%2)?'#7d7768':'#8c826d');line(bx+2,y+4,bx+bw-3,y+4,'#c3ae82');rect(bx+bw-2,y+4,1,3,'#373d40');}
      for(let bx=x+14;bx<x+p.w-8;bx+=68){rect(bx,y+9,3,2,'#8f6948');rect(bx+1,y+9,1,1,'#e3b875');poly([[bx-4,y+13],[bx+8,y+13],[bx+5,y+17],[bx-1,y+17]],'#4c4d49');}
      for(let bx=x+8;bx<x+p.w-10;bx+=54){rect(bx,y+20,28,2,'#222a30');rect(bx+2,y+20,24,1,'#5c5244');}
      return;
    }
    const w=p.w;
    poly([[x+3,y],[x+w-3,y],[x+w,y+4],[x+w-2,y+10],[x+2,y+10],[x,y+4]],'#30343a');
    rect(x+2,y+5,w-4,4,'#4d514e');rect(x+2,y+3,w-4,2,'#aa9470');rect(x+4,y+2,w-8,1,'#e2c794');
    for(let bx=x+4;bx<x+w-4;bx+=27){const bw=Math.min(27,x+w-4-bx);rect(bx,y+2,bw-1,3,(Math.floor((bx-x)/27)%2)?'#94876e':'#aa9978');line(bx+1,y+2,bx+bw-2,y+2,'#dac18e');rect(bx+bw-2,y+3,1,2,'#4b4a45');}
    rect(x+5,y+6,w-10,1,'#343a3b');
    for(let bx=x+17;bx<x+w-15;bx+=56){rect(bx,y+9,3,3,'#6e543d');rect(bx+1,y+9,1,1,'#ddb26d');poly([[bx-5,y+11],[bx+8,y+11],[bx+5,y+15],[bx-2,y+15]],'#514d45');line(bx-3,y+12,bx+1,y+15,'#a1835a');line(bx+6,y+12,bx+2,y+15,'#a1835a');}
    rect(x+7,y+8,w-14,1,'#202a30');
  }
  function drawPlatform(p){
    if(p.active===false)return;
    const x=p.x-camera;if(x+p.w<0||x>W)return;
    if(room==='portfolio'&&(p.kind==='ground'||p.kind==='bridgeStep'||p.kind==='gallery')){
      const shake=p.timer>0?Math.sin(time*34)*.65:0;
      if(art.portfolioPlatforms.complete&&art.portfolioPlatforms.naturalWidth){
        // Reuse the designed glass catwalk module for floors and raised bridge fragments.
        const image=art.portfolioPlatforms;ctx.save();ctx.imageSmoothingEnabled=true;
        ctx.drawImage(image,674,330,526,128,x+shake,p.y-7,p.w,Math.max(11,p.w*.235));ctx.restore();
      }else{
        rect(x+shake,p.y+2,p.w,3,'#4e605c');rect(x+2+shake,p.y,p.w-4,1,'#dec28c');
        rect(x+3+shake,p.y+3,p.w-6,1,'#9fc1b1');rect(x+6+shake,p.y+5,p.w-12,5,'#293a3e');
        for(let gx=x+12+shake;gx<x+p.w-8;gx+=22){rect(gx,p.y+6,1,6,'#718078');rect(gx+1,p.y+10,10,1,'#536561');}
      }
      return;
    }
    if(room==='screening'&&(p.kind==='tower'||p.kind==='crumble')){
      const shake=p.timer>0?Math.sin(time*42)*.6:0;
      drawScreeningPlatform(p,x+shake);
      if(p.kind==='crumble'&&p.timer>0){ctx.save();ctx.globalAlpha=.5+.35*Math.sin(time*24);ctx.shadowColor='#ff8b61';ctx.shadowBlur=6;rect(x+4,p.y+2,p.w-8,2,'#e69b69');ctx.shadowBlur=0;line(x+8,p.y+3,x+16,p.y+8,'#8e5143');line(x+p.w-8,p.y+3,x+p.w-16,p.y+8,'#8e5143');ctx.restore();}
      return;
    }
    if((room==='archive'||room==='core'&&(coreStage===1||coreStage===2))&&(p.kind==='ground'||p.kind==='arena')){
      drawFantasyGround(x,p.y,p.w,p.h);
      return;
    }
    if((room==='archive'||room==='core'&&(coreStage===1||coreStage===2))&&p.kind!=='ground'&&p.kind!=='arena'&&art.archivePlatform.complete&&art.archivePlatform.naturalWidth){
      const shake=p.kind==='crumble'&&p.timer>0?Math.sin(time*48)*.8:0;ctx.save();ctx.imageSmoothingEnabled=true;
      ctx.drawImage(art.archivePlatform,x-1+shake,p.y-2,p.w+2,27);
      ctx.restore();return;
    }
    if((room==='archive'||room==='core'&&coreStage===1)&&!['ground','arena'].includes(p.kind)){
      const shake=p.kind==='crumble'&&p.timer>0?Math.sin(time*48)*1.1:0;
      drawFantasyLedge(x,p.y,p.w,p.h,p.kind,shake);
      return;
    }
    if(room==='portfolio'&&p.kind==='bridgeStep'){
      // Broken bridge fragments: a narrow deck with exposed steel ribs, not a solid block.
      rect(x+2,p.y+2,p.w-4,2,'#53635f');rect(x+3,p.y,p.w-6,1,'#ddc18a');
      rect(x+4,p.y+2,p.w-8,1,'#91bcb0');rect(x+4,p.y+4,p.w-8,1,'rgba(16,31,37,.78)');
      for(let bx=x+9;bx<x+p.w-7;bx+=18){rect(bx,p.y+4,1,4,'#465a59');rect(bx+1,p.y+7,8,1,'#35494a');}
      for(const bx of [x+7,x+p.w-9]){rect(bx,p.y+4,1,3,'#a88a5e');rect(bx-2,p.y+7,5,1,'#53625e');}
      return;
    }
    if(room==='portfolio'&&p.kind==='gallery'){
      const shake=p.timer>0?Math.sin(time*34)*.5:0;
      // Slim illuminated catwalk with a visible truss underside, matching the atrium bridges.
      rect(x+2+shake,p.y+2,p.w-4,2,'#566764');rect(x+4+shake,p.y,p.w-8,1,'#ddc18a');
      rect(x+5+shake,p.y+2,p.w-10,1,'#9ac0b3');rect(x+6+shake,p.y+4,p.w-12,1,'rgba(20,36,42,.72)');
      for(let bx=x+12+shake;bx<x+p.w-12;bx+=24){
        rect(bx,p.y+4,1,5,'#596a63');rect(bx+1,p.y+8,11,1,'#405452');
        line(bx+1,p.y+8,bx+9,p.y+4,'#566963');
      }
      for(let bx=x+20+shake;bx<x+p.w-8;bx+=42){rect(bx,p.y+4,1,3,'#aa8c5c');rect(bx-2,p.y+7,5,1,'#53625e');}
      return;
    }
    if(room==='portfolio'&&(p.kind==='ground'||p.kind==='arena')){
      rect(x,p.y+2,p.w,3,'#4e605c');rect(x+2,p.y,p.w-4,1,'#dec28c');
      rect(x+3,p.y+2,p.w-6,1,'#9fc1b1');rect(x+4,p.y+5,p.w-8,2,'#293a3e');
      for(let gx=x+15;gx<x+p.w-6;gx+=38){rect(gx,p.y+7,1,Math.min(24,Math.max(0,p.h-7)),'rgba(29,48,53,.82)');rect(gx+1,p.y+17,10,1,'rgba(85,105,97,.72)');}
      return;
    }
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
  function drawFantasyGround(x,y,w,h){
    if((room==='archive'||room==='core'&&(coreStage===1||coreStage===2))&&art.archiveGround.complete&&art.archiveGround.naturalWidth){
      rect(x,y+17,w,Math.max(0,h-17),'#152329');ctx.save();ctx.imageSmoothingEnabled=true;
      const tileW=54,tileH=22;for(let tx=x;tx<x+w;tx+=tileW)ctx.drawImage(art.archiveGround,tx,y-2,Math.min(tileW,x+w-tx),tileH);
      ctx.restore();
      // The tile already includes its finished top surface; don't draw the old continuous road over it.
      return;
    }
    ctx.save();ctx.shadowColor='rgba(5,10,13,.5)';ctx.shadowBlur=5;
    const face=ctx.createLinearGradient(0,y+3,0,y+h);face.addColorStop(0,'#263638');face.addColorStop(.45,'#202d31');face.addColorStop(1,'#101a20');ctx.fillStyle=face;ctx.fillRect(x,y+3,w,Math.max(0,h-3));ctx.restore();
    poly([[x-2,y+3],[x+2,y],[x+w-4,y],[x+w+1,y+3],[x+w-2,y+7],[x+3,y+7]],'#596255');
    rect(x,y+1,w,1,'#b3a378');rect(x+2,y+3,w-4,1,'#67796a');
    for(let row=y+9;row<y+h;row+=10){
      rect(x+2,row,w-4,1,'rgba(7,13,17,.48)');
      const offset=Math.floor((row-y)/10)%2?15:4;
      for(let bx=x+offset;bx<x+w-5;bx+=31){
        const stone='#29363a';poly([[bx,row+1],[bx+3,row],[bx+14,row],[bx+17,row+2],[bx+15,row+7],[bx+2,row+7]],stone);
        rect(bx+3,row+1,7,1,'rgba(150,145,113,.13)');
      }
    }
    for(let gx=x+12;gx<x+w-6;gx+=67){poly([[gx,y+1],[gx+3,y-2],[gx+7,y],[gx+10,y-2],[gx+12,y+1]],'#72805b');rect(gx+5,y-2,1,2,'#9ba574');}
  }
  function drawFantasyLedge(x,y,w,h,kind,shake=0){
    if((room==='archive'||room==='core'&&(coreStage===1||coreStage===2))&&art.archivePlatform.complete&&art.archivePlatform.naturalWidth){ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(art.archivePlatform,x-1+shake,y-2,w+2,27);if(kind==='crumble'&&platforms.some(p=>p.x===x&&p.y===y&&p.timer>0)){ctx.globalAlpha=.82+.18*Math.sin(time*24);ctx.shadowColor='#ff9a61';ctx.shadowBlur=7;rect(x+7+shake,y+1,w-14,2,'#f0a46c');ctx.shadowBlur=0;line(x+12+shake,y+4,x+19+shake,y+10,'#d98062');line(x+w-12+shake,y+4,x+w-19+shake,y+10,'#d98062');}ctx.restore();return;}
    const crumble=kind==='crumble',warn=crumble&&Math.floor(time*9)%2===0;
    ctx.save();ctx.shadowColor='rgba(3,9,13,.55)';ctx.shadowBlur=4;
    const face=ctx.createLinearGradient(0,y,0,y+h+3);face.addColorStop(0,'#53605a');face.addColorStop(.38,'#344247');face.addColorStop(1,'#1b292e');ctx.fillStyle=face;
    poly([[x+2+shake,y],[x+w-2+shake,y],[x+w+shake,y+3],[x+w-3+shake,y+h],[x+4+shake,y+h],[x+shake,y+3]],face);ctx.restore();
    poly([[x+shake,y],[x+4+shake,y-2],[x+w-5+shake,y-2],[x+w+shake,y+1],[x+w-3+shake,y+4],[x+2+shake,y+3]],warn?'#b47d56':'#879071');
    rect(x+4+shake,y-1,w-9,1,kind==='conveyor'?'#98ab88':'#b8ad83');rect(x+5+shake,y+2,w-10,1,'#4c6157');
    for(let bx=x+7+shake;bx<x+w-5;bx+=14){rect(bx,y+5,1,Math.max(1,h-6),'rgba(10,17,20,.42)');rect(bx+2,y+5,5,1,'rgba(167,159,126,.2)');}
    for(let bx=x+9+shake;bx<x+w-5;bx+=29){poly([[bx,y-1],[bx+3,y-3],[bx+7,y-2],[bx+10,y-3],[bx+12,y-1]],'#758363');}
    if(kind==='conveyor'){for(let bx=x+12;bx<x+w-8;bx+=19){rect(bx,y+1,4,1,'#a8bd91');rect(bx+6,y+1,1,1,'#6a9c87');}}
    if(crumble){ctx.save();ctx.shadowColor=warn?'#f28c5f':'transparent';ctx.shadowBlur=warn?4:0;line(x+9,y+2,x+15,y+5,'#d19a71');line(x+15,y+5,x+12,y+h-1,'#9a6e58');line(x+w-13,y+2,x+w-19,y+5,'#c7916c');ctx.restore();}
  }
  function drawPaperStack(block){
    const x=block.x-camera,y=block.y;if(x+block.w<0||x>W)return;
    const w=block.w,h=block.h;
    // A tied bundle of old parchment resumes with rolled ends and a wax seal.
    poly([[x+2,y+5],[x+4,y+2],[x+w-4,y+2],[x+w-1,y+5],[x+w-2,y+h-3],[x+2,y+h-2]],'#493c36');
    poly([[x+2,y+5],[x+5,y+3],[x+w-5,y+3],[x+w-3,y+6],[x+w-4,y+h-5],[x+3,y+h-4]],'#c9ad7c');
    rect(x+4,y+5,w-9,h-10,'#e2cda0');rect(x+5,y+6,w-12,1,'#f1dfb8');
    rect(x+6,y+9,w-13,1,'#987e61');rect(x+7,y+13,w-15,1,'#b19770');
    // Dark leather binding and a stamped red wax medallion make the object read as a fantasy prop.
    rect(x+w-8,y+4,3,h-8,'#59463b');rect(x+w-7,y+4,1,h-8,'#b18a58');
    poly([[x+w-6,y+7],[x+w-3,y+8],[x+w-3,y+12],[x+w-6,y+13],[x+w-8,y+11],[x+w-8,y+9]],'#9c4545');
    rect(x+w-6,y+9,2,2,'#e0b77f');
    rect(x+2,y+h-4,w-5,1,'#8b7257');
    if(block.hp===1){
      poly([[x+2,y+3],[x+6,y+3],[x+4,y+7],[x+6,y+10],[x+3,y+13]],'#493c36');
      line(x+4,y+5,x+7,y+8,'#6a3738');line(x+7,y+8,x+5,y+13,'#6a3738');
      rect(x+w-5,y+2,3,1,'#f0d7a9');
    }
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
    if(art.archiveWalker.complete&&art.archiveWalker.naturalWidth){
      const dw=27,dh=27,dx=x-5,dy=FLOOR-dh+(step?0:1);
      ctx.save();ctx.imageSmoothingEnabled=true;
      if(bot.dir<0){ctx.translate(dx+dw,0);ctx.scale(-1,1);ctx.drawImage(art.archiveWalker,0,dy,dw,dh);}
      else ctx.drawImage(art.archiveWalker,dx,dy,dw,dh);
      ctx.restore();
      if(scan){ctx.save();ctx.globalAlpha=.26;poly([[x+5,FLOOR-31],[x-2,FLOOR-57],[x+20,FLOOR-57]],'#d9bd70');ctx.restore();rect(x-2,FLOOR-57,22,5,'#e9dfc7');rect(x,FLOOR-55,16,1,'#876d56');rect(x-1,FLOOR-54+Math.floor(time*7)%3,19,1,'#c7dc78');}
      return;
    }
    if(art.archive.complete){
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor=scan?'#b6df83':'#ec9a4e';ctx.shadowBlur=scan?5:2;
      ctx.fillStyle='#151c20';for(const wx of [x+4,x+13]){ctx.beginPath();ctx.arc(wx,y+11,2.2,0,Math.PI*2);ctx.fill();}
      const shell=ctx.createLinearGradient(x,y+2,x+4,y+12);shell.addColorStop(0,'#8e8b78');shell.addColorStop(.4,'#4d5f59');shell.addColorStop(1,'#26353b');ctx.fillStyle=shell;ctx.beginPath();ctx.roundRect(x,y+3,18,9,3);ctx.fill();
      ctx.fillStyle='#101c20';ctx.beginPath();ctx.roundRect(x+3,y+4,12,6,2);ctx.fill();ctx.fillStyle=scan?'#d6ee8e':'#79d5c8';ctx.shadowColor=scan?'#c6f17c':'#66d6d5';ctx.shadowBlur=5;ctx.beginPath();ctx.ellipse(x+9+(bot.dir>0?2:0),y+7,2.5,1.8,0,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.fillStyle='#c6a977';ctx.beginPath();ctx.arc(x+9,y+2,1,0,Math.PI*2);ctx.fill();
      if(scan){ctx.fillStyle='rgba(183,224,136,.18)';ctx.beginPath();ctx.moveTo(x+8,y+1);ctx.lineTo(x+4,y-12);ctx.lineTo(x+14,y-12);ctx.closePath();ctx.fill();ctx.fillStyle='#ebdfc6';ctx.fillRect(x+3,y-15,11,6);ctx.fillStyle='#a17662';ctx.fillRect(x+5,y-13,7,1);ctx.fillStyle='#d4ef84';ctx.fillRect(x+4,y-11+Math.floor(time*7)%4,9,1);}
      ctx.restore();return;
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
    if(art.archiveDrone.complete&&art.archiveDrone.naturalWidth){
      ctx.save();ctx.imageSmoothingEnabled=true;const bob=Math.sin(time*5+bot.phase)*1.4;
      ctx.drawImage(art.archiveDrone,x-5,y-6+bob,32,30);ctx.restore();return;
    }
    if(art.archive.complete){
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.translate(x+11,y+8);ctx.rotate(Math.sin(time*2+bot.phase)*.08);ctx.shadowColor=bot.state==='aim'?'#ff6557':'#72c9cd';ctx.shadowBlur=5;
      ctx.fillStyle='#26383d';ctx.beginPath();ctx.ellipse(0,1,12,6,0,0,Math.PI*2);ctx.fill();
      const shell=ctx.createLinearGradient(-7,-7,6,7);shell.addColorStop(0,'#b4a681');shell.addColorStop(.45,'#526b68');shell.addColorStop(1,'#24363d');ctx.fillStyle=shell;ctx.beginPath();ctx.ellipse(0,0,8.5,6,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=bot.state==='aim'?'#f16a59':'#86d9cc';ctx.shadowBlur=4;ctx.beginPath();ctx.ellipse(1,0,2.8,1.8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0c5';ctx.beginPath();ctx.arc(-4,-2,1,0,Math.PI*2);ctx.fill();
      ctx.restore();return;
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
    if(room==='portfolio'){
      for(const [pitIndex,[left,right]] of [[164,216],[335,397],[518,575],[695,778]].entries()){
        const x=left-camera,w=right-left;if(x+w<-6||x>W+6)continue;
        const depth=ctx.createLinearGradient(0,FLOOR,0,H);depth.addColorStop(0,'rgba(6,17,22,.92)');depth.addColorStop(.48,'rgba(5,15,21,.82)');depth.addColorStop(1,'rgba(3,10,17,.98)');
        ctx.fillStyle=depth;ctx.fillRect(x,FLOOR,w,H-FLOOR);
        if(art.portfolioShafts.complete&&art.portfolioShafts.naturalWidth){
          const shaftCrops=[[228,118,150,590],[786,116,210,590],[1570,116,190,590]],crop=shaftCrops[pitIndex%shaftCrops.length];
          ctx.save();ctx.globalAlpha=.44;ctx.imageSmoothingEnabled=true;ctx.drawImage(art.portfolioShafts,...crop,x+3,FLOOR+2,Math.max(1,w-6),H-FLOOR-2);ctx.restore();
        }
        // Recessed shaft walls step inward as they disappear into fog.
        poly([[x,FLOOR],[x+5,FLOOR+7],[x+5,H-7],[x,H]],'#263a3b');poly([[x+w,FLOOR],[x+w-5,FLOOR+7],[x+w-5,H-7],[x+w,H]],'#263a3b');
        line(x+4,FLOOR+7,x+4,H-9,'#71806d');line(x+w-4,FLOOR+7,x+w-4,H-9,'#71806d');
        for(let y=FLOOR+13;y<H-8;y+=13){const fade=1-(y-FLOOR)/(H-FLOOR);ctx.globalAlpha=Math.max(.12,fade*.58);rect(x+6,y,w-12,1,'#42605b');rect(x+8,y+2,2,2,'#c39458');rect(x+w-10,y+2,2,2,'#c39458');}
        ctx.globalAlpha=1;
        // Slack cables and small service ledges make the opening read as a deep elevator shaft.
        ctx.strokeStyle='rgba(153,137,99,.72)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+9,FLOOR);ctx.bezierCurveTo(x+12,FLOOR+13,x+w*.42,FLOOR+17,x+w*.48,FLOOR+31);ctx.stroke();
        ctx.beginPath();ctx.moveTo(x+w-9,FLOOR);ctx.bezierCurveTo(x+w-12,FLOOR+12,x+w*.58,FLOOR+19,x+w*.52,FLOOR+34);ctx.stroke();
        if(w>53){rect(x+5,FLOOR+25,Math.min(15,w*.28),2,'#526966');rect(x+w-17,FLOOR+47,12,2,'#526966');}
        const fog=ctx.createLinearGradient(0,FLOOR+35,0,H);fog.addColorStop(0,'rgba(17,40,43,0)');fog.addColorStop(1,'rgba(97,133,121,.2)');ctx.fillStyle=fog;ctx.fillRect(x+5,FLOOR+34,w-10,H-FLOOR-34);
        rect(x-2,FLOOR-2,Math.min(11,w/3),3,'#b8844d');rect(x+w-Math.min(11,w/3),FLOOR-2,Math.min(11,w/3)+2,3,'#b8844d');
      }
      return;
    }
    const gaps=room==='archive'?[[165,650]]:room==='portfolio'?[[164,216],[335,397],[518,575],[695,778]]:[[291,311],[589,609],[888,908]];
    for(const [left,right] of gaps){
      const x=left-camera,w=right-left;if(x+w<-4||x>W+4)continue;
      if(room==='archive'){
        // Keep the shaft simple and readable: dark depth, straight masonry walls, spikes at the bottom.
        const inset=Math.min(12,w*.035), shaftLeft=x+inset,shaftRight=x+w-inset;
        const depth=ctx.createLinearGradient(0,FLOOR,0,H);depth.addColorStop(0,'#07131a');depth.addColorStop(.68,'#030910');depth.addColorStop(1,'#010407');ctx.fillStyle=depth;ctx.fillRect(x,FLOOR,w,H-FLOOR);
        poly([[x,FLOOR],[shaftLeft,FLOOR+5],[shaftLeft,H],[x,H]],'#263943');poly([[x+w,FLOOR],[shaftRight,FLOOR+5],[shaftRight,H],[x+w,H]],'#263943');
        line(shaftLeft,FLOOR+5,shaftLeft,H,'#52615d');line(shaftRight,FLOOR+5,shaftRight,H,'#52615d');
        for(let y=FLOOR+9;y<H-7;y+=8){const row=Math.floor((y-FLOOR)/8)%2,fade=1-(y-FLOOR)/(H-FLOOR);ctx.globalAlpha=.5*fade;line(x+3+row*3,y,shaftLeft-1,y,'#485852');line(shaftRight+1,y,x+w-3-row*3,y,'#485852');}
        ctx.globalAlpha=1;
        // A small, low-contrast spike bed anchors the shaft bottom without filling the void.
        const spikeTop=H-4,spikeCount=Math.max(5,Math.floor((shaftRight-shaftLeft)/12)),spikeW=(shaftRight-shaftLeft)/spikeCount;
        for(let i=0;i<spikeCount;i++){const sx=shaftLeft+i*spikeW;poly([[sx,spikeTop+3],[sx+spikeW*.5,spikeTop],[sx+spikeW,spikeTop+3]],i%2?'#232c30':'#2d3738');line(sx+spikeW*.5,spikeTop,sx+spikeW*.5,spikeTop+2,'#485653');}
        // Broken stone lips remain attached to both sides of the opening.
        poly([[x-2,FLOOR-1],[x+2,FLOOR-4],[x+7,FLOOR-1],[x+10,FLOOR+3],[x+7,FLOOR+6],[x+2,FLOOR+4]],'#46554e');rect(x,FLOOR-1,5,1,'#b89562');
        poly([[x+w+2,FLOOR-1],[x+w-2,FLOOR-4],[x+w-7,FLOOR-1],[x+w-10,FLOOR+3],[x+w-7,FLOOR+6],[x+w-2,FLOOR+4]],'#46554e');rect(x+w-5,FLOOR-1,5,1,'#b89562');continue;
      }
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
      const x=trap.x-camera;if(x<-65||x>W+65)continue;
      const {warning,active}=archiveTrapState(trap);
      if(trap.kind==='spikes'&&art.archiveTrapPlate.complete&&art.archiveTrapSpikes.complete){
        ctx.save();ctx.imageSmoothingEnabled=true;
        ctx.drawImage(art.archiveTrapPlate,x-3,FLOOR-12,trap.w+6,16);
        if(active||warning){ctx.globalAlpha=active?1:(Math.floor(time*8)%2?.78:.25);ctx.drawImage(art.archiveTrapSpikes,x-3,FLOOR-17,trap.w+6,21);}
        ctx.restore();
        if(warning){ctx.save();ctx.shadowColor='#ff785e';ctx.shadowBlur=5;rect(x+4,FLOOR-3,trap.w-8,1,'#ed735f');ctx.restore();}
        continue;
      }
      if(trap.kind==='laser'&&art.archiveTrapLaserLeft.complete&&art.archiveTrapLaserRight.complete){
        const gateX=x-2,pylonH=76,beamY=FLOOR-23,pylonY=beamY-pylonH*.5;
        ctx.save();ctx.imageSmoothingEnabled=true;ctx.beginPath();ctx.rect(0,0,W,FLOOR);ctx.clip();
        ctx.drawImage(art.archiveTrapLaserLeft,gateX-6,pylonY,18,pylonH);ctx.drawImage(art.archiveTrapLaserRight,gateX+trap.w-12,pylonY,18,pylonH);ctx.restore();
        // The barrier now spans the running lane at head height: time it, or hold Alt to duck underneath.
        const beamX=gateX+11,beamW=trap.w-22;
        if(active){ctx.save();ctx.shadowColor='#ff6258';ctx.shadowBlur=8;rect(beamX,beamY-1,beamW,3,'#fff0c0');ctx.restore();}
        else if(warning){if(Math.floor(time*8)%2===0){ctx.save();ctx.shadowColor='#f0a867';ctx.shadowBlur=5;rect(beamX,beamY,beamW,1,'#ffcc84');ctx.restore();}}
        else{rect(beamX,beamY,beamW,1,'rgba(102,180,173,.32)');}
        continue;
      }
      if(art.archive.complete){
        const glow=active?'#ff765d':warning?'#edbd75':'#73c9b2';
        for(const side of [0,trap.w-7]){
          // Low, isolated rune sockets keep the trap visually separate from overhead ledges.
          rect(x+side,167,9,7,'#172329');rect(x+side+1,168,7,4,'#56484a');rect(x+side+2,172,5,2,'#c5a16b');
          poly([[x+side+4.5,157],[x+side+7,161],[x+side+4.5,165],[x+side+2,161]],active?'#ffb28a':warning?'#f1d59a':'#9de0c4');
          ctx.save();ctx.shadowColor=glow;ctx.shadowBlur=active?8:warning?6:3;ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x+side+4.5,161,1.4,0,Math.PI*2);ctx.fill();ctx.restore();
        }
        if(active){
          const beamFill=ctx.createLinearGradient(0,158,0,166);beamFill.addColorStop(0,'rgba(248,100,78,.05)');beamFill.addColorStop(.35,'rgba(255,114,81,.64)');beamFill.addColorStop(.58,'rgba(255,220,160,.92)');beamFill.addColorStop(1,'rgba(219,66,57,.08)');ctx.fillStyle=beamFill;ctx.fillRect(x+5,158,trap.w-10,8);
          ctx.save();ctx.shadowColor='#ff8163';ctx.shadowBlur=8;rect(x+5,161,trap.w-10,1,'#fff0c4');ctx.restore();
        }else{
          const shimmer=warning?Math.floor(time*8)%2===0:Math.sin(time*2+trap.phase)>0;
          rect(x+7,165,trap.w-14,1,warning&&shimmer?'#e8a76b':'rgba(122,176,148,.5)');
          for(let rx=x+12;rx<x+trap.w-8;rx+=12){poly([[rx,163],[rx+2,165],[rx,167],[rx-2,165]],warning&&shimmer?'#e3a66c':'#718f73');}
        }
        rect(x+trap.w/2-24,125,48,8,'rgba(10,17,22,.94)');rect(x+trap.w/2-24,125,1,8,active?'#ed795d':warning?'#dfb56e':'#74a695');txt(active?'ЛУЧ АКТИВЕН':warning?'РУНЫ ЗАРЯЖЕНЫ':'РУНЫ',x+trap.w/2,131,3.6,active?'#ffad86':warning?'#edc990':'#9ab6a1','center');
        continue;
      }
      const beam=active?'#ee5356':warning?(Math.floor(time*8)%2?'#e3ba65':'#8a754f'):'#55827d';
      rect(x-3,151,5,27,'#33444d');rect(x-2,153,3,20,'#667572');rect(x+trap.w-2,151,5,27,'#33444d');rect(x+trap.w-1,153,3,20,'#667572');
      rect(x-4,148,7,4,warning||active?'#d87a58':'#7b8b83');rect(x+trap.w-3,148,7,4,warning||active?'#d87a58':'#7b8b83');
      rect(x+3,164,trap.w-6,1,beam);if(warning||active)rect(x+3,161,trap.w-6,active?3:1,beam);
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
    const illustrated=art.archive.complete;
    if(illustrated){ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(art.archive,0,0,W,H);ctx.fillStyle='rgba(8,14,22,.18)';ctx.fillRect(0,0,W,H);ctx.restore();}
    else{ctx.save();ctx.globalAlpha=.38;drawArchiveBack();drawArchiveShelves();
    // Occasional service columns break the repeating shelving rhythm.
    for(let wx=Math.floor(camera/360)*360+250;wx<camera+W+360;wx+=360){const x=wx-camera;rect(x,25,13,132,'#263541');rect(x+3,27,7,126,'#475a63');rect(x+5,30,2,112,'#73817e');rect(x-4,146,21,4,'#88918a');rect(x-1,152,15,2,'#222d37');}ctx.restore();drawAtmosphere();}
    if(illustrated)drawArchiveDoor();
    for(const p of platforms)drawPlatform(p);
    drawArchivePits();drawArchiveTraps();
    if(!illustrated){drawShredder();drawStamp();drawTerminal();}
    for(const b of breakables)if(b.hp>0)drawPaperStack(b);
    for(const bot of archiveBots)drawArchiveBot(bot);
    for(const bot of flyingBots)drawFlyingBot(bot);
  }
  function drawArchiveDoor(){
    const x=ARCHIVE_EXIT_X-camera;if(x<-170||x>W+170)return;
    if(!art.archiveDoor.complete||!art.archiveDoor.naturalWidth)return;
    const cx=x+27,w=200,h=300;
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor='rgba(6,14,19,.48)';ctx.shadowBlur=6;
    // Preserve the portrait artwork's aspect ratio. The top continues offscreen and the floor masks its lower edge.
    ctx.drawImage(art.archiveDoor,cx-w/2,FLOOR-h+46,w,h);ctx.restore();
  }
  function drawScreeningBack(){
    rect(0,0,W,SCREENING_WORLD_H,'#0b1820');
    if(art.screeningTower.complete&&art.screeningTower.naturalWidth){ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(art.screeningTower,0,0,1024,1536,-32,0,W+64,SCREENING_WORLD_H);ctx.fillStyle='rgba(4,11,17,.39)';ctx.fillRect(0,0,W,SCREENING_WORLD_H);const shade=ctx.createLinearGradient(0,0,0,SCREENING_WORLD_H);shade.addColorStop(0,'rgba(4,10,16,.12)');shade.addColorStop(.58,'rgba(4,10,16,.04)');shade.addColorStop(1,'rgba(3,8,13,.2)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,SCREENING_WORLD_H);ctx.restore();}
    else for(let y=0;y<SCREENING_WORLD_H;y+=48){rect(0,y,W,2,'#263a42');rect(28,y+5,3,35,'#465252');rect(210,y+8,2,28,'#7d613c');}
  }
  function drawHrQuestioner(bot){
    if(!bot.alive)return;const x=Math.round(bot.x-camera),platformArtLift=room==='core'&&coreStage===2?5:0,groundY=Number.isFinite(bot.platformY)?bot.platformY+platformArtLift:bot.y+36,y=Math.round(groundY-36);if(y+42<cameraY||y>cameraY+H||x<-55||x>W+55)return;
    if(bot.state==='aim'){
      const tx=bot.targetX-camera,ty=bot.targetY;
      ctx.save();ctx.globalAlpha=.68;for(let t=.08;t<.98;t+=.12){const px=x+12+(tx-(x+12))*t,py=y+13+(ty-(y+13))*t-.5*118*t*t;rect(px-1,py-1,2,2,'#ffbc70');}ctx.restore();
    }
    // A soft contact shadow makes the recruiter's boots read as planted on the ledge.
    if(Number.isFinite(bot.platformY)){ctx.save();ctx.globalAlpha=.52;ctx.fillStyle='#07131a';ctx.beginPath();ctx.ellipse(x+12,bot.platformY+platformArtLift-camera,10,1.7,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    const frame=bot.state==='throw'?2:bot.state==='aim'?1:0;
    if(art.recruiters.complete&&art.recruiters.naturalWidth){
      const source=frame===0?{sx:100,sy:10,sw:440,sh:690}:frame===1?{sx:685,sy:10,sw:510,sh:690}:{sx:1265,sy:10,sw:900,sh:690};
      const dw=frame===2?48:frame===1?28:24,dh=37,dx=frame===2?x-18:frame===1?x-2:x;
      const look=player.x+player.w/2<x+12?-1:1;
      const walkFrame=frame===0?(Math.floor(time*8+bot.x*.035)&1):0;
      ctx.save();ctx.imageSmoothingEnabled=true;
      if(look>0){const pivot=x+12;ctx.translate(pivot,0);ctx.scale(-1,1);}
      const drawX=look>0?dx-(x+12):dx;
      if(frame===0){
        const upperSourceH=500,upperH=dh*upperSourceH/690,lowerH=dh-upperH;
        ctx.drawImage(art.recruiters,source.sx,source.sy,source.sw,upperSourceH,drawX,y,dw,upperH);
        if(walkFrame){ctx.save();ctx.translate(drawX+dw/2,y+upperH);ctx.scale(-1,1);ctx.drawImage(art.recruiters,source.sx,source.sy+upperSourceH,source.sw,source.sh-upperSourceH,-dw/2,0,dw,lowerH);ctx.restore();}
        else ctx.drawImage(art.recruiters,source.sx,source.sy+upperSourceH,source.sw,source.sh-upperSourceH,drawX,y+upperH,dw,lowerH);
      }else ctx.drawImage(art.recruiters,source.sx,source.sy,source.sw,source.sh,drawX,y,dw,dh);
      ctx.restore();
    }else{
      rect(x+4,y+28,7,7,'#342d31');rect(x+15,y+28,7,7,'#342d31');rect(x+2,y+12,22,18,'#26333a');rect(x+4,y+8,18,13,'#c89d78');rect(x+3,y+4,20,5,'#312e35');rect(x+11,y+13,3,2,'#e0b06c');
    }
    if(bot.state==='aim'){rect(x+10,y+9,5,5,'#d08a56');rect(x+11,y+10,3,3,'#f5ce88');}
  }
  function drawScreeningExit(){
    const x=SCREENING_EXIT_X-camera;if(x<-70||x>W+60)return;
    ctx.save();ctx.globalAlpha=.58;rect(x-24,SCREENING_EXIT_Y-3,92,2,'#d8b578');rect(x-24,SCREENING_EXIT_Y-3,2,5,'#e4c588');rect(x+66,SCREENING_EXIT_Y-3,2,5,'#e4c588');rect(x+19,SCREENING_EXIT_Y-6,5,3,'#ffe0a0');ctx.restore();
  }
  function drawScreening(){
    drawScreeningBack();for(const p of platforms)drawPlatform(p);drawScreeningTraps();for(const bot of flyingBots)drawFlyingBot(bot);for(const bot of hrQuestioners)drawHrQuestioner(bot);drawScreeningExit();
  }
  function screeningTrapState(trap){
    const phase=(time+trap.offset)%trap.period;
    return {warning:phase>trap.period-1.05,active:phase<.72};
  }
  function drawScreeningTraps(){
    for(const trap of screeningTraps){
      const {warning,active}=screeningTrapState(trap),x=trap.x-camera;
      if(x+trap.w<0||x>W||trap.y<cameraY-12||trap.y>cameraY+H+8)continue;
      ctx.save();
      const pulse=.65+.35*Math.sin(time*16);
      ctx.shadowColor=warning?'#d8a568':active?'#e6a557':'transparent';ctx.shadowBlur=warning?5:active?7:0;
      poly([[x-2,trap.y+3],[x+1,trap.y],[x+trap.w-1,trap.y],[x+trap.w+2,trap.y+3],[x+trap.w,trap.y+6],[x-1,trap.y+6]],'#252d32');
      rect(x+1,trap.y+1,trap.w-2,3,'#5e4836');rect(x+3,trap.y+1,trap.w-6,1,warning?'#e2b875':'#b18b58');
      ctx.shadowBlur=0;
      for(let sx=x+4;sx<x+trap.w-3;sx+=9){
        rect(sx,trap.y+2,2,2,'#343d40');rect(sx,trap.y+2,1,1,warning?'#f1cb83':'#b39262');
        if(active){poly([[sx,trap.y+2],[sx+2,trap.y-8],[sx+5,trap.y+2]],'#353d40');line(sx+1,trap.y+1,sx+2,trap.y-5,'#e5bd79');rect(sx+2,trap.y-6,1,2,'#ffe0a2');}
      }
      if(warning){ctx.globalAlpha=pulse;rect(x+3,trap.y-2,trap.w-6,1,'#f4d49c');}
      if(active){ctx.globalAlpha=.28;rect(x-2,trap.y-9,trap.w+4,9,'#dca767');}
      ctx.restore();
    }
  }
  function drawPortfolioBack(){
    rect(0,0,W,H,'#10202b');
    if(art.portfolioHall.complete&&art.portfolioHall.naturalWidth){
      // Pan across the full concept art so the two bridge breaks arrive with the camera.
      const img=art.portfolioHall,scale=PORTFOLIO_W/img.naturalWidth;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(img,-camera,-158,PORTFOLIO_W,img.naturalHeight*scale);ctx.restore();
      rect(0,0,W,H,'rgba(5,15,23,.36)');
      const shade=ctx.createLinearGradient(0,102,0,H);shade.addColorStop(0,'rgba(7,17,25,0)');shade.addColorStop(.52,'rgba(7,17,25,.08)');shade.addColorStop(1,'rgba(5,12,18,.54)');ctx.fillStyle=shade;ctx.fillRect(0,102,W,H-102);
    }else{rect(0,0,W,H,'#162b36');}
    // Slow distant drift adds depth without making the scenery compete with the player.
    rect(0,0,W,2,'rgba(226,185,119,.28)');
    drawPortfolioLift();
  }
  function drawPortfolioLift(){
    const x=26-camera,y=40,w=58,h=138;if(x+w<-4||x>W+4)return;
    // Open lift bay at the start of the hall: the player steps out onto the gallery bridge.
    ctx.save();const glow=ctx.createRadialGradient(x+w/2,y+78,3,x+w/2,y+78,48);glow.addColorStop(0,'rgba(225,167,86,.27)');glow.addColorStop(1,'rgba(225,167,86,0)');ctx.fillStyle=glow;ctx.fillRect(x-22,y+18,w+44,150);ctx.restore();
    rect(x-4,y+7,w+8,4,'#263943');rect(x-2,y+9,w+4,2,'#c2985f');rect(x,y+12,w,122,'#172832');
    rect(x+4,y+15,3,120,'#52645f');rect(x+w-7,y+15,3,120,'#52645f');rect(x+7,y+17,w-14,112,'#0a1820');
    // Warm cabin depth with the doors pulled open to either side.
    const cabin=ctx.createLinearGradient(0,y+22,0,y+127);cabin.addColorStop(0,'#c89253');cabin.addColorStop(.18,'#85694b');cabin.addColorStop(.72,'#26373b');cabin.addColorStop(1,'#101b22');ctx.fillStyle=cabin;ctx.fillRect(x+10,y+20,w-20,107);
    rect(x+12,y+22,2,101,'#e2b56e');rect(x+w-14,y+22,2,101,'#e2b56e');
    // Retracted bronze lift leaves and illuminated jambs.
    rect(x+4,y+22,9,99,'#34464a');rect(x+6,y+24,2,94,'#ba9560');rect(x+9,y+24,2,94,'#65736a');
    rect(x+w-13,y+22,9,99,'#34464a');rect(x+w-8,y+24,2,94,'#ba9560');rect(x+w-11,y+24,2,94,'#65736a');
    for(let dy=35;dy<118;dy+=22){rect(x+16,y+dy,w-32,1,'rgba(238,197,129,.4)');}
    rect(x+18,y+3,22,5,'#182831');rect(x+20,y+4,12,2,'#7f8c7b');rect(x+34,y+4,4,2,'#d7a554');rect(x+38,y+4,2,2,'#f0cb78');
    rect(x-2,y+132,w+4,3,'#d2ae70');rect(x+3,y+135,w-6,2,'#465b58');rect(x+7,y+137,w-14,2,'#22333a');
    for(let dx=10;dx<w-8;dx+=12){rect(x+dx,y+130,2,2,'#e2c17c');}
  }
  function portfolioBotSize(bot){return bot.kind==='heavy'?{w:39,h:42}:bot.kind==='flyer'?{w:31,h:27}:{w:25,h:34};}
  function portfolioBotBounds(bot){const size=portfolioBotSize(bot);return{x:bot.x+2,y:bot.y+2,w:size.w-4,h:size.h-3};}
  function drawPortfolioCritic(bot){
    const size=portfolioBotSize(bot),x=Math.round(bot.x-camera),y=Math.round(bot.y+(bot.kind==='flyer'?Math.sin(time*2.4+bot.phase)*3:0));if(x<-48||x>W+48||!bot.alive)return;
    const firing=bot.state==='aim';
    if(firing){ctx.save();ctx.globalAlpha=.38;line(x+size.w/2,y+size.h*.42,player.x+player.w/2-camera,player.y+player.h/2,'#ef8669');ctx.restore();}
    if(art.portfolioRobots.complete&&art.portfolioRobots.naturalWidth){
      const source=bot.kind==='walker'?[38,48,480,765]:bot.kind==='flyer'?[557,42,590,520]:[1150,4,765,807];
      ctx.save();ctx.imageSmoothingEnabled=true;if(bot.dir<0){ctx.translate(x+size.w,y);ctx.scale(-1,1);ctx.drawImage(art.portfolioRobots,...source,0,0,size.w,size.h);}else ctx.drawImage(art.portfolioRobots,...source,x,y,size.w,size.h);
      if(firing){ctx.globalAlpha=.42;ctx.fillStyle='#ff775e';ctx.fillRect(x+size.w*.45,y+size.h*.28,size.w*.16,2);}ctx.restore();
    }else{
      rect(x+3,y+4,size.w-6,size.h-8,'#35444a');rect(x+6,y+7,size.w-12,size.h-15,firing?'#b35e47':'#748e88');rect(x+size.w*.42,y+size.h*.32,4,4,'#f2c16d');
      if(bot.kind!=='flyer'){rect(x+5,y+size.h-5,5,5,'#29383b');rect(x+size.w-10,y+size.h-5,5,5,'#29383b');}
    }
  }
  function drawPortfolioRock(rock){
    const x=rock.x-camera,y=rock.y,w=rock.w,h=rock.h;if(x+w<-5||x>W+5)return;
    ctx.save();ctx.globalAlpha=.65;ctx.fillStyle='#080f14';ctx.beginPath();ctx.ellipse(x+w/2,FLOOR-1,w*.66,3.4,0,0,Math.PI*2);ctx.fill();ctx.restore();
    const body=['#69685b','#747166','#625f54'][rock.shade%3],top=['#a59a7a','#b0a181','#988b6d'][rock.shade%3];
    const silhouette=[[x+1,y+h-2],[x+2,y+12],[x+6,y+8],[x+8,y+4],[x+14,y+2],[x+17,y],[x+22,y+4],[x+28,y+1],[x+w-7,y+3],[x+w-3,y+9],[x+w-1,y+15],[x+w-3,y+h-2]];
    ctx.save();ctx.lineJoin='round';ctx.lineWidth=1.5;ctx.strokeStyle='#27363a';ctx.beginPath();ctx.moveTo(silhouette[0][0],silhouette[0][1]);for(let i=1;i<silhouette.length;i++)ctx.lineTo(silhouette[i][0],silhouette[i][1]);ctx.closePath();ctx.fillStyle=body;ctx.fill();ctx.stroke();ctx.restore();
    poly([[x+4,y+12],[x+8,y+6],[x+15,y+3],[x+19,y+6],[x+14,y+12],[x+7,y+16]],top);
    poly([[x+19,y+6],[x+28,y+3],[x+w-8,y+5],[x+w-4,y+10],[x+22,y+14]],'#8e8870');
    poly([[x+7,y+17],[x+15,y+13],[x+22,y+15],[x+19,y+h-4],[x+5,y+h-4]],'#4c514b');
    poly([[x+23,y+15],[x+w-5,y+11],[x+w-4,y+h-4],[x+20,y+h-3]],'#424b48');
    // Sharp warm rim-light and a few chips keep the obstacle readable over the glazed walkway.
    line(x+4,y+12,x+8,y+6,'#d5b775');line(x+8,y+6,x+15,y+3,'#d5b775');line(x+15,y+3,x+18,y+4,'#c5a86e');
    line(x+28,y+3,x+w-8,y+5,'#c4a66d');line(x+w-8,y+5,x+w-4,y+10,'#b39560');
    line(x+9,y+10,x+12,y+14,'#414a46');line(x+12,y+14,x+10,y+17,'#414a46');line(x+29,y+8,x+27,y+12,'#343f40');
    rect(x+5,y+h-4,w-10,2,'#343f3e');rect(x+4,y+h-2,w-8,1,'#c2a36b');
    rect(x+10,y+8,2,2,'#e1c582');rect(x+11,y+10,1,4,'#353f3c');rect(x+w-11,y+6,2,2,'#d2b36f');rect(x+w-10,y+8,1,3,'#3c4541');
    poly([[x+2,y+h-1],[x+5,y+h-1],[x+3,y+h-4]],'#978866');poly([[x+w-3,y+h-1],[x+w-1,y+h-1],[x+w-4,y+h-4]],'#978866');
  }
  function portfolioLaserPosition(beam){return beam.x+Math.sin(time*beam.speed+beam.phase)*beam.range;}
  function portfolioLaserState(beam){const cycle=(time+beam.phase)%6.4;return{active:cycle<1.2,warning:cycle>=1.2&&cycle<2.5};}
  function drawPortfolioLasers(){
    for(const beam of portfolioLasers){const x=portfolioLaserPosition(beam),{active,warning}=portfolioLaserState(beam),visibleX=x-camera;if(visibleX<-12||visibleX>W+12)continue;
      const pulse=.65+.35*Math.sin(time*18),danger=active?'#ff705e':'#ffc477',idle='#73c8c0';
      // Sliding ceiling carriage and floor receiver match the brass-trimmed gallery bridge.
      rect(visibleX-9,25,18,5,'#253943');rect(visibleX-7,24,14,2,'#899183');rect(visibleX-5,26,10,3,'#4a5d5a');
      rect(visibleX-3,27,6,3,warning||active?danger:'#91a294');rect(visibleX-1,27,2,2,warning||active?'#ffe0a0':'#d1bd87');
      rect(visibleX-2,30,4,2,'#3a4b49');rect(visibleX-7,31,2,2,'#c39d60');rect(visibleX+5,31,2,2,'#c39d60');
      if(active){
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowColor='#ff705e';ctx.shadowBlur=11;rect(visibleX-5,32,10,FLOOR-35,'rgba(244,99,79,.16)');rect(visibleX-2,32,4,FLOOR-35,'rgba(255,119,91,.52)');rect(visibleX-1,32,2,FLOOR-35,'#ffd08a');ctx.restore();
        // Traveling hot flecks add a little motion to the beam without obscuring the scene.
        for(let i=0;i<4;i++){const fy=34+((time*46+i*31)%(FLOOR-40));ctx.globalAlpha=.6;rect(visibleX-1+(i%2)*2,fy,1,2,i%2?'#ffe3a1':'#ff8b68');}ctx.globalAlpha=1;
      }else if(warning){
        ctx.save();ctx.globalAlpha=.38+.45*pulse;ctx.shadowColor='#ffc477';ctx.shadowBlur=5;rect(visibleX-2,32,4,FLOOR-35,'rgba(255,190,111,.28)');ctx.restore();
        for(let yy=35;yy<FLOOR-5;yy+=9)rect(visibleX-1,yy,2,3,'#f2bb74');
        rect(visibleX-5,FLOOR-8,10,1,'#ffc477');rect(visibleX-3,FLOOR-10,6,1,'#ffc477');
      }else{
        ctx.save();ctx.globalAlpha=.17;rect(visibleX-1,32,2,FLOOR-35,idle);ctx.restore();
      }
      // Receiver is a raised brass-and-steel socket bolted into the bridge deck.
      rect(visibleX-8,FLOOR-3,16,4,'#2b3d40');rect(visibleX-6,FLOOR-5,12,3,'#748077');rect(visibleX-4,FLOOR-4,8,2,active?'#e96e59':warning?'#e3b070':'#5a827d');
      rect(visibleX-2,FLOOR-3,4,1,active?'#ffe0a0':warning?'#ffe0a0':'#90d0c4');rect(visibleX-7,FLOOR-2,2,1,'#c49d62');rect(visibleX+5,FLOOR-2,2,1,'#c49d62');
    }
  }
  function drawPortfolioExit(){
    const x=PORTFOLIO_EXIT_X-camera,base=PORTFOLIO_EXIT_Y;if(x<-60||x>W+60)return;
    // A glass-and-bronze executive portal, sized to read as the next threshold rather than an old pixel door.
    ctx.save();const haze=ctx.createRadialGradient(x+18,base-26,1,x+18,base-26,48);haze.addColorStop(0,'rgba(221,169,91,.28)');haze.addColorStop(1,'rgba(221,169,91,0)');ctx.fillStyle=haze;ctx.fillRect(x-28,base-72,92,78);ctx.restore();
    poly([[x-9,base],[x-9,base-43],[x-5,base-56],[x+3,base-64],[x+18,base-68],[x+33,base-64],[x+41,base-55],[x+45,base-42],[x+45,base]],'#253a40');
    poly([[x-5,base],[x-5,base-43],[x-1,base-54],[x+6,base-61],[x+18,base-65],[x+30,base-61],[x+37,base-53],[x+41,base-42],[x+41,base]],'#b28e58');
    poly([[x,base],[x,base-42],[x+4,base-51],[x+10,base-57],[x+18,base-60],[x+27,base-57],[x+33,base-50],[x+36,base-41],[x+36,base]],'#10222b');
    const glass=ctx.createLinearGradient(x,base-58,x+36,base-4);glass.addColorStop(0,'#29434a');glass.addColorStop(.42,'#132a33');glass.addColorStop(1,'#08171f');ctx.fillStyle=glass;ctx.fillRect(x+4,base-43,28,41);
    rect(x+7,base-50,22,2,'#d9b675');rect(x+9,base-46,18,1,'#7cc1b8');rect(x+8,base-38,1,26,'rgba(227,189,118,.55)');rect(x+27,base-38,1,26,'rgba(227,189,118,.35)');
    rect(x+10,base-29,16,1,'rgba(119,190,179,.64)');rect(x+12,base-23,12,1,'rgba(119,190,179,.38)');rect(x+14,base-14,8,5,'#20363b');rect(x+17,base-13,2,3,'#e7bd72');
    for(const side of [x-3,x+36]){rect(side,base-35,4,11,'#4b605b');rect(side+1,base-33,2,7,'#d0a45f');rect(side,base-19,4,12,'#4b605b');rect(side+1,base-17,2,8,'#8cb2a3');}
    rect(x-13,base-2,62,4,'#d7b572');rect(x-10,base+1,56,3,'#425b59');rect(x-7,base+3,50,1,'#94aa91');
    rect(x+2,base-66,32,3,'#304448');rect(x+5,base-65,26,1,'#ebc77b');
  }
  function drawPortfolio(){
    drawPortfolioBack();drawAtmosphere();drawArchivePits();for(const p of platforms)drawPlatform(p);for(const rock of portfolioRocks)drawPortfolioRock(rock);drawPortfolioLasers();
    // Catwalk undersides are drawn as narrow trusses above; keep the climb open and airy.
    for(const bot of portfolioCritics)drawPortfolioCritic(bot);
    for(const q of hostileShots)if(q.kind==='bundle'&&q.falling){const x=q.x-camera;rect(x-4,FLOOR-7,34,2,'#c77a8d');txt('КЕЙС!',x+13,FLOOR-10,4,'#e5a0ac','center');}
    drawPortfolioExit();
  }

  function drawHero(){
    const p=player,x=Math.round(p.x-camera),y=Math.round(p.y);const step=Math.floor(p.run*9)%2;const hurt=p.hurt>0&&Math.floor(time*18)%2===0;
    if(art.hero.complete&&art.hero.naturalWidth){
      const movingPose=mode==='play'&&art.heroRun.complete&&!p.crouching&&(!p.ground||Math.abs(p.vx)>3),runFrame=movingPose&&(!p.ground||Math.floor(time*8)%2===1);
      // Align the painted soles to the scene floor; this affects only rendering, not collision or jump height.
      const feet=y+p.h+(p.ground&&(room!=='screening'||p.standing?.y>=SCREENING_FLOOR)?5:0),drawH=p.crouching?25:36,drawY=feet-drawH;
      if(!p.ground){const shadowY=room==='screening'?Math.min(SCREENING_FLOOR,p.y+p.h+24):FLOOR,alpha=Math.max(.08,.22-(shadowY-(p.y+p.h))*.002);ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#080f15';ctx.beginPath();ctx.ellipse(x+p.w/2,shadowY+1,10,2.5,0,0,Math.PI*2);ctx.fill();ctx.restore();}
      ctx.save();ctx.imageSmoothingEnabled=true;if(mode==='play'&&hurt)ctx.globalAlpha=.55;
      if(runFrame){
        const drawW=34,drawX=x+(p.w-drawW)/2,srcX=250,srcY=8,srcW=900,srcH=936;
        if(p.face<0){ctx.translate(drawX+drawW,0);ctx.scale(-1,1);ctx.drawImage(art.heroRun,srcX,srcY,srcW,srcH,0,drawY,drawW,drawH);}
        else ctx.drawImage(art.heroRun,srcX,srcY,srcW,srcH,drawX,drawY,drawW,drawH);
      }else if(p.face<0){ctx.translate(x+22,0);ctx.scale(-1,1);ctx.drawImage(art.hero,385,10,690,990,0,drawY,27,drawH);}
      else ctx.drawImage(art.hero,385,10,690,990,x-5,drawY,27,drawH);
      ctx.restore();return;
    }
    ctx.save();if(p.crouching){const feet=y+23;ctx.translate(0,feet);ctx.scale(1,.62);ctx.translate(0,-feet);}
    if(mode==='play'&&hurt)rect(x-1,y-1,18,24,'#f3e7cd');
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
  function drawResumeShot(q){const x=q.x-camera,y=q.y;if(x<-40||x>W+40)return;if(q.kind==='rock'){const cx=x+q.w/2,cy=y+q.h/2;ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(q.vy,q.vx));ctx.shadowColor='#e6a35e';ctx.shadowBlur=5;ctx.fillStyle='#514b43';ctx.beginPath();ctx.moveTo(-6,-2);ctx.lineTo(-3,-6);ctx.lineTo(3,-5);ctx.lineTo(6,-1);ctx.lineTo(5,4);ctx.lineTo(0,6);ctx.lineTo(-5,3);ctx.closePath();ctx.fill();ctx.strokeStyle='#a69472';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#d0ba8d';ctx.fillRect(-2,-4,3,2);ctx.restore();return;}if(room==='core'&&coreStage===1&&q.kind==='resume'){const cx=x+q.w/2,cy=y+q.h/2,angle=Math.atan2(q.vy,q.vx);ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);ctx.shadowColor='#ff6c48';ctx.shadowBlur=7;ctx.fillStyle='#ed6d4d';ctx.beginPath();ctx.ellipse(0,0,7,4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe5a6';ctx.beginPath();ctx.ellipse(1,0,2,1.5,0,0,Math.PI*2);ctx.fill();ctx.restore();return;}if(q.kind==='question'){const cx=x+q.w/2,cy=y+q.h/2;ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(q.vy,q.vx));ctx.shadowColor='#c84f51';ctx.shadowBlur=5;ctx.fillStyle='#493b3c';ctx.beginPath();ctx.moveTo(-q.w/2-2,-q.h/2+1);ctx.lineTo(q.w/2-2,-q.h/2);ctx.lineTo(q.w/2+3,-q.h/2+4);ctx.lineTo(q.w/2+2,q.h/2-1);ctx.lineTo(-q.w/2,q.h/2+1);ctx.closePath();ctx.fill();ctx.fillStyle='#d8c6a3';ctx.beginPath();ctx.moveTo(-q.w/2,-q.h/2);ctx.lineTo(q.w/2-3,-q.h/2+1);ctx.lineTo(q.w/2+1,q.h/2-2);ctx.lineTo(-q.w/2+1,q.h/2);ctx.closePath();ctx.fill();ctx.strokeStyle='#8a6558';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#9b3e48';ctx.fillRect(-3,-2,7,5);ctx.fillStyle='#edb5a0';ctx.fillRect(-2,-1,5,1);ctx.fillStyle='#8a7566';ctx.fillRect(-q.w/2+3,-q.h/2+3,5,1);ctx.fillRect(-q.w/2+3,1,4,1);ctx.restore();return;}if(q.kind==='orb'){rect(x-2,y-1,14,14,'#461b29');rect(x,y-2,10,13,'#d45257');rect(x+2,y,6,8,'#ffb46c');rect(x+3,y+2,3,3,'#fff0c8');rect(x-5,y+4,4,4,'#f08b68');return;}if(q.kind==='comment'){rect(x-2,y-2,q.w+4,q.h+4,'#27333a');rect(x,y,q.w,q.h,'#eee4d2');rect(x+3,y+3,q.w-6,1,'#8d7775');rect(x+3,y+6,q.w-10,1,'#948d82');txt(q.label||'МЕЛКО?',x+q.w/2,y+q.h-2,4,'#6b444b','center');return;}if(q.kind==='contract'){rect(x-2,y-2,q.w+4,q.h+4,'#443927');rect(x,y,q.w,q.h,'#d8c69b');rect(x+3,y+3,q.w-6,2,'#907a4f');rect(x+3,y+7,q.w-9,1,'#776c5d');rect(x+3,y+10,q.w-8,1,'#776c5d');txt('ГПХ',x+q.w/2,y+q.h-2,5,'#7b3538','center');return;}if(q.kind==='cursor'){ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(q.vy,q.vx));fx('bullet-tracer',-18,-4,36,8,time*1.8);ctx.restore();return;}if(q.kind==='stamp'){rect(x,y,q.w,5,'#465862');rect(x+3,y+5,q.w-6,4,'#8d8a7d');rect(x+5,y+9,q.w-10,14,'#bb514d');rect(x+8,y+11,q.w-16,3,'#e6ba9b');txt('ОТКАЗ',x+q.w/2,y+19,4,'#401f2a','center');rect(x+10,y+23,q.w-20,2,'#5c686a');return;}rect(x-3,y+3,12,3,'#d9c8a7');rect(x,y,11,8,'#e7dbc5');rect(x+1,y+1,8,1,'#a8a08e');rect(x+1,y+3,6,1,'#8b8276');rect(x+1,y+5,7,1,'#a99b85');rect(x+7,y+1,2,2,'#b44d4d');rect(x+3,y+7,9,2,'#5f6b70');}
  const drawGenericResumeShot=drawResumeShot;
  drawResumeShot=function(q){
    if(room==='core'&&coreStage===2&&q.kind==='reviewRay'){const x=q.x-camera,y=q.y,cx=x+q.w/2,cy=y+q.h/2;if(x<-30||x>W+30)return;ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(q.vy,q.vx));ctx.shadowColor='#ff625b';ctx.shadowBlur=8;rect(-q.w/2,-2,q.w,4,'#b7474d');rect(-q.w/2+2,-1,q.w-4,2,'#ffc47a');rect(-q.w/2+q.w*.68,-2,3,4,'#fff0c8');ctx.restore();return;}
    if(q.kind==='portfolioBolt'){const x=q.x-camera,y=q.y,cx=x+q.w/2,cy=y+q.h/2;if(x<-20||x>W+20)return;ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(q.vy,q.vx));ctx.shadowColor='#ffae67';ctx.shadowBlur=7;ctx.fillStyle='#f08b5c';ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(-1,-3);ctx.lineTo(5,-2);ctx.lineTo(7,0);ctx.lineTo(3,3);ctx.lineTo(-3,2);ctx.closePath();ctx.fill();ctx.fillStyle='#ffe4a4';ctx.fillRect(-1,-1,4,2);ctx.restore();return;}
    if(room==='core'&&coreStage===3&&(q.kind==='comment'||q.kind==='shard')){
      const x=q.x-camera,y=q.y,cx=x+q.w/2,cy=y+q.h/2;if(x<-40||x>W+40)return;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(q.vy,q.vx)+((time*4+q.spin)||0));ctx.shadowColor='#f06a68';ctx.shadowBlur=7;
      ctx.beginPath();ctx.moveTo(-q.w*.46,0);ctx.lineTo(-q.w*.14,-q.h*.48);ctx.lineTo(q.w*.38,-q.h*.36);ctx.lineTo(q.w*.5,0);ctx.lineTo(q.w*.1,q.h*.48);ctx.lineTo(-q.w*.38,q.h*.3);ctx.closePath();ctx.fillStyle='#26383e';ctx.fill();ctx.strokeStyle='#d7a76b';ctx.lineWidth=1.5;ctx.stroke();
      ctx.beginPath();ctx.moveTo(-q.w*.25,q.h*.16);ctx.lineTo(-q.w*.08,-q.h*.3);ctx.lineTo(q.w*.36,-q.h*.34);ctx.lineTo(q.w*.04,-q.h*.07);ctx.closePath();ctx.fillStyle='rgba(238,115,105,.76)';ctx.fill();ctx.beginPath();ctx.moveTo(-q.w*.12,q.h*.27);ctx.lineTo(q.w*.33,-q.h*.2);ctx.strokeStyle='rgba(255,221,159,.85)';ctx.lineWidth=1;ctx.stroke();ctx.restore();return;
    }
    if(room==='core'&&coreStage===3&&q.kind==='brush'){
      const x=q.x-camera,y=q.y,cx=x+q.w/2,cy=y+q.h/2;if(x<-48||x>W+48)return;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(q.vy,q.vx));ctx.shadowColor='#f05f58';ctx.shadowBlur=8;
      ctx.beginPath();ctx.moveTo(-q.w*.55,-q.h*.08);ctx.quadraticCurveTo(-q.w*.12,-q.h*.43,q.w*.12,-q.h*.16);ctx.lineTo(q.w*.5,-q.h*.05);ctx.lineTo(q.w*.14,q.h*.12);ctx.quadraticCurveTo(-q.w*.16,q.h*.4,-q.w*.55,q.h*.08);ctx.closePath();ctx.fillStyle='#c84f55';ctx.fill();
      ctx.beginPath();ctx.moveTo(-q.w*.35,0);ctx.quadraticCurveTo(0,-q.h*.09,q.w*.38,-q.h*.04);ctx.strokeStyle='#ffd18a';ctx.lineWidth=Math.max(1,q.h*.12);ctx.lineCap='round';ctx.stroke();
      ctx.beginPath();ctx.moveTo(-q.w*.48,q.h*.15);ctx.lineTo(-q.w*.28,q.h*.19);ctx.moveTo(q.w*.31,-q.h*.2);ctx.lineTo(q.w*.49,-q.h*.16);ctx.strokeStyle='rgba(244,157,117,.9)';ctx.lineWidth=1;ctx.stroke();ctx.restore();return;
    }
    drawGenericResumeShot(q);
  };
  function drawBullet(q){
    const x=Math.round(q.x-camera),y=Math.round(q.y),screenY=y-(room==='screening'?cameraY:0);if(x<-32||x>W+32||screenY<-16||screenY>H+16)return;
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(q.vy,q.vx));
    if((room==='archive'||room==='screening'||room==='portfolio'||room==='core'&&(coreStage===1||coreStage===2||coreStage===3))&&art.hero.complete){ctx.shadowColor='#ffd17c';ctx.shadowBlur=8;ctx.fillStyle='#ffd17c';ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(3,-2);ctx.lineTo(10,0);ctx.lineTo(3,2);ctx.closePath();ctx.fill();rect(-5,-1,8,1,'#fff4c8');ctx.restore();return;}
    if(!window.PixelFXAssets?.draw('bullet-tracer',ctx,time*1.7,-22,-5,44,10,{frame:Math.floor(time*18)%18})) {rect(-9,-1,5,2,'#75c8c3');rect(-4,-2,8,4,'#c3dc70');rect(-2,-1,5,2,'#fff0c8');}
    ctx.restore();
  }
  function drawParticles(){for(const p of particles){if(p.life<=0)continue;const x=Math.round(p.x-camera),y=Math.round(p.y);if(p.fx){fx('hit-spark',x-20,y-12,40,24,p.age*2);continue;}rect(x,y,p.size||2,p.size||2,p.color);}}
  function drawAim(){if(mode!=='play'||!mouse.aiming)return;const x=Math.round(mouse.aimX),y=Math.round(mouse.aimY);rect(x-6,y-1,4,2,'#c3dc70');rect(x+3,y-1,4,2,'#c3dc70');rect(x-1,y-6,2,4,'#c3dc70');rect(x-1,y+3,2,4,'#c3dc70');rect(x-1,y-1,2,2,'#fff0c8');}

  function drawAct3BossFloor(){
    const floorTop=FLOOR-7;
    ctx.save();ctx.beginPath();ctx.rect(0,floorTop,W,H-floorTop);ctx.clip();
    const under=ctx.createLinearGradient(0,FLOOR+18,0,H);under.addColorStop(0,'#28383a');under.addColorStop(.48,'#1e2b31');under.addColorStop(1,'#101a22');ctx.fillStyle=under;ctx.fillRect(0,FLOOR+18,W,H-FLOOR-18);
    if(art.portfolioPlatforms.complete&&art.portfolioPlatforms.naturalWidth){ctx.imageSmoothingEnabled=true;for(let x=0;x<W;x+=132)ctx.drawImage(art.portfolioPlatforms,674,330,526,128,x,floorTop,132,32);}
    else{rect(0,FLOOR-4,W,7,'#344447');rect(0,FLOOR-6,W,2,'#d49a57');}
    rect(0,FLOOR+19,W,2,'rgba(9,17,23,.68)');
    for(let x=12;x<W;x+=44){rect(x,FLOOR+23,1,H-FLOOR-24,'rgba(126,151,142,.16)');rect(x+4,FLOOR+25,12,1,'rgba(213,158,84,.18)');}
    rect(0,H-3,W,1,'rgba(198,145,76,.34)');ctx.restore();
  }
  function drawCreativePhase2Backdrop(){
    if(art.hrBasement.complete&&art.hrBasement.naturalWidth){ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(art.hrBasement,320,0,1350,790,0,0,W,FLOOR);const shade=ctx.createLinearGradient(0,0,0,FLOOR);shade.addColorStop(0,'rgba(4,12,18,.38)');shade.addColorStop(.68,'rgba(6,15,20,.18)');shade.addColorStop(1,'rgba(5,12,16,.34)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,FLOOR);ctx.restore();}
    else rect(0,0,W,FLOOR,'#101923');
    drawAct3BossFloor();
  }
  function drawOfferFloor(){
    const floor=ctx.createLinearGradient(0,FLOOR,0,H);floor.addColorStop(0,'#344044');floor.addColorStop(.18,'#29363b');floor.addColorStop(1,'#151e25');ctx.fillStyle=floor;ctx.fillRect(0,FLOOR,W,H-FLOOR);
    rect(0,FLOOR,W,2,'#776344');rect(0,FLOOR+2,W,1,'rgba(203,165,104,.62)');
    const reflection=ctx.createRadialGradient(W/2,FLOOR,2,W/2,FLOOR+14,118);reflection.addColorStop(0,'rgba(229,177,97,.18)');reflection.addColorStop(1,'rgba(229,177,97,0)');ctx.fillStyle=reflection;ctx.fillRect(W/2-120,FLOOR,W/2+120,H-FLOOR);
    for(let y=FLOOR+12;y<H;y+=14){const inset=(y-FLOOR)*.23;line(inset,y,W-inset,y,'rgba(11,19,25,.32)');}
    for(let x=24;x<W;x+=48){line(x,FLOOR+5,x+8,H,'rgba(177,150,104,.12)');line(x+9,FLOOR+5,x+17,H,'rgba(8,16,22,.18)');}
    rect(0,H-2,W,2,'rgba(8,13,19,.52)');
  }
  function drawOfferBackdrop(){
    if(art.hrBasement.complete&&art.hrBasement.naturalWidth){ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(art.hrBasement,320,0,1350,790,0,0,W,FLOOR);const shade=ctx.createLinearGradient(0,0,0,FLOOR);shade.addColorStop(0,'rgba(4,12,18,.38)');shade.addColorStop(.68,'rgba(6,15,20,.18)');shade.addColorStop(1,'rgba(5,12,16,.34)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,FLOOR);ctx.restore();}
    else rect(0,0,W,FLOOR,'#101923');
    drawOfferFloor();
  }
  function creativeFallMotion(){
    const elapsed=Math.max(0,2.25-(boss?.phaseTransition||0)),t=Math.max(0,Math.min(1,elapsed/2.25)),smooth=v=>v*v*(3-2*v),oldAlpha=1-smooth(Math.min(1,t/.48)),newAlpha=smooth(Math.max(0,Math.min(1,(t-.42)/.48))),dropOut=smooth(Math.min(1,t/.34)),dropIn=smooth(Math.max(0,Math.min(1,(t-.48)/.52))),heroTarget=player?player.y:FLOOR-34,bossTarget=boss?.y??50,heroFrom=-player?.h-24,bossFrom=-(boss?.h||95)-18;
    const heroY=t<.38?heroTarget+dropOut*112:t<.48?heroTarget+112:heroFrom+(heroTarget-heroFrom)*dropIn;
    const bossY=t<.38?bossTarget+dropOut*78:t<.48?bossTarget+78:bossFrom+(bossTarget-bossFrom)*dropIn;
    const actorAlpha=t<.34?1:t<.52?1-(t-.34)/.18:t<.57?0:Math.min(1,(t-.57)/.12);
    return{elapsed,t,oldAlpha,newAlpha,heroY,bossY,actorAlpha,shake:elapsed<.72?Math.sin(time*48)*(1-elapsed/.72)*1.7:0,crack:Math.max(0,Math.min(1,elapsed/.32))};
  }

  function drawCoreBack(){
    if(coreStage===1&&art.arena.complete){
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(art.arena,0,0,W,H);
      const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(4,9,16,.16)');shade.addColorStop(.7,'rgba(4,9,16,.20)');shade.addColorStop(1,'rgba(4,9,16,.48)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);ctx.restore();drawAtsPit();return;
    }
    if(coreStage===2&&art.hrArena.complete&&art.hrArena.naturalWidth){
      ctx.save();ctx.imageSmoothingEnabled=true;rect(0,0,W,H,'#14232e');ctx.globalAlpha=.58;ctx.drawImage(art.hrArena,0,0,W,H);ctx.globalAlpha=1;rect(0,0,W,H,'rgba(7,17,29,.42)');
      const haze=ctx.createLinearGradient(0,18,0,166);haze.addColorStop(0,'rgba(101,152,165,.08)');haze.addColorStop(.56,'rgba(61,107,122,.04)');haze.addColorStop(1,'rgba(7,16,25,.24)');ctx.fillStyle=haze;ctx.fillRect(0,18,W,148);ctx.restore();return;
    }
    if(coreStage===2&&art.hrBasement.complete&&art.hrBasement.naturalWidth){
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(art.hrBasement,0,0,W,H);rect(0,0,W,H,'rgba(4,11,17,.22)');
      const haze=ctx.createLinearGradient(0,18,0,166);haze.addColorStop(0,'rgba(21,35,44,.12)');haze.addColorStop(.55,'rgba(9,19,26,.04)');haze.addColorStop(1,'rgba(4,11,17,.25)');ctx.fillStyle=haze;ctx.fillRect(0,18,W,148);ctx.restore();return;
    }
    if(boss?.variant==='ceo'){
      rect(0,0,W,H,'#0c1018');rect(0,22,W,145,'#171d27');
      for(let i=0;i<5;i++){const x=10+i*76;rect(x,38,68,82,'#2a343b');rect(x+4,42,60,73,'#0d1720');for(let j=0;j<4;j++){rect(x+8+j*14,54+(j%2)*8,8,2,'#80908c');rect(x+8+j*14,66+(j%2)*8,8,2,'#596a70');}}
      rect(24,29,336,4,'#655a4a');rect(31,34,322,2,'#b39a6f');for(let x=42;x<350;x+=44)rect(x,37,2,16,'#c9aa73');
      rect(0,FLOOR,W,3,'#b8a174');rect(0,FLOOR+3,W,4,'#58636a');rect(0,FLOOR+7,W,H-FLOOR-7,'#101721');for(let x=0;x<W;x+=32){rect(x,FLOOR+10,1,H-FLOOR-10,'#34414a');rect(x+4,FLOOR+12,2,1,'#9b8a68');}
      fx('hologram',112,28,164,108,time*.35,{alpha:.16});return;
    }
    if(coreStage===3&&portfolioFinale){drawOfferBackdrop();return;}
    if(boss?.variant==='creative'&&boss.phase>=2){drawCreativePhase2Backdrop();return;}
    if(boss?.variant==='creative'){
      if(art.portfolioBossArena.complete&&art.portfolioBossArena.naturalWidth){
        // Keep the castle's pointed arch visible while cropping its own stone floor to the gameplay baseline.
        ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(art.portfolioBossArena,59,0,1547,870,0,0,W,H);
        const shade=ctx.createLinearGradient(0,18,0,H);shade.addColorStop(0,'rgba(3,10,18,.08)');shade.addColorStop(.68,'rgba(3,10,18,.04)');shade.addColorStop(1,'rgba(3,10,18,.16)');ctx.fillStyle=shade;ctx.fillRect(0,18,W,H-18);ctx.restore();return;
      }
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
  function drawArenaPlatform(p){const x=p.x;if(coreStage===1&&art.arena.complete){if(p.kind==='arena')drawFantasyGround(x,p.y,p.w,p.h);else drawFantasyLedge(x,p.y,p.w,p.h,p.kind,p.shake||0);return;}if(coreStage===2){if(p.kind==='arena'){rect(x,p.y,p.w,2,'#b49665');rect(x,p.y+2,p.w,p.h-2,'#29343a');for(let gx=x+8;gx<x+p.w;gx+=30){rect(gx,p.y+7,1,Math.max(0,p.h-7),'rgba(199,164,105,.26)');rect(gx+5,p.y+14,7,1,'rgba(154,129,91,.3)');}return;}rect(x,p.y,p.w,7,'#303b3d');rect(x+1,p.y-2,p.w-2,2,'#bd9d67');rect(x+3,p.y+2,p.w-6,2,'#475351');rect(x+5,p.y+7,p.w-10,2,'#18232a');for(let i=x+9;i<x+p.w-8;i+=14){rect(i,p.y-1,2,1,'#e0c28b');rect(i+5,p.y+4,2,1,'#81908a');}return;}if(p.kind==='arena'){rect(x,p.y,p.w,3,'#c6ae7a');rect(x,p.y+3,p.w,p.h-3,'#18272d');for(let gx=x+8;gx<x+p.w;gx+=31){rect(gx,p.y+8,1,Math.max(0,p.h-8),'rgba(151,137,104,.25)');rect(gx+5,p.y+15,7,1,'rgba(94,132,125,.3)');}return;}const danger=p.kind==='crumble'&&p.timer>0&&Math.sin(time*28)>0;rect(x,p.y,p.w,8,danger?'#a74e55':'#5e6b70');rect(x+2,p.y-2,p.w-4,2,danger?'#e07a70':'#a69c84');rect(x+4,p.y+3,p.w-8,2,'#2e414b');for(let i=x+8;i<x+p.w-5;i+=12){rect(i,p.y-1,2,1,'#d2c4a5');rect(i+4,p.y+4,1,2,'#76827e');}if(danger){line(x+9,p.y+1,x+19,p.y+7,'#e9a08a');line(x+31,p.y+1,x+39,p.y+7,'#e9a08a');}}
  function drawAct3BossPlatform(p){
    if(p.active===false)return;
    const shake=p.timer>0?Math.sin(time*34)*.65:0;
    if(art.portfolioPlatforms.complete&&art.portfolioPlatforms.naturalWidth){
      ctx.save();ctx.imageSmoothingEnabled=true;
      ctx.drawImage(art.portfolioPlatforms,674,330,526,128,p.x-camera+shake,p.y-7,p.w,Math.max(11,p.w*.235));
      ctx.restore();
      return;
    }
    drawArenaPlatform(p);
  }
  function drawBoss(){
    if(!boss)return;const b=boss,x=Math.round(b.x),bob=b.variant==='hr'?0:b.state==='tell'?Math.sin(time*18)*1:Math.sin(time*2.4)*1.5;const y=Math.round(b.y+bob);const hurtFlash=b.state==='hurt'&&Math.floor(time*24)%2===0;
    if(b.variant==='hr'){drawHrBoss(b,x,y,hurtFlash);return;}
    if(b.variant==='creative'){drawCreativeBoss(b,x,y,hurtFlash);return;}
    if(b.variant==='ceo'){drawCeoBoss(b,x,y,hurtFlash);return;}
    if(b.variant==='skull'&&art.skull.complete){
      const bobY=b.state==='tell'?Math.sin(time*18):Math.sin(time*2.4)*1.4;
      const sw=(b.w+10)*.86,sh=(b.h+16)*.86,sx=x+(b.w-sw)/2,sy=y+(b.h-sh)/2+bobY;
      // Keep the skull's visor aimed at the player while it patrols the arena.
      // The source artwork naturally faces left, so keep it unflipped for a player on the left.
      const facing=player.x+player.w/2<x+b.w/2?1:-1;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor=b.state==='tell'?'#ef624e':'#ed9e45';ctx.shadowBlur=b.state==='tell'?13:6;
      ctx.translate(sx+sw/2,0);ctx.scale(facing,1);ctx.drawImage(art.skull,-sw/2,sy,sw,sh);ctx.restore();
      const visorText=b.state==='defeat'?'ДОПУЩЕН':b.state==='vulnerable'?'ОТКРЫТ':'ОТКАЗ';
      const visorX=sx+sw*(facing<0?.56:.44),visorY=sy+sh*.46;
      // Project the glowing label onto the visor's slanted glass plane.
      ctx.save();ctx.translate(visorX,visorY);ctx.rotate(facing>0?-.075:.075);ctx.scale(.92,1);ctx.font='bold 6px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor=b.state==='defeat'||b.state==='vulnerable'?'#c3dc70':'#f34e49';ctx.shadowBlur=7;ctx.fillStyle=b.state==='defeat'||b.state==='vulnerable'?'#dcf58e':'#ff5c56';ctx.fillText(visorText,0,0,40);ctx.restore();
      if(b.state==='defeat')fx('emp-blast',x-24,y-28,b.w+48,b.h+50,Math.max(0,3.4-b.timer)*.75,{alpha:.72});return;
    }
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
    if(art.portfolioBoss.complete&&art.portfolioBoss.naturalWidth){
      const centerX=x+b.w/2,footY=FLOOR-3+(y-83),phaseScale=b.phase>=2?1.1:1,spriteW=154*phaseScale,spriteH=102*phaseScale,spriteX=centerX-spriteW/2,spriteY=footY-spriteH;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor=flash?'#fff0d2':b.phase>=2?'#ed5b57':b.state==='tell'||b.state==='attack'?'#e6a85d':'#65c7bf';ctx.shadowBlur=b.state==='tell'||b.state==='attack'?12:6;
      const tilt=(b.state==='tell'||b.state==='attack'?Math.sin(time*34)*.014:Math.sin(time*2.6)*.007);
      ctx.translate(centerX,footY);ctx.rotate(tilt);ctx.drawImage(art.portfolioBoss,12,4,1508,1000,-spriteW/2,-spriteH,spriteW,spriteH);
      // Phase two visibly enlarges the construct and burns its alignment marks red; the existing phase rules and attacks remain intact.
      if(b.phase>=2){ctx.save();ctx.globalAlpha=.5+.3*Math.sin(time*8);ctx.fillStyle='#ef665b';ctx.shadowColor='#ef665b';ctx.shadowBlur=8;ctx.fillRect(-spriteW*.32,-spriteH*.83,2,4);ctx.fillRect(spriteW*.29,-spriteH*.62,2,4);ctx.restore();}
      if(b.state==='vulnerable'){ctx.shadowColor='#c3dc70';ctx.shadowBlur=8;ctx.strokeStyle='rgba(195,220,112,.8)';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(0,-spriteH*.48,spriteW*.34,spriteH*.47,0,0,Math.PI*2);ctx.stroke();}
      if(b.phaseShield>0){ctx.shadowColor=b.phase>=2?'#f15f59':'#71d6cf';ctx.shadowBlur=10;ctx.strokeStyle=b.phase>=2?'rgba(239,89,83,.72)':'rgba(112,213,207,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-spriteH*.52,spriteW*.52,spriteH*.57,0,0,Math.PI*2);ctx.stroke();}
      ctx.restore();
      if(b.state==='defeat'&&coreStage!==3)fx('pixel-dissolve',spriteX-10,spriteY-5,spriteW+20,spriteH+15,Math.max(0,2.4-b.timer)*.9,{alpha:.72});
      if(b.state==='defeat'&&coreStage===3)drawCreativeApprovalLine(b,x,y);
      return;
    }
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
    if(b.state==='defeat'&&coreStage!==3)fx('pixel-dissolve',x-78,y-34,265,188,Math.max(0,2.4-b.timer)*.9,{alpha:.72});
    if(b.phaseShield>0){ctx.save();ctx.globalAlpha=.68;ctx.strokeStyle='#c77a8d';ctx.lineWidth=2;ctx.strokeRect(x+5,y+2,102,109);ctx.restore();}
    ctx.restore();
    if(b.state==='defeat'&&coreStage===3)drawCreativeApprovalLine(b,x,y);
  }
  function drawCreativeApprovalLine(b,x,y){
    const w=134,h=17,cx=x+b.w/2,bx=Math.max(8,Math.min(W-w-8,cx-w/2)),by=Math.max(26,y-23);
    rect(bx,by,w,h,'#101923');rect(bx+1,by+1,w-2,h-2,'#26373d');rect(bx,by,w,1,'#c7a66e');poly([[cx-3,by+h-1],[cx+3,by+h-1],[cx,by+h+4]],'#26373d');txt('ПОРТФОЛИО ПРИНЯТО',cx,by+11,5.5,'#e7d2a0','center');
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
  function drawHrBossSuccessLine(b){
    const cx=b.x+b.w/2,bubbleW=118,bubbleH=18,bx=Math.max(8,Math.min(W-bubbleW-8,cx-bubbleW/2)),by=Math.max(28,b.y-26);
    rect(bx,by,bubbleW,bubbleH,'#111923');rect(bx+1,by+1,bubbleW-2,bubbleH-2,'#27363b');rect(bx,by,bubbleW,1,'#c9ad77');
    poly([[cx-4,by+bubbleH-1],[cx+3,by+bubbleH-1],[cx,by+bubbleH+5]],'#27363b');
    txt('ВЫ ПРОШЛИ ОТБОР',bx+bubbleW/2,by+12,5.5,'#e9dfc7','center');
  }
  function drawHrBoss(b,x,y,flash){
    if(!art.hrBossApproach.complete||!art.hrBossApproach.naturalWidth)return;
    const poseArtReady=true;
    if(poseArtReady){
      const cx=x+b.w/2,facesLeft=player.x+player.w/2<cx;
      const walkFrames=[[10,22,533,683],[1094,22,517,683]];
      const attackFrames=[[30,92,427,549],[550,92,478,549],[1690,92,482,549]];
      const drawFitted=(img,f,scaleY=1)=>{const scale=b.h*scaleY/f[3],dw=f[2]*scale,dh=f[3]*scale,dx=cx-dw/2,dy=y+b.h-dh;ctx.drawImage(img,f[0],f[1],f[2],f[3],dx,dy,dw,dh);};
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor=flash?'#fff0c8':'#db9b56';ctx.shadowBlur=flash?11:5;
      if(!facesLeft)ctx.transform(-1,0,0,1,cx*2,0);
      // Fit each transparent crop by height and preserve its original proportions.
      if(b.state==='defeat'){
        if(art.hrBossApproved.complete&&art.hrBossApproved.naturalWidth){const dw=b.w,dh=b.h+6;ctx.drawImage(art.hrBossApproved,cx-dw/2,y+b.h-dh,dw,dh);}else drawFitted(art.hrBossApproach,[330,12,845,983]);ctx.restore();drawHrBossSuccessLine(b);return;
      }else if(b.jumping&&art.hrBossJump.complete&&art.hrBossJump.naturalWidth){
        drawFitted(art.hrBossJump,[440,68,717,825]);
      }else if(b.jumpWindup>0){
        drawFitted(art.hrBossApproach,[330,12,845,983],.91);
      }else if(b.walking&&art.hrBossWalkCycle.complete&&art.hrBossWalkCycle.naturalWidth&&!['tell','attack','hurt','defeat'].includes(b.state)){
        const f=walkFrames[Math.floor(time*6)%walkFrames.length];drawFitted(art.hrBossWalkCycle,f);
      }else if(['tell','attack'].includes(b.state)&&art.hrBossAttackCycle.complete&&art.hrBossAttackCycle.naturalWidth){
        const duration=['resumeRain','deadlineRain','caseRain'].includes(b.attack)?1.6:1.0;
        const progress=b.state==='tell'?0:Math.max(0,Math.min(1,1-b.timer/duration));
        const frame=b.state==='tell'?(b.timer<.18?1:0):progress<.22?0:progress<.68?1:2;const f=attackFrames[frame];drawFitted(art.hrBossAttackCycle,f);
      }else{
        drawFitted(art.hrBossApproach,[330,12,845,983]);
      }
      ctx.restore();return;
    }
    if(b.jumping&&art.hrBossJump.complete&&art.hrBossJump.naturalWidth){
      const cx=x+b.w/2,facesLeft=player.x+player.w/2<cx,dw=b.w,dh=b.h,dx=x,dy=y;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor=flash?'#fff0c8':'#db9b56';ctx.shadowBlur=flash?11:5;
      if(!facesLeft){ctx.translate(cx*2,0);ctx.scale(-1,1);}
      ctx.drawImage(art.hrBossJump,dx,dy,dw,dh);ctx.restore();return;
    }
    if(b.jumpWindup>0&&art.hrBoss.complete&&art.hrBoss.naturalWidth){
      const cx=x+b.w/2,facesLeft=player.x+player.w/2<cx,pose={sx:60,sy:0,sw:570,sh:724},squash=.91,dh=b.h*squash,dx=x,dy=y+b.h-dh;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor=flash?'#fff0c8':'#db9b56';ctx.shadowBlur=flash?11:5;
      if(!facesLeft){ctx.translate(cx*2,0);ctx.scale(-1,1);}
      ctx.drawImage(art.hrBoss,pose.sx,pose.sy,pose.sw,pose.sh,dx,dy,b.w,dh);ctx.restore();return;
    }
    const walkingAtPlayer=b.walking&&!b.jumping&&!['tell','attack','hurt','defeat'].includes(b.state)&&art.hrBossApproach.complete&&art.hrBossApproach.naturalWidth;
    if(walkingAtPlayer){
      const walkArt=art.hrBossWalkCycle.complete&&art.hrBossWalkCycle.naturalWidth?art.hrBossWalkCycle:art.hrBossApproach;
      // Every walk frame uses the same body box as idle/attack poses; lock the boots to the arena floor.
      const dh=b.h,dw=b.w,cx=x+b.w/2,dx=x,dy=y+1,facesLeft=player.x+player.w/2<cx;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor=flash?'#fff0c8':'#db9b56';ctx.shadowBlur=flash?11:5;
      if(!facesLeft){ctx.translate(cx*2,0);ctx.scale(-1,1);}
      if(walkArt===art.hrBossWalkCycle){const frameWidth=walkArt.naturalWidth/4,frame=Math.floor(time*6)%4;ctx.drawImage(walkArt,frame*frameWidth,0,frameWidth,walkArt.naturalHeight,dx,dy,dw,dh);}
      else ctx.drawImage(walkArt,300,0,930,1024,dx,dy,dw,dh);
      ctx.restore();return;
    }
    if(['tell','attack'].includes(b.state)&&art.hrBossAttackCycle.complete&&art.hrBossAttackCycle.naturalWidth){
      const cx=x+b.w/2,facesLeft=player.x+player.w/2<cx,cellWidth=art.hrBossAttackCycle.naturalWidth/4;
      const attackDuration=['resumeRain','deadlineRain','caseRain'].includes(b.attack)?1.6:1.0;
      const progress=b.state==='tell'?0:Math.max(0,Math.min(1,1-b.timer/attackDuration));
      const frame=b.state==='tell'?(b.timer<.18?1:0):progress<.22?1:progress<.68?2:3;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor=flash?'#fff0c8':'#db9b56';ctx.shadowBlur=flash?11:5;
      if(!facesLeft){ctx.translate(cx*2,0);ctx.scale(-1,1);}
      ctx.drawImage(art.hrBossAttackCycle,frame*cellWidth,0,cellWidth,art.hrBossAttackCycle.naturalHeight,x,y,b.w,b.h);ctx.restore();return;
    }
    if(art.hrBossApproach.complete&&art.hrBossApproach.naturalWidth){
      const cx=x+b.w/2,facesLeft=player.x+player.w/2<cx;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor=flash?'#fff0c8':b.phase>=1?'#e0444c':'#db9b56';ctx.shadowBlur=flash?11:b.phase>=1?9:5;
      if(!facesLeft){ctx.translate(cx*2,0);ctx.scale(-1,1);}
      const pose=b.state==='defeat'?'vulnerable':'normal';
      ctx.drawImage(art.hrBossApproach,300,0,930,1024,x,y+1,b.w,b.h);
      if(pose==='vulnerable'&&b.timer<2.6){ctx.globalAlpha=.65;ctx.shadowColor='#c3dc70';ctx.shadowBlur=3;rect(x+b.w*.36,y+b.h*.46,b.w*.27,1,'#c3dc70');}
      ctx.restore();return;
    }
    if(art.hrBoss.complete&&art.hrBoss.naturalWidth){
      const cx=x+b.w/2,cy=y+b.h/2,attack=b.state==='tell'||b.state==='attack';
      const pose=attack&&['questionBurst','hrScan'].includes(b.attack)?1:attack&&['resumeRain','deadlineRain','orbVolley'].includes(b.attack)?2:0;
      const source=pose===0?{sx:60,sy:0,sw:570,sh:724}:pose===1?{sx:642,sy:0,sw:690,sh:724}:{sx:1310,sy:0,sw:862,sh:724};
      const dw=pose===2?79:b.w,dh=b.h,dx=cx-dw/2,dy=y;
      const faceLeft=b.phase>=1?player.x+player.w/2<cx:(b.walking||b.jumping)?b.walkDir<0:player.x+player.w/2<cx;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor=flash?'#fff0c8':b.phase>=1?'#e0444c':attack?'#d65b50':'#db9b56';ctx.shadowBlur=b.phase>=1?14:attack?10:7;
      // The source sprite faces left; mirror it only when travelling/facing right.
      if(!faceLeft){ctx.translate(cx*2,0);ctx.scale(-1,1);}
      if(b.walking&&!b.jumping&&pose===0&&art.hrBossWalk.complete&&art.hrBossWalk.naturalWidth){
        const frame=Math.floor(time*7)%4,cellW=art.hrBossWalk.naturalWidth/2,cellH=art.hrBossWalk.naturalHeight/2;
        ctx.drawImage(art.hrBossWalk,(frame%2)*cellW+cellW*.11,Math.floor(frame/2)*cellH,cellW*.78,cellH*.98,dx,dy,dw,dh);
      }else ctx.drawImage(art.hrBoss,source.sx,source.sy,source.sw,source.sh,dx,dy,dw,dh);
      if(b.phase>=1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.72;ctx.shadowColor='#f0444b';ctx.shadowBlur=5;rect(dx+dw*.39,dy+dh*.235,dw*.09,2,'#f15a58');rect(dx+dw*.55,dy+dh*.235,dw*.09,2,'#f15a58');ctx.restore();}
      if(b.state==='vulnerable'){ctx.globalAlpha=.7;ctx.shadowBlur=0;rect(dx+dw*.35,dy+dh*.43,dw*.3,2,'#c3dc70');}
      if(b.state==='defeat')fx('emp-blast',x-30,y-16,b.w+60,b.h+42,Math.max(0,3.4-b.timer)*.75,{alpha:.8});
      ctx.restore();
      return;
    }
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
  function drawAtsPit(){
    const x=160,w=64,depth=ctx.createLinearGradient(0,FLOOR,0,H);depth.addColorStop(0,'#07131a');depth.addColorStop(.72,'#030910');depth.addColorStop(1,'#010407');
    rect(x,FLOOR,w,H-FLOOR,depth);poly([[x,FLOOR],[x+7,FLOOR+5],[x+7,H],[x,H]],'#263943');poly([[x+w,FLOOR],[x+w-7,FLOOR+5],[x+w-7,H],[x+w,H]],'#263943');
    line(x+6,FLOOR+5,x+6,H,'#52615d');line(x+w-6,FLOOR+5,x+w-6,H,'#52615d');
    for(let y=FLOOR+10;y<H-7;y+=9){line(x+2,y,x+6,y,'#485852');line(x+w-6,y,x+w-2,y,'#485852');}
    for(let sx=x+8;sx<x+w-8;sx+=12)poly([[sx,H-2],[sx+6,H-6],[sx+12,H-2]],'#263034');
  }
  function drawAtsFilterBeam(active){
    // Reuse the first hall's arched laser pylons and keep the beam inside their sockets.
    const gateX=18,gateW=W-36,beamY=FLOOR-23,pylonH=76,pylonY=beamY-pylonH*.5,beamX=gateX+11,beamW=gateW-22;
    if(art.archiveTrapLaserLeft.complete&&art.archiveTrapLaserRight.complete){
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.beginPath();ctx.rect(0,0,W,FLOOR);ctx.clip();
      ctx.drawImage(art.archiveTrapLaserLeft,gateX-8,pylonY,18,pylonH);ctx.drawImage(art.archiveTrapLaserRight,gateX+gateW-10,pylonY,18,pylonH);ctx.restore();
    }else{
      rect(gateX-2,beamY-15,6,32,'#394943');rect(W-gateX-4,beamY-15,6,32,'#394943');rect(gateX,beamY-14,2,29,'#b39763');rect(W-gateX-2,beamY-14,2,29,'#b39763');
    }
    if(active){ctx.save();ctx.shadowColor='#ff725d';ctx.shadowBlur=7;rect(beamX,beamY-1,beamW,3,'#fff0c6');rect(beamX,beamY+2,beamW,1,'#eb685a');ctx.restore();}
    else{rect(beamX,beamY,beamW,1,'rgba(112,172,160,.58)');for(const x of [beamX+3,beamX+beamW-5])rect(x,beamY-2,2,4,'#d5a86b');}
  }
  function drawBossWarnings(){
    if(!boss)return;const b=boss;
    if(b.state==='tell'&&b.attack==='questionBurst'){const px=player.x+player.w/2<b.x+b.w/2?b.x-9:b.x+b.w+4;for(let i=0;i<3;i++){const py=b.y+25+i*9;rect(px-2,py-2,5,5,'#bd4b50');txt('?',px+.5,py+2,3,'#fff0d1','center');}}
    if(b.state==='tell'&&b.attack==='deadlineRain')for(const x of b.warningXs){rect(x-10,FLOOR-3,20,2,'#e05851');rect(x-4,122,1,50,'#82434a');rect(x+4,122,1,50,'#82434a');}
    if(b.state==='tell'&&b.attack==='hrScan')drawAtsFilterBeam(false);
    if(b.state==='tell'&&b.attack==='ceoRain')for(const x of b.warningXs){rect(x-12,FLOOR-3,24,2,'#d6b66f');rect(x-5,117,1,55,'#817049');rect(x+5,117,1,55,'#817049');txt('ГПХ',x,111,4,'#e4cc91','center');}
    if(b.state==='tell'&&b.attack==='ceoBeam'){rect(18,150,W-36,13,'#3d3024');for(let x=20;x<W-20;x+=12)rect(x,151,2,10,'#b99b5c');}
    if(b.state==='tell'&&b.attack==='ceoSlam'){rect(b.targetX-23,FLOOR-3,46,2,'#e0bf79');txt('ПОДПИСЬ',b.targetX,FLOOR-8,5,'#e8cf94','center');}
    if(b.state==='tell'&&b.attack==='paperRain')for(const x of b.warningXs){rect(x-10,FLOOR-3,20,2,'#e05851');rect(x-4,130,1,42,'#82434a');rect(x+4,130,1,42,'#82434a');}
    if(b.state==='tell'&&(b.attack==='resumeRain'||b.attack==='caseRain'))for(const x of b.warningXs){rect(x-12,FLOOR-3,24,2,'#c77a8d');rect(x-5,117,1,55,'#8f5d74');rect(x+5,117,1,55,'#8f5d74');txt('КЕЙС',x,111,4,'#e6a7b5','center');}
    if(b.variant==='creative'&&b.phase>=2&&b.state==='tell'&&b.attack==='markupVolley')for(const x of b.warningXs){rect(x-9,FLOOR-3,18,2,'#d79a65');rect(x-3,132,1,40,'#99724c');rect(x+3,132,1,40,'#99724c');txt('КЕЙС',x,126,4,'#f0c58a','center');}
    if(b.state==='tell'&&b.attack==='stamp'){rect(b.targetX-21,FLOOR-2,42,2,'#e05851');txt('ОТКАЗ',b.targetX,FLOOR-8,6,'#ef7770','center');}
    if(b.state==='tell'&&(b.attack==='filter'||b.attack==='reviewBeam')){if(b.attack==='filter'&&b.variant==='skull'&&coreStage===1)drawAtsFilterBeam(false);else{rect(18,150,W-36,13,'#4b343a');for(let x=20;x<W-20;x+=12)rect(x,151,2,10,b.attack==='reviewBeam'?'#c77a8d':'#a8474c');}}
    if(b.variant==='skull'&&coreStage===1&&b.floorTrapWarning>0){
      const x=b.floorTrapX,blink=Math.floor(time*12)%2===0;
      if(art.archiveTrapPlate.complete&&art.archiveTrapSpikes.complete){ctx.save();ctx.imageSmoothingEnabled=true;ctx.globalAlpha=blink?.95:.72;ctx.drawImage(art.archiveTrapPlate,x-31,FLOOR-12,62,16);ctx.restore();}
      else{rect(x-27,FLOOR-4,54,2,blink?'#ed9a62':'#775643');for(let rx=x-20;rx<=x+20;rx+=10)poly([[rx,FLOOR-8],[rx+3,FLOOR-5],[rx,FLOOR-2],[rx-3,FLOOR-5]],blink?'#ffe0a0':'#a98959');poly([[x-30,FLOOR-2],[x-24,FLOOR-7],[x-18,FLOOR-2]],'#7b5544');poly([[x+18,FLOOR-2],[x+24,FLOOR-7],[x+30,FLOOR-2]],'#7b5544');}
    }
    if(b.variant==='skull'&&coreStage===1&&b.floorTrapActive>0){
      const x=b.floorTrapX;
      if(art.archiveTrapPlate.complete&&art.archiveTrapSpikes.complete){ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowColor='#f36b55';ctx.shadowBlur=7;ctx.drawImage(art.archiveTrapSpikes,x-31,FLOOR-17,62,21);ctx.restore();}
      else{ctx.save();ctx.shadowColor='#f36b55';ctx.shadowBlur=7;rect(x-26,FLOOR-3,52,3,'#f07b5c');ctx.restore();for(let sx=x-24;sx<x+22;sx+=12)poly([[sx,FLOOR-2],[sx+6,FLOOR-20],[sx+12,FLOOR-2]],'#a84e4b');rect(x-20,FLOOR-3,40,1,'#ffe0a0');}
    }
    if(b.variant==='creative'&&b.floorTrapWarning>0){const x=b.floorTrapX,pulse=.55+.45*Math.sin(time*15);ctx.save();ctx.globalAlpha=.6+.4*pulse;ctx.shadowColor='#e7a968';ctx.shadowBlur=5;line(x-22,FLOOR-3,x-12,FLOOR-11,'#d7a76b');line(x-12,FLOOR-11,x-3,FLOOR-3,'#d7a76b');line(x+3,FLOOR-3,x+12,FLOOR-11,'#d7a76b');line(x+12,FLOOR-11,x+22,FLOOR-3,'#d7a76b');line(x-27,FLOOR-1,x-19,FLOOR-1,'#f1c178');line(x+19,FLOOR-1,x+27,FLOOR-1,'#f1c178');rect(x-1,FLOOR-5,2,2,'#f0bd79');ctx.restore();}
    if(b.variant==='creative'&&b.floorTrapActive>0){const x=b.floorTrapX;ctx.save();ctx.shadowColor='#ec665d';ctx.shadowBlur=9;ctx.lineCap='round';ctx.lineWidth=5;line(x-23,FLOOR-2,x-10,FLOOR-20,'#b84f55');line(x-10,FLOOR-20,x-3,FLOOR-9,'#e97865');line(x-3,FLOOR-9,x+4,FLOOR-21,'#d65d5d');line(x+4,FLOOR-21,x+22,FLOOR-2,'#a84953');ctx.lineWidth=1.5;line(x-22,FLOOR-3,x-10,FLOOR-20,'#ffd092');line(x-2,FLOOR-10,x+4,FLOOR-21,'#ffd092');line(x+5,FLOOR-20,x+21,FLOOR-3,'#f1ae79');ctx.restore();}
    if(b.state==='attack'&&b.attack==='stamp'){rect(b.targetX-20,112,40,64,'#5d4243');rect(b.targetX-16,119,32,54,'#8e524e');rect(b.targetX-11,154,22,12,'#d4b69a');txt('ОТКАЗ',b.targetX,163,6,'#4a242c','center');}
    if(b.state==='attack'&&b.attack==='filter'){if(b.variant==='skull'&&coreStage===1)drawAtsFilterBeam(true);else{rect(18,150,W-36,13,'#c94e50');rect(18,153,W-36,3,'#f4d3a0');for(let x=20;x<W-20;x+=16)rect(x,149,2,16,'#f58168');}}
    if(b.state==='attack'&&b.attack==='hrScan')drawAtsFilterBeam(true);
    if(b.state==='attack'&&b.attack==='reviewBeam'){rect(18,150,W-36,13,'#bd6679');rect(18,153,W-36,3,'#f5d2a2');for(let x=20;x<W-20;x+=16)rect(x,149,2,16,'#e9a3a0');}
    if(b.state==='attack'&&b.attack==='ceoBeam'){rect(18,150,W-36,13,'#b59555');rect(18,153,W-36,3,'#fff0bc');for(let x=20;x<W-20;x+=16)rect(x,149,2,16,'#e2c477');}
    if(b.state==='attack'&&b.attack==='ceoSlam'){rect(b.targetX-22,105,44,70,'#443927');rect(b.targetX-17,111,34,61,'#d8c69b');rect(b.targetX-13,120,26,3,'#92794a');txt('ГПХ',b.targetX,153,6,'#75393c','center');}
  }
  function drawHrMidground(){
    if(!art.hrProps.complete||!art.hrProps.naturalWidth)return;
    const sw=art.hrProps.naturalWidth,sh=art.hrProps.naturalHeight;ctx.save();ctx.imageSmoothingEnabled=true;ctx.globalAlpha=.9;
    ctx.drawImage(art.hrProps,sw*.07,sh*.04,sw*.39,sh*.9,4,105,76,73);
    ctx.drawImage(art.hrProps,sw*.69,0,sw*.23,sh*.98,326,73,50,78);
    ctx.restore();
  }
  function drawCore(){
    if(mode==='phaseTransition'&&coreStage===3){
      const motion=creativeFallMotion();
      ctx.save();ctx.translate(motion.shake,0);
      if(motion.oldAlpha>0){ctx.save();ctx.globalAlpha=motion.oldAlpha;const phase=boss.phase;boss.phase=1;drawCoreBack();boss.phase=phase;rect(0,FLOOR,W,2,'#b3a378');for(const p of platforms)if(p.kind!=='arena')drawAct3BossPlatform(p);const by=boss.y;boss.y=motion.bossY;ctx.globalAlpha*=motion.actorAlpha;drawBoss();boss.y=by;ctx.restore();}
      if(motion.newAlpha>0){ctx.save();ctx.globalAlpha=motion.newAlpha;drawCreativePhase2Backdrop();for(const p of platforms)if(p.kind!=='arena')drawAct3BossPlatform(p);const by=boss.y;boss.y=motion.bossY;ctx.globalAlpha*=motion.actorAlpha;drawBoss();boss.y=by;ctx.restore();}
      if(motion.crack>0&&motion.oldAlpha>.02){const cx=W*.52;ctx.save();ctx.globalAlpha=motion.oldAlpha*(.35+.65*motion.crack);ctx.shadowColor='#f19a62';ctx.shadowBlur=8;line(0,FLOOR-1,W,FLOOR-1,'#c99060');line(cx,FLOOR,cx-9,FLOOR-9,'#f0bd79');line(cx-9,FLOOR-9,cx-18,FLOOR-4,'#f0bd79');line(cx,FLOOR,cx+8,FLOOR-12,'#f0bd79');line(cx+8,FLOOR-12,cx+20,FLOOR-5,'#f0bd79');ctx.restore();}
      const veil=Math.sin(motion.t*Math.PI),dark=ctx.createLinearGradient(0,0,0,H);dark.addColorStop(0,`rgba(3,7,14,${.46*veil})`);dark.addColorStop(.48,`rgba(2,5,12,${.78*veil})`);dark.addColorStop(1,`rgba(3,7,14,${.56*veil})`);ctx.fillStyle=dark;ctx.fillRect(0,0,W,H);
      ctx.restore();return;
    }
    if(coreStage===1&&art.arena.complete)drawCoreBack();else if(coreStage===2&&art.hrArena.complete&&art.hrArena.naturalWidth){drawCoreBack();}else if(coreStage===2&&art.hrBasement.complete&&art.hrBasement.naturalWidth)drawCoreBack();else if(coreStage===3&&art.portfolioBossArena.complete)drawCoreBack();else{ctx.save();ctx.globalAlpha=.40;drawCoreBack();ctx.restore();drawAtmosphere();}
    if(coreStage!==3||boss?.phase>=2||portfolioFinale)rect(0,FLOOR,W,2,coreStage===1&&art.arena.complete?'#887e63':coreStage===2?'#ae9161':coreStage===3?'#b3a378':'#75c8c3');if(portfolioFinale){drawPortfolioOfferEnvironment();}else{for(const p of platforms){if(coreStage===3&&p.kind==='arena')continue;if(coreStage===3)drawAct3BossPlatform(p);else if(coreStage===2)drawPlatform(p);else drawArenaPlatform(p);}drawHrRecruiterTraps();drawBossWarnings();drawBoss();if(boss?.variant==='creative'&&boss.phase>=2)for(const drone of creativeDrones)drawPortfolioCritic(drone);if(hrLiftOpen)drawHrLiftExit();}drawPortfolioFinale();
  }
  function drawHrLiftExit(){
    const x=W-57,y=FLOOR-67;ctx.save();ctx.shadowColor='rgba(225,184,111,.35)';ctx.shadowBlur=8;ctx.fillStyle='#283a40';ctx.beginPath();ctx.moveTo(x+2,FLOOR);ctx.lineTo(x+2,y+17);ctx.quadraticCurveTo(x+2,y,x+28,y);ctx.quadraticCurveTo(x+53,y,x+53,y+17);ctx.lineTo(x+53,FLOOR);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#b49b6a';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#0d1920';ctx.fillRect(x+8,y+20,41,FLOOR-y-20);const door=ctx.createLinearGradient(x+8,0,x+49,0);door.addColorStop(0,'#46585a');door.addColorStop(.48,'#24343a');door.addColorStop(.52,'#17272f');door.addColorStop(1,'#53605a');ctx.fillStyle=door;ctx.fillRect(x+10,y+23,37,FLOOR-y-23);rect(x+27,y+23,2,FLOOR-y-23,'#10191f');rect(x+13,y+27,2,FLOOR-y-31,'rgba(204,178,126,.55)');rect(x+42,y+27,2,FLOOR-y-31,'rgba(204,178,126,.55)');ctx.shadowColor='#c3dc70';ctx.shadowBlur=7;rect(x+24,y+7,9,3,'#c3dc70');ctx.restore();
  }
  function drawPortfolioFinale(){
    if(!portfolioFinale||portfolioFinale.phase==='bossAscend')return;
    const progress=portfolioFinale.phase==='pedestalRise'?portfolioFinale.pedestalRise:1,cx=W/2,topY=FLOOR+34-progress*54,bob=portfolioFinale.phase==='diploma'?Math.sin(time*2.3)*1.5:0;
    const glow=ctx.createRadialGradient(cx,topY-24,3,cx,topY-24,54);glow.addColorStop(0,'rgba(245,190,105,.34)');glow.addColorStop(1,'rgba(245,190,105,0)');ctx.fillStyle=glow;ctx.fillRect(cx-60,topY-80,120,95);
    if(art.offerPedestal.complete&&art.offerPedestal.naturalWidth){ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(art.offerPedestal,cx-31,FLOOR-43,62,43);ctx.restore();}
    else{rect(cx-21,FLOOR-5,42,5,'#18242b');rect(cx-18,FLOOR-9,36,4,'#9b764a');poly([[cx-18,topY+5],[cx+18,topY+5],[cx+10,FLOOR-9],[cx-10,FLOOR-9]],'#26353b');poly([[cx-13,topY+8],[cx+13,topY+8],[cx+7,FLOOR-12],[cx-7,FLOOR-12]],'#34484a');rect(cx-20,topY,40,5,'#202e34');rect(cx-18,topY-2,36,2,'#c28d50');rect(cx-13,topY+1,26,1,'#63b2aa');rect(cx-4,topY+10,8,FLOOR-topY-24,'#172b32');rect(cx-2,topY+12,4,FLOOR-topY-30,'#4ca29a');rect(cx-13,topY+12,2,2,'#dfa65d');rect(cx+11,topY+12,2,2,'#dfa65d');ctx.shadowColor='#efbd70';ctx.shadowBlur=8;rect(cx-1,topY+13,2,FLOOR-topY-31,'rgba(239,189,112,.74)');ctx.shadowBlur=0;}
    if(portfolioFinale.phase==='diploma'){
      const x=cx-12,y=topY-36+bob;ctx.save();ctx.shadowColor='#ffe18c';ctx.shadowBlur=13;rect(x-2,y-2,28,34,'rgba(243,191,100,.2)');rect(x,y,24,30,'#d8c69d');ctx.shadowBlur=0;rect(x+2,y+2,20,26,'#f1e3c0');rect(x+4,y+6,16,2,'#a8824f');rect(x+5,y+11,14,1,'#8c8778');rect(x+5,y+14,14,1,'#8c8778');rect(x+5,y+17,10,1,'#8c8778');ctx.fillStyle='#b94f4f';ctx.beginPath();ctx.arc(x+12,y+23,3.2,0,Math.PI*2);ctx.fill();rect(x+11,y+26,2,3,'#9b3d45');ctx.restore();
      const sparkle=.55+.4*Math.sin(time*7);ctx.save();ctx.globalAlpha=sparkle;ctx.shadowColor='#ffe18c';ctx.shadowBlur=8;rect(cx-21,y+8,2,2,'#fff0b0');rect(cx+20,y+17,2,2,'#fff0b0');rect(cx-17,y+27,2,2,'#e4bd75');ctx.restore();
    }
  }
  function drawPortfolioOfferEnvironment(){
    const cx=W/2;
    // Dim the arena once the reward appears, then leave a warm pool of light around it.
    ctx.fillStyle='rgba(3,8,14,.28)';ctx.fillRect(0,0,W,H);
    const dim=ctx.createRadialGradient(cx,FLOOR-54,10,cx,FLOOR-54,188);dim.addColorStop(0,'rgba(2,6,12,.02)');dim.addColorStop(.48,'rgba(2,6,12,.12)');dim.addColorStop(1,'rgba(2,6,12,.42)');ctx.fillStyle=dim;ctx.fillRect(0,0,W,H);
    const beam=ctx.createLinearGradient(cx,18,cx,FLOOR);beam.addColorStop(0,'rgba(255,207,124,0)');beam.addColorStop(.38,'rgba(255,207,124,.045)');beam.addColorStop(1,'rgba(255,207,124,.13)');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(cx-8,18);ctx.lineTo(cx+8,18);ctx.lineTo(cx+61,FLOOR);ctx.lineTo(cx-61,FLOOR);ctx.closePath();ctx.fill();
    const light=ctx.createRadialGradient(cx,FLOOR-49,4,cx,FLOOR-49,70);light.addColorStop(0,'rgba(255,211,131,.16)');light.addColorStop(.65,'rgba(213,157,83,.055)');light.addColorStop(1,'rgba(213,157,83,0)');ctx.fillStyle=light;ctx.fillRect(cx-74,FLOOR-122,148,148);
    if(art.offerLantern.complete&&art.offerLantern.naturalWidth){ctx.save();ctx.imageSmoothingEnabled=true;const lampH=90,lampW=lampH*art.offerLantern.naturalWidth/art.offerLantern.naturalHeight;ctx.drawImage(art.offerLantern,13,FLOOR-lampH,lampW,lampH);ctx.translate(W-13,FLOOR-lampH);ctx.scale(-1,1);ctx.drawImage(art.offerLantern,0,0,lampW,lampH);ctx.restore();}
  }
  function drawHrRecruiterTraps(){
    if(boss?.variant!=='hr'||boss.phase<1)return;
    for(const trap of boss.recruiterTraps){
      if(trap.warning>0){const pulse=.45+.35*Math.sin(time*17);ctx.save();ctx.globalAlpha=pulse;rect(trap.x-4,trap.platformY-3,32,2,'#f0a45e');txt('!',trap.x+12,trap.platformY-7,7,'#ffd18a','center');ctx.restore();}
      if(trap.assistant==='scanner')drawHrScannerAssistant(trap);else drawHrQuestioner(trap);
    }
  }
  function hrAssistantBounds(a){return a.assistant==='scanner'?{x:a.x+3,y:a.y+2,w:23,h:18}:{x:a.x+2,y:a.y+3,w:23,h:33};}
  function drawHrScannerAssistant(a){
    if(!a.alive)return;const x=Math.round(a.x),y=Math.round(a.y+Math.sin(time*3.2+a.phase)*3),cx=x+14,cy=y+9;
    if(boss?.state==='tell'&&boss.attack==='questionBurst'){
      const tx=player.x+player.w/2,ty=player.y+player.h/2;ctx.save();ctx.globalAlpha=.45+.25*Math.sin(time*15);for(let t=.08;t<.94;t+=.1)rect(cx+(tx-cx)*t-1,cy+(ty-cy)*t-1,2,2,'#ed6a62');ctx.restore();
      rect(tx-5,ty-5,2,2,'#ffc47a');rect(tx+3,ty+3,2,2,'#ffc47a');
    }
    // Use the brass archive-review drone from the approved act-three set instead of the old blocky scanner.
    drawPortfolioCritic({kind:'flyer',x:x-2,y:y-4,phase:a.phase||0,dir:player.x+player.w/2<cx?-1:1,state:boss?.state==='tell'?'aim':'patrol',alive:true});
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
    const footerLabel=room==='screening'?'Этажи ↑ HR':room==='core'&&coreStage===2?hrLiftOpen?'HR → Лифт':'Отбор → HR':room==='portfolio'?'Собеседование → Портфолио':room==='core'&&coreStage===3?'Портфолио → Арт-директор':'Архив → ATS';
    if(footerStage&&footerStage.dataset.label!==footerLabel){const [from,arrow,to]=footerLabel.split(' ');footerStage.innerHTML=`${from} <b>${arrow}</b> ${to}`;footerStage.dataset.label=footerLabel;}
    txt(room==='archive'?'ЭТАП 01/03 · ОТКЛИК':room==='core'?coreStage===4?'ФИНАЛ · РУКОВОДИТЕЛЬ':coreStage===2?'ЭТАП 02/03 · БОСС HR':coreStage===3?'ЭТАП 03/03 · АРТ-ДИРЕКТОР':'ЭТАП 01/03 · ЯДРО ATS':room==='screening'?'ЭТАП 02/03 · ОТБОР':room==='portfolio'?'ЭТАП 03/03 · ПРОВЕРКА ПОРТФОЛИО':'ЭТАП 02/03 · ПРОЙДЕН',8,14,8,palette.light);
    const heartCapacity=START_HEARTS;
    for(let i=0;i<heartCapacity;i++)txt('♥',W-54+i*15,15,10,i<player.hp?'#e45b5c':'#60434a');
    if(room==='core'&&boss){rect(132,8,116,7,'#303943');rect(134,10,112,3,'#60474b');rect(134,10,112*Math.max(0,boss.hp/boss.maxHp),3,boss.variant==='creative'?'#c77a8d':boss.variant==='ceo'?'#d6b66f':'#dd5a55');txt(boss.variant==='hr'?'HR':boss.variant==='creative'?(boss.phase>=2?'ART · II':'ART'):boss.variant==='ceo'?`CEO · ${boss.phase>=2?'III':boss.phase===1?'II':'I'}`:'ATS',190,20,5,'#d1c3a8','center');}
    if(room==='archive'){
      if(tutorialStep<3){rect(8,29,187,15,'#101720');txt(['A / D — ДВИЖЕНИЕ','SPACE — ПРЫЖОК ЧЕРЕЗ ЯМУ','МЫШЬ — ПРИЦЕЛ, ЛКМ — ВЫСТРЕЛ'][tutorialStep],13,39,7,'#e6decd');}
      else if(tutorialStep>3){rect(8,29,174,15,'#101720');txt('ЦЕЛЬ: доберись до двери',13,39,7,'#c3dc70');}
    }
    if(room==='screening'){const floorNo=Math.max(1,Math.min(8,1+Math.floor(Math.max(0,SCREENING_FLOOR-(player.y+player.h))/67)));txt(`ЭТАЖ ${String(floorNo).padStart(2,'0')}/08`,W-94,14,6.5,'#d9c9a5','center');if(nearScreeningExit()){rect(87,29,210,15,'#101820');txt('E — К СОБЕСЕДОВАНИЮ',192,39,7,'#c3dc70','center');}}
    if(nearPortfolioExit()){rect(92,29,200,15,'#101720');txt('E — К АРТ-ДИРЕКТОРУ',192,39,7,'#c3dc70','center');}
    if(room==='core'&&coreStage===2&&nearHrLift()){rect(89,29,206,15,'#101720');txt('E — ЛИФТ НА ЭТАП 03',192,39,7,'#c3dc70','center');}
    if(nearFinalDiploma()){rect(89,29,206,15,'#101720');txt('E — ПОЛУЧИТЬ ОФФЕР',192,39,7,'#f0d28c','center');}
    if(room==='core'&&boss&&boss.state==='tell'){
      const msg=boss.attack==='orbVolley'?'АРГУМЕНТЫ HR: ВХОДЯЩИЕ ШАРЫ':boss.attack==='resumeRain'?'СРОЧНАЯ ПРАВКА: РЕЗЮМЕ СВЕРХУ':boss.attack==='questionBurst'?'МЫ ОДНА СЕМЬЯ — ПОЧЕМУ ВЫ ПОДХОДИТЕ?':boss.attack==='deadlineRain'?'НЕБОЛЬШОЕ ТЕСТОВОЕ: ДОКУМЕНТЫ СВЕРХУ':boss.attack==='hrScan'?'МЫ ВЫБРАЛИ ДРУГОГО КАНДИДАТА':boss.attack==='commentSpread'?'ОСКОЛКИ ПОРТФОЛИО':boss.attack==='markupVolley'?'РОСЧЕРКИ КИСТИ':boss.attack==='caseRain'?'КЕЙСЫ НА ДОРАБОТКУ':boss.attack==='reviewBeam'?'ВЫРОВНЯЙТЕ ВСЕ ОТСТУПЫ':boss.attack==='volley'?'ФИЛЬТР: формат резюме не тот':boss.attack==='paperRain'?boss.filter:boss.attack==='stamp'?'ПОДПИСЬ ОТКАЗА ГОТОВА':'АБСУРДНЫЙ ФИЛЬТР: '+boss.filter;
      const displayedMsg=boss.variant==='ceo'?(boss.attack==='ceoVolley'?'ПЛАН ПО УВОЛЬНЕНИЯМ УТВЕРЖДЁН':boss.attack==='ceoRain'?'УСЛОВИЯ ОФФЕРА СВЕРХУ':boss.attack==='ceoBeam'?'ПОСЛЕ РАБОТЫ ТОЖЕ РАБОТА':'ПОДПИШИТЕ НЕ ЧИТАЯ'):msg;
      rect(71,27,242,15,boss.variant==='ceo'?'#211d17':'#101720');txt(displayedMsg,192,37,6,boss.variant==='ceo'?'#e4cc91':boss.attack==='stamp'?'#ef8e7e':'#ded1b5','center');
      if(boss.attack==='filter'||boss.attack==='hrScan'||boss.attack==='reviewBeam'||boss.attack==='ceoBeam'){rect(111,44,162,9,'#101720');txt('ALT — ПРИСЕСТЬ ПОД ЛУЧОМ',192,51,5,'#c3dc70','center');}
    }
    if(room==='core'&&boss?.variant==='creative'&&boss.phaseBanner>0){rect(83,55,218,13,'#311d29');txt('ФАЗА 02 · ЗАЩИТА 3 СЕК',192,64,6,'#f0a2ad','center');}
    if(room==='core'&&boss?.variant==='hr'&&boss.phaseBanner>0){rect(92,55,200,13,'#30251f');txt('ФАЗА 02 · РЕВЬЮЕРЫ В ДЕЛЕ',192,64,6,'#f0bc83','center');}
    if(room==='core'&&boss?.variant==='ceo'&&boss.phaseBanner>0){rect(77,55,230,13,'#30281b');txt(boss.phase===1?'РУКОВОДИТЕЛЬ ПОВЫШАЕТ СТАВКИ':'СОВЕТ ДИРЕКТОРОВ ВМЕШАЛСЯ',192,64,6,'#e4cc91','center');}
  }
  function drawFrame(){
    ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;rect(0,0,VIEW_W,VIEW_H,'#11131b');
    const scaleX=VIEW_W/W,scaleY=VIEW_H/H;ctx.setTransform(scaleX,0,0,scaleY,0,0);
    ctx.save();if(room==='screening')ctx.translate(0,-cameraY);
    if(room==='archive')drawArchive();else if(room==='core')drawCore();else if(room==='screening')drawScreening();else if(room==='portfolio')drawPortfolio();else drawElevator();
    if(player&&room!=='elevator'&&mode==='phaseTransition'){const motion=creativeFallMotion();ctx.save();ctx.translate(motion.shake,motion.heroY-player.y);ctx.globalAlpha=motion.actorAlpha;drawHero();ctx.restore();}
    else if(player&&room!=='elevator')drawHero();
    for(const q of hostileShots)drawResumeShot(q);for(const q of playerShots)drawBullet(q);drawParticles();
    ctx.restore();
    if(player)drawHud();drawAim();
    if(mode==='intro'&&boss?.variant==='hr'){rect(52,75,280,48,'#111a22');rect(56,79,272,40,'#25343c');txt('HR-ДИРЕКТОР',192,91,6.5,'#d8c6a2','center');txt('Я НЕ ПРОПУЩУ КОГО ПОПАЛО.',192,108,7,'#e66a5f','center');}
    else if(mode==='intro'){rect(74,77,236,40,'#111a22');rect(78,81,228,32,'#25343c');txt(boss?.variant==='creative'?'КРЕАТИВНЫЙ ДИРЕКТОР':boss?.variant==='ceo'?'РУКОВОДИТЕЛЬ КОМПАНИИ':'КАНДИДАТ ЗАГРУЖЕН',192,94,7,'#d8c6a2','center');txt(boss?.variant==='creative'?'ЗАЩИТА ПОРТФОЛИО НАЧАТА':boss?.variant==='ceo'?'ПОСЛЕДНИЙ РАУНД':'АВТОМАТИЧЕСКИЙ ОТБОР НАЧАТ',192,106,6,'#e66a5f','center');}
    if(mode==='transition')drawDissolve();
    if(room==='core'&&boss&&boss.state==='defeat'&&boss.variant!=='hr'&&boss.variant!=='creative'){
      if(Math.floor(time*12)%3===0)rect(0,24,W,H-24,'rgba(205,76,68,.08)');
      for(let i=0;i<8;i++){const seed=(Math.floor(time*7)+i*23)%140;rect(boss.x+Math.sin(seed)*65,boss.y+Math.cos(seed*3)*50,1+(i%3),1,'#ee7363');}
    }
  }
  function drawDissolve(){
    const progress=1-transitionTime/(nextRoom==='ceoBoss'?.9:nextRoom==='stage2Boss'?1.1:.72),name=nextRoom==='stage2Boss'||nextRoom==='ceoBoss'?'pixel-dissolve':'glitch-wipe';
    fx(name,0,0,W,H,progress*(name==='pixel-dissolve'?2.2:1.8),{alpha:.94});
    if(transitionTime>.32){rect(48,91,288,29,'#0b0b20');rect(48,91,288,2,'#ae9161');rect(48,118,288,2,'#8e4248');txt(nextRoom==='core'?'ПЕРЕХОД В ЯДРО ATS':nextRoom==='screening'?'ЛИФТ ДОСТАВЛЯЕТ В HR-ОТДЕЛ':nextRoom==='stage2Boss'?'ОБРУШЕНИЕ · ПАДЕНИЕ В АРХИВНЫЙ ПОДВАЛ':nextRoom==='portfolio'?'ЛИФТ ПОДНИМАЕТ ВЫШЕ · ЭТАП 03':nextRoom==='ceoBoss'?'РУКОВОДИТЕЛЬ ЖДЁТ В СВОЁМ КАБИНЕТЕ':'СИСТЕМА ПЕРЕЗАПУСКАЕТСЯ',192,109,7,'#e0bd80','center');}
  }

  function supportSurfaces(){return platforms.filter(p=>p.active!==false).concat(breakables.filter(b=>b.hp>0).map(b=>({x:b.x,y:b.y,w:b.w,h:b.h,kind:'paperBlock',source:b})),room==='portfolio'?portfolioRocks:[]);}
  function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function worldWidth(){return room==='archive'?ARCHIVE_W:room==='screening'?SCREENING_W:room==='portfolio'?PORTFOLIO_W:W;}
  function bossBounds(){if(boss?.variant==='hr'){const w=46*(boss.phase?1.18:1),h=55*(boss.phase?1.18:1);return{x:boss.x+(boss.w-w)/2,y:boss.y+(boss.h-h)/2,w,h};}return boss?.variant==='ceo'?{x:boss.x+15,y:boss.y+20,w:134,h:125}:boss?.variant==='creative'?{x:boss.x+(boss.w-84)/2,y:boss.y+17,w:84,h:72}:boss?.variant==='skull'&&coreStage===1?{x:boss.x+16,y:boss.y+27,w:boss.w-32,h:boss.h-40}:{x:boss.x+1,y:boss.y+10,w:115,h:86};}
  function nearTerminal(){return room==='archive'&&Math.abs((player.x+player.w/2)-(ARCHIVE_EXIT_X+32))<54;}
  function nearScreeningExit(){return room==='screening'&&Math.abs((player.x+player.w/2)-(SCREENING_EXIT_X+22))<40&&Math.abs((player.y+player.h)-SCREENING_EXIT_Y)<30;}
  function nearPortfolioExit(){return room==='portfolio'&&Math.abs((player.x+player.w/2)-(PORTFOLIO_EXIT_X+18))<40&&Math.abs(player.y+player.h-PORTFOLIO_EXIT_Y)<20;}
  function nearHrLift(){return room==='core'&&coreStage===2&&hrLiftOpen&&Math.abs((player.x+player.w/2)-(W-29))<42;}
  function recordTutorial(action){const expected=['move','jump','shoot','interact'][tutorialStep];if(action===expected&&tutorialStep<4)tutorialStep++;}
  function hurt(){if(player.inv>0||mode!=='play')return;player.hp--;hearts=player.hp;fx('hit-flash',player.x-camera-9,player.y-5,34,32,0);player.inv=1.05;player.hurt=.28;player.vy=-86;player.vx=-player.face*38;hitsTaken++;tone(138,.13,'sawtooth');for(let i=0;i<10;i++)particles.push({x:player.x+8,y:player.y+12,vx:(Math.random()-.5)*65,vy:(Math.random()-.7)*55,life:.36,size:i%3===0?3:2,color:i%2?'#e95c56':'#eee0c7'});if(player.hp<=0)fail();}
  function fail(reasonOverride=''){
    deaths++;mode='fail';if(player){player.vx=0;player.vy=0;player.hurt=0;player.inv=0;}hostileShots=[];playerShots=[];particles=[];mouse.left=false;const lostBoss=room==='core'&&coreStage===2,creativeBoss=room==='core'&&coreStage===3,ceoBoss=room==='core'&&coreStage===4;tone(120,.28,'sawtooth');
    const reason=reasonOverride|| (lostBoss?'Вы получили отказ. Попробуйте еще раз, пройдя этап отбора.':creativeBoss?'Креативный директор отправил портфолио на бесконечную доработку.':ceoBoss?'Руководитель компании предложил обсудить оффер после испытательного срока.':room==='archive'?'Резюме потерялось среди остальных.':room==='screening'?'Вы сказали «не знаю» на вопрос «расскажите о себе».':room==='portfolio'?'Редактура затянулась, а дедлайн не ждёт.':'Компьютер предпочёл кандидата с опытом работы на этом компьютере.');
    panel(`<p class="eyebrow ${lostBoss?'hr-director-label':''}">${room==='archive'?'АРХИВ РЕЗЮМЕ':room==='screening'?'HR-СКРИНИНГ':room==='portfolio'?'ПОРТФОЛИО':boss?.variant==='hr'?'HR-ДИРЕКТОР':creativeBoss?'КРЕАТИВНЫЙ ДИРЕКТОР':ceoBoss?'РУКОВОДИТЕЛЬ КОМПАНИИ':'ЯДРО ATS'}</p><h2>ВАМ ОТКАЗАНО</h2><p>${reason}</p><button class="primary" id="retry">${lostBoss?'СНОВА HR-СКРИНИНГ':creativeBoss?'СНОВА К ПОРТФОЛИО':ceoBoss?'ЕЩЁ РАУНД С CEO':'ПОВТОРИТЬ ЗАЛ'}&nbsp; ↻</button>`);
    document.getElementById('retry').onclick=()=>{if(lostBoss){hearts=START_HEARTS;setupScreening();startTime=performance.now();}else if(creativeBoss){hearts=START_HEARTS;setupPortfolio();startTime=performance.now();}else restartRoom();overlay.innerHTML='';};
  }
  function spawnBurst(x,y,color='#f1dfb5',amount=8){particles.push({x,y,vx:0,vy:0,life:.48,age:0,fx:true});for(let i=0;i<amount;i++){const angle=(Math.PI*2*i/amount)+Math.random()*.3,speed=18+Math.random()*52;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-12,life:.28+Math.random()*.34,color,size:i%3===0?3:2});}}
  function updateAimFromPointer(event){
    const bounds=canvas.getBoundingClientRect();mouse.aimX=Math.max(0,Math.min(W,(event.clientX-bounds.left)*W/bounds.width));mouse.aimY=Math.max(0,Math.min(H,(event.clientY-bounds.top)*H/bounds.height));mouse.aiming=true;
    if(player){const dx=camera+mouse.aimX-(player.x+player.w/2),aimY=mouse.aimY+(room==='screening'?cameraY:0),dy=aimY-(player.y+player.h/2);player.aimAngle=Math.atan2(dy,dx);player.face=dx<0?-1:1;}
  }
  function shoot(){
    if(mode!=='play'||portfolioFinale||player.shootCooldown>0)return;player.shootCooldown=.23;tone(680,.035,'square');recordTutorial('shoot');
    const runningPose=!player.crouching&&(!player.ground||Math.abs(player.vx)>3),drawW=runningPose?34:27,drawH=player.crouching?25:36;
    const drawX=player.x+(player.w-drawW)/2,drawY=player.y+player.h+(player.ground?5:0)-drawH;
    const targetX=mouse.aiming?camera+mouse.aimX:player.x+player.w/2+(player.face||1)*120;
    const facing=targetX<player.x+player.w/2?-1:1;
    const featherX=drawX+drawW*(facing>0?.91:.09),featherY=drawY+drawH*.315;
    const sx=featherX,sy=featherY;
    const targetY=mouse.aiming?mouse.aimY+(room==='screening'?cameraY:0):sy;
    const dx=targetX-sx,dy=targetY-sy,len=Math.max(1,Math.hypot(dx,dy));
    const vx=dx/len*360,vy=dy/len*360;player.face=facing;player.aimAngle=Math.atan2(vy,vx);
    playerShots.push({x:sx+dx/len*4,y:sy+dy/len*4,vx,vy,life:1.5,damage:1,alive:true});
  }
  function startBossDefeat(){if(!boss)return;boss.hp=0;boss.state='defeat';boss.timer=boss.variant==='hr'?2.8:3.4;boss.walking=false;boss.jumping=false;boss.jumpWindup=0;hostileShots=[];mouse.left=false;if(boss.variant==='hr'){particles=[];playerShots=[];}}
  function damageBoss(amount){if(!boss||boss.state!=='vulnerable'||boss.hitCooldown>0||boss.phaseShield>0)return;if(boss.variant==='creative'&&boss.phase>=2)amount*=.62;boss.hp=Math.max(0,boss.hp-amount);boss.flash=.18;boss.hitCooldown=.18;boss.vulnLeft=boss.timer;boss.state='hurt';boss.timer=.2;tone(boss.hp===0?160:520,.1,boss.hp===0?'sawtooth':'square');if(boss.hp<=0)startBossDefeat();else spawnBurst(boss.x+18,boss.y+58,'#f4d49d',11);}
  function beginPortfolioFinale(){
    if(!boss||portfolioFinale)return;boss.state='ascend';boss.timer=1.8;boss.walking=false;boss.jumping=false;boss.vx=0;boss.warningXs=[];boss.floorTrapWarning=0;boss.floorTrapActive=0;portfolioFinale={phase:'bossAscend',timer:1.8,pedestalRise:0};hostileShots=[];playerShots=[];creativeDrones=[];particles=[];mouse.left=false;player.vx=0;player.vy=0;tone(420,.24,'triangle');
  }
  function updatePortfolioFinale(dt){
    if(portfolioFinale.phase==='bossAscend'){
      portfolioFinale.timer-=dt;if(boss){boss.y-=82*dt;boss.timer=portfolioFinale.timer;}
      if(portfolioFinale.timer<=0){boss=null;portfolioFinale.phase='pedestalRise';portfolioFinale.timer=1.05;tone(300,.18,'sine');}
    }else if(portfolioFinale.phase==='pedestalRise'){
      portfolioFinale.timer-=dt;portfolioFinale.pedestalRise=Math.min(1,1-Math.max(0,portfolioFinale.timer)/1.05);
      if(portfolioFinale.timer<=0){portfolioFinale.phase='diploma';portfolioFinale.pedestalRise=1;tone(740,.3,'sine');}
    }
  }
  function nearFinalDiploma(){return room==='core'&&coreStage===3&&portfolioFinale?.phase==='diploma'&&Math.abs(player.x+player.w/2-W/2)<39&&player.ground;}
  function showRandomOffer(){
    const companies=['Сбер','Т-Банк','Ozon','Яндекс'],extras=['Гибкое начало дня','Компенсация техники','Бюджет на обучение','Годовой бонус','28 дней отпуска','Оплачиваемые выходные в день рождения'];
    const shuffled=[...extras].sort(()=>Math.random()-.5);finalOffer={company:companies[Math.floor(Math.random()*companies.length)],salary:'200 000 ₽ в месяц',benefits:['Удалённая работа','ДМС со стоматологией',...shuffled.slice(0,2)]};
    mode='done';panel(`<p class="eyebrow">ОФФЕР · ${finalOffer.company}</p><h2>ВАС ЖДУТ В КОМАНДЕ</h2><p><strong>Продуктовый дизайнер</strong><br>${finalOffer.salary} · удалённая работа</p><p>${finalOffer.benefits.slice(1).join(' · ')}</p><div class="actions"><button class="primary" id="acceptFinalOffer">ПРИНЯТЬ ОФФЕР</button><button class="secondary" id="declineFinalOffer">ОТКЛОНИТЬ</button></div>`,'ending-card');
    document.getElementById('acceptFinalOffer').onclick=()=>showOfferEnding(true);
    document.getElementById('declineFinalOffer').onclick=()=>showOfferEnding(false);
  }
  function showOfferEnding(accepted){
    panel(accepted?`<p class="eyebrow">ОФФЕР ПРИНЯТ · ${finalOffer.company}</p><h2>ТЫ В КОМАНДЕ</h2><p>200 000 ₽ в месяц, удалёнка и ДМС со стоматологией.<br>Пусть это будет хорошая глава.</p><button class="primary" id="restartAfterOffer">НАЧАТЬ ЗАНОВО</button>`:`<p class="eyebrow">ОФФЕР ОТКЛОНЁН · ${finalOffer.company}</p><h2>ПОИСК ПРОДОЛЖАЕТСЯ</h2><p>Теперь ты знаешь себе цену.<br>Следующий оффер может быть ещё лучше.</p><button class="primary" id="restartAfterOffer">НАЧАТЬ ЗАНОВО</button>`,'ending-card');
    document.getElementById('restartAfterOffer').onclick=startGame;
  }
  function moveAndCollide(dt){
    const p=player;const oldX=p.x;const wantCrouch=(keys.AltLeft||keys.AltRight)&&p.ground;
    if(wantCrouch&&!p.crouching){p.y+=9;p.h=14;}else if(!wantCrouch&&p.crouching){p.y-=9;p.h=23;}p.crouching=wantCrouch;
    const dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);p.vx=dx*94;if(dx&&!mouse.aiming)p.face=dx;p.run+=Math.abs(p.vx)*dt*.035;
    p.x=Math.max(0,Math.min(worldWidth()-p.w,p.x+p.vx*dt));
    if(room==='archive'&&!p.crouching&&p.ground){
      for(const trap of archiveTraps){
        if(trap.kind!=='laser'||!archiveTrapState(trap).active)continue;
        const barrier={x:trap.x+11,y:FLOOR-23,w:trap.w-22,h:3};
        if(overlaps(p,barrier)&&!overlaps({x:oldX,y:p.y,w:p.w,h:p.h},barrier)){p.x=oldX;p.vx=0;break;}
      }
    }
    if(room==='archive'||room==='screening')for(const b of breakables)if(b.hp>0&&p.y+p.h>b.y+2&&p.y<b.y+b.h&&overlaps(p,b)){p.x=dx>0?b.x-p.w:b.x+b.w;}
    if(room==='portfolio'&&p.ground)for(const rock of portfolioRocks)if(p.standing!==rock&&overlaps(p,rock)){p.x=dx>0?rock.x-p.w:rock.x+rock.w;}
    if(room==='archive'&&tutorialStep===0){moveTally+=Math.abs(p.x-oldX);if(moveTally>26)recordTutorial('move');}
    if(p.ground)p.coyote=.11;else p.coyote=Math.max(0,p.coyote-dt);
    p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
    if(p.jumpBuffer>0&&p.coyote>0){if(room==='screening')p.fallOriginY=p.y+p.h;p.vy=-194;p.jumpBuffer=0;p.ground=false;p.coyote=0;p.standing=null;recordTutorial('jump');tone(370,.07);}
    const oldBottom=p.y+p.h;p.previousBottom=oldBottom;p.vy=Math.min(270,p.vy+440*dt);p.y+=p.vy*dt;p.ground=false;p.standing=null;
    if(p.vy>=0){let land=null;for(const s of supportSurfaces()){if(oldBottom<=s.y+2&&p.y+p.h>=s.y&&p.x+p.w>s.x+2&&p.x<s.x+s.w-2){if(!land||s.y<land.y)land=s;}}if(land){const fallDistance=room==='screening'?SCREENING_FLOOR-(p.fallOriginY??SCREENING_FLOOR):0;if(room==='screening'&&land.y>=SCREENING_FLOOR&&fallDistance>SCREENING_FALL_DEATH){fail('Вы упали слишком глубоко. Поднимайтесь по площадкам.');return;}p.y=land.y-p.h;p.vy=0;p.ground=true;p.standing=land;if(land.kind==='crumble'&&land.timer===0)land.timer=.72;}}
    if(room==='core'&&p.y+p.h>=FLOOR){const overAtsPit=coreStage===1&&p.x+p.w>160&&p.x<224;if(!overAtsPit){p.y=FLOOR-p.h;p.vy=0;p.ground=true;}}
    if(p.y<24){p.y=24;p.vy=Math.max(0,p.vy);}
    if(p.y>(room==='screening'?SCREENING_WORLD_H:H)+36){hurt();if(room==='archive'||room==='screening'||room==='portfolio'){p.x=p.lastSafeX;p.y=p.lastSafeY;}else{p.x=Math.max(20,Math.min(worldWidth()-p.w,p.x-42));if(room==='core'&&coreStage===1&&p.x+p.w>160&&p.x<224)p.x=p.x+p.w/2<192?144:224;p.y=FLOOR-p.h;}p.vx=0;p.vy=0;p.ground=true;p.standing=null;}
    if((room==='archive'&&p.standing?.kind==='ground'||room==='portfolio'&&p.standing)&&p.ground){p.lastSafeX=p.x;p.lastSafeY=p.y;}
    if(room==='screening'&&p.ground){p.lastSafeX=p.x;p.lastSafeY=p.y;p.fallOriginY=p.y+p.h;}
    if(room==='screening'){
      camera=0;cameraY=Math.max(0,Math.min(SCREENING_WORLD_H-H,p.y-H*.64));
    }else if(room==='archive'||room==='portfolio'){
      for(const plat of platforms)if(plat.kind==='crumble'&&plat.timer>0){plat.timer-=dt;if(plat.timer<=0)plat.active=false;}
      if(p.standing?.kind==='conveyor')p.x=Math.min(ARCHIVE_W-p.w,p.x+14*dt);
      camera=Math.max(0,Math.min(worldWidth()-W,p.x-130));
      cameraY=0;
    }else{camera=0;cameraY=0;}
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
        if(q.life>0)for(const bot of flyingBots)if(bot.alive&&overlaps(shotBox,{x:bot.x,y:bot.y,w:22,h:16})){bot.hp--;q.life=0;if(bot.hp<=0){bot.alive=false;spawnBurst(bot.x+11,bot.y+8,'#72d3bd',8);tone(880,.04,'square');}break;}
        if(q.life>0)for(const bot of hrQuestioners)if(bot.alive&&overlaps({x:q.x-4,y:q.y-2,w:8,h:4},{x:bot.x+2,y:bot.y+3,w:23,h:33})){bot.hp--;q.life=0;if(bot.hp<=0){bot.alive=false;spawnBurst(bot.x+12,bot.y+18,'#e7c892',12);}break;}
      }
      else if(room==='portfolio'){for(const bot of portfolioCritics)if(q.life>0&&bot.alive&&overlaps(shotBox,portfolioBotBounds(bot))){bot.hp--;q.life=0;if(bot.hp<=0){bot.alive=false;spawnBurst(bot.x+portfolioBotSize(bot).w/2,bot.y+portfolioBotSize(bot).h/2,'#d9a765',10);}break;}}
      else if(room==='core'&&boss?.variant==='hr'&&boss.phase>=1){for(const trap of boss.recruiterTraps)if(q.life>0&&trap.alive&&trap.warning<=0&&overlaps(shotBox,hrAssistantBounds(trap))){trap.alive=false;q.life=0;spawnBurst(trap.x+12,trap.y+12,'#e6c895',9);break;}if(q.life>0&&boss.state!=='defeat'&&boss.state!=='intro'&&overlaps(shotBox,bossBounds())){damageBoss(q.damage);q.life=0;}}
      else if(room==='core'&&boss?.variant==='creative'&&boss.phase>=2){for(const drone of creativeDrones)if(q.life>0&&drone.alive&&overlaps(shotBox,portfolioBotBounds(drone))){drone.hp--;q.life=0;if(drone.hp<=0){drone.alive=false;spawnBurst(drone.x+15,drone.y+13,'#d9a765',10);}break;}if(q.life>0&&boss.state!=='defeat'&&boss.state!=='intro'&&overlaps(shotBox,bossBounds())){damageBoss(q.damage);q.life=0;}}
      else if(room==='core'&&boss&&boss.state!=='defeat'&&boss.state!=='intro'&&overlaps({x:q.x-4,y:q.y-2,w:8,h:4},bossBounds())){damageBoss(q.damage);q.life=0;}
      if(q.life<=0||q.x<-20||q.x>worldWidth()+20||q.y<-20||q.y>(room==='screening'?SCREENING_WORLD_H:H)+20)q.life=0;
    }
    playerShots=playerShots.filter(q=>q.life>0);
    for(const q of hostileShots){if(!q.alive)continue;if(room==='screening'&&q.sourceBot){const shooter=q.sourceBot,sourceHeight=flyingBots.includes(shooter)?16:38,visible=shooter.alive&&shooter.y>=cameraY+26&&shooter.y+sourceHeight<=cameraY+H-12;if(!visible){q.alive=false;continue;}}if(q.homing&&q.team!=='player'){const current=Math.atan2(q.vy,q.vx),target=Math.atan2(player.y+player.h/2-q.y-q.h/2,player.x+player.w/2-q.x-q.w/2),delta=Math.atan2(Math.sin(target-current),Math.cos(target-current)),angle=current+Math.max(-2.8*dt,Math.min(2.8*dt,delta)),speed=Math.max(120,Math.hypot(q.vx,q.vy));q.vx=Math.cos(angle)*speed;q.vy=Math.sin(angle)*speed;}q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.gravity)q.vy+=q.gravity*dt;
      if(q.team==='player'&&room==='core'&&boss&&overlaps({x:q.x,y:q.y,w:q.w,h:q.h},boss)){damageBoss(q.damage||1);q.alive=false;}
      else if(q.team==='player'&&room==='screening'){for(const bot of hrQuestioners)if(bot.alive&&overlaps({x:q.x,y:q.y,w:q.w,h:q.h},{x:bot.x,y:FLOOR-25,w:21,h:25})){bot.hp-=q.damage||1;q.alive=false;if(bot.hp<=0){bot.alive=false;spawnBurst(bot.x+10,FLOOR-12,'#e7d4b8',10);}break;}}
      else if(q.team!=='player'&&overlaps(player,{x:q.x,y:q.y,w:q.w,h:q.h})){q.alive=false;hurt();}
      if(room==='portfolio'&&q.falling&&q.y+q.h>=FLOOR){q.y=FLOOR-q.h;q.vy=0;q.falling=false;q.life=.38;}
      if(room==='portfolio'&&q.life!==undefined){q.life-=dt;if(q.life<=0)q.alive=false;}
      if(q.y>(room==='screening'?SCREENING_WORLD_H:H)+30||q.x<camera-35||q.x>camera+W+35)q.alive=false;
    }
    hostileShots=hostileShots.filter(q=>q.alive);
    particles=particles.filter(p=>p.life>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.fx)p.vy+=96*dt;else p.age+=dt;p.life-=dt;}
  }
  function archiveHazards(dt){
    archiveTime+=dt;
    if(!art.archive.complete){
      const shred=archiveTime%4.8;if(shred>=2.35&&shred<3.05&&player.x+player.w>450&&player.x<506&&player.y+player.h>164)hurt();
      const stamp=archiveTime%6.6;if(stamp>=4.35&&stamp<4.92&&player.x+player.w>706-18&&player.x<706+18&&player.y+player.h>106)hurt();
    }
    for(const trap of archiveTraps){
      if(!archiveTrapState(trap).active)continue;
      const hitbox=trap.kind==='laser'?{x:trap.x+9,y:FLOOR-23,w:trap.w-18,h:3}:{x:trap.x+4,y:FLOOR-16,w:trap.w-8,h:15};
      if(overlaps(player,hitbox))hurt();
    }
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
  function updateScreeningTraps(){
    for(const trap of screeningTraps){
      if(screeningTrapState(trap).active&&overlaps(player,{x:trap.x,y:trap.y-8,w:trap.w,h:10}))hurt();
    }
  }
  function updateScreeningPlatforms(dt){
    for(const platform of platforms){
      if(platform.motion&&platform.active!==false){
        const previousX=platform.x,motion=platform.motion;platform.x+=motion.dir*motion.speed*dt;
        if(platform.x<=motion.minX){platform.x=motion.minX;motion.dir=1;}else if(platform.x>=motion.maxX){platform.x=motion.maxX;motion.dir=-1;}
        const shift=platform.x-previousX;
        if(player.standing===platform&&player.ground)player.x=Math.max(0,Math.min(W-player.w,player.x+shift));
        for(const bot of hrQuestioners)if(bot.alive&&bot.platformRef===platform&&!bot.falling){bot.x=Math.max(platform.x+4,Math.min(platform.x+platform.w-32,bot.x+shift));bot.y=platform.y-36;}
      }
      if(platform.kind!=='crumble')continue;
      if(platform.active&&platform.timer>0){platform.timer-=dt;if(platform.timer<=0){platform.timer=0;platform.active=false;platform.respawn=1.45;if(player.standing===platform){player.standing=null;player.ground=false;}for(const bot of hrQuestioners)if(bot.alive&&bot.platformRef===platform){bot.platformRef=null;bot.falling=true;bot.vy=0;bot.state='fall';}}}
      else if(!platform.active){platform.respawn-=dt;if(platform.respawn<=0){platform.active=true;platform.respawn=0;}}
    }
  }
  function updateHrQuestioners(dt){
    for(const bot of hrQuestioners){
      if(!bot.alive)continue;
      if(bot.falling){
        const oldBottom=bot.y+36;bot.vy=(bot.vy||0)+440*dt;bot.y+=bot.vy*dt;
        let landing=null;for(const surface of platforms){if(surface.active===false||oldBottom>surface.y+2||bot.y+36<surface.y||bot.x+22<surface.x||bot.x+2>surface.x+surface.w)continue;if(!landing||surface.y<landing.y)landing=surface;}
        if(landing){bot.y=landing.y-36;bot.platformY=landing.y;bot.platformRef=landing;bot.falling=false;bot.vy=0;bot.state='patrol';bot.min=landing.x+4;bot.max=landing.x+landing.w-32;bot.x=Math.max(bot.min,Math.min(bot.max,bot.x));}
        else if(bot.y>SCREENING_WORLD_H){bot.alive=false;}
        continue;
      }
      if(bot.platformRef){if(bot.platformRef.active===false){bot.platformRef=null;bot.falling=true;bot.vy=0;bot.state='fall';continue;}bot.y=bot.platformRef.y-36;}
      if(bot.state==='aim'){
        const visible=bot.y>=cameraY+26&&bot.y+38<=cameraY+H-12,verticalDistance=Math.abs(player.y+player.h/2-(bot.y+17));
        if(!visible||verticalDistance>120){bot.state='patrol';bot.timer=0;}
        else{bot.timer-=dt;if(bot.timer<=0){const dx=player.x+player.w/2-(bot.x+12),sx=bot.x+(dx<0?9:23),sy=bot.y+15,tx=player.x+player.w/2,ty=player.y+player.h/2,g=160,flight=Math.max(.55,Math.min(1.05,Math.max(Math.abs(tx-sx)/112,Math.abs(ty-sy)/100)));hostileShots.push({x:sx-4,y:sy-4,vx:(tx-sx)/flight,vy:(ty-sy-.5*g*flight*flight)/flight,gravity:g,w:9,h:9,alive:true,kind:'rock',sourceBot:bot});bot.state='throw';bot.timer=.22;bot.fireCooldown=1.55+Math.random()*.75;}}
      }else if(bot.state==='throw'){
        bot.timer-=dt;if(bot.timer<=0)bot.state='patrol';
      }else{
        bot.fireCooldown-=dt;const dx=player.x+player.w/2-(bot.x+12),dy=player.y+player.h/2-(bot.y+17),distance=Math.hypot(dx,dy),visible=bot.y>=cameraY+26&&bot.y+38<=cameraY+H-12;
        if(visible&&bot.fireCooldown<=0&&distance<230&&Math.abs(dy)<110){bot.state='aim';bot.timer=.62;bot.targetX=player.x+player.w/2;bot.targetY=player.y+player.h/2;bot.aimFlight=Math.max(.55,Math.min(1.05,Math.max(Math.abs(dx)/112,Math.abs(dy)/100)));}
        else{const patrolMin=bot.platformRef?bot.platformRef.x+4:bot.min,patrolMax=bot.platformRef?bot.platformRef.x+bot.platformRef.w-32:bot.max;bot.x+=bot.dir*bot.speed*dt;if(bot.x>=patrolMax){bot.x=patrolMax;bot.dir=-1;}else if(bot.x<=patrolMin){bot.x=patrolMin;bot.dir=1;}}
      }
      if(overlaps(player,{x:bot.x+4,y:bot.y+5,w:17,h:30}))hurt();
    }
  }
  function updatePortfolio(dt){
    for(const beam of portfolioLasers){const x=portfolioLaserPosition(beam),{active}=portfolioLaserState(beam);if(active&&overlaps(player,{x:x-2,y:28,w:4,h:FLOOR-28}))hurt();}
    for(const bot of portfolioCritics){if(!bot.alive)continue;
      if(bot.kind==='flyer')bot.y=bot.baseY+Math.sin(time*2.4+bot.phase)*7;else bot.y=bot.baseY;
      const size=portfolioBotSize(bot),sx=bot.x+size.w/2,sy=bot.y+size.h*.42,distance=Math.hypot(player.x+player.w/2-sx,player.y+player.h/2-sy);
      if(bot.kind!=='walker'&&bot.state==='aim'){
        bot.timer-=dt;
        if(bot.timer<=0){const dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,len=Math.max(1,Math.hypot(dx,dy)),heavy=bot.kind==='heavy',speed=heavy?48:76;
          hostileShots.push({x:sx-4,y:sy-3,vx:dx/len*speed,vy:dy/len*speed,w:heavy?10:7,h:heavy?8:5,alive:true,kind:'portfolioBolt'});
          bot.state='patrol';bot.fireCooldown=(heavy?4.5:3.0)+Math.random()*(heavy?1.2:1.3);
        }
      }else{
        bot.fireCooldown-=dt;
        const range=bot.kind==='heavy'?310:270;
        if(bot.kind!=='walker'&&bot.fireCooldown<=0&&distance<range){bot.state='aim';bot.timer=bot.kind==='heavy'?.95:.66;bot.targetX=player.x+player.w/2;bot.targetY=player.y+player.h/2;}
        else{bot.x+=bot.dir*bot.speed*dt;if(bot.x<=bot.min){bot.x=bot.min;bot.dir=1;}else if(bot.x>=bot.max){bot.x=bot.max;bot.dir=-1;}}
      }
      if(overlaps(player,portfolioBotBounds(bot)))hurt();
    }
  }
  function updateFlyingBots(dt){
    for(const bot of flyingBots){
      if(!bot.alive)continue;
      bot.y=bot.baseY+Math.sin(time*2.2+bot.phase)*7;
      const screenVisible=room!=='screening'||(bot.y>=cameraY+26&&bot.y+16<=cameraY+H-12),verticalDistance=Math.abs(player.y+player.h/2-(bot.y+8));
      if(bot.state==='aim'){
        if(room==='screening'&&(!screenVisible||verticalDistance>180)){bot.state='fly';bot.timer=0;bot.fireCooldown=Math.max(bot.fireCooldown,1.2);}
        else{bot.timer-=dt;}
        if(bot.state==='aim'&&bot.timer<=0){
          const sx=bot.x+11,sy=bot.y+8,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,len=Math.max(1,Math.hypot(dx,dy));
          hostileShots.push({x:sx,y:sy,vx:dx/len*102,vy:dy/len*102,w:7,h:5,alive:true,kind:'cursor',sourceBot:bot});
          bot.state='fly';bot.fireCooldown=3.1;
        }
      }else{
        bot.fireCooldown-=dt;
        const distance=Math.hypot(player.x+player.w/2-(bot.x+11),player.y+player.h/2-(bot.y+8));
        if(screenVisible&&bot.fireCooldown<=0&&distance<300&&(room!=='screening'||verticalDistance<180)){bot.state='aim';bot.timer=.56;bot.targetX=player.x+player.w/2;bot.targetY=player.y+player.h/2;}
        else{
          bot.x+=bot.dir*bot.speed*dt;
          if(bot.x>=bot.max){bot.x=bot.max;bot.dir=-1;}else if(bot.x<=bot.min){bot.x=bot.min;bot.dir=1;}
        }
      }
      if(overlaps(player,{x:bot.x+2,y:bot.y+1,w:18,h:13}))hurt();
    }
  }
  function updateBoss(dt){
    if(!boss||portfolioFinale)return;const config=gameBalance;boss.hitCooldown=Math.max(0,boss.hitCooldown-dt);boss.stompCooldown=Math.max(0,boss.stompCooldown-dt);boss.flash=Math.max(0,boss.flash-dt);
    if(boss.variant==='hr'&&boss.state!=='defeat'&&boss.phase===0&&boss.hp<=boss.maxHp*.5){
      const center=boss.x+boss.w/2;boss.phase=1;boss.w=68;boss.h=84;boss.x=center-boss.w/2;boss.y=FLOOR-boss.h;
      boss.phaseBanner=2.5;boss.phaseShield=1.0;boss.attackIndex=0;boss.recruiterTrapTimer=999;boss.recruiterTraps=[{assistant:'scanner',x:252,y:53,baseY:53,platformY:62,phase:.4,warning:1.1,alive:true,state:'patrol',lastCombo:-1},{assistant:'reviewer',x:126,y:79,platformY:115,min:120,max:145,dir:1,speed:9,warning:1.1,alive:true,state:'patrol',lastCombo:-1}];tone(145,.3,'sawtooth');
    }
    if(boss.variant==='creative'&&boss.hp<boss.maxHp*.5&&boss.phase<2){boss.phase=2;boss.hp=boss.maxHp;boss.phaseTransition=2.25;boss.phaseBanner=0;boss.phaseShield=0;boss.attackIndex=0;boss.state='phaseTransition';boss.timer=0;boss.floorTrapWarning=0;boss.floorTrapActive=0;boss.floorTrapTimer=.8;hostileShots=[];playerShots=[];particles=[];spawnCreativeDrones();mouse.left=false;player.x=Math.max(18,Math.min(W-player.w-18,player.x));player.y=FLOOR-player.h;player.vx=0;player.vy=0;player.ground=true;player.inv=2.9;mode='phaseTransition';tone(190,.25,'sawtooth');return;}
    if(boss.variant==='ceo'&&boss.phase===0&&boss.hp<=boss.maxHp*.67){boss.phase=1;boss.phaseBanner=2.0;boss.phaseShield=1.5;boss.attackIndex=0;tone(155,.24,'sawtooth');}
    else if(boss.variant==='ceo'&&boss.phase===1&&boss.hp<=boss.maxHp*.34){boss.phase=2;boss.phaseBanner=2.4;boss.phaseShield=1.8;boss.attackIndex=0;boss.moveSpeed=92;tone(120,.32,'sawtooth');}
    boss.phaseBanner=Math.max(0,(boss.phaseBanner||0)-dt);boss.phaseShield=Math.max(0,(boss.phaseShield||0)-dt);
    if(boss.state==='defeat'){
      if(boss.timer>0)boss.timer-=dt;
      if(boss.variant!=='hr'&&boss.variant!=='creative')for(let i=0;i<2;i++)spawnBurst(boss.x+12+Math.random()*90,boss.y+20+Math.random()*85,i%2?'#ee6a5c':'#cfc1a4',1);
      if(coreStage===2&&boss.variant==='hr'){
        if(boss.timer<=0&&!boss.passageOpened){boss.passageOpened=true;hrLiftOpen=true;tone(320,.2,'triangle');}
        return;
      }
      if(coreStage===3&&boss.variant==='creative'&&boss.timer<=0){beginPortfolioFinale();return;}
      if(boss.timer<=0)showVictory();return;
    }
    if(boss.variant==='hr'){
      const groundY=FLOOR-boss.h,minX=14,maxX=W-boss.w-14;
      boss.jumpCooldown-=dt;
      if(boss.state==='intro'&&boss.entranceTargetX!==null){
        boss.walkDir=-1;boss.walking=boss.x>boss.entranceTargetX;
        if(boss.walking)boss.x=Math.max(boss.entranceTargetX,boss.x-boss.entranceSpeed*dt);
        boss.y=groundY;
      }else if(boss.jumping){
        boss.jumpVy+=430*dt;boss.y+=boss.jumpVy*dt;
        const dx=boss.jumpTargetX-boss.x;boss.x+=Math.sign(dx)*Math.min(Math.abs(dx),boss.jumpSpeed*dt);
        if(boss.y>=groundY){boss.y=groundY;boss.jumpVy=0;boss.jumping=false;boss.walking=false;spawnBurst(boss.x+boss.w/2,FLOOR-2,'#d6ae72',8);}
      }else if(boss.jumpWindup>0){
        boss.jumpWindup=Math.max(0,boss.jumpWindup-dt);boss.walking=false;
        if(boss.jumpWindup===0){boss.jumping=true;boss.jumpVy=-230;boss.jumpSpeed=68;}
      }else{
        const delta=(player.x+player.w/2)-(boss.x+boss.w/2);boss.walkDir=Math.sign(delta)||boss.walkDir;
        boss.walking=Math.abs(delta)>42;
        if(boss.walking)boss.x+=boss.walkDir*boss.walkSpeed*dt;
        if(boss.jumpCooldown<=0&&boss.state!=='intro'&&boss.state!=='defeat'){
          boss.jumpWindup=.2;boss.walking=false;
          boss.jumpTargetX=Math.max(minX,Math.min(maxX,delta<0?player.x-boss.w-24:player.x+player.w+24));
          boss.jumpCooldown=6+Math.random()*3.0;
        }
      }
      if(boss.state!=='intro')boss.x=Math.max(minX,Math.min(maxX,boss.x));
    }else if(boss.variant==='creative'){
      const minX=46,maxX=W-boss.w-42,flightSpeed=boss.phase>=2?58:38;
      // The Curator glides continuously across the chamber and keeps a clear gap above the floor.
      if(boss.state!=='intro'&&boss.state!=='defeat'){
        boss.x+=boss.moveDir*flightSpeed*dt;
        if(boss.x<=minX){boss.x=minX;boss.moveDir=1;}else if(boss.x>=maxX){boss.x=maxX;boss.moveDir=-1;}
        const hoverCenter=boss.phase>=2?46:49,hoverRange=boss.phase>=2?12:8;
        boss.y=hoverCenter+Math.sin(time*1.35+boss.flightPhase)*hoverRange+Math.sin(time*.58+boss.flightPhase)*3;
      }
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
      const attacks=boss.variant==='hr'?(hrPhase===0?['questionBurst']:hrPhase===1?['deadlineRain','hrScan']:['orbVolley','resumeRain','orbVolley','questionBurst','resumeRain']):boss.variant==='creative'?(boss.phase>=2?['commentSpread','markupVolley','reviewBeam','caseRain','markupVolley','commentSpread']:['commentSpread','commentSpread','reviewBeam']):boss.variant==='ceo'?(boss.phase===0?['ceoVolley','ceoSlam']:boss.phase===1?['ceoVolley','ceoRain','ceoBeam','ceoSlam','ceoVolley']:['ceoVolley','ceoRain','ceoVolley','ceoBeam','ceoSlam','ceoRain','ceoVolley']):['volley','filter'];
      boss.attack=attacks[boss.attackIndex%attacks.length];boss.attackIndex++;
      boss.filter=boss.variant==='hr'?['Почему именно мы?','Назовите свою слабую сторону.','Где вы видите себя через 5 лет?','Есть ли у вас вопросы?'][boss.attackIndex%4]:boss.variant==='ceo'?['Готовы работать за идею?','Офис — это семья.','30 000 ₽ и бесплатный чай.','ГПХ, но с перспективой.'][boss.attackIndex%4]:['Junior. Опыт от 5 лет.','Знание 12 программ.','Возраст до 25. Опыт от 10 лет.','Сильный продуктовый майндсет.'][boss.attackIndex%4];
      boss.targetX=Math.max(38,Math.min(W-38,player.x+player.vx*.35));boss.warningXs=(boss.attack==='ceoRain'||boss.attack==='caseRain'&&boss.variant==='creative'&&hrPhase===2)?[36,104,172,240,308,370]:['resumeRain','caseRain'].includes(boss.attack)?[48,144,240,336]:[Math.max(38,boss.targetX-43),boss.targetX,Math.min(W-38,boss.targetX+43)];
      boss.state='tell';boss.timer=boss.variant==='skull'&&coreStage===1?1.0:config.tell*(boss.variant==='creative'&&boss.phase>=2?.78:1);boss.attackSpawned=false;boss.face='alert';return;
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
    if(boss.state==='vulnerable'&&boss.timer<=0){boss.state='wait';boss.face='watch';boss.timer=boss.variant==='skull'&&coreStage===1?.62:config.gap*(boss.variant==='ceo'&&boss.phase>=2?.34:boss.variant==='creative'&&boss.phase>=2?.38:1);}
    if(boss.state==='hurt'&&boss.timer<=0){boss.state='vulnerable';boss.face='weak';boss.timer=boss.vulnLeft||.5;}
  }
  function activateBossAttack(){
    if(boss.attack==='markupVolley'&&boss.variant==='creative'){
      const sx=boss.x+(boss.x>W/2?12:boss.w-18),sy=boss.y+48,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,angle=Math.atan2(dy,dx),speed=112;
      for(const spread of [-.31,-.12,.12,.31]){const a=angle+spread;hostileShots.push({x:sx,y:sy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,w:25,h:10,alive:true,kind:'brush'});}
      if(boss.phase>=2)for(const x of boss.warningXs)hostileShots.push({x:x-13,y:31,vx:0,vy:0,w:26,h:17,alive:true,kind:'bundle',falling:true});
    }else if(boss.attack==='orbVolley'||boss.attack==='markupVolley'){
      const sx=boss.x+(boss.x>W/2?10:boss.w-16),sy=boss.y+54,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,angle=Math.atan2(dy,dx);
      const spreads=boss.variant==='creative'&&boss.phase>=2?[-.48,-.24,0,.24,.48]:[-.30,0,.30],speed=boss.variant==='creative'&&boss.phase>=2?116:96;
      for(const spread of spreads){const a=angle+spread;hostileShots.push({x:sx,y:sy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-12,gravity:74,w:12,h:12,alive:true,kind:'orb'});}
      if(boss.variant==='hr'&&boss.phase>=1){const helper=boss.recruiterTraps.find(a=>a.assistant==='reviewer'&&a.alive);if(helper){const ox=helper.x+12,oy=helper.y+14,tx=player.x+player.w/2,ty=player.y+player.h/2,g=150,flight=Math.max(.55,Math.min(1.0,Math.max(Math.abs(tx-ox)/120,Math.abs(ty-oy)/100)));hostileShots.push({x:ox-4,y:oy-4,vx:(tx-ox)/flight,vy:(ty-oy-.5*g*flight*flight)/flight,gravity:g,w:9,h:9,alive:true,kind:'rock'});}}
    }else if(boss.attack==='commentSpread'){
      const sx=boss.x+(boss.x>W/2?12:boss.w-20),sy=boss.y+50,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,angle=Math.atan2(dy,dx);
      for(const spread of [-.34,0,.34]){const a=angle+spread;hostileShots.push({x:sx,y:sy,vx:Math.cos(a)*92,vy:Math.sin(a)*92,w:17+Math.random()*5,h:10+Math.random()*3,alive:true,kind:'shard',spin:Math.random()*Math.PI*2});}
    }else if(boss.attack==='questionBurst'){
      const sx=boss.x+(boss.x>W/2?7:boss.w-16),sy=boss.y+43,dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,angle=Math.atan2(dy,dx);
      for(const spread of [-.28,0,.28]){const a=angle+spread;hostileShots.push({x:sx,y:sy+spread*18,vx:Math.cos(a)*78,vy:Math.sin(a)*78,w:22,h:15,alive:true,kind:'question'});}
      if(boss.variant==='hr'&&boss.phase>=1){const helper=boss.recruiterTraps.find(a=>a.assistant==='scanner'&&a.alive);if(helper){const ox=helper.x+14,oy=helper.y+9,tx=player.x+player.w/2,ty=player.y+player.h/2,a=Math.atan2(ty-oy,tx-ox),speed=140;hostileShots.push({x:ox-6,y:oy-2,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,w:14,h:4,alive:true,kind:'reviewRay'});}}
    }else if(boss.attack==='volley'){
      const dir=player.x+player.w/2<boss.x+boss.w/2?-1:1,sx=boss.x+(dir<0?boss.w*.22:boss.w*.78),sy=boss.y+boss.h*.54;
      const dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,angle=Math.atan2(dy,dx),speed=108*gameBalance.shot;
      for(const spread of [-.18,0,.18]){const a=angle+spread;hostileShots.push({x:sx,y:sy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,w:14,h:9,alive:true,kind:'resume'});}
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
    if(portfolioFinale){updatePortfolioFinale(dt);return;}
    if(!boss)return;
    if(boss.variant==='creative'&&boss.state==='defeat'){updateBoss(dt);return;}
    if(boss.variant==='hr'&&boss.phase>=1&&boss.state!=='defeat'){
      boss.recruiterTrapTimer-=dt;
      if(boss.recruiterTrapTimer<=0){
        const choices=platforms.filter(p=>p.kind==='paper'&&p.y>=80&&!boss.recruiterTraps.some(t=>t.platformY===p.y&&t.alive));
        if(choices.length){const p=choices[Math.floor(Math.random()*choices.length)],x=p.x+(p.w-24)/2;boss.recruiterTraps.push({x,y:p.y-36,platformY:p.y,state:'patrol',alive:true,warning:.72,life:2.15,dir:player.x<x?-1:1,speed:0});}
        boss.recruiterTrapTimer=2.4+Math.random()*1.2;
      }
      for(const trap of boss.recruiterTraps){
        if(!trap.alive)continue;
        if(trap.assistant){if(trap.warning>0)trap.warning=Math.max(0,trap.warning-dt);if(trap.assistant==='reviewer'){trap.x+=trap.dir*trap.speed*dt;if(trap.x<=trap.min){trap.x=trap.min;trap.dir=1;}else if(trap.x>=trap.max){trap.x=trap.max;trap.dir=-1;}trap.state=boss.state==='tell'&&boss.attack==='orbVolley'?'aim':'patrol';trap.targetX=player.x+player.w/2;trap.targetY=player.y+player.h/2;}else{trap.y=trap.baseY+Math.sin(time*3.2+trap.phase)*3;trap.state=boss.state==='tell'&&boss.attack==='questionBurst'?'aim':'patrol';}if(overlaps(player,hrAssistantBounds(trap)))hurt();continue;}
        if(trap.warning>0)trap.warning=Math.max(0,trap.warning-dt);
        else{trap.life-=dt;if(trap.life<=0){trap.alive=false;spawnBurst(trap.x+12,trap.y+20,'#d7b987',5);continue;}
          if(overlaps(player,{x:trap.x+2,y:trap.y+3,w:23,h:33}))hurt();
        }
      }
      boss.recruiterTraps=boss.recruiterTraps.filter(t=>t.alive);
    }
    if(boss.variant==='skull'&&coreStage===1&&boss.state!=='intro'&&boss.state!=='defeat'){
      for(const platform of platforms)if(platform.kind==='crumble'){
        if(platform.active&&platform.timer>0){platform.timer-=dt;if(platform.timer<=0){platform.timer=0;platform.active=false;platform.respawn=1.55;if(player.standing===platform){player.standing=null;player.ground=false;}}}
        else if(!platform.active){platform.respawn-=dt;if(platform.respawn<=0){platform.active=true;platform.respawn=0;}}
      }
      boss.platformDropTimer-=dt;
      if(boss.platformDropTimer<=0){const available=platforms.filter(p=>p.kind==='crumble'&&p.active&&p.timer<=0&&player.standing!==p);if(available.length)available[Math.floor(Math.random()*available.length)].timer=.82;boss.platformDropTimer=5.2+Math.random()*1.3;}
      boss.floorTrapTimer-=dt;
      if(boss.floorTrapTimer<=0&&boss.floorTrapWarning<=0&&boss.floorTrapActive<=0){boss.floorTrapX=[124,260][Math.floor(Math.random()*2)];boss.floorTrapWarning=.9;boss.floorTrapTimer=3.2+Math.random()*1.2;}
      if(boss.floorTrapWarning>0){boss.floorTrapWarning-=dt;if(boss.floorTrapWarning<=0)boss.floorTrapActive=.68;}
      if(boss.floorTrapActive>0){boss.floorTrapActive-=dt;if(player.y+player.h>=FLOOR-4&&player.x+player.w>boss.floorTrapX-25&&player.x<boss.floorTrapX+25)hurt();}
    }
    if(boss.variant==='creative'&&boss.phase>=2&&boss.state!=='defeat'){
      for(const drone of creativeDrones){if(!drone.alive)continue;drone.y=drone.baseY+Math.sin(time*2.4+drone.phase)*7;
        const size=portfolioBotSize(drone),sx=drone.x+size.w/2,sy=drone.y+size.h*.42,distance=Math.hypot(player.x+player.w/2-sx,player.y+player.h/2-sy);
        if(drone.state==='aim'){drone.timer-=dt;if(drone.timer<=0){const dx=player.x+player.w/2-sx,dy=player.y+player.h/2-sy,len=Math.max(1,Math.hypot(dx,dy));hostileShots.push({x:sx-4,y:sy-3,vx:dx/len*76,vy:dy/len*76,w:7,h:5,alive:true,kind:'portfolioBolt'});drone.state='patrol';drone.fireCooldown=2.7+Math.random()*1.1;}}
        else{drone.fireCooldown-=dt;if(drone.fireCooldown<=0&&distance<285){drone.state='aim';drone.timer=.62;drone.targetX=player.x+player.w/2;drone.targetY=player.y+player.h/2;}else{drone.x+=drone.dir*drone.speed*dt;if(drone.x<=drone.min){drone.x=drone.min;drone.dir=1;}else if(drone.x>=drone.max){drone.x=drone.max;drone.dir=-1;}}}
        if(overlaps(player,portfolioBotBounds(drone)))hurt();
      }
    }
    if(boss.variant==='creative'){
      boss.floorTrapTimer-=dt;
      if(boss.floorTrapTimer<=0&&boss.floorTrapWarning<=0&&boss.floorTrapActive<=0){boss.floorTrapX=[54,124,194,264,334][Math.floor(Math.random()*5)];boss.floorTrapWarning=boss.phase>=2?.64:.72;boss.floorTrapTimer=boss.phase>=2?1.55+Math.random()*.95:2.7+Math.random()*1.4;}
      if(boss.floorTrapWarning>0){boss.floorTrapWarning-=dt;if(boss.floorTrapWarning<=0)boss.floorTrapActive=boss.phase>=2?.82:.62;}
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
      const bounds=bossBounds(),stomp=boss.variant==='hr'&&player.vy>0&&player.previousBottom<=bounds.y+9;
      if(stomp){
        if(boss.stompCooldown<=0){boss.hp=Math.max(0,boss.hp-2);boss.stompCooldown=.62;boss.flash=.2;if(boss.hp>0)spawnBurst(player.x+player.w/2,bounds.y,'#f0d18e',10);tone(boss.hp===0?160:420,boss.hp===0?.18:.08,boss.hp===0?'sawtooth':'square');if(boss.hp<=0)startBossDefeat();}
        player.y=bounds.y-player.h;player.vy=-132;player.ground=false;player.standing=null;player.inv=Math.max(player.inv,.5);player.hurt=0;
      }else{
      const freshHit=player.inv<=0;
      hurt();
      if(boss.variant==='creative'&&freshHit){
        const nearLeft=player.x<52,nearRight=player.x+player.w>W-52;
        if(nearLeft||nearRight){const escape=nearLeft?1:-1;player.vx=escape*108;boss.x=Math.max(42,Math.min(W-boss.w-42,boss.x-escape*24));boss.x=nearLeft?Math.max(boss.x,player.x+player.w+14):Math.min(boss.x,player.x-boss.w-14);boss.x=Math.max(42,Math.min(W-boss.w-42,boss.x));}
      }
      }
    }
    updateBoss(dt);
  }
  function update(dt){
    if(mode==='phaseTransition'){boss.phaseTransition=Math.max(0,boss.phaseTransition-dt);if(boss.phaseTransition<=0){mode='play';boss.phaseTransition=0;boss.state='wait';boss.face='watch';boss.timer=.85;boss.phaseBanner=2.8;boss.phaseShield=3.0;boss.floorTrapTimer=1.0;}return;}
    if(mode==='transition'){transitionTime-=dt;if(transitionTime<=0){if(nextRoom==='core'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupCore(1);}else if(nextRoom==='screening'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupScreening();}else if(nextRoom==='stage2Boss'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupCore(2);}else if(nextRoom==='portfolio'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupPortfolio();}else if(nextRoom==='portfolioBoss'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupCore(3);}else if(nextRoom==='ceoBoss'){hearts=Math.min(START_HEARTS,player.hp+HEARTS_PER_STAGE);setupCore(4);}else{mode='play';room='archive';} }return;}
    if(mode==='intro'){updateShots(dt);updateBoss(dt);return;}
    if(mode!=='play')return;
    if(room==='core'&&portfolioFinale){moveAndCollide(dt);if(mode!=='play')return;updatePortfolioFinale(dt);return;}
    if(room==='screening')updateScreeningPlatforms(dt);
    moveAndCollide(dt);
    if(mode!=='play')return;
    if(mouse.left)shoot();
    updateShots(dt);
    if(room==='archive'){updateArchiveBots(dt);updateFlyingBots(dt);archiveHazards(dt);}else if(room==='screening'){updateFlyingBots(dt);updateHrQuestioners(dt);updateScreeningTraps();}else if(room==='portfolio'){updatePortfolio(dt);}else{updateCoreSpecial(dt);}
    if(room==='archive'&&nearTerminal()){} // terminal prompt is drawn at the object
  }

  function showVictory(){
    if(coreStage===1){
      mode='done';hostileShots=[];playerShots=[];
      panel(`<p class="eyebrow">Этап 01/03 — Отклик</p><h2>РЕЗЮМЕ ПРОШЛО ОТБОР</h2><p>Ядро ATS отключено. Можно идти дальше.</p><button class="primary" id="continueAfterAts">ПРОДОЛЖИТЬ</button>`,'ending-card');
      document.getElementById('continueAfterAts').onclick=()=>{nextRoom='screening';transitionTime=.72;mode='transition';hostileShots=[];playerShots=[];overlay.innerHTML='';for(const key of Object.keys(keys))keys[key]=false;};
      return;
    }
    if(coreStage===2){
      mode='done';hostileShots=[];playerShots=[];
      panel(`<p class="eyebrow">Этап 02/03 — Собеседование</p><h2>HR ПРОЙДЕН</h2><p>Дальше — защита портфолио.</p><button class="primary" id="continueAfterHr">ПРОДОЛЖИТЬ</button>`,'ending-card');
      document.getElementById('continueAfterHr').onclick=()=>{nextRoom='portfolio';transitionTime=.9;mode='transition';hostileShots=[];playerShots=[];overlay.innerHTML='';for(const key of Object.keys(keys))keys[key]=false;};
      return;
    }
    if(coreStage===3){
      if(!portfolioFinale)beginPortfolioFinale();
      return;
    }
    if(coreStage===4){
      const finishRun=()=>{mode='done';nextRoom=null;transitionTime=0;hostileShots=[];playerShots=[];for(const key of Object.keys(keys))keys[key]=false;};
      const elapsed=()=>`${Math.max(1,Math.round((performance.now()-startTime)/1000))} сек · Получено ударов: ${hitsTaken}`;
      function showStagePicker(backAction=showOffer){
        finishRun();
        panel(`<p class="eyebrow">ПОВТОРНЫЙ ЗАХОД</p><h2>ВЫБРАТЬ ЭТАП</h2><p>Начните игру с нужной главы.</p><div class="stage-grid"><button class="primary" data-stage="1">01 · ОТКЛИК</button><button class="primary" data-stage="2">02 · СОБЕСЕДОВАНИЕ</button></div><button class="secondary" id="backToEnding">НАЗАД К ФИНАЛУ</button>`);
        overlay.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{
          deaths=0;hitsTaken=0;hearts=START_HEARTS;startTime=performance.now();nextRoom=null;const stage=Number(button.dataset.stage);
          if(stage===1){setupArchive(true);mode='play';}else setupScreening();
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
    panel(`<p class="eyebrow">ЭТАП 01/02</p><h2>РЕЗЮМЕ ПРОШЛО ПРОВЕРКУ</h2><p>HR согласился на встречу.<br>Дальше — следующий этап.</p><button class="primary" id="lift">ПРОДОЛЖИТЬ ИГРУ</button>`);
    document.getElementById('lift').onclick=()=>{nextRoom='screening';transitionTime=.72;mode='transition';hostileShots=[];playerShots=[];};
  }
  function showScreeningComplete(){
    nextRoom='stage2Boss';transitionTime=1.1;mode='transition';hostileShots=[];playerShots=[];
  }
  function showPortfolioComplete(){
    nextRoom='portfolioBoss';transitionTime=.72;mode='transition';hostileShots=[];playerShots=[];
  }
  function pause(){if(mode!=='play'&&mode!=='intro')return;pauseFrom=mode;mode='pause';panel(`<p class="eyebrow">АРХИВ СОХРАНЁН</p><h2>ПАУЗА</h2><p>Можно выдохнуть. Система подождёт.</p><button class="primary" id="resume">ПРОДОЛЖИТЬ</button>`);document.getElementById('resume').onclick=()=>{mode=pauseFrom;overlay.innerHTML=''};}

  // Input stays attached to the game surface.
  canvas.addEventListener('mousedown',event=>{
    event.preventDefault();canvas.focus();if(event.button===0){updateAimFromPointer(event);mouse.left=true;if(mode==='play'&&!portfolioFinale&&!player.shootCooldown)shoot();}
  });
  canvas.addEventListener('mousemove',event=>{
    updateAimFromPointer(event);
  });
  window.addEventListener('mouseup',event=>{if(event.button===0)mouse.left=false;});
  window.addEventListener('blur',()=>{mouse.left=false;for(const key of Object.keys(keys))keys[key]=false;});
  window.addEventListener('keydown',event=>{
    if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','AltLeft','AltRight'].includes(event.code))event.preventDefault();
    keys[event.code]=true;if(event.repeat)return;
    if((event.code==='Space'||event.code==='ArrowUp')&&mode==='play'){player.jumpBuffer=.13;}
    if(event.code==='KeyE'&&mode==='play'){
      if(nearFinalDiploma()){showRandomOffer();tone(620,.18,'sine');}
      else if(room==='archive'&&nearTerminal()){recordTutorial('interact');mode='transition';nextRoom='core';transitionTime=.72;hostileShots=[];playerShots=[];tone(260,.18,'triangle');}
      else if(room==='core'&&coreStage===2&&nearHrLift()){nextRoom='portfolio';transitionTime=.9;mode='transition';hostileShots=[];playerShots=[];tone(320,.14,'triangle');}
      else if(room==='core'&&(coreStage===1||coreStage===4)&&boss?.state==='defeat'&&boss.timer<2.2){showVictory();}
      else if(room==='screening'&&nearScreeningExit()){showScreeningComplete();tone(420,.12,'triangle');}
      else if(room==='portfolio'&&nearPortfolioExit()){showPortfolioComplete();tone(520,.12,'triangle');}
    }
    if(event.code==='Escape'){if(mode==='pause'){mode=pauseFrom;overlay.innerHTML='';}else pause();}
    if(event.code==='KeyR'&&mode==='fail')restartRoom();
  });
  window.addEventListener('keyup',event=>{keys[event.code]=false;});

  function frame(now){const dt=Math.min((now-(frame.last||now))/1000,.033);frame.last=now;const active=mode==='play'||mode==='intro'||mode==='transition'||mode==='phaseTransition';if(active){time+=dt;update(dt);}drawFrame();requestAnimationFrame(frame);}
  const previewRoom=new URLSearchParams(window.location.search).get('preview');
  if(previewRoom==='archive'){
    startTime=performance.now();hearts=START_HEARTS;mode='play';setupArchive(true);overlay.innerHTML='';
  }else if(previewRoom==='door'){
    startTime=performance.now();hearts=START_HEARTS;mode='play';setupArchive(true);archiveBots=[];flyingBots=[];archiveTraps=[];player.x=ARCHIVE_EXIT_X-24;camera=Math.max(0,Math.min(worldWidth()-W,player.x-130));tutorialStep=4;overlay.innerHTML='';
  }else if(previewRoom==='ats'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(1);overlay.innerHTML='';
  }else if(previewRoom==='stage2'){
    startTime=performance.now();hearts=START_HEARTS;setupScreening();
  }else if(previewRoom==='hr-boss'||previewRoom==='stage2boss'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(2);boss.x=224;boss.y=FLOOR-boss.h;boss.state='wait';boss.timer=.8;boss.jumpCooldown=1.2;boss.face='watch';player.inv=8;mode='play';overlay.innerHTML='';
  }else if(previewRoom==='stage2boss-win'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(2);boss.x=224;boss.y=FLOOR-boss.h;boss.state='defeat';boss.hp=0;boss.timer=2.8;player.inv=8;mode='play';overlay.innerHTML='';
  }else if(previewRoom==='stage2boss-phase2'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(2);boss.phase=1;boss.hp=Math.ceil(boss.maxHp*.5);boss.w=68;boss.h=84;boss.x=224;boss.y=FLOOR-boss.h;boss.state='wait';boss.timer=.8;boss.face='watch';boss.phaseBanner=2.2;boss.phaseShield=0;boss.recruiterTraps=[{assistant:'scanner',x:252,y:53,baseY:53,platformY:62,phase:.4,warning:0,alive:true,state:'patrol',lastCombo:-1},{assistant:'reviewer',x:126,y:79,platformY:115,min:120,max:145,dir:1,speed:9,warning:0,alive:true,state:'patrol',lastCombo:-1}];boss.recruiterTrapTimer=999;player.inv=3.0;mode='play';overlay.innerHTML='';
  }else if(previewRoom==='stage2lift'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(2);boss=null;hrLiftOpen=true;mode='play';player.x=W-69;overlay.innerHTML='';
  }else if(previewRoom==='stage3'){
    startTime=performance.now();hearts=START_HEARTS;setupPortfolio();
  }else if(previewRoom==='stage3exit'){
    startTime=performance.now();hearts=START_HEARTS;setupPortfolio();player.x=880;player.y=83;player.ground=true;player.lastSafeX=player.x;player.lastSafeY=player.y;camera=Math.max(0,Math.min(worldWidth()-W,player.x-130));portfolioCritics=[];portfolioLasers=[];portfolioRocks=[];
  }else if(previewRoom==='art-director'||previewRoom==='stage3boss'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(3);boss.state='wait';boss.timer=2.4;boss.floorTrapTimer=7;boss.face='watch';player.inv=2.2;mode='play';overlay.innerHTML='';
  }else if(previewRoom==='art-director-collapse'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(3);boss.hp=Math.floor(boss.maxHp*.49);boss.state='wait';boss.timer=1.1;boss.face='watch';player.inv=3;mode='play';overlay.innerHTML='';
  }else if(previewRoom==='art-director-phase2'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(3);boss.phase=2;boss.state='wait';boss.timer=.7;boss.face='watch';boss.phaseBanner=0;boss.phaseShield=0;boss.floorTrapTimer=1;spawnCreativeDrones();player.inv=999;mode='play';overlay.innerHTML='';
  }else if(previewRoom==='stage3boss-win'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(3);boss.phase=2;boss.hp=0;boss.state='defeat';boss.timer=1.8;boss.x=200;boss.y=44;player.x=72;player.inv=8;mode='play';overlay.innerHTML='';
  }else if(previewRoom==='stage3offer'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(3);boss=null;creativeDrones=[];portfolioFinale={phase:'diploma',timer:0,pedestalRise:1};player.x=153;player.y=FLOOR-player.h;player.ground=true;player.inv=0;mode='play';overlay.innerHTML='';
  }else if(previewRoom==='stage4boss'){
    startTime=performance.now();hearts=START_HEARTS;setupCore(4);overlay.innerHTML='';
  }else{player=makePlayer(30);renderTitle();}
  requestAnimationFrame(frame);
})();



















