# Публикация проекта на GitHub и запуск сборки exe.
# Нужно: git и GitHub CLI (https://cli.github.com), один раз: gh auth login
param(
  [string]$Name = (Split-Path -Leaf (Get-Location)),
  [string]$Tag = "v1.0.0",
  [switch]$Private
)
$ErrorActionPreference = "Stop"
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "Установи GitHub CLI: winget install GitHub.cli" }
gh auth status | Out-Null
if (-not (Test-Path .git)) { git init -b main }
git add .
git commit -m "Initial commit" 2>$null
$vis = if ($Private) { "--private" } else { "--public" }
gh repo create $Name $vis --source . --remote origin --push
git tag $Tag
git push origin $Tag
Write-Host "Готово. Сборка: gh run watch  |  Релизы: gh release list"
