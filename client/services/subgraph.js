
import config from '@util/config';
import { stringToHex } from '@util/helpers';

export default class GraphManager {

  async loadPixels(params) {
    const response = await this.postQueryToGraph('pixels', params);      
    return response.pixels;
  }

  async loadPixel(params) {
    const response = await this.postQueryToGraph('pixel', params);
    return response.pixel;
  }

  getPixelsQuery(params) { 
    if (!params.first || params.first > 100)
      params.first = 50;

    return `{ pixels(first: ${params.first}) { id owner price color } }`
  }

  getPixelQuery(params) {
    let id;

    if (!params.id)
      throw new Error('No pixel ID set.');
    else
      id = stringToHex(params.id);

    return `{ pixel(id: "${id}") { id owner price color } }`
  }

  async postQueryToGraph(queryName, params) {
    let query;
    
    params = params || {};

    switch(queryName) {
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

    const response = await fetch(config.subgraph.local, options)
      .then(res => res.json());

    if (response.errors) 
      throw new Error(JSON.stringify(response.errors));

    if (!response.data)
      throw new Error('No query data found.');
    
    return response.data;
  }
}