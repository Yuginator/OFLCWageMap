import { VercelRequest, VercelResponse } from '@vercel/node';
import { readCsvSync } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const socData = readCsvSync('oes_soc_occs.csv');

        // Map to normalized array
        const result = socData.map((row: any) => ({
            soc: row.soccode || row.SocCode || row.SOC_CODE || '',
            title: row.Title || row.SocTitle || row.SOC_TITLE || '',
        })).filter((item: any) => item.soc && item.title);

        // Filter duplicates
        const seen = new Set();
        const unique = result.filter((item: any) => {
            if (seen.has(item.soc)) return false;
            seen.add(item.soc);
            return true;
        });

        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
        return res.status(200).json(unique);
    } catch (error: any) {
        console.error('SOC Index Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
