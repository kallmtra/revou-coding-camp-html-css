var form = document.getElementById("transaction-form");
var nameInput = document.getElementById("item-name");
var amountInput = document.getElementById("item-amount");
var categoryInput = document.getElementById("item-category");
var dateInput = document.getElementById("item-date");
var errorMessage = document.getElementById("error-message");
var transactionList = document.getElementById("transaction-list");
var balanceAmount = document.getElementById("balance-amount");
var monthlySummaryList = document.getElementById("monthly-summary-list");
var sortSelect = document.getElementById("sort-select");
var chartRangeSelect = document.getElementById("chart-range");

var newCategoryInput = document.getElementById("new-category-input");
var addCategoryBtn = document.getElementById("add-category-btn");
var categoryErrorMessage = document.getElementById("category-error-message");

var transactions = [];

var categories = ["Food", "Transport", "Fun"];

var myChart = null;

var chartColors = [
  "#4E79A7",
  "#F28E2B",
  "#E15759",
  "#59A14F",
  "#B07AA1",
  "#EDC948",
  "#76B7B2",
  "#FF9DA7"
];

function setDefaultDate() {
  var today = new Date();
  var year = today.getFullYear();
  var month = String(today.getMonth() + 1).padStart(2, "0");
  var day = String(today.getDate()).padStart(2, "0");
  dateInput.value = year + "-" + month + "-" + day;
}

function loadTransactions() {
  var savedTransactions = localStorage.getItem("transactions");
  if (savedTransactions !== null) {
    transactions = JSON.parse(savedTransactions);
  }

  var savedCategories = localStorage.getItem("categories");
  if (savedCategories !== null) {
    categories = JSON.parse(savedCategories);
  }
}

function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
}

function renderCategoryOptions() {
  var currentValue = categoryInput.value;

  categoryInput.innerHTML = '<option value="">-- Choose Category --</option>';

  for (var i = 0; i < categories.length; i++) {
    var option = document.createElement("option");
    option.value = categories[i];
    option.textContent = categories[i];
    categoryInput.appendChild(option);
  }

  categoryInput.value = currentValue;
}

addCategoryBtn.addEventListener("click", function () {
  var newCategory = newCategoryInput.value.trim();

  if (newCategory === "") {
    categoryErrorMessage.textContent = "Please type a category name.";
    return;
  }

  var alreadyExists = false;
  for (var i = 0; i < categories.length; i++) {
    if (categories[i].toLowerCase() === newCategory.toLowerCase()) {
      alreadyExists = true;
    }
  }

  if (alreadyExists) {
    categoryErrorMessage.textContent = "That category already exists.";
    return;
  }

  categoryErrorMessage.textContent = "";

  categories.push(newCategory);
  saveCategories();
  renderCategoryOptions();

  newCategoryInput.value = "";
});

form.addEventListener("submit", function (event) {
  event.preventDefault();

  var name = nameInput.value.trim();
  var amount = amountInput.value.trim();
  var category = categoryInput.value;
  var date = dateInput.value;

  if (name === "" || amount === "" || category === "" || date === "") {
    errorMessage.textContent = "Please fill in all fields before adding.";
    return;
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    errorMessage.textContent = "Amount must be a valid number greater than 0.";
    return;
  }

  errorMessage.textContent = "";

  var newTransaction = {
    id: Date.now(),
    name: name,
    amount: Number(amount),
    category: category,
    date: date
  };

  transactions.push(newTransaction);

  saveTransactions();

  renderApp();

  form.reset();
  setDefaultDate();
});

function deleteTransaction(id) {
  transactions = transactions.filter(function (t) {
    return t.id !== id;
  });

  saveTransactions();
  renderApp();
}

function getSortedTransactions() {
  var list = transactions.slice();

  var sortType = sortSelect.value;

  if (sortType === "amount-high") {
    list.sort(function (a, b) {
      return b.amount - a.amount;
    });
  } else if (sortType === "amount-low") {
    list.sort(function (a, b) {
      return a.amount - b.amount;
    });
  } else if (sortType === "category") {
    list.sort(function (a, b) {
      return a.category.localeCompare(b.category);
    });
  }

  return list;
}

