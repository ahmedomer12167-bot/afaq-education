
var current = 'home';
var acceptId = '';
var editKey = '';
var editIndex = null;

var navItems = [
  ['الرئيسية','home'],
  ['إعدادات الدفع','paymentSettings'],
  ['طلبات الاشتراك','requests'],
  ['الطلاب المقبولون','accepted'],
  ['الاشتراكات المنتهية','expired'],
  ['سجل المدفوعات','payments'],
  ['إدارة الطلاب','students'],
  ['إدارة المدرسين','teachers'],
  ['أولياء الأمور','parents'],
  ['المراحل','stages'],
  ['المواد','subjects'],
  ['الإشعارات','notifications'],
  ['الرسائل','messages'],
  ['الحضور','attendance'],
  ['لوحة الشرف','leaderboard'],
  ['المستويات','levels'],
  ['إعادة ضبط','reset']
];

function drawSide(){
  var side = document.getElementById('side');
  side.innerHTML = '<h2>آفاق التعليمية</h2>';

  navItems.forEach(function(item){
    var button = document.createElement('button');
    button.className = 'nav' + (current === item[1] ? ' active' : '');
    button.innerHTML = '<span>' + item[0] + '</span><span>›</span>';
    button.onclick = function(){
      openSection(item[1]);
    };
    side.appendChild(button);
  });
}

function allRequests(){
  return getData('requests');
}

function acceptedRequests(){
  return allRequests().filter(function(x){ return x.status === 'accepted'; });
}

function activeSubscriptions(){
  return acceptedRequests().filter(function(x){
    return !isExpired(x.endDate) && x.subStatus !== 'موقوف';
  });
}

function expiredSubscriptions(){
  return acceptedRequests().filter(function(x){
    return isExpired(x.endDate);
  });
}

function revenue(){
  return getData('payments').reduce(function(total, item){
    return total + (Number(item['المبلغ']) || 0);
  }, 0);
}

function statsHtml(){
  return '<div class="subcards">' +
    '<div class="subcard"><h3>🟢 نشطة</h3><strong>' + activeSubscriptions().length + '</strong></div>' +
    '<div class="subcard"><h3>🔴 منتهية</h3><strong>' + expiredSubscriptions().length + '</strong></div>' +
    '<div class="subcard"><h3>🟡 طلبات</h3><strong>' + allRequests().filter(function(x){return x.status === 'new';}).length + '</strong></div>' +
    '<div class="subcard"><h3>💰 الإيرادات</h3><strong>' + revenue().toLocaleString('ar-IQ') + '</strong></div>' +
  '</div>';
}

function panel(title, desc){
  return '<section class="panel"><h2>' + title + '</h2><p class="muted">' + (desc || '') + '</p>';
}

function openSection(section){
  current = section;
  drawSide();

  if(section === 'home') showHome();
  else if(section === 'paymentSettings') showPaymentSettings();
  else if(section === 'requests') showRequests('new');
  else if(section === 'accepted') showAccepted();
  else if(section === 'expired') showExpired();
  else if(section === 'reset') showReset();
  else showTable(section);
}

function showHome(){
  document.getElementById('content').innerHTML =
    panel('مركز إدارة الاشتراكات','نظرة عامة') + statsHtml() + '</section>';
}

