import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

db_path = Path(__file__).parent / "cyclonewatch.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_path}"
os.environ["DATABASE_SYNC_URL"] = f"sqlite:///{db_path}"
os.environ["ML_FORCE_STUB"] = "true"
os.environ["CORS_ORIGINS"] = "*"

async def main():
    from app.db.session import _get_session_factory
    from sqlalchemy import select
    from app.models import Event, Prediction
    
    factory = _get_session_factory()
    async with factory() as session:
        result = await session.execute(select(Event))
        events = result.scalars().all()
        print("Async DB Events loaded:", [e.event_id for e in events])
        
        preds = await session.execute(select(Prediction).limit(5))
        print("Sample predictions loaded:", len(preds.scalars().all()))

if __name__ == "__main__":
    asyncio.run(main())
