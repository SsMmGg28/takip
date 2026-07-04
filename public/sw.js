/**
 * Ders Takip service worker'ı: web push bildirimlerini alır ve kilit
 * ekranı/bildirim merkezinde gösterir; bildirime tıklanınca ilgili sayfayı
 * açar. Offline cache yapmaz — tek görevi push.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: event.data.text() };
  }

  const title = data.title || "Ders Takip";
  const options = {
    body: data.body || undefined,
    icon: data.icon || "/icon.png",
    badge: data.badge || "/icon.png",
    vibrate: [100, 50, 100],
    tag: data.tag || undefined,
    data: { link: data.link || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = (event.notification.data && event.notification.data.link) || "/";
  const url = new URL(link, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Uygulama zaten açıksa mevcut pencereyi odaklayıp yönlendir.
      for (const client of windows) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (windows.length > 0 && "navigate" in windows[0]) {
        await windows[0].focus();
        return windows[0].navigate(url);
      }
      return self.clients.openWindow(url);
    })(),
  );
});
