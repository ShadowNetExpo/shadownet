// live-battle.js v2 - Creator-vs-creator live battles with SPLIT-SCREEN dual camera
// Include with <script src="/live-battle.js" defer></script> in live.html
// Backend: live_battles table + send_battle_gift/end_battle RPCs
// v2: adds split-screen video (subscribe to opponent's Agora channel as audience)

(function(){
  'use strict';

  var STYLE = document.createElement('style');
  STYLE.textContent = ".lb-btn{position:absolute;top:12px;right:12px;z-index:99;background:linear-gradient(135deg,#ff2255,#aa0030);color:#fff;border:none;border-radius:20px;padding:7px 14px;font-family:Rajdhani,sans-serif;font-weight:800;font-size:12px;cursor:pointer;letter-spacing:.04em;display:none;align-items:center;gap:5px;box-shadow:0 2px 10px rgba(255,34,85,.4)}.lb-btn.visible{display:inline-flex}.lb-btn:hover{transform:scale(1.05)}.lb-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:10000;display:none;align-items:center;justify-content:center;padding:20px}.lb-modal.open{display:flex}.lb-box{background:#070f1e;border:1.5px solid #0d2744;border-radius:16px;width:100%;max-width:420px;max-height:85vh;overflow-y:auto;padding:22px}.lb-title{font-family:Orbitron,sans-serif;font-size:13px;color:#ff2255;letter-spacing:.1em;margin-bottom:14px}.lb-sub{font-size:12px;color:#5a8aaa;margin-bottom:14px;line-height:1.5}.lb-list{display:flex;flex-direction:column;gap:8px;margin-bottom:12px;max-height:260px;overflow-y:auto}.lb-item{display:flex;align-items:center;gap:10px;padding:10px;background:rgba(7,15,30,.6);border:1px solid #0d2744;border-radius:10px;cursor:pointer;transition:all .15s}.lb-item:hover{border-color:#ff2255;background:rgba(255,34,85,.06)}.lb-item.selected{border-color:#ff2255;background:rgba(255,34,85,.1)}.lb-av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#ff2255,#800011);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;overflow:hidden;flex-shrink:0}.lb-av img{width:100%;height:100%;object-fit:cover}.lb-nm{flex:1;font-family:Rajdhani,sans-serif;font-weight:700;color:#e8f4ff;font-size:14px}.lb-viewers{font-size:11px;color:#5a8aaa}.lb-duration{display:flex;gap:8px;margin-bottom:14px}.lb-dur-btn{flex:1;padding:8px;background:transparent;border:1px solid #0d2744;color:#5a8aaa;border-radius:8px;font-family:Rajdhani,sans-serif;font-weight:700;font-size:12px;cursor:pointer;text-transform:uppercase;letter-spacing:.06em}.lb-dur-btn.active{background:rgba(255,34,85,.12);border-color:#ff2255;color:#ff2255}.lb-btn-primary{width:100%;padding:12px;background:linear-gradient(135deg,#ff2255,#cc0030);color:#fff;border:none;border-radius:10px;font-family:Rajdhani,sans-serif;font-weight:800;font-size:14px;cursor:pointer;letter-spacing:.06em;text-transform:uppercase}.lb-btn-primary:disabled{opacity:.4;cursor:not-allowed}.lb-btn-cancel{width:100%;margin-top:8px;padding:9px;background:transparent;border:none;color:#5a8aaa;font-family:Rajdhani,sans-serif;font-weight:700;font-size:13px;cursor:pointer}.lb-empty{text-align:center;padding:30px 20px;color:#5a8aaa;font-size:13px}.lb-overlay{position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:98;background:rgba(7,15,30,.95);backdrop-filter:blur(12px);border:1.5px solid #ff2255;border-radius:16px;padding:10px 14px;display:none;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(255,34,85,.3);min-width:280px;max-width:90vw}.lb-overlay.visible{display:flex}.lb-side{flex:1;text-align:center}.lb-side-host{font-family:Rajdhani,sans-serif;font-weight:800;font-size:12px;color:#fff;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lb-side-gifts{font-family:Orbitron,sans-serif;font-size:18px;font-weight:900}.lb-side.a .lb-side-gifts{color:#00e5ff}.lb-side.b .lb-side-gifts{color:#ff2255}.lb-vs{font-family:Orbitron,sans-serif;font-weight:900;font-size:14px;color:#ffd700;padding:0 8px}.lb-timer{font-family:Orbitron,sans-serif;font-size:14px;color:#fff;background:rgba(255,34,85,.15);border:1px solid rgba(255,34,85,.3);padding:3px 8px;border-radius:8px;min-width:50px;text-align:center}.lb-timer.urgent{color:#ff2255;animation:lbPulse 1s infinite}@keyframes lbPulse{0%,100%{opacity:1}50%{opacity:.5}}.lb-winner{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:10001;display:none;align-items:center;justify-content:center}.lb-winner.open{display:flex}.lb-winner-box{text-align:center}.lb-winner-crown{font-size:64px;margin-bottom:12px}.lb-winner-title{font-family:Orbitron,sans-serif;font-size:32px;font-weight:900;color:#ffd700;margin-bottom:8px;letter-spacing:.08em}.lb-winner-name{font-family:Rajdhani,sans-serif;font-size:18px;color:#fff;margin-bottom:4px}.lb-winner-score{font-family:Rajdhani,sans-serif;font-size:14px;color:#5a8aaa}.lb-invite{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;background:#070f1e;border:2px solid #ff2255;border-radius:20px;padding:24px;max-width:360px;width:90%;text-align:center;display:none;box-shadow:0 10px 40px rgba(255,34,85,.4)}.lb-invite.open{display:block}.lb-invite-title{font-family:Orbitron,sans-serif;font-size:14px;color:#ff2255;letter-spacing:.12em;margin-bottom:14px}.lb-invite-avatar{width:80px;height:80px;border-radius:50%;margin:0 auto 12px;background:linear-gradient(135deg,#ff2255,#800011);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:32px;overflow:hidden;border:3px solid #ff2255}.lb-invite-avatar img{width:100%;height:100%;object-fit:cover}.lb-invite-name{font-family:Rajdhani,sans-serif;font-weight:800;font-size:18px;color:#fff;margin-bottom:4px}.lb-invite-msg{font-size:13px;color:#5a8aaa;margin-bottom:18px;line-height:1.5}.lb-invite-actions{display:flex;gap:10px}.lb-invite-accept{flex:1;padding:12px;background:linear-gradient(135deg,#00c853,#388e3c);color:#000;border:none;border-radius:10px;font-family:Rajdhani,sans-serif;font-weight:900;font-size:13px;cursor:pointer;letter-spacing:.06em;text-transform:uppercase}.lb-invite-decline{flex:1;padding:12px;background:transparent;color:#ff5555;border:1px solid rgba(255,50,50,.3);border-radius:10px;font-family:Rajdhani,sans-serif;font-weight:800;font-size:13px;cursor:pointer;letter-spacing:.06em;text-transform:uppercase}body.lb-split-active .live-video-wrap #liveVideo{position:absolute!important;left:0!important;top:0!important;width:50%!important;height:100%!important;object-fit:cover!important;z-index:1!important}.lb-opp-wrap{position:absolute;right:0;top:0;width:50%;height:100%;background:#000;z-index:2;overflow:hidden}.lb-opp-wrap video{width:100%!important;height:100%!important;object-fit:cover!important}.lb-split-divider{position:absolute;left:50%;top:0;width:2px;height:100%;background:linear-gradient(180deg,#00e5ff 0%,#ffd700 50%,#ff2255 100%);z-index:3;transform:translateX(-1px);box-shadow:0 0 12px rgba(255,215,0,.6);pointer-events:none}.lb-side-label{position:absolute;top:72px;padding:5px 12px;font-size:11px;font-weight:900;border-radius:14px;z-index:4;backdrop-filter:blur(10px);letter-spacing:.04em;font-family:Rajdhani,sans-serif;pointer-events:none;max-width:44%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lb-side-label.self{left:12px;background:rgba(0,229,255,.18);color:#00e5ff;border:1px solid rgba(0,229,255,.35)}.lb-side-label.opp{right:12px;background:rgba(255,34,85,.18);color:#ff2255;border:1px solid rgba(255,34,85,.35)}.lb-opp-loading{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#5a8aaa;font-size:12px;font-family:Rajdhani,sans-serif;font-weight:700;z-index:1}.lb-opp-loading-spinner{width:30px;height:30px;border:3px solid rgba(255,34,85,.2);border-top-color:#ff2255;border-radius:50%;animation:lbSpin .8s linear infinite}@keyframes lbSpin{to{transform:rotate(360deg)}}.lb-end-btn{width:24px;height:24px;border-radius:50%;background:rgba(255,34,85,.25);border:1px solid rgba(255,34,85,.6);color:#ff2255;font-size:16px;font-weight:900;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center;padding:0;font-family:Rajdhani,sans-serif;transition:all .15s;margin-left:4px}.lb-end-btn:hover{background:rgba(255,34,85,.5);color:#fff;transform:scale(1.1)}";
  document.head.appendChild(STYLE);

  var isHost = false, currentStreamChannel = null, activeBattle = null;
  var battleChannel = null, selectedOpponent = null, selectedDuration = 5;
  var inviteChannel = null, battleTimerInterval = null;
  var splitScreenClient = null;

  var SB_URL = 'https://cdokplvoqivducsqrejt.supabase.co';
  var SB_ANON = 'sb_publishable_9M1y678W_KFlnk1uUcrgIg_93A-62su';

  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}

  function getStreamContext(){
    var params = new URLSearchParams(location.search);
    var mode = params.get('mode') || 'host';
    var hostId = params.get('host') || (window.currentUser && window.currentUser.id);
    var channel = params.get('ch') || hostId;
    isHost = (mode === 'host' || (window.currentUser && window.currentUser.id === hostId));
    currentStreamChannel = channel;
    return { isHost: isHost, hostId: hostId, channel: channel };
  }

  function injectBattleButton(){
    if (document.getElementById('lbBattleBtn')) return;
    var btn = document.createElement('button');
    btn.id = 'lbBattleBtn';
    btn.className = 'lb-btn';
    btn.innerHTML = '\u2694\uFE0F Battle';
    btn.onclick = openBattleModal;
    var container = document.querySelector('.live-container') || document.querySelector('.live-topbar') || document.body;
    container.appendChild(btn);
    if (isHost) btn.classList.add('visible');
  }

  function buildModal(){
    if (document.getElementById('lbModal')) return;
    var modal = document.createElement('div');
    modal.id = 'lbModal';
    modal.className = 'lb-modal';
    var html = '<div class="lb-box">';
    html += '<div class="lb-title">\u2694\uFE0F INICIAR BATTLE</div>';
    html += '<div class="lb-sub">Reta a otro creator en vivo. Los fans eligen al ganador con regalos. Durante el battle las c\u00e1maras se parten en dos.</div>';
    html += '<div class="lb-sub" style="color:#5a8aaa;text-transform:uppercase;font-size:11px;letter-spacing:.06em">Duracion:</div>';
    html += '<div class="lb-duration">';
    html += '<button class="lb-dur-btn" data-min="3">3 min</button>';
    html += '<button class="lb-dur-btn active" data-min="5">5 min</button>';
    html += '<button class="lb-dur-btn" data-min="10">10 min</button>';
    html += '</div>';
    html += '<div class="lb-sub" style="color:#5a8aaa;text-transform:uppercase;font-size:11px;letter-spacing:.06em">Creators en vivo ahora:</div>';
    html += '<div class="lb-list" id="lbOpponentList"><div class="lb-empty">Cargando...</div></div>';
    html += '<button class="lb-btn-primary" id="lbStartBtn" disabled>Seleccionar oponente</button>';
    html += '<button class="lb-btn-cancel" onclick="window.__lbClose()">Cancelar</button>';
    html += '</div>';
    modal.innerHTML = html;
    document.body.appendChild(modal);
    modal.querySelectorAll('.lb-dur-btn').forEach(function(b){
      b.onclick = function(){
        modal.querySelectorAll('.lb-dur-btn').forEach(function(x){x.classList.remove('active');});
        b.classList.add('active');
        selectedDuration = parseInt(b.dataset.min);
      };
    });
    document.getElementById('lbStartBtn').onclick = startBattle;
  }

  window.__lbClose = function(){
    var m = document.getElementById('lbModal');
    if (m) m.classList.remove('open');
  };

  async function openBattleModal(){
    buildModal();
    document.getElementById('lbModal').classList.add('open');
    selectedOpponent = null;
    document.getElementById('lbStartBtn').disabled = true;
    document.getElementById('lbStartBtn').textContent = 'Seleccionar oponente';
    var listEl = document.getElementById('lbOpponentList');
    listEl.innerHTML = '<div class="lb-empty">Cargando...</div>';
    var myId = window.currentUser && window.currentUser.id;
    var r = await window.sb.from('live_streams').select('id,host_id,title,viewer_count,agora_channel').eq('is_active', true).neq('host_id', myId).limit(20);
    if (r.error || !r.data || !r.data.length) {
      listEl.innerHTML = '<div class="lb-empty">No hay otros creators en vivo ahora</div>';
      return;
    }
    var hostIds = r.data.map(function(s){return s.host_id;});
    var pr = await window.sb.from('profiles').select('id,username,avatar_url').in('id', hostIds);
    var pm = {};
    (pr.data||[]).forEach(function(p){ pm[p.id] = p; });
    listEl.innerHTML = '';
    r.data.forEach(function(stream){
      var p = pm[stream.host_id] || { username: '?' };
      var row = document.createElement('div');
      row.className = 'lb-item';
      row.dataset.hostId = stream.host_id;
      row.dataset.channel = stream.agora_channel || stream.host_id;
      row.dataset.username = p.username;
      var avHtml = p.avatar_url ? '<img src="' + esc(p.avatar_url) + '" alt="">' : esc((p.username||'?').charAt(0).toUpperCase());
      row.innerHTML = '<div class="lb-av">' + avHtml + '</div><div class="lb-nm">@' + esc(p.username) + '</div><div class="lb-viewers">\uD83D\uDC41 ' + (stream.viewer_count||0) + '</div>';
      row.onclick = function(){
        listEl.querySelectorAll('.lb-item').forEach(function(x){x.classList.remove('selected');});
        row.classList.add('selected');
        selectedOpponent = { host_id: row.dataset.hostId, username: row.dataset.username, channel: row.dataset.channel };
        document.getElementById('lbStartBtn').disabled = false;
        document.getElementById('lbStartBtn').textContent = 'Retar a @' + p.username;
      };
      listEl.appendChild(row);
    });
  }

  async function startBattle(){
    if (!selectedOpponent) return;
    var btn = document.getElementById('lbStartBtn');
    btn.disabled = true;
    btn.textContent = 'Enviando invitacion...';
    var ins = await window.sb.from('live_battles').insert({
      stream_a_id: currentStreamChannel,
      stream_b_id: selectedOpponent.channel,
      host_a: window.currentUser.id,
      host_b: selectedOpponent.host_id,
      gifts_a: 0, gifts_b: 0,
      status: 'pending',
      duration_minutes: selectedDuration
    }).select().single();
    if (ins.error){
      btn.disabled = false;
      btn.textContent = 'Error: ' + ins.error.message;
      return;
    }
    var ch = window.sb.channel('battle-invite-' + selectedOpponent.host_id);
    await ch.subscribe();
    ch.send({ type: 'broadcast', event: 'battle_invite', payload: {
      battle_id: ins.data.id,
      from_host: window.currentUser.id,
      from_username: (window.currentProfile && window.currentProfile.username) || 'Alguien',
      from_avatar: (window.currentProfile && window.currentProfile.avatar_url) || null,
      duration: selectedDuration
    }});
    await window.sb.from('notifications').insert({
      user_id: selectedOpponent.host_id,
      from_user_id: window.currentUser.id,
      type: 'battle_invite',
      title: 'Te retaron a un battle!',
      message: '@' + ((window.currentProfile && window.currentProfile.username) || '') + ' quiere batallar',
      data: { battle_id: ins.data.id }
    });
    window.__lbClose();
    waitForAcceptance(ins.data.id);
  }

  function waitForAcceptance(battleId){
    var ch = window.sb.channel('battle-response-' + battleId);
    ch.on('broadcast', { event: 'battle_response' }, function(payload){
      var p = payload.payload || {};
      if (p.accepted){
        try{ch.unsubscribe();}catch(e){}
        startActiveBattle(battleId);
      } else {
        try{ch.unsubscribe();}catch(e){}
        alert('Invitacion rechazada por el oponente');
      }
    }).subscribe();
    setTimeout(function(){ try{ch.unsubscribe();}catch(e){} }, 30000);
  }

  function listenForInvites(){
    if (inviteChannel) return;
    if (!window.currentUser) return;
    inviteChannel = window.sb.channel('battle-invite-' + window.currentUser.id);
    inviteChannel.on('broadcast', { event: 'battle_invite' }, function(payload){
      showIncomingInvite(payload.payload || {});
    }).subscribe();
  }

  function showIncomingInvite(p){
    var existing = document.getElementById('lbInvite');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = 'lbInvite';
    el.className = 'lb-invite open';
    var avHtml = p.from_avatar ? '<img src="' + esc(p.from_avatar) + '" alt="">' : esc((p.from_username||'?').charAt(0).toUpperCase());
    var html = '<div class="lb-invite-title">\u2694\uFE0F BATTLE CHALLENGE</div>';
    html += '<div class="lb-invite-avatar">' + avHtml + '</div>';
    html += '<div class="lb-invite-name">@' + esc(p.from_username) + '</div>';
    html += '<div class="lb-invite-msg">Te reta a un battle de <b>' + p.duration + ' minutos</b>.<br>Las camaras se parten en 2. Los fans deciden el ganador con regalos.</div>';
    html += '<div class="lb-invite-actions">';
    html += '<button class="lb-invite-decline" id="lbDeclineBtn">Rechazar</button>';
    html += '<button class="lb-invite-accept" id="lbAcceptBtn">ACEPTAR</button>';
    html += '</div>';
    el.innerHTML = html;
    document.body.appendChild(el);
    document.getElementById('lbAcceptBtn').onclick = function(){ respondInvite(p, true); };
    document.getElementById('lbDeclineBtn').onclick = function(){ respondInvite(p, false); };
  }

  async function respondInvite(p, accepted){
    var el = document.getElementById('lbInvite');
    if (el) el.remove();
    if (accepted){
      await window.sb.from('live_battles').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', p.battle_id);
    } else {
      await window.sb.from('live_battles').update({ status: 'declined' }).eq('id', p.battle_id);
    }
    var ch = window.sb.channel('battle-response-' + p.battle_id);
    await ch.subscribe();
    ch.send({ type: 'broadcast', event: 'battle_response', payload: { accepted: accepted, from: window.currentUser.id } });
    setTimeout(function(){ try{ch.unsubscribe();}catch(e){} }, 2000);
    if (accepted){ startActiveBattle(p.battle_id); }
  }

  async function startActiveBattle(battleId){
    var r = await window.sb.from('live_battles').select('*').eq('id', battleId).single();
    if (r.error || !r.data) return;
    activeBattle = r.data;
    var pr = await window.sb.from('profiles').select('id,username,avatar_url').in('id', [activeBattle.host_a, activeBattle.host_b]);
    var pm = {};
    (pr.data||[]).forEach(function(p){ pm[p.id] = p; });
    activeBattle.profile_a = pm[activeBattle.host_a] || {};
    activeBattle.profile_b = pm[activeBattle.host_b] || {};
    buildOverlay();
    subscribeBattleRealtime();
    startCountdown();
    enableSplitScreen();
  }

  function buildOverlay(){
    var existing = document.getElementById('lbOverlay');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = 'lbOverlay';
    el.className = 'lb-overlay visible';
    var myId = window.currentUser && window.currentUser.id;
    var iAmHost = myId === activeBattle.host_a || myId === activeBattle.host_b;
    var html = '<div class="lb-side a"><div class="lb-side-host">@' + esc(activeBattle.profile_a.username||'a') + '</div>';
    html += '<div class="lb-side-gifts" id="lbGiftsA">' + (activeBattle.gifts_a||0) + '</div></div>';
    html += '<div class="lb-vs">VS</div>';
    html += '<div class="lb-timer" id="lbTimer">--:--</div>';
    if (iAmHost) {
      html += '<button class="lb-end-btn" id="lbEndBtn" title="Terminar batalla">\u00d7</button>';
    }
    html += '<div class="lb-vs">VS</div>';
    html += '<div class="lb-side b"><div class="lb-side-host">@' + esc(activeBattle.profile_b.username||'b') + '</div>';
    html += '<div class="lb-side-gifts" id="lbGiftsB">' + (activeBattle.gifts_b||0) + '</div></div>';
    el.innerHTML = html;
    document.body.appendChild(el);
    if (iAmHost) {
      var endBtn = document.getElementById('lbEndBtn');
      if (endBtn) endBtn.onclick = function(){
        if (confirm('\u00bfTerminar la batalla ahora?\nEl ganador se calcula con los almas actuales.')) {
          endBattleNow();
        }
      };
    }
  }

  function subscribeBattleRealtime(){
    if (battleChannel) try{battleChannel.unsubscribe();}catch(e){}
    battleChannel = window.sb.channel('battle-row-' + activeBattle.id);
    battleChannel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_battles', filter: 'id=eq.' + activeBattle.id }, function(payload){
      var row = payload.new;
      if (!row) return;
      activeBattle.gifts_a = row.gifts_a;
      activeBattle.gifts_b = row.gifts_b;
      var aEl = document.getElementById('lbGiftsA'); if (aEl) aEl.textContent = row.gifts_a||0;
      var bEl = document.getElementById('lbGiftsB'); if (bEl) bEl.textContent = row.gifts_b||0;
      if (row.status === 'ended'){ handleEnded(row); }
    }).subscribe();
  }

  function startCountdown(){
    if (battleTimerInterval) clearInterval(battleTimerInterval);
    var startedAt = new Date(activeBattle.started_at).getTime();
    var durMs = (activeBattle.duration_minutes||5) * 60 * 1000;
    var endsAt = startedAt + durMs;
    function tick(){
      var remaining = endsAt - Date.now();
      var timerEl = document.getElementById('lbTimer');
      if (!timerEl) return;
      if (remaining <= 0){
        timerEl.textContent = '00:00';
        clearInterval(battleTimerInterval);
        if (window.currentUser && window.currentUser.id === activeBattle.host_a){ endBattleNow(); }
        return;
      }
      var mm = Math.floor(remaining/60000);
      var ss = Math.floor((remaining%60000)/1000);
      timerEl.textContent = String(mm).padStart(2,'0') + ':' + String(ss).padStart(2,'0');
      if (remaining < 30000) timerEl.classList.add('urgent');
    }
    tick();
    battleTimerInterval = setInterval(tick, 1000);
  }

  async function endBattleNow(){
    if (!activeBattle) return;
    await window.sb.rpc('end_battle', { p_battle_id: activeBattle.id });
  }

  function handleEnded(row){
    if (battleTimerInterval) clearInterval(battleTimerInterval);
    if (battleChannel) try{battleChannel.unsubscribe();}catch(e){}
    restoreSplitScreen();
    var overlay = document.getElementById('lbOverlay');
    if (overlay) overlay.remove();
    showWinner(row);
    activeBattle = null;
  }

  function showWinner(row){
    var winnerId = row.winner_id;
    var isDraw = !winnerId;
    var winnerProfile = winnerId === activeBattle.host_a ? activeBattle.profile_a : winnerId === activeBattle.host_b ? activeBattle.profile_b : null;
    var el = document.createElement('div');
    el.className = 'lb-winner open';
    var html = '<div class="lb-winner-box">';
    html += '<div class="lb-winner-crown">' + (isDraw ? '\uD83E\uDD1D' : '\uD83D\uDC51') + '</div>';
    html += '<div class="lb-winner-title">' + (isDraw ? 'EMPATE' : 'GANADOR') + '</div>';
    if (winnerProfile) html += '<div class="lb-winner-name">@' + esc(winnerProfile.username) + '</div>';
    html += '<div class="lb-winner-score">' + (row.gifts_a||0) + ' vs ' + (row.gifts_b||0) + ' almas</div>';
    html += '</div>';
    el.innerHTML = html;
    document.body.appendChild(el);
    setTimeout(function(){ el.remove(); }, 6000);
  }

  window.__lbOnGiftSent = async function(gifterHostId, amount){
    if (!activeBattle || activeBattle.status !== 'active') return;
    var side = null;
    if (gifterHostId === activeBattle.host_a) side = 'a';
    else if (gifterHostId === activeBattle.host_b) side = 'b';
    if (!side) return;
    await window.sb.rpc('send_battle_gift', { p_battle_id: activeBattle.id, p_side: side, p_amount: amount || 1 });
  };

  // ========== SPLIT-SCREEN (v2) ==========
  async function enableSplitScreen(){
    if (!activeBattle || !window.AgoraRTC) { console.warn('[lb] split-screen: no battle or AgoraRTC'); return; }
    try {
      var myId = window.currentUser.id;
      var isHostA = myId === activeBattle.host_a;
      var opponentChannel = isHostA ? activeBattle.stream_b_id : activeBattle.stream_a_id;
      if (!opponentChannel) { console.warn('[lb] split-screen: no opponent channel'); return; }

      applySplitScreenDOM(isHostA);

      var sess = await window.sb.auth.getSession();
      var tok = sess.data && sess.data.session ? sess.data.session.access_token : SB_ANON;

      var r = await fetch(SB_URL + '/functions/v1/agora-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SB_ANON,
          'Authorization': 'Bearer ' + tok
        },
        body: JSON.stringify({
          channel: opponentChannel,
          uid: String(myId) + '_battle',
          role: 'audience'
        })
      });
      var data = await r.json();
      if (!data.token || !data.appId) { console.error('[lb] split-screen token fail:', data); return; }

      splitScreenClient = window.AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      await splitScreenClient.setClientRole('audience');

      splitScreenClient.on('user-published', async function(user, mediaType){
        try {
          await splitScreenClient.subscribe(user, mediaType);
          if (mediaType === 'video') {
            var container = document.getElementById('lbOpponentVideo');
            if (container) {
              var loading = document.getElementById('lbOppLoading');
              if (loading) loading.remove();
              user.videoTrack.play(container);
            }
          }
          if (mediaType === 'audio') {
            user.audioTrack.play();
          }
        } catch (e) { console.error('[lb] subscribe error:', e); }
      });

      splitScreenClient.on('user-unpublished', function(user, mediaType){
        if (mediaType === 'video') {
          var c = document.getElementById('lbOpponentVideo');
          if (c && !document.getElementById('lbOppLoading')) {
            var l = document.createElement('div');
            l.id = 'lbOppLoading';
            l.className = 'lb-opp-loading';
            l.innerHTML = '<div class="lb-opp-loading-spinner"></div><div>Camara off</div>';
            c.appendChild(l);
          }
        }
      });

      await splitScreenClient.join(data.appId, opponentChannel, data.token, null);
      console.debug('[lb] split-screen joined ch=' + opponentChannel);
    } catch (e) {
      console.error('[lb] enableSplitScreen failed:', e);
      restoreSplitScreen();
    }
  }

  function applySplitScreenDOM(isHostA){
    var container = document.querySelector('.live-video-wrap');
    if (!container) return;
    document.body.classList.add('lb-split-active');

    var oppWrap = document.createElement('div');
    oppWrap.id = 'lbOpponentVideo';
    oppWrap.className = 'lb-opp-wrap';
    oppWrap.innerHTML = '<div id="lbOppLoading" class="lb-opp-loading"><div class="lb-opp-loading-spinner"></div><div>Conectando...</div></div>';
    container.appendChild(oppWrap);

    var divider = document.createElement('div');
    divider.id = 'lbDivider';
    divider.className = 'lb-split-divider';
    container.appendChild(divider);

    var myLabel = document.createElement('div');
    myLabel.id = 'lbSelfLabel';
    myLabel.className = 'lb-side-label self';
    myLabel.textContent = '@' + ((window.currentProfile && window.currentProfile.username) || 'Tu');
    container.appendChild(myLabel);

    var oppProfile = isHostA ? activeBattle.profile_b : activeBattle.profile_a;
    var oppLabel = document.createElement('div');
    oppLabel.id = 'lbOppLabel';
    oppLabel.className = 'lb-side-label opp';
    oppLabel.textContent = '@' + (oppProfile.username || 'oponente');
    container.appendChild(oppLabel);
  }

  function restoreSplitScreen(){
    document.body.classList.remove('lb-split-active');
    ['lbOpponentVideo','lbDivider','lbSelfLabel','lbOppLabel','lbOppLoading'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.remove();
    });
    if (splitScreenClient) {
      try { splitScreenClient.leave(); } catch(e){}
      try { splitScreenClient.removeAllListeners(); } catch(e){}
      splitScreenClient = null;
    }
  }
  // ========== END SPLIT-SCREEN ==========

  async function checkActiveOnLoad(){
    if (!window.currentUser) return;
    var uid = window.currentUser.id;
    var r = await window.sb.from('live_battles').select('*').or('host_a.eq.' + uid + ',host_b.eq.' + uid).eq('status', 'active').limit(1);
    if (r.data && r.data.length){ startActiveBattle(r.data[0].id); }
  }

  function init(){
    if (!window.sb || !window.currentUser) { setTimeout(init, 500); return; }
    getStreamContext();
    injectBattleButton();
    listenForInvites();
    checkActiveOnLoad();
    console.debug('[live-battle v2] installed, isHost=' + isHost);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 700); });
  } else {
    setTimeout(init, 700);
  }
})();
