// الإعتماد على قاعدة البيانات المحلية (IndexedDB)
const db = window.db;


// ===== دوال مساعدة =====

/**
 * إظهار رسالة للمستخدم
 * @param {string} title - عنوان الرسالة
 * @param {string} message - نص الرسالة
 * @param {string} type - نوع الرسالة (success, error, info)
 */
function showNotification(title, message, type = 'info') {
    // إزالة أي إشعار قديم
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        min-width: 350px;
        max-width: 450px;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border: 2px solid ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
        animation: slideDown 0.5s ease-out;
        font-family: 'Cairo', sans-serif;
    `;
    
    const icon = type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    const iconColor = type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8';
    const borderColor = type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; padding: 20px 25px; border-bottom: 1px solid #e9ecef;">
            <div style="flex-shrink: 0; margin-left: 15px;">
                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, ${iconColor} 0%, ${type === 'error' ? '#c82333' : type === 'success' ? '#1e7e34' : '#1351a4'} 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                    <i class="fas ${icon}" style="color: white; font-size: 20px;"></i>
                </div>
            </div>
            <div style="flex-grow: 1;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <h4 style="margin: 0; color: ${type === 'error' ? '#dc3545' : type === 'success' ? '#155724' : '#17a2b8'}; font-size: 18px; font-weight: 700;">
                        ${title}
                    </h4>
                </div>
                <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                    ${message}
                </p>
            </div>
        </div>
        <button type="button" onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 15px; left: 15px; background: none; border: none; color: #6c757d; font-size: 18px; cursor: pointer; padding: 5px; border-radius: 50%; transition: all 0.3s ease;" onmouseover="this.style.color='#dc3545'; this.style.background='rgba(220, 53, 69, 0.1)'" onmouseout="this.style.color='#6c757d'; this.style.background='none'">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار تلقائياً بعد 6 ثواني
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.5s ease-in';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 6000);
}

// إضافة أنيميشن CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
    
    .custom-notification {
        font-family: 'Cairo', sans-serif;
    }
    
    .custom-notification:hover button {
        color: #dc3545 !important;
        background: rgba(220, 53, 69, 0.2) !important;
        transform: scale(1.1) !important;
    }
`;
document.head.appendChild(style);

// ===== نظام تسجيل الدخول للموظفين =====

document.addEventListener('DOMContentLoaded', function() {
    // تسجيل الدخول كموظف
    const employeeForm = document.getElementById('employeeLoginForm');
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleEmployeeLogin);
    }

    // تسجيل الدخول كمسعف - تم التعطيل لأنه موجود في login.html
    // const medicForm = document.getElementById('medicLoginForm');
    // if (medicForm) {
    //     medicForm.addEventListener('submit', handleMedicLogin);
    // }

    // زر تسجيل الدخول القديم
    const medicLoginBtn = document.querySelector('.btn-success[onclick="loginMedic()"]');
    if (medicLoginBtn) {
        medicLoginBtn.onclick = handleLegacyMedicLogin;
    }
});

// ================= تسجيل دخول المسعف من localStorage =================
// تم التعطيل لتجنب التعارض مع login.html
// document.addEventListener('DOMContentLoaded', () => {
//   const form = document.getElementById('medicLoginForm');
//   if (!form) return;
//   // تعطيل مسار تسجيل دخول localStorage لتجنب التعارض مع IndexedDB
//   return;
//   form.addEventListener('submit', function(e) {
//     e.preventDefault();
//     const code    = document.getElementById('paramedicCode').value.trim();
//     const discord = document.getElementById('discordId').value.trim();
//     const medics  = JSON.parse(localStorage.getItem('medicsList') || '[]');
//     const medic   = medics.find(m => m.code === code && m.discord === discord);
//     if (!medic) {
//       alert('بيانات غير صحيحة');
//       return;
//     }
//     localStorage.setItem('activeMedic', JSON.stringify(medic));
//     localStorage.setItem('activeCode', medic.id);
//     window.location.href = 'index.html';
//   });
// });

/**
 * معالجة تسجيل دخول الموظف
 */
