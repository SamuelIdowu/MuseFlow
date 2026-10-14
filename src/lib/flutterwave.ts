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
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Flutterwave Verification Error:', error.response?.data || error.message);
    } else {
      console.error('Flutterwave Verification Error:', error);
    }
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
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Flutterwave Cancellation Error:', error.response?.data || error.message);
    } else {
      console.error('Flutterwave Cancellation Error:', error);
    }
    throw error;
  }
};

const flutterwaveUtils = { verifyTransaction, cancelSubscription };
export default flutterwaveUtils; 
