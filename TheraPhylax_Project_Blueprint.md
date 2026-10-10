# TheraPhylax

## Full Project Blueprint: Wildlife Intrusion Alerting, Geofencing, Reporting and Response Platform

**Document purpose:** A build-ready plan for a deployable Cloud
Computing mini-project, including functional requirements, detailed user
flows, AWS service mapping, architecture, technology stack,
Dockerization, hosting, testing, evidence, cost controls, and an
estimated schedule.

**Working tagline:** *From wildlife observation to timely,
location-aware action.*

> **Important scope note:** The first version tracks *reported or
> sensor-provided observations*, not an animal continuously, unless a
> real GPS collar/device is connected. Alerts are decision-support
> signals, not guaranteed predictions. Do not present simulated/demo
> observations as live wildlife detections.

------------------------------------------------------------------------

# 1. Project Overview

## 1.1 Problem statement

Human--wildlife conflict can threaten people, livestock, crops, wildlife
and road users, especially around forest edges and settlements. Wildlife
sightings and incident reports may be fragmented across calls, messages
and paper records. A sighting alone does not necessarily indicate
danger, and authorities need location, context, evidence and response
status to prioritize incidents.

**TheraPhylax** is a cloud-hosted wildlife activity and human--wildlife
conflict response platform. It allows citizens and authorized field
personnel to submit geotagged wildlife observations, attach photographic
evidence, view appropriately generalized nearby alerts, define
geographic zones, evaluate observations against those zones, calculate a
transparent rule-based risk score, notify relevant stakeholders, and
track each incident through resolution. Historical records support
hotspot analysis and reporting.

## 1.2 Main goal

Convert a wildlife observation into a useful operational workflow:

**Report → Validate → Store evidence → Check geofence → Assess risk →
Alert → Assign response → Resolve → Analyze**

## 1.3 Target users

-   **Citizen / Community member:** Submit a sighting or incident,
    attach a photo, see public safety alerts and follow their own
    reports.
-   **Forest officer / Responder:** Review reports, verify evidence,
    manage zones, receive high-priority alerts, assign cases and update
    response status.
-   **Researcher / Analyst:** View authorized historical observations,
    filters, activity trends and aggregate hotspot maps.
-   **Administrator:** Manage roles, configuration, zone definitions,
    audit records and operational settings.

For the MVP, these can be roles in one responsive web application;
separate mobile apps are not required.

## 1.4 Scope boundaries

### Implement in the first deployable version

-   Registration/login/logout and role-based permissions.
-   Wildlife sighting and incident reporting.
-   GPS/manual map location selection.
-   Image upload to Amazon S3.
-   Map and incident list.
-   Configurable geofences and point-in-zone/distance checks.
-   Explainable rule-based risk score.
-   Alerts and notifications.
-   Officer verification and response lifecycle.
-   Historical filters, hotspot visualization and basic analytics.
-   Audit trail, monitoring, cost controls and Dockerized deployment.

### Optional extensions after the core system works

-   Email/SMS notifications through a verified provider.
-   AI-assisted species suggestion.


Do not make optional AI or physical hardware a dependency for
demonstrating the required project.

------------------------------------------------------------------------

# 2. Functional Requirements: Detailed Feature Catalogue

ui use - https://dribbble.com/shots/26937503-Wildpedia-Animal-Discovery-Mobile-App?utm_source=Clipboard_Shot&utm_campaign=jibonuix07&utm_content=Wildpedia%20Animal%20Discovery%20Mobile%20App&utm_medium=Social_Share&utm_source=Clipboard_Shot&utm_campaign=jibonuix07&utm_content=Wildpedia%20Animal%20Discovery%20Mobile%20App&utm_medium=Social_Share

## 2.1 Authentication and account management

### Registration

**Fields:** full name, email, password, optional phone, preferred
area/settlement, and acceptance of terms/privacy notice.

**Flow:** 1. Validate required fields and email format in the frontend.
2. Submit to the backend over HTTPS. 3. Backend validates again, checks
whether the email exists and hashes the password using a modern
password-hashing library such as Argon2 or bcrypt. 4. Save the user
record in RDS. Never store plaintext passwords. 5. Assign the default
`CITIZEN` role. Users must not be able to self-select `OFFICER` or
`ADMIN`. 6. Send the user to login or create a session, depending on the
chosen implementation.

**Acceptance criteria:** duplicate email is rejected; weak/invalid
inputs are rejected; password is never returned in an API response or
written to logs.

### Login

1.  User enters email and password.
2.  Backend verifies the password hash.
3.  Create a secure session or issue a short-lived access token.
4.  Set cookies securely (`HttpOnly`, `Secure` in production,
    appropriate `SameSite`) if using cookie sessions.
5.  Redirect to the correct dashboard based on role.
6.  Rate-limit repeated failed attempts and show a generic error that
    does not reveal whether an email exists.

**Recommendation:** For a browser-based MVP, use server-side sessions
with secure cookies, CSRF protection for state-changing requests, and
HTTPS. If using JWT, define expiry and refresh/revocation behavior
rather than storing long-lived tokens carelessly in local storage.

### Logout

-   Invalidate the server-side session or revoke the refresh token.
-   Clear the session cookie.
-   Return to the login screen.

### Profile

-   Allow users to edit name, phone and preferred area.
-   Email changes should require re-verification if email delivery is
    implemented.
-   Do not expose a user's private contact details in public incident
    responses.

### Password reset

For the MVP, either implement a time-limited, single-use reset token
delivered by email or clearly document that password reset is an
administrator-assisted demo function. Never email or display an existing
password.

### Role-based access control

Suggested roles: - `CITIZEN` - `OFFICER` - `RESEARCHER` - `ADMIN`

Example permissions: - Citizen: create reports, see own reports, view
generalized public alerts. - Officer: view assigned/authorized reports,
verify incidents, assign responders, change status. - Researcher: read
approved/aggregated historical data; no access to reporter contact
details by default. - Admin: manage accounts, roles and geofences.

Enforce permissions **on the backend for every protected API**, not just
by hiding buttons in the UI.

## 2.2 Home page and navigation

