var roles={
  student:['الاسم الثلاثي','المرحلة الدراسية','كود الطالب'],
  teacher:['الاسم الثلاثي','المادة','المرحلة الدراسية','كود المدرس'],
  parent:['الاسم الثلاثي','كود ولي الأمر'],
  admin:['كود المدير']
};

var pages={student:'pages/student.html',teacher:'pages/teacher.html',parent:'pages/parent.html',admin:'pages/admin.html'};
var activeRole='';

function getStore(key){
  if(typeof getData==='function') return getData(key);
  return JSON.parse(localStorage.getItem('afaq40_'+key)||'[]');
}
function getSettings(){
  if(typeof afaqGetSettings==='function') return afaqGetSettings();
  if(typeof getObj==='function') return getObj('settings',{adminCode:'1234'});
  return JSON.parse(localStorage.getItem('afaq40_settings')||'{"adminCode":"1234"}');
}
function seedBaseForLogin(){
  if(localStorage.getItem('afaq40_seeded')) return;
  localStorage.setItem('afaq40_stages', JSON.stringify([
    {id:'stage1',name:'الأول متوسط',order:1,status:'مفعلة',visibility:'ظاهر'},
    {id:'stage2',name:'الثاني متوسط',order:2,status:'مفعلة',visibility:'ظاهر'},
    {id:'stage3',name:'الثالث متوسط',order:3,status:'مفعلة',visibility:'ظاهر'},
    {id:'stage4',name:'الرابع الإعدادي',order:4,status:'مفعلة',visibility:'ظاهر'},
    {id:'stage5',name:'الخامس الإعدادي',order:5,status:'مفعلة',visibility:'ظاهر'},
    {id:'stage6',name:'السادس الإعدادي',order:6,status:'مفعلة',visibility:'ظاهر'}
  ]));
  localStorage.setItem('afaq40_subjects', JSON.stringify([
    {id:'sub1',name:'الأحياء',code:'BIO-12347',stage:'الثالث متوسط',teacher:'غير محدد',color:'أخضر',icon:'🧬',order:1,status:'مفعلة',visibility:'ظاهر'},
    {id:'sub2',name:'الكيمياء',code:'CHE-65421',stage:'الثالث متوسط',teacher:'غير محدد',color:'أزرق',icon:'⚗️',order:2,status:'مفعلة',visibility:'ظاهر'}
  ]));
  ['teachers','students','parents','requests','payments','notifications','messages','honor','studentSubjects','exams','attendance','activity'].forEach(function(k){
    if(!localStorage.getItem('afaq40_'+k)) localStorage.setItem('afaq40_'+k, JSON.stringify([]));
  });
  localStorage.setItem('afaq40_settings', JSON.stringify({platformName:'آفاق التعليمية',footer:'جميع الحقوق محفوظة',masterNumber:'0000 0000 0000 0000',cardOwner:'اسم صاحب البطاقة',adminCode:'1234'}));
  localStorage.setItem('afaq40_seeded','1');
}
seedBaseForLogin();

// ===== v8.0.2 robust login matching =====
function loginClean(v){
  return String(v||'').trim().replace(/\s+/g,' ').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase();
}
function loginEq(a,b){return loginClean(a)===loginClean(b)}
function loginNotStopped(x){
  var st=loginClean((x&&x.status)||'');
  return st!=='موقوف' && st!=='موقوفه' && st!=='متوقف' && st!=='معطل';
}
function findTeacherLogin(name,subject,stage,code){
  return getStore('teachers').find(function(t){
    var tCode=t.teacherCode||t.code||t.teacher_code||'';
    var okCode=loginEq(tCode,code);
    var okName=loginEq(t.name,name);
    var okStage=loginEq(t.stage,stage);
    var okSubject=loginEq(t.subject,subject)||loginEq(t.subjectName,subject);
    return okName&&okStage&&okSubject&&okCode&&loginNotStopped(t);
  });
}
function findStudentLogin(name,stage,code){
  return getStore('students').find(function(s){
    return loginEq(s.name,name)&&loginEq(s.stage,stage)&&loginEq(s.code||s.studentCode,code)&&loginNotStopped(s);
  });
}
function findParentLogin(name,code){
  return getStore('parents').find(function(p){
    return loginEq(p.name,name)&&loginEq(p.code||p.parentCode,code);
  }) || getStore('students').map(function(s){
    return {id:'parent_'+s.id,name:s.parentName||name,code:s.parentCode||s.code,studentName:s.name,studentCode:s.code};
  }).find(function(p){return loginEq(p.name,name)&&loginEq(p.code,code)});
}
function refreshLoginSelects(){
  document.querySelectorAll('[data-label="المرحلة الدراسية"]').forEach(function(sel){
    if(sel.tagName!=='SELECT')return;
    var old=sel.value;
    var stages=(typeof afaqStageOptions==='function')?afaqStageOptions():getStore('stages').map(function(x){return x.name});
    sel.innerHTML='';
    stages.forEach(function(v){var op=document.createElement('option');op.value=v;op.textContent=v;sel.appendChild(op)});
    if(old)sel.value=old;
  });
  document.querySelectorAll('[data-label="المادة"]').forEach(function(sel){
    if(sel.tagName!=='SELECT')return;
    var old=sel.value;
    var stageEl=document.querySelector('[data-label="المرحلة الدراسية"]');
    var stage=stageEl?stageEl.value:'';
    var subjects=(typeof afaqSubjectOptions==='function')?afaqSubjectOptions(stage):getStore('subjects');
    sel.innerHTML='';
    subjects.forEach(function(s){var op=document.createElement('option');op.value=s.name||s.subject;op.textContent=s.name||s.subject;sel.appendChild(op)});
    if(old)sel.value=old;
  });
}


