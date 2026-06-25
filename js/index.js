
let Core = null;
let coreReady = Promise.resolve(false);

async function loadCore(){
  try{
    Core = await import("./core.js?v=14.2");
    if(Core.readyPromise) await Core.readyPromise.catch(()=>false);
    return true;
  }catch(err){
    console.error("AFAQ core load failed:", err);
    document.documentElement.dataset.firebase = "error";
    return false;
  }
}
coreReady = loadCore();

const fallbackStages = ["الأول متوسط","الثاني متوسط","الثالث متوسط","الرابع الإعدادي","الخامس الإعدادي","السادس الإعدادي"];
const roles = {
  student:["الاسم الثلاثي","المرحلة الدراسية","كود الطالب"],
  teacher:["الاسم الثلاثي","المادة","المرحلة الدراسية","كود المدرس"],
  parent:["الاسم الثلاثي","كود ولي الأمر"],
  admin:["كود المدير"]
};
const pages = {student:"pages/student.html", teacher:"pages/teacher.html", parent:"pages/parent.html", admin:"pages/admin.html"};
let activeRole = "";
const modal = document.getElementById("loginModal");
const fields = document.getElementById("fields");

function safeClean(v){
  return String(v||"").trim().replace(/\s+/g," ").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").toLowerCase();
}
function valueOf(label){
  return document.querySelector(`[data-label="${label}"]`)?.value?.trim() || "";
}
function getStages(){
  try{
    if(Core?.stages){
      const s = Core.stages().map(x=>x.name).filter(Boolean);
      if(s.length) return s;
    }
  }catch(e){}
  return fallbackStages;
}
function getSubjects(){
  try{
    if(Core?.subjects){
      const s = Core.subjects().map(x=>x.name).filter(Boolean);
      if(s.length) return s;
    }
  }catch(e){}
  return ["الأحياء","الكيمياء","الفيزياء","الرياضيات","العربي","الإنكليزي","الإسلامية","الاجتماعيات"];
}
function makeField(label){
  const wrap = document.createElement("div");
  wrap.className = "field";
  wrap.innerHTML = `<label>${label}</label>`;
  let el;
  if(label.includes("المرحلة")){
    el = document.createElement("select");
    getStages().forEach(s=>el.innerHTML += `<option>${s}</option>`);
  }else if(label.includes("المادة")){
    el = document.createElement("select");
    getSubjects().forEach(s=>el.innerHTML += `<option>${s}</option>`);
  }else{
    el = document.createElement("input");
    el.required = true;
  }
  el.dataset.label = label;
  wrap.appendChild(el);
  return wrap;
}
function openRole(role){
  activeRole = role;
  fields.innerHTML = "";
  roles[role].forEach(label => fields.appendChild(makeField(label)));
  const title = document.querySelector(`[data-role="${role}"] b`)?.textContent || "تسجيل الدخول";
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("registerBtn").classList.toggle("hidden", role !== "student");
  modal.classList.add("active");
}
document.querySelectorAll("[data-role]").forEach(card=>{
  card.addEventListener("click", ()=>openRole(card.dataset.role));
});
document.getElementById("close").onclick = ()=>modal.classList.remove("active");
document.getElementById("closeReq").onclick = ()=>document.getElementById("reqModal").classList.remove("active");
document.getElementById("theme").onclick = ()=>{
  document.body.classList.toggle("light-mode");
  localStorage.setItem("afaq_theme", document.body.classList.contains("light-mode") ? "light" : "dark");
};
if(localStorage.getItem("afaq_theme")==="light") document.body.classList.add("light-mode");

document.getElementById("registerBtn").onclick = async ()=>{
  await coreReady;
  modal.classList.remove("active");
  document.getElementById("r_stage").innerHTML = getStages().map(s=>`<option>${s}</option>`).join("");
  let s = {};
  try{s = Core?.settings ? Core.settings() : {masterNumber:"",masterOwner:""};}catch(e){}
  document.getElementById("masterNumberView").textContent = s.masterNumber || "يحدده المدير من الإعدادات";
  document.getElementById("masterOwnerView").textContent = s.masterOwner ? ("صاحب الحساب: "+s.masterOwner) : "";
  document.getElementById("reqModal").classList.add("active");
};
document.getElementById("reqForm").onsubmit = async e=>{
  e.preventDefault();
  await coreReady;
  if(!Core?.addItem){
    alert("لم يتم تحميل ملفات المنصة. تأكد من رفع مجلد js بالكامل ثم اضغط Ctrl+F5.");
    return;
  }
  const s = Core.settings();
  await Core.addItem("subscriptionRequests",{
    name:r_name.value,
    parentName:r_parent.value,
    stage:r_stage.value,
    phone:r_phone.value,
    amount:r_amount.value,
    masterNumber:s.masterNumber||"",
    masterOwner:s.masterOwner||"",
    status:"pending",
    createdAt:new Date().toLocaleString("ar-IQ")
  });
  alert("تم إرسال الطلب إلى المدير");
  reqForm.reset();
  reqModal.classList.remove("active");
};

document.getElementById("loginForm").onsubmit = async e=>{
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = "جاري التحقق...";
  try{
    await coreReady;
    if(!Core){
      alert("ملفات JavaScript لم تعمل. ارفع النسخة الجديدة كاملة ثم اضغط Ctrl+F5.");
      return;
    }
    if(activeRole==="admin"){
      if(safeClean(valueOf("كود المدير")) !== safeClean(Core.settings().adminCode || "1234")){
        alert("كود المدير غير صحيح");
        return;
      }
      sessionStorage.setItem("afaq_current_admin","true");
      location.href = pages.admin;
      return;
    }
    if(activeRole==="teacher"){
      const u = Core.findTeacher(valueOf("الاسم الثلاثي"), valueOf("المادة"), valueOf("المرحلة الدراسية"), valueOf("كود المدرس"));
      if(!u){ alert("بيانات المدرس غير مطابقة"); return; }
      sessionStorage.setItem("afaq_current_teacher", JSON.stringify(u));
      location.href = pages.teacher;
      return;
    }
    if(activeRole==="student"){
      const u = Core.findStudent(valueOf("الاسم الثلاثي"), valueOf("المرحلة الدراسية"), valueOf("كود الطالب"));
      if(!u){ alert("بيانات الطالب غير مطابقة أو لم يتم تفعيل الاشتراك"); return; }
      sessionStorage.setItem("afaq_current_student", JSON.stringify(u));
      location.href = pages.student;
      return;
    }
    if(activeRole==="parent"){
      const u = Core.findParent(valueOf("الاسم الثلاثي"), valueOf("كود ولي الأمر"));
      if(!u){ alert("بيانات ولي الأمر غير مطابقة"); return; }
      sessionStorage.setItem("afaq_current_parent", JSON.stringify(u));
      location.href = pages.parent;
    }
  }finally{
    btn.disabled = false;
    btn.textContent = old;
  }
};
