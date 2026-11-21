"""Verified Customer Reviews & Ratings Endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Booking, Profile, Review
from app.schemas.schemas import ReviewCreateRequest
from app.utils.responses import ok

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", status_code=status.HTTP_201_CREATED)
def submit_review(
    payload: ReviewCreateRequest,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Eligible booking not found")

    if booking.status not in ("Confirmed", "Completed"):
        raise HTTPException(
            status_code=400,
            detail="Only confirmed or completed bookings are eligible to submit a review.",
        )

    existing = db.query(Review).filter(Review.booking_id == booking.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already submitted a review for this booking.",
        )

    review = Review(
        booking_id=booking.id,
        user_id=current_user.id,
        parking_location_id=booking.parking_location_id,
        rating=payload.rating,
        title=payload.title.strip(),
        description=payload.description.strip(),
        images=payload.images,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return ok(
        data={
            "id": review.id,
            "booking_id": review.booking_id,
            "rating": review.rating,
            "title": review.title,
            "description": review.description,
            "created_at": review.created_at.isoformat(),
        },
        message="Thank you! Your review has been published.",
    )


@router.get("/my")
def get_my_reviews(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return ok(
        data=[
            {
                "id": r.id,
                "booking_id": r.booking_id,
                "parking_location_id": r.parking_location_id,
                "parking_name": r.location.name if r.location else "",
                "rating": r.rating,
                "title": r.title,
                "description": r.description,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reviews
        ],
        message="User reviews fetched",
    )
