# Serial Subscription Tracking System - Test Cases

---

## 📋 Use Case #1: Manage Profile (UC-01)

| Use Case ID | UC-01 |
|-------------|-------|
| **Author** | Cyber Sentinels |
| **Purpose** | Authenticate users and redirect to role-specific dashboard |
| **Requirement Traceability** | BR-01, BR-02, BR-11 |
| **Priority** | High |
| **Preconditions** | The user must be logged into the system; User must have a valid system account; Admin must have verified the account and assigned a role |
| **Postconditions** | User profile data is saved and logged in the system |
| **Actors** | All Users |

### Test Cases for UC-01: Manage Profile

| TEST CASE ID | TEST SCENARIO | TEST CASE | PRE-CONDITION | TEST STEPS | TEST DATA | EXPECTED RESULT | POST CONDITION | ACTUAL RESULT | STATUS (PASS/FAIL) |
|--------------|---------------|-----------|---------------|------------|-----------|-----------------|----------------|---------------|-------------------|
| TC-01-001 | Admin logs into system | Admin authenticates with valid credentials | Admin account exists and is verified | 1. Go to login page<br>2. Enter Admin credentials<br>3. Click Sign In | Email: admin@dost.gov.ph<br>Password: Admin123! | Successful login, Admin is redirected to Admin dashboard | Admin is authenticated and on dashboard | | |
| TC-01-002 | Admin views account approval | Admin accesses pending supplier approvals | Admin is logged in | 1. Admin logs into system<br>2. Admin is redirected to the dashboard<br>3. Admin clicks on "Account Approval" from sidebar | N/A | Account Approval page displays list of pending supplier accounts | Pending accounts are visible | | |
| TC-01-003 | Admin approves an account | Admin accepts a pending supplier account | Admin is logged in, pending accounts exist | 1. Admin navigates to Account Approval<br>2. Admin reviews pending account<br>3. Admin clicks "Approve" button<br>4. Admin confirms approval | Supplier Account: "ABC Corporation" | Account status changes to "approved", supplier can now login | Supplier account is approved | | |
| TC-01-004 | Admin rejects an account | Admin rejects a pending supplier account | Admin is logged in, pending accounts exist | 1. Admin navigates to Account Approval<br>2. Admin reviews pending account<br>3. Admin clicks "Reject" button<br>4. Admin enters rejection reason<br>5. Admin confirms rejection | Supplier: "XYZ Corp"<br>Reason: "Incomplete documents" | Account status changes to "rejected" with reason stored | Supplier account is rejected | | |
| TC-01-005 | Admin views list of suppliers | Admin accesses supplier list from sidebar | Admin is logged in | 1. Admin logs into system<br>2. Admin clicks on "List of Supplier" from sidebar | N/A | List of all supplier accounts displayed (pending, approved, rejected) | All suppliers are visible | | |
| TC-01-006 | User logs in with valid credentials (Other Actors) | TPU/GSPS/Supplier/Inspection logs in | User account exists and is verified | 1. User navigates to login page<br>2. User enters valid credentials<br>3. User clicks Login<br>4. System authenticates credentials | Email: tpu@dost.gov.ph<br>Password: Password123 | User is redirected to their role-specific dashboard | User is authenticated | | |
| TC-01-007 | User logs in with invalid username | User enters wrong username | User account does not exist | 1. User navigates to login page<br>2. User enters invalid credentials<br>3. User clicks Login | Email: wronguser@test.com<br>Password: Password123 | System displays "Login failed." or "These credentials do not match our records" | User remains on login page | | |
| TC-01-008 | User logs in with invalid password | User enters correct email but wrong password | User account exists | 1. User navigates to login page<br>2. User enters valid email<br>3. User enters invalid password<br>4. User clicks Login | Email: valid@dost.gov.ph<br>Password: WrongPassword | System displays "Login failed." or "These credentials do not match our records" | User remains on login page | | |
| TC-01-009 | Unregistered user attempts login | User is not registered in the system | No account exists with given email | 1. User navigates to login page<br>2. User inputs username and password<br>3. User clicks Login | Email: notregistered@test.com<br>Password: AnyPassword | User is prompted with "User is not registered" or "These credentials do not match our records" | Page stays on login page | | |
| TC-01-010 | User logout | Authenticated user logs out of system | User is currently logged in | 1. User clicks on profile/logout option<br>2. User confirms logout | N/A | User is logged out, session invalidated, redirected to login page | User is logged out | | |

