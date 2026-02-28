# Atabat Application: Complete Reservation Logic Map

This document maps the complete, end-to-end reservation flow in the Atabat V2 application. It covers how the UI, backend endpoints, Payload CMS, and Playwright scraper interact to facilitate bookings on the external Atabat portal.

---

## 1. File Inventory

### Data Models & Collections

| File                                   | Role                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `src/collections/Reservation/index.ts` | Payload CMS collection: schema, access policies, admin UI, custom endpoints |
| `src/payload-types.ts` (lines 267–316) | Generated TypeScript `Reservation` interface                                |

### API Endpoints

| File                                  | Exports                                                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/endpoints/reservations/index.ts` | `createReservationHandler` (POST `/api/reservations/create`), `getReservationsHandler` (GET `/api/reservations/list`), `getReceiptHandler` (GET `/api/reservations/receipt/:id`) |
| `src/endpoints/payments/index.ts`     | `initiatePaymentHandler` — gets payment URL from external system                                                                                                                 |

### Frontend Pages

| File                                                     | Purpose                                                 |
| -------------------------------------------------------- | ------------------------------------------------------- |
| `src/app/(frontend)/[locale]/reservations/page.tsx`      | Reservation list with status filters                    |
| `src/app/(frontend)/[locale]/reservations/new/page.tsx`  | Multi-passenger booking form                            |
| `src/app/(frontend)/[locale]/reservations/[id]/page.tsx` | Reservation detail: receipt, itinerary, payment options |
| `src/app/(frontend)/[locale]/reservations/layout.tsx`    | Layout wrapper (Header + Footer)                        |

### UI Components

| File                                              | Purpose                           |
| ------------------------------------------------- | --------------------------------- |
| `src/components/ui/StatusBadge.tsx`               | Visual status badge               |
| `src/components/ui/PaymentOptionsModal/index.tsx` | In-person vs online payment modal |

### Scraper (Playwright)

| File                                    | Purpose                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/scraper/reservation.ts`            | Core booking bot: trip selection, passenger registration, confirmation                       |
| `src/scraper/receipt.ts`                | Scrapes receipt data (itinerary, passengers, payment URLs)                                   |
| `src/scraper/checkReservationExists.ts` | Validates whether an external reservation still exists                                       |
| `src/scraper/status.ts`                 | Scrapes reservation status grid                                                              |
| `src/scraper/trips.ts`                  | Trip search and selection                                                                    |
| `src/scraper/browser.ts`                | Browser context & cookie persistence                                                         |
| `src/scraper/auth.ts`                   | Authentication, captcha solving, OTP verification                                            |
| `src/scraper/adapter.ts`                | `IAtabatAdapter` interface + environment-based config                                        |
| `src/scraper/index.ts`                  | `RealAdapter` + `getAdapter()` factory                                                       |
| `src/scraper/mockAdapter.ts`            | Mock implementation for tests                                                                |
| `src/scraper/types.ts`                  | TypeScript interfaces: `TripData`, `PassengerInfo`, `ReservationResult`, `ReceiptData`, etc. |

### Hooks, Policies & Utilities

| File                                 | Purpose                                                              |
| ------------------------------------ | -------------------------------------------------------------------- |
| `src/hooks/beforeReadReservation.ts` | Auto-cancels expired reservations on read; throttled to every 30 min |
| `src/policies/isReservationOwner.ts` | Access control: pilgrims can only access own reservations            |
| `src/hooks/useAuth.ts`               | React hook for auth state                                            |
| `src/validations/trip.ts`            | Zod schemas: `tripSearchSchema`, `tripSelectionSchema`               |
| `src/utils/AppError.ts`              | Custom error class with typed error codes                            |
| `src/utils/apiResponse.ts`           | `successResponse()` / `errorResponse()` helpers                      |

### Background Jobs & Tests

| File                                 | Purpose                                                 |
| ------------------------------------ | ------------------------------------------------------- |
| `src/jobs/otpRefreshTask.ts`         | Cron at 00:00 daily — refreshes OTP from Bale messenger |
| `tests/int/reservations.int.spec.ts` | Integration tests (uses MockAdapter)                    |

---

## 2. Data Model

### Reservation (Payload CMS collection: `reservations`)

