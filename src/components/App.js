import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import AddCostItem from './AddCostItem';
import ReportView from './ReportView';
import PieChartView from './PieChartView';
import BarChartView from './BarChartView';
import Settings from './Settings';

function App() {
  const [ratesUrl, setRatesUrl] = useState('https://your-default-rates-url.com/rates.json');

  useEffect(() => {
    const savedUrl = localStorage.getItem('currencyRatesUrl');
    if (savedUrl) {
      setRatesUrl(savedUrl);
    }
  }, []);

  return (
      <Router>
        <div>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" style={{ flexGrow: 1 }}>
                Cost Manager
              </Typography>
              <Button color="inherit" component={Link} to="/">Add Cost</Button>
              <Button color="inherit" component={Link} to="/report">Report</Button>
              <Button color="inherit" component={Link} to="/pie">Pie Chart</Button>
              <Button color="inherit" component={Link} to="/bar">Bar Chart</Button>
              <Button color="inherit" component={Link} to="/settings">Settings</Button>
            </Toolbar>
          </AppBar>

          <Container style={{ marginTop: '20px' }}>
            <Routes>
              <Route path="/" element={<AddCostItem />} />
              <Route path="/report" element={<ReportView ratesUrl={ratesUrl} />} />
              <Route path="/pie" element={<PieChartView ratesUrl={ratesUrl} />} />
              <Route path="/bar" element={<BarChartView ratesUrl={ratesUrl} />} />
              <Route path="/settings" element={<Settings setRatesUrl={setRatesUrl} />} />
            </Routes>
          </Container>
        </div>
      </Router>
  );
}

export default App;