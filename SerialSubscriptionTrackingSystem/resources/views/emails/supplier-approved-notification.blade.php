<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supplier Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7fa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                ✓ Supplier Account Approved
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; font-weight: 500;">
                                DOST Serial Subscription Tracking System
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                                Good news! A supplier account you created has been approved and is now active.
                            </p>
                            
                            <!-- Supplier Details Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #d4edda; border-radius: 8px; margin: 25px 0; border: 1px solid #c3e6cb;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 15px 0; color: #155724; font-size: 16px; font-weight: 600;">
                                            Approved Supplier Details
                                        </h3>
                                        <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                                            <tr>
                                                <td style="padding: 5px 0; color: #155724;">
                                                    <strong>Company Name:</strong>
                                                </td>
                                                <td style="padding: 5px 0; color: #155724;">
                                                    {{ $companyName }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #155724;">
                                                    <strong>Contact Person:</strong>
                                                </td>
                                                <td style="padding: 5px 0; color: #155724;">
                                                    {{ $contactPerson }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #155724;">
                                                    <strong>Email:</strong>
                                                </td>
                                                <td style="padding: 5px 0; color: #155724;">
                                                    {{ $email }}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Approval Info -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e2e3e5; border-radius: 8px; margin: 25px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                                            <tr>
                                                <td style="padding: 5px 0; color: #495057;">
                                                    <strong>Approved By:</strong>
                                                </td>
                                                <td style="padding: 5px 0; color: #495057;">
                                                    {{ $approvedBy }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #495057;">
                                                    <strong>Approved On:</strong>
                                                </td>
                                                <td style="padding: 5px 0; color: #495057;">
                                                    {{ $approvedAt }}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                                The supplier can now log in to the system and access their dashboard. You can view and manage this supplier from your dashboard.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d; line-height: 1.6;">
                                This is an automated notification from the<br>
                                <strong>DOST Serial Subscription Tracking System</strong>
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 11px; color: #adb5bd;">
                                © {{ date('Y') }} Department of Science and Technology. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
