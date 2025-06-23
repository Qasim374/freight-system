# 🚢 Freight System Testing Guide

## 📋 Prerequisites

- MySQL database running
- Node.js and npm installed
- All dependencies installed (`npm install`)

## 🗄️ Step 1: Setup Database

### 1.1 Clear Database and Create Test Data

```bash
# Run the setup script to clear database and create test users
node scripts/setup-test-data.js
```

### 1.2 Expected Output

```
✅ Connected to database
🗑️  Clearing existing data...
✅ Database cleared
👥 Creating test users...
✅ Test users created
📋 Test Data Summary:
   Client ID: 1 (client@test.com / client123)
   Vendor ID: 2 (vendor@test.com / vendor123)
   Admin ID: 3 (admin@test.com / admin123)
🚀 Database is ready for testing!
```

### 1.3 Start Application

```bash
npm run dev
```

## 🔄 Complete Workflow Testing

### **PHASE 1: CLIENT WORKFLOW** 👤

#### Step 1: Client Login

1. Go to `http://localhost:3000/login`
2. Login with: `client@test.com` / `client123`
3. Should redirect to client dashboard

#### Step 2: Request Quote

1. Click "Request Quote" button
2. Fill in the form:
   - **Mode**: FOB
   - **Container Type**: 40ft
   - **Number of Containers**: 2
   - **Commodity**: Electronics
   - **Weight per Container**: 15.5 tons
   - **Preferred Shipment Date**: Tomorrow's date
3. Click "Request Quote"
4. **Expected**: Redirected to quote result page with 48-hour timer

#### Step 3: Check Quote Status

1. On quote result page, you should see:
   - 48-hour countdown timer
   - "0 of 0 vendor quotes received"
   - "Book Now" button disabled
   - Status: "Quote Requested – Awaiting Vendor Rates"

---

### **PHASE 2: VENDOR WORKFLOW** 🏢

#### Step 4: Vendor Login

1. Open new browser tab/incognito
2. Go to `http://localhost:3000/login`
3. Login with: `vendor@test.com` / `vendor123`
4. Should redirect to vendor dashboard

#### Step 5: Submit Quote

1. On vendor dashboard, you should see:
   - **Open Requests**: 1
   - Recent quote request for Electronics
2. Click "Submit Quote" or go to "Quote Requests"
3. Click "Submit Quote" on the Electronics shipment
4. Fill in quote form:
   - **Cost**: 2500 USD
   - **Sailing Date**: Next week's date
   - **Carrier Name**: Maersk Line
5. Click "Submit Quote"
6. **Expected**: Quote status changes to "Submitted"

#### Step 6: Check Vendor Dashboard

1. Refresh vendor dashboard
2. **Expected**:
   - **Submitted Quotes**: 1
   - **Open Requests**: 0

---

### **PHASE 3: ADMIN WORKFLOW** 👨‍💼

#### Step 7: Admin Login

1. Open new browser tab/incognito
2. Go to `http://localhost:3000/login`
3. Login with: `admin@test.com` / `admin123`
4. Should redirect to admin dashboard

#### Step 8: Review Quote

1. On admin dashboard, you should see:
   - **New Quote Requests**: 1
2. Go to "Quote Management"
3. **Expected**: See the Electronics shipment with 1 vendor quote
4. Check quote details:
   - Vendor: Test Vendor Ltd
   - Cost: $2,500
   - Client Price: $2,850 (with 14% markup)
   - Margin: $350

#### Step 9: Approve Quote

1. Click "Auto-Select" or "Override" on the quote
2. **Expected**: Quote status changes to "booked"
3. Check admin dashboard stats update

---

### **PHASE 4: CLIENT BOOKING** 👤

#### Step 10: Client Book Shipment

1. Go back to client browser tab
2. Refresh quote result page
3. **Expected**:
   - "Book Now" button is now enabled
   - Shows final price with markup
   - Market comparison message
4. Click "Book Now"
5. **Expected**: Redirected to shipment details page

#### Step 11: Check Client Dashboard

1. Go to client dashboard
2. **Expected**:
   - **Active Shipments**: 1
   - Shipment status: "Booked"
3. Go to "Active Shipments"
4. **Expected**: See the Electronics shipment

---

### **PHASE 5: BL WORKFLOW** 📄

#### Step 12: Vendor Upload Draft BL

1. Go back to vendor browser tab
2. Go to "BL Management"
3. **Expected**: See the won Electronics shipment
4. Click "Upload Draft BL"
5. Upload any PDF file (or create a test PDF)
6. **Expected**: BL status updates

#### Step 13: Client Review Draft BL

1. Go back to client browser tab
2. Go to "Active Shipments"
3. Click "Manage BL Workflow" on the Electronics shipment
4. **Expected**:
   - See "View Draft BL" button
   - See "Approve BL" and "Request Amendment" buttons
5. Click "View Draft BL" to see the uploaded file
6. Click "Approve BL"
7. **Expected**: BL status changes to "Final BL"

#### Step 14: Vendor Upload Final BL

1. Go back to vendor browser tab
2. Go to "BL Management"
3. **Expected**: Can now upload Final BL
4. Upload Final BL
5. **Expected**: BL workflow complete

---

### **PHASE 6: AMENDMENT WORKFLOW** ⚠️

#### Step 15: Client Request Amendment

