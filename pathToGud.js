import path from 'node:path';

export const getPathToGud = () => path.join(process.cwd(), '.gud');