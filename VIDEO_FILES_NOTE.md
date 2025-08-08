# Video Files Not Uploaded

The following video files were NOT uploaded to GitHub due to size constraints:

## Food Menu Videos
- birria-soup-watch-it-made.mp4
- fish-tacos-watch-it-made.mp4
- watch-it-be-made-burrito.mp4
- watch-it-being-made-queso-tacos.mp4
- watch-it-being-made-taco-salad.mp4
- watch-it-made-breakfast-burrito.mp4
- watch-it-made-pizza.mp4
- watch-it-made.mp4

## Drink Menu Videos
- MARGARITA-BOARDS.mp4
- margarita-tower.mp4
- watch-it-made-vampiros.mp4

## Icon Videos
- first-box.mp4
- main-page-only.mp4
- priemer-destination.mp4
- video-food.mp4
- welcome-to-hustle.mp4

## Solutions:
1. Use Git LFS (Large File Storage) for videos
2. Host videos on a CDN or cloud storage (S3, Cloudinary, etc.)
3. Use YouTube/Vimeo embeds instead
4. Compress videos to smaller sizes

To add videos with Git LFS:
```bash
git lfs track "*.mp4"
git add .gitattributes
git add [video files]
git commit -m "Add videos with LFS"
git push
```