from pydantic import BaseModel
from datetime import date

class ExpenseList(BaseModel):

    title:str
    amount:int
    category:str    
    date:date
    is_deleted:bool

    