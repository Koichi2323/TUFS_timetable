import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, Card, Searchbar, Chip, Button, useTheme, ActivityIndicator, Menu, Divider, TextInput, Modal, Portal, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { Course } from '../../types';
import { tufsCourses } from '../../data/tufsCourses';
import { useSchedule } from '../../context/ScheduleContext';

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
  const [semesterFilter, setSemesterFilter] = useState('すべて');
  const [languageFilter, setLanguageFilter] = useState('すべて');
  
  // フィルターモーダル用の状態
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [semesterModalVisible, setSemesterModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  
  // スナックバー用の状態
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // スケジュールコンテキストを使用
  const { addCourse, isCourseAdded, removeCourse, hasTimeConflict } = useSchedule();
  
  const theme = useTheme();

  // Filter options
  const dayOptions = ['すべて', '月曜', '火曜', '水曜', '木曜', '金曜'];
  const periodOptions = ['すべて', '1限', '2限', '3限', '4限', '5限'];
  const semesterOptions = ['すべて', '春学期', '秋学期', '通年'];
  const languageOptions = ['すべて', '日本語', '英語', 'その他'];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // 東京外国語大学の授業データを使用
      setCourses(tufsCourses);
      setFilteredCourses(tufsCourses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...courses];
    
    // 検索クエリによるフィルタリング
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.professor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 曜日フィルタリング
    if (dayFilter !== 'すべて') {
      const dayIndex = dayOptions.indexOf(dayFilter);
      if (dayIndex > 0) {
        filtered = filtered.filter(course => course.dayOfWeek === dayIndex);
      }
    }
    
    // 時限フィルタリング
    if (periodFilter !== 'すべて') {
      const periodNumber = parseInt(periodFilter.replace('限', ''));
      filtered = filtered.filter(course => course.period === periodNumber);
    }
    
    // 学期フィルタリング
    if (semesterFilter !== 'すべて') {
      filtered = filtered.filter(course => course.semester === semesterFilter);
    }
    
    // 言語フィルタリング
    if (languageFilter !== 'すべて') {
      filtered = filtered.filter(course => course.language === languageFilter);
    }
    
    setFilteredCourses(filtered);
  };
  
  // 時間割に授業を追加する
  const handleAddToSchedule = (course: Course) => {
    // 既に同じIDの授業が追加されているかチェック
    if (isCourseAdded(course.id)) {
      setSnackbarMessage('この授業はすでに時間割に追加されています');
      setSnackbarVisible(true);
      return;
    }
    
    // 授業を追加（重複チェック付き）
    const result = addCourse(course);
    
    if (result.success) {
      setSnackbarMessage('授業を時間割に追加しました');
      setSnackbarVisible(true);
    } else if (result.conflictCourse) {
      // 時間帯の重複がある場合、ポップアップを表示
      const conflictCourse = result.conflictCourse;
      Alert.alert(
        '時間割の重複',
        `${dayOptions[course.dayOfWeek]}${course.period}限にはすでに授業が登録されています。\n\n授業名：${conflictCourse.name}\n担当教員：${conflictCourse.professor}\n\n重複している授業を置き換えますか？`,
        [
          {
            text: 'キャンセル',
            style: 'cancel',
          },
          {
            text: '置き換える',
            onPress: () => {
              // 既存の授業を削除して新しい授業を追加
              removeCourse(conflictCourse.id);
              const newResult = addCourse(course);
              if (newResult.success) {
                setSnackbarMessage('授業を置き換えました');
                setSnackbarVisible(true);
              }
            },
            style: 'destructive',
          },
        ]
      );
    }
  };

  const renderCourseCard = ({ item }: { item: Course }) => {
    const dayName = dayOptions[item.dayOfWeek] || '';
    const periodName = `${item.period}限`;
    // 同じIDの授業が追加されているかチェック
    const isAdded = isCourseAdded(item.id);
    // 同じ時間帯に既に授業が登録されているかチェック
    const hasConflict = hasTimeConflict(item.dayOfWeek, item.period);
    
    return (
      <Card style={styles.courseCard}>
        <Card.Content>
          <View style={styles.courseHeader}>
            <Text style={styles.courseName}>{item.name}</Text>
            <Text style={[
              styles.courseSchedule,
              hasConflict && !isAdded ? styles.conflictSchedule : null
            ]}>
              {dayName}{periodName}
              {hasConflict && !isAdded ? ' ⚠️' : ''}
            </Text>
          </View>
          <Text style={styles.professorName}>{item.professor}</Text>
          <Text style={styles.courseTitle}>{item.title}</Text>
          <Text style={styles.courseRoom}>教室: {item.room}</Text>
          
          <View style={styles.courseFooter}>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.syllabusLink}>シラバスを見る</Text>
            </TouchableOpacity>
            <Button 
              mode="contained" 
              style={[
                styles.addButton, 
                isAdded ? styles.addedButton : null,
                hasConflict && !isAdded ? styles.conflictButton : null
              ]}
              icon={isAdded ? "check" : hasConflict ? "alert" : "plus"}
              onPress={() => handleAddToSchedule(item)}
              disabled={isAdded}
            >
              {isAdded ? '追加済み' : hasConflict ? '時間割重複' : '時間割に追加'}
            </Button>
          </View>
        </Card.Content>
      </Card>
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
      <Text style={styles.modalTitle}>{title}を選択</Text>
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
              handleSearch();
            }}
          >
            <Text style={[
              styles.modalOptionText,
              currentValue === option && styles.selectedOptionText
            ]}>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Portal>
        {renderFilterModal(dayModalVisible, setDayModalVisible, dayOptions, dayFilter, setDayFilter, '曜日')}
        {renderFilterModal(periodModalVisible, setPeriodModalVisible, periodOptions, periodFilter, setPeriodFilter, '時限')}
        {renderFilterModal(semesterModalVisible, setSemesterModalVisible, semesterOptions, semesterFilter, setSemesterFilter, '学期')}
        {renderFilterModal(languageModalVisible, setLanguageModalVisible, languageOptions, languageFilter, setLanguageFilter, '使用言語')}
      </Portal>
      
      <View style={styles.header}>
        <Text style={styles.title}>東京外国語大学</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>履修科目検索</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="授業名、教員名、キーワードで検索"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          icon="magnify"
          onSubmitEditing={handleSearch}
        />
        
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
            <Text style={styles.filterLabel}>学期</Text>
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
        
        <Button 
          mode="contained" 
          style={styles.searchButton}
          onPress={handleSearch}
        >
          検索
        </Button>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e75480" />
          <Text style={{ marginTop: 16 }}>
            授業を読み込み中...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          renderItem={renderCourseCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.coursesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                検索条件に一致する授業がありません
              </Text>
            </View>
          }
        />
      )}
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e75480',
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
    marginTop: 8,
  },
  coursesList: {
    padding: 16,
    paddingTop: 0,
  },
  courseCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  courseSchedule: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 14,
  },
  conflictSchedule: {
    backgroundColor: '#fff0f0',
    color: '#e74c3c',
  },
  professorName: {
    fontSize: 14,
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  courseRoom: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syllabusLink: {
    color: '#e75480',
    textDecorationLine: 'underline',
  },
  addButton: {
    backgroundColor: '#e75480',
  },
  addedButton: {
    backgroundColor: '#888',
  },
  conflictButton: {
    backgroundColor: '#e74c3c',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  snackbar: {
    backgroundColor: '#333',
  },
});

export default CoursesScreen;
