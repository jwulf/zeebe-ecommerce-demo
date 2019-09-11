# Zeebe Ecommerce Demo

This is the "TODO app" of Zeebe demos: an ecommerce flow.

- Install dependencies with `npm i && npm i -g ts-node typescript`.
- Use the `operate` profile of [zeebe-docker-compose](https://github.com/zeebe-io/zeebe-docker-compose) to start the broker.
- Start the REST server: `cd rest-server && ts-node index.ts`
- Start each of the microservices in a separate terminal.

The webstore is running on localhost:3000/shop. It's a dummy at the moment, and the client API requests are emulated in `rest-client`.

Operate is running on [http://localhost:8080](http://localhost:8080). Login is demo/demo.

Experiment with making orders, with all microservices running, and with various ones in a failure state.

curl --request POST \
  --url https://login.cloud.[ultrawombat.com | camunda.io]/oauth/token \
  --header 'content-type: application/json' \
  --data '{"client_id":"${clientId}","client_secret":"${clientSecret}","audience":"${audience}","grant_type":"client_credentials"}'


  curl --request POST --url https://login.cloud.ultrawombat.com/oauth/token --header 'content-type: application/json' --data '{"client_id":"YaNx4Qf0uQSBcPDW9qQk6Q4SZaRUA7SK","client_secret":"llKhkB_r7PsfnaWnQVDbdU9aXPAIjhTKiqLwsAySZI6XRgcs0pHofCBqT1j54amF","audience":"817d8be9-25e2-42f1-81b8-c8cfbd2adb75.zeebe.ultrawombat.com","grant_type":"client_credentials"}'