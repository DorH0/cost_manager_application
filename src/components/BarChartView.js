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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { openCostsDB } from '../idb-module/idb.mjs';
import { getRates } from '../services/currencyService';

const currencies = ["USD", "ILS", "GBP", "EURO"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function BarChartView({ ratesUrl }) {
    const [year, setYear] = useState(new Date().getFullYear());
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
            console.log("BarChart - DB Wrapper received:", db); //Debug log
            const rates = await getRates(ratesUrl);
            console.log("BarChart - Rates fetched:", rates); // Debug log

            const rawCosts = await db.getCostsForYear(year);
            console.log("BarChart - Raw costs fetched:", rawCosts.length, "items"); // Debug log

            if (!rawCosts || rawCosts.length === 0) {
                setChartData([]);
                setLoading(false);
                return;
            }

            const monthlyTotals = {};
            for (let i = 1; i <= 12; i++) {
                monthlyTotals[i] = 0;
            }

            const filteredCosts = rawCosts.filter(cost => {
                const costDate = new Date(cost.date);
                return costDate.getFullYear() === year;
            });
            console.log("BarChart - Filtered costs count:", filteredCosts.length); // Debug log

            filteredCosts.forEach(rawCost => {
                const costDate = new Date(rawCost.date);
                const costMonth = costDate.getMonth() + 1; // 1-12

                const rateFrom = rates[rawCost.currency] || 1;
                const rateTo = rates[currency] || 1;
                const convertedAmount = (rawCost.sum / rateFrom) * rateTo;

                monthlyTotals[costMonth] += convertedAmount;
            });

            const formattedData = Object.entries(monthlyTotals).map(([monthNum, value]) => ({
                name: monthNames[parseInt(monthNum, 10) - 1],
                amount: parseFloat(value.toFixed(2))
            }));

            console.log("BarChart - Formatted data:", formattedData); // Debug log
            setChartData(formattedData);
        } catch (err) {
            console.error("Error generating bar chart data:", err);
            setError(`Failed to generate chart data: ${err.message || err.toString()}`);
            setChartData([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Monthly Costs (Bar Chart)</Typography>
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
                ) : hasSearched ? (
                    chartData && chartData.length > 0 && chartData.some(d => d.amount > 0) ? ( // Check if any data point has value > 0
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} /> {/* Rotate X-axis labels */}
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value.toFixed(2)} ${currency}`, 'Amount']} /> {/* Tooltip with currency and formatting */}
                                <Legend />
                                <Bar dataKey="amount" name={`Total Cost (${currency})`} fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Typography align="center">No data available for the selected year.</Typography>
                    )
                ) : (
                    <Typography align="center">Please select a year and currency, then click "Generate Chart".</Typography>
                )}
            </Box>
        </Box>
    );
}

export default BarChartView;