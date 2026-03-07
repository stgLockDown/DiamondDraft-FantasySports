# DiamondDraft Desktop App Assets

Place the following icon files here for building installers:

| File | Size | Platform |
|------|------|----------|
| `icon.png` | 512x512 | Linux / Source |
| `icon.ico` | 256x256 | Windows |
| `icon.icns` | 512x512 | macOS |
| `tray-icon.png` | 16x16 or 22x22 | System tray (all platforms) |

## Generating Icons

From a 512x512 PNG source:

```bash
# Windows .ico (requires imagemagick)
convert icon.png -resize 256x256 icon.ico

# macOS .icns (on macOS)
mkdir icon.iconset
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
iconutil -c icns icon.iconset

# Tray icon
convert icon.png -resize 22x22 tray-icon.png
```