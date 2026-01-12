import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [searchVal, setSearchVal] = useState('');
  const [result, setResult] = useState([]);
  const [table, setTable] = useState('Workers');
  const [column, setColumn] = useState('NAME');
  const [availableColumns, setAvailableColumns] = useState([]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [cheapestData, setCheapestData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const navigate = useNavigate();

  // Automatically update column list when table changes
  useEffect(() => {
    axios.get(`http://localhost:5000/api/${table}`)
      .then(res => {
        if (res.data.length > 0) {
          const keys = Object.keys(res.data[0]);
          setAvailableColumns(keys);
          setColumn(keys.includes('NAME') ? 'NAME' : keys[0]);
        }
      })
      .catch(err => console.error(err));
  }, [table]);

  useEffect(() => {
    setLoadingReport(true);
    axios.get(`http://localhost:5000/api/reports/cheapest-goods?date=${reportDate}`)
      .then(res => setCheapestData(res.data))
      .catch(err => console.error("Report Error:", err))
      .finally(() => setLoadingReport(false));
  }, [reportDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchVal) return;
  
    axios.get(`http://localhost:5000/api/${table}`)
      .then(res => {
        const found = res.data.filter(row => {
          const rowValue = row[column];
          const userInput = searchVal.trim();
          if (rowValue === null || rowValue === undefined) return false;
          const isNumeric = typeof rowValue === 'number' || 
                            column.toUpperCase().includes('ID') || 
                            column.toUpperCase().includes('PRICE');
          if (isNumeric) {
            return String(rowValue) === userInput;
          } else {
            return String(rowValue).toLowerCase().includes(userInput.toLowerCase());
          }
        });
        setResult(found);
      })
      .catch(err => console.error(err));
  };

  const getPK = (row) => {
    return row.WORKERS_ID || row.GOOD_ID || row.DEPT_ID || row.SALE_ID || Object.values(row)[0];
  };

  return (
    <div className="page-content">
      
      {/* 1. EXISTING GLOBAL SEARCH SECTION */}
      <div className="card">
        <div className="card-header">🔎 Global Search & Travel</div>
        <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Table</label>
            <select className="search-input" style={{ width: '100%' }} value={table} onChange={(e) => setTable(e.target.value)}>
              <option value="Workers">Workers</option>
              <option value="Goods">Goods</option>
              <option value="Departments">Departments</option>
              <option value="Sales">Sales</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Search Column</label>
            <select className="search-input" style={{ width: '100%' }} value={column} onChange={(e) => setColumn(e.target.value)}>
              {availableColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Search For...</label>
            <input 
              className="search-input"
              style={{ width: '100%' }}
              placeholder="Enter value..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSearch} style={{ height: '42px' }}>Search</button>
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS */}
      {result.length > 0 && (
        <div className="card">
          <div className="card-header">Results (Click a row to Travel)</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>{Object.keys(result[0]).map(k => <th key={k}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {result.map((row, i) => (
                  <tr key={i} className="clickable-row" onClick={() => navigate(`/details/${table}/${getPK(row)}`)}>
                    {Object.values(row).map((v, j) => <td key={j}>{String(v)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- 2. NEW: CHEAPEST GOODS REPORT SECTION --- */}
      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header" style={{ background: '#2c3e50', color: 'white' }}>
          📊 Daily Analysis: Cheapest Goods Sold
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>Choose Date:</label>
            <input 
              type="date" 
              className="search-input"
              style={{ width: '200px' }}
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
            {loadingReport && <span style={{ fontSize: '12px', color: '#666' }}>Calculating...</span>}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th>Department Name</th>
                  <th>Cheapest Item(s) Sold on this Day</th>
                </tr>
              </thead>
              <tbody>
                {cheapestData.length > 0 ? (
                  cheapestData.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600' }}>{item.department}</td>
                      <td style={{ 
                        color: item.goods.includes('Товари не були') ? '#a1a1a1' : '#27ae60',
                        fontStyle: item.goods.includes('Товари не були') ? 'italic' : 'normal'
                      }}>
                        {item.goods}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No data available for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
