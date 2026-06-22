
var P = 'afaq293_';

function id(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

function getData(key){
  return JSON.parse(localStorage.getItem(P + key) || '[]');
}

function setData(key, value){
  localStorage.setItem(P + key, JSON.stringify(value));
}

function getSettings(){
  var defaults = {
    masterNumber: '0000 0000 0000 0000',
    cardOwner: 'اسم صاحب البطاقة',
    bankName: 'غير محدد',
    paymentInstructions: 'حوّل مبلغ الاشتراك ثم أرسل الطلب ليتم مراجعته من المدير.',
    subscriptionsEnabled: 'مفعلة',
    defaultDuration: '30',
    firstAmount: '',
    secondAmount: '',
    thirdAmount: '',
    fourthAmount: '',
    fifthAmount: '',
    sixthAmount: ''
  };
  var saved = JSON.parse(localStorage.getItem(P + 'paymentSettings') || 'null');
  return saved || defaults;
}

function saveSettings(settings){
  localStorage.setItem(P + 'paymentSettings', JSON.stringify(settings));
}

function today(){
  return new Date().toISOString().slice(0,10);
}

function isExpired(dateText){
  return dateText && new Date(dateText) < new Date(today());
}

var schemas = {
  students:['الاسم الثلاثي','المرحلة','كود الطالب','رقم الهاتف','الحالة','الاشتراك'],
  teachers:['الاسم الثلاثي','المرحلة','المادة','كود المدرس','كود المادة','الحالة'],
  parents:['اسم ولي الأمر','اسم الطالب','كود ولي الأمر','رقم الهاتف'],
  stages:['اسم المرحلة','الترتيب','الحالة'],
  subjects:['اسم المادة','كود المادة','المرحلة','اللون','الأيقونة','الترتيب'],
  payments:['اسم الطالب','ولي الأمر','المرحلة','رقم الهاتف','المبلغ','تاريخ الدفع','حالة الدفع','ملاحظات المدير'],
  notifications:['العنوان','المستهدف','النص','التاريخ'],
  messages:['المرسل','المستلم','العنوان','الحالة','التاريخ'],
  attendance:['اسم الطالب','المادة','التاريخ','الحالة'],
  leaderboard:['اسم الطالب','المادة','النقاط','المستوى'],
  levels:['اسم المستوى','النسبة المطلوبة','الشروط']
};
