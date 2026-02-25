<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your DOST-STII LAMS Account</title>
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
            background: linear-gradient(135deg, #2e7d32 0%, #43a047 50%, #66bb6a 100%);
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
            color: #2e7d32;
            margin-bottom: 20px;
        }
        .message {
            font-size: 15px;
            color: #555555;
            margin-bottom: 30px;
        }
        .credentials-box {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
        }
        .credentials-box h3 {
            color: #2e7d32;
            margin: 0 0 20px 0;
            font-size: 16px;
            border-bottom: 2px solid #43a047;
            padding-bottom: 10px;
        }
        .credential-row {
            display: flex;
            margin-bottom: 15px;
        }
        .credential-label {
            font-weight: 600;
            color: #333333;
            width: 120px;
            flex-shrink: 0;
        }
        .credential-value {
            color: #1b5e20;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            background-color: #f1f8e9;
            padding: 5px 10px;
            border-radius: 4px;
            border: 1px solid #c5e1a5;
            word-break: break-all;
        }
        .role-badge {
            display: inline-block;
            background-color: #28a745;
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
        .login-button {
            display: inline-block;
            background: linear-gradient(135deg, #43a047 0%, #66bb6a 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(67, 160, 71, 0.3);
        }
        .login-button:hover {
            background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%);
            box-shadow: 0 6px 20px rgba(67, 160, 71, 0.4);
        }
        .security-notice {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 15px 20px;
            margin-bottom: 25px;
        }
        .security-notice h4 {
            color: #856404;
            margin: 0 0 10px 0;
            font-size: 14px;
        }
        .security-notice ul {
            margin: 0;
            padding-left: 20px;
            color: #856404;
            font-size: 13px;
        }
        .security-notice li {
            margin-bottom: 5px;
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
            color: #2e7d32;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 25px;
            }
            .header {
                padding: 20px;
            }
            .credential-row {
                flex-direction: column;
            }
            .credential-label {
                width: 100%;
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>DOST-STII LAMS</h1>
            <p>Library Automated Management System</p>
        </div>
        
        <div class="content">
            <p class="greeting">Hello {{ $recipientName }},</p>
            
            <p class="message">
                Your account has been successfully created in the DOST-STII Library Automated Management System (LAMS). 
                Please find your login credentials below:
            </p>
            
            <div class="credentials-box">
                <h3>Your Account Credentials</h3>
                
                <div class="credential-row">
                    <span class="credential-label">Email:</span>
                    <span class="credential-value">{{ $email }}</span>
                </div>
                
                <div class="credential-row">
                    <span class="credential-label">Password:</span>
                    <span class="credential-value">{{ $temporaryPassword }}</span>
                </div>
                
                <div class="credential-row">
                    <span class="credential-label">Role:</span>
                    <span class="role-badge">{{ $role }}</span>
                </div>
            </div>
            
            <div class="security-notice">
                <h4>Important Security Notice</h4>
                <ul>
                    <li>Please change your password immediately after your first login</li>
                    <li>Do not share your credentials with anyone</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Contact the administrator if you did not request this account</li>
                </ul>
            </div>
            
            <div class="button-container">
                <a href="{{ $loginUrl }}" class="login-button">Login to Your Account</a>
            </div>
            
            <p class="message">
                If you have any questions or need assistance, please contact the system administrator.
            </p>
        </div>
        
        <div class="footer">
            <p class="system-name">DOST-STII Library Automated Management System</p>
            <p>Department of Science and Technology - Science and Technology Information Institute</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
