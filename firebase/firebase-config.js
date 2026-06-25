// firebase/firebase-config.js
// ضع بيانات مشروع Firebase الحقيقي هنا.
// هذا الإصدار v14 يستخدم Collections جديدة تبدأ بـ v14_ حتى لا تختلط بأي بيانات قديمة.

export const firebaseConfig = {
  apiKey: "PUT_YOUR_API_KEY_HERE",
  authDomain: "PUT_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PUT_YOUR_PROJECT_ID",
  storageBucket: "PUT_YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PUT_YOUR_MESSAGING_SENDER_ID",
  appId: "PUT_YOUR_APP_ID_HERE"
};

export const AFAQ_FIREBASE_ENABLED =
  !firebaseConfig.apiKey.includes("PUT_") &&
  !firebaseConfig.projectId.includes("PUT_") &&
  !firebaseConfig.appId.includes("PUT_");
