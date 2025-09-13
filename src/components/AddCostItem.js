import React, { useState } from 'react';
import { TextField, Button, MenuItem, Select, InputLabel, FormControl, Box, Typography } from '@mui/material';
import { openCostsDB } from '../idb-module/idb.mjs';

const currencies = ["USD", "ILS", "GBP", "EURO"];
const categories = ["Food", "Transport", "Entertainment", "Utilities", "Other"];

function AddCostItem() {
    const [formData, setFormData] = useState({
        sum: '',
        currency: 'USD',
        category: '',
        description: ''
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const db = await openCostsDB("costsdb", 1);
            const costData = {
                sum: parseFloat(formData.sum),
                currency: formData.currency,
                category: formData.category,
                description: formData.description
            };

            const result = await db.addCost(costData);
            console.log("Cost added via React:", result);
            setMessage('Cost item added successfully!');
            setFormData({ sum: '', currency: 'USD', category: '', description: '' }); // Reset form
        } catch (error) {
            console.error("Failed to add cost:", error);
            setMessage('Error adding cost item.');
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Add New Cost Item</Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Sum"
                    name="sum"
                    type="number"
                    value={formData.sum}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                />
                <FormControl fullWidth margin="normal" required>
                    <InputLabel>Currency</InputLabel>
                    <Select
                        name="currency"
                        value={formData.currency}
                        label="Currency"
                        onChange={handleChange}
                    >
                        {currencies.map(currency => (
                            <MenuItem key={currency} value={currency}>{currency}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="normal" required>
                    <InputLabel>Category</InputLabel>
                    <Select
                        name="category"
                        value={formData.category}
                        label="Category"
                        onChange={handleChange}
                    >
                        {categories.map(category => (
                            <MenuItem key={category} value={category}>{category}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                />
                <Button type="submit" variant="contained" color="primary" style={{ marginTop: '20px' }}>
                    Add Cost
                </Button>
            </form>
            {message && <Typography style={{ marginTop: '10px' }}>{message}</Typography>}
        </Box>
    );
}

export default AddCostItem;