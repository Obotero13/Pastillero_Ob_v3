/* ============================================================
   EL PASTILLERO Ob — JavaScript Principal (app.js v4.1)
   ============================================================ */

'use strict';

// ─── ESTADO GLOBAL ──────────────────────────────────────────
const APP = {
  data: {
    pacientes: [],       // [{id, nombre, edad, telefono, eps, tipoSangre, alergias, emergenciaContacto, emergenciaTelefono, notas}]
    medicamentos: [],    // [{id, pacienteId, nombre, concentracion, unidad, cantidad, stockMinimo, laboratorio, fechaRecepcion, proximaRecepcion, puntoEntregaId, notas}]
    dosis: [],           // [{id, pacienteId, medicamentoId, cantidadDia, frecuencia, intervaloDias, jornadas:[{jornada, hora}], notas}]
    puntosEntrega: [],   // [{id, nombre, direccion, telefonos, correo, web, observaciones}]
    sitios: [],          // [{id, nombre, direccion, web, correo, telefono, whatsapp, servicio, fecha, horario, info}]
    citas: [],           // [{id, pacienteId, lugar, fecha, hora, servicio, profesional, direccion, telefonos, correo, web, observaciones, resLab, resWeb, resCorreo, resWhatsapp, resTelefono, resPasos}]
    fechasEspeciales: [],// [{fecha:'YYYY-MM-DD', comentario}]
    registroTomas: {},   // {'YYYY-MM-DD': { 'dosisId_jornada': true }}
    lastInventoryDate: null // 'YYYY-MM-DD'
  },
  ui: {
    tabActual: 'pacientes',
    activeAlertCategory: null,
    editPacienteId: null,
    editMedId: null,
    editDosisId: null,
    editPuntoId: null,
    editSitioId: null,
    editCitaId: null,
    reabastecerMedId: null,
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    calSelectedDate: null,
    selPacienteMeds: '',
    selPacienteDosis: '',
    selPacienteCal: '',
    selPacienteConsulta: '',
    selMedConsulta: '',
    selFechaRecepcionConsulta: '',
    selPuntoConsulta: ''
  },
  settings: {
    theme: 'green',
    mode: 'dark',
    soundAlarm: true,
    alarmDurationSec: 5
  }
};

let swRegistration = null;

// ─── INTERACCIÓN DE USUARIO PARA AUDIO ──────────────────────
let userInteracted = false;
window.addEventListener('click', () => { userInteracted = true; }, { once: true });
window.addEventListener('keydown', () => { userInteracted = true; }, { once: true });

// ─── UTILIDADES ──────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const todayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const daysDiff = (dateStr) => {
  if (!dateStr) return Infinity;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

