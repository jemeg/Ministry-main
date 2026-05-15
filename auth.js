// Firebase Authentication
import { firebaseLegacy, firebaseHelpers } from './firebase.js';

// ================== دالة تسجيل الدخول ==================
async function login(paramedicCode, discordId) {
    try {
        console.log('جاري تسجيل الدخول...');
        
        // البحث عن المسعف باستخدام Firebase
        const medics = await firebaseHelpers.getAllMedics();
        const medic = medics.find(m => 
            m.code === paramedicCode && 
            m.discord === discordId
        );
        
        if (!medic) {
            throw new Error('بيانات الدخول غير صحيحة');
        }

        // حفظ بيانات المسعف في localStorage
        const medicData = {
            id: medic.id,
            code: medic.code,
            name: medic.name,
            role: medic.role || 'medic',
            rank: medic.rank || 'member',
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('activeMedic', JSON.stringify(medicData));

        // تسجيل وقت الدخول في الجلسات
        await recordLogin(medicData.id);

        return { success: true, medic: medicData };
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        return { success: false, error: error.message };
    }
}

// ================== دالة تسجيل الخروج ==================
async function logout() {
    try {
        const medic = JSON.parse(localStorage.getItem('activeMedic'));
        if (medic && medic.id) {
            await recordLogout(medic.id);
        }
        localStorage.removeItem('activeMedic');
        window.location.href = 'login.html';
        return { success: true };
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        return { success: false, error: error.message };
    }
}

// ================== تسجيل وقت الدخول ==================
async function recordLogin(medicId) {
    try {
        const now = new Date();
        const loginTime = now.toISOString();
        
        // حفظ في localStorage
        localStorage.setItem(medicId + '_login', loginTime);
        
        // حفظ في Firebase
        const sessionData = {
            medic_id: medicId,
            login_time: loginTime,
            date: now.toISOString().split('T')[0],
            start_time: now.toTimeString().substring(0, 8)
        };
        
        await firebaseLegacy.addMedicSession(sessionData);
        console.log('تم تسجيل وقت الدخول بنجاح');
        
    } catch (error) {
        console.error('خطأ في تسجيل وقت الدخول:', error);
    }
}

// ================== تسجيل وقت الخروج ==================
async function recordLogout(medicId) {
    try {
        const now = new Date();
        const logoutTime = now.toISOString();
        
        // حفظ في localStorage
        localStorage.setItem(medicId + '_logout', logoutTime);
        
        // حساب مدة العمل
        const loginTimeISO = localStorage.getItem(medicId + '_login');
        if (loginTimeISO) {
            const loginDate = new Date(loginTimeISO);
            const durationMs = now.getTime() - loginDate.getTime();
            const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);
            
            // حفظ ساعات العمل
            localStorage.setItem(medicId + '_hours', durationHours);
            
            // تحديث Firebase
            const sessions = await firebaseHelpers.getMedicSessions(medicId);
            const activeSession = sessions.find(s => 
                s.medic_id === medicId && 
                !s.logout_time
            );
            
            if (activeSession) {
                await firebaseHelpers.updateMedicSession(activeSession.id, {
                    logout_time: logoutTime,
                    end_time: now.toTimeString().substring(0, 8),
                    total_hours: durationHours
                });
            }
            
            // تحديث إجمالي الساعات في Firebase
            const medics = await firebaseHelpers.getAllMedics();
            const medic = medics.find(m => m.id === medicId);
            if (medic) {
                const currentTotal = parseFloat(medic.total_hours || 0);
                const newTotal = (currentTotal + parseFloat(durationHours)).toFixed(2);
                await firebaseHelpers.updateMedic(medicId, {
                    total_hours: newTotal
                });
            }
        }
        
        console.log('تم تسجيل وقت الخروج بنجاح');
        
    } catch (error) {
        console.error('خطأ في تسجيل وقت الخروج:', error);
    }
}

