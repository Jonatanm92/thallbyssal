$ErrorActionPreference = "Stop"
. "$PSScriptRoot\build-dir.ps1"

$Build = Get-ThallbyssalNativeBuildDir
$ArtifactRoot = Join-Path $Build "Thallbyssal_artefacts"

if (-not (Test-Path $ArtifactRoot)) {
  $BuildScript = Join-Path $PSScriptRoot "build.ps1"
  & powershell -ExecutionPolicy Bypass -File $BuildScript
}

$Exe = Get-ChildItem -Path $ArtifactRoot -Recurse -Filter "Thallbyssal.exe" -ErrorAction SilentlyContinue |
  Sort-Object FullName |
  Select-Object -First 1

if ($null -eq $Exe) {
  throw "Thallbyssal plugin standalone executable was not found under: $ArtifactRoot"
}

Start-Process -FilePath $Exe.FullName -WorkingDirectory $Exe.DirectoryName
