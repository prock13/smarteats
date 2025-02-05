import { storage } from "../storage";
import { type MfpCredentials } from "@shared/schema";

const MFP_SERVICE_URL = "http://localhost:5001";

export class MyFitnessPalService {
  async getDiaryEntries(username: string, date: string): Promise<any> {
    try {
      const response = await fetch(`${MFP_SERVICE_URL}/diary/${username}/${date}`);
      if (!response.ok) {
        throw new Error('Failed to fetch MFP diary data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching MFP diary:', error);
      throw error;
    }
  }

  async verifyCredentials(username: string): Promise<boolean> {
    try {
      const response = await fetch(`${MFP_SERVICE_URL}/verify/${username}`);
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Error verifying MFP credentials:', error);
      return false;
    }
  }
}

export const mfpService = new MyFitnessPalService();