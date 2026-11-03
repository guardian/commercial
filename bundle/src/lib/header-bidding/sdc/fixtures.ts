import type { sdc } from './sdc';

const tracking = {
	abTestName: 'inline1-admin-test',
	abTestVariant: 'selected-variant',
	campaignCode: 'inline1-admin-test-selected-variant',
	componentType: 'ACQUISITIONS_OTHER' as const,
};

export const inline1Response: Awaited<ReturnType<typeof sdc.getInline1Data>> = {
	data: {
		module: {
			name: 'Inline1',
			props: {
				variant: {
					name: 'selected-variant',
					message: {
						type: 'Inline1SupportMessage',
						heading: 'Heading from the admin test',
						body: 'Body from the selected SDC variant',
						primaryCta: {
							text: 'Subscribe',
							baseUrl: 'https://support.theguardian.com',
						},
					},
				},
				tracking: {
					...tracking,
					ophanPageId: 'test-page',
					platformId: 'GUARDIAN_WEB',
					referrerUrl: '',
				},
			},
		},
		meta: tracking,
	},
};
