import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Linking, TextInput as RNTextInput } from 'react-native';
import { Text, Card, Searchbar, Chip, Button, useTheme, ActivityIndicator, Menu, Divider, TextInput, Modal, Portal, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Course } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';
import { useSyllabus } from '../../contexts/SyllabusContext';

// ローカルデータ管理を使用 (コメントアウト)
// import { getCoursesFromLocalStorage, searchCoursesLocally, filterCoursesLocally, saveCoursesToLocalStorage } from '../../utils/localDataManager';
// 曜日別の授業データをインポート (コメントアウト)
// import { allCourses, coursesByDayMap } from '../../data/coursesByDay';

type CoursesScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const CoursesScreen = ({ navigation, toggleTheme, isDarkMode }: CoursesScreenProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('すべて');
  const [periodFilter, setPeriodFilter] = useState('すべて');
  const [semesterFilter, setSemesterFilter] = useState('すべて'); // This will be "開講学期"
  const [languageFilter, setLanguageFilter] = useState('すべて');
  const [academicYearFilter, setAcademicYearFilter] = useState('すべて'); // New: Academic Year
  
  // フィルターモーダル用の状態
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [semesterModalVisible, setSemesterModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [academicYearModalVisible, setAcademicYearModalVisible] = useState(false); // New: Academic Year Modal
  
  // スナックバー用の状態
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // スケジュールコンテキストを使用
  const { addCourse, isCourseAdded, removeCourse, hasTimeConflict } = useSchedule();
  const { syllabusCourses, isLoading: syllabusLoading, error: syllabusError } = useSyllabus();
  const searchbarInputRef = useRef<RNTextInput | null>(null);
  
  const theme = useTheme();

  // Filter options
  const dayOptions = ['すべて', '月曜', '火曜', '水曜', '木曜', '金曜'];
  const periodOptions = ['すべて', '1限', '2限', '3限', '4限', '5限'];
  const semesterOptions = ['すべて', '春学期', '秋学期', '通年']; // Options for "開講学期"
  const languageOptions = ['すべて', '日本語', '英語', 'その他'];
  const academicYearOptions = ['すべて', '2025年度']; // New: Academic Year Options - Filtered to 2025 only
  
  // 曜日と曜日インデックスのマッピング
  const dayNameToIndex = {
    '月曜': 0,
    '火曜': 1,
    '水曜': 2,
    '木曜': 3,
    '金曜': 4
  };

  useEffect(() => {
    loadCourses();
  }, [syllabusCourses]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      
      if (syllabusLoading) {
        // SyllabusContextがまだロード中なら待機
        return;
      }

      if (syllabusError) {
        console.error('Syllabusデータ読み込みエラー:', syllabusError);
        Alert.alert('エラー', '授業データの読み込みに失敗しました。');
        setCourses([]);
        setFilteredCourses([]);
        setLoading(false);
        return;
      }

      if (syllabusCourses && syllabusCourses.length > 0) {
        console.log(`${syllabusCourses.length}件の授業データをSyllabusContextから読み込みました`);
        setCourses(syllabusCourses);
        setFilteredCourses(syllabusCourses); // 初期状態ではフィルターなし
      } else {
        console.log('SyllabusContextから利用可能な授業データがありませんでした。');
        setCourses([]);
        setFilteredCourses([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('授業データの処理エラー:', error);
      Alert.alert('エラー', '授業データの処理中にエラーが発生しました。');
      setCourses([]);
      setFilteredCourses([]);
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    console.log('handleSearch called with query:', query); //
    setSearchQuery(query);
    // setLoading(true); // setLoadingはloadCoursesやuseEffectに任せるか、適切に管理
    
    // syllabusCoursesが確定している前提でフィルタリングのみ行う
    if (!courses || courses.length === 0) {
        setFilteredCourses([]);
        return;
    }

    let results: Course[] = [];
    if (query.trim() === '') {
      results = [...courses]; // coursesはSyllabusContext由来の全データ
    } else {
      const queryLower = query.toLowerCase(); // Optimize: convert query to lower once
      results = courses.filter(course => {
        const matchesName = course.name.toLowerCase().includes(queryLower);
        const matchesProfessor = course.professor && course.professor.toLowerCase().includes(queryLower);
        const matchesTitle = course.title && course.title.toLowerCase().includes(queryLower);
        const matchesLanguage = course.language && course.language.toLowerCase().includes(queryLower); // Add language to search
        const matchesNotes = course.notes && course.notes.toLowerCase().includes(queryLower); // Add notes to search
        return matchesName || matchesProfessor || matchesTitle || matchesLanguage || matchesNotes;
      });
    }
    
    // 曜日フィルタリング
    if (dayFilter !== 'すべて') {
      const dayIndex = dayOptions.indexOf(dayFilter);
      if (dayIndex > 0) { // 0はすべて
        console.log(`CoursesScreen: Filtering for dayIndex: ${dayIndex}`);
        results = results.filter(course => {
          console.log(`CoursesScreen: Course: ${course.name}, course.dayOfWeek: ${course.dayOfWeek}, Target dayIndex: ${dayIndex}, Match: ${course.dayOfWeek === dayIndex}`);
          return course.dayOfWeek === dayIndex;
        });
      }
    }
    
    // 時限フィルタリング
    if (periodFilter !== 'すべて') {
      const periodNumber = parseInt(periodFilter.replace('限', ''));
      results = results.filter(course => course.period === periodNumber);
    }
    
    // 学期フィルタリング
    if (semesterFilter !== 'すべて') {
      results = results.filter(course => course.semester === semesterFilter);
    }
    
    // 言語フィルタリング
    if (languageFilter !== 'すべて') {
      results = results.filter(course => course.language === languageFilter);
    }
    
    // Temporarily comment out academicYear filter to avoid lint errors
    // if (academicYearFilter !== 'すべて') {
    //   results = results.filter(course => course.academicYear === academicYearFilter);
    // }
    
    setFilteredCourses(results);
  };

  const renderCourseCard = ({ item }: { item: Course }) => {
    const isAdded = isCourseAdded(item.id);
    let hasConflict = false;
    if (typeof item.dayOfWeek === 'number' && typeof item.period === 'number') {
      hasConflict = !isAdded && hasTimeConflict(item.dayOfWeek, item.period);
    }
    // 曜日と時限の表示用文字列を生成 (SyllabusScreen.tsxのヘルパー関数を参考に)
    const dayOfWeekStrings = ["月", "火", "水", "木", "金"]; // Adjusted to Mon-Fri as per data
    let timeDisplay = '未定';
    if (typeof item.dayOfWeek === 'number' && item.dayOfWeek >= 1 && item.dayOfWeek <= dayOfWeekStrings.length && 
        typeof item.period === 'number') {
      timeDisplay = `${dayOfWeekStrings[item.dayOfWeek - 1]}${item.period}限`;
    }

    return (
      <TouchableOpacity onPress={() => { /* ここで詳細画面への遷移などを実装可能 */ }}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{item.name}</Text>
            {item.title && <Text style={styles.cardSubtitle}>{item.title}</Text>}
            {item.professor && <Text style={styles.cardText}>担当教員: {item.professor}</Text>}
            <Text style={styles.cardText}>時間: {timeDisplay}</Text>
            {item.room && <Text style={styles.cardText}>教室: {item.room}</Text>}
            {item.class_name && <Text style={styles.cardText}>クラス: {item.class_name}</Text>}
            {item.semester && <Text style={styles.cardText}>学期: {item.semester}</Text>}
            {item.language && <Text style={styles.cardText}>言語: {item.language}</Text>}
            {item.academicYear && <Text style={styles.cardText}>学年度: {item.academicYear}</Text>}
            
            <View style={styles.buttonContainer}>
              {item.syllabusUrl && (
                <Button 
                  icon="link"
                  mode="outlined" 
                  onPress={() => {
                    if (item.syllabusUrl) {
                      Linking.openURL(item.syllabusUrl);
                    }
                  }}
                  style={styles.button}
                >
                  シラバスを見る
                </Button>
              )}
              <Button
                mode={isAdded ? "contained" : "outlined"}
                style={[
                  styles.button,
                  isAdded ? styles.addedButton : null,
                  hasConflict && !isAdded ? styles.conflictButton : null
                ]}
                icon={isAdded ? "check" : hasConflict ? "alert" : "plus"}
                onPress={(e) => {
                  e.stopPropagation();
                  if (isAdded) {
                    removeCourse(item.id);
                    setSnackbarMessage(`${item.name} を時間割から削除しました`);
                    setSnackbarVisible(true);
                  } else {
                    handleAddToSchedule(item);
                  }
                }}
              >
                {isAdded ? '追加済み' : hasConflict ? '時間重複あり' : '時間割に追加'}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  // フィルターモーダルのレンダリング
  const renderFilterModal = (
    visible: boolean,
    setVisible: React.Dispatch<React.SetStateAction<boolean>>,
    options: string[],
    currentValue: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    title: string
  ) => (
    <Modal
      visible={visible}
      onDismiss={() => setVisible(false)}
      contentContainerStyle={styles.modalContainer}
    >
      <Text style={styles.modalTitle}>{title}</Text>
      <ScrollView>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.modalOption,
              currentValue === option && styles.selectedOption
            ]}
            onPress={() => {
              setValue(option);
              setVisible(false);
              handleSearch(searchQuery);
            }}
          >
            <Text
              style={[
                styles.modalOptionText,
                currentValue === option && styles.selectedOptionText
              ]}
            >
              {option}
            </Text>
            {currentValue === option && (
              <Ionicons name="checkmark" size={20} color="#e75480" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Modal>
  );

  const handleAddToSchedule = async (course: Course) => {
    // 既に同じIDの授業が追加されているかチェック
    if (isCourseAdded(course.id)) {
      setSnackbarMessage('この授業はすでに時間割に追加されています');
      setSnackbarVisible(true);
      return;
    }
    
    // 時間割に追加する前に時間帯の重複をチェック
    let hasConflictCheck = false;
    if (typeof course.dayOfWeek === 'number' && typeof course.period === 'number') {
      hasConflictCheck = hasTimeConflict(course.dayOfWeek, course.period);
    }
    
    if (hasConflictCheck) {
      // 時間帯が重複している場合は確認ダイアログを表示
      Alert.alert(
        '時間帯の重複',
        'この授業は他の授業と時間帯が重複しています。追加しますか？',
        [
          {
            text: 'キャンセル',
            style: 'cancel'
          },
          { 
            text: '追加する', 
            onPress: async () => {
              // 確認後に追加
              const result = await addCourse(course);
              if (result.success) {
                setSnackbarMessage(`${course.name}を時間割に追加しました`);
              } else {
                setSnackbarMessage(`${course.name}の追加に失敗しました。ログイン状態などを確認してください。${result.conflictCourse ? ' 時間重複の可能性があります。' : ''}`);
              }
              setSnackbarVisible(true);
            } 
          }
        ]
      );
    } else {
      // 重複がない場合はそのまま追加
      const result = await addCourse(course);
      if (result.success) {
        setSnackbarMessage(`${course.name}を時間割に追加しました`);
      } else {
        setSnackbarMessage(`${course.name}の追加に失敗しました。ログイン状態などを確認してください。${result.conflictCourse ? ' 時間重複の可能性があります。' : ''}`);
      }
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Portal>
        {renderFilterModal(dayModalVisible, setDayModalVisible, dayOptions, dayFilter, setDayFilter, '曜日を選択')}
        {renderFilterModal(periodModalVisible, setPeriodModalVisible, periodOptions, periodFilter, setPeriodFilter, '時限を選択')}
        {renderFilterModal(semesterModalVisible, setSemesterModalVisible, semesterOptions, semesterFilter, setSemesterFilter, '開講学期を選択')}
        {renderFilterModal(languageModalVisible, setLanguageModalVisible, languageOptions, languageFilter, setLanguageFilter, '言語を選択')}
        {renderFilterModal(academicYearModalVisible, setAcademicYearModalVisible, academicYearOptions, academicYearFilter, setAcademicYearFilter, '開講年度を選択')} {/* New: Academic Year Modal */}
      </Portal>
      
      <View style={styles.header}>
        <Text style={styles.title}>東京外国語大学</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={30} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('ProfileStackScreen')}> 
            <Ionicons name="person-outline" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {loading && courses.length === 0 ? (
        <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator animating={true} size="large" />
          <Text style={{ marginTop: 10 }}>授業データを読み込んでいます...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item.id.toString()} 
          ListHeaderComponent={
            <>
              {/* searchContainerで全体を囲む (元々の構造) */}
              <View style={styles.searchContainer}>
                {/* Searchbar (TouchableOpacityでラップ済み) */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => {
                    searchbarInputRef.current?.focus();
                  }}
                >
                  <View pointerEvents="none">
                    <Searchbar
                      placeholder="科目名、教員名などで検索"
                      onChangeText={handleSearch}
                      value={searchQuery}
                      style={styles.searchBar}
                      ref={searchbarInputRef as any}
                    />
                  </View>
                </TouchableOpacity>

                {/* フィルターセクション */}
                <View style={styles.filterRow}>
                  <View style={styles.filterColumn}>
                    <Text style={styles.filterLabel}>曜日</Text>
                    <TouchableOpacity
                      style={styles.selectContainer}
                      onPress={() => setDayModalVisible(true)}
                    >
                      <TextInput
                        value={dayFilter}
                        style={styles.select}
                        right={<TextInput.Icon icon="chevron-down" />}
                        editable={false}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.filterColumn}>
                    <Text style={styles.filterLabel}>時間帯</Text>
                    <TouchableOpacity
                      style={styles.selectContainer}
                      onPress={() => setPeriodModalVisible(true)}
                    >
                      <TextInput
                        value={periodFilter}
                        style={styles.select}
                        right={<TextInput.Icon icon="chevron-down" />}
                        editable={false}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.filterRow}>
                  <View style={styles.filterColumn}>
                    <Text style={styles.filterLabel}>開講学期</Text>
                    <TouchableOpacity
                      style={styles.selectContainer}
                      onPress={() => setSemesterModalVisible(true)}
                    >
                      <TextInput
                        value={semesterFilter}
                        style={styles.select}
                        right={<TextInput.Icon icon="chevron-down" />}
                        editable={false}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.filterColumn}>
                    <Text style={styles.filterLabel}>使用言語</Text>
                    <TouchableOpacity
                      style={styles.selectContainer}
                      onPress={() => setLanguageModalVisible(true)}
                    >
                      <TextInput
                        value={languageFilter}
                        style={styles.select}
                        right={<TextInput.Icon icon="chevron-down" />}
                        editable={false}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 開講年度フィルター (元々ListHeaderComponentの外にあったものを中に移動) */}
                <View style={styles.filterRow}>
                  <View style={styles.filterColumn}>
                    <Text style={styles.filterLabel}>開講年度</Text>
                    <TouchableOpacity
                      style={styles.selectContainer}
                      onPress={() => setAcademicYearModalVisible(true)}
                    >
                      <TextInput
                        value={academicYearFilter}
                        style={styles.select}
                        right={<TextInput.Icon icon="chevron-down" />}
                        editable={false}
                      />
                    </TouchableOpacity>
                  </View>
                  {/* 右側のカラムが空なら、バランスのために空のViewを置くか、filterColumnのスタイルを調整 */}
                  <View style={styles.filterColumn} /> 
                </View>
                
                <Button 
                  mode="contained" 
                  style={styles.searchButton}
                  onPress={() => handleSearch(searchQuery)} // Temporarily revert to handleSearch
                >
                  検索
                </Button>
              </View>
            </>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
          contentContainerStyle={styles.listContentContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>該当する授業はありません。</Text>
            </View>
          }
        />
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View> // Closing the main View from line 324
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: 10,
    marginVertical: 5,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    marginBottom: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    flex: 1, 
    marginHorizontal: 4,
  },
  addedButton: {
  },
  conflictButton: {
    borderColor: 'orange', 
  },
  header: {
    backgroundColor: '#e75480', 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
    padding: 8, // Added padding to increase tappable area
  },
  subHeader: {
    padding: 16,
  },
  subHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
    elevation: 2,
    zIndex: 1, // Ensure sticky header is above list but below modals
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterColumn: {
    flex: 1,
    marginRight: 8,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  selectContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  select: {
    backgroundColor: '#fff',
    height: 40,
  },
  searchButton: {
    backgroundColor: '#e75480', 
    marginTop: 10,
    width: '50%',
    alignSelf: 'center',
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snackbar: {
  },
  scrollContainer: {
    paddingBottom: 20, 
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#fff5f8', 
  },
  modalOptionText: {
    fontSize: 16,
  },
  selectedOptionText: {
    color: '#e75480',
    fontWeight: 'bold',
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
  },
});

export default CoursesScreen;
