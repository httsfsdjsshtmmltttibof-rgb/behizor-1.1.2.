// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDTo5tdfiiAngQxy9gXhiGEKqMIlJvsUYw",
    authDomain: "behizor-gosht.firebaseapp.com",
    projectId: "behizor-gosht",
    storageBucket: "behizor-gosht.firebasestorage.app",
    messagingSenderId: "881003429730",
    appId: "1:881003429730:web:1db6cccaeb321cbca8b63b",
    measurementId: "G-4019H1YM2K",
    databaseURL: "https://behizor-gosht-default-rtdb.firebaseio.com/" // Baza manzili qo'shildi
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.database();
} catch (e) {
    console.error("Firebase init xatosi:", e);
}

// Get Device Name
function getDeviceName() {
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua)) return "iPad";
    if (/Android/i.test(ua)) {
        if (/Samsung/i.test(ua)) return "Samsung";
        return "Android Device";
    }
    if (/Mac OS X/i.test(ua)) {
        if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Mac Safari";
        return "Mac OS";
    }
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/Chrome/i.test(ua)) return "Chrome Browser";
    if (/Firefox/i.test(ua)) return "Firefox Browser";
    if (/Safari/i.test(ua)) return "Safari Browser";
    return "Noma'lum qurilma";
}

// Format Date
function getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Track Visit on load
function trackVisit() {
    if (!db) return;
    try {
        if (!sessionStorage.getItem('visited')) {
            db.ref('analytics/visits').set(firebase.database.ServerValue.increment(1));
            db.ref('analytics/history').push({
                time: getCurrentTime(),
                action: "Tashrif",
                device: getDeviceName(),
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            sessionStorage.setItem('visited', 'true');
        }
    } catch (e) { console.error("TrackVisit xatosi:", e); }
}

// Track Clicks
function trackClick(btnName) {
    if (!db) return;
    try {
        db.ref('analytics/clicks/' + btnName).set(firebase.database.ServerValue.increment(1));
        db.ref('analytics/history').push({
            time: getCurrentTime(),
            action: `Bosdi: ${btnName}`,
            device: getDeviceName(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (e) { console.error("TrackClick xatosi:", e); }
}

let clicksChartInstance = null;

// Render Analytics UI
async function renderAnalytics() {
    if (!db) return;
    try {
        const snapshot = await db.ref('analytics').once('value');
        const data = snapshot.val() || { visits: 0, clicks: {}, history: {} };
        
        document.getElementById('total-visits').textContent = data.visits || 0;
        
        const clicks = data.clicks || {
            "Telefon": 0, "Telegram kanal": 0, "Telegram admin": 0, "Instagram": 0, "Location": 0
        };
        const totalClicks = Object.values(clicks).reduce((a, b) => a + b, 0);
        document.getElementById('total-clicks').textContent = totalClicks;
        
        const historyObj = data.history || {};
        const historyArr = Object.values(historyObj)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50);
            
        const tbody = document.getElementById('actions-tbody');
        tbody.innerHTML = '';
        
        historyArr.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${item.time}</td><td>${item.action}</td><td>${item.device}</td>`;
            tbody.appendChild(tr);
        });
        
        if (historyArr.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Hali ma'lumot yo'q</td></tr>`;
        }

        const ctx = document.getElementById('clicksChart').getContext('2d');
        if (clicksChartInstance) clicksChartInstance.destroy();
        
        const labels = ["Telefon", "Telegram kanal", "Telegram admin", "Instagram", "Location"];
        const chartData = labels.map(label => clicks[label] || 0);
        const bgColors = ['#0d6d00', '#2b9348', '#f39c12', '#3498db', '#e74c3c'];
        
        clicksChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tugma bosishlari',
                    data: chartData,
                    backgroundColor: bgColors,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    } catch (error) {
        console.error("Ma'lumot olish xatosi:", error);
    }
}

// Analytics Modal Functions
function openAnalyticsModal() {
    const modal = document.getElementById('analytics-modal');
    if(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        document.getElementById('analytics-login').style.display = 'block';
        document.getElementById('analytics-data').style.display = 'none';
        document.getElementById('analytics-error').textContent = '';
        document.getElementById('analytics-password').value = '';
    }
}

function checkPassword() {
    const passwordInput = document.getElementById('analytics-password').value;
    const errorMsg = document.getElementById('analytics-error');
    const loginSection = document.getElementById('analytics-login');
    const dataSection = document.getElementById('analytics-data');

    if (passwordInput === '12345678') {
        errorMsg.textContent = '';
        loginSection.style.display = 'none';
        dataSection.style.display = 'block';
        renderAnalytics();
    } else {
        errorMsg.textContent = 'Parol noto\'g\'ri!';
        const inputWrapper = document.querySelector('.password-input-wrapper');
        inputWrapper.style.transform = 'translateX(-5px)';
        setTimeout(() => inputWrapper.style.transform = 'translateX(5px)', 100);
        setTimeout(() => inputWrapper.style.transform = 'translateX(0)', 200);
    }
}

function closeAnalyticsModal() {
    const modal = document.getElementById('analytics-modal');
    if(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Security Modal Functions
function showSecurityModal() {
    document.getElementById('security-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('security-modal').classList.remove('show');
}

window.onclick = function(event) {
    const sModal = document.getElementById('security-modal');
    const aModal = document.getElementById('analytics-modal');
    if (event.target === sModal) closeModal();
    if (event.target === aModal) closeAnalyticsModal();
}

// Floating Action Functions
function shareSite() {
    if (navigator.share) {
        navigator.share({
            title: 'Behizor Gosht',
            text: 'Hammasini shuyerdan toping!',
            url: window.location.href
        }).then(() => {
            console.log('Muvaffaqiyatli ulashildi');
        }).catch((error) => {
            console.log('Ulashishda xatolik:', error);
        });
    } else {
        // Fallback: Copy to clipboard
        const el = document.createElement('textarea');
        el.value = window.location.href;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alert("Havola nusxalandi! Endi uni Telegram orqali yuborishingiz mumkin.");
    }
}

function downloadVCF() {
    const vcard = "BEGIN:VCARD\n" +
                  "VERSION:3.0\n" +
                  "FN:Behizor Gosht\n" +
                  "ORG:Behizor Gosht\n" +
                  "TEL;TYPE=CELL:+998880300070\n" +
                  "URL:" + window.location.origin + "\n" +
                  "NOTE:Hammasini shuyerdan toping!\n" +
                  "END:VCARD";
    
    const uri = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(vcard);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", "Behizor_Gosht.vcf");
    document.body.appendChild(link); // Body'ga qo'shish mobil qurilmalar uchun shart
    link.click();
    document.body.removeChild(link);
  
}

function saveToPhone() {
    alert("Saytni telefonda doimiy saqlash uchun:\n1. Brauzer menyusini (uchta nuqta) bosing.\n2. 'Asosiy ekranga qo'shish' (Добавить на гл. экран) tugmasini tanlang.");
}

// Init on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    const animatedBtns = document.querySelectorAll('.animated-btn');
    animatedBtns.forEach((btn, index) => {
        btn.style.animationDelay = `${index * 0.5}s`;
    });
    trackVisit();
});
