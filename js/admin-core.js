var P='afaq40_';
function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function getData(k){return JSON.parse(localStorage.getItem(P+k)||'[]')}
function setData(k,v){localStorage.setItem(P+k,JSON.stringify(v))}
function getObj(k,d){return JSON.parse(localStorage.getItem(P+k)||JSON.stringify(d||{}))}
function setObj(k,v){localStorage.setItem(P+k,JSON.stringify(v))}
function today(){return new Date().toISOString().slice(0,10)}
function addDays(dateText,days){var d=new Date(dateText||today());d.setDate(d.getDate()+Number(days||30));return d.toISOString().slice(0,10)}
function isExpired(d){return d&&new Date(d)<new Date(today())}
function sortByOrder(a,b){return Number(a.order||0)-Number(b.order||0)}
function randomTeacherCode(){return 'T-'+Math.floor(10000+Math.random()*90000)}
function randomStudentCode(){return 'ST-'+Math.floor(1000+Math.random()*9000)}
function randomSubjectCode(prefix){return (prefix||'SUB')+'-'+Math.floor(10000+Math.random()*90000)}
function seedBase(){if(localStorage.getItem(P+'seeded'))return;
setData('stages',[{id:id(),name:'الأول متوسط',order:1,status:'مفعلة',visibility:'ظاهر'},{id:id(),name:'الثاني متوسط',order:2,status:'مفعلة',visibility:'ظاهر'},{id:id(),name:'الثالث متوسط',order:3,status:'مفعلة',visibility:'ظاهر'},{id:id(),name:'الرابع الإعدادي',order:4,status:'مفعلة',visibility:'ظاهر'},{id:id(),name:'الخامس الإعدادي',order:5,status:'مفعلة',visibility:'ظاهر'},{id:id(),name:'السادس الإعدادي',order:6,status:'مفعلة',visibility:'ظاهر'}]);
setData('subjects',[{id:id(),name:'الأحياء',code:'BIO-12347',stage:'الثالث متوسط',teacher:'غير محدد',color:'أخضر',icon:'🧬',order:1,status:'مفعلة',visibility:'ظاهر'},{id:id(),name:'الكيمياء',code:'CHE-65421',stage:'الثالث متوسط',teacher:'غير محدد',color:'أزرق',icon:'⚗️',order:2,status:'مفعلة',visibility:'ظاهر'}]);
['teachers','students','parents','requests','payments','notifications','messages','honor','studentSubjects','exams','attendance','activity'].forEach(function(k){setData(k,[])});
setData('levels',[{id:id(),name:'مبتدئ',percent:0},{id:id(),name:'مجتهد',percent:50},{id:id(),name:'متفوق',percent:70},{id:id(),name:'خبير',percent:85},{id:id(),name:'أسطورة',percent:95}]);
setObj('settings',{platformName:'آفاق التعليمية',footer:'جميع الحقوق محفوظة',masterNumber:'0000 0000 0000 0000',cardOwner:'اسم صاحب البطاقة',adminCode:'1234'});
localStorage.setItem(P+'seeded','1')}
function stageOptions(selected){return getData('stages').filter(function(x){return x.visibility==='ظاهر'&&x.status==='مفعلة'}).sort(sortByOrder).map(function(st){return '<option value="'+st.name+'"'+(selected===st.name?' selected':'')+'>'+st.name+'</option>'}).join('')}
function subjectOptions(selected,stage){return getData('subjects').filter(function(x){return (!stage||x.stage===stage)&&x.visibility!=='مخفي'&&x.status!=='موقوفة'}).sort(sortByOrder).map(function(s){return '<option value="'+s.name+'" data-code="'+s.code+'"'+(selected===s.name?' selected':'')+'>'+s.name+' - '+s.code+'</option>'}).join('')}
function getSubjectCodeByName(name){var sub=getData('subjects').find(function(x){return x.name===name});return sub?sub.code:''}
function stageUsage(stageName){var students=getData('students').filter(function(x){return x.stage===stageName}).length;var subjects=getData('subjects').filter(function(x){return x.stage===stageName}).length;var teachers=getData('teachers').filter(function(x){return x.stage===stageName}).length;return {students:students,subjects:subjects,teachers:teachers,total:students+subjects+teachers}}
function subjectUsage(subjectName,subjectCode){var teachers=getData('teachers').filter(function(x){return x.subject===subjectName||x.subjectCode===subjectCode}).length;var students=getData('studentSubjects').filter(function(x){return x.subject===subjectName||x.subjectCode===subjectCode}).length;var exams=getData('exams').filter(function(x){return x.subject===subjectName||x.subjectCode===subjectCode}).length;return {teachers:teachers,students:students,exams:exams,total:teachers+students+exams}}
function logAction(text){var a=getData('activity');a.unshift({id:id(),text:text,date:new Date().toLocaleString('ar-IQ')});setData('activity',a)}

