# Flowtime (PWA)

## Publicar en GitHub Pages
1. Crea un repositorio nuevo en GitHub (por ejemplo `flowtime`).
2. Sube TODO el contenido de esta carpeta a la raíz del repositorio
   (`index.html`, `manifest.json`, `sw.js`, carpeta `icons/`).
3. En el repositorio: Settings → Pages → Source: "Deploy from a branch"
   → Branch: `main` / carpeta `/ (root)` → Save.
4. Espera 1-2 minutos. Tu app quedará en:
   `https://TU-USUARIO.github.io/flowtime/`

## Instalar en Android
1. Abre esa dirección en Chrome.
2. Menú ⋮ → "Instalar app" (o "Añadir a la pantalla de inicio").
3. Ábrela desde el ícono: va a pantalla completa y funciona sin internet.

## Actualizar
Edita `index.html`, súbelo y cambia `V='flowtime-v2'` en `sw.js` por
`flowtime-v3` para que los celulares descarguen la versión nueva.

## Importar temas
Pestaña Actividades → "Importar temas de estudio". Formatos:

    # Cálculo
    - Límites
    - Derivadas

    Programación: Recursividad
    Bases de datos;Normalización      (CSV)
    {"Física":["Cinemática","Dinámica"]}

La app sugiere en la pestaña Sesión qué estudiar (lo que más tiempo lleva sin tocar).
