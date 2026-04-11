# Entity Relationship Diagram — Serial Subscription Tracking System

> This Mermaid ERD is auto-rendered by GitHub. To export as an image, paste the code block into [mermaid.live](https://mermaid.live) and click **Download PNG/SVG**.

```mermaid
erDiagram
    users {
        int id PK
        varchar name
        varchar email
        varchar password
        varchar role
    }

    supplier_accounts {
        int id PK
        varchar company_name
        varchar contact_person
        varchar email
        int phone
        varchar address
        varchar username
        varchar password
    }

    audit_logs {
        int id PK
        int user_id FK
        varchar user_name
        varchar user_email
        varchar role
        varchar action
        varchar description
        varchar ip_address
    }

    serial_records {
        int serial_id PK
        int user_id FK
        varchar serial_title
        Type serial_issn
        decimal serial_total_cost
        date serial_start_date
        date serial_end_date
        varchar serial_frequency
    }

    subscriptions {
        int id PK
        varchar serial_title
        int supplier_id FK
        varchar supplier_name
        int issn
        varchar author_publisher
        int award_cost
        int delivered_cost
        int remaining_cost
        varchar status
    }

    messages {
        int id PK
        int user_id FK
        varchar user_name
        varchar content
        varchar attachment
        Type status
    }

    users ||--o{ supplier_accounts : "has"
    users ||--o{ audit_logs : "has"
    users ||--o{ serial_records : "has"
    users ||--o{ messages : "sends"
    supplier_accounts ||--o{ subscriptions : "has"
```
