from sqlalchemy import Column,Integer,String,Date,Boolean

from Database.database import Base

class Expense(Base):
    __tablename__="expense"

    id=Column(Integer,primary_key=True,index=True)
    title=Column(String,nullable=False)
    amount=Column(Integer,nullable=False)
    category=Column(String,index=True,nullable=False)
    date=Column(Date,nullable=False)
    is_deleted=Column(Boolean,default=False)