from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    secret_key: str = "your-super-secret-key-change-this"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    redis_url: str = "redis://redis:6379"
    sql_server_host: str
    sql_server_user: str = "sa"
    sql_server_password: str
    sql_server_port: int = 1433
    
    class Config:
        env_file = ".env"

settings = Settings()
