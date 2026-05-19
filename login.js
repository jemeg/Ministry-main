// ===== فحص توفر localStorage =====
function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}

// ===== عرض إشعار =====
function showNotification(title, message, type) {
    type = type || 'info';
    var existing = document.querySelectorAll('.custom-notification');
    for (var i = 0; i < existing.length; i++) {
        existing[i].remove();
    }

    var gradients = {
        error: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        success: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        info: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
        warning: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
    };

    var icons = {
        error: 'fa-exclamation-circle',
        success: 'fa-check-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    var gradient = gradients[type] || gradients.info;
    var icon = icons[type] || icons.info;

    var notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;min-width:380px;max-width:500px;background:white;border-radius:20px;box-shadow:0 15px 50px rgba(0,0,0,0.2);backdrop-filter:blur(10px);animation:slideDown 0.5s ease-out;font-family:Cairo,sans-serif;overflow:hidden;';

    notification.innerHTML = '<div style="background:' + gradient + ';padding:20px 25px;display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="display:flex;align-items:center;gap:15px;">' +
        '<div style="width:45px;height:45px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);">' +
        '<i class="fas ' + icon + '" style="color:white;font-size:22px;"></i></div>' +
        '<h4 style="margin:0;color:white;font-size:1.1rem;font-weight:700;text-shadow:1px 1px 2px rgba(0,0,0,0.2);">' + title + '</h4></div>' +
        '<button type="button" onclick="this.closest(\'.custom-notification\').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;font-size:16px;cursor:pointer;padding:8px 12px;border-radius:50%;transition:all 0.3s ease;backdrop-filter:blur(5px);">' +
        '<i class="fas fa-times"></i></button></div>' +
        '<div style="padding:20px 25px;background:linear-gradient(135deg,#f8f9fa 0%,#ffffff 100%);">' +
        '<p style="margin:0;color:#495057;font-size:0.95rem;line-height:1.6;font-weight:500;">' + message + '</p></div>';

    document.body.appendChild(notification);

    setTimeout(function() {
        notification.style.animation = 'slideUp 0.5s ease-in';
        setTimeout(function() { notification.remove(); }, 500);
    }, 5000);
}

// ===== تعيين كلمة السر لأول دخول =====
function showPasswordSetup(medic) {
    var container = document.querySelector('.login-container');
    if (!container) return;

    container.innerHTML = '<div class="login-header">' +
        '<div class="logo-container"><div class="logo-shine"></div>' +
        '<img src="logo.png" alt="شعار وزارة الصحة" class="ministry-logo"></div>' +
        '<div class="title-container">' +
        '<h2><span class="title-highlight">تعيين كلمة السر</span></h2>' +
        '<h2><span class="ministry-name">مرحباً ' + medic.name + '</span></h2></div></div>' +
        '<div class="login-box">' +
        '<div class="text-center mb-3" style="color:white;">' +
        '<i class="fas fa-lock fa-2x mb-2"></i>' +
        '<p class="mb-0" style="font-size:0.85rem;">قم بتعيين كلمة سر خاصة بك لتسجيل الدخول</p></div>' +
        '<form id="passwordSetupForm">' +
        '<div class="mb-3"><label for="newPassword" class="form-label">كلمة السر</label>' +
        '<input type="password" id="newPassword" class="form-control text-center" placeholder="أدخل كلمة السر" required minlength="4"></div>' +
        '<div class="mb-3"><label for="confirmPassword" class="form-label">تأكيد كلمة السر</label>' +
        '<input type="password" id="confirmPassword" class="form-control text-center" placeholder="أعد إدخال كلمة السر" required minlength="4"></div>' +
        '<button type="submit" class="btn btn-success w-100"><i class="fas fa-check"></i> تعيين كلمة السر</button></form></div>';

    document.getElementById('passwordSetupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        var newPass = document.getElementById('newPassword').value.trim();
        var confirmPass = document.getElementById('confirmPassword').value.trim();

        if (newPass !== confirmPass) {
            showNotification('خطأ', 'كلمتا السر غير متطابقتين', 'error');
            return;
        }
        if (newPass.length < 4) {
            showNotification('خطأ', 'كلمة السر يجب أن تكون 4 أحرف على الأقل', 'error');
            return;
        }

        localStorage.setItem('password_' + medic.id, newPass);

        try {
            var medicsList = JSON.parse(localStorage.getItem('medicsList') || '[]');
            var idx = medicsList.findIndex(function(m) { return m.id === medic.id; });
            if (idx !== -1) {
                medicsList[idx].passwordSet = true;
                medicsList[idx].password = newPass;
                localStorage.setItem('medicsList', JSON.stringify(medicsList));
            }
        } catch(err) { console.error(err); }

        showNotification('تم بنجاح', 'تم تعيين كلمة السر بنجاح! جاري التحويل...', 'success');
        setTimeout(function() { window.location.href = 'index.html'; }, 1500);
    });
}

