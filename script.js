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

  let isEditMode = false;
  let editItem = null;

  // Initially set up form based on default status
  function initializeForm() {
      const currentStatus = statusInput.value;
      if (currentStatus === 'current') {
          document.querySelector('.date-container').style.display = 'block';
          document.querySelector('.price-container').style.display = 'none';
          priceInput.value = '';
          unknownPriceCheckbox.checked = false;
      } else {
          document.querySelector('.date-container').style.display = 'none';
          document.querySelector('.price-container').style.display = 'flex';
          expiryInput.value = '';
      }
  }

  // Call initializeForm right after variable declarations
  initializeForm();

  // Add status change event listener
  statusInput.addEventListener('change', function() {
      const isCurrentStatus = this.value === 'current';
      document.querySelector('.date-container').style.display = isCurrentStatus ? 'block' : 'none';
      document.querySelector('.price-container').style.display = isCurrentStatus ? 'none' : 'flex';
      
      // Clear the irrelevant inputs
      if (isCurrentStatus) {
          priceInput.value = '';
          unknownPriceCheckbox.checked = false;
      } else {
          expiryInput.value = '';
          noExpiryCheckbox.checked = false;
      }
  });

  displayItems();

  // Add click event listener to document to handle clicking outside
  document.addEventListener('click', function(e) {
      if (!itemForm.contains(e.target) && !e.target.closest('.edit-item') && isEditMode) {
          cancelEdit();
      }
  });

  // Add cancel edit function
  function cancelEdit() {
      isEditMode = false;
      editItem.classList.remove('edit-mode-item');
      editItem = null;
      itemForm.reset();
      itemForm.querySelector('button').innerHTML = '<i class="fa-solid fa-plus"></i> Add Item';
      initializeForm(); // Reset form inputs visibility
  }

  // Update the form submit handler
  itemForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (itemInput.value === '' || quantityInput.value === '') {
          alert('Please enter item name and quantity.');
          return;
      }

      const itemName = itemInput.value.trim();
      const itemQuantity = parseInt(quantityInput.value);
      const itemStatus = statusInput.value;
      const noExpiry = noExpiryCheckbox.checked;
      const itemExpiry = (itemStatus === 'current' && !noExpiry) ? expiryInput.value : '';
      const isUnknownPrice = itemStatus === 'need' && unknownPriceCheckbox.checked;
      const itemPrice = isUnknownPrice ? 0 : parseFloat(priceInput.value) || 0;

      // Validate expiry date for items that need it
      if (itemStatus === 'current' && !noExpiry && !itemExpiry) {
          alert('Please enter an expiration date or check "Expiry N/A".');
          return;
      }

      // Validate price for need to buy items
      if (itemStatus === 'need' && !isUnknownPrice && !itemPrice) {
          alert('Please enter a valid price or check "Price Unknown".');
          return;
      }

      // Check for duplicates based on status
      if (!isEditMode && isDuplicateItem(itemName, itemStatus)) {
          alert('This item already exists in Currently Available Groceries. Please update the existing item or add a different item.');
          return;
      }

      if (isEditMode) {
          if (editItem) {
              editItemInDOM(itemName, itemQuantity, itemStatus, itemExpiry, itemPrice);
              updateLocalStorage(itemName, itemQuantity, itemStatus, itemExpiry, itemPrice);
              editItem.classList.remove('edit-mode-item');
          }
          isEditMode = false;
          editItem = null;
      } else {
          addItemToDOM(itemName, itemQuantity, itemStatus, itemExpiry, itemPrice);
          addItemToLocalStorage(itemName, itemQuantity, itemStatus, itemExpiry, itemPrice);
      }

      // Reset form
      itemForm.reset();
      itemForm.querySelector('button').innerHTML = '<i class="fa-solid fa-plus"></i> Add Item';
      initializeForm();
      checkUI();
  });

  // Update editMode function
  function editMode(item) {
      // Remove edit-mode-item class from any previously edited item
      document.querySelectorAll('.edit-mode-item').forEach(item => {
          item.classList.remove('edit-mode-item');
      });

      isEditMode = true;
      editItem = item;
      editItem.classList.add('edit-mode-item');

      itemInput.value = item.querySelector('.item-name').textContent;
      quantityInput.value = parseInt(item.querySelector('.item-quantity').textContent.split(' ')[0]);
      
      const isCurrentItem = item.closest('.items').id === 'current-list' || item.closest('.items').id === 'expiring-list';
      statusInput.value = isCurrentItem ? 'current' : 'need';
      
      if (isCurrentItem) {
          document.querySelector('.date-container').style.display = 'block';
          document.querySelector('.price-container').style.display = 'none';
          
          const expiryText = item.querySelector('.item-expiry')?.textContent;
          if (expiryText) {
              if (expiryText.includes('N/A')) {
                  noExpiryCheckbox.checked = true;
                  expiryInput.value = '';
                  expiryInput.disabled = true;
              } else {
                  noExpiryCheckbox.checked = false;
                  expiryInput.disabled = false;
                  const expiryDate = expiryText.split('Expires: ')[1];
                  if (expiryDate) {
                      const formattedDate = new Date(expiryDate).toISOString().split('T')[0];
                      expiryInput.value = formattedDate;
                  }
              }
          }
      } else {
          document.querySelector('.date-container').style.display = 'none';
          document.querySelector('.price-container').style.display = 'flex';
          const priceText = item.querySelector('.item-price')?.textContent;
          if (priceText) {
              if (priceText.includes('Unknown')) {
                  unknownPriceCheckbox.checked = true;
                  priceInput.disabled = true;
                  priceInput.value = '';
              } else {
                  unknownPriceCheckbox.checked = false;
                  priceInput.disabled = false;
                  const price = priceText.split('$')[1].split(' ')[0];
                  priceInput.value = price;
              }
          }
      }
      
      itemForm.querySelector('button').innerHTML = '<i class="fa-solid fa-pen"></i> Update Item';
  }

  // Update price input to prevent negative values
  priceInput.addEventListener('input', function() {
      if (this.value < 0) {
          this.value = 0;
      }
  });

  // Update the event listeners for all sections
  function addEventListenersToSection(section) {
      section.addEventListener('click', function(e) {
          const target = e.target;
          const listItem = target.closest('li');
          
          // Check if clicked element or its parent is the edit or remove button
          if (target.closest('.remove-item')) {
              removeItem(listItem);
          } else if (target.closest('.edit-item')) {
              editMode(listItem);
          }
      });
  }

  // Add event listeners to all sections
  addEventListenersToSection(currentList);
  addEventListenersToSection(needList);
  addEventListenersToSection(expiringList);

  filterInput.addEventListener('input', function (e) {
    const filterText = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.items li');

    items.forEach((item) => {
      const name = item.querySelector('.item-name').textContent.toLowerCase();
      if (name.includes(filterText)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  });

  function displayItems() {
    // Clear existing items first
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
    
    // Capitalize each word in the item name
    const capitalizedName = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    let expiryDisplay = '';
    if (status === 'current') {
        if (expiry) {
            const expiryDate = new Date(expiry);
            expiryDisplay = `<span class="item-expiry ${isExpiringSoon(expiry) ? 'expiring' : ''}">
                Expires: ${expiryDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
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
  }

  function addItemToLocalStorage(name, quantity, status, expiry = '', price = 0) {
    const items = getItemsFromStorage();
    const capitalizedName = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    // Don't redeclare expiry and price here - use the parameters
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
    editItem.remove();
    addItemToDOM(name, quantity, status, expiry, price);
  }

  function updateLocalStorage(name, quantity, status, expiry = '', price = 0) {
    let items = getItemsFromStorage();
    // Don't redeclare expiry and price
    
    items = items.map((item) => {
        if (item.name === editItem.querySelector('.item-name').textContent) {
            return { name, quantity, status, expiry, price };
        }
        return item;
    });
    
    localStorage.setItem('items', JSON.stringify(items));
    updateTotalAmount();
  }

  function removeItem(item) {
    if (confirm('Are you sure you want to remove this item?')) {
      const itemName = item.querySelector('.item-name').textContent;
      item.remove();
      removeItemFromStorage(itemName);
      checkUI();
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
        // For "Need to Buy" items, don't check for duplicates
        return false;
    } else {
        // For "Currently Available" items, check only among current and expiring items
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
    today.setHours(0, 0, 0, 0); // Reset time part for accurate day comparison
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  }

  function updateTotalAmount() {
    const items = getItemsFromStorage();
    const total = items
        .filter(item => item.status === 'need' && item.price > 0) // Only sum items with known prices
        .reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
    const currencySymbol = getCurrencySymbol(currencySelect.value);
    const unknownPriceItems = items.filter(item => item.status === 'need' && item.price === 0).length;
    
    let totalText = `Total Amount to Spend: ${currencySymbol}${total.toFixed(2)}`;
    if (unknownPriceItems > 0) {
        totalText += ` (${unknownPriceItems} item${unknownPriceItems > 1 ? 's' : ''} with unknown price)`;
    }
    totalAmount.textContent = totalText;
  }

  // Check for expiring items periodically
  setInterval(() => {
    const items = getItemsFromStorage();
    items.forEach(item => {
      if (item.status === 'current' && isExpiringSoon(item.expiry)) {
        alert(`${item.name} is expiring soon! Expiry date: ${item.expiry}`);
      }
    });
  }, 86400000); // Check once per day

  // Add a function to check and move items to expiring list
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

  // Add periodic check for expiring items (every hour)
  setInterval(checkAndMoveExpiringItems, 3600000);

  // Add event listeners for clear section buttons
  document.querySelectorAll('.btn-clear-section').forEach(button => {
      button.addEventListener('click', function() {
          const listType = this.dataset.list;
          clearSection(listType);
      });
  });

  function clearSection(listType) {
      if (!confirm(`Are you sure you want to clear all items from this section?`)) return;

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
      }

      localStorage.setItem('items', JSON.stringify(items));
      updateTotalAmount();
      checkUI();
  }

  // Add event listener for expiringList
  expiringList.addEventListener('click', function (e) {
      if (e.target.classList.contains('remove-item')) {
          removeItem(e.target.closest('li'));
      } else if (e.target.classList.contains('edit-item')) {
          editMode(e.target.closest('li'));
      }
  });

  // Update the currency change event listener
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
  });

  // Update the init function to set initial currency display
  function init() {
      // ... existing variable declarations ...

      // Set initial currency from localStorage or default to USD
      const savedCurrency = localStorage.getItem('selectedCurrency');
      if (savedCurrency) {
          currencySelect.value = savedCurrency;
      } else {
          localStorage.setItem('selectedCurrency', 'USD');
      }

      // Update total amount display with correct currency symbol immediately
      const currencySymbol = getCurrencySymbol(currencySelect.value);
      totalAmount.textContent = `Total Amount to Spend: ${currencySymbol}0.00`;

      // ... rest of init function ...
  }

  // Add this function to get currency symbol
  function getCurrencySymbol(currency) {
      const symbols = {
          'USD': '$',
          'EUR': '€',
          'GBP': '£',
          'INR': '₹',
          'JPY': '¥',
          'AUD': 'A$',
          'CAD': 'C$'
      };
      return symbols[currency] || '$';
  }

  // Add checkbox event listener
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

  // Add event listener for no expiry checkbox
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

  // Update the checkbox label in the HTML
  document.querySelector('label[for="unknown-price-checkbox"]').textContent = 'Price Unknown';

  // Add these functions inside init()
  function handleReceiptUpload(e) {
    e.preventDefault();
    
    const receiptName = document.getElementById('receipt-name').value;
    const receiptDate = document.getElementById('receipt-date').value;
    const receiptAmount = document.getElementById('receipt-amount').value;
    const receiptFile = document.getElementById('receipt-file').files[0];
    
    if (!receiptName || !receiptDate || !receiptFile) {
        alert('Please fill in the receipt description, date, and upload a file');
        return;
    }
    
    // Validate amount
    const amount = receiptAmount ? parseFloat(receiptAmount) : 0;
    if (isNaN(amount) || amount < 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    // Check file size (max 5MB)
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
        
        saveReceipt(receipt);
        displayReceipts();
        receiptForm.reset();
    };
    
    reader.readAsDataURL(receiptFile);
  }

  function saveReceipt(receipt) {
    const receipts = getReceipts();
    receipts.push(receipt);
    localStorage.setItem('receipts', JSON.stringify(receipts));
  }

  function getReceipts() {
    return JSON.parse(localStorage.getItem('receipts')) || [];
  }

  function displayReceipts() {
    receiptsList.innerHTML = '';
    const receipts = getReceipts();
    const currencySymbol = getCurrencySymbol(currencySelect.value);
    
    receipts.forEach(receipt => {
        const div = document.createElement('div');
        div.className = 'receipt-card';
        
        const isImage = receipt.type.startsWith('image/');
        const previewContent = isImage 
            ? `<img src="${receipt.file}" alt="Receipt preview">` 
            : '<i class="fas fa-file-pdf fa-3x"></i>';
        
        const amount = receipt.amount ? parseFloat(receipt.amount) : 0;
        
        div.innerHTML = `
            <div class="receipt-header">
                <h3 class="receipt-title">${receipt.name}</h3>
                <span class="receipt-date">${new Date(receipt.date).toLocaleDateString()}</span>
            </div>
            <div class="receipt-preview">
                ${previewContent}
            </div>
            <div class="receipt-amount">
                Total: ${currencySymbol}${amount.toFixed(2)}
            </div>
            <div class="receipt-actions">
                <button class="view-receipt">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="delete-receipt">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        // Add event listeners
        div.querySelector('.view-receipt').addEventListener('click', () => {
            const receiptData = receipt.file;
            const newWindow = window.open('', '_blank');
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
                        @media print {
                            body {
                                padding: 0;
                                background: white;
                            }
                            .container {
                                box-shadow: none;
                                padding: 0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>${receipt.name}</h1>
                            <p>Date: ${new Date(receipt.date).toLocaleDateString()}</p>
                        </div>
                        ${isImage 
                            ? `<img src="${receiptData}" alt="Receipt">`
                            : `<object data="${receiptData}" type="application/pdf" width="100%" height="90vh">
                                <p>Unable to display PDF. <a href="${receiptData}" target="_blank">Download Instead</a></p>
                               </object>`
                        }
                    </div>
                </body>
                </html>
            `);
            newWindow.document.close();
        });
        
        div.querySelector('.delete-receipt').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this receipt?')) {
                const receipts = getReceipts().filter(r => r.id !== receipt.id);
                localStorage.setItem('receipts', JSON.stringify(receipts));
                displayReceipts();
            }
        });
        
        receiptsList.appendChild(div);
    });
  }

  // Update the receipt form event listener
  receiptForm.addEventListener('submit', handleReceiptUpload);

  // Initialize receipts display
  displayReceipts();

  // Add event listener for the clear receipts button
  document.querySelector('[data-list="receipts"]').addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all receipts?')) {
          localStorage.removeItem('receipts');
          displayReceipts();
      }
  });

  // Add these to your init() function after other const declarations
  const showReceiptsBtn = document.getElementById('show-receipts-btn');
  const receiptsSection = document.getElementById('receipts-list');

  // Add this event listener after other event listeners
  showReceiptsBtn.addEventListener('click', function() {
      const isHidden = receiptsSection.style.display === 'none';
      receiptsSection.style.display = isHidden ? 'grid' : 'none';
      this.innerHTML = isHidden 
          ? '<i class="fas fa-times"></i> Hide Receipts'
          : '<i class="fas fa-receipt"></i> Show Receipts';
  });

  // Add this function to initialize the receipts section
  function initializeReceiptsSection() {
      // Hide receipts list by default
      receiptsList.style.display = 'none';
      
      // Set initial button text
      const showReceiptsBtn = document.getElementById('show-receipts-btn');
      showReceiptsBtn.innerHTML = '<i class="fas fa-receipt"></i> Show Receipts';
      
      // Add click event listener
      showReceiptsBtn.addEventListener('click', function() {
          const isHidden = receiptsList.style.display === 'none';
          receiptsList.style.display = isHidden ? 'grid' : 'none';
          this.innerHTML = isHidden 
              ? '<i class="fas fa-times"></i> Hide Receipts'
              : '<i class="fas fa-receipt"></i> Show Receipts';
      });
  }

  // Call this in your init function
  function init() {
      // ... existing init code ...

      // Initialize receipts section
      initializeReceiptsSection();
      
      // ... rest of init code ...
  }
}