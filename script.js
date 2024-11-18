document.addEventListener('DOMContentLoaded', init);

function init() {
  const itemForm = document.getElementById('item-form');
  const itemInput = document.getElementById('item-input');
  const quantityInput = document.getElementById('quantity-input');
  const statusInput = document.getElementById('status-input');
  const currentList = document.getElementById('current-list');
  const needList = document.getElementById('need-list');
  const clearBtn = document.getElementById('clear');
  const filterInput = document.getElementById('filter');
  const expiryInput = document.getElementById('expiry-input');
  const priceInput = document.getElementById('price-input');
  const expiringList = document.getElementById('expiring-list');
  const totalAmount = document.getElementById('total-amount');
  const currencySelect = document.getElementById('currency-select');
  const unknownPriceCheckbox = document.getElementById('unknown-price-checkbox');
  const noExpiryCheckbox = document.getElementById('no-expiry-checkbox');
  const receiptForm = document.getElementById('receipt-form');
  const receiptsList = document.getElementById('receipts-list');
  const monthlyBudgetInput = document.getElementById('monthly-budget');
  const setBudgetBtn = document.querySelector('.set-budget-btn');
  const currentBudgetDisplay = document.getElementById('current-budget');
  const spentAmountDisplay = document.getElementById('spent-amount');
  const remainingBudgetDisplay = document.getElementById('remaining-budget');

  let isEditMode = false;
  let editItem = null;

  currencySelect.addEventListener('change', function() {
    localStorage.setItem('selectedCurrency', this.value);
    
    // Clear and reload all lists
    currentList.innerHTML = '';
    expiringList.innerHTML = '';
    needList.innerHTML = '';
    
    // Re-display all items with new currency
    displayItems();
    
    // Update total amount immediately
    updateTotalAmount();
    
    // If there are no items, still update the total amount display with new currency
    if (getItemsFromStorage().length === 0) {
      const currencySymbol = getCurrencySymbol(this.value);
      totalAmount.textContent = `Total Amount to Spend: ${currencySymbol}0.00`;
    }
    updateBudgetStats();
  });

  unknownPriceCheckbox.addEventListener('change', function() {
    if (this.checked) {
      priceInput.value = '';
      priceInput.disabled = true;
      priceInput.placeholder = 'Price Unknown';
    } else {
      priceInput.disabled = false;
      priceInput.placeholder = 'Enter Price per Item';
    }
  });

  noExpiryCheckbox.addEventListener('change', function() {
    if (this.checked) {
      expiryInput.value = '';
      expiryInput.disabled = true;
      expiryInput.style.backgroundColor = '#f5f5f5';
    } else {
      expiryInput.disabled = false;
      expiryInput.style.backgroundColor = '';
    }
  });

  const savedCurrency = localStorage.getItem('selectedCurrency') || 'USD';
  currencySelect.value = savedCurrency;

  const savedBudget = localStorage.getItem('monthlyBudget');
  if (savedBudget) {
    const budgetAmount = parseFloat(savedBudget);
    monthlyBudgetInput.value = budgetAmount;
    const currencySymbol = getCurrencySymbol(currencySelect.value);
    currentBudgetDisplay.textContent = `${currencySymbol}${budgetAmount.toFixed(2)}`;
  }

  if (setBudgetBtn) {
    setBudgetBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      const budgetAmount = parseFloat(monthlyBudgetInput.value);
      
      if (isNaN(budgetAmount) || budgetAmount < 0) {
        await showCustomDialog('Please enter a valid budget amount', 'alert');
        return;
      }
      
      // Check if there's an existing budget
      const currentBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
      
      // If it's not the first time, check if it's the same amount
      if (currentBudget !== 0 && budgetAmount === currentBudget) {
        await showCustomDialog('The budget amount is the same as the current budget. Please enter a different amount.', 'alert');
        return;
      }
      
      // Different message for first time budget setting
      const message = currentBudget === 0 ? 
        'Are you sure you about the Budget amount?' : 
        'Are you sure you want to change the Budget amount?';
      
      // Use the custom dialog instead of creating a new one
      const confirmed = await showCustomDialog(message);
      if (confirmed) {
        localStorage.setItem('monthlyBudget', budgetAmount.toString());
        const currencySymbol = getCurrencySymbol(currencySelect.value);
        currentBudgetDisplay.textContent = `${currencySymbol}${budgetAmount.toFixed(2)}`;
        updateBudgetStats();
      } else {
        monthlyBudgetInput.value = currentBudget;
      }
    });
  }

  initializeForm();

  displayItems();

  initializeReceiptsSection();

  displayReceipts();

  updateBudgetStats();

  itemForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const itemName = itemInput.value.trim();
    const itemQuantity = parseInt(quantityInput.value);
    const itemStatus = statusInput.value;
    const itemExpiry = noExpiryCheckbox.checked ? '' : expiryInput.value;
    const itemPrice = unknownPriceCheckbox.checked ? 0 : parseFloat(priceInput.value) || 0;

    // Only validate if the values are invalid
    if (!itemName || itemName === '') {
      await showCustomDialog('Please enter an item name', 'alert');
      return;
    }

    if (!itemQuantity || isNaN(itemQuantity) || itemQuantity < 1) {
      await showCustomDialog('Please enter a valid quantity', 'alert');
      return;
    }

    if (itemStatus === 'current' && !noExpiryCheckbox.checked && !itemExpiry) {
      await showCustomDialog('Please select an expiry date or check "Expiry N/A"', 'alert');
      return;
    }

    if (itemStatus === 'need' && !unknownPriceCheckbox.checked && (!itemPrice || itemPrice <= 0)) {
      await showCustomDialog('Please enter a valid price or check "Price N/A"', 'alert');
      return;
    }

    // Check for duplicates only when adding new items
    if (!isEditMode && isDuplicateItem(itemName, itemStatus)) {
      await showCustomDialog('This item already exists in the current list!', 'alert');
      return;
    }

    try {
      if (isEditMode) {
        // Update the item
        updateLocalStorage(itemName, itemQuantity, itemStatus, itemExpiry, itemPrice);
        editItemInDOM(itemName, itemQuantity, itemStatus, itemExpiry, itemPrice);
        
        // Reset submit button text
        const submitButton = itemForm.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fa-solid fa-plus"></i> Add Item';
      } else {
        // Add new item
        addItemToDOM(itemName, itemQuantity, itemStatus, itemExpiry, itemPrice);
        addItemToLocalStorage(itemName, itemQuantity, itemStatus, itemExpiry, itemPrice);
      }

      // Reset form and its state
      itemForm.reset();
      unknownPriceCheckbox.checked = false;
      noExpiryCheckbox.checked = false;
      priceInput.disabled = false;
      expiryInput.disabled = false;
      
      // Reset price input placeholder
      priceInput.placeholder = 'Enter Price per Item';
      
      // Initialize form to show/hide appropriate fields
      initializeForm();
    } catch (error) {
      await showCustomDialog('An error occurred while saving the item', 'alert');
    }
  });

  currentList.addEventListener('click', function(e) {
    handleItemClick(e);
  });

  needList.addEventListener('click', function(e) {
    handleItemClick(e);
  });

  expiringList.addEventListener('click', function(e) {
    handleItemClick(e);
  });

  function handleItemClick(e) {
    const targetElement = e.target.closest('button');
    if (!targetElement) return;

    const listItem = targetElement.closest('li');
    
    if (targetElement.classList.contains('remove-item') || 
        targetElement.querySelector('.fa-xmark')) {
      removeItem(listItem);
    } else if (targetElement.classList.contains('edit-item') || 
               targetElement.querySelector('.fa-pen')) {
      editMode(listItem);
    } else if (targetElement.classList.contains('move-item') || 
               targetElement.querySelector('.fa-check')) {
      showMoveDialog(listItem);
    }
  }

  function editMode(item) {
    if (!item) return;
    
    // Remove edit-mode-item class from any previously edited items
    document.querySelectorAll('.edit-mode-item').forEach(item => {
      item.classList.remove('edit-mode-item');
    });
    
    isEditMode = true;
    editItem = item;
    
    const itemText = item.querySelector('.item-name').textContent;
    const itemQuantityText = item.querySelector('.item-quantity').textContent;
    const quantity = parseInt(itemQuantityText);
    
    // Determine status based on which list contains the item
    let itemStatus;
    if (item.closest('#need-list')) {
      itemStatus = 'need';
    } else {
      itemStatus = 'current';
    }
    
    let itemExpiry = '';
    let itemPrice = 0;
    
    // Reset checkboxes and enable inputs first
    noExpiryCheckbox.checked = false;
    unknownPriceCheckbox.checked = false;
    expiryInput.disabled = false;
    priceInput.disabled = false;
    
    if (itemStatus === 'current') {
      const expirySpan = item.querySelector('.item-expiry');
      if (expirySpan) {
        const expiryText = expirySpan.textContent;
        if (expiryText.includes('N/A')) {
          noExpiryCheckbox.checked = true;
          expiryInput.disabled = true;
          expiryInput.value = '';
        } else {
          const expiryMatch = expiryText.match(/(Expires: |Expired on: )(.*)/);
          if (expiryMatch) {
            const expiryDate = new Date(expiryMatch[2]);
            // Format date for input without timezone adjustment
            itemExpiry = expiryDate.toISOString().split('T')[0];
            noExpiryCheckbox.checked = false;
            expiryInput.disabled = false;
          }
        }
      }
    } else {
      const priceSpan = item.querySelector('.item-price');
      if (priceSpan) {
        if (priceSpan.textContent.includes('Unknown')) {
          unknownPriceCheckbox.checked = true;
          priceInput.disabled = true;
          priceInput.value = '';
        } else {
          const priceMatch = priceSpan.textContent.match(/[\d.]+/);
          if (priceMatch) {
            itemPrice = parseFloat(priceMatch[0]);
            unknownPriceCheckbox.checked = false;
            priceInput.disabled = false;
          }
        }
      }
    }
    
    // Update form inputs
    itemInput.value = itemText;
    quantityInput.value = quantity;
    statusInput.value = itemStatus;
    expiryInput.value = itemExpiry;
    priceInput.value = itemPrice || '';
    
    // Update form display based on status
    if (itemStatus === 'current') {
      document.querySelector('.date-container').style.display = 'block';
      document.querySelector('.price-container').style.display = 'none';
    } else {
      document.querySelector('.date-container').style.display = 'none';
      document.querySelector('.price-container').style.display = 'flex';
    }
    
    // Update submit button text
    const submitButton = itemForm.querySelector('button[type="submit"]');
    submitButton.innerHTML = '<i class="fa-solid fa-pen"></i> Update Item';
    
    // Add edit mode class to item
    item.classList.add('edit-mode-item');
    
    // Scroll to form
    itemForm.scrollIntoView({ behavior: 'smooth' });
  }

  function initializeForm() {
    const currentStatus = statusInput.value;
    if (currentStatus === 'current') {
      document.querySelector('.date-container').style.display = 'block';
      document.querySelector('.price-container').style.display = 'none';
      priceInput.value = '';
      priceInput.placeholder = 'Enter Price per Item';
      unknownPriceCheckbox.checked = false;
      priceInput.disabled = false;
    } else {
      document.querySelector('.date-container').style.display = 'none';
      document.querySelector('.price-container').style.display = 'flex';
      expiryInput.value = '';
      priceInput.placeholder = 'Enter Price per Item';
    }
  }

  function updateBudgetStats() {
    updateBudgetDashboard();
  }

  function initializeReceiptsSection() {
    const receiptsList = document.getElementById('receipts-list');
    const showReceiptsBtn = document.getElementById('show-receipts-btn');
    
    if (!receiptsList || !showReceiptsBtn) return;
    
    // Initially hide receipts
    receiptsList.style.display = 'none';
    
    // Remove existing event listener and add new one
    const newShowReceiptsBtn = showReceiptsBtn.cloneNode(true);
    showReceiptsBtn.parentNode.replaceChild(newShowReceiptsBtn, showReceiptsBtn);
    
    newShowReceiptsBtn.addEventListener('click', function() {
      const isHidden = receiptsList.style.display === 'none';
      receiptsList.style.display = isHidden ? 'grid' : 'none';
      this.innerHTML = isHidden 
        ? '<i class="fas fa-times"></i> Hide Receipts'
        : '<i class="fas fa-receipt"></i> Show Receipts';
    });
  }

  function getCurrencySymbol(currency) {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      JPY: '¥',
      AUD: 'A$',
      CAD: 'C$'
    };
    return symbols[currency] || currency;
  }

  function getReceipts() {
    return JSON.parse(localStorage.getItem('receipts')) || [];
  }

  function displayItems() {
    currentList.innerHTML = '';
    needList.innerHTML = '';
    expiringList.innerHTML = '';
    
    const items = getItemsFromStorage();
    items.forEach(({ name, quantity, status, expiry, price, isUnknownPrice }) => {
      addItemToDOM(name, quantity, status, expiry, isUnknownPrice ? 0 : price);
    });
    checkUI();
  }

  function addItemToDOM(name, quantity, status, expiry = '', price = 0) {
    const listItem = document.createElement('li');
    const currencySymbol = getCurrencySymbol(currencySelect.value);
    
    const capitalizedName = name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    let expiryDisplay = '';
    if (status === 'current') {
      if (expiry) {
        // Create date without timezone offset
        const expiryDate = new Date(expiry + 'T00:00:00Z');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let expiryStatus = '';
        let expiryPrefix = 'Expires: ';
        
        if (daysUntilExpiry < 0) {
          expiryStatus = 'expired';
          expiryPrefix = 'Expired on: ';
        } else if (daysUntilExpiry <= 3) {
          expiryStatus = 'expiring';
        }
        
        expiryDisplay = `<span class="item-expiry ${expiryStatus}">
          ${expiryPrefix}${new Date(expiry).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
          })}
        </span>`;
      } else {
        expiryDisplay = '<span class="item-expiry">Expires: N/A</span>';
      }
    }
    
    const isExpiring = expiry && isExpiringSoon(expiry);
    
    if (isExpiring) {
      listItem.classList.add('expiring-item');
    }
    
    listItem.innerHTML = `
      <div class="item-details">
        <span class="item-name">${capitalizedName}</span>
        <span class="item-quantity">${quantity} units</span>
        ${status === 'current' ? 
          expiryDisplay 
          : 
          (price === 0 ? 
            '<span class="item-price">Price: Unknown</span>' 
            : 
            `<span class="item-price">${currencySymbol}${price.toFixed(2)} × ${quantity} = ${currencySymbol}${(price * quantity).toFixed(2)}</span>`
          )
        }
      </div>
      <div class="item-actions">
        ${status === 'need' ? 
          '<button class="move-item btn-link"><i class="fa-solid fa-check"></i></button>' 
          : ''
        }
        <button class="edit-item btn-link">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="remove-item btn-link text-red">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;

    if (status === 'current') {
      if (isExpiring) {
        expiringList.appendChild(listItem);
      } else {
        currentList.appendChild(listItem);
      }
    } else {
      needList.appendChild(listItem);
    }
    updateTotalAmount();
    updateBudgetStats();
  }

  function addItemToLocalStorage(name, quantity, status, expiry = '', price = 0) {
    const items = getItemsFromStorage();
    const capitalizedName = name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    const isUnknownPrice = status === 'need' && unknownPriceCheckbox.checked;
    const noExpiry = noExpiryCheckbox.checked;
    
    items.push({ 
      name: capitalizedName, 
      quantity, 
      status, 
      expiry: noExpiry ? '' : expiry, 
      price: isUnknownPrice ? 0 : price,
      isUnknownPrice: isUnknownPrice
    });
    
    localStorage.setItem('items', JSON.stringify(items));
    updateTotalAmount();
  }

  function editItemInDOM(name, quantity, status, expiry, price) {
    if (!editItem) return;
    
    // Remove the old item from DOM
    editItem.classList.remove('edit-mode-item');
    editItem.remove();
    
    // Add the updated item
    addItemToDOM(name, quantity, status, expiry, price);
    
    // Reset edit mode
    isEditMode = false;
    editItem = null;
    
    // Reset submit button text
    const submitButton = itemForm.querySelector('button[type="submit"]');
    submitButton.innerHTML = '<i class="fa-solid fa-plus"></i> Add Item';
  }

  function updateLocalStorage(name, quantity, status, expiry = '', price = 0) {
    let items = getItemsFromStorage();
    const oldItemName = editItem.querySelector('.item-name').textContent;
    
    // Create the updated item object
    const updatedItem = {
      name: name,
      quantity: quantity,
      status: status,
      expiry: noExpiryCheckbox.checked ? '' : expiry,
      price: status === 'need' && unknownPriceCheckbox.checked ? 0 : price,
      isUnknownPrice: status === 'need' && unknownPriceCheckbox.checked
    };
    
    // Update the items array
    items = items.map(item => 
      item.name === oldItemName ? updatedItem : item
    );
    
    // Save to localStorage
    localStorage.setItem('items', JSON.stringify(items));
    updateTotalAmount();
    updateBudgetStats();
  }

  function removeItem(item) {
    if (confirm('Are you sure you want to remove this item?')) {
      const itemName = item.querySelector('.item-name').textContent;
      item.remove();
      removeItemFromStorage(itemName);
      checkUI();
      updateBudgetStats();
    }
  }

  function removeItemFromStorage(name) {
    let items = getItemsFromStorage();
    items = items.filter((item) => item.name !== name);
    localStorage.setItem('items', JSON.stringify(items));
    updateTotalAmount();
  }

  function getItemsFromStorage() {
    return localStorage.getItem('items') ? JSON.parse(localStorage.getItem('items')) : [];
  }

  function isDuplicateItem(name, status) {
    const items = getItemsFromStorage();
    if (status === 'need') {
      return false;
    } else {
      return items.some(item => 
        item.name.toLowerCase() === name.toLowerCase() && 
        (item.status === 'current')
      );
    }
  }

  function checkUI() {
    const hasItems = currentList.children.length > 0 || 
      needList.children.length > 0 || 
      expiringList.children.length > 0;
    filterInput.style.display = hasItems ? 'block' : 'none';
  }

  function isExpiringSoon(expiryDate) {
    if (!expiryDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create date without timezone offset
    const expiry = new Date(expiryDate + 'T00:00:00Z');
    
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= 3;
  }

  function updateTotalAmount() {
    const items = getItemsFromStorage();
    const total = items
      .filter(item => item.status === 'need' && item.price > 0)
      .reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
    const currencySymbol = getCurrencySymbol(currencySelect.value);
    const unknownPriceItems = items.filter(item => item.status === 'need' && item.price === 0).length;
    
    let totalText = `Total Amount to Spend: ${currencySymbol}${total.toFixed(2)}`;
    if (unknownPriceItems > 0) {
      totalText += ` (${unknownPriceItems} item${unknownPriceItems > 1 ? 's' : ''} with unknown price)`;
    }
    totalAmount.textContent = totalText;
  }

  setInterval(() => {
    const items = getItemsFromStorage();
    items.forEach(item => {
      if (item.status === 'current' && isExpiringSoon(item.expiry)) {
        alert(`${item.name} is expiring soon! Expiry date: ${item.expiry}`);
      }
    });
  }, 86400000);

  function checkAndMoveExpiringItems() {
    const items = getItemsFromStorage();
    currentList.innerHTML = '';
    expiringList.innerHTML = '';
    
    items.forEach(item => {
      if (item.status === 'current') {
        addItemToDOM(item.name, item.quantity, item.status, item.expiry, item.price);
      }
    });
  }

  setInterval(checkAndMoveExpiringItems, 3600000);

  document.querySelectorAll('.btn-clear-section').forEach(button => {
    button.addEventListener('click', function() {
      const listType = this.dataset.list;
      clearSection(listType);
    });
  });

  function clearSection(listType) {
    if (!confirm(`Are you sure you want to clear all ${listType === 'receipts' ? 'receipts' : 'items'} from this section?`)) return;

    let items = getItemsFromStorage();
    
    switch(listType) {
      case 'current':
        currentList.innerHTML = '';
        items = items.filter(item => item.status !== 'current' || isExpiringSoon(item.expiry));
        break;
      case 'expiring':
        expiringList.innerHTML = '';
        items = items.filter(item => !isExpiringSoon(item.expiry));
        break;
      case 'need':
        needList.innerHTML = '';
        items = items.filter(item => item.status !== 'need');
        break;
      case 'receipts':
        // Clear receipts from localStorage
        localStorage.removeItem('receipts');
        // Update the display
        displayReceipts();
        // Update budget stats
        updateBudgetStats();
        return; // Return early as we don't need to update items storage
    }

    localStorage.setItem('items', JSON.stringify(items));
    updateTotalAmount();
    checkUI();
  }

  function handleReceiptUpload(e) {
    e.preventDefault();
    
    const receiptName = document.getElementById('receipt-name').value;
    const receiptDate = document.getElementById('receipt-date').value;
    const receiptAmount = document.getElementById('receipt-amount').value;
    const receiptFile = document.getElementById('receipt-file').files[0];
    
    if (!receiptName || !receiptDate || !receiptAmount || !receiptFile) {
      alert('Please fill in all receipt details and upload a file');
      return;
    }
    
    const amount = parseFloat(receiptAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (receiptFile.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const receipt = {
        id: Date.now(),
        name: receiptName,
        date: receiptDate,
        amount: amount,
        file: event.target.result,
        type: receiptFile.type
      };
      
      // Save receipt to localStorage
      const receipts = getReceipts();
      receipts.push(receipt);
      localStorage.setItem('receipts', JSON.stringify(receipts));
      
      // Show the receipts list if it's hidden
      const receiptsList = document.getElementById('receipts-list');
      if (receiptsList.style.display === 'none') {
        receiptsList.style.display = 'grid';
        const showReceiptsBtn = document.getElementById('show-receipts-btn');
        if (showReceiptsBtn) {
          showReceiptsBtn.innerHTML = '<i class="fas fa-times"></i> Hide Receipts';
        }
      }
      
      // Update UI
      displayReceipts();
      updateBudgetStats();
      receiptForm.reset();
    };
    
    reader.readAsDataURL(receiptFile);
  }

  function saveReceipt(receipt) {
    const receipts = getReceipts();
    receipts.push(receipt);
    localStorage.setItem('receipts', JSON.stringify(receipts));
  }

  function displayReceipts() {
    const receiptsList = document.getElementById('receipts-list');
    if (!receiptsList) return; // Guard clause if element doesn't exist
    
    // Clear existing receipts
    receiptsList.innerHTML = '';
    
    // Get receipts from storage
    const receipts = getReceipts();
    const currencySymbol = getCurrencySymbol(currencySelect.value);
    
    // If no receipts, show a message
    if (receipts.length === 0) {
      receiptsList.innerHTML = '<p style="text-align: center; color: #666;">No receipts found</p>';
      return;
    }
    
    // Create and append receipt cards
    receipts.forEach(receipt => {
      const div = document.createElement('div');
      div.className = 'receipt-card';
      
      // Create date without timezone offset
      const receiptDate = new Date(receipt.date + 'T00:00:00Z');
      
      const isImage = receipt.type.startsWith('image/');
      const previewContent = isImage 
        ? `<img src="${receipt.file}" alt="Receipt preview">` 
        : '<i class="fas fa-file-pdf fa-3x"></i>';
      
      div.innerHTML = `
        <div class="receipt-header">
          <h3 class="receipt-title">${receipt.name}</h3>
          <span class="receipt-date">${receiptDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
          })}</span>
        </div>
        <div class="receipt-preview">
          ${previewContent}
        </div>
        <div class="receipt-amount">
          Total: ${currencySymbol}${parseFloat(receipt.amount).toFixed(2)}
        </div>
        <div class="receipt-actions">
          <button class="view-receipt">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="delete-receipt" data-id="${receipt.id}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      `;
      
      // Add event listeners
      div.querySelector('.view-receipt').addEventListener('click', () => {
        viewReceipt(receipt);
      });
      
      div.querySelector('.delete-receipt').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this receipt?')) {
          deleteReceipt(receipt.id);
        }
      });
      
      receiptsList.appendChild(div);
    });
  }

  receiptForm.addEventListener('submit', handleReceiptUpload);

  function showMoveDialog(item) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    document.body.appendChild(overlay);

    const dialog = document.createElement('div');
    dialog.className = 'move-item-dialog';
    
    const itemName = item.querySelector('.item-name').textContent;
    
    dialog.innerHTML = `
      <h3>Move "${itemName}" to Groceries in Stock</h3>
      <div>
        <label for="move-expiry-input">Expiration Date:</label>
        <input type="date" id="move-expiry-input" class="form-input">
        <div class="no-expiry">
          <input type="checkbox" id="move-no-expiry-checkbox">
          <label for="move-no-expiry-checkbox">No Expiry Date</label>
        </div>
      </div>
      <div class="dialog-buttons">
        <button class="cancel">Cancel</button>
        <button class="confirm">Move Item</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const expiryInput = dialog.querySelector('#move-expiry-input');
    const noExpiryCheckbox = dialog.querySelector('#move-no-expiry-checkbox');
    
    noExpiryCheckbox.addEventListener('change', function() {
      expiryInput.disabled = this.checked;
    });
    
    dialog.querySelector('.cancel').addEventListener('click', () => {
      dialog.remove();
      overlay.remove();
    });
    
    dialog.querySelector('.confirm').addEventListener('click', () => {
      const expiry = noExpiryCheckbox.checked ? '' : expiryInput.value;
      
      if (!noExpiryCheckbox.checked && !expiry) {
        alert('Please select an expiration date or check "No Expiry Date"');
        return;
      }
      
      moveItemToCurrent(item, expiry);
      dialog.remove();
      overlay.remove();
    });
  }

  function moveItemToCurrent(item, expiry) {
    const name = item.querySelector('.item-name').textContent;
    const quantity = parseInt(item.querySelector('.item-quantity').textContent);
    
    // Remove item from shopping list
    item.remove();
    
    // Get all items from storage
    let items = getItemsFromStorage();
    
    // Remove the item from its current position
    items = items.filter(item => item.name !== name);
    
    // Add the item with new status and expiry
    const newItem = {
      name,
      quantity,
      status: 'current',
      expiry: expiry || '',
      price: 0,
      isUnknownPrice: false
    };
    
    // Add to storage
    items.push(newItem);
    localStorage.setItem('items', JSON.stringify(items));
    
    // Add to DOM
    addItemToDOM(name, quantity, 'current', expiry);
    
    // Update UI
    updateTotalAmount();
    checkUI();
  }

  function initializeBudget() {
    const savedBudget = localStorage.getItem('monthlyBudget');
    
    if (savedBudget) {
      const budgetAmount = parseFloat(savedBudget);
      const currencySymbol = getCurrencySymbol(currencySelect.value);
      
      currentBudgetDisplay.textContent = `${currencySymbol}${budgetAmount.toFixed(2)}`;
      
      monthlyBudgetInput.value = budgetAmount;
      
      updateBudgetStats();
    } else {
      localStorage.setItem('monthlyBudget', '0');
      const currencySymbol = getCurrencySymbol(currencySelect.value);
      currentBudgetDisplay.textContent = `${currencySymbol}0.00`;
      monthlyBudgetInput.value = '';
    }
  }

  function formatCurrency(amount) {
    const currencySymbol = getCurrencySymbol(currencySelect.value);
    return `${currencySymbol}${amount.toFixed(2)}`;
  }

  function deleteReceipt(id) {
    let receipts = getReceipts();
    receipts = receipts.filter(receipt => receipt.id !== id);
    localStorage.setItem('receipts', JSON.stringify(receipts));
    displayReceipts();
    updateBudgetStats();
  }

  function viewReceipt(receipt) {
    const newWindow = window.open('', '_blank');
    // Create date without timezone offset
    const receiptDate = new Date(receipt.date + 'T00:00:00Z');
    
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${receipt.name} - Receipt View</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            background: #f5f5f5;
            font-family: Arial, sans-serif;
          }
          .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 100%;
            box-sizing: border-box;
          }
          .header {
            margin-bottom: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: #1a237e;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
          }
          object {
            width: 100%;
            height: 90vh;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${receipt.name}</h1>
            <p>Date: ${receiptDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'UTC'
            })}</p>
            <p>Amount: ${getCurrencySymbol(currencySelect.value)}${parseFloat(receipt.amount).toFixed(2)}</p>
          </div>
          ${receipt.type.startsWith('image/') 
            ? `<img src="${receipt.file}" alt="Receipt">`
            : `<object data="${receipt.file}" type="application/pdf" width="100%" height="90vh">
                <p>Unable to display PDF. <a href="${receipt.file}" target="_blank">Download Instead</a></p>
               </object>`
          }
        </div>
      </body>
      </html>
    `);
    newWindow.document.close();
  }

  statusInput.addEventListener('change', function() {
    const currentStatus = this.value;
    if (currentStatus === 'current') {
      document.querySelector('.date-container').style.display = 'block';
      document.querySelector('.price-container').style.display = 'none';
      priceInput.value = '';
      unknownPriceCheckbox.checked = false;
    } else {
      document.querySelector('.date-container').style.display = 'none';
      document.querySelector('.price-container').style.display = 'flex';
      expiryInput.value = '';
      noExpiryCheckbox.checked = false;
    }
  });

  document.addEventListener('click', function(e) {
    // If we're not in edit mode, return early
    if (!isEditMode) return;

    // Check if click is outside the form and edited item
    const isClickInsideForm = itemForm.contains(e.target);
    const isClickInsideEditedItem = editItem && editItem.contains(e.target);
    const isClickOnEditButton = e.target.closest('.edit-item') || e.target.closest('.fa-pen');

    // If click is outside form and edited item, and not on an edit button, cancel edit mode
    if (!isClickInsideForm && !isClickInsideEditedItem && !isClickOnEditButton) {
      // Reset edit mode
      isEditMode = false;
      
      // Remove edit-mode-item class from any edited items
      document.querySelectorAll('.edit-mode-item').forEach(item => {
        item.classList.remove('edit-mode-item');
      });
      
      // Reset form
      itemForm.reset();
      
      // Reset submit button text
      const submitButton = itemForm.querySelector('button[type="submit"]');
      submitButton.innerHTML = '<i class="fa-solid fa-plus"></i> Add Item';
      
      // Reset checkboxes and inputs
      unknownPriceCheckbox.checked = false;
      noExpiryCheckbox.checked = false;
      priceInput.disabled = false;
      expiryInput.disabled = false;
      
      // Initialize form to show/hide appropriate fields
      initializeForm();
      
      editItem = null;
    }
  });

  // Add this function at the start of init()
  function showCustomDialog(message, type = 'confirm') {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'move-item-dialog';
      
      // Add overlay
      const overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';
      
      dialog.innerHTML = `
        <h3>${message}</h3>
        <div class="dialog-buttons">
          ${type === 'confirm' ? '<button class="btn-no">No</button>' : ''}
          <button class="btn-yes">${type === 'alert' ? 'OK' : 'Yes'}</button>
        </div>
      `;
      
      // Add styles
      dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        min-width: 300px;
        max-width: 90%;
      `;

      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
      `;
      
      document.body.appendChild(overlay);
      document.body.appendChild(dialog);
      
      // Add event listeners for buttons
      if (type === 'confirm') {
        const noButton = dialog.querySelector('.btn-no');
        noButton.addEventListener('click', () => {
          dialog.remove();
          overlay.remove();
          resolve(false);
        });
        // Style No button
        noButton.style.cssText = `
          padding: 8px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin: 0 5px;
          color: white;
          background-color: #dc3545;
          transition: background-color 0.2s;
        `;
        noButton.onmouseover = () => noButton.style.backgroundColor = '#c82333';
        noButton.onmouseout = () => noButton.style.backgroundColor = '#dc3545';
      }
      
      const yesButton = dialog.querySelector('.btn-yes');
      yesButton.addEventListener('click', () => {
        dialog.remove();
        overlay.remove();
        resolve(true);
      });
      
      // Style Yes/OK button
      yesButton.style.cssText = `
        padding: 8px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin: 0 5px;
        color: white;
        background-color: #28a745;
        transition: background-color 0.2s;
      `;
      yesButton.onmouseover = () => yesButton.style.backgroundColor = '#218838';
      yesButton.onmouseout = () => yesButton.style.backgroundColor = '#28a745';

      // Style the message
      dialog.querySelector('h3').style.cssText = `
        margin: 0 0 20px 0;
        color: #333;
        font-size: 16px;
        text-align: center;
      `;

      // Style the buttons container
      dialog.querySelector('.dialog-buttons').style.cssText = `
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;
      `;
    });
  }

  // Update the removeItem function
  async function removeItem(item) {
    const confirmed = await showCustomDialog('Are you sure you want to remove this item?');
    if (confirmed) {
      const itemName = item.querySelector('.item-name').textContent;
      item.remove();
      removeItemFromStorage(itemName);
      checkUI();
      updateBudgetStats();
    }
  }

  // Update the clearSection function
  async function clearSection(listType) {
    const confirmed = await showCustomDialog(
      `Are you sure you want to clear all ${listType === 'receipts' ? 'receipts' : 'items'} from this section?`
    );
    
    if (!confirmed) return;

    let items = getItemsFromStorage();
    
    switch(listType) {
      case 'current':
        currentList.innerHTML = '';
        items = items.filter(item => item.status !== 'current' || isExpiringSoon(item.expiry));
        break;
      case 'expiring':
        expiringList.innerHTML = '';
        items = items.filter(item => !isExpiringSoon(item.expiry));
        break;
      case 'need':
        needList.innerHTML = '';
        items = items.filter(item => item.status !== 'need');
        break;
      case 'receipts':
        // Clear receipts from localStorage
        localStorage.removeItem('receipts');
        // Update the display
        displayReceipts();
        // Update budget stats
        updateBudgetStats();
        return; // Return early as we don't need to update items storage
    }

    localStorage.setItem('items', JSON.stringify(items));
    updateTotalAmount();
    checkUI();
  }

  // Update the handleReceiptUpload function's validation
  async function handleReceiptUpload(e) {
    e.preventDefault();
    
    const receiptName = document.getElementById('receipt-name').value;
    const receiptDate = document.getElementById('receipt-date').value;
    const receiptAmount = document.getElementById('receipt-amount').value;
    const receiptFile = document.getElementById('receipt-file').files[0];
    
    if (!receiptName || !receiptDate || !receiptAmount || !receiptFile) {
      await showCustomDialog('Please fill in all receipt details and upload a file', 'alert');
      return;
    }
    
    const amount = parseFloat(receiptAmount);
    if (isNaN(amount) || amount < 0) {
      await showCustomDialog('Please enter a valid amount', 'alert');
      return;
    }
    
    if (receiptFile.size > 5 * 1024 * 1024) {
      await showCustomDialog('File size must be less than 5MB', 'alert');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const receipt = {
        id: Date.now(),
        name: receiptName,
        date: receiptDate,
        amount: amount,
        file: event.target.result,
        type: receiptFile.type
      };
      
      // Save receipt to localStorage
      const receipts = getReceipts();
      receipts.push(receipt);
      localStorage.setItem('receipts', JSON.stringify(receipts));
      
      // Show the receipts list if it's hidden
      const receiptsList = document.getElementById('receipts-list');
      if (receiptsList.style.display === 'none') {
        receiptsList.style.display = 'grid';
        const showReceiptsBtn = document.getElementById('show-receipts-btn');
        if (showReceiptsBtn) {
          showReceiptsBtn.innerHTML = '<i class="fas fa-times"></i> Hide Receipts';
        }
      }
      
      // Update UI
      displayReceipts();
      updateBudgetStats();
      receiptForm.reset();
    };
    
    reader.readAsDataURL(receiptFile);
  }

  // Update the deleteReceipt function
  async function deleteReceipt(id) {
    const confirmed = await showCustomDialog('Are you sure you want to delete this receipt?');
    if (confirmed) {
      let receipts = getReceipts();
      receipts = receipts.filter(receipt => receipt.id !== id);
      localStorage.setItem('receipts', JSON.stringify(receipts));
      displayReceipts();
      updateBudgetStats();
    }
  }

  function updateBudgetDashboard() {
    const currentBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const today = new Date();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const remainingDays = lastDayOfMonth - today.getDate();
    
    // Get receipts for current month
    const receipts = getReceipts();
    const monthlySpent = receipts.reduce((total, receipt) => {
      const receiptDate = new Date(receipt.date);
      if (receiptDate.getMonth() === currentMonth && 
          receiptDate.getFullYear() === currentYear) {
        return total + (parseFloat(receipt.amount) || 0);
      }
      return total;
    }, 0);

    const remaining = currentBudget - monthlySpent;
    const spentPercentage = currentBudget > 0 ? (monthlySpent / currentBudget) * 100 : 0;
    const currencySymbol = getCurrencySymbol(currencySelect.value);

    // Update main stats
    document.getElementById('current-budget').textContent = `${currencySymbol}${currentBudget.toFixed(2)}`;
    document.getElementById('spent-amount').textContent = `${currencySymbol}${monthlySpent.toFixed(2)}`;
    document.getElementById('remaining-budget').textContent = `${currencySymbol}${remaining.toFixed(2)}`;
    
    // Update status badges
    updateBudgetStatus(spentPercentage);
    document.getElementById('days-remaining').textContent = `${remainingDays} Days`;

    // Update progress bar and percentage
    const progressBar = document.getElementById('spending-progress');
    progressBar.style.width = `${Math.min(spentPercentage, 100)}%`;
    document.getElementById('spending-percentage').textContent = `${spentPercentage.toFixed(1)}% of budget used`;

    // Calculate and update daily stats
    const daysInMonth = lastDayOfMonth;
    const daysPassed = today.getDate();
    const dailyAverage = monthlySpent / daysPassed;
    const recommendedDaily = remaining / remainingDays;

    document.getElementById('daily-average').textContent = `${currencySymbol}${dailyAverage.toFixed(2)}`;
    document.getElementById('recommended-daily').textContent = `${currencySymbol}${recommendedDaily.toFixed(2)}`;

    // Calculate monthly comparison
    const lastMonthSpent = calculateLastMonthSpending(receipts);
    const monthlyComparison = lastMonthSpent > 0 
      ? ((monthlySpent - lastMonthSpent) / lastMonthSpent * 100)
      : 0;

    const comparisonElement = document.getElementById('month-comparison');
    comparisonElement.textContent = `${monthlyComparison > 0 ? '+' : ''}${monthlyComparison.toFixed(1)}%`;
    comparisonElement.className = `stat-value ${monthlyComparison > 0 ? 'trend-up' : 'trend-down'}`;

    // Calculate and update monthly average
    const monthlyAverage = calculateMonthlyAverage(receipts);
    document.getElementById('monthly-average').textContent = `${currencySymbol}${monthlyAverage.toFixed(2)}`;
  }

  function updateBudgetStatus(spentPercentage) {
    const budgetStatus = document.getElementById('budget-status');
    const spendingRate = document.getElementById('spending-rate');
    
    // Update budget status
    if (spentPercentage >= 100) {
      budgetStatus.textContent = 'Over Budget';
      budgetStatus.style.background = '#ffebee';
      budgetStatus.style.color = '#c62828';
    } else if (spentPercentage >= 90) {
      budgetStatus.textContent = 'Critical';
      budgetStatus.style.background = '#fff3e0';
      budgetStatus.style.color = '#e65100';
    } else if (spentPercentage >= 75) {
      budgetStatus.textContent = 'Warning';
      budgetStatus.style.background = '#fff8e1';
      budgetStatus.style.color = '#f57f17';
    } else {
      budgetStatus.textContent = 'On Track';
      budgetStatus.style.background = '#e8f5e9';
      budgetStatus.style.color = '#2e7d32';
    }

    // Update spending rate
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysPassed = new Date().getDate();
    const expectedPercentage = (daysPassed / daysInMonth) * 100;

    if (spentPercentage > expectedPercentage + 20) {
      spendingRate.textContent = 'High';
      spendingRate.style.background = '#ffebee';
      spendingRate.style.color = '#c62828';
    } else if (spentPercentage < expectedPercentage - 20) {
      spendingRate.textContent = 'Low';
      spendingRate.style.background = '#e8f5e9';
      spendingRate.style.color = '#2e7d32';
    } else {
      spendingRate.textContent = 'Normal';
      spendingRate.style.background = '#e3f2fd';
      spendingRate.style.color = '#1565c0';
    }
  }

  function calculateLastMonthSpending(receipts) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    return receipts.reduce((total, receipt) => {
      const receiptDate = new Date(receipt.date);
      if (receiptDate.getMonth() === lastMonth.getMonth() && 
          receiptDate.getFullYear() === lastMonth.getFullYear()) {
        return total + (parseFloat(receipt.amount) || 0);
      }
      return total;
    }, 0);
  }

  function calculateMonthlyAverage(receipts) {
    if (receipts.length === 0) return 0;
    
    const months = new Set();
    let totalAmount = 0;
    
    receipts.forEach(receipt => {
      const date = new Date(receipt.date);
      months.add(`${date.getFullYear()}-${date.getMonth()}`);
      totalAmount += parseFloat(receipt.amount) || 0;
    });
    
    return totalAmount / Math.max(months.size, 1);
  }
}