//Note:
// 'N' - normal bricks
// 'M' - metal bricks
// 'P' - power-up items
// '.' - empty bricks
// '2', '3', '4' - bricks that need 2, 3, 4 hits to break

const STAGES = [
    {
        ballSpeed: 5,
        layout: [
            'NNNNNNNNN',
            'NNNNNNNNN',
            'NNNNNNNNN',
            'NNNNNNNNN',
            'NNNNNNNNN'
        ]
    },

    {
        ballSpeed: 5,
        layout: [
            'NNNNNNNNN',
            'NNNNNNNNN',
            'NNMMMMMNN',
            'NNNNNNNNN',
            'NNNNNNNNN'
        ]
    },

    {
        ballSpeed: 5.5,
        itemPool: ['extraLife', 'widePaddle', 'shield'],
        layout: [
            'NNNNNNNNN',
            'MMM...MMM',
            'NPNNNPNNN',
            'PNNNNNNNP',
            'NNNNPNNNN',
        ]
    },

    {
        ballSpeed: 5,
        layout: [
            'NNNNNNNNN',
            'N2NN3NN3N',
            '4NNN3NNNN',
            'NNNNNNNNN',
            '223NNN4N4'
        ]
    }
]