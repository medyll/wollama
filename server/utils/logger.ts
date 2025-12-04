const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",

    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        gray: "\x1b[90m",
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
    },
};

export const logger = {
    info: (ctx: string, msg: string) => console.log(`${colors.fg.cyan}[INFO]    ${colors.fg.magenta}[${ctx}]${colors.reset} ${msg}`),
    warn: (ctx: string, msg: string) => console.warn(`${colors.fg.yellow}[WARN]    ${colors.fg.magenta}[${ctx}]${colors.reset} ${msg}`),
    error: (ctx: string, msg: string) => console.error(`${colors.fg.red}[ERROR]   ${colors.fg.magenta}[${ctx}]${colors.reset} ${msg}`),
    success: (ctx: string, msg: string) => console.log(`${colors.fg.green}[SUCCESS] ${colors.fg.magenta}[${ctx}]${colors.reset} ${msg}`)
};
