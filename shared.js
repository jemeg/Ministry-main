// نظام تكامل موحد لجميع الصفحات
// Shared Integration System for All Pages

class MinistrySystem {
    constructor() {
        this.init();
    }

    init() {
        console.log('🚀 بدء تشغيل نظام وزارة الصحة الموحد');
        this.setupEventListeners();
        this.checkSession();
    }

    // التحقق من الجلسة
    checkSession() {
        const medic = JSON.parse(localStorage.getItem('activeMedic') || 'null');
        const activeCode = localStorage.getItem('activeCode');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        console.log('🔍 التحقق من الجلسة:', {
            medic: medic?.name || 'null',
            activeCode: activeCode || 'null',
            currentUser: currentUser?.name || 'null'
        });

        return { medic, activeCode, currentUser };
    }

    // حفظ جلسة المسعف
    saveMedicSession(medic) {
        console.log('💾 حفظ جلسة المسعف:', medic.name);
        
        localStorage.setItem('activeCode', medic.id);
        localStorage.setItem('discordId', medic.discord);
        localStorage.setItem('activeMedic', JSON.stringify(medic));
        
        console.log('✅ تم حفظ الجلسة بنجاح');
        return true;
    }

    // حفظ جلسة الإدمن
    saveAdminSession(admin) {
        console.log('💾 حفظ جلسة الإدمن:', admin.name);
        
        localStorage.setItem('currentUser', JSON.stringify(admin));
        
        console.log('✅ تم حفظ جلسة الإدمن بنجاح');
        return true;
    }

    // تسجيل الخروج
    logout() {
        console.log('🚪 تسجيل الخروج من النظام');
        
        localStorage.removeItem('activeMedic');
        localStorage.removeItem('activeCode');
        localStorage.removeItem('discordId');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('employeeData');
        
        console.log('✅ تم تسجيل الخروج بنجاح');
        window.location.href = 'login.html';
    }

    // التحقق من صلاحيات الإدمن
    checkAdminPermissions() {
        const { medic, currentUser } = this.checkSession();
        
        if (currentUser) {
            // الإدمن دائماً لديه صلاحيات
            return true;
        }
        
        if (medic) {
            // هذه الرتب لديها صلاحيات الإدمن
            const adminRoles = ['وزير', 'نائب وزير', 'مدير مستشفى'];
            return adminRoles.includes(medic.rank);
        }
        
        return false;
    }

    // عرض بيانات الموظف في الصفحة
    displayEmployeeInfo() {
        const { medic, currentUser } = this.checkSession();
        
        const nameElement = document.getElementById('employeeName');
        const idElement = document.getElementById('employeeId');
        
        if (medic) {
            console.log('👤 عرض بيانات المسعف:', medic.name);
            
            if (nameElement) {
                nameElement.textContent = medic.name || 'مسعف';
                console.log('✅ تم تحديث الاسم:', nameElement.textContent);
            } else {
                console.warn('⚠️ لم يتم العثور على عنصر employeeName');
            }
            
            if (idElement) {
                idElement.textContent = `كود: ${medic.code || 'غير معروف'}`;
                console.log('✅ تم تحديث الكود:', idElement.textContent);
            } else {
                console.warn('⚠️ لم يتم العثور على عنصر employeeId');
            }
        } else if (currentUser) {
            console.log('👨‍💼 عرض بيانات الإدمن:', currentUser.name);
            
            if (nameElement) {
                nameElement.textContent = currentUser.name || 'مدير';
            }
            
            if (idElement) {
                idElement.textContent = `كود: ${currentUser.id || 'admin'}`;
            }
        }
    }

    // عرض/إخفاء زر الإدمن
    toggleAdminButton() {
        const adminBtn = document.getElementById('adminBtn');
        
        if (adminBtn) {
            if (this.checkAdminPermissions()) {
                adminBtn.classList.remove('d-none');
                console.log('✅ تم إظهار زر لوحة التحكم');
            } else {
                adminBtn.classList.add('d-none');
                console.log('🔒 تم إخفاء زر لوحة التحكم');
            }
        }
    }