function showPaymentSettings(){
  var s = getSettings();
  var html = panel('إعدادات الدفع والاشتراكات','هذه البيانات تظهر للطالب عند تقديم طلب الاشتراك.');
  html += '<form id="paymentForm" class="formgrid">';
  html += field('رقم الماستر الخاص بالمنصة','masterNumber',s.masterNumber);
  html += field('اسم صاحب البطاقة','cardOwner',s.cardOwner);
  html += field('اسم البنك اختياري','bankName',s.bankName);
  html += field('مدة الاشتراك الافتراضية بالأيام','defaultDuration',s.defaultDuration);
  html += field('مبلغ الأول متوسط','firstAmount',s.firstAmount);
  html += field('مبلغ الثاني متوسط','secondAmount',s.secondAmount);
  html += field('مبلغ الثالث متوسط','thirdAmount',s.thirdAmount);
  html += field('مبلغ الرابع الإعدادي','fourthAmount',s.fourthAmount);
  html += field('مبلغ الخامس الإعدادي','fifthAmount',s.fifthAmount);
  html += field('مبلغ السادس الإعدادي','sixthAmount',s.sixthAmount);
  html += '<div class="field full"><label>تعليمات الدفع للطالب</label><textarea id="paymentInstructions">' + s.paymentInstructions + '</textarea></div>';
  html += '<div class="field full"><label>حالة الاشتراكات</label><select id="subscriptionsEnabled"><option ' + (s.subscriptionsEnabled === 'مفعلة' ? 'selected' : '') + '>مفعلة</option><option ' + (s.subscriptionsEnabled === 'متوقفة' ? 'selected' : '') + '>متوقفة</option></select></div>';
  html += '<button class="primary full">حفظ إعدادات الدفع</button>';
  html += '</form></section>';
  document.getElementById('content').innerHTML = html;

  document.getElementById('paymentForm').onsubmit = function(e){
    e.preventDefault();
    saveSettings({
      masterNumber: document.getElementById('masterNumber').value,
      cardOwner: document.getElementById('cardOwner').value,
      bankName: document.getElementById('bankName').value,
      defaultDuration: document.getElementById('defaultDuration').value,
      firstAmount: document.getElementById('firstAmount').value,
      secondAmount: document.getElementById('secondAmount').value,
      thirdAmount: document.getElementById('thirdAmount').value,
      fourthAmount: document.getElementById('fourthAmount').value,
      fifthAmount: document.getElementById('fifthAmount').value,
      sixthAmount: document.getElementById('sixthAmount').value,
      paymentInstructions: document.getElementById('paymentInstructions').value,
      subscriptionsEnabled: document.getElementById('subscriptionsEnabled').value
    });
    alert('تم حفظ إعدادات الدفع');
  };
}

function field(label, idValue, value){
  return '<div class="field"><label>' + label + '</label><input id="' + idValue + '" value="' + (value || '') + '"></div>';
}

function showRequests(status){
  var items = allRequests().filter(function(x){ return x.status === status; });
  document.getElementById('content').innerHTML =
    panel('طلبات الاشتراك الجديدة','قبول الطلب ينشئ الطالب وولي الأمر وسجل الدفع.') +
    statsHtml() +
    requestsTable(items, true) +
    '</section>';
}

function showAccepted(){
  document.getElementById('content').innerHTML =
    panel('الطلاب المقبولون','تعديل وتجديد وإيقاف وتفعيل.') +
    statsHtml() +
    requestsTable(acceptedRequests(), false) +
    '</section>';
}

function showExpired(){
  document.getElementById('content').innerHTML =
    panel('الاشتراكات المنتهية','يمكن تجديدها مباشرة.') +
    statsHtml() +
    requestsTable(expiredSubscriptions(), false) +
    '</section>';
}

function requestsTable(items, canAccept){
  var html = '<div class="tablebox"><table class="tbl"><tr><th>الطالب</th><th>ولي الأمر</th><th>المرحلة</th><th>الهاتف</th><th>المبلغ</th><th>الكود</th><th>النهاية</th><th>حالة الدفع</th><th>حالة الاشتراك</th><th>أوامر</th></tr>';

  if(items.length === 0){
    html += '<tr><td colspan="10"><div class="empty">لا توجد بيانات</div></td></tr>';
  }else{
    items.forEach(function(x){
      html += '<tr>';
      html += '<td>' + (x.studentName || '') + '</td>';
      html += '<td>' + (x.parentName || '') + '</td>';
      html += '<td>' + (x.grade || '') + '</td>';
      html += '<td>' + (x.phone || '') + '</td>';
      html += '<td>' + (x.amount || '') + '</td>';
      html += '<td>' + (x.studentCode || '—') + '</td>';
      html += '<td>' + (x.endDate || '—') + '</td>';
      html += '<td>' + (x.paymentStatus || 'بانتظار المراجعة') + '</td>';
      html += '<td>' + (isExpired(x.endDate) ? 'منتهي' : (x.subStatus || x.status)) + '</td>';
      html += '<td><div class="actions">';

      if(canAccept){
        html += '<button class="btn green" onclick="openAccept(\'' + x.id + '\')">قبول</button>';
        html += '<button class="btn red" onclick="rejectRequest(\'' + x.id + '\')">رفض</button>';
      }else{
        html += '<button class="btn green" onclick="renewSubscription(\'' + x.id + '\')">تجديد</button>';
        html += '<button class="btn orange" onclick="toggleSubscription(\'' + x.id + '\')">' + (x.subStatus === 'موقوف' ? 'تفعيل' : 'إيقاف') + '</button>';
      }

      html += '<button class="btn" onclick="alert(\'' + (x.notes || 'لا توجد ملاحظات') + '\')">تفاصيل</button>';
      html += '<button class="btn red" onclick="deleteRequest(\'' + x.id + '\')">حذف</button>';
      html += '</div></td></tr>';
    });
  }

  html += '</table></div>';
  return html;
}