// ================== إضافة نقاط ==================
async function addPoints(medicId, amount, reason) {
    try {
        await firebaseHelpers.addPoints(medicId, amount, reason);
        console.log('تم إضافة النقاط بنجاح');
        return { success: true };
    } catch (error) {
        console.error('خطأ في إضافة النقاط:', error);
        return { success: false, error: error.message };
    }
}

// ================== حساب مجموع النقاط ==================
async function getTotalPoints(medicId) {
    try {
        const points = await firebaseHelpers.getPoints(medicId);
        const total = points.reduce((sum, point) => sum + (point.amount || 0), 0);
        return total;
    } catch (error) {
        console.error('خطأ في حساب النقاط:', error);
        return 0;
    }
}

// ================== حفظ ساعات تواجد المسعف ==================
async function saveMedicHours(medicId, date, startTime, endTime, totalHours) {
    try {
        await firebaseLegacy.saveMedicHours(medicId, date, startTime, endTime, totalHours);
        console.log('تم حفظ ساعات التواجد بنجاح');
        return { success: true };
    } catch (error) {
        console.error('خطأ في حفظ ساعات التواجد:', error);
        return { success: false, error: error.message };
    }
}

// ================== جلب بيانات المسعف النشط ==================
function getActiveMedic() {
    try {
        const medic = localStorage.getItem('activeMedic');
        return medic ? JSON.parse(medic) : null;
    } catch (error) {
        console.error('خطأ في جلب بيانات المسعف النشط:', error);
        return null;
    }
}

// ================== جلب جميع المسعفين ==================
async function getAllMedics() {
    try {
        const medics = await firebaseHelpers.getAllMedics();
        return medics;
    } catch (error) {
        console.error('خطأ في جلب بيانات المسعفين:', error);
        return [];
    }
}

// ================== إضافة مسعف جديد ==================
async function addNewMedic(medicData) {
    try {
        const medicId = await firebaseHelpers.addMedic(medicData);
        console.log('تم إضافة المسعف بنجاح');
        return { success: true, id: medicId };
    } catch (error) {
        console.error('خطأ في إضافة المسعف:', error);
        return { success: false, error: error.message };
    }
}

// ================== تحديث بيانات المسعف ==================
async function updateMedicData(medicId, updateData) {
    try {
        await firebaseHelpers.updateMedic(medicId, updateData);
        console.log('تم تحديث بيانات المسعف بنجاح');
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث بيانات المسعف:', error);
        return { success: false, error: error.message };
    }
}

// ================== حذف مسعف ==================
async function deleteMedicData(medicId) {
    try {
        await firebaseHelpers.deleteMedic(medicId);
        console.log('تم حذف المسعف بنجاح');
        return { success: true };
    } catch (error) {
        console.error('خطأ في حذف المسعف:', error);
        return { success: false, error: error.message };
    }
}

// ================== جلب الجلسات ==================
async function getMedicSessions(medicId) {
    try {
        const sessions = await firebaseHelpers.getMedicSessions(medicId);
        return sessions;
    } catch (error) {
        console.error('خطأ في جلب الجلسات:', error);
        return [];
    }
}

// ================== جلب الإشعارات ==================
async function getNotifications(medicId) {
    try {
        const notifications = await firebaseHelpers.getNotifications(medicId);
        return notifications;
    } catch (error) {
        console.error('خطأ في جلب الإشعارات:', error);
        return [];
    }
}

// ================== إضافة إشعار ==================
async function addNotification(notificationData) {
    try {
        const notificationId = await firebaseHelpers.addNotification(notificationData);
        console.log('تم إضافة الإشعار بنجاح');
        return { success: true, id: notificationId };
    } catch (error) {
        console.error('خطأ في إضافة الإشعار:', error);
        return { success: false, error: error.message };
    }
}

// ================== تحديد إشعار كمقروء ==================
async function markNotificationAsRead(notificationId) {
    try {
        await firebaseHelpers.markNotificationAsRead(notificationId);
        console.log('تم تحديد الإشعار كمقروء');
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديد الإشعار كمقروء:', error);
        return { success: false, error: error.message };
    }
}

