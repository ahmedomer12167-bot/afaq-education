
import * as A from "../js/core.js";
window.A=A;
export function guard(role){let u=A.currentUser(role); if(!u && role!=="admin"){location.href="../index.html";return null} if(role==="admin"&&!sessionStorage.getItem("afaq_current_admin")){location.href="../index.html";return null} return u||{id:"admin",name:"المدير"}}
export function shell(title,role,user,nav){document.body.innerHTML=`<header class="head"><div><b class="brand">${title}</b><p class="muted">${user?.name||""}</p></div><div><button id="theme" class="ghost">🌙</button><button id="logout" class="red">خروج</button></div></header><main class="layout"><aside class="side"><h2>القائمة</h2><div id="nav"></div></aside><section class="content" id="content"></section></main><div class="status-dot">Firebase</div>`;document.getElementById("logout").onclick=()=>A.logout();document.getElementById("theme").onclick=()=>{document.body.classList.toggle("light-mode");localStorage.setItem("afaq_theme",document.body.classList.contains("light-mode")?"light":"dark")};if(localStorage.getItem("afaq_theme")==="light")document.body.classList.add("light-mode");return renderNav(nav)}
export function panel(t,d=""){return `<div class="panel"><h2>${t}</h2><p class="muted">${d}</p></div>`}
export function renderNav(nav){let n=document.getElementById("nav");return function(active){n.innerHTML=nav.map(x=>`<button class="nav ${active===x.id?"active":""}" data-id="${x.id}"><span>${x.icon||""} ${x.title}</span><b id="b_${x.id}"></b></button>`).join("");n.querySelectorAll("button").forEach(b=>b.onclick=()=>window.openSection(b.dataset.id))}}
export function card(t,body,actions=""){return `<div class="data-card"><h3>${t}</h3><div>${body}</div><div class="actions">${actions}</div></div>`}
export function formModal(title,fields,onSave,obj={}){let id="m"+Date.now();let html=`<div class="modal active" id="${id}"><form class="modal-box"><button type="button" class="close">×</button><h2>${title}</h2>${fields.map(f=>fieldHtml(f,obj[f.name])).join("")}<button class="primary">حفظ</button></form></div>`;document.body.insertAdjacentHTML("beforeend",html);let m=document.getElementById(id);m.querySelector(".close").onclick=()=>m.remove();m.querySelector("form").onsubmit=e=>{e.preventDefault();let data={};fields.forEach(f=>{let el=m.querySelector(`[name="${f.name}"]`);data[f.name]=el.type==="file"?el.dataset.value||"":el.value});onSave(data);m.remove()}}
function fieldHtml(f,v=""){
 if(f.type==="select")return `<div class="field"><label>${f.label}</label><select name="${f.name}">${f.options.map(o=>`<option ${o==v?"selected":""}>${o}</option>`).join("")}</select></div>`;
 if(f.type==="textarea")return `<div class="field"><label>${f.label}</label><textarea name="${f.name}">${v||""}</textarea></div>`;
 if(f.type==="fileBase64")return `<div class="field"><label>${f.label}</label><input type="file" accept="image/*" name="${f.name}"><div class="media-note">تحفظ الصورة Base64 داخل Firestore</div></div>`;
 return `<div class="field"><label>${f.label}</label><input name="${f.name}" value="${v||""}" ${f.required?"required":""}></div>`;
}
export async function showNotifications(role,user){let list=A.visibleNotifications(role,user);document.getElementById("content").innerHTML=panel("الإشعارات")+`<div class="card-grid">${list.map(n=>card(n.title||"إشعار",`<p>${n.body||""}</p><p class="muted">${n.createdAt||""}</p>`)).join("")||'<div class="empty">لا توجد إشعارات</div>'}</div>`;await A.markRead(role,user)}
export function updateBadge(role,user){let c=A.unreadCount(role,user);let b=document.getElementById("b_notifications"); if(b)b.innerHTML=c?`<span class="badge-count">${c}</span>`:""}

export function statBox(title,value){return `<div class="stat"><h3>${title}</h3><strong>${value}</strong></div>`}
