var roles={
  student:['الاسم الثلاثي','المرحلة الدراسية','كود الطالب'],
  teacher:['الاسم الثلاثي','المادة','المرحلة الدراسية','كود المدرس'],
  parent:['الاسم الثلاثي','كود ولي الأمر'],
  admin:['كود المدير']
};

var pages={student:'pages/student.html',teacher:'pages/teacher.html',parent:'pages/parent.html',admin:'pages/admin.html'};
var activeRole='';

function getStore(key){
  return JSON.parse(localStorage.getItem('afaq40_'+key)||'[]');
}
function getSettings(){
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
    if(code !== (settings.adminCode || '1234')){
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
    var teacher=getStore('teachers').find(function(t){
      return t.name===name && t.subject===subject && t.stage===stage && t.teacherCode===code && t.status!=='موقوف';
    });
    if(!teacher){
      alert('بيانات المدرس غير مطابقة أو الحساب موقوف');
      return;
    }
    sessionStorage.setItem('afaq_current_teacher', JSON.stringify(teacher));
    window.location.href=pages.teacher;
    return;
  }

  if(activeRole==='student'){
    var sname=fieldValue('الاسم الثلاثي');
    var sstage=fieldValue('المرحلة الدراسية');
    var scode=fieldValue('كود الطالب');
    var student=getStore('students').find(function(s){
      return s.name===sname && s.stage===sstage && s.code===scode && s.status!=='موقوف';
    });
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
    var parent=getStore('parents').find(function(p){
      return p.name===pname && p.code===pcode;
    });
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
