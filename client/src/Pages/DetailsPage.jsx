import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const DetailsPage = () => {
  const { table, id } = useParams();
  const [sections, setSections] = useState([]);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const getPKValue = (row) => {
    return row.WORKERS_ID || row.GOOD_ID || row.DEPT_ID || row.SALE_ID || Object.values(row)[0];
  };

  const getTargetTable = (row) => {
    const keys = Object.keys(row).map(k => k.toUpperCase());
    if (keys.includes('SALE_ID')) return "Sales";
    if (keys.includes('WORKERS_ID')) return "Workers";
    if (keys.includes('GOOD_ID') && !keys.includes('SALE_ID')) return "Goods";
    if (keys.includes('DEPT_ID') && keys.includes('NAME') && !keys.includes('PRICE')) return "Departments";
    return null;
  };

  const loadDetails = () => {
    axios.get(`http://localhost:5000/api/details/${table}/${id}`)
      .then(res => {
        setSections(res.data.related || []);
      })
      .catch(err => console.error("Details Fetch Error:", err));
  };

  useEffect(() => {
    setMessage(null);
    loadDetails();
  }, [table, id]);

  const handleDeleteAllSales = () => {
    if (!window.confirm(`Delete ALL sales for Department #${id}?`)) return;

    axios.post('http://localhost:5000/api/procedures/delete-producer-sales', { deptId: id })
      .then(res => {
        setMessage({ type: 'success', text: res.data.message });
        loadDetails(); 
      })
      .catch(err => setMessage({ type: 'error', text: err.message }));
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>{table} Details <span style={{ color: '#999' }}>#{id}</span></h2>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>⬅ Back</button>
      </div>

      {/* --- AUTOMATIC DANGER ZONE FOR DEPARTMENTS --- */}
      {table.toLowerCase() === 'departments' && (
        <div className="card" style={{ border: '1px solid #ff4757' }}>
          <div className="card-header" style={{ background: '#ff4757' }}>
            ⚠️ Danger Zone: Department Records Management
          </div>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: '#ff4757' }}>Delete All Department Sales</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                Removes all sales for this department and updates goods descriptions.
              </p>
            </div>
            <button className="btn" onClick={handleDeleteAllSales} style={{ background: '#ff4757', color: 'white' }}>
              Clear All Sales
            </button>
          </div>
          {message && (
            <div style={{ padding: '10px 20px', color: message.type === 'success' ? 'green' : 'red' }}>
              {message.text}
            </div>
          )}
        </div>
      )}

      {/* RENDER RELATED DATA TABLES */}
      {sections.map((section, idx) => (
        <div key={idx} className="card">
          <div className="card-header">{section.title}</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>{section.data[0] && Object.keys(section.data[0]).map(k => <th key={k}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {section.data.map((row, i) => {
                  const target = getTargetTable(row);
                  const targetId = getPKValue(row);
                  
                  return (
                    <tr 
                      key={i} 
                      className={target ? "clickable-row" : ""} 
                      onClick={() => target && navigate(`/details/${target}/${targetId}`)}
                    >
                      {Object.values(row).map((v, j) => <td key={j}>{String(v)}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DetailsPage;