async function handleEmployeeLogin(e) {
    e.preventDefault();
    
    const employeeName = document.getElementById('employeeName')?.value.trim();
    
    if (!employeeName) {
        showNotification('بيانات ناقصة', 'الرجاء إدخال اسم الموظف', 'error');
        return;
    }

    try {
        // حفظ بيانات الموظف
        const employeeData = {
            name: employeeName,
            role: 'employee',
            loginTime: new Date().toLocaleString('ar-SA')
        };

        sessionStorage.setItem('employeeData', JSON.stringify(employeeData));
        showNotification('بيانات صحيحة', `مرحباً بك ${employeeName}! تم تسجيل دخولك بنجاح`, 'success');
        
        // الانتقال إلى الصفحة الرئيسية بعد ثانية
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showNotification('خطأ في النظام', 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى', 'error');
    }
}

/**
 * معالجة تسجيل دخول المسعف (النموذج الجديد)
 */
async function handleMedicLogin(e) {
    e.preventDefault();
    
    const code = document.getElementById('paramedicCode')?.value.trim();
    const discordId = document.getElementById('discordId')?.value.trim();
    const loginBtn = document.querySelector('#loginForm button[type="submit"]');

    if (!code || !discordId) {
        showNotification('خطأ', 'الرجاء إدخال كافة البيانات المطلوبة', 'error');
        return;
    }

    try {
        // إظهار حالة التحميل
        const originalBtnText = loginBtn?.innerHTML;
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري التحقق...';
        }

        let error = null;
        const medic = await db.getMedicByCode(code);
        console.log('البحث بالكود:', code, 'النتيجة:', medic);
        console.log('مقارنة discord_id:', medic?.discord_id, 'مع المدخل:', discordId);
        if (!medic || medic.discord_id !== discordId) {
            error = { message: 'بيانات غير مطابقة' };
        }

        // إعادة تعيين حالة الزر
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalBtnText;
        }

        if (error || !medic) {
            showNotification('خطأ في البيانات', 'الكود أو كلمة السر غير صحيحة. يرجى التحقق من البيانات والمحاولة مرة أخرى', 'error');
            return;
        }

        // حفظ بيانات الجلسة
        localStorage.setItem('activeCode', medic.id);
        localStorage.setItem('discordId', medic.discord_id);
        localStorage.setItem('activeMedic', JSON.stringify(medic));

        showNotification('بيانات صحيحة', `مرحباً بك ${medic.name || code}! تم تسجيل دخولك بنجاح وجاري التحويل للصفحة الرئيسية...`, 'success');
        
        // الانتقال إلى الصفحة الرئيسية بعد 1.5 ثانية
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showNotification('خطأ في النظام', 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى', 'error');
        
        // إعادة تعيين حالة الزر في حالة الخطأ
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'تسجيل الدخول';
        }
    }
}

/**
 * معالجة تسجيل دخول المسعف (النموذج القديم - للتوافقية)
 */
async function handleLegacyMedicLogin() {
    const id = document.getElementById('medic_id')?.value.trim();
    const code = document.getElementById('medic_code')?.value.trim();

    if (!id || !code) {
        showNotification('بيانات ناقصة', 'الرجاء إدخال كافة البيانات المطلوبة', 'error');
        return;
    }

    try {
        let error = null;
        const data = await db.getMedicById(id);
        if (!data || data.code !== code) {
            error = { message: 'بيانات غير مطابقة' };
        }

        if (error || !data) {
            showNotification('خطأ في البيانات', 'بيانات الدخول غير صحيحة. يرجى التحقق من البيانات والمحاولة مرة أخرى', 'error');
            return;
        }

        // حفظ بيانات الجلسة
        localStorage.setItem('activeMedic', JSON.stringify(data));
        showNotification('بيانات صحيحة', `مرحباً بك ${data.name || id}! تم تسجيل دخولك بنجاح وجاري التحويل للصفحة الرئيسية...`, 'success');
        
        // الانتقال إلى الصفحة الرئيسية بعد 1.5 ثانية
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showNotification('خطأ في النظام', 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى', 'error');
    }
}