Public landing page: - Project name, short explanation and safety
disclaimer. - Buttons: `Report Wildlife`, `View Public Alerts`,
`Login`. - Summary of how to report responsibly. - No exact coordinates
of sensitive species or dangerous locations exposed publicly.

Authenticated navigation: - Dashboard - New Report - My Reports -
Wildlife Map - Alerts - Profile - Officer/Admin sections only when
permitted

Include loading states, empty states, error messages and a responsive
layout for phones.

## 2.3 Create a wildlife report

### Report types

-   Wildlife sighting
-   Possible intrusion near a settlement
-   Injured animal / rescue request
-   Crop or property damage
-   Livestock incident
-   Road/railway wildlife crossing
-   Suspected trap/poaching evidence (restricted visibility)
-   Other wildlife concern

### Form fields

Required: - Report type - Approximate location - Observation date/time -
Short description

Optional: - Species or "Unknown" - Number of animals - Observed behavior
(e.g., crossing, feeding, injured, stationary; avoid asking citizens to
approach) - Photo evidence - Whether there is an immediate safety
concern

Automatically recorded where possible: - Submission timestamp - Reporter
ID - Report ID - Source (`CITIZEN`, `OFFICER`, `SENSOR`, `DEMO`) -
Status (`SUBMITTED` initially)

### Location entry

Offer: 1. **Use my location** through browser geolocation, after the
user grants permission. 2. **Choose on map** by dropping a pin. 3.
**Enter coordinates manually** for field/testing use.

If permission is denied, allow map/manual selection. Validate coordinate
ranges and reject malformed values. Explain that GPS accuracy varies.
Store the coordinate accuracy value when available. Do not silently
treat the user's current phone location as the animal's exact location;
ask them to confirm where the animal was observed.

### Photo upload

1.  Accept a limited set of image formats such as JPEG, PNG and WebP.
2.  Enforce a reasonable size limit, for example 5--10 MB for the MVP.
3.  Validate MIME type and file signature on the backend; do not trust
    filename extension alone.
4.  Generate a random object key, e.g. `evidence/2026/10/<uuid>.jpg`;
    never use a user-supplied path as the storage key.
5.  Backend creates a short-lived S3 presigned upload URL, or streams
    the file to S3. Presigned upload is preferable for larger files but
    requires careful validation.
6.  Upload directly to the private S3 bucket using the presigned URL.
7.  Backend records the object key, content type, size, upload time and
    report association in RDS.
8.  Use a short-lived presigned download URL to show authorized
    evidence. Do not make the bucket public.
9.  If upload fails, show a retry action and do not mark evidence as
    uploaded until the upload is confirmed.

### Submit behavior

-   Validate form fields.
-   Prevent accidental duplicate submissions (disable button while
    submitting and/or use an idempotency key).
-   Create the report record.
-   Queue risk processing.
-   Show a report reference such as `TP-2026-000123`.
-   Show current status and explain that reports may need officer
    verification.

## 2.4 Report details and evidence viewer

Each report details page should show: - Report ID and report type. -
Species (including Unknown). - Observation time and submission time,
separately. - Map pin and location accuracy if available. - Description
and attached evidence. - Risk score and the reasons contributing to
it. - Geofence/zone result. - Verification status. - Incident
timeline. - Assigned responder only to authorized users. - Actions
allowed for the current role.

Evidence should load through a backend-authorized short-lived URL.
Restrict sensitive reports and never expose S3 credentials or permanent
public object URLs.

## 2.5 Wildlife activity map

Use a mapping library such as Leaflet with OpenStreetMap tiles, subject
to tile-provider usage policies. A mapping provider may be substituted
if the project requires different terms or reliability.

Map layers: - Generalized public alerts. - Authorized exact sighting
pins. - Geofence polygons/circles. - Incident hotspots. - Optional
patrol paths in a later version.

Controls: - Date range. - Species. - Report type. - Risk level. -
Status. - Zone. - "Show only my reports" where applicable.

Clustering should be used for dense points. Public map coordinates
should be generalized or suppressed for sensitive reports. Provide a
list view as an accessible alternative to the map.

## 2.6 Geofencing

### Zone types

-   Wildlife habitat / forest zone
-   Buffer zone
-   Settlement zone
-   Farm/agricultural zone
-   Road/railway risk zone
-   Sensitive facility or school zone
-   Custom officer-defined zone

### Zone data

-   Zone ID and name.
-   Zone type.
-   Geometry (circle or polygon).
-   Severity/sensitivity configuration.
-   Effective date and active/inactive flag.
-   Creator and last update.
-   Optional species-specific rules.

### MVP implementation

For a first version, use PostgreSQL with PostGIS if it can be
installed/enabled on the selected RDS PostgreSQL configuration.
Otherwise, use a well-tested geospatial library in the backend for
point-in-polygon and distance calculations, storing geometry as GeoJSON
or suitable database fields. Verify extension availability and
permissions before relying on PostGIS.

### Geofence evaluation

When a report is submitted: 1. Validate coordinates. 2. Find active
zones that intersect the observation point or are within a configured
buffer distance. 3. Determine whether the point is inside, outside or
near each zone. 4. Record the zone result and distance used. 5. Pass the
result to the risk engine. 6. Re-evaluate if an authorized officer
changes the observation location or relevant zone geometry.

**Important:** A citizen-submitted point entering a geofence means a
*reported observation* intersects the zone. It does not prove continuous
animal movement or a confirmed intrusion. A real crossing detector
requires repeated GPS/device positions or another reliable stream of
observations.

## 2.7 Rule-based risk scoring

Build an explainable score first; avoid claiming a scientifically
validated prediction model.

Possible inputs: - Zone sensitivity. - Distance to a settlement or
sensitive site. - Species category/risk configuration maintained by
authorized staff. - Recent verified observations in the same area. -
Historical incidents in the same zone. - Reported behavior or injury. -
Time of day, if justified and documented. - Confidence/verification
level of the report.

Example starter rules (calibrate with test data; not a validated
wildlife-risk model): - Report intersects a configured high-sensitivity
settlement zone: +25. - Observation is within a configured distance
threshold of a settlement: +20. - Multiple recent reports in the same
area: +15. - Prior verified conflict in the same zone: +15. - Report
indicates an injured animal or immediate danger: route to a specialized
high-priority workflow. - Unverified report: reduce confidence or label
"unverified"; do not automatically suppress a plausible emergency.

