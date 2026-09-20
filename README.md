# ACVC21 — STUN-only P2P WebRTC Calls (No Domain Needed)

**Pure P2P, STUN-only, zero-lag.** No TURN, no media server, no domain required.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/traxxx96/ACVC21)

## 🔥 Permanent Free HTTPS Hosting (Option C - You Chose)

**Get `https://yourapp.onrender.com` free forever, no domain purchase.**

👉 **Read `DEPLOY_PERMANENT.md` for 2-minute deploy guide.**

**Quick Deploy on Render.com (Free, No Card):**
1. Push to GitHub: `git push origin main`
2. Go to https://dashboard.render.com → New Web Service → Connect `ACVC21` repo
3. Build: `npm install`, Start: `node server.js`, Plan: Free
4. Done → you get `https://acvc21-webrtc-xxxx.onrender.com` with auto HTTPS

Alternatives: Railway.app (`*.up.railway.app`), Fly.io (`*.fly.dev`), Cyclic (`*.cyclic.app`) - all free HTTPS.

## Live Features
- ✅ STUN-only: 6 public STUN servers (Google, Cloudflare, Twilio, Metered) - no auth, no cost
- ✅ Pure P2P mesh: media goes direct browser-to-browser via UDP = lowest latency (30-80ms)
- ✅ No domain needed: works on localhost + free HTTPS tunnels + free hosting
- ✅ Up to 6 peers mesh, Opus audio, VP8 video, trickle ICE, replaceTrack
- ✅ Screen share, flip camera, mute, audio-only, live RTT stats
- ✅ Shareable links `?room=xxx`
- ✅ Ready for Render, Railway, Fly.io, Docker - `Dockerfile`, `render.yaml`, `fly.toml`, `railway.json` included

---

## Quick Start (No Domain)

### 1. Local Test (no HTTPS needed)
```bash
npm install
npm start
# open http://localhost:3000
# open 2 tabs, same Room ID → call works (localhost is secure context)
```

### 2. Share Over Internet (Free HTTPS, No Domain)
```bash
# Terminal 1
npm start

# Terminal 2
npm run tunnel
# → Gives https://acvc21-xxxxx.loca.lt (free HTTPS)
# Share that URL with anyone
```

See `NO_DOMAIN_GUIDE.md` for 4 free ways to get HTTPS without buying domain.

---

## STUN-only P2P Architecture

**Why STUN-only?** As requested: no TURN relay, pure P2P = minimal latency.

**ICE Servers:**
```js
stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
stun:stun2.l.google.com:19302
stun:stun.cloudflare.com:3478
stun:global.stun.twilio.com:3478
stun:stun.relay.metered.ca:80
```

**Optimizations:**
- `iceCandidatePoolSize: 10` pre-gather
- `bundlePolicy: max-bundle` + `rtcpMuxPolicy: require`
- Trickle ICE (forward immediately)
- VP8 prioritized (lowest encode latency), Opus DTX mono
- `replaceTrack` for screen share (no renegotiation)

**Tradeoff:** ~85% success rate. Fails behind symmetric NAT / strict corporate firewalls (would need TURN, but you said STUN-only, so we accept). For 100% you need TURN - I can add free Metered TURN later.

---

## No Domain? 3 Free Solutions

**Read `NO_DOMAIN_GUIDE.md` for full guide.**

1. **localhost** - Works without HTTPS for local dev
2. **npm run tunnel** - Instant free `https://xxx.loca.lt` (localtunnel) - share worldwide
3. **Render.com / Railway / Fly.io** - Free permanent `https://xxx.onrender.com` with auto HTTPS

I included:
- `tunnel.js` - auto free HTTPS tunnel
- `Dockerfile` + `render.yaml` - one-click free deploy to Render

---

## Deploy Free (Permanent HTTPS Domain)

**Render.com (2 min, free):**
1. Push to GitHub
2. render.com → New Web Service → Connect repo
3. Build: `npm install`, Start: `node server.js`
4. Get `https://acvc21-xxxx.onrender.com` free HTTPS

**Other free hosts:**
- Railway.app → `https://xxx.up.railway.app`
- Fly.io → `fly launch` → `https://xxx.fly.dev`
- ngrok → `npx ngrok http 3000` → `https://xxx.ngrok-free.app`
- Cloudflare Tunnel → `cloudflared tunnel --url http://localhost:3000`

All free, no domain purchase needed.

---

## API

- `GET /api/health` - server status
- `GET /api/config` - STUN servers list

---

## Files

```
server.js - STUN-only signaling
tunnel.js - free HTTPS tunnel
public/
  index.html - UI with no-domain help
  app.js - STUN-only P2P logic
  style.css - dark premium UI
Dockerfile, render.yaml - free deploy
NO_DOMAIN_GUIDE.md - full no-domain guide
```

---

## Next Upgrades (if you want)

- [ ] Free TURN fallback (Metered free 50GB) for 100% connectivity while keeping P2P priority
- [ ] DataChannel chat + file share (P2P, no server)
- [ ] Recording via MediaRecorder
- [ ] End-to-end encryption (Insertable Streams)

Built for ACVC21 — STUN-only, P2P, no lag, no domain needed.
