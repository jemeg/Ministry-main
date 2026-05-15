// استيراد قاعدة البيانات
import { Database } from './database.js';
const db = new Database();

// Firebase Integration
import { firebaseHelpers } from './firebase.js';

// البيانات الأولية
const initialData = [];

// ================== تحميل بيانات المسعفين ==================
async function loadMedicsForCheckIn() {
    const tbody = document.getElementById('paramedicTableBody');
    if (!tbody) {
        console.error('لم يتم العثور على الجدول!');
        return;
    }

    try {
        console.log('جاري جلب بيانات المسعفين من Firebase...');
        
        // جلب البيانات من Firebase
        const medics = await firebaseHelpers.getAllMedics();
        
        console.log('بيانات Firebase:', medics);

        if (!medics || medics.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا يوجد مسعفين مسجلين</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        medics.forEach(medic => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${medic.name || 'غير معروف'}</td>
                <td>${medic.code || 'N/A'}</td>
                <td>+18</td>
                <td id="in-${medic.code}">
                    <button class="btn btn-success btn-sm" onclick="recordCheckIn('${medic.code}')">
                        تسجيل الدخول
                    </button>
                </td>
                <td id="out-${medic.code}">
                    <button class="btn btn-danger btn-sm" onclick="recordCheckOut('${medic.code}')">
                        تسجيل الخروج
                    </button>
                </td>
                <td id="hours-${medic.code}">0 ساعة</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="showMedicDetails('${medic.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // تحديث حالة المسعفين المسجلين
        updateCheckInStatus();
        
    } catch (error) {
        console.error('خطأ في جلب بيانات المسعفين:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">خطأ في تحميل البيانات</td></tr>';
    }
}

// ================== تسجيل الدخول ==================
async function recordCheckIn(paramedicId) {
    try {
        console.log('تسجيل دخول:', paramedicId);
        
        const now = new Date();
        const formatted = formatTime(now);
        
        const inCell = document.getElementById("in-" + paramedicId);
        inCell.textContent = formatted;

        // حفظ وقت الدخول في localStorage
        localStorage.setItem(paramedicId + "_login", now.toISOString());

        // حفظ في Firebase
        const sessionData = {
            medic_id: paramedicId,
            login_time: now.toISOString(),
            date: now.toISOString().split('T')[0],
            start_time: now.toTimeString().substring(0, 8),
            status: 'active'
        };
        
        await firebaseHelpers.addMedicSession(sessionData);

        // عرض زر الخروج
        const outCell = document.getElementById("out-" + paramedicId);
        outCell.innerHTML = '<button class="btn btn-danger btn-sm" onclick="recordCheckOut(\'' + paramedicId + '\')">تسجيل الخروج</button>';

        console.log('تم تسجيل الدخول بنجاح');
        
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        alert('خطأ في تسجيل الدخول: ' + error.message);
    }
}

// ================== تسجيل الخروج ==================
async function recordCheckOut(paramedicId) {
    try {
        console.log('تسجيل خروج:', paramedicId);
        
        const now = new Date();
        const formatted = formatTime(now);
        
        const outCell = document.getElementById("out-" + paramedicId);
        outCell.textContent = formatted;

        // حفظ وقت الخروج في localStorage
        localStorage.setItem(paramedicId + "_logout", now.toISOString());

        // حساب مدة العمل
        const loginTimeISO = localStorage.getItem(paramedicId + "_login");
        if (loginTimeISO) {
            const loginDate = new Date(loginTimeISO);
            const duration = calculateDuration(loginDate, now);
            const hoursCell = document.getElementById("hours-" + paramedicId);
            hoursCell.textContent = duration.toFixed(2) + " ساعة";

            // حفظ ساعات العمل في localStorage
            localStorage.setItem(paramedicId + "_hours", duration.toFixed(2));

            // تحديث Firebase
            const sessions = await firebaseHelpers.getMedicSessions(paramedicId);
            const activeSession = sessions.find(s => 
                s.medic_id === paramedicId && 
                !s.logout_time
            );
            
            if (activeSession) {
                await firebaseHelpers.updateMedicSession(activeSession.id, {
                    logout_time: now.toISOString(),
                    end_time: now.toTimeString().substring(0, 8),
                    total_hours: duration.toFixed(2),
                    status: 'completed'
                });
            }

            // حذف وقت الدخول (لمنع التكرار في الحساب القادم)
            localStorage.removeItem(paramedicId + "_login");
        }

        // تعطيل زر الخروج
        const inCell = document.getElementById("in-" + paramedicId);
        inCell.querySelector("button").disabled = true;
        
        console.log('تم تسجيل الخروج بنجاح');
        
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        alert('خطأ في تسجيل الخروج: ' + error.message);
    }
}

// ================== تحديث حالة تسجيل الدخول ==================
function updateCheckInStatus() {
    try {
        const activeCode = localStorage.getItem("activeCode");
        if (!activeCode) return;

        const medics = JSON.parse(localStorage.getItem('medicsList') || '[]');
        medics.forEach(id => {
            const loginISO = localStorage.getItem(id + "_login");
            const logoutISO = localStorage.getItem(id + "_logout");
            const hours = localStorage.getItem(id + "_hours");

            const inCell = document.getElementById("in-" + id);
            const outCell = document.getElementById("out-" + id);
            const hoursCell = document.getElementById("hours-" + id);

            if (loginISO && (!logoutISO || new Date(loginISO) > new Date(logoutISO))) {
                // تسجيل دخول نشط
                inCell.textContent = formatTime(new Date(loginISO));
                outCell.innerHTML = '<button class="btn btn-danger btn-sm" onclick="recordCheckOut(\'' + id + '\')">تسجيل الخروج</button>';
            } else if (logoutISO) {
                // تسجيل خروج
                inCell.textContent = formatTime(new Date(logoutISO));
                outCell.textContent = formatTime(new Date(logoutISO));
                hoursCell.textContent = hours + " ساعة";
            }
        });
    } catch (error) {
        console.error('خطأ في تحديث حالة تسجيل الدخول:', error);
    }
}

// ================== تنسيق الوقت ==================
function formatTime(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return 'غير صحيح';
    }
    return date.toLocaleTimeString('ar-SA');
}

// ================== حساب المدة ==================
function calculateDuration(startDate, endDate) {
    const durationMs = endDate.getTime() - startDate.getTime();
    return durationMs / (1000 * 60 * 60); // تحويل إلى ساعات
}

// ================== عرض تفاصيل المسعف ==================
async function showMedicDetails(medicId) {
    try {
        console.log('عرض تفاصيل المسعف:', medicId);
        
        const sessions = await firebaseHelpers.getMedicSessions(medicId);
        const notifications = await firebaseHelpers.getNotifications(medicId);
        
        // عرض التفاصيل في نافذة منبثقة أو قسم مخصص
        const details = `
            <h5>تفاصيل المسعف</h5>
            <p><strong>المعرف:</strong> ${medicId}</p>
            <p><strong>عدد الجلسات:</strong> ${sessions.length}</p>
            <p><strong>عدد الإشعارات:</strong> ${notifications.length}</p>
            <p><strong>آخر نشاط:</strong> ${sessions[0] ? new Date(sessions[0].login_time).toLocaleDateString('ar-SA') : 'لا يوجد'}</p>
        `;
        
        alert(details);
        
    } catch (error) {
        console.error('خطأ في عرض تفاصيل المسعف:', error);
        alert('خطأ في عرض التفاصيل: ' + error.message);
    }
}

// ================== تحميل البيانات عند فتح الصفحة ==================
window.addEventListener("DOMContentLoaded", () => {
    console.log('تم تحميل الصفحة الرئيسية');
    
    // تحميل بيانات المسعفين
    loadMedicsForCheckIn();
    
    // تحديث حالة تسجيل الدخول كل 30 ثانية
    setInterval(updateCheckInStatus, 30000);
});

// تصدير الدوال للاستخدام في الملفات الأخرى
window.recordCheckIn = recordCheckIn;
window.recordCheckOut = recordCheckOut;
window.showMedicDetails = showMedicDetails;
window.loadMedicsForCheckIn = loadMedicsForCheckIn;

// إضافة صف للجدول
async function addTableRow(data = null) {
    const table = document.querySelector('table tbody');
    const row = table.insertRow();
    
    // إضافة الخلايا
    const cells = ['name', 'position', 'startTime', 'endTime', 'notes'];
    cells.forEach((cell, index) => {
        const td = row.insertCell();
        td.contentEditable = true;
        td.className = cell;
        if (data) {
            td.textContent = data[cell] || '';
        }
    });

    // إضافة خلية الأزرار
    const actionsCell = row.insertCell();
    actionsCell.className = 'actions';
    actionsCell.innerHTML = `
        <button class="btn btn-danger delete-btn" onclick="deleteRow(this)">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;

    // تسجيل التغيير
    if (data) {
        const user = getCurrentUser();
        await db.logChange(user.id || user.name, 'add_row', {
            rowData: data
        });
    }

    // حفظ البيانات
    await saveTableData();
}

// حذف صف من الجدول
async function deleteRow(btn) {
    const row = btn.closest('tr');
    const rowData = getRowData(row);
    
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        row.remove();
        
        // تسجيل التغيير
        const user = getCurrentUser();
        await db.logChange(user.id || user.name, 'delete_row', {
            rowData: rowData
        });

        // حفظ البيانات
        await saveTableData();
    }
}

// حفظ بيانات الجدول
async function saveTableData() {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    const data = rows.map(row => getRowData(row));
    
    try {
        await db.saveScheduleData(data);
        showMessage('success', 'تم حفظ البيانات بنجاح');
    } catch (error) {
        showMessage('error', 'حدث خطأ أثناء حفظ البيانات');
        console.error('Error saving data:', error);
    }
}

// تحميل البيانات الأولية
async function loadInitialData() {
    try {
        const data = await db.getScheduleData();
        if (data && data.length > 0) {
            data.forEach(row => addTableRow(row));
        } else {
            // إضافة صف فارغ إذا لم تكن هناك بيانات
            addTableRow();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('error', 'حدث خطأ أثناء تحميل البيانات');
    }
}

// الحصول على بيانات صف
function getRowData(row) {
    return {
        name: row.cells[0].textContent,
        position: row.cells[1].textContent,
        startTime: row.cells[2].textContent,
        endTime: row.cells[3].textContent,
        notes: row.cells[4].textContent
    };
}

// الحصول على بيانات المستخدم الحالي
function getCurrentUser() {
    const adminData = localStorage.getItem('adminData') || sessionStorage.getItem('adminData');
    const employeeData = sessionStorage.getItem('employeeData');
    return adminData ? JSON.parse(adminData) : JSON.parse(employeeData);
}

// مراقبة التغييرات في الخلايا
document.querySelector('table').addEventListener('input', async function(e) {
    if (e.target.tagName === 'TD') {
        const row = e.target.closest('tr');
        const columnName = e.target.className;
        const newValue = e.target.textContent;
        
        // تسجيل التغيير
        const user = getCurrentUser();
        await db.logChange(user.id || user.name, 'edit_cell', {
            column: columnName,
            newValue: newValue,
            rowData: getRowData(row)
        });

        // حفظ البيانات
        await saveTableData();
    }
});

// دالة حذف صف
function deleteRow(button) {
    const row = button.closest('tr');
    
    // إضافة تأثير تلاشي قبل الحذف
    row.style.transition = 'all 0.3s ease';
    row.style.transform = 'scale(0.95)';
    row.style.opacity = '0';
    
    setTimeout(() => {
        row.remove();
        saveToLocalStorage(); // حفظ التغييرات بعد الحذف
    }, 300);
}

// دالة إضافة صف جديد
function addNewRow() {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td><input type="text" class="form-control form-control-sm" placeholder="اسم الموظف"></td>
        <td><input type="text" class="form-control form-control-sm" placeholder="المسمى الوظيفي"></td>
        <td><input type="text" class="form-control form-control-sm" placeholder="الرتبة"></td>
        <td>
            <button class="btn btn-outline-success btn-sm time-btn" onclick="recordTime(this, 'start')">
                <i class="fas fa-clock"></i>
                التسجيل في الخدمة
            </button>
        </td>
        <td>
            <button class="btn btn-outline-danger btn-sm time-btn" onclick="recordTime(this, 'end')" disabled>
                <i class="fas fa-clock"></i>
                الخروج من الخدمة
            </button>
        </td>
        <td><input type="text" class="form-control form-control-sm" placeholder="ملاحظات"></td>
        <td>
            <button class="btn btn-danger btn-sm" onclick="deleteRow(this)">
                <i class="fas fa-trash-alt"></i> حذف
            </button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
}

// دالة تسجيل الوقت
function recordTime(button, type) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        numberingSystem: 'latn'  // استخدام الأرقام اللاتينية
    });
    
    // تحديث شكل ومحتوى الزر
    button.innerHTML = `<i class="fas fa-check-circle"></i> ${time}`;
    
    if (type === 'start') {
        button.className = 'btn btn-success btn-sm time-btn';
        // تفعيل زر وقت النهاية
        const row = button.closest('tr');
        const endButton = row.querySelector('button[onclick*="end"]');
        endButton.disabled = false;
        
        // إضافة تأثير لزر النهاية
        endButton.style.transition = 'all 0.3s ease';
        endButton.style.transform = 'scale(1.05)';
        setTimeout(() => {
            endButton.style.transform = 'scale(1)';
        }, 200);
    } else {
        button.className = 'btn btn-danger btn-sm time-btn';
    }
    
    // تعطيل الزر الحالي
    button.disabled = true;
    
    // إضافة تأثير حركي
    button.style.transform = 'scale(1.1)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 200);
}

// حفظ البيانات في Local Storage
function saveToLocalStorage() {
    const rows = Array.from(document.querySelectorAll('#tableBody tr')).map(row => {
        const cells = row.querySelectorAll('td');
        return {
            name: cells[0].textContent,
            position: cells[1].textContent,
            startTime: cells[2].textContent,
            endTime: cells[3].textContent,
            notes: cells[4].textContent
        };
    });
    localStorage.setItem('ambulanceSchedule', JSON.stringify(rows));
}

// استرجاع البيانات من Local Storage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('ambulanceSchedule');
    if (savedData) {
        document.getElementById('tableBody').innerHTML = '';
        JSON.parse(savedData).forEach(row => addTableRow(row));
    }
}

// إضافة خاصية البحث في الجدول
function addTableSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'form-control mb-3';
    searchInput.placeholder = 'البحث عن اسم الموظف';
    searchInput.style.maxWidth = '300px';
    
    document.querySelector('.table').parentElement.insertBefore(searchInput, document.querySelector('.table'));
    
    searchInput.addEventListener('input', function() {
        const searchText = this.value.toLowerCase();
        const rows = document.querySelectorAll('#tableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchText) ? '' : 'none';
        });
    });
}

// وظائف معرض الصور
let currentPage = 0;
const imagesPerPage = 2;
let allImages = [];

document.querySelector('.add-image-btn').addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                addImageToGallery(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
});

function addImageToGallery(imageUrl) {
    const imageCard = document.createElement('div');
    imageCard.className = 'image-card';
    
    imageCard.innerHTML = `
        <img src="${imageUrl}" alt="صورة جديدة">
        <div class="image-overlay">
            <span class="image-title">صورة جديدة</span>
        </div>
    `;
    
    allImages.push(imageCard);
    updateGalleryDisplay();
    updateNavigation();
}

function updateGalleryDisplay() {
    const imageGrid = document.querySelector('.image-grid');
    const startIdx = currentPage * imagesPerPage;
    const endIdx = startIdx + imagesPerPage;
    
    // إخفاء جميع الصور
    imageGrid.querySelectorAll('.image-card').forEach(card => {
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 300);
    });
    
    // إظهار الصور الحالية
    setTimeout(() => {
        imageGrid.innerHTML = '';
        allImages.slice(startIdx, endIdx).forEach(card => {
            const newCard = card.cloneNode(true);
            newCard.style.opacity = '0';
            imageGrid.appendChild(newCard);
            setTimeout(() => newCard.style.opacity = '1', 10);
        });
    }, 300);
}

function updateNavigation() {
    const navigation = document.querySelector('.gallery-navigation');
    const totalPages = Math.ceil(allImages.length / imagesPerPage);
    
    navigation.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('div');
        dot.className = `nav-dot ${i === currentPage ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            currentPage = i;
            updateGalleryDisplay();
            updateNavigation();
        });
        navigation.appendChild(dot);
    }
}

