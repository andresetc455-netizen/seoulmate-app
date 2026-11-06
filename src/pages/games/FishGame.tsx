// Pesca del día: tocá "¡Pescar!" cuando el indicador está en la zona verde. El centro da un pez dorado.
import { useRef, useState } from 'react';
import { castResult, FISH_CASTS, FISH_POINTS, fishPos, fishZone, type FishCatch, type FishZone } from '../../lib/games3';
import { petDoc } from '../../lib/docs';
import { Cat } from '../../components/Cat';
import { GameIntro, GameResult, GameShell, useFrame } from './GameShell';

const FACE: Record<FishCatch, string> = { dorado: '🐠', pez: '🐟', bota: '🥾' };
const TEXT: Record<FishCatch, string> = { dorado: '¡Pez dorado! +5', pez: '¡Un pescadito! +2', bota: 'Una bota vieja… 0' };

export function FishGame({ onClose }: { onClose: () => void }) {
  const pet = petDoc.get();
  const [phase, setPhase] = useState<'intro' | 'play' | 'over'>('intro');
  const [round, setRound] = useState(0);
  const [cast, setCast] = useState(0);
  const [zone, setZone] = useState<FishZone>(() => fishZone(0));
  const [pos, setPos] = useState(0);
  const [score, setScore] = useState(0);
  const [bucket, setBucket] = useState<FishCatch[]>([]);
  const [last, setLast] = useState<FishCatch | null>(null);
  const t = useRef(0);
  const paused = useRef(false);

  useFrame(
    phase === 'play',
    (dt) => {
      if (paused.current) return;
      t.current += dt;
      setPos(fishPos(t.current, cast));
    },
    [round, cast],
  );

  const pull = () => {
    if (phase !== 'play' || paused.current) return;
    const r = castResult(pos, zone);
    paused.current = true;
    setLast(r);
    setScore((s) => s + FISH_POINTS[r]);
    setBucket((b) => [...b, r]);
    setTimeout(() => {
      paused.current = false;
      setLast(null);
      const n = cast + 1;
      if (n >= FISH_CASTS) return setPhase('over');
      t.current = Math.random() * 2;
      setCast(n);
      setZone(fishZone(n));
    }, 900);
  };
  const start = () => {
    t.current = 0;
    paused.current = false;
    setCast(0);
    setZone(fishZone(0));
    setScore(0);
    setBucket([]);
    setLast(null);
    setPhase('play');
    setRound((r) => r + 1);
  };

  return (
    <GameShell title="Pesca del día" onClose={onClose} score={`${score} 🐟 · ${Math.min(cast + 1, FISH_CASTS)}/${FISH_CASTS}`}>
      <div className="fish-area" data-testid="fish-area">
        <div className="fish-cat">
          <Cat breed={pet.breed} accessory={pet.equipped.accessory} mood={last === 'bota' ? 'wait' : last ? 'eat' : 'idle'} size={110} />
          {last && <div className="fish-catch">{FACE[last]} {TEXT[last]}</div>}
        </div>
        <div className="fish-water" aria-hidden="true">
          🌊
        </div>
        <div className="fish-bar" aria-label="Barra de pesca">
          <div className="fish-zone" style={{ left: `${zone.start * 100}%`, width: `${zone.width * 100}%` }}>
            <span className="fish-gold" />
          </div>
          <div className="fish-marker" style={{ left: `${pos * 100}%` }} />
        </div>
        <button className="btn block fish-btn" onPointerDown={pull} type="button" disabled={phase !== 'play' || !!last} data-testid="fish-pull">
          🎣 ¡Pescar!
        </button>
        <div className="fish-bucket" aria-label="Balde">
          {bucket.map((b, i) => (
            <span key={i}>{FACE[b]}</span>
          ))}
        </div>
      </div>
      {phase === 'intro' && (
        <GameIntro title="Pesca del día 🎣" onStart={start}>
          {pet.name} tiene hambre de pescado fresco. Tocá «¡Pescar!» cuando la marca esté en la zona verde: en el centro dorado sale un pez dorado (5 puntos), en el resto un
          pescadito (2). Afuera… una bota. Son {FISH_CASTS} tiradas y cada vez es más difícil.
        </GameIntro>
      )}
      {phase === 'over' && (
        <div className="game-overlay">
          <GameResult key={round} game="pesca" score={score} detail={`Pescaste ${bucket.filter((b) => b !== 'bota').length} peces (${bucket.filter((b) => b === 'dorado').length} dorados).`} onAgain={start} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
