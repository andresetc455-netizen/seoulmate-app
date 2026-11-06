// Puntero láser: mové el punto rojo; el gatito lo persigue. Sumás puntos mientras juega cerca, pero que no lo atrape.
import { useRef, useState } from 'react';
import { LASER_NEAR, LASER_SECONDS, laserFinalScore, moveDot, newLaser, stepLaser, type LaserState } from '../../lib/games3';
import { petDoc } from '../../lib/docs';
import { Cat } from '../../components/Cat';
import { GameIntro, GameResult, GameShell, useFrame } from './GameShell';

export function LaserGame({ onClose }: { onClose: () => void }) {
  const pet = petDoc.get();
  const [phase, setPhase] = useState<'intro' | 'play' | 'over'>('intro');
  const [round, setRound] = useState(0);
  const [view, setView] = useState<LaserState>(newLaser);
  const st = useRef<LaserState>(view);
  const area = useRef<HTMLDivElement>(null);

  useFrame(
    phase === 'play',
    (dt) => {
      st.current = stepLaser(st.current, dt);
      setView(st.current);
      if (st.current.over) setPhase('over');
    },
    [round],
  );

  const follow = (e: React.PointerEvent) => {
    const r = area.current?.getBoundingClientRect();
    if (!r || phase !== 'play') return;
    st.current = moveDot(st.current, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };
  const start = () => {
    st.current = newLaser();
    setView(st.current);
    setPhase('play');
    setRound((n) => n + 1);
  };
  const near = Math.hypot(view.dot.x - view.cat.x, view.dot.y - view.cat.y) <= LASER_NEAR;
  const final = laserFinalScore(view);

  return (
    <GameShell title="Puntero láser" onClose={onClose} score={`${Math.round(view.score / 10)} ✨ · ${'❤️'.repeat(Math.max(0, view.lives))} · ${Math.max(0, Math.ceil(LASER_SECONDS - view.t))} s`}>
      <div className="laser-area" ref={area} data-testid="laser-area" onPointerDown={follow} onPointerMove={follow}>
        <div className="laser-cat" style={{ left: `${view.cat.x * 100}%`, top: `${view.cat.y * 100}%` }}>
          <Cat breed={pet.breed} accessory={pet.equipped.accessory} mood={near ? 'play' : 'idle'} size={80} />
        </div>
        <div className={`laser-dot ${near ? 'near' : ''}`} style={{ left: `${view.dot.x * 100}%`, top: `${view.dot.y * 100}%` }} aria-hidden="true" />
        {phase === 'play' && <div className="laser-hint">{view.grace > 0 ? '¡Lo atrapó! −1 ❤️' : near ? '¡Está jugando! ✨' : 'Acercale el punto…'}</div>}
      </div>
      {phase === 'intro' && (
        <GameIntro title="Puntero láser 🔴" onStart={start}>
          Arrastrá el dedo para mover el punto rojo. {pet.name} lo persigue: mientras esté cerca sumás puntos, pero si lo atrapa perdés una vida (tenés 3). Cada vez corre más rápido. Aguantá {LASER_SECONDS} segundos para un bonus.
        </GameIntro>
      )}
      {phase === 'over' && (
        <div className="game-overlay">
          <GameResult key={round} game="laser" score={final} detail={view.caught ? `¡${pet.name} atrapó el punto 3 veces!` : '¡Aguantaste hasta el final! +10'} onAgain={start} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
