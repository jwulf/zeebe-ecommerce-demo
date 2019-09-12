# Zeebe Ecommerce Demo

This is the "TODO app" of Zeebe demos: an ecommerce flow.

- Install dependencies with `npm i && npm i -g ts-node typescript`.
- Use the `operate` profile of [zeebe-docker-compose](https://github.com/zeebe-io/zeebe-docker-compose) to start the broker.
- Start the REST server: `cd rest-server && ts-node index.ts`
- Start each of the microservices in a separate terminal:
```
cd microservices
npm run inventory
npm run payments
npm run ships
```

There are Java workers in the `cloud/java/zeebe-get-started-java-client` directory.

The webstore is running on localhost:3000/shop. It's a dummy at the moment, and the client API requests are emulated in `rest-client`.

Operate is running on [http://localhost:8080](http://localhost:8080). Login is demo/demo.

Experiment with making orders, with all microservices running, and with various ones in a failure state.

## Run on Camunda Cloud

To run on Camunda Cloud:

* Get an account in the closed beta [here](https://zeebe.io/cloud/).
* Create a new Zeebe cluster.
* Create a new client in the console.
* Put your credentials in the `zeebe-broker-config.ts` file.
* Run each Node microservice component with this in front of the command to start it: `PROFILE=CLOUD`, for example: `cd microservices & PROFILE=CLOUD npm run inventory`
* See the README in the `cloud/java/zeebe-get-started-java-client` directory for instructions on starting the Java microservice workers.