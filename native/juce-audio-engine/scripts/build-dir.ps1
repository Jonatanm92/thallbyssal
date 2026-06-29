function Get-ThallbyssalNativeBuildDir {
  if ($env:THALLBYSSAL_NATIVE_BUILD_DIR) {
    return $env:THALLBYSSAL_NATIVE_BUILD_DIR
  }

  if (Test-Path "D:\") {
    $DefaultBuild = "D:\CodexBuilds\thallbyssal-native"
    $CachePath = Join-Path $DefaultBuild "CMakeCache.txt"

    if (Test-Path -LiteralPath $CachePath) {
      $SourceRoot = (Resolve-Path "$PSScriptRoot\..").Path.Replace("\", "/")
      $CachedSource = Get-Content -LiteralPath $CachePath |
        Select-String -Pattern "^CMAKE_HOME_DIRECTORY:INTERNAL=(.+)$" |
        Select-Object -First 1

      if ($CachedSource -and $CachedSource.Matches[0].Groups[1].Value.Replace("\", "/") -ne $SourceRoot) {
        $RepoRoot = (Resolve-Path "$PSScriptRoot\..\..\..").Path
        $RepoName = Split-Path $RepoRoot -Leaf
        $SafeRepoName = $RepoName -replace "[^A-Za-z0-9._-]", "-"
        return "D:\CodexBuilds\$SafeRepoName-native"
      }
    }

    return $DefaultBuild
  }

  $Root = Resolve-Path "$PSScriptRoot\.."
  return (Join-Path $Root "build")
}
