from fastapi import FastAPI, HTTPException, Query, Body, Depends, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid
import math
import os
import json
import logging
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError
from sqlalchemy.orm import Session

from database import (
    get_db,
    init_db,
    SessionLocal,
    ReportDB,
    ForestStationDB,
    SafetyUpdateDB,
    GeofencedAlertDB,
    ForestDispatchDB,
    EmergencyContactDB,
)

logger = logging.getLogger("theraphylax")
logging.basicConfig(level=logging.INFO)

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
# AWS CONFIGURATION (S3, SSM, SNS, SES & DynamoDB User Profiles)
# -------------------------------------------------------------
AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
AWS_SNS_TOPIC_ARN = os.environ.get(
    "AWS_SNS_TOPIC_ARN",
    "arn:aws:sns:ap-south-1:179895364119:TheraPhylax-HighSeverity-Alerts"
)
AWS_SES_SENDER = os.environ.get("AWS_SES_SENDER", "alerts@theraphylax.org")
AWS_DYNAMODB_USERS_TABLE = os.environ.get("AWS_DYNAMODB_USERS_TABLE", "theraphylax-user-profiles")
AWS_COGNITO_USER_POOL_ID = os.environ.get("AWS_COGNITO_USER_POOL_ID", "ap-south-1_bYXlwb8fm")
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "theraphylax-evidence-179895364119")

# AWS S3 Client for Photographic Evidence Storage
try:
    s3_client = boto3.client("s3", region_name=AWS_REGION)
    logger.info(f"Connected to AWS S3 bucket: {S3_BUCKET_NAME} ({AWS_REGION})")
except Exception as e:
    logger.warning(f"Failed to initialize AWS S3 client: {e}")
    s3_client = None

# AWS Systems Manager (SSM) Parameter Store Client
try:
    ssm_client = boto3.client("ssm", region_name=AWS_REGION)
    logger.info(f"Connected to AWS Systems Manager (SSM) Parameter Store ({AWS_REGION})")
except Exception as e:
    logger.warning(f"Failed to initialize AWS SSM client: {e}")
    ssm_client = None

try:
    sns_client = boto3.client("sns", region_name=AWS_REGION)
except Exception as e:
    logger.warning(f"Failed to initialize AWS SNS client: {e}")
    sns_client = None

try:
    ses_client = boto3.client("ses", region_name=AWS_REGION)
except Exception as e:
    logger.warning(f"Failed to initialize AWS SES client: {e}")
    ses_client = None

try:
    dynamodb_resource = boto3.resource("dynamodb", region_name=AWS_REGION)
    dynamodb_users_table = dynamodb_resource.Table(AWS_DYNAMODB_USERS_TABLE)
    logger.info(f"Connected to AWS DynamoDB table: {AWS_DYNAMODB_USERS_TABLE} ({AWS_REGION})")
except Exception as e:
    logger.warning(f"Failed to initialize AWS DynamoDB table: {e}")
    dynamodb_users_table = None

try:
    cognito_idp_client = boto3.client("cognito-idp", region_name=AWS_REGION)
except Exception as e:
    logger.warning(f"Failed to initialize AWS Cognito IDP client: {e}")
    cognito_idp_client = None


def assign_cognito_group(email: str, role: str):
    """Assigns user to the appropriate AWS Cognito User Group ('Officers' or 'Citizens')."""
    if not cognito_idp_client or not AWS_COGNITO_USER_POOL_ID or not email:
        return
    try:
        group_name = "Officers" if (role or "").lower() == "officer" else "Citizens"
        other_group = "Citizens" if group_name == "Officers" else "Officers"
        cognito_idp_client.admin_add_user_to_group(
            UserPoolId=AWS_COGNITO_USER_POOL_ID,
            Username=email.strip(),
            GroupName=group_name
        )
        logger.info(f"Assigned {email} to AWS Cognito User Group: {group_name}")
        # Clean up opposite group if user switched roles
        try:
            cognito_idp_client.admin_remove_user_from_group(
                UserPoolId=AWS_COGNITO_USER_POOL_ID,
                Username=email.strip(),
                GroupName=other_group
            )
        except Exception:
            pass
    except Exception as e:
        logger.debug(f"Cognito group assignment note for {email}: {e}")


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    try:
        R = 6371.0  # Earth radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 2)
    except Exception:
        return 999.0


def get_verified_ses_sender() -> str:
    """Finds a verified sender email in AWS SES to prevent MessageRejected error in sandbox mode."""
    if not ses_client:
        return AWS_SES_SENDER
    try:
        identities_resp = ses_client.list_identities(IdentityType="EmailAddress")
        identities = identities_resp.get("Identities", [])
        if identities:
            attrs_resp = ses_client.get_identity_verification_attributes(Identities=identities)
            attrs = attrs_resp.get("VerificationAttributes", {})
            for email, data in attrs.items():
                if data.get("VerificationStatus") == "Success":
                    return email
    except Exception as e:
        logger.warning(f"Error checking SES verified identities: {e}")
    return AWS_SES_SENDER


