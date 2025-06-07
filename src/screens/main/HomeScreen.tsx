import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, FAB, useTheme, Divider, List, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type HomeScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const HomeScreen = ({ navigation, toggleTheme, isDarkMode }: HomeScreenProps) => {
  const [upcomingCourses, setUpcomingCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    
    try {
      // Get today's day of week (0-6, where 0 is Sunday)
      const today = new Date().getDay();
      // Convert to 1-7 where 1 is Monday, 7 is Sunday
      const dayOfWeek = today === 0 ? 7 : today;
      
      // Fetch courses for today
      const coursesRef = collection(db, 'courses');
      const userCoursesRef = collection(db, 'userCourses');
      
      const userCoursesQuery = query(
        userCoursesRef,
        where('userId', '==', auth.currentUser.uid)
      );
      
      const userCoursesSnapshot = await getDocs(userCoursesQuery);
      const courseIds = userCoursesSnapshot.docs.map(doc => doc.data().courseId);
      
      if (courseIds.length > 0) {
        const coursesQuery = query(
          coursesRef,
          where('dayOfWeek', '==', dayOfWeek),
          orderBy('period', 'asc')
        );
        
        const coursesSnapshot = await getDocs(coursesQuery);
        const todayCourses = coursesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(course => courseIds.includes(course.id));
        
        setUpcomingCourses(todayCourses);
      }
      
      // Fetch upcoming assignments
      const assignmentsRef = collection(db, 'assignments');
      const now = new Date();
      
      const assignmentsQuery = query(
        assignmentsRef,
        where('userId', '==', auth.currentUser.uid),
        where('dueDate', '>=', now),
        orderBy('dueDate', 'asc'),
        limit(5)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const upcomingAssignments = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setAssignments(upcomingAssignments);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getDayString = () => {
    return format(new Date(), 'yyyy年M月d日 (EEEE)', { locale: ja });
  };

  const renderTodayCourses = () => {
    if (upcomingCourses.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyCardContent}>
            <Ionicons name="calendar-outline" size={48} color="#f06292" />
            <Paragraph style={{ textAlign: 'center', marginTop: 10 }}>
              今日の授業はありません
            </Paragraph>
          </Card.Content>
        </Card>
      );
    }

    return upcomingCourses.map((course: any) => (
      <Card 
        key={course.id} 
        style={[styles.courseCard, { borderLeftWidth: 5, borderLeftColor: course.color || '#f06292' }]}
        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
      >
        <Card.Content>
          <View style={styles.courseHeader}>
            <Title style={styles.courseTitle}>{course.name}</Title>
            <View style={styles.periodBadge}>
              <Text style={styles.periodText}>{course.period}限</Text>
            </View>
          </View>
          <View style={styles.courseDetails}>
            <Text style={styles.courseInfoText}>{course.professor} 教授 / {course.room}</Text>
            <Text style={styles.courseTimeText}>
              {course.period === 1 ? '9:00-10:30' : 
               course.period === 2 ? '10:40-12:10' : 
               course.period === 3 ? '13:00-14:30' : 
               course.period === 4 ? '14:40-16:10' : 
               course.period === 5 ? '16:20-17:50' : 
               course.period === 6 ? '18:00-19:30' : '19:40-21:10'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    ));
  };

  const renderAssignments = () => {
    if (assignments.length === 0) {
      return (
        <View style={styles.emptyAssignments}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#f06292" />
          <Paragraph style={{ textAlign: 'center', marginTop: 10 }}>
            期限が近い課題はありません
          </Paragraph>
        </View>
      );
    }

    return assignments.map((assignment: any) => {
      const dueDate = assignment.dueDate.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate);
      const isOverdue = dueDate < new Date();
      
      return (
        <List.Item
          key={assignment.id}
          title={assignment.title}
          description={`${assignment.courseName} • ${format(dueDate, 'M月d日 HH:mm')}`}
          left={props => (
            <Avatar.Icon 
              {...props} 
              icon="file-document-outline" 
              color="white"
              style={{ backgroundColor: isOverdue ? '#F44336' : '#4CAF50' }} 
            />
          )}
          right={props => (
            <List.Icon {...props} icon="chevron-right" />
          )}
          onPress={() => navigation.navigate('Assignments', { assignmentId: assignment.id })}
          style={styles.assignmentItem}
        />
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: '#f06292' }]}>東京外国語大学</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={{ display: 'none' }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={24} color="#f06292" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>今日の時間割</Text>
            <Text style={styles.dateText}>{getDayString()}</Text>
          </View>
          {renderTodayCourses()}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>直近の課題</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Assignments')} style={{ display: 'none' }}>
              <Text style={[styles.seeAll, { color: '#f06292' }]}>すべて表示</Text>
            </TouchableOpacity>
          </View>
          {renderAssignments()}
        </View>
      </ScrollView>

      <FAB
        style={[styles.fab, { backgroundColor: '#f06292' }]}
        icon="plus"
        onPress={() => navigation.navigate('Courses', { screen: 'AddCourse' })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    fontSize: 14,
  },
  courseCard: {
    marginBottom: 12,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  courseDetails: {
    marginTop: 8,
  },
  courseInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  courseTimeText: {
    fontSize: 14,
    color: '#666',
  },
  periodBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyCard: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAssignments: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  assignmentItem: {
    paddingVertical: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HomeScreen;
