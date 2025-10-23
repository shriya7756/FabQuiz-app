// Supabase has been replaced with MongoDB + Express API
// This is a stub file to prevent import errors
// Please use the API from @/lib/api instead

export const supabase = {
  // Stub to prevent errors
  from: () => {
    console.warn('Supabase client is deprecated. Use API from @/lib/api instead');
    return {
      select: () => ({}),
      insert: () => ({}),
      update: () => ({}),
      delete: () => ({}),
    };
  },
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    updateUser: async () => ({ data: null, error: null }),
  },
  channel: () => ({
    on: () => ({}),
    subscribe: () => ({}),
  }),
  removeChannel: () => {},
};