function showTable(key){
  var fields = schemas[key] || ['العنوان','الوصف','الحالة'];
  var data = getData(key);
  var html = panel(key, 'إضافة وتعديل وحذف');
  html += '<button class="btn" onclick="openEdit(\'' + key + '\')">إضافة جديد</button>';
  html += '<div class="tablebox"><table class="tbl"><tr>';

  fields.forEach(function(f){
    html += '<th>' + f + '</th>';
  });

  html += '<th>أوامر</th></tr>';

  if(data.length === 0){
    html += '<tr><td colspan="' + (fields.length + 1) + '"><div class="empty">لا توجد سجلات</div></td></tr>';
  }else{
    data.forEach(function(row, index){
      html += '<tr>';
      fields.forEach(function(f){
        html += '<td>' + (row[f] || '—') + '</td>';
      });
      html += '<td><div class="actions">';
      html += '<button class="btn" onclick="openEdit(\'' + key + '\',' + index + ')">تعديل</button>';
      html += '<button class="btn red" onclick="deleteRow(\'' + key + '\',' + index + ')">حذف</button>';
      html += '</div></td></tr>';
    });
  }

  html += '</table></div></section>';
  document.getElementById('content').innerHTML = html;
}

function showReset(){
  var ops = ['إعادة ضبط المنصة بالكامل','حذف جميع الطلاب','حذف الاشتراكات وسجلات الدفع'];
  var html = panel('إعادة ضبط المنصة','مع نسخة احتياطية وتأكيد') + '<div class="grid">';

  ops.forEach(function(op){
    html += '<div class="card danger"><h3>' + op + '</h3><p>سيتم إنشاء نسخة احتياطية قبل التنفيذ.</p><button class="btn red" onclick="dangerReset(\'' + op + '\')">تنفيذ</button></div>';
  });

  html += '</div></section>';
  document.getElementById('content').innerHTML = html;
}

function openAccept(idValue){
  acceptId = idValue;
  document.getElementById('code').value = 'ST-' + Math.floor(1000 + Math.random() * 9000);
  document.getElementById('start').value = today();
  document.getElementById('end').value = '';
  document.getElementById('adminNote').value = '';
  document.getElementById('paymentStatus').value = 'مدفوع';
  document.getElementById('accM').classList.add('active');
}

document.getElementById('accF').onsubmit = function(e){
  e.preventDefault();

  var requests = allRequests();
  var req = requests.find(function(x){ return x.id === acceptId; });
  if(!req) return;

  var updated = {
    id: req.id,
    studentName: req.studentName,
    parentName: req.parentName,
    grade: req.grade,
    phone: req.phone,
    amount: req.amount,
    notes: req.notes,
    status: 'accepted',
    studentCode: document.getElementById('code').value,
    startDate: document.getElementById('start').value,
    endDate: document.getElementById('end').value,
    subStatus: 'نشط',
    paymentStatus: document.getElementById('paymentStatus').value,
    adminNote: document.getElementById('adminNote').value,
    createdAt: req.createdAt || today()
  };

  setData('requests', requests.map(function(x){ return x.id === acceptId ? updated : x; }));

  var students = getData('students');
  students.unshift({
    'الاسم الثلاثي': req.studentName,
    'المرحلة': req.grade,
    'كود الطالب': updated.studentCode,
    'رقم الهاتف': req.phone,
    'الحالة': 'مفعل',
    'الاشتراك': 'نشط'
  });
  setData('students', students);

  var parents = getData('parents');
  parents.unshift({
    'اسم ولي الأمر': req.parentName,
    'اسم الطالب': req.studentName,
    'كود ولي الأمر': updated.studentCode,
    'رقم الهاتف': req.phone
  });
  setData('parents', parents);

  var payments = getData('payments');
  payments.unshift({
    'اسم الطالب': req.studentName,
    'ولي الأمر': req.parentName,
    'المرحلة': req.grade,
    'رقم الهاتف': req.phone,
    'المبلغ': req.amount,
    'تاريخ الدفع': today(),
    'حالة الدفع': updated.paymentStatus,
    'ملاحظات المدير': updated.adminNote
  });
  setData('payments', payments);

  document.getElementById('accM').classList.remove('active');
  openSection('requests');
};

