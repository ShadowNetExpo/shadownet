// SHADOWNET Push Notifications + Legal Footer + Age Gate v3
// Include this script on every page after Supabase client is loaded.

(function ageGate(){
  try {
    if (sessionStorage.getItem('sn-age-confirmed') === '1') return;
    if (localStorage.getItem('sn-age-confirmed') === '1') { sessionStorage.setItem('sn-age-confirmed','1'); return; }
    // Skip gate on pure legal pages
    var path = location.pathname.toLowerCase();
    var skip = ['/terms.html','/privacy.html','/dmca.html','/legal18.html','/2257.html','/complaints.html','/anti-trafficking.html','/creator-agreement.html'];
    if (skip.indexOf(path) >= 0) return;
    var css = '.sn-age-gate{position:fixed;inset:0;background:#01020c;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;font-family:"Rajdhani",system-ui,sans-serif}.sn-age-box{max-width:440px;background:#0a0e18;border:1px solid #ff2255;border-radius:12px;padding:32px 28px;text-align:center;color:#e8f4ff;box-shadow:0 0 60px rgba(255,34,85,.3)}.sn-age-title{font-family:"Orbitron",system-ui,sans-serif;font-size:22px;color:#ff2255;margin:0 0 12px;letter-spacing:.08em}.sn-age-body{font-size:14px;line-height:1.6;margin:0 0 22px;color:#c8d8e8}.sn-age-btns{display:flex;gap:12px;justify-content:center}.sn-age-btn{flex:1;max-width:160px;padding:12px 16px;border:none;border-radius:8px;font-family:"Orbitron",system-ui,sans-serif;font-size:13px;letter-spacing:.08em;cursor:pointer;text-transform:uppercase}.sn-age-yes{background:#ff2255;color:#fff}.sn-age-no{background:transparent;color:#c8d8e8;border:1px solid #394b66}.sn-age-yes:hover{background:#e01a49}.sn-age-no:hover{background:#1a2640}.sn-age-foot{font-size:11px;color:#5a7590;margin-top:18px}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    var overlay = document.createElement('div'); overlay.className = 'sn-age-gate';
    overlay.innerHTML = '<div class="sn-age-box"><h2 class="sn-age-title">Contenido para adultos</h2><p class="sn-age-body">Este sitio contiene material para adultos. Debes tener <strong>18 a\u00f1os o m\u00e1s</strong> y aceptar nuestros <a href="/terms.html" style="color:#00e5ff">T\u00e9rminos</a> y <a href="/privacy.html" style="color:#00e5ff">Privacidad</a> para continuar.</p><div class="sn-age-btns"><button class="sn-age-btn sn-age-no" id="snAgeNo">No, soy menor</button><button class="sn-age-btn sn-age-yes" id="snAgeYes">S\u00ed, tengo 18+</button></div><div class="sn-age-foot">Al entrar confirmas que eres mayor de edad en tu jurisdicci\u00f3n.</div></div>';
    var mount = function(){
      document.body.appendChild(overlay);
      document.getElementById('snAgeYes').onclick = function(){
        try { localStorage.setItem('sn-age-confirmed','1'); sessionStorage.setItem('sn-age-confirmed','1'); } catch(e){}
        overlay.remove();
      };
      document.getElementById('snAgeNo').onclick = function(){
        location.replace('https://www.google.com/');
      };
    };
    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  } catch(e) { console.warn('age-gate', e); }
})();

(function legalFooter(){
  try {
    if (document.querySelector('.sn-legal-footer-injected') || document.querySelector('.fnav')) return;
    var mount = function(){
      if (document.querySelector('.sn-legal-footer-injected') || document.querySelector('.fnav')) return;
      var css = '.sn-legal-footer-injected{padding:20px 16px 24px;margin-top:30px;border-top:1px solid #0d2744;text-align:center;font-family:"Rajdhani",system-ui,sans-serif;color:#5a7590}.sn-legal-footer-injected a{color:#5a8aaa;text-decoration:none;margin:0 8px;font-size:12px;line-height:2}.sn-legal-footer-injected a:hover{color:#00e5ff}.sn-legal-footer-injected .sn-copy{display:block;margin-top:10px;font-size:11px;color:#394b66}';
      var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
      var f = document.createElement('footer'); f.className = 'sn-legal-footer-injected';
      f.innerHTML = '<a href="/terms.html">T\u00e9rminos</a>·<a href="/privacy.html">Privacidad</a>·<a href="/dmca.html">DMCA</a>·<a href="/legal18.html">+18</a>·<a href="/2257.html">2257</a>·<a href="/complaints.html">Complaints</a>·<a href="/anti-trafficking.html">Anti-Trafficking</a>·<a href="/creator-agreement.html">Creator Agreement</a><span class="sn-copy">© 2026 SHADOWNET · Operated by Luis Martusciello, Italy</span>';
      document.body.appendChild(f);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  } catch(e) { console.warn('legal-footer', e); }
})();

// Push notifications subscription
(async function pushNotifications(){
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!window.sb || !window.sb.auth) return;
  try {
    var sess = await window.sb.auth.getSession();
    if (!sess || !sess.data || !sess.data.session) return;
    var userId = sess.data.session.user.id;
    var reg = await navigator.serviceWorker.register('/sw.js').catch(function(){ return null; });
    if (!reg) return;
    var existing = await reg.pushManager.getSubscription();
    if (existing) return;
    if (Notification.permission === 'denied') return;
    if (Notification.permission === 'default') {
      var perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
    }
    var settings = await window.sb.from('platform_settings').select('value').eq('key','vapid_public_key').single();
    if (!settings || !settings.data || !settings.data.value) return;
    var vapidKey = settings.data.value;
    function urlB64ToUint8(b64){ var pad='='.repeat((4-b64.length%4)%4); var s=(b64+pad).replace(/-/g,'+').replace(/_/g,'/'); var raw=atob(s); var out=new Uint8Array(raw.length); for(var i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i); return out; }
    var sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey: urlB64ToUint8(vapidKey)});
    var j = sub.toJSON();
    await window.sb.from('push_subscriptions').upsert({user_id: userId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth}, {onConflict:'endpoint'});
  } catch(e) { console.warn('push', e); }
})();