function renderTransactionList() {
  transactionList.innerHTML = "";

  var list = getSortedTransactions();

  if (list.length === 0) {
    var emptyText = document.createElement("li");
    emptyText.textContent = "No transactions yet.";
    transactionList.appendChild(emptyText);
    return;
  }

  for (var i = 0; i < list.length; i++) {
    var t = list[i];

    var li = document.createElement("li");

    var infoDiv = document.createElement("div");
    infoDiv.className = "item-info";

    var nameSpan = document.createElement("span");
    nameSpan.textContent = t.name + " - Rp " + t.amount.toLocaleString();

    var categorySpan = document.createElement("span");
    categorySpan.className = "item-category";
    categorySpan.textContent = t.category;

    var dateSpan = document.createElement("span");
    dateSpan.className = "item-date";
    dateSpan.textContent = t.date ? t.date : "";

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(categorySpan);
    infoDiv.appendChild(dateSpan);

    var deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";

    (function (transactionId) {
      deleteBtn.addEventListener("click", function () {
        deleteTransaction(transactionId);
      });
    })(t.id);

    li.appendChild(infoDiv);
    li.appendChild(deleteBtn);

    transactionList.appendChild(li);
  }
}

sortSelect.addEventListener("change", function () {
  renderTransactionList();
});

chartRangeSelect.addEventListener("change", function () {
  renderChart();
});

function renderBalance() {
  var total = 0;

  for (var i = 0; i < transactions.length; i++) {
    total = total + transactions[i].amount;
  }

  balanceAmount.textContent = "Rp " + total.toLocaleString();
}

function getCategoryTotals() {
  var totals = {};

  for (var i = 0; i < categories.length; i++) {
    totals[categories[i]] = 0;
  }

  var range = chartRangeSelect.value;
  var today = new Date();

  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];
    var tDate = new Date(t.date);

    var include = true;

    if (range === "month") {
      include = tDate.getFullYear() === today.getFullYear() &&
                tDate.getMonth() === today.getMonth();
    } else if (range === "year") {
      include = tDate.getFullYear() === today.getFullYear();
    }

    if (!include) {
      continue;
    }

    if (totals[t.category] === undefined) {
      totals[t.category] = 0;
    }

    totals[t.category] = totals[t.category] + t.amount;
  }

  return totals;
}

function renderChart() {
  var totals = getCategoryTotals();

  var labels = Object.keys(totals);
  var dataValues = [];
  var colors = [];

  for (var i = 0; i < labels.length; i++) {
    dataValues.push(totals[labels[i]]);
    colors.push(chartColors[i % chartColors.length]);
  }

  var chartData = {
    labels: labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: colors,
        borderColor: "#ffffff",
        borderWidth: 2
      }
    ]
  };

  var ctx = document.getElementById("category-chart").getContext("2d");

  if (myChart !== null) {
    myChart.destroy();
  }

  myChart = new Chart(ctx, {
    type: "pie",
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function renderMonthlySummary() {
  monthlySummaryList.innerHTML = "";

  if (transactions.length === 0) {
    var emptyText = document.createElement("li");
    emptyText.textContent = "No data yet.";
    monthlySummaryList.appendChild(emptyText);
    return;
  }

  var monthTotals = {};

  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];

    var dateObj = t.date ? new Date(t.date) : new Date();

    var monthKey = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1);

    if (monthTotals[monthKey] === undefined) {
      monthTotals[monthKey] = {
        total: 0,
        year: dateObj.getFullYear(),
        month: dateObj.getMonth()
      };
    }

    monthTotals[monthKey].total = monthTotals[monthKey].total + t.amount;
  }

  var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  for (var key in monthTotals) {
    var data = monthTotals[key];

    var li = document.createElement("li");

    var labelSpan = document.createElement("span");
    labelSpan.textContent = monthNames[data.month] + " " + data.year;

    var totalSpan = document.createElement("span");
    totalSpan.textContent = "Rp " + data.total.toLocaleString();

    li.appendChild(labelSpan);
    li.appendChild(totalSpan);

    monthlySummaryList.appendChild(li);
  }
}

function renderApp() {
  renderCategoryOptions();
  renderBalance();
  renderTransactionList();
  renderChart();
  renderMonthlySummary();
}

loadTransactions();
setDefaultDate();
renderApp();
