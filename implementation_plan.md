# Fish Procurement + Unified Business Partner

This plan implements the unified counterparty concept, allowing a single entity to act as both a Customer (buying ice) and a Supplier (selling fish), and provides a mechanism to offset (net) their Payables and Receivables.

## User Review Required

> [!WARNING]
> **Data Migration**: We will merge the existing `Customer` and `Supplier` models in Prisma into a single unified `Partner` (Mitra) model. This means we will rename `Customer` to `Partner` and migrate `Supplier` fields into it. This will change the database schema.
> **Netting Concept**: To offset Payables (Purchase) against Receivables (Sales), we will introduce a `NettingTransaction` or similar offset logic that safely records the settlement without altering the original gross amounts.

## Open Questions

> [!IMPORTANT]
> 1. Should we completely remove the `Supplier` table and migrate existing Suppliers into the new `Partner` table? (Recommended: Yes, to avoid duplicate records).
> 2. For the Fish Procurement form, should it directly create a `PurchaseOrder` + `GoodsReceipt` in one atomic step (since the fish is received immediately), or should it just be a `PurchaseOrder` that requires a separate receiving step? (Based on the prompt, it sounds like an atomic "Pembelian Ikan" form that receives inventory directly).

## Proposed Changes

### 1. Unified Partner Model (Database)

We will modify `backend/prisma/schema.prisma` to:
- Rename `model Customer` to `model Partner` (mapped to `partners`).
- Add a `roles` field (e.g., `String[]` containing `CUSTOMER`, `SUPPLIER`).
- Update all references in `SalesOrder`, `PurchaseOrder`, `Invoice`, `GoodsReceipt`, `Payment` to point to `Partner`. (e.g., `SalesOrder.customer_id` becomes `SalesOrder.partner_id`).
- Remove the separate `Supplier` model.

### 2. Accounts Payable & Receivable

- We will utilize the existing `PurchaseOrder` and `Invoice` (or create a `VendorBill` concept) to track Payables.
- We will utilize the existing `SalesOrder` and `Invoice` to track Receivables.
- A new `PartnerBalance` concept (calculated on the fly or via a view/table) will track the Net Balance.

### 3. Fish Procurement (Pembelian Ikan)

- **Backend**: Create a `FishProcurementController` that takes a request, atomically creates a `PurchaseOrder` (Status: COMPLETED), creates a `GoodsReceipt`, triggers `InventoryService.receiveStock` (which creates `StockMovement`), and creates an Accounts Payable record (if credit) or a `Payment` (if cash).
- **Frontend**: Create `/inventory/purchase/fish-procurement` (Pembelian Ikan) with a streamlined form: Date, Mitra, Warehouse, Items (Fish, Qty, Price), Payment Terms (Cash/Credit), Paid Amount.

### 4. Settlement / Netting (Kompensasi)

- Create a `PartnerNettingService` to offset Payables and Receivables.
- It will create a `PaymentAllocation` or `Settlement` record linking a Sales Invoice and a Purchase Invoice, marking them as paid by each other.

### 5. Mitra 360 Dashboard

- Extend the existing `/crm/customers/[id]` to `/crm/partners/[id]`.
- Add a "Saldo Mitra" card showing: Hutang Perusahaan, Piutang ke Mitra, Net Balance.
- Add tabs for Pembelian, Penjualan, Pembayaran, Kompensasi.
- Show a unified timeline of all transactions.

## Verification Plan

### Automated Tests
- Run Prisma migrations and generate new client.
- Compile backend to ensure no broken references to `Customer` or `Supplier`.

### Manual Verification
- Create a Partner (Mitra) with both roles.
- Buy 10 KG of Mahi Mahi (creates Payable).
- Sell Rp 200,000 of Ice to the same Partner (creates Receivable).
- Check the "Saldo Mitra" net balance.
- Perform an Offset/Netting action and verify the gross transactions remain unchanged.