Clamp the score to 0--100 and define adjustable bands, for example: -
0--24: Low - 25--49: Moderate - 50--74: High - 75--100: Critical

These thresholds are initial engineering choices, not official guidance.
Store the component scores and reason strings, e.g. "near settlement",
"repeat observations", "sensitive zone", so an officer can understand
why an alert was generated.

## 2.8 Alerts and notifications

### In-app alerts

-   Show a badge/count for unread alerts.
-   Alert detail includes time, generalized location, risk level,
    recommended safe action and status.
-   Users can mark alerts read.
-   Citizens see public-safe details; officers see details permitted by
    their role.

### Notification rules

-   Low risk: store for dashboard review.
-   Moderate: dashboard notification or digest.
-   High/Critical: notify the officer/authorized group and create an
    urgent dashboard alert.
-   Avoid alerting every user for every report; use zone subscriptions
    and rate limits.
-   Deduplicate repeated reports/notifications within a configurable
    time window.
-   Record notification attempts and delivery status where available.

### Safety language

Messages should be calm, factual and actionable. Do not tell the public
to chase, trap, feed or approach an animal. Include "follow instructions
from local forest/emergency authorities." Clearly label unverified
reports.

## 2.9 Incident management for officers

Officer dashboard: - Active incidents. - High/Critical incidents. -
Unverified reports. - Incidents awaiting assignment. - Resolved
incidents. - Map and filters.

Officer actions: - Verify / mark unverified. - Correct species to
"Unknown" or another supported value. - Add an internal note. - Assign
to an authorized responder. - Change status. - Mark duplicate and link
to the primary incident. - Escalate priority. - Close/resolution reason.

Suggested status flow:
`SUBMITTED → UNDER_REVIEW → VERIFIED → ASSIGNED → RESPONDING → RESOLVED`

Alternative terminal statuses: `REJECTED`, `DUPLICATE`,
`CLOSED_NO_ACTION`.

Every transition should record actor, time, old status, new status and
optional note in an audit table. Restrict internal notes from
citizen/public views.

## 2.10 Nearby public alerts

A citizen can choose a preferred village/area or grant location
permission to see alerts in a radius.

Show: - Risk level. - Generalized distance band (e.g. "within 1 km",
rather than exact animal coordinates). - Report time and verification
status. - General safety guidance. - Last updated time.

Do not reveal exact locations of endangered animals, nests, dens, traps
or sensitive anti-poaching reports to the public. Include expiry rules
so stale alerts do not appear current forever.

## 2.11 Historical analytics and hotspot maps

Dashboard charts: - Reports by day/week/month. - Reports by
species/category. - Risk distribution. - Incidents by status. - Median
time from submission to review/assignment/resolution. - Repeated
incident areas. - Seasonal/monthly trends if enough data exists.

Hotspot approach for the MVP: - Aggregate observations into a grid or
administrative zone. - Count verified incidents in a chosen period. -
Display counts or relative intensity. - Make the date range and sample
size visible. - Avoid implying predictive accuracy from small or
synthetic datasets.

Use synthetic/sample records only when clearly marked "DEMO DATA". Never
represent invented reports as actual wildlife detections.

## 2.12 Search, filters and pagination

-   Search by report ID.
-   Filter by species, type, risk, status, date range and zone.
-   Sort by newest, highest risk or status.
-   Paginate results on the backend.
-   Apply role-based visibility before returning results.
-   Validate all filter inputs to avoid expensive queries.

## 2.13 Audit trail and data quality

Store an audit event for: - Login/security events where appropriate. -
Report creation/editing. - Verification/rejection. - Role changes. -
Geofence changes. - Assignment and status changes. - Evidence access
where justified for sensitive cases.

Also implement: - Duplicate report flagging. - "Unknown species"
option. - Observation time distinct from submission time. - Source
labels (citizen/officer/sensor/demo). - Coordinate validation. -
Retention/deletion policy for unnecessary personal data.

## 2.14 Accessibility, reliability and usability details

-   Responsive design for mobile, tablet and desktop.
-   Keyboard-accessible forms and visible focus states.
-   Labels and clear validation messages.
-   Loading indicators and retry options.
-   Empty states and offline/network failure messages.
-   Time displayed in local time with timezone handling.
-   Store timestamps in UTC and convert for display.
-   Do not require a photo to report an urgent safety issue.
-   Never ask a citizen to approach wildlife to get a better photo.
-   Provide a manual location fallback if geolocation fails.

------------------------------------------------------------------------

# 3. AWS Services: Required, Purpose and Integration

Every service must support a feature. The project should not add
services only to inflate the count.

## 3.1 Required services from the course rubric

  -------------------------------------------------------------------------
  Requirement /      Where it is used   Why it is needed  Implementation
  service                                                 evidence
  ------------------ ------------------ ----------------- -----------------
  **Amazon EC2**     Runs the           Meets the         Running
                     Dockerized backend non-serverless    container, EC2
                     and optionally     compute           instance details,
                     serves the built   requirement       health endpoint
                     frontend through a                   
                     reverse proxy                        

  **Custom Amazon    Contains           Demonstrates      VPC CIDR and
  VPC**              application        isolated network  resource diagram
                     networking         design            

  **Public subnet**  Hosts the          Allows web        Subnet route
                     public-facing EC2  traffic to reach  table
                     instance for the   the application   
                     student MVP                          

  **Private subnet** Hosts RDS without  Reduces database  RDS subnet group
                     direct public      exposure          and public-access
                     access                               setting

  **Internet         Connects public    Enables access to IGW attachment
  Gateway**          subnet routes to   the hosted app    and route
                     the internet       and outbound      
                                        updates           

  **Route tables**   Route public       Makes network     Route-table
                     subnet traffic     flow explicit     screenshots
                     through IGW; keep                    
                     database subnet                      
                     private                              

  **Security         Permit only        Network-level     EC2/RDS
  Groups**           required           access control    security-group
                     inbound/outbound                     rules
                     paths                                

  **Amazon RDS       Stores users,      Managed           Tables and live
  PostgreSQL**       reports, zones,    relational        application
                     alerts,            database for      records
                     assignments, audit application data  
                     events and                           
                     workflow state                       

  **Amazon S3**      Stores evidence    Real              Private bucket,
                     images and         object-storage    object keys,
                     optional generated requirement       upload/download
                     reports/backups                      demo

  **IAM              EC2 instance role  No long-lived AWS Attached role and
  roles/policies**   grants limited     keys in code      least-privilege
                     access to specific                   policy
                     AWS resources                        

  **Systems Manager  Stores database    Keeps             Parameter names
  Parameter Store**  host/name/user and configuration out and app
                     sensitive config;  of GitHub and     retrieval; never
                     use SecureString   images            show secret
                     for secrets where                    values
                     appropriate                          

  **CloudWatch**     Application logs,  Observability and Log group,
                     EC2 metrics, queue operational       dashboard and
                     metrics and alarms response          alarm state

  **AWS Budgets**    Sends              Prevents          Budget
                     cost-threshold     unexpected spend  configuration and
                     alerts                               notification
                                                          evidence
  -------------------------------------------------------------------------

