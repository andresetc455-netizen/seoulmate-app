// Configuración de "En la nube" que viene cargada de fábrica al armar la app (no son secretos:
// el ID de la app de Microsoft es público y el enlace solo funciona para quien tiene acceso a la carpeta).
// Se completa con las variables VITE_CLOUD_CLIENT_ID y VITE_CLOUD_FOLDER al compilar.
export const DEFAULT_CLOUD_CLIENT_ID: string = (import.meta.env.VITE_CLOUD_CLIENT_ID ?? '').trim();
export const DEFAULT_CLOUD_FOLDER: string = (import.meta.env.VITE_CLOUD_FOLDER ?? '').trim();

export function cloudConfig(s: { cloudClientId?: string; cloudFolder?: string }): { clientId: string; folder: string } {
  return { clientId: s.cloudClientId?.trim() || DEFAULT_CLOUD_CLIENT_ID, folder: s.cloudFolder?.trim() || DEFAULT_CLOUD_FOLDER };
}
