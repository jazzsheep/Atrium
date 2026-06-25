// Atrium V1 コンテンツ（正本）。brief §6 / spec §4.4。
// 方針: 公開情報の範囲のみ。事実を創作しない。変動情報は [サンプル] 明示。
//       画像は実画像を使わず抽象プレースホルダー（風船・光の図形）。
// `// 要確認` は公開情報での裏取りが甘い箇所（最終文言は本人と詰める前提）。

import type { SectionId } from '../types';

export interface Work {
  title: string;
  year: string;
  desc: string;
  /** 抽象プレースホルダーの種類（実画像は使わない）。 */
  image: 'placeholder-balloon' | 'placeholder-light';
}

export interface Exhibition {
  when: string;
  what: string;
  where: string;
  /** true のとき [サンプル]（ダミー）であることを画面に明示する。 */
  sample: boolean;
}

export interface Channel {
  id: Extract<SectionId, 'commission' | 'contribution' | 'workshop' | 'contact'>;
  label: string;
  desc: string;
}

export const content = {
  // ★公開中の匿名化のため、内容はすべて一般化したサンプル（特定情報は除去）。
  //   実在作家の公開情報に戻す場合はここを差し替える。
  artist: { name: '（作家名）', role: '美術家', note: 'デモ（内容はすべてサンプル）' },

  know: {
    // 知る（家）
    profile:
      '美術家。「空気・水・光」と人との関わり合いをテーマに、形のないものを媒介として作品をつくる。[サンプル]',
    career: [
      '[サンプル] 美術系の大学を卒業',
      '[サンプル] 美術館・福祉施設での創作ワークショップ講師',
      '[サンプル] 近現代思想を学び、美術家として活動を開始',
      '[サンプル] 国内外のアーティスト・イン・レジデンスで研鑽',
    ],
    awards: ['[サンプル] 芸術賞 受賞'],
    statement:
      '「空気・水・光」と人との関わり合いをテーマに、形のないものを媒介として、人と世界・人と人とのつながりを体感させる作品をつくる。',
  },

  visit: {
    // 見に行く（風船）= 作品 ＋ 展示
    works: [
      {
        title: '[サンプル] 大型バルーン状インスタレーション',
        year: '[サンプル]',
        desc: '空気で膨らむ柔らかな器。ホログラム加工で見る角度により色が移ろう。鑑賞者は触れ、中に入り、寝転んで五感で体感する。[サンプル]',
        image: 'placeholder-balloon',
      },
      {
        title: '[サンプル] 柔らかな彫刻',
        year: '[サンプル]',
        desc: '繭を想起させる柔らかな彫刻。内にこもる殻からの脱皮への願いを込める。[サンプル]',
        image: 'placeholder-light',
      },
    ] as Work[],
    exhibitions: [
      {
        when: '[サンプル] 20XX年',
        what: '[サンプル] 五感をめぐるグループ展',
        where: '[サンプル] ○○美術館',
        sample: true,
      },
      {
        when: '[サンプル] 20XX年',
        what: '[サンプル] ○○芸術祭 出展予定',
        where: '[サンプル]',
        sample: true,
      },
    ] as Exhibition[],
  },

  relate: {
    // 関わる（渦）
    channels: [
      { id: 'commission', label: '制作依頼', desc: '展示・空間への作品制作のご相談。' },
      { id: 'contribution', label: '出資', desc: '作品・プロジェクトへのご支援。' },
      { id: 'workshop', label: 'ワークショップ', desc: '体感型ワークショップのご依頼。' },
      { id: 'contact', label: '問い合わせ', desc: 'その他のお問い合わせ。' },
    ] as Channel[],
    links: { website: '#', instagram: '#', x: '#', youtube: '#' }, // [サンプル] ダミー
    formNotice: 'これはデモです。送信は行われません。', // 必須表示
  },
} as const;

export type Content = typeof content;
