const MEDICS_PER_PAGE = 10;
let currentPage = 1;

document.addEventListener('DOMContentLoaded', function() {
    const medic = JSON.parse(localStorage.getItem('activeMedic') || 'null');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!medic && !currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    if (medic) {
        document.getElementById('employeeName').textContent = medic.name || 'مسعف';
        document.getElementById('employeeId').textContent = 'كود: ' + (medic.code || 'غير معروف');
    } else if (currentUser) {
        document.getElementById('employeeName').textContent = currentUser.name || 'مدير';
        document.getElementById('employeeId').textContent = 'كود: ' + (currentUser.id || 'admin');
    }
    
    if (currentUser && currentUser.type === 'admin') {
        document.getElementById('adminBtn').classList.remove('d-none');
    }
    
    loadMedics();
    loadWarningsBanner();
    
    setupRealtimeListeners();
    
    // تحميل البيانات من Firebase في الخلفية
    loadAllFromFirestore().then(function() {
        loadMedics();
        loadWarningsBanner();
    }).catch(function(err) {
        console.error('Firebase sync error:', err);
    });
});

function getBadgeSVG(rank) {
    const savedBadge = localStorage.getItem('badge_' + rank);
    if (savedBadge) {
        if (savedBadge.startsWith('data:')) {
            return `<img src="${savedBadge}" alt="${rank}" style="width: 50px; height: 50px; object-fit: contain;">`;
        } else {
            return `<img src="${savedBadge}" alt="${rank}" style="width: 50px; height: 50px; object-fit: contain;">`;
        }
    }
    
    const rankLower = (rank || '').toLowerCase();
    if (rankLower.includes('مشرف عام')) {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFD700"/><stop offset="100%" style="stop-color:#FFA500"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g1)" stroke="#B8860B" stroke-width="3"/><text x="50" y="40" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold"></text><text x="50" y="65" text-anchor="middle" font-size="9" fill="#fff" font-weight="bold">مشرف عام</text></svg>`;
    } else if (rankLower.includes('مشرف ميداني')) {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFD700"/><stop offset="100%" style="stop-color:#DAA520"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g2)" stroke="#B8860B" stroke-width="3"/><text x="50" y="40" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold">🌟</text><text x="50" y="65" text-anchor="middle" font-size="8" fill="#fff" font-weight="bold">مشرف ميداني</text></svg>`;
    } else if (rankLower.includes('رئيس مسعفين')) {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#C0C0C0"/><stop offset="100%" style="stop-color:#808080"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g3)" stroke="#696969" stroke-width="3"/><text x="50" y="40" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold">⭐</text><text x="50" y="65" text-anchor="middle" font-size="8" fill="#fff" font-weight="bold">رئيس مسعفين</text></svg>`;
    } else if (rankLower.includes('بروفسور')) {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#9B59B6"/><stop offset="100%" style="stop-color:#8E44AD"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g4)" stroke="#6C3483" stroke-width="3"/><text x="50" y="40" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold"></text><text x="50" y="65" text-anchor="middle" font-size="9" fill="#fff" font-weight="bold">بروفسور</text></svg>`;
    } else if (rankLower.includes('طبيب ميداني')) {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#E74C3C"/><stop offset="100%" style="stop-color:#C0392B"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g5)" stroke="#922B21" stroke-width="3"/><text x="50" y="40" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold"></text><text x="50" y="65" text-anchor="middle" font-size="8" fill="#fff" font-weight="bold">طبيب ميداني</text></svg>`;
    } else if (rankLower.includes('طبيب استشاري')) {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#3498DB"/><stop offset="100%" style="stop-color:#2980B9"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g6)" stroke="#1F618D" stroke-width="3"/><text x="50" y="40" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold"></text><text x="50" y="65" text-anchor="middle" font-size="8" fill="#fff" font-weight="bold">طبيب استشاري</text></svg>`;
    } else if (rankLower.includes('طبيب اخصائي') || rankLower.includes('أخصائي')) {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#2ECC71"/><stop offset="100%" style="stop-color:#27AE60"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g7)" stroke="#1E8449" stroke-width="3"/><text x="50" y="40" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold">💊</text><text x="50" y="65" text-anchor="middle" font-size="8" fill="#fff" font-weight="bold">طبيب اخصائي</text></svg>`;
    } else if (rankLower.includes('مسعف ميداني')) {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#F39C12"/><stop offset="100%" style="stop-color:#E67E22"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g8)" stroke="#AF601A" stroke-width="3"/><text x="50" y="40" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold"></text><text x="50" y="65" text-anchor="middle" font-size="8" fill="#fff" font-weight="bold">مسعف ميداني</text></svg>`;
    } else if (rankLower.includes('مسعف أول')) {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g9" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1ABC9C"/><stop offset="100%" style="stop-color:#16A085"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g9)" stroke="#0E6655" stroke-width="3"/><text x="50" y="40" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold">🚑</text><text x="50" y="65" text-anchor="middle" font-size="9" fill="#fff" font-weight="bold">مسعف أول</text></svg>`;
    } else if (rankLower.includes('مسعف')) {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g10" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#CD7F32"/><stop offset="100%" style="stop-color:#8B4513"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g10)" stroke="#654321" stroke-width="3"/><text x="50" y="40" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold"></text><text x="50" y="65" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">مسعف</text></svg>`;
    } else if (rankLower.includes('طالب طب')) {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g11" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#5DADE2"/><stop offset="100%" style="stop-color:#3498DB"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g11)" stroke="#1B4F72" stroke-width="3"/><text x="50" y="40" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold">📚</text><text x="50" y="65" text-anchor="middle" font-size="9" fill="#fff" font-weight="bold">طالب طب</text></svg>`;
    } else {
        return `<svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="g12" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#AEB6BF"/><stop offset="100%" style="stop-color:#85929E"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g12)" stroke="#5D6D7E" stroke-width="3"/><text x="50" y="55" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">${rank || 'متدرب'}</text></svg>`;
    }
}