### Suggested network layout

For a simple student MVP: - VPC: `10.0.0.0/16` - Public subnet:
`10.0.1.0/24` - Private database subnet A: `10.0.2.0/24` - Private
database subnet B: `10.0.3.0/24` in a second Availability Zone if
required by the RDS subnet group.

RDS subnet groups commonly require subnets in at least two Availability
Zones, even if the database itself is Single-AZ. Confirm the current RDS
requirements for the selected engine/region.

**Cost-conscious note:** A public EC2 instance with a hardened security
group can be a practical student MVP. Do not add a NAT Gateway by
default; it can incur charges. A private database should accept traffic
only from the EC2 security group on PostgreSQL port `5432`. Public
inbound traffic should be limited to HTTPS (and SSH only from your own
IP if needed). Prefer Systems Manager Session Manager over opening SSH
when feasible and correctly configured.

## 3.2 Additional cloud capabilities (the rubric requires at least two)

### A. Amazon SQS --- asynchronous processing

**Use:** When a report is created, the backend writes the initial record
and sends a message to a queue. A worker processes geofence checks, risk
scoring and notification decisions.

Benefits: - The user does not have to wait for every processing step. -
Temporary processing failures can be retried. - A burst of reports does
not overwhelm the request handler. - A dead-letter queue can hold
repeatedly failing messages.

Implementation: 1. Create a queue and, optionally, a dead-letter queue.
2. Give EC2/worker role only the required send/receive/delete
permissions for those queues. 3. Publish a message containing a report
ID, not sensitive evidence or passwords. 4. Worker loads the report from
RDS, evaluates it and records results. 5. Delete the message only after
successful processing. 6. Configure visibility timeout and retry
behavior appropriately.

### B. Amazon SNS --- alert distribution

**Use:** Publish a high-priority alert event to an SNS topic. Subscribe
an authorized email endpoint or another supported destination.

Implementation: 1. Create a topic such as
`theraphylax-high-priority-alerts`. 2. Restrict publish permission to
the application role. 3. Publish only necessary alert information. 4.
Confirm email subscription before expecting delivery. 5. Record alert
status in RDS; SNS publication does not by itself prove a person read
the alert.

**Demo:** Submit a report inside a test risk zone and show a
high-priority notification arriving at a verified email subscriber.

## 3.3 Less-common / standout AWS features

These are valuable, but implement only after the core app and mandatory
checklist work.

### C. AWS Step Functions --- workflow orchestration

**Role:** Orchestrate a processing workflow such as:
`Validate report → Evaluate geofence → Calculate risk → Store assessment → Branch on risk → Publish alert if needed`.

Important architecture choice: - The main application/backend remains on
EC2. - Step Functions is a supporting orchestration service, not a
replacement for the app. - Keep the first implementation simple. A Step
Functions state machine may call supporting Lambda functions for small
tasks, or integrate with AWS services where suitable. Do not move the
whole application into Lambda.

**Evidence:** State-machine execution graph for a low-risk report and a
high-risk report.

**Cost note:** Check current regional pricing and free-usage eligibility
before enabling repeated executions.

### D. AWS X-Ray --- distributed tracing

**Role:** Trace backend requests and identify latency/failures across
instrumented application components. Use an SDK/instrumentation approach
supported by the chosen language and framework.

**Evidence:** A trace showing a report request and its main backend
operations.

**Note:** X-Ray is not a substitute for CloudWatch logs/alarms. Confirm
current pricing and availability before deployment.

### E. AWS CloudFormation --- Infrastructure as Code

**Role:** Define repeatable infrastructure such as VPC, subnets, route
tables, security groups, IAM policies, S3 bucket, SQS/SNS and monitoring
resources.

**Why it stands out:** Another person can recreate the environment from
a template instead of relying entirely on console clicks.

**Implementation strategy:** Start with a small template and deploy it
in a test stack. Add RDS/EC2 only after reviewing deletion policies,
cost implications and secrets handling. Never commit real secrets to a
template.

### F. AWS Systems Manager Session Manager

**Role:** Secure administrative access to EC2 without opening inbound
SSH, if the instance profile, SSM agent, network path and permissions
are correctly configured.

This is a useful security feature and may reduce the need to expose port
22. Validate connectivity before closing SSH access.

### G. AWS IoT Core --- optional hardware extension

**Role:** Receive messages from an actual sensor/device, such as a field
acoustic sensor or a GPS-enabled monitoring unit.

Potential flow:
`Device → MQTT → AWS IoT Core → rule/action → application processing → geofence/risk evaluation`.

Do not claim that a generic ESP32 automatically provides GPS or wildlife
detection; suitable GPS/microphone/camera hardware and firmware would be
required. Do not use IoT as a prerequisite for the MVP.

### H. IoT Device Shadows / Fleet Indexing --- advanced optional extension

-   **Device Shadows:** maintain reported/desired device state for
    devices that may temporarily disconnect.
-   **Fleet Indexing and geoqueries:** potentially useful for querying
    *connected monitoring devices* by indexed location, not a substitute
    for wildlife GPS tracking or a general geofencing engine for citizen
    reports.

Use these only if real devices are integrated and there is enough time.
Verify feature availability, region support and pricing first.

