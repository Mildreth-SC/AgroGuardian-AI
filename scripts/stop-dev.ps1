# Stop leftover AgroGuardian API / Next.js dev servers
$ErrorActionPreference = "SilentlyContinue"

Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -match 'next|AgroGuardian' } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
    Write-Host "Stopped node PID $($_.ProcessId)"
  }

Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" |
  Where-Object { $_.CommandLine -match 'uvicorn|AgroGuardian' } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
    Write-Host "Stopped python PID $($_.ProcessId)"
  }

foreach ($port in 3000, 3001, 3002, 8000) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object {
      Stop-Process -Id $_.OwningProcess -Force
      Write-Host "Freed port $port (PID $($_.OwningProcess))"
    }
}

Write-Host "Ports 3000-3002 and 8000 are clear. Run: npm run dev"