// تبديل تلقائي للصور كل 5 ثواني
setInterval(() => {
    if (allImages.length > imagesPerPage) {
        currentPage = (currentPage + 1) % Math.ceil(allImages.length / imagesPerPage);
        updateGalleryDisplay();
        updateNavigation();
    }
}, 5000);

// تهيئة المعرض
window.addEventListener('load', () => {
    // جمع الصور الموجودة
    document.querySelectorAll('.image-card').forEach(card => {
        allImages.push(card.cloneNode(true));
    });
    updateNavigation();
});

// وظائف حذف الصور
let deleteMode = false;

document.querySelector('.delete-image-btn').addEventListener('click', function() {
    const imageGrid = document.querySelector('.image-grid');
    deleteMode = !deleteMode;
    
    // تبديل حالة الزر
    this.classList.toggle('active');
    
    // تبديل وضع الحذف
    imageGrid.classList.toggle('delete-mode');
    
    // تحديث نص الزر
    const icon = this.querySelector('i');
    const text = this.textContent.trim();
    if (deleteMode) {
        this.innerHTML = `<i class="fas fa-times"></i> إلغاء الحذف`;
    } else {
        this.innerHTML = `<i class="fas fa-trash"></i> حذف صورة`;
    }
    
    // إضافة أو إزالة مستمعي الأحداث للصور
    const imageCards = document.querySelectorAll('.image-card');
    imageCards.forEach(card => {
        if (deleteMode) {
            card.addEventListener('click', deleteImage);
        } else {
            card.removeEventListener('click', deleteImage);
        }
    });
});

