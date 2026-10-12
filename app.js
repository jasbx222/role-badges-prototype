(function () {
"use strict";
const KEY = "asits-role-badges-v1", $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const AR = (s) => String(s).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
// roles of one multi-role user (same shape as Role/GetRolesForUser: prefix + name, committee role needs a committee pick)
const ROLES = [
  { p: "HEADDEPART", n: "رئيس قسم تقنية المعلومات", unit: "قسم تقنية المعلومات" },
  { p: "HEADDIVISI", n: "مسؤول شعبة الشبكات", unit: "شعبة الشبكات" },
  { p: "CommitteesRole", n: "عضو لجنة", committee: true, committees: ["لجنة المشتريات", "لجنة الجرد السنوي"] },
];
const roleName = (k) => { const [p, c] = k.split("|"); const r = ROLES.find((x) => x.p === p); return r.committee ? r.n + " " + (c || "").replace(/^لجنة /, "لجنة ") .replace(/^/, "") : r.n; };
const roleLabel = (k) => { const [p, c] = k.split("|"); const r = ROLES.find((x) => x.p === p); return r.committee ? "عضو " + c : r.n; };
const ROLE_KEYS = ["HEADDEPART", "HEADDIVISI", "CommitteesRole|لجنة المشتريات", "CommitteesRole|لجنة الجرد السنوي"];
const PR = { VIM: "عاجل جداً", IMP: "مهم", NOR: "اعتيادي", LOW: "منخفض" };
const TYPE = { INC: ["وارد", "incomming_chip"], OUT: ["صادر", "outgoing_chip"], INT: ["مذكرة داخلية", "internal_chip"] };
const POOL = [
  ["وزارة الاتصالات", "تحديث صلاحيات المستخدمين", "INT", "IMP", "للتنفيذ"], ["شركة الرافدين", "عرض صيانة الشبكة", "INC", "NOR", "لدراسة العرض"],
  ["قسم المخازن", "طلب شراء أجهزة حاسوب", "INT", "IMP", "للمراجعة والتوقيع"], ["مكتب المدير العام", "تعميم بشأن الدوام الرسمي", "INC", "VIM", "للاطلاع والتعميم"],
  ["هيئة النزاهة", "استفسار حول عقد التوريد", "INC", "IMP", "للإجابة"], ["شعبة الأنظمة", "عطل في منظومة البريد", "INT", "VIM", "عاجل"],
  ["قسم الحسابات", "محضر لجنة الجرد للربع الثالث", "INT", "NOR", "للتوقيع"], ["وزارة التخطيط", "استمارة المؤشرات الإحصائية", "INC", "LOW", "للإكمال"],
];
function ymd(t) { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function hm(t) { const d = new Date(t); return ymd(t) + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
function seed() {
  let n = 1500; const now = Date.now(), books = [], notifs = [];
  const add = (role, i, ago, read, complete) => {
    const p = POOL[i % POOL.length], id = ++n, at = now - ago * 36e5;
    books.push({ id, no: AR("2026/" + id), role, from: p[0], subject: p[1], type: p[2], pr: p[3], margin: p[4], at, read, complete });
    notifs.push({ id: "n" + id, bookId: id, role, at, read: read || complete });
  };
  add("HEADDEPART", 0, 30, true, false); add("HEADDEPART", 1, 20, false, false); add("HEADDEPART", 3, 4, false, false); add("HEADDEPART", 4, 50, true, true);
  add("HEADDIVISI", 5, 3, false, false); add("HEADDIVISI", 1, 26, true, false); add("HEADDIVISI", 7, 2, false, false);
  add("CommitteesRole|لجنة المشتريات", 2, 6, false, false); add("CommitteesRole|لجنة المشتريات", 6, 40, true, false);
  add("CommitteesRole|لجنة الجرد السنوي", 6, 1, false, false);
  notifs.sort((a, b) => b.at - a.at);
  return { role: "HEADDEPART", books, notifs, seq: n, pool: 8 };
}
let S; try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) {} if (!S || !S.books) S = seed();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const counts = (k) => { const bs = S.books.filter((b) => b.role === k && !b.complete); return { unread: bs.filter((b) => !b.read).length, open: bs.length }; };
const others = () => ROLE_KEYS.filter((k) => k !== S.role);
function alertMsg(cls, html, btn) {
  const el = document.createElement("div"); el.className = "alert " + cls; el.innerHTML = `<span>${html}</span>`;
  if (btn) { const b = document.createElement("button"); b.textContent = btn.t; b.onclick = () => { el.remove(); btn.f(); }; el.appendChild(b); }
  $("#Alerts").appendChild(el); setTimeout(() => el.remove(), 7000); while ($("#Alerts").children.length > 3) $("#Alerts").firstChild.remove();
}
let bumpKey = null;
function renderHeader() {
  $("#ActiveRoleLabel").textContent = roleLabel(S.role);
  const oth = others().map(counts), totOpen = oth.reduce((s, c) => s + c.open, 0), totUnread = oth.reduce((s, c) => s + c.unread, 0);
  const cb = $("#RoleChipBadge"); cb.hidden = !totOpen; cb.textContent = totOpen; cb.title = `${totOpen} كتاب بانتظارك بأدوار أخرى (${totUnread} غير مقروء)`;
  // list: committee role grouped like the real dropdown (has-select + hint), counts per role
  let html = "";
  ROLES.forEach((r) => {
    const keys = r.committee ? ROLE_KEYS.filter((k) => k.startsWith(r.p)) : [r.p];
    const c = keys.map(counts).reduce((a, b) => ({ unread: a.unread + b.unread, open: a.open + b.open }), { unread: 0, open: 0 });
    const active = S.role.split("|")[0] === r.p;
    const cur = active ? `<span class="rb-current">الدور الحالي</span>` : "";
    const sub = r.committee ? `<small>${keys.map((k) => { const cc = counts(k); return `${k.split("|")[1]}: ${cc.unread} غير مقروء / ${cc.open} غير مكتمل`; }).join(" · ")}</small>` : `<small>${r.unit}</small>`;
    const bump = bumpKey && keys.includes(bumpKey) ? " bump" : "";
    html += `<li role="option" class="rb-role ${active ? "active" : ""} ${r.committee ? "has-select" : ""}" data-prefix="${r.p}">
      <span class="rb-role-name"><span>${r.n}${cur}</span>${sub}</span>
      <span class="rb-counts"><span class="rb-cnt unread ${c.unread ? "" : "zero"}${bump}" title="غير مقروء">${c.unread}</span><span class="rb-cnt open ${c.open ? "" : "zero"}${bump}" title="غير مكتمل">${c.open}</span></span></li>`;
  });
  $("#RoleSwitcherList").innerHTML = html;
  const unread = S.notifs.filter((n) => !n.read).length, bb = $("#NotificationBellBadge"); bb.hidden = !unread; bb.textContent = unread;
}
function renderInbox() {
  const q = $("#Search").value.trim();
  const list = S.books.filter((b) => b.role === S.role && !b.complete && (!q || (b.no + b.subject + b.from).includes(q))).sort((a, b) => b.at - a.at);
  $("#OrgTabs").innerHTML = [["الكل", list.length], ["المدير العام", 0], ["الشعب", 0], ["الوحدات", 0], ["الأقسام", list.length], ["الهيئات", 0], ["اللجان", S.role.startsWith("Comm") ? list.length : 0]]
    .map(([l, c], i) => `<button type="button" class="org-category-tab ${i ? "" : "active"}"><span class="org-category-tab-label">${l}</span><span class="org-category-tab-count">${c}</span></button>`).join("");
  const oth = others().filter((k) => counts(k).open);
  $("#RoleStrip").hidden = !oth.length;
  $("#RoleStrip").innerHTML = `<span class="rb-new">جديد</span><span>بانتظارك أيضاً بأدوار أخرى:</span>` + oth.map((k) => { const c = counts(k); return `<button data-switch="${k}">${roleLabel(k)} — <b>${c.unread}</b> غير مقروء / ${c.open}</button>`; }).join("");
  $("#InboxBody").innerHTML = list.map((b) => `<tr data-book="${b.id}" class="${b.read ? "" : "rb-unread"}">
   <td>${b.no}</td><td>${ymd(b.at)}</td><td></td><td><div class="chip ${TYPE[b.type][1]}">${TYPE[b.type][0]}</div></td>
   <td><span class="correspondence-priority-indicator correspondence-priority-${b.pr}"><span class="correspondence-priority-dot"></span>${PR[b.pr]}</span></td>
   <td>${esc(b.from)}</td><td>${esc(b.subject)}</td><td>${esc(b.margin)}</td><td><div class="chip chips_icon">قيد الإجراء</div></td>
   <td><div class="chip chips_icon document_chips display_Documents ${b.read ? "" : "document_chip_with_badge"}" data-view="${b.id}">${b.read ? "" : '<span class="document_chip_badge"></span>'}<img src="img/document_icon.svg" alt="" /><p>عرض</p></div></td>
   <td><div class="dropdown"><img src="img/more_action_icon.svg" data-bs-toggle="dropdown" style="cursor:pointer" alt="الإجراءات" />
    <ul class="dropdown-menu" style="min-width:210px"><li class="dropdown_item" data-view="${b.id}"><div><p>عرض الكتاب</p><img width="34" src="img/display_eye_icon.svg" alt="" /></div></li>
    <li class="dropdown_item" data-act="${b.id}"><div><p>اتخاذ إجراء</p><img width="34" src="img/left_arrow_icon.svg" alt="" /></div></li>
    <li class="dropdown_item"><div class="checkbox_add_customer_box dropdown_item_button"><button data-viewed="${b.id}" class="button_style_3 font_size_2m_button border_radius_actions_1 w-100">تأكيد الاطلاع</button></div></li></ul></div></td></tr>`).join("");
  $("#Empty").hidden = list.length > 0;
}
function renderNotifs() {
  const unread = S.notifs.filter((n) => !n.read).length;
  $("#NotifHeader").innerHTML = `<header class="notification-panel__header"><div class="notification-panel__header-content"><div class="notification-panel__header-text"><h2 class="notification-panel__title">الإشعارات</h2><p class="notification-panel__subtitle">لكل أدوارك — مع اسم الدور <span class="rb-new">جديد</span></p></div><span class="notification-panel__count-badge">${unread}</span></div><button type="button" class="notification-panel__close-btn" data-close-notif><img src="img/close_icon.svg" alt="" /></button></header>`;
  $("#NotifList").innerHTML = `<div class="notification-list">` + S.notifs.map((n) => {
    const b = S.books.find((x) => x.id === n.bookId); if (!b) return "";
    const other = n.role !== S.role;
    return `<article class="notification-card ${n.read ? "notification-card--read" : "notification-card--unread"}" data-nid="${n.id}" tabindex="0">
     <div class="notification-card__thumbnail"><img src="img/document_icon.svg" alt="" /></div>
     <div class="notification-card__content"><div class="notification-card__meta">${n.read ? "" : '<span class="notification-card__unread-badge">غير مقروء</span>'}<span class="notification-card__type">${TYPE[b.type][0]}</span></div>
      <h3 class="notification-card__title">${esc(b.subject)}</h3>
      <div class="notification-card__details"><span class="notification-card__detail"><span class="notification-card__detail-label">رقم الكتاب</span><span class="notification-card__detail-value">${b.no}</span></span><span class="notification-card__detail"><span class="notification-card__detail-label">تاريخ الوصول</span><span class="notification-card__detail-value">${hm(n.at)}</span></span></div>
      <div class="mt-1"><span class="rb-role-tag ${other ? "other" : ""}">بصفتك: ${roleLabel(n.role)}</span>${b.complete ? ' <span class="rb-role-tag">مكتمل</span>' : ""}</div>
      ${other && pendingOffer === n.id ? `<div class="rb-switch-offer">هذا الكتاب بانتظارك بصفتك «${roleLabel(n.role)}» وليس بدورك الحالي.<button data-switch-open="${n.id}">التبديل إلى هذا الدور وفتح الكتاب</button></div>` : ""}
     </div></article>`;
  }).join("") + "</div>";
}
let pendingOffer = null;
const renderAll = () => { renderHeader(); renderInbox(); if (!$("#NotificationPanelRoot").hidden) renderNotifs(); };
function switchRole(k, silent) {
  S.role = k; save(); closeDD(); renderAll();
  if (!silent) alertMsg("alert-primary", `تم تبديل الدور إلى: <b>${roleLabel(k)}</b> — ${counts(k).open} كتاب بالصندوق`);
}
function openBook(id) {
  const b = S.books.find((x) => x.id === id);
  const wasUnread = !b.read; b.read = true; S.notifs.filter((n) => n.bookId === id).forEach((n) => (n.read = true)); save(); renderAll();
  $("#DisplayBody").innerHTML = `<div class="rb-docbox"><div class="rb-meta"><div><span>رقم الكتاب</span>${b.no}</div><div><span>التاريخ</span>${ymd(b.at)}</div><div><span>الدور</span><span class="rb-role-tag">بصفتك: ${roleLabel(b.role)}</span></div><div><span>الجهة المرسلة</span>${esc(b.from)}</div><div><span>الأولوية</span>${PR[b.pr]}</div><div><span>الهامش</span>${esc(b.margin)}</div></div>
   <div class="rb-paper"><p style="text-align:center"><b>بسم الله الرحمن الرحيم</b></p><p>العدد: ${b.no}<br>التاريخ: ${ymd(b.at)}</p><p><b>م / ${esc(b.subject)}</b></p><p>نص تجريبي — بيانات وهمية لأغراض النموذج الأولي.</p></div>
   ${b.complete ? "" : `<div class="mt-3"><button class="button_style button_color_danger font_size_2m_button border_radius_actions_1 text-white" style="width:auto;padding:0 24px" data-act="${b.id}">اتخاذ إجراء</button></div>`}</div>`;
  bootstrap.Modal.getOrCreateInstance($("#DisplayDocumentsModal")).show();
  if (wasUnread) alertMsg("alert-success", `تم فتح الكتاب ${b.no} — غير المقروء لدور «${roleLabel(b.role)}» صار ${counts(b.role).unread}`);
}
let taId = null;
function openTA(id) {
  taId = id; const b = S.books.find((x) => x.id === id);
  $("#TaSub").textContent = `${b.no} — ${b.subject}`; $("#TaProducer").value = ""; $("#TaStatus").value = "مكتمل"; $("#TaMargin").value = "";
  $("#TaRole").innerHTML = `يُتخذ الإجراء <span class="rb-role-tag">بصفتك: ${roleLabel(b.role)}</span>`;
  $$(".modal.show").forEach((m) => bootstrap.Modal.getInstance(m).hide());
  bootstrap.Modal.getOrCreateInstance($("#TakeActionModal")).show();
}
$("#TaSubmit").onclick = () => {
  const b = S.books.find((x) => x.id === taId); b.read = true; b.complete = true; save();
  bootstrap.Modal.getInstance($("#TakeActionModal")).hide(); renderAll();
  alertMsg("alert-success", `تم اتخاذ الإجراء على ${b.no} — غير المكتمل لدور «${roleLabel(b.role)}» صار ${counts(b.role).open}`);
};
function openDD() { $("#RoleSwitcherDropdown").hidden = false; $("#ActiveRoleChip").setAttribute("aria-expanded", "true"); $("#RoleSwitcherCommittees").hidden = true; renderHeader(); }
function closeDD() { $("#RoleSwitcherDropdown").hidden = true; $("#ActiveRoleChip").setAttribute("aria-expanded", "false"); }
$("#ActiveRoleChip").onclick = (e) => { e.stopPropagation(); $("#RoleSwitcherDropdown").hidden ? openDD() : closeDD(); };
$("#RoleSwitcherDropdown").addEventListener("click", (e) => {
  e.stopPropagation();
  const li = e.target.closest("li[data-prefix]"); if (!li) return;
  const r = ROLES.find((x) => x.p === li.dataset.prefix);
  if (r.committee) { // real flow: committee role asks to pick the committee, then موافق
    $("#RoleSwitcherCommitteeSelect").innerHTML = r.committees.map((c) => { const cc = counts(r.p + "|" + c); return `<option value="${c}">${c} — ${cc.unread} غير مقروء / ${cc.open} غير مكتمل</option>`; }).join("");
    const cur = S.role.split("|")[1]; if (cur) $("#RoleSwitcherCommitteeSelect").value = cur;
    $("#RoleSwitcherCommittees").hidden = false; return;
  }
  switchRole(r.p);
});
$("#RoleSwitcherConfirm").onclick = (e) => { e.stopPropagation(); switchRole("CommitteesRole|" + $("#RoleSwitcherCommitteeSelect").value); };
document.addEventListener("click", (e) => {
  if (!e.target.closest(".header_role_chip_wrap")) closeDD();
  const t = e.target.closest("[data-view],[data-act],[data-viewed],[data-switch],[data-nid],[data-close-notif],[data-switch-open]"); if (!t) return;
  const d = t.dataset;
  if (d.switchOpen) { const n = S.notifs.find((x) => x.id === d.switchOpen); pendingOffer = null; closeNotif(); switchRole(n.role); return openBook(n.bookId); }
  if (d.closeNotif !== undefined) return closeNotif();
  if (d.nid) { const n = S.notifs.find((x) => x.id === d.nid); if (n.role !== S.role) { pendingOffer = n.id; return renderNotifs(); } closeNotif(); return openBook(n.bookId); }
  if (d.switch) return switchRole(d.switch);
  if (d.view) return openBook(+d.view);
  if (d.act) return openTA(+d.act);
  if (d.viewed) { const b = S.books.find((x) => x.id === +d.viewed); b.read = true; S.notifs.filter((n) => n.bookId === b.id).forEach((n) => (n.read = true)); save(); renderAll(); return alertMsg("alert-success", "تم تأكيد الاطلاع"); }
});
function openNotif() { pendingOffer = null; renderNotifs(); const r = $("#NotificationPanelRoot"); r.hidden = false; requestAnimationFrame(() => r.classList.add("notification-panel-root--open")); }
function closeNotif() { const r = $("#NotificationPanelRoot"); r.classList.remove("notification-panel-root--open"); setTimeout(() => (r.hidden = true), 200); }
$("#NotificationBellTrigger").onclick = (e) => { e.stopPropagation(); openNotif(); };
$("#Search").oninput = renderInbox;
// demo controls
$("#DemoRole").innerHTML = ROLE_KEYS.map((k) => `<option value="${k}">${roleLabel(k)}</option>`).join("");
$("#DemoRole").value = "HEADDIVISI";
$("#DemoToggle").onclick = () => ($("#DemoBody").hidden = !$("#DemoBody").hidden);
$("#DemoSend").onclick = () => {
  const k = $("#DemoRole").value, p = POOL[S.pool++ % POOL.length], id = ++S.seq, at = Date.now();
  S.books.push({ id, no: AR("2026/" + id), role: k, from: p[0], subject: p[1], type: p[2], pr: p[3], margin: p[4], at, read: false, complete: false });
  S.notifs.unshift({ id: "n" + id, bookId: id, role: k, at, read: false });
  save(); bumpKey = k; renderAll(); setTimeout(() => (bumpKey = null), 800);
  const cb = $("#RoleChipBadge"); cb.classList.remove("bump"); void cb.offsetWidth; cb.classList.add("bump");
  if (k === S.role) { setTimeout(() => { const r = $(`tr[data-book="${id}"]`); r && r.classList.add("rb-flash"); }, 30); alertMsg("alert-primary", `وصل كتاب جديد ${AR("2026/" + id)} بدورك الحالي`); }
  else alertMsg("alert-warning", `وصل كتاب جديد بصفتك <b>${roleLabel(k)}</b>`, { t: "التبديل والفتح", f: () => { switchRole(k); openBook(id); } });
};
function loginToast() {
  const oth = others().map((k) => [k, counts(k)]).filter(([, c]) => c.open), tot = oth.reduce((s, [, c]) => s + c.open, 0);
  if (!tot) return;
  const top = oth.sort((a, b) => b[1].unread - a[1].unread)[0][0];
  alertMsg("alert-warning", `لديك <b>${tot}</b> كتب بانتظارك بأدوار أخرى (${oth.map(([k, c]) => roleLabel(k) + ": " + c.open).join("، ")})`, { t: "عرض الأدوار", f: openDD });
}
$("#DemoLogin").onclick = loginToast;
$("#Reset").onclick = () => { localStorage.removeItem(KEY); S = seed(); save(); renderAll(); alertMsg("alert-primary", "تمت إعادة ضبط البيانات التجريبية"); };
renderAll(); save(); setTimeout(loginToast, 400);
window.__proto = { get S() { return S; }, counts };
})();
