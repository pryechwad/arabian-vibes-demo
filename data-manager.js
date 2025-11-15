// Data Manager for ITT Application
class DataManager {
  constructor() {
    this.storageKey = 'itt_customer_data';
  }

  // Save customer data with PDF (prevent duplicates)
  saveCustomerData(customerName, packageTitle, pdfData = null) {
    try {
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
        console.log('Customer data updated:', existingCustomer.id);
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
      console.log('New customer data saved:', newEntry.id);
      return newEntry.id;
    } catch (error) {
      console.error('Error saving customer data:', error);
      throw error;
    }
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
    return new Promise((resolve, reject) => {
      try {
        // Get the printable content
        const printableElement = document.getElementById('printable');
        if (!printableElement) {
          reject(new Error('Printable element not found'));
          return;
        }
        
        // Simple PDF generation using page content
        const printContent = printableElement.outerHTML;
        resolve(printContent);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Extract package and hotel details from page
  extractPageDetails() {
    // Extract price from the specific structure in ITT page
    let price = 'N/A';
    const priceElement = document.querySelector('div[style*="font-size:15px"] span[contenteditable="true"][style*="color:#ff5b04"]');
    if (priceElement) {
      price = '₹ ' + priceElement.textContent.trim() + ' per person';
    }
    
    // Extract duration from the specific structure in ITT page
    let duration = 'N/A';
    const durationElement = document.querySelector('div[style*="font-size:14px"] span[contenteditable="true"]');
    if (durationElement && durationElement.textContent.includes('Days')) {
      duration = durationElement.textContent.trim();
    }
    
    // Extract destination from title
    let location = 'N/A';
    const destElement = document.getElementById('destTitle');
    if (destElement) {
      location = destElement.textContent.trim();
    }
    
    // Extract description from overview section
    let description = 'N/A';
    const descElement = document.querySelector('div[style*="background:#e9f7fa"] p[contenteditable="true"]');
    if (descElement) {
      description = descElement.textContent.trim().substring(0, 100) + '...';
    }
    
    const packageDetails = {
      price: price,
      duration: duration,
      location: location,
      description: description
    };
    
    // Extract hotel details from the hotel section
    let hotelName = 'N/A';
    const hotelNameElement = document.querySelector('div[style*="flex:1; min-width:300px"] h2[contenteditable="true"]');
    if (hotelNameElement) {
      hotelName = hotelNameElement.textContent.trim();
    }
    
    let hotelRating = 'N/A';
    const categoryElement = document.querySelector('div[style*="display:flex; margin-bottom:3px"] span[contenteditable="true"]');
    if (categoryElement) {
      hotelRating = categoryElement.textContent.trim();
    }
    
    const hotelDetails = {
      hotelName: hotelName,
      hotelRating: hotelRating,
      hotelLocation: location, // Use same location as package
      amenities: 'Standard amenities included'
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
  try {
    const customerName = document.getElementById("customerName")?.innerText?.trim();
    const packageTitle = document.getElementById("destTitle")?.innerText?.trim() || "Dubai Package";
    
    console.log('Attempting to save data:', { customerName, packageTitle });
    
    if (customerName && customerName !== "Enter Travel Partner" && customerName !== "Enter Customer Name") {
      dataManager.generatePDF().then(pdfData => {
        const id = dataManager.saveCustomerData(customerName, packageTitle, pdfData);
        console.log(`Data saved with ID: ${id}`);
        
        // Show save notification
        showNotification("✅ Data saved successfully!");
      }).catch(error => {
        console.error('Error in auto-save:', error);
        showNotification("❌ Error saving data: " + error.message);
      });
    } else {
      showNotification("⚠️ Please enter travel partner name first");
    }
  } catch (error) {
    console.error('Auto-save error:', error);
    showNotification("❌ Auto-save failed: " + error.message);
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
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.data-notification');
  existingNotifications.forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = 'data-notification';
  
  // Set color based on message type
  let bgColor = '#4CAF50'; // success
  if (message.includes('❌') || message.includes('Error') || message.includes('failed')) {
    bgColor = '#f44336'; // error
  } else if (message.includes('⚠️') || message.includes('Warning')) {
    bgColor = '#ff9800'; // warning
  }
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    max-width: 300px;
    word-wrap: break-word;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 4000);
}

// Add save button to page
function addSaveButton() {
  const saveBtn = document.createElement('button');
  saveBtn.innerHTML = '💾 Save Data';
  saveBtn.id = 'floatingSaveBtn';
  const isMobile = window.innerWidth <= 768;
  saveBtn.style.cssText = `
    position: ${isMobile ? 'relative' : 'fixed'};
    bottom: ${isMobile ? 'auto' : '20px'};
    right: ${isMobile ? 'auto' : '20px'};
    background: linear-gradient(135deg, #075056 0%, #0a6b72 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    z-index: 1000;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    font-weight: 600;
    transition: all 0.3s ease;
    min-width: 120px;
    width: ${isMobile ? '100%' : 'auto'};
    margin: ${isMobile ? '10px 0' : '0'};
  `;
  
  saveBtn.addEventListener('click', () => {
    saveBtn.style.background = 'linear-gradient(135deg, #064449 0%, #085e65 100%)';
    autoSaveData();
    setTimeout(() => {
      saveBtn.style.background = 'linear-gradient(135deg, #075056 0%, #0a6b72 100%)';
    }, 1000);
  });
  
  saveBtn.addEventListener('mouseenter', () => {
    saveBtn.style.transform = 'translateY(-2px) scale(1.05)';
  });
  
  saveBtn.addEventListener('mouseleave', () => {
    saveBtn.style.transform = 'translateY(0) scale(1)';
  });
  
  document.body.appendChild(saveBtn);
  console.log('Save button added');
}

// Add dashboard button
function addDashboardButton() {
  const dashBtn = document.createElement('button');
  dashBtn.innerHTML = '📊 Dashboard';
  const isMobile = window.innerWidth <= 768;
  dashBtn.style.cssText = `
    position: ${isMobile ? 'relative' : 'fixed'};
    bottom: ${isMobile ? 'auto' : '20px'};
    right: ${isMobile ? 'auto' : '160px'};
    background: linear-gradient(135deg, #075056 0%, #0a6b72 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    z-index: 1000;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    font-weight: 600;
    transition: all 0.3s ease;
    min-width: 120px;
    width: ${isMobile ? '100%' : 'auto'};
    margin: ${isMobile ? '10px 0' : '0'};
  `;
  
  dashBtn.addEventListener('mouseenter', () => {
    dashBtn.style.transform = 'translateY(-2px) scale(1.05)';
  });
  
  dashBtn.addEventListener('mouseleave', () => {
    dashBtn.style.transform = 'translateY(0) scale(1)';
  });
  
  dashBtn.addEventListener('click', () => {
    window.open('dashboard.html', '_blank');
  });
  document.body.appendChild(dashBtn);
  console.log('Dashboard button added');
}

// Function to update dashboard section display
function updateDashboardSection() {
  // This function can be used to update any dashboard-related UI elements
  console.log('Dashboard section updated');
}

// Function to refresh all existing customer data with new extraction logic
function refreshExistingData() {
  try {
    const customers = dataManager.getAllCustomers();
    let updatedCount = 0;
    
    customers.forEach(customer => {
      // Only update if package details are missing or show N/A
      if (!customer.packageDetails || 
          customer.packageDetails.price === 'N/A' || 
          customer.packageDetails.duration === 'N/A') {
        
        // Try to extract details from stored PDF data if available
        if (customer.pdfData) {
          // Create a temporary element to parse the PDF data
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = customer.pdfData;
          
          // Extract price and duration from the PDF content
          const priceSpan = tempDiv.querySelector('span[style*="color:#ff5b04"]');
          const durationSpan = tempDiv.querySelector('div[style*="font-size:14px"] span');
          
          if (priceSpan || durationSpan) {
            customer.packageDetails = customer.packageDetails || {};
            
            if (priceSpan) {
              customer.packageDetails.price = '₹ ' + priceSpan.textContent.trim() + ' per person';
            }
            
            if (durationSpan && durationSpan.textContent.includes('Days')) {
              customer.packageDetails.duration = durationSpan.textContent.trim();
            }
            
            customer.packageDetails.location = customer.packageDetails.location || customer.packageTitle;
            customer.packageDetails.description = customer.packageDetails.description || 'Travel package details';
            
            updatedCount++;
          }
        }
      }
    });
    
    if (updatedCount > 0) {
      localStorage.setItem('itt_customer_data', JSON.stringify(customers));
      showNotification(`✨ Updated ${updatedCount} customer records with missing details!`);
    }
  } catch (error) {
    console.error('Error refreshing existing data:', error);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Data manager initializing...');
  
  addSaveButton();
  addDashboardButton();
  
  // Load customer data if in edit mode
  loadCustomerForEdit();
  
  // Refresh existing data on page load
  refreshExistingData();
  
  // Auto-save when customer name changes
  const customerName = document.getElementById("customerName");
  const destTitle = document.getElementById("destTitle");
  
  if (customerName) {
    customerName.addEventListener('blur', () => {
      updateDashboardSection();
      autoSaveData();
    });
    customerName.addEventListener('input', () => {
      updateDashboardSection();
      // Debounced auto-save
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(autoSaveData, 2000);
    });
  }
  
  if (destTitle) {
    destTitle.addEventListener('blur', () => {
      updateDashboardSection();
      autoSaveData();
    });
    destTitle.addEventListener('input', () => {
      updateDashboardSection();
    });
  }
  
  // Update dashboard section on page load
  updateDashboardSection();
  
  console.log('Data manager initialized successfully');
});