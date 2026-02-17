# Software Requirements Specification (SRS)
# DOST Serial Subscription Tracking System

**Version 1.0**

**Prepared by:** CYBERSENTINELS

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 [Document Purpose](#11-document-purpose)
   - 1.2 [Product Scope](#12-product-scope)
   - 1.3 [Intended Audience and Document Overview](#13-intended-audience-and-document-overview)
   - 1.4 [Definitions, Acronyms and Abbreviations](#14-definitions-acronyms-and-abbreviations)
   - 1.5 [Document Conventions](#15-document-conventions)
   - 1.6 [References and Acknowledgments](#16-references-and-acknowledgments)
2. [Overall Description](#2-overall-description)
   - 2.1 [Product Overview](#21-product-overview)
   - 2.2 [Product Functionality](#22-product-functionality)
   - 2.3 [Design and Implementation Constraints](#23-design-and-implementation-constraints)
   - 2.4 [Assumptions and Dependencies](#24-assumptions-and-dependencies)
3. [Specific Requirements](#3-specific-requirements)
   - 3.1 [External Interface Requirements](#31-external-interface-requirements)
   - 3.2 [Functional Requirements](#32-functional-requirements)
   - 3.3 [Use Case Model](#33-use-case-model)
4. [Other Non-functional Requirements](#4-other-non-functional-requirements)
   - 4.1 [Performance Requirements](#41-performance-requirements)
   - 4.2 [Safety and Security Requirements](#42-safety-and-security-requirements)
   - 4.3 [Software Quality Attributes](#43-software-quality-attributes)
5. [Other Requirements](#5-other-requirements)

---

## 1 Introduction

The DOST Serial Subscription Tracking System is a comprehensive web-based application designed to streamline and automate the management of serial subscriptions (journals, periodicals, magazines, and other recurring publications) within the Department of Science and Technology (DOST). This document provides a complete specification of the software requirements for this system, detailing its functional capabilities, user interfaces, system constraints, and quality attributes.

This SRS document serves as the primary reference for all stakeholders involved in the development, testing, and deployment of the Serial Subscription Tracking System. It establishes a mutual understanding between the development team and DOST stakeholders regarding system functionality, constraints, and quality expectations.

### 1.1 Document Purpose

This Software Requirements Specification (SRS) document defines the requirements for the **DOST Serial Subscription Tracking System Version 1.0**. The system is designed to manage the complete lifecycle of serial subscriptions, from supplier registration and approval to serial delivery tracking and inspection verification.

The scope of this SRS covers the complete web-based system including:

- **User Authentication and Role Management Module**: Multi-role access control for Admin, TPU, GSPS, Inspection, and Supplier users
- **Subscription Management Module**: Creating, tracking, and managing serial subscriptions
- **Supplier Account Management Module**: Registration, approval workflow, and supplier information management
- **Delivery Tracking Module**: Monitoring and updating delivery statuses
- **Inspection Module**: Serial condition verification with checklist and attachment uploads
- **Communication Module**: Real-time chat functionality between system users
- **Reporting and Dashboard Module**: Visual analytics and KPI tracking

This document does not cover future mobile application development or external integrations beyond the current system boundaries.

### 1.2 Product Scope

The **DOST Serial Subscription Tracking System** is a new, self-contained web application developed to replace manual paper-based tracking processes currently used by DOST for managing serial subscriptions. The system provides a centralized platform for tracking subscription costs, delivery status, inspection results, and communication between DOST staff and external suppliers.

**Key Benefits:**

- **Improved Efficiency**: Eliminates manual tracking through digital workflows and automation
- **Real-time Visibility**: Dashboard analytics provide instant insights into subscription status, costs, and delivery progress
- **Enhanced Accountability**: Role-based access ensures proper authorization and audit trails
- **Cost Management**: Tracks award costs, delivered costs, and remaining balances for budget monitoring
- **Quality Assurance**: Formal inspection process with condition checklists and photographic evidence
- **Seamless Communication**: Built-in chat system reduces reliance on external communication tools
- **Supplier Onboarding**: Structured approval workflow for supplier registration

**Product Objectives:**

1. Centralize all serial subscription data in a single, accessible platform
2. Enable real-time tracking of subscription deliveries and payments
3. Implement a formal inspection process with digital documentation
4. Facilitate communication between DOST departments and suppliers
5. Provide management dashboards for decision-making support

### 1.3 Intended Audience and Document Overview

This document is intended for the following audiences:

| Audience | Interest | Recommended Sections |
|----------|----------|---------------------|
| **DOST Client/Stakeholders** | Understanding system capabilities and acceptance criteria | Sections 1, 2, 3.2, 3.3, 4 |
| **Professor/Evaluator** | Technical assessment and compliance with requirements | All sections |
| **Development Team** | Implementation guidance and technical specifications | Sections 2.3, 3, 4 |
| **QA/Testing Team** | Test case development and quality verification | Sections 3.2, 3.3, 4.1, 4.3 |
| **System Administrators** | Deployment and maintenance requirements | Sections 2.3, 2.4, 4 |

**Document Organization:**

- **Section 1 (Introduction)**: Provides context, scope, and conventions
- **Section 2 (Overall Description)**: High-level product overview, functionality, and constraints
- **Section 3 (Specific Requirements)**: Detailed functional requirements and use cases
- **Section 4 (Non-functional Requirements)**: Performance, security, and quality attributes
- **Section 5 (Other Requirements)**: Database and additional specifications

### 1.4 Definitions, Acronyms and Abbreviations

| Term | Definition |
|------|------------|
| **Admin** | Administrator user role with full system access for user management and account approvals |
| **API** | Application Programming Interface; defines methods for component communication |
| **Award Cost** | The contracted cost for a serial subscription |
| **CRUD** | Create, Read, Update, Delete - basic data manipulation operations |
| **DOST** | Department of Science and Technology |
| **Delivered Cost** | The cumulative cost of serials successfully delivered and inspected |
| **GSPS** | General Supplies & Property Section; DOST unit responsible for supplies management |
| **HMR** | Hot Module Replacement; development feature for instant code updates |
| **Inspection** | User role responsible for verifying serial condition upon delivery |
| **ISSN** | International Standard Serial Number; unique identifier for serial publications |
| **JWT** | JSON Web Token; used for secure authentication |
| **MongoDB** | NoSQL document database used for data storage |
| **MVC** | Model-View-Controller architectural pattern |
| **ORM** | Object-Relational Mapping; database abstraction layer |
| **React** | JavaScript library for building user interfaces |
| **Remaining Cost** | Award Cost minus Delivered Cost |
| **Serial** | A publication issued in successive parts (journals, periodicals, magazines) |
| **SRS** | Software Requirements Specification |
| **Subscription** | A contractual agreement for receiving serial publications over a period |
| **Supplier** | External vendor providing serial publications to DOST |
| **TPU** | Technical Processing Unit; DOST unit responsible for subscription management |
| **UI/UX** | User Interface/User Experience design |
| **Vite** | Next-generation frontend build tool |

### 1.5 Document Conventions

This document follows the IEEE 830-1998 standard for Software Requirements Specifications with the following formatting conventions:

**Text Formatting:**
- Body text uses 11-12pt Arial font
- *Italicized text* indicates comments or clarifications
- **Bold text** emphasizes important terms or requirements
- `Monospaced text` represents code snippets, file names, or technical identifiers

**Requirement Identification:**
- Functional requirements are prefixed with "FR-" (e.g., FR-001)
- Use cases are prefixed with "UC-" (e.g., UC-001)
- Performance requirements are prefixed with "PR-" (e.g., PR-001)
- Security requirements are prefixed with "SR-" (e.g., SR-001)

**Priority Levels:**
- **High**: Critical functionality required for system operation
- **Medium**: Important features that enhance usability
- **Low**: Nice-to-have features for future iterations

**Naming Conventions:**
- React components use PascalCase (e.g., `Dashboard_TPU.jsx`)
- API routes use kebab-case (e.g., `/api/supplier-accounts`)
- Database collections use snake_case (e.g., `supplier_accounts`)

### 1.6 References and Acknowledgments

**Standards and Guidelines:**
1. IEEE Std 830-1998 - IEEE Recommended Practice for Software Requirements Specifications
2. Laravel 12 Documentation - https://laravel.com/docs/12.x
3. React 18 Documentation - https://react.dev/
4. MongoDB Documentation - https://www.mongodb.com/docs/
5. Inertia.js Documentation - https://inertiajs.com/

**Related Documents:**
- `ROLE_BASED_AUTH_GUIDE.md` - Role-based authentication implementation guide
- `CHAT_SYSTEM_SETUP.md` - Real-time chat system setup instructions
- `TROUBLESHOOTING_ROLES.md` - Role configuration troubleshooting

**Acknowledgments:**
- Asia Pacific College MI232 course faculty for project guidance
- Department of Science and Technology for domain expertise
- Laravel and React open-source communities

---

## 2 Overall Description

### 2.1 Product Overview

The DOST Serial Subscription Tracking System is a new, self-contained web application designed to digitize and centralize the management of serial subscriptions within the Department of Science and Technology. The system replaces fragmented manual processes with an integrated platform supporting five distinct user roles, each with tailored functionality and access permissions.

**System Context and Origin:**

This product is an original development initiative, not a replacement for existing software. It addresses the operational need for efficient tracking of serial subscriptions including journals, periodicals, and academic publications that DOST procures from external suppliers.

**System Architecture Overview:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DOST SERIAL SUBSCRIPTION TRACKING SYSTEM              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │
│    │    ADMIN    │    │     TPU     │    │    GSPS     │    │ INSPECTION │  │
│    │  Dashboard  │    │  Dashboard  │    │  Dashboard  │    │  Dashboard │  │
│    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └─────┬──────┘  │
│           │                  │                   │                 │         │
│           └──────────────────┴───────────────────┴─────────────────┘         │
│                                      │                                       │
│                        ┌─────────────▼─────────────┐                         │
│                        │      REACT FRONTEND       │                         │
│                        │   (Inertia.js + Vite)     │                         │
│                        └─────────────┬─────────────┘                         │
│                                      │                                       │
│                        ┌─────────────▼─────────────┐                         │
│                        │     LARAVEL BACKEND       │                         │
│                        │  (Controllers + Models)   │                         │
│                        └─────────────┬─────────────┘                         │
│                                      │                                       │
│                        ┌─────────────▼─────────────┐                         │
│                        │    MONGODB DATABASE       │                         │
│                        │  (Collections: users,     │                         │
│                        │   subscriptions, chats,   │                         │
│                        │   supplier_accounts...)   │                         │
│                        └───────────────────────────┘                         │
│                                                                              │
│    ┌─────────────────────────────────────────────────────────────────────┐  │
│    │                     EXTERNAL ACTORS                                  │  │
│    │  ┌──────────────┐                                                    │  │
│    │  │   SUPPLIER   │ ◄── External vendor with limited system access    │  │
│    │  │   Dashboard  │                                                    │  │
│    │  └──────────────┘                                                    │  │
│    └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**User Role Hierarchy:**

```
                    ┌─────────────────┐
                    │      ADMIN      │
                    │ (Full Access)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
    ┌────▼────┐    ┌─────────┐    ┌─────────────▼────────────┐
    │   TPU   │    │  GSPS   │    │       INSPECTION         │
    │ (Create │    │(Monitor)│    │    (Verify Serials)      │
    │ Manage) │    │         │    │                          │
    └────┬────┘    └─────────┘    └──────────────────────────┘
         │
         │ creates accounts
         ▼
    ┌─────────────────┐
    │    SUPPLIER     │
    │ (External User) │
    └─────────────────┘
```

### 2.2 Product Functionality

The following summarizes the major functions of the Serial Subscription Tracking System:

**Core Functions:**

- **User Authentication & Role Management**
  - Secure login/logout with email and password
  - Role-based dashboard routing (Admin, TPU, GSPS, Inspection, Supplier)
  - User account creation, activation, and disabling
  - Password management and profile updates

- **Subscription Management (TPU)**
  - Create new serial subscriptions with detailed metadata (title, ISSN, supplier, period, costs)
  - Track award cost, delivered cost, and remaining cost
  - Add individual serial items to subscriptions
  - Manage subscription status (Active, Inactive, Completed)
  - Edit and delete subscriptions
  - Filter and search subscriptions by various criteria

- **Supplier Account Management**
  - TPU creates supplier account applications
  - Admin reviews and approves/rejects applications
  - Approved suppliers receive login credentials
  - View approved and pending supplier lists

- **Delivery Tracking**
  - TPU monitors delivery status of subscriptions
  - Suppliers view assigned serials and update delivery status
  - GSPS views delivery status and supplier information
  - Track delivery progress with visual indicators

- **Serial Inspection**
  - Inspection staff receive serials for verification
  - Condition assessment with checklist (missing pages, torn pages, water damage, misprint)
  - Attach photographic evidence of condition
  - Mark serials as "Inspected" (Good) or "For Return" (Defective)
  - Automatically update delivered costs based on inspection results

- **Real-time Communication**
  - Chat system between TPU, GSPS, Inspection, and Supplier users
  - One-on-one messaging with message history
  - File attachment support in messages
  - Edit and delete own messages
  - Role-based chat restrictions (Suppliers can only chat with DOST staff)

- **Dashboard Analytics**
  - Role-specific KPI dashboards with charts
  - Subscription pipeline visualization
  - Cost tracking (award vs. delivered vs. remaining)
  - Time-based filtering (Year, Month, Week, Custom date range)
  - User statistics and account status overview (Admin)

### 2.3 Design and Implementation Constraints

The following constraints apply to the design and implementation of this system:

**Technology Stack Constraints:**

| Component | Constraint | Rationale |
|-----------|------------|-----------|
| Backend Framework | Laravel 12 | Required by project specifications |
| Frontend Framework | React 18 with Inertia.js | SPA experience with server-side routing |
| Database | MongoDB (primary) | Document-based storage for flexible schemas |
| Build Tool | Vite 7 | Modern build tool with HMR support |
| CSS Framework | Tailwind CSS 3.2 | Utility-first styling approach |
| Authentication | Laravel Sanctum + Laravel Fortify | Token-based API authentication |

**Design Methodology:**
- Architecture follows the Model-View-Controller (MVC) pattern implemented via Laravel
- Frontend components follow React functional component patterns with hooks
- API design follows RESTful conventions

**Development Standards:**
- React components use PascalCase naming
- PHP code follows PSR-12 coding standards
- Database operations use Eloquent ORM
- Version control via Git with feature branching

**Hardware/Environment Constraints:**
- Server must support PHP 8.2+
- MongoDB 6.0+ required for database operations
- Node.js 18+ for frontend build processes
- Minimum 2GB RAM for development environment

**Browser Compatibility:**
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Edge (latest 2 versions)
- Safari (latest 2 versions)

**References:**
- Laravel Documentation: https://laravel.com/docs
- React Documentation: https://react.dev
- MongoDB Laravel Package: https://github.com/mongodb/laravel-mongodb

### 2.4 Assumptions and Dependencies

**Assumptions:**

1. **User Technical Proficiency**: Users have basic computer literacy and familiarity with web-based applications

2. **Network Connectivity**: System users have reliable internet connectivity for accessing the web application

3. **Single Organization Use**: The system is designed for DOST internal use; multi-tenancy is not required

4. **English Language**: All interfaces and documentation are in English

5. **Sequential Workflow**: Subscriptions follow a predictable lifecycle: Award → Delivery → Inspection → Completion

6. **Valid Supplier Data**: TPU enters accurate supplier information during account creation

7. **Inspection Authority**: Inspection staff have the authority to accept or reject delivered serials

**Dependencies:**

| Dependency | Type | Impact if Unavailable |
|------------|------|----------------------|
| MongoDB Server | Database | System non-operational |
| Laravel Framework | Backend | Cannot build/deploy backend |
| React/Vite | Frontend | Cannot build/deploy frontend |
| Node.js/npm | Build | Cannot compile frontend assets |
| Composer | Package Manager | Cannot install PHP dependencies |
| Web Server (Apache/Nginx) | Infrastructure | Cannot serve application |
| Pusher (optional) | Real-time Events | Chat works but without real-time updates |

**Third-Party Components:**

- **spatie/laravel-permission**: Role and permission management
- **mongodb/laravel-mongodb**: Eloquent driver for MongoDB
- **@inertiajs/react**: React adapter for Inertia.js
- **recharts**: React charting library for dashboards
- **axios**: HTTP client for API requests
- **react-icons**: Icon library for UI components

---

## 3 Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces

The system provides role-specific dashboards and interfaces accessible via modern web browsers. All interfaces follow a consistent design language with:

- **Left Sidebar Navigation**: Role-specific menu items for quick access
- **Top Header Bar**: User profile, notifications, chat access
- **Main Content Area**: Dynamic content based on selected function
- **Responsive Design**: Adapts to desktop and tablet screen sizes

**Dashboard Interfaces by Role:**

| Role | Primary Dashboard Features |
|------|---------------------------|
| Admin | User statistics charts, account approval queue, user management table |
| TPU | Subscription pipeline chart, KPI cards (awards, deliveries), subscription tracking table |
| GSPS | Delivery status overview, supplier information, forwarding metrics |
| Inspection | Inspection statistics, serial inspection table with action buttons |
| Supplier | Assigned serials list, delivery status updates, chat access |

**Common UI Components:**

1. **Filter Controls**: Year/Month/Week/Custom date pickers for dashboard filtering
2. **Search Bars**: Full-text search on tables (name, serial title, ISSN, etc.)
3. **Data Tables**: Paginated tables with sortable columns
4. **Modal Dialogs**: Form inputs for creating/editing records
5. **Charts**: Line charts, bar charts, pie charts using Recharts library

**Sample Interface - TPU Dashboard:**

```
┌────────────────────────────────────────────────────────────────────┐
│  [DOST Logo]  Serial Subscription Tracking System    [User] [Chat] │
├────────────┬───────────────────────────────────────────────────────┤
│            │                                                        │
│  Dashboard │   📊 SUBSCRIPTION OVERVIEW          [Filter: 2025 ▼]  │
│            │   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│  Add Serial│   │ Total  │ │Awarded │ │Deliver │ │Remain. │         │
│            │   │  320   │ │ 500K   │ │  380K  │ │  120K  │         │
│  Tracking  │   └────────┘ └────────┘ └────────┘ └────────┘         │
│            │                                                        │
│  Supplier  │   📈 PIPELINE CHART                                   │
│  Info      │   ╔══════════════════════════════════════════╗        │
│            │   ║ [Line chart showing monthly trends]      ║        │
│  Monitor   │   ╚══════════════════════════════════════════╝        │
│  Delivery  │                                                        │
│            │   📋 SUBSCRIPTION TABLE                [Search 🔍]    │
│  Chat      │   ┌─────────┬──────────┬────────┬─────────┐          │
│            │   │ Title   │ Supplier │ Status │ Actions │          │
│            │   ├─────────┼──────────┼────────┼─────────┤          │
│            │   │ ...     │ ...      │ ...    │ [👁️][✏️] │          │
│            │   └─────────┴──────────┴────────┴─────────┘          │
└────────────┴───────────────────────────────────────────────────────┘
```

#### 3.1.2 Hardware Interfaces

The Serial Subscription Tracking System is a web-based application with no direct hardware interface requirements beyond standard computing equipment.

**Client-Side Requirements:**
- Standard desktop or laptop computer with keyboard and mouse
- Display with minimum 1280x720 resolution
- Network interface card (wired or wireless) for internet connectivity

**Server-Side Requirements:**
- x86-64 compatible server hardware
- Minimum 4GB RAM (8GB recommended for production)
- 50GB storage for application and database
- Network interface for HTTP/HTTPS traffic

**Input Devices:**
- Keyboard: Text input for forms, search queries
- Mouse/Touchpad: Navigation, button clicks, drag operations
- Camera (optional): For capturing inspection photos (via file upload)

#### 3.1.3 Software Interfaces

The system interfaces with the following software components:

**Database Interface:**

| Interface | Description |
|-----------|-------------|
| Database System | MongoDB 6.0+ |
| Driver | mongodb/laravel-mongodb Eloquent extension |
| Collections | users, subscriptions, supplier_accounts, chats, messages |
| Operations | CRUD via Eloquent ORM |

**External Service Interfaces:**

| Service | Purpose | Interface Type |
|---------|---------|---------------|
| Laravel Sanctum | API token authentication | Internal middleware |
| Laravel Fortify | Core authentication features | Internal service |
| File Storage | Attachment uploads (inspections, chat) | Laravel Storage facade |

**API Endpoints:**

The system exposes RESTful API endpoints for frontend consumption:

```
/api/users                    - User management (Admin)
/api/supplier-accounts        - Supplier account CRUD
/api/subscriptions            - Subscription management
/api/chats                    - Chat conversations
/api/messages                 - Chat messages
```

### 3.2 Functional Requirements

#### 3.2.1 FR-001: User Authentication

**Description:** The system shall provide secure authentication for all users.

**Priority:** High

| Requirement ID | Requirement Description |
|----------------|-------------------------|
| FR-001.1 | The system shall allow users to log in using email and password |
| FR-001.2 | The system shall redirect users to their role-specific dashboard upon successful login |
| FR-001.3 | The system shall prevent access to protected routes for unauthenticated users |
| FR-001.4 | The system shall provide a logout function that terminates the user session |
| FR-001.5 | The system shall allow users to request password reset via email |

#### 3.2.2 FR-002: Role-Based Access Control

**Description:** The system shall enforce role-based permissions for all features.

**Priority:** High

| Requirement ID | Requirement Description |
|----------------|-------------------------|
| FR-002.1 | The system shall support five user roles: Admin, TPU, GSPS, Inspection, Supplier |
| FR-002.2 | Admin users shall have access to user management and account approval functions |
| FR-002.3 | TPU users shall have access to subscription management, serial creation, and supplier account creation |
| FR-002.4 | GSPS users shall have view-only access to delivery status and supplier information |
| FR-002.5 | Inspection users shall have access to serial inspection and condition reporting |
| FR-002.6 | Supplier users shall have access to view assigned serials and chat with DOST staff |
| FR-002.7 | The system shall display "Unauthorized" page when users attempt to access forbidden routes |

#### 3.2.3 FR-003: Subscription Management

**Description:** The system shall allow TPU users to manage serial subscriptions.

**Priority:** High

| Requirement ID | Requirement Description |
|----------------|-------------------------|
| FR-003.1 | TPU shall be able to create new subscriptions with: title, ISSN, supplier, period, award cost |
| FR-003.2 | TPU shall be able to add individual serial items to a subscription |
| FR-003.3 | TPU shall be able to edit subscription details |
| FR-003.4 | TPU shall be able to delete subscriptions |
| FR-003.5 | The system shall automatically calculate remaining cost (award cost - delivered cost) |
| FR-003.6 | The system shall update delivered cost based on inspected serials |
| FR-003.7 | The system shall track subscription status: Active, Inactive, Completed |
| FR-003.8 | The system shall track payment status: Fully Paid, Partially Paid, Overpaid, Unpaid |

#### 3.2.4 FR-004: Supplier Account Management

**Description:** The system shall support a supplier account registration and approval workflow.

**Priority:** High

| Requirement ID | Requirement Description |
|----------------|-------------------------|
| FR-004.1 | TPU shall be able to create supplier account applications with: company name, contact person, email, phone, address, username, password |
| FR-004.2 | Supplier accounts shall be created with "pending" status |
| FR-004.3 | Admin shall view a list of pending supplier accounts |
| FR-004.4 | Admin shall be able to approve pending supplier accounts |
| FR-004.5 | Admin shall be able to reject pending supplier accounts with an optional reason |
| FR-004.6 | Upon approval, the system shall create a User account with "supplier" role |
| FR-004.7 | The system shall prevent duplicate supplier registrations (email, company name, username) |

#### 3.2.5 FR-005: Delivery Tracking

**Description:** The system shall track the delivery status of serial subscriptions.

**Priority:** Medium

| Requirement ID | Requirement Description |
|----------------|-------------------------|
| FR-005.1 | TPU shall be able to monitor delivery status of all subscriptions |
| FR-005.2 | GSPS shall be able to view delivery status and supplier information |
| FR-005.3 | Suppliers shall be able to view serials assigned to them |
| FR-005.4 | The system shall display delivery progress indicators |
| FR-005.5 | TPU, GSPS, and Supplier shall be able to update serial delivery status |

#### 3.2.6 FR-006: Serial Inspection

**Description:** The system shall support formal inspection of delivered serials.

**Priority:** High

| Requirement ID | Requirement Description |
|----------------|-------------------------|
| FR-006.1 | Inspection users shall view a list of serials pending inspection |
| FR-006.2 | Inspection users shall be able to open an inspection form for each serial |
| FR-006.3 | The inspection form shall include: inspector name, condition checklist, remarks |
| FR-006.4 | The condition checklist shall include: missing pages, torn pages, water damage, misprint, other |
| FR-006.5 | Inspection users shall be able to attach image files (photos) as evidence |
| FR-006.6 | Inspection users shall mark serials as "Inspected" (Good) or "For Return" (Defective) |
| FR-006.7 | The system shall update the subscription's delivered cost when serials are marked as "Inspected" |

#### 3.2.7 FR-007: Real-time Chat

**Description:** The system shall provide a chat feature for communication between users.

**Priority:** Medium

| Requirement ID | Requirement Description |
|----------------|-------------------------|
| FR-007.1 | TPU, GSPS, Inspection, and Supplier users shall have access to the chat feature |
| FR-007.2 | Users shall be able to start conversations with other eligible users |
| FR-007.3 | Supplier users shall only be able to chat with TPU, GSPS, and Inspection users |
| FR-007.4 | Users shall be able to send text messages |
| FR-007.5 | Users shall be able to attach files to messages |
| FR-007.6 | Users shall be able to edit their own messages |
| FR-007.7 | Users shall be able to delete their own messages |
| FR-007.8 | The system shall display message history for each conversation |

#### 3.2.8 FR-008: Dashboard Analytics

**Description:** The system shall provide role-specific dashboards with visual analytics.

**Priority:** Medium

| Requirement ID | Requirement Description |
|----------------|-------------------------|
| FR-008.1 | Each role shall have a dedicated dashboard with relevant KPIs |
| FR-008.2 | Dashboards shall display line charts, bar charts, and pie charts |
| FR-008.3 | Users shall be able to filter dashboard data by Year, Month, Week, or custom date range |
| FR-008.4 | TPU dashboard shall display subscription pipeline metrics |
| FR-008.5 | Admin dashboard shall display user account statistics |
| FR-008.6 | Inspection dashboard shall display inspection volume and success rates |
| FR-008.7 | GSPS dashboard shall display delivery and forwarding statistics |

#### 3.2.9 FR-009: User Management (Admin)

**Description:** The system shall allow Admin users to manage system users.

**Priority:** High

| Requirement ID | Requirement Description |
|----------------|-------------------------|
| FR-009.1 | Admin shall view a list of all system users |
| FR-009.2 | Admin shall be able to search and filter users |
| FR-009.3 | Admin shall be able to change a user's role |
| FR-009.4 | Admin shall be able to disable/enable user accounts |
| FR-009.5 | Admin shall be able to delete user accounts |
| FR-009.6 | The system shall display user statistics (total, approved, pending, disabled) |

### 3.3 Use Case Model

**Use Case Diagram:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DOST SERIAL SUBSCRIPTION TRACKING SYSTEM                  │
│                                                                              │
│    ┌──────────┐                                                             │
│    │  Admin   │──┬── UC-001: Login/Logout                                   │
│    └──────────┘  ├── UC-002: Approve/Reject Supplier Account                │
│                  ├── UC-009: Manage Users                                   │
│                  └── UC-008: View Admin Dashboard                           │
│                                                                              │
│    ┌──────────┐                                                             │
│    │   TPU    │──┬── UC-001: Login/Logout                                   │
│    └──────────┘  ├── UC-003: Create Subscription                            │
│                  ├── UC-004: Create Supplier Account Application            │
│                  ├── UC-005: Track Subscriptions                            │
│                  ├── UC-007: Use Chat                                       │
│                  └── UC-008: View TPU Dashboard                             │
│                                                                              │
│    ┌──────────┐                                                             │
│    │   GSPS   │──┬── UC-001: Login/Logout                                   │
│    └──────────┘  ├── UC-005: View Delivery Status                           │
│                  ├── UC-007: Use Chat                                       │
│                  └── UC-008: View GSPS Dashboard                            │
│                                                                              │
│    ┌────────────┐                                                           │
│    │ Inspection │──┬── UC-001: Login/Logout                                 │
│    └────────────┘  ├── UC-006: Inspect Serial                               │
│                    ├── UC-007: Use Chat                                     │
│                    └── UC-008: View Inspection Dashboard                    │
│                                                                              │
│    ┌──────────┐                                                             │
│    │ Supplier │──┬── UC-001: Login/Logout                                   │
│    └──────────┘  ├── UC-005: View Assigned Serials                          │
│                  ├── UC-007: Use Chat (restricted)                          │
│                  └── UC-008: View Supplier Dashboard                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.3.1 Use Case UC-001: User Login

| Attribute | Description |
|-----------|-------------|
| **Author** | Development Team |
| **Purpose** | Authenticate users and redirect to role-specific dashboard |
| **Requirements Traceability** | FR-001.1, FR-001.2, FR-002.1 |
| **Priority** | High |
| **Preconditions** | User has valid credentials; System is operational |
| **Post conditions** | User is authenticated and redirected to appropriate dashboard |
| **Actors** | Any User (Admin, TPU, GSPS, Inspection, Supplier) |
| **Extends** | N/A |

**Flow of Events:**

1. **Basic Flow:**
   1. User navigates to the application URL
   2. System displays login page
   3. User enters email and password
   4. User clicks "Login" button
   5. System validates credentials
   6. System identifies user role
   7. System redirects to role-specific dashboard:
      - Admin → `/dashboard-admin`
      - TPU → `/dashboard-tpu`
      - GSPS → `/dashboard-gsps`
      - Inspection → `/inspection-dashboard`
      - Supplier → `/dashboard-supplier`

2. **Alternative Flow - Invalid Credentials:**
   1. At step 5, if credentials are invalid
   2. System displays error message "Invalid email or password"
   3. User remains on login page
   4. Flow returns to step 3

3. **Exceptions:**
   - Account is disabled: Display "Account disabled" message
   - Server error: Display "Unable to process request" message

**Includes:** N/A

**Notes/Issues:** Two-factor authentication may be added in future versions.

#### 3.3.2 Use Case UC-002: Approve/Reject Supplier Account

| Attribute | Description |
|-----------|-------------|
| **Author** | Development Team |
| **Purpose** | Allow Admin to review and process supplier account applications |
| **Requirements Traceability** | FR-004.3, FR-004.4, FR-004.5, FR-004.6 |
| **Priority** | High |
| **Preconditions** | Admin is logged in; Pending supplier accounts exist |
| **Post conditions** | Supplier account is approved (user created) or rejected |
| **Actors** | Admin |
| **Extends** | N/A |

**Flow of Events:**

1. **Basic Flow (Approve):**
   1. Admin navigates to "Account Approval" page
   2. System displays list of pending supplier accounts
   3. Admin reviews account details (company name, email, contact)
   4. Admin clicks "Approve" button for an account
   5. System creates User account with role "supplier"
   6. System updates supplier account status to "approved"
   7. System removes account from pending list
   8. System displays success message

2. **Alternative Flow (Reject):**
   1. At step 4, Admin clicks "Reject" button
   2. System prompts for rejection reason (optional)
   3. Admin enters reason and confirms
   4. System updates supplier account status to "rejected"
   5. System removes account from pending list
   6. System displays rejection confirmation

3. **Exceptions:**
   - Duplicate email exists: Display "User with this email already exists"
   - Network error: Display error and suggest retry

**Includes:** N/A

**Notes/Issues:** Rejected accounts can be re-submitted by TPU with corrections.

#### 3.3.3 Use Case UC-003: Create Subscription

| Attribute | Description |
|-----------|-------------|
| **Author** | Development Team |
| **Purpose** | Allow TPU to create new serial subscriptions |
| **Requirements Traceability** | FR-003.1, FR-003.2, FR-003.7 |
| **Priority** | High |
| **Preconditions** | TPU is logged in; At least one approved supplier exists |
| **Post conditions** | New subscription record is created in database |
| **Actors** | TPU |
| **Extends** | N/A |

**Flow of Events:**

1. **Basic Flow:**
   1. TPU navigates to "Add Serial" page
   2. System displays subscription form
   3. TPU enters subscription details:
      - Serial Title (required)
      - ISSN
      - Supplier (dropdown of approved suppliers)
      - Period (e.g., "2025-2026")
      - Award Cost (required)
      - Frequency (Monthly, Quarterly, etc.)
      - Category
      - Notes
   4. TPU clicks "Submit" button
   5. System validates form data
   6. System creates subscription with status "Active"
   7. System calculates initial costs (delivered=0, remaining=award cost)
   8. System displays success message
   9. Form is reset for next entry

2. **Alternative Flow - Validation Error:**
   1. At step 5, if validation fails
   2. System highlights invalid fields
   3. System displays error messages
   4. TPU corrects errors
   5. Flow returns to step 4

3. **Exceptions:**
   - Server error: Display error and retain form data

**Includes:** N/A

**Notes/Issues:** Serial items can be added after subscription creation.

#### 3.3.4 Use Case UC-004: Create Supplier Account Application

| Attribute | Description |
|-----------|-------------|
| **Author** | Development Team |
| **Purpose** | Allow TPU to register new suppliers for admin approval |
| **Requirements Traceability** | FR-004.1, FR-004.2, FR-004.7 |
| **Priority** | High |
| **Preconditions** | TPU is logged in |
| **Post conditions** | Supplier account application is created with "pending" status |
| **Actors** | TPU |
| **Extends** | N/A |

**Flow of Events:**

1. **Basic Flow:**
   1. TPU navigates to "Add Account" page
   2. System displays supplier registration form
   3. TPU enters supplier details:
      - Company Name (required)
      - Contact Person (required)
      - Email (required)
      - Phone (required)
      - Address (required)
      - Username (required)
      - Password (required, with confirmation)
   4. TPU clicks "Submit" button
   5. System validates form data
   6. System checks for duplicates (email, company name, username)
   7. System creates supplier account with status "pending"
   8. System displays success message: "Awaiting admin approval"

2. **Alternative Flow - Duplicate Found:**
   1. At step 6, if duplicate is found
   2. System displays specific error (e.g., "Email already registered")
   3. TPU corrects the duplicate field
   4. Flow returns to step 4

3. **Exceptions:**
   - Server error: Display error and retain form data

**Includes:** N/A

**Notes/Issues:** Password is stored for transfer to User account upon approval.

#### 3.3.5 Use Case UC-005: Track Subscriptions

| Attribute | Description |
|-----------|-------------|
| **Author** | Development Team |
| **Purpose** | View and manage subscription tracking information |
| **Requirements Traceability** | FR-003.5, FR-003.6, FR-005.1, FR-005.2, FR-005.3 |
| **Priority** | High |
| **Preconditions** | User is logged in with appropriate role |
| **Post conditions** | User has viewed/updated subscription information |
| **Actors** | TPU (full access), GSPS (view), Supplier (view assigned) |
| **Extends** | N/A |

**Flow of Events:**

1. **Basic Flow (View):**
   1. User navigates to subscription tracking page
   2. System retrieves subscription data based on user role
   3. System displays subscription table with columns:
      - Serial Title, Supplier, Period, Award Cost, Delivered Cost, Status
   4. User can search and filter subscriptions
   5. User can paginate through results
   6. User clicks on subscription to view details

2. **Alternative Flow (TPU Edit):**
   1. TPU clicks "Edit" on a subscription
   2. System displays edit modal with current values
   3. TPU modifies fields
   4. TPU clicks "Save"
   5. System updates subscription record
   6. System recalculates costs
   7. System displays updated table

3. **Alternative Flow (Add Serial Item - TPU):**
   1. TPU clicks "Add Serial" on a subscription
   2. System displays serial item form
   3. TPU enters item details (date, quantity, unit price, etc.)
   4. TPU clicks "Add"
   5. System adds serial to subscription's items array
   6. System updates table

**Includes:** N/A

**Notes/Issues:** GSPS and Supplier have read-only access appropriate to their role.

#### 3.3.6 Use Case UC-006: Inspect Serial

| Attribute | Description |
|-----------|-------------|
| **Author** | Development Team |
| **Purpose** | Allow Inspection staff to verify serial condition and record results |
| **Requirements Traceability** | FR-006.1 - FR-006.7 |
| **Priority** | High |
| **Preconditions** | Inspection user is logged in; Serials pending inspection exist |
| **Post conditions** | Serial inspection status is updated; Delivered cost recalculated if approved |
| **Actors** | Inspection |
| **Extends** | N/A |

**Flow of Events:**

1. **Basic Flow (Accept Serial):**
   1. Inspection navigates to "Serials for Inspection" page
   2. System displays list of serials with "pending" inspection status
   3. Inspection clicks "Inspect" button on a serial
   4. System displays inspection modal with:
      - Serial details (read-only)
      - Inspector name field
      - Condition checklist (checkboxes)
      - Remarks text area
      - Attachment upload button
   5. Inspection enters inspector name
   6. Inspection leaves checklist unchecked (no defects)
   7. Inspection selects "Acceptable" condition
   8. Inspection optionally adds remarks
   9. Inspection optionally uploads photo attachment
   10. Inspection clicks "Submit"
   11. System updates serial inspection_status to "inspected"
   12. System recalculates subscription's delivered_cost
   13. System displays success message
   14. Serial is removed from pending list

2. **Alternative Flow (Reject Serial):**
   1. At step 6, Inspection checks applicable defects
   2. Inspection selects "For Return" condition
   3. Inspection adds remarks explaining defects
   4. Inspection uploads photo evidence
   5. Inspection clicks "Submit"
   6. System updates serial inspection_status to "for_return"
   7. System does NOT update delivered_cost
   8. System displays confirmation

3. **Exceptions:**
   - Missing inspector name: Display validation error
   - File too large: Display "Max 5MB" error
   - Invalid file type: Display "Images only" error

**Includes:** N/A

**Notes/Issues:** Attachment photos are stored in Laravel storage.

#### 3.3.7 Use Case UC-007: Use Chat

| Attribute | Description |
|-----------|-------------|
| **Author** | Development Team |
| **Purpose** | Enable communication between system users |
| **Requirements Traceability** | FR-007.1 - FR-007.8 |
| **Priority** | Medium |
| **Preconditions** | User is logged in with chat-enabled role (not Admin) |
| **Post conditions** | Messages are exchanged and stored |
| **Actors** | TPU, GSPS, Inspection, Supplier |
| **Extends** | N/A |

**Flow of Events:**

1. **Basic Flow (Send Message):**
   1. User navigates to Chat page
   2. System displays list of available users (role-restricted)
   3. User selects a contact to chat with
   4. System retrieves existing conversation or creates new chat
   5. System displays message history
   6. User types message in input field
   7. User clicks "Send" button
   8. System stores message with timestamp
   9. Message appears in conversation

2. **Alternative Flow (Send Attachment):**
   1. At step 6, User clicks attachment button
   2. User selects file from device
   3. System validates file
   4. User clicks "Send"
   5. System uploads file to storage
   6. System stores message with attachment reference

3. **Alternative Flow (Edit Message):**
   1. User clicks edit icon on own message
   2. System enables message editing
   3. User modifies text
   4. User confirms edit
   5. System updates message, marks as "edited"

4. **Alternative Flow (Delete Message):**
   1. User clicks delete icon on own message
   2. System prompts for confirmation
   3. User confirms deletion
   4. System removes message from conversation

3. **Exceptions:**
   - Supplier attempting to chat with another Supplier: Blocked by system
   - Supplier attempting to chat with Admin: User not displayed in list

**Includes:** N/A

**Notes/Issues:** Real-time updates via polling (Pusher integration optional).

#### 3.3.8 Use Case UC-008: View Dashboard

| Attribute | Description |
|-----------|-------------|
| **Author** | Development Team |
| **Purpose** | Display role-specific analytics and KPIs |
| **Requirements Traceability** | FR-008.1 - FR-008.7 |
| **Priority** | Medium |
| **Preconditions** | User is logged in |
| **Post conditions** | Dashboard displays current statistics |
| **Actors** | All roles |
| **Extends** | N/A |

**Flow of Events:**

1. **Basic Flow:**
   1. User logs in and is redirected to dashboard
   2. System retrieves statistics based on user role
   3. System renders KPI cards with current values
   4. System renders charts with default filter (current year)
   5. User views dashboard data

2. **Alternative Flow (Apply Filter):**
   1. User clicks "Filter" button
   2. System displays filter modal with options:
      - Year mode (full year)
      - Month mode (single month)
      - Week mode (calendar week selection)
      - Custom mode (date range picker)
   3. User selects filter criteria
   4. User clicks "Apply"
   5. System recalculates metrics for selected range
   6. System updates charts and KPIs

3. **Exceptions:**
   - No data for period: Display "No data available" message

**Includes:** N/A

**Notes/Issues:** Dashboard data is mock/calculated for demo; production will use real DB queries.

#### 3.3.9 Use Case UC-009: Manage Users

| Attribute | Description |
|-----------|-------------|
| **Author** | Development Team |
| **Purpose** | Allow Admin to view and manage system user accounts |
| **Requirements Traceability** | FR-009.1 - FR-009.6 |
| **Priority** | High |
| **Preconditions** | Admin is logged in |
| **Post conditions** | User accounts are updated as specified |
| **Actors** | Admin |
| **Extends** | N/A |

**Flow of Events:**

1. **Basic Flow (View Users):**
   1. Admin navigates to "List of Users" page
   2. System retrieves all user accounts
   3. System displays user table with: Name, Email, Role, Status
   4. System displays user statistics (total, by role, disabled)
   5. Admin can search users by name or email

2. **Alternative Flow (Change Role):**
   1. Admin clicks role dropdown for a user
   2. Admin selects new role
   3. System updates user role
   4. System displays confirmation

3. **Alternative Flow (Disable/Enable):**
   1. Admin clicks "Disable" or "Enable" button
   2. System toggles user's is_disabled flag
   3. Disabled users cannot log in

4. **Alternative Flow (Delete User):**
   1. Admin clicks "Delete" button
   2. System prompts for confirmation
   3. Admin confirms
   4. System deletes user account
   5. System refreshes user list

3. **Exceptions:**
   - Cannot delete own account: Display warning
   - Last admin account: Prevent deletion/role change

**Includes:** N/A

**Notes/Issues:** Deletion is permanent; consider soft delete for audit trail.

---

## 4 Other Non-functional Requirements

### 4.1 Performance Requirements

| Requirement ID | Description |
|----------------|-------------|
| PR-001 | Page load time shall be less than 3 seconds on standard broadband connection |
| PR-002 | Dashboard charts shall render within 1 second after data retrieval |
| PR-003 | API responses shall return within 500ms for standard CRUD operations |
| PR-004 | The system shall support concurrent access by at least 50 users |
| PR-005 | File uploads shall support files up to 5MB for attachments |
| PR-006 | Chat message history shall load within 2 seconds for conversations with up to 1000 messages |
| PR-007 | Search functionality shall return results within 1 second |
| PR-008 | Session timeout shall occur after 30 minutes of inactivity |

**Rationale:** Performance requirements ensure responsive user experience and prevent user frustration during critical workflows like inspection reporting.

### 4.2 Safety and Security Requirements

| Requirement ID | Description |
|----------------|-------------|
| SR-001 | All user passwords shall be hashed using bcrypt before storage |
| SR-002 | The system shall use HTTPS for all communications in production |
| SR-003 | API endpoints shall validate authentication tokens on every request |
| SR-004 | Role-based access control shall prevent unauthorized access to protected resources |
| SR-005 | Users shall only access data relevant to their role |
| SR-006 | Session tokens shall be invalidated upon logout |
| SR-007 | Failed login attempts shall be logged for security monitoring |
| SR-008 | File uploads shall be validated for type and size to prevent malicious uploads |
| SR-009 | The system shall prevent SQL/NoSQL injection through parameterized queries |
| SR-010 | User input shall be sanitized to prevent XSS attacks |
| SR-011 | CSRF tokens shall be included in all form submissions |
| SR-012 | Supplier users shall only chat with internal DOST staff (TPU, GSPS, Inspection) |

**External Policies:**
- Data handling follows DOST data privacy guidelines
- System complies with Philippine Data Privacy Act of 2012

### 4.3 Software Quality Attributes

#### 4.3.1 Maintainability

**Requirement:** The system shall be maintainable by developers with standard Laravel and React skills.

**Implementation Strategy:**
- Code follows PSR-12 (PHP) and React best practices
- Components are modular with single responsibility
- Business logic is centralized in Laravel controllers
- Database operations use Eloquent ORM for abstraction
- Configuration is externalized in `.env` files
- Documentation provided in markdown files

**Metrics:**
- New developers should be able to add a new page within 4 hours
- Bug fixes should not require changes to more than 3 files on average

#### 4.3.2 Reliability

**Requirement:** The system shall maintain 99% uptime during business hours.

**Implementation Strategy:**
- Error handling with graceful fallbacks
- Database transactions for data integrity
- Validation at both frontend and backend
- Logging of all errors for diagnosis
- Health check endpoints for monitoring

**Metrics:**
- Mean Time Between Failures (MTBF): > 720 hours
- Mean Time To Recovery (MTTR): < 30 minutes

#### 4.3.3 Usability

**Requirement:** Users shall be able to perform core tasks without training.

**Implementation Strategy:**
- Consistent UI patterns across all dashboards
- Clear labeling and helpful error messages
- Visual feedback for all actions (success/error toasts)
- Intuitive navigation with sidebar menus
- Responsive design for tablet compatibility

**Metrics:**
- New users should complete first subscription creation within 10 minutes
- Task completion rate > 95% for trained users

#### 4.3.4 Scalability

**Requirement:** The system shall accommodate growth in users and data volume.

**Implementation Strategy:**
- MongoDB's horizontal scaling capabilities
- Stateless API design for load balancing
- Pagination on all list views
- Indexed database fields for query optimization
- Optional caching layer for frequently accessed data

**Metrics:**
- System shall handle 10,000 subscription records without performance degradation
- System shall scale to 200 concurrent users with infrastructure upgrades

#### 4.3.5 Design for Change

**Requirement:** The system architecture shall support future modifications.

**Implementation Strategy:**
- Role system extensible for new roles
- Dashboard components reusable across roles
- API versioning consideration for future changes
- Database schema accommodates additional fields
- Environment-based configuration for different deployments

**Planned Extension Points:**
- Additional user roles (e.g., Finance, Director)
- Integration with external procurement systems
- Mobile application API support
- Report generation and export features

---

## 5 Other Requirements

### 5.1 Database Requirements

**Database System:** MongoDB 6.0+

**Collections:**

| Collection | Description | Key Fields |
|------------|-------------|------------|
| users | System user accounts | _id, name, email, password, role, is_disabled |
| subscriptions | Serial subscription records | _id, serial_title, supplier_id, supplier_name, period, award_cost, delivered_cost, remaining_cost, status, serials[], transactions[] |
| supplier_accounts | Supplier registration applications | _id, company_name, email, status, created_by, approved_by |
| chats | Chat conversations | _id, user_id_1, user_id_2, last_message_at |
| messages | Chat messages | _id, chat_id, sender_id, content, attachment |

**Data Integrity:**
- Required fields enforced at application layer
- Unique constraints on email fields
- Referential integrity through application logic

### 5.2 Internationalization Requirements

- Current version supports English language only
- Date formats use US conventions (Month Day, Year)
- Currency displays in Philippine Peso (₱ / PHP)

### 5.3 Legal Requirements

- System complies with Philippine Data Privacy Act of 2012 (RA 10173)
- User data handling follows DOST internal policies
- Supplier agreements govern data sharing with external parties

### 5.4 Reuse Objectives

The following components are designed for reuse:
- Role-based authentication middleware
- Dashboard layout components (sidebar, header)
- Chart components with configurable data
- Modal form patterns
- Table components with pagination and search

---

## Document Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | February 12, 2026 | Development Team | Initial SRS document |

---

*End of Software Requirements Specification*
