// ============================================================
// SIMFINITY MAINTENANCE SYSTEM - app.js
// ============================================================

// ---------- Particles ----------
function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}
createParticles();

// ---------- State ----------
let currentUser = null;
let db = {
    users: [], tickets: [], assets: [], inventory: [],
    ticketLogs: [], partTransactions: [], audit: [], knowledgeBase: []
};
let currentFilter = { type: 'all', value: null };
let currentAnalyticsTab = 'overview';
let currentKBFilter = 'all';
let editingArticleId = null;
let editingUserId = null;
let articleImageData = [];

// ---------- DB ----------
function initializeData() {
    const stored = localStorage.getItem('simfinityDB');
    if (stored) {
        db = JSON.parse(stored);
        if (!db.knowledgeBase) db.knowledgeBase = [];
        if (!db.ticketLogs) db.ticketLogs = [];
        if (!db.partTransactions) db.partTransactions = [];
        if (!db.audit) db.audit = [];
        if (!db.users) db.users = [];
        if (!db.tickets) db.tickets = [];
        if (!db.assets) db.assets = [];
        if (!db.inventory) db.inventory = [];
        saveDB();
    } else {
        db.users = [
            { id: 1, name: 'Admin', username: 'admin', password: 'admin', role: 'admin', status: true },
            { id: 2, name: 'John Tech', username: 'tech1', password: 'tech1', role: 'technician', status: true },
            { id: 3, name: 'Jane Staff', username: 'staff1', password: 'staff1', role: 'staff', status: true }
        ];
        db.assets = [
            { id: 1, code: 'SIM-001', name: 'Racing Simulator 1', model: 'RS-X500', serial: 'SN001', location: 'Floor 1', category: 'Simulator' },
            { id: 2, code: 'ARC-001', name: 'Street Fighter Cabinet', model: 'SF-II', serial: 'SN002', location: 'Floor 1', category: 'Arcade' },
            { id: 3, code: 'VR-001', name: 'VR Headset 1', model: 'Quest 3', serial: 'SN003', location: 'VR Zone', category: 'VR' }
        ];
        db.inventory = [
            { id: 1, name: 'Monitor Cable', sku: 'CAB-001', category: 'Cables', cost: 15.50, quantity: 25, reorder: 10, location: 'Shelf A1' },
            { id: 2, name: 'Power Supply 500W', sku: 'PSU-500', category: 'Electrical', cost: 85.00, quantity: 5, reorder: 5, location: 'Shelf B2' },
            { id: 3, name: 'Joystick Assembly', sku: 'JOY-001', category: 'Arcade', cost: 45.00, quantity: 8, reorder: 5, location: 'Shelf C1' }
        ];
        db.tickets = [
            { id: 1, number: 'SIM-2026-001', created: new Date().toISOString(), requester: 3, asset: 1, location: 'Floor 1', category: 'Simulator', description: 'Steering wheel not responding', priority: 'High', status: 'Open', assignedTo: null, closed: null },
            { id: 2, number: 'SIM-2026-002', created: new Date().toISOString(), requester: 3, asset: 2, location: 'Floor 1', category: 'Arcade', description: 'Player 2 button stuck', priority: 'Medium', status: 'Assigned', assignedTo: 2, closed: null }
        ];
        db.knowledgeBase = [
            { id: 1, title: 'Racing Simulator Steering Wheel Calibration', category: 'Troubleshooting', tags: ['simulator', 'steering', 'calibration'], content: 'Step 1: Turn off the simulator completely.\nStep 2: Disconnect the steering wheel USB cable.\nStep 3: Wait 10 seconds.\nStep 4: Reconnect the USB cable.\nStep 5: Turn on the simulator and access the calibration menu.\nStep 6: Follow on-screen instructions to calibrate center position and rotation range.\n\nNote: If issue persists, check for firmware updates.', author: 1, created: new Date().toISOString(), updated: new Date().toISOString() },
            { id: 2, title: 'VR Headset Cleaning Procedure', category: 'Maintenance', tags: ['vr', 'cleaning', 'hygiene'], content: 'Daily Cleaning:\n- Wipe foam padding with alcohol-free antibacterial wipes\n- Clean lenses with microfiber cloth (lens cleaner if needed)\n- Allow to air dry for 5 minutes before next use\n\nWeekly Deep Clean:\n- Remove facial interface if detachable\n- Wash with mild soap and water\n- Dry completely before reattaching\n- Inspect straps for wear and tear\n\nWarning: Never use alcohol-based cleaners on lenses.', author: 1, created: new Date().toISOString(), updated: new Date().toISOString() },
            { id: 3, title: 'Arcade Cabinet Button Replacement', category: 'Setup', tags: ['arcade', 'buttons', 'repair'], content: 'Tools Needed:\n- Phillips screwdriver\n- New arcade button\n- Wire strippers (if needed)\n\nSteps:\n1. Turn off and unplug the arcade cabinet\n2. Open the control panel access door\n3. Locate the faulty button from inside\n4. Disconnect the two wire connectors (note orientation)\n5. Unscrew the retaining ring and remove old button\n6. Insert new button and secure with retaining ring\n7. Reconnect wire connectors (match colors)\n8. Test button before closing panel\n9. Close access door and restore power\n\nTip: Keep spare buttons in inventory (Part SKU: BTN-30MM)', author: 2, created: new Date().toISOString(), updated: new Date().toISOString() }
        ];
        saveDB();
    }
}

function saveDB() { localStorage.setItem('simfinityDB', JSON.stringify(db)); }

// ---------- Auth ----------
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const user = db.users.find(u => u.username === username && u.password === password && u.status);
    if (user) { currentUser = user; showApp(); }
    else { showAlert('ACCESS DENIED: INVALID CREDENTIALS', 'error', 'loginAlert'); }
});

