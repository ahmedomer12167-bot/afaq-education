// firebase/firebase-service.js
// v8.1 Firebase Full Sync Layer
// Firestore يصبح مصدر البيانات الرئيسي، مع نسخة محلية مرآة فقط لتسريع الواجهة.

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
  enableIndexedDbPersistence,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { firebaseConfig, AFAQ_FIREBASE_ENABLED } from "./firebase-config.js";

const AFAQ_PREFIX = "afaq40_";

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
  "leaderboard",
  "requests",
  "payments",
  "honor"
];

const OBJECT_STORES = ["settings"];

let app = null;
let db = null;
let auth = null;
let ready = false;
let syncingFromFirestore = false;
let listenersStarted = false;
let pendingWrites = [];
let unsubscribeMap = {};
let remoteIds = {};
let firstSnapshotDone = {};
let bootStarted = false;
let resolveReadyPromise = null;
let readyPromise = new Promise(function(resolve){ resolveReadyPromise = resolve; });

function localKey(key){ return AFAQ_PREFIX + key; }

function safeParse(value, fallback){
  try { return JSON.parse(value); } catch(e){ return fallback; }
}

function isObjectStore(key){
  return OBJECT_STORES.indexOf(key) !== -1;
}

function makeId(){
  if(window.id) return window.id();
  return (crypto.randomUUID ? crypto.randomUUID() : ("id_" + Date.now() + "_" + Math.random().toString(16).slice(2)));
}

function normalizeDoc(item){
  if(!item || typeof item !== "object") item = {};
  if(!item.id) item.id = makeId();
  return item;
}

function getLocalArray(key){
  const value = safeParse(localStorage.getItem(localKey(key)), []);
  return Array.isArray(value) ? value : [];
}

function setLocalArray(key, arr){
  localStorage.setItem(localKey(key), JSON.stringify(Array.isArray(arr) ? arr : []));
}