const initials = (name) => {
  if (!name) return '??';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const webLink = (u) => { if (!u) return ''; const href = /^https?:\/\//i.test(u) ? u : 'https://' + u; return `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(u)}</a>`; };
const waLink = (num) => {
  if (!num) return '';
  const clean = String(num).replace(/\D/g, '');
  return `<a href="https://wa.me/${esc(clean)}" target="_blank" rel="noopener" style="color:#25d366;font-weight:600;">📲 WhatsApp (${esc(num)})</a>`;
};
const detail = (icon, val, html) => val ? `<span class="med-detail-item">${icon} ${html || esc(val)}</span>` : '';
const multilineDetail = (label, text) => text ? `<div class="med-details-multiline"><strong>${label}:</strong><br>${esc(text)}</div>` : '';

// Isotipos SVG vectoriales compactos
const WA_SVG = `<svg viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.769.814 2.791.814 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.768-5.77-5.768zm0-2.172c4.418 0 8 3.582 8 8 0 4.418-3.582 8-8 8-1.42 0-2.753-.372-3.916-1.023l-4.115 1.078 1.096-4.011c-.722-1.206-1.065-2.58-1.065-4.044 0-4.418 3.582-8 8-8zm3.285 11.233c-.14-.07-.828-.408-.956-.455-.128-.047-.222-.07-.315.07-.094.14-.363.455-.445.549-.082.093-.164.105-.304.035-.14-.07-.591-.218-1.126-.695-.416-.371-.697-.83-.778-.97-.082-.14-.009-.215.061-.285.063-.062.14-.163.21-.245.07-.082.094-.14.14-.233.047-.094.023-.175-.012-.245-.035-.07-.315-.759-.432-1.039-.114-.273-.23-.236-.316-.24l-.27-.005c-.093 0-.245.035-.373.175-.128.14-.49.479-.49 1.168 0 .689.501 1.354.571 1.448.07.093.987 1.507 2.391 2.115.334.145.595.231.798.296.335.106.64.091.882.055.27-.04.828-.338.945-.666.117-.327.117-.607.082-.666-.035-.059-.128-.094-.268-.164z"/></svg>`;
const GCAL_SVG = `<svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>`;
const ICAL_SVG = `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function getConsumoDiario(dosis) {
  const cant = parseFloat(dosis.cantidadDia) || 0;
  if (cant <= 0) return 0;
  const frec = dosis.frecuencia || 'diaria';
  if (frec === 'diaria') return cant;
  if (frec === 'cada_dias') {
    const inter = parseInt(dosis.intervaloDias, 10) || 1;
    return cant / Math.max(1, inter);
  }
  if (frec === 'semanal') return cant / 7;
  if (frec === 'quincenal') return cant / 15;
  if (frec === 'mensual') return cant / 30;
  return cant;
}

function getFrecuenciaTexto(dosis) {
  const frec = dosis.frecuencia || 'diaria';
  if (frec === 'diaria') return `${dosis.cantidadDia} al día`;
  if (frec === 'cada_dias') return `${dosis.cantidadDia} cada ${dosis.intervaloDias || 2} días`;
  if (frec === 'semanal') return `${dosis.cantidadDia} semanal`;
  if (frec === 'quincenal') return `${dosis.cantidadDia} quincenal`;
  if (frec === 'mensual') return `${dosis.cantidadDia} mensual`;
  return `${dosis.cantidadDia} al día`;
}

// ─── PERSISTENCIA ────────────────────────────────────────────
const STORAGE_KEY = 'elpastillero_v1';

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(APP.data));
  } catch(e) { console.warn('Error guardando datos', e); }
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      APP.data = { ...APP.data, ...parsed };
      if (!APP.data.sitios) APP.data.sitios = [];
      if (!APP.data.registroTomas) APP.data.registroTomas = {};
    }
  } catch(e) { console.warn('Error cargando datos', e); }
}

function saveSettings() {
  localStorage.setItem('elpastillero_settings', JSON.stringify(APP.settings));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem('elpastillero_settings');
    if (raw) {
      APP.settings = { ...APP.settings, ...JSON.parse(raw) };
      if (!APP.settings.alarmDurationSec) APP.settings.alarmDurationSec = 5;
    }
  } catch(e) {}
}

// ─── CONTROL AUTOMÁTICO DE INVENTARIO ────────────────────────
function checkDailyInventoryDeduction() {
  const hoy = todayStr();
  const ultimaFecha = APP.data.lastInventoryDate;

  if (!ultimaFecha) {
    APP.data.lastInventoryDate = hoy;
    saveData();
    return;
  }

  if (ultimaFecha === hoy) return;

  const fechaAnt = new Date(ultimaFecha + 'T00:00:00');
  const fechaHoy = new Date(hoy + 'T00:00:00');
  const diasTranscurridos = Math.round((fechaHoy - fechaAnt) / (1000 * 60 * 60 * 24));

  if (diasTranscurridos === 0) return;

  let modificaciones = 0;

  APP.data.dosis.forEach(dos => {
    const med = APP.data.medicamentos.find(m => m.id === dos.medicamentoId);
    const tasaDiaria = getConsumoDiario(dos);
    if (med && tasaDiaria > 0) {
      const deltaTotal = tasaDiaria * diasTranscurridos;
      let nuevoStock = med.cantidad - deltaTotal;
      if (nuevoStock < 0) nuevoStock = 0;
      med.cantidad = Math.round(nuevoStock * 100) / 100;
      modificaciones++;
    }
  });

  APP.data.lastInventoryDate = hoy;
  saveData();

  if (modificaciones > 0) {
    if (diasTranscurridos > 0) {
      showToast(`📦 Inventario actualizado: se descontaron dosis de ${diasTranscurridos} día(s).`, 'info', 4500);
    } else {
      showToast(`⏪ Reloj atrasado: se reintegraron dosis de ${Math.abs(diasTranscurridos)} día(s).`, 'warning', 4500);
    }

    if (APP.ui.tabActual === 'medicamentos') renderMedicamentos();
    if (APP.ui.tabActual === 'consulta') renderConsulta();
    renderAlertas();
  }
}

// ─── MONITOR DE ALARMA SONORA EN HORAS EXACTAS (HASTA 60s) ───
let lastAlarmMinute = '';

function checkScheduledDoseAlarms() {
  if (!APP.settings.soundAlarm) return;

  const now = new Date();
  const currentHH = String(now.getHours()).padStart(2, '0');
  const currentMM = String(now.getMinutes()).padStart(2, '0');
  const currentHM = `${currentHH}:${currentMM}`;

  if (lastAlarmMinute === currentHM) return;

  let medEncontrado = null;
  let dosisEncontrada = null;

  (APP.data.dosis || []).forEach(d => {
    (d.jornadas || []).forEach(j => {
      if (j.hora === currentHM) {
        dosisEncontrada = d;
        medEncontrado = APP.data.medicamentos.find(m => m.id === d.medicamentoId);
      }
    });
  });

  if (medEncontrado) {
    lastAlarmMinute = currentHM;
    const durSec = Math.min(60, Math.max(1, parseInt(APP.settings.alarmDurationSec, 10) || 5));

    // 1. Sonido potente repetido
    playDoseAlarmTone(durSec);

    // 2. Vibración rítmica extendida en teléfonos móviles
    if ('vibrate' in navigator) {
      const vibPattern = [];
      for (let s = 0; s < durSec; s++) vibPattern.push(500, 300);
      navigator.vibrate(vibPattern);
    }

    // 3. Notificación nativa del sistema vía Service Worker (despierta pantalla de bloqueo)
    triggerSystemNotification(medEncontrado.nombre, currentHM, dosisEncontrada);

    // 4. Toast visible dentro de la app
    showToast(`⏰ ¡HORA DE TOMAR MEDICAMENTO! ${medEncontrado.nombre} (${currentHM}). Alarma activa por ${durSec}s.`, 'warning', durSec * 1000);
  }
}

function playDoseAlarmTone(durationSeconds = 5) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.75, t);
    masterGain.connect(ctx.destination);

    for (let i = 0; i < durationSeconds; i++) {
      const startTime = t + i;

      // Pulso 1 (800 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(800, startTime);
      gain1.gain.setValueAtTime(0.4, startTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(startTime);
      osc1.stop(startTime + 0.22);

      // Pulso 2 (1050 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1050, startTime + 0.26);
      gain2.gain.setValueAtTime(0.45, startTime + 0.26);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.52);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(startTime + 0.26);
      osc2.stop(startTime + 0.52);
    }
  } catch(e) {
    console.warn('AudioContext no disponible:', e);
  }
}

function triggerSystemNotification(nombreMed, horaStr, dosis) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notifOptions = {
    body: `Es hora de tomar ${nombreMed} (${horaStr}). ${dosis && dosis.notas ? 'Nota: ' + dosis.notas : ''}`,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'pastillero-alarma-dosis',
    renotify: true,
    requireInteraction: true,
    vibrate: [500, 250, 500, 250, 500, 250, 500],
    data: { url: './index.html' }
  };

  // Método 1: Por Service Worker (Garantiza sonido y despertar pantalla de bloqueo en móviles)
  if (swRegistration && 'showNotification' in swRegistration) {
    swRegistration.showNotification('💊 ¡HORA DE TOMAR MEDICAMENTO!', notifOptions);
  } else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification('💊 ¡HORA DE TOMAR MEDICAMENTO!', notifOptions);
    }).catch(() => {
      new Notification('💊 ¡HORA DE TOMAR MEDICAMENTO!', notifOptions);
    });
  } else {
    // Método 2: Respaldo para navegadores antiguos
    new Notification('💊 ¡HORA DE TOMAR MEDICAMENTO!', notifOptions);
  }
}

// ─── TOAST ───────────────────────────────────────────────────
function showToast(msg, type = 'success', duration = 3500) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: '🎨' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.4s ease forwards';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ─── CONFIRMACIÓN MODAL ───────────────────────────────────────
function confirmModal(title, msg) {
  return new Promise(resolve => {
    const overlay = document.getElementById('modal-confirm');
    document.getElementById('modal-confirm-title').textContent = title;
    document.getElementById('modal-confirm-msg').textContent = msg;
    overlay.style.display = 'flex';

    const okBtn = document.getElementById('modal-confirm-ok');
    const cancelBtn = document.getElementById('modal-confirm-cancel');

    const cleanup = (result) => {
      overlay.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    };

    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) cleanup(false); }, { once: true });
  });
}

// ─── ALERTAS INTELIGENTES: RESUMEN COLAPSABLE POR CATEGORÍA ──
function renderAlertas() {
  const container = document.getElementById('alerts-container');
  const summaryBar = document.getElementById('alerts-summary-bar');
  const panel = document.getElementById('alerts-dropdown-panel');
  if (!container || !summaryBar || !panel) return;

  const grupos = {
    cita: [],
    recepcion: [],
    stock: [],
    especial: [],
    sitio: []
  };

  (APP.data.citas || []).forEach(ct => {
    if (!ct.fecha) return;
    const dias = daysDiff(ct.fecha);
    if (dias >= 0 && dias <= 1) {
      const pac = APP.data.pacientes.find(p => p.id === ct.pacienteId);
      const nomPac = pac ? pac.nombre : 'Paciente';
      const labelTiempo = dias === 0 ? 'HOY' : 'MAÑANA';
      grupos.cita.push(`🩺 <strong>CITA ${labelTiempo}:</strong> ${esc(nomPac)} tiene cita de <strong>${esc(ct.servicio || 'Consulta')}</strong> ${ct.hora ? `a las ${esc(ct.hora)}` : ''} en ${esc(ct.lugar || 'centro de atención')}.`);
    }
  });

  (APP.data.medicamentos || []).forEach(med => {
    const dias = daysDiff(med.proximaRecepcion);
    if (dias >= 0 && dias <= 7) {
      const pac = APP.data.pacientes.find(p => p.id === med.pacienteId);
      const nomPac = pac ? pac.nombre : 'Paciente';
      grupos.recepcion.push(`📆 <strong>RECEPCIÓN:</strong> ${esc(nomPac)} — <strong>${esc(med.nombre)} ${med.concentracion}${med.unidad}</strong> en <strong>${dias === 0 ? 'HOY' : dias === 1 ? '1 día' : dias + ' días'}</strong> (${fmtDate(med.proximaRecepcion)}).`);
    }
  });

  (APP.data.fechasEspeciales || []).forEach(fe => {
    if (!fe.fecha) return;
    const dias = daysDiff(fe.fecha);
    if (dias >= 0 && dias <= 1) {
      const labelTiempo = dias === 0 ? 'HOY' : 'MAÑANA';
      grupos.especial.push(`⭐ <strong>RECORDATORIO (${labelTiempo} - ${fmtDate(fe.fecha)}):</strong> ${esc(fe.comentario)}`);
    }
  });

  (APP.data.sitios || []).forEach(st => {
    if (!st.fecha) return;
    const dias = daysDiff(st.fecha);
    if (dias >= 0 && dias <= 1) {
      const labelTiempo = dias === 0 ? 'HOY' : 'MAÑANA';
      grupos.sitio.push(`🏢 <strong>SITIO PROGRAMADO ${labelTiempo}:</strong> Visita a <strong>${esc(st.nombre)}</strong> ${st.servicio ? `(${esc(st.servicio)})` : ''}.`);
    }
  });

  (APP.data.medicamentos || []).forEach(med => {
    const stockMin = med.stockMinimo !== undefined ? Number(med.stockMinimo) : 5;
    if (med.cantidad <= stockMin) {
      const pac = APP.data.pacientes.find(p => p.id === med.pacienteId);
      const nomPac = pac ? pac.nombre : 'Paciente';
      const agotado = med.cantidad <= 0;
      grupos.stock.push(`⚠️ <strong>STOCK ${agotado ? 'AGOTADO' : 'BAJO'}:</strong> ${esc(nomPac)} — Quedan <strong>${med.cantidad}</strong> de <strong>${esc(med.nombre)}</strong> (Mín: ${stockMin}).`);
    }
  });

  const totalAlertas = grupos.cita.length + grupos.recepcion.length + grupos.stock.length + grupos.especial.length + grupos.sitio.length;

  if (totalAlertas === 0) {
    container.style.display = 'none';
    panel.style.display = 'none';
    APP.ui.activeAlertCategory = null;
    return;
  }

  container.style.display = 'block';
  summaryBar.innerHTML = `<span style="font-size:0.8rem; font-weight:700; margin-right:0.3rem;">🚨 Alertas (${totalAlertas}):</span>`;

  const confCategorias = [
    { key: 'cita', icon: '🩺', label: 'Citas', class: 'chip-cita' },
    { key: 'recepcion', icon: '📆', label: 'Recepciones', class: 'chip-recepcion' },
    { key: 'sitio', icon: '🏢', label: 'Sitios', class: 'chip-sitio' },
    { key: 'stock', icon: '⚠️', label: 'Stock Bajo', class: 'chip-stock' },
    { key: 'especial', icon: '⭐', label: 'Especiales', class: 'chip-especial' }
  ];

  confCategorias.forEach(cat => {
    const count = grupos[cat.key].length;
    if (count > 0) {
      const btn = document.createElement('button');
      btn.className = `alert-chip-btn ${cat.class} ${APP.ui.activeAlertCategory === cat.key ? 'active' : ''}`;
      btn.innerHTML = `${cat.icon} ${cat.label} <strong>(${count})</strong> ${APP.ui.activeAlertCategory === cat.key ? '▲' : '▼'}`;
      btn.addEventListener('click', () => {
        if (APP.ui.activeAlertCategory === cat.key) {
          APP.ui.activeAlertCategory = null;
          panel.style.display = 'none';
        } else {
          APP.ui.activeAlertCategory = cat.key;
          panel.style.display = 'flex';
          panel.innerHTML = grupos[cat.key].map(m => `<div class="alert-item alert-${cat.key}">${m}</div>`).join('');
        }
        renderAlertas();
      });
      summaryBar.appendChild(btn);
    }
  });

  if (APP.ui.activeAlertCategory && grupos[APP.ui.activeAlertCategory].length > 0) {
    panel.style.display = 'flex';
    panel.innerHTML = grupos[APP.ui.activeAlertCategory].map(m => `<div class="alert-item alert-${APP.ui.activeAlertCategory}">${m}</div>`).join('');
  } else {
    panel.style.display = 'none';
  }
}

// ─── TEMA Y MODO ──────────────────────────────────────────────
function applyThemeAndMode() {
  const body = document.body;
  const themes = ['green','blue','red','purple','orange','yellow'];
  themes.forEach(t => body.classList.remove('theme-' + t));
  body.classList.remove('mode-dark', 'mode-light');

  body.classList.add('theme-' + APP.settings.theme);
  body.classList.add('mode-' + APP.settings.mode);

  document.querySelectorAll('.theme-dot').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === APP.settings.theme);
  });

  const toggleBtn = document.getElementById('mode-toggle');
  toggleBtn.querySelector('.mode-icon').textContent = APP.settings.mode === 'dark' ? '☀️' : '🌙';
  toggleBtn.querySelector('.mode-text').textContent = APP.settings.mode === 'dark' ? 'Modo Claro' : 'Modo Oscuro';

  const alarmBtn = document.getElementById('btn-sound-alarm');
  if (alarmBtn) {
    alarmBtn.classList.toggle('active', !!APP.settings.soundAlarm);
    alarmBtn.querySelector('.alarm-icon').textContent = APP.settings.soundAlarm ? '🔔' : '🔕';
    alarmBtn.querySelector('.alarm-text').textContent = APP.settings.soundAlarm ? 'Alarma: ON' : 'Alarma: OFF';
  }

  const lblDur = document.getElementById('lbl-duracion-alarma');
  if (lblDur) {
    lblDur.textContent = `${APP.settings.alarmDurationSec || 5}s`;
  }
}

// ─── NAVEGACIÓN DE PESTAÑAS ───────────────────────────────────
function switchTab(tabId) {
  APP.ui.tabActual = tabId;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
    btn.setAttribute('aria-selected', btn.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === 'panel-' + tabId);
  });

  if (tabId === 'pacientes') renderPacientes();
  if (tabId === 'medicamentos') renderMedicamentos();
  if (tabId === 'sitios') renderSitios();
  if (tabId === 'dosis') renderDosis();
  if (tabId === 'calendario') renderCalendar();
  if (tabId === 'consulta') { updateConsultaFiltros(); renderConsulta(); }
  if (tabId === 'puntos') renderPuntos();
  if (tabId === 'citas') renderCitas();
}

// ─── ACTUALIZAR SELECTS DE PACIENTES ─────────────────────────
function updatePacientesSelects() {
  const selects = [
    'sel-paciente-meds',
    'sel-paciente-dosis',
    'sel-paciente-cal',
    'sel-paciente-consulta',
    'cita-paciente'
  ];

  selects.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">— Todos los pacientes —</option>';
    if (id === 'sel-paciente-meds' || id === 'cita-paciente' || id === 'sel-paciente-dosis') {
      sel.innerHTML = '<option value="">— Seleccionar paciente —</option>';
    }

    APP.data.pacientes.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nombre;
      sel.appendChild(opt);
    });
    if (currentVal) sel.value = currentVal;
  });
}

// ─────────────────────────────────────────────────────────────
// MÓDULO: PACIENTES Y EXPORTACIÓN RESUMEN PDF
// ─────────────────────────────────────────────────────────────

function renderPacientes() {
  const grid = document.getElementById('lista-pacientes');
  const empty = document.getElementById('empty-pacientes');
  grid.innerHTML = '';

  if (APP.data.pacientes.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  empty.style.display = 'none';

  APP.data.pacientes.forEach(pac => {
    const numMeds = APP.data.medicamentos.filter(m => m.pacienteId === pac.id).length;
    const numDosis = APP.data.dosis.filter(d => d.pacienteId === pac.id).length;
    const numCitas = APP.data.citas.filter(c => c.pacienteId === pac.id).length;

    const card = document.createElement('div');
    card.className = 'patient-card';
    card.dataset.id = pac.id;
    card.innerHTML = `
      <div class="patient-actions">
        <button class="btn btn-secondary btn-icon" data-action="pdf-pac" data-id="${pac.id}" title="Generar Resumen PDF">📝</button>
        <button class="btn btn-secondary btn-icon" data-action="edit-pac" data-id="${pac.id}" title="Editar paciente">✏️</button>
        <button class="btn btn-danger btn-icon" data-action="del-pac" data-id="${pac.id}" title="Eliminar paciente">🗑️</button>
      </div>
      <div class="patient-avatar">${initials(pac.nombre)}</div>
      <div class="patient-name">${esc(pac.nombre)}</div>
      <div class="patient-meta">
        ${pac.edad ? pac.edad + ' años' : ''}${pac.telefono ? (pac.edad ? ' · 📞 ' : '📞 ') + esc(pac.telefono) : ''}
      </div>

      <div class="patient-medical-tags">
        ${pac.eps ? `<span class="med-tag">🏥 ${esc(pac.eps)}</span>` : ''}
        ${pac.tipoSangre ? `<span class="med-tag sangre">🩸 ${esc(pac.tipoSangre)}</span>` : ''}
        ${pac.alergias ? `<span class="med-tag alergia">⚠️ ${esc(pac.alergias)}</span>` : ''}
      </div>

      ${pac.emergenciaContacto ? `
        <div class="patient-emergency">
          🆘 SOS: <strong>${esc(pac.emergenciaContacto)}</strong> ${pac.emergenciaTelefono ? `(${esc(pac.emergenciaTelefono)})` : ''}
        </div>
      ` : ''}

      ${pac.notas ? `<div class="patient-meta" style="font-size:0.75rem;margin-top:0.4rem;">📝 ${esc(pac.notas.slice(0,60))}${pac.notas.length>60?'...':''}</div>` : ''}

      <div class="patient-stats" style="margin-top:0.75rem;">
        <span class="stat-pill">💊 ${numMeds} med${numMeds !== 1 ? 's' : ''}</span>
        <span class="stat-pill">⏰ ${numDosis} dosis</span>
        <span class="stat-pill">✍ ${numCitas} cita${numCitas !== 1 ? 's' : ''}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openFormPaciente(pacId = null) {
  const card = document.getElementById('form-paciente-card');
  const title = document.getElementById('form-paciente-title');
  APP.ui.editPacienteId = pacId;

  if (pacId) {
    const pac = APP.data.pacientes.find(p => p.id === pacId);
    if (!pac) return;
    title.textContent = 'Editar Paciente';
    document.getElementById('pac-nombre').value = pac.nombre || '';
    document.getElementById('pac-edad').value = pac.edad || '';
    document.getElementById('pac-telefono').value = pac.telefono || '';
    document.getElementById('pac-eps').value = pac.eps || '';
    document.getElementById('pac-sangre').value = pac.tipoSangre || '';
    document.getElementById('pac-alergias').value = pac.alergias || '';
    document.getElementById('pac-emergencia-contacto').value = pac.emergenciaContacto || '';
    document.getElementById('pac-emergencia-tel').value = pac.emergenciaTelefono || '';
    document.getElementById('pac-notas').value = pac.notas || '';
  } else {
    title.textContent = 'Nuevo Paciente';
    document.getElementById('pac-nombre').value = '';
    document.getElementById('pac-edad').value = '';
    document.getElementById('pac-telefono').value = '';
    document.getElementById('pac-eps').value = '';
    document.getElementById('pac-sangre').value = '';
    document.getElementById('pac-alergias').value = '';
    document.getElementById('pac-emergencia-contacto').value = '';
    document.getElementById('pac-emergencia-tel').value = '';
    document.getElementById('pac-notas').value = '';
  }

  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('pac-nombre').focus();
}

function closeFormPaciente() {
  document.getElementById('form-paciente-card').style.display = 'none';
  APP.ui.editPacienteId = null;
}

function guardarPaciente() {
  const nombre = document.getElementById('pac-nombre').value.trim();
  if (!nombre) { showToast('El nombre del paciente es obligatorio.', 'error'); return; }

  const datos = {
    nombre,
    edad: document.getElementById('pac-edad').value || '',
    telefono: document.getElementById('pac-telefono').value.trim(),
    eps: document.getElementById('pac-eps').value.trim(),
    tipoSangre: document.getElementById('pac-sangre').value,
    alergias: document.getElementById('pac-alergias').value.trim(),
    emergenciaContacto: document.getElementById('pac-emergencia-contacto').value.trim(),
    emergenciaTelefono: document.getElementById('pac-emergencia-tel').value.trim(),
    notas: document.getElementById('pac-notas').value.trim()
  };

  if (APP.ui.editPacienteId) {
    const idx = APP.data.pacientes.findIndex(p => p.id === APP.ui.editPacienteId);
    if (idx > -1) {
      APP.data.pacientes[idx] = { ...APP.data.pacientes[idx], ...datos };
      showToast('Paciente actualizado correctamente.', 'success');
    }
  } else {
    APP.data.pacientes.push({ id: genId(), ...datos });
    showToast('Paciente registrado correctamente.', 'success');
  }

  saveData();
  updatePacientesSelects();
  closeFormPaciente();
  renderPacientes();
}

async function eliminarPaciente(id) {
  const pac = APP.data.pacientes.find(p => p.id === id);
  if (!pac) return;

  const numMeds = APP.data.medicamentos.filter(m => m.pacienteId === id).length;
  const ok = await confirmModal(
    'Eliminar Paciente',
    `¿Eliminar a "${pac.nombre}"? Se eliminarán también sus ${numMeds} medicamento(s), dosis y citas asociadas.`
  );
  if (!ok) return;

  APP.data.pacientes = APP.data.pacientes.filter(p => p.id !== id);
  APP.data.medicamentos = APP.data.medicamentos.filter(m => m.pacienteId !== id);
  APP.data.dosis = APP.data.dosis.filter(d => d.pacienteId !== id);
  APP.data.citas = APP.data.citas.filter(c => c.pacienteId !== id);
  saveData();
  updatePacientesSelects();
  renderPacientes();
  renderAlertas();
  showToast('Paciente eliminado.', 'warning');
}

function exportarResumenPDF(pacienteId) {
  const pac = APP.data.pacientes.find(p => p.id === pacienteId);
  if (!pac) { showToast('Paciente no encontrado.', 'error'); return; }

  const meds = APP.data.medicamentos.filter(m => m.pacienteId === pacienteId);
  const dosis = APP.data.dosis.filter(d => d.pacienteId === pacienteId);
  const citas = APP.data.citas.filter(c => c.pacienteId === pacienteId);

  citas.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

  const printArea = document.getElementById('print-pdf-area');
  printArea.innerHTML = `
    <div class="pdf-container">
      <div class="pdf-header">
        <div>
          <h1 class="pdf-title">EL PASTILLERO Ob — RESUMEN MÉDICO</h1>
          <p class="pdf-subtitle">Ficha integral del paciente y plan de tratamiento</p>
        </div>
        <div class="pdf-date">Generado el: <strong>${fmtDate(todayStr())}</strong></div>
      </div>

      <div class="pdf-section">
        <h2 class="pdf-section-title">👤 Datos del Paciente</h2>
        <div class="pdf-grid-info">
          <div><strong>Nombre:</strong> ${esc(pac.nombre)}</div>
          <div><strong>Edad:</strong> ${pac.edad ? pac.edad + ' años' : 'No registrada'}</div>
          <div><strong>Teléfono:</strong> ${esc(pac.telefono || 'No registrado')}</div>
          <div><strong>EPS:</strong> ${esc(pac.eps || 'No registrada')}</div>
          <div><strong>Grupo Sanguíneo:</strong> ${esc(pac.tipoSangre || 'No registrado')}</div>
          <div><strong>Alergias:</strong> <span style="color:#d32f2f;font-weight:bold;">${esc(pac.alergias || 'Ninguna conocida')}</span></div>
          <div><strong>Contacto de Emergencia:</strong> ${esc(pac.emergenciaContacto || 'No registrado')}</div>
          <div><strong>Teléfono de Emergencia:</strong> ${esc(pac.emergenciaTelefono || 'No registrado')}</div>
        </div>
        ${pac.notas ? `<p style="margin-top:6px;font-size:9.5px;"><strong>Observaciones:</strong> ${esc(pac.notas)}</p>` : ''}
      </div>

      <div class="pdf-section">
        <h2 class="pdf-section-title">⏰ Horario y Plan de Dosificación</h2>
        ${dosis.length === 0 ? '<p style="font-size:9.5px;color:#666;">No hay horarios programados.</p>' : `
          <table class="pdf-table">
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Dosis / Frecuencia</th>
                <th>Jornadas y Horas</th>
                <th>Instrucciones</th>
              </tr>
            </thead>
            <tbody>
              ${dosis.map(d => {
                const med = meds.find(m => m.id === d.medicamentoId);
                const jornadasStr = (d.jornadas || []).map(j => `${j.jornada.toUpperCase()} (${j.hora || ''})`).join(' · ');
                return `
                  <tr>
                    <td><strong>${esc(med ? med.nombre : 'Medicamento')}</strong> (${med ? med.concentracion + med.unidad : ''})</td>
                    <td>${esc(getFrecuenciaTexto(d))}</td>
                    <td>${esc(jornadasStr)}</td>
                    <td style="white-space:pre-wrap;">${esc(d.notas || '—')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `}
      </div>

      <div class="pdf-section">
        <h2 class="pdf-section-title">💊 Medicamentos e Inventario</h2>
        ${meds.length === 0 ? '<p style="font-size:9.5px;color:#666;">No hay medicamentos registrados.</p>' : `
          <table class="pdf-table">
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Stock</th>
                <th>Recepción Actual</th>
                <th>Próxima Recepción</th>
                <th>Punto de Entrega</th>
              </tr>
            </thead>
            <tbody>
              ${meds.map(m => `
                <tr>
                  <td><strong>${esc(m.nombre)}</strong> ${m.concentracion}${m.unidad}</td>
                  <td>${m.cantidad} unidades</td>
                  <td>${fmtDate(m.fechaRecepcion)}</td>
                  <td>${fmtDate(m.proximaRecepcion)}</td>
                  <td>${esc(puntoNombre(m.puntoEntregaId) || '—')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>

      <div class="pdf-section">
        <h2 class="pdf-section-title">🩺 Citas Médicas Programadas</h2>
        ${citas.length === 0 ? '<p style="font-size:9.5px;color:#666;">No hay citas médicas agendadas.</p>' : `
          <table class="pdf-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Servicio / Especialidad</th>
                <th>Profesional</th>
                <th>Lugar / Dirección</th>
              </tr>
            </thead>
            <tbody>
              ${citas.map(c => `
                <tr>
                  <td><strong>${fmtDate(c.fecha)}</strong> ${c.hora ? '· ' + esc(c.hora) : ''}</td>
                  <td>${esc(c.servicio || 'Consulta')}</td>
                  <td>${esc(c.profesional || '—')}</td>
                  <td>${esc(c.lugar || '')} ${c.direccion ? `(${esc(c.direccion)})` : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>

      <div class="pdf-footer">
        Oscar Botero - Ficha generada por <strong>El Pastillero Ob</strong> — Resumen de Control Médico.
      </div>
    </div>
  `;

  window.print();
}

// ─────────────────────────────────────────────────────────────
// MÓDULO: MEDICAMENTOS Y REABASTECIMIENTO RÁPIDO
// ─────────────────────────────────────────────────────────────

function getMedsForPaciente(pacId) {
  if (!pacId) return APP.data.medicamentos;
  return APP.data.medicamentos.filter(m => m.pacienteId === pacId);
}

function renderMedicamentos() {
  const lista = document.getElementById('lista-medicamentos');
  const empty = document.getElementById('empty-medicamentos');
  lista.innerHTML = '';

  const pacId = APP.ui.selPacienteMeds;
  const meds = getMedsForPaciente(pacId);

  if (!pacId) {
    lista.style.display = 'none';
    empty.style.display = 'block';
    empty.querySelector('p').innerHTML = 'Selecciona un paciente de la lista para ver sus medicamentos.<br>O haz clic en <strong>"+ Nuevo Medicamento"</strong>.';
    return;
  }

  if (meds.length === 0) {
    lista.style.display = 'none';
    empty.style.display = 'block';
    empty.querySelector('p').innerHTML = 'Este paciente no tiene medicamentos registrados.<br>Haz clic en <strong>"+ Nuevo Medicamento"</strong>.';
    return;
  }

  lista.style.display = 'flex';
  empty.style.display = 'none';

  meds.forEach(med => {
    const dias = daysDiff(med.proximaRecepcion);
    const near = dias >= 0 && dias <= 7;
    const stockMin = med.stockMinimo !== undefined ? Number(med.stockMinimo) : 5;
    const bajoStock = med.cantidad <= stockMin;

    const item = document.createElement('div');
    item.className = 'med-item' + (near || bajoStock ? ' near-expiry' : '');
    item.dataset.id = med.id;
    item.innerHTML = `
      <div class="med-info">
        <div class="med-name">
          💊 ${esc(med.nombre)}
          <span class="med-badge">${med.concentracion} ${med.unidad}</span>
          ${near ? '<span style="color:#00e676;font-size:0.8rem;font-weight:700;">⏩ Recepción próxima</span>' : ''}
          ${bajoStock ? `<span style="color:#ff5252;font-size:0.8rem;font-weight:700;">⚠️ Stock bajo (${med.cantidad})</span>` : ''}
        </div>
        <div class="med-details">
          <span class="med-detail-item">📦 Stock actual: <strong>${med.cantidad}</strong> (mín: ${stockMin})</span>
          ${med.laboratorio ? `<span class="med-detail-item">🏭 ${esc(med.laboratorio)}</span>` : ''}
          <span class="med-detail-item">📆 Recepción: <strong>${fmtDate(med.fechaRecepcion)}</strong></span>
          <span class="med-detail-item">⏩ Próxima: <strong style="color:#00e676;">${fmtDate(med.proximaRecepcion)}</strong>${near ? ` <span style="color:#00e676">(${dias === 0 ? 'HOY' : dias + 'd'})</span>` : ''}</span>
          ${puntoNombre(med.puntoEntregaId) ? `<span class="med-detail-item">🏥 ${esc(puntoNombre(med.puntoEntregaId))}</span>` : ''}
        </div>
        ${multilineDetail('Notas del medicamento', med.notas)}
      </div>
      <div class="med-actions">
        <button class="btn btn-success btn-icon" data-action="reabastecer-med" data-id="${med.id}" title="Reabastecer stock (Llegó entrega)">📦 +</button>
        <button class="btn btn-secondary btn-icon" data-action="edit-med" data-id="${med.id}" title="Editar medicamento">✏️</button>
        <button class="btn btn-danger btn-icon" data-action="del-med" data-id="${med.id}" title="Eliminar medicamento">🗑️</button>
      </div>
    `;
    lista.appendChild(item);
  });
}

function openReabastecerModal(medId) {
  const med = APP.data.medicamentos.find(m => m.id === medId);
  if (!med) return;
  APP.ui.reabastecerMedId = medId;
  document.getElementById('reabastecer-med-nombre').textContent = `Medicamento: ${med.nombre} (${med.concentracion}${med.unidad}) — Stock actual: ${med.cantidad}`;
  document.getElementById('reabastecer-cantidad').value = '';
  document.getElementById('modal-reabastecer').style.display = 'flex';
  document.getElementById('reabastecer-cantidad').focus();
}

function guardarReabastecimiento() {
  const med = APP.data.medicamentos.find(m => m.id === APP.ui.reabastecerMedId);
  const cant = parseFloat(document.getElementById('reabastecer-cantidad').value);
  if (!med || isNaN(cant) || cant <= 0) {
    showToast('Ingresa una cantidad válida mayor a 0.', 'warning');
    return;
  }

  med.cantidad = Math.round((med.cantidad + cant) * 100) / 100;
  med.fechaRecepcion = todayStr();
  saveData();

  document.getElementById('modal-reabastecer').style.display = 'none';
  APP.ui.reabastecerMedId = null;
  renderMedicamentos();
  renderAlertas();
  showToast(`¡Stock actualizado! +${cant} unidades ingresadas a ${med.nombre}.`, 'success');
}

function openFormMed(medId = null) {
  const card = document.getElementById('form-med-card');
  const title = document.getElementById('form-med-title');
  APP.ui.editMedId = medId;

  if (!APP.ui.selPacienteMeds && !medId) {
    showToast('Por favor selecciona primero un paciente.', 'warning');
    return;
  }

  if (medId) {
    const med = APP.data.medicamentos.find(m => m.id === medId);
    if (!med) return;
    title.textContent = 'Editar Medicamento';
    document.getElementById('med-nombre').value = med.nombre;
    document.getElementById('med-concentracion').value = med.concentracion;
    document.getElementById('med-unidad').value = med.unidad;
    document.getElementById('med-cantidad').value = med.cantidad;
    document.getElementById('med-stock-minimo').value = med.stockMinimo !== undefined ? med.stockMinimo : 5;
    document.getElementById('med-laboratorio').value = med.laboratorio || '';
    document.getElementById('med-fecha-recepcion').value = med.fechaRecepcion || '';
    document.getElementById('med-proxima-recepcion').value = med.proximaRecepcion || '';
    updatePuntoEntregaSelect(med.puntoEntregaId || '');
    document.getElementById('med-notas').value = med.notas || '';
  } else {
    title.textContent = 'Nuevo Medicamento';
    document.getElementById('med-nombre').value = '';
    document.getElementById('med-concentracion').value = '';
    document.getElementById('med-unidad').value = 'mg';
    document.getElementById('med-cantidad').value = '';
    document.getElementById('med-stock-minimo').value = '5';
    document.getElementById('med-laboratorio').value = '';
    document.getElementById('med-fecha-recepcion').value = todayStr();
    document.getElementById('med-proxima-recepcion').value = '';
    updatePuntoEntregaSelect('');
    document.getElementById('med-notas').value = '';
  }

  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('med-nombre').focus();
}

function closeFormMed() {
  document.getElementById('form-med-card').style.display = 'none';
  APP.ui.editMedId = null;
}

function guardarMed() {
  const nombre = document.getElementById('med-nombre').value.trim();
  const conc = parseFloat(document.getElementById('med-concentracion').value);
  const cant = parseFloat(document.getElementById('med-cantidad').value);
  const stockMin = parseFloat(document.getElementById('med-stock-minimo').value) || 0;

  if (!nombre) { showToast('El nombre del medicamento es obligatorio.', 'error'); return; }
  if (isNaN(conc) || conc <= 0) { showToast('La concentración debe ser un número mayor a 0.', 'error'); return; }
  if (isNaN(cant) || cant < 0) { showToast('La cantidad debe ser un número válido.', 'error'); return; }

  const datos = {
    pacienteId: APP.ui.selPacienteMeds || (APP.data.medicamentos.find(m => m.id === APP.ui.editMedId)?.pacienteId),
    nombre,
    concentracion: conc,
    unidad: document.getElementById('med-unidad').value,
    cantidad: cant,
    stockMinimo: stockMin,
    laboratorio: document.getElementById('med-laboratorio').value.trim(),
    fechaRecepcion: document.getElementById('med-fecha-recepcion').value,
    proximaRecepcion: document.getElementById('med-proxima-recepcion').value,
    puntoEntregaId: document.getElementById('med-punto-entrega').value,
    notas: document.getElementById('med-notas').value.trim()
  };

  if (APP.ui.editMedId) {
    const idx = APP.data.medicamentos.findIndex(m => m.id === APP.ui.editMedId);
    if (idx > -1) {
      APP.data.medicamentos[idx] = { ...APP.data.medicamentos[idx], ...datos };
      showToast('Medicamento actualizado.', 'success');
    }
  } else {
    APP.data.medicamentos.push({ id: genId(), ...datos });
    showToast('Medicamento guardado.', 'success');
  }

  saveData();
  closeFormMed();
  renderMedicamentos();
  renderAlertas();
  updateDosisMedSelect();
  renderPacientes();
}

async function eliminarMed(id) {
  const med = APP.data.medicamentos.find(m => m.id === id);
  if (!med) return;
  const ok = await confirmModal('Eliminar Medicamento', `¿Eliminar "${med.nombre} ${med.concentracion}${med.unidad}"? También se eliminarán sus dosis programadas.`);
  if (!ok) return;

  APP.data.medicamentos = APP.data.medicamentos.filter(m => m.id !== id);
  APP.data.dosis = APP.data.dosis.filter(d => d.medicamentoId !== id);
  saveData();
  renderMedicamentos();
  renderAlertas();
  renderPacientes();
  showToast('Medicamento eliminado.', 'warning');
}

// ─────────────────────────────────────────────────────────────
// MÓDULO: OTROS SITIOS (ESTABLECIMIENTOS / PUNTOS DE INTERÉS)
// ─────────────────────────────────────────────────────────────

const SITIO_CAMPOS = ['nombre','direccion','web','correo','telefono','whatsapp','servicio','fecha','horario','info'];

function renderSitios() {
  const lista = document.getElementById('lista-sitios');
  const empty = document.getElementById('empty-sitios');
  lista.innerHTML = '';

  if (!APP.data.sitios || APP.data.sitios.length === 0) {
    lista.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  lista.style.display = 'flex';
  empty.style.display = 'none';

  APP.data.sitios.forEach(s => {
    const item = document.createElement('div');
    item.className = 'med-item';
    item.innerHTML = `
      <div class="med-info">
        <div class="med-name">
          🏢 ${esc(s.nombre || 'Sitio')}
          ${s.servicio ? `<span class="med-badge">${esc(s.servicio)}</span>` : ''}
          ${s.fecha ? `<span class="med-badge" style="background:rgba(41,121,255,0.15);color:#2979ff;">📆 ${fmtDate(s.fecha)}</span>` : ''}
        </div>
        <div class="med-details">
          ${detail('📍', s.direccion)}
          ${detail('📞', s.telefono)}
          ${detail('📧', s.correo)}
          ${detail('🌐', s.web, webLink(s.web))}
          ${detail('📲', s.whatsapp, waLink(s.whatsapp))}
        </div>
        ${multilineDetail('Horario', s.horario)}
        ${multilineDetail('Información Adicional', s.info)}
      </div>
      <div class="med-actions">
        <button class="btn btn-secondary btn-icon" data-action="edit-sitio" data-id="${s.id}" title="Editar">✏️</button>
        <button class="btn btn-danger btn-icon" data-action="del-sitio" data-id="${s.id}" title="Eliminar">🗑️</button>
      </div>
    `;
    lista.appendChild(item);
  });
}

function openFormSitio(id = null) {
  APP.ui.editSitioId = id;
  const s = id ? APP.data.sitios.find(x => x.id === id) : null;
  document.getElementById('form-sitio-title').textContent = s ? 'Editar Sitio' : 'Nuevo Sitio / Establecimiento';
  SITIO_CAMPOS.forEach(k => {
    const el = document.getElementById('sitio-' + k);
    if (el) el.value = s ? (s[k] || '') : '';
  });
  const card = document.getElementById('form-sitio-card');
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeFormSitio() {
  document.getElementById('form-sitio-card').style.display = 'none';
  APP.ui.editSitioId = null;
}

function guardarSitio() {
  const nombre = document.getElementById('sitio-nombre').value.trim();
  if (!nombre) { showToast('El nombre del sitio o establecimiento es obligatorio.', 'error'); return; }

  const datos = {};
  SITIO_CAMPOS.forEach(k => {
    const el = document.getElementById('sitio-' + k);
    datos[k] = el ? el.value.trim() : '';
  });

  if (APP.ui.editSitioId) {
    const idx = APP.data.sitios.findIndex(x => x.id === APP.ui.editSitioId);
    if (idx > -1) APP.data.sitios[idx] = { ...APP.data.sitios[idx], ...datos };
    showToast('Sitio actualizado correctamente.', 'success');
  } else {
    APP.data.sitios.push({ id: genId(), ...datos });
    showToast('Sitio guardado correctamente.', 'success');
  }

  saveData();
  closeFormSitio();
  renderSitios();
  renderCalendar();
  renderAlertas();
}

async function eliminarSitio(id) {
  const ok = await confirmModal('Eliminar Sitio', '¿Deseas eliminar este sitio o establecimiento?');
  if (!ok) return;
  APP.data.sitios = APP.data.sitios.filter(x => x.id !== id);
  saveData();
  renderSitios();
  renderCalendar();
  renderAlertas();
  showToast('Sitio eliminado.', 'info');
}

// ─────────────────────────────────────────────────────────────
// MÓDULO: DOSIS, CHECKLIST DIARIO Y COMPARTIR WHATSAPP
// ─────────────────────────────────────────────────────────────

function updateDosisMedSelect() {
  const sel = document.getElementById('dosis-medicamento');
  if (!sel) return;
  const pacId = APP.ui.selPacienteDosis;
  const meds = pacId ? APP.data.medicamentos.filter(m => m.pacienteId === pacId) : [];
  sel.innerHTML = '<option value="">— Seleccionar medicamento —</option>';
  meds.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.nombre} ${m.concentracion}${m.unidad}`;
    sel.appendChild(opt);
  });
}

function renderDosis() {
  const schedule = document.getElementById('dosis-schedule');
  const empty = document.getElementById('empty-dosis');
  const btnWa = document.getElementById('btn-compartir-whatsapp-dosis');
  schedule.innerHTML = '';

  const pacId = APP.ui.selPacienteDosis;
  if (!pacId) {
    schedule.style.display = 'none';
    empty.style.display = 'block';
    if (btnWa) btnWa.style.display = 'none';
    return;
  }

  if (btnWa) btnWa.style.display = 'inline-flex';

  const dosisDelPaciente = APP.data.dosis.filter(d => d.pacienteId === pacId);

  const addWrap = document.createElement('div');
  addWrap.className = 'dosis-add-btn-wrap';
  addWrap.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
      <span style="font-size:0.9rem; font-weight:600; color:var(--text-secondary);">📅 Tomas de hoy: ${fmtDate(todayStr())}</span>
      <button class="btn btn-primary" id="btn-nueva-dosis">+ Programar Dosis</button>
    </div>
  `;
  schedule.appendChild(addWrap);

  if (dosisDelPaciente.length === 0) {
    const p = document.createElement('p');
    p.style.cssText = 'color:var(--text-muted);font-size:0.9rem;padding:1rem 0;';
    p.textContent = 'No hay dosis programadas. Haz clic en "+ Programar Dosis".';
    schedule.appendChild(p);
    schedule.style.display = 'flex';
    empty.style.display = 'none';
    document.getElementById('btn-nueva-dosis').addEventListener('click', () => openFormDosis());
    return;
  }

  const jornadaMap = { mañana: [], tarde: [], noche: [] };
  const jornadaIcons = { mañana: '🌅', tarde: '☀️', noche: '🌙' };
  const jornadaLabels = { mañana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

  dosisDelPaciente.forEach(d => {
    const med = APP.data.medicamentos.find(m => m.id === d.medicamentoId);
    if (!med) return;
    (d.jornadas || []).forEach(j => {
      const jornadaKey = j.jornada;
      if (jornadaMap[jornadaKey] !== undefined) {
        jornadaMap[jornadaKey].push({ dosis: d, med, hora: j.hora });
      }
    });
  });

  const hoyKey = todayStr();
  if (!APP.data.registroTomas[hoyKey]) {
    APP.data.registroTomas[hoyKey] = {};
  }

  ['mañana', 'tarde', 'noche'].forEach(j => {
    if (jornadaMap[j].length === 0) return;
    const block = document.createElement('div');
    block.className = 'jornada-block';

    const firstHora = jornadaMap[j][0]?.hora || '';
    block.innerHTML = `
      <div class="jornada-header">${jornadaIcons[j]} ${jornadaLabels[j]}${firstHora ? ' — ' + firstHora : ''}</div>
      <div class="jornada-items" id="jornada-items-${j}"></div>
    `;
    schedule.appendChild(block);

    const itemsContainer = block.querySelector(`#jornada-items-${j}`);
    jornadaMap[j].forEach(({ dosis, med }) => {
      const row = document.createElement('div');
      row.className = 'dosis-row';

      const tomaId = `${dosis.id}_${j}`;
      const tomada = !!APP.data.registroTomas[hoyKey][tomaId];

      row.innerHTML = `
        <label class="checklist-wrap" title="Marcar como tomada hoy">
          <input type="checkbox" class="check-box-toma" data-toma="${tomaId}" ${tomada ? 'checked' : ''} />
          <div class="${tomada ? 'toma-completada' : ''}">
            <div class="dosis-med-name">💊 ${esc(med.nombre)} <small style="color:var(--text-muted)">${med.concentracion}${med.unidad}</small></div>
            <div style="font-size:0.78rem;color:var(--accent);margin-top:2px;">Frecuencia: <strong>${esc(getFrecuenciaTexto(dosis))}</strong></div>
            ${dosis.notas ? multilineDetail('Instrucciones', dosis.notas) : ''}
          </div>
        </label>
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <button class="btn btn-secondary btn-icon" data-action="edit-dosis" data-id="${dosis.id}" title="Editar">✏️</button>
          <button class="btn btn-danger btn-icon" data-action="del-dosis" data-id="${dosis.id}" title="Eliminar">🗑️</button>
        </div>
      `;
      itemsContainer.appendChild(row);
    });
  });

  schedule.style.display = 'flex';
  empty.style.display = 'none';
  document.getElementById('btn-nueva-dosis')?.addEventListener('click', () => openFormDosis());

  schedule.querySelectorAll('.check-box-toma').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const tid = e.target.dataset.toma;
      APP.data.registroTomas[hoyKey][tid] = e.target.checked;
      saveData();
      renderDosis();
      if (e.target.checked) {
        showToast('¡Dosis marcada como tomada! Buen trabajo. 🩺', 'success', 2500);
      }
    });
  });
}

