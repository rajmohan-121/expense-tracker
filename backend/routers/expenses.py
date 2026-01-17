from fastapi import APIRouter,Depends,Query
from schemas.schemas import ExpenseList
from Database.database import get_db
from Models import models
from sqlalchemy.orm import Session


router=APIRouter(prefix="/expenses",tags=["Expenses"])

@router.post("/")
def create_expense(data:ExpenseList,db: Session=Depends(get_db)):
    new_expense=models.Expense(
        title=data.title,
        amount=data.amount,
        category=data.category,
        date=data.date,
        is_deleted=data.is_deleted)
    
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    

    return{
        "message":"Expense Created Successfully", 
        "expense_id":new_expense.id
        }


@router.get("/")
def get_expenses(
    category : str | None = Query(default=None),
    title : str | None = Query(default=None),
    db : Session = Depends(get_db)
):
    query = db.query(models.Expense)

    if category:
         query = query.filter(models.Expense.category.ilike(f"%{category}%"))

    if title:
        query = query.filter(models.Expense.title.ilike(f"%{title}%"))

    return query.all()


@router.get("/{expense_id}")
def get_expense_by_id(expense_id:int , db: Session= Depends(get_db)):
    expense=db.query(models.Expense).filter(models.Expense.id == expense_id).first()

    if not expense:
        return {"ERROR " :"Expense ID Not Found!" }
    return expense


@router.put("/{expense_id}")
def update_expense(expense_id:int, data: ExpenseList, db : Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id , models.Expense.is_deleted == False).first()

    if not expense:
        return {"ERROR" : "Expense ID Not Found"}
    
    expense.title=data.title
    expense.amount=data.amount
    expense.category=data.category
    expense.date=data.date
    expense.is_deleted=data.is_deleted

    db.commit()
    db.refresh(expense)

    return {
        "message" : "Expense Updated Successfully",
        "Expense_ID" : expense.id
    }



@router.delete("/{expense_id}")
def delete_expense(expense_id:int , db : Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.is_deleted == False).first()

    if not expense:
        return {"ERROR" : "Expense ID Not Found or Already DELETED"}
    
    expense.is_deleted = True
    db.commit()


    return {
        "message" : "Expense Deleted Successfully",
        "expense_id" : expense.id
    }
    
    