    // التحويل بين الصفحات
    navigateTo(page, checkSession = true) {
        console.log(`🔄 التحويل إلى صفحة: ${page}`);
        
        if (checkSession) {
            const { medic, activeCode, currentUser } = this.checkSession();
            
            if (!medic && !activeCode && !currentUser) {
                console.warn('⚠️ لا توجد جلسة نشطة، سيتم التحويل لصفحة تسجيل الدخول');
                window.location.href = 'login.html';
                return false;
            }
        }
        
        window.location.href = page;
        return true;
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // إضافة مستمعي الأحداث العامة
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 تم تحميل الصفحة بنجاح');
            this.onPageLoad();
        });

        // إضافة مستمعي الأحداث للأزرار
        this.setupButtonListeners();
    }

    // عند تحميل الصفحة
    onPageLoad() {
        const currentPage = this.getCurrentPage();
        console.log(`📍 الصفحة الحالية: ${currentPage}`);
        
        switch (currentPage) {
            case 'index.html':
                this.handleIndexPage();
                break;
            case 'admin.html':
                this.handleAdminPage();
                break;
            case 'login.html':
                this.handleLoginPage();
                break;
        }
    }

    // الحصول على اسم الصفحة الحالية
    getCurrentPage() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop();
        return fileName || 'index.html';
    }

    // معالجة الصفحة الرئيسية
    handleIndexPage() {
        console.log('🏠 معالجة الصفحة الرئيسية');
        
        const { medic, activeCode, currentUser } = this.checkSession();
        
        if (!medic && !activeCode && !currentUser) {
            console.log('❌ لا توجد جلسة نشطة، التحويل لصفحة تسجيل الدخول');
            this.navigateTo('login.html', false);
            return;
        }
        
        console.log('✅ الجلسة صالحة، متابعة تحميل الصفحة الرئيسية');
        
        // عرض بيانات الموظف
        this.displayEmployeeInfo();
        
        // عرض/إخفاء زر الإدمن
        this.toggleAdminButton();
        
        // تحميل الإشعارات والترقيات
        this.loadNotifications();
        this.loadPromotions();
    }

    // معالجة صفحة الإدمن
    handleAdminPage() {
        console.log('⚙️ معالجة صفحة الإدمن');
        
        const { currentUser } = this.checkSession();
        
        if (!currentUser || currentUser.type !== 'admin') {
            console.log('❌ المستخدم ليس إدمن، التحويل لصفحة تسجيل الدخول');
            this.navigateTo('login.html', false);
            return;
        }
        
        console.log('✅ المستخدم إدمن، متابعة تحميل صفحة الإدمن');
        
        // عرض اسم الإدمن
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) {
            adminNameElement.textContent = currentUser.name;
        }
    }

    // معالجة صفحة تسجيل الدخول
    handleLoginPage() {
        console.log('🔐 معالجة صفحة تسجيل الدخول');
        
        // مسح أي جلسة قديمة
        const { medic, activeCode, currentUser } = this.checkSession();
        
        if (medic || activeCode || currentUser) {
            console.log('🔄 توجد جلسة نشطة، سيتم مسحها');
            this.logout();
        }
    }

    // تحميل الإشعارات
    loadNotifications() {
        const { medic } = this.checkSession();
        
        if (!medic) return;
        
        console.log('🔔 تحميل الإشعارات للمسعف:', medic.name);
        
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const medicNotifications = notifications.filter(n => n.medicId === medic.id && !n.read);
        
        if (medicNotifications.length > 0) {
            const notificationsSection = document.getElementById('notificationsSection');
            const notificationsList = document.getElementById('notificationsList');
            
            if (notificationsSection && notificationsList) {
                notificationsSection.style.display = 'block';
                
                notificationsList.innerHTML = medicNotifications.map(notif => {
                    const typeClass = notif.type === 'disconnect' ? 'danger' : notif.type === 'warning' ? 'warning' : 'info';
                    const typeIcon = notif.type === 'disconnect' ? 'fa-user-times' : notif.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
                    
                    return `
                        <div class="alert alert-${typeClass} alert-dismissible mb-2">
                            <div class="d-flex align-items-center">
                                <i class="fas ${typeIcon} me-2"></i>
                                <div class="flex-grow-1">
                                    <strong>${notif.type === 'disconnect' ? '⚠️ تحذير فصل' : notif.type === 'warning' ? '⚠️ تحذير' : 'ℹ️ معلومة'}</strong>
                                    <p class="mb-1">${notif.message}</p>
                                    <small class="text-muted">${new Date(notif.timestamp).toLocaleString('ar-SA')}</small>
                                </div>
                                <button type="button" class="btn-close" onclick="ministrySystem.markNotificationAsRead('${notif.id}')"></button>
                            </div>
                        </div>
                    `;
                }).join('');
                
                console.log(`✅ تم عرض ${medicNotifications.length} إشعارات`);
            }
        }
    }

    // تحميل الترقيات
    loadPromotions() {
        const { medic } = this.checkSession();
        
        if (!medic) return;
        
        console.log('🏆 تحميل الترقيات للمسعف:', medic.name);
        
        const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
        const medicCertificates = certificates.filter(c => c.medicId === medic.id);
        
        if (medicCertificates.length > 0) {
            const promotionsSection = document.getElementById('promotionsSection');
            const promotionsList = document.getElementById('promotionsList');
            
            if (promotionsSection && promotionsList) {
                promotionsSection.style.display = 'block';
                
                promotionsList.innerHTML = medicCertificates.map(cert => `
                    <div class="card mb-3 border-success">
                        <div class="card-header bg-success text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-award me-2"></i>
                                شهادة الترقية - ${new Date(cert.issuedAt).toLocaleDateString('ar-SA')}
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="mb-2"><strong>الاسم:</strong> ${cert.medicName}</p>
                                    <p class="mb-2"><strong>الترقية من:</strong> ${cert.oldRank}</p>
                                    <p class="mb-2"><strong>الترقية إلى:</strong> ${cert.newRank}</p>
                                </div>
                                <div class="col-md-6">
                                    <p class="mb-2"><strong>السبب:</strong> ${cert.reason}</p>
                                    <p class="mb-2"><strong>صادرت من:</strong> ${cert.issuedBy}</p>
                                    <p class="mb-2"><strong>التاريخ:</strong> ${new Date(cert.issuedAt).toLocaleDateString('ar-SA')}</p>
                                </div>
                            </div>
                            <div class="mt-3 text-center">
                                <button class="btn btn-success" onclick="ministrySystem.downloadCertificate('${cert.id}')">
                                    <i class="fas fa-download me-2"></i>تحميل الشهادة
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                console.log(`✅ تم عرض ${medicCertificates.length} شهادة ترقية`);
            }
        }
    }

    // تحديد الإشعار كمقروء
    markNotificationAsRead(notificationId) {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const notificationIndex = notifications.findIndex(n => n.id === notificationId);
        
        if (notificationIndex !== -1) {
            notifications[notificationIndex].read = true;
            localStorage.setItem('notifications', JSON.stringify(notifications));
            this.loadNotifications();
            console.log('✅ تم تحديد الإشعار كمقروء');
        }
    }

    // تحميل الشهادة
    downloadCertificate(certificateId) {
        const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
        const certificate = certificates.find(c => c.id === certificateId);
        
        if (!certificate) {
            console.error('❌ الشهادة غير موجودة');
            alert('الشهادة غير موجودة');
            return;
        }
        
        console.log('📄 تحميل الشهادة:', certificate.medicName);
        
        // إنشاء محتوى الشهادة
        const certificateContent = `
            <div style="text-align: center; font-family: Arial; padding: 50px; border: 3px solid #FFD700; max-width: 800px; margin: 0 auto;">
                <h1 style="color: #FFD700; margin-bottom: 30px;">شهادة الترقية</h1>
                <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                    <h2 style="margin-bottom: 20px;">وزارة الصحة</h2>
                    <p style="margin-bottom: 10px;">ت certify أن</p>
                    <h3 style="margin-bottom: 20px;">${certificate.medicName}</h3>
                    <p style="margin-bottom: 10px;">تم ترقيته من</p>
                    <h4 style="margin-bottom: 10px;">${certificate.oldRank}</h4>
                    <p style="margin-bottom: 10px;">إلى</p>
                    <h4 style="margin-bottom: 20px;">${certificate.newRank}</h4>
                </div>
                <div style="margin-bottom: 30px;">
                    <h5 style="color: #333; margin-bottom: 15px;">سبب الترقية:</h5>
                    <p style="color: #666; line-height: 1.6;">${certificate.reason}</p>
                </div>
                <div style="margin-top: 50px;">
                    <p style="margin-bottom: 10px;">صدرت في: ${new Date(certificate.issuedAt).toLocaleDateString('ar-SA')}</p>
                    <p style="margin-bottom: 10px;">صادرت من: ${certificate.issuedBy}</p>
                </div>
            </div>
        `;
        
        // إنشاء نافذة جديدة للطباعة
        const printWindow = window.open('Ghazwan-MG', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>شهادة الترقية - ${certificate.medicName}</title>
                    <style>
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${certificateContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // إعداد مستمعي الأزرار
    setupButtonListeners() {
        // زر تسجيل الخروج
        const logoutBtn = document.querySelector('[onclick*="logout"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // زر لوحة التحكم
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('admin.html');
            });
        }
    }
}

// إنشاء نسخة عالمية من النظام
const ministrySystem = new MinistrySystem();

// تصدير الدوال للاستخدام في الصفحات الأخرى
window.ministrySystem = ministrySystem;
window.navigateTo = (page) => ministrySystem.navigateTo(page);
window.logout = () => ministrySystem.logout();
window.checkAdminPermissions = () => ministrySystem.checkAdminPermissions();

console.log('✅ تم تحميل نظام وزارة الصحة الموحد بنجاح');
