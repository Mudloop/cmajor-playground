const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const generateUniqueId = (length: number = 16) => [...self.crypto.getRandomValues(new Uint32Array(length))].map(n => characters[n % characters.length]).join('');
(globalThis as any).generateUniqueId = generateUniqueId;