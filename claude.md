# 🧠 CLAUDE.md – Modular Instruction Context for Claude Code
> **Project**: Recitrack – Blockchain Recycling Traceability Platform  
> **Maintainer**: Nicolás Rivera  
> **Mode**: Development (Monorepo)  
> **Claude Context Version**: Full-stack Assistant v2.0  
> **Last Updated**: July 2025

---

## 🎯 [MODULE] Project Overview & Goals

Recitrack is a comprehensive blockchain-based platform that enables complete traceability of recyclable waste throughout the entire recycling value chain. The platform integrates all stakeholders in the recycling ecosystem - from individual depositors to recycling facilities, manufacturers, and end consumers - ensuring transparent tracking of valuable waste materials from collection to final product transformation.

### Core Value Proposition
- **Complete Chain Integration**: Connect all recycling stakeholders in a unified platform
- **Waste Valorization**: Transform waste tracking into valuable data for circular economy
- **ERP Integration**: Specialized recycling-focused Enterprise Resource Planning system
- **Stakeholder Collaboration**: Enable seamless cooperation between collectors, processors, and manufacturers
- **Transparency**: Provide immutable proof of recycling processes and environmental impact

## User Preferences
- Keep changes minimal and step-by-step
- Don't deviate from original concept
- Maintain blockchain functionality while keeping it invisible to users
- Use local database for user statistics while keeping blockchain for immutable records

### MVP Core Features
- **User Management**: CRUD operations for users with role-based access across the recycling chain
- **Deposit Tracking**: Record plastic bottle deposits with blockchain registration
- **QR Code System**: Generate and scan QR codes for item tracking throughout the value chain
- **Dashboard Analytics**: Role-based dashboards with statistics for different stakeholders
- **Blockchain Integration**: Ethereum Sepolia network for testing (production will use more cost-effective solutions)
- **Data Persistence**: PostgreSQL database for off-chain data and ERP functionality
- **ERP Module**: Recycling-specific inventory, processing, and logistics management
- **Stakeholder Network**: Multi-role system for collectors, processors, manufacturers, and consumers

### Success Metrics
- **End-to-End Traceability**: Complete tracking from waste collection to final product
- **Stakeholder Adoption**: Active participation from all recycling chain actors
- **ERP Efficiency**: Streamlined recycling operations and inventory management
- **Data Integrity**: Reliable blockchain confirmation and database synchronization
- **Cost Optimization**: Efficient resource allocation and waste valorization
- **Environmental Impact**: Measurable reduction in waste and increased recycling rates
- **QR Code Reliability**: Seamless generation, scanning, and verification across the value chain

---

## 🏗️ [MODULE] Architecture & Tech Stack

### Core Technologies
- **Frontend**: React 18+ with TypeScript, Vite bundler
- **Backend**: Express.js with TypeScript, Node.js 18+
- **Database**: PostgreSQL with connection pooling
- **Blockchain**: Ethers.js for Ethereum Sepolia interaction
- **Styling**: TailwindCSS + shadcn/ui components
- **Validation**: Zod schemas for type safety across client/server

### Architecture Patterns
- **API Design**: RESTful endpoints following `/api/v1/{resource}` pattern
- **State Management**: React Context + custom hooks (no Redux)
- **Database**: Connection pooling, prepared statements, transaction handling
- **Error Handling**: Consistent HTTP status codes and error responses
- **Type Safety**: Shared TypeScript types between client/server
- **ERP Integration**: Modular design for recycling-specific business logic
- **Multi-tenant Architecture**: Support for different stakeholder types and permissions

---

## 📦 [MODULE] Project Structure

```
recitrack/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/    # Role-based dashboard components for all stakeholders
│   │   │   ├── forms/        # Form components for deposits, inventory, processing
│   │   │   └── ui/           # Reusable UI components (shadcn/ui)
│   │   ├── hooks/           # Custom React hooks for data fetching and state
│   │   ├── routes/          # React Router configuration for multi-role access
│   │   └── utils/           # Client-side utilities
│   └── package.json
├── server/              # Express API server
│   ├── routes/
│   │   ├── auth.routes.ts      # Authentication endpoints
│   │   ├── deposit.routes.ts   # Deposit CRUD operations
│   │   ├── user.routes.ts      # User management across stakeholder types
│   │   └── stats.routes.ts     # Analytics endpoints for all roles
│   ├── services/
│   │   ├── blockchain.service.ts  # Ethereum interaction logic
│   │   ├── qr.service.ts         # QR code generation/scanning
│   │   └── db.service.ts         # Database connection utilities
│   ├── migrations/          # Database schema migrations (currently empty)
│   ├── contract-abi.json    # 🚫 DO NOT MODIFY (external dependency)
│   └── index.ts            # Server entry point (currently placeholder)
├── shared/              # Shared TypeScript definitions
│   ├── types/           # Common type definitions for all stakeholder roles
│   ├── schemas/         # Zod validation schemas
│   └── constants/       # Shared constants
└── .env                 # 🚫 DO NOT READ/MODIFY directly
```

