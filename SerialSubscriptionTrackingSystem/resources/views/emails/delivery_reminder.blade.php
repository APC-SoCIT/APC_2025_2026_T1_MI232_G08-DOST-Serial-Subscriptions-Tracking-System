<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery Reminder - DOST STII</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background-color: #004A98;
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .email-header p {
            margin: 8px 0 0;
            font-size: 14px;
            color: #ffffff;
            opacity: 1;
        }
        .email-body {
            padding: 30px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .reminder-box {
            background-color: #f8f9fa;
            border-left: 4px solid #FF9800;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .reminder-urgent {
            background-color: #fff3cd;
            border-left-color: #FFC107;
        }
        .reminder-box h2 {
            margin: 0 0 15px;
            font-size: 18px;
            color: #FF9800;
        }
        .reminder-urgent h2 {
            color: #FFC107;
        }
        .detail-row {
            display: flex;
            margin-bottom: 12px;
        }
        .detail-label {
            font-weight: 600;
            color: #555555;
            width: 150px;
            flex-shrink: 0;
        }
        .detail-value {
            color: #333333;
        }
        .reminder-type-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        .badge-initial {
            background-color: #e3f2fd;
            color: #1976d2;
        }
        .badge-daily {
            background-color: #fff3e0;
            color: #f57c00;
        }
        .action-message {
            background-color: #fffde7;
            border-left: 4px solid #FFC107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
            font-size: 15px;
            color: #856404;
        }
        .alert-high {
            background-color: #ffebee;
            border-left-color: #dc3545;
            color: #721c24;
        }
        .email-footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .email-footer p {
            margin: 5px 0;
            font-size: 13px;
            color: #6c757d;
        }
        .email-footer .dost-branding {
            font-weight: 600;
            color: #004A98;
        }
        .italic {
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Serial Subscription Tracking System</h1>
            <p>Department of Science and Technology - STII</p>
        </div>
        
        <div class="email-body">
            <p class="greeting">
                Dear {{ $recipientName }},
            </p>
            
            <p>This is a reminder regarding the scheduled delivery of the following serial:</p>
            
            <div class="reminder-box {{ $notificationType === 'daily_reminder' ? 'reminder-urgent' : '' }}">
                <h2>
                    @if($notificationType === 'initial_reminder')
                        Delivery Scheduled
                    @else
                        Urgent: Delivery Due Soon
                    @endif
                </h2>
                
                <div class="detail-row">
                    <span class="detail-label">Serial Title:</span>
                    <span class="detail-value"><strong>{{ $serialTitle }}</strong></span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Scheduled Delivery:</span>
                    <span class="detail-value">
                        <strong>{{ \Carbon\Carbon::parse($deliveryDate)->format('F j, Y') }}</strong>
                        <span class="italic">({{ $daysText }})</span>
                    </span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Notification Type:</span>
                    <span class="detail-value">
                        <span class="reminder-type-badge {{ $notificationType === 'initial_reminder' ? 'badge-initial' : 'badge-daily' }}">
                            {{ $notificationType === 'initial_reminder' ? 'Initial Reminder' : 'Daily Reminder' }}
                        </span>
                    </span>
                </div>
            </div>

            @if($notificationType === 'initial_reminder')
                <div class="action-message">
                    <strong>Action Required:</strong> Please ensure you are ready to receive this serial on the scheduled delivery date. Confirm receipt when the delivery arrives.
                </div>
            @else
                <div class="action-message alert-high">
                    <strong>Urgent Action Required:</strong> The scheduled delivery is happening in {{ $daysText }}. Please ensure you are ready to receive this serial and have made all necessary preparations.
                </div>
            @endif

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                If you have any questions about this delivery or need to reschedule, please contact the DOST Serial Subscription Tracking System administrator.
            </p>
        </div>
        
        <div class="email-footer">
            <p>
                <span class="dost-branding">Serial Subscription Tracking System</span>
            </p>
            <p>Department of Science and Technology - Science and Technology Information Institute (STII)</p>
            <p style="margin-top: 10px; color: #999;">
                This is an automated notification. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
