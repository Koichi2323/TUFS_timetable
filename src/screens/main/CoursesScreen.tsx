import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Linking, TextInput as RNTextInput } from 'react-native';
import { Text, Card, Searchbar, Chip, Button, useTheme, ActivityIndicator, Menu, Divider, TextInput, Modal, Portal, Snackbar, RadioButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Course } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';
import { useSyllabus } from '../../contexts/SyllabusContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [academicYearFilter, setAcademicYearFilter] = useState('すべて'); // New: Academic Year
  const [onDemandOnly, setOnDemandOnly] = useState(false); // New: On-demand filter
  
  // フィルターモーダル用の状態
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [semesterModalVisible, setSemesterModalVisible] = useState(false);
  const [academicYearModalVisible, setAcademicYearModalVisible] = useState(false); // New: Academic Year Modal
  
  // スナックバー用の状態
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // スケジュールコンテキストを使用
  const { addCourse, isCourseAdded, removeCourse, hasTimeConflict } = useSchedule();
  const { syllabusCourses, isLoading: syllabusLoading, error: syllabusError } = useSyllabus();
  const searchbarInputRef = useRef<RNTextInput | null>(null);
  
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Filter options
  const dayOptions = ['すべて', '月曜', '火曜', '水曜', '木曜', '金曜'];
  const periodOptions = ['すべて', '1限', '2限', '3限', '4限', '5限', '6限'];
  const semesterOptions = ['すべて', '春学期', '秋学期', '通年']; // Options for "開講学期"
  const academicYearOptions = ['すべて', '2025年度']; // New: Academic Year Options - Filtered to 2025 only
  
  // 曜日と曜日インデックスのマッピング (データ形式に合わせ、月曜:1, 火曜:2, ...とする)
  const dayNameToIndex = {
    '月曜': 1,
    '火曜': 2,
    '水曜': 3,
    '木曜': 4,
    '金曜': 5
  };

  useEffect(() => {
    loadCourses();
  }, [syllabusCourses]);

  // 検索クエリ、フィルター、またはコースリストが変更されたときに検索を実行
  useEffect(() => {
    // coursesがまだロードされていない場合は検索を実行しない
    if (courses.length > 0) {
      handleSearch();
    }
  }, [searchQuery, dayFilter, periodFilter, semesterFilter, academicYearFilter, onDemandOnly, courses]);

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

  const handleSearch = () => {
    if (!courses) {
        setFilteredCourses([]);
        return;
    }

    let results = courses;

    // 検索クエリによるフィルタリング
    if (searchQuery.trim() !== '') {
      const normalizedQuery = searchQuery.toLowerCase().normalize('NFKC');
      results = results.filter(course => {
        const matchesName = course.name.toLowerCase().normalize('NFKC').includes(normalizedQuery);
        const matchesProfessor = course.professor?.toLowerCase().normalize('NFKC').includes(normalizedQuery);
        const matchesTitle = course.title?.toLowerCase().normalize('NFKC').includes(normalizedQuery);
        const matchesLanguage = course.language?.toLowerCase().normalize('NFKC').includes(normalizedQuery);
        const matchesNotes = course.notes?.toLowerCase().normalize('NFKC').includes(normalizedQuery);
        return matchesName || matchesProfessor || matchesTitle || matchesLanguage || matchesNotes;
      });
    }

    // 各種フィルター
    if (dayFilter !== 'すべて') {
      const dayIndex = dayNameToIndex[dayFilter as keyof typeof dayNameToIndex];
      results = results.filter(course => course.dayOfWeek === dayIndex);
    }
    if (periodFilter !== 'すべて') {
      const periodNumber = parseInt(periodFilter.replace('限', ''));
      results = results.filter(course => course.period === periodNumber);
    }
    if (semesterFilter !== 'すべて') {
      results = results.filter(course => course.semester === semesterFilter);
    }
    if (academicYearFilter !== 'すべて') {
      results = results.filter(course => course.academicYear === academicYearFilter);
    }
    
    // オンデマンド授業フィルタリング
    // onDemandOnlyがtrueならオンデマンドのみ、falseならオンデマンド以外
    results = results.filter(course => (course.onDemand || false) === onDemandOnly);
    
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Portal>
        {renderFilterModal(dayModalVisible, setDayModalVisible, dayOptions, dayFilter, setDayFilter, '曜日を選択')}
        {renderFilterModal(periodModalVisible, setPeriodModalVisible, periodOptions, periodFilter, setPeriodFilter, '時限を選択')}
        {renderFilterModal(semesterModalVisible, setSemesterModalVisible, semesterOptions, semesterFilter, setSemesterFilter, '開講学期を選択')}
        {renderFilterModal(academicYearModalVisible, setAcademicYearModalVisible, academicYearOptions, academicYearFilter, setAcademicYearFilter, '開講年度を選択')} {/* New: Academic Year Modal */}
      </Portal>
      
      <View style={styles.header}>
        <Text style={styles.title}>履修検索</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={30} color="#fff" />
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
        style={{ flex: 1 }}
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
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    icon={({ size, color }) => (
                      <Ionicons name="search" size={size} color={color} />
                    )}
                    clearIcon={({ size, color }) => (
                      <Ionicons name="close-circle" size={size} color={color} />
                    )}
                    ref={searchbarInputRef as any}
                  />
                </View>
              </TouchableOpacity>

              {/* フィルターセクション */}
              <View style={styles.filterRow}>
                <View style={styles.filterColumn}>
                  <Text style={styles.filterLabel}>曜日</Text>
                  <TouchableOpacity
                    style={[styles.selectContainer, styles.select, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 }]}
                    onPress={() => setDayModalVisible(true)}
                  >
                    <Text style={{ fontSize: 16 }}>{dayFilter}</Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.filterColumn}>
                  <Text style={styles.filterLabel}>時間帯</Text>
                  <TouchableOpacity
                    style={[styles.selectContainer, styles.select, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 }]}
                    onPress={() => setPeriodModalVisible(true)}
                  >
                    <Text style={{ fontSize: 16 }}>{periodFilter}</Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.filterRow, { alignItems: 'flex-end' }]}>
                <View style={styles.filterColumn}>
                  <Text style={styles.filterLabel}>開講学期</Text>
                  <TouchableOpacity
                    style={[styles.selectContainer, styles.select, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 }]}
                    onPress={() => setSemesterModalVisible(true)}
                  >
                    <Text style={{ fontSize: 16 }}>{semesterFilter}</Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.filterColumn, { marginRight: 0, marginBottom: 0 }]}>
                  <TouchableOpacity
                    onPress={() => setOnDemandOnly(!onDemandOnly)}
                    style={[styles.selectContainer, { height: 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: '#fff' }]}
                  >
                    <RadioButton
                      value="onDemand"
                      status={onDemandOnly ? 'checked' : 'unchecked'}
                      onPress={() => setOnDemandOnly(!onDemandOnly)}
                    />
                    <Text style={{ marginLeft: 8 }}>オンデマンド</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 開講年度フィルター (元々ListHeaderComponentの外にあったものを中に移動) */}
              <View style={styles.filterRow}>
                <View style={styles.filterColumn}>
                  <Text style={styles.filterLabel}>開講年度</Text>
                  <TouchableOpacity
                    style={[styles.selectContainer, styles.select, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 }]}
                    onPress={() => setAcademicYearModalVisible(true)}
                  >
                    <Text style={{ fontSize: 16 }}>{academicYearFilter}</Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                {/* 右側のカラムが空なら、バランスのために空のViewを置くか、filterColumnのスタイルを調整 */}
                <View style={styles.filterColumn} /> 
              </View>
              

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
  </SafeAreaView> // Closing the main SafeAreaView
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
    paddingVertical: 4,
    paddingHorizontal: 16,
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
    padding: 10,
    backgroundColor: '#fff', 
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 8,
    marginTop: 0,
    elevation: 2,
    zIndex: 1, // Ensure sticky header is above list but below modals
  },
  searchBar: {
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    marginTop: 6,
    width: '50%',
    alignSelf: 'center',
    marginBottom: 6,
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
