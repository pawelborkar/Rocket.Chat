import type { ISubscription } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { subscriptionFields } from '../../../lib/publishFields';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'subscriptions/get'(updatedAt?: Date): ISubscription[] | { update: ISubscription[]; remove: { _id: string; _deletedAt: Date }[] };
	}
}

Meteor.methods<ServerMethods>({
	async 'subscriptions/get'(updatedAt, limit = 1000, skip = 0) {
		const uid = Meteor.userId();
		if (!uid) {
			return [];
		}

		const options = { projection: subscriptionFields, limit, skip };

		const records: ISubscription[] = await Subscriptions.findByUserId(uid, options).toArray();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter((record) => {
					return record._updatedAt > updatedAt;
				}),
				remove: await Subscriptions.trashFindDeletedAfter(
					updatedAt,
					{
						'u._id': uid,
					},
					{
						projection: {
							_id: 1,
							_deletedAt: 1,
						},
					},
				).toArray(),
			};
		}

		return records;
	},
});