function compartirPlanWhatsApp() {
  const pacId = APP.ui.selPacienteDosis;
  const pac = APP.data.pacientes.find(p => p.id === pacId);
  if (!pac) return;

  const dosisDelPaciente = APP.data.dosis.filter(d => d.pacienteId === pacId);
  if (dosisDelPaciente.length === 0) {
    showToast('El paciente no tiene dosis programadas para compartir.', 'warning');
    return;
  }

  let texto = `*EL PASTILLERO Ob — Plan de Tomas Diarias*\n`;
  texto += `👤 *Paciente:* ${pac.nombre}\n`;
  texto += `📅 *Fecha:* ${fmtDate(todayStr())}\n\n`;

  const jornadaMap = { mañana: [], tarde: [], noche: [] };
  dosisDelPaciente.forEach(d => {
    const med = APP.data.medicamentos.find(m => m.id === d.medicamentoId);
    if (!med) return;
    (d.jornadas || []).forEach(j => {
      if (jornadaMap[j.jornada]) {
        jornadaMap[j.jornada].push({ med, dosis: d, hora: j.hora });
      }
    });
  });

  const iconJornada = { mañana: '🌅 MAÑANA', tarde: '☀️ TARDE', noche: '🌙 NOCHE' };
  ['mañana', 'tarde', 'noche'].forEach(j => {
    if (jornadaMap[j].length > 0) {
      texto += `*${iconJornada[j]}*\n`;
      jornadaMap[j].forEach(({ med, dosis, hora }) => {
        texto += `• ${med.nombre} ${med.concentracion}${med.unidad} (${hora || ''}): ${getFrecuenciaTexto(dosis)}`;
        if (dosis.notas) texto += `\n  _Instrucciones:_ ${dosis.notas}`;
        texto += `\n`;
      });
      texto += `\n`;
    }
  });

  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
}

