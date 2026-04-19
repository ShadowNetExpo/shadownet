// SHADOWNET DM Generator
// Personalized outreach DM variants (ES/PT/IT/EN × 3 styles) for /outreach.html
// Exposes window.showDmGenerator(creator) — called from outreach table rows

(function(){
  'use strict';
  
  var TEMPLATES = {
    es: {
      A: ['Hola {name}! 👋',
          '',
          'Soy Luis, creador de SHADOWNET. Te escribo porque me gustó tu contenido y pensé que nuestra plataforma podría interesarte.',
          '',
          'Estamos construyendo una plataforma de creators LATAM con condiciones diferentes:',
          '• 10% comisión (vs 20% de OnlyFans)',
          '• Anti-piracy con detección forense de filtros',
          '• Mass DMs segmentados por audiencia',
          '• Promo codes + free trials nativos',
          '• Welcome DM automático a nuevos subs',
          '',
          'Herramientas que en OF pagas aparte ($200-400/mes), acá gratis.',
          '',
          'Te aparté este código personal: {code}',
          '(te da onboarding prioritario cuando te registres)',
          '',
          'Si te interesa escuchar 2 min más, acá estoy. Sin presión.',
          '',
          'Luis'].join('\n'),
      B: ['Hey {name},',
          '',
          'Resumen rápido: plataforma nueva de creators latinos, 10% commission (no 20%), pagos en Revolut/Binance, y herramientas que OF cobra extra ya incluidas.',
          '',
          'Lo que ya tenemos listo:',
          '→ Anti-piracy forense (detectas quién filtró tu contenido)',
          '→ Mass DM con 7 segmentos automáticos',
          '→ Códigos promo + trials de 1-30 días',
          '→ Welcome DM automático (triplica retention)',
          '',
          'Estamos firmando creators top antes de lanzar público.',
          '',
          'Código personal: {code}',
          '',
          'Te interesa? Cuéntame y te paso info completa.',
          '',
          '— Luis / SHADOWNET'].join('\n'),
      C: ['Hola {name}! Perdón el DM frío 🤍',
          '',
          'Soy Luis, italiano viviendo en Bélgica. Me cansé de que las plataformas gringas se queden con el 20%+ de lo que ganan creators latinas, así que armé SHADOWNET.',
          '',
          'En vez de pagarle a OnlyFans, la idea es que nosotros mismos tengamos una plataforma:',
          '— 10% comisión fija (siempre)',
          '— UI 100% en español',
          '— Pagos en Revolut, Binance Pay, Mercado Pago (próximamente)',
          '— Anti-piracy forense + mass DMs + promos + trials + welcome DM automático',
          '',
          'Todo gratis de base.',
          '',
          'Código tuyo: {code}',
          '',
          'Te tomás 15 min esta semana para una call? Me interesa escuchar qué herramienta te haría la vida más fácil.',
          '',
          'Luis'].join('\n')
    },
    pt: {
      A: ['Oi {name}! 👋',
          '',
          'Sou o Luis, criador da SHADOWNET. Te escrevo porque curti seu conteúdo e achei que nossa plataforma pode te interessar.',
          '',
          'Estamos construindo uma plataforma de creators LATAM com condições diferentes:',
          '• 10% comissão (vs 20% do OnlyFans)',
          '• Anti-piracy com detecção forense',
          '• Mass DMs segmentados por audiência',
          '• Promo codes + free trials nativos',
          '• Welcome DM automático',
          '',
          'Ferramentas que no OF você paga extra ($200-400/mês), aqui vêm grátis.',
          '',
          'Reservei esse código pra você: {code}',
          '(dá onboarding prioritário quando se cadastrar)',
          '',
          'Se quiser saber mais, tô por aqui. Sem pressão.',
          '',
          'Luis'].join('\n'),
      B: ['Ei {name},',
          '',
          'Rápido: plataforma nova de creators latinos, 10% de comissão (não 20%), pagos em Revolut/Binance, e ferramentas que OF cobra extra já incluídas.',
          '',
          'O que temos pronto:',
          '→ Anti-piracy forense',
          '→ Mass DM com 7 segmentos',
          '→ Códigos promo + trials',
          '→ Welcome DM automático',
          '',
          'Estamos assinando top creators antes do lançamento público.',
          '',
          'Seu código: {code}',
          '',
          'Interessa? Me diz e te passo tudo.',
          '',
          '— Luis / SHADOWNET'].join('\n'),
      C: ['Oi {name}! Desculpa o DM frio 🤍',
          '',
          'Sou o Luis, italiano morando na Bélgica. Cansei de ver as plataformas americanas levarem 20%+ do que as criadoras LATAM ganham, então montei a SHADOWNET.',
          '',
          'Em vez de pagar o OnlyFans, a ideia é termos uma plataforma nossa:',
          '— 10% comissão fixa',
          '— UI 100% em português/espanhol',
          '— Pagos em Revolut, Binance Pay, Mercado Pago (em breve)',
          '— Anti-piracy + mass DMs + promos + trials + welcome DM',
          '',
          'Tudo grátis.',
          '',
          'Seu código: {code}',
          '',
          'Topa uma call de 15 min essa semana? Quero ouvir o que faltaria pra você.',
          '',
          'Luis'].join('\n')
    },
    it: {
      A: ['Ciao {name}! 👋',
          '',
          'Sono Luis, creator di SHADOWNET. Ti scrivo perché mi è piaciuto il tuo contenuto e penso che la nostra piattaforma possa interessarti.',
          '',
          'Stiamo costruendo una piattaforma per creator con condizioni diverse:',
          '• 10% commissione (vs 20% di OnlyFans)',
          '• Anti-piracy con rilevamento forense',
          '• Mass DM segmentati per audience',
          '• Promo code + free trials nativi',
          '• Welcome DM automatico',
          '',
          'Strumenti che su OF paghi extra ($200-400/mese), qui gratis.',
          '',
          'Ti ho messo da parte questo codice: {code}',
          '(onboarding prioritario quando ti registri)',
          '',
          'Se ti va di saperne di più, sono qui. Senza pressione.',
          '',
          'Luis'].join('\n'),
      B: ['Ehi {name},',
          '',
          'Riassunto: piattaforma nuova per creator latini/ispanici/italiani, 10% commissione (non 20%), pagamenti via Revolut/Binance, e strumenti che OF fa pagare extra già inclusi.',
          '',
          'Cosa è pronto:',
          '→ Anti-piracy forense',
          '→ Mass DM con 7 segmenti',
          '→ Codici promo + trials',
          '→ Welcome DM automatico',
          '',
          'Stiamo firmando top creator prima del lancio pubblico.',
          '',
          'Il tuo codice: {code}',
          '',
          'Ti interessa? Dimmelo e ti mando tutti i dettagli.',
          '',
          '— Luis / SHADOWNET'].join('\n'),
      C: ['Ciao {name}! Scusa il DM a freddo 🤍',
          '',
          'Sono Luis, italiano in Belgio. Mi sono stancato di vedere le piattaforme americane prendersi il 20%+ di quello che guadagnano i creator latini/italiani, così ho creato SHADOWNET.',
          '',
          'Invece di pagare OnlyFans, l\'idea è avere una piattaforma nostra:',
          '— 10% commissione fissa',
          '— UI in italiano/spagnolo/portoghese',
          '— Pagamenti in Revolut, Binance Pay, Mercado Pago',
          '— Anti-piracy + mass DMs + promos + trials + welcome DM',
          '',
          'Tutto gratis.',
          '',
          'Codice tuo: {code}',
          '',
          'Ti va una chiamata di 15 min questa settimana? Vorrei sentire cosa ti servirebbe.',
          '',
          'Luis'].join('\n')
    },
    en: {
      A: ['Hey {name}! 👋',
          '',
          'Luis here, founder of SHADOWNET. Writing because I liked your content and thought our platform might be a fit.',
          '',
          'We\'re building a creator platform with different terms:',
          '• 10% commission (vs OF\'s 20%)',
          '• Forensic anti-piracy (identifies leakers)',
          '• Segmented mass DMs (7 audience buckets)',
          '• Native promo codes + free trials',
          '• Auto welcome DM for new subs',
          '',
          'Tools that OF charges extra for ($200-400/mo), we include free.',
          '',
          'Reserved this code for you: {code}',
          '(priority onboarding when you sign up)',
          '',
          'Happy to share more if interested. No pressure.',
          '',
          'Luis'].join('\n'),
      B: ['Hey {name},',
          '',
          'Quick: new creator platform, 10% commission (not 20%), Revolut/Binance payouts, and tools OF charges extra for are already built in.',
          '',
          'What\'s ready:',
          '→ Forensic anti-piracy',
          '→ Mass DM with 7 auto-segments',
          '→ Promo codes + free trials',
          '→ Auto welcome DM',
          '',
          'Signing top creators before public launch.',
          '',
          'Your code: {code}',
          '',
          'Interested? Let me know and I\'ll send full details.',
          '',
          '— Luis / SHADOWNET'].join('\n'),
      C: ['Hey {name}, sorry for the cold DM 🤍',
          '',
          'I\'m Luis, Italian living in Brussels. Got tired of seeing US platforms take 20%+ from creators, so I built SHADOWNET.',
          '',
          'Instead of OnlyFans, the idea is having our own thing:',
          '— 10% flat commission',
          '— Payments in Revolut, Binance Pay',
          '— Forensic anti-piracy + mass DMs + promos + trials + auto welcome DM',
          '',
          'All free by default.',
          '',
          'Your code: {code}',
          '',
          'Down for a 15-min call this week? Want to hear what tool would make your life easier.',
          '',
          'Luis'].join('\n')
    }
  };
  
  var VARIANT_META = {
    A: { label: 'Founder note', emoji: '📝', note: 'Personal · directo · 4-5 líneas' },
    B: { label: 'Oferta express', emoji: '⚡', note: 'Bullets · 30s read · conversión alta' },
    C: { label: 'Community-first', emoji: '🤝', note: 'Storytelling · pide call · relación LP' }
  };
  
  function fillTemplate(template, ctx) {
    return String(template)
      .replace(/\{name\}/g, ctx.name || 'hola')
      .replace(/\{code\}/g, ctx.code || 'SHADOWNET')
      .replace(/\{handle\}/g, ctx.handle || '')
      .replace(/\{followers\}/g, ctx.followers || '');
  }
  
  function injectStyles() {
    if (document.getElementById('sn-dm-styles')) return;
    var s = document.createElement('style');
    s.id = 'sn-dm-styles';
    s.textContent = [
      '.sn-dm-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px);font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;overflow-y:auto}',
      '.sn-dm-modal{background:#141414;border:1px solid #2f2f2f;border-radius:16px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;color:#e5e5e5;animation:sn-dm-pop 0.25s ease-out}',
      '@keyframes sn-dm-pop{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}',
      '.sn-dm-header{position:sticky;top:0;background:#141414;border-bottom:1px solid #1f1f1f;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;gap:10px;z-index:5}',
      '.sn-dm-header h2{font-size:16px;margin:0;color:#fff}',
      '.sn-dm-header .meta{font-size:11px;color:#888;margin-top:2px}',
      '.sn-dm-close{background:none;border:none;color:#888;font-size:24px;cursor:pointer;line-height:1;padding:0 4px}',
      '.sn-dm-close:hover{color:#fff}',
      '.sn-dm-body{padding:16px 20px}',
      '.sn-dm-lang-bar{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}',
      '.sn-dm-lang-btn{background:#0f0f0f;border:1.5px solid #1f1f1f;color:#888;padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;font-weight:500}',
      '.sn-dm-lang-btn:hover{border-color:#ff6b9d;color:#fff}',
      '.sn-dm-lang-btn.active{background:linear-gradient(135deg,#ff0844,#ff6b9d);border-color:#ff0844;color:#fff}',
      '.sn-dm-variant{background:#0f0f0f;border:1px solid #1f1f1f;border-radius:12px;margin-bottom:14px;overflow:hidden}',
      '.sn-dm-variant-head{padding:12px 16px;border-bottom:1px solid #1f1f1f;display:flex;justify-content:space-between;align-items:center;gap:10px;background:rgba(255,8,68,0.03)}',
      '.sn-dm-variant-title{font-size:13px;font-weight:600;color:#fff}',
      '.sn-dm-variant-note{font-size:11px;color:#888;margin-top:2px}',
      '.sn-dm-variant-body{padding:14px 16px;font-size:13px;line-height:1.55;white-space:pre-wrap;color:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif}',
      '.sn-dm-variant-actions{display:flex;gap:8px;padding:10px 16px;background:#0a0a0a;border-top:1px solid #1f1f1f;flex-wrap:wrap}',
      '.sn-dm-btn{background:#1a1a1a;color:#e5e5e5;border:1px solid #2f2f2f;padding:7px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;font-weight:500;transition:all 0.15s}',
      '.sn-dm-btn:hover{background:#2a2a2a;border-color:#ff6b9d}',
      '.sn-dm-btn-primary{background:linear-gradient(135deg,#ff0844,#ff6b9d);border-color:#ff0844;color:#fff;font-weight:600}',
      '.sn-dm-btn-primary:hover{background:linear-gradient(135deg,#e6073d,#e6618c)}',
      '.sn-dm-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(9,255,9,0.15);border:1px solid rgba(9,255,9,0.4);color:#55ff55;padding:10px 20px;border-radius:8px;font-size:13px;z-index:10001;animation:sn-dm-fade 2.5s ease-out forwards}',
      '@keyframes sn-dm-fade{0%{opacity:0;transform:translate(-50%,-10px)}15%{opacity:1;transform:translate(-50%,0)}85%{opacity:1}100%{opacity:0;transform:translate(-50%,-10px)}}',
      '.sn-dm-ctx{background:rgba(255,8,68,0.05);border:1px solid rgba(255,8,68,0.2);padding:10px 14px;border-radius:8px;margin-bottom:14px;font-size:11px;color:#ccc;line-height:1.6}',
      '.sn-dm-ctx strong{color:#ff6b9d}'
    ].join('');
    document.head.appendChild(s);
  }
  
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'sn-dm-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 2500);
  }
  
  function escapeHtml(s){
    return String(s==null?'':s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  
  function openPlatformDm(platform, handle) {
    var urls = {
      instagram: 'https://ig.me/m/' + handle,
      twitter: 'https://twitter.com/messages/compose?recipient_id=' + handle,
      tiktok: 'https://www.tiktok.com/@' + handle,
      onlyfans: 'https://onlyfans.com/' + handle + '/chats',
      fansly: 'https://fansly.com/messages',
      telegram: 'https://t.me/' + handle,
      reddit: 'https://www.reddit.com/message/compose?to=' + handle
    };
    var url = urls[platform] || ('https://www.google.com/search?q=' + encodeURIComponent(platform + ' ' + handle));
    window.open(url, '_blank', 'noopener');
  }
  
  window.showDmGenerator = function(creator) {
    if (!creator) { alert('Creator data missing'); return; }
    injectStyles();
    
    var initialLang = TEMPLATES[creator.language] ? creator.language : 'es';
    var ctx = {
      name: creator.display_name || creator.handle,
      code: creator.signup_code || 'SHADOWNET',
      handle: creator.handle,
      followers: creator.follower_count ? creator.follower_count.toLocaleString('en-US') : ''
    };
    
    var overlay = document.createElement('div');
    overlay.className = 'sn-dm-overlay';
    
    function renderLang(lang) {
      var variantsHtml = ['A','B','C'].map(function(v){
        var meta = VARIANT_META[v];
        var body = fillTemplate(TEMPLATES[lang][v], ctx);
        return ''+
          '<div class="sn-dm-variant" data-variant="'+v+'">'+
            '<div class="sn-dm-variant-head">'+
              '<div>'+
                '<div class="sn-dm-variant-title">'+meta.emoji+' Variant '+v+' — '+meta.label+'</div>'+
                '<div class="sn-dm-variant-note">'+meta.note+'</div>'+
              '</div>'+
              '<span style="font-size:10px;color:#666;font-family:SF Mono,Menlo,monospace">'+body.length+' chars</span>'+
            '</div>'+
            '<div class="sn-dm-variant-body" id="sn-dm-text-'+v+'">'+escapeHtml(body)+'</div>'+
            '<div class="sn-dm-variant-actions">'+
              '<button class="sn-dm-btn sn-dm-btn-primary" data-act="copy-mark" data-variant="'+v+'">📋 Copiar + Marcar contactado con '+v+'</button>'+
              '<button class="sn-dm-btn" data-act="copy" data-variant="'+v+'">📋 Solo copiar</button>'+
              '<button class="sn-dm-btn" data-act="open-dm">🔗 Abrir DM en '+creator.platform+'</button>'+
            '</div>'+
          '</div>';
      }).join('');
      
      return variantsHtml;
    }
    
    overlay.innerHTML = 
      '<div class="sn-dm-modal">'+
        '<div class="sn-dm-header">'+
          '<div>'+
            '<h2>📨 Generar DM para @'+escapeHtml(creator.handle)+'</h2>'+
            '<div class="meta">'+escapeHtml(creator.platform)+' · '+(creator.tier||'—')+' · '+(ctx.followers||'?')+' followers · code <strong>'+escapeHtml(ctx.code)+'</strong></div>'+
          '</div>'+
          '<button class="sn-dm-close" aria-label="Cerrar">×</button>'+
        '</div>'+
        '<div class="sn-dm-body">'+
          '<div class="sn-dm-ctx">'+
            '<strong>Instrucciones:</strong> Elegí el idioma abajo. Revisá cada variante 20s (edita si querés). Click "Copiar + Marcar contactado" para pegar en '+creator.platform+' y que el sistema registre automáticamente. Variables ya rellenadas: nombre, código personal, handle.'+
          '</div>'+
          '<div class="sn-dm-lang-bar" id="sn-dm-langs">'+
            '<button class="sn-dm-lang-btn'+(initialLang==='es'?' active':'')+'" data-lang="es">🇪🇸 Español</button>'+
            '<button class="sn-dm-lang-btn'+(initialLang==='pt'?' active':'')+'" data-lang="pt">🇧🇷 Português</button>'+
            '<button class="sn-dm-lang-btn'+(initialLang==='it'?' active':'')+'" data-lang="it">🇮🇹 Italiano</button>'+
            '<button class="sn-dm-lang-btn'+(initialLang==='en'?' active':'')+'" data-lang="en">🇺🇸 English</button>'+
          '</div>'+
          '<div id="sn-dm-variants">'+renderLang(initialLang)+'</div>'+
        '</div>'+
      '</div>';
    
    document.body.appendChild(overlay);
    
    var currentLang = initialLang;
    
    function wireActions() {
      overlay.querySelectorAll('[data-act]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var act = btn.getAttribute('data-act');
          var variant = btn.getAttribute('data-variant');
          
          if (act === 'copy' || act === 'copy-mark') {
            var body = fillTemplate(TEMPLATES[currentLang][variant], ctx);
            try {
              await navigator.clipboard.writeText(body);
              toast('✅ Copiado al portapapeles ('+body.length+' chars)');
            } catch(e) {
              alert('Copy failed. Manually copy: \n\n' + body);
              return;
            }
            
            if (act === 'copy-mark' && window.sb) {
              try {
                await window.sb.rpc('update_outreach_status', {
                  p_id: creator.id,
                  p_status: 'contacted',
                  p_notes: 'DM sent (variant ' + variant + ', ' + currentLang + ')'
                });
                // Also update pitch_variant
                await window.sb.from('creator_outreach')
                  .update({ pitch_variant: variant })
                  .eq('id', creator.id);
                toast('✅ Marcado como contactado con variant ' + variant);
                // Refresh list if available
                setTimeout(function(){ if (window.loadOutreachList) window.loadOutreachList(); }, 500);
              } catch(e) { console.error('Mark failed:', e); }
            }
          }
          
          if (act === 'open-dm') {
            openPlatformDm(creator.platform, creator.handle);
          }
        });
      });
    }
    
    wireActions();
    
    // Language switching
    overlay.querySelectorAll('.sn-dm-lang-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var lang = btn.getAttribute('data-lang');
        currentLang = lang;
        overlay.querySelectorAll('.sn-dm-lang-btn').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('sn-dm-variants').innerHTML = renderLang(lang);
        wireActions();
      });
    });
    
    // Close
    overlay.querySelector('.sn-dm-close').addEventListener('click', function(){
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });
    overlay.addEventListener('click', function(e){
      if (e.target === overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });
  };
  
  console.log('[outreach-dm-generator] Ready. Call window.showDmGenerator(creator).');
})();
