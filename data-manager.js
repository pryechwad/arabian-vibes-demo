// Data Manager for ITT Application
class DataManager {
  constructor() {
    this.storageKey = 'itt_customer_data';
  }

  // Save customer data with PDF (prevent duplicates)
  saveCustomerData(customerName, packageTitle, pdfData = null) {
    const existingData = this.getAllCustomers();
    const pageDetails = this.extractPageDetails();
    
    // Check for existing customer with same name and package
    const existingCustomer = existingData.find(customer => 
      customer.customerName === customerName && customer.packageTitle === packageTitle
    );
    
    if (existingCustomer) {
      // Update existing customer instead of creating duplicate
      existingCustomer.pdfData = pdfData;
      existingCustomer.packageDetails = pageDetails.packageDetails;
      existingCustomer.hotelDetails = pageDetails.hotelDetails;
      existingCustomer.updatedAt = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(existingData));
      return existingCustomer.id;
    }
    
    const newEntry = {
      id: Date.now(),
      customerName: customerName,
      packageTitle: packageTitle,
      pdfData: pdfData,
      packageDetails: pageDetails.packageDetails,
      hotelDetails: pageDetails.hotelDetails,
      createdAt: new Date().toISOString(),
      status: 'Active'
    };
    
    existingData.push(newEntry);
    localStorage.setItem(this.storageKey, JSON.stringify(existingData));
    return newEntry.id;
  }

  // Get all customers
  getAllCustomers() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Delete customer
  deleteCustomer(id) {
    const data = this.getAllCustomers();
    const filtered = data.filter(item => item.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  // Update customer data
  updateCustomer(id, customerName, packageTitle) {
    const data = this.getAllCustomers();
    const customerIndex = data.findIndex(item => item.id === id);
    if (customerIndex !== -1) {
      data[customerIndex].customerName = customerName;
      data[customerIndex].packageTitle = packageTitle;
      data[customerIndex].updatedAt = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    }
    return false;
  }

  // Generate PDF from current page
  generatePDF() {
    return new Promise((resolve) => {
      // Simple PDF generation using print functionality
      const printContent = document.documentElement.outerHTML;
      resolve(printContent);
    });
  }

  // Extract package and hotel details from page
  extractPageDetails() {
    const packageDetails = {
      price: this.extractTextContent('.price, [class*="price"], [id*="price"]'),
      duration: this.extractTextContent('.duration, [class*="duration"], [id*="duration"]'),
      location: this.extractTextContent('.location, [class*="location"], [id*="location"]'),
      description: this.extractTextContent('.description, [class*="description"], [id*="description"]')
    };
    
    const hotelDetails = {
      hotelName: this.extractTextContent('.hotel-name, [class*="hotel"], [id*="hotel"]'),
      hotelRating: this.extractTextContent('.rating, [class*="rating"], [id*="rating"]'),
      hotelLocation: this.extractTextContent('.hotel-location, [class*="hotel-location"]'),
      amenities: this.extractTextContent('.amenities, [class*="amenities"], [id*="amenities"]')
    };
    
    return { packageDetails, hotelDetails };
  }

  extractTextContent(selector) {
    const element = document.querySelector(selector);
    return element ? element.innerText.trim() : 'N/A';
  }
}

// Initialize data manager
const dataManager = new DataManager();

// Auto-save function
function autoSaveData() {
  const customerName = document.getElementById("customerName")?.innerText?.trim();
  const packageTitle = document.getElementById("packageTitle")?.innerText?.trim();
  
  if (customerName && customerName !== "Enter Customer Name" && packageTitle) {
    dataManager.generatePDF().then(pdfData => {
      const id = dataManager.saveCustomerData(customerName, packageTitle, pdfData);
      console.log(`Data saved with ID: ${id}`);
      
      // Show save notification
      showNotification("✅ Data saved successfully!");
    });
  }
}

// Load customer data for editing
function loadCustomerForEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('editCustomer');
  
  if (customerId) {
    const customers = dataManager.getAllCustomers();
    const customer = customers.find(c => c.id == customerId);
    
    if (customer) {
      // Load customer data into form
      document.getElementById("customerName").innerText = customer.customerName;
      document.getElementById("packageTitle").innerText = customer.packageTitle;
      
      // Show edit mode notification
      showNotification("📝 Editing mode: " + customer.customerName);
      
      // Add update button
      addUpdateButton(customerId);
    }
  }
}

// Add update button for edit mode
function addUpdateButton(customerId) {
  const updateBtn = document.createElement('button');
  updateBtn.innerHTML = '✅ Update Customer';
  updateBtn.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: #4CAF50;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  `;
  
  updateBtn.addEventListener('click', () => updateCustomerData(customerId));
  document.body.appendChild(updateBtn);
}

// Update customer data
function updateCustomerData(customerId) {
  const customerName = document.getElementById("customerName")?.innerText?.trim();
  const packageTitle = document.getElementById("packageTitle")?.innerText?.trim();
  
  if (customerName && customerName !== "Enter Customer Name" && packageTitle) {
    dataManager.generatePDF().then(pdfData => {
      const customers = dataManager.getAllCustomers();
      const customerIndex = customers.findIndex(c => c.id == customerId);
      
      if (customerIndex !== -1) {
        const pageDetails = dataManager.extractPageDetails();
        customers[customerIndex].customerName = customerName;
        customers[customerIndex].packageTitle = packageTitle;
        customers[customerIndex].pdfData = pdfData;
        customers[customerIndex].packageDetails = pageDetails.packageDetails;
        customers[customerIndex].hotelDetails = pageDetails.hotelDetails;
        customers[customerIndex].updatedAt = new Date().toISOString();
        
        localStorage.setItem('itt_customer_data', JSON.stringify(customers));
        
        showNotification("✅ Customer updated successfully!");
        
        // Redirect back to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 2000);
      }
    });
  } else {
    alert('Please fill customer name and package title');
  }
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 3000);
}

// Add save button to page
function addSaveButton() {
  const saveBtn = document.createElement('button');
  saveBtn.innerHTML = '💾 Save Data';
  saveBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #2196F3;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  `;
  
  saveBtn.addEventListener('click', autoSaveData);
  document.body.appendChild(saveBtn);
}

// Add dashboard button
function addDashboardButton() {
  const dashBtn = document.createElement('button');
  dashBtn.innerHTML = '📊 Dashboard';
  dashBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 140px;
    background: #FF9800;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  `;
  
  dashBtn.addEventListener('click', () => {
    window.open('dashboard.html', '_blank');
  });
  document.body.appendChild(dashBtn);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  addSaveButton();
  addDashboardButton();
  
  // Load customer data if in edit mode
  loadCustomerForEdit();
  
  // Auto-save when customer name or package title changes
  const customerName = document.getElementById("customerName");
  const packageTitle = document.getElementById("packageTitle");
  
  if (customerName) {
    customerName.addEventListener('blur', autoSaveData);
  }
  
  if (packageTitle) {
    packageTitle.addEventListener('blur', autoSaveData);
  }
});