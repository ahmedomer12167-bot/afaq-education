var P = 'afaq341_';

function id(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

function getData(key){
  return JSON.parse(localStorage.getItem(P + key) || '[]');
}

function setData(key, value){
  localStorage.setItem(P + key, JSON.stringify(value));
}

function today(){
  return new Date().toISOString().slice(0,10);
}

function addDays(dateText, days){
  var d = new Date(dateText || today());
  d.setDate(d.getDate() + Number(days || 30));
  return d.toISOString().slice(0,10);
}

function isExpired(dateText){
  return dateText && new Date(dateText) < new Date(today());
}

function sortByOrder(a,b){
  return Number(a.order || 0) - Number(b.order || 0);
}

function seedBase(){
  if(localStorage.getItem(P + 'seeded')) return;

  setData('stages', [
    {id:id(), name:'الأول متوسط', order:1, status:'مفعلة', visibility:'ظاهر'},
    {id:id(), name:'الثاني متوسط', order:2, status:'مفعلة', visibility:'ظاهر'},
    {id:id(), name:'الثالث متوسط', order:3, status:'مفعلة', visibility:'ظاهر'},
    {id:id(), name:'الرابع الإعدادي', order:4, status:'مفعلة', visibility:'ظاهر'},
    {id:id(), name:'الخامس الإعدادي', order:5, status:'مفعلة', visibility:'ظاهر'},
    {id:id(), name:'السادس الإعدادي', order:6, status:'مفعلة', visibility:'ظاهر'}
  ]);

  setData('subjects', [
    {id:id(), name:'الأحياء', code:'BIO-12347', stage:'الثالث متوسط', teacher:'غير محدد', color:'أخضر', icon:'🧬', order:1, status:'مفعلة', visibility:'ظاهر'},
    {id:id(), name:'الكيمياء', code:'CHE-65421', stage:'الثالث متوسط', teacher:'غير محدد', color:'أزرق', icon:'⚗️', order:2, status:'مفعلة', visibility:'ظاهر'}
  ]);

  setData('teachers', []);
  setData('students', []);
  setData('studentSubjects', []);
  setData('exams', []);
  setData('payments', []);
  localStorage.setItem(P + 'seeded', '1');
}

function stageUsage(stageName){
  var students = getData('students').filter(function(x){ return x.stage === stageName; }).length;
  var subjects = getData('subjects').filter(function(x){ return x.stage === stageName; }).length;
  var teachers = getData('teachers').filter(function(x){ return x.stage === stageName; }).length;
  return {students:students, subjects:subjects, teachers:teachers, total:students+subjects+teachers};
}

function subjectUsage(subjectName, subjectCode){
  var teachers = getData('teachers').filter(function(x){ return x.subject === subjectName || x.subjectCode === subjectCode; }).length;
  var students = getData('studentSubjects').filter(function(x){ return x.subject === subjectName || x.subjectCode === subjectCode; }).length;
  var exams = getData('exams').filter(function(x){ return x.subject === subjectName || x.subjectCode === subjectCode; }).length;
  return {teachers:teachers, students:students, exams:exams, total:teachers+students+exams};
}

function stageOptions(selected){
  var stages = getData('stages').filter(function(x){ return x.visibility === 'ظاهر' && x.status === 'مفعلة'; }).sort(sortByOrder);
  var html = '';
  for(var i=0;i<stages.length;i++){
    html += '<option value="' + stages[i].name + '"' + (selected === stages[i].name ? ' selected' : '') + '>' + stages[i].name + '</option>';
  }
  return html;
}

function subjectOptions(selected, stage){
  var subjects = getData('subjects').filter(function(x){
    return (!stage || x.stage === stage) && x.visibility !== 'مخفي' && x.status !== 'موقوفة';
  }).sort(sortByOrder);
  var html = '';
  for(var i=0;i<subjects.length;i++){
    html += '<option value="' + subjects[i].name + '" data-code="' + subjects[i].code + '"' + (selected === subjects[i].name ? ' selected' : '') + '>' + subjects[i].name + ' - ' + subjects[i].code + '</option>';
  }
  return html;
}

function randomTeacherCode(){
  return 'T-' + Math.floor(10000 + Math.random() * 90000);
}

function randomStudentCode(){
  return 'ST-' + Math.floor(1000 + Math.random() * 9000);
}

function getSubjectCodeByName(name){
  var sub = getData('subjects').find(function(x){ return x.name === name; });
  return sub ? sub.code : '';
}