def dispatch_emergency_email(
    user_email: str, user_name: str, alert_data: dict, distance_km: float
) -> dict:
    """
    Dispatches a high-priority emergency email via AWS SES / SNS.
    Color codes priority as HIGH (#EF4444) in the HTML template.
    """
    subject = f"[CRITICAL HIGH PRIORITY ALERT] {alert_data.get('title', 'Emergency Alert')}"
    location = alert_data.get("location", "Mumbai Metropolitan Region")
    radius = alert_data.get("radius_km", 5.0)
    message = alert_data.get("message", "Emergency incident reported in your area.")
    source = alert_data.get("source", "Forest Command & Disaster Management (MMR)")

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 2.5px solid #EF4444; border-radius: 14px; overflow: hidden; background-color: #FFFFFF; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.15);">
      <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: #FFFFFF; padding: 22px 26px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="background-color: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.4); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase;">
            🚨 PRIORITY: HIGH / CRITICAL
          </span>
          <span style="font-size: 12px; font-weight: 600; opacity: 0.9;">GEOFENCE BROADCAST</span>
        </div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.3;">
          {alert_data.get('title', 'Emergency Geofence Warning')}
        </h1>
      </div>

      <div style="padding: 24px 26px;">
        <p style="font-size: 15px; color: #1F2937; margin-top: 0; line-height: 1.6;">
          Attention <strong>{user_name}</strong>, a high-severity emergency alert has been officially issued for your geofenced area in Mumbai Metropolitan Region.
        </p>

        <div style="background-color: #FEF2F2; border-left: 5px solid #EF4444; border-radius: 8px; padding: 16px 18px; margin: 18px 0;">
          <div style="color: #991B1B; font-weight: 700; font-size: 13px; text-transform: uppercase; margin-bottom: 6px;">
            ⚠️ Incident Description & Directives:
          </div>
          <div style="color: #374151; font-size: 14px; line-height: 1.6;">
            {message}
          </div>
        </div>

        <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #6B7280; width: 150px;"><strong>Geofence Epicenter:</strong></td>
              <td style="padding: 6px 0; color: #111827; font-weight: 600;">{location}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280;"><strong>Your Proximity:</strong></td>
              <td style="padding: 6px 0; color: #DC2626; font-weight: 700;">Approx. {distance_km} km away (INSIDE ACTIVE GEOFENCE)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280;"><strong>Fenced Radius:</strong></td>
              <td style="padding: 6px 0; color: #111827; font-weight: 600;">{radius} km perimeter</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280;"><strong>Issuing Authority:</strong></td>
              <td style="padding: 6px 0; color: #111827;">{source}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280;"><strong>Delivery Policy:</strong></td>
              <td style="padding: 6px 0; color: #047857; font-weight: 600;">In-App Push + Email (High Severity Trigger)</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #F3F4F6; border-radius: 10px; padding: 14px 18px; margin-top: 20px;">
          <h4 style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #1F2937;">Emergency Helplines (Mumbai & MMR):</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: #4B5563;">
            <div>• BMC Disaster Mgmt: <strong>1916</strong></div>
            <div>• Van Vibhag (Forest): <strong>1926</strong></div>
            <div>• SGNP Borivali Control: <strong>022 2886 0389</strong></div>
            <div>• Unified Emergency: <strong>112</strong></div>
          </div>
        </div>
      </div>

      <div style="background-color: #111827; color: #9CA3AF; padding: 14px 26px; font-size: 11px; text-align: center; border-top: 1px solid #1F2937;">
        TheraPhylax Geofenced Emergency Broadcast • Powered by AWS SES & SNS in {AWS_REGION}
      </div>
    </div>
    """

    # 1. Attempt AWS SES direct sending
    ses_sent = False
    ses_error = None
    if ses_client:
        active_sender = get_verified_ses_sender()
        try:
            ses_client.send_email(
                Source=active_sender,
                Destination={"ToAddresses": [user_email]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {
                        "Html": {"Data": html_body, "Charset": "UTF-8"},
                        "Text": {
                            "Data": f"{subject}\n\n{message}\n\nLocation: {location}\nYour Distance: {distance_km} km\nFenced Perimeter: {radius} km",
                            "Charset": "UTF-8",
                        },
                    },
                },
            )
            ses_sent = True
            logger.info(f"AWS SES sent emergency email to {user_email} from {active_sender}")
        except Exception as e:
            ses_error = str(e)
            logger.warning(f"AWS SES direct send to {user_email} notice: {e}")

    # 2. Attempt AWS SNS topic publish for notification broadcast
    sns_published = False
    if sns_client and AWS_SNS_TOPIC_ARN:
        try:
            sns_client.publish(
                TopicArn=AWS_SNS_TOPIC_ARN,
                Subject=f"ALERT: {alert_data.get('title', '')[:80]}",
                Message=f"[HIGH SEVERITY ALERT - GEOFENCE ACTIVATED]\n\n{alert_data.get('title')}\n\n{message}\n\nLocation: {location}\nPerimeter: {radius} km\nRecipient: {user_email}",
            )
            sns_published = True
            logger.info(f"AWS SNS published alert to {AWS_SNS_TOPIC_ARN}")
        except Exception as e:
            logger.warning(f"AWS SNS publish notice: {e}")

    status_desc = "Dispatched via AWS SES / SNS to " + user_email if (ses_sent or sns_published) else f"AWS delivery notice: {ses_error or 'SES verification required'}"

    return {
        "recipient": user_email,
        "ses_sent": ses_sent,
        "sns_published": sns_published,
        "status": status_desc,
        "ses_error": ses_error,
    }


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
        "reporter_name": "Citizen Reporter",
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

alerts_db = []

forest_dispatches_db = [
    {
        "id": "disp-1",
        "incident_id": "rep-102",
        "station_id": "fs-2",
        "station_name": "Aarey Milk Colony Wildlife Leopard Rescue & Transit Post (Goregaon)",
        "animal_type": "Spotted Deer",
        "location_name": "Aarey Colony Unit 16, Goregaon East",
        "status": "Officer Dispatched",
        "reporter_name": "Citizen Reporter",
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

# -------------------------------------------------------------
# DATABASE: AWS DynamoDB User Profiles (Zero Passwords Stored)
# -------------------------------------------------------------
DEFAULT_USERS_SEED = [
    {
        "id": "usr-default",
        "email": "citizen@theraphylax.org",
        "name": "Citizen User",
        "role": "Citizen",
        "district": "Mumbai Suburban",
        "address": "Western Express Highway, SGNP Buffer, Borivali East",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.2288,
        "longitude": 72.8570,
        "phone": "+91 98765 43210",
    },
    {
        "id": "usr-officer",
        "email": "officer@theraphylax.org",
        "name": "Officer S. Patil",
        "role": "Officer",
        "district": "Mumbai Suburban",
        "assigned_station": "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)",
        "badge_number": "MH-FOR-2026-09",
        "latitude": 19.2288,
        "longitude": 72.9106,
        "phone": "+91 22 2886 0389",
    },
    {
        "id": "usr-031f47",
        "email": "lanishathomas7606@gmail.com",
        "name": "Lanisha Thomas",
        "role": "Officer",
        "district": "Mumbai Suburban",
        "address": "Western Express Highway, SGNP Buffer, Borivali East",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.2288,
        "longitude": 72.8570,
        "phone": "+91 98000 00000",
        "assigned_station": "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)",
        "badge_number": "MH-FOR-2026-08"
    },
    {
        "id": "usr-402f60",
        "email": "lanishathomasnadar@gmail.com",
        "name": "Lanisha Thomas",
        "role": "Officer",
        "district": "Mumbai Suburban",
        "address": "Western Express Highway, SGNP Buffer, Borivali East",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.2288,
        "longitude": 72.8570,
        "phone": "+91 98000 00000",
        "assigned_station": "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)",
        "badge_number": "MH-FOR-2026-07"
    },
    {
        "id": "usr-789b99",
        "email": "aakash.mehta@example.com",
        "name": "Aakash Mehta",
        "role": "Citizen",
        "district": "Mumbai Suburban",
        "address": "Unit 16, Aarey Milk Colony, Goregaon East",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.1485,
        "longitude": 72.8718,
        "phone": "+91 98000 00000"
    }
]

def sanitize_user_profile(user: dict) -> dict:
    """Strips any sensitive credentials and ensures only profile metadata is kept."""
    return {k: v for k, v in user.items() if k != "password"}

def sync_user_to_aws_dynamodb(user: dict):
    """Saves user location/profile metadata to AWS DynamoDB (Zero passwords stored)."""
    if not dynamodb_users_table:
        return
    try:
        clean = sanitize_user_profile(user)
        item = {}
        for k, v in clean.items():
            if v is None:
                continue
            if isinstance(v, float):
                item[k] = Decimal(str(v))
            else:
                item[k] = v
        dynamodb_users_table.put_item(Item=item)
        logger.info(f"User profile synced to AWS DynamoDB: {clean.get('email')}")
    except Exception as e:
        logger.warning(f"Failed to sync profile to AWS DynamoDB: {e}")

def load_users_from_aws_dynamodb():
    """Fetches user location profiles from AWS DynamoDB table."""
    if not dynamodb_users_table:
        return None
    try:
        response = dynamodb_users_table.scan()
        items = response.get("Items", [])
        if items:
            loaded = []
            for it in items:
                p = dict(it)
                if "latitude" in p and isinstance(p["latitude"], Decimal):
                    p["latitude"] = float(p["latitude"])
                if "longitude" in p and isinstance(p["longitude"], Decimal):
                    p["longitude"] = float(p["longitude"])
                loaded.append(sanitize_user_profile(p))
            logger.info(f"Loaded {len(loaded)} user profiles from AWS DynamoDB ({AWS_DYNAMODB_USERS_TABLE})")
            return loaded
    except Exception as e:
        logger.warning(f"Could not load users from AWS DynamoDB: {e}")
    return None

# Initialize users_db from AWS DynamoDB or seed list
_loaded_aws = load_users_from_aws_dynamodb()
if _loaded_aws:
    users_db = _loaded_aws
    existing_emails = {u.get("email", "").lower() for u in users_db}
    for seed in DEFAULT_USERS_SEED:
        if seed["email"].lower() not in existing_emails:
            clean_seed = sanitize_user_profile(seed)
            users_db.append(clean_seed)
            sync_user_to_aws_dynamodb(clean_seed)
else:
    users_db = [sanitize_user_profile(s) for s in DEFAULT_USERS_SEED]
    for s in users_db:
        sync_user_to_aws_dynamodb(s)

notifications_db = []

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

class GeofencedAlertCreate(BaseModel):
    title: str
    severity: str = "High"  # "Low", "Medium", "High", "Critical"
    message: str
    location: str
    latitude: float
    longitude: float
    radius_km: float = 5.0
    alert_type: Optional[str] = "Disaster Advisory"
    source: Optional[str] = "Forest Command & Disaster Management (MMR)"
    valid_until: Optional[str] = None

class AudiencePreviewRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 5.0

class TestEmailRequest(BaseModel):
    email: str
    title: Optional[str] = "Test Emergency Geofence Alert"
    location: Optional[str] = "SGNP Borivali Buffer Zone, Mumbai"

class PublicUpdateCreate(BaseModel):
    title: str
    category: str
    severity: Optional[str] = "Medium"
    message: str
    location: Optional[str] = None
    latitude: Optional[float] = 19.2288
    longitude: Optional[float] = 72.8570
    radius_km: Optional[float] = 3.0
    target_regions: Optional[List[str]] = Field(default_factory=lambda: ["All Regions"])
    author: Optional[str] = "Forest Command Officer"
    author_role: Optional[str] = "Forest Range Officer"

class AuthLoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    role: Optional[str] = None

class AuthRegisterRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = None
    role: Optional[str] = "Citizen"
    district: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = "Mumbai"
    state: Optional[str] = "Maharashtra"
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    assigned_station: Optional[str] = None
    badge_number: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
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

class CitizenCreateRequest(BaseModel):
    name: str
    email: str
    district: Optional[str] = "Mumbai Suburban"
    address: Optional[str] = ""
    city: Optional[str] = "Mumbai"
    state: Optional[str] = "Maharashtra"
    latitude: float
    longitude: float
    phone: Optional[str] = "+91 98000 00000"


@app.on_event("startup")
def startup_event():
    """
    Initializes Amazon RDS PostgreSQL tables and populates baseline seed records
    from default fixtures if database tables are currently empty.
    """
    logger.info("Initializing Amazon RDS PostgreSQL database tables and seeding records...")
    try:
        init_db({
            "forest_stations": forest_stations_db,
            "reports": reports_db,
            "updates": updates_db,
            "dispatches": forest_dispatches_db,
            "emergency_contacts": emergency_contacts_db,
        })
        logger.info("Amazon RDS PostgreSQL initialized and seeded successfully.")
    except Exception as e:
        logger.warning(f"Database initialization notice: {e}")


@app.get("/")
def home(request: Request, db: Session = Depends(get_db)):
    accept_header = request.headers.get("accept", "")
    if "text/html" in accept_header:
        candidate = os.path.join(os.path.dirname(__file__), "static", "index.html")
        if not os.path.isfile(candidate):
            candidate = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist", "index.html")
        if os.path.isfile(candidate):
            from fastapi.responses import FileResponse
            return FileResponse(candidate)

    try:
        rds_reports = db.query(ReportDB).count()
        rds_stations = db.query(ForestStationDB).count()
    except Exception:
        rds_reports = len(reports_db)
        rds_stations = len(forest_stations_db)

    return {
        "message": "TheraPhylax Multi-Role Emergency & Forest Patrol API is running!",
        "version": "0.3.0",
        "forest_stations_count": rds_stations,
        "active_reports": rds_reports,
        "cloud_services": {
            "compute": "Amazon EC2 (t3.micro, custom VPC)",
            "database": "Amazon RDS PostgreSQL (db.t4g.micro)",
            "storage": "Amazon S3 (theraphylax-evidence-179895364119)",
            "configuration": "AWS Systems Manager (SSM) Parameter Store",
            "monitoring": "Amazon CloudWatch (Logs & High-CPU Alarm)",
            "budget": "AWS Budgets (Cost Limit Alert)",
            "nosql_cache": "Amazon DynamoDB (theraphylax-user-profiles)",
            "messaging": "Amazon SNS (TheraPhylax-HighSeverity-Alerts)",
            "email": "Amazon SES",
            "auth": "AWS Cognito (theraphylax-users-mumbai)"
        }
    }


@app.get("/health")
def health(db: Session = Depends(get_db)):
    rds_ok = False
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        rds_ok = True
    except Exception as e:
        logger.warning(f"RDS health check failed: {e}")

    s3_ok = False
    if s3_client:
        try:
            s3_client.head_bucket(Bucket=S3_BUCKET_NAME)
            s3_ok = True
        except Exception:
            s3_ok = False

    return {
        "status": "healthy" if rds_ok else "degraded",
        "rds_postgresql": "connected" if rds_ok else "disconnected",
        "s3_storage": "accessible" if s3_ok else "unreachable",
        "ssm_parameter_store": "configured" if ssm_client is not None else "unavailable",
        "dynamodb_users": "connected" if dynamodb_users_table is not None else "disconnected",
        "sns_broadcast": "ready" if sns_client is not None else "disabled",
        "ses_dispatch": "ready" if ses_client is not None else "disabled",
        "cognito_region": AWS_REGION,
        "dynamodb_table": AWS_DYNAMODB_USERS_TABLE,
        "s3_bucket": S3_BUCKET_NAME,
        "rds_engine": "PostgreSQL 16 (AWS RDS)",
    }


# -------------------------------------------------------------
# AMAZON S3 PHOTOGRAPHIC EVIDENCE UPLOAD ENDPOINT
# -------------------------------------------------------------
@app.post("/upload/evidence")
async def upload_evidence_photo(file: UploadFile = File(...)):
    """
    Uploads photographic evidence (wildlife sightings, animal injuries, road hazards)
    directly to Amazon S3 bucket 'theraphylax-evidence-179895364119'.
    """
    if not file.content_type or not (file.content_type.startswith("image/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, WEBP) are accepted as photographic evidence.")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if not ext or ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"

    s3_key = f"evidence/{uuid.uuid4().hex[:12]}{ext}"

    if not s3_client:
        raise HTTPException(status_code=500, detail="Amazon S3 client is not available on the server.")

    try:
        content = await file.read()
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=content,
            ContentType=file.content_type if file.content_type.startswith("image/") else "image/jpeg",
        )
        url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        logger.info(f"Photographic evidence successfully uploaded to Amazon S3: {url}")
        return {
            "image_url": url,
            "evidence_image_url": url,
            "s3_key": s3_key,
            "bucket": S3_BUCKET_NAME,
            "size_bytes": len(content),
            "status": "uploaded_to_s3"
        }
    except Exception as e:
        logger.error(f"Amazon S3 upload failure: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload evidence to Amazon S3: {e}")

MUMBAI_AREA_COORDINATES = {
    "borivali": (19.2290, 72.8600),
    "sgnp": (19.2288, 72.8570),
    "mumbai suburban": (19.2288, 72.8570),
    "aarey": (19.1550, 72.8750),
    "goregaon": (19.1550, 72.8750),
    "thane": (19.2183, 72.9463),
    "ghodbunder": (19.2785, 72.9240),
    "yeoor": (19.2200, 72.9480),
    "navi mumbai": (19.1623, 72.9967),
    "airoli": (19.1623, 72.9967),
    "palghar": (19.4350, 72.8870),
    "vasai": (19.4350, 72.8870),
    "tungareshwar": (19.4350, 72.8870),
    "mumbai city": (18.9388, 72.8354),
    "colaba": (18.9067, 72.8147),
    "raigad": (18.9902, 73.2728),
}

# Auth endpoints (Authentication handled securely by AWS Cognito; profile coordinates stored in DynamoDB)
@app.post("/auth/login")
def login(payload: AuthLoginRequest):
    # Match user profile in users_db (populated from AWS DynamoDB)
    for u in users_db:
        if u["email"].lower() == payload.email.lower():
            # Preserve or upgrade to Officer if requested or if station assigned
            if (payload.role and payload.role.lower() == "officer") or u.get("assigned_station") or u.get("role", "").lower() == "officer":
                u["role"] = "Officer"
                if not u.get("assigned_station"):
                    u["assigned_station"] = "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)"
                sync_user_to_aws_dynamodb(u)
            assign_cognito_group(u["email"], u.get("role", "Citizen"))
            return {
                "token": f"token-{uuid.uuid4().hex}",
                "user": sanitize_user_profile(u)
            }
            
    # If not in users_db yet, auto-register profile in AWS DynamoDB
    new_user_role = "Officer" if (payload.role and payload.role.lower() == "officer") else "Citizen"
    new_user = {
        "id": f"usr-{uuid.uuid4().hex[:6]}",
        "email": payload.email,
        "name": payload.email.split("@")[0].replace(".", " ").title(),
        "role": new_user_role,
        "district": "Mumbai Suburban",
        "address": "Western Express Highway, SGNP Buffer, Borivali East",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.2288,
        "longitude": 72.8570,
        "phone": "+91 98000 00000",
        "assigned_station": "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)" if new_user_role == "Officer" else None,
        "badge_number": "MH-FOR-2026-01" if new_user_role == "Officer" else None
    }
    users_db.append(new_user)
    sync_user_to_aws_dynamodb(new_user)
    assign_cognito_group(new_user["email"], new_user_role)
    return {
        "token": f"token-{uuid.uuid4().hex}",
        "user": sanitize_user_profile(new_user)
    }

@app.post("/auth/register")
def register(payload: AuthRegisterRequest):
    # Determine coordinates
    lat = payload.latitude
    lng = payload.longitude
    if lat is None or lng is None:
        key = f"{payload.district or ''} {payload.address or ''}".lower().strip()
        for k, coords in MUMBAI_AREA_COORDINATES.items():
            if k in key:
                lat, lng = coords
                break
        if lat is None:
            lat, lng = 19.2288, 72.8570  # Default SGNP Borivali Corridor

    target_role = "Officer" if (payload.role and payload.role.lower() == "officer") or payload.assigned_station else "Citizen"

    # If user with this email already exists, update their profile
    for u in users_db:
        if u["email"].lower() == payload.email.lower():
            u["name"] = payload.name
            u["role"] = target_role
            u["district"] = payload.district or u.get("district")
            u["address"] = payload.address or u.get("address")
            u["city"] = payload.city or u.get("city", "Mumbai")
            u["latitude"] = lat
            u["longitude"] = lng
            u["phone"] = payload.phone or u.get("phone")
            if payload.assigned_station:
                u["assigned_station"] = payload.assigned_station
            if payload.badge_number:
                u["badge_number"] = payload.badge_number
            sync_user_to_aws_dynamodb(u)
            assign_cognito_group(u["email"], target_role)
            return {
                "success": True,
                "message": "Account profile updated in AWS DynamoDB successfully!",
                "user": sanitize_user_profile(u)
            }

    new_user = {
        "id": f"usr-{uuid.uuid4().hex[:6]}",
        "email": payload.email,
        "name": payload.name,
        "role": target_role,
        "district": payload.district or "Mumbai Suburban",
        "address": payload.address or f"{payload.district or 'Mumbai'} Resident Zone",
        "city": payload.city or "Mumbai",
        "state": payload.state or "Maharashtra",
        "phone": payload.phone or "+91 98000 00000",
        "latitude": lat,
        "longitude": lng,
        "assigned_station": payload.assigned_station if target_role == "Officer" else None,
        "badge_number": payload.badge_number if target_role == "Officer" else None
    }
    users_db.append(new_user)
    sync_user_to_aws_dynamodb(new_user)
    assign_cognito_group(new_user["email"], target_role)
    return {
        "success": True,
        "message": "Account profile created in AWS DynamoDB successfully!",
        "user": sanitize_user_profile(new_user)
    }

@app.get("/auth/me")
def get_current_user():
    if users_db:
        return sanitize_user_profile(users_db[-1])
    return {"name": "User", "email": "user@theraphylax.org", "role": "Citizen", "assigned_station": None}

@app.put("/auth/profile")
def update_profile(payload: ProfileUpdateRequest):
    target = None
    if payload.email:
        for u in users_db:
            if u["email"].lower() == payload.email.lower():
                target = u
                break

    if not target and users_db:
        # Match citizen user first, or last user
        target = next((u for u in users_db if u.get("role") == "Citizen"), users_db[-1])

    if not target:
        target_role = payload.role or ("Officer" if payload.assigned_station else "Citizen")
        target = {
            "id": f"usr-{uuid.uuid4().hex[:6]}",
            "email": payload.email or "user@theraphylax.org",
            "name": payload.name or "User",
            "role": target_role,
            "latitude": payload.latitude or 19.2288,
            "longitude": payload.longitude or 72.8570
        }
        users_db.append(target)
    
    for key, val in payload.dict(exclude_unset=True).items():
        if val is not None and key != "password":
            target[key] = val

    if payload.role:
        target["role"] = payload.role
    elif target.get("assigned_station"):
        target["role"] = "Officer"

    sync_user_to_aws_dynamodb(target)
    assign_cognito_group(target["email"], target.get("role", "Citizen"))
    return {"success": True, "message": "Profile updated in AWS DynamoDB successfully!", "user": sanitize_user_profile(target)}

# Reports Endpoints
@app.get("/reports")
def get_reports(
    category: Optional[str] = None,
    status: Optional[str] = None,
    user_email: Optional[str] = None,
    station: Optional[str] = None,
    db: Session = Depends(get_db),
):
    try:
        query = db.query(ReportDB)
        if category and category.lower() != "all":
            query = query.filter(ReportDB.category.ilike(category))
        if status and status.lower() != "all":
            query = query.filter(ReportDB.status.ilike(status))
        if user_email:
            email_clean = user_email.strip().lower()
            if email_clean in ["citizen@theraphylax.org", ""]:
                query = query.filter(ReportDB.user_email.ilike("citizen@theraphylax.org"))
            else:
                from sqlalchemy import or_
                query = query.filter(
                    or_(
                        ReportDB.user_email.ilike(email_clean),
                        ReportDB.user_email.ilike("citizen@theraphylax.org")
                    )
                )

        records = query.order_by(ReportDB.created_at.desc()).all()
        res = [r.to_dict() for r in records]

        if station and station.lower() != "all":
            res = [
                r for r in res
                if r.get("tagged_forest_officers") and any(station.lower() in o.lower() for o in r["tagged_forest_officers"])
            ]
        return res
    except Exception as e:
        logger.warning(f"Error querying RDS reports ({e}); falling back to memory.")
        res = reports_db
        if category and category.lower() != "all":
            res = [r for r in res if r.get("category", "").lower() == category.lower()]
        if status and status.lower() != "all":
            res = [r for r in res if r.get("status", "").lower() == status.lower()]
        if user_email:
            email_clean = user_email.strip().lower()
            if email_clean in ["citizen@theraphylax.org", ""]:
                res = [r for r in res if r.get("user_email", "").strip().lower() == "citizen@theraphylax.org"]
            else:
                res = [
                    r for r in res
                    if r.get("user_email", "").strip().lower() in [email_clean, "citizen@theraphylax.org"]
                ]
        if station and station.lower() != "all":
            res = [
                r for r in res
                if r.get("tagged_forest_officers") and any(station.lower() in o.lower() for o in r["tagged_forest_officers"])
            ]
        return res


@app.get("/reports/{report_id}")
def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    try:
        record = db.query(ReportDB).filter(ReportDB.id == report_id).first()
        if record:
            return record.to_dict()
    except Exception as e:
        logger.warning(f"Error querying RDS for report {report_id}: {e}")

    for r in reports_db:
        if r["id"] == report_id:
            return r
    raise HTTPException(status_code=404, detail="Incident report not found")


@app.post("/reports")
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    new_id = f"rep-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    initial_status = "Pending Review"

    # Support evidence image from either field
    evidence_url = payload.evidence_image_url

    # If Forest Officers are tagged or category is Injured Animal, automatically dispatch to Forest Patrol
    dispatch_item = None
    if payload.tagged_forest_officers or payload.category == "Injured Animal":
        initial_status = "Forest Officer Dispatched"
        dispatch_item = {
            "id": f"disp-{uuid.uuid4().hex[:6]}",
            "incident_id": new_id,
            "station_name": payload.tagged_forest_officers[0] if payload.tagged_forest_officers else "Sanjay Gandhi National Park (SGNP) Range Office (Borivali East)",
            "animal_type": payload.animal_type or "Wildlife Incident",
            "location_name": payload.location_name,
            "status": "Officer Dispatched",
            "reporter_name": payload.reporter_name or "Citizen Reporter",
            "reporter_phone": "+91 Verified Contact",
            "notes": payload.description,
            "created_at": now_iso
        }

    new_report = {
        "id": new_id,
        "created_at": now_iso,
        "status": initial_status,
        **payload.dict(),
        "image_url": evidence_url,
        "evidence_image_url": evidence_url,
    }

    # 1. Persist to Amazon RDS PostgreSQL
    try:
        report_record = ReportDB(
            id=new_id,
            title=payload.title,
            category=payload.category,
            severity=payload.severity,
            status=initial_status,
            description=payload.description,
            location_name=payload.location_name,
            latitude=payload.latitude,
            longitude=payload.longitude,
            incident_date=payload.incident_date,
            reporter_name=payload.reporter_name or "Citizen Reporter",
            user_email=payload.user_email or "citizen@theraphylax.org",
            created_at=now_iso,
            injuries_count=payload.injuries_count or 0,
            vehicles_involved=payload.vehicles_involved or 1,
            emergency_services_contacted=bool(payload.emergency_services_contacted),
            animal_type=payload.animal_type,
            animal_status=payload.animal_status,
            reporter_safe=bool(payload.reporter_safe),
            tagged_forest_officers=payload.tagged_forest_officers or [],
            forest_range=payload.forest_range or "SGNP Core Wildlife Range",
            image_url=evidence_url,
            evidence_image_url=evidence_url,
        )
        db.add(report_record)

        if dispatch_item:
            dispatch_record = ForestDispatchDB(
                id=dispatch_item["id"],
                incident_id=new_id,
                station_name=dispatch_item["station_name"],
                animal_type=dispatch_item["animal_type"],
                location_name=dispatch_item["location_name"],
                status=dispatch_item["status"],
                reporter_name=dispatch_item["reporter_name"],
                reporter_phone=dispatch_item["reporter_phone"],
                notes=dispatch_item["notes"],
                created_at=now_iso
            )
            db.add(dispatch_record)

        db.commit()
        logger.info(f"Persisted report {new_id} to Amazon RDS PostgreSQL.")
    except Exception as e:
        logger.error(f"Error persisting report {new_id} to RDS: {e}")
        db.rollback()

    # 2. Maintain in-memory mirror
    if dispatch_item:
        forest_dispatches_db.insert(0, dispatch_item)
    reports_db.insert(0, new_report)

    return new_report


@app.patch("/reports/{report_id}/status")
def update_report_status(report_id: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    # 1. Update in Amazon RDS PostgreSQL
    try:
        record = db.query(ReportDB).filter(ReportDB.id == report_id).first()
        if record:
            record.status = payload.status
            db.commit()
            logger.info(f"Updated status for report {report_id} to {payload.status} in Amazon RDS.")
    except Exception as e:
        logger.error(f"Error updating report status in Amazon RDS: {e}")
        db.rollback()

    # 2. Update in-memory mirror
    for r in reports_db:
        if r["id"] == report_id:
            r["status"] = payload.status
            if payload.notes:
                r["officer_notes"] = payload.notes
            return r

    raise HTTPException(status_code=404, detail="Report not found")

# -------------------------------------------------------------
# GEOFENCED ALERTS & TARGETED NOTIFICATION ENDPOINTS
# -------------------------------------------------------------
@app.get("/alerts")
def get_alerts():
    return alerts_db

@app.get("/citizens")
def get_citizens():
    """Returns all registered citizens (residents) in the system."""
    res = []
    for u in users_db:
        if u.get("role", "Citizen") == "Citizen":
            try:
                lat = float(u.get("latitude")) if u.get("latitude") is not None else None
                lng = float(u.get("longitude")) if u.get("longitude") is not None else None
            except (ValueError, TypeError):
                lat, lng = None, None
            res.append({
                "id": u.get("id", f"usr-{u.get('email')}"),
                "name": u.get("name", "Resident"),
                "email": u.get("email"),
                "role": "Citizen",
                "district": u.get("district", "Mumbai"),
                "address": u.get("address", ""),
                "city": u.get("city", "Mumbai"),
                "latitude": lat,
                "longitude": lng,
                "phone": u.get("phone")
            })
    return res

@app.post("/citizens")
def create_or_update_citizen(payload: CitizenCreateRequest):
    """Allows creating or directly updating a resident's location in the system."""
    for u in users_db:
        if u.get("email", "").lower() == payload.email.lower():
            u["name"] = payload.name
            if u.get("role") != "Officer" and not u.get("assigned_station"):
                u["role"] = "Citizen"
            u["district"] = payload.district or u.get("district", "Mumbai Suburban")
            u["address"] = payload.address or u.get("address", "")
            u["city"] = payload.city or "Mumbai"
            u["state"] = payload.state or "Maharashtra"
            u["latitude"] = float(payload.latitude)
            u["longitude"] = float(payload.longitude)
            if payload.phone:
                u["phone"] = payload.phone
            sync_user_to_aws_dynamodb(u)
            return {"success": True, "message": "Resident updated successfully in AWS DynamoDB!", "citizen": sanitize_user_profile(u)}

    new_citizen = {
        "id": f"usr-{uuid.uuid4().hex[:6]}",
        "email": payload.email,
        "name": payload.name,
        "role": "Citizen",
        "district": payload.district or "Mumbai Suburban",
        "address": payload.address or f"{payload.district} Resident Zone",
        "city": payload.city or "Mumbai",
        "state": payload.state or "Maharashtra",
        "phone": payload.phone or "+91 98000 00000",
        "latitude": float(payload.latitude),
        "longitude": float(payload.longitude),
        "assigned_station": None,
        "badge_number": None,
    }
    users_db.append(new_citizen)
    sync_user_to_aws_dynamodb(new_citizen)
    return {"success": True, "message": "Resident created successfully in AWS DynamoDB!", "citizen": sanitize_user_profile(new_citizen)}

