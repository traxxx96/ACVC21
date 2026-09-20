/* ACVC21 - Mobile Responsive + Fullscreen + PIP Draggable */
const socket = io({
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  timeout: 10000
});

let localStream = null;
let screenStream = null;
let roomId = null;
let userName = null;
let callType = 'video';
let qualityPreset = 'hd';
let startMuted = false;
let facingMode = 'user';
let iceServersCache = null;
let focusedPeerId = null; // for focus mode

const peers = new Map();
let isMicOn = true;
let isCamOn = true;
let isScreenSharing = false;

const lobbyScreen = document.getElementById('lobbyScreen');
const callScreen = document.getElementById('callScreen');
const videoGrid = document.getElementById('videoGrid');
const roomInput = document.getElementById('roomInput');
const nameInput = document.getElementById('nameInput');
const callTypeSel = document.getElementById('callType');
const qualitySel = document.getElementById('quality');
const connStatus = document.getElementById('connStatus');
const latencyPill = document.getElementById('latencyPill');
const latencyVal = document.getElementById('latencyVal');
const shareUrlPreview = document.getElementById('shareUrlPreview');
const micBtn = document.getElementById('micBtn');
const camBtn = document.getElementById('camBtn');

const QUALITY = {
  fhd: { width: 1920, height: 1080, fps: 30, bitrate: 2500 },
  hd:  { width: 1280, height: 720,  fps: 30, bitrate: 1500 },
  sd:  { width: 640,  height: 480,  fps: 30, bitrate: 800 },
  low: { width: 640,  height: 360,  fps: 24, bitrate: 400 }
};

async function getRTCConfig() {
  if (iceServersCache) return iceServersCache;
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.iceServers?.length) {
        iceServersCache = {
          iceServers: data.iceServers,
          iceTransportPolicy: 'all',
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require',
          iceCandidatePoolSize: 10,
          sdpSemantics: 'unified-plan'
        };
        return iceServersCache;
      }
    }
  } catch {}
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
  ];
  iceServersCache = {
    iceServers,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceCandidatePoolSize: 10,
    sdpSemantics: 'unified-plan'
  };
  return iceServersCache;
}

(function init() {
  const params = new URLSearchParams(location.search);
  if (params.get('room')) roomInput.value = params.get('room');
  nameInput.value = `User-${Math.floor(Math.random()*9000+1000)}`;
  generateRoomIfEmpty();
  updateSharePreview();
  roomInput.addEventListener('input', updateSharePreview);
  enumerateDevices();
  getRTCConfig();

  // Fullscreen change listener
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
})();

