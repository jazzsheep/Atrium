// 知る = 草原に建つ家（水彩トーン）。Phase 1 は識別できる素朴な形。仕上げ(Phase 5)で作り込む。
export function House() {
  return (
    <group scale={0.5}>
      {/* 壁（塗り残しの白っぽいクリーム） */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.74, 0.7, 0.74]} />
        <meshStandardMaterial color="#fbf6ea" roughness={1} metalness={0} />
      </mesh>
      {/* 屋根（淡い緑） */}
      <mesh position={[0, 0.86, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.66, 0.5, 4]} />
        <meshStandardMaterial color="#a9c79a" roughness={1} metalness={0} />
      </mesh>
      {/* 窓から漏れる光（カーテン演出の伏線） */}
      <mesh position={[0, 0.42, 0.381]}>
        <planeGeometry args={[0.24, 0.3]} />
        <meshBasicMaterial color="#fff3c9" />
      </mesh>
    </group>
  );
}