```typescript
interface Reservation {
  id: number;
  pilgrim: number | Pilgrim; // Relationship to Pilgrims collection
  externalResId?: string | null; // GUID from Atabat external system
  tripSnapshot: JSON; // Frozen snapshot of trip at booking time
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  paymentUrl?: string | null;
  receiptData?: JSON | null; // Itinerary, passengers, agent info
  costBreakdown?: JSON | null;
  itinerary?: JSON | null;
  bookedAt?: string | null; // ISO date (default: now)
  paidAt?: string | null;
  lastValidatedAt?: string | null; // Last external-system check
}
```

### TripData (stored in `tripSnapshot`)

```typescript
interface TripData {
  rowIndex: string; // Ephemeral — session-specific row index
  tripIdentifier: string; // Stable: "${departureDate}|${groupCode}|${agentName}"
  dayOfWeek: string;
  departureDate: string; // Jalali date YYYY/MM/DD
  remainingCapacity: number;
  minCapacity: number; // Atabat's maxRequestCount
  tripType: string; // e.g. "هوایی 7 شب"
  cost: number;
  departureLocation: string;
  city: string;
  provinceCode?: string;
  agentName: string;
  groupCode: string;
  executorName: string;
  najafHotel: string;
  karbalaHotel: string;
  kazemainHotel: string;
  address: string;
  selectButtonScript?: string; // Ephemeral — ASP.NET postback script
}
```

### ReceiptData

```typescript
interface ReceiptData {
  resId?: string;
  expireDate?: string; // Payment deadline
  city?: string;
  tripType?: string;
  departureDate?: string;
  agentName?: string;
  agentPhone?: string;
  agentAddress?: string;
  executorName?: string;
  itinerary: ItineraryItem[];
  passengers: PassengerReceiptItem[];
  paymentUrl?: string;
}
```

---

## 3. Status State Machine

```
           ┌──────────┐
User books │ pending  │ ◄── Initial state after external reservation created
           └────┬─────┘
                │ (manual / external webhook — not automated)
                ▼
           ┌──────────┐
           │confirmed │
           └────┬─────┘
                │ (payment received)
                ▼
           ┌──────────┐
           │   paid   │
           └──────────┘

From any state:
  - External system no longer has reservation → auto-cancel (beforeRead hook)
  - Admin action → cancel
  - User-initiated cancel → NOT IMPLEMENTED
```

**Rules:**

- `pending/confirmed/paid → cancelled`: via `beforeReadReservation` hook or admin
- Duplicate registration is detected by the Atabat external system, which returns "زائري با کد ملي xxx قبلا ثبت شده است" when a national ID is already registered; mapped to `RESERVATION_PASSENGER_DUPLICATE`

---

## 4. Reservation Creation — Full Data Flow

```
USER fills form at /reservations/new
  └─ tripSnapshot from sessionStorage['selectedTrip']
  └─ passenger slots = trip.minCapacity (first pre-filled from user profile)
  └─ POST /api/reservations/create {tripSnapshot, passengers[]}

createReservationHandler
  ├─ Auth check: must be pilgrims collection
  ├─ Validate body: tripSelectionSchema (Zod)
  ├─ Ensure tripSnapshot.selectButtonScript exists
  └─ adapter.createReservation(tripSnapshot, passengers)
      └─ Atabat returns "قبلا ثبت شده است" if already registered → 400 RESERVATION_PASSENGER_DUPLICATE

createReservationWithTrip (scraper)
  ├─ Re-search trips (fresh session-bound results)
  ├─ Locate trip by tripIdentifier
  ├─ Execute selectButtonScript (ASP.NET postback → booking page)
  ├─ Read maxRequestCount from page JS
  └─ addPassengersAndConfirm(page, passengers, maxRequestCount)

addPassengersAndConfirm
  └─ FOR EACH passenger:
      ├─ addSinglePassenger(page, passenger, index)
      │   ├─ Fill nationalId, birthdate, phone
      │   ├─ Click "ثبت" (Save)
      │   ├─ Promise.race: AJAX validation | DOM table growth | error msg
      │   └─ Parse dialog/inline errors → abort if any
      └─ Verify total rows >= minCapacity
  └─ confirmReservation(page)

confirmReservation
  ├─ Click "تائید و چاپ فیش"
  ├─ Await navigation
  ├─ URL = Receipt.aspx?resID=... → SUCCESS, extract externalResId
  └─ Same page + error message → FAILURE

Back in createReservationHandler (success path)
  ├─ adapter.getReceipt(externalResId)  ← scrape receipt page
  └─ payload.create('reservations', {
        pilgrim: req.user.id,
        externalResId,
        status: 'pending',
        tripSnapshot,
        receiptData,
        paymentUrl,
        bookedAt: now
      })
  └─ Return {success: true, data: {reservation}} → frontend redirects to /reservations/[id]
```