@app.post("/alerts/preview-audience")
def preview_geofence_audience(payload: AudiencePreviewRequest):
    """
    Simulates audience targeting for the given geofence epicenter and radius.
    Returns the real registered citizens located strictly inside the fenced perimeter,
    and all registered citizens with distance metrics.
    """
    matched = []
    all_registered = []
    for u in users_db:
        if u.get("role", "Citizen") != "Citizen":
            continue
        try:
            u_lat = float(u.get("latitude"))
            u_lng = float(u.get("longitude"))
        except (TypeError, ValueError):
            continue

        dist = haversine_distance_km(payload.latitude, payload.longitude, u_lat, u_lng)
        in_fence = dist <= payload.radius_km
        cit_data = {
            "id": u.get("id", f"usr-{u.get('email')}"),
            "name": u.get("name", "Resident"),
            "email": u.get("email"),
            "role": "Citizen",
            "district": u.get("district", "Mumbai"),
            "address": u.get("address", ""),
            "city": u.get("city", "Mumbai"),
            "latitude": u_lat,
            "longitude": u_lng,
            "distance_km": round(dist, 2),
            "in_geofence": in_fence
        }
        all_registered.append(cit_data)
        if in_fence:
            matched.append(cit_data)

    return {
        "geofence_center": {"latitude": payload.latitude, "longitude": payload.longitude},
        "radius_km": payload.radius_km,
        "matched_count": len(matched),
        "total_registered_citizens": len(all_registered),
        "matched_citizens": sorted(matched, key=lambda x: x["distance_km"]),
        "all_citizens": sorted(all_registered, key=lambda x: x["distance_km"])
    }

