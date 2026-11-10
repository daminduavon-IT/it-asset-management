/** What a new password must satisfy. Shown as a live checklist and checked again before saving. */
export const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
    { label: 'At least 12 characters', test: password => password.length >= 12 },
    { label: 'An uppercase and a lowercase letter', test: password => /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'A number', test: password => /[0-9]/.test(password) },
];

export const meetsPasswordRules = (password: string) => PASSWORD_RULES.every(rule => rule.test(password));

// No look-alike characters (0/O, 1/l/I), so a password can be read out or copied from paper
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** A random password that meets the rules, in four groups of four so it is easy to read out and type. */
export const generatePassword = (): string => {
    for (;;) {
        const chars = Array.from(crypto.getRandomValues(new Uint32Array(16)), value => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]);
        const password = [0, 4, 8, 12].map(start => chars.slice(start, start + 4).join('')).join('-');
        if (meetsPasswordRules(password)) return password;
    }
};