---

## 5. Reading Reservations — Data Flow

### List (`GET /api/reservations/list`)

```
getReservationsHandler
  └─ payload.find('reservations', {where: {pilgrim: req.user.id}})
      └─ beforeRead hook fires for each pending reservation:
          ├─ Skip if lastValidatedAt < 30 min ago
          ├─ checkReservationExists(externalResId)
          │   └─ Navigate to Reservation_cs.aspx?resid=...
          │   └─ Check passenger table exists
          └─ If not found → update status to 'cancelled', update lastValidatedAt
```

### Detail (`GET /api/reservations/[id]`)

```
Payload findByID (default endpoint)
  └─ beforeRead hook (same as above)
  └─ isReservationOwner access policy enforced
```

---

## 6. Payment Flow

### Online

```
User opens PaymentOptionsModal → clicks online payment
  └─ Opens external portal in new tab
      https://atabatorg.haj.ir/PassengerPayPublic.aspx
      (Passenger enters their own ID + national ID)
  └─ Payment callback/status update: NOT IMPLEMENTED
```

### In-Person

```
PaymentOptionsModal shows:
  - Office name, phone, address (from receiptData)
  - Payment deadline (expireDate)
User visits office → pays → agent manually updates status to 'paid'
```

---

## 7. Key Function Signatures

```typescript
// Scraper
createReservationWithTrip(tripData: TripData, passengers: PassengerInfo[]): Promise<ReservationResult>
addPassengersAndConfirm(page: Page, passengers: PassengerInfo[], requiredCount: number): Promise<ReservationResult>
addSinglePassenger(page: Page, passenger: PassengerInfo, index: number): Promise<AddPassengerResult>
confirmReservation(page: Page): Promise<ReservationResult>
scrapeReceipt(resId: string): Promise<ReceiptData>
checkReservationExists(resId: string): Promise<boolean>
searchTrips(params: TripSearchParams): Promise<TripData[]>

// Adapter interface
interface IAtabatAdapter {
  searchTrips(params: TripSearchParams): Promise<TripData[]>;
  createReservation(tripData: TripData, passengers: PassengerInfo[]): Promise<ReservationResult>;
  getReceipt(resId: string): Promise<ReceiptData>;
  getPaymentUrl(resId: string): Promise<string | null>;
  isAuthenticated(): Promise<boolean>;
  authenticate(): Promise<boolean>;
}
```

---

## 8. Business Rules & Validations

| Rule                   | Location                              | Detail                                                                                                                                                                                                                     |
| ---------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate registration | `src/endpoints/reservations/index.ts` | Atabat blocks globally (not trip-scoped) if national ID already has any active reservation; national ID extracted from "قبلا ثبت شده است" message and returned as `details.nationalId` → `RESERVATION_PASSENGER_DUPLICATE` |
| Minimum passengers     | `src/scraper/reservation.ts:173-184`  | `passengers.length >= maxRequestCount`                                                                                                                                                                                     |
| Invalid passenger data | `src/scraper/reservation.ts`          | AJAX validation on Atabat side → `RESERVATION_PASSENGER_INVALID`                                                                                                                                                           |
| Auto-cancel on read    | `src/hooks/beforeReadReservation.ts`  | `pending` reservations checked externally, cancelled if gone                                                                                                                                                               |
| Validation throttle    | `src/hooks/beforeReadReservation.ts`  | External check max once per 30 min per reservation                                                                                                                                                                         |

---

## 9. Access Control

```typescript
// Collection-level (src/collections/Reservation/index.ts)
access: {
  read:   isAdmin || isReservationOwner,
  create: () => false,    // Only via custom endpoint
  update: () => false,    // Only via hooks or admin panel
  delete: isAdmin,
}

// Endpoint-level
// All reservation endpoints require: req.user && req.user.collection === 'pilgrims'

// Receipt endpoint additionally verifies:
// String(reservation.pilgrim.id) === String(req.user.id)
```

