const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1440, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to http://localhost:3000/ ...");
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    
    // 1. Evaluate Dashboard - Take screenshot
    console.log("Taking dashboard screenshot...");
    await page.screenshot({ path: 'dashboard_view.png', fullPage: true });

    // 2. Interact - Click on "Inspect Hot House Orders" to reveal Pareto and Active Orders
    console.log("Clicking to inspect HOT HOUSE orders...");
    const inspectButton = await page.$x("//button[contains(text(), 'Inspect Hot House Orders')]");
    if (inspectButton.length > 0) {
      await inspectButton[0].click();
      await page.waitForTimeout(1000); // Wait for transition/render
    } else {
      console.log("Could not find Inspect Hot House Orders button.");
    }
    
    // Evaluate Pareto Charts
    console.log("Taking Pareto Charts & Active Orders screenshot...");
    await page.screenshot({ path: 'pareto_and_orders_view.png', fullPage: true });

    // 3. Test Active Orders List filter/export functionality
    console.log("Typing into global search box...");
    const searchInput = await page.$('input[placeholder="Search any field..."]');
    if (searchInput) {
      await searchInput.type('H'); // Type something to filter
      await page.waitForTimeout(500); // Wait for filter to apply
      await page.screenshot({ path: 'filtered_orders_view.png', fullPage: true });
    }

    // Evaluate Export
    console.log("Clicking Export Data button...");
    const exportButton = await page.$x("//button[contains(text(), 'Export Data')]");
    if (exportButton.length > 0) {
      // In a real automated test we would intercept the download or verify download behavior.
      // We will just click it for now to trigger the download logic.
      await exportButton[0].click();
      await page.waitForTimeout(1000); 
      console.log("Export triggered successfully.");
    }

    console.log("Evaluation script completed successfully. Check the generated PNG files.");

  } catch (error) {
    console.error("Error during evaluation:", error);
  } finally {
    await browser.close();
  }
})();
