import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs, serverTimestamp, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBPW5fh4PgyQD0iJfPqWlmiPvm9gWuZj5w",
  authDomain: "afaq-educational-platform.firebaseapp.com",
  projectId: "afaq-educational-platform",
  storageBucket: "afaq-educational-platform.firebasestorage.app",
  messagingSenderId: "978120767901",
  appId: "1:978120767901:web:882f31723a2656c07f9774"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const fb = { doc, setDoc, getDoc, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs, serverTimestamp, orderBy };

export const DEFAULT_SETTINGS = {
  platformName: 'آفاق التعليمية',
  subtitle: 'منصة أحياء خاصة بطلابك',
  welcome: 'مرحباً بك في',
  footer: '© 2026 آفاق التعليمية - جميع الحقوق محفوظة',
  masterNumber: '1234 5678 9012 3456',
  adminCode: '2026',
  acceptMessage: 'تم قبول اشتراكك بنجاح',
  rejectMessage: 'تم رفض طلب الاشتراك',
  subscriptionsOpen: true
};

export async function ensureSettings(){
  const ref = doc(db, 'settings', 'main');
  const snap = await getDoc(ref);
  if(!snap.exists()) await setDoc(ref, DEFAULT_SETTINGS, { merge:true });
  else await setDoc(ref, { ...DEFAULT_SETTINGS, ...snap.data() }, { merge:true });
}
