module.exports = function (content) {
    const config = JSON.parse(content.toString());

    config.httpUrl = process.env.RPC_URL;
    config.wsUrl = process.env.WS_URL;

    config.CollabCanvasAddress = process.env.CANVAS_ADDRESS;
    config.CollabTokenAddress = process.env.TOKEN_ADDRESS;

    return JSON.stringify(config, null, 2);
}