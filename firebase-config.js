// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAzngmUmr2w_7f64QWIjid91x-rrHo3nIk",
    authDomain: "ministry-e1eba.firebaseapp.com",
    projectId: "ministry-e1eba",
    storageBucket: "ministry-e1eba.firebasestorage.app",
    messagingSenderId: "31505718965",
    appId: "1:31505718965:web:2311adaa03cd866d2ba8fc",
    measurementId: "G-HS2QJKWSN9"
};

let db = null;
let isFirebaseReady = false;

// Check if Firebase is loaded correctly
if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        isFirebaseReady = true;
        console.log('✅ Firebase Initialized');
    } catch (e) {
        console.error('❌ Firebase Init Error:', e);
    }
} else {
    console.warn('⚠️ Firebase SDK not loaded. Check internet connection.');
}

// ===== Safe Data Sync Functions =====

async function saveToFirestore(collection, data) {
    if (!isFirebaseReady || !db) return;
    try {
        await db.collection(collection).doc('data').set(data);
    } catch (error) {
        console.error(`Sync error (${collection}):`, error);
    }
}

async function loadFromFirestore(collection) {
    if (!isFirebaseReady || !db) return null;
    try {
        const doc = await db.collection(collection).doc('data').get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        console.error(`Load error (${collection}):`, error);
        return null;
    }
}

async function syncLocalStorageToFirestore() {
    if (!isFirebaseReady) return;
    const collections = [
        'medicsList', 'codeSystem', 'officialsList', 'leaveRequests', 
        'suggestions', 'promotionsHistory', 'warnings', 'pendingRequests', 'notifications'
    ];

    for (const key of collections) {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                await saveToFirestore(key, JSON.parse(data));
            } catch (e) { /* Ignore invalid JSON */ }
        }
    }
}

async function loadAllFromFirestore() {
    if (!isFirebaseReady) {
        console.warn('Firebase not ready, using local data only.');
        return;
    }
    const collections = [
        'medicsList', 'codeSystem', 'officialsList', 'leaveRequests', 
        'suggestions', 'promotionsHistory', 'warnings', 'pendingRequests', 'notifications'
    ];

    for (const key of collections) {
        const data = await loadFromFirestore(key);
        if (data !== null) {
            localStorage.setItem(key, JSON.stringify(data));
        }
    }
}

function listenToCollection(collection, callback) {
    if (!isFirebaseReady || !db) return;
    db.collection(collection).doc('data').onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            localStorage.setItem(collection, JSON.stringify(data));
            if (typeof callback === 'function') callback(data);
        }
    });
}

function setupRealtimeListeners() {
    if (!isFirebaseReady) return;
    const collections = ['medicsList', 'codeSystem', 'officialsList', 'leaveRequests', 'suggestions'];
    
    collections.forEach(collection => {
        listenToCollection(collection, (data) => {
            // Auto-refresh UI functions if they exist on the current page
            if (collection === 'medicsList' && typeof loadMedicsList === 'function') loadMedicsList();
            if (collection === 'codeSystem' && typeof loadCodeSystem === 'function') loadCodeSystem();
            if (collection === 'officialsList' && typeof loadOfficialsList === 'function') loadOfficialsList();
            if (collection === 'leaveRequests' && typeof loadAdminLeaveRequests === 'function') loadAdminLeaveRequests();
            if (collection === 'suggestions' && typeof loadAdminSuggestions === 'function') loadAdminSuggestions();
        });
    });
}

// Override localStorage.setItem safely
const originalSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
    originalSetItem(key, value);
    
    const syncedCollections = [
        'medicsList', 'codeSystem', 'officialsList', 'leaveRequests', 
        'suggestions', 'promotionsHistory', 'warnings', 'pendingRequests', 'notifications'
    ];
    
    if (syncedCollections.includes(key)) {
        try {
            // Only sync if value is valid JSON
            const parsed = JSON.parse(value);
            saveToFirestore(key, parsed);
        } catch (e) {
            // Ignore non-JSON values (like simple strings or numbers) to prevent errors
        }
    }
};