---

## 📊 Use Case #2: View Dashboard (UC-02)

| Use Case ID | UC-02 |
|-------------|-------|
| **Author** | Cyber Sentinel |
| **Purpose** | Provides a personalized dashboard that displays role-based summaries and system reports relevant to each actor's functions |
| **Requirement Traceability** | BR-03, BR-12 |
| **Priority** | High |
| **Preconditions** | User is logged in |
| **Postconditions** | Dashboard displays data and metrics relevant to the user's role |
| **Actors** | All Users |

### Test Cases for UC-02: View Dashboard

| TEST CASE ID | TEST SCENARIO | TEST CASE | PRE-CONDITION | TEST STEPS | TEST DATA | EXPECTED RESULT | POST CONDITION | ACTUAL RESULT | STATUS (PASS/FAIL) |
|--------------|---------------|-----------|---------------|------------|-----------|-----------------|----------------|---------------|-------------------|
| TC-02-001 | Admin dashboard loads | Admin views personalized dashboard | Admin is logged in | 1. Admin logs into system<br>2. System loads Admin dashboard | Admin credentials | Dashboard displays admin-specific metrics: user statistics, supplier counts, charts | Dashboard is accessible | | |
| TC-02-002 | TPU dashboard loads | TPU views personalized dashboard | TPU is logged in | 1. TPU logs into system<br>2. System loads TPU dashboard | TPU credentials | Dashboard displays TPU-specific metrics: subscription stats, delivery pipeline, costs | Dashboard is accessible | | |
| TC-02-003 | GSPS dashboard loads | GSPS views personalized dashboard | GSPS is logged in | 1. GSPS logs into system<br>2. System loads GSPS dashboard | GSPS credentials | Dashboard displays GSPS-specific metrics: delivery status, inspection pending | Dashboard is accessible | | |
| TC-02-004 | Supplier dashboard loads | Supplier views personalized dashboard | Supplier is logged in and approved | 1. Supplier logs into system<br>2. System loads Supplier dashboard | Supplier credentials | Dashboard displays Supplier-specific metrics: assigned serials, delivery status | Dashboard is accessible | | |
| TC-02-005 | Inspection dashboard loads | Inspection Team views personalized dashboard | Inspection user is logged in | 1. Inspection logs into system<br>2. System loads Inspection dashboard | Inspection credentials | Dashboard displays Inspection-specific metrics: pending inspections, completed | Dashboard is accessible | | |
| TC-02-006 | User navigates sidebar features | User accesses other features from sidebar | User is logged in and on dashboard | 1. User views dashboard<br>2. User clicks on sidebar menu item<br>3. System navigates to selected feature | Sidebar Item: "Subscription Tracking" | User is redirected to the selected feature page | Feature page loads | | |
| TC-02-007 | User changes dashboard filter | User applies filter to dashboard data | User is logged in and on dashboard | 1. User views dashboard<br>2. User clicks filter button<br>3. User selects filter criteria (year/month/date)<br>4. User applies filter | Filter: Year 2025, Month: January-June | Dashboard data updates to reflect filtered criteria | Filter is applied | | |
| TC-02-008 | Dashboard temporarily unavailable | System encounters error loading dashboard | User is logged in, system has issues | 1. User logs into system<br>2. System fails to load dashboard data | N/A | System displays "Dashboard unavailable, please try again later." | User sees error message | | |
| TC-02-009 | Dashboard data refresh | User refreshes dashboard data | User is logged in and on dashboard | 1. User views dashboard<br>2. User clicks refresh or reloads page | N/A | Dashboard data is refreshed with latest information | Updated data displayed | | |

---

## 📝 Use Case #3: Manage Serials (UC-03)

| Use Case ID | UC-03 |
|-------------|-------|
| **Author** | Cyber Sentinels |
| **Purpose** | Facilitates encoding, receiving, updating, and acknowledging of serial publications across the system |
| **Requirement Traceability** | BR-04, BR-06, BR-08, BR-11 |
| **Priority** | High |
| **Preconditions** | User must be logged in as TPU and GSPS |
| **Postconditions** | Serial data is updated and stored; Delivery and inspection status changes trigger notifications; All updates are recorded in the audit log |
| **Actors** | TPU, GSPS |

