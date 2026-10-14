param (
    [string]$Scenario = "smoke",
    [string]$TargetUrl = "http://localhost:3000",
    [string]$Secret = "museflow_local_load_test_key_2026"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MUSEFLOW LOAD TESTING & BENCHMARK SUITE (k6)           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Scenario   : $Scenario" -ForegroundColor Yellow
Write-Host "Target URL : $TargetUrl" -ForegroundColor Yellow
Write-Host ""

$env:TARGET_URL = $TargetUrl
$env:LOAD_TEST_SECRET = $Secret

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

switch ($Scenario.ToLower()) {
    "smoke" {
        $testFile = Join-Path $scriptDir "scenarios\01_smoke.js"
        Write-Host "Executing Smoke Test (Baseline Sanity)..." -ForegroundColor Green
        & k6 run $testFile
    }
    "dashboard" {
        $testFile = Join-Path $scriptDir "scenarios\02_dashboard_load.js"
        Write-Host "Executing Dashboard Concurrency Load Test..." -ForegroundColor Green
        & k6 run $testFile
    }
    "ai" {
        $testFile = Join-Path $scriptDir "scenarios\03_ai_generation_load.js"
        Write-Host "Executing Live AI Generation Load Test..." -ForegroundColor Green
        & k6 run $testFile
    }
    "stress" {
        $testFile = Join-Path $scriptDir "scenarios\04_mock_ai_stress.js"
        Write-Host "Executing Pure Next.js Throughput Stress Test (Mocked AI)..." -ForegroundColor Green
        & k6 run $testFile
    }
    "all" {
        Write-Host "[1/3] Running Smoke Test..." -ForegroundColor Green
        & k6 run (Join-Path $scriptDir "scenarios\01_smoke.js")
        Start-Sleep -Seconds 3

        Write-Host "[2/3] Running Dashboard Concurrency Test..." -ForegroundColor Green
        & k6 run (Join-Path $scriptDir "scenarios\02_dashboard_load.js")
        Start-Sleep -Seconds 3

        Write-Host "[3/3] Running High Concurrency Stress Test..." -ForegroundColor Green
        & k6 run (Join-Path $scriptDir "scenarios\04_mock_ai_stress.js")
    }
    default {
        Write-Host "Unknown scenario: $Scenario. Valid options: smoke, dashboard, ai, stress, all" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Test scenario '$Scenario' completed successfully." -ForegroundColor Cyan
