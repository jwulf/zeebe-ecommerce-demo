const brokerConfig = {
  cloud: {
    camundaCloud: {
      clusterId: "1cadb038-fcd7-41eb-976d-36cd8eaa068c",
      clientId: "fEzXbdt8XO0amTJTXJ9N6q9BtUSx78ld",
      clientSecret:
        "si9Wq8ef7d_vM1LCpxkiaHXQqXAYc1r_11G8KxIa_9Hgcx4fWVepcaAyJKEFEpUI"
    }
  },
  local: {
    host: "localhost"
  }
};

const profile =
  process.env.PROFILE === "CLOUD" ? brokerConfig.cloud : brokerConfig.local;
export default profile;
