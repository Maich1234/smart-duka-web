/** Browser offline support is deferred: reads must fail visibly, not pause forever. */
export const queryReadPolicy = { networkMode: 'always' as const, retry: false as const };
