import { create } from 'zustand';
import type { Focus, PlaceId, SectionId } from '../types';

// Atrium V1 の状態と「入場処理／戻り処理の一本化」。
// 最重要の継ぎ目（brief §4 / spec §3.3）:
//   enter() と returnToHub() を独立した処理として一本化し、
//   (1)タップ (2)メニュー (3)〔V2〕対話 のすべてがこれを呼ぶ。経路ごとに別実装にしない。

/** 演出の進行状態。 */
export type Phase = 'opening' | 'idle' | 'entering' | 'inside' | 'returning';

/** 今いる場所。ハブ（中身なしの出発点）か、3場所のいずれか。 */
export type Location = 'hub' | PlaceId;

/** 演出の秒数（上限の枠を守る）。brief §7: オープニング〜3秒／入り・戻り1〜2秒。 */
export const TIMING = {
  opening: 2600,
  enter: 1400,
  enterFromMenu: 1100, // メニュー経由は短くテンポよく
  return: 1200,
} as const;

interface AtriumState {
  /** オープニングを見たか（初回のみ再生。メモリ保持＝リロードで初期化）。 */
  hasSeenOpening: boolean;
  phase: Phase;
  location: Location;
  /** いま中央に寄っている／対象になっている場所（「寄せる→中央タップで入る」用）。 */
  focusedPlace: PlaceId | null;
  /** 開いているセクション（小項目選択時）。null は先頭から。 */
  activeSection: SectionId | null;
  /** 文字メニュー（スマホのドロワー等）の開閉。 */
  menuOpen: boolean;

  // ---- 一本化した処理（全経路がこれを呼ぶ）----
  /** 唯一の入場処理。focus（場所＋任意のセクション）を受け取る。 */
  enter: (focus: Focus, opts?: { fromMenu?: boolean }) => void;
  /** 唯一の戻り処理（ホームボタンも「閉じて戻る」も同じ）。 */
  returnToHub: () => void;

  // ---- 補助 ----
  /** 場所を中央へ寄せる（最初のタップ）。入場はしない。 */
  focusPlace: (place: PlaceId | null) => void;
  /** オープニング完了 → ハブで操作可能に。 */
  completeOpening: () => void;
  setMenuOpen: (open: boolean) => void;
}

// 演出のフェーズ遷移に使うタイマー（重複時はクリア）。
let phaseTimer: ReturnType<typeof setTimeout> | null = null;
const clearPhaseTimer = () => {
  if (phaseTimer) {
    clearTimeout(phaseTimer);
    phaseTimer = null;
  }
};

export const useAtrium = create<AtriumState>((set, get) => ({
  hasSeenOpening: false,
  phase: 'opening',
  location: 'hub',
  focusedPlace: null,
  activeSection: null,
  menuOpen: false,

  completeOpening: () => set({ hasSeenOpening: true, phase: 'idle' }),

  focusPlace: (place) => {
    // 巡れるのは idle のときだけ（演出中は無視）。
    if (get().phase !== 'idle') return;
    set({ focusedPlace: place });
  },

  enter: (focus, opts) => {
    clearPhaseTimer();
    const dur = opts?.fromMenu ? TIMING.enterFromMenu : TIMING.enter;
    // 入り演出 → 中身パネル。location/section を確定し、演出後に inside へ。
    set({
      phase: 'entering',
      location: focus.place,
      focusedPlace: focus.place,
      activeSection: focus.section ?? null,
      menuOpen: false,
    });
    phaseTimer = setTimeout(() => set({ phase: 'inside' }), dur);
  },

  returnToHub: () => {
    clearPhaseTimer();
    set({ phase: 'returning', menuOpen: false });
    phaseTimer = setTimeout(
      () =>
        set({
          phase: 'idle',
          location: 'hub',
          activeSection: null,
          focusedPlace: null,
        }),
      TIMING.return,
    );
  },

  setMenuOpen: (open) => set({ menuOpen: open }),
}));
