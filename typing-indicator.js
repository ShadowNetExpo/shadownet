// typing-indicator.js — Shows 3-dot animation when peer is typing in DM
// Uses Supabase Realtime broadcast for instant propagation, fallback to typing_indicators table
// Include with <script src="/typing-indicator.js" defer></script> after ppv-dm-fix.js in messages.html

(function(){
  'use strict';
  
  // Inject CSS for the dots indicator
  var STYLE = document.createElement('style');
  STYLE.textContent = '.typing-indicator-row{display:flex;align-items:center;gap:8px;padding:8px 16px 4px;opacity:0;transition:opacity 0.2s;min-height:0;max-height:0;overflow:hidden}' +
    '.typing-indicator-row.show{opacity:1;min-height:32px;max-height:32px}' +
    '.typing-indicator-avatar{width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#ff2255,#800011);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;overflow:hidden;flex-shrink:0}' +
    '.typing-indicator-avatar img{width:100%;height:100%;object-fit:cover}' +
    '.typing-indicator-dots{display:flex;gap:3px;padding:6px 12px;background:rgba(7,15,30,0.8);border:1px solid #0d2744;border-radius:18px}' +
    '.typing-indicator-dots span{width:6px;height:6px;border-radius:50%;background:#5a8aaa;animation:typingBounce 1s ease infinite}' +
    '.typing-indicator-dots span:nth-child(2){animation-delay:0.15s}' +
    '.typing-indicator-dots span:nth-child(3){animation-delay:0.3s}' +
    '@keyframes typingBounce{0%,60%,100%{transform:translateY(0);opacity:0.5}30%{transform:translateY(-6px);opacity:1}}';
  document.head.appendChild(STYLE);
  
  var typingChannel = null;
  var typingDebounce = null;
  var lastSent = 0;
  var currentConvId = null;
  
  function install(){
    if (!window.sb || !window.currentUser) { setTimeout(install, 500); return; }
    
    // Create indicator DOM inside chat-msgs area
    function ensureIndicator(){
      var area = document.getElementById('chatMsgsArea');
      if (!area) return null;
      var ind = document.getElementById('typingIndicator');
      if (!ind) {
        ind = document.createElement('div');
        ind.id = 'typingIndicator';
        ind.className = 'typing-indicator-row';
        ind.innerHTML = '<div class="typing-indicator-avatar" id="typingAvatar">?</div>' +
          '<div class="typing-indicator-dots"><span></span><span></span><span></span></div>';
        // Append at the bottom of messages area so it's always visible
        area.parentNode.insertBefore(ind, area.nextSibling);
      }
      return ind;
    }
    
    function showTyping(show, avatarUrl, initial){
      var ind = ensureIndicator();
      if (!ind) return;
      if (show) {
        var av = document.getElementById('typingAvatar');
        if (av) {
          if (avatarUrl) av.innerHTML = '<img src="' + avatarUrl + '" alt="">';
          else av.textContent = (initial || '?').toUpperCase();
        }
        ind.classList.add('show');
      } else {
        ind.classList.remove('show');
      }
    }
    
    // Subscribe to typing broadcasts when conversation opens
    function subscribeToTyping(convId, peerId){
      if (typingChannel) { try { window.sb.removeChannel(typingChannel); } catch(e) {} }
      currentConvId = convId;
      showTyping(false);
      
      typingChannel = window.sb.channel('typing-' + convId, { config: { broadcast: { self: false } } });
      typingChannel.on('broadcast', { event: 'typing' }, function(payload){
        if (!payload.payload) return;
        if (payload.payload.user_id !== peerId) return; // ignore own echoes and others
        if (payload.payload.is_typing) {
          showTyping(true, payload.payload.avatar_url, payload.payload.username);
          // Auto-hide after 4s if no new events
          clearTimeout(window._typingAutoHide);
          window._typingAutoHide = setTimeout(function(){ showTyping(false); }, 4000);
        } else {
          showTyping(false);
        }
      });
      typingChannel.subscribe();
    }
    
    // Broadcast typing state when user types
    function broadcastTyping(isTyping){
      if (!typingChannel || !currentConvId || !window.currentUser) return;
      var prof = window.currentProfile || {};
      typingChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: window.currentUser.id,
          username: prof.username || '?',
          avatar_url: prof.avatar_url || null,
          is_typing: isTyping
        }
      });
      lastSent = Date.now();
    }
    
    // Wire up msgInp textarea
    function wireInput(){
      var inp = document.getElementById('msgInp');
      if (!inp || inp.dataset.typingWired) return;
      inp.dataset.typingWired = '1';
      
      inp.addEventListener('input', function(){
        // Throttle: send max every 2s while typing
        if (Date.now() - lastSent > 2000) {
          broadcastTyping(true);
        }
        clearTimeout(typingDebounce);
        typingDebounce = setTimeout(function(){
          broadcastTyping(false);
        }, 2500);
      });
      inp.addEventListener('blur', function(){
        clearTimeout(typingDebounce);
        broadcastTyping(false);
      });
    }
    
    // Hook into openConversation to set peer context
    var origOpenConv = window.openConversation;
    if (typeof origOpenConv === 'function') {
      window.openConversation = async function(convId, peerId, peer){
        var result = await origOpenConv.apply(this, arguments);
        subscribeToTyping(convId, peerId);
        setTimeout(wireInput, 100);
        return result;
      };
    } else {
      setTimeout(wireInput, 1000);
    }
    
    console.debug('[typing-indicator] installed');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(install, 600); });
  } else {
    setTimeout(install, 600);
  }
})();