// تصدير الدوال للاستخدام في الملفات الأخرى
window.login = login;
window.logout = logout;
window.recordLogin = recordLogin;
window.recordLogout = recordLogout;
window.addPoints = addPoints;
window.getTotalPoints = getTotalPoints;
window.saveMedicHours = saveMedicHours;
window.getActiveMedic = getActiveMedic;
window.getAllMedics = getAllMedics;
window.addNewMedic = addNewMedic;
window.updateMedicData = updateMedicData;
window.deleteMedicData = deleteMedicData;
window.getMedicSessions = getMedicSessions;
window.getNotifications = getNotifications;
window.addNotification = addNotification;
window.markNotificationAsRead = markNotificationAsRead;
async function recordLogin(medicId) {
    const loginTime = new Date().toISOString();
    localStorage.setItem(medicId + '_login', loginTime);

    // إضافة أو تحديث جلسة المسعف
    await db.upsertMedicSession({
        medic_id: medicId,
        login_time: loginTime,
        status: 'active'
    });
}

// ================== تسجيل وقت الخروج ==================
async function recordLogout(medicId) {
    const logoutTime = new Date().toISOString();
    const loginTime = localStorage.getItem(medicId + '_login');
    if (!loginTime) return;

    const durationMs = new Date(logoutTime) - new Date(loginTime);
    const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);

    // الحصول على الجلسة الفعالة
    const activeSession = await db.getActiveSessionByMedic(medicId);
    if (activeSession) {
        activeSession.logout_time = logoutTime;
        activeSession.duration = durationHours;
        activeSession.status = 'completed';
        activeSession.updated_at = new Date().toISOString();
        await db.upsertMedicSession(activeSession);
    }

    await updateTotalHours(medicId, durationHours);
    localStorage.removeItem(medicId + '_login');
}

// ================== تحديث إجمالي الساعات ==================
async function updateTotalHours(medicId, hoursToAdd) {
    const medic = await db.getMedicById(medicId);
    if (!medic) return;
    const current = parseFloat(medic.total_hours || 0);
    const newTotal = (current + parseFloat(hoursToAdd)).toFixed(2);
    medic.total_hours = newTotal;
    await db.addMedic(medic);
}