function makeInput(label){
  var input;
  if(label.indexOf('المرحلة')!==-1){
    input=document.createElement('select');
    var stages=getStore('stages').filter(function(x){return x.visibility==='ظاهر'&&x.status==='مفعلة';});
    stages.forEach(function(v){var op=document.createElement('option');op.value=v.name;op.textContent=v.name;input.appendChild(op)});
  }else if(label.indexOf('المادة')!==-1){
    input=document.createElement('select');
    getStore('subjects').filter(function(x){return x.visibility!=='مخفي'&&x.status!=='موقوفة';}).forEach(function(v){var op=document.createElement('option');op.value=v.name;op.textContent=v.name;input.appendChild(op)});
  }else{
    input=document.createElement('input');
    input.required=true;
    input.placeholder=label;
  }
  input.setAttribute('data-label', label);
  return input;
}

document.querySelectorAll('[data-role]').forEach(function(btn){
  btn.onclick=function(){
    activeRole=this.getAttribute('data-role');
    document.getElementById('modalTitle').textContent=this.querySelector('b').textContent;
    var fields=document.getElementById('loginFields');
    fields.innerHTML='';
    roles[activeRole].forEach(function(label){
      var div=document.createElement('div');
      div.className='field';
      var lab=document.createElement('label');
      lab.textContent=label;
      div.appendChild(lab);
      div.appendChild(makeInput(label));
      fields.appendChild(div);
    });
    document.getElementById('studentRegisterBtn').classList.toggle('hidden',activeRole!=='student');
    document.getElementById('loginModal').classList.add('active');
    setTimeout(refreshLoginSelects,100);
  };
});

document.getElementById('closeLogin').onclick=function(){
  document.getElementById('loginModal').classList.remove('active');
};

function fieldValue(label){
  var el=document.querySelector('[data-label="'+label+'"]');
  return el ? el.value.trim() : '';
}

document.getElementById('loginForm').onsubmit=function(e){
  e.preventDefault();

  if(activeRole==='admin'){
    var code=fieldValue('كود المدير');
    var settings=getSettings();
    if(!loginEq(code, (settings.adminCode || '1234'))){
      alert('كود المدير غير صحيح');
      return;
    }
    sessionStorage.setItem('afaq_current_admin','true');
    window.location.href=pages.admin;
    return;
  }

  if(activeRole==='teacher'){
    var name=fieldValue('الاسم الثلاثي');
    var subject=fieldValue('المادة');
    var stage=fieldValue('المرحلة الدراسية');
    var code=fieldValue('كود المدرس');
    var teacher=findTeacherLogin(name,subject,stage,code);
    if(!teacher){
      alert('بيانات المدرس غير مطابقة أو كود المدرس غير صحيح أو الحساب موقوف');
      return;
    }
    if(!teacher.subjectCode && typeof afaqSubjectCodeByNameStage==='function') teacher.subjectCode=afaqSubjectCodeByNameStage(teacher.subject,teacher.stage);
    sessionStorage.setItem('afaq_current_teacher', JSON.stringify(teacher));
    window.location.href=pages.teacher;
    return;
  }

  if(activeRole==='student'){
    var sname=fieldValue('الاسم الثلاثي');
    var sstage=fieldValue('المرحلة الدراسية');
    var scode=fieldValue('كود الطالب');
    var student=findStudentLogin(sname,sstage,scode);
    if(!student){
      alert('بيانات الطالب غير مطابقة أو الحساب موقوف');
      return;
    }
    sessionStorage.setItem('afaq_current_student', JSON.stringify(student));
    window.location.href=pages.student;
    return;
  }

  if(activeRole==='parent'){
    var pname=fieldValue('الاسم الثلاثي');
    var pcode=fieldValue('كود ولي الأمر');
    var parent=findParentLogin(pname,pcode);
    if(!parent){
      alert('بيانات ولي الأمر غير مطابقة');
      return;
    }
    sessionStorage.setItem('afaq_current_parent', JSON.stringify(parent));
    window.location.href=pages.parent;
  }
};

document.getElementById('studentRegisterBtn').onclick=function(){
  window.location.href='pages/student-register.html';
};

window.addEventListener('afaq:data-changed',function(e){if(e.detail&&['teachers','subjects','stages','settings'].indexOf(e.detail.key)!==-1){try{refreshLoginSelects()}catch(err){}}});
