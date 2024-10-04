# Authflux

Authflux is a flexible backend package for task scheduling, allowing storage of documents in MongoDB and automated deletion based on user-defined schedules or expiration logic. It integrates easily into any Node.js or TypeScript-based backend project, such as Express.js, and leverages MongoDB for data persistence.

# Features

- Schedule tasks that automatically expire and delete.
- Store data in MongoDB with flexible expiry logic.
- Handle task scheduling and deletion based on dynamic fields (e.g., email).


# Installation

```bash
npm install authflux

```

# Module Imports


```ts
// Import necessary functions from 'authflux'
import { connectToDatabase, createJob, RestoreTimer } from 'authflux';

/**
 * 1. You should place this in your main file (like `index.ts` or `index.js`).
 * 2. Call `connectToDatabase` at the start of your app to ensure MongoDB connection.
 * 3. Call `RestoreTimer` to restore scheduled tasks when the server restarts.
 */

// Step 1: Connect to your MongoDB database
await connectToDatabase(process.env.MONGO_URI);

// Step 2: Restore timers from the database (usually when the server restarts)
// This restores jobs that were scheduled before the server stopped
RestoreTimer('email');  // 'email' should be the reference field you've used in your jobs

// Example Route: Create a Job in your Express.js app

/**
 * Use the `createJob` function to create a new task, such as storing an OTP for expiration.
 * 
 * Structure of the createJob:
 * 
 * createJob(
 *   { name, username, email, password, OTP, token },               // Job data
 *   { expiryValue: 1, expiryUnit: 'minutes' },                     // Expiry config (e.g., 1 minute)
 *   { referenceFields: ['email'] }                                 // Reference fields (to ensure uniqueness based on 'email')
 * )
 */

app.post('/create-job', async (req, res) => {
  try {
    const { name, username, email, password, otp, token } = req.body;

    // Step 3: Use `createJob` to store a new job with expiry
    const newJob = await createJob(
      { name, username, email, password, OTP: otp, token },   // Job data
      { expiryValue: 1, expiryUnit: 'minutes' },             // Expiry configuration
      { referenceFields: ['email'] }                         // Ensuring the job is unique by 'email'
    );

    res.status(200).json({ success: true, job: newJob });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Example of starting the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});





```