@app.post("/alerts/geofenced")
def create_geofenced_alert(payload: GeofencedAlertCreate):
    """
    Officer broadcasts a geofenced notification to a certain location.
    Delivery Policy:
      - Low / Medium severity: In-App notification ONLY for people inside the geofence.
      - High / Critical severity: In-App notification AND Gmail/Email notification via AWS SES / SNS.
      - Priority color-coding:
          Low: #10B981 (Green)
          Medium: #F59E0B (Amber)
          High/Critical: #EF4444 (Crimson Red)
    """
    new_id = f"alt-{uuid.uuid4().hex[:6]}"
    is_high_severity = payload.severity in ["High", "Critical"]
    
    # Priority color mapping
    if payload.severity == "Low":
        priority_color = "#10B981"
        priority_label = "Low Priority"
        channels = ["app"]
    elif payload.severity == "Medium":
        priority_color = "#F59E0B"
        priority_label = "Medium Priority"
        channels = ["app"]
    else:
        priority_color = "#EF4444"
        priority_label = "High Priority (Critical)"
        channels = ["app", "email"]

    # 1. Target citizens strictly inside the geofence perimeter
    targeted_citizens = []
    email_dispatches = []
    now_iso = datetime.utcnow().isoformat() + "Z"

    alert_summary = {
        "id": new_id,
        "title": payload.title,
        "message": payload.message,
        "severity": payload.severity,
        "priority_label": priority_label,
        "priority_color": priority_color,
        "location": payload.location,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "radius_km": payload.radius_km,
        "source": payload.source,
        "channels": channels,
        "created_at": now_iso
    }

    for u in users_db:
        if u.get("role", "Citizen") != "Citizen":
            continue
        try:
            u_lat = float(u.get("latitude"))
            u_lng = float(u.get("longitude"))
        except (TypeError, ValueError):
            continue

        dist = haversine_distance_km(payload.latitude, payload.longitude, u_lat, u_lng)
        if dist <= payload.radius_km:
                email_status = "In-App Push Delivered"
                dispatched_email = False

                # If high severity, dispatch Gmail / Email via AWS
                if is_high_severity and u.get("email"):
                    dispatch_res = dispatch_emergency_email(
                        user_email=u["email"],
                        user_name=u.get("name", "Citizen"),
                        alert_data=alert_summary,
                        distance_km=dist
                    )
                    email_status = dispatch_res.get("status", "Dispatched to Gmail")
                    dispatched_email = True
                    email_dispatches.append(dispatch_res)

                # Store user notification in database
                notif_item = {
                    "id": f"notif-{uuid.uuid4().hex[:6]}",
                    "alert_id": new_id,
                    "user_email": u.get("email"),
                    "user_name": u.get("name"),
                    "title": payload.title,
                    "message": payload.message,
                    "severity": payload.severity,
                    "priority_label": priority_label,
                    "priority_color": priority_color,
                    "channels": channels,
                    "location_name": payload.location,
                    "alert_latitude": payload.latitude,
                    "alert_longitude": payload.longitude,
                    "alert_radius_km": payload.radius_km,
                    "user_distance_km": dist,
                    "email_dispatched": dispatched_email,
                    "email_status": email_status,
                    "is_read": False,
                    "created_at": now_iso
                }
                notifications_db.insert(0, notif_item)
                targeted_citizens.append({
                    "name": u.get("name"),
                    "email": u.get("email"),
                    "distance_km": dist,
                    "email_dispatched": dispatched_email,
                    "email_status": email_status
                })

    # Save to active alerts list
    alert_summary["targeted_citizens_count"] = len(targeted_citizens)
    alert_summary["delivery_status"] = (
        f"Delivered to {len(targeted_citizens)} citizens in {payload.location} ({payload.radius_km} km radius) "
        f"via {', '.join(channels).upper()}"
    )
    alerts_db.insert(0, alert_summary)

    return {
        "success": True,
        "message": f"Geofenced alert broadcast successfully to {len(targeted_citizens)} citizens!",
        "alert": alert_summary,
        "targeted_citizens_count": len(targeted_citizens),
        "targeted_citizens": targeted_citizens,
        "channels_used": channels,
        "email_dispatches": email_dispatches,
        "aws_region": AWS_REGION,
        "aws_sns_topic": AWS_SNS_TOPIC_ARN
    }

