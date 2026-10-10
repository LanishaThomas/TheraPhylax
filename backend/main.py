from fastapi import FastAPI, HTTPException, Query, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

app = FastAPI(
    title="TheraPhylax API",
    description="Multi-Role Disaster Reporting, Geofencing & Emergency Response Platform",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Database Stores (Development & Deployment fallback)
reports_db = [
    {
        "id": "rep-101",
        "title": "Fallen Tree Blocking Highway Sector 4",
        "category": "Fallen Trees & Blocked Roads",
        "severity": "High",
        "status": "In Progress",
        "description": "Large oak tree collapsed across both lanes following heavy storm. Traffic halted.",
        "location_name": "Highway 17, Sector 4 Buffer Zone",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "incident_date": "2026-10-10T18:30:00Z",
        "reporter_name": "Amit Patel",
        "user_email": "citizen@theraphylax.org",
        "created_at": "2026-10-10T18:35:00Z",
        "injuries": "None reported",
        "vehicles_involved": 1,
        "emergency_services_contacted": True
    },
    {
        "id": "rep-102",
        "title": "Injured Spotted Deer Near Forest Edge",
        "category": "Injured Animal",
        "severity": "Medium",
        "status": "Pending Review",
        "description": "Adult spotted deer with injured hind leg resting near northern village perimeter fencing.",
        "location_name": "North Fringe Road, Wayanad Sector B",
        "latitude": 11.6054,
        "longitude": 76.0830,
        "incident_date": "2026-10-10T21:10:00Z",
        "reporter_name": "Priya Nair",
        "user_email": "priya@example.com",
        "created_at": "2026-10-10T21:15:00Z",
        "animal_type": "Spotted Deer",
        "animal_condition": "Injured, trapped near fence",
        "safe_to_remain": True
    },
    {
        "id": "rep-103",
        "title": "Flash Waterlogging Under Railway Bridge",
        "category": "Flooding & Waterlogging",
        "severity": "High",
        "status": "Under Review",
        "description": "Water accumulated up to 3 feet under underpass due to blocked drain.",
        "location_name": "Central Railway Underpass",
        "latitude": 19.0820,
        "longitude": 72.8900,
        "incident_date": "2026-10-11T00:05:00Z",
        "reporter_name": "Rahul Sharma",
        "user_email": "rahul@example.com",
        "created_at": "2026-10-11T00:10:00Z"
    }
]

alerts_db = [
    {
        "id": "alt-1",
        "title": "Critical Flash Flood Advisory - Sector 4",
        "severity": "Critical",
        "message": "Heavy localized rainfall expected to cause flash waterlogging in low-lying buffer zones. Evacuate livestock to higher ground.",
        "location": "North River Basin & Sector 4",
        "radius_km": 5.0,
        "source": "Disaster Management Cell",
        "created_at": "2026-10-10T14:00:00Z",
        "valid_until": "2026-10-12T18:00:00Z",
        "delivery_status": "Delivered to 142 nearby registered users"
    }
]

updates_db = [
    {
        "id": "up-1",
        "title": "Road Debris Cleared on Highway 17",
        "category": "Cleanup Progress",
        "message": "Forest patrol units have removed the fallen tree on Highway 17. One lane is now reopened for traffic.",
        "location": "Highway 17, Sector 4",
        "created_at": "2026-10-11T00:00:00Z",
        "author": "Officer V. Kumar"
    },
    {
        "id": "up-2",
        "title": "Wildlife Movement Advisory: Evening Hours",
        "category": "Safety Advisory",
        "message": "Elevated elephant movement observed near East Ridge between 18:00 and 22:00. Commuters advised to avoid forest fringe road.",
        "location": "East Ridge Sector B",
        "created_at": "2026-10-10T16:00:00Z",
        "author": "Forest Control Officer"
    }
]

ngos_db = [
    {
        "id": "ngo-1",
        "name": "Wildlife Emergency Rescue Trust",
        "verified": True,
        "services": ["Animal Rescue", "Veterinary Support", "Wildlife Transport"],
        "coverage_radius": "25 km",
        "location": "Mumbai North & Forest Fringe",
        "phone": "+91 98200 11223",
        "email": "rescue@wildlife-ert.org",
        "operating_hours": "24/7 Emergency Dispatch",
        "available": True,
        "accepting_requests": True
    },
    {
        "id": "ngo-2",
        "name": "Compassion Animal Welfare Society",
        "verified": True,
        "services": ["Domestic Animal Rescue", "First Aid", "Temporary Shelter"],
        "coverage_radius": "15 km",
        "location": "Central District",
        "phone": "+91 98111 44556",
        "email": "contact@caws-india.org",
        "operating_hours": "08:00 AM - 08:00 PM",
        "available": True,
        "accepting_requests": True
    }
]

ngo_requests_db = [
    {
        "id": "req-1",
        "incident_id": "rep-102",
        "ngo_id": "ngo-1",
        "ngo_name": "Wildlife Emergency Rescue Trust",
        "animal_type": "Spotted Deer",
        "location_name": "North Fringe Road, Wayanad Sector B",
        "status": "Pending Review",
        "reporter_name": "Priya Nair",
        "reporter_phone": "+91 98765 00000",
        "notes": "Citizen reported injured deer near village boundary fence.",
        "created_at": "2026-10-10T21:20:00Z"
    }
]

emergency_contacts_db = [
    {
        "id": "ec-1",
        "name": "National Emergency Unified Helpline",
        "number": "112",
        "category": "General Emergency",
        "coverage": "Pan-India",
        "verified": True,
        "description": "Single unified number for Police, Fire, and Ambulance."
    },
    {
        "id": "ec-2",
        "name": "National Medical & Ambulance Service",
        "number": "108",
        "category": "Ambulance & Medical",
        "coverage": "Pan-India / State Health",
        "verified": True,
        "description": "Free emergency medical transportation service."
    },
    {
        "id": "ec-3",
        "name": "State Forest Wildlife Conflict Helpline",
        "number": "1800-425-WILD (9453)",
        "category": "Wildlife Rescue & Forest Guard",
        "coverage": "Forest Buffer Sectors",
        "verified": True,
        "description": "24x7 control room for leopard, elephant, and wild animal sightings."
    },
    {
        "id": "ec-4",
        "name": "Disaster Management Control Room",
        "number": "1077",
        "category": "Disaster Response",
        "coverage": "District Level",
        "verified": True,
        "description": "District collectorate flood, cyclone, and hazard control."
    }
]


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
    injuries: Optional[str] = None
    vehicles_involved: Optional[int] = None
    emergency_services_contacted: Optional[bool] = None
    animal_type: Optional[str] = None
    animal_condition: Optional[str] = None
    safe_to_remain: Optional[bool] = None

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
    message: str
    location: Optional[str] = None

class NgoRequestCreate(BaseModel):
    incident_id: str
    ngo_id: str
    notes: Optional[str] = None


@app.get("/")
def home():
    return {
        "message": "TheraPhylax Multi-Role Emergency API is running!",
        "version": "0.2.0",
    }

@app.get("/health")
def health():
    return {"status": "healthy", "cognito_region": "ap-south-1"}

# Reports Endpoints
@app.get("/reports")
def get_reports(category: Optional[str] = None, status: Optional[str] = None):
    res = reports_db
    if category and category.lower() != "all":
        res = [r for r in res if r.get("category", "").lower() == category.lower()]
    if status and status.lower() != "all":
        res = [r for r in res if r.get("status", "").lower() == status.lower()]
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
    reports_db.insert(0, new_report)

    # If it's an injured animal report, auto-create an NGO request
    if payload.category == "Injured Animal":
        ngo_req = {
            "id": f"req-{uuid.uuid4().hex[:6]}",
            "incident_id": new_id,
            "ngo_id": "ngo-1",
            "ngo_name": "Wildlife Emergency Rescue Trust",
            "animal_type": payload.animal_type or "Injured Animal",
            "location_name": payload.location_name,
            "status": "Pending Review",
            "reporter_name": payload.reporter_name,
            "reporter_phone": "+91 Verified Contact",
            "notes": payload.description,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        ngo_requests_db.insert(0, ngo_req)

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

# Public Updates Endpoints
@app.get("/updates")
def get_public_updates():
    return updates_db

@app.post("/updates")
def create_public_update(payload: PublicUpdateCreate):
    new_update = {
        "id": f"up-{uuid.uuid4().hex[:6]}",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "author": "Officer Command",
        **payload.dict()
    }
    updates_db.insert(0, new_update)
    return new_update

# Emergency Contacts
@app.get("/emergency-contacts")
def get_emergency_contacts():
    return emergency_contacts_db

# NGO Directory & Requests
@app.get("/ngos")
def get_ngos():
    return ngos_db

@app.get("/ngos/matches")
def get_matching_ngos(location: Optional[str] = None):
    return ngos_db

@app.get("/ngo/requests")
def get_ngo_requests():
    return ngo_requests_db

@app.patch("/ngo/requests/{req_id}/status")
def update_ngo_request_status(req_id: str, payload: StatusUpdate):
    for req in ngo_requests_db:
        if req["id"] == req_id:
            req["status"] = payload.status
            if payload.notes:
                req["response_notes"] = payload.notes
            return req
    raise HTTPException(status_code=404, detail="NGO rescue request not found")

@app.get("/dashboard/stats")
def get_dashboard_stats():
    return {
        "total_reports": len(reports_db),
        "open_reports": len([r for r in reports_db if r["status"] not in ["Resolved", "Dismissed"]]),
        "resolved_reports": len([r for r in reports_db if r["status"] == "Resolved"]),
        "active_alerts": len(alerts_db),
        "active_ngos": len(ngos_db),
        "pending_rescues": len([req for req in ngo_requests_db if req["status"] == "Pending Review"])
    }
