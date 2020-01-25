import * as MineSweeper from "../lib";

// tslint:disable: no-console no-debugger

const SYMBOL_MAP: Record<number | string, string> = {

    0: "0️⃣",
    1: "1️⃣",
    2: "2️⃣",
    3: "3️⃣",
    4: "4️⃣",
    5: "5️⃣",
    6: "6️⃣",
    7: "7️⃣",
    8: "8️⃣",
    9: "9️⃣",
    " ": "⬜",
    "#": "#️⃣",
    "mine": "💣",
    "dead": "💥",
    "mark": "⛳",
    "question": "❓",
    "wrong": "❌",
    "unknown": "⬛"
};

function printMap(gctrl: MineSweeper.IMineSweeper): void {

    const H = gctrl.getHeight();

    const W = gctrl.getWidth();

    const rows: string[] = [
        [
            SYMBOL_MAP["#"],
            ...new Array(W).fill(0).map((v, i) => SYMBOL_MAP[i])
        ].join("")
    ];

    const map = gctrl.getMap();

    for (let i = 0; i < H; i++) {

        const row: string[] = [SYMBOL_MAP[i]];

        for (let j = 0; j < W; j++) {

            switch (map[i][j]) {

            case MineSweeper.EBlockStatus.DEAD:
                row.push(SYMBOL_MAP.dead);
                break;
            case MineSweeper.EBlockStatus.MINE:
                row.push(SYMBOL_MAP.mine);
                break;
            case MineSweeper.EBlockStatus.MARKED:
                row.push(SYMBOL_MAP.mark);
                break;
            case MineSweeper.EBlockStatus.QUESTION:
                row.push(SYMBOL_MAP.question);
                break;
            case MineSweeper.EBlockStatus.WRONG:
                row.push(SYMBOL_MAP.wrong);
                break;
            case MineSweeper.EBlockStatus.UNKNWON:
                row.push(SYMBOL_MAP.unknown);
                break;
            case 0:
                row.push(SYMBOL_MAP[" "]);
                break;
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
                row.push(SYMBOL_MAP[map[i][j]]);
                break;
            }
        }

        rows.push(row.join(""));
    }

    console.log(rows.join("\n"));
}

const game = new Proxy(MineSweeper.createMineSweeper({
    height: 10,
    width: 10,
    minesQuantity: 9
}), {

    get(gctrl: MineSweeper.IMineSweeper, b) {

        const fn = (gctrl as any as Record<string, (...args: any[]) => any>)[b as string];

        switch (b as string) {

        case "sweep":
        case "mark":
        case "explore":
        case "restart":

            return function(...args: any[]): any {

                fn.apply(gctrl, args);

                printMap(gctrl);
            };

        default:
            return fn;
        }
    }
});

(function() {

    game.restart();

    debugger;

    // now controll the game by game.mark, game.sweep, game.explore.

})();