@app.post("/alerts")
def create_alert(payload: AlertCreate):
    """Legacy compatibility alert endpoint; redirects to standard broadcast."""
    new_alert = {
        "id": f"alt-{uuid.uuid4().hex[:6]}",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "delivery_status": f"Saved & Broadcast to region {payload.location} ({payload.radius_km} km radius)",
        **payload.dict()
    }
    alerts_db.insert(0, new_alert)
    return new_alert

# -------------------------------------------------------------
# USER NOTIFICATIONS ENDPOINTS
# -------------------------------------------------------------
@app.get("/notifications")
def get_user_notifications(user_email: Optional[str] = None):
    """
    Retrieves in-app notifications. If user_email is provided, filters for that specific user.
    """
    if user_email and user_email.strip():
        items = [n for n in notifications_db if n.get("user_email", "").lower() == user_email.strip().lower()]
    else:
        items = notifications_db

    unread_count = len([n for n in items if not n.get("is_read", False)])
    return {
        "unread_count": unread_count,
        "total_count": len(items),
        "notifications": items
    }

@app.patch("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str):
    for n in notifications_db:
        if n["id"] == notif_id:
            n["is_read"] = True
            return {"success": True, "notification": n}
    raise HTTPException(status_code=404, detail="Notification not found")

@app.post("/notifications/mark-all-read")
def mark_all_notifications_read(payload: Optional[dict] = Body(default={})):
    user_email = payload.get("user_email") if payload else None
    count = 0
    for n in notifications_db:
        if not user_email or n.get("user_email", "").lower() == user_email.strip().lower():
            if not n.get("is_read", False):
                n["is_read"] = True
                count += 1
    return {"success": True, "marked_count": count}

# -------------------------------------------------------------
# AWS SETTINGS & TEST EMAIL DISPATCH
# -------------------------------------------------------------
@app.get("/aws/settings")
def get_aws_settings():
    return {
        "region": AWS_REGION,
        "sns_topic_arn": AWS_SNS_TOPIC_ARN,
        "ses_sender": AWS_SES_SENDER,
        "ses_available": ses_client is not None,
        "sns_available": sns_client is not None,
        "delivery_policy": {
            "low_medium": "In-App Push Only (Delivered to citizens inside active geofence)",
            "high_critical": "In-App Push + Email (Gmail) via AWS SES / SNS to citizens inside active geofence"
        }
    }

@app.post("/aws/test-email")
def test_aws_emergency_email(payload: TestEmailRequest):
    """
    Allows the user or officer to test live AWS emergency email dispatch to their own inbox.
    """
    test_alert = {
        "title": payload.title or "Emergency Geofence Drill: High Priority Warning",
        "message": "This is a verified test of the TheraPhylax AWS Geofenced Notification System. In an actual high-severity incident, residents inside the geofence perimeter receive immediate app and email notifications.",
        "location": payload.location or "SGNP Borivali Wildlife Corridor, Mumbai",
        "radius_km": 4.5,
        "source": "TheraPhylax Emergency Test Dispatch",
        "severity": "High"
    }
    result = dispatch_emergency_email(
        user_email=payload.email,
        user_name="Verified Resident",
        alert_data=test_alert,
        distance_km=1.2
    )
    if not result.get("ses_sent") and not result.get("sns_published"):
        err_msg = result.get("ses_error", "Identity not yet verified in AWS SES sandbox.")
        if "Email address is not verified" in err_msg or "MessageRejected" in err_msg:
            friendly_err = f"AWS SES sandbox requires email verification. AWS sent a verification link to {payload.email}. Please click the link in your Gmail inbox to activate email delivery."
        else:
            friendly_err = f"AWS Dispatch Notice: {err_msg}"
        return {
            "success": False,
            "message": friendly_err,
            "result": result
        }
    return {
        "success": True,
        "message": f"Emergency test email dispatched to {payload.email} via AWS SES/SNS",
        "result": result
    }

# Public Safety Updates Endpoints
@app.get("/updates")
def get_public_updates(db: Session = Depends(get_db)):
    try:
        updates = db.query(SafetyUpdateDB).order_by(SafetyUpdateDB.created_at.desc()).all()
        if updates:
            return [u.to_dict() for u in updates]
    except Exception as e:
        logger.warning(f"Error querying RDS updates: {e}")
    return updates_db

@app.post("/updates")
def create_public_update(payload: PublicUpdateCreate, db: Session = Depends(get_db)):
    new_id = f"up-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    new_update = {
        "id": new_id,
        "created_at": now_iso,
        **payload.dict()
    }
    try:
        update_obj = SafetyUpdateDB(
            id=new_id,
            title=payload.title,
            category=payload.category,
            severity=payload.severity or "Medium",
            message=payload.message,
            location=payload.location or "Mumbai Metropolitan Region",
            latitude=payload.latitude or 19.2288,
            longitude=payload.longitude or 72.8570,
            radius_km=payload.radius_km or 3.0,
            target_regions=payload.target_regions or ["All Regions"],
            created_at=now_iso,
            author=payload.author or "Forest Command Officer",
            author_role=payload.author_role or "Forest Range Officer",
        )
        db.add(update_obj)
        db.commit()
        logger.info(f"Persisted safety update {new_id} to Amazon RDS PostgreSQL.")
    except Exception as e:
        logger.error(f"Error persisting update to Amazon RDS: {e}")
        db.rollback()

    updates_db.insert(0, new_update)
    return new_update