### Test Cases for UC-03: Manage Serials

| TEST CASE ID | TEST SCENARIO | TEST CASE | PRE-CONDITION | TEST STEPS | TEST DATA | EXPECTED RESULT | POST CONDITION | ACTUAL RESULT | STATUS (PASS/FAIL) |
|--------------|---------------|-----------|---------------|------------|-----------|-----------------|----------------|---------------|-------------------|
| TC-03-001 | TPU adds new serial | TPU encodes new subscription details | TPU is logged in, approved suppliers exist | 1. TPU logs in and selects "Add Serial"<br>2. TPU encodes subscription details<br>3. TPU clicks "Add" button | Serial Title: "Science Journal 2025"<br>Supplier: "ABC Corp"<br>Period: "2025-2026"<br>Award Cost: 50000 | Success message displayed, serial is successfully encoded | Serial appears in system | | |
| TC-03-002 | TPU views serial items | TPU navigates to serial items list | TPU is logged in, serials exist | 1. TPU logs in<br>2. TPU navigates to "Serial Items" or "Subscription Tracking"<br>3. TPU views list of serials | N/A | List of all serials displayed with updated information | Serials are visible | | |
| TC-03-003 | TPU views overall serial information | TPU clicks view on a serial | TPU is logged in, serial exists | 1. TPU navigates to serial list<br>2. TPU clicks "View" on a serial item | Serial: "Science Journal 2025" | Overall information of the serial is displayed (title, supplier, status, costs) | Serial details visible | | |
| TC-03-004 | TPU edits serial details | TPU updates serial information | TPU is logged in, serial exists | 1. TPU navigates to serial list<br>2. TPU clicks "Edit" on a serial<br>3. TPU changes details<br>4. TPU clicks "Update" to save changes | Original Title: "Science Journal"<br>New Title: "Updated Science Journal" | Success message displayed, serial details are updated | Changes are saved | | |
| TC-03-005 | TPU deletes serial | TPU removes serial from database | TPU is logged in, serial exists | 1. TPU navigates to serial list<br>2. TPU clicks "Delete" on a serial<br>3. TPU confirms deletion | Serial to delete: "Test Serial" | Serial is removed from the database | Serial no longer exists | | |
| TC-03-006 | TPU adds serial without required fields | TPU submits incomplete serial form | TPU is logged in, on Add Serial page | 1. TPU selects "Add Serial"<br>2. TPU leaves required fields empty<br>3. TPU clicks "Add" button | Serial Title: (empty)<br>Supplier: (empty) | Validation error displayed, form not submitted | Form remains open | | |
| TC-03-007 | GSPS views dashboard and serial status | GSPS accesses dashboard to see serials | GSPS is logged in | 1. GSPS logs in<br>2. GSPS accesses "GSPS Dashboard"<br>3. GSPS views upcoming and status of serials | N/A | Dashboard shows serial statuses and upcoming deliveries | Serial status visible | | |
| TC-03-008 | GSPS marks serial status | GSPS updates delivery status of serial | GSPS is logged in, serial is for delivery | 1. GSPS logs in<br>2. GSPS finds serial with "for_delivery" status<br>3. GSPS marks serial as "Received" | Serial ISSN: "1234-5678" | Serial status changes to "received", receivedDate is set | Status updated | | |
| TC-03-009 | GSPS clicks inspection status | GSPS views inspection status of serials | GSPS is logged in | 1. GSPS logs in<br>2. GSPS clicks "Inspection Status" or views inspection column | N/A | Inspection status of serials is displayed (pending, inspected, for_return) | Inspection status visible | | |
| TC-03-010 | GSPS confirms serial information | GSPS reviews and confirms serial details | GSPS is logged in, serial received | 1. GSPS logs in<br>2. GSPS selects a received serial<br>3. GSPS views overall information<br>4. GSPS confirms it | Serial: "Science Journal Issue 1" | Serial is confirmed and ready for inspection | Confirmation recorded | | |
| TC-03-011 | System error retrieving data | System fails to load serial data | User is logged in, system has issues | 1. TPU/GSPS attempts to view serials<br>2. System encounters error | N/A | System displays "Please refresh or try again later." | Error message shown | | |
| TC-03-012 | TPU filters serials by status | TPU filters serial list | TPU is logged in, on serial list | 1. TPU navigates to serial list<br>2. TPU selects status filter "Active"<br>3. TPU applies filter | Status: "Active" | Only Active serials are displayed | Filter applied | | |
| TC-03-013 | TPU searches serials | TPU searches by serial title or supplier | TPU is logged in, on serial list | 1. TPU navigates to serial list<br>2. TPU enters search term<br>3. TPU presses Enter | Search: "Science" | Only matching serials displayed | Search results shown | | |

