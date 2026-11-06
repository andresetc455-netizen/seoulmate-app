# Capítulos en la nube con OneDrive

Ella mira desde Seoulmate (**K-Drama Diary → En la nube**) los capítulos que guardes en una carpeta de tu OneDrive,
en streaming y sin descargarlos. Solo ve **esa carpeta**: el resto de tu OneDrive nunca le llega, porque la app
entra con la cuenta de ella y con permiso de solo lectura.

Tiempo: unos 20 minutos, una sola vez. Costo: $0 (más el espacio de OneDrive que uses).

> Uso personal y privado: compartí la carpeta solo con ella (nunca "Cualquier persona con el vínculo").

---

## Parte 1 · La carpeta (en la cuenta de OneDrive donde guardás los capítulos)

1. Entrá a **onedrive.live.com** con esa cuenta.
2. Creá una carpeta **Seoulmate** y adentro **una carpeta por drama**:

   ```
   Seoulmate/
     Goblin/
       Goblin S01E01.mp4
       Goblin S01E01.srt     ← subtítulos opcionales, mismo nombre que el video
       Goblin S01E02.mp4
     Crash Landing on You/
       CLOY Ep 01.mp4
   ```

   - Usá **MP4** (H.264): es lo que reproducen todos los teléfonos, iPhone incluido. MKV no funciona en iPhone.
   - El número de capítulo se detecta del nombre (`S01E05`, `Ep 5`, `Capítulo 5`, `05`).
   - Para subir muchos archivos conviene la app **OneDrive** de la computadora (arrastrar a la carpeta y se sincroniza sola).
3. **Compartir solo con ella**: clic derecho en **Seoulmate → Compartir**.
   - En la configuración del vínculo elegí **"Personas específicas"** (o "Solo las personas que elijas").
   - Escribí **el correo de la cuenta de Microsoft de ella** (si no tiene, que cree una gratis en outlook.com).
   - Permiso: **Puede ver** (no "Puede editar").
   - **Copiar vínculo** → ese enlace lo vas a pegar en Seoulmate (Parte 3).

## Parte 2 · Registrar Seoulmate en Microsoft (para obtener el "ID de la app")

Es lo que permite que la app le pida a Microsoft permiso de lectura a nombre de ella. Se hace con cualquier cuenta de Microsoft.

1. Entrá a **entra.microsoft.com** (o **portal.azure.com** → "Microsoft Entra ID").
   - Si Microsoft pide crear una cuenta de Azure para registrar aplicaciones, creala con la opción gratuita.
2. **Aplicaciones → Registros de aplicaciones → Nuevo registro**.
   - Nombre: `Seoulmate`.
   - Tipos de cuenta: **"Cuentas en cualquier directorio organizativo y cuentas personales de Microsoft"**.
   - URI de redirección: plataforma **"Aplicación de página única (SPA)"** y la dirección
     `https://genuine-melba-73ecce.netlify.app/`
3. **Registrar**. En la página que aparece, copiá el **"Id. de aplicación (cliente)"** (formato `1234abcd-…`).
   No es una contraseña: se puede pegar tranquilo.
4. **Permisos de API → Agregar un permiso → Microsoft Graph → Permisos delegados** → marcá **Files.Read.All** → Agregar.
5. (Opcional) En **Autenticación**, agregá también `https://genuine-melba-73ecce.netlify.app/index.html` como URI de redirección.

## Parte 3 · Conectar Seoulmate

1. En el teléfono de ella (o en el tuyo, si cargás vos la configuración antes de regalarlo):
   **Ajustes → En la nube (OneDrive)** → pegá el **ID de la app** y el **enlace de la carpeta** → Guardar.
2. **K-Drama Diary → En la nube → Entrar con Microsoft** → ella entra con **su** cuenta y acepta el permiso de lectura.
3. Aparecen los dramas. Toca uno, elige el capítulo y se reproduce. Seoulmate recuerda el minuto y pasa solo al siguiente.

Cuando subas capítulos nuevos, aparecen al tocar **↻ Actualizar**.

## Problemas comunes

| Problema | Solución |
| --- | --- |
| "Esta cuenta no tiene acceso a la carpeta" | La carpeta no está compartida con el correo con el que entró ella. Revisá la Parte 1, paso 3. |
| La ventana de Microsoft no abre (iPhone, app instalada) | La app usa redirección: después de entrar vuelve sola a Seoulmate. Si pide la contraseña de Seoulmate, ingresala y abrí de nuevo "En la nube". |
| Error de "redirect URI" al entrar | La URI de la Parte 2 tiene que ser exactamente `https://genuine-melba-73ecce.netlify.app/` y de tipo SPA. |
| "Este teléfono no puede reproducir este formato" | Convertí el video a MP4 (H.264), por ejemplo con HandBrake (gratis). |
| No aparecen los subtítulos | El `.srt` tiene que tener el mismo nombre que el video (se acepta `.es.srt`). |
| Se corta o tarda | Depende de la conexión: con datos móviles conviene Wi-Fi o videos de 720p. |
