# Mi Sistema Personal

App personal (PWA) para gestionar **metas de ahorro**, **objetivos** personales/profesionales y **hábitos/rutinas**. Datos 100% locales en tu navegador, con respaldo exportable.

## Funcionalidades

- 🏠 **Dashboard**: resumen de ahorro, metas más cercanas y hábitos del día.
- 💰 **Metas de ahorro**: objetivo con foto, descripción y monto. Agregás montos manualmente y la barra de progreso avanza hasta "¡Meta lograda!".
- 🎯 **Objetivos**: personales y profesionales, con estado (pendiente / en progreso / logrado), notas y fecha límite.
- 🔁 **Hábitos**: rutinas diarias/semanales con check del día y racha 🔥.
- ⚙️ **Ajustes**: tema claro/oscuro, símbolo de moneda y exportar/importar respaldo.
- 📱 **PWA**: instalable en PC y móvil.

## Uso local

```bash
npm install
npm run dev      # abre http://localhost:5173
```

## Build de producción

```bash
npm run build    # genera /dist
npm run preview  # previsualiza el build
```

## Publicar gratis (para usarla en el móvil)

**Netlify (drag & drop):** corré `npm run build` y arrastrá la carpeta `dist` a https://app.netlify.com/drop.

**Netlify/Vercel desde repo:** ya incluye `netlify.toml`. Conectá el repositorio y listo (build: `npm run build`, publish: `dist`).

Una vez publicada, abrí el link en el navegador del celular → menú → **"Agregar a pantalla de inicio"** / **"Instalar app"**.

## Datos y privacidad

Todo se guarda en IndexedDB del navegador (local, sin servidores ni cuentas). Cada dispositivo tiene sus propios datos. Para mover datos entre dispositivos o respaldar: **Ajustes → Exportar / Importar respaldo**.

## Stack

React + Vite + TypeScript · Tailwind CSS · Zustand · localforage (IndexedDB) · vite-plugin-pwa · lucide-react.
