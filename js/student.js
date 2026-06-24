seedBase();
var student=JSON.parse(sessionStorage.getItem('afaq_current_student')||'null');
if(!student){alert('يجب تسجيل دخول الطالب أولاً');location.href='../index.html'}
var current='home',activeExam=null;
var nav=[['الرئيسية','home'],['موادي الدراسية','subjects'],['الدروس والملفات','lessons'],['الواجبات','assignments'],['الاختبارات','exams'],['الحضور','attendance'],['نتائجي','results'],['النتائج النهائية','finalGrades'],['مستواي ونقاطي','level'],['لوحة الشرف','honor'],['الإشعارات','notifications'],['الرسائل','messages']];
function qs(x){return document.getElementById(x)}
function panel(t,d){return '<section class="panel"><h2>'+t+'</h2><p class="muted">'+(d||'')+'</p>'}
function drawSide(){var unread=unreadNotificationsForStudent(student);studentSide.innerHTML='<h2>'+student.name+'</h2>';nav.forEach(function(n){var b=document.createElement('button');b.className='nav'+(current===n[1]?' active':'');var badge=n[1]==='notifications'&&unread?'<span class="badge-count">'+unread+'</span>':'';b.innerHTML='<span>'+n[0]+badge+'</span><span>›</span>';b.onclick=function(){openSection(n[1])};studentSide.appendChild(b)})}
function openSection(s){current=s;drawSide();({home:showHome,subjects:showSubjects,lessons:function(){showStudentList('lessons','الدروس والملفات','📚')},assignments:showAssignments,exams:showExams,attendance:showAttendance,results:showResults,finalGrades:showFinalGrades,level:showLevel,honor:showHonor,notifications:showNotifications,messages:function(){showStudentList('messages','الرسائل','💬')}}[s]||showHome)()}
function visibleSubjects(){var links=getData('studentSubjects').filter(function(x){return x.studentId===student.id&&x.status==='accepted'});var subs=getData('subjects').filter(function(s){return s.stage===student.stage&&s.visibility!=='مخفي'&&s.status!=='موقوفة'});if(!links.length)return subs;var codes=links.map(x=>x.subjectCode);return subs.filter(s=>codes.indexOf(s.code)!==-1)}
function codes(){return visibleSubjects().map(s=>s.code)}
function related(arr){var c=codes();return arr.filter(x=>x.stage===student.stage&&c.indexOf(x.subjectCode)!==-1&&x.status!=='مخفي')}
function showHome(){studentContent.innerHTML=panel('الرئيسية','ملخص حساب الطالب')+'<div class="stats"><div class="stat"><h3>المواد</h3><strong>'+visibleSubjects().length+'</strong></div><div class="stat"><h3>النقاط</h3><strong>'+calcStudentPoints(student)+'</strong></div><div class="stat"><h3>المستوى</h3><strong>'+levelFromPoints(calcStudentPoints(student))+'</strong></div><div class="stat"><h3>الإشعارات</h3><strong>'+unreadNotificationsForStudent(student)+'</strong></div></div></section>'}
function showSubjects(){var html=panel('موادي الدراسية','المواد المتاحة حسب المرحلة والاشتراك')+'<div class="card-grid">';var data=visibleSubjects();if(!data.length)html+='<div class="empty">لا توجد مواد</div>';data.forEach(function(s){html+='<div class="data-card"><div class="icon-big">'+(s.icon||'📘')+'</div><h3>'+s.name+'</h3><p><span class="chip">'+s.code+'</span></p><p class="muted">المدرس: '+(s.teacher||'غير محدد')+'</p><button class="btn green" onclick="requestJoin(&quot;'+s.id+'&quot;)">طلب انضمام بالكود</button></div>'});studentContent.innerHTML=html+'</div></section>'}
function requestJoin(idv){var sub=getData('subjects').find(x=>x.id===idv);var code=prompt('اكتب كود المادة:');if(!code)return;if(code!==sub.code){alert('كود المادة غير صحيح');return}var arr=getData('studentSubjects');if(arr.find(x=>x.studentId===student.id&&x.subjectCode===sub.code)){alert('لديك طلب سابق أو قبول');return}arr.unshift({id:id(),studentId:student.id,studentName:student.name,stage:student.stage,subject:sub.name,subjectCode:sub.code,teacherName:sub.teacher,status:'pending'});setData('studentSubjects',arr);alert('تم إرسال الطلب')}
function showStudentList(key,title,icon){var html=panel(title,'البيانات المنشورة')+'<div class="card-grid">';var data=related(getData(key));if(!data.length)html+='<div class="empty">لا توجد بيانات</div>';data.forEach(function(x){html+='<div class="data-card"><div class="icon-big">'+icon+'</div><h3>'+(x.title||'بدون عنوان')+'</h3><p><span class="chip">'+x.subject+'</span></p><p class="muted">'+(x.description||x.body||'')+'</p>';if(x.fileData)html+='<a class="file-link" href="'+x.fileData+'" download="'+(x.fileName||'file')+'">تحميل الملف</a>';html+='</div>'});studentContent.innerHTML=html+'</div></section>'}
function showAssignments(){var html=panel('الواجبات','تسليم الواجب قبل انتهاء الوقت')+'<div class="card-grid">';var data=related(getData('assignments'));if(!data.length)html+='<div class="empty">لا توجد واجبات</div>';data.forEach(function(a){var locked=a.deadline&&new Date(a.deadline).getTime()<Date.now();var sub=getData('assignmentSubmissions').find(x=>x.assignmentId===a.id&&x.studentId===student.id);html+='<div class="data-card"><div class="icon-big">📝</div><h3>'+a.title+'</h3><p><span class="chip">'+(locked?'مغلق':'مفتوح')+'</span></p><p class="muted">'+(a.description||'')+'</p>';if(sub)html+='<p class="answer-badge">تم التسليم '+(sub.grade?'/ الدرجة: '+sub.grade:'')+'</p>';else if(!locked)html+='<button class="btn green" onclick="submitAssignment(&quot;'+a.id+'&quot;)">تسليم الواجب</button>';html+='</div>'});studentContent.innerHTML=html+'</div></section>'}
function submitAssignment(idv){var a=getData('assignments').find(x=>x.id===idv);var ans=prompt('اكتب حل الواجب:');if(!ans)return;var arr=getData('assignmentSubmissions');arr.unshift({id:id(),assignmentId:a.id,assignmentTitle:a.title,studentId:student.id,studentName:student.name,teacherId:a.teacherId,teacherName:a.teacherName,stage:a.stage,subject:a.subject,subjectCode:a.subjectCode,answer:ans,status:'بانتظار التصحيح'});setData('assignmentSubmissions',arr);showAssignments()}
function showExams(){var html=panel('الاختبارات','حل الاختبار مرة واحدة')+'<div class="card-grid">';var data=related(getData('exams'));if(!data.length)html+='<div class="empty">لا توجد اختبارات</div>';data.forEach(function(ex){var done=getData('examAttempts').find(a=>a.examId===ex.id&&a.studentId===student.id);html+='<div class="data-card"><div class="icon-big">🧪</div><h3>'+ex.title+'</h3><p class="muted">عدد الأسئلة: '+((ex.questionsList||[]).length)+'</p>';if(done)html+='<p class="answer-badge">درجتك: '+done.score+' / '+done.total+'</p>';else html+='<button class="btn green" onclick="startExam(&quot;'+ex.id+'&quot;)">بدء الاختبار</button>';html+='</div>'});studentContent.innerHTML=html+'</div></section>'}
function startExam(idv){activeExam=getData('exams').find(x=>x.id===idv);var html='<form id="solveExamForm">';(activeExam.questionsList||[]).forEach(function(q,i){html+='<div class="exam-question"><h4>'+(i+1)+'. '+q.text+'</h4><p><span class="chip">'+q.type+'</span><span class="chip">'+q.score+' درجة</span></p>';if(q.type==='اختيار من متعدد'&&q.options){q.options.split('\\n').forEach(function(op){html+='<label class="option-row"><input type="radio" name="q_'+q.id+'" value="'+op.trim()+'"> '+op.trim()+'</label>'})}else if(q.type==='صح وخطأ'){html+='<label class="option-row"><input type="radio" name="q_'+q.id+'" value="صح"> صح</label><label class="option-row"><input type="radio" name="q_'+q.id+'" value="خطأ"> خطأ</label>'}else html+='<textarea id="q_'+q.id+'"></textarea>';html+='</div>'});html+='<button class="primary">تسليم الاختبار</button></form>';modalTitle.textContent=activeExam.title;modalBody.innerHTML=html;studentModal.classList.add('active');solveExamForm.onsubmit=function(e){e.preventDefault();submitExam()}}
function submitExam(){var total=0,score=0,essays=[];(activeExam.questionsList||[]).forEach(function(q){total+=Number(q.score||0);var ans='';var radio=document.querySelector('input[name="q_'+q.id+'"]:checked');if(radio)ans=radio.value;var text=qs('q_'+q.id);if(text)ans=text.value;if(q.type==='مقالي')essays.push({id:id(),examId:activeExam.id,studentId:student.id,studentName:student.name,teacherId:activeExam.teacherId,teacherName:activeExam.teacherName,stage:activeExam.stage,subject:activeExam.subject,subjectCode:activeExam.subjectCode,question:q.text,answer:ans,score:q.score});else if((ans||'').trim()===(q.answer||'').trim())score+=Number(q.score||0)});var at=getData('examAttempts');at.unshift({id:id(),examId:activeExam.id,examTitle:activeExam.title,studentId:student.id,studentName:student.name,stage:student.stage,subject:activeExam.subject,subjectCode:activeExam.subjectCode,score:score,total:total,date:new Date().toLocaleString('ar-IQ')});setData('examAttempts',at);if(essays.length){var ea=getData('essayAnswers');essays.forEach(e=>ea.unshift(e));setData('essayAnswers',ea)}var res=getData('results');res.unshift({id:id(),teacherId:activeExam.teacherId,teacherName:activeExam.teacherName,stage:activeExam.stage,subject:activeExam.subject,subjectCode:activeExam.subjectCode,studentName:student.name,title:activeExam.title,score:score,finalScore:total,note:essays.length?'توجد أسئلة مقالية بانتظار التصحيح':'تصحيح تلقائي'});setData('results',res);studentModal.classList.remove('active');showExams()}
function showAttendance(){var html=panel('الحضور','تسجيل الحضور')+'<div class="card-grid">';var data=related(getData('attendance'));if(!data.length)html+='<div class="empty">لا توجد جلسات</div>';data.forEach(function(a){var closed=a.deadline&&new Date(a.deadline).getTime()<Date.now();var rec=getData('attendanceRecords').find(r=>r.sessionId===a.id&&r.studentId===student.id);html+='<div class="data-card"><div class="icon-big">✅</div><h3>'+a.title+'</h3><p><span class="chip">'+(closed?'مغلق':'مفتوح')+'</span></p>';if(rec)html+='<p class="answer-badge">تم التسجيل: '+rec.status+'</p>';else if(!closed)html+='<button class="btn green" onclick="markPresent(&quot;'+a.id+'&quot;)">تسجيل حضور</button>';else html+='<p class="status hide">غائب</p>';html+='</div>'});studentContent.innerHTML=html+'</div></section>'}
function markPresent(idv){var a=getData('attendance').find(x=>x.id===idv);var arr=getData('attendanceRecords');arr.unshift({id:id(),sessionId:idv,studentId:student.id,studentName:student.name,teacherId:a.teacherId,teacherName:a.teacherName,stage:a.stage,subject:a.subject,subjectCode:a.subjectCode,status:'حاضر'});setData('attendanceRecords',arr);showAttendance()}
function showResults(){var data=getData('results').filter(r=>r.studentName===student.name);var html=panel('نتائجي','درجاتي')+'<div class="card-grid">';if(!data.length)html+='<div class="empty">لا توجد نتائج</div>';data.forEach(r=>html+='<div class="data-card"><div class="icon-big">📊</div><h3>'+r.title+'</h3><p><span class="chip">'+r.subject+'</span></p><p class="final-grade">'+r.score+' / '+r.finalScore+'</p></div>');studentContent.innerHTML=html+'</div></section>'}
function showFinalGrades(){var data=getData('finalGrades').filter(g=>g.studentName===student.name);var html=panel('النتائج النهائية','نتائج المواد النهائية')+'<div class="card-grid">';if(!data.length)html+='<div class="empty">لا توجد نتائج نهائية</div>';data.forEach(g=>html+='<div class="data-card"><div class="icon-big">🎯</div><h3>'+g.subject+'</h3><p class="final-grade">'+g.grade+' / '+g.finalScore+'</p></div>');studentContent.innerHTML=html+'</div></section>'}
function showLevel(){var p=calcStudentPoints(student);studentContent.innerHTML=panel('مستواي ونقاطي','تحتسب تلقائياً من الاختبارات والواجبات والحضور')+'<div class="level-card"><h3 class="level-title">'+levelFromPoints(p)+'</h3><div class="points-big">'+p+' نقطة</div></div></section>'}
function showHonor(){var board=buildHonorBoard(student.stage);var html=panel('لوحة الشرف','ترتيب طلاب نفس المرحلة')+'<div class="card-grid">';board.slice(0,20).forEach(function(r,i){var m=i===0?'🥇':i===1?'🥈':i===2?'🥉':'🏅';html+='<div class="data-card"><div class="rank-medal">'+m+'</div><h3>'+(i+1)+' - '+r.studentName+'</h3><p><span class="chip">'+r.level+'</span></p><p class="points-big">'+r.points+'</p></div>'});studentContent.innerHTML=html+'</div></section>'}
function showNotifications(){var data=getData('notifications').filter(n=>n.target==='عام'||n.target==='طلاب المادة'||n.target==='طالب معين');var html=panel('الإشعارات','آخر الإشعارات')+'<div class="card-grid">';if(!data.length)html+='<div class="empty">لا توجد إشعارات</div>';data.forEach(n=>html+='<div class="data-card"><div class="icon-big">🔔</div><h3>'+n.title+'</h3><p class="muted">'+(n.body||'')+'</p></div>');setData('notifications',getData('notifications').map(function(n){n.readBy=n.readBy||[];if(n.readBy.indexOf(student.id)===-1)n.readBy.push(student.id);return n}));studentContent.innerHTML=html+'</div></section>';drawSide()}


