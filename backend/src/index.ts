import serverlessExpress from '@vendia/serverless-express';
import app from './app';

// For Lambda
export const handler = serverlessExpress({ app });

// For local dev
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
