const API = 'https://surepact-greenfield-v2.onrender.com/api';
const h = { 'Authorization': 'Bearer SurePact2026!', 'Content-Type': 'application/json' };
async function poll() {
  for (let i = 0; i < 15; i++) {
    try {
      const r = await fetch(API + '/health', { headers: h });
      console.log('Attempt ' + (i + 1) + ': status ' + r.status);
      if (r.status === 200) {
        const text = await r.text();
        console.log('RENDER DEPLOY SUCCESS! Health output:', text);
        return true;
      }
    } catch(e) {
      console.log('Attempt ' + (i + 1) + ' error:', e.message);
    }
    await new Promise(res => setTimeout(res, 5000));
  }
  console.log('Timed out waiting for Render deploy.');
  return false;
}
poll().catch(console.error);
