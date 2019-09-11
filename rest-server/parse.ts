const ZB = require("zeebe-node");

const workflowFile = "./bpmn/purchase.bpmn";
(async () => {
  console.log(await ZB.BpmnParser.scaffold(workflowFile));
})();
