# 🚀 Permanent Free HTTPS Hosting - No Domain Needed

You chose **Option C** - Get a permanent `https://yourapp.onrender.com` free forever.

## Recommended: Render.com (100% Free, No Credit Card, Auto HTTPS)

### Why Render?
- ✅ Truly free forever (750 hrs/month)
- ✅ Auto HTTPS with `*.onrender.com` subdomain
- ✅ No credit card needed
- ✅ Auto deploys from GitHub
- ✅ Supports Node + Socket.IO + WebSockets (Vercel doesn't)
- ✅ Health checks built-in

### Steps (2 minutes):

#### 1. Push your code to GitHub (already done)
Your code is in `traxxx96/ACVC21` repo, branch `arena/01a0bd7e-acvc21`

```bash
git push origin arena/01a0bd7e-acvc21
```

Or merge to main:
```bash
git checkout main
git merge arena/01a0bd7e-acvc21
git push origin main
```

#### 2. Deploy on Render
1. Go to **https://dashboard.render.com/** → Sign up with GitHub (free)
2. Click **New + → Web Service**
3. Connect your repo: `traxxx96/ACVC21`
4. Settings:
   - **Name:** `acvc21-webrtc` (or any)
   - **Region:** Singapore (closest to you in Ludhiana, Punjab) or any
   - **Branch:** `arena/01a0bd7e-acvc21` or `main`
   - **Root Directory:** leave empty
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** `Free`
5. Click **Create Web Service**
6. Wait 2-3 min → You get URL like:
   ```
   https://acvc21-webrtc-xxxx.onrender.com
   ```
7. Done! Share that URL: `https://acvc21-webrtc-xxxx.onrender.com/?room=team-sync`

**Your app now has permanent free HTTPS, no domain purchase needed.**

---

## Alternative 1: Railway.app (Free $5 credit, super fast)

1. Go to https://railway.app → Login with GitHub
2. New Project → Deploy from GitHub → Select `ACVC21`
3. Railway auto detects `railway.json` + `node server.js`
4. Settings → Generate Domain → you get `https://xxx.up.railway.app`
5. Done

**Pros:** Faster cold start than Render, better free tier
**Cons:** Free $5 credit expires, but enough for months

---

## Alternative 2: Fly.io (Free, global edge, very fast)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth signup
# or fly auth login

# Deploy (from project folder)
fly launch --no-deploy
# Choose: Singapore region (sin) - closest to India
fly deploy

# You get: https://acvc21-webrtc.fly.dev
```

Uses `fly.toml` + `Dockerfile` already included.

**Pros:** Never sleeps, global edge, super fast
**Cons:** Needs credit card for verification (not charged on free tier)

---

## Alternative 3: Cyclic.sh (Free, simplest)

1. https://cyclic.sh → Sign in with GitHub
2. Link repo → Deploy
3. Get `https://acvc21.cyclic.app`

---

## Alternative 4: Koyeb (Free)

1. https://koyeb.com → Sign in GitHub
2. Create Service → GitHub repo
3. Build: `npm install`, Run: `node server.js`
4. Get `https://xxx.koyeb.app`

---

## Important Notes for Free Hosting:

### Render Free Tier:
- Spins down after 15 min inactivity → first request after sleep takes ~30 sec to wake
- 750 hrs/month free (enough for 1 service 24/7)
- Solution: Use https://uptimerobot.com free to ping `/api/health` every 10 min to keep alive (optional)

### To Keep Alive (Optional):
1. Go to uptimerobot.com → free account
2. Add monitor: `https://yourapp.onrender.com/api/health` every 5 min
3. Your app never sleeps

### Environment Variables (none needed):
Our app is STUN-only P2P, no secrets needed. Just works.

---

## After Deploy:

Your permanent URLs:
- App: `https://acvc21-webrtc-xxxx.onrender.com`
- Health: `https://acvc21-webrtc-xxxx.onrender.com/api/health`
- Invite: `https://acvc21-webrtc-xxxx.onrender.com/?room=my-room`

Share invite link with anyone → P2P call with HTTPS → WebRTC works globally.

---

## Deploy Button (Add to README):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/traxxx96/ACVC21)

---

## Need Help?

Tell me which platform you chose, I'll guide you. Or give me temporary GitHub access and I can connect it for you.

For Render, you just need to:
1. Push to GitHub (done)
2. Connect repo on Render dashboard
3. Click deploy

That's it — permanent free HTTPS domain, no purchase needed.
