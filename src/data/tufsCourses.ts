import { Course } from '../types';

// 東京外国語大学の授業データ（世界教養プログラム、春学期、月曜日）
export const tufsCourses: Course[] = [
  {
    id: '19101103',
    name: '専攻言語（ポルトガル語I）',
    professor: 'ピシテリ（PICHITELLI Eliseu）',
    title: 'Portuguese I',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '746',
    semester: '春学期',
    language: '日本語',
    color: '#ffdddd'
  },
  {
    id: '19102304',
    name: '専攻言語（アラビア語I）',
    professor: 'フセイン ハルドゥーン、青山 弘之（Khaldoon HUSSIEN, AOYAMA Hiroyuki）',
    title: 'アラビア語初級会話（読解、聴解）',
    dayOfWeek: 1, // 月曜日
    period: 2,    // 2限
    room: '100',
    semester: '春学期',
    language: 'その他',
    color: '#ddffdd'
  },
  {
    id: '19102305',
    name: '専攻言語（アラビア語I）',
    professor: 'フセイン ハルドゥーン、青山 弘之（Khaldoon HUSSIEN, AOYAMA Hiroyuki）',
    title: 'アラビア語初級会話（読解、聴解）',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '810',
    semester: '春学期',
    language: 'その他',
    color: '#ffffdd'
  },
  {
    id: '19110309',
    name: '専攻言語（中国語II-3）',
    professor: '成田 節、山口 守（NARITA Takashi, YAMAGUCHI Mamoru）',
    title: '中級文法・語彙・表現',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '223',
    semester: '春学期',
    language: '日本語',
    color: '#ddddff'
  },
  {
    id: '19110310',
    name: '専攻言語（中国語II-3）',
    professor: '保坂 律子、山口 守（HOSAKA Yasuhito, YAMAGUCHI Hiroyuki）',
    title: '中級文法・語彙・表現',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '318',
    semester: '春学期',
    language: '日本語',
    color: '#ffddff'
  },
  {
    id: '19110503',
    name: '専攻言語（フランス語II-2）',
    professor: '秋廣 尚恵（AKIHIRO Hisae）',
    title: 'フランス語中級文法I',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '316',
    semester: '春学期',
    language: '日本語',
    color: '#ddffff'
  },
  {
    id: '19110901',
    name: '専攻言語（スペイン語II-1）',
    professor: '喜多田 敏嗣（KITADA Toshitaka）',
    title: 'スペイン語文法',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '100',
    semester: '春学期',
    language: '日本語',
    color: '#ffeecc'
  },
  {
    id: '19110902',
    name: '専攻言語（スペイン語II-1）',
    professor: '松井 健吾（MATSUI Kengo）',
    title: 'スペイン語文法',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '324',
    semester: '春学期',
    language: '日本語',
    color: '#ccffee'
  },
  {
    id: '19111101',
    name: '専攻言語（ギリシャ語II-1）',
    professor: '水沼 修（MIZUNUMA Osamu）',
    title: '地域言語研究（ギリシャ語II-1）',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '329',
    semester: '春学期',
    language: '日本語',
    color: '#eeccff'
  },
  {
    id: '19111307',
    name: '専攻言語（ロシア語II-4）',
    professor: 'コベルニック・ナディヤ（Nadia KOBERNYK）',
    title: '英露ロシア語1',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '225',
    semester: '春学期',
    language: 'その他',
    color: '#ffdddd'
  },
  {
    id: '19111308',
    name: '専攻言語（ロシア語II-4）',
    professor: 'プロホロワ マリア（PROKHOROVA Maria）',
    title: '英露ロシア語2',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '344',
    semester: '春学期',
    language: 'その他',
    color: '#ddffdd'
  },
  {
    id: '19111309',
    name: '専攻言語（ロシア語II-4）',
    professor: 'イズジェーヴァ ジアーナ（Izdeeva Diana）',
    title: 'ロシア語の語文演習',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '212',
    semester: '春学期',
    language: 'その他',
    color: '#ffffdd'
  },
  {
    id: '19111310',
    name: '専攻言語（ロシア語II-4）',
    professor: '渡邉 えりな（WATANABE Erina）',
    title: '英露ロシア語3',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '310',
    semester: '春学期',
    language: 'その他',
    color: '#ddddff'
  },
  {
    id: '19111507',
    name: '専攻言語（中国語II-4）',
    professor: '橋本 雄一（HASHIMOTO Yuichi）',
    title: '会話',
    dayOfWeek: 1, // 月曜日
    period: 3,    // 3限
    room: '218',
    semester: '春学期',
    language: 'その他',
    color: '#ffddff'
  }
];

// 曜日の変換マップ
export const dayMap = {
  '月': 1,
  '火': 2,
  '水': 3,
  '木': 4,
  '金': 5,
  '土': 6,
  '日': 0
};

// 時限の時間帯
export const timeSlots = {
  1: '9:00-10:30',
  2: '10:40-12:10',
  3: '13:00-14:30',
  4: '14:40-16:10',
  5: '16:20-17:50'
};
