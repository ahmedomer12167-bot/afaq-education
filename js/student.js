seedBase();

var student = JSON.parse(sessionStorage.getItem('afaq_current_student') || 'null');
if(!student){
  alert('يجب تسجيل دخول الطالب أولاً');
  location.href = '../index.html';
}

var current = 'home';
var activeExam = null;

var nav = [
  ['الرئيسية','home'],
  ['موادي الدراسية','subjects'],
  ['الدروس والملفات','lessons'],
  ['الواجبات','assignments'],
  ['الاختبارات','exams'],
  ['الحضور','attendance'],
  ['نتائجي','results'],
  ['الإشعارات','notifications'],
  ['الرسائل','messages']
];

function qs(x){ return document.getElementById(x); }
function panel(t,d){ return `<section class="panel"><h2>${t}</h2><p class="muted">${d || ''}</p>`; }

function drawSide(){
  studentSide.innerHTML = `<h2>${student.name}</h2>`;
  nav.forEach(function(n){
    var b=document.createElement('button');
    b.className='nav'+(current===n[1]?' active':'');
    b.innerHTML=`<span>${n[0]}</span><span>›</span>`;
    b.onclick=function(){openSection(n[1])};
    studentSide.appendChild(b);
  });
}

function openSection(s){
  current=s; drawSide();
  var routes={home:showHome,subjects:showSubjects,lessons:showLessons,assignments:showAssignments,exams:showExams,attendance:showAttendance,results:showResults,notifications:showNotifications,messages:showMessages};
  (routes[s]||showHome)();
}

function mySubjectLinks(){
  return getData('studentSubjects').filter(function(x){return x.studentId===student.id && x.status==='accepted'});
}
function visibleSubjects(){
  var links=mySubjectLinks();
  var subjects=getData('subjects').filter(function(s){return s.stage===student.stage && s.visibility!=='مخفي' && s.status!=='موقوفة'});
  if(!links.length) return subjects;
  var codes=links.map(function(x){return x.subjectCode});
  return subjects.filter(function(s){return codes.indexOf(s.code)!==-1});
}
function subjectCodes(){ return visibleSubjects().map(function(s){return s.code}); }
function related(arr){
  var codes=subjectCodes();
  return arr.filter(function(x){return x.stage===student.stage && codes.indexOf(x.subjectCode)!==-1});
}

function showHome(){
  var ex=related(getData('exams')).length;
  var ass=related(getData('assignments')).length;
  var res=getData('results').filter(function(r){return r.studentName===student.name}).length;
  studentContent.innerHTML=panel('الرئيسية','ملخص سريع لحساب الطالب.')+
  `<div class="stats"><div class="stat"><h3>المواد</h3><strong>${visibleSubjects().length}</strong></div><div class="stat"><h3>الواجبات</h3><strong>${ass}</strong></div><div class="stat"><h3>الاختبارات</h3><strong>${ex}</strong></div><div class="stat"><h3>النتائج</h3><strong>${res}</strong></div></div></section>`;
}

function showSubjects(){
  var data=visibleSubjects();
  var html=panel('موادي الدراسية','المواد المتاحة للطالب حسب المرحلة والاشتراك.')+'<div class="card-grid">';
  if(!data.length)html+='<div class="empty">لا توجد مواد متاحة بعد.</div>';
  data.forEach(function(s){
    html += `<div class="data-card"><div class="icon-big">${s.icon || '📘'}</div><h3>${s.name}</h3><p><span class="chip">${s.code}</span></p><p class="muted">المدرس: ${s.teacher || 'غير محدد'}</p><div class="actions"><button class="btn green" onclick="requestJoin('${s.id}')">طلب انضمام بالكود</button></div></div>`;
  });
  studentContent.innerHTML=html+'</div></section>';
}

function requestJoin(idv){
  var sub=getData('subjects').find(function(x){return x.id===idv});
  var code=prompt('اكتب كود المادة:');
  if(!code)return;
  if(code!==sub.code){alert('كود المادة غير صحيح');return;}
  var arr=getData('studentSubjects');
  var old=arr.find(function(x){return x.studentId===student.id && x.subjectCode===sub.code});
  if(old){alert('لديك طلب سابق أو قبول لهذه المادة');return;}
  arr.unshift({id:id(),studentId:student.id,studentName:student.name,stage:student.stage,subject:sub.name,subjectCode:sub.code,teacherName:sub.teacher,status:'pending'});
  setData('studentSubjects',arr);
  alert('تم إرسال طلب الانضمام للمدرس');
}

function showLessons(){showStudentList('lessons','الدروس والملفات','📚')}
function showNotifications(){showStudentList('notifications','الإشعارات','🔔')}
function showMessages(){showStudentList('messages','الرسائل','💬')}

