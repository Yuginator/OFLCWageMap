export interface WageData {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    average: number;
    state: number | string;
    county: string;
}

export interface WageResponse {
    meta: {
        wage_year: string;
        collection: 'all' | 'ed';
        soc: string;
        soc_title: string;
        annual_basis_hours: number;
        source: string;
    };
    data: Record<string, WageData>;
    scale: {
        min: number;
        max: number;
    };
}

export interface SocItem {
    soc: string;
    title: string;
}
