$outputFile = "active_tunnel_url.txt"
Write-Output "Starting tunnel loop..."

while ($true) {
    Write-Output "Connecting to localhost.run..."
    ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 nokey@localhost.run 2>&1 | ForEach-Object {
        $line = $_.ToString()
        Write-Output $line
        
        # Check if line contains the tunnel URL
        if ($line -like "*lhr.life*") {
            if ($line -match "https://[a-zA-Z0-9\.]+") {
                $url = $Matches[0]
                Write-Output "FOUND ACTIVE URL: $url"
                Set-Content -Path $outputFile -Value $url
            }
        }
    }
    
    Write-Output "Disconnected. Reconnecting in 3 seconds..."
    Start-Sleep -Seconds 3
}
