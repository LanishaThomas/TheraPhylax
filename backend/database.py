import os
import json
import logging
from typing import Generator
from sqlalchemy import (
    create_engine,
    Column,
    String,
    Text,
    Float,
    Integer,
    Boolean,
    JSON,
    DateTime,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from datetime import datetime

logger = logging.getLogger("theraphylax.database")

AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
# Credentials should be fetched dynamically from AWS SSM Parameter Store (/theraphylax/db/url)
# or provided via DATABASE_URL environment variable to ensure zero hardcoded secrets.
DEFAULT_RDS_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./theraphylax_dev.db"
)


def resolve_database_url() -> str:
    """
    Retrieves the PostgreSQL connection string securely:
    1. AWS Secrets Manager ('theraphylax/rds/credentials')
    2. AWS Systems Manager Parameter Store ('/theraphylax/db/url')
    3. Environment variable override
    4. Default RDS URL fallback
    """
    url = None

    # 1. Check environment variable override
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        logger.info("Using DATABASE_URL from environment variable.")
        url = env_url

    # 2. Attempt fetching from AWS Secrets Manager (Best Practice)
    if not url:
        try:
            import boto3
            sm = boto3.client("secretsmanager", region_name=AWS_REGION)
            resp = sm.get_secret_value(SecretId="theraphylax/rds/credentials")
            secret_str = resp.get("SecretString")
            if secret_str:
                secret_json = json.loads(secret_str)
                if "url" in secret_json:
                    url = secret_json["url"]
                elif "host" in secret_json and "username" in secret_json and "password" in secret_json:
                    u = secret_json["username"]
                    p = secret_json["password"]
                    h = secret_json["host"]
                    port = secret_json.get("port", 5432)
                    d = secret_json.get("dbname", "theraphylax")
                    url = f"postgresql+psycopg2://{u}:{p}@{h}:{port}/{d}"
                logger.info("Successfully retrieved database credentials from AWS Secrets Manager (theraphylax/rds/credentials).")
        except Exception as e:
            logger.warning(f"Could not retrieve credentials from AWS Secrets Manager ({e}). Trying SSM Parameter Store...")

    # 3. Attempt fetching from AWS Systems Manager Parameter Store
    if not url:
        try:
            import boto3
            ssm = boto3.client("ssm", region_name=AWS_REGION)
            resp = ssm.get_parameter(Name="/theraphylax/db/url", WithDecryption=True)
            param_val = resp["Parameter"]["Value"]
            if param_val:
                logger.info("Successfully fetched DATABASE_URL from AWS SSM Parameter Store (/theraphylax/db/url).")
                url = param_val
        except Exception as e:
            logger.warning(f"Could not retrieve /theraphylax/db/url from AWS SSM ({e}). Using default RDS connection.")

    if not url:
        url = DEFAULT_RDS_URL

    # Ensure SQLAlchemy 2.0+ uses psycopg2
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


DATABASE_URL = resolve_database_url()

# SQLAlchemy Setup
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=1800,
        pool_size=10,
        max_overflow=20,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("SQLAlchemy database engine initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize SQLAlchemy database engine: {e}")
    engine = None
    SessionLocal = None

Base = declarative_base()


# -------------------------------------------------------------
# ORM MODELS FOR AMAZON RDS POSTGRESQL
# -------------------------------------------------------------
class ReportDB(Base):
    __tablename__ = "reports"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Road Accident")
    severity = Column(String(50), default="Medium")
    status = Column(String(50), default="Under Review")
    description = Column(Text, nullable=False)
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    incident_date = Column(String(64), nullable=True)
    reporter_name = Column(String(100), default="Citizen Reporter")
    user_email = Column(String(150), default="citizen@theraphylax.org")
    created_at = Column(String(64), default=lambda: datetime.utcnow().isoformat() + "Z")
    injuries_count = Column(Integer, default=0)
    vehicles_involved = Column(Integer, default=1)
    emergency_services_contacted = Column(Boolean, default=False)
    animal_type = Column(String(100), nullable=True)
    animal_status = Column(String(100), nullable=True)
    reporter_safe = Column(Boolean, default=True)
    tagged_forest_officers = Column(JSON, default=list)
    forest_range = Column(String(150), default="SGNP Core Wildlife Range")
    image_url = Column(Text, nullable=True)
    evidence_image_url = Column(Text, nullable=True)

    def to_dict(self):
        img = self.image_url
        if img and (".amazonaws.com/" in img or "theraphylax-evidence-" in img):
            k = img.split(".amazonaws.com/")[1].lstrip("/") if ".amazonaws.com/" in img else img.lstrip("/")
            img = f"/evidence/{k}"
        ev_img = self.evidence_image_url or self.image_url
        if ev_img and (".amazonaws.com/" in ev_img or "theraphylax-evidence-" in ev_img):
            k = ev_img.split(".amazonaws.com/")[1].lstrip("/") if ".amazonaws.com/" in ev_img else ev_img.lstrip("/")
            ev_img = f"/evidence/{k}"

        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "severity": self.severity,
            "status": self.status,
            "description": self.description,
            "location_name": self.location_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "incident_date": self.incident_date,
            "reporter_name": self.reporter_name,
            "user_email": self.user_email,
            "created_at": self.created_at,
            "injuries_count": self.injuries_count,
            "vehicles_involved": self.vehicles_involved,
            "emergency_services_contacted": self.emergency_services_contacted,
            "animal_type": self.animal_type,
            "animal_status": self.animal_status,
            "reporter_safe": self.reporter_safe,
            "tagged_forest_officers": self.tagged_forest_officers or [],
            "forest_range": self.forest_range,
            "image_url": img,
            "evidence_image_url": ev_img,
            "raw_s3_url": self.evidence_image_url or self.image_url,
        }


