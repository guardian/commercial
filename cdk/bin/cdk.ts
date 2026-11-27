import { GuRoot } from "@guardian/cdk/lib/constructs/root";
import { CommercialInfra } from "../lib/commercialInfra";

const cdkApp = new GuRoot();

export const commercialDevelopmentInfra = new CommercialInfra(
  cdkApp,
  "CommercialDevelopmentInfra",
  {
    stack: "frontend",
    stage: "INFRA"
  }
)