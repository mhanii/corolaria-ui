/**
 * HTTP Client
 * 
 * Core HTTP client with axios, including request/response interceptors,
 * error handling, and logging for development.
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT, enableApiLogging } from './config';
import { ErrorResponse } from './types';

/**
 * Create and configure the axios instance
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor
 * - Adds JWT token to Authorization header
 * - Logs requests in development mode
 */
apiClient.interceptors.request.use(
    (config) => {
        // Add JWT token if available
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('athen_access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        if (enableApiLogging) {
            console.log('[API Request]', {
                method: config.method?.toUpperCase(),
                url: config.url,
                data: config.data,
                params: config.params,
            });
        }
        return config;
    },
    (error) => {
        if (enableApiLogging) {
            console.error('[API Request Error]', error);
        }
        return Promise.reject(error);
    }
);

/**
 * Response interceptor
 * - Logs responses in development mode
 * - Transforms API errors into a consistent format
 * - Handles 401 by redirecting to login
 */
apiClient.interceptors.response.use(
    (response) => {
        if (enableApiLogging) {
            console.log('[API Response]', {
                status: response.status,
                url: response.config.url,
                data: response.data,
            });
        }
        return response;
    },
    (error: AxiosError) => {
        if (enableApiLogging) {
            console.error('[API Response Error]', {
                status: error.response?.status,
                url: error.config?.url,
                message: error.message,
                data: error.response?.data,
            });
        }

        // Handle 401 - redirect to login
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                // Clear stored credentials
                localStorage.removeItem('athen_access_token');
                localStorage.removeItem('athen_user');

                // Redirect to login page (unless already on login page)
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }

        // Transform error into a consistent format
        const errorResponse = transformError(error);
        return Promise.reject(errorResponse);
    }
);


/**
 * Transform axios errors into a consistent ErrorResponse format
 */
function transformError(error: AxiosError): ErrorResponse {
    // Check if the error response has our ErrorResponse format
    if (error.response?.data && typeof error.response.data === 'object') {
        const data = error.response.data as any;
        if (data.error && data.message) {
            return data as ErrorResponse;
        }
    }

    // Network error (no response received)
    if (!error.response) {
        return {
            error: 'NetworkError',
            message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
            details: {
                originalError: error.message,
            },
        };
    }

    // HTTP error response
    const status = error.response.status;
    let message = 'Ocurrió un error inesperado';

    switch (status) {
        case 400:
            message = 'Solicitud inválida. Verifica los datos enviados.';
            break;
        case 401:
            message = 'No autorizado. Por favor, inicia sesión.';
            break;
        case 403:
            message = 'Acceso denegado.';
            break;
        case 404:
            message = 'Recurso no encontrado.';
            break;
        case 422:
            message = 'Datos de validación incorrectos.';
            break;
        case 429:
            message = 'Demasiadas solicitudes. Por favor, espera un momento.';
            break;
        case 500:
            message = 'Error del servidor. Intenta nuevamente más tarde.';
            break;
        case 503:
            message = 'Servicio no disponible temporalmente.';
            break;
    }

    return {
        error: `HttpError${status}`,
        message,
        details: {
            status,
            statusText: error.response.statusText,
            data: error.response.data,
        },
    };
}

/**
 * Generic GET request
 */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(url, config);
    return response.data;
}

/**
 * Generic POST request
 */
export async function post<T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
}

/**
 * Generic PUT request
 */
export async function put<T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
}

/**
 * Generic DELETE request
 */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
}

/**
 * Export the configured axios instance for direct use if needed
 */
export default apiClient;
