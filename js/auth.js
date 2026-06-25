import { showAdmin } from './app.js';
import { showStudent } from './student.js';

function $(s){ return document.querySelector(s); }
function toast(msg){ window.showToast?.(msg); }

export function bindAuth(settings){
  $('#adminLoginForm')?.addEventListener('submit', e=>{
    e.preventDefault();
    const code=new FormData(e.target).get('code');
    if(code===(settings.adminCode||'2026')){ closeModal('adminLoginModal'); showAdmin(); }
    else toast('كود المدير غير صحيح');
  });

  $('#studentLoginForm')?.addEventListener('submit', e=>{
    e.preventDefault();
    const code=new FormData(e.target).get('code');
    closeModal('studentLoginModal');
    showStudent(code);
  });
}