// ===== إضافة أنيميشن =====
var styleEl = document.createElement('style');
styleEl.textContent = '@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}' +
    '@keyframes slideUp{from{opacity:1;transform:translateX(-50%) translateY(0);}to{opacity:0;transform:translateX(-50%) translateY(-20px);}}';
document.head.appendChild(styleEl);

// ===== تبديل التبويبات =====
function switchTab(tab) {
    var btns = document.querySelectorAll('.tab-btn');
    var contents = document.querySelectorAll('.tab-content');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    for (var j = 0; j < contents.length; j++) contents[j].classList.remove('active');

    if (tab === 'login') {
        btns[0].classList.add('active');
        document.getElementById('loginTab').classList.add('active');
    } else {
        btns[1].classList.add('active');
        document.getElementById('registerTab').classList.add('active');
        checkPendingRequest();
    }
}

// ===== فحص الطلب المعلق =====
function checkPendingRequest() {
    try {
        var pendingData = localStorage.getItem('pendingRegistration');
        if (pendingData) {
            document.getElementById('medicRegisterForm').style.display = 'none';
            document.getElementById('requestPending').style.display = 'block';
        } else {
            document.getElementById('medicRegisterForm').style.display = 'block';
            document.getElementById('requestPending').style.display = 'none';
        }
    } catch (error) {
        console.error('خطأ في قراءة بيانات الطلب:', error);
        localStorage.removeItem('pendingRegistration');
        document.getElementById('medicRegisterForm').style.display = 'block';
        document.getElementById('requestPending').style.display = 'none';
    }
}

// ===== إلغاء الطلب =====
function cancelRequest() {
    if (!confirm('هل أنت متأكد من إلغاء طلبك؟')) return;
    localStorage.removeItem('pendingRegistration');
    document.getElementById('medicRegisterForm').style.display = 'block';
    document.getElementById('requestPending').style.display = 'none';
    document.getElementById('medicRegisterForm').reset();
}

