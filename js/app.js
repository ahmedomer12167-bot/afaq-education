var roles = {
  student: ['الاسم الثلاثي','المرحلة الدراسية','كود الطالب'],
  teacher: ['الاسم الثلاثي','المادة','المرحلة الدراسية','كود المدرس'],
  parent: ['الاسم الثلاثي','كود ولي الأمر'],
  admin: ['كود المدير']
};

var pages = {
  student: 'pages/student.html',
  teacher: 'pages/teacher.html',
  parent: 'pages/parent.html',
  admin: 'pages/admin.html'
};

var activeRole = '';

function makeInput(label){
  var input;
  if(label.indexOf('المرحلة') !== -1 || label.indexOf('المادة') !== -1){
    input = document.createElement('select');
    var values = ['الأول متوسط','الثاني متوسط','الثالث متوسط','الرابع الإعدادي','الخامس الإعدادي','السادس الإعدادي','الأحياء','الكيمياء','الفيزياء'];
    for(var i=0;i<values.length;i++){
      var op = document.createElement('option');
      op.value = values[i];
      op.textContent = values[i];
      input.appendChild(op);
    }
  }else{
    input = document.createElement('input');
    input.required = true;
    input.placeholder = label;
  }
  return input;
}

var roleButtons = document.querySelectorAll('[data-role]');
for(var i=0;i<roleButtons.length;i++){
  roleButtons[i].onclick = function(){
    activeRole = this.getAttribute('data-role');
    document.getElementById('modalTitle').textContent = this.querySelector('b').textContent;
    var fields = document.getElementById('loginFields');
    fields.innerHTML = '';
    var list = roles[activeRole];
    for(var j=0;j<list.length;j++){
      var div = document.createElement('div');
      div.className = 'field';
      var lab = document.createElement('label');
      lab.textContent = list[j];
      div.appendChild(lab);
      div.appendChild(makeInput(list[j]));
      fields.appendChild(div);
    }
    document.getElementById('studentRegisterBtn').classList.toggle('hidden', activeRole !== 'student');
    document.getElementById('loginModal').classList.add('active');
  };
}

document.getElementById('closeLogin').onclick = function(){
  document.getElementById('loginModal').classList.remove('active');
};

document.getElementById('loginForm').onsubmit = function(e){
  e.preventDefault();
  window.location.href = pages[activeRole];
};

document.getElementById('studentRegisterBtn').onclick = function(){
  window.location.href = 'pages/student-register.html';
};