---

## 🔐 [MODULE] Environment & Security

### Environment Variables
These files contain sensitive information and must **NOT** be read or modified directly:
```env
# Database
DATABASE_URL=postgresql://...
# Blockchain
BLAST_RPC_URL=https://...
CONTRACT_ADDRESS=0x9c74e58eD382e0b76be2D334530C714bc14658CA
OPERATOR_PRIVATE_KEY=0x...
# Application
PORT=3000
JWT_SECRET=...
```

### Security Guidelines
- ✅ **Access variables**: Use `process.env.VARIABLE_NAME`
- 🚫 **Never log**: Private keys, connection strings, JWT secrets
- ✅ **Validate inputs**: All user inputs must be sanitized with Zod
- ✅ **Database queries**: Use parameterized queries only
- ✅ **Blockchain transactions**: Verify success before UI updates
- 🚫 **Never expose**: Internal error details to frontend

---

## ⛓️ [MODULE] Blockchain Integration

### Network Configuration
- **Current (Testing)**: Ethereum Sepolia Testnet
- **Production Planning**: Evaluating cost-effective blockchain solutions (Polygon, Arbitrum, or similar L2 solutions)
- **Contract Address**: `0x9c74e58eD382e0b76be2D334530C714bc14658CA`
- **ABI Location**: `server/contract-abi.json` (🚫 **DO NOT MODIFY**)

### Smart Contract Events
```typescript
// Events we listen to and sync with database
- DepositEvent: Record new recyclable material deposits
- BatchEvent: Group deposits into processing batches
- ProcessEvent: Track recycling process steps across stakeholders
- ProductEvent: Record final products created from recycled materials
- TransferEvent: Track material transfers between stakeholders
```

### Blockchain Interaction Rules
- ✅ **Read operations**: Query contract state anytime
- ✅ **Write operations**: Use proper gas estimation (consider cost for production)
- ✅ **Event listening**: Sync events with database safely
- 🚫 **Never**: Modify ABI or contract address
- ✅ **Error handling**: Handle network failures gracefully
- ⚠️ **Production note**: Current implementation is for testing; production will migrate to more cost-effective solution

---

## 📋 [MODULE] Code Standards & Patterns

### API Response Format
```typescript
// Standard API response structure
{
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
```

### Error Handling Pattern
```typescript
// Controller pattern
try {
  const result = await service.method();
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Service error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
}
```

