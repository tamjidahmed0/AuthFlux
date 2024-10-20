

import mongoose from 'mongoose';
import { JobModel, JobDocument } from './models/jobModel';


export const connectToDatabase = async (mongoURI: string) => {
  try {
    await mongoose.connect(mongoURI);
    
  } catch (err) {
    console.error('Failed to connect to the database:', err);
    throw err;
  }
};



interface ExpiryConfig {
  expiryValue: number;
  expiryUnit: 'minutes' | 'hours' | 'days' | 'years';
}

interface ExpiryConfig {
  expiryValue: number;
  expiryUnit: 'minutes' | 'hours' | 'days' | 'years';
}

// Define an interface for reference fields to check for uniqueness
interface ReferenceFieldConfig {
  referenceFields: Array<string>;
}


// Define an interface for the timeout tracking
interface OtpTimeouts {
  [key: string]: NodeJS.Timeout; // Maps reference values to timeout IDs
}


const otpTimeouts: OtpTimeouts = {}; // Initialize the timeout tracking object

// Function to schedule a task for a user
const scheduleTaskForUser = (
  referenceField: string,     // The field to reference (e.g., 'email')
  referenceValue: string,     // The value of the reference field (e.g., user's email)
  timeoutDuration: number      // Duration before the timeout executes, in milliseconds
) => {
  // Clear any existing timeout for this user to avoid duplicate tasks
  clearTimeout(otpTimeouts[referenceValue]);

  // Set a new timeout
  const timeoutId = setTimeout(async ()  => {
    // console.log(`Executing scheduled task for user with ${referenceField}: ${referenceValue}...`);

    // Perform the delete operation (or any other operation)
    try {
      const deletedJob = await JobModel.findOneAndDelete({ [referenceField]: referenceValue });
      if (deletedJob) {
        // console.log("Deleted Job:", deletedJob);
      } else {
        // console.log("No job found to delete.");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  }, timeoutDuration); // Use the specified timeout duration

  // Store the timeout ID
  otpTimeouts[referenceValue] = timeoutId;
};



export const createJob = async (
  jobData: Record<string, any>, 
  expiryConfig: ExpiryConfig,
  referenceFieldConfig: ReferenceFieldConfig
): Promise<JobDocument> => {


  // Generate expiry time based on provided value and unit
  function generateExpiryTime(value: number, unit: 'minutes' | 'hours' | 'days' | 'years'): Date {
    const currentTime = new Date();
    switch (unit) {
      case 'minutes':
        return new Date(currentTime.getTime() + value * 60000); // Minutes
      case 'hours':
        return new Date(currentTime.getTime() + value * 60 * 60000); // Hours
      case 'days':
        return new Date(currentTime.getTime() + value * 24 * 60 * 60000); // Days
      case 'years':
        return new Date(currentTime.setFullYear(currentTime.getFullYear() + value)); // Years
      default:
        throw new Error('Invalid time unit');
    }
  }

  // Generate expiry based on input from expiryConfig object
  const expiryDate = generateExpiryTime(expiryConfig.expiryValue, expiryConfig.expiryUnit);



const field = referenceFieldConfig.referenceFields[0]

// scheduleTaskForUser(field, jobData.email,milliseconds )



  // console.log(expiryDate, 'expiredate')

  // Build the query based on the reference fields provided
  const query = referenceFieldConfig.referenceFields.reduce((acc, field) => {
    if (jobData[field] !== undefined) {
      acc[field] = jobData[field];
    }
    return acc;
  }, {} as Record<string, any>);

  // Check if a job with the same reference fields already exists
  const existingJob = await JobModel.findOne(query);

  if (existingJob) {
 
    // console.log('Job already exists. Not creating a duplicate.');
    return existingJob; // Return the existing job if found
  }

  // Attach the expiry date to the jobData object
  const jobDataWithExpiry = {
    ...jobData,
    expired: expiryDate
  };






  // Create and save the new job with expiry
  const newJob = new JobModel(jobDataWithExpiry);
  await newJob.save();

  const dateObject = new Date(expiryDate);
const milliseconds = dateObject.getTime();

const created = new Date(newJob.createdAt);
const createdMilisecond = created.getTime();

// console.log(jobData[field],'jobData[field]')
scheduleTaskForUser(field, jobData[field],  milliseconds - createdMilisecond);
// console.log( milliseconds - createdMilisecond,  'miliseconds')


  return newJob;
};




// Function to manually clear a scheduled task before the time is up
export const clearTaskForUser = (referenceValue: string) => {
  if (otpTimeouts[referenceValue]) {
    clearTimeout(otpTimeouts[referenceValue]);
    delete otpTimeouts[referenceValue]; // Remove the timeout from tracking
    console.log(`Timeout for ${referenceValue} has been cleared.`);
  } else {
    console.log(`No active timeout found for ${referenceValue}.`);
  }
};





// Restore timer

export const RestoreTimer = async (referenceField: string): Promise<void> => {
  try {
    // Create a streaming cursor to fetch users with OTPs from the database
    const cursor = JobModel.find().cursor();

    // Iterate over each user asynchronously
    for await (const user of cursor) {
      const currentTime = Date.now();
      const expirationTime = user.expired.getTime(); // Assuming 'date' is a Date field in your schema
      const remainingTime = expirationTime - currentTime;

      // console.log(remainingTime, 'expirationTime');

      if (remainingTime < 0) {
        scheduleTaskForUser(referenceField, user[referenceField], remainingTime);  
      } else if(remainingTime > 0) { 
        // console.log(`OTP for user with email ${user[referenceField]} has already expired.`);
        
        // Use promise instead of callback
        await JobModel.findOneAndDelete({ referenceField: user[referenceField]});
        clearTimeout(otpTimeouts[user[referenceField]]); // Clear the timeout for this user
        // console.log("Deleted User:", user[referenceField]);
      }
    }
  } catch (error) {
    console.error("Error restoring timeouts:", error);
  }
};



export { JobModel } from './models/jobModel';
// Export the type explicitly
export type { JobDocument };

