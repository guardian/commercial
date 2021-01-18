import { waitForAdvert } from '../dfp/wait-for-advert';

export const trackAdRender = (id) =>
	waitForAdvert(id).then((_) => _.whenRendered);
