(() => {
  const accountsKey = window.RAWR_DEMO_ACCOUNTS_KEY;
  const iterations = 150000;
  const dashboardUrl = new URL('pages/dashboard/index.html', document.baseURI).href;
  const adminDashboardUrl = new URL('pages/admin/dashboard.html', document.baseURI).href;
  const loginUrl = new URL('pages/auth/login.html', document.baseURI).href;
  const bytesToHex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  const hexToBytes = value => new Uint8Array((value.match(/.{2}/g) || []).map(byte => parseInt(byte, 16)));

  function makeHex(length) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
  }

  async function hashPassword(password, saltHex, rounds) {
    if (!window.crypto?.subtle) {
      throw new Error(
        'Secure password hashing is unavailable. Open this demo through HTTPS or localhost.'
      );
    }

    const material = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const bits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: hexToBytes(saltHex),
        iterations: rounds,
        hash: 'SHA-256'
      },
      material,
      256
    );

    return bytesToHex(new Uint8Array(bits));
  }

  function setBusy(form, busy) {
    const button = form.querySelector('[type="submit"]');

    if (button) {
      button.disabled = busy;
      button.dataset.originalText ||= button.textContent;
      button.textContent = busy
        ? 'Please wait…'
        : button.dataset.originalText;
    }
  }

  function readAccountState(accountId) {
    try {
      return JSON.parse(
        localStorage.getItem(window.demoAccountStateKey(accountId)) || 'null'
      );
    } catch (_) {
      return null;
    }
  }

  function createAccountState(account) {
    const state = window.createDemoStateDefaults();

    state.accountId = account.id;
    state.currentUser = null;
    state.role = account.role || 'player';
    state.isLoggedIn = false;
    state.rememberMe = false;

    state.profile = {
      username: account.username,
      email: account.email,
      bio: '',
      kyc: 'Not submitted',
      referralCode: account.referralCode,
      createdAt: account.createdAt
    };

    return state;
  }

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (window.hasDemoAccountSession()) {
    location.replace(
      window.isDemoSuperadmin()
        ? adminDashboardUrl
        : dashboardUrl
    );
    return;
  }

  if (loginForm) {
    const params = new URLSearchParams(location.search);

    if (params.get('registered') === '1') {
      let registeredIdentifier = '';

      try {
        registeredIdentifier =
          sessionStorage.getItem('rawr_demo_registered_identifier') || '';

        sessionStorage.removeItem(
          'rawr_demo_registered_identifier'
        );
      } catch (_) {
        /* The login form remains usable if session storage is disabled. */
      }

      if (registeredIdentifier) {
        const usernameInput = document.getElementById('username');

        if (usernameInput) {
          usernameInput.value = registeredIdentifier;
        }
      }

      demoNotice(
        'Registration successful. Please log in to continue.',
        'success'
      );
    } else if (params.get('admin') === '1') {
      demoNotice(
        'Use the superadmin demo credentials below to open the admin console.',
        'info'
      );
    } else if (params.get('required') === '1') {
      demoNotice(
        'Log in with your demo account to open that page.',
        'info'
      );
    }

    loginForm.addEventListener('submit', async event => {
      event.preventDefault();

      const formData = new FormData(loginForm);
      const identifier = String(
        formData.get('username') || ''
      ).trim().toLowerCase();

      const password = String(
        formData.get('password') || ''
      );

      if (!identifier || !password) {
        return demoNotice(
          'Please enter your email or username and password.',
          'error'
        );
      }

      setBusy(loginForm, true);

      try {
        const accounts = window.getDemoAccounts();

        const account = accounts.find(
          item =>
            item.username.toLowerCase() === identifier ||
            item.email.toLowerCase() === identifier
        );

        if (!account) {
          return demoNotice(
            'Invalid email/username or password.',
            'error'
          );
        }

        if (account.role === 'superadmin') {
          if (
            password !==
            window.RAWR_DEMO_SUPERADMIN.password
          ) {
            return demoNotice(
              'Invalid email/username or password.',
              'error'
            );
          }
        } else {
          const candidate = await hashPassword(
            password,
            account.passwordSalt,
            account.passwordIterations || iterations
          );

          if (candidate !== account.passwordHash) {
            return demoNotice(
              'Invalid email/username or password.',
              'error'
            );
          }
        }

        const accountState =
          readAccountState(account.id) ||
          createAccountState(account);

        Object.assign(
          DemoState,
          window.createDemoStateDefaults(),
          accountState,
          {
            accountId: account.id,
            currentUser: account.username,
            role: account.role || 'player',
            isLoggedIn: true,
            rememberMe: Boolean(
              document.getElementById('remember')?.checked
            ),
            profile: Object.assign(
              {},
              accountState.profile || {},
              {
                username: account.username,
                email: account.email,
                referralCode: account.referralCode,
                createdAt: account.createdAt
              }
            )
          }
        );

        if (!saveDemoState()) {
          DemoState.isLoggedIn = false;
          DemoState.currentUser = null;
          DemoState.rememberMe = false;

          return demoNotice(
            'Browser storage is unavailable. Allow local storage to use this demo account.',
            'error'
          );
        }

        demoNotice(
          'Welcome to the jungle!',
          'success'
        );

        setTimeout(() => {
          location.assign(
            account.role === 'superadmin'
              ? adminDashboardUrl
              : dashboardUrl
          );
        }, 450);
      } catch (error) {
        demoNotice(
          error.message ||
            'Unable to log in with browser storage.',
          'error'
        );
      } finally {
        setBusy(loginForm, false);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async event => {
      event.preventDefault();

      const formData = new FormData(registerForm);

      const username = String(
        formData.get('username') || ''
      ).trim();

      const email = String(
        formData.get('email') || ''
      ).trim().toLowerCase();

      const password = String(
        formData.get('password') || ''
      );

      const confirmation = String(
        formData.get('confirm_password') || ''
      );

      const referralCode = String(
        formData.get('referral_code') || ''
      )
        .trim()
        .toUpperCase();

      if (username.length < 4) {
        return demoNotice(
          'Username must be at least 4 characters.',
          'error'
        );
      }

      if (
        !registerForm.elements.email.validity.valid
      ) {
        return demoNotice(
          'Enter a valid email address.',
          'error'
        );
      }

      if (
        !/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(
          password
        )
      ) {
        return demoNotice(
          'Password needs 8+ characters, uppercase, lowercase, and a number.',
          'error'
        );
      }

      if (password !== confirmation) {
        return demoNotice(
          'Passwords do not match.',
          'error'
        );
      }

      if (!formData.has('terms')) {
        return demoNotice(
          'Please accept the terms and privacy policy.',
          'error'
        );
      }

      setBusy(registerForm, true);

      try {
        const accounts = window.getDemoAccounts();

        if (
          accounts.some(
            account =>
              account.username.toLowerCase() ===
                username.toLowerCase() ||
              account.email.toLowerCase() === email
          )
        ) {
          return demoNotice(
            'That username or email is already registered in this browser.',
            'error'
          );
        }

        let referredBy = null;

        if (referralCode) {
          const referrer = accounts.find(
            account =>
              account.referralCode.toUpperCase() ===
              referralCode
          );

          if (!referrer) {
            return demoNotice(
              'That referral code does not match a local demo account.',
              'error'
            );
          }

          referredBy = referrer.id;
        }

        const account = {
          id: makeHex(16),
          username,
          email,
          passwordSalt: makeHex(16),
          passwordIterations: iterations,
          passwordHash: '',
          referralCode: `RAWR-${makeHex(4).toUpperCase()}`,
          referredBy,
          role: 'player',
          createdAt: new Date().toISOString()
        };

        account.passwordHash =
          await hashPassword(
            password,
            account.passwordSalt,
            account.passwordIterations
          );

        const nextAccounts = [
          ...accounts,
          account
        ];

        localStorage.setItem(
          accountsKey,
          JSON.stringify(nextAccounts)
        );

        localStorage.setItem(
          window.demoAccountStateKey(account.id),
          JSON.stringify(
            createAccountState(account)
          )
        );

        try {
          sessionStorage.setItem(
            'rawr_demo_registered_identifier',
            username
          );
        } catch (_) {
          /* Optional convenience only. */
        }

        demoNotice(
          'Account created. Taking you to login…',
          'success'
        );

        setTimeout(() => {
          location.assign(
            `${loginUrl}?registered=1`
          );
        }, 450);
      } catch (error) {
        demoNotice(
          error.message ||
            'Could not save this account in browser storage.',
          'error'
        );
      } finally {
        setBusy(registerForm, false);
      }
    });
  }

  document
    .querySelectorAll('[data-toggle-password]')
    .forEach(button => {
      button.addEventListener('click', () => {
        const input = document.getElementById(
          button.dataset.togglePassword
        );

        if (!input) return;

        const isHidden =
          input.type === 'password';

        input.type = isHidden
          ? 'text'
          : 'password';

        button.setAttribute(
          'aria-label',
          isHidden
            ? 'Hide password'
            : 'Show password'
        );

        const icon =
          button.querySelector('i');

        if (icon) {
          icon.classList.toggle(
            'fa-eye',
            !isHidden
          );

          icon.classList.toggle(
            'fa-eye-slash',
            isHidden
          );
        }
      });
    });

  document
    .querySelector('[data-forgot-password]')
    ?.addEventListener('click', event => {
      event.preventDefault();

      demoNotice(
        'Password reset is not available in this browser-only demo.',
        'info'
      );
    });
})();
