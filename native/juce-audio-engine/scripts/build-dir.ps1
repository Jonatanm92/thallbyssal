function Get-ThallbyssalNativeBuildDir {
  if ($env:THALLBYSSAL_NATIVE_BUILD_DIR) {
    return $env:THALLBYSSAL_NATIVE_BUILD_DIR
  }

  if (Test-Path "D:\") {
    return "D:\CodexBuilds\thallbyssal-native"
  }

  $Root = Resolve-Path "$PSScriptRoot\.."
  return (Join-Path $Root "build")
}