function loadMedics() {
    const medicsList = JSON.parse(localStorage.getItem('medicsList') || '[]');
    const gridContainer = document.getElementById('medicsTableWrapper');
    const emptyState = document.getElementById('medicsEmptyState');
    
    if (!medicsList || medicsList.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (gridContainer) gridContainer.style.display = 'none';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (gridContainer) gridContainer.style.display = 'grid';
    
    const totalPages = Math.ceil(medicsList.length / MEDICS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    
    const start = (currentPage - 1) * MEDICS_PER_PAGE;
    const end = start + MEDICS_PER_PAGE;
    const pageMedics = medicsList.slice(start, end);
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    
    gridContainer.innerHTML = pageMedics.map(medic => {
        const loginISO = localStorage.getItem(medic.id + '_login');
        const logoutISO = localStorage.getItem(medic.id + '_logout');
        const isOnline = loginISO && (!logoutISO || new Date(loginISO) > new Date(logoutISO));
        const medicWarnings = notifications.filter(n => n.medicId === medic.id);
        const hasWarning = medicWarnings.length > 0;
        const hasDisconnect = medicWarnings.some(w => w.type === 'disconnect');
        
        const avatarSrc = localStorage.getItem('avatar_' + medic.id);
        const initials = (medic.name || 'م').split(' ').map(n => n[0]).join('').substring(0, 2);
        const avatarHtml = avatarSrc 
            ? `<img src="${avatarSrc}" alt="${medic.name}" class="medic-avatar">`
            : `<div class="medic-avatar-placeholder">${initials}</div>`;
        
        const rankBadgeHtml = getBadgeSVG(medic.rank || 'متدرب');
        
        let warningIndicator = '';
        if (hasDisconnect) {
            warningIndicator = `<div class="medic-warning-indicator" style="background: #dc3545;" title="تحذير فصل"><i class="fas fa-ban"></i></div>`;
        } else if (hasWarning) {
            warningIndicator = `<div class="medic-warning-indicator" style="background: #ffc107;" title="تحذير"><i class="fas fa-exclamation"></i></div>`;
        }
        
        return `
            <div class="medic-card-item">
                <div class="medic-status ${isOnline ? '' : 'offline'}"></div>
                ${warningIndicator}
                <div class="medic-card-body">
                    <div class="medic-profile-section">
                        ${avatarHtml}
                        <div class="medic-details">
                            <h4>${medic.name || 'غير معروف'}</h4>
                            <span class="medic-code-badge">${medic.code || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="medic-rank-badge-container">
                        ${rankBadgeHtml}
                    </div>
                </div>
                <div class="medic-rank-bar">
                    <i class="fas fa-shield-alt"></i>
                    <span>${medic.rank || 'متدرب'}</span>
                </div>
            </div>
        `;
    }).join('');
    
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    if (currentPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">السابق</a></li>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a></li>`;
    }
    
    if (currentPage < totalPages) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">التالي</a></li>`;
    }
    
    pagination.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    loadMedics();
}

function loadWarningsBanner() {
    const medic = JSON.parse(localStorage.getItem('activeMedic') || 'null');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!medic && !currentUser) return;
    
    const medicId = medic ? medic.id : currentUser.id;
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const medicWarnings = notifications.filter(n => n.medicId === medicId);
    
    const warningsBanner = document.getElementById('warningsBanner');
    if (!warningsBanner) return;
    
    if (medicWarnings.length === 0) {
        warningsBanner.style.display = 'none';
        return;
    }
    
    warningsBanner.style.display = 'block';
    
    const hasDisconnect = medicWarnings.some(w => w.type === 'disconnect');
    const hasWarning = medicWarnings.some(w => w.type === 'warning');
    
    let bannerClass = 'info';
    let bannerIcon = 'fa-info-circle';
    let bannerText = 'لديك إشعارات جديدة';
    
    if (hasDisconnect) {
        bannerClass = 'disconnect';
        bannerIcon = 'fa-ban';
        bannerText = '⚠️ لديك تحذير فصل!';
    } else if (hasWarning) {
        bannerClass = 'warning';
        bannerIcon = 'fa-exclamation-triangle';
        bannerText = '️ لديك تحذيرات';
    }
    
    warningsBanner.className = `warnings-banner ${bannerClass}`;
    warningsBanner.innerHTML = `
        <i class="fas ${bannerIcon}"></i>
        <span>${bannerText} (${medicWarnings.length} إشعار)</span>
        <button class="btn btn-sm btn-light ms-auto" id="openWarningsBtn">
            <i class="fas fa-eye me-1"></i> عرض التفاصيل
        </button>
    `;
    
    document.getElementById('openWarningsBtn').addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('warningsModal'));
        modal.show();
    });
}
