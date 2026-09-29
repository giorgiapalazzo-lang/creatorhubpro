(function(){
  function qs(s){return document.querySelector(s)}
  window.demoAuth=function(e){
    if(e)e.preventDefault();
    var email=qs('#email');
    if(email && !email.value){email.focus();return false}
    window.location.href='../app/'; return false;
  };
  window.demoContact=function(e){
    if(e)e.preventDefault();
    var b=qs('#contactStatus');
    if(b){b.textContent='Messaggio acquisito nella demo. Nel backend collegheremo l’invio a Partidea Srl.';b.style.display='block'}
    return false;
  };
  document.addEventListener('click',function(e){
    var link=e.target.closest && e.target.closest('.mobile-menu-panel a');
    if(link){var d=link.closest('details');if(d)d.removeAttribute('open')}
  });
})();