function deleteImage(event) {
    const card = event.currentTarget;
    
    // تأثير حذف متحرك
    card.style.transition = 'all 0.3s ease';
    card.style.transform = 'scale(0.8)';
    card.style.opacity = '0';
    
    setTimeout(() => {
        // حذف الصورة من المصفوفة
        const index = allImages.findIndex(img => img === card);
        if (index > -1) {
            allImages.splice(index, 1);
        }
        
        // حذف العنصر من DOM
        card.remove();
        
        // تحديث عرض المعرض والتنقل
        updateGalleryDisplay();
        updateNavigation();
        
        // إذا لم تتبق أي صور، إلغاء وضع الحذف
        if (allImages.length === 0) {
            document.querySelector('.delete-image-btn').click();
        }
    }, 300);
}

// تصدير الجدول إلى Excel
function exportToExcel() {
    const table = document.getElementById('ambulanceTable');
    const wb = XLSX.utils.table_to_book(table, { sheet: "جدول الإسعاف" });
    XLSX.writeFile(wb, 'جدول_الإسعاف.xlsx');
}

// دالة تسجيل الخروج
function logout() {
    // إظهار رسالة نجاح
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        تم تسجيل الخروج بنجاح
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);
    
    // مسح بيانات المستخدم
    localStorage.removeItem('adminData');
    sessionStorage.removeItem('adminData');
    sessionStorage.removeItem('employeeData');
    
    // الانتقال إلى صفحة تسجيل الدخول المناسبة
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// التحقق من تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const adminData = localStorage.getItem('adminData') || sessionStorage.getItem('adminData');
    const employeeData = sessionStorage.getItem('employeeData');
    
    if (!adminData && !employeeData && !window.location.pathname.includes('login.html')) {
        // إذا لم يكن مسجل الدخول وليس في صفحة تسجيل الدخول
        window.location.href = 'login.html';
    }
});

