self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};

  const title = payload.title || "Meteor Bridge";
  const body = payload.body || "A new action is waiting for your approval";

  const notificationOptions = {
    body,
    icon: payload.icon || "/vite.svg",
    badge: payload.badge || "/vite.svg",
    data: {
      targetUrl: payload.targetUrl || "/",
      bridgeId: payload.bridgeId,
      actionId: payload.actionId,
    },
  };

  event.waitUntil(self.registration.showNotification(title, notificationOptions));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.targetUrl || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const requestedUrl = new URL(targetUrl, self.location.origin);

        if (clientUrl.pathname === requestedUrl.pathname && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
