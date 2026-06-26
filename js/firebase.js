import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getFirestore, doc, getDoc, setDoc, addDoc, collection, query, where, getDocs,
  onSnapshot, updateDoc, deleteDoc, serverTimestamp, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: "AIzaSyBPW5fh4PgyQD0iJfPqWlmiPvm9gWuZj5w",
  authDomain: "afaq-educational-platform.firebaseapp.com",
  projectId: "afaq-educational-platform",
  storageBucket: "afaq-educational-platform.firebasestorage.app",
  messagingSenderId: "978120767901",
  appId: "1:978120767901:web:882f31723a2656c07f9774"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const FB = { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, onSnapshot, updateDoc, deleteDoc, serverTimestamp, orderBy };

export const DEFAULT_SETTINGS = {
  platformName: 'آفاق التعليمية',
  welcomeMessage: 'منصة تعليمية متكاملة للدروس والاختبارات الإلكترونية تحت إشراف الأستاذ أحمد عمر',
  footerMessage: '© 2026 آفاق التعليمية - جميع الحقوق محفوظة',
  masterNumber: '1234 5678 9012 3456',
  adminCode: '2026',
  acceptRequests: true,
  acceptMessage: 'تم قبول اشتراكك بنجاح.',
  rejectMessage: 'نعتذر، تم رفض طلب الاشتراك.',
  expiredMessage: 'انتهى اشتراكك، يرجى التجديد.'
};

export async function ensureBaseData(){
  const sRef = doc(db, 'system', 'settings');
  const snap = await getDoc(sRef);
  if(!snap.exists()) await setDoc(sRef, DEFAULT_SETTINGS, { merge: true });
  const stSnap = await getDocs(collection(db, 'stages'));
  if(stSnap.empty){
    const base = ['الأول متوسط','الثاني متوسط','الثالث متوسط','الرابع الإعدادي','الخامس الإعدادي','السادس الإعدادي'];
    for(let i=0;i<base.length;i++) await addDoc(collection(db,'stages'), { name: base[i], order: i+1, createdAt: serverTimestamp() });
  }
}
