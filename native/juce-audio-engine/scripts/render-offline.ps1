param(
  [Parameter(Mandatory = $true)]
  [string]$InputWav,

  [Parameter(Mandatory = $true)]
  [string]$PresetJson,

  [Parameter(Mandatory = $true)]
  [string]$OutputDir,

  [int]$SampleRate = 48000,

  [int]$BlockSize = 128,

  [string]$PresetId = ""
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\build-dir.ps1"

function Get-RepoRoot {
  return (Resolve-Path "$PSScriptRoot\..\..\..").Path
}

function Get-LabGeneratedRoot {
  if ($env:AMP_SIM_LAB_OUTPUT_DIR) {
    return [System.IO.Path]::GetFullPath($env:AMP_SIM_LAB_OUTPUT_DIR)
  }

  if (Test-Path "D:\") {
    return "D:\CodexBuilds\thallbyssal-lab"
  }

  return (Join-Path (Get-RepoRoot) "AMP_SIM_LAB\.generated")
}

function Resolve-ExistingPath {
  param(
    [string]$Value,
    [string]$Kind
  )

  $RepoRoot = Get-RepoRoot
  $Candidate = if ([System.IO.Path]::IsPathRooted($Value)) {
    [System.IO.Path]::GetFullPath($Value)
  } else {
    [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $Value))
  }

  if (Test-Path -LiteralPath $Candidate) {
    return (Resolve-Path -LiteralPath $Candidate).Path
  }

  if ($Kind -eq "di") {
    $LabDiRoot = [System.IO.Path]::GetFullPath((Join-Path $RepoRoot "AMP_SIM_LAB\di-test-files"))
    $GeneratedDiRoot = Join-Path (Get-LabGeneratedRoot) "di-test-files"
    $LabDiPrefix = $LabDiRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

    if ($Candidate.StartsWith($LabDiPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
      $Name = [System.IO.Path]::GetFileName($Candidate)
      $Candidates = @(
        (Join-Path $GeneratedDiRoot $Name),
        (Join-Path $GeneratedDiRoot ($Name -replace "_", " ")),
        (Join-Path $GeneratedDiRoot (($Name -replace "_", " ").ToUpperInvariant()))
      )

      foreach ($Path in $Candidates) {
        if (Test-Path -LiteralPath $Path) {
          return (Resolve-Path -LiteralPath $Path).Path
        }
      }
    }
  }

  throw "$Kind path does not exist: $Value"
}

function Resolve-OutputDir {
  param([string]$Value)

  $RepoRoot = Get-RepoRoot
  $RendersRoot = Join-Path (Get-LabGeneratedRoot) "renders"
  $Candidate = if ([System.IO.Path]::IsPathRooted($Value)) {
    [System.IO.Path]::GetFullPath($Value)
  } else {
    [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $Value))
  }

  $RepoRendersRoot = [System.IO.Path]::GetFullPath((Join-Path $RepoRoot "AMP_SIM_LAB\renders"))
  $RepoRendersTrimmed = $RepoRendersRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
  $RepoRendersPrefix = $RepoRendersTrimmed + [System.IO.Path]::DirectorySeparatorChar

  if ($Candidate.Equals($RepoRendersTrimmed, [System.StringComparison]::OrdinalIgnoreCase)) {
    $Candidate = $RendersRoot
  } elseif ($Candidate.StartsWith($RepoRendersPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    $Relative = $Candidate.Substring($RepoRendersPrefix.Length)
    $Candidate = Join-Path $RendersRoot $Relative
  }

  $ResolvedOutput = [System.IO.Path]::GetFullPath($Candidate)
  $ResolvedRoot = [System.IO.Path]::GetFullPath($RendersRoot)

  if (-not ($ResolvedOutput.Equals($ResolvedRoot, [System.StringComparison]::OrdinalIgnoreCase) -or $ResolvedOutput.StartsWith($ResolvedRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase))) {
    throw "OutputDir must stay under AMP_SIM_LAB renders root: $ResolvedRoot"
  }

  return $ResolvedOutput
}

function Find-RendererExe {
  $Build = Get-ThallbyssalNativeBuildDir
  $Candidates = @(
    (Join-Path $Build "ThallbyssalOfflineRenderer_artefacts\Release\ThallbyssalOfflineRenderer.exe"),
    (Join-Path $Build "ThallbyssalOfflineRenderer_artefacts\Release\Thallbyssal Offline Renderer.exe"),
    (Join-Path $Build "ThallbyssalOfflineRenderer_artefacts\Debug\ThallbyssalOfflineRenderer.exe"),
    (Join-Path $Build "ThallbyssalOfflineRenderer_artefacts\Debug\Thallbyssal Offline Renderer.exe"),
    (Join-Path $Build "ThallbyssalOfflineRenderer_artefacts\RelWithDebInfo\ThallbyssalOfflineRenderer.exe"),
    (Join-Path $Build "ThallbyssalOfflineRenderer_artefacts\RelWithDebInfo\Thallbyssal Offline Renderer.exe")
  )

  foreach ($Path in $Candidates) {
    if (Test-Path -LiteralPath $Path) {
      return (Resolve-Path -LiteralPath $Path).Path
    }
  }

  throw "Headless renderer binary not found. Run npm run native:configure and npm run native:build first."
}

$ResolvedInput = Resolve-ExistingPath -Value $InputWav -Kind "di"
$ResolvedPreset = Resolve-ExistingPath -Value $PresetJson -Kind "preset"
$ResolvedOutput = Resolve-OutputDir -Value $OutputDir
$RenderRoot = Join-Path (Get-LabGeneratedRoot) "renders"
$Renderer = Find-RendererExe

New-Item -ItemType Directory -Force -Path $ResolvedOutput | Out-Null

$RendererArgs = @(
  "--input", $ResolvedInput,
  "--preset", $ResolvedPreset,
  "--out", $ResolvedOutput,
  "--sample-rate", "$SampleRate",
  "--block-size", "$BlockSize",
  "--render-root", $RenderRoot
)

if ($PresetId) {
  $RendererArgs += @("--preset-id", $PresetId)
}

& $Renderer @RendererArgs
exit $LASTEXITCODE
