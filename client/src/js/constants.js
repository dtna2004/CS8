const POINTS = {
    D05: { lat: 15.67944, lng: 110.69806 },
    VIMUT: { lat: 13.96250, lng: 109.52139 },
    D21: { lat: 11.90444, lng: 109.49278 },
    D20: { lat: 11.45806, lng: 109.15750 },
    D19: { lat: 10.23722, lng: 108.24694 },
    OSIXA: { lat: 9.52222, lng: 109.84389 },
    D08: { lat: 9.56472, lng: 112.36889 },
    DONDA: { lat: 14.70333, lng: 112.02167 },
    EXOTO: { lat: 15.35833, lng: 111.05000 },
    MIGUG: { lat: 15.27333, lng: 114.00000 },
    ARESI: { lat: 13.97333, lng: 114.45000 },
    ANOKI: { lat: 12.36667, lng: 113.25000 },
    AGSAM: { lat: 11.47167, lng: 112.58833 },
    ALDAS: { lat: 10.94833, lng: 112.20500 },
    UDOSI: { lat: 9.54694, lng: 111.18139 },
    AKMON: { lat: 8.21500, lng: 110.21833 },
    MESOX: { lat: 13.98000, lng: 113.04500 },
    DAMEL: { lat: 13.97833, lng: 111.51000 },
    VEPAM: { lat: 13.96667, lng: 110.00000 },
    NITOM: { lat: 12.74194, lng: 110.64028 },
    SOSPA: { lat: 11.83389, lng: 108.64083 },
    PANDI: { lat: 11.63500, lng: 114.00000 },
    MIMUX: { lat: 11.30500, lng: 111.10333 },
    DAMVO: { lat: 11.10833, lng: 109.54500 },
    MAPNO: { lat: 10.21833, lng: 110.33500 },
    DAGAG: { lat: 9.46333, lng: 108.44167 },
    MOXON: { lat: 8.82500, lng: 109.35500 },
    ELSAS: { lat: 10.13667, lng: 107.54833 },
    CONDA: { lat: 8.95722, lng: 106.47472 },
    DUDIS: { lat: 7.00000, lng: 106.81000 }
};

const ROUTES = {
    L642: {
        points: ['EXOTO', 'VEPAM', 'SOSPA', 'ELSAS'],
        color: '#ff0000'
    },
    M771: {
        points: ['DONDA', 'DAMEL', 'NITOM', 'DAMVO', 'DAGAG', 'DUDIS'],
        color: '#ff0000'
    },
    N892: {
        points: ['MIGUG', 'MESOX', 'MIMUX', 'MAPNO', 'OSIXA', 'MOXON'],
        color: '#ff0000'
    },
    L625: {
        points: ['ARESI', 'ANOKI', 'AGSAM', 'ALDAS', 'UDOSI', 'AKMON'],
        color: '#ff0000'
    },
    M768: {
        points: ['AKMON', 'MOXON', 'DAGAG', 'ELSAS'],
        color: '#0000ff'
    },
    L628: {
        points: ['ARESI', 'MESOX', 'DAMEL', 'VEPAM'],
        color: '#0000ff'
    },
    Q15: {
        points: ['MESOX', 'NITOM', 'SOSPA'],
        color: '#0000ff'
    },
    N500: {
        points: ['PANDI', 'AGSAM', 'MIMUX', 'DAMVO'],
        color: '#0000ff'
    },
    M765: {
        points: ['PANDI', 'ALDAS', 'MAPNO', 'DAGAG', 'CONDA'],
        color: '#0000ff'
    }
};

const BOUNDARIES = [
    'D05', 'VIMUT', 'D21', 'D20', 'D19', 'OSIXA', 'D08', 'DONDA', 'EXOTO', 'D05'
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { POINTS, ROUTES, BOUNDARIES };
} 