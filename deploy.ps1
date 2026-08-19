<#
Deploy do "Eu Apoio | Um vice pra chamar Dirceu" para eu-apoio.dirceutencaten.com.br

Faz deploy limpo do zero a cada execucao:
  1. Empacota o projeto local (sem node_modules/.next/_tmp/.git)
  2. Apaga a pasta do projeto no servidor, recria e envia o pacote
  3. Remove o container antigo por NOME (nunca "docker compose down" - ver
     _docs/deploy.md, secao "Isolamento do projeto Compose")
  4. Builda a imagem e sobe o container
  5. Confere que respondeu OK local e via HTTPS

Uso:
  .\deploy.ps1
  .\deploy.ps1 -Password 'SENHA'
  .\deploy.ps1 -NoCache        # build do zero, ignorando cache de camadas
  (sem -Password, pede a senha na hora, sem deixar aparecer na tela)
#>

param(
    [string]$ServerHost = "134.199.243.177",
    [string]$ServerUser = "root",
    [string]$RemotePath = "/opt/teia/eu-apoio/releases/current",
    [string]$Domain     = "eu-apoio.dirceutencaten.com.br",
    [int]$Port          = 8102,
    [string]$Container  = "teia-eu-apoio",
    [string]$Password,
    [switch]$NoCache
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

if (-not $Password) {
    $secure = Read-Host "Senha do servidor ($ServerUser@$ServerHost)" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

$target  = "${ServerUser}@${ServerHost}"
$tarName = "opop-profile-deploy.tar.gz"
$tarPath = Join-Path $env:TEMP $tarName

function Invoke-Remote($cmd) {
    & plink -ssh -batch -pw $Password $target $cmd
    if ($LASTEXITCODE -ne 0) { throw "Comando remoto falhou (exit $LASTEXITCODE): $cmd" }
}

try {
    Write-Host "==> 1/5 Empacotando projeto..." -ForegroundColor Cyan
    if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
    # tar.exe (bsdtar) ja vem no Windows 10/11.
    & tar -czf $tarPath `
        --exclude=node_modules `
        --exclude=.next `
        --exclude=.git `
        --exclude=_tmp `
        --exclude=out `
        --exclude="*.tar.gz" `
        .
    if ($LASTEXITCODE -ne 0) { throw "Falha ao empacotar o projeto" }
    $sizeMb = [math]::Round((Get-Item $tarPath).Length / 1MB, 1)
    Write-Host "    pacote: $sizeMb MB"

    Write-Host "==> 2/5 Limpando pasta no servidor e enviando..." -ForegroundColor Cyan
    Invoke-Remote "rm -rf $RemotePath && mkdir -p $RemotePath"
    & pscp -pw $Password $tarPath "${target}:${RemotePath}/$tarName"
    if ($LASTEXITCODE -ne 0) { throw "Falha ao enviar o pacote" }
    Invoke-Remote "cd $RemotePath && tar -xzf $tarName && rm -f $tarName"

    Write-Host "==> 3/5 Removendo container antigo (por nome, isolado do resto do servidor)..." -ForegroundColor Cyan
    Invoke-Remote "docker rm -f $Container 2>/dev/null; true"

    Write-Host "==> 4/5 Buildando imagem e subindo container..." -ForegroundColor Cyan
    $buildFlags = if ($NoCache) { " --no-cache" } else { "" }
    Invoke-Remote "cd $RemotePath/stack && docker compose build$buildFlags && docker compose up -d"

    Write-Host "==> 5/5 Conferindo..." -ForegroundColor Cyan
    # O Next leva ~1s pra aceitar conexoes depois que o container sobe.
    Invoke-Remote "sleep 3; curl -s -o /dev/null -w 'local ${Port}: HTTP %{http_code}\n' http://127.0.0.1:$Port/"
    Invoke-Remote "curl -sk -o /dev/null -w 'https: HTTP %{http_code}\n' https://$Domain/"

    Write-Host "==> Deploy concluido: https://$Domain" -ForegroundColor Green
}
finally {
    if (Test-Path $tarPath) { Remove-Item $tarPath -Force -ErrorAction SilentlyContinue }
}
