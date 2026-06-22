const roleCards = document.querySelectorAll(".role-card");
const modal = document.getElementById("loginModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const formFields = document.getElementById("formFields");
const loginForm = document.getElementById("loginForm");
const themeToggle = document.getElementById("themeToggle");

const grades = [
  "الأول متوسط",
  "الثاني متوسط",
  "الثالث متوسط",
  "الرابع الإعدادي",
  "الخامس الإعدادي",
  "السادس الإعدادي"
];

const subjects = [
  "الأحياء",
  "الكيمياء",
  "الفيزياء",
  "الرياضيات",
  "الإنكليزي",
  "العربي",
  "الإسلامية",
  "الاجتماعيات"
];

const roles = {
  student: {
    title: "تسجيل دخول الطالب",
    subtitle: "أدخل بيانات الطالب للدخول إلى لوحة التعلم",
    fields: [
      { type: "text", label: "الاسم الثلاثي" },
      { type: "select", label: "المرحلة الدراسية", options: grades },
      { type: "password", label: "كود الطالب" }
    ]
  },
  teacher: {
    title: "تسجيل دخول المدرس",
    subtitle: "أدخل بيانات المدرس للدخول إلى لوحة إدارة المادة",
    fields: [
      { type: "text", label: "الاسم الثلاثي" },
      { type: "select", label: "المادة", options: subjects },
      { type: "select", label: "المرحلة الدراسية", options: grades },
      { type: "password", label: "كود المدرس" }
    ]
  },
  parent: {
    title: "تسجيل دخول ولي الأمر",
    subtitle: "تابع مستوى الطالب والنتائج والتنبيهات",
    fields: [
      { type: "text", label: "الاسم الثلاثي" },
      { type: "password", label: "كود ولي الأمر" }
    ]
  },
  admin: {
    title: "تسجيل دخول المدير",
    subtitle: "لوحة التحكم الرئيسية لإدارة المنصة",
    fields: [
      { type: "password", label: "كود المدير" }
    ]
  }
};

roleCards.forEach(card => {
  card.addEventListener("click", () => {
    openModal(card.dataset.role);
  });
});

function openModal(role){
  const data = roles[role];

  modalTitle.textContent = data.title;
  modalSubtitle.textContent = data.subtitle;
  formFields.innerHTML = "";

  data.fields.forEach(item => {
    const field = document.createElement("div");
    field.className = "field";

    const label = document.createElement("label");
    label.textContent = item.label;

    let input;

    if(item.type === "select"){
      input = document.createElement("select");
      item.options.forEach(optionText => {
        const option = document.createElement("option");
        option.value = optionText;
        option.textContent = optionText;
        input.appendChild(option);
      });
    }else{
      input = document.createElement("input");
      input.type = item.type;
      input.placeholder = item.label;
    }

    input.required = true;
    field.appendChild(label);
    field.appendChild(input);
    formFields.appendChild(field);
  });

  modal.classList.add("active");
}

closeModal.addEventListener("click", closeLoginModal);

modal.addEventListener("click", event => {
  if(event.target === modal){
    closeLoginModal();
  }
});

function closeLoginModal(){
  modal.classList.remove("active");
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
  themeToggle.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
});

loginForm.addEventListener("submit", event => {
  event.preventDefault();
  alert("تم تجهيز الواجهة. في الإصدار القادم سنربط الدخول باللوحات والبيانات.");
});

function scrollToCards(){
  document.getElementById("cardsSection").scrollIntoView({ behavior: "smooth" });
}

function openInfo(){
  alert("منصة آفاق التعليمية: نظام لإدارة الطلاب والمدرسين والمواد والاختبارات والنتائج والاشتراكات.");
}
