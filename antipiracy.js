// SHADOWNET Anti-Piracy Module
// Client-side detection + logging of suspicious events on premium content.
// Automatic forensic tracking: if content leaks, we know who accessed it.
// (c) SHADOWNET — licensed internal use

(function(global){
  'use strict';
  
  var SB_URL = 'https://cdokplvoqivducsqrejt.supabase.co';
  var CONFIG = {
    enabled: true,
    logViews: true,
    detectScreenshot: true,
    detectDevtools: true,
    blockRightClick: true,
    blockTextSelection: true,
    blockPrintScreen: true,
    viewThresholdMs: 2000,  // only count as view after 2s
    duplicateDedupeMs: 5000,  // dedupe same event within 5s
    visibleWatermark: true
  };
  
  var _lastLog = {};
  var _sessionId = (function(){
    try {
      var existing = sessionStorage.getItem('sn_sid');
      if (existing) return existing;
      var sid = 'sn_' + Math.random().toString(36).slice(2) + '_' + Date.now();
      sessionStorage.setItem('sn_sid', sid);
      return sid;
    } catch(e) { return 'sn_' + Date.now(); }
  })();
  
  // Browser fingerprint (canvas + WebGL + screen + UA)
  var _fingerprint = null;
  function getFingerprint() {
    if (_fingerprint) return _fingerprint;
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 50;
      var ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('shadownet_fp', 2, 15);
      var data = canvas.toDataURL();
      var h = 0;
      for (var i = 0; i < data.length; i++) {
        h = ((h << 5) - h) + data.charCodeAt(i);
        h |= 0;
      }
      var screenFp = screen.width + 'x' + screen.height + 'x' + (window.devicePixelRatio || 1);
      var uaFp = navigator.userAgent.length + '_' + (navigator.language || '');
      _fingerprint = 'fp_' + Math.abs(h).toString(36) + '_' + screenFp + '_' + uaFp;
      return _fingerprint;
    } catch(e) { return 'fp_unknown_' + Date.now(); }
  }
  
  function getSb() { return global.sb || global.supabase; }
  
  function logAccess(postId, accessType, durationMs) {
    if (!CONFIG.enabled || !postId) return;
    var sb = getSb();
    if (!sb || !sb.rpc) return;
    
    // Dedupe
    var key = postId + '_' + accessType;
    var now = Date.now();
    if (_lastLog[key] && (now - _lastLog[key]) < CONFIG.duplicateDedupeMs) return;
    _lastLog[key] = now;
    
    try {
      sb.rpc('log_content_access', {
        p_post_id: postId,
        p_access_type: accessType,
        p_duration_ms: durationMs || null,
        p_fingerprint: getFingerprint()
      }).then(function(res){
        if (res && res.error) {
          // Silent fail (don't block UX if logging broken)
          console.debug('[antipiracy] log failed:', res.error.message);
        }
      }).catch(function(e){ console.debug('[antipiracy] log exception:', e); });
    } catch(e) { console.debug('[antipiracy] log threw:', e); }
  }
  
  // ==== Screenshot detection ====
  // Desktop: visibilitychange after rapid focus change often indicates screenshot
  // Mobile: no reliable detection on web (native apps only). Best effort: orientation lock leak.
  function setupScreenshotDetection() {
    if (!CONFIG.detectScreenshot) return;
    var _lastVisChange = 0;
    document.addEventListener('visibilitychange', function(){
      var now = Date.now();
      var delta = now - _lastVisChange;
      _lastVisChange = now;
      // Very fast hide/show (<300ms) on Mac often = Cmd+Shift+4 screenshot
      if (document.hidden && delta < 300 && delta > 0) {
        var viewingPost = getCurrentViewingPost();
        if (viewingPost) logAccess(viewingPost, 'screenshot_detected');
      }
    });
    // iOS Safari: fires on Lock-button screenshot via 'contextmenu' sometimes
    // Not reliable, but worth trying:
    window.addEventListener('beforeprint', function(){
      var viewingPost = getCurrentViewingPost();
      if (viewingPost) logAccess(viewingPost, 'screenshot_detected');
    });
  }
  
  // ==== DevTools detection ====
  // Technique: debugger trap + window size diff
  function setupDevtoolsDetection() {
    if (!CONFIG.detectDevtools) return;
    var detected = false;
    function check() {
      if (detected) return;
      var threshold = 160;
      var widthDiff = window.outerWidth - window.innerWidth;
      var heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        detected = true;
        var viewingPost = getCurrentViewingPost();
        if (viewingPost) logAccess(viewingPost, 'devtools_detected');
      }
    }
    setInterval(check, 3000);
  }
  
  // ==== Block right click + save ====
  function setupRightClickBlock() {
    if (!CONFIG.blockRightClick) return;
    document.addEventListener('contextmenu', function(e){
      // Only block on elements with data-protect attribute or img/video in post content
      var target = e.target;
      var isMedia = target.tagName === 'IMG' || target.tagName === 'VIDEO' ||
                    target.closest('[data-post-id]') !== null;
      if (isMedia) {
        e.preventDefault();
        var postId = target.closest('[data-post-id]')?.getAttribute('data-post-id');
        if (postId) logAccess(postId, 'right_click');
        return false;
      }
    });
  }
  
  // ==== Block Print Screen + Save As ====
  function setupKeyboardBlock() {
    if (!CONFIG.blockPrintScreen) return;
    document.addEventListener('keydown', function(e){
      // Cmd+S / Ctrl+S (save as)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        var viewingPost = getCurrentViewingPost();
        if (viewingPost) logAccess(viewingPost, 'media_save_attempt');
      }
      // Print Screen
      if (e.key === 'PrintScreen') {
        var viewingPost = getCurrentViewingPost();
        if (viewingPost) logAccess(viewingPost, 'screenshot_detected');
      }
      // F12 / Cmd+Opt+I / Cmd+Opt+J (devtools)
      if (e.key === 'F12' || 
          ((e.metaKey || e.ctrlKey) && e.altKey && (e.key === 'I' || e.key === 'J' || e.key === 'i' || e.key === 'j'))) {
        var viewingPost = getCurrentViewingPost();
        if (viewingPost) logAccess(viewingPost, 'devtools_detected');
      }
    });
  }
  
  // ==== Text selection block on premium content ====
  function setupSelectionBlock() {
    if (!CONFIG.blockTextSelection) return;
    var style = document.createElement('style');
    style.textContent = '[data-post-id][data-premium="true"] img, [data-post-id][data-premium="true"] video, [data-post-id][data-premium="true"] { user-select: none; -webkit-user-select: none; -moz-user-select: none; -webkit-touch-callout: none; pointer-events: auto; } [data-post-id] img { -webkit-user-drag: none; -khtml-user-drag: none; -moz-user-drag: none; -o-user-drag: none; user-drag: none; }';
    document.head.appendChild(style);
  }
  
  // ==== Track which post is currently being viewed (in viewport) ====
  var _currentViewingPost = null;
  var _viewStartTime = null;
  function getCurrentViewingPost() {
    return _currentViewingPost;
  }
  
  function setupViewTracking() {
    if (!CONFIG.logViews || !('IntersectionObserver' in window)) return;
    
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var postId = entry.target.getAttribute('data-post-id');
        if (!postId) return;
        
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Started viewing
          _currentViewingPost = postId;
          _viewStartTime = Date.now();
        } else if (!entry.isIntersecting && _currentViewingPost === postId) {
          // Finished viewing
          var duration = _viewStartTime ? (Date.now() - _viewStartTime) : 0;
          if (duration >= CONFIG.viewThresholdMs) {
            logAccess(postId, 'view', duration);
          }
          _currentViewingPost = null;
          _viewStartTime = null;
        }
      });
    }, { threshold: [0, 0.5, 1.0] });
    
    // Observe all existing and future post elements
    function attachToNewPosts() {
      document.querySelectorAll('[data-post-id]:not([data-ap-observed])').forEach(function(el){
        el.setAttribute('data-ap-observed', 'true');
        observer.observe(el);
      });
    }
    attachToNewPosts();
    
    // Re-scan every few seconds for dynamically added posts
    setInterval(attachToNewPosts, 3000);
    
    // Also observe MutationObserver for faster detection
    if ('MutationObserver' in window) {
      var mo = new MutationObserver(function(){ attachToNewPosts(); });
      if (document.body) mo.observe(document.body, { childList: true, subtree: true });
    }
  }
  
  // ==== Watermark overlay on premium content ====
  function applyWatermark() {
    if (!CONFIG.visibleWatermark) return;
    var style = document.createElement('style');
    style.id = 'sn-watermark-style';
    style.textContent = `
      [data-post-id][data-premium="true"] { position: relative; }
      [data-post-id][data-premium="true"]::after {
        content: attr(data-watermark);
        position: absolute;
        bottom: 12px;
        right: 12px;
        background: rgba(0,0,0,0.5);
        color: rgba(255,255,255,0.75);
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        font-family: -apple-system, system-ui, sans-serif;
        pointer-events: none;
        z-index: 999;
        letter-spacing: 0.5px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // ==== Init ====
  function init() {
    if (!CONFIG.enabled) return;
    setupScreenshotDetection();
    setupDevtoolsDetection();
    setupRightClickBlock();
    setupKeyboardBlock();
    setupSelectionBlock();
    setupViewTracking();
    applyWatermark();
    console.debug('[antipiracy] initialized');
  }
  
  // Expose to global
  global.SNAntiPiracy = {
    init: init,
    log: logAccess,
    config: CONFIG,
    sessionId: function(){ return _sessionId; },
    fingerprint: getFingerprint
  };
  
  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
