/**
 * Module returning the GraphQL schema for the user management API.
 * @module jobs/RemoveOutdatedSessions
 */
import Agenda from 'agenda';
import Session from '../model/SessionModel'
export const JOB_NAME = 'remove outdated sessions';
/**
 * Define job type of sending an email in the Agenda process queue.
 * @param  {Agenda} agenda
 * @returns {void}
 */
export default function (agenda: Agenda): void {
    agenda.define(JOB_NAME, async () => {
        await Session.removeAllOutdatedSessions();
    });
}