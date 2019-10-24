const brokerConfig = {
  cloud: {
    camundaCloud: {
      clusterId: "a45a387d-4b99-474e-b7e7-43df0b256801",
      clientId: "sp1ehLVZmbK4EjDKButmhE7EsrU56dWd",
      clientSecret:
        "ZBFmLxoKqIAzet-pPM2BmQ3ubfvaOB7501CJLt7AWFqvO4r4Efww6WK0bR5pf4g8"
    }
  },
  local: {
    host: "localhost"
  }
};

const profile =
  process.env.PROFILE === "CLOUD" ? brokerConfig.cloud : brokerConfig.local;
export default profile;
