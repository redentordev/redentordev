<script lang="ts">
	import "../app.css";
	import { browser } from '$app/environment';
	import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/svelte-query';

	let { children } = $props();

	// Configure MutationCache with global callbacks
	const mutationCache = new MutationCache({
		onError: (error, variables, context, mutation) => {
			console.error('Mutation error:', error);
			// You could add global error handling here, like showing a toast notification
		},
		onSuccess: (data, variables, context, mutation) => {
			console.log('Mutation success:', data);
		},
		onSettled: (data, error, variables, context, mutation) => {
			// Called after mutation is settled (success or error)
			if (error) {
				console.error('Mutation settled with error:', error);
			}
		},
	});

	const queryClient = new QueryClient({
		mutationCache,
		defaultOptions: {
			queries: {
				enabled: browser,
				staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
				gcTime: 1000 * 60 * 10, // 10 minutes - cache garbage collection time (formerly cacheTime)
				refetchOnWindowFocus: false, // Don't refetch on window focus
				retry: 1, // Retry failed requests once
			},
			mutations: {
				retry: 1, // Retry failed mutations once
			},
		},
	});
</script>

<QueryClientProvider client={queryClient}>
	{@render children()}
</QueryClientProvider>
