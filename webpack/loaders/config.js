module.exports = function (content) {
    const config = JSON.parse(content.toString());

    config.api = process.env.API_KEY;
    config.CollabCanvasAddress = process.env.CANVAS_ADDRESS;
    config.CollabTokenAddress = process.env.TOKEN_ADDRESS;

    return JSON.stringify(config, null, 2);
}