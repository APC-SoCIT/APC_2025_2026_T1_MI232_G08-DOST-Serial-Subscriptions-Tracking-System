<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pending Supplier Approval</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            padding: 30px 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            color: #ffffff;
            margin: 10px 0 0 0;
            font-size: 14px;
            font-weight: 500;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 18px;
            color: #f57c00;
            margin-bottom: 20px;
        }
        .message {
            font-size: 15px;
            color: #555555;
            margin-bottom: 30px;
        }
        .supplier-box {
            background-color: #fff8e1;
            border: 1px solid #ffcc02;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
        }
        .supplier-box h3 {
            color: #f57c00;
            margin: 0 0 20px 0;
            font-size: 16px;
            border-bottom: 2px solid #ff9800;
            padding-bottom: 10px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 12px;
        }
        .detail-label {
            font-weight: 600;
            color: #333333;
            width: 130px;
            flex-shrink: 0;
        }
        .detail-value {
            color: #555555;
        }
        .pending-badge {
            display: inline-block;
            background-color: #ff9800;
            color: #ffffff;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            text-transform: uppercase;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .approve-button {
            display: inline-block;
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }
        .approve-button:hover {
            background: linear-gradient(135deg, #388e3c 0%, #4caf50 100%);
        }
        .notice {
            background-color: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 6px;
            padding: 15px 20px;
            margin-bottom: 25px;
        }
        .notice p {
            margin: 0;
            color: #1565c0;
            font-size: 14px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 25px 40px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
            font-size: 12px;
            color: #6c757d;
        }
        .footer .system-name {
            font-weight: 600;
            color: #f57c00;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 25px;
            }
            .header {
                padding: 20px;
            }
            .detail-row {
                flex-direction: column;
            }
            .detail-label {
                width: 100%;
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Pending Supplier Approval</h1>
            <p>DOST-STII Library Automated Management System</p>
        </div>
        
        <div class="content">
            <p class="greeting">Action Required</p>
            
            <p class="message">
                A new supplier account has been created by TPU and is awaiting your approval. 
                Please review the details below and take appropriate action.
            </p>
            
            <div class="supplier-box">
                <h3>Supplier Account Details</h3>
                
                <div class="detail-row">
                    <span class="detail-label">Company Name:</span>
                    <span class="detail-value"><strong>{{ $companyName }}</strong></span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Contact Person:</span>
                    <span class="detail-value">{{ $contactPerson }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">{{ $email }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">{{ $phone }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">{{ $address }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Submitted On:</span>
                    <span class="detail-value">{{ $createdAt }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="pending-badge">Pending Approval</span>
                </div>
            </div>
            
            <div class="notice">
                <p>Please log in to the admin dashboard to approve or reject this supplier account.</p>
            </div>
            
            <div class="button-container">
                <a href="{{ $approvalUrl }}" class="approve-button">Account Approval</a>
            </div>
        </div>
        
        <div class="footer">
            <p class="system-name">DOST-STII Library Automated Management System</p>
            <p>Department of Science and Technology - Science and Technology Information Institute</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
