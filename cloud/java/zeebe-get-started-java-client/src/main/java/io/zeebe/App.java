package io.zeebe;

import io.zeebe.client.ZeebeClient;
import io.zeebe.client.api.response.Topology;
import io.zeebe.client.CredentialsProvider
import io.zeebe.client.impl.oauth.OAuthCredentialsProviderBuilder;
import io.zeebe.client.impl.oauth.OAuthCredentialsProvider;
import io.zeebe.client.api.response.ActivatedJob;
import io.zeebe.client.api.worker.JobClient;
import io.zeebe.client.api.worker.JobHandler;

import java.time.Duration;
import java.util.Scanner;

/**
 * Hello world!
 */
public class App {
    public static void main(String[] args) {
        final String clusterUUID = System.getenv("CC_CLUSTER_UUID");
        final String baseUrl = System.getenv("CC_BASE_URL");
        final String clientId = System.getenv("ZEEBE_CLIENT_ID");
        final String clientSecret = System.getenv("ZEEBE_CLIENT_SECRET");
        final String authUrl = "https://login.cloud.camunda.io/oauth/token";

        final OAuthCredentialsProviderBuilder c = new OAuthCredentialsProviderBuilder();
        final OAuthCredentialsProvider cred = c.audience(clusterUUID + "." + baseUrl).clientId(clientId)
                .clientSecret(clientSecret).authorizationServerUrl(authUrl).build();

        final String broker = clusterUUID + "." + baseUrl + ":443";

        final ZeebeClient client = ZeebeClient.newClientBuilder()
                // change the contact point if needed
                .brokerContactPoint(broker)
                .credentialsProvider(cred)
                .build();

        System.out.println("Connected.");

        final Topology topology = client.newTopologyRequest().send().join();

        System.out.println("Topology:");
        topology
                .getBrokers()
                .forEach(
                        b -> {
                            System.out.println("    " + b.getAddress());
                            b.getPartitions()
                                    .forEach(
                                            p ->
                                                    System.out.println(
                                                            "      " + p.getPartitionId() + " - " + p.getRole()));
                        });

        client
                .newWorker()
                .jobType("check-inventory")
                .handler(new CheckInventoryHandler())
                .timeout(Duration.ofSeconds(10))
                .open();

        client
                .newWorker()
                .jobType("decrement-stock")
                .handler(new DecrementInventoryHandler())
                .timeout(Duration.ofSeconds(10))
                .open();

        client
                .newWorker()
                .jobType("collect-payment")
                .handler(new CollectPaymentHandler())
                .timeout(Duration.ofSeconds(10))
                .open();

        client
                .newWorker()
                .jobType("ship-items")
                .handler(new ShipProductHandler())
                .timeout(Duration.ofSeconds(10))
                .open();
        // run until System.in receives exit command
        waitUntilSystemInput();
    }

    private static class CheckInventoryHandler implements JobHandler {
        @Override
        public void handle(final JobClient client, final ActivatedJob job) {
            // here: business logic that is executed with every job
            final Order order = job.getVariablesAsType(Order.class);

            order.setOperation_success(true);

            System.out.println(order.getProduct() + " in stock for " + order.getName());
            client.newCompleteCommand(job.getKey()).variables(order).send().join();
        }
    }

    private static class DecrementInventoryHandler implements JobHandler {
        @Override
        public void handle(final JobClient client, final ActivatedJob job) {
            // here: business logic that is executed with every job
            final Order order = job.getVariablesAsType(Order.class);

            order.setOperation_success(true);

            System.out.println(order.getProduct() + " decrement stock " + order.getName());
            client.newCompleteCommand(job.getKey()).variables(order).send().join();
        }
    }

    private static class CollectPaymentHandler implements JobHandler {
        @Override
        public void handle(final JobClient client, final ActivatedJob job) {
            // here: business logic that is executed with every job
            final Order order = job.getVariablesAsType(Order.class);

            order.setOperation_success(true);

            System.out.println(" Successfully charged " + order.getName());
            client.newCompleteCommand(job.getKey()).variables(order).send().join();
        }
    }

    private static class ShipProductHandler implements JobHandler {
        @Override
        public void handle(final JobClient client, final ActivatedJob job) {
            // here: business logic that is executed with every job
            final Order order = job.getVariablesAsType(Order.class);

            order.setOperation_success(true);
            order.setOutcome_message("Shipped " + order.getProduct() + " to " + order.getName());

            System.out.println(order.getProduct() + " shipped to " + order.getName());
            client.newCompleteCommand(job.getKey()).variables(order).send().join();
        }
    }

    public static class Order {
        private String product;
        private String name;
        private String creditcard;
        private boolean operation_success;
        private String outcome_message;

        String getProduct() {
            return product;
        }

        public void setProduct(final String product) {
            this.product = product;
        }

        public String getName() {
            return name;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public String getCreditcard() {
            return creditcard;
        }

        public void setCreditcard(final String creditcard) {
            this.creditcard = creditcard;
        }

        public boolean getOperation_success() {
            return operation_success;
        }

        public void setOperation_success(final boolean operation_success) {
            this.operation_success = operation_success;
        }

        public String getOutcome_message() {
            return outcome_message;
        }

        public void setOutcome_message(final String operation_outcome) {
            this.outcome_message = operation_outcome;
        }
    }

    private static void waitUntilSystemInput() {
        try (Scanner scanner = new Scanner(System.in)) {
            while (scanner.hasNextLine()) {
                final String nextLine = scanner.nextLine();
                if (nextLine.contains("exit")) {
                    return;
                }
            }
        }
    }
}
