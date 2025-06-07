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
  },
  // 2025年度 月曜1限の授業データ（JSONファイルから追加）
  {
    id: '19112501',
    name: '専攻言語（英語Ⅰ-1）',
    professor: '須田　祐子　[SUDA Yuko]',
    title: 'Regional Language A/English I',
    dayOfWeek: 1, // 月曜日
    period: 1,    // 1限
    room: '１０４',
    semester: '春学期',
    language: '英語 一部日本語を含む',
    color: '#ffcccc',
    syllabusUrl: 'https://gakumu-web1.tufs.ac.jp/Portal/Public/Syllabus/DetailMain.aspx?lct_year=2025&lct_cd=19112501'
  },
  {
    id: '19121519',
    name: '専攻言語（中国語Ⅲ-5）',
    professor: '史　東陽　[SHI Dongyang]',
    title: '地域言語A（中国語Ⅲ-5）文章表現',
    dayOfWeek: 1, // 月曜日
    period: 1,    // 1限
    room: '１０３',
    semester: '春学期',
    language: 'その他',
    color: '#ccffcc',
    syllabusUrl: 'https://gakumu-web1.tufs.ac.jp/Portal/Public/Syllabus/DetailMain.aspx?lct_year=2025&lct_cd=19121519'
  },
  {
    id: '19132528',
    name: '専攻言語（ﾋﾝﾃﾞｨｰ語Ⅲ-3）',
    professor: 'ミッシュル　リシケーシュ　[MISHRA Rishikesh]',
    title: 'ヒンディー語 III-3 (総合C)',
    dayOfWeek: 1, // 月曜日
    period: 1,    // 1限
    room: '３３０',
    semester: '春学期',
    language: 'その他',
    color: '#ccccff',
    syllabusUrl: 'https://gakumu-web1.tufs.ac.jp/Portal/Public/Syllabus/DetailMain.aspx?lct_year=2025&lct_cd=19132528'
  },
  {
    id: '19133301',
    name: '日本語総合-1',
    professor: '相場　いぶき, 廣居　美樹, 水信　渉, 良永　朋実　[AIBA Ibuki, HIROI Miki, MIZUSHINA Wataru, YOSHINAGA Tomomi]',
    title: '初級1総合日本語101',
    dayOfWeek: 1, // 月曜日
    period: 1,    // 1限
    room: '留日３０７',
    semester: '春学期',
    language: '日本語',
    color: '#ffccff',
    syllabusUrl: 'https://gakumu-web1.tufs.ac.jp/Portal/Public/Syllabus/DetailMain.aspx?lct_year=2025&lct_cd=19133301'
  },
  {
    id: '19133303',
    name: '日本語総合-2',
    professor: '良永　朋実, 沖本　与子, 早矢仕　香, 相場　いぶき　[YOSHINAGA Tomomi, OKIMOTO Tomoko, HAYASHI Kaori, AIBA Ibuki]',
    title: '初級2　総合日本語201a',
    dayOfWeek: 1, // 月曜日
    period: 1,    // 1限
    room: '留日３０８',
    semester: '春学期',
    language: '日本語',
    color: '#ffffcc',
    syllabusUrl: 'https://gakumu-web1.tufs.ac.jp/Portal/Public/Syllabus/DetailMain.aspx?lct_year=2025&lct_cd=19133303'
  },
  {
    id: '19133305',
    name: '日本語総合-3',
    professor: '韓　金柱, 大木　理恵, 城戸　寿美子, 中島　久朱　[KAN KIN CHU, OOKI　Rie, KIDO Sumiko, NAKAJIMA Kusu]',
    title: '中級1総合日本語301a',
    dayOfWeek: 1, // 月曜日
    period: 1,    // 1限
    room: '留日２１３',
    semester: '春学期',
    language: '日本語',
    color: '#ccffff',
    syllabusUrl: 'https://gakumu-web1.tufs.ac.jp/Portal/Public/Syllabus/DetailMain.aspx?lct_year=2025&lct_cd=19133305'
  },
  {
    id: '19133307',
    name: '日本語総合-4',
    professor: '嶋原　耕一, 前田　真紀, 熊田　道子, 韓　金柱, 石田　恵里子　[SHIMAHARA Koichi, MAEDA Maki, KUMADA Michiko, KAN KIN CHU, ISHIDA Eriko]',
    title: '中級2総合日本語401a',
    dayOfWeek: 1, // 月曜日
    period: 1,    // 1限
    room: '留日２１４',
    semester: '春学期',
    language: '日本語',
    color: '#ffdddd',
    syllabusUrl: 'https://gakumu-web1.tufs.ac.jp/Portal/Public/Syllabus/DetailMain.aspx?lct_year=2025&lct_cd=19133307'
  },
  {
    id: '19133309',
    name: '日本語総合-5',
    professor: '伊達　宏子, 中島　久朱, 福島　佐知, 前田　真紀, 水信　渉　[DATE Hiroko, NAKAJIMA Kusu, FUKUSHIMA Sachi, MAEDA Maki, MIZUSHINA Wataru]',
    title: '中上級総合日本語501a',
    dayOfWeek: 1, // 月曜日
    period: 1,    // 1限
    room: '留日２１５',
    semester: '春学期',
    language: '日本語',
    color: '#ddffdd',
    syllabusUrl: 'https://gakumu-web1.tufs.ac.jp/Portal/Public/Syllabus/DetailMain.aspx?lct_year=2025&lct_cd=19133309'
  },
  {
    id: '19133311',
    name: '日本語総合-6',
    professor: '赤桐　敦, 早矢仕　香, 石澤　徹　[AKAGIRI Atsushi, HAYASHI Kaori, ISHIZAWA Toru]',
    title: '上級1総合日本語601a',
    dayOfWeek: 1, // 月曜日
    period: 1,    // 1限
    room: '留日２１６',
    semester: '春学期',
    language: '日本語',
    color: '#ffffdd',
    syllabusUrl: 'https://gakumu-web1.tufs.ac.jp/Portal/Public/Syllabus/DetailMain.aspx?lct_year=2025&lct_cd=19133311'
  },
  {
    id: '19133330',
    name: '日本語技能-聴解7',
    professor: '早矢仕　香　[HAYASHI Kaori]',
    title: '上級2聴解713',
    dayOfWeek: 1, // 月曜日
    period: 1,    // 1限
    room: '留日２１７',
    semester: '春学期',
    language: '日本語',
    color: '#ddddff',
    syllabusUrl: 'https://gakumu-web1.tufs.ac.jp/Portal/Public/Syllabus/DetailMain.aspx?lct_year=2025&lct_cd=19133330'
  },
  {
    id: '19160068',
    name: '中東地域基礎2',
    professor: '青山　弘之　[AOYAMA Hiroyuki]',
    title: '中東／西アジア・北アフリカ地域基礎（アラブ地域）',
    dayOfWeek: 1, // 月曜日
    period: 1,    // 1限
    room: '１０２',
    semester: '春学期',
    language: '日本語',
    color: '#ffddff',
    syllabusUrl: 'https://gakumu-web1.tufs.ac.jp/Portal/Public/Syllabus/DetailMain.aspx?lct_year=2025&lct_cd=19160068'
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
