from pydantic import BaseModel


class RegisterSchema(BaseModel):
    email: str
    username: str
    password: str

class LoginSchema(BaseModel):
    email: str
    password: str

class LoginResponseSchema(BaseModel):
    access_token: str
    user_id: int
