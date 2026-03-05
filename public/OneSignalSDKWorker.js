importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || event.notification.data?.launchURL;

  if (url) {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Si ya hay una pestaña abierta, navega ahí
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            return client.navigate(url);
          }
        }
        // Si no hay pestaña abierta, abre una nueva
        return clients.openWindow(url);
      })
    );
  }
});