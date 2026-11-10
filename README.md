# SECTOR 7

Мини-FPS на Three.js: один уровень, 10 дронов, PBR-материалы, тени, bloom.
Собирается в Windows `.exe` через Electron.

**Управление:** WASD, Shift — бег, мышь, ЛКМ — огонь, R — перезарядка, F — фонарь, F11 — полный экран.

## Скачать
Раздел **Releases** — `SECTOR7-…-portable.exe` (без установки) или `…-nsis.exe` (установщик).

## Локальный запуск
```
npm install
npm start
```

## Выпуск релиза
```
git tag v1.0.0
git push origin v1.0.0
```
GitHub Actions соберёт exe на Windows и приложит к релизу.
