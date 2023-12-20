const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const PORT = 3000;

// Sample data (replace this with your actual data or database connection)
const transactions = [
  { id: 1, title: 'Product A', description: 'Description A', price: 50.0, dateOfSale: '2023-01-15', isSold: true, category: 'X' },
  { id: 2, title: 'Product B', description: 'Description B', price: 75.0, dateOfSale: '2023-01-20', isSold: false, category: 'Y' },
  // Add more sample transactions as needed
];

app.use(bodyParser.json());

// API for listing transactions with search and pagination
app.get('/list-transactions', (req, res) => {
  try {
    const { page = 1, perPage = 10, search = '' } = req.query;

    // Apply search criteria
    const filteredTransactions = transactions.filter(transaction =>
      transaction.title.includes(search) ||
      transaction.description.includes(search) ||
      transaction.price.toString().includes(search)
    );

    // Calculate pagination
    const startIdx = (page - 1) * perPage;
    const endIdx = startIdx + perPage;

    // Slice the transactions based on pagination
    const paginatedTransactions = filteredTransactions.slice(startIdx, endIdx);

    res.status(200).json({ transactions: paginatedTransactions });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API for statistics of selected month
app.get('/statistics', (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required' });
    }

    // Convert month name to a format suitable for comparison
    const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

    // Filter transactions for the selected month
    const selectedMonthTransactions = transactions.filter(transaction => {
      const transactionMonth = new Date(transaction.dateOfSale).getMonth() + 1;
      return transactionMonth === monthNumber;
    });

    // Calculate statistics
    const totalSalesAmount = selectedMonthTransactions.reduce((total, transaction) => total + (transaction.isSold ? transaction.price : 0), 0);
    const totalSoldItems = selectedMonthTransactions.filter(transaction => transaction.isSold).length;
    const totalNotSoldItems = selectedMonthTransactions.filter(transaction => !transaction.isSold).length;

    res.status(200).json({
      totalSalesAmount,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API for bar chart data for selected month
app.get('/bar-chart', (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required' });
    }

    // Convert month name to a format suitable for comparison
    const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

    // Filter transactions for the selected month
    const selectedMonthTransactions = transactions.filter(transaction => {
      const transactionMonth = new Date(transaction.dateOfSale).getMonth() + 1;
      return transactionMonth === monthNumber;
    });

    // Define price ranges
    const priceRanges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Infinity }
    ];

    // Calculate the number of items in each price range
    const barChartData = priceRanges.map(priceRange => {
      const countInRange = selectedMonthTransactions.filter(transaction =>
        transaction.price >= priceRange.min && transaction.price < priceRange.max
      ).length;

      return {
        priceRange: `${priceRange.min}-${priceRange.max === Infinity ? 'Above' : priceRange.max}`,
        count: countInRange
      };
    });

    res.status(200).json({ barChartData });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API for pie chart data for selected month
app.get('/pie-chart', (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required' });
    }

    // Convert month name to a format suitable for comparison
    const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

    // Filter transactions for the selected month
    const selectedMonthTransactions = transactions.filter(transaction => {
      const transactionMonth = new Date(transaction.dateOfSale).getMonth() + 1;
      return transactionMonth === monthNumber;
    });

    // Find unique categories and count items in each category
    const categoryCounts = selectedMonthTransactions.reduce((counts, transaction) => {
      const { category } = transaction;
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});

    // Prepare pie chart data
    const pieChartData = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count
    }));

    res.status(200).json({ pieChartData });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to fetch data from all three APIs and combine responses
app.get('/combined-data', async (req, res) => {
  try {
    // Fetch data from the first API (list-transactions)
    const listTransactionsResponse = await axios.get('http://localhost:3000/list-transactions?page=1&per_page=10');

    // Fetch data from the second API (statistics)
    const monthInput = req.query.month || 'January';  // Default month is January
    const statisticsResponse = await axios.get(`http://localhost:3000/statistics?month=${monthInput}`);

    // Fetch data from the third API (bar-chart)
    const barChartResponse = await axios.get(`http://localhost:3000/bar-chart?month=${monthInput}`);

    // Fetch data from the fourth API (pie-chart)
    const pieChartResponse = await axios.get(`http://localhost:3000/pie-chart?month=${monthInput}`);

    // Combine the responses
    const combinedData = {
      listTransactions: listTransactionsResponse.data,
      statistics: statisticsResponse.data,
      barChart: barChartResponse.data,
      pieChart: pieChartResponse.data,
    };

    res.status(200).json({ combinedData });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
