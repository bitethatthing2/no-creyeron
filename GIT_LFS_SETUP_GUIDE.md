# Git LFS Setup Guide for Videos

## Step 1: Install Git LFS
Run in PowerShell/Command Prompt:
```bash
winget install GitHub.GitLFS
```

Or download from: https://git-lfs.github.io/

## Step 2: Initialize Git LFS (run after installation)
```bash
git lfs install
```

## Step 3: Track video files
```bash
git lfs track "*.mp4"
```

## Step 4: Add .gitattributes file
```bash
git add .gitattributes
git commit -m "Add Git LFS tracking for video files"
```

## Step 5: Add video files
```bash
git add public/food-menu-images/*.mp4
git add public/drink-menu-images/*.mp4  
git add public/icons/*.mp4
```

## Step 6: Commit and push videos
```bash
git commit -m "Add video files via Git LFS"
git push origin main
```

## Video files to be uploaded:
### Food Menu Videos (11 files)
- birria-soup-watch-it-made.mp4
- fish-tacos-watch-it-made.mp4
- watch-it-be-made-burrito.mp4
- watch-it-being-made-queso-tacos.mp4
- watch-it-being-made-taco-salad.mp4
- watch-it-made-breakfast-burrito.mp4
- watch-it-made-pizza.mp4
- watch-it-made.mp4

### Drink Menu Videos (3 files)
- MARGARITA-BOARDS.mp4
- margarita-tower.mp4
- watch-it-made-vampiros.mp4

### Icon Videos (5 files)
- first-box.mp4
- main-page-only.mp4
- priemer-destination.mp4
- video-food.mp4
- welcome-to-hustle.mp4

**Total: 17 video files**

## Notes:
- Git LFS is free for public repos (1GB storage, 1GB bandwidth/month)
- Private repos: 1GB storage, 1GB bandwidth free, then paid
- Each video file will be stored once and referenced by pointer