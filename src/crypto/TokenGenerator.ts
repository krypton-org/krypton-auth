/**
 * Module defining a function to generate tokens
 * @module crypto/TokenGenerator
 */
import crypto from 'crypto';
/**
 * Return a token of size `tokenLength`.
 * @param  {number} tokenLength
 * @returns {string} token generated
 */
export default function generateToken(tokenLength: number): string {
    return crypto.randomBytes(tokenLength).toString('hex');
}
