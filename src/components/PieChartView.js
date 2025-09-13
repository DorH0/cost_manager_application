import React, { useState } from 'react';
import {
    TextField,
    Button,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Box,
    Typography,
    Alert
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { openCostsDB } from '../idb-module/idb.mjs';
import { getRates } from '../services/currencyService';

const currencies = ["USD", "ILS", "GBP", "EURO"];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

function PieChartView({ ratesUrl }) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [currency, setCurrency] = useState('USD');
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const handleGenerateChart = async () => {
        setLoading(true);
        setError('');
        setChartData([]);
        setHasSearched(true);
        try {
            const db = await openCostsDB("costsdb", 1);
            console.log("PieChart - DB Wrapper received:", db); // Debug log
            const rates = await getRates(ratesUrl);
            console.log("PieChart - Rates fetched:", rates); // Debug log

            const rawCosts = await db.getCostsForMonth(year, month);
            console.log("PieChart - Raw costs fetched:", rawCosts); // Debug log

            if (!rawCosts || rawCosts.length === 0) {
                setChartData([]); // Ensure chart is cleared
                setLoading(false);
                return; // Exit early, no data to process
            }

            const categoryTotals = {};
            rawCosts.forEach(rawCost => {
                const rateFrom = rates[rawCost.currency] || 1;
                const rateTo = rates[currency] || 1;
                const convertedAmount = (rawCost.sum / rateFrom) * rateTo;

                if (categoryTotals[rawCost.category]) {
                    categoryTotals[rawCost.category] += convertedAmount;
                } else {
                    categoryTotals[rawCost.category] = convertedAmount;
                }
            });

            const formattedData = Object.entries(categoryTotals).map(([category, value]) => ({
                name: category,
                value: parseFloat(value.toFixed(2))
            }));

            console.log("PieChart - Formatted data:", formattedData); // Debug log
            setChartData(formattedData);
        } catch (err) {
            console.error("Error generating pie chart data:", err);
            setError(`Failed to generate chart data: ${err.message || err.toString()}`);
            setChartData([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Costs by Category (Pie Chart)</Typography>
            <Box display="flex" alignItems="center" gap={2} marginBottom={2} flexWrap="wrap">
                <TextField
                    label="Year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1900, max: 2100 } }}
                    size="small"
                />
                <FormControl size="small">
                    <InputLabel>Month</InputLabel>
                    <Select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        label="Month"
                    >
                        {[...Array(12)].map((_, i) => (
                            <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small">
                    <InputLabel>Currency</InputLabel>
                    <Select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        label="Currency"
                    >
                        {currencies.map(curr => (
                            <MenuItem key={curr} value={curr}>{curr}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button variant="contained" onClick={handleGenerateChart} disabled={loading}>
                    {loading ? 'Loading...' : 'Generate Chart'}
                </Button>
            </Box>

            {error && <Alert severity="error" style={{ marginBottom: '20px' }}>{error}</Alert>}

            {/* Chart Rendering Area */}
            <Box height={400} width="100%">
                {loading ? (
                    <Typography align="center">Loading chart data...</Typography>
                ) : hasSearched ? ( // Check if search was initiated
                    chartData && chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value.toFixed(2)} ${currency}`, 'Amount']} /> {/* Tooltip with currency and formatting */}
                                <Legend /> {/* Add legend */}
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <Typography align="center">No data available for the selected period.</Typography>
                    )
                ) : (
                    <Typography align="center">Please select a period and currency, then click "Generate Chart".</Typography>
                )}
            </Box>
        </Box>
    );
}

export default PieChartView;