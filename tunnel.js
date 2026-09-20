/**
 * ACVC21 - Free HTTPS Tunnel (No Domain Needed)
 * Gives you instant https://xxxx.loca.lt URL for WebRTC
 * No signup, no domain, works for sharing with anyone in world
 */
const localtunnel = require('localtunnel');

async function startTunnel() {
  const port = process.env.PORT || 3000;
  
  console.log(`\n🔗 Starting free HTTPS tunnel for port ${port}...`);
  console.log(`   This gives you a public https:// URL without buying domain\n`);

  try {
    const tunnel = await localtunnel({ 
      port: port,
      subdomain: `acvc21-${Math.floor(Math.random()*90000+10000)}` // try random subdomain
    });

    console.log(`\n✅ YOUR PUBLIC HTTPS URL (Share this!):`);
    console.log(`   🌍 ${tunnel.url}`);
    console.log(`   📋 Room invite example: ${tunnel.url}/?room=team-sync`);
    console.log(`\n   ⚡ This URL is HTTPS + P2P STUN-only = works for WebRTC`);
    console.log(`   🔒 No domain needed, free, instant`);
    console.log(`\n   Keep this terminal open. Press Ctrl+C to stop.\n`);

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });

    // Also try to copy to clipboard hint
    console.log(`   Tip: Open ${tunnel.url} on 2 devices with same Room ID\n`);

  } catch (err) {
    console.error('Tunnel failed, trying without subdomain...', err.message);
    try {
      const tunnel2 = await localtunnel({ port });
      console.log(`\n✅ PUBLIC URL: ${tunnel2.url}\n`);
    } catch (e) {
      console.error('Localtunnel failed. Alternatives:');
      console.error('  1. npx ngrok http 3000 (needs free signup)');
      console.error('  2. Deploy to Render.com (free https://*.onrender.com)');
      console.error('  3. Use Cloudflare Tunnel: cloudflared tunnel --url http://localhost:3000');
    }
  }
}

if (require.main === module) {
  startTunnel();
}

module.exports = startTunnel;
