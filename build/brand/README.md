# 图标母版 / Icon masters

- `dango-house-v2.png`: 原创生成图标母版；三位团子趴在共享 Dock 与爱心屋檐下。Original generated mark: three mochi companions on a shared Dock beneath a heart-shaped roof.
- `dango-house-v2.ico`: 16 / 24 / 32 / 48 / 64 / 128 / 256 px Windows 图标。Multi-resolution Windows icon.
- `preview-256.png`: 256 px 检视图。Small-size review image.
- `legacy-v1.png`: 旧版保留用于比较。Previous mark, preserved for comparison.

`node scripts/brand.mjs` copies the current PNG/ICO to `public/icon.png` and `build/icon.ico`. `npm run assets` uses the same script. The checked-in ICO is generated from the PNG with Pillow's LANCZOS resizing and contains all listed sizes; copying assets requires no Python dependency.

运行 `node scripts/brand.mjs` 即可同步资源；图标已打包保存，日常构建不依赖 Python。图标为本项目生成，未挪用模型服务商的商标或角色素材。
