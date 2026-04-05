export function typeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    'Детка': 'badge-detka',
    'Срез': 'badge-srez',
    'Взрослое': 'badge-vzrosly',
    'Укоренённый лист': 'badge-list',
  };
  return map[type] ?? 'badge-other';
}

export function buildVkMessage(items: Array<{name: string, type: string, qty: number, price: number}>, delivery: string): string {
  const lines = items.map(i => `— ${i.name} (${i.type}) × ${i.qty} — ${i.price * i.qty} ₽`);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  return [
    'Здравствуйте! Хочу заказать:',
    ...lines,
    '',
    `Итого: ${total} ₽`,
    `Доставка: ${delivery}`,
  ].join('\n');
}

export function vkLink(vkUrl: string, message: string): string {
  // Extract username/id from vk.com/username
  const match = vkUrl.match(/vk\.com\/(.+)/);
  const id = match ? match[1] : vkUrl;
  return `https://vk.me/${id}?msg=${encodeURIComponent(message)}`;
}

export function getProductImages(id: string, base: string): string[] {
  // In static build we can't scan filesystem at runtime,
  // so images are resolved by convention: /images/{id}/1.jpg ... 9.jpg
  // We return a pattern and let the component handle missing images
  return [`${base}/images/${id}/1.jpg`];
}
