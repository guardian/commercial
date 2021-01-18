import { dfpEnv } from '../dfp/dfp-env';

const getAdvertById = (id) =>
	id in dfpEnv.advertIds ? dfpEnv.adverts[dfpEnv.advertIds[id]] : null;

export { getAdvertById };
