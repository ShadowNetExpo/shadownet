/*! SHADOWNET report widget — v1
 * Reusable widget to report posts/comments/users/lives/messages.
 * Usage: snReportButton({type:'post', id:postId}) returns an HTMLElement.
 *        Or call snOpenReport({type, id}) directly to show modal.
 *
 * Renders a modal with:
 *   - Reason picker (spam, harassment, sexual_minor, violence, fraud, impersonation, copyright, self_harm, other)
 *   - Description textarea (optional, max 500 chars)
 *   - Submit / Cancel buttons
 * Calls RPC submit_report(p_content_type, p_content_id, p_reason, p_description).
 */
(function(){
  if (window.snReport_loaded) return;
  window.snReport_loaded = true;

  var STYLE = document.createElement('style');
  STYLE.textContent = ".snrp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(4px);z-index:99999;display:none;align-items:center;justify-content:center;padding:18px;animation:snrpFade .2s}.snrp-overlay.open{display:flex}@keyframes snrpFade{from{opacity:0}to{opacity:1}}.snrp-box{background:#070f1e;border:1.5px solid #1a2845;border-radius:18px;width:100%;max-width:420px;max-height:90vh;overflow-y:auto;padding:22px;font-family:Rajdhani,sans-serif;color:#e0e8f0;box-shadow:0 20px 60px rgba(0,0,0,.6)}.snrp-title{font-family:Orbitron,sans-serif;font-size:14px;color:#ff2255;letter-spacing:.1em;margin-bottom:6px;font-weight:900;text-transform:uppercase}.snrp-sub{font-size:12px;color:#5a8aaa;margin-bottom:16px;line-height:1.5}.snrp-section{font-size:11px;color:#5a8aaa;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px}.snrp-reasons{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}.snrp-reason{display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(7,15,30,.6);border:1px solid #1a2845;border-radius:10px;cursor:pointer;transition:all .15s;font-size:13px;font-weight:600;color:#ccc}.snrp-reason:hover{border-color:#ff2255;background:rgba(255,34,85,.06)}.snrp-reason.selected{border-color:#ff2255;background:rgba(255,34,85,.12);color:#fff}.snrp-reason .snrp-emoji{font-size:18px;flex-shrink:0;width:22px;text-align:center}.snrp-textarea{width:100%;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid #1a2845;border-radius:10px;color:#fff;font-family:Rajdhani,sans-serif;font-size:13px;outline:none;resize:vertical;min-height:70px;margin-bottom:6px;transition:border-color .2s}.snrp-textarea:focus{border-color:rgba(255,34,85,.5)}.snrp-textarea::placeholder{color:rgba(255,255,255,.25)}.snrp-charcount{font-size:11px;color:#5a8aaa;text-align:right;margin-bottom:14px}.snrp-actions{display:flex;gap:10px}.snrp-btn{flex:1;padding:11px;border-radius:10px;font-family:Rajdhani,sans-serif;font-weight:800;font-size:13px;cursor:pointer;letter-spacing:.04em;text-transform:uppercase;border:none;transition:all .15s}.snrp-btn-primary{background:linear-gradient(135deg,#ff2255,#cc0030);color:#fff;box-shadow:0 2px 12px rgba(255,34,85,.3)}.snrp-btn-primary:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}.snrp-btn-primary:active{transform:scale(.97)}.snrp-btn-cancel{background:transparent;color:#5a8aaa;border:1px solid #1a2845}.snrp-btn-cancel:hover{color:#fff;border-color:#5a8aaa}.snrp-btn-link{display:inline-flex;align-items:center;gap:5px;background:none;border:none;color:#5a8aaa;font-family:Rajdhani,sans-serif;font-size:11px;cursor:pointer;padding:4px 8px;font-weight:700;letter-spacing:.04em;border-radius:6px;transition:color .15s}.snrp-btn-link:hover{color:#ff6680}.snrp-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#070f1e;border:1px solid #ff2255;border-radius:12px;padding:12px 20px;font-family:Rajdhani,sans-serif;font-weight:700;color:#fff;z-index:100000;box-shadow:0 8px 30px rgba(0,0,0,.4);animation:snrpToastIn .25s}.snrp-toast.success{border-color:#00c853;color:#00ff88}@keyframes snrpToastIn{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}";
  document.head.appendChild(STYLE);

  var REASONS = [
    {id:'spam',           label:'Spam o engaño',                 emoji:'📢'},
    {id:'harassment',     label:'Acoso o amenazas',              emoji:'😡'},
    {id:'sexual_minor',   label:'Contenido sexual con menores',  emoji:'🚫'},
    {id:'violence',       label:'Violencia o contenido gráfico', emoji:'⚠️'},
    {id:'fraud',          label:'Estafa o fraude',               emoji:'💰'},
    {id:'impersonation',  label:'Suplantación de identidad',     emoji:'🎭'},
    {id:'copyright',      label:'Infracción de copyright',       emoji:'©️'},
    {id:'self_harm',      label:'Autolesión o suicidio',         emoji:'💔'},
    {id:'other',          label:'Otro motivo',                   emoji:'…'}
  ];

  var modalEl = null;
  var currentTarget = null;
  var selectedReason = null;

  function buildModal(){
    if (modalEl) return modalEl;
    var ov = document.createElement('div');
    ov.className = 'snrp-overlay';
    ov.id = 'snrp-overlay';
    ov.addEventListener('click', function(e){ if (e.target === ov) closeModal(); });
    var box = document.createElement('div');
    box.className = 'snrp-box';
    var html = '<div class="snrp-title">🚩 Reportar contenido</div>';
    html += '<div class="snrp-sub" id="snrp-sub">Cuéntanos qué pasa. Revisamos cada reporte.</div>';
    html += '<div class="snrp-section">Motivo</div>';
    html += '<div class="snrp-reasons" id="snrp-reasons">';
    REASONS.forEach(function(r){
      html += '<div class="snrp-reason" data-r="'+r.id+'"><span class="snrp-emoji">'+r.emoji+'</span><span>'+r.label+'</span></div>';
    });
    html += '</div>';
    html += '<div class="snrp-section">Detalles (opcional)</div>';
    html += '<textarea class="snrp-textarea" id="snrp-desc" maxlength="500" placeholder="Agrega contexto que ayude a moderar..."></textarea>';
    html += '<div class="snrp-charcount" id="snrp-cc">0/500</div>';
    html += '<div class="snrp-actions">';
    html += '<button class="snrp-btn snrp-btn-cancel" id="snrp-cancel">Cancelar</button>';
    html += '<button class="snrp-btn snrp-btn-primary" id="snrp-submit" disabled>Enviar reporte</button>';
    html += '</div>';
    box.innerHTML = html;
    ov.appendChild(box);
    document.body.appendChild(ov);
    box.querySelector('#snrp-reasons').addEventListener('click', function(e){
      var t = e.target.closest('.snrp-reason');
      if (!t) return;
      box.querySelectorAll('.snrp-reason').forEach(function(x){ x.classList.remove('selected'); });
      t.classList.add('selected');
      selectedReason = t.dataset.r;
      box.querySelector('#snrp-submit').disabled = false;
    });
    var ta = box.querySelector('#snrp-desc');
    var cc = box.querySelector('#snrp-cc');
    ta.addEventListener('input', function(){ cc.textContent = ta.value.length + '/500'; });
    box.querySelector('#snrp-cancel').addEventListener('click', closeModal);
    box.querySelector('#snrp-submit').addEventListener('click', submitReport);
    modalEl = ov;
    return ov;
  }

  function closeModal(){
    if (modalEl) modalEl.classList.remove('open');
    selectedReason = null;
    currentTarget = null;
    if (modalEl) {
      modalEl.querySelectorAll('.snrp-reason').forEach(function(x){ x.classList.remove('selected'); });
      var ta = modalEl.querySelector('#snrp-desc');
      if (ta) ta.value = '';
      var cc = modalEl.querySelector('#snrp-cc');
      if (cc) cc.textContent = '0/500';
      var sb = modalEl.querySelector('#snrp-submit');
      if (sb) sb.disabled = true;
    }
  }

  function showToast(msg, isErr){
    var t = document.createElement('div');
    t.className = 'snrp-toast' + (isErr ? '' : ' success');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 3500);
  }

  async function submitReport(){
    if (!selectedReason || !currentTarget) return;
    var sb = window.sb;
    if (!sb) { showToast('Error: cliente no listo', true); return; }
    var btn = modalEl.querySelector('#snrp-submit');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    var desc = modalEl.querySelector('#snrp-desc').value.trim();
    try {
      var r = await sb.rpc('submit_report', {
        p_content_type: currentTarget.type,
        p_content_id: String(currentTarget.id),
        p_reason: selectedReason,
        p_description: desc || null
      });
      if (r.error) {
        showToast('Error: ' + r.error.message, true);
        btn.disabled = false; btn.textContent = 'Enviar reporte';
        return;
      }
      var data = r.data || {};
      if (!data.ok) {
        var msg = data.message || ({
          'auth_required': 'Inicia sesión para reportar',
          'invalid_content_type': 'Tipo de contenido inválido',
          'invalid_reason': 'Motivo inválido',
          'rate_limit': 'Demasiados reportes en 24h',
          'duplicate': 'Ya reportaste esto recientemente',
          'cannot_report_self': 'No puedes reportarte a ti mismo'
        })[data.error] || ('Error: ' + (data.error || 'desconocido'));
        showToast(msg, true);
        btn.disabled = false; btn.textContent = 'Enviar reporte';
        return;
      }
      closeModal();
      showToast('✓ Reporte enviado. Gracias por avisarnos.');
    } catch(e){
      console.error('[snrp] submit err:', e);
      showToast('Error al enviar', true);
      btn.disabled = false; btn.textContent = 'Enviar reporte';
    }
  }

  window.snOpenReport = function(target){
    if (!target || !target.type || !target.id) {
      console.warn('[snrp] invalid target:', target);
      return;
    }
    if (!window.sb) { showToast('Error: cliente no listo', true); return; }
    if (!window.currentUser && (!window.sb.auth || !window.sb.auth.getSession)) {
      showToast('Inicia sesión para reportar', true);
      return;
    }
    // Best-effort: ensure session
    window.sb.auth.getSession().then(function(s){
      if (!s.data || !s.data.session) {
        showToast('Inicia sesión para reportar', true);
        return;
      }
      currentTarget = target;
      buildModal();
      var labels = {post:'este post', comment:'este comentario', user:'este usuario', live:'este live', message:'este mensaje'};
      var sub = modalEl.querySelector('#snrp-sub');
      if (sub) sub.textContent = 'Estás reportando ' + (labels[target.type] || 'este contenido') + '. Revisamos cada reporte.';
      modalEl.classList.add('open');
    });
  };

  window.snReportButton = function(target, options){
    options = options || {};
    var btn = document.createElement('button');
    btn.className = 'snrp-btn-link';
    btn.type = 'button';
    btn.innerHTML = (options.icon !== false ? '🚩 ' : '') + (options.label || 'Reportar');
    btn.title = 'Reportar contenido';
    btn.addEventListener('click', function(e){ e.stopPropagation(); e.preventDefault(); window.snOpenReport(target); });
    return btn;
  };
})();
