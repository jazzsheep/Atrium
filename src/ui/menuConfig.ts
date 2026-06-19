import type { PlaceId, SectionId } from '../types';

// 文字メニューの2階層構成（brief §5）。小項目はセクション単位（個別作品名は出さない）。
export interface MenuGroup {
  place: PlaceId;
  label: string;
  sections: { id: SectionId; label: string }[];
}

export const MENU: MenuGroup[] = [
  {
    place: 'know',
    label: '知る',
    sections: [
      { id: 'career', label: '経歴' },
      { id: 'statement', label: '理念' },
    ],
  },
  {
    place: 'visit',
    label: '見に行く',
    sections: [
      { id: 'works', label: '作品' },
      { id: 'exhibitions', label: '展示' },
    ],
  },
  {
    place: 'relate',
    label: '関わる',
    sections: [
      { id: 'commission', label: '制作依頼' },
      { id: 'contribution', label: '出資' },
      { id: 'workshop', label: 'ワークショップ' },
      { id: 'contact', label: '問い合わせ' },
    ],
  },
];
