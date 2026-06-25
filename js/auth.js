import { showAdmin, state } from './app.js';
import { showStudent } from './student.js';

const $ = s => document.querySelector(s);
const toast = msg => window.showToast?.(msg);

export function bindAuth(){
  $('#adminLoginForm')?.addEventListener('submit', e=>{
    e.preventDefault();
    const code = String(new FormData(e.target).get('code') || '').trim();
    const adminCode = String(state.settings.adminCode || '2026').trim();
    if(code === adminCode){
      window.closeModal?.('adminLoginModal');
      showAdmin();
      toast('تم دخول المدير');
    }else{
      toast('كود المدير غير صحيح');
    }
  });

  $('#studentLoginForm')?.addEventListener('submit', async e=>{
    e.preventDefault();
    const code = String(new FormData(e.target).get('code') || '').trim();
    if(!code) return toast('اكتب كود الطالب');
    window.closeModal?.('studentLoginModal');
    await showStudent(code);
  });
}
