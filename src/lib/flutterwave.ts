import axios from 'axios';

const FLUTTERWAVE_URL = 'https://api.flutterwave.com/v3';
const SEC_KEY = process.env.FLUTTERWAVE_SECRET_KEY as string;

export const verifyTransaction = async (transactionId: string) => {
  try {
    const response = await axios.get(`${FLUTTERWAVE_URL}/transactions/${transactionId}/verify`, {
      headers: {
        Authorization: `Bearer ${SEC_KEY}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Flutterwave Verification Error:', error.response?.data || error.message);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId: string) => {
  try {
    // Flutterwave cancel subscription endpoint: PUT /subscriptions/:id/cancel
    const response = await axios.put(`${FLUTTERWAVE_URL}/subscriptions/${subscriptionId}/cancel`, {}, {
      headers: {
        Authorization: `Bearer ${SEC_KEY}`,
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Flutterwave Cancellation Error:', error.response?.data || error.message);
    throw error;
  }
};

// Default export removed as we don't need the class instance
export default {}; 
