/**
 * LYCE BEAUTY — script.js
 * Funcionalidades: Menu, Navegação, Formulário de contato (EmailJS), Animações
 */

// ============================================================
// CONFIGURAÇÃO EMAILJS
// ✏️  Substitua com suas credenciais de https://emailjs.com
// ============================================================
const EMAILJS_CONFIG = {
  publicKey:       'SEU_PUBLIC_KEY',
  serviceId:       'SEU_SERVICE_ID',
  templateContato: 'SEU_TEMPLATE_CONTATO',
};

// ============================================================
// UTILITÁRIOS
// ============================================================
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ============================================================
// NAVBAR / MENU MOBILE
// ============================================================
const navbar       = $('#navbar');
const hamburger    = $('#hamburger');
const navMenu      = $('#nav-menu');
const menuBackdrop = $('#menu-backdrop');

function setMenu(open) {
  if (!hamburger || !navMenu) return;
  hamburger.classList.toggle('open', open);
  navMenu.classList.toggle('open', open);
  navbar?.classList.toggle('menu-open', open);
  menuBackdrop?.classList.toggle('visible', open);
  hamburger.setAttribute('aria-expanded', open);
  hamburger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  document.body.style.overflow = open ? 'hidden' : '';
}

function closeMenu() {
  if (navMenu && navMenu.classList.contains('open')) setMenu(false);
}

hamburger?.addEventListener('click', () => {
  setMenu(!navMenu.classList.contains('open'));
});

navMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

// Fecha o menu ao tocar fora dele
document.addEventListener('click', (e) => {
  if (!navMenu || !navMenu.classList.contains('open')) return;
  if (navMenu.contains(e.target) || hamburger.contains(e.target)) return;
  closeMenu();
});

// Ao voltar para tela grande, garante o menu fechado
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) closeMenu();
});

function updateActiveNav() {
  const sections = ['home', 'sobre', 'produtos', 'contato'];
  let current = 'home';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 140) current = id;
  });
  $$('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
  });
}

window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 60);
  updateActiveNav();
}, { passive: true });

// ============================================================
// VALIDAÇÃO DO FORMULÁRIO DE CONTATO
// ============================================================
const onlyDigits = (v) => v.replace(/\D/g, '');

function maskPhone(v) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2)  return d.length ? `(${d}` : '';
  if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const RULES = {
  name: (v) => {
    if (!v) return 'Informe seu nome completo.';
    const parts = v.split(/\s+/).filter(p => p.length > 1);
    return parts.length < 2 ? 'Digite nome e sobrenome.' : '';
  },
  email: (v) => {
    if (!v) return 'Informe seu e-mail.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Digite um e-mail válido (ex: nome@email.com).';
  },
  tel: (v) => {
    const d = onlyDigits(v);
    if (!d) return 'Informe seu WhatsApp com DDD.';
    if (d.length < 10 || d.length > 11) return 'Telefone incompleto. Use DDD + número.';
    if (/^(\d)\1+$/.test(d) || d[0] === '0') return 'Telefone inválido.';
    if (d.length === 11 && d[2] !== '9') return 'Celular deve começar com 9 após o DDD.';
    return '';
  },
  telOptional: (v) => (v.trim() ? RULES.tel(v) : ''),
  assunto:  (v) => v ? '' : 'Selecione um assunto.',
  mensagem: (v) => {
    if (!v) return 'Escreva sua mensagem.';
    return v.length < 10 ? 'Escreva pelo menos 10 caracteres.' : '';
  },
};

const CONTACT_FIELDS = {
  'contact-name':    RULES.name,
  'contact-email':   RULES.email,
  'contact-phone':   RULES.telOptional,
  'contact-subject': RULES.assunto,
  'contact-message': RULES.mensagem,
};

function setFieldError(input, message) {
  const errEl = $('#err-' + input.id);
  input.classList.toggle('invalid', !!message);
  input.classList.toggle('valid', !message && !!input.value.trim());
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (errEl) {
    errEl.textContent = message;
    errEl.classList.toggle('show', !!message);
    input.setAttribute('aria-describedby', errEl.id);
  }
}

function validateField(input, rule) {
  const value = input.tagName === 'SELECT' ? input.value : input.value.trim();
  const message = rule(value);
  setFieldError(input, message);
  return !message;
}