function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('currentUserName').textContent = currentUser.name;
    document.getElementById('currentUserRole').textContent = currentUser.role;
    if (currentUser.role === 'admin') document.getElementById('usersLink').classList.remove('hidden');
    loadDashboard();
}

function logout() {
    currentUser = null;
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

// ---------- Navigation ----------
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewName + 'View').classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    event.target.classList.add('active');
    switch (viewName) {
        case 'dashboard': loadDashboard(); break;
        case 'tickets':
            currentFilter = { type: 'all', value: null }; loadTickets();
            setTimeout(() => {
                document.querySelectorAll('#ticketsView .filter-btn').forEach(btn => { btn.classList.remove('active'); btn.style.opacity = '0.6'; });
                document.getElementById('filterAll').classList.add('active'); document.getElementById('filterAll').style.opacity = '1';
            }, 0); break;
        case 'inventory': loadInventory(); break;
        case 'assets': loadAssets(); break;
        case 'reports':
            currentAnalyticsTab = 'overview'; loadReports();
            setTimeout(() => {
                document.querySelectorAll('#reportsView .filter-btn').forEach(btn => { if (btn.id && btn.id.startsWith('tab')) { btn.classList.remove('active'); btn.style.opacity = '0.6'; } });
                document.getElementById('tabOverview').classList.add('active'); document.getElementById('tabOverview').style.opacity = '1';
            }, 0); break;
        case 'knowledge':
            currentKBFilter = 'all'; loadKnowledge();
            setTimeout(() => {
                document.querySelectorAll('#knowledgeView .filter-btn').forEach(btn => { btn.classList.remove('active'); btn.style.opacity = '0.6'; });
                document.getElementById('kbFilterAll').classList.add('active'); document.getElementById('kbFilterAll').style.opacity = '1';
            }, 0); break;
        case 'users': loadUsers(); break;
    }
}

// ---------- Dashboard ----------
function loadDashboard() {
    const openTickets = db.tickets.filter(t => t.status !== 'Closed').length;
    const criticalTickets = db.tickets.filter(t => t.priority === 'Critical' && t.status !== 'Closed').length;
    const myTickets = db.tickets.filter(t => t.assignedTo === currentUser.id && t.status !== 'Closed').length;
    const lowStock = db.inventory.filter(i => i.quantity <= i.reorder).length;
    document.getElementById('openTicketsCount').textContent = openTickets;
    document.getElementById('criticalCount').textContent = criticalTickets;
    document.getElementById('myTicketsCount').textContent = myTickets;
    document.getElementById('lowStockCount').textContent = lowStock;
    const recentTickets = db.tickets.slice(-10).reverse();
    const tbody = document.querySelector('#recentTicketsTable tbody');
    tbody.innerHTML = recentTickets.map(t => {
        const asset = db.assets.find(a => a.id === t.asset);
        const assigned = t.assignedTo ? db.users.find(u => u.id === t.assignedTo) : null;
        return `<tr onclick="viewTicketDetail(${t.id})"><td>${t.number}</td><td>${asset ? asset.name : 'N/A'}</td><td>${t.category}</td><td><span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span></td><td><span class="badge badge-${t.status.toLowerCase().replace(' ', '')}">${t.status}</span></td><td>${assigned ? assigned.name : 'Unassigned'}</td></tr>`;
    }).join('');
}

// ---------- Tickets ----------
function filterTickets(type, value = null) {
    currentFilter = { type, value };
    document.querySelectorAll('#ticketsView .filter-btn').forEach(btn => { btn.classList.remove('active'); btn.style.opacity = '0.6'; });
    if (type === 'all') { document.getElementById('filterAll').classList.add('active'); document.getElementById('filterAll').style.opacity = '1'; }
    else if (type === 'status') { const btn = document.getElementById('filter' + value.replace(' ', '')); if (btn) { btn.classList.add('active'); btn.style.opacity = '1'; } }
    else if (type === 'priority') { const btn = document.getElementById('filter' + value); if (btn) { btn.classList.add('active'); btn.style.opacity = '1'; } }
    loadTickets();
}

function loadTickets() {
    let tickets = db.tickets;
    if (currentUser.role === 'technician') tickets = tickets.filter(t => t.assignedTo === currentUser.id);
    else if (currentUser.role === 'staff') tickets = tickets.filter(t => t.requester === currentUser.id || t.assignedTo === currentUser.id);
    if (currentFilter.type === 'status') tickets = tickets.filter(t => t.status === currentFilter.value);
    else if (currentFilter.type === 'priority') tickets = tickets.filter(t => t.priority === currentFilter.value);
    const tbody = document.querySelector('#ticketsTable tbody');
    tbody.innerHTML = tickets.map(t => {
        const asset = db.assets.find(a => a.id === t.asset);
        const assigned = t.assignedTo ? db.users.find(u => u.id === t.assignedTo) : null;
        let actions = `<button class="btn btn-sm" onclick="viewTicketDetail(${t.id})">View</button>`;
        if (currentUser.role === 'admin' && t.status !== 'Closed') actions += ` <button class="btn btn-sm btn-success" onclick="openAssignModal(${t.id})">Assign</button>`;
        if (currentUser.role === 'admin') actions += ` <button class="btn btn-sm btn-danger" onclick="deleteTicket(${t.id})">Delete</button>`;
        return `<tr><td>${t.number}</td><td>${asset ? asset.name : 'N/A'}</td><td>${t.location}</td><td><span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span></td><td><span class="badge badge-${t.status.toLowerCase().replace(' ', '')}">${t.status}</span></td><td>${assigned ? assigned.name : 'Unassigned'}</td><td>${actions}</td></tr>`;
    }).join('');
}

