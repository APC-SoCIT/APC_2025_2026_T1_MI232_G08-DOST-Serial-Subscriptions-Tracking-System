<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Serial Status Update - DOST STII</title>
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
        .status-box {
            background-color: #f8f9fa;
            border-left: 4px solid #004A98;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .status-box h2 {
            margin: 0 0 15px;
            font-size: 18px;
            color: #004A98;
        }
        .detail-row {
            display: flex;
            margin-bottom: 12px;
        }
        .detail-label {
            font-weight: 600;
            color: #555555;
            width: 140px;
            flex-shrink: 0;
        }
        .detail-value {
            color: #333333;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: capitalize;
        }
        .status-created { background-color: #cce5ff; color: #004085; }
        .status-pending { background-color: #fff3cd; color: #856404; }
        .status-accepted { background-color: #d4edda; color: #155724; }
        .status-prepare { background-color: #e2e3e5; color: #383d41; }
        .status-for_delivery { background-color: #cce5ff; color: #004085; }
        .status-received { background-color: #d4edda; color: #155724; }
        .status-inspected { background-color: #28a745; color: #ffffff; }
        .status-delivered { background-color: #28a745; color: #ffffff; }
        .status-completed { background-color: #d4edda; color: #155724; }
        .status-for_return { background-color: #dc3545; color: #ffffff; }
        .status-cancelled { background-color: #f8d7da; color: #721c24; }
        .status-rejected { background-color: #f8d7da; color: #721c24; }
        .status-delayed { background-color: #fff3cd; color: #856404; }
        .status-approved { background-color: #d4edda; color: #155724; }
        .status-deleted { background-color: #f8d7da; color: #721c24; }
        .description {
            margin: 20px 0;
            padding: 15px;
            background-color: #f0f7ff;
            border-radius: 6px;
            font-size: 15px;
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
                @if($recipientName)
                    Dear {{ $recipientName }},
                @else
                    Dear User,
                @endif
            </p>
            
            @if(in_array($targetRole, ['tpu', 'gsps', 'inspection', 'admin']) && $supplierName)
                <p>This is to notify you of an update regarding one of the assigned serials to <strong>{{ $supplierName }}</strong>.</p>
            @else
                <p>This is to notify you of an update regarding one of your assigned serials:</p>
            @endif
            
            <div class="status-box">
                <h2>Serial Status Update</h2>
                
                <div class="detail-row">
                    <span class="detail-label">Serial Title:</span>
                    <span class="detail-value"><strong>{{ $serialTitle }}</strong></span>
                </div>
                
                @if($supplierName)
                <div class="detail-row">
                    <span class="detail-label">Supplier:</span>
                    <span class="detail-value">{{ $supplierName }}</span>
                </div>
                @endif
                
                <div class="detail-row">
                    <span class="detail-label">Current Status:</span>
                    <span class="detail-value">
                        <span class="status-badge status-{{ strtolower(str_replace(' ', '_', $currentStatus)) }}">
                            {{ ucfirst(str_replace('_', ' ', $currentStatus)) }}
                        </span>
                    </span>
                </div>
                
                @if($actorName && in_array(strtolower($currentStatus), ['received', 'inspected', 'for_return']))
                <div class="detail-row">
                    <span class="detail-label">{{ strtolower($currentStatus) === 'received' ? 'Received By:' : 'Inspected By:' }}</span>
                    <span class="detail-value"><strong>{{ $actorName }}</strong></span>
                </div>
                @endif
                
                <div class="detail-row">
                    <span class="detail-label">Date & Time:</span>
                    <span class="detail-value">{{ $updateDateTime }}</span>
                </div>
            </div>
            
            <div class="description">
                {{ $statusDescription }}
            </div>
            
            <p>Please log in to the Serial Subscription Tracking System to view more details or take necessary actions.</p>
        </div>
        
        <div class="email-footer">
            <p class="dost-branding">DOST - Science and Technology Information Institute</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
            <p>If you have any questions, please contact your system administrator.</p>
        </div>
    </div>
</body>
</html>
