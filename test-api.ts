import handler from './api/soc-index';
import wagesHandler from './api/wages';

async function test() {
    console.log('Testing soc-index...');
    const req1: any = { query: {} };
    const res1: any = {
        setHeader: () => { },
        status: (code: number) => ({
            json: (data: any) => {
                console.log(`soc-index status ${code}, data length: ${data.length || 0}`);
                if (data.error) console.error(data.error);
                else console.log('Sample SOCs:', data.slice(0, 3));
            }
        })
    };
    await handler(req1, res1);

    console.log('\nTesting wages (soc=15-1255, collection=all)...');
    const req2: any = { query: { soc: '15-1255', collection: 'all' } };
    const res2: any = {
        setHeader: () => { },
        status: (code: number) => ({
            json: (data: any) => {
                console.log(`wages status ${code}, meta:`, data.meta);
                const mappedCount = data.data ? Object.keys(data.data).length : 0;
                const unmappedCount = data.unmapped ? data.unmapped.length : 0;
                console.log(`Mapped counties: ${mappedCount}`);
                console.log(`Unmapped counties: ${unmappedCount}`);
                if (mappedCount > 0) {
                    console.log('Sample Data (FIPS: 06085 Santa Clara CA):', data.data['06085'] || 'Not found');
                }
            }
        })
    };
    await wagesHandler(req2, res2);
}

test().catch(console.error);
