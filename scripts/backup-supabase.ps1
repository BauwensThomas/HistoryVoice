#Requires -Version 5.1
<#
Sauvegarde hebdomadaire complete de Supabase HistoryVoice :
- Schema + donnees des schemas public, auth, storage (tables, comptes utilisateurs, metadonnees buckets)
- Roles de la base
- Fichiers Storage (buckets), s'il y en a
- Liste des secrets des Edge Functions (noms uniquement, Supabase ne rend pas les valeurs)
- Copie du code des Edge Functions et des migrations (redondant avec Git, mais backup autonome)
Le tout compresse dans un zip date, stocke hors du depot Git.
Demarre Docker Desktop automatiquement si besoin (requis par `supabase db dump`).
#>

$ErrorActionPreference = "Stop"

$repoRoot      = Split-Path -Parent $PSScriptRoot
$backupRoot    = Join-Path $repoRoot "backups"
$date          = Get-Date -Format "yyyy-MM-dd"
$workDir       = Join-Path $env:TEMP "historyvoice-backup-$date"
$zipFile       = Join-Path $backupRoot "historyvoice-backup-$date.zip"
$dockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
$projectRef    = "dqxaxgvncoxgwfzumvfg"
$schemas       = "public,auth,storage"

New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

if (Test-Path $zipFile) {
    Write-Host "Backup deja fait pour $date, on saute."
    exit 0
}

if (Test-Path $workDir) { Remove-Item -Recurse -Force $workDir }
New-Item -ItemType Directory -Force -Path $workDir | Out-Null

# Demarre Docker Desktop si le daemon ne repond pas encore, et attend qu'il soit pret.
function Test-DockerReady {
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    try {
        docker info 2>$null 1>$null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    } finally {
        $ErrorActionPreference = $prevPref
    }
}

if (-not (Test-DockerReady)) {
    Write-Host "Docker n'est pas lance, demarrage de Docker Desktop..."
    Start-Process -FilePath $dockerDesktop
    $waited = 0
    while (-not (Test-DockerReady) -and $waited -lt 180) {
        Start-Sleep -Seconds 5
        $waited += 5
    }
    if (-not (Test-DockerReady)) {
        throw "Docker n'a pas demarre a temps (180s)."
    }
    Write-Host "Docker pret apres ${waited}s."
}

Set-Location $repoRoot

# 1) Base de donnees : schema (structure) + donnees, schemas public/auth/storage
& npx supabase db dump --linked --schema $schemas -f (Join-Path $workDir "schema.sql")
if ($LASTEXITCODE -ne 0) { throw "supabase db dump (schema) a echoue (code $LASTEXITCODE)" }

& npx supabase db dump --linked --schema $schemas --data-only -f (Join-Path $workDir "data.sql")
if ($LASTEXITCODE -ne 0) { throw "supabase db dump (data) a echoue (code $LASTEXITCODE)" }

& npx supabase db dump --linked --role-only -f (Join-Path $workDir "roles.sql")
if ($LASTEXITCODE -ne 0) { throw "supabase db dump (roles) a echoue (code $LASTEXITCODE)" }

# 2) Storage : telecharge tous les buckets s'il y en a
$storageDir = Join-Path $workDir "storage"
New-Item -ItemType Directory -Force -Path $storageDir | Out-Null

$bucketsJson = & npx supabase --experimental storage ls --linked "ss:///" 2>$null
try {
    $buckets = ($bucketsJson | ConvertFrom-Json).paths
} catch {
    $buckets = @()
}

foreach ($bucket in $buckets) {
    $bucketName = $bucket.TrimEnd('/')
    if (-not $bucketName) { continue }
    Write-Host "Telechargement du bucket : $bucketName"
    & npx supabase --experimental storage cp --linked -r "ss:///$bucketName" (Join-Path $storageDir $bucketName)
}

# 3) Liste des secrets Edge Functions (noms + empreinte seulement, pas les valeurs)
& npx supabase secrets list --project-ref $projectRef -o json > (Join-Path $workDir "edge-function-secrets-names-only.json")

# 4) Copie du code des Edge Functions et migrations (redondant avec Git, pour un backup autonome)
Copy-Item -Recurse -Path (Join-Path $repoRoot "supabase\functions") -Destination (Join-Path $workDir "functions")
Copy-Item -Recurse -Path (Join-Path $repoRoot "supabase\migrations") -Destination (Join-Path $workDir "migrations")

# 5) Compression finale
Compress-Archive -Path (Join-Path $workDir "*") -DestinationPath $zipFile -Force
Remove-Item -Recurse -Force $workDir

Write-Host "Backup enregistre : $zipFile"
