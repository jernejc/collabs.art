
import config from '@util/config';

import { stringToHex, delay } from '@util/helpers';
import logger from '@util/logger';

export default class GraphManager {

  async loadPixels(params) {
    logger.log('GraphManager: loadPixels', params);

    try {
      const response = await this.postQueryToGraph('pixels', params);

      if (!response.pixels)
        throw new Error('No pixels found.');

      return response.pixels;
    } catch (error) {
      logger.error('Error while loading pixels: ' + error);
      return [];
    }
  }

  async loadPixel(params, refresh) {
    logger.log('GraphManager: loadPixel');

    if (refresh) // delay for 3s so the graph is up to date, need better solution here
      await delay(1);

    try {
      const response = await this.postQueryToGraph('pixel', params);

      if (!response.pixel)
        return null;

      return response.pixel;
    } catch (error) {
      logger.error('Error while loading pixel: ' + error);
      return null;
    }
  }

  getPixelsQuery(params) {

    if (!params.first)
      params.first = 50;

    let where = '';

    for (let param in params) {
      if (param !== 'first')
        where += `${param}:${params[param]}`
    }

    return `{ pixels(first: ${params.first}, where: {${where}}) ${this.pixelBodyQuery} }`
  }

  getPixelQuery(params) {
    let id;

    if (!params.id)
      throw new Error('No pixel ID set.');
    else
      id = stringToHex(params.id);

    return `{ pixel(id: "${id}") ${this.pixelBodyQuery} }`
  }

  get pixelBodyQuery() {
    return `{ id owner color bid modifiedAt }`
  }

  async postQueryToGraph(queryName, params) {
    logger.log('GraphManager: postQueryToGraph');

    let query;

    params = params || {};

    switch (queryName) {
      case 'pixels':
        query = this.getPixelsQuery(params);
        break;
      case 'pixel':
        query = this.getPixelQuery(params);
        break;
    }

    if (!query)
      throw new Error('No query found for name: ' + queryName);

    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query
      })
    };

    const response = await fetch(config.subgraph.url, options)
      .then(res => res.json());

    if (response.errors)
      throw new Error(JSON.stringify(response.errors));

    if (!response.data)
      throw new Error('No query data found.');

    return response.data;
  }
}