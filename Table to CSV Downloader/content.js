// --- Start of script ---
console.log('--- 📄 CSV Downloader Script Injected (v1.3 - Dynamic) ---');

/**
 * Converts a single HTML table element (or table-like div) into a CSV string.
 * @param {HTMLElement} tableElement The table or div[role="table"] to convert.
 * @returns {string} The CSV data as a string.
 */
function scrapeTableToCSV(tableElement) {
  if (!tableElement) return null;

  const rows = [];
  
  // Find all <tr> rows, even if they are in separate <table> tags
  tableElement.querySelectorAll('tr').forEach(rowElement => {
    const rowData = [];
    
    // Find all <th> (header) and <td> (data) cells
    rowElement.querySelectorAll('th, td').forEach(cellElement => {
      let cellText = cellElement.innerText.trim();
      
      // CSV Sanitization
      cellText = cellText.replace(/(\r\n|\n|\r)/gm, " ");
      cellText = cellText.replace(/"/g, '""');
      if (cellText.search(/("|,|\n)/g) >= 0) {
        cellText = `"${cellText}"`;
      }
      
      rowData.push(cellText);
    });
    
    if (rowData.length > 0) {
      rows.push(rowData.join(','));
    }
  });
  
  return rows.join('\n');
}

/**
 * Triggers a browser download for the given CSV content.
 * @param {string} csvContent The CSV data.
 * @param {string} filename The desired file name.
 */
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * --- Main Function ---
 * Finds all specified table-like elements on the page and injects a download button.
 * @param {HTMLElement | Document} parentElement The element to search within (e.g., document.body).
 */
function addButtonsToTables(parentElement) {
  if (!parentElement.querySelectorAll) {
    return; // Not a valid element to query
  }
  
  // Query for BOTH standard tables and the special 'div[role="table"]' containers
  const tables = parentElement.querySelectorAll('table, div[role="table"]');
  
  if (tables.length > 0) {
    console.log(`Found ${tables.length} new table-like elements.`);
  }

  tables.forEach((table, index) => {
    
    // --- FIX 1: Check if the button is *already* there ---
    // We check the parent element to see if it's our wrapper.
    if (table.parentElement && table.parentElement.classList.contains('table-csv-wrapper')) {
      return; // Skip, already has a button
    }
    
    // --- FIX 2: Skip child tables (for Superset) ---
    // If this <table> is *inside* a div[role="table"], we skip it.
    // We only want to add the button to the main 'div[role="table"]' container.
    if (table.matches('table') && table.closest('div[role="table"]')) {
      return; // Skip child table, button will be on the parent div
    }

    // 1. Create a wrapper div
    const wrapper = document.createElement('div');
    wrapper.classList.add('table-csv-wrapper');
    
    // 2. Insert the wrapper before the table
    table.parentNode.insertBefore(wrapper, table);
    
    // 3. Move the table *inside* the wrapper
    wrapper.appendChild(table);

    // 4. Create the download button
    const btn = document.createElement('button');
    btn.innerText = '⬇️ CSV';
    btn.classList.add('csv-download-button');
    
    // 5. Add click event
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop click from bubbling up
      
      const csv = scrapeTableToCSV(table); 
      
      if (csv && csv.length > 0) {
        downloadCSV(csv, `table_export_${index + 1}.csv`);
      } else {
        alert('Could not export this table (it might be empty). 😥');
      }
    });
    
    // 6. Add the button to the wrapper
    wrapper.appendChild(btn);
  });
}

// --- NEW: MutationObserver Logic ---
// This is the "watcher" that handles dynamic pages.

// 1. Define what to do when the DOM changes
const observerCallback = (mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      // Check all added nodes
      mutation.addedNodes.forEach(node => {
        // We only care about Element nodes, not text nodes, etc.
        if (node.nodeType === 1) { 
          addButtonsToTables(node);
        }
      });
    }
  }
};

// 2. Create the observer
const observer = new MutationObserver(observerCallback);

// 3. Start observing the whole document body for new child elements
observer.observe(document.body, { 
  childList: true, // Watch for nodes being added or removed
  subtree: true    // Watch all descendants, not just direct children
});

// --- Initial Run ---
// Run the function once right away to catch any tables
// that are already present when the script injects.
addButtonsToTables(document.body);