---

## 💬 Use Case #4: Send Messages (UC-04)

| Use Case ID | UC-04 |
|-------------|-------|
| **Author** | Cyber Sentinels |
| **Purpose** | Allows users to communicate and collaborate directly within the system for faster coordination and clarification |
| **Requirement Traceability** | BR-05, BR-09, BR-11 |
| **Priority** | High |
| **Preconditions** | Both sender and receiver must have active accounts |
| **Postconditions** | Message is delivered and stored for audit |
| **Actors** | Supplier, TPU, GSPS, Inspection Team |

### Test Cases for UC-04: Send Messages

| TEST CASE ID | TEST SCENARIO | TEST CASE | PRE-CONDITION | TEST STEPS | TEST DATA | EXPECTED RESULT | POST CONDITION | ACTUAL RESULT | STATUS (PASS/FAIL) |
|--------------|---------------|-----------|---------------|------------|-----------|-----------------|----------------|---------------|-------------------|
| TC-04-001 | User opens chat from sidebar | User accesses chat feature | User is logged in (Supplier/TPU/GSPS/Inspection) | 1. User logs into system<br>2. User opens "Chat" from the sidebar | N/A | Chat page is displayed with list of conversations | Chat is accessible | | |
| TC-04-002 | User selects recipient | User chooses who to message | User is logged in, other users exist | 1. User opens Chat<br>2. User clicks "New Chat" or selects recipient<br>3. User views available users | N/A | List of available recipients displayed based on role permissions | Recipients visible | | |
| TC-04-003 | User composes and sends message | User sends a text message | User is logged in, recipient selected | 1. User opens "Chat" from sidebar<br>2. User selects a recipient<br>3. User composes a message<br>4. User clicks send message | Recipient: "TPU Staff"<br>Message: "Hello, regarding the serial delivery..." | Message is sent and appears in conversation | Message delivered | | |
| TC-04-004 | User sends message with attachment | User attaches file to message | User is logged in, chat open | 1. User opens Chat<br>2. User selects recipient<br>3. User clicks attach file<br>4. User selects file<br>5. User clicks send | File: document.pdf (2MB)<br>Message: "Please see attached" | File is uploaded and message with attachment is sent | Attachment delivered | | |
| TC-04-005 | Message delivery fails - connection issue | System retries or queues message | User is logged in, network unstable | 1. User composes message<br>2. User clicks send<br>3. Network connection fails | Message: "Test message" | System retries or queues the message, displays retry notification | Message queued | | |
| TC-04-006 | User views chat history | User scrolls through past messages | User is logged in, chat has history | 1. User opens Chat<br>2. User selects existing conversation<br>3. User scrolls through messages | N/A | All previous messages displayed in chronological order | History visible | | |
| TC-04-007 | User edits own message | User modifies a sent message | User is logged in, own message exists | 1. User opens Chat<br>2. User finds own message<br>3. User clicks edit<br>4. User modifies text<br>5. User saves | Original: "Test"<br>New: "Updated test message" | Message is updated, "edited" indicator shown | Message edited | | |
| TC-04-008 | User deletes own message | User removes a sent message | User is logged in, own message exists | 1. User opens Chat<br>2. User finds own message<br>3. User clicks delete<br>4. User confirms | Message: own message to delete | Message is removed from conversation | Message deleted | | |
| TC-04-009 | Supplier chats with TPU | Supplier communicates with TPU staff | Supplier is logged in, TPU exists | 1. Supplier opens Chat<br>2. Supplier selects TPU recipient<br>3. Supplier sends message | Recipient: "TPU Staff"<br>Message: "Delivery update" | Message delivered to TPU | Communication successful | | |
| TC-04-010 | Supplier restricted from chatting with other suppliers | Supplier cannot message another supplier | Supplier is logged in | 1. Supplier opens Chat<br>2. Supplier looks for other suppliers in recipient list | N/A | Other suppliers are not shown in available recipients | Chat restricted | | |
| TC-04-011 | User downloads attachment from chat | User downloads received file | User is logged in, attachment exists | 1. User opens Chat<br>2. User finds message with attachment<br>3. User clicks download | Attachment: report.pdf | File download starts | File downloaded | | |

