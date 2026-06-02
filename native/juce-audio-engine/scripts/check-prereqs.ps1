$ErrorActionPreference = "Stop"

Write-Host "Checking native audio prerequisites..." -ForegroundColor Cyan

$cmakeDefault = "C:\Program Files\CMake\bin\cmake.exe"
$cmake = Get-Command cmake -ErrorAction SilentlyContinue
if (-not $cmake -and (Test-Path $cmakeDefault)) {
  $cmake = Get-Item $cmakeDefault
}

if ($cmake) {
  $cmakePath = if ($cmake.Source) { $cmake.Source } else { $cmake.FullName }
  & $cmakePath --version | Select-Object -First 1
} else {
  Write-Host "Missing: CMake is not in PATH." -ForegroundColor Yellow
}

$git = Get-Command git -ErrorAction SilentlyContinue
if ($git) {
  & git --version
} else {
  Write-Host "Missing: Git is not in PATH." -ForegroundColor Yellow
}

$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (Test-Path $vswhere) {
  $vcPath = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
  if ($vcPath) {
    Write-Host "Visual C++ Build Tools found: $vcPath" -ForegroundColor Green
  } else {
    Write-Host "Missing: Visual Studio Build Tools with C++ workload." -ForegroundColor Yellow
  }
} else {
  Write-Host "Missing: Visual Studio Installer/vswhere." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Recommended installs if anything is missing:" -ForegroundColor Cyan
Write-Host "winget install --id Kitware.CMake -e"
Write-Host "winget install --id Microsoft.VisualStudio.2022.BuildTools -e --source winget --override `"--quiet --wait --norestart --installPath D:\VSBuildTools2022 --add Microsoft.VisualStudio.Workload.VCTools;includeRecommended`""
