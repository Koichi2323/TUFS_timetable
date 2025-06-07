import { Course } from '../types';

// 色の定義
const COLORS = {
  RED: '#F25B4D',
  LIGHT_BLUE: '#7FADE6',
  BLUE: '#1D4E89',
  DARK_NAVY: '#0B2542',
  PINK: '#D98BAF',
  MAGENTA: '#A13D73',
  PURPLE: '#701D4F',
  GREY: '#AAAAAA',
  INTERNATIONAL_BLUE: '#4A90E2', // 国際日本学部用
  DEFAULT: '#A0A0A0',
};

export const getCourseColor = (course: Course): string => {
  const name = course.name?.toLowerCase() || '';
  const faculty = course.faculty?.toLowerCase() || '';
  const category = course.category?.toLowerCase() || ''; // フォルダ名に基づくカテゴリ
  const department = course.department?.toLowerCase() || '';

  // 大学院 (授業名やカテゴリ、学部名に「大学院」が含まれるか)
  if (name.includes('大学院') || faculty.includes('大学院') || category.includes('大学院') || department.includes('大学院')) {
    return COLORS.GREY;
  }

  // 国際日本学部 (学部名、カテゴリ名、学科名に「国際日本」が含まれるか)
  if (faculty.includes('国際日本') || category.includes('国際日本') || department.includes('国際日本') || name.includes('国際日本')) {
    return COLORS.INTERNATIONAL_BLUE;
  }

  // 専攻言語、教養外国語
  // カテゴリ名が「専攻言語」または「教養外国語」の場合
  if (category === '専攻言語' || category === '教養外国語') {
    return COLORS.RED;
  }
  // 授業名にキーワードが含まれる場合（より曖昧な判定）
  if (name.includes('専攻言語') || name.includes('教養外国語')) {
    return COLORS.RED;
  }
  // 特定の言語名が含まれ、かつカテゴリが関連する場合
  const languageKeywords = ['英語', '中国語', '韓国語', '朝鮮語', 'スペイン語', 'フランス語', 'ドイツ語', 'ロシア語', 'アラビア語', 'イタリア語', 'ポルトガル語'];
  if (languageKeywords.some(lang => name.includes(lang)) && 
      (category.includes('言語') || category.includes('外国語') || faculty.includes('言語') || faculty.includes('外国語'))) {
     return COLORS.RED;
  }

  // 言語文化学部
  if (faculty.includes('言語文化') || category.includes('言語文化') || department.includes('言語文化')) {
    if (name.includes('導入') || category.includes('導入')) return COLORS.LIGHT_BLUE;
    if (name.includes('概論') || category.includes('概論')) return COLORS.BLUE;
    if (name.includes('専門') || category.includes('専門')) return COLORS.DARK_NAVY;
    return COLORS.BLUE; // デフォルトで概論の色
  }

  // 国際社会学部
  if (faculty.includes('国際社会') || category.includes('国際社会') || department.includes('国際社会')) {
    if (name.includes('導入') || category.includes('導入')) return COLORS.PINK;
    if (name.includes('概論') || category.includes('概論')) return COLORS.MAGENTA;
    if (name.includes('専門') || category.includes('専門')) return COLORS.PURPLE;
    return COLORS.MAGENTA; // デフォルトで概論の色
  }
  
  return COLORS.DEFAULT;
};
