const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    // intercept requests to verify 400 errors
    page.on('requestfailed', request => {
        console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
    });
    
    page.on('response', async response => {
        if (!response.ok()) {
            console.log('RESPONSE FAILED:', response.url(), response.status());
            if (response.url().includes('clients') || response.url().includes('supabase')) {
                try {
                    const text = await response.text();
                    console.log('ERROR TEXT:', text);
                } catch (e) {}
            }
        }
    });

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 5000 });

        console.log("Typing login...");
        await page.type('input[type="text"]', 'admin@test.com', {delay: 10});
        await page.type('input[type="password"]', 'admin123', {delay: 10});
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {}),
            page.keyboard.press('Enter')
        ]);
        
        console.log("Waiting for Dashboard to settle...");
        await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

        console.log("Navigating to Clientes...");
        await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const clientLink = links.find(l => l.innerText.toLowerCase().includes('clientes'));
            if (clientLink) clientLink.click();
        });

        await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));
        
        console.log("Clicking Edit button in table...");
        const editOpened = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const editBtn = buttons.filter(b => b.title === 'Editar' || (b.className && b.className.includes('edit')))[0];
            if (editBtn) {
                editBtn.click();
                return true;
            }
            return false;
        });

        if (!editOpened) {
            console.log("Could not find edit button.");
        } else {
            console.log("Edit button clicked. Waiting for modal.");
            await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));
            
            console.log("Typing 'Test' in name input...");
            await page.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                const nameInput = inputs.find(i => i.value && i.value.length > 2);
                if (nameInput) {
                    nameInput.value = nameInput.value + ' Test';
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
            
            console.log("Clicking Save...");
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const saveBtn = buttons.filter(b => b.innerText.toLowerCase().includes('salvar'))[0];
                if (saveBtn) saveBtn.click();
            });
            
            await page.evaluate(() => new Promise(r => setTimeout(r, 3000)));
        }
    } catch (e) {
        console.log("TEST ERROR:", e.message);
    } finally {
        await browser.close();
    }
})();
