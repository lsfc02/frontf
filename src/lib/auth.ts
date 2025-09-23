import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp: number;
  [key: string]: any;
}

export function isTokenValid(): boolean {
  const token = localStorage.getItem("token");

  if (!token) {
    return false;
  }

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return decoded.exp > nowInSeconds;
  } catch (error) {
    console.error("Erro ao decodificar o token:", error);
    return false;
  }
}

export function clearToken() {
  localStorage.removeItem("token");
}