"""Database connection and session management.

SRP: Only handles database connection and session lifecycle.
No business logic, no model imports.
"""
import os
import sys
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# Database configuration
BASE_DIR = Path(__file__).parent.parent
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{BASE_DIR}/data.db"
)

# Engine configuration
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite specific
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session,
)

# Base class for models
Base = declarative_base()

if __name__ == "__main__":
    sys.modules["src.database"] = sys.modules["__main__"]


def get_db() -> Generator[Session, None, None]:
    """Dependency injection for database session.
    
    Yields:
        Database session that closes automatically after request.
    
    Usage:
        @router.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all database tables."""

    Base.metadata.create_all(bind=engine)


def reset_db() -> None:
    """Drop and recreate all tables (development only)."""

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed_questions() -> None:
    """Seed the database with sample questions."""
    from src.models.question import Question

    sample_questions = [
        # === COUNTRIES - EASY ===
        Question(
            text="Where is France located?",
            location_type="country",
            latitude=46.603354,
            longitude=1.888334,
            difficulty="easy",
            hint="Western Europe",
            time_limit=60,
        ),
        Question(
            text="Find Brazil on the map",
            location_type="country",
            latitude=-14.2350,
            longitude=-51.9253,
            difficulty="easy",
            hint="South America",
            time_limit=60,
        ),
        Question(
            text="Where is Australia?",
            location_type="country",
            latitude=-25.2744,
            longitude=133.7751,
            difficulty="easy",
            hint="Southern Hemisphere",
            time_limit=60,
        ),
        Question(
            text="Where is the United States of America?",
            location_type="country",
            latitude=37.0902,
            longitude=-95.7129,
            difficulty="easy",
            hint="North America",
            time_limit=60,
        ),
        Question(
            text="Find Canada on the map",
            location_type="country",
            latitude=56.1304,
            longitude=-106.3468,
            difficulty="easy",
            hint="North of the USA",
            time_limit=60,
        ),
        Question(
            text="Where is Russia?",
            location_type="country",
            latitude=61.5240,
            longitude=105.3188,
            difficulty="easy",
            hint="Largest country in the world",
            time_limit=60,
        ),
        Question(
            text="Find India on the map",
            location_type="country",
            latitude=20.5937,
            longitude=78.9629,
            difficulty="easy",
            hint="South Asia",
            time_limit=60,
        ),
        Question(
            text="Where is China?",
            location_type="country",
            latitude=35.8617,
            longitude=104.1954,
            difficulty="easy",
            hint="Eastern Asia",
            time_limit=60,
        ),
        # === COUNTRIES - MEDIUM ===
        Question(
            text="Find Egypt on the map",
            location_type="country",
            latitude=26.8206,
            longitude=30.8025,
            difficulty="medium",
            hint="Northeastern Africa",
            time_limit=45,
        ),
        Question(
            text="Where is Argentina?",
            location_type="country",
            latitude=-38.4161,
            longitude=-63.6167,
            difficulty="medium",
            hint="Southern South America",
            time_limit=45,
        ),
        Question(
            text="Find Saudi Arabia on the map",
            location_type="country",
            latitude=23.8859,
            longitude=45.0792,
            difficulty="medium",
            hint="Middle East",
            time_limit=45,
        ),
        Question(
            text="Where is South Africa?",
            location_type="country",
            latitude=-30.5595,
            longitude=22.9375,
            difficulty="medium",
            hint="Southern tip of Africa",
            time_limit=45,
        ),
        Question(
            text="Find Indonesia on the map",
            location_type="country",
            latitude=-0.7893,
            longitude=113.9213,
            difficulty="medium",
            hint="Southeast Asia archipelago",
            time_limit=45,
        ),
        Question(
            text="Where is Mexico?",
            location_type="country",
            latitude=23.6345,
            longitude=-102.5528,
            difficulty="medium",
            hint="North America, south of the USA",
            time_limit=45,
        ),
        Question(
            text="Find Turkey on the map",
            location_type="country",
            latitude=38.9637,
            longitude=35.2433,
            difficulty="medium",
            hint="Between Europe and Asia",
            time_limit=45,
        ),
        Question(
            text="Where is Spain?",
            location_type="country",
            latitude=40.4637,
            longitude=-3.7492,
            difficulty="medium",
            hint="Southwestern Europe",
            time_limit=45,
        ),
        # === COUNTRIES - HARD ===
        Question(
            text="Find Kazakhstan on the map",
            location_type="country",
            latitude=48.0196,
            longitude=66.9237,
            difficulty="hard",
            hint="Central Asia",
            time_limit=30,
        ),
        Question(
            text="Where is Papua New Guinea?",
            location_type="country",
            latitude=-6.3150,
            longitude=143.9555,
            difficulty="hard",
            hint="North of Australia",
            time_limit=30,
        ),
        Question(
            text="Find Chile on the map",
            location_type="country",
            latitude=-35.6751,
            longitude=-71.5430,
            difficulty="hard",
            hint="Long narrow country in South America",
            time_limit=30,
        ),
        Question(
            text="Where is Madagascar?",
            location_type="country",
            latitude=-18.7669,
            longitude=46.8691,
            difficulty="hard",
            hint="Island nation off the coast of Africa",
            time_limit=30,
        ),
        Question(
            text="Find Iceland on the map",
            location_type="country",
            latitude=64.9631,
            longitude=-19.0208,
            difficulty="hard",
            hint="North Atlantic island nation",
            time_limit=30,
        ),
        Question(
            text="Where is New Zealand?",
            location_type="country",
            latitude=-40.9006,
            longitude=174.8860,
            difficulty="hard",
            hint="Southwest Pacific Ocean",
            time_limit=30,
        ),
        # === CITIES - EASY ===
        Question(
            text="Where is London, United Kingdom?",
            location_type="city",
            latitude=51.5074,
            longitude=-0.1278,
            difficulty="easy",
            hint="Capital of the UK",
            time_limit=60,
        ),
        Question(
            text="Find New York City on the map",
            location_type="city",
            latitude=40.7128,
            longitude=-74.0060,
            difficulty="easy",
            hint="East Coast, USA",
            time_limit=60,
        ),
        Question(
            text="Where is Paris, France?",
            location_type="city",
            latitude=48.8566,
            longitude=2.3522,
            difficulty="easy",
            hint="City of Light",
            time_limit=60,
        ),
        Question(
            text="Find Rome, Italy on the map",
            location_type="city",
            latitude=41.9028,
            longitude=12.4964,
            difficulty="easy",
            hint="The Eternal City",
            time_limit=60,
        ),
        # === CITIES - MEDIUM ===
        Question(
            text="Where is Tokyo, Japan?",
            location_type="city",
            latitude=35.6762,
            longitude=139.6503,
            difficulty="medium",
            hint="Capital of Japan",
            time_limit=45,
        ),
        Question(
            text="Find Berlin, Germany on the map",
            location_type="city",
            latitude=52.5200,
            longitude=13.4050,
            difficulty="medium",
            hint="Capital of Germany",
            time_limit=45,
        ),
        Question(
            text="Where is Moscow, Russia?",
            location_type="city",
            latitude=55.7558,
            longitude=37.6173,
            difficulty="medium",
            hint="Capital of Russia",
            time_limit=45,
        ),
        Question(
            text="Find Sydney, Australia on the map",
            location_type="city",
            latitude=-33.8688,
            longitude=151.2093,
            difficulty="medium",
            hint="Largest city in Australia",
            time_limit=45,
        ),
        Question(
            text="Where is Cairo, Egypt?",
            location_type="city",
            latitude=30.0444,
            longitude=31.2357,
            difficulty="medium",
            hint="Capital of Egypt",
            time_limit=45,
        ),
        Question(
            text="Find Buenos Aires, Argentina on the map",
            location_type="city",
            latitude=-34.6037,
            longitude=-58.3816,
            difficulty="medium",
            hint="Capital of Argentina",
            time_limit=45,
        ),
        Question(
            text="Where is Bangkok, Thailand?",
            location_type="city",
            latitude=13.7563,
            longitude=100.5018,
            difficulty="medium",
            hint="Capital of Thailand",
            time_limit=45,
        ),
        Question(
            text="Find Istanbul, Turkey on the map",
            location_type="city",
            latitude=41.0082,
            longitude=28.9784,
            difficulty="medium",
            hint="Largest city in Turkey",
            time_limit=45,
        ),
        # === CITIES - HARD ===
        Question(
            text="Where is Reykjavik, Iceland?",
            location_type="city",
            latitude=64.1466,
            longitude=-21.9426,
            difficulty="hard",
            hint="Northernmost capital in the world",
            time_limit=30,
        ),
        Question(
            text="Find Kathmandu, Nepal on the map",
            location_type="city",
            latitude=27.7172,
            longitude=85.3240,
            difficulty="hard",
            hint="Capital of Nepal",
            time_limit=30,
        ),
        Question(
            text="Where is Nairobi, Kenya?",
            location_type="city",
            latitude=-1.2921,
            longitude=36.8219,
            difficulty="hard",
            hint="Capital of Kenya",
            time_limit=30,
        ),
        Question(
            text="Find Ulaanbaatar, Mongolia on the map",
            location_type="city",
            latitude=47.8864,
            longitude=106.9057,
            difficulty="hard",
            hint="Capital of Mongolia",
            time_limit=30,
        ),
        Question(
            text="Where is Wellington, New Zealand?",
            location_type="city",
            latitude=-41.2865,
            longitude=174.7762,
            difficulty="hard",
            hint="Southernmost capital in the world",
            time_limit=30,
        ),
        # === LANDMARKS - EASY ===
        Question(
            text="Where is the Eiffel Tower?",
            location_type="landmark",
            latitude=48.8584,
            longitude=2.2945,
            difficulty="easy",
            hint="Paris, France",
            time_limit=60,
        ),
        Question(
            text="Find the Statue of Liberty on the map",
            location_type="landmark",
            latitude=40.6892,
            longitude=-74.0445,
            difficulty="easy",
            hint="New York Harbor, USA",
            time_limit=60,
        ),
        Question(
            text="Where is the Great Pyramid of Giza?",
            location_type="landmark",
            latitude=29.9792,
            longitude=31.1342,
            difficulty="easy",
            hint="Near Cairo, Egypt",
            time_limit=60,
        ),
        Question(
            text="Find the Colosseum on the map",
            location_type="landmark",
            latitude=41.8902,
            longitude=12.4922,
            difficulty="easy",
            hint="Rome, Italy",
            time_limit=60,
        ),
        Question(
            text="Where is the Taj Mahal?",
            location_type="landmark",
            latitude=27.1751,
            longitude=78.0421,
            difficulty="easy",
            hint="Agra, India",
            time_limit=60,
        ),
        # === LANDMARKS - MEDIUM ===
        Question(
            text="Find the Great Wall of China on the map",
            location_type="landmark",
            latitude=40.4319,
            longitude=116.5704,
            difficulty="medium",
            hint="Northern China",
            time_limit=45,
        ),
        Question(
            text="Where is Machu Picchu?",
            location_type="landmark",
            latitude=-13.1631,
            longitude=-72.5450,
            difficulty="medium",
            hint="Ancient Inca city in Peru",
            time_limit=45,
        ),
        Question(
            text="Find the Sydney Opera House on the map",
            location_type="landmark",
            latitude=-33.8568,
            longitude=151.2153,
            difficulty="medium",
            hint="Sydney, Australia",
            time_limit=45,
        ),
        Question(
            text="Where is Stonehenge?",
            location_type="landmark",
            latitude=51.1789,
            longitude=-1.8262,
            difficulty="medium",
            hint="England, UK",
            time_limit=45,
        ),
        Question(
            text="Find the Christ the Redeemer statue on the map",
            location_type="landmark",
            latitude=-22.9519,
            longitude=-43.2105,
            difficulty="medium",
            hint="Rio de Janeiro, Brazil",
            time_limit=45,
        ),
        Question(
            text="Where is the Leaning Tower of Pisa?",
            location_type="landmark",
            latitude=43.7230,
            longitude=10.3966,
            difficulty="medium",
            hint="Italy",
            time_limit=45,
        ),
        Question(
            text="Find the Brandenburg Gate on the map",
            location_type="landmark",
            latitude=52.5163,
            longitude=13.3777,
            difficulty="medium",
            hint="Berlin, Germany",
            time_limit=45,
        ),
        Question(
            text="Where is Angkor Wat?",
            location_type="landmark",
            latitude=13.4125,
            longitude=103.8670,
            difficulty="medium",
            hint="Cambodia",
            time_limit=45,
        ),
        # === LANDMARKS - HARD ===
        Question(
            text="Find Petra on the map",
            location_type="landmark",
            latitude=30.3285,
            longitude=35.4444,
            difficulty="hard",
            hint="Ancient city in Jordan",
            time_limit=30,
        ),
        Question(
            text="Where is Mount Fuji?",
            location_type="landmark",
            latitude=35.3606,
            longitude=138.7274,
            difficulty="hard",
            hint="Highest mountain in Japan",
            time_limit=30,
        ),
        Question(
            text="Find the Galapagos Islands on the map",
            location_type="landmark",
            latitude=-0.9538,
            longitude=-90.9656,
            difficulty="hard",
            hint="Pacific Ocean, near Ecuador",
            time_limit=30,
        ),
        Question(
            text="Where is Uluru (Ayers Rock)?",
            location_type="landmark",
            latitude=-25.3444,
            longitude=131.0369,
            difficulty="hard",
            hint="Central Australia",
            time_limit=30,
        ),
        Question(
            text="Find the Moai statues on the map",
            location_type="landmark",
            latitude=-27.1127,
            longitude=-109.3497,
            difficulty="hard",
            hint="Easter Island, Chile",
            time_limit=30,
        ),
        Question(
            text="Where is the Matterhorn?",
            location_type="landmark",
            latitude=45.9763,
            longitude=7.6586,
            difficulty="hard",
            hint="Swiss Alps",
            time_limit=30,
        ),
        Question(
            text="Find Borobudur on the map",
            location_type="landmark",
            latitude=-7.6079,
            longitude=110.2038,
            difficulty="hard",
            hint="Buddhist temple in Indonesia",
            time_limit=30,
        ),
        Question(
            text="Where is Victoria Falls?",
            location_type="landmark",
            latitude=-17.9243,
            longitude=25.8572,
            difficulty="hard",
            hint="Border of Zambia and Zimbabwe",
            time_limit=30,
        ),
    ]

    db = SessionLocal()
    try:
        from sqlalchemy import select
        stmt = select(Question)
        count = len(db.execute(stmt).scalars().all())
        if count > 0:
            print("Questions already seeded, skipping.")
            return
        
        db.add_all(sample_questions)
        db.commit()
        print(f"Seeded {len(sample_questions)} questions successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_questions()
