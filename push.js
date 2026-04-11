// SHADOWNET Push Notifications v1.0
// Incluir este script en todas las páginas después de cargar Supabase
(function(){
  var SB_URL = 'https://cdokplvoqivducsqrejt.supabase.co';
  var SB_ANON = 'sb_publishable_9M1y678W_KFlnk1uUcrgIg_93A-62su';
  var VAPID_PUBLIC = 'BMtl_qRtn-9QKUaeV9URWIqk0LruwXL6m7_RgmyhVl1bUq20Vw72lwCGN0OUI3ChQ7k4j_qtZ77QEz_eAjPcDsk';
  var EDGE_URL = SB_URL + '/functions/v1/send-push';

  // Convertir clave VAPID a Uint8Array para PushManager
  function urlB64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = window.atob(base64);
    return Uint8Array.from(rawData, function(c){ return c.charCodeAt(0); });
  }

  // Registrar el service worker
  async function registerSW() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      var reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      return reg;
    } catch(e) {
      console.warn('[Push] SW register failed:', e);
      return null;
    }
  }

  // Suscribir al usuario
  async function subscribeToPush(userId, userToken) {
    var reg = await registerSW();
    if (!reg) return;

    if (!('PushManager' in window)) return;

    // Pedir permiso
    var permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    try {
      var sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC)
      });

      var subJson = sub.toJSON();
      var endpoint = subJson.endpoint;
      var p256dh = subJson.keys.p256dh;
      var auth = subJson.keys.auth;

      // Guardar suscripción en Supabase
      var resp = await fetch(SB_URL + '/rest/v1/push_subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SB_ANON,
          'Authorization': 'Bearer ' + userToken,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ user_id: userId, endpoint: endpoint, p256dh: p256dh, auth: auth })
      });

      if (resp.ok || resp.status === 201 || resp.status === 204) {
        console.log('[Push] Suscripción guardada');
        localStorage.setItem('sn_push_subscribed', '1');
      }
    } catch(e) {
      console.warn('[Push] Subscribe failed:', e);
    }
  }

  // Inicializar push cuando el usuario está autenticado
  async function initPush() {
    // Esperar a que window.sb esté disponible
    if (!window.sb) { setTimeout(initPush, 800); return; }

    // Si ya está suscrito, solo registrar SW
    if (localStorage.getItem('sn_push_subscribed') === '1') {
      registerSW();
      return;
    }

    var session = await window.sb.auth.getSession();
    if (!session.data || !session.data.session) return;

    var userId = session.data.session.user.id;
    var token = session.data.session.access_token;

    // Solicitar suscripción (no bloquear si el usuario rechaza)
    setTimeout(function() {
      subscribeToPush(userId, token);
    }, 3000); // Esperar 3s para no interrumpir la carga
  }

  // Función global para enviar push (usar en el servidor, no en cliente)
  window.snPush = {
    init: initPush,
    // Llamada desde el servidor/admin para enviar push
    send: async function(userId, title, message, url, token) {
      if (!token) {
        var s = await window.sb.auth.getSession();
        token = s.data?.session?.access_token;
      }
      return fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
          'apikey': SB_ANON
        },
        body: JSON.stringify({ user_id: userId, title: title, message: message, url: url || '/feed.html' })
      }).then(function(r){ return r.json(); });
    }
  };

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPush);
  } else {
    initPush();
  }

})();