function calcStudentPoints(student){
 var attempts=getData('examAttempts').filter(function(a){return a.studentId===student.id});
 var ass=getData('assignmentSubmissions').filter(function(a){return a.studentId===student.id});
 var att=getData('attendanceRecords').filter(function(a){return a.studentId===student.id&&a.status==='حاضر'});
 var pts=0;
 attempts.forEach(function(a){var total=Number(a.total||100)||100;pts+=Math.round((Number(a.score||0)/total)*50)});
 ass.forEach(function(a){pts+=a.grade?Math.round((Number(a.grade)||0)/5):10});
 pts+=att.length*10;
 return Math.max(0,pts);
}
function levelFromPoints(points){
 if(points>=900)return 'أسطورة';
 if(points>=650)return 'خبير';
 if(points>=400)return 'متفوق';
 if(points>=180)return 'مجتهد';
 return 'مبتدئ';
}
function buildHonorBoard(stage){
 return getData('students').filter(function(s){return !stage||s.stage===stage}).map(function(s){var p=calcStudentPoints(s);return{studentId:s.id,studentName:s.name,stage:s.stage,points:p,level:levelFromPoints(p)}}).sort(function(a,b){return b.points-a.points});
}
function unreadNotificationsForStudent(student){
 return getData('notifications').filter(function(n){if(n.readBy&&n.readBy.indexOf(student.id)!==-1)return false;return n.target==='عام'||n.target==='طلاب المادة'||n.target==='طالب معين'}).length;
}
function pushNotification(obj){var arr=getData('notifications');obj.id=obj.id||id();obj.createdAt=obj.createdAt||new Date().toLocaleString('ar-IQ');obj.readBy=obj.readBy||[];arr.unshift(obj);setData('notifications',arr)}

function ensureArrays(){
 ['studentSubjects','notifications','lessons','assignments','exams','attendance','messages','finalGrades','results','examAttempts','assignmentSubmissions','attendanceRecords'].forEach(function(k){
  if(!localStorage.getItem(P+k)) setData(k,[]);
 });
}
function isStudentAcceptedInSubject(student, subjectCode){
 return !!getData('studentSubjects').find(function(x){return x.studentId===student.id&&x.subjectCode===subjectCode&&x.status==='accepted'});
}
function studentSubjectRequest(student, subjectCode){
 return getData('studentSubjects').find(function(x){return x.studentId===student.id&&x.subjectCode===subjectCode});
}
function studentAllowedSubjectCodes(student){
 return getData('studentSubjects').filter(function(x){return x.studentId===student.id&&x.status==='accepted'}).map(function(x){return x.subjectCode});
}
function notifyStudentsOfSubject(obj){
 var arr=getData('notifications');
 arr.unshift({id:id(),title:obj.title||'تحديث جديد',body:obj.body||'يوجد تحديث جديد في المادة',target:'طلاب المادة',stage:obj.stage,subject:obj.subject,subjectCode:obj.subjectCode,teacherId:obj.teacherId||'',teacherName:obj.teacherName||'',type:obj.type||'update',createdAt:new Date().toLocaleString('ar-IQ'),readBy:[]});
 setData('notifications',arr);
}
function unreadNotificationsForStudent(student){
 return getData('notifications').filter(function(n){
  if(n.readBy&&n.readBy.indexOf(student.id)!==-1)return false;
  if(n.target==='عام')return true;
  if(n.target==='طلاب المادة')return student.stage===n.stage&&isStudentAcceptedInSubject(student,n.subjectCode);
  if(n.target==='طالب معين')return n.studentId===student.id||n.studentName===student.name;
  return false;
 }).length;
}
function getVisibleNotificationsForStudent(student){
 return getData('notifications').filter(function(n){
  if(n.target==='عام')return true;
  if(n.target==='طلاب المادة')return student.stage===n.stage&&isStudentAcceptedInSubject(student,n.subjectCode);
  if(n.target==='طالب معين')return n.studentId===student.id||n.studentName===student.name;
  return false;
 });
}
function markStudentNotificationsRead(student){
 var arr=getData('notifications').map(function(n){
  var ok=(n.target==='عام')||(n.target==='طلاب المادة'&&student.stage===n.stage&&isStudentAcceptedInSubject(student,n.subjectCode))||(n.target==='طالب معين'&&(n.studentId===student.id||n.studentName===student.name));
  if(ok){n.readBy=n.readBy||[];if(n.readBy.indexOf(student.id)===-1)n.readBy.push(student.id)}
  return n;
 });
 setData('notifications',arr);
}
function touchSync(key){localStorage.setItem(P+'sync_'+key,String(Date.now()))}

