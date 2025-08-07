// DatabaseService.js - Multiple database options

class DatabaseService {
  constructor(type = 'localStorage') {
    this.type = type;
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }

  // =====================
  // LOCAL STORAGE METHODS
  // =====================
  
  async saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return { success: false, error: error.message };
    }
  }

  async getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return { success: true, data: data ? JSON.parse(data) : null };
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteFromLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      return { success: false, error: error.message };
    }
  }

  // =====================
  // API/SERVER METHODS
  // =====================

  async saveToAPI(endpoint, data) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Error saving to API:', error);
      return { success: false, error: error.message };
    }
  }

  async getFromAPI(endpoint, params = {}) {
    try {
      const url = new URL(`${this.apiBaseUrl}/${endpoint}`);
      Object.keys(params).forEach(key => 
        url.searchParams.append(key, params[key])
      );

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Error fetching from API:', error);
      return { success: false, error: error.message };
    }
  }

  async updateAPI(endpoint, id, data) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating API:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteFromAPI(endpoint, id) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting from API:', error);
      return { success: false, error: error.message };
    }
  }

  // =====================
  // FIREBASE METHODS
  // =====================

  async saveToFirebase(collection, data) {
    try {
      // This would require Firebase SDK import
      // import { db } from './firebase-config';
      // import { collection, addDoc } from 'firebase/firestore';
      
      // const docRef = await addDoc(collection(db, collection), data);
      // return { success: true, data: { id: docRef.id, ...data } };
      
      console.log('Firebase save method - requires Firebase SDK setup');
      return { success: false, error: 'Firebase not configured' };
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      return { success: false, error: error.message };
    }
  }

  // =====================
  // ELECTRICITY CALCULATOR SPECIFIC METHODS
  // =====================

  // Equipment methods
  async saveEquipment(equipment) {
    switch (this.type) {
      case 'localStorage':
        return await this.saveToLocalStorage('electricity_equipment', equipment);
      case 'api':
        return await this.saveToAPI('equipment', equipment);
      case 'firebase':
        return await this.saveToFirebase('equipment', equipment);
      default:
        return { success: false, error: 'Unknown database type' };
    }
  }

  async getEquipment() {
    switch (this.type) {
      case 'localStorage':
        const result = await this.getFromLocalStorage('electricity_equipment');
        return result.data ? result : { success: true, data: [] };
      case 'api':
        return await this.getFromAPI('equipment');
      case 'firebase':
        // Firebase get method
        return { success: false, error: 'Firebase not configured' };
      default:
        return { success: false, error: 'Unknown database type' };
    }
  }

  // Usage history methods
  async saveUsageHistory(history) {
    switch (this.type) {
      case 'localStorage':
        return await this.saveToLocalStorage('electricity_usage_history', history);
      case 'api':
        return await this.saveToAPI('usage-history', history);
      case 'firebase':
        return await this.saveToFirebase('usage-history', history);
      default:
        return { success: false, error: 'Unknown database type' };
    }
  }

  async getUsageHistory(params = {}) {
    switch (this.type) {
      case 'localStorage':
        const result = await this.getFromLocalStorage('electricity_usage_history');
        return result.data ? result : { success: true, data: [] };
      case 'api':
        return await this.getFromAPI('usage-history', params);
      case 'firebase':
        // Firebase get method with filters
        return { success: false, error: 'Firebase not configured' };
      default:
        return { success: false, error: 'Unknown database type' };
    }
  }

  // Billing settings methods
  async saveBillingSettings(settings) {
    switch (this.type) {
      case 'localStorage':
        return await this.saveToLocalStorage('electricity_billing_settings', settings);
      case 'api':
        return await this.saveToAPI('billing-settings', settings);
      case 'firebase':
        return await this.saveToFirebase('billing-settings', settings);
      default:
        return { success: false, error: 'Unknown database type' };
    }
  }

  async getBillingSettings() {
    switch (this.type) {
      case 'localStorage':
        const result = await this.getFromLocalStorage('electricity_billing_settings');
        return result.data ? result : { 
          success: true, 
          data: { unitRate: 7, serviceFee: 7 } 
        };
      case 'api':
        return await this.getFromAPI('billing-settings');
      case 'firebase':
        return { success: false, error: 'Firebase not configured' };
      default:
        return { success: false, error: 'Unknown database type' };
    }
  }

  // Utility methods
  async clearAllData() {
    try {
      switch (this.type) {
        case 'localStorage':
          await this.deleteFromLocalStorage('electricity_equipment');
          await this.deleteFromLocalStorage('electricity_usage_history');
          await this.deleteFromLocalStorage('electricity_billing_settings');
          return { success: true };
        case 'api':
          // Would need specific API endpoints for clearing data
          return { success: false, error: 'Clear all not implemented for API' };
        case 'firebase':
          return { success: false, error: 'Firebase not configured' };
        default:
          return { success: false, error: 'Unknown database type' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async exportData() {
    try {
      const equipment = await this.getEquipment();
      const history = await this.getUsageHistory();
      const settings = await this.getBillingSettings();

      if (equipment.success && history.success && settings.success) {
        const exportData = {
          equipment: equipment.data,
          usageHistory: history.data,
          billingSettings: settings.data,
          exportDate: new Date().toISOString()
        };

        return { success: true, data: exportData };
      } else {
        return { success: false, error: 'Failed to export some data' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async importData(importData) {
    try {
      const results = await Promise.all([
        this.saveEquipment(importData.equipment || []),
        this.saveUsageHistory(importData.usageHistory || []),
        this.saveBillingSettings(importData.billingSettings || { unitRate: 7, serviceFee: 7 })
      ]);

      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        return { success: true, message: 'Data imported successfully' };
      } else {
        return { success: false, error: 'Some data failed to import' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default DatabaseService;