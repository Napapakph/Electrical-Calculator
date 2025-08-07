import React, { useState, useEffect } from 'react';
import { Zap, Calendar, Calculator, Save, History, Trash2, Plus } from 'lucide-react';
import './MeterReading.css';

const MeterReading = () => {
  // State for current meter reading
  const [currentReading, setCurrentReading] = useState({
    startReading: '',
    startDate: new Date().toISOString().split('T')[0],
    currentReading: '',
    currentDate: new Date().toISOString().split('T')[0],
    note: ''
  });

  // State for meter history
  const [meterHistory, setMeterHistory] = useState([]);

  // State for billing settings
  const [billingSettings, setBillingSettings] = useState({
    unitRate: 7, // baht per unit (kWh)
    serviceFee: 7, // percentage
    minimumCharge: 0 // minimum charge
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('meter_reading_history');
    const savedSettings = localStorage.getItem('meter_billing_settings');
    
    if (savedHistory) {
      try {
        setMeterHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading meter history:', error);
      }
    }
    
    if (savedSettings) {
      try {
        setBillingSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading billing settings:', error);
      }
    }
  }, []);

  // Auto-save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('meter_reading_history', JSON.stringify(meterHistory));
  }, [meterHistory]);

  useEffect(() => {
    localStorage.setItem('meter_billing_settings', JSON.stringify(billingSettings));
  }, [billingSettings]);

  // Calculate usage statistics
  const calculateUsage = () => {
    const startReading = parseFloat(currentReading.startReading) || 0;
    const endReading = parseFloat(currentReading.currentReading) || 0;
    const unitsUsed = Math.max(0, endReading - startReading);
    
    // Calculate days between dates
    const startDate = new Date(currentReading.startDate);
    const endDate = new Date(currentReading.currentDate);
    const daysDifference = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    
    // Calculate average daily usage
    const averageDailyUsage = daysDifference > 0 ? unitsUsed / daysDifference : 0;
    
    // Calculate costs
    const baseCost = unitsUsed * billingSettings.unitRate;
    const serviceFeeAmount = baseCost * (billingSettings.serviceFee / 100);
    const totalBeforeMinimum = baseCost + serviceFeeAmount;
    const totalCost = Math.max(totalBeforeMinimum, billingSettings.minimumCharge);
    
    // Calculate cost per day
    const costPerDay = daysDifference > 0 ? totalCost / daysDifference : 0;

    return {
      unitsUsed: unitsUsed.toFixed(3),
      daysDifference,
      averageDailyUsage: averageDailyUsage.toFixed(3),
      baseCost: baseCost.toFixed(2),
      serviceFee: serviceFeeAmount.toFixed(2),
      totalCost: totalCost.toFixed(2),
      costPerDay: costPerDay.toFixed(2),
      unitRate: billingSettings.unitRate,
      isValid: startReading <= endReading && daysDifference > 0
    };
  };

  // Save current reading to history
  const saveReading = () => {
    const usage = calculateUsage();
    
    if (!usage.isValid) {
      alert('กรุณาตรวจสอบข้อมูลให้ถูกต้อง (มิเตอร์ปัจจุบันต้องมากกว่าหรือเท่ากับมิเตอร์เริ่มต้น)');
      return;
    }

    if (!currentReading.startReading || !currentReading.currentReading) {
      alert('กรุณากรอกค่ามิเตอร์ให้ครบถ้วน');
      return;
    }

    const newRecord = {
      id: Date.now(),
      ...currentReading,
      ...usage,
      createdAt: new Date().toISOString()
    };

    setMeterHistory([newRecord, ...meterHistory]);
    
    // Reset form with current reading as new start reading
    setCurrentReading({
      startReading: currentReading.currentReading,
      startDate: currentReading.currentDate,
      currentReading: '',
      currentDate: new Date().toISOString().split('T')[0],
      note: ''
    });

    alert(`บันทึกข้อมูลสำเร็จ!\nใช้ไฟ ${usage.unitsUsed} หน่วย ใน ${usage.daysDifference} วัน\nค่าไฟรวม ฿${usage.totalCost}`);
  };

  // Delete reading from history
  const deleteReading = (id) => {
    if (window.confirm('ต้องการลบข้อมูลนี้หรือไม่?')) {
      setMeterHistory(meterHistory.filter(record => record.id !== id));
    }
  };

  // Load reading from history to form
  const loadReadingToForm = (record) => {
    setCurrentReading({
      startReading: record.startReading,
      startDate: record.startDate,
      currentReading: record.currentReading,
      currentDate: record.currentDate,
      note: record.note || ''
    });
  };

  // Get monthly summary
  const getMonthlySummary = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRecords = meterHistory.filter(record => 
      record.currentDate.startsWith(currentMonth)
    );
    
    const totalUnits = monthlyRecords.reduce((sum, record) => 
      sum + parseFloat(record.unitsUsed), 0
    );
    
    const totalCost = monthlyRecords.reduce((sum, record) => 
      sum + parseFloat(record.totalCost), 0
    );

    return {
      recordCount: monthlyRecords.length,
      totalUnits: totalUnits.toFixed(3),
      totalCost: totalCost.toFixed(2),
      averagePerRecord: monthlyRecords.length > 0 ? (totalCost / monthlyRecords.length).toFixed(2) : '0.00'
    };
  };

  const usage = calculateUsage();
  const monthlySummary = getMonthlySummary();

  return (
    <div className="meter-reading-container">
      {/* Header */}
      <div className="meter-header">
        <h1 className="meter-title">
          <Zap className="meter-icon" />
          METER MONITOR SYSTEM
        </h1>
        <p className="meter-subtitle">บันทึกและติดตามการใช้ไฟฟ้าจากมิเตอร์</p>
      </div>

      <div className="meter-grid">
        {/* Left Column - Input Form */}
        <div className="meter-form-section">
          <div className="meter-card">
            <h2 className="card-title">
              <Calculator className="section-icon" />
              กรอกค่ามิเตอร์
            </h2>

            <div className="form-grid">
              {/* Start Reading */}
              <div className="form-group-horizontal">
                <div className="form-group">
                  <label className="form-label">มิเตอร์เริ่มต้น (kWh)</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-input"
                    value={currentReading.startReading}
                    onChange={(e) => setCurrentReading({
                      ...currentReading,
                      startReading: e.target.value
                    })}
                    placeholder="0.000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    className="form-input"
                    value={currentReading.startDate}
                    onChange={(e) => setCurrentReading({
                      ...currentReading,
                      startDate: e.target.value
                    })}
                  />
                </div>
              </div>

              {/* Current Reading */}
              <div className="form-group-horizontal">
                <div className="form-group">
                  <label className="form-label">มิเตอร์ปัจจุบัน (kWh)</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-input"
                    value={currentReading.currentReading}
                    onChange={(e) => setCurrentReading({
                      ...currentReading,
                      currentReading: e.target.value
                    })}
                    placeholder="0.000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">วันที่ปัจจุบัน</label>
                  <input
                    type="date"
                    className="form-input"
                    value={currentReading.currentDate}
                    onChange={(e) => setCurrentReading({
                      ...currentReading,
                      currentDate: e.target.value
                    })}
                  />
                </div>
              </div>

              {/* Note */}
              <div className="form-group">
                <label className="form-label">หมายเหตุ (ไม่บังคับ)</label>
                <textarea
                  className="form-textarea"
                  value={currentReading.note}
                  onChange={(e) => setCurrentReading({
                    ...currentReading,
                    note: e.target.value
                  })}
                  placeholder="เพิ่มหมายเหตุ..."
                  rows="3"
                />
              </div>
            </div>

            {/* Usage Summary */}
            <div className="usage-summary">
              <h3 className="summary-title">สรุปการใช้ไฟ</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">หน่วยที่ใช้:</span>
                  <span className="summary-value">{usage.unitsUsed} kWh</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">จำนวนวัน:</span>
                  <span className="summary-value">{usage.daysDifference} วัน</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">เฉลี่ยต่อวัน:</span>
                  <span className="summary-value">{usage.averageDailyUsage} kWh/วัน</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">ค่าไฟเฉลี่ยต่อวัน:</span>
                  <span className="summary-value">฿{usage.costPerDay}/วัน</span>
                </div>
              </div>
            </div>

            <button 
              onClick={saveReading} 
              className="save-button"
              disabled={!usage.isValid}
            >
              <Save className="button-icon" />
              บันทึกข้อมูล
            </button>
          </div>
        </div>

        {/* Right Column - Settings and Summary */}
        <div className="meter-sidebar">
          {/* Billing Settings */}
          <div className="meter-card">
            <h3 className="card-title">ตั้งค่าอัตราค่าไฟ</h3>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">ค่าไฟต่อหน่วย (บาท/kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={billingSettings.unitRate}
                  onChange={(e) => setBillingSettings({
                    ...billingSettings,
                    unitRate: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ค่าบริการ (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={billingSettings.serviceFee}
                  onChange={(e) => setBillingSettings({
                    ...billingSettings,
                    serviceFee: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ค่าไฟขั้นต่ำ (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={billingSettings.minimumCharge}
                  onChange={(e) => setBillingSettings({
                    ...billingSettings,
                    minimumCharge: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="meter-card">
            <h3 className="card-title">รายละเอียดค่าไฟ</h3>
            <div className="cost-breakdown">
              <div className="cost-item">
                <span>ค่าไฟพื้นฐาน:</span>
                <span>฿{usage.baseCost}</span>
              </div>
              <div className="cost-item">
                <span>ค่าบริการ ({billingSettings.serviceFee}%):</span>
                <span>฿{usage.serviceFee}</span>
              </div>
              <div className="cost-item total-cost">
                <span>รวมทั้งหมด:</span>
                <span>฿{usage.totalCost}</span>
              </div>
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="meter-card">
            <h3 className="card-title">สรุปประจำเดือน</h3>
            <div className="monthly-summary">
              <div className="summary-item">
                <span>จำนวนครั้งที่บันทึก:</span>
                <span>{monthlySummary.recordCount}</span>
              </div>
              <div className="summary-item">
                <span>หน่วยรวม:</span>
                <span>{monthlySummary.totalUnits} kWh</span>
              </div>
              <div className="summary-item">
                <span>ค่าไฟรวม:</span>
                <span>฿{monthlySummary.totalCost}</span>
              </div>
              <div className="summary-item">
                <span>เฉลี่ยต่อครั้ง:</span>
                <span>฿{monthlySummary.averagePerRecord}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      {meterHistory.length > 0 && (
        <div className="history-section">
          <div className="meter-card">
            <h3 className="card-title">
              <History className="section-icon" />
              ประวัติการอ่านมิเตอร์
            </h3>
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>วันที่เริ่ม</th>
                    <th>วันที่สิ้นสุด</th>
                    <th>มิเตอร์เริ่ม</th>
                    <th>มิเตอร์ปัจจุบัน</th>
                    <th>หน่วยที่ใช้</th>
                    <th>จำนวนวัน</th>
                    <th>ค่าไฟรวม</th>
                    <th>หมายเหตุ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {meterHistory.slice(0, 10).map((record) => (
                    <tr key={record.id}>
                      <td>{new Date(record.startDate).toLocaleDateString('th-TH')}</td>
                      <td>{new Date(record.currentDate).toLocaleDateString('th-TH')}</td>
                      <td>{parseFloat(record.startReading).toFixed(3)}</td>
                      <td>{parseFloat(record.currentReading).toFixed(3)}</td>
                      <td className="units-used">{record.unitsUsed} kWh</td>
                      <td>{record.daysDifference} วัน</td>
                      <td className="cost-total">฿{record.totalCost}</td>
                      <td className="note-cell">{record.note || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => loadReadingToForm(record)}
                            className="edit-button"
                            title="โหลดข้อมูลนี้เข้าฟอร์ม"
                          >
                            <Plus className="button-icon-small" />
                          </button>
                          <button
                            onClick={() => deleteReading(record.id)}
                            className="delete-button-small"
                            title="ลบข้อมูล"
                          >
                            <Trash2 className="button-icon-small" />
                          </button>
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

export default MeterReading;