class ForestStationDB(Base):
    __tablename__ = "forest_stations"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    range = Column(String(150), nullable=False)
    district = Column(String(100), nullable=False)
    contact_person = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    radio_frequency = Column(String(50), default="156.800 MHz")
    response_time = Column(String(50), default="10 - 15 Mins")
    coverage_sectors = Column(JSON, default=list)
    available = Column(Boolean, default=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    active_officers = Column(Integer, default=10)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "range": self.range,
            "district": self.district,
            "contact_person": self.contact_person,
            "phone": self.phone,
            "radio_frequency": self.radio_frequency,
            "response_time": self.response_time,
            "coverage_sectors": self.coverage_sectors or [],
            "available": self.available,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "active_officers": self.active_officers,
        }


class SafetyUpdateDB(Base):
    __tablename__ = "safety_updates"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    severity = Column(String(50), default="Medium")
    message = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, default=3.0)
    target_regions = Column(JSON, default=list)
    created_at = Column(String(64), default=lambda: datetime.utcnow().isoformat() + "Z")
    author = Column(String(150), nullable=False)
    author_role = Column(String(100), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "severity": self.severity,
            "message": self.message,
            "location": self.location,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "radius_km": self.radius_km,
            "target_regions": self.target_regions or [],
            "created_at": self.created_at,
            "author": self.author,
            "author_role": self.author_role,
        }


class GeofencedAlertDB(Base):
    __tablename__ = "geofenced_alerts"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    severity = Column(String(50), default="High")
    message = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, default=5.0)
    affected_count = Column(Integer, default=0)
    created_at = Column(String(64), default=lambda: datetime.utcnow().isoformat() + "Z")
    author = Column(String(150), nullable=False)
    delivery_channels = Column(JSON, default=list)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "severity": self.severity,
            "message": self.message,
            "location": self.location,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "radius_km": self.radius_km,
            "affected_count": self.affected_count,
            "created_at": self.created_at,
            "author": self.author,
            "delivery_channels": self.delivery_channels or [],
        }


class ForestDispatchDB(Base):
    __tablename__ = "forest_dispatches"

    id = Column(String(64), primary_key=True, index=True)
    incident_id = Column(String(64), nullable=True)
    station_id = Column(String(64), nullable=True)
    station_name = Column(String(255), nullable=False)
    animal_type = Column(String(100), nullable=True)
    location_name = Column(String(255), nullable=False)
    status = Column(String(50), default="Officer Dispatched")
    reporter_name = Column(String(100), nullable=True)
    reporter_phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(String(64), default=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self):
        return {
            "id": self.id,
            "incident_id": self.incident_id,
            "station_id": self.station_id,
            "station_name": self.station_name,
            "animal_type": self.animal_type,
            "location_name": self.location_name,
            "status": self.status,
            "reporter_name": self.reporter_name,
            "reporter_phone": self.reporter_phone,
            "notes": self.notes,
            "created_at": self.created_at,
        }


class EmergencyContactDB(Base):
    __tablename__ = "emergency_contacts"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    number = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    coverage = Column(String(150), nullable=False)
    verified = Column(Boolean, default=True)
    description = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "number": self.number,
            "category": self.category,
            "coverage": self.coverage,
            "verified": self.verified,
            "description": self.description,
        }


