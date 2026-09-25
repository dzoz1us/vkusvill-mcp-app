/**
 * API entrypoint.
 *
 * Chooses between the mock and the real backend based on VITE_USE_MOCK.
 * The exported `api` object has the same shape in both modes, so pages
 * don't care which one is active.
 *
 * To hit the real backend:
 *   VITE_USE_MOCK=false  in frontend/.env
 *   (and make sure the backend is running on VITE_API_URL or /api proxy)
 */

import { api as httpApi } from './client.http';
import { api as mockApi } from './client.mock';

const useMock = String(import.meta.env.VITE_USE_MOCK ?? 'true').toLowerCase() === 'true';

export const api = useMock ? mockApi : httpApi;

export { ApiError } from './client.http';