# NE-ROUTE Background Service Stopper
Write-Host "Stopping NE-ROUTE background servers..." -ForegroundColor Cyan

$ports = @(8008, 3000)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns.OwningProcess | Select-Object -Unique
        foreach ($procId in $pids) {
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "Stopping process $($proc.ProcessName) (PID: $procId) on port $port..." -ForegroundColor Yellow
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Warning "Could not stop PID $procId : $_"
            }
        }
        Write-Host "Port $port stopped." -ForegroundColor Green
    } else {
        Write-Host "No process found listening on port $port." -ForegroundColor Gray
    }
}
Write-Host "All NE-ROUTE background servers have been stopped." -ForegroundColor Cyan
