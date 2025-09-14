import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';

const DEFAULT_RATES_URL = process.env.REACT_APP_DEFAULT_RATES_URL || 'https://cost-manager-application.onrender.com/exchange_rates.json';

function Settings({ setRatesUrl }) {
    const [localUrl, setLocalUrl] = useState('');

    useEffect(() => {
        const savedUrl = localStorage.getItem('currencyRatesUrl');

        if (savedUrl) {
            console.log("Settings: Loaded URL from localStorage:", savedUrl);
            setLocalUrl(savedUrl);
            setRatesUrl(savedUrl);
        } else {
            console.log("Settings: No URL in localStorage, using default:", DEFAULT_RATES_URL);
            setLocalUrl(DEFAULT_RATES_URL);
            setRatesUrl(DEFAULT_RATES_URL);
            localStorage.setItem('currencyRatesUrl', DEFAULT_RATES_URL);
            console.log("Settings: Default URL saved to localStorage for future use.");
        }
    }, [setRatesUrl]);

    const handleSave = () => {
        localStorage.setItem('currencyRatesUrl', localUrl);
        setRatesUrl(localUrl); // Update the URL in the parent App component
        alert('Settings saved!');
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Settings</Typography>
            <TextField
                label="Currency Rates URL"
                value={localUrl}
                onChange={(e) => setLocalUrl(e.target.value)}
                fullWidth
                margin="normal"
                helperText={`Default: ${DEFAULT_RATES_URL}`}
            />
            <Button variant="contained" onClick={handleSave} style={{ marginTop: '10px' }}>
                Save
            </Button>
            <Typography variant="body2" style={{ marginTop: '10px', color: 'gray' }}>
                If left blank or reset, the app will use the default URL: {DEFAULT_RATES_URL}
            </Typography>
        </Box>
    );
}

export default Settings;