function rejectRequest(idValue){
  setData('requests', allRequests().map(function(x){
    if(x.id === idValue){
      x.status = 'rejected';
      x.paymentStatus = 'مرفوض';
    }
    return x;
  }));
  openSection(current);
}

function renewSubscription(idValue){
  var newEnd = prompt('تاريخ الانتهاء الجديد');
  if(!newEnd) return;

  setData('requests', allRequests().map(function(x){
    if(x.id === idValue){
      x.endDate = newEnd;
      x.subStatus = 'نشط';
      x.paymentStatus = 'مجدد';
    }
    return x;
  }));

  openSection(current);
}

function toggleSubscription(idValue){
  setData('requests', allRequests().map(function(x){
    if(x.id === idValue){
      x.subStatus = x.subStatus === 'موقوف' ? 'نشط' : 'موقوف';
    }
    return x;
  }));
  openSection(current);
}

function deleteRequest(idValue){
  if(confirm('حذف الطلب؟')){
    setData('requests', allRequests().filter(function(x){ return x.id !== idValue; }));
    openSection(current);
  }
}

function openEdit(key, index){
  editKey = key;
  editIndex = typeof index === 'number' ? index : null;
  var fields = schemas[key] || ['العنوان','الوصف','الحالة'];
  var row = editIndex !== null ? getData(key)[editIndex] : {};
  document.getElementById('editT').textContent = editIndex !== null ? 'تعديل' : 'إضافة';
  var html = '';

  fields.forEach(function(f){
    html += '<div class="field"><label>' + f + '</label><input id="e_' + f + '" value="' + (row[f] || '') + '"></div>';
  });

  document.getElementById('editFields').innerHTML = html;
  document.getElementById('editM').classList.add('active');
}

document.getElementById('editF').onsubmit = function(e){
  e.preventDefault();

  var fields = schemas[editKey] || ['العنوان','الوصف','الحالة'];
  var data = getData(editKey);
  var obj = {};

  fields.forEach(function(f){
    obj[f] = document.getElementById('e_' + f).value || '—';
  });

  if(editIndex !== null) data[editIndex] = obj;
  else data.unshift(obj);

  setData(editKey, data);
  document.getElementById('editM').classList.remove('active');
  openSection(current);
};

function deleteRow(key, index){
  var data = getData(key);
  data.splice(index, 1);
  setData(key, data);
  openSection(current);
}

function dangerReset(name){
  localStorage.setItem('afaq293_backup', JSON.stringify({
    requests: getData('requests'),
    students: getData('students'),
    payments: getData('payments'),
    settings: getSettings(),
    date: new Date().toISOString()
  }));

  var text = prompt('اكتب: أوافق على الحذف');
  if(text === 'أوافق على الحذف'){
    if(name.indexOf('المنصة') !== -1){
      ['requests','students','parents','payments'].forEach(function(k){ setData(k, []); });
    }
    if(name.indexOf('طلاب') !== -1) setData('students', []);
    if(name.indexOf('اشتراكات') !== -1){
      setData('requests', []);
      setData('payments', []);
    }
    alert('تم التنفيذ بعد النسخ الاحتياطي');
    openSection('reset');
  }
}

drawSide();
openSection('home');
