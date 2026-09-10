from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import UserRole
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionResponse,
    VerifiedTransactionRecordResponse
)
from app.services.pdf_generator import generate_transaction_pdf

router = APIRouter(prefix="/transactions", tags=["Transactions & Verified Records"])

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.DEALER.value:
        txs = db.query(Transaction).filter(Transaction.dealer_id == current_user.id).order_by(Transaction.timestamp.desc()).all()
    elif current_user.role == UserRole.RECYCLER.value:
        txs = db.query(Transaction).filter(Transaction.recycler_id == current_user.id).order_by(Transaction.timestamp.desc()).all()
    else:
        txs = []

    return [
        TransactionResponse(
            transaction_id=t.transaction_id,
            lot_id=t.lot_id,
            dealer_id=t.dealer_id,
            dealer_name=t.dealer.name if t.dealer else None,
            recycler_id=t.recycler_id,
            recycler_name=t.recycler.name if t.recycler else None,
            category=t.category,
            declared_weight=t.declared_weight,
            verified_weight=t.verified_weight,
            discrepancy_percentage=t.discrepancy_percentage,
            rate_per_kg=t.rate_per_kg,
            total_payout=t.total_payout,
            status=t.status,
            timestamp=t.timestamp,
            notes=t.notes
        )
        for t in txs
    ]

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tx = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    if current_user.role == UserRole.DEALER.value and tx.dealer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this transaction")
    if current_user.role == UserRole.RECYCLER.value and tx.recycler_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this transaction")

    return TransactionResponse(
        transaction_id=tx.transaction_id,
        lot_id=tx.lot_id,
        dealer_id=tx.dealer_id,
        dealer_name=tx.dealer.name if tx.dealer else None,
        recycler_id=tx.recycler_id,
        recycler_name=tx.recycler.name if tx.recycler else None,
        category=tx.category,
        declared_weight=tx.declared_weight,
        verified_weight=tx.verified_weight,
        discrepancy_percentage=tx.discrepancy_percentage,
        rate_per_kg=tx.rate_per_kg,
        total_payout=tx.total_payout,
        status=tx.status,
        timestamp=tx.timestamp,
        notes=tx.notes
    )

@router.get("/{transaction_id}/record", response_model=VerifiedTransactionRecordResponse)
def get_verified_record(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tx = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    if current_user.role == UserRole.DEALER.value and tx.dealer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == UserRole.RECYCLER.value and tx.recycler_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return VerifiedTransactionRecordResponse(
        transaction_id=tx.transaction_id,
        lot_id=tx.lot_id,
        dealer_id=tx.dealer_id,
        dealer_name=tx.dealer.name if tx.dealer else "Dealer",
        recycler_id=tx.recycler_id,
        recycler_name=tx.recycler.name if tx.recycler else "Recycler",
        category=tx.category,
        declared_weight_kg=tx.declared_weight,
        verified_weight_kg=tx.verified_weight,
        discrepancy_percentage=tx.discrepancy_percentage,
        rate_per_kg_inr=tx.rate_per_kg,
        total_payout_inr=tx.total_payout,
        timestamp=tx.timestamp
    )

@router.get("/{transaction_id}/pdf")
def download_verified_record_pdf(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tx = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    if current_user.role == UserRole.DEALER.value and tx.dealer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == UserRole.RECYCLER.value and tx.recycler_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    pdf_bytes = generate_transaction_pdf(tx)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=verified_record_{tx.transaction_id[:8]}.pdf"
        }
    )
