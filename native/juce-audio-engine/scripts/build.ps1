$ErrorActionPreference = "Stop"
. "$PSScriptRoot\build-dir.ps1"
$Root = Resolve-Path "$PSScriptRoot\.."
$Build = Get-ThallbyssalNativeBuildDir
$Cmake = "cmake"

if (-not (Test-Path $Build)) {
  $ConfigureScript = Join-Path $PSScriptRoot "configure.ps1"
  & powershell -ExecutionPolicy Bypass -File $ConfigureScript
}

if (-not (Get-Command cmake -ErrorAction SilentlyContinue) -and (Test-Path "C:\Program Files\CMake\bin\cmake.exe")) {
  $Cmake = "C:\Program Files\CMake\bin\cmake.exe"
}

& $Cmake --build $Build --config Release

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
