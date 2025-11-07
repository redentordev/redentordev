<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import { authClient } from '$lib/auth-client';
  
  export let data: PageData;
  export let form;
  
  let newTodoTitle = '';
  let isSubmitting = false;
  
  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = '/';
  }
</script>

<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">My Todos</h1>
          <p class="text-sm text-gray-500 mt-1">Welcome, {data.user?.email}</p>
        </div>
        <button
          on:click={handleSignOut}
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
      
      <!-- Add Todo Form -->
      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            newTodoTitle = '';
            isSubmitting = false;
            await update();
          };
        }}
        class="flex gap-2"
      >
        <input
          type="text"
          name="title"
          bind:value={newTodoTitle}
          placeholder="Add a new todo..."
          required
          disabled={isSubmitting}
          class="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newTodoTitle.trim()}
          class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Add'}
        </button>
      </form>
      
      {#if form?.error}
        <div class="mt-2 text-sm text-red-600">{form.error}</div>
      {/if}
    </div>
    
    <!-- Todos List -->
    <div class="bg-white shadow rounded-lg">
      {#if data.todos && data.todos.length > 0}
        <ul class="divide-y divide-gray-200">
          {#each data.todos as todo (todo.id)}
            <li class="p-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-3">
                <!-- Toggle Checkbox -->
                <form
                  method="POST"
                  action="?/toggle"
                  use:enhance
                  class="flex-shrink-0"
                >
                  <input type="hidden" name="id" value={todo.id} />
                  <button
                    type="submit"
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
                </form>
                
                <!-- Todo Title -->
                <span
                  class="flex-1 text-gray-900 {todo.completed
                    ? 'line-through text-gray-500'
                    : ''}"
                >
                  {todo.title}
                </span>
                
                <!-- Delete Button -->
                <form
                  method="POST"
                  action="?/delete"
                  use:enhance
                  class="flex-shrink-0"
                >
                  <input type="hidden" name="id" value={todo.id} />
                  <button
                    type="submit"
                    class="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded p-1"
                    aria-label="Delete todo"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </form>
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
    {#if data.todos && data.todos.length > 0}
      <div class="mt-4 text-center text-sm text-gray-500">
        {data.todos.filter(t => t.completed).length} of {data.todos.length} completed
      </div>
    {/if}
  </div>
</div>

