<script lang="ts">
  import { onMount } from "svelte";
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  const session = authClient.useSession();

  onMount(() => {
    if ($session.data) {
      goto("/todos");
    } else {
      goto("/todos/login");
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="text-center">
    <p class="text-gray-600">Redirecting...</p>
  </div>
</div>
