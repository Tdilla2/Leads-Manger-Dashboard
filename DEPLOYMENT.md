# GDI Leads Manager - AWS Amplify Deployment Guide

## Project Info

- **App Name:** GDI Leads Manager
- **App ID:** dfv8ecglassn
- **Region:** us-east-1
- **Live URL:** https://main.dfv8ecglassn.amplifyapp.com
- **Branch:** main

## Prerequisites

- AWS CLI installed and configured (`aws --version`)
- Node.js and npm installed
- Valid AWS credentials with Amplify permissions

## Step 1: Build the Project

```bash
cd "c:\Users\thoma\Downloads\Leads Manager Dashboard"
npm install
npm run build
```

This produces a `dist/` folder containing:
- `index.html`
- `assets/index-*.js`
- `assets/index-*.css`
- `assets/*.png` (images)

## Step 2: Create the Amplify App (First Time Only)

```bash
aws amplify create-app --name "GDI Leads Manager" --region us-east-1
```

Save the `appId` from the response (e.g., `dfv8ecglassn`).

## Step 3: Create the Branch (First Time Only)

```bash
aws amplify create-branch --app-id dfv8ecglassn --branch-name main --region us-east-1
```

## Step 4: Configure SPA Rewrite Rules (First Time Only)

Single-page applications need a rewrite rule so that all non-file routes serve `index.html`. Without this, direct navigation or page refresh returns a 404.

Create a file called `rewrite-rules.json`:

```json
[
  {
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
    "target": "/index.html",
    "status": "200"
  }
]
```

Apply it:

```bash
aws amplify update-app --app-id dfv8ecglassn --region us-east-1 --custom-rules file://rewrite-rules.json
```

> **Important:** A simple catch-all rule like `/<*>` -> `/index.html` with status `200` will rewrite ALL requests (including JS/CSS assets) to return `index.html`, breaking the app. The regex-based rule above excludes static file extensions so they are served normally.

## Step 5: Create the Deployment Zip

### CRITICAL: Windows Backslash Issue

Windows' built-in `Compress-Archive` (PowerShell) creates zip files with **backslash** path separators (`assets\index.js`). AWS Amplify runs on Linux and expects **forward slashes** (`assets/index.js`). If you use `Compress-Archive`, Amplify will not be able to find your asset files, resulting in 404 errors for JS/CSS and a blank page.

**DO NOT use this:**
```powershell
# BAD - produces backslashes in zip entries
Compress-Archive -Path dist\* -DestinationPath deploy.zip
```

**USE this instead** (PowerShell with .NET API for forward slashes):

```powershell
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$distPath = "c:\Users\thoma\Downloads\Leads Manager Dashboard\dist"
$zipPath = "c:\Users\thoma\Downloads\Leads Manager Dashboard\deploy.zip"

if (Test-Path $zipPath) { Remove-Item $zipPath }

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, "Create")

Get-ChildItem -Path $distPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($distPath.Length + 1).Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relativePath) | Out-Null
}

$zip.Dispose()
```

### Verify Zip Contents

Confirm forward slashes before uploading:

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [System.IO.Compression.ZipFile]::OpenRead("deploy.zip")
$z.Entries | Select-Object -ExpandProperty FullName
$z.Dispose()
```

Expected output:
```
index.html
assets/ce8d117a995a5a85f88957aad4cbbb801c7516f2-ByQ8fs9X.png
assets/index-BctpYLz2.js
assets/index-BOrn0JdC.css
```

If you see `assets\...` with backslashes, the deploy will fail silently (blank page).

## Step 6: Upload and Deploy

```bash
# Create a deployment (returns a presigned upload URL and job ID)
aws amplify create-deployment --app-id dfv8ecglassn --branch-name main --region us-east-1

# Upload the zip to the presigned URL from the response
curl -T deploy.zip "<zipUploadUrl from above>"

# Start the deployment using the job ID from create-deployment
aws amplify start-deployment --app-id dfv8ecglassn --branch-name main --job-id <jobId> --region us-east-1
```

## Step 7: Verify Deployment

```bash
# Check deployment status
aws amplify get-job --app-id dfv8ecglassn --branch-name main --job-id <jobId> --region us-east-1 --query "job.summary.status" --output text
```

Should return `SUCCEED`.

Then verify assets load correctly:

```bash
# Should return 200 with Content-Type: text/javascript (NOT text/html)
curl -sI https://main.dfv8ecglassn.amplifyapp.com/assets/index-BctpYLz2.js | head -5
```

## Quick Redeploy Script

For subsequent deployments, run the full sequence:

```powershell
# 1. Build
cd "c:\Users\thoma\Downloads\Leads Manager Dashboard"
npm run build

# 2. Create zip with forward slashes
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$distPath = "$PWD\dist"
$zipPath = "$PWD\deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, "Create")
Get-ChildItem -Path $distPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($distPath.Length + 1).Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relativePath) | Out-Null
}
$zip.Dispose()
```

Then in a standard terminal:

```bash
# 3. Create deployment, upload, and start
aws amplify create-deployment --app-id dfv8ecglassn --branch-name main --region us-east-1
# Copy the zipUploadUrl and jobId from the output
curl -T deploy.zip "<zipUploadUrl>"
aws amplify start-deployment --app-id dfv8ecglassn --branch-name main --job-id <jobId> --region us-east-1
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank white page | JS/CSS assets returning 404 or HTML instead of actual files | Check zip has forward slashes; check rewrite rules aren't catching static files |
| 404 on page refresh | Missing SPA rewrite rule | Add the regex-based rewrite rule (Step 4) |
| Assets return `index.html` content | Overly broad rewrite rule (`/<*>` -> `/index.html`) | Use the regex-based rule that excludes file extensions |
| Zip has backslashes | Used Windows `Compress-Archive` | Use the .NET `ZipFile` API with `.Replace("\", "/")` |