## 3.4 Service count

The core design already uses more than five cloud services with clear
purposes: EC2, VPC/networking, RDS, S3, IAM, Systems Manager Parameter
Store, CloudWatch and AWS Budgets, plus SQS and SNS. Step Functions and
CloudFormation are strong additional capabilities. Count networking
components according to the course rubric; confirm with the instructor
how they define a "service."

------------------------------------------------------------------------

# 4. Recommended Technology Stack

## 4.1 Recommended stack for a manageable, deployable MVP

  -----------------------------------------------------------------------
  Layer                   Recommendation          Reason
  ----------------------- ----------------------- -----------------------
  Frontend                React + Vite            Component-based
                                                  dashboard and forms;
                                                  easy Docker build

  Styling                 Tailwind CSS or plain   Responsive UI without
                          CSS                     excessive setup

  Maps                    Leaflet + OpenStreetMap Geofence display and
                          tiles                   report pins; review
                                                  tile usage terms

  Backend                 Python FastAPI          Clear REST APIs,
                                                  validation and
                                                  automatic OpenAPI docs

  Database                Amazon RDS for          Relational data and
                          PostgreSQL              good geospatial options

  Geospatial              PostGIS if              Point-in-polygon and
                          supported/enabled,      distance evaluation
                          otherwise a Python      
                          geometry library        

  Object storage          Amazon S3               Private photo/evidence
                                                  storage

  AWS SDK                 Boto3                   S3, SQS, SNS, SSM and
                                                  other AWS integrations

  Queue                   Amazon SQS              Decouple risk
                                                  processing from user
                                                  request

  Notifications           Amazon SNS              Alert delivery to
                                                  confirmed subscribers

  Workflow                AWS Step Functions      Orchestrate processing
                          (advanced)              stages

  Monitoring              CloudWatch; X-Ray if    Logs, metrics, alarms
                          time allows             and tracing

  Containerization        Docker + Docker Compose Reproducible local
                          for local development   setup

  Hosting                 Amazon EC2 running      Meets required
                          Docker containers       cloud-compute condition

  Reverse proxy / HTTPS   Caddy or Nginx; domain  Serve frontend/API over
                          and certificate setup   HTTPS
                          as available            

  Infrastructure as Code  AWS CloudFormation      Reproducible cloud
                                                  deployment

  Version control         Git + GitHub            Source code, issue
                                                  tracking and
                                                  documentation

  Testing                 Pytest, API integration Verify features and
                          tests, frontend         reduce demo failures
                          component tests         
  -----------------------------------------------------------------------

### Why this stack?

It uses one primary backend language (Python), one relational database,
a straightforward frontend, and AWS SDK integration. Avoid adding
Node.js backend, multiple databases, Kubernetes, a separate mobile app
and ML infrastructure all at once. Those additions increase failure
points without being necessary for the course requirements.

## 4.2 Suggested repository structure

