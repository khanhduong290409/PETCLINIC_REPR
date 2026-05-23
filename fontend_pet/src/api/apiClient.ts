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
  //ở backend JJWT mặc định dùng Base64URL, không phải base64 chuẩn
  //lấy payload, thay thế các kí tự - và _ ( 2 kí tự này không nằm trong chuẩn base64) 
  //chuyển 2 kí tự này tương đương sang + và / trong base64 ( và vì 2 kí tự này không chứa dữ liệu nên hay thay thế vẫn không làm thay đổi dữ liệu)
  const bytes = Uint8Array.from(window.atob(base64), c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));//decode bytes thành text -> đóng gói -> object
  //nguyên nhân gây ra lỗi Æ°Æ¡ng(lỗi UTF8) vì ở code cũ:
  //return JSON.parse(window.atob(base64)); ( không có dòng chuyễn dữ liệu bytes)
  //lỗi này chỉ xảy ra với login google vì login google lấy info user từ token để gán vào tên user ở fontend dẫn đến lỗi
  //còn với login bth thì lấy info user bằng api trực tiếp

}

// Kiểm tra token có còn hạn không
export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseJwt(token);
    const exp = payload.exp as number;
    return exp * 1000 < Date.now();//date.now trả về milliseconds còn exp trong token là seconds nên * 1000
  } catch {
    return true;
  }
}
