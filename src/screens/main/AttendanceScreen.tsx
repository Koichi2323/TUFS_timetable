import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Text, Card, Button, useTheme, Chip, ActivityIndicator, Menu, Divider, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'; // Keep for potential reintegration
import { auth, db } from '../../../firebase'; // Keep for potential reintegration
// import { auth, db } from '../../../firebase'; // Temporarily comment out for local data focus
import { allSyllabusData as allLocalCourses } from '../../data/allSyllabusData'; // Import all courses from combined spring and autumn data
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Course } from '../../types';

type AttendanceScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const AttendanceScreen = ({ navigation, toggleTheme, isDarkMode }: AttendanceScreenProps) => {
  const [initialCourses, setInitialCourses] = useState<Course[]>([]);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined); // undefined for 'All Days'
  const [selectedPeriod, setSelectedPeriod] = useState<number | undefined>(undefined); // undefined for 'All Periods'
  const [dayMenuVisible, setDayMenuVisible] = useState(false);
  const [periodMenuVisible, setPeriodMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string | undefined>(undefined);
  const [semesterMenuVisible, setSemesterMenuVisible] = useState(false);
  // const [courses, setCourses] = useState<Course[]>([]); // Replaced by initialCourses and displayedCourses
  const [loading, setLoading] = useState(true);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortOption, setSortOption] = useState<'name'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const theme = useTheme();

  const daysOfWeek = [
    { label: '全曜日', value: undefined },
    { label: '月曜', value: 1 },
    { label: '火曜', value: 2 },
    { label: '水曜', value: 3 },
    { label: '木曜', value: 4 },
    { label: '金曜', value: 5 },
    { label: '土曜', value: 6 },
    { label: '日曜', value: 0 },
  ];

  // Assuming up to 7 periods, adjust if necessary
  const periods = [
    { label: '全時限', value: undefined },
    ...Array.from({ length: 7 }, (_, i) => ({ label: `${i + 1}限`, value: i + 1 })),
  ];

  const semesters = [
    { label: '全学期', value: undefined },
    { label: '春学期', value: '春学期' },
    { label: '秋学期', value: '秋学期' },
  ];

  // TODO: Consider deriving categories dynamically from allLocalCourses
  const categories = [
    { label: '全カテゴリ', value: undefined },
    { label: '世界教養', value: '世界教養' },
    { label: '言語文化学部', value: '言語文化学部' },
    { label: '国際社会学部', value: '国際社会学部' },
    { label: '国際日本学部', value: '国際日本学部' },
    { label: '大学院', value: '大学院' },
    // Add other categories as needed or implement dynamic generation
  ];
  
  useEffect(() => {
    fetchCourses(); // Fetch courses from Firebase
  }, []);
  
  useEffect(() => {
    // Apply filters and then sort
    let filtered = [...initialCourses];

    if (selectedDay !== undefined) {
      console.log(`Filtering for selectedDay: ${selectedDay}`);
      filtered = filtered.filter(course => {
        // console.log(`Course: ${course.name}, course.dayOfWeek: ${course.dayOfWeek}, selectedDay: ${selectedDay}, Match: ${course.dayOfWeek === selectedDay}`);
        // 詳細ログは必要に応じてコメント解除
        return course.dayOfWeek === selectedDay;
      });
    }

    if (selectedPeriod !== undefined) {
      filtered = filtered.filter(course => course.period === selectedPeriod);
    }

    if (selectedSemester !== undefined) {
      filtered = filtered.filter(course => course.semester === selectedSemester);
    }

    if (selectedCategory !== undefined) {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Sorting logic (adapt to use 'filtered' as source)
    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === 'name') { 
        return sortDirection === 'asc'
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '');
      } // Add other sort options if necessary
      return 0; 
    });
    setDisplayedCourses(sorted);

  }, [initialCourses, selectedDay, selectedPeriod, selectedSemester, selectedCategory, sortOption, sortDirection]);

  // useEffect(() => {
  //   sortCourses(); // Original sort logic, now integrated above
  // }, [sortOption, sortDirection]);
  
  const fetchCourses = async () => { // This function will be largely unused for now
    if (!auth.currentUser) return; // Keep auth check if we reintegrate parts later
    
    try {
      setLoading(true);
      
      const coursesQuery = query(
        collection(db, 'courses'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(coursesQuery);
      const coursesData: Course[] = [];
      
      for (const courseDoc of querySnapshot.docs) {
        const courseData = courseDoc.data();
        
        // Fetch attendance data for this course
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('userId', '==', auth.currentUser.uid),
          where('courseId', '==', courseDoc.id)
        );
        
        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        let totalClasses = courseData.totalClasses || 0;
        let attendedClasses = 0;
        let absentClasses = 0;
        let lateClasses = 0;
        
        attendanceSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'attended') attendedClasses++;
          else if (data.status === 'absent') absentClasses++;
          else if (data.status === 'late') lateClasses++;
        });
        
        coursesData.push({
          id: courseDoc.id,
          name: courseData.name,
          professor: courseData.professor,
          room: courseData.room,
          credits: courseData.credits,
          dayOfWeek: courseData.dayOfWeek,
          period: courseData.period,
          color: courseData.color,
          totalClasses,
          attendedClasses,
          absentClasses,
          lateClasses,
        });
      }
      
      let finalCourses: Course[] = [];
      const processedCourseCodes = new Set<string>();

      if (coursesData.length > 0) {
        finalCourses = [...coursesData]; // Start with Firebase courses
        coursesData.forEach(course => {
          if (course.courseCode) { // Ensure courseCode exists
            processedCourseCodes.add(course.courseCode);
          }
        });
        console.log('Fetched courses from Firebase. Prioritizing these.');

        // Add local courses only if their courseCode hasn't been processed (i.e., not in Firebase data)
        const uniqueLocalCourses = allLocalCourses.filter(localCourse => {
          return localCourse.courseCode && !processedCourseCodes.has(localCourse.courseCode);
        });
        finalCourses = [...finalCourses, ...uniqueLocalCourses];
        if (uniqueLocalCourses.length > 0) {
          console.log(`Added ${uniqueLocalCourses.length} unique local courses to the list.`);
        }
      } else {
        console.log('No courses found in Firebase for this user, loading all local fallback data.');
        finalCourses = [...allLocalCourses]; // Fallback to all local data if Firebase is empty
      }
      setInitialCourses(finalCourses); // Set state with the combined & deduplicated list
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('エラー', '授業データの取得に失敗しました。ローカルデータを表示します。');
      setInitialCourses(allLocalCourses); // Fallback to local data on error
    } finally {
      setLoading(false);
    }
  };
  
