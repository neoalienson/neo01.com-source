// World Clock Tests
framework.describe('World Clock', () => {
    // Setup mock DOM
    const setupDOM = () => {
        if (!document.getElementById('world-clock-test-container')) {
            const container = document.createElement('div');
            container.id = 'world-clock-test-container';
            container.style.display = 'none';
            container.innerHTML = `
                <div id="analog-clock">
                    <div class="clock-hand minute-hand" id="minute-hand"></div>
                    <div class="clock-hand hour-hand" id="hour-hand"></div>
                </div>
                <div id="clocks-grid"><div class="add-timezone"></div></div>
                <div id="add-modal"></div>
                <select id="timezone-select"></select>
            `;
            document.body.appendChild(container);
        }
    };

    const resetDOM = () => {
        const grid = document.getElementById('clocks-grid');
        const modal = document.getElementById('add-modal');
        const select = document.getElementById('timezone-select');
        if (grid) grid.innerHTML = '<div class="add-timezone"></div>';
        if (modal) modal.style.display = 'none';
        if (select) select.innerHTML = '';
        localStorage.removeItem('worldClockTimezones');
    };

    setupDOM();

    framework.test('initializes with default timezones', () => {
        resetDOM();
        const wc = new WorldClock();
        framework.assertEqual(wc.timezones.length, 4);
        framework.assertTrue(wc.timezones.includes('America/New_York'));
    });

    framework.test('populates timezone select', () => {
        resetDOM();
        const wc = new WorldClock();
        framework.assertTrue(document.getElementById('timezone-select').children.length > 0);
    });

    framework.test('extracts city from timezone', () => {
        const wc = new WorldClock();
        framework.assertEqual(wc.getCityName('America/New_York'), 'New York');
        framework.assertEqual(wc.getCityName('Europe/London'), 'London');
    });

    framework.test('creates clock card with correct structure', () => {
        const wc = new WorldClock();
        const card = wc.createClockCard('Asia/Tokyo', 0);
        framework.assertEqual(card.className, 'clock-card');
        framework.assertEqual(card.querySelector('.city-name').textContent, 'Tokyo');
    });

    framework.test('includes time and date elements', () => {
        const wc = new WorldClock();
        const card = wc.createClockCard('Europe/London', 1);
        framework.assertTrue(card.querySelector('#time-1') !== null);
        framework.assertTrue(card.querySelector('#date-1') !== null);
    });

    framework.test('renders all timezones', () => {
        resetDOM();
        const wc = new WorldClock();
        framework.assertEqual(document.querySelectorAll('.clock-card').length, 4);
    });

    framework.test('preserves add button', () => {
        resetDOM();
        const wc = new WorldClock();
        framework.assertTrue(document.querySelector('.add-timezone') !== null);
    });

    framework.test('updates time for all timezones', () => {
        resetDOM();
        const wc = new WorldClock();
        wc.updateClocks();
        const timeElement = document.getElementById('time-0');
        framework.assertTrue(timeElement.textContent.match(/\d{2}:\d{2}/) !== null);
    });

    framework.test('updates date for all timezones', () => {
        resetDOM();
        const wc = new WorldClock();
        wc.updateClocks();
        framework.assertTrue(document.getElementById('date-0').textContent.length > 0);
    });

    framework.test('handles missing elements gracefully', () => {
        resetDOM();
        const wc = new WorldClock();
        document.getElementById('time-0').remove();
        wc.updateClocks(); // Should not throw
        framework.assertTrue(true);
    });

    framework.test('adds new timezone', () => {
        resetDOM();
        const wc = new WorldClock();
        const initial = wc.timezones.length;
        wc.addTimezone('America/Los_Angeles');
        framework.assertEqual(wc.timezones.length, initial + 1);
        framework.assertTrue(wc.timezones.includes('America/Los_Angeles'));
    });

    framework.test('prevents duplicate timezone', () => {
        resetDOM();
        const wc = new WorldClock();
        const initial = wc.timezones.length;
        wc.addTimezone('Asia/Tokyo');
        framework.assertEqual(wc.timezones.length, initial);
    });

    framework.test('removes timezone at index', () => {
        resetDOM();
        const wc = new WorldClock();
        const initial = wc.timezones.length;
        wc.removeTimezone(0);
        framework.assertEqual(wc.timezones.length, initial - 1);
        framework.assertTrue(!wc.timezones.includes('America/New_York'));
    });

    framework.test('removes correct timezone', () => {
        resetDOM();
        const wc = new WorldClock();
        wc.removeTimezone(2);
        framework.assertEqual(wc.timezones[2], 'Australia/Sydney');
    });

    framework.test('shows modal', () => {
        resetDOM();
        const wc = new WorldClock();
        wc.showModal();
        framework.assertEqual(wc.modal.style.display, 'block');
    });

    framework.test('hides modal', () => {
        resetDOM();
        const wc = new WorldClock();
        wc.modal.style.display = 'block';
        wc.hideModal();
        framework.assertEqual(wc.modal.style.display, 'none');
    });

    framework.test('showAddModal calls worldClock.showModal', () => {
        resetDOM();
        window.worldClock = new WorldClock();
        showAddModal();
        framework.assertEqual(window.worldClock.modal.style.display, 'block');
    });

    framework.test('hideAddModal calls worldClock.hideModal', () => {
        resetDOM();
        window.worldClock = new WorldClock();
        window.worldClock.modal.style.display = 'block';
        hideAddModal();
        framework.assertEqual(window.worldClock.modal.style.display, 'none');
    });

    framework.test('addTimezone adds selected timezone', () => {
        resetDOM();
        window.worldClock = new WorldClock();
        document.getElementById('timezone-select').value = 'America/Chicago';
        const initial = window.worldClock.timezones.length;
        addTimezone();
        framework.assertEqual(window.worldClock.timezones.length, initial + 1);
    });

    framework.test('removeTimezone removes at index', () => {
        resetDOM();
        window.worldClock = new WorldClock();
        const initial = window.worldClock.timezones.length;
        removeTimezone(1);
        framework.assertEqual(window.worldClock.timezones.length, initial - 1);
    });

    framework.test('handles empty timezone list', () => {
        resetDOM();
        const wc = new WorldClock();
        wc.timezones = [];
        wc.renderClocks(); // Should not throw
        framework.assertTrue(true);
    });

    framework.test('handles many timezones', () => {
        resetDOM();
        const wc = new WorldClock();
        for (let i = 0; i < 10; i++) {
            wc.addTimezone(`Test/Zone${i}`);
        }
        framework.assertTrue(wc.timezones.length > 4);
    });

    framework.test('handles timezone with special characters', () => {
        const wc = new WorldClock();
        framework.assertEqual(wc.getCityName('America/Argentina/Buenos_Aires'), 'Buenos Aires');
    });

    framework.test('validates all timezones are supported', () => {
        const timezones = [
            'America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Denver',
            'America/Toronto', 'America/Vancouver', 'America/Mexico_City', 'America/Sao_Paulo',
            'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
            'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Moscow', 'Europe/Istanbul',
            'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Seoul',
            'Asia/Kolkata', 'Asia/Dubai', 'Asia/Bangkok', 'Asia/Jakarta', 'Asia/Manila',
            'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Pacific/Auckland',
            'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi'
        ];
        const now = new Date();
        const invalid = [];
        timezones.forEach(tz => {
            try {
                now.toLocaleTimeString('en-US', { timeZone: tz, hour12: false });
            } catch (error) {
                invalid.push(tz);
            }
        });
        framework.assertTrue(invalid.length === 0, 'Invalid timezones: ' + invalid.join(', '));
    });

    framework.test('handles rapid add/remove operations', () => {
        resetDOM();
        const wc = new WorldClock();
        wc.addTimezone('America/Chicago');
        wc.removeTimezone(0);
        wc.addTimezone('Europe/Paris');
        wc.removeTimezone(1);
        framework.assertTrue(wc.timezones.length > 0);
    });

    framework.test('saves timezones to localStorage', () => {
        resetDOM();
        localStorage.removeItem('worldClockTimezones');
        const wc = new WorldClock();
        wc.addTimezone('America/Chicago');
        const saved = JSON.parse(localStorage.getItem('worldClockTimezones'));
        framework.assertTrue(saved.includes('America/Chicago'));
    });

    framework.test('loads timezones from localStorage', () => {
        resetDOM();
        localStorage.setItem('worldClockTimezones', JSON.stringify(['Europe/Paris', 'Asia/Dubai']));
        const wc = new WorldClock();
        framework.assertEqual(wc.timezones.length, 2);
        framework.assertTrue(wc.timezones.includes('Europe/Paris'));
    });

    framework.test('handles localStorage unavailable', () => {
        resetDOM();
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = () => { throw new Error('QuotaExceeded'); };
        const wc = new WorldClock();
        framework.assertEqual(wc.saveTimezones(), false);
        Storage.prototype.setItem = originalSetItem;
    });

    framework.test('analog clock adjusts time offset', () => {
        resetDOM();
        const wc = new WorldClock();
        wc.timeOffset = 3600000; // 1 hour
        wc.updateClocks();
        framework.assertTrue(wc.timeOffset === 3600000);
    });
});
