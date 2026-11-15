/**
 * THE POLAROID STATION – Main JavaScript
 * Lightweight, Vanilla JS, Zero Heavy Libraries
 */

document.addEventListener('DOMContentLoaded', () => {
  initPageIntro();
  initNavbar();
  initMobileMenu();
  initScrollReveals();
  initStepsLine();
  initGalleryFilter();
  initAccordion();
  initPackageSelection();
  initPackageFormLogic();
  initTermsCheckboxLogic();
  initBookingForm();
  initInteractiveCamera();
  initDateConstraints();
  initCustomCursor();
});

/* ==========================================================================
   1. Page Load Intro (Polaroid "Develops" Effect)
   ========================================================================== */
function initPageIntro() {
  const introOverlay = document.querySelector('.page-load-intro');
  if (!introOverlay) return;

  // Check if reduced motion is requested
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    introOverlay.style.display = 'none';
    return;
  }

  // Dismiss intro after developing transition
  window.addEventListener('load', () => {
    setTimeout(() => {
      introOverlay.classList.add('hidden');
      setTimeout(() => {
        introOverlay.style.display = 'none';
      }, 800);
    }, 1300);
  });

  // Fallback in case load event was already fired
  setTimeout(() => {
    if (!introOverlay.classList.contains('hidden')) {
      introOverlay.classList.add('hidden');
      setTimeout(() => {
        introOverlay.style.display = 'none';
      }, 800);
    }
  }, 2500);
}

/* ==========================================================================
   2. Navbar Scroll Behavior
   ========================================================================== */
function initNavbar() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initial check
}

/* ==========================================================================
   3. Mobile Drawer Navigation
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const backdrop = document.querySelector('.mobile-drawer-backdrop');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-drawer .btn');

  if (!toggleBtn || !drawer || !backdrop) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    backdrop.classList.add('active');
    toggleBtn.classList.add('active');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    backdrop.classList.remove('active');
    toggleBtn.classList.remove('active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) closeDrawer();
    else openDrawer();
  });

  backdrop.addEventListener('click', closeDrawer);

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });

  // Close with Esc key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

/* ==========================================================================
   4. Scroll Reveals (IntersectionObserver)
   ========================================================================== */
function initScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal-init, .package-card');
  if (!revealElements.length) return;

  if (!('IntersectionObserver' in window)) {
    // Fallback: reveal immediately
    revealElements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  });

  revealElements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   5. Steps Section Dotted Line Drawing
   ========================================================================== */
function initStepsLine() {
  const path = document.querySelector('.steps-dotted-path');
  const section = document.querySelector('.how-section');
  if (!path || !section) return;

  if (!('IntersectionObserver' in window)) {
    path.classList.add('is-drawn');
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        path.classList.add('is-drawn');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.25
  });

  observer.observe(section);
}

/* ==========================================================================
   6. Gallery Filtering (Instagram Story Categories)
   ========================================================================== */
function initGalleryFilter() {
  const filterBtns = document.querySelectorAll('.filter-chip-btn');
  const cards = document.querySelectorAll('.gallery-card');

  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'block';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = '';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            if (card.style.opacity === '0') {
              card.style.display = 'none';
            }
          }, 300);
        }
      });
    });
  });
}

/* ==========================================================================
   7. Accordion (Terms & Conditions)
   ========================================================================== */
