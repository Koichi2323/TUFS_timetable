   // Firebase設定
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, query, where, getDocs } from 'firebase/firestore';
// import { getAnalytics } from "firebase/analytics";

// Firebaseの設定
const firebaseConfig = {
  apiKey: "AIzaSyACA_VS-iQ4wEbCJYdL2URUEJu19Xiwf9c", 
  authDomain: "tufs-60fe7.firebaseapp.com", 
  projectId: "tufs-60fe7", 
  storageBucket: "tufs-60fe7.firebaseapp.com", 
  messagingSenderId: "355937711753", 
  appId: "1:355937711753:web:425b1ab346d220824d3858", 
  measurementId: "G-CXWE60F3EE", 
};

console.log("Firebase Config being used (hardcoded & updated from console):", firebaseConfig);
console.log("API Key being used (hardcoded):", firebaseConfig.apiKey);

// Firebaseの初期化
const app = initializeApp(firebaseConfig); 
const auth = getAuth(app); 
const db = getFirestore(app); 
// const analytics = getAnalytics(app);

// 授業データ用のコレクション参照
const coursesRef = collection(db, 'courses'); 

// 授業データの取得関数
/**
 * Firestoreから全ての授業データを取得する
 * @returns {Promise<Array<import('./src/types').Course>>} 授業データの配列
 */
async function fetchCourses() {
  try {
    const querySnapshot = await getDocs(coursesRef);
    const courses = [];
    querySnapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    return courses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

// 授業データの追加関数
async function addCourse(courseData) {
  try {
    // IDがすでに存在するかチェック
    if (courseData.id) {
      const docRef = doc(db, 'courses', courseData.id);
      await setDoc(docRef, courseData);
      return { success: true, id: courseData.id };
    } else {
      const docRef = await addDoc(coursesRef, courseData);
      return { success: true, id: docRef.id };
    }
  } catch (error) {
    console.error('Error adding course:', error);
    return { success: false, error };
  }
}

// 授業データの更新関数
async function updateCourse(courseId, courseData) {
  try {
    const docRef = doc(db, 'courses', courseId);
    await updateDoc(docRef, courseData);
    return { success: true };
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, error };
  }
}

// 授業データの削除関数
async function deleteCourse(courseId) {
  try {
    const docRef = doc(db, 'courses', courseId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false, error };
  }
}

// テキスト検索による授業データ検索関数
/**
 * 授業データをテキスト検索する
 * @param {string} query 検索クエリ
 * @returns {Promise<Array<import('./src/types').Course>>} 検索結果の授業データ配列
 */
async function searchCourses(query) {
  try {
    // 全ての授業データを取得
    const querySnapshot = await getDocs(coursesRef);
    const courses = [];

    // 検索クエリを小文字に変換
    const lowerCaseQuery = query.toLowerCase();

    // クライアントサイドでフィルタリング
    querySnapshot.forEach((doc) => {
      const courseData = { id: doc.id, ...doc.data() };

      // 授業名、教員名、授業題目で検索
      const matchesName = courseData.name && courseData.name.toLowerCase().includes(lowerCaseQuery);
      const matchesProfessor = courseData.professor && courseData.professor.toLowerCase().includes(lowerCaseQuery);
      const matchesTitle = courseData.title && courseData.title.toLowerCase().includes(lowerCaseQuery);

      if (matchesName || matchesProfessor || matchesTitle) {
        courses.push(courseData);
      }
    });

    return courses;
  } catch (error) {
    console.error('Error searching courses:', error);
    return [];
  }
}

export {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  fetchCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  searchCourses
};
