// puppeteer-test-tc101.js

const puppeteer = require('puppeteer');

// Define the URL of your game.
const GAME_URL = 'https://aisheikh1.github.io/Bubble_Pop_Frenzy/'; 

async function runTestTC101() {
    let browser;
    try {
        // 1. Launch a new browser instance
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Set a default timeout for navigation and element waiting
        page.setDefaultNavigationTimeout(60000); // 60 seconds
        page.setDefaultTimeout(30000); // 30 seconds for other operations

        console.log(`Navigating to ${GAME_URL}...`);
        // 2. Navigate to the game URL
        // 'load' waits for the 'load' event to fire (when all resources are loaded).
        // This is important because your message box appears on 'load'.
        await page.goto(GAME_URL, { waitUntil: 'load' }); 

        console.log('Page loaded. Checking for welcome screen and "Continue" button...');

        // 3. Explicitly wait for the messageBox to become visible.
        // This ensures the main container for the welcome message is ready.
        const messageBox = await page.waitForSelector('#messageBox', { visible: true, timeout: 15000 }); 

        if (!messageBox) {
            console.error('❌ TC-101 Failed: Message box (#messageBox) did not become visible.');
            return; // Exit if message box isn't found
        }
        console.log('✅ Message box (#messageBox) is visible.');

        // 4. Now that the message box is visible, wait for ANY button inside the messageBoxButtons container.
        // This is more robust as it waits for the element to exist and be visible,
        // rather than relying on the :contains pseudo-selector for initial visibility.
        const buttonSelector = '#messageBoxButtons button';
        await page.waitForSelector(buttonSelector, { visible: true, timeout: 10000 });

        // 5. Once a button is visible, evaluate in the browser context to find the "Continue" button.
        // This is more reliable for checking text content of dynamically added elements.
        const continueButtonFound = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('#messageBoxButtons button'));
            // Trim to account for any potential whitespace around the text content
            return buttons.some(button => button.textContent.trim() === 'Continue');
        });

        if (continueButtonFound) {
            console.log('✅ TC-101 Passed: Welcome screen (message box) is visible and "Continue" button is found.');
        } else {
            console.error('❌ TC-101 Failed: "Continue" button not found or not visible within the message box.');
            console.error('   Reason: A button was found, but none had the exact text "Continue".');
        }

    } catch (error) {
        console.error('An error occurred during the test:', error);
        console.error('❌ TC-101 Failed due to an unexpected error.');
    } finally {
        // 6. Close the browser instance
        if (browser) {
            await browser.close();
            console.log('Browser closed.');
        }
    }
}

// Execute the test function
runTestTC101();