function getChildrenForParent(parentUser){
  var students=getData('students'), linked=[];
  if(parentUser.children&&Array.isArray(parentUser.children)){
    parentUser.children.forEach(function(c){var s=students.find(function(st){return st.id===c.studentId||st.code===c.studentCode||st.name===c.studentName});if(s)linked.push(s)});
  }
  students.forEach(function(s){
    var ok=s.code===parentUser.studentCode||s.code===parentUser.code||s.name===parentUser.studentName||s.parentName===parentUser.name;
    if(ok&&!linked.find(function(x){return x.id===s.id}))linked.push(s);
  });
  return linked;
}
function parentUnreadNotifications(parentUser){return getChildrenForParent(parentUser).reduce(function(t,s){return t+unreadNotificationsForStudent(s)},0)}
function notifyParentOfStudent(student,title,body,type){
  var arr=getData('notifications');
  arr.unshift({id:id(),title:title,body:body,target:'ولي الأمر',studentId:student.id,studentName:student.name,stage:student.stage,type:type||'parent-alert',createdAt:new Date().toLocaleString('ar-IQ'),readBy:[]});
  setData('notifications',arr);
}
function getVisibleNotificationsForParent(parentUser){
  var children=getChildrenForParent(parentUser),ids=children.map(function(s){return s.id}),names=children.map(function(s){return s.name});
  return getData('notifications').filter(function(n){
    if(n.target==='ولي الأمر')return ids.indexOf(n.studentId)!==-1||names.indexOf(n.studentName)!==-1;
    if(n.target==='عام')return true;
    if(n.target==='طلاب المادة')return children.some(function(s){return s.stage===n.stage&&isStudentAcceptedInSubject(s,n.subjectCode)});
    return false;
  });
}
function markParentNotificationsRead(parentUser){
  var children=getChildrenForParent(parentUser);
  setData('notifications',getData('notifications').map(function(n){
    var ok=n.target==='عام'||(n.target==='ولي الأمر'&&children.some(function(s){return s.id===n.studentId||s.name===n.studentName}))||(n.target==='طلاب المادة'&&children.some(function(s){return s.stage===n.stage&&isStudentAcceptedInSubject(s,n.subjectCode)}));
    if(ok){n.readBy=n.readBy||[];children.forEach(function(s){if(n.readBy.indexOf(s.id)===-1)n.readBy.push(s.id)})}
    return n;
  }));
}
function subjectProgressForStudent(student, subjectCode){
  var lessons=getData('lessons').filter(function(x){return x.subjectCode===subjectCode&&x.status!=='مخفي'}).length;
  var assignments=getData('assignments').filter(function(x){return x.subjectCode===subjectCode&&x.status!=='مخفي'});
  var exams=getData('exams').filter(function(x){return x.subjectCode===subjectCode&&x.status!=='مخفي'});
  var submissions=getData('assignmentSubmissions').filter(function(x){return x.studentId===student.id&&x.subjectCode===subjectCode}).length;
  var attempts=getData('examAttempts').filter(function(x){return x.studentId===student.id&&x.subjectCode===subjectCode}).length;
  var total=assignments.length+exams.length, done=submissions+attempts;
  return {lessons:lessons,assignments:assignments.length,exams:exams.length,submitted:submissions,attempts:attempts,percent:total?Math.round(done/total*100):(lessons?25:0)};
}
function monthlyStudentReport(student){
  var sessions=getData('attendance').filter(function(a){return student.stage===a.stage&&isStudentAcceptedInSubject(student,a.subjectCode)});
  var present=getData('attendanceRecords').filter(function(a){return a.studentId===student.id&&a.status==='حاضر'}).length;
  return {points:calcStudentPoints(student),level:levelFromPoints(calcStudentPoints(student)),finals:getData('finalGrades').filter(function(g){return g.studentName===student.name}).length,attempts:getData('examAttempts').filter(function(a){return a.studentId===student.id}).length,assignments:getData('assignmentSubmissions').filter(function(a){return a.studentId===student.id}).length,present:present,absent:Math.max(0,sessions.length-present)};
}

