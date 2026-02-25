<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Serial Status Summary - Admin</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7fa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #004A98 0%, #0066cc 100%); padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">
                                📊 Serial Status Summary
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; font-weight: 500;">
                                Department of Science and Technology - STII
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Latest Update Banner -->
                    <tr>
                        <td style="padding: 0;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="background-color: #e8f4fd; padding: 15px 40px; border-bottom: 2px solid #004A98;">
                                        <p style="margin: 0; font-size: 14px; color: #004A98; font-weight: 600;">
                                            ⚡ Latest Update: {{ $latestAction }}
                                        </p>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
                                            {{ $updateDateTime }}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Serial Details -->
                    <tr>
                        <td style="padding: 30px 40px 20px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                                Serial Information
                            </h2>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px; width: 120px;">Serial Title:</td>
                                    <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">{{ $serialTitle }}</td>
                                </tr>
                                @if($issn)
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">ISSN:</td>
                                    <td style="padding: 8px 0; color: #333; font-size: 14px;">{{ $issn }}</td>
                                </tr>
                                @endif
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Supplier:</td>
                                    <td style="padding: 8px 0; color: #333; font-size: 14px;">{{ $supplierName }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Current Status:</td>
                                    <td style="padding: 8px 0;">
                                        @php
                                            $statusColors = [
                                                'created' => ['bg' => '#cce5ff', 'text' => '#004085'],
                                                'pending' => ['bg' => '#fff3cd', 'text' => '#856404'],
                                                'accepted' => ['bg' => '#d4edda', 'text' => '#155724'],
                                                'prepare' => ['bg' => '#e2e3e5', 'text' => '#383d41'],
                                                'for_delivery' => ['bg' => '#cce5ff', 'text' => '#004085'],
                                                'received' => ['bg' => '#d4edda', 'text' => '#155724'],
                                                'inspected' => ['bg' => '#28a745', 'text' => '#ffffff'],
                                                'delivered' => ['bg' => '#28a745', 'text' => '#ffffff'],
                                                'for_return' => ['bg' => '#dc3545', 'text' => '#ffffff'],
                                            ];
                                            $color = $statusColors[$currentStatus] ?? ['bg' => '#e2e3e5', 'text' => '#333'];
                                        @endphp
                                        <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background-color: {{ $color['bg'] }}; color: {{ $color['text'] }}; text-transform: uppercase;">
                                            {{ str_replace('_', ' ', $currentStatus) }}
                                        </span>
                                    </td>
                                </tr>
                                @if($actorName)
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Updated By:</td>
                                    <td style="padding: 8px 0; color: #333; font-size: 14px;">{{ $actorName }}</td>
                                </tr>
                                @endif
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Status Timeline -->
                    <tr>
                        <td style="padding: 20px 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                                📜 Status Journey
                            </h2>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                @foreach($statusHistory as $index => $history)
                                <tr>
                                    <td style="padding: 0; vertical-align: top; width: 30px;">
                                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: {{ $index === 0 ? '#004A98' : '#ccc' }}; margin: 4px auto;"></div>
                                        @if($index < count($statusHistory) - 1)
                                        <div style="width: 2px; height: 30px; background-color: #ddd; margin: 0 auto;"></div>
                                        @endif
                                    </td>
                                    <td style="padding: 0 0 15px 15px; vertical-align: top;">
                                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: {{ $index === 0 ? '#004A98' : '#333' }};">
                                            {{ $history['status_label'] ?? ucfirst(str_replace('_', ' ', $history['status'])) }}
                                        </p>
                                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #555;">
                                            <strong>By:</strong> {{ $history['actor'] ?? 'System' }}
                                        </p>
                                        <p style="margin: 2px 0 0 0; font-size: 11px; color: #888;">
                                            📅 {{ $history['date'] ?? 'N/A' }} &nbsp;•&nbsp; 🕐 {{ $history['time'] ?? 'N/A' }}
                                        </p>
                                        @if(isset($history['description']) && $history['description'])
                                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666; font-style: italic;">
                                            {{ $history['description'] }}
                                        </p>
                                        @endif
                                    </td>
                                </tr>
                                @endforeach
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d; line-height: 1.6;">
                                This is an automated summary notification from the<br>
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
