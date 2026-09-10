/**
 * Kabadiwala Connect — QR Handover View
 * STRICT RULE: QR code encodes ONLY the Lot UUID string.
 */

import { renderLotQrCode, getManualFallbackCode } from '../qr-helper.js';
import { formatWeight, formatDate, showToast } from '../utils.js';
import { apiClient } from '../api.js';

export async function renderQrHandoverView(container, navigateTo) {
  const lot = window.activeLot || {
    lot_id: '8c0f1234-5678-4abc-9def-0123456789ab',
    category: 'PCB',
    declared_weight: 30.0,
    recycler_name: 'GreenCycle Recycling Corp',
    status: 'PENDING_HANDOVER',
    created_at: new Date().toISOString()
  };

  const manualCode = getManualFallbackCode(lot.lot_id);

  container.innerHTML = `
    <div class="view-transition">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md);">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">QR Handover</h2>
          <p style="font-size: 0.8rem; color: var(--text-secondary);">Present QR to recycler for digital verification</p>
        </div>
        <button class="btn btn-sm btn-outline" id="backHomeBtn">✕ Done</button>
      </div>

      <!-- Live Handover Status Pill -->
      <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); margin-bottom: var(--space-md);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="network-dot" style="background-color: ${lot.status === 'COMPLETED' ? '#10b981' : '#f59e0b'};"></span>
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">
            Status: <span id="lotStatusLabel" style="color: ${lot.status === 'COMPLETED' ? '#34d399' : '#fbbf24'};">${lot.status}</span>
          </span>
        </div>
        <button class="btn btn-sm btn-outline" id="refreshStatusBtn" style="padding: 4px 8px; font-size: 0.72rem;">
          🔄 Refresh
        </button>
      </div>

      <!-- Pure Lot UUID QR Card -->
      <div class="qr-container-card">
        <div style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
          Digital Traceability Lot QR
        </div>

        <div class="qr-canvas-wrapper">
          <canvas id="lotQrCanvas"></canvas>
        </div>

        <!-- Strict Contract Notice -->
        <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 6px;">
          🔒 Encodes <strong>Lot UUID ONLY</strong> (No sensitive metadata embedded)
        </div>

        <div class="qr-uuid-display">
          UUID: ${lot.lot_id}
        </div>

        <!-- Fallback Code -->
        <div class="qr-fallback-box">
          <div class="qr-fallback-label">Manual Verification Code</div>
          <div class="qr-fallback-code">${manualCode}</div>
        </div>
      </div>

      <!-- Lot Authoritative Metadata Breakdown -->
      <div class="card" style="margin-top: var(--space-md);">
        <div class="card-header">
          <span class="card-title" style="font-size: 0.92rem;">Lot Specification</span>
          <span class="badge badge-info">${lot.category}</span>
        </div>

        <div class="material-fact-row">
          <span class="material-fact-label">Declared Weight</span>
          <span class="material-fact-value" style="color: #38bdf8;">${formatWeight(lot.declared_weight)}</span>
        </div>

        <div class="material-fact-row">
          <span class="material-fact-label">Assigned Recycler</span>
          <span class="material-fact-value">${lot.recycler_name || 'GreenCycle Recycling Corp'}</span>
        </div>

        <div class="material-fact-row">
          <span class="material-fact-label">Creation Timestamp</span>
          <span class="material-fact-value">${formatDate(lot.created_at)}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 10px; margin-top: var(--space-md);">
        <button class="btn btn-secondary" id="viewLedgerBtn">
          <span>📒 View Ledger</span>
        </button>
        <button class="btn btn-primary" id="doneHomeBtn">
          <span>🏠 Return Home</span>
        </button>
      </div>
    </div>
  `;

  // Render QR Canvas
  const canvas = container.querySelector('#lotQrCanvas');
  await renderLotQrCode(canvas, lot.lot_id);

  // Status Polling / Refresh
  const statusLabel = container.querySelector('#lotStatusLabel');
  const refreshBtn = container.querySelector('#refreshStatusBtn');

  async function checkLotStatus() {
    try {
      const updated = await apiClient.getLot(lot.lot_id).catch(() => null);
      if (updated && updated.status) {
        lot.status = updated.status;
        statusLabel.textContent = lot.status;
        if (lot.status === 'COMPLETED') {
          statusLabel.style.color = '#34d399';
          showToast('Handover confirmed by recycler! Transaction complete.', 'success');
        } else {
          showToast(`Current Lot Status: ${lot.status}`, 'info');
        }
      } else {
        showToast('Lot status updated (Awaiting Recycler Scan)', 'info');
      }
    } catch (err) {
      console.warn('Status check failed:', err);
    }
  }

  refreshBtn?.addEventListener('click', checkLotStatus);
  container.querySelector('#backHomeBtn')?.addEventListener('click', () => navigateTo('dealer-home'));
  container.querySelector('#doneHomeBtn')?.addEventListener('click', () => navigateTo('dealer-home'));
  container.querySelector('#viewLedgerBtn')?.addEventListener('click', () => navigateTo('ledger'));
}
