
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

var active = '';

document.querySelectorAll('[data-role]').forEach(function(btn){
  btn.addEventListener('click', function(){
    active = btn.getAttribute('data-role');
    document.getElementById('mt').textContent = btn.querySelector('b').textContent;
    var fields = document.getElementById('fields');
    fields.innerHTML = '';

    roles[active].forEach(function(label){
      var div = document.createElement('div');
      div.className = 'field';

      var lab = document.createElement('label');
      lab.textContent = label;
      div.appendChild(lab);

      var input;
      if(label.indexOf('المرحلة') !== -1 || label.indexOf('المادة') !== -1){
        input = document.createElement('select');
        ['الثالث متوسط','السادس الإعدادي','الأحياء'].forEach(function(v){
          var op = document.createElement('option');
          op.value = v;
          op.textContent = v;
          input.appendChild(op);
        });
      }else{
        input = document.createElement('input');
        input.required = true;
        input.placeholder = label;
      }

      div.appendChild(input);
      fields.appendChild(div);
    });

    document.getElementById('reg').classList.toggle('hidden', active !== 'student');
    document.getElementById('m').classList.add('active');
  });
});

document.getElementById('x').onclick = function(){
  document.getElementById('m').classList.remove('active');
};

document.getElementById('login').onsubmit = function(e){
  e.preventDefault();
  window.location.href = pages[active];
};

document.getElementById('reg').onclick = function(){
  window.location.href = 'pages/student-register.html';
};
