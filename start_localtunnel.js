const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, 'active_tunnel_url.txt');
const targetSubdomain = 'grant-essentials-demo';

function startTunnel() {
  console.log(`Starting localtunnel for port 3000 with subdomain "${targetSubdomain}"...`);
  
  const lt = spawn('npx.cmd', [
    'localtunnel',
    '--port', '3000',
    '--subdomain', targetSubdomain
  ], { shell: true });

  lt.stdout.on('data', (data) => {
    const line = data.toString();
    console.log(`[STDOUT] ${line}`);
    if (line.includes('your url is:')) {
      const match = line.match(/https:\/\/[a-zA-Z0-9\-_\.]+/);
      if (match) {
        const url = match[0];
        console.log(`FOUND ACTIVE LOCAL_TUNNEL URL: ${url}`);
        
        if (!url.includes(targetSubdomain)) {
          console.log(`Target subdomain "${targetSubdomain}" was not granted. Got: ${url}. Killing process tree to retry...`);
          // Use taskkill to cleanly terminate the npx batch file and the spawned node client on Windows
          exec(`taskkill /T /F /PID ${lt.pid}`, (err) => {
            if (err) console.log(`Error killing process tree: ${err.message}`);
          });
        } else {
          console.log(`SUCCESS: Secured target subdomain "${targetSubdomain}"`);
          fs.writeFileSync(outputFile, url, 'utf8');
        }
      }
    }
  });

  lt.stderr.on('data', (data) => {
    console.log(`[STDERR] ${data.toString()}`);
  });

  lt.on('close', (code) => {
    console.log(`Localtunnel process closed/exited with code ${code}. Retrying in 12 seconds to let the server release the subdomain...`);
    setTimeout(startTunnel, 12000);
  });
}

startTunnel();
