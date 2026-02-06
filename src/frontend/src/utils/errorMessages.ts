/**
 * Converts unknown errors (including BigInt conversion errors and backend rejections)
 * into sanitized, user-friendly English messages suitable for UI display.
 */
export function formatErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;

    // BigInt conversion errors
    if (message.includes('BigInt') || message.includes('Cannot convert')) {
      return 'Invalid number format. Please enter whole numbers only (no decimals).';
    }

    // Authorization errors
    if (message.includes('Unauthorized') || message.includes('not authorized')) {
      return 'Unauthorized. Please sign in again.';
    }

    // Actor not available
    if (message.includes('Actor not available')) {
      return 'Connection error. Please refresh the page and try again.';
    }

    // Entry not found
    if (message.includes('Entry not found') || message.includes('not found')) {
      return 'Entry not found. It may have been deleted.';
    }

    // Ownership errors
    if (message.includes('do not own')) {
      return 'You do not have permission to modify this entry.';
    }

    // Confirmation errors
    if (message.includes('Confirmation') || message.includes('does not match')) {
      return 'Confirmation failed. Please check your input and try again.';
    }

    // Return the original message if it's user-friendly (no stack traces)
    if (!message.includes('at ') && !message.includes('Error:') && message.length < 200) {
      return message;
    }

    // Generic error for other cases
    return 'Could not save entry. Please try again.';
  }

  // Handle string errors
  if (typeof error === 'string') {
    if (error.includes('Unauthorized') || error.includes('not authorized')) {
      return 'Unauthorized. Please sign in again.';
    }
    return error.length < 200 ? error : 'An error occurred. Please try again.';
  }

  // Handle objects with message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return formatErrorMessage((error as { message: unknown }).message);
  }

  // Fallback
  return 'An unexpected error occurred. Please try again.';
}
