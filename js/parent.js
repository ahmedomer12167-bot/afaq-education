
import * as A from "./core.js";import {guard,shell,panel,card,showNotifications,updateBadge} from "./dashboard.js";
const user=guard("parent");let nav=[{id:"home",title:"المتابعة",icon:"🏠"},{id:"results",title:"النتائج",icon:"🏆"},{id:"attendance",title:"الحضور",icon:"📅"},{id:"notifications",title:"الإشعارات",icon:"🔔"},{id:"messages",title:"الرسائل",icon:"✉️"}];let draw=shell("لوحة ولي الأمر","parent",user,nav);let current="home";
function student(){return A.getData("students").find(s=>A.code(s.code)===A.code(user.studentCode)||A.eq(s.name,user.studentName))}
window.openSection=async id=>{current=id;draw(id);updateBadge("parent",user);if(id==="home")home();if(id==="results")results();if(id==="attendance")attendance();if(id==="notifications"){await showNotifications("parent",user);updateBadge("parent",user)}if(id==="messages")messages()}
function home(){let s=student()||{};content.innerHTML=panel("متابعة الطالب")+`<div class="card-grid">${card(s.name||user.studentName,`<p>${s.stage||""}</p><span class="chip">${s.subscriptionStatus||""}</span><p>الكود: ${s.code||user.studentCode}</p>`)}</div>`}
function results(){let s=student()||{};let arr=A.getData("finalResults").filter(r=>A.code(r.studentCode)===A.code(s.code));content.innerHTML=panel("نتائج الطالب")+`<div class="card-grid">${arr.map(r=>card(r.subject,`<strong>${r.score||r.grade}</strong>`)).join("")||'<div class="empty">لا توجد نتائج</div>'}</div>`}
function attendance(){content.innerHTML=panel("الحضور والغياب")+`<div class="empty">سيظهر سجل الحضور هنا عند تسجيله من المدرس.</div>`}
function messages(){content.innerHTML=panel("الرسائل")+`<button class="green" onclick="send()">رسالة للإدارة</button>`}
window.send=async()=>{let body=prompt("اكتب الرسالة"); if(body)await A.addItem("messages",{from:user.name,to:"admin",title:"رسالة ولي أمر",body,studentCode:user.studentCode,createdAt:A.now()})}
A.onSync(()=>openSection(current));openSection("home");
