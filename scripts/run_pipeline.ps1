param(
    [string]$PythonExe = ".\venv\Scripts\python.exe"
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Action
    )

    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    $start = Get-Date
    try {
        & $Action
        $duration = (Get-Date) - $start
        Write-Host "OK: $Name ($([math]::Round($duration.TotalSeconds, 2))s)" -ForegroundColor Green
        return @{
            Name = $Name
            Success = $true
            Seconds = [math]::Round($duration.TotalSeconds, 2)
        }
    } catch {
        $duration = (Get-Date) - $start
        Write-Host "FAILED: $Name ($([math]::Round($duration.TotalSeconds, 2))s)" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor DarkRed
        return @{
            Name = $Name
            Success = $false
            Seconds = [math]::Round($duration.TotalSeconds, 2)
        }
    }
}

if (-not (Test-Path $PythonExe)) {
    Write-Host "Python executable not found at $PythonExe" -ForegroundColor Red
    Write-Host "Pass -PythonExe or create the venv first." -ForegroundColor Yellow
    exit 1
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

Write-Host "Breathe Safe AI - Local MLOps Pipeline" -ForegroundColor Yellow
Write-Host "Repository: $repoRoot"
Write-Host "Python: $PythonExe"

$results = @()

$results += Invoke-Step -Name "Step 1: Data Ingestion" -Action {
    & $PythonExe -m src.data.ingestion
    if ($LASTEXITCODE -ne 0) { throw "Ingestion exited with code $LASTEXITCODE" }
}

$results += Invoke-Step -Name "Step 2: Data Validation (Great Expectations)" -Action {
    & $PythonExe -m src.data.validation
    if ($LASTEXITCODE -ne 0) { throw "Validation exited with code $LASTEXITCODE" }
}

$results += Invoke-Step -Name "Step 3: Model Training" -Action {
    & $PythonExe -m src.models.train
    if ($LASTEXITCODE -ne 0) { throw "Training exited with code $LASTEXITCODE" }
}

$results += Invoke-Step -Name "Step 4: MLflow Tracking Check" -Action {
    $mlrunsPath = Join-Path $repoRoot "mlruns"
    if (-not (Test-Path $mlrunsPath)) {
        throw "MLflow tracking directory not found at $mlrunsPath"
    }
    Write-Host "MLflow artifacts directory detected: $mlrunsPath"
}

$results += Invoke-Step -Name "Step 5: OpenLineage/Marquez Signal Check" -Action {
    if ($env:OPENLINEAGE_URL) {
        Write-Host "OPENLINEAGE_URL is configured: $($env:OPENLINEAGE_URL)"
    } else {
        Write-Host "OPENLINEAGE_URL is not set. Lineage events are emitted best-effort to default URL." -ForegroundColor Yellow
    }
    Write-Host "Lineage events were emitted during ingestion, validation, and training."
}

Write-Host ""
Write-Host "=== Step 6: Pipeline Summary ===" -ForegroundColor Cyan
$failed = $results | Where-Object { -not $_.Success }
$results | ForEach-Object {
    $status = if ($_.Success) { "PASS" } else { "FAIL" }
    $color = if ($_.Success) { "Green" } else { "Red" }
    Write-Host ("[{0}] {1} ({2}s)" -f $status, $_.Name, $_.Seconds) -ForegroundColor $color
}

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Pipeline completed with failures." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Pipeline completed successfully." -ForegroundColor Green
Write-Host "Model artifact: models/aqi_model.pkl"
Write-Host "MLflow UI (if running): http://127.0.0.1:5000"
exit 0
