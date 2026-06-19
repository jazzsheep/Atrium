// Atrium V1 の型。ここに「V2 の継ぎ目（intent + focus 契約）」を概念として保持する。
// 仕様: atrium-spec.md §3.5 / brief §8。
//   V2 の対話アバターは { reply, intent, focus } を返し、focus が入場処理（enter）を呼ぶ。
//   V1 では LLM を持たないが、「場所/セクションの指定」をこの契約で表現できる形にしておく。

/** 3つの場所（情報の大項目）。ハブは場所ではない（中身を持たない出発点）。 */
export type PlaceId = 'know' | 'visit' | 'relate';

/** 対話から読み取る用件（3目的）。V2 で使う。V1 では型として保持するのみ。 */
export type Intent = PlaceId | null;

/** 各場所のセクション（文字メニューの小項目に対応。個別作品名は出さない）。 */
export type KnowSection = 'career' | 'statement';
export type VisitSection = 'works' | 'exhibitions';
export type RelateSection = 'commission' | 'contribution' | 'workshop' | 'contact';
export type SectionId = KnowSection | VisitSection | RelateSection;

/** 移動・表示の対象。enter() はこの focus を受け取る唯一の入場処理。 */
export interface Focus {
  place: PlaceId;
  /** セクション指定。null/未指定なら場所の先頭から。 */
  section?: SectionId | null;
}

/**
 * 〔V2〕対話アバターとUIの契約。V1 では実装しないが、型として保持する。
 * focus が V1 で一本化した入場処理（enter）を呼ぶ想定。
 */
export interface AgentResponse {
  reply: string;
  intent: Intent;
  focus: Focus | null;
}
