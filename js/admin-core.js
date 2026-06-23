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
