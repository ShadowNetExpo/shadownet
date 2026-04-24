// ppv-dm-fix.js — Patches window.unlockPPVMessage to use the unlock_ppv_message RPC
// instead of the broken PayPal flow. Charges Almas, gives 90% to creator, auto-reloads.
// Include with <script src="/ppv-dm-fix.js" defer></script> in messages.html

(function(){
  'use strict';
  function install(){
    if (!window.sb) { setTimeout(install, 500); return; }
    window.unlockPPVMessage = async function(msgId, price, creatorId){
      if (!window.currentUser) { alert('Inicia sesion primero'); return; }
      var almas = parseInt(price) || 0;
      if (almas < 1) { alert('Precio PPV invalido'); return; }
      if (!confirm('Desbloquear este mensaje por ' + almas + ' Almas?')) return;
      try {
        var r = await window.sb.rpc('unlock_ppv_message', { p_message_id: msgId });
        if (r.error) {
          var msg = r.error.message || String(r.error);
          if (msg.indexOf('Insufficient Almas') > -1 || msg.indexOf('Almas insuficientes') > -1) {
            if (confirm('Almas insuficientes. Comprar Almas ahora?')) window.location.href = '/almas.html';
          } else if (msg.indexOf('not authenticated') > -1) {
            alert('Sesion expirada. Inicia sesion de nuevo.');
          } else if (msg.indexOf('not PPV') > -1) {
            alert('Este mensaje no es PPV');
          } else {
            alert('Error: ' + msg);
          }
          return;
        }
        var result = (r.data && r.data[0]) || {};
        if (window.showToast) window.showToast('🔓 Desbloqueado! (' + result.almas_remaining + ' Almas restantes)');
        // Reload messages to show unlocked media
        setTimeout(function(){
          if (window.loadMessages && window.activeConvId) window.loadMessages(window.activeConvId);
          else window.location.reload();
        }, 400);
      } catch(e) {
        console.error('unlockPPVMessage error:', e);
        alert('Error: ' + (e.message || e));
      }
    };
    console.debug('[ppv-dm-fix] unlockPPVMessage patched to use RPC');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(install, 400); });
  } else {
    setTimeout(install, 400);
  }
})();