# Emergency Contacts
@app.get("/emergency-contacts")
def get_emergency_contacts(db: Session = Depends(get_db)):
    try:
        contacts = db.query(EmergencyContactDB).all()
        if contacts:
            return [c.to_dict() for c in contacts]
    except Exception as e:
        logger.warning(f"Error querying RDS contacts: {e}")
    return emergency_contacts_db

# Forest Stations, Districts & Dispatches
@app.get("/forest/districts")
def get_forest_districts(db: Session = Depends(get_db)):
    try:
        stations = db.query(ForestStationDB).all()
        if stations:
            return sorted(list(set([s.district for s in stations if s.district])))
    except Exception:
        pass
    return sorted(list(set([s["district"] for s in forest_stations_db if "district" in s])))

@app.get("/forest/stations")
def get_forest_stations(district: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(ForestStationDB)
        if district and district.strip() and district.lower() != "all":
            query = query.filter(ForestStationDB.district.ilike(district.strip()))
        stations = query.all()
        if stations:
            return [s.to_dict() for s in stations]
    except Exception as e:
        logger.warning(f"Error querying RDS stations: {e}")

    if district and district.strip() and district.lower() != "all":
        return [s for s in forest_stations_db if s.get("district", "").lower() == district.strip().lower()]
    return forest_stations_db

@app.get("/forest/dispatches")
def get_forest_dispatches(db: Session = Depends(get_db)):
    try:
        dispatches = db.query(ForestDispatchDB).order_by(ForestDispatchDB.created_at.desc()).all()
        if dispatches:
            return [d.to_dict() for d in dispatches]
    except Exception as e:
        logger.warning(f"Error querying RDS dispatches: {e}")
    return forest_dispatches_db

@app.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    try:
        total_rep = db.query(ReportDB).count()
        open_rep = db.query(ReportDB).filter(~ReportDB.status.in_(["Resolved", "Dismissed"])).count()
        resolved_rep = db.query(ReportDB).filter(ReportDB.status == "Resolved").count()
        active_alt = db.query(GeofencedAlertDB).count()
        active_up = db.query(SafetyUpdateDB).count()
        stations = db.query(ForestStationDB).count()
        dispatches = db.query(ForestDispatchDB).filter(ForestDispatchDB.status == "Officer Dispatched").count()
        return {
            "total_reports": total_rep,
            "open_reports": open_rep,
            "resolved_reports": resolved_rep,
            "active_alerts": active_alt,
            "active_updates": active_up,
            "forest_stations": stations,
            "dispatched_forest_patrols": dispatches
        }
    except Exception as e:
        logger.warning(f"RDS stats fallback: {e}")
        return {
            "total_reports": len(reports_db),
            "open_reports": len([r for r in reports_db if r["status"] not in ["Resolved", "Dismissed"]]),
            "resolved_reports": len([r for r in reports_db if r["status"] == "Resolved"]),
            "active_alerts": len(alerts_db),
            "active_updates": len(updates_db),
            "forest_stations": len(forest_stations_db),
            "dispatched_forest_patrols": len([d for d in forest_dispatches_db if d["status"] == "Officer Dispatched"])
        }

# -------------------------------------------------------------
# FRONTEND STATIC FILES & SPA ROUTING (FOR CLOUD DEPLOYMENT)
# -------------------------------------------------------------
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(STATIC_DIR):
    candidate = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
    if os.path.exists(candidate):
        STATIC_DIR = candidate

if os.path.exists(STATIC_DIR):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    assets_path = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith(("api/", "docs", "redoc", "openapi.json")):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend index.html not found")

