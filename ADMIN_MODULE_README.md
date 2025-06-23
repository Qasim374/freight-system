# Admin Module - Freight Management System

## Overview

The Admin Module provides comprehensive freight management capabilities for system administrators, including quote management, amendment review, BL approvals, invoice management, and analytics.

## Features Implemented

### A. ADMIN DASHBOARD

- **Quote Requests Dashboard**: View and manage all vendor quotes per request
- **Shipments**: Track shipment status and progress
- **Amendments**: Review and approve cost changes and delays
- **BL Approvals**: Manage bill of lading workflow
- **Invoices**: Handle client and vendor invoicing
- **Stats**: Real-time metrics for New Requests, Amendment Count, Outstanding Invoices

### B. QUOTE MANAGEMENT

- **Vendor Quote Review**: View all vendor quotes per request with detailed comparison
- **Auto-Selection Override**: Override automatic quote selection with manual approval
- **Markup Adjustment**: Adjust markup percentage (default 14%) for client pricing
- **Quote Comparison**: Side-by-side comparison of vendor quotes with cost analysis
- **Approval Workflow**: Streamlined approval process with markup calculation

### C. AMENDMENT REVIEW

- **Cost Analysis**: Review vendor-added costs with detailed breakdown
- **Admin Actions**:
  - **Approve & Push to Client**: Add markup and forward to client for approval
  - **Waive Cost**: Approve amendment without additional cost to client
  - **Negotiate with Vendor**: Push back to vendor for renegotiation
- **Status Tracking**: Complete workflow from request to final resolution
- **Detailed View**: Full amendment details with shipment context

### D. BL APPROVAL

- **Draft BL Management**: Review and approve draft bills of lading
- **Final BL Workflow**: Manage final BL issuance after client approval
- **File Management**: Download and review BL documents
- **Approval Status**: Track approval status for both draft and final BLs
- **Version Control**: Separate management for draft and final versions

### E. INVOICE ENGINE

- **Auto-Generation**: System generates client and vendor invoices automatically
- **Payment Tracking**: Upload and verify payment proofs
- **Margin Reporting**: Real-time margin calculation and reporting
- **Status Management**: Track paid, unpaid, and awaiting verification invoices
- **Financial Summary**: Total revenue, payments, and net margin calculations

### F. SHIPMENT LOG & HISTORY

- **Amendment Trail**: Complete history of amendments and changes
- **Quote History**: Track all quotes submitted for each shipment
- **Status Tracking**: Monitor shipment progress through all stages
- **Document Management**: Access to all related documents and files

## Technical Implementation

### Database Schema

- Enhanced schema with proper relationships between shipments, quotes, amendments, and invoices
- Support for markup calculations and payment tracking
- Audit trail for all admin actions

### API Endpoints

- `/api/admin/dashboard-stats` - Dashboard statistics
- `/api/admin/quotes` - Quote management with markup support
- `/api/admin/amendments` - Amendment review workflow
- `/api/admin/bl-approvals` - BL approval management
- `/api/admin/invoices` - Invoice management and payment tracking
- `/api/admin/analytics` - System analytics and reporting

### Frontend Components

- **DashboardStatsClient**: Real-time statistics display
- **QuoteTable**: Comprehensive quote management interface
- **AmendmentTable**: Amendment review with detailed workflow
- **BLApprovalTable**: BL approval management
- **InvoiceTable**: Invoice management with payment tracking
- **AnalyticsDashboard**: Charts and analytics visualization

## Button Logic Implementation

### General Button Logic (All Roles)

| Button            | Logic                           |
| ----------------- | ------------------------------- |
| Login             | Auth & Redirect                 |
| Submit Quote      | Saves quote, locks in timestamp |
| Book Now          | Assigns vendor, starts shipment |
| Upload BL         | Saves file & timestamp          |
| Approve BL        | Locks document for final        |
| Request Amendment | Opens amendment flow            |
| Accept Offer      | Confirms amended charge         |

### Admin-Specific Actions

- **Auto-Select Quote**: Applies default markup and approves quote
- **Override Quote**: Apply custom markup and approve specific quote
- **Push to Client**: Forward amendment to client for review
- **Approve Amendment**: Accept amendment with or without cost
- **Reject Amendment**: Decline amendment and return to vendor
- **Mark Invoice Paid**: Update invoice status and track payment
- **Upload Payment Proof**: Attach payment verification documents

## Security Features

- Role-based access control for admin functions
- Authentication checks on all API endpoints
- Input validation and sanitization
- File upload security for payment proofs and BL documents

## Future Enhancements

- Real-time notifications for admin actions
- Advanced analytics and reporting
- Bulk operations for quote and invoice management
- Integration with external payment systems
- Automated invoice generation based on shipment milestones
- Enhanced audit logging and compliance reporting

## Usage Instructions

### Accessing Admin Module

1. Login with admin credentials
2. Navigate to `/admin/dashboard`
3. Use sidebar navigation to access different modules

### Quote Management

1. Go to "Quote Management" in sidebar
2. Select status filter (quote_requested, quote_received, booked)
3. Review quotes with cost comparison
4. Adjust markup using slider (5-30%)
5. Click "Approve" for auto-selection or "Override" for custom markup

### Amendment Review

1. Go to "Amendment Review" in sidebar
2. Select status filter (admin_review, client_review, accepted, rejected)
3. Review amendment details
4. Choose action: Push to Client, Approve, or Reject
5. Add comments if needed

### BL Approvals

1. Go to "BL Approvals" in sidebar
2. Select version (Draft or Final)
3. Review uploaded documents
4. Download for review if needed
5. Approve or reject with comments

### Invoice Management

1. Go to "Invoice Management" in sidebar
2. Select invoice type (Client or Vendor)
3. Filter by status (All, Paid, Unpaid, Awaiting Verification)
4. View financial summary
5. Mark invoices as paid or upload payment proofs

## Configuration

- Default markup: 14% (configurable via UI)
- File upload limits: 10MB for payment proofs
- Supported file types: PDF, JPG, JPEG, PNG
- Status workflows: Configurable via database schema
