import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Text, Card, Button, FAB, useTheme, Chip, Searchbar, ActivityIndicator, Menu, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type AssignmentsScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

type Assignment = {
  id: string;
  title: string;
  description: string;
  dueDate: any;
  courseId: string;
  courseName: string;
  courseColor: string;
  completed: boolean;
  createdAt: any;
};

const AssignmentsScreen = ({ navigation, toggleTheme, isDarkMode }: AssignmentsScreenProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [sortOption, setSortOption] = useState<'dueDate' | 'createdAt'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const theme = useTheme();
  
  useEffect(() => {
    fetchAssignments();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [assignments, searchQuery, filterStatus, sortOption, sortDirection]);
  
  const fetchAssignments = async () => {
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(assignmentsQuery);
      const assignmentsData: Assignment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        assignmentsData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate?.toDate(),
          courseId: data.courseId,
          courseName: data.courseName,
          courseColor: data.courseColor,
          completed: data.completed || false,
          createdAt: data.createdAt?.toDate(),
        });
      });
      
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      Alert.alert('エラー', '課題の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...assignments];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (assignment) =>
          assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.courseName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus === 'completed') {
      filtered = filtered.filter((assignment) => assignment.completed);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter((assignment) => !assignment.completed);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortOption === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return sortDirection === 'asc'
          ? a.dueDate.getTime() - b.dueDate.getTime()
          : b.dueDate.getTime() - a.dueDate.getTime();
      } else {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return sortDirection === 'asc'
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
    
    setFilteredAssignments(filtered);
  };
  
  const toggleAssignmentStatus = async (assignmentId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'assignments', assignmentId), {
        completed: !currentStatus,
      });
      
      // Update local state
      setAssignments(
        assignments.map((assignment) =>
          assignment.id === assignmentId
            ? { ...assignment, completed: !currentStatus }
            : assignment
        )
      );
    } catch (error) {
      console.error('Error updating assignment status:', error);
      Alert.alert('エラー', '課題のステータス更新に失敗しました');
    }
  };
  
  const deleteAssignment = async (assignmentId: string) => {
    Alert.alert(
      '確認',
      'この課題を削除してもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'assignments', assignmentId));
              
              // Update local state
              setAssignments(
                assignments.filter((assignment) => assignment.id !== assignmentId)
              );
              
              Alert.alert('成功', '課題が削除されました');
            } catch (error) {
              console.error('Error deleting assignment:', error);
              Alert.alert('エラー', '課題の削除に失敗しました');
            }
          },
        },
      ]
    );
  };
  
  const renderAssignmentItem = ({ item }: { item: Assignment }) => {
    const isPastDue = item.dueDate && new Date() > item.dueDate && !item.completed;
    
    return (
      <Card
        style={[
          styles.assignmentCard,
          {
            borderLeftWidth: 5,
            borderLeftColor: item.courseColor || theme.colors.primary,
            backgroundColor: theme.colors.surface,
          },
        ]}
        onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: item.id })}
      >
        <Card.Content>
          <View style={styles.assignmentHeader}>
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.assignmentTitle,
                  {
                    color: theme.colors.text,
                    textDecorationLine: item.completed ? 'line-through' : 'none',
                  },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {isPastDue && (
                <Chip
                  style={{ backgroundColor: '#ff5252' }}
                  textStyle={{ color: 'white', fontSize: 10 }}
                >
                  期限超過
                </Chip>
              )}
            </View>
            <TouchableOpacity
              onPress={() => toggleAssignmentStatus(item.id, item.completed)}
            >
              <Ionicons
                name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={item.completed ? '#4caf50' : theme.colors.text}
              />
            </TouchableOpacity>
          </View>
          
          <Text
            style={[
              styles.courseInfo,
              {
                color: theme.colors.text,
                opacity: 0.7,
                textDecorationLine: item.completed ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {item.courseName}
          </Text>
          
          {item.description ? (
            <Text
              style={[
                styles.description,
                {
                  color: theme.colors.text,
                  opacity: 0.9,
                  textDecorationLine: item.completed ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
          
          {item.dueDate ? (
            <View style={styles.dueDateContainer}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.text} />
              <Text
                style={[
                  styles.dueDate,
                  {
                    color: isPastDue ? '#ff5252' : theme.colors.text,
                    textDecorationLine: item.completed ? 'line-through' : 'none',
                  },
                ]}
              >
                {format(item.dueDate, 'yyyy年MM月dd日(E) HH:mm', { locale: ja })}
              </Text>
            </View>
          ) : null}
        </Card.Content>
        
        <Card.Actions>
          <Button
            onPress={() => navigation.navigate('EditAssignment', { assignmentId: item.id })}
          >
            編集
          </Button>
          <Button
            onPress={() => deleteAssignment(item.id)}
            textColor="#ff5252"
          >
            削除
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={theme.colors.text}
        style={{ opacity: 0.5 }}
      />
      <Text style={[styles.emptyText, { color: theme.colors.text }]}>
        課題はありません
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.text, opacity: 0.7 }]}>
        右下の+ボタンをタップして新しい課題を追加してください
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>課題</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterMenuVisible(true)}
          >
            <Ionicons name="filter" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={{ x: 0, y: 0 }}
            style={styles.menu}
          >
            <Menu.Item
              onPress={() => {
                setFilterStatus('all');
                setFilterMenuVisible(false);
              }}
              title="すべて表示"
              leadingIcon="format-list-bulleted"
              trailingIcon={filterStatus === 'all' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setFilterStatus('pending');
                setFilterMenuVisible(false);
              }}
              title="未完了のみ"
              leadingIcon="clock-outline"
              trailingIcon={filterStatus === 'pending' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setFilterStatus('completed');
                setFilterMenuVisible(false);
              }}
              title="完了済みのみ"
              leadingIcon="check-circle-outline"
              trailingIcon={filterStatus === 'completed' ? 'check' : undefined}
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setSortOption('dueDate');
                setFilterMenuVisible(false);
              }}
              title="期限日で並べ替え"
              leadingIcon="calendar"
              trailingIcon={sortOption === 'dueDate' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSortOption('createdAt');
                setFilterMenuVisible(false);
              }}
              title="作成日で並べ替え"
              leadingIcon="clock"
              trailingIcon={sortOption === 'createdAt' ? 'check' : undefined}
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                setFilterMenuVisible(false);
              }}
              title={`並べ替え: ${sortDirection === 'asc' ? '昇順' : '降順'}`}
              leadingIcon={sortDirection === 'asc' ? 'sort-ascending' : 'sort-descending'}
            />
          </Menu>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons
              name={isDarkMode ? 'sunny' : 'moon'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <Searchbar
        placeholder="課題を検索"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        iconColor={theme.colors.primary}
        clearIcon="close-circle"
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            課題を読み込み中...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAssignments}
          renderItem={renderAssignmentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshing={loading}
          onRefresh={fetchAssignments}
        />
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('AddAssignment')}
      />
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
    marginRight: 16,
  },
  menu: {
    width: 250,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
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
    paddingBottom: 80,
  },
  assignmentCard: {
    marginBottom: 16,
    elevation: 2,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    flex: 1,
  },
  courseInfo: {
    fontSize: 14,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 14,
    marginLeft: 4,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default AssignmentsScreen;
