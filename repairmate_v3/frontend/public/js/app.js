const API = "";
let currentUser = null;
let _searchTimer = null;

// ── Navigation ────────────────────────────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const el = document.getElementById("section-" + name);
  if (el) el.classList.add("active");
  if (name === "demandes")  loadRepairs();
  if (name === "profil")    loadProfil();
  if (name === "admin")     loadAdminStats();
  if (name === "accueil")   { loadStats(); loadRecentRepairs(); }
  if (name === "dashboard") loadDashboard();
}

// ── API helper ────────────────────────────────────────────────────────────────
function api(path, options = {}) {
  return fetch(API + "/api" + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Erreur serveur");
    return data;
  });
}

function alert_(id, msg, type = "error") {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="alert alert-${type}">${escHtml(msg)}</div>`;
}
function clearAlert(id) { const el = document.getElementById(id); if (el) el.innerHTML = ""; }

function escHtml(s) {
  if (!s) return "";
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function categoryLabel(c) {
  return {electronique:"Électronique",velo:"Vélo",textile:"Textile",autre:"Autre"}[c] || c;
}
function statutBadge(s) {
  const l = {ouverte:"Ouverte",en_cours:"En cours",resolue:"Résolue"};
  return `<span class="badge badge-${s}">${l[s]||s}</span>`;
}
function timeAgo(d) {
  const n = Math.floor((Date.now()-new Date(d))/86400000);
  return n===0?"aujourd'hui":n===1?"hier":`il y a ${n} j`;
}
function stars(note, interactive=false, onSelect=null) {
  if (interactive) {
    return Array.from({length:5},(_,i)=>`<span class="star" data-v="${i+1}" onclick="selectStar(${i+1},'${onSelect}')">★</span>`).join("");
  }
  return Array.from({length:5},(_,i)=>`<span class="star-display ${i<note?'on':'off'}">★</span>`).join("");
}
let _selectedStar = 0;
function selectStar(v, containerId) {
  _selectedStar = v;
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll(".star").forEach((s,i) => s.classList.toggle("on", i < v));
}
function debounceLoadRepairs() {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(loadRepairs, 300);
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function checkSession() {
  try { currentUser = await api("/auth/me"); } catch { currentUser = null; }
  updateNav();
}

function updateNav() {
  const in_ = !!currentUser;
  document.getElementById("nav-login").style.display      = in_ ? "none" : "";
  document.getElementById("nav-register").style.display   = in_ ? "none" : "";
  document.getElementById("nav-logout").style.display     = in_ ? "" : "none";
  document.getElementById("nav-profil").style.display     = in_ ? "" : "none";
  document.getElementById("nav-dashboard").style.display  = in_ ? "" : "none";
  document.getElementById("nav-admin").style.display      = (in_ && currentUser.role==="admin") ? "" : "none";
  document.getElementById("btn-new-repair").style.display = in_ ? "" : "none";
  document.getElementById("nav-user-info").textContent    = in_ ? `👤 ${currentUser.pseudo}` : "";
  if (in_) refreshUnread();
}

async function refreshUnread() {
  try {
    const {unread} = await api("/dashboard/unread");
    const badge = document.getElementById("badge-unread");
    badge.style.display = unread > 0 ? "" : "none";
    badge.textContent = unread;
  } catch {}
}

async function login() {
  clearAlert("login-alert");
  const email    = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  if (!email || !password) return alert_("login-alert", "Email et mot de passe requis.");
  try {
    const d = await api("/auth/login", {method:"POST", body:JSON.stringify({email,password})});
    currentUser = d.user;
    updateNav();
    showSection("dashboard");
  } catch(e) { alert_("login-alert", e.message); }
}

async function register() {
  clearAlert("register-alert");
  const pseudo      = document.getElementById("reg-pseudo").value.trim();
  const email       = document.getElementById("reg-email").value.trim();
  const password    = document.getElementById("reg-password").value;
  const ville       = document.getElementById("reg-ville").value.trim();
  const competences = document.getElementById("reg-competences").value.trim();
  if (!pseudo||!email||!password) return alert_("register-alert","Pseudo, email et mot de passe requis.");
  if (password.length<6) return alert_("register-alert","Mot de passe : 6 caractères minimum.");
  try {
    await api("/auth/register",{method:"POST",body:JSON.stringify({pseudo,email,password,ville,competences})});
    alert_("register-alert","Compte créé ! Connecte-toi.","success");
    setTimeout(()=>showSection("login"),1200);
  } catch(e) { alert_("register-alert",e.message); }
}

async function logout() {
  try { await api("/auth/logout",{method:"POST"}); } catch {}
  currentUser = null; updateNav(); showSection("accueil");
}

// ── Stats accueil ─────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const s = await api("/dashboard/stats");
    document.getElementById("accueil-stats").innerHTML = `
      <div class="stat-card"><div class="stat-val">${s.totalRepairs}</div><div class="stat-lbl">Demandes publiées</div></div>
      <div class="stat-card"><div class="stat-val">${s.resolues}</div><div class="stat-lbl">Objets réparés</div></div>
      <div class="stat-card"><div class="stat-val">${s.totalUsers}</div><div class="stat-lbl">Étudiants inscrits</div></div>
      <div class="stat-card"><div class="stat-val">${s.totalMessages}</div><div class="stat-lbl">Messages échangés</div></div>`;
  } catch {}
}

// ── Demandes ──────────────────────────────────────────────────────────────────
async function loadRepairs() {
  const container = document.getElementById("repairs-list");
  container.innerHTML = '<div class="loader">Chargement…</div>';
  const search   = document.getElementById("filter-search")?.value.trim() || "";
  const categorie= document.getElementById("filter-cat")?.value || "";
  const statut   = document.getElementById("filter-statut")?.value || "";
  const qs = new URLSearchParams();
  if (search)    qs.set("search", search);
  if (categorie) qs.set("categorie", categorie);
  if (statut)    qs.set("statut", statut);
  try {
    const data = await api("/repairs?" + qs.toString());
    if (!data.data.length) { container.innerHTML = '<div class="empty">Aucune demande trouvée.</div>'; return; }
    container.innerHTML = `<p class="text-gray" style="margin-bottom:0.5rem">${data.total} demande(s)</p>` +
      data.data.map(r => repairCard(r)).join("");
  } catch(e) { container.innerHTML = `<div class="alert alert-error">${escHtml(e.message)}</div>`; }
}

function repairCard(r) {
  const canTake = currentUser && currentUser.id !== r.demandeur_id && r.statut === "ouverte";
  const canDelete = currentUser && (currentUser.id === r.demandeur_id || currentUser.role === "admin");
  return `<div class="card">
    <h3><a href="#" onclick="openRepair(${r.id})">${escHtml(r.titre)}</a></h3>
    <div class="meta">
      <span class="badge badge-cat">${categoryLabel(r.categorie)}</span>
      ${statutBadge(r.statut)}
      <span class="text-gray">${timeAgo(r.date_creation)}</span>
    </div>
    <div class="actions">
      <button class="btn btn-secondary btn-sm" onclick="openRepair(${r.id})">Voir</button>
      ${canTake   ? `<button class="btn btn-primary btn-sm" onclick="takeRepair(${r.id})">Je peux réparer !</button>` : ""}
      ${canDelete ? `<button class="btn btn-danger btn-sm"  onclick="deleteRepair(${r.id})">Supprimer</button>` : ""}
    </div>
  </div>`;
}

async function loadRecentRepairs() {
  try {
    const data = await api("/repairs?statut=ouverte");
    const recent = data.data.slice(0,3);
    const c = document.getElementById("accueil-recent");
    if (!recent.length) { c.innerHTML=""; return; }
    c.innerHTML = `<h3 style="color:var(--green);margin-bottom:0.8rem">Dernières demandes ouvertes</h3>`
      + recent.map(r=>repairCard(r)).join("");
  } catch {}
}

async function openRepair(id) {
  showSection("detail-repair");
  const container = document.getElementById("repair-detail-content");
  container.innerHTML = '<div class="loader">Chargement…</div>';
  try {
    const [r, notif] = await Promise.all([
      api("/repairs/" + id),
      api("/repairs/" + id + "/notation").catch(()=>null)
    ]);
    const isOwner    = currentUser && currentUser.id === r.demandeur_id;
    const isRepairer = currentUser && currentUser.id === r.reparateur_id;
    const isAdmin    = currentUser?.role === "admin";
    const canTake    = currentUser && currentUser.id !== r.demandeur_id && r.statut === "ouverte";
    const canResolve = (isOwner || isAdmin) && r.statut === "en_cours";
    const canNote    = isOwner && r.statut === "resolue" && !notif;
    const canMessage = currentUser && (isOwner || isRepairer || isAdmin);

    container.innerHTML = `
      <div style="margin-bottom:1rem">
        <button class="btn btn-secondary btn-sm" onclick="showSection('demandes')">← Retour</button>
      </div>
      <div class="card">
        <h2 style="font-size:1.2rem;margin-bottom:0.5rem">${escHtml(r.titre)}</h2>
        <div class="meta" style="margin-bottom:0.8rem">
          <span class="badge badge-cat">${categoryLabel(r.categorie)}</span>
          ${statutBadge(r.statut)}
          <span class="text-gray">${timeAgo(r.date_creation)}</span>
        </div>
        <p style="white-space:pre-wrap;margin-bottom:1rem">${escHtml(r.description)}</p>
        <p class="text-gray">
          Publié par <strong>${escHtml(r.demandeur_pseudo)}</strong>
          ${r.reparateur_id ? ` · Réparateur : <strong>${escHtml(r.reparateur_pseudo||"")}</strong>` : ""}
        </p>
        <div class="actions" style="margin-top:1rem">
          ${canTake    ? `<button class="btn btn-primary"     onclick="takeRepair(${r.id})">Je peux réparer !</button>` : ""}
          ${canResolve ? `<button class="btn btn-info"        onclick="resoudreRepair(${r.id})">✅ Marquer comme résolue</button>` : ""}
          ${canNote    ? `<button class="btn btn-warning"     onclick="showNotation(${r.id})">⭐ Noter le réparateur</button>` : ""}
          ${(isOwner||isAdmin) ? `<button class="btn btn-danger btn-sm" onclick="deleteRepair(${r.id})">Supprimer</button>` : ""}
        </div>
      </div>

      ${notif ? `
      <div class="card">
        <strong>⭐ Notation</strong>
        <div style="margin:0.5rem 0">${stars(notif.note)}</div>
        <p class="text-gray">${escHtml(notif.commentaire||"")} — ${escHtml(notif.auteur_pseudo)}</p>
      </div>` : ""}

      <div id="notation-form-${r.id}"></div>

      ${canMessage ? `
      <div class="card">
        <strong>💬 Messagerie</strong>
        <p class="text-gray" style="margin-bottom:0.8rem;font-size:0.82rem">Échange privé entre le demandeur et le réparateur.</p>
        <div class="messages-box" id="messages-box-${r.id}"><div class="loader">Chargement…</div></div>
        <div class="msg-input-row">
          <input type="text" id="msg-input-${r.id}" placeholder="Écrire un message…" onkeydown="if(event.key==='Enter')sendMessage(${r.id})"/>
          <button class="btn btn-primary btn-sm" onclick="sendMessage(${r.id})">Envoyer</button>
        </div>
      </div>` : ""}`;

    if (canMessage) loadMessages(r.id);
  } catch(e) {
    container.innerHTML = `<div class="alert alert-error">${escHtml(e.message)}</div>`;
  }
}

// ── Actions sur demandes ──────────────────────────────────────────────────────
async function submitRepair() {
  clearAlert("new-repair-alert");
  const titre       = document.getElementById("repair-titre").value.trim();
  const categorie   = document.getElementById("repair-categorie").value;
  const description = document.getElementById("repair-description").value.trim();
  if (!titre||!categorie||!description) return alert_("new-repair-alert","Tous les champs sont obligatoires.");
  try {
    await api("/repairs",{method:"POST",body:JSON.stringify({titre,categorie,description})});
    document.getElementById("repair-titre").value="";
    document.getElementById("repair-categorie").value="";
    document.getElementById("repair-description").value="";
    showSection("demandes");
  } catch(e) { alert_("new-repair-alert",e.message); }
}

async function takeRepair(id) {
  if (!currentUser) return showSection("login");
  if (!confirm("Confirmer la prise en charge de cette demande ?")) return;
  try { await api("/repairs/"+id+"/take",{method:"POST"}); openRepair(id); }
  catch(e) { alert(e.message); }
}

async function resoudreRepair(id) {
  if (!confirm("Confirmer que la réparation est terminée ?")) return;
  try { await api("/repairs/"+id+"/resoudre",{method:"POST"}); openRepair(id); }
  catch(e) { alert(e.message); }
}

async function deleteRepair(id) {
  if (!confirm("Supprimer cette demande ?")) return;
  try { await api("/repairs/"+id,{method:"DELETE"}); showSection("demandes"); }
  catch(e) { alert(e.message); }
}

// ── Notation ──────────────────────────────────────────────────────────────────
function showNotation(repairId) {
  _selectedStar = 0;
  const el = document.getElementById("notation-form-" + repairId);
  el.innerHTML = `
    <div class="card">
      <strong>⭐ Noter le réparateur</strong>
      <div class="stars" id="star-container-${repairId}" style="margin:0.8rem 0;font-size:1.6rem">
        ${Array.from({length:5},(_,i)=>`<span class="star" onclick="selectStar(${i+1},'star-container-${repairId}')">★</span>`).join("")}
      </div>
      <div class="form-group" style="margin-bottom:0.8rem">
        <input type="text" id="notation-comment-${repairId}" placeholder="Commentaire (optionnel)" maxlength="200"/>
      </div>
      <button class="btn btn-warning btn-sm" onclick="submitNotation(${repairId})">Envoyer la note</button>
    </div>`;
}

async function submitNotation(repairId) {
  if (_selectedStar===0) return alert("Sélectionne une note entre 1 et 5 étoiles.");
  const commentaire = document.getElementById("notation-comment-"+repairId)?.value.trim()||"";
  try {
    await api("/repairs/"+repairId+"/noter",{method:"POST",body:JSON.stringify({note:_selectedStar,commentaire})});
    openRepair(repairId);
  } catch(e) { alert(e.message); }
}

// ── Messagerie ────────────────────────────────────────────────────────────────
async function loadMessages(repairId) {
  const box = document.getElementById("messages-box-"+repairId);
  if (!box) return;
  try {
    const {data} = await api("/repairs/"+repairId+"/messages");
    if (!data.length) { box.innerHTML='<div class="empty" style="padding:1rem">Aucun message. Démarrez la conversation !</div>'; return; }
    box.innerHTML = data.map(m => {
      const mine = currentUser && m.auteur_id === currentUser.id;
      return `<div>
        <div class="msg-bubble ${mine?'mine':'other'}">${escHtml(m.contenu)}</div>
        <div class="msg-meta" style="text-align:${mine?'right':'left'}">${escHtml(m.auteur_pseudo)} · ${timeAgo(m.date_envoi)}</div>
      </div>`;
    }).join("");
    box.scrollTop = box.scrollHeight;
    refreshUnread();
  } catch(e) { if(box) box.innerHTML=`<div class="alert alert-error">${escHtml(e.message)}</div>`; }
}

async function sendMessage(repairId) {
  const input = document.getElementById("msg-input-"+repairId);
  const contenu = input?.value.trim();
  if (!contenu) return;
  input.value = "";
  try {
    await api("/repairs/"+repairId+"/messages",{method:"POST",body:JSON.stringify({contenu})});
    loadMessages(repairId);
  } catch(e) { alert(e.message); }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
async function loadDashboard() {
  if (!currentUser) { showSection("login"); return; }
  const c = document.getElementById("dashboard-content");
  c.innerHTML = '<div class="loader">Chargement…</div>';
  try {
    const d = await api("/dashboard");
    const roleLabel = mon_role => mon_role === "demandeur" ? "📋 Demandeur" : "🔧 Réparateur";
    c.innerHTML = `
      <div class="grid-4" style="margin-bottom:1.5rem">
        <div class="stat-card"><div class="stat-val">${d.mesDemandesTotal}</div><div class="stat-lbl">Mes demandes</div></div>
        <div class="stat-card"><div class="stat-val">${d.reparationsEffectuees}</div><div class="stat-lbl">Réparations faites</div></div>
        <div class="stat-card"><div class="stat-val">${d.enCours}</div><div class="stat-lbl">En cours</div></div>
        <div class="stat-card">
          <div class="stat-val">${d.maNote !== null ? d.maNote + " ★" : "—"}</div>
          <div class="stat-lbl">Ma note moyenne ${d.totalNotations ? `(${d.totalNotations} avis)` : ""}</div>
        </div>
      </div>

      ${d.messagesNonLus > 0 ? `
        <div class="alert alert-info" style="margin-bottom:1rem">
          💬 Vous avez <strong>${d.messagesNonLus}</strong> message(s) non lu(s). <a href="#" onclick="showSection('demandes')">Voir les demandes</a>
        </div>` : ""}

      <div class="card">
        <strong>Activité récente</strong>
        <div style="margin-top:0.8rem">
          ${d.activiteRecente.length ? d.activiteRecente.map(r=>`
            <div class="activity-row">
              <div>
                <a href="#" onclick="openRepair(${r.id})">${escHtml(r.titre)}</a>
                <span class="text-gray" style="margin-left:0.4rem">${roleLabel(r.mon_role)}</span>
              </div>
              <div style="display:flex;gap:0.5rem;align-items:center">
                <span class="badge badge-cat">${categoryLabel(r.categorie)}</span>
                ${statutBadge(r.statut)}
              </div>
            </div>`).join("") : '<p class="text-gray">Aucune activité pour l\'instant.</p>'}
        </div>
      </div>

      <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="showSection('new-repair')">+ Nouvelle demande</button>
        <button class="btn btn-secondary" onclick="showSection('demandes')">Parcourir les demandes</button>
        <button class="btn btn-secondary" onclick="showSection('profil')">Modifier mon profil</button>
      </div>`;
  } catch(e) { c.innerHTML=`<div class="alert alert-error">${escHtml(e.message)}</div>`; }
}

// ── Profil ────────────────────────────────────────────────────────────────────
async function loadProfil() {
  if (!currentUser) { showSection("login"); return; }
  const c = document.getElementById("profil-content");
  c.innerHTML = '<div class="loader">Chargement…</div>';
  try {
    const [user, notifs] = await Promise.all([
      api("/users/"+currentUser.id),
      api("/users/"+currentUser.id+"/notations")
    ]);
    c.innerHTML = `
      <div class="grid-2" style="align-items:start">
        <div class="card">
          <strong style="font-size:1rem;display:block;margin-bottom:1rem">Mes informations</strong>
          <div id="profil-alert"></div>
          <div class="form-group"><label>Pseudo</label><input type="text" id="profil-pseudo" value="${escHtml(user.pseudo)}" maxlength="50"/></div>
          <div class="form-group"><label>Email</label><input type="text" value="${escHtml(user.email)}" disabled style="background:#f0f0f0"/></div>
          <div class="form-group"><label>Ville</label><input type="text" id="profil-ville" value="${escHtml(user.ville||'')}" maxlength="80"/></div>
          <div class="form-group"><label>Compétences</label><input type="text" id="profil-competences" value="${escHtml(user.competences||'')}"/></div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="saveProfil(${user.id})">Enregistrer</button>
            <button class="btn btn-danger"  onclick="deleteAccount(${user.id})">Supprimer mon compte</button>
          </div>
        </div>
        <div>
          <div class="card">
            <strong>⭐ Mes avis reçus</strong>
            ${notifs.total > 0 ? `
              <p style="margin:0.5rem 0;font-size:1.3rem;font-weight:bold;color:var(--green)">${notifs.moyenne} / 5 <span style="font-size:0.9rem;color:var(--gray)">(${notifs.total} avis)</span></p>
              <div style="margin-top:0.8rem;display:flex;flex-direction:column;gap:0.6rem">
                ${notifs.avis.map(a=>`
                  <div style="border-top:1px solid #eee;padding-top:0.5rem">
                    <div>${stars(a.note)}</div>
                    ${a.commentaire ? `<p style="font-size:0.85rem;margin:0.3rem 0">${escHtml(a.commentaire)}</p>` : ""}
                    <span class="text-gray">${escHtml(a.auteur_pseudo)} · ${timeAgo(a.date_notation)}</span>
                  </div>`).join("")}
              </div>` : '<p class="text-gray" style="margin-top:0.5rem">Aucun avis reçu pour l\'instant.</p>'}
          </div>
        </div>
      </div>`;
  } catch(e) { c.innerHTML=`<div class="alert alert-error">${escHtml(e.message)}</div>`; }
}

async function saveProfil(id) {
  clearAlert("profil-alert");
  const pseudo      = document.getElementById("profil-pseudo").value.trim();
  const ville       = document.getElementById("profil-ville").value.trim();
  const competences = document.getElementById("profil-competences").value.trim();
  try {
    await api("/users/"+id,{method:"PUT",body:JSON.stringify({pseudo,ville,competences})});
    currentUser.pseudo = pseudo; updateNav();
    alert_("profil-alert","Profil mis à jour !","success");
  } catch(e) { alert_("profil-alert",e.message); }
}

async function deleteAccount(id) {
  if (!confirm("Supprimer définitivement ton compte ?")) return;
  try { await api("/users/"+id,{method:"DELETE"}); await logout(); }
  catch(e) { alert(e.message); }
}

// ── Admin ─────────────────────────────────────────────────────────────────────
let _adminUserTimer = null, _adminRepairTimer = null;
function debounceAdminUsers()   { clearTimeout(_adminUserTimer);   _adminUserTimer   = setTimeout(loadAdminUsers,   300); }
function debounceAdminRepairs() { clearTimeout(_adminRepairTimer); _adminRepairTimer = setTimeout(loadAdminRepairs, 300); }

function adminTab(tab) {
  const tabs = ["stats","users","repairs"];
  document.querySelectorAll(".tab-btn").forEach((b,i) => b.classList.toggle("active", tabs[i]===tab));
  tabs.forEach(t => {
    const el = document.getElementById("admin-"+t+"-tab");
    if (el) el.style.display = t===tab ? "" : "none";
  });
  if (tab==="stats")   loadAdminStats();
  if (tab==="users")   loadAdminUsers();
  if (tab==="repairs") loadAdminRepairs();
}

async function loadAdminStats() {
  const c = document.getElementById("admin-stats-content");
  if (!c) return;
  c.innerHTML = '<div class="loader">Chargement…</div>';
  try {
    const s = await api("/admin/stats");
    c.innerHTML = `
      <div class="grid-4" style="margin-bottom:1.5rem">
        <div class="stat-card"><div class="stat-val">${s.users.total}</div><div class="stat-lbl">Étudiants inscrits</div></div>
        <div class="stat-card"><div class="stat-val">${s.repairs.total}</div><div class="stat-lbl">Demandes publiées</div></div>
        <div class="stat-card"><div class="stat-val">${s.repairs.resolues}</div><div class="stat-lbl">Objets réparés</div></div>
        <div class="stat-card"><div class="stat-val">${s.moyenneNotes ? s.moyenneNotes+" ★" : "—"}</div><div class="stat-lbl">Note moyenne</div></div>
      </div>
      <div class="grid-2" style="margin-bottom:1.5rem">
        <div class="card">
          <strong>📅 Cette semaine</strong>
          <div style="margin-top:0.8rem;display:flex;flex-direction:column;gap:0.4rem">
            <div class="activity-row"><span>Nouveaux inscrits</span><strong>${s.users.new7d}</strong></div>
            <div class="activity-row"><span>Nouvelles demandes</span><strong>${s.repairs.new7d}</strong></div>
            <div class="activity-row"><span>Messages échangés (total)</span><strong>${s.messages}</strong></div>
            <div class="activity-row"><span>Notations (total)</span><strong>${s.notations}</strong></div>
          </div>
        </div>
        <div class="card">
          <strong>🔧 État des demandes</strong>
          <div style="margin-top:0.8rem;display:flex;flex-direction:column;gap:0.4rem">
            <div class="activity-row"><span>Ouvertes</span><span class="badge badge-ouverte">${s.repairs.ouvertes}</span></div>
            <div class="activity-row"><span>En cours</span><span class="badge badge-en_cours">${s.repairs.en_cours}</span></div>
            <div class="activity-row"><span>Résolues</span><span class="badge badge-resolue">${s.repairs.resolues}</span></div>
            <div class="activity-row"><span>Admins actifs</span><strong>${s.users.admins}</strong></div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <button class="btn btn-secondary" onclick="adminTab('users')">👥 Gérer les utilisateurs</button>
        <button class="btn btn-secondary" onclick="adminTab('repairs')">🔧 Gérer les demandes</button>
      </div>`;
  } catch(e) { c.innerHTML=`<div class="alert alert-error">${escHtml(e.message)}</div>`; }
}

async function loadAdminUsers() {
  const c = document.getElementById("admin-users-list");
  c.innerHTML = '<div class="loader">Chargement…</div>';
  const search = document.getElementById("admin-search-users")?.value.trim()||"";
  const role   = document.getElementById("admin-filter-role")?.value||"";
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (role)   qs.set("role", role);
  try {
    const {data, total} = await api("/admin/users?"+qs.toString());
    if (!data.length) { c.innerHTML='<div class="empty">Aucun utilisateur trouvé.</div>'; return; }
    c.innerHTML = `<p class="text-gray" style="margin-bottom:0.8rem">${total} utilisateur(s)</p>` +
      data.map(u => `
        <div class="card" style="padding:0.9rem 1.1rem">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem">
            <div>
              <strong>${escHtml(u.pseudo)}</strong>
              <span class="badge ${u.role==="admin"?"badge-en_cours":"badge-ouverte"}" style="margin-left:0.4rem">${u.role}</span>
              <br>
              <span class="text-gray">${escHtml(u.email)}</span>
              ${u.ville ? `<span class="text-gray"> · ${escHtml(u.ville)}</span>` : ""}
              ${u.competences ? `<br><span class="text-gray" style="font-size:0.8rem">🛠 ${escHtml(u.competences)}</span>` : ""}
              <br>
              <span class="text-gray" style="font-size:0.78rem">
                ${u.nbRepairs} demande(s)
                ${u.noteMoyenne ? ` · ⭐ ${u.noteMoyenne} (${u.nbAvis} avis)` : ""}
                · Inscrit ${timeAgo(u.date_inscription)}
              </span>
            </div>
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;align-items:center">
              ${u.id !== currentUser.id ? `
                ${u.role==="etudiant"
                  ? `<button class="btn btn-warning btn-sm" onclick="adminChangeRole(${u.id},'admin')">⬆ Promouvoir admin</button>`
                  : `<button class="btn btn-secondary btn-sm" onclick="adminChangeRole(${u.id},'etudiant')">⬇ Rétrograder</button>`}
                <button class="btn btn-danger btn-sm" onclick="adminDeleteUserFull(${u.id},'${escHtml(u.pseudo)}')">🗑 Supprimer</button>
              ` : '<span class="text-gray">(vous)</span>'}
            </div>
          </div>
        </div>`).join("");
  } catch(e) { c.innerHTML=`<div class="alert alert-error">${escHtml(e.message)}</div>`; }
}

async function adminChangeRole(id, role) {
  const action = role==="admin" ? "promouvoir cet utilisateur en administrateur" : "rétrograder cet administrateur en étudiant";
  if (!confirm(`Confirmer : ${action} ?`)) return;
  try {
    const {message} = await api("/admin/users/"+id+"/role",{method:"PUT",body:JSON.stringify({role})});
    alert(message);
    loadAdminUsers();
  } catch(e) { alert(e.message); }
}

async function adminDeleteUserFull(id, pseudo) {
  if (!confirm(`Supprimer définitivement le compte de "${pseudo}" et toutes ses données ?`)) return;
  try {
    await api("/admin/users/"+id,{method:"DELETE"});
    loadAdminUsers();
  } catch(e) { alert(e.message); }
}

async function loadAdminRepairs() {
  const c = document.getElementById("admin-repairs-list");
  c.innerHTML = '<div class="loader">Chargement…</div>';
  const search    = document.getElementById("admin-search-repairs")?.value.trim()||"";
  const statut    = document.getElementById("admin-filter-statut")?.value||"";
  const categorie = document.getElementById("admin-filter-cat")?.value||"";
  const qs = new URLSearchParams();
  if (search)    qs.set("search", search);
  if (statut)    qs.set("statut", statut);
  if (categorie) qs.set("categorie", categorie);
  try {
    const {data, total} = await api("/admin/repairs?"+qs.toString());
    if (!data.length) { c.innerHTML='<div class="empty">Aucune demande trouvée.</div>'; return; }
    c.innerHTML = `<p class="text-gray" style="margin-bottom:0.8rem">${total} demande(s)</p>` +
      data.map(r => `
        <div class="card" style="padding:0.9rem 1.1rem">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem">
            <div>
              <strong><a href="#" onclick="openRepair(${r.id})">${escHtml(r.titre)}</a></strong>
              <div class="meta" style="margin-top:0.3rem">
                <span class="badge badge-cat">${categoryLabel(r.categorie)}</span>
                ${statutBadge(r.statut)}
                <span class="text-gray">${timeAgo(r.date_creation)}</span>
              </div>
              <span class="text-gray" style="font-size:0.8rem">
                Par <strong>${escHtml(r.demandeur_pseudo)}</strong>
                ${r.reparateur_pseudo ? ` · Réparateur : <strong>${escHtml(r.reparateur_pseudo)}</strong>` : ""}
                · 💬 ${r.nb_messages} msg
              </span>
            </div>
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;align-items:center">
              <select class="btn btn-secondary btn-sm" onchange="adminChangeStatut(${r.id},this.value)" style="padding:0.28rem 0.5rem">
                <option value="">Changer statut…</option>
                ${["ouverte","en_cours","resolue"].filter(s=>s!==r.statut).map(s=>`<option value="${s}">${{ouverte:"Ouverte",en_cours:"En cours",resolue:"Résolue"}[s]}</option>`).join("")}
              </select>
              <button class="btn btn-danger btn-sm" onclick="adminDeleteRepair(${r.id})">🗑 Supprimer</button>
            </div>
          </div>
        </div>`).join("");
  } catch(e) { c.innerHTML=`<div class="alert alert-error">${escHtml(e.message)}</div>`; }
}

async function adminChangeStatut(id, statut) {
  if (!statut) return;
  try {
    const {message} = await api("/admin/repairs/"+id+"/statut",{method:"PUT",body:JSON.stringify({statut})});
    loadAdminRepairs();
  } catch(e) { alert(e.message); }
}

async function adminDeleteRepair(id) {
  if (!confirm("Supprimer définitivement cette demande et tous ses messages ?")) return;
  try { await api("/admin/repairs/"+id,{method:"DELETE"}); loadAdminRepairs(); }
  catch(e) { alert(e.message); }
}

// ── Init ──────────────────────────────────────────────────────────────────────
checkSession().then(() => {
  loadStats();
  loadRecentRepairs();
  if (currentUser) setInterval(refreshUnread, 30000);
});
