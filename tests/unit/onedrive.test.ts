import { describe, expect, it } from 'vitest';
import { encodeShareUrl, isShareLink, isValidClientId, toEpisodes } from '../../src/lib/onedrive';

describe('OneDrive', () => {
  it('codifica el enlace compartido como pide Microsoft Graph', () => {
    // Ejemplo de la documentación de Microsoft.
    expect(encodeShareUrl('https://onedrive.live.com/redir?resid=1231244193912!12&authKey=1201919!12921!1')).toBe(
      'u!aHR0cHM6Ly9vbmVkcml2ZS5saXZlLmNvbS9yZWRpcj9yZXNpZD0xMjMxMjQ0MTkzOTEyITEyJmF1dGhLZXk9MTIwMTkxOSExMjkyMSEx',
    );
  });
  it('valida enlaces e ID de la app', () => {
    expect(isShareLink('https://1drv.ms/f/s!AbCdEf')).toBe(true);
    expect(isShareLink('https://evil.example/1drv.ms')).toBe(false);
    expect(isValidClientId('0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b')).toBe(true);
    expect(isValidClientId('mi-contraseña')).toBe(false);
  });
  it('arma los capítulos ordenados y une cada subtítulo con su video', () => {
    const eps = toEpisodes(
      [
        { id: 'b', name: 'Goblin S01E02.mp4', size: 10, file: { mimeType: 'video/mp4' } },
        { id: 'a', name: 'Goblin S01E01.mp4', size: 10, file: { mimeType: 'video/mp4' } },
        { id: 's', name: 'Goblin S01E01.es.srt', file: { mimeType: 'application/octet-stream' } },
        { id: 'f', name: 'Extras', folder: { childCount: 1 } },
      ],
      'drive1',
    );
    expect(eps.map((e) => [e.id, e.ep, e.subId ?? null])).toEqual([
      ['a', 1, 's'],
      ['b', 2, null],
    ]);
    expect(eps[0].driveId).toBe('drive1');
  });
});
