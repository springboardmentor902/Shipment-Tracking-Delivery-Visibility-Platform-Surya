# Render Deployment Guide

This guide will help you deploy the ShipTrack Pro application to Render.com.

## Prerequisites

- A Render.com account (free tier available)
- GitHub repository with the application code
- Google Maps API key
- Brevo SMTP credentials (for email functionality)

## Deployment Steps

### 1. Prepare Your GitHub Repository

First, ensure your repository is clean and ready for deployment:

```bash
# Switch to the clean branch without secrets
git checkout new-main

# Push the new-main branch to GitHub
git push origin new-main
```

**Important**: Make sure you're using the `new-main` branch which doesn't contain the SMTP secrets.

### 2. Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up for a free account
3. Connect your GitHub account to Render

### 3. Deploy Using render.yaml

The easiest way to deploy is using the `render.yaml` file included in the repository:

1. In Render, click "New +"
2. Select "Web Service"
3. Connect to your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Review the configuration and click "Deploy"

### 4. Manual Deployment (Alternative)

If you prefer manual deployment, follow these steps:

#### Deploy PostgreSQL Database

1. In Render, click "New +"
2. Select "PostgreSQL"
3. Name: `trackship-db`
4. Database Name: `trackship_db`
5. User: `postgres`
6. Select Free tier
7. Click "Create Database"

#### Deploy Spring Boot Backend

1. In Render, click "New +"
2. Select "Web Service"
3. Connect to your GitHub repository
4. Configure:
   - **Name**: `trackship-backend`
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.`
   - **Branch**: `new-main`
5. Add Environment Variables:
   - `SPRING_DATASOURCE_URL`: (from PostgreSQL database connection string)
   - `SPRING_DATASOURCE_USERNAME`: `postgres`
   - `SPRING_DATASOURCE_PASSWORD`: (from PostgreSQL database)
   - `SPRING_JPA_HIBERNATE_DDL_AUTO`: `update`
   - `JWT_SECRET`: (generate a secure random string)
   - `GOOGLE_MAPS_API_KEY`: (your Google Maps API key)
   - `BREVO_SMTP_USER`: (your Brevo SMTP username)
   - `BREVO_SMTP_PASSWORD`: (your Brevo SMTP password)
6. Click "Deploy Web Service"

#### Deploy React Frontend

1. In Render, click "New +"
2. Select "Web Service"
3. Connect to your GitHub repository
4. Configure:
   - **Name**: `trackship-frontend`
   - **Environment**: Docker
   - **Dockerfile Path**: `./frontend/Dockerfile`
   - **Docker Context**: `./frontend`
   - **Branch**: `new-main`
5. Add Environment Variables:
   - `VITE_API_URL`: (your backend service URL, e.g., `https://trackship-backend.onrender.com`)
6. Click "Deploy Web Service"

### 5. Configure Environment Variables

After deployment, you'll need to configure the following environment variables in Render:

#### Backend Environment Variables

- `SPRING_DATASOURCE_URL`: PostgreSQL connection string from Render
- `SPRING_DATASOURCE_USERNAME`: `postgres`
- `SPRING_DATASOURCE_PASSWORD`: PostgreSQL password from Render
- `SPRING_JPA_HIBERNATE_DDL_AUTO`: `update`
- `JWT_SECRET`: Generate a secure random string (at least 256 bits)
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key
- `BREVO_SMTP_USER`: Your Brevo SMTP username
- `BREVO_SMTP_PASSWORD`: Your Brevo SMTP password

#### Frontend Environment Variables

- `VITE_API_URL`: Your backend service URL (e.g., `https://trackship-backend.onrender.com`)

### 6. Update Frontend API Configuration

After deployment, update the frontend to use the production API URL:

1. In `frontend/src/App.jsx`, update the API calls to use the production URL
2. Or use environment variables to configure the API URL dynamically

### 7. Test the Deployment

1. Visit your frontend URL (e.g., `https://trackship-frontend.onrender.com`)
2. Test the login functionality with test accounts
3. Verify all features work correctly

## Important Notes

### Free Tier Limitations

- Render free tier has limitations on resources and uptime
- Services spin down after 15 minutes of inactivity
- First request after spin down may take longer
- Database has limited storage (1GB on free tier)

### Database Connection

The PostgreSQL database connection string in Render will look like:
```
postgresql://postgres:password@host:5432/trackship_db
```

Copy this from the Render dashboard and use it in your backend environment variables.

### WebSocket Support

Render supports WebSockets, but you may need to configure the backend to handle WebSocket connections properly. The current configuration should work out of the box.

### File Uploads

The application uses local file storage for uploads. In production, you should consider using:
- Render Disk (for persistent storage)
- AWS S3 or similar cloud storage
- Render's built-in file system

## Troubleshooting

### Build Failures

- Check the build logs in Render dashboard
- Ensure Dockerfile paths are correct
- Verify all dependencies are properly configured

### Database Connection Issues

- Verify database is running
- Check connection string format
- Ensure environment variables are set correctly

### Frontend Not Loading

- Check if backend is accessible
- Verify API URL is correct
- Check browser console for errors

### WebSocket Connection Issues

- Ensure WebSocket support is enabled in Render
- Check firewall/security settings
- Verify WebSocket endpoint configuration

## Cost Considerations

- Free tier: $0/month (with limitations)
- PostgreSQL Free: $0/month (1GB storage)
- Web Services Free: $0/month (spin down after inactivity)

For production use, consider upgrading to paid plans for:
- Better performance
- No spin-down delays
- More storage
- Better support

## Post-Deployment Checklist

- [ ] All services are running
- [ ] Database connection is working
- [ ] Frontend loads correctly
- [ ] Login functionality works
- [ ] API endpoints are accessible
- [ ] WebSocket connections work
- [ ] File uploads work
- [ ] Email notifications work (if configured)
- [ ] Environment variables are set
- [ ] SSL/HTTPS is working

## Support

For Render-specific issues:
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Render Support](https://render.com/support)

For application-specific issues:
- Check the main README.md
- Review API_TEST_GUIDE.md for API testing
- Check FRONTEND_WEBSOCKET_GUIDE.md for WebSocket issues
