(function(){
  function applyTheme(){
    var theme = localStorage.getItem('afaq_theme') || 'dark';
    document.body.classList.toggle('light-mode', theme === 'light');
    var buttons = document.querySelectorAll('[data-theme-toggle], #themeToggle');
    buttons.forEach(function(btn){
      btn.textContent = theme === 'light' ? '🌙' : '☀️';
      btn.title = theme === 'light' ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري';
    });
  }
  window.toggleAfaqTheme = function(){
    var current = localStorage.getItem('afaq_theme') || 'dark';
    localStorage.setItem('afaq_theme', current === 'light' ? 'dark' : 'light');
    applyTheme();
  };
  document.addEventListener('DOMContentLoaded', function(){
    applyTheme();
    document.querySelectorAll('[data-theme-toggle], #themeToggle').forEach(function(btn){
      btn.onclick = window.toggleAfaqTheme;
    });
  });
  window.addEventListener('storage', function(e){
    if(e.key === 'afaq_theme') applyTheme();
  });
})();
