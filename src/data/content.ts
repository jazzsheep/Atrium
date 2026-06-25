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
  artist: { name: '奥中章人', role: '美術家', note: '公開情報に基づく提案デモ' },

  know: {
    // 知る（家）
    profile:
      '美術家。1981年京都府生まれ、同地在住。あおいおあ（AO Institute of Arts）共同代表。',
    career: [
      '静岡大学教育学部 卒業',
      '静岡県立美術館・知的障害者の社会福祉施設で美術あそびの講師',
      '近現代の思想を学び、美術家として活動を開始',
      'フランス・韓国・中国のアーティスト・イン・レジデンスで長期研修',
    ],
    awards: [
      '2023年 清流の国ぎふ芸術祭 ArtAward IN THE CUBE 北村明子賞・寺内曜子賞 W受賞',
    ],
    statement:
      '「空気・水・光」と人との関わり合いをテーマに、形のないものを媒介として、人と世界・人と人とのつながりを体感させる作品をつくる。（ブルーノ・ラトゥールらの近現代思想の影響）', // 要確認
  },

  visit: {
    // 見に行く（風船）= 作品 ＋ 展示
    works: [
      {
        title: 'INTER-WORLD/SPHERE: Relation of Air, Water, Light and Us',
        year: '2022',
        desc: '最大直径12mのバルーン状インスタレーション。ホログラム加工により見る角度で色が移ろい、内部に水枕を備える。鑑賞者は触れ、中に入り、寝転んで五感で体感する。',
        image: 'placeholder-balloon',
      },
      {
        title: 'Cocooner',
        year: '', // 要確認
        desc: '繭に引きこもる人を想起させる柔らかな彫刻。人間中心主義という繭からの脱皮への願いを込める。',
        image: 'placeholder-light',
      },
    ] as Work[],
    exhibitions: [
      {
        when: '2024年10月〜2025年3月',
        what: 'Synesthesia ーアートで交わる五感ー 展',
        where: 'WHAT MUSEUM（東京・天王洲）',
        sample: false,
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
