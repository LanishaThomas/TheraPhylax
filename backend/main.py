from fastapi import FastAPI, HTTPException, Query, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

app = FastAPI(
    title="TheraPhylax API",
    description="Multi-Role Disaster Reporting, Forest Wildlife Patrol & Geofencing Public Safety Platform",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# DATABASE: Forest Stations & Range Offices
# -------------------------------------------------------------
forest_stations_db = [
    {
        "id": "fs-1",
        "name": "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)",
        "range": "SGNP Core Wildlife Range",
        "district": "Mumbai Suburban",
        "contact_person": "Chief Conservator of Forests & Field Director (Dr. S. K. Patil)",
        "phone": "+91 22 2886 0389",
        "radio_frequency": "152.450 MHz (Ch 2)",
        "response_time": "10 - 20 mins",
        "coverage_sectors": ["Borivali East Fringes", "Kanheri Foothills", "Dahisar Buffer", "WEH Green Belt"],
        "available": True,
        "latitude": 19.2288,
        "longitude": 72.9106,
        "active_officers": 18
    },
    {
        "id": "fs-2",
        "name": "Aarey Milk Colony Wildlife Leopard Rescue & Transit Post (Goregaon)",
        "range": "Aarey Forest & Wildlife Transit Range",
        "district": "Mumbai Suburban",
        "contact_person": "RRT Flying Squad Leader (Officer R. Deshmukh)",
        "phone": "+91 22 2685 8922",
        "radio_frequency": "154.200 MHz (Ch 4)",
        "response_time": "10 - 15 mins",
        "coverage_sectors": ["Aarey Units 1-32", "Film City Perimeter", "Goregaon East", "JVLR Transit Corridor"],
        "available": True,
        "latitude": 19.1485,
        "longitude": 72.8718,
        "active_officers": 14
    },
    {
        "id": "fs-3",
        "name": "Tulsi & Vihar Lake Catchment Protection Post (Mulund / Powai)",
        "range": "Eastern Water Catchment Range",
        "district": "Mumbai Suburban",
        "contact_person": "Range Forest Officer (Officer V. Shinde)",
        "phone": "+91 22 2568 4410",
        "radio_frequency": "156.125 MHz (Ch 1)",
        "response_time": "15 - 25 mins",
        "coverage_sectors": ["Powai Lake Fringes", "IIT Bombay Green Buffer", "Mulund West Foothills"],
        "available": True,
        "latitude": 19.1820,
        "longitude": 72.9350,
        "active_officers": 10
    },
    {
        "id": "fs-4",
        "name": "Mumbai Mangrove Conservation Cell & Marine Rescue Post (Bandra / Versova)",
        "range": "Coastal Mangrove Range",
        "district": "Mumbai Suburban",
        "contact_person": "Marine Biologist & Range Guard (Officer A. Kadam)",
        "phone": "+91 22 2655 1199",
        "radio_frequency": "151.875 MHz (Ch 3)",
        "response_time": "15 - 25 mins",
        "coverage_sectors": ["Bandra Creek", "Versova Mudflats", "Gorai Creek", "Charkop Wetlands"],
        "available": True,
        "latitude": 19.0596,
        "longitude": 72.8295,
        "active_officers": 8
    },
    {
        "id": "fs-5",
        "name": "Yeoor Hills Forest Range Station & Flying Squad (Thane West)",
        "range": "Yeoor Wildlife Range",
        "district": "Thane",
        "contact_person": "Range Forest Officer (Officer S. Gaikwad)",
        "phone": "+91 22 2542 1650",
        "radio_frequency": "153.600 MHz (Ch 5)",
        "response_time": "10 - 20 mins",
        "coverage_sectors": ["Upvan Lake Buffer", "Yeoor Hill Top", "Manpada Fringes", "Chena River"],
        "available": True,
        "latitude": 19.2183,
        "longitude": 72.9463,
        "active_officers": 15
    },
    {
        "id": "fs-6",
        "name": "Ghodbunder Road Forest Beat & Leopard Response Squad (Thane)",
        "range": "Ghodbunder Wildlife Corridor",
        "district": "Thane",
        "contact_person": "Beat Forest Officer (Officer K. Mhatre)",
        "phone": "+91 22 2597 3201",
        "radio_frequency": "155.050 MHz (Ch 6)",
        "response_time": "15 - 20 mins",
        "coverage_sectors": ["Ghodbunder Ghat Road", "Chena Creek", "Ovala Buffer", "Fountain Hotel Junction"],
        "available": True,
        "latitude": 19.2785,
        "longitude": 72.9240,
        "active_officers": 11
    },
    {
        "id": "fs-7",
        "name": "Mumbra & Parsik Range Forest Station (Kalyan / Mumbra)",
        "range": "Parsik Forest Range",
        "district": "Thane",
        "contact_person": "Range Officer (Officer P. Jadhav)",
        "phone": "+91 251 231 4455",
        "radio_frequency": "157.300 MHz (Ch 1)",
        "response_time": "15 - 25 mins",
        "coverage_sectors": ["Mumbra Bypass Ridge", "Shilphata Buffer", "Diva Green Sector"],
        "available": True,
        "latitude": 19.1760,
        "longitude": 73.0180,
        "active_officers": 9
    },
    {
        "id": "fs-8",
        "name": "Thane Creek Flamingo Sanctuary Command Post (Airoli / Vashi)",
        "range": "Flamingo Sanctuary & Marine Biodiversity Range",
        "district": "Navi Mumbai",
        "contact_person": "Wildlife Warden (Dr. M. More)",
        "phone": "+91 22 2779 1234",
        "radio_frequency": "158.420 MHz (Ch 2)",
        "response_time": "10 - 15 mins",
        "coverage_sectors": ["Airoli Coastal Boardwalk", "Vashi Creek Mudflats", "Palm Beach Mangroves"],
        "available": True,
        "latitude": 19.1623,
        "longitude": 72.9967,
        "active_officers": 12
    },
    {
        "id": "fs-9",
        "name": "Kharghar Hills & Parsik Forest Range Post (Kharghar)",
        "range": "Kharghar Valley Green Range",
        "district": "Navi Mumbai",
        "contact_person": "Beat Officer (Officer T. Sawant)",
        "phone": "+91 22 2774 8890",
        "radio_frequency": "155.800 MHz (Ch 3)",
        "response_time": "15 - 25 mins",
        "coverage_sectors": ["Kharghar Hills", "Central Park Buffer", "Belapur Ridge", "Owe Camp"],
        "available": True,
        "latitude": 19.0430,
        "longitude": 73.0670,
        "active_officers": 8
    },
    {
        "id": "fs-10",
        "name": "Tungareshwar Wildlife Sanctuary Range Office (Vasai-Virar)",
        "range": "Tungareshwar Range",
        "district": "Palghar",
        "contact_person": "Wildlife Ranger (Officer C. Patil)",
        "phone": "+91 250 258 7120",
        "radio_frequency": "152.125 MHz (Ch 1)",
        "response_time": "15 - 30 mins",
        "coverage_sectors": ["Vasai East Foothills", "Parol Corridor", "Pelhar Dam Buffer"],
        "available": True,
        "latitude": 19.4350,
        "longitude": 72.8870,
        "active_officers": 13
    },
    {
        "id": "fs-11",
        "name": "Manor Forest Beat Post & Flying Squad (Palghar)",
        "range": "Palghar West Range",
        "district": "Palghar",
        "contact_person": "RRT Officer (Officer G. Tare)",
        "phone": "+91 2525 244101",
        "radio_frequency": "154.650 MHz (Ch 2)",
        "response_time": "20 - 30 mins",
        "coverage_sectors": ["Vaitarna River Basin", "NH-48 Wildlife Transit Corridor", "Manor Buffer"],
        "available": True,
        "latitude": 19.6970,
        "longitude": 72.7680,
        "active_officers": 10
    },
    {
        "id": "fs-12",
        "name": "Karnala Bird Sanctuary Forest Command & RRT (Panvel)",
        "range": "Karnala Wildlife Range",
        "district": "Raigad",
        "contact_person": "Sanctuary Warden (Officer B. Pawar)",
        "phone": "+91 2143 277255",
        "radio_frequency": "153.800 MHz (Ch 1)",
        "response_time": "15 - 20 mins",
        "coverage_sectors": ["Mumbai-Goa NH-66 Corridor", "Karnala Fort Foothills", "Panvel Buffer"],
        "available": True,
        "latitude": 18.8894,
        "longitude": 73.1189,
        "active_officers": 12
    },
    {
        "id": "fs-13",
        "name": "Matheran Eco-Sensitive Forest Range Post (Neral / Matheran)",
        "range": "Matheran Hill Eco Range",
        "district": "Raigad",
        "contact_person": "Range Officer (Officer N. Kadam)",
        "phone": "+91 2148 230234",
        "radio_frequency": "156.400 MHz (Ch 2)",
        "response_time": "20 - 30 mins",
        "coverage_sectors": ["Matheran Ghat Road", "Charlotte Lake Buffer", "Neral Transit", "Panorama Point"],
        "available": True,
        "latitude": 18.9865,
        "longitude": 73.2680,
        "active_officers": 9
    },
    {
        "id": "fs-14",
        "name": "South Mumbai Mangrove & Coastal Patrol Center (Sewri / Dadar)",
        "range": "South Mumbai Coastal Range",
        "district": "Mumbai City",
        "contact_person": "Coastal Range Officer (Officer D. Solanki)",
        "phone": "+91 22 2414 7720",
        "radio_frequency": "151.450 MHz (Ch 1)",
        "response_time": "15 - 20 mins",
        "coverage_sectors": ["Sewri Mudflats", "Mahim Nature Park", "Mumbai Port Trust Buffer", "Dadar Chowpatty"],
        "available": True,
        "latitude": 18.9950,
        "longitude": 72.8550,
        "active_officers": 7
    }
]

# -------------------------------------------------------------
# DATABASE: Incident Reports (Tagged to specific Forest Offices)
# -------------------------------------------------------------
reports_db = [
    {
        "id": "rep-101",
        "title": "Fallen Banyan Tree & Vehicle Obstruction WEH Borivali",
        "category": "Road Accident",
        "severity": "High",
        "status": "In Progress",
        "description": "Large banyan branch collapsed across both north-bound lanes following heavy gust. Traffic slowed near Sanjay Gandhi National Park entry.",
        "location_name": "Western Express Highway, SGNP Borivali Buffer Zone",
        "latitude": 19.2288,
        "longitude": 72.8570,
        "incident_date": "2026-10-12T08:30:00Z",
        "reporter_name": "Citizen User",
        "user_email": "citizen@theraphylax.org",
        "created_at": "2026-10-12T08:35:00Z",
        "injuries_count": 0,
        "vehicles_involved": 2,
        "emergency_services_contacted": True,
        "tagged_forest_officers": [
            "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)",
            "Aarey Milk Colony Wildlife Leopard Rescue & Transit Post (Goregaon)"
        ],
        "forest_range": "SGNP Core Wildlife Range"
    },
    {
        "id": "rep-102",
        "title": "Injured Spotted Deer Trapped Near Aarey Colony Perimeter",
        "category": "Injured Animal",
        "severity": "Medium",
        "status": "Forest Officer Dispatched",
        "description": "Adult spotted deer with injured hind leg resting near northern village perimeter fencing in Aarey Unit 16. Requires rapid veterinary squad.",
        "location_name": "Aarey Colony Unit 16, Goregaon East",
        "latitude": 19.1550,
        "longitude": 72.8750,
        "incident_date": "2026-10-12T12:10:00Z",
        "reporter_name": "Priya Deshmukh",
        "user_email": "citizen@theraphylax.org",
        "created_at": "2026-10-12T12:15:00Z",
        "animal_type": "Spotted Deer",
        "animal_status": "injured",
        "reporter_safe": True,
        "tagged_forest_officers": [
            "Aarey Milk Colony Wildlife Leopard Rescue & Transit Post (Goregaon)",
            "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)"
        ],
        "forest_range": "Aarey Forest & Wildlife Transit Range"
    },
    {
        "id": "rep-103",
        "title": "Flash Waterlogging Under Ghodbunder Road Rail Underpass",
        "category": "Flooding & Waterlogging",
        "severity": "High",
        "status": "Under Review",
        "description": "Water accumulated up to 3 feet under underpass due to heavy rains and blocked stormwater drainage.",
        "location_name": "Ghodbunder Road Underpass, Thane Sector 3",
        "latitude": 19.2680,
        "longitude": 72.9340,
        "incident_date": "2026-10-12T14:05:00Z",
        "reporter_name": "Citizen User",
        "user_email": "citizen@theraphylax.org",
        "created_at": "2026-10-12T14:10:00Z",
        "injuries_count": 0,
        "vehicles_involved": 1,
        "emergency_services_contacted": False,
        "tagged_forest_officers": [
            "Ghodbunder Road Forest Beat & Leopard Response Squad (Thane)",
            "Yeoor Hills Forest Range Station & Flying Squad (Thane West)"
        ],
        "forest_range": "Ghodbunder Wildlife Corridor"
    },
    {
        "id": "rep-104",
        "title": "Landslide Debris & Boulder Spill on Yeoor Hills Ghat Bend",
        "category": "Natural Disaster",
        "severity": "Critical",
        "status": "In Progress",
        "description": "Rockfall and soil slide occurred along Yeoor Hills access road near Upvan lake buffer. Forestry clearance and JCB deployed.",
        "location_name": "Yeoor Hills Ghat Approach, Upvan Lake Sector",
        "latitude": 19.2230,
        "longitude": 72.9490,
        "incident_date": "2026-10-12T16:20:00Z",
        "reporter_name": "Anand Sawant",
        "user_email": "anand.sawant@gmail.com",
        "created_at": "2026-10-12T16:25:00Z",
        "injuries_count": 0,
        "vehicles_involved": 0,
        "emergency_services_contacted": True,
        "tagged_forest_officers": [
            "Yeoor Hills Forest Range Station & Flying Squad (Thane West)"
        ],
        "forest_range": "Yeoor Wildlife Range"
    },
    {
        "id": "rep-105",
        "title": "Leopard Sighting Crossing JVLR-Aarey Transit Corridor",
        "category": "Injured Animal",
        "severity": "High",
        "status": "Forest Officer Dispatched",
        "description": "Adult Indian Leopard observed safely crossing from SGNP ridge towards Aarey Unit 22. Night transit speed control active.",
        "location_name": "JVLR Green Corridor, Aarey Unit 22",
        "latitude": 19.1350,
        "longitude": 72.8820,
        "incident_date": "2026-10-12T17:15:00Z",
        "reporter_name": "Karan Kadam",
        "user_email": "citizen@theraphylax.org",
        "created_at": "2026-10-12T17:20:00Z",
        "animal_type": "Indian Leopard",
        "animal_status": "in_danger",
        "reporter_safe": True,
        "tagged_forest_officers": [
            "Aarey Milk Colony Wildlife Leopard Rescue & Transit Post (Goregaon)",
            "Tulsi & Vihar Lake Catchment Protection Post (Mulund / Powai)"
        ],
        "forest_range": "Aarey Forest & Wildlife Transit Range"
    },
    {
        "id": "rep-106",
        "title": "Vihar Lake Catchment Overflow Bank Erosion",
        "category": "Flooding & Waterlogging",
        "severity": "High",
        "status": "Under Review",
        "description": "Surging spillway current causing bund erosion along Mulund West fringe trail. Patrol team dispatched.",
        "location_name": "Vihar Lake Catchment, Mulund Foothills",
        "latitude": 19.1820,
        "longitude": 72.9350,
        "incident_date": "2026-10-12T18:00:00Z",
        "reporter_name": "Citizen User",
        "user_email": "citizen@theraphylax.org",
        "created_at": "2026-10-12T18:05:00Z",
        "tagged_forest_officers": [
            "Tulsi & Vihar Lake Catchment Protection Post (Mulund / Powai)"
        ],
        "forest_range": "Eastern Water Catchment Range"
    }
]

# -------------------------------------------------------------
# DATABASE: Public Safety Updates & Geofenced Notices
# -------------------------------------------------------------
updates_db = [
    {
        "id": "up-101",
        "title": "Road Debris Cleared & WEH Borivali Lanes Fully Reopened",
        "category": "Cleanup Progress",
        "severity": "Medium",
        "message": "Forest patrol and BMC emergency squads have cleared the fallen banyan branch on the Western Express Highway near SGNP gate. All lanes moving smoothly.",
        "location": "Western Express Highway, SGNP Borivali Buffer",
        "latitude": 19.2288,
        "longitude": 72.8570,
        "radius_km": 3.5,
        "target_regions": ["SGNP Borivali Buffer", "WEH Green Belt", "Aarey Units 1-32"],
        "created_at": "2026-10-12T10:00:00Z",
        "author": "Officer S. Patil (SGNP Command)",
        "author_role": "Forest Range Officer"
    },
    {
        "id": "up-102",
        "title": "Wildlife Movement Advisory: Active Leopard Activity in Aarey Colony",
        "category": "Wildlife Hazard",
        "severity": "High",
        "message": "Active leopard movement confirmed between Aarey Unit 16 and JVLR green belt. Two-wheeler motorists and night pedestrians are advised to stick to main illuminated routes.",
        "location": "Aarey Milk Colony & Film City Perimeter",
        "latitude": 19.1485,
        "longitude": 72.8718,
        "radius_km": 4.5,
        "target_regions": ["Aarey Units 1-32", "Film City Perimeter", "JVLR Transit Corridor"],
        "created_at": "2026-10-12T15:30:00Z",
        "author": "Ranger R. Deshmukh",
        "author_role": "Wildlife Rapid Response Lead"
    },
    {
        "id": "up-103",
        "title": "Flash Waterlogging Advisory: Ghodbunder & Thane Creek Buffer",
        "category": "Flood Warning",
        "severity": "Critical",
        "message": "Heavy monsoon high-tide alert along Thane Creek and Ghodbunder low-lying underpasses. Heavy vehicles advised to divert via Eastern Express Highway.",
        "location": "Ghodbunder Road & Thane Creek Corridor",
        "latitude": 19.2785,
        "longitude": 72.9240,
        "radius_km": 5.0,
        "target_regions": ["Ghodbunder Ghat Road", "Thane Creek Flamingo Sanctuary", "Upvan Lake Buffer"],
        "created_at": "2026-10-12T18:00:00Z",
        "author": "Disaster Response Officer S. Gaikwad",
        "author_role": "Emergency Incident Commander"
    }
]

alerts_db = [
    {
        "id": "alt-1",
        "title": "Critical Flash Flood & High-Tide Advisory - Ghodbunder Corridor",
        "severity": "Critical",
        "message": "Heavy localized monsoon downpour coinciding with high tide along Thane Creek. Low-lying areas under cautionary watch.",
        "location": "Ghodbunder Road & Thane Buffer Zone",
        "radius_km": 5.0,
        "source": "Disaster Management & Forest Command (MMR)",
        "created_at": "2026-10-12T14:00:00Z",
        "valid_until": "2026-10-14T18:00:00Z",
        "delivery_status": "Delivered to registered residents in Mumbai Suburban & Thane"
    }
]

forest_dispatches_db = [
    {
        "id": "disp-1",
        "incident_id": "rep-102",
        "station_id": "fs-2",
        "station_name": "Aarey Milk Colony Wildlife Leopard Rescue & Transit Post (Goregaon)",
        "animal_type": "Spotted Deer",
        "location_name": "Aarey Colony Unit 16, Goregaon East",
        "status": "Officer Dispatched",
        "reporter_name": "Priya Deshmukh",
        "reporter_phone": "+91 98200 12345",
        "notes": "Citizen report of injured deer tagged to Aarey RRT. Veterinary rescue squad en route.",
        "created_at": "2026-10-12T12:20:00Z"
    }
]

emergency_contacts_db = [
    {
        "id": "ec-1",
        "name": "National Emergency Unified Helpline",
        "number": "112",
        "category": "General Emergency",
        "coverage": "Mumbai & Pan-India",
        "verified": True,
        "description": "Single unified number for Mumbai Police, Fire Brigade, and Ambulance."
    },
    {
        "id": "ec-2",
        "name": "BMC Disaster Management Control Room",
        "number": "1916",
        "category": "Disaster Response & Flooding",
        "coverage": "Mumbai City & Suburban",
        "verified": True,
        "description": "Brihanmumbai Municipal Corporation 24x7 flood, tree-fall, and cyclone helpline."
    },
    {
        "id": "ec-3",
        "name": "Maharashtra Forest Department Toll-Free Helpline (Van Vibhag)",
        "number": "1926",
        "category": "Wildlife Rescue & Forest Guard",
        "coverage": "Maharashtra / Mumbai Region",
        "verified": True,
        "description": "24x7 control room for leopard sightings, snake rescue, and forest emergencies."
    },
    {
        "id": "ec-4",
        "name": "SGNP Borivali Forest Control Room",
        "number": "+91 22 2886 0389",
        "category": "Wildlife Rescue & Forest Guard",
        "coverage": "Sanjay Gandhi National Park & Aarey Buffer",
        "verified": True,
        "description": "Direct hotline to Chief Conservator of Forests & Rescue Squad."
    },
    {
        "id": "ec-5",
        "name": "Thane Disaster Management Cell & Forest Control",
        "number": "+91 22 2542 1650",
        "category": "Disaster Response",
        "coverage": "Thane, Yeoor Hills & Ghodbunder",
        "verified": True,
        "description": "District flood, landslide, and Yeoor Hills wildlife emergency response."
    }
]

# Registered users in memory (Dynamic user registrations)
users_db = []

# Pydantic Schemas
class ReportCreate(BaseModel):
    title: str
    category: str
    description: str
    severity: str = "Medium"
    incident_date: Optional[str] = None
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    evidence_image_url: Optional[str] = None
    reporter_name: Optional[str] = "Citizen User"
    user_email: Optional[str] = "citizen@theraphylax.org"
    injuries_count: Optional[int] = 0
    vehicles_involved: Optional[int] = 1
    emergency_services_contacted: Optional[bool] = False
    animal_type: Optional[str] = None
    animal_status: Optional[str] = None
    reporter_safe: Optional[bool] = True
    tagged_forest_officers: Optional[List[str]] = Field(default_factory=list)
    forest_range: Optional[str] = "SGNP Core Wildlife Range"

class StatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class AlertCreate(BaseModel):
    title: str
    severity: str
    message: str
    location: str
    radius_km: Optional[float] = 5.0
    valid_until: Optional[str] = None
    source: Optional[str] = "Forest Command"

class PublicUpdateCreate(BaseModel):
    title: str
    category: str
    severity: Optional[str] = "Medium"
    message: str
    location: Optional[str] = None
    latitude: Optional[float] = 11.6054
    longitude: Optional[float] = 76.0830
    radius_km: Optional[float] = 3.0
    target_regions: Optional[List[str]] = Field(default_factory=lambda: ["All Regions"])
    author: Optional[str] = "Forest Command Officer"
    author_role: Optional[str] = "Forest Range Officer"

class AuthLoginRequest(BaseModel):
    email: str
    password: str

class AuthRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Citizen"
    district: Optional[str] = None
    assigned_station: Optional[str] = None
    badge_number: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    assigned_station: Optional[str] = None
    badge_number: Optional[str] = None


@app.get("/")
def home():
    return {
        "message": "TheraPhylax Multi-Role Emergency & Forest Patrol API is running!",
        "version": "0.3.0",
        "forest_stations_count": len(forest_stations_db),
        "active_reports": len(reports_db)
    }

@app.get("/health")
def health():
    return {"status": "healthy", "cognito_region": "ap-south-1"}

# Auth endpoints
@app.post("/auth/login")
def login(payload: AuthLoginRequest):
    # Match user in users_db
    for u in users_db:
        if u["email"].lower() == payload.email.lower() and u["password"] == payload.password:
            return {
                "token": f"token-{uuid.uuid4().hex}",
                "user": {
                    "email": u["email"],
                    "name": u["name"],
                    "role": u.get("role", "Citizen"),
                    "district": u.get("district"),
                    "assigned_station": u.get("assigned_station"),
                    "badge_number": u.get("badge_number")
                }
            }
    
    # Check if this is an existing user with wrong password
    for u in users_db:
        if u["email"].lower() == payload.email.lower():
            raise HTTPException(status_code=401, detail="Incorrect password for this account.")
            
    # For local convenience if not in users_db yet, auto-register
    new_user = {
        "email": payload.email,
        "password": payload.password,
        "name": payload.email.split("@")[0].replace(".", " ").title(),
        "role": "Citizen",
        "district": None,
        "assigned_station": None
    }
    users_db.append(new_user)
    return {
        "token": f"token-{uuid.uuid4().hex}",
        "user": new_user
    }

@app.post("/auth/register")
def register(payload: AuthRegisterRequest):
    for u in users_db:
        if u["email"].lower() == payload.email.lower():
            raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = {
        "email": payload.email,
        "password": payload.password,
        "name": payload.name,
        "role": payload.role or "Citizen",
        "district": payload.district,
        "assigned_station": payload.assigned_station,
        "badge_number": payload.badge_number
    }
    users_db.append(new_user)
    return {
        "success": True,
        "message": "Account created successfully!",
        "user": {
            "email": new_user["email"],
            "name": new_user["name"],
            "role": new_user["role"],
            "district": new_user["district"],
            "assigned_station": new_user["assigned_station"],
            "badge_number": new_user["badge_number"]
        }
    }

@app.get("/auth/me")
def get_current_user():
    if users_db:
        return users_db[-1]
    return {"name": "User", "email": "user@theraphylax.org", "role": "Citizen", "assigned_station": None}

@app.put("/auth/profile")
def update_profile(payload: ProfileUpdateRequest):
    target = None
    if users_db:
        target = users_db[-1]
    else:
        target = {"email": "user@theraphylax.org", "name": "User", "role": "Citizen"}
        users_db.append(target)
    
    for key, val in payload.dict(exclude_unset=True).items():
        if val is not None:
            target[key] = val
            
    return {"success": True, "message": "Profile updated successfully!", "user": target}

# Reports Endpoints
@app.get("/reports")
def get_reports(
    category: Optional[str] = None,
    status: Optional[str] = None,
    user_email: Optional[str] = None,
    station: Optional[str] = None
):
    res = reports_db
    if category and category.lower() != "all":
        res = [r for r in res if r.get("category", "").lower() == category.lower()]
    if status and status.lower() != "all":
        res = [r for r in res if r.get("status", "").lower() == status.lower()]
    if user_email:
        res = [r for r in res if r.get("user_email", "").lower() == user_email.lower()]
    if station and station.lower() != "all":
        res = [
            r for r in res
            if r.get("tagged_forest_officers") and any(station.lower() in o.lower() for o in r["tagged_forest_officers"])
        ]
    return res

@app.get("/reports/{report_id}")
def get_report_by_id(report_id: str):
    for r in reports_db:
        if r["id"] == report_id:
            return r
    raise HTTPException(status_code=404, detail="Incident report not found")

@app.post("/reports")
def create_report(payload: ReportCreate):
    new_id = f"rep-{uuid.uuid4().hex[:6]}"
    new_report = {
        "id": new_id,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "status": "Pending Review",
        **payload.dict()
    }

    # If Forest Officers are tagged or category is Injured Animal, automatically dispatch to Forest Patrol
    if payload.tagged_forest_officers or payload.category == "Injured Animal":
        new_report["status"] = "Forest Officer Dispatched"
        dispatch_item = {
            "id": f"disp-{uuid.uuid4().hex[:6]}",
            "incident_id": new_id,
            "station_name": payload.tagged_forest_officers[0] if payload.tagged_forest_officers else "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)",
            "animal_type": payload.animal_type or "Wildlife Incident",
            "location_name": payload.location_name,
            "status": "Officer Dispatched",
            "reporter_name": payload.reporter_name,
            "reporter_phone": "+91 Verified Contact",
            "notes": payload.description,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        forest_dispatches_db.insert(0, dispatch_item)

    reports_db.insert(0, new_report)
    return new_report

@app.patch("/reports/{report_id}/status")
def update_report_status(report_id: str, payload: StatusUpdate):
    for r in reports_db:
        if r["id"] == report_id:
            r["status"] = payload.status
            if payload.notes:
                r["officer_notes"] = payload.notes
            return r
    raise HTTPException(status_code=404, detail="Report not found")

# Alerts Endpoints
@app.get("/alerts")
def get_alerts():
    return alerts_db

@app.post("/alerts")
def create_alert(payload: AlertCreate):
    new_alert = {
        "id": f"alt-{uuid.uuid4().hex[:6]}",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "delivery_status": f"Saved & Broadcast to region {payload.location} ({payload.radius_km} km radius)",
        **payload.dict()
    }
    alerts_db.insert(0, new_alert)
    return new_alert

# Public Safety Updates Endpoints
@app.get("/updates")
def get_public_updates():
    return updates_db

@app.post("/updates")
def create_public_update(payload: PublicUpdateCreate):
    new_update = {
        "id": f"up-{uuid.uuid4().hex[:6]}",
        "created_at": datetime.utcnow().isoformat() + "Z",
        **payload.dict()
    }
    updates_db.insert(0, new_update)
    return new_update

# Emergency Contacts
@app.get("/emergency-contacts")
def get_emergency_contacts():
    return emergency_contacts_db

# Forest Stations, Districts & Dispatches
@app.get("/forest/districts")
def get_forest_districts():
    districts = sorted(list(set([s["district"] for s in forest_stations_db if "district" in s])))
    return districts

@app.get("/forest/stations")
def get_forest_stations(district: Optional[str] = None):
    if district and district.strip() and district.lower() != "all":
        return [s for s in forest_stations_db if s.get("district", "").lower() == district.strip().lower()]
    return forest_stations_db

@app.get("/forest/dispatches")
def get_forest_dispatches():
    return forest_dispatches_db

@app.get("/dashboard/stats")
def get_dashboard_stats():
    return {
        "total_reports": len(reports_db),
        "open_reports": len([r for r in reports_db if r["status"] not in ["Resolved", "Dismissed"]]),
        "resolved_reports": len([r for r in reports_db if r["status"] == "Resolved"]),
        "active_alerts": len(alerts_db),
        "active_updates": len(updates_db),
        "forest_stations": len(forest_stations_db),
        "dispatched_forest_patrols": len([d for d in forest_dispatches_db if d["status"] == "Officer Dispatched"])
    }
