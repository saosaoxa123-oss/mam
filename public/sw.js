// Service worker tối giản: chỉ để app cài được lên màn hình chính.
// Không cache API để kết quả phân tích luôn mới.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