function viewTicketDetail(ticketId) {
    const ticket = db.tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const asset = db.assets.find(a => a.id === ticket.asset);
    const requester = db.users.find(u => u.id === ticket.requester);
    const assigned = ticket.assignedTo ? db.users.find(u => u.id === ticket.assignedTo) : null;
    const logs = db.ticketLogs.filter(l => l.ticketId === ticketId);
    let content = `<div class="ticket-detail">
        <div class="info-row"><div class="info-label">Ticket #:</div><div>${ticket.number}</div></div>
        <div class="info-row"><div class="info-label">Asset:</div><div>${asset ? asset.name : 'N/A'}</div></div>
        <div class="info-row"><div class="info-label">Location:</div><div>${ticket.location}</div></div>
        <div class="info-row"><div class="info-label">Priority:</div><div><span class="badge badge-${ticket.priority.toLowerCase()}">${ticket.priority}</span></div></div>
        <div class="info-row"><div class="info-label">Status:</div><div><span class="badge badge-${ticket.status.toLowerCase().replace(' ', '')}">${ticket.status}</span></div></div>
        <div class="info-row"><div class="info-label">Requester:</div><div>${requester ? requester.name : 'N/A'}</div></div>
        <div class="info-row"><div class="info-label">Assigned To:</div><div>${assigned ? assigned.name : 'Unassigned'}</div></div>
        <div class="info-row"><div class="info-label">Description:</div><div>${ticket.description}</div></div>
    </div>`;
    const canUpdate = currentUser.role === 'admin' || currentUser.role === 'technician' || (currentUser.role === 'staff' && ticket.assignedTo === currentUser.id);
    if (canUpdate) {
        content += `<div class="card"><h3 style="margin-bottom: 1rem; color: var(--neon-cyan);">Add Update</h3>
            <form id="updateTicketForm" onsubmit="updateTicket(event, ${ticketId})">
                <div class="form-group"><label>Notes</label><textarea id="updateNote" required placeholder="ENTER UPDATE..."></textarea></div>
                <div class="form-group"><label>Status</label><select id="updateStatus"><option>Open</option><option>Assigned</option><option>In Progress</option><option>Waiting for Parts</option><option>Resolved</option><option>Closed</option></select></div>
                <div class="form-group"><label>Labor Time (hours)</label><input type="number" step="0.5" id="updateLabor" placeholder="0.0"></div>
                <div class="form-group"><label>Part Used</label><select id="updatePart"><option value="">None</option>${db.inventory.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.quantity})</option>`).join('')}</select></div>
                <div class="form-group"><label>Quantity</label><input type="number" id="updatePartQty" min="1" placeholder="0"></div>
                <button type="submit" class="btn">Save Update</button>
            </form></div>`;
    }
    if (logs.length > 0) {
        content += `<h3 style="margin-top: 2rem; margin-bottom: 1rem; color: var(--neon-cyan); font-family: Orbitron;">History Log</h3>`;
        logs.forEach(log => {
            const user = db.users.find(u => u.id === log.userId);
            content += `<div class="history-item"><div class="timestamp">${new Date(log.created).toLocaleString()} // ${user ? user.name : 'Unknown'}</div><div>${log.note}</div>${log.laborTime ? `<div style="color: var(--neon-yellow); margin-top: 0.5rem;">Labor: ${log.laborTime} hrs</div>` : ''}${log.statusChange ? `<div style="color: var(--neon-pink); margin-top: 0.5rem;">Status: ${log.statusChange}</div>` : ''}</div>`;
        });
    }
    document.getElementById('ticketDetailContent').innerHTML = content;
    document.getElementById('ticketDetailModal').classList.add('active');
}

function updateTicket(event, ticketId) {
    event.preventDefault();
    const ticket = db.tickets.find(t => t.id === ticketId);
    const note = document.getElementById('updateNote').value;
    const status = document.getElementById('updateStatus').value;
    const labor = document.getElementById('updateLabor').value;
    const partId = document.getElementById('updatePart').value;
    const partQty = document.getElementById('updatePartQty').value;
    db.ticketLogs.push({ id: db.ticketLogs.length + 1, ticketId, userId: currentUser.id, note, laborTime: labor || null, created: new Date().toISOString(), statusChange: ticket.status !== status ? `${ticket.status} → ${status}` : null });
    ticket.status = status;
    if (status === 'Closed') ticket.closed = new Date().toISOString();
    if (partId && partQty) {
        const part = db.inventory.find(p => p.id === parseInt(partId));
        if (part && part.quantity >= parseInt(partQty)) {
            part.quantity -= parseInt(partQty);
            db.partTransactions.push({ id: db.partTransactions.length + 1, partId: parseInt(partId), ticketId, type: 'Out', quantity: parseInt(partQty), userId: currentUser.id, timestamp: new Date().toISOString() });
        }
    }
    saveDB();
    showAlert('TICKET UPDATED SUCCESSFULLY', 'success');
    closeModal('ticketDetailModal');
    loadTickets();
}

function deleteTicket(ticketId) {
    if (confirm('CONFIRM DELETION: This action cannot be undone.')) {
        db.tickets = db.tickets.filter(t => t.id !== ticketId);
        db.ticketLogs = db.ticketLogs.filter(l => l.ticketId !== ticketId);
        db.partTransactions = db.partTransactions.filter(pt => pt.ticketId !== ticketId);
        saveDB(); showAlert('TICKET DELETED', 'success'); loadTickets(); loadDashboard();
    }
}

