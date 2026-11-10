# SECTOR 7

Мини-FPS на Three.js: один уровень, 10 дронов, PBR-материалы, тени, bloom.
Собирается в Windows `.exe` через Electron.

**Управление:** WASD, Shift — бег, мышь, ЛКМ — огонь, R — перезарядка, F — фонарь, F11 — полный экран.

## Скачать

В разделе **[Releases](https://github.com/Yokushiro/sector7-fps/releases)** доступны две Windows-версии:

- `SECTOR7-…-portable.exe` — портативная версия, не требует установки.
- `SECTOR7-…-setup.exe` — установщик с возможностью выбрать папку установки.

## Локальный запуск

Для запуска проекта из исходного кода потребуется установленный [Node.js](https://nodejs.org/).

```bash
npm install
npm start
```

## Сборка для Windows

Для сборки Windows-версий используется Electron Builder.

```bash
npm run dist
```

Готовые файлы появятся в папке `dist`.
