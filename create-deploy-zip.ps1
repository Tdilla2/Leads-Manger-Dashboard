Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
$zipPath = 'C:\Users\thoma\Downloads\Leads Manager Dashboard\dist-deploy.zip'
$distPath = 'C:\Users\thoma\Downloads\Leads Manager Dashboard\dist'

Remove-Item -Force $zipPath -ErrorAction SilentlyContinue

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
$files = Get-ChildItem -Recurse -File $distPath

foreach ($f in $files) {
    $rel = $f.FullName.Substring($distPath.Length + 1).Replace('\', '/')
    Write-Host "Adding: $rel"
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $rel) | Out-Null
}

$zip.Dispose()
Write-Host 'Zip created successfully'
