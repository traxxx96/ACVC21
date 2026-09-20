# No Domain? No Problem - Free HTTPS for WebRTC

You said you don't have a domain. WebRTC `getUserMedia()` requires HTTPS (except localhost). Here's how to get free HTTPS without buying anything.

## Option 1: Localhost (0 cost, instant, no internet sharing needed)
**Best for development / testing on same machine**

```bash
npm start
# open http://localhost:3000
```

- `localhost` is considered secure by browsers, WebRTC works even on http
- Open 2 tabs with same Room ID → call works
- No HTTPS needed, no domain needed

**Limitation:** Only works on your own machine. Can't share with friend over internet.

---

## Option 2: Free HTTPS Tunnel (Best for sharing instantly, no domain)

Gives you public `https://xxx.loca.lt` URL in 5 seconds. Share with anyone in world.

### Using localtunnel (already installed):
```bash
# Terminal 1
npm start

# Terminal 2
npm run tunnel
# or: npx localtunnel --port 3000
```

Output:
```
✅ YOUR PUBLIC HTTPS URL: https://acvc21-12345.loca.lt
📋 Invite: https://acvc21-12345.loca.lt/?room=team-sync
```

Share that URL → it has HTTPS → WebRTC works everywhere.

### Alternatives (even more stable):

**ngrok (free signup):**
```bash
npm install -g ngrok
ngrok http 3000
# gives https://xxxx.ngrok-free.app
```

**Cloudflare Tunnel (no signup, super fast):**
```bash
# install cloudflared
cloudflared tunnel --url http://localhost:3000
# gives https://xxx.trycloudflare.com
```

**Pros:** Instant, free, no domain, HTTPS
**Cons:** URL changes on restart, free tier has bandwidth limit

---

## Option 3: Free Hosting (Permanent free HTTPS domain)

Deploy once, get permanent `https://yourapp.onrender.com` free.

### Render.com (Recommended - 100% free):
1. Push code to GitHub
2. Go to render.com → New Web Service → Connect GitHub repo
3. Build: `npm install`, Start: `node server.js`
4. Done → you get `https://acvc21-xxxx.onrender.com` with auto HTTPS

### Railway.app:
1. railway.app → New Project → Deploy from GitHub
2. Auto gives `https://xxx.up.railway.app`

### Fly.io:
```bash
npm install -g @fly.io/flyctl
fly launch
fly deploy
# gives https://acvc21-xxx.fly.dev
```

### Vercel (for frontend, but we have backend so use Render):
Vercel is serverless, but our Socket.IO needs persistent server. Use Render/Railway instead.

**Pros:** Permanent URL, free HTTPS, no need to keep laptop on
**Cons:** Free tier sleeps after inactivity (Render free spins down after 15min, wakes on request)

---

## Option 4: Use Your Public IP with Self-Signed? (Not Recommended)

WebRTC requires secure context. IP + http won't work in most browsers. Don't use this.

---

## What I Recommend For You:

**For now (testing with friends):**
```bash
npm start
npm run tunnel
```
Share the `https://xxx.loca.lt` URL. Done.

**For permanent:**
Deploy to Render.com (takes 2 minutes, free). You get permanent HTTPS domain without buying anything.

---

## STUN-only Mode Explained

You asked for STUN-only, P2P:

- **Config:** 6 public STUN servers (Google x3, Cloudflare, Twilio, Metered)
- **No TURN:** Pure P2P, media never relays
- **Latency:** Lowest possible (direct UDP)
- **Success Rate:** ~85% of networks. Fails behind symmetric NAT / strict corporate firewall (that's where TURN would be needed, but you said STUN-only so we accept this tradeoff)
- **Max Peers:** 6 in mesh (more would lag, need SFU)

If you later need 100% connectivity, I can add free TURN servers (Metered free tier gives 50GB) without changing architecture.

---

## Quick Commands:

```bash
# Local only (no HTTPS needed)
npm start

# Free public HTTPS URL
npm run tunnel

# Both together (server + tunnel)
npm run start:tunnel  # needs concurrently: npm install
```

All set without domain!
