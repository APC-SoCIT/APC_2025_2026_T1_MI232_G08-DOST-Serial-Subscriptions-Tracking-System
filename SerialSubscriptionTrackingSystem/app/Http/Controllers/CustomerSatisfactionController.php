<?php

namespace App\Http\Controllers;

use App\Models\CustomerSatisfaction;
use App\Models\SupplierAccount;
use App\Models\User;
use App\Models\UserNotification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerSatisfactionController extends Controller
{
    public function page()
    {
        return Inertia::render('CustomerSatisfaction');
    }

    public function adminPage()
    {
        return Inertia::render('Admin_CustomerSatisfaction');
    }

    public function tpuReportPage()
    {
        return Inertia::render('TPU_CustomerSatisfactionReport');
    }

    /**
     * Active supplier accounts eligible for performance feedback — this is
     * the SAME TPU-curated "Active Suppliers" list used by Add Serial /
     * Subscription Tracking (SupplierAccount::activeSupplier(), driven by
     * is_active_supplier), not an independently-derived eligibility check.
     * A supplier only shows up here once TPU has added it under Active
     * Suppliers, and disappears once TPU removes it — same as everywhere
     * else in the app.
     */
    private function eligibleSupplierAccounts()
    {
        $activeAccounts = SupplierAccount::activeSupplier()->orderBy('company_name')->get();

        $usersById = User::all()->keyBy(fn ($u) => (string) $u->_id);
        $usersByEmail = User::all()->keyBy(fn ($u) => strtolower($u->email ?? ''));

        return $activeAccounts->filter(function ($account) use ($usersById, $usersByEmail) {
            $userId = (string) ($account->user_id ?? '');
            $email = strtolower($account->email ?? '');

            $matchedUser = null;
            if ($userId && $usersById->has($userId)) {
                $matchedUser = $usersById->get($userId);
            } elseif ($email && $usersByEmail->has($email)) {
                $matchedUser = $usersByEmail->get($email);
            }

            if (!$matchedUser) {
                return false;
            }

            return !($matchedUser->is_disabled ?? false);
        })->map(function ($account) {
            $id = (string) ($account->_id ?? $account->id);
            $name = $account->company_name ?? '';
            $contact = $account->contact_person ?? '';
            return [
                'id' => $id,
                'name' => $name,
                'contact_person' => $contact,
                'label' => $contact ? "{$name} - {$contact}" : $name,
            ];
        })->filter(fn ($s) => $s['id'] && $s['name'])->values();
    }

    /**
     * Active suppliers for the feedback form's dropdown — TPU only.
     */
    public function suppliers()
    {
        return response()->json([
            'success' => true,
            'suppliers' => $this->eligibleSupplierAccounts(),
        ]);
    }

    /**
     * Submit performance feedback. TPU only (enforced by route middleware).
     * No eligibility window and no submission cap — TPU can submit
     * feedback for an active supplier at any time, as many times as needed.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => ['required', 'string'],
            'delivered_on_schedule' => ['required', 'integer', 'between:1,5'],
            'completeness_of_delivery' => ['required', 'integer', 'between:1,5'],
            'compliance_technical_specs' => ['required', 'integer', 'between:1,5'],
            'quality_of_goods' => ['required', 'integer', 'between:1,5'],
            'packaging_handling_condition' => ['required', 'integer', 'between:1,5'],
            'responsiveness' => ['required', 'integer', 'between:1,5'],
            'after_sales_support' => ['required', 'integer', 'between:1,5'],
            'compliance_contract_terms' => ['required', 'integer', 'between:1,5'],
            'user_name' => ['nullable', 'string', 'max:120'],
            'comments' => ['nullable', 'string', 'max:2000'],
        ]);

        $user = Auth::user();

        $supplier = $this->eligibleSupplierAccounts()->firstWhere('id', $validated['supplier_id']);
        if (!$supplier) {
            return response()->json([
                'success' => false,
                'message' => 'Selected supplier is not an active supplier account.',
            ], 422);
        }

        $summaryRating = $this->summaryRating($validated);

        $feedback = CustomerSatisfaction::create([
            'user_id' => (string) ($user->_id ?? $user->id),
            'user_name' => $validated['user_name'] ?? null,
            'user_email' => $user->email,
            'role' => 'tpu',
            'supplier_id' => $supplier['id'],
            'supplier_name' => $supplier['name'],
            'delivered_on_schedule' => $validated['delivered_on_schedule'],
            'completeness_of_delivery' => $validated['completeness_of_delivery'],
            'compliance_technical_specs' => $validated['compliance_technical_specs'],
            'quality_of_goods' => $validated['quality_of_goods'],
            'packaging_handling_condition' => $validated['packaging_handling_condition'],
            'responsiveness' => $validated['responsiveness'],
            'after_sales_support' => $validated['after_sales_support'],
            'compliance_contract_terms' => $validated['compliance_contract_terms'],
            'summary_rating' => $summaryRating,
            'comments' => $validated['comments'] ?? null,
            'submitted_at' => now(),
        ]);

        UserNotification::createStatusNotification(
            'admin',
            'New performance feedback submitted',
            "TPU submitted performance feedback for supplier '{$feedback->supplier_name}'.",
            [
                'feedback_id' => (string) ($feedback->_id ?? $feedback->id),
                'supplier_id' => $feedback->supplier_id,
                'supplier_name' => $feedback->supplier_name,
                'action_url' => '/admin/customer-satisfaction',
            ],
            'tpu'
        );

        return response()->json([
            'success' => true,
            'message' => 'Thank you. Your feedback was submitted successfully.',
        ]);
    }

    /**
     * Shared filtering for both the Admin responses table and its Excel
     * export, and for the TPU/Admin aggregate report — one implementation
     * so a date range (or any other filter) never behaves differently
     * between what's shown on screen and what gets downloaded.
     */
    private function filteredResponses(Request $request)
    {
        $responses = CustomerSatisfaction::orderBy('submitted_at', 'desc')->get();

        if ($request->filled('supplier_id')) {
            $responses = $responses->where('supplier_id', $request->supplier_id);
        }
        if ($request->filled('rating')) {
            $rating = (int) $request->rating;
            // A whole-star filter represents its one-star interval, so 3
            // includes summary ratings from 3.0 through 3.9, including 3.5.
            $responses = $responses->filter(function ($item) use ($rating) {
                $summary = $this->responseSummaryRating($item);
                return $summary >= $rating && ($rating === 5 ? $summary <= 5 : $summary < $rating + 1);
            });
        }
        if ($request->filled('from') || $request->filled('to')) {
            $from = $request->filled('from') ? now()->parse($request->from)->startOfDay() : null;
            $to = $request->filled('to') ? now()->parse($request->to)->endOfDay() : null;
            $responses = $responses->filter(function ($item) use ($from, $to) {
                $submittedAt = $item->submitted_at ? now()->parse($item->submitted_at) : null;
                return $submittedAt && (!$from || $submittedAt->greaterThanOrEqualTo($from)) && (!$to || $submittedAt->lessThanOrEqualTo($to));
            });
        }
        if ($request->filled('search')) {
            $term = strtolower($request->search);
            $responses = $responses->filter(fn ($item) => str_contains(strtolower((string) $item->supplier_name), $term)
                || str_contains(strtolower((string) $item->user_name), $term)
                || str_contains(strtolower((string) $item->user_email), $term));
        }

        return $responses->values();
    }

    public function adminIndex(Request $request)
    {
        $responses = $this->filteredResponses($request);

        return response()->json(['success' => true, 'responses' => $responses->map(function ($item) {
            $item->summary_rating = $this->responseSummaryRating($item);
            return $item;
        })->values()]);
    }

    /**
     * Excel export of the Admin "All Responses" table — same rows, same
     * filters (search / rating / date range) as whatever is on screen when
     * the admin clicks Download, built from the exact same filteredResponses()
     * query the table itself uses.
     */
    public function exportAdminResponses(Request $request)
    {
        $responses = $this->filteredResponses($request);

        $header = ['Supplier', 'Submitted By', 'Email', 'Delivered On Schedule', 'Completeness Of Delivery', 'Compliance (Technical Specs)', 'Quality Of Goods', 'Packaging & Handling', 'Responsiveness', 'After-Sales Support', 'Compliance (Contract Terms)', 'Summary Rating', 'Comments', 'Submitted At'];

        $data = [
            ['Performance Feedback — All Responses'],
            ['Report Period: ' . $this->formatRange($request)],
            ['Generated: ' . Carbon::now()->format('M d, Y g:i A')],
            [''],
            $header,
        ];

        foreach ($responses as $item) {
            $data[] = [
                $item->supplier_name ?? 'Unknown supplier',
                $item->user_name ?: 'Anonymous',
                $item->user_email ?? 'N/A',
                $item->delivered_on_schedule,
                $item->completeness_of_delivery,
                $item->compliance_technical_specs,
                $item->quality_of_goods,
                $item->packaging_handling_condition,
                $item->responsiveness,
                $item->after_sales_support,
                $item->compliance_contract_terms,
                $this->responseSummaryRating($item) . ' / 5',
                $item->comments ?: '-',
                $item->submitted_at ? Carbon::parse($item->submitted_at)->format('M d, Y g:i A') : 'N/A',
            ];
        }

        return $this->generateXlsxResponse($data, 'Performance_Feedback_Responses');
    }

    /**
     * Overall performance feedback report. Shared by both the TPU report
     * page and the Admin page, so the two stay in sync by construction —
     * they call the exact same endpoint and render the exact same data.
     * Accepts the same optional from/to date range as the Admin table, so
     * "as of" dashboards are easy to filter.
     */
    public function report(Request $request)
    {
        $responses = $this->filteredResponses($request);

        return response()->json(['success' => true] + $this->buildReportPayload($responses));
    }

    /**
     * The numbers behind the report() JSON, pulled into its own method so
     * the Excel export below can build the exact same figures instead of
     * recomputing them a second way.
     */
    private function buildReportPayload($responses): array
    {
        $ratingFields = [
            'delivered_on_schedule',
            'completeness_of_delivery',
            'compliance_technical_specs',
            'quality_of_goods',
            'packaging_handling_condition',
            'responsiveness',
            'after_sales_support',
            'compliance_contract_terms',
        ];
        $averages = collect($ratingFields)->mapWithKeys(fn ($field) => [$field => round((float) $responses->avg($field), 2)])->all();

        $distribution = collect([1, 2, 3, 4, 5])->mapWithKeys(function ($rating) use ($responses) {
            $count = $responses->filter(function ($item) use ($rating) {
                $summary = $this->responseSummaryRating($item);
                return $summary >= $rating && ($rating === 5 ? $summary <= 5 : $summary < $rating + 1);
            })->count();
            return [(string) $rating => $count];
        })->all();

        // Grouped by supplier, capped and sorted for readability as
        // responses grow — this scales to any number of suppliers without
        // the chart becoming unusable.
        $bySupplier = $responses->groupBy('supplier_name')->map->count()->sortDesc()->take(10)->all();

        $supplierRatings = $responses->groupBy('supplier_name')->map(function ($group) {
            return round((float) $group->map(fn ($item) => $this->responseSummaryRating($item))->avg(), 1);
        })->sortDesc()->take(10)->all();

        return [
            'total_responses' => $responses->count(),
            'averages' => $averages,
            'average_summary_rating' => round((float) $responses->map(fn ($item) => $this->responseSummaryRating($item))->avg(), 1),
            'distribution' => $distribution,
            'by_supplier' => $bySupplier,
            'supplier_ratings' => $supplierRatings,
            'comments' => $responses->filter(fn ($item) => filled($item->comments))->map(fn ($item) => [
                'comment' => $item->comments,
                'supplier_name' => $item->supplier_name,
                'submitted_by' => $item->user_name,
                'submitted_at' => $item->submitted_at,
            ])->values(),
        ];
    }

    /**
     * Excel export of the TPU/Admin performance feedback report — same KPI
     * cards, rating distribution, per-supplier breakdown and comments shown
     * on screen, respecting the same optional from/to date range.
     */
    public function exportReport(Request $request)
    {
        $responses = $this->filteredResponses($request);
        $report = $this->buildReportPayload($responses);

        $data = [
            ['Performance Feedback Report'],
            ['Report Period: ' . $this->formatRange($request)],
            ['Generated: ' . Carbon::now()->format('M d, Y g:i A')],
            [''],
            ['=== SUMMARY ==='],
            ['Metric', 'Value'],
            ['Total Responses', $report['total_responses']],
            ['Average Summary Rating', $report['average_summary_rating'] . ' / 5'],
        ];
        foreach ($report['averages'] as $field => $value) {
            $data[] = [$this->ratingFieldLabel($field), $value . ' / 5'];
        }

        $data[] = [''];
        $data[] = ['=== OVERALL RATING DISTRIBUTION ==='];
        $data[] = ['Stars', 'Responses'];
        foreach ($report['distribution'] as $stars => $count) {
            $data[] = [$stars . ' stars', $count];
        }

        $data[] = [''];
        $data[] = ['=== RESPONSES BY SUPPLIER ==='];
        $data[] = ['Supplier', 'Responses'];
        foreach ($report['by_supplier'] as $supplier => $count) {
            $data[] = [$supplier, $count];
        }

        $data[] = [''];
        $data[] = ['=== AVERAGE RATING BY SUPPLIER ==='];
        $data[] = ['Supplier', 'Average Rating'];
        foreach ($report['supplier_ratings'] as $supplier => $rating) {
            $data[] = [$supplier, $rating . ' / 5'];
        }

        $data[] = [''];
        $data[] = ['=== COMMENTS ABOUT THE SUPPLIER ==='];
        $data[] = ['Supplier', 'Submitted By', 'Submitted At', 'Comment'];
        foreach ($report['comments'] as $comment) {
            $data[] = [
                $comment['supplier_name'] ?: 'Unknown supplier',
                $comment['submitted_by'] ?: 'Anonymous',
                $comment['submitted_at'] ? Carbon::parse($comment['submitted_at'])->format('M d, Y g:i A') : 'N/A',
                $comment['comment'],
            ];
        }

        return $this->generateXlsxResponse($data, 'Performance_Feedback_Report');
    }

    private function ratingFieldLabel(string $field): string
    {
        return match ($field) {
            'delivered_on_schedule' => 'Delivered On Schedule',
            'completeness_of_delivery' => 'Completeness Of Delivery',
            'compliance_technical_specs' => 'Compliance (Technical Specs)',
            'quality_of_goods' => 'Quality Of Goods',
            'packaging_handling_condition' => 'Packaging & Handling',
            'responsiveness' => 'Responsiveness',
            'after_sales_support' => 'After-Sales Support',
            'compliance_contract_terms' => 'Compliance (Contract Terms)',
            default => ucfirst(str_replace('_', ' ', $field)),
        };
    }

    private function formatRange(Request $request): string
    {
        $from = $request->filled('from') ? Carbon::parse($request->from)->format('M d, Y') : null;
        $to = $request->filled('to') ? Carbon::parse($request->to)->format('M d, Y') : null;

        if (!$from && !$to) {
            return 'All time';
        }
        if ($from && $to) {
            return "{$from} to {$to}";
        }
        return $from ? "From {$from}" : "Through {$to}";
    }

    /**
     * Same lightweight XLSX streaming used by DashboardExportController —
     * a flat array of rows, each cell written as-is.
     */
    private function generateXlsxResponse(array $data, string $filename): StreamedResponse
    {
        $filename = $filename . '_' . Carbon::now()->format('Y-m-d_His') . '.xlsx';

        return response()->streamDownload(function () use ($data) {
            $spreadsheet = new Spreadsheet();
            $worksheet = $spreadsheet->getActiveSheet();

            foreach ($data as $rowIndex => $row) {
                foreach ($row as $columnIndex => $value) {
                    $cellCoordinate = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex + 1) . ($rowIndex + 1);
                    $worksheet->setCellValue($cellCoordinate, $value);
                }
            }

            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private function summaryRating(array $ratings): float
    {
        $fields = [
            'delivered_on_schedule',
            'completeness_of_delivery',
            'compliance_technical_specs',
            'quality_of_goods',
            'packaging_handling_condition',
            'responsiveness',
            'after_sales_support',
            'compliance_contract_terms',
        ];
        $sum = 0;
        foreach ($fields as $field) {
            $sum += (int) ($ratings[$field] ?? 0);
        }
        return round($sum / count($fields), 1);
    }

    private function responseSummaryRating(CustomerSatisfaction $response): float
    {
        if ($response->summary_rating !== null) {
            return round((float) $response->summary_rating, 1);
        }

        return $this->summaryRating([
            'delivered_on_schedule' => $response->delivered_on_schedule,
            'completeness_of_delivery' => $response->completeness_of_delivery,
            'compliance_technical_specs' => $response->compliance_technical_specs,
            'quality_of_goods' => $response->quality_of_goods,
            'packaging_handling_condition' => $response->packaging_handling_condition,
            'responsiveness' => $response->responsiveness,
            'after_sales_support' => $response->after_sales_support,
            'compliance_contract_terms' => $response->compliance_contract_terms,
        ]);
    }
}