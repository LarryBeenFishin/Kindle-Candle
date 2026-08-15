(() => {
  'use strict';

  const RECIPE_STORAGE_KEY = 'kindleFragranceRecipesV1';
  const BLEND_STORAGE_KEY = 'kindleFragranceBlendsV1';
  const LEGACY_RECIPE_KEY = 'kindleLegacyRecipesV1';
  const LEGACY_BLEND_KEY = 'kindleLegacyBlendsV1';
  const MIGRATION_CAPTURED_KEY = 'kindleCloudMigrationCapturedV1';

  const config = window.KINDLE_SUPABASE_CONFIG || {};
  const configured = Boolean(
    config.url && config.key &&
    !String(config.url).includes('PASTE_YOUR_') &&
    !String(config.key).includes('PASTE_YOUR_')
  );

  let client = null;
  let currentUser = null;
  let modalMessage = '';
  let readyResolve;
  const ready = new Promise(resolve => { readyResolve = resolve; });


  function installMobileHeaderStyles() {
    if (document.getElementById('kindle-mobile-header-overrides')) return;
    const style = document.createElement('style');
    style.id = 'kindle-mobile-header-overrides';
    style.textContent = `
      /* Mobile-only header: menu left, centered logo, account right. */
      .kindle-mobile-menu-btn,
      .kindle-mobile-account-btn { display:none; }

      @media (max-width: 820px) {
        .announcement {
          padding: 9px 12px !important;
          font-size: 8.5px !important;
          line-height: 1.35 !important;
          letter-spacing: .16em !important;
          text-align: center !important;
          white-space: normal !important;
        }

        .site-header {
          width: 100% !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          background: var(--paper, #f7f0e6) !important;
          border-bottom: 1px solid rgba(90,56,38,.14) !important;
          position: relative !important;
          z-index: 5000 !important;
        }

        .header-inner {
          box-sizing: border-box !important;
          width: 100% !important;
          min-height: 84px !important;
          margin: 0 !important;
          padding: 10px 16px !important;
          display: grid !important;
          grid-template-columns: 48px 1fr 48px !important;
          align-items: center !important;
          gap: 8px !important;
          position: relative !important;
        }

        .header-inner .brand {
          grid-column: 2 !important;
          width: auto !important;
          height: auto !important;
          margin: 0 auto !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          position: relative !important;
          z-index: 2 !important;
        }

        .header-inner .brand-logo {
          display: block !important;
          width: 124px !important;
          height: auto !important;
          max-width: 124px !important;
          max-height: 66px !important;
          object-fit: contain !important;
        }

        .kindle-mobile-menu-btn,
        .kindle-mobile-account-btn {
          appearance: none !important;
          display: inline-flex !important;
          width: 44px !important;
          height: 44px !important;
          align-items: center !important;
          justify-content: center !important;
          border: 0 !important;
          background: transparent !important;
          color: var(--ink, #2a1b14) !important;
          padding: 0 !important;
          margin: 0 !important;
          cursor: pointer !important;
          z-index: 4 !important;
        }

        .kindle-mobile-menu-btn { grid-column: 1 !important; grid-row: 1 !important; }
        .kindle-mobile-account-btn { grid-column: 3 !important; grid-row: 1 !important; justify-self: end !important; }

        .kindle-mobile-menu-btn svg,
        .kindle-mobile-account-btn svg {
          width: 24px !important;
          height: 24px !important;
          stroke: currentColor !important;
          fill: none !important;
          stroke-width: 1.7 !important;
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
        }

        .kindle-mobile-account-btn svg {
          width: 29px !important;
          height: 29px !important;
          stroke-width: 1.8 !important;
        }

        .header-inner .nav {
          box-sizing: border-box !important;
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 8px 18px 18px !important;
          display: none !important;
          flex-direction: column !important;
          align-items: stretch !important;
          justify-content: flex-start !important;
          gap: 0 !important;
          overflow: visible !important;
          white-space: normal !important;
          background: var(--paper, #f7f0e6) !important;
          border-top: 1px solid rgba(90,56,38,.14) !important;
          border-bottom: 1px solid rgba(90,56,38,.18) !important;
          box-shadow: 0 12px 24px rgba(42,27,20,.10) !important;
          z-index: 3 !important;
        }

        .header-inner.kindle-mobile-menu-open .nav {
          display: flex !important;
        }

        .header-inner .nav a {
          box-sizing: border-box !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 15px 2px !important;
          border: 0 !important;
          border-bottom: 1px solid rgba(90,56,38,.14) !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          line-height: 1.2 !important;
          letter-spacing: .08em !important;
          text-transform: uppercase !important;
          text-align: left !important;
          white-space: normal !important;
          text-decoration: none !important;
        }

        .header-inner .nav a:last-of-type { border-bottom: 0 !important; }
        .header-inner .nav a[aria-current="page"] { color: var(--accent-dark, #8d4a2f) !important; font-weight: 700 !important; }

        /* The desktop account text button stays in the nav DOM, but mobile uses the icon at right. */
        .header-inner .nav .kindle-account-btn { display: none !important; }
      }

      @media (max-width: 480px) {
        .announcement { font-size: 8px !important; letter-spacing: .14em !important; }
        .header-inner { min-height: 78px !important; padding: 8px 12px !important; grid-template-columns: 44px 1fr 44px !important; }
        .header-inner .brand-logo { width: 114px !important; max-width: 114px !important; max-height: 60px !important; }
        .kindle-mobile-menu-btn,.kindle-mobile-account-btn { width: 40px !important; height: 40px !important; }
        .kindle-mobile-menu-btn svg { width: 23px !important; height: 23px !important; }
        .kindle-mobile-account-btn svg { width: 28px !important; height: 28px !important; }
        .header-inner .nav { padding: 6px 16px 16px !important; }
        .header-inner .nav a { padding: 14px 1px !important; font-size: 12.5px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function installMobileHeaderControls() {
    const headerInner = document.querySelector('.site-header .header-inner');
    const nav = headerInner?.querySelector('.nav');
    const account = document.getElementById('kindleAccountBtn');
    if (!headerInner || !nav) return;

    if (!document.getElementById('kindleMobileMenuBtn')) {
      const menu = document.createElement('button');
      menu.id = 'kindleMobileMenuBtn';
      menu.className = 'kindle-mobile-menu-btn';
      menu.type = 'button';
      menu.setAttribute('aria-label', 'Open navigation menu');
      menu.setAttribute('aria-expanded', 'false');
      menu.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
      headerInner.insertBefore(menu, headerInner.firstChild);

      menu.addEventListener('click', (event) => {
        event.stopPropagation();
        const open = headerInner.classList.toggle('kindle-mobile-menu-open');
        menu.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
        menu.innerHTML = open
          ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
          : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
      });
    }

    if (!document.getElementById('kindleMobileAccountBtn')) {
      const mobileAccount = document.createElement('button');
      mobileAccount.id = 'kindleMobileAccountBtn';
      mobileAccount.className = 'kindle-mobile-account-btn';
      mobileAccount.type = 'button';
      mobileAccount.setAttribute('aria-label', 'Account');
      mobileAccount.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13"/><circle cx="16" cy="12" r="4.25"/><path d="M8.7 25c1.1-4.3 3.7-6.4 7.3-6.4s6.2 2.1 7.3 6.4"/></svg>';
      headerInner.appendChild(mobileAccount);
      mobileAccount.addEventListener('click', () => {
        headerInner.classList.remove('kindle-mobile-menu-open');
        const menu = document.getElementById('kindleMobileMenuBtn');
        if (menu) {
          menu.setAttribute('aria-expanded', 'false');
          menu.setAttribute('aria-label', 'Open navigation menu');
          menu.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
        }
        if (account) account.click();
        else openAuth(currentUser ? 'account' : 'signin');
      });
    }

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => headerInner.classList.remove('kindle-mobile-menu-open'));
    });

    document.addEventListener('click', (event) => {
      if (!headerInner.classList.contains('kindle-mobile-menu-open')) return;
      if (!headerInner.contains(event.target)) {
        headerInner.classList.remove('kindle-mobile-menu-open');
        const menu = document.getElementById('kindleMobileMenuBtn');
        if (menu) {
          menu.setAttribute('aria-expanded', 'false');
          menu.setAttribute('aria-label', 'Open navigation menu');
          menu.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
        }
      }
    });
  }

  function safeParse(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function saveArray(key, value) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
  }

  function captureLegacyData() {
    if (localStorage.getItem(MIGRATION_CAPTURED_KEY) === '1') return;
    const recipes = safeParse(RECIPE_STORAGE_KEY);
    const blends = safeParse(BLEND_STORAGE_KEY);
    if (recipes.length && !safeParse(LEGACY_RECIPE_KEY).length) saveArray(LEGACY_RECIPE_KEY, recipes);
    if (blends.length && !safeParse(LEGACY_BLEND_KEY).length) saveArray(LEGACY_BLEND_KEY, blends);
    localStorage.setItem(MIGRATION_CAPTURED_KEY, '1');
  }

  function clearActiveCaches() {
    localStorage.removeItem(RECIPE_STORAGE_KEY);
    localStorage.removeItem(BLEND_STORAGE_KEY);
  }

  function dispatch(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function injectStyles() {
    if (document.getElementById('kindle-auth-styles')) return;
    const style = document.createElement('style');
    style.id = 'kindle-auth-styles';
    style.textContent = `
      .kindle-account-btn{appearance:none;border:1px solid #2a1b14;background:#8d4a2f;color:#fffaf2;font:700 11px/1.1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;letter-spacing:.12em;text-transform:uppercase;padding:10px 13px;cursor:pointer;white-space:nowrap}
      .kindle-account-btn:hover{background:#6f3824}
      .kindle-account-btn[data-signed-in="true"]{background:#efe0ca;color:#2a1b14}
      .kindle-auth-overlay{position:fixed;inset:0;background:rgba(42,27,20,.58);z-index:99999;display:none;align-items:center;justify-content:center;padding:20px}
      .kindle-auth-overlay.open{display:flex}
      .kindle-auth-dialog{width:min(470px,100%);background:#fbf7ef;border:1px solid #2a1b14;box-shadow:10px 10px 0 rgba(42,27,20,.16);color:#2a1b14;position:relative;padding:28px}
      .kindle-auth-close{position:absolute;right:14px;top:12px;border:0;background:transparent;color:#2a1b14;font-size:26px;line-height:1;cursor:pointer}
      .kindle-auth-kicker{font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;letter-spacing:.18em;text-transform:uppercase;color:#8d4a2f;margin-bottom:9px}
      .kindle-auth-dialog h2{margin:0 34px 8px 0;font:700 28px/1.12 Georgia,serif;color:#20150f}
      .kindle-auth-dialog p{margin:0 0 18px;font:16px/1.45 Georgia,serif;color:#624635}
      .kindle-auth-tabs{display:grid;grid-template-columns:1fr 1fr;border:1px solid #bca995;margin-bottom:18px}
      .kindle-auth-tab{border:0;background:#f6ede0;padding:11px 8px;cursor:pointer;color:#2a1b14;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;letter-spacing:.1em;text-transform:uppercase}
      .kindle-auth-tab.active{background:#8d4a2f;color:white}
      .kindle-auth-field{margin-bottom:13px}
      .kindle-auth-field label{display:block;margin-bottom:6px;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;letter-spacing:.08em;text-transform:uppercase}
      .kindle-auth-field input{box-sizing:border-box;width:100%;border:1px solid #2a1b14;background:#fffdf8;color:#20150f;padding:13px 12px;font:16px/1.2 Georgia,serif;outline:none}
      .kindle-auth-field input:focus{box-shadow:0 0 0 2px rgba(141,74,47,.18)}
      .kindle-auth-forgot-wrap{display:flex;justify-content:flex-end;margin:-4px 0 14px}
      .kindle-auth-forgot{appearance:none;border:0;background:transparent;color:#8d4a2f;padding:2px 0;cursor:pointer;font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid transparent}
      .kindle-auth-forgot:hover{border-bottom-color:#8d4a2f}
      .kindle-auth-forgot:disabled{opacity:.55;cursor:wait}
      .kindle-auth-submit,.kindle-auth-logout{width:100%;border:1px solid #2a1b14;background:#8d4a2f;color:#fff;padding:13px 14px;cursor:pointer;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;letter-spacing:.12em;text-transform:uppercase}
      .kindle-auth-submit:hover,.kindle-auth-logout:hover{background:#6f3824}
      .kindle-auth-message{min-height:20px;margin-top:12px!important;font:14px/1.4 Georgia,serif!important;color:#8d4a2f!important}
      .kindle-auth-account{border:1px solid #c9b9a6;background:#f3e6d3;padding:16px;margin:15px 0 18px}
      .kindle-auth-account strong{display:block;font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px}
      .kindle-auth-email{word-break:break-word;font:17px/1.3 Georgia,serif}
      .kindle-auth-note{font-size:13px!important;color:#765947!important;margin-top:12px!important}
      @media(max-width:760px){.kindle-account-btn{padding:9px 10px;font-size:10px}.kindle-auth-dialog{padding:24px 19px}.kindle-auth-dialog h2{font-size:25px}}
    `;
    document.head.appendChild(style);
  }

  function injectUI() {
    injectStyles();
    const nav = document.querySelector('.site-header .nav, header .nav');
    if (nav && !document.getElementById('kindleAccountBtn')) {
      const button = document.createElement('button');
      button.id = 'kindleAccountBtn';
      button.className = 'kindle-account-btn';
      button.type = 'button';
      button.textContent = 'Sign In';
      button.addEventListener('click', () => openAuth(currentUser ? 'account' : 'signin'));
      nav.appendChild(button);
    }

    installMobileHeaderControls();

    if (!document.getElementById('kindleAuthOverlay')) {
      const wrap = document.createElement('div');
      wrap.id = 'kindleAuthOverlay';
      wrap.className = 'kindle-auth-overlay';
      wrap.innerHTML = `
        <div class="kindle-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="kindleAuthTitle">
          <button class="kindle-auth-close" id="kindleAuthClose" type="button" aria-label="Close">×</button>
          <div id="kindleAuthSignedOut">
            <div class="kindle-auth-kicker">Kindle Candle Maker Tools</div>
            <h2 id="kindleAuthTitle">Save your candle data</h2>
            <p id="kindleAuthIntro">Create a free account to keep your saved candles and fragrance blends available across devices.</p>
            <div class="kindle-auth-tabs">
              <button class="kindle-auth-tab active" type="button" data-auth-mode="signin">Sign In</button>
              <button class="kindle-auth-tab" type="button" data-auth-mode="signup">Create Account</button>
            </div>
            <form id="kindleAuthForm">
              <div class="kindle-auth-field"><label for="kindleAuthEmail">Email</label><input id="kindleAuthEmail" type="email" autocomplete="email" required></div>
              <div class="kindle-auth-field"><label for="kindleAuthPassword">Password</label><input id="kindleAuthPassword" type="password" autocomplete="current-password" minlength="6" required></div>
              <div class="kindle-auth-forgot-wrap" id="kindleForgotWrap"><button id="kindleForgotPassword" class="kindle-auth-forgot" type="button">Forgot Password?</button></div>
              <button id="kindleAuthSubmit" class="kindle-auth-submit" type="submit">Sign In</button>
              <p class="kindle-auth-message" id="kindleAuthMessage" aria-live="polite"></p>
              <p class="kindle-auth-note">You can use the calculators without an account. An account is only required to save candle and blend data.</p>
            </form>
          </div>
          <div id="kindleAuthSignedIn" hidden>
            <div class="kindle-auth-kicker">Your Account</div>
            <h2>Signed in</h2>
            <p>Your saved candle profiles and fragrance blends are synced to this account.</p>
            <div class="kindle-auth-account"><strong>Email</strong><div class="kindle-auth-email" id="kindleAuthAccountEmail"></div></div>
            <button id="kindleAuthLogout" class="kindle-auth-logout" type="button">Sign Out</button>
            <p class="kindle-auth-message" id="kindleAuthAccountMessage" aria-live="polite"></p>
          </div>
        </div>`;
      document.body.appendChild(wrap);

      wrap.addEventListener('click', event => { if (event.target === wrap) closeAuth(); });
      document.getElementById('kindleAuthClose').addEventListener('click', closeAuth);
      document.querySelectorAll('[data-auth-mode]').forEach(button => {
        button.addEventListener('click', () => setAuthMode(button.dataset.authMode));
      });
      document.getElementById('kindleAuthForm').addEventListener('submit', handleAuthSubmit);
      document.getElementById('kindleForgotPassword').addEventListener('click', handleForgotPassword);
      document.getElementById('kindleAuthLogout').addEventListener('click', signOut);
      document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAuth(); });
    }
    updateAuthUI();
  }

  function setAuthMode(mode) {
    const signup = mode === 'signup';
    document.querySelectorAll('[data-auth-mode]').forEach(btn => btn.classList.toggle('active', btn.dataset.authMode === mode));
    const form = document.getElementById('kindleAuthForm');
    if (form) form.dataset.mode = signup ? 'signup' : 'signin';
    const submit = document.getElementById('kindleAuthSubmit');
    const password = document.getElementById('kindleAuthPassword');
    if (submit) submit.textContent = signup ? 'Create Account' : 'Sign In';
    if (password) password.autocomplete = signup ? 'new-password' : 'current-password';
    const forgotWrap = document.getElementById('kindleForgotWrap');
    if (forgotWrap) forgotWrap.hidden = signup;
    const message = document.getElementById('kindleAuthMessage');
    if (message) message.textContent = '';
  }

  function updateAuthUI() {
    const btn = document.getElementById('kindleAccountBtn');
    if (btn) {
      btn.textContent = currentUser ? 'Account' : 'Sign In';
      btn.dataset.signedIn = currentUser ? 'true' : 'false';
    }
    const out = document.getElementById('kindleAuthSignedOut');
    const inside = document.getElementById('kindleAuthSignedIn');
    if (out) out.hidden = Boolean(currentUser);
    if (inside) inside.hidden = !currentUser;
    const email = document.getElementById('kindleAuthAccountEmail');
    if (email) email.textContent = currentUser?.email || '';
  }

  function openAuth(mode = 'signin', message = '') {
    injectUI();
    modalMessage = message || '';
    const overlay = document.getElementById('kindleAuthOverlay');
    if (!overlay) return;
    if (!configured) {
      const out = document.getElementById('kindleAuthSignedOut');
      const inside = document.getElementById('kindleAuthSignedIn');
      if (out) out.hidden = false;
      if (inside) inside.hidden = true;
      const intro = document.getElementById('kindleAuthIntro');
      if (intro) intro.textContent = 'Account saving is ready in the site files, but the Supabase project URL and publishable key still need to be added to /shared/supabase-config.js.';
      const form = document.getElementById('kindleAuthForm');
      if (form) form.style.display = 'none';
    } else {
      const form = document.getElementById('kindleAuthForm');
      if (form) form.style.display = '';
      const intro = document.getElementById('kindleAuthIntro');
      if (intro) intro.textContent = modalMessage || 'Create a free account to keep your saved candles and fragrance blends available across devices.';
      if (!currentUser) setAuthMode(mode === 'signup' ? 'signup' : 'signin');
      updateAuthUI();
    }
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (!currentUser && configured) document.getElementById('kindleAuthEmail')?.focus();
    }, 50);
  }

  function closeAuth() {
    document.getElementById('kindleAuthOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  async function handleForgotPassword() {
    if (!client) return;
    const emailInput = document.getElementById('kindleAuthEmail');
    const message = document.getElementById('kindleAuthMessage');
    const button = document.getElementById('kindleForgotPassword');
    const email = emailInput?.value.trim() || '';

    if (!email) {
      if (message) message.textContent = 'Enter your email address above, then click Forgot Password.';
      emailInput?.focus();
      return;
    }

    if (message) message.textContent = 'Sending reset email…';
    if (button) button.disabled = true;

    try {
      const redirectTo = `${window.location.origin}/reset-password/`;
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      if (message) message.textContent = 'Password reset email sent. Check your inbox and follow the link to choose a new password.';
    } catch (error) {
      if (message) message.textContent = error?.message || 'We could not send the reset email. Please try again.';
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (!client) return;
    const form = event.currentTarget;
    const mode = form.dataset.mode || 'signin';
    const email = document.getElementById('kindleAuthEmail').value.trim();
    const password = document.getElementById('kindleAuthPassword').value;
    const message = document.getElementById('kindleAuthMessage');
    const submit = document.getElementById('kindleAuthSubmit');
    message.textContent = mode === 'signup' ? 'Creating account…' : 'Signing in…';
    submit.disabled = true;

    try {
      if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.href.split('#')[0] }
        });
        if (error) throw error;
        if (!data.session) {
          message.textContent = 'Account created. Check your email to confirm your address, then sign in.';
          return;
        }
        message.textContent = 'Account created ✓';
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        message.textContent = 'Signed in ✓';
      }
      setTimeout(closeAuth, 550);
    } catch (error) {
      message.textContent = error?.message || 'Something went wrong. Please try again.';
    } finally {
      submit.disabled = false;
    }
  }

  async function signOut() {
    if (!client) return;
    const message = document.getElementById('kindleAuthAccountMessage');
    if (message) message.textContent = 'Signing out…';
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) {
      if (message) message.textContent = error.message;
      return;
    }
    closeAuth();
  }

  async function rawSaveItem(type, item) {
    if (!client || !currentUser) return { error: new Error('You must be signed in to save data.') };
    const clientId = String(item?.id || '');
    if (!clientId) return { error: new Error('Saved item is missing an ID.') };
    const name = String(item?.name || (type === 'blend' ? 'Untitled Blend' : 'Untitled Candle'));
    const row = {
      user_id: currentUser.id,
      item_type: type,
      client_id: clientId,
      name,
      data: { ...item, id: clientId, name },
      updated_at: new Date().toISOString()
    };
    return client.from('user_items').upsert(row, { onConflict: 'user_id,item_type,client_id' });
  }

  async function saveItem(type, item) {
    const result = await rawSaveItem(type, item);
    if (!result.error) dispatch('kindle-cloud-item-saved', { type, item });
    return result;
  }

  async function deleteItem(type, clientId) {
    if (!client || !currentUser) return { error: new Error('You must be signed in to delete saved data.') };
    const result = await client.from('user_items')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('item_type', type)
      .eq('client_id', String(clientId));
    if (!result.error) dispatch('kindle-cloud-item-deleted', { type, clientId });
    return result;
  }

  async function syncCaches() {
    if (!client || !currentUser) {
      clearActiveCaches();
      dispatch('kindle-cloud-data-ready', { user: null });
      return;
    }
    const { data, error } = await client.from('user_items')
      .select('item_type,client_id,name,data,updated_at')
      .eq('user_id', currentUser.id);
    if (error) {
      console.error('Kindle cloud sync failed:', error);
      dispatch('kindle-cloud-error', { error });
      return;
    }
    const recipes = [];
    const blends = [];
    (data || []).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).forEach(row => {
      const item = row.data && typeof row.data === 'object' ? { ...row.data } : {};
      item.id = String(row.client_id);
      item.name = row.name || item.name || '';
      if (row.item_type === 'candle') recipes.push(item);
      if (row.item_type === 'blend') blends.push(item);
    });
    saveArray(RECIPE_STORAGE_KEY, recipes);
    saveArray(BLEND_STORAGE_KEY, blends);
    dispatch('kindle-cloud-data-ready', { user: currentUser, recipes, blends });
  }

  async function migrateLegacy() {
    if (!currentUser) return;
    const recipes = safeParse(LEGACY_RECIPE_KEY);
    const blends = safeParse(LEGACY_BLEND_KEY);
    if (!recipes.length && !blends.length) return;

    for (const item of recipes) await rawSaveItem('candle', item);
    for (const item of blends) await rawSaveItem('blend', item);
    localStorage.removeItem(LEGACY_RECIPE_KEY);
    localStorage.removeItem(LEGACY_BLEND_KEY);
    dispatch('kindle-cloud-migrated', { recipes: recipes.length, blends: blends.length });
  }

  async function handleSession(session) {
    currentUser = session?.user || null;
    updateAuthUI();
    if (currentUser) {
      await migrateLegacy();
      await syncCaches();
    } else {
      clearActiveCaches();
      dispatch('kindle-cloud-data-ready', { user: null, recipes: [], blends: [] });
    }
    dispatch('kindle-auth-change', { user: currentUser });
  }

  async function requireUser(message = 'Create a free account to save this data.') {
    await ready;
    if (currentUser) return currentUser;
    openAuth('signup', message);
    return null;
  }

  async function init() {
    injectUI();
    captureLegacyData();

    if (!configured || !window.supabase?.createClient) {
      if (configured && !window.supabase?.createClient) console.error('Supabase JavaScript client did not load.');
      readyResolve();
      return;
    }

    client = window.supabase.createClient(config.url, config.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    const { data: { session } } = await client.auth.getSession();
    await handleSession(session);

    client.auth.onAuthStateChange((_event, newSession) => {
      setTimeout(() => handleSession(newSession), 0);
    });
    readyResolve();
  }

  window.KindleCloud = {
    ready,
    isConfigured: () => configured,
    get currentUser() { return currentUser; },
    get client() { return client; },
    openAuth,
    closeAuth,
    requireUser,
    saveItem,
    deleteItem,
    syncCaches,
    signOut
  };


  installMobileHeaderStyles();

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