1. Go back to client browser tab
2. Go to "Active Shipments" → "Manage BL Workflow"
3. Click "Request Amendment"
4. Fill in amendment form:
   - **Reason**: "Documentation Error"
   - **Custom Reason**: "Container details need correction"
5. Click "Submit Request"
6. **Expected**: Amendment status: "Requested"

#### Step 16: Admin Review Amendment

1. Go back to admin browser tab
2. Go to "Amendment Review"
3. **Expected**: See the amendment request
4. Click "Push to Client" or "Approve"
5. **Expected**: Amendment moves to next status

#### Step 17: Vendor Respond to Amendment

1. Go back to vendor browser tab
2. Go to "Amendments"
3. **Expected**: See the amendment request
4. Click "Respond"
5. Choose "Approve with Changes":
   - **Extra Cost**: 150 USD
   - **Delay Days**: 2
   - **Reason**: "Additional documentation required"
6. Click "Approve with Changes"
7. **Expected**: Amendment status updates

#### Step 18: Admin Review Vendor Response

1. Go back to admin browser tab
2. Go to "Amendment Review"
3. **Expected**: See vendor's response with extra cost
4. Click "Push to Client"
5. **Expected**: Amendment moves to client review

#### Step 19: Client Review Amendment

1. Go back to client browser tab
2. Check for amendment notifications
3. **Expected**: See amendment with vendor-added cost
4. Click "Accept & Proceed" or "Cancel Request"
5. **Expected**: Amendment workflow complete

---

### **PHASE 7: SHIPMENT TRACKING** 🚢

#### Step 20: Update Shipment Status

1. Go back to admin browser tab
2. Go to "Shipments" or "BL Approvals"
3. Update shipment status to "In Transit"
4. **Expected**: Status updates in system

#### Step 21: Check Tracking

1. Go back to client browser tab
2. Go to "Active Shipments"
3. Click "Track Shipment"
4. **Expected**: See updated timeline with "In Transit" status

---

### **PHASE 8: INVOICE & PAYMENT** 💰

#### Step 22: Generate Invoices

1. Go back to admin browser tab
2. Go to "Invoice Management"
3. **Expected**: System should auto-generate invoices
4. Check both client and vendor invoices

#### Step 23: Client Payment

1. Go back to client browser tab
2. Go to "Invoices"
3. **Expected**: See generated invoice
4. Click "Pay Now" or "Upload Payment Proof"
5. Upload payment proof
6. **Expected**: Invoice status: "Awaiting Verification"

#### Step 24: Admin Verify Payment

1. Go back to admin browser tab
2. Go to "Invoice Management"
3. **Expected**: See payment proof
4. Mark invoice as "Paid"
5. **Expected**: Invoice status updates

#### Step 25: Vendor Check Payment

1. Go back to vendor browser tab
2. Go to "Invoices"
3. **Expected**: See invoice with updated status
4. Download invoice
5. **Expected**: Invoice download works

---

### **PHASE 9: SHIPMENT HISTORY** 📊

#### Step 26: Complete Shipment

1. Go back to admin browser tab
2. Update shipment status to "Delivered"
3. **Expected**: Shipment moves to history

#### Step 27: Check History

1. Go back to client browser tab
2. Go to "Shipment History"
3. **Expected**: See complete audit trail
4. Expand shipment details
5. **Expected**: See all actions logged with timestamps

---

## ✅ Verification Checklist

### Client Workflow ✅

- [ ] Login works
- [ ] Quote request form works
- [ ] 48-hour timer displays
- [ ] Quote result shows after vendor submission
- [ ] Booking works
- [ ] BL workflow accessible
- [ ] Amendment request works
- [ ] Tracking shows updates
- [ ] Invoices display
- [ ] Payment upload works
- [ ] History shows audit trail

### Vendor Workflow ✅

- [ ] Login works
- [ ] Dashboard shows stats
- [ ] Quote submission works
- [ ] BL upload works
- [ ] Amendment response works
- [ ] Invoices display
- [ ] Won shipments show

### Admin Workflow ✅

- [ ] Login works
- [ ] Dashboard shows stats
- [ ] Quote management works
- [ ] Amendment review works
- [ ] BL approval works
- [ ] Invoice management works
- [ ] Payment verification works

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection**: Check MySQL is running
2. **Authentication**: Verify user roles in database
3. **File Uploads**: Check file size limits
4. **Status Updates**: Refresh pages after actions
5. **Cross-tab Testing**: Use incognito windows

### Database Queries for Debugging:

```sql
-- Check users
SELECT * FROM users;

-- Check shipments
SELECT * FROM shipments;

-- Check quotes
SELECT * FROM quotes;

-- Check amendments
SELECT * FROM amendments;

-- Check audit logs
SELECT * FROM audit_logs ORDER BY timestamp DESC;
```

## 🎯 Success Criteria

If you can complete all phases above, your freight system is working correctly! The system should:

✅ Handle complete end-to-end workflow  
✅ Maintain data integrity across all tables  
✅ Provide proper role-based access  
✅ Generate audit trails for all actions  
✅ Handle file uploads and downloads  
✅ Manage status transitions correctly  
✅ Calculate markups and pricing  
✅ Support amendment workflows  
✅ Track shipment progress  
✅ Manage invoices and payments

**Congratulations! Your freight system is fully functional! 🎉**
