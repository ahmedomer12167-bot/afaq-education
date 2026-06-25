// firebase/firebase-config.js
// ضع بيانات مشروع Firebase الحقيقي هنا.
// هذا الإصدار v14 يستخدم Collections جديدة تبدأ بـ v14_ حتى لا تختلط بأي بيانات قديمة.

export const firebaseConfig = {
   apiKey: "AIzaSyBPW5fh4PgyQD0iJfPqWlmiPvm9gWuZj5w",
  authDomain: "afaq-educational-platform.firebaseapp.com",
  projectId: "afaq-educational-platform",
  storageBucket: "afaq-educational-platform.firebasestorage.app",
  messagingSenderId: "978120767901",
  appId: "1:978120767901:web:882f31723a2656c07f9774"
};

export const AFAQ_FIREBASE_ENABLED =
  !firebaseConfig.apiKey.includes("PUT_") &&
  !firebaseConfig.projectId.includes("PUT_") &&
  !firebaseConfig.appId.includes("PUT_");
