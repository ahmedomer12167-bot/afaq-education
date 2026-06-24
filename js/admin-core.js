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