// ===== v5.3.1 synchronization and notification fixes =====
ensureArrays();
function drawSide(){
 var unread=unreadNotificationsForStudent(student);
 studentSide.innerHTML='<h2>'+student.name+'</h2>';
 nav.forEach(function(n){
  var b=document.createElement('button');
  b.className='nav'+(current===n[1]?' active':'');
  var badge=n[1]==='notifications'&&unread?'<span class="badge-count">'+unread+'</span>':'';
  b.innerHTML='<span>'+n[0]+badge+'</span><span>›</span>';
  b.onclick=function(){openSection(n[1])};
  studentSide.appendChild(b);
 });
}
function acceptedSubjects(){
 var codes=studentAllowedSubjectCodes(student);
 return getData('subjects').filter(function(sub){return sub.stage===student.stage&&codes.indexOf(sub.code)!==-1&&sub.visibility!=='مخفي'&&sub.status!=='موقوفة'});
}
function availableSubjectsForRequest(){
 return getData('subjects').filter(function(sub){return sub.stage===student.stage&&sub.visibility!=='مخفي'&&sub.status!=='موقوفة'});
}
function visibleSubjects(){return acceptedSubjects()}
function subjectCodes(){return acceptedSubjects().map(function(sub){return sub.code})}
function related(arr){var c=subjectCodes();return arr.filter(function(x){return x.stage===student.stage&&c.indexOf(x.subjectCode)!==-1&&x.status!=='مخفي'})}
function showSubjects(){
 var accepted=acceptedSubjects(), all=availableSubjectsForRequest();
 var html=panel('موادي الدراسية','المواد المقبول بها تفتح مباشرة، والمواد غير المقبولة ترسل طلباً للمدرس بدون إظهار كود المادة.')+'<h3>المواد المقبول بها</h3><div class="card-grid">';
 if(!accepted.length)html+='<div class="empty">لم يتم قبولك في أي مادة بعد.</div>';
 accepted.forEach(function(sub){html+='<div class="data-card subject-open"><div class="icon-big">'+(sub.icon||'📘')+'</div><h3>'+sub.name+'</h3><p class="muted">المدرس: '+(sub.teacher||'غير محدد')+'</p><button class="btn green" onclick="openSubject(&quot;'+sub.code+'&quot;)">فتح المادة</button></div>'});
 html+='</div><h3>مواد مرحلتي</h3><div class="card-grid">';
 if(!all.length)html+='<div class="empty">لا توجد مواد في هذه المرحلة.</div>';
 all.forEach(function(sub){
  var req=studentSubjectRequest(student,sub.code);
  if(req&&req.status==='accepted')return;
  html+='<div class="data-card subject-locked"><div class="icon-big">'+(sub.icon||'📘')+'</div><h3>'+sub.name+'</h3><p class="muted">المدرس: '+(sub.teacher||'غير محدد')+'</p>';
  if(req)html+='<span class="request-state">'+(req.status==='pending'?'بانتظار موافقة المدرس':'تم رفض الطلب')+'</span>';
  else html+='<button class="btn blue" onclick="requestJoin(&quot;'+sub.id+'&quot;)">إرسال طلب للمدرس</button>';
  html+='</div>';
 });
 studentContent.innerHTML=html+'</div></section>';
}
function openSubject(code){sessionStorage.setItem('afaq_active_subject',code);openSection('lessons')}
function requestJoin(idv){
 var sub=getData('subjects').find(function(x){return x.id===idv}); if(!sub)return;
 var arr=getData('studentSubjects');
 if(arr.find(function(x){return x.studentId===student.id&&x.subjectCode===sub.code})){alert('لديك طلب سابق لهذه المادة');showSubjects();return}
 arr.unshift({id:id(),studentId:student.id,studentName:student.name,stage:student.stage,subject:sub.name,subjectCode:sub.code,teacherName:sub.teacher,status:'pending',createdAt:new Date().toLocaleString('ar-IQ')});
 setData('studentSubjects',arr);touchSync('studentSubjects');alert('تم إرسال طلب الانضمام للمدرس');showSubjects();
}
function showNotifications(){
 var data=getVisibleNotificationsForStudent(student);
 var html=panel('الإشعارات','تظهر الشارة الحمراء عند وصول تحديث جديد، وتختفي بعد قراءة هذا القسم.')+'<div class="card-grid">';
 if(!data.length)html+='<div class="empty">لا توجد إشعارات</div>';
 data.forEach(function(n){
  var unread=!(n.readBy&&n.readBy.indexOf(student.id)!==-1);
  html+='<div class="data-card '+(unread?'unread-card':'')+'"><div class="icon-big">🔔</div><h3>'+(unread?'<span class="small-dot"></span>':'')+n.title+'</h3><p><span class="chip">'+(n.subject||n.target||'عام')+'</span></p><p class="muted">'+(n.body||'')+'</p><p class="muted">'+(n.createdAt||'')+'</p></div>';
 });
 markStudentNotificationsRead(student);
 studentContent.innerHTML=html+'</div></section>';drawSide();
}
window.addEventListener('storage',function(e){if(e.key&&e.key.indexOf(P)===0){try{drawSide();if(current!=='notifications')openSection(current)}catch(err){}}});
studentInfo.textContent=student.name+' / '+student.stage+' / كود الطالب: '+student.code;drawSide();openSection('home');
