
import * as A from "./core.js";
import {readyPromise,stages,subjects,settings,findStudent,findTeacher,findParent,addItem,clean,code,onSync} from "./core.js";

// ===== v12.1 Login stability patch =====
async function afaqReadyLogin(){
  try{ await readyPromise; }catch(e){}
  await new Promise(r=>setTimeout(r,350));
}

const roles={student:["الاسم الثلاثي","المرحلة الدراسية","كود الطالب"],teacher:["الاسم الثلاثي","المادة","المرحلة الدراسية","كود المدرس"],parent:["الاسم الثلاثي","كود ولي الأمر"],admin:["كود المدير"]};
const pages={student:"pages/student.html",teacher:"pages/teacher.html",parent:"pages/parent.html",admin:"pages/admin.html"};
let activeRole="";
const modal=document.getElementById("loginModal"),fields=document.getElementById("fields");
function field(label){return document.querySelector(`[data-label="${label}"]`)?.value.trim()||""}
function make(label){
 let wrap=document.createElement("div");wrap.className="field";wrap.innerHTML=`<label>${label}</label>`;
 let el;
 if(label.includes("المرحلة")){el=document.createElement("select");stages().filter(s=>s.visibility!=="مخفي").forEach(s=>el.innerHTML+=`<option value="${s.name}">${s.name}</option>`)}
 else if(label.includes("المادة")){el=document.createElement("select");subjects().forEach(s=>el.innerHTML+=`<option value="${s.name}">${s.name}</option>`)}
 else{el=document.createElement("input");el.required=true}
 el.dataset.label=label;wrap.appendChild(el);return wrap
}
function openRole(r){activeRole=r;fields.innerHTML="";roles[r].forEach(x=>fields.appendChild(make(x)));document.getElementById("modalTitle").textContent=document.querySelector(`[data-role="${r}"] b`).textContent;document.getElementById("registerBtn").classList.toggle("hidden",r!=="student");modal.classList.add("active")}
document.querySelectorAll("[data-role]").forEach(x=>x.onclick=()=>openRole(x.dataset.role));
document.getElementById("close").onclick=()=>modal.classList.remove("active");
document.getElementById("theme").onclick=()=>{document.body.classList.toggle("light-mode");localStorage.setItem("afaq_theme",document.body.classList.contains("light-mode")?"light":"dark")};
if(localStorage.getItem("afaq_theme")==="light")document.body.classList.add("light-mode");
document.getElementById("loginForm").onsubmit=async e=>{
 e.preventDefault();
 let btn=e.target.querySelector("button[type=submit]"); let old=btn?btn.textContent:"";
 if(btn){btn.disabled=true;btn.textContent="جاري التحقق...";}
 try{
  await afaqReadyLogin();
  if(activeRole==="admin"){
    let c=field("كود المدير");
    if(clean(c)!==clean(settings().adminCode||"1234")) return alert("كود المدير غير صحيح");
    sessionStorage.setItem("afaq_current_admin","true"); location.href=pages.admin; return;
  }
  if(activeRole==="teacher"){
    let u=A.findTeacherStrict?A.findTeacherStrict(field("الاسم الثلاثي"),field("المادة"),field("المرحلة الدراسية"),field("كود المدرس")):findTeacher(field("الاسم الثلاثي"),field("المادة"),field("المرحلة الدراسية"),field("كود المدرس"));
    if(!u)return alert("بيانات المدرس غير مطابقة. تأكد من الاسم والمرحلة والمادة والكود كما أضافها المدير.");
    sessionStorage.setItem("afaq_current_teacher",JSON.stringify(u)); location.href=pages.teacher;return;
  }
  if(activeRole==="student"){
    let u=A.findStudentStrict?A.findStudentStrict(field("الاسم الثلاثي"),field("المرحلة الدراسية"),field("كود الطالب")):findStudent(field("الاسم الثلاثي"),field("المرحلة الدراسية"),field("كود الطالب"));
    if(!u)return alert("بيانات الطالب غير مطابقة. تأكد أن المدير قبل الاشتراك وأن الاسم والمرحلة والكود مطابقة.");
    sessionStorage.setItem("afaq_current_student",JSON.stringify(u)); location.href=pages.student;return;
  }
  if(activeRole==="parent"){
    let u=A.findParentStrict?A.findParentStrict(field("الاسم الثلاثي"),field("كود ولي الأمر")):findParent(field("الاسم الثلاثي"),field("كود ولي الأمر"));
    if(!u)return alert("بيانات ولي الأمر غير مطابقة");
    sessionStorage.setItem("afaq_current_parent",JSON.stringify(u)); location.href=pages.parent;
  }
 } finally {
  if(btn){btn.disabled=false;btn.textContent=old;}
 }
};
document.getElementById("registerBtn").onclick=()=>{modal.classList.remove("active");document.getElementById("r_stage").innerHTML=stages().map(s=>`<option>${s.name}</option>`).join("");document.getElementById("reqModal").classList.add("active")};
document.getElementById("closeReq").onclick=()=>document.getElementById("reqModal").classList.remove("active");
document.getElementById("reqForm").onsubmit=async e=>{e.preventDefault(); await addItem("subscriptionRequests",{name:r_name.value,parentName:r_parent.value,stage:r_stage.value,phone:r_phone.value,amount:r_amount.value,status:"pending",createdAt:new Date().toLocaleString("ar-IQ")});alert("تم إرسال الطلب إلى المدير");reqForm.reset();reqModal.classList.remove("active")};
onSync(()=>{});
