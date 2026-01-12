import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './Pages/Home'
import TablePage from './Pages/TablePage';
import DetailsPage from './Pages/DetailsPage';

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: '20px', backgroundColor: '#333', display: 'flex', gap: '20px' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>🏠 Home Search</Link>
          <Link to="/departments" style={{ color: 'white', textDecoration: 'none' }}>Departments</Link>
          <Link to="/workers" style={{ color: 'white', textDecoration: 'none' }}>Workers</Link>
          <Link to="/goods" style={{ color: 'white', textDecoration: 'none' }}>Goods</Link>
          <Link to="/sales" style={{ color: 'white', textDecoration: 'none' }}>Sales</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} /> {/* New Home Component */}
          
          <Route path="/departments" element={
            <TablePage tableName="Departments" pkColumn="DEPT_ID" fields={['DEPT_ID', 'NAME', 'INFO']} />
          } />
          
          <Route path="/workers" element={
            <TablePage tableName="Workers" pkColumn="WORKERS_ID" fields={['WORKERS_ID', 'NAME', 'ADDRESS', 'DEPT_ID', 'INFORMATION']} />
          } />
          
          <Route path="/goods" element={
            <TablePage tableName="Goods" pkColumn="GOOD_ID" fields={['GOOD_ID', 'NAME', 'PRICE', 'QUANTITY', 'PRODUCER', 'DEPT_ID', 'DESCRIPTION']} />
          } />

          <Route path="/sales" element={
            <TablePage tableName="Sales" pkColumn="SALE_ID" fields={['SALE_ID', 'CHECK_NO', 'GOOD_ID', 'DATE_SALE', 'QUANTITY']} />
          } />

          <Route path="/details/:table/:id" element={<DetailsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
