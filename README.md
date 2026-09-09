# Kabadiwala Connect — Project Documentation

Kabadiwala Connect is a digital traceability and workflow platform for the
informal and formal e-waste recycling ecosystem.

The platform connects:

Door-to-door Collector
        ↓
Dealer
        ↓
Recycler

The system helps record scrap purchases, maintain dealer inventory, create
lots, match dealers with recyclers, verify physical handovers, and maintain
platform-side verified transaction records.

## Main Goals

1. Help collectors identify scrap material quickly.
2. Allow dealers to digitally record purchases.
3. Support offline-first dealer operations.
4. Maintain accurate dealer stock.
5. Pool material into traceable lots.
6. Match lots with suitable recyclers.
7. Connect physical handovers with digital lot records using QR.
8. Allow recyclers to verify actual received weight.
9. Detect large weight discrepancies.
10. Prevent duplicate transactions.
11. Maintain transaction history and dealer ledger.
12. Generate a platform-side verified transaction record.

## Important Scope Boundary

The ML classifier is used for the door-to-door collector.

It is an assistance tool, not the final authority for dealer purchases.

Collector:

Photo → ML suggestion → Collector confirms/corrects

Dealer:

Actual material → Dealer records purchase

Recycler:

Physical lot → Recycler verifies → Recycler confirms handover

## Material Categories

The system uses exactly seven categories:

- PCB
- CRT
- LCD
- Cable
- Battery
- Motor/Magnet
- Mixed Plastic

These category names must remain consistent across:

- Mobile app
- ML model
- Backend
- Database
- Recycler dashboard
- APIs
- QR workflow
- Transaction records

## Main Prototype Flow

Collector
→ Identify material
→ Dealer
→ Log purchase
→ Offline save/sync
→ Stock
→ Create Lot
→ Find Recycler
→ Select Recycler
→ Generate QR
→ Physical Handover
→ Recycler scans QR
→ Verify weight
→ Check discrepancy
→ Confirm Handover
→ Transaction Completed
→ Ledger / Verified Record

## Definition of Done

The prototype is considered complete when:

- Collector can photograph scrap.
- ML can suggest a category.
- Collector can confirm/correct the suggestion.
- Dealer can record purchases.
- Purchases work offline.
- Offline data survives app restart.
- Data synchronizes without duplicates.
- Dealer can view available stock.
- Dealer can create a single-category lot.
- Dealer can find and select a recycler.
- Dealer can generate a QR containing only the Lot UUID.
- Recycler can scan or manually enter the lot code.
- Recycler can see declared weight.
- Recycler can enter verified weight.
- >30% discrepancy generates a warning.
- Warning does not automatically block confirmation.
- Backend prevents duplicate confirmation.
- Completed lots leave available stock.
- Dealer ledger reflects confirmed sales.
- A real confirmed transaction generates a platform-side verified record.

## Important EPR Terminology

The platform-generated PDF is a verified transaction/traceability record.

It must NOT be described as an official government EPR certificate unless
the project actually integrates with and is authorized by the relevant
official EPR system.