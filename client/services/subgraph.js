
import config from '@util/config';
import { stringToHex, delay } from '@util/helpers';

export default class GraphManager {

  async loadPixels(params) {
    if (DEBUG) console.log('GraphManager: loadPixels');

    try {
      const response = await this.postQueryToGraph('pixels', params);

      if (!response.pixels)
        throw new Error('No pixels found.');

      return response.pixels;
    } catch (error) {
      console.error('Error while loading pixels: ' + error);
      return [];
    }
  }

  async loadPixel(params, refresh) {
    if (DEBUG) console.log('GraphManager: loadPixel');

    if (refresh) // delay for 3s so the graph is up to date, need better solution here
      await delay(1);

    try {
      const response = await this.postQueryToGraph('pixel', params);

      if (!response.pixel)
        return null;
        
      return response.pixel;
    } catch (error) {
      console.error('Error while loading pixel: ' + error);
      return null;
    }
  }

  getPixelsQuery(params) {

    if (!params.first || params.first > 100)
      params.first = 50;

    let where = '';

    for (let param in params) {
      if (param !== 'first')
        where += `${param}:"${params[param]}"`
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
    return `{ id owner price color highestBid { bidder amount expiresAt } }`
  }

  async postQueryToGraph(queryName, params) {
    if (DEBUG) console.log('GraphManager: postQueryToGraph');

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

    //console.log('posting query', query)

    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query
      })
    };

    const response = await fetch(config.subgraph.local, options)
      .then(res => res.json());

    if (response.errors)
      throw new Error(JSON.stringify(response.errors));

    if (!response.data)
      throw new Error('No query data found.');

    return response.data;
  }
}