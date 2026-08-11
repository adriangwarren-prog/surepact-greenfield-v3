const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, 'active_tunnel_url.txt');

function startTunnel() {
  console.log('Connecting to localhost.run...');
  
  const ssh = spawn('ssh', [
    '-tt',
    '-o', 'StrictHostKeyChecking=no',
    '-R', '80:localhost:3000',
    'nokey@localhost.run'
  ], { shell: true });

  const rlStdout = readline.createInterface({ input: ssh.stdout });
  const rlStderr = readline.createInterface({ input: ssh.stderr });

  rlStdout.on('line', (line) => {
    console.log(`[STDOUT] ${line}`);
    if (line.includes('lhr.life')) {
      const match = line.match(/https:\/\/[a-zA-Z0-9\.]+/);
      if (match) {
        const url = match[0];
        console.log(`FOUND ACTIVE URL: ${url}`);
        fs.writeFileSync(outputFile, url, 'utf8');
      }
    }
  });

  rlStderr.on('line', (line) => {
    console.log(`[STDERR] ${line}`);
  });

  ssh.on('close', (code) => {
    console.log(`SSH tunnel process exited with code ${code}. Reconnecting in 3 seconds...`);
    setTimeout(startTunnel, 3000);
  });
}

startTunnel();
