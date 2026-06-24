// firebase/firebase-config.js
// الإصدار v8.0 - اربط هذا الملف بكود Firebase الحقيقي من صفحة Add Firebase SDK.
// ملاحظة: projectId معروف، لكن apiKey و appId يجب نسخهما نصاً من Firebase Console حتى يعمل الربط 100%.

export const firebaseConfig = {
  apiKey: "PUT_YOUR_API_KEY_HERE",
  authDomain: "afaq-educational-platform.firebaseapp.com",
  projectId: "afaq-educational-platform",
  storageBucket: "afaq-educational-platform.firebasestorage.app",
  messagingSenderId: "978120767991",
  appId: "PUT_YOUR_APP_ID_HERE"
};

export const AFAQ_FIREBASE_ENABLED = !firebaseConfig.apiKey.includes("PUT_") && !firebaseConfig.appId.includes("PUT_");
