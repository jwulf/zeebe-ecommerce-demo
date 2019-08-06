# Zeebe Ecommerce Demo

This is the "TODO app" of Zeebe demos: an ecommerce flow.

- Install dependencies with `npm i && npm i -g ts-node typescript`.
- Use the `operate` profile of [zeebe-docker-compose](https://github.com/zeebe-io/zeebe-docker-compose) to start the broker.
- Start the REST server: `cd rest-server && ts-node index.ts`
- Start each of the microservices in a separate terminal.

The webstore is running on localhost:3000/shop. It's a dummy at the moment, and the client API requests are emulated in `rest-client`.

Operate is running on [http://localhost:8080](http://localhost:8080). Login is demo/demo.

Experiment with making orders, with all microservices running, and with various ones in a failure state.