function openFormDosis(dosisId = null) {
  const card = document.getElementById('form-dosis-card');
  APP.ui.editDosisId = dosisId;

  const selFrec = document.getElementById('dosis-frecuencia');
  const groupInter = document.getElementById('group-dosis-intervalo');

  if (dosisId) {
    const d = APP.data.dosis.find(x => x.id === dosisId);
    if (!d) return;
    document.getElementById('dosis-medicamento').value = d.medicamentoId;
    document.getElementById('dosis-cantidad-dia').value = d.cantidadDia;
    selFrec.value = d.frecuencia || 'diaria';
    document.getElementById('dosis-intervalo-dias').value = d.intervaloDias || 2;
    document.getElementById('dosis-notas').value = d.notas || '';

    ['manana','tarde','noche'].forEach(j => {
      document.getElementById('jornada-' + j).checked = false;
    });
    (d.jornadas || []).forEach(j => {
      const key = j.jornada === 'mañana' ? 'manana' : j.jornada;
      const cb = document.getElementById('jornada-' + key);
      if (cb) cb.checked = true;
      const horaInp = document.getElementById('dosis-hora-' + key);
      if (horaInp && j.hora) horaInp.value = j.hora;
    });
  } else {
    document.getElementById('dosis-medicamento').value = '';
    document.getElementById('dosis-cantidad-dia').value = '1';
    selFrec.value = 'diaria';
    document.getElementById('dosis-intervalo-dias').value = '2';
    document.getElementById('dosis-notas').value = '';
    document.getElementById('jornada-manana').checked = true;
    document.getElementById('jornada-tarde').checked = false;
    document.getElementById('jornada-noche').checked = false;
    document.getElementById('dosis-hora-manana').value = '07:00';
    document.getElementById('dosis-hora-tarde').value = '13:00';
    document.getElementById('dosis-hora-noche').value = '20:00';
  }

  groupInter.style.display = selFrec.value === 'cada_dias' ? 'block' : 'none';

  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeFormDosis() {
  document.getElementById('form-dosis-card').style.display = 'none';
  APP.ui.editDosisId = null;
}

function guardarDosis() {
  const medId = document.getElementById('dosis-medicamento').value;
  const cantDia = parseFloat(document.getElementById('dosis-cantidad-dia').value);
  const frecuencia = document.getElementById('dosis-frecuencia').value;
  const intervaloDias = parseInt(document.getElementById('dosis-intervalo-dias').value, 10) || 2;

  if (!medId) { showToast('Selecciona un medicamento.', 'error'); return; }
  if (isNaN(cantDia) || cantDia <= 0) { showToast('La cantidad debe ser mayor a 0.', 'error'); return; }

  const jornadas = [];
  if (document.getElementById('jornada-manana').checked) {
    jornadas.push({ jornada: 'mañana', hora: document.getElementById('dosis-hora-manana').value });
  }
  if (document.getElementById('jornada-tarde').checked) {
    jornadas.push({ jornada: 'tarde', hora: document.getElementById('dosis-hora-tarde').value });
  }
  if (document.getElementById('jornada-noche').checked) {
    jornadas.push({ jornada: 'noche', hora: document.getElementById('dosis-hora-noche').value });
  }

  if (jornadas.length === 0) { showToast('Selecciona al menos una jornada.', 'error'); return; }

  const datos = {
    pacienteId: APP.ui.selPacienteDosis,
    medicamentoId: medId,
    cantidadDia: cantDia,
    frecuencia,
    intervaloDias: frecuencia === 'cada_dias' ? intervaloDias : null,
    jornadas,
    notas: document.getElementById('dosis-notas').value.trim()
  };

  if (APP.ui.editDosisId) {
    const idx = APP.data.dosis.findIndex(d => d.id === APP.ui.editDosisId);
    if (idx > -1) {
      APP.data.dosis[idx] = { ...APP.data.dosis[idx], ...datos };
      showToast('Dosis actualizada.', 'success');
    }
  } else {
    const existe = APP.data.dosis.find(d => d.pacienteId === APP.ui.selPacienteDosis && d.medicamentoId === medId);
    if (existe) {
      showToast('Ya existe una dosis para este medicamento. Edítala.', 'warning');
      return;
    }
    APP.data.dosis.push({ id: genId(), ...datos });
    showToast('Dosis programada.', 'success');
  }

  saveData();
  closeFormDosis();
  renderDosis();
  renderPacientes();
}

async function eliminarDosis(id) {
  const ok = await confirmModal('Eliminar Dosis', '¿Eliminar esta programación de dosis?');
  if (!ok) return;
  APP.data.dosis = APP.data.dosis.filter(d => d.id !== id);
  saveData();
  renderDosis();
  renderPacientes();
  showToast('Dosis eliminada.', 'warning');
}

// ─────────────────────────────────────────────────────────────
// MÓDULO: CALENDARIO (VERDE FIJO EN RECEPCIÓN + AZUL EN SITIOS)
// ─────────────────────────────────────────────────────────────

function renderCalendar() {
  const year = APP.ui.calYear;
  const month = APP.ui.calMonth;
  const pacId = APP.ui.selPacienteCal;

  document.getElementById('cal-title').textContent = `${MESES[month]} ${year}`;

  const receptionDates = new Set();
  const meds = pacId ? APP.data.medicamentos.filter(m => m.pacienteId === pacId) : APP.data.medicamentos;
  meds.forEach(med => {
    if (med.proximaRecepcion) {
      const d = new Date(med.proximaRecepcion + 'T00:00:00');
      if (d.getFullYear() === year && d.getMonth() === month) receptionDates.add(d.getDate());
    }
    if (med.fechaRecepcion) {
      const d = new Date(med.fechaRecepcion + 'T00:00:00');
      if (d.getFullYear() === year && d.getMonth() === month) receptionDates.add(d.getDate());
    }
  });

  const specialDates = {};
  APP.data.fechasEspeciales.forEach(fe => {
    const d = new Date(fe.fecha + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) specialDates[d.getDate()] = fe.comentario;
  });

  const citaDates = new Set();
  APP.data.citas.filter(ct => !pacId || ct.pacienteId === pacId).forEach(ct => {
    if (!ct.fecha) return;
    const d = new Date(ct.fecha + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) citaDates.add(d.getDate());
  });

  const sitioDates = new Set();
  (APP.data.sitios || []).forEach(st => {
    if (!st.fecha) return;
    const d = new Date(st.fecha + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) sitioDates.add(d.getDate());
  });

  const today = new Date();
  const isCurrentMonthYear = today.getFullYear() === year && today.getMonth() === month;
  const todayDay = today.getDate();

  const grid = document.getElementById('calendar-grid');
  const headers = grid.querySelectorAll('.cal-day-header');
  grid.innerHTML = '';
  headers.forEach(h => grid.appendChild(h));

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = document.createElement('div');
    cell.className = 'cal-day other-month';
    cell.textContent = daysInPrevMonth - i;
    grid.appendChild(cell);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    if (isCurrentMonthYear && d === todayDay) cell.classList.add('today');
    if (receptionDates.has(d)) cell.classList.add('has-reception');
    if (specialDates[d] !== undefined) cell.classList.add('has-special');
    if (citaDates.has(d)) cell.classList.add('has-cita');
    if (sitioDates.has(d)) cell.classList.add('has-sitio');

    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `${d} de ${MESES[month]}`);
    cell.setAttribute('tabindex', '0');

    const dots = document.createElement('div');
    dots.className = 'cal-dots';
    if (receptionDates.has(d)) dots.innerHTML += '<span class="cal-dot reception" title="Recepción"></span>';
    if (specialDates[d] !== undefined) dots.innerHTML += '<span class="cal-dot special" title="Especial"></span>';
    if (citaDates.has(d)) dots.innerHTML += '<span class="cal-dot cita" title="Cita médica"></span>';
    if (sitioDates.has(d)) dots.innerHTML += '<span class="cal-dot sitio" title="Otro Sitio"></span>';

    cell.innerHTML = `<span>${d}</span>`;
    cell.appendChild(dots);

    cell.addEventListener('click', () => openCalendarDay(dateStr, d));
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openCalendarDay(dateStr, d);
    });

    grid.appendChild(cell);
  }

  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day other-month';
    cell.textContent = d;
    grid.appendChild(cell);
  }
}

