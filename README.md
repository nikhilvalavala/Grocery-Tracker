# Smart Grocery Manager

A comprehensive web application for managing groceries, tracking expenses, and organizing receipts with cloud synchronization.

## Features

### 1. Item Management
- Add and manage grocery items with detailed information:
  - Item name (auto-capitalizes)
  - Quantity
  - Status (In Stock/Shopping List)
  - Expiration date (optional, with "N/A" option)
  - Price (optional, with "Unknown" option)
  - Multiple currency support

### 2. Smart Organization
- **Groceries in Stock**:
  - Separate sections for items with and without expiry dates
  - Automatic expiry tracking
- **Items Near Expiry/Expired**:
  - Automatic categorization of items nearing expiration
  - Visual alerts for expired items
- **Shopping List**:
  - Price tracking and total calculation
  - Support for items with unknown prices

### 3. Budget Management
- Set and track monthly budgets
- Real-time budget statistics:
  - Monthly budget overview
  - Current expenditure
  - Remaining budget
  - Daily spending averages
  - Monthly trends
- Budget status indicators
- Spending rate analysis

### 4. Receipt Management
- Upload and store receipts:
  - Support for images and PDF files
  - Receipt description
  - Date tracking
  - Amount tracking
- View/hide receipts functionality
- Receipt gallery with preview
- Delete individual receipts

### 5. Cloud Integration
- Google authentication
- Cross-device synchronization
- Offline functionality
- Automatic data backup
- Real-time updates

### 6. User Interface
- Clean, modern design
- Dark mode support
- Responsive layout for all devices
- Animated transitions
- Interactive feedback
- Unified clear functionality
- Advanced filtering and sorting

### 7. Data Management
- Multi-currency support
- Real-time calculations
- Data persistence
- Automatic synchronization
- Conflict resolution

## Technical Features

### Built With
- HTML5
- CSS3
- Vanilla JavaScript
- Firebase Authentication
- Cloud Firestore
- Font Awesome icons
- Google Fonts

### Security
- Secure authentication
- Data encryption
- Protected user data
- Automatic session management

### Performance
- Optimized loading
- Efficient data handling
- Smooth animations
- Responsive design
- Offline capability

## Installation

1. Clone the repository
2. Configure Firebase:
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Update firebase-config.js with your credentials
3. Open index.html in a web browser

## Usage

### Getting Started
1. Sign in with Google account
2. Set your preferred currency
3. Define monthly budget

### Managing Items
1. Add items with the input form
2. Use checkboxes for optional fields
3. Edit items by clicking the edit icon
4. Move items between lists as needed

### Receipt Management
1. Upload receipts with description and date
2. View receipts in the gallery
3. Delete receipts as needed

### Data Management
1. Use the unified clear button for removing items
2. Filter and sort items as needed
3. Track budget statistics
4. Monitor spending trends

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Contributing
Contributions are welcome. Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License
This project is licensed under the MIT License.

