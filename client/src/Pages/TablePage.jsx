import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TablePage = ({ tableName, pkColumn, fields }) => {
  const [data, setData] = useState([]);
  const [newItem, setNewItem] = useState({});
  const [searchCriteria, setSearchCriteria] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const initializeNewItem = () => {
    const initial = {};
    fields.forEach(field => {
      if (field.toUpperCase().includes('DATE')) {
        initial[field] = getTodayDate();
      } else {
        initial[field] = '';
      }
    });
    setNewItem(initial);
  };

  const fetchData = () => {
    setLoading(true);
    axios.get(`http://localhost:5000/api/${tableName}`)
      .then(res => {
        const formattedData = res.data.map(row => {
          const newRow = { ...row };
          Object.keys(newRow).forEach(key => {
            if (key.includes('DATE') && newRow[key]) {
              newRow[key] = newRow[key].split('T')[0];
            }
          });
          return newRow;
        });
        setData(formattedData);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setData([]);
    setSearchCriteria({});
    initializeNewItem();
    fetchData();
  }, [tableName]);

  const filteredData = data.filter(row => {
    return Object.keys(searchCriteria).every(key => {
      if (!searchCriteria[key]) return true;
      
      const rowValue = row[key];
      const searchValue = searchCriteria[key].trim();

      if (typeof rowValue === 'number' || key.toUpperCase().includes('ID')) {
        return String(rowValue) === searchValue;
      }

      return String(rowValue || '')
        .toLowerCase()
        .includes(searchValue.toLowerCase());
    });
  });

  const handleDelete = (id) => {
    if(!window.confirm("Are you sure?")) return;
    axios.delete(`http://localhost:5000/api/${tableName}/${pkColumn}/${id}`)
      .then(() => fetchData())
      .catch(err => alert("Error deleting: " + (err.response?.data?.error || err.message)));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    axios.post(`http://localhost:5000/api/${tableName}`, newItem)
      .then(() => {
        fetchData();
        initializeNewItem(); // This resets the form AND sets the default date
      })
      .catch(err => alert("Error adding: " + (err.response?.data?.error || err.message)));
  };

  return (
    <div className="page-content">
      <h2>Manager: {tableName}</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* SEARCH SECTION */}
      <div className="card">
        <div className="card-header">🔍 Search & Filter</div>
        <div style={{ padding: '15px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {fields.map(field => {
            const isDateField = field.toUpperCase().includes('DATE');
            return (
              <div key={`search-${field}`} style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>
                  Filter by {field}
                </label>
                <input
                  className="search-input"
                  type={isDateField ? "date" : "text"}
                  placeholder={`Search ${field}...`}
                  value={searchCriteria[field] || ''} 
                  onChange={e => setSearchCriteria({ ...searchCriteria, [field]: e.target.value })}
                />
              </div>
            );
          })}
          <button className="btn btn-secondary" onClick={() => setSearchCriteria({})}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* ADD FORM SECTION */}
      <form onSubmit={handleAdd} className="card" style={{ padding: '20px' }}>
        <h3 style={{ marginTop: 0 }}>➕ Add New Item</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {fields.map(field => (
            <div key={field} style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold' }}>{field}</label>
              <input
                className="search-input"
                type={field.toUpperCase().includes('DATE') ? "date" : "text"}
                value={newItem[field] || ''}
                onChange={e => setNewItem({ ...newItem, [field]: e.target.value })}
                required
                style={{ padding: '5px' }}
              />
            </div>
          ))}
          <button className="btn btn-primary" type="submit">Add</button>
        </div>
      </form>

      {/* DATA TABLE */}
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {fields.map(f => <th key={`head-${f}`}>{f}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => {
                  // Create a key that is impossible to duplicate
                  const rowId = row[pkColumn] || index;
                  const uniqueRowKey = `row-${tableName}-${rowId}-${index}`;
            
                  return (
                    <tr 
                      key={uniqueRowKey} 
                      className="clickable-row"
                      onClick={() => navigate(`/details/${tableName}/${rowId}`)}
                    >
                      {fields.map((f, colIdx) => (
                        <td key={`${uniqueRowKey}-cell-${f}-${colIdx}`}>
                          {row[f]}
                        </td>
                      ))}
                      <td key={`${uniqueRowKey}-actions`} onClick={(e) => e.stopPropagation()}> 
                        <button onClick={() => handleDelete(rowId)}>Delete</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr key={`${tableName}-no-results`}>
                   <td colSpan={fields.length + 1}>No results found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TablePage;