function openCalendarDay(dateStr, day) {
  APP.ui.calSelectedDate = dateStr;
  const existing = APP.data.fechasEspeciales.find(f => f.fecha === dateStr);
  const medsEnFecha = APP.data.medicamentos.filter(m => m.proximaRecepcion === dateStr || m.fechaRecepcion === dateStr);
  const citasEnFecha = APP.data.citas.filter(ct => ct.fecha === dateStr && (!APP.ui.selPacienteCal || ct.pacienteId === APP.ui.selPacienteCal));
  const sitiosEnFecha = (APP.data.sitios || []).filter(st => st.fecha === dateStr);

  if (medsEnFecha.length > 0 || citasEnFecha.length > 0 || sitiosEnFecha.length > 0) {
    const modal = document.getElementById('modal-dia-cal');
    const title = document.getElementById('modal-dia-title');
    const content = document.getElementById('modal-dia-content');
    title.textContent = `📆 ${day} de ${MESES[APP.ui.calMonth]} de ${APP.ui.calYear}`;
    content.innerHTML = `
      <div style="margin-bottom:1rem;">
        ${medsEnFecha.length ? '<p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.5rem;font-weight:600;">💊 Medicamentos programados:</p>' : ''}
        ${medsEnFecha.map(m => {
          const pac = APP.data.pacientes.find(p => p.id === m.pacienteId);
          const tipo = m.proximaRecepcion === dateStr ? '⏩ Próxima recepción' : '📆 Recepción';
          return `<div style="padding:0.4rem 0.6rem;background:rgba(0,230,118,0.12);border-left:3px solid #00e676;border-radius:6px;margin-bottom:0.3rem;font-size:0.83rem;">
            <strong>${esc(m.nombre)} ${m.concentracion}${m.unidad}</strong>${pac ? ` — ${esc(pac.nombre)}` : ''}<br>
            <span style="color:#00e676;font-weight:700;">${tipo}</span>
          </div>`;
        }).join('')}
      </div>
      ${citasEnFecha.length ? `<div style="margin-bottom:1rem;">
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.5rem;font-weight:600;">🩺 Citas médicas:</p>
        ${citasEnFecha.map(citaResumenHTML).join('')}
      </div>` : ''}
      ${sitiosEnFecha.length ? `<div style="margin-bottom:1rem;">
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.5rem;font-weight:600;">🏢 Otros Sitios / Visitas:</p>
        ${sitiosEnFecha.map(st => `
          <div style="padding:0.4rem 0.6rem;background:rgba(41,121,255,0.12);border-left:3px solid #2979ff;border-radius:6px;margin-bottom:0.3rem;font-size:0.83rem;">
            <strong>${esc(st.nombre)}</strong> ${st.servicio ? `· ${esc(st.servicio)}` : ''}<br>
            ${st.direccion ? `📍 ${esc(st.direccion)}<br>` : ''}
            ${st.telefono ? `📞 ${esc(st.telefono)}` : ''}
          </div>
        `).join('')}
      </div>` : ''}
      ${existing ? `<div style="padding:0.6rem;background:rgba(255,152,0,0.1);border-radius:6px;border-left:3px solid #ff9800;font-size:0.83rem;margin-top:0.5rem;">⭐ <strong>Nota especial:</strong> ${esc(existing.comentario)}</div>` : ''}
      <div style="margin-top:1rem; text-align:right;">
        <button class="btn btn-secondary" id="btn-gestionar-nota-cal" style="font-size:0.8rem;">
          ⭐ ${existing ? 'Editar nota especial' : 'Agregar nota especial'}
        </button>
      </div>
    `;

    document.getElementById('btn-gestionar-nota-cal')?.addEventListener('click', () => {
      modal.style.display = 'none';
      abrirModalFechaEspecial(dateStr, existing);
    });

    modal.style.display = 'flex';
    return;
  }

  abrirModalFechaEspecial(dateStr, existing);
}

