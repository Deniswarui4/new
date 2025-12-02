# Frontend Environment Setup

## Environment Variables

Create a `.env.local` file in the `web/` directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Development Setup

### 1. Install Dependencies
```bash
cd web
npm install
```

### 2. Configure Environment
```bash
# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1" > .env.local
```

### 3. Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Production Deployment

### Environment Variables
For production, set:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
```

### Build
```bash
npm run build
npm start
```

## Important Notes

- The API URL must include `/api/v1` at the end
- Make sure the backend API is running before starting the frontend
- The frontend expects the backend to be accessible at the configured URL
- CORS must be properly configured on the backend to allow requests from the frontend domain
