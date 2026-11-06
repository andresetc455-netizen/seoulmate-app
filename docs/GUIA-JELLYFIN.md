# Cine privado con Jellyfin + Tailscale

Guía para ver tus series descargadas desde el celular de ella, en casa o afuera, sin subirlas a internet.
Los archivos quedan en tu computadora; Jellyfin los muestra como una plataforma de streaming privada
(portadas, temporadas, subtítulos y "seguir viendo") y Tailscale crea un túnel privado entre sus dispositivos.

Tiempo estimado: 30–40 minutos. Costo: $0.

> Uso personal: solo para contenido que tengas derecho a ver. No compartas el servidor ni los archivos con terceros.

---

## 1. Ordenar las carpetas (5 min)

Jellyfin reconoce mejor las series si siguen este formato:

```
D:\Series\
  Goblin (2016)\
    Season 01\
      Goblin S01E01.mp4
      Goblin S01E01.srt      ← subtítulos con el mismo nombre (opcional)
      Goblin S01E02.mp4
  Crash Landing on You (2019)\
    Season 01\
      Crash Landing on You S01E01.mkv
```

- Nombre de la serie + año entre paréntesis.
- Episodios con `S01E01`, `S01E02`, …
- Subtítulos `.srt` con el mismo nombre que el video (agregá `.es` para marcarlos en español: `Goblin S01E01.es.srt`).

## 2. Instalar Jellyfin en la computadora (10 min)

1. Descargá el instalador desde **jellyfin.org → Download** (Windows: "Jellyfin Server", Mac: el `.dmg`).
2. Instalalo con las opciones por defecto. En Windows elegí **"Install as a Service"** para que arranque solo.
3. Abrí en el navegador de la computadora: **http://localhost:8096**
4. Asistente inicial:
   - Idioma: Español.
   - Creá **tu usuario administrador** (contraseña segura).
   - **Agregar biblioteca** → Tipo: *Programas* (Shows) → Carpeta: `D:\Series` → Idioma de metadatos: Español, País: Corea del Sur o Argentina.
   - Desmarcá "Permitir acceso remoto" (el acceso de afuera lo hace Tailscale, más seguro).
5. Esperá que termine de escanear: vas a ver las portadas y los episodios.

### Usuario para ella
Panel de control → **Usuarios → +** → nombre "Nicole", contraseña, acceso solo a la biblioteca Series, sin permisos de administración.

### Para que no se corte en el celular
Panel de control → **Reproducción → Transcodificación**: dejalo activado. Si un archivo `.mkv` o un códec no lo soporta el teléfono, Jellyfin lo convierte en el momento.

## 3. Verlo en casa (2 min)

En el celular de ella, con el mismo Wi-Fi:
1. Instalá la app **Jellyfin** (Play Store / App Store).
2. Servidor: `http://IP-DE-TU-PC:8096` (la IP aparece en Panel de control → Panel principal, ej. `192.168.0.25`).
3. Entrá con el usuario "Nicole".

## 4. Verlo desde afuera con Tailscale (10 min)

1. Creá una cuenta gratis en **tailscale.com** (con Google o Microsoft).
2. Instalá Tailscale en **tu computadora** y en **el celular de ella**, e iniciá sesión con la **misma cuenta** en los dos.
3. En la computadora, abrí la app de Tailscale y anotá el nombre de la máquina (ej. `pc-andres`).
4. Para tener un enlace **https** (lo necesita Seoulmate para abrirlo con un toque), en la computadora abrí una terminal y ejecutá:

   ```
   tailscale serve --bg 8096
   ```

   Te muestra una dirección como `https://pc-andres.tail1234.ts.net`. Esa dirección **solo funciona** en dispositivos conectados a tu Tailscale: para el resto de internet no existe.
5. En la app Jellyfin del celular, agregá ese servidor. Con Tailscale activado en el teléfono, funciona en cualquier lugar (datos móviles incluidos).

> La computadora tiene que estar prendida y sin suspenderse. En Windows: Configuración → Sistema → Energía → Suspender: *Nunca* (al menos mientras miran).

## 5. Conectarlo con Seoulmate

En **K-Drama Diary → editar drama → "Dónde verlo"** pegá el enlace del drama en Jellyfin:
1. Abrí el drama en Jellyfin desde el navegador (`https://pc-andres.tail1234.ts.net`).
2. Copiá la dirección de esa página y pegala en "Dónde verlo".
3. En Seoulmate aparece el botón **"Ver en pc-andres…"** que lo abre directo.

Para capítulos que ella ya tenga **descargados en el celular**, no hace falta nada de esto:
en el detalle del drama → **"Elegir capítulos"**. Se reproducen desde el teléfono, con subtítulos `.srt`,
y Seoulmate recuerda el capítulo y el minuto donde quedó.

## Problemas comunes

| Problema | Solución |
| --- | --- |
| La app no encuentra el servidor en casa | Firewall de Windows: permitir "Jellyfin Server" en redes privadas. |
| Desde afuera no conecta | Tailscale activado en los dos dispositivos y la PC prendida. |
| Se ve sin portadas | Revisar nombres de carpetas (paso 1) → Biblioteca → "Escanear todas las bibliotecas". |
| Se traba | Bajar la calidad en el reproductor de Jellyfin (ícono de engranaje → Calidad 4 Mbps). |
| Subtítulos no aparecen | Mismo nombre que el video y extensión `.srt`; en el reproductor elegí la pista de subtítulos. |
