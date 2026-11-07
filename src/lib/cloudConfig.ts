// Configuración de "En la nube" que viene cargada de fábrica al armar la app (no son secretos:
// el ID de la app de Microsoft es público y el enlace solo funciona para quien tiene acceso a la carpeta).
// Se completa con las variables VITE_CLOUD_CLIENT_ID y VITE_CLOUD_FOLDER al compilar.
// Si no se pasan variables al compilar, se usa la configuración de esta instalación.
const CLIENT_ID = '144133634910-35inhraffevpfqd0r422c1g07beckkjk.apps.googleusercontent.com';
const FOLDER = 'https://drive.google.com/drive/folders/1TRSTq0lci4IHIJei2Ju5cswKF5YXfuDF?usp=drive_link';

export const DEFAULT_CLOUD_CLIENT_ID: string = (import.meta.env.VITE_CLOUD_CLIENT_ID || (import.meta.env.MODE === 'test' ? '' : CLIENT_ID)).trim();
export const DEFAULT_CLOUD_FOLDER: string = (import.meta.env.VITE_CLOUD_FOLDER || (import.meta.env.MODE === 'test' ? '' : FOLDER)).trim();

export function cloudConfig(s: { cloudClientId?: string; cloudFolder?: string }): { clientId: string; folder: string } {
  return { clientId: s.cloudClientId?.trim() || DEFAULT_CLOUD_CLIENT_ID, folder: s.cloudFolder?.trim() || DEFAULT_CLOUD_FOLDER };
}
