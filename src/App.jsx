import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

// --- ESTILOS GLOBALES (Movidos arriba para evitar pantalla blanca en Vite) ---
const styles = `
  :root {
    --app-bg: #F2F7F4;
    --card-bg: #ffffff;
    --sidebar-bg: #ffffff;
    --sidebar-text: #1C1C1E;
    --sidebar-muted: #8E8E93;
    --text-main: #1C1C1E;
    --text-muted: #8E8E93;
    --border-color: #E5E5EA;
    --accent: #34C759;
    --danger: #FF3B30;
    --today-bg: #34C759;
  }

  * { box-sizing: border-box; }
  .pill { border-radius: 9999px !important; }

  /* Login */
  .login-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--app-bg); font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px;}
  .login-card { background: white; padding: 48px; border-radius: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.06); text-align: center; max-width: 400px; width: 100%; animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
  .login-logo { width: 72px; height: 72px; background: #E8F5E9; border-radius: 22px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: #2E7D32; }
  .login-card h1 { margin: 0 0 12px; font-size: 2rem; color: var(--text-main); letter-spacing: -0.02em; font-weight: 700; }
  .login-card p { color: var(--text-muted); margin-bottom: 32px; line-height: 1.5; font-size: 1.05rem; }
  .btn-google { background: white; border: 1.5px solid #E5E5EA; padding: 16px 24px; width: 100%; font-size: 1.05rem; font-weight: 600; color: var(--text-main); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: all 0.2s; }
  .btn-google:hover { background: #F2F2F7; }
  .btn-guest { background: transparent; border: none; padding: 16px 24px; width: 100%; font-size: 1rem; font-weight: 500; color: var(--text-muted); cursor: pointer; transition: all 0.2s; margin-top: 8px; }
  .btn-guest:hover { color: var(--text-main); }

  /* App Layout */
  .apple-calendar-wrapper { min-height: 100vh; background-color: var(--app-bg); padding: 24px; display: flex; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
  .main-layout { display: flex; gap: 24px; width: 100%; max-width: 1400px; align-items: flex-start; }
  .apple-calendar-container { background-color: var(--card-bg); padding: 32px; border-radius: 32px; flex: 1; box-shadow: 0 8px 30px rgba(0,0,0,0.04); color: var(--text-main); display: flex; flex-direction: column; border: 1px solid rgba(0,0,0,0.02); min-width: 0; }
  
  .header-top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color); flex-wrap: wrap; gap: 16px;}
  .header-title-area { display: flex; flex-direction: column; gap: 4px; }
  .greeting-container { display: flex; align-items: center; gap: 12px; }
  .greeting { font-size: 0.95rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
  .apple-clock { font-size: 1.05rem; font-weight: 600; color: var(--text-main); text-transform: capitalize; }
  .calendar-header h2 { font-size: 2.4rem; font-weight: 700; margin: 0; letter-spacing: -0.04em; color: var(--text-main); }
  
  /* Controles Nav */
  .nav-group-wrapper { display: flex; align-items: center; gap: 16px; flex-wrap: wrap;}
  .divider { width: 1px; height: 24px; background: var(--border-color); }
  .segmented-control { display: flex; background: #F2F2F7; padding: 4px; border-radius: 999px; }
  .seg-btn { background: transparent; border: none; border-radius: 999px; padding: 8px 16px; font-size: 0.95rem; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.3s ease; }
  .seg-btn:hover { color: var(--text-main); }
  .seg-btn.active { background: var(--card-bg); color: var(--accent); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

  /* Sidebar */
  .sidebar-list { width: 340px; background-color: var(--sidebar-bg); padding: 32px 24px; border-radius: 32px; box-shadow: 0 8px 30px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.02); display: flex; flex-direction: column; max-height: calc(100vh - 48px); position: sticky; top: 24px; flex-shrink: 0; }
  .sidebar-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color); }
  .sidebar-header h3 { margin: 0; font-size: 1.4rem; font-weight: 700; }
  .sidebar-header p { margin: 4px 0 0; color: var(--sidebar-muted); font-size: 0.95rem; font-weight: 500;}

  .events-list-container { overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 8px; }
  .events-list-container::-webkit-scrollbar { width: 4px; }
  .events-list-container::-webkit-scrollbar-thumb { background: #E5E5EA; border-radius: 4px; }

  .list-item { padding: 16px; border-radius: 20px; display: flex; gap: 14px; align-items: flex-start; cursor: pointer; transition: all 0.2s; background: #F9F9FB; border: 1px solid #E5E5EA; }
  .list-item:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.04); }
  .list-item-date { background: var(--card-bg); border-radius: 14px; min-width: 52px; padding: 8px 0; text-align: center; display: flex; flex-direction: column; color: var(--text-main); box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #E5E5EA; }
  .list-item-date .day { font-size: 1.2rem; font-weight: 700; }
  .list-item-date .month { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); }
  .list-item-details { flex: 1; padding-top: 2px; overflow: hidden;}
  .list-item-title { font-weight: 600; margin: 0 0 6px 0; font-size: 1rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .list-item-time { font-size: 0.9rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; font-weight: 500;}

  .empty-state { text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 0.95rem; font-weight: 500; }

  /* Cuadrícula Calendario */
  .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; flex: 1; }
  .day-name { text-align: right; font-weight: 600; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; padding-bottom: 4px; padding-right: 12px; }
  
  .day-cell { background: var(--card-bg); border-radius: 16px; min-height: 130px; padding: 8px; border: 1px solid #E5E5EA; display: flex; flex-direction: column; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.01); overflow: hidden; }
  .day-cell.current-month { cursor: pointer; }
  .day-cell.current-month:hover { border-color: #C7C7CC; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05); transform: translateY(-1px); z-index: 10; }
  .day-cell.faded { background: #F9F9FB; opacity: 0.6; cursor: pointer; }
  .day-cell.faded:hover { background: #F2F2F7; opacity: 0.8; }
  .day-cell.is-today-cell { border: 2px solid var(--accent); background: #F2FBF4; } 
  
  .day-number { font-weight: 600; font-size: 1.05rem; margin-bottom: 8px; color: var(--text-main); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; align-self: flex-end; flex-shrink:0;}
  .day-number.today { background: var(--today-bg); color: white; }

  .events-container { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; flex: 1; padding-right: 2px; }
  .events-container::-webkit-scrollbar { width: 0px; } 
  .event-pill { border-radius: 8px; padding: 4px 8px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 6px; color: var(--text-main); cursor: pointer; border: 1px solid rgba(0,0,0,0.03); flex-shrink: 0; }
  .event-pill:hover { filter: brightness(0.95); }
  .event-icon-small { display: flex; align-items: center; opacity: 0.8; flex-shrink: 0;}
  .event-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  
  @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }

  .bg-pastel-green { background-color: #E8F5E9; color: #2E7D32; }
  .bg-pastel-blue { background-color: #E3F2FD; color: #1565C0; }
  .bg-pastel-pink { background-color: #FCE4EC; color: #C2185B; }
  .bg-pastel-yellow { background-color: #FFF8E1; color: #F57F17; }
  .bg-pastel-purple { background-color: #F3E5F5; color: #7B1FA2; }

  /* Modales */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.3s ease; padding: 20px;}
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal-content { background: #ffffff; padding: 40px; border-radius: 36px; width: 100%; max-width: 460px; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.12); animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); max-height: 90vh; overflow-y: auto;}
  .modal-content h3 { margin-top: 0; margin-bottom: 4px; font-size: 1.6rem; color: var(--text-main); font-weight: 700; letter-spacing: -0.02em; }
  .modal-subtitle { color: var(--text-muted); font-size: 1rem; margin-bottom: 24px; font-weight: 500; }

  /* Tutorial */
  .tutorial-card { max-width: 500px; }
  .tutorial-title { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 40px; line-height: 1.1; }
  .tutorial-features { display: flex; flex-direction: column; gap: 32px; margin-bottom: 40px; }
  .feature-row { display: flex; gap: 20px; align-items: flex-start; }
  .feature-icon { width: 48px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .feature-icon svg { width: 36px; height: 36px; }
  .feature-text h4 { margin: 0 0 4px; font-size: 1.1rem; color: var(--text-main); font-weight: 700; }
  .feature-text p { margin: 0; color: var(--text-muted); font-size: 0.95rem; line-height: 1.4; }

  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: var(--text-muted); letter-spacing: 0.2px; }
  .apple-input { width: 100%; padding: 14px 18px; border-radius: 16px; border: 1px solid #E5E5EA; font-size: 1.05rem; box-sizing: border-box; font-family: inherit; transition: all 0.2s; background: #F9F9FB; color: var(--text-main); font-weight: 500; }
  .apple-input:focus { outline: none; border-color: var(--accent); background: #ffffff; box-shadow: 0 0 0 4px rgba(52, 199, 89, 0.15); }
  .notes-input { resize: vertical; min-height: 90px; line-height: 1.5; }

  .icon-options, .color-options { display: flex; gap: 10px; flex-wrap: wrap; }
  .icon-circle { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: #F2F2F7; border: 2px solid transparent; transition: all 0.2s; color: var(--text-main); }
  .icon-circle:hover { background: #E5E5EA; }
  .icon-circle.selected { border-color: var(--accent); background: #E8F5E9; color: var(--accent); }
  .color-circle { width: 36px; height: 36px; border-radius: 50%; cursor: pointer; border: 3px solid transparent; transition: all 0.2s; }
  .color-circle:hover { transform: scale(1.1); }
  .color-circle.selected { border-color: var(--text-main); transform: scale(1.15); }

  .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
  .btn { border: none; padding: 12px 24px; font-weight: 600; cursor: pointer; font-size: 1rem; transition: all 0.2s; }
  .btn-cancel { background: #F2F2F7; color: var(--text-main); }
  .btn-cancel:hover { background: #E5E5EA; }
  .btn-save { background: var(--accent); color: white; }
  .btn-save:hover { filter: brightness(0.95); transform: translateY(-1px); }
  
  .view-event-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
  .view-event-icon { width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 20px; flex-shrink: 0; }
  .view-event-title { font-size: 1.4rem; font-weight: 700; margin: 0 0 4px 0; color: var(--text-main); letter-spacing: -0.01em;}
  .view-event-time { color: var(--text-muted); font-weight: 500; font-size: 1rem; margin: 0; }
  .view-notes-box { background: #F9F9FB; border: 1px solid #E5E5EA; border-radius: 16px; padding: 20px; margin: 20px 0; font-size: 1rem; color: var(--text-main); line-height: 1.5; white-space: pre-wrap; }

  .btn-danger { background: #FFF0F0; color: var(--danger); width: 100%; margin-top: 16px; font-weight: 600; }
  .btn-danger:hover { background: #FFE5E5; }

  /* REGLAS RESPONSIVAS MULTI-DISPOSITIVO */
  @media (max-width: 1024px) {
    .apple-calendar-wrapper { padding: 16px; }
    .main-layout { flex-direction: column; }
    .sidebar-list { width: 100%; position: static; max-height: 500px; }
    .apple-calendar-container { padding: 24px; border-radius: 24px; }
  }

  @media (max-width: 768px) {
    .login-card { padding: 32px 24px; }
    .apple-calendar-wrapper { padding: 10px; }
    .apple-calendar-container { padding: 16px; border-radius: 20px;}
    .calendar-header h2 { font-size: 1.6rem; }
    .header-top { margin-bottom: 20px; flex-direction: column; align-items: flex-start;}
    .nav-group-wrapper { width: 100%; justify-content: space-between; }
    .apple-clock { display: none; } 
    .divider { display: none; }
    .calendar-grid { gap: 6px; }
    .day-name { padding-right: 4px; font-size: 0.7rem; text-align: center;}
    .day-cell { min-height: 80px; padding: 4px; border-radius: 12px; }
    .day-number { font-size: 0.9rem; width: 24px; height: 24px; margin-bottom: 4px; align-self: center;}
    .event-pill { padding: 2px; justify-content: center; border-radius: 6px; margin-bottom: 2px;}
    .event-text { display: none; } 
    .event-icon-small svg { width: 14px; height: 14px; }
    .modal-content { padding: 24px; border-radius: 24px; }
    .responsive-form-row { flex-direction: column; gap: 0 !important; }
  }
`;

