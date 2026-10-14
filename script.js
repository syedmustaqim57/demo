/* ==========================================================
   Larkspur Dental Studio: sample website concept by NAZ Digital
   Vanilla JavaScript. No dependencies.
   ========================================================== */

/* ---------- CLIENT CONFIGURATION (edit these per client) ---------- */
const CONFIG = {
  clinicName: "Larkspur Dental Studio",
  // Digits only, with country code and no "+" (e.g. "447700900123").
  // Leave empty to hide all WhatsApp buttons.
  whatsappNumber: "",
  // Email used by the "Send by email" fallback after a demo submission.
  email: "hello@larkspurdental.example",
  // Booking endpoint (e.g. a Formspree URL such as "https://formspree.io/f/xxxxxxx").
  // While empty, the form runs in honest DEMO MODE and nothing is delivered to a clinic.
  formEndpoint: ""
};

(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Footer year ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header shadow on scroll ---------- */
  var header = $(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var toggle = $("#menu-toggle");
  var nav = $("#main-nav");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setMenu(false); toggle.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (toggle.getAttribute("aria-expanded") === "true" && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });
  window.matchMedia("(min-width: 861px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });

  /* ---------- Active nav link while scrolling ---------- */
  var navLinks = $$('.main-nav ul a');
  var sectionMap = {};
  navLinks.forEach(function (a) {
    var el = $(a.getAttribute("href"));
    if (el) sectionMap[el.id] = a;
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && sectionMap[entry.target.id]) {
          navLinks.forEach(function (l) { l.classList.remove("is-active"); l.removeAttribute("aria-current"); });
          sectionMap[entry.target.id].classList.add("is-active");
          sectionMap[entry.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(sectionMap).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ---------- Image fallbacks ---------- */
  function markFallback(img) {
    var wrap = img.closest(".media");
    if (wrap) wrap.classList.add("is-fallback");
  }
  $$(".media img").forEach(function (img) {
    img.addEventListener("error", function () { markFallback(img); });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) markFallback(img);
  });

  /* ---------- WhatsApp links (shown only when configured) ---------- */
  var waNumber = (CONFIG.whatsappNumber || "").replace(/\D/g, "");
  function whatsappUrl(text) {
    return "https://wa.me/" + waNumber + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  if (waNumber) {
    $$("[data-whatsapp]").forEach(function (el) {
      el.href = whatsappUrl("Hello " + CONFIG.clinicName + ", I'd like to ask about an appointment.");
      el.hidden = false;
    });
  }

  /* ---------- Treatment buttons: preselect treatment and go to form ---------- */
  var form = $("#booking-form");
  var treatmentSelect = $("#f-treatment");
  $$("[data-treatment]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var wanted = btn.getAttribute("data-treatment");
      Array.prototype.forEach.call(treatmentSelect.options, function (opt) {
        if (opt.value === wanted || opt.text === wanted) treatmentSelect.value = opt.value || opt.text;
      });
      clearError(treatmentSelect);
      $("#book").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" });
      window.setTimeout(function () { $("#f-name").focus({ preventScroll: true }); }, reduceMotion() ? 0 : 600);
    });
  });

  function reduceMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

  /* ---------- Booking form: dates and time slots ---------- */
  var dateInput = $("#f-date");
  var timeSelect = $("#f-time");

  function toISO(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }
  var today = new Date();
  dateInput.min = toISO(today);
  var maxDate = new Date(); maxDate.setMonth(maxDate.getMonth() + 6);
  dateInput.max = toISO(maxDate);

  function parseDate(value) {
    var p = value.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function label(hour) {
    var h = hour % 12 === 0 ? 12 : hour % 12;
    return h + ":00 " + (hour < 12 ? "AM" : "PM");
  }
  function buildSlots() {
    var keep = timeSelect.value;
    timeSelect.innerHTML = "";
    if (!dateInput.value) {
      timeSelect.add(new Option("Choose a date first", ""));
      return;
    }
    var day = parseDate(dateInput.value).getDay();
    if (day === 0) {
      timeSelect.add(new Option("Closed on Sundays", ""));
      return;
    }
    var first = 8, last = 17;               // Mon to Fri: 8:00 AM to 5:00 PM start times
    if (day === 6) { first = 9; last = 13; } // Saturday: 9:00 AM to 1:00 PM start times
    timeSelect.add(new Option("Choose a time", ""));
    for (var h = first; h <= last; h++) timeSelect.add(new Option(label(h), label(h)));
    if (keep) timeSelect.value = keep;
  }
  dateInput.addEventListener("change", function () { buildSlots(); validateField(dateInput); });
  buildSlots();

  /* ---------- Validation ---------- */
  var rules = {
    "f-name": function (v) {
      if (!v.trim()) return "Enter your full name.";
      if (v.trim().length < 2) return "Your name needs at least 2 characters.";
      return "";
    },
    "f-phone": function (v) {
      if (!v.trim()) return "Enter a phone number we can reach you on.";
      var digits = v.replace(/\D/g, "");
      if (!/^[\d\s()+\-.]+$/.test(v) || digits.length < 7 || digits.length > 15) return "Enter a valid phone number, for example +1 555 010 0000.";
      return "";
    },
    "f-email": function (v) {
      if (!v.trim()) return "Enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return "Enter a valid email address, for example name@example.com.";
      return "";
    },
    "f-treatment": function (v) { return v ? "" : "Choose the treatment you need."; },
    "f-date": function (v) {
      if (!v) return "Choose your preferred date.";
      var d = parseDate(v);
      var start = new Date(); start.setHours(0, 0, 0, 0);
      if (isNaN(d.getTime())) return "Enter a valid date.";
      if (d < start) return "Choose today or a future date.";
      if (d > maxDate) return "Choose a date within the next six months.";
      if (d.getDay() === 0) return "The clinic is closed on Sundays. Please choose another day.";
      return "";
    },
    "f-time": function (v) { return v ? "" : "Choose a time. If none are listed, pick a different date."; },
    "f-consent": function (v, el) { return el.checked ? "" : "Please tick this box so the clinic can reply to you."; }
  };

  function errorEl(field) { return document.getElementById("e-" + field.id.replace("f-", "")); }
  function setError(field, msg) {
    var out = errorEl(field);
    if (out) out.textContent = msg;
    field.setAttribute("aria-invalid", "true");
  }
  function clearError(field) {
    var out = errorEl(field);
    if (out) out.textContent = "";
    field.removeAttribute("aria-invalid");
  }
  function validateField(field) {
    var rule = rules[field.id];
    if (!rule) return true;
    var msg = rule(field.value, field);
    if (msg) { setError(field, msg); return false; }
    clearError(field);
    return true;
  }

  Object.keys(rules).forEach(function (id) {
    var field = document.getElementById(id);
    field.addEventListener("blur", function () {
      // Validate on leaving a field, but don't nag on fields the visitor never touched.
      if (field.type === "checkbox" || field.value) validateField(field);
    });
    field.addEventListener("input", function () { if (field.getAttribute("aria-invalid") === "true") validateField(field); });
    field.addEventListener("change", function () { if (field.getAttribute("aria-invalid") === "true") validateField(field); });
  });

  /* ---------- Submit ---------- */
  var result = $("#form-result");
  var submitBtn = $("#submit-btn");

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function formatDate(value) {
    return parseDate(value).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function summaryText(d) {
    return [
      "Appointment request for " + CONFIG.clinicName,
      "Name: " + d.name,
      "Phone: " + d.phone,
      "Email: " + d.email,
      "Treatment: " + d.treatment,
      "Preferred date: " + formatDate(d.date),
      "Preferred time: " + d.time,
      d.message ? "Message: " + d.message : ""
    ].filter(Boolean).join("\n");
  }

  function showResult(kind, data) {
    var summary =
      "<dl>" +
      "<dt>Name</dt><dd>" + escapeHTML(data.name) + "</dd>" +
      "<dt>Treatment</dt><dd>" + escapeHTML(data.treatment) + "</dd>" +
      "<dt>Preferred</dt><dd>" + escapeHTML(formatDate(data.date)) + ", " + escapeHTML(data.time) + "</dd>" +
      "</dl>";
    var html = "";
    var check = '<span class="result-icon"><svg class="i"><use href="#i-check"/></svg></span>';

    if (kind === "sent") {
      html = check + "<h3>Request sent</h3>" +
        "<p>Thank you, " + escapeHTML(data.name.split(" ")[0]) + ". The clinic will confirm your appointment by phone or email.</p>" + summary +
        '<div class="result-actions"><button type="button" class="btn btn-secondary" id="again-btn">Make another request</button></div>';
    } else {
      var intro = kind === "failed"
        ? "<h3>We couldn't send your request</h3><p>Something went wrong while sending. Your details are below, so you can contact the clinic directly instead.</p>"
        : "<h3>Your request is ready</h3><p>Thanks, " + escapeHTML(data.name.split(" ")[0]) + ". Your details look good.</p>";
      var note = kind === "failed"
        ? '<p class="result-note is-warn"><strong>Not delivered.</strong> Please use one of the options below.</p>'
        : '<p class="result-note is-warn"><strong>Demo mode: nothing was sent.</strong> No booking service is connected to this website concept yet. To send this request, use one of the options below.</p>';
      var mail = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent("Appointment request") + "&body=" + encodeURIComponent(summaryText(data));
      var actions = '<a class="btn btn-primary" href="' + mail + '">Send by email</a>' +
        (waNumber ? '<a class="btn btn-whatsapp" style="margin-top:0" target="_blank" rel="noopener" href="' + whatsappUrl(summaryText(data)) + '">Send on WhatsApp</a>' : "") +
        '<a class="btn btn-secondary" href="tel:+15550100">Call the clinic</a>';
      html = check + intro + summary + note +
        '<div class="result-actions">' + actions + "</div>" +
        '<div class="result-actions"><button type="button" class="btn btn-ghost btn-sm" id="again-btn">Edit my request</button></div>';
    }

    result.innerHTML = html;
    form.hidden = true;
    result.hidden = false;
    result.focus();
    result.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "nearest" });
    $("#again-btn").addEventListener("click", function () {
      if (kind === "sent") form.reset();
      buildSlots();
      result.hidden = true;
      form.hidden = false;
      $("#f-name").focus();
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstInvalid = null;
    Object.keys(rules).forEach(function (id) {
      var field = document.getElementById(id);
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    var data = {
      name: $("#f-name").value.trim(),
      phone: $("#f-phone").value.trim(),
      email: $("#f-email").value.trim(),
      treatment: treatmentSelect.value,
      date: dateInput.value,
      time: timeSelect.value,
      message: $("#f-message").value.trim()
    };

    if (!CONFIG.formEndpoint) { showResult("demo", data); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    fetch(CONFIG.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      showResult("sent", data);
    }).catch(function () {
      showResult("failed", data);
    }).then(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = "Request appointment";
    });
  });

  /* ---------- Before / after slider ---------- */
  var ba = $("#ba");
  var range = $("#ba-range");
  if (ba && range) {
    var update = function () { ba.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", update);
    update();
  }
})();
