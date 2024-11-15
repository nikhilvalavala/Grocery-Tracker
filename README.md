# Grocery Tracker

A web-based application to help users manage their groceries by tracking currently available items, items that are expiring soon, and items that need to be purchased.

## Features

### 1. Item Management
- Add new grocery items with details:
  - Item name (automatically capitalizes first letter of each word)
  - Quantity
  - Status (Currently Available/Need to Buy)
  - Expiration date (for currently available items)
  - Price (for items that need to be bought)

### 2. Item Categories
- **Currently Available**: Shows all items currently in stock
- **Expiring Soon**: Automatically displays items expiring within 3 days
- **Need to Buy**: Lists items that need to be purchased with price calculations

### 3. Item Actions
- Edit existing items
- Remove items
- Clear entire sections using the trash icon
- Visual indication for items being edited
- Special highlighting for items expiring soon

### 4. Additional Features
- Filter items across all categories
- Automatic calculation of total amount to spend
- Responsive design for mobile devices
- Form validation for required fields
- Duplicate item prevention

## Usage

### Adding Items
1. Enter item name
2. Specify quantity
3. Select status (Currently Available/Need to Buy)
4. For currently available items: Add expiration date
5. For items to buy: Add price per item
6. Click "Add Item" button

### Editing Items
1. Click the edit icon on any item
2. Modify the details in the form
3. Click "Update Item" to save changes
4. Click outside the form to cancel editing

### Filtering Items
- Use the filter input to search across all items
- Filter works on item names in real-time

### Clearing Items
- Use the trash icon in each section header to clear that section
- Confirmation will be requested before deletion

## Technical Details

### Built With
- HTML5
- CSS3
- JavaScript (Vanilla)
- Font Awesome for icons
- Google Fonts (Poppins)

### Browser Storage
- Uses localStorage for data persistence
- Items remain saved even after browser refresh

### Responsive Design
- Adapts to different screen sizes
- Optimized for mobile devices

## Installation

1. Clone the repository
2. Open index.html in a web browser
3. No additional installation or dependencies required