function showStudentList(key,title,icon){
  var data=related(getData(key)).filter(function(x){return x.status!=='مخفي'});
  var html=panel(title,'البيانات المنشورة للطالب.')+'<div class="card-grid">';
  if(!data.length)html+='<div class="empty">لا توجد بيانات بعد.</div>';
  data.forEach(function(x){
    html += `<div class="data-card"><div class="icon-big">${icon}</div><h3>${x.title || 'بدون عنوان'}</h3><p><span class="chip">${x.subject}</span></p><p class="muted">${x.description || x.body || ''}</p>`;
    if(x.fileData) html += `<a class="file-link" href="${x.fileData}" download="${x.fileName || 'file'}">تحميل الملف</a>`;
    html += '</div>';
  });
  studentContent.innerHTML=html+'</div></section>';
}

function showAssignments(){
  var data=related(getData('assignments')).filter(function(x){return x.status!=='مخفي'});
  var html=panel('الواجبات','حل الواجبات وتسليمها قبل انتهاء الوقت.')+'<div class="card-grid">';
  if(!data.length)html+='<div class="empty">لا توجد واجبات.</div>';
  data.forEach(function(a){
    var locked=a.deadline && new Date(a.deadline).getTime()<Date.now();
    var sub=getData('assignmentSubmissions').find(function(x){return x.assignmentId===a.id && x.studentId===student.id});
    html += `<div class="data-card ${locked?'locked':''}"><div class="icon-big">📝</div><h3>${a.title}</h3><p><span class="chip">${locked?'مغلق':'مفتوح'}</span></p><p class="muted">${a.description || ''}</p><p class="muted">الموعد: ${a.deadline || 'بدون'}</p>`;
    if(a.fileData) html += `<a class="file-link" href="${a.fileData}" download="${a.fileName || 'file'}">تحميل ملف الواجب</a>`;
    if(sub) html += `<p class="answer-badge">تم التسليم ${sub.grade ? ' / الدرجة: '+sub.grade : ''}</p>`;
    else if(!locked) html += `<div class="actions"><button class="btn green" onclick="submitAssignment('${a.id}')">تسليم الواجب</button></div>`;
    html += '</div>';
  });
  studentContent.innerHTML=html+'</div></section>';
}

function submitAssignment(idv){
  var a=getData('assignments').find(function(x){return x.id===idv});
  var answer=prompt('اكتب حل الواجب أو ملاحظتك:');
  if(!answer)return;
  var arr=getData('assignmentSubmissions');
  arr.unshift({id:id(),assignmentId:a.id,assignmentTitle:a.title,studentId:student.id,studentName:student.name,teacherId:a.teacherId,teacherName:a.teacherName,stage:a.stage,subject:a.subject,subjectCode:a.subjectCode,answer:answer,status:'بانتظار التصحيح',createdAt:new Date().toLocaleString('ar-IQ')});
  setData('assignmentSubmissions',arr);
  showAssignments();
}

function showExams(){
  var data=related(getData('exams')).filter(function(x){return x.status!=='مخفي'});
  var html=panel('الاختبارات','حل الاختبار مع التصحيح التلقائي للأسئلة الموضوعية.')+'<div class="card-grid">';
  if(!data.length)html+='<div class="empty">لا توجد اختبارات منشورة.</div>';
  data.forEach(function(ex){
    var done=getData('examAttempts').find(function(a){return a.examId===ex.id && a.studentId===student.id});
    html += `<div class="data-card"><div class="icon-big">🧪</div><h3>${ex.title}</h3><p><span class="chip">${done?'تم الحل':'متاح'}</span></p><p class="muted">عدد الأسئلة: ${(ex.questionsList || []).length}</p>`;
    if(done) html += `<p class="answer-badge">درجتك: ${done.score} / ${done.total}</p>`;
    else html += `<button class="btn green" onclick="startExam('${ex.id}')">بدء الاختبار</button>`;
    html += '</div>';
  });
  studentContent.innerHTML=html+'</div></section>';
}

function startExam(idv){
  activeExam=getData('exams').find(function(x){return x.id===idv});
  if(!activeExam)return;
  var html=`<form id="solveExamForm"><div class="notice">مدة الاختبار: ${activeExam.duration || '30'} دقيقة</div>`;
  (activeExam.questionsList || []).forEach(function(q,i){
    html += `<div class="exam-question"><h4>${i+1}. ${q.text}</h4><p><span class="chip">${q.type}</span><span class="chip">${q.score} درجة</span></p>`;
    if(q.type==='اختيار من متعدد' && q.options){
      q.options.split('\\n').forEach(function(op){ html += `<label class="option-row"><input type="radio" name="q_${q.id}" value="${op.trim()}"> ${op.trim()}</label>`; });
    }else if(q.type==='صح وخطأ'){
      html += `<label class="option-row"><input type="radio" name="q_${q.id}" value="صح"> صح</label><label class="option-row"><input type="radio" name="q_${q.id}" value="خطأ"> خطأ</label>`;
    }else{
      html += `<textarea id="q_${q.id}" class="full" placeholder="اكتب إجابتك"></textarea>`;
    }
    html += '</div>';
  });
  html += '<button class="primary">تسليم الاختبار</button></form>';
  modalTitle.textContent=activeExam.title;
  modalBody.innerHTML=html;
  studentModal.classList.add('active');
  solveExamForm.onsubmit=function(e){e.preventDefault();submitExam()};
}