// إضافة صورة جديدة
async function addImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const imageData = {
                        path: event.target.result,
                        title: file.name.split('.')[0],
                        date: new Date().toISOString()
                    };
                    
                    await db.saveImage(imageData);
                    await loadImages();
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('خطأ في إضافة الصورة:', error);
                showMessage('error', 'حدث خطأ أثناء إضافة الصورة');
            }
        }
    };
    
    input.click();
}

// حذف صورة
async function deleteImage(imageId) {
    if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
        try {
            await db.deleteImage(imageId);
            await loadImages();
        } catch (error) {
            console.error('خطأ في حذف الصورة:', error);
            showMessage('error', 'حدث خطأ أثناء حذف الصورة');
        }
    }
}
// دالة لتحميل وعرض بيانات المسعفين
async function loadMedicsForCheckIn() {
    const tbody = document.getElementById('paramedicTableBody');
    
    try {
        // عرض رسالة التحميل
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">جاري تحميل بيانات المسعفين...</td></tr>';

        // جلب بيانات المسعفين من Firebase
        const medics = await firebaseHelpers.getAllMedics();

        // إذا لم يتم العثور على مسعفين
        if (!medics || medics.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا يوجد مسعفين مسجلين</td></tr>';
            return;
        }

        // مسح رسالة التحميل
        tbody.innerHTML = '';

        // إضافة كل مسعف إلى الجدول
        medics.forEach(medic => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${medic.name || 'غير معروف'}</td>
                <td>${medic.code || 'N/A'}</td>
                <td>${medic.discord || 'N/A'}</td>
                <td id="in-${medic.code}">
                    <button class="btn btn-success btn-sm" onclick="recordCheckIn('${medic.code}')">
                        تسجيل الدخول
                    </button>
                </td>
                <td id="out-${medic.code}">
                    <button class="btn btn-danger btn-sm" onclick="recordCheckOut('${medic.code}')">
                        تسجيل الخروج
                    </button>
                </td>
                <td id="hours-${medic.code}">-</td>
                <td><i class="fas fa-check-circle text-success"></i> لا يوجد</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('حدث خطأ:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    حدث خطأ أثناء تحميل بيانات المسعفين. يرجى تحديث الصفحة والمحاولة مرة أخرى.
                </td>
            </tr>
        `;
    }
}

// استدعاء الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadMedicsForCheckIn();
    // ... باقي الأكواد الموجودة مسبقاً
});

// تحميل الصور
async function loadImages() {
    try {
        const images = await db.getAllImages();
        const imageGrid = document.querySelector('.image-grid');
        imageGrid.innerHTML = '';
        
        images.forEach(image => {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            imageCard.innerHTML = `
                <img src="${image.path}" alt="${image.title}">
                <div class="image-overlay">
                    <span class="image-title">${image.title}</span>
                    ${isAdmin ? `
                        <button class="btn btn-danger btn-sm delete-image" onclick="deleteImage(${image.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            `;
            imageGrid.appendChild(imageCard);
        });
    } catch (error) {
        console.error('خطأ في تحميل الصور:', error);
        showMessage('error', 'حدث خطأ أثناء تحميل الصور');
    }
}

// إضافة أحداث الأزرار
document.addEventListener('DOMContentLoaded', () => {
    // أزرار إدارة الصور
    const addImageBtn = document.querySelector('.add-image-btn');
    if (addImageBtn) {
        addImageBtn.addEventListener('click', addImage);
    }
    
    // تحميل الصور عند بدء التطبيق
    loadImages();
});
