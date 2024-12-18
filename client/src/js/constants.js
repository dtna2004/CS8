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
    CN: { lat: 8.73278, lng: 106.62639 },
    DUDIS: { lat: 7.00000, lng: 106.4836 },
    MELAS: { lat: 7.08833, lng: 108.15333 },
    ESPOB: { lat: 7.00000, lng: 105.55556 },
    SAMAP: { lat: 9.78833, lng: 109.25250 },
    VIGEN: { lat: 7.99556, lng: 105.36944 },
    TULTU: { lat: 9.68306, lng: 106.89778 },
    RUTIT: { lat: 10.45417, lng: 107.75750 },
    SUDUN: { lat: 9.99278, lng: 108.79556 },
    PTH: { lat: 10.92806, lng: 108.07194 },
    DOXAR: { lat: 12.36667, lng: 110.37833 },
    KARAN: { lat: 12.64889, lng: 109.15667 },
    ASEBO: { lat: 10.33167, lng: 107.19000 },
    CRA: { lat: 11.99444, lng: 109.22000 },
    AGSIS: { lat: 11.02194, lng: 108.83111 },
    ATVIT: { lat: 12.14056, lng: 109.49611 },
    MUGAN: { lat: 12.36667, lng: 111.87167 },
    DN2: { lat: 7.00000, lng: 104.84306 },
    DX: { lat: 14.70333, lng: 114.00000 },
    DY: { lat: 14.70333, lng: 112.02167},
    DZ: { lat: 7.00000, lng: 112.36889},
    D18: { lat: 10.59083, lng: 107.44722}

};

const ROUTES = {
    L642: {
        points: ['EXOTO', 'VEPAM', 'KARAN', 'SOSPA','PTH', 'RUTIT', 'ELSAS', 'CN', 'ESPOB'],
        color: '#ff0000'
    },
    M771: {
        points: ['DONDA', 'DAMEL', 'NITOM', 'DOXAR', 'DAMVO', 'SUDUN', 'DAGAG', 'DUDIS'],
        color: '#ff0000'
    },
    N892: {
        points: ['MIGUG', 'MESOX', 'MUGAN', 'MIMUX', 'MAPNO', 'OSIXA', 'MOXON', 'MELAS'],
        color: '#ff0000'
    },
    L625: {
        points: ['ARESI', 'ANOKI', 'AGSAM', 'ALDAS', 'UDOSI', 'AKMON'],
        color: '#ff0000'
    },
    M768: {
        points: ['AKMON', 'MOXON', 'DAGAG', 'ELSAS', 'ASEBO'],
        color: '#0000ff'
    },
    L628: {
        points: ['ARESI', 'MESOX', 'DAMEL', 'VEPAM', 'VIMUT'],
        color: '#0000ff'
    },
    Q15: {
        points: ['MESOX', 'NITOM', 'ATVIT', 'CRA'],
        color: '#0000ff'
    },
    N500: {
        points: ['PANDI', 'AGSAM', 'MIMUX', 'DAMVO', 'AGSIS', 'PTH'],
        color: '#0000ff'
    },
    M765: {
        points: ['PANDI', 'ALDAS', 'MAPNO', 'SAMAP', 'DAGAG', 'CN', 'VIGEN'],
        color: '#0000ff'
    },
    L644: {
        points: ['DUDIS ', 'CN', 'TULTU'],
        color: '#0000ff'
    },
    ESPOB: {
        points: ['ESPOB', 'DAGAG'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    DUDIS: {
        points: ['DUDIS', 'MOXON','DUDIS' , 'CN', 'DUDIS','SAMAP', 'DUDIS','ELSAS', 'DUDIS','SAMAP', 'DUDIS','OSIXA'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    SAMAP: {
        points: ['SUDUN','SAMAP', 'DAMVO', 'SAMAP', 'DOXAR', 'SAMAP', 'NITOM', 'SAMAP', 'MIMUX','SAMAP', 'MOXON','SAMAP', 'DUDIS'],
        color: '#00000f',
        dashArray: '5, 10'
    },

    EXOTO: {
        points: ['DAMEL','EXOTO'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    VEPAM: {
        points: ['NITOM','VEPAM', 'CRA','VEPAM', 'ATVIT','VEPAM', 'DOXAR','VEPAM', 'DAMVO'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    ATVIT: {
        points: ['DOXAR', 'ATVIT','AGSIS','ATVIT', 'DAMVO'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    AGSIS: {
        points: ['DOXAR','AGSIS', 'CRA','AGSIS', 'SUDUN','AGSIS', 'RUTIT','AGSIS', 'DAGAG','AGSIS', 'ELSAS'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    ELSAS: {
        points: ['DUDIS','ELSAS'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    MIGUG: {
        points: ['DAMEL','MIGUG', 'ANOKI'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    MESOX: {
        points: ['ANOKI','MESOX', 'AGSAM','MESOX', 'DOXAR','MESOX', 'DAMVO','MESOX','SAMAP'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    MUGAN: {
        points: ['DAMVO','MUGAN', 'AGSAM','MUGAN', 'ALDAS'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    MIMUX: {
        points: ['UDOSI','MIMUX', 'SAMAP','MIMUX', 'SUDUN','MIMUX', 'DAGAG'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    MAPNO: {
        points: ['AKMON','MAPNO', 'SUDUN'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    AKMON: {
        points: ['MAPNO','AKMON'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    UDOSI: {
        points: ['MIMUX','UDOSI'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    ALDAS: {
        points: ['MUGAN','ALDAS'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    AGSAM: {
        points: ['MUGAN', 'AGSAM','MESOX','AGSAM'],
        color: '#00000f',
        dashArray: '5, 10'
    },
    ANOKI: {
        points: ['MESOX','ANOKI'],
        color: '#00000f',
        dashArray: '5, 10'
    }
};

const BOUNDARIES = [
    'DONDA', 'EXOTO', 'D05', 'VIMUT', 'D21', 'D20', 'D19', 'D18', 'TULTU', 'VIGEN','DN2','ESPOB','DUDIS','MELAS', 'D08', 'DX', 'DY'
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { POINTS, ROUTES, BOUNDARIES };
} 