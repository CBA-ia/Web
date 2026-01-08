const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function enc(s){ return encodeURIComponent(s); }

async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch(_){
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try{
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    }catch(e){
      document.body.removeChild(ta);
      return false;
    }
  }
}

/* Scroll progress bar */
const scrollbarBar = $("#scrollbarBar");
window.addEventListener("scroll", () => {
  const h = document.documentElement;
  const scrollTop = h.scrollTop || document.body.scrollTop;
  const scrollHeight = h.scrollHeight - h.clientHeight;
  const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  if(scrollbarBar) scrollbarBar.style.width = `${pct}%`;
}, { passive: true });

/* Mobile nav */
const burger = $("#burger");
const mobileNav = $("#mobileNav");
if(burger && mobileNav){
  burger.addEventListener("click", () => {
    const open = mobileNav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    mobileNav.setAttribute("aria-hidden", String(!open));
  });
  $$("#mobileNav a").forEach(a => {
    a.addEventListener("click", () => {
      mobileNav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      mobileNav.setAttribute("aria-hidden", "true");
    });
  });
}

/* Reveal */
const revealEls = $$(".reveal");
const io = new IntersectionObserver((entries) => {
  for(const e of entries){
    if(e.isIntersecting){
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    }
  }
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

/* Tilt (MUY suave, y desactivado en mobile) */
const isCoarse = window.matchMedia("(pointer: coarse)").matches;
const isSmall = window.matchMedia("(max-width: 760px)").matches;

const tiltEls = $$("[data-tilt]");
function attachTilt(el){
  let rect = null;

  // si el elemento pide "soft", lo hacemos aún más leve
  const soft = el.getAttribute("data-tilt") === "soft";
  const max = soft ? 3 : 5;
  const scale = soft ? 1.005 : 1.01;

  function onMove(ev){
    if(!rect) rect = el.getBoundingClientRect();
    const x = (ev.clientX - rect.left) / rect.width;
    const y = (ev.clientY - rect.top) / rect.height;
    const rx = (0.5 - y) * max;
    const ry = (x - 0.5) * max;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
  }
  function onEnter(){
    rect = el.getBoundingClientRect();
    el.style.transition = "transform 120ms ease";
    setTimeout(() => el.style.transition = "", 140);
  }
  function onLeave(){
    el.style.transition = "transform 160ms ease";
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    setTimeout(() => el.style.transition = "", 220);
  }

  el.addEventListener("mouseenter", onEnter);
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
}

if(!isCoarse && !isSmall){
  tiltEls.forEach(attachTilt);
}else{
  // En mobile: forzamos que no haya transform raro
  tiltEls.forEach(el => el.style.transform = "none");
}

/* Consulta rápida (demo) */
const bizChips = $("#bizChips");
const qSingle = $("#qSingle");
const regenBtn = $("#regenBtn");
const copyBtn = $("#copyBtn");
const copyNote = $("#copyNote");
const qSubtitle = $("#qSubtitle");

let currentBiz = "gimnasio";
const BANK = {
  "gimnasio": [
    "¿Qué consultas llegan con mayor frecuencia y cuáles convendría responder automáticamente?",
    "¿Cómo se gestionan turnos/clases y en qué parte aparecen demoras o confusiones?",
    "¿Qué datos convendría solicitar antes de responder para ordenar la atención?",
    "¿Qué ocurre cuando una persona consulta y luego no responde? ¿Hay seguimiento?",
    "Si se automatizara una sola tarea este mes, ¿cuál generaría mayor alivio operativo?"
  ],
  "resto": [
    "¿Qué consultas se repiten más (reservas, menú, horarios) y cuáles convendría responder automáticamente?",
    "¿Cómo se toman reservas hoy y qué inconvenientes aparecen (cambios, ausencias)?",
    "¿Qué información convendría solicitar antes de confirmar una reserva?",
    "¿Qué pasa cuando alguien consulta y no vuelve a responder?",
    "Si se automatizara una sola parte este mes, ¿cuál generaría mayor impacto?"
  ],
  "peluqueria": [
    "¿Qué consultas se repiten más (turnos, precios, horarios) y cuáles convendría responder automáticamente?",
    "¿Cómo se confirman turnos hoy y dónde aparecen cambios o cancelaciones?",
    "¿Qué datos convendría solicitar antes de confirmar un turno?",
    "¿Qué pasa cuando alguien consulta y no reserva?",
    "Si se automatizara una sola tarea este mes, ¿cuál generaría mayor alivio operativo?"
  ],
  "ecommerce": [
    "¿Qué consultas se repiten más (stock, envíos, pagos) y cuáles convendría responder automáticamente?",
    "¿En qué parte se frena más la compra: consulta previa o seguimiento?",
    "¿Qué datos convendría capturar al inicio para ordenar la atención?",
    "¿Qué pasa cuando alguien consulta y no vuelve a responder?",
    "Si se automatizara una sola parte este mes, ¿cuál generaría mayor impacto?"
  ],
  "otro": [
    "¿Qué tarea se repite todos los días y genera pérdida de tiempo?",
    "¿Qué preguntas aparecen con mayor frecuencia en la atención al cliente?",
    "¿Dónde se pierden oportunidades por demora en la respuesta?",
    "¿Qué tarea administrativa convendría dejar de hacer manualmente?",
    "¿Qué proceso genera más errores o confusión?"
  ]
};

function bizLabel(key){
  const map = {
    "gimnasio":"Gimnasio",
    "resto":"Restaurante",
    "peluqueria":"Peluquería",
    "ecommerce":"E-commerce",
    "otro":"Otro"
  };
  return map[key] || "Negocio";
}
function shuffled(list){
  const arr = [...list];
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
let rotation = { list: [], idx: 0 };

function initRotation(){
  const base = BANK[currentBiz] || BANK["otro"];
  rotation.list = shuffled(base);
  rotation.idx = 0;
  renderOneQuestion();
}
function renderOneQuestion(){
  if(!qSingle || !qSubtitle) return;
  const total = rotation.list.length || 5;
  const i = rotation.idx % total;
  qSubtitle.innerHTML = `Para <b>${bizLabel(currentBiz)}</b>`;
  qSingle.textContent = rotation.list[i];
}
function nextQuestion(){
  const total = rotation.list.length || 5;
  rotation.idx += 1;
  if(rotation.idx >= total){
    initRotation();
    return;
  }
  renderOneQuestion();
}
function getCurrentQuestionText(){
  const q = qSingle ? qSingle.textContent : "";
  return `Pregunta disparadora — ${bizLabel(currentBiz)}\n\n${q}\n`;
}

if(bizChips){
  bizChips.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if(!btn) return;
    currentBiz = btn.dataset.biz || "otro";
    $$(".chip", bizChips).forEach(c => c.classList.remove("is-active"));
    btn.classList.add("is-active");
    initRotation();
    if(copyNote) copyNote.textContent = "";
  });
}
if(regenBtn){
  regenBtn.addEventListener("click", () => {
    nextQuestion();
    if(copyNote){
      copyNote.textContent = "Pregunta actualizada.";
      setTimeout(() => copyNote.textContent = "", 1400);
    }
  });
}
if(copyBtn){
  copyBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(getCurrentQuestionText());
    if(copyNote){
      copyNote.textContent = ok ? "Copiado ✅" : "No se pudo copiar automáticamente.";
      setTimeout(() => copyNote.textContent = "", 1600);
    }
  });
}
initRotation();