function logActivity(role, actor, action, target){
  var arr=getData('activityLog');
  arr.unshift({id:id(),role:role||'system',actor:actor||'—',action:action||'نشاط',target:target||'—',createdAt:new Date().toLocaleString('ar-IQ')});
  setData('activityLog',arr.slice(0,700));
}
function getStudentFullProfile(student){
  var subjects=getData('studentSubjects').filter(function(x){return x.studentId===student.id});
  var accepted=subjects.filter(function(x){return x.status==='accepted'});
  var attempts=getData('examAttempts').filter(function(x){return x.studentId===student.id});
  var results=getData('results').filter(function(x){return x.studentName===student.name});
  var assignments=getData('assignmentSubmissions').filter(function(x){return x.studentId===student.id});
  var attendance=getData('attendanceRecords').filter(function(x){return x.studentId===student.id&&x.status==='حاضر'});
  var sessions=getData('attendance').filter(function(a){return student.stage===a.stage && isStudentAcceptedInSubject(student,a.subjectCode)});
  var points=calcStudentPoints(student);
  return {subjects:subjects,accepted:accepted,attempts:attempts,results:results,assignments:assignments,attendance:attendance,sessions:sessions,points:points,level:levelFromPoints(points),absent:Math.max(0,sessions.length-attendance.length)};
}
function getTeacherFullProfile(teacher){
  var subjectStudents=getData('studentSubjects').filter(function(x){return x.stage===teacher.stage&&x.subjectCode===teacher.subjectCode&&x.status==='accepted'}).length;
  var lessons=getData('lessons').filter(function(x){return x.teacherId===teacher.id||x.teacherName===teacher.name});
  var exams=getData('exams').filter(function(x){return x.teacherId===teacher.id||x.teacherName===teacher.name});
  var assignments=getData('assignments').filter(function(x){return x.teacherId===teacher.id||x.teacherName===teacher.name});
  var results=getData('results').filter(function(x){return x.teacherId===teacher.id||x.teacherName===teacher.name});
  var avg=results.length?Math.round(results.reduce(function(t,r){return t+Number(r.score||0)},0)/results.length):0;
  return {students:subjectStudents,lessons:lessons,exams:exams,assignments:assignments,results:results,avg:avg};
}
function globalSearch(q){
  q=(q||'').toLowerCase();
  var out=[];
  function add(type,label,arr,fields){
    arr.forEach(function(x){
      var text=fields.map(function(f){return x[f]||''}).join(' ').toLowerCase();
      if(!q || text.indexOf(q)!==-1)out.push({type:type,label:label,item:x});
    });
  }
  add('student','طالب',getData('students'),['name','code','stage','phone','parentName']);
  add('teacher','مدرس',getData('teachers'),['name','teacherCode','subjectCode','stage','subject','phone']);
  add('parent','ولي أمر',getData('parents'),['name','code','studentName','studentCode']);
  add('subject','مادة',getData('subjects'),['name','code','stage','teacher']);
  add('exam','اختبار',getData('exams'),['title','subject','stage','teacherName']);
  add('assignment','واجب',getData('assignments'),['title','subject','stage','teacherName']);
  add('subscription','اشتراك',getData('subscriptions'),['studentName','stage','phone','status']);
  return out.slice(0,100);
}
function dashboardStats(){
  var students=getData('students'), teachers=getData('teachers'), subs=getData('subscriptions'), subjects=getData('subjects');
  var activeStudents=students.filter(function(s){return s.status!=='موقوف'}).length;
  var stoppedStudents=students.length-activeStudents;
  var activeSubs=subs.filter(function(s){return s.status==='نشط'}).length;
  var expiredSubs=subs.filter(function(s){return s.status==='منتهي'}).length;
  return {students:students.length,activeStudents:activeStudents,stoppedStudents:stoppedStudents,teachers:teachers.length,subjects:subjects.length,subscriptions:subs.length,activeSubs:activeSubs,expiredSubs:expiredSubs,exams:getData('exams').length,assignments:getData('assignments').length};
}
function subjectJoinRequestsForTeacher(teacher){
  return getData('studentSubjects').filter(function(r){return r.stage===teacher.stage&&r.subjectCode===teacher.subjectCode});
}
function approveSubjectJoin(requestId, teacher){
  var req=null;
  setData('studentSubjects',getData('studentSubjects').map(function(x){if(x.id===requestId){x.status='accepted';x.acceptedAt=new Date().toLocaleString('ar-IQ');req=x}return x}));
  if(req){
    notifyStudentsOfSubject({title:'تم قبولك في المادة',body:'تم قبول انضمامك إلى مادة '+req.subject,stage:req.stage,subject:req.subject,subjectCode:req.subjectCode,teacherId:teacher&&teacher.id,teacherName:teacher&&teacher.name,type:'join-approved'});
    logActivity('teacher',teacher&&teacher.name,'قبول طلب مادة',req.studentName+' / '+req.subject);
    touchSync('studentSubjects');
  }
}
function rejectSubjectJoin(requestId, teacher, reason){
  var req=null;
  setData('studentSubjects',getData('studentSubjects').map(function(x){if(x.id===requestId){x.status='rejected';x.rejectReason=reason||'لم يتم ذكر السبب';x.rejectedAt=new Date().toLocaleString('ar-IQ');req=x}return x}));
  if(req){
    notifyStudentsOfSubject({title:'تم رفض طلب المادة',body:'تم رفض طلبك في مادة '+req.subject+' / السبب: '+(reason||'غير محدد'),stage:req.stage,subject:req.subject,subjectCode:req.subjectCode,teacherId:teacher&&teacher.id,teacherName:teacher&&teacher.name,type:'join-rejected'});
    logActivity('teacher',teacher&&teacher.name,'رفض طلب مادة',req.studentName+' / '+req.subject);
    touchSync('studentSubjects');
  }
}


