// Helper function to group sales by date
export const groupSalesByDate = (data) => {
  const grouped = data.reduce((acc, sale) => {
    const date = new Date(sale.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + sale.total;
    return acc;
  }, {});
  return Object.entries(grouped).map(([date, total]) => ({
    date,
    total,
  }));
};

// Helper function to get sales by payment method
export const getSalesByPaymentMethod = (data) => {
  const grouped = data.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
    return acc;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));
};

// Helper function to get sales by item
export const getSalesByItem = (data) => {
  const itemSales = {};
  data.forEach((sale) => {
    sale.items.forEach((item) => {
      const itemName = item.menuItemName;
      itemSales[itemName] =
        (itemSales[itemName] || 0) + item.price * item.quantity;
    });
  });
  return Object.entries(itemSales)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);
};

// Helper function to get top selling items
export const getTopSellingItems = (data) => {
  return getSalesByItem(data).slice(0, 5);
};

// Helper function to get lowest selling items
export const getLowestSellingItems = (data) => {
  const allItems = getSalesByItem(data);
  return allItems.slice(-5).reverse(); // Get last 5 and reverse to show lowest first
};