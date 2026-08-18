// Quick API test script for FPL Analyzer
const FPL_API = {
    BASE_URL: 'https://fantasy.premierleague.com/api',
    // Multiple CORS proxies as fallbacks
    CORS_PROXIES: [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/'
    ],
    TEAM_ID: 1146081,
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000, // ms

    // Cached data
    cache: {
        bootstrap: null,
        teamData: null,
        fixtures: null,
        managerHistory: null
    },

    // Helper to build URL
    buildUrl(endpoint, proxyIndex = 0) {
        if (proxyIndex === -1) {
            return endpoint;
        }
        if (proxyIndex >= this.CORS_PROXIES.length) {
            return endpoint;
        }
        const proxy = this.CORS_PROXIES[proxyIndex];
        return proxy + encodeURIComponent(endpoint);
    },

    // Enhanced fetch with retry logic and proxy fallback
    async fetchWithRetry(endpoint, options = {}, proxyIndex = -1) {
        let lastError;

        for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                const url = this.buildUrl(endpoint, proxyIndex);
                console.log(`🔄 Attempt ${attempt + 1}: Fetching from proxy ${proxyIndex >= 0 ? proxyIndex : 'direct'}...`);
                console.log(`   URL: ${url.substring(0, 80)}...`);

                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        ...options.headers
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log(`✅ Success! Got data with ${Object.keys(data).length} keys`);
                return data;
            } catch (error) {
                lastError = error;
                console.warn(`❌ Attempt ${attempt + 1} failed:`, error.message);

                // Try next proxy if current one fails
                if (proxyIndex < this.CORS_PROXIES.length - 1) {
                    proxyIndex++;
                    continue;
                }

                // If all proxies fail and we haven't retried, retry with delay
                if (attempt < this.MAX_RETRIES) {
                    console.log(`⏳ Waiting ${this.RETRY_DELAY}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                }
            }
        }

        throw new Error(`Failed to fetch ${endpoint} after ${this.MAX_RETRIES + 1} attempts: ${lastError.message}`);
    },

    // Fetch bootstrap-static data
    async getBootstrapStatic() {
        if (this.cache.bootstrap) return this.cache.bootstrap;

        try {
            const url = `${this.BASE_URL}/bootstrap-static/`;
            const data = await this.fetchWithRetry(url);
            this.cache.bootstrap = data;
            return data;
        } catch (error) {
            console.error('Error fetching bootstrap data:', error);
            throw error;
        }
    },

    // Fetch manager's team data
    async getManagerTeam() {
        if (this.cache.teamData) return this.cache.teamData;

        try {
            const url = `${this.BASE_URL}/entry/${this.TEAM_ID}/`;
            const data = await this.fetchWithRetry(url);
            this.cache.teamData = data;
            return data;
        } catch (error) {
            console.error('Error fetching team data:', error);
            throw error;
        }
    },

    // Fetch fixtures
    async getFixtures() {
        if (this.cache.fixtures) return this.cache.fixtures;

        try {
            const url = `${this.BASE_URL}/fixtures/`;
            const data = await this.fetchWithRetry(url);
            this.cache.fixtures = data;
            return data;
        } catch (error) {
            console.error('Error fetching fixtures:', error);
            throw error;
        }
    }
};

// Test runner
async function runTests() {
    console.log('🧪 FPL Analyzer API Test Suite\n');
    console.log('================================\n');

    const tests = [
        {
            name: 'Bootstrap Static Data (Players, Teams, Gameweeks)',
            fn: () => FPL_API.getBootstrapStatic()
        },
        {
            name: 'Manager Team Data',
            fn: () => FPL_API.getManagerTeam()
        },
        {
            name: 'Fixtures',
            fn: () => FPL_API.getFixtures()
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        console.log(`\n📋 Testing: ${test.name}`);
        console.log('─'.repeat(50));

        try {
            const startTime = Date.now();
            const result = await test.fn();
            const duration = Date.now() - startTime;

            console.log(`✅ PASS (${duration}ms)`);
            passed++;

            // Show summary
            if (result.elements) {
                console.log(`   📊 ${result.elements.length} players loaded`);
            }
            if (result.teams) {
                console.log(`   🏆 ${result.teams.length} teams loaded`);
            }
            if (result.events) {
                console.log(`   📅 ${result.events.length} gameweeks`);
            }
            if (result.name) {
                console.log(`   👤 Team: ${result.name}`);
            }
            if (Array.isArray(result) && result[0] && result[0].kickoff_time) {
                console.log(`   ⚽ ${result.length} fixtures loaded`);
            }
        } catch (error) {
            console.log(`❌ FAIL`);
            console.log(`   Error: ${error.message}`);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! API is working correctly.');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Check the output above.');
        process.exit(1);
    }
}

// Run tests
runTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
