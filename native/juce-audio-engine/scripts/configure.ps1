$ErrorActionPreference = "Stop"
. "$PSScriptRoot\build-dir.ps1"
$Root = Resolve-Path "$PSScriptRoot\.."
$Build = Get-ThallbyssalNativeBuildDir
$Cmake = "cmake"
$VsInstall = ""

New-Item -ItemType Directory -Force -Path $Build | Out-Null

if (-not (Get-Command cmake -ErrorAction SilentlyContinue) -and (Test-Path "C:\Program Files\CMake\bin\cmake.exe")) {
  $Cmake = "C:\Program Files\CMake\bin\cmake.exe"
}

$VsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (Test-Path $VsWhere) {
  $VsInstall = & $VsWhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
}

if ($VsInstall) {
  & $Cmake -S $Root -B $Build -G "Visual Studio 17 2022" -A x64 -DCMAKE_GENERATOR_INSTANCE="$VsInstall"
} else {
  & $Cmake -S $Root -B $Build -G "Visual Studio 17 2022" -A x64
}

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
