/**
 * Kabadiwala Connect — Main Mobile Application Router & Controller
 */

import { openDatabase } from './db.js';
import { apiClient } from './api.js';
import { syncManager } from './sync.js';
import { showToast } from './utils.js';

// Views
import { renderLoginView } from './views/login.js';
import { renderDealerHomeView } from './views/dealer-home.js';
import { renderLogPurchaseView } from './views/log-purchase.js';
import { renderMyStockView } from './views/my-stock.js';
import { renderCreateLotView } from './views/create-lot.js';
import { renderFindRecyclerView } from './views/find-recycler.js';
import { renderQrHandoverView } from './views/qr-handover.js';
import { renderLedgerView } from './views/ledger.js';
import { renderCollectorLiteView } from './views/collector-lite.js';

class MobileApp {
  constructor() {
    this.currentView = 'login';
    this.appMode = 'dealer'; // 'dealer' | 'collector'
    this.contentEl = document.getElementById('appContent');
    this.roleBadge = document.getElementById('appRoleBadge');
    this.roleSwitchBtn = document.getElementById('roleSwitchBtn');
    this.networkBadge = document.getElementById('networkBadge');
    this.syncBannerBtn = document.getElementById('syncNowBannerBtn');
    this.dealerNav = document.getElementById('appBottomNav');
    this.collectorNav = document.getElementById('collectorBottomNav');
  }

  async init() {
    try {
      // 1. Initialize local IndexedDB
      await openDatabase();

      // 2. Initialize sync manager & network listeners
      syncManager.handleNetworkChange();
      await syncManager.checkPendingCount();

      // 3. Bind global event listeners
      this.bindEvents();

      // 4. Determine initial view based on auth token
      const token = apiClient.getToken();
      if (token) {
        this.navigateTo('dealer-home');
      } else {
        this.navigateTo('login');
      }
    } catch (err) {
      console.error('App init failed:', err);
      showToast('App initialized with local storage', 'info');
      this.navigateTo('login');
    }
  }

  bindEvents() {
    // Mode switcher button in topbar
    this.roleSwitchBtn?.addEventListener('click', () => {
      this.toggleAppMode();
    });

    // Network status badge toggle (simulated offline demo)
    this.networkBadge?.addEventListener('click', () => {
      const isOnline = syncManager.toggleSimulatedOffline();
      showToast(isOnline ? 'Simulated Online Mode' : 'Simulated Airplane / Offline Mode', isOnline ? 'success' : 'info');
    });

    // Sync now from banner
    this.syncBannerBtn?.addEventListener('click', () => {
      syncManager.syncNow(true);
    });

    // Dealer Bottom Navigation tabs
    this.dealerNav?.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        this.navigateTo(view);
      });
    });

    // Collector Bottom Navigation tabs
    this.collectorNav?.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        const action = item.getAttribute('data-action');
        if (action === 'switch-dealer') {
          this.setAppMode('dealer');
        } else if (view) {
          this.navigateTo(view);
        }
      });
    });

    // Global helper exposed to window for cross-view navigation
    window.setAppMode = (mode) => this.setAppMode(mode);
  }

  setAppMode(mode) {
    this.appMode = mode;
    if (mode === 'collector') {
      this.roleBadge.textContent = 'Collector Lite';
      this.roleBadge.style.background = 'rgba(14, 165, 233, 0.15)';
      this.roleBadge.style.color = '#38bdf8';
      this.roleBadge.style.borderColor = 'rgba(56, 189, 248, 0.3)';
      this.dealerNav.style.display = 'none';
      this.collectorNav.style.display = 'flex';
      this.navigateTo('collector-lite');
    } else {
      this.roleBadge.textContent = 'Dealer';
      this.roleBadge.style.background = 'rgba(16, 185, 129, 0.15)';
      this.roleBadge.style.color = '#34d399';
      this.roleBadge.style.borderColor = 'rgba(52, 211, 153, 0.3)';
      this.collectorNav.style.display = 'none';
      this.dealerNav.style.display = 'flex';
      this.navigateTo('dealer-home');
    }
  }

  toggleAppMode() {
    this.setAppMode(this.appMode === 'dealer' ? 'collector' : 'dealer');
  }

  updateNavActiveState(viewName) {
    const nav = this.appMode === 'collector' ? this.collectorNav : this.dealerNav;
    nav?.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Hide bottom nav on login view
    if (viewName === 'login') {
      this.dealerNav.style.display = 'none';
      this.collectorNav.style.display = 'none';
    } else {
      if (this.appMode === 'collector') {
        this.collectorNav.style.display = 'flex';
        this.dealerNav.style.display = 'none';
      } else {
        this.dealerNav.style.display = 'flex';
        this.collectorNav.style.display = 'none';
      }
    }
  }

  async navigateTo(viewName) {
    this.currentView = viewName;
    this.updateNavActiveState(viewName);

    // Scroll to top
    this.contentEl.scrollTop = 0;

    const navigate = (v) => this.navigateTo(v);

    switch (viewName) {
      case 'login':
        renderLoginView(this.contentEl, navigate);
        break;
      case 'dealer-home':
        await renderDealerHomeView(this.contentEl, navigate);
        break;
      case 'log-purchase':
        renderLogPurchaseView(this.contentEl, navigate);
        break;
      case 'my-stock':
        await renderMyStockView(this.contentEl, navigate);
        break;
      case 'create-lot':
        await renderCreateLotView(this.contentEl, navigate);
        break;
      case 'find-recycler':
        await renderFindRecyclerView(this.contentEl, navigate);
        break;
      case 'qr-handover':
        await renderQrHandoverView(this.contentEl, navigate);
        break;
      case 'ledger':
        await renderLedgerView(this.contentEl, navigate);
        break;
      case 'collector-lite':
      case 'collector-info':
        renderCollectorLiteView(this.contentEl, navigate);
        break;
      default:
        await renderDealerHomeView(this.contentEl, navigate);
        break;
    }
  }
}

// Initialize Application on DOM Ready
const app = new MobileApp();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
