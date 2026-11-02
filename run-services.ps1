param([switch]$SkipBuild, [switch]$SkipInfrastructure, [switch]$SkipFrontend)
& (Join-Path $PSScriptRoot 'start-all.ps1') @PSBoundParameters
