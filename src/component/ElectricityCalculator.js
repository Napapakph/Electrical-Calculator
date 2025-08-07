import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Calendar, Settings, Download, Upload, Database } from 'lucide-react';
import DatabaseService from './DatabaseService';
import './ElectricityCalculator.css';

const ElectricityCalculator = () => {
  // Initialize database service (can switch between 'localStorage', 'api', 'firebase')
  const [dbService] = useState(new DatabaseService('localStorage'));
  
  // State for equipment list
  const [equipment, setEquipment] = useState([]);

  // State for billing settings
  const [billing, setBilling] = useState({
    unitRate: 7, // baht per unit (kWh)
    serviceFee: 7 // percentage
  });

  // State for daily usage
  const [dailyUsage, setDailyUsage] = useState({});
  
  // State for usage history
  const [usageHistory, setUsageHistory] = useState([]);

  // State for new equipment form
  const [newEquipment, setNewEquipment] = useState({ name: '', watts: '' });

  // State for selected date
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load data from database on component mount
  useEffect(() => {
    loadDataFromDatabase();
  }, []);

  // Database operations
  const saveEquipmentToDatabase = React.useCallback(async () => {
    const result = await dbService.saveEquipment(equipment);
    if (!result.success) {
      console.error('Failed to save equipment:', result.error);
    }
  }, [dbService, equipment]);

  // Auto-save when data changes
  useEffect(() => {
    if (equipment.length > 0) {
      saveEquipmentToDatabase();
    }
  }, [equipment, saveEquipmentToDatabase]);

  useEffect(() => {
    if (usageHistory.length > 0) {
      saveUsageHistoryToDatabase();
    }
  }, [usageHistory]);

  useEffect(() => {
    saveBillingSettingsToDatabase();
  }, [billing]);

  const loadDataFromDatabase = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [equipmentResult, historyResult, settingsResult] = await Promise.all([
        dbService.getEquipment(),
        dbService.getUsageHistory(),
        dbService.getBillingSettings()
      ]);

      if (equipmentResult.success) {
        setEquipment(equipmentResult.data || [
          { id: 1, name: 'Air Conditioner', watts: 1500 },
          { id: 2, name: 'Electric Fan', watts: 75 },
          { id: 3, name: 'Electric Pan', watts: 1200 }
        ]);
      }

      if (historyResult.success) {
        setUsageHistory(historyResult.data || []);
      }

      if (settingsResult.success) {
        setBilling(settingsResult.data || { unitRate: 7, serviceFee: 7 });
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data from database');
    } finally {
      setIsLoading(false);
    }
  };

  const saveUsageHistoryToDatabase = async () => {
    const result = await dbService.saveUsageHistory(usageHistory);
    if (!result.success) {
      console.error('Failed to save usage history:', result.error);
    }
  };

  const saveBillingSettingsToDatabase = async () => {
    const result = await dbService.saveBillingSettings(billing);
    if (!result.success) {
      console.error('Failed to save billing settings:', result.error);
    }
  };

  // Handle adding new equipment
  const addEquipment = () => {
    if (newEquipment.name && newEquipment.watts) {
      const newItem = {
        id: Date.now(),
        name: newEquipment.name,
        watts: parseInt(newEquipment.watts)
      };
      setEquipment([...equipment, newItem]);
      setNewEquipment({ name: '', watts: '' });
    }
  };

  // Handle removing equipment
  const removeEquipment = (id) => {
    setEquipment(equipment.filter(item => item.id !== id));
    // Remove from daily usage as well
    const newDailyUsage = { ...dailyUsage };
    delete newDailyUsage[id];
    setDailyUsage(newDailyUsage);
  };

  // Handle usage time input
  const handleUsageChange = (equipmentId, hours) => {
    setDailyUsage({
      ...dailyUsage,
      [equipmentId]: parseFloat(hours) || 0
    });
  };

  // Calculate daily cost
  const calculateDailyCost = () => {
    let totalKwh = 0;
    
    equipment.forEach(item => {
      const hours = dailyUsage[item.id] || 0;
      const kwh = (item.watts * hours) / 1000;
      totalKwh += kwh;
    });

    const baseCost = totalKwh * billing.unitRate;
    const serviceFeeAmount = baseCost * (billing.serviceFee / 100);
    const totalCost = baseCost + serviceFeeAmount;

    return {
      totalKwh: totalKwh.toFixed(3),
      baseCost: baseCost.toFixed(2),
      serviceFee: serviceFeeAmount.toFixed(2),
      totalCost: totalCost.toFixed(2)
    };
  };

  // Save daily usage to history
  const saveDailyUsage = () => {
    const cost = calculateDailyCost();
    const usageData = {
      id: Date.now(),
      date: selectedDate,
      equipment: equipment.map(item => ({
        name: item.name,
        watts: item.watts,
        hours: dailyUsage[item.id] || 0,
        cost: ((item.watts * (dailyUsage[item.id] || 0)) / 1000 * billing.unitRate).toFixed(2)
      })),
      summary: cost,
      timestamp: new Date().toISOString()
    };

    // Remove existing entry for the same date
    const updatedHistory = usageHistory.filter(entry => entry.date !== selectedDate);
    setUsageHistory([...updatedHistory, usageData]);
    
    // Clear daily usage
    setDailyUsage({});
    alert(`Usage saved for ${selectedDate}! Total cost: ${cost.totalCost} Baht`);
  };

  // Get monthly summary
  const getMonthlyData = () => {
    const currentMonth = selectedDate.substring(0, 7);
    const monthlyEntries = usageHistory.filter(entry => entry.date.startsWith(currentMonth));
    
    const totalCost = monthlyEntries.reduce((sum, entry) => sum + parseFloat(entry.summary.totalCost), 0);
    const totalKwh = monthlyEntries.reduce((sum, entry) => sum + parseFloat(entry.summary.totalKwh), 0);
    
    return {
      entries: monthlyEntries.length,
      totalCost: totalCost.toFixed(2),
      totalKwh: totalKwh.toFixed(3)
    };
  };

  // Export data
  const exportData = async () => {
    setIsLoading(true);
    const result = await dbService.exportData();
    
    if (result.success) {
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `electricity-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Data exported successfully!');
    } else {
      alert('Failed to export data: ' + result.error);
    }
    setIsLoading(false);
  };

  // Import data
  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      const result = await dbService.importData(importData);
      
      if (result.success) {
        await loadDataFromDatabase();
        alert('Data imported successfully!');
      } else {
        alert('Failed to import data: ' + result.error);
      }
    } catch (error) {
      alert('Error reading file: ' + error.message);
    } finally {
      setIsLoading(false);
    }
    
    // Clear the input
    event.target.value = '';
  };

  // Clear all data
  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setIsLoading(true);
      const result = await dbService.clearAllData();
      
      if (result.success) {
        setEquipment([]);
        setUsageHistory([]);
        setBilling({ unitRate: 7, serviceFee: 7 });
        setDailyUsage({});
        alert('All data cleared successfully!');
      } else {
        alert('Failed to clear data: ' + result.error);
      }
      setIsLoading(false);
    }
  };

  const dailyCost = calculateDailyCost();
  const monthlyData = getMonthlyData();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    
    <div className="calculator-container">
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={loadDataFromDatabase} className="retry-button">
            Retry
          </button>
        </div>
      )}

      <div className="header-card">
        <h1 className="header-title">
          <Calculator className="header-icon" />
          Room Electricity Calculator
        </h1>
        <p className="header-subtitle">Track your electrical equipment usage and calculate daily costs</p>
        
        {/* Database Controls */}
        <div className="database-controls">
          <button onClick={exportData} className="db-button export-button" style={{ marginRight: '12px' }}>
            <Download className="button-icon" />
            Export Data
          </button>
          <label className="db-button import-button" style={{ marginRight: '12px' }}>
            <Upload className="button-icon" />
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={importData}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={clearAllData} className="db-button clear-button" >
            <Database className="button-icon" />
            Clear All Data
          </button>
        </div>
      </div>

      <div className="main-grid">
        {/* Equipment Management */}
        <div className="equipment-section">
          <div className="card">
            <h2 className="section-title">
              <Settings className="section-icon" />
              Equipment Management
            </h2>
            
            {/* Add Equipment Form */}
            <div className="add-equipment-form">
              <h3 className="form-title">Add New Equipment</h3>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Equipment name"
                  className="equipment-name-input"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Watts"
                  className="watts-input"
                  value={newEquipment.watts}
                  onChange={(e) => setNewEquipment({...newEquipment, watts: e.target.value})}
                />
                <button
                  onClick={addEquipment}
                  className="add-button"
                >
                  <Plus className="button-icon" />
                </button>
              </div>
            </div>

            {/* Equipment Table */}
            <div className="table-container">
              <table className="equipment-table">
                <thead>
                  <tr className="table-header">
                    <th className="table-cell header-cell">Equipment Name</th>
                    <th className="table-cell header-cell center">Watts</th>
                    <th className="table-cell header-cell center">Hours Used Today</th>
                    <th className="table-cell header-cell center">Daily Cost (Baht)</th>
                    <th className="table-cell header-cell center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((item) => {
                    const hours = dailyUsage[item.id] || 0;
                    const cost = ((item.watts * hours) / 1000 * billing.unitRate).toFixed(2);
                    
                    return (
                      <tr key={item.id} className="table-row">
                        <td className="table-cell equipment-name">{item.name}</td>
                        <td className="table-cell center">{item.watts}W</td>
                        <td className="table-cell center">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="24"
                            className="hours-input"
                            value={dailyUsage[item.id] || ''}
                            onChange={(e) => handleUsageChange(item.id, e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td className="table-cell center cost-cell">
                          ฿{cost}
                        </td>
                        <td className="table-cell center">
                          <button
                            onClick={() => removeEquipment(item.id)}
                            className="delete-button"
                          >
                            <Trash2 className="button-icon" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Settings & Summary */}
        <div className="sidebar">
          {/* Billing Settings */}
          <div className="card">
            <h3 className="card-title">Billing Settings</h3>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">
                  Rate per Unit (Baht/kWh)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={billing.unitRate}
                  onChange={(e) => setBilling({...billing, unitRate: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Service Fee (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={billing.serviceFee}
                  onChange={(e) => setBilling({...billing, serviceFee: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          {/* Daily Summary */}
          <div className="card">
            <h3 className="card-title">Today's Summary</h3>
            <div className="summary-content">
              <div className="summary-row">
                <span>Total kWh:</span>
                <span className="summary-value">{dailyCost.totalKwh}</span>
              </div>
              <div className="summary-row">
                <span>Base Cost:</span>
                <span className="summary-value">฿{dailyCost.baseCost}</span>
              </div>
              <div className="summary-row">
                <span>Service Fee:</span>
                <span className="summary-value">฿{dailyCost.serviceFee}</span>
              </div>
              <div className="summary-row total-row">
                <span className="summary-label">Total Cost:</span>
                <span className="total-cost">฿{dailyCost.totalCost}</span>
              </div>
            </div>
            
            <div className="date-section">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>    
            
            <button
              onClick={saveDailyUsage}
              className="save-button"
            >
              <Calendar className="button-icon" />
              Save Daily Usage
            </button>
          </div>

          {/* Monthly Summary */}
          <div className="card">
            <h3 className="card-title">Monthly Summary</h3>
            <div className="summary-content">
              <div className="summary-row">
                <span>Days Recorded:</span>
                <span className="summary-value">{monthlyData.entries}</span>
              </div>
              <div className="summary-row">
                <span>Total kWh:</span>
                <span className="summary-value">{monthlyData.totalKwh}</span>
              </div>
              <div className="summary-row total-row">
                <span className="summary-label">Total Cost:</span>
                <span className="monthly-total">฿{monthlyData.totalCost}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage History */}
      {usageHistory.length > 0 && (
        <div className="history-section">
          <div className="card">
            <h3 className="card-title">Usage History</h3>
            <div className="table-container">
              <table className="history-table">
                <thead>
                  <tr className="table-header">
                    <th className="table-cell header-cell">Date</th>
                    <th className="table-cell header-cell center">Total kWh</th>
                    <th className="table-cell header-cell center">Total Cost</th>
                    <th className="table-cell header-cell">Equipment Used</th>
                  </tr>
                </thead>
                <tbody>
                  {usageHistory.slice(-10).reverse().map((entry, index) => (
                    <tr key={entry.id || index} className="table-row">
                      <td className="table-cell equipment-name">{entry.date}</td>
                      <td className="table-cell center">{entry.summary.totalKwh}</td>
                      <td className="table-cell center cost-cell">
                        ฿{entry.summary.totalCost}
                      </td>
                      <td className="table-cell">
                        <div className="equipment-details">
                          {entry.equipment.filter(eq => eq.hours > 0).map((eq, i) => (
                            <div key={i} className="equipment-item">
                              {eq.name}: {eq.hours}h (฿{eq.cost})
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectricityCalculator;