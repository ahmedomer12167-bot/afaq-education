
var P = 'afaq292_';

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

function isExpired(dateText){
  return dateText && new Date(dateText) < new Date(today());
}

var schemas = {
  students:['الاسم الثلاثي','المرحلة','كود الطالب','رقم الهاتف','الحالة','الاشتراك','رقم الماستر'],
  teachers:['الاسم الثلاثي','المرحلة','المادة','كود المدرس','كود المادة','الحالة'],
  parents:['اسم ولي الأمر','اسم الطالب','كود ولي الأمر','رقم الهاتف'],
  stages:['اسم المرحلة','الترتيب','الحالة'],
  subjects:['اسم المادة','كود المادة','المرحلة','اللون','الأيقونة','الترتيب'],
  payments:['اسم الطالب','رقم الماستر','المبلغ','التاريخ','نوع العملية','ملاحظات'],
  notifications:['العنوان','المستهدف','النص','التاريخ'],
  messages:['المرسل','المستلم','العنوان','الحالة','التاريخ'],
  attendance:['اسم الطالب','المادة','التاريخ','الحالة'],
  leaderboard:['اسم الطالب','المادة','النقاط','المستوى'],
  levels:['اسم المستوى','النسبة المطلوبة','الشروط']
};