// ================== التحقق من حالة تسجيل الدخول ==================
function checkAuth() {
    const medic = JSON.parse(localStorage.getItem('activeMedic') || 'null');
    if (!medic || !medic.id) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ================== التحقق من انتهاء الجلسة ==================
function checkSession() {
    const lastActivity = localStorage.getItem('lastActivity');
    const sessionTimeout = 60 * 60 * 1000; // 60 دقيقة
    if (lastActivity && Date.now() - lastActivity > sessionTimeout) {
        logout();
        return false;
    }
    localStorage.setItem('lastActivity', Date.now());
    return true;
}

document.addEventListener('mousemove', () => localStorage.setItem('lastActivity', Date.now()));
document.addEventListener('keypress', () => localStorage.setItem('lastActivity', Date.now()));

// تصدير الدوال
window.auth = { login, logout, checkAuth, checkSession, recordLogin, recordLogout };
async function login(paramedicCode, discordId) {
    try {
        // التحقق من البيانات في قاعدة بيانات Firebase
        const medics = await firebaseHelpers.getAllMedics();
        const medic = medics.find(m => 
            m.code === paramedicCode && 
            m.discord === discordId
        );

        if (!medic) throw new Error('بيانات الدخول غير صحيحة');

        // حفظ بيانات المسعف في localStorage
        const medicData = {
            id: medic.id,
            code: medic.code,
            name: medic.name,
            role: medic.role || 'medic',
            rank: medic.rank || 'member',
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('activeMedic', JSON.stringify(medicData));
        
        // تسجيل وقت الدخول في السجل
        await recordLogin(medicData.id);
        
        return { success: true, medic: medicData };
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        return { success: false, error: error.message };
    }
}

// دالة تسجيل الخروج
async function logout() {
    try {
        const medic = JSON.parse(localStorage.getItem('activeMedic'));
        
        if (medic && medic.id) {
            // تسجيل وقت الخروج في السجل
            await recordLogout(medic.id);
        }
        
        // مسح بيانات الجلسة
        localStorage.removeItem('activeMedic');
        
        // إعادة التوجيه إلى صفحة تسجيل الدخول
        window.location.href = 'login.html';
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        return { success: false, error: error.message };
    }
}

// تسجيل وقت الدخول
async function recordLogin(medicId) {
    try {
        const loginTime = new Date().toISOString();
        
        // حفظ في السجل المحلي للاستخدام الفوري
        localStorage.setItem(medicId + '_login', loginTime);
        
        // حفظ في Firebase
        const sessionData = {
            medic_id: medicId,
            login_time: loginTime,
            date: new Date().toISOString().split('T')[0],
            start_time: new Date().toTimeString().substring(0, 8),
            status: 'active'
        };
        
        await firebaseHelpers.addMedicSession(sessionData);
        return sessionData;
    } catch (error) {
        console.error('خطأ في تسجيل وقت الدخول:', error);
        throw error;
    }
}

// تسجيل وقت الخروج
async function recordLogout(medicId) {
    try {
        const logoutTime = new Date().toISOString();
        
        // الحصول على وقت الدخول
        const loginTime = localStorage.getItem(medicId + '_login');
        
        if (!loginTime) {
            console.warn('لم يتم العثور على وقت دخول للمسعف');
            return;
        }
        
        // حساب مدة التواجد
        const durationMs = new Date(logoutTime) - new Date(loginTime);
        const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);
        
        // تحديث السجل في Firebase
        const sessions = await firebaseHelpers.getMedicSessions(medicId);
        const activeSession = sessions.find(s => 
            s.medic_id === medicId && 
            s.status === 'active'
        );
        
        if (activeSession) {
            await firebaseHelpers.updateMedicSession(activeSession.id, {
                logout_time: logoutTime,
                end_time: new Date().toTimeString().substring(0, 8),
                total_hours: durationHours,
                status: 'completed'
            });
        }
        
        // تحديث إجمالي الساعات في جدول المسعفين
        await updateTotalHours(medicId, durationHours);
        
        // مسح البيانات المحلية
        localStorage.removeItem(medicId + '_login');
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في تسجيل وقت الخروج:', error);
        throw error;
    }
}

// تحديث إجمالي ساعات العمل
async function updateTotalHours(medicId, hoursToAdd) {
    try {
        // الحصول على بيانات المسعف من Firebase
        const medics = await firebaseHelpers.getAllMedics();
        const medic = medics.find(m => m.id === medicId);
        
        if (!medic) throw new Error('المسعف غير موجود');
        
        // تحديث إجمالي الساعات
        const newTotal = (parseFloat(medic.total_hours || 0) + parseFloat(hoursToAdd)).toFixed(2);
        
        await firebaseHelpers.updateMedic(medicId, { total_hours: newTotal });
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث إجمالي الساعات:', error);
        throw error;
    }
}

// التحقق من حالة تسجيل الدخول
function checkAuth() {
    const medic = JSON.parse(localStorage.getItem('activeMedic') || 'null');
    if (!medic || !medic.id) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// التحقق من انتهاء الجلسة
function checkSession() {
    const lastActivity = localStorage.getItem('lastActivity');
    const sessionTimeout = 60 * 60 * 1000; // 60 دقيقة
    
    if (lastActivity && (Date.now() - lastActivity > sessionTimeout)) {
        // انتهت الجلسة، تسجيل الخروج التلقائي
        logout();
        return false;
    }
    
    // تحديث وقت آخر نشاط
    localStorage.setItem('lastActivity', Date.now());
    return true;
}

// تحديث وقت النشاط عند التفاعل مع الصفحة
document.addEventListener('mousemove', () => localStorage.setItem('lastActivity', Date.now()));
document.addEventListener('keypress', () => localStorage.setItem('lastActivity', Date.now()));

// تصدير الدوال
window.auth = {
    login,
    logout,
    checkAuth,
    checkSession,
    recordLogin,
    recordLogout
};