// ===== تهيئة الصفحة =====
document.addEventListener('DOMContentLoaded', function() {
    // فحص توفر التخزين
    if (!isStorageAvailable()) {
        var container = document.getElementById('loginContainer');
        if (container) {
            container.innerHTML = '<div class="storage-error">' +
                '<i class="fas fa-exclamation-triangle fa-3x"></i>' +
                '<h3>تنبيه أمني</h3>' +
                '<p>المتصفح يمنع التخزين المحلي عند فتح الملف مباشرة.<br>' +
                'يرجى تشغيل الموقع عبر سيرفر محلي (Live Server) أو استخدام متصفح Firefox.</p>' +
                '<a href="https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer" target="_blank" class="btn btn-primary">' +
                '<i class="fas fa-download me-2"></i> تحميل Live Server</a></div>';
        }
        return;
    }

    // ربط النماذج
    var loginForm = document.getElementById('medicLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    var registerForm = document.getElementById('medicRegisterForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    checkPendingRequest();
});

// ===== معالجة تسجيل الدخول =====
function handleLogin(e) {
    e.preventDefault();

    var code = document.getElementById('paramedicCode').value.trim();
    var password = document.getElementById('password').value.trim();
    var loginBtn = document.querySelector('#medicLoginForm button[type="submit"]');

    if (!code || !password) {
        showNotification('بيانات ناقصة', 'الرجاء إدخال الكود وكلمة السر', 'error');
        return;
    }

    try {
        var originalBtnText = loginBtn.innerHTML;
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> جاري التحقق...';

        localStorage.removeItem('currentUser');
        localStorage.removeItem('activeMedic');
        localStorage.removeItem('activeCode');

        // دخول المدير
        if (code === 'admin' && password === 'Qir5hoon__1998') {
            localStorage.setItem('currentUser', JSON.stringify({
                id: 'admin-' + Date.now(),
                username: 'admin',
                name: 'وزير الصحة',
                type: 'admin',
                level: 'minister',
                loginTime: new Date().toISOString()
            }));
            showNotification('بيانات صحيحة', 'مرحباً وزير الصحة! جاري التحويل...', 'success');
            setTimeout(function() { window.location.href = 'admin.html'; }, 1500);
            return;
        }

        // دخول المسؤولين
        var officialsList = JSON.parse(localStorage.getItem('officialsList') || '[]');
        var official = officialsList.find(function(o) { return o.code === code && o.password === password; });
        if (official) {
            localStorage.setItem('currentUser', JSON.stringify({
                id: official.id,
                username: official.code,
                name: official.name,
                type: 'admin',
                level: official.level,
                role: official.role,
                permissions: official.permissions,
                loginTime: new Date().toISOString()
            }));
            showNotification('بيانات صحيحة', 'مرحباً ' + official.name + '! جاري التحويل...', 'success');
            setTimeout(function() { window.location.href = 'admin.html'; }, 1500);
            return;
        }

        // دخول المسعف
        var medicsList = JSON.parse(localStorage.getItem('medicsList') || '[]');
        var medic = null;
        for (var i = 0; i < medicsList.length; i++) {
            if (medicsList[i].code === code) {
                medic = medicsList[i];
                break;
            }
        }

        if (medic) {
            var savedPassword = localStorage.getItem('password_' + medic.id);

            if (!savedPassword && !medic.passwordSet) {
                localStorage.setItem('activeCode', medic.id);
                localStorage.setItem('activeMedic', JSON.stringify(medic));
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalBtnText;
                showNotification('أول دخول', 'مرحباً! يرجى تعيين كلمة السر أولاً', 'info');
                setTimeout(function() { showPasswordSetup(medic); }, 1500);
                return;
            }

            if (savedPassword) {
                if (savedPassword !== password) { medic = null; }
            } else if (medic.password && medic.password !== password) {
                medic = null;
            }
        }

        loginBtn.disabled = false;
        loginBtn.innerHTML = originalBtnText;

        if (!medic) {
            showNotification('خطأ في البيانات', 'الكود أو كلمة السر غير صحيحة. إذا لم يكن لديك حساب، قدم طلباً جديداً', 'error');
            return;
        }

        localStorage.setItem('activeCode', medic.id);
        localStorage.setItem('activeMedic', JSON.stringify(medic));
        showNotification('بيانات صحيحة', 'مرحباً ' + medic.name + '! جاري التحويل...', 'success');
        setTimeout(function() { window.location.href = 'index.html'; }, 1500);

    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showNotification('خطأ في النظام', 'حدث خطأ غير متوقع', 'error');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'تسجيل الدخول';
        }
    }
}

// ===== معالجة طلب التسجيل =====
function handleRegister(e) {
    e.preventDefault();

    var name = document.getElementById('registerName').value.trim();
    var code = document.getElementById('registerCode').value.trim();
    var registerBtn = document.querySelector('#medicRegisterForm button[type="submit"]');

    if (!name || !code) {
        showNotification('بيانات ناقصة', 'الرجاء إدخال الاسم والكود', 'error');
        return;
    }

    try {
        var medicsList = JSON.parse(localStorage.getItem('medicsList') || '[]');
        for (var i = 0; i < medicsList.length; i++) {
            if (medicsList[i].code === code) {
                showNotification('كود موجود', 'هذا الكود مسجل بالفعل. تواصل مع الإدارة', 'error');
                return;
            }
        }

        var pendingRequests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
        for (var j = 0; j < pendingRequests.length; j++) {
            if (pendingRequests[j].code === code && pendingRequests[j].status === 'pending') {
                showNotification('طلب معلق', 'يوجد طلب سابق بهذا الكود. انتظر مراجعة الإدارة', 'error');
                return;
            }
        }

        var originalBtnText = registerBtn.innerHTML;
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> جاري الإرسال...';

        var newRequest = {
            id: 'req_' + Date.now(),
            name: name,
            code: code,
            status: 'pending',
            requestDate: new Date().toISOString()
        };

        pendingRequests.push(newRequest);
        localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));
        localStorage.setItem('pendingRegistration', JSON.stringify(newRequest));

        registerBtn.disabled = false;
        registerBtn.innerHTML = originalBtnText;

        document.getElementById('medicRegisterForm').style.display = 'none';
        document.getElementById('requestPending').style.display = 'block';

        showNotification('تم الإرسال', 'تم إرسال طلبك بنجاح! سيتم مراجعته من الإدارة', 'success');

    } catch (error) {
        console.error('خطأ في إرسال الطلب:', error);
        showNotification('خطأ', 'حدث خطأ أثناء إرسال الطلب', 'error');
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.innerHTML = 'إرسال طلب التأكيد';
        }
    }
}