// --- CONFIGURACIÓN DE FIREBASE (Lista para Vercel) ---
const firebaseConfig = {
  apiKey: "AIzaSyCS5WcseX933x3cff-qtfSYPOFOBNkov6U",
  authDomain: "calendario-mediaciones-46593.firebaseapp.com",
  projectId: "calendario-mediaciones-46593",
  storageBucket: "calendario-mediaciones-46593.firebasestorage.app",
  messagingSenderId: "124996945595",
  appId: "1:124996945595:web:39d8dc26066f9fd7fe0b9e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'calendario-mediaciones-46593';

// Colores Pasteles
const PASTEL_COLORS = [
  { name: 'Verde Manzana', class: 'bg-pastel-green', hex: '#E8F5E9', text: '#2E7D32' },
  { name: 'Azul Cielo', class: 'bg-pastel-blue', hex: '#E3F2FD', text: '#1565C0' },
  { name: 'Rosa Pálido', class: 'bg-pastel-pink', hex: '#FCE4EC', text: '#C2185B' },
  { name: 'Amarillo Limón', class: 'bg-pastel-yellow', hex: '#FFF8E1', text: '#F57F17' },
  { name: 'Lavanda', class: 'bg-pastel-purple', hex: '#F3E5F5', text: '#7B1FA2' }
];

// Iconos
const ICONS = [
  { id: 'gavel', name: 'Audiencia', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg> },
  { id: 'scale', name: 'Asesoría', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><rect width="4" height="2" x="10" y="21" rx="1"/><path d="M3 7h18"/><path d="M4 7l-2 5a2 2 0 0 0 4 0l-2-5Z"/><path d="M20 7l-2 5a2 2 0 0 0 4 0l-2-5Z"/></svg> },
  { id: 'briefcase', name: 'Cliente', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
  { id: 'file', name: 'Contrato', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { id: 'users', name: 'Reunión', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
];

const Clock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formattedTime = time.toLocaleDateString('es-ES', { 
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
  }).replace(',', '');
  return <div className="apple-clock">{formattedTime}</div>;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [greeting, setGreeting] = useState('');
  
  const [activeNav, setActiveNav] = useState('today');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [newEvent, setNewEvent] = useState({
    title: '', time: '', notes: '', color: PASTEL_COLORS[0].class, icon: ICONS[0].id
  });

  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' });

  // 1. SISTEMA DE LIMPIEZA AUTOMÁTICA (CADA 5 MINUTOS)
  useEffect(() => {
    const cleanCache = () => {
      console.log("🧹 Ejecutando limpieza automática de caché y basura...");
      Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('firebase:')) {
          localStorage.removeItem(key);
        }
      });
    };
    const cleanupInterval = setInterval(cleanCache, 5 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, []);

  // 2. SISTEMA DE NOTIFICACIONES (10 MIN ANTES)
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checkUpcomingMeetings = () => {
      const now = new Date();
      events.forEach(event => {
        if (!event.time) return; 
        
        const eventDate = new Date(event.date);
        if (eventDate.toDateString() !== now.toDateString()) return;

        const [hours, minutes] = event.time.split(':').map(Number);
        const eventTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        const diffMs = eventTime - now;
        const diffMins = Math.round(diffMs / 60000);

        if (diffMins === 10) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`¡Reunión en 10 min!`, {
              body: `${event.title} comenzará a las ${event.time}`,
              icon: "📅"
            });
          }
        }
      });
    };

    const notifyInterval = setInterval(checkUpcomingMeetings, 60000);
    return () => clearInterval(notifyInterval);
  }, [events, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoggingIn(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setNeedsProfile(false);
        if (!data.tutorialSeen) setShowTutorial(true);
      } else {
        setNeedsProfile(true);
      }
    });

    const eventsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'events');
    const unsubEvents = onSnapshot(eventsRef, (snapshot) => {
      const loadedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(loadedEvents);
    });

    return () => { unsubProfile(); unsubEvents(); };
  }, [user]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días ☀️');
    else if (hour < 19) setGreeting('Buenas tardes 🌤️');
    else setGreeting('Buenas noches 🌙');
  }, []);

  // --- LÓGICA DE LOGIN REAL PARA PRODUCCIÓN ---
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) { 
      console.error(error); 
      setIsLoggingIn(false); 
    }
  };

  const handleGuestLogin = async () => {
    setIsLoggingIn(true);
    try { await signInAnonymously(auth); } 
    catch (error) { console.error(error); setIsLoggingIn(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.firstName.trim()) return;
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
      await setDoc(profileRef, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        tutorialSeen: false
      });
      setNeedsProfile(false);
    } catch (error) { console.error(error); }
  };

  const finishTutorial = async () => {
    setShowTutorial(false);
    if (user) {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
      await updateDoc(profileRef, { tutorialSeen: true });
    }
  };

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const getDaysInPrevMonth = (year, month) => new Date(year, month, 0).getDate();

  const getFormattedSelectedDate = () => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-');
    const dateObj = new Date(y, m - 1, d);
    return `${dateObj.getDate()} de ${monthNames[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
  };

  const handlePrevMonth = () => {
    setActiveNav('prev');
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setActiveNav('next');
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const handleToday = () => {
    setActiveNav('today');
    setCurrentDate(new Date());
  };

  const handleDayClick = (year, month, day) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setTimeout(() => { 
      setNewEvent({ title: '', time: '', notes: '', color: PASTEL_COLORS[0].class, icon: ICONS[0].id }); 
      setSelectedDate('');
    }, 200);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !user || !selectedDate) return;
    const eventId = Date.now().toString();
    
    const [y, m, d] = selectedDate.split('-');
    
    const eventToAdd = {
      date: new Date(y, m - 1, d).toDateString(),
      ...newEvent
    };
    try {
      const eventRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'events'), eventId);
      await setDoc(eventRef, eventToAdd);
      closeAddModal();
    } catch (error) { console.error(error); }
  };

  const openViewModal = (e, event) => { e.stopPropagation(); setSelectedEvent(event); setIsViewModalOpen(true); };
  const closeViewModal = () => { setIsViewModalOpen(false); setTimeout(() => setSelectedEvent(null), 200); };

  const handleDeleteEvent = async () => {
    if (selectedEvent && user) {
      try {
        const eventRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'events'), selectedEvent.id);
        await deleteDoc(eventRef);
        closeViewModal();
      } catch (error) { console.error(error); }
    }
  };

  const getIconSvg = (iconId) => {
    const iconObj = ICONS.find(i => i.id === iconId);
    return iconObj ? iconObj.svg : ICONS[0].svg;
  };

  const getCurrentMonthEvents = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return events
      .filter(event => new Date(event.date).getMonth() === month && new Date(event.date).getFullYear() === year)
      .sort((a, b) => {
        const dateA = new Date(a.date).getDate();
        const dateB = new Date(b.date).getDate();
        if (dateA !== dateB) return dateA - dateB;
        if (a.time === b.time) return (a.title || '').localeCompare(b.title || '');
        return (a.time || '24:00').localeCompare(b.time || '24:00');
      });
  };

  // --- VISTAS ---
  if (!user) {
    return (
      <div className="login-screen">
        <style>{styles}</style>
        <div className="login-card">
          <div className="login-logo">{React.cloneElement(ICONS[1].svg, { width: 36, height: 36 })}</div>
          <h1>Caal</h1>
          <p>Organiza tus audiencias y clientes en un entorno diseñado para tu tranquilidad.</p>
          <button className="btn-google pill" onClick={handleLogin} disabled={isLoggingIn}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoggingIn ? 'Iniciando...' : 'Ingresar con Google'}
          </button>
          <button className="btn-guest pill" onClick={handleGuestLogin} disabled={isLoggingIn}>
            Continuar como invitado
          </button>
        </div>
      </div>
    );
  }

  if (needsProfile) {
    return (
      <div className="login-screen">
        <style>{styles}</style>
        <div className="login-card">
          <h1>¡Hola!</h1>
          <p>Para personalizar tu calendario, ¿cómo te llamas?</p>
          <form onSubmit={saveProfile}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Nombre</label>
              <input className="apple-input" type="text" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} placeholder="Ej. Carlos" required autoFocus />
            </div>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Apellido</label>
              <input className="apple-input" type="text" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} placeholder="Ej. Ramírez" />
            </div>
            <button type="submit" className="btn-save pill" style={{ width: '100%', marginTop: '16px', padding: '16px' }}>Comenzar</button>
          </form>
        </div>
      </div>
    );
  }

  const renderCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInPrevMonth(year, month);
    
    const cells = [];
    const today = new Date();
    const totalCells = 42;

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      let m = month - 1;
      let y = year;
      if (m < 0) { m = 11; y--; }
      
      const fullDateStr = new Date(y, m, dayNum).toDateString();
      const dayEvents = events.filter(e => e.date === fullDateStr);

      cells.push(
        <div key={`prev-${i}`} className="day-cell faded" onClick={() => handleDayClick(y, m, dayNum)}>
          <div className="day-number">{dayNum}</div>
          <div className="events-container">
            {dayEvents.sort((a, b) => {
               if (a.time === b.time) return (a.title || '').localeCompare(b.title || '');
               return (a.time || '24:00').localeCompare(b.time || '24:00');
            }).map(event => (
              <div key={event.id} className={`event-pill ${event.color} animate-pop`} onClick={(e) => openViewModal(e, event)}>
                <span className="event-icon-small">{getIconSvg(event.icon)}</span>
                <span className="event-text">{event.time && <b>{event.time} </b>}{event.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const fullDateStr = new Date(year, month, day).toDateString();
      const dayEvents = events.filter(e => e.date === fullDateStr);
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

      cells.push(
        <div key={day} className={`day-cell current-month ${isToday ? 'is-today-cell' : ''}`} onClick={() => handleDayClick(year, month, day)}>
          <div className={`day-number ${isToday ? 'today' : ''}`}>{day}</div>
          <div className="events-container">
            {dayEvents.sort((a, b) => {
               if (a.time === b.time) return (a.title || '').localeCompare(b.title || '');
               return (a.time || '24:00').localeCompare(b.time || '24:00');
            }).map(event => (
              <div key={event.id} className={`event-pill ${event.color} animate-pop`} onClick={(e) => openViewModal(e, event)}>
                <span className="event-icon-small">{getIconSvg(event.icon)}</span>
                <span className="event-text">{event.time && <b>{event.time} </b>}{event.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const remainingCells = totalCells - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      let m = month + 1;
      let y = year;
      if (m > 11) { m = 0; y++; }
      
      const fullDateStr = new Date(y, m, i).toDateString();
      const dayEvents = events.filter(e => e.date === fullDateStr);

      cells.push(
        <div key={`next-${i}`} className="day-cell faded" onClick={() => handleDayClick(y, m, i)}>
          <div className="day-number">{i}</div>
          <div className="events-container">
            {dayEvents.sort((a, b) => {
               if (a.time === b.time) return (a.title || '').localeCompare(b.title || '');
               return (a.time || '24:00').localeCompare(b.time || '24:00');
            }).map(event => (
              <div key={event.id} className={`event-pill ${event.color} animate-pop`} onClick={(e) => openViewModal(e, event)}>
                <span className="event-icon-small">{getIconSvg(event.icon)}</span>
                <span className="event-text">{event.time && <b>{event.time} </b>}{event.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  const currentMonthEventsList = getCurrentMonthEvents();

  return (
    <>
      <style>{styles}</style>
      <div className="apple-calendar-wrapper">
        <div className="main-layout">
          
          <div className="apple-calendar-container">
            <div className="header-top">
              <div className="header-title-area">
                <div className="greeting-container">
                  <p className="greeting">{profile ? `Caal de ${profile.firstName} ${profile.lastName}` : 'Caal'}</p>
                </div>
                <div className="calendar-header">
                  <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                </div>
              </div>
              
              <div className="nav-group-wrapper">
                <Clock />
                <div className="divider"></div>
                <div className="segmented-control pill">
                  <button className={`seg-btn ${activeNav === 'prev' ? 'active' : ''}`} onClick={handlePrevMonth}>Ant</button>
                  <button className={`seg-btn ${activeNav === 'today' ? 'active' : ''}`} onClick={handleToday}>Hoy</button>
                  <button className={`seg-btn ${activeNav === 'next' ? 'active' : ''}`} onClick={handleNextMonth}>Sig</button>
                </div>
              </div>
            </div>

            <div className="calendar-grid">
              {daysOfWeek.map(day => <div key={day} className="day-name">{day}</div>)}
              {renderCells()}
            </div>
          </div>

          <div className="sidebar-list">
            <div className="sidebar-header">
              <h3>Reuniones del Mes</h3>
              <p>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
            </div>

            <div className="events-list-container">
              {currentMonthEventsList.length === 0 ? (
                <div className="empty-state">Mes libre de reuniones.</div>
              ) : (
                currentMonthEventsList.map(event => {
                  const eventDate = new Date(event.date);
                  return (
                    <div key={`list-${event.id}`} className={`list-item ${event.color}`} onClick={(e) => openViewModal(e, event)}>
                      <div className="list-item-date">
                        <span className="day">{eventDate.getDate()}</span>
                        <span className="month">{monthNames[eventDate.getMonth()].substring(0, 3)}</span>
                      </div>
                      <div className="list-item-details">
                        <h4 className="list-item-title">{event.title}</h4>
                        <div className="list-item-time">
                          {getIconSvg(event.icon)}
                          <span>{event.time || 'Todo el día'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* --- MODAL TUTORIAL --- */}
        {showTutorial && (
          <div className="modal-overlay" style={{ zIndex: 2000, backdropFilter: 'blur(10px)' }}>
            <div className="modal-content tutorial-card">
              <h2 className="tutorial-title">Novedades en<br/>Caal</h2>
              
              <div className="tutorial-features">
                <div className="feature-row">
                  <div className="feature-icon" style={{ color: '#34C759' }}>{ICONS[1].svg}</div>
                  <div className="feature-text">
                    <h4>Crea Múltiples Reuniones</h4>
                    <p>Agrega varias reuniones el mismo día y a la misma hora. Caal las organizará solas de forma elegante.</p>
                  </div>
                </div>

                <div className="feature-row">
                  <div className="feature-icon" style={{ color: '#007AFF' }}>{ICONS[3].svg}</div>
                  <div className="feature-text">
                    <h4>Avisos Inteligentes</h4>
                    <p>Recibirás una notificación nativa y correo automático 10 minutos antes de que empiece tu reunión.</p>
                  </div>
                </div>

                <div className="feature-row">
                  <div className="feature-icon" style={{ color: '#FF9500' }}>{ICONS[0].svg}</div>
                  <div className="feature-text">
                    <h4>Limpieza Automática</h4>
                    <p>La aplicación libera memoria caché cada 5 minutos silenciosamente para no ralentizar tu dispositivo.</p>
                  </div>
                </div>
              </div>

              <button className="btn-save pill" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} onClick={finishTutorial}>Continuar</button>
            </div>
          </div>
        )}

        {/* --- MODAL CREAR --- */}
        {isAddModalOpen && (
          <div className="modal-overlay" onClick={closeAddModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Nuevo Evento</h3>
              <p className="modal-subtitle">{getFormattedSelectedDate()}</p>
              
              <form onSubmit={handleSaveEvent}>
                <div className="form-group">
                  <label>Título / Cliente</label>
                  <input className="apple-input" type="text" autoFocus placeholder="Ej. Audiencia López vs Pérez" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required />
                </div>

                <div style={{ display: 'flex', gap: '16px' }} className="responsive-form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Fecha</label>
                    <input className="apple-input" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Hora</label>
                    <input className="apple-input" type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <div className="color-options" style={{ marginTop: '8px' }}>
                    {PASTEL_COLORS.map(color => (
                      <div key={color.class} className={`color-circle ${color.class} ${newEvent.color === color.class ? 'selected' : ''}`} onClick={() => setNewEvent({...newEvent, color: color.class})} title={color.name} />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Ícono</label>
                  <div className="icon-options">
                    {ICONS.map(iconObj => (
                      <div key={iconObj.id} className={`icon-circle pill ${newEvent.icon === iconObj.id ? 'selected' : ''}`} onClick={() => setNewEvent({...newEvent, icon: iconObj.id})} title={iconObj.name}>
                        {iconObj.svg}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Notas</label>
                  <textarea className="apple-input notes-input" placeholder="Agrega detalles..." value={newEvent.notes} onChange={e => setNewEvent({...newEvent, notes: e.target.value})} />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-cancel pill" onClick={closeAddModal}>Cancelar</button>
                  <button type="submit" className="btn btn-save pill">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL VER --- */}
        {isViewModalOpen && selectedEvent && (
          <div className="modal-overlay" onClick={closeViewModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              
              <div className="view-event-header">
                <div className={`view-event-icon ${selectedEvent.color}`}>
                  {React.cloneElement(getIconSvg(selectedEvent.icon), { width: 32, height: 32 })}
                </div>
                <div>
                  <h4 className="view-event-title">{selectedEvent.title}</h4>
                  <p className="view-event-time">
                    {selectedEvent.time ? `A las ${selectedEvent.time}` : 'Todo el día'} &nbsp;•&nbsp; {new Date(selectedEvent.date).getDate()} de {monthNames[new Date(selectedEvent.date).getMonth()]}
                  </p>
                </div>
              </div>

              {selectedEvent.notes && (
                <div className="view-notes-box">
                  {selectedEvent.notes}
                </div>
              )}

              <div className={`event-pill ${selectedEvent.color} pill`} style={{ justifyContent: 'center', padding: '12px', fontSize: '1rem', cursor: 'default', marginTop: '20px' }}>
                {PASTEL_COLORS.find(c => c.class === selectedEvent.color)?.name || 'Evento'}
              </div>

              <button type="button" className="btn btn-danger pill" onClick={handleDeleteEvent}>Eliminar Evento</button>
              
              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="button" className="btn btn-cancel pill" onClick={closeViewModal}>Cerrar</button>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}