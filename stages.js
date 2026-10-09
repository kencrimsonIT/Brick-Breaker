//Note:
// 'N' - normal bricks
// 'M' - metal bricks
// 'P' - power-up items
// '.' - empty bricks

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
    }
]