function submitExam(){
  var total=0, score=0, essays=[];
  (activeExam.questionsList || []).forEach(function(q){
    total += Number(q.score || 0);
    var ans='';
    var radio=document.querySelector('input[name="q_'+q.id+'"]:checked');
    if(radio) ans=radio.value;
    var text=qs('q_'+q.id);
    if(text) ans=text.value;
    if(q.type==='مقالي'){
      essays.push({id:id(),examId:activeExam.id,studentId:student.id,studentName:student.name,teacherId:activeExam.teacherId,teacherName:activeExam.teacherName,stage:activeExam.stage,subject:activeExam.subject,subjectCode:activeExam.subjectCode,question:q.text,answer:ans,score:q.score});
    }else if((ans || '').trim()===(q.answer || '').trim()){
      score += Number(q.score || 0);
    }
  });
  var attempts=getData('examAttempts');
  attempts.unshift({id:id(),examId:activeExam.id,examTitle:activeExam.title,studentId:student.id,studentName:student.name,stage:student.stage,subject:activeExam.subject,subjectCode:activeExam.subjectCode,score:score,total:total,date:new Date().toLocaleString('ar-IQ')});
  setData('examAttempts',attempts);
  if(essays.length){
    var ea=getData('essayAnswers');
    essays.forEach(function(e){ea.unshift(e)});
    setData('essayAnswers',ea);
  }
  var results=getData('results');
  results.unshift({id:id(),teacherId:activeExam.teacherId,teacherName:activeExam.teacherName,stage:activeExam.stage,subject:activeExam.subject,subjectCode:activeExam.subjectCode,studentName:student.name,title:activeExam.title,score:score,finalScore:total,note:essays.length?'توجد أسئلة مقالية بانتظار التصحيح':'تصحيح تلقائي',createdAt:new Date().toLocaleString('ar-IQ')});
  setData('results',results);
  studentModal.classList.remove('active');
  showExams();
}

function showAttendance(){
  var data=related(getData('attendance'));
  var html=panel('الحضور','تسجيل الحضور قبل انتهاء الوقت.')+'<div class="card-grid">';
  if(!data.length)html+='<div class="empty">لا توجد جلسات حضور.</div>';
  data.forEach(function(a){
    var closed=a.deadline && new Date(a.deadline).getTime()<Date.now();
    var rec=getData('attendanceRecords').find(function(r){return r.sessionId===a.id && r.studentId===student.id});
    html += `<div class="data-card ${closed?'locked':''}"><div class="icon-big">✅</div><h3>${a.title}</h3><p><span class="chip">${closed?'مغلق':'مفتوح'}</span></p><p class="muted">ينتهي: ${a.deadline || 'بدون'}</p>`;
    if(rec) html += `<p class="answer-badge">تم التسجيل: ${rec.status}</p>`;
    else if(!closed) html += `<button class="btn green" onclick="markPresent('${a.id}')">تسجيل حضور</button>`;
    else html += '<p class="status hide">غائب</p>';
    html += '</div>';
  });
  studentContent.innerHTML=html+'</div></section>';
}

function markPresent(idv){
  var a=getData('attendance').find(function(x){return x.id===idv});
  var arr=getData('attendanceRecords');
  arr.unshift({id:id(),sessionId:idv,studentId:student.id,studentName:student.name,teacherId:a.teacherId,teacherName:a.teacherName,stage:a.stage,subject:a.subject,subjectCode:a.subjectCode,status:'حاضر',date:new Date().toLocaleString('ar-IQ')});
  setData('attendanceRecords',arr);
  showAttendance();
}

function showResults(){
  var results=getData('results').filter(function(r){return r.studentName===student.name});
  var html=panel('نتائجي','درجات الاختبارات والواجبات.')+'<div class="card-grid">';
  if(!results.length)html+='<div class="empty">لا توجد نتائج بعد.</div>';
  results.forEach(function(r){
    html += `<div class="data-card"><div class="icon-big">📊</div><h3>${r.title}</h3><p><span class="chip">${r.subject}</span></p><p class="muted">الدرجة: ${r.score} / ${r.finalScore}</p><p class="muted">${r.note || ''}</p></div>`;
  });
  studentContent.innerHTML=html+'</div></section>';
}

studentInfo.textContent = student.name+' / '+student.stage+' / كود الطالب: '+student.code;
drawSide();
openSection('home');
