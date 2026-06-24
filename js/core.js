
import { firebaseConfig, AFAQ_FIREBASE_ENABLED } from "../firebase/firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export const DB_KEYS = ["settings","stages","subjects","teachers","students","parents","subscriptions","subscriptionRequests","subjectRequests","lessons","assignments","assignmentSubmissions","exams","examAttempts","attendance","attendanceRecords","notifications","messages","finalResults","points","activityLog"];
const P="afaq_v9_";
let app,auth,db,ready=false,subs={},cache={},readyResolve;
export const readyPromise=new Promise(r=>readyResolve=r);

export function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
export function clean(v){return String(v||"").trim().replace(/\s+/g," ").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").toLowerCase()}
export function code(v){return String(v||"").trim().replace(/\s+/g,"").toUpperCase()}
export function eq(a,b){return clean(a)===clean(b)}
export function today(){return new Date().toISOString().slice(0,10)}
export function now(){return new Date().toLocaleString("ar-IQ")}
export function isActive(x){let s=clean(x?.status), sub=clean(x?.subscriptionStatus);return !["موقوف","موقوفه","معطل","متوقف"].includes(s)&&!["منتهي","موقوف"].includes(sub)}
function localGet(k,f){try{return JSON.parse(localStorage.getItem(P+k)||JSON.stringify(f))}catch(e){return f}}
function localSet(k,v){localStorage.setItem(P+k,JSON.stringify(v))}
export function getData(k){return cache[k] || localGet(k, k==="settings"?{}:[])}
export function getObj(k){return getData(k)||{}}
function putCache(k,v){cache[k]=v;localSet(k,v);window.dispatchEvent(new CustomEvent("afaq-sync",{detail:{key:k}}))}
function normalize(k,obj){
  obj=obj||{}; obj.id=obj.id||id();
  if(k==="students"||k==="subscriptions"){
    let n=String(obj.name||obj.studentName||"").trim().replace(/\s+/g," ");
    let st=String(obj.stage||obj.grade||"").trim().replace(/\s+/g," ");
    let c=code(obj.code||obj.studentCode);
    obj={...obj,name:n,studentName:n,stage:st,grade:st,code:c,studentCode:c,parentCode:code(obj.parentCode||c),status:obj.status||"مفعل",subscriptionStatus:obj.subscriptionStatus||"نشط"};
  }
  if(k==="teachers"){
    let sub=String(obj.subject||obj.subjectName||"").trim();
    let st=String(obj.stage||obj.grade||"").trim();
    obj={...obj,name:String(obj.name||"").trim().replace(/\s+/g," "),subject:sub,subjectName:sub,stage:st,grade:st,teacherCode:code(obj.teacherCode||obj.code),subjectCode:code(obj.subjectCode||subjectCode(sub,st)),status:obj.status||"مفعل"};
  }
  if(k==="subjects") obj={...obj,name:String(obj.name||obj.subject||"").trim(),stage:String(obj.stage||obj.grade||"").trim(),code:code(obj.code||obj.subjectCode),status:obj.status||"مفعلة",visibility:obj.visibility||"ظاهر"};
  if(k==="stages") obj={...obj,name:String(obj.name||obj.stage||"").trim(),status:obj.status||"مفعلة",visibility:obj.visibility||"ظاهر"};
  return obj;
}
export async function setData(k,arr){
  arr=Array.isArray(arr)?arr.map(x=>normalize(k,x)):[];
  putCache(k,arr);
  if(!ready||k==="settings") return;
  const batch=writeBatch(db), col=collection(db,k);
  const remote=await getDocs(col); const next=new Set(arr.map(x=>x.id));
  arr.forEach(x=>batch.set(doc(col,x.id),{...x,updatedAtServer:serverTimestamp()},{merge:true}));
  remote.forEach(d=>{if(!next.has(d.id)) batch.delete(doc(col,d.id))});
  await batch.commit();
}
export async function setObj(k,obj){
  putCache(k,obj||{});
  if(ready) await setDoc(doc(collection(db,k),"main"),{...(obj||{}),id:"main",updatedAtServer:serverTimestamp()},{merge:true});
}
export async function addItem(k,obj){let arr=getData(k); obj=normalize(k,obj); arr.unshift(obj); await setData(k,arr); return obj}
export async function updateItem(k,idv,patch){let arr=getData(k).map(x=>x.id===idv?normalize(k,{...x,...patch}):x); await setData(k,arr)}
export async function deleteItem(k,idv){let arr=getData(k).filter(x=>x.id!==idv); await setData(k,arr); if(ready) await deleteDoc(doc(collection(db,k),idv)).catch(()=>{})}
export function settings(){return {...{platformName:"آفاق التعليمية",adminCode:"1234",footer:"آفاق التعليمية"},...getObj("settings")}}
export async function saveSettings(o){await setObj("settings",{...settings(),...o})}
export function stages(){let a=getData("stages"); return a.length?a:[{id:"s1",name:"الأول متوسط",status:"مفعلة",visibility:"ظاهر"},{id:"s2",name:"الثاني متوسط",status:"مفعلة",visibility:"ظاهر"},{id:"s3",name:"الثالث متوسط",status:"مفعلة",visibility:"ظاهر"}]}
export function subjects(stage=""){return getData("subjects").filter(s=>(!stage||eq(s.stage,stage)) && s.visibility!=="مخفي" && clean(s.status)!=="موقوفه")}
export function subjectCode(subject,stage){let s=getData("subjects").find(x=>eq(x.name,subject)&&(!stage||eq(x.stage,stage)));return s?code(s.code):""}
export function findStudent(name,stage,c){c=code(c);return getData("students").find(s=>eq(s.name||s.studentName,name)&&eq(s.stage||s.grade,stage)&&code(s.code||s.studentCode)===c&&isActive(s))}
export function findTeacher(name,subject,stage,c){c=code(c);return getData("teachers").find(t=>eq(t.name,name)&&eq(t.subject,subject)&&eq(t.stage,stage)&&code(t.teacherCode||t.code)===c&&isActive(t))}
export function findParent(name,c){c=code(c);return getData("parents").find(p=>eq(p.name,name)&&code(p.code||p.parentCode)===c) || getData("students").map(s=>({id:"p_"+s.id,name:s.parentName,code:s.parentCode||s.code,studentName:s.name,studentCode:s.code})).find(p=>eq(p.name,name)&&code(p.code)===c)}
export async function approveSubscription(reqId, studentCode){
  let req=getData("subscriptionRequests").find(x=>x.id===reqId); if(!req) return null;
  let st=normalize("students",{name:req.name||req.studentName,parentName:req.parentName,stage:req.stage||req.grade,phone:req.phone,code:studentCode,status:"مفعل",subscriptionStatus:"نشط",amount:req.amount,startDate:req.startDate||today(),endDate:req.endDate});
  await addOrUpdateBy("students",st,x=>code(x.code)===code(st.code)|| (eq(x.name,st.name)&&eq(x.stage,st.stage)));
  if(st.parentName) await addOrUpdateBy("parents",{id:id(),name:st.parentName,studentName:st.name,studentCode:st.code,phone:st.phone,code:st.code,parentCode:st.code},x=>eq(x.name,st.parentName)&&code(x.code)===code(st.code));
  await addItem("subscriptions",{...st,studentId:st.id,status:"نشط"});
  await setData("subscriptionRequests",getData("subscriptionRequests").filter(x=>x.id!==reqId));
  await notify({target:"student",studentCode:st.code,title:"تم تفعيل حسابك",body:"يمكنك الآن تسجيل الدخول إلى المنصة"});
  return st;
}
async function addOrUpdateBy(k,obj,pred){let arr=getData(k);let i=arr.findIndex(pred); if(i>=0) arr[i]={...arr[i],...obj}; else arr.unshift(obj); await setData(k,arr)}
export async function requestSubject(student,sub){let exists=getData("subjectRequests").find(r=>r.studentId===student.id&&r.subjectCode===sub.code&&r.status!=="rejected"); if(exists) return exists; return await addItem("subjectRequests",{studentId:student.id,studentName:student.name,stage:student.stage,subject:sub.name,subjectCode:sub.code,status:"pending",createdAt:now()})}
export async function decideSubjectRequest(idv,status,reason=""){let r=getData("subjectRequests").find(x=>x.id===idv); if(!r)return; await updateItem("subjectRequests",idv,{status,reason,decidedAt:now()}); await notify({target:"student",studentId:r.studentId,studentCode:r.studentCode,title:status==="accepted"?"تم قبول المادة":"تم رفض المادة",body:status==="accepted"?`تم قبولك في ${r.subject}`:`تم رفض ${r.subject}: ${reason}`})}
export function acceptedSubjects(student){let reqs=getData("subjectRequests").filter(r=>r.studentId===student.id&&r.status==="accepted").map(r=>r.subjectCode);return getData("subjects").filter(s=>reqs.includes(s.code))}
export async function notify(n){return await addItem("notifications",{...n,readBy:[],createdAt:now()})}
export function visibleNotifications(role,user){
  return getData("notifications").filter(n=>{
    if(role==="admin")return true;
    if(role==="teacher")return n.target==="teachers"||n.target==="all"||eq(n.teacherName,user.name)||eq(n.subject,user.subject)||eq(n.subjectCode,user.subjectCode);
    if(role==="student")return n.target==="students"||n.target==="all"||n.studentId===user.id||code(n.studentCode)===code(user.code)||eq(n.stage,user.stage);
    if(role==="parent")return n.target==="parents"||n.target==="all"||code(n.studentCode)===code(user.studentCode);
    return false;
  }).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
}
export function unreadCount(role,user){let uid=user?.id||user?.code||role; return visibleNotifications(role,user).filter(n=>!(n.readBy||[]).includes(uid)).length}
export async function markRead(role,user){let uid=user?.id||user?.code||role; let ids=new Set(visibleNotifications(role,user).map(n=>n.id)); let arr=getData("notifications").map(n=>ids.has(n.id)?{...n,readBy:[...(new Set([...(n.readBy||[]),uid]))]}:n); await setData("notifications",arr)}
export function fileToBase64(file,cb){let r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(file)}
export function mediaLinks(x){let h=""; if(x.pdfUrl)h+=`<a class="media-link" target="_blank" href="${x.pdfUrl}">📄 فتح PDF</a>`; if(x.videoUrl)h+=`<a class="media-link" target="_blank" href="${x.videoUrl}">🎥 فتح الفيديو</a>`; return h}
function seedLocal(){
  if(getData("stages").length===0) localSet("stages",stages());
  if(Object.keys(getObj("settings")).length===0) localSet("settings",settings());
}
function listen(k){
  if(subs[k])return;
  subs[k]=onSnapshot(collection(db,k),snap=>{
    if(k==="settings"){let o={};snap.forEach(d=>{if(d.id==="main")o=d.data()});putCache(k,o)}
    else{let arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));putCache(k,arr)}
  },e=>{console.warn("Firestore listener",k,e);document.documentElement.dataset.firebase="error"})
}
export async function init(){
  seedLocal();
  if(!AFAQ_FIREBASE_ENABLED){document.documentElement.dataset.firebase="disabled";readyResolve(false);return}
  try{
    document.documentElement.dataset.firebase="connecting";
    app=initializeApp(firebaseConfig); auth=getAuth(app); db=getFirestore(app);
    await signInAnonymously(auth);
    onAuthStateChanged(auth,async u=>{
      if(!u)return; ready=true; document.documentElement.dataset.firebase="ready";
      for(const k of DB_KEYS){listen(k)}
      // migrate only if remote is empty
      for(const k of DB_KEYS){
        let local=getData(k); if(k==="settings") { if(Object.keys(local).length) await setDoc(doc(collection(db,k),"main"),{...local,id:"main",updatedAtServer:serverTimestamp()},{merge:true}).catch(()=>{})}
        else if(Array.isArray(local)&&local.length){ let snap=await getDocs(collection(db,k)); if(snap.empty) for(const x of local) await setDoc(doc(collection(db,k),x.id||id()),{...x,id:x.id||id(),updatedAtServer:serverTimestamp()},{merge:true}).catch(()=>{})}
      }
      readyResolve(true);
    })
  }catch(e){console.error(e);document.documentElement.dataset.firebase="error";readyResolve(false)}
}
export function onSync(fn){window.addEventListener("afaq-sync",fn)}
export function currentUser(role){try{return JSON.parse(sessionStorage.getItem("afaq_current_"+role)||"null")}catch(e){return null}}
export function logout(){sessionStorage.clear();location.href="../index.html"}
init();


