import type { SceneKind } from '../data/mock-data.js';

interface MockSceneProps {
  scene: SceneKind;
  compact?: boolean;
}

export function MockScene({ scene, compact = false }: MockSceneProps) {
  return (
    <div aria-label={`Vista simulada: ${scene}`} className={`mock-scene scene-${scene}`} role="img">
      <div className="scene-sun" />
      <div className="scene-cloud cloud-one" />
      <div className="scene-cloud cloud-two" />
      <div className="scene-building building-one" />
      <div className="scene-building building-two" />
      <div className="scene-building building-three" />
      <div className="scene-ground" />
      <div className="scene-road" />
      <div className="scene-car">
        <span />
        <span />
      </div>
      <div className="scene-person">
        <span />
      </div>
      {!compact && <span className="scene-label">Vista previa simulada</span>}
    </div>
  );
}
