/**
 * Kabadiwala Connect — Dealer Ledger View
 * CRITICAL RULE: Pending lots MUST NOT count as earned income.
 */

import { apiClient } from '../api.js';
import { getAllLocalPurchases, getLocalLots } from '../db.js';
import { formatCurrency, formatWeight, formatDate } from '../utils.js';

export async function renderLedgerView(container, navigateTo) {
  container.innerHTML = `
    <div class="view-loading-spinner">
      <div class="spinner"></div>
      <p>Loading Dealer Ledger...</p>
    </div>
  `;

  let totalSpent = 0;
  let totalConfirmedSales = 0;
  let totalPendingLotWeight = 0;
  let transactions = [];
  let pendingLots = [];
  let purchases = [];

  try {
    const [ledgerData, localPurchases, localLots] = await Promise.all([
      apiClient.getDealerLedger().catch(() => null),
      getAllLocalPurchases().catch(() => []),
      getLocalLots().catch(() => [])
    ]);

    if (ledgerData) {
      totalSpent = ledgerData.total_spent_on_purchases || 0;
      totalConfirmedSales = ledgerData.total_confirmed_sales || 0;
      totalPendingLotWeight = ledgerData.total_pending_lot_weight || 0;
      transactions = ledgerData.transactions || [];
      pendingLots = ledgerData.pending_lots || [];
      purchases = ledgerData.purchases || [];
    } else {
      // Local fallback calculation
      purchases = localPurchases;
      totalSpent = purchases.reduce((acc, p) => acc + Number(p.price || 0), 0);
      pendingLots = localLots.filter(l => l.status !== 'COMPLETED');
      totalPendingLotWeight = pendingLots.reduce((acc, l) => acc + Number(l.declared_weight || 0), 0);
    }
  } catch (err) {
    console.warn('Error loading ledger:', err);
  }

  let activeTab = 'summary';

  function renderLedgerContent() {
    container.innerHTML = `
      <div class="view-transition">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md);">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">Dealer Ledger</h2>
            <p style="font-size: 0.8rem; color: var(--text-secondary);">Authoritative audit & financial stream</p>
          </div>
          <button class="btn btn-sm btn-outline" id="backHomeBtn">✕ Close</button>
        </div>

        <!-- Strict Accounting Alert Banner -->
        <div class="ledger-warning-box">
          <span style="font-size: 1.2rem;">⚠️</span>
          <div>
            <strong>Business Accounting Rule:</strong> Pending lots in transit do <em>not</em> count as confirmed earnings. Only lots verified and confirmed by recyclers appear in Confirmed Sales.
          </div>
        </div>

        <!-- High-Level Financial Metrics Grid -->
        <div class="stats-grid">
          <div class="stat-box" style="border-left: 3px solid #10b981;">
            <span class="stat-label">Confirmed Earnings</span>
            <span class="stat-val" style="color: #34d399;">${formatCurrency(totalConfirmedSales)}</span>
            <span class="stat-sub">${transactions.length} verified handovers</span>
          </div>

          <div class="stat-box" style="border-left: 3px solid #f87171;">
            <span class="stat-label">Total Scrap Spent</span>
            <span class="stat-val" style="color: #f87171;">${formatCurrency(totalSpent)}</span>
            <span class="stat-sub">${purchases.length} recorded purchases</span>
          </div>
        </div>

        <!-- Pending Lots Valuation Alert -->
        ${pendingLots.length > 0 ? `
          <div class="card" style="background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.3); padding: 12px 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.75rem; font-weight: 700; color: #fbbf24; text-transform: uppercase;">Active Lots Pending Confirmation</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">
                  ${pendingLots.length} lot(s) • ${formatWeight(totalPendingLotWeight)}
                </div>
              </div>
              <span class="badge badge-warning">Awaiting Recycler</span>
            </div>
          </div>
        ` : ''}

        <!-- Filter Tabs -->
        <div class="ledger-tabs">
          <button class="ledger-tab-btn ${activeTab === 'summary' ? 'active' : ''}" data-tab="summary">All Streams</button>
          <button class="ledger-tab-btn ${activeTab === 'sales' ? 'active' : ''}" data-tab="sales">Sales (${transactions.length})</button>
          <button class="ledger-tab-btn ${activeTab === 'pending' ? 'active' : ''}" data-tab="pending">Pending (${pendingLots.length})</button>
          <button class="ledger-tab-btn ${activeTab === 'purchases' ? 'active' : ''}" data-tab="purchases">Purchases (${purchases.length})</button>
        </div>

        <!-- Transactions Stream List -->
        <div id="ledgerStreamContainer">
          ${renderTabContent()}
        </div>
      </div>
    `;

    container.querySelector('#backHomeBtn')?.addEventListener('click', () => navigateTo('dealer-home'));

    container.querySelectorAll('.ledger-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-tab');
        renderLedgerContent();
      });
    });
  }

  function renderTabContent() {
    if (activeTab === 'sales') {
      if (transactions.length === 0) return emptyMessage('No confirmed sales yet.');
      return transactions.map(t => renderTransactionCard(t)).join('');
    }

    if (activeTab === 'pending') {
      if (pendingLots.length === 0) return emptyMessage('No pending lots in transit.');
      return pendingLots.map(l => renderPendingLotCard(l)).join('');
    }

    if (activeTab === 'purchases') {
      if (purchases.length === 0) return emptyMessage('No purchase records found.');
      return purchases.map(p => renderPurchaseCard(p)).join('');
    }

    // Default 'summary' tab: Mix of latest items
    return `
      ${pendingLots.map(l => renderPendingLotCard(l)).join('')}
      ${transactions.map(t => renderTransactionCard(t)).join('')}
      ${purchases.map(p => renderPurchaseCard(p)).join('')}
    `;
  }

  function emptyMessage(text) {
    return `
      <div style="text-align: center; padding: var(--space-xl) var(--space-md); color: var(--text-muted);">
        <p>${text}</p>
      </div>
    `;
  }

  function renderTransactionCard(t) {
    return `
      <div class="tx-item-card" style="border-left: 3px solid #10b981;">
        <div class="tx-item-header">
          <div>
            <span class="badge badge-success">Confirmed Sale</span>
            <span style="font-weight: 700; font-size: 0.92rem; margin-left: 6px; color: var(--text-main);">${t.category}</span>
          </div>
          <span class="tx-amount positive">+${formatCurrency(t.total_payout)}</span>
        </div>
        <div class="tx-item-details">
          <span>Recycler: ${t.recycler_name || 'Verified Recycler'}</span>
          <span>Verified: <strong>${formatWeight(t.verified_weight)}</strong></span>
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; justify-content: space-between;">
          <span>Declared: ${formatWeight(t.declared_weight)} (Discrepancy: ${t.discrepancy_percentage || 0}%)</span>
          <span>${formatDate(t.timestamp)}</span>
        </div>
      </div>
    `;
  }

  function renderPendingLotCard(l) {
    return `
      <div class="tx-item-card" style="border-left: 3px solid #f59e0b;">
        <div class="tx-item-header">
          <div>
            <span class="badge badge-warning">${l.status}</span>
            <span style="font-weight: 700; font-size: 0.92rem; margin-left: 6px; color: var(--text-main);">${l.category}</span>
          </div>
          <span style="font-size: 0.8rem; color: #fbbf24; font-weight: 700;">In Transit</span>
        </div>
        <div class="tx-item-details">
          <span>Lot ID: ${l.lot_id.substring(0, 12)}...</span>
          <span>Declared: <strong>${formatWeight(l.declared_weight)}</strong></span>
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; justify-content: space-between;">
          <span>Recycler: ${l.recycler_name || 'Assigned Recycler'}</span>
          <span>${formatDate(l.created_at)}</span>
        </div>
      </div>
    `;
  }

  function renderPurchaseCard(p) {
    return `
      <div class="tx-item-card" style="border-left: 3px solid #f87171;">
        <div class="tx-item-header">
          <div>
            <span class="badge ${p.sync_status === 'SYNCED' ? 'badge-info' : 'badge-warning'}">${p.sync_status || 'LOCAL'}</span>
            <span style="font-weight: 700; font-size: 0.92rem; margin-left: 6px; color: var(--text-main);">${p.category}</span>
          </div>
          <span class="tx-amount negative">-${formatCurrency(p.price)}</span>
        </div>
        <div class="tx-item-details">
          <span>Weight: <strong>${formatWeight(p.weight)}</strong> @ ₹${p.unit_price || (p.price / p.weight).toFixed(1)}/kg</span>
          <span>${p.collector_reference || 'Walk-in'}</span>
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); text-align: right;">
          ${formatDate(p.created_at)}
        </div>
      </div>
    `;
  }

  renderLedgerContent();
}