---

## 10. Error Codes

| Code                              | HTTP | Trigger                                     |
| --------------------------------- | ---- | ------------------------------------------- |
| `RESERVATION_NOT_FOUND`           | 404  | No reservation found for given ID           |
| `RESERVATION_CREATE_FAILED`       | 400  | Scraper failed to create reservation        |
| `RESERVATION_CANCEL_FAILED`       | 400  | Cancellation operation failed               |
| `RESERVATION_ALREADY_EXISTS`      | 400  | Duplicate reservation attempt               |
| `RESERVATION_PASSENGER_DUPLICATE` | 400  | Passenger already registered (Atabat error) |
| `RESERVATION_PASSENGER_INVALID`   | 400  | Invalid passenger data (Atabat validation)  |

---

## 11. Edge Cases & Special Logic

### Trip Re-Search Before Selection

ASP.NET `selectButtonScript` is session-bound and expires. The scraper always re-searches using `tripSnapshot` parameters to obtain a fresh script before executing it. (`src/scraper/reservation.ts:128-170`)

### Ephemeral vs Stable Identifiers

- `rowIndex` — changes each search; used only during a single session
- `tripIdentifier` — composite key `${departureDate}|${groupCode}|${agentName}`; stable across sessions; used to re-locate the trip after re-search

### AJAX Race Condition Handling

After clicking "Save" for a passenger, the scraper uses `Promise.race()` waiting for whichever fires first: AJAX response, DOM passenger-table row count increase, or an error message. (`src/scraper/reservation.ts:334-364`)

### Dialog Alert Interception

Atabat shows native `alert()` dialogs on errors. The scraper registers a dialog handler to auto-accept and capture the message before it blocks execution. (`src/scraper/reservation.ts:287-294`)

### Form Auto-Hide

Atabat hides the passenger input form once `maxRequestCount` passengers are added. The scraper checks form visibility before each attempt. (`src/scraper/reservation.ts:214-226`)

### Cookie Persistence

Browser cookies are saved to both `data/cookies.json` (file) and the `kargozar-config` Payload global (database). Database takes priority on load; file is the fallback.

### OTP Lifecycle

OTP expires at midnight daily. `otpRefreshTask` (cron `0 0 * * *`) fetches a fresh OTP from Bale messenger automatically.

### First Passenger Auto-Fill

The new-reservation page pre-populates the first passenger slot with the logged-in user's profile data (`nationalId`, `birthdate`, `phone`). (`src/app/(frontend)/[locale]/reservations/new/page.tsx:80-93`)

---

## 12. State Management (Frontend)

- **No global store** (no Redux/Zustand) — components use `React.useState` + `fetch`
- **Trip handoff**: search page writes selected trip to `sessionStorage['selectedTrip']`; `/reservations/new` reads it on mount
- **Auth state**: managed by `useAuth` hook (`src/hooks/useAuth.ts`)
- **API response format**:
  ```typescript
  { success: boolean, data?: any, code?: string, message?: string }
  ```
  Frontend maps `code` → i18n key via `tApiErrors(result.code)`.

---

## 13. Testing

**File:** `tests/int/reservations.int.spec.ts`

Coverage:

- Unauthenticated request rejection
- Request body validation
- Successful reservation creation
- Receipt retrieval
- Ownership verification

Tests use `MockAdapter` (`USE_MOCK_SCRAPER=true`) — no browser/network required.

---

## 14. Known Limitations

| #   | Issue                                                                                           |
| --- | ----------------------------------------------------------------------------------------------- |
| 1   | Status transitions `pending→confirmed→paid` require manual intervention; no webhook integration |
| 2   | No payment gateway callback — payment portal is external                                        |
| 3   | User-initiated cancellation not implemented                                                     |
| 4   | No retry mechanism if scraper fails mid-flow                                                    |
| 5   | Scraper runs synchronously inside the HTTP request (can timeout on slow connections)            |
| 6   | OTP refresh task has no integration tests                                                       |
| 7   | No real-time progress feedback (no WebSocket / SSE)                                             |
