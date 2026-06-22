const roleCards = document.querySelectorAll(".role-card");
const modal = document.getElementById("loginModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const formFields = document.getElementById("formFields");
const themeToggle = document.getElementById("themeToggle");
const loginForm = document.getElementById("loginForm");
const newStudentBtn = document.getElementById("newStudentBtn");
const studentNote = document.getElementById("studentNote");

const pages = {
  student: "pages/student.html",
  teacher: "pages/teacher.html",
  parent: "pages/parent.html",
  admin: "pages/admin.html"
};

let activeRole = "";

const fields = {
  student: {
    title: "تسجيل دخول الطالب",
    inputs: [["text", "الاسم الثلاثي"], ["select", "المرحلة الدراسية"], ["password", "كود الطالب"]]
  },
  teacher: {
    title: "تسجيل دخول المدرس",
    inputs: [["text", "الاسم الثلاثي"], ["select", "المادة"], ["select", "المرحلة الدراسية"], ["password", "كود المدرس"]]
  },
  parent: {
    title: "تسجيل دخول ولي الأمر",
    inputs: [["text", "الاسم الثلاثي"], ["password", "كود ولي الأمر"]]
  },
  admin: {
    title: "تسجيل دخول المدير",
    inputs: [["password", "كود المدير"]]
  }
};

const grades = ["الأول متوسط","الثاني متوسط","الثالث متوسط","الرابع الإعدادي","الخامس الإعدادي","السادس الإعدادي"];
const subjects = ["الأحياء","الكيمياء","الفيزياء","الرياضيات","الإنكليزي","العربي","الإسلامية","الاجتماعيات"];

if(roleCards.length){
  roleCards.forEach(card => {
    card.addEventListener("click", () => {
      activeRole = card.dataset.role;
      openLogin(activeRole);
    });
  });
}

function openLogin(role){
  const data = fields[role];
  modalTitle.textContent = data.title;
  formFields.innerHTML = "";
  newStudentBtn.classList.toggle("hidden", role !== "student");
  studentNote.classList.toggle("hidden", role !== "student");

  data.inputs.forEach(([type, labelText]) => {
    const field = createField(type, labelText);
    formFields.appendChild(field);
  });

  modal.classList.add("active");
}

function createField(type, labelText, value = ""){
  const field = document.createElement("div");
  field.className = "field";

  const label = document.createElement("label");
  label.textContent = labelText;

  let input;

  if(type === "select"){
    input = document.createElement("select");
    const list = labelText.includes("المادة") ? subjects : grades;
    list.forEach(item => {
      const option = document.createElement("option");
      option.textContent = item;
      option.value = item;
      input.appendChild(option);
    });
  }else if(type === "textarea"){
    input = document.createElement("textarea");
    input.placeholder = labelText;
  }else{
    input = document.createElement("input");
    input.type = type;
    input.placeholder = labelText;
    input.value = value;
  }

  input.required = !labelText.includes("اختياري");
  input.dataset.label = labelText;
  field.appendChild(label);
  field.appendChild(input);
  return field;
}

if(closeModal){
  closeModal.addEventListener("click", () => modal.classList.remove("active"));
}

if(modal){
  modal.addEventListener("click", e => {
    if(e.target === modal) modal.classList.remove("active");
  });
}

if(themeToggle){
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeToggle.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
  });
}

if(loginForm){
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    window.location.href = pages[activeRole];
  });
}

if(newStudentBtn){
  newStudentBtn.addEventListener("click", () => {
    window.location.href = "pages/student-register.html";
  });
}
