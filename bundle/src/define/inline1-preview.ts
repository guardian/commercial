const renderedPreviews = new WeakSet<HTMLElement>();

export const renderInline1Preview = (element: HTMLElement): boolean => {
	if (
		element.id !== 'dfp-ad--inline1' ||
		new URLSearchParams(window.location.search).get('simulate-inline1') !==
			'true'
	) {
		return false;
	}

	if (renderedPreviews.has(element)) {
		return true;
	}

	renderedPreviews.add(element);
	element.classList.add('ad-slot--rendered');
	element.dispatchEvent(
		new CustomEvent('commercial.sdc-render', {
			detail: {
				props: {
					variant: {
						name: 'control',
						message: {
							type: 'Inline1SupportMessage',
							heading: 'Support fearless, independent journalism',
							body: 'Please subscribe for unlimited access to our award-winning app and support the Guardian’s independent journalism.',
							primaryCta: {
								text: 'Support us',
								baseUrl: '',
							},
						},
					},
				},
			},
			bubbles: true,
		}),
	);
	return true;
};
