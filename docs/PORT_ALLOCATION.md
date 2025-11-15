# Port Allocation Strategy

This document outlines the port allocation for all Water Intelligence Platform SaaS applications running locally to avoid conflicts.

## Port Assignments

### Compliance & Quality Management (This App)
- **Frontend**: `3000`
- **Backend**: `3001`
- **Access**:
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:3001
  - API Docs: http://localhost:3001/api/v1/docs

### Digital Twin Platform
- **Frontend**: `3002`
- **Backend**: `3003`

### Asset Intelligence Platform
- **Frontend**: `3004`
- **Backend**: `3005`

### Shared Infrastructure
- **PostgreSQL**: `5432`
- **Redis**: `6379`

## Checking Port Availability

Before starting any application, check if ports are available:

```bash
# Check specific ports
node scripts/check-ports.js 3000 3001

# View all port allocations
node scripts/check-ports.js
```

## Starting This Application

Use the automated start script which includes port conflict detection:

```bash
npm start
```

This will:
1. Check for port conflicts
2. Kill processes on app ports (3000, 3001) if needed
3. Verify shared infrastructure (PostgreSQL, Redis) is running
4. Start backend on port 3001
5. Start frontend on port 3000

## Manual Port Management

### Find what's using a port

**Windows:**
```bash
netstat -ano | findstr :<PORT>
```

**Linux/Mac:**
```bash
lsof -i :<PORT>
```

### Kill a process on a port

**Windows:**
```bash
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
kill -9 <PID>
```

## Configuration Files

- **Backend**: [backend/.env](../backend/.env) - `PORT=3001`
- **Frontend**: [frontend/.env.local](../frontend/.env.local) - `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
- **Port Checker**: [scripts/check-ports.js](../scripts/check-ports.js)
- **Startup Script**: [tools/local-start.js](../tools/local-start.js)

## Environment Variables

### Backend (.env)
```bash
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NODE_ENV=development
```

## Best Practices

1. **Always use `npm start`** - It handles port conflicts automatically
2. **Check before manual starts** - Use `node scripts/check-ports.js` to verify ports are available
3. **Document new services** - Update this file if adding new services
4. **Keep shared infrastructure running** - PostgreSQL and Redis should remain on standard ports (5432, 6379)

## Troubleshooting

### Port already in use
The startup script will automatically kill processes on ports 3000 and 3001. If you need to manually free a port:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use the built-in kill-port utility
npx kill-port 3001
```

### Wrong port in configuration
If services are starting on wrong ports:
1. Check [backend/.env](../backend/.env) has `PORT=3001`
2. Check [frontend/.env.local](../frontend/.env.local) points to `http://localhost:3001`
3. Run `npm start` to auto-fix configuration

### Other SaaS apps conflicting
Ensure other Water Intelligence Platform apps follow the allocation:
- Digital Twin: 3002-3003
- Asset Intelligence: 3004-3005
- Future platforms: 3006+

## Adding New Platforms

When adding new Water Intelligence Platform SaaS applications:

1. Allocate consecutive port pairs (e.g., 3006, 3007)
2. Update [scripts/check-ports.js](../scripts/check-ports.js) `PORT_ALLOCATIONS`
3. Update this document
4. Communicate to team to avoid conflicts
