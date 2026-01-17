from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Models import models
from Database.database import engine
from routers.expenses import router as expense_router

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)


@app.get("/",tags=["Default Health Check"])
def root():
    return {"message":"Backend is running Successfully"}

app.include_router(expense_router)