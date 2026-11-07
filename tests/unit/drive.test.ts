import { describe, expect, it } from 'vitest';
import { buildLibrary, directMediaUrl, folderIdFrom, isDriveLink, isValidClientId } from '../../src/lib/drive';

describe('Google Drive', () => {
  it('lee el ID de la carpeta desde el enlace y valida la llave', () => {
    expect(folderIdFrom('https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp?usp=sharing')).toBe('1AbCdEfGhIjKlMnOp');
    expect(isDriveLink('https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp')).toBe(true);
    expect(isDriveLink('https://evil.example/drive/folders/1AbCdEfGhIjKlMnOp')).toBe(false);
    expect(isValidClientId('123-abc.apps.googleusercontent.com')).toBe(true);
    expect(isValidClientId('0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b')).toBe(false);
    expect(directMediaUrl('f1', 't k')).toBe('https://www.googleapis.com/drive/v3/files/f1?alt=media&access_token=t%20k');
  });
  it('una subcarpeta por drama, capítulos ordenados y subtítulos unidos', () => {
    const lib = buildLibrary(
      [{ id: 'g', name: 'Goblin (2016)', mimeType: 'application/vnd.google-apps.folder' }],
      {
        g: [
          { id: 'e2', name: 'Goblin E02.mp4', mimeType: 'video/mp4' },
          { id: 'e1', name: 'Goblin E01.mp4', mimeType: 'video/mp4' },
          { id: 's1', name: 'Goblin E01.es.srt', mimeType: 'application/x-subrip' },
        ],
      },
    );
    expect(lib).toHaveLength(1);
    expect(lib[0].name).toBe('Goblin');
    expect(lib[0].episodes.map((e) => [e.id, e.subId ?? null])).toEqual([['e1', 's1'], ['e2', null]]);
  });
});
