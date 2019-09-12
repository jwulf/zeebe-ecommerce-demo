# Zeebe E-commerce demo Java

This project demonstrates writing Zeebe workers in Java that connect to the Zeebe Service in the Camunda Cloud.

## Compile

Run `mvn package`.

## Run

You will need your Camunda Cloud Zeebe Cluster credentials.

Set the following environment variables to configure the workers to connect to the cloud. Get the values from your Camunda Cloud console.

```bash
ZEEBE_ADDRESS=<Zeebe ContactPoint> 
ZEEBE_TOKEN_AUDIENCE=<Zeebe ContactPoint without port> 
ZEEBE_CLIENT_ID=<clientId> 
ZEEBE_CLIENT_SECRET=<clientSecret> 
```

Then run:

```bash
java -jar target/zeebe-get-started-java-client-1.0-SNAPSHOT.jar     
```