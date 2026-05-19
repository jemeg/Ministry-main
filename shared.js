window.convertToEnglishNumbers = function(str) {
    if (typeof str !== 'string') str = str.toString();
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = str;
    for (let i = 0; i < arabicNumbers.length; i++) {
        result = result.replace(new RegExp(arabicNumbers[i], 'g'), englishNumbers[i]);
    }
    return result;
};

window.checkAdminPermissions = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && currentUser.type === 'admin') return true;
    
    const medic = JSON.parse(localStorage.getItem('activeMedic') || 'null');
    if (medic) {
        const adminRoles = ['مشرف عام', 'مشرف ميداني', 'رئيس مسعفين'];
        return adminRoles.includes(medic.rank);
    }
    
    return false;
};

window.showCustomAlert = function(message, title = 'تنبيه', type = 'info') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(5px);
            z-index: 10000; display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        const gradients = {
            info: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            success: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            error: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            warning: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
        };
        
        const icons = { info: 'fa-info-circle', success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle' };
        const gradient = gradients[type] || gradients.info;
        const icon = icons[type] || icons.info;
        
        overlay.innerHTML = `
            <div style="background: white; border-radius: 20px; overflow: hidden; width: 90%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.4s ease;">
                <div style="background: ${gradient}; padding: 25px; text-align: center;">
                    <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; backdrop-filter: blur(5px);">
                        <i class="fas ${icon}" style="color: white; font-size: 28px;"></i>
                    </div>
                    <h4 style="margin: 0; color: white; font-weight: 700; font-size: 1.2rem; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">${title}</h4>
                </div>
                <div style="padding: 25px; text-align: center;">
                    <p style="margin: 0 0 25px 0; color: #495057; font-size: 1rem; line-height: 1.7; white-space: pre-line; font-weight: 500;">${message}</p>
                    <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background: ${gradient}; color: white; border: none; padding: 12px 40px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.3s ease; font-family: 'Cairo', sans-serif;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 15px rgba(0,0,0,0.2)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
                        حسناً
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(); } });
    });
};

window.showCustomConfirm = function(message, title = 'تأكيد') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(5px);
            z-index: 10000; display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; border-radius: 20px; overflow: hidden; width: 90%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.4s ease;">
                <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 25px; text-align: center;">
                    <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; backdrop-filter: blur(5px);">
                        <i class="fas fa-question-circle" style="color: white; font-size: 28px;"></i>
                    </div>
                    <h4 style="margin: 0; color: white; font-weight: 700; font-size: 1.2rem; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">${title}</h4>
                </div>
                <div style="padding: 25px; text-align: center;">
                    <p style="margin: 0 0 25px 0; color: #495057; font-size: 1rem; line-height: 1.7; white-space: pre-line; font-weight: 500;">${message}</p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="confirm-yes" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.3s ease; font-family: 'Cairo', sans-serif;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 15px rgba(40,167,69,0.3)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
                            <i class="fas fa-check me-1"></i> نعم
                        </button>
                        <button class="confirm-no" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.3s ease; font-family: 'Cairo', sans-serif;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 15px rgba(231,76,60,0.3)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
                            <i class="fas fa-times me-1"></i> إلغاء
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        overlay.querySelector('.confirm-yes').addEventListener('click', () => { overlay.remove(); resolve(true); });
        overlay.querySelector('.confirm-no').addEventListener('click', () => { overlay.remove(); resolve(false); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
    });
};

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(style);

console.log('تم تحميل نظام وزارة الصحة');
