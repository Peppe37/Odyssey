from sqlmodel import create_engine, SQLModel, Session
from backend.core.config import settings

# Handling the fact that SQLModel uses SQLAlchemy which expects specific driver prefixes
db_url = settings.ASYNC_DATABASE_URL
if db_url.startswith("postgresql://"):
    # Ensure usage of correct driver if needed, but standard postgres:// works often or needs postgresql://
    pass 

connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_engine(db_url, echo=settings.DEBUG, connect_args=connect_args)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