// ---------- Inventory ----------
function loadInventory() {
    const tbody = document.querySelector('#inventoryTable tbody');
    const canDelete = currentUser.role === 'admin' || currentUser.role === 'manager';
    tbody.innerHTML = db.inventory.map(i => {
        const lowStock = i.quantity <= i.reorder ? ' low-stock' : '';
        const deleteBtn = canDelete ? `<button class="btn btn-sm btn-danger" onclick="deleteInventory(${i.id})">Delete</button>` : '';
        return `<tr class="${lowStock}"><td>${i.name}</td><td>${i.sku}</td><td>${i.category}</td><td style="${i.quantity <= i.reorder ? 'color: var(--neon-red); font-weight: bold;' : ''}">${i.quantity}</td><td>${i.reorder}</td><td style="color: var(--neon-green);">₱${i.cost.toFixed(2)}</td><td>${i.location}</td><td>${deleteBtn}</td></tr>`;
    }).join('');
}

function deleteInventory(partId) {
    if (confirm('CONFIRM DELETION: Remove inventory item?')) {
        db.inventory = db.inventory.filter(i => i.id !== partId);
        db.partTransactions = db.partTransactions.filter(pt => pt.partId !== partId);
        saveDB(); showAlert('INVENTORY ITEM DELETED', 'success'); loadInventory();
    }
}

// ---------- Assets ----------
function loadAssets() {
    const tbody = document.querySelector('#assetsTable tbody');
    const canDelete = currentUser.role === 'admin';
    tbody.innerHTML = db.assets.map(a => {
        const deleteBtn = canDelete ? `<button class="btn btn-sm btn-danger" onclick="deleteAsset(${a.id})">Delete</button>` : '';
        return `<tr><td style="color: var(--neon-cyan); font-family: Orbitron;">${a.code}</td><td>${a.name}</td><td>${a.model}</td><td>${a.serial}</td><td>${a.location}</td><td><span class="badge badge-${a.category.toLowerCase()}">${a.category}</span></td><td>${deleteBtn}</td></tr>`;
    }).join('');
}

function deleteAsset(assetId) {
    if (db.tickets.some(t => t.asset === assetId)) { alert('ERROR: Asset has associated tickets. Delete tickets first.'); return; }
    if (confirm('CONFIRM DELETION: Remove asset from registry?')) {
        db.assets = db.assets.filter(a => a.id !== assetId);
        saveDB(); showAlert('ASSET DELETED', 'success'); loadAssets();
    }
}