function abrirModalFechaEspecial(dateStr, existing) {
  const modal = document.getElementById('modal-fecha-especial');
  const d = new Date(dateStr + 'T00:00:00');
  document.getElementById('modal-fecha-label').textContent = `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  document.getElementById('modal-fecha-titulo').textContent = existing ? 'Editar fecha especial' : 'Marcar fecha especial';
  document.getElementById('fecha-especial-comentario').value = existing ? existing.comentario : '';
  document.getElementById('btn-eliminar-fecha').style.display = existing ? 'inline-flex' : 'none';
  modal.style.display = 'flex';
}

function guardarFechaEspecial() {
  const dateStr = APP.ui.calSelectedDate;
  const comentario = document.getElementById('fecha-especial-comentario').value.trim();
  if (!comentario) { showToast('Escribe un comentario para la fecha especial.', 'warning'); return; }

  const idx = APP.data.fechasEspeciales.findIndex(f => f.fecha === dateStr);
  if (idx > -1) {
    APP.data.fechasEspeciales[idx].comentario = comentario;
  } else {
    APP.data.fechasEspeciales.push({ fecha: dateStr, comentario });
  }

  saveData();
  document.getElementById('modal-fecha-especial').style.display = 'none';
  renderCalendar();
  renderAlertas();
  showToast('Fecha especial guardada.', 'success');
}

function eliminarFechaEspecial() {
  const dateStr = APP.ui.calSelectedDate;
  APP.data.fechasEspeciales = APP.data.fechasEspeciales.filter(f => f.fecha !== dateStr);
  saveData();
  document.getElementById('modal-fecha-especial').style.display = 'none';
  renderCalendar();
  renderAlertas();
  showToast('Fecha especial eliminada.', 'warning');
}

// ─────────────────────────────────────────────────────────────
// MÓDULO: CONSULTA CON FILTROS DINÁMICOS
// ─────────────────────────────────────────────────────────────

function updateConsultaFiltros() {
  const selPac = document.getElementById('sel-paciente-consulta');
  const currentPac = APP.ui.selPacienteConsulta;
  selPac.innerHTML = '<option value="">— Todos los pacientes —</option>';
  APP.data.pacientes.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.nombre;
    selPac.appendChild(opt);
  });
  selPac.value = currentPac;

  const selMed = document.getElementById('sel-med-consulta');
  const currentMed = APP.ui.selMedConsulta;
  let meds = APP.data.medicamentos;
  if (currentPac) meds = meds.filter(m => m.pacienteId === currentPac);
  selMed.innerHTML = '<option value="">— Todos los medicamentos —</option>';
  meds.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.nombre} ${m.concentracion}${m.unidad}`;
    selMed.appendChild(opt);
  });
  selMed.value = currentMed;

  const selFecha = document.getElementById('sel-fecha-recepcion-consulta');
  const currentFecha = APP.ui.selFechaRecepcionConsulta;
  const fechasUnicas = [...new Set(APP.data.medicamentos.map(m => m.proximaRecepcion).filter(Boolean))].sort();
  selFecha.innerHTML = '<option value="">— Todas las fechas —</option>';
  fechasUnicas.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = `${fmtDate(f)} (${daysDiff(f) === 0 ? 'HOY' : daysDiff(f) + 'd'})`;
    selFecha.appendChild(opt);
  });
  selFecha.value = currentFecha;

  const selPunto = document.getElementById('sel-punto-consulta');
  const currentPunto = APP.ui.selPuntoConsulta;
  selPunto.innerHTML = '<option value="">— Todos los puntos —</option>';
  (APP.data.puntosEntrega || []).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.nombre;
    selPunto.appendChild(opt);
  });
  selPunto.value = currentPunto;
}

function getConsultaRows() {
  const pacId = APP.ui.selPacienteConsulta;
  const medId = APP.ui.selMedConsulta;
  const fechaRec = APP.ui.selFechaRecepcionConsulta;
  const puntoId = APP.ui.selPuntoConsulta;

  let meds = APP.data.medicamentos;
  if (pacId) meds = meds.filter(m => m.pacienteId === pacId);
  if (medId) meds = meds.filter(m => m.id === medId);
  if (fechaRec) meds = meds.filter(m => m.proximaRecepcion === fechaRec);
  if (puntoId) meds = meds.filter(m => m.puntoEntregaId === puntoId);

  return meds.map(med => {
    const pac = APP.data.pacientes.find(p => p.id === med.pacienteId);
    const dosis = APP.data.dosis.find(d => d.medicamentoId === med.id);
    const jornadas = dosis ? (dosis.jornadas || []).map(j => j.jornada).join(', ') : '';
    const stockMin = med.stockMinimo !== undefined ? Number(med.stockMinimo) : 5;
    return {
      paciente: pac ? pac.nombre : '—',
      nombre: med.nombre,
      concentracion: `${med.concentracion} ${med.unidad}`,
      cantidad: med.cantidad,
      stockMinimo: stockMin,
      laboratorio: med.laboratorio || '—',
      puntoEntrega: puntoNombre(med.puntoEntregaId) || '—',
      fechaRecepcion: fmtDate(med.fechaRecepcion),
      proximaRecepcion: fmtDate(med.proximaRecepcion),
      dosisDia: dosis ? getFrecuenciaTexto(dosis) : '—',
      jornadas: jornadas || '—',
      notas: med.notas || '—',
      diasRestantes: daysDiff(med.proximaRecepcion),
      medId: med.id
    };
  });
}