function initAccordion() {
  const accordionItems = document.querySelectorAll('.accordion-item');
  if (!accordionItems.length) return;

  accordionItems.forEach(item => {
    const btn = item.querySelector('.accordion-header-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // Close all other items (only one open at a time)
      accordionItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('is-open')) {
          otherItem.classList.remove('is-open');
          const otherBtn = otherItem.querySelector('.accordion-header-btn');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current item
      if (isOpen) {
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ==========================================================================
   8. Package Selection Pre-fill & Scroll
   ========================================================================== */
function initPackageSelection() {
  const packageButtons = document.querySelectorAll('[data-package-target]');
  const packageSelect = document.getElementById('packageSelect');
  const bookSection = document.getElementById('book');

  if (!packageButtons.length || !packageSelect) return;

  packageButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetPkg = btn.getAttribute('data-package-target');
      if (targetPkg) {
        packageSelect.value = targetPkg;
        packageSelect.dispatchEvent(new Event('change'));
      }
      if (bookSection) {
        bookSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ==========================================================================
   9. Package Form Dynamic Logic (Polaroids Count & Price Estimate)
   ========================================================================== */
function initPackageFormLogic() {
  const packageSelect = document.getElementById('packageSelect');
  const polaroidsCount = document.getElementById('polaroidsCount');
  const priceDisplay = document.getElementById('estimatedPriceDisplay');

  if (!packageSelect || !polaroidsCount || !priceDisplay) return;

  const updatePackageState = () => {
    const val = packageSelect.value;
    if (val === 'standard') {
      polaroidsCount.value = '40';
      polaroidsCount.readOnly = true;
      polaroidsCount.classList.add('is-locked');
      priceDisplay.textContent = 'Estimated: PKR 40,000';
    } else {
      polaroidsCount.readOnly = false;
      polaroidsCount.classList.remove('is-locked');
      if (polaroidsCount.value === '40') {
        polaroidsCount.value = '';
      }
      polaroidsCount.placeholder = 'e.g. 60 or 100';
      priceDisplay.textContent = "Custom quote – we'll confirm the price with you";
    }
  };

  packageSelect.addEventListener('change', updatePackageState);
  updatePackageState(); // initialize
}

/* ==========================================================================
   10. Terms Checkbox & Submit Button Enabler
   ========================================================================== */
function initTermsCheckboxLogic() {
  const termsCheckbox = document.getElementById('termsAccepted');
  const submitBtn = document.getElementById('submitBtn');

  if (!termsCheckbox || !submitBtn) return;

  const syncSubmitBtn = () => {
    submitBtn.disabled = !termsCheckbox.checked;
  };

  termsCheckbox.addEventListener('change', syncSubmitBtn);
  syncSubmitBtn(); // initialize disabled state
}

/* ==========================================================================
   11. Interactive Camera Flash & Eject
   ========================================================================== */
function initInteractiveCamera() {
  const cameraWrap = document.querySelector('.hero-camera-img-wrap');
  const flashOverlay = document.querySelector('.camera-flash-overlay');

  if (!cameraWrap || !flashOverlay) return;

  cameraWrap.addEventListener('click', () => {
    triggerCameraFlash();
  });
}

function triggerCameraFlash() {
  const flashOverlay = document.querySelector('.camera-flash-overlay');
  if (!flashOverlay) return;

  flashOverlay.classList.remove('flashing');
  void flashOverlay.offsetWidth; // trigger reflow
  flashOverlay.classList.add('flashing');
  setTimeout(() => {
    flashOverlay.classList.remove('flashing');
  }, 650);
}

/* ==========================================================================
   12. Date Picker Constraints (Min Date = Today)
   ========================================================================== */
function initDateConstraints() {
  const dateInput = document.getElementById('eventDate');
  if (!dateInput) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}

/* ==========================================================================
   13. Booking Form Submission (Fetch POST to /api/book)
   ========================================================================== */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  const submitBtn = document.getElementById('submitBtn');
  const statusAlert = document.getElementById('formStatusAlert');
  const thankYouModal = document.getElementById('thankYouModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const packageSelect = document.getElementById('packageSelect');
  const polaroidsCount = document.getElementById('polaroidsCount');
  const addOnSelect = document.getElementById('addOnSelect');
  const termsCheckbox = document.getElementById('termsAccepted');

  if (!form) return;

  // Close modal logic
  if (closeModalBtn && thankYouModal) {
    closeModalBtn.addEventListener('click', () => {
      thankYouModal.classList.remove('active');
    });

    thankYouModal.addEventListener('click', (e) => {
      if (e.target === thankYouModal) {
        thankYouModal.classList.remove('active');
      }
    });
  }

  // Live input error clearing
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', () => {
      const parent = input.closest('.form-field') || input.closest('.terms-checkbox-field');
      if (parent) {
        parent.classList.remove('error');
        input.classList.remove('is-invalid');
      }
      if (statusAlert) statusAlert.style.display = 'none';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset errors
    form.querySelectorAll('.form-field, .terms-checkbox-field').forEach(f => f.classList.remove('error'));
    form.querySelectorAll('.is-invalid').forEach(f => f.classList.remove('is-invalid'));
    if (statusAlert) statusAlert.style.display = 'none';

    // Retrieve values
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const packageVal = packageSelect ? packageSelect.value : 'standard';
    const polaroidsVal = polaroidsCount ? polaroidsCount.value.trim() : '40';
    const addOnVal = addOnSelect ? addOnSelect.value : 'Guest Book';
    const eventType = form.eventType.value;
    const eventDate = form.eventDate.value;
    const eventCity = form.eventCity.value.trim();
    const guestCount = form.guestCount.value.trim();
    const message = form.message.value.trim();
    const termsAcceptedVal = termsCheckbox ? termsCheckbox.checked : false;
    const website_hp = form.website_hp ? form.website_hp.value : '';

    // Validate fields
    let isValid = true;

    function setFieldError(fieldName, msg) {
      const field = form[fieldName];
      if (field) {
        field.classList.add('is-invalid');
        const parent = field.closest('.form-field');
        if (parent) {
          parent.classList.add('error');
          const errSpan = parent.querySelector('.field-error-msg');
          if (errSpan) errSpan.textContent = msg;
        }
      }
      isValid = false;
    }

    if (!name || name.length < 2) {
      setFieldError('name', 'Please enter your full name (minimum 2 characters).');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      setFieldError('email', 'Please enter a valid email address.');
    }

    if (!phone || phone.length < 6) {
      setFieldError('phone', 'Please enter a valid phone or WhatsApp number.');
    }

    if (!packageVal) {
      setFieldError('package', 'Please select a package.');
    }

    if (packageVal === 'custom') {
      const parsedCount = parseInt(polaroidsVal, 10);
      if (isNaN(parsedCount) || parsedCount < 1) {
        setFieldError('polaroidsCount', 'Please enter the number of Polaroids needed (min 1).');
      }
    }

    if (!eventType) {
      setFieldError('eventType', 'Please choose an event type.');
    }

    if (!eventDate) {
      setFieldError('eventDate', 'Please pick a date for your event.');
    }

    if (!termsAcceptedVal) {
      if (statusAlert) {
        statusAlert.className = 'form-status-alert error';
        statusAlert.textContent = 'Please read and agree to the Terms & Conditions before submitting.';
        statusAlert.style.display = 'block';
      }
      isValid = false;
    }

    if (!isValid) {
      const firstError = form.querySelector('.is-invalid');
      if (firstError) firstError.focus();
      return;
    }

    // Set Loading State
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; vertical-align: middle;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      Sending Your Request...
    `;

    try {
      const payload = {
        name,
        email,
        phone,
        package: packageVal,
        polaroidsCount: packageVal === 'standard' ? 40 : parseInt(polaroidsVal, 10),
        addOn: addOnVal,
        termsAccepted: true,
        eventType,
        eventDate,
        eventCity: eventCity || 'Lahore',
        guestCount,
        message,
        website_hp
      };

      let data = { success: true };

      if (window.location.protocol === 'file:') {
        // In local file preview (file:///), simulate a realistic serverless response
        await new Promise(r => setTimeout(r, 650));
        console.log('Local preview mode: booking payload captured:', payload);
      } else {
        const response = await fetch('/api/book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Unable to submit booking. Please check your details and try again.');
        }
      }

      if (data.success) {
        // 1. Trigger camera flash effect!
        triggerCameraFlash();

        // 2. Open Thank You Polaroid modal
        if (thankYouModal) {
          const detailSpan = document.getElementById('thankYouDetails');
          if (detailSpan) {
            const pkgTitle = packageVal === 'standard' ? 'Standard Package' : 'Custom Package';
            detailSpan.textContent = `for your ${eventType} (${pkgTitle}) on ${eventDate}`;
          }
          setTimeout(() => {
            thankYouModal.classList.add('active');
          }, 350);
        }

        // 3. Reset form
        form.reset();
        if (packageSelect) {
          packageSelect.value = 'standard';
          packageSelect.dispatchEvent(new Event('change'));
        }
        initTermsCheckboxLogic();
        initDateConstraints();
      }
    } catch (err) {
      console.error('Booking form error:', err);
      if (statusAlert) {
        statusAlert.className = 'form-status-alert error';
        statusAlert.innerHTML = `<strong>Submission issue:</strong> ${err.message || 'Something went wrong. Please check your internet connection or message us on Instagram <a href="https://www.instagram.com/thepolaroidstation_" target="_blank" style="text-decoration:underline; font-weight:600;">@thepolaroidstation_</a>.'}`;
        statusAlert.style.display = 'block';
      }
    } finally {
      submitBtn.disabled = !termsCheckbox.checked;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

/* ==========================================================================
   14. Desktop Custom Cursor (Optional Sparkle Dot)
   ========================================================================== */
function initCustomCursor() {
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isFinePointer || prefersReduced) return;

  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor-dot';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '✦';
  document.body.appendChild(cursor);

  Object.assign(cursor.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '20px',
    height: '20px',
    lineHeight: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#D9B26F',
    pointerEvents: 'none',
    zIndex: '99999',
    transition: 'transform 0.1s ease-out, opacity 0.2s ease',
    opacity: '0',
    userSelect: 'none'
  });

  let mouseX = -100;
  let mouseY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.opacity = '1';
    cursor.style.transform = `translate3d(${mouseX - 10}px, ${mouseY - 10}px, 0)`;
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });

  // Scale slightly over clickable items
  document.querySelectorAll('a, button, input, select, textarea, .polaroid-card, .package-card, .accordion-header-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = `translate3d(${mouseX - 10}px, ${mouseY - 10}px, 0) scale(1.4)`;
      cursor.style.color = '#F2CFC8';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = `translate3d(${mouseX - 10}px, ${mouseY - 10}px, 0) scale(1)`;
      cursor.style.color = '#D9B26F';
    });
  });
}
