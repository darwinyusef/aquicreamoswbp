/**
 * Configuración centralizada del backend
 *
 * Todas las llamadas al backend deben usar esta configuración
 * para asegurar consistencia y facilitar mantenimiento.
 *
 * IMPORTANTE: Se usa PUBLIC_BACKEND_URL para que esté disponible en el cliente
 */

// URL del backend - se lee de variables de entorno
// En el cliente (browser) usa PUBLIC_BACKEND_URL
// En el servidor (SSR) usa BACKEND_URL
export const BACKEND_URL = typeof window !== 'undefined'
  ? import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3001'
  : import.meta.env.BACKEND_URL || 'http://localhost:3001';

/**
 * Endpoints disponibles en el backend
 */
export const BACKEND_ENDPOINTS = {
  // Chat Assistant (OpenAI proxy)
  chat: `${BACKEND_URL}/api/chat`,

  // Appointments
  appointments: `${BACKEND_URL}/api/appointments`,
  occupiedSlots: `${BACKEND_URL}/api/appointments/occupied-slots`,

  // Bug Reports
  bugReports: `${BACKEND_URL}/api/bug-reports`,

  // Service Classifier (TensorFlow)
  classifyService: `${BACKEND_URL}/api/classify-service`,
} as const;

/**
 * Helper para hacer requests al backend con manejo de errores
 */
export async function fetchBackend(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    return response;
  } catch (error) {
    console.error('Error al conectar con el backend:', error);
    throw new Error('No se pudo conectar con el servidor. Por favor, intenta más tarde.');
  }
}