function getLocalObject(key){
  const value = safeParse(localStorage.getItem(localKey(key)), {});
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function setLocalObject(key, obj){
  localStorage.setItem(localKey(key), JSON.stringify(obj || {}));
}

function dispatchSync(key){
  try{
    localStorage.setItem(localKey("sync_" + key), String(Date.now()));
    window.dispatchEvent(new CustomEvent("afaq:data-changed", {detail:{key:key}}));
  }catch(e){}
}

function markStatus(status){
  document.documentElement.setAttribute("data-firebase", status);
  window.dispatchEvent(new CustomEvent("afaq:firebase-status", {detail:{status:status}}));
}

async function collectionEmpty(key){
  const snap = await getDocs(collection(db, key));
  return snap.empty;
}

async function migrateLocalCollectionIfNeeded(key){
  if(!ready) return;
  if(isObjectStore(key)){
    const obj = getLocalObject(key);
    if(obj && Object.keys(obj).length){
      const empty = await collectionEmpty(key);
      if(empty){
        await setDoc(doc(collection(db, key), "main"), Object.assign({}, obj, {id:"main", updatedAtServer:serverTimestamp()}), {merge:true});
      }
    }
    return;
  }

  const arr = getLocalArray(key).map(normalizeDoc);
  if(arr.length){
    const empty = await collectionEmpty(key);
    if(empty){
      await writeArrayToFirestore(key, arr, {replace:false});
    }
  }
}

async function migrateLocalDataToFirestore(){
  for(const key of COLLECTIONS){
    try{ await migrateLocalCollectionIfNeeded(key); }
    catch(e){ console.warn("AFAQ migration skipped:", key, e); }
  }
}

async function writeArrayToFirestore(key, arr, opts){
  if(!ready || syncingFromFirestore) return;
  opts = opts || {};
  arr = Array.isArray(arr) ? arr.map(normalizeDoc) : [];

  const colRef = collection(db, key);
  const batch = writeBatch(db);
  const nextIds = new Set();

  arr.forEach(function(item){
    nextIds.add(item.id);
    const data = Object.assign({}, item, {
      updatedAtServer: serverTimestamp(),
      updatedAtLocal: new Date().toISOString()
    });
    batch.set(doc(colRef, item.id), data, {merge:true});
  });

  if(opts.replace !== false){
    let currentIds = remoteIds[key];
    if(!currentIds){
      const snap = await getDocs(colRef);
      currentIds = new Set();
      snap.forEach(function(d){ currentIds.add(d.id); });
    }
    currentIds.forEach(function(oldId){
      if(!nextIds.has(oldId)) batch.delete(doc(colRef, oldId));
    });
  }

  await batch.commit();
}

async function writeObjectToFirestore(key, obj){
  if(!ready || syncingFromFirestore) return;
  obj = obj || {};
  const data = Object.assign({}, obj, {
    id:"main",
    updatedAtServer: serverTimestamp(),
    updatedAtLocal: new Date().toISOString()
  });
  await setDoc(doc(collection(db, key), "main"), data, {merge:true});
}

async function flushPendingWrites(){
  if(!ready || !pendingWrites.length) return;
  const list = pendingWrites.slice();
  pendingWrites = [];
  for(const item of list){
    try{
      if(item.kind === "array") await writeArrayToFirestore(item.key, item.value, {replace:true});
      else await writeObjectToFirestore(item.key, item.value);
    }catch(e){
      console.warn("AFAQ pending write failed:", item.key, e);
      pendingWrites.push(item);
    }
  }
}

function startCollectionListener(key){
  if(unsubscribeMap[key]) return;

  unsubscribeMap[key] = onSnapshot(collection(db, key), function(snapshot){
    syncingFromFirestore = true;
    try{
      const ids = new Set();

      if(isObjectStore(key)){
        let obj = {};
        snapshot.forEach(function(d){
          ids.add(d.id);
          if(d.id === "main") obj = Object.assign({}, d.data());
        });
        delete obj.updatedAtServer;
        setLocalObject(key, obj);
      }else{
        const arr = [];
        snapshot.forEach(function(d){
          ids.add(d.id);
          const data = Object.assign({id:d.id}, d.data());
          delete data.updatedAtServer;
          arr.push(data);
        });
        arr.sort(function(a,b){
          const aa = a.createdAt || a.createdAtLocal || a.updatedAtLocal || "";
          const bb = b.createdAt || b.createdAtLocal || b.updatedAtLocal || "";
          return String(bb).localeCompare(String(aa));
        });
        setLocalArray(key, arr);
      }

      remoteIds[key] = ids;
      firstSnapshotDone[key] = true;
      dispatchSync(key);
    }finally{
      syncingFromFirestore = false;
    }
  }, function(err){
    console.warn("AFAQ Firebase listener error:", key, err);
    markStatus("error");
  });
}

function startRealtimeListeners(){
  if(!ready || listenersStarted) return;
  listenersStarted = true;
  COLLECTIONS.forEach(startCollectionListener);
}

function installBridge(){
  window.afaqFirebase = {
    enabled: AFAQ_FIREBASE_ENABLED,
    ready: function(){ return ready; },
    db: function(){ return db; },
    collections: COLLECTIONS,
    syncNow: flushPendingWrites,
    status: function(){ return document.documentElement.getAttribute("data-firebase") || "loading"; },
    waitForReady: function(){ return readyPromise; },
    isReady: function(){ return ready; }
  };

  window.getData = function(key){
    return getLocalArray(key);
  };

  window.setData = function(key, arr){
    arr = Array.isArray(arr) ? arr.map(normalizeDoc) : [];
    setLocalArray(key, arr);
    dispatchSync(key);

    if(AFAQ_FIREBASE_ENABLED){
      if(ready) writeArrayToFirestore(key, arr, {replace:true}).catch(function(e){ console.warn("AFAQ write failed:", key, e); markStatus("error"); });
      else pendingWrites.push({kind:"array", key:key, value:arr});
    }
  };

  window.getObj = function(key, fallback){
    const obj = getLocalObject(key);
    return Object.keys(obj).length ? obj : (fallback || {});
  };

  window.setObj = function(key, obj){
    obj = obj || {};
    setLocalObject(key, obj);
    dispatchSync(key);

    if(AFAQ_FIREBASE_ENABLED){
      if(ready) writeObjectToFirestore(key, obj).catch(function(e){ console.warn("AFAQ object write failed:", key, e); markStatus("error"); });
      else pendingWrites.push({kind:"object", key:key, value:obj});
    }
  };

  window.afaqDeleteFromStore = async function(key, id){
    const arr = getLocalArray(key).filter(function(x){ return x.id !== id; });
    window.setData(key, arr);
    if(ready){
      try{ await deleteDoc(doc(collection(db, key), id)); }
      catch(e){ console.warn("AFAQ delete failed:", key, id, e); }
    }
  };

  window.afaqForcePull = function(){
    COLLECTIONS.forEach(function(k){ dispatchSync(k); });
  };
}

async function initFirebase(){
  if(bootStarted) return;
  bootStarted = true;

  installBridge();

  if(!AFAQ_FIREBASE_ENABLED){
    console.warn("AFAQ Firebase: firebase-config.js still has placeholders. Running in local fallback mode.");
    markStatus("disabled");
    if(resolveReadyPromise) resolveReadyPromise(false);
    return;
  }

  try{
    markStatus("connecting");
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    try{ await enableIndexedDbPersistence(db); }
    catch(e){ console.warn("AFAQ persistence skipped:", e && e.code ? e.code : e); }

    await signInAnonymously(auth);

    onAuthStateChanged(auth, async function(user){
      if(user){
        ready = true;
        markStatus("ready");
        await migrateLocalDataToFirestore();
        startRealtimeListeners();
        await flushPendingWrites();
        if(resolveReadyPromise) resolveReadyPromise(true);
        console.log("AFAQ Firebase full sync connected:", user.uid);
      }
    });
  }catch(e){
    ready = false;
    console.error("AFAQ Firebase connection error:", e);
    markStatus("error");
    if(resolveReadyPromise) resolveReadyPromise(false);
    alert("تعذر الاتصال بـ Firebase. تأكد من firebase-config.js و Anonymous Authentication و Firestore Rules.");
  }
}

initFirebase();
