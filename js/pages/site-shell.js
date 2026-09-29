(function () {
  const root =
    document.querySelector('base')?.href ||
    new URL('../../', location.href).href;

  const page =
    document.body.dataset.page || '';

  const href = route =>
    `${root}${route}`;

  const escapeHtml = value =>
    String(value ?? '').replace(
      /[&<>"']/g,
      char =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        })[char]
    );

  const header =
    document.getElementById('app-header');

  const sidebar =
    document.getElementById('app-sidebar');

  const playerPages = [
    'dashboard',
    'mining',
    'games',
    'wallet',
    'leaderboard',
    'rewards',
    'profile'
  ];

  const isProtectedPage =
    page.startsWith('game-') ||
    playerPages.includes(page);

  const isAdminPage =
    page.startsWith('admin-');

  const hasDemoSession =
    window.hasDemoAccountSession();

  if (
    isAdminPage &&
    !window.isDemoSuperadmin()
  ) {
    location.replace(
      `${href(
        'pages/auth/login.html'
      )}?admin=1`
    );
    return;
  }

  if (
    isProtectedPage &&
    !hasDemoSession
  ) {
    location.replace(
      href(
        'pages/auth/login.html?required=1'
      )
    );
    return;
  }

  if (
    isProtectedPage &&
    window.isDemoSuperadmin()
  ) {
    location.replace(
      href(
        'pages/admin/dashboard.html'
      )
    );
    return;
  }

  if (
    (page === 'login' ||
      page === 'register') &&
    hasDemoSession
  ) {
    location.replace(
      href(
        window.isDemoSuperadmin()
          ? 'pages/admin/dashboard.html'
          : 'pages/dashboard/index.html'
      )
    );
    return;
  }

  if (page.startsWith('game-')) {
    document.body.classList.add(
      'game-standalone-page'
    );

    if (header) {
      header.hidden = true;
    }

    if (sidebar) {
      sidebar.hidden = true;
    }

    const main =
      document.querySelector(
        '.standalone-game'
      );

    if (main) {
      main.classList.add('game-wrapper');

      const close =
        document.createElement('a');

      close.className = 'close-btn';

      close.href =
        href(
          'pages/games/index.html'
        );

      close.setAttribute(
        'aria-label',
        'Return to game lobby'
      );

      close.textContent = '×';

      main.prepend(close);
    }
  } else if (page.startsWith('admin-')) {
    const links = [
      [
        'admin-dashboard',
        'Dashboard',
        'pages/admin/dashboard.html',
        'fa-home'
      ],
      [
        'admin-users',
        'Users',
        'pages/admin/manage-users.html',
        'fa-users'
      ],
      [
        'admin-kyc',
        'KYC Requests',
        'pages/admin/kyc-requests.html',
        'fa-id-card'
      ]
    ];

    if (header) {
      header.innerHTML = `
        <header class="app-topbar">
          <button
            class="mobile-menu"
            id="mobile-menu"
            aria-label="Open navigation"
          >
            ☰
          </button>

          <a
            class="app-brand"
            href="${href('index.html')}"
          >
            <img
              src="${href('assets/logo.png')}"
              alt=""
            >
            RAWR
          </a>

          <span class="topbar-user">
            Admin demo
          </span>
        </header>
      `;
    }

    if (sidebar) {
      sidebar.innerHTML = `
        <nav
          class="app-sidebar"
          aria-label="Admin navigation"
        >
          ${links
            .map(
              ([
                key,
                label,
                path,
                icon
              ]) => `
                <a
                  class="sidebar-item ${
                    page === key
                      ? 'active'
                      : ''
                  }"
                  href="${href(path)}"
                >
                  <i
                    class="fas ${icon}"
                    aria-hidden="true"
                  ></i>

                  <span>
                    ${label}
                  </span>
                </a>
              `
            )
            .join('')}

          <a
            class="sidebar-item"
            href="${href('index.html')}"
            data-demo-logout
          >
            <i
              class="fas fa-sign-out-alt"
              aria-hidden="true"
            ></i>

            <span>
              Logout
            </span>
          </a>
        </nav>
      `;
    }

    document
      .getElementById('mobile-menu')
      ?.addEventListener(
        'click',
        () =>
          sidebar?.classList.toggle(
            'open'
          )
      );
  } else {
    const links = [
      [
        'dashboard',
        'Dashboard',
        'pages/dashboard/index.html',
        'fa-home'
      ],
      [
        'mining',
        'Mining',
        'pages/mining/index.html',
        'fa-digging'
      ],
      [
        'games',
        page === 'mining'
          ? 'Lobby'
          : 'Casino',
        'pages/games/index.html',
        'fa-dice'
      ],
      [
        'wallet',
        'Wallet',
        'pages/wallet/index.html',
        'fa-wallet'
      ],
      [
        'leaderboard',
        'Leaderboard',
        'pages/leaderboard/index.html',
        'fa-trophy'
      ],
      [
        'rewards',
        'Daily Rewards',
        'pages/rewards/index.html',
        'fa-gift'
      ],
      [
        'profile',
        'Profile',
        'pages/profile/index.html',
        'fa-user'
      ]
    ];

    if (header) {
      const logoMarkup = `
        <span class="coin-logo has-image">
          <img
            src="${href('assets/logo.png')}"
            alt="RAWR Logo"
          >
        </span>
      `;

      header.innerHTML = `
        <nav class="top-nav">
          <a
            class="logo"
            href="${href(
              'pages/dashboard/index.html'
            )}"
          >
            ${logoMarkup}

            <span>
              RAWR
            </span>
          </a>

          <div class="nav-actions">
            <div class="wallet-balance">

              <div class="balance-item">
                <i
                  class="fas fa-coins balance-icon"
                  aria-hidden="true"
                ></i>

                <span class="balance-label">
                  RAWR:
                </span>

                <span
                  class="balance-value"
                  id="header-rawr"
                >
                  ${formatDemoNumber(
                    DemoState.rawrBalance
                  )}
                </span>
              </div>

              <div class="balance-item">
                <i
                  class="fas fa-ticket-alt balance-icon"
                  aria-hidden="true"
                ></i>

                <span class="balance-label">
                  Tickets:
                </span>

                <span
                  class="balance-value"
                  id="header-tickets"
                >
                  ${formatDemoNumber(
                    DemoState.ticketBalance
                  )}
                </span>
              </div>

            </div>

            <button
              class="menu-toggle"
              id="menuToggle"
              aria-label="Open navigation"
              aria-expanded="false"
            >
              <i
                class="fas fa-bars"
                aria-hidden="true"
              ></i>

              <i
                class="fas fa-xmark"
                aria-hidden="true"
              ></i>
            </button>
          </div>
        </nav>
      `;
    }

    if (sidebar) {
      sidebar.className = 'sidebar';

      sidebar.setAttribute(
        'aria-label',
        'Player navigation'
      );

      sidebar.innerHTML = `
        ${links
          .map(
            ([
              key,
              label,
              path,
              icon
            ]) => `
              <a
                class="sidebar-item ${
                  page === key ||
                  (
                    key === 'games' &&
                    page.startsWith(
                      'game-'
                    )
                  )
                    ? 'active'
                    : ''
                }"
                href="${href(path)}"
              >
                <i
                  class="fas ${icon}"
                  aria-hidden="true"
                ></i>

                <span>
                  ${label}
                </span>
              </a>
            `
          )
          .join('')}

        <a
          class="sidebar-item"
          href="${href(
            'pages/auth/login.html'
          )}"
          data-demo-logout
        >
          <i
            class="fas fa-sign-out-alt"
            aria-hidden="true"
          ></i>

          <span>
            Logout
          </span>
        </a>
      `;
    }

    document
      .getElementById('menuToggle')
      ?.addEventListener(
        'click',
        event => {
          const button =
            event.currentTarget;

          const isOpen =
            sidebar?.classList.toggle(
              'active'
            ) ?? false;

          button.classList.toggle(
            'active',
            isOpen
          );

          button.setAttribute(
            'aria-expanded',
            String(isOpen)
          );
        }
      );
  }

  if (
    [
      'dashboard',
      'mining',
      'games',
      'wallet',
      'leaderboard',
      'rewards',
      'profile'
    ].includes(page)
  ) {
    const footer =
      document.createElement(
        'footer'
      );

    footer.innerHTML = `
      <div class="footer-content">

        <div class="footer-column">
          <h3>
            RAWR Casino
          </h3>

          <p>
            The ultimate play-to-earn experience
            in the jungle. Play, win, and earn
            your way to the top!
          </p>

          <div class="social-links">
            <a
              href="#"
              aria-label="Twitter"
            >
              <i class="fab fa-twitter"></i>
            </a>

            <a
              href="#"
              aria-label="Discord"
            >
              <i class="fab fa-discord"></i>
            </a>

            <a
              href="#"
              aria-label="Telegram"
            >
              <i class="fab fa-telegram"></i>
            </a>

            <a
              href="#"
              aria-label="Reddit"
            >
              <i class="fab fa-reddit"></i>
            </a>
          </div>
        </div>

        <div class="footer-column">
          <h3>
            Quick Links
          </h3>

          <ul class="footer-links">
            <li>
              <a
                href="${href(
                  'pages/dashboard/index.html'
                )}"
              >
                Home
              </a>
            </li>

            <li>
              <a
                href="${href(
                  'pages/mining/index.html'
                )}"
              >
                Mining
              </a>
            </li>

            <li>
              <a
                href="${href(
                  'pages/games/index.html'
                )}"
              >
                Casino
              </a>
            </li>

            <li>
              <a
                href="${href(
                  'pages/leaderboard/index.html'
                )}"
              >
                Leaderboard
              </a>
            </li>

            <li>
              <a
                href="${href(
                  'pages/wallet/index.html'
                )}"
              >
                Wallet
              </a>
            </li>
          </ul>
        </div>

        <div class="footer-column">
          <h3>
            Resources
          </h3>

          <ul class="footer-links">
            <li>
              <a href="#">
                FAQs
              </a>
            </li>

            <li>
              <a href="#">
                Tutorials
              </a>
            </li>

            <li>
              <a href="#">
                Whitepaper
              </a>
            </li>

            <li>
              <a href="#">
                Tokenomics
              </a>
            </li>

            <li>
              <a href="#">
                Support
              </a>
            </li>
          </ul>
        </div>

        <div class="footer-column">
          <h3>
            Legal
          </h3>

          <ul class="footer-links">
            <li>
              <a href="#">
                Terms of Service
              </a>
            </li>

            <li>
              <a href="#">
                Privacy Policy
              </a>
            </li>

            <li>
              <a href="#">
                Disclaimer
              </a>
            </li>

            <li>
              <a href="#">
                AML Policy
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div class="copyright">
        &copy; 2023 RAWR Casino. All rights reserved.
        The jungle is yours to conquer!
      </div>
    `;

    const notice =
      document.getElementById(
        'demo-notice'
      );

    if (notice) {
      document.body.insertBefore(
        footer,
        notice
      );
    } else {
      document.body.append(footer);
    }
  }

  document
    .querySelector(
      '[data-demo-logout]'
    )
    ?.addEventListener(
      'click',
      event => {
        event.preventDefault();

        DemoState.isLoggedIn =
          false;

        DemoState.currentUser =
          null;

        DemoState.rememberMe =
          false;

        saveDemoState();

        location.href =
          href('index.html');
      }
    );

  document
    .querySelectorAll(
      '[data-demo-login-link]'
    )
    .forEach(
      a =>
        (a.href =
          href(
            'pages/auth/login.html'
          ))
    );

  document
    .querySelectorAll(
      '[data-demo-register-link]'
    )
    .forEach(
      a =>
        (a.href =
          href(
            'pages/auth/register.html'
          ))
    );

  window.refreshDemoBalances =
    () => {
      [
        [
          'header-rawr',
          DemoState.rawrBalance
        ],
        [
          'wallet-rawr',
          DemoState.rawrBalance
        ],
        [
          'header-tickets',
          DemoState.ticketBalance
        ],
        [
          'wallet-tickets',
          DemoState.ticketBalance
        ],
        [
          'game-ticket-balance',
          DemoState.ticketBalance
        ],
        [
          'game-lobby-tickets',
          DemoState.ticketBalance
        ]
      ].forEach(
        ([id, value]) => {
          const element =
            document.getElementById(
              id
            );

          if (element) {
            element.textContent =
              formatDemoNumber(
                value
              );
          }
        }
      );
    };
})();