function renderConsulta() {
  const tbody = document.getElementById('consulta-tbody');
  const empty = document.getElementById('empty-consulta');
  const tableWrap = document.getElementById('consulta-tabla-wrap');
  tbody.innerHTML = '';

  const rows = getConsultaRows();

  if (rows.length === 0) {
    tableWrap.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  tableWrap.style.display = 'block';
  empty.style.display = 'none';

  rows.forEach(row => {
    const tr = document.createElement('tr');
    if (row.diasRestantes >= 0 && row.diasRestantes <= 7) tr.classList.add('near-expiry-row');
    if (row.cantidad <= row.stockMinimo) tr.classList.add('low-stock-row');

    tr.innerHTML = `
      <td>${esc(row.paciente)}</td>
      <td><strong>${esc(row.nombre)}</strong></td>
      <td><span class="med-badge">${esc(row.concentracion)}</span></td>
      <td><strong>${row.cantidad}</strong> ${row.cantidad <= row.stockMinimo ? '<small style="color:#ff5252">⚠️</small>' : ''}</td>
      <td>${esc(row.laboratorio)}</td>
      <td>${esc(row.puntoEntrega)}</td>
      <td>${row.fechaRecepcion}</td>
      <td style="${row.diasRestantes >= 0 && row.diasRestantes <= 7 ? 'color:#00e676;font-weight:700;' : ''}">${row.proximaRecepcion}${row.diasRestantes >= 0 && row.diasRestantes <= 7 ? ` <small>(${row.diasRestantes === 0 ? 'HOY' : row.diasRestantes + 'd'})</small>` : ''}</td>
      <td>${esc(row.dosisDia)}</td>
      <td>${esc(row.jornadas)}</td>
      <td style="max-width:150px;font-size:0.8rem;white-space:pre-wrap;">${esc(row.notas)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─────────────────────────────────────────────────────────────
// MÓDULO: DATOS (Exportar / Importar)
// ─────────────────────────────────────────────────────────────

function exportarJSON() {
  const payload = {
    version: '4.1',
    exportDate: new Date().toISOString(),
    appName: 'El Pastillero Ob',
    data: APP.data
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pastillero_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Archivo JSON exportado correctamente.', 'success');
}

function importarJSON(file, mode) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const incoming = parsed.data || parsed;

      if (mode === 'replace') {
        const ok = await confirmModal('Reemplazar Datos', '¿Esto eliminará TODOS los datos actuales y los reemplazará con los del archivo?');
        if (!ok) return;
        APP.data = {
          pacientes: incoming.pacientes || [],
          medicamentos: incoming.medicamentos || [],
          dosis: incoming.dosis || [],
          fechasEspeciales: incoming.fechasEspeciales || [],
          puntosEntrega: incoming.puntosEntrega || [],
          sitios: incoming.sitios || [],
          citas: incoming.citas || [],
          registroTomas: incoming.registroTomas || {},
          lastInventoryDate: incoming.lastInventoryDate || todayStr()
        };
        showToast('Datos reemplazados correctamente.', 'success');
      } else {
        const mergeArr = (existing, newItems) => {
          const existingIds = new Set((existing || []).map(x => x.id));
          const toAdd = (newItems || []).filter(x => !existingIds.has(x.id));
          return [...(existing || []), ...toAdd];
        };
        APP.data.pacientes = mergeArr(APP.data.pacientes, incoming.pacientes);
        APP.data.medicamentos = mergeArr(APP.data.medicamentos, incoming.medicamentos);
        APP.data.dosis = mergeArr(APP.data.dosis, incoming.dosis);
        APP.data.fechasEspeciales = mergeArr(APP.data.fechasEspeciales, incoming.fechasEspeciales);
        APP.data.puntosEntrega = mergeArr(APP.data.puntosEntrega, incoming.puntosEntrega);
        APP.data.sitios = mergeArr(APP.data.sitios, incoming.sitios);
        APP.data.citas = mergeArr(APP.data.citas, incoming.citas);
        APP.data.registroTomas = { ...(APP.data.registroTomas || {}), ...(incoming.registroTomas || {}) };
        showToast(`Datos fusionados correctamente.`, 'success');
      }

      saveData();
      updatePacientesSelects();
      renderPacientes();
      renderAlertas();
    } catch(err) {
      showToast('Error al leer el archivo JSON. Verifica que sea válido.', 'error');
      console.error(err);
    }
  };
  reader.readAsText(file);
}

function exportarExcel(rows) {
  if (typeof XLSX === 'undefined') {
    showToast('La librería Excel no está disponible.', 'error');
    return;
  }
  const data = rows.map(r => ({
    'Paciente': r.paciente,
    'Medicamento': r.nombre,
    'Concentración': r.concentracion,
    'Stock Actual': r.cantidad,
    'Laboratorio': r.laboratorio,
    'Punto de Entrega': r.puntoEntrega,
    'F. Recepción': r.fechaRecepcion,
    'Próx. Recepción': r.proximaRecepcion,
    'Dosis / Frecuencia': r.dosisDia,
    'Jornadas': r.jornadas,
    'Notas': r.notas
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Medicamentos');
  ws['!cols'] = [20,22,14,12,18,18,14,16,22,18,30].map(w => ({ wch: w }));

  XLSX.writeFile(wb, `pastillero_${todayStr()}.xlsx`);
  showToast('Archivo Excel exportado correctamente.', 'success');
}

// ─────────────────────────────────────────────────────────────
// PWA – SERVICE WORKER CON AUTO-ACTUALIZACIÓN
// ─────────────────────────────────────────────────────────────

let deferredInstallPrompt = null;

function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js?v=4.1').then(reg => {
      swRegistration = reg;
      reg.update();
    }).catch((err) => {
      console.warn('Error registrando Service Worker:', err);
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const btn = document.getElementById('btn-instalar-pwa');
    if (btn) btn.style.display = 'inline-flex';
  });

  document.getElementById('btn-instalar-pwa')?.addEventListener('click', () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(() => {
        deferredInstallPrompt = null;
        document.getElementById('btn-instalar-pwa').style.display = 'none';
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// MÓDULO: PUNTOS DE ENTREGA Y CITAS (CON RESULTADOS MÉDICOS)
// ─────────────────────────────────────────────────────────────

const PUNTO_CAMPOS = ['nombre','direccion','telefonos','correo','web','observaciones'];
const CITA_CAMPOS = ['lugar','fecha','hora','servicio','profesional','direccion','telefonos','correo','web','observaciones'];
const CITA_RES_CAMPOS = ['resLab','resWeb','resCorreo','resWhatsapp','resTelefono','resPasos'];

function puntoNombre(id) {
  if (!id) return '';
  const p = (APP.data.puntosEntrega || []).find(x => x.id === id);
  return p ? (p.nombre || 'Punto sin nombre') : '';
}

function updatePuntoEntregaSelect(selected) {
  const sel = document.getElementById('med-punto-entrega');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Sin punto de entrega —</option>';
  (APP.data.puntosEntrega || []).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.nombre || 'Punto sin nombre';
    sel.appendChild(opt);
  });
  sel.value = selected || '';
}

function renderPuntos() {
  const lista = document.getElementById('lista-puntos');
  const empty = document.getElementById('empty-puntos');
  lista.innerHTML = '';
  if (APP.data.puntosEntrega.length === 0) { lista.style.display = 'none'; empty.style.display = 'block'; return; }
  lista.style.display = 'flex'; empty.style.display = 'none';
  APP.data.puntosEntrega.forEach(p => {
    const item = document.createElement('div');
    item.className = 'med-item';
    item.innerHTML = `
      <div class="med-info">
        <div class="med-name">🏥 ${esc(p.nombre || 'Punto sin nombre')}</div>
        <div class="med-details">
          ${detail('📍', p.direccion)}${detail('📞', p.telefonos)}${detail('📧', p.correo)}${detail('🌐', p.web, webLink(p.web))}
        </div>
        ${multilineDetail('Observaciones / Horario', p.observaciones)}
      </div>
      <div class="med-actions">
        <button class="btn btn-secondary btn-icon" data-action="edit-punto" data-id="${p.id}" title="Editar">✏️</button>
        <button class="btn btn-danger btn-icon" data-action="del-punto" data-id="${p.id}" title="Eliminar">🗑️</button>
      </div>`;
    lista.appendChild(item);
  });
}

function openFormPunto(id = null) {
  APP.ui.editPuntoId = id;
  const p = id ? APP.data.puntosEntrega.find(x => x.id === id) : null;
  document.getElementById('form-punto-title').textContent = p ? 'Editar Punto de Entrega' : 'Nuevo Punto de Entrega';
  PUNTO_CAMPOS.forEach(k => { document.getElementById('pun-' + k).value = p ? (p[k] || '') : ''; });
  const card = document.getElementById('form-punto-card');
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeFormPunto() { document.getElementById('form-punto-card').style.display = 'none'; APP.ui.editPuntoId = null; }

function guardarPunto() {
  const datos = {};
  PUNTO_CAMPOS.forEach(k => { datos[k] = document.getElementById('pun-' + k).value.trim(); });
  if (!datos.nombre) { showToast('El nombre del punto de entrega es obligatorio.', 'error'); return; }

  if (APP.ui.editPuntoId) {
    const idx = APP.data.puntosEntrega.findIndex(x => x.id === APP.ui.editPuntoId);
    if (idx > -1) APP.data.puntosEntrega[idx] = { ...APP.data.puntosEntrega[idx], ...datos };
    showToast('Punto de entrega actualizado.', 'success');
  } else {
    APP.data.puntosEntrega.push({ id: genId(), ...datos });
    showToast('Punto de entrega guardado.', 'success');
  }
  saveData();
  closeFormPunto();
  renderPuntos();
  updatePuntoEntregaSelect('');
}

async function eliminarPunto(id) {
  const ok = await confirmModal('Eliminar Punto de Entrega', `¿Eliminar "${puntoNombre(id)}"? Los medicamentos asociados quedarán sin punto de entrega.`);
  if (!ok) return;
  APP.data.puntosEntrega = APP.data.puntosEntrega.filter(x => x.id !== id);
  APP.data.medicamentos.forEach(m => { if (m.puntoEntregaId === id) m.puntoEntregaId = ''; });
  saveData();
  renderPuntos();
  updatePuntoEntregaSelect('');
  showToast('Punto de entrega eliminado.', 'info');
}

function citaResumenHTML(ct) {
  const pac = APP.data.pacientes.find(p => p.id === ct.pacienteId);
  return `<div style="padding:0.4rem 0.6rem;background:rgba(33,150,243,0.12);border-left:3px solid #ff9800f3;border-radius:6px;margin-bottom:0.3rem;font-size:0.83rem;">
    <strong>${ct.hora ? esc(ct.hora) + ' — ' : ''}${esc(ct.servicio || 'Cita médica')}</strong>${pac ? ` — ${esc(pac.nombre)}` : ''}<br>
    ${ct.profesional ? `👨‍⚕️ ${esc(ct.profesional)}<br>` : ''}${ct.lugar ? `🏥 ${esc(ct.lugar)}` : ''}${ct.direccion ? ` · 📍 ${esc(ct.direccion)}` : ''}
  </div>`;
}

function renderCitas() {
  const lista = document.getElementById('lista-citas');
  const empty = document.getElementById('empty-citas');
  lista.innerHTML = '';
  if (APP.data.citas.length === 0) { lista.style.display = 'none'; empty.style.display = 'block'; return; }
  lista.style.display = 'flex'; empty.style.display = 'none';

  const ordenadas = [...APP.data.citas].sort((a, b) => ((a.fecha || '9999') + (a.hora || '')).localeCompare((b.fecha || '9999') + (b.hora || '')));
  ordenadas.forEach(ct => {
    const pac = APP.data.pacientes.find(p => p.id === ct.pacienteId);
    const dias = daysDiff(ct.fecha);
    const urgente = dias >= 0 && dias <= 1;

    const tieneResultados = ct.resLab || ct.resWeb || ct.resCorreo || ct.resWhatsapp || ct.resTelefono || ct.resPasos;

    const item = document.createElement('div');
    item.className = 'med-item' + (urgente ? ' near-expiry' : '');
    item.innerHTML = `
      <div class="med-info">
        <div class="med-name">🩺 ${esc(ct.servicio || 'Cita médica')}
          ${ct.fecha ? `<span class="med-badge">${fmtDate(ct.fecha)}${ct.hora ? ' ' + esc(ct.hora) : ''}</span>` : ''}
          ${urgente ? `<span style="color:#2196f3;font-size:0.8rem;font-weight:700;">${dias === 0 ? '¡HOY!' : '¡MAÑANA!'}</span>` : ''}
        </div>
        <div class="med-details">
          ${detail('🤵', pac ? pac.nombre : '')}${detail('👨‍⚕️', ct.profesional)}${detail('🏥', ct.lugar)}${detail('📍', ct.direccion)}${detail('📞', ct.telefonos)}${detail('📧', ct.correo)}${detail('🌐', ct.web, webLink(ct.web))}
        </div>
        ${multilineDetail('Preparación / Indicaciones de la Cita', ct.observaciones)}

        ${tieneResultados ? `
          <div class="cita-resultados-box">
            <h4>🧪 Consulta de Resultados</h4>
            <div class="med-details" style="margin-top:0.25rem;">
              ${detail('🏢', ct.resLab)}${detail('🌐', ct.resWeb, webLink(ct.resWeb))}${detail('📧', ct.resCorreo)}${detail('📲', ct.resWhatsapp, waLink(ct.resWhatsapp))}${detail('📞', ct.resTelefono)}
            </div>
            ${ct.resPasos ? `<div class="med-details-multiline" style="border-left-color:#2196f3;"><strong>Procedimiento / Pasos para consultar:</strong><br>${esc(ct.resPasos)}</div>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="med-actions">
        <button class="btn btn-whatsapp btn-icon" data-action="wa-cita" data-id="${ct.id}" title="Compartir cita por WhatsApp">${WA_SVG}</button>
        <button class="btn btn-gcal btn-icon" data-action="gcal-cita" data-id="${ct.id}" title="Agregar a Google Calendar">${GCAL_SVG}</button>
        <button class="btn btn-secondary btn-icon" data-action="ics-cita" data-id="${ct.id}" title="Descargar archivo (.ics) para calendario nativo">${ICAL_SVG}</button>
        <button class="btn btn-secondary btn-icon" data-action="edit-cita" data-id="${ct.id}" title="Editar cita">✏️</button>
        <button class="btn btn-danger btn-icon" data-action="del-cita" data-id="${ct.id}" title="Eliminar cita">🗑️</button>
      </div>`;
    lista.appendChild(item);
  });
}

function compartirCitaWhatsApp(citaId) {
  const ct = APP.data.citas.find(x => x.id === citaId);
  if (!ct) return;
  const pac = APP.data.pacientes.find(p => p.id === ct.pacienteId);

  let msg = `*🩺 RECORDATORIO DE CITA MÉDICA*\n`;
  msg += `👤 *Paciente:* ${pac ? pac.nombre : 'Paciente'}\n`;
  msg += `📆 *Fecha:* ${fmtDate(ct.fecha)} ${ct.hora ? 'a las ' + ct.hora : ''}\n`;
  msg += `📋 *Servicio:* ${ct.servicio || 'Consulta Médica'}\n`;
  if (ct.profesional) msg += `👨‍⚕️ *Profesional:* ${ct.profesional}\n`;
  if (ct.lugar) msg += `🏥 *Lugar:* ${ct.lugar}\n`;
  if (ct.direccion) msg += `📍 *Dirección:* ${ct.direccion}\n`;
  if (ct.telefonos) msg += `📞 *Teléfono:* ${ct.telefonos}\n`;
  if (ct.observaciones) msg += `\n📝 *Indicaciones:*\n${ct.observaciones}\n`;

  if (ct.resLab || ct.resWeb || ct.resWhatsapp || ct.resPasos) {
    msg += `\n*🧪 RESULTADOS DE EXÁMENES:*\n`;
    if (ct.resLab) msg += `🏢 *Laboratorio:* ${ct.resLab}\n`;
    if (ct.resWeb) msg += `🌐 *Portal Web:* ${ct.resWeb}\n`;
    if (ct.resWhatsapp) msg += `📲 *WhatsApp:* ${ct.resWhatsapp}\n`;
    if (ct.resTelefono) msg += `📞 *Tel:* ${ct.resTelefono}\n`;
    if (ct.resPasos) msg += `📋 *Pasos:*\n${ct.resPasos}\n`;
  }

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function exportarCitaGoogleCalendar(citaId) {
  const ct = APP.data.citas.find(x => x.id === citaId);
  if (!ct || !ct.fecha) return;
  const pac = APP.data.pacientes.find(p => p.id === ct.pacienteId);

  const cleanDate = ct.fecha.replace(/-/g, '');
  let datesParam = `${cleanDate}/${cleanDate}`;

  if (ct.hora) {
    const [hh, mm] = ct.hora.split(':');
    const startStr = `${cleanDate}T${hh}${mm}00`;
    const endHH = String((parseInt(hh, 10) + 1) % 24).padStart(2, '0');
    const endStr = `${cleanDate}T${endHH}${mm}00`;
    datesParam = `${startStr}/${endStr}`;
  }

  const title = encodeURIComponent(`Cita Médica: ${ct.servicio || 'Consulta'} - ${pac ? pac.nombre : ''}`);
  let det = `Profesional: ${ct.profesional || '—'}\nObservaciones: ${ct.observaciones || '—'}\nTeléfonos: ${ct.telefonos || '—'}`;
  if (ct.resWeb || ct.resPasos) {
    det += `\n\nResultados: ${ct.resLab || ''} ${ct.resWeb || ''}\nPasos: ${ct.resPasos || ''}`;
  }
  const details = encodeURIComponent(det);
  const location = encodeURIComponent(`${ct.lugar || ''} ${ct.direccion || ''}`.trim());

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}`;
  window.open(url, '_blank');
}

function exportarCitaICS(citaId) {
  const ct = APP.data.citas.find(x => x.id === citaId);
  if (!ct || !ct.fecha) return;
  const pac = APP.data.pacientes.find(p => p.id === ct.pacienteId);

  const cleanDate = ct.fecha.replace(/-/g, '');
  let dtstart = `${cleanDate}`;
  let dtend = `${cleanDate}`;

  if (ct.hora) {
    const [hh, mm] = ct.hora.split(':');
    dtstart = `${cleanDate}T${hh}${mm}00`;
    const endHH = String((parseInt(hh, 10) + 1) % 24).padStart(2, '0');
    dtend = `${cleanDate}T${endHH}${mm}00`;
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//El Pastillero Ob//ES',
    'BEGIN:VEVENT',
    `UID:${genId()}@elpastillero`,
    `DTSTAMP:${cleanDate}T000000Z`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:Cita: ${ct.servicio || 'Médica'} - ${pac ? pac.nombre : ''}`,
    `DESCRIPTION:${(ct.observaciones || '') + ' ' + (ct.profesional ? 'Dr: ' + ct.profesional : '')}`,
    `LOCATION:${ct.lugar || ''} ${ct.direccion || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cita_${cleanDate}.ics`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Archivo de cita .ics descargado para tu calendario.', 'success');
}

function openFormCita(id = null) {
  APP.ui.editCitaId = id;
  const ct = id ? APP.data.citas.find(x => x.id === id) : null;
  document.getElementById('form-cita-title').textContent = ct ? 'Editar Cita y Resultados' : 'Nueva Cita Médica';
  document.getElementById('cita-paciente').value = ct ? (ct.pacienteId || '') : '';

  CITA_CAMPOS.forEach(k => { document.getElementById('cita-' + k).value = ct ? (ct[k] || '') : ''; });
  document.getElementById('cita-res-laboratorio').value = ct ? (ct.resLab || '') : '';
  document.getElementById('cita-res-web').value = ct ? (ct.resWeb || '') : '';
  document.getElementById('cita-res-correo').value = ct ? (ct.resCorreo || '') : '';
  document.getElementById('cita-res-whatsapp').value = ct ? (ct.resWhatsapp || '') : '';
  document.getElementById('cita-res-telefono').value = ct ? (ct.resTelefono || '') : '';
  document.getElementById('cita-res-pasos').value = ct ? (ct.resPasos || '') : '';

  const card = document.getElementById('form-cita-card');
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeFormCita() { document.getElementById('form-cita-card').style.display = 'none'; APP.ui.editCitaId = null; }

function guardarCita() {
  const pacId = document.getElementById('cita-paciente').value;
  const fecha = document.getElementById('cita-fecha').value;
  const lugar = document.getElementById('cita-lugar').value.trim();

  if (!pacId) { showToast('Selecciona el paciente para la cita.', 'error'); return; }
  if (!fecha) { showToast('La fecha de la cita es obligatoria.', 'error'); return; }
  if (!lugar) { showToast('El lugar de la cita es obligatorio.', 'error'); return; }

  const datos = {
    pacienteId: pacId,
    resLab: document.getElementById('cita-res-laboratorio').value.trim(),
    resWeb: document.getElementById('cita-res-web').value.trim(),
    resCorreo: document.getElementById('cita-res-correo').value.trim(),
    resWhatsapp: document.getElementById('cita-res-whatsapp').value.trim(),
    resTelefono: document.getElementById('cita-res-telefono').value.trim(),
    resPasos: document.getElementById('cita-res-pasos').value.trim()
  };
  CITA_CAMPOS.forEach(k => { datos[k] = document.getElementById('cita-' + k).value.trim(); });

  if (APP.ui.editCitaId) {
    const idx = APP.data.citas.findIndex(x => x.id === APP.ui.editCitaId);
    if (idx > -1) APP.data.citas[idx] = { ...APP.data.citas[idx], ...datos };
    showToast('Cita médica y resultados actualizados.', 'success');
  } else {
    APP.data.citas.push({ id: genId(), ...datos });
    showToast('Cita médica agendada correctamente.', 'success');
  }
  saveData();
  closeFormCita();
  renderCitas();
  renderAlertas();
  renderPacientes();
}

async function eliminarCita(id) {
  const ok = await confirmModal('Eliminar Cita', '¿Eliminar esta cita médica y sus datos de resultados?');
  if (!ok) return;
  APP.data.citas = APP.data.citas.filter(x => x.id !== id);
  saveData();
  renderCitas();
  renderAlertas();
  renderPacientes();
  showToast('Cita eliminada.', 'info');
}

// ─────────────────────────────────────────────────────────────
// EVENT LISTENERS E INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────

function initEventListeners() {
  document.querySelectorAll('.theme-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.settings.theme = btn.dataset.theme;
      applyThemeAndMode();
      saveSettings();
      showToast(`Tema ${btn.dataset.theme} aplicado.`, 'info', 1500);
    });
  });

  document.getElementById('mode-toggle').addEventListener('click', () => {
    APP.settings.mode = APP.settings.mode === 'dark' ? 'light' : 'dark';
    applyThemeAndMode();
    saveSettings();
  });

  // Toggle de Alarma Sonora de Horarios + Permiso de Notificaciones Nativas
  document.getElementById('btn-sound-alarm').addEventListener('click', async () => {
    APP.settings.soundAlarm = !APP.settings.soundAlarm;
    applyThemeAndMode();
    saveSettings();

    if (APP.settings.soundAlarm) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        try { await Notification.requestPermission(); } catch(e) {}
      }
      playDoseAlarmTone(2);
      showToast('🔔 Alarma sonora y vibración activadas.', 'info', 3000);
    } else {
      showToast('🔕 Alarma sonora desactivada.', 'warning', 2500);
    }
  });

  // Modal para configurar la duración de la alarma
  document.getElementById('btn-config-alarm').addEventListener('click', () => {
    document.getElementById('alarm-duration-input').value = APP.settings.alarmDurationSec || 5;
    document.getElementById('modal-config-alarm').style.display = 'flex';
  });
  document.getElementById('btn-cancelar-config-alarm').addEventListener('click', () => {
    document.getElementById('modal-config-alarm').style.display = 'none';
  });
  document.getElementById('btn-guardar-config-alarm').addEventListener('click', () => {
    const val = parseInt(document.getElementById('alarm-duration-input').value, 10);
    if (isNaN(val) || val < 1 || val > 60) {
      showToast('Por favor digita un número de segundos entre 1 y 60.', 'warning');
      return;
    }
    APP.settings.alarmDurationSec = val;
    saveSettings();
    applyThemeAndMode();
    document.getElementById('modal-config-alarm').style.display = 'none';
    showToast(`⏱️ Duración de alarma establecida en ${val} segundos.`, 'success');
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // PACIENTES
  document.getElementById('btn-nuevo-paciente').addEventListener('click', () => openFormPaciente());
  document.getElementById('btn-cancelar-paciente').addEventListener('click', closeFormPaciente);
  document.getElementById('btn-guardar-paciente').addEventListener('click', guardarPaciente);

  document.getElementById('lista-pacientes').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'edit-pac') { e.stopPropagation(); openFormPaciente(id); }
    if (action === 'del-pac')  { e.stopPropagation(); eliminarPaciente(id); }
    if (action === 'pdf-pac')  { e.stopPropagation(); exportarResumenPDF(id); }
  });

  // MEDICAMENTOS Y REABASTECER
  document.getElementById('sel-paciente-meds').addEventListener('change', (e) => {
    APP.ui.selPacienteMeds = e.target.value;
    renderMedicamentos();
  });
  document.getElementById('btn-nuevo-med').addEventListener('click', () => openFormMed());
  document.getElementById('btn-cancelar-med').addEventListener('click', closeFormMed);
  document.getElementById('btn-guardar-med').addEventListener('click', guardarMed);

  document.getElementById('lista-medicamentos').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'reabastecer-med') openReabastecerModal(id);
    if (action === 'edit-med') openFormMed(id);
    if (action === 'del-med') eliminarMed(id);
  });

  document.getElementById('btn-cancelar-reabastecer').addEventListener('click', () => {
    document.getElementById('modal-reabastecer').style.display = 'none';
  });
  document.getElementById('btn-guardar-reabastecer').addEventListener('click', guardarReabastecimiento);

  // OTROS SITIOS
  document.getElementById('btn-nuevo-sitio').addEventListener('click', () => openFormSitio());
  document.getElementById('btn-cancelar-sitio').addEventListener('click', closeFormSitio);
  document.getElementById('btn-guardar-sitio').addEventListener('click', guardarSitio);
  document.getElementById('lista-sitios').addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]'); if (!b) return;
    if (b.dataset.action === 'edit-sitio') openFormSitio(b.dataset.id);
    if (b.dataset.action === 'del-sitio') eliminarSitio(b.dataset.id);
  });

  // DOSIS Y FRECUENCIA
  document.getElementById('sel-paciente-dosis').addEventListener('change', (e) => {
    APP.ui.selPacienteDosis = e.target.value;
    updateDosisMedSelect();
    renderDosis();
  });

  document.getElementById('dosis-frecuencia').addEventListener('change', (e) => {
    const group = document.getElementById('group-dosis-intervalo');
    group.style.display = e.target.value === 'cada_dias' ? 'block' : 'none';
  });

  document.getElementById('btn-cancelar-dosis').addEventListener('click', closeFormDosis);
  document.getElementById('btn-guardar-dosis').addEventListener('click', guardarDosis);
  document.getElementById('btn-compartir-whatsapp-dosis').addEventListener('click', compartirPlanWhatsApp);

  document.getElementById('dosis-schedule').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'edit-dosis') openFormDosis(id);
    if (action === 'del-dosis') eliminarDosis(id);
  });

  // CALENDARIO
  document.getElementById('cal-prev').addEventListener('click', () => {
    APP.ui.calMonth--;
    if (APP.ui.calMonth < 0) { APP.ui.calMonth = 11; APP.ui.calYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    APP.ui.calMonth++;
    if (APP.ui.calMonth > 11) { APP.ui.calMonth = 0; APP.ui.calYear++; }
    renderCalendar();
  });
  document.getElementById('sel-paciente-cal').addEventListener('change', (e) => {
    APP.ui.selPacienteCal = e.target.value;
    renderCalendar();
  });

  document.getElementById('btn-guardar-fecha').addEventListener('click', guardarFechaEspecial);
  document.getElementById('btn-cancelar-fecha').addEventListener('click', () => {
    document.getElementById('modal-fecha-especial').style.display = 'none';
  });
  document.getElementById('btn-eliminar-fecha').addEventListener('click', eliminarFechaEspecial);

  document.getElementById('modal-fecha-especial').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
  });
  document.getElementById('modal-dia-cal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
  });
  document.getElementById('btn-cerrar-dia-cal').addEventListener('click', () => {
    document.getElementById('modal-dia-cal').style.display = 'none';
  });

  // FILTROS DE CONSULTA
  document.getElementById('sel-paciente-consulta').addEventListener('change', (e) => {
    APP.ui.selPacienteConsulta = e.target.value;
    updateConsultaFiltros();
    renderConsulta();
  });
  document.getElementById('sel-med-consulta').addEventListener('change', (e) => {
    APP.ui.selMedConsulta = e.target.value;
    renderConsulta();
  });
  document.getElementById('sel-fecha-recepcion-consulta').addEventListener('change', (e) => {
    APP.ui.selFechaRecepcionConsulta = e.target.value;
    renderConsulta();
  });
  document.getElementById('sel-punto-consulta').addEventListener('change', (e) => {
    APP.ui.selPuntoConsulta = e.target.value;
    renderConsulta();
  });

  document.getElementById('btn-exportar-excel').addEventListener('click', () => {
    exportarExcel(getConsultaRows());
  });
  document.getElementById('btn-imprimir').addEventListener('click', () => {
    window.print();
  });

  // DATOS
  document.getElementById('btn-exportar-json').addEventListener('click', exportarJSON);
  document.getElementById('btn-exportar-excel-datos').addEventListener('click', () => {
    exportarExcel(getConsultaRows());
  });

  const dropZone = document.getElementById('file-drop-zone');
  const fileInput = document.getElementById('file-json-input');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      const mode = document.querySelector('input[name="import-mode"]:checked')?.value || 'merge';
      importarJSON(file, mode);
    } else {
      showToast('Por favor, selecciona un archivo .json válido.', 'error');
    }
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const mode = document.querySelector('input[name="import-mode"]:checked')?.value || 'merge';
      importarJSON(file, mode);
      fileInput.value = '';
    }
  });

  // PUNTOS Y CITAS
  document.getElementById('btn-nuevo-punto').addEventListener('click', () => openFormPunto());
  document.getElementById('btn-cancelar-punto').addEventListener('click', closeFormPunto);
  document.getElementById('btn-guardar-punto').addEventListener('click', guardarPunto);
  document.getElementById('lista-puntos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]'); if (!b) return;
    if (b.dataset.action === 'edit-punto') openFormPunto(b.dataset.id);
    if (b.dataset.action === 'del-punto') eliminarPunto(b.dataset.id);
  });

  document.getElementById('btn-nueva-cita').addEventListener('click', () => openFormCita());
  document.getElementById('btn-cancelar-cita').addEventListener('click', closeFormCita);
  document.getElementById('btn-guardar-cita').addEventListener('click', guardarCita);
  document.getElementById('lista-citas').addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]'); if (!b) return;
    if (b.dataset.action === 'wa-cita') compartirCitaWhatsApp(b.dataset.id);
    if (b.dataset.action === 'gcal-cita') exportarCitaGoogleCalendar(b.dataset.id);
    if (b.dataset.action === 'ics-cita') exportarCitaICS(b.dataset.id);
    if (b.dataset.action === 'edit-cita') openFormCita(b.dataset.id);
    if (b.dataset.action === 'del-cita') eliminarCita(b.dataset.id);
  });

  // CERRAR MODALES CON ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
    }
  });

  // REACTIVACIÓN Y CAMBIOS DE FECHA EN MÓVILES (ONLINE / OFFLINE)
  const revalidarApp = () => {
    checkDailyInventoryDeduction();
    checkScheduledDoseAlarms();
    renderAlertas();
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') revalidarApp();
  });
  window.addEventListener('focus', revalidarApp);
  window.addEventListener('pageshow', revalidarApp);
}

// ─── ARRANQUE DE LA APLICACIÓN ───────────────────────────────
function init() {
  loadSettings();
  loadData();
  checkDailyInventoryDeduction();
  applyThemeAndMode();
  initEventListeners();
  updatePacientesSelects();
  updatePuntoEntregaSelect('');
  renderPacientes();
  renderAlertas();
  initPWA();

  // Monitorea cambios de hora y alarmas cada 15 segundos
  setInterval(() => {
    checkDailyInventoryDeduction();
    checkScheduledDoseAlarms();
    renderAlertas();
  }, 15 * 1000);

  if (APP.data.pacientes.length === 0) {
    setTimeout(() => {
      showToast('Bienvenido a EL PASTILLERO Ob 💊 ¡Empieza agregando un paciente!', 'info', 5000);
    }, 800);
  }
}

document.addEventListener('DOMContentLoaded', init);