function generateRoomIfEmpty() { if (!roomInput.value.trim()) generateRoom(); }
function generateRoom() {
  const adjectives = ['swift','calm','bright','neon','lunar','solar','echo','nova'];
  const nouns = ['room','call','sync','link','hub','beam','wave','pulse'];
  const adj = adjectives[Math.floor(Math.random()*adjectives.length)];
  const noun = nouns[Math.floor(Math.random()*nouns.length)];
  const num = Math.floor(Math.random()*900+100);
  roomInput.value = `${adj}-${noun}-${num}`;
  updateSharePreview();
}
function updateSharePreview() {
  const r = roomInput.value.trim() || 'your-room';
  const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(r)}`;
  if (shareUrlPreview) shareUrlPreview.textContent = url;
}
function copyLink() {
  const r = roomInput.value.trim() || 'demo';
  const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(r)}`;
  navigator.clipboard.writeText(url).then(()=> toast('🔗 Invite link copied!'));
}
function copyInvite() {
  const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(roomId)}`;
  navigator.clipboard.writeText(url).then(()=> toast('🔗 Invite link copied!'));
}
function toast(msg, ms=3500) {
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=> { el.style.opacity='0'; el.style.transform='translateY(10px)'; setTimeout(()=> el.remove(), 300); }, ms);
}
async function enumerateDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d=>d.kind==='videoinput');
    const mics = devices.filter(d=>d.kind==='audioinput');
    const camSel = document.getElementById('camSelect');
    const micSel = document.getElementById('micSelect');
    if (camSel) camSel.innerHTML = cams.map(d=> `<option value="${d.deviceId}">${d.label || 'Camera '+d.deviceId.slice(0,4)}</option>`).join('');
    if (micSel) micSel.innerHTML = mics.map(d=> `<option value="${d.deviceId}">${d.label || 'Mic '+d.deviceId.slice(0,4)}</option>`).join('');
  } catch {}
}
async function testDevices() {
  const preview = document.getElementById('devicePreview');
  const video = document.getElementById('testVideo');
  preview.style.display = preview.style.display==='none' ? 'block' : 'none';
  if (preview.style.display==='none') {
    if (video.srcObject) video.srcObject.getTracks().forEach(t=>t.stop());
    return;
  }
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    video.srcObject = s;
    enumerateDevices();
  } catch(e) { toast('❌ Camera/mic permission needed'); }
}
async function getMediaConstraints() {
  const q = QUALITY[qualityPreset] || QUALITY.hd;
  const audioOnly = callType === 'audio';
  const camSel = document.getElementById('camSelect');
  const micSel = document.getElementById('micSelect');
  const camId = camSel?.value;
  const micId = micSel?.value;
  const videoConstraints = audioOnly ? false : {
    width: { ideal: q.width },
    height: { ideal: q.height },
    frameRate: { ideal: q.fps, max: q.fps },
    facingMode: facingMode,
    ...(camId ? { deviceId: { exact: camId } } : {})
  };
  const audioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 48000,
    ...(micId ? { deviceId: { exact: micId } } : {})
  };
  return { video: videoConstraints, audio: audioConstraints };
}
async function joinRoom() {
  roomId = roomInput.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g,'').substring(0,30);
  userName = nameInput.value.trim() || 'Anonymous';
  callType = callTypeSel.value;
  qualityPreset = qualitySel.value;
  startMuted = document.getElementById('startMutedToggle').classList.contains('on');
  if (!roomId) { toast('Enter a Room ID'); return; }
  try {
    connStatus.textContent = 'Getting media...';
    const constraints = await getMediaConstraints();
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (startMuted) {
      localStream.getAudioTracks().forEach(t=> t.enabled = false);
      isMicOn = false;
      micBtn.classList.add('muted');
    }
    if (callType === 'audio') {
      localStream.getVideoTracks().forEach(t=> t.enabled = false);
      isCamOn = false;
      camBtn.classList.add('muted');
    }
    connStatus.textContent = 'Connecting...';
    socket.emit('join-room', { roomId, userName, audioOnly: callType==='audio' });
    lobbyScreen.classList.remove('active');
    callScreen.classList.add('active');
    renderLocalTile();
    updateGridLayout();
  } catch (err) {
    console.error(err);
    toast(`❌ Media error: ${err.message}`);
    connStatus.textContent = 'Ready';
  }
}

// FULLSCREEN + DRAGGABLE PIP LOGIC
function renderLocalTile() {
  const existing = document.getElementById('tile-local');
  if (existing) existing.remove();
  const tile = document.createElement('div');
  tile.className = `video-tile local ${callType==='audio' ? 'audio-only' : ''}`;
  tile.id = 'tile-local';
  tile.innerHTML = `
    <video id="localVideo" autoplay muted playsinline></video>
    <div class="audio-avatar">${(userName||'Y')[0].toUpperCase()}</div>
    <div class="tile-overlay"></div>
    <div class="tile-actions">
      <button class="tile-action-btn fullscreen-btn" title="Fullscreen" onclick="toggleFullscreen('tile-local')">⛶</button>
    </div>
    <div class="fullscreen-hint">Tap ⛶ for fullscreen</div>
    <div class="tile-info">
      <div class="tile-name">${userName} (You) ${isMicOn?'':'🔇'}</div>
      <div class="tile-stats">You • ${isCamOn?'📹':'📷 off'}</div>
    </div>
  `;
  videoGrid.prepend(tile);
  const v = tile.querySelector('video');
  v.srcObject = localStream;
  v.play().catch(()=>{});
  
  // Make local PIP draggable on mobile
  makeDraggable(tile);
  
  // Tap to show hint, double tap to fullscreen
  let lastTap = 0;
  tile.addEventListener('click', (e) => {
    if (e.target.closest('.tile-action-btn')) return;
    const now = Date.now();
    if (now - lastTap < 300) {
      // double tap = fullscreen
      toggleFullscreen('tile-local');
    } else {
      // single tap = show controls briefly
      tile.classList.add('touched');
      tile.classList.add('show-hint');
      setTimeout(()=> {
        tile.classList.remove('touched');
        tile.classList.remove('show-hint');
      }, 2000);
    }
    lastTap = now;
  });
}

function createPeerTile(peerId, peerName, audioOnly=false) {
  if (document.getElementById(`tile-${peerId}`)) return document.getElementById(`tile-${peerId}`);
  const tile = document.createElement('div');
  tile.className = `video-tile remote ${audioOnly ? 'audio-only' : ''}`;
  tile.id = `tile-${peerId}`;
  tile.innerHTML = `
    <video id="video-${peerId}" autoplay playsinline></video>
    <audio id="audio-${peerId}" autoplay></audio>
    <div class="audio-avatar">${(peerName||'U')[0].toUpperCase()}</div>
    <div class="tile-overlay"></div>
    <div class="tile-actions">
      <button class="tile-action-btn fullscreen-btn" title="Fullscreen other person's video" onclick="toggleFullscreen('tile-${peerId}')">⛶</button>
      <button class="tile-action-btn" title="Focus mode" onclick="focusPeer('${peerId}')">👁️</button>
    </div>
    <div class="fullscreen-hint">Tap for fullscreen • Drag PIP</div>
    <div class="tile-info">
      <div class="tile-name"><span id="name-${peerId}">${peerName||peerId.slice(0,6)}</span> <span id="mic-${peerId}"></span></div>
      <div class="tile-stats" id="stats-${peerId}">Connecting...</div>
    </div>
  `;
  videoGrid.appendChild(tile);
  updateGridLayout();

  // Tap to fullscreen on mobile - other person's video
  let lastTap = 0;
  tile.addEventListener('click', (e) => {
    if (e.target.closest('.tile-action-btn')) return;
    const now = Date.now();
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // On mobile, single tap = fullscreen other person's video
      if (now - lastTap < 300) {
        // double tap = focus mode
        focusPeer(peerId);
      } else {
        toggleFullscreen(`tile-${peerId}`);
      }
    } else {
      // Desktop: double tap fullscreen, single tap shows controls
      if (now - lastTap < 300) {
        toggleFullscreen(`tile-${peerId}`);
      } else {
        tile.classList.add('touched');
        tile.classList.add('show-hint');
        setTimeout(()=> {
          tile.classList.remove('touched');
          tile.classList.remove('show-hint');
        }, 2000);
      }
    }
    lastTap = now;
  });

  return tile;
}

function updateGridLayout() {
  const count = videoGrid.children.length;
  videoGrid.className = 'video-grid';
  if (count <=1) videoGrid.classList.add('cols-1');
  else if (count===2) videoGrid.classList.add('cols-2');
  else if (count===3) videoGrid.classList.add('cols-3');
  else videoGrid.classList.add('cols-4');
}

// FULLSCREEN LOGIC
function toggleFullscreen(tileId) {
  const tile = document.getElementById(tileId);
  if (!tile) return;

  // If already fullscreen, exit
  if (tile.classList.contains('fullscreen-mode') || document.fullscreenElement === tile) {
    exitFullscreen();
    return;
  }

  // Exit any other fullscreen first
  exitFullscreen();

  // Try native fullscreen first, fallback to custom CSS fullscreen
  if (tile.requestFullscreen) {
    tile.requestFullscreen().then(()=> {
      tile.classList.add('fullscreen-mode');
      toast(`⛶ Fullscreen: ${tileId==='tile-local' ? 'You' : 'Other person'} — ESC to exit`);
    }).catch(()=> {
      // Fallback to CSS fullscreen
      tile.classList.add('fullscreen-mode');
      document.body.style.overflow = 'hidden';
      toast(`⛶ Fullscreen (tap ✕ or ESC to exit)`);
    });
  } else if (tile.webkitRequestFullscreen) {
    tile.webkitRequestFullscreen();
    tile.classList.add('fullscreen-mode');
  } else {
    // CSS fallback
    tile.classList.add('fullscreen-mode');
    document.body.style.overflow = 'hidden';
    toast(`⛶ Fullscreen — tap ✕ to exit`);
  }

  // Add exit button to tile when fullscreen
  const actions = tile.querySelector('.tile-actions');
  if (actions && !actions.querySelector('.exit-fs')) {
    const exitBtn = document.createElement('button');
    exitBtn.className = 'tile-action-btn exit-fs';
    exitBtn.innerHTML = '✕';
    exitBtn.title = 'Exit fullscreen';
    exitBtn.onclick = (e) => { e.stopPropagation(); exitFullscreen(); };
    actions.prepend(exitBtn);
  }
}

function exitFullscreen() {
  // Exit native fullscreen
  if (document.fullscreenElement) {
    if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
  // Exit CSS fullscreen
  document.querySelectorAll('.video-tile.fullscreen-mode').forEach(tile => {
    tile.classList.remove('fullscreen-mode');
    const exitBtn = tile.querySelector('.exit-fs');
    if (exitBtn) exitBtn.remove();
  });
  document.body.style.overflow = '';
}

function handleFullscreenChange() {
  if (!document.fullscreenElement) {
    // Exited native fullscreen, clean up CSS class
    document.querySelectorAll('.video-tile.fullscreen-mode').forEach(tile => {
      // Keep class for a moment to avoid flicker, then remove if not in native fs
      if (!document.fullscreenElement) {
        // If user pressed ESC, remove our class too
        setTimeout(()=> {
          if (!document.fullscreenElement) {
            tile.classList.remove('fullscreen-mode');
            const exitBtn = tile.querySelector('.exit-fs');
            if (exitBtn) exitBtn.remove();
            document.body.style.overflow = '';
          }
        }, 100);
      }
    });
  }
}

function focusPeer(peerId) {
  const tile = document.getElementById(`tile-${peerId}`);
  if (!tile) return;
  
  if (focusedPeerId === peerId) {
    // Unfocus
    focusedPeerId = null;
    document.querySelectorAll('.video-tile').forEach(t => t.style.display = '');
    toast('👁️ Focus off — showing all');
  } else {
    // Focus this peer - hide others except local PIP
    focusedPeerId = peerId;
    document.querySelectorAll('.video-tile').forEach(t => {
      if (t.id === `tile-${peerId}` || t.id === 'tile-local') {
        t.style.display = '';
      } else {
        t.style.display = 'none';
      }
    });
    // Make focused tile fullscreen-like on mobile
    if (window.innerWidth <= 768) {
      toggleFullscreen(`tile-${peerId}`);
    }
    toast(`👁️ Focused on ${peers.get(peerId)?.userName || 'peer'} — tap 👁️ again to show all`);
  }
  updateGridLayout();
}

function toggleFocusMode() {
  // Focus on first remote peer, or toggle off
  const remoteTiles = Array.from(document.querySelectorAll('.video-tile.remote'));
  if (remoteTiles.length === 0) {
    toast('No remote peer to focus');
    return;
  }
  if (focusedPeerId) {
    focusPeer(focusedPeerId); // unfocus
  } else {
    const firstId = remoteTiles[0].id.replace('tile-', '');
    focusPeer(firstId);
  }
}

// DRAGGABLE PIP FOR MOBILE
function makeDraggable(tile) {
  let isDragging = false;
  let startX, startY, initialX, initialY;
  let hasMoved = false;

  // Only enable draggable on mobile for local tile
  const isLocal = tile.id === 'tile-local';
  if (!isLocal) return;

  const onStart = (e) => {
    if (window.innerWidth > 768) return; // only mobile
    if (tile.classList.contains('fullscreen-mode')) return;
    
    const touch = e.touches ? e.touches[0] : e;
    isDragging = true;
    hasMoved = false;
    startX = touch.clientX;
    startY = touch.clientY;
    
    const rect = tile.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    
    tile.style.transition = 'none';
    tile.style.zIndex = '10';
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
    
    let newX = initialX + dx;
    let newY = initialY + dy;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - tile.offsetWidth - 8;
    const maxY = window.innerHeight - tile.offsetHeight - 100; // account for controls
    newX = Math.max(8, Math.min(maxX, newX));
    newY = Math.max(8, Math.min(maxY, newY));
    
    tile.style.left = newX + 'px';
    tile.style.right = 'auto';
    tile.style.top = newY + 'px';
    tile.style.bottom = 'auto';
    tile.style.position = 'fixed';
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    tile.style.transition = '';
    tile.style.zIndex = '2';
    
    // Snap to nearest corner
    if (hasMoved) {
      const rect = tile.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Snap to left/right
      const snapX = centerX < window.innerWidth / 2 ? 12 : window.innerWidth - tile.offsetWidth - 12;
      // Keep Y roughly same but within bounds
      const snapY = Math.max(12, Math.min(window.innerHeight - tile.offsetHeight - 100, rect.top));
      
      tile.style.left = snapX + 'px';
      tile.style.top = snapY + 'px';
      tile.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(()=> tile.style.transition = '', 300);
    }
  };

  tile.addEventListener('touchstart', onStart, { passive: false });
  tile.addEventListener('touchmove', onMove, { passive: false });
  tile.addEventListener('touchend', onEnd);
  
  tile.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  // Prevent click when dragged
  tile.addEventListener('click', (e) => {
    if (hasMoved) {
      e.stopPropagation();
      e.preventDefault();
      hasMoved = false;
    }
  }, true);
}

// WebRTC - Perfect negotiation
async function createPeerConnection(peerId, isPolite) {
  const rtcConfig = await getRTCConfig();
  const pc = new RTCPeerConnection(rtcConfig);
  const remoteStream = new MediaStream();
  const peerObj = {
    pc,
    remoteStream,
    userName: peers.get(peerId)?.userName || peerId,
    polite: isPolite,
    makingOffer: false,
    ignoreOffer: false,
    iceConnected: false,
    retryCount: 0
  };
  peers.set(peerId, peerObj);

  if (localStream) {
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  }

  pc.onicecandidate = (e) => {
    if (e.candidate) socket.emit('ice-candidate', { to: peerId, candidate: e.candidate, roomId });
  };

  pc.oniceconnectionstatechange = () => {
    const statEl = document.getElementById(`stats-${peerId}`);
    if (statEl) statEl.textContent = pc.iceConnectionState;
    if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
      peerObj.iceConnected = true;
      if (statEl) statEl.textContent = '⚡ Connected';
      startStatsLoop(peerId);
      toast(`✅ ${peerObj.userName} connected`);
    } else if (pc.iceConnectionState === 'failed') {
      if (statEl) statEl.textContent = '❌ Failed, restarting...';
      pc.restartIce();
    } else if (pc.iceConnectionState === 'checking') {
      if (statEl) statEl.textContent = '🔄 Connecting...';
    }
  };

  pc.onconnectionstatechange = () => {
    const statEl = document.getElementById(`stats-${peerId}`);
    if (pc.connectionState === 'connected' && statEl) statEl.textContent = '⚡ Connected • P2P';
    if (pc.connectionState === 'failed') {
      toast(`⚠️ ${peerObj.userName} failed, retrying...`);
      if (peerObj.retryCount < 2) {
        peerObj.retryCount++;
        setTimeout(()=> createOffer(peerId), 1000);
      }
    }
  };

  pc.ontrack = (e) => {
    if (!remoteStream.getTracks().some(t => t.id === e.track.id)) {
      remoteStream.addTrack(e.track);
    }
    let tile = document.getElementById(`tile-${peerId}`);
    if (!tile) tile = createPeerTile(peerId, peerObj.userName);
    const videoEl = document.getElementById(`video-${peerId}`);
    const audioEl = document.getElementById(`audio-${peerId}`);
    if (e.track.kind === 'video') {
      if (tile) tile.classList.remove('audio-only');
      if (videoEl) {
        const streamToUse = e.streams[0] || remoteStream;
        if (videoEl.srcObject !== streamToUse) videoEl.srcObject = streamToUse;
        videoEl.play().catch(()=> {
          videoEl.muted = true;
          videoEl.play().then(()=> setTimeout(()=> videoEl.muted = false, 500)).catch(()=>{});
        });
      }
    } else if (e.track.kind === 'audio' && audioEl) {
      const audioStream = new MediaStream([e.track]);
      audioEl.srcObject = audioStream;
      audioEl.play().catch(()=>{});
    }
  };

  pc.onnegotiationneeded = async () => {
    try {
      peerObj.makingOffer = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { to: peerId, offer: pc.localDescription, roomId });
    } catch (err) {
      console.error(err);
    } finally {
      peerObj.makingOffer = false;
    }
  };

  return pc;
}

async function createOffer(peerId) {
  const peerObj = peers.get(peerId);
  if (!peerObj) return;
  const pc = peerObj.pc;
  try {
    if (peerObj.makingOffer) return;
    peerObj.makingOffer = true;
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    if (pc.signalingState !== 'stable') { peerObj.makingOffer = false; return; }
    await pc.setLocalDescription(offer);
    socket.emit('offer', { to: peerId, offer: pc.localDescription, roomId });
  } catch(e) { console.error(e); }
  finally { peerObj.makingOffer = false; }
}

async function handleOffer(from, offer) {
  let peerObj = peers.get(from);
  if (!peerObj) {
    const pc = await createPeerConnection(from, true);
    peerObj = peers.get(from);
    createPeerTile(from, peerObj.userName);
  }
  const pc = peerObj.pc;
  const offerCollision = peerObj.makingOffer || pc.signalingState !== 'stable';
  peerObj.ignoreOffer = !peerObj.polite && offerCollision;
  if (peerObj.ignoreOffer) return;
  try {
    if (offerCollision) {
      await Promise.all([
        pc.setLocalDescription({ type: 'rollback' }),
        pc.setRemoteDescription(offer)
      ]);
    } else {
      await pc.setRemoteDescription(offer);
    }
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', { to: from, answer: pc.localDescription, roomId });
  } catch(e) { console.error(e); }
}

async function handleAnswer(from, answer) {
  const peerObj = peers.get(from);
  if (!peerObj) return;
  try { await peerObj.pc.setRemoteDescription(answer); } catch(e) { console.error(e); }
}
async function handleIceCandidate(from, candidate) {
  const peerObj = peers.get(from);
  if (!peerObj) return;
  try { await peerObj.pc.addIceCandidate(candidate); } catch(e) {}
}

socket.on('connect', () => {
  connStatus.textContent = 'Ready • Socket connected';
  latencyPill.style.display = 'flex';
});
socket.on('room-joined', async ({ roomId: rId, yourId, users }) => {
  roomId = rId;
  connStatus.textContent = `In room: ${roomId} • ${users.length+1} peers`;
  document.getElementById('sRoomId').textContent = roomId;
  toast(`✅ Joined ${roomId} with ${users.length} other(s)`);
  for (const user of users) {
    createPeerTile(user.id, user.name, user.audioOnly);
    await createPeerConnection(user.id, true);
  }
  updatePeerCount();
});
socket.on('user-joined', async ({ userId, userName, audioOnly }) => {
  toast(`👋 ${userName} joined`);
  createPeerTile(userId, userName, audioOnly);
  await createPeerConnection(userId, false);
  await createOffer(userId);
  updatePeerCount();
});
socket.on('offer', ({ from, offer }) => handleOffer(from, offer));
socket.on('answer', ({ from, answer }) => handleAnswer(from, answer));
socket.on('ice-candidate', ({ from, candidate }) => handleIceCandidate(from, candidate));
socket.on('user-left', ({ userId }) => {
  const peer = peers.get(userId);
  if (peer) {
    peer.pc.close();
    if (peer.statsInterval) clearInterval(peer.statsInterval);
    peers.delete(userId);
  }
  const tile = document.getElementById(`tile-${userId}`);
  if (tile) tile.remove();
  if (focusedPeerId === userId) focusedPeerId = null;
  updateGridLayout();
  updatePeerCount();
  toast(`👋 Peer left`);
});
socket.on('peer-media-state', ({ userId, audio, video }) => {
  const micEl = document.getElementById(`mic-${userId}`);
  if (micEl) micEl.textContent = audio ? '' : '🔇';
  const tile = document.getElementById(`tile-${userId}`);
  if (tile) {
    if (!video) tile.classList.add('audio-only');
    else tile.classList.remove('audio-only');
  }
});
socket.on('room-update', (info) => {
  if (info) document.getElementById('sPeerCount').textContent = info.count;
  updatePeerCount();
});
socket.on('room-full', () => { toast('❌ Room full (max 6)'); leaveCall(); });

function toggleMic() {
  if (!localStream) return;
  isMicOn = !isMicOn;
  localStream.getAudioTracks().forEach(t=> t.enabled = isMicOn);
  micBtn.classList.toggle('muted', !isMicOn);
  micBtn.textContent = isMicOn ? '🎙️' : '🔇';
  socket.emit('media-state', { roomId, audio: isMicOn, video: isCamOn });
  const localName = document.querySelector('#tile-local .tile-name');
  if (localName) localName.textContent = `${userName} (You) ${isMicOn?'':'🔇'}`;
}
function toggleCam() {
  if (!localStream) return;
  if (isScreenSharing) { toast('Stop screen share first'); return; }
  isCamOn = !isCamOn;
  localStream.getVideoTracks().forEach(t=> t.enabled = isCamOn);
  camBtn.classList.toggle('muted', !isCamOn);
  camBtn.textContent = isCamOn ? '🎥' : '📷';
  const tile = document.getElementById('tile-local');
  if (tile) {
    if (!isCamOn) tile.classList.add('audio-only');
    else tile.classList.remove('audio-only');
  }
  socket.emit('media-state', { roomId, audio: isMicOn, video: isCamOn });
}
async function toggleScreen() {
  if (isScreenSharing) {
    screenStream.getTracks().forEach(t=> t.stop());
    screenStream = null;
    isScreenSharing = false;
    const videoTrack = localStream.getVideoTracks()[0];
    for (const [peerId, peerObj] of peers) {
      const sender = peerObj.pc.getSenders().find(s=> s.track?.kind === 'video');
      if (sender && videoTrack) await sender.replaceTrack(videoTrack);
    }
    document.getElementById('localVideo').srcObject = localStream;
    toast('🖥️ Screen share stopped');
  } else {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
      isScreenSharing = true;
      const screenTrack = screenStream.getVideoTracks()[0];
      for (const [peerId, peerObj] of peers) {
        const sender = peerObj.pc.getSenders().find(s=> s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(screenTrack);
      }
      document.getElementById('localVideo').srcObject = screenStream;
      screenTrack.onended = () => toggleScreen();
      toast('🖥️ Sharing screen');
    } catch(e) { toast('❌ Screen share failed'); }
  }
}
async function flipCamera() {
  if (callType === 'audio') return;
  facingMode = facingMode === 'user' ? 'environment' : 'user';
  try {
    const constraints = await getMediaConstraints();
    const newStream = await navigator.mediaDevices.getUserMedia({ video: constraints.video });
    const newTrack = newStream.getVideoTracks()[0];
    const oldTrack = localStream.getVideoTracks()[0];
    if (oldTrack) oldTrack.stop();
    localStream.removeTrack(oldTrack);
    localStream.addTrack(newTrack);
    document.getElementById('localVideo').srcObject = localStream;
    for (const [peerId, peerObj] of peers) {
      const sender = peerObj.pc.getSenders().find(s=> s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(newTrack);
    }
  } catch(e) { toast('❌ Flip failed: '+e.message); }
}
function leaveCall() {
  exitFullscreen();
  for (const [peerId, peerObj] of peers) {
    peerObj.pc.close();
    if (peerObj.statsInterval) clearInterval(peerObj.statsInterval);
  }
  peers.clear();
  focusedPeerId = null;
  if (localStream) { localStream.getTracks().forEach(t=> t.stop()); localStream = null; }
  if (screenStream) { screenStream.getTracks().forEach(t=> t.stop()); screenStream = null; }
  videoGrid.innerHTML = '';
  socket.emit('leave-room', { roomId });
  roomId = null;
  isScreenSharing = false;
  isMicOn = true;
  isCamOn = true;
  micBtn.classList.remove('muted');
  camBtn.classList.remove('muted');
  micBtn.textContent = '🎙️';
  camBtn.textContent = '🎥';
  callScreen.classList.remove('active');
  lobbyScreen.classList.add('active');
  connStatus.textContent = 'Ready';
  toast('👋 Left call');
}
function startStatsLoop(peerId) {
  const peerObj = peers.get(peerId);
  if (!peerObj || peerObj.statsInterval) return;
  peerObj.statsInterval = setInterval(async () => {
    try {
      const stats = await peerObj.pc.getStats();
      let rtt = null, packetsLost = 0;
      stats.forEach(report => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          rtt = report.currentRoundTripTime ? Math.round(report.currentRoundTripTime*1000) : rtt;
        }
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          packetsLost = report.packetsLost || 0;
        }
      });
      const el = document.getElementById(`stats-${peerId}`);
      if (el && rtt) el.textContent = `⚡ ${rtt}ms`;
    } catch {}
  }, 1000);
}
function updatePeerCount() {
  const count = peers.size + 1;
  const el = document.getElementById('sPeerCount');
  if (el) el.textContent = count;
  connStatus.textContent = roomId ? `Room ${roomId} • ${count} peers` : 'Ready';
}
function toggleStats() { document.getElementById('statsPanel').classList.toggle('open'); }
window.addEventListener('beforeunload', () => { if (roomId) socket.emit('leave-room', { roomId }); });
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key === 'm') toggleMic();
  if (e.key === 'v') toggleCam();
  if (e.key === 'l') leaveCall();
  if (e.key === 'Escape') exitFullscreen();
  if (e.key === 'f') {
    const remote = document.querySelector('.video-tile.remote');
    if (remote) toggleFullscreen(remote.id);
  }
});
function showNoDomainHelp() { alert('On Render you have HTTPS. Tap video for fullscreen, drag PIP.'); }
function checkSecureContext() { toast(window.isSecureContext ? `✅ Secure` : `⚠️ Not secure`); }
window.ACVC = {
  getPeers: () => peers,
  getLocalStream: () => localStream,
  toggleFullscreen,
  exitFullscreen,
  focusPeer,
  toggleFocusMode
};
socket.on('pong', () => {});
socket.on('ping', () => socket.emit('pong'));
