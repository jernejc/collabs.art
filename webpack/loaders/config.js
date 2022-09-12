module.exports = function (content) {
    const config = JSON.parse(content.toString());
    const RPC_URL = process.env.RPC_URL;
    const WS_URL = process.env.WS_URL;
    const CANVAS_ADDRESS = process.env.CANVAS_ADDRESS;
    const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;

    config.httpUrl = RPC_URL;
    config.wsUrl = WS_URL;

    config.CollabCanvasAddress = CANVAS_ADDRESS;
    config.CollabTokenAddress = TOKEN_ADDRESS;

    return JSON.stringify(config, null, 2);
}