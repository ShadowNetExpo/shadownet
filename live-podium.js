/* SHADOWNET multi-guest podium (1 host + up to 12 guests = 13 total).
 * - Viewers can request a seat via window.snPodiumRequest()
 * - Host approves/rejects/ejects from a panel
 * - Approved guests publish their cam/mic to the host's Agora channel
 * - All participants subscribe to each other (multi-broadcaster pattern)
 * - Grid layout adjusts dynamically based on active count
 *
 * Public surface (called from live.html):
 *   window.snPodiumInit(opts)  - initialize for current live (host or viewer mode)
 *   window.snPodiumTeardown()  - clean up on live end / leave
 *   window.snPodiumOpenPanel() - host: open pending requests panel
 *   window.snPodiumRequest()   - viewer: request to join the podium
 */
(function(){
  if (window.__snPodiumLoaded) return;
  window.__snPodiumLoaded = true;

  // ---------- module state ----------
  var liveStreamId = null;       // current live row id
  var hostId = null;             // current live host_id
  var hostChannel = null;        // Agora channel name (= host_id)
  var iAmHost = false;           // current user is host of this live?
  var mySeatId = null;           // seat id when I'm a guest
  var myGuestRole = null;        // null | 'pending' | 'active'
  var podiumChannel = null;      // supabase realtime channel
  var seatsCache = {};           // seat_id -> seat row (with profile)
  var profileCache = {};         // user_id -> profile row
  var guestClient = null;        // Agora RTCClient when I'm a guest publishing
  var guestVideoTrack = null;
  var guestAudioTrack = null;
  var pendingPanelOpen = false;
  var hostSubClient = null;      // Agora client used by host to subscribe to guest videos
  var subVideoEls = {};          // uid -> DOM video element
  var subAudioPlayers = {};      // uid -> remote audio object

  // ---------- styles ----------
  var STYLE = document.createElement('style');
  STYLE.textContent = '.sp-req-btn{position:fixed;bottom:78px;right:14px;z-index:97;background:linear-gradient(135deg,#aa00ff,#5500aa);color:#fff;border:1.5px solid rgba(170,0,255,.5);border-radius:24px;padding:9px 14px;font-family:Rajdhani,sans-serif;font-weight:800;font-size:12px;cursor:pointer;letter-spacing:.04em;display:none;align-items:center;gap:6px;box-shadow:0 4px 18px rgba(170,0,255,.5);text-transform:uppercase}.sp-req-btn.visible{display:inline-flex}.sp-req-btn.pending{background:linear-gradient(135deg,#5a8aaa,#2a4a6a);cursor:default}.sp-req-btn.active{background:linear-gradient(135deg,#ff2255,#aa0030)}.sp-req-btn:hover:not(.pending){transform:scale(1.05)}.sp-host-btn{position:fixed;top:54px;right:14px;z-index:97;background:linear-gradient(135deg,#aa00ff,#5500aa);color:#fff;border:1.5px solid rgba(170,0,255,.5);border-radius:24px;padding:9px 14px;font-family:Rajdhani,sans-serif;font-weight:800;font-size:11px;cursor:pointer;letter-spacing:.04em;display:none;align-items:center;gap:6px;box-shadow:0 4px 18px rgba(170,0,255,.4);text-transform:uppercase}.sp-host-btn.visible{display:inline-flex}.sp-host-btn:hover{transform:scale(1.05)}.sp-host-btn .sp-badge{background:#fff;color:#aa00ff;border-radius:10px;padding:1px 7px;font-size:10px;min-width:14px;text-align:center}.sp-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:10000;display:none;align-items:center;justify-content:center;padding:20px}.sp-modal.open{display:flex}.sp-box{background:#070f1e;border:1.5px solid rgba(170,0,255,.4);border-radius:16px;width:100%;max-width:420px;max-height:85vh;overflow-y:auto;padding:20px}.sp-title{font-family:Orbitron,sans-serif;font-size:13px;color:#aa00ff;letter-spacing:.1em;margin-bottom:14px}.sp-list{display:flex;flex-direction:column;gap:8px;max-height:60vh;overflow-y:auto}.sp-item{display:flex;align-items:center;gap:10px;padding:10px;background:rgba(7,15,30,.6);border:1px solid rgba(170,0,255,.2);border-radius:10px}.sp-item-av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#aa00ff,#5500aa);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px;overflow:hidden;flex-shrink:0}.sp-item-av img{width:100%;height:100%;object-fit:cover}.sp-item-name{flex:1;font-family:Rajdhani,sans-serif;font-weight:700;color:#e8f4ff;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sp-actions{display:flex;gap:5px}.sp-btn-ok{padding:6px 11px;background:linear-gradient(135deg,#00c853,#388e3c);color:#000;border:none;border-radius:8px;font-family:Rajdhani,sans-serif;font-weight:900;font-size:11px;cursor:pointer;letter-spacing:.04em}.sp-btn-no{padding:6px 11px;background:transparent;color:#ff5555;border:1px solid rgba(255,50,50,.3);border-radius:8px;font-family:Rajdhani,sans-serif;font-weight:800;font-size:11px;cursor:pointer}.sp-btn-eject{padding:5px 9px;background:rgba(255,34,85,.2);color:#ff2255;border:1px solid rgba(255,34,85,.4);border-radius:6px;font-family:Rajdhani,sans-serif;font-weight:800;font-size:10px;cursor:pointer;text-transform:uppercase}.sp-empty{text-align:center;padding:30px 20px;color:#5a8aaa;font-size:13px}.sp-close{width:100%;margin-top:12px;padding:9px;background:transparent;border:1px solid rgba(255,255,255,.2);color:#5a8aaa;border-radius:8px;font-family:Rajdhani,sans-serif;font-weight:700;font-size:12px;cursor:pointer}body.sp-podium-active .live-video-wrap #liveVideo{position:absolute!important}body.sp-podium-active .live-video-wrap{display:grid!important;background:#000!important;gap:2px!important;padding:0!important}.sp-cell{position:relative;width:100%;height:100%;background:#000;overflow:hidden}.sp-cell video{width:100%!important;height:100%!important;object-fit:cover!important}.sp-cell-name{position:absolute;bottom:6px;left:6px;background:rgba(0,0,0,.7);color:#fff;padding:3px 8px;border-radius:8px;font-size:10px;font-family:Rajdhani,sans-serif;font-weight:700;max-width:80%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sp-cell-host{position:absolute;top:6px;left:6px;background:rgba(170,0,255,.85);color:#fff;padding:2px 7px;border-radius:8px;font-size:9px;font-family:Rajdhani,sans-serif;font-weight:900;letter-spacing:.06em;text-transform:uppercase}.sp-cell-eject{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(255,34,85,.4);border:1px solid rgba(255,34,85,.7);color:#fff;font-size:14px;font-weight:900;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center;padding:0}.sp-leave-btn{position:fixed;bottom:78px;left:50%;transform:translateX(-50%);z-index:99;background:linear-gradient(135deg,#ff2255,#aa0030);color:#fff;border:none;border-radius:24px;padding:10px 22px;font-family:Rajdhani,sans-serif;font-weight:900;font-size:12px;cursor:pointer;letter-spacing:.06em;text-transform:uppercase;box-shadow:0 4px 20px rgba(255,34,85,.5);display:none}.sp-leave-btn.visible{display:inline-flex}';
  document.head.appendChild(STYLE);

  function esc(s){var d=document.createElement('div');d.textContent=String(s||'');return d.innerHTML;}

  function av(prof){
    if (prof && prof.avatar_url) return '<img src="'+esc(prof.avatar_url)+'" alt="" onerror="this.remove()">';
    return esc(((prof&&prof.username)||'?').charAt(0).toUpperCase());
  }

  // ---------- DOM helpers ----------
  function ensureRequestBtn(){
    if (document.getElementById('spReqBtn')) return document.getElementById('spReqBtn');
    var b = document.createElement('button');
    b.id = 'spReqBtn';
    b.className = 'sp-req-btn';
    b.innerHTML = '\u{1F46B} Pedir entrar';
    b.onclick = window.snPodiumRequest;
    document.body.appendChild(b);
    return b;
  }
  function ensureHostBtn(){
    if (document.getElementById('spHostBtn')) return document.getElementById('spHostBtn');
    var b = document.createElement('button');
    b.id = 'spHostBtn';
    b.className = 'sp-host-btn';
    b.innerHTML = '\u{1F46B} Pedidos <span class="sp-badge" id="spBadge">0</span>';
    b.onclick = window.snPodiumOpenPanel;
    document.body.appendChild(b);
    return b;
  }
  function ensureLeaveBtn(){
    if (document.getElementById('spLeaveBtn')) return document.getElementById('spLeaveBtn');
    var b = document.createElement('button');
    b.id = 'spLeaveBtn';
    b.className = 'sp-leave-btn';
    b.innerHTML = '\u21A9 Salir del podio';
    b.onclick = leaveAsGuest;
    document.body.appendChild(b);
    return b;
  }

  // ---------- main init / teardown ----------
  window.snPodiumInit = function(opts){
    if (!opts || !opts.liveStreamId || !opts.hostId) return;
    if (liveStreamId) window.snPodiumTeardown();
    liveStreamId = opts.liveStreamId;
    hostId = opts.hostId;
    hostChannel = hostId; // by convention AGORA_CHANNEL = host_id
    iAmHost = window.currentUser && window.currentUser.id === hostId;

    if (iAmHost) {
      ensureHostBtn().classList.add('visible');
    } else {
      ensureRequestBtn().classList.add('visible');
    }
    ensureLeaveBtn();

    subscribeRealtime();
    refreshSeatsFromDB();
  };

  window.snPodiumTeardown = function(){
    if (podiumChannel) try{podiumChannel.unsubscribe();}catch(e){}
    podiumChannel = null;
    if (myGuestRole === 'active') leaveAsGuest(); // best effort
    seatsCache = {};
    profileCache = {};
    var els = ['spReqBtn','spHostBtn','spLeaveBtn','spModal'];
    els.forEach(function(id){var el=document.getElementById(id); if(el) el.remove();});
    document.body.classList.remove('sp-podium-active');
    Object.keys(subVideoEls).forEach(function(uid){
      try{ subVideoEls[uid].remove(); }catch(e){}
    });
    subVideoEls = {};
    subAudioPlayers = {};
    teardownGuestPublisher();
    teardownHostSubscriber();
    liveStreamId = hostId = hostChannel = null;
    iAmHost = false;
    mySeatId = null; myGuestRole = null;
  };

  // ---------- supabase realtime ----------
  function subscribeRealtime(){
    if (podiumChannel) try{podiumChannel.unsubscribe();}catch(e){}
    podiumChannel = window.sb.channel('podium-' + liveStreamId);
    podiumChannel.on('postgres_changes', {
      event: '*', schema: 'public', table: 'live_podium_seats',
      filter: 'live_stream_id=eq.' + liveStreamId
    }, function(payload){
      onSeatChange(payload);
    }).subscribe();
  }

  function onSeatChange(payload){
    var row = payload.new || payload.old;
    if (!row) return;
    if (payload.eventType === 'DELETE') {
      delete seatsCache[row.id];
    } else {
      seatsCache[row.id] = row;
    }
    handleMySeatChange(row, payload.eventType);
    fetchProfile(row.user_id, function(){
      if (iAmHost) updateHostBadge();
      renderGrid();
    });
  }

  function handleMySeatChange(row, ev){
    if (!window.currentUser || row.user_id !== window.currentUser.id) return;
    if (ev === 'DELETE') { mySeatId = null; myGuestRole = null; return; }
    mySeatId = row.id;
    var prevRole = myGuestRole;
    if (row.status === 'active') {
      myGuestRole = 'active';
      if (prevRole !== 'active') startGuestPublishing();
    } else if (row.status === 'pending') {
      myGuestRole = 'pending';
      var b = document.getElementById('spReqBtn');
      if (b) { b.classList.add('pending'); b.classList.remove('active'); b.innerHTML = '\u23F3 Pendiente...'; }
    } else {
      // ejected, rejected, left
      myGuestRole = null;
      if (prevRole === 'active') {
        teardownGuestPublisher();
        var leaveBtn = document.getElementById('spLeaveBtn');
        if (leaveBtn) leaveBtn.classList.remove('visible');
      }
      var rb = document.getElementById('spReqBtn');
      if (rb && !iAmHost) { 
        rb.classList.remove('pending','active'); 
        rb.innerHTML = '\u{1F46B} Pedir entrar'; 
      }
    }
  }

  async function refreshSeatsFromDB(){
    var r = await window.sb.from('live_podium_seats')
      .select('id,user_id,status,position,joined_at,requested_at')
      .eq('live_stream_id', liveStreamId)
      .in('status', ['pending','active']);
    if (r.error) return;
    seatsCache = {};
    (r.data || []).forEach(function(row){ seatsCache[row.id] = row; });
    var myRow = (r.data||[]).find(function(s){ return window.currentUser && s.user_id === window.currentUser.id; });
    if (myRow) handleMySeatChange(myRow, 'INSERT');
    var userIds = (r.data||[]).map(function(s){ return s.user_id; });
    if (userIds.length) await prefetchProfiles(userIds);
    if (iAmHost) updateHostBadge();
    renderGrid();
  }

  async function prefetchProfiles(userIds){
    var missing = userIds.filter(function(id){ return !profileCache[id]; });
    if (!missing.length) return;
    var r = await window.sb.from('profiles').select('id,username,avatar_url').in('id', missing);
    (r.data || []).forEach(function(p){ profileCache[p.id] = p; });
  }
  function fetchProfile(userId, cb){
    if (profileCache[userId]) { cb && cb(); return; }
    window.sb.from('profiles').select('id,username,avatar_url').eq('id', userId).single().then(function(r){
      if (r.data) profileCache[userId] = r.data;
      cb && cb();
    });
  }

  // ---------- viewer: request a seat ----------
  window.snPodiumRequest = async function(){
    if (!liveStreamId || iAmHost) return;
    if (myGuestRole === 'pending') { return; }
    if (myGuestRole === 'active') { return; }
    var r = await window.sb.rpc('request_podium_seat', { p_live_stream_id: liveStreamId });
    if (r.error || !r.data || !r.data.ok) {
      var msg = (r.data && r.data.error) || (r.error && r.error.message) || 'error';
      alert('No se pudo solicitar: ' + msg);
      return;
    }
    // Realtime will flip the button state via onSeatChange.
  };

  // ---------- host: panel ----------
  window.snPodiumOpenPanel = function(){
    if (!iAmHost) return;
    pendingPanelOpen = true;
    renderPanel();
  };

  function updateHostBadge(){
    var n = Object.values(seatsCache).filter(function(s){ return s.status === 'pending'; }).length;
    var b = document.getElementById('spBadge');
    if (b) b.textContent = String(n);
  }

  function renderPanel(){
    var existing = document.getElementById('spModal');
    if (existing) existing.remove();
    var modal = document.createElement('div');
    modal.id = 'spModal';
    modal.className = 'sp-modal open';
    var html = '<div class="sp-box">';
    html += '<div class="sp-title">\u{1F46B} PODIO &middot; SOLICITUDES Y INVITADOS</div>';
    var seats = Object.values(seatsCache);
    var pending = seats.filter(function(s){return s.status==='pending';});
    var active = seats.filter(function(s){return s.status==='active';});
    if (pending.length === 0 && active.length === 0) {
      html += '<div class="sp-empty">Sin solicitudes ni invitados activos.<br><br>Los viewers veran el bot&oacute;n &laquo;Pedir entrar&raquo;.</div>';
    } else {
      if (pending.length > 0) {
        html += '<div style="font-size:11px;color:#5a8aaa;margin:4px 0 8px;letter-spacing:.06em">PENDIENTES (' + pending.length + ')</div>';
        html += '<div class="sp-list">';
        pending.forEach(function(s){
          var p = profileCache[s.user_id] || {};
          html += '<div class="sp-item" data-id="'+s.id+'">';
          html += '<div class="sp-item-av">'+av(p)+'</div>';
          html += '<div class="sp-item-name">@'+esc(p.username||'user')+'</div>';
          html += '<div class="sp-actions">';
          html += '<button class="sp-btn-ok" onclick="window.__spApprove(\''+s.id+'\')">Aceptar</button>';
          html += '<button class="sp-btn-no" onclick="window.__spReject(\''+s.id+'\')">Rechazar</button>';
          html += '</div></div>';
        });
        html += '</div>';
      }
      if (active.length > 0) {
        html += '<div style="font-size:11px;color:#5a8aaa;margin:14px 0 8px;letter-spacing:.06em">EN EL PODIO (' + active.length + '/12)</div>';
        html += '<div class="sp-list">';
        active.forEach(function(s){
          var p = profileCache[s.user_id] || {};
          html += '<div class="sp-item" data-id="'+s.id+'">';
          html += '<div class="sp-item-av">'+av(p)+'</div>';
          html += '<div class="sp-item-name">@'+esc(p.username||'user')+'</div>';
          html += '<button class="sp-btn-eject" onclick="window.__spEject(\''+s.id+'\')">Expulsar</button>';
          html += '</div>';
        });
        html += '</div>';
      }
    }
    html += '<button class="sp-close" onclick="document.getElementById(\'spModal\').remove()">Cerrar</button>';
    html += '</div>';
    modal.innerHTML = html;
    document.body.appendChild(modal);
  }

  window.__spApprove = async function(seatId){
    var r = await window.sb.rpc('approve_podium_seat', { p_seat_id: seatId });
    if (r.error || !r.data || !r.data.ok) alert('Error: ' + ((r.data&&r.data.error)||r.error&&r.error.message));
    setTimeout(renderPanel, 200);
  };
  window.__spReject = async function(seatId){
    await window.sb.rpc('reject_podium_seat', { p_seat_id: seatId });
    setTimeout(renderPanel, 200);
  };
  window.__spEject = async function(seatId){
    if (!confirm('\u00bfExpulsar a este invitado del podio?')) return;
    await window.sb.rpc('eject_podium_seat', { p_seat_id: seatId });
    setTimeout(renderPanel, 200);
  };

  // ---------- guest: publishing ----------
  async function startGuestPublishing(){
    if (guestClient) return;
    try {
      // Get token for host's channel as 'host' role (i.e. PUBLISHER)
      var sess = await window.sb.auth.getSession();
      var tok = sess.data && sess.data.session && sess.data.session.access_token;
      // Note: agora-token requires uid === authUser.id when role=host.
      var resp = await fetch('https://cdokplvoqivducsqrejt.supabase.co/functions/v1/agora-token', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},
        body: JSON.stringify({channel: hostChannel, uid: window.currentUser.id, role:'guest', numericUid: uidForGuest(window.currentUser.id)})
      });
      var d = await resp.json();
      if (!d.token || !d.appId) { console.warn('[podium] no token', d); alert('Error obteniendo token: ' + (d.error||'unknown')); return; }

      guestClient = window.AgoraRTC.createClient({mode:'live', codec:'vp8'});
      await guestClient.setClientRole('host');
      guestClient.on('user-published', onRemotePublishedAsGuest);
      guestClient.on('user-unpublished', onRemoteUnpublished);
      guestClient.on('user-left', onRemoteLeft);

      guestVideoTrack = await window.AgoraRTC.createCameraVideoTrack({encoderConfig:{width:480,height:640,frameRate:24,bitrateMin:300,bitrateMax:1000}});
      guestAudioTrack = await window.AgoraRTC.createMicrophoneAudioTrack({encoderConfig:'speech_standard'});

      await guestClient.join(d.appId, hostChannel, d.token, uidForGuest(window.currentUser.id));
      await guestClient.publish([guestVideoTrack, guestAudioTrack]);
      
      // CRITICAL: leave the audience agoraClient to avoid 2 clients in same channel.
      try {
        if (window.agoraClient && !iAmHost) {
          await window.agoraClient.leave();
        }
      } catch(e){ console.warn('[podium] failed to leave audience:', e); }

      var leaveBtn = document.getElementById('spLeaveBtn');
      if (leaveBtn) leaveBtn.classList.add('visible');

      // Re-render and then render the guest's OWN cell with their local track via bypass
      setTimeout(function(){
        renderGrid();
        setTimeout(function(){
          // Render my own video locally in my cell
          var myUid = uidForGuest(window.currentUser.id);
          var myCell = document.getElementById('sp-cell-vid-' + myUid);
          if (myCell && guestVideoTrack && guestVideoTrack.getMediaStreamTrack) {
            playTrackInContainer(guestVideoTrack, myCell, true /*muted local*/);
          }
        }, 300);
      }, 300);
    } catch(e) {
      console.error('[podium] guest publish error:', e);
      alert('Error al unirse al podio: ' + e.message);
    }
  }

  function teardownGuestPublisher(){
    try { if (guestVideoTrack) { guestVideoTrack.stop(); guestVideoTrack.close(); } } catch(e){}
    try { if (guestAudioTrack) { guestAudioTrack.stop(); guestAudioTrack.close(); } } catch(e){}
    try { if (guestClient) guestClient.leave(); } catch(e){}
    guestVideoTrack = null; guestAudioTrack = null; guestClient = null;
  }

  async function leaveAsGuest(){
    if (!liveStreamId || !window.currentUser) return;
    teardownGuestPublisher();
    // Re-join the audience client so the viewer can keep watching the live
    try {
      if (window.agoraClient && !iAmHost && hostChannel && window.AGORA_APP_ID) {
        var sess = await window.sb.auth.getSession();
        var tok = sess.data && sess.data.session && sess.data.session.access_token;
        var resp = await fetch('https://cdokplvoqivducsqrejt.supabase.co/functions/v1/agora-token', {
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},
          body: JSON.stringify({channel: hostChannel, uid: String(window.currentUser.id), role:'viewer'})
        });
        var d = await resp.json();
        if (d.token && d.appId) {
          await window.agoraClient.setClientRole('audience', {level:1});
          await window.agoraClient.join(d.appId, hostChannel, d.token, 0);
        }
      }
    } catch(e){ console.warn('[podium] re-join audience err:', e); }
    await window.sb.rpc('leave_podium_seat', { p_live_stream_id: liveStreamId });
    var b = document.getElementById('spLeaveBtn'); if (b) b.classList.remove('visible');
  }

  // ---------- host: subscribe to all guests in own channel ----------
  // The host's main agoraClient is already on hostChannel. We attach extra
  // listeners (without recreating it) to react to guest publishes.
  function attachHostSubscribers(){
    if (!window.agoraClient) { setTimeout(attachHostSubscribers, 800); return; }
    if (window.agoraClient.__snPodiumAttached) return;
    window.agoraClient.__snPodiumAttached = true;
    window.agoraClient.on('user-published', onRemotePublishedAsHost);
    window.agoraClient.on('user-unpublished', onRemoteUnpublished);
    window.agoraClient.on('user-left', onRemoteLeft);
  }

  async function onRemotePublishedAsHost(user, mediaType){
    try {
      await window.agoraClient.subscribe(user, mediaType);
      handleSubscribed(user, mediaType);
    } catch(e) { console.warn('[podium] host subscribe err:', e); }
  }
  async function onRemotePublishedAsGuest(user, mediaType){
    try {
      await guestClient.subscribe(user, mediaType);
      handleSubscribed(user, mediaType);
    } catch(e) { console.warn('[podium] guest subscribe err:', e); }
  }
  function handleSubscribed(user, mediaType){
    if (mediaType === 'video') {
      renderGrid();
      // Render after grid creates the cell - use bypass for reliability
      setTimeout(function(){
        var el = document.getElementById('sp-cell-vid-' + user.uid);
        if (el && user.videoTrack && user.videoTrack.getMediaStreamTrack) {
          playTrackInContainer(user.videoTrack, el, false);
        } else if (el && user.videoTrack && user.videoTrack.play) {
          try { user.videoTrack.play(el); } catch(e){}
        }
      }, 250);
    } else if (mediaType === 'audio') {
      try { user.audioTrack.play(); } catch(e){}
      subAudioPlayers[user.uid] = user.audioTrack;
    }
  }
  function onRemoteUnpublished(user, mediaType){
    if (mediaType === 'audio' && subAudioPlayers[user.uid]) {
      try{subAudioPlayers[user.uid].stop();}catch(e){}
      delete subAudioPlayers[user.uid];
    }
  }
  function onRemoteLeft(user){
    delete subAudioPlayers[user.uid];
    renderGrid();
  }

  // ---------- grid layout ----------
  // Total slots used = host (1) + active guests (N). Layout chosen by N+1.
  function gridFor(total){
    if (total <= 1) return {cols:1, rows:1};
    if (total === 2) return {cols:2, rows:1};
    if (total <= 4) return {cols:2, rows:2};
    if (total <= 6) return {cols:3, rows:2};
    if (total <= 9) return {cols:3, rows:3};
    if (total <= 12) return {cols:4, rows:3};
    return {cols:4, rows:4}; // 13
  }

  function renderGrid(){
    var active = Object.values(seatsCache).filter(function(s){return s.status==='active';});
    var total = 1 + active.length;

    var wrap = document.querySelector('.live-video-wrap');
    if (!wrap) return;

    // Remove any prior podium cells
    Array.prototype.slice.call(wrap.querySelectorAll('.sp-cell')).forEach(function(c){c.remove();});

    if (total <= 1) {
      // Solo host: revert to original layout
      document.body.classList.remove('sp-podium-active');
      var liveVid = document.getElementById('liveVideo');
      if (liveVid) {
        liveVid.style.position = ''; liveVid.style.left=''; liveVid.style.top='';
        liveVid.style.width=''; liveVid.style.height='';
        liveVid.style.display = '';
        // Re-play the track back into the original #liveVideo via srcObject bypass
        setTimeout(function(){
          try {
            var lv2 = document.getElementById('liveVideo');
            if (!lv2) return;
            if (iAmHost) {
              var t = window.localVideoTrack;
              if (!t) {
                var lt = (window.agoraClient && window.agoraClient.localTracks) || [];
                t = lt.find && lt.find(function(x){ return x.trackMediaType === 'video'; });
              }
              if (t && t.getMediaStreamTrack) {
                lv2.srcObject = new MediaStream([t.getMediaStreamTrack()]);
                lv2.muted = true; lv2.play().catch(function(){});
              }
            } else {
              var clientRef = (myGuestRole === 'active' && guestClient) ? guestClient : window.agoraClient;
              var rs = (clientRef && clientRef.remoteUsers) || [];
              var hr = rs.find && rs.find(function(u){ return u.videoTrack; });
              if (hr && hr.videoTrack && hr.videoTrack.getMediaStreamTrack) {
                lv2.srcObject = new MediaStream([hr.videoTrack.getMediaStreamTrack()]);
                lv2.play().catch(function(){});
              }
            }
          } catch(e){ console.warn('[podium] restore replay err:', e); }
        }, 250);
      }
      wrap.style.gridTemplateColumns = '';
      wrap.style.gridTemplateRows = '';
      wrap.style.display = '';
      return;
    }

    document.body.classList.add('sp-podium-active');
    var g = gridFor(total);
    wrap.style.display = 'grid';
    wrap.style.gridTemplateColumns = 'repeat('+g.cols+', 1fr)';
    wrap.style.gridTemplateRows = 'repeat('+g.rows+', 1fr)';

    // Host cell: do NOT move #liveVideo (breaks Agora track binding).
    // Instead, create a new container, hide #liveVideo, and re-play the local/remote track.
    var hostCell = document.createElement('div');
    hostCell.className = 'sp-cell';
    hostCell.id = 'sp-cell-host';
    var hostName = (iAmHost ? (window.currentProfile && window.currentProfile.username) : (profileCache[hostId] && profileCache[hostId].username)) || 'host';
    var hostVidDiv = document.createElement('div');
    hostVidDiv.id = 'sp-cell-vid-host';
    hostVidDiv.style.cssText = 'width:100%;height:100%;background:#000';
    hostCell.appendChild(hostVidDiv);
    var hostBadge = document.createElement('div');
    hostBadge.className = 'sp-cell-host';
    hostBadge.textContent = 'HOST';
    hostCell.appendChild(hostBadge);
    var hostNameEl = document.createElement('div');
    hostNameEl.className = 'sp-cell-name';
    hostNameEl.textContent = '@' + hostName;
    hostCell.appendChild(hostNameEl);
    wrap.appendChild(hostCell);
    // Hide original #liveVideo (don't remove, we'll restore it on teardown)
    var liveVid = document.getElementById('liveVideo');
    if (liveVid) liveVid.style.display = 'none';
    // Re-play the host's video track in the new container.
    // BYPASS: Agora's track.play() has a stale videoElement bug after multiple re-mounts.
    // We use the raw MediaStreamTrack and srcObject directly which always works.
    setTimeout(function(){
      try {
        if (iAmHost) {
          var lv = window.localVideoTrack;
          if (!lv) {
            var lt = (window.agoraClient && window.agoraClient.localTracks) || [];
            lv = lt.find && lt.find(function(t){ return t.trackMediaType === 'video'; });
          }
          if (lv && lv.getMediaStreamTrack) {
            playTrackInContainer(lv, hostVidDiv, true /*muted*/);
          } else { console.warn('[podium] no local video track'); }
        } else {
          var clientRef = (myGuestRole === 'active' && guestClient) ? guestClient : window.agoraClient;
          var rs = (clientRef && clientRef.remoteUsers) || [];
          var hr = rs.find && rs.find(function(u){ return u.videoTrack; });
          if (hr && hr.videoTrack && hr.videoTrack.getMediaStreamTrack) {
            playTrackInContainer(hr.videoTrack, hostVidDiv, false);
          } else if (hr && hr.videoTrack && hr.videoTrack.play) {
            try { hr.videoTrack.play(hostVidDiv); } catch(e) { console.warn('[podium] remote play err', e); }
          }
        }
      } catch(e){ console.warn('[podium] host replay err:', e); }
    }, 250);

    // Guest cells
    active.sort(function(a,b){ return (a.position||0) - (b.position||0); });
    active.forEach(function(s){
      var p = profileCache[s.user_id] || {username: 'guest'};
      var uid = uidForGuest(s.user_id);
      var cell = document.createElement('div');
      cell.className = 'sp-cell';
      cell.id = 'sp-cell-' + s.id;
      var html = '';
      if (iAmHost && s.user_id !== window.currentUser.id) {
        html += '<button class="sp-cell-eject" title="Expulsar" onclick="window.__spEject(\''+s.id+'\')">\u00d7</button>';
      }
      html += '<div id="sp-cell-vid-'+uid+'" style="width:100%;height:100%"></div>';
      html += '<div class="sp-cell-name">@'+esc(p.username||'guest')+'</div>';
      cell.innerHTML = html;
      wrap.appendChild(cell);
      subVideoEls[uid] = document.getElementById('sp-cell-vid-'+uid);

      // Try replay if track already present
      var clientRef = iAmHost ? window.agoraClient : guestClient;
      if (clientRef && clientRef.remoteUsers) {
        var ru = clientRef.remoteUsers.find(function(u){ return String(u.uid) === String(uid); });
        if (ru && ru.videoTrack) try { ru.videoTrack.play(subVideoEls[uid]); } catch(e){}
      }
    });
  }

  // Helper: render an Agora video track into a DOM container by bypassing
  // Agora's broken track.play() (stale videoElement bug after multiple re-mounts).
  // Uses raw MediaStreamTrack via srcObject which always works.
  function playTrackInContainer(agoraTrack, container, muted){
    if (!agoraTrack || !container) return;
    try {
      var mst = agoraTrack.getMediaStreamTrack();
      if (!mst) return;
      // Reuse existing video element if present, else create
      var v = container.querySelector('video.sp-bypass-video');
      if (!v) {
        v = document.createElement('video');
        v.className = 'sp-bypass-video';
        v.autoplay = true;
        v.playsInline = true;
        v.setAttribute('playsinline', '');
        v.setAttribute('webkit-playsinline', '');
        v.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
        container.innerHTML = '';
        container.appendChild(v);
      }
      v.muted = !!muted;
      v.srcObject = new MediaStream([mst]);
      v.play().catch(function(e){ console.warn('[podium] video.play() err:', e); });
    } catch(e){ console.warn('[podium] playTrackInContainer err:', e); }
  }

  // Map user_id (uuid) to a stable Agora UID. Server signs token with uid=0 (any),
  // and Agora assigns a numeric uid at join time. The mapping below is best-effort
  // and only used for rendering; the cell looks up by the actual remote user uid.
  function uidForGuest(userId){
    if (!userId) return 0;
    // Strip hyphens, take first 8 hex chars -> 32-bit unsigned
    var hex = String(userId).replace(/-/g, '').substring(0, 8);
    var n = parseInt(hex, 16);
    if (isNaN(n) || n <= 0) n = 1;
    if (n >= 4294967295) n = n % 4294967294 + 1;
    return n;
  }

  // ---------- attach host subscribers when ready ----------
  if (typeof window !== 'undefined') {
    setTimeout(attachHostSubscribers, 1500);
  }
  function teardownHostSubscriber(){
    if (window.agoraClient && window.agoraClient.__snPodiumAttached) {
      try { window.agoraClient.off('user-published', onRemotePublishedAsHost); } catch(e){}
      try { window.agoraClient.off('user-unpublished', onRemoteUnpublished); } catch(e){}
      try { window.agoraClient.off('user-left', onRemoteLeft); } catch(e){}
      window.agoraClient.__snPodiumAttached = false;
    }
  }
})();
