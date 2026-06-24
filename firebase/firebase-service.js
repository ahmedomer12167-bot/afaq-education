// firebase/firebase-service.js
// v8.0 Firebase Firestore integration layer
// هذه الطبقة تربط الدوال القديمة getData/setData مع Firestore بدون تكسير الواجهات الحالية.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { firebaseConfig, AFAQ_FIREBASE_ENABLED } from "./firebase-config.js";

const AFAQ_PREFIX = "afaq_";

const COLLECTIONS = [
  "students",
  "teachers",
  "parents",
  "subjects",
  "stages",
  "grades",
  "subscriptions",
  "subscriptionRequests",
  "rejectedSubscriptions",
  "studentSubjects",
  "lessons",
  "assignments",
  "assignmentSubmissions",
  "exams",
  "examAttempts",
  "essayAnswers",
  "attendance",
  "attendanceRecords",
  "notifications",
  "messages",
  "results",
  "finalGrades",
  "activityLog",
  "settings",
  "levels",
  "leaderboard"
];

let app = null;
let db = null;
let auth = null;
let ready = false;
let syncingFromFirestore = false;
let unsubscribeMap = {};
let pendingWrites = [];
let listenersStarted = false;

function localKey(key){
  return AFAQ_PREFIX + key;
}

function safeParse(value, fallback){
  try { return JSON.parse(value); } catch(e){ return fallback; }
}

function isArrayStore(key){
  return COLLECTIONS.indexOf(key) !== -1 && key !== "settings";
}

function normalizeDoc(item){
  if(!item || typeof item !== "object") item = {};
  if(!item.id) item.id = (crypto.randomUUID ? crypto.randomUUID() : ("id_" + Date.now() + "_" + Math.random().toString(16).slice(2)));
  return item;
}

function dispatchSync(key){
  try{
    window.dispatchEvent(new CustomEvent("afaq:data-changed", {detail:{key:key}}));
  }catch(e){}
}

async function writeArrayToFirestore(key, arr){
  if(!ready || syncingFromFirestore) return;
  arr = Array.isArray(arr) ? arr : [];
  const col = collection(db, key);
  await Promise.all(arr.map(function(item){
    item = normalizeDoc(item);
    item.updatedAtServer = serverTimestamp();
    return setDoc(doc(col, item.id), item, {merge:true});
  }));
}

async function writeObjectToFirestore(key, obj){
  if(!ready || syncingFromFirestore) return;
  obj = obj || {};
  obj.id = "main";
  obj.updatedAtServer = serverTimestamp();
  await setDoc(doc(collection(db, key), "main"), obj, {merge:true});
}

async function flushPendingWrites(){
  if(!ready || !pendingWrites.length) return;
  const list = pendingWrites.slice();
  pendingWrites = [];
  for(const item of list){
    try{
      if(item.kind === "array") await writeArrayToFirestore(item.key, item.value);
      else await writeObjectToFirestore(item.key, item.value);
    }catch(e){
      console.warn("AFAQ Firebase pending write failed:", item.key, e);
      pendingWrites.push(item);
    }
  }
}

function startCollectionListener(key){
  if(unsubscribeMap[key]) return;
  unsubscribeMap[key] = onSnapshot(collection(db, key), function(snapshot){
    syncingFromFirestore = true;
    try{
      if(key === "settings"){
        let obj = {};
        snapshot.forEach(function(d){
          if(d.id === "main") obj = Object.assign({}, d.data());
        });
        delete obj.updatedAtServer;
        localStorage.setItem(localKey(key), JSON.stringify(obj));
      }else{
        const arr = [];
        snapshot.forEach(function(d){
          const data = Object.assign({id:d.id}, d.data());
          delete data.updatedAtServer;
          arr.push(data);
        });
        arr.sort(function(a,b){
          const da = a.createdAt || a.createdAtLocal || "";
          const dbb = b.createdAt || b.createdAtLocal || "";
          return String(dbb).localeCompare(String(da));
        });
        localStorage.setItem(localKey(key), JSON.stringify(arr));
      }
      dispatchSync(key);
    }finally{
      syncingFromFirestore = false;
    }
  }, function(err){
    console.warn("AFAQ Firebase listener error:", key, err);
  });
}

function startRealtimeListeners(){
  if(!ready || listenersStarted) return;
  listenersStarted = true;
  COLLECTIONS.forEach(startCollectionListener);
}

function installLegacyBridge(){
  const originalSetItem = localStorage.setItem.bind(localStorage);

  window.afaqFirebase = {
    enabled: AFAQ_FIREBASE_ENABLED,
    ready: function(){ return ready; },
    db: function(){ return db; },
    collections: COLLECTIONS,
    syncNow: flushPendingWrites,
    startRealtimeListeners: startRealtimeListeners
  };

  const oldGetData = window.getData;
  const oldSetData = window.setData;
  const oldGetObj = window.getObj;
  const oldSetObj = window.setObj;

  window.getData = function(key){
    const value = safeParse(localStorage.getItem(localKey(key)), []);
    return Array.isArray(value) ? value : [];
  };

  window.setData = function(key, arr){
    arr = Array.isArray(arr) ? arr.map(normalizeDoc) : [];
    originalSetItem(localKey(key), JSON.stringify(arr));
    dispatchSync(key);

    if(AFAQ_FIREBASE_ENABLED){
      if(ready) writeArrayToFirestore(key, arr).catch(function(e){ console.warn("AFAQ write failed:", key, e); });
      else pendingWrites.push({kind:"array", key:key, value:arr});
    }
  };

  window.getObj = function(key){
    const value = safeParse(localStorage.getItem(localKey(key)), {});
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  };

  window.setObj = function(key, obj){
    obj = obj || {};
    originalSetItem(localKey(key), JSON.stringify(obj));
    dispatchSync(key);

    if(AFAQ_FIREBASE_ENABLED){
      if(ready) writeObjectToFirestore(key, obj).catch(function(e){ console.warn("AFAQ object write failed:", key, e); });
      else pendingWrites.push({kind:"object", key:key, value:obj});
    }
  };

  // Compatibility if some code still reads direct localStorage.
  window.addEventListener("afaq:data-changed", function(e){
    try{
      const key = e.detail && e.detail.key;
      if(key) localStorage.setItem(AFAQ_PREFIX + "sync_" + key, String(Date.now()));
    }catch(err){}
  });
}

async function initFirebase(){
  installLegacyBridge();

  if(!AFAQ_FIREBASE_ENABLED){
    console.warn("AFAQ Firebase: firebase-config.js still has placeholders. Running in local fallback mode.");
    document.documentElement.setAttribute("data-firebase","disabled");
    return;
  }

  try{
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    try{
      await enableIndexedDbPersistence(db);
    }catch(e){
      // Persistence may fail in multi-tab mode; Firestore still works.
      console.warn("AFAQ Firebase persistence skipped:", e && e.code ? e.code : e);
    }

    await signInAnonymously(auth);

    onAuthStateChanged(auth, function(user){
      if(user){
        ready = true;
        document.documentElement.setAttribute("data-firebase","ready");
        startRealtimeListeners();
        flushPendingWrites();
        console.log("AFAQ Firebase connected:", user.uid);
      }
    });
  }catch(e){
    ready = false;
    document.documentElement.setAttribute("data-firebase","error");
    console.error("AFAQ Firebase connection error:", e);
    alert("تعذر الاتصال بـ Firebase. تأكد من apiKey و appId في firebase-config.js ومن تفعيل Anonymous Authentication.");
  }
}

initFirebase();
