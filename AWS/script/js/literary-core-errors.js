export class LiteraryFriendError extends Error {
  constructor(message, { code='APP_ERROR', status=0, details=null, cause }={}) {
    super(message, { cause }); this.name='LiteraryFriendError'; this.code=code; this.status=status; this.details=details;
  }
}
export function normalizeError(error, fallback='Something went wrong.') {
  if (error instanceof LiteraryFriendError) return error;
  return new LiteraryFriendError(error?.message || fallback, { code:error?.code || 'APP_ERROR', status:error?.status || 0, details:error?.details, cause:error });
}
export function userMessage(error) {
  const e=normalizeError(error);
  const map={AUTH_REQUIRED:'Please sign in again.',SESSION_INVALID:'Your session has ended. Please sign in again.',NETWORK_ERROR:'AWS could not reach the service. Check your connection and retry.',PROJECT_NOT_FOUND:'That project is unavailable.',RESET_INVALID:'That reset code is invalid or expired.',AI_NOT_CONFIGURED:'AI service is not configured. Local reference assistance is still available.'};
  return map[e.code] || e.message;
}