// ===== v10.0 Complete education suite helpers =====
export function scoreStudent(student){
  let sid=student.id, sc=code(student.code), name=student.name;
  let exams=getData("examAttempts").filter(x=>x.studentId===sid||code(x.studentCode)===sc||eq(x.studentName,name));
  let assignments=getData("assignmentSubmissions").filter(x=>x.studentId===sid||code(x.studentCode)===sc||eq(x.studentName,name));
  let attendance=getData("attendanceRecords").filter(x=>x.studentId===sid||code(x.studentCode)===sc);
  let total=0;
  total += exams.reduce((t,x)=>t+Number(x.score||0),0);
  total += assignments.reduce((t,x)=>t+Number(x.grade||0),0);
  total += attendance.filter(x=>x.status==="حاضر").length*5;
  return total;
}
export function levelFromPoints(p){
  p=Number(p||0);
  if(p>=500)return "أسطورة";
  if(p>=350)return "خبير";
  if(p>=220)return "متفوق";
  if(p>=100)return "مجتهد";
  return "مبتدئ";
}
export function leaderboard(stage=""){
  return getData("students").filter(s=>!stage||eq(s.stage,stage)).map(s=>{
    let points=scoreStudent(s);
    return {...s,points,level:levelFromPoints(points)};
  }).sort((a,b)=>b.points-a.points);
}
export function studentProfile(student){
  let sid=student.id, sc=code(student.code), name=student.name;
  return {
    student,
    points:scoreStudent(student),
    level:levelFromPoints(scoreStudent(student)),
    subjects:acceptedSubjects(student),
    exams:getData("examAttempts").filter(x=>x.studentId===sid||code(x.studentCode)===sc||eq(x.studentName,name)),
    assignments:getData("assignmentSubmissions").filter(x=>x.studentId===sid||code(x.studentCode)===sc||eq(x.studentName,name)),
    attendance:getData("attendanceRecords").filter(x=>x.studentId===sid||code(x.studentCode)===sc),
    results:getData("finalResults").filter(x=>x.studentId===sid||code(x.studentCode)===sc||eq(x.studentName,name))
  }
}
export function teacherProfile(teacher){
  return {
    teacher,
    lessons:getData("lessons").filter(x=>x.teacherId===teacher.id||eq(x.teacherName,teacher.name)),
    assignments:getData("assignments").filter(x=>x.teacherId===teacher.id||eq(x.teacherName,teacher.name)),
    exams:getData("exams").filter(x=>x.teacherId===teacher.id||eq(x.teacherName,teacher.name)),
    students:getData("subjectRequests").filter(x=>code(x.subjectCode)===code(teacher.subjectCode)&&x.status==="accepted")
  }
}
export function globalSearch(q){
  q=clean(q); if(!q)return [];
  const sets=[
    ["طالب","students",["name","code","stage","parentName","phone"]],
    ["مدرس","teachers",["name","subject","stage","teacherCode","subjectCode"]],
    ["ولي أمر","parents",["name","studentName","code","phone"]],
    ["مادة","subjects",["name","stage","code","teacher"]],
    ["اشتراك","subscriptions",["studentName","name","stage","code","phone"]],
    ["درس","lessons",["title","subject","stage","teacherName"]],
    ["واجب","assignments",["title","subject","stage","teacherName"]],
    ["اختبار","exams",["title","subject","stage","teacherName"]]
  ];
  let out=[];
  sets.forEach(([label,key,fields])=>{
    getData(key).forEach(item=>{
      let text=fields.map(f=>item[f]||"").join(" ");
      if(clean(text).includes(q))out.push({label,key,item,title:item.name||item.studentName||item.title||item.subject||"عنصر"});
    });
  });
  return out.slice(0,80);
}
export function exportCsv(filename, rows){
  if(!rows.length){alert("لا توجد بيانات للتصدير");return}
  const headers=Object.keys(rows[0]);
  const csv=[headers.join(",")].concat(rows.map(r=>headers.map(h=>`"${String(r[h]??"").replace(/"/g,'""')}"`).join(","))).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href);
}
export function printReport(title, html){
  const w=window.open("","_blank");
  w.document.write(`<html dir="rtl"><head><title>${title}</title><style>body{font-family:Tahoma;padding:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:8px}</style></head><body><h1>${title}</h1>${html}</body></html>`);
  w.document.close();w.print();
}
export function createExamResult(exam, student, answers){
  let score=0,total=0,details=[];
  (exam.questions||[]).forEach((q,i)=>{
    total+=Number(q.score||1);
    let ok=false;
    if(q.type==="essay") ok=false;
    else ok=clean(answers[i])===clean(q.answer);
    if(ok)score+=Number(q.score||1);
    details.push({question:q.text,answer:answers[i],correct:q.answer,ok});
  });
  return {examId:exam.id,examTitle:exam.title,studentId:student.id,studentCode:student.code,studentName:student.name,subject:exam.subject,subjectCode:exam.subjectCode,score,total,details,status:"مصحح تلقائياً",createdAt:now()};
}
export function monthlyAlerts(student){
  let p=studentProfile(student), alerts=[];
  let absent=p.attendance.filter(x=>x.status==="غائب").length;
  if(absent>=3)alerts.push("غياب متكرر");
  if(p.exams.length && p.exams.reduce((t,x)=>t+Number(x.score||0),0)/p.exams.length<50)alerts.push("انخفاض في نتائج الاختبارات");
  if(student.endDate && new Date(student.endDate)<new Date(Date.now()+7*86400000))alerts.push("الاشتراك ينتهي قريباً");
  return alerts;
}
export async function backupNow(){
  let data={date:now()};
  DB_KEYS.forEach(k=>data[k]=getData(k));
  localStorage.setItem("afaq_v10_backup",JSON.stringify(data));
  return data;
}
export async function restoreBackup(){
  let raw=localStorage.getItem("afaq_v10_backup"); if(!raw)return false;
  let data=JSON.parse(raw);
  for(const k of DB_KEYS){ if(data[k]){ if(k==="settings")await setObj(k,data[k]); else await setData(k,data[k]); } }
  return true;
}
