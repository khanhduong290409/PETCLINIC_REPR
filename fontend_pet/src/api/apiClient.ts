export const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;

// Lấy JWT token từ localStorage
export function getToken(): string | null {
  return localStorage.getItem('token');
}

// Trả về Authorization header nếu có token
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Decode JWT payload (không verify, chỉ đọc data)
export function parseJwt(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(window.atob(base64));
}

// Kiểm tra token có còn hạn không
export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseJwt(token);
    const exp = payload.exp as number;
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
