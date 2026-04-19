// SHADOWNET Profile Enhancer
// Adds: free trial activation banner + promo code subscription modal
// Non-invasive: mounts as overlays, doesn't touch existing profile.html code
// (c) SHADOWNET — licensed internal use

(function(){
  'use strict';
  
  var SB_URL = 'https://cdokplvoqivducsqrejt.supabase.co';
  var SB_KEY = 'sb_publishable_9M1y678W_KFlnk1uUcrgIg_93A-62su';
  
  function getSb() {
    return window.sb || (window.supabase && window.supabase.createClient 
      ? window.supabase.createClient(SB_URL, SB_KEY) 
      : null);
  }
  
  function getCreatorUsername() {
    try {
      var p = new URLSearchParams(location.search);
      var u = p.get('u') || p.get('username');
      if (u) return u;
      // Fallback: last path segment
      var seg = location.pathname.split('/').filter(Boolean).pop();
      if (seg && seg !== 'profile.html') return seg;
    } catch(e) {}
    return null;
  }
  
  // Inject shared styles once
  var _stylesInjected = false;
  function injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    var s = document.createElement('style');
    s.textContent = `
      .sn-enh-banner {
        position: sticky; top: 0; z-index: 500;
        background: linear-gradient(135deg, #ff0844, #ff6b9d);
        color: #fff; padding: 10px 16px;
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        font-family: -apple-system, BlinkMacSystemFont, Inter, sans-serif;
        font-size: 14px; font-weight: 500;
        box-shadow: 0 2px 12px rgba(255,8,68,0.4);
        animation: sn-enh-slide 0.4s ease-out;
        flex-wrap: wrap;
      }
      .sn-enh-banner-text { flex: 1; min-width: 200px; }
      .sn-enh-banner-text strong { font-weight: 700; }
      .sn-enh-btn {
        background: #fff; color: #ff0844;
        border: none; padding: 8px 14px; border-radius: 8px;
        font-weight: 700; font-size: 13px; cursor: pointer;
        font-family: inherit; transition: transform 0.15s, box-shadow 0.15s;
        white-space: nowrap;
      }
      .sn-enh-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
      .sn-enh-btn:disabled { opacity: 0.6; cursor: wait; }
      .sn-enh-btn-ghost {
        background: rgba(255,255,255,0.15); color: #fff;
        border: 1px solid rgba(255,255,255,0.3);
      }
      .sn-enh-btn-ghost:hover { background: rgba(255,255,255,0.25); }
      .sn-enh-promo-link {
        position: fixed; bottom: 84px; right: 12px; z-index: 499;
        background: rgba(20,20,20,0.95); color: #fff;
        border: 1px solid #2f2f2f;
        padding: 8px 14px; border-radius: 20px;
        font-family: -apple-system, BlinkMacSystemFont, Inter, sans-serif;
        font-size: 12px; font-weight: 500; cursor: pointer;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      }
      .sn-enh-promo-link:hover { background: rgba(30,30,30,0.95); border-color: #ff0844; }
      .sn-enh-modal {
        display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85); z-index: 10000;
        align-items: center; justify-content: center; padding: 16px;
        backdrop-filter: blur(4px);
        font-family: -apple-system, BlinkMacSystemFont, Inter, sans-serif;
      }
      .sn-enh-modal.open { display: flex; }
      .sn-enh-modal-card {
        background: #141414; border: 1px solid #2f2f2f; border-radius: 16px;
        max-width: 420px; width: 100%; padding: 24px;
        color: #e5e5e5; animation: sn-enh-pop 0.25s ease-out;
      }
      .sn-enh-modal-close {
        float: right; background: none; border: none; color: #888;
        font-size: 24px; cursor: pointer; line-height: 1; padding: 0;
      }
      .sn-enh-modal h3 { font-size: 18px; margin: 0 0 8px; color: #fff; }
      .sn-enh-modal p { font-size: 13px; color: #a0a0a0; margin-bottom: 16px; line-height: 1.5; }
      .sn-enh-input {
        width: 100%; background: #0f0f0f; border: 1.5px solid #1f1f1f;
        border-radius: 8px; padding: 12px 14px; color: #fff;
        font-family: inherit; font-size: 16px; letter-spacing: 1px;
        text-transform: uppercase; margin-bottom: 12px;
        box-sizing: border-box;
      }
      .sn-enh-input:focus { outline: none; border-color: #ff0844; }
      .sn-enh-input-valid { border-color: #55ff55; }
      .sn-enh-input-invalid { border-color: #ff0844; }
      .sn-enh-validation {
        font-size: 12px; margin-bottom: 12px; min-height: 16px;
      }
      .sn-enh-validation.ok { color: #55ff55; }
      .sn-enh-validation.err { color: #ff5555; }
      .sn-enh-price-display {
        background: #0f0f0f; border: 1px solid #1f1f1f; border-radius: 8px;
        padding: 14px; margin-bottom: 14px; text-align: center;
      }
      .sn-enh-price-display .old { color: #666; text-decoration: line-through; font-size: 14px; }
      .sn-enh-price-display .new { color: #ff0844; font-size: 28px; font-weight: 700; display: block; margin: 4px 0; }
      .sn-enh-price-display .note { color: #888; font-size: 11px; }
      .sn-enh-submit {
        width: 100%; background: linear-gradient(135deg, #ff0844, #ff6b9d);
        border: none; color: #fff; padding: 14px; border-radius: 8px;
        font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
      }
      .sn-enh-submit:hover { background: linear-gradient(135deg, #e6073d, #e6618c); }
      .sn-enh-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      @keyframes sn-enh-slide {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes sn-enh-pop {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(s);
  }
  
  // ===== TRIAL BANNER =====
  function showTrialBanner(days, daysRemaining, creatorId, creatorUsername) {
    injectStyles();
    
    var existing = document.getElementById('sn-enh-trial-banner');
    if (existing) existing.remove();
    
    var banner = document.createElement('div');
    banner.id = 'sn-enh-trial-banner';
    banner.className = 'sn-enh-banner';
    banner.innerHTML = 
      '<div class="sn-enh-banner-text">' +
        '🎁 <strong>@' + escapeHtml(creatorUsername) + '</strong> te regaló <strong>' + days + ' días</strong> de suscripción gratis. ' +
        '<span style="opacity:0.85">(Expira en ' + daysRemaining + ' días)</span>' +
      '</div>' +
      '<button class="sn-enh-btn" id="sn-enh-trial-btn">🔓 Activar ahora</button>';
    
    // Insert at very top of body
    if (document.body.firstChild) {
      document.body.insertBefore(banner, document.body.firstChild);
    } else {
      document.body.appendChild(banner);
    }
    
    document.getElementById('sn-enh-trial-btn').addEventListener('click', async function(){
      var btn = this;
      btn.disabled = true;
      btn.textContent = '⏳ Activando…';
      
      var sb = getSb();
      if (!sb) { btn.textContent = 'Error: no session'; return; }
      
      try {
        var res = await sb.rpc('activate_free_trial', { p_creator_id: creatorId });
        if (res.error) throw res.error;
        var data = res.data && res.data[0];
        if (!data || data.error) {
          btn.textContent = '❌ ' + (data?.error || 'Error');
          setTimeout(() => { btn.disabled = false; btn.textContent = '🔓 Reintentar'; }, 3000);
          return;
        }
        banner.innerHTML = '<div class="sn-enh-banner-text">✅ ¡Trial activado! Ya puedes ver contenido exclusivo. Redirigiendo…</div>';
        setTimeout(() => { location.reload(); }, 1500);
      } catch(e) {
        btn.textContent = '❌ ' + (e.message || 'Error');
        setTimeout(() => { btn.disabled = false; btn.textContent = '🔓 Reintentar'; }, 3000);
      }
    });
  }
  
  // ===== PROMO CODE MODAL =====
  var _promoModal = null;
  var _currentCreatorId = null;
  var _currentCreatorPrice = 0;
  var _currentCreatorUsername = '';
  var _validatedPromo = null;
  
  function showPromoLink(creatorId, creatorUsername, creatorPrice) {
    injectStyles();
    _currentCreatorId = creatorId;
    _currentCreatorUsername = creatorUsername;
    _currentCreatorPrice = creatorPrice;
    
    var existing = document.getElementById('sn-enh-promo-link');
    if (existing) existing.remove();
    
    var link = document.createElement('button');
    link.id = 'sn-enh-promo-link';
    link.className = 'sn-enh-promo-link';
    link.innerHTML = '🎟️ ¿Tienes código?';
    link.addEventListener('click', openPromoModal);
    document.body.appendChild(link);
  }
  
  function openPromoModal() {
    injectStyles();
    if (_promoModal) { _promoModal.classList.add('open'); return; }
    
    _promoModal = document.createElement('div');
    _promoModal.className = 'sn-enh-modal';
    _promoModal.innerHTML = 
      '<div class="sn-enh-modal-card">' +
        '<button class="sn-enh-modal-close" aria-label="Cerrar">×</button>' +
        '<h3>🎟️ Código promocional</h3>' +
        '<p>Ingresa el código que te dio <strong>@' + escapeHtml(_currentCreatorUsername) + '</strong> para obtener descuento en tu suscripción.</p>' +
        '<input type="text" class="sn-enh-input" id="sn-enh-promo-input" placeholder="EJEMPLO50" maxlength="20" autocomplete="off">' +
        '<div class="sn-enh-validation" id="sn-enh-validation"></div>' +
        '<div id="sn-enh-price-preview" style="display:none" class="sn-enh-price-display">' +
          '<span class="old">$<span id="sn-enh-old-price">0</span>/mes</span>' +
          '<span class="new">$<span id="sn-enh-new-price">0</span></span>' +
          '<span class="note" id="sn-enh-price-note">Primer mes con descuento · Luego $<span id="sn-enh-recurring">0</span>/mes</span>' +
        '</div>' +
        '<button class="sn-enh-submit" id="sn-enh-submit-btn" disabled>Validar código primero</button>' +
      '</div>';
    
    document.body.appendChild(_promoModal);
    _promoModal.classList.add('open');
    
    _promoModal.querySelector('.sn-enh-modal-close').addEventListener('click', closePromoModal);
    _promoModal.addEventListener('click', function(e){ if (e.target === _promoModal) closePromoModal(); });
    
    var input = document.getElementById('sn-enh-promo-input');
    var _debounce = null;
    input.addEventListener('input', function(){
      clearTimeout(_debounce);
      _debounce = setTimeout(validatePromo, 450);
    });
    input.focus();
    
    document.getElementById('sn-enh-submit-btn').addEventListener('click', submitPromoSubscribe);
  }
  
  function closePromoModal() {
    if (_promoModal) _promoModal.classList.remove('open');
  }
  
  async function validatePromo() {
    var input = document.getElementById('sn-enh-promo-input');
    var validation = document.getElementById('sn-enh-validation');
    var pricePreview = document.getElementById('sn-enh-price-preview');
    var submitBtn = document.getElementById('sn-enh-submit-btn');
    
    var code = (input.value || '').trim().toUpperCase();
    if (code.length < 3) {
      input.classList.remove('sn-enh-input-valid', 'sn-enh-input-invalid');
      validation.textContent = '';
      pricePreview.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Validar código primero';
      _validatedPromo = null;
      return;
    }
    
    var sb = getSb();
    if (!sb) { validation.textContent = 'Error: no session'; validation.className = 'sn-enh-validation err'; return; }
    
    validation.textContent = '⏳ Validando…';
    validation.className = 'sn-enh-validation';
    
    try {
      var res = await sb.rpc('validate_promo_code', { p_code: code, p_creator_id: _currentCreatorId });
      if (res.error) throw res.error;
      var data = res.data && res.data[0];
      
      if (!data || !data.valid) {
        input.classList.remove('sn-enh-input-valid');
        input.classList.add('sn-enh-input-invalid');
        validation.textContent = '❌ ' + (data?.error || 'Código no válido');
        validation.className = 'sn-enh-validation err';
        pricePreview.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Código inválido';
        _validatedPromo = null;
        return;
      }
      
      _validatedPromo = { code: code, discount_pct: data.discount_pct, duration_months: data.duration_months || 1 };
      var basePrice = _currentCreatorPrice;
      var discountedPrice = Math.round(basePrice * (100 - data.discount_pct)) / 100;
      
      input.classList.remove('sn-enh-input-invalid');
      input.classList.add('sn-enh-input-valid');
      validation.textContent = '✅ Código válido — ' + data.discount_pct + '% descuento' + 
        (data.uses_remaining != null ? ' · ' + data.uses_remaining + ' usos restantes' : '');
      validation.className = 'sn-enh-validation ok';
      
      document.getElementById('sn-enh-old-price').textContent = basePrice.toFixed(2);
      document.getElementById('sn-enh-new-price').textContent = discountedPrice.toFixed(2);
      document.getElementById('sn-enh-recurring').textContent = basePrice.toFixed(2);
      var durationLabel = data.duration_months > 1 ? ('los primeros ' + data.duration_months + ' meses') : 'el primer mes';
      document.getElementById('sn-enh-price-note').innerHTML = 
        durationLabel.charAt(0).toUpperCase() + durationLabel.slice(1) + 
        ' con descuento · Luego $<span>' + basePrice.toFixed(2) + '</span>/mes';
      pricePreview.style.display = 'block';
      
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Suscribirme con ' + data.discount_pct + '% off';
    } catch(e) {
      validation.textContent = '❌ ' + (e.message || 'Error');
      validation.className = 'sn-enh-validation err';
      submitBtn.disabled = true;
      _validatedPromo = null;
    }
  }
  
  async function submitPromoSubscribe() {
    if (!_validatedPromo) return;
    var btn = document.getElementById('sn-enh-submit-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Redirigiendo a pago…';
    
    var sb = getSb();
    var s = await sb.auth.getSession();
    if (!s.data.session) { 
      btn.textContent = 'Error: inicia sesión primero';
      setTimeout(() => { btn.disabled = false; btn.textContent = '🚀 Reintentar'; }, 2000);
      return;
    }
    
    try {
      var resp = await fetch(SB_URL + '/functions/v1/ccbill-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + s.data.session.access_token,
          'apikey': SB_KEY
        },
        body: JSON.stringify({
          type: 'subscription',
          creator_id: _currentCreatorId,
          promo_code: _validatedPromo.code
        })
      });
      var data = await resp.json();
      
      if (!resp.ok || !data.url) {
        btn.textContent = '❌ ' + (data.error || 'Pagos no disponibles');
        setTimeout(() => { btn.disabled = false; btn.textContent = '🚀 Reintentar'; }, 3000);
        return;
      }
      
      // Redirect to CCBill flex form with discount applied server-side
      location.href = data.url;
    } catch(e) {
      btn.textContent = '❌ Error de red';
      setTimeout(() => { btn.disabled = false; btn.textContent = '🚀 Reintentar'; }, 2000);
    }
  }
  
  // ===== INIT =====
  function escapeHtml(s){ 
    return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); 
  }
  
  async function init() {
    var sb = getSb();
    if (!sb) return;
    
    var username = getCreatorUsername();
    if (!username) return;
    
    // Wait for session (profile.html may still be authenticating)
    var sessionResult = await sb.auth.getSession();
    var user = sessionResult.data && sessionResult.data.session && sessionResult.data.session.user;
    if (!user) return;  // Not logged in, don't show trial/promo
    
    // Fetch creator
    var cr = await sb.from('profiles').select('id,username,subscription_price,is_creator').eq('username', username).maybeSingle();
    if (cr.error || !cr.data || !cr.data.is_creator) return;
    var creator = cr.data;
    if (creator.id === user.id) return;  // Viewing own profile
    
    // Check pending trial
    try {
      var trialRes = await sb.rpc('check_pending_trial', { p_creator_id: creator.id });
      if (!trialRes.error && trialRes.data && trialRes.data[0] && trialRes.data[0].has_trial) {
        var t = trialRes.data[0];
        showTrialBanner(t.duration_days, t.days_until_expires, creator.id, creator.username);
      }
    } catch(e) { console.debug('[enhancer] trial check skipped:', e); }
    
    // Show promo code link (always for authenticated fans viewing other creators)
    var price = parseFloat(creator.subscription_price) || 9.99;
    if (price > 0) {
      showPromoLink(creator.id, creator.username, price);
    }
  }
  
  // Retry init a few times until window.sb is ready (profile.html inits async)
  var _retries = 0;
  function tryInit() {
    if (getSb()) { init(); return; }
    if (_retries++ < 20) setTimeout(tryInit, 300);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
})();
