from fastapi import APIRouter, Depends, Query, HTTPException
from schemas.schemas import ExpenseList
from Database.database import get_db
from Models import models
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from typing import Optional


router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("/")
def create_expense(data: ExpenseList, db: Session = Depends(get_db)):
    # Validation 1: Amount should not be negative
    if data.amount < 0:
        raise HTTPException(status_code=400, detail="Amount cannot be negative")
    
    # Validation 2: Date should not be in the past (before today)
    today = date.today()
    expense_date = datetime.strptime(data.date, "%Y-%m-%d").date() if isinstance(data.date, str) else data.date
    
    if expense_date < today:
        raise HTTPException(status_code=400, detail="Date cannot be in the past. Please select today or a future date.")
    
    new_expense = models.Expense(
        title=data.title,
        amount=data.amount,
        category=data.category,
        date=data.date,
        is_deleted=data.is_deleted
    )
    
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    return {
        "message": "Expense Created Successfully",
        "expense_id": new_expense.id
    }


@router.get("/")
def get_expenses(
    # Existing search filters
    category: Optional[str] = Query(default=None, description="Filter by category"),
    title: Optional[str] = Query(default=None, description="Search by title"),
    
    # New sorting options
    sort_by: Optional[str] = Query(default=None, description="Sort by: title, amount, category, date"),
    sort_order: Optional[str] = Query(default="asc", description="Sort order: asc or desc"),
    
    # New amount filters
    amount_min: Optional[float] = Query(default=None, description="Minimum amount"),
    amount_max: Optional[float] = Query(default=None, description="Maximum amount"),
    amount_greater_than: Optional[float] = Query(default=None, description="Amount greater than"),
    
    # New date filters
    date_from: Optional[str] = Query(default=None, description="Filter expenses from this date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(default=None, description="Filter expenses to this date (YYYY-MM-DD)"),
    
    # Pagination
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    
    db: Session = Depends(get_db)
):
    # Base query - only non-deleted expenses
    query = db.query(models.Expense).filter(models.Expense.is_deleted == False)
    
    # Apply existing filters
    if category:
        query = query.filter(models.Expense.category.ilike(f"%{category}%"))
    
    if title:
        query = query.filter(models.Expense.title.ilike(f"%{title}%"))
    
    # Apply new amount filters
    if amount_min is not None:
        query = query.filter(models.Expense.amount >= amount_min)
    
    if amount_max is not None:
        query = query.filter(models.Expense.amount <= amount_max)
    
    if amount_greater_than is not None:
        query = query.filter(models.Expense.amount > amount_greater_than)
    
    # Apply new date filters
    if date_from:
        query = query.filter(models.Expense.date >= date_from)
    
    if date_to:
        query = query.filter(models.Expense.date <= date_to)
    
    # Apply sorting (backend logic)
    if sort_by:
        if sort_by == "title":
            order_column = models.Expense.title
        elif sort_by == "amount":
            order_column = models.Expense.amount
        elif sort_by == "category":
            order_column = models.Expense.category
        elif sort_by == "date":
            order_column = models.Expense.date
        else:
            order_column = models.Expense.id
        
        if sort_order == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
    else:
        # Default sorting by date descending (newest first)
        query = query.order_by(models.Expense.date.desc())
    
    # Get total count before pagination (backend calculation)
    total_count = query.count()
    
    # Calculate total sum of expenses (backend calculation)
    total_sum_query = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.is_deleted == False
    )
    
    # Apply the same filters to total_sum query
    if category:
        total_sum_query = total_sum_query.filter(models.Expense.category.ilike(f"%{category}%"))
    if title:
        total_sum_query = total_sum_query.filter(models.Expense.title.ilike(f"%{title}%"))
    if amount_min is not None:
        total_sum_query = total_sum_query.filter(models.Expense.amount >= amount_min)
    if amount_max is not None:
        total_sum_query = total_sum_query.filter(models.Expense.amount <= amount_max)
    if amount_greater_than is not None:
        total_sum_query = total_sum_query.filter(models.Expense.amount > amount_greater_than)
    if date_from:
        total_sum_query = total_sum_query.filter(models.Expense.date >= date_from)
    if date_to:
        total_sum_query = total_sum_query.filter(models.Expense.date <= date_to)
    
    total_sum_value = total_sum_query.scalar() or 0
    
    # Apply pagination (backend logic)
    offset = (page - 1) * page_size
    expenses = query.offset(offset).limit(page_size).all()
    
    # Calculate total pages (backend calculation)
    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
    
    return {
        "expenses": expenses,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        },
        "summary": {
            "total_sum": float(total_sum_value),
            "count": total_count
        }
    }


@router.get("/{expense_id}")
def get_expense_by_id(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.is_deleted == False
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense ID Not Found!")
    
    return expense


@router.put("/{expense_id}")
def update_expense(expense_id: int, data: ExpenseList, db: Session = Depends(get_db)):
    # Validation 1: Amount should not be negative
    if data.amount < 0:
        raise HTTPException(status_code=400, detail="Amount cannot be negative")
    
    # Validation 2: Date should not be in the past (before today)
    today = date.today()
    expense_date = datetime.strptime(data.date, "%Y-%m-%d").date() if isinstance(data.date, str) else data.date
    
    if expense_date < today:
        raise HTTPException(status_code=400, detail="Date cannot be in the past. Please select today or a future date.")
    
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.is_deleted == False
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense ID Not Found")
    
    expense.title = data.title
    expense.amount = data.amount
    expense.category = data.category
    expense.date = data.date
    expense.is_deleted = data.is_deleted
    
    db.commit()
    db.refresh(expense)
    
    return {
        "message": "Expense Updated Successfully",
        "Expense_ID": expense.id
    }


@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.is_deleted == False
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense ID Not Found or Already DELETED")
    
    expense.is_deleted = True
    db.commit()
    
    return {
        "message": "Expense Deleted Successfully",
        "expense_id": expense.id
    }