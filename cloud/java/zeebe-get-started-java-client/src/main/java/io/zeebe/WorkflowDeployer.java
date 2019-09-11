package io.zeebe;

/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Zeebe Community License 1.0. You may not use this file
 * except in compliance with the Zeebe Community License 1.0.
 */

import io.zeebe.client.ZeebeClient;
import io.zeebe.client.ZeebeClientBuilder;
import io.zeebe.client.api.response.DeploymentEvent;
import io.zeebe.client.impl.OAuthCredentialsProvider;
import io.zeebe.client.impl.OAuthCredentialsProviderBuilder;

public class WorkflowDeployer {

    public static void main(final String[] args) {

        // The following ENV VARS have to be set before:

        final String clusterUUID = System.getenv("CC_CLUSTER_UUID");
        final String baseUrl = System.getenv("CC_BASE_URL");
        final String clientId = System.getenv("CC_CLIENT_ID");
        final String clientSecret = System.getenv("CC_CLIENT_SECRET");
        final String authUrl = System.getenv("CC_AUTH_URL");

        System.out.println("\n\n========================================================================");
        System.out.println("Deploying workflow for cluster " + clusterUUID);

        final String broker = clusterUUID + "." + baseUrl + ":443";

        final OAuthCredentialsProviderBuilder c = new OAuthCredentialsProviderBuilder();
        final OAuthCredentialsProvider cred = c.audience(clusterUUID + "." + baseUrl).clientId(clientId)
                .clientSecret(clientSecret).authorizationServerUrl(authUrl).build();

        final ZeebeClientBuilder clientBuilder = ZeebeClient.newClientBuilder().brokerContactPoint(broker)
                .credentialsProvider(cred);

        try (ZeebeClient client = clientBuilder.build()) {

            final DeploymentEvent deploymentEvent = client.newDeployCommand().addResourceFromClasspath("createGithubIssue.bpmn")
                    .send().join();

            System.out.println("Deployment created with key: " + deploymentEvent.getKey());
            System.out.println("========================================================================\n\n");
        }
    }
}