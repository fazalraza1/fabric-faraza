[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$FunctionAppName
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$functionRoot = Join-Path $projectRoot 'azure-function'

if (-not (Get-Command func -ErrorAction SilentlyContinue)) {
    throw 'Azure Functions Core Tools is required. Install version 4 before running this script.'
}

Write-Host '[1/2] Publishing the Python ingestion function...' -ForegroundColor Cyan
Push-Location $functionRoot
try {
    func azure functionapp publish $FunctionAppName --python
}
finally {
    Pop-Location
}

Write-Host '[2/2] Function source published. Review Application Insights before triggering ingestion.' -ForegroundColor Green
