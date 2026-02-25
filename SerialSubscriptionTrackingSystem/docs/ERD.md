# Entity Relationship Diagram — Serial Subscription Tracking System

> This Mermaid ERD is auto-rendered by GitHub. To export as an image, paste the code block into [mermaid.live](https://mermaid.live) and click **Download PNG/SVG**.

```mermaid
erDiagram
    users {
        ObjectId _id PK
        string name
        string email UK
        string password
        string role "admin | tpu | gsps | supplier | inspection"
        datetime email_verified_at
        boolean is_disabled
        string remember_token
        datetime created_at
        datetime updated_at
    }

    supplier_accounts {
        ObjectId _id PK
        string company_name
        string contact_person
        string email
        string phone
        string address
        string username
        string password
        string status "pending | approved | rejected"
        ObjectId created_by FK "User who created"
        ObjectId approved_by FK "Admin who approved"
        datetime approved_at
        datetime rejected_at
        string rejection_reason
        ObjectId user_id FK "User account after approval"
        datetime created_at
        datetime updated_at
    }

    subscriptions {
        ObjectId _id PK
        string serial_title
        ObjectId supplier_id FK
        string supplier_name
        string period
        float award_cost
        float delivered_cost
        float remaining_cost
        string status "Active | Inactive | Completed"
        string payment_status "Fully Paid | Partially Paid | Overpaid | Unpaid"
        integer progress
        string note
        string issn
        string frequency
        string author_publisher
        string category
        ObjectId created_by FK "TPU user ID"
        array serials "Array of serial items"
        array transactions "Array of payment transactions"
        datetime created_at
        datetime updated_at
    }

    chats {
        ObjectId _id PK
        ObjectId user_id_1 FK
        ObjectId user_id_2 FK
        string user_1_name
        string user_1_role
        string user_2_name
        string user_2_role
        datetime last_message_at
        string type
        string name
        array participants
        datetime created_at
        datetime updated_at
    }

    messages {
        ObjectId _id PK
        ObjectId chat_id FK
        ObjectId sender_id FK
        string content
        datetime read_at
        string attachment
        array attachment_data "Structured attachment object"
        boolean is_edited
        datetime created_at
        datetime updated_at
    }

    audit_logs {
        ObjectId _id PK
        ObjectId user_id FK
        string user_name
        string user_email
        string role
        string action "create | update | delete | approve | reject | login | logout"
        string model_type
        string model_id
        string description
        array old_values
        array new_values
        string ip_address
        string user_agent
        string url
        string method
        datetime created_at
        datetime updated_at
    }

    delivery_notifications {
        ObjectId _id PK
        ObjectId subscription_id FK
        integer serial_index
        string serial_title
        ObjectId supplier_id FK
        string supplier_name
        string supplier_email
        datetime delivery_date
        string notification_type "initial_reminder | daily_reminder"
        integer days_until_delivery
        boolean is_read
        boolean is_email_sent
        datetime sent_at
        datetime read_at
        datetime created_at
        datetime updated_at
    }

    process_movement_logs {
        ObjectId _id PK
        string record_type "subscription | serial | supplier_account"
        string record_id
        string record_title
        ObjectId from_user_id FK
        string from_user_name
        string from_role
        ObjectId to_user_id FK
        string to_user_name
        string to_role
        string status_from
        string status_to
        string action "submit | approve | reject | forward | receive | inspect"
        string remarks
        array metadata
        datetime created_at
        datetime updated_at
    }

    user_notifications {
        ObjectId _id PK
        ObjectId user_id FK
        string user_role "tpu | supplier | gsps | inspection"
        string type "serial_status_change | inspection_complete"
        string title
        string message
        array data
        boolean is_read
        datetime read_at
        ObjectId created_by FK
        string created_by_role
        datetime created_at
        datetime updated_at
    }

    users ||--o{ supplier_accounts : "creates (created_by)"
    users ||--o{ supplier_accounts : "approves (approved_by)"
    users ||--o| supplier_accounts : "linked account (user_id)"
    users ||--o{ subscriptions : "creates (created_by)"
    supplier_accounts ||--o{ subscriptions : "supplies"
    users ||--o{ chats : "participates as user_1"
    users ||--o{ chats : "participates as user_2"
    chats ||--o{ messages : "contains"
    users ||--o{ messages : "sends"
    users ||--o{ audit_logs : "performs"
    subscriptions ||--o{ delivery_notifications : "generates"
    users ||--o{ process_movement_logs : "moves from (from_user)"
    users ||--o{ process_movement_logs : "moves to (to_user)"
    users ||--o{ user_notifications : "receives"
```
