// firebase/firebase-config.js
// الإصدار v8.0 - اربط هذا الملف بكود Firebase الحقيقي من صفحة Add Firebase SDK.
// ملاحظة: projectId معروف، لكن apiKey و appId يجب نسخهما نصاً من Firebase Console حتى يعمل الربط 100%.

export const firebaseConfig = {
  apiKey: "AIzaSyBPW5fh4PgyQD0iJfPqWlmiPvm9gWuZj5w",
  authDomain: "afaq-educational-platform.firebaseapp.com",
  projectId: "afaq-educational-platform",
  storageBucket: "afaq-educational-platform.firebasestorage.app",
  messagingSenderId: "978120767991",
  appId: "1:978120767901:web:882f31723a2656c07f9774"
};

export const AFAQ_FIREBASE_ENABLED = !firebaseConfig.apiKey.includes("PUT_") && !firebaseConfig.appId.includes("PUT_");
