

/**
 * Exibe um log no console apenas em ambiente de desenvolvimento.
 * @param label  
 * @param data 
 */
export function devLog(label: string, data: any) {
  if (import.meta.env.DEV) {
    console.log(`[DEBUG] ${label}:`, data);
  }
}