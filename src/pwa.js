// Registro del service worker: solo en producción, en navegador (no dentro de Capacitor nativo).
const nativo = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
if ('serviceWorker' in navigator && import.meta.env.PROD && !nativo) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
