// profile-p2.js — P2 enhancements to profile.html: Highlights carousel + Fan Rank badge
// Include with <script src="/profile-p2.js" defer></script> in profile.html

(function(){
  'use strict';
  
  // Inject CSS for carousel + badge + items modal
  var STYLE = document.createElement('style');
  STYLE.textContent = '.p2-highlights-row{display:flex;gap:12px;overflow-x:auto;padding:12px 16px 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch}'+
    '.p2-highlights-row::-webkit-scrollbar{display:none}'+
    '.p2-highlight-circle{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer}'+
    '.p2-highlight-ring{width:68px;height:68px;border-radius:50%;background:linear-gradient(135deg,#ff0844,#ff6b9d);padding:3px;transition:transform 0.15s}'+
    '.p2-highlight-circle:hover .p2-highlight-ring{transform:scale(1.05)}'+
    '.p2-highlight-inner{width:100%;height:100%;border-radius:50%;background:#01020c;padding:2px;display:flex;align-items:center;justify-content:center;overflow:hidden}'+
    '.p2-highlight-inner img{width:100%;height:100%;border-radius:50%;object-fit:cover}'+
    '.p2-highlight-inner .p2-emoji{font-size:28px}'+
    '.p2-highlight-label{font-size:10px;color:#c8d8e8;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:Rajdhani,sans-serif;font-weight:600}'+
    '.p2-rank-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;font-family:Rajdhani,sans-serif;margin-left:6px;vertical-align:middle;border:1.5px solid currentColor;cursor:pointer}'+
    '.p2-rank-badge:hover{background:rgba(255,255,255,0.05)}'+
    '.p2-rank-badge-emoji{font-size:13px}'+
    '.p2-viewer-modal{position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:9999;display:none;align-items:center;justify-content:center;flex-direction:column}'+
    '.p2-viewer-modal.open{display:flex}'+
    '.p2-viewer-bar{position:absolute;top:14px;left:14px;right:14px;display:flex;gap:4px;z-index:2}'+
    '.p2-viewer-seg{flex:1;height:3px;background:rgba(255,255,255,0.3);border-radius:2px;overflow:hidden}'+
    '.p2-viewer-seg-fill{height:100%;background:#fff;width:0;transition:width 0.1s linear}'+
    '.p2-viewer-seg.passed .p2-viewer-seg-fill{width:100%}'+
    '.p2-viewer-close{position:absolute;top:30px;right:16px;background:rgba(0,0,0,0.5);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:20px;cursor:pointer;z-index:3}'+
    '.p2-viewer-content{width:min(100vw,380px);height:min(100vh,675px);display:flex;align-items:center;justify-content:center;position:relative}'+
    '.p2-viewer-content img,.p2-viewer-content video{max-width:100%;max-height:100%;border-radius:4px}'+
    '.p2-viewer-nav{position:absolute;top:0;bottom:0;width:50%;z-index:1;cursor:pointer}'+
    '.p2-viewer-nav-left{left:0}'+
    '.p2-viewer-nav-right{right:0}'+
    '.p2-viewer-title{position:absolute;top:40px;left:16px;color:#fff;font-family:Rajdhani,sans-serif;font-size:15px;font-weight:700;z-index:2}';
  document.head.appendChild(STYLE);
  
  // Wait for profile page to initialize
  function getCtx(){
    // profile.html exposes window.profileUserId and window.currentUser
    if (!window.sb || !window.profileUserId) return null;
    return {
      profileUserId: window.profileUserId,
      currentUserId: window.currentUser && window.currentUser.id,
      isOwn: window.currentUser && window.currentUser.id === window.profileUserId
    };
  }
  
  async function renderHighlights(ctx){
    if (!ctx) return;
    // Remove old if exists (re-runs)
    var existing = document.getElementById('p2-highlights-row');
    if (existing) existing.remove();
    
    // Fetch highlights for this profile
    var r = await window.sb.from('story_highlights')
      .select('id,title,emoji,cover_url')
      .eq('user_id', ctx.profileUserId)
      .order('created_at', { ascending: false });
    
    var highlights = r.data || [];
    if (!highlights.length) return;
    
    // Create row element
    var row = document.createElement('div');
    row.id = 'p2-highlights-row';
    row.className = 'p2-highlights-row';
    row.innerHTML = highlights.map(function(h){
      var innerContent = h.cover_url 
        ? '<img src="' + h.cover_url + '" alt="">'
        : '<span class="p2-emoji">' + (h.emoji || '📸') + '</span>';
      return '<div class="p2-highlight-circle" data-id="' + h.id + '">'+
        '<div class="p2-highlight-ring"><div class="p2-highlight-inner">' + innerContent + '</div></div>'+
        '<div class="p2-highlight-label">' + (h.title || '') + '</div>'+
      '</div>';
    }).join('');
    
    // Insert after profile-header or before content grid
    var header = document.querySelector('.profile-header');
    var grid = document.querySelector('.profile-grid') || document.querySelector('.posts-grid') || document.querySelector('.content-grid');
    if (header && header.parentNode) {
      header.parentNode.insertBefore(row, header.nextSibling);
    } else if (grid && grid.parentNode) {
      grid.parentNode.insertBefore(row, grid);
    } else {
      // Fallback: append to profile-wrap
      var wrap = document.querySelector('.profile-wrap') || document.body;
      wrap.appendChild(row);
    }
    
    // Wire click handlers
    row.querySelectorAll('.p2-highlight-circle').forEach(function(c){
      c.addEventListener('click', function(){ openViewer(c.dataset.id, highlights); });
    });
  }
  
  var viewerState = { items: [], index: 0, timer: null, highlight: null };
  
  async function openViewer(highlightId, allHighlights){
    viewerState.highlight = allHighlights.find(function(h){ return h.id === highlightId; });
    if (!viewerState.highlight) return;
    
    // Load items
    var r = await window.sb.from('highlight_items')
      .select('id,media_url,media_type,created_at')
      .eq('highlight_id', highlightId)
      .order('created_at', { ascending: true });
    
    viewerState.items = r.data || [];
    viewerState.index = 0;
    
    if (!viewerState.items.length) {
      alert('Este highlight aún no tiene contenido');
      return;
    }
    
    // Ensure modal exists
    var modal = document.getElementById('p2-viewer-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'p2-viewer-modal';
      modal.className = 'p2-viewer-modal';
      modal.innerHTML = '<button class="p2-viewer-close" onclick="document.getElementById(\'p2-viewer-modal\').classList.remove(\'open\')">&times;</button>'+
        '<div class="p2-viewer-bar" id="p2-viewer-bar"></div>'+
        '<div class="p2-viewer-title" id="p2-viewer-title"></div>'+
        '<div class="p2-viewer-content" id="p2-viewer-content"></div>'+
        '<div class="p2-viewer-nav p2-viewer-nav-left" id="p2-viewer-prev"></div>'+
        '<div class="p2-viewer-nav p2-viewer-nav-right" id="p2-viewer-next"></div>';
      document.body.appendChild(modal);
      document.getElementById('p2-viewer-prev').addEventListener('click', prevItem);
      document.getElementById('p2-viewer-next').addEventListener('click', nextItem);
    }
    
    document.getElementById('p2-viewer-title').textContent = (viewerState.highlight.emoji || '📸') + '  ' + (viewerState.highlight.title || '');
    
    // Build progress segments
    var bar = document.getElementById('p2-viewer-bar');
    bar.innerHTML = viewerState.items.map(function(){
      return '<div class="p2-viewer-seg"><div class="p2-viewer-seg-fill"></div></div>';
    }).join('');
    
    modal.classList.add('open');
    showItem(0);
  }
  
  function showItem(idx){
    if (idx < 0 || idx >= viewerState.items.length) return;
    viewerState.index = idx;
    var it = viewerState.items[idx];
    var content = document.getElementById('p2-viewer-content');
    
    if (it.media_type === 'video') {
      content.innerHTML = '<video src="' + it.media_url + '" autoplay playsinline controls></video>';
    } else {
      content.innerHTML = '<img src="' + it.media_url + '" alt="">';
    }
    
    // Update progress bar
    var segs = document.querySelectorAll('#p2-viewer-bar .p2-viewer-seg');
    segs.forEach(function(s, i){
      s.classList.toggle('passed', i < idx);
      s.querySelector('.p2-viewer-seg-fill').style.width = (i === idx ? '0' : (i < idx ? '100%' : '0'));
    });
    
    // Auto-advance for images (videos wait for onended)
    clearTimeout(viewerState.timer);
    if (it.media_type !== 'video') {
      var fill = segs[idx]?.querySelector('.p2-viewer-seg-fill');
      if (fill) {
        // Animate fill over 5s
        setTimeout(function(){ if (fill) fill.style.transition = 'width 5s linear'; fill.style.width = '100%'; }, 20);
      }
      viewerState.timer = setTimeout(nextItem, 5000);
    } else {
      var vid = content.querySelector('video');
      if (vid) vid.onended = nextItem;
    }
  }
  
  function nextItem(){
    if (viewerState.index + 1 < viewerState.items.length) showItem(viewerState.index + 1);
    else document.getElementById('p2-viewer-modal').classList.remove('open');
  }
  function prevItem(){ showItem(Math.max(0, viewerState.index - 1)); }
  
  async function renderRankBadge(ctx){
    if (!ctx || ctx.isOwn || !ctx.currentUserId) return;
    
    // Remove old if exists
    var existing = document.getElementById('p2-rank-badge');
    if (existing) existing.remove();
    
    try {
      var r = await window.sb.rpc('get_fan_rank', {
        p_fan_id: ctx.currentUserId,
        p_creator_id: ctx.profileUserId
      });
      if (r.error) return;
      var rank = r.data;
      if (!rank) return;
      
      var badge = document.createElement('span');
      badge.id = 'p2-rank-badge';
      badge.className = 'p2-rank-badge';
      badge.style.color = rank.badge_color || '#ff2255';
      badge.innerHTML = '<span class="p2-rank-badge-emoji">' + (rank.badge_emoji || '⭐') + '</span>' +
        '<span>' + (rank.rank_name || 'Fan') + '</span>' +
        '<span style="opacity:0.7">· ' + (rank.points || 0) + ' pts</span>';
      badge.title = 'Tu rango con este creator. Click para ver progreso.';
      badge.addEventListener('click', function(){ window.location.href = '/fan-rank.html'; });
      
      // Insert next to username
      var usernameEl = document.getElementById('profileUsername');
      if (usernameEl) {
        usernameEl.appendChild(badge);
      }
    } catch(e) {
      console.debug('[profile-p2] rank badge skipped:', e);
    }
  }
  
  function init(){
    var ctx = getCtx();
    if (!ctx) { setTimeout(init, 500); return; }
    renderHighlights(ctx);
    renderRankBadge(ctx);
    console.debug('[profile-p2] rendered for profile', ctx.profileUserId);
  }
  
  // Wait a bit longer than profile.html's own init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 800); });
  } else {
    setTimeout(init, 800);
  }
})();
