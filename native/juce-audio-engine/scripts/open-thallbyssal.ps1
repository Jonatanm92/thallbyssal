$ErrorActionPreference = "Stop"
. "$PSScriptRoot\build-dir.ps1"

$Build = Get-ThallbyssalNativeBuildDir
$Exe = Join-Path $Build "ThallLabAudioEngine_artefacts\Release\Thall Lab Audio Engine.exe"

if (-not (Test-Path $Exe)) {
  $BuildScript = Join-Path $PSScriptRoot "build.ps1"
  & powershell -ExecutionPolicy Bypass -File $BuildScript
}

if (-not (Test-Path $Exe)) {
  throw "Thallbyssal visual standalone executable was not found after build: $Exe"
}

Start-Process -FilePath $Exe -WorkingDirectory (Split-Path $Exe)
