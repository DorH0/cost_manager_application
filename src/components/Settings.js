import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';

function Settings({ setRatesUrl }) {
    const [localUrl, setLocalUrl] = useState('');

    useEffect(() => {
        const savedUrl = localStorage.getItem('currencyRatesUrl') || '';
        setLocalUrl(savedUrl);
    }, []);

    const handleSave = () => {
        localStorage.setItem('currencyRatesUrl', localUrl);
        setRatesUrl(localUrl);
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
            />
            <Button variant="contained" onClick={handleSave} style={{ marginTop: '10px' }}>
                Save
            </Button>
        </Box>
    );
}

export default Settings;