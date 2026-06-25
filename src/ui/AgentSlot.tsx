// V2 の継ぎ目(c): 画面内に「対話アバター（案内人）」の将来の居場所を見込んでおく（brief §8 / §9.1 C）。
// V1 では対話は実装しない。ここは“席”を確保するだけの控えめなプレースホルダー。
export function AgentSlot() {
  return (
    <div className="agent-slot" aria-hidden>
      <div className="agent-slot-orb" />
      <div className="agent-slot-text">
        <strong>案内人</strong>
        <span>対話でご案内（準備中）</span>
      </div>
    </div>
  );
}
