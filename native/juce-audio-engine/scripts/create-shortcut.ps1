$ErrorActionPreference = "Stop"
. "$PSScriptRoot\build-dir.ps1"

$Build = Get-ThallbyssalNativeBuildDir
$Exe = Join-Path $Build "ThallLabAudioEngine_artefacts\Release\Thall Lab Audio Engine.exe"

if (-not (Test-Path $Exe)) {
  $BuildScript = Join-Path $PSScriptRoot "build.ps1"
  & powershell -ExecutionPolicy Bypass -File $BuildScript
}

if (-not (Test-Path $Exe)) {
  throw "Native visual standalone executable was not found after build: $Exe"
}

$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "Thall Lab Audio Engine.lnk"
$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Exe
$Shortcut.WorkingDirectory = Split-Path $Exe
$Shortcut.IconLocation = "$Exe,0"
$Shortcut.Description = "Open the Thall Lab native visual standalone app"
$Shortcut.Save()

Write-Output "Created desktop shortcut: $ShortcutPath"