### Database Patterns
```typescript
// Always use transactions for multiple operations
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Multiple operations
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Naming Conventions
- **Variables/Functions**: camelCase (`getUserById`, `depositData`)
- **Components**: PascalCase (`UserDashboard`, `DepositForm`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `CONTRACT_ADDRESS`)
- **Files**: kebab-case (`user-dashboard.tsx`, `deposit-form.component.tsx`)

---

## 🎯 [MODULE] Claude Code Capabilities

### Primary Tasks (Full Permission)
- **Database Operations**: Create/modify migrations, queries, and schemas
- **API Development**: Create/modify REST endpoints and middleware
- **Frontend Components**: Develop/refactor React components and hooks
- **Type Definitions**: Create/update TypeScript interfaces and types
- **Service Layer**: Implement business logic and utilities
- **QR Code System**: Enhance generation/scanning functionality
- **Testing**: Create unit tests and integration tests
- **Documentation**: Update code comments and README files

### Secondary Tasks (Advisory)
- **Performance Optimization**: Suggest improvements for database queries
- **Security Review**: Identify potential security vulnerabilities
- **Code Review**: Provide feedback on existing implementations
- **Architecture Decisions**: Recommend structural improvements
- **Error Handling**: Suggest better error management patterns

### Restricted Operations
- 🚫 **Environment files**: Never read or modify `.env` files
- 🚫 **Contract ABI**: Never modify `contract-abi.json`
- 🚫 **Production secrets**: Never expose or log sensitive data
- 🚫 **Database migrations**: Ask before creating irreversible changes
- 🚫 **Blockchain transactions**: Verify before pushing to network

---

## 🔄 [MODULE] Development Workflow

### Before Making Changes
1. **Check current structure**: Verify file organization and dependencies
2. **Review existing code**: Understand current implementation patterns
3. **Validate requirements**: Confirm changes align with MVP goals

### Change Implementation Order
1. **Database Changes**: Create migration files first
2. **Shared Types**: Update schemas and type definitions
3. **Backend Changes**: Modify API endpoints and services
4. **Frontend Changes**: Update components and hooks
5. **Testing**: Verify functionality works end-to-end

### Quality Checklist
- [ ] TypeScript compilation passes
- [ ] Database queries are parameterized
- [ ] Error handling is implemented
- [ ] API responses follow standard format
- [ ] Frontend components are properly typed
- [ ] Blockchain interactions are validated

---

## 🐛 [MODULE] Common Issues & Solutions

### Database Connection Issues
```typescript
// Check connection string format
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
});
```

### Blockchain Connection Problems
```typescript
// Verify RPC URL and network
const provider = new ethers.providers.JsonRpcProvider(process.env.BLAST_RPC_URL);
const network = await provider.getNetwork();
console.log('Connected to network:', network.name);
```

### QR Code Issues
```typescript
// Ensure proper encoding/decoding format
const qrData = {
  type: 'deposit',
  id: depositId,
  timestamp: Date.now()
};
```

### CORS Configuration
```typescript
// Frontend-backend communication setup
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
```

---

## 🚀 [MODULE] Local Development Commands

```bash
# Initial setup
npm install

# Database setup (run migrations)
cd server
npm run migrate

# Start backend server
cd server
npm run dev          # with nodemon
# or
node index.ts        # direct execution

# Start frontend development server
cd client
npm run dev          # Vite dev server on http://localhost:5173

# Build for production
npm run build        # builds both client and server

# Run tests
npm test            # runs all tests
npm run test:watch  # watch mode for development
```

---

## 📊 [MODULE] File Modification Matrix

### ✅ **Full Permission** (Create/Read/Update/Delete)
- `client/src/**/*.tsx` - React components
- `client/src/**/*.ts` - TypeScript utilities
- `server/routes/**/*.ts` - API endpoints
- `server/services/**/*.ts` - Business logic
- `server/migrations/**/*.sql` - Database migrations
- `server/index.ts` - Server entry point (currently placeholder)
- `shared/**/*.ts` - Shared types and schemas
- `README.md` - Documentation

### ⚠️ **Read-Only** (Reference but don't modify)
- `contract-abi.json` - Smart contract interface
- `package.json` - Dependencies (ask before modifying)
- `tsconfig.json` - TypeScript configuration

### 🚫 **Forbidden** (Never access)
- `.env` - Environment variables
- `node_modules/` - Dependencies
- `dist/` - Build output
- `.git/` - Version control

---

## 🧪 [MODULE] Testing Guidelines

### Unit Tests
```typescript
// Test naming pattern
describe('UserService', () => {
  it('should create user successfully', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
// API endpoint testing
describe('POST /api/v1/deposits', () => {
  it('should create deposit and emit blockchain event', async () => {
    // Test implementation
  });
});
```

### Frontend Testing
```typescript
// Component testing with React Testing Library
describe('UserDashboard', () => {
  it('should render user statistics', () => {
    // Test implementation
  });
});
```

---

## ⚠️ [MODULE] Critical Reminders

- **Always preserve type safety**: Use TypeScript strictly
- **Follow REST conventions**: Proper HTTP methods and status codes
- **Validate user input**: Use Zod schemas for all external data
- **Handle errors gracefully**: Never expose internal errors to users
- **Test blockchain interactions**: Verify on testnet before mainnet
- **Respect security boundaries**: Never log or expose sensitive data
- **Ask before major changes**: Structural modifications need approval

---

## 📞 [MODULE] Support & Context

If you need clarification on any module or encounter issues:
1. **Check this document first** - Most answers are here
2. **Review existing code** - Follow established patterns
3. **Ask specific questions** - Reference module sections
4. **Propose solutions** - Don't just identify problems

Remember: This is a living document. As the project evolves, update relevant modules to maintain context accuracy.

---

© 2025 – Nicolás Rivera / Recitrack  
**Claude Code Assistant Context** - Version 2.0  
This file defines persistent system context. Respect module boundaries and security constraints.