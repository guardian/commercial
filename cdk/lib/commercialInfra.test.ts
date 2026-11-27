import { Template } from 'aws-cdk-lib/assertions';
import { CommercialInfra } from './commercialInfra';
import { App } from 'aws-cdk-lib';

describe('The CommercialInfra stack', () => {
  it('matches the snapshot', () => {
    const app = new App();
    const stack = new CommercialInfra(app, 'CommercialInfra', {
      stack: 'frontend',
      stage: 'INFRA',
      env: { region: 'eu-west-1' }
    })

    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  },
  );
})