// Valida todos os campos; retorna o primeiro inválido (ou null)
function validateForm(fields) {
  let firstInvalid = null;
  Object.entries(fields).forEach(([id, rule]) => {
    const input = document.getElementById(id);
    if (input && !validateField(input, rule) && !firstInvalid) firstInvalid = input;
  });
  return firstInvalid;
}

function focusInvalid(el) {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => el.focus({ preventScroll: true }), 300);
}

function clearFormErrors(form) {
  $$('.invalid, .valid', form).forEach(el => el.classList.remove('invalid', 'valid'));
  $$('.field-error', form).forEach(el => { el.textContent = ''; el.classList.remove('show'); });
  $$('[aria-invalid]', form).forEach(el => el.removeAttribute('aria-invalid'));
}

// Validação ao sair do campo (blur) e correção ao digitar
function bindLiveValidation(fields) {
  Object.entries(fields).forEach(([id, rule]) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('blur', () => validateField(input, rule));
    const evt = input.tagName === 'SELECT' ? 'change' : 'input';
    input.addEventListener(evt, () => {
      if (input.classList.contains('invalid')) validateField(input, rule);
    });
  });
}
bindLiveValidation(CONTACT_FIELDS);

// Máscara de telefone
$('#contact-phone')?.addEventListener('input', (e) => {
  e.target.value = maskPhone(e.target.value);
});

// ============================================================
// FORMULÁRIO DE CONTATO — envio
// ============================================================
$('#contato-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form      = e.target;
  const submitBtn = $('#contato-submit');
  const btnText   = submitBtn.querySelector('.btn-text');
  const btnLoad   = submitBtn.querySelector('.btn-loading');
  const successEl = $('#form-success');
  const errorEl   = $('#form-error');

  successEl.style.display = 'none';
  errorEl.style.display   = 'none';

  const firstInvalid = validateForm(CONTACT_FIELDS);
  if (firstInvalid) {
    focusInvalid(firstInvalid);
    return;
  }

  btnText.style.display = 'none';
  btnLoad.style.display = 'inline';
  submitBtn.disabled    = true;

  const params = {
    from_name:  $('#contact-name').value.trim(),
    from_email: $('#contact-email').value.trim(),
    from_phone: $('#contact-phone').value.trim(),
    subject:    $('#contact-subject').value,
    message:    $('#contact-message').value.trim(),
  };

  try {
    if (EMAILJS_CONFIG.publicKey !== 'SEU_PUBLIC_KEY') {
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateContato,
        params,
        EMAILJS_CONFIG.publicKey
      );
    } else {
      // Modo demo — simula envio
      await new Promise(r => setTimeout(r, 1200));
    }
    successEl.style.display = 'block';
    form.reset();
    clearFormErrors(form);
  } catch (err) {
    console.error('EmailJS error:', err);
    errorEl.style.display = 'block';
  } finally {
    btnText.style.display = 'inline';
    btnLoad.style.display = 'none';
    submitBtn.disabled    = false;
  }
});

// ============================================================
// SCROLL REVEAL ANIMATIONS
// ============================================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function addRevealClasses() {
  const selectors = [
    '.category-card',
    '.catalogo-cta__actions',
    '.entrega__item',
    '.value-item',
    '.sobre__content',
    '.sobre__img-wrap',
    '.contato__info',
    '.contato__form',
    '.section-header',
  ];
  selectors.forEach(sel => {
    $$(sel).forEach((el, i) => {
      el.classList.add('reveal');
      if (i % 3 === 1) el.classList.add('reveal-delay-1');
      if (i % 3 === 2) el.classList.add('reveal-delay-2');
      revealObserver.observe(el);
    });
  });
}

// ============================================================
// TECLADO — fechar menu com ESC
// ============================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

// ============================================================
// EMAILJS — carrega SDK somente se as credenciais estiverem configuradas
// ============================================================
function loadEmailJS() {
  if (EMAILJS_CONFIG.publicKey === 'SEU_PUBLIC_KEY') return;
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  script.onload = () => emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  document.head.appendChild(script);
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  addRevealClasses();
  updateActiveNav();
  loadEmailJS();

  // Smooth scroll para âncoras internas
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('%c💜 LYCE BEAUTY — Site carregado com sucesso!', 'color:#C9A055;font-family:serif;font-size:14px;font-weight:bold;');
});