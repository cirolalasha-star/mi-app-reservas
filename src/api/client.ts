// src/api/client.ts
// -------------------------------
// Centraliza todas las llamadas HTTP a tu backend.
// Si cambias la URL base o agregas headers, solo lo haces aquí.

const BASE_URL = process.env.API_URL || "http://localhost:3000/api";

/**
 * Obtiene el token guardado (si existe)
 */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token
    ? { Authorization: `Bearer ${token}` }
    : {}; // Si no hay token, no añade el header
}

/**
 * Hace una petición GET a la API.
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Error ${res.status}: ${msg}`);
  }

  return (await res.json()) as T;

}

/**
 * Hace una petición POST a la API.
 */
export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Error ${res.status}: ${msg}`);
  }

  return (await res.json()) as T;

}
/**
 * ·getAuthHeaders(): Toma el token de localStorage  y lo añade al header si existe
 * ·HEaders unificados: Tanto GET como POST ahora mandan Authorization: Bearer <token> si hay token
 * ·Mejor manejo de errores: Devuelve el mensaje textual del backend (no solo el código)
 */