``` text
theraphylax/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── styles/
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── workers/
│   │   └── main.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── infra/
│   ├── cloudformation.yaml
│   └── deployment-notes.md
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── security.md
│   ├── cost-estimate.md
│   └── screenshots/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

Never commit `.env`, database passwords, AWS access keys, private keys,
real user evidence or production data. Keep `.env.example` limited to
placeholder variable names and non-secret examples.

------------------------------------------------------------------------

# 5. Database Design

A reasonable first schema:

## `users`

-   `id` (UUID or generated primary key)
-   `name`
-   `email` (unique)
-   `password_hash`
-   `role`
-   `phone` (nullable; restricted)
-   `preferred_area` (nullable)
-   `is_active`
-   `created_at`, `updated_at`

## `reports`

-   `id`
-   `public_reference` (unique)
-   `reporter_id` (nullable only for supported sensor/system sources)
-   `report_type`
-   `species`
-   `animal_count` (nullable)
-   `description`
-   `observed_at`
-   `submitted_at`
-   `latitude`, `longitude`
-   `location_accuracy_m` (nullable)
-   `source`
-   `verification_status`
-   `risk_score`, `risk_level`
-   `geofence_result`
-   `assigned_officer_id` (nullable)
-   `status`
-   `is_sensitive`
-   `created_at`, `updated_at`

## `evidence`

-   `id`
-   `report_id`
-   `s3_object_key`
-   `content_type`
-   `file_size_bytes`
-   `uploaded_by`
-   `created_at`

Do not store permanent public S3 URLs. Store object keys and generate
authorized temporary URLs when needed.

## `geofences`

-   `id`
-   `name`
-   `zone_type`
-   `geometry` (GeoJSON/geometry representation)
-   `risk_weight`
-   `is_active`
-   `created_by`
-   `created_at`, `updated_at`

## `risk_assessments`

-   `id`
-   `report_id`
-   `score`
-   `risk_level`
-   `factor_breakdown` (JSON)
-   `rules_version`
-   `created_at`

## `alerts`

-   `id`
-   `report_id`
-   `recipient_group` or authorized recipient reference
-   `channel`
-   `priority`
-   `message_summary`
-   `delivery_status`
-   `created_at`, `sent_at`

## `incident_events`

-   `id`
-   `report_id`
-   `actor_user_id` (nullable for system event)
-   `event_type`
-   `old_value`
-   `new_value`
-   `note`
-   `created_at`

## `notification_preferences` (optional)

-   `user_id`
-   `zone_id` or preferred area
-   `channel`
-   `enabled`

Use foreign keys, indexes on timestamps/status/species and
coordinates/geospatial fields as appropriate, unique constraints for
email/reference, and migrations (for example, Alembic). Keep internal
notes separate from public report descriptions.

------------------------------------------------------------------------

# 6. API Design

Example endpoints (adjust names to your implementation):

## Authentication

-   `POST /api/auth/register`
-   `POST /api/auth/login`
-   `POST /api/auth/logout`
-   `GET /api/auth/me`
-   `POST /api/auth/password-reset` (if implemented)

## Reports

-   `POST /api/reports`
-   `GET /api/reports`
-   `GET /api/reports/{report_id}`
-   `PATCH /api/reports/{report_id}` (limited editable fields)
-   `POST /api/reports/{report_id}/evidence-upload-url`
-   `POST /api/reports/{report_id}/evidence-confirm`

## Map / zones

-   `GET /api/map/reports`
-   `GET /api/geofences`
-   `POST /api/geofences` (officer/admin only)
-   `PATCH /api/geofences/{zone_id}` (officer/admin only)

## Alerts

-   `GET /api/alerts`
-   `PATCH /api/alerts/{alert_id}/read`
-   `GET /api/public/alerts`

## Officer workflow

-   `POST /api/reports/{report_id}/verify`
-   `POST /api/reports/{report_id}/assign`
-   `POST /api/reports/{report_id}/status`
-   `POST /api/reports/{report_id}/notes`

## Analytics

-   `GET /api/analytics/summary`
-   `GET /api/analytics/trends`
-   `GET /api/analytics/hotspots`

## Operations

-   `GET /health`
-   `GET /ready` (checks required dependencies carefully; do not expose
    secrets)

Use Pydantic request schemas, consistent error responses, pagination and
authorization checks. Never return password hashes, raw secrets or
unrestricted sensitive coordinates from public endpoints.

------------------------------------------------------------------------

# 7. End-to-End AWS Processing Flow

## 7.1 Report submission

1.  User submits a report through React.
2.  FastAPI validates the request and checks the user's permissions.
3.  Backend creates the report in RDS.
4.  If a photo is attached, backend authorizes a private S3 upload using
    a presigned URL or controlled upload endpoint.
5.  Backend publishes a minimal message to SQS containing the report ID.
6.  Backend returns the report reference and initial status.

## 7.2 Background processing

1.  A worker running as a container on EC2 polls SQS.
2.  It loads the report and active geofences from RDS.
3.  It evaluates spatial rules and calculates a risk score.
4.  It writes the risk assessment and incident event to RDS.
5.  If priority meets the configured threshold, it publishes a message
    to SNS and records the notification attempt.
6.  On success, the worker acknowledges/deletes the SQS message.
7.  On failure, retry according to policy; move repeatedly failing
    messages to a dead-letter queue.
8.  CloudWatch collects application/worker logs and relevant queue/EC2
    metrics.
9.  A CloudWatch alarm can notify the administrator if queue depth stays
    high or processing failures rise.

## 7.3 Step Functions extension

Once the basic SQS worker works, optionally move the orchestration of
steps into Step Functions. Keep the actual API and primary backend on
EC2. Avoid implementing the same processing logic in two competing
places; document which component owns each stage.

## 7.4 S3 security

-   Block public access at the bucket level.
-   Use bucket encryption.
-   Restrict access through the EC2 IAM role.
-   Use short-lived presigned URLs.
-   Set lifecycle rules for temporary uploads if applicable.
-   Do not put AWS credentials in the container image.
-   Consider file-size/type validation, malware scanning if available,
    and retention rules.

------------------------------------------------------------------------

# 8. Dockerization and Hosting Plan (Compulsory)

## 8.1 Local Docker development

Create: - `frontend/Dockerfile` for the React production build. -
`backend/Dockerfile` for FastAPI. - `docker-compose.yml` for local
frontend/backend and a local PostgreSQL database used for development
only.

The local database is for development; the hosted production application
should use Amazon RDS as required. Never bake secrets into an image.
Pass local settings through an uncommitted `.env` file and production
configuration through SSM Parameter Store or another approved secret
mechanism.

### Local acceptance test

-   `docker compose up --build` starts all required containers.
-   Frontend loads in the browser.
-   Frontend can call backend APIs.
-   Registration/login works.
-   Report can be created and read.
-   Upload works against a development S3 bucket or a clearly separated
    local mock.
-   Containers restart without losing database data where persistence is
    expected.

## 8.2 Production container deployment on EC2

1.  Create the custom VPC, subnets, routes, security groups and IAM
    role.
2.  Launch a suitably small EC2 instance in the public subnet for the
    student MVP.
3.  Install Docker using supported installation instructions for the
    selected operating system.
4.  Pull the project's images from Docker Hub or another registry, or
    build from source on the instance for an initial demonstration.
5.  Run the frontend and backend containers using Docker Compose, or run
    a reverse proxy plus application containers.
6.  Configure environment variables that are not secret; retrieve
    secrets from SSM at runtime.
7.  Configure HTTPS with a domain and certificate if available. If no
    domain is available, clearly document any limitations and avoid
    transmitting real credentials over plain HTTP.
8.  Connect EC2 to RDS over the private network. RDS security group
    should allow PostgreSQL only from the EC2 security group.
9.  Test S3 upload, SQS processing, SNS notification and CloudWatch
    logging from the deployed app.
10. Enable automatic restart/recovery for containers and document
    deployment/update steps.
11. Test the hosted URL from a different device/network.

### Docker Hub

-   Use lowercase repository names.
-   Tag images with a version (for example, `v1.0.0`) as well as
    `latest`.
-   Do not put `.env` files, secrets or credentials in image layers.
-   If a repository is public, make sure it contains no secrets or
    sensitive data.
-   Prefer a reproducible build and document exact commands in README.

## 8.3 Production vs demo

The deployed application must be functional end-to-end, not just a
static page. Demonstrate a user creating a report, the backend saving it
to RDS, evidence landing in S3, a queue message being processed,
geofence/risk evaluation running, and an alert being sent for a
qualifying test report.

------------------------------------------------------------------------

# 9. Security and Privacy Checklist

-   Passwords hashed using Argon2/bcrypt.
-   HTTPS for deployed login and API traffic.
-   Secure session cookies and CSRF protection if cookie-based auth is
    used.
-   Server-side role authorization on every protected endpoint.
-   No AWS keys or database passwords in source code, Docker images or
    GitHub.
-   EC2 instance role with least privilege.
-   S3 Block Public Access enabled.
-   RDS not publicly accessible.
-   Database security group permits only EC2 security group on port
    5432.
-   Restrict SSH to a known IP or use Session Manager.
-   Validate uploaded file types, sizes and file signatures.
-   Rate-limit login and report submission endpoints.
-   Use parameterized queries/ORM to avoid SQL injection.
-   Avoid logging passwords, tokens, precise sensitive wildlife
    locations or unnecessary personal data.
-   Generalize public wildlife coordinates; restrict sensitive reports.
-   Keep an audit trail for officer actions.
-   Define retention/deletion rules.
-   Use synthetic data for public demos and screenshots.
-   Rotate credentials and review IAM permissions before submission.

------------------------------------------------------------------------

# 10. Monitoring, Alarms and Cost Management

## 10.1 CloudWatch logs

Create separate log groups or clearly separated streams for: -
API/backend - background worker - reverse proxy (if used)

Use structured logs with request IDs and report IDs where appropriate,
but never log passwords, tokens, database connection strings or
sensitive evidence.

## 10.2 Meaningful alarms

Choose at least one required alarm; two are preferable: 1. **SQS backlog
alarm:** queue depth remains above a threshold for a defined period. 2.
**EC2 CPU alarm:** sustained high CPU indicates capacity/processing
pressure. 3. Optional: application error metric or worker failure count.

For the queue alarm, select a threshold based on the demo's expected
load and document why it matters. Connect the alarm to an SNS
notification destination and confirm it works.

## 10.3 AWS Budgets

-   Create a monthly cost budget appropriate to the account and region.
-   Add notifications at early thresholds (e.g. 50%, 80%, 100%); exact
    thresholds are a project choice.
-   Confirm who receives the email.
-   Remember that budgets/alerts can be delayed and are not a hard
    spending cap.
-   Check the Billing console regularly; do not rely only on a budget
    alert.

## 10.4 Cost-saving practices

-   Use the smallest suitable instance and database configuration for
    testing.
-   Verify current Free Tier/credit eligibility; do not assume every
    account receives the same benefits.
-   Avoid NAT Gateway unless justified.
-   Avoid Multi-AZ RDS for the student MVP unless required.
-   Stop EC2 when not demonstrating; understand that storage, snapshots,
    public IPv4 and other resources may still incur charges.
-   Delete unused EBS volumes, snapshots, load balancers, IP addresses,
    test buckets/objects, queues and database resources.
-   Set S3 lifecycle/retention policies for temporary test files.
-   Use one region consistently.
-   Review AWS Cost Explorer/Billing after each deployment session.
-   Delete the stack after evaluation if it is no longer needed,
    preserving required evidence first.

**No AWS service should be described as "free" without checking current
region/account-specific pricing.** Prices, credits, free-usage terms and
eligibility change.

------------------------------------------------------------------------

# 11. Test Plan and Acceptance Criteria

## 11.1 Core functional tests

-   Valid registration succeeds; duplicate email fails.
-   Wrong password fails with a safe generic message.
-   Citizen cannot open officer/admin endpoints.
-   Report can be submitted with manual location if GPS is unavailable.
-   Invalid coordinates are rejected.
-   Photo upload succeeds and the object is private in S3.
-   Unauthorized user cannot retrieve private evidence.
-   Report appears in My Reports and the authorized map.
-   Geofence logic returns expected results for inside/outside/boundary
    test points.
-   Risk score and reason breakdown are saved.
-   High-risk test report triggers the expected notification path.
-   Officer can verify, assign and resolve an incident.
-   Audit history records status changes.
-   Public API does not disclose sensitive coordinates or reporter
    details.
-   Filters and pagination work.
-   Dashboard charts use real stored data, not hard-coded totals.

## 11.2 AWS integration tests

-   EC2 application can retrieve required parameters from SSM using its
    instance role.
-   EC2 can reach RDS; the public internet cannot connect directly to
    RDS.
-   S3 upload/download works with least-privilege permissions.
-   SQS message is processed and acknowledged.
-   A failed processing message retries and eventually reaches the
    dead-letter queue in a controlled test.
-   SNS subscription receives a qualifying test alert.
-   CloudWatch logs are present.
-   At least one CloudWatch alarm can be demonstrated in `OK` and,
    safely, `ALARM` state if possible.
-   AWS Budget notifications are configured.
-   Docker containers restart successfully.
-   Hosted application works from another device/network.

## 11.3 Demonstration scenario

Use a clearly marked test zone and synthetic report: 1. Log in as a
citizen. 2. Submit a "wildlife sighting" with a test photo and a point
inside the test risk zone. 3. Show the report saved in RDS and image
stored privately in S3. 4. Show SQS message processing. 5. Show geofence
result and explainable risk score. 6. Show an SNS notification received
by a verified test subscriber. 7. Log in as an officer. 8. Verify,
assign and resolve the incident. 9. Show the audit timeline and
analytics update. 10. Show CloudWatch logs/alarms and the architecture
diagram.

Label this as a **controlled demonstration**, not a real animal
intrusion.

------------------------------------------------------------------------

# 12. Implementation Roadmap and Time Estimate

Estimates assume one student working consistently, basic familiarity
with Python/React/AWS, and using a focused MVP. They are planning
estimates, not guarantees. Add contingency time for AWS networking,
permissions, HTTPS and deployment issues.

  -----------------------------------------------------------------------------
  Phase                 Tasks                                    Estimated time
  --------------------- -------------------------- ----------------------------
  1\. Requirements &    Finalize MVP, user flows,                    4--6 hours
  design                wireframes, threat/privacy 
                        model, architecture        

  2\. Repository &      GitHub structure, Python                     3--5 hours
  tooling               environment, React/Vite    
                        setup, Docker basics       

  3\. Database &        Schema, ORM models,                          4--6 hours
  migrations            migrations, seed/demo data 

  4\. Authentication &  Registration, login,                         6--9 hours
  roles                 logout, sessions, password 
                        hashing, authorization     

  5\. Report APIs       Create/list/detail/edit,                     6--9 hours
                        validation, filters,       
                        pagination                 

  6\. Frontend          Layout, navigation, forms,                   6--9 hours
  foundation            profile, loading/error     
                        states                     

  7\. Map and location  Leaflet map, browser                         5--8 hours
                        geolocation, pin           
                        selection, map filters     

  8\. S3 evidence       Private bucket, IAM                          4--6 hours
  upload                role/policy, presigned     
                        upload/download,           
                        validation                 

  9\. Geofencing        Zone CRUD, geometry                         6--10 hours
                        representation,            
                        point-in-zone/distance     
                        logic, tests               

  10\. Risk engine      Rule configuration, score                    3--5 hours
                        breakdown, thresholds and  
                        unit tests                 

  11\. SQS worker       Queue setup, worker,                         5--8 hours
                        retries, dead-letter       
                        queue, idempotency         

  12\. SNS alerts       Topic, subscription,                         2--4 hours
                        publish rules,             
                        notification records       

  13\. Officer workflow Verification, assignment,                    5--8 hours
                        status lifecycle, notes    
                        and audit history          

  14\. Analytics        Summary cards, charts,                       5--8 hours
                        filters, hotspot           
                        aggregation                

  15\. Dockerization    Frontend/backend                             4--7 hours
                        Dockerfiles, Compose,      
                        environment handling,      
                        local tests                

  16\. AWS networking & VPC, subnets, routes, IGW,                   5--9 hours
  database              security groups, RDS,      
                        connectivity               

  17\. EC2 hosting      Docker runtime, image                        5--9 hours
                        deployment, reverse proxy, 
                        domain/HTTPS if available  

  18\. SSM/IAM          Instance role, Parameter                     3--5 hours
  hardening             Store retrieval,           
                        least-privilege review     

  19\. Monitoring &     CloudWatch logs/alarms,                      2--4 hours
  budgets               SNS alarm target, AWS      
                        Budget                     

  20\. Step Functions   State machine and workflow                   4--8 hours
                        integration, execution     
                        evidence                   

  21\. CloudFormation   Template for repeatable                      5--9 hours
                        core infrastructure and    
                        test deployment            

  22\. X-Ray (optional) Instrumentation and trace                    2--4 hours
                        demonstration              

  23\. Testing & bug    End-to-end tests,                           8--12 hours
  fixing                authorization/security     
                        checks, deployment fixes   

  24\. Documentation &  Architecture diagram,                        5--8 hours
  submission            service justification,     
                        screenshots, cost note,    
                        demo script                
  -----------------------------------------------------------------------------

### Total effort

-   **Core deployable MVP** (phases 1--19, with simplified analytics):
    approximately **80--125 hours**.
-   **MVP plus Step Functions and CloudFormation:** approximately
    **90--145 hours**.
-   **With X-Ray, advanced IoT, AI or substantial polish:** add roughly
    **10--30+ hours**, depending on scope.

These ranges overlap because some tasks can be completed together. A
realistic calendar plan is **4--6 weeks at 2--4 focused hours per day**,
or longer if you are balancing classes and other submissions.

### Suggested priority order

**P0 --- Must work:** authentication, roles, report form, location, S3
evidence, RDS, geofence, risk score, officer workflow, hosted Docker
app, VPC/security, SSM, CloudWatch, budget.

**P1 --- Required cloud capability:** SQS and SNS.

**P2 --- Standout additions:** Step Functions and CloudFormation.

**P3 --- Only if time remains:** X-Ray, AI species suggestions, IoT
Core, Device Shadows, Fleet Indexing/geoqueries.

Do not start the advanced features until the hosted end-to-end
report-to-alert flow works.

------------------------------------------------------------------------

# 13. Deliverables for Submission

1.  Source code repository with README and setup instructions.
2.  Hosted application URL (plus any access instructions approved by the
    instructor).
3.  Dockerfiles and `docker-compose.yml`.
4.  Docker Hub image links/tags if publishing images is required.
5.  Architecture diagram showing application flow and AWS network
    boundaries.
6.  VPC/subnet/route table/security group evidence.
7.  RDS schema and evidence that the application uses RDS.
8.  S3 private evidence upload demonstration.
9.  IAM role/policy and SSM Parameter Store evidence (hide secret
    values).
10. SQS queue/worker and SNS notification evidence.
11. CloudWatch log group, dashboard/metrics and alarm evidence.
12. AWS Budget and notification configuration evidence.
13. Step Functions execution and CloudFormation deployment evidence if
    implemented.
14. Test report with positive/negative test cases.
15. Approximate cost estimate with region, instance/database
    configuration, running hours, storage and relevant service charges.
16. Screenshots of citizen and officer workflows.
17. Demo script using clearly labeled synthetic data.
18. Limitations and future scope.

------------------------------------------------------------------------

# 14. Suggested README and Demo Narrative

## Short project description

**TheraPhylax** is a cloud-hosted wildlife activity and human--wildlife
conflict response platform. It combines geotagged reports, secure
evidence storage, geofence evaluation, explainable risk scoring,
notification workflows and incident management. The primary application
runs in Docker containers on Amazon EC2 inside a custom VPC, with Amazon
RDS for structured data and Amazon S3 for evidence. SQS decouples
processing, SNS delivers notifications, and CloudWatch provides
monitoring.

## Suggested demo sequence

1.  Show the landing page and user roles.
2.  Register/login as a citizen.
3.  Submit a report with a location and test image.
4.  Show the report reference and evidence upload.
5.  Show geofence/risk evaluation.
6.  Show the notification for a qualifying test report.
7.  Login as an officer and verify/assign/resolve.
8.  Show audit history and analytics.
9.  Show Docker containers and hosted URL.
10. Show the custom VPC, EC2, RDS, S3, IAM, SSM, SQS, SNS, CloudWatch
    and budget evidence.
11. Show Step Functions/CloudFormation if implemented.
12. Explain the limitations: reported observations are not continuous
    animal tracking; automated risk scoring is rule-based and requires
    validation before real-world deployment.

------------------------------------------------------------------------

# 15. Final Build Recommendation

Build **one complete, dependable workflow** before adding impressive
extras:

**A user logs in → submits a geotagged sighting → uploads evidence →
report is saved in RDS → evidence is stored privately in S3 → SQS
triggers geofence/risk processing → a high-risk test report causes an
SNS notification → an officer manages the incident → CloudWatch records
the system behavior.**

Host the application on EC2 in a custom VPC, use Docker for reproducible
deployment, keep RDS private, use an EC2 IAM role and SSM for
configuration, and configure a CloudWatch alarm and AWS Budget. Once
this path works end-to-end, add Step Functions and CloudFormation. Treat
X-Ray, AI and IoT as stretch goals rather than risking the required
deliverables.

**Success means a real, hosted, testable application with evidence of
the cloud integrations---not merely a dashboard full of sample
numbers.**