---

## 🔍 Use Case #5: Inspect Serial (UC-05)

| Use Case ID | UC-05 |
|-------------|-------|
| **Author** | Cyber Sentinels |
| **Purpose** | Enables the Inspection Team to review, verify, and document the quality and completeness of delivered serials |
| **Requirement Traceability** | BR-07, BR-10, BR-11 |
| **Priority** | High |
| **Preconditions** | GSPS must have marked items as "For Inspection" |
| **Postconditions** | Inspection data and reports are recorded; Notification is sent to TPU and GSPS indicating inspection completion |
| **Actors** | Inspection Team |

### Test Cases for UC-05: Inspect Serial

| TEST CASE ID | TEST SCENARIO | TEST CASE | PRE-CONDITION | TEST STEPS | TEST DATA | EXPECTED RESULT | POST CONDITION | ACTUAL RESULT | STATUS (PASS/FAIL) |
|--------------|---------------|-----------|---------------|------------|-----------|-----------------|----------------|---------------|-------------------|
| TC-05-001 | Inspection Team opens Inspect page | Inspection Team accesses inspection feature | Inspection Team is logged in | 1. Inspection Team logs in<br>2. Inspection Team opens "Inspect" from sidebar or dashboard | N/A | Inspect page is displayed | Inspect page accessible | | |
| TC-05-002 | System lists serials awaiting inspection | Inspection Team views pending inspections | Inspection is logged in, serials marked for inspection exist | 1. Inspection Team logs in<br>2. Inspection Team opens "Inspect"<br>3. System lists serials awaiting inspection | N/A | List of serials with inspection_status "pending" is displayed | Pending serials visible | | |
| TC-05-003 | Inspection Team marks serial as Accepted | Inspection Team approves a serial | Inspection is logged in, pending serial exists | 1. Inspection Team opens Inspect<br>2. Inspection Team selects a serial<br>3. Inspection Team marks result as "Accepted"<br>4. Inspection Team fills out inspection report<br>5. System stores data | Serial: "Science Journal Issue 1"<br>Result: "Accepted"<br>Inspector: "Juan Dela Cruz"<br>Remarks: "Good condition" | Inspection recorded, status changes to "inspected", notification sent to TPU and GSPS | Inspection complete | | |
| TC-05-004 | Inspection Team marks serial as Rejected | Inspection Team rejects a serial | Inspection is logged in, pending serial exists | 1. Inspection Team opens Inspect<br>2. Inspection Team selects a serial<br>3. Inspection Team marks result as "Rejected"<br>4. Inspection Team fills out inspection report with reason<br>5. System stores data | Serial: "Damaged Journal"<br>Result: "Rejected"<br>Remarks: "Pages torn, cover damaged" | Inspection recorded, status changes to "for_return", notification sent to TPU and GSPS | Serial marked for return | | |
| TC-05-005 | Inspection Team fills out inspection report | Inspection Team completes report form | Inspection is logged in, inspecting a serial | 1. Inspection Team selects serial<br>2. Inspection Team enters inspector name<br>3. Inspection Team selects condition<br>4. Inspection Team completes checklist<br>5. Inspection Team adds remarks<br>6. Inspection Team uploads proof (if needed)<br>7. Inspection Team submits | Inspector: "Maria Santos"<br>Condition: "Acceptable"<br>Checklist: All items checked<br>Remarks: "Complete and in good condition" | Report is saved with all details | Report recorded | | |
| TC-05-006 | Inspection Team uploads proof/attachment | Inspection Team attaches photo evidence | Inspection is logged in, during inspection | 1. Inspection Team is filling inspection report<br>2. Inspection Team clicks attach/upload<br>3. Inspection Team selects image file<br>4. Inspection Team submits | Image: inspection_proof.jpg (2MB) | Image is uploaded and stored with inspection record | Attachment saved | | |
| TC-05-007 | Missing report file - system prompts upload | Inspection Team tries to save without required attachment | Inspection is logged in, attachment required | 1. Inspection Team fills inspection report<br>2. Inspection Team does not upload required proof<br>3. Inspection Team clicks save/submit | Report without attachment | System prompts "Please upload inspection report/proof before saving" | Form not submitted | | |
| TC-05-008 | Notification sent to TPU and GSPS | System notifies relevant parties | Inspection complete | 1. Inspection Team completes inspection<br>2. Inspection Team submits report<br>3. System processes and stores data<br>4. System sends notification | N/A | Notification is sent to TPU and GSPS about inspection results | Parties notified | | |
| TC-05-009 | Inspection Team views inspection history | Inspection Team reviews past inspections | Inspection is logged in, past inspections exist | 1. Inspection Team logs in<br>2. Inspection Team navigates to inspection history/list<br>3. Inspection Team views completed inspections | N/A | List of all inspected serials with details (date, inspector, result) displayed | History visible | | |
| TC-05-010 | Inspection Team views serials by date | Inspection Team filters by inspection date | Inspection is logged in, on View by Date | 1. Inspection Team navigates to "View by Date"<br>2. Inspection Team selects date range<br>3. System filters results | Start: 2025-02-01<br>End: 2025-02-13 | Only serials inspected within date range displayed | Filter applied | | |
| TC-05-011 | Inspection Team submits without required fields | Inspection Team submits incomplete form | Inspection is logged in, during inspection | 1. Inspection Team selects serial<br>2. Inspection Team leaves inspector name empty<br>3. Inspection Team clicks submit | Inspector: (empty)<br>Condition: "Acceptable" | Validation error "Inspector name is required" displayed | Form not submitted | | |
| TC-05-012 | Inspection attachment too large | Inspection Team uploads oversized file | Inspection is logged in, during inspection | 1. Inspection Team is filling report<br>2. Inspection Team tries to upload large image | Image: large_photo.jpg (10MB) | Error message "File too large. Maximum 5MB allowed" | Upload rejected | | |

