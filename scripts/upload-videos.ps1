# PowerShell script to upload videos to Supabase Storage
# Run this from your project directory: C:\Users\mkahl\Desktop\no-creyeon

Write-Host "🚀 Starting video upload to Supabase Storage..." -ForegroundColor Green

# Check if Node.js is available
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js not found. Please install Node.js first."
    exit 1
}

# Check if the upload script exists
if (!(Test-Path "scripts\upload-videos-to-supabase.js")) {
    Write-Error "Upload script not found at scripts\upload-videos-to-supabase.js"
    exit 1
}

# Check if .env.local exists
if (!(Test-Path ".env.local")) {
    Write-Error ".env.local file not found. Make sure your Supabase credentials are set."
    exit 1
}

# List video files that should exist
$videoFiles = @(
    "public\food-menu-images\birria-soup-watch-it-made.mp4",
    "public\food-menu-images\fish-tacos-watch-it-made.mp4",
    "public\food-menu-images\watch-it-be-made-burrito.mp4",
    "public\food-menu-images\watch-it-being-made-queso-tacos.mp4",
    "public\food-menu-images\watch-it-being-made-taco-salad.mp4",
    "public\food-menu-images\watch-it-made-breakfast-burrito.mp4",
    "public\food-menu-images\watch-it-made-pizza.mp4",
    "public\food-menu-images\watch-it-made.mp4",
    "public\drink-menu-images\MARGARITA-BOARDS.mp4",
    "public\drink-menu-images\margarita-tower.mp4",
    "public\drink-menu-images\watch-it-made-vampiros.mp4",
    "public\icons\first-box.mp4",
    "public\icons\main-page-only.mp4",
    "public\icons\priemer-destination.mp4",
    "public\icons\video-food.mp4",
    "public\icons\welcome-to-hustle.mp4"
)

Write-Host "📋 Checking for video files..." -ForegroundColor Yellow
$foundFiles = @()
$missingFiles = @()

foreach ($file in $videoFiles) {
    if (Test-Path $file) {
        $foundFiles += $file
        $size = [math]::Round((Get-Item $file).Length / 1MB, 2)
        Write-Host "✅ Found: $file ($size MB)" -ForegroundColor Green
    } else {
        $missingFiles += $file
        Write-Host "❌ Missing: $file" -ForegroundColor Red
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "Found: $($foundFiles.Count) videos" -ForegroundColor Green
Write-Host "Missing: $($missingFiles.Count) videos" -ForegroundColor Red

if ($foundFiles.Count -eq 0) {
    Write-Error "No video files found! Make sure you're running this from the correct directory."
    exit 1
}

# Create lib/constants directory if it doesn't exist
if (!(Test-Path "lib\constants")) {
    New-Item -ItemType Directory -Path "lib\constants" -Force | Out-Null
    Write-Host "📁 Created lib\constants directory" -ForegroundColor Yellow
}

# Run the Node.js upload script
Write-Host "`n🚀 Running upload script..." -ForegroundColor Green
node scripts\upload-videos-to-supabase.js

Write-Host "`n✨ Upload process completed!" -ForegroundColor Green
Write-Host "Check the output above for any errors or successful uploads." -ForegroundColor Yellow