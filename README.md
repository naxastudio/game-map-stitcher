# Game Map Stitcher

Game Map Stitcher is a browser-based tool for combining overlapping game screenshots into a larger map image.

The app runs locally in the browser. It supports manual image ordering, automatic overlap matching, feature matching through OpenCV.js when available, alpha-mask blending, border cropping, coordinate-based placement, and OCR-assisted coordinate detection.

## Features

- Upload multiple PNG, JPG, or WebP screenshots.
- Drag and drop images into the upload area.
- Stitch horizontally, vertically, as a grid, as unordered multi-image input, or by map coordinates.
- Automatically estimate screenshot order and overlap.
- Optional OpenCV.js feature matching using SIFT or ORB when the bundled build exposes those APIs.
- Optional alpha-mask blending for smoother seams.
- Optional screenshot border cropping.
- Manual fine tuning after generation by dragging images in the preview.
- Chinese and English UI.
- Export the final map as PNG.

## Run Locally

On Windows, double-click:

```text
start-map-stitcher.cmd
```

or:

```text
启动地图拼接器.bat
```

The server will choose the first available port from `3000` to `3010` and open the local page automatically.

You can also run the PowerShell server directly:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
```

## Coordinate Stitching

Coordinate mode can place screenshots based on map coordinates. Coordinates can be entered manually, parsed from filenames, or detected from on-screen coordinate text with OCR.

OCR accuracy depends on the game UI, text size, contrast, and where the coordinate text appears in the screenshot.

## Third-Party Components

- OpenCV.js is loaded in the browser from the official OpenCV documentation CDN.
- OCR is loaded in the browser from the Tesseract.js CDN when coordinate detection is used.

## License

MIT
