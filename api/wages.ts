import { VercelRequest, VercelResponse } from '@vercel/node';
import { readCsvSync, streamWagesBySoc, loadFipsMapping } from './_utils.js';

// Global cache across warm Vercel invocations
let globalSocIndex: any[] | null = null;
let globalGeoData: any[] | null = null;
let globalFipsMap: Map<string, string> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { soc, collection } = req.query;

    if (!soc || typeof soc !== 'string') {
        return res.status(400).json({ error: 'SOC code is required' });
    }

    const isEd = collection === 'ed';
    const csvFile = isEd ? 'EDC_Export.csv' : 'ALC_Export.csv';

    try {
        // 1. Load SOC metadata for the title
        if (!globalSocIndex) globalSocIndex = readCsvSync('oes_soc_occs.csv');
        const socInfo = globalSocIndex.find((s: any) => (s.SocCode || s.SOC_CODE) === soc);
        const socTitle = socInfo ? (socInfo.SocTitle || socInfo.SOC_TITLE) : 'Unknown';

        // 2. Load Geography mapping
        if (!globalGeoData) globalGeoData = readCsvSync('Geography.csv');
        const geoData = globalGeoData;

        // 3. Load Wages via stream
        const wagesForSoc = await streamWagesBySoc(csvFile, soc as string);

        // 4. Load FIPS Mapping
        if (!globalFipsMap) globalFipsMap = loadFipsMapping();
        const fipsMap = globalFipsMap;

        const data: Record<string, any> = {};
        const unmapped: any[] = [];
        let min = Infinity;
        let max = -Infinity;

        // 5. Process and Join
        for (const wageRow of wagesForSoc) {
            const areaCode = wageRow.Area || wageRow.AREA_CODE;

            const countiesInArea = geoData.filter((g: any) => (g.Area || g.AREA_CODE) === areaCode);

            const parseWage = (val: string) => {
                const num = parseFloat(val.replace(/[$,]/g, ''));
                return isNaN(num) ? 0 : Math.round(num * 2080);
            };

            const levels = {
                level1: parseWage(wageRow.Level1 || wageRow.Level_1_Hourly || wageRow.LEVEL_1_HOURLY || '0'),
                level2: parseWage(wageRow.Level2 || wageRow.Level_2_Hourly || wageRow.LEVEL_2_HOURLY || '0'),
                level3: parseWage(wageRow.Level3 || wageRow.Level_3_Hourly || wageRow.LEVEL_3_HOURLY || '0'),
                level4: parseWage(wageRow.Level4 || wageRow.Level_4_Hourly || wageRow.LEVEL_4_HOURLY || '0'),
                average: parseWage(wageRow.Average || wageRow.Mean_Hourly || wageRow.MEAN_HOURLY || '0'),
            };

            const vals = Object.values(levels).filter(v => typeof v === 'number' && v > 0) as number[];
            if (vals.length > 0) {
                min = Math.min(min, ...vals);
                max = Math.max(max, ...vals);
            }

            for (const countyRow of countiesInArea) {
                const stateAbbr = countyRow.StateAb || countyRow.State || countyRow.STATE_ABBR;
                const stateName = countyRow.State || countyRow.StateName || stateAbbr;
                const countyTownName = countyRow.CountyTownName || countyRow.COUNTY_TOWN_NAME || '';
                const countyName = countyTownName.toLowerCase();

                // Try exact match, or try suffixing/removing ' county'
                let fips = fipsMap.get(`${stateAbbr}|${countyName}`);

                if (!fips) {
                    fips = fipsMap.get(`${stateAbbr}|${countyName} county`);
                }
                if (!fips && countyName.endsWith(' county')) {
                    fips = fipsMap.get(`${stateAbbr}|${countyName.replace(' county', '')}`);
                }

                if (fips) {
                    data[fips] = {
                        ...levels,
                        state: stateName,
                        county: countyTownName,
                    };
                } else {
                    unmapped.push({ state: stateAbbr, county: countyTownName });
                }
            }
        }

        const response = {
            meta: {
                wage_year: "2025–2026",
                collection: isEd ? 'ed' : 'all',
                soc,
                soc_title: socTitle,
                annual_basis_hours: 2080,
                source: "U.S. DOL OFLC (FLAG wage data)"
            },
            data,
            scale: {
                min: min === Infinity ? 0 : min,
                max: max === -Infinity ? 0 : max,
            },
            unmapped: unmapped.length > 0 ? unmapped : undefined
        };

        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
        return res.status(200).json(response);
    } catch (error: any) {
        console.error('Wages Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
