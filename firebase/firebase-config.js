// firebase/firebase-config.js
// ضع بيانات مشروع Firebase الحقيقي هنا.
// هذا الإصدار v14 يستخدم Collections جديدة تبدأ بـ v14_ حتى لا تختلط بأي بيانات قديمة.

export const firebaseConfig = {
  apiKey: "AIzaSyBPW5fh4PgyQD0iJfPqWlmiPvm9gWuZj5w",
  authDomain: "PUT_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PUT_YOUR_PROJECT_ID",
  storageBucket: "PUT_YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PUT_YOUR_MESSAGING_SENDER_ID",
  appId: "1:978120767901:web:882f31723a2656c07f9774"
};

export const AFAQ_FIREBASE_ENABLED =
  !firebaseConfig.apiKey.includes("PUT_") &&
  !firebaseConfig.projectId.includes("PUT_") &&
  !firebaseConfig.appId.includes("PUT_");