// ===== v8.0.1 stages compatibility alias =====
(function(){
  if(window.__afaqStagesAliasInstalled) return;
  window.__afaqStagesAliasInstalled = true;
  document.addEventListener('DOMContentLoaded', function(){
    try{
      var stages = getData('stages');
      var grades = getData('grades');
      if((!stages || !stages.length) && grades && grades.length){
        setData('stages', grades);
      }
    }catch(e){}
  });
})();


// ===== v8.0.2 complete matching, settings, sync and notifications helpers =====
function afaqClean(v){
  return String(v||'').trim().replace(/\s+/g,' ').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase();
}
function afaqEq(a,b){return afaqClean(a)===afaqClean(b)}
function afaqNotStopped(x){
  var st=afaqClean((x&&x.status)||'');
  return st!=='موقوف' && st!=='موقوفه' && st!=='متوقف' && st!=='معطل';
}
function afaqGetSettings(){
  return getObj('settings',{platformName:'آفاق التعليمية',footer:'جميع الحقوق محفوظة',masterNumber:'0000 0000 0000 0000',cardOwner:'اسم صاحب البطاقة',adminCode:'1234'});
}
function afaqSetSettings(obj){
  var old=afaqGetSettings();
  setObj('settings',Object.assign({},old,obj||{}));
  try{touchSync('settings')}catch(e){}
}
function afaqSubjectCodeByNameStage(subject,stage){
  var s=getData('subjects').find(function(x){return afaqEq(x.name||x.subject,subject)&&(!stage||afaqEq(x.stage,stage))});
  return s ? (s.code||s.subjectCode||'') : '';
}
function afaqStageOptions(){
  var arr=getData('stages');
  if(!arr.length)arr=getData('grades');
  if(!arr.length)arr=[
    {name:'الأول متوسط',status:'مفعلة',visibility:'ظاهر'},
    {name:'الثاني متوسط',status:'مفعلة',visibility:'ظاهر'},
    {name:'الثالث متوسط',status:'مفعلة',visibility:'ظاهر'},
    {name:'الرابع الإعدادي',status:'مفعلة',visibility:'ظاهر'},
    {name:'الخامس الإعدادي',status:'مفعلة',visibility:'ظاهر'},
    {name:'السادس الإعدادي',status:'مفعلة',visibility:'ظاهر'}
  ];
  return arr.filter(function(x){return (x.visibility||'ظاهر')!=='مخفي' && afaqClean(x.status||'مفعلة')!=='موقوفه' && afaqClean(x.status||'مفعلة')!=='موقوف'})
    .map(function(x){return x.name||x.stage||x.grade||x.title||String(x)}).filter(Boolean);
}
function afaqSubjectOptions(stage){
  return getData('subjects').filter(function(x){
    return (!stage||afaqEq(x.stage,stage)) && (x.visibility||'ظاهر')!=='مخفي' && afaqClean(x.status||'مفعلة')!=='موقوفه' && afaqClean(x.status||'مفعلة')!=='موقوف';
  });
}
function afaqUnreadForRole(role,user){
  user=user||{};
  var uid=user.id||user.code||user.name||role;
  return getData('notifications').filter(function(n){
    n.readBy=n.readBy||[];
    if(n.readBy.indexOf(uid)!==-1)return false;
    if(role==='admin')return true;
    if(role==='teacher'){
      return n.target==='عام'||n.target==='المدرسين'||n.teacherId===user.id||afaqEq(n.teacherName,user.name)||afaqEq(n.subject,user.subject)||afaqEq(n.subjectCode,user.subjectCode);
    }
    if(role==='student'){
      if(typeof getVisibleNotificationsForStudent==='function'){
        return getVisibleNotificationsForStudent(user).some(function(x){return x.id===n.id});
      }
      return false;
    }
    if(role==='parent')return true;
    return false;
  }).length;
}
function afaqMarkNotificationsRead(role,user){
  user=user||{};
  var uid=user.id||user.code||user.name||role;
  setData('notifications',getData('notifications').map(function(n){
    n.readBy=n.readBy||[];
    var ok=false;
    if(role==='admin')ok=true;
    else if(role==='teacher')ok=n.target==='عام'||n.target==='المدرسين'||n.teacherId===user.id||afaqEq(n.teacherName,user.name)||afaqEq(n.subject,user.subject)||afaqEq(n.subjectCode,user.subjectCode);
    else if(role==='student')ok=(typeof getVisibleNotificationsForStudent==='function')&&getVisibleNotificationsForStudent(user).some(function(x){return x.id===n.id});
    else if(role==='parent')ok=true;
    if(ok && n.readBy.indexOf(uid)===-1)n.readBy.push(uid);
    return n;
  }));
}
function afaqNotify(obj){
  var arr=getData('notifications');
  obj=obj||{};
  obj.id=obj.id||id();
  obj.createdAt=obj.createdAt||new Date().toLocaleString('ar-IQ');
  obj.readBy=obj.readBy||[];
  arr.unshift(obj);
  setData('notifications',arr);
  try{touchSync('notifications')}catch(e){}
}
function afaqNotifySubject(stage,subject,subjectCode,title,body,teacher){
  afaqNotify({title:title,body:body,target:'طلاب المادة',stage:stage,subject:subject,subjectCode:subjectCode,teacherId:teacher&&teacher.id,teacherName:teacher&&teacher.name,type:'subject-update'});
}
