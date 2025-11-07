<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  
  const session = authClient.useSession();
  
  let email = "";
  let errorMessage = "";
  let successMessage = "";
  let isSubmitting = false;
  
  // Redirect if already signed in
  onMount(() => {
    if ($session.data) {
      goto("/todos");
    }
  });
  
  async function handleMagicLink() {
    errorMessage = "";
    successMessage = "";
    isSubmitting = true;
    
    try {
      await authClient.signIn.magicLink({
        email,
        callbackURL: "/todos",
      });
      successMessage = "Magic link sent! Check your Telegram for the sign-in link.";
    } catch (error: any) {
      console.error("Auth error:", error);
      errorMessage = error?.message || "Failed to send magic link. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
    <div>
      <h2 class="text-center text-3xl font-extrabold text-gray-900">
        Sign In to Todos
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enter your email to receive a magic link
      </p>
    </div>
    
    <form on:submit|preventDefault={handleMagicLink} class="space-y-6">
      {#if errorMessage}
        <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p class="text-sm">{errorMessage}</p>
        </div>
      {/if}
      
      {#if successMessage}
        <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          <p class="text-sm">{successMessage}</p>
        </div>
      {/if}
      
      <div>
        <label for="email" class="sr-only">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          bind:value={email}
          placeholder="your@email.com"
          disabled={isSubmitting}
          class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting || !email.trim()}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send Magic Link"}
        </button>
      </div>
    </form>
  </div>
</div>

