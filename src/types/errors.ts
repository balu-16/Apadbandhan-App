// Shared type definitions for error handling and common interfaces

/**
 * Type-safe error interface for Axios-like errors
 * Use this instead of defining local interfaces in each file
 */
export interface AxiosErrorLike {
    response?: {
        data?: {
            message?: string | string[];
        };
        status?: number;
    };
    message?: string;
}

/**
 * Helper function to extract error message from AxiosErrorLike
 */
export const getErrorMessage = (error: unknown): string => {
    const err = error as AxiosErrorLike;
    if (err.response?.data?.message) {
        const msg = err.response.data.message;
        return Array.isArray(msg) ? msg.join(', ') : String(msg);
    }
    return err.message || 'An unexpected error occurred';
};
