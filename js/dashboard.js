const STORAGE_KEY = "afaq_subscription_requests";

function getRequests(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveRequests(requests){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function requestStatusText(status){
  if(status === "accepted") return "مقبول";
  if(status === "rejected") return "مرفوض";
  return "طلب جديد";
}

function formatDate(dateString){
  if(!dateString) return "غير محدد";
  return dateString;
}
