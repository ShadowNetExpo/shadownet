// SHADOWNET report widget v1
// Usage: window.snReport({type:'post'|'comment'|'user'|'live'|'story', id:'<uuid>', userId?:'<reported user>'})
// Shows a modal with reason picker + description textarea, calls submit_report RPC.
(function(){
  'use strict';
  const REASONS = [
    {v:'spam', l:'\u{1F4E2} Spam o publicidad'},
    {v:'harassment', l:'\u{1F624} Acoso o bullying'},
    {v:'hate', l:'\u{1F4A2} Discurso de odio'},
    {v:'violence', l:'\u{1F52A} Violencia o amenazas'},
    {v:'sexual_minors', l:'\u{1F6A8} Contenido sexual con menores'},
    {v:'illegal', l:'\u26A0\uFE0F Actividad ilegal'},
    {v:'copyright', l:'\u00A9 Copyright / DMCA'},
    {v:'impersonation', l:'\u{1F3AD} Suplantaci\u00F3n de identidad'},
    {v:'self_harm', l:'\u{1F494} Autolesi\u00F3n / suicidio'},
    {v:'other', l:'\u2026 Otro'}
  ];
  const SB = 'https://cdokplvoqivducsqrejt.supabase.co';
  const AK = 'sb_publishable_9M1y678W_KFlnk1uUcrgIg_93A-62su';
  
  function injectStyle(){
    if (document.getElementById('sn-report-style')) return;
    const s = document.createElement('style');
    s.id = 'sn-report-style';
    s.textContent = `
.sn-rpt-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;animation:snrptIn .2s ease}
@keyframes snrptIn{from{opacity:0}to{opacity:1}}
.sn-rpt-box{background:#0d0d1a;border:1.5px solid #ff2255;border-radius:16px;width:100%;max-width:420px;max-height:90vh;overflow-y:auto;padding:22px;box-shadow:0 20px 60px rgba(255,34,85,.3)}
.sn-rpt-title{font-family:Rajdhani,sans-serif;font-size:18px;font-weight:900;color:#ff2255;letter-spacing:.05em;margin-bottom:6px}
.sn-rpt-sub{font-size:12px;color:#888;margin-bottom:14px;line-height:1.5}
.sn-rpt-reasons{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;max-height:300px;overflow-y:auto}
.sn-rpt-reason{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#141420;border:1px solid #1a1a2e;border-radius:8px;cursor:pointer;transition:all .15s;color:#ccc;font-size:13px;font-family:Rajdhani,sans-serif;font-weight:600}
.sn-rpt-reason:hover{border-color:#ff2255;background:rgba(255,34,85,.08)}
.sn-rpt-reason.selected{border-color:#ff2255;background:rgba(255,34,85,.12);color:#fff}
.sn-rpt-desc{width:100%;background:#141420;border:1px solid #1a1a2e;border-radius:8px;color:#fff;padding:10px;font-family:Inter,sans-serif;font-size:13px;outline:none;resize:vertical;min-height:60px;margin-bottom:14px}
.sn-rpt-desc:focus{border-color:#ff2255}
.sn-rpt-actions{display:flex;gap:10px}
.sn-rpt-submit{flex:1;background:linear-gradient(135deg,#ff2255,#aa0030);color:#fff;border:none;border-radius:10px;padding:12px;font-family:Rajdhani,sans-serif;font-weight:900;font-size:13px;cursor:pointer;letter-spacing:.06em;text-transform:uppercase}
.sn-rpt-submit:disabled{opacity:.4;cursor:not-allowed}
.sn-rpt-cancel{flex:1;background:transparent;color:#888;border:1px solid #1a1a2e;border-radius:10px;padding:12px;font-family:Rajdhani,sans-serif;font-weight:700;font-size:13px;cursor:pointer}
.sn-rpt-msg{font-size:12px;padding:10px;border-radius:8px;margin-bottom:10px;text-align:center;font-family:Rajdhani,sans-serif;font-weight:600}
.sn-rpt-msg.ok{background:rgba(0,200,83,.12);border:1px solid rgba(0,200,83,.4);color:#00c853}
.sn-rpt-msg.err{background:rgba(255,34,85,.12);border:1px solid rgba(255,34,85,.4);color:#ff2255}`;
    document.head.appendChild(s);
  }
  
  async function getToken(){
    if (window.sb) {
      try {
        const s = await window.sb.auth.getSession();
        if (s.data && s.data.session) return s.data.session.access_token;
      } catch(_){}
    }
    return null;
  }
  
  window.snReport = function(opts){
    opts = opts || {};
    if (!opts.type || !opts.id) {
      console.warn('[snReport] type and id required');
      return;
    }
    injectStyle();
    
    const overlay = document.createElement('div');
    overlay.className = 'sn-rpt-overlay';
    let selectedReason = null;
    
    const box = document.createElement('div');
    box.className = 'sn-rpt-box';
    box.onclick = (e) => e.stopPropagation();
    
    let html = '<div class="sn-rpt-title">\u{1F6A9} Reportar contenido</div>';
    html += '<div class="sn-rpt-sub">Tu reporte es an\u00F3nimo para el reportado. Revisamos cada caso. Reportes falsos pueden resultar en suspensi\u00F3n.</div>';
    html += '<div class="sn-rpt-reasons" id="snrptReasons">';
    REASONS.forEach(r => {
      html += '<div class="sn-rpt-reason" data-v="' + r.v + '">' + r.l + '</div>';
    });
    html += '</div>';
    html += '<textarea class="sn-rpt-desc" id="snrptDesc" placeholder="Detalles adicionales (opcional)..." maxlength="1000"></textarea>';
    html += '<div id="snrptMsg"></div>';
    html += '<div class="sn-rpt-actions">';
    html += '<button class="sn-rpt-cancel" id="snrptCancel">Cancelar</button>';
    html += '<button class="sn-rpt-submit" id="snrptSubmit" disabled>Enviar reporte</button>';
    html += '</div>';
    box.innerHTML = html;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    overlay.onclick = () => overlay.remove();
    
    const reasons = box.querySelectorAll('.sn-rpt-reason');
    const submitBtn = box.querySelector('#snrptSubmit');
    reasons.forEach(el => {
      el.onclick = () => {
        reasons.forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        selectedReason = el.dataset.v;
        submitBtn.disabled = false;
      };
    });
    
    box.querySelector('#snrptCancel').onclick = () => overlay.remove();
    
    submitBtn.onclick = async () => {
      if (!selectedReason) return;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      const tok = await getToken();
      if (!tok) {
        const msg = box.querySelector('#snrptMsg');
        msg.className = 'sn-rpt-msg err';
        msg.textContent = 'Inicia sesi\u00F3n para reportar';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar reporte';
        return;
      }
      const desc = box.querySelector('#snrptDesc').value.trim();
      try {
        const r = await fetch(SB + '/rest/v1/rpc/submit_report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': AK, 'Authorization': 'Bearer ' + tok },
          body: JSON.stringify({
            p_content_type: opts.type,
            p_content_id: String(opts.id),
            p_reason: selectedReason,
            p_description: desc || null,
            p_reported_user_id: opts.userId || null
          })
        });
        const j = await r.json();
        const msg = box.querySelector('#snrptMsg');
        if (j && j.ok) {
          msg.className = 'sn-rpt-msg ok';
          msg.textContent = j.message || 'Reporte enviado';
          setTimeout(() => overlay.remove(), 1500);
        } else {
          msg.className = 'sn-rpt-msg err';
          msg.textContent = (j && (j.message || j.hint)) || 'Error al enviar';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar reporte';
        }
      } catch (e) {
        const msg = box.querySelector('#snrptMsg');
        msg.className = 'sn-rpt-msg err';
        msg.textContent = 'Error de conexi\u00F3n: ' + e.message;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar reporte';
      }
    };
  };
  
  // Auto-bind data-sn-report attributes
  document.addEventListener('click', function(e) {
    const el = e.target.closest('[data-sn-report]');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    window.snReport({
      type: el.dataset.snReport,
      id: el.dataset.snReportId,
      userId: el.dataset.snReportUser
    });
  }, true);
  
  console.debug('[snReport] widget loaded');
})();
