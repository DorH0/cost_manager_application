import React, { useState, useEffect } from 'react';
import { TextField, Button, MenuItem, Select, InputLabel, FormControl, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { openCostsDB } from '../idb-module/idb.mjs';
import { getRates } from '../services/currencyService';

const currencies = ["USD", "ILS", "GBP", "EURO"];

function ReportView({ ratesUrl }) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [currency, setCurrency] = useState('USD');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateReport = async () => {
        setLoading(true);
        setError('');
        setReport(null);
        try {
            const db = await openCostsDB("costsdb", 1);
            const rates = await getRates(ratesUrl);
            const generatedReport = await db.getReport(year, month, currency, rates);
            setReport(generatedReport);
        } catch (err) {
            console.error("Error generating report:", err);
            setError('Failed to generate report. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Detailed Report</Typography>
            <Box display="flex" alignItems="center" gap={2} marginBottom={2}>
                <TextField
                    label="Year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1900, max: 2100 } }}
                />
                <FormControl>
                    <InputLabel>Month</InputLabel>
                    <Select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                    >
                        {[...Array(12)].map((_, i) => (
                            <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl>
                    <InputLabel>Currency</InputLabel>
                    <Select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                    >
                        {currencies.map(curr => (
                            <MenuItem key={curr} value={curr}>{curr}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button variant="contained" onClick={handleGenerateReport} disabled={loading}>
                    {loading ? 'Loading...' : 'Generate Report'}
                </Button>
            </Box>
            {error && <Typography color="error">{error}</Typography>}
            {report && (
                <Box>
                    <Typography variant="h6">Report for {report.month}/{report.year} in {report.total.currency}</Typography>
                    <Typography>Total: {report.total.total.toFixed(2)}</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Amount ({report.total.currency})</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {report.costs.map((cost, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{`${cost.Date.day}/${cost.Date.month}/${cost.Date.year}`}</TableCell>
                                        <TableCell>{cost.category}</TableCell>
                                        <TableCell>{cost.description}</TableCell>
                                        <TableCell>{cost.sum.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Box>
    );
}

export default ReportView;