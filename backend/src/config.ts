import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/diamonddraft',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'diamonddraft-dev-secret',
    expiresIn: '7d',
    refreshExpiresIn: '30d',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173'),
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
  },
};