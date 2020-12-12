
import config from '@util/config';

export default class GraphManager {

  async loadPixels(params) {

    params = params || {};

    if (!params.first || params.first > 100)
      params.first = 25;

    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: this.getQuery(params)
      })
    };

    const response = await fetch(config.subgraph.local, options)
      .then(res => res.json())

    return response.data.pixels;
  }

  getQuery(params) { 
    return `{ pixels(first: ${params.first}) { id owner price } }`
  };
}