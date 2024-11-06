export const hashString = async (...str: string[]) => [...new Uint8Array((await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str.join('-')))))].map(b => b.toString(16).padStart(2, '0')).join('');
export const hashAny = async (...params: any[]) => hashString(JSON.stringify(params));
