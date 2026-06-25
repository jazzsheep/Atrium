import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';
import type { PlaceId } from '../types';

// 入り/戻り演出の共有信号。Scene が毎フレーム書き、各モチーフ・カメラが読む（再レンダーを起こさない）。
export interface TransitionState {
  /** 入り具合 0=ハブで休止 〜 1=場所の中。 */
  closeness: number;
  /** いま入る/出る対象の場所。 */
  active: PlaceId | null;
  entering: boolean;
  returning: boolean;
}

export const TransitionContext =
  createContext<MutableRefObject<TransitionState> | null>(null);

export function useTransition(): MutableRefObject<TransitionState> {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('TransitionContext is missing');
  return ctx;
}
