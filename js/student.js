
import * as A from "./core.js";import {guard,shell,panel,card,showNotifications,updateBadge,statBox} from "./dashboard.js";
const user=guard("student");const nav=[{id:"home",title:"الرئيسية",icon:"🏠"},{id:"subjects",title:"المواد",icon:"📚"},{id:"lessons",title:"الدروس",icon:"📄"},{id:"assignments",title:"الواجبات",icon:"📝"},{id:"exams",title:"الاختبارات",icon:"🧪"},{id:"results",title:"النتائج",icon:"🏆"},{id:"leaderboard",title:"لوحة الشرف",icon:"⭐"},{id:"notifications",title:"الإشعارات",icon:"🔔"},{id:"messages",title:"الرسائل",icon:"✉️"}];let draw=shell("لوحة الطالب v11","student",user,nav);let current="home";
window.openSection=async id=>{current=id;draw(id);updateBadge("student",user);if(id==="home")home();if(id==="subjects")subjects();if(id==="lessons")showBy("lessons","الدروس");if(id==="assignments")assignments();if(id==="exams")exams();if(id==="results")results();if(id==="leaderboard")leaderboard();if(id==="notifications"){await showNotifications("student",user);updateBadge("student",user)}if(id==="messages")messages()}
function home(){let p=A.studentProfile(user);content.innerHTML=panel("مرحباً "+user.name,`المرحلة: ${user.stage}`)+`<div class="stats">${statBox("النقاط",p.points)}${statBox("المستوى",p.level)}${statBox("المواد",p.subjects.length)}${statBox("إشعارات",A.unreadCount("student",user))}</div>`}
function subjects(){let accepted=A.acceptedSubjects(user).map(s=>s.code);let subs=A.subjects(user.stage);content.innerHTML=panel("موادي الدراسية","لا يظهر كود المادة للطالب.")+`<div class="card-grid">${subs.map(s=>card(s.name,`<p>${s.teacher||"بانتظار مدرس"}</p><span class="chip">${accepted.includes(s.code)?"مقبول":"غير مقبول"}</span>`,accepted.includes(s.code)?`<button class="green">مفتوحة</button>`:`<button onclick="req('${s.id}')">إرسال طلب</button>`)).join("")||'<div class="empty">لا توجد مواد لهذه المرحلة</div>'}</div>`}
window.req=async idv=>{let sub=A.getData("subjects").find(s=>s.id===idv);await A.requestSubject(user,sub);alert("تم إرسال الطلب للمدرس");subjects()}
function allowed(){return A.acceptedSubjects(user).map(s=>s.code)}
function showBy(k,title){let codes=allowed();let arr=A.getData(k).filter(x=>codes.includes(x.subjectCode)&&x.status!=="مخفي");content.innerHTML=panel(title)+`<div class="card-grid">${arr.map(x=>card(x.title,`<p>${x.body||""}</p>${A.mediaLinks(x)}<p class="muted">${x.subject}</p>`)).join("")||'<div class="empty">لا توجد بيانات</div>'}</div>`}
function assignments(){let codes=allowed();let arr=A.getData("assignments").filter(x=>codes.includes(x.subjectCode)&&x.status!=="مخفي");content.innerHTML=panel("الواجبات المتقدمة","يمكن تسليم نص أو صورة أو رابط ملف")+`<div class="card-grid">${arr.map(x=>{let sub=A.getData("assignmentSubmissions").find(s=>s.assignmentId===x.id&&s.studentId===user.id);return card(x.title,`<p>${x.body||""}</p>${A.mediaLinks(x)}<p>الدرجة: ${x.score||""}</p><span class="chip">${sub?("تم التسليم / "+(sub.grade||"بانتظار التصحيح")):"غير مسلم"}</span>`,sub?"":`<button onclick="submitAssign('${x.id}')">تسليم</button>`) }).join("")||'<div class="empty">لا توجد واجبات</div>'}</div>`}
window.submitAssign=id=>{let a=A.getData("assignments").find(x=>x.id===id);content.innerHTML=panel("تسليم الواجب: "+a.title)+`<div class="field"><label>إجابة نصية</label><textarea id="ansText" class="answer-area"></textarea></div><div class="field"><label>رابط ملف Drive/OneDrive</label><input id="fileUrl"></div><div class="field"><label>إرفاق صورة للحل</label><input type="file" accept="image/*" id="imgFile"></div><button class="primary" onclick="sendAssignment('${id}')">إرسال الحل</button>`}
window.sendAssignment=async id=>{let a=A.getData("assignments").find(x=>x.id===id);let file=imgFile.files[0];let done=async img=>{await A.addItem("assignmentSubmissions",{assignmentId:id,assignmentTitle:a.title,studentId:user.id,studentCode:user.code,studentName:user.name,subject:a.subject,subjectCode:a.subjectCode,answerText:ansText.value,fileUrl:fileUrl.value,imageBase64:img,status:"بانتظار التصحيح",createdAt:A.now()});alert("تم تسليم الواجب");assignments()};if(file)A.resizeImageBase64(file,done);else done("")}
function exams(){let codes=allowed();let arr=A.getData("exams").filter(x=>codes.includes(x.subjectCode)&&x.status!=="مخفي");content.innerHTML=panel("الاختبارات الاحترافية")+`<div class="card-grid">${arr.map(e=>{let done=A.getData("examAttempts").find(a=>a.examId===e.id&&a.studentId===user.id);return card(e.title,`<p>عدد الأسئلة: ${(e.questions||[]).length}</p><span class="chip">${done?`${done.status} / ${done.score}/${done.total}`:"لم تحل"}</span>`,done?"":`<button onclick="takeExam('${e.id}')">بدء الاختبار</button>`) }).join("")||'<div class="empty">لا توجد اختبارات</div>'}</div>`}
window.takeExam=id=>{let e=A.getData("exams").find(x=>x.id===id);window._exam=e;window._answers={};content.innerHTML=panel("حل الاختبار: "+e.title)+`<div class="exam-progress"><span style="width:0%" id="prog"></span></div><div id="qSolve"></div><button class="primary" onclick="finishExam()">إنهاء وتسليم</button>`;renderSolve()}
window.renderSolve=()=>{
let qs=window._exam.questions||[];
qSolve.innerHTML=`<div class="exam-question-nav">${qs.map((q,i)=>`<button id="navq_${i}" onclick="document.getElementById('qq_${i}').scrollIntoView({behavior:'smooth',block:'center'})">${i+1}</button>`).join("")}</div>`+
qs.map((q,i)=>`<div class="question-box" id="qq_${i}"><h3>${i+1}. ${q.text}</h3><p>الدرجة: ${q.score}</p>${
q.type==="mcq"?(q.options||[]).filter(Boolean).map((o,j)=>`<button type="button" class="answer-option" data-q="${i}" data-answer="${String(o).replace(/"/g,'&quot;')}">${o}</button>`).join("")
:q.type==="truefalse"?`<div class="truefalse-row"><button type="button" class="answer-option" data-q="${i}" data-answer="صح">صح</button><button type="button" class="answer-option" data-q="${i}" data-answer="خطأ">خطأ</button></div>`
:q.type==="fill"?`<input data-q="${i}" class="text-answer" placeholder="اكتب الإجابة">`
:q.type==="essay"?`<textarea data-q="${i}" class="answer-area text-answer" placeholder="اكتب الإجابة المقالية"></textarea>`
:`<div class="file-answer-box"><textarea data-q="${i}" class="answer-area text-answer" placeholder="اكتب رابط Drive/OneDrive أو ملاحظة"></textarea><input type="file" accept="image/*" onchange="attachExamImage(event,${i})"></div>`
}</div>`).join("")+`<div class="exam-submit-bar"><button class="primary" onclick="finishExam()">إنهاء وتسليم الاختبار</button></div>`;

qSolve.querySelectorAll(".answer-option").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const i=btn.dataset.q;
    window._answers[i]=btn.dataset.answer;
    A.setAnswerVisual(document.getElementById("qq_"+i),btn);
    document.getElementById("navq_"+i)?.classList.add("answered");
    updateProgress();
  });
});
qSolve.querySelectorAll(".text-answer").forEach(el=>{
  el.addEventListener("input",()=>{
    const i=el.dataset.q;
    window._answers[i]=el.value;
    if(el.value.trim())document.getElementById("navq_"+i)?.classList.add("answered");
    else document.getElementById("navq_"+i)?.classList.remove("answered");
    updateProgress();
  });
});
updateProgress();
}
window.attachExamImage=(ev,i)=>{let f=ev.target.files[0];if(f)A.resizeImageBase64(f,img=>{window._answers[i]=img;alert("تم إرفاق الصورة")})}
window.finishExam=async()=>{
let res=A.gradeExamAttempt(window._exam,user,window._answers);
await A.addItem("examAttempts",res);
if(res.status==="مصحح تلقائياً"){
  await A.addItem("finalResults",{examAttemptId:res.id,studentId:user.id,studentCode:user.code,studentName:user.name,subject:res.subject,score:res.score,grade:res.score,total:res.total,createdAt:A.now()});
}
A.showResultModal(res);
exams();
}
function updateProgress(){
 let total=(window._exam?.questions||[]).length||1;
 let answered=Object.values(window._answers||{}).filter(v=>String(v||"").trim()!=="").length;
 let p=Math.round(answered/total*100);
 let bar=document.getElementById("prog");
 if(bar)bar.style.width=p+"%";
}
function results(){let p=A.studentProfile(user);content.innerHTML=panel("النتائج")+`<div class="card-grid">${p.results.map(r=>card(r.subject||"نتيجة",`<strong>${r.score||r.grade}/${r.total||""}</strong>`)).join("")||'<div class="empty">لا توجد نتائج</div>'}</div>`}
function leaderboard(){let arr=A.leaderboard(user.stage);content.innerHTML=panel("لوحة الشرف")+`<div class="card-grid">${arr.map((s,i)=>`<div class="data-card rank-card"><div class="rank-no">#${i+1}</div><h3>${s.name}</h3><span class="chip">${s.level}</span><span class="chip">${s.points} نقطة</span></div>`).join("")}</div>`}
function messages(){content.innerHTML=panel("الرسائل")+`<button class="green" onclick="send()">إرسال رسالة</button>`}
window.send=async()=>{let body=prompt("اكتب الرسالة");if(body)await A.addItem("messages",{from:user.name,to:"admin",title:"رسالة طالب",body,studentId:user.id,studentName:user.name,createdAt:A.now()})}
A.onSync(()=>A.scheduleRender(()=>openSection(current),300));openSection("home");
