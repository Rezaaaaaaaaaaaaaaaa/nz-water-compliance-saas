# Port Allocations for Water Intelligence Platform Suite

This document defines the port allocation strategy for all Water Intelligence SaaS platforms to prevent conflicts during development and testing.

## Overview

When developing multiple platforms simultaneously, each platform needs dedicated ports to avoid conflicts. This allocation ensures you can run all platforms concurrently for testing integration scenarios.

## Port Allocation Strategy

### Compliance & Quality Management SaaS
**Repository**: `nz-water-compliance-saas`
- **Frontend**: `3000`
- **Backend**: `3001`
- **Status**: ✅ Active Development

### Digital Twin Platform
**Repository**: `digital-twin-platform-water-wastewater`
- **Frontend**: `3002`
- **Backend**: `3003`
- **Status**: 🔜 Planned

### Asset Intelligence Platform
**Repository**: `asset-intelligence-platform`
- **Frontend**: `3004`
- **Backend**: `3005`
- **Status**: 🔜 Planned

### Shared Infrastructure
These services are shared across all platforms:
- **PostgreSQL**: `5432` (default)
- **Redis**: `6379` (default)

## Usage

### Checking Port Availability

Before starting any platform, you can check if the required ports are available:

```bash
# Check ports for Compliance platform
npm run check-ports

# Or manually check specific ports
node scripts/check-ports.js 3000 3001

# Check all platform ports
node scripts/check-ports.js 3000 3001 3002 3003 3004 3005
```

### Starting Servers Safely

Use the `:safe` variants to automatically check ports before starting:

```bash
# Backend
cd backend
npm run dev:safe        # Checks port 3001, then starts dev server
npm run start:safe      # Checks port 3001, then starts production server

# Frontend
cd frontend
npm run dev:safe        # Checks port 3000, then starts dev server
npm run start:safe      # Checks port 3000, then starts production server
```

### Finding What's Using a Port

If you encounter a port conflict:

**Windows:**
```bash
netstat -ano | findstr :<PORT>
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -i :<PORT>
kill -9 <PID>
```

## Environment Configuration

Each platform should configure its ports in `.env` files:

### Compliance SaaS
```env
# backend/.env
PORT=3001

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Digital Twin Platform
```env
# backend/.env
PORT=3003

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3003
```

### Asset Intelligence Platform
```env
# backend/.env
PORT=3005

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3005
```

## Multi-Platform Development Scenarios

### Running All Platforms Simultaneously

1. **Start Compliance SaaS**:
   ```bash
   cd nz-water-compliance-saas/backend && npm run dev:safe
   cd nz-water-compliance-saas/frontend && npm run dev:safe
   ```

2. **Start Digital Twin Platform**:
   ```bash
   cd digital-twin-platform/backend && npm run dev:safe
   cd digital-twin-platform/frontend && npm run dev:safe
   ```

3. **Start Asset Intelligence Platform**:
   ```bash
   cd asset-intelligence-platform/backend && npm run dev:safe
   cd asset-intelligence-platform/frontend && npm run dev:safe
   ```

### Integration Testing

When testing cross-platform integrations:
- Compliance API: http://localhost:3001
- Digital Twin API: http://localhost:3003
- Asset Intelligence API: http://localhost:3005

### Platform-to-Platform Communication

Each platform can communicate with others via their respective API endpoints. Update CORS settings in each backend to allow cross-origin requests from other platforms if needed.

Example in Fastify backend:
```typescript
await app.register(cors, {
  origin: [
    'http://localhost:3000', // Compliance Frontend
    'http://localhost:3002', // Digital Twin Frontend
    'http://localhost:3004', // Asset Intelligence Frontend
  ],
  credentials: true
});
```

## Future Expansion

As more platforms are added, follow this pattern:
- Platform N Frontend: `3000 + (N * 2)`
- Platform N Backend: `3001 + (N * 2)`

## Troubleshooting

### Port Already in Use
If a port is in use:
1. Run `npm run check-ports` to see which ports are occupied
2. Use system commands to identify the process
3. Either kill the process or adjust your port configuration

### Multiple Instances
If you accidentally start multiple instances of the same server:
1. Check for zombie processes: `ps aux | grep node` (Linux/Mac) or Task Manager (Windows)
2. Kill all Node processes if needed
3. Restart cleanly using `:safe` commands

### Database Connection Conflicts
If multiple platforms share PostgreSQL/Redis:
- Use different database names for each platform
- Consider using Docker Compose with named containers
- Update connection strings in each platform's `.env`

## Best Practices

1. **Always use `:safe` commands** during multi-platform development
2. **Document custom ports** if you deviate from this allocation
3. **Update this file** when adding new platforms
4. **Use Docker Compose** for shared infrastructure (PostgreSQL, Redis)
5. **Test port availability** before long coding sessions

## Quick Reference

| Platform | Frontend | Backend | Database | Redis |
|----------|----------|---------|----------|-------|
| Compliance | 3000 | 3001 | 5432 | 6379 |
| Digital Twin | 3002 | 3003 | 5432 | 6379 |
| Asset Intelligence | 3004 | 3005 | 5432 | 6379 |

---

**Last Updated**: 2025-11-12
**Maintained by**: Development Team
