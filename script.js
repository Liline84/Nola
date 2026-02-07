let pendingAction = null;
const startTime = Date.now();

// Toggle sidebar on mobile
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}

// Uptime counter
function updateUptime() {
  const elapsed = Date.now() - startTime;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const el = document.getElementById('uptimeDisplay');
  if (hours > 0) {
    el.textContent = hours + 'h ' + minutes + 'm';
  } else {
    el.textContent = minutes + 'm';
  }
}
setInterval(updateUptime, 10000);
updateUptime();

// Modal helpers
function showModal(title, message, onConfirm) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').textContent = message;
  document.getElementById('confirmModal').classList.remove('hidden');
  pendingAction = onConfirm;
}

function closeModal() {
  document.getElementById('confirmModal').classList.add('hidden');
  pendingAction = null;
}

function confirmAction() {
  if (pendingAction) pendingAction();
  closeModal();
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Load stats
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    animateValue('activeCount', data.activeSessions);
    animateValue('totalCount', data.totalUsers);
  } catch (e) {
    console.error('Error loading stats:', e);
  }
}

function animateValue(id, newVal) {
  const el = document.getElementById(id);
  const currentVal = parseInt(el.textContent) || 0;
  if (currentVal === newVal) return;
  el.textContent = newVal;
  el.style.transform = 'scale(1.1)';
  setTimeout(() => { el.style.transition = 'transform 0.3s ease'; el.style.transform = 'scale(1)'; }, 50);
}

// Load sessions
async function loadSessions() {
  try {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    const list = document.getElementById('sessionsList');
    
    if (data.sessions.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          </div>
          <h3>No bots connected</h3>
          <p>Connect a WhatsApp account above to get started</p>
        </div>`;
      return;
    }

    list.innerHTML = data.sessions.map((s, i) => {
      const initials = (s.name || s.userId || '??').substring(0, 2).toUpperCase();
      const isOnline = s.status === 'online';
      const displayName = s.name || s.phoneNumber || s.userId;
      return `
        <div class="session-row" style="animation: slideIn 0.3s ease ${i * 0.05}s both;">
          <div class="session-avatar ${isOnline ? 'online' : ''}">${initials}</div>
          <div class="session-details">
            <div class="session-name">${displayName}</div>
            <div class="session-meta">
              <span class="status-badge ${isOnline ? 'online' : 'offline'}">
                <span class="status-badge-dot"></span>
                ${s.status}
              </span>
              ${s.phoneNumber ? '<span>' + s.phoneNumber + '</span>' : ''}
            </div>
          </div>
          <div class="session-actions">
            ${isOnline 
              ? `<button class="btn btn-ghost btn-sm" onclick="stopSession('${s.userId}')">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:14px;height:14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" /></svg>
                   Stop
                 </button>`
              : `<button class="btn btn-primary btn-sm" onclick="startSession('${s.userId}')">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
                   Start
                 </button>`
            }
            <button class="btn btn-danger btn-sm" onclick="deleteSession('${s.userId}')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:14px;height:14px;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
              Delete
            </button>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    console.error('Error loading sessions:', e);
  }
}

// Show alert
function showAlert(type, message) {
  const alertBox = document.getElementById('alertBox');
  const icon = type === 'success' 
    ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>';
  alertBox.className = 'alert alert-' + type;
  alertBox.innerHTML = icon + '<span>' + message + '</span>';
  alertBox.classList.remove('hidden');
  setTimeout(() => alertBox.classList.add('hidden'), 6000);
}

// Strip + from phone input as user types
document.getElementById('phoneNumber').addEventListener('input', function() {
  this.value = this.value.replace(/\+/g, '');
});

// Copy pairing code
function copyPairingCode() {
  const code = document.getElementById('pairingCode').textContent;
  const btn = document.getElementById('copyPairingBtn');
  const copyIcon = btn.querySelector('.copy-icon');
  const checkIcon = btn.querySelector('.check-icon');
  navigator.clipboard.writeText(code).then(function() {
    btn.classList.add('copied');
    copyIcon.style.display = 'none';
    checkIcon.style.display = 'block';
    setTimeout(function() {
      btn.classList.remove('copied');
      copyIcon.style.display = 'block';
      checkIcon.style.display = 'none';
    }, 2000);
  }).catch(function() {
    // Fallback for older browsers
    var ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.classList.add('copied');
    copyIcon.style.display = 'none';
    checkIcon.style.display = 'block';
    setTimeout(function() {
      btn.classList.remove('copied');
      copyIcon.style.display = 'block';
      checkIcon.style.display = 'none';
    }, 2000);
  });
}

// Create session
document.getElementById('createForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const phoneNumber = document.getElementById('phoneNumber').value.trim().replace(/\+/g, '');
  const userId = 'bot_' + phoneNumber.replace(/[^0-9]/g, '');
  const connectBtn = document.getElementById('connectBtn');
  const pairingBox = document.getElementById('pairingBox');

  connectBtn.disabled = true;
  connectBtn.innerHTML = '<div class="spinner"></div> Connecting...';

  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, phoneNumber })
    });
    const data = await res.json();

    if (data.success && data.pairingCode) {
      pairingBox.classList.remove('hidden');
      document.getElementById('pairingCode').textContent = data.pairingCode;
      showAlert('success', data.message);
      document.getElementById('phoneNumber').value = '';
    } else if (data.success) {
      showAlert('success', data.message);
      pairingBox.classList.add('hidden');
    } else {
      showAlert('error', data.message);
      pairingBox.classList.add('hidden');
    }

    loadSessions();
    loadStats();
  } catch (e) {
    showAlert('error', 'Connection failed: ' + e.message);
  } finally {
    connectBtn.disabled = false;
    connectBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg> Connect';
  }
});

// Start session
async function startSession(userId) {
  try {
    await fetch(`/api/sessions/${userId}/start`, { method: 'POST' });
    setTimeout(() => { loadSessions(); loadStats(); }, 1000);
  } catch (e) {
    showAlert('error', 'Failed to start session');
  }
}

// Stop session
async function stopSession(userId) {
  try {
    await fetch(`/api/sessions/${userId}/stop`, { method: 'POST' });
    setTimeout(() => { loadSessions(); loadStats(); }, 1000);
  } catch (e) {
    showAlert('error', 'Failed to stop session');
  }
}

// Delete session
async function deleteSession(userId) {
  showModal(
    'Delete Bot Session',
    'This will permanently disconnect and remove this bot instance. This action cannot be undone.',
    async () => {
      try {
        await fetch(`/api/sessions/${userId}`, { method: 'DELETE' });
        setTimeout(() => { loadSessions(); loadStats(); }, 500);
      } catch (e) {
        showAlert('error', 'Failed to delete session');
      }
    }
  );
}

// Initial load
loadStats();
loadSessions();

// Auto refresh every 5 seconds
setInterval(() => {
  loadStats();
  loadSessions();
}, 5000);
