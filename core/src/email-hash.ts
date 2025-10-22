import { createHash } from 'crypto';

function hashEmailForId5(email: string) {
    return createHash('SHA256').update(email, 'utf8').digest('hex');
}

export { hashEmailForId5 };
