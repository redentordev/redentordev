<script lang="ts">
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { authClient } from '$lib/auth-client';

  let { data } = $props();
  console.log("data", data);
  const queryClient = useQueryClient();

  // Query to fetch todos
  const todosQuery = createQuery(() => ({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to fetch todos');
      return response.json();
    },
    initialData: data.todos,
    staleTime: 1000 * 60 * 5, // 5 minutes
  }));

  // Use $derived to make todos reactive - this ensures Svelte 5 reactivity
  const todos = $derived(todosQuery.data ?? []);
  const isLoading = $derived(todosQuery.isLoading);
  const isError = $derived(todosQuery.isError);
  const error = $derived(todosQuery.error);

  // Mutation to create a todo with optimistic update
  const createTodoMutation = createMutation(() => ({
    mutationFn: async (title: string) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create todo');
      }
      return response.json();
    },
    // Optimistic update - immediately add todo to the list
    onMutate: async (title: string) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData(['todos']);

      // Optimistically update the cache
      const optimisticTodo = {
        id: `temp-${Date.now()}`,
        title: title.trim(),
        completed: false,
        userId: data.user?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['todos'], (old: typeof previousTodos) => {
        return old ? [optimisticTodo, ...old] : [optimisticTodo];
      });

      // Return context with snapshot for rollback
      return { previousTodos };
    },
    // If mutation fails, rollback to previous state
    onError: (error, title, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
    },
    // Update cache with server response on success
    onSuccess: (newTodo) => {
      queryClient.setQueryData(['todos'], (old: any) => {
        if (!old) return [newTodo];
        // Replace optimistic todo with real one from server
        return [newTodo, ...old.filter((todo: any) => !todo.id.startsWith('temp-'))];
      });
    },
  }));

  // Mutation to toggle todo with optimistic update
  const toggleTodoMutation = createMutation(() => ({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to toggle todo');
      }
      return response.json();
    },
    // Optimistic update - immediately toggle the todo
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData(['todos']);

      // Optimistically update the cache
      queryClient.setQueryData(['todos'], (old: typeof previousTodos) => {
        if (!old) return old;
        return old.map((todo: any) =>
          todo.id === id
            ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() }
            : todo
        );
      });

      return { previousTodos };
    },
    onError: (error, id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
    },
    // Update cache with server response on success
    onSuccess: (updatedTodo) => {
      queryClient.setQueryData(['todos'], (old: any) => {
        if (!old) return [updatedTodo];
        return old.map((todo: any) => (todo.id === updatedTodo.id ? updatedTodo : todo));
      });
    },
  }));

  // Mutation to delete todo with optimistic update
  const deleteTodoMutation = createMutation(() => ({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete todo');
      }
      return response.json();
    },
    // Optimistic update - immediately remove the todo
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData(['todos']);

      // Optimistically update the cache
      queryClient.setQueryData(['todos'], (old: typeof previousTodos) => {
        if (!old) return old;
        return old.filter((todo: any) => todo.id !== id);
      });

      return { previousTodos };
    },
    onError: (error, id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
    },
    // No need to update cache on success since we already removed it optimistically
    onSuccess: () => {
      // Mark as invalid but don't refetch
      queryClient.invalidateQueries({ queryKey: ['todos'], refetchType: 'none' });
    },
  }));

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = '/';
  }

  function handleCreateTodo(e: SubmitEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const title = formData.get('title')?.toString().trim();

    if (!title) return;

    // Reset form immediately - optimistic update will show the todo right away
    form.reset();

    // Use mutate() instead of mutateAsync() - non-blocking, fire-and-forget
    createTodoMutation.mutate(title, {
      onError: (error) => {
        console.error('Failed to create todo:', error);
        // Optionally restore the form value on error
        // form.querySelector('input[name="title"]').value = title;
      },
    });
  }

  function handleToggle(id: string) {
    // Use mutate() instead of mutateAsync() - non-blocking
    toggleTodoMutation.mutate(id, {
      onError: (error) => {
        console.error('Failed to toggle todo:', error);
      },
    });
  }

  function handleDelete(id: string) {
    // Use mutate() instead of mutateAsync() - non-blocking
    deleteTodoMutation.mutate(id, {
      onError: (error) => {
        console.error('Failed to delete todo:', error);
      },
    });
  }
</script>

<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">My Todos</h1>
          <p class="text-sm text-gray-500 mt-1">Welcome, {data.user.email}</p>
        </div>
        <button
          onclick={handleSignOut}
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
      
      <!-- Add Todo Form -->
      <form onsubmit={handleCreateTodo} class="flex gap-2">
        <label class="flex-1">
          <input
            type="text"
            name="title"
            placeholder="Add a new todo..."
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </label>
        <button
          type="submit"
          class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add
        </button>
      </form>
      
      {#if createTodoMutation.isError}
        <div class="mt-2 text-sm text-red-600">
          {createTodoMutation.error?.message || 'Failed to create todo'}
        </div>
      {/if}
    </div>
    
    <!-- Todos List -->
    <div class="bg-white shadow rounded-lg">
      {#if isLoading}
        <div class="p-12 text-center">
          <p class="text-gray-500">Loading todos...</p>
        </div>
      {:else if isError}
        <div class="p-12 text-center">
          <p class="text-red-600">Error: {error?.message || 'Failed to load todos'}</p>
        </div>
      {:else if todos && todos.length > 0}
        <ul class="divide-y divide-gray-200">
          {#each todos as todo (todo.id)}
            <li class="p-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-3">
                <!-- Toggle Checkbox -->
                <button
                  onclick={() => handleToggle(todo.id)}
                  class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors {todo.completed
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'border-gray-300 hover:border-indigo-400'}"
                  aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {#if todo.completed}
                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  {/if}
                </button>
                
                <!-- Todo Title -->
                <span
                  class="flex-1 text-gray-900 {todo.completed
                    ? 'line-through text-gray-500'
                    : ''}"
                >
                  {todo.title}
                </span>
                
                <!-- Delete Button -->
                <button
                  onclick={() => handleDelete(todo.id)}
                  class="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded p-1"
                  aria-label="Delete todo"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No todos</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by creating a new todo above.</p>
        </div>
      {/if}
    </div>
    
    <!-- Stats -->
    {#if todos && todos.length > 0}
      <div class="mt-4 text-center text-sm text-gray-500">
        {todos.filter(t => t.completed).length} of {todos.length} completed
      </div>
    {/if}
  </div>
</div>