// ---------- Reports ----------
function switchAnalyticsTab(tab) {
    currentAnalyticsTab = tab;
    document.querySelectorAll('.analytics-tab').forEach(t => t.classList.add('hidden'));
    document.getElementById('analytics' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
    document.querySelectorAll('#reportsView .filter-btn').forEach(btn => { if (btn.id && btn.id.startsWith('tab')) { btn.classList.remove('active'); btn.style.opacity = '0.6'; } });
    const btn = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (btn) { btn.classList.add('active'); btn.style.opacity = '1'; }
    loadReports();
}

function loadReports() {
    const total = db.tickets.length;
    const closedTickets = db.tickets.filter(t => t.status === 'Closed' && t.closed);
    const closed = closedTickets.length;
    const partsUsed = db.partTransactions.filter(t => t.type === 'Out').length;
    let avgTime = 'N/A', fastestTime = 'N/A', slowestTime = 'N/A';
    if (closedTickets.length > 0) {
        const durations = closedTickets.map(t => new Date(t.closed) - new Date(t.created));
        avgTime = `${Math.round(durations.reduce((s, d) => s + d, 0) / durations.length / 3600000)}h`;
        fastestTime = `${Math.max(1, Math.round(Math.min(...durations) / 3600000))}h`;
        slowestTime = `${Math.max(1, Math.round(Math.max(...durations) / 3600000))}h`;
    }
    const downtimePerAsset = {};
    closedTickets.forEach(t => { const h = (new Date(t.closed) - new Date(t.created)) / 3600000; downtimePerAsset[t.asset] = (downtimePerAsset[t.asset] || 0) + h; });
    let totalDowntimeHours = 0, worstAssetId = null, worstAssetDowntime = 0;
    Object.keys(downtimePerAsset).forEach(id => { totalDowntimeHours += downtimePerAsset[id]; if (downtimePerAsset[id] > worstAssetDowntime) { worstAssetDowntime = downtimePerAsset[id]; worstAssetId = parseInt(id); } });
    const worstAsset = worstAssetId ? db.assets.find(a => a.id === worstAssetId) : null;
    const failuresPerAsset = {};
    db.tickets.forEach(t => { failuresPerAsset[t.asset] = (failuresPerAsset[t.asset] || 0) + 1; });
    let mostFailuresAssetId = null, mostFailuresCount = 0;
    Object.keys(failuresPerAsset).forEach(id => { if (failuresPerAsset[id] > mostFailuresCount) { mostFailuresCount = failuresPerAsset[id]; mostFailuresAssetId = parseInt(id); } });
    const mostFailureAsset = mostFailuresAssetId ? db.assets.find(a => a.id === mostFailuresAssetId) : null;
    const techStats = {};
    db.users.filter(u => (u.role === 'technician' || u.role === 'staff') && u.status).forEach(tech => {
        const tt = db.tickets.filter(t => t.assignedTo === tech.id);
        const tc = tt.filter(t => t.status === 'Closed' && t.closed);
        let ar = 'N/A';
        if (tc.length > 0) { const total = tc.reduce((s, t) => s + (new Date(t.closed) - new Date(t.created)), 0); ar = `${Math.round(total / tc.length / 3600000)}h`; }
        techStats[tech.id] = { name: tech.name, role: tech.role, total: tt.length, closed: tc.length, avgRepair: ar };
    });
    document.getElementById('totalTickets').textContent = total;
    document.getElementById('closedTickets').textContent = closed;
    document.getElementById('avgRepairTime').textContent = avgTime;
    document.getElementById('partsUsed').textContent = partsUsed;
    if (currentAnalyticsTab === 'downtime') {
        document.getElementById('totalDowntime').textContent = `${Math.round(totalDowntimeHours)}h`;
        document.getElementById('avgDowntime').textContent = `${Object.keys(downtimePerAsset).length > 0 ? Math.round(totalDowntimeHours / Object.keys(downtimePerAsset).length) : 0}h`;
        document.getElementById('worstAsset').textContent = worstAsset ? worstAsset.name : 'N/A';
        const thisMonth = new Date().getMonth();
        const monthDowntime = closedTickets.filter(t => new Date(t.closed).getMonth() === thisMonth).reduce((s, t) => s + (new Date(t.closed) - new Date(t.created)) / 3600000, 0);
        document.getElementById('monthDowntime').textContent = `${Math.round(monthDowntime)}h`;
        const body = document.getElementById('downtimeTableBody');
        if (body) { body.innerHTML = Object.keys(downtimePerAsset).map(id => { const asset = db.assets.find(a => a.id === parseInt(id)); const tickets = closedTickets.filter(t => t.asset === parseInt(id)); const th = downtimePerAsset[id]; return `<tr><td style="color:var(--neon-cyan)">${asset ? asset.name : 'Unknown'}</td><td>${asset ? asset.location : 'N/A'}</td><td style="color:var(--neon-red)">${Math.round(th)}h</td><td>${tickets.length}</td><td>${Math.round(th / tickets.length)}h</td></tr>`; }).sort().join(''); }
    }
    if (currentAnalyticsTab === 'failures') {
        document.getElementById('totalFailures').textContent = total;
        document.getElementById('mostFailures').textContent = mostFailureAsset ? mostFailureAsset.name : 'N/A';
        const thisMonth = new Date().getMonth();
        document.getElementById('monthFailures').textContent = db.tickets.filter(t => new Date(t.created).getMonth() === thisMonth).length;
        document.getElementById('criticalFailures').textContent = db.tickets.filter(t => t.priority === 'Critical').length;
        const body = document.getElementById('failuresTableBody');
        if (body) { body.innerHTML = Object.keys(failuresPerAsset).map(id => { const asset = db.assets.find(a => a.id === parseInt(id)); const tickets = db.tickets.filter(t => t.asset === parseInt(id)); return `<tr><td style="color:var(--neon-cyan)">${asset ? asset.name : 'Unknown'}</td><td>${asset ? asset.category : 'N/A'}</td><td style="color:var(--neon-yellow)">${failuresPerAsset[id]}</td><td style="color:var(--neon-red)">${tickets.filter(t => t.priority === 'Critical').length}</td><td style="color:var(--neon-orange)">${tickets.filter(t => t.priority === 'High').length}</td><td style="color:var(--neon-yellow)">${tickets.filter(t => t.priority === 'Medium').length}</td><td style="color:var(--neon-cyan)">${tickets.filter(t => t.priority === 'Low').length}</td></tr>`; }).join(''); }
    }
    if (currentAnalyticsTab === 'technicians') {
        const body = document.getElementById('techPerformanceBody');
        if (body) { body.innerHTML = Object.values(techStats).map(stat => { const userId = db.users.find(u => u.name === stat.name)?.id; const inProgress = db.tickets.filter(t => t.assignedTo === userId && t.status !== 'Closed' && t.status !== 'Open').length; const cr = stat.total > 0 ? Math.round(stat.closed / stat.total * 100) : 0; return `<tr><td style="color:var(--neon-cyan)">${stat.name}</td><td><span class="badge badge-${stat.role}">${stat.role}</span></td><td>${stat.total}</td><td style="color:var(--neon-yellow)">${inProgress}</td><td style="color:var(--neon-green)">${stat.closed}</td><td style="color:var(--neon-cyan)">${cr}%</td><td>${stat.avgRepair}</td></tr>`; }).join(''); }
    }
    if (currentAnalyticsTab === 'resolution') {
        document.getElementById('avgResolution').textContent = avgTime;
        document.getElementById('fastestResolution').textContent = fastestTime;
        document.getElementById('slowestResolution').textContent = slowestTime;
        const thisMonth = new Date().getMonth();
        const mc = closedTickets.filter(t => new Date(t.closed).getMonth() === thisMonth);
        document.getElementById('monthAvgResolution').textContent = mc.length > 0 ? `${Math.round(mc.reduce((s, t) => s + (new Date(t.closed) - new Date(t.created)), 0) / mc.length / 3600000)}h` : 'N/A';
        const rb = document.getElementById('resolutionTableBody');
        if (rb) { rb.innerHTML = ['Critical', 'High', 'Medium', 'Low'].map(p => { const tickets = closedTickets.filter(t => t.priority === p); if (!tickets.length) return `<tr><td><span class="badge badge-${p.toLowerCase()}">${p}</span></td><td>0</td><td>N/A</td><td>N/A</td><td>N/A</td></tr>`; const d = tickets.map(t => new Date(t.closed) - new Date(t.created)); const avg = Math.round(d.reduce((s, x) => s + x, 0) / d.length / 3600000); return `<tr><td><span class="badge badge-${p.toLowerCase()}">${p}</span></td><td>${tickets.length}</td><td style="color:var(--neon-cyan)">${avg}h</td><td style="color:var(--neon-green)">${Math.max(1, Math.round(Math.min(...d) / 3600000))}h</td><td style="color:var(--neon-red)">${Math.max(1, Math.round(Math.max(...d) / 3600000))}h</td></tr>`; }).join(''); }
        const cb = document.getElementById('resolutionCategoryBody');
        if (cb) { cb.innerHTML = ['Simulator', 'Arcade', 'PC', 'VR', 'Network', 'Electrical'].map(cat => { const tickets = closedTickets.filter(t => t.category === cat); if (!tickets.length) return ''; const d = tickets.map(t => new Date(t.closed) - new Date(t.created)); const avg = Math.round(d.reduce((s, x) => s + x, 0) / d.length / 3600000); return `<tr><td style="color:var(--neon-cyan)">${cat}</td><td>${tickets.length}</td><td style="color:var(--neon-cyan)">${avg}h</td><td style="color:var(--neon-green)">${Math.max(1, Math.round(Math.min(...d) / 3600000))}h</td><td style="color:var(--neon-red)">${Math.max(1, Math.round(Math.max(...d) / 3600000))}h</td></tr>`; }).join(''); }
    }
}

// ---------- Users ----------
function loadUsers() {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = db.users.map(u => {
        let actions = '';
        if (currentUser.role === 'admin') actions += `<button class="btn btn-sm" onclick="editUser(${u.id})">Edit</button> `;
        if (currentUser.role === 'admin' && u.id !== currentUser.id) actions += `<button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">Delete</button>`;
        return `<tr><td style="color:var(--neon-cyan)">${u.name}</td><td>${u.username}</td><td><span class="badge badge-${u.role}">${u.role}</span></td><td style="color:${u.status ? 'var(--neon-green)' : 'var(--neon-red)'}">${u.status ? 'ACTIVE' : 'INACTIVE'}</td><td>${actions}</td></tr>`;
    }).join('');
}

function deleteUser(userId) {
    if (db.tickets.some(t => t.requester === userId || t.assignedTo === userId)) { alert('ERROR: User has ticket history.'); return; }
    if (confirm('CONFIRM DELETION: Remove user account?')) {
        db.users = db.users.filter(u => u.id !== userId);
        saveDB(); showAlert('USER DELETED', 'success'); loadUsers();
    }
}

function editUser(userId) {
    const user = db.users.find(u => u.id === userId);
    if (!user) return;
    editingUserId = userId;
    document.getElementById('userName').value = user.name;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userPassword').value = user.password;
    document.getElementById('userRole').value = user.role;
    document.querySelector('#userModal .modal-header h3').textContent = 'EDIT USER';
    document.getElementById('userModal').classList.add('active');
}

function handleUserFormSubmit(e) {
    e.preventDefault();
    if (editingUserId) {
        const user = db.users.find(u => u.id === editingUserId);
        if (user) { user.name = document.getElementById('userName').value; user.username = document.getElementById('userUsername').value; user.password = document.getElementById('userPassword').value; user.role = document.getElementById('userRole').value; saveDB(); showAlert('USER UPDATED', 'success'); }
        editingUserId = null;
    } else {
        db.users.push({ id: db.users.length + 1, name: document.getElementById('userName').value, username: document.getElementById('userUsername').value, password: document.getElementById('userPassword').value, role: document.getElementById('userRole').value, status: true });
        saveDB(); showAlert('USER CREATED', 'success');
    }
    closeModal('userModal'); document.getElementById('userForm').reset(); loadUsers();
}

// ---------- Modals ----------
function openTicketModal() {
    document.getElementById('ticketAsset').innerHTML = db.assets.map(a => `<option value="${a.id}">${a.name} (${a.code})</option>`).join('');
    document.getElementById('ticketModal').classList.add('active');
}
function openPartModal() { document.getElementById('partModal').classList.add('active'); }
function openAssetModal() { document.getElementById('assetModal').classList.add('active'); }
function openUserModal() {
    editingUserId = null;
    document.querySelector('#userModal .modal-header h3').textContent = 'ADD NEW USER';
    document.getElementById('userForm').reset();
    document.getElementById('userModal').classList.add('active');
}
function openArticleModal() {
    editingArticleId = null;
    document.getElementById('articleModalTitle').textContent = 'NEW ARTICLE';
    document.getElementById('articleForm').reset();
    document.getElementById('articleSubmitBtn').textContent = 'Create Article';
    articleImageData = [];
    renderImagePreviews();
    document.getElementById('articleModal').classList.add('active');
}
function closeModal(modalId) { document.getElementById(modalId).classList.remove('active'); }

function openAssignModal(ticketId) {
    const ticket = db.tickets.find(t => t.id === ticketId);
    const assignableUsers = db.users.filter(u => (u.role === 'technician' || u.role === 'staff') && u.status);
    document.getElementById('assignModalContent').innerHTML = `
        <div class="modal-header"><h3>ASSIGN TICKET ${ticket.number}</h3><button class="close-btn" onclick="closeModal('assignModal')">&times;</button></div>
        <form id="assignForm" onsubmit="assignTicket(event, ${ticketId})">
            <div class="form-group"><label>Assign To *</label><select id="assignTech" required><option value="">-- SELECT OPERATIVE --</option>${assignableUsers.map(u => `<option value="${u.id}" ${ticket.assignedTo === u.id ? 'selected' : ''}>${u.name} [${u.role}]</option>`).join('')}</select></div>
            <button type="submit" class="btn">Execute Assignment</button>
        </form>`;
    document.getElementById('assignModal').classList.add('active');
}

function assignTicket(event, ticketId) {
    event.preventDefault();
    const techId = parseInt(document.getElementById('assignTech').value);
    const ticket = db.tickets.find(t => t.id === ticketId);
    ticket.assignedTo = techId;
    if (ticket.status === 'Open') ticket.status = 'Assigned';
    db.ticketLogs.push({ id: db.ticketLogs.length + 1, ticketId, userId: currentUser.id, note: `Ticket assigned to ${db.users.find(u => u.id === techId).name}`, laborTime: null, created: new Date().toISOString(), statusChange: null });
    saveDB();
    showAlert('TICKET ASSIGNED SUCCESSFULLY', 'success');
    closeModal('assignModal');
    loadTickets();
    loadDashboard();
}

// ---------- Knowledge Base ----------
function loadKnowledge() {
    let articles = db.knowledgeBase;
    const searchTerm = document.getElementById('knowledgeSearch').value.toLowerCase();
    if (currentKBFilter !== 'all') articles = articles.filter(a => a.category === currentKBFilter);
    if (searchTerm) articles = articles.filter(a => a.title.toLowerCase().includes(searchTerm) || a.content.toLowerCase().includes(searchTerm) || a.tags.some(t => t.toLowerCase().includes(searchTerm)));
    const container = document.getElementById('knowledgeArticles');
    if (articles.length === 0) { container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem;font-family:Orbitron;">NO DATA FOUND</p>'; return; }
    const canEdit = currentUser.role === 'admin' || currentUser.role === 'manager';
    container.innerHTML = articles.map(a => {
        const author = db.users.find(u => u.id === a.author);
        const preview = a.content.substring(0, 150) + (a.content.length > 150 ? '...' : '');
        return `<div class="article-card">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                <h3 style="margin:0;font-size:1.25rem;color:var(--neon-cyan);cursor:pointer;font-family:Orbitron;" onclick="viewArticle(${a.id})">${a.title}</h3>
                ${canEdit ? `<div style="display:flex;gap:0.5rem;"><button class="btn btn-sm" onclick="editArticle(${a.id})">Edit</button><button class="btn btn-sm btn-danger" onclick="deleteArticle(${a.id})">Delete</button></div>` : ''}
            </div>
            <div style="display:flex;gap:0.75rem;align-items:center;margin-bottom:0.75rem;">
                <span class="badge" style="background:var(--neon-purple);color:white;border-color:var(--neon-purple);">${a.category}</span>
                ${a.tags.map(t => `<span class="badge" style="background:rgba(0,243,255,0.1);color:var(--neon-cyan);border-color:var(--neon-cyan);">${t}</span>`).join('')}
            </div>
            <p style="color:var(--text-secondary);margin-bottom:0.5rem;line-height:1.6;">${preview}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:var(--text-secondary);font-family:Orbitron;">
                <span>// ${author ? author.name : 'Unknown'} // ${new Date(a.created).toLocaleDateString()}</span>
                <div style="display:flex;gap:0.5rem;align-items:center;">
                    ${a.images && a.images.length > 0 ? `<span style="color:var(--neon-cyan);">📎 ${a.images.length} IMG</span>` : ''}
                    <button class="btn btn-sm" onclick="viewArticle(${a.id})" style="padding:0.25rem 0.75rem;">Access</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function filterKnowledge(category) {
    currentKBFilter = category;
    document.querySelectorAll('#knowledgeView .filter-btn').forEach(btn => { if (btn.id && btn.id.startsWith('kbFilter')) { btn.classList.remove('active'); btn.style.opacity = '0.6'; } });
    const btn = document.getElementById('kbFilter' + (category === 'all' ? 'All' : category));
    if (btn) { btn.classList.add('active'); btn.style.opacity = '1'; }
    loadKnowledge();
}

function searchKnowledge() { loadKnowledge(); }

function viewArticle(articleId) {
    const article = db.knowledgeBase.find(a => a.id === articleId);
    if (!article) return;
    const author = db.users.find(u => u.id === article.author);
    document.getElementById('viewArticleTitle').textContent = article.title;
    document.getElementById('viewArticleContent').innerHTML = `
        <div style="margin-bottom:1rem;">
            <span class="badge" style="background:var(--neon-purple);color:white;border-color:var(--neon-purple);">${article.category}</span>
            ${article.tags.map(t => `<span class="badge" style="background:rgba(0,243,255,0.1);color:var(--neon-cyan);border-color:var(--neon-cyan);margin-left:0.5rem;">${t}</span>`).join('')}
        </div>
        <div style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:1.5rem;font-family:Orbitron;">
            // ${author ? author.name : 'Unknown'} // ${new Date(article.created).toLocaleDateString()}
            ${article.updated !== article.created ? ` // UPDATED ${new Date(article.updated).toLocaleDateString()}` : ''}
        </div>
        <div style="white-space:pre-wrap;line-height:1.8;color:var(--text-primary);">${article.content}</div>
        ${article.images && article.images.length > 0 ? `
        <div style="margin-top:1.5rem;border-top:1px solid rgba(0,243,255,0.3);padding-top:1.5rem;">
            <p style="font-weight:600;margin-bottom:0.75rem;color:var(--neon-cyan);font-family:Orbitron;">📎 ATTACHED IMAGES (${article.images.length})</p>
            <div style="display:flex;flex-wrap:wrap;gap:0.75rem;">
                ${article.images.map(img => `<div style="position:relative;cursor:pointer;" onclick="openImageLightbox('${img.data}','${img.name}')"><img src="${img.data}" alt="${img.name}" style="width:120px;height:90px;object-fit:cover;border:1px solid var(--neon-cyan);" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"><div style="font-size:0.65rem;color:var(--text-secondary);text-align:center;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${img.name}</div></div>`).join('')}
            </div>
        </div>` : ''}`;
    document.getElementById('viewArticleModal').classList.add('active');
}

function openImageLightbox(src, name) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(10,10,15,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;';
    overlay.onclick = () => document.body.removeChild(overlay);
    overlay.innerHTML = `<img src="${src}" alt="${name}" style="max-width:90vw;max-height:80vh;border:2px solid var(--neon-cyan);box-shadow:0 0 40px var(--neon-cyan);"><p style="color:var(--neon-cyan);font-size:0.875rem;font-family:Orbitron;">${name} // CLICK TO CLOSE</p>`;
    document.body.appendChild(overlay);
}

function editArticle(articleId) {
    const article = db.knowledgeBase.find(a => a.id === articleId);
    if (!article) return;
    editingArticleId = articleId;
    document.getElementById('articleModalTitle').textContent = 'EDIT ARTICLE';
    document.getElementById('articleTitle').value = article.title;
    document.getElementById('articleCategory').value = article.category;
    document.getElementById('articleTags').value = article.tags.join(', ');
    document.getElementById('articleContent').value = article.content;
    document.getElementById('articleSubmitBtn').textContent = 'Update Article';
    articleImageData = article.images ? [...article.images] : [];
    renderImagePreviews();
    document.getElementById('articleModal').classList.add('active');
}

function deleteArticle(articleId) {
    if (confirm('CONFIRM DELETION: Remove knowledge base article?')) {
        db.knowledgeBase = db.knowledgeBase.filter(a => a.id !== articleId);
        saveDB(); showAlert('ARTICLE DELETED', 'success'); loadKnowledge();
    }
}

// ---------- Image Handling ----------
function handleImageSelect(event) { processImageFiles(Array.from(event.target.files)); event.target.value = ''; }

function handleImageDrop(event) {
    event.preventDefault();
    document.getElementById('imageDropZone').style.borderColor = 'var(--neon-cyan)';
    document.getElementById('imageDropZone').style.background = 'rgba(0, 243, 255, 0.05)';
    processImageFiles(Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/')));
}

function processImageFiles(files) {
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => { articleImageData.push({ name: file.name, data: e.target.result }); renderImagePreviews(); };
        reader.readAsDataURL(file);
    });
}

function renderImagePreviews() {
    const container = document.getElementById('imagePreviewContainer');
    if (!container) return;
    container.innerHTML = articleImageData.map((img, i) => `
        <div style="position:relative;display:inline-block;">
            <img src="${img.data}" alt="${img.name}" style="width:90px;height:70px;object-fit:cover;border:1px solid var(--neon-cyan);display:block;">
            <button type="button" onclick="removeArticleImage(${i})" style="position:absolute;top:-6px;right:-6px;background:var(--neon-red);color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:0.75rem;display:flex;align-items:center;justify-content:center;">✕</button>
            <div style="font-size:0.65rem;color:var(--text-secondary);text-align:center;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${img.name}</div>
        </div>`).join('');
}

function removeArticleImage(index) { articleImageData.splice(index, 1); renderImagePreviews(); }

// ---------- Alerts ----------
function showAlert(message, type, containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => { container.innerHTML = ''; }, 3000);
}

// ---------- Form Submissions ----------
document.getElementById('ticketForm').addEventListener('submit', (e) => {
    e.preventDefault();
    db.tickets.push({ id: db.tickets.length + 1, number: `SIM-${Date.now()}`, created: new Date().toISOString(), requester: currentUser.id, asset: parseInt(document.getElementById('ticketAsset').value), location: document.getElementById('ticketLocation').value, category: document.getElementById('ticketCategory').value, description: document.getElementById('ticketDescription').value, priority: document.getElementById('ticketPriority').value, status: 'Open', assignedTo: null, closed: null });
    saveDB(); showAlert('TICKET CREATED SUCCESSFULLY', 'success'); closeModal('ticketModal'); document.getElementById('ticketForm').reset(); loadTickets();
});

document.getElementById('partForm').addEventListener('submit', (e) => {
    e.preventDefault();
    db.inventory.push({ id: db.inventory.length + 1, name: document.getElementById('partName').value, sku: document.getElementById('partSku').value, category: document.getElementById('partCategory').value, cost: parseFloat(document.getElementById('partCost').value), quantity: parseInt(document.getElementById('partQuantity').value), reorder: parseInt(document.getElementById('partReorder').value), location: document.getElementById('partLocation').value });
    saveDB(); showAlert('PART ADDED TO INVENTORY', 'success'); closeModal('partModal'); document.getElementById('partForm').reset(); loadInventory();
});

document.getElementById('assetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    db.assets.push({ id: db.assets.length + 1, code: document.getElementById('assetCode').value, name: document.getElementById('assetName').value, model: document.getElementById('assetModel').value, serial: document.getElementById('assetSerial').value, location: document.getElementById('assetLocation').value, category: document.getElementById('assetCategory').value });
    saveDB(); showAlert('ASSET REGISTERED', 'success'); closeModal('assetModal'); document.getElementById('assetForm').reset(); loadAssets();
});

document.getElementById('userForm').addEventListener('submit', handleUserFormSubmit);

document.getElementById('articleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        if (editingArticleId) {
            const article = db.knowledgeBase.find(a => a.id === editingArticleId);
            if (article) { article.title = document.getElementById('articleTitle').value; article.category = document.getElementById('articleCategory').value; article.tags = document.getElementById('articleTags').value.split(',').map(t => t.trim()).filter(t => t); article.content = document.getElementById('articleContent').value; article.images = [...articleImageData]; article.updated = new Date().toISOString(); saveDB(); showAlert('ARTICLE UPDATED', 'success'); }
            editingArticleId = null;
        } else {
            db.knowledgeBase.push({ id: db.knowledgeBase.length + 1, title: document.getElementById('articleTitle').value, category: document.getElementById('articleCategory').value, tags: document.getElementById('articleTags').value.split(',').map(t => t.trim()).filter(t => t), content: document.getElementById('articleContent').value, images: [...articleImageData], author: currentUser ? currentUser.id : 1, created: new Date().toISOString(), updated: new Date().toISOString() });
            saveDB(); showAlert('ARTICLE CREATED', 'success');
        }
        closeModal('articleModal'); document.getElementById('articleForm').reset();
        document.getElementById('articleModalTitle').textContent = 'NEW ARTICLE';
        document.getElementById('articleSubmitBtn').textContent = 'Create Article';
        articleImageData = []; renderImagePreviews(); loadKnowledge();
    } catch (error) { showAlert('ERROR: ' + error.message, 'error'); }
});

// ---------- Boot ----------
initializeData();
