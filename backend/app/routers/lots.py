import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_dealer, get_current_user
from app.core.config import LotStatus, UserRole
from app.models.user import User
from app.models.purchase import Purchase
from app.models.lot import Lot
from app.models.recycler import RecyclerProfile
from app.schemas.lot import LotCreate, LotResponse, LotAssignRecycler

router = APIRouter(prefix="/lots", tags=["Lots"])

@router.post("", response_model=LotResponse, status_code=status.HTTP_201_CREATED)
def create_lot(
    data: LotCreate,
    current_dealer: User = Depends(get_current_dealer),
    db: Session = Depends(get_db)
):
    category_val = data.category.value
    lot_uuid = data.lot_id if data.lot_id else str(uuid.uuid4())

    # Check if lot_uuid already exists
    if db.query(Lot).filter(Lot.lot_id == lot_uuid).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lot with ID '{lot_uuid}' already exists"
        )

    # 1. Check available stock for this dealer in this single category
    available_purchases = db.query(Purchase).filter(
        Purchase.dealer_id == current_dealer.id,
        Purchase.category == category_val,
        Purchase.lot_id == None
    ).order_by(Purchase.created_at.asc()).all()

    total_available = sum(p.weight for p in available_purchases)

    if total_available < data.declared_weight:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient available stock for category '{category_val}'. Available: {total_available:.2f} kg, Requested: {data.declared_weight:.2f} kg"
        )

    # 2. Check recycler if supplied
    initial_status = LotStatus.POOLED.value
    recycler_id = None
    if data.recycler_id:
        recycler = db.query(User).filter(User.id == data.recycler_id, User.role == UserRole.RECYCLER.value).first()
        if not recycler:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned recycler not found"
            )
        profile = db.query(RecyclerProfile).filter(RecyclerProfile.user_id == data.recycler_id).first()
        if not profile or category_val not in (profile.accepted_categories or []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Recycler does not accept category '{category_val}'"
            )
        recycler_id = recycler.id
        initial_status = LotStatus.PENDING_HANDOVER.value

    # 3. Create Lot
    lot = Lot(
        lot_id=lot_uuid,
        dealer_id=current_dealer.id,
        recycler_id=recycler_id,
        category=category_val,
        declared_weight=data.declared_weight,
        status=initial_status,
        created_at=datetime.now(timezone.utc)
    )
    db.add(lot)
    db.flush()

    # 4. Allocate purchases to pool them
    allocated_weight = 0.0
    for p in available_purchases:
        p.lot_id = lot.lot_id
        allocated_weight += p.weight
        if allocated_weight >= data.declared_weight:
            break

    db.commit()
    db.refresh(lot)

    return LotResponse(
        lot_id=lot.lot_id,
        dealer_id=lot.dealer_id,
        dealer_name=current_dealer.name,
        category=lot.category,
        declared_weight=lot.declared_weight,
        recycler_id=lot.recycler_id,
        recycler_name=lot.recycler.name if lot.recycler else None,
        status=lot.status,
        created_at=lot.created_at,
        updated_at=lot.updated_at
    )

@router.get("", response_model=List[LotResponse])
def list_dealer_lots(
    status: Optional[str] = Query(None),
    current_dealer: User = Depends(get_current_dealer),
    db: Session = Depends(get_db)
):
    query = db.query(Lot).filter(Lot.dealer_id == current_dealer.id)
    if status:
        query = query.filter(Lot.status == status)

    lots = query.order_by(Lot.created_at.desc()).all()
    return [
        LotResponse(
            lot_id=l.lot_id,
            dealer_id=l.dealer_id,
            dealer_name=current_dealer.name,
            category=l.category,
            declared_weight=l.declared_weight,
            recycler_id=l.recycler_id,
            recycler_name=l.recycler.name if l.recycler else None,
            status=l.status,
            created_at=l.created_at,
            updated_at=l.updated_at
        )
        for l in lots
    ]

@router.get("/{lot_id}", response_model=LotResponse)
def get_lot(
    lot_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = db.query(Lot).filter(Lot.lot_id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lot not found"
        )

    # Authorization check
    if current_user.role == UserRole.DEALER.value and lot.dealer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this lot")
    if current_user.role == UserRole.RECYCLER.value and lot.recycler_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this lot")

    return LotResponse(
        lot_id=lot.lot_id,
        dealer_id=lot.dealer_id,
        dealer_name=lot.dealer.name if lot.dealer else None,
        category=lot.category,
        declared_weight=lot.declared_weight,
        recycler_id=lot.recycler_id,
        recycler_name=lot.recycler.name if lot.recycler else None,
        status=lot.status,
        created_at=lot.created_at,
        updated_at=lot.updated_at
    )

@router.patch("/{lot_id}/assign-recycler", response_model=LotResponse)
def assign_recycler(
    lot_id: str,
    data: LotAssignRecycler,
    current_dealer: User = Depends(get_current_dealer),
    db: Session = Depends(get_db)
):
    lot = db.query(Lot).filter(Lot.lot_id == lot_id, Lot.dealer_id == current_dealer.id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lot not found or access denied"
        )

    if lot.status == LotStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign recycler to already completed lot"
        )

    recycler = db.query(User).filter(User.id == data.recycler_id, User.role == UserRole.RECYCLER.value).first()
    if not recycler:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target recycler not found"
        )

    profile = db.query(RecyclerProfile).filter(RecyclerProfile.user_id == data.recycler_id).first()
    if not profile or lot.category not in (profile.accepted_categories or []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Recycler does not accept lot category '{lot.category}'"
        )

    lot.recycler_id = recycler.id
    lot.status = LotStatus.PENDING_HANDOVER.value
    lot.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(lot)

    return LotResponse(
        lot_id=lot.lot_id,
        dealer_id=lot.dealer_id,
        dealer_name=current_dealer.name,
        category=lot.category,
        declared_weight=lot.declared_weight,
        recycler_id=lot.recycler_id,
        recycler_name=recycler.name,
        status=lot.status,
        created_at=lot.created_at,
        updated_at=lot.updated_at
    )