/* Formulario → WhatsApp / Mail / Copiar */
const contactForm = $("#contactForm");
const msgNote = $("#msgNote");
const sendWABtn = $("#sendWABtn");
const sendMailBtn = $("#sendMailBtn");
const copyMsgBtn = $("#copyMsgBtn");
const hiddenMsg = $("#hiddenMsg");

const WA_NUMBER = "5495313221056";
const TO_EMAIL = "cba.ia.oficial@gmail.com";

function note(text, ms=2200){
  if(!msgNote) return;
  msgNote.textContent = text;
  if(ms){
    setTimeout(() => { if(msgNote.textContent === text) msgNote.textContent = ""; }, ms);
  }
}
function getRadioValue(name){
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}
function getObjectives(){
  const a = contactForm?.querySelector('input[name="obj_aumentar"]')?.checked;
  const m = contactForm?.querySelector('input[name="obj_mejorar"]')?.checked;
  const parts = [];
  if(a) parts.push("Aumentar la cantidad de consultas");
  if(m) parts.push("Mejorar la efectividad de las consultas (convertir mejor)");
  return parts;
}
function validateForm(){
  if(!contactForm) return false;

  const nombre = contactForm.nombre?.value?.trim();
  const rubro = contactForm.rubro?.value?.trim();
  const volumen = getRadioValue("volumen");
  const objetivoTxt = contactForm.objetivo?.value?.trim();
  const objetivos = getObjectives();

  if(!nombre || !rubro || !volumen || !objetivoTxt){
    note("Por favor, completá nombre, rubro, cantidad de consultas y qué querés automatizar.");
    return false;
  }
  if(objetivos.length === 0){
    note("Por favor, seleccioná el objetivo: aumentar consultas, mejorar efectividad o ambas.");
    return false;
  }
  return true;
}
function buildMessage(){
  const nombre = contactForm.nombre.value.trim();
  const rubro = contactForm.rubro.value.trim();
  const volumen = getRadioValue("volumen");
  const objetivoTxt = contactForm.objetivo.value.trim();
  const objetivos = getObjectives();
  const objetivosLine = objetivos.join(" + ");

  const msg = [
    `Hola, ¿cómo estás? Soy ${nombre}.`,
    `Rubro: ${rubro}.`,
    `Consultas: ${volumen}.`,
    `Objetivo: ${objetivosLine}.`,
    ``,
    `Qué se busca automatizar primero:`,
    `${objetivoTxt}`,
    ``,
    `¿Podemos coordinar una llamada breve para definir alcance y esquema de mantenimiento?`,
    `Gracias.`
  ].join("\n");

  if(hiddenMsg) hiddenMsg.value = msg;
  return msg;
}

if(sendWABtn){
  sendWABtn.addEventListener("click", () => {
    if(!validateForm()) return;
    const msg = buildMessage();
    const url = `https://wa.me/${WA_NUMBER}?text=${enc(msg)}`;
    window.open(url, "_blank");
    note("Se abrió WhatsApp con el mensaje listo.");
  });
}

if(sendMailBtn){
  sendMailBtn.addEventListener("click", () => {
    if(!validateForm()) return;
    const msg = buildMessage();
    const subject = "Consulta desde la web — CBA.ia";
    const mailto = `mailto:${TO_EMAIL}?subject=${enc(subject)}&body=${enc(msg)}`;

    // Esto puede abrir una "pantalla en blanco" si no hay handler de mail configurado.
    window.location.href = mailto;

    note("Si el mail no se abre, revisar la app/configuración de correo del dispositivo.");
  });
}

if(copyMsgBtn){
  copyMsgBtn.addEventListener("click", async () => {
    if(!validateForm()) return;
    const msg = buildMessage();
    const ok = await copyToClipboard(msg);
    note(ok ? "Mensaje copiado ✅" : "No se pudo copiar automáticamente.");
  });
}

/* Footer year */
const yearEl = $("#year");
if(yearEl) yearEl.textContent = new Date().getFullYear();
