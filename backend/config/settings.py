import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000,http://localhost:5173")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "cab_management")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

    @property
    def DATABASE_URL(self) -> str:
        # mysql+pymysql://root:@localhost:3306/cab_management
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_cab_management_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

settings = Settings()