/*
  const sortCourses = (coursesToSort = displayedCourses) => { // Sorting logic is now part of the filtering useEffect
    const sorted = [...coursesToSort].sort((a, b) => {
      if (sortOption === 'name') { 
        return sortDirection === 'asc'
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '');
      } // Add other sort options if necessary
      return 0; 
    });
    setDisplayedCourses(sorted);
  };
*/
  
  const updateAttendance = async (courseId: string, status: 'attended' | 'absent' | 'late') => { // Temporarily disable full functionality
    Alert.alert('Info', 'Attendance update feature is temporarily adjusted for course browsing.');
    return;
/* Actual Firebase logic commented out
    if (!auth.currentUser) return; // Ensure user is logged in
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendanceId = `${courseId}_${today.toISOString().split('T')[0]}`;
      
      await setDoc(doc(db, 'attendance', attendanceId), {
        userId: auth.currentUser.uid,
        courseId,
        date: today,
        status,
        createdAt: new Date(),
      });
      
      // Refresh local course data to reflect new attendance
      const updatedCourses = courses.map(c => {
        if (c.id === courseId) {
          const newAttendance = { ...c };
          // This part needs careful re-evaluation based on how attendance is stored and calculated
          // For simplicity, we might just refetch or update manually
          return newAttendance;
        }
        return c;
      });
      setCourses(updatedCourses);
      sortCourses(updatedCourses);
      
      Alert.alert('成功', '出席状況を更新しました');
    } catch (error) { 
      console.error('Error updating attendance:', error);
      Alert.alert('エラー', '出席状況の更新に失敗しました');
    }
*/
/*
    if (!auth.currentUser) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendanceId = `${courseId}_${today.toISOString().split('T')[0]}`;
      
      await setDoc(doc(db, 'attendance', attendanceId), {
        userId: auth.currentUser.uid,
        courseId,
        date: today,
        status,
        createdAt: new Date(),
      });
      
      // Update course's total classes if needed
      const courseRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);
      
      if (courseDoc.exists()) {
        const courseData = courseDoc.data();
        const totalClasses = courseData.totalClasses || 0;
        
        await updateDoc(courseRef, {
          totalClasses: totalClasses + 1,
        });
      }
      
      // Refresh the data
      fetchCourses();
      
      Alert.alert('成功', '出席情報が更新されました');
    } catch (error) {
      console.error('Error updating attendance:', error);
      Alert.alert('エラー', '出席情報の更新に失敗しました');
    }
*/
  };
  
  const getDayOfWeekText = (dayOfWeek: number) => {
    const days = ['', '月', '火', '水', '木', '金', '土', '日'];
    return days[dayOfWeek] || '';
  };
  
  const renderCourseItem = ({ item }: { item: Course }) => {
    const cardColor = item.color || theme.colors.surface;
    const textColor = theme.dark ? theme.colors.onSurface : theme.colors.onSurface; // Ensure good contrast

    const attended = item.attendedClasses ?? 0;
    const absents = item.absentClasses ?? 0;
    const lates = item.lateClasses ?? 0;
    const total = item.totalClasses ?? 0;

    return (
      <Card style={[styles.courseCard, { backgroundColor: cardColor }]} onPress={() => navigation.navigate('AttendanceDetail', { courseId: item.id, courseName: item.name })}>
        <Card.Content>
          <View style={styles.courseHeader}>
            <Text style={[styles.courseName, { color: textColor }]}>{item.name}</Text>
            <Chip 
              icon="information-outline" 
              style={{ backgroundColor: theme.colors.backdrop, height: 30 }} 
              textStyle={{ color: textColor, fontSize: 12 }}
            >
              {getDayOfWeekText(item.dayOfWeek as number)} {item.period}限
            </Chip>
          </View>
          <Text style={[styles.courseInfo, { color: textColor }]}>
            {item.professor} • {item.room}
          </Text>

          <View style={styles.attendanceContainer}>
            <View style={[styles.statsContainer, { marginTop: 8 }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: textColor }]}>{attended}</Text>
                <Text style={[styles.statLabel, { color: textColor }]}>出席</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: textColor }]}>{absents}</Text>
                <Text style={[styles.statLabel, { color: textColor }]}>欠席</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: textColor }]}>{lates}</Text>
                <Text style={[styles.statLabel, { color: textColor }]}>遅刻</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: textColor }]}>{total}</Text>
                <Text style={[styles.statLabel, { color: textColor }]}>総回数</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button 
                mode="contained-tonal" 
                onPress={() => updateAttendance(item.id, 'attended')} 
                style={styles.attendanceButton}
                labelStyle={{ fontSize: 12 }}
                icon="check-circle-outline"
              >
                出席
              </Button>
              <Button 
                mode="contained-tonal" 
                onPress={() => updateAttendance(item.id, 'absent')} 
                style={styles.attendanceButton}
                labelStyle={{ fontSize: 12 }}
                icon="close-circle-outline"
              >
                欠席
              </Button>
              <Button 
                mode="contained-tonal" 
                onPress={() => updateAttendance(item.id, 'late')} 
                style={styles.attendanceButton}
                labelStyle={{ fontSize: 12 }}
                icon="clock-alert-outline"
              >
                遅刻
              </Button>
            </View>
          </View>

        </Card.Content>
      </Card>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="school-outline"
        size={64}
        color={theme.colors.onBackground}
        style={{ opacity: 0.5 }}
      />
      <Text style={[styles.emptyText, { color: theme.colors.onBackground }]}>
        授業が登録されていません
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.onBackground, opacity: 0.7 }]}>
        「授業」タブから授業を追加してください
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>出席管理</Text>
        <View style={styles.headerActions}>
          {/* Day Filter Menu */}
          <Menu
            visible={dayMenuVisible}
            onDismiss={() => setDayMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setDayMenuVisible(true)}
              >
                <Text style={{ color: theme.colors.primary }}>
                  {daysOfWeek.find(d => d.value === selectedDay)?.label || '全曜日'}
                </Text>
              </TouchableOpacity>
            }
          >
            {daysOfWeek.map((day) => (
              <Menu.Item
                key={day.label}
                onPress={() => {
                  setSelectedDay(day.value);
                  setDayMenuVisible(false);
                }}
                title={day.label}
                trailingIcon={selectedDay === day.value ? 'check' : undefined}
              />
            ))}
          </Menu>

          {/* Period Filter Menu */}
          <Menu
            visible={periodMenuVisible}
            onDismiss={() => setPeriodMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setPeriodMenuVisible(true)}
              >
                <Text style={{ color: theme.colors.primary }}>
                  {periods.find(p => p.value === selectedPeriod)?.label || '全時限'}
                </Text>
              </TouchableOpacity>
            }
          >
            {periods.map((p) => (
              <Menu.Item
                key={p.label}
                onPress={() => {
                  setSelectedPeriod(p.value);
                  setPeriodMenuVisible(false);
                }}
                title={p.label}
                trailingIcon={selectedPeriod === p.value ? 'check' : undefined}
              />
            ))}
          </Menu>

          {/* Semester Filter Menu */}
          <Menu
            visible={semesterMenuVisible}
            onDismiss={() => setSemesterMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setSemesterMenuVisible(true)}
              >
                <Text style={{ color: theme.colors.primary }}>
                  {semesters.find(s => s.value === selectedSemester)?.label || '全学期'}
                </Text>
              </TouchableOpacity>
            }
          >
            {semesters.map((s) => (
              <Menu.Item
                key={s.label}
                onPress={() => {
                  setSelectedSemester(s.value);
                  setSemesterMenuVisible(false);
                }}
                title={s.label}
                trailingIcon={selectedSemester === s.value ? 'check' : undefined}
              />
            ))}
          </Menu>

          {/* Category Filter Menu */}
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setCategoryMenuVisible(true)}
              >
                <Text style={{ color: theme.colors.primary }}>
                  {categories.find(c => c.value === selectedCategory)?.label || '全カテゴリ'}
                </Text>
              </TouchableOpacity>
            }
          >
            {categories.map((c) => (
              <Menu.Item
                key={c.label}
                onPress={() => {
                  setSelectedCategory(c.value);
                  setCategoryMenuVisible(false);
                }}
                title={c.label}
                trailingIcon={selectedCategory === c.value ? 'check' : undefined}
              />
            ))}
          </Menu>

          {/* Sort Menu */}
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.sortButton} // Ensure styles.sortButton is defined or adjust
                onPress={() => setSortMenuVisible(true)}
              >
                <Ionicons name="funnel-outline" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setSortOption('name');
                setSortMenuVisible(false);
              }}
              title="授業名で並べ替え"
              leadingIcon="sort-alphabetical-ascending"
              trailingIcon={sortOption === 'name' ? 'check' : undefined}
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                setSortMenuVisible(false);
              }}
              title={`並べ替え: ${sortDirection === 'asc' ? '昇順' : '降順'}`}
              leadingIcon={sortDirection === 'asc' ? 'sort-ascending' : 'sort-descending'}
            />
          </Menu>

          {/* Theme Toggle Button */}
          <TouchableOpacity onPress={toggleTheme} style={{ marginLeft: 8 }}>
            <Ionicons
              name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
            授業データを読み込み中...
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedCourses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshing={loading}
          onRefresh={fetchCourses}
        />
      )}
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    // borderRadius: 8, // Optional: if you want rounded buttons
    // borderWidth: 1, // Optional
    // borderColor: theme.colors.primary, // Optional
  },
  sortButton: {
    marginRight: 16,
  },
  menu: {
    width: 250,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  courseCard: {
    marginBottom: 16,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  courseInfo: {
    fontSize: 14,
    marginBottom: 12,
  },
  attendanceContainer: {
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  attendanceButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});

export default AttendanceScreen;
