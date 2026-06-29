from database.db import engine
from models import all_models as models

if __name__ == "__main__":
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")