class NotificationDB(Base):
    __tablename__ = "notifications"

    id = Column(String(64), primary_key=True, index=True)
    alert_id = Column(String(64), index=True, nullable=True)
    user_email = Column(String(150), index=True, nullable=False)
    user_name = Column(String(150), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="High")
    priority_label = Column(String(50), default="High Priority")
    priority_color = Column(String(50), default="#EF4444")
    category = Column(String(100), default="Wildlife Safety")
    location_name = Column(String(255), nullable=True)
    alert_latitude = Column(Float, nullable=True)
    alert_longitude = Column(Float, nullable=True)
    alert_radius_km = Column(Float, nullable=True)
    user_distance_km = Column(Float, nullable=True)
    email_dispatched = Column(Boolean, default=False)
    email_status = Column(String(255), nullable=True)
    channels = Column(JSON, default=list)
    is_read = Column(Boolean, default=False)
    created_at = Column(String(64), default=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self):
        return {
            "id": self.id,
            "alert_id": self.alert_id,
            "user_email": self.user_email,
            "user_name": self.user_name,
            "title": self.title,
            "message": self.message,
            "severity": self.severity,
            "priority_label": self.priority_label,
            "priority_color": self.priority_color,
            "category": self.category,
            "channels": self.channels or ["app"],
            "location_name": self.location_name,
            "alert_latitude": self.alert_latitude,
            "alert_longitude": self.alert_longitude,
            "alert_radius_km": self.alert_radius_km,
            "user_distance_km": self.user_distance_km,
            "email_dispatched": self.email_dispatched,
            "email_status": self.email_status,
            "is_read": self.is_read,
            "created_at": self.created_at,
        }


class UserDB(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    role = Column(String(50), default="Citizen")
    department = Column(String(150), nullable=True)
    badge_number = Column(String(50), nullable=True)
    assigned_station = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    district = Column(String(100), nullable=True)
    city = Column(String(100), default="Mumbai")
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(String(64), default=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "badge_number": self.badge_number,
            "assigned_station": self.assigned_station,
            "phone": self.phone,
            "district": self.district,
            "city": self.city,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at,
        }


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency for database sessions."""
    if SessionLocal is None:
        raise RuntimeError("Database engine not configured.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(seed_data: dict = None):
    """
    Creates tables in Amazon RDS PostgreSQL and seeds them if empty.
    """
    if engine is None:
        logger.warning("Database engine not available, skipping table creation.")
        return

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created in Amazon RDS PostgreSQL.")

        if not seed_data:
            return

        db: Session = SessionLocal()
        try:
            # 1. Seed Forest Stations if empty
            if db.query(ForestStationDB).count() == 0 and "forest_stations" in seed_data:
                for item in seed_data["forest_stations"]:
                    db.add(ForestStationDB(**item))
                db.commit()
                logger.info("Seeded initial forest stations to Amazon RDS.")

            # 2. Seed Reports if empty
            if db.query(ReportDB).count() == 0 and "reports" in seed_data:
                for item in seed_data["reports"]:
                    db.add(ReportDB(**item))
                db.commit()
                logger.info("Seeded initial incident reports to Amazon RDS.")

            # 3. Seed Safety Updates if empty
            if db.query(SafetyUpdateDB).count() == 0 and "updates" in seed_data:
                for item in seed_data["updates"]:
                    db.add(SafetyUpdateDB(**item))
                db.commit()
                logger.info("Seeded initial safety updates to Amazon RDS.")

            # 4. Seed Forest Dispatches if empty
            if db.query(ForestDispatchDB).count() == 0 and "dispatches" in seed_data:
                for item in seed_data["dispatches"]:
                    db.add(ForestDispatchDB(**item))
                db.commit()
                logger.info("Seeded initial forest dispatches to Amazon RDS.")

            # 5. Seed Emergency Contacts if empty
            if db.query(EmergencyContactDB).count() == 0 and "emergency_contacts" in seed_data:
                for item in seed_data["emergency_contacts"]:
                    db.add(EmergencyContactDB(**item))
                db.commit()
                logger.info("Seeded emergency contacts to Amazon RDS.")

            # 6. Seed Geofenced Alerts if empty
            if db.query(GeofencedAlertDB).count() == 0 and "alerts" in seed_data:
                for item in seed_data["alerts"]:
                    db.add(GeofencedAlertDB(**item))
                db.commit()
                logger.info("Seeded initial geofenced alerts to Amazon RDS.")

            # 7. Seed Registered Users if empty
            if db.query(UserDB).count() == 0 and "users" in seed_data:
                for item in seed_data["users"]:
                    db.add(UserDB(**item))
                db.commit()
                logger.info("Seeded initial users to Amazon RDS.")

        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error initializing or seeding Amazon RDS database: {e}")