---

## 📊 Test Case Summary

| Use Case | Use Case ID | Number of Test Cases | Test Case IDs |
|----------|-------------|---------------------|---------------|
| Manage Profile (Authentication) | UC-01 | 10 | TC-01-001 to TC-01-010 |
| View Dashboard | UC-02 | 9 | TC-02-001 to TC-02-009 |
| Manage Serials | UC-03 | 13 | TC-03-001 to TC-03-013 |
| Send Messages | UC-04 | 11 | TC-04-001 to TC-04-011 |
| Inspect Serial | UC-05 | 12 | TC-05-001 to TC-05-012 |
| **Total** | | **55** | |

---

## 📋 Test Case Traceability Matrix

| Requirement | Use Case | Test Cases |
|-------------|----------|------------|
| BR-01 | UC-01 | TC-01-001, TC-01-006, TC-01-007, TC-01-008, TC-01-009 |
| BR-02 | UC-01 | TC-01-002, TC-01-003, TC-01-004, TC-01-005 |
| BR-03 | UC-02 | TC-02-001, TC-02-002, TC-02-003, TC-02-004, TC-02-005 |
| BR-04 | UC-03 | TC-03-001, TC-03-002, TC-03-003, TC-03-004, TC-03-005 |
| BR-05 | UC-04 | TC-04-001, TC-04-002, TC-04-003, TC-04-004 |
| BR-06 | UC-03 | TC-03-007, TC-03-008, TC-03-009, TC-03-010 |
| BR-07 | UC-05 | TC-05-001, TC-05-002, TC-05-003, TC-05-004, TC-05-005 |
| BR-08 | UC-03 | TC-03-001, TC-03-004, TC-03-005 |
| BR-09 | UC-04 | TC-04-005, TC-04-006, TC-04-007, TC-04-008 |
| BR-10 | UC-05 | TC-05-006, TC-05-007, TC-05-008 |
| BR-11 | UC-01, UC-03, UC-04, UC-05 | TC-01-010, TC-03-011, TC-04-005, TC-05-008 |
| BR-12 | UC-02 | TC-02-006, TC-02-007, TC-02-008, TC-02-009 |
