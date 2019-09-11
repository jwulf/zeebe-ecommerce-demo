const brokerConfig = {
  cloud: {
    camundaCloud: {
      clusterId: "put-your-cluster-id-here",
      clientId: "put-your-client-id-here",
      clientSecret: "put-your-client-secret-here"
    }
  },
  local: {
    host: "localhost"
  }
};

const profile =
  process.env.PROFILE === "CLOUD" ? brokerConfig.cloud : brokerConfig.local;
export default profile;
