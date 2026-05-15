// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAWmU7bzG5CtEgbRMPdMH_uC00qGbE2G44",
    authDomain: "ministry-ambulance-7ee6b.firebaseapp.com",
    databaseURL: "https://ministry-ambulance-7ee6b-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ministry-ambulance-7ee6b",
    storageBucket: "ministry-ambulance-7ee6b.firebasestorage.app",
    messagingSenderId: "499691500431",
    appId: "1:499691500431:web:9fc9f6ed272c02ed6411fa",
    measurementId: "G-JP5GQ45ZZW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics = null;
try {
    analytics = getAnalytics(app);
} catch (error) {
    console.warn('Firebase Analytics لم يتم تفعيله:', error);
}
const db = getFirestore(app);
const auth = getAuth(app);

// Export for global use
window.db = db;
window.auth = auth;
window.analytics = analytics;
window.firebase = { db, auth, analytics, collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy };

// Helper functions for Firebase operations
export const firebaseHelpers = {
    // Get all medics
    async getAllMedics() {
        try {
            const medicsCollection = collection(db, 'medics');
            const medicsSnapshot = await getDocs(medicsCollection);
            return medicsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching medics:', error);
            return [];
        }
    },

    // Add new medic
    async addMedic(medicData) {
        try {
            const medicsCollection = collection(db, 'medics');
            const docRef = await addDoc(medicsCollection, {
                ...medicData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding medic:', error);
            throw error;
        }
    },

    // Update medic
    async updateMedic(medicId, updateData) {
        try {
            const medicDoc = doc(db, 'medics', medicId);
            await updateDoc(medicDoc, {
                ...updateData,
                updatedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error updating medic:', error);
            throw error;
        }
    },

    // Delete medic
    async deleteMedic(medicId) {
        try {
            const medicDoc = doc(db, 'medics', medicId);
            await deleteDoc(medicDoc);
            return true;
        } catch (error) {
            console.error('Error deleting medic:', error);
            throw error;
        }
    },

    // Get medic sessions (attendance)
    async getMedicSessions(medicId) {
        try {
            const sessionsCollection = collection(db, 'medic_sessions');
            const q = query(
                sessionsCollection,
                where('medic_id', '==', medicId),
                orderBy('login_time', 'desc')
            );
            const sessionsSnapshot = await getDocs(q);
            return sessionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching medic sessions:', error);
            return [];
        }
    },

    // Add medic session
    async addMedicSession(sessionData) {
        try {
            const sessionsCollection = collection(db, 'medic_sessions');
            const docRef = await addDoc(sessionsCollection, {
                ...sessionData,
                createdAt: new Date().toISOString()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding medic session:', error);
            throw error;
        }
    },

    // Update medic session
    async updateMedicSession(sessionId, updateData) {
        try {
            const sessionDoc = doc(db, 'medic_sessions', sessionId);
            await updateDoc(sessionDoc, {
                ...updateData,
                updatedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error updating medic session:', error);
            throw error;
        }
    },

    // Get notifications
    async getNotifications(medicId) {
        try {
            const notificationsCollection = collection(db, 'notifications');
            const q = query(
                notificationsCollection,
                where('medic_id', '==', medicId),
                orderBy('created_at', 'desc')
            );
            const notificationsSnapshot = await getDocs(q);
            return notificationsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    // Add notification
    async addNotification(notificationData) {
        try {
            const notificationsCollection = collection(db, 'notifications');
            const docRef = await addDoc(notificationsCollection, {
                ...notificationData,
                created_at: new Date().toISOString(),
                read: false
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    },

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        try {
            const notificationDoc = doc(db, 'notifications', notificationId);
            await updateDoc(notificationDoc, {
                read: true,
                read_at: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    // Get points
    async getPoints(medicId) {
        try {
            const pointsCollection = collection(db, 'points');
            const q = query(
                pointsCollection,
                where('medic_id', '==', medicId),
                orderBy('created_at', 'desc')
            );
            const pointsSnapshot = await getDocs(q);
            return pointsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching points:', error);
            return [];
        }
    },

    // Add points
    async addPoints(medicId, amount, reason) {
        try {
            const pointsCollection = collection(db, 'points');
            const docRef = await addDoc(pointsCollection, {
                medic_id: medicId,
                amount: amount,
                reason: reason,
                created_at: new Date().toISOString()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding points:', error);
            throw error;
        }
    }
};

// Legacy compatibility functions
export const firebaseLegacy = {
    // Legacy function for medic login
    async loginMedics(code, discordId) {
        try {
            const medicsCollection = collection(db, 'medics');
            const q = query(
                medicsCollection,
                where('code', '==', code),
                where('discord', '==', discordId)
            );
            const medicsSnapshot = await getDocs(q);
            
            if (medicsSnapshot.empty) {
                throw new Error('بيانات غير صحيحة');
            }
            
            const medicDoc = medicsSnapshot.docs[0];
            return {
                id: medicDoc.id,
                ...medicDoc.data()
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Legacy function for saving medic hours
    async saveMedicHours(medicId, date, startTime, endTime, totalHours) {
        try {
            const sessionsCollection = collection(db, 'medic_sessions');
            const sessionData = {
                medic_id: medicId,
                date: date,
                start_time: startTime,
                end_time: endTime,
                total_hours: totalHours,
                login_time: new Date(`${date}T${startTime}`).toISOString(),
                logout_time: endTime ? new Date(`${date}T${endTime}`).toISOString() : null
            };
            
            const docRef = await addDoc(sessionsCollection, sessionData);
            return docRef.id;
        } catch (error) {
            console.error('Error saving medic hours:', error);
            throw error;
        }
    }
};

// Export for backward compatibility
window.firebaseHelpers = firebaseHelpers;
window.firebaseLegacy = firebaseLegacy;