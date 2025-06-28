# EcoTraza - Trazabilidad de Reciclaje

## Overview
A blockchain-powered environmental impact platform that transforms plastic bottle recycling into an engaging, transparent digital experience. Enables secure, authenticated user interactions with real-time recycling data verification.

## Project Architecture

### Technologies
- **Frontend**: React with TypeScript, Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Blockchain**: Ethereum (Sepolia testnet) with ethers.js
- **Storage**: In-memory storage with fallback to PostgreSQL database
- **Authentication**: Custom user authentication system

### Smart Contract Integration
- **Contract Address**: 0x9c74e58eD382e0b76be2D334530C714bc14658CA
- **Network**: Sepolia Testnet
- **ABI**: Updated to support evidenceHash parameter
- **Event Types**: Deposit, Batch, Process, Product

### Key Features
- Multi-stage traceability (Deposit → Batch → Process → Product)
- QR code functionality
- Role-based access control (user/admin)
- Personal statistics tracking
- Blockchain event verification

## Recent Changes

### December 28, 2024 - Simplified Single Validation Process
- ✅ **Eliminated Dual Validation System**: Removed confusing "standard" vs "enhanced" validation options per user feedback
- ✅ **Single Validation Route**: Simplified to `/validation` route with comprehensive form (formerly enhanced-validation)
- ✅ **Updated Dashboard**: Streamlined UI with single "Validar Lote" button instead of multiple options
- ✅ **Consistent Naming**: Changed component name from EnhancedValidation to ValidationForm for clarity
- ✅ **User Experience**: Eliminated complexity - now single process with mandatory fields, RUT validation, and evidence requirements
- ✅ **Route Cleanup**: Removed BatchValidation component and consolidated to single validation workflow

### December 28, 2024 - Critical QR Lifecycle Fix & QueryClient Resolution
- ✅ **Dynamic QR Resolution**: Fixed critical issue where system-generated QRs were not recognized by `/api/qr/resolve`
- ✅ **JSON QR Support**: Enhanced endpoint to parse complex QR formats (JSON with qrId, eventType, system metadata)
- ✅ **QueryClient URL Construction**: Fixed TanStack Query URL building for parameterized endpoints like `/api/qr/{qrId}`
- ✅ **Race Condition Prevention**: Resolved frontend validation issues that caused "QR inválido" errors
- ✅ **End-to-End Traceability**: Restored complete workflow from lote registration → QR generation → QR scanning → validation
- ✅ **Dual QR Format Support**: System handles both simple ID QRs and complex JSON QRs seamlessly
- ✅ **Metadata Preservation**: All QR resolution includes complete batch metadata for validation workflows
- ✅ **Phase Validation**: Confirmed sequential phase validation (Deposit → Batch → Process → Product) working correctly
- ✅ **Blockchain Integration**: Validated complete flow with successful blockchain transaction recording

### December 28, 2024 - Image Compression & Upload Optimization
- ✅ **Automatic Image Compression**: Client-side compression reduces images to 1024x1024 max with 80% quality
- ✅ **Increased Server Limits**: Backend now accepts up to 10MB payloads for image uploads
- ✅ **Smart Size Management**: Original files up to 20MB accepted, automatically compressed to optimal size
- ✅ **Real-time Feedback**: Users see compression results with final file sizes in KB
- ✅ **Error Prevention**: Clear messages for oversized files with automatic fallback to compression
- ✅ **Canvas-based Processing**: Native browser compression maintains aspect ratio and quality

### December 28, 2024 - Scalable QR Resolution System
- ✅ **Centralized QR Validation**: Implemented `/api/qr/resolve` endpoint for server-side QR validation and resolution
- ✅ **Eliminated Hardcoded Logic**: Removed all hardcoded QR patterns from frontend - now fully backend-driven
- ✅ **Scalable Architecture**: New QR codes automatically work without frontend modifications
- ✅ **Comprehensive QR Support**: Handles recycling points, validation QRs, and custom formats seamlessly
- ✅ **Enhanced Error Handling**: Clear error messages and fallback to manual entry for invalid QRs
- ✅ **Real-time Detection**: ZXing Browser integration with automatic backend validation upon QR detection
- ✅ **Future-Proof Design**: System ready for new QR types and permission validations

### December 28, 2024 - Enhanced QR Security & Anti-Fraud System
- ✅ **Automatic Location Verification**: QR scanner now automatically extracts verified location data from recycling point QRs
- ✅ **Locked Location Fields**: Collection form displays location and point ID as non-editable fields with blue security styling
- ✅ **Anti-Fraud Protection**: Users cannot modify location data - only weight, photos, and operator details are editable
- ✅ **Visual Security Indicators**: Locked fields show verification checkmarks and clear "cannot be modified" messages
- ✅ **Database Integration**: Form automatically queries recycling point data from database using pointId parameter
- ✅ **Enhanced UI/UX**: Added quick access buttons to dashboard for easier QR workflow navigation
- ✅ **Trazability Assurance**: All events now register with immutable location data tied to authentic recycling points

### December 27, 2024 - Complete QR System Integration
- ✅ **QR Code Generation**: Implemented comprehensive QR generation with UUID-based unique codes containing event metadata and system identification
- ✅ **QR Database Models**: Created `qrCodes` and `qrValidations` tables for complete QR lifecycle tracking with evidence metadata support
- ✅ **Phase-Based Validation**: Built sequential validation system enforcing correct phase progression (Deposit → Batch → Process → Product)
- ✅ **Duplicate Prevention**: Implemented robust duplicate validation detection preventing double processing within same phases
- ✅ **Blockchain Integration**: Connected QR validation workflow with smart contract registration and transaction verification
- ✅ **Evidence Management**: Full support for evidence hash storage, metadata tracking, and validation history with operator attribution
- ✅ **REST API Endpoints**: Created complete QR API with generation, validation, lookup, and history tracking capabilities
- ✅ **QR Service Architecture**: Developed modular QR service with proper error handling, validation sequencing, and blockchain coordination

### Previous: Robust Contract Validation & Error Handling
- ✅ **Enhanced Data Models**: Updated shared schema with blockchain events table, evidenceHash fields, and contract status tracking
- ✅ **Robust Validation System**: Implemented comprehensive input validation for all event types with business logic checks
- ✅ **Smart Error Handling**: Added categorized error responses with specific handling for contract reverts, insufficient funds, and network issues
- ✅ **Duplicate Detection**: Implemented validation to prevent double processing in the same phase (Deposit → Batch → Process → Product)
- ✅ **Transaction Retry Logic**: Added exponential backoff retry system with timeout handling and non-retryable error detection
- ✅ **Validation Endpoints**: Created specific endpoints for Batch, Process, and Product validation with proper traceability
- ✅ **Balance Verification**: Added operator balance checks before transactions to prevent failed attempts
- ✅ **Evidence Hash Support**: Full implementation of evidenceHash parameter throughout the validation pipeline

### Previous: Smart Contract ABI Update
- ✅ Updated contract ABI to include evidenceHash parameter
- ✅ Modified registerEvent function to accept evidenceHash
- ✅ Fixed getEvent function to use events mapping directly (avoiding ethers.js formatting issues)
- ✅ Updated API endpoints to handle evidenceHash parameter
- ✅ Contract address updated to 0x9c74e58eD382e0b76be2D334530C714bc14658CA
- ✅ Successfully verified registration and query of events with evidenceHash

### Previous Updates
- User registration system implementation
- Personal statistics bug fix for authenticated users
- Local database solution for user deposit association
- Navigation and routing system integration

## User Preferences
- Keep changes minimal and step-by-step
- Don't deviate from original concept
- Maintain blockchain functionality while keeping it invisible to users
- Use local database for user statistics while keeping blockchain for immutable records

## Current Status
- ✅ Smart contract integration fully functional with new ABI
- ✅ User authentication and registration working
- ✅ Deposit tracking working for authenticated users
- ✅ Personal statistics updating correctly
- ✅ Evidence hash support implemented and verified

## Environment Variables Required
- SEPOLIA_RPC_URL: Ethereum RPC endpoint
- CONTRACT_ADDRESS: Smart contract address (currently: 0x9c74e58eD382e0b76be2D334530C714bc14658CA)
- OPERATOR_PRIVATE_KEY: Private key for blockchain operations
- DATABASE_URL: